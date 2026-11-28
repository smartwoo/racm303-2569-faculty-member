/* ==========================================================================
   RACM 303 (2569) — Live Case Discussion Classroom Engine (Rooms 1–6)
   Live Classroom Check-in, Real-Time Student Responses & Shared Countdown Timer
   Transports: MQTT over WSS (443/8084) + PeerJS WebRTC + BroadcastChannel
   Strict Confidentiality: Transmits ONLY room/timer/question IDs & student inputs
   ========================================================================== */
(function () {
  "use strict";

  const TOPIC_NS = "racm303/2569/hsd/v2";
  const BC_NAME = "racm303_hsd_live_v2";
  const PRESENCE_STORAGE_KEY = "racm303_live_presence_registry_v2";
  const LIVE_PRESENCE_TTL_MS = 75 * 1000; // 75s fallback TTL — keeps open background tabs online while explicit leave/LWT clears closed tabs in 0–1.2s
  const HEARTBEAT_INTERVAL_MS = 10 * 1000; // 10s unthrottled Web Worker room heartbeat
  const CHECKED_IN_MAX_AGE_MS = LIVE_PRESENCE_TTL_MS;
  const BROKERS = [
    "wss://mqtt.eclipseprojects.io:443/mqtt",
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt"
  ];

  // Unthrottled interval via inline Web Worker so open background tabs stay online like Google Docs
  function startBackgroundSafeInterval(fn, intervalMs) {
    if (typeof Worker === "function" && typeof Blob === "function" && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      try {
        const blob = new Blob(
          [`setInterval(function(){postMessage(1);},${Math.max(1000, Number(intervalMs) || 10000)});`],
          { type: "application/javascript" }
        );
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        worker.onmessage = () => {
          try {
            fn();
          } catch (_) {}
        };
        return worker;
      } catch (_) {}
    }
    return setInterval(fn, intervalMs);
  }

  const ROOM_DEFS = [
    { id: 1, name: "ห้องกลุ่ม 1", roomCode: "1C1-02", label: "ห้อง 1 · 1C1-02" },
    { id: 2, name: "ห้องกลุ่ม 2", roomCode: "1C1-03", label: "ห้อง 2 · 1C1-03" },
    { id: 3, name: "ห้องกลุ่ม 3", roomCode: "1C1-04", label: "ห้อง 3 · 1C1-04" },
    { id: 4, name: "ห้องกลุ่ม 4", roomCode: "1C1-05", label: "ห้อง 4 · 1C1-05" },
    { id: 5, name: "ห้องกลุ่ม 5", roomCode: "1C1-06", label: "ห้อง 5 · 1C1-06" },
    { id: 6, name: "ห้องกลุ่ม 6", roomCode: "1C1-07", label: "ห้อง 6 · 1C1-07" }
  ];

  const TEAM_DEFS = [
    { id: 1, name: "กลุ่ม 1", shortLabel: "ก.1" },
    { id: 2, name: "กลุ่ม 2", shortLabel: "ก.2" },
    { id: 3, name: "กลุ่ม 3", shortLabel: "ก.3" }
  ];

  function randomId(prefix) {
    return (
      (prefix || "m") +
      "_" +
      Math.random().toString(36).slice(2, 9) +
      Date.now().toString(36).slice(-4)
    );
  }

  function safeGetStorage(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? v : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeSetStorage(key, val) {
    try {
      if (val === null || val === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, val);
    } catch (_) {}
  }

  function safeGetSession(key, fallback) {
    try {
      const v = sessionStorage.getItem(key);
      return v !== null ? v : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeSetSession(key, val) {
    try {
      if (val === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, val);
    } catch (_) {}
  }

  function clampRoom(n) {
    const num = Number(n);
    return num >= 1 && num <= 6 ? Math.floor(num) : 1;
  }

  function normalizeModuleId(modStr) {
    const s = String(modStr || "").trim().toUpperCase();
    return /^HS[1-6]$/.test(s) ? s : "HS1";
  }

  function createFreshTimerObj() {
    return {
      seq: 0,
      running: false,
      hasStarted: false,
      hasConfigured: false,
      timedOutInCurrentRun: false,
      receivedLiveInSession: false,
      configuredDurationSec: 300,
      durationSec: 300,
      baseRemainingMs: 300000,
      anchorPerfNow: performance.now(),
      questionId: "",
      label: "จับเวลาอภิปรายกลุ่มย่อย",
      chimePlayedForSeq: -1,
      lastWallMs: 0
    };
  }

  function clampTeamOrZero(n) {
    const num = Number(n);
    return num >= 1 && num <= 3 ? Math.floor(num) : 0;
  }

  function clampTeam(n) {
    return clampTeamOrZero(n) || 1;
  }

  const clientInstanceId = randomId("cli");
  const persistentPid = (function () {
    let pid = safeGetStorage("racm303_live_pid_v1", "");
    if (!pid) {
      pid = randomId("stu");
      safeSetStorage("racm303_live_pid_v1", pid);
    }
    return pid;
  })();

  const seenMsgIds = new Set();
  function rememberMsgId(id) {
    if (!id) return false;
    if (seenMsgIds.has(id)) return true;
    seenMsgIds.add(id);
    if (seenMsgIds.size > 1200) {
      const first = seenMsgIds.values().next().value;
      seenMsgIds.delete(first);
    }
    return false;
  }

  const bootRoomAttr =
    (typeof document !== "undefined" && document.body && document.body.getAttribute("data-hsd-room")) || "";
  const bootModInit = normalizeModuleId(
    (typeof window !== "undefined" && window.RACM_HSD_ROOM_PAGE && window.RACM_HSD_ROOM_PAGE.module) ||
      safeGetStorage("racm303_hsd_deck_mod", "HS1")
  );

  const state = {
    role: window.PORTAL_ROLE === "faculty" ? "faculty" : "student",
    roomId: clampRoom(bootRoomAttr || safeGetStorage("racm303_live_room_v1", "1")),
    teamId: 0,
    participantId: persistentPid,
    sessionJoined: window.PORTAL_ROLE === "faculty",
    joinedRoomId: 0,
    studentId: "",
    shortNo: "",
    fullName: "",
    displayName: safeGetStorage("racm303_live_name_v1", ""),
    nickname: "",
    area: "",
    disc: 0,
    photoId: "",
    activeModule: bootModInit,
    activeQuestionId: "",
    joinedWallMs: 0,
    followTeacher: false,
    anonymousWall: true,
    soundMuted: safeGetStorage("racm303_live_mute_v1", "0") === "1",
    connectedTransports: new Set(),
    mqttClients: [],
    peer: null,
    peerConns: new Map(),
    hostConn: null,
    bc: null,

    // Per-(roomId, moduleId) isolated timer states ("1:HS1" .. "6:HS6")
    timersByScope: new Map(),

    // Teacher Active Question / Slide Pointer
    teacherPointer: {
      seq: 0,
      module: "",
      caseId: "",
      questionId: "",
      slideKind: "",
      splitOrient: "",
      forceSync: false,
      sentWallMs: 0
    },

    // Teacher-released Conceptualized Key Takeaway slides (room-scoped, hidden initially for students)
    unlockedConceptSummaries: {},

    // Responses: Map<questionId, Map<participantId, ResponseRecord>>
    responsesByQuestion: new Map(),
    clearedAtByQuestion: new Map(),

    // Multi-Room Presence Registry: Map<roomId (1..6), Map<sessionId, PresenceRecord>>
    presenceByRoom: new Map([
      [1, new Map()],
      [2, new Map()],
      [3, new Map()],
      [4, new Map()],
      [5, new Map()],
      [6, new Map()]
    ]),
    // Active room presence alias: Map<sessionId, PresenceRecord>
    presence: null
  };

  // Legacy check-in reset stubs (no auto/remote cache reset — pure Google Docs tab presence)
  try {
    localStorage.removeItem("racm303_live_checkin_reset_v1");
  } catch (_) {}

  function getRoomCheckinResetId() {
    return "";
  }

  function getRoomCheckinResetAt() {
    return 0;
  }

  function resolvePresenceSessionKey(recOrMsg) {
    if (!recOrMsg) return "";
    return String(
      recOrMsg.sessionId || recOrMsg.senderCli || recOrMsg.participantId || ""
    )
      .trim()
      .slice(0, 64);
  }

  function getRoomPresenceMap(roomIdOpt) {
    const r = clampRoom(roomIdOpt || state.roomId);
    let m = state.presenceByRoom.get(r);
    if (!m) {
      m = new Map();
      state.presenceByRoom.set(r, m);
    }
    return m;
  }

  state.presence = getRoomPresenceMap(state.roomId);

  function serializePresenceRecordForStorage(rec, rId, now) {
    const sKey = resolvePresenceSessionKey(rec) || String(rec.participantId || `sid_${rec.studentId}`).slice(0, 64);
    return {
      sessionId: sKey,
      participantId: String(rec.participantId || `sid_${rec.studentId}`).slice(0, 48),
      role: "student",
      joined: true,
      checkedIn: true,
      loginSynced: Boolean(rec.loginSynced),
      roomId: rId,
      teamId: clampTeamOrZero(rec.teamId),
      studentId: String(rec.studentId).slice(0, 16),
      shortNo: String(rec.shortNo || String(rec.studentId).slice(-3)).slice(0, 6),
      fullName: String(rec.fullName || "").slice(0, 80),
      nickname: String(rec.nickname || "").slice(0, 32),
      area: String(rec.area || "").slice(0, 40),
      disc: Number(rec.disc || rId) || rId,
      photoId: String(rec.photoId || "").slice(0, 40),
      activeModule: normalizeModuleId(rec.activeModule || state.activeModule || "HS1"),
      activeQuestionId: String(rec.activeQuestionId || "").slice(0, 32),
      name: String(rec.name || "").slice(0, 80),
      senderCli: String(rec.senderCli || sKey).slice(0, 64),
      joinedWallMs: Number(rec.joinedWallMs || now),
      lastSeenMs: Number(rec.lastSeenMs || now)
    };
  }

  function persistPresenceRegistryToStorage(removedSessionKeyOpt) {
    try {
      const now = Date.now();
      const removedKey = removedSessionKeyOpt ? String(removedSessionKeyOpt).trim() : "";
      let prevRooms = {};
      try {
        const prevRaw = safeGetStorage(PRESENCE_STORAGE_KEY, "");
        if (prevRaw) {
          const prevParsed = JSON.parse(prevRaw);
          if (prevParsed && prevParsed.rooms) prevRooms = prevParsed.rooms;
        }
      } catch (_) {}

      const snapshot = {};
      [1, 2, 3, 4, 5, 6].forEach((rId) => {
        const bySession = new Map();
        // Preserve fresh entries from sibling tabs in the same browser
        const prevList = Array.isArray(prevRooms[rId]) ? prevRooms[rId] : [];
        prevList.forEach((oldRec) => {
          if (!oldRec || !oldRec.studentId || oldRec.joined === false) return;
          const sKey = resolvePresenceSessionKey(oldRec);
          if (!sKey || sKey === clientInstanceId || (removedKey && sKey === removedKey)) return;
          const refMs = Number(oldRec.lastSeenMs || oldRec.joinedWallMs || 0);
          if (now - refMs > CHECKED_IN_MAX_AGE_MS) return;
          bySession.set(sKey, serializePresenceRecordForStorage(oldRec, rId, now));
        });

        // Overlay current tab's live presence map
        getRoomPresenceMap(rId).forEach((rec, mapKey) => {
          if (!rec || rec.role !== "student" || !rec.studentId || rec.joined === false) return;
          const sKey = resolvePresenceSessionKey(rec) || String(mapKey);
          if (!sKey || (removedKey && sKey === removedKey)) return;
          if (sKey === clientInstanceId && (!state.sessionJoined || state.joinedRoomId !== rId)) return;
          const refMs = Number(rec.lastSeenMs || rec.joinedWallMs || 0);
          if (now - refMs > CHECKED_IN_MAX_AGE_MS) return;
          const existing = bySession.get(sKey);
          if (!existing || (Number(rec.lastSeenMs) || 0) >= (Number(existing.lastSeenMs) || 0)) {
            bySession.set(sKey, serializePresenceRecordForStorage(rec, rId, now));
          }
        });

        const arr = Array.from(bySession.values());
        if (arr.length) snapshot[rId] = arr;
      });
      localStorage.setItem(
        PRESENCE_STORAGE_KEY,
        JSON.stringify({ updatedMs: now, rooms: snapshot })
      );
    } catch (_) {}
  }

  function hydratePresenceRegistryFromStorage(shouldEmit) {
    let changed = false;
    try {
      const raw = safeGetStorage(PRESENCE_STORAGE_KEY, "");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const roomsObj = (parsed && parsed.rooms) || {};
      const now = Date.now();
      const storageKeysByRoom = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set(), 6: new Set() };

      [1, 2, 3, 4, 5, 6].forEach((rId) => {
        const list = Array.isArray(roomsObj[rId]) ? roomsObj[rId] : [];
        const rMap = getRoomPresenceMap(rId);
        list.forEach((rec) => {
          if (!rec || !rec.studentId || rec.joined === false) return;
          const refMs = Number(rec.lastSeenMs || rec.joinedWallMs || 0);
          if (now - refMs > CHECKED_IN_MAX_AGE_MS) return;
          const sKey = resolvePresenceSessionKey(rec) || String(rec.participantId || `sid_${rec.studentId}`).slice(0, 64);
          storageKeysByRoom[rId].add(sKey);
          const prev = rMap.get(sKey);
          if (
            !prev ||
            (Number(rec.lastSeenMs) || 0) > (Number(prev.lastSeenMs) || 0) ||
            String(rec.activeModule || "") !== String(prev.activeModule || "") ||
            clampTeamOrZero(rec.teamId) !== clampTeamOrZero(prev.teamId)
          ) {
            rMap.set(
              sKey,
              Object.assign({}, prev || {}, rec, {
                sessionId: sKey,
                activeModule: normalizeModuleId(rec.activeModule || "HS1"),
                roomId: rId,
                joined: true,
                fromStorage: true
              })
            );
            changed = true;
          }
        });
        // Remove any storage-backed entry that left or expired in another tab
        rMap.forEach((existing, sKey) => {
          if (
            existing &&
            existing.role === "student" &&
            existing.fromStorage &&
            !storageKeysByRoom[rId].has(sKey) &&
            !(state.sessionJoined && rId === state.joinedRoomId && sKey === clientInstanceId)
          ) {
            rMap.delete(sKey);
            changed = true;
          }
        });
      });
    } catch (_) {}
    if (changed && shouldEmit) {
      emit("presence", getPresenceSummary(state.roomId, state.activeModule));
    }
    return changed;
  }

  hydratePresenceRegistryFromStorage(false);

  const RETAINED_STALE_MS = 90 * 60 * 1000;
  const RESPONSE_RETENTION_MS = 60 * 24 * 60 * 60 * 1000;
  const ROOM_RESP_STORAGE_PREFIX = "racm303_live_room_resps_v2_r";

  function persistRoomResponsesToStorage(roomIdOpt) {
    try {
      const rId = clampRoom(roomIdOpt || state.roomId);
      if (rId !== state.roomId) return;
      const now = Date.now();
      const questionsObj = {};
      state.responsesByQuestion.forEach((qMap, qid) => {
        if (!qMap || !qid) return;
        const arr = [];
        qMap.forEach((rec) => {
          if (!rec || !rec.participantId || !rec.cells) return;
          if (String(rec.participantId).startsWith("team_")) return;
          const uMs = Number(rec.updatedWallMs || 0);
          if (uMs && now - uMs > RESPONSE_RETENTION_MS) return;
          if (!Object.keys(rec.cells).length) return;
          arr.push(rec);
        });
        if (arr.length) questionsObj[qid] = arr;
      });
      const clearedObj = {};
      state.clearedAtByQuestion.forEach((ts, qid) => {
        if (ts && now - ts <= RESPONSE_RETENTION_MS) clearedObj[qid] = ts;
      });
      // Merge with existing room storage if current tab is a student (so Student B doesn't overwrite Student A's stored answer for Faculty)
      let mergedQuestions = questionsObj;
      if (state.role !== "faculty") {
        const prevRaw = safeGetStorage(`${ROOM_RESP_STORAGE_PREFIX}${rId}`, "");
        if (prevRaw) {
          try {
            const prevParsed = JSON.parse(prevRaw);
            const prevQs = (prevParsed && prevParsed.questions) || {};
            mergedQuestions = {};
            const allQids = new Set([...Object.keys(prevQs), ...Object.keys(questionsObj)]);
            const myPid = state.studentId ? `sid_${state.studentId}` : state.participantId;
            allQids.forEach((qid) => {
              const mapByPid = new Map();
              (Array.isArray(prevQs[qid]) ? prevQs[qid] : []).forEach((oldRec) => {
                if (!oldRec || !oldRec.participantId || String(oldRec.participantId).startsWith("team_")) return;
                const uMs = Number(oldRec.updatedWallMs || 0);
                if (uMs && now - uMs > RESPONSE_RETENTION_MS) return;
                const cTs = Number(clearedObj[qid] || (prevParsed.clearedAt && prevParsed.clearedAt[qid]) || 0);
                if (cTs && uMs <= cTs) return;
                if (oldRec.participantId === myPid) return; // replaced by current tab's latest state for myPid
                mapByPid.set(oldRec.participantId, oldRec);
              });
              (Array.isArray(questionsObj[qid]) ? questionsObj[qid] : []).forEach((curRec) => {
                if (curRec && curRec.participantId) mapByPid.set(curRec.participantId, curRec);
              });
              const mergedArr = Array.from(mapByPid.values());
              if (mergedArr.length) mergedQuestions[qid] = mergedArr;
            });
          } catch (_) {}
        }
      }
      localStorage.setItem(
        `${ROOM_RESP_STORAGE_PREFIX}${rId}`,
        JSON.stringify({ updatedMs: now, roomId: rId, questions: mergedQuestions, clearedAt: clearedObj })
      );
    } catch (_) {}
  }

  function hydrateRoomResponsesFromStorage(roomIdOpt, shouldEmit) {
    let changed = false;
    try {
      const rId = clampRoom(roomIdOpt || state.roomId);
      if (rId !== state.roomId) return false;
      const raw = safeGetStorage(`${ROOM_RESP_STORAGE_PREFIX}${rId}`, "");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return false;
      const now = Date.now();
      const clearedObj = parsed.clearedAt || {};
      Object.keys(clearedObj).forEach((qid) => {
        const cTs = Number(clearedObj[qid] || 0);
        if (cTs > (state.clearedAtByQuestion.get(qid) || 0)) {
          state.clearedAtByQuestion.set(qid, cTs);
          const qMap = state.responsesByQuestion.get(qid);
          if (qMap) {
            qMap.forEach((rec, pid) => {
              if ((rec.updatedWallMs || 0) <= cTs) {
                qMap.delete(pid);
                changed = true;
              }
            });
          }
        }
      });
      const questionsObj = parsed.questions || {};
      const myOwnPid = state.studentId ? `sid_${state.studentId}` : "";
      Object.keys(questionsObj).forEach((qid) => {
        const arr = Array.isArray(questionsObj[qid]) ? questionsObj[qid] : [];
        const cTs = state.clearedAtByQuestion.get(qid) || 0;
        arr.forEach((rec) => {
          if (!rec || !rec.participantId || !rec.cells) return;
          if (String(rec.participantId).startsWith("team_")) return;
          // Students NEVER load other students' answers — strictly isolated per student!
          if (state.role !== "faculty") {
            if (!myOwnPid || rec.participantId !== myOwnPid) return;
          }
          const uMs = Number(rec.updatedWallMs || 0);
          if (!uMs || now - uMs > RESPONSE_RETENTION_MS || uMs <= cTs) return;
          if (!state.responsesByQuestion.has(qid)) {
            state.responsesByQuestion.set(qid, new Map());
          }
          const qMap = state.responsesByQuestion.get(qid);
          const prev = qMap.get(rec.participantId);
          if (!prev || (Number(prev.updatedWallMs) || 0) < uMs) {
            qMap.set(rec.participantId, rec);
            changed = true;
          }
        });
      });
    } catch (_) {}
    if (changed && shouldEmit) {
      emit("responses", { questionId: "*" });
    }
    return changed;
  }

  const ROOM_CONCEPT_UNLOCK_PREFIX = "racm303_live_concept_unlock_r";
  const CONCEPT_UNLOCK_STORAGE_TTL_MS = RESPONSE_RETENTION_MS;

  function persistRoomConceptUnlocksToStorage(roomIdOpt) {
    try {
      const rId = clampRoom(roomIdOpt || state.roomId);
      if (rId !== state.roomId) return;
      safeSetStorage(
        `${ROOM_CONCEPT_UNLOCK_PREFIX}${rId}_v1`,
        JSON.stringify({
          roomId: rId,
          updatedMs: Date.now(),
          items: state.unlockedConceptSummaries || {}
        })
      );
    } catch (_) {}
  }

  function hydrateRoomConceptUnlocksFromStorage(roomIdOpt) {
    try {
      const rId = clampRoom(roomIdOpt || state.roomId);
      if (rId !== state.roomId) return false;
      const raw = safeGetStorage(`${ROOM_CONCEPT_UNLOCK_PREFIX}${rId}_v1`, "");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !parsed.items) return false;
      const now = Date.now();
      let changed = false;
      Object.keys(parsed.items).forEach((qid) => {
        const rec = parsed.items[qid];
        if (!rec || typeof rec !== "object") return;
        const uMs = Number(rec.updatedWallMs || 0);
        if (!uMs || now - uMs > CONCEPT_UNLOCK_STORAGE_TTL_MS) return;
        const prev = state.unlockedConceptSummaries[qid];
        if (!prev || (Number(prev.updatedWallMs) || 0) < uMs) {
          state.unlockedConceptSummaries[qid] = {
            unlocked: Boolean(rec.unlocked),
            seq: Number(rec.seq) || 0,
            updatedWallMs: uMs
          };
          changed = true;
        }
      });
      return changed;
    } catch (_) {
      return false;
    }
  }

  hydrateRoomConceptUnlocksFromStorage(state.roomId);

  const listeners = {
    timer: new Set(),
    responses: new Set(),
    presence: new Set(),
    pointer: new Set(),
    concept_unlock: new Set(),
    checkin_reset: new Set(),
    connection: new Set()
  };

  function emit(kind, payload) {
    const set = listeners[kind];
    if (!set) return;
    set.forEach((fn) => {
      try {
        fn(payload);
      } catch (_) {}
    });
  }

  function on(kind, fn) {
    if (!listeners[kind]) return function () {};
    listeners[kind].add(fn);
    return function () {
      listeners[kind].delete(fn);
    };
  }

  function roomTopic(subpath, roomIdOpt) {
    return `${TOPIC_NS}/room-${clampRoom(roomIdOpt || state.roomId)}/${subpath}`;
  }

  function playTimerChime() {
    if (state.soundMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [659.25, 880, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = ctx.currentTime + idx * 0.14;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.14, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.38);
      });
      setTimeout(() => {
        if (ctx && typeof ctx.close === "function") ctx.close().catch(() => {});
      }, 1500);
    } catch (_) {}
  }

  function getScopeTimer(roomIdOpt, modOpt) {
    const r = clampRoom(roomIdOpt || state.roomId);
    const m = normalizeModuleId(modOpt || state.activeModule);
    const key = `${r}:${m}`;
    let t = state.timersByScope.get(key);
    if (!t) {
      t = createFreshTimerObj();
      state.timersByScope.set(key, t);
    }
    return t;
  }

  function getTimerRemainingMs(tOpt) {
    const t = tOpt || getScopeTimer();
    if (!t.running) return Math.max(0, Math.round(t.baseRemainingMs));
    const elapsed = Math.max(0, performance.now() - t.anchorPerfNow);
    return Math.max(0, Math.round(t.baseRemainingMs - elapsed));
  }

  function formatMs(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function getTimerSnapshot(modOpt, roomIdOpt) {
    const effRoom = clampRoom(roomIdOpt || state.roomId);
    const effMod = normalizeModuleId(modOpt || state.activeModule);
    const t = getScopeTimer(effRoom, effMod);
    const remMs = getTimerRemainingMs(t);
    const durMs = Math.max(1000, (t.durationSec || 300) * 1000);
    return {
      roomId: effRoom,
      moduleId: effMod,
      running: t.running && remMs > 0,
      remainingMs: remMs,
      durationSec: t.durationSec || 300,
      configuredDurationSec: t.configuredDurationSec || t.durationSec || 300,
      pct: Math.max(0, Math.min(100, (remMs / durMs) * 100)),
      formatted: formatMs(remMs),
      isWarning: Boolean(t.running) && remMs > 0 && remMs <= 60000,
      isUrgent: Boolean(t.running) && remMs > 0 && remMs <= 15000,
      isTimeUp: Boolean(t.timedOutInCurrentRun) && !t.running && remMs === 0,
      hasStarted: Boolean(t.hasStarted),
      hasConfigured: Boolean(t.hasConfigured),
      label: t.label || "",
      questionId: t.questionId || ""
    };
  }

  // Tick loop every 250ms across all active (room, module) scopes
  setInterval(() => {
    const curKey = `${clampRoom(state.roomId)}:${normalizeModuleId(state.activeModule)}`;
    state.timersByScope.forEach((t, key) => {
      if (!t.running) return;
      const rem = getTimerRemainingMs(t);
      if (rem <= 0) {
        const [rStr, mStr] = key.split(":");
        const scopeRoom = clampRoom(rStr);
        const scopeMod = normalizeModuleId(mStr);
        t.running = false;
        t.baseRemainingMs = 0;
        t.timedOutInCurrentRun = true;
        if (key === curKey && t.chimePlayedForSeq !== t.seq) {
          t.chimePlayedForSeq = t.seq;
          playTimerChime();
        }
        // Clear retained countdown on broker so future visitors never receive an expired Time-Up alert
        if (state.role === "faculty" && scopeRoom === state.roomId) {
          publishPacket(
            `timer/${scopeMod.toLowerCase()}`,
            {
              type: "timer",
              moduleId: scopeMod,
              seq: t.seq,
              running: false,
              hasStarted: true,
              hasConfigured: true,
              timedOutInCurrentRun: true,
              configuredDurationSec: t.configuredDurationSec || 300,
              durationSec: t.durationSec || 300,
              remainingMs: 0,
              questionId: t.questionId,
              label: t.label
            },
            false,
            scopeRoom
          );
          publishPacket(
            `timer/${scopeMod.toLowerCase()}`,
            {
              type: "timer",
              moduleId: scopeMod,
              seq: t.seq,
              running: false,
              hasStarted: false,
              hasConfigured: false,
              timedOutInCurrentRun: false,
              configuredDurationSec: t.configuredDurationSec || 300,
              durationSec: t.configuredDurationSec || 300,
              remainingMs: (t.configuredDurationSec || 300) * 1000,
              questionId: t.questionId,
              label: t.label
            },
            true,
            scopeRoom
          );
        }
      }
      if (key === curKey) {
        emit("timer", getTimerSnapshot());
      }
    });
  }, 250);

  // Prune offline/disconnected presence entries across all 6 rooms every 5s & send active room heartbeat every 10s (unthrottled in background tabs)
  startBackgroundSafeInterval(() => {
    const now = Date.now();
    let changed = false;
    [1, 2, 3, 4, 5, 6].forEach((rId) => {
      const rMap = getRoomPresenceMap(rId);
      rMap.forEach((val, key) => {
        if (
          key === clientInstanceId &&
          ((state.role === "faculty" && rId === state.roomId) ||
            (state.role !== "faculty" && state.sessionJoined && rId === state.joinedRoomId))
        ) {
          val.lastSeenMs = now;
          return;
        }
        const maxAgeMs = val && val.role === "faculty" ? 80000 : LIVE_PRESENCE_TTL_MS;
        const refMs = Number((val && val.lastSeenMs) || (val && val.joinedWallMs) || 0);
        if (!refMs || now - refMs > maxAgeMs) {
          rMap.delete(key);
          changed = true;
        }
      });
    });
    if (changed) {
      persistPresenceRegistryToStorage();
      emit("presence", getPresenceSummary(state.roomId, state.activeModule));
    }
  }, 5000);

  startBackgroundSafeInterval(() => {
    if (state.role === "faculty" || state.sessionJoined) {
      publishPresence();
    }
    if (state.role === "faculty") {
      state.timersByScope.forEach((t, key) => {
        if (!t.running) return;
        const [rStr, mStr] = key.split(":");
        const scopeRoom = clampRoom(rStr);
        const scopeMod = normalizeModuleId(mStr);
        if (scopeRoom !== state.roomId) return;
        publishPacket(
          `timer/${scopeMod.toLowerCase()}`,
          {
            type: "timer",
            moduleId: scopeMod,
            seq: t.seq,
            running: true,
            hasStarted: true,
            hasConfigured: true,
            configuredDurationSec: t.configuredDurationSec || t.durationSec || 300,
            durationSec: t.durationSec,
            remainingMs: getTimerRemainingMs(t),
            questionId: t.questionId,
            label: t.label
          },
          true,
          scopeRoom
        );
      });
    }
  }, HEARTBEAT_INTERVAL_MS);

  function publishPacket(subpath, payload, retain, targetRoomOpt) {
    const targetRoom = clampRoom(targetRoomOpt || payload.roomId || state.roomId);
    const msg = Object.assign({}, payload, {
      msgId: payload.msgId || randomId("pkt"),
      roomId: targetRoom,
      senderCli: clientInstanceId,
      sentWallMs: Date.now()
    });
    rememberMsgId(msg.msgId);

    const raw = JSON.stringify(msg);

    // 1. BroadcastChannel (instant same-browser tabs across Student & Faculty portals)
    if (state.bc) {
      try {
        state.bc.postMessage({ subpath, msg, retained: false });
      } catch (_) {}
    }

    // 2. MQTT over WSS (QoS 1 for timer & presence so countdown and online status delivery is broker-acknowledged)
    const fullTopic = roomTopic(subpath, targetRoom);
    const subStr = String(subpath || "");
    const qosLevel =
      subStr.startsWith("timer") ||
      subStr.startsWith("concept_unlock") ||
      subStr.startsWith("presence")
        ? 1
        : 0;
    state.mqttClients.forEach((client) => {
      try {
        if (client && client.connected) {
          client.publish(fullTopic, raw, { qos: qosLevel, retain: Boolean(retain) });
        }
      } catch (_) {}
    });

    // 3. PeerJS WebRTC DataChannel
    if (targetRoom === state.roomId) {
      const peerEnv = { subpath, msg };
      if (state.role === "faculty") {
        state.peerConns.forEach((conn) => {
          try {
            if (conn && conn.open) conn.send(peerEnv);
          } catch (_) {}
        });
      } else if (state.hostConn && state.hostConn.open) {
        try {
          state.hostConn.send(peerEnv);
        } catch (_) {}
      }
    }
  }

  const pendingDeadCliTimers = new Map();
  function scheduleDisconnectedCliCleanup(deadCli) {
    const cleanCli = String(deadCli || "").trim();
    if (!cleanCli || cleanCli === clientInstanceId) return;
    const disconnectDetectedMs = Date.now();
    if (pendingDeadCliTimers.has(cleanCli)) {
      clearTimeout(pendingDeadCliTimers.get(cleanCli));
    }
    const timer = setTimeout(() => {
      pendingDeadCliTimers.delete(cleanCli);
      let removedAny = false;
      [1, 2, 3, 4, 5, 6].forEach((rId) => {
        const rMap = getRoomPresenceMap(rId);
        rMap.forEach((rec, sKey) => {
          if (
            rec &&
            (rec.senderCli === cleanCli || rec.sessionId === cleanCli || sKey === cleanCli) &&
            (Number(rec.lastSeenMs) || 0) <= disconnectDetectedMs
          ) {
            rMap.delete(sKey);
            removedAny = true;
            // Wipe dead session's retained MQTT presence topic so late joiners never see a ghost
            const presTopic = `${TOPIC_NS}/room-${rId}/presence/${sKey}`;
            state.mqttClients.forEach((c) => {
              try {
                if (c && c.connected) c.publish(presTopic, "", { qos: 0, retain: true });
              } catch (_) {}
            });
          }
        });
      });
      if (removedAny) {
        persistPresenceRegistryToStorage(cleanCli);
        emit("presence", getPresenceSummary(state.roomId, state.activeModule));
      }
    }, 1200);
    pendingDeadCliTimers.set(cleanCli, timer);
  }

  function handleIncomingPacket(subpath, msg, isRetained) {
    if (!msg || typeof msg !== "object") return;
    if (msg.senderCli === clientInstanceId) return;

    // Handle LWT before rememberMsgId so MQTT reconnects never drop future LWT packets
    if (msg.type === "lwt_disconnect") {
      if (isRetained) return;
      scheduleDisconnectedCliCleanup(msg.senderCli);
      return;
    }

    // Legacy check-in reset packets are ignored — online status follows pure Google Docs tab presence
    if (msg.type === "checkin_reset") {
      return;
    }

    if (msg.type === "resp" && state.role !== "faculty" && !state.studentId) {
      return;
    }
    if (!(isRetained && msg.type === "resp") && rememberMsgId(msg.msgId)) return;

    const isMultiRoomPresencePkt = msg.type === "presence" || msg.type === "who_is_here";
    if (!isMultiRoomPresencePkt) {
      if (!msg.roomId || clampRoom(msg.roomId) !== state.roomId) return;
    }
    const pktRoom = clampRoom(msg.roomId || state.roomId);

    // If faculty receives from a PeerJS student on active room, relay to other PeerJS students
    if (pktRoom === state.roomId && state.role === "faculty" && state.peerConns.size > 1) {
      state.peerConns.forEach((conn) => {
        try {
          if (conn && conn.open) conn.send({ subpath, msg });
        } catch (_) {}
      });
    }

    if (msg.type === "timer") {
      // Strictly require explicit moduleId (HS1..HS6) so legacy unscoped retained packets and other modules never leak
      if (!msg.moduleId || !/^HS[1-6]$/i.test(String(msg.moduleId).trim())) {
        return;
      }
      const pktMod = normalizeModuleId(msg.moduleId);
      const t = getScopeTimer(pktRoom, pktMod);
      if (isRetained && t.receivedLiveInSession) {
        return;
      }
      const maxRetainedAgeMs = msg.running ? RETAINED_STALE_MS : 10 * 60 * 1000;
      if (isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > maxRetainedAgeMs) {
        return;
      }
      if (!isRetained) {
        t.receivedLiveInSession = true;
      }
      const seq = Number(msg.seq) || 0;
      let rem = Math.max(0, Number(msg.remainingMs) || 0);
      if (msg.running && isRetained && msg.sentWallMs) {
        const wallElapsed = Math.max(0, Date.now() - Number(msg.sentWallMs));
        rem = Math.max(0, rem - wallElapsed);
      }
      const durSec = Math.max(1, Number(msg.durationSec) || 300);
      const cfgSec = Math.max(1, Number(msg.configuredDurationSec) || durSec);
      const isActiveScope = pktRoom === state.roomId && pktMod === normalizeModuleId(state.activeModule);

      // Never turn any incoming retained 0-remaining packet into a red Time-Up state
      if (rem === 0) {
        const wasActivelyRunningHere = Boolean(t.running) || Boolean(!isRetained && msg.timedOutInCurrentRun);
        t.seq = wasActivelyRunningHere ? Math.max(t.seq, seq) : 0;
        t.configuredDurationSec = cfgSec;
        t.durationSec = durSec;
        t.baseRemainingMs = wasActivelyRunningHere ? 0 : durSec * 1000;
        t.anchorPerfNow = performance.now();
        t.running = false;
        t.hasStarted = wasActivelyRunningHere;
        t.hasConfigured = wasActivelyRunningHere;
        t.timedOutInCurrentRun = wasActivelyRunningHere;
        t.lastWallMs = Date.now();
        if (isActiveScope) emit("timer", getTimerSnapshot());
        return;
      }
      t.seq = Math.max(t.seq, seq);
      t.configuredDurationSec = cfgSec;
      t.durationSec = durSec;
      t.baseRemainingMs = rem;
      t.anchorPerfNow = performance.now();
      t.running = Boolean(msg.running) && rem > 0;
      t.timedOutInCurrentRun = false;
      if (t.running) {
        t.hasStarted = true;
        t.hasConfigured = true;
      } else if (!isRetained) {
        t.hasStarted = Boolean(msg.hasStarted);
        t.hasConfigured = msg.hasConfigured !== undefined ? Boolean(msg.hasConfigured) : rem > 0;
      } else {
        t.hasStarted = false;
        t.hasConfigured = Boolean(msg.hasConfigured);
      }
      t.label = String(msg.label || "จับเวลาอภิปรายกลุ่มย่อย").slice(0, 100);
      t.questionId = String(msg.questionId || "").slice(0, 32);
      t.lastWallMs = Date.now();
      if (rem > 0) t.chimePlayedForSeq = -1;
      if (isActiveScope) emit("timer", getTimerSnapshot());
      return;
    }

    if (msg.type === "slide") {
      if ((Number(msg.sentWallMs) || 0) < (state.teacherPointer.sentWallMs || 0)) return;
      const staleRetained = Boolean(
        isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > RETAINED_STALE_MS
      );
      const qid = String(msg.questionId || "").slice(0, 24);
      const slideKind =
        msg.slideKind === "concept-summary" && !staleRetained ? "concept-summary" : "question";
      const sentMs = Number(msg.sentWallMs) || Date.now();
      state.teacherPointer = {
        seq: Number(msg.seq) || 0,
        module: String(msg.module || "").slice(0, 12),
        caseId: String(msg.caseId || "").slice(0, 24),
        questionId: qid,
        slideKind,
        splitOrient: msg.splitOrient === "horizontal" || msg.splitOrient === "vertical" ? msg.splitOrient : "",
        forceSync: false,
        sentWallMs: sentMs
      };
      if (slideKind === "concept-summary" && qid) {
        const prevRec = state.unlockedConceptSummaries[qid];
        const wasUnlocked = Boolean(prevRec && prevRec.unlocked);
        if (!prevRec || (prevRec.updatedWallMs || 0) <= sentMs) {
          state.unlockedConceptSummaries[qid] = {
            unlocked: true,
            seq: Number(msg.seq) || 0,
            updatedWallMs: sentMs
          };
          persistRoomConceptUnlocksToStorage(state.roomId);
          if (!wasUnlocked) {
            emit("concept_unlock", { questionId: qid, unlocked: true, isRetained: Boolean(isRetained) });
          }
        }
      }
      emit("pointer", Object.assign({}, state.teacherPointer));
      return;
    }

    if (msg.type === "concept_unlock") {
      if (isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > RESPONSE_RETENTION_MS) {
        return;
      }
      const qid = String(msg.questionId || "").slice(0, 32);
      if (!qid) return;
      const updatedMs = Number(msg.updatedWallMs || msg.sentWallMs) || Date.now();
      const prevRec = state.unlockedConceptSummaries[qid];
      if (prevRec && (prevRec.updatedWallMs || 0) > updatedMs) return;
      const isUnlocked = Boolean(msg.unlocked);
      const wasUnlocked = Boolean(prevRec && prevRec.unlocked);
      state.unlockedConceptSummaries[qid] = {
        unlocked: isUnlocked,
        seq: Number(msg.seq) || 0,
        updatedWallMs: updatedMs
      };
      persistRoomConceptUnlocksToStorage(state.roomId);
      if (!prevRec || wasUnlocked !== isUnlocked) {
        emit("concept_unlock", { questionId: qid, unlocked: isUnlocked, isRetained: Boolean(isRetained) });
      }
      return;
    }

    if (msg.type === "clear_q") {
      const qid = String(msg.questionId || "");
      const clearTs = Number(msg.clearedAtWallMs) || Date.now();
      if (!qid) return;
      const prevClear = state.clearedAtByQuestion.get(qid) || 0;
      if (clearTs > prevClear) {
        state.clearedAtByQuestion.set(qid, clearTs);
        const qMap = state.responsesByQuestion.get(qid);
        if (qMap) {
          qMap.forEach((rec, pid) => {
            if ((rec.updatedWallMs || 0) <= clearTs) qMap.delete(pid);
          });
        }
        persistRoomResponsesToStorage(pktRoom);
        emit("responses", { questionId: qid });
      }
      return;
    }

    if (msg.type === "resp") {
      const qid = String(msg.questionId || "").slice(0, 32);
      const rawPid = String(msg.participantId || "").slice(0, 48);
      if (!qid || !rawPid) return;
      const incomingTeamId = clampTeamOrZero(
        msg.teamId || (rawPid.startsWith("team_") ? rawPid.slice(5) : 0)
      );
      const sidFromPid = rawPid.startsWith("sid_") ? rawPid.slice(4).trim() : "";
      const sidFromSender =
        msg.senderPid && String(msg.senderPid).startsWith("sid_")
          ? String(msg.senderPid).slice(4).trim()
          : "";
      const sidClean = String(msg.studentId || sidFromPid || sidFromSender || "").trim().slice(0, 16);
      // Every student has their own individual answer sheet keyed by sid_<studentId> (never merged into team_1..3)
      const pid = sidClean
        ? `sid_${sidClean}`
        : msg.senderPid && !String(msg.senderPid).startsWith("team_")
        ? String(msg.senderPid).slice(0, 48)
        : rawPid;

      // Refresh sender student's individual tab presence on live (non-retained, non-leaving) worksheet packets
      const senderPid = sidClean ? `sid_${sidClean}` : (!pid.startsWith("team_") ? pid : "");
      if (!isRetained && !msg.suppressPresenceRefresh && senderPid && sidClean) {
        const sKey = String(msg.senderCli || senderPid).slice(0, 64);
        const rMap = getRoomPresenceMap(pktRoom);
        const prevPres = rMap.get(sKey) || {};
        const respMod = resolveModuleFromQuestionOrActive(qid, msg.activeModule || prevPres.activeModule);
        rMap.set(
          sKey,
          Object.assign({}, prevPres, {
            sessionId: sKey,
            participantId: senderPid,
            role: "student",
            joined: true,
            checkedIn: true,
            roomId: pktRoom,
            teamId: clampTeamOrZero(incomingTeamId || prevPres.teamId),
            studentId: sidClean,
            shortNo: String(msg.shortNo || prevPres.shortNo || sidClean.slice(-3)).slice(0, 6),
            fullName: String(msg.fullName || prevPres.fullName || "").slice(0, 80),
            nickname: String(msg.nickname || prevPres.nickname || "").slice(0, 32),
            area: String(msg.area || prevPres.area || "").slice(0, 40),
            disc: Number(msg.disc || prevPres.disc || pktRoom) || pktRoom,
            name: String(msg.senderName || msg.editorLabel || prevPres.name || `รหัส ${sidClean}`).slice(0, 80),
            activeModule: respMod,
            activeQuestionId: qid,
            senderCli: String(msg.senderCli || sKey).slice(0, 64),
            lastSeenMs: Date.now()
          })
        );
        persistPresenceRegistryToStorage();
        emit("presence", getPresenceSummary(state.roomId, state.activeModule));
      }

      // Strictly isolate student answer sheets: a student client NEVER absorbs another student's answers
      if (state.role !== "faculty") {
        if (!sidClean || !state.studentId || sidClean !== String(state.studentId)) {
          return;
        }
      }

      const updatedMs = Number(msg.updatedWallMs) || Number(msg.sentWallMs) || Date.now();
      const clearedAt = state.clearedAtByQuestion.get(qid) || 0;
      if (updatedMs <= clearedAt) return;
      if (isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > RESPONSE_RETENTION_MS) {
        return;
      }

      if (!state.responsesByQuestion.has(qid)) {
        state.responsesByQuestion.set(qid, new Map());
      }
      const qMap = state.responsesByQuestion.get(qid);
      const existing = qMap.get(pid);
      if (existing && (existing.updatedWallMs || 0) > updatedMs) return;

      const rawCellStatuses =
        msg.cellStatuses && typeof msg.cellStatuses === "object" ? msg.cellStatuses : {};
      const rawCellUpdatedMs =
        msg.cellUpdatedMs && typeof msg.cellUpdatedMs === "object" ? msg.cellUpdatedMs : {};
      const rawCellEditors =
        msg.cellEditors && typeof msg.cellEditors === "object" ? msg.cellEditors : {};
      const dirtyCells =
        msg.dirtyCells && typeof msg.dirtyCells === "object" ? msg.dirtyCells : null;

      const cleanCells = {};
      const cleanCellStatuses = {};
      const cleanCellUpdatedMs = {};
      const cleanCellEditors = {};

      const candidateKeys = new Set();
      if (msg.cells && typeof msg.cells === "object") {
        Object.keys(msg.cells).slice(0, 32).forEach((k) => candidateKeys.add(k));
      }
      if (dirtyCells) {
        Object.keys(dirtyCells).slice(0, 32).forEach((k) => candidateKeys.add(k));
      }

      let syncedSubmittedChange = false;
      candidateKeys.forEach((k) => {
        const cellTs = Number(rawCellUpdatedMs[k] || updatedMs);
        const rawVal =
          msg.cells && Object.prototype.hasOwnProperty.call(msg.cells, k)
            ? msg.cells[k]
            : dirtyCells && Object.prototype.hasOwnProperty.call(dirtyCells, k)
            ? dirtyCells[k]
            : "";
        const val = String(rawVal || "").slice(0, 500);
        if (val.trim()) {
          cleanCells[k] = val;
          const cStat = rawCellStatuses[k]
            ? rawCellStatuses[k] === "submitted"
              ? "submitted"
              : "typing"
            : msg.status === "submitted"
            ? "submitted"
            : existing && existing.cellStatuses && existing.cellStatuses[k] === "submitted" && existing.cells && existing.cells[k] === val
            ? "submitted"
            : "typing";
          cleanCellStatuses[k] = cStat;
          cleanCellUpdatedMs[k] = cellTs;
          const ed = String(rawCellEditors[k] || msg.editorLabel || (sidClean ? `รหัส ${sidClean}` : "")).slice(0, 60);
          if (ed) cleanCellEditors[k] = ed;

          if (
            state.role === "student" &&
            sidClean &&
            state.studentId === sidClean &&
            cStat === "submitted" &&
            submittedTextByCell[k] !== val.trim()
          ) {
            submittedTextByCell[k] = val.trim();
            syncedSubmittedChange = true;
          }
        }
      });

      if (syncedSubmittedChange) {
        saveSubmittedCellsStore();
      }

      const cellKeys = Object.keys(cleanCells);
      const anySubmitted = cellKeys.some((k) => cleanCellStatuses[k] === "submitted");

      if (!cellKeys.length) {
        qMap.delete(pid);
      } else {
        const prevLatest = existing ? existing.updatedWallMs || 0 : 0;
        const shortNo = String(msg.shortNo || (existing && existing.shortNo) || (sidClean ? sidClean.slice(-3) : "")).slice(0, 6);
        const fullName = String(msg.fullName || (existing && existing.fullName) || "").slice(0, 80);
        const nick = String(msg.nickname || (existing && existing.nickname) || "").slice(0, 32);
        const defaultLabel = sidClean
          ? `รหัส ${sidClean}${nick ? ` (${nick})` : fullName ? ` (${fullName})` : ""}`
          : String(msg.displayName || "นักศึกษาในห้อง").slice(0, 80);
        const latestEditor =
          updatedMs >= prevLatest
            ? String(msg.editorLabel || defaultLabel).slice(0, 60)
            : String((existing && existing.editorLabel) || msg.editorLabel || defaultLabel).slice(0, 60);
        qMap.set(pid, {
          participantId: pid,
          teamId: incomingTeamId || 0,
          studentId: sidClean,
          shortNo,
          fullName,
          displayName: sidClean ? defaultLabel : String(msg.displayName || defaultLabel).slice(0, 80),
          editorLabel: latestEditor,
          nickname: nick,
          area: String(msg.area || (existing && existing.area) || "").slice(0, 40),
          disc: Number(msg.disc || (existing && existing.disc) || pktRoom) || pktRoom,
          questionId: qid,
          cells: cleanCells,
          cellStatuses: cleanCellStatuses,
          cellUpdatedMs: cleanCellUpdatedMs,
          cellEditors: cleanCellEditors,
          status: anySubmitted ? "submitted" : "typing",
          updatedWallMs: Math.max(prevLatest, updatedMs)
        });
      }

      persistRoomResponsesToStorage(pktRoom);
      emit("responses", { questionId: qid, participantId: pid, studentId: sidClean, teamId: incomingTeamId || 0 });
      return;
    }

    if (msg.type === "who_is_here") {
      if (isRetained) return;
      if (
        (state.role === "faculty" && pktRoom === state.roomId) ||
        (state.role !== "faculty" && state.sessionJoined && pktRoom === (state.joinedRoomId || state.roomId))
      ) {
        publishPresence();
      }
      // If a joined student has active answers in this room, re-publish their individual answer sheet so newly opened Faculty views get it immediately
      if (
        state.role !== "faculty" &&
        state.sessionJoined &&
        state.studentId &&
        pktRoom === (state.joinedRoomId || state.roomId)
      ) {
        const myPid = `sid_${state.studentId}`;
        state.responsesByQuestion.forEach((qMap, qid) => {
          const myRec = qMap && qMap.get(myPid);
          if (!myRec || !myRec.cells || !Object.keys(myRec.cells).length) return;
          publishPacket(
            `resp/${qid}/${myPid}`,
            Object.assign({ type: "resp" }, myRec, {
              participantId: myPid,
              senderPid: myPid,
              senderName: state.displayName || myRec.editorLabel,
              studentId: state.studentId,
              shortNo: state.shortNo || String(state.studentId).slice(-3),
              fullName: state.fullName || "",
              activeModule: normalizeModuleId(state.activeModule)
            }),
            true,
            pktRoom
          );
        });
      }
      if (pktRoom === state.roomId && state.role === "faculty") {
        state.timersByScope.forEach((t, key) => {
          const [rStr, mStr] = key.split(":");
          const scopeRoom = clampRoom(rStr);
          const scopeMod = normalizeModuleId(mStr);
          if (scopeRoom !== state.roomId) return;
          const remNow = getTimerRemainingMs(t);
          if (remNow <= 0) return;
          if (t.running || t.hasConfigured || t.hasStarted) {
            publishPacket(
              `timer/${scopeMod.toLowerCase()}`,
              {
                type: "timer",
                moduleId: scopeMod,
                seq: t.seq,
                running: t.running,
                hasStarted: t.hasStarted,
                hasConfigured: t.hasConfigured,
                timedOutInCurrentRun: false,
                configuredDurationSec: t.configuredDurationSec || t.durationSec || 300,
                durationSec: t.durationSec,
                remainingMs: remNow,
                questionId: t.questionId,
                label: t.label
              },
              true,
              scopeRoom
            );
          }
        });
        Object.keys(state.unlockedConceptSummaries || {}).forEach((qid) => {
          const rec = state.unlockedConceptSummaries[qid];
          if (!rec) return;
          publishPacket(
            `concept_unlock/${qid}`,
            {
              type: "concept_unlock",
              questionId: qid,
              unlocked: Boolean(rec.unlocked),
              seq: rec.seq || 0,
              updatedWallMs: rec.updatedWallMs || Date.now()
            },
            true
          );
        });
      }
      return;
    }

    if (msg.type === "presence") {
      const pid = String(msg.participantId || "").slice(0, 48);
      if (pid.startsWith("team_")) return;
      const sKey = resolvePresenceSessionKey(msg) || pid;
      if (!sKey) return;
      const rMap = getRoomPresenceMap(pktRoom);
      if (msg.left || (msg.role !== "faculty" && msg.joined === false)) {
        const senderCliStr = String(msg.senderCli || msg.sessionId || "").trim();
        let removed = false;
        [1, 2, 3, 4, 5, 6].forEach((rId) => {
          const m = getRoomPresenceMap(rId);
          if (m.delete(sKey)) removed = true;
          if (senderCliStr) {
            m.forEach((rec, k) => {
              if (rec && (rec.senderCli === senderCliStr || rec.sessionId === senderCliStr)) {
                m.delete(k);
                removed = true;
              }
            });
          } else if (pid && m.delete(pid)) {
            removed = true;
          }
        });
        if (removed) {
          persistPresenceRegistryToStorage(sKey);
          emit("presence", getPresenceSummary(state.roomId, state.activeModule));
        }
        return;
      }
      const maxRetainedAge = msg.role === "faculty" ? 80000 : LIVE_PRESENCE_TTL_MS;
      const refWallMs = Number(msg.lastSeenMs || msg.sentWallMs || msg.joinedWallMs || 0);
      if (isRetained && (!refWallMs || Date.now() - refWallMs > maxRetainedAge)) {
        return;
      }
      const prevPres = rMap.get(sKey) || {};
      const sidStr = String(msg.studentId || prevPres.studentId || "").slice(0, 16);
      // Remove stale record for this exact tab session from other rooms so each tab only appears in its active room
      [1, 2, 3, 4, 5, 6].forEach((otherR) => {
        if (otherR !== pktRoom) {
          getRoomPresenceMap(otherR).delete(sKey);
        }
      });
      rMap.set(sKey, {
        sessionId: sKey,
        participantId: pid || (sidStr ? `sid_${sidStr}` : sKey),
        role: msg.role === "faculty" ? "faculty" : "student",
        joined: true,
        checkedIn: msg.role === "faculty" ? false : Boolean(msg.checkedIn || sidStr),
        loginSynced: Boolean(msg.loginSynced || prevPres.loginSynced),
        roomId: pktRoom,
        teamId: clampTeamOrZero(msg.teamId !== undefined ? msg.teamId : prevPres.teamId),
        studentId: sidStr,
        shortNo: String(msg.shortNo || prevPres.shortNo || (sidStr ? sidStr.slice(-3) : "")).slice(0, 6),
        fullName: String(msg.fullName || prevPres.fullName || "").slice(0, 80),
        nickname: String(msg.nickname || prevPres.nickname || "").slice(0, 32),
        area: String(msg.area || prevPres.area || "").slice(0, 40),
        disc: Number(msg.disc || prevPres.disc || 0) || 0,
        photoId: String(msg.photoId || prevPres.photoId || "").slice(0, 40),
        activeModule: normalizeModuleId(msg.activeModule || prevPres.activeModule || "HS1"),
        activeQuestionId: String(msg.activeQuestionId || prevPres.activeQuestionId || "").slice(0, 32),
        name: String(msg.name || prevPres.name || "ผู้เข้าร่วม").slice(0, 80),
        senderCli: String(msg.senderCli || prevPres.senderCli || sKey).slice(0, 64),
        joinedWallMs: Number(msg.joinedWallMs || prevPres.joinedWallMs || msg.sentWallMs || Date.now()),
        lastSeenMs: isRetained && refWallMs ? refWallMs : Date.now()
      });
      if (sidStr && msg.role !== "faculty") {
        persistPresenceRegistryToStorage();
      }
      // If student sees faculty come online in the same room while PeerJS hostConn isn't open yet, reconnect PeerJS
      if (
        state.role === "student" &&
        msg.role === "faculty" &&
        pktRoom === state.roomId &&
        (!state.hostConn || !state.hostConn.open)
      ) {
        tryConnectStudentPeerToHost();
      }
      emit("presence", getPresenceSummary(state.roomId, state.activeModule));
    }
  }

  function updateConnectionBadge() {
    emit("connection", getConnectionStatus());
  }

  function getConnectionStatus() {
    const list = Array.from(state.connectedTransports);
    const hasCloud = list.some((x) => x.startsWith("mqtt") || x.startsWith("peer"));
    return {
      online: hasCloud,
      localReady: Boolean(state.bc),
      transports: list,
      label: hasCloud
        ? "เชื่อมต่อสดข้ามอุปกรณ์ (Live Cloud)"
        : state.bc
        ? "พร้อมซิงค์ในเครือข่าย/แท็บเครื่อง"
        : "โหมดออฟไลน์"
    };
  }

  function subscribeCurrentRoomMqtt(client) {
    if (!client || !client.connected) return;
    try {
      // Subscribe to active room full stream AND all 6 rooms' presence/snapshot/LWT topics
      client.subscribe(
        [
          `${TOPIC_NS}/room-${state.roomId}/#`,
          `${TOPIC_NS}/+/presence/#`,
          `${TOPIC_NS}/+/who_is_here`,
          `${TOPIC_NS}/lwt/+`
        ],
        { qos: 0 }
      );
    } catch (_) {
      try {
        client.subscribe(`${TOPIC_NS}/room-${state.roomId}/#`, { qos: 0 });
        client.subscribe(`${TOPIC_NS}/+/presence/#`, { qos: 0 });
        client.subscribe(`${TOPIC_NS}/lwt/+`, { qos: 0 });
      } catch (_2) {}
    }
  }

  function unsubscribeRoomMqtt(client, oldRoomId) {
    if (!client || !client.connected || !oldRoomId) return;
    try {
      client.unsubscribe(`${TOPIC_NS}/room-${oldRoomId}/#`);
    } catch (_) {}
  }

  function initBroadcastChannel() {
    if (typeof BroadcastChannel === "undefined") return;
    try {
      state.bc = new BroadcastChannel(BC_NAME);
      state.connectedTransports.add("local");
      state.bc.onmessage = (ev) => {
        if (!ev || !ev.data) return;
        if (ev.data.type === "local_anon_wall") {
          const nextAnon = Boolean(ev.data.anonymousWall);
          if (state.anonymousWall !== nextAnon) {
            state.anonymousWall = nextAnon;
            emit("responses", { questionId: "*" });
          }
          return;
        }
        handleIncomingPacket(ev.data.subpath || "", ev.data.msg, false);
      };
      updateConnectionBadge();
    } catch (_) {}
  }

  function initMqttBrokers() {
    if (!window.mqtt || typeof window.mqtt.connect !== "function") return;
    BROKERS.forEach((url, idx) => {
      try {
        const tag = `mqtt${idx + 1}`;
        const lwtPayload = JSON.stringify({
          type: "lwt_disconnect",
          senderCli: clientInstanceId,
          brokerTag: tag
        });
        const client = window.mqtt.connect(url, {
          clientId: `racm303_${state.role}_${Math.random().toString(16).slice(2, 10)}`,
          clean: true,
          connectTimeout: 7000,
          reconnectPeriod: 3500,
          keepalive: 60,
          will: {
            topic: `${TOPIC_NS}/lwt/${clientInstanceId}`,
            payload: lwtPayload,
            qos: 1,
            retain: false
          }
        });
        client.on("connect", () => {
          state.connectedTransports.add(tag);
          subscribeCurrentRoomMqtt(client);
          updateConnectionBadge();
          publishPresence();
          if (state.role === "faculty") {
            requestAllRoomsSnapshot();
          } else {
            requestRoomSnapshot();
          }
        });
        client.on("close", () => {
          state.connectedTransports.delete(tag);
          updateConnectionBadge();
          // Immediately refresh presence on remaining open transports so a single broker hiccup never drops a still-open tab
          if ((state.role === "faculty" || state.sessionJoined) && state.connectedTransports.size > 0) {
            publishPresence();
          }
        });
        client.on("error", () => {
          state.connectedTransports.delete(tag);
          updateConnectionBadge();
        });
        client.on("message", (topic, payloadBuf, packet) => {
          try {
            let text = "";
            if (typeof payloadBuf === "string") {
              text = payloadBuf;
            } else if (payloadBuf && payloadBuf._isBuffer && typeof payloadBuf.toString === "function") {
              text = payloadBuf.toString("utf8");
            } else if (payloadBuf instanceof Uint8Array && typeof TextDecoder !== "undefined") {
              text = new TextDecoder("utf-8").decode(payloadBuf);
            } else if (payloadBuf && typeof payloadBuf.toString === "function") {
              text = payloadBuf.toString();
            }
            const lwtPrefix = `${TOPIC_NS}/lwt/`;
            if (topic.startsWith(lwtPrefix)) {
              if (!text) return;
              const lwtParsed = JSON.parse(text);
              handleIncomingPacket("lwt", lwtParsed, Boolean(packet && packet.retain));
              return;
            }
            const prefix = `${TOPIC_NS}/room-`;
            if (!topic.startsWith(prefix)) return;
            const rest = topic.slice(prefix.length);
            const slashIdx = rest.indexOf("/");
            if (slashIdx <= 0) return;
            const topicRoom = clampRoom(rest.slice(0, slashIdx));
            const subpath = rest.slice(slashIdx + 1);
            if (!text) {
              if (subpath.startsWith("presence/")) {
                const goneKey = subpath.slice("presence/".length).trim();
                const rMap = getRoomPresenceMap(topicRoom);
                if (goneKey && rMap.has(goneKey)) {
                  rMap.delete(goneKey);
                  persistPresenceRegistryToStorage(goneKey);
                  emit("presence", getPresenceSummary(state.roomId, state.activeModule));
                }
              }
              return;
            }
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === "object" && !parsed.roomId) {
              parsed.roomId = topicRoom;
            }
            handleIncomingPacket(subpath, parsed, Boolean(packet && packet.retain));
          } catch (_) {}
        });
        state.mqttClients.push(client);
      } catch (_) {}
    });
  }

  let peerRetryTimer = null;

  function teardownPeer() {
    if (peerRetryTimer) {
      clearTimeout(peerRetryTimer);
      peerRetryTimer = null;
    }
    if (state.hostConn) {
      try {
        state.hostConn.close();
      } catch (_) {}
      state.hostConn = null;
    }
    state.peerConns.forEach((c) => {
      try {
        c.close();
      } catch (_) {}
    });
    state.peerConns.clear();
    if (state.peer) {
      try {
        state.peer.destroy();
      } catch (_) {}
      state.peer = null;
    }
    state.connectedTransports.delete("peer");
    updateConnectionBadge();
  }

  function tryConnectStudentPeerToHost() {
    if (state.role !== "student" || !state.peer || state.peer.destroyed || !state.peer.open) return;
    if (state.hostConn && state.hostConn.open) return;
    const hostPeerId = `racm303-2569-hsd-r${state.roomId}`;
    try {
      if (state.hostConn) {
        try {
          state.hostConn.close();
        } catch (_) {}
      }
      const conn = state.peer.connect(hostPeerId, { reliable: true });
      state.hostConn = conn;
      conn.on("open", () => {
        state.connectedTransports.add("peer");
        updateConnectionBadge();
        if (state.sessionJoined) publishPresence();
        requestRoomSnapshot();
      });
      conn.on("data", (data) => {
        if (data && data.msg) handleIncomingPacket(data.subpath || "", data.msg, false);
      });
      conn.on("close", () => {
        state.connectedTransports.delete("peer");
        updateConnectionBadge();
      });
      conn.on("error", () => {
        state.connectedTransports.delete("peer");
        updateConnectionBadge();
      });
    } catch (_) {}
  }

  function initPeerForRoom() {
    teardownPeer();
    if (typeof window.Peer !== "function") return;
    const isPopupViewer = Boolean(
      typeof window !== "undefined" &&
        window.location &&
        window.location.search &&
        window.location.search.includes("slideshare=1")
    );
    const hostPeerId = `racm303-2569-hsd-r${state.roomId}`;
    try {
      if (state.role === "faculty" && !isPopupViewer) {
        const peer = new window.Peer(hostPeerId, { debug: 0 });
        state.peer = peer;
        peer.on("open", () => {
          state.connectedTransports.add("peer");
          updateConnectionBadge();
        });
        peer.on("connection", (conn) => {
          state.peerConns.set(conn.peer, conn);
          conn.on("open", () => {
            try {
              state.timersByScope.forEach((t, key) => {
                const [rStr, mStr] = key.split(":");
                const scopeRoom = clampRoom(rStr);
                const scopeMod = normalizeModuleId(mStr);
                if (scopeRoom !== state.roomId) return;
                const remNow = getTimerRemainingMs(t);
                if (remNow <= 0) return;
                if (t.running || t.hasConfigured || t.hasStarted) {
                  conn.send({
                    subpath: `timer/${scopeMod.toLowerCase()}`,
                    msg: {
                      type: "timer",
                      msgId: randomId("sync"),
                      roomId: scopeRoom,
                      moduleId: scopeMod,
                      seq: t.seq,
                      running: t.running,
                      hasStarted: t.hasStarted,
                      hasConfigured: t.hasConfigured,
                      timedOutInCurrentRun: false,
                      configuredDurationSec: t.configuredDurationSec || t.durationSec || 300,
                      durationSec: t.durationSec,
                      remainingMs: remNow,
                      label: t.label,
                      questionId: t.questionId,
                      sentWallMs: Date.now()
                    }
                  });
                }
              });
              if (state.teacherPointer.questionId) {
                conn.send({
                  subpath: "slide",
                  msg: Object.assign({ type: "slide", msgId: randomId("sync"), roomId: state.roomId }, state.teacherPointer)
                });
              }
              Object.keys(state.unlockedConceptSummaries || {}).forEach((qid) => {
                const rec = state.unlockedConceptSummaries[qid];
                if (!rec) return;
                conn.send({
                  subpath: `concept_unlock/${qid}`,
                  msg: {
                    type: "concept_unlock",
                    msgId: randomId("sync"),
                    roomId: state.roomId,
                    questionId: qid,
                    unlocked: Boolean(rec.unlocked),
                    seq: rec.seq || 0,
                    updatedWallMs: rec.updatedWallMs || Date.now(),
                    sentWallMs: Date.now()
                  }
                });
              });
              getRoomPresenceMap(state.roomId).forEach((pRec, sKey) => {
                conn.send({
                  subpath: `presence/${pRec.sessionId || sKey}`,
                  msg: Object.assign({ type: "presence", msgId: randomId("sync"), roomId: state.roomId, sentWallMs: Date.now() }, pRec)
                });
              });
            } catch (_) {}
          });
          conn.on("data", (data) => {
            if (data && data.msg) {
              if (data.msg.senderCli) conn._remoteCli = String(data.msg.senderCli);
              handleIncomingPacket(data.subpath || "", data.msg, false);
            }
          });
          const onPeerStudentClosed = () => {
            state.peerConns.delete(conn.peer);
            if (conn._remoteCli) {
              scheduleDisconnectedCliCleanup(conn._remoteCli);
            }
          };
          conn.on("close", onPeerStudentClosed);
          conn.on("error", onPeerStudentClosed);
        });
        peer.on("error", (err) => {
          state.connectedTransports.delete("peer");
          updateConnectionBadge();
          // Retry claiming hostPeerId after page refresh once old PeerJS socket expires
          if (err && err.type === "unavailable-id" && !peerRetryTimer) {
            const expectedRoom = state.roomId;
            peerRetryTimer = setTimeout(() => {
              peerRetryTimer = null;
              if (state.roomId === expectedRoom && !state.connectedTransports.has("peer")) {
                initPeerForRoom();
              }
            }, 8500);
          }
        });
      } else if (state.role === "student") {
        const peer = new window.Peer(undefined, { debug: 0 });
        state.peer = peer;
        peer.on("open", () => {
          tryConnectStudentPeerToHost();
        });
        peer.on("error", () => {});
      }
    } catch (_) {}
  }

  // Periodic PeerJS reconnect check for students who logged in before teacher opened the room
  startBackgroundSafeInterval(() => {
    if (initialized && state.role === "student" && state.sessionJoined) {
      if (!state.hostConn || !state.hostConn.open) {
        if (!state.peer || state.peer.destroyed) {
          initPeerForRoom();
        } else {
          tryConnectStudentPeerToHost();
        }
      }
    }
  }, 10000);

  function requestRoomSnapshot(roomIdOpt) {
    const targetRoom = roomIdOpt ? clampRoom(roomIdOpt) : state.roomId;
    publishPacket(
      "who_is_here",
      {
        type: "who_is_here",
        roomId: targetRoom,
        participantId: state.participantId
      },
      false,
      targetRoom
    );
  }

  function requestAllRoomsSnapshot() {
    [1, 2, 3, 4, 5, 6].forEach((rId) => {
      requestRoomSnapshot(rId);
    });
  }

  const burstTimers = [];
  function schedulePresenceBurst() {
    while (burstTimers.length) {
      clearTimeout(burstTimers.pop());
    }
    [450, 1500, 3600].forEach((delayMs) => {
      const t = setTimeout(() => {
        if (state.role === "faculty" || state.sessionJoined) {
          publishPresence();
        }
      }, delayMs);
      burstTimers.push(t);
    });
  }

  let lastPublishedPresenceRoom = 0;

  function publishPresence() {
    // Students only broadcast active green presence when identified and actively inside an open Case Discussion tab
    if (state.role !== "faculty" && (!state.sessionJoined || !state.joinedRoomId || !state.studentId)) {
      emit("presence", getPresenceSummary(state.roomId, state.activeModule));
      return;
    }
    const pubRoom = state.role === "faculty" ? state.roomId : clampRoom(state.joinedRoomId);
    const sessionKey = clientInstanceId;
    const myName = getEffectiveDisplayName();
    if (!state.joinedWallMs) state.joinedWallMs = Date.now();
    const myShortNo = state.shortNo || (state.studentId ? String(state.studentId).slice(-3) : "");
    const effMod = normalizeModuleId(state.activeModule);
    const now = Date.now();
    const myRec = {
      sessionId: sessionKey,
      participantId: state.participantId,
      role: state.role,
      joined: true,
      checkedIn: state.role === "faculty" ? false : Boolean(state.studentId),
      loginSynced: state.role !== "faculty",
      roomId: pubRoom,
      teamId: state.role === "faculty" ? 0 : clampTeamOrZero(state.teamId),
      studentId: state.studentId || "",
      shortNo: myShortNo,
      fullName: state.fullName || "",
      nickname: state.nickname || "",
      area: state.area || "",
      disc: state.disc || pubRoom,
      photoId: state.photoId || "",
      activeModule: effMod,
      activeQuestionId: state.activeQuestionId || "",
      name: myName,
      senderCli: clientInstanceId,
      joinedWallMs: state.joinedWallMs,
      lastSeenMs: now
    };
    [1, 2, 3, 4, 5, 6].forEach((otherR) => {
      if (otherR !== pubRoom) {
        getRoomPresenceMap(otherR).delete(sessionKey);
      }
    });
    if (lastPublishedPresenceRoom && lastPublishedPresenceRoom !== pubRoom) {
      const prevTopic = `${TOPIC_NS}/room-${lastPublishedPresenceRoom}/presence/${sessionKey}`;
      state.mqttClients.forEach((c) => {
        try {
          if (c && c.connected) c.publish(prevTopic, "", { qos: 0, retain: true });
        } catch (_) {}
      });
    }
    lastPublishedPresenceRoom = pubRoom;

    const rMap = getRoomPresenceMap(pubRoom);
    rMap.set(sessionKey, myRec);
    if (state.role !== "faculty" && state.studentId) {
      persistPresenceRegistryToStorage();
    }
    publishPacket(
      `presence/${sessionKey}`,
      Object.assign({ type: "presence" }, myRec),
      true,
      pubRoom
    );
    emit("presence", getPresenceSummary(state.roomId, state.activeModule));
  }

  function resolvePresenceFilterModule(moduleIdOpt) {
    if (moduleIdOpt === undefined || moduleIdOpt === null || moduleIdOpt === "*" || moduleIdOpt === "ALL") {
      return "";
    }
    const s = String(moduleIdOpt).trim().toUpperCase();
    return /^HS[1-6]$/.test(s) ? s : "";
  }

  function getPresenceSummary(roomIdOpt, moduleIdOpt) {
    const targetRoom = clampRoom(roomIdOpt || state.roomId);
    const filterMod = resolvePresenceFilterModule(moduleIdOpt);
    const rMap = getRoomPresenceMap(targetRoom);
    let teachers = 0;
    const list = [];
    const latestStudentBySid = new Map();

    rMap.forEach((p) => {
      if (!p) return;
      if (p.role === "faculty") {
        teachers += 1;
        list.push(p);
      } else if (p.joined !== false && p.studentId) {
        if (filterMod && normalizeModuleId(p.activeModule || "HS1") !== filterMod) {
          return;
        }
        const sidKey = String(p.studentId);
        const prev = latestStudentBySid.get(sidKey);
        if (!prev || (Number(p.lastSeenMs) || 0) >= (Number(prev.lastSeenMs) || 0)) {
          latestStudentBySid.set(sidKey, p);
        }
      }
    });

    const joinedStudents = Array.from(latestStudentBySid.values());
    const students = joinedStudents.length;
    const teamCounts = { 1: 0, 2: 0, 3: 0 };
    const teamMembers = { 1: [], 2: [], 3: [] };

    joinedStudents.forEach((p) => {
      list.push(p);
      const tid = clampTeamOrZero(p.teamId);
      if (tid >= 1 && tid <= 3) {
        teamCounts[tid] += 1;
        teamMembers[tid].push(p);
      }
    });

    joinedStudents.sort((a, b) => {
      const ta = clampTeamOrZero(a.teamId) || 9;
      const tb = clampTeamOrZero(b.teamId) || 9;
      if (ta !== tb) return ta - tb;
      if (a.studentId && b.studentId) return String(a.studentId).localeCompare(String(b.studentId));
      return (a.joinedWallMs || 0) - (b.joinedWallMs || 0);
    });
    [1, 2, 3].forEach((tid) => {
      teamMembers[tid].sort((a, b) =>
        String(a.studentId || "").localeCompare(String(b.studentId || ""))
      );
    });
    return {
      roomId: targetRoom,
      moduleId: filterMod || "*",
      total: students + teachers,
      students,
      teachers,
      list,
      joinedStudents,
      teamCounts,
      teamMembers
    };
  }

  function getAllRoomsPresenceSummary(moduleIdOpt) {
    const rooms = {};
    let totalJoinedStudents = 0;
    [1, 2, 3, 4, 5, 6].forEach((rId) => {
      const sum = getPresenceSummary(rId, moduleIdOpt);
      rooms[rId] = sum;
      totalJoinedStudents += sum.students;
    });
    return { rooms, totalJoinedStudents };
  }

  function findStudentLivePresence(studentId, moduleIdOpt) {
    const sid = String(studentId || "").trim();
    if (!sid) return null;
    const filterMod = resolvePresenceFilterModule(moduleIdOpt);
    let bestHit = null;
    for (let rId = 1; rId <= 6; rId += 1) {
      const rMap = getRoomPresenceMap(rId);
      for (const [, rec] of rMap.entries()) {
        if (!rec || rec.role === "faculty" || rec.joined === false) continue;
        if (String(rec.studentId || "") !== sid) continue;
        if (filterMod && normalizeModuleId(rec.activeModule || "HS1") !== filterMod) continue;
        if (!bestHit || (Number(rec.lastSeenMs) || 0) >= (Number(bestHit.record.lastSeenMs) || 0)) {
          bestHit = { roomId: rId, record: rec };
        }
      }
    }
    return bestHit;
  }

  function getSmartTeamBalance(excludeStudentIdOpt, totalExpectedOpt, roomIdOpt) {
    const targetRoom = clampRoom(roomIdOpt || state.roomId);
    const rMap = getRoomPresenceMap(targetRoom);
    const excludeSid = String(excludeStudentIdOpt || "").trim();
    const excludePid = excludeSid ? `sid_${excludeSid}` : "";
    const counts = { 1: 0, 2: 0, 3: 0 };
    const otherCounts = { 1: 0, 2: 0, 3: 0 };
    const seenSids = new Set();

    rMap.forEach((p) => {
      if (!p || p.role === "faculty" || p.joined === false) return;
      if (normalizeModuleId(p.activeModule || "HS1") !== normalizeModuleId(state.activeModule)) return;
      const sidKey = String(p.studentId || p.participantId || "");
      if (sidKey && seenSids.has(sidKey)) return;
      if (sidKey) seenSids.add(sidKey);
      const tid = clampTeamOrZero(p.teamId);
      if (tid < 1 || tid > 3) return;
      counts[tid] += 1;
      const isExcluded =
        (excludeSid && String(p.studentId || "") === excludeSid) ||
        (excludePid && p.participantId === excludePid) ||
        (!excludeSid && targetRoom === state.roomId && state.sessionJoined && p.participantId === state.participantId);
      if (!isExcluded) {
        otherCounts[tid] += 1;
      }
    });

    const totalExpected = Math.max(3, Number(totalExpectedOpt) || 28);
    const maxQuota = Math.max(2, Math.ceil(totalExpected / 3));
    const minOther = Math.min(otherCounts[1], otherCounts[2], otherCounts[3]);
    const allAtQuota =
      otherCounts[1] >= maxQuota && otherCounts[2] >= maxQuota && otherCounts[3] >= maxQuota;

    const teams = {};
    [1, 2, 3].forEach((tid) => {
      const c = otherCounts[tid];
      const isAheadCap = c > minOther;
      const isFullQuota = !allAtQuota && c >= maxQuota;
      const locked = isAheadCap || isFullQuota;
      teams[tid] = {
        id: tid,
        count: counts[tid],
        otherCount: c,
        maxQuota,
        locked,
        isRecommended: !locked && c === minOther,
        lockReason: isFullQuota
          ? `เต็มโควตากลุ่ม (${maxQuota} คน)`
          : isAheadCap
          ? "ล็อกชั่วคราว · รอกลุ่มอื่นเกลี่ยคน"
          : ""
      };
    });

    const recommendedTeam =
      [1, 2, 3].find((tid) => !teams[tid].locked && otherCounts[tid] === minOther) ||
      [1, 2, 3].find((tid) => !teams[tid].locked) ||
      1;

    return {
      counts,
      otherCounts,
      minOther,
      maxQuota,
      recommendedTeam,
      teams
    };
  }

  function getEffectiveDisplayName() {
    if (state.role === "faculty") {
      return state.displayName || "อาจารย์ประจำกลุ่ม";
    }
    if (state.studentId) {
      const sn = state.shortNo || String(state.studentId).slice(-3);
      const base = state.fullName || "";
      if (state.nickname) {
        return `รหัส ${state.studentId} (${sn} · ${state.nickname}${base ? ` ${base}` : ""})`;
      }
      return `รหัส ${state.studentId}${base ? ` (${base})` : ""}`;
    }
    if (state.displayName && state.displayName.trim()) {
      return state.displayName.trim();
    }
    return `นศพ. ห้อง ${state.roomId} (#${state.participantId.slice(-4)})`;
  }

  function getEditorShortDisplay() {
    if (state.studentId) {
      const sn = state.shortNo || String(state.studentId).slice(-3);
      if (state.nickname) return `รหัส ${state.studentId} (#${sn} ${state.nickname})`;
      if (state.fullName) return `รหัส ${state.studentId} (${state.fullName})`;
      return `รหัส ${state.studentId}`;
    }
    const sn = state.shortNo || "";
    if (sn && state.nickname) return `#${sn} ${state.nickname}`;
    if (sn) return `เบอร์ ${sn}`;
    if (state.nickname) return state.nickname;
    if (state.fullName) return state.fullName;
    return "นักศึกษา";
  }

  function setStudentProfile(studentObj, opts) {
    if (!studentObj || !studentObj.id) {
      state.studentId = "";
      state.shortNo = "";
      state.nickname = "";
      state.fullName = "";
      state.area = "";
      state.disc = 0;
      state.photoId = "";
      state.displayName = "";
      state.participantId = persistentPid;
      if (state.role !== "faculty") {
        state.responsesByQuestion.clear();
        lastPublishedLocalCellsByQ.clear();
        pendingCellsByQuestion.clear();
        pendingDirtyCellsByQ.clear();
        reloadSubmittedCellsForActiveStudent();
      }
      [1, 2, 3, 4, 5, 6].forEach((rId) => {
        getRoomPresenceMap(rId).delete(clientInstanceId);
      });
      persistPresenceRegistryToStorage(clientInstanceId);
      emit("presence", getPresenceSummary(state.roomId, state.activeModule));
      return;
    }
    const prevSid = state.studentId;
    const nextSid = String(studentObj.id).trim();
    state.studentId = nextSid;
    state.shortNo = nextSid.slice(-3);
    state.participantId = `sid_${nextSid}`;
    const nick = String(studentObj.nickname || studentObj.nick || "").trim();
    state.nickname = nick;
    state.fullName = String(studentObj.fullName || studentObj.name || "").trim();
    state.area = studentObj.area || "";
    state.disc = Number(studentObj.disc) || 0;
    state.photoId = String(studentObj.photoId || "");
    const baseName = studentObj.name || studentObj.fullName || nextSid;
    state.displayName = nick
      ? `รหัส ${nextSid} (${state.shortNo} · ${nick} ${baseName})`
      : `รหัส ${nextSid} (${baseName})`;
    if (state.role !== "faculty" && prevSid !== nextSid) {
      state.responsesByQuestion.clear();
      lastPublishedLocalCellsByQ.clear();
      pendingCellsByQuestion.clear();
      pendingDirtyCellsByQ.clear();
      reloadSubmittedCellsForActiveStudent();
    }
    const skipAutoRoom = Boolean(opts && opts.keepCurrentRoom);
    if (!skipAutoRoom && studentObj.disc >= 1 && studentObj.disc <= 6) {
      setRoom(studentObj.disc, true);
    }
    if (state.role !== "faculty") {
      hydrateRoomResponsesFromStorage(state.roomId, false);
    }
    if (state.sessionJoined && state.joinedRoomId) {
      publishPresence();
    } else {
      emit("presence", getPresenceSummary(state.roomId, state.activeModule));
    }
  }

  function setTeam(teamNum, silentSave) {
    const next = clampTeam(teamNum);
    state.teamId = next;
    safeSetSession("racm303_hsd_team_id_v1", String(next));
    if (!silentSave) safeSetStorage("racm303_live_team_v1", String(next));
    if (state.sessionJoined && state.joinedRoomId) {
      publishPresence();
      schedulePresenceBurst();
    } else {
      emit("presence", getPresenceSummary(state.roomId, state.activeModule));
    }
    emit("responses", { questionId: "*", teamId: next });
  }

  function broadcastStudentLeaveFromRoom(oldPid, oldSid, oldRoom, fromUnload) {
    const targetRoom = clampRoom(oldRoom || state.roomId);
    const sessionKey = clientInstanceId;
    [1, 2, 3, 4, 5, 6].forEach((rId) => {
      const m = getRoomPresenceMap(rId);
      m.delete(sessionKey);
      m.forEach((rec, k) => {
        if (rec && (rec.senderCli === sessionKey || rec.sessionId === sessionKey)) {
          m.delete(k);
        }
      });
    });
    lastPublishedPresenceRoom = 0;
    persistPresenceRegistryToStorage(sessionKey);
    const leaveMsg = {
      type: "presence",
      msgId: randomId("leave"),
      roomId: targetRoom,
      sessionId: sessionKey,
      senderCli: clientInstanceId,
      sentWallMs: Date.now(),
      participantId: oldPid || state.participantId,
      studentId: oldSid || "",
      role: "student",
      joined: false,
      left: true
    };
    rememberMsgId(leaveMsg.msgId);
    if (state.bc) {
      try {
        state.bc.postMessage({ subpath: `presence/${sessionKey}`, msg: leaveMsg, retained: false });
      } catch (_) {}
    }
    if (state.hostConn && state.hostConn.open && targetRoom === state.roomId) {
      try {
        state.hostConn.send({ subpath: `presence/${sessionKey}`, msg: leaveMsg });
      } catch (_) {}
    }
    const topic = `${TOPIC_NS}/room-${targetRoom}/presence/${sessionKey}`;
    const raw = JSON.stringify(leaveMsg);
    state.mqttClients.forEach((c) => {
      try {
        if (c && c.connected) {
          c.publish(topic, raw, { qos: 0, retain: false });
          c.publish(topic, "", { qos: 0, retain: true });
          if (oldPid && oldPid !== sessionKey) {
            c.publish(`${TOPIC_NS}/room-${targetRoom}/presence/${oldPid}`, "", { qos: 0, retain: true });
          }
        }
      } catch (_) {}
    });
  }

  function joinSessionWithStudent(studentObj, roomNumOpt, activeModuleOpt, teamIdOpt) {
    startEngine();
    const targetRoom = roomNumOpt
      ? clampRoom(roomNumOpt)
      : studentObj && studentObj.disc >= 1 && studentObj.disc <= 6
      ? clampRoom(studentObj.disc)
      : state.roomId;
    const nextSid = studentObj && studentObj.id ? String(studentObj.id).trim() : state.studentId;
    const nextMod = activeModuleOpt ? normalizeModuleId(activeModuleOpt) : normalizeModuleId(state.activeModule);
    const nextTeam = clampTeamOrZero(teamIdOpt !== undefined ? teamIdOpt : state.teamId);

    const alreadyJoinedSameScope =
      Boolean(state.sessionJoined) &&
      state.joinedRoomId === targetRoom &&
      state.roomId === targetRoom &&
      state.studentId === nextSid &&
      normalizeModuleId(state.activeModule) === nextMod &&
      clampTeamOrZero(state.teamId) === nextTeam &&
      getRoomPresenceMap(targetRoom).has(clientInstanceId);

    if (alreadyJoinedSameScope) {
      return;
    }

    if (state.sessionJoined && state.joinedRoomId && state.joinedRoomId !== targetRoom) {
      broadcastStudentLeaveFromRoom(state.participantId, state.studentId, state.joinedRoomId, false);
    }
    const existingPres = nextSid ? findStudentLivePresence(nextSid, nextMod) : null;
    state.sessionJoined = true;
    state.joinedRoomId = targetRoom;
    state.joinedWallMs =
      (existingPres && existingPres.record && existingPres.record.joinedWallMs) ||
      state.joinedWallMs ||
      Date.now();
    safeSetSession("racm303_hsd_session_joined_v1", "1");
    state.activeModule = nextMod;
    state.teamId = nextTeam;
    safeSetSession("racm303_hsd_team_id_v1", state.teamId ? String(state.teamId) : null);
    safeSetStorage("racm303_live_team_v1", state.teamId ? String(state.teamId) : "0");
    if (studentObj && studentObj.id) {
      setStudentProfile(studentObj, { keepCurrentRoom: true });
    }
    if (targetRoom !== state.roomId) {
      setRoom(targetRoom, false);
    } else {
      hydrateRoomResponsesFromStorage(targetRoom, false);
    }
    resubscribeOwnStudentResponsesMqtt(targetRoom, state.studentId);
    publishPresence();
    schedulePresenceBurst();
    requestRoomSnapshot(targetRoom);
    emit("responses", { questionId: "*", teamId: state.teamId });
  }

  function resubscribeOwnStudentResponsesMqtt(roomNum, sidStr) {
    const cleanSid = String(sidStr || "").trim();
    if (!cleanSid || state.role === "faculty") return;
    const topic = `${TOPIC_NS}/room-${clampRoom(roomNum)}/resp/+/sid_${cleanSid}`;
    state.mqttClients.forEach((c) => {
      try {
        if (c && c.connected) {
          c.unsubscribe(topic, () => {
            try {
              if (c.connected) c.subscribe(topic, { qos: 0 });
            } catch (_) {}
          });
        }
      } catch (_) {}
    });
  }

  function checkinStudentToRoom(studentObj, roomNumOpt, activeModuleOpt, teamIdOpt, opts) {
    if (!studentObj || !studentObj.id) return false;
    startEngine();
    const isSharedScreen = Boolean((opts && opts.kioskMode) || state.role === "faculty");
    const targetRoom = clampRoom(roomNumOpt || studentObj.disc || state.roomId);
    if (!isSharedScreen) {
      joinSessionWithStudent(studentObj, targetRoom, activeModuleOpt, clampTeamOrZero(teamIdOpt));
      return true;
    }
    if (roomNumOpt && targetRoom !== state.roomId) {
      setRoom(targetRoom, false);
    }
    const sidStr = String(studentObj.id).slice(0, 16);
    const shortNo = sidStr.slice(-3);
    const pid = `sid_${sidStr}`;
    const sKey = `kiosk_${sidStr}`;
    const rMap = getRoomPresenceMap(targetRoom);
    const prevPres = rMap.get(sKey) || {};
    const teamNum = clampTeamOrZero(teamIdOpt);
    const now = Date.now();
    const nick = String(studentObj.nickname || studentObj.nick || "").trim().slice(0, 32);
    const fullName = String(studentObj.fullName || studentObj.name || "").trim().slice(0, 80);
    const dispLabel = nick ? `รหัส ${sidStr} (${shortNo} · ${nick} ${fullName})` : `รหัส ${sidStr} (${fullName})`;
    const rec = {
      sessionId: sKey,
      participantId: pid,
      role: "student",
      joined: true,
      checkedIn: true,
      loginSynced: true,
      roomId: targetRoom,
      teamId: teamNum,
      studentId: sidStr,
      shortNo,
      fullName,
      nickname: nick,
      area: String(studentObj.area || "").slice(0, 40),
      disc: Number(studentObj.disc) || targetRoom,
      photoId: String(studentObj.photoId || "").slice(0, 40),
      activeModule: normalizeModuleId(activeModuleOpt || state.activeModule || "HS1"),
      activeQuestionId: String(prevPres.activeQuestionId || "").slice(0, 32),
      name: dispLabel.slice(0, 80),
      senderCli: sKey,
      joinedWallMs: prevPres.joinedWallMs || now,
      lastSeenMs: now
    };
    rMap.set(sKey, rec);
    persistPresenceRegistryToStorage();
    publishPacket(`presence/${sKey}`, Object.assign({ type: "presence" }, rec), true, targetRoom);
    emit("presence", getPresenceSummary(state.roomId, state.activeModule));
    return true;
  }

  function leaveCurrentRoom(opts) {
    if (state.role === "faculty") return false;
    flushAllPendingLiveTyping(true);
    const oldPid = state.participantId;
    const oldSid = state.studentId;
    const oldRoom = state.joinedRoomId || state.roomId;
    const wasJoined = Boolean(state.sessionJoined);
    while (burstTimers.length) {
      clearTimeout(burstTimers.pop());
    }
    state.sessionJoined = false;
    state.joinedRoomId = 0;
    state.joinedWallMs = 0;
    state.timersByScope.clear();
    safeSetSession("racm303_hsd_session_joined_v1", null);
    if (wasJoined || getRoomPresenceMap(oldRoom).has(clientInstanceId)) {
      broadcastStudentLeaveFromRoom(oldPid, oldSid, oldRoom, Boolean(opts && opts.fromUnload));
    }
    emit("presence", getPresenceSummary(state.roomId, state.activeModule));
    if (!opts || !opts.fromUnload) {
      emit("timer", getTimerSnapshot());
    }
    return wasJoined;
  }

  function logoutStudentSession(explicitSidOpt, explicitRoomOpt) {
    if (state.role === "faculty") return;
    startEngine();
    const effSid = String(explicitSidOpt || state.studentId || "").trim();
    const oldPid = effSid ? `sid_${effSid}` : state.participantId;
    const oldRoom = clampRoom(explicitRoomOpt || state.joinedRoomId || state.disc || state.roomId);
    while (burstTimers.length) {
      clearTimeout(burstTimers.pop());
    }
    state.sessionJoined = false;
    state.joinedRoomId = 0;
    state.joinedWallMs = 0;
    state.teamId = 0;
    state.studentId = "";
    state.shortNo = "";
    state.nickname = "";
    state.fullName = "";
    state.area = "";
    state.disc = 0;
    state.photoId = "";
    state.displayName = "";
    state.participantId = persistentPid;
    state.responsesByQuestion.clear();
    state.timersByScope.clear();
    lastPublishedLocalCellsByQ.clear();
    pendingCellsByQuestion.clear();
    pendingDirtyCellsByQ.clear();
    reloadSubmittedCellsForActiveStudent();
    safeSetSession("racm303_hsd_session_joined_v1", null);
    safeSetSession("racm303_hsd_team_id_v1", null);
    safeSetStorage("racm303_live_room_v1", null);
    safeSetStorage("racm303_live_team_v1", null);
    broadcastStudentLeaveFromRoom(oldPid, effSid, oldRoom, false);
    emit("presence", getPresenceSummary(state.roomId, state.activeModule));
    emit("timer", getTimerSnapshot());
  }

  function setActiveModule(modId) {
    const nextMod = normalizeModuleId(modId);
    if (state.activeModule === nextMod) return;
    state.activeModule = nextMod;
    if (initialized && (state.role === "faculty" || (state.sessionJoined && state.joinedRoomId))) {
      publishPresence();
    } else {
      emit("presence", getPresenceSummary(state.roomId, nextMod));
    }
    emit("timer", getTimerSnapshot());
  }

  function setActiveStudentSlide(moduleId, questionId) {
    const nextMod = /^HS[1-6]$/i.test(String(moduleId || "").trim())
      ? normalizeModuleId(moduleId)
      : state.activeModule;
    const nextQ = String(questionId || "");
    const modChanged = state.activeModule !== nextMod;
    if (!modChanged && state.activeQuestionId === nextQ) return;
    state.activeModule = nextMod;
    state.activeQuestionId = nextQ;
    if (modChanged) {
      emit("timer", getTimerSnapshot());
    }
    if (state.role !== "faculty" && state.sessionJoined && state.joinedRoomId) {
      publishPresence();
    } else if (modChanged) {
      emit("presence", getPresenceSummary(state.roomId, nextMod));
    }
  }

  function setCustomDisplayName(nameStr) {
    const clean = String(nameStr || "").trim().slice(0, 60);
    state.displayName = clean;
    safeSetStorage("racm303_live_name_v1", clean);
    publishPresence();
  }

  function setRoom(roomNum, silentSave) {
    const next = clampRoom(roomNum);
    const prev = state.roomId;
    if (next === prev && getRoomPresenceMap(next).size > 0) return;

    if (next !== prev) {
      state.mqttClients.forEach((c) => unsubscribeRoomMqtt(c, prev));
    }
    state.roomId = next;
    state.presence = getRoomPresenceMap(next);
    if (!silentSave) safeSetStorage("racm303_live_room_v1", String(next));

    // Reset room-scoped question/timer caches for old room when switching rooms (NEVER wipe multi-room presenceByRoom!)
    if (next !== prev) {
      state.responsesByQuestion.clear();
      state.clearedAtByQuestion.clear();
      state.unlockedConceptSummaries = {};
      state.teacherPointer = {
        seq: 0,
        module: "",
        caseId: "",
        questionId: "",
        slideKind: "",
        splitOrient: "",
        forceSync: false,
        sentWallMs: 0
      };
      // Clear cached timers for non-active rooms on students so switching rooms always starts clean until live sync arrives
      if (state.role !== "faculty") {
        Array.from(state.timersByScope.keys()).forEach((k) => {
          if (!k.startsWith(`${next}:`)) state.timersByScope.delete(k);
        });
      }
    }

    hydrateRoomResponsesFromStorage(next, false);
    hydrateRoomConceptUnlocksFromStorage(next);
    state.mqttClients.forEach((c) => subscribeCurrentRoomMqtt(c));
    if (initialized) {
      initPeerForRoom();
      publishPresence();
      requestRoomSnapshot(next);
    }
    emit("presence", getPresenceSummary(next, state.activeModule));
    emit("timer", getTimerSnapshot());
    emit("responses", { questionId: "*" });
    emit("concept_unlock", { questionId: "*", unlocked: false, roomChanged: true });
  }

  /* ---------- Teacher Timer & Slide Pointer Controls (Facilitator Only · Scoped per Room & Module) ---------- */
  function resolveModuleFromQuestionOrActive(questionId, explicitModOpt) {
    if (explicitModOpt && /^HS[1-6]$/i.test(String(explicitModOpt).trim())) {
      return normalizeModuleId(explicitModOpt);
    }
    const qStr = String(questionId || "").trim();
    const mMatch = qStr.match(/^(HS[1-6])\b/i) || qStr.match(/(hs[1-6])/i);
    if (mMatch) return normalizeModuleId(mMatch[1]);
    return normalizeModuleId(state.activeModule);
  }

  function startTimer(durationSec, questionId, label, moduleIdOpt) {
    if (state.role !== "faculty") return;
    const mod = resolveModuleFromQuestionOrActive(questionId, moduleIdOpt);
    state.activeModule = mod;
    const t = getScopeTimer(state.roomId, mod);
    const sec = Math.max(
      1,
      Math.min(10800, Math.round(Number(durationSec) || t.configuredDurationSec || t.durationSec || 300))
    );
    t.seq += 1;
    t.receivedLiveInSession = true;
    t.configuredDurationSec = sec;
    t.durationSec = sec;
    t.baseRemainingMs = sec * 1000;
    t.anchorPerfNow = performance.now();
    t.running = true;
    t.hasStarted = true;
    t.hasConfigured = true;
    t.timedOutInCurrentRun = false;
    t.chimePlayedForSeq = -1;
    if (questionId !== undefined) t.questionId = questionId;
    if (label !== undefined) t.label = label;

    publishPacket(
      `timer/${mod.toLowerCase()}`,
      {
        type: "timer",
        moduleId: mod,
        seq: t.seq,
        running: true,
        hasStarted: true,
        hasConfigured: true,
        configuredDurationSec: sec,
        durationSec: sec,
        remainingMs: sec * 1000,
        questionId: t.questionId,
        label: t.label
      },
      true
    );
    emit("timer", getTimerSnapshot());
  }

  function togglePauseTimer(moduleIdOpt) {
    if (state.role !== "faculty") return;
    const mod = normalizeModuleId(moduleIdOpt || state.activeModule);
    state.activeModule = mod;
    const t = getScopeTimer(state.roomId, mod);
    const rem = getTimerRemainingMs(t);
    t.seq += 1;
    t.receivedLiveInSession = true;
    if (t.running) {
      t.running = false;
      t.baseRemainingMs = rem;
    } else {
      const fallbackSec = t.configuredDurationSec || t.durationSec || 300;
      const nextMs = rem > 0 ? rem : fallbackSec * 1000;
      if (rem <= 0) t.durationSec = fallbackSec;
      t.baseRemainingMs = nextMs;
      t.anchorPerfNow = performance.now();
      t.running = true;
      t.hasStarted = true;
      t.hasConfigured = true;
      t.timedOutInCurrentRun = false;
      t.chimePlayedForSeq = -1;
    }
    publishPacket(
      `timer/${mod.toLowerCase()}`,
      {
        type: "timer",
        moduleId: mod,
        seq: t.seq,
        running: t.running,
        hasStarted: t.hasStarted,
        hasConfigured: t.hasConfigured,
        configuredDurationSec: t.configuredDurationSec || t.durationSec || 300,
        durationSec: t.durationSec,
        remainingMs: t.baseRemainingMs,
        questionId: t.questionId,
        label: t.label
      },
      true
    );
    emit("timer", getTimerSnapshot());
  }

  function addTimerSeconds(deltaSec, moduleIdOpt) {
    if (state.role !== "faculty") return;
    const mod = normalizeModuleId(moduleIdOpt || state.activeModule);
    state.activeModule = mod;
    const t = getScopeTimer(state.roomId, mod);
    const cur = getTimerRemainingMs(t);
    const delta = Number.isFinite(Number(deltaSec)) ? Number(deltaSec) : 60;
    const nextMs = Math.max(0, Math.min(10800 * 1000, cur + delta * 1000));
    t.seq += 1;
    t.receivedLiveInSession = true;
    t.baseRemainingMs = nextMs;
    t.anchorPerfNow = performance.now();
    if (nextMs > 0) {
      t.chimePlayedForSeq = -1;
      t.hasConfigured = true;
      t.timedOutInCurrentRun = false;
    }
    t.durationSec = Math.max(t.durationSec, Math.ceil(nextMs / 1000) || 1);
    publishPacket(
      `timer/${mod.toLowerCase()}`,
      {
        type: "timer",
        moduleId: mod,
        seq: t.seq,
        running: t.running,
        hasStarted: t.hasStarted,
        hasConfigured: t.hasConfigured,
        configuredDurationSec: t.configuredDurationSec || 300,
        durationSec: t.durationSec,
        remainingMs: nextMs,
        questionId: t.questionId,
        label: t.label
      },
      true
    );
    emit("timer", getTimerSnapshot());
  }

  function resetTimer(durationSec, isSetReady, moduleIdOpt) {
    if (state.role !== "faculty") return;
    const mod = normalizeModuleId(moduleIdOpt || state.activeModule);
    state.activeModule = mod;
    const t = getScopeTimer(state.roomId, mod);
    const fallbackSec = isSetReady ? t.configuredDurationSec || 300 : 300;
    const sec = Math.max(1, Math.min(10800, Math.round(Number(durationSec) || fallbackSec)));
    t.seq += 1;
    t.receivedLiveInSession = true;
    t.running = false;
    t.hasStarted = false;
    t.hasConfigured = Boolean(isSetReady);
    t.timedOutInCurrentRun = false;
    t.configuredDurationSec = sec;
    t.durationSec = sec;
    t.baseRemainingMs = sec * 1000;
    t.anchorPerfNow = performance.now();
    t.chimePlayedForSeq = -1;
    publishPacket(
      `timer/${mod.toLowerCase()}`,
      {
        type: "timer",
        moduleId: mod,
        seq: t.seq,
        running: false,
        hasStarted: false,
        hasConfigured: Boolean(isSetReady),
        configuredDurationSec: sec,
        durationSec: sec,
        remainingMs: sec * 1000,
        questionId: t.questionId,
        label: t.label
      },
      true
    );
    emit("timer", getTimerSnapshot());
  }

  function clearTimeUpAlert(moduleIdOpt) {
    if (state.role !== "faculty") return;
    const mod = normalizeModuleId(moduleIdOpt || state.activeModule);
    const t = getScopeTimer(state.roomId, mod);
    if (!t.timedOutInCurrentRun) return;
    const sec = t.configuredDurationSec || 300;
    t.timedOutInCurrentRun = false;
    t.hasStarted = false;
    t.hasConfigured = false;
    t.durationSec = sec;
    t.baseRemainingMs = sec * 1000;
    emit("timer", getTimerSnapshot());
  }

  function broadcastTeacherQuestionPointer(moduleId, caseId, questionId, opts) {
    if (state.role !== "faculty" || !questionId) return;
    const orient =
      opts && (opts.splitOrient === "horizontal" || opts.splitOrient === "vertical")
        ? opts.splitOrient
        : state.teacherPointer.splitOrient || "";
    const slideKind =
      opts && opts.slideKind === "concept-summary" ? "concept-summary" : "question";
    const forceSync = Boolean(opts && opts.forceSync);
    const now = Date.now();
    if (
      !forceSync &&
      state.teacherPointer.module === (moduleId || "") &&
      state.teacherPointer.caseId === (caseId || "") &&
      state.teacherPointer.questionId === questionId &&
      state.teacherPointer.slideKind === slideKind &&
      state.teacherPointer.splitOrient === orient &&
      now - (state.teacherPointer.sentWallMs || 0) < 900
    ) {
      return;
    }
    state.teacherPointer.seq += 1;
    state.teacherPointer.module = moduleId || "";
    state.teacherPointer.caseId = caseId || "";
    state.teacherPointer.questionId = questionId || "";
    state.teacherPointer.slideKind = slideKind;
    state.teacherPointer.splitOrient = orient;
    state.teacherPointer.forceSync = forceSync;
    state.teacherPointer.sentWallMs = now;
    publishPacket(
      "slide",
      {
        type: "slide",
        seq: state.teacherPointer.seq,
        module: state.teacherPointer.module,
        caseId: state.teacherPointer.caseId,
        questionId: state.teacherPointer.questionId,
        slideKind,
        splitOrient: orient,
        forceSync
      },
      !forceSync
    );
  }

  let conceptUnlockSeq = 0;
  function setConceptSummaryUnlocked(questionId, unlocked) {
    if (state.role !== "faculty" || !questionId) return false;
    const qid = String(questionId).slice(0, 32);
    const nextUnlocked = Boolean(unlocked);
    const now = Date.now();
    conceptUnlockSeq += 1;
    state.unlockedConceptSummaries[qid] = {
      unlocked: nextUnlocked,
      seq: conceptUnlockSeq,
      updatedWallMs: now
    };
    persistRoomConceptUnlocksToStorage(state.roomId);
    publishPacket(
      `concept_unlock/${qid}`,
      {
        type: "concept_unlock",
        questionId: qid,
        unlocked: nextUnlocked,
        seq: conceptUnlockSeq,
        updatedWallMs: now
      },
      true
    );
    emit("concept_unlock", { questionId: qid, unlocked: nextUnlocked, local: true });
    return nextUnlocked;
  }

  function isConceptSummaryUnlocked(questionId) {
    if (!questionId) return false;
    const rec = state.unlockedConceptSummaries[String(questionId)];
    return Boolean(rec && rec.unlocked);
  }

  function getUnlockedConceptSummaries() {
    const out = {};
    Object.keys(state.unlockedConceptSummaries || {}).forEach((qid) => {
      if (state.unlockedConceptSummaries[qid] && state.unlockedConceptSummaries[qid].unlocked) {
        out[qid] = true;
      }
    });
    return out;
  }

  /* ---------- Student Per-Cell Live Typing & Per-Block Submission (Strictly Per-Student) ---------- */
  const debounceTimers = new Map();
  const lastSentAtByQuestion = new Map();
  const pendingCellsByQuestion = new Map();
  let submittedTextByCell = {};

  function getSubmittedCellsStorageKey() {
    const sid = String(state.studentId || "").trim();
    return sid ? `racm303_hs_disc_submitted_cells_stu_${sid}` : "";
  }

  function reloadSubmittedCellsForActiveStudent() {
    const key = getSubmittedCellsStorageKey();
    if (!key) {
      submittedTextByCell = {};
      return;
    }
    try {
      submittedTextByCell = JSON.parse(safeGetStorage(key, "{}")) || {};
    } catch (_) {
      submittedTextByCell = {};
    }
  }

  function saveSubmittedCellsStore() {
    const key = getSubmittedCellsStorageKey();
    if (!key) return;
    safeSetStorage(key, JSON.stringify(submittedTextByCell));
  }

  reloadSubmittedCellsForActiveStudent();

  function getCellSubmissionState(inputId, currentVal) {
    const trimmed = String(currentVal || "").trim();
    if (!trimmed) return "empty";
    const prevSent = submittedTextByCell[inputId];
    if (prevSent === undefined) return "ready";
    return prevSent === trimmed ? "submitted" : "dirty";
  }

  function hasSubmittedQuestionCells(qObj) {
    if (!qObj || !qObj.worksheet || !Array.isArray(qObj.worksheet.rows)) return false;
    const inputRows = qObj.worksheet.rows.filter((r) =>
      (r.cells || []).some((cell) => Boolean(cell && cell.inputId))
    );
    if (!inputRows.length) return false;
    return inputRows.every((r) =>
      (r.cells || []).some(
        (cell) => cell && cell.inputId && String(submittedTextByCell[cell.inputId] || "").trim().length > 0
      )
    );
  }

  function clearSubmittedCells(inputIds) {
    if (!inputIds) {
      submittedTextByCell = {};
    } else {
      inputIds.forEach((id) => delete submittedTextByCell[id]);
    }
    saveSubmittedCellsStore();
  }

  const localCellUpdatedMs = {};
  const lastPublishedLocalCellsByQ = new Map();
  const pendingDirtyCellsByQ = new Map();

  function publishStudentQuestionCells(questionId, cellsObj, forceSubmitAll, dirtyKeysOpt, opts) {
    if (!questionId || !cellsObj) return;
    const sidClean = String(state.studentId || "").trim();
    const activeTeamId = state.role === "student" ? clampTeamOrZero(state.teamId) : 0;
    // Always key by individual student (sid_<studentId>), never merging into team_1..3
    const targetPid = sidClean ? `sid_${sidClean}` : state.participantId;
    const editorLabel = getEditorShortDisplay();
    const shortNo = state.shortNo || (sidClean ? sidClean.slice(-3) : "");
    const updatedMs = Date.now();
    lastSentAtByQuestion.set(questionId, updatedMs);

    if (!state.responsesByQuestion.has(questionId)) {
      state.responsesByQuestion.set(questionId, new Map());
    }
    const qMap = state.responsesByQuestion.get(questionId);

    const prevLocal = lastPublishedLocalCellsByQ.get(questionId) || {};
    const dirtySet = new Set(Array.isArray(dirtyKeysOpt) ? dirtyKeysOpt : []);
    if (!dirtySet.size) {
      Object.keys(cellsObj).forEach((k) => {
        if (String(cellsObj[k] || "") !== String(prevLocal[k] || "")) {
          dirtySet.add(k);
        }
      });
      Object.keys(prevLocal).forEach((k) => {
        if (!Object.prototype.hasOwnProperty.call(cellsObj, k) && prevLocal[k]) {
          dirtySet.add(k);
        }
      });
    }
    if (forceSubmitAll) {
      Object.keys(cellsObj).forEach((k) => {
        if (String(cellsObj[k] || "").trim()) dirtySet.add(k);
      });
    }

    const cleanCells = {};
    const cleanCellStatuses = {};
    const cleanCellUpdatedMs = {};
    const cleanCellEditors = {};
    const dirtyCellsPayload = {};

    Object.keys(cellsObj).forEach((k) => {
      const v = String(cellsObj[k] || "").slice(0, 500);
      const trimmed = v.trim();
      if (dirtySet.has(k)) {
        dirtyCellsPayload[k] = v;
        localCellUpdatedMs[k] = updatedMs;
      }
      if (trimmed) {
        cleanCells[k] = v;
        if (forceSubmitAll) {
          submittedTextByCell[k] = trimmed;
        }
        const isCellSub = submittedTextByCell[k] === trimmed;
        cleanCellStatuses[k] = isCellSub ? "submitted" : "typing";
        cleanCellUpdatedMs[k] = localCellUpdatedMs[k] || updatedMs;
        cleanCellEditors[k] = editorLabel;
      }
    });
    dirtySet.forEach((k) => {
      if (!Object.prototype.hasOwnProperty.call(cleanCells, k)) {
        dirtyCellsPayload[k] = "";
      }
    });

    if (forceSubmitAll) saveSubmittedCellsStore();
    lastPublishedLocalCellsByQ.set(questionId, Object.assign({}, cleanCells));

    const allKeys = Object.keys(cleanCells);
    const hasAny = allKeys.length > 0;
    const anySubmitted = allKeys.some((k) => cleanCellStatuses[k] === "submitted");
    const overallStatus = anySubmitted ? "submitted" : "typing";

    if (!hasAny) {
      qMap.delete(targetPid);
    } else {
      qMap.set(targetPid, {
        participantId: targetPid,
        teamId: activeTeamId || 0,
        studentId: sidClean,
        shortNo,
        fullName: state.fullName || "",
        displayName: getEffectiveDisplayName(),
        editorLabel,
        nickname: state.nickname || "",
        area: state.area || "",
        disc: state.disc || state.roomId || 0,
        questionId,
        cells: cleanCells,
        cellStatuses: cleanCellStatuses,
        cellUpdatedMs: cleanCellUpdatedMs,
        cellEditors: cleanCellEditors,
        status: overallStatus,
        updatedWallMs: updatedMs
      });
    }

    persistRoomResponsesToStorage(state.roomId);

    publishPacket(
      `resp/${questionId}/${targetPid}`,
      {
        type: "resp",
        participantId: targetPid,
        senderPid: targetPid,
        senderName: state.displayName || editorLabel,
        teamId: activeTeamId || 0,
        studentId: sidClean,
        shortNo,
        fullName: state.fullName || "",
        displayName: getEffectiveDisplayName(),
        editorLabel,
        nickname: state.nickname || "",
        area: state.area || "",
        disc: state.disc || state.roomId || 0,
        questionId,
        cells: cleanCells,
        dirtyCells: dirtyCellsPayload,
        cellStatuses: cleanCellStatuses,
        cellUpdatedMs: cleanCellUpdatedMs,
        cellEditors: cleanCellEditors,
        activeModule: normalizeModuleId(state.activeModule),
        suppressPresenceRefresh: Boolean(opts && opts.suppressPresenceRefresh),
        status: overallStatus,
        updatedWallMs: updatedMs
      },
      true
    );
    emit("responses", {
      questionId,
      participantId: targetPid,
      studentId: sidClean,
      teamId: activeTeamId || 0,
      localOrigin: true
    });
  }

  function queueLiveTyping(questionId, cellsObj, editedCellIdOpt) {
    if (!questionId) return;
    pendingCellsByQuestion.set(questionId, Object.assign({}, cellsObj));
    if (editedCellIdOpt) {
      if (!pendingDirtyCellsByQ.has(questionId)) pendingDirtyCellsByQ.set(questionId, new Set());
      pendingDirtyCellsByQ.get(questionId).add(editedCellIdOpt);
    }
    const now = Date.now();
    const lastSent = lastSentAtByQuestion.get(questionId) || 0;
    const elapsed = now - lastSent;

    // Leading edge: send immediately if >= 280ms since last packet
    if (elapsed >= 280) {
      const prevT = debounceTimers.get(questionId);
      if (prevT) {
        clearTimeout(prevT);
        debounceTimers.delete(questionId);
      }
      pendingCellsByQuestion.delete(questionId);
      const dirtyArr = pendingDirtyCellsByQ.has(questionId)
        ? Array.from(pendingDirtyCellsByQ.get(questionId))
        : undefined;
      pendingDirtyCellsByQ.delete(questionId);
      publishStudentQuestionCells(questionId, cellsObj, false, dirtyArr);
      return;
    }

    // Trailing edge: guarantee latest characters are flushed shortly after burst typing
    if (!debounceTimers.has(questionId)) {
      const waitMs = Math.max(80, 300 - elapsed);
      const t = setTimeout(() => {
        debounceTimers.delete(questionId);
        const latest = pendingCellsByQuestion.get(questionId);
        const dirtyArr = pendingDirtyCellsByQ.has(questionId)
          ? Array.from(pendingDirtyCellsByQ.get(questionId))
          : undefined;
        pendingCellsByQuestion.delete(questionId);
        pendingDirtyCellsByQ.delete(questionId);
        if (latest) publishStudentQuestionCells(questionId, latest, false, dirtyArr);
      }, waitMs);
      debounceTimers.set(questionId, t);
    }
  }

  function flushLiveTyping(questionId, cellsObj) {
    if (!questionId) return;
    const prevT = debounceTimers.get(questionId);
    if (prevT) {
      clearTimeout(prevT);
      debounceTimers.delete(questionId);
    }
    const latest = cellsObj || pendingCellsByQuestion.get(questionId);
    const dirtyArr = pendingDirtyCellsByQ.has(questionId)
      ? Array.from(pendingDirtyCellsByQ.get(questionId))
      : undefined;
    pendingCellsByQuestion.delete(questionId);
    pendingDirtyCellsByQ.delete(questionId);
    if (latest) publishStudentQuestionCells(questionId, latest, false, dirtyArr);
  }

  function flushAllPendingLiveTyping(leavingRoom) {
    const qids = new Set([
      ...Array.from(debounceTimers.keys()),
      ...Array.from(pendingCellsByQuestion.keys())
    ]);
    qids.forEach((qid) => {
      const prevT = debounceTimers.get(qid);
      if (prevT) {
        clearTimeout(prevT);
        debounceTimers.delete(qid);
      }
      const latest = pendingCellsByQuestion.get(qid);
      const dirtyArr = pendingDirtyCellsByQ.has(qid)
        ? Array.from(pendingDirtyCellsByQ.get(qid))
        : undefined;
      pendingCellsByQuestion.delete(qid);
      pendingDirtyCellsByQ.delete(qid);
      if (latest) {
        publishStudentQuestionCells(qid, latest, false, dirtyArr, {
          suppressPresenceRefresh: Boolean(leavingRoom)
        });
      }
    });
  }

  function submitSingleCell(questionId, inputId, cellsObj) {
    if (!questionId || !inputId || !cellsObj) return false;
    const val = String(cellsObj[inputId] || "").trim();
    if (!val) return false;
    const prevT = debounceTimers.get(questionId);
    if (prevT) {
      clearTimeout(prevT);
      debounceTimers.delete(questionId);
    }
    pendingCellsByQuestion.delete(questionId);
    const dirtySet = pendingDirtyCellsByQ.has(questionId)
      ? pendingDirtyCellsByQ.get(questionId)
      : new Set();
    dirtySet.add(inputId);
    pendingDirtyCellsByQ.delete(questionId);
    submittedTextByCell[inputId] = val;
    saveSubmittedCellsStore();
    publishStudentQuestionCells(questionId, cellsObj, false, Array.from(dirtySet));
    return true;
  }

  function submitQuestionFinal(questionId, cellsObj) {
    const prevT = debounceTimers.get(questionId);
    if (prevT) {
      clearTimeout(prevT);
      debounceTimers.delete(questionId);
    }
    pendingCellsByQuestion.delete(questionId);
    pendingDirtyCellsByQ.delete(questionId);
    publishStudentQuestionCells(questionId, cellsObj, true);
  }

  function clearQuestionResponses(questionId) {
    if (!questionId) return;
    const now = Date.now();
    state.clearedAtByQuestion.set(questionId, now);
    const qMap = state.responsesByQuestion.get(questionId);
    if (qMap) qMap.clear();
    persistRoomResponsesToStorage(state.roomId);
    publishPacket(
      `clear/${questionId}`,
      {
        type: "clear_q",
        questionId,
        clearedAtWallMs: now
      },
      true
    );
    emit("responses", { questionId });
  }

  function getQuestionResponses(questionId) {
    const qMap = state.responsesByQuestion.get(questionId);
    if (!qMap) return [];
    return Array.from(qMap.values()).sort((a, b) => {
      if (a.status !== b.status) return a.status === "submitted" ? -1 : 1;
      const diffTs = (b.updatedWallMs || 0) - (a.updatedWallMs || 0);
      if (Math.abs(diffTs) > 1000) return diffTs;
      return String(a.studentId || a.participantId || "").localeCompare(String(b.studentId || b.participantId || ""));
    });
  }

  // Strictly returns ONLY the active student's own response (never another student's or shared team sheet)
  function getMyTeamResponse(questionId) {
    if (!questionId) return null;
    const qMap = state.responsesByQuestion.get(questionId);
    if (!qMap) return null;
    const sid = String(state.studentId || "").trim();
    if (sid) {
      return qMap.get(`sid_${sid}`) || null;
    }
    return null;
  }

  function getCellResponses(questionId, inputId) {
    const qMap = state.responsesByQuestion.get(questionId);
    if (!qMap || !inputId) return [];
    const items = [];
    qMap.forEach((rec) => {
      const txt = rec.cells && rec.cells[inputId];
      if (!txt || !String(txt).trim()) return;
      const cStat =
        rec.cellStatuses && rec.cellStatuses[inputId]
          ? rec.cellStatuses[inputId]
          : rec.status === "submitted"
          ? "submitted"
          : "typing";
      const cellEditor =
        (rec.cellEditors && rec.cellEditors[inputId]) || rec.editorLabel || "";
      items.push({
        participantId: rec.participantId,
        teamId: clampTeamOrZero(rec.teamId),
        studentId: rec.studentId || "",
        shortNo: rec.shortNo || (rec.studentId ? String(rec.studentId).slice(-3) : ""),
        fullName: rec.fullName || "",
        displayName: rec.displayName,
        editorLabel: cellEditor,
        nickname: rec.nickname || "",
        area: rec.area || "",
        disc: rec.disc || 0,
        questionId,
        inputId,
        text: String(txt).trim(),
        status: cStat === "submitted" ? "submitted" : "typing",
        updatedWallMs: (rec.cellUpdatedMs && rec.cellUpdatedMs[inputId]) || rec.updatedWallMs || 0,
        fullRecord: rec
      });
    });
    return items.sort((a, b) => {
      if (a.status !== b.status) return a.status === "submitted" ? -1 : 1;
      const diffTs = (b.updatedWallMs || 0) - (a.updatedWallMs || 0);
      if (Math.abs(diffTs) > 1000) return diffTs;
      return String(a.studentId || a.participantId || "").localeCompare(String(b.studentId || b.participantId || ""));
    });
  }

  function getRoomRespondedStudentsSummary(questionIdsOpt) {
    const targetQIds =
      Array.isArray(questionIdsOpt) && questionIdsOpt.length
        ? questionIdsOpt
        : Array.from(state.responsesByQuestion.keys());
    const byPid = new Map();
    const countByQuestion = {};
    targetQIds.forEach((qid) => {
      const list = getQuestionResponses(qid);
      countByQuestion[qid] = {
        total: list.length,
        submitted: list.filter((r) => r.status === "submitted").length,
        typing: list.filter((r) => r.status !== "submitted").length
      };
      list.forEach((rec) => {
        if (!rec || !rec.participantId) return;
        let entry = byPid.get(rec.participantId);
        if (!entry) {
          entry = {
            participantId: rec.participantId,
            studentId: rec.studentId || "",
            shortNo: rec.shortNo || (rec.studentId ? String(rec.studentId).slice(-3) : ""),
            fullName: rec.fullName || "",
            nickname: rec.nickname || "",
            displayName: rec.displayName || "",
            editorLabel: rec.editorLabel || "",
            area: rec.area || "",
            disc: rec.disc || 0,
            questions: {},
            answeredQuestionCount: 0,
            submittedQuestionCount: 0,
            latestUpdatedMs: 0
          };
          byPid.set(rec.participantId, entry);
        }
        entry.questions[qid] = rec;
        entry.answeredQuestionCount += 1;
        if (rec.status === "submitted") entry.submittedQuestionCount += 1;
        if ((rec.updatedWallMs || 0) > entry.latestUpdatedMs) {
          entry.latestUpdatedMs = rec.updatedWallMs || 0;
        }
      });
    });
    const students = Array.from(byPid.values()).sort((a, b) =>
      String(a.studentId || a.participantId).localeCompare(String(b.studentId || b.participantId))
    );
    return {
      roomId: state.roomId,
      totalRespondedStudents: students.length,
      students,
      byPid,
      countByQuestion
    };
  }

  function setFollowTeacher(flag) {
    state.followTeacher = Boolean(flag);
    safeSetStorage("racm303_live_follow_v1", state.followTeacher ? "1" : "0");
  }

  function setAnonymousWall(flag) {
    state.anonymousWall = Boolean(flag);
    try {
      if (state.bc) {
        state.bc.postMessage({ type: "local_anon_wall", anonymousWall: state.anonymousWall });
      }
    } catch (_) {}
    emit("responses", { questionId: "*" });
  }

  function setSoundMuted(flag) {
    state.soundMuted = Boolean(flag);
    safeSetStorage("racm303_live_mute_v1", state.soundMuted ? "1" : "0");
  }

  function resetRoomCheckin() {
    return null;
  }

  let initialized = false;
  let bfcacheSavedSession = null;

  function startEngine() {
    if (initialized) return;
    initialized = true;
    try {
      localStorage.removeItem("racm303_live_anon_v1");
      localStorage.removeItem("racm303_live_checkin_reset_v1");
    } catch (_) {}
    hydratePresenceRegistryFromStorage(false);
    hydrateRoomResponsesFromStorage(state.roomId, false);
    initBroadcastChannel();
    initMqttBrokers();
    initPeerForRoom();
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("storage", (ev) => {
        if (!ev || !ev.key || ev.key === PRESENCE_STORAGE_KEY) {
          hydratePresenceRegistryFromStorage(true);
        }
        if (!ev || !ev.key || String(ev.key).startsWith(ROOM_RESP_STORAGE_PREFIX)) {
          hydrateRoomResponsesFromStorage(state.roomId, true);
        }
      });
      window.addEventListener("online", () => {
        hydratePresenceRegistryFromStorage(true);
        hydrateRoomResponsesFromStorage(state.roomId, true);
        publishPresence();
        if (state.role === "faculty") {
          requestAllRoomsSnapshot();
        } else {
          requestRoomSnapshot();
        }
      });
      const onWindowUnload = () => {
        if (state.role !== "faculty") {
          if (state.sessionJoined && state.joinedRoomId && state.studentId) {
            bfcacheSavedSession = {
              roomId: state.joinedRoomId,
              activeModule: normalizeModuleId(state.activeModule)
            };
          }
          if (state.sessionJoined || getRoomPresenceMap(state.joinedRoomId || state.roomId).has(clientInstanceId)) {
            leaveCurrentRoom({ fromUnload: true });
          }
        } else {
          const facTopic = `${TOPIC_NS}/room-${clampRoom(state.roomId)}/presence/${clientInstanceId}`;
          state.mqttClients.forEach((c) => {
            try {
              if (c && c.connected) c.publish(facTopic, "", { qos: 0, retain: true });
            } catch (_) {}
          });
        }
      };
      window.addEventListener("pagehide", onWindowUnload);
      window.addEventListener("beforeunload", onWindowUnload);
      window.addEventListener("pageshow", (ev) => {
        if (ev && ev.persisted && state.role !== "faculty" && bfcacheSavedSession && state.studentId) {
          state.sessionJoined = true;
          state.joinedRoomId = clampRoom(bfcacheSavedSession.roomId);
          state.activeModule = normalizeModuleId(bfcacheSavedSession.activeModule);
          state.joinedWallMs = state.joinedWallMs || Date.now();
          bfcacheSavedSession = null;
          hydratePresenceRegistryFromStorage(false);
          publishPresence();
          schedulePresenceBurst();
          requestRoomSnapshot(state.joinedRoomId);
        }
      });
      window.addEventListener("focus", () => {
        if (state.role === "faculty" || (state.sessionJoined && state.joinedRoomId && state.studentId)) {
          publishPresence();
        }
      });
      if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) {
            hydratePresenceRegistryFromStorage(true);
            hydrateRoomResponsesFromStorage(state.roomId, true);
            publishPresence();
            if (state.role === "faculty") {
              requestAllRoomsSnapshot();
            } else {
              requestRoomSnapshot();
            }
          }
        });
      }
    }
    publishPresence();
    if (state.role === "faculty") {
      requestAllRoomsSnapshot();
    } else {
      requestRoomSnapshot();
    }
  }

  window.RACM_LIVE_CLASSROOM = {
    rooms: ROOM_DEFS,
    teams: TEAM_DEFS,
    startEngine,
    on,
    getRoomId: () => state.roomId,
    getJoinedRoomId: () => state.joinedRoomId || 0,
    getStudentId: () => state.studentId || "",
    getRoomDef: (id) => ROOM_DEFS.find((r) => r.id === clampRoom(id || state.roomId)) || ROOM_DEFS[0],
    setRoom,
    getTeamId: () => clampTeamOrZero(state.teamId),
    getTeamDef: (id) => TEAM_DEFS.find((t) => t.id === clampTeam(id || state.teamId)) || TEAM_DEFS[0],
    setTeam,
    getSmartTeamBalance,
    setStudentProfile,
    joinSessionWithStudent,
    checkinStudentToRoom,
    leaveCurrentRoom,
    logoutStudentSession,
    resetRoomCheckin,
    getRoomCheckinResetId,
    getRoomCheckinResetAt,
    isSessionJoined: () => Boolean(state.sessionJoined),
    setActiveModule,
    getActiveModule: () => normalizeModuleId(state.activeModule),
    setActiveStudentSlide,
    requestRoomSnapshot,
    requestAllRoomsSnapshot,
    setCustomDisplayName,
    getDisplayName: getEffectiveDisplayName,
    getEditorShortDisplay,
    getParticipantId: () => state.participantId,
    getConnectionStatus,
    getPresenceSummary,
    getAllRoomsPresenceSummary,
    findStudentLivePresence,
    syncFromStorage: () => {
      hydratePresenceRegistryFromStorage(true);
      hydrateRoomResponsesFromStorage(state.roomId, true);
    },
    getTimerSnapshot,
    startTimer,
    togglePauseTimer,
    addTimerSeconds,
    resetTimer,
    clearTimeUpAlert,
    broadcastTeacherQuestionPointer,
    getTeacherPointer: () => Object.assign({}, state.teacherPointer),
    setConceptSummaryUnlocked,
    isConceptSummaryUnlocked,
    getUnlockedConceptSummaries,
    queueLiveTyping,
    flushLiveTyping,
    flushAllPendingLiveTyping,
    submitSingleCell,
    submitQuestionFinal,
    getCellSubmissionState,
    hasSubmittedQuestionCells,
    clearSubmittedCells,
    clearQuestionResponses,
    getQuestionResponses,
    getMyTeamResponse,
    getMyOwnResponse: getMyTeamResponse,
    getCellResponses,
    getRoomRespondedStudentsSummary,
    getFollowTeacher: () => state.followTeacher,
    setFollowTeacher,
    getAnonymousWall: () => state.anonymousWall,
    setAnonymousWall,
    getSoundMuted: () => state.soundMuted,
    setSoundMuted
  };
})();
