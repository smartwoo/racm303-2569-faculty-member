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
  const LIVE_PRESENCE_TTL_MS = 42 * 1000; // 42s live heartbeat TTL — green turns off when student leaves/disconnects
  const HEARTBEAT_INTERVAL_MS = 12 * 1000; // 12s active room heartbeat
  const CHECKED_IN_MAX_AGE_MS = LIVE_PRESENCE_TTL_MS;
  const BROKERS = [
    "wss://mqtt.eclipseprojects.io:443/mqtt",
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt"
  ];

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
      localStorage.setItem(key, val);
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

  const state = {
    role: window.PORTAL_ROLE === "faculty" ? "faculty" : "student",
    roomId: clampRoom(safeGetStorage("racm303_live_room_v1", "1")),
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
    activeModule: "",
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

    // Shared Timer State (drift-free via performance.now())
    timer: {
      seq: 0,
      running: false,
      hasStarted: false,
      hasConfigured: false,
      timedOutInCurrentRun: false,
      configuredDurationSec: 300,
      durationSec: 300,
      baseRemainingMs: 300000,
      anchorPerfNow: performance.now(),
      questionId: "",
      label: "จับเวลาอภิปรายกลุ่มย่อย",
      chimePlayedForSeq: -1
    },

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

    // Multi-Room Presence Registry: Map<roomId (1..6), Map<participantId, PresenceRecord>>
    presenceByRoom: new Map([
      [1, new Map()],
      [2, new Map()],
      [3, new Map()],
      [4, new Map()],
      [5, new Map()],
      [6, new Map()]
    ]),
    // Active room presence alias: Map<participantId, PresenceRecord>
    presence: null
  };

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

  function persistPresenceRegistryToStorage() {
    try {
      const now = Date.now();
      const snapshot = {};
      [1, 2, 3, 4, 5, 6].forEach((rId) => {
        const arr = [];
        getRoomPresenceMap(rId).forEach((rec) => {
          if (!rec || rec.role !== "student" || !rec.studentId || rec.joined === false) return;
          const refMs = Number(rec.lastSeenMs || rec.joinedWallMs || 0);
          if (now - refMs > CHECKED_IN_MAX_AGE_MS) return;
          arr.push({
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
            activeModule: String(rec.activeModule || "").slice(0, 12),
            activeQuestionId: String(rec.activeQuestionId || "").slice(0, 32),
            name: String(rec.name || "").slice(0, 80),
            senderCli: String(rec.senderCli || "").slice(0, 40),
            joinedWallMs: Number(rec.joinedWallMs || now),
            lastSeenMs: Number(rec.lastSeenMs || now)
          });
        });
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
      const storagePidsByRoom = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set(), 6: new Set() };

      [1, 2, 3, 4, 5, 6].forEach((rId) => {
        const list = Array.isArray(roomsObj[rId]) ? roomsObj[rId] : [];
        const rMap = getRoomPresenceMap(rId);
        list.forEach((rec) => {
          if (!rec || !rec.studentId || rec.joined === false) return;
          const refMs = Number(rec.lastSeenMs || rec.joinedWallMs || 0);
          if (now - refMs > CHECKED_IN_MAX_AGE_MS) return;
          const pid = String(rec.participantId || `sid_${rec.studentId}`).slice(0, 48);
          storagePidsByRoom[rId].add(pid);
          const prev = rMap.get(pid);
          if (
            !prev ||
            (Number(rec.lastSeenMs) || 0) > (Number(prev.lastSeenMs) || 0) ||
            clampTeamOrZero(rec.teamId) !== clampTeamOrZero(prev.teamId)
          ) {
            rMap.set(pid, Object.assign({}, prev || {}, rec, { roomId: rId, joined: true, fromStorage: true }));
            changed = true;
          }
        });
        // Remove any storage-backed or local student entry that left or expired in another tab
        rMap.forEach((existing, pid) => {
          if (
            existing &&
            existing.role === "student" &&
            existing.fromStorage &&
            !storagePidsByRoom[rId].has(pid) &&
            !(state.sessionJoined && rId === state.joinedRoomId && pid === state.participantId)
          ) {
            rMap.delete(pid);
            changed = true;
          }
        });
      });
    } catch (_) {}
    if (changed && shouldEmit) {
      emit("presence", getPresenceSummary());
    }
    return changed;
  }

  hydratePresenceRegistryFromStorage(false);

  const RETAINED_STALE_MS = 90 * 60 * 1000;
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
          if (uMs && now - uMs > RETAINED_STALE_MS) return;
          if (!Object.keys(rec.cells).length) return;
          arr.push(rec);
        });
        if (arr.length) questionsObj[qid] = arr;
      });
      const clearedObj = {};
      state.clearedAtByQuestion.forEach((ts, qid) => {
        if (ts && now - ts <= RETAINED_STALE_MS) clearedObj[qid] = ts;
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
                if (uMs && now - uMs > RETAINED_STALE_MS) return;
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
          if (!uMs || now - uMs > RETAINED_STALE_MS || uMs <= cTs) return;
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

  const listeners = {
    timer: new Set(),
    responses: new Set(),
    presence: new Set(),
    pointer: new Set(),
    concept_unlock: new Set(),
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

  function getTimerRemainingMs() {
    const t = state.timer;
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

  function getTimerSnapshot() {
    const remMs = getTimerRemainingMs();
    const durMs = Math.max(1000, (state.timer.durationSec || 300) * 1000);
    return {
      running: state.timer.running && remMs > 0,
      remainingMs: remMs,
      durationSec: state.timer.durationSec || 300,
      configuredDurationSec: state.timer.configuredDurationSec || state.timer.durationSec || 300,
      pct: Math.max(0, Math.min(100, (remMs / durMs) * 100)),
      formatted: formatMs(remMs),
      isWarning: Boolean(state.timer.running) && remMs > 0 && remMs <= 60000,
      isUrgent: Boolean(state.timer.running) && remMs > 0 && remMs <= 15000,
      isTimeUp: Boolean(state.timer.timedOutInCurrentRun) && !state.timer.running && remMs === 0,
      hasStarted: Boolean(state.timer.hasStarted),
      hasConfigured: Boolean(state.timer.hasConfigured),
      label: state.timer.label || "",
      questionId: state.timer.questionId || ""
    };
  }

  // Tick loop every 250ms so countdown updates smoothly across Student & Teacher
  setInterval(() => {
    if (state.timer.running) {
      const rem = getTimerRemainingMs();
      if (rem <= 0) {
        state.timer.running = false;
        state.timer.baseRemainingMs = 0;
        state.timer.timedOutInCurrentRun = true;
        if (state.timer.chimePlayedForSeq !== state.timer.seq) {
          state.timer.chimePlayedForSeq = state.timer.seq;
          playTimerChime();
        }
      }
      emit("timer", getTimerSnapshot());
    }
  }, 250);

  // Prune offline/disconnected presence entries across all 6 rooms every 5s & send active room heartbeat every 12s
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    [1, 2, 3, 4, 5, 6].forEach((rId) => {
      const rMap = getRoomPresenceMap(rId);
      rMap.forEach((val, key) => {
        if (
          (state.role === "faculty" && rId === state.roomId && key === state.participantId) ||
          (state.role !== "faculty" && state.sessionJoined && rId === state.joinedRoomId && key === state.participantId)
        ) {
          return;
        }
        const maxAgeMs = val && val.role === "faculty" ? 65000 : LIVE_PRESENCE_TTL_MS;
        const refMs = Number((val && val.lastSeenMs) || (val && val.joinedWallMs) || 0);
        if (!refMs || now - refMs > maxAgeMs) {
          rMap.delete(key);
          changed = true;
        }
      });
    });
    if (changed) {
      persistPresenceRegistryToStorage();
      emit("presence", getPresenceSummary());
    }
  }, 5000);

  setInterval(() => {
    if (state.role === "faculty" || state.sessionJoined) {
      publishPresence();
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

    // 2. MQTT over WSS (QoS 1 for presence so check-in/login delivery is broker-acknowledged)
    const fullTopic = roomTopic(subpath, targetRoom);
    const qosLevel = String(subpath || "").startsWith("presence") ? 1 : 0;
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

  function handleIncomingPacket(subpath, msg, isRetained) {
    if (!msg || typeof msg !== "object") return;
    if (msg.senderCli === clientInstanceId) return;
    if (rememberMsgId(msg.msgId)) return;

    if (msg.type === "lwt_disconnect") {
      if (isRetained) return;
      const deadCli = String(msg.senderCli || "").trim();
      if (!deadCli) return;
      let removedAny = false;
      [1, 2, 3, 4, 5, 6].forEach((rId) => {
        const rMap = getRoomPresenceMap(rId);
        rMap.forEach((rec, pid) => {
          if (rec && rec.senderCli === deadCli) {
            rMap.delete(pid);
            removedAny = true;
          }
        });
      });
      if (removedAny) {
        persistPresenceRegistryToStorage();
        emit("presence", getPresenceSummary());
      }
      return;
    }

    const pktRoom = clampRoom(msg.roomId || state.roomId);
    const isMultiRoomPresencePkt = msg.type === "presence" || msg.type === "who_is_here";
    if (!isMultiRoomPresencePkt && pktRoom !== state.roomId) return;

    // If faculty receives from a PeerJS student on active room, relay to other PeerJS students
    if (pktRoom === state.roomId && state.role === "faculty" && state.peerConns.size > 1) {
      state.peerConns.forEach((conn) => {
        try {
          if (conn && conn.open) conn.send({ subpath, msg });
        } catch (_) {}
      });
    }

    if (msg.type === "timer") {
      const maxRetainedAgeMs = msg.running ? RETAINED_STALE_MS : 10 * 60 * 1000;
      if (isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > maxRetainedAgeMs) {
        return;
      }
      const seq = Number(msg.seq) || 0;
      if (seq < state.timer.seq && msg.sentWallMs < (state.timer.lastWallMs || 0)) return;
      let rem = Math.max(0, Number(msg.remainingMs) || 0);
      if (msg.running && isRetained && msg.sentWallMs) {
        const wallElapsed = Math.max(0, Date.now() - Number(msg.sentWallMs));
        rem = Math.max(0, rem - wallElapsed);
      }
      const durSec = Math.max(1, Number(msg.durationSec) || 300);
      const cfgSec = Math.max(1, Number(msg.configuredDurationSec) || durSec);
      // Never turn any incoming 0-remaining packet (MQTT retained, PeerJS sync, or BroadcastChannel) into a red Time-Up state
      if (rem === 0) {
        const wasActivelyRunningHere = Boolean(state.timer.running);
        state.timer.seq = wasActivelyRunningHere ? Math.max(state.timer.seq + 1, seq) : 0;
        state.timer.configuredDurationSec = cfgSec;
        state.timer.durationSec = durSec;
        state.timer.baseRemainingMs = wasActivelyRunningHere ? 0 : durSec * 1000;
        state.timer.anchorPerfNow = performance.now();
        state.timer.running = false;
        state.timer.hasStarted = wasActivelyRunningHere;
        state.timer.hasConfigured = wasActivelyRunningHere;
        state.timer.timedOutInCurrentRun = wasActivelyRunningHere;
        state.timer.lastWallMs = Number(msg.sentWallMs) || Date.now();
        emit("timer", getTimerSnapshot());
        return;
      }
      state.timer.seq = Math.max(state.timer.seq + 1, seq);
      state.timer.configuredDurationSec = cfgSec;
      state.timer.durationSec = durSec;
      state.timer.baseRemainingMs = rem;
      state.timer.anchorPerfNow = performance.now();
      state.timer.running = Boolean(msg.running) && rem > 0;
      state.timer.timedOutInCurrentRun = false;
      if (state.timer.running) {
        state.timer.hasStarted = true;
        state.timer.hasConfigured = true;
      } else if (!isRetained) {
        state.timer.hasStarted = Boolean(msg.hasStarted);
        state.timer.hasConfigured =
          msg.hasConfigured !== undefined ? Boolean(msg.hasConfigured) : rem > 0;
      } else {
        state.timer.hasStarted = false;
        state.timer.hasConfigured = Boolean(msg.hasConfigured);
      }
      state.timer.label = String(msg.label || "จับเวลาอภิปรายกลุ่มย่อย").slice(0, 100);
      state.timer.questionId = String(msg.questionId || "").slice(0, 32);
      state.timer.lastWallMs = Number(msg.sentWallMs) || Date.now();
      if (rem > 0) state.timer.chimePlayedForSeq = -1;
      emit("timer", getTimerSnapshot());
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
          if (!wasUnlocked) {
            emit("concept_unlock", { questionId: qid, unlocked: true, isRetained: Boolean(isRetained) });
          }
        }
      }
      emit("pointer", Object.assign({}, state.teacherPointer));
      return;
    }

    if (msg.type === "concept_unlock") {
      if (isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > RETAINED_STALE_MS) {
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

      // Refresh sender student's individual presence so Live Lobby stays accurate
      const senderPid = sidClean ? `sid_${sidClean}` : (!pid.startsWith("team_") ? pid : "");
      if (senderPid && sidClean) {
        const rMap = getRoomPresenceMap(pktRoom);
        const prevPres = rMap.get(senderPid) || {};
        rMap.set(
          senderPid,
          Object.assign({}, prevPres, {
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
            activeQuestionId: qid,
            lastSeenMs: Date.now()
          })
        );
        persistPresenceRegistryToStorage();
        emit("presence", getPresenceSummary());
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
      if (isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > RETAINED_STALE_MS) {
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
              fullName: state.fullName || ""
            }),
            true,
            pktRoom
          );
        });
      }
      if (pktRoom === state.roomId && state.role === "faculty") {
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
      if (!pid || pid.startsWith("team_")) return;
      const rMap = getRoomPresenceMap(pktRoom);
      if (msg.left || (msg.role !== "faculty" && msg.joined === false)) {
        let removed = rMap.delete(pid);
        const leftSid = String(msg.studentId || "").trim();
        if (leftSid) {
          [1, 2, 3, 4, 5, 6].forEach((otherR) => {
            if (getRoomPresenceMap(otherR).delete(`sid_${leftSid}`)) removed = true;
          });
        }
        if (removed) {
          persistPresenceRegistryToStorage();
          emit("presence", getPresenceSummary());
        }
        return;
      }
      const maxRetainedAge = msg.role === "faculty" ? 65000 : LIVE_PRESENCE_TTL_MS;
      const refWallMs = Number(msg.lastSeenMs || msg.sentWallMs || msg.joinedWallMs || 0);
      if (isRetained && (!refWallMs || Date.now() - refWallMs > maxRetainedAge)) {
        return;
      }
      const prevPres = rMap.get(pid) || {};
      const sidStr = String(msg.studentId || prevPres.studentId || "").slice(0, 16);
      // Remove stale record from other rooms so each student only appears in their active room
      if (sidStr && msg.role !== "faculty") {
        [1, 2, 3, 4, 5, 6].forEach((otherR) => {
          if (otherR !== pktRoom) {
            getRoomPresenceMap(otherR).delete(`sid_${sidStr}`);
          }
        });
      }
      rMap.set(pid, {
        participantId: pid,
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
        activeModule: String(msg.activeModule || prevPres.activeModule || "").slice(0, 12),
        activeQuestionId: String(msg.activeQuestionId || prevPres.activeQuestionId || "").slice(0, 32),
        name: String(msg.name || prevPres.name || "ผู้เข้าร่วม").slice(0, 80),
        senderCli: String(msg.senderCli || prevPres.senderCli || "").slice(0, 40),
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
      emit("presence", getPresenceSummary());
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
    const lwtPayload = JSON.stringify({
      type: "lwt_disconnect",
      msgId: randomId("lwt"),
      senderCli: clientInstanceId
    });
    BROKERS.forEach((url, idx) => {
      try {
        const tag = `mqtt${idx + 1}`;
        const client = window.mqtt.connect(url, {
          clientId: `racm303_${state.role}_${Math.random().toString(16).slice(2, 10)}`,
          clean: true,
          connectTimeout: 7000,
          reconnectPeriod: 4000,
          keepalive: 22,
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
                const gonePid = subpath.slice("presence/".length).trim();
                const rMap = getRoomPresenceMap(topicRoom);
                if (gonePid && rMap.has(gonePid)) {
                  rMap.delete(gonePid);
                  persistPresenceRegistryToStorage();
                  emit("presence", getPresenceSummary());
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
              conn.send({
                subpath: "timer",
                msg: {
                  type: "timer",
                  msgId: randomId("sync"),
                  roomId: state.roomId,
                  seq: state.timer.seq,
                  running: state.timer.running,
                  durationSec: state.timer.durationSec,
                  remainingMs: getTimerRemainingMs(),
                  label: state.timer.label,
                  questionId: state.timer.questionId,
                  sentWallMs: Date.now()
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
              getRoomPresenceMap(state.roomId).forEach((pRec) => {
                conn.send({
                  subpath: `presence/${pRec.participantId}`,
                  msg: Object.assign({ type: "presence", msgId: randomId("sync"), roomId: state.roomId, sentWallMs: Date.now() }, pRec)
                });
              });
            } catch (_) {}
          });
          conn.on("data", (data) => {
            if (data && data.msg) handleIncomingPacket(data.subpath || "", data.msg, false);
          });
          conn.on("close", () => state.peerConns.delete(conn.peer));
          conn.on("error", () => state.peerConns.delete(conn.peer));
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
  setInterval(() => {
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
    [650, 1800, 4200].forEach((delayMs) => {
      const t = setTimeout(() => {
        if (state.role === "faculty" || state.sessionJoined) {
          publishPresence();
        }
      }, delayMs);
      burstTimers.push(t);
    });
  }

  function publishPresence() {
    // Students only broadcast active green presence when identified and actively inside their joined room
    if (state.role !== "faculty" && (!state.sessionJoined || !state.joinedRoomId || !state.studentId)) {
      emit("presence", getPresenceSummary());
      return;
    }
    const pubRoom = state.role === "faculty" ? state.roomId : clampRoom(state.joinedRoomId);
    const myName = getEffectiveDisplayName();
    if (!state.joinedWallMs) state.joinedWallMs = Date.now();
    const myShortNo = state.shortNo || (state.studentId ? String(state.studentId).slice(-3) : "");
    const now = Date.now();
    const myRec = {
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
      activeModule: state.activeModule || "",
      activeQuestionId: state.activeQuestionId || "",
      name: myName,
      senderCli: clientInstanceId,
      joinedWallMs: state.joinedWallMs,
      lastSeenMs: now
    };
    if (state.role !== "faculty" && state.studentId) {
      [1, 2, 3, 4, 5, 6].forEach((otherR) => {
        if (otherR !== pubRoom) {
          getRoomPresenceMap(otherR).delete(state.participantId);
        }
      });
    }
    const rMap = getRoomPresenceMap(pubRoom);
    rMap.set(state.participantId, myRec);
    if (state.role !== "faculty" && state.studentId) {
      persistPresenceRegistryToStorage();
    }
    publishPacket(
      `presence/${state.participantId}`,
      Object.assign({ type: "presence" }, myRec),
      true,
      pubRoom
    );
    emit("presence", getPresenceSummary());
  }

  function getPresenceSummary(roomIdOpt) {
    const targetRoom = clampRoom(roomIdOpt || state.roomId);
    const rMap = getRoomPresenceMap(targetRoom);
    let students = 0;
    let teachers = 0;
    const list = [];
    const joinedStudents = [];
    const teamCounts = { 1: 0, 2: 0, 3: 0 };
    const teamMembers = { 1: [], 2: [], 3: [] };
    const seenSids = new Set();
    rMap.forEach((p) => {
      if (p.role === "faculty") {
        teachers += 1;
        list.push(p);
      } else if (p.joined !== false && p.studentId) {
        const sidKey = String(p.studentId);
        if (seenSids.has(sidKey)) return;
        seenSids.add(sidKey);
        students += 1;
        list.push(p);
        joinedStudents.push(p);
        const tid = clampTeamOrZero(p.teamId);
        if (tid >= 1 && tid <= 3) {
          teamCounts[tid] += 1;
          teamMembers[tid].push(p);
        }
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
      total: students + teachers,
      students,
      teachers,
      list,
      joinedStudents,
      teamCounts,
      teamMembers
    };
  }

  function getAllRoomsPresenceSummary() {
    const rooms = {};
    let totalJoinedStudents = 0;
    [1, 2, 3, 4, 5, 6].forEach((rId) => {
      const sum = getPresenceSummary(rId);
      rooms[rId] = sum;
      totalJoinedStudents += sum.students;
    });
    return { rooms, totalJoinedStudents };
  }

  function findStudentLivePresence(studentId) {
    const sid = String(studentId || "").trim();
    if (!sid) return null;
    for (let rId = 1; rId <= 6; rId += 1) {
      const rMap = getRoomPresenceMap(rId);
      const direct = rMap.get(`sid_${sid}`);
      if (direct && direct.joined !== false) {
        return { roomId: rId, record: direct };
      }
      for (const [, rec] of rMap.entries()) {
        if (rec && rec.role !== "faculty" && rec.joined !== false && String(rec.studentId || "") === sid) {
          return { roomId: rId, record: rec };
        }
      }
    }
    return null;
  }

  function getSmartTeamBalance(excludeStudentIdOpt, totalExpectedOpt, roomIdOpt) {
    const targetRoom = clampRoom(roomIdOpt || state.roomId);
    const rMap = getRoomPresenceMap(targetRoom);
    const excludeSid = String(excludeStudentIdOpt || "").trim();
    const excludePid = excludeSid ? `sid_${excludeSid}` : "";
    const counts = { 1: 0, 2: 0, 3: 0 };
    const otherCounts = { 1: 0, 2: 0, 3: 0 };

    rMap.forEach((p) => {
      if (!p || p.role === "faculty" || p.joined === false) return;
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
      const prevPid = state.participantId;
      const prevSid = state.studentId;
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
      if (prevPid && prevPid !== persistentPid) {
        [1, 2, 3, 4, 5, 6].forEach((rId) => {
          const m = getRoomPresenceMap(rId);
          m.delete(prevPid);
          if (prevSid) m.delete(`sid_${prevSid}`);
        });
      }
      emit("presence", getPresenceSummary());
      return;
    }
    const prevPid = state.participantId;
    const prevSid = state.studentId;
    const nextSid = String(studentObj.id).trim();
    state.studentId = nextSid;
    state.shortNo = nextSid.slice(-3);
    state.participantId = `sid_${nextSid}`;
    if (prevPid && prevPid !== state.participantId) {
      [1, 2, 3, 4, 5, 6].forEach((rId) => getRoomPresenceMap(rId).delete(prevPid));
    }
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
      emit("presence", getPresenceSummary());
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
      emit("presence", getPresenceSummary());
    }
    emit("responses", { questionId: "*", teamId: next });
  }

  function broadcastStudentLeaveFromRoom(oldPid, oldSid, oldRoom, fromUnload) {
    if (!oldPid || !oldRoom) return;
    [1, 2, 3, 4, 5, 6].forEach((rId) => {
      const m = getRoomPresenceMap(rId);
      m.delete(oldPid);
      if (oldSid) m.delete(`sid_${oldSid}`);
    });
    persistPresenceRegistryToStorage();
    const leaveMsg = {
      type: "presence",
      msgId: randomId("leave"),
      roomId: clampRoom(oldRoom),
      senderCli: clientInstanceId,
      sentWallMs: Date.now(),
      participantId: oldPid,
      studentId: oldSid || "",
      role: "student",
      joined: false,
      left: true
    };
    rememberMsgId(leaveMsg.msgId);
    if (state.bc) {
      try {
        state.bc.postMessage({ subpath: `presence/${oldPid}`, msg: leaveMsg, retained: false });
      } catch (_) {}
    }
    if (state.hostConn && state.hostConn.open && clampRoom(oldRoom) === state.roomId) {
      try {
        state.hostConn.send({ subpath: `presence/${oldPid}`, msg: leaveMsg });
      } catch (_) {}
    }
    const topic = `${TOPIC_NS}/room-${clampRoom(oldRoom)}/presence/${oldPid}`;
    const raw = JSON.stringify(leaveMsg);
    const qos = fromUnload ? 0 : 1;
    state.mqttClients.forEach((c) => {
      try {
        if (c && c.connected) c.publish(topic, raw, { qos, retain: true });
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
    if (state.sessionJoined && state.joinedRoomId && state.joinedRoomId !== targetRoom) {
      broadcastStudentLeaveFromRoom(state.participantId, state.studentId, state.joinedRoomId, false);
    }
    const existingPres = studentObj && studentObj.id ? findStudentLivePresence(studentObj.id) : null;
    state.sessionJoined = true;
    state.joinedRoomId = targetRoom;
    state.joinedWallMs =
      (existingPres && existingPres.record && existingPres.record.joinedWallMs) ||
      state.joinedWallMs ||
      Date.now();
    safeSetSession("racm303_hsd_session_joined_v1", "1");
    if (activeModuleOpt) state.activeModule = String(activeModuleOpt);
    state.teamId = clampTeamOrZero(teamIdOpt);
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
    publishPresence();
    schedulePresenceBurst();
    requestRoomSnapshot(targetRoom);
    emit("responses", { questionId: "*", teamId: state.teamId });
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
    const rMap = getRoomPresenceMap(targetRoom);
    const prevPres = rMap.get(pid) || {};
    const teamNum = clampTeamOrZero(teamIdOpt);
    const now = Date.now();
    const nick = String(studentObj.nickname || studentObj.nick || "").trim().slice(0, 32);
    const fullName = String(studentObj.fullName || studentObj.name || "").trim().slice(0, 80);
    const dispLabel = nick ? `รหัส ${sidStr} (${shortNo} · ${nick} ${fullName})` : `รหัส ${sidStr} (${fullName})`;
    const rec = {
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
      activeModule: String(activeModuleOpt || state.activeModule || "HS1").slice(0, 12),
      activeQuestionId: String(prevPres.activeQuestionId || "").slice(0, 32),
      name: dispLabel.slice(0, 80),
      senderCli: clientInstanceId,
      joinedWallMs: prevPres.joinedWallMs || now,
      lastSeenMs: now
    };
    rMap.set(pid, rec);
    persistPresenceRegistryToStorage();
    publishPacket(`presence/${pid}`, Object.assign({ type: "presence" }, rec), true, targetRoom);
    [700, 2000].forEach((ms) => {
      setTimeout(() => {
        if (rMap.get(pid) === rec) {
          publishPacket(`presence/${pid}`, Object.assign({ type: "presence" }, rec), true, targetRoom);
        }
      }, ms);
    });
    emit("presence", getPresenceSummary());
    return true;
  }

  function leaveCurrentRoom(opts) {
    if (state.role === "faculty") return false;
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
    safeSetSession("racm303_hsd_session_joined_v1", null);
    if (wasJoined && oldPid) {
      broadcastStudentLeaveFromRoom(oldPid, oldSid, oldRoom, Boolean(opts && opts.fromUnload));
    }
    emit("presence", getPresenceSummary());
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
    lastPublishedLocalCellsByQ.clear();
    pendingCellsByQuestion.clear();
    pendingDirtyCellsByQ.clear();
    reloadSubmittedCellsForActiveStudent();
    safeSetSession("racm303_hsd_session_joined_v1", null);
    safeSetSession("racm303_hsd_team_id_v1", null);
    safeSetStorage("racm303_live_room_v1", null);
    safeSetStorage("racm303_live_team_v1", null);
    if (oldPid) {
      broadcastStudentLeaveFromRoom(oldPid, effSid, oldRoom, false);
      if (effSid) {
        setTimeout(() => {
          if (!state.sessionJoined || state.studentId !== effSid) {
            broadcastStudentLeaveFromRoom(`sid_${effSid}`, effSid, oldRoom, false);
          }
        }, 1600);
      }
    }
    emit("presence", getPresenceSummary());
  }

  function setActiveStudentSlide(moduleId, questionId) {
    const nextMod = String(moduleId || "");
    const nextQ = String(questionId || "");
    if (state.activeModule === nextMod && state.activeQuestionId === nextQ) return;
    state.activeModule = nextMod;
    state.activeQuestionId = nextQ;
    if (state.role !== "faculty" && state.sessionJoined && state.joinedRoomId) {
      publishPresence();
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

    // Reset room-scoped question/timer caches when switching rooms (NEVER wipe multi-room presenceByRoom!)
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
      state.timer = {
        seq: 0,
        running: false,
        hasStarted: false,
        hasConfigured: false,
        timedOutInCurrentRun: false,
        durationSec: 300,
        baseRemainingMs: 300000,
        anchorPerfNow: performance.now(),
        questionId: "",
        label: "จับเวลาอภิปรายกลุ่มย่อย",
        chimePlayedForSeq: -1
      };
    }

    hydrateRoomResponsesFromStorage(next, false);
    state.mqttClients.forEach((c) => subscribeCurrentRoomMqtt(c));
    if (initialized) {
      initPeerForRoom();
      publishPresence();
      requestRoomSnapshot(next);
    }
    emit("presence", getPresenceSummary());
    emit("timer", getTimerSnapshot());
    emit("responses", { questionId: "*" });
    emit("concept_unlock", { questionId: "*", unlocked: false, roomChanged: true });
  }

  /* ---------- Teacher Timer & Slide Pointer Controls ---------- */
  function startTimer(durationSec, questionId, label) {
    const sec = Math.max(
      1,
      Math.min(10800, Math.round(Number(durationSec) || state.timer.configuredDurationSec || state.timer.durationSec || 300))
    );
    state.timer.seq += 1;
    state.timer.configuredDurationSec = sec;
    state.timer.durationSec = sec;
    state.timer.baseRemainingMs = sec * 1000;
    state.timer.anchorPerfNow = performance.now();
    state.timer.running = true;
    state.timer.hasStarted = true;
    state.timer.hasConfigured = true;
    state.timer.timedOutInCurrentRun = false;
    state.timer.chimePlayedForSeq = -1;
    if (questionId !== undefined) state.timer.questionId = questionId;
    if (label !== undefined) state.timer.label = label;

    publishPacket(
      "timer",
      {
        type: "timer",
        seq: state.timer.seq,
        running: true,
        hasStarted: true,
        hasConfigured: true,
        configuredDurationSec: sec,
        durationSec: sec,
        remainingMs: sec * 1000,
        questionId: state.timer.questionId,
        label: state.timer.label
      },
      true
    );
    emit("timer", getTimerSnapshot());
  }

  function togglePauseTimer() {
    const rem = getTimerRemainingMs();
    state.timer.seq += 1;
    if (state.timer.running) {
      state.timer.running = false;
      state.timer.baseRemainingMs = rem;
    } else {
      const fallbackSec = state.timer.configuredDurationSec || state.timer.durationSec || 300;
      const nextMs = rem > 0 ? rem : fallbackSec * 1000;
      if (rem <= 0) state.timer.durationSec = fallbackSec;
      state.timer.baseRemainingMs = nextMs;
      state.timer.anchorPerfNow = performance.now();
      state.timer.running = true;
      state.timer.hasStarted = true;
      state.timer.hasConfigured = true;
      state.timer.timedOutInCurrentRun = false;
      state.timer.chimePlayedForSeq = -1;
    }
    publishPacket(
      "timer",
      {
        type: "timer",
        seq: state.timer.seq,
        running: state.timer.running,
        hasStarted: state.timer.hasStarted,
        hasConfigured: state.timer.hasConfigured,
        configuredDurationSec: state.timer.configuredDurationSec || state.timer.durationSec || 300,
        durationSec: state.timer.durationSec,
        remainingMs: state.timer.baseRemainingMs,
        questionId: state.timer.questionId,
        label: state.timer.label
      },
      true
    );
    emit("timer", getTimerSnapshot());
  }

  function addTimerSeconds(deltaSec) {
    const cur = getTimerRemainingMs();
    const delta = Number.isFinite(Number(deltaSec)) ? Number(deltaSec) : 60;
    const nextMs = Math.max(0, Math.min(10800 * 1000, cur + delta * 1000));
    state.timer.seq += 1;
    state.timer.baseRemainingMs = nextMs;
    state.timer.anchorPerfNow = performance.now();
    if (nextMs > 0) {
      state.timer.chimePlayedForSeq = -1;
      state.timer.hasConfigured = true;
      state.timer.timedOutInCurrentRun = false;
    }
    state.timer.durationSec = Math.max(state.timer.durationSec, Math.ceil(nextMs / 1000) || 1);
    publishPacket(
      "timer",
      {
        type: "timer",
        seq: state.timer.seq,
        running: state.timer.running,
        hasStarted: state.timer.hasStarted,
        hasConfigured: state.timer.hasConfigured,
        configuredDurationSec: state.timer.configuredDurationSec || 300,
        durationSec: state.timer.durationSec,
        remainingMs: nextMs,
        questionId: state.timer.questionId,
        label: state.timer.label
      },
      true
    );
    emit("timer", getTimerSnapshot());
  }

  function resetTimer(durationSec, isSetReady) {
    const fallbackSec = isSetReady ? state.timer.configuredDurationSec || 300 : 300;
    const sec = Math.max(1, Math.min(10800, Math.round(Number(durationSec) || fallbackSec)));
    state.timer.seq += 1;
    state.timer.running = false;
    state.timer.hasStarted = false;
    state.timer.hasConfigured = Boolean(isSetReady);
    state.timer.timedOutInCurrentRun = false;
    state.timer.configuredDurationSec = sec;
    state.timer.durationSec = sec;
    state.timer.baseRemainingMs = sec * 1000;
    state.timer.anchorPerfNow = performance.now();
    state.timer.chimePlayedForSeq = -1;
    publishPacket(
      "timer",
      {
        type: "timer",
        seq: state.timer.seq,
        running: false,
        hasStarted: false,
        hasConfigured: Boolean(isSetReady),
        configuredDurationSec: sec,
        durationSec: sec,
        remainingMs: sec * 1000,
        questionId: state.timer.questionId,
        label: state.timer.label
      },
      true
    );
    emit("timer", getTimerSnapshot());
  }

  function clearTimeUpAlert() {
    if (!state.timer.timedOutInCurrentRun) return;
    const sec = state.timer.configuredDurationSec || 300;
    state.timer.timedOutInCurrentRun = false;
    state.timer.hasStarted = false;
    state.timer.hasConfigured = false;
    state.timer.durationSec = sec;
    state.timer.baseRemainingMs = sec * 1000;
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

  function publishStudentQuestionCells(questionId, cellsObj, forceSubmitAll, dirtyKeysOpt) {
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

  let initialized = false;
  function startEngine() {
    if (initialized) return;
    initialized = true;
    try {
      localStorage.removeItem("racm303_live_anon_v1");
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
        requestRoomSnapshot();
      });
      const onWindowUnload = () => {
        if (state.role !== "faculty" && state.sessionJoined) {
          leaveCurrentRoom({ fromUnload: true });
        }
      };
      window.addEventListener("pagehide", onWindowUnload);
      window.addEventListener("beforeunload", onWindowUnload);
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
    isSessionJoined: () => Boolean(state.sessionJoined),
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
