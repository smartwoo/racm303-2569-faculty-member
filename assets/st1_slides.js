/* ==========================================================================
   RACM 303 (2569) — ST1: Systems & Systems Thinking (31-Slide Master Deck)
   Interactive 16:9 Apple-Keynote Stage · Nano Banana #FFFFFF Diagrams
   Warped Juggle (5 Rules) · Step-by-Step CLD Clicker · Archetypes · En-ROADS
   Authors: อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์ · ผศ. นพ.บวรศม ลีระพันธ์
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const ASSET_VER = "20261124st1m1";
  const PPTX_HREF = `exports/pptx/RACM303_2569_ST1_Slides.pptx?v=${ASSET_VER}`;
  const PDF_HREF = `exports/pdf/RACM303_2569_ST1_Slides.pdf?v=${ASSET_VER}`;
  const IMG_DIR = "assets/images/st1";
  const AUTOPLAY_MS = 9500;
  const SESSION_LIMIT_SEC = 150 * 60;

  const PROD_STUDENT_DECK_URL = "https://smartwoo.github.io/racm303-2569-student/#st1";
  const SYNC_BC_NAME = "racm303_st1_deck_sync_v2";
  const MQTT_TOPIC = "racm303/2569/st1_deck_sync/v2";
  const MQTT_BROKERS = [
    "wss://mqtt.eclipseprojects.io:443/mqtt",
    "wss://broker.emqx.io:8084/mqtt"
  ];

  function loadIoStageTheme() {
    try {
      const saved = localStorage.getItem("racm303_io_clean_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (document.documentElement.getAttribute("data-theme") === "dark") return "dark";
    } catch (_) {}
    return "light";
  }

  function loadSavedQuizAnswers() {
    try {
      return JSON.parse(localStorage.getItem("racm303_st1_deck_quiz_v2") || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  const CLIENT_ID = "st1_" + Math.random().toString(36).slice(2, 10);

  const state = {
    isOpen: false,
    slideIdx: 0,
    subStep: 0,
    transitionDir: "next",
    viewMode: "deck", // "deck" | "quiz" | "sorter" | "handout"
    ioStageTheme: loadIoStageTheme(),
    hasManualIoTheme: false,
    coverPaneMode: "lobby", // "lobby" | "hero"
    qrZoomOpen: false,
    zoomScale: 1,
    sorterFilter: "all",
    presentationMode: false,
    clickerStage: false,
    hudIdle: false,
    hudIdleTimer: 0,
    blackoutActive: false,
    clickerGuideOpen: false,
    jumpDigits: "",
    jumpTimer: 0,
    showNotes: ROLE === "faculty" && window.innerWidth >= 1024 && window.innerHeight >= 620,
    toolsMenuOpen: false,
    laserActive: false,
    autoPlay: false,
    autoPlayTimeout: null,
    timerRunning: false,
    timerSeconds: 0,
    timerInterval: null,
    followHost: ROLE === "student",
    debriefRevealed: false, // Faculty-only toggle on Slide 16
    // Warped Juggle Live Stopwatch & Round Tracker (Slide 05)
    wjRunning: false,
    wjElapsedMs: 0,
    wjStartPerf: 0,
    wjRaf: 0,
    wjEstSec: 45,
    wjRounds: [], // e.g. [42.4, 24.8, 18.5]
    // En-ROADS 6-Sector Policy Sandbox (Slide 29 · 0..100 each)
    enrSliders: { energy: 0, transport: 0, buildings: 0, growth: 0, land: 0, removal: 0 },
    // Quiz & Live Classroom Tallies (confidentiality-safe: only counts/choices, never keys)
    quizIdx: 0,
    quizAnswers: loadSavedQuizAnswers(),
    facultyRevealMap: {},
    liveVoteMap: {}, // { [qId]: { [clientId]: choiceIdx } }
    mqttConnected: false,
    resizeRaf: 0
  };

  /* ---------- Pure-JS QR Code SVG Generator ---------- */
  const QR_ECC_M = [
    null,
    [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]
  ];
  const QR_ALIGN = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);
  (function initGf() {
    let x = 1;
    for (let i = 0; i < 255; i += 1) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i += 1) GF_EXP[i] = GF_EXP[i - 255];
  })();
  function gfMul(a, b) {
    return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }
  function rsRemainder(data, degree) {
    let poly = [1];
    for (let i = 0; i < degree; i += 1) {
      const nxt = new Array(poly.length + 1).fill(0);
      const root = GF_EXP[i];
      for (let j = 0; j < poly.length; j += 1) {
        nxt[j] ^= poly[j];
        nxt[j + 1] ^= gfMul(poly[j], root);
      }
      poly = nxt;
    }
    const rem = new Array(degree).fill(0);
    for (let i = 0; i < data.length; i += 1) {
      const factor = data[i] ^ rem[0];
      rem.shift();
      rem.push(0);
      for (let j = 0; j < degree; j += 1) rem[j] ^= gfMul(poly[j + 1], factor);
    }
    return rem;
  }
  function buildQrSvg(textStr, extraCls) {
    try {
      const utf8 = Array.from(new TextEncoder().encode(String(textStr || PROD_STUDENT_DECK_URL)));
      let ver = 1;
      while (ver <= 10) {
        const inf = QR_ECC_M[ver];
        const totalData = inf[1] * inf[2] + inf[3] * inf[4];
        const lenBits = ver <= 9 ? 8 : 16;
        if (Math.ceil((4 + lenBits + utf8.length * 8) / 8) <= totalData) break;
        ver += 1;
      }
      if (ver > 10) ver = 10;
      const inf = QR_ECC_M[ver];
      const totalData = inf[1] * inf[2] + inf[3] * inf[4];
      const bits = [];
      const pushBits = (val, n) => {
        for (let i = n - 1; i >= 0; i -= 1) bits.push((val >>> i) & 1);
      };
      pushBits(0b0100, 4);
      pushBits(utf8.length, ver <= 9 ? 8 : 16);
      utf8.forEach((b) => pushBits(b, 8));
      const maxBits = totalData * 8;
      for (let i = 0; i < 4 && bits.length < maxBits; i += 1) bits.push(0);
      while (bits.length % 8 !== 0) bits.push(0);
      const codewords = [];
      for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let b = 0; b < 8; b += 1) byte = (byte << 1) | bits[i + b];
        codewords.push(byte);
      }
      let padIdx = 0;
      while (codewords.length < totalData) {
        codewords.push(padIdx % 2 === 0 ? 0xec : 0x11);
        padIdx += 1;
      }
      const ecPerBlock = inf[0];
      const blocks = [];
      const ecs = [];
      let offset = 0;
      for (let g = 0; g < 2; g += 1) {
        const cnt = g === 0 ? inf[1] : inf[3];
        const dLen = g === 0 ? inf[2] : inf[4];
        for (let c = 0; c < cnt; c += 1) {
          const blk = codewords.slice(offset, offset + dLen);
          offset += dLen;
          blocks.push(blk);
          ecs.push(rsRemainder(blk, ecPerBlock));
        }
      }
      const interleaved = [];
      const maxDLen = Math.max(...blocks.map((b) => b.length));
      for (let i = 0; i < maxDLen; i += 1) blocks.forEach((b) => { if (i < b.length) interleaved.push(b[i]); });
      for (let i = 0; i < ecPerBlock; i += 1) ecs.forEach((e) => interleaved.push(e[i]));
      const size = ver * 4 + 17;
      const mat = Array.from({ length: size }, () => new Array(size).fill(0));
      const isFunc = Array.from({ length: size }, () => new Array(size).fill(false));
      const setMod = (r, c, dark) => {
        if (r >= 0 && r < size && c >= 0 && c < size) {
          mat[r][c] = dark ? 1 : 0;
          isFunc[r][c] = true;
        }
      };
      const drawFinder = (r0, c0) => {
        for (let dy = -1; dy <= 7; dy += 1) {
          for (let dx = -1; dx <= 7; dx += 1) {
            const r = r0 + dy, c = c0 + dx;
            if (r < 0 || r >= size || c < 0 || c >= size) continue;
            const onOuter = dy >= 0 && dy <= 6 && dx >= 0 && dx <= 6 && (dy === 0 || dy === 6 || dx === 0 || dx === 6);
            const onInner = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
            setMod(r, c, onOuter || onInner);
          }
        }
      };
      drawFinder(0, 0);
      drawFinder(0, size - 7);
      drawFinder(size - 7, 0);
      for (let i = 8; i < size - 8; i += 1) {
        setMod(6, i, i % 2 === 0);
        setMod(i, 6, i % 2 === 0);
      }
      const aligns = QR_ALIGN[ver];
      for (let i = 0; i < aligns.length; i += 1) {
        for (let j = 0; j < aligns.length; j += 1) {
          const ar = aligns[i], ac = aligns[j];
          if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) continue;
          for (let dy = -2; dy <= 2; dy += 1) {
            for (let dx = -2; dx <= 2; dx += 1) setMod(ar + dy, ac + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
          }
        }
      }
      for (let i = 0; i < 9; i += 1) {
        if (i !== 6) { isFunc[8][i] = true; isFunc[i][8] = true; }
      }
      for (let i = 0; i < 8; i += 1) {
        isFunc[8][size - 1 - i] = true;
        isFunc[size - 1 - i][8] = true;
      }
      setMod(size - 8, 8, true);
      const streamBits = [];
      interleaved.forEach((byte) => { for (let b = 7; b >= 0; b -= 1) streamBits.push((byte >>> b) & 1); });
      let bIdx = 0, upward = true;
      for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let v = 0; v < size; v += 1) {
          const r = upward ? size - 1 - v : v;
          for (let j = 0; j < 2; j += 1) {
            const c = right - j;
            if (!isFunc[r][c]) {
              const bit = bIdx < streamBits.length ? streamBits[bIdx] : 0;
              bIdx += 1;
              mat[r][c] = bit ^ ((r + c) % 2 === 0 ? 1 : 0);
            }
          }
        }
        upward = !upward;
      }
      const fmt = 0b101010000010010;
      const fmtBits = [];
      for (let i = 0; i < 15; i += 1) fmtBits.push((fmt >>> i) & 1);
      for (let i = 0; i <= 5; i += 1) mat[8][i] = fmtBits[14 - i];
      mat[8][7] = fmtBits[8]; mat[8][8] = fmtBits[7]; mat[7][8] = fmtBits[6];
      for (let i = 9; i < 15; i += 1) mat[14 - i][8] = fmtBits[14 - i];
      for (let i = 0; i < 8; i += 1) mat[size - 1 - i][8] = fmtBits[14 - i];
      for (let i = 8; i < 15; i += 1) mat[8][size - 15 + i] = fmtBits[14 - i];
      const margin = 2, vb = size + margin * 2;
      let d = "";
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) if (mat[r][c]) d += `M${c + margin},${r + margin}h1v1h-1z`;
      }
      return `<svg class="orl-qr-svg${extraCls ? " " + extraCls : ""}" viewBox="0 0 ${vb} ${vb}" shape-rendering="crispEdges" role="img" aria-label="QR Code ST1"><rect width="${vb}" height="${vb}" fill="#ffffff" rx="2"/><path d="${d}" fill="#0f172a"/></svg>`;
    } catch (_) {
      return "";
    }
  }

  /* ---------- Cross-Tab & Live Classroom MQTT WSS Sync (Zero Answer Keys Transmitted) ---------- */
  let bcChannel = null;
  let mqttClient = null;

  function handleIncomingSyncMsg(msg) {
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "st1_host_state" && ROLE === "student" && state.isOpen && state.followHost) {
      let changed = false;
      if (state.viewMode === "deck") {
        const nextIdx = Math.max(0, Math.min(SLIDES.length - 1, Number(msg.slideIdx) || 0));
        const nextStep = Math.max(0, Number(msg.subStep) || 0);
        if (nextIdx !== state.slideIdx || nextStep !== state.subStep) {
          state.slideIdx = nextIdx;
          state.subStep = nextStep;
          state.zoomScale = 1;
          changed = true;
        }
      }
      if (typeof msg.quizIdx === "number" && msg.quizIdx !== state.quizIdx) {
        state.quizIdx = Math.max(0, Math.min(QUIZ_ITEMS.length - 1, msg.quizIdx));
        changed = true;
      }
      if (changed) renderModal();
    } else if (msg.type === "st1_student_vote" && msg.qId && typeof msg.choiceIdx === "number" && msg.cid) {
      if (!state.liveVoteMap[msg.qId]) state.liveVoteMap[msg.qId] = {};
      state.liveVoteMap[msg.qId][msg.cid] = msg.choiceIdx;
      if (state.isOpen && (state.viewMode === "quiz" || (SLIDES[state.slideIdx] && SLIDES[state.slideIdx].isLiveQuizSlide))) {
        renderModal();
      }
    }
  }

  try {
    if (typeof BroadcastChannel !== "undefined") {
      bcChannel = new BroadcastChannel(SYNC_BC_NAME);
      bcChannel.onmessage = (ev) => handleIncomingSyncMsg(ev && ev.data);
    }
  } catch (_) {}

  function ensureMqttConnected() {
    if (mqttClient || typeof window.mqtt === "undefined") return;
    try {
      mqttClient = window.mqtt.connect(MQTT_BROKERS[0], {
        clientId: "racm303_" + CLIENT_ID,
        clean: true,
        reconnectPeriod: 4000,
        connectTimeout: 5000
      });
      mqttClient.on("connect", () => {
        state.mqttConnected = true;
        try {
          mqttClient.subscribe(MQTT_TOPIC + "/#", { qos: 0 });
        } catch (_) {}
      });
      mqttClient.on("message", (_topic, payload) => {
        try {
          handleIncomingSyncMsg(JSON.parse(payload.toString()));
        } catch (_) {}
      });
    } catch (_) {}
  }

  function publishSyncPayload(subTopic, payload, retainFlag) {
    try {
      if (bcChannel) bcChannel.postMessage(payload);
    } catch (_) {}
    try {
      if (mqttClient && state.mqttConnected) {
        mqttClient.publish(`${MQTT_TOPIC}/${subTopic}`, JSON.stringify(payload), { qos: 0, retain: Boolean(retainFlag) });
      }
    } catch (_) {}
  }

  function broadcastHostSlide() {
    if (ROLE !== "faculty") return;
    publishSyncPayload(
      "host",
      {
        type: "st1_host_state",
        slideIdx: state.slideIdx,
        subStep: state.subStep,
        quizIdx: state.quizIdx,
        ts: Date.now()
      },
      true
    );
  }

  function broadcastStudentVote(qId, choiceIdx) {
    if (!state.liveVoteMap[qId]) state.liveVoteMap[qId] = {};
    state.liveVoteMap[qId][CLIENT_ID] = choiceIdx;
    publishSyncPayload("votes", { type: "st1_student_vote", qId, choiceIdx, cid: CLIENT_ID, ts: Date.now() }, false);
  }

  function getEffectiveIoTheme() {
    if (
      Boolean(window.__RACM_EXPORTING_DECK) ||
      document.body.classList.contains("is-printing-st1-deck") ||
      state.viewMode === "handout"
    ) {
      return "light";
    }
    return state.ioStageTheme === "dark" ? "dark" : "light";
  }

  function isExportOrHandout() {
    return (
      Boolean(window.__RACM_EXPORTING_DECK) ||
      document.body.classList.contains("is-printing-st1-deck") ||
      state.viewMode === "handout"
    );
  }

  function toggleIoStageTheme() {
    state.ioStageTheme = state.ioStageTheme === "dark" ? "light" : "light" === state.ioStageTheme ? "dark" : "light";
    state.hasManualIoTheme = true;
    try {
      localStorage.setItem("racm303_io_clean_theme", state.ioStageTheme);
    } catch (_) {}
    state.toolsMenuOpen = false;
    renderModal();
  }

  function getApi() {
    return window.RACM_PORTAL_API || null;
  }
  function getLang() {
    const api = getApi();
    if (api && api.getState) return api.getState().lang || "th";
    return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "th";
  }
  function t(th, en) {
    return getLang() === "en" && en ? en : th;
  }
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const preloadedSet = new Set();
  function preloadAllSt1Images() {
    const files = [
      "st1_s01_hero.png",
      "st1_wj_game_protocol.png",
      "st1_wj_system_drivers.png",
      "st1_wj_cld_en.png",
      "st1_wj_cld_th.png",
      "st1_wj_limits_to_success.png",
      "st1_growth_underinvestment.png",
      "st1_wj_growth_underinvestment.png",
      "st1_fig6_iceberg_model.png",
      "st1_chaordic_dee_hock.png",
      "st1_fig1_system_ipo.png",
      "st1_fig2_system_contexts.png",
      "st1_s07_metaphors.png",
      "st1_fig3_stacey_matrix.png",
      "st1_fig4_er_crowding_cld.png",
      "st1_fig5_blind_men_elephant.png",
      "st1_enroads_climate_futures.png",
      "st1_enroads_simulator_ui.png"
    ];
    files.forEach((f) => {
      const url = `${IMG_DIR}/${f}?v=${ASSET_VER}`;
      if (preloadedSet.has(url)) return;
      preloadedSet.add(url);
      const im = new Image();
      im.src = url;
    });
  }

  function figPlate(fileName, altText, captionHtml, badgeText) {
    return `
      <figure class="or-fig-plate is-st1-plate">
        ${badgeText ? `<div class="or-fig-top-badge">${esc(badgeText)}</div>` : ""}
        <div class="or-fig-img-wrap">
          <img class="or-fig-img" data-base-img="${esc(fileName)}" src="${IMG_DIR}/${esc(fileName)}?v=${ASSET_VER}" alt="${esc(altText)}" loading="eager" decoding="sync" />
        </div>
        ${captionHtml ? `<figcaption class="or-fig-cap">${captionHtml}</figcaption>` : ""}
      </figure>
    `;
  }

  function renderStepBarHtml(labels, curStep) {
    if (isExportOrHandout()) return "";
    return `
      <div class="st1-step-bar">
        <div class="st1-step-pills" role="tablist" aria-label="Clicker Steps">
          ${labels
            .map(
              (lbl, i) =>
                `<button type="button" class="st1-step-pill${i === curStep ? " is-active" : ""}" data-st1-substep="${i}">${esc(lbl)}</button>`
            )
            .join("")}
        </div>
        <span class="st1-step-hint">🖱️ กด Space / ลูกศรขวา / Clicker เพื่อเลื่อนทีละขั้น (${curStep + 1}/${labels.length})</span>
      </div>
    `;
  }

  /* ---------- Interactive Widget 1: Warped Juggle Stopwatch & BOT Tracker (Slide 05) ---------- */
  function formatWjMs(ms) {
    const sec = Math.max(0, ms) / 1000;
    return `${sec.toFixed(1)}s`;
  }

  function renderWjStopwatchCardHtml() {
    const rList = state.wjRounds;
    const best = rList.length ? Math.min(...rList) : null;
    const nextTarget = best !== null ? Math.max(1.0, +(best * 0.5).toFixed(1)) : +(state.wjEstSec * 0.5).toFixed(1);
    const pts = rList.length ? rList : [48, 29, 22, 19];
    const isDemo = !rList.length;
    const maxY = Math.max(55, ...pts);
    const polyPts = pts
      .map((v, i) => {
        const x = 36 + (pts.length === 1 ? 110 : (i / (pts.length - 1)) * 220);
        const y = 78 - (v / maxY) * 60;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    return `
      <div class="st1-wj-lab-card">
        <div>
          <span class="or-card-kicker">⏱️ LIVE CLASSROOM TIMER &amp; 50%-FASTER CHALLENGE</span>
          <h3 class="or-card-title">จับเวลาจริงต่อรอบ (บอลตกเริ่มรอบใหม่ แต่ไม่หยุดเวลา!)</h3>
        </div>

        <div class="st1-wj-clock-row">
          <div>
            <span class="st1-wj-round-lbl">เวลาปัจจุบัน (Timer)</span>
            <span class="st1-wj-digits" id="st1WjClockDigits">${formatWjMs(state.wjElapsedMs)}</span>
          </div>
          <div class="st1-wj-btn-cluster">
            <button type="button" class="or-tool-btn is-primary" data-st1-wj="toggle">${state.wjRunning ? "⏸ หยุด & บันทึกรอบ" : "▶ เริ่มจับเวลา"}</button>
            <button type="button" class="or-tool-btn" data-st1-wj="drop" title="กติกาข้อ 4: บอลตกพื้น เริ่มรอบใหม่โดยเวลาเดินต่อ!">⚠️ บอลตก! (เริ่มรอบใหม่·เวลาเดินต่อ)</button>
            <button type="button" class="or-tool-btn" data-st1-wj="reset">↺ รีเซ็ต</button>
          </div>
        </div>

        <div class="st1-wj-rounds-grid">
          <div class="st1-wj-round-box">
            <span class="st1-wj-round-lbl">เวลาที่กลุ่มทายไว้</span>
            <span class="st1-wj-round-val">${state.wjEstSec}s</span>
          </div>
          <div class="st1-wj-round-box">
            <span class="st1-wj-round-lbl">รอบล่าสุด</span>
            <span class="st1-wj-round-val">${rList.length ? rList[rList.length - 1].toFixed(1) + "s" : "—"}</span>
          </div>
          <div class="st1-wj-round-box">
            <span class="st1-wj-round-lbl">สถิติดีที่สุด (Best)</span>
            <span class="st1-wj-round-val" style="color:#059669">${best !== null ? best.toFixed(1) + "s" : "—"}</span>
          </div>
          <div class="st1-wj-round-box">
            <span class="st1-wj-round-lbl">โจทย์ท้าทาย (−50%!)</span>
            <span class="st1-wj-round-val" style="color:#d97706">&le; ${nextTarget}s</span>
          </div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:0.72cqw;padding:0.32cqw 0.56cqw">
          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#475569;margin-bottom:2px">
            <span>📈 กราฟแนวโน้มเวลาตามรอบ (Behavior Over Time: BOT)</span>
            <span>${isDemo ? "ตัวอย่างแนวโน้มเมื่อโยนเร็วขึ้นแล้วติดเพดาน" : `บันทึกแล้ว ${rList.length} รอบ`}</span>
          </div>
          <svg viewBox="0 0 280 88" style="width:100%;height:58px;display:block">
            <line x1="30" y1="12" x2="30" y2="80" stroke="#94a3b8" stroke-width="1.5"/>
            <line x1="30" y1="80" x2="268" y2="80" stroke="#94a3b8" stroke-width="1.5"/>
            <polyline fill="none" stroke="${isDemo ? "#94a3b8" : "#2563eb"}" stroke-dasharray="${isDemo ? "4 3" : "none"}" stroke-width="2.6" points="${polyPts}"/>
            ${pts
              .map((v, i) => {
                const x = 36 + (pts.length === 1 ? 110 : (i / (pts.length - 1)) * 220);
                const y = 78 - (v / maxY) * 60;
                return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${isDemo ? "#64748b" : "#1d4ed8"}"/><text x="${x.toFixed(1)}" y="${Math.max(11, y - 6).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#334155">${v}s</text>`;
              })
              .join("")}
          </svg>
        </div>
      </div>
    `;
  }

  /* ---------- Interactive Widget 2: 4 Step-by-Step Animated SVG CLD Clicker Labs (Slides 07–10) ---------- */
  function renderCldStep1SvgHtml(step) {
    const s = isExportOrHandout() ? 5 : step;
    const labels = [
      "① ตัวแปรคู่แรก",
      "② ลากเส้นเหตุ→ผล",
      "③ เฉลยขั้ว +",
      "④ เพิ่มการออกกำลังกาย",
      "⑤ ลากเส้นคู่ที่ 2",
      "⑥ เฉลยขั้ว −"
    ];
    return `
      <div class="st1-cld-clicker-stage">
        ${renderStepBarHtml(labels, s)}
        <div class="st1-cld-svg-card">
          <svg viewBox="0 0 1120 470" role="img" aria-label="CLD Exercise Step 1: Eating, Regular Exercise, and Obesity">
            <defs>
              <marker id="cldAhPink" markerUnits="userSpaceOnUse" markerWidth="22" markerHeight="18" refX="19" refY="9" orient="auto">
                <polygon points="0 0, 22 9, 0 18" fill="#ec4899"/>
              </marker>
              <marker id="cldAhTeal" markerUnits="userSpaceOnUse" markerWidth="22" markerHeight="18" refX="19" refY="9" orient="auto">
                <polygon points="0 0, 22 9, 0 18" fill="#0d9488"/>
              </marker>
            </defs>
            <!-- Node 1: Eating -->
            <g class="st1-svg-reveal is-shown">
              <circle cx="235" cy="142" r="54" fill="#eff6ff" stroke="#2563eb" stroke-width="3.5"/>
              <text x="235" y="155" text-anchor="middle" font-size="40">🍽️</text>
              <text x="235" y="226" text-anchor="middle" font-size="22" font-weight="800" fill="#0f172a">การรับประทานอาหาร (Eating)</text>
            </g>
            <!-- Node 2: Obesity -->
            <g class="st1-svg-reveal is-shown">
              <circle cx="715" cy="238" r="58" fill="#fff1f2" stroke="#e11d48" stroke-width="3.5"/>
              <text x="715" y="252" text-anchor="middle" font-size="42">⚖️</text>
              <text x="715" y="330" text-anchor="middle" font-size="23" font-weight="800" fill="#0f172a">ภาวะอ้วน (Obesity)</text>
            </g>
            <!-- Arrow 1: Eating -> Obesity -->
            <path class="st1-svg-arc${s >= 1 ? " is-shown" : ""}" d="M 300 126 Q 515 58 656 198" fill="none" stroke="#ec4899" stroke-width="5.5" marker-end="url(#cldAhPink)"/>
            <text class="st1-svg-reveal${s >= 2 ? " is-shown" : ""}" x="646" y="170" font-size="40" font-weight="900" fill="#db2777">+</text>

            <!-- Node 3: Regular Exercise -->
            <g class="st1-svg-reveal${s >= 3 ? " is-shown" : ""}">
              <circle cx="235" cy="346" r="54" fill="#ecfdf5" stroke="#0d9488" stroke-width="3.5"/>
              <text x="235" y="359" text-anchor="middle" font-size="40">🏃</text>
              <text x="235" y="430" text-anchor="middle" font-size="22" font-weight="800" fill="#0f172a">การออกกำลังกายสม่ำเสมอ (Regular Exercise)</text>
            </g>
            <!-- Arrow 2: Exercise -> Obesity -->
            <path class="st1-svg-arc${s >= 4 ? " is-shown" : ""}" d="M 300 356 Q 515 414 656 274" fill="none" stroke="#0d9488" stroke-width="5.5" marker-end="url(#cldAhTeal)"/>
            <text class="st1-svg-reveal${s >= 5 ? " is-shown" : ""}" x="632" y="316" font-size="44" font-weight="900" fill="#0d9488">−</text>

            <!-- Right Rule Legend Card -->
            <g transform="translate(862, 58)">
              <rect width="238" height="350" rx="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
              <text x="119" y="38" text-anchor="middle" font-size="17" font-weight="800" fill="#1e40af">กติกาหัวใจของ CLD</text>
              <text x="18" y="78" font-size="15.5" font-weight="800" fill="#db2777">เครื่องหมาย + (ทิศทางเดียวกัน)</text>
              <text x="18" y="102" font-size="14" fill="#334155">• ต้นทางเพิ่ม → ปลายทางเพิ่ม</text>
              <text x="18" y="124" font-size="14" fill="#334155">• ต้นทางลด → ปลายทางลด</text>
              <line x1="18" y1="150" x2="220" y2="150" stroke="#e2e8f0" stroke-width="1.5"/>
              <text x="18" y="182" font-size="15.5" font-weight="800" fill="#0d9488">เครื่องหมาย − (ทิศทางตรงข้าม)</text>
              <text x="18" y="206" font-size="14" fill="#334155">• ต้นทางเพิ่ม → ปลายทางลด</text>
              <text x="18" y="228" font-size="14" fill="#334155">• ต้นทางลด → ปลายทางเพิ่ม</text>
              <line x1="18" y1="254" x2="220" y2="254" stroke="#e2e8f0" stroke-width="1.5"/>
              <text x="18" y="284" font-size="14" font-weight="800" fill="#0f172a">ตำแหน่งการเขียนขั้ว:</text>
              <text x="18" y="308" font-size="13.5" fill="#475569">เขียน + หรือ − แบบไม่มีวงเล็บ</text>
              <text x="18" y="328" font-size="13.5" font-weight="700" fill="#b91c1c">เฉพาะที่ “หัวลูกศร” เท่านั้น!</text>
            </g>
          </svg>
        </div>
      </div>
    `;
  }

  function renderCldStep2SvgHtml(step) {
    const s = isExportOrHandout() ? 7 : step;
    const labels = [
      "① ตัวแปรความโกรธ",
      "② ลูกศรบน (+)",
      "③ ลูกศรล่าง (+)",
      "④ สรุป Loop R + BOT",
      "⑤ ตัวแปรความหิว",
      "⑥ หิว → กิน (+)",
      "⑦ กิน → หิวลด (−)",
      "⑧ สรุป Loop B (Thermostat)"
    ];
    return `
      <div class="st1-cld-clicker-stage">
        ${renderStepBarHtml(labels, s)}
        <div class="st1-cld-svg-card">
          <svg viewBox="0 0 1160 470" role="img" aria-label="Reinforcing Loop R vs Balancing Loop B">
            <defs>
              <marker id="s2Pink" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="16" refX="17" refY="8" orient="auto"><polygon points="0 0, 20 8, 0 16" fill="#e11d48"/></marker>
              <marker id="s2Blue" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="16" refX="17" refY="8" orient="auto"><polygon points="0 0, 20 8, 0 16" fill="#2563eb"/></marker>
              <marker id="s2Teal" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="16" refX="17" refY="8" orient="auto"><polygon points="0 0, 20 8, 0 16" fill="#0d9488"/></marker>
            </defs>
            <!-- LEFT HALF: REINFORCING LOOP R -->
            <rect x="14" y="14" width="552" height="442" rx="20" fill="#fffafb" stroke="#fecdd3" stroke-width="2"/>
            <rect x="30" y="28" width="248" height="36" rx="10" fill="#2563eb"/>
            <text x="154" y="52" text-anchor="middle" font-size="16" font-weight="800" fill="#ffffff">วงจรเสริมกำลัง (Reinforcing: R)</text>

            <g class="st1-svg-reveal is-shown">
              <rect x="40" y="148" width="184" height="94" rx="18" fill="#ffffff" stroke="#334155" stroke-width="2.8"/>
              <text x="132" y="182" text-anchor="middle" font-size="28">🤬</text>
              <text x="132" y="210" text-anchor="middle" font-size="16" font-weight="800" fill="#0f172a">พูดจาไม่เข้าหู</text>
              <text x="132" y="229" text-anchor="middle" font-size="12.5" fill="#64748b">(Say unfavorable)</text>

              <rect x="356" y="148" width="184" height="94" rx="18" fill="#ffffff" stroke="#e11d48" stroke-width="2.8"/>
              <text x="448" y="182" text-anchor="middle" font-size="28">😡</text>
              <text x="448" y="210" text-anchor="middle" font-size="16" font-weight="800" fill="#0f172a">ความโกรธ</text>
              <text x="448" y="229" text-anchor="middle" font-size="12.5" fill="#64748b">(Angry)</text>
            </g>

            <path class="st1-svg-arc${s >= 1 ? " is-shown" : ""}" d="M 168 148 Q 290 78 412 146" fill="none" stroke="#e11d48" stroke-width="4.5" marker-end="url(#s2Pink)"/>
            <text class="st1-svg-reveal${s >= 1 ? " is-shown" : ""}" x="405" y="122" font-size="32" font-weight="900" fill="#e11d48">+</text>

            <path class="st1-svg-arc${s >= 2 ? " is-shown" : ""}" d="M 412 242 Q 290 310 168 244" fill="none" stroke="#e11d48" stroke-width="4.5" marker-end="url(#s2Pink)"/>
            <text class="st1-svg-reveal${s >= 2 ? " is-shown" : ""}" x="158" y="286" font-size="32" font-weight="900" fill="#e11d48">+</text>

            <g class="st1-svg-reveal${s >= 3 ? " is-shown" : ""}">
              <circle cx="290" cy="195" r="26" fill="#fff1f2" stroke="#e11d48" stroke-width="2.8"/>
              <text x="290" y="204" text-anchor="middle" font-size="24" font-weight="900" fill="#be123c">R</text>
              <!-- Mini BOT Exponential Chart -->
              <rect x="34" y="322" width="510" height="118" rx="14" fill="#ffffff" stroke="#fda4af" stroke-width="1.5"/>
              <text x="50" y="348" font-size="14" font-weight="800" fill="#be123c">The More → The More · The Less → The Less</text>
              <text x="50" y="372" font-size="13" fill="#334155">เครื่องหมาย − จำนวนคู่ (0 หรือ 2 จุด) = พอกพูนทวีคูณ</text>
              <text x="50" y="394" font-size="12.5" fill="#475569">เป็นได้ทั้ง วงจรประเสริฐ (Virtuous) หรือ วงจรอุบาทว์ (Vicious)</text>
              <line x1="406" y1="420" x2="524" y2="420" stroke="#64748b" stroke-width="2"/>
              <line x1="406" y1="336" x2="406" y2="420" stroke="#64748b" stroke-width="2"/>
              <path d="M 409 412 Q 465 408 516 340" fill="none" stroke="#e11d48" stroke-width="3.5"/>
              <text x="488" y="434" text-anchor="middle" font-size="11" font-weight="700" fill="#64748b">Time (BOT)</text>
            </g>

            <!-- RIGHT HALF: BALANCING LOOP B -->
            <rect x="594" y="14" width="552" height="442" rx="20" fill="#f0fdfa" stroke="#99f6e4" stroke-width="2"/>
            <rect x="610" y="28" width="256" height="36" rx="10" fill="#0d9488"/>
            <text x="738" y="52" text-anchor="middle" font-size="16" font-weight="800" fill="#ffffff">วงจรสร้างสมดุล (Balancing: B)</text>

            <g class="st1-svg-reveal${s >= 4 ? " is-shown" : ""}">
              <rect x="620" y="148" width="184" height="94" rx="18" fill="#ffffff" stroke="#d97706" stroke-width="2.8"/>
              <text x="712" y="182" text-anchor="middle" font-size="28">🥺</text>
              <text x="712" y="210" text-anchor="middle" font-size="16" font-weight="800" fill="#0f172a">ความหิว</text>
              <text x="712" y="229" text-anchor="middle" font-size="12.5" fill="#64748b">(Hungry)</text>

              <rect x="936" y="148" width="184" height="94" rx="18" fill="#ffffff" stroke="#0d9488" stroke-width="2.8"/>
              <text x="1028" y="182" text-anchor="middle" font-size="28">🍱</text>
              <text x="1028" y="210" text-anchor="middle" font-size="16" font-weight="800" fill="#0f172a">การกินอาหาร</text>
              <text x="1028" y="229" text-anchor="middle" font-size="12.5" fill="#64748b">(Eat)</text>
            </g>

            <path class="st1-svg-arc${s >= 5 ? " is-shown" : ""}" d="M 748 148 Q 870 78 992 146" fill="none" stroke="#2563eb" stroke-width="4.5" marker-end="url(#s2Blue)"/>
            <text class="st1-svg-reveal${s >= 5 ? " is-shown" : ""}" x="985" y="122" font-size="32" font-weight="900" fill="#2563eb">+</text>

            <path class="st1-svg-arc${s >= 6 ? " is-shown" : ""}" d="M 992 242 Q 870 310 748 244" fill="none" stroke="#0d9488" stroke-width="4.5" marker-end="url(#s2Teal)"/>
            <text class="st1-svg-reveal${s >= 6 ? " is-shown" : ""}" x="738" y="288" font-size="36" font-weight="900" fill="#0d9488">−</text>

            <g class="st1-svg-reveal${s >= 7 ? " is-shown" : ""}">
              <circle cx="870" cy="195" r="26" fill="#ccfbf1" stroke="#0d9488" stroke-width="2.8"/>
              <text x="870" y="204" text-anchor="middle" font-size="24" font-weight="900" fill="#0f766e">B</text>
              <!-- Mini BOT Thermostat Chart -->
              <rect x="614" y="322" width="510" height="118" rx="14" fill="#ffffff" stroke="#5eead4" stroke-width="1.5"/>
              <text x="630" y="348" font-size="14" font-weight="800" fill="#0f766e">Thermostat Goal-Seeking · รักษาสมดุลเข้าหาเป้าหมาย</text>
              <text x="630" y="372" font-size="13" fill="#334155">เครื่องหมาย − จำนวนคี่ (เช่น 1 จุด) = ต้านกลับเข้าสู่สมดุล</text>
              <text x="630" y="394" font-size="12.5" fill="#475569">เหมือนแอร์คุมอุณหภูมิห้อง หรือการธำรงดุลยภาพ (Homeostasis)</text>
              <line x1="992" y1="420" x2="1108" y2="420" stroke="#64748b" stroke-width="2"/>
              <line x1="992" y1="336" x2="992" y2="420" stroke="#64748b" stroke-width="2"/>
              <line x1="992" y1="376" x2="1108" y2="376" stroke="#94a3b8" stroke-dasharray="4 3" stroke-width="1.8"/>
              <path d="M 995 414 Q 1034 380 1104 377" fill="none" stroke="#0d9488" stroke-width="3.5"/>
              <text x="1084" y="369" font-size="10.5" font-weight="700" fill="#0f766e">Goal</text>
            </g>
          </svg>
        </div>
      </div>
    `;
  }

  function renderCldStep3SmartSvgHtml(step) {
    const s = isExportOrHandout() ? 7 : step;
    const labels = [
      "① สิ่งที่มักคิด (เส้นตรง)",
      "② งานสมาร์ท → คำชม (+)",
      "③ คำชม → งานสมาร์ท (+)",
      "④ Loop R (ประเสริฐ/อุบาทว์)",
      "⑤ งานดี → ปริมาณงานเพิ่ม (+)",
      "⑥ งานล้น → คุณภาพลด (−)",
      "⑦ Coupled B + R",
      "⑧ สิ่งที่เกิดจริง (Burnout!)"
    ];
    return `
      <div class="st1-cld-clicker-stage">
        ${renderStepBarHtml(labels, s)}
        <div class="st1-cld-svg-card">
          <svg viewBox="0 0 1160 470" role="img" aria-label="CLD Exercise: คุณภาพงานของสมาร์ท Coupled R and B Loops">
            <defs>
              <marker id="smBlue" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="16" refX="17" refY="8" orient="auto"><polygon points="0 0, 20 8, 0 16" fill="#2563eb"/></marker>
              <marker id="smRose" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="16" refX="17" refY="8" orient="auto"><polygon points="0 0, 20 8, 0 16" fill="#e11d48"/></marker>
            </defs>

            <!-- Center Node: คุณภาพงานของสมาร์ท -->
            <g class="st1-svg-reveal is-shown">
              <rect x="315" y="195" width="220" height="74" rx="16" fill="#eff6ff" stroke="#1d4ed8" stroke-width="3.5"/>
              <text x="425" y="228" text-anchor="middle" font-size="20" font-weight="800" fill="#0f172a">คุณภาพงานของสมาร์ท</text>
              <text x="425" y="252" text-anchor="middle" font-size="13.5" fill="#475569">(Smart's Work Quality)</text>

              <rect x="620" y="195" width="205" height="74" rx="16" fill="#f0fdf4" stroke="#16a34a" stroke-width="3"/>
              <text x="722" y="228" text-anchor="middle" font-size="20" font-weight="800" fill="#0f172a">คำชื่นชมของหัวหน้า</text>
              <text x="722" y="252" text-anchor="middle" font-size="13.5" fill="#475569">(Supervisor's Praise)</text>
            </g>

            <!-- Right Loop R: Smart's Quality <-> Praise -->
            <path class="st1-svg-arc${s >= 1 ? " is-shown" : ""}" d="M 465 195 Q 575 95 685 192" fill="none" stroke="#2563eb" stroke-width="4.5" marker-end="url(#smBlue)"/>
            <text class="st1-svg-reveal${s >= 1 ? " is-shown" : ""}" x="680" y="166" font-size="32" font-weight="900" fill="#2563eb">+</text>

            <path class="st1-svg-arc${s >= 2 ? " is-shown" : ""}" d="M 685 269 Q 575 370 465 272" fill="none" stroke="#2563eb" stroke-width="4.5" marker-end="url(#smBlue)"/>
            <text class="st1-svg-reveal${s >= 2 ? " is-shown" : ""}" x="454" y="314" font-size="32" font-weight="900" fill="#2563eb">+</text>

            <g class="st1-svg-reveal${s >= 3 ? " is-shown" : ""}">
              <circle cx="574" cy="232" r="24" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2.5"/>
              <text x="574" y="240" text-anchor="middle" font-size="22" font-weight="900" fill="#1e40af">R</text>
              <text x="574" y="388" text-anchor="middle" font-size="14" font-weight="700" fill="#1e40af">Self-Fulfilling Prophecy (ประเสริฐ / อุบาทว์)</text>
            </g>

            <!-- Left Node & Loop B: ปริมาณงานของสมาร์ท -->
            <g class="st1-svg-reveal${s >= 4 ? " is-shown" : ""}">
              <rect x="24" y="195" width="205" height="74" rx="16" fill="#fff1f2" stroke="#e11d48" stroke-width="3"/>
              <text x="126" y="228" text-anchor="middle" font-size="20" font-weight="800" fill="#0f172a">ปริมาณงานของสมาร์ท</text>
              <text x="126" y="252" text-anchor="middle" font-size="13.5" fill="#475569">(Smart's Workload)</text>
            </g>

            <!-- Quality -> Workload (+) along bottom -->
            <path class="st1-svg-arc${s >= 4 ? " is-shown" : ""}" d="M 380 269 Q 272 370 165 272" fill="none" stroke="#2563eb" stroke-width="4.5" marker-end="url(#smBlue)"/>
            <text class="st1-svg-reveal${s >= 4 ? " is-shown" : ""}" x="154" y="314" font-size="32" font-weight="900" fill="#2563eb">+</text>

            <!-- Workload -> Quality (−) along top -->
            <path class="st1-svg-arc${s >= 5 ? " is-shown" : ""}" d="M 165 195 Q 272 95 380 192" fill="none" stroke="#e11d48" stroke-width="4.5" marker-end="url(#smRose)"/>
            <text class="st1-svg-reveal${s >= 5 ? " is-shown" : ""}" x="374" y="166" font-size="36" font-weight="900" fill="#e11d48">−</text>

            <g class="st1-svg-reveal${s >= 6 ? " is-shown" : ""}">
              <circle cx="272" cy="232" r="24" fill="#ffe4e6" stroke="#e11d48" stroke-width="2.5"/>
              <text x="272" y="240" text-anchor="middle" font-size="22" font-weight="900" fill="#be123c">B</text>
              <text x="272" y="88" text-anchor="middle" font-size="15.5" font-weight="800" fill="#be123c">Coupled R + B = โครงสร้าง Limits to Success!</text>
            </g>

            <!-- Right Panel: Linear Thinking vs What Really Happens (BOT) -->
            <g transform="translate(852, 24)">
              <rect width="290" height="198" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
              <text x="145" y="30" text-anchor="middle" font-size="14.5" font-weight="800" fill="#475569">WHAT WE USUALLY THINK (Linear)</text>
              <line x1="44" y1="162" x2="256" y2="162" stroke="#64748b" stroke-width="2"/>
              <line x1="44" y1="54" x2="44" y2="162" stroke="#64748b" stroke-width="2"/>
              <line x1="48" y1="145" x2="244" y2="68" stroke="#2563eb" stroke-width="4"/>
              <text x="145" y="184" text-anchor="middle" font-size="12.5" fill="#64748b">คิดว่ายิ่งชม ผลงานสมาร์ทยิ่งพุ่งเส้นตรง</text>
            </g>

            <g transform="translate(852, 244)">
              <g class="st1-svg-reveal${s >= 7 ? " is-shown" : s === 3 ? " is-shown" : ""}">
                <rect width="290" height="202" rx="16" fill="${s >= 7 ? "#fff1f2" : "#ecfdf5"}" stroke="${s >= 7 ? "#fda4af" : "#6ee7b7"}" stroke-width="2"/>
                <text x="145" y="30" text-anchor="middle" font-size="14.5" font-weight="800" fill="${s >= 7 ? "#be123c" : "#047857"}">${s >= 7 ? "WHAT REALLY HAPPENS (R + B)" : "VIRTUOUS vs. VICIOUS FORK"}</text>
                <line x1="44" y1="162" x2="256" y2="162" stroke="#64748b" stroke-width="2"/>
                <line x1="44" y1="52" x2="44" y2="162" stroke="#64748b" stroke-width="2"/>
                ${
                  s >= 7
                    ? `<path d="M 48 152 Q 115 140 165 78 Q 205 52 246 138" fill="none" stroke="#e11d48" stroke-width="4"/><text x="206" y="64" font-size="13" font-weight="800" fill="#be123c">“Burnout!”</text><text x="145" y="185" text-anchor="middle" font-size="12.5" font-weight="700" fill="#881337">งานล้นเกินศักยภาพ → ชนเพดานและหมดไฟ</text>`
                    : `<path d="M 48 112 Q 150 108 242 56" fill="none" stroke="#059669" stroke-width="3.5"/><path d="M 48 112 Q 150 116 242 156" fill="none" stroke="#e11d48" stroke-width="3.5"/><text x="205" y="54" font-size="12" font-weight="800" fill="#047857">ประเสริฐ</text><text x="205" y="152" font-size="12" font-weight="800" fill="#be123c">อุบาทว์</text>`
                }
              </g>
            </g>
          </svg>
        </div>
      </div>
    `;
  }

  function renderLilyPondSvgHtml(step) {
    const revealed = isExportOrHandout() || step >= 1;
    return `
      <div class="st1-cld-clicker-stage">
        ${renderStepBarHtml(["① โจทย์ทายใจห้องเรียน (คิดก่อนคลิก!)", "② เฉลยกราฟทวีคูณ (Structure > Trends)"], revealed ? 1 : 0)}
        <div class="st1-split-fig-left" style="height:100%">
          <div class="st1-cld-svg-card">
            <svg viewBox="0 0 640 420" role="img" aria-label="Lily Pond Exponential Growth Chart">
              <line x1="78" y1="355" x2="585" y2="355" stroke="#0f172a" stroke-width="3"/>
              <line x1="78" y1="35" x2="78" y2="355" stroke="#0f172a" stroke-width="3"/>
              <text x="64" y="48" text-anchor="end" font-size="16" font-weight="800" fill="#0f172a">100%</text>
              <text x="64" y="200" text-anchor="end" font-size="15" font-weight="700" fill="#64748b">50%</text>
              <text x="64" y="358" text-anchor="end" font-size="16" font-weight="800" fill="#0f172a">0%</text>
              <text x="78" y="382" text-anchor="middle" font-size="15" font-weight="700" fill="#334155">Day 0</text>
              <text x="330" y="382" text-anchor="middle" font-size="15" font-weight="700" fill="#334155">Day 15</text>
              <text x="568" y="382" text-anchor="middle" font-size="15" font-weight="800" fill="#0f172a">Day 30</text>
              <text x="330" y="408" text-anchor="middle" font-size="15" font-weight="800" fill="#475569">เวลา (Time in Days) · % พื้นที่สระบัวที่ถูกคลุม</text>

              <!-- Linear illusion dashed line -->
              <line x1="78" y1="355" x2="568" y2="44" stroke="#94a3b8" stroke-width="2.5" stroke-dasharray="7 6"/>
              <text x="275" y="175" font-size="14" font-weight="700" fill="#64748b" transform="rotate(-32 275 175)">ภาพลวงตาเชิงเส้นตรง (Linear Illusion)</text>

              ${
                revealed
                  ? `
                <line x1="78" y1="199" x2="552" y2="199" stroke="#0d9488" stroke-dasharray="5 4" stroke-width="2"/>
                <line x1="552" y1="199" x2="552" y2="355" stroke="#0d9488" stroke-dasharray="5 4" stroke-width="2"/>
                <path d="M 78 354 L 330 354 L 485 352 Q 536 346 552 199 L 568 44" fill="none" stroke="#e11d48" stroke-width="5"/>
                <circle cx="330" cy="354" r="6" fill="#2563eb"/>
                <text x="330" y="335" text-anchor="middle" font-size="14.5" font-weight="800" fill="#1d4ed8">Day 15 = 0.003% (แทบมองไม่เห็น!)</text>
                <circle cx="552" cy="199" r="7" fill="#0d9488"/>
                <text x="445" y="188" text-anchor="middle" font-size="16" font-weight="900" fill="#0f766e">Day 29 = 50% (ครึ่งสระ!)</text>
                <circle cx="568" cy="44" r="7" fill="#e11d48"/>
              `
                  : `
                <text x="335" y="245" text-anchor="middle" font-size="22" font-weight="800" fill="#2563eb">🤔 ลองทายคำตอบทั้ง 2 ข้อก่อนคลิกดูเฉลย!</text>
              `
              }
            </svg>
          </div>

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">KNOWN FACTS · ข้อเท็จจริงของสระบัว</span>
              <h3 class="or-card-title">ใบบัวขยายพื้นที่เป็น 2 เท่าทุกวัน และเต็มสระ 100% ในวันที่ 30</h3>
              <p class="or-card-text"><strong>คำถามที่ 1:</strong> สระน้ำถูกใบบัวคลุมไป <strong>ครึ่งสระ (50%)</strong> ในวันที่เท่าไร?<br><strong>คำถามที่ 2:</strong> ใน <strong>วันที่ 15</strong> ใบบัวคลุมพื้นที่สระไปกี่เปอร์เซ็นต์?</p>
            </div>

            ${
              revealed
                ? `
              <div class="or-card is-rose-tint">
                <span class="or-card-kicker">EXPONENTIAL REVEAL · คำตอบที่ขัดสามัญสำนึกเส้นตรง</span>
                <h3 class="or-card-title">ครึ่งสระใน “วันที่ 29” · และวันที่ 15 มีเพียง “.003%”!</h3>
                <p class="or-card-text">ตลอด 25 วันแรกแทบไม่มีใครสังเกตเห็นปัญหา แต่จาก <code>50% → 100%</code> ใช้เวลาเพียง <strong>วันเดียวสุดท้าย</strong> เหมือนการระบาดของโรค โลกร้อน หรือภาระโรคเรื้อรังสะสม</p>
              </div>
              <div class="or-card is-teal-tint">
                <span class="or-card-kicker">SYSTEMS LESSON · บทเรียนต่อระบบสุขภาพ</span>
                <h3 class="or-card-title">“Structure Is a Better Predictor Than Trends”</h3>
                <p class="or-card-text">อย่ารอให้กราฟเหตุการณ์พุ่งวิกฤตในวันที่ 29 แล้วค่อยตั้งรับ — แพทย์นักคิดเชิงระบบต้องอ่าน <strong>โครงสร้างวงจรเสริมแรง (Loop R)</strong> ให้ออกและวางคานงัดตั้งแต่วันต้น ๆ</p>
              </div>
            `
                : `
              <div class="or-card is-amber-tint">
                <span class="or-card-kicker">CLASSROOM POLL · ลองยกมือโหวตในห้องเรียน</span>
                <h3 class="or-card-title">สมองมนุษย์มักคุ้นชินกับการคิดเชิงเส้นตรง (Linear Extrapolation)</h3>
                <p class="or-card-text">หากคิดแบบเส้นตรง หลายคนมักเดาว่าครึ่งสระคือวันที่ 15... กดปุ่มด้านล่างหรือกด <code>Space / →</code> เพื่อเปิดกราฟเฉลยความจริงของวงจรเสริมกำลัง (<code>Loop R</code>)!</p>
                <div style="margin-top:8px">
                  <button type="button" class="or-tool-btn is-primary" data-st1-substep="1">✨ คลิกเปิดเฉลยกราฟสระบัว (Day 29 &amp; Day 15)</button>
                </div>
              </div>
            `
            }
          </div>
        </div>
      </div>
    `;
  }

  /* ---------- Interactive Widget 3: En-ROADS 6-Sector Policy Sandbox (Slide 29) ---------- */
  function computeEnroadsProjection() {
    const s = state.enrSliders;
    // Calibrated pedagogical approximation matching MIT En-ROADS relative lever weights from +3.6 C baseline:
    // No single slider can drop temp by more than ~0.5 C alone ("No Silver Bullet")!
    const dEnergy = (s.energy / 100) * 0.62;
    const dTrans = (s.transport / 100) * 0.28;
    const dBuild = (s.buildings / 100) * 0.26;
    const dGrowth = (s.growth / 100) * 0.22;
    const dLand = (s.land / 100) * 0.38;
    const dRem = (s.removal / 100) * 0.34;
    const activeCnt = [s.energy, s.transport, s.buildings, s.growth, s.land, s.removal].filter((v) => v >= 45).length;
    const synergy = activeCnt >= 4 ? (activeCnt - 3) * 0.05 : 0;
    const temp = Math.max(1.4, +(3.6 - (dEnergy + dTrans + dBuild + dGrowth + dLand + dRem + synergy)).toFixed(1));
    const econScore = Math.min(
      98,
      Math.round(52 + s.energy * 0.14 + s.transport * 0.09 + s.buildings * 0.10 + s.land * 0.07 + s.removal * 0.06 - Math.max(0, temp - 2.0) * 12)
    );
    return { temp, tempF: +(temp * 1.8).toFixed(1), econScore, activeCnt };
  }

  function renderEnroadsSandboxHtml() {
    const proj = computeEnroadsProjection();
    const s = state.enrSliders;
    const tempCls = proj.temp <= 1.7 ? "is-safe" : proj.temp <= 2.4 ? "is-warm" : "is-hot";
    const sliders = [
      { key: "energy", lbl: "1. พลังงานสะอาด & ราคาคาร์บอน", val: s.energy },
      { key: "transport", lbl: "2. ขนส่งประสิทธิภาพสูง & EV", val: s.transport },
      { key: "buildings", lbl: "3. อาคาร & อุตสาหกรรมไฟฟ้า", val: s.buildings },
      { key: "growth", lbl: "4. รูปแบบการเติบโตอย่างยั่งยืน", val: s.growth },
      { key: "land", lbl: "5. ลดตัดไม้ & ลดก๊าซมีเทน", val: s.land },
      { key: "removal", lbl: "6. ปลูกป่า & ดักจับคาร์บอน", val: s.removal }
    ];
    return `
      <div class="st1-enr-sandbox">
        <div class="st1-enr-temp-head">
          <div>
            <span class="or-card-kicker" style="margin:0">🌍 ผลจำลองปี ค.ศ. 2100 (ลองเลื่อนปรับนโยบาย!)</span>
            <div style="font-size:clamp(10px,0.86cqw,13px);font-weight:700;color:#475569;margin-top:2px">
              ดัชนีเศรษฐกิจและสุขภาวะร่วม: <strong style="color:#0d9488">${proj.econScore}/100</strong> · ขยับแล้ว ${proj.activeCnt}/6 หมวด
            </div>
          </div>
          <div style="text-align:right">
            <div class="st1-enr-temp-big ${tempCls}" id="st1EnrTempVal">+${proj.temp.toFixed(1)}°C</div>
            <span style="font-size:11px;font-weight:700;color:#64748b">(+${proj.tempF}°F · Baseline +3.6°C)</span>
          </div>
        </div>

        <div class="st1-enr-sliders-grid">
          ${sliders
            .map(
              (sl) => `
            <label class="st1-enr-slider-item">
              <span class="st1-enr-slider-lbl"><span>${esc(sl.lbl)}</span><span data-enr-pct="${sl.key}">${sl.val}%</span></span>
              <input type="range" min="0" max="100" step="5" value="${sl.val}" data-st1-enr="${sl.key}" />
            </label>
          `
            )
            .join("")}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="or-tool-btn" data-st1-enr-preset="single" title="พิสูจน์ว่าขยับแค่ปลูกป่าอย่างเดียวลดอุณหภูมิไม่พอ">🧪 ลองแก้จุดเดียว (Silver Bullet?)</button>
            <button type="button" class="or-tool-btn is-primary" data-st1-enr-preset="portfolio" title="ขยับชุดคานงัดทั้ง 6 หมวดร่วมกัน">✨ ชุดนโยบายทั้งระบบ (+1.5°C)</button>
            <button type="button" class="or-tool-btn" data-st1-enr-preset="reset">↺ Baseline</button>
          </div>
          <a class="or-tool-btn is-primary" href="https://en-roads.climateinteractive.org/" target="_blank" rel="noopener">🚀 เปิด En-ROADS ตัวจริง ↗</a>
        </div>
      </div>
    `;
  }

  const SVG = {
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
    handout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="17" x2="13" y2="17"/></svg>`,
    slides: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    play: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    notes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>`,
    fullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    clicker: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="5"/><circle cx="12" cy="8" r="2"/><line x1="12" y1="14" x2="12" y2="17"/></svg>`,
    more: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`
  };

  /* ---------- 6 Interactive Kahoot-Style Concept Check MCQs ---------- */
  const QUIZ_ITEMS = [
    {
      id: "st1_q1",
      kicker: "ข้อ 1 / 6 · Warped Juggle, Limits to Success & Growth and Underinvestment",
      stem: "ในเกม Warped Juggle เมื่อทีมมุ่งออกแรงโยนบอลให้เร็วขึ้นในวงเดิมจนบอลตกพื้นซ้ำ ๆ (เวลาเดินต่อไม่หยุด) และเริ่มปลงว่า ‘25 วินาทีก็ดีพอแล้ว’ สะท้อนพลวัตใด?",
      choices: [
        "วงจรเสริมกำลังประเสริฐ (Virtuous Cycle) ที่จะลดเวลาลงได้อย่างไม่จำกัดหากซ้อมท่าเดิมต่อไปเรื่อย ๆ",
        "การติดเพดาน Limits to Success (Loop B1) ร่วมกับกับดักเป้าหมายเลื่อนไหล (Floating Goal: R2) แทนการลงทุนเวลาเรียนรู้เพื่อออกแบบโครงสร้างใหม่ (Loop B2)",
        "ระบบสามัญ (Simple System) ที่มีสูตรสำเร็จตายตัวเพียงวิธีเดียว",
        "ความผิดพลาดของสมาชิกเป็นรายบุคคลที่ต้องเพิ่มกฎระเบียบลงโทษให้ซับซ้อนขึ้น"
      ],
      correctIdx: 1,
      explain: "การเร่งโยนท่าเดิม (Work Harder) ยิ่งชนเพดานกติกาบอลตก (B1) หากลดเพดานเป้าหมายลง (R2: Floating Goal) จะไม่เกิดการหยุดอภิปรายเพื่อปลดล็อกสมมติฐานและออกแบบกระบวนการใหม่ (B2: Work Smarter)"
    },
    {
      id: "st1_q2",
      kicker: "ข้อ 2 / 6 · การเขียน CLD & กรณีคุณภาพงานของสมาร์ท",
      stem: "ใน CLD กรณี ‘คุณภาพงานของสมาร์ท’ เมื่อคุณภาพงานดีขึ้นจึงได้รับมอบปริมาณงานเพิ่มขึ้น (+) และเมื่อปริมาณงานล้นมือส่งผลให้คุณภาพงานลดลง (−) วงจรด้านซ้ายนี้เป็นวงจรชนิดใด?",
      choices: [
        "วงจรเสริมกำลัง (Reinforcing Loop: R) เพราะมีเครื่องหมายบวกมากกว่าลบ",
        "ความสัมพันธ์เชิงเส้นตรง (Linear Relationship) ที่ทำให้ผลงานพุ่งขึ้นตลอดกาล",
        "วงจรสร้างสมดุล (Balancing Loop: B) ที่มีเครื่องหมายลบจำนวนคี่ (1 จุด) คอยถ่วงดุลวงจร R จนเกิดเพดานหรือภาวะ Burnout",
        "ไม่มีวงจรป้อนกลับเพราะปริมาณงานไม่ได้เชื่อมกลับหาคุณภาพงาน"
      ],
      correctIdx: 2,
      explain: "เมื่อไล่ครบรอบมีเครื่องหมาย − จำนวนคี่ (1 จุดที่หัวลูกศร ปริมาณงาน → คุณภาพงาน) จึงเป็นวงจรสร้างสมดุล (B) ที่ประกบคู่กับวงจรคำชื่นชม (R) อธิบายว่าทำไมคนเก่งที่ถูกอัดงานหนักเกินศักยภาพจึงเกิดภาวะหมดไฟ (Burnout)"
    },
    {
      id: "st1_q3",
      kicker: "ข้อ 3 / 6 · บริบทของระบบ, CAS & Chaordic Principles (Dee Hock)",
      stem: "ข้อใดเชื่อมโยงธรรมชาติของระบบซับซ้อนที่ปรับตัวได้ (CAS) เข้ากับหลักการองค์กรเคออร์ดิก (Chaordic) ของ Dee Hock ได้ถูกต้องที่สุด?",
      choices: [
        "ต้องออกกฎระเบียบและคำสั่งควบคุมจากส่วนกลางให้ละเอียดซับซ้อนที่สุดเพื่อให้บุคลากรทำตามเหมือนกันทุกแห่ง",
        "การส่งจรวดไปดวงจันทร์และระบบสุขภาพใช้พิมพ์เขียวเดียวกันได้โดยไม่ต้องคำนึงถึงบริบท",
        "การวางเป้าหมายและหลักการที่เรียบง่ายชัดเจน (Simple, Clear Purpose & Principles) เอื้อให้ทีมและชุมชนจัดการตนเอง (Self-Organizing) อย่างชาญฉลาดตามบริบท",
        "ความไม่แน่นอนของ CAS แปลว่าแพทย์ไม่ต้องกำหนดขอบเขตหรือเป้าหมายใด ๆ เลย"
      ],
      correctIdx: 2,
      explain: "Dee Hock ชี้ว่าเป้าหมายและหลักการที่เรียบง่ายชัดเจนก่อให้เกิดพฤติกรรมที่ซับซ้อนและชาญฉลาด สอดคล้องกับการเกื้อหนุนคุณสมบัติ Self-organizing และ Emerging property ของระบบสุขภาพในฐานะ CAS"
    },
    {
      id: "st1_q4",
      kicker: "ข้อ 4 / 6 · คลินิกข้างเตียง & โรคเรื้อรัง (Stacey Matrix & Chronic Complex Care)",
      stem: "ผู้ป่วยหญิงอายุ 48 ปี เจ็บหน้าอกเรื้อรังไม่จำเพาะร่วมกับซึมเศร้า แต่ญาติโกรธที่แพทย์ส่งตรวจแยกโรคหัวใจก่อน แพทย์ควรรับมืออย่างไรตามกรอบ Stacey Matrix?",
      choices: [
        "ออกคำสั่งบังคับตามแนวทางมาตรฐานทันทีเหมือนพื้นที่เรียบง่าย (Simple)",
        "ส่งต่อจิตแพทย์ทันทีโดยไม่ต้องตรวจแยกโรคทางกายเพื่อลดเวลารอคอย",
        "รับฟังความกลัวและสื่อสารเหตุผลการตรวจแยกโรครวมถึงความไม่แน่นอนอย่างโปร่งใส เพื่อประคับประคองไม่ให้ถลำสู่ภาวะ Chaotic",
        "นัดตรวจสั้น ๆ และสั่งยาฝ่ายเดียวเหมือนรูปแบบดูแลโรคเฉียบพลัน"
      ],
      correctIdx: 2,
      explain: "สถานการณ์อยู่ในพื้นที่ซับซ้อน (Complex / Edge of Chaos) ที่มีทั้งความไม่แน่นอนทางคลินิกและความเห็นต่าง ต้องใช้การสื่อสารอย่างใส่ใจและสร้างความเข้าใจร่วมกันในฐานะหุ้นส่วน"
    },
    {
      id: "st1_q5",
      kicker: "ข้อ 5 / 6 · วงจรอุบาทว์ความแออัดห้องฉุกเฉิน (ER Crowding CLD)",
      stem: "ในแผนผัง CLD ห้องฉุกเฉิน เมื่อดึงงบและแพทย์จากคลินิกนอก ER มาเพิ่มเฉพาะใน ER เพียงจุดเดียว จะเกิดพลวัตระยะยาวแบบใด?",
      choices: [
        "เกิดวงจรสมดุล (B) ที่ทำให้จำนวนผู้ป่วย ER ลดลงจนเข้าสู่สมดุลถาวร",
        "มีเครื่องหมายลบ 2 จุดหักล้างกันเป็นบวก จึงหมุนเป็นวงจรเสริมแรง (R) ดึงผู้ป่วยทั่วไปเข้า ER เพิ่มขึ้นและบั่นทอนบริการปฐมภูมินอก ER",
        "บริการผู้ป่วยนอกทั่วไปเข้าถึงง่ายขึ้นเพราะทรัพยากรในโรงพยาบาลเพิ่มขึ้นเอง",
        "ผู้ป่วยไม่ฉุกเฉินย้ายไป รพ.สต. เองโดยไม่ต้องลงทุนขยายขีดความสามารถปฐมภูมิ"
      ],
      correctIdx: 1,
      explain: "เครื่องหมาย − สองจุด (ที่ทรัพยากรนอก ER ลดลง และการเลือกมา ER เพิ่มขึ้นเมื่อปฐมภูมิเข้าถึงยาก) คูณกันเป็นบวก จึงหมุนเร่งเป็นวงจรอุบาทว์ (Loop R) ต้องแก้ด้วยการลงทุนขยายศักยภาพปฐมภูมินอกเวลาควบคู่กัน"
    },
    {
      id: "st1_q6",
      kicker: "ข้อ 6 / 6 · แบบจำลองภูเขาน้ำแข็ง & En-ROADS Planetary Simulator",
      stem: "บทเรียนร่วมกันจากแบบจำลองภูเขาน้ำแข็ง (Iceberg Model), ปริศนาสระบัว (Lily Pond) และเกมจำลองนโยบายโลก En-ROADS คือข้อใด?",
      choices: [
        "การตั้งรับระดับเหตุการณ์เฉพาะหน้า (Events — To React) ในวันที่ 29 เพียงจุดเดียวให้พลังจุดคานงัดสูงสุด",
        "มีนโยบายกระสุนเงินนัดเดียว (Single Silver Bullet) เช่น ปลูกป่าเพียงอย่างเดียวที่ลดอุณหภูมิโลกสู่ +1.5°C ได้ทันที",
        "ต้องส่องลึกใต้ผิวน้ำสู่โครงสร้างระบบ (CLD — To Design) และรูปแบบความคิด (Mental Models — To Transform) พร้อมขยับชุดคานงัดหลายภาคส่วนร่วมกันล่วงหน้า",
        "การคิดอย่างเป็นระบบ (Systematic Thinking) เพียงอย่างเดียวเพียงพอแล้วโดยไม่ต้องดูวงจรป้อนกลับ"
      ],
      correctIdx: 2,
      explain: "ปัญหาซับซ้อนที่มี Time Delay และการเติบโตทวีคูณไม่อาจแก้ด้วยกระสุนเงินนัดเดียวหรือรอแก้ปลายเหตุเหนือผิวน้ำ แต่ต้องปรับโครงสร้างและกรอบความคิดควบคู่กันหลายจุดคานงัด (Silver Buckshot)"
    }
  ];

  function renderQuizStageHtml(isEmbedded) {
    const q = QUIZ_ITEMS[state.quizIdx] || QUIZ_ITEMS[0];
    const picked = Object.prototype.hasOwnProperty.call(state.quizAnswers, q.id) ? Number(state.quizAnswers[q.id]) : null;
    const revealed = picked !== null || Boolean(state.facultyRevealMap[q.id]);
    const shapes = ["▲", "◆", "●", "■"];

    let answeredCnt = 0, correctCnt = 0;
    QUIZ_ITEMS.forEach((it) => {
      if (Object.prototype.hasOwnProperty.call(state.quizAnswers, it.id)) {
        answeredCnt += 1;
        if (Number(state.quizAnswers[it.id]) === it.correctIdx) correctCnt += 1;
      }
    });

    const qVotes = state.liveVoteMap[q.id] || {};
    const totalLiveVotes = Object.keys(qVotes).length;
    const choiceCounts = [0, 0, 0, 0];
    Object.values(qVotes).forEach((v) => {
      if (v >= 0 && v < 4) choiceCounts[v] += 1;
    });

    return `
      <div class="st1-quiz-stage" data-st1-quiz-root="1">
        <div class="st1-qz-top">
          <div class="st1-qz-pills" role="tablist" aria-label="เลือกข้อคำถามทบทวน ST1">
            ${QUIZ_ITEMS.map((item, idx) => {
              const hasAns = Object.prototype.hasOwnProperty.call(state.quizAnswers, item.id);
              const ok = hasAns && Number(state.quizAnswers[item.id]) === item.correctIdx;
              const cls = idx === state.quizIdx ? " is-current" : hasAns ? (ok ? " is-answered-ok" : " is-answered-err") : "";
              return `<button type="button" class="st1-qz-step-dot${cls}" data-st1-qjump="${idx}">ข้อ ${idx + 1}${hasAns ? (ok ? " ✓" : " ✕") : ""}</button>`;
            }).join("")}
          </div>
          <div class="st1-qz-pills">
            <span class="or-mini-chip">คะแนน: <strong>${correctCnt}/${QUIZ_ITEMS.length}</strong>${totalLiveVotes > 0 ? ` · 📡 ตอบสด ${totalLiveVotes} คน` : ""}</span>
            ${
              ROLE === "faculty"
                ? `<button type="button" class="st1-qz-step-dot" data-st1-qact="toggle-reveal">${state.facultyRevealMap[q.id] ? "🙈 ซ่อนเฉลย" : "👁️ เฉลยหน้าชั้นเรียน"}</button>`
                : ""
            }
            ${
              answeredCnt > 0 || Object.keys(state.facultyRevealMap).length > 0
                ? `<button type="button" class="st1-qz-step-dot" data-st1-qact="reset-quiz">↺ เริ่มใหม่</button>`
                : ""
            }
          </div>
        </div>

        <div class="st1-qz-stem-box">
          <span class="st1-qz-kicker">${esc(q.kicker)}</span>
          <h3 class="st1-qz-stem">${esc(q.stem)}</h3>
        </div>

        <div class="st1-qz-grid">
          ${q.choices
            .map((cText, cIdx) => {
              let stateCls = "";
              if (revealed) {
                if (cIdx === q.correctIdx) stateCls = " is-correct-reveal";
                else if (picked === cIdx) stateCls = " is-wrong-picked";
                else stateCls = " is-dimmed";
              }
              return `
                <button type="button" class="st1-qz-choice c-${cIdx}${stateCls}" data-st1-qpick="${cIdx}">
                  <span class="st1-qz-choice-left">
                    <span class="st1-qz-shape">${shapes[cIdx]}</span>
                    <span>${esc(cText)}</span>
                  </span>
                  ${revealed && totalLiveVotes > 0 ? `<span class="st1-qz-live-cnt">${choiceCounts[cIdx]} คน</span>` : ""}
                </button>
              `;
            })
            .join("")}
        </div>

        ${
          revealed
            ? `
          <div class="st1-qz-explain${picked !== null && picked !== q.correctIdx ? " is-wrong" : ""}">
            <div>
              <strong>${
                picked === null
                  ? "★ เฉลยผู้สอน:"
                  : picked === q.correctIdx
                  ? "✓ ถูกต้อง!"
                  : `✕ คำตอบที่ถูกคือตัวเลือก ${shapes[q.correctIdx]}:`
              }</strong>
              ${esc(q.explain)}
            </div>
            ${
              state.quizIdx < QUIZ_ITEMS.length - 1
                ? `<button type="button" class="or-tool-btn is-primary" data-st1-qjump="${state.quizIdx + 1}" style="flex-shrink:0">ข้อถัดไป &rarr;</button>`
                : isEmbedded
                ? `<button type="button" class="or-tool-btn is-primary" data-st1-qact="goto-final-slide" style="flex-shrink:0">ไปหน้าสรุปเชื่อมภาคสนาม &rarr;</button>`
                : ""
            }
          </div>
        `
            : `
          <div class="st1-qz-foot">
            <span class="or-td-sub">💡 แตะเลือกคำตอบ 1 ข้อเพื่อส่งคำตอบสดและดูคำอธิบายเชิงระบบทันที</span>
            <div style="display:flex;gap:6px">
              <button type="button" class="or-tool-btn" data-st1-qjump="${Math.max(0, state.quizIdx - 1)}" ${state.quizIdx === 0 ? "disabled" : ""}>&larr; ข้อก่อนหน้า</button>
              <button type="button" class="or-tool-btn" data-st1-qjump="${Math.min(QUIZ_ITEMS.length - 1, state.quizIdx + 1)}" ${state.quizIdx === QUIZ_ITEMS.length - 1 ? "disabled" : ""}>ข้อถัดไป &rarr;</button>
            </div>
          </div>
        `
        }
      </div>
    `;
  }

  /* ---------- Complete 31-Slide Interactive Master ST1 Deck ---------- */
  const SLIDES = [
    {
      id: "s01-cover",
      num: "01",
      section: "intro",
      sectionLabel: "Opening",
      actClass: "",
      actLabel: "OPENING · 5-ACT INTERACTIVE MASTER DECK",
      timeWindow: "09.30 – 09.34 น. (4 นาที)",
      kicker: "RACM 303 · ACADEMIC YEAR 2569 · FOUNDATIONAL SESSION ST1",
      title: "Systems & Systems Thinking: แนวคิดเรื่องระบบและการคิดเชิงระบบ",
      keyMessageHtml:
        "เรียนรู้ผ่านประสบการณ์จริงจาก <strong>เกม Warped Juggle</strong> สู่ <strong>การเขียน CLD &amp; แม่แบบเชิงระบบ</strong> <strong>ภูเขาน้ำแข็ง &amp; Chaordic</strong> <strong>ความซับซ้อนทางคลินิก/ห้องฉุกเฉิน</strong> และ <strong>จำลองนโยบายพิภพโลก En-ROADS</strong>",
      notes:
        "เปิดคาบ ST1 (09.30–12.00 น. · 150 นาที) ต่อเนื่องจากปฐมนิเทศรายวิชา ให้นักศึกษาทั้ง 169 คนสแกน QR Code เพื่อซิงค์สไลด์สดบนมือถือ/iPad แนะนำโครงสร้าง 5 องก์ที่ผสานกิจกรรมเชิงประสบการณ์ (Warped Juggle & En-ROADS) เข้ากับเนื้อหาหลักในเอกสารคำสอน ST1 อย่างครบถ้วน",
      isCover: true
    },
    {
      id: "s02-roadmap",
      num: "02",
      section: "intro",
      sectionLabel: "Opening · Learning Arc",
      actClass: "",
      actLabel: "OPENING · 150-MINUTE MASTER FLOW",
      timeWindow: "09.34 – 09.38 น. (4 นาที)",
      kicker: "01 · 5-ACT EXPERIENTIAL & CONCEPTUAL JOURNEY (09.30 – 12.00 น.)",
      title: "แผนที่การเรียนรู้ 5 องก์: จากประสบการณ์จริงในทีม สู่คลินิก โรงพยาบาล และระบบพิภพโลก",
      keyMessageHtml:
        "สัมผัสพลวัตระบบด้วยตนเองก่อนสรุปทฤษฎี: <strong>Warped Juggle</strong> → <strong>CLD &amp; System Archetypes</strong> → <strong>Iceberg, Chaordic &amp; CAS</strong> → <strong>Stacey &amp; ER CLD</strong> → <strong>En-ROADS &amp; Quiz</strong>",
      notes:
        "ชี้ให้เห็นลำดับเหตุผล (Logical Flow) ตามวงจรการเรียนรู้เชิงประสบการณ์ (Experiential Learning): เริ่มจากลงมือเล่นเกมกลุ่มเพื่อเห็นสมมติฐานที่ซ่อนเร้น ถอดรหัสเป็นตัวแปรและ CLD ทีละขั้น เชื่อมเข้าสู่ทฤษฎี CAS ความซับซ้อนในคลินิก/ER และปิดท้ายด้วยเกมจำลองนโยบายระดับโลกก่อนเข้าสู่เวทีเสวนาภาคบ่าย",
      render: () => `
        <div class="st1-roadmap-layout">
          <div class="st1-full-grid-5" data-fit-group="cards">
            <div class="or-card is-amber-tint">
              <span class="or-card-kicker">ACT I · 09.38 – 10.02 น.</span>
              <h3 class="or-card-title">“The Warped Juggle”</h3>
              <p class="or-card-text">ปฏิบัติการกติกา 5 ข้อ จับเวลาจริง ท้าทายลดเวลาลงครึ่งหนึ่ง และสกัด <strong>ปัจจัยขับเคลื่อนระบบ 8 ประการ</strong></p>
            </div>
            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">ACT II · 10.02 – 10.30 น.</span>
              <h3 class="or-card-title">ฝึกเขียน CLD &amp; Archetypes</h3>
              <p class="or-card-text">ฝึก Clicker <code>+ / −</code>, <code>R / B</code>, งานของสมาร์ท, สระบัว, <code>Limits to Success</code> และ <code>Growth &amp; Underinvestment</code></p>
            </div>
            <div class="or-card is-violet-tint">
              <span class="or-card-kicker">ACT III · 10.30 – 11.12 น.</span>
              <h3 class="or-card-title">ภูเขาน้ำแข็ง · Chaordic · CAS</h3>
              <p class="or-card-text"><code>Iceberg</code> 4 ระดับ, หลักการ <code>Chaordic</code> ของ Dee Hock, ขอบเขต/บริบทระบบ และ 5 คุณสมบัติ <code>CAS</code> <em>(พักเบรก 10.45–11.00)</em></p>
            </div>
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">ACT IV · 11.12 – 11.36 น.</span>
              <h3 class="or-card-title">คลินิก &amp; วงจรห้องฉุกเฉิน</h3>
              <p class="or-card-text">ช่างซ่อม vs สิ่งมีชีวิต, <code>Stacey Matrix</code>, โรคเฉียบพลัน vs เรื้อรัง, วงจรอุบาทว์ <code>ER</code> และ <code>Systems vs Systematic</code></p>
            </div>
            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">ACT V · 11.36 – 12.00 น.</span>
              <h3 class="or-card-title">En-ROADS &amp; Live Quiz</h3>
              <p class="or-card-text">เกมจำลองนโยบายโลกปี 2100 (<code>+1.5°C</code> &amp; เศรษฐกิจ), <code>Concept Check 6 ข้อ</code> และเชื่อมสู่ภาคสนาม 9 รพช.</p>
            </div>
          </div>

          <div class="or-card is-white" data-fit-solo="1">
            <div class="or-card-head-inline">
              <span class="or-card-kicker">COURSE THREAD · เข็มทิศเชื่อมตลอด 6 สัปดาห์ของ RACM 303</span>
              <span class="or-mini-chip">☕ พักเบรกระหว่างคาบ 10.45 – 11.00 น. (15 นาที)</span>
            </div>
            <p class="or-card-text"><strong>ST1 (เช้าวันนี้)</strong> เปิดเลนส์คิดเชิงระบบ → <strong>เสวนาบ่ายวันนี้ (13.30–17.00 น.)</strong> เชื่อมข้างเตียงสู่ <code>SBP, Global &amp; Planetary Health</code> → <strong>HS1–HS6</strong> วิเคราะห์ 6 องค์ประกอบระบบสุขภาพ → <strong>ภาคสนาม 9 รพช. &amp; เวิร์กชอป ST2 CLD (22 ธ.ค.)</strong> สังเคราะห์ฟอร์ม <code>3A</code> และ <code>SRN 1–2</code></p>
          </div>
        </div>
      `
    },
    {
      id: "s03-wj-intro",
      num: "03",
      section: "act1",
      sectionLabel: "Act I · Warped Juggle",
      actClass: "",
      actLabel: "ACT I · EXPERIENTIAL LAB #1",
      timeWindow: "09.38 – 09.41 น. (3 นาที)",
      kicker: "THE WARPED JUGGLE GAME · SWEENEY & MEADOWS (THE SYSTEMS THINKING PLAYBOOK, PP. 30–36)",
      title: "“The Warped Juggle Game” — เรียนรู้ “กฎ / กติกา / มารยาท” และถอดบทเรียนเชิงระบบ",
      keyMessageHtml:
        "สัมผัสประสบการณ์ตรงของ <strong>แม่แบบเชิงระบบ (System Archetypes)</strong> <strong>กระบวนการสร้างสมมติฐานอัตโนมัติ</strong> และ <strong>พลังของกรอบความคิดร่วมในทีม (Collective Mental Models)</strong>",
      notes:
        "แนะนำกิจกรรมแรกจากหนังสือ The Systems Thinking Playbook (Linda Booth Sweeney & Dennis Meadows, หน้า 30–36) ซึ่งฝึกวินัยสำคัญ 3 ด้านของ Peter Senge พร้อมกัน ได้แก่ Mental Models, Team Learning และ Systems Thinking โดยแบ่งกลุ่มย่อยกลุ่มละ 8–12 คน (ไม่เกิน 20 คน) เคลียร์พื้นที่ให้ยืนล้อมวงได้สะดวก",
      render: () => `
        <div class="st1-split-fig-left">
          ${figPlate(
            "st1_wj_game_protocol.png",
            "The Warped Juggle Game: คำสั่งและกติกาหลัก 5 ข้อ",
            "<strong>อ้างอิงกิจกรรม:</strong> Sweeney &amp; Meadows, <em>The Systems Thinking Playbook</em> (pp. 30–36)",
            "EXPERIENTIAL EXERCISE · MENTAL MODELS · TEAM LEARNING · SYSTEMS THINKING"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-amber-tint">
              <span class="or-card-kicker">PURPOSE · เป้าประสงค์หลักของกิจกรรม (PLAYBOOK P. 30)</span>
              <h3 class="or-card-title">เปลี่ยนห้องเรียนให้เป็นสนามทดลองพลวัตของระบบจริง</h3>
              <ul class="or-list">
                <li>สัมผัสการทำงานของแม่แบบเชิงระบบ โดยเฉพาะ <strong>ขีดจำกัดของความสำเร็จ (Limits to Success)</strong></li>
                <li>สำรวจธรรมชาติอัตโนมัติของสมองในการ <strong>สร้างข้อสมมติฐานที่มองไม่เห็น (Hidden Assumptions)</strong></li>
                <li>เรียนรู้พลังของ <strong>กรอบความคิดร่วมของทีม (Collective Mental Models)</strong> ต่อการแก้ปัญหา</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">EXPECTED OUTCOMES · สิ่งที่ผู้เรียนจะถอดรหัสได้หลังจบเกม</span>
              <h3 class="or-card-title">จากพฤติกรรมในวงล้อม สู่แผนผังวงจรสาเหตุ (CLD) และระบบสุขภาพ</h3>
              <ul class="or-list">
                <li>ตรวจสอบกระบวนการคิดสร้างสรรค์เพื่อค้นหาทางเลือกใหม่นอกกรอบความคุ้นชิน</li>
                <li>สกัดตัวแปรและวาด <strong>แผนผังวงจรเชิงสาเหตุ (Causal Loop Diagram: CLD)</strong> ของทีมตนเอง</li>
                <li>เชื่อมโยงบทเรียนสู่การทำงานเป็นทีมสหวิชาชีพในคลินิกและโรงพยาบาลชุมชน</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s04-wj-five-rules",
      num: "04",
      section: "act1",
      sectionLabel: "Act I · Warped Juggle",
      actClass: "",
      actLabel: "ACT I · THE 5 RULES",
      timeWindow: "09.41 – 09.45 น. (4 นาที)",
      kicker: "GAME INSTRUCTIONS · คำสั่งและกติกาหลักประจำห้องเรียน",
      title: "คำสั่ง: เกมนี้มี “กฎ / กติกา / มารยาท” เพียง 5 ข้อเท่านั้น",
      keyMessageHtml:
        "อ่านกติกาทั้ง <strong>5 ข้อ</strong> ให้ชัดเจนทุกตัวอักษร — <strong>อะไรที่ไม่ได้เขียนห้ามไว้ แปลว่าไม่ได้ห้าม!</strong> (แต่ห้ามละเมิดกติกาทั้ง 5 ข้อเด็ดขาด)",
      notes:
        "ย้ำกติกาทั้ง 5 ข้อช้า ๆ ชัด ๆ และเปิดโอกาสให้ซักถาม คำแนะนำสำคัญจาก Playbook (หน้า 32): เมื่อผู้เรียนถามว่าจะพลิกแพลงกติกาได้อย่างไร ให้ผู้สอนตอบทวนเฉพาะข้อความกติกาทั้ง 5 ข้อนี้ตามตัวอักษรเท่านั้น ห้ามใบ้คำตอบล่วงหน้า",
      maxSubSteps: 6,
      render: () => {
        const s = isExportOrHandout() ? 0 : state.subStep;
        const focusCls = (idx) => (s === 0 ? "" : s === idx ? " is-step-focused" : " is-step-dimmed");
        return `
          <div class="st1-hero-fig-stage">
            ${renderStepBarHtml(["ภาพรวมทั้ง 5 ข้อ", "กฎข้อ 1", "กฎข้อ 2", "กฎข้อ 3", "กฎข้อ 4", "กฎข้อ 5"], s)}
            <div class="st1-split-fig-left" style="flex:1;min-height:0">
              ${figPlate(
                "st1_wj_game_protocol.png",
                "กติกา 5 ข้อของเกม The Warped Juggle",
                "<strong>หมายเหตุผู้ดำเนินกิจกรรม:</strong> สมาชิก 1 คนทำหน้าที่ <code>Observer / TQA Assessor</code> และ Staff/ตัวแทน 1 คนทำหน้าที่ <code>Timer</code>",
                "ONLY 5 RULES EXIST · กติกาทั้ง 5 ข้อของเกม"
              )}
              <div class="or-stack-col" data-fit-group="cards">
                <div class="or-card is-teal-tint${focusCls(1)}">
                  <span class="or-card-kicker">กฎข้อที่ 1 · FULL PARTICIPATION</span>
                  <p class="or-card-text"><strong>สมาชิกทุกคนในทีมต้องแตะลูกบอลแต่ละลูกหนึ่งครั้งเสมอ</strong></p>
                </div>
                <div class="or-card is-navy-tint${focusCls(2)}">
                  <span class="or-card-kicker">กฎข้อที่ 2 · FIXED HUMAN SEQUENCE</span>
                  <p class="or-card-text"><strong>สมาชิกในทีมต้องแตะลูกบอลในลำดับเดิมเสมอ</strong></p>
                </div>
                <div class="or-card is-violet-tint${focusCls(3)}">
                  <span class="or-card-kicker">กฎข้อที่ 3 · TWO COMPLETE CYCLES</span>
                  <p class="or-card-text"><strong>เล่นวนครบรอบ 2 ครั้ง</strong> (นับจากปล่อยบอลออกจาก Facilitator แล้วบอลกลับมาหาที่ Facilitator)</p>
                </div>
                <div class="or-card is-rose-tint${focusCls(4)}">
                  <span class="or-card-kicker">กฎข้อที่ 4 · DROP PENALTY &amp; CONTINUOUS CLOCK</span>
                  <p class="or-card-text"><strong>ถ้าระหว่างรอบมีบอลตกพื้น จะให้เริ่มรอบนั้นใหม่ และไม่หยุดจับเวลา</strong></p>
                </div>
                <div class="or-card is-amber-tint${focusCls(5)}">
                  <span class="or-card-kicker">กฎข้อที่ 5 · WINNING CONDITION</span>
                  <p class="or-card-text"><strong>ทีมที่ใช้เวลาน้อยที่สุดเป็นผู้ชนะ</strong></p>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    },
    {
      id: "s05-wj-protocol-timer",
      num: "05",
      section: "act1",
      sectionLabel: "Act I · Warped Juggle",
      actClass: "",
      actLabel: "ACT I · PLAY & TIME CHALLENGE",
      timeWindow: "09.45 – 09.58 น. (13 นาที · ลงมือเล่นจริง)",
      kicker: "CLASSROOM EXECUTION · CIRCLE SETUP, OBSERVER/TQA, ROUND TIMER & 50%-FASTER CHALLENGE",
      title: "ขั้นตอนการเล่นในวงล้อม & การท้าทายลดเวลาลงครึ่งหนึ่ง (50% Faster!)",
      keyMessageHtml:
        "ซ้อมจำลำดับการส่งด้วยคำว่า <strong>“ขอบคุณพี่…”</strong> → ประเมินเวลาที่ดีที่สุด → จับเวลาแข่งขันจริง → <strong>ท้าทายทีมอื่นว่าทำได้เร็วขึ้นอีก 50%!</strong>",
      notes:
        "ให้แต่ละกลุ่มยืนล้อมวง มอบหมาย Observer/TQA assessor 1 คนคอยสังเกตกระบวนการคิดของทีม (ใครพูด ใครฟัง มีคนเสนอความเห็นต่างแล้วเกิดอะไรขึ้น) และ Timer 1 คนจับเวลาดิจิทัล เริ่มซ้อม 1 รอบเพื่อล็อกลำดับคน จากนั้นให้ปรึกษากันทายเวลา จับเวลารอบแรก แล้วท้าทายให้ลดเวลาลงครึ่งหนึ่งซ้ำอีก 2–3 รอบ!",
      render: () => `
        <div class="st1-split-fig-left">
          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">STEP 1 – 2 · จัดวงล้อมและสร้างลำดับการส่ง (SEQUENCE)</span>
              <h3 class="or-card-title">ยืนล้อมวง + ตั้ง Observer/TQA 1 คน &amp; Timer 1 คน</h3>
              <p class="or-card-text">Facilitator เริ่มโยนบอลลูกแรกแบบหงายมือนุ่มนวลไปยังสมาชิกฝั่งตรงข้าม (ไม่ส่งคนข้างตัว) แนะนำให้พูดชื่อ เช่น <strong>“ขอบคุณพี่…”</strong> เพื่อจำลำดับ ส่งต่อให้คนที่ยังไม่ได้รับจนครบทุกคนแล้วโยนกลับหา Facilitator จากนั้นเพิ่มลูกที่ 2–3 ในลำดับเดิม</p>
            </div>

            <div class="or-card is-amber-tint">
              <span class="or-card-kicker">STEP 3 – 4 · ประมาณเวลา แข่งขันจริง และท้าทาย 50% FASTER!</span>
              <h3 class="or-card-title">ทายเวลาที่ดีที่สุด → จับเวลา 2 รอบต่อเนื่อง → ท้าทายครึ่งเวลา!</h3>
              <p class="or-card-text">ให้แต่ละกลุ่มปรึกษากันเพื่อประมาณเวลาที่ดีที่สุด (เช่น 45–60 วินาที?) แล้วเริ่มจับเวลาจริงครบ 2 รอบ (หากบอลตกพื้นเริ่มรอบนั้นใหม่โดยเวลาเดินต่อ!) เมื่อได้สถิติรอบแรก ให้ท้าทายกลุ่มตนเองและกลุ่มอื่นว่า <strong>“ทำได้ต่ำกว่าเดิมครึ่งหนึ่ง (50% faster) หรือไม่?”</strong></p>
            </div>
          </div>

          ${renderWjStopwatchCardHtml()}
        </div>
      `
    },
    {
      id: "s06-wj-drivers",
      num: "06",
      section: "act1",
      sectionLabel: "Act I · Warped Juggle",
      actClass: "",
      actLabel: "ACT I · 8 SYSTEM DRIVERS",
      timeWindow: "09.58 – 10.02 น. (4 นาที)",
      kicker: "FROM EXPERIENCE TO VARIABLES · SWEENEY & MEADOWS (2010)",
      title: "สกัดปัจจัยขับเคลื่อนระบบ 8 ประการ (System Drivers) จากประสบการณ์ในเกม",
      keyMessageHtml:
        "ก่อนวาดแผนผัง <code>CLD</code> นักคิดเชิงระบบต้องระบุ <strong>ตัวแปรสำคัญ (Key Variables)</strong> ทั้งฝั่งแรงกดดันด้านเวลา และฝั่งการเปิดใจเรียนรู้ของทีม",
      notes:
        "ชวนผู้เรียนและ Observer/TQA ของแต่ละกลุ่มสะท้อนว่าตลอด 10 นาทีที่ผ่านมา อะไรเป็นตัวแปรที่เพิ่มขึ้นหรือลดลงในกลุ่มบ้าง? เชื่อมเข้าสู่ตัวแปรหลักทั้ง 8 ตัวแปรของ Sweeney & Meadows (2010) เพื่อเตรียมนำไปร้อยเป็นแผนผังวงจรสาเหตุ (CLD)",
      render: () => `
        <div class="st1-hero-fig-stage">
          ${figPlate(
            "st1_wj_system_drivers.png",
            "ปัจจัยขับเคลื่อนระบบ 8 ประการของเกม The Warped Juggle",
            "<strong>ที่มา:</strong> Sweeney &amp; Meadows (2010), <em>The Systems Thinking Playbook</em> — สังเกตปฏิสัมพันธ์ระหว่างตัวแปรกลุ่มแรงกดดันด้านบนกับตัวแปรกลุ่มการเรียนรู้ด้านล่าง",
            "KEY SYSTEM VARIABLES · 8 ปัจจัยขับเคลื่อนระบบก่อนเชื่อมเป็นวงจร CLD"
          )}
        </div>
      `
    },
    {
      id: "s07-cld-step1-links",
      num: "07",
      section: "act2",
      sectionLabel: "Act II · CLD & Archetypes",
      actClass: "is-act-2",
      actLabel: "ACT II · CLD CLICKER LAB 1/4",
      timeWindow: "10.02 – 10.06 น. (4 นาที)",
      kicker: "STEP-BY-STEP CLD EXERCISE · CAUSAL LINKS & POLARITY (+ / −)",
      title: "แนวทางการเขียน CLD ขั้นที่ 1: ทิศทางเหตุปัจจัยและขั้วความสัมพันธ์ (+ และ −)",
      keyMessageHtml:
        "ลากลูกศรจาก <strong>เหตุ → ผล</strong> และเขียนเครื่องหมาย <code>+</code> (เปลี่ยนทิศทางเดียวกัน) หรือ <code>−</code> (เปลี่ยนทิศทางตรงข้าม) แบบไม่มีวงเล็บไว้ที่ <strong>หัวลูกศรเท่านั้น</strong>",
      notes:
        "กด Clicker ทีละขั้น (6 ขั้น): เริ่มจากตัวแปร Eating กับ Obesity ถามนักศึกษาว่าถ้ากินเพิ่มขึ้นความอ้วนเป็นอย่างไร (+) จากนั้นเพิ่ม Regular Exercise แล้วถามว่าออกกำลังกายเพิ่มขึ้นความอ้วนเป็นอย่างไร (−) ย้ำกฎเหล็ก: เขียน + หรือ − เฉพาะที่หัวลูกศร หางลูกศรไม่มี และไม่ต้องใส่วงเล็บ",
      maxSubSteps: 6,
      render: () => renderCldStep1SvgHtml(state.subStep)
    },
    {
      id: "s08-cld-step2-loops",
      num: "08",
      section: "act2",
      sectionLabel: "Act II · CLD & Archetypes",
      actClass: "is-act-2",
      actLabel: "ACT II · CLD CLICKER LAB 2/4",
      timeWindow: "10.06 – 10.10 น. (4 นาที)",
      kicker: "STEP-BY-STEP CLD EXERCISE · REINFORCING LOOP (R) VS. BALANCING LOOP (B)",
      title: "แนวทางการเขียน CLD ขั้นที่ 2: วงจรเสริมกำลัง (R) เทียบกับ วงจรสร้างสมดุล (B)",
      keyMessageHtml:
        "<strong>วงจร R</strong> (เครื่องหมาย <code>−</code> จำนวนคู่) เร่งตัวเองแบบทวีคูณ ส่วน <strong>วงจร B</strong> (เครื่องหมาย <code>−</code> จำนวนคี่) ถ่วงดุลเข้าหาเป้าหมายเสมือน <strong>Thermostat</strong>",
      notes:
        "กด Clicker ไล่ทั้ง 8 ขั้น: ฝั่งซ้าย พูดจาไม่เข้าหู ->(+) โกรธ ->(+) พูดจาไม่เข้าหู = Loop R (The More -> The More / The Less -> The Less) ฝั่งขวา หิว ->(+) กิน ->(−) หิวลดลง = Loop B เหมือนแอร์ปรับอากาศที่คอยลดช่องว่าง (Discrepancy) ระหว่างอุณหภูมิจริงกับอุณหภูมิที่ตั้งไว้",
      maxSubSteps: 8,
      render: () => renderCldStep2SvgHtml(state.subStep)
    },
    {
      id: "s09-cld-step3-smart",
      num: "09",
      section: "act2",
      sectionLabel: "Act II · CLD & Archetypes",
      actClass: "is-act-2",
      actLabel: "ACT II · CLD CLICKER LAB 3/4",
      timeWindow: "10.10 – 10.15 น. (5 นาที)",
      kicker: "STEP-BY-STEP CLD EXERCISE · SELF-FULFILLING PROPHECY & COUPLED R + B (BURNOUT)",
      title: "แนวทางการเขียน CLD ขั้นที่ 3: กรณี “คุณภาพงานของสมาร์ท” จากเส้นตรงสู่ภาวะ Burnout",
      keyMessageHtml:
        "ลำพัง <strong>คุณภาพงานของสมาร์ท ↔ คำชื่นชมของหัวหน้า</strong> เป็นวงจร <code>R</code> แต่เมื่องานดีจึงถูกเพิ่ม <strong>ปริมาณงานของสมาร์ท</strong> จนเกิดวงจร <code>B</code> มาถ่วงดุล!",
      notes:
        "กด Clicker 8 ขั้น: ชี้ให้เห็นความต่างระหว่าง Linear Thinking (คิดว่ายิ่งชมยิ่งดีขึ้นเป็นเส้นตรง) กับ Systems Thinking: (1) วงจร R ขวาเป็นได้ทั้งวงจรประเสริฐและวงจรอุบาทว์เหมือน Teacher's Expectations <-> Student's Performance (2) ในโลกจริงเมื่อสมาร์ททำงานดี หัวหน้าจึงจ่ายงานเพิ่ม (+) พอปริมาณงานสมาร์ทล้นมือ พลังงานลดลง คุณภาพงานจึงตกลง (−) กลายเป็น Coupled R + B และกราฟ Burnout!",
      maxSubSteps: 8,
      render: () => renderCldStep3SmartSvgHtml(state.subStep)
    },
    {
      id: "s10-cld-step4-lilypond",
      num: "10",
      section: "act2",
      sectionLabel: "Act II · CLD & Archetypes",
      actClass: "is-act-2",
      actLabel: "ACT II · CLD CLICKER LAB 4/4",
      timeWindow: "10.15 – 10.18 น. (3 นาที)",
      kicker: "LILY POND STORY · EXPONENTIAL GROWTH, DELAYS & STRUCTURE OVER TRENDS",
      title: "ปริศนาสระบัว (Lily Pond Story): เหตุใดโครงสร้างจึงพยากรณ์อนาคตได้ดีกว่าแนวโน้มตาเห็น",
      keyMessageHtml:
        "ใบบัวเพิ่ม 2 เท่าทุกวันและเต็มสระวันที่ 30 → คลุมครึ่งสระใน <strong>วันที่ 29</strong> ขณะที่วันที่ 15 มีเพียง <strong>0.003%</strong> แทบมองด้วยตาเปล่าไม่เห็น!",
      notes:
        "ให้นักศึกษาลองทายคำตอบก่อนกด Clicker เปิดเฉลย: ชี้ให้เห็นว่าถ้าผู้บริหารหรือแพทย์รอดูแต่ตัวเลขเหตุการณ์รายวัน วันที่ 15 ยังดูเหมือนไม่มีปัญหาเลย (.0025%–.003%) กว่าจะเห็นครึ่งสระในวันที่ 29 ก็เหลือเวลาแก้ไขเพียงวันเดียว จึงต้องอ่านโครงสร้างของระบบ (Structure) ให้ออกล่วงหน้า",
      maxSubSteps: 2,
      render: () => renderLilyPondSvgHtml(state.subStep)
    },
    {
      id: "s11-wj-cld-en",
      num: "11",
      section: "act2",
      sectionLabel: "Act II · CLD & Archetypes",
      actClass: "is-act-2",
      actLabel: "ACT II · WARPED JUGGLE CLD (EN)",
      timeWindow: "10.18 – 10.21 น. (3 นาที)",
      kicker: "MAPPING THE WARPED JUGGLE · CAUSAL LOOP DIAGRAM (ENGLISH · DENNIS MEADOWS)",
      title: "วงจรเชิงสาเหตุของเกม Warped Juggle (Causal Loop Diagram — ฉบับภาษาอังกฤษ)",
      keyMessageHtml:
        "เมื่อ <code>Pressure to Improve</code> กระตุ้นทั้ง <code>Openness to Change</code> และ <code>Time Spent in Discussion of New Ideas</code> จึงยกระดับ <code>Team Learning → Skill of Approach → Best Time</code>",
      notes:
        "พาผู้เรียนไล่เส้นลูกศรในแผนผังต้นฉบับของ Dennis Meadows (หน้า 34): สังเกตว่าตัวแปรทั้ง 9 เชื่อมกันเป็นวงจรเสริมพลังแห่งการเรียนรู้ได้ ก็ต่อเมื่อแรงกดดันในการพัฒนาถูกแปลงไปเป็น ‘การเปิดใจรับการเปลี่ยนแปลง’ และ ‘การให้เวลาอภิปรายแนวคิดใหม่’ ร่วมกับ ‘ความสอดคล้องของทีม (Team Alignment)’",
      render: () => `
        <div class="st1-hero-fig-stage">
          ${figPlate(
            "st1_wj_cld_en.png",
            "Causal Loop Diagram of The Warped Juggle Game (English)",
            "<strong>Diagram created by Dennis Meadows</strong> · Sweeney &amp; Meadows, <em>The Systems Thinking Playbook</em> (p. 34)",
            "WARPED JUGGLE CLD (1/2 · ENGLISH) · BARE + AT ARROWHEADS"
          )}
        </div>
      `
    },
    {
      id: "s12-wj-cld-th",
      num: "12",
      section: "act2",
      sectionLabel: "Act II · CLD & Archetypes",
      actClass: "is-act-2",
      actLabel: "ACT II · WARPED JUGGLE CLD (TH)",
      timeWindow: "10.21 – 10.23 น. (2 นาที)",
      kicker: "MAPPING THE WARPED JUGGLE · CAUSAL LOOP DIAGRAM (ฉบับภาษาไทยเทียบคำศัพท์)",
      title: "วงจรเชิงสาเหตุของเกม Warped Juggle (Causal Loop Diagram — ฉบับภาษาไทย)",
      keyMessageHtml:
        "เทียบคำศัพท์ภาษาไทยครบทั้ง 9 ตัวแปร: หากขาด <strong>การเปิดรับการเปลี่ยนแปลง</strong> และ <strong>ความสามารถแปลงความรู้สู่ขั้นตอนจริง</strong> ทีมจะติดอยู่กับท่าโยนบอลเดิม",
      notes:
        "ใช้สไลด์ภาษาไทยคู่ขนานกับภาษาอังกฤษ (แนวทางเดียวกับสไลด์ CSDH ในคาบ Discussion HS1) เพื่อให้นักศึกษาเชื่อมคำศัพท์ภาษาไทยในเอกสารคำสอนเข้ากับแผนผัง CLD มาตรฐานสากลได้อย่างแม่นยำ",
      render: () => `
        <div class="st1-hero-fig-stage">
          ${figPlate(
            "st1_wj_cld_th.png",
            "วงจรเชิงสาเหตุของเกม Warped Juggle ฉบับภาษาไทย",
            "<strong>ประยุกต์เป็นภาษาไทยจาก Dennis Meadows</strong> · Sweeney &amp; Meadows, <em>The Systems Thinking Playbook</em>",
            "WARPED JUGGLE CLD (2/2 · THAI BILINGUAL) · BARE + AT ARROWHEADS"
          )}
        </div>
      `
    },
    {
      id: "s13-limits-to-success",
      num: "13",
      section: "act2",
      sectionLabel: "Act II · CLD & Archetypes",
      actClass: "is-act-2",
      actLabel: "ACT II · ARCHETYPE 1: LIMITS TO SUCCESS",
      timeWindow: "10.23 – 10.26 น. (3 นาที)",
      kicker: "SYSTEMS ARCHETYPE #1 · LIMITS TO SUCCESS / LIMITS TO GROWTH (PETER SENGE)",
      title: "รูปแบบแรกเริ่มของระบบ (Systems Archetype): “Limits to Success” (ขีดจำกัดของความสำเร็จ)",
      keyMessageHtml:
        "ความพยายามระยะแรกสร้างผลลัพธ์ดีขึ้น (<code>Loop R</code>) แต่เมื่อชน <strong>ข้อจำกัดของโครงสร้างและกรอบคิดเดิม (<code>Constraint</code>)</strong> จะเกิดแรงต้านถ่วงดุล (<code>Loop B</code>) จนผลงานชะงักหรือถอยหลัง",
      notes:
        "ชี้ให้เห็นว่านี่คือโครงสร้างเดียวกับ ‘คุณภาพงาน–ปริมาณงานของสมาร์ท’ ที่เพิ่งวาดเมื่อครู่! ในเกม Warped Juggle ช่วง 5 นาทีแรกการขยันส่งบอลให้ไวขึ้นลดเวลาจาก 50 วิ เหลือ ~20 วิ (Loop R) แต่พอยิ่งเร่งในรูปแบบเดิม บอลยิ่งตกพื้นและต้องเริ่มรอบใหม่โดยเวลาเดินต่อ (Limiting Action จาก Constraint ของกระบวนการแบบเดิม)",
      render: () => `
        <div class="st1-hero-fig-stage">
          ${figPlate(
            "st1_wj_limits_to_success.png",
            "Systems Archetype: Limits to Success / Limits to Growth",
            "<strong>ที่มา:</strong> Peter Senge, <em>The Fifth Discipline</em> · Sweeney &amp; Meadows, <em>The Systems Thinking Playbook</em> (p. 34)",
            "SYSTEMS ARCHETYPE #1 · REINFORCING (R) COUPLED WITH BALANCING CONSTRAINT (B)"
          )}
        </div>
      `
    },
    {
      id: "s14-growth-underinvestment-template",
      num: "14",
      section: "act2",
      sectionLabel: "Act II · CLD & Archetypes",
      actClass: "is-act-2",
      actLabel: "ACT II · ARCHETYPE 2: GROWTH & UNDERINVESTMENT",
      timeWindow: "10.26 – 10.28 น. (2 นาที)",
      kicker: "SYSTEMS ARCHETYPE #2 · GROWTH AND UNDERINVESTMENT (PETER SENGE, THE FIFTH DISCIPLINE)",
      title: "ต่อยอดสู่แม่แบบ “Growth and Underinvestment”: เมื่อขีดความสามารถและมาตรฐานเป็นตัวชี้ขาด",
      keyMessageHtml:
        "เมื่อการเติบโตชนเพดาน <code>Capacity</code> ระบบมีทางแยก 2 สาย: <strong>เร่งลงทุนขยายศักยภาพล่วงหน้า (<code>Capital Investment: B</code>)</strong> หรือปล่อยให้ <strong>เกณฑ์มาตรฐานเลื่อนไหลลดลง (<code>Floating Goal: R</code>)</strong>",
      notes:
        "อธิบายแม่แบบ Growth and Underinvestment ซึ่งต่อยอดตรงจาก Limits to Growth: สังเกตขีดคู่ (||) แสดงความล่าช้าของเวลา (Time Delay) ทั้ง 3 จุด หากองค์กรหรือทีมสุขภาพไม่รีบลงทุนเพิ่ม Capacity เพราะมัวประนีประนอมลดมาตรฐานลง (เช่น ‘รอนาน 4 ชม. เป็นเรื่องปกติ’) ความรับรู้ความจำเป็นต้องลงทุนจะหายไป และระบบจะติดหล่มสมรรถนะต่ำถาวร",
      render: () => `
        <div class="st1-hero-fig-stage">
          ${figPlate(
            "st1_growth_underinvestment.png",
            "Systems Archetype: Growth and Underinvestment (4 Loops)",
            "<strong>Peter Senge, <em>The Fifth Discipline</em>:</strong> 4 วงจรเชื่อมกัน ได้แก่ <code>Growth Engine (R)</code>, <code>Consumer Response (B)</code>, <code>Capital Investment (B)</code> และ <code>Floating Goal (R)</code> พร้อมความล่าช้า <code>||</code>",
            "SYSTEMS ARCHETYPE #2 (TEMPLATE) · 4 INTERLOCKING FEEDBACK LOOPS & TIME DELAYS (||)"
          )}
        </div>
      `
    },
    {
      id: "s15-wj-growth-underinvestment",
      num: "15",
      section: "act2",
      sectionLabel: "Act II · CLD & Archetypes",
      actClass: "is-act-2",
      actLabel: "ACT II · WARPED JUGGLE × GROWTH & UNDERINVESTMENT",
      timeWindow: "10.28 – 10.31 น. (3 นาที)",
      kicker: "SYNTHESIS IN CONTEXT · WARPED JUGGLE MAPPED ONTO GROWTH AND UNDERINVESTMENT",
      title: "สังเคราะห์ตัวแปร Warped Juggle บนแม่แบบ Growth and Underinvestment ทั้ง 4 วงจร",
      keyMessageHtml:
        "เชื่อมทั้ง 8 ตัวแปรของเกมเข้าเป็น 4 วงจร: <code>R1 เร่งสปีดการโยน</code> · <code>B1 เพดานบอลตก</code> · <code>B2 ลงทุนเวลาเรียนรู้เปลี่ยนระบบ</code> · <code>R2 กับดักปลงรับเวลาเดิม</code>",
      notes:
        "พาผู้เรียนดูการสังเคราะห์ตัวแปรจากเกม Warped Juggle ลงบนโครงสร้าง Growth and Underinvestment ทั้ง 4 วงจร: (R1) ยิ่งเร่งมือจังหวะยิ่งเร็ว (B1) พอเร็วเกินวิธีเดิมบอลตกพื้นเวลาไหลไม่หยุด (B2) ทีมที่ชนะคือทีมที่ยอมลงทุนเวลาหยุดคุย เปิดใจเรียนรู้ และจัดแถว/เปลี่ยนโครงสร้างใหม่ ขณะที่ทีมที่แพ้ติดใน (R2) ลดเพดานความคาดหวังว่า ‘โยนได้ 20 วิก็เก่งแล้ว’ จึงไม่เกิดการเปลี่ยนระบบ!",
      render: () => `
        <div class="st1-hero-fig-stage">
          ${figPlate(
            "st1_wj_growth_underinvestment.png",
            "สังเคราะห์ตัวแปร Warped Juggle บนแม่แบบ Growth and Underinvestment",
            "<strong>การสังเคราะห์เชิงระบบ:</strong> ชี้ให้เห็นว่า ‘เวลาอภิปรายแนวคิดใหม่และการเรียนรู้ของทีม’ คือการลงทุนขยายขีดความสามารถ (<code>B2</code>) เพื่อเอาชนะเพดานบอลตก (<code>B1</code>) ก่อนติดกับดัก <code>R2</code>",
            "WARPED JUGGLE SYNTHESIS · 4 CONTEXTUALIZED LOOPS (R1 · B1 · B2 · R2)"
          )}
        </div>
      `
    },
    {
      id: "s16-wj-debrief",
      num: "16",
      section: "act2",
      sectionLabel: "Act II · CLD & Archetypes",
      actClass: "is-act-2",
      actLabel: "ACT II · DEBRIEFING WARPED JUGGLE",
      timeWindow: "10.31 – 10.36 น. (5 นาที)",
      kicker: "INCREASING EFFORTS (“WORK HARDER”) VS. REDESIGNING SYSTEMS STRUCTURE (“WORK SMARTER”)",
      title: "ถอดบทเรียน Warped Juggle: ก้าวพ้น “กับดักความสำเร็จเดิม” ด้วยการตั้งคำถามต่อสมมติฐาน",
      keyMessageHtml:
        "สำหรับการบริหารจัดการระบบที่ดีกว่า จงถามเสมอว่า: <strong>“แรงกดดันและข้อจำกัดแฝงชนิดใดกำลังก่อตัวสะสมขึ้นในองค์กรของเรา อันเป็นผลมาจากความสำเร็จในอดีต/ที่ผ่านมา?”</strong>",
      notes:
        "ชวนทั้งชั้นเรียนอภิปรายคำถามถอดบทเรียนทั้ง 5 ประเด็นจากสไลด์ต้นฉบับและ Playbook หน้า 34–36 สำรวจว่าสมมติฐานใดที่ผู้เล่นเติมเข้าไปเองนอกเหนือกติกา 5 ข้อ และทีมตอบสนองต่อข้อเสนอใหม่อย่างไร (บนพอร์ทัลอาจารย์มีปุ่มเปิดกรอบสรุปกลไกถอดบทเรียนสำหรับผู้สอนหลังจบการแข่งขัน)",
      render: () => {
        const facKey = ROLE === "faculty" && window.RACM_ST1_FACILITATOR_KEY && window.RACM_ST1_FACILITATOR_KEY.warpedJuggle;
        return `
          <div class="st1-split-fig-left">
            <div class="or-stack-col" data-fit-group="cards">
              <div class="or-card is-navy-tint">
                <span class="or-card-kicker">1 · WORK HARDER VS. WORK SMARTER</span>
                <h3 class="or-card-title">Increasing Efforts vs. Redesigning Systems Structure</h3>
                <p class="or-card-text">การบีบวงให้แคบลงหรือปาบอลให้แรงขึ้นคือ <strong>“To work harder”</strong> ภายใต้โครงสร้างเดิม ซึ่งมักสร้างความผิดพลาดและบอลตกมากขึ้น ต่างจาก <strong>“To work smarter”</strong> ที่รื้อออกแบบความสัมพันธ์และขั้นตอนของระบบใหม่</p>
              </div>

              <div class="or-card is-rose-tint">
                <span class="or-card-kicker">2 · HIDDEN ASSUMPTIONS &amp; MENTAL MODELS</span>
                <h3 class="or-card-title">ทำไมพวกเราบางคนจึงสมมติไปเองว่า “มีกติกามากกว่า 5 ข้อ”?</h3>
                <p class="or-card-text">อะไรคือ <code>Constraints</code> ที่แท้จริง? อะไรคือ <code>Mindset / Mental Model</code> ที่ทำให้เราทำตามภาพจำแรกที่เห็น Facilitator สาธิต โดยไม่ตั้งคำถามว่าในบริบทและกติกา 5 ข้อนี้ <strong>อะไรทำได้อีกบ้าง?</strong></p>
              </div>

              <div class="or-card is-violet-tint">
                <span class="or-card-kicker">3 · THE TRAP OF OUR OWN SUCCESS</span>
                <h3 class="or-card-title">ความสำเร็จในรอบแรก ๆ กลายเป็นกรงขังความคิดของเราหรือไม่?</h3>
                <p class="or-card-text"><em>“What kind of inherent pressure and constraints are accumulating in our organization as a result of its past/recent success?”</em> — คำถามสำคัญของการนำทีมสุขภาพ</p>
              </div>
            </div>

            <div class="or-stack-col" data-fit-group="right-debrief">
              ${
                facKey
                  ? state.debriefRevealed
                    ? `
                  <div class="st1-fac-reveal-panel">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                      <span class="or-card-kicker" style="color:#b45309;margin:0">${esc(facKey.badge)}</span>
                      <button type="button" class="or-tool-btn" data-st1-act="toggle-debrief-key">🙈 ซ่อนเฉลยผู้สอน</button>
                    </div>
                    <h3 class="or-card-title" style="margin:0">${esc(facKey.breakthroughTitle)}</h3>
                    <p class="or-card-text" style="margin:0">${esc(facKey.hiddenAssumption)}</p>
                    <ul class="or-list" style="margin:0">
                      ${facKey.redesignSolutions.map((it) => `<li>${esc(it)}</li>`).join("")}
                    </ul>
                    <div style="border-top:1px dashed rgba(180,83,9,0.35);padding-top:6px">
                      <strong style="font-size:12.5px">${esc(facKey.voicesFromFieldTitle)}</strong>
                      ${facKey.voicesCases
                        .map(
                          (vc) =>
                            `<p class="or-card-text" style="margin:4px 0 0"><strong>• ${esc(vc.title)}:</strong> ${esc(vc.detail)}</p>`
                        )
                        .join("")}
                    </div>
                  </div>
                `
                    : `
                  <div class="or-card is-amber-tint">
                    <span class="or-card-kicker">🔒 FACULTY DEBRIEF CONTROL · เฉพาะพอร์ทัลอาจารย์</span>
                    <h3 class="or-card-title">${esc(facKey.controlTitle)}</h3>
                    <p class="or-card-text">${esc(facKey.controlBody)}</p>
                    <div style="margin-top:8px">
                      <button type="button" class="or-tool-btn is-primary" data-st1-act="toggle-debrief-key">${esc(facKey.revealBtnLabel)}</button>
                    </div>
                  </div>
                  <div class="or-card is-teal-tint">
                    <span class="or-card-kicker">TQA OBSERVER REFLECTION · คำถามชวนให้ผู้สังเกตการณ์เล่า</span>
                    <h3 class="or-card-title">เกิดอะไรขึ้นเมื่อมีสมาชิกเสนอไอเดียที่ต่างจากเดิม?</h3>
                    <p class="or-card-text">ทีมหยุดฟังและทดลองร่วมกัน หรือมีเสียงส่วนใหญ่รีบปัดตกเพราะกลัวเสียเวลา? และทุกคนได้มีส่วนร่วมในการออกแบบวิธีใหม่หรือไม่?</p>
                  </div>
                `
                  : `
                  <div class="or-card is-amber-tint">
                    <span class="or-card-kicker">TEAM DEBRIEF PROMPT #1 · สำรวจสมมติฐานของกลุ่มเรา</span>
                    <h3 class="or-card-title">กฎข้อใดที่เรา “เติมเข้าไปในหัวเอง” ทั้งที่ไม่มีในสไลด์กติกา 5 ข้อ?</h3>
                    <p class="or-card-text">ลองทบทวนว่าวิธีการรับข้อมูลตอนเริ่มต้น (การเห็นภาพตัวอย่างครั้งแรก) ล็อกวิธีคิดและตำแหน่งยืนของกลุ่มเราไว้อย่างไรบ้าง?</p>
                  </div>
                  <div class="or-card is-teal-tint">
                    <span class="or-card-kicker">TEAM DEBRIEF PROMPT #2 · เสียงสะท้อนจาก Observer / TQA</span>
                    <h3 class="or-card-title">บรรยากาศการเรียนรู้ร่วมกันในทีมเป็นแบบใด?</h3>
                    <p class="or-card-text">เมื่อบอลตกพื้นหรือเวลาไม่ลดลง ทีมตอบสนองด้วยการเร่งกดดันกันเอง หรือเปิดพื้นที่ปลอดภัยให้สมาชิกทุกคนร่วมเสนอทางออกใหม่นอกกรอบ?</p>
                  </div>
                `
              }
            </div>
          </div>
        `;
      }
    },
    {
      id: "s17-iceberg-model",
      num: "17",
      section: "act3",
      sectionLabel: "Act III · Iceberg, Chaordic & CAS",
      actClass: "is-act-3",
      actLabel: "ACT III · THE ICEBERG MODEL",
      timeWindow: "10.36 – 10.41 น. (5 นาที)",
      kicker: "THE ICEBERG MODEL OF COMPLEX PROBLEM SOLVING (SENGE, 2006; MONAT & GANNON, 2015; STROH, 2015)",
      title: "แบบจำลองภูเขาน้ำแข็งของการแก้ปัญหาซับซ้อน: จากสิ่งที่มองเห็น สู่คานดีดคานงัดใต้ผิวน้ำ",
      keyMessageHtml:
        "เหนือผิวน้ำคือ <strong>เหตุการณ์ (<code>To React</code>)</strong> · ใต้ผิวน้ำคือ <strong>แบบแผน <code>BOT</code> (<code>To Predict</code>)</strong> → <strong>โครงสร้าง <code>CLD</code> (<code>To Design</code>)</strong> → <strong>รูปแบบความคิด (<code>To Transform</code>)</strong>",
      notes:
        "เชื่อมตรงจากเกม Warped Juggle เข้าสู่ภูเขาน้ำแข็ง 4 ระดับ: บอลตกแต่ละลูกคือ Events (เหนือผิวน้ำ), กราฟเวลาที่ติดเพดานคือ Patterns of Behavior (BOT), กติกาและขั้นตอนการทำงานของทีมคือ Systems Structure (CLD), และสมมติฐานที่ซ่อนอยู่ในใจของทีมคือ Mental Models ฐานรากสุดซึ่งให้คานดีดคานงัด (Leverage) สูงสุดในการพลิกโฉมผลลัพธ์!",
      render: () => `
        <div class="st1-hero-fig-stage">
          ${figPlate(
            "st1_fig6_iceberg_model.png",
            "แบบจำลองภูเขาน้ำแข็งของการแก้ปัญหาซับซ้อน 4 ระดับ",
            "<strong>สังเคราะห์จาก Senge (2006), Monat &amp; Gannon (2015) และ Stroh (2015):</strong> ยิ่งส่องลึกจากสิ่งที่มองเห็นสู่โครงสร้างและรูปแบบความคิด พลังคานดีดคานงัดของระบบยิ่งสูงขึ้นและยั่งยืน",
            "COMPLEX PROBLEM SOLVING · REACT → PREDICT (BOT) → DESIGN (CLD) → TRANSFORM (MENTAL MODELS)"
          )}
        </div>
      `
    },
    {
      id: "s18-chaordic-dee-hock",
      num: "18",
      section: "act3",
      sectionLabel: "Act III · Iceberg, Chaordic & CAS",
      actClass: "is-act-3",
      actLabel: "ACT III · CHAORDIC SYSTEMS (DEE HOCK)",
      timeWindow: "10.41 – 10.45 น. (4 นาที · ก่อนพักเบรก)",
      kicker: "CHAORDIC ORGANIZATION · DEE HOCK (CEO EMERITUS, VISA INTERNATIONAL) · ONE FROM MANY",
      title: "จากหลากหลายกลายเป็นหนึ่ง (One From Many): เป้าหมายและหลักการที่เรียบง่าย สู่พฤติกรรมที่ชาญฉลาด",
      keyMessageHtml:
        "<em>“เป้าหมายและหลักการที่เรียบง่ายชัดเจนทำให้เกิดพฤติกรรมที่ซับซ้อนและชาญฉลาด แต่กฎและข้อบังคับที่ซับซ้อนทำให้เกิดพฤติกรรมที่โง่เง่าตื้นเขิน”</em> — <strong>Dee Hock</strong>",
      notes:
        "ยกวรรคทองของ Dee Hock ผู้ก่อตั้งและอดีตซีอีโอเครือข่าย VISA International จากหนังสือ One From Many (ฉบับแปลไทย ‘จากหลากหลายกลายเป็นหนึ่ง’ โดย ศิริพงษ์ วิทยวิโรจน์, คำนิยมโดย Peter Senge): เชื่อมกติกาเพียง 5 ข้อของเกม Warped Juggle เข้ากับแนวคิด Chaordic (Chaos + Order) ก่อนปล่อยพักเบรก 15 นาที (10.45–11.00 น.)",
      render: () => `
        <div class="st1-split-fig-wide">
          ${figPlate(
            "st1_chaordic_dee_hock.png",
            "หลักการองค์กรเคออร์ดิก (Chaordic Systems): จากหลากหลายกลายเป็นหนึ่ง (One From Many)",
            "<strong>Dee Hock:</strong> <em>One From Many: VISA and the Rise of Chaordic Organization</em> (จากหลากหลายกลายเป็นหนึ่ง · แนวคิดเคออร์ดิก = ความโกลาหล + ความเป็นระเบียบ)",
            "CHAORDIC PRINCIPLE · SIMPLE, CLEAR PURPOSE VS. COMPLEX RULES"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">DEE HOCK QUOTE · วรรคทองระดับโลก</span>
              <h3 class="or-card-title">Simple Principles → Intelligent Emergence</h3>
              <p class="or-card-text"><em>“Simple, clear purpose and principles give rise to complex and intelligent behavior. Complex rules and regulations give rise to simple and stupid behavior.”</em></p>
            </div>

            <div class="or-card is-teal-tint">
              <div class="or-card-head-inline">
                <span class="or-card-kicker">HEALTH SYSTEM IMPLICATION</span>
                <span class="or-mini-chip">☕ จบหน้านี้พักเบรก 15 นาที</span>
              </div>
              <h3 class="or-card-title">หัวใจของการอภิบาลระบบซับซ้อน (CAS)</h3>
              <p class="or-card-text">แทนที่จะออกระเบียบจุกจิกบังคับบุคลากรทุกฝีก้าว ระบบสุขภาพที่ดีต้องกำหนด <strong>เป้าหมายร่วมเพื่อผู้ป่วยและหลักการสำคัญที่ชัดเจน</strong> เพื่อให้ทีมหน้างานและชุมชนปรับตัวจัดการตนเองได้อย่างชาญฉลาด</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s19-system-ipo",
      num: "19",
      section: "act3",
      sectionLabel: "Act III · Iceberg, Chaordic & CAS",
      actClass: "is-act-3",
      actLabel: "ACT III · CONCEPTS OF SYSTEMS",
      timeWindow: "11.00 – 11.04 น. (4 นาที · หลังพักเบรก)",
      kicker: "ST1 MODULE 1.1 · DEFINITION, BOUNDARY, SUB/SUPRA-SYSTEM & INPUT–PROCESS–OUTPUT",
      title: "นิยามของระบบ: องค์ประกอบย่อยที่สัมพันธ์และทำหน้าที่ร่วมกันภายใต้ขอบเขตเพื่อบรรลุเป้าหมาย",
      keyMessageHtml:
        "<strong>อวัยวะที่วางแยกกันบนโต๊ะผ่าตัดไม่นับเป็นระบบไหลเวียนโลหิต</strong> — หัวใจของระบบอยู่ที่ความสัมพันธ์ การขีดเส้นแบ่ง <code>Boundary</code> และวงจร <code>Feedback</code>",
      notes:
        "หลังพักเบรก เชื่อมบทเรียนจากกิจกรรมครึ่งเช้าเข้าสู่กรอบเนื้อหาเอกสารคำสอน ST1 หมวดที่ 1: อธิบายการกำหนดเส้นแบ่งขอบเขต (Boundary) เพื่อแยกสิ่งที่ศึกษาออกจากสิ่งแวดล้อม (Environment) และการมองลำดับชั้น Sub-system (ER/วอร์ด/ห้องยา) เทียบกับ Supra-system (เขตสุขภาพ/ระบบหลักประกันสุขภาพ)",
      render: () => `
        <div class="st1-split-fig-left">
          ${figPlate(
            "st1_fig1_system_ipo.png",
            "ภาพที่ 1 กรอบแนวคิดเรื่องระบบ ขอบเขต และสิ่งแวดล้อม",
            "<strong>ภาพที่ 1 กรอบแนวคิดเรื่องระบบ</strong> · สังเคราะห์จาก von Bertalanffy (1968) และ Scheerens &amp; Bosker (1997)",
            "ST1 FIG. 1 · SYSTEM BOUNDARY, IPO & FEEDBACK"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">BOUNDARY &amp; ENVIRONMENT · เส้นแบ่งขอบเขต</span>
              <h3 class="or-card-title">แยกสิ่งที่ศึกษาออกจากสิ่งแวดล้อมภายนอก</h3>
              <p class="or-card-text">ผู้วิเคราะห์ต้องขีด <strong>ขอบเขตของระบบ (Boundary)</strong> เพื่อระบุองค์ประกอบที่ศึกษาและแยกออกจาก <strong>สิ่งแวดล้อม (Environment)</strong> ที่อยู่นอกเหนือการควบคุมโดยตรง แม้ในโลกจริงเส้นแบ่งอาจซ้อนเหลื่อมกันได้</p>
            </div>

            <div class="or-card is-white">
              <span class="or-card-kicker">SUB-SYSTEM &amp; SUPRA-SYSTEM · ลำดับชั้นของระบบ</span>
              <h3 class="or-card-title">ขอบเขตที่ขีดกำหนดระบบย่อยและระบบใหญ่</h3>
              <p class="or-card-text">หากกำหนดให้ <strong>“โรงพยาบาล”</strong> เป็นระบบที่สนใจ หอผู้ป่วยใน ห้องฉุกเฉิน และห้องยาคือ <code>Sub-system</code> ขณะที่เครือข่ายบริการระดับเขตและระบบหลักประกันสุขภาพระดับชาติคือ <code>Supra-system</code></p>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">CLINICAL ICU EXAMPLE · กลไกการทำงานสู่เป้าหมายร่วม</span>
              <h3 class="or-card-title">Input → Process → Output → Shared Goals</h3>
              <p class="or-card-text">หอผู้ป่วยวิกฤตรับ <code>Input</code> (ผู้ป่วยภาวะช็อกติดเชื้อ ยา ผลแล็บ) → <code>Process</code> (ประเมินอาการ ทวนสอบยา ให้สารน้ำ) → <code>Output</code> (พ้นวิกฤตปลอดภัยตามเป้าหมายร่วม)</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s20-contexts",
      num: "20",
      section: "act3",
      sectionLabel: "Act III · Iceberg, Chaordic & CAS",
      actClass: "is-act-3",
      actLabel: "ACT III · CONTEXTS & MEANING-MAKING",
      timeWindow: "11.04 – 11.08 น. (4 นาที)",
      kicker: "ST1 MODULE 1.2 · CONTEXTS OF TIME, PLACE & HUMAN MEANING-MAKING",
      title: "บริบทด้านเวลา สถานที่ และการให้ความหมาย ทำให้ระบบเดียวกันทำหน้าที่ต่างกันได้",
      keyMessageHtml:
        "<strong>บริบท (Contexts)</strong> ห่อหุ้มทั้งตัวระบบและสิ่งแวดล้อม — มนุษย์ไม่ได้ตอบสนองอัตโนมัติเหมือนเครื่องจักร แต่ตีความหมายต่างกันตามสถานการณ์",
      notes:
        "ชี้ให้เห็นภาพบริบท A (รพ.ศูนย์เขตเมืองในเวลาราชการ) เทียบกับบริบท B (รพช.ชายแดนในเวรดึกวันหยุดยาว) และตารางเปรียบเทียบระบบ 4 ประเภท (ชีววิทยา เศรษฐกิจ การศึกษา และระบบสุขภาพตามนิยาม WHO 2000; 2007)",
      render: () => `
        <div class="st1-split-top-bottom">
          <div class="st1-split-fig-left">
            ${figPlate(
              "st1_fig2_system_contexts.png",
              "ภาพที่ 2 การทำหน้าที่ของระบบเดียวกันภายใต้บริบท A และบริบท B",
              "<strong>ภาพที่ 2 บริบท A เทียบกับบริบท B</strong> · ที่มา: บวรศม ลีระพันธ์",
              "ST1 FIG. 2 · SAME SYSTEM ACROSS CONTEXT A & CONTEXT B"
            )}
            <div class="or-card is-amber-tint" data-fit-solo="1">
              <span class="or-card-kicker">HUMAN MEANING-MAKING · เวลา สถานที่ และการตีความ</span>
              <h3 class="or-card-title">เหตุใดแนวทางรักษาชุดเดิมจึงให้ผลลัพธ์ไม่เหมือนเดิม?</h3>
              <p class="or-card-text"><strong>ห้องเรียนใกล้สอบ:</strong> ครูและนักเรียนกลุ่มเดิม แต่เมื่อตีความว่าเป็นช่วงกดดันจึงลดกิจกรรมลง · <strong>ระบบบริการสุขภาพ:</strong> แนวทางเวชปฏิบัติเดียวกันเมื่อนำไปใช้ใน รพช.ชายแดนเวรดึก ย่อมเผชิญข้อจำกัดด้านการเดินทาง ภาษา และความกังวลของญาติที่ต่างจาก รพ.ศูนย์</p>
            </div>
          </div>

          <div class="or-table-wrap is-st1-table" data-fit-table="1">
            <table class="or-table">
              <thead>
                <tr>
                  <th style="width:23%">ตัวอย่างของระบบ</th>
                  <th style="width:43%">ขอบเขตขององค์ประกอบและกระบวนการหลักที่ศึกษา</th>
                  <th style="width:34%">เป้าหมายและหน้าที่ร่วมกันของระบบ (Goals)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>ระบบทางชีววิทยา</strong><br><span class="or-td-sub">Biological systems</span></td>
                  <td>โครงสร้างและการทำงานประสานกันของกลุ่มอวัยวะ เนื้อเยื่อ และเซลล์ในร่างกาย (von Bertalanffy, 1968)</td>
                  <td>ทำหน้าที่ทางสรีรวิทยาเพื่อธำรงสมดุลของสิ่งมีชีวิต เช่น ระบบหายใจ ระบบไหลเวียนโลหิต</td>
                </tr>
                <tr>
                  <td><strong>ระบบเศรษฐกิจ</strong><br><span class="or-td-sub">Economic systems</span></td>
                  <td>ปัจจัยและสถาบันที่เกี่ยวข้องกับการผลิต การกระจายสินค้าและบริการ และการจัดสรรทรัพยากร</td>
                  <td>ตอบสนองความต้องการและจัดสรรทรัพยากรที่มีอยู่จำกัดให้แก่สมาชิกในสังคม</td>
                </tr>
                <tr>
                  <td><strong>ระบบการศึกษา</strong><br><span class="or-td-sub">Educational systems</span></td>
                  <td>ปัจจัยการจัดการเรียนรู้ทั้งในและนอกสถานศึกษา สิ่งแวดล้อมการเรียนรู้ และการสร้างความรู้ (Scheerens &amp; Bosker, 1997)</td>
                  <td>พัฒนาศักยภาพผู้เรียน เตรียมกำลังคน และสร้างความรู้เพื่อแก้ปัญหาสังคม</td>
                </tr>
                <tr>
                  <td><strong>ระบบสุขภาพ</strong><br><span class="or-td-sub">Health systems (WHO, 2000; 2007)</span></td>
                  <td>กลุ่มประชากร องค์กร และกิจกรรมทั้งหมดที่มีเป้าประสงค์หลักในการ <strong>สร้าง ซ่อม และรักษาสุขภาพ</strong></td>
                  <td>ส่งเสริม ฟื้นฟู และธำรงสุขภาวะของประชาชนอย่าง <strong>มีคุณภาพและเป็นธรรม</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `
    },
    {
      id: "s21-three-types",
      num: "21",
      section: "act3",
      sectionLabel: "Act III · Iceberg, Chaordic & CAS",
      actClass: "is-act-3",
      actLabel: "ACT III · TYPES OF SYSTEMS",
      timeWindow: "11.08 – 11.11 น. (3 นาที)",
      kicker: "ST1 MODULE 2.1 – 2.2 · SIMPLE, COMPLICATED & COMPLEX ADAPTIVE SYSTEMS (GLOUBERMAN & ZIMMERMAN, 2002)",
      title: "เปรียบเทียบ 3 ธรรมชาติของระบบ: การทำกับข้าว · การส่งจรวดไปดวงจันทร์ · การเลี้ยงลูก",
      keyMessageHtml:
        "<strong>ระบบสามัญ</strong> และ <strong>ระบบยุ่งยาก</strong> อยู่บนฐานคิดแยกส่วนเชิงเส้นตรง (<code>Reductionism</code>) ส่วน <strong>ระบบซับซ้อน (CAS)</strong> เป็นระบบเปิดเชิงความน่าจะเป็น",
      notes:
        "ชี้จุดสำคัญที่นักศึกษามักสับสน: การส่งจรวดไปดวงจันทร์ยากมากและใช้ผู้เชี่ยวชาญหลายสาขา แต่ยังเป็น Complicated System ที่คำนวณตามพิมพ์เขียวได้แม่นยำ ต่างจากการเลี้ยงลูกและระบบสุขภาพที่เป็น Complex Adaptive System (CAS) เพราะมนุษย์เรียนรู้และตอบสนองไม่ซ้ำเดิม",
      render: () => `
        <div class="st1-split-cards-top-table">
          <div class="st1-full-grid-3" data-fit-group="cards">
            <div class="or-card is-white">
              <span class="or-card-kicker">1 · SIMPLE SYSTEMS (ระบบปิด · เส้นตรง)</span>
              <h3 class="or-card-title">🍲 “การทำกับข้าวตามตำรา”</h3>
              <p class="or-card-text">องค์ประกอบน้อย ขอบเขตชัด ความสัมพันธ์เหตุผลเป็นเส้นตรง (<code>Linear, deterministic</code>) เช่น ผสมสารละลายเกลือแร่ตามสูตรห้องยา</p>
            </div>
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">2 · COMPLICATED SYSTEMS (ซับซ้อนแบบกลไก)</span>
              <h3 class="or-card-title">🚀 “การส่งจรวดไปดวงจันทร์”</h3>
              <p class="or-card-text">รวม <code>Sub-systems</code> จำนวนมาก ต้องใช้ผู้เชี่ยวชาญหลายสาขาตามพิมพ์เขียว แต่ยังคาดการณ์ผลได้แน่นอน เช่น เครื่องปอดและหัวใจเทียม</p>
            </div>
            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">3 · COMPLEX ADAPTIVE SYSTEMS (องค์รวม)</span>
              <h3 class="or-card-title">🌱 “การเลี้ยงลูก &amp; ระบบสุขภาพ”</h3>
              <p class="or-card-text">ระบบเปิด ขอบเขตไม่ตายตัว ไม่เป็นเส้นตรง (<code>Non-linear, probabilistic</code>) เรียนรู้และปรับตัวจากภายใน สูตรสำเร็จเดิมไม่รับประกันผลซ้ำ</p>
            </div>
          </div>

          <div class="or-table-wrap is-st1-table" data-fit-table="1">
            <table class="or-table">
              <thead>
                <tr>
                  <th style="width:22%">ประเด็นเปรียบเทียบ (ตารางที่ 1)</th>
                  <th style="width:25%">“การทำกับข้าว” — ระบบสามัญ</th>
                  <th style="width:26%">“การส่งจรวดไปดวงจันทร์” — ระบบยุ่งยาก</th>
                  <th style="width:27%">“การเลี้ยงลูก” — ระบบซับซ้อน (CAS)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>บทบาทของสูตรสำเร็จ</strong></td>
                  <td>สูตรทดสอบมาแล้ว ทำซ้ำและลอกเลียนแบบได้ง่าย</td>
                  <td>สูตรและแบบพิมพ์เขียวจำเป็นอย่างยิ่งต่อการประสานระบบย่อย</td>
                  <td><strong>สูตรสำเร็จมีข้อจำกัดสูง</strong> ในการนำไปประยุกต์ใช้จริง</td>
                </tr>
                <tr>
                  <td><strong>ผลของความสำเร็จในอดีต</strong></td>
                  <td>ทำตามตำราที่ดีได้ผลลัพธ์เหมือนเดิมทุกครั้ง</td>
                  <td>สำเร็จหนึ่งครั้งช่วยเพิ่มความมั่นใจสูงว่าจะสำเร็จในครั้งถัดไป</td>
                  <td>เพิ่มประสบการณ์พ่อแม่ <strong>แต่ไม่รับประกันความสำเร็จในลูกคนถัดไป</strong></td>
                </tr>
                <tr>
                  <td><strong>ความเชี่ยวชาญเฉพาะทาง</strong></td>
                  <td>ไม่จำเป็นต้องเชี่ยวชาญขั้นสูง แต่ประสบการณ์ช่วยได้</td>
                  <td>จำเป็นต้องพึ่งผู้เชี่ยวชาญระดับสูงหลากหลายสาขาร่วมกัน</td>
                  <td>มีส่วนช่วยได้ แต่ไม่ใช่ปัจจัยชี้ขาดที่ขาดไม่ได้เพียงอย่างเดียว</td>
                </tr>
                <tr>
                  <td><strong>ลักษณะผลผลิตและผลลัพธ์</strong></td>
                  <td>มาตรฐานเดียวกัน (<code>Standardized</code>) ผลลัพธ์สม่ำเสมอ</td>
                  <td>จรวดแต่ละลำคล้ายกัน (<code>Similar</code>) ผลลัพธ์มีความแน่นอนสูง</td>
                  <td>เด็กแต่ละคนมีเอกลักษณ์จำเพาะ (<code>Unique</code>) <strong>ผลลัพธ์ไม่แน่นอน</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `
    },
    {
      id: "s22-cas-five-props",
      num: "22",
      section: "act3",
      sectionLabel: "Act III · Iceberg, Chaordic & CAS",
      actClass: "is-act-3",
      actLabel: "ACT III · 5 CAS PROPERTIES",
      timeWindow: "11.11 – 11.14 น. (3 นาที)",
      kicker: "ST1 MODULE 2.2 & 3.3.2 · FIVE CHARACTERISTICS OF CAS IN THAILAND'S HEALTH SYSTEM (CILLIERS, 1998; ATUN, 2012)",
      title: "คุณสมบัติ 5 ประการของระบบซับซ้อนที่ปรับตัวได้ (CAS) ในระบบสุขภาพและสังคมไทย",
      keyMessageHtml:
        "<strong>“ส่วนรวมไม่เท่ากับผลรวมของส่วนย่อย”</strong> — เชื่อมโยงใกล้ชิด · ผุดบังเกิด · อภิบาลด้วยวงจรป้อนกลับ · จัดการตัวเอง · เปลี่ยนแปลงต่อเนื่อง",
      notes:
        "เชื่อมทฤษฎีของ Cilliers (1998) และ de Savigny & Adam (2009) เข้ากับตัวอย่างจริงในสังคมไทยทั้ง 5 ข้อ และชี้ให้เห็นว่าคุณสมบัติข้อ 2 (Emergence) กับข้อ 4 (Self-organizing) คือปรากฏการณ์ Chaordic ที่เราเห็นทั้งใน Warped Juggle และในภัยพิบัติสึนามิ",
      render: () => `
        <div class="st1-cas5-layout" data-fit-group="cards">
          <div class="or-card is-navy-tint">
            <span class="or-card-kicker">1 · TIGHTLY LINKED</span>
            <h3 class="or-card-title">เชื่อมโยงกันอย่างใกล้ชิด</h3>
            <p class="or-card-text"><strong>กลไก:</strong> การเปลี่ยนจุดหนึ่งในระบบย่อยย่อมกระทบส่วนอื่นเสมอ<br><br><strong>ในไทย:</strong> สุขภาพกายและจิตเชื่อมโยงแยกไม่ออก การแยกดูเฉพาะอวัยวะโดยขาดการประสานงานจึงไม่ตอบโจทย์ผู้ป่วย</p>
          </div>
          <div class="or-card is-teal-tint">
            <span class="or-card-kicker">2 · EMERGING PROPERTY</span>
            <h3 class="or-card-title">คุณสมบัติผุดบังเกิด</h3>
            <p class="or-card-text"><strong>กลไก:</strong> ปฏิสัมพันธ์สร้างพลังใหม่ระดับภาพรวมที่ไม่เท่ากับผลบวกส่วนย่อย<br><br><strong>ในไทย:</strong> เครือข่ายแพทย์พื้นบ้าน ตลาดปลอดสารพิษ และจิตอาสาชุมชนรวมพลังขับเคลื่อนนโยบายระดับชาติ</p>
          </div>
          <div class="or-card is-rose-tint">
            <span class="or-card-kicker">3 · GOVERNANCE BY FEEDBACK</span>
            <h3 class="or-card-title">อภิบาลด้วยวงจรป้อนกลับ</h3>
            <p class="or-card-text"><strong>กลไก:</strong> ผู้คนตอบสนองทั้งทางเสริมกำลัง (<code>R</code>) และสร้างสมดุล (<code>B</code>) ต่อมาตรการ<br><br><strong>ในไทย:</strong> ผู้ป่วยปรับพฤติกรรมมาใช้ ER เมื่อ ER เพิ่มแพทย์ จนหักล้างผลของมาตรการลดความแออัด</p>
          </div>
          <div class="or-card is-amber-tint">
            <span class="or-card-kicker">4 · SELF-ORGANIZING</span>
            <h3 class="or-card-title">การจัดการตัวเองจากภายใน</h3>
            <p class="or-card-text"><strong>กลไก:</strong> จัดระเบียบความสัมพันธ์ขึ้นเองภายใต้เป้าหมายร่วมแบบ Chaordic<br><br><strong>ในไทย:</strong> ภัยพิบัติสึนามิ พ.ศ. 2547 เครือข่ายอาสาและพื้นที่ประสานช่วยกันเองรับมือวิกฤตได้ทันท่วงที</p>
          </div>
          <div class="or-card is-violet-tint">
            <span class="or-card-kicker">5 · CONSTANTLY CHANGING</span>
            <h3 class="or-card-title">เปลี่ยนแปลงอย่างต่อเนื่อง</h3>
            <p class="or-card-text"><strong>กลไก:</strong> เรียนรู้และปรับตัวข้ามเวลาในหลายระดับตลอดเวลา<br><br><strong>ในไทย:</strong> วิถีชนบทปัจจุบันเชื่อมโยงออนไลน์จนพฤติกรรมบริโภคใกล้เคียงเมือง สูตรเดิมในอดีตจึงใช้ซ้ำตายตัวไม่ได้</p>
          </div>
        </div>
      `
    },
    {
      id: "s23-machine-vs-living",
      num: "23",
      section: "act4",
      sectionLabel: "Act IV · Clinical & Hospital CLD",
      actClass: "is-act-2",
      actLabel: "ACT IV · HEALTH SYSTEMS AS CAS",
      timeWindow: "11.14 – 11.18 น. (4 นาที)",
      kicker: "ST1 MODULE 3.1 · MACHINE METAPHOR VS. LIVING-SYSTEM METAPHOR (BEGUN ET AL., 2003)",
      title: "เปลี่ยนบทบาทแพทย์จาก “ช่างซ่อมเครื่องยนต์” สู่ “ผู้เกื้อหนุนการปรับตัวจากภายใน”",
      keyMessageHtml:
        "การยอมรับความไม่แน่นอน (<code>Uncertainty</code>) <strong>ไม่ได้แปลว่าหมดหนทางพัฒนาสุขภาพ</strong> แต่ช่วยให้แพทย์สร้างสภาวะแวดล้อมและกติกาที่เกื้อหนุนทีมและผู้ป่วย",
      notes:
        "เปรียบเทียบกรณีเกิดความคลาดเคลื่อนทางยาในวอร์ด: หากคิดแบบช่างซ่อมเครื่องยนต์จะมุ่งหาคนผิดและออกกฎซ้อนทับ (ซึ่ง Dee Hock เตือนว่าก่อพฤติกรรมตื้นเขินและปกปิดข้อมูล) แต่หากคิดแบบผู้ดูแลสิ่งมีชีวิตจะวิเคราะห์ระบบงาน ภาระเวร และสร้างกลไกทวนสอบที่เกื้อหนุนคนทำงาน",
      render: () => `
        <div class="st1-split-fig-wide">
          ${figPlate(
            "st1_s07_metaphors.png",
            "เปรียบเทียบมุมมองช่างซ่อมเครื่องยนต์กับมุมมองผู้ดูแลสิ่งมีชีวิต",
            "<strong>เปรียบเทียบกระบวนทัศน์การจัดการระบบสุขภาพ</strong> · Glouberman &amp; Zimmerman (2002); Begun et al. (2003)",
            "PARADIGM SHIFT · MACHINE REPAIR VS. LIVING-SYSTEM STEWARDSHIP"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">TRAP OF REDUCTIONISM · กับดักการสั่งการแยกส่วน</span>
              <h3 class="or-card-title">ซ่อมรายชิ้นทำให้พลาดพลวัตทั้งระบบ</h3>
              <p class="or-card-text">เมื่อเกิดความคลาดเคลื่อนทางยา การมุ่งตำหนิรายบุคคลหรือเพิ่มกฎบังคับจากภายนอกโดยไม่ดูภาระงาน มักก่อแรงต้านและการปกปิดข้อมูล</p>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">EMBRACING UNCERTAINTY · ยอมรับความไม่แน่นอนอย่างสร้างสรรค์</span>
              <h3 class="or-card-title">ประคับประคองศักยภาพภายในเหมือนการเลี้ยงลูก</h3>
              <p class="or-card-text">สร้างความปลอดภัยทางใจ เป้าหมายร่วมที่ชัดเจน และกติกาที่ช่วยให้ทีมสหวิชาชีพ ผู้ป่วย และชุมชนเรียนรู้ปรับตัวร่วมกัน</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s24-stacey-clinical",
      num: "24",
      section: "act4",
      sectionLabel: "Act IV · Clinical & Hospital CLD",
      actClass: "is-act-2",
      actLabel: "ACT IV · CLINICAL STACEY MATRIX",
      timeWindow: "11.18 – 11.23 น. (5 นาที)",
      kicker: "ST1 MODULE 3.2.1 · CLINICAL CONSULTATIONS AT THE EDGE OF CHAOS (INNES ET AL., 2005)",
      title: "การตัดสินใจข้างเตียงบนแกนความไม่แน่นอนและความเข้าใจที่ตรงกัน (Stacey Matrix)",
      keyMessageHtml:
        "กรณีผู้ป่วยหญิงอายุ 48 ปี เจ็บหน้าอกเรื้อรังร่วมกับซึมเศร้า — แพทย์ต้องใช้ <strong>การคิดเชิงระบบและการสื่อสารความไม่แน่นอนอย่างโปร่งใส</strong> ณ ขอบความโกลาหล (<code>Edge of Chaos</code>)",
      notes:
        "ชี้ให้เห็นว่าพื้นที่สีเขียวตรงกลาง (Complex · Edge of Chaos) บน Stacey Matrix คือพื้นที่เดียวกับ Chaordic Zone ของ Dee Hock! ในเคสหญิงอายุ 48 ปี แพทย์ต้องรับฟังความกลัวของญาติและชี้แจงเหตุผลการตรวจแยกโรคหัวใจอย่างโปร่งใส เพื่อไม่ให้สถานการณ์ทะลุเข้าสู่พื้นที่ Chaotic",
      render: () => `
        <div class="st1-split-fig-left">
          ${figPlate(
            "st1_fig3_stacey_matrix.png",
            "ภาพที่ 3 ตารางความซับซ้อนทางคลินิกของสเตซีย์ (Stacey Matrix)",
            "<strong>ภาพที่ 3 ตารางความซับซ้อนของสเตซีย์</strong> · ดัดแปลงจาก Innes et al. (2005) และ โกมาตร จึงเสถียรทรัพย์ (2558)",
            "ST1 FIG. 3 · UNCERTAINTY × AGREEMENT IN CLINICAL CARE"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-amber-tint">
              <span class="or-card-kicker">CLINICAL VIGNETTE · หญิงไทยอายุ 48 ปี เจ็บหน้าอก 2–3 สัปดาห์</span>
              <h3 class="or-card-title">จุดปะทะระหว่างเหตุผลทางคลินิกกับความกลัวของครอบครัว</h3>
              <p class="or-card-text">แพทย์ส่งตรวจแยก <code>Coronary artery disease</code> ก่อนดูแล <code>Major depressive disorder</code> แต่ผู้ป่วยและญาติกลัวโรคหัวใจฉุกเฉิน จึงเกิดทั้ง <strong>ความไม่แน่นอน</strong> และ <strong>ความเข้าใจไม่ตรงกัน</strong></p>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">CLINICAL TAKEAWAY · ป้องกันไม่ให้ถลำสู่ Chaotic</span>
              <h3 class="or-card-title">รับฟังความกังวลและอธิบายความไม่แน่นอนอย่างโปร่งใส</h3>
              <p class="or-card-text">เลือกวิธีตัดสินใจให้ตรงพื้นที่ทั้ง 5 โซน: รับฟังความกลัวอย่างใส่ใจ ชี้แจงขั้นตอนการตรวจแยกโรคอันตรายทีละขั้น เพื่อสร้างความเข้าใจร่วมกันในพื้นที่ <code>Complex</code></p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s25-acute-vs-chronic",
      num: "25",
      section: "act4",
      sectionLabel: "Act IV · Clinical & Hospital CLD",
      actClass: "is-act-2",
      actLabel: "ACT IV · ACUTE VS. CHRONIC CARE",
      timeWindow: "11.23 – 11.27 น. (4 นาที)",
      kicker: "ST1 MODULE 3.2.2 · ACUTE COMPLICATED VS. CHRONIC COMPLEX DISEASES (HOLMAN & LORIG, 2000)",
      title: "เหตุใดระบบตั้งรับของ “โรคเฉียบพลันที่มีความยุ่งยาก” จึงล้มเหลวเมื่อดูแล “โรคเรื้อรังที่มีความซับซ้อน”",
      keyMessageHtml:
        "การจัดคลินิกนัดสั้น ๆ และสั่งยาฝ่ายเดียวในโรคเรื้อรัง ก่อให้เกิดทั้ง <strong>ผลลัพธ์สุขภาพที่ไม่ดี</strong> <strong>การขาดประสิทธิภาพ (Inefficiency)</strong> และ <strong>ความไม่เป็นธรรม (Inequity)</strong>",
      notes:
        "เปรียบเทียบตารางที่ 2 ของ Holman & Lorig (2000): ชี้ให้เห็นกรณี Acute on top of chronic (เช่น DKA หรือหัวใจล้มเหลวกำเริบ) ที่ต้องกู้ชีพเฉียบพลันก่อน แต่หลังจากนั้นต้องเปลี่ยนโครงสร้างเป็นระบบหุ้นส่วนดูแลตนเองระยะยาว มิฉะนั้นผู้ป่วยจะกลับมานอน รพ.ซ้ำซาก เบียดบังเตียงของกลุ่มเปราะบางอื่น",
      render: () => `
        <div class="st1-split-table-top-cards">
          <div class="or-table-wrap is-st1-table" data-fit-table="1">
            <table class="or-table">
              <thead>
                <tr>
                  <th style="width:24%">ประเด็นเปรียบเทียบ (ตารางที่ 2)</th>
                  <th style="width:37%">โรคเฉียบพลันที่มีความยุ่งยาก (Acute Complicated)</th>
                  <th style="width:39%">โรคเรื้อรังที่มีความซับซ้อน (Chronic Complex)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>การเกิดอาการและสาเหตุ</strong></td>
                  <td>เกิดอาการเฉียบพลัน (<code>Abrupt onset</code>) สาเหตุจำเพาะชัดเจน</td>
                  <td>ค่อยเป็นค่อยไป (<code>Gradual onset</code>) หลายสาเหตุร่วมกันทั้งชีวภาพ พฤติกรรม และสังคม</td>
                </tr>
                <tr>
                  <td><strong>การวินิจฉัยและพยากรณ์โรค</strong></td>
                  <td>มักมีความแม่นยำและคาดการณ์แนวโน้มของโรคได้ค่อนข้างชัดเจน</td>
                  <td>มีความไม่แน่นอนสูง ผันแปรตามบริบทชีวิตและการปรับตัวของผู้ป่วยแต่ละราย</td>
                </tr>
                <tr>
                  <td><strong>เทคโนโลยีและเป้าหมาย</strong></td>
                  <td>เทคโนโลยีมีประสิทธิผลสูง มุ่งรักษาให้หายขาด (<code>Cure</code>) กลับสู่ภาวะเดิม</td>
                  <td>ไม่หายขาด (<code>No cure</code>) มุ่งการจัดการต่อเนื่อง การชี้แนะ และการดูแลตนเอง (<code>Self-care</code>)</td>
                </tr>
                <tr>
                  <td><strong>บทบาทความรู้แพทย์ vs ผู้ป่วย</strong></td>
                  <td>ความรู้วิชาชีพของแพทย์เป็นหลักในระยะวิกฤต</td>
                  <td>ความรู้วิชาชีพแพทย์และ <strong>ประสบการณ์ชีวิตจริงของผู้ป่วย/ครอบครัว</strong> สำคัญควบคู่กันในฐานะหุ้นส่วน</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="st1-full-grid-3" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">REAL-WORLD OVERLAP</span>
              <h3 class="or-card-title">Acute on Top of Chronic</h3>
              <p class="or-card-text">เมื่อโรคเรื้อรังกำเริบวิกฤตต้องกู้ชีพเฉียบพลันทันที แต่หลังพ้นวิกฤตต้องส่งต่อสู่ระบบหุ้นส่วนดูแลต่อเนื่อง</p>
            </div>
            <div class="or-card is-amber-tint">
              <span class="or-card-kicker">INEFFICIENCY · ขาดประสิทธิภาพ</span>
              <h3 class="or-card-title">สิ้นเปลืองทรัพยากรตติยภูมิซ้ำซาก</h3>
              <p class="or-card-text">นัดสั้น ๆ และสั่งยาฝ่ายเดียวทำให้คุมโรคไม่ได้ เกิดภาวะแทรกซ้อนและกลับมานอน รพ.ซ้ำไม่รู้จบ</p>
            </div>
            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">INEQUITY · ความไม่เป็นธรรม</span>
              <h3 class="or-card-title">เบียดบังโอกาสกลุ่มเปราะบางอื่น</h3>
              <p class="or-card-text">เตียงและเวลาบุคลากรถูกดึงไปดูแลภาวะแทรกซ้อนที่ป้องกันได้ ลดโอกาสเข้าถึงบริการของประชาชนกลุ่มอื่น</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s26-er-crowding-cld",
      num: "26",
      section: "act4",
      sectionLabel: "Act IV · Clinical & Hospital CLD",
      actClass: "is-act-2",
      actLabel: "ACT IV · ER CROWDING CLD (LOOP R)",
      timeWindow: "11.27 – 11.32 น. (5 นาที)",
      kicker: "ST1 MODULE 3.3.1 · EMERGENCY ROOM CROWDING, VICIOUS CYCLES & PRIMARY CARE UNDERINVESTMENT",
      title: "วงจรอุบาทว์ความแออัดห้องฉุกเฉิน: เมื่อการแก้เฉพาะจุดสร้างผลลัพธ์ที่ไม่ได้ตั้งใจ",
      keyMessageHtml:
        "การดึงงบและคนมาเติมเฉพาะใน <code>ER</code> บั่นทอนขีดความสามารถปฐมภูมินอก <code>ER</code> (<code>Underinvestment</code>) จนเครื่องหมาย <code>−</code> สองจุดคูณกันเป็น <strong>วงจรเสริมแรง (<code>Loop R</code>)</strong>",
      notes:
        "พาผู้เรียนไล่ขั้ว + และ − ที่หัวลูกศรทั้ง 6 จุดในภาพที่ 4: สังเกตว่ามีเครื่องหมาย − จำนวนคู่ (2 จุด) จึงหมุนเร่งเป็นวงจรอุบาทว์ (Loop R) และเชื่อมย้อนกลับไปหาแม่แบบ Growth and Underinvestment: การไม่ลงทุนขยายศักยภาพคลินิกปฐมภูมินอกเวลา (Underinvestment in Primary Care Capacity) คือรากของวิกฤตห้องฉุกเฉิน!",
      render: () => `
        <div class="st1-split-fig-left">
          ${figPlate(
            "st1_fig4_er_crowding_cld.png",
            "ภาพที่ 4 วงจรอุบาทว์ความแออัดห้องฉุกเฉิน (Emergency Room Crowding CLD)",
            "<strong>ภาพที่ 4 แผนผังวงจรเหตุปัจจัยความแออัดห้องฉุกเฉิน</strong> · บวรศม ลีระพันธ์ สังเคราะห์จาก Glouberman (2000)",
            "ST1 FIG. 4 · REINFORCING VICIOUS CYCLE (R) · BARE + / − AT ARROWHEADS"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">READING CLD POLARITY · ลบ 2 จุดหักล้างกันเป็นบวก</span>
              <h3 class="or-card-title">ทำไมยิ่งเพิ่มแพทย์ใน ER ห้องฉุกเฉินจึงยิ่งแตก?</h3>
              <p class="or-card-text">เมื่อคิว ER เร็วขึ้นชั่วคราว ผู้ป่วยไม่ฉุกเฉินยิ่งเลือกมา ER ขณะที่ รพ.ดึงทรัพยากรออกจากคลินิกนอก ER มาโปะ (<code>−</code>) ทำให้บริการทั่วไปยิ่งเข้าถึงยาก และผลักผู้ป่วยกลับมาที่ ER ซ้ำอีก (<code>−</code>)</p>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">HIGH-LEVERAGE FIX · ปลดล็อก Growth &amp; Underinvestment</span>
              <h3 class="or-card-title">ลงทุนขยายขีดความสามารถระบบบริการปฐมภูมิควบคู่กัน</h3>
              <p class="or-card-text">ขยายคลินิกปฐมภูมินอกเวลาและทีมหมอครอบครัวให้เข้าถึงสะดวกและน่าเชื่อถือ พร้อมออกแบบกติกาและแรงจูงใจให้สอดคล้องกันทั้งระบบ</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s27-elephant-iceberg-systematic",
      num: "27",
      section: "act4",
      sectionLabel: "Act IV · Clinical & Hospital CLD",
      actClass: "is-act-3",
      actLabel: "ACT IV · HOLISTIC SYNTHESIS & HPSR",
      timeWindow: "11.32 – 11.36 น. (4 นาที)",
      kicker: "ST1 MODULE 4.1 – 4.3 · BLIND MEN & ELEPHANT, ICEBERG HEALTH MATRIX & SYSTEMS VS. SYSTEMATIC THINKING",
      title: "ก้าวพ้น “ตาบอดคลำช้าง” สู่การประยุกต์ภูเขาน้ำแข็งในคลินิก และคำถามวิจัยระบบสุขภาพ",
      keyMessageHtml:
        "ผสานความรัดกุมเป็นขั้นตอน (<code>Systematic</code>) เข้ากับความเข้าใจพลวัตทั้งระบบ (<code>Systems</code>) เพื่อตอบว่า <strong>“อะไรได้ผลดี สำหรับใคร และภายใต้บริบทใด”</strong> (Gilson, 2012)",
      notes:
        "กด Clicker สลับดู 3 แท็บด้านขวาคู่กับภาพตาบอดคลำช้าง: (1) การไล่ภูเขาน้ำแข็ง 4 ระดับในกรณี ER แออัดและโรคเรื้อรังคุมไม่ได้ (2) วรรคทองของ อ.โกมาตร จึงเสถียรทรัพย์ เรื่อง ‘คิดเป็นรายเหตุการณ์ ทั้งชีวิตมีแต่การรณรงค์’ และ (3) การแยก Systems Thinking ออกจาก Systematic Thinking (เช่น หลักโยนิโสมนสิการและกระบวนการวิทยาศาสตร์)",
      maxSubSteps: 3,
      render: () => {
        const s = isExportOrHandout() ? 0 : state.subStep;
        return `
          <div class="st1-hero-fig-stage">
            ${renderStepBarHtml(["① ภูเขาน้ำแข็งใน ER & โรคเรื้อรัง", "② ก้าวพ้นการรณรงค์เฉพาะกิจ", "③ Systems vs. Systematic & HPSR"], s)}
            <div class="st1-split-fig-left" style="flex:1;min-height:0">
              ${figPlate(
                "st1_fig5_blind_men_elephant.png",
                "ภาพที่ 5 จากมุมมองแยกส่วนแบบตาบอดคลำช้าง สู่การคิดเชิงระบบ",
                "<strong>ภาพที่ 5 มุมมองตาบอดคลำช้างเทียบกับการคิดเชิงระบบ</strong> · de Savigny &amp; Adam (2009); โกมาตร จึงเสถียรทรัพย์ (2558)",
                "ST1 FIG. 5 · FRAGMENTED SILOS VS. WHOLE-SYSTEM PERSPECTIVE"
              )}

              ${
                s === 1
                  ? `
                <div class="or-stack-col" data-fit-group="cards">
                  <div class="or-card is-rose-tint">
                    <span class="or-card-kicker">EVENT-FOCUSED TRAP · อาการของการทำงานไร้ระบบ</span>
                    <h3 class="or-card-title">“คิดเป็นรายเหตุการณ์ ทั้งชีวิตมีแต่การรณรงค์”</h3>
                    <p class="or-card-text">ดังที่ โกมาตร จึงเสถียรทรัพย์ (2558) สรุปไว้ว่า <em>“คิดเป็นรายเหตุการณ์ ระบบงานไม่ต้องเซ็ต ทำเสร็จแต่งานเฉพาะหน้า แก้ปัญหาแบบเฉพาะกิจ ทั้งชีวิตมีแต่การรณรงค์”</em></p>
                  </div>
                  <div class="or-card is-amber-tint">
                    <span class="or-card-kicker">HERO-DEPENDENT FRAGILITY · กับดักการพึ่งฮีโร่คนเดียว</span>
                    <h3 class="or-card-title">เก่งเฉพาะตัวแต่ขาดโครงสร้างรองรับ ย่อมไม่ยั่งยืน</h3>
                    <p class="or-card-text">โครงการที่พึ่งแต่ความทุ่มเทของผู้นำคนเดียวโดยไม่วางกติกาและความสัมพันธ์ของทีม เมื่อเปลี่ยนคนระบบก็ล่มทันที</p>
                  </div>
                </div>
              `
                  : s === 2
                  ? `
                <div class="or-stack-col" data-fit-group="cards">
                  <div class="or-card is-navy-tint">
                    <span class="or-card-kicker">SYSTEMATIC VS. SYSTEMS THINKING</span>
                    <h3 class="or-card-title">คิดอย่างเป็นระบบ (ลำดับขั้น) คู่กับ คิดเชิงระบบ (พลวัตองค์รวม)</h3>
                    <p class="or-card-text"><strong>Systematic thinking:</strong> คิดตามลำดับเหตุผลรัดกุม เช่น หลักโยนิโสมนสิการ และกระบวนการทางวิทยาศาสตร์ · <strong>Systems thinking:</strong> เข้าใจความเชื่อมโยง วงจรป้อนกลับ และบริบทของ <code>CAS</code></p>
                  </div>
                  <div class="or-card is-violet-tint">
                    <span class="or-card-kicker">REALIST HPSR QUESTION · GILSON (2012)</span>
                    <h3 class="or-card-title">“What works, for whom, and under what circumstances?”</h3>
                    <p class="or-card-text">ก้าวข้ามคำถามเส้นตรงว่า <em>“มาตรการนี้ได้ผลหรือไม่?”</em> สู่การค้นหาว่ามาตรการใดทำงานได้ดี สำหรับกลุ่มใด และภายใต้บริบทเงื่อนไขใด</p>
                  </div>
                </div>
              `
                  : `
                <div class="or-table-wrap is-st1-table" data-fit-table="1">
                  <table class="or-table">
                    <thead>
                      <tr>
                        <th style="width:24%">ระดับภูเขาน้ำแข็ง</th>
                        <th style="width:38%">กรณีห้องฉุกเฉินแออัด</th>
                        <th style="width:38%">กรณีโรคเรื้อรังคุมไม่ได้</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>1. Events</strong><br><span class="or-td-sub">To React</span></td>
                        <td>คืนนี้คนไข้ล้น ER รอ 4 ชม. → เรียกแพทย์เสริมเฉพาะกิจ</td>
                        <td>วันนี้ผู้ป่วยเบาหวานน้ำตาลสูงวิกฤต → กู้ชีพด้วยสารน้ำ/อินซูลิน</td>
                      </tr>
                      <tr>
                        <td><strong>2. Patterns (BOT)</strong><br><span class="or-td-sub">To Predict</span></td>
                        <td>ผู้ป่วยไม่ฉุกเฉินมาเย็น/วันหยุดพุ่งทุกปี → จัดเวรเพิ่มตามช่วง</td>
                        <td>วัยทำงานหาเช้ากินค่ำขาดนัดและนอน รพ.ซ้ำสูงต่อเนื่อง</td>
                      </tr>
                      <tr>
                        <td><strong>3. Structures (CLD)</strong><br><span class="or-td-sub">To Design</span></td>
                        <td>ดึงงบปฐมภูมิไปโปะ ER → <strong>ลงทุนขยายคลินิกปฐมภูมินอกเวลา</strong></td>
                        <td>คลินิกนัดสั้นชนเวลาทำงาน → <strong>จัดระบบดูแลต่อเนื่องเชื่อม รพ.สต.</strong></td>
                      </tr>
                      <tr>
                        <td><strong>4. Mental Models</strong><br><span class="or-td-sub">To Transform</span></td>
                        <td>เปลี่ยนจาก <em>“รพ.ใหญ่คือที่พึ่งแรก”</em> สู่ <strong>“ปฐมภูมิใกล้บ้านคือฐานหลัก”</strong></td>
                        <td>เปลี่ยนจาก <em>“แพทย์สั่งการ”</em> สู่ <strong>“ผู้ป่วยและครอบครัวคือหุ้นส่วนหลัก”</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              `
              }
            </div>
          </div>
        `;
      }
    },
    {
      id: "s28-enroads-intro",
      num: "28",
      section: "act5",
      sectionLabel: "Act V · En-ROADS & Quiz",
      actClass: "is-act-4",
      actLabel: "ACT V · EXPERIENTIAL LAB #2 (EN-ROADS)",
      timeWindow: "11.36 – 11.41 น. (5 นาที)",
      kicker: "THE CLIMATE INTERACTIVE GAME · EN-ROADS PLANETARY POLICY SIMULATOR (MIT SLOAN)",
      title: "“The Climate Interactive Game” (En-ROADS Simulator) — กติกาและฉากทัศน์ปี ค.ศ. 2100",
      keyMessageHtml:
        "โจทย์ท้าทายระดับพิภพโลก: <strong>ทีมที่เลือกชุดนโยบายซึ่งทำให้อุณหภูมิโลกต่ำที่สุด และเศรษฐกิจเติบโตมากที่สุดในปี ค.ศ. 2100 เป็นผู้ชนะ!</strong>",
      notes:
        "เชื่อมจากระดับทีม (Warped Juggle) และโรงพยาบาล (ER CLD) สู่ระบบที่ใหญ่ที่สุดคือระบบนิเวศพิภพโลก (Planetary Health): แนะนำเกม The Climate Interactive Game ด้วยโปรแกรมจำลอง En-ROADS ของ MIT Sloan ชี้ให้เห็นฉากทัศน์ +1.5°C, +2.0°C และ +3.6°C Baseline พร้อมหมวดนโยบายทั้ง 6 หมวด",
      render: () => `
        <div class="st1-hero-fig-stage">
          ${figPlate(
            "st1_enroads_climate_futures.png",
            "The Climate Interactive Game: En-ROADS Planetary Policy Simulator",
            "<strong>อ้างอิง:</strong> UNFCCC &amp; Climate Interactive / MIT Sloan Sustainability Initiative — เชื่อมตรงสู่แนวคิด <code>Planetary Health</code> ในเวทีเสวนาภาคบ่าย",
            "PLANETARY SYSTEMS LAB · LOWEST GLOBAL TEMPERATURE + STRONGEST ECONOMY IN 2100"
          )}
        </div>
      `
    },
    {
      id: "s29-enroads-sandbox",
      num: "29",
      section: "act5",
      sectionLabel: "Act V · En-ROADS & Quiz",
      actClass: "is-act-4",
      actLabel: "ACT V · EN-ROADS INTERACTIVE SANDBOX",
      timeWindow: "11.41 – 11.48 น. (7 นาที)",
      kicker: "NO SILVER BULLET — ONLY SILVER BUCKSHOT · MULTI-SECTOR LEVERAGE & TIME DELAYS",
      title: "ทดลองขยับคานงัดนโยบาย En-ROADS: เหตุใดการแก้ปัญหาซับซ้อนจึงไม่มี “กระสุนเงินนัดเดียว”",
      keyMessageHtml:
        "ลองเลื่อนสไลเดอร์ด้านขวาหรือเปิด <code>En-ROADS</code> ตัวจริง — ลำพังการปลูกป่าหรือเทคโนโลยีดักจับคาร์บอนเพียงจุดเดียวไม่อาจลดอุณหภูมิจาก <code>+3.6°C</code> สู่ <code>+1.5°C</code> ได้ทันเวลา!",
      notes:
        "กดปุ่ม ‘ลองแก้จุดเดียว (Silver Bullet?)’ เพื่อพิสูจน์ให้ห้องเรียนเห็นว่าต่อให้ดันการปลูกป่าและดักจับคาร์บอนเต็ม 100% แต่อย่างอื่นเหมือนเดิม อุณหภูมิก็ลดลงได้เพียงเล็กน้อยเพราะยังมีก๊าซเรือนกระจกไหลเข้าสู่ระบบ (Stock & Flow + Delay เหมือนสระบัว!) จากนั้นกด ‘ชุดนโยบายทั้งระบบ (+1.5°C)’ หรือคลิกเปิดเว็บ En-ROADS ตัวจริงเพื่อเล่นร่วมกัน",
      render: () => `
        <div class="st1-split-fig-left">
          ${figPlate(
            "st1_enroads_simulator_ui.png",
            "หน้าจอโปรแกรมจำลอง En-ROADS Climate Interactive Simulator (+3.6°C Baseline)",
            "<strong>Source:</strong> <code>en-roads.climateinteractive.org</code> · MIT Sloan &amp; Climate Interactive",
            "OFFICIAL EN-ROADS DASHBOARD · BASELINE +3.6°C (+6.5°F) BY 2100"
          )}

          ${renderEnroadsSandboxHtml()}
        </div>
      `
    },
    {
      id: "s30-live-quiz",
      num: "30",
      section: "act5",
      sectionLabel: "Act V · En-ROADS & Quiz",
      actClass: "is-act-4",
      actLabel: "ACT V · LIVE KAHOOT CONCEPT CHECK",
      timeWindow: "11.48 – 11.56 น. (8 นาที)",
      kicker: "CLASSROOM ACTIVE RECALL · 6 HIGH-YIELD SYSTEMS THINKING SCENARIOS (MQTT LIVE SYNC)",
      title: "ทบทวนความเข้าใจท้ายคาบ (ST1 Concept Check): Warped Juggle · CLD · CAS · คลินิก · En-ROADS",
      keyMessageHtml:
        "ร่วมตอบคำถามทั้ง <strong>6 ข้อ</strong> บนมือถือ/แท็บเล็ตเพื่อตรวจสอบความแม่นยำของเลนส์คิดเชิงระบบก่อนนำไปใช้จริงตลอด 6 สัปดาห์",
      notes:
        "ให้นักศึกษากดเลือกคำตอบทั้ง 6 ข้อบนอุปกรณ์ของตนเอง ระบบจะนับจำนวนผู้ตอบแบบเรียลไทม์ผ่าน MQTT (โดยไม่ส่งเฉลยผ่านเครือข่ายสาธารณะ) และอาจารย์สามารถกดปุ่ม ‘เฉลยหน้าชั้นเรียน’ เพื่ออภิปรายเหตุผลทีละข้อ",
      isLiveQuizSlide: true,
      render: () => renderQuizStageHtml(true)
    },
    {
      id: "s31-bridge-forward",
      num: "31",
      section: "act5",
      sectionLabel: "Act V · En-ROADS & Quiz",
      actClass: "is-act-4",
      actLabel: "ACT V · SYNTHESIS & FIELDWORK BRIDGE",
      timeWindow: "11.56 – 12.00 น. (4 นาที)",
      kicker: "TAKEAWAYS & BRIDGE ACROSS THE 6-WEEK RACM 303 JOURNEY",
      title: "บทสรุป ST1 และการส่งต่อเลนส์คิดเชิงระบบสู่เวทีเสวนาบ่ายนี้ HS1–HS6 และภาคสนาม 9 แห่ง",
      keyMessageHtml:
        "พกคำถาม <strong>ภูเขาน้ำแข็ง 4 ระดับ</strong> การสังเกต <strong>วงจร <code>R / B</code> และสมมติฐานแฝง</strong> ไปใช้ตั้งแต่วันนี้จนถึงวันนำเสนอผลงานภาคสนาม (ฟอร์ม <code>3A</code>)",
      notes:
        "สรุปรวบยอดสาระสำคัญทั้ง 5 องก์ และเชื่อมรอยต่อทันทีสู่ช่วงบ่ายวันนี้ 13.30–17.00 น. ณ ห้อง 2C2-03: เวทีเสวนา ‘จากการดูแลผู้ป่วยรายบุคคลสู่เวชปฏิบัติฐานระบบ (From Bedside to Systems-Based Practice)’ ซึ่งต่อยอดทั้ง Health Advocacy, HPSR, Global Health และ Planetary Health จาก En-ROADS โดยตรง!",
      render: () => `
        <div class="st1-full-grid-2">
          <div class="or-stack-col" data-fit-group="left-sum">
            <div class="or-card is-amber-tint">
              <span class="or-card-kicker">EXPERIENTIAL TAKEAWAY · จาก Warped Juggle &amp; En-ROADS</span>
              <h3 class="or-card-title">ก้าวพ้น “Work Harder” และ “กระสุนเงินนัดเดียว”</h3>
              <p class="or-card-text">ตั้งคำถามต่อสมมติฐานที่มองไม่เห็น ลงทุนเวลาเรียนรู้และขยายขีดความสามารถล่วงหน้า (<code>Growth &amp; Underinvestment</code>) วางหลักการที่เรียบง่ายชัดเจนแบบ <code>Chaordic</code> และขยับชุดคานงัดหลายภาคส่วนร่วมกัน</p>
            </div>

            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">CLINICAL &amp; HEALTH SYSTEM TAKEAWAY · จากข้างเตียงสู่ปฐมภูมิ</span>
              <h3 class="or-card-title">เข้าใจบริบทของ CAS ตัดวงจรอุบาทว์ ER และส่องลึกใต้ภูเขาน้ำแข็ง</h3>
              <p class="or-card-text">สื่อสารความไม่แน่นอนบน <code>Stacey Matrix</code> สร้างความเป็นหุ้นส่วนในโรคเรื้อรัง เสริมปฐมภูมิเพื่อตัดวงจรเสริมแรง <code>R</code> ของห้องฉุกเฉิน และตอบคำถาม <em>“อะไรได้ผล สำหรับใคร และภายใต้บริบทใด”</em></p>
            </div>
          </div>

          <div class="or-stack-col" data-fit-group="right-steps">
            <div class="or-card is-white">
              <span class="or-card-kicker">① วันนี้ · 13.30 – 17.00 น. (ห้อง 2C2-03)</span>
              <p class="or-card-text"><strong>เวทีเสวนา <code>จากการดูแลผู้ป่วยรายบุคคลสู่เวชปฏิบัติฐานระบบ</code> (From Bedside to Systems-Based Practice): เรียนรู้บทบาทแพทย์ด้าน HSS, HPSR, Global Health &amp; Planetary Health</strong></p>
            </div>
            <div class="or-card is-white">
              <span class="or-card-kicker">② สัปดาห์ที่ 1 – 3 · บทเรียน HS1 – HS6 &amp; Self-Quiz</span>
              <p class="or-card-text"><strong>ทบทวนเอกสารคำสอน ST1 (ฉบับเต็ม/ย่อ &amp; Self-Quiz) และใช้เลนส์ CAS วิเคราะห์ 6 องค์ประกอบระบบสุขภาพครบทุกคาบ</strong></p>
            </div>
            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">③ สัปดาห์ที่ 4 · ฝึกปฏิบัติภาคสนาม 9 โรงพยาบาลชุมชน</span>
              <p class="or-card-text"><strong>สังเกตบริบทพื้นที่ ความเชื่อมโยงของระบบอำเภอ และรากปัญหาใต้ภูเขาน้ำแข็ง พร้อมบันทึกสะท้อนคิดใน <code>SRN 1–2</code></strong></p>
            </div>
            <div class="or-card is-violet-tint">
              <span class="or-card-kicker">④ อังคาร 22 ธ.ค. (13.00–16.30 น.) &amp; นำเสนอฟอร์ม 3A (29 ธ.ค.)</span>
              <p class="or-card-text"><strong>เวิร์กชอป <code>ST2: Synthesis from Dynamic Complexity</code> นำโจทย์พื้นที่จริงมาวาด <code>CLD &amp; Archetypes</code> สู่ข้อเสนอระดับจุดคานงัด</strong></p>
            </div>
          </div>
        </div>
      `
    }
  ];

  const SECTION_FILTERS = [
    { id: "all", labelTh: "ทั้งหมด (31)", labelEn: "All Slides (31)" },
    { id: "intro", labelTh: "เปิดคาบ & แผนการเรียน (2)", labelEn: "Opening & Roadmap (2)" },
    { id: "act1", labelTh: "Act I · เกม Warped Juggle (4)", labelEn: "Act I · Warped Juggle (4)" },
    { id: "act2", labelTh: "Act II · ฝึกเขียน CLD & Archetypes (10)", labelEn: "Act II · CLD & Archetypes (10)" },
    { id: "act3", labelTh: "Act III · ภูเขาน้ำแข็ง, Chaordic & CAS (6)", labelEn: "Act III · Iceberg, Chaordic & CAS (6)" },
    { id: "act4", labelTh: "Act IV · คลินิก & วงจร ER (5)", labelEn: "Act IV · Clinical & ER CLD (5)" },
    { id: "act5", labelTh: "Act V · เกม En-ROADS & Quiz (4)", labelEn: "Act V · En-ROADS & Quiz (4)" }
  ];

  /* ---------- Per-Frame Bidirectional Binary-Search Auto-Fit Typography (--fit-scale) ---------- */
  function isPhoneReflowMode() {
    const w = window.innerWidth || 1024, h = window.innerHeight || 768;
    return w <= 700 && w <= h;
  }
  function isAutoHeightBox(el) {
    if (!el || el.clientHeight <= 0) return true;
    el.style.setProperty("--fit-scale", "0.70");
    const h1 = el.clientHeight;
    el.style.setProperty("--fit-scale", "1.45");
    const h2 = el.clientHeight;
    el.style.removeProperty("--fit-scale");
    return h2 - h1 > Math.max(16, h1 * 0.24);
  }
  function filterBoundedGroup(els) {
    if (!els.length) return [];
    els.forEach((el) => el.style.setProperty("--fit-scale", "0.70"));
    const h1 = els.map((el) => el.clientHeight);
    els.forEach((el) => el.style.setProperty("--fit-scale", "1.45"));
    const h2 = els.map((el) => el.clientHeight);
    els.forEach((el) => el.style.removeProperty("--fit-scale"));
    const bounded = [];
    for (let i = 0; i < els.length; i += 1) {
      if (els[i].clientHeight > 0 && h2[i] - h1[i] <= Math.max(16, h1[i] * 0.24)) bounded.push(els[i]);
    }
    return bounded;
  }
  function singleBoxFitsCleanly(el) {
    if (el.clientHeight <= 0 || el.clientWidth <= 0) return true;
    if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) return false;
    const cs = window.getComputedStyle(el);
    const padT = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0, padR = parseFloat(cs.paddingRight) || 0;
    const bT = parseFloat(cs.borderTopWidth) || 0, bB = parseFloat(cs.borderBottomWidth) || 0, bR = parseFloat(cs.borderRightWidth) || 0;
    const r = el.getBoundingClientRect();
    const innerTop = r.top + bT + padT - 1.0, innerBot = r.bottom - bB - padB + 1.0, innerRight = r.right - bR - padR + 1.5;
    for (let k = 0; k < el.children.length; k += 1) {
      const kid = el.children[k];
      const kcs = window.getComputedStyle(kid);
      if (kcs.display === "none" || kcs.position === "absolute") continue;
      const kr = kid.getBoundingClientRect();
      if (kr.height <= 0 && kr.width <= 0) continue;
      if (kr.top < innerTop || kr.bottom > innerBot || kr.right > innerRight) return false;
    }
    return true;
  }
  function boxesFitCleanly(els) {
    for (let i = 0; i < els.length; i += 1) if (!singleBoxFitsCleanly(els[i])) return false;
    return true;
  }
  function tablesFitCleanly(wraps) {
    for (let i = 0; i < wraps.length; i += 1) {
      const w = wraps[i], tbl = w.querySelector(".or-table");
      if (!tbl || w.clientHeight <= 0 || w.clientWidth <= 0) continue;
      if (tbl.offsetHeight > w.clientHeight - 1 || w.scrollHeight > w.clientHeight + 1 || tbl.scrollWidth > w.clientWidth + 1) return false;
    }
    return true;
  }
  function findMaxScaleForBox(el, checkFn, minS, maxS, safetyFactor) {
    let lo = minS, hi = maxS;
    for (let step = 0; step < 12; step += 1) {
      const mid = (lo + hi) * 0.5;
      el.style.setProperty("--fit-scale", mid.toFixed(4));
      if (checkFn([el])) lo = mid;
      else hi = mid;
    }
    return Math.max(minS, lo * safetyFactor);
  }
  function fitHarmonizedCardGroup(els, minS, maxS, safetyFactor, maxSiblingSpread) {
    if (!els.length) return;
    const bounded = filterBoundedGroup(els);
    els.forEach((el) => { if (bounded.indexOf(el) === -1) el.style.removeProperty("--fit-scale"); });
    if (!bounded.length) return;
    const rawScales = bounded.map((el) => findMaxScaleForBox(el, boxesFitCleanly, minS, maxS, safetyFactor));
    const minGroupScale = Math.min.apply(null, rawScales);
    const cap = minGroupScale * (maxSiblingSpread || 1.26);
    for (let i = 0; i < bounded.length; i += 1) bounded[i].style.setProperty("--fit-scale", Math.min(rawScales[i], cap).toFixed(4));
  }
  function verifyPostMeasureFit(els, checkFn, minS) {
    for (let i = 0; i < els.length; i += 1) {
      const el = els[i];
      if (!el.style.getPropertyValue("--fit-scale")) continue;
      let s = parseFloat(el.style.getPropertyValue("--fit-scale")) || 1;
      let guard = 0;
      while (!checkFn(el) && s > minS && guard < 12) {
        s = Math.max(minS, s * 0.96);
        el.style.setProperty("--fit-scale", s.toFixed(4));
        guard += 1;
      }
    }
  }
  function fitSingleSlideCanvas(canvas) {
    if (!canvas || canvas.offsetWidth <= 0 || canvas.offsetHeight <= 0) return;
    if (
      canvas.classList.contains("is-cover-canvas") ||
      canvas.classList.contains("is-quiz-slide-canvas") ||
      (isPhoneReflowMode() && !isExportOrHandout())
    ) {
      canvas.querySelectorAll("[style*='--fit-scale']").forEach((el) => el.style.removeProperty("--fit-scale"));
      return;
    }
    canvas.setAttribute("data-measuring", "1");
    const allScaled = Array.from(canvas.querySelectorAll(".or-card, .or-table-wrap"));
    allScaled.forEach((el) => el.style.removeProperty("--fit-scale"));
    canvas.querySelectorAll("[data-fit-group]").forEach((grp) => {
      const targets = Array.from(grp.querySelectorAll(":scope > .or-card"));
      if (targets.length) fitHarmonizedCardGroup(targets, 0.46, 2.35, 0.96, 1.26);
    });
    canvas.querySelectorAll("[data-fit-solo]").forEach((box) => {
      if (isAutoHeightBox(box)) return;
      box.style.setProperty("--fit-scale", findMaxScaleForBox(box, boxesFitCleanly, 0.46, 2.30, 0.95).toFixed(4));
    });
    const tableWraps = Array.from(canvas.querySelectorAll("[data-fit-table]"));
    tableWraps.forEach((tw) => {
      if (isAutoHeightBox(tw)) return;
      tw.style.setProperty("--fit-scale", findMaxScaleForBox(tw, tablesFitCleanly, 0.46, 2.10, 0.965).toFixed(4));
    });
    canvas.removeAttribute("data-measuring");
    verifyPostMeasureFit(allScaled.filter((el) => !el.hasAttribute("data-fit-table")), singleBoxFitsCleanly, 0.44);
    verifyPostMeasureFit(tableWraps, (tw) => tablesFitCleanly([tw]), 0.44);
  }
  function fitAllVisibleCanvases() {
    const modal = document.getElementById("st1DeckModal");
    if (!modal || modal.hidden) return;
    modal.querySelectorAll(".or-slide-canvas").forEach(fitSingleSlideCanvas);
  }
  function scheduleFitOnResize() {
    if (state.resizeRaf) cancelAnimationFrame(state.resizeRaf);
    state.resizeRaf = requestAnimationFrame(() => {
      state.resizeRaf = 0;
      fitAllVisibleCanvases();
    });
  }
  function wireImageLoadRefit(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", scheduleFitOnResize, { once: true });
    });
  }

  function formatTimer(sec) {
    const mins = Math.floor(sec / 60), rem = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")} / 150:00`;
  }
  function clearAutoPlayTimer() {
    if (state.autoPlayTimeout) { clearTimeout(state.autoPlayTimeout); state.autoPlayTimeout = null; }
  }
  function scheduleAutoPlayTick() {
    clearAutoPlayTimer();
    if (!state.isOpen || !state.autoPlay || state.viewMode !== "deck") return;
    state.autoPlayTimeout = setTimeout(() => {
      if (!state.isOpen || !state.autoPlay || state.viewMode !== "deck") return;
      if (!stepSlide(1, true)) { state.autoPlay = false; renderModal(); }
    }, AUTOPLAY_MS);
  }
  function toggleAutoPlay() {
    if (state.viewMode !== "deck") state.viewMode = "deck";
    state.autoPlay = !state.autoPlay;
    state.toolsMenuOpen = false;
    if (state.autoPlay && state.slideIdx >= SLIDES.length - 1) { state.slideIdx = 0; state.subStep = 0; }
    renderModal();
  }
  function toggleTimer() {
    if (state.timerRunning) {
      state.timerRunning = false;
      if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
    } else {
      state.timerRunning = true;
      state.timerInterval = setInterval(() => {
        state.timerSeconds += 1;
        document.querySelectorAll("[data-st1-timer-display]").forEach((btn) => {
          btn.textContent = formatTimer(state.timerSeconds);
          btn.classList.toggle("is-running", state.timerRunning && state.timerSeconds <= SESSION_LIMIT_SEC);
          btn.classList.toggle("is-overtime", state.timerSeconds > SESSION_LIMIT_SEC);
        });
      }, 1000);
    }
    renderModal();
  }
  function resetTimer() {
    state.timerRunning = false;
    state.timerSeconds = 0;
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
    renderModal();
  }
  function tickWjClock() {
    if (!state.wjRunning) return;
    state.wjElapsedMs = performance.now() - state.wjStartPerf;
    const el = document.getElementById("st1WjClockDigits");
    if (el) el.textContent = formatWjMs(state.wjElapsedMs);
    state.wjRaf = requestAnimationFrame(tickWjClock);
  }
  function animateCoverKpis(rootEl) {
    if (!rootEl || state.viewMode !== "deck" || isExportOrHandout()) return;
    rootEl.querySelectorAll("[data-count-to]").forEach((el) => {
      const target = Number(el.getAttribute("data-count-to")) || 0;
      if (!target) return;
      const start = performance.now(), dur = 620;
      function step(now) {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = String(target);
      }
      requestAnimationFrame(step);
    });
  }

  function renderCoverRightCardHtml(isHandout) {
    const qrSvg = buildQrSvg(PROD_STUDENT_DECK_URL);
    if (state.coverPaneMode === "hero" || isHandout || Boolean(window.__RACM_EXPORTING_DECK)) {
      return `
        <div class="orl-cover-card is-hero-view">
          <div class="orl-cover-head">
            <span class="orl-live-pill"><span class="orl-dot is-online"></span> ST1 MASTER VISUAL ARCHITECTURE</span>
            ${
              !isHandout && !window.__RACM_EXPORTING_DECK
                ? `<button type="button" class="orl-mini-switch" data-st1-act="show-cover-lobby">📱 สลับหน้า QR &amp; ซิงค์สด</button>`
                : ""
            }
          </div>
          <figure class="or-fig-plate is-st1-plate is-cover-hero" style="flex:1;min-height:0">
            <div class="or-fig-img-wrap">
              <img class="or-fig-img" data-base-img="st1_s01_hero.png" src="${IMG_DIR}/st1_s01_hero.png?v=${ASSET_VER}" alt="ST1 Master Journey Visual Architecture" loading="eager" decoding="async" />
            </div>
          </figure>
        </div>
      `;
    }
    let answeredCnt = 0;
    QUIZ_ITEMS.forEach((q) => { if (Object.prototype.hasOwnProperty.call(state.quizAnswers, q.id)) answeredCnt += 1; });
    return `
      <div class="orl-cover-card">
        <div class="orl-cover-head">
          <div class="orl-cover-head-left">
            <span class="orl-live-pill"><span class="orl-dot is-online"></span> SCAN ซิงค์สไลด์สด · ST1</span>
            <span class="orl-sync-sub">รองรับมือถือ · iPad · Clicker</span>
          </div>
          <div class="orl-cover-head-actions">
            <button type="button" class="orl-mini-switch" data-st1-act="zoom-qr">🔍 ขยาย QR</button>
            <button type="button" class="orl-mini-switch" data-st1-act="show-cover-hero">🖼️ แผนภาพรวม</button>
          </div>
        </div>
        <div class="orl-cover-body">
          <div class="orl-cover-qr-col">
            <button type="button" class="orl-qr-frame-btn" data-st1-act="zoom-qr" title="แตะเพื่อขยาย QR Code">${qrSvg}</button>
            <div class="orl-qr-url-box">
              <span class="orl-qr-scan-kicker">📱 สแกนเปิดสไลด์ &amp; ทำ Quiz สด</span>
              <code class="orl-qr-url-code">racm303-2569-student/#st1</code>
            </div>
          </div>
          <div class="orl-cover-info-col">
            <div class="orl-count-hero-box">
              <div class="orl-count-nums">
                <span class="orl-count-big">${SLIDES.length}</span>
                <span class="orl-count-denom">สไลด์ Interactive · 2.5 ชม.</span>
              </div>
              <span class="orl-count-caption">🎯 2 เกมจำลอง · ↻ CLD Step-by-Step · 🧠 Quiz ${answeredCnt}/${QUIZ_ITEMS.length} ข้อ</span>
            </div>
            <div class="orl-topic-tags">
              <span class="orl-tag is-do">🤹 Warped Juggle (5 กฎ)</span>
              <span class="orl-tag is-osmu">↻ CLD &amp; Archetypes</span>
              <span class="orl-tag is-exam">🧊 Iceberg &amp; Chaordic</span>
              <span class="orl-tag is-ai">🌍 En-ROADS 2100</span>
            </div>
            <div class="orl-chips-stream">
              <div class="orl-empty-onboard">
                <div class="orl-eo-kicker">📲 โหมดเรียนสด Interactive เหมือนคาบ Orientation</div>
                <div class="orl-eo-steps">
                  <div class="orl-eo-step"><span class="orl-eo-num">1</span><span>กดปุ่ม <strong>Clicker (C / F5)</strong> เพื่อพรีเซนต์เต็มจอพร้อมซิงค์สไลด์ตามอาจารย์อัตโนมัติ</span></div>
                  <div class="orl-eo-step"><span class="orl-eo-num">2</span><span>ร่วมจับเวลา <strong>Warped Juggle</strong>, ฝึกเขียน <strong>CLD ทีละขั้น</strong> และปรับสไลเดอร์ <strong>En-ROADS</strong></span></div>
                  <div class="orl-eo-step"><span class="orl-eo-num">3</span><span>ร่วมตอบ <strong>Live Concept Check 6 ข้อ</strong> และดาวน์โหลด <code>.pptx</code> / <code>PDF</code></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="orl-cover-foot">
          <button type="button" class="orl-cta-btn is-launch-quiz" data-st1-act="start-slide-2">▶ เริ่มเข้าสู่เนื้อหาสไลด์ที่ 02 &rarr;</button>
          <button type="button" class="orl-cta-btn is-lobby-expand" data-st1-act="jump-quiz">🧠 ไปหน้า Live Quiz (6 ข้อ)</button>
        </div>
      </div>
    `;
  }

  function renderCoverSlideHtml(slide, isHandout) {
    return `
      <div class="or-cover-stage">
        <div class="or-cover-top">
          <span class="or-cover-dept">ภาควิชาเวชศาสตร์ชุมชน · คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล</span>
          <span class="or-cover-code-chip">RACM 303 · ST1 (ปีการศึกษา 2569)</span>
        </div>
        <div class="or-cover-split">
          <div class="or-cover-left-col">
            <div class="or-cover-head-stack">
              <span class="or-cover-kicker">ST1 · พุธ 25 พฤศจิกายน 2569 · 09.30 – 12.00 น. (ต่อเนื่องจาก Orientation)</span>
              <h2 class="or-cover-h1">${esc(slide.title)}</h2>
              <div class="or-top-key-banner is-cover-key"><span class="or-top-key-text">${slide.keyMessageHtml}</span></div>
            </div>
            <div class="or-cover-kpi-row">
              <div class="or-cover-kpi is-io-squircle"><span class="or-cover-kpi-val" data-count-to="2">2</span><span class="or-cover-kpi-lbl">เกมจำลองเชิงระบบ</span></div>
              <div class="or-cover-kpi is-io-squircle"><span class="or-cover-kpi-val" data-count-to="5">5</span><span class="or-cover-kpi-lbl">กติกา Warped Juggle</span></div>
              <div class="or-cover-kpi is-io-squircle"><span class="or-cover-kpi-val" data-count-to="4">4</span><span class="or-cover-kpi-lbl">ระดับภูเขาน้ำแข็ง</span></div>
              <div class="or-cover-kpi is-io-squircle"><span class="or-cover-kpi-val" data-count-to="6">6</span><span class="or-cover-kpi-lbl">ข้อ Live Concept Check</span></div>
            </div>
            <div class="or-cover-acts-grid">
              <div class="or-cover-act-chip"><strong>Act I–II · Warped Juggle &amp; CLD</strong><span>กติกา 5 ข้อ · ฝึกเขียน CLD · Limits to Success &amp; Underinvestment</span></div>
              <div class="or-cover-act-chip"><strong>Act III · Iceberg, Chaordic &amp; CAS</strong><span>ภูเขาน้ำแข็ง 4 ระดับ · Dee Hock · ขอบเขต บริบท &amp; 5 คุณสมบัติ CAS</span></div>
              <div class="or-cover-act-chip"><strong>Act IV · Clinical &amp; ER CLD</strong><span>Stacey Matrix · โรคเรื้อรัง · วงจรอุบาทว์ ER &amp; Realist HPSR</span></div>
              <div class="or-cover-act-chip"><strong>Act V · En-ROADS &amp; Quiz</strong><span>จำลองนโยบายโลกปี 2100 (+1.5°C) · Quiz 6 ข้อ &amp; เชื่อมภาคสนาม</span></div>
            </div>
          </div>
          <div class="or-cover-right-col is-aura-stage">${renderCoverRightCardHtml(isHandout)}</div>
        </div>
        <div class="or-cover-bottom">
          <div class="or-cover-meta-grid">
            <div class="or-cover-meta-item"><span class="or-cover-meta-lbl">สถานที่เรียน</span><span class="or-cover-meta-val">ห้อง 2C2-03 ชั้น 2 อาคารพรีคลินิก (CNMI)</span></div>
            <div class="or-cover-meta-item"><span class="or-cover-meta-lbl">ผู้สอนประจำคาบ</span><span class="or-cover-meta-val">อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์</span></div>
            <div class="or-cover-meta-item"><span class="or-cover-meta-lbl">ผู้ประพันธ์เอกสารคำสอน ST1</span><span class="or-cover-meta-val">ผศ. นพ.บวรศม ลีระพันธ์ · อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์</span></div>
          </div>
          <span class="or-cover-code-chip">${SLIDES.length} Slides · 16:9</span>
        </div>
      </div>
    `;
  }

  function renderSingleSlideCanvasHtml(slide, idx, animateDeck, isHandout) {
    const dirCls = animateDeck ? (state.transitionDir === "prev" ? " is-dir-prev" : " is-dir-next") : "";
    const animCls = animateDeck ? " is-keynote-animated" + dirCls : "";
    const ioTheme = getEffectiveIoTheme();
    if (slide.isCover) {
      return `<article class="or-slide-canvas is-io-pitch is-cover-canvas${animCls}" data-io-theme="${ioTheme}" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">${renderCoverSlideHtml(slide, isHandout)}</article>`;
    }
    return `
      <article class="or-slide-canvas is-io-pitch${slide.isLiveQuizSlide ? " is-quiz-slide-canvas" : ""}${animCls}" data-io-theme="${ioTheme}" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
        <div class="or-sld-inner">
          <header class="or-sld-head">
            <div class="or-sld-eyebrow-row">
              <span class="or-sld-kicker">
                <span class="or-act-badge ${esc(slide.actClass || "")}">${esc(slide.actLabel || slide.sectionLabel)}</span>
                <span>${esc(slide.kicker)}</span>
              </span>
              <span class="or-sld-time-tag">${esc(slide.timeWindow)}</span>
            </div>
            <h2 class="or-sld-title">${esc(slide.title)}</h2>
            <div class="or-top-key-banner"><span class="or-top-key-text">${slide.keyMessageHtml}</span></div>
          </header>
          <div class="or-sld-body">${slide.render()}</div>
        </div>
        <footer class="or-sld-foot">
          <span class="or-sld-foot-course">RACM 303 · ST1: Systems &amp; Systems Thinking (ณัฐวุฒิ เอี่ยงธนรัตน์ · บวรศม ลีระพันธ์)</span>
          <span class="or-sld-foot-num">${String(idx + 1).padStart(2, "0")} / ${SLIDES.length}</span>
        </footer>
      </article>
    `;
  }

  /* ---------- Navigation, Clicker Sub-Steps, Zoom & Fullscreen Stage ---------- */
  function applyZoomToCurrentSlide(prevZoom, focalX, focalY) {
    const vp = document.getElementById("st1DeckViewport");
    if (!vp) return;
    const z = state.zoomScale || 1;
    vp.classList.toggle("is-zoomed", z > 1.02 || z < 0.98);
    document.querySelectorAll("[data-st1-zoom-label]").forEach((el) => { el.textContent = `${Math.round(z * 100)}%`; });
    const sizer = vp.querySelector(".or-slide-zoom-sizer"), canvas = vp.querySelector(".or-slide-canvas");
    if (!sizer || !canvas) return;
    if (Math.abs(z - 1) < 0.025) {
      sizer.style.width = ""; sizer.style.height = ""; canvas.style.transform = ""; canvas.style.transformOrigin = "";
      return;
    }
    canvas.style.transform = "none";
    const baseW = Math.max(240, canvas.offsetWidth), baseH = Math.max(180, canvas.offsetHeight);
    const vpRect = vp.getBoundingClientRect();
    const cx = typeof focalX === "number" ? focalX - vpRect.left : vp.clientWidth * 0.5;
    const cy = typeof focalY === "number" ? focalY - vpRect.top : vp.clientHeight * 0.5;
    const oldZ = prevZoom || 1;
    const contentX = (vp.scrollLeft + cx) / oldZ, contentY = (vp.scrollTop + cy) / oldZ;
    sizer.style.width = `${Math.round(baseW * z)}px`;
    sizer.style.height = `${Math.round(baseH * z)}px`;
    canvas.style.transformOrigin = "0 0";
    canvas.style.transform = `scale(${z.toFixed(3)})`;
    vp.scrollLeft = Math.max(0, Math.round(contentX * z - cx));
    vp.scrollTop = Math.max(0, Math.round(contentY * z - cy));
  }

  function setZoomScale(nextZoom, focalX, focalY) {
    const oldZ = state.zoomScale || 1;
    let clamped = Math.max(0.75, Math.min(3.0, Number(nextZoom) || 1));
    if (Math.abs(clamped - 1) < 0.04) clamped = 1;
    state.zoomScale = clamped;
    applyZoomToCurrentSlide(oldZ, focalX, focalY);
  }

  function goToSlide(idx, initialSubStep) {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, idx));
    state.transitionDir = clamped < state.slideIdx ? "prev" : "next";
    state.slideIdx = clamped;
    state.subStep = typeof initialSubStep === "number" ? Math.max(0, initialSubStep) : 0;
    state.zoomScale = 1;
    state.toolsMenuOpen = false;
    broadcastHostSlide();
    renderModal();
    const vp = document.getElementById("st1DeckViewport");
    if (vp) { vp.scrollTop = 0; vp.scrollLeft = 0; }
  }

  function stepSlide(delta, fromAutoPlay) {
    const d = Number(delta) || 0;
    if (!d) return false;
    const cur = SLIDES[state.slideIdx];
    const maxS = (cur && cur.maxSubSteps) || 1;
    if (d > 0) {
      if (state.subStep < maxS - 1) {
        state.subStep += 1;
        state.transitionDir = "next";
        broadcastHostSlide();
        renderModal();
        return true;
      }
      if (state.slideIdx < SLIDES.length - 1) {
        goToSlide(state.slideIdx + 1, 0);
        return true;
      }
      return false;
    } else {
      if (state.subStep > 0) {
        state.subStep -= 1;
        state.transitionDir = "prev";
        broadcastHostSlide();
        renderModal();
        return true;
      }
      if (state.slideIdx > 0) {
        const prevSld = SLIDES[state.slideIdx - 1];
        const prevMax = !fromAutoPlay && prevSld && prevSld.maxSubSteps ? prevSld.maxSubSteps - 1 : 0;
        goToSlide(state.slideIdx - 1, prevMax);
        return true;
      }
      return false;
    }
  }

  function goToSlideById(slideId) {
    const idx = SLIDES.findIndex((s) => s.id === slideId);
    state.isOpen = true;
    state.viewMode = "deck";
    state.autoPlay = false;
    if (idx >= 0) goToSlide(idx, 0);
    else renderModal();
  }

  function resetHudIdleTimer() {
    const modal = document.getElementById("st1DeckModal");
    if (state.hudIdleTimer) clearTimeout(state.hudIdleTimer);
    if (state.hudIdle) {
      state.hudIdle = false;
      if (modal) modal.classList.remove("is-hud-idle");
    }
    if (!state.isOpen || !state.clickerStage || state.viewMode !== "deck" || state.toolsMenuOpen || state.clickerGuideOpen) return;
    state.hudIdleTimer = setTimeout(() => {
      if (!state.isOpen || !state.clickerStage || state.viewMode !== "deck") return;
      state.hudIdle = true;
      const m = document.getElementById("st1DeckModal");
      if (m) m.classList.add("is-hud-idle");
    }, 2600);
  }

  function toggleClickerStage() {
    const modal = ensureModalElement();
    state.toolsMenuOpen = false;
    state.clickerStage = !state.clickerStage;
    if (state.clickerStage) {
      state.viewMode = "deck";
      state.presentationMode = true;
      modal.classList.add("is-presentation-mode", "is-clicker-stage");
      if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
      resetHudIdleTimer();
    } else {
      state.presentationMode = false;
      state.hudIdle = false;
      modal.classList.remove("is-presentation-mode", "is-clicker-stage", "is-hud-idle");
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
    renderModal();
  }

  function togglePresentationMode() {
    const modal = ensureModalElement();
    state.toolsMenuOpen = false;
    if (!state.presentationMode) {
      if (state.viewMode !== "quiz") state.viewMode = "deck";
      state.presentationMode = true;
      modal.classList.add("is-presentation-mode");
      if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
    } else {
      state.presentationMode = false;
      state.clickerStage = false;
      modal.classList.remove("is-presentation-mode", "is-clicker-stage", "is-hud-idle");
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
    renderModal();
  }

  function wireLaserIfActive(rootEl) {
    if (!state.laserActive) return;
    const canvas = rootEl.querySelector(".or-slide-canvas");
    if (!canvas) return;
    let dot = canvas.querySelector(".or-laser-dot");
    if (!dot) {
      dot = document.createElement("div");
      dot.className = "or-laser-dot";
      dot.hidden = true;
      canvas.appendChild(dot);
    }
    canvas.style.cursor = "crosshair";
    canvas.addEventListener("mousemove", (ev) => {
      const rect = canvas.getBoundingClientRect();
      dot.hidden = false;
      dot.style.left = `${ev.clientX - rect.left}px`;
      dot.style.top = `${ev.clientY - rect.top}px`;
    });
    canvas.addEventListener("mouseleave", () => { dot.hidden = true; });
  }

  function printHandout() {
    state.autoPlay = false;
    state.toolsMenuOpen = false;
    clearAutoPlayTimer();
    const prevMode = state.viewMode;
    state.viewMode = "handout";
    document.body.classList.add("is-printing-st1-deck");
    let pageRule = document.getElementById("st1WidescreenPrintRule");
    if (!pageRule) {
      pageRule = document.createElement("style");
      pageRule.id = "st1WidescreenPrintRule";
      document.head.appendChild(pageRule);
    }
    pageRule.textContent = `
      @page { size: 13.333in 7.5in !important; margin: 0 !important; }
      @media print {
        html, body { width: 13.333in !important; height: 7.5in !important; margin: 0 !important; padding: 0 !important; background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body.is-printing-st1-deck .or-slide-canvas { width: 13.333in !important; height: 7.5in !important; max-width: 13.333in !important; max-height: 7.5in !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; break-after: page; page-break-after: always; }
        body.is-printing-st1-deck .or-slide-canvas:last-child { break-after: auto; page-break-after: auto; }
      }
    `;
    renderModal();
    setTimeout(() => {
      fitAllVisibleCanvases();
      window.print();
      setTimeout(() => {
        document.body.classList.remove("is-printing-st1-deck");
        if (pageRule && pageRule.parentNode) pageRule.parentNode.removeChild(pageRule);
        state.viewMode = prevMode;
        renderModal();
      }, 300);
    }, 180);
  }

  function ensureModalElement() {
    let modal = document.getElementById("st1DeckModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "st1DeckModal";
    modal.className = "or-deck-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "ST1: Systems and Systems Thinking Interactive Master Deck");
    modal.hidden = true;
    document.body.appendChild(modal);

    window.addEventListener("resize", scheduleFitOnResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFitOnResize).catch(() => {});
    modal.addEventListener("mousemove", () => { if (state.clickerStage) resetHudIdleTimer(); }, { passive: true });

    modal.addEventListener("click", (ev) => {
      if (state.blackoutActive) { state.blackoutActive = false; renderModal(); return; }
      if (ev.target === modal && !state.presentationMode && !state.clickerStage) { closeDeck(); return; }
      if (state.toolsMenuOpen && !ev.target.closest(".or-tools-menu-wrap")) {
        state.toolsMenuOpen = false;
        const pop = modal.querySelector(".or-tools-popover");
        if (pop) pop.hidden = true;
      }
      if ((state.clickerStage || state.presentationMode) && state.viewMode === "deck" && Math.abs((state.zoomScale || 1) - 1) < 0.04) {
        const curSlide = SLIDES[state.slideIdx];
        const inInteractive = ev.target && ev.target.closest && ev.target.closest(
          "button, a, input, select, textarea, label, .or-deck-topbar, .or-deck-bottombar, .or-notes-dock, .or-tools-popover, .orl-cover-card, .st1-quiz-stage, .st1-wj-lab-card, .st1-enr-sandbox, .st1-step-bar"
        );
        if (!inInteractive && !(curSlide && curSlide.isLiveQuizSlide)) {
          if (ev.clientX / Math.max(1, window.innerWidth) < 0.22) stepSlide(-1);
          else stepSlide(1);
        }
      }
    });

    let touchStartX = 0, touchStartY = 0, ignoreSwipe = false, hadMultiTouch = false, pinchStartDist = 0, pinchStartZoom = 1;
    let lastTapTime = 0, lastTapX = 0, lastTapY = 0;

    modal.addEventListener("touchstart", (ev) => {
      if (!state.isOpen || (state.viewMode !== "deck" && state.viewMode !== "quiz") || !ev.touches) return;
      if (ev.touches.length >= 2) {
        hadMultiTouch = true; ignoreSwipe = true;
        pinchStartDist = Math.max(20, Math.hypot(ev.touches[1].clientX - ev.touches[0].clientX, ev.touches[1].clientY - ev.touches[0].clientY));
        pinchStartZoom = state.zoomScale || 1;
        return;
      }
      if (ev.touches.length === 1) {
        hadMultiTouch = false;
        touchStartX = ev.touches[0].clientX; touchStartY = ev.touches[0].clientY;
        const inZone = ev.target && ev.target.closest && ev.target.closest(".or-table-wrap, .or-filmstrip, .or-tools-popover, .st1-quiz-stage, .st1-enr-sandbox, input, select, button");
        ignoreSwipe = Boolean(inZone) || (state.zoomScale || 1) > 1.03;
      }
    }, { passive: true });

    modal.addEventListener("touchmove", (ev) => {
      if (!state.isOpen || (state.viewMode !== "deck" && state.viewMode !== "quiz") || !ev.touches) return;
      if (ev.touches.length >= 2 && pinchStartDist > 0) {
        hadMultiTouch = true; ignoreSwipe = true;
        ev.preventDefault();
        const curDist = Math.hypot(ev.touches[1].clientX - ev.touches[0].clientX, ev.touches[1].clientY - ev.touches[0].clientY);
        setZoomScale(pinchStartZoom * (curDist / pinchStartDist), (ev.touches[0].clientX + ev.touches[1].clientX) * 0.5, (ev.touches[0].clientY + ev.touches[1].clientY) * 0.5);
      }
    }, { passive: false });

    modal.addEventListener("touchend", (ev) => {
      if (!state.isOpen || !ev.changedTouches || !ev.changedTouches.length) return;
      if (ev.touches && ev.touches.length > 0) return;
      if (hadMultiTouch) { hadMultiTouch = false; pinchStartDist = 0; return; }
      const t1 = ev.changedTouches[0], dx = t1.clientX - touchStartX, dy = t1.clientY - touchStartY;
      if (Math.abs(dx) < 16 && Math.abs(dy) < 16) {
        const isCtrl = ev.target && ev.target.closest && ev.target.closest("button, a, input, select, .st1-quiz-stage, .or-deck-topbar, .or-deck-bottombar");
        if (!isCtrl && state.viewMode === "deck") {
          const now = Date.now();
          if (now - lastTapTime < 310 && Math.hypot(t1.clientX - lastTapX, t1.clientY - lastTapY) < 36) {
            setZoomScale((state.zoomScale || 1) > 1.08 ? 1 : 1.75, t1.clientX, t1.clientY);
            lastTapTime = 0;
            return;
          }
          lastTapTime = now; lastTapX = t1.clientX; lastTapY = t1.clientY;
        }
      }
      if (state.viewMode !== "deck" || ignoreSwipe || (state.zoomScale || 1) > 1.03) return;
      if (Math.abs(dx) > 58 && Math.abs(dx) > Math.abs(dy) * 1.55) {
        state.autoPlay = false;
        if (dx < 0) stepSlide(1);
        else stepSlide(-1);
      }
    }, { passive: true });

    modal.addEventListener("wheel", (ev) => {
      if (!state.isOpen || (state.viewMode !== "deck" && state.viewMode !== "quiz")) return;
      if (ev.ctrlKey || ev.metaKey) {
        ev.preventDefault();
        setZoomScale((state.zoomScale || 1) * (ev.deltaY < 0 ? 1.12 : 0.89), ev.clientX, ev.clientY);
      }
    }, { passive: false });

    document.addEventListener("keydown", (ev) => {
      if (!state.isOpen || modal.hidden) return;
      const gdpv = document.getElementById("gdrivePdfPreviewModal");
      if (gdpv && !gdpv.hidden) return;
      const tag = (ev.target && ev.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (state.blackoutActive) { ev.preventDefault(); state.blackoutActive = false; renderModal(); return; }

      if (/^[0-9]$/.test(ev.key) && !ev.ctrlKey && !ev.metaKey && !ev.altKey && state.viewMode === "deck") {
        if (ev.key === "0" && !state.jumpDigits && Math.abs((state.zoomScale || 1) - 1) > 0.04) {
          ev.preventDefault(); setZoomScale(1); return;
        }
        ev.preventDefault();
        state.jumpDigits = (state.jumpDigits + ev.key).slice(-2);
        if (state.jumpTimer) clearTimeout(state.jumpTimer);
        state.jumpTimer = setTimeout(() => { state.jumpDigits = ""; renderModal(); }, 1800);
        renderModal();
        return;
      }
      if (ev.key === "Enter" && state.jumpDigits) {
        ev.preventDefault();
        const targetNum = parseInt(state.jumpDigits, 10);
        state.jumpDigits = "";
        if (state.jumpTimer) clearTimeout(state.jumpTimer);
        if (targetNum >= 1 && targetNum <= SLIDES.length) goToSlide(targetNum - 1, 0);
        else renderModal();
        return;
      }

      if (ev.key === "Escape") {
        ev.preventDefault();
        if (state.clickerGuideOpen) { state.clickerGuideOpen = false; renderModal(); }
        else if (state.qrZoomOpen) { state.qrZoomOpen = false; renderModal(); }
        else if (state.toolsMenuOpen) { state.toolsMenuOpen = false; renderModal(); }
        else if (state.clickerStage || state.presentationMode) togglePresentationMode();
        else closeDeck();
      } else if (ev.key === "F5" || ev.key === "c" || ev.key === "C") {
        ev.preventDefault(); toggleClickerStage();
      } else if (ev.key === "." || ev.key === "b" || ev.key === "B") {
        ev.preventDefault(); state.blackoutActive = !state.blackoutActive; renderModal();
      } else if (ev.key === "?") {
        ev.preventDefault(); state.clickerGuideOpen = !state.clickerGuideOpen; renderModal();
      } else if (ev.key === "ArrowRight" || ev.key === "PageDown" || ev.key === " ") {
        if (tag === "BUTTON" && ev.key === " ") ev.target.blur();
        if (state.viewMode === "deck") { ev.preventDefault(); state.autoPlay = false; stepSlide(1); }
      } else if (ev.key === "ArrowLeft" || ev.key === "PageUp") {
        if (state.viewMode === "deck") { ev.preventDefault(); state.autoPlay = false; stepSlide(-1); }
      } else if (ev.key === "Home" && state.viewMode === "deck") {
        ev.preventDefault(); state.autoPlay = false; goToSlide(0, 0);
      } else if (ev.key === "End" && state.viewMode === "deck") {
        ev.preventDefault(); state.autoPlay = false; goToSlide(SLIDES.length - 1, 0);
      } else if (ev.key === "p" || ev.key === "P") {
        ev.preventDefault(); toggleAutoPlay();
      } else if (ev.key === "f" || ev.key === "F") {
        ev.preventDefault(); togglePresentationMode();
      } else if (ev.key === "g" || ev.key === "G") {
        ev.preventDefault(); state.autoPlay = false; state.viewMode = state.viewMode === "sorter" ? "deck" : "sorter"; renderModal();
      } else if (ev.key === "n" || ev.key === "N") {
        ev.preventDefault(); state.showNotes = !state.showNotes; renderModal();
      } else if (ev.key === "l" || ev.key === "L") {
        ev.preventDefault(); state.laserActive = !state.laserActive; renderModal();
      } else if (ev.key === "k" || ev.key === "K") {
        ev.preventDefault(); state.autoPlay = false; state.viewMode = state.viewMode === "quiz" ? "deck" : "quiz"; state.zoomScale = 1; renderModal();
      } else if (ev.key === "t" || ev.key === "T") {
        ev.preventDefault(); toggleIoStageTheme();
      } else if (ev.key === "+" || ev.key === "=") {
        ev.preventDefault(); setZoomScale((state.zoomScale || 1) + 0.25);
      } else if (ev.key === "-" || ev.key === "_") {
        ev.preventDefault(); setZoomScale((state.zoomScale || 1) - 0.25);
      }
    });

    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && (state.presentationMode || state.clickerStage)) {
        state.presentationMode = false; state.clickerStage = false;
        modal.classList.remove("is-presentation-mode", "is-clicker-stage", "is-hud-idle");
        renderModal();
      }
    });

    return modal;
  }

  function renderModal() {
    const modal = ensureModalElement();
    if (!state.isOpen) {
      clearAutoPlayTimer();
      document.body.classList.remove("st1-deck-open");
      modal.hidden = true; modal.innerHTML = "";
      return;
    }
    document.body.classList.add("st1-deck-open");
    modal.hidden = false;
    modal.classList.toggle("is-presentation-mode", state.presentationMode);
    modal.classList.toggle("is-clicker-stage", state.clickerStage);

    const cur = SLIDES[state.slideIdx] || SLIDES[0];
    const showNotesNow = state.viewMode === "deck" && state.showNotes && !state.clickerStage;
    const notesLabel = ROLE === "faculty" ? t("โน้ตผู้สอน", "Presenter Notes") : t("คำอธิบายสไลด์", "Slide Notes");
    const zoomPct = Math.round((state.zoomScale || 1) * 100);
    const effectiveIoTheme = getEffectiveIoTheme();
    const isIoDark = effectiveIoTheme === "dark";

    let answeredCnt = 0;
    QUIZ_ITEMS.forEach((q) => { if (Object.prototype.hasOwnProperty.call(state.quizAnswers, q.id)) answeredCnt += 1; });

    let viewportHtml = "";
    if (state.viewMode === "deck") {
      viewportHtml = `
        ${state.autoPlay ? `<div class="or-autoplay-progress" aria-hidden="true"></div>` : ""}
        <div class="or-slide-frame-wrap"><div class="or-slide-zoom-sizer">${renderSingleSlideCanvasHtml(cur, state.slideIdx, true, false)}</div></div>
      `;
    } else if (state.viewMode === "quiz") {
      viewportHtml = `
        <div class="or-slide-frame-wrap">
          <div class="or-slide-zoom-sizer">
            <article class="or-slide-canvas is-io-pitch is-live-canvas" data-io-theme="${effectiveIoTheme}" aria-label="ST1 Live Interactive Concept Check">
              <div class="or-sld-inner">
                <header class="or-sld-head">
                  <div class="or-sld-eyebrow-row">
                    <span class="or-sld-kicker"><span class="or-act-badge is-act-4">ST1 · LIVE INTERACTIVE CONCEPT CHECK</span><span>6 HIGH-YIELD QUESTIONS · KAHOOT &amp; MQTT SYNC</span></span>
                    <span class="or-sld-time-tag">11.48 – 11.56 น.</span>
                  </div>
                  <h2 class="or-sld-title">ทดสอบความเข้าใจแก่นสำคัญ ST1: Warped Juggle · CLD · Archetypes · CAS · คลินิก · En-ROADS</h2>
                </header>
                <div class="or-sld-body">${renderQuizStageHtml(false)}</div>
              </div>
            </article>
          </div>
        </div>
      `;
    } else if (state.viewMode === "sorter") {
      const visible = SLIDES.map((s, i) => ({ s, i })).filter((x) => state.sorterFilter === "all" || x.s.section === state.sorterFilter);
      viewportHtml = `
        <div class="or-sorter-wrap">
          <div class="or-sorter-filters" role="group">
            ${SECTION_FILTERS.map((f) => `<button type="button" class="or-tool-btn${state.sorterFilter === f.id ? " is-active-toggle" : ""}" data-st1-sfilter="${f.id}">${esc(t(f.labelTh, f.labelEn))}</button>`).join("")}
          </div>
          <div class="or-sorter-grid">
            ${visible.map(({ s, i }) => `
              <button type="button" class="or-sorter-card is-sec-${esc(s.section)}${i === state.slideIdx ? " is-current" : ""}" data-st1-jump="${i}">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">
                  <span class="or-code-pill">Slide ${s.num}</span><span class="or-sorter-time">${esc(s.timeWindow)}</span>
                </div>
                <div class="or-sorter-title">${esc(s.title)}</div>
                <div class="or-sorter-act"><span>${esc(s.actLabel || s.sectionLabel)}${s.maxSubSteps ? ` · ${s.maxSubSteps} Clicker Steps` : ""}</span></div>
              </button>
            `).join("")}
          </div>
        </div>
      `;
    } else {
      viewportHtml = `<div class="or-handout-stack">${SLIDES.map((s, i) => renderSingleSlideCanvasHtml(s, i, false, true)).join("")}</div>`;
    }

    const qrOverlayHtml = state.qrZoomOpen
      ? `<div class="orl-aux-backdrop" id="st1QrZoomBackdrop" style="position:fixed;inset:0;z-index:1900;background:rgba(10,15,28,0.82);display:flex;align-items:center;justify-content:center;padding:20px"><div style="background:#ffffff;color:#0f172a;border-radius:24px;padding:26px 32px;max-width:460px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.45);display:flex;flex-direction:column;gap:14px;align-items:center"><div style="font-weight:800;font-size:18px;color:#1d4ed8">📱 สแกนซิงค์สไลด์สดคาบ ST1: Systems &amp; Systems Thinking</div><div style="width:280px;max-width:100%">${buildQrSvg(PROD_STUDENT_DECK_URL)}</div><code style="background:#eff6ff;color:#1e40af;padding:6px 14px;border-radius:999px;font-weight:700;font-size:14px">smartwoo.github.io/racm303-2569-student/#st1</code><button type="button" class="or-tool-btn is-primary" id="st1CloseQrZoomBtn" style="padding:0 22px;height:38px">ปิดหน้าต่าง QR (Esc)</button></div></div>`
      : "";

    const clickerGuideHtml = state.clickerGuideOpen
      ? `<div class="orl-aux-backdrop" id="st1ClickerGuideBackdrop" style="position:fixed;inset:0;z-index:1950;background:rgba(10,15,28,0.82);display:flex;align-items:center;justify-content:center;padding:20px"><div style="background:#ffffff;color:#0f172a;border-radius:24px;padding:24px 28px;max-width:540px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.45);display:flex;flex-direction:column;gap:12px"><div style="font-weight:800;font-size:18px;color:#1d4ed8">🎛️ คู่มือปุ่มลัด &amp; Wireless Clicker (โหมดเดียวกับ Orientation)</div><div style="font-size:14px;line-height:1.6;color:#334155">• <strong>Space / → / PageDown / คลิกขวาของจอ:</strong> เลื่อน Sub-step ของ CLD ถัดไป หรือไปสไลด์หน้าถัดไป<br>• <strong>← / PageUp / คลิกซ้ายของจอ:</strong> ย้อนกลับ Sub-step หรือสไลด์ก่อนหน้า<br>• <strong>C หรือ F5:</strong> เปิด/ปิด <strong>Keynote Clicker Stage</strong> (เต็มจอ + ซ่อนแถบเครื่องมืออัตโนมัติ)<br>• <strong>B หรือ . (จุด):</strong> จอดำพักสายตาห้องเรียน (Blackout Curtain)<br>• <strong>พิมพ์เลข 01–31 แล้วกด Enter:</strong> กระโดดไปสไลด์หน้านั้นทันที · <strong>K:</strong> Live Quiz · <strong>L:</strong> เลเซอร์</div><div style="text-align:right"><button type="button" class="or-tool-btn is-primary" id="st1CloseClickerGuideBtn">เข้าใจแล้ว</button></div></div></div>`
      : "";

    modal.setAttribute("data-io-theme", effectiveIoTheme);
    modal.innerHTML = `
      <div class="or-deck-shell is-io-deck${showNotesNow ? " has-notes-open" : ""}" data-io-theme="${effectiveIoTheme}">
        <div class="or-deck-topbar">
          <div class="or-top-left">
            <span class="or-code-pill is-io-brand-pill">ST1</span>
            <div class="or-top-title-wrap">
              <span class="or-top-title">${esc(t("ST1: Systems & Systems Thinking · Master Interactive Deck", "ST1: Systems & Systems Thinking · RACM 303"))}</span>
              <span class="or-top-sub">พุธ 25 พ.ย. 2569 · 09.30 – 12.00 น. · ห้อง 2C2-03 · อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์</span>
            </div>
          </div>

          <div class="or-top-center" role="tablist">
            <button type="button" class="or-mode-btn${state.viewMode === "deck" ? " is-active" : ""}" data-st1-vmode="deck">${SVG.slides} <span>Slide</span></button>
            <button type="button" class="or-mode-btn is-live-tab${state.viewMode === "quiz" ? " is-active" : ""}" data-st1-vmode="quiz"><span class="or-live-tab-dot"></span><span>Live Quiz (${answeredCnt}/${QUIZ_ITEMS.length})</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "sorter" ? " is-active" : ""}" data-st1-vmode="sorter">${SVG.grid} <span>Sorter</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "handout" ? " is-active" : ""}" data-st1-vmode="handout">${SVG.handout} <span>Handout</span></button>
          </div>

          <div class="or-top-right">
            <div class="or-desktop-tools">
              <button type="button" class="or-tool-btn${state.clickerStage ? " is-active-toggle" : ""}" id="st1ClickerStageBtn" title="Keynote Clicker Stage (C/F5)">${SVG.clicker} <span>Clicker</span></button>
              <button type="button" class="or-tool-btn is-io-theme-toggle" id="st1IoThemeBtn"><span>${isIoDark ? "🌙 Dark" : "☀️ Light"}</span></button>
              ${ROLE === "faculty" ? `<button type="button" class="or-timer-pill${state.timerRunning && state.timerSeconds <= SESSION_LIMIT_SEC ? " is-running" : ""}${state.timerSeconds > SESSION_LIMIT_SEC ? " is-overtime" : ""}" id="st1TimerBtn" data-st1-timer-display>${formatTimer(state.timerSeconds)}</button>` : ""}
              <button type="button" class="or-tool-btn${state.showNotes ? " is-active-toggle" : ""}" id="st1ToggleNotesBtn">${SVG.notes} <span>${esc(notesLabel)}</span></button>
              <a class="or-tool-btn" href="${PPTX_HREF}" download="RACM303_2569_ST1_Slides.pptx">${SVG.download} <span>.pptx</span></a>
              <a class="or-tool-btn" href="${PDF_HREF}" download="RACM303_2569_ST1_Slides.pdf">${SVG.download} <span>PDF</span></a>
              <button type="button" class="or-tool-btn" id="st1PrintBtn">${SVG.print}</button>
              <button type="button" class="or-tool-btn" id="st1HelpBtn" title="คู่มือปุ่มลัด Clicker (?)">?</button>
            </div>

            <div class="or-tools-menu-wrap">
              <button type="button" class="or-tool-btn or-compact-more-btn${state.toolsMenuOpen ? " is-active-toggle" : ""}" id="st1MoreToolsBtn">${SVG.more}</button>
              <div class="or-tools-popover" ${state.toolsMenuOpen ? "" : "hidden"}>
                <button type="button" class="or-pop-item" id="st1PopClickerBtn">${SVG.clicker} <span>Keynote Clicker Stage (C/F5)</span></button>
                <button type="button" class="or-pop-item" id="st1PopIoThemeBtn"><span>${isIoDark ? "☀️ โหมด Clean Light" : "🌙 โหมด Cinema Dark"}</span></button>
                <button type="button" class="or-pop-item${state.autoPlay ? " is-active" : ""}" id="st1PopAutoPlayBtn">${state.autoPlay ? SVG.pause : SVG.play} <span>Auto-Play (P)</span></button>
                <button type="button" class="or-pop-item${state.showNotes ? " is-active" : ""}" id="st1PopNotesBtn">${SVG.notes} <span>${esc(notesLabel)}</span></button>
                <a class="or-pop-item" href="${PPTX_HREF}" download="RACM303_2569_ST1_Slides.pptx">${SVG.download} <span>ดาวน์โหลด PowerPoint (.pptx)</span></a>
                <a class="or-pop-item" href="${PDF_HREF}" download="RACM303_2569_ST1_Slides.pdf">${SVG.download} <span>ดาวน์โหลดสไลด์ PDF</span></a>
                <button type="button" class="or-pop-item" id="st1PopPrintBtn">${SVG.print} <span>สั่งพิมพ์ (Print)</span></button>
              </div>
            </div>

            <button type="button" class="or-tool-btn is-primary or-present-btn" id="st1PresentBtn">${SVG.fullscreen} <span class="or-present-lbl">${esc(state.presentationMode ? t("ออกเต็มจอ", "Exit") : t("เต็มจอ", "Present"))}</span></button>
            <button type="button" class="or-tool-btn is-close" id="st1CloseBtn" aria-label="ปิด">&times;</button>
          </div>
        </div>

        <div class="or-deck-viewport${state.viewMode !== "deck" && state.viewMode !== "quiz" ? " is-scrollable-mode" : ""}" id="st1DeckViewport">${viewportHtml}</div>

        ${
          showNotesNow
            ? `<div class="or-notes-dock"><div style="min-width:0;flex:1"><div class="or-notes-kicker">${esc(cur.timeWindow)} · ST1 PRESENTER &amp; FACILITATOR GUIDE</div><p class="or-notes-text">${esc(cur.notes)}</p></div><button type="button" class="or-tool-btn or-laser-toggle${state.laserActive ? " is-active-toggle" : ""}" id="st1LaserBtn">Laser (L)</button></div>`
            : ""
        }

        ${
          state.viewMode === "deck" || state.viewMode === "quiz"
            ? `
          <div class="or-deck-bottombar">
            <div class="or-nav-cluster">
              ${
                state.viewMode === "deck"
                  ? `<button type="button" class="or-tool-btn or-prevnext-btn" id="st1PrevBtn" ${state.slideIdx === 0 && state.subStep === 0 ? "disabled" : ""}>&larr; <span class="or-nav-word">${esc(t("ก่อนหน้า", "Prev"))}</span></button><select class="or-slide-select" id="st1SlideSelect">${SLIDES.map((s, i) => `<option value="${i}" ${i === state.slideIdx ? "selected" : ""}>${s.num}/${SLIDES.length} · ${esc(s.title)}</option>`).join("")}</select><button type="button" class="or-tool-btn is-primary or-prevnext-btn" id="st1NextBtn" ${state.slideIdx === SLIDES.length - 1 && state.subStep >= ((cur.maxSubSteps || 1) - 1) ? "disabled" : ""}><span class="or-nav-word">${esc(t("ถัดไป", "Next"))}</span> &rarr;</button>`
                  : `<button type="button" class="or-tool-btn is-primary" id="st1BackToSlidesBtn">&larr; กลับไปยังสไลด์ (${cur.num}/${SLIDES.length})</button>`
              }
            </div>
            <div class="or-zoom-sync-cluster">
              ${ROLE === "student" ? `<button type="button" class="or-follow-pill${state.followHost ? " is-on" : ""}" id="st1FollowLiveBtn">📡 ${state.followHost ? "ซิงค์สด On" : "ซิงค์สด Off"}</button>` : `<span class="or-mini-chip">📡 Host Sync${cur.maxSubSteps ? ` · Step ${state.subStep + 1}/${cur.maxSubSteps}` : ""}</span>`}
              <div class="or-zoom-pill"><button type="button" class="or-zoom-btn" id="st1ZoomOutBtn">&minus;</button><button type="button" class="or-zoom-lbl" id="st1ZoomResetBtn" data-st1-zoom-label>${zoomPct}%</button><button type="button" class="or-zoom-btn" id="st1ZoomInBtn">&#43;</button></div>
            </div>
            ${state.viewMode === "deck" ? `<div class="or-filmstrip">${SLIDES.map((s, i) => `<button type="button" class="or-film-dot${i === state.slideIdx ? " is-active" : ""}${s.isLiveQuizSlide ? " is-quiz-dot" : ""}" data-st1-jump="${i}" title="${s.num}. ${esc(s.title)}">${s.num}</button>`).join("")}</div>` : ""}
          </div>
        `
            : ""
        }
      </div>
      ${qrOverlayHtml}
      ${clickerGuideHtml}
      ${state.blackoutActive ? `<div class="st1-blackout-curtain">จอดำพักการบรรยาย (แตะหน้าจอหรือกดปุ่มใดก็ได้บน Clicker เพื่อกลับมาแสดงสไลด์ต่อ)</div>` : ""}
      ${state.jumpDigits ? `<div class="st1-jump-pill">ไปที่สไลด์: ${esc(state.jumpDigits)} (กด Enter)</div>` : ""}
    `;

    modal.querySelectorAll("[data-st1-vmode]").forEach((btn) => {
      btn.addEventListener("click", () => { state.viewMode = btn.dataset.st1Vmode; state.toolsMenuOpen = false; state.zoomScale = 1; if (state.viewMode !== "deck") state.autoPlay = false; renderModal(); });
    });
    modal.querySelectorAll("[data-st1-sfilter]").forEach((btn) => {
      btn.addEventListener("click", () => { state.sorterFilter = btn.dataset.st1Sfilter; renderModal(); });
    });
    modal.querySelectorAll("[data-st1-jump]").forEach((btn) => {
      btn.addEventListener("click", () => { state.autoPlay = false; state.toolsMenuOpen = false; state.viewMode = "deck"; goToSlide(Number(btn.dataset.st1Jump) || 0, 0); });
    });
    modal.querySelectorAll("[data-st1-substep]").forEach((btn) => {
      btn.addEventListener("click", (ev) => { ev.stopPropagation(); state.subStep = Math.max(0, Number(btn.dataset.st1Substep) || 0); broadcastHostSlide(); renderModal(); });
    });
    modal.querySelectorAll("[data-st1-act]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const act = btn.dataset.st1Act;
        if (act === "show-cover-hero") { state.coverPaneMode = "hero"; renderModal(); }
        else if (act === "show-cover-lobby") { state.coverPaneMode = "lobby"; renderModal(); }
        else if (act === "zoom-qr") { state.qrZoomOpen = true; renderModal(); }
        else if (act === "start-slide-2") goToSlide(1, 0);
        else if (act === "jump-quiz") goToSlideById("s30-live-quiz");
        else if (act === "toggle-debrief-key") { state.debriefRevealed = !state.debriefRevealed; renderModal(); }
      });
    });

    modal.querySelectorAll("[data-st1-wj]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const act = btn.dataset.st1Wj;
        if (act === "toggle") {
          if (!state.wjRunning) {
            state.wjRunning = true; state.wjStartPerf = performance.now() - state.wjElapsedMs;
            renderModal(); state.wjRaf = requestAnimationFrame(tickWjClock);
          } else {
            state.wjRunning = false; if (state.wjRaf) cancelAnimationFrame(state.wjRaf);
            const finalSec = +(state.wjElapsedMs / 1000).toFixed(1);
            if (finalSec >= 0.3) state.wjRounds.push(finalSec);
            state.wjElapsedMs = 0; renderModal();
          }
        } else if (act === "drop") {
          if (!state.wjRunning) {
            state.wjRunning = true; state.wjStartPerf = performance.now() - state.wjElapsedMs;
            renderModal(); state.wjRaf = requestAnimationFrame(tickWjClock);
          }
        } else if (act === "reset") {
          state.wjRunning = false; if (state.wjRaf) cancelAnimationFrame(state.wjRaf);
          state.wjElapsedMs = 0; state.wjRounds = []; renderModal();
        }
      });
    });

    modal.querySelectorAll("[data-st1-enr]").forEach((inp) => {
      inp.addEventListener("input", (ev) => {
        ev.stopPropagation();
        const k = inp.dataset.st1Enr;
        state.enrSliders[k] = Number(inp.value) || 0;
        const pctEl = modal.querySelector(`[data-enr-pct="${k}"]`);
        if (pctEl) pctEl.textContent = `${state.enrSliders[k]}%`;
        const proj = computeEnroadsProjection();
        const tEl = document.getElementById("st1EnrTempVal");
        if (tEl) {
          tEl.textContent = `+${proj.temp.toFixed(1)}°C`;
          tEl.className = `st1-enr-temp-big ${proj.temp <= 1.7 ? "is-safe" : proj.temp <= 2.4 ? "is-warm" : "is-hot"}`;
        }
      });
      inp.addEventListener("change", () => renderModal());
    });
    modal.querySelectorAll("[data-st1-enr-preset]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const p = btn.dataset.st1EnrPreset;
        if (p === "single") state.enrSliders = { energy: 0, transport: 0, buildings: 0, growth: 0, land: 0, removal: 100 };
        else if (p === "portfolio") state.enrSliders = { energy: 90, transport: 85, buildings: 85, growth: 60, land: 85, removal: 80 };
        else state.enrSliders = { energy: 0, transport: 0, buildings: 0, growth: 0, land: 0, removal: 0 };
        renderModal();
      });
    });

    const qrBackdrop = document.getElementById("st1QrZoomBackdrop");
    if (qrBackdrop) qrBackdrop.addEventListener("click", (ev) => { if (ev.target === qrBackdrop) { state.qrZoomOpen = false; renderModal(); } });
    const closeQrBtn = document.getElementById("st1CloseQrZoomBtn");
    if (closeQrBtn) closeQrBtn.addEventListener("click", () => { state.qrZoomOpen = false; renderModal(); });
    const cgBackdrop = document.getElementById("st1ClickerGuideBackdrop");
    if (cgBackdrop) cgBackdrop.addEventListener("click", (ev) => { if (ev.target === cgBackdrop) { state.clickerGuideOpen = false; renderModal(); } });
    const closeCgBtn = document.getElementById("st1CloseClickerGuideBtn");
    if (closeCgBtn) closeCgBtn.addEventListener("click", () => { state.clickerGuideOpen = false; renderModal(); });

    modal.querySelectorAll("[data-st1-qjump]").forEach((btn) => {
      btn.addEventListener("click", (ev) => { ev.stopPropagation(); state.quizIdx = Math.max(0, Math.min(QUIZ_ITEMS.length - 1, Number(btn.dataset.st1Qjump) || 0)); broadcastHostSlide(); renderModal(); });
    });
    modal.querySelectorAll("[data-st1-qpick]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const curQ = QUIZ_ITEMS[state.quizIdx];
        if (!curQ) return;
        const cIdx = Number(btn.dataset.st1Qpick);
        state.quizAnswers[curQ.id] = cIdx;
        try { localStorage.setItem("racm303_st1_deck_quiz_v2", JSON.stringify(state.quizAnswers)); } catch (_) {}
        broadcastStudentVote(curQ.id, cIdx);
        renderModal();
      });
    });
    modal.querySelectorAll("[data-st1-qact]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const act = btn.dataset.st1Qact, curQ = QUIZ_ITEMS[state.quizIdx];
        if (act === "toggle-reveal" && curQ) { state.facultyRevealMap[curQ.id] = !state.facultyRevealMap[curQ.id]; renderModal(); }
        else if (act === "reset-quiz") { state.quizAnswers = {}; state.facultyRevealMap = {}; state.quizIdx = 0; try { localStorage.removeItem("racm303_st1_deck_quiz_v2"); } catch (_) {} renderModal(); }
        else if (act === "goto-final-slide") { state.viewMode = "deck"; goToSlide(SLIDES.length - 1, 0); }
      });
    });

    ["st1ClickerStageBtn", "st1PopClickerBtn"].forEach((id) => { const b = document.getElementById(id); if (b) b.addEventListener("click", toggleClickerStage); });
    ["st1IoThemeBtn", "st1PopIoThemeBtn"].forEach((id) => { const b = document.getElementById(id); if (b) b.addEventListener("click", toggleIoStageTheme); });
    const tBtn = document.getElementById("st1TimerBtn");
    if (tBtn) { tBtn.addEventListener("click", toggleTimer); tBtn.addEventListener("dblclick", (ev) => { ev.preventDefault(); resetTimer(); }); }
    const apBtn = document.getElementById("st1PopAutoPlayBtn");
    if (apBtn) apBtn.addEventListener("click", toggleAutoPlay);
    ["st1ToggleNotesBtn", "st1PopNotesBtn"].forEach((id) => { const b = document.getElementById(id); if (b) b.addEventListener("click", () => { state.showNotes = !state.showNotes; state.toolsMenuOpen = false; renderModal(); }); });
    ["st1PrintBtn", "st1PopPrintBtn"].forEach((id) => { const b = document.getElementById(id); if (b) b.addEventListener("click", printHandout); });
    const helpBtn = document.getElementById("st1HelpBtn");
    if (helpBtn) helpBtn.addEventListener("click", () => { state.clickerGuideOpen = !state.clickerGuideOpen; renderModal(); });
    const moreBtn = document.getElementById("st1MoreToolsBtn");
    if (moreBtn) moreBtn.addEventListener("click", (ev) => { ev.stopPropagation(); state.toolsMenuOpen = !state.toolsMenuOpen; renderModal(); });
    const laserBtn = document.getElementById("st1LaserBtn");
    if (laserBtn) laserBtn.addEventListener("click", () => { state.laserActive = !state.laserActive; renderModal(); });
    const presentBtn = document.getElementById("st1PresentBtn");
    if (presentBtn) presentBtn.addEventListener("click", togglePresentationMode);
    const closeBtn = document.getElementById("st1CloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeDeck);
    const prevBtn = document.getElementById("st1PrevBtn");
    if (prevBtn) prevBtn.addEventListener("click", () => { state.autoPlay = false; stepSlide(-1); });
    const nextBtn = document.getElementById("st1NextBtn");
    if (nextBtn) nextBtn.addEventListener("click", () => { state.autoPlay = false; stepSlide(1); });
    const sel = document.getElementById("st1SlideSelect");
    if (sel) sel.addEventListener("change", () => { state.autoPlay = false; goToSlide(Number(sel.value) || 0, 0); });
    const backToSlidesBtn = document.getElementById("st1BackToSlidesBtn");
    if (backToSlidesBtn) backToSlidesBtn.addEventListener("click", () => { state.viewMode = "deck"; state.zoomScale = 1; renderModal(); });
    const zoomOutBtn = document.getElementById("st1ZoomOutBtn");
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => setZoomScale((state.zoomScale || 1) - 0.25));
    const zoomInBtn = document.getElementById("st1ZoomInBtn");
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => setZoomScale((state.zoomScale || 1) + 0.25));
    const zoomResetBtn = document.getElementById("st1ZoomResetBtn");
    if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => setZoomScale(1));
    const followBtn = document.getElementById("st1FollowLiveBtn");
    if (followBtn) followBtn.addEventListener("click", () => { state.followHost = !state.followHost; renderModal(); });

    fitAllVisibleCanvases();
    applyZoomToCurrentSlide(1);
    wireImageLoadRefit(modal);
    wireLaserIfActive(modal);
    if (cur.isCover) animateCoverKpis(modal);
    scheduleAutoPlayTick();
  }

  function openDeck(initialSlideIdx, opts) {
    preloadAllSt1Images();
    ensureMqttConnected();
    const o = opts || {};
    state.isOpen = true; state.toolsMenuOpen = false; state.qrZoomOpen = false;
    if (typeof initialSlideIdx === "number" && !Number.isNaN(initialSlideIdx)) {
      state.slideIdx = Math.max(0, Math.min(SLIDES.length - 1, initialSlideIdx));
      state.subStep = 0;
    }
    state.viewMode = o.viewMode || "deck";
    if (o.coverPaneMode) state.coverPaneMode = o.coverPaneMode;
    if (o.presentationMode) state.presentationMode = true;
    broadcastHostSlide();
    renderModal();
    if (o.presentationMode) {
      const modal = ensureModalElement();
      if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
    }
  }

  function closeDeck() {
    state.isOpen = false; state.autoPlay = false; state.wjRunning = false;
    if (state.wjRaf) cancelAnimationFrame(state.wjRaf);
    state.toolsMenuOpen = false; state.qrZoomOpen = false; state.clickerStage = false; state.blackoutActive = false;
    clearAutoPlayTimer();
    document.body.classList.remove("st1-deck-open");
    if (state.presentationMode) {
      state.presentationMode = false;
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
    const modal = document.getElementById("st1DeckModal");
    if (modal) {
      modal.hidden = true;
      modal.classList.remove("is-presentation-mode", "is-clicker-stage", "is-hud-idle");
      modal.innerHTML = "";
    }
    const h = (window.location.hash || "").replace(/^#/, "");
    if (h === "st1" || h === "st1-slides" || h === "st1-quiz") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  window.RACM_ST1_DECK = {
    open: openDeck,
    close: closeDeck,
    goToSlide,
    goToSlideById,
    stepSlide,
    setZoomScale,
    toggleAutoPlay,
    toggleClickerStage,
    fitAllVisibleCanvases,
    getSlides: () => SLIDES,
    getQuizItems: () => QUIZ_ITEMS,
    pptxHref: PPTX_HREF,
    pdfHref: PDF_HREF
  };

  function checkUrlAutoOpen() {
    const params = new URLSearchParams(window.location.search);
    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (params.get("page") === "st1" || params.get("st1_print") === "1" || h === "st1" || h === "st1-slides" || h === "st1-quiz") {
      setTimeout(() => {
        openDeck(h === "st1-quiz" ? SLIDES.length - 2 : 0, {
          viewMode: params.get("st1_print") === "1" ? "handout" : "deck"
        });
      }, 60);
    }
  }

  window.addEventListener("hashchange", checkUrlAutoOpen);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", checkUrlAutoOpen);
  else checkUrlAutoOpen();
})();
