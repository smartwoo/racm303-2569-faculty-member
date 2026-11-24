/* ==========================================================================
   RACM 303 (2569) — ST1: Systems & Systems Thinking
   16-Slide 16:9 Widescreen Minimalist Keynote Deck + Live Slide Sync & Quiz
   Authors: ผศ. นพ.บวรศม ลีระพันธ์ · อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์
   Session: วันพุธที่ 25 พฤศจิกายน 2569 · 09.30 – 12.00 น. · ห้อง 2C2-03
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const ASSET_VER = "20261124st1deck1";
  const PPTX_HREF = `exports/pptx/RACM303_2569_ST1_Slides.pptx?v=${ASSET_VER}`;
  const PDF_HREF = `exports/pdf/RACM303_2569_ST1_Slides.pdf?v=${ASSET_VER}`;
  const IMG_DIR = "assets/images/st1";
  const AUTOPLAY_MS = 9500;
  const SESSION_LIMIT_SEC = 150 * 60; // 2.5 hours (150 minutes)

  const PROD_STUDENT_DECK_URL = "https://smartwoo.github.io/racm303-2569-student/#st1";
  const PROD_FACULTY_DECK_URL = "https://smartwoo.github.io/racm303-2569-faculty-member/#st1";
  const SYNC_BC_NAME = "racm303_st1_deck_sync_v1";
  const MQTT_TOPIC = "racm303/2569/st1_deck_sync/v1";

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
      return JSON.parse(localStorage.getItem("racm303_st1_deck_quiz_v1") || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  const state = {
    isOpen: false,
    slideIdx: 0,
    viewMode: "deck", // "deck" | "quiz" | "sorter" | "handout"
    ioStageTheme: loadIoStageTheme(),
    hasManualIoTheme: false,
    coverPaneMode: "lobby", // "lobby" | "hero"
    qrZoomOpen: false,
    zoomScale: 1,
    sorterFilter: "all",
    presentationMode: false,
    showNotes: ROLE === "faculty" && window.innerWidth >= 1024 && window.innerHeight >= 620,
    toolsMenuOpen: false,
    laserActive: false,
    autoPlay: false,
    autoPlayTimeout: null,
    timerRunning: false,
    timerSeconds: 0,
    timerInterval: null,
    followHost: ROLE === "student",
    quizIdx: 0,
    quizAnswers: loadSavedQuizAnswers(), // { [qId]: choiceIdx }
    facultyRevealMap: {}, // { [qId]: boolean }
    resizeRaf: 0
  };

  /* ---------- Pure-JS ISO/IEC 18004 QR Code SVG Generator (Versions 1..10, ECC-M) ---------- */
  const QR_ECC_M = [
    null,
    [10, 1, 16, 0, 0],
    [16, 1, 28, 0, 0],
    [26, 1, 44, 0, 0],
    [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0],
    [18, 4, 31, 0, 0],
    [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37],
    [26, 4, 43, 1, 44]
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
      for (let j = 0; j < degree; j += 1) {
        rem[j] ^= gfMul(poly[j + 1], factor);
      }
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
      for (let i = 0; i < maxDLen; i += 1) {
        blocks.forEach((b) => {
          if (i < b.length) interleaved.push(b[i]);
        });
      }
      for (let i = 0; i < ecPerBlock; i += 1) {
        ecs.forEach((e) => interleaved.push(e[i]));
      }
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
            const r = r0 + dy;
            const c = c0 + dx;
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
          const ar = aligns[i];
          const ac = aligns[j];
          if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) continue;
          for (let dy = -2; dy <= 2; dy += 1) {
            for (let dx = -2; dx <= 2; dx += 1) {
              setMod(ar + dy, ac + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
            }
          }
        }
      }
      for (let i = 0; i < 9; i += 1) {
        if (i !== 6) {
          isFunc[8][i] = true;
          isFunc[i][8] = true;
        }
      }
      for (let i = 0; i < 8; i += 1) {
        isFunc[8][size - 1 - i] = true;
        isFunc[size - 1 - i][8] = true;
      }
      setMod(size - 8, 8, true);

      const streamBits = [];
      interleaved.forEach((byte) => {
        for (let b = 7; b >= 0; b -= 1) streamBits.push((byte >>> b) & 1);
      });
      let bIdx = 0;
      let upward = true;
      for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let v = 0; v < size; v += 1) {
          const r = upward ? size - 1 - v : v;
          for (let j = 0; j < 2; j += 1) {
            const c = right - j;
            if (!isFunc[r][c]) {
              const bit = bIdx < streamBits.length ? streamBits[bIdx] : 0;
              bIdx += 1;
              const mask = (r + c) % 2 === 0;
              mat[r][c] = bit ^ (mask ? 1 : 0);
            }
          }
        }
        upward = !upward;
      }
      // Format info for ECC-M (00) + Mask 0 (000) => 0x5412 ^ 0x0 = 101010000010010
      const fmt = 0b101010000010010;
      const fmtBits = [];
      for (let i = 0; i < 15; i += 1) fmtBits.push((fmt >>> i) & 1);
      for (let i = 0; i <= 5; i += 1) mat[8][i] = fmtBits[14 - i];
      mat[8][7] = fmtBits[8];
      mat[8][8] = fmtBits[7];
      mat[7][8] = fmtBits[6];
      for (let i = 9; i < 15; i += 1) mat[14 - i][8] = fmtBits[14 - i];
      for (let i = 0; i < 8; i += 1) mat[size - 1 - i][8] = fmtBits[14 - i];
      for (let i = 8; i < 15; i += 1) mat[8][size - 15 + i] = fmtBits[14 - i];

      const margin = 2;
      const vb = size + margin * 2;
      let d = "";
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          if (mat[r][c]) d += `M${c + margin},${r + margin}h1v1h-1z`;
        }
      }
      return `<svg class="orl-qr-svg${extraCls ? " " + extraCls : ""}" viewBox="0 0 ${vb} ${vb}" shape-rendering="crispEdges" role="img" aria-label="QR Code สำหรับเปิดสไลด์ ST1"><rect width="${vb}" height="${vb}" fill="#ffffff" rx="2"/><path d="${d}" fill="#0f172a"/></svg>`;
    } catch (_) {
      return "";
    }
  }

  /* ---------- Cross-Tab & Live Classroom Slide Sync ---------- */
  let bcChannel = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      bcChannel = new BroadcastChannel(SYNC_BC_NAME);
      bcChannel.onmessage = (ev) => {
        const msg = ev && ev.data;
        if (!msg || msg.type !== "st1_host_slide") return;
        if (state.isOpen && state.followHost && ROLE === "student" && state.viewMode === "deck") {
          const nextIdx = Math.max(0, Math.min(SLIDES.length - 1, Number(msg.slideIdx) || 0));
          if (nextIdx !== state.slideIdx) {
            state.slideIdx = nextIdx;
            state.zoomScale = 1;
            renderModal();
          }
        }
      };
    }
  } catch (_) {}

  function broadcastHostSlide() {
    if (ROLE !== "faculty") return;
    const payload = { type: "st1_host_slide", slideIdx: state.slideIdx, ts: Date.now(), topic: MQTT_TOPIC };
    try {
      if (bcChannel) bcChannel.postMessage(payload);
    } catch (_) {}
  }

  function getEffectiveIoTheme() {
    if (document.body.classList.contains("is-printing-st1-deck") || state.viewMode === "handout") {
      return "light";
    }
    return state.ioStageTheme === "dark" ? "dark" : "light";
  }

  function resolveSlideImgFile(fileName) {
    const clean = String(fileName || "");
    if (getEffectiveIoTheme() === "dark" && clean.endsWith(".png") && !clean.endsWith("_dark.png")) {
      return clean.replace(/\.png$/, "_dark.png");
    }
    return clean;
  }

  function toggleIoStageTheme() {
    state.ioStageTheme = state.ioStageTheme === "dark" ? "light" : "dark";
    state.hasManualIoTheme = true;
    try {
      localStorage.setItem("racm303_io_clean_theme", state.ioStageTheme);
    } catch (_) {}
    state.toolsMenuOpen = false;
    renderModal();
  }

  if (typeof MutationObserver !== "undefined" && document.documentElement) {
    const htmlObs = new MutationObserver(() => {
      if (!state.hasManualIoTheme) {
        const portalDark = document.documentElement.getAttribute("data-theme") === "dark";
        const nextT = portalDark ? "dark" : "light";
        if (state.ioStageTheme !== nextT) {
          state.ioStageTheme = nextT;
          if (state.isOpen) renderModal();
        }
      }
    });
    htmlObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
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
    const stems = [
      "st1_s01_hero.png",
      "st1_fig1_system_ipo.png",
      "st1_fig2_system_contexts.png",
      "st1_fig3_stacey_matrix.png",
      "st1_fig4_er_crowding_cld.png",
      "st1_fig5_blind_men_elephant.png",
      "st1_fig6_iceberg_model.png",
      "st1_s07_metaphors.png"
    ];
    stems.forEach((f) => {
      [f, f.replace(/\.png$/, "_dark.png")].forEach((variant) => {
        const url = `${IMG_DIR}/${variant}?v=${ASSET_VER}`;
        if (preloadedSet.has(url)) return;
        preloadedSet.add(url);
        const im = new Image();
        im.decoding = "sync";
        im.src = url;
      });
    });
  }

  function figPlate(fileName, altText, captionHtml, badgeText) {
    const resolved = resolveSlideImgFile(fileName);
    return `
      <figure class="or-fig-plate is-st1-plate">
        ${badgeText ? `<div class="or-fig-top-badge">${esc(badgeText)}</div>` : ""}
        <div class="or-fig-img-wrap">
          <img class="or-fig-img" data-base-img="${esc(fileName)}" src="${IMG_DIR}/${esc(resolved)}?v=${ASSET_VER}" alt="${esc(altText)}" loading="eager" decoding="sync" />
        </div>
        ${captionHtml ? `<figcaption class="or-fig-cap">${captionHtml}</figcaption>` : ""}
      </figure>
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
    more: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`
  };

  /* ---------- 5 Interactive Concept-Check MCQs for ST1 ---------- */
  const QUIZ_ITEMS = [
    {
      id: "st1_q1",
      kicker: "ข้อ 1 / 5 · แนวคิดเรื่องระบบและบริบท (Boundary & Contexts)",
      stem: "เหตุใดแนวทางดูแลผู้ป่วยชุดเดียวกันเมื่อนำไปใช้ใน รพ.ศูนย์เวลาราชการ กับ รพช.ชายแดนในเวรดึกวันหยุดยาว จึงให้ผลลัพธ์ต่างกัน?",
      choices: [
        "เพราะองค์ประกอบภายในไม่นับเป็นระบบเดียวกันหากเปลี่ยนบุคลากรเวร",
        "เพราะบริบทด้านเวลา สถานที่ และการให้ความหมายของผู้คนเปลี่ยนความสัมพันธ์ของระบบ",
        "เพราะระบบบริการสุขภาพเป็นระบบปิดที่ไม่รับปัจจัยนำเข้าจากสิ่งแวดล้อม",
        "เพราะระบบสามัญไม่สามารถกำหนดเส้นแบ่งขอบเขต (Boundary) ได้"
      ],
      correctIdx: 1,
      explain: "บริบท (Contexts) ด้านเวลา สถานที่ และการตีความให้ความหมายของผู้เกี่ยวข้องห่อหุ้มทั้งระบบและสิ่งแวดล้อม จึงเปลี่ยนการทำหน้าที่และผลลัพธ์ของระบบเดียวกันได้เสมอ"
    },
    {
      id: "st1_q2",
      kicker: "ข้อ 2 / 5 · ระบบยุ่งยาก vs ระบบซับซ้อนที่ปรับตัวได้ (CAS)",
      stem: "ข้อใดเปรียบเทียบ “การส่งจรวดไปดวงจันทร์” (Complicated) กับ “การเลี้ยงลูกและระบบสุขภาพ” (Complex / CAS) ได้ถูกต้องที่สุด?",
      choices: [
        "การส่งจรวดให้ผลลัพธ์เชิงความน่าจะเป็น ส่วนการเลี้ยงลูกทำซ้ำตามสูตรได้ผลเหมือนเดิมทุกครั้ง",
        "ทั้งสองระบบอยู่บนฐานคิดแยกส่วน (Reductionism) ต่างกันเพียงจำนวนผู้เชี่ยวชาญ",
        "การส่งจรวดมีเหตุผลเชิงเส้นตรงตามพิมพ์เขียว ส่วนระบบสุขภาพเป็นระบบเปิดที่มีวงจรป้อนกลับและคุณสมบัติผุดบังเกิด",
        "ความไม่แน่นอนของระบบซับซ้อนแปลว่าแพทย์ไม่สามารถวางแผนพัฒนาสุขภาพได้เลย"
      ],
      correctIdx: 2,
      explain: "ระบบยุ่งยากมีส่วนย่อยมากแต่เป็นเส้นตรงตามแบบพิมพ์เขียว ส่วน CAS เป็นระบบเปิดที่มี Tightly linked, Emergence, Feedback, Self-organizing และเปลี่ยนแปลงต่อเนื่อง"
    },
    {
      id: "st1_q3",
      kicker: "ข้อ 3 / 5 · คลินิกและโรคเรื้อรัง (Stacey Matrix & Chronic Care)",
      stem: "ผู้ป่วยหญิงอายุ 48 ปี เจ็บหน้าอกเรื้อรังไม่จำเพาะร่วมกับซึมเศร้า แต่ญาติโกรธที่แพทย์ส่งตรวจแยกโรคหัวใจก่อน แพทย์ควรรับมืออย่างไรตามกรอบ Stacey Matrix?",
      choices: [
        "ออกคำสั่งบังคับตามแนวทางมาตรฐานทันทีเหมือนพื้นที่เรียบง่าย (Simple)",
        "ส่งต่อจิตแพทย์ทันทีโดยไม่ต้องตรวจแยกโรคทางกายเพื่อลดเวลารอคอย",
        "รับฟังความกลัวและสื่อสารเหตุผลการตรวจแยกโรครวมถึงความไม่แน่นอนอย่างโปร่งใส ไม่ให้ถลำสู่ภาวะ Chaotic",
        "นัดตรวจสั้น ๆ และสั่งยาฝ่ายเดียวเหมือนรูปแบบดูแลโรคเฉียบพลัน"
      ],
      correctIdx: 2,
      explain: "สถานการณ์อยู่ในพื้นที่ซับซ้อน (Complex) ที่มีทั้งความไม่แน่นอนทางคลินิกและความเข้าใจไม่ตรงกัน ต้องใช้การสื่อสารอย่างใส่ใจและโปร่งใสเพื่อสร้างความเข้าใจร่วมกัน"
    },
    {
      id: "st1_q4",
      kicker: "ข้อ 4 / 5 · วงจรอุบาทว์ความแออัดห้องฉุกเฉิน (ER Crowding CLD)",
      stem: "ในแผนผัง CLD ห้องฉุกเฉิน เมื่อดึงงบและแพทย์มาเพิ่มเฉพาะใน ER เพียงจุดเดียว จะเกิดพลวัตระยะยาวแบบใด?",
      choices: [
        "เกิดวงจรสมดุล (Balancing Loop: B) ที่ทำให้จำนวนผู้ป่วย ER ลดลงจนเข้าสู่สมดุลถาวร",
        "เกิดวงจรเสริมแรง (Reinforcing Loop: R) ดึงผู้ป่วยทั่วไปเข้า ER เพิ่มขึ้นและบั่นทอนบริการนอก ER จนยิ่งแออัด",
        "บริการผู้ป่วยนอกทั่วไปเข้าถึงง่ายขึ้นเพราะทรัพยากรในโรงพยาบาลเพิ่มขึ้นโดยอัตโนมัติ",
        "ผู้ป่วยไม่ฉุกเฉินเปลี่ยนพฤติกรรมไปรับบริการที่ รพ.สต. เองโดยไม่ต้องปรับระบบปฐมภูมิ"
      ],
      correctIdx: 1,
      explain: "เมื่อไล่ครบรอบมีเครื่องหมายลบ 2 จุดคูณกันเป็นบวก จึงหมุนเป็นวงจรเสริมแรง (Reinforcing Loop: R) หรือวงจรอุบาทว์ ทางออกต้องขยายปฐมภูมินอกเวลาและทีมหมอครอบครัวควบคู่กัน"
    },
    {
      id: "st1_q5",
      kicker: "ข้อ 5 / 5 · แบบจำลองภูเขาน้ำแข็ง & Systems vs Systematic Thinking",
      stem: "การเปลี่ยนความเชื่อจาก “แพทย์คือผู้สั่งการและ รพ.ใหญ่คือที่พึ่งเดียว” สู่ “ผู้ป่วยเป็นหุ้นส่วนและปฐมภูมิคือฐานหลัก” ตรงกับระดับใดของภูเขาน้ำแข็ง?",
      choices: [
        "ระดับที่ 1 เหตุการณ์เฉพาะหน้า (Events — Reactive)",
        "ระดับที่ 2 แบบแผนและแนวโน้มตามเวลา (Patterns — Adaptive)",
        "ระดับที่ 3 โครงสร้างระบบและตารางเวร (Systemic Structures — Generative)",
        "ระดับที่ 4 กรอบความคิดและความเชื่อพื้นฐาน (Mental Models — Transformative) ซึ่งมีจุดคานงัดสูงสุด"
      ],
      correctIdx: 3,
      explain: "กรอบความคิด (Mental Models) อยู่ฐานรากสุดของภูเขาน้ำแข็งและหล่อหลอมโครงสร้างระบบ การปรับกระบวนทัศน์จึงเป็นจุดคานงัด (Leverage Point) ที่สร้างการเปลี่ยนแปลงได้ยั่งยืนที่สุด"
    }
  ];

  function renderQuizStageHtml(isEmbedded) {
    const q = QUIZ_ITEMS[state.quizIdx] || QUIZ_ITEMS[0];
    const picked = Object.prototype.hasOwnProperty.call(state.quizAnswers, q.id) ? Number(state.quizAnswers[q.id]) : null;
    const revealed = picked !== null || Boolean(state.facultyRevealMap[q.id]);
    const shapes = ["▲", "◆", "●", "■"];

    let answeredCnt = 0;
    let correctCnt = 0;
    QUIZ_ITEMS.forEach((it) => {
      if (Object.prototype.hasOwnProperty.call(state.quizAnswers, it.id)) {
        answeredCnt += 1;
        if (Number(state.quizAnswers[it.id]) === it.correctIdx) correctCnt += 1;
      }
    });

    return `
      <div class="st1-quiz-stage" data-st1-quiz-root="1">
        <div class="st1-qz-top">
          <div class="st1-qz-pills" role="tablist" aria-label="เลือกข้อคำถามทบทวน ST1">
            ${QUIZ_ITEMS.map((item, idx) => {
              const hasAns = Object.prototype.hasOwnProperty.call(state.quizAnswers, item.id);
              const ok = hasAns && Number(state.quizAnswers[item.id]) === item.correctIdx;
              const cls =
                idx === state.quizIdx
                  ? " is-current"
                  : hasAns
                  ? ok
                    ? " is-answered-ok"
                    : " is-answered-err"
                  : "";
              return `<button type="button" class="st1-qz-step-dot${cls}" data-st1-qjump="${idx}">ข้อ ${idx + 1}${hasAns ? (ok ? " ✓" : " ✕") : ""}</button>`;
            }).join("")}
          </div>
          <div class="st1-qz-pills">
            <span class="or-mini-chip">คะแนนสะสม: <strong>${correctCnt} / ${QUIZ_ITEMS.length}</strong> (ทำแล้ว ${answeredCnt} ข้อ)</span>
            ${
              ROLE === "faculty"
                ? `<button type="button" class="st1-qz-step-dot" data-st1-qact="toggle-reveal">${state.facultyRevealMap[q.id] ? "🙈 ซ่อนเฉลย" : "👁️ เฉลยหน้าชั้นเรียน"}</button>`
                : ""
            }
            ${
              answeredCnt > 0 || Object.keys(state.facultyRevealMap).length > 0
                ? `<button type="button" class="st1-qz-step-dot" data-st1-qact="reset-quiz">↺ เริ่มทำใหม่</button>`
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
                  <span class="st1-qz-shape">${shapes[cIdx]}</span>
                  <span>${esc(cText)}</span>
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
            <span class="or-td-sub">💡 แตะเลือกคำตอบ 1 ข้อเพื่อตรวจความเข้าใจและดูคำอธิบายเชิงระบบทันที</span>
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

  /* ---------- Complete 16-Slide ST1 Deck ---------- */
  const SLIDES = [
    {
      id: "s01-cover",
      num: "01",
      section: "intro",
      sectionLabel: "Opening",
      actClass: "",
      actLabel: "OPENING · 4-ACT STORY",
      timeWindow: "09.30 – 09.34 น. (4 นาที)",
      kicker: "RACM 303 · ACADEMIC YEAR 2569 · FOUNDATIONAL SESSION ST1",
      title: "Systems & Systems Thinking: แนวคิดเรื่องระบบและการคิดเชิงระบบ",
      keyTag: "สาระสำคัญ",
      keyMessageHtml:
        "ปูรากฐานความคิดเชิงระบบจาก <strong>การดูแลผู้ป่วยข้างเตียง</strong> สู่ <strong>ระบบซับซ้อนที่ปรับตัวได้ (CAS)</strong> <strong>วงจรอุบาทว์ห้องฉุกเฉิน</strong> และ <strong>แบบจำลองภูเขาน้ำแข็ง 4 ระดับ</strong>",
      notes:
        "เชื่อมรอยต่อจากคาบปฐมนิเทศ (08.30–09.30 น.) เข้าสู่คาบ ST1 (09.30–12.00 น. · 150 นาที) ชี้ให้เห็นว่าแม้ ST1 ไม่ออกข้อสอบปรนัย HS1–HS6 โดยตรง แต่เป็นเลนส์แม่บทที่ใช้ตลอด 6 สัปดาห์ ทั้งการวิเคราะห์กรณีศึกษา HS1–HS6 การลงฝึกภาคสนาม 9 โรงพยาบาลชุมชน การเขียน SRN 1–2 เวิร์กชอป CLD (22 ธ.ค.) และการนำเสนอฟอร์ม 3A",
      isCover: true
    },
    {
      id: "s02-roadmap",
      num: "02",
      section: "intro",
      sectionLabel: "Opening · Learning Arc",
      actClass: "",
      actLabel: "OPENING · 150-MINUTE ROADMAP",
      timeWindow: "09.34 – 09.40 น. (6 นาที)",
      kicker: "01 · OBJECTIVES & 4-MODULE JOURNEY (09.30 – 12.00 น.)",
      title: "โครงสร้างการเรียนรู้ 4 หมวด: จากความหมายของระบบสู่จุดคานงัดเพื่อความยั่งยืน",
      keyMessageHtml:
        "ไล่ระดับจาก <strong>นิยามและบริบทของระบบ</strong> → <strong>ธรรมชาติของ CAS</strong> → <strong>ความซับซ้อนในคลินิกและห้องฉุกเฉิน</strong> → <strong>แบบจำลองภูเขาน้ำแข็ง 4 ระดับ</strong>",
      notes:
        "แนะนำคำถามนำทั้ง 4 ข้อของเอกสารคำสอน ST1 และแผนการจัดสรรเวลา 150 นาที (พักเบรก 15 นาที เวลา 10.45–11.00 น.) เพื่อให้นักศึกษาเห็นโครงสร้างเหตุผลตั้งแต่ต้นจนจบคาบ",
      render: () => `
        <div class="st1-roadmap-layout">
          <div class="st1-full-grid-4" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">หมวดที่ 1 · 09.34 – 09.53 น.</span>
              <h3 class="or-card-title">แนวคิดเรื่องระบบและบริบท</h3>
              <p class="or-card-text">อธิบายความหมาย องค์ประกอบ ขอบเขต (<code>Boundary</code>) สิ่งแวดล้อม กลไก <code>Input → Process → Output</code> และอิทธิพลของบริบทด้านเวลา สถานที่ และการให้ความหมาย</p>
            </div>
            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">หมวดที่ 2 · 09.53 – 10.08 น.</span>
              <h3 class="or-card-title">ประเภทของระบบ &amp; CAS</h3>
              <p class="or-card-text">เปรียบเทียบระบบสามัญ (ทำกับข้าว) ระบบยุ่งยาก (ส่งจรวด) และระบบซับซ้อนที่ปรับตัวได้ (เลี้ยงลูก) พร้อมคุณสมบัติ 5 ประการที่ไม่เป็นเส้นตรง</p>
            </div>
            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">หมวดที่ 3 · 10.08 – 10.45 น.</span>
              <h3 class="or-card-title">ระบบสุขภาพในฐานะ CAS</h3>
              <p class="or-card-text">วิเคราะห์ช่างซ่อมเครื่องยนต์ vs สิ่งมีชีวิต, คลินิกบน <code>Stacey Matrix</code>, โรคเฉียบพลัน vs โรคเรื้อรัง และวงจรอุบาทว์ห้องฉุกเฉิน (<code>CLD Loop R</code>)</p>
            </div>
            <div class="or-card is-violet-tint">
              <span class="or-card-kicker">หมวดที่ 4 · 11.00 – 12.00 น.</span>
              <h3 class="or-card-title">ภูเขาน้ำแข็ง &amp; จุดคานงัด</h3>
              <p class="or-card-text">ก้าวพ้นตาบอดคลำช้าง ใช้ <code>Iceberg Model</code> 4 ระดับค้นหาจุดคานงัด แยกแยะ <code>Systems</code> vs <code>Systematic Thinking</code> และทำ Quiz ทบทวน</p>
            </div>
          </div>

          <div class="or-card is-amber-tint" data-fit-solo="1">
            <div class="or-card-head-inline">
              <span class="or-card-kicker">COURSE THREAD · จุดเชื่อมต่อตลอด 6 สัปดาห์ใน RACM 303</span>
              <span class="or-mini-chip">☕ พักเบรกระหว่างคาบ 10.45 – 11.00 น. (15 นาที)</span>
            </div>
            <p class="or-card-text"><strong>ST1 (เช้าวันแรก)</strong> ปูเลนส์คิดเชิงระบบ → <strong>เสวนาบ่ายวันนี้ (13.00–16.00 น.)</strong> เชื่อมข้างเตียงสู่ Global Health &amp; HPSR → <strong>HS1–HS6</strong> วิเคราะห์ 6 องค์ประกอบระบบสุขภาพ → <strong>ภาคสนาม 9 รพช. &amp; เวิร์กชอป CLD (22 ธ.ค.)</strong> สังเคราะห์ข้อเสนอเชิงระบบในฟอร์ม <code>3A</code> และ <code>SRN 1–2</code></p>
          </div>
        </div>
      `
    },
    {
      id: "s03-system-ipo",
      num: "03",
      section: "act1",
      sectionLabel: "Act I · Systems & CAS",
      actClass: "",
      actLabel: "ACT I · CONCEPTS OF SYSTEMS",
      timeWindow: "09.40 – 09.47 น. (7 นาที)",
      kicker: "1.1 · DEFINITION, BOUNDARY, SUB/SUPRA-SYSTEM & INPUT–PROCESS–OUTPUT",
      title: "ระบบคือองค์ประกอบย่อยที่สัมพันธ์และทำหน้าที่ร่วมกันภายใต้ขอบเขตเพื่อบรรลุเป้าหมาย",
      keyMessageHtml:
        "<strong>อวัยวะที่วางแยกกันบนโต๊ะผ่าตัดไม่นับเป็นระบบไหลเวียนโลหิต</strong> — หัวใจของระบบอยู่ที่ความสัมพันธ์และการทำงานสอดประสานกันเพื่อมุ่งสู่เป้าหมายร่วมกัน",
      notes:
        "ชวนนักศึกษาตอบคำถามเปิดเรื่อง: หากนำหัวใจ หลอดเลือด และปอดมาวางเรียงบนโต๊ะผ่าตัดโดยไม่เชื่อมต่อกัน ยังทำหน้าที่สูบฉีดเลือดได้หรือไม่? ชี้ให้เห็นการขีดเส้นแบ่งขอบเขต (Boundary) และการกำหนดลำดับชั้น Sub-system (วอร์ด/ER/ห้องยา) เทียบกับ Supra-system (เขตสุขภาพ/ระบบหลักประกันสุขภาพ)",
      render: () => `
        <div class="st1-split-fig-left">
          ${figPlate(
            "st1_fig1_system_ipo.png",
            "ภาพที่ 1 กรอบแนวคิดเรื่องระบบ แสดงความสัมพันธ์ระหว่างปัจจัยนำเข้า กระบวนการ ปัจจัยส่งออก ขอบเขตของระบบ และสิ่งแวดล้อม",
            "<strong>ภาพที่ 1 กรอบแนวคิดเรื่องระบบ</strong> · สังเคราะห์จาก von Bertalanffy (1968) และ Scheerens &amp; Bosker (1997)",
            "FIG. 1 · SYSTEM BOUNDARY & INPUT–PROCESS–OUTPUT"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">BOUNDARY &amp; ENVIRONMENT · เส้นแบ่งขอบเขต</span>
              <h3 class="or-card-title">แยกสิ่งที่ศึกษาออกจากสิ่งแวดล้อมภายนอก</h3>
              <p class="or-card-text">ผู้วิเคราะห์ต้องขีด <strong>ขอบเขตของระบบ (Boundary)</strong> เพื่อระบุองค์ประกอบที่ศึกษาและแยกออกจาก <strong>สิ่งแวดล้อม (Environment)</strong> ที่อยู่นอกเหนือการควบคุมโดยตรง แม้ในโลกจริงเส้นแบ่งอาจซ้อนเหลื่อมกันในบางกรณี</p>
            </div>

            <div class="or-card is-white">
              <span class="or-card-kicker">SUB-SYSTEM &amp; SUPRA-SYSTEM · ลำดับชั้นของระบบ</span>
              <h3 class="or-card-title">ขอบเขตที่ขีดกำหนดว่าระบบใดเป็นระบบย่อยหรือระบบใหญ่</h3>
              <p class="or-card-text">หากกำหนดให้ <strong>“โรงพยาบาล”</strong> เป็นระบบที่สนใจ หอผู้ป่วยใน ห้องฉุกเฉิน และห้องยาคือ <code>Sub-system</code> ขณะที่เครือข่ายบริการระดับเขตและระบบหลักประกันสุขภาพระดับชาติคือ <code>Supra-system</code></p>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">FUNCTIONS &amp; GOALS · กลไกการทำงานในหอผู้ป่วยวิกฤต (ICU)</span>
              <h3 class="or-card-title">แปลงปัจจัยนำเข้าผ่านกระบวนการสู่เป้าหมายร่วม</h3>
              <p class="or-card-text">รับ <code>Input</code> (ผู้ป่วยภาวะติดเชื้อในกระแสเลือด ยาปฏิชีวนะ ผลแล็บ) → <code>Process</code> (ประเมินอาการ ทวนสอบใบสั่งยา ให้สารน้ำตามแนวทาง) → <code>Output</code> (ผู้ป่วยพ้นภาวะช็อกกลับบ้านปลอดภัยตาม <code>Goals</code>)</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s04-contexts",
      num: "04",
      section: "act1",
      sectionLabel: "Act I · Systems & CAS",
      actClass: "",
      actLabel: "ACT I · CONTEXTS & MEANING-MAKING",
      timeWindow: "09.47 – 09.53 น. (6 นาที)",
      kicker: "1.2 · CONTEXTS OF TIME, PLACE & HUMAN MEANING-MAKING ACROSS SCALES",
      title: "บริบทด้านเวลา สถานที่ และการให้ความหมาย ทำให้ระบบเดียวกันทำหน้าที่ต่างกันได้",
      keyMessageHtml:
        "<strong>บริบท (Contexts)</strong> ห่อหุ้มทั้งตัวระบบและสิ่งแวดล้อม — มนุษย์ไม่ได้ตอบสนองอัตโนมัติเหมือนเครื่องจักร แต่ตีความหมายต่างกันตามสถานการณ์",
      notes:
        "ยกตัวอย่างห้องเรียนมัธยมห้องเดิมที่ช่วงปกติพูดคุยคึกคัก แต่ช่วงสัปดาห์ก่อนสอบเงียบเครียด ขณะที่ครูหรือนักเรียนบางคนไม่รู้สึกกดดัน และเชื่อมสู่การนำแนวทางเวชปฏิบัติเดียวกันไปใช้ใน รพ.ศูนย์เวลาราชการ เทียบกับ รพช.ชายแดนเวรดึกวันหยุดยาว",
      render: () => `
        <div class="st1-split-top-bottom">
          <div class="st1-split-fig-left">
            ${figPlate(
              "st1_fig2_system_contexts.png",
              "ภาพที่ 2 การทำหน้าที่ของระบบซึ่งอาจเปลี่ยนแปลงไปตามบริบท A และบริบท B",
              "<strong>ภาพที่ 2 บริบท A เทียบกับบริบท B</strong> · ที่มา: บวรศม ลีระพันธ์",
              "FIG. 2 · SAME SYSTEM ACROSS CONTEXT A & CONTEXT B"
            )}
            <div class="or-card is-amber-tint" data-fit-solo="1">
              <span class="or-card-kicker">HUMAN MEANING-MAKING · เวลา สถานที่ และการตีความ</span>
              <h3 class="or-card-title">เหตุใดระบบเดิมจึงให้ผลลัพธ์ไม่เหมือนเดิม?</h3>
              <p class="or-card-text"><strong>ห้องเรียนใกล้สอบ:</strong> ครูและนักเรียนกลุ่มเดิม แต่เมื่อตีความว่าเป็นช่วงกดดันจึงลดกิจกรรมร่วมกัน · <strong>คลินิกและโรงพยาบาล:</strong> แนวทางรักษาเดียวกันเมื่อย้ายจาก รพ.ศูนย์เขตเมืองเวลาราชการ ไปสู่ รพช.ชายแดนเวรดึกวันหยุดยาว ย่อมเผชิญข้อจำกัดและผลลัพธ์ต่างกัน</p>
            </div>
          </div>

          <div class="or-table-wrap is-st1-table" data-fit-table="1" data-mobile-scroll-hint="⇄ เลื่อนตารางซ้าย–ขวาเพื่อดูตัวอย่างระบบทั้ง 4 ระดับ">
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
                  <td>ปัจจัยการจัดการเรียนรู้ทั้งในและนอกสถานศึกษา สิ่งแวดล้อมการเรียนรู้ และการสร้างองค์ความรู้ (Scheerens &amp; Bosker, 1997)</td>
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
      id: "s05-three-types",
      num: "05",
      section: "act1",
      sectionLabel: "Act I · Systems & CAS",
      actClass: "",
      actLabel: "ACT I · TYPES OF SYSTEMS",
      timeWindow: "09.53 – 10.00 น. (7 นาที)",
      kicker: "2.1 – 2.2 · SIMPLE, COMPLICATED & COMPLEX ADAPTIVE SYSTEMS (GLOUBERMAN & ZIMMERMAN, 2002)",
      title: "เปรียบเทียบ 3 ธรรมชาติของระบบ: การทำกับข้าว · การส่งจรวดไปดวงจันทร์ · การเลี้ยงลูก",
      keyMessageHtml:
        "<strong>ระบบสามัญ</strong> และ <strong>ระบบยุ่งยาก</strong> เป็นความสัมพันธ์เชิงเส้นตรงบนฐานคิดแยกส่วน (<code>Reductionism</code>) ส่วน <strong>ระบบซับซ้อน (CAS)</strong> เป็นระบบเปิดเชิงความน่าจะเป็น",
      notes:
        "ชี้จุดสำคัญที่นักศึกษามักสับสน: การส่งจรวดไปดวงจันทร์ยากมากและใช้ผู้เชี่ยวชาญหลายสาขา แต่ยังเป็น Complicated System (ระบบซับซ้อนแบบกลไก) ที่คำนวณผลได้แม่นยำ ต่างจากการเลี้ยงลูกและระบบสุขภาพที่เป็น Complex System (ระบบซับซ้อนแบบองค์รวม) เพราะมนุษย์เรียนรู้และตอบสนองไม่ซ้ำเดิม",
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
              <span class="or-card-kicker">3 · COMPLEX ADAPTIVE SYSTEMS (ซับซ้อนแบบองค์รวม)</span>
              <h3 class="or-card-title">🌱 “การเลี้ยงลูก &amp; ระบบสุขภาพ”</h3>
              <p class="or-card-text">ระบบเปิด ขอบเขตไม่ตายตัว ไม่เป็นเส้นตรง (<code>Non-linear, probabilistic</code>) เรียนรู้และปรับตัวจากภายใน สูตรสำเร็จเดิมไม่รับประกันผลซ้ำ</p>
            </div>
          </div>

          <div class="or-table-wrap is-st1-table" data-fit-table="1" data-mobile-scroll-hint="⇄ เลื่อนตารางซ้าย–ขวาเพื่อเปรียบเทียบทั้ง 3 ระบบ">
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
      id: "s06-cas-five-props",
      num: "06",
      section: "act1",
      sectionLabel: "Act I · Systems & CAS",
      actClass: "",
      actLabel: "ACT I · 5 CAS PROPERTIES IN THAILAND",
      timeWindow: "10.00 – 10.08 น. (8 นาที)",
      kicker: "2.2 & 3.3.2 · FIVE CHARACTERISTICS OF CAS IN THAILAND'S HEALTH SYSTEM (CILLIERS, 1998; ATUN, 2012)",
      title: "คุณสมบัติ 5 ประการของระบบซับซ้อนที่ปรับตัวได้ (CAS) ในระบบสุขภาพและสังคมไทย",
      keyMessageHtml:
        "<strong>“ส่วนรวมไม่เท่ากับผลรวมของส่วนย่อย”</strong> — องค์ประกอบเชื่อมโยงใกล้ชิด ผุดบังเกิด ตอบสนองย้อนกลับ จัดการตัวเอง และเปลี่ยนแปลงต่อเนื่อง",
      notes:
        "เชื่อมทฤษฎีของ Cilliers (1998) และ de Savigny & Adam (2009) เข้ากับตัวอย่างจริงในสังคมไทยทั้ง 5 ข้อ เพื่อให้นักศึกษาเตรียมสายตาสังเกตคุณสมบัติเหล่านี้เมื่อลงพื้นที่โรงพยาบาลชุมชนทั้ง 9 แห่งในสัปดาห์ที่ 4",
      render: () => `
        <div class="st1-cas5-layout" data-fit-group="cards">
          <div class="or-card is-navy-tint">
            <span class="or-card-kicker">1 · TIGHTLY LINKED</span>
            <h3 class="or-card-title">เชื่อมโยงกันอย่างใกล้ชิด</h3>
            <p class="or-card-text"><strong>กลไก:</strong> การเปลี่ยนจุดหนึ่งในระบบย่อยย่อมกระทบส่วนอื่นเสมอ<br><br><strong>ในไทย:</strong> สุขภาพกายและจิตเชื่อมโยงแยกไม่ออก การแยกให้อายุรแพทย์ดูแต่กายและจิตแพทย์ดูแต่ใจโดยขาดการประสานงานจึงไม่ตอบโจทย์ผู้ป่วย</p>
          </div>

          <div class="or-card is-teal-tint">
            <span class="or-card-kicker">2 · EMERGING PROPERTY</span>
            <h3 class="or-card-title">คุณสมบัติผุดบังเกิด</h3>
            <p class="or-card-text"><strong>กลไก:</strong> ปฏิสัมพันธ์สร้างพลังใหม่ระดับภาพรวมที่ไม่เท่ากับผลบวกส่วนย่อย<br><br><strong>ในไทย:</strong> กลุ่มแพทย์พื้นบ้าน ตลาดปลอดสารพิษ และจิตอาสาชุมชน เมื่อเชื่อมเครือข่ายเกิดพลังภาคประชาสังคมขับเคลื่อนนโยบายระดับชาติได้</p>
          </div>

          <div class="or-card is-rose-tint">
            <span class="or-card-kicker">3 · GOVERNANCE BY FEEDBACK</span>
            <h3 class="or-card-title">อภิบาลด้วยวงจรป้อนกลับ</h3>
            <p class="or-card-text"><strong>กลไก:</strong> ผู้คนตอบสนองทั้งทางเสริมแรง (<code>R</code>) และถ่วงดุล (<code>B</code>) ต่อมาตรการ<br><br><strong>ในไทย:</strong> ผู้ป่วยที่เข้าคลินิกนอกเวลาไม่สะดวกปรับพฤติกรรมมาใช้ ER เมื่อ ER เพิ่มแพทย์ จนหักล้างผลของมาตรการลดความแออัด</p>
          </div>

          <div class="or-card is-amber-tint">
            <span class="or-card-kicker">4 · SELF-ORGANIZING</span>
            <h3 class="or-card-title">การจัดการตัวเองจากภายใน</h3>
            <p class="or-card-text"><strong>กลไก:</strong> จัดระเบียบความสัมพันธ์ขึ้นเองโดยไม่ต้องรอคำสั่งจากศูนย์กลางตลอดเวลา<br><br><strong>ในไทย:</strong> ภัยพิบัติสึนามิภาคใต้ พ.ศ. 2547 อาสาสมัครและเครือข่ายหลายภาคส่วนประสานช่วยเหลือกันเองรับมือวิกฤตได้ทันท่วงที</p>
          </div>

          <div class="or-card is-violet-tint">
            <span class="or-card-kicker">5 · CONSTANTLY CHANGING</span>
            <h3 class="or-card-title">เปลี่ยนแปลงอย่างต่อเนื่อง</h3>
            <p class="or-card-text"><strong>กลไก:</strong> เรียนรู้และปรับตัวข้ามเวลาในหลายระดับตลอดเวลา<br><br><strong>ในไทย:</strong> ชุมชนชนบทปัจจุบันเชื่อมโยงข้อมูลข่าวสารจนวิถีบริโภคใกล้เคียงเมือง เครื่องมือพัฒนาสุขภาพในอดีตจึงใช้ซ้ำแบบตายตัวไม่ได้</p>
          </div>
        </div>
      `
    },
    {
      id: "s07-machine-vs-living",
      num: "07",
      section: "act2",
      sectionLabel: "Act II · Clinical & ER",
      actClass: "is-act-2",
      actLabel: "ACT II · HEALTH SYSTEMS AS CAS",
      timeWindow: "10.08 – 10.16 น. (8 นาที)",
      kicker: "3.1 · MACHINE METAPHOR VS. LIVING-SYSTEM METAPHOR (BEGUN ET AL., 2003)",
      title: "เปลี่ยนบทบาทแพทย์จาก “ช่างซ่อมเครื่องยนต์” สู่ “ผู้เกื้อหนุนการปรับตัวจากภายใน”",
      keyMessageHtml:
        "การยอมรับความไม่แน่นอน (<code>Uncertainty</code>) <strong>ไม่ได้แปลว่าหมดหนทางพัฒนาสุขภาพ</strong> แต่ช่วยให้แพทย์สร้างสภาวะแวดล้อมที่เกื้อหนุนทีมและผู้ป่วยได้ตรงธรรมชาติจริง",
      notes:
        "เปรียบเทียบกรณีเกิดความคลาดเคลื่อนของใบสั่งยาในวอร์ด: หากคิดแบบช่างซ่อมเครื่องยนต์จะมุ่งลงโทษบุคคลหรือเพิ่มกฎซ้อนทับ แต่หากคิดแบบผู้ดูแลสิ่งมีชีวิตจะวิเคราะห์ความเชื่อมโยงของภาระงาน การสื่อสารทีม และออกแบบระบบทวนสอบที่เกื้อหนุนคนทำงาน",
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
              <span class="or-card-kicker">TRAP OF REDUCTIONISM · กับดักการสั่งการภายนอก</span>
              <h3 class="or-card-title">ซ่อมแยกชิ้นส่วนทำให้พลาดพลวัตทั้งระบบ</h3>
              <p class="or-card-text">เช่น เมื่อเกิดความคลาดเคลื่อนทางยาในหอผู้ป่วย การมุ่งตำหนิรายบุคคลหรือออกคำสั่งบังคับจากภายนอกโดยไม่ดูระบบงานและภาระเวร มักก่อแรงต้านและการปกปิดข้อมูล</p>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">EMBRACING UNCERTAINTY · ยอมรับความไม่แน่นอนอย่างสร้างสรรค์</span>
              <h3 class="or-card-title">ประคับประคองศักยภาพภายในเหมือนการเลี้ยงลูก</h3>
              <p class="or-card-text">เหมือนพ่อแม่ที่เข้าใจเอกลักษณ์ของลูกแต่ละคน แพทย์ทำหน้าที่สร้างความปลอดภัยทางใจ แรงจูงใจ และกติกาที่ช่วยให้ทีมสหวิชาชีพ ผู้ป่วย และชุมชนเรียนรู้ปรับตัวร่วมกัน</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s08-stacey-clinical",
      num: "08",
      section: "act2",
      sectionLabel: "Act II · Clinical & ER",
      actClass: "is-act-2",
      actLabel: "ACT II · CLINICAL COMPLEXITY",
      timeWindow: "10.16 – 10.26 น. (10 นาที)",
      kicker: "3.2.1 · CLINICAL CONSULTATIONS AT THE EDGE OF CHAOS (INNES ET AL., 2005)",
      title: "การตัดสินใจข้างเตียงบนแกนความไม่แน่นอนและความเข้าใจที่ตรงกัน (Stacey Matrix)",
      keyMessageHtml:
        "กรณีผู้ป่วยหญิงอายุ 48 ปี เจ็บหน้าอกเรื้อรังร่วมกับซึมเศร้า — แพทย์ต้องใช้ <strong>การคิดเชิงระบบและการสื่อสารความไม่แน่นอนอย่างโปร่งใส</strong> เพื่อไม่ให้ถลำสู่ภาวะสับสนวุ่นวาย",
      notes:
        "เล่าเคสผู้ป่วยหญิงไทยอายุ 48 ปี มาด้วยเจ็บหน้าอกเรื้อรัง 2–3 สัปดาห์ไม่จำเพาะ ร่วมกับอาการซึมเศร้า แพทย์ส่งตรวจแล็บเพื่อแยกโรคหลอดเลือดหัวใจตีบก่อนปรึกษาจิตแพทย์ แต่ผู้ป่วยและญาติไม่พอใจเพราะกลัวเป็นโรคหัวใจฉุกเฉิน ชี้ให้เห็นจุดตัดของ Uncertainty และ Disagreement บน Stacey Matrix",
      render: () => `
        <div class="st1-split-fig-left">
          ${figPlate(
            "st1_fig3_stacey_matrix.png",
            "ภาพที่ 3 ความสัมพันธ์ระหว่างความไม่แน่นอนและความเข้าใจที่ตรงกันกับธรรมชาติของกระบวนการดูแลผู้ป่วยและการตัดสินใจ",
            "<strong>ภาพที่ 3 ตารางความซับซ้อนของสเตซีย์ (Stacey Matrix)</strong> · ดัดแปลงจาก Innes et al. (2005) และ โกมาตร จึงเสถียรทรัพย์ (2558)",
            "FIG. 3 · UNCERTAINTY × AGREEMENT IN CLINICAL CARE"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-amber-tint">
              <span class="or-card-kicker">CLINICAL VIGNETTE · หญิงไทยอายุ 48 ปี เจ็บหน้าอก 2–3 สัปดาห์</span>
              <h3 class="or-card-title">จุดปะทะระหว่างเหตุผลทางคลินิกกับความกลัวของครอบครัว</h3>
              <p class="or-card-text">แพทย์ส่งตรวจแยก <code>Coronary artery disease</code> ก่อนดูแล <code>Major depressive disorder</code> แต่ผู้ป่วยและญาติตีความจากความกลัวว่าเจ็บหน้าอกต้องรักษาฉุกเฉินทันที จึงเกิดทั้ง <strong>ความไม่แน่นอน</strong> และ <strong>ความเข้าใจไม่ตรงกัน</strong></p>
            </div>

            <div class="or-card is-white">
              <span class="or-card-kicker">5 DECISION ZONES · เลือกวิธีตัดสินใจให้ตรงพื้นที่</span>
              <h3 class="or-card-title">Simple · Complicated (Tech / Social) · Complex · Chaotic</h3>
              <p class="or-card-text"><strong>เรียบง่าย:</strong> ใช้เหตุผลมาตรฐาน · <strong>ยุ่งยากเชิงเทคนิค:</strong> ใช้วิจารณญาณผู้เชี่ยวชาญ · <strong>ยุ่งยากเชิงสังคม:</strong> เจรจาคุณค่า/นโยบาย · <strong>ซับซ้อน:</strong> ใช้ <code>Systems thinking</code> · <strong>สับสนวุ่นวาย:</strong> ไร้ระเบียบควบคุมไม่ได้</p>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">CLINICAL TAKEAWAY · ป้องกันไม่ให้ถลำสู่ Chaotic</span>
              <h3 class="or-card-title">รับฟังความกังวลและอธิบายความไม่แน่นอนอย่างโปร่งใส</h3>
              <p class="or-card-text">การรับฟังความกลัวของผู้ป่วยและญาติอย่างใส่ใจ พร้อมชี้แจงเหตุผลของการตรวจแยกโรคอันตรายทีละขั้น ช่วยสร้างความเข้าใจร่วมกันและประคับประคองการดูแลให้อยู่ในพื้นที่ที่จัดการได้</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s09-acute-vs-chronic",
      num: "09",
      section: "act2",
      sectionLabel: "Act II · Clinical & ER",
      actClass: "is-act-2",
      actLabel: "ACT II · ACUTE VS. CHRONIC CARE",
      timeWindow: "10.26 – 10.35 น. (9 นาที)",
      kicker: "3.2.2 · ACUTE COMPLICATED VS. CHRONIC COMPLEX DISEASES (HOLMAN & LORIG, 2000)",
      title: "เหตุใดระบบตั้งรับของ “โรคเฉียบพลันที่มีความยุ่งยาก” จึงล้มเหลวเมื่อดูแล “โรคเรื้อรังที่มีความซับซ้อน”",
      keyMessageHtml:
        "การจัดคลินิกนัดสั้น ๆ และสั่งยาฝ่ายเดียวในผู้ป่วยโรคเรื้อรัง ก่อให้เกิดทั้ง <strong>ผลลัพธ์สุขภาพที่ไม่ดี</strong> <strong>การขาดประสิทธิภาพ (Inefficiency)</strong> และ <strong>ความไม่เป็นธรรม (Inequity)</strong>",
      notes:
        "เปรียบเทียบตารางที่ 2 ของ Holman & Lorig (2000) ชี้ให้เห็นว่าในเวชปฏิบัติจริงอาจเกิด Acute exacerbation on top of chronic disease (เช่น DKA หรือ Acute heart failure) ที่ต้องกู้ชีพเฉียบพลันก่อน แต่เมื่อพ้นวิกฤตแล้ว การดูแลหลักต้องเปลี่ยนเป็นหุ้นส่วนระยะยาว มิฉะนั้นจะเกิดการนอน รพ.ซ้ำซาก เบียดบังเตียงและทรัพยากรของกลุ่มเปราะบางอื่น",
      render: () => `
        <div class="st1-split-table-top-cards">
          <div class="or-table-wrap is-st1-table" data-fit-table="1" data-mobile-scroll-hint="⇄ เลื่อนตารางซ้าย–ขวาเพื่อเปรียบเทียบโรคเฉียบพลันกับโรคเรื้อรัง">
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
              <span class="or-card-kicker">REAL-WORLD OVERLAP · ซ้อนทับในคลินิก</span>
              <h3 class="or-card-title">Acute on Top of Chronic</h3>
              <p class="or-card-text">เมื่อผู้ป่วยเบาหวานหรือหัวใจล้มเหลวกำเริบเฉียบพลัน ต้องกู้ชีพแบบโรคเฉียบพลันทันที แต่หลังพ้นวิกฤตต้องกลับสู่ระบบหุ้นส่วนดูแลต่อเนื่อง</p>
            </div>
            <div class="or-card is-amber-tint">
              <span class="or-card-kicker">INEFFICIENCY · การขาดประสิทธิภาพ</span>
              <h3 class="or-card-title">สิ้นเปลืองทรัพยากรตติยภูมิซ้ำซาก</h3>
              <p class="or-card-text">นัดตรวจสั้น ๆ และสั่งยาฝ่ายเดียวทำให้คุมโรคไม่ได้ เกิดภาวะแทรกซ้อนและกลับมานอนโรงพยาบาลซ้ำแล้วซ้ำเล่าโดยไม่คุ้มค่า</p>
            </div>
            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">INEQUITY · ความไม่เป็นธรรมทางสุขภาพ</span>
              <h3 class="or-card-title">เบียดบังโอกาสของกลุ่มเปราะบางอื่น</h3>
              <p class="or-card-text">เมื่อเตียงและเวลาบุคลากรถูกดึงไปรักษาภาวะแทรกซ้อนที่ป้องกันได้ ย่อมลดโอกาสเข้าถึงบริการของประชาชนกลุ่มอื่นและซ้ำเติมความเหลื่อมล้ำ</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s10-er-crowding-cld",
      num: "10",
      section: "act2",
      sectionLabel: "Act II · Clinical & ER",
      actClass: "is-act-2",
      actLabel: "ACT II · ER CROWDING CLD (LOOP R)",
      timeWindow: "10.35 – 10.45 น. (10 นาที · ก่อนพักเบรก)",
      kicker: "3.3.1 · EMERGENCY ROOM CROWDING, VICIOUS CYCLES & UNINTENDED CONSEQUENCES (GLOUBERMAN, 2000)",
      title: "วงจรอุบาทว์ความแออัดห้องฉุกเฉิน: เมื่อการแก้เฉพาะจุดสร้างผลลัพธ์ที่ไม่ได้ตั้งใจ",
      keyMessageHtml:
        "การเพิ่มทรัพยากรเฉพาะใน <code>ER</code> เพียงจุดเดียวลดคิวได้ชั่วคราว แต่กลับดึงดูดผู้ป่วยไม่ฉุกเฉินและบั่นทอนบริการนอก <code>ER</code> จนหมุนเป็น <strong>วงจรเสริมแรง (<code>Reinforcing Loop: R</code>)</strong>",
      notes:
        "พาผู้เรียนไล่ลูกศรทีละขั้นในภาพที่ 4: สังเกตเครื่องหมาย + (ทิศทางเดียวกัน) และ - (ทิศทางตรงข้าม) เมื่อไล่ครบรอบมีเครื่องหมายลบ 2 ตำแหน่งหักล้างกันเป็นบวก จึงเป็น Reinforcing Loop (R) ที่เร่งปัญหาให้รุนแรงขึ้นเป็นวงจรอุบาทว์ จากนั้นสรุปทางออกเชิงระบบก่อนปล่อยพักเบรก 15 นาที (10.45–11.00 น.)",
      render: () => `
        <div class="st1-split-fig-left">
          ${figPlate(
            "st1_fig4_er_crowding_cld.png",
            "ภาพที่ 4 แผนผังวงจรเหตุปัจจัยแสดงวงจรอุบาทว์ของปัญหาความหนาแน่นของผู้ป่วยในห้องฉุกเฉิน",
            "<strong>ภาพที่ 4 แผนผังวงจรเหตุปัจจัย (CLD) ความแออัดห้องฉุกเฉิน</strong> · บวรศม ลีระพันธ์ สังเคราะห์จาก Glouberman (2000)",
            "FIG. 4 · CAUSAL LOOP DIAGRAM · REINFORCING VICIOUS CYCLE (R)"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">READING CLD POLARITY · วิธีอ่านเครื่องหมาย + / − และวงจร R</span>
              <h3 class="or-card-title">ลบสองจุดคูณกันเป็นบวก = วงจรเสริมแรง (Reinforcing: R)</h3>
              <p class="or-card-text">เครื่องหมาย <code>+</code> แปลว่าเปลี่ยนทิศทางเดียวกัน ส่วน <code>−</code> แปลว่าเปลี่ยนทิศทางตรงข้าม เมื่อครบรอบมีเครื่องหมายลบ 2 จุดหักล้างกันเป็นบวก จึงหมุนเร่งตัวเองเป็น <strong>วงจรอุบาทว์ (Vicious cycle)</strong> ต่างจากวงจรสมดุล (<code>B</code>)</p>
            </div>

            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">UNINTENDED CONSEQUENCES · ผลลัพธ์ที่ไม่ได้ตั้งใจ</span>
              <h3 class="or-card-title">ยิ่งทุ่มงบและคนเติมเฉพาะใน ER ห้องฉุกเฉินยิ่งแตก</h3>
              <p class="or-card-text">เมื่อคิว ER เร็วขึ้นชั่วคราว ผู้ป่วยทั่วไปยิ่งแห่มา ER ขณะที่ รพ.ต้องดึงงบและคนออกจากคลินิกนอก ER มาโปะ ทำให้คลินิกทั่วไปยิ่งเข้าถึงยาก และผู้ป่วยบางรายขาดการดูแลระยะต้นจนทรุดเป็นฉุกเฉินจริง</p>
            </div>

            <div class="or-card is-teal-tint">
              <div class="or-card-head-inline">
                <span class="or-card-kicker">SYSTEMIC FIX · ทางออกเชิงระบบซับซ้อน</span>
                <span class="or-mini-chip">☕ จบสไลด์นี้พักเบรก 10.45–11.00 น.</span>
              </div>
              <h3 class="or-card-title">เสริมระบบบริการปฐมภูมิและกติกาควบคู่กัน</h3>
              <p class="or-card-text">ขยายคลินิกปฐมภูมินอกเวลาและทีมแพทย์ประจำครอบครัวให้เข้าถึงสะดวก พร้อมออกแบบกติกาและแรงจูงใจให้ผู้ป่วยไม่ฉุกเฉินรับบริการใกล้บ้านแทน ER</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s11-blind-men",
      num: "11",
      section: "act3",
      sectionLabel: "Act III · Iceberg & Leverage",
      actClass: "is-act-3",
      actLabel: "ACT III · HOLISTIC SYSTEMS THINKING",
      timeWindow: "11.00 – 11.10 น. (10 นาที)",
      kicker: "4.1 · SYSTEMS THINKING VS. BLIND MEN & THE ELEPHANT (DE SAVIGNY & ADAM, 2009; โกมาตร, 2558)",
      title: "ก้าวพ้นการทำงานแยกส่วนแบบ “ตาบอดคลำช้าง” และการรณรงค์เฉพาะกิจรายเหตุการณ์",
      keyMessageHtml:
        "<strong>การคิดเชิงระบบ (Systems Thinking)</strong> มองปัญหาเป็นส่วนหนึ่งของความสัมพันธ์และพฤติกรรมในระบบที่มีพลวัต แทนการวิ่งดับไฟเฉพาะหน้าทีละจุด",
      notes:
        "เปิดครึ่งหลังของคาบหลังพักเบรกด้วยภาพตาบอดคลำช้าง (ภาพที่ 5) และวรรคทองของ อ.โกมาตร จึงเสถียรทรัพย์ (2558) ชี้ให้เห็นกับดัก 2 ประการในการทำงานสาธารณสุข: (1) การจัดงานรณรงค์เฉพาะกิจรายเหตุการณ์โดยไม่วางระบบ และ (2) การพึ่งพาฮีโร่หรือผู้นำคนเดียวที่พอเปลี่ยนคนระบบก็ล่ม",
      render: () => `
        <div class="st1-split-fig-left">
          ${figPlate(
            "st1_fig5_blind_men_elephant.png",
            "ภาพที่ 5 มุมมองการคิดแบบแยกส่วนในลักษณะตาบอดคลำช้าง",
            "<strong>ภาพที่ 5 มุมมองการคิดแบบแยกส่วน “ตาบอดคลำช้าง”</strong> · อ้างอิงภาพจาก Camilleri (2013) ใน บวรศม ลีระพันธ์",
            "FIG. 5 · FRAGMENTED SILOS VS. WHOLE-SYSTEM PERSPECTIVE"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">EVENT-FOCUSED TRAP · อาการของการทำงานไร้ระบบ</span>
              <h3 class="or-card-title">“คิดเป็นรายเหตุการณ์ ทั้งชีวิตมีแต่การรณรงค์”</h3>
              <p class="or-card-text">ดังที่ โกมาตร จึงเสถียรทรัพย์ (2558) สรุปไว้ว่า <em>“คิดเป็นรายเหตุการณ์ ระบบงานไม่ต้องเซ็ต ทำเสร็จแต่งานเฉพาะหน้า แก้ปัญหาแบบเฉพาะกิจ ทั้งชีวิตมีแต่การรณรงค์”</em> — เหนื่อยหนักแต่ปัญหาเดิมวนกลับมาทุกปี</p>
            </div>

            <div class="or-card is-amber-tint">
              <span class="or-card-kicker">HERO-DEPENDENT FRAGILITY · กับดักการพึ่งผู้นำคนเดียว</span>
              <h3 class="or-card-title">เก่งเฉพาะตัวแต่ขาดโครงสร้างรองรับ ย่อมไม่ยั่งยืน</h3>
              <p class="or-card-text">โครงการสุขภาพที่ขับเคลื่อนด้วยบารมีหรือความทุ่มเทเฉพาะตัวของบุคคลเดียวโดยไม่สร้างความสัมพันธ์และกติกาของทีม เมื่อผู้นำย้ายออกระบบก็หยุดชะงักและขยายผลต่อไม่ได้</p>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">PHYSICIAN AS SYSTEMS THINKER · แพทย์นักคิดเชิงระบบ</span>
              <h3 class="or-card-title">เชื่อมสาเหตุโรคเข้ากับบริการสุขภาพและปัจจัยทางสังคม</h3>
              <p class="or-card-text">ทำความเข้าใจความสัมพันธ์ (<code>Relationships</code>) และพฤติกรรม (<code>Behaviors</code>) ของผู้คนและองค์กรในระบบที่มีพลวัต เพื่อวางระบบงานระยะยาวร่วมกับสหวิชาชีพและชุมชน (de Savigny &amp; Adam, 2009)</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s12-iceberg-model",
      num: "12",
      section: "act3",
      sectionLabel: "Act III · Iceberg & Leverage",
      actClass: "is-act-3",
      actLabel: "ACT III · 4-LEVEL ICEBERG MODEL",
      timeWindow: "11.10 – 11.20 น. (10 นาที)",
      kicker: "4.2 · THE SYSTEMS THINKING ICEBERG MODEL (SENGE, 2006; MONAT & GANNON, 2015; STROH, 2015)",
      title: "แบบจำลองภูเขาน้ำแข็ง 4 ระดับ: จากเหตุการณ์เหนือผิวน้ำสู่จุดคานงัดใต้ผิวน้ำ",
      keyMessageHtml:
        "<strong>“โครงสร้างกำหนดพฤติกรรม และกรอบความคิดหล่อหลอมโครงสร้าง”</strong> — ยิ่งส่องลึกใต้ผิวน้ำ พลังจุดคานงัด (<code>Leverage</code>) เพื่อความยั่งยืนยิ่งสูงขึ้น",
      notes:
        "ใช้ภาพที่ 6 อธิบายการไล่คำถาม 4 ชั้น: (1) Events เกิดอะไรขึ้นตอนนี้? -> Reactive, (2) Patterns เกิดแนวโน้มใดซ้ำ ๆ ตามเวลา? -> Adaptive, (3) Systemic Structures กติกาและวงจรย้อนกลับใดผลิตซ้ำแนวโน้มนี้? -> Generative, และ (4) Mental Models ความเชื่อใดค้ำจุนโครงสร้างเดิมไว้? -> Transformative ย้ำว่าการกู้ชีพระดับ Events ยังจำเป็นเร่งด่วนเสมอ แต่ต้องไม่หยุดอยู่แค่ผิวน้ำ",
      render: () => `
        <div class="st1-split-fig-wide">
          ${figPlate(
            "st1_fig6_iceberg_model.png",
            "ภาพที่ 6 แบบจำลองภูเขาน้ำแข็งของการคิดเชิงระบบ แสดงการวิเคราะห์ปัญหาสุขภาพสี่ระดับและพลังจุดคานงัด",
            "<strong>ภาพที่ 6 แบบจำลองภูเขาน้ำแข็งของการคิดเชิงระบบ</strong> · สังเคราะห์จาก Senge (2006), Monat &amp; Gannon (2015) และ Stroh (2015)",
            "FIG. 6 · EVENTS → PATTERNS → SYSTEMIC STRUCTURES → MENTAL MODELS"
          )}

          <div class="or-stack-col" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">ABOVE &amp; SHALLOW WATER · ระดับที่ 1 – 2</span>
              <h3 class="or-card-title">จำเป็นต่อการกู้ชีพและเฝ้าระวัง แต่แก้ซ้ำไม่รู้จบ</h3>
              <p class="or-card-text"><strong>1. Events (Reactive):</strong> ดับไฟรายวันเมื่อเกิดวิกฤตเฉพาะหน้า<br><strong>2. Patterns (Adaptive):</strong> เห็นแนวโน้มตามฤดูกาลหรือกลุ่มเสี่ยงจึงจัดเวรสำรองรับมือ แต่รากของปัญหายังคงผลิตซ้ำผู้ป่วยรายใหม่</p>
            </div>

            <div class="or-card is-violet-tint">
              <span class="or-card-kicker">DEEP LEVERAGE POINTS · ระดับที่ 3 – 4</span>
              <h3 class="or-card-title">ปรับโครงสร้างและกระบวนทัศน์เพื่อเปลี่ยนผลลัพธ์ระยะยาว</h3>
              <p class="or-card-text"><strong>3. Systemic Structures (Generative):</strong> ปรับกติกา การจัดสรรทรัพยากร และวงจรป้อนกลับของระบบบริการ<br><strong>4. Mental Models (Transformative):</strong> เปลี่ยนสมมติฐานและความเชื่อฝังลึกที่ค้ำจุนโครงสร้างเดิมไว้ — <strong>มีพลังจุดคานงัดสูงสุด</strong></p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s13-iceberg-cases",
      num: "13",
      section: "act3",
      sectionLabel: "Act III · Iceberg & Leverage",
      actClass: "is-act-3",
      actLabel: "ACT III · ICEBERG CASE MATRIX",
      timeWindow: "11.20 – 11.30 น. (10 นาที)",
      kicker: "4.2 · TABLE 3: APPLYING THE 4-LEVEL ICEBERG MODEL TO ER CROWDING & CHRONIC CARE",
      title: "ฝึกประยุกต์ภูเขาน้ำแข็ง 4 ระดับ: กรณีห้องฉุกเฉินแออัด เทียบกับ กรณีโรคเรื้อรังคุมไม่ได้",
      keyMessageHtml:
        "ฝึกตั้งคำถามไล่ระดับจาก <code>Events</code> สู่ <code>Mental Models</code> เพื่อเตรียมนำไปวิเคราะห์ปัญหาจริงใน <strong>HS1–HS6</strong> และ <strong>โรงพยาบาลชุมชนภาคสนาม</strong>",
      notes:
        "ชวนนักศึกษาอ่านเทียบแนวขวางและแนวดิ่งในตารางที่ 3: สังเกตว่าทั้งกรณี ER แออัด และกรณีผู้ป่วยเบาหวานวัยทำงานขาดนัด ต่างมีโครงสร้างระบบ (เช่น เวลาเปิดคลินิกปฐมภูมิ การดึงงบ การนัดสั้นแบบตั้งรับ) และกรอบความคิด (รพ.ใหญ่คือคำตอบเดียว / แพทย์คือผู้สั่งการ) ซ่อนอยู่ใต้ผิวน้ำ",
      render: () => `
        <div class="or-table-wrap is-st1-table" data-fit-table="1" data-mobile-scroll-hint="⇄ เลื่อนตารางซ้าย–ขวาเพื่อดูการวิเคราะห์ครบทั้ง 4 ระดับ">
          <table class="or-table">
            <thead>
              <tr>
                <th style="width:22%">ระดับและคำถามหลัก (ตารางที่ 3)</th>
                <th style="width:16%">ระดับการตอบสนอง</th>
                <th style="width:31%">กรณีห้องฉุกเฉินแออัด (Glouberman, 2000)</th>
                <th style="width:31%">กรณีโรคเรื้อรังคุมไม่ได้ (Holman &amp; Lorig, 2000)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. เหตุการณ์ (Events)</strong><br><span class="or-td-sub">เกิดอะไรขึ้นในขณะนี้?</span></td>
                <td><span class="or-tag-inline is-formative">Reactive</span><br><strong>ตั้งรับเฉพาะหน้า</strong></td>
                <td>คืนนี้ผู้ป่วยล้นห้องฉุกเฉิน รอคิวนานกว่า 4 ชม. จึงเรียกแพทย์เวรเสริมเฉพาะกิจ</td>
                <td>วันนี้ผู้ป่วยเบาหวานน้ำตาลสูงวิกฤตฉุกเฉิน จึงให้สารน้ำและอินซูลินกู้ชีพ</td>
              </tr>
              <tr>
                <td><strong>2. แนวโน้ม (Patterns)</strong><br><span class="or-td-sub">เกิดอะไรซ้ำ ๆ ตามเวลา?</span></td>
                <td><span class="or-tag-inline is-formative">Adaptive</span><br><strong>คาดการณ์ปรับตัว</strong></td>
                <td>สัดส่วนผู้ป่วยไม่ฉุกเฉินมาช่วงเย็นและวันหยุดเพิ่มขึ้นทุกปี จึงจัดเวรเพิ่มตามช่วงเวลา</td>
                <td>อัตรารับไว้รักษาซ้ำ ขาดนัด และไตเสื่อมในกลุ่มวัยทำงานหาเช้ากินค่ำสูงต่อเนื่องทุกปี</td>
              </tr>
              <tr>
                <td><strong>3. โครงสร้างระบบ (Structures)</strong><br><span class="or-td-sub">กติกาและวงจรใดผลิตซ้ำแนวโน้มนี้?</span></td>
                <td><span class="or-tag-inline is-summative">Generative</span><br><strong>ออกแบบระบบใหม่</strong></td>
                <td>คลินิกปฐมภูมิเปิดเฉพาะเวลาราชการและถูกดึงงบไปโปะ ER จนเกิดวงจรอุบาทว์ → <strong>ขยายปฐมภูมินอกเวลาและทีมหมอครอบครัว</strong></td>
                <td>คลินิกจัดแบบตั้งรับนัดสั้น ๆ ชนเวลาทำมาหากิน → <strong>เปลี่ยนเป็นระบบดูแลต่อเนื่องยืดหยุ่น ชี้แนะดูแลตนเอง และเชื่อม รพ.สต./ชุมชน</strong></td>
              </tr>
              <tr>
                <td><strong>4. กรอบความคิด (Mental Models)</strong><br><span class="or-td-sub">ความเชื่อใดค้ำจุนโครงสร้างเดิมไว้?</span></td>
                <td><span class="or-tag-inline is-summative">Transformative</span><br><strong>เปลี่ยนกระบวนทัศน์</strong></td>
                <td>เปลี่ยนจาก <em>“รพ.ใหญ่และ ER คือที่พึ่งแรกสุด”</em> เป็น <strong>“ปฐมภูมิใกล้บ้านคือฐานหลักของการดูแลต่อเนื่อง”</strong></td>
                <td>เปลี่ยนจาก <em>“แพทย์สั่งและผู้ป่วยไม่ร่วมมือ”</em> เป็น <strong>“ผู้ป่วยและครอบครัวคือหุ้นส่วนหลักในการจัดการชีวิตร่วมกับทีมสุขภาพ”</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    },
    {
      id: "s14-systems-vs-systematic",
      num: "14",
      section: "act3",
      sectionLabel: "Act III · Iceberg & Leverage",
      actClass: "is-act-3",
      actLabel: "ACT III · SYSTEMS VS. SYSTEMATIC THINKING",
      timeWindow: "11.30 – 11.40 น. (10 นาที)",
      kicker: "4.3 · SYSTEMS THINKING VS. SYSTEMATIC THINKING & REALIST HPSR INQUIRY (GILSON, 2012)",
      title: "แยกแยะ “การคิดเชิงระบบ” ออกจาก “การคิดอย่างเป็นระบบ” สู่คำถามวิจัยพัฒนาระบบสุขภาพ",
      keyMessageHtml:
        "ผสานขั้นตอนที่เป็นระเบียบ (<code>Systematic</code>) เข้ากับความเข้าใจพลวัตทั้งระบบ (<code>Systems</code>) เพื่อตอบว่า <strong>“มาตรการใดได้ผลดี สำหรับใคร และภายใต้บริบทใด”</strong>",
      notes:
        "เน้นคำศัพท์คู่ที่มักสับสนในภาษาไทย: Systematic thinking (คิดอย่างเป็นระบบ = คิดเป็นลำดับขั้นตอนชัดเจน เช่น กระบวนการวิทยาศาสตร์ หรือหลักโยนิโสมนสิการ) เทียบกับ Systems thinking (คิดเชิงระบบ = เข้าใจความเชื่อมโยงและวงจรย้อนกลับของระบบซับซ้อนทั้งหมด) ซึ่งนำไปสู่คำถามวิจัยระบบสุขภาพของ Gilson (2012)",
      render: () => `
        <div class="st1-split-2col-bottom-banner">
          <div class="st1-full-grid-2" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">SYSTEMATIC THINKING · การคิดอย่างเป็นระบบ</span>
              <h3 class="or-card-title">คิดตามลำดับขั้นตอนและระเบียบวิธีที่ชัดเจน</h3>
              <ul class="or-list">
                <li><strong>จุดเน้น:</strong> ความมีระเบียบแบบแผน ลำดับก่อน–หลัง และตรรกะเหตุผลทีละขั้นอย่างรัดกุม (Monat &amp; Gannon, 2015)</li>
                <li><strong>ตัวอย่างสำคัญ:</strong> <strong>หลักโยนิโสมนสิการ</strong> คิดสืบสาวเหตุปัจจัยตามลำดับ (สมเด็จพระพุทธโฆษาจารย์ [ป. อ. ปยุตฺโต], 2557) และ <strong>กระบวนการทางวิทยาศาสตร์</strong> (ตั้งสมมติฐาน → ทดลอง → สรุปผล)</li>
                <li><strong>ข้อสังเกต:</strong> มีคุณค่าสูงมาก แต่หากใช้ลำพังโดยไม่มองทั้งระบบ อาจพลาดวงจรป้อนกลับและผลข้างเคียงในระบบซับซ้อน</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">SYSTEMS THINKING · การคิดเชิงระบบ</span>
              <h3 class="or-card-title">เข้าใจความเชื่อมโยง วงจรย้อนกลับ และพลวัตของทั้งระบบ</h3>
              <ul class="or-list">
                <li><strong>จุดเน้น:</strong> ปฏิสัมพันธ์ระหว่างองค์ประกอบย่อย บริบทแวดล้อม คุณสมบัติผุดบังเกิด และวงจรป้อนกลับ (<code>R</code> / <code>B</code>) ของ <code>CAS</code></li>
                <li><strong>ตัวอย่างสำคัญ:</strong> การวิเคราะห์วงจรอุบาทว์ความแออัดห้องฉุกเฉินควบคู่ระบบปฐมภูมิ และการใช้แบบจำลองภูเขาน้ำแข็งส่องถึงโครงสร้างและกรอบความคิด</li>
                <li><strong>พลังร่วม:</strong> แพทย์ที่ดีต้องใช้ทั้ง <code>Systematic</code> (รัดกุมเป็นขั้นตอน) และ <code>Systems</code> (มองเห็นภาพรวมและจุดคานงัด) คู่กัน</li>
              </ul>
            </div>
          </div>

          <div class="or-card is-violet-tint" data-fit-solo="1">
            <div class="or-card-head-inline">
              <span class="or-card-kicker">CORE HPSR QUESTION · คำถามหลักเพื่อพัฒนาระบบสุขภาพ (GILSON, 2012)</span>
              <span class="or-mini-chip">Problem Solver + Change Agent</span>
            </div>
            <p class="or-card-text">ก้าวข้ามคำถามแบบเส้นตรงว่า <em>“มาตรการนี้ได้ผลหรือไม่?”</em> ไปสู่คำถามเชิงระบบว่า <strong>“กระบวนการหรือมาตรการใดทำงานได้ผลดี ได้ผลดีสำหรับใคร และได้ผลดีภายใต้บริบทหรือเงื่อนไขใด” (<em>“What works, for whom, and under what circumstances?”</em>)</strong></p>
          </div>
        </div>
      `
    },
    {
      id: "s15-live-quiz",
      num: "15",
      section: "act4",
      sectionLabel: "Act IV · Quiz & Bridge",
      actClass: "is-act-4",
      actLabel: "ACT IV · INTERACTIVE CONCEPT CHECK",
      timeWindow: "11.40 – 11.52 น. (12 นาที)",
      kicker: "05 · CLASSROOM CONCEPT RECHECK (5 HIGH-YIELD SCENARIOS)",
      title: "ทบทวนความเข้าใจท้ายคาบ (ST1 Concept Check): บริบท · CAS · คลินิก · CLD · ภูเขาน้ำแข็ง",
      keyMessageHtml:
        "เลือกคำตอบทั้ง 5 ข้อเพื่อตรวจสอบความแม่นยำของกรอบคิดเชิงระบบก่อนนำไปใช้จริงใน <strong>HS1–HS6</strong> และ <strong>ภาคสนาม 9 โรงพยาบาลชุมชน</strong>",
      notes:
        "ชวนนักศึกษาทั้งห้องร่วมตอบคำถามทบทวน 5 ข้อ (สามารถเปิดบนมือถือ/แท็บเล็ตของแต่ละคนและกดตรวจคำตอบพร้อมกัน หรืออาจารย์กดปุ่ม 'เฉลยหน้าชั้นเรียน' เพื่ออภิปรายเหตุผลทีละข้อ)",
      isLiveQuizSlide: true,
      render: () => renderQuizStageHtml(true)
    },
    {
      id: "s16-bridge-forward",
      num: "16",
      section: "act4",
      sectionLabel: "Act IV · Quiz & Bridge",
      actClass: "is-act-4",
      actLabel: "ACT IV · SYNTHESIS & FIELDWORK LAUNCH",
      timeWindow: "11.52 – 12.00 น. (8 นาที)",
      kicker: "06 · TAKEAWAYS & BRIDGE ACROSS THE 6-WEEK RACM 303 JOURNEY",
      title: "บทสรุป ST1 และการส่งต่อเลนส์คิดเชิงระบบสู่ HS1–HS6 ภาคสนาม 9 แห่ง และฟอร์ม 3A",
      keyMessageHtml:
        "พกคำถาม 4 ชั้นของ <strong>ภูเขาน้ำแข็ง</strong> และสายตาสังเกต <strong>วงจรป้อนกลับของ CAS</strong> ไปใช้ตั้งแต่วันนี้จนถึงวันนำเสนอผลงานภาคสนาม",
      notes:
        "สรุปรวบยอดสาระสำคัญทั้ง 4 หมวดของ ST1 และชี้จุดเชื่อมต่อทันที: บ่ายวันนี้ 13.00–16.00 น. พบกับเวทีเสวนา Bedside to Systems-Based Practice: Global/Planetary Health & HPSR ณ ห้อง 2C2-03 จากนั้นต่อยอดสู่ HS1–HS6 การลงพื้นที่ 9 รพช. และกลับมาฝึกวาด CLD จากโจทย์พื้นที่จริงในวันอังคารที่ 22 ธ.ค. 13.00–16.30 น.",
      render: () => `
        <div class="st1-full-grid-2">
          <div class="or-stack-col" data-fit-group="left-sum">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">TAKEAWAY 1 &amp; 2 · ระบบ บริบท และธรรมชาติของ CAS</span>
              <h3 class="or-card-title">มองความสัมพันธ์ภายใต้บริบท ไม่ติดกับดักสูตรตายตัว</h3>
              <p class="or-card-text">ระบบแปลง <code>Input → Process → Output</code> ภายใต้ขอบเขตและบริบทที่เปลี่ยนได้เสมอ ระบบสุขภาพเป็น <strong>ระบบซับซ้อนที่ปรับตัวได้ (CAS)</strong> เสมือนการเลี้ยงลูก จึงต้องเกื้อหนุนการเรียนรู้จากภายในแทนการซ่อมแยกชิ้นส่วน</p>
            </div>

            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">TAKEAWAY 3 &amp; 4 · วงจรป้อนกลับและจุดคานงัดใต้ผิวน้ำ</span>
              <h3 class="or-card-title">ตัดวงจรอุบาทว์ด้วยปฐมภูมิ และขยับคานงัดสู่โครงสร้าง–กรอบคิด</h3>
              <p class="or-card-text">สื่อสารความไม่แน่นอนในคลินิก สร้างความเป็นหุ้นส่วนในโรคเรื้อรัง เสริมปฐมภูมิเพื่อตัดวงจรเสริมแรง <code>R</code> ของห้องฉุกเฉิน และใช้ <strong>ภูเขาน้ำแข็ง 4 ระดับ</strong> ตอบว่าอะไรได้ผล สำหรับใคร และภายใต้บริบทใด</p>
            </div>
          </div>

          <div class="or-stack-col" data-fit-group="right-steps">
            <div class="or-card is-white">
              <span class="or-card-kicker">① วันนี้ · 13.00 – 16.00 น. (ห้อง 2C2-03)</span>
              <p class="or-card-text"><strong>เวทีเสวนา <code>Bedside to Systems-Based Practice</code>: สุขภาพโลก สุขภาพดาวเคราะห์ และ HPSR สู่นโยบายสาธารณะ</strong></p>
            </div>
            <div class="or-card is-white">
              <span class="or-card-kicker">② สัปดาห์ที่ 1 – 3 · บทเรียน HS1 – HS6 &amp; Self-Quiz</span>
              <p class="or-card-text"><strong>ทบทวน <code>Self-Quiz ST1</code> (6 ข้อ · 14 คำศัพท์) และใช้เลนส์ CAS วิเคราะห์ 6 องค์ประกอบระบบสุขภาพครบทุกคาบ</strong></p>
            </div>
            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">③ สัปดาห์ที่ 4 · ฝึกปฏิบัติภาคสนาม 9 โรงพยาบาลชุมชน</span>
              <p class="or-card-text"><strong>สังเกตบริบทพื้นที่ ความเชื่อมโยงของระบบอำเภอ และรากปัญหาใต้ภูเขาน้ำแข็ง พร้อมบันทึกสะท้อนคิดใน <code>SRN 1–2</code></strong></p>
            </div>
            <div class="or-card is-violet-tint">
              <span class="or-card-kicker">④ อังคาร 22 ธ.ค. (13.00–16.30 น.) &amp; นำเสนอฟอร์ม 3A (29 ธ.ค.)</span>
              <p class="or-card-text"><strong>นำโจทย์พื้นที่จริงมาสังเคราะห์ <code>CLD &amp; System Archetypes</code> เพื่อออกแบบข้อเสนอระดับจุดคานงัดที่ยั่งยืน</strong></p>
            </div>
          </div>
        </div>
      `
    }
  ];

  const SECTION_FILTERS = [
    { id: "all", labelTh: "ทั้งหมด (16)", labelEn: "All Slides (16)" },
    { id: "intro", labelTh: "เปิดคาบ & แผนการเรียน (2)", labelEn: "Opening & Roadmap (2)" },
    { id: "act1", labelTh: "Act I · ระบบ บริบท & CAS (4)", labelEn: "Act I · Systems & CAS (4)" },
    { id: "act2", labelTh: "Act II · คลินิก & วงจร ER (4)", labelEn: "Act II · Clinical & ER CLD (4)" },
    { id: "act3", labelTh: "Act III · ภูเขาน้ำแข็ง & คานงัด (4)", labelEn: "Act III · Iceberg & Leverage (4)" },
    { id: "act4", labelTh: "Act IV · Quiz & เชื่อมภาคสนาม (2)", labelEn: "Act IV · Quiz & Bridge (2)" }
  ];

  /* ---------- Per-Frame Bidirectional Binary-Search Auto-Fit Typography (--fit-scale) ---------- */
  function isPhoneReflowMode() {
    const w = window.innerWidth || 1024;
    const h = window.innerHeight || 768;
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
      if (els[i].clientHeight > 0 && h2[i] - h1[i] <= Math.max(16, h1[i] * 0.24)) {
        bounded.push(els[i]);
      }
    }
    return bounded;
  }

  function singleBoxFitsCleanly(el) {
    if (el.clientHeight <= 0 || el.clientWidth <= 0) return true;
    if (el.scrollHeight > el.clientHeight + 1) return false;
    if (el.scrollWidth > el.clientWidth + 1) return false;

    const cs = window.getComputedStyle(el);
    const padT = parseFloat(cs.paddingTop) || 0;
    const padB = parseFloat(cs.paddingBottom) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const bT = parseFloat(cs.borderTopWidth) || 0;
    const bB = parseFloat(cs.borderBottomWidth) || 0;
    const bR = parseFloat(cs.borderRightWidth) || 0;
    const r = el.getBoundingClientRect();
    const innerTop = r.top + bT + padT - 1.0;
    const innerBot = r.bottom - bB - padB + 1.0;
    const innerRight = r.right - bR - padR + 1.5;

    const kids = el.children;
    for (let k = 0; k < kids.length; k += 1) {
      const kid = kids[k];
      const kcs = window.getComputedStyle(kid);
      if (kcs.display === "none" || kcs.position === "absolute") continue;
      const kr = kid.getBoundingClientRect();
      if (kr.height <= 0 && kr.width <= 0) continue;
      if (kr.top < innerTop || kr.bottom > innerBot || kr.right > innerRight) {
        return false;
      }
    }
    return true;
  }

  function boxesFitCleanly(els) {
    for (let i = 0; i < els.length; i += 1) {
      if (!singleBoxFitsCleanly(els[i])) return false;
    }
    return true;
  }

  function tablesFitCleanly(wraps) {
    for (let i = 0; i < wraps.length; i += 1) {
      const w = wraps[i];
      const tbl = w.querySelector(".or-table");
      if (!tbl || w.clientHeight <= 0 || w.clientWidth <= 0) continue;
      if (tbl.offsetHeight > w.clientHeight - 1) return false;
      if (w.scrollHeight > w.clientHeight + 1) return false;
      if (tbl.scrollWidth > w.clientWidth + 1) return false;
    }
    return true;
  }

  function findMaxScaleForBox(el, checkFn, minS, maxS, safetyFactor) {
    let lo = minS;
    let hi = maxS;
    for (let step = 0; step < 14; step += 1) {
      const mid = (lo + hi) * 0.5;
      el.style.setProperty("--fit-scale", mid.toFixed(4));
      if (checkFn([el])) lo = mid;
      else hi = mid;
    }
    return Math.max(minS, lo * safetyFactor);
  }

  function binarySearchUniformScale(els, checkFn, minS, maxS, safetyFactor) {
    const bounded = filterBoundedGroup(els);
    els.forEach((el) => {
      if (bounded.indexOf(el) === -1) el.style.removeProperty("--fit-scale");
    });
    if (!bounded.length) return;
    let lo = minS;
    let hi = maxS;
    for (let step = 0; step < 14; step += 1) {
      const mid = (lo + hi) * 0.5;
      for (let i = 0; i < bounded.length; i += 1) {
        bounded[i].style.setProperty("--fit-scale", mid.toFixed(4));
      }
      if (checkFn(bounded)) lo = mid;
      else hi = mid;
    }
    const finalScale = Math.max(minS, lo * safetyFactor);
    for (let i = 0; i < bounded.length; i += 1) {
      bounded[i].style.setProperty("--fit-scale", finalScale.toFixed(4));
    }
  }

  function fitHarmonizedCardGroup(els, minS, maxS, safetyFactor, maxSiblingSpread) {
    if (!els.length) return;
    const bounded = filterBoundedGroup(els);
    els.forEach((el) => {
      if (bounded.indexOf(el) === -1) el.style.removeProperty("--fit-scale");
    });
    if (!bounded.length) return;
    const rawScales = bounded.map((el) => findMaxScaleForBox(el, boxesFitCleanly, minS, maxS, safetyFactor));
    const minGroupScale = Math.min.apply(null, rawScales);
    const cap = minGroupScale * (maxSiblingSpread || 1.26);
    for (let i = 0; i < bounded.length; i += 1) {
      const s = Math.min(rawScales[i], cap);
      bounded[i].style.setProperty("--fit-scale", s.toFixed(4));
    }
  }

  function verifyPostMeasureFit(els, checkSingleFn, minS) {
    for (let i = 0; i < els.length; i += 1) {
      const el = els[i];
      const curStr = el.style.getPropertyValue("--fit-scale");
      if (!curStr) continue;
      let s = parseFloat(curStr);
      if (!Number.isFinite(s)) continue;
      for (let guard = 0; guard < 5; guard += 1) {
        if (checkSingleFn(el)) break;
        s = Math.max(minS, s * 0.96);
        el.style.setProperty("--fit-scale", s.toFixed(4));
      }
    }
  }

  function fitSingleSlideCanvas(canvas) {
    if (!canvas || canvas.classList.contains("is-live-canvas") || canvas.classList.contains("is-quiz-slide-canvas")) {
      return;
    }
    const allScaled = Array.from(canvas.querySelectorAll(".or-card, .or-table-wrap, .or-cover-kpi, .or-cover-act-chip"));
    if (isPhoneReflowMode() && !document.body.classList.contains("is-printing-st1-deck")) {
      allScaled.forEach((el) => el.style.removeProperty("--fit-scale"));
      return;
    }
    if (canvas.clientWidth < 120 || canvas.clientHeight < 80) return;

    canvas.setAttribute("data-measuring", "1");

    if (canvas.classList.contains("is-cover-canvas")) {
      const kpis = Array.from(canvas.querySelectorAll(".or-cover-kpi"));
      if (kpis.length) binarySearchUniformScale(kpis, boxesFitCleanly, 0.48, 1.85, 0.95);
      const acts = Array.from(canvas.querySelectorAll(".or-cover-act-chip"));
      if (acts.length) fitHarmonizedCardGroup(acts, 0.48, 1.95, 0.95, 1.18);
      canvas.removeAttribute("data-measuring");
      verifyPostMeasureFit(kpis.concat(acts), singleBoxFitsCleanly, 0.45);
      return;
    }

    canvas.querySelectorAll("[data-fit-group]").forEach((grp) => {
      const targets = Array.from(grp.querySelectorAll(":scope > .or-card"));
      if (targets.length) {
        fitHarmonizedCardGroup(targets, 0.45, 2.45, 0.955, 1.25);
      }
    });

    canvas.querySelectorAll("[data-fit-solo]").forEach((box) => {
      if (isAutoHeightBox(box)) {
        box.style.removeProperty("--fit-scale");
        return;
      }
      const s = findMaxScaleForBox(box, boxesFitCleanly, 0.45, 2.35, 0.95);
      box.style.setProperty("--fit-scale", s.toFixed(4));
    });

    const tableWraps = Array.from(canvas.querySelectorAll("[data-fit-table]"));
    tableWraps.forEach((tw) => {
      if (isAutoHeightBox(tw)) {
        tw.style.removeProperty("--fit-scale");
        return;
      }
      const s = findMaxScaleForBox(tw, tablesFitCleanly, 0.45, 2.15, 0.96);
      tw.style.setProperty("--fit-scale", s.toFixed(4));
    });

    canvas.removeAttribute("data-measuring");

    const nonTableBoxes = allScaled.filter((el) => !el.hasAttribute("data-fit-table"));
    verifyPostMeasureFit(nonTableBoxes, singleBoxFitsCleanly, 0.44);
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
      if (!img.complete) {
        img.addEventListener("load", scheduleFitOnResize, { once: true });
      }
    });
  }

  function formatTimer(sec) {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")} / 150:00`;
  }

  function clearAutoPlayTimer() {
    if (state.autoPlayTimeout) {
      clearTimeout(state.autoPlayTimeout);
      state.autoPlayTimeout = null;
    }
  }

  function scheduleAutoPlayTick() {
    clearAutoPlayTimer();
    if (!state.isOpen || !state.autoPlay || state.viewMode !== "deck") return;
    state.autoPlayTimeout = setTimeout(() => {
      if (!state.isOpen || !state.autoPlay || state.viewMode !== "deck") return;
      if (state.slideIdx < SLIDES.length - 1) {
        state.slideIdx += 1;
        renderModal();
      } else {
        state.autoPlay = false;
        renderModal();
      }
    }, AUTOPLAY_MS);
  }

  function toggleAutoPlay() {
    if (state.viewMode !== "deck") state.viewMode = "deck";
    state.autoPlay = !state.autoPlay;
    state.toolsMenuOpen = false;
    if (state.autoPlay && state.slideIdx >= SLIDES.length - 1) state.slideIdx = 0;
    renderModal();
  }

  function toggleTimer() {
    if (state.timerRunning) {
      state.timerRunning = false;
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
      }
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
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    renderModal();
  }

  function renderCoverRightCardHtml(isHandout) {
    const joinUrl = ROLE === "faculty" ? PROD_STUDENT_DECK_URL : PROD_STUDENT_DECK_URL;
    const qrSvg = buildQrSvg(joinUrl);
    const isDark = getEffectiveIoTheme() === "dark";
    const heroFile = isDark ? "st1_s01_hero_dark.png" : "st1_s01_hero.png";

    if (state.coverPaneMode === "hero" || isHandout) {
      return `
        <div class="orl-cover-card is-hero-view">
          <div class="orl-cover-head">
            <span class="orl-live-pill"><span class="orl-dot is-online"></span> ST1 VISUAL ARCHITECTURE</span>
            ${
              !isHandout
                ? `<button type="button" class="orl-mini-switch" data-st1-act="show-cover-lobby">📱 สลับหน้า QR &amp; ห้องเรียนสด</button>`
                : ""
            }
          </div>
          <figure class="or-fig-plate is-cover-hero" style="flex:1;min-height:0">
            <div class="or-fig-img-wrap">
              <img class="or-fig-img" data-base-img="st1_s01_hero.png" src="${IMG_DIR}/${heroFile}?v=${ASSET_VER}" alt="ST1 Visual Architecture: Systems, CAS, ER CLD, and Iceberg Model" loading="eager" decoding="async" />
            </div>
          </figure>
        </div>
      `;
    }

    let answeredCnt = 0;
    QUIZ_ITEMS.forEach((q) => {
      if (Object.prototype.hasOwnProperty.call(state.quizAnswers, q.id)) answeredCnt += 1;
    });

    return `
      <div class="orl-cover-card">
        <div class="orl-cover-head">
          <div class="orl-cover-head-left">
            <span class="orl-live-pill"><span class="orl-dot is-online"></span> SCAN เปิดสไลด์พร้อมกัน · ST1</span>
            <span class="orl-sync-sub">รองรับมือถือ · iPad · โน้ตบุ๊ก</span>
          </div>
          <div class="orl-cover-head-actions">
            <button type="button" class="orl-mini-switch" data-st1-act="zoom-qr" title="ขยาย QR Code เต็มจอ">🔍 ขยาย QR</button>
            <button type="button" class="orl-mini-switch" data-st1-act="show-cover-hero" title="สลับดูภาพโครงสร้างบทเรียน ST1">🖼️ ภาพปก</button>
          </div>
        </div>

        <div class="orl-cover-body">
          <div class="orl-cover-qr-col">
            <button type="button" class="orl-qr-frame-btn" data-st1-act="zoom-qr" title="แตะเพื่อขยาย QR Code ขนาดใหญ่">
              ${qrSvg}
            </button>
            <div class="orl-qr-url-box">
              <span class="orl-qr-scan-kicker">📱 สแกนเปิดสไลด์ &amp; ทำ Quiz ท้ายคาบ</span>
              <code class="orl-qr-url-code">racm303-2569-student/#st1</code>
            </div>
          </div>

          <div class="orl-cover-info-col">
            <div class="orl-count-hero-box">
              <div class="orl-count-nums">
                <span class="orl-count-big">16</span>
                <span class="orl-count-denom">สไลด์หลัก · 2.5 ชม.</span>
              </div>
              <span class="orl-count-caption">📘 ฉบับเต็ม &amp; ฉบับย่อ · 🧠 Concept Check ${answeredCnt}/5 ข้อ</span>
            </div>

            <div class="orl-topic-tags">
              <span class="orl-tag is-do">🧭 Boundary &amp; Contexts</span>
              <span class="orl-tag is-osmu">🌱 CAS 5 คุณสมบัติ</span>
              <span class="orl-tag is-exam">↻ ER CLD (Loop R)</span>
              <span class="orl-tag is-ai">🧊 Iceberg 4 ระดับ</span>
            </div>

            <div class="orl-chips-stream">
              <div class="orl-empty-onboard">
                <div class="orl-eo-kicker">📲 เริ่มต้นเรียนคาบ ST1 ร่วมกันใน 3 ขั้นตอน</div>
                <div class="orl-eo-steps">
                  <div class="orl-eo-step"><span class="orl-eo-num">1</span><span>สแกน <strong>QR Code</strong> ด้านซ้ายเพื่อเปิดสไลด์ 16:9 คมชัดบนอุปกรณ์ของตนเอง</span></div>
                  <div class="orl-eo-step"><span class="orl-eo-num">2</span><span>ใช้ 2 นิ้วถ่างซูมแผนภาพ <code>CAS</code>, <code>Stacey Matrix</code>, <code>CLD</code> และ <code>Iceberg</code> ได้ทุกหน้า</span></div>
                  <div class="orl-eo-step"><span class="orl-eo-num">3</span><span>ร่วมทำ <strong>ST1 Concept Check 5 ข้อ</strong> (สไลด์ 15) และดาวน์โหลด <code>.pptx</code> / <code>PDF</code></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="orl-cover-foot">
          <button type="button" class="orl-cta-btn is-launch-quiz" data-st1-act="start-slide-2">
            ▶ เริ่มเข้าสู่เนื้อหาสไลด์ที่ 02 &rarr;
          </button>
          <button type="button" class="orl-cta-btn is-lobby-expand" data-st1-act="jump-quiz">
            🧠 ไปหน้า Concept Check (5 ข้อ)
          </button>
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
              <div class="or-top-key-banner is-cover-key">
                <span class="or-top-key-text">${slide.keyMessageHtml}</span>
              </div>
            </div>

            <div class="or-cover-kpi-row">
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val">4</span>
                <span class="or-cover-kpi-lbl">วัตถุประสงค์หลัก</span>
              </div>
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val">5</span>
                <span class="or-cover-kpi-lbl">คุณสมบัติ CAS</span>
              </div>
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val">6</span>
                <span class="or-cover-kpi-lbl">แผนภาพแก่นสำคัญ</span>
              </div>
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val">4</span>
                <span class="or-cover-kpi-lbl">ระดับภูเขาน้ำแข็ง</span>
              </div>
            </div>

            <div class="or-cover-acts-grid">
              <div class="or-cover-act-chip"><strong>Act I · Systems &amp; CAS</strong><span>ขอบเขต บริบทแวดล้อม และ Simple / Complicated / CAS</span></div>
              <div class="or-cover-act-chip"><strong>Act II · Clinical &amp; ER CLD</strong><span>Stacey Matrix โรคเรื้อรัง และวงจรอุบาทว์ห้องฉุกเฉิน (R)</span></div>
              <div class="or-cover-act-chip"><strong>Act III · Iceberg Model</strong><span>ก้าวพ้นตาบอดคลำช้างสู่จุดคานงัด 4 ระดับ &amp; Realist Inquiry</span></div>
              <div class="or-cover-act-chip"><strong>Act IV · Check &amp; Bridge</strong><span>ทดสอบความเข้าใจ 5 ข้อ และเชื่อมสู่ HS1–6 &amp; ภาคสนาม</span></div>
            </div>
          </div>

          <div class="or-cover-right-col is-aura-stage">
            ${renderCoverRightCardHtml(isHandout)}
          </div>
        </div>

        <div class="or-cover-bottom">
          <div class="or-cover-meta-grid">
            <div class="or-cover-meta-item">
              <span class="or-cover-meta-lbl">สถานที่เรียน</span>
              <span class="or-cover-meta-val">ห้อง 2C2-03 ชั้น 2 อาคารพรีคลินิก (CNMI)</span>
            </div>
            <div class="or-cover-meta-item">
              <span class="or-cover-meta-lbl">ผู้สอนประจำคาบ</span>
              <span class="or-cover-meta-val">อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์</span>
            </div>
            <div class="or-cover-meta-item">
              <span class="or-cover-meta-lbl">ผู้ประพันธ์เอกสารคำสอน ST1</span>
              <span class="or-cover-meta-val">ผศ. นพ.บวรศม ลีระพันธ์ · อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์</span>
            </div>
          </div>
          <span class="or-cover-code-chip">${SLIDES.length} Slides · 16:9</span>
        </div>
      </div>
    `;
  }

  function renderSingleSlideCanvasHtml(slide, idx, animateDeck, isHandout) {
    const animCls = animateDeck ? " is-keynote-animated" : "";
    const ioTheme = getEffectiveIoTheme();
    if (slide.isCover) {
      return `
        <article class="or-slide-canvas is-io-pitch is-cover-canvas${animCls}" data-io-theme="${ioTheme}" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
          ${renderCoverSlideHtml(slide, isHandout)}
        </article>
      `;
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
            <div class="or-top-key-banner">
              <span class="or-top-key-text">${slide.keyMessageHtml}</span>
            </div>
          </header>
          <div class="or-sld-body">
            ${slide.render()}
          </div>
        </div>
        <footer class="or-sld-foot">
          <span class="or-sld-foot-course">RACM 303 · ST1: Systems &amp; Systems Thinking (บวรศม ลีระพันธ์ · ณัฐวุฒิ เอี่ยงธนรัตน์)</span>
          <span class="or-sld-foot-num">${String(idx + 1).padStart(2, "0")} / ${SLIDES.length}</span>
        </footer>
      </article>
    `;
  }

  function applyZoomToCurrentSlide(prevZoom, focalX, focalY) {
    const vp = document.getElementById("st1DeckViewport");
    if (!vp) return;
    const z = state.zoomScale || 1;
    vp.classList.toggle("is-zoomed", z > 1.02 || z < 0.98);
    document.querySelectorAll("[data-st1-zoom-label]").forEach((el) => {
      el.textContent = `${Math.round(z * 100)}%`;
    });
    const sizer = vp.querySelector(".or-slide-zoom-sizer");
    const canvas = vp.querySelector(".or-slide-canvas");
    if (!sizer || !canvas) return;

    if (Math.abs(z - 1) < 0.025) {
      sizer.style.width = "";
      sizer.style.height = "";
      canvas.style.transform = "";
      canvas.style.transformOrigin = "";
      return;
    }

    canvas.style.transform = "none";
    const baseW = Math.max(240, canvas.offsetWidth);
    const baseH = Math.max(180, canvas.offsetHeight);

    const vpRect = vp.getBoundingClientRect();
    const cx = typeof focalX === "number" ? focalX - vpRect.left : vp.clientWidth * 0.5;
    const cy = typeof focalY === "number" ? focalY - vpRect.top : vp.clientHeight * 0.5;
    const oldZ = prevZoom || 1;
    const contentX = (vp.scrollLeft + cx) / oldZ;
    const contentY = (vp.scrollTop + cy) / oldZ;

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

  function goToSlide(idx) {
    state.slideIdx = Math.max(0, Math.min(SLIDES.length - 1, idx));
    state.zoomScale = 1;
    state.toolsMenuOpen = false;
    broadcastHostSlide();
    renderModal();
    const vp = document.getElementById("st1DeckViewport");
    if (vp) {
      vp.scrollTop = 0;
      vp.scrollLeft = 0;
    }
  }

  function stepSlide(delta) {
    goToSlide(state.slideIdx + (Number(delta) || 0));
  }

  function goToSlideById(slideId) {
    const idx = SLIDES.findIndex((s) => s.id === slideId);
    state.isOpen = true;
    state.viewMode = "deck";
    state.autoPlay = false;
    if (idx >= 0) goToSlide(idx);
    else renderModal();
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
    canvas.addEventListener("mouseleave", () => {
      dot.hidden = true;
    });
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
    }, 160);
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
      exitPresentationMode();
    }
    renderModal();
  }

  function exitPresentationMode() {
    const modal = ensureModalElement();
    state.presentationMode = false;
    modal.classList.remove("is-presentation-mode");
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    renderModal();
  }

  function ensureModalElement() {
    let modal = document.getElementById("st1DeckModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "st1DeckModal";
    modal.className = "or-deck-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "ST1: Systems and Systems Thinking Slide Deck");
    modal.hidden = true;
    document.body.appendChild(modal);

    window.addEventListener("resize", scheduleFitOnResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleFitOnResize).catch(() => {});
    }

    modal.addEventListener("click", (ev) => {
      if (ev.target === modal && !state.presentationMode) {
        closeDeck();
        return;
      }
      if (state.toolsMenuOpen && !ev.target.closest(".or-tools-menu-wrap")) {
        state.toolsMenuOpen = false;
        const pop = modal.querySelector(".or-tools-popover");
        if (pop) pop.hidden = true;
      }
    });

    // Multi-touch Pinch-Zoom + Double-Tap Zoom + Single-Finger Swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let ignoreSwipe = false;
    let hadMultiTouch = false;
    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    modal.addEventListener(
      "touchstart",
      (ev) => {
        if (!state.isOpen || (state.viewMode !== "deck" && state.viewMode !== "quiz") || !ev.touches) return;
        if (ev.touches.length >= 2) {
          hadMultiTouch = true;
          ignoreSwipe = true;
          pinchStartDist = Math.max(
            20,
            Math.hypot(ev.touches[1].clientX - ev.touches[0].clientX, ev.touches[1].clientY - ev.touches[0].clientY)
          );
          pinchStartZoom = state.zoomScale || 1;
          return;
        }
        if (ev.touches.length === 1) {
          hadMultiTouch = false;
          touchStartX = ev.touches[0].clientX;
          touchStartY = ev.touches[0].clientY;
          const inInteractiveZone =
            ev.target &&
            ev.target.closest &&
            ev.target.closest(".or-table-wrap, .or-filmstrip, .or-tools-popover, .st1-quiz-stage, input, select, button");
          ignoreSwipe = Boolean(inInteractiveZone) || (state.zoomScale || 1) > 1.03;
        }
      },
      { passive: true }
    );

    modal.addEventListener(
      "touchmove",
      (ev) => {
        if (!state.isOpen || (state.viewMode !== "deck" && state.viewMode !== "quiz") || !ev.touches) return;
        if (ev.touches.length >= 2 && pinchStartDist > 0) {
          hadMultiTouch = true;
          ignoreSwipe = true;
          ev.preventDefault();
          const curDist = Math.hypot(
            ev.touches[1].clientX - ev.touches[0].clientX,
            ev.touches[1].clientY - ev.touches[0].clientY
          );
          const midX = (ev.touches[0].clientX + ev.touches[1].clientX) * 0.5;
          const midY = (ev.touches[0].clientY + ev.touches[1].clientY) * 0.5;
          setZoomScale(pinchStartZoom * (curDist / pinchStartDist), midX, midY);
        }
      },
      { passive: false }
    );

    modal.addEventListener(
      "touchend",
      (ev) => {
        if (!state.isOpen || !ev.changedTouches || !ev.changedTouches.length) return;
        if (ev.touches && ev.touches.length > 0) return;
        if (hadMultiTouch) {
          hadMultiTouch = false;
          pinchStartDist = 0;
          return;
        }
        const t1 = ev.changedTouches[0];
        const dx = t1.clientX - touchStartX;
        const dy = t1.clientY - touchStartY;

        if (Math.abs(dx) < 16 && Math.abs(dy) < 16) {
          const isControl =
            ev.target &&
            ev.target.closest &&
            ev.target.closest("button, a, input, select, .st1-quiz-stage, .or-deck-topbar, .or-deck-bottombar");
          if (!isControl && state.viewMode === "deck") {
            const now = Date.now();
            if (now - lastTapTime < 310 && Math.hypot(t1.clientX - lastTapX, t1.clientY - lastTapY) < 36) {
              setZoomScale((state.zoomScale || 1) > 1.08 ? 1 : 1.75, t1.clientX, t1.clientY);
              lastTapTime = 0;
              return;
            }
            lastTapTime = now;
            lastTapX = t1.clientX;
            lastTapY = t1.clientY;
          }
        }

        if (state.viewMode !== "deck" || ignoreSwipe || (state.zoomScale || 1) > 1.03) return;
        if (Math.abs(dx) > 58 && Math.abs(dx) > Math.abs(dy) * 1.55) {
          state.autoPlay = false;
          if (dx < 0 && state.slideIdx < SLIDES.length - 1) goToSlide(state.slideIdx + 1);
          else if (dx > 0 && state.slideIdx > 0) goToSlide(state.slideIdx - 1);
        }
      },
      { passive: true }
    );

    modal.addEventListener(
      "wheel",
      (ev) => {
        if (!state.isOpen || (state.viewMode !== "deck" && state.viewMode !== "quiz")) return;
        if (ev.ctrlKey || ev.metaKey) {
          ev.preventDefault();
          setZoomScale((state.zoomScale || 1) * (ev.deltaY < 0 ? 1.12 : 0.89), ev.clientX, ev.clientY);
        }
      },
      { passive: false }
    );

    document.addEventListener("keydown", (ev) => {
      if (!state.isOpen || modal.hidden) return;
      // Do not intercept if Google Drive PDF preview is currently open on top
      const gdpv = document.getElementById("gdrivePdfPreviewModal");
      if (gdpv && !gdpv.hidden) return;

      const tag = (ev.target && ev.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (ev.key === "Escape") {
        ev.preventDefault();
        if (state.qrZoomOpen) {
          state.qrZoomOpen = false;
          renderModal();
        } else if (state.toolsMenuOpen) {
          state.toolsMenuOpen = false;
          renderModal();
        } else if (state.presentationMode) {
          exitPresentationMode();
        } else {
          closeDeck();
        }
      } else if (ev.key === "ArrowRight" || ev.key === "PageDown" || ev.key === " ") {
        if (tag === "BUTTON" && ev.key === " ") return;
        if (state.viewMode === "deck") {
          ev.preventDefault();
          state.autoPlay = false;
          goToSlide(state.slideIdx + 1);
        }
      } else if (ev.key === "ArrowLeft" || ev.key === "PageUp") {
        if (state.viewMode === "deck") {
          ev.preventDefault();
          state.autoPlay = false;
          goToSlide(state.slideIdx - 1);
        }
      } else if (ev.key === "Home" && state.viewMode === "deck") {
        ev.preventDefault();
        state.autoPlay = false;
        goToSlide(0);
      } else if (ev.key === "End" && state.viewMode === "deck") {
        ev.preventDefault();
        state.autoPlay = false;
        goToSlide(SLIDES.length - 1);
      } else if (ev.key === "p" || ev.key === "P") {
        ev.preventDefault();
        toggleAutoPlay();
      } else if (ev.key === "f" || ev.key === "F") {
        ev.preventDefault();
        togglePresentationMode();
      } else if (ev.key === "g" || ev.key === "G") {
        ev.preventDefault();
        state.autoPlay = false;
        state.viewMode = state.viewMode === "sorter" ? "deck" : "sorter";
        renderModal();
      } else if (ev.key === "n" || ev.key === "N") {
        ev.preventDefault();
        state.showNotes = !state.showNotes;
        renderModal();
      } else if (ev.key === "l" || ev.key === "L") {
        ev.preventDefault();
        state.laserActive = !state.laserActive;
        renderModal();
      } else if (ev.key === "k" || ev.key === "K") {
        ev.preventDefault();
        state.autoPlay = false;
        state.viewMode = state.viewMode === "quiz" ? "deck" : "quiz";
        state.zoomScale = 1;
        renderModal();
      } else if (ev.key === "t" || ev.key === "T") {
        ev.preventDefault();
        toggleIoStageTheme();
      } else if (ev.key === "+" || ev.key === "=") {
        ev.preventDefault();
        setZoomScale((state.zoomScale || 1) + 0.25);
      } else if (ev.key === "-" || ev.key === "_") {
        ev.preventDefault();
        setZoomScale((state.zoomScale || 1) - 0.25);
      } else if (ev.key === "0") {
        ev.preventDefault();
        setZoomScale(1);
      }
    });

    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && state.presentationMode) {
        state.presentationMode = false;
        modal.classList.remove("is-presentation-mode");
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
      modal.hidden = true;
      modal.innerHTML = "";
      return;
    }
    document.body.classList.add("st1-deck-open");
    modal.hidden = false;
    modal.classList.toggle("is-presentation-mode", state.presentationMode);

    const cur = SLIDES[state.slideIdx] || SLIDES[0];
    const showNotesNow = state.viewMode === "deck" && state.showNotes;
    const notesLabel = ROLE === "faculty" ? t("โน้ตผู้สอน", "Presenter Notes") : t("คำอธิบายสไลด์", "Slide Notes");
    const zoomPct = Math.round((state.zoomScale || 1) * 100);
    const effectiveIoTheme = getEffectiveIoTheme();
    const isIoDark = effectiveIoTheme === "dark";

    let answeredCnt = 0;
    QUIZ_ITEMS.forEach((q) => {
      if (Object.prototype.hasOwnProperty.call(state.quizAnswers, q.id)) answeredCnt += 1;
    });

    let viewportHtml = "";
    if (state.viewMode === "deck") {
      viewportHtml = `
        ${state.autoPlay ? `<div class="or-autoplay-progress" aria-hidden="true"></div>` : ""}
        <div class="or-slide-frame-wrap">
          <div class="or-slide-zoom-sizer">
            ${renderSingleSlideCanvasHtml(cur, state.slideIdx, true, false)}
          </div>
        </div>
      `;
    } else if (state.viewMode === "quiz") {
      viewportHtml = `
        <div class="or-slide-frame-wrap">
          <div class="or-slide-zoom-sizer">
            <article class="or-slide-canvas is-io-pitch is-live-canvas" data-io-theme="${effectiveIoTheme}" aria-label="ST1 Interactive Concept Check">
              <div class="or-sld-inner">
                <header class="or-sld-head">
                  <div class="or-sld-eyebrow-row">
                    <span class="or-sld-kicker">
                      <span class="or-act-badge is-act-4">ST1 · INTERACTIVE CONCEPT CHECK</span>
                      <span>5 HIGH-YIELD QUESTIONS · ACTIVE RECALL</span>
                    </span>
                    <span class="or-sld-time-tag">11.40 – 11.52 น.</span>
                  </div>
                  <h2 class="or-sld-title">ทดสอบความเข้าใจแก่นสำคัญคาบ ST1: ระบบ บริบท CAS วงจร ER และภูเขาน้ำแข็ง</h2>
                </header>
                <div class="or-sld-body">
                  ${renderQuizStageHtml(false)}
                </div>
              </div>
            </article>
          </div>
        </div>
      `;
    } else if (state.viewMode === "sorter") {
      const visible = SLIDES.map((s, i) => ({ s, i })).filter(
        (x) => state.sorterFilter === "all" || x.s.section === state.sorterFilter
      );
      viewportHtml = `
        <div class="or-sorter-wrap">
          <div class="or-sorter-filters" role="group" aria-label="กรองตามหมวดสไลด์ ST1">
            ${SECTION_FILTERS.map(
              (f) => `
              <button type="button" class="or-tool-btn${state.sorterFilter === f.id ? " is-active-toggle" : ""}" data-st1-sfilter="${f.id}">
                ${esc(t(f.labelTh, f.labelEn))}
              </button>
            `
            ).join("")}
          </div>
          <div class="or-sorter-grid">
            ${visible
              .map(
                ({ s, i }) => `
              <button type="button" class="or-sorter-card is-sec-${esc(s.section)}${i === state.slideIdx ? " is-current" : ""}" data-st1-jump="${i}">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">
                  <span class="or-code-pill">Slide ${s.num}</span>
                  <span class="or-sorter-time">${esc(s.timeWindow)}</span>
                </div>
                <div class="or-sorter-title">${esc(s.title)}</div>
                <div class="or-sorter-act"><span>${esc(s.actLabel || s.sectionLabel)}</span></div>
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    } else {
      viewportHtml = `
        <div class="or-handout-stack">
          ${SLIDES.map((s, i) => renderSingleSlideCanvasHtml(s, i, false, true)).join("")}
        </div>
      `;
    }

    const qrOverlayHtml = state.qrZoomOpen
      ? `
        <div class="orl-aux-backdrop" id="st1QrZoomBackdrop" style="position:fixed;inset:0;z-index:1900;background:rgba(10,15,28,0.82);display:flex;align-items:center;justify-content:center;padding:20px">
          <div style="background:#ffffff;color:#0f172a;border-radius:24px;padding:26px 32px;max-width:460px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.45);display:flex;flex-direction:column;gap:14px;align-items:center">
            <div style="font-weight:800;font-size:18px;color:#1d4ed8">📱 สแกนเปิดสไลด์คาบ ST1: Systems &amp; Systems Thinking</div>
            <div style="width:280px;max-width:100%">${buildQrSvg(PROD_STUDENT_DECK_URL)}</div>
            <code style="background:#eff6ff;color:#1e40af;padding:6px 14px;border-radius:999px;font-weight:700;font-size:14px">smartwoo.github.io/racm303-2569-student/#st1</code>
            <button type="button" class="or-tool-btn is-primary" id="st1CloseQrZoomBtn" style="padding:0 22px;height:38px">ปิดหน้าต่าง QR (Esc)</button>
          </div>
        </div>
      `
      : "";

    modal.setAttribute("data-io-theme", effectiveIoTheme);
    modal.innerHTML = `
      <div class="or-deck-shell is-io-deck${showNotesNow ? " has-notes-open" : ""}" data-io-theme="${effectiveIoTheme}">
        <div class="or-deck-topbar">
          <div class="or-top-left">
            <span class="or-code-pill is-io-brand-pill">ST1</span>
            <div class="or-top-title-wrap">
              <span class="or-top-title">${esc(
                t(
                  "ST1: Systems & Systems Thinking · แนวคิดเรื่องระบบและการคิดเชิงระบบ",
                  "ST1: Systems & Systems Thinking · RACM 303"
                )
              )}</span>
              <span class="or-top-sub">พุธ 25 พ.ย. 2569 · 09.30 – 12.00 น. · ห้อง 2C2-03 อาคารพรีคลินิก · อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์</span>
            </div>
          </div>

          <div class="or-top-center" role="tablist" aria-label="สลับมุมมองสไลด์ ST1">
            <button type="button" class="or-mode-btn${state.viewMode === "deck" ? " is-active" : ""}" data-st1-vmode="deck">${SVG.slides} <span>Slide</span></button>
            <button type="button" class="or-mode-btn is-live-tab${state.viewMode === "quiz" ? " is-active" : ""}" data-st1-vmode="quiz" title="เปิดชุดคำถามทบทวนความเข้าใจ 5 ข้อ (กด K)"><span class="or-live-tab-dot"></span><span>Quiz (${answeredCnt}/5)</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "sorter" ? " is-active" : ""}" data-st1-vmode="sorter">${SVG.grid} <span>Sorter</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "handout" ? " is-active" : ""}" data-st1-vmode="handout">${SVG.handout} <span>Handout</span></button>
          </div>

          <div class="or-top-right">
            <div class="or-desktop-tools">
              <button type="button" class="or-tool-btn is-io-theme-toggle" id="st1IoThemeBtn" title="สลับโทนสไลด์ Clean Light / Dark (พร้อมเปลี่ยนภาพ PNG เป็น Dark BG อัตโนมัติ · กด T)"><span>${isIoDark ? "🌙 Dark" : "☀️ Light"}</span></button>
              ${
                ROLE === "faculty"
                  ? `<button type="button" class="or-timer-pill${state.timerRunning && state.timerSeconds <= SESSION_LIMIT_SEC ? " is-running" : ""}${state.timerSeconds > SESSION_LIMIT_SEC ? " is-overtime" : ""}" id="st1TimerBtn" data-st1-timer-display title="คลิกเพื่อเริ่ม/หยุดจับเวลาคาบ ST1 150 นาที (ดับเบิลคลิกเพื่อรีเซ็ต)">${formatTimer(state.timerSeconds)}</button>`
                  : ""
              }
              <button type="button" class="or-tool-btn${state.autoPlay ? " is-active-toggle" : ""}" id="st1AutoPlayBtn" title="เล่นสไลด์อัตโนมัติ (กด P)">${state.autoPlay ? SVG.pause : SVG.play} <span>${esc(
                state.autoPlay ? t("หยุดเล่น", "Pause") : t("Auto-Play", "Auto-Play")
              )}</span></button>
              <button type="button" class="or-tool-btn${state.showNotes ? " is-active-toggle" : ""}" id="st1ToggleNotesBtn" title="เปิด/ปิดโน้ตอธิบายสไลด์ (กด N)">${SVG.notes} <span>${esc(notesLabel)}</span></button>
              <a class="or-tool-btn" href="${PPTX_HREF}" download="RACM303_2569_ST1_Slides.pptx" title="ดาวน์โหลดไฟล์ PowerPoint (.pptx) อัตราส่วน 16:9 แก้ไขได้">${SVG.download} <span>.pptx</span></a>
              <a class="or-tool-btn" href="${PDF_HREF}" download="RACM303_2569_ST1_Slides.pdf" title="พรีวิวและดาวน์โหลดไฟล์สไลด์ PDF 16:9">${SVG.download} <span>PDF</span></a>
              <button type="button" class="or-tool-btn" id="st1PrintBtn" title="สั่งพิมพ์เอกสารประกอบสไลด์ 16:9">${SVG.print} <span>${esc(t("พิมพ์", "Print"))}</span></button>
            </div>

            <div class="or-tools-menu-wrap">
              <button type="button" class="or-tool-btn or-compact-more-btn${state.toolsMenuOpen || state.autoPlay || state.showNotes ? " is-active-toggle" : ""}" id="st1MoreToolsBtn" aria-expanded="${state.toolsMenuOpen ? "true" : "false"}" title="เครื่องมือสไลด์เพิ่มเติม">${SVG.more}</button>
              <div class="or-tools-popover" ${state.toolsMenuOpen ? "" : "hidden"}>
                <button type="button" class="or-pop-item" id="st1PopIoThemeBtn"><span>${isIoDark ? "☀️ สลับเป็นโหมด Clean Light" : "🌙 สลับเป็นโหมด Clean Dark"}</span></button>
                ${
                  ROLE === "faculty"
                    ? `<button type="button" class="or-pop-item" id="st1PopTimerBtn" data-st1-timer-display>${formatTimer(state.timerSeconds)}</button>`
                    : ""
                }
                <button type="button" class="or-pop-item${state.autoPlay ? " is-active" : ""}" id="st1PopAutoPlayBtn">${state.autoPlay ? SVG.pause : SVG.play} <span>${esc(
                  state.autoPlay ? t("หยุดเล่นอัตโนมัติ", "Pause Auto-Play") : t("เล่นอัตโนมัติ (Auto-Play)", "Auto-Play Reel")
                )}</span></button>
                <button type="button" class="or-pop-item${state.showNotes ? " is-active" : ""}" id="st1PopNotesBtn">${SVG.notes} <span>${esc(notesLabel)}</span></button>
                <a class="or-pop-item" href="${PPTX_HREF}" download="RACM303_2569_ST1_Slides.pptx">${SVG.download} <span>ดาวน์โหลด PowerPoint (.pptx)</span></a>
                <a class="or-pop-item" href="${PDF_HREF}" download="RACM303_2569_ST1_Slides.pdf">${SVG.download} <span>พรีวิว / ดาวน์โหลดสไลด์ PDF</span></a>
                <button type="button" class="or-pop-item" id="st1PopPrintBtn">${SVG.print} <span>${esc(t("สั่งพิมพ์ (Print)", "Print Handout"))}</span></button>
              </div>
            </div>

            <button type="button" class="or-tool-btn is-primary or-present-btn" id="st1PresentBtn" title="นำเสนอเต็มจอ (กด F)">${SVG.fullscreen} <span class="or-present-lbl">${esc(
              state.presentationMode ? t("ออกเต็มจอ", "Exit") : t("เต็มจอ", "Present")
            )}</span></button>
            <button type="button" class="or-tool-btn is-close" id="st1CloseBtn" aria-label="ปิดหน้าต่างสไลด์ ST1" title="ปิด (Esc)">&times;</button>
          </div>
        </div>

        <div class="or-deck-viewport${state.viewMode !== "deck" && state.viewMode !== "quiz" ? " is-scrollable-mode" : ""}" id="st1DeckViewport">
          ${viewportHtml}
        </div>

        ${
          showNotesNow
            ? `
          <div class="or-notes-dock">
            <div style="min-width:0;flex:1">
              <div class="or-notes-kicker">${esc(cur.timeWindow)} · ST1 PRESENTER &amp; STUDY GUIDE</div>
              <p class="or-notes-text">${esc(cur.notes)}</p>
            </div>
            <button type="button" class="or-tool-btn or-laser-toggle${state.laserActive ? " is-active-toggle" : ""}" id="st1LaserBtn" title="เปิด/ปิดจุดชี้เลเซอร์บนสไลด์ (กด L)">Laser (L)</button>
          </div>
        `
            : ""
        }

        ${
          state.viewMode === "deck" || state.viewMode === "quiz"
            ? `
          <div class="or-deck-bottombar">
            <div class="or-nav-cluster">
              ${
                state.viewMode === "deck"
                  ? `
                <button type="button" class="or-tool-btn or-prevnext-btn" id="st1PrevBtn" ${state.slideIdx === 0 ? "disabled" : ""}>&larr; <span class="or-nav-word">${esc(t("ก่อนหน้า", "Prev"))}</span></button>
                <select class="or-slide-select" id="st1SlideSelect" aria-label="เลือกสไลด์ ST1">
                  ${SLIDES.map(
                    (s, i) =>
                      `<option value="${i}" ${i === state.slideIdx ? "selected" : ""}>${s.num}/${SLIDES.length} · ${esc(s.title)}</option>`
                  ).join("")}
                </select>
                <button type="button" class="or-tool-btn is-primary or-prevnext-btn" id="st1NextBtn" ${state.slideIdx === SLIDES.length - 1 ? "disabled" : ""}><span class="or-nav-word">${esc(t("ถัดไป", "Next"))}</span> &rarr;</button>
              `
                  : `<button type="button" class="or-tool-btn is-primary" id="st1BackToSlidesBtn">&larr; กลับไปยังสไลด์ (${cur.num}/${SLIDES.length})</button>`
              }
            </div>

            <div class="or-zoom-sync-cluster">
              ${
                ROLE === "student"
                  ? `<button type="button" class="or-follow-pill${state.followHost ? " is-on" : ""}" id="st1FollowLiveBtn" title="ซิงค์เปลี่ยนหน้าสไลด์ตามผู้สอนอัตโนมัติ">📡 ${state.followHost ? "ซิงค์สด On" : "ซิงค์สด Off"}</button>`
                  : ""
              }
              <div class="or-zoom-pill" role="group" aria-label="ย่อขยายสไลด์ ST1">
                <button type="button" class="or-zoom-btn" id="st1ZoomOutBtn" title="ซูมออก (−)">&minus;</button>
                <button type="button" class="or-zoom-lbl" id="st1ZoomResetBtn" data-st1-zoom-label title="แตะเพื่อรีเซ็ตขนาด 100%">${zoomPct}%</button>
                <button type="button" class="or-zoom-btn" id="st1ZoomInBtn" title="ซูมเข้า (+)">&#43;</button>
              </div>
            </div>

            ${
              state.viewMode === "deck"
                ? `
              <div class="or-filmstrip" role="navigation" aria-label="แถบลำดับสไลด์ ST1">
                ${SLIDES.map(
                  (s, i) =>
                    `<button type="button" class="or-film-dot${i === state.slideIdx ? " is-active" : ""}${s.isLiveQuizSlide ? " is-quiz-dot" : ""}" data-st1-jump="${i}" title="${s.num}. ${esc(s.title)}">${s.num}</button>`
                ).join("")}
              </div>
            `
                : ""
            }
          </div>
        `
            : ""
        }
      </div>
      ${qrOverlayHtml}
    `;

    // Wire events
    modal.querySelectorAll("[data-st1-vmode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.viewMode = btn.dataset.st1Vmode;
        state.toolsMenuOpen = false;
        state.zoomScale = 1;
        if (state.viewMode !== "deck") state.autoPlay = false;
        renderModal();
      });
    });

    modal.querySelectorAll("[data-st1-sfilter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sorterFilter = btn.dataset.st1Sfilter;
        renderModal();
      });
    });

    modal.querySelectorAll("[data-st1-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.autoPlay = false;
        state.toolsMenuOpen = false;
        state.viewMode = "deck";
        goToSlide(Number(btn.dataset.st1Jump) || 0);
      });
    });

    modal.querySelectorAll("[data-st1-act]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const act = btn.dataset.st1Act;
        if (act === "show-cover-hero") {
          state.coverPaneMode = "hero";
          renderModal();
        } else if (act === "show-cover-lobby") {
          state.coverPaneMode = "lobby";
          renderModal();
        } else if (act === "zoom-qr") {
          state.qrZoomOpen = true;
          renderModal();
        } else if (act === "start-slide-2") {
          goToSlide(1);
        } else if (act === "jump-quiz") {
          goToSlideById("s15-live-quiz");
        }
      });
    });

    const qrBackdrop = document.getElementById("st1QrZoomBackdrop");
    if (qrBackdrop) {
      qrBackdrop.addEventListener("click", (ev) => {
        if (ev.target === qrBackdrop) {
          state.qrZoomOpen = false;
          renderModal();
        }
      });
    }
    const closeQrBtn = document.getElementById("st1CloseQrZoomBtn");
    if (closeQrBtn) {
      closeQrBtn.addEventListener("click", () => {
        state.qrZoomOpen = false;
        renderModal();
      });
    }

    // Wire Quiz Interactions
    modal.querySelectorAll("[data-st1-qjump]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        state.quizIdx = Math.max(0, Math.min(QUIZ_ITEMS.length - 1, Number(btn.dataset.st1Qjump) || 0));
        renderModal();
      });
    });

    modal.querySelectorAll("[data-st1-qpick]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const curQ = QUIZ_ITEMS[state.quizIdx];
        if (!curQ) return;
        state.quizAnswers[curQ.id] = Number(btn.dataset.st1Qpick);
        try {
          localStorage.setItem("racm303_st1_deck_quiz_v1", JSON.stringify(state.quizAnswers));
        } catch (_) {}
        renderModal();
      });
    });

    modal.querySelectorAll("[data-st1-qact]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const act = btn.dataset.st1Qact;
        const curQ = QUIZ_ITEMS[state.quizIdx];
        if (act === "toggle-reveal" && curQ) {
          state.facultyRevealMap[curQ.id] = !state.facultyRevealMap[curQ.id];
          renderModal();
        } else if (act === "reset-quiz") {
          state.quizAnswers = {};
          state.facultyRevealMap = {};
          state.quizIdx = 0;
          try {
            localStorage.removeItem("racm303_st1_deck_quiz_v1");
          } catch (_) {}
          renderModal();
        } else if (act === "goto-final-slide") {
          state.viewMode = "deck";
          goToSlide(SLIDES.length - 1);
        }
      });
    });

    ["st1IoThemeBtn", "st1PopIoThemeBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", toggleIoStageTheme);
    });

    ["st1TimerBtn", "st1PopTimerBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) {
        b.addEventListener("click", toggleTimer);
        b.addEventListener("dblclick", (ev) => {
          ev.preventDefault();
          resetTimer();
        });
      }
    });

    ["st1AutoPlayBtn", "st1PopAutoPlayBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", toggleAutoPlay);
    });

    ["st1ToggleNotesBtn", "st1PopNotesBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) {
        b.addEventListener("click", () => {
          state.showNotes = !state.showNotes;
          state.toolsMenuOpen = false;
          renderModal();
        });
      }
    });

    ["st1PrintBtn", "st1PopPrintBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", printHandout);
    });

    const moreBtn = document.getElementById("st1MoreToolsBtn");
    if (moreBtn) {
      moreBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        state.toolsMenuOpen = !state.toolsMenuOpen;
        renderModal();
      });
    }

    const laserBtn = document.getElementById("st1LaserBtn");
    if (laserBtn) {
      laserBtn.addEventListener("click", () => {
        state.laserActive = !state.laserActive;
        renderModal();
      });
    }

    const presentBtn = document.getElementById("st1PresentBtn");
    if (presentBtn) presentBtn.addEventListener("click", togglePresentationMode);

    const closeBtn = document.getElementById("st1CloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeDeck);

    const prevBtn = document.getElementById("st1PrevBtn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        state.autoPlay = false;
        goToSlide(state.slideIdx - 1);
      });
    }

    const nextBtn = document.getElementById("st1NextBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        state.autoPlay = false;
        goToSlide(state.slideIdx + 1);
      });
    }

    const sel = document.getElementById("st1SlideSelect");
    if (sel) {
      sel.addEventListener("change", () => {
        state.autoPlay = false;
        goToSlide(Number(sel.value) || 0);
      });
    }

    const backToSlidesBtn = document.getElementById("st1BackToSlidesBtn");
    if (backToSlidesBtn) {
      backToSlidesBtn.addEventListener("click", () => {
        state.viewMode = "deck";
        state.zoomScale = 1;
        renderModal();
      });
    }

    const zoomOutBtn = document.getElementById("st1ZoomOutBtn");
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => setZoomScale((state.zoomScale || 1) - 0.25));
    const zoomInBtn = document.getElementById("st1ZoomInBtn");
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => setZoomScale((state.zoomScale || 1) + 0.25));
    const zoomResetBtn = document.getElementById("st1ZoomResetBtn");
    if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => setZoomScale(1));

    const followBtn = document.getElementById("st1FollowLiveBtn");
    if (followBtn) {
      followBtn.addEventListener("click", () => {
        state.followHost = !state.followHost;
        renderModal();
      });
    }

    fitAllVisibleCanvases();
    applyZoomToCurrentSlide(1);
    wireImageLoadRefit(modal);
    wireLaserIfActive(modal);
    scheduleAutoPlayTick();
  }

  function openDeck(initialSlideIdx, opts) {
    preloadAllSt1Images();
    const o = opts || {};
    state.isOpen = true;
    state.toolsMenuOpen = false;
    state.qrZoomOpen = false;
    if (typeof initialSlideIdx === "number" && !Number.isNaN(initialSlideIdx)) {
      state.slideIdx = Math.max(0, Math.min(SLIDES.length - 1, initialSlideIdx));
    }
    if (o.viewMode) state.viewMode = o.viewMode;
    else state.viewMode = "deck";
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
    state.isOpen = false;
    state.autoPlay = false;
    state.toolsMenuOpen = false;
    state.qrZoomOpen = false;
    clearAutoPlayTimer();
    document.body.classList.remove("st1-deck-open");
    if (state.presentationMode) {
      state.presentationMode = false;
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
    const modal = document.getElementById("st1DeckModal");
    if (modal) {
      modal.hidden = true;
      modal.classList.remove("is-presentation-mode");
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
    fitAllVisibleCanvases,
    getSlides: () => SLIDES,
    getQuizItems: () => QUIZ_ITEMS,
    pptxHref: PPTX_HREF,
    pdfHref: PDF_HREF
  };

  function checkUrlAutoOpen() {
    const params = new URLSearchParams(window.location.search);
    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (
      params.get("page") === "st1" ||
      params.get("st1_print") === "1" ||
      h === "st1" ||
      h === "st1-slides" ||
      h === "st1-quiz"
    ) {
      setTimeout(() => {
        openDeck(h === "st1-quiz" ? 14 : 0, {
          viewMode: params.get("st1_print") === "1" ? "handout" : "deck"
        });
      }, 60);
    }
  }

  window.addEventListener("hashchange", checkUrlAutoOpen);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkUrlAutoOpen);
  } else {
    checkUrlAutoOpen();
  }
})();
