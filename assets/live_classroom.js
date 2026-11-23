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
  const BROKERS = [
    "wss://mqtt.eclipseprojects.io:443/mqtt",
    "wss://broker.emqx.io:8084/mqtt"
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
    teamId: clampTeamOrZero(
      safeGetSession("racm303_hsd_team_id_v1", safeGetStorage("racm303_live_team_v1", "0"))
    ),
    participantId: persistentPid,
    sessionJoined:
      window.PORTAL_ROLE === "faculty" ||
      safeGetSession("racm303_hsd_session_joined_v1", "0") === "1",
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
    followTeacher: safeGetStorage("racm303_live_follow_v1", "1") !== "0",
    anonymousWall: safeGetStorage("racm303_live_anon_v1", "0") === "1",
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

    // Presence: Map<participantId, PresenceRecord>
    presence: new Map()
  };

  const RETAINED_STALE_MS = 90 * 60 * 1000;

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

  function roomTopic(subpath) {
    return `${TOPIC_NS}/room-${state.roomId}/${subpath}`;
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

  // Prune stale presence entries every 15s & send heartbeat every 20s
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    state.presence.forEach((val, key) => {
      if (key !== state.participantId && now - (val.lastSeenMs || 0) > 65000) {
        state.presence.delete(key);
        changed = true;
      }
    });
    if (changed) emit("presence", getPresenceSummary());
  }, 15000);

  setInterval(() => {
    publishPresence();
  }, 20000);

  function publishPacket(subpath, payload, retain) {
    const msg = Object.assign({}, payload, {
      msgId: payload.msgId || randomId("pkt"),
      roomId: state.roomId,
      senderCli: clientInstanceId,
      sentWallMs: Date.now()
    });
    rememberMsgId(msg.msgId);

    const raw = JSON.stringify(msg);

    // 1. BroadcastChannel (instant same-browser tabs)
    if (state.bc) {
      try {
        state.bc.postMessage({ subpath, msg, retained: false });
      } catch (_) {}
    }

    // 2. MQTT over WSS
    const fullTopic = roomTopic(subpath);
    state.mqttClients.forEach((client) => {
      try {
        if (client && client.connected) {
          client.publish(fullTopic, raw, { qos: 0, retain: Boolean(retain) });
        }
      } catch (_) {}
    });

    // 3. PeerJS WebRTC DataChannel
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

  function handleIncomingPacket(subpath, msg, isRetained) {
    if (!msg || typeof msg !== "object") return;
    if (Number(msg.roomId) !== state.roomId) return;
    if (msg.senderCli === clientInstanceId) return;
    if (rememberMsgId(msg.msgId)) return;

    // If faculty receives from a PeerJS student, relay to other PeerJS students
    if (state.role === "faculty" && state.peerConns.size > 1) {
      state.peerConns.forEach((conn) => {
        try {
          if (conn && conn.open) conn.send({ subpath, msg });
        } catch (_) {}
      });
    }

    if (msg.type === "timer") {
      const seq = Number(msg.seq) || 0;
      if (seq < state.timer.seq && msg.sentWallMs < (state.timer.lastWallMs || 0)) return;
      let rem = Math.max(0, Number(msg.remainingMs) || 0);
      if (msg.running && isRetained && msg.sentWallMs) {
        const wallElapsed = Math.max(0, Date.now() - Number(msg.sentWallMs));
        rem = Math.max(0, rem - wallElapsed);
      }
      const durSec = Math.max(5, Number(msg.durationSec) || 300);
      // Never turn any incoming 0-remaining packet (MQTT retained, PeerJS sync, or BroadcastChannel) into a red Time-Up state
      if (rem === 0) {
        const wasActivelyRunningHere = Boolean(state.timer.running);
        state.timer.seq = wasActivelyRunningHere ? Math.max(state.timer.seq + 1, seq) : 0;
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
        forceSync: Boolean(msg.forceSync) && !isRetained,
        sentWallMs: sentMs
      };
      if (slideKind === "concept-summary" && qid) {
        const prevRec = state.unlockedConceptSummaries[qid];
        if (!prevRec || (prevRec.updatedWallMs || 0) <= sentMs) {
          state.unlockedConceptSummaries[qid] = {
            unlocked: true,
            seq: Number(msg.seq) || 0,
            updatedWallMs: sentMs
          };
          emit("concept_unlock", { questionId: qid, unlocked: true, isRetained: Boolean(isRetained) });
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
      state.unlockedConceptSummaries[qid] = {
        unlocked: isUnlocked,
        seq: Number(msg.seq) || 0,
        updatedWallMs: updatedMs
      };
      emit("concept_unlock", { questionId: qid, unlocked: isUnlocked, isRetained: Boolean(isRetained) });
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
      const pid = incomingTeamId ? `team_${incomingTeamId}` : rawPid;
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
      if (!incomingTeamId && existing && (existing.updatedWallMs || 0) > updatedMs) return;

      const rawCellStatuses =
        msg.cellStatuses && typeof msg.cellStatuses === "object" ? msg.cellStatuses : {};
      const rawCellUpdatedMs =
        msg.cellUpdatedMs && typeof msg.cellUpdatedMs === "object" ? msg.cellUpdatedMs : {};
      const rawCellEditors =
        msg.cellEditors && typeof msg.cellEditors === "object" ? msg.cellEditors : {};
      const dirtyCells =
        msg.dirtyCells && typeof msg.dirtyCells === "object" ? msg.dirtyCells : null;

      const cleanCells = incomingTeamId && existing && existing.cells ? Object.assign({}, existing.cells) : {};
      const cleanCellStatuses =
        incomingTeamId && existing && existing.cellStatuses ? Object.assign({}, existing.cellStatuses) : {};
      const cleanCellUpdatedMs =
        incomingTeamId && existing && existing.cellUpdatedMs ? Object.assign({}, existing.cellUpdatedMs) : {};
      const cleanCellEditors =
        incomingTeamId && existing && existing.cellEditors ? Object.assign({}, existing.cellEditors) : {};

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
        const prevTs = Number(cleanCellUpdatedMs[k] || 0);
        if (incomingTeamId && cellTs < prevTs) return;

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
            : cleanCellStatuses[k] === "submitted" && existing && existing.cells && existing.cells[k] === val
            ? "submitted"
            : "typing";
          cleanCellStatuses[k] = cStat;
          cleanCellUpdatedMs[k] = cellTs;
          const ed = String(rawCellEditors[k] || msg.editorLabel || "").slice(0, 60);
          if (ed) cleanCellEditors[k] = ed;

          if (
            incomingTeamId &&
            state.role === "student" &&
            state.teamId === incomingTeamId &&
            cStat === "submitted" &&
            submittedTextByCell[k] !== val.trim()
          ) {
            submittedTextByCell[k] = val.trim();
            syncedSubmittedChange = true;
          }
        } else if (!incomingTeamId || (dirtyCells && Object.prototype.hasOwnProperty.call(dirtyCells, k))) {
          delete cleanCells[k];
          delete cleanCellStatuses[k];
          cleanCellUpdatedMs[k] = cellTs;
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
        const latestEditor =
          updatedMs >= prevLatest
            ? String(msg.editorLabel || (existing && existing.editorLabel) || "").slice(0, 60)
            : String((existing && existing.editorLabel) || msg.editorLabel || "").slice(0, 60);
        qMap.set(pid, {
          participantId: pid,
          teamId: incomingTeamId || 0,
          studentId: String(msg.studentId || (existing && existing.studentId) || "").slice(0, 16),
          displayName: incomingTeamId
            ? `กลุ่ม ${incomingTeamId}`
            : String(msg.displayName || "นักศึกษาในห้อง").slice(0, 80),
          editorLabel: latestEditor,
          nickname: String(msg.nickname || (existing && existing.nickname) || "").slice(0, 32),
          area: String(msg.area || (existing && existing.area) || "").slice(0, 40),
          questionId: qid,
          cells: cleanCells,
          cellStatuses: cleanCellStatuses,
          cellUpdatedMs: cleanCellUpdatedMs,
          cellEditors: cleanCellEditors,
          status: anySubmitted ? "submitted" : "typing",
          updatedWallMs: Math.max(prevLatest, updatedMs)
        });
      }

      // Refresh sender student's individual presence (never create a fake presence entry for "team_X")
      const senderPid = String(msg.senderPid || (!incomingTeamId ? rawPid : "") || "").slice(0, 48);
      if (senderPid && !senderPid.startsWith("team_")) {
        const prevPres = state.presence.get(senderPid) || {};
        state.presence.set(
          senderPid,
          Object.assign({}, prevPres, {
            participantId: senderPid,
            role: "student",
            joined: true,
            teamId: clampTeamOrZero(incomingTeamId || prevPres.teamId),
            studentId: String(msg.studentId || prevPres.studentId || "").slice(0, 16),
            shortNo: String(msg.shortNo || prevPres.shortNo || "").slice(0, 6),
            nickname: String(msg.nickname || prevPres.nickname || "").slice(0, 32),
            area: String(msg.area || prevPres.area || "").slice(0, 40),
            name: String(msg.senderName || msg.editorLabel || prevPres.name || "นักศึกษา").slice(0, 80),
            activeQuestionId: qid,
            lastSeenMs: Date.now()
          })
        );
      }
      emit("responses", { questionId: qid, participantId: pid, teamId: incomingTeamId || 0 });
      emit("presence", getPresenceSummary());
      return;
    }

    if (msg.type === "who_is_here") {
      if (isRetained) return;
      if (state.role === "faculty" || state.sessionJoined) {
        publishPresence();
      }
      if (state.role === "faculty" && state.teacherPointer.questionId) {
        publishPacket(
          "slide",
          {
            type: "slide",
            seq: state.teacherPointer.seq,
            module: state.teacherPointer.module,
            caseId: state.teacherPointer.caseId,
            questionId: state.teacherPointer.questionId,
            slideKind: state.teacherPointer.slideKind || "question",
            splitOrient: state.teacherPointer.splitOrient || "",
            forceSync: false
          },
          true
        );
      }
      if (state.role === "faculty") {
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
      if (msg.left) {
        if (state.presence.delete(pid)) {
          emit("presence", getPresenceSummary());
        }
        return;
      }
      // Ignore stale retained MQTT presence from previous class sessions (> 90 min old)
      if (isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > 90 * 60 * 1000) {
        return;
      }
      if (msg.role !== "faculty" && msg.joined === false) {
        if (state.presence.delete(pid)) {
          emit("presence", getPresenceSummary());
        }
        return;
      }
      const prevPres = state.presence.get(pid) || {};
      const sidStr = String(msg.studentId || prevPres.studentId || "").slice(0, 16);
      state.presence.set(pid, {
        participantId: pid,
        role: msg.role === "faculty" ? "faculty" : "student",
        joined: msg.role === "faculty" ? true : Boolean(msg.joined !== false),
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
        joinedWallMs: Number(msg.joinedWallMs || prevPres.joinedWallMs || msg.sentWallMs || Date.now()),
        lastSeenMs: Date.now()
      });
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
      client.subscribe(`${TOPIC_NS}/room-${state.roomId}/#`, { qos: 0 });
    } catch (_) {}
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
        const client = window.mqtt.connect(url, {
          clientId: `racm303_${state.role}_${Math.random().toString(16).slice(2, 10)}`,
          clean: true,
          connectTimeout: 7000,
          reconnectPeriod: 5000,
          keepalive: 45
        });
        client.on("connect", () => {
          state.connectedTransports.add(tag);
          subscribeCurrentRoomMqtt(client);
          updateConnectionBadge();
          publishPresence();
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
            const prefix = `${TOPIC_NS}/room-${state.roomId}/`;
            if (!topic.startsWith(prefix)) return;
            const subpath = topic.slice(prefix.length);
            const text = payloadBuf ? payloadBuf.toString() : "";
            if (!text) return;
            const parsed = JSON.parse(text);
            handleIncomingPacket(subpath, parsed, Boolean(packet && packet.retain));
          } catch (_) {}
        });
        state.mqttClients.push(client);
      } catch (_) {}
    });
  }

  function teardownPeer() {
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

  function initPeerForRoom() {
    teardownPeer();
    if (typeof window.Peer !== "function") return;
    const hostPeerId = `racm303-2569-hsd-r${state.roomId}`;
    try {
      if (state.role === "faculty") {
        const peer = new window.Peer(hostPeerId, { debug: 0 });
        state.peer = peer;
        peer.on("open", () => {
          state.connectedTransports.add("peer");
          updateConnectionBadge();
        });
        peer.on("connection", (conn) => {
          state.peerConns.set(conn.peer, conn);
          conn.on("open", () => {
            // Send current timer, slide pointer, & active room presence immediately to newly connected student
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
              state.presence.forEach((pRec) => {
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
        peer.on("error", () => {
          // Another co-teacher may already hold the hostPeerId; MQTT handles multi-teacher seamlessly
          state.connectedTransports.delete("peer");
          updateConnectionBadge();
        });
      } else {
        const peer = new window.Peer(undefined, { debug: 0 });
        state.peer = peer;
        peer.on("open", () => {
          try {
            const conn = peer.connect(hostPeerId, { reliable: true });
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
        });
        peer.on("error", () => {});
      }
    } catch (_) {}
  }

  function requestRoomSnapshot() {
    publishPacket(
      "who_is_here",
      {
        type: "who_is_here",
        participantId: state.participantId
      },
      false
    );
  }

  function publishPresence() {
    // Students on the pre-login lobby screen have not joined yet — do not count them as joined until login
    if (state.role !== "faculty" && !state.sessionJoined) {
      emit("presence", getPresenceSummary());
      return;
    }
    const myName = getEffectiveDisplayName();
    if (!state.joinedWallMs) state.joinedWallMs = Date.now();
    const myShortNo = state.shortNo || (state.studentId ? String(state.studentId).slice(-3) : "");
    const myRec = {
      participantId: state.participantId,
      role: state.role,
      joined: true,
      teamId: state.role === "faculty" ? 0 : clampTeamOrZero(state.teamId),
      studentId: state.studentId || "",
      shortNo: myShortNo,
      fullName: state.fullName || "",
      nickname: state.nickname || "",
      area: state.area || "",
      disc: state.disc || state.roomId,
      photoId: state.photoId || "",
      activeModule: state.activeModule || "",
      activeQuestionId: state.activeQuestionId || "",
      name: myName,
      joinedWallMs: state.joinedWallMs,
      lastSeenMs: Date.now()
    };
    state.presence.set(state.participantId, myRec);
    publishPacket(
      `presence/${state.participantId}`,
      Object.assign({ type: "presence" }, myRec),
      true
    );
    emit("presence", getPresenceSummary());
  }

  function getPresenceSummary() {
    let students = 0;
    let teachers = 0;
    const list = [];
    const joinedStudents = [];
    const teamCounts = { 1: 0, 2: 0, 3: 0 };
    const teamMembers = { 1: [], 2: [], 3: [] };
    state.presence.forEach((p) => {
      if (p.role === "faculty") {
        teachers += 1;
        list.push(p);
      } else if (p.joined !== false) {
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
      total: students + teachers,
      students,
      teachers,
      list,
      joinedStudents,
      teamCounts,
      teamMembers
    };
  }

  function getSmartTeamBalance(excludeStudentIdOpt, totalExpectedOpt) {
    const excludeSid = String(excludeStudentIdOpt || "").trim();
    const excludePid = excludeSid ? `sid_${excludeSid}` : "";
    const counts = { 1: 0, 2: 0, 3: 0 };
    const otherCounts = { 1: 0, 2: 0, 3: 0 };

    state.presence.forEach((p) => {
      if (!p || p.role === "faculty" || p.joined === false) return;
      const tid = clampTeamOrZero(p.teamId);
      if (tid < 1 || tid > 3) return;
      counts[tid] += 1;
      const isExcluded =
        (excludeSid && String(p.studentId || "") === excludeSid) ||
        (excludePid && p.participantId === excludePid) ||
        (!excludeSid && state.sessionJoined && p.participantId === state.participantId);
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
      // Smart Cap: prevent a team from growing >1 larger than the smallest team or exceeding room quota
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
    if (state.teamId >= 1 && state.teamId <= 3) {
      return `กลุ่ม ${state.teamId}`;
    }
    if (state.displayName && state.displayName.trim()) {
      return state.displayName.trim();
    }
    return `นศพ. ห้อง ${state.roomId} (#${state.participantId.slice(-4)})`;
  }

  function getEditorShortDisplay() {
    const sn = state.shortNo || (state.studentId ? String(state.studentId).slice(-3) : "");
    if (sn && state.nickname) return `${sn} ${state.nickname}`;
    if (sn) return `เบอร์ ${sn}`;
    if (state.nickname) return state.nickname;
    if (state.fullName) return state.fullName;
    return state.teamId ? `สมาชิกกลุ่ม ${state.teamId}` : "นักศึกษา";
  }

  function setStudentProfile(studentObj, opts) {
    if (studentObj && studentObj.id) {
      const prevPid = state.participantId;
      state.studentId = String(studentObj.id);
      state.shortNo = String(studentObj.id).slice(-3);
      state.participantId = `sid_${studentObj.id}`;
      if (prevPid && prevPid !== state.participantId) {
        state.presence.delete(prevPid);
      }
      const nick = String(studentObj.nickname || studentObj.nick || "").trim();
      state.nickname = nick;
      state.fullName = String(studentObj.fullName || studentObj.name || "").trim();
      state.area = studentObj.area || "";
      state.disc = Number(studentObj.disc) || 0;
      state.photoId = String(studentObj.photoId || "");
      const baseName = studentObj.name || studentObj.fullName || studentObj.id;
      state.displayName = nick ? `${state.shortNo} ${nick} (${baseName})` : `${studentObj.id} ${baseName}`;
      const skipAutoRoom = Boolean(opts && opts.keepCurrentRoom);
      if (!skipAutoRoom && studentObj.disc >= 1 && studentObj.disc <= 6) {
        setRoom(studentObj.disc, true);
      }
    }
    if (state.sessionJoined) {
      publishPresence();
    } else {
      emit("presence", getPresenceSummary());
    }
  }

  function setTeam(teamNum, silentSave) {
    const next = clampTeam(teamNum);
    const prev = state.teamId;
    state.teamId = next;
    safeSetSession("racm303_hsd_team_id_v1", String(next));
    if (!silentSave) safeSetStorage("racm303_live_team_v1", String(next));
    if (prev !== next) {
      // Sync submitted cell markers from the newly selected team's shared record
      let changed = false;
      state.responsesByQuestion.forEach((qMap) => {
        const tRec = qMap.get(`team_${next}`);
        if (tRec && tRec.cells && tRec.cellStatuses) {
          Object.keys(tRec.cells).forEach((cid) => {
            if (tRec.cellStatuses[cid] === "submitted" && tRec.cells[cid]) {
              submittedTextByCell[cid] = String(tRec.cells[cid]).trim();
              changed = true;
            }
          });
        }
      });
      if (changed) saveSubmittedCellsStore();
    }
    if (state.sessionJoined) {
      publishPresence();
    } else {
      emit("presence", getPresenceSummary());
    }
    emit("responses", { questionId: "*", teamId: next });
  }

  function joinSessionWithStudent(studentObj, roomNumOpt, activeModuleOpt, teamIdOpt) {
    state.sessionJoined = true;
    state.joinedWallMs = Date.now();
    safeSetSession("racm303_hsd_session_joined_v1", "1");
    if (activeModuleOpt) state.activeModule = String(activeModuleOpt);
    if (teamIdOpt !== undefined && teamIdOpt !== null) {
      state.teamId = clampTeam(teamIdOpt);
      safeSetSession("racm303_hsd_team_id_v1", String(state.teamId));
      safeSetStorage("racm303_live_team_v1", String(state.teamId));
    } else if (!state.teamId) {
      const bal = getSmartTeamBalance(studentObj && studentObj.id, 28);
      state.teamId = bal.recommendedTeam;
      safeSetSession("racm303_hsd_team_id_v1", String(state.teamId));
      safeSetStorage("racm303_live_team_v1", String(state.teamId));
    }
    if (studentObj && studentObj.id) {
      setStudentProfile(studentObj, { keepCurrentRoom: Boolean(roomNumOpt) });
    }
    if (roomNumOpt) {
      setRoom(roomNumOpt, false);
    }
    publishPresence();
    requestRoomSnapshot();
    emit("responses", { questionId: "*", teamId: state.teamId });
  }

  function logoutStudentSession() {
    if (state.role === "faculty") return;
    const oldPid = state.participantId;
    state.sessionJoined = false;
    state.joinedWallMs = 0;
    state.teamId = 0;
    safeSetSession("racm303_hsd_session_joined_v1", null);
    safeSetSession("racm303_hsd_team_id_v1", null);
    if (oldPid) {
      state.presence.delete(oldPid);
      publishPacket(
        `presence/${oldPid}`,
        {
          type: "presence",
          participantId: oldPid,
          role: "student",
          joined: false,
          left: true
        },
        true
      );
    }
    emit("presence", getPresenceSummary());
  }

  function setActiveStudentSlide(moduleId, questionId) {
    const nextMod = String(moduleId || "");
    const nextQ = String(questionId || "");
    if (state.activeModule === nextMod && state.activeQuestionId === nextQ) return;
    state.activeModule = nextMod;
    state.activeQuestionId = nextQ;
    if (state.role !== "faculty" && state.sessionJoined) {
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
    if (next === prev && state.presence.size > 0) return;

    // Notify previous room if student was actively joined there
    if (next !== prev && state.role !== "faculty" && state.sessionJoined && state.participantId) {
      const leaveMsg = {
        type: "presence",
        msgId: randomId("pkt"),
        roomId: prev,
        senderCli: clientInstanceId,
        sentWallMs: Date.now(),
        participantId: state.participantId,
        role: "student",
        joined: false,
        left: true
      };
      if (state.bc) {
        try {
          state.bc.postMessage({ subpath: `presence/${state.participantId}`, msg: leaveMsg, retained: false });
        } catch (_) {}
      }
      const prevTopic = `${TOPIC_NS}/room-${prev}/presence/${state.participantId}`;
      state.mqttClients.forEach((c) => {
        try {
          if (c && c.connected) c.publish(prevTopic, JSON.stringify(leaveMsg), { qos: 0, retain: true });
        } catch (_) {}
      });
    }

    state.mqttClients.forEach((c) => unsubscribeRoomMqtt(c, prev));
    state.roomId = next;
    if (!silentSave) safeSetStorage("racm303_live_room_v1", String(next));

    // Reset room-scoped caches when switching rooms
    state.responsesByQuestion.clear();
    state.clearedAtByQuestion.clear();
    state.presence.clear();
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

    state.mqttClients.forEach((c) => subscribeCurrentRoomMqtt(c));
    initPeerForRoom();
    publishPresence();
    requestRoomSnapshot();
    emit("timer", getTimerSnapshot());
    emit("responses", { questionId: "*" });
    emit("concept_unlock", { questionId: "*", unlocked: false, roomChanged: true });
  }

  /* ---------- Teacher Timer & Slide Pointer Controls ---------- */
  function startTimer(durationSec, questionId, label) {
    const sec = Math.max(5, Math.min(5400, Number(durationSec) || state.timer.durationSec || 300));
    state.timer.seq += 1;
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
      const nextMs = rem > 0 ? rem : (state.timer.durationSec || 300) * 1000;
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
    const nextMs = Math.max(0, Math.min(5400 * 1000, cur + (Number(deltaSec) || 60) * 1000));
    state.timer.seq += 1;
    state.timer.baseRemainingMs = nextMs;
    state.timer.anchorPerfNow = performance.now();
    if (nextMs > 0) {
      state.timer.chimePlayedForSeq = -1;
      state.timer.hasConfigured = true;
      state.timer.timedOutInCurrentRun = false;
    }
    state.timer.durationSec = Math.max(state.timer.durationSec, Math.ceil(nextMs / 1000));
    publishPacket(
      "timer",
      {
        type: "timer",
        seq: state.timer.seq,
        running: state.timer.running,
        hasStarted: state.timer.hasStarted,
        hasConfigured: state.timer.hasConfigured,
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
    const sec = Math.max(5, Math.min(5400, Number(durationSec) || state.timer.durationSec || 300));
    state.timer.seq += 1;
    state.timer.running = false;
    state.timer.hasStarted = false;
    state.timer.hasConfigured = Boolean(isSetReady);
    state.timer.timedOutInCurrentRun = false;
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
    state.timer.timedOutInCurrentRun = false;
    state.timer.hasStarted = false;
    state.timer.hasConfigured = false;
    state.timer.baseRemainingMs = (state.timer.durationSec || 300) * 1000;
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

  /* ---------- Student Per-Cell Live Typing & Per-Block Submission ---------- */
  const debounceTimers = new Map();
  const lastSentAtByQuestion = new Map();
  const pendingCellsByQuestion = new Map();
  let submittedTextByCell = (function () {
    try {
      return JSON.parse(safeGetStorage("racm303_hs_disc_submitted_cells_v1", "{}")) || {};
    } catch (_) {
      return {};
    }
  })();

  function saveSubmittedCellsStore() {
    safeSetStorage("racm303_hs_disc_submitted_cells_v1", JSON.stringify(submittedTextByCell));
  }

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
    const activeTeamId = state.role === "student" ? clampTeamOrZero(state.teamId) : 0;
    const targetPid = activeTeamId ? `team_${activeTeamId}` : state.participantId;
    const editorLabel = getEditorShortDisplay();
    const updatedMs = Date.now();
    lastSentAtByQuestion.set(questionId, updatedMs);

    if (!state.responsesByQuestion.has(questionId)) {
      state.responsesByQuestion.set(questionId, new Map());
    }
    const qMap = state.responsesByQuestion.get(questionId);
    const existing = activeTeamId ? qMap.get(targetPid) : null;

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

    const cleanCells = activeTeamId && existing && existing.cells ? Object.assign({}, existing.cells) : {};
    const cleanCellStatuses =
      activeTeamId && existing && existing.cellStatuses ? Object.assign({}, existing.cellStatuses) : {};
    const cleanCellUpdatedMs =
      activeTeamId && existing && existing.cellUpdatedMs ? Object.assign({}, existing.cellUpdatedMs) : {};
    const cleanCellEditors =
      activeTeamId && existing && existing.cellEditors ? Object.assign({}, existing.cellEditors) : {};
    const dirtyCellsPayload = {};

    const keysToProcess = activeTeamId ? Array.from(dirtySet) : Object.keys(cellsObj);
    keysToProcess.forEach((k) => {
      const v = String(cellsObj[k] || "").slice(0, 500);
      const trimmed = v.trim();
      dirtyCellsPayload[k] = v;
      localCellUpdatedMs[k] = updatedMs;
      cleanCellUpdatedMs[k] = updatedMs;
      if (trimmed) {
        cleanCells[k] = v;
        if (forceSubmitAll) {
          submittedTextByCell[k] = trimmed;
        }
        const isCellSub = submittedTextByCell[k] === trimmed;
        cleanCellStatuses[k] = isCellSub ? "submitted" : "typing";
        cleanCellEditors[k] = editorLabel;
      } else {
        delete cleanCells[k];
        delete cleanCellStatuses[k];
      }
    });

    // Also include any non-empty local cells if team record didn't have them yet
    if (activeTeamId) {
      Object.keys(cellsObj).forEach((k) => {
        if (cleanCells[k]) return;
        if (dirtySet.has(k)) return;
        const v = String(cellsObj[k] || "").slice(0, 500);
        const trimmed = v.trim();
        if (trimmed && !cleanCellUpdatedMs[k]) {
          cleanCells[k] = v;
          if (forceSubmitAll) submittedTextByCell[k] = trimmed;
          cleanCellStatuses[k] = submittedTextByCell[k] === trimmed ? "submitted" : "typing";
          cleanCellUpdatedMs[k] = localCellUpdatedMs[k] || updatedMs;
          cleanCellEditors[k] = editorLabel;
        }
      });
    }

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
        studentId: state.studentId,
        displayName: activeTeamId ? `กลุ่ม ${activeTeamId}` : getEffectiveDisplayName(),
        editorLabel,
        nickname: state.nickname,
        area: state.area,
        questionId,
        cells: cleanCells,
        cellStatuses: cleanCellStatuses,
        cellUpdatedMs: cleanCellUpdatedMs,
        cellEditors: cleanCellEditors,
        status: overallStatus,
        updatedWallMs: updatedMs
      });
    }

    publishPacket(
      `resp/${questionId}/${targetPid}`,
      {
        type: "resp",
        participantId: targetPid,
        senderPid: state.participantId,
        senderName: state.displayName || editorLabel,
        teamId: activeTeamId || 0,
        studentId: state.studentId,
        shortNo: state.shortNo || (state.studentId ? String(state.studentId).slice(-3) : ""),
        displayName: activeTeamId ? `กลุ่ม ${activeTeamId}` : getEffectiveDisplayName(),
        editorLabel,
        nickname: state.nickname,
        area: state.area,
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
    emit("responses", { questionId, participantId: targetPid, teamId: activeTeamId || 0, localOrigin: true });
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
      const ta = clampTeamOrZero(a.teamId);
      const tb = clampTeamOrZero(b.teamId);
      if (ta && tb && ta !== tb) return ta - tb;
      if (ta && !tb) return -1;
      if (!ta && tb) return 1;
      if (a.status !== b.status) return a.status === "submitted" ? -1 : 1;
      return (b.updatedWallMs || 0) - (a.updatedWallMs || 0);
    });
  }

  function getMyTeamResponse(questionId) {
    if (!questionId) return null;
    const tid = clampTeamOrZero(state.teamId);
    if (!tid) return null;
    const qMap = state.responsesByQuestion.get(questionId);
    return (qMap && qMap.get(`team_${tid}`)) || null;
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
        studentId: rec.studentId,
        displayName: rec.displayName,
        editorLabel: cellEditor,
        nickname: rec.nickname,
        area: rec.area,
        questionId,
        inputId,
        text: String(txt).trim(),
        status: cStat === "submitted" ? "submitted" : "typing",
        updatedWallMs: rec.updatedWallMs || 0,
        fullRecord: rec
      });
    });
    return items.sort((a, b) => {
      if (a.teamId && b.teamId && a.teamId !== b.teamId) return a.teamId - b.teamId;
      if (a.teamId && !b.teamId) return -1;
      if (!a.teamId && b.teamId) return 1;
      if (a.status !== b.status) return a.status === "submitted" ? -1 : 1;
      return (b.updatedWallMs || 0) - (a.updatedWallMs || 0);
    });
  }

  function setFollowTeacher(flag) {
    state.followTeacher = Boolean(flag);
    safeSetStorage("racm303_live_follow_v1", state.followTeacher ? "1" : "0");
  }

  function setAnonymousWall(flag) {
    state.anonymousWall = Boolean(flag);
    safeSetStorage("racm303_live_anon_v1", state.anonymousWall ? "1" : "0");
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
    initBroadcastChannel();
    initMqttBrokers();
    initPeerForRoom();
    publishPresence();
    requestRoomSnapshot();
  }

  window.RACM_LIVE_CLASSROOM = {
    rooms: ROOM_DEFS,
    teams: TEAM_DEFS,
    startEngine,
    on,
    getRoomId: () => state.roomId,
    getRoomDef: (id) => ROOM_DEFS.find((r) => r.id === clampRoom(id || state.roomId)) || ROOM_DEFS[0],
    setRoom,
    getTeamId: () => clampTeamOrZero(state.teamId),
    getTeamDef: (id) => TEAM_DEFS.find((t) => t.id === clampTeam(id || state.teamId)) || TEAM_DEFS[0],
    setTeam,
    getSmartTeamBalance,
    setStudentProfile,
    joinSessionWithStudent,
    logoutStudentSession,
    isSessionJoined: () => Boolean(state.sessionJoined),
    setActiveStudentSlide,
    requestRoomSnapshot,
    setCustomDisplayName,
    getDisplayName: getEffectiveDisplayName,
    getEditorShortDisplay,
    getParticipantId: () => state.participantId,
    getConnectionStatus,
    getPresenceSummary,
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
    getCellResponses,
    getFollowTeacher: () => state.followTeacher,
    setFollowTeacher,
    getAnonymousWall: () => state.anonymousWall,
    setAnonymousWall,
    getSoundMuted: () => state.soundMuted,
    setSoundMuted
  };
})();
