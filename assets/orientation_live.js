/* ==========================================================================
   RACM 303 (2569) — Live Orientation Lobby, Synced Slides & Kahoot Recheck v2
   - Simultaneous Faculty (14 Advisors) & Student (169) QR Scan-to-Join (#live)
   - Multi-Form-Factor Ready (Vertical/Horizontal/Duo Phone & Tablet + Keyboard)
   - Embedded Slide 14 O/S/M/U Live Quiz -> Slide 15 Official Criteria Debrief
   - Real-Time Sync via MQTT WSS + PeerJS WebRTC + BroadcastChannel
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const TOPIC_NS = "racm303/2569/orient_kahoot/v1";
  const BC_NAME = "racm303_orient_kahoot_bc_v1";
  const HOST_PEER_ID = "racm303-2569-orient-kahoot-host";
  const BROKERS = [
    "wss://mqtt.eclipseprojects.io:443/mqtt",
    "wss://broker.emqx.io:8084/mqtt"
  ];
  const PROD_STUDENT_JOIN_URL = "https://smartwoo.github.io/racm303-2569-student/#live";
  const PROD_FACULTY_JOIN_URL = "https://smartwoo.github.io/racm303-2569-faculty-member/#live";
  const STALE_SESSION_MS = 3 * 60 * 60 * 1000;
  const STALE_PRESENCE_MS = 90 * 60 * 1000;

  const AVATARS = ["🩺", "🏥", "🌿", "🧭", "🔬", "💡", "🤝", "🌟"];
  const FACULTY_LIST = [
    { code: "FAC01", short: "อ.ณัฐวุฒิ", fullName: "อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์", unit: "ประธานรายวิชา" },
    { code: "FAC02", short: "อ.ปวินท์", fullName: "อ. นพ.ปวินท์ พัวพรพงษ์", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC03", short: "อ.ฉัตรชัย", fullName: "อ. ดร. นพ.ฉัตรชัย อิ่มอารมณ์", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC04", short: "ผศ.วิชช์", fullName: "ผศ. ดร. นพ.วิชช์ เกษมทรัพย์", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC05", short: "ผศ.สัมฤทธิ์", fullName: "ผศ. ดร. นพ.สัมฤทธิ์ ศรีธำรงสวัสดิ์", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC06", short: "อ.ภูษิต", fullName: "อ. นพ.ภูษิต ประคองสาย", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC07", short: "อ.จักรกฤษณ์", fullName: "อ. ดร. นพ.จักรกฤษณ์ โพดาพล", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC08", short: "นพ.พีรสิชฌ์", fullName: "นพ.พีรสิชฌ์ สิทธิถาวร", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC09", short: "รศ.เริงฤดี", fullName: "รศ. ดร. พญ.เริงฤดี ปธานวนิช", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC10", short: "อ.สวนีย์", fullName: "อ. พญ.สวนีย์ รัตนปัญญา", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC11", short: "อ.วริษา", fullName: "อ. ดร. พญ.วริษา พานิชเกรียงไกร", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC12", short: "ผศ.ฉัฐญาณ์", fullName: "ผศ. พญ.ฉัฐญาณ์ บำรุงเชาว์เกษม", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC13", short: "นพ.ภรัณยู", fullName: "นพ.ภรัณยู คูหาทอง", unit: "คณาจารย์ประจำรายวิชา" },
    { code: "FAC14", short: "ศ.วิชัย", fullName: "ศ. นพ.วิชัย เอกพลากร", unit: "คณาจารย์ประจำรายวิชา" }
  ];

  const CHOICE_META = [
    { idx: 0, grade: "O", sub: "Outstanding", shape: "▲", cls: "is-green", hex: "#26890c", nameTh: "เกรด O (▲ สีเขียว)" },
    { idx: 1, grade: "S", sub: "Satisfactory", shape: "◆", cls: "is-blue", hex: "#1368ce", nameTh: "เกรด S (◆ สีน้ำเงิน)" },
    { idx: 2, grade: "M", sub: "Marginal", shape: "●", cls: "is-gold", hex: "#d89e00", nameTh: "สัญลักษณ์ M (● สีเหลือง)" },
    { idx: 3, grade: "U", sub: "Unsatisfactory", shape: "■", cls: "is-red", hex: "#e21b3c", nameTh: "เกรด U (■ สีแดง)" }
  ];

  const KAHOOT_6_META = [
    { idx: 0, grade: "", sub: "", shape: "▲", cls: "is-red", hex: "#e21b3c", nameTh: "ตัวเลือก ▲ สีแดง" },
    { idx: 1, grade: "", sub: "", shape: "◆", cls: "is-blue", hex: "#1368ce", nameTh: "ตัวเลือก ◆ สีน้ำเงิน" },
    { idx: 2, grade: "", sub: "", shape: "●", cls: "is-gold", hex: "#d89e00", nameTh: "ตัวเลือก ● สีเหลือง" },
    { idx: 3, grade: "", sub: "", shape: "■", cls: "is-green", hex: "#26890c", nameTh: "ตัวเลือก ■ สีเขียว" },
    { idx: 4, grade: "", sub: "", shape: "⬢", cls: "is-purple", hex: "#7c3aed", nameTh: "ตัวเลือก ⬢ สีม่วง" },
    { idx: 5, grade: "", sub: "", shape: "★", cls: "is-teal", hex: "#0d9488", nameTh: "ตัวเลือก ★ สีเขียวน้ำทะเล" }
  ];

  function getChoiceMeta(q, idx) {
    const safeIdx = Math.max(0, Number(idx) || 0);
    if (q && q.isOsmuScenario && safeIdx < CHOICE_META.length) {
      return CHOICE_META[safeIdx];
    }
    return KAHOOT_6_META[safeIdx % KAHOOT_6_META.length];
  }

  /* ---------- 0. VisualViewport & On-Screen Keyboard Tracker ---------- */
  function syncVisualViewportVars() {
    try {
      const root = document.documentElement;
      const vv = window.visualViewport;
      const winH = window.innerHeight || document.documentElement.clientHeight || 800;
      const winW = window.innerWidth || document.documentElement.clientWidth || 1024;
      if (vv) {
        const vvh = Math.max(180, Math.round(vv.height));
        const kbInset = Math.max(0, Math.round(winH - vv.height - (vv.offsetTop || 0)));
        root.style.setProperty("--orl-vvh", `${vvh}px`);
        root.style.setProperty("--orl-kb-inset", `${kbInset}px`);
        root.classList.toggle("orl-keyboard-open", kbInset > 105);
      } else {
        root.style.setProperty("--orl-vvh", `${winH}px`);
        root.style.setProperty("--orl-kb-inset", "0px");
        root.classList.remove("orl-keyboard-open");
      }
      const ratio = winW / Math.max(1, winH);
      const isCompactOrFold = winW <= 760 || winH <= 540 || (winW <= 1040 && ratio < 1.32);
      root.classList.toggle("orl-compact-device", isCompactOrFold);
    } catch (_) {}
  }

  if (typeof window !== "undefined") {
    syncVisualViewportVars();
    window.addEventListener("resize", syncVisualViewportVars, { passive: true });
    window.addEventListener("orientationchange", () => setTimeout(syncVisualViewportVars, 120), { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", syncVisualViewportVars, { passive: true });
      window.visualViewport.addEventListener("scroll", syncVisualViewportVars, { passive: true });
    }
    document.addEventListener("focusin", (ev) => {
      const t = ev.target;
      if (!t || !t.tagName) return;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") {
        if (t.closest("#orientParticipantModal, #orientLiveAuxOverlay, #orientationDeckModal")) {
          syncVisualViewportVars();
          setTimeout(() => {
            syncVisualViewportVars();
            try {
              t.scrollIntoView({ block: "center", behavior: "smooth" });
            } catch (_) {}
          }, 220);
        }
      }
    });
    document.addEventListener("focusout", () => {
      setTimeout(syncVisualViewportVars, 140);
    });
  }

  /* ---------- 1. Pure-JS ISO/IEC 18004 QR Code SVG Generator (Versions 1..10, ECC-M) ---------- */
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
  const QR_ALIGN = [
    [], [], [6, 18], [6, 22], [6, 26], [6, 30],
    [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
  ];
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

  function qrMaskBit(maskId, r, c) {
    if (maskId === 0) return (r + c) % 2 === 0;
    if (maskId === 1) return r % 2 === 0;
    if (maskId === 2) return c % 3 === 0;
    if (maskId === 3) return (r + c) % 3 === 0;
    if (maskId === 4) return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    if (maskId === 5) return ((r * c) % 2) + ((r * c) % 3) === 0;
    if (maskId === 6) return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
  }

  const qrSvgCache = new Map();

  function buildQrSvg(text, extraCls) {
    const cacheKey = `${text}__${extraCls || ""}`;
    if (qrSvgCache.has(cacheKey)) return qrSvgCache.get(cacheKey);
    const raw = new TextEncoder().encode(String(text || PROD_STUDENT_JOIN_URL));
    const n = raw.length;
    let ver = 0;
    for (let v = 1; v <= 10; v += 1) {
      const [, b1, d1, b2, d2] = QR_ECC_M[v];
      const totalData = b1 * d1 + b2 * d2;
      const lenBits = v <= 9 ? 8 : 16;
      if (4 + lenBits + n * 8 <= totalData * 8) {
        ver = v;
        break;
      }
    }
    if (!ver) ver = 10;
    const [ecCw, b1, d1, b2, d2] = QR_ECC_M[ver];
    const totalData = b1 * d1 + b2 * d2;

    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i -= 1) bits.push((val >> i) & 1);
    };
    pushBits(0b0100, 4);
    pushBits(n, ver <= 9 ? 8 : 16);
    for (let i = 0; i < n; i += 1) pushBits(raw[i], 8);
    pushBits(0, Math.min(4, totalData * 8 - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const dataBytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      let v = 0;
      for (let k = 0; k < 8; k += 1) v = (v << 1) | bits[i + k];
      dataBytes.push(v);
    }
    let padIdx = 0;
    while (dataBytes.length < totalData) {
      dataBytes.push(padIdx % 2 === 0 ? 0xec : 0x11);
      padIdx += 1;
    }

    const blocksData = [];
    const blocksEc = [];
    let pos = 0;
    for (let i = 0; i < b1; i += 1) {
      const blk = dataBytes.slice(pos, pos + d1);
      pos += d1;
      blocksData.push(blk);
      blocksEc.push(rsRemainder(blk, ecCw));
    }
    for (let i = 0; i < b2; i += 1) {
      const blk = dataBytes.slice(pos, pos + d2);
      pos += d2;
      blocksData.push(blk);
      blocksEc.push(rsRemainder(blk, ecCw));
    }

    const interleaved = [];
    const maxD = Math.max(d1, d2);
    for (let i = 0; i < maxD; i += 1) {
      for (let bi = 0; bi < blocksData.length; bi += 1) {
        if (i < blocksData[bi].length) interleaved.push(blocksData[bi][i]);
      }
    }
    for (let i = 0; i < ecCw; i += 1) {
      for (let bi = 0; bi < blocksEc.length; bi += 1) {
        interleaved.push(blocksEc[bi][i]);
      }
    }

    const size = ver * 4 + 17;
    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const isFunc = Array.from({ length: size }, () => new Array(size).fill(false));
    const setFunc = (r, c, dark) => {
      modules[r][c] = dark;
      isFunc[r][c] = true;
    };

    const drawFinder = (top, left) => {
      for (let dy = -1; dy <= 7; dy += 1) {
        for (let dx = -1; dx <= 7; dx += 1) {
          const r = top + dy;
          const c = left + dx;
          if (r >= 0 && r < size && c >= 0 && c < size) {
            const inOuter = dy >= 0 && dy <= 6 && dx >= 0 && dx <= 6;
            const inWhite = dy >= 1 && dy <= 5 && dx >= 1 && dx <= 5;
            const inCore = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
            setFunc(r, c, inOuter && (!inWhite || inCore));
          }
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    for (let i = 8; i < size - 8; i += 1) {
      setFunc(6, i, i % 2 === 0);
      setFunc(i, 6, i % 2 === 0);
    }

    const apos = QR_ALIGN[ver];
    for (let ai = 0; ai < apos.length; ai += 1) {
      for (let aj = 0; aj < apos.length; aj += 1) {
        const cy = apos[ai];
        const cx = apos[aj];
        if ((cy === 6 && cx === 6) || (cy === 6 && cx === size - 7) || (cy === size - 7 && cx === 6)) continue;
        for (let dy = -2; dy <= 2; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            setFunc(cy + dy, cx + dx, Math.max(Math.abs(dy), Math.abs(dx)) !== 1);
          }
        }
      }
    }

    for (let i = 0; i < 9; i += 1) {
      if (i !== 6) {
        setFunc(8, i, false);
        setFunc(i, 8, false);
      }
    }
    for (let i = 0; i < 8; i += 1) {
      setFunc(8, size - 1 - i, false);
      setFunc(size - 1 - i, 8, false);
    }
    setFunc(size - 8, 8, true);

    if (ver >= 7) {
      let rem = ver;
      for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >> 11) & 1 ? 0x1f25 : 0);
      const vbits = (ver << 12) | rem;
      for (let i = 0; i < 18; i += 1) {
        const bit = ((vbits >> i) & 1) === 1;
        const a = size - 11 + (i % 3);
        const b = Math.floor(i / 3);
        setFunc(a, b, bit);
        setFunc(b, a, bit);
      }
    }

    const allBits = [];
    for (let i = 0; i < interleaved.length; i += 1) {
      for (let b = 7; b >= 0; b -= 1) allBits.push((interleaved[i] >> b) & 1);
    }

    let bitIdx = 0;
    let upward = true;
    for (let col = size - 1; col >= 1; col -= 2) {
      if (col === 6) col -= 1;
      for (let step = 0; step < size; step += 1) {
        const r = upward ? size - 1 - step : step;
        for (let dc = 0; dc >= -1; dc -= 1) {
          const c = col + dc;
          if (!isFunc[r][c]) {
            modules[r][c] = bitIdx < allBits.length ? allBits[bitIdx] === 1 : false;
            bitIdx += 1;
          }
        }
      }
      upward = !upward;
    }

    const writeFormat = (mat, msk) => {
      const data = (0b00 << 3) | msk;
      let rem = data;
      for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >> 9) & 1 ? 0x537 : 0);
      const bits15 = ((data << 10) | rem) ^ 0x5412;
      for (let i = 0; i < 6; i += 1) mat[i][8] = ((bits15 >> i) & 1) === 1;
      mat[7][8] = ((bits15 >> 6) & 1) === 1;
      mat[8][8] = ((bits15 >> 7) & 1) === 1;
      mat[8][7] = ((bits15 >> 8) & 1) === 1;
      for (let i = 9; i < 15; i += 1) mat[8][14 - i] = ((bits15 >> i) & 1) === 1;
      for (let i = 0; i < 8; i += 1) mat[8][size - 1 - i] = ((bits15 >> i) & 1) === 1;
      for (let i = 8; i < 15; i += 1) mat[size - 15 + i][8] = ((bits15 >> i) & 1) === 1;
      mat[size - 8][8] = true;
    };

    const calcPenalty = (mat) => {
      let score = 0;
      for (let r = 0; r < size; r += 1) {
        let run = 1;
        for (let c = 1; c < size; c += 1) {
          if (mat[r][c] === mat[r][c - 1]) {
            run += 1;
            if (run === 5) score += 3;
            else if (run > 5) score += 1;
          } else run = 1;
        }
      }
      for (let c = 0; c < size; c += 1) {
        let run = 1;
        for (let r = 1; r < size; r += 1) {
          if (mat[r][c] === mat[r - 1][c]) {
            run += 1;
            if (run === 5) score += 3;
            else if (run > 5) score += 1;
          } else run = 1;
        }
      }
      let darkCnt = 0;
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          if (mat[r][c]) darkCnt += 1;
          if (r < size - 1 && c < size - 1) {
            const v = mat[r][c];
            if (v === mat[r][c + 1] && v === mat[r + 1][c] && v === mat[r + 1][c + 1]) score += 3;
          }
        }
      }
      const total = size * size;
      score += Math.floor(Math.abs(darkCnt * 20 - total * 10) / total) * 10;
      return score;
    };

    let bestMat = modules;
    let bestScore = 1e9;
    for (let msk = 0; msk < 8; msk += 1) {
      const cand = modules.map((row) => row.slice());
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          if (!isFunc[r][c] && qrMaskBit(msk, r, c)) cand[r][c] = !cand[r][c];
        }
      }
      writeFormat(cand, msk);
      const sc = calcPenalty(cand);
      if (sc < bestScore) {
        bestScore = sc;
        bestMat = cand;
      }
    }

    const qz = 3;
    const vb = size + qz * 2;
    let pathD = "";
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (bestMat[r][c]) {
          pathD += `M${c + qz},${r + qz}h1v1h-1z`;
        }
      }
    }
    const svg = `<svg class="orl-qr-svg${extraCls ? " " + extraCls : ""}" viewBox="0 0 ${vb} ${vb}" shape-rendering="crispEdges" role="img" aria-label="QR Code เข้าร่วม Live Orientation RACM 303"><rect width="${vb}" height="${vb}" fill="#ffffff" rx="2"/><path d="${pathD}" fill="#0f172a"/></svg>`;
    qrSvgCache.set(cacheKey, svg);
    return svg;
  }

  /* ---------- 2. Source-Verified 6 Kahoot Questions (1 × 6-Choice 5 HSS Objectives + 5 × O/S/M/U Scenarios · 10s) ---------- */
  const OSMU_CHOICES = [
    "O — Outstanding (ดีเยี่ยม)",
    "S — Satisfactory (ผ่านตามเกณฑ์)",
    "M — Marginal (คาบเส้น · บันทึกประวัติ M)",
    "U — Unsatisfactory (ไม่ผ่าน / ลงทะเบียนเรียนใหม่)"
  ];

  const BASE_QUESTIONS = [
    {
      id: "q1_hs_5objectives_6c",
      quick5: true,
      isOsmuScenario: false,
      badge: "QUIZ 1 · 5 วัตถุประสงค์หมวดระบบสุขภาพ (6 Choices)",
      impactTag: "เชื่อมโยงทั้ง 5 วัตถุประสงค์ด้วย Systems Thinking ในฟอร์ม 3A",
      durationSec: 10,
      stem: "ข้อใด “ไม่อยู่” ใน 5 วัตถุประสงค์หลักของหมวดระบบสุขภาพในรายวิชา RACM 303?",
      choices: [
        "1. สุขภาพ ปัจจัยกำหนดสุขภาพ (SDH, CDoH) และการป้องกันโรค",
        "2. ระบบสุขภาพและระบบบริการสุขภาพ (6BB · PHC · UHC · EQESaRR)",
        "3. ศักยภาพชุมชนในการพัฒนาสุขภาพ (ทุนทางสังคม · อสม. · ท้องถิ่น)",
        "4. การสร้างเสริมสุขภาพ (Ottawa Charter · HiAP · COM-B)",
        "5. การฝึกหัตถการผ่าตัดเฉพาะทางขั้นสูงในห้องผ่าตัด (OR Subspecialty)",
        "6. บทบาทแพทย์ในระบบสุขภาพร่วมกับทีมสหวิชาชีพและชุมชน"
      ],
      correctIdx: 4,
      sourceRef: "สไลด์ 05 วัตถุประสงค์หมวดระบบสุขภาพทั้ง 5 ด้าน & แบบประเมินฟอร์ม 3A",
      doSummary: "เชื่อมโยงทั้ง 5 วัตถุประสงค์ระบบสุขภาพเข้าด้วยกันผ่านการคิดเชิงระบบ (Systems Thinking) จากข้อมูลจริงในพื้นที่",
      dontSummary: "อย่านำเสนอแยกเป็นข้อ ๆ ขาดจากกัน — ฟอร์ม 3A ให้น้ำหนักเนื้อหาบูรณาการเชื่อมโยง 5 วัตถุประสงค์ถึง 30 คะแนน",
      osmuRule: "เฉลยข้อ ⬢! เพราะ 5 วัตถุประสงค์หลักหมวดระบบสุขภาพคือ (1) สุขภาพ/SDH/ป้องกันโรค (2) ระบบบริการสุขภาพ (3) ศักยภาพชุมชน (4) การสร้างเสริมสุขภาพ และ (5) บทบาทแพทย์ในระบบสุขภาพ",
      wrongHints: [
        "ข้อนี้เป็นวัตถุประสงค์ที่ 1 ของหมวดระบบสุขภาพ (HS1: สุขภาพ SDH/CDoH และการป้องกันโรค)",
        "ข้อนี้เป็นวัตถุประสงค์ที่ 2 ของหมวดระบบสุขภาพ (ST1, HS2–3, HS5–6: ระบบบริการ 6BB/PHC/UHC/EQESaRR)",
        "ข้อนี้เป็นวัตถุประสงค์ที่ 3 ของหมวดระบบสุขภาพ (ศักยภาพชุมชน ทุนทางสังคม และ อสม.)",
        "ข้อนี้เป็นวัตถุประสงค์ที่ 4 ของหมวดระบบสุขภาพ (HS4: การสร้างเสริมสุขภาพ Ottawa Charter, HiAP และ COM-B)",
        "",
        "ข้อนี้เป็นวัตถุประสงค์ที่ 5 ของหมวดระบบสุขภาพ (บทบาทแพทย์ในระบบสุขภาพร่วมกับสหวิชาชีพและชุมชน)"
      ]
    },
    {
      id: "sc1_leave_6sessions",
      quick5: true,
      isOsmuScenario: true,
      badge: "SCENARIO 1 · ลาเกิน 3 วัน (= เช้า-บ่าย 6 คาบที่เช็คชื่อ) & ข้อ 2.2.3",
      impactTag: "ลาทฤษฎี ≤ 3 วัน (= 6 คาบเช็คชื่อ) · ลาป่วย ≥ 3 วันไม่ส่งใบรับรองแพทย์ = U",
      durationSec: 10,
      stem: "ช่วงก่อน–หลังภาคสนาม นศพ. ลาเรียนรวม 3.5 วัน (= เช้า–บ่าย 7 คาบ เกินโควตา 3 วัน = 6 คาบที่เช็คชื่อ) และลาป่วย 3 วันติดกันโดยไม่ส่งใบรับรองแพทย์ จะได้ผลประเมินใด?",
      choices: OSMU_CHOICES.slice(),
      correctIdx: 3,
      sourceRef: "คู่มือรายวิชา RACM 303 (เวลาเรียน ≥ 80%, ลา ≤ 3 วัน = 6 คาบเช้า-บ่าย) & ประกาศคณะฯ พ.ศ. 2567 ข้อ 2.2.3 / 3.2.1",
      doSummary: "ช่วงก่อน–หลังภาคสนามลาได้รวมกันไม่เกิน 3 วัน (= คาบเช้า–บ่าย รวม 6 คาบที่เช็คชื่อ) ภาคสนาม ≤ 1.5 วัน และลาป่วย ≥ 3 วันต้องส่งใบรับรองแพทย์เสมอ",
      dontSummary: "ห้ามลาเกินโควตาจนเวลาเรียนต่ำกว่า 80% ห้ามขาดคาบห้ามขาดโดยไม่ลา (ข้อ 2.2.5) และห้ามลาป่วย ≥ 3 วันโดยไม่ส่งใบรับรองแพทย์ (ข้อ 2.2.3)",
      osmuRule: "ได้ U ทันที! ลาเกิน 3 วัน (= 6 คาบเช้า-บ่าย) เสี่ยงเวลาเรียนไม่ถึง 80% หมดสิทธิ์สอบ และลาป่วย ≥ 3 วันไม่ส่งใบรับรองแพทย์ (ข้อ 2.2.3) เป็นความผิดร้ายแรงตามข้อ 3.2.1 = U",
      wrongHints: [
        "กรณีนี้ฝ่าฝืนทั้งเพดานวันลา (เกิน 3 วัน = 6 คาบเช้า-บ่าย) และข้อ 2.2.3 จึงไม่ได้ O",
        "การลาป่วย ≥ 3 วันโดยไม่ส่งใบรับรองแพทย์เข้าข่ายพฤติกรรมร้ายแรงข้อ 2.2.3 จึงไม่ผ่านเป็น S",
        "ข้อ 2.2.3 (ลาป่วย ≥ 3 วันไม่ส่งใบรับรองแพทย์) ถูกจัดเป็นความผิดร้ายแรงตามข้อ 3.2.1 จึงได้ U ทันที ไม่ใช่ M!",
        ""
      ]
    },
    {
      id: "sc2_late_attire_m",
      quick5: true,
      isOsmuScenario: true,
      badge: "SCENARIO 2 · สาย > 15 นาที (2.2.4) & ชุดนอกพื้นที่ (2.3.2) ครั้งแรก",
      impactTag: "ผิดข้อ 2 (นอกกลุ่มร้ายแรง) ครั้งแรก + ยอมรับปรับปรุง = ข้อ 3.2.3 (M)",
      durationSec: 10,
      stem: "นศพ. เข้าคาบกลุ่มย่อยสายเกิน 15 นาทีโดยไม่แจ้ง (ข้อ 2.2.4) และสวมชุดปฏิบัติงาน รพ. ออกไปนอกพื้นที่ (ข้อ 2.3.2) เป็นครั้งแรก แต่ยอมรับคำตักเตือนและปรับปรุงตัวทันที จะพิจารณาให้สัญลักษณ์ใด?",
      choices: OSMU_CHOICES.slice(),
      correctIdx: 2,
      sourceRef: "ประกาศคณะฯ พ.ศ. 2567 ข้อ 2.2.4, 2.3.2 และข้อ 3.2.3",
      doSummary: "เข้าเรียนตรงเวลา แต่งกายถูกระเบียบ และหากได้รับข้อมูลป้อนกลับหรือคำตักเตือนจากอาจารย์ ต้องน้อมรับและปรับปรุงตัวทันที",
      dontSummary: "ระวัง! แม้ครั้งแรกจะได้ M แต่ประวัติ M จะถูกบันทึกไว้ หากทำผิดซ้ำในกลุ่มข้อ 2 เดียวกันในรายวิชาใด ๆ ภายหลัง จะกลายเป็น U ทันที (ข้อ 3.2.2)",
      osmuRule: "พิจารณาให้ M (Marginal / คาบเส้น) ตามข้อ 3.2.3 เพราะเป็นพฤติกรรมไม่พึงประสงค์ในข้อ 2 ที่ไม่ใช่ข้อร้ายแรงและกระทำผิดเป็นครั้งแรกโดยยอมรับปรับปรุงตัว",
      wrongHints: [
        "มีพฤติกรรมไม่พึงประสงค์ตามประกาศฯ ข้อ 2.2.4 และ 2.3.2 จึงไม่สามารถได้ O",
        "ตามประกาศคณะฯ พ.ศ. 2567 ข้อ 3.2.3 เมื่อกระทำพฤติกรรมข้อ 2 (นอกกลุ่มร้ายแรง) สามารถพิจารณาให้สัญลักษณ์ M (คาบเส้น)",
        "",
        "สาย > 15 นาที (2.2.4) และชุดนอกพื้นที่ (2.3.2) ครั้งแรกที่ยอมรับปรับปรุงตัว พิจารณาให้ M ตามข้อ 3.2.3 (จะกลายเป็น U ก็ต่อเมื่อเตือนแล้วไม่แก้ หรือเคยได้ M แล้วผิดซ้ำกลุ่มเดิม)"
      ]
    },
    {
      id: "sc3_pdpa_repeat_u",
      quick5: true,
      isOsmuScenario: true,
      badge: "SCENARIO 3 · โซเชียลผู้ป่วย (2.3.3) / ฝากเช็คชื่อ (2.1.6) / ซ้ำหลังได้ M",
      impactTag: "ผิดร้ายแรง 2.1, 2.3.3 หรือเตือนไม่แก้ 2.4.4 หรือเคยได้ M แล้วซ้ำกลุ่มเดิม = U",
      durationSec: 10,
      stem: "นศพ. โพสต์ภาพติดข้อมูลผู้ป่วยลงโซเชียล (2.3.3) หรือฝากเช็คชื่อ (2.1.6) หรือไม่ยอมปรับปรุงหลังถูกเตือน (2.4.4) หรือเคยได้ M หมวด 2.2 จากวิชาอื่นแล้วส่งงานช้าซ้ำอีก (3.2.2) จะได้ผลใด?",
      choices: OSMU_CHOICES.slice(),
      correctIdx: 3,
      sourceRef: "ประกาศคณะฯ พ.ศ. 2567 ข้อ 2.1, 2.3.3, 2.4.4 และข้อ 3.2.1–3.2.2",
      doSummary: "ปกป้องความลับผู้ป่วย/ชุมชน 100% ซื่อสัตย์ไม่ฝากเช็คชื่อ (2.1.6) รับฟัง Feedback และหากเคยได้ M ต้องไม่ทำผิดซ้ำในหมวดเดิมอีกเด็ดขาด",
      dontSummary: "ห้ามโพสต์ข้อมูลผู้ป่วยลงโซเชียล (2.3.3) ห้ามฝากเช็คชื่อ/ลอกงาน (2.1) ห้ามเพิกเฉยคำเตือน (2.4.4) และห้ามทำผิดซ้ำกลุ่มเดิมหลังเคยได้ M ข้ามวิชา",
      osmuRule: "ได้ U ทันที (ต้องลงทะเบียนเรียนใหม่)! ครบทั้ง 3 เงื่อนไขให้ U ของประกาศฯ 2567: (1) ผิดร้ายแรง 2.1/2.2.3/2.2.5/2.3.3 · (2) เตือนไม่แก้ 2.4.4 · (3) เคยได้ M จากวิชาใดแล้วผิดซ้ำกลุ่มเดิม",
      wrongHints: [
        "ทุกกรณีเป็นความผิดระดับรุนแรงตามข้อ 3.2.1–3.2.2 ได้ U ทันที",
        "ไม่สามารถผ่านเป็น S ได้ เพราะเข้าเกณฑ์พิจารณาให้ U ตามข้อ 3.2.1 และ 3.2.2",
        "ไม่ได้ M ซ้ำ! เพราะข้อ 2.1.6/2.3.3 เป็นความผิดร้ายแรงได้ U ทันที และกรณีเคยได้ M แล้วผิดซ้ำกลุ่มเดิมหรือเตือนไม่แก้ (ข้อ 3.2.2) จะยกระดับเป็น U ทันที!",
        ""
      ]
    },
    {
      id: "sc4_retest_s_honors",
      quick5: true,
      isOsmuScenario: true,
      badge: "SCENARIO 4 · สอบทฤษฎี < 2.00 & สอบซ่อมแยกวิชา 1 ครั้งผ่าน",
      impactTag: "สอบซ่อมผ่านได้เกรด S เท่านั้น (และมีผลต่อการได้รับเกียรตินิยม!)",
      durationSec: 10,
      stem: "นศพ. เวลาเรียนครบ เจตคติภาพรวม (ฟอร์ม 2A) ได้ O สอบระบาดฯ ได้ 3.85 แต่สอบระบบสุขภาพได้ 1.85 (< 2.00) จึงเข้าสอบซ่อมระบบฯ 1 ครั้งและสอบผ่าน จะได้เกรดสุดท้ายใด?",
      choices: OSMU_CHOICES.slice(),
      correctIdx: 1,
      sourceRef: "คู่มือรายวิชา RACM 303 ปี 2569 ข้อ 13 การสอบซ่อมแยกวิชาและหมายเหตุเกียรตินิยม",
      doSummary: "เตรียมสอบทั้งหมวดระบบสุขภาพและระบาดวิทยาให้ผ่าน ≥ 2.00 ตั้งแต่รอบแรก (ไม่นำคะแนนทั้งสองหมวดมาถัวเฉลี่ยข้ามกัน)",
      dontSummary: "ระวัง! หากมีวิชาใด < 2.00 ต้องสอบซ่อมแยกวิชา (โอกาสแก้ตัว 1 ครั้ง) และหากมีการสอบซ่อมจะมีผลต่อการได้รับเกียรตินิยม",
      osmuRule: "ได้เกรดสุดท้าย S (Satisfactory)! เมื่อสอบแก้ตัว 1 ครั้งผ่านจะได้รับเกรด S (ไม่สามารถได้เกรด O และมีผลต่อการได้รับเกียรตินิยม · หากสอบซ่อมไม่ผ่านจะได้ U)",
      wrongHints: [
        "แม้เจตคติได้ O และระบาดฯ ได้ 3.85 แต่เนื่องจากมีการสอบซ่อมวิชาระบบสุขภาพ จึงไม่ได้เกรด O (ได้สูงสุดคือ S และกระทบเกียรตินิยม)",
        "",
        "สัญลักษณ์ M ใช้สำหรับการประเมินเจตคติคาบเส้น ส่วนผู้ที่สอบซ่อมทฤษฎีผ่านใน 1 ครั้งจะได้รับเกรดสุดท้ายรายวิชาเป็น S",
        "สอบซ่อม 1 ครั้งแล้ว 'สอบผ่าน' จึงได้รับเกรด S (จะได้ U ต้องลงทะเบียนเรียนใหม่ก็ต่อเมื่อสอบซ่อมไม่ผ่าน)"
      ]
    },
    {
      id: "sc5_outstanding_o",
      quick5: true,
      isOsmuScenario: true,
      badge: "SCENARIO 5 · พฤติกรรมดีเยี่ยมสม่ำเสมอ (1A/2A) & ทฤษฎี ≥ 3.75 ทั้งคู่",
      impactTag: "เจตคติ O + สอบทฤษฎี ≥ 3.75 ทั้งระบบฯ & ระบาดฯ + ไม่เคยสอบซ่อม = O",
      durationSec: 10,
      stem: "นศพ. เข้าเรียนครบ ซื่อสัตย์ รับผิดชอบ ช่วยเหลืองานกลุ่มสม่ำเสมอจนเจตคติภาพรวม (ฟอร์ม 2A) ได้ O และสอบทฤษฎีรอบแรกได้ ≥ 3.75 ทั้งระบบสุขภาพและระบาดวิทยา จะได้เกรดใด?",
      choices: OSMU_CHOICES.slice(),
      correctIdx: 0,
      sourceRef: "คู่มือรายวิชา RACM 303 ปี 2569 ข้อ 13 เกณฑ์การตัดสินเกรดระดับดีเยี่ยม (O)",
      doSummary: "รักษามาตรฐานความซื่อสัตย์ ความรับผิดชอบ และการทำงานเป็นทีม (ฟอร์ม 1A & เพื่อนประเมิน → ฟอร์ม 2A = O) คู่กับการสอบทฤษฎีทั้งสองหมวด ≥ 3.75 ในรอบแรก",
      dontSummary: "อย่าทิ้งด้านใดด้านหนึ่ง — หากสอบได้ ≥ 3.75 ทั้งคู่แต่เจตคติภาพรวมได้เพียง S เกรดสุดท้ายก็จะได้ S ไม่ใช่ O!",
      osmuRule: "ได้เกรดสุดท้าย O (Outstanding)! เมื่อครบ 3 เงื่อนไข: เจตคติภาพรวม (ฟอร์ม 2A) ได้ O + ผลสอบทฤษฎีได้ O (≥ 3.75) ทั้งสองหมวดวิชา + ไม่มีการสอบซ่อม",
      wrongHints: [
        "",
        "กรณีนี้ผ่านครบทั้งเจตคติระดับ O และผลสอบทฤษฎีระดับ O (≥ 3.75) ทั้งสองวิชาโดยไม่เคยสอบซ่อม จึงได้รับเกรดสูงสุดคือ O!",
        "ไม่มีพฤติกรรมไม่พึงประสงค์ใด ๆ จึงไม่ได้ M",
        "ผ่านเกณฑ์ระดับดีเยี่ยมครบทุกมิติ จึงได้เกรด O"
      ]
    }
  ];

  /* ---------- 3. Helpers & Persistent Local State ---------- */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function randomId(prefix) {
    return `${prefix || "id"}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
  }

  function safeGet(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? v : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (_) {}
  }

  const clientCli = randomId("ocli");
  const seenIds = new Set();
  function rememberId(id) {
    if (!id) return false;
    if (seenIds.has(id)) return true;
    seenIds.add(id);
    if (seenIds.size > 1600) {
      const first = seenIds.values().next().value;
      seenIds.delete(first);
    }
    return false;
  }

  function loadCustomQuestions() {
    try {
      const raw = safeGet("racm303_orient_custom_qs_v1", "[]");
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  let savedPid = safeGet("racm303_orient_pid_v1", "");
  if (!savedPid) {
    savedPid = randomId("part");
    safeSet("racm303_orient_pid_v1", savedPid);
  }

  const savedSnoInit = safeGet("racm303_orient_sno_v1", "");

  const state = {
    role: ROLE,
    participantId: savedPid,
    memberType: safeGet("racm303_orient_mtype_v1", ROLE === "faculty" ? "faculty" : "student"), // "student" | "faculty"
    joined: safeGet("racm303_orient_joined_v1", "0") === "1",
    studentId: safeGet("racm303_orient_sid_v1", ""),
    shortNo: savedSnoInit,
    pinDigits: /^\d{1,3}$/.test(savedSnoInit) ? savedSnoInit : "",
    nickname: safeGet("racm303_orient_nick_v1", ""),
    fullName: safeGet("racm303_orient_fname_v1", ""),
    area: safeGet("racm303_orient_area_v1", ""),
    disc: Number(safeGet("racm303_orient_disc_v1", "0")) || 0,
    avatar: safeGet("racm303_orient_avatar_v1", ROLE === "faculty" ? "👨‍⚕️" : "🩺"),

    mobileTab: "pad", // "pad" | "remote"
    followHostSlide: safeGet("racm303_orient_follow_v1", "1") !== "0",

    coverPaneMode: "lobby", // "lobby" | "hero"
    qrUrlMode: "prod", // "prod" | "faculty" | "current"
    qrZoomOpen: false,
    customPollModalOpen: false,
    questionPickerOpen: false,
    soundMuted: safeGet("racm303_orient_mute_v1", "0") === "1",
    participantModalOpen: false,

    presetMode: "quick5", // 5-question core O/S/M/U scenarios (10s each)
    customDurationSec: 10,
    customQuestions: loadCustomQuestions(),

    session: {
      seq: 0,
      sessionId: safeGet("racm303_orient_sess_id_v1", "orient_2569_kahoot10s"),
      phase: "lobby", // "lobby" | "question" | "reveal" | "podium"
      activeDeckIds: BASE_QUESTIONS.filter((q) => q.quick5).map((q) => q.id),
      qPos: 0,
      currentQuestion: null,
      durationSec: 10,
      baseRemainingMs: 10000,
      anchorPerfNow: performance.now(),
      timerRunning: false,
      hostSlideIdx: 0,
      hostSlideNum: "01",
      hostSlideTitle: "Orientation to Community Medicine & Health Systems Science",
      updatedWallMs: 0
    },

    participants: new Map(),
    answersByQ: new Map(),

    transports: new Set(),
    mqttClients: [],
    peer: null,
    peerConns: new Map(),
    hostConn: null,
    bc: null
  };

  function getRosterList() {
    return window.RACM_ROSTER_DATA && Array.isArray(window.RACM_ROSTER_DATA.students)
      ? window.RACM_ROSTER_DATA.students
      : [];
  }

  function findStudentsBy3Digits(pin3) {
    const clean = String(pin3 || "").replace(/\D/g, "");
    if (clean.length !== 3) return [];
    return getRosterList().filter((s) => String(s.id || "").slice(-3) === clean);
  }

  function sanitizeStudentNickname(nick, sid, sno) {
    let n = String(nick || "").trim();
    if (!n) return "";
    if (sid) {
      const escSid = String(sid).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      n = n.replace(new RegExp(`\\b${escSid}\\b`, "g"), "").trim();
    }
    const pm = n.match(/^\(([^)]+)\)$/);
    if (pm) n = pm[1].trim();
    if (sno && n.startsWith(`${sno} `)) n = n.slice(String(sno).length).trim();
    return n;
  }

  function findRosterStudent(query) {
    const raw = String(query || "").trim();
    const q = raw.toLowerCase();
    if (!q) return null;
    const list = getRosterList();
    const id7 = raw.match(/\b(\d{7})\b/);
    if (id7) {
      const m7 = list.find((s) => String(s.id) === id7[1]);
      if (m7) return m7;
    }
    const id3 = raw.match(/^(\d{3})(?:\b|\s|·|-)/);
    const parenNick = raw.match(/\(([^)]+)\)$/);
    return (
      list.find((s) => String(s.id) === q) ||
      list.find((s) => String(s.id).slice(-3) === q) ||
      (id3 && list.find((s) => String(s.id).slice(-3) === id3[1])) ||
      (parenNick && list.find((s) => String(s.id).slice(-3) === parenNick[1].trim().toLowerCase())) ||
      list.find((s) => String(s.nickname || "").toLowerCase() === q) ||
      list.find((s) => String(s.name || "").toLowerCase().includes(q) || String(s.nickname || "").toLowerCase().includes(q)) ||
      null
    );
  }

  function searchRosterCandidates(query) {
    const q = String(query || "").trim().toLowerCase();
    const list = getRosterList();
    if (!q) return list.slice(0, 6);
    return list
      .filter((s) => {
        const sid = String(s.id || "");
        const sno = sid.slice(-3);
        const nick = String(s.nickname || "").toLowerCase();
        const name = String(s.name || s.fullName || "").toLowerCase();
        const area = String(s.area || "").toLowerCase();
        return sid.includes(q) || sno.startsWith(q) || nick.includes(q) || name.includes(q) || area.includes(q);
      })
      .slice(0, 8);
  }

  function applyRosterToLocalState(stu, persistJoin) {
    if (!stu || !stu.id) return;
    state.memberType = "student";
    state.studentId = String(stu.id);
    state.shortNo = String(stu.id).slice(-3);
    state.participantId = `sid_${stu.id}`;
    state.nickname = String(stu.nickname || "").trim();
    state.fullName = String(stu.fullName || stu.name || "").trim();
    state.area = String(stu.area || "").trim();
    state.disc = Number(stu.disc) || 0;
    if (state.avatar === "👨‍⚕️") state.avatar = "🩺";
    safeSet("racm303_orient_mtype_v1", "student");
    safeSet("racm303_orient_pid_v1", state.participantId);
    safeSet("racm303_orient_sid_v1", state.studentId);
    safeSet("racm303_orient_sno_v1", state.shortNo);
    safeSet("racm303_orient_nick_v1", state.nickname);
    safeSet("racm303_orient_fname_v1", state.fullName);
    safeSet("racm303_orient_area_v1", state.area);
    safeSet("racm303_orient_disc_v1", String(state.disc));
    safeSet("racm303_orient_avatar_v1", state.avatar);
    if (persistJoin) {
      state.joined = true;
      safeSet("racm303_orient_joined_v1", "1");
    }
  }

  function applyFacultyToLocalState(fac, persistJoin) {
    if (!fac) return;
    state.memberType = "faculty";
    state.studentId = fac.code || "";
    state.shortNo = "อาจารย์";
    state.participantId = `fac_${fac.code || randomId("f")}`;
    state.nickname = fac.short || fac.fullName || "อาจารย์";
    state.fullName = fac.fullName || fac.short || "อาจารย์ประจำรายวิชา";
    state.area = "คณาจารย์";
    state.disc = 0;
    state.avatar = "👨‍⚕️";
    safeSet("racm303_orient_mtype_v1", "faculty");
    safeSet("racm303_orient_pid_v1", state.participantId);
    safeSet("racm303_orient_sid_v1", state.studentId);
    safeSet("racm303_orient_sno_v1", state.shortNo);
    safeSet("racm303_orient_nick_v1", state.nickname);
    safeSet("racm303_orient_fname_v1", state.fullName);
    safeSet("racm303_orient_area_v1", state.area);
    safeSet("racm303_orient_avatar_v1", state.avatar);
    if (persistJoin) {
      state.joined = true;
      safeSet("racm303_orient_joined_v1", "1");
    }
  }

  (function tryPrebindFromPortal() {
    if (state.memberType === "student" && state.studentId && state.nickname) {
      const cleaned = sanitizeStudentNickname(state.nickname, state.studentId, state.shortNo);
      if (cleaned && cleaned !== state.nickname) {
        state.nickname = cleaned;
        safeSet("racm303_orient_nick_v1", cleaned);
      }
    }
    if (state.studentId) return;
    const portalSid = safeGet("racm303_personal_student_id", "") || safeGet("racm303_student_id", "");
    if (!portalSid) return;
    const stu = findRosterStudent(portalSid);
    if (stu) applyRosterToLocalState(stu, false);
  })();

  function getJoinUrl() {
    if (state.qrUrlMode === "faculty") {
      return PROD_FACULTY_JOIN_URL;
    }
    if (state.qrUrlMode === "current" && typeof window !== "undefined" && window.location) {
      const href = window.location.href.split("#")[0].split("?")[0];
      return `${href}#live`;
    }
    return PROD_STUDENT_JOIN_URL;
  }

  function getAllQuestions() {
    return BASE_QUESTIONS.concat(state.customQuestions || []);
  }

  function getActiveQuestionList() {
    const all = getAllQuestions();
    const map = new Map(all.map((q) => [q.id, q]));
    const ids =
      state.session.activeDeckIds && state.session.activeDeckIds.length
        ? state.session.activeDeckIds
        : all.filter((q) => q.quick5).map((q) => q.id);
    const resolved = ids.map((id) => map.get(id)).filter(Boolean);
    return resolved.length ? resolved : BASE_QUESTIONS;
  }

  function getCurrentQuestion() {
    if (state.session.currentQuestion && state.session.currentQuestion.id) {
      return state.session.currentQuestion;
    }
    const list = getActiveQuestionList();
    return list[Math.max(0, Math.min(list.length - 1, state.session.qPos || 0))] || list[0];
  }

  function getRemainingMs() {
    const s = state.session;
    if (!s.timerRunning) return Math.max(0, Math.round(s.baseRemainingMs || 0));
    const elapsed = Math.max(0, performance.now() - s.anchorPerfNow);
    return Math.max(0, Math.round(s.baseRemainingMs - elapsed));
  }

  /* ---------- 4. Kahoot! Web Audio Synthesizer (Soft Countdown Groove + Cymbal Crash + Podium Fanfare) ---------- */
  let sharedAudioCtx = null;
  let sharedNoiseBuf = null;
  let bgmTimerId = 0;
  let bgmStepIdx = 0;
  let bgmMasterGain = null;

  function getAudioCtx() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
        sharedAudioCtx = new AudioCtx();
        sharedNoiseBuf = null;
      }
      if (sharedAudioCtx.state === "suspended") {
        sharedAudioCtx.resume().catch(() => {});
      }
      return sharedAudioCtx;
    } catch (_) {
      return null;
    }
  }

  function getNoiseBuffer(ctx) {
    if (sharedNoiseBuf && sharedNoiseBuf.sampleRate === ctx.sampleRate) return sharedNoiseBuf;
    const len = Math.floor(ctx.sampleRate * 1.6);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      ch[i] = Math.random() * 2 - 1;
    }
    sharedNoiseBuf = buf;
    return buf;
  }

  function isBigStageVisible() {
    const deckModal = document.getElementById("orientationDeckModal");
    if (deckModal && !deckModal.hidden && !state.participantModalOpen) return true;
    return state.role === "faculty" && !state.participantModalOpen;
  }

  function playTone(freqs, durSec, typeOpt, volOpt) {
    if (state.soundMuted) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const vol = volOpt || 0.08;
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = typeOpt || "triangle";
        osc.frequency.value = f;
        const t0 = ctx.currentTime + idx * (durSec * 0.65);
        gain.gain.setValueAtTime(0.0008, t0);
        gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + durSec + 0.03);
      });
    } catch (_) {}
  }

  function stopKahootCountdownBgm() {
    if (bgmTimerId) {
      clearTimeout(bgmTimerId);
      bgmTimerId = 0;
    }
    if (bgmMasterGain && sharedAudioCtx) {
      try {
        const now = sharedAudioCtx.currentTime;
        bgmMasterGain.gain.cancelScheduledValues(now);
        bgmMasterGain.gain.setValueAtTime(Math.max(0.0001, bgmMasterGain.gain.value || 0.04), now);
        bgmMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      } catch (_) {}
      bgmMasterGain = null;
    }
  }

  // Upbeat soft Kahoot-like suspense groove (bouncy bass + marimba ostinato + light hi-hat)
  const BGM_BASS_HZ = [130.81, 130.81, 98.0, 116.54, 130.81, 155.56, 174.61, 196.0];
  const BGM_LEAD_HZ = [392.0, 523.25, 622.25, 587.33, 523.25, 466.16, 392.0, 466.16, 523.25, 622.25, 698.46, 622.25, 587.33, 523.25, 466.16, 587.33];

  function scheduleKahootBgmStep() {
    bgmTimerId = 0;
    if (state.soundMuted || state.session.phase !== "question" || !state.session.timerRunning || !isBigStageVisible()) {
      stopKahootCountdownBgm();
      return;
    }
    const rem = getRemainingMs();
    if (rem <= 60) {
      stopKahootCountdownBgm();
      return;
    }
    const ctx = getAudioCtx();
    if (!ctx) return;

    if (!bgmMasterGain) {
      bgmMasterGain = ctx.createGain();
      bgmMasterGain.gain.value = 0.052; // Soft, exciting background level
      bgmMasterGain.connect(ctx.destination);
    }

    const urgent = rem <= 3200;
    const stepDurSec = urgent ? 0.185 : 0.225;
    const now = ctx.currentTime;
    const step = bgmStepIdx;
    bgmStepIdx += 1;

    try {
      // 1. Bouncy lowpass pluck bass
      const bassFreq = BGM_BASS_HZ[step % BGM_BASS_HZ.length] * (urgent ? 1.12246 : 1);
      const bOsc = ctx.createOscillator();
      const bFlt = ctx.createBiquadFilter();
      const bGain = ctx.createGain();
      bOsc.type = "sawtooth";
      bOsc.frequency.setValueAtTime(bassFreq, now);
      bFlt.type = "lowpass";
      bFlt.frequency.setValueAtTime(urgent ? 680 : 520, now);
      bGain.gain.setValueAtTime(0.001, now);
      bGain.gain.exponentialRampToValueAtTime(0.42, now + 0.012);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + stepDurSec * 0.82);
      bOsc.connect(bFlt);
      bFlt.connect(bGain);
      bGain.connect(bgmMasterGain);
      bOsc.start(now);
      bOsc.stop(now + stepDurSec * 0.88);

      // 2. Syncopated marimba/synth lead
      const leadFreq = BGM_LEAD_HZ[step % BGM_LEAD_HZ.length] * (urgent ? 1.12246 : 1);
      const lOsc = ctx.createOscillator();
      const lGain = ctx.createGain();
      lOsc.type = "triangle";
      lOsc.frequency.setValueAtTime(leadFreq, now);
      lGain.gain.setValueAtTime(0.001, now);
      lGain.gain.exponentialRampToValueAtTime(step % 2 === 0 ? 0.36 : 0.24, now + 0.01);
      lGain.gain.exponentialRampToValueAtTime(0.001, now + stepDurSec * 0.72);
      lOsc.connect(lGain);
      lGain.connect(bgmMasterGain);
      lOsc.start(now);
      lOsc.stop(now + stepDurSec * 0.78);

      // 3. Soft hi-hat tick on offbeats
      if (step % 2 === 1) {
        const hhSrc = ctx.createBufferSource();
        hhSrc.buffer = getNoiseBuffer(ctx);
        const hhFlt = ctx.createBiquadFilter();
        hhFlt.type = "highpass";
        hhFlt.frequency.value = 6800;
        const hhGain = ctx.createGain();
        hhGain.gain.setValueAtTime(0.14, now);
        hhGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        hhSrc.connect(hhFlt);
        hhFlt.connect(hhGain);
        hhGain.connect(bgmMasterGain);
        hhSrc.start(now, 0, 0.045);
      }
    } catch (_) {}

    bgmTimerId = setTimeout(scheduleKahootBgmStep, Math.round(stepDurSec * 1000));
  }

  function startKahootCountdownBgm() {
    stopKahootCountdownBgm();
    if (state.soundMuted || !isBigStageVisible()) return;
    bgmStepIdx = 0;
    scheduleKahootBgmStep();
  }

  // Realistic Cymbal Crash + Gong Boom when Quiz timer finishes!
  function playKahootTimesUpCrash() {
    stopKahootCountdownBgm();
    if (state.soundMuted) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Shimmering Cymbal Crash (filtered white noise + metallic partials)
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.setValueAtTime(3100, now);
      const bp = ctx.createBiquadFilter();
      bp.type = "peaking";
      bp.frequency.setValueAtTime(5600, now);
      bp.gain.setValueAtTime(5.5, now);
      const cymGain = ctx.createGain();
      cymGain.gain.setValueAtTime(0.001, now);
      cymGain.gain.exponentialRampToValueAtTime(0.16, now + 0.006);
      cymGain.gain.exponentialRampToValueAtTime(0.055, now + 0.22);
      cymGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.38);
      noise.connect(hp);
      hp.connect(bp);
      bp.connect(cymGain);
      cymGain.connect(ctx.destination);
      noise.start(now, 0, 1.42);

      [331, 487, 709, 983, 1367, 1913].forEach((hz) => {
        const mOsc = ctx.createOscillator();
        const mFlt = ctx.createBiquadFilter();
        const mGain = ctx.createGain();
        mOsc.type = "square";
        mOsc.frequency.setValueAtTime(hz, now);
        mFlt.type = "bandpass";
        mFlt.frequency.setValueAtTime(4200, now);
        mFlt.Q.value = 1.4;
        mGain.gain.setValueAtTime(0.022, now);
        mGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
        mOsc.connect(mFlt);
        mFlt.connect(mGain);
        mGain.connect(ctx.destination);
        mOsc.start(now);
        mOsc.stop(now + 0.6);
      });

      // 2. Warm Timpani / Gong Impact + Kahoot Reveal Triad
      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.type = "sine";
      boom.frequency.setValueAtTime(156, now);
      boom.frequency.exponentialRampToValueAtTime(54, now + 0.42);
      boomGain.gain.setValueAtTime(0.18, now);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      boom.connect(boomGain);
      boomGain.connect(ctx.destination);
      boom.start(now);
      boom.stop(now + 0.58);

      [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
        const bell = ctx.createOscillator();
        const bGain = ctx.createGain();
        bell.type = "triangle";
        bell.frequency.setValueAtTime(f, now + 0.04 + idx * 0.045);
        bGain.gain.setValueAtTime(0.001, now + 0.04 + idx * 0.045);
        bGain.gain.exponentialRampToValueAtTime(0.075, now + 0.06 + idx * 0.045);
        bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62 + idx * 0.045);
        bell.connect(bGain);
        bGain.connect(ctx.destination);
        bell.start(now + 0.04 + idx * 0.045);
        bell.stop(now + 0.66 + idx * 0.045);
      });
    } catch (_) {}
  }

  function playKahootPodiumFanfare() {
    stopKahootCountdownBgm();
    if (state.soundMuted) return;
    playTone([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.22, "triangle", 0.1);
    setTimeout(() => {
      if (!state.soundMuted) playKahootTimesUpCrash();
    }, 520);
  }

  /* ---------- 5. Real-Time Transport Layer (BroadcastChannel + MQTT WSS + PeerJS) ---------- */
  function publishPacket(subpath, payload, retain) {
    const msg = Object.assign({}, payload, {
      msgId: payload.msgId || randomId("opkt"),
      senderCli: clientCli,
      sentWallMs: Date.now()
    });
    rememberId(msg.msgId);
    const raw = JSON.stringify(msg);

    if (state.bc) {
      try {
        state.bc.postMessage({ subpath, msg });
      } catch (_) {}
    }

    const fullTopic = `${TOPIC_NS}/${subpath}`;
    state.mqttClients.forEach((client) => {
      try {
        if (client && client.connected) {
          client.publish(fullTopic, raw, { qos: 0, retain: Boolean(retain) });
        }
      } catch (_) {}
    });

    const env = { subpath, msg };
    if (state.role === "faculty") {
      state.peerConns.forEach((conn) => {
        try {
          if (conn && conn.open) conn.send(env);
        } catch (_) {}
      });
    } else if (state.hostConn && state.hostConn.open) {
      try {
        state.hostConn.send(env);
      } catch (_) {}
    }
  }

  function handlePacket(subpath, msg, isRetained) {
    if (!msg || typeof msg !== "object") return;
    if (msg.senderCli === clientCli) return;
    if (rememberId(msg.msgId)) return;

    if (state.role === "faculty" && state.peerConns.size > 1) {
      state.peerConns.forEach((conn) => {
        try {
          if (conn && conn.open) conn.send({ subpath, msg });
        } catch (_) {}
      });
    }

    if (msg.type === "session") {
      if (isRetained && state.hasLocalHostAuthority) {
        return;
      }
      if (isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > STALE_SESSION_MS) {
        return;
      }
      const incomingSeq = Number(msg.seq) || 0;
      if (incomingSeq <= state.session.seq && (msg.sentWallMs || 0) <= (state.session.updatedWallMs || 0)) {
        return;
      }
      const prevPhase = state.session.phase;
      const prevQId = state.session.currentQuestion && state.session.currentQuestion.id;
      const prevHostSlide = state.session.hostSlideIdx;
      let rem = Math.max(0, Number(msg.remainingMs) || 0);
      if (msg.timerRunning && isRetained && msg.sentWallMs) {
        rem = Math.max(0, rem - Math.max(0, Date.now() - Number(msg.sentWallMs)));
      }

      if (msg.sessionId && msg.sessionId !== state.session.sessionId) {
        state.answersByQ.clear();
        state.session.sessionId = String(msg.sessionId);
        safeSet("racm303_orient_sess_id_v1", state.session.sessionId);
      }

      state.session.seq = Math.max(state.session.seq, incomingSeq);
      state.session.phase = String(msg.phase || "lobby");
      if (Array.isArray(msg.activeDeckIds) && msg.activeDeckIds.length) {
        state.session.activeDeckIds = msg.activeDeckIds.slice();
      }
      state.session.qPos = Number(msg.qPos) || 0;
      if (msg.currentQuestion) {
        const baseMatch = getAllQuestions().find((item) => item.id === msg.currentQuestion.id);
        state.session.currentQuestion = baseMatch ? Object.assign({}, baseMatch, msg.currentQuestion, { correctIdx: baseMatch.correctIdx }) : msg.currentQuestion;
        if (typeof state.session.currentQuestion.correctIdx === "number") {
          const rqMap = state.answersByQ.get(state.session.currentQuestion.id);
          if (rqMap) {
            const durMs = Math.max(1000, (Number(msg.durationSec) || 10) * 1000);
            rqMap.forEach((ans) => {
              const isR = Number(ans.choiceIdx) === Number(state.session.currentQuestion.correctIdx);
              const spRatio = Math.max(0, Math.min(1, Math.max(0, durMs - (ans.elapsedMs || 1000)) / durMs));
              ans.correct = isR;
              ans.points = isR ? Math.round(500 + 500 * spRatio) : 0;
            });
          }
        }
      } else {
        state.session.currentQuestion = null;
      }
      state.session.durationSec = Math.max(5, Number(msg.durationSec) || 10);
      state.session.baseRemainingMs = rem;
      state.session.anchorPerfNow = performance.now();
      state.session.timerRunning = Boolean(msg.timerRunning) && rem > 0;
      if (msg.hostSlideIdx !== undefined) state.session.hostSlideIdx = Number(msg.hostSlideIdx) || 0;
      if (msg.hostSlideNum) state.session.hostSlideNum = String(msg.hostSlideNum);
      if (msg.hostSlideTitle) state.session.hostSlideTitle = String(msg.hostSlideTitle);
      state.session.updatedWallMs = Number(msg.sentWallMs) || Date.now();

      if (
        !isRetained &&
        state.followHostSlide &&
        state.session.hostSlideIdx !== prevHostSlide &&
        window.RACM_ORIENTATION_DECK &&
        typeof window.RACM_ORIENTATION_DECK.followRemoteSlide === "function"
      ) {
        window.RACM_ORIENTATION_DECK.followRemoteSlide(state.session.hostSlideIdx);
      }

      const nextQId = state.session.currentQuestion && state.session.currentQuestion.id;
      if (state.session.phase === "question" && (prevPhase !== "question" || prevQId !== nextQId)) {
        if (navigator.vibrate) {
          try { navigator.vibrate([110, 50, 110]); } catch (_) {}
        }
        const deckModal = document.getElementById("orientationDeckModal");
        const isPresentingBigScreen =
          state.role === "faculty" && deckModal && !deckModal.hidden && window.innerWidth >= 1024;
        if (state.joined && !isPresentingBigScreen) {
          state.participantModalOpen = true;
          state.mobileTab = "pad";
        }
        playTone([523.25, 659.25, 783.99], 0.13, "triangle", 0.08);
        startKahootCountdownBgm();
      } else if (state.session.phase === "reveal" && prevPhase === "question") {
        playKahootTimesUpCrash();
      } else if (state.session.phase === "podium" && prevPhase !== "podium") {
        playKahootPodiumFanfare();
      } else if (state.session.phase !== "question") {
        stopKahootCountdownBgm();
      }

      renderAllSurfaces(true);
      updateFloatingBanner();
      return;
    }

    if (msg.type === "remote_cmd" && !isRetained) {
      const deckModal = document.getElementById("orientationDeckModal");
      const isHostScreen = state.role === "faculty" || Boolean(deckModal && !deckModal.hidden && window.innerWidth >= 900);
      if (isHostScreen && window.RACM_ORIENTATION_DECK) {
        const cmd = String(msg.cmd || "");
        if (cmd === "slide-next") {
          window.RACM_ORIENTATION_DECK.stepSlide(1);
        } else if (cmd === "slide-prev") {
          window.RACM_ORIENTATION_DECK.stepSlide(-1);
        } else if (cmd === "toggle-blackout" && typeof window.RACM_ORIENTATION_DECK.toggleBlackout === "function") {
          window.RACM_ORIENTATION_DECK.toggleBlackout();
        } else if (cmd === "goto-slide" && typeof msg.slideIdx === "number") {
          window.RACM_ORIENTATION_DECK.goToSlide(msg.slideIdx);
        } else if (cmd === "start-q0") {
          hostStartQuestionAt(0);
        } else if (cmd === "reveal-now") {
          hostRevealAnswer();
        } else if (cmd === "next-question") {
          hostNextStep();
        }
      }
      return;
    }

    if (msg.type === "presence") {
      const pid = String(msg.participantId || "").slice(0, 48);
      if (!pid) return;
      if (msg.left) {
        if (state.participants.delete(pid)) refreshLiveCountsAndChips();
        return;
      }
      if (isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > STALE_PRESENCE_MS) {
        return;
      }
      const isNew = !state.participants.has(pid);
      state.participants.set(pid, {
        participantId: pid,
        memberType: msg.memberType === "faculty" ? "faculty" : "student",
        studentId: String(msg.studentId || "").slice(0, 16),
        shortNo: String(msg.shortNo || "").slice(0, 12),
        nickname: String(msg.nickname || "").slice(0, 36),
        fullName: String(msg.fullName || "").slice(0, 80),
        area: String(msg.area || "").slice(0, 40),
        disc: Number(msg.disc) || 0,
        avatar: String(msg.avatar || "🩺").slice(0, 8),
        joinedWallMs: Number(msg.joinedWallMs || msg.sentWallMs || Date.now()),
        lastSeenMs: Date.now()
      });
      if (isNew && state.role === "faculty" && !isRetained) {
        playTone([659.25, 880], 0.09, "sine", 0.05);
      }
      refreshLiveCountsAndChips();
      return;
    }

    if (msg.type === "answer") {
      const qId = String(msg.qId || "").slice(0, 48);
      const pid = String(msg.participantId || "").slice(0, 48);
      if (!qId || !pid) return;
      if (msg.sessionId && msg.sessionId !== state.session.sessionId) return;
      if (!state.answersByQ.has(qId)) state.answersByQ.set(qId, new Map());
      const qMap = state.answersByQ.get(qId);
      const localQ = getAllQuestions().find((item) => item.id === qId) || state.session.currentQuestion;
      if (!qMap.has(pid)) {
        const cIdx = Math.max(0, Math.min(5, Number(msg.choiceIdx) || 0));
        const elMs = Math.max(80, Number(msg.elapsedMs) || 1000);
        const durMs = Math.max(1000, (state.session.durationSec || 10) * 1000);
        const hasKey = localQ && typeof localQ.correctIdx === "number";
        const isRight = hasKey ? cIdx === Number(localQ.correctIdx) : Boolean(msg.correct);
        const speedRatio = Math.max(0, Math.min(1, Math.max(0, durMs - elMs) / durMs));
        const pts = isRight ? Math.round(500 + 500 * speedRatio) : 0;
        qMap.set(pid, {
          participantId: pid,
          memberType: msg.memberType === "faculty" ? "faculty" : "student",
          qId,
          choiceIdx: cIdx,
          correct: isRight,
          points: hasKey ? pts : Math.max(0, Math.min(1500, Number(msg.points) || 0)),
          elapsedMs: elMs,
          studentId: String(msg.studentId || "").slice(0, 16),
          shortNo: String(msg.shortNo || "").slice(0, 12),
          nickname: String(msg.nickname || "").slice(0, 36),
          area: String(msg.area || "").slice(0, 40),
          avatar: String(msg.avatar || "🩺").slice(0, 8),
          sentWallMs: Number(msg.sentWallMs) || Date.now()
        });
      }
      if (!state.participants.has(pid)) {
        state.participants.set(pid, {
          participantId: pid,
          memberType: msg.memberType === "faculty" ? "faculty" : "student",
          studentId: String(msg.studentId || "").slice(0, 16),
          shortNo: String(msg.shortNo || "").slice(0, 12),
          nickname: String(msg.nickname || "ผู้เข้าร่วม").slice(0, 36),
          fullName: String(msg.fullName || "").slice(0, 80),
          area: String(msg.area || "").slice(0, 40),
          disc: 0,
          avatar: String(msg.avatar || "🩺").slice(0, 8),
          joinedWallMs: Date.now(),
          lastSeenMs: Date.now()
        });
      } else {
        state.participants.get(pid).lastSeenMs = Date.now();
      }

      const brkNow = getParticipantRoleBreakdown();
      let stuAnsCount = 0;
      qMap.forEach((a) => {
        if (a.memberType !== "faculty") stuAnsCount += 1;
      });
      const allTargetAnswered = brkNow.stu > 0 ? stuAnsCount >= brkNow.stu : qMap.size >= state.participants.size;

      if (
        isBigStageVisible() &&
        state.session.phase === "question" &&
        state.session.timerRunning &&
        state.session.currentQuestion &&
        state.session.currentQuestion.id === qId &&
        state.participants.size > 0 &&
        allTargetAnswered
      ) {
        setTimeout(() => {
          if (isBigStageVisible() && state.session.phase === "question" && state.session.currentQuestion && state.session.currentQuestion.id === qId) {
            hostRevealAnswer();
          }
        }, 450);
      } else {
        refreshLiveCountsAndChips();
      }
      return;
    }

    if (msg.type === "reset_answers") {
      state.answersByQ.clear();
      stopKahootCountdownBgm();
      if (msg.sessionId) {
        state.session.sessionId = String(msg.sessionId);
        safeSet("racm303_orient_sess_id_v1", state.session.sessionId);
      }
      renderAllSurfaces(true);
      return;
    }

    if (msg.type === "who_is_here" && !isRetained) {
      if (state.joined) {
        publishMyPresence();
        state.answersByQ.forEach((qMap) => {
          const mine = qMap.get(state.participantId);
          if (mine) {
            publishPacket(
              `answer/${mine.qId}/${state.participantId}`,
              {
                type: "answer",
                sessionId: state.session.sessionId,
                participantId: mine.participantId,
                memberType: mine.memberType,
                qId: mine.qId,
                choiceIdx: mine.choiceIdx,
                elapsedMs: mine.elapsedMs,
                studentId: mine.studentId,
                shortNo: mine.shortNo,
                nickname: mine.nickname,
                area: mine.area,
                avatar: mine.avatar,
                sentWallMs: mine.sentWallMs
              },
              false
            );
          }
        });
      }
      if (isBigStageVisible() && state.session.seq > 0) {
        broadcastSessionState();
      }
    }
  }

  function initTransports() {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        state.bc = new BroadcastChannel(BC_NAME);
        state.transports.add("local");
        state.bc.onmessage = (ev) => {
          if (ev && ev.data && ev.data.msg) handlePacket(ev.data.subpath || "", ev.data.msg, false);
        };
      } catch (_) {}
    }

    if (window.mqtt && typeof window.mqtt.connect === "function") {
      BROKERS.forEach((url, idx) => {
        try {
          const tag = `mqtt${idx + 1}`;
          const client = window.mqtt.connect(url, {
            clientId: `racm303_orl_${state.role}_${Math.random().toString(16).slice(2, 10)}`,
            clean: true,
            connectTimeout: 7000,
            reconnectPeriod: 5000,
            keepalive: 45
          });
          client.on("connect", () => {
            state.transports.add(tag);
            try {
              client.subscribe(`${TOPIC_NS}/#`, { qos: 0 });
            } catch (_) {}
            if (state.joined) publishMyPresence();
            publishPacket("cmd", { type: "who_is_here" }, false);
            refreshLiveCountsAndChips();
          });
          client.on("close", () => {
            state.transports.delete(tag);
            refreshLiveCountsAndChips();
          });
          client.on("error", () => {
            state.transports.delete(tag);
          });
          client.on("message", (topic, buf, pkt) => {
            try {
              if (!topic.startsWith(`${TOPIC_NS}/`)) return;
              const sub = topic.slice(TOPIC_NS.length + 1);
              const parsed = JSON.parse(buf ? buf.toString() : "");
              handlePacket(sub, parsed, Boolean(pkt && pkt.retain));
            } catch (_) {}
          });
          state.mqttClients.push(client);
        } catch (_) {}
      });
    }

    if (typeof window.Peer === "function") {
      try {
        if (state.role === "faculty") {
          const peer = new window.Peer(HOST_PEER_ID, { debug: 0 });
          state.peer = peer;
          peer.on("open", () => {
            state.transports.add("peer");
            refreshLiveCountsAndChips();
          });
          peer.on("connection", (conn) => {
            state.peerConns.set(conn.peer, conn);
            conn.on("open", () => {
              try {
                conn.send({ subpath: "session", msg: buildSessionPacket() });
                state.participants.forEach((p) => {
                  conn.send({ subpath: `presence/${p.participantId}`, msg: Object.assign({ type: "presence", msgId: randomId("psync") }, p) });
                });
              } catch (_) {}
            });
            conn.on("data", (d) => {
              if (d && d.msg) handlePacket(d.subpath || "", d.msg, false);
            });
            conn.on("close", () => state.peerConns.delete(conn.peer));
            conn.on("error", () => state.peerConns.delete(conn.peer));
          });
          peer.on("error", () => {
            state.transports.delete("peer");
          });
        } else {
          const peer = new window.Peer(undefined, { debug: 0 });
          state.peer = peer;
          peer.on("open", () => {
            try {
              const conn = peer.connect(HOST_PEER_ID, { reliable: true });
              state.hostConn = conn;
              conn.on("open", () => {
                state.transports.add("peer");
                if (state.joined) publishMyPresence();
                conn.send({ subpath: "cmd", msg: { type: "who_is_here", msgId: randomId("who") } });
                refreshLiveCountsAndChips();
              });
              conn.on("data", (d) => {
                if (d && d.msg) handlePacket(d.subpath || "", d.msg, false);
              });
              conn.on("close", () => state.transports.delete("peer"));
              conn.on("error", () => state.transports.delete("peer"));
            } catch (_) {}
          });
          peer.on("error", () => {});
        }
      } catch (_) {}
    }
  }

  function isCloudConnected() {
    for (const t of state.transports) {
      if (t.startsWith("mqtt") || t === "peer") return true;
    }
    return false;
  }

  /* ---------- 6. Presence, Breakdown, Speed & Leaderboard ---------- */
  function getPlayerLabel(p) {
    if (!p) return "ผู้เข้าร่วม";
    if (p.memberType === "faculty" || p.area === "คณาจารย์") {
      return p.nickname || p.fullName || "อาจารย์";
    }
    const sno = p.shortNo || (p.studentId ? String(p.studentId).slice(-3) : "");
    const nick = sanitizeStudentNickname(p.nickname, p.studentId, sno);
    if (sno && nick) return `${sno} ${nick}`;
    if (nick) return nick;
    if (sno && p.fullName) return `${sno} ${p.fullName.split(" ")[0]}`;
    return p.fullName || p.studentId || "ผู้เข้าร่วม";
  }

  function getParticipantRoleBreakdown() {
    let stu = 0;
    let fac = 0;
    state.participants.forEach((p) => {
      if (p.memberType === "faculty" || p.area === "คณาจารย์") fac += 1;
      else stu += 1;
    });
    return { total: stu + fac, stu, fac };
  }

  function publishMyPresence() {
    if (!state.joined) return;
    const rec = {
      participantId: state.participantId,
      memberType: state.memberType === "faculty" ? "faculty" : "student",
      studentId: state.studentId || "",
      shortNo: state.shortNo || (state.studentId && state.memberType !== "faculty" ? String(state.studentId).slice(-3) : ""),
      nickname: state.nickname || "ผู้เข้าร่วม",
      fullName: state.fullName || "",
      area: state.area || (state.memberType === "faculty" ? "คณาจารย์" : ""),
      disc: state.disc || 0,
      avatar: state.avatar || (state.memberType === "faculty" ? "👨‍⚕️" : "🩺"),
      joinedWallMs: Date.now(),
      lastSeenMs: Date.now()
    };
    state.participants.set(state.participantId, rec);
    publishPacket(`presence/${state.participantId}`, Object.assign({ type: "presence" }, rec), true);
    refreshLiveCountsAndChips();
  }

  function getSortedParticipants() {
    const arr = Array.from(state.participants.values());
    arr.sort((a, b) => (b.joinedWallMs || 0) - (a.joinedWallMs || 0));
    return arr;
  }

  function getAreaCounts() {
    const counts = {};
    state.participants.forEach((p) => {
      const k = p.memberType === "faculty" ? "คณาจารย์" : p.area || "ทั่วไป";
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }

  function computeLeaderboard() {
    const board = new Map();
    state.participants.forEach((p, pid) => {
      board.set(pid, {
        participantId: pid,
        memberType: p.memberType || "student",
        label: getPlayerLabel(p),
        avatar: p.avatar || "🩺",
        area: p.area || "",
        score: 0,
        correctCount: 0,
        answeredCount: 0,
        streak: 0,
        maxStreak: 0,
        totalCorrectMs: 0,
        bestCorrectMs: Infinity,
        avgCorrectMs: Infinity,
        avgCorrectSec: null
      });
    });

    const qList = getActiveQuestionList();
    qList.forEach((q) => {
      const qMap = state.answersByQ.get(q.id);
      if (!qMap) return;
      qMap.forEach((ans, pid) => {
        if (!board.has(pid)) {
          board.set(pid, {
            participantId: pid,
            memberType: ans.memberType || "student",
            label: getPlayerLabel(ans),
            avatar: ans.avatar || "🩺",
            area: ans.area || "",
            score: 0,
            correctCount: 0,
            answeredCount: 0,
            streak: 0,
            maxStreak: 0,
            totalCorrectMs: 0,
            bestCorrectMs: Infinity,
            avgCorrectMs: Infinity,
            avgCorrectSec: null
          });
        }
        const entry = board.get(pid);
        entry.answeredCount += 1;
        if (ans.correct) {
          const elMs = Math.max(80, Number(ans.elapsedMs) || 1000);
          entry.correctCount += 1;
          entry.totalCorrectMs += elMs;
          if (elMs < entry.bestCorrectMs) entry.bestCorrectMs = elMs;
          entry.streak += 1;
          if (entry.streak > entry.maxStreak) entry.maxStreak = entry.streak;
          const streakBonus = entry.streak >= 3 ? 100 : entry.streak === 2 ? 50 : 0;
          entry.score += (ans.points || 500) + streakBonus;
        } else {
          entry.streak = 0;
        }
      });
    });

    const list = Array.from(board.values()).filter((entry) => entry.memberType !== "faculty" || entry.answeredCount > 0);
    list.forEach((entry) => {
      if (entry.correctCount > 0) {
        entry.avgCorrectMs = Math.round(entry.totalCorrectMs / entry.correctCount);
        entry.avgCorrectSec = (entry.totalCorrectMs / entry.correctCount / 1000).toFixed(2);
      }
    });
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      if (a.avgCorrectMs !== b.avgCorrectMs) return a.avgCorrectMs - b.avgCorrectMs;
      return a.label.localeCompare(b.label, "th");
    });
    return list;
  }

  function getFastestCorrectAnswers(q, limit) {
    if (!q) return [];
    const qMap = state.answersByQ.get(q.id);
    if (!qMap) return [];
    const right = [];
    qMap.forEach((ans) => {
      if (ans && ans.correct) {
        right.push({
          label: getPlayerLabel(ans),
          avatar: ans.avatar || "🩺",
          area: ans.area || "",
          points: ans.points || 500,
          elapsedMs: Math.max(80, Number(ans.elapsedMs) || 1000),
          secStr: (Math.max(80, Number(ans.elapsedMs) || 1000) / 1000).toFixed(2)
        });
      }
    });
    right.sort((a, b) => a.elapsedMs - b.elapsedMs);
    return right.slice(0, limit || 3);
  }

  function getQuestionStats(q) {
    const nChoices = q && Array.isArray(q.choices) && q.choices.length ? q.choices.length : 4;
    const counts = new Array(nChoices).fill(0);
    if (!q) return { counts, total: 0, correctCount: 0, pctCorrect: 0, topWrongIdx: -1, topWrongCount: 0 };
    const qMap = state.answersByQ.get(q.id);
    if (qMap) {
      qMap.forEach((ans) => {
        const c = Math.max(0, Math.min(nChoices - 1, Number(ans.choiceIdx) || 0));
        counts[c] += 1;
      });
    }
    const total = counts.reduce((acc, v) => acc + v, 0);
    const correctCount = counts[q.correctIdx] || 0;
    const pctCorrect = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    let topWrongIdx = -1;
    let topWrongCount = 0;
    for (let i = 0; i < nChoices; i += 1) {
      if (i !== q.correctIdx && counts[i] > topWrongCount) {
        topWrongCount = counts[i];
        topWrongIdx = i;
      }
    }
    return { counts, total, correctCount, pctCorrect, topWrongIdx, topWrongCount };
  }

  /* ---------- 7. Host & Remote Controls ---------- */
  function buildSessionPacket() {
    let pubQ = state.session.currentQuestion;
    if (pubQ && state.session.phase === "question") {
      pubQ = {
        id: pubQ.id,
        cat: pubQ.cat,
        impactTag: pubQ.impactTag,
        durationSec: pubQ.durationSec,
        choiceCount: pubQ.choiceCount,
        stem: pubQ.stem,
        choices: pubQ.choices
      };
    }
    return {
      type: "session",
      msgId: randomId("sess"),
      seq: state.session.seq,
      sessionId: state.session.sessionId,
      phase: state.session.phase,
      activeDeckIds: state.session.activeDeckIds,
      qPos: state.session.qPos,
      currentQuestion: pubQ,
      durationSec: state.session.durationSec,
      remainingMs: getRemainingMs(),
      timerRunning: state.session.timerRunning,
      hostSlideIdx: state.session.hostSlideIdx,
      hostSlideNum: state.session.hostSlideNum,
      hostSlideTitle: state.session.hostSlideTitle
    };
  }

  function broadcastSessionState() {
    state.hasLocalHostAuthority = true;
    state.session.seq = Math.max(Date.now(), (state.session.seq || 0) + 1);
    state.session.updatedWallMs = Date.now();
    publishPacket("session", buildSessionPacket(), true);
  }

  function applyPresetDeck(preset) {
    state.presetMode = preset;
    const all = getAllQuestions();
    if (preset === "quick5") {
      state.session.activeDeckIds = all.filter((q) => q.quick5).map((q) => q.id);
    } else {
      state.session.activeDeckIds = all.map((q) => q.id);
    }
  }

  function hostOpenLobby() {
    stopKahootCountdownBgm();
    state.session.phase = "lobby";
    state.session.timerRunning = false;
    broadcastSessionState();
    renderAllSurfaces(true);
  }

  function hostStartQuestionAt(pos) {
    const deck = getActiveQuestionList();
    const safePos = Math.max(0, Math.min(deck.length - 1, Number(pos) || 0));
    const q = deck[safePos];
    if (!q) return;
    const dur = Number(state.customDurationSec) || q.durationSec || 10;
    state.session.qPos = safePos;
    state.session.currentQuestion = q;
    state.session.phase = "question";
    state.session.durationSec = dur;
    state.session.baseRemainingMs = dur * 1000;
    state.session.anchorPerfNow = performance.now();
    state.session.timerRunning = true;
    state.questionPickerOpen = false;
    playTone([440, 554.37, 659.25], 0.11, "triangle", 0.08);
    startKahootCountdownBgm();
    broadcastSessionState();
    renderAllSurfaces(true);
  }

  function hostRevealAnswer() {
    const wasQuestion = state.session.phase === "question";
    stopKahootCountdownBgm();
    state.session.phase = "reveal";
    state.session.baseRemainingMs = 0;
    state.session.timerRunning = false;
    if (wasQuestion) {
      playKahootTimesUpCrash();
    } else {
      playTone([587.33, 783.99, 1046.5], 0.16, "sine", 0.1);
    }
    broadcastSessionState();
    renderAllSurfaces(true);
  }

  function hostNextStep() {
    const deck = getActiveQuestionList();
    if (state.session.qPos + 1 < deck.length) {
      hostStartQuestionAt(state.session.qPos + 1);
    } else {
      stopKahootCountdownBgm();
      state.session.phase = "podium";
      state.session.timerRunning = false;
      playKahootPodiumFanfare();
      broadcastSessionState();
      renderAllSurfaces(true);
    }
  }

  function hostResetSession() {
    stopKahootCountdownBgm();
    const newSessId = `orient_${Date.now().toString(36)}`;
    state.session.sessionId = newSessId;
    safeSet("racm303_orient_sess_id_v1", newSessId);
    state.answersByQ.clear();
    state.session.phase = "lobby";
    state.session.qPos = 0;
    state.session.currentQuestion = null;
    state.session.timerRunning = false;
    publishPacket("cmd", { type: "reset_answers", sessionId: newSessId }, false);
    broadcastSessionState();
    renderAllSurfaces(true);
  }

  function notifyHostSlide(slideIdx, slideObj) {
    if (state.role !== "faculty") return;
    state.session.hostSlideIdx = Number(slideIdx) || 0;
    if (slideObj) {
      state.session.hostSlideNum = String(slideObj.num || "01");
      state.session.hostSlideTitle = String(slideObj.title || "");
    }
    broadcastSessionState();
    if (state.participantModalOpen) renderParticipantModal();
  }

  function sendRemoteCommand(cmd, extra) {
    publishPacket("cmd", Object.assign({ type: "remote_cmd", cmd }, extra || {}), false);
    if (window.RACM_ORIENTATION_DECK) {
      if (cmd === "slide-next") window.RACM_ORIENTATION_DECK.stepSlide(1);
      else if (cmd === "slide-prev") window.RACM_ORIENTATION_DECK.stepSlide(-1);
      else if (cmd === "toggle-blackout" && typeof window.RACM_ORIENTATION_DECK.toggleBlackout === "function") {
        window.RACM_ORIENTATION_DECK.toggleBlackout();
      } else if (cmd === "goto-slide" && extra && typeof extra.slideIdx === "number") {
        window.RACM_ORIENTATION_DECK.goToSlide(extra.slideIdx);
      }
    }
    if (state.role === "faculty") {
      if (cmd === "start-q0") hostStartQuestionAt(0);
      else if (cmd === "reveal-now") hostRevealAnswer();
      else if (cmd === "next-question") hostNextStep();
    }
  }

  function stepQuizWithClicker(allowStartFromLobby) {
    if (state.session.phase === "lobby") {
      if (!allowStartFromLobby) return false;
      hostStartQuestionAt(0);
      return true;
    }
    if (state.session.phase === "question") {
      hostRevealAnswer();
      return true;
    }
    if (state.session.phase === "reveal") {
      hostNextStep();
      return true;
    }
    return false;
  }

  /* ---------- 8. Answer Submission ---------- */
  function submitMyAnswer(choiceIdx) {
    if (state.session.phase !== "question") return;
    const q = getCurrentQuestion();
    if (!q) return;
    if (!state.answersByQ.has(q.id)) state.answersByQ.set(q.id, new Map());
    const qMap = state.answersByQ.get(q.id);
    if (qMap.has(state.participantId)) return;

    const remMs = getRemainingMs();
    const durMs = Math.max(1000, (state.session.durationSec || 10) * 1000);
    const elapsedMs = Math.max(80, durMs - remMs);
    const fullQ = getAllQuestions().find((item) => item.id === q.id) || q;
    const isCorrect = typeof fullQ.correctIdx === "number" ? Number(choiceIdx) === Number(fullQ.correctIdx) : false;
    const speedRatio = Math.max(0, Math.min(1, remMs / durMs));
    const points = isCorrect ? Math.round(500 + 500 * speedRatio) : 0;

    const rec = {
      participantId: state.participantId,
      memberType: state.memberType || "student",
      qId: q.id,
      choiceIdx: Number(choiceIdx),
      correct: isCorrect,
      points,
      elapsedMs,
      studentId: state.studentId || "",
      shortNo: state.shortNo || "",
      nickname: state.nickname || "ผู้เข้าร่วม",
      area: state.area || "",
      avatar: state.avatar || "🩺",
      sentWallMs: Date.now()
    };
    qMap.set(state.participantId, rec);
    playTone([587.33, 880], 0.09, "sine", 0.07);
    const wireAns = {
      type: "answer",
      sessionId: state.session.sessionId,
      participantId: rec.participantId,
      memberType: rec.memberType,
      qId: rec.qId,
      choiceIdx: rec.choiceIdx,
      elapsedMs: rec.elapsedMs,
      studentId: rec.studentId,
      shortNo: rec.shortNo,
      nickname: rec.nickname,
      area: rec.area,
      avatar: rec.avatar,
      sentWallMs: rec.sentWallMs
    };
    publishPacket(`answer/${q.id}/${state.participantId}`, wireAns, false);
    renderParticipantModal();
    refreshLiveCountsAndChips();
  }

  /* ---------- 9. Tick Loop & Heartbeat ---------- */
  let lastTickSec = -1;
  setInterval(() => {
    if (state.session.timerRunning && state.session.phase === "question") {
      const rem = getRemainingMs();
      const secLeft = Math.ceil(rem / 1000);
      if (secLeft !== lastTickSec) {
        lastTickSec = secLeft;
        if (secLeft > 0 && secLeft <= 3) {
          playTone([secLeft === 1 ? 987.77 : 783.99], 0.065, "sine", 0.055);
        }
      }
      updateTimerDomInPlace(rem);
      if (rem <= 0) {
        state.session.timerRunning = false;
        state.session.baseRemainingMs = 0;
        if (isBigStageVisible()) {
          hostRevealAnswer();
        } else {
          playKahootTimesUpCrash();
          renderParticipantModal();
        }
      }
    }
  }, 120);

  setInterval(() => {
    const now = Date.now();
    let changed = false;
    state.participants.forEach((p, pid) => {
      if (pid !== state.participantId && now - (p.lastSeenMs || 0) > STALE_PRESENCE_MS) {
        state.participants.delete(pid);
        changed = true;
      }
    });
    if (changed) refreshLiveCountsAndChips();
    if (state.joined) publishMyPresence();
  }, 22000);

  /* ---------- 10. UI Surface 1: Cover Slide 01 QR & Simultaneous Scan Lobby ---------- */
  function buildJoinedChipsMarkup(limit, isCover) {
    const list = getSortedParticipants();
    if (!list.length) {
      if (isCover) {
        return `
          <div class="orl-empty-onboard">
            <div class="orl-eo-kicker">📲 เข้าร่วมห้องสดพร้อมกันใน 3 ขั้นตอน</div>
            <div class="orl-eo-steps">
              <div class="orl-eo-step"><span class="orl-eo-num">1</span><span>เปิดกล้องมือถือหรือแท็บเล็ต สแกน <strong>QR Code</strong> ด้านซ้าย</span></div>
              <div class="orl-eo-step"><span class="orl-eo-num">2</span><span>เลือกสถานะ <strong>นศพ. (รหัส 3 ตัวท้าย)</strong> หรือ <strong>คณาจารย์</strong></span></div>
              <div class="orl-eo-step"><span class="orl-eo-num">3</span><span>ซิงค์สไลด์สด ซูมภาพชัด และร่วมตอบ <strong>Quiz O · S · M · U</strong></span></div>
            </div>
          </div>
        `;
      }
      return `
        <div class="orl-empty-onboard is-stage-wall">
          <div class="orl-eo-kicker">📲 รอผู้เข้าร่วมสแกน QR Code ด้านซ้าย</div>
          <div class="orl-eo-subhint">ทั้งคณาจารย์และนักศึกษาสแกน QR ด้วยกล้องมือถือหรือแท็บเล็ต เพื่อเข้าห้องรอ ซิงค์สไลด์สด และร่วมตอบคำถามไปพร้อมกัน — รายชื่อจะแสดงสดที่นี่อัตโนมัติ</div>
        </div>
      `;
    }
    const slice = list.slice(0, limit || 10);
    const extra = list.length - slice.length;
    const chipsHtml =
      slice
        .map((p) => {
          const isFac = p.memberType === "faculty" || p.area === "คณาจารย์";
          return `<span class="orl-p-chip${isFac ? " is-fac-chip" : ""}" title="${esc(p.fullName || p.nickname)} (${esc(p.area || "RACM 303")})"><span class="orl-p-ava">${esc(p.avatar || (isFac ? "👨‍⚕️" : "🩺"))}</span><strong>${esc(getPlayerLabel(p))}</strong>${p.area ? `<em>· ${esc(p.area)}</em>` : ""}</span>`;
        })
        .join("") +
      (extra > 0 ? `<span class="orl-p-chip is-more">+ อีก ${extra} คน</span>` : "");

    if (isCover && list.length <= 3) {
      return `
        <div class="orl-chips-sparse-wrap">
          <div class="orl-chips-row">${chipsHtml}</div>
          <div class="orl-empty-onboard is-with-chips">
            <div class="orl-eo-kicker">📲 สแกน QR ด้านซ้ายเพื่อเข้าร่วมเพิ่มเติม</div>
            <div class="orl-eo-steps">
              <div class="orl-eo-step"><span class="orl-eo-num">1</span><span>เปิดกล้องมือถือหรือแท็บเล็ต สแกน <strong>QR Code</strong></span></div>
              <div class="orl-eo-step"><span class="orl-eo-num">2</span><span>เลือก <strong>นศพ. (รหัส 3 ตัวท้าย)</strong> หรือ <strong>คณาจารย์</strong></span></div>
              <div class="orl-eo-step"><span class="orl-eo-num">3</span><span>ซิงค์สไลด์สด ซูมภาพชัด และร่วมตอบ <strong>Quiz O · S · M · U</strong></span></div>
            </div>
          </div>
        </div>
      `;
    }
    return chipsHtml;
  }

  function renderCoverCardHtml(opts) {
    const o = opts || {};
    const isHandout = o.viewMode === "handout";
    const joinUrl = getJoinUrl();
    const qrSvg = buildQrSvg(joinUrl);
    const brk = getParticipantRoleBreakdown();
    const cloudOk = isCloudConnected();

    if (state.coverPaneMode === "hero" && !isHandout) {
      const deckModal = document.getElementById("orientationDeckModal");
      const isDarkStage =
        o.ioTheme === "dark" ||
        (deckModal && deckModal.getAttribute("data-io-theme") === "dark") ||
        (!o.ioTheme && !deckModal && document.documentElement.getAttribute("data-theme") === "dark");
      const heroFile = isDarkStage ? "orient_s01_hero_dark.png" : "orient_s01_hero.png";
      return `
        <div class="orl-cover-card is-hero-view">
          <div class="orl-cover-head">
            <span class="orl-live-pill"><span class="orl-dot"></span> COURSE VISUAL</span>
            <button type="button" class="orl-mini-switch" data-orl-action="show-cover-lobby">📱 สลับกลับหน้า QR &amp; Live Lobby (${brk.total})</button>
          </div>
          <figure class="or-fig-plate is-cover-hero" style="flex:1;min-height:0">
            <div class="or-fig-img-wrap">
              <img class="or-fig-img" data-base-img="orient_s01_hero.png" src="assets/images/orientation/${heroFile}?v=20261124fit1" alt="Bedside Care connected to Community & Health Systems Science" loading="eager" decoding="async" />
            </div>
          </figure>
        </div>
      `;
    }

    return `
      <div class="orl-cover-card" data-orl-cover-mount="1">
        <div class="orl-cover-head">
          <div class="orl-cover-head-left">
            <span class="orl-live-pill"><span class="orl-dot${cloudOk ? " is-online" : ""}"></span> SCAN พร้อมกัน · อาจารย์ &amp; นศพ.</span>
            <span class="orl-sync-sub" data-orl-sync-label>${cloudOk ? "ซิงค์สดทุกแพลตฟอร์ม" : "พร้อมซิงค์ในเครือข่าย"}</span>
          </div>
          <div class="orl-cover-head-actions">
            ${!isHandout ? `<button type="button" class="orl-mini-switch" data-orl-action="zoom-qr" title="ขยาย QR Code เต็มจอสำหรับสแกนทั่วห้อง">🔍 ขยาย QR</button>` : ""}
            ${!isHandout ? `<button type="button" class="orl-mini-switch" data-orl-action="show-cover-hero" title="สลับดูภาพประกอบหน้าปก">🖼️ ภาพปก</button>` : ""}
          </div>
        </div>

        <div class="orl-cover-body">
          <div class="orl-cover-qr-col">
            <button type="button" class="orl-qr-frame-btn" data-orl-action="zoom-qr" title="แตะเพื่อขยาย QR Code ขนาดใหญ่">
              ${qrSvg}
            </button>
            <div class="orl-qr-url-box">
              <span class="orl-qr-scan-kicker">📱 สแกนร่วมกันทั้งอาจารย์ &amp; นศพ.</span>
              <code class="orl-qr-url-code">${state.qrUrlMode === "faculty" ? "racm303-2569-faculty-member/#live" : "racm303-2569-student/#live"}</code>
            </div>
          </div>

          <div class="orl-cover-info-col">
            <div class="orl-count-hero-box">
              <div class="orl-count-nums">
                <span class="orl-count-big" data-orl-participant-count>${brk.total}</span>
                <span class="orl-count-denom">ผู้เข้าร่วมสด</span>
              </div>
              <span class="orl-count-caption" data-orl-role-breakdown>🎓 นศพ. ${brk.stu}/169 · 👨‍⚕️ อาจารย์ ${brk.fac} ท่าน</span>
            </div>

            <div class="orl-topic-tags">
              <span class="orl-tag is-do">⏱️ เวลาเรียน ≥ 80%</span>
              <span class="orl-tag is-osmu">⚖️ Quiz O · S · M · U</span>
              <span class="orl-tag is-exam">📜 ประกาศเจตคติ 2567</span>
              <span class="orl-tag is-ai">🔍 ซิงค์สไลด์ &amp; Zoom ได้</span>
            </div>

            <div class="orl-chips-stream" data-orl-participant-chips>
              ${buildJoinedChipsMarkup(8, true)}
            </div>
          </div>
        </div>

        ${
          !isHandout
            ? `
          <div class="orl-cover-foot">
            ${
              ROLE === "faculty"
                ? `
              <button type="button" class="orl-cta-btn is-lobby-expand" data-orl-action="open-deck-live">
                📺 ขยาย Live Lobby รอคนครบก่อนไปต่อ
              </button>
              <button type="button" class="orl-cta-btn is-launch-quiz" data-orl-action="jump-to-quiz-slide">
                🎯 ไปหน้า Quiz O/S/M/U
              </button>
            `
                : `
              <button type="button" class="orl-cta-btn is-launch-quiz" data-orl-action="open-participant-pad">
                🙋 เข้าร่วม Live Lobby / ตอบ Quiz
              </button>
              <button type="button" class="orl-cta-btn is-lobby-expand" data-orl-action="open-deck-live">
                📺 ดูห้อง Live Lobby
              </button>
            `
            }
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  /* ---------- 11. UI Surface 2: Authentic Kahoot! Stage (QR Lobby, 10s Question, Column Reveal, Rank 1-2-3 Podium) ---------- */
  function renderLobbyStageHtml(isEmbeddedSlide, isDedicatedQrSlide) {
    const joinUrl = getJoinUrl();
    const qrSvg = buildQrSvg(joinUrl, "is-stage-qr");
    const brk = getParticipantRoleBreakdown();
    const areaCounts = getAreaCounts();
    const areasOrder = ["คณาจารย์", "กุฉินารายณ์", "ด่านซ้าย", "ตะกั่วป่า", "ท่าวังผา", "เพชรบูรณ์ 1", "เพชรบูรณ์ 2", "อุบลรัตน์", "ท่าสองยาง", "อุ้มผาง"];
    const deck = getActiveQuestionList();

    return `
      <div class="orl-stage is-kahoot-purple is-lobby-stage${isEmbeddedSlide ? " is-embedded-slide-stage" : ""}">
        <div class="orl-kh-join-banner">
          <div class="orl-kh-join-step">
            <span class="orl-kh-join-lbl">1. สแกนเข้าห้องที่ QR Code:</span>
            <strong class="orl-kh-join-val">${state.qrUrlMode === "faculty" ? "racm303-2569-faculty-member/#live" : "racm303-2569-student/#live"}</strong>
          </div>
          <div class="orl-kh-pin-divider" aria-hidden="true"></div>
          <div class="orl-kh-join-step is-pin-step">
            <span class="orl-kh-join-lbl">2. Login ด้วยรหัส นศพ. 3 ตัวท้าย:</span>
            <strong class="orl-kh-pin-pill">🔢 กดเลข 3 ตัว (เช่น 006)</strong>
          </div>
          <div class="orl-kh-top-actions">
            <button type="button" class="orl-bar-btn" data-orl-action="zoom-qr">🔍 ขยาย QR</button>
            <button type="button" class="orl-bar-btn" data-orl-action="toggle-mute">${state.soundMuted ? "🔇 ปิดเสียง" : "🔊 เพลง Kahoot On"}</button>
            <button type="button" class="orl-bar-btn" data-orl-action="open-participant-pad">📱 แป้นกด 3 ตัว</button>
          </div>
        </div>

        <div class="orl-lobby-grid">
          <div class="orl-lobby-qr-panel">
            <button type="button" class="orl-stage-qr-box" data-orl-action="zoom-qr" title="แตะเพื่อขยาย QR Code เต็มจอ">
              ${qrSvg}
            </button>
            <div class="orl-stage-join-steps">
              <div class="orl-step-badge">⚡ กติกา Kahoot! · ถูก + เร็วสุด = แต้มสูงสุด (1,000 pts/ข้อ)</div>
              <div class="orl-url-pill">6 ข้อ: 5 วัตถุประสงค์ระบบฯ (6 ตัวเลือก) + 5 โจทย์ O·S·M·U</div>
            </div>

            <div class="orl-host-config-box">
              <div class="orl-cfg-row">
                <span class="orl-cfg-lbl">⏱️ เวลาต่อข้อ:</span>
                <div class="orl-seg-group">
                  ${[10, 15, 20]
                    .map(
                      (sec) =>
                        `<button type="button" class="orl-seg-btn${state.customDurationSec === sec ? " is-active" : ""}" data-orl-dur="${sec}">${sec} วิ</button>`
                    )
                    .join("")}
                </div>
              </div>
            </div>
          </div>

          <div class="orl-lobby-players-panel">
            <div class="orl-players-head">
              <div class="orl-players-counter">
                <span class="orl-players-num" data-orl-participant-count>${brk.total}</span>
                <div>
                  <div class="orl-players-title">Players ในห้องสด (<span data-orl-role-breakdown>🎓 นศพ. ${brk.stu}/169 · 👨‍⚕️ อาจารย์ ${brk.fac} ท่าน</span>)</div>
                  <div class="orl-players-sub">กดรหัสนักศึกษา 3 ตัวท้ายเพื่อ Login ทันที · จบเกมสรุป Podium อันดับ 1 · 2 · 3 พร้อมแต้มรวม</div>
                </div>
              </div>
              ${
                ROLE === "faculty" && state.answersByQ.size > 0
                  ? `<button type="button" class="orl-bar-btn is-subtle" data-orl-action="reset-session">↺ รีเซ็ตคะแนน</button>`
                  : ""
              }
            </div>

            <div class="orl-area-Checkin-strip" data-orl-area-strip>
              ${areasOrder
                .map((area) => {
                  const c = areaCounts[area] || 0;
                  const isFacPill = area === "คณาจารย์";
                  return `<span class="orl-area-pill${c > 0 ? " has-joined" : ""}${isFacPill ? " is-fac-area" : ""}">${isFacPill ? "👨‍⚕️ " : ""}${esc(area)} <strong>${c}</strong></span>`;
                })
                .join("")}
            </div>

            <div class="orl-players-wall" data-orl-participant-wall>
              ${buildJoinedChipsMarkup(48)}
            </div>

            <div class="orl-lobby-action-bar">
              ${
                isDedicatedQrSlide
                  ? `
                <button type="button" class="orl-big-btn is-secondary" data-orl-action="goto-criteria-slide">
                  📘 ข้ามไปสไลด์สรุปเกณฑ์ O / S / M / U &rarr;
                  <small>ดูสรุปเวลาเรียน ≥ 80% · ประกาศคณะฯ 2567 · สอบซ่อม</small>
                </button>
                <button type="button" class="orl-big-btn is-primary is-kahoot-start" data-orl-action="launch-kahoot-slide">
                  🚀 เริ่มเกม Kahoot! Quiz ทั้ง ${deck.length} ข้อ (${state.customDurationSec}s) &rarr;
                  <small>ไปสไลด์ถัดไปและยิงคำถามข้อที่ 1 พร้อมเสียงดนตรีทันที!</small>
                </button>
              `
                  : `
                <button type="button" class="orl-big-btn is-secondary" data-orl-action="${isEmbeddedSlide ? "goto-criteria-slide" : "continue-slides"}">
                  ${isEmbeddedSlide ? "📘 ข้ามไปสไลด์ชี้แจงเกณฑ์ O / S / M / U &rarr;" : "▶ ไปต่อเนื้อหาสไลด์ Orientation &rarr;"}
                  <small>${isEmbeddedSlide ? "อธิบายเวลาเรียน ≥ 80%, ประกาศเจตคติ 2567, การสอบซ่อม และเกียรตินิยม" : "ผู้ที่สแกนแล้วดูสไลด์ซิงค์สดได้ต่อเนื่อง"}</small>
                </button>
                <button type="button" class="orl-big-btn is-primary is-kahoot-start" data-orl-action="start-q0">
                  ⚡ เริ่มยิงคำถาม Kahoot! ข้อที่ 1 (${deck.length} ข้อ · ${state.customDurationSec} วิ)
                  <small>ส่งโจทย์ขึ้นจอมือถือพร้อมเสียงเพลง Kahoot และจับเวลาความไว!</small>
                </button>
              `
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderQrLobbySlideHtml(opts) {
    const o = opts || {};
    const isStatic = o.viewMode === "handout" || Boolean(window.__RACM_EXPORTING_DECK);
    if (isStatic) {
      const joinUrl = getJoinUrl();
      const qrSvg = buildQrSvg(joinUrl, "is-stage-qr");
      return `
        <div class="orl-slide-quiz-host">
          <div class="orl-stage is-kahoot-purple is-lobby-stage is-embedded-slide-stage">
            <div class="orl-kh-join-banner">
              <div class="orl-kh-join-step">
                <span class="orl-kh-join-lbl">1. สแกน QR Code เข้าห้องสด:</span>
                <strong class="orl-kh-join-val">racm303-2569-student/#live</strong>
              </div>
              <div class="orl-kh-pin-divider"></div>
              <div class="orl-kh-join-step is-pin-step">
                <span class="orl-kh-join-lbl">2. กดรหัสนักศึกษา 3 ตัวท้าย:</span>
                <strong class="orl-kh-pin-pill">🔢 PIN 3 หลัก (001–169)</strong>
              </div>
            </div>
            <div class="orl-lobby-grid">
              <div class="orl-lobby-qr-panel">
                <div class="orl-stage-qr-box">${qrSvg}</div>
                <div class="orl-stage-join-steps">
                  <div class="orl-step-badge">⚡ 6 คำถาม Kahoot! · ข้อละ 10 วินาที · วัดความแม่นยำ + ความเร็วสูงสุด</div>
                </div>
              </div>
              <div class="orl-lobby-players-panel" style="justify-content:space-evenly">
                <div class="orl-players-title" style="font-size:1.35cqw">🎮 ขั้นตอนเตรียมพร้อมก่อนเริ่ม Kahoot! Quiz (สไลด์ถัดไป)</div>
                <div class="orl-eo-steps">
                  <div class="orl-eo-step"><span class="orl-eo-num">1</span><span>สแกน <strong>QR Code</strong> ด้านซ้ายด้วยกล้องมือถือหรือแท็บเล็ต</span></div>
                  <div class="orl-eo-step"><span class="orl-eo-num">2</span><span>กด <strong>รหัสนักศึกษา 3 ตัวท้าย</strong> บนแป้นตัวเลขเพื่อ Login เข้าห้องทันที</span></div>
                  <div class="orl-eo-step"><span class="orl-eo-num">3</span><span>เตรียมกดตอบ <strong>1 คำถาม 5 วัตถุประสงค์ระบบฯ (6 ตัวเลือก)</strong> + <strong>5 สถานการณ์เกรด O / S / M / U</strong> ภายใน <strong>10 วินาที/ข้อ</strong> เพื่อชิง <strong>Podium Rank 1 · 2 · 3</strong>!</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    return `
      <div class="orl-slide-quiz-host">
        ${renderLobbyStageHtml(true, true)}
      </div>
    `;
  }

  function renderQuestionStageHtml(isEmbeddedSlide) {
    const q = getCurrentQuestion();
    const deck = getActiveQuestionList();
    const stats = getQuestionStats(q);
    const remMs = getRemainingMs();
    const sec = Math.ceil(remMs / 1000);
    const durMs = Math.max(1000, (state.session.durationSec || 10) * 1000);
    const pct = Math.max(0, Math.min(100, (remMs / durMs) * 100));
    const nChoices = q.choices.length;
    const gridCls = nChoices >= 6 ? "is-6-choices" : "is-4-choices";

    return `
      <div class="orl-stage is-kahoot-purple is-question-stage${isEmbeddedSlide ? " is-embedded-slide-stage" : ""}">
        <div class="orl-kh-q-header-card">
          <div class="orl-kh-q-eyebrow">
            <span class="orl-kh-q-pill">Kahoot! ข้อ ${state.session.qPos + 1} / ${deck.length}</span>
            <span class="orl-kh-q-badge">${esc(q.badge)}</span>
            <div class="orl-kh-q-actions">
              <button type="button" class="orl-kh-mini-btn" data-orl-action="toggle-mute">${state.soundMuted ? "🔇" : "🎵"}</button>
              <button type="button" class="orl-kh-mini-btn" data-orl-action="open-participant-pad">📱 แป้นตอบ</button>
              <button type="button" class="orl-kh-skip-btn" data-orl-action="reveal-now">⏭️ เฉลยทันที</button>
            </div>
          </div>
          <h2 class="orl-kh-q-stem">${esc(q.stem)}</h2>
        </div>

        <div class="orl-kh-mid-arena">
          <div class="orl-kh-clock-orb${sec <= 3 ? " is-urgent" : ""}" data-orl-timer-orb>
            <strong data-orl-timer-num>${sec}</strong>
            <small>วินาที</small>
          </div>

          <div class="orl-kh-speed-center">
            <div class="orl-kh-speed-kicker">
              ${q.isOsmuScenario ? "⚡ เลือกเกรด O · S · M · U ที่ถูกต้องและไวที่สุด! (สูงสุด 1,000 แต้ม)" : `⚡ โจทย์ ${nChoices} ตัวเลือก · ตอบถูก + เร็วสุด = คะแนนสูงสุด!`}
            </div>
            <div class="orl-timer-progress-track is-kahoot-bar">
              <div class="orl-timer-progress-fill" data-orl-timer-bar style="width:${pct.toFixed(1)}%"></div>
            </div>
            <div class="orl-kh-impact-sub">${esc(q.impactTag)}</div>
          </div>

          <div class="orl-kh-ans-orb">
            <strong data-orl-answered-count>${stats.total}</strong>
            <span>คำตอบ</span>
          </div>
        </div>

        <div class="orl-choices-grid is-kahoot-tiles ${gridCls}">
          ${q.choices
            .map((txt, idx) => {
              const meta = getChoiceMeta(q, idx);
              return `
                <div class="orl-choice-tile is-kahoot-tile ${meta.cls}">
                  <span class="orl-choice-shape">${meta.shape}</span>
                  ${meta.grade ? `<span class="orl-choice-grade-badge">${esc(meta.grade)}</span>` : ""}
                  <span class="orl-choice-text">${esc(txt)}</span>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderRevealStageHtml(isEmbeddedSlide) {
    const q = getCurrentQuestion();
    const deck = getActiveQuestionList();
    const stats = getQuestionStats(q);
    const maxCount = Math.max(1, ...stats.counts);
    const fastestList = getFastestCorrectAnswers(q, 3);
    const nChoices = q.choices.length;

    let speedBannerHtml = "";
    if (fastestList.length > 0) {
      const f0 = fastestList[0];
      const runners = fastestList
        .slice(1)
        .map((r, i) => `${i === 0 ? "🥈" : "🥉"} ${esc(r.label)} (${r.secStr}s · +${r.points})`)
        .join(" · ");
      speedBannerHtml = `
        <div class="orl-kh-fastest-strip">
          <span class="orl-kh-fast-crown">⚡ ตอบถูกเร็วที่สุด: <strong>🥇 ${esc(f0.avatar)} ${esc(f0.label)}</strong> (${f0.secStr} วินาที · <strong>+${f0.points} pts</strong>)</span>
          ${runners ? `<span class="orl-kh-fast-runners">${runners}</span>` : `<span class="orl-kh-fast-runners">ตอบถูก ${stats.correctCount}/${stats.total} คน (${stats.pctCorrect}%)</span>`}
        </div>
      `;
    } else if (stats.total > 0) {
      const wrongMeta = stats.topWrongIdx >= 0 ? getChoiceMeta(q, stats.topWrongIdx) : null;
      const hintText = (wrongMeta && q.wrongHints && q.wrongHints[stats.topWrongIdx]) || q.osmuRule;
      speedBannerHtml = `
        <div class="orl-kh-fastest-strip is-miss">
          <span>🔍 ข้อนี้ยังไม่มีผู้ตอบถูก (ตอบทั้งหมด ${stats.total} คน) — ${esc(hintText)}</span>
        </div>
      `;
    } else {
      speedBannerHtml = `
        <div class="orl-kh-fastest-strip is-neutral">
          <span>🔔 หมดเวลา! เฉลยคำตอบที่ถูกต้องและหลักเกณฑ์สำคัญด้านล่าง</span>
        </div>
      `;
    }

    return `
      <div class="orl-stage is-kahoot-purple is-reveal-stage${isEmbeddedSlide ? " is-embedded-slide-stage" : ""}">
        <div class="orl-kh-q-header-card is-compact">
          <div class="orl-kh-q-eyebrow">
            <span class="orl-kh-q-pill">เฉลยข้อ ${state.session.qPos + 1} / ${deck.length}</span>
            <span class="orl-kh-q-badge">${esc(q.badge)}</span>
            <div class="orl-kh-q-actions">
              <div class="orl-picker-wrap">
                <button type="button" class="orl-kh-mini-btn" data-orl-action="toggle-q-picker">🔢 เลือกข้อ ▾</button>
                ${
                  state.questionPickerOpen
                    ? `
                  <div class="orl-q-picker-pop">
                    ${deck
                      .map(
                        (item, idx) =>
                          `<button type="button" class="orl-qp-item${idx === state.session.qPos ? " is-cur" : ""}" data-orl-jump-q="${idx}"><strong>ข้อ ${idx + 1}:</strong> ${esc(item.badge)}</button>`
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }
              </div>
              <button type="button" class="orl-kh-next-btn" data-orl-action="next-question">
                ${state.session.qPos + 1 < deck.length ? `ข้อถัดไป (${state.session.qPos + 2}/${deck.length}) →` : "🏆 สรุป Podium Rank 1·2·3 →"}
              </button>
            </div>
          </div>
          <h3 class="orl-kh-q-stem is-sm">${esc(q.stem)}</h3>
        </div>

        <div class="orl-kh-columns-chart ${nChoices >= 6 ? "is-6-cols" : "is-4-cols"}">
          ${q.choices
            .map((txt, idx) => {
              const meta = getChoiceMeta(q, idx);
              const cnt = stats.counts[idx] || 0;
              const barPct = stats.total > 0 ? Math.max(10, Math.round((cnt / maxCount) * 100)) : idx === q.correctIdx ? 72 : 14;
              const isCorrect = idx === q.correctIdx;
              return `
                <div class="orl-kh-col-wrap ${meta.cls}${isCorrect ? " is-correct" : " is-dimmed"}">
                  <div class="orl-kh-col-count">${isCorrect ? "✓ " : ""}${cnt}</div>
                  <div class="orl-kh-col-track">
                    <div class="orl-kh-col-bar" style="height:${barPct}%"></div>
                  </div>
                  <div class="orl-kh-col-label">
                    <span class="orl-kh-col-shape">${meta.shape}${meta.grade ? ` ${esc(meta.grade)}` : ""}</span>
                    <span class="orl-kh-col-txt">${esc(txt)}</span>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>

        ${speedBannerHtml}

        <div class="orl-recheck-3col is-kahoot-debrief">
          <div class="orl-rc-box is-do">
            <span class="orl-rc-kicker">✅ DO · แนวปฏิบัติที่ถูกต้อง</span>
            <p>${esc(q.doSummary)}</p>
          </div>
          <div class="orl-rc-box is-dont">
            <span class="orl-rc-kicker">🚫 DON'T · ข้อควรระวัง</span>
            <p>${esc(q.dontSummary)}</p>
          </div>
          <div class="orl-rc-box is-osmu">
            <span class="orl-rc-kicker">⚖️ สรุปเฉลย &amp; เกณฑ์ตัดสิน</span>
            <p>${esc(q.osmuRule)}</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderPodiumStageHtml(isEmbeddedSlide) {
    const deck = getActiveQuestionList();
    const board = computeLeaderboard();
    const top3 = [board[0] || null, board[1] || null, board[2] || null];

    let fastestOverall = null;
    board.forEach((p) => {
      if (p.correctCount > 0 && (!fastestOverall || p.avgCorrectMs < fastestOverall.avgCorrectMs)) {
        fastestOverall = p;
      }
    });

    return `
      <div class="orl-stage is-kahoot-purple is-podium-stage${isEmbeddedSlide ? " is-embedded-slide-stage" : ""}">
        <div class="orl-stage-topbar is-podium-topbar">
          <div class="orl-st-left">
            <span class="orl-kh-podium-crown-pill">🏆 KAHOOT! PODIUM · TOP 3 CHAMPIONS</span>
            <span class="orl-st-sub">จัดอันดับจากคะแนนรวมความถูกต้อง + ความเร็วในการกดตอบ (${deck.length} ข้อ)</span>
          </div>
          <div class="orl-st-right">
            <button type="button" class="orl-bar-btn" data-orl-action="back-to-lobby">📺 Lobby</button>
            ${ROLE === "faculty" ? `<button type="button" class="orl-bar-btn" data-orl-action="reset-session">🔄 รีเซ็ต</button>` : ""}
            <button type="button" class="orl-kh-next-btn" data-orl-action="goto-criteria-slide">📘 ไปสไลด์ถัดไป: ชี้แจงเกณฑ์ O / S / M / U &rarr;</button>
          </div>
        </div>

        <div class="orl-podium-split is-kahoot-podium-layout">
          <div class="orl-leaderboard-panel is-kahoot-spotlight">
            <div class="orl-podium-top3 is-kahoot-pedestals">
              ${[1, 0, 2]
                .map((rankIdx) => {
                  const p = top3[rankIdx];
                  const rankNum = rankIdx + 1;
                  const medal = rankNum === 1 ? "👑 🥇 RANK 1" : rankNum === 2 ? "🥈 RANK 2" : "🥉 RANK 3";
                  if (!p) {
                    return `
                      <div class="orl-podium-col is-rank-${rankNum} is-placeholder">
                        <div class="orl-pod-player-tag">
                          <span class="orl-pod-ava">${rankNum === 1 ? "🏆" : rankNum === 2 ? "🥈" : "🥉"}</span>
                          <strong class="orl-pod-name">รอผู้คว้าอันดับ ${rankNum}</strong>
                          <span class="orl-pod-area">RACM 303 Kahoot!</span>
                        </div>
                        <div class="orl-pod-pedestal">
                          <span class="orl-pod-medal">${medal}</span>
                          <span class="orl-pod-pts">0 pts</span>
                          <small>0/${deck.length} ข้อ</small>
                        </div>
                      </div>
                    `;
                  }
                  return `
                    <div class="orl-podium-col is-rank-${rankNum}">
                      <div class="orl-pod-player-tag">
                        <span class="orl-pod-ava">${esc(p.avatar)}</span>
                        <strong class="orl-pod-name">${esc(p.label)}</strong>
                        <span class="orl-pod-area">${esc(p.area ? `กลุ่ม ${p.area}` : "RACM 303")}</span>
                      </div>
                      <div class="orl-pod-pedestal">
                        <span class="orl-pod-medal">${medal}</span>
                        <span class="orl-pod-pts">${p.score.toLocaleString()} แต้ม</span>
                        <small>ถูก ${p.correctCount}/${deck.length} ข้อ${p.avgCorrectSec ? ` · ⚡ ${p.avgCorrectSec}s` : ""}</small>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>

            ${
              fastestOverall
                ? `<div class="orl-kh-fastest-award">⚡ <strong>สถิติตอบถูกไวที่สุด (Fastest Responder):</strong> ${esc(fastestOverall.avatar)} ${esc(fastestOverall.label)} — เฉลี่ย <strong>${fastestOverall.avgCorrectSec} วินาที/ข้อ</strong> (${fastestOverall.score.toLocaleString()} แต้ม)</div>`
                : ""
            }

            ${
              board.length > 3
                ? `
              <div class="orl-runners-list">
                ${board
                  .slice(3, 8)
                  .map(
                    (p, idx) => `
                  <div class="orl-runner-row">
                    <span><strong>#${idx + 4}</strong> ${esc(p.avatar)} ${esc(p.label)} ${p.area ? `<em>(${esc(p.area)})</em>` : ""}</span>
                    <strong>${p.score.toLocaleString()} แต้ม · ถูก ${p.correctCount}/${deck.length}${p.avgCorrectSec ? ` · ${p.avgCorrectSec}s` : ""}</strong>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>

          <div class="orl-diagnostic-panel">
            <h3 class="orl-panel-h3">📊 สรุปความแม่นยำทั้ง ${deck.length} ข้อ</h3>
            <div class="orl-diag-list">
              ${deck
                .map((q, idx) => {
                  const st = getQuestionStats(q);
                  const tone = st.total === 0 ? "is-idle" : st.pctCorrect >= 80 ? "is-good" : st.pctCorrect >= 60 ? "is-warn" : "is-low";
                  return `
                    <div class="orl-diag-row ${tone}">
                      <div class="orl-diag-info">
                        <strong>ข้อ ${idx + 1} · ${esc(q.badge)}</strong>
                        <span>${esc(q.impactTag)}</span>
                      </div>
                      <div class="orl-diag-right">
                        <span class="orl-diag-pct">${st.total > 0 ? `${st.pctCorrect}% (${st.correctCount}/${st.total})` : "พร้อมเล่น"}</span>
                        ${ROLE === "faculty" ? `<button type="button" class="orl-reask-btn" data-orl-jump-q="${idx}">เล่นข้อนี้</button>` : ""}
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderDeckLiveStageHtml(isEmbeddedSlide) {
    const ph = state.session.phase;
    if (ph === "question") return renderQuestionStageHtml(isEmbeddedSlide);
    if (ph === "reveal") return renderRevealStageHtml(isEmbeddedSlide);
    if (ph === "podium") return renderPodiumStageHtml(isEmbeddedSlide);
    return renderLobbyStageHtml(isEmbeddedSlide, false);
  }

  function renderEmbeddedQuizSlideHtml(opts) {
    const o = opts || {};
    if (o.viewMode === "handout" || Boolean(window.__RACM_EXPORTING_DECK)) {
      return `
        <div class="or-grid-3" style="height:100%;gap:0.55cqw">
          ${BASE_QUESTIONS.slice(0, 6)
            .map((q, i) => {
              const ansMeta = getChoiceMeta(q, q.correctIdx);
              return `
                <div class="or-card is-white" style="padding:0.52cqw 0.65cqw;display:flex;flex-direction:column;justify-content:space-between">
                  <div>
                    <span class="or-card-kicker">KAHOOT! Q${i + 1} (${q.choices.length} ตัวเลือก · 10s)</span>
                    <p class="or-card-text" style="margin-top:0.2cqw"><strong>โจทย์:</strong> ${esc(q.stem)}</p>
                  </div>
                  <div style="margin-top:0.28cqw;padding:0.28cqw 0.44cqw;border-radius:0.42cqw;background:#f8fafc;border-left:3px solid ${ansMeta.hex};font-size:0.78cqw;line-height:1.32">
                    <strong>✓ เฉลย (${ansMeta.shape}${ansMeta.grade ? " " + ansMeta.grade : ""}):</strong> ${esc(q.choices[q.correctIdx])}
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }
    return `
      <div class="orl-slide-quiz-host">
        ${renderDeckLiveStageHtml(true)}
      </div>
    `;
  }

  /* ---------- 12. UI Surface 3: Mobile / Tablet / Foldable Participant & Remote Modal (#live) ---------- */
  function mountOverlayToActiveRoot(el) {
    if (!el) return;
    const hostParent = document.fullscreenElement || document.body;
    if (hostParent && el.parentElement !== hostParent) {
      hostParent.appendChild(el);
    }
  }

  function handlePinDigitInput(digit) {
    if (state.pinDigits.length >= 3) state.pinDigits = "";
    state.pinDigits += String(digit).replace(/\D/g, "").slice(0, 1);
    if (state.pinDigits.length === 3) {
      const matches = findStudentsBy3Digits(state.pinDigits);
      if (matches.length === 1) {
        applyRosterToLocalState(matches[0], false);
        playTone([659.25, 880], 0.08, "sine", 0.06);
      } else {
        state.studentId = "";
        playTone([523.25], 0.06, "sine", 0.05);
      }
    } else {
      state.studentId = "";
      playTone([440 + state.pinDigits.length * 60], 0.05, "sine", 0.04);
    }
    renderParticipantModal();
  }

  function ensureParticipantModal() {
    let el = document.getElementById("orientParticipantModal");
    if (el) return el;
    el = document.createElement("div");
    el.id = "orientParticipantModal";
    el.className = "orl-mobile-backdrop";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "RACM 303 Live Orientation Participant & Synced Slide");
    el.hidden = true;
    document.body.appendChild(el);

    el.addEventListener("click", (ev) => {
      const actBtn = ev.target.closest("[data-orl-mact]");
      if (!actBtn) return;
      const act = actBtn.getAttribute("data-orl-mact");

      if (act === "close") {
        closeParticipantModal();
      } else if (act === "switch-mtype") {
        state.memberType = actBtn.getAttribute("data-mtype") === "faculty" ? "faculty" : "student";
        safeSet("racm303_orient_mtype_v1", state.memberType);
        if (state.memberType === "faculty") state.avatar = "👨‍⚕️";
        else if (state.avatar === "👨‍⚕️") state.avatar = "🩺";
        renderParticipantModal();
      } else if (act === "switch-mtab") {
        state.mobileTab = actBtn.getAttribute("data-mtab") === "remote" ? "remote" : "pad";
        renderParticipantModal();
      } else if (act === "pin-digit") {
        handlePinDigitInput(actBtn.getAttribute("data-digit") || "");
      } else if (act === "pin-back") {
        state.pinDigits = state.pinDigits.slice(0, -1);
        state.studentId = "";
        renderParticipantModal();
      } else if (act === "pin-clear") {
        state.pinDigits = "";
        state.studentId = "";
        renderParticipantModal();
      } else if (act === "pick-avatar") {
        state.avatar = actBtn.getAttribute("data-ava") || "🩺";
        safeSet("racm303_orient_avatar_v1", state.avatar);
        renderParticipantModal();
      } else if (act === "pick-roster") {
        const sid = actBtn.getAttribute("data-sid");
        const stu = findRosterStudent(sid);
        if (stu) {
          state.pinDigits = String(stu.id).slice(-3);
          applyRosterToLocalState(stu, false);
          renderParticipantModal();
        }
      } else if (act === "pick-roster-join") {
        const sid = actBtn.getAttribute("data-sid");
        const stu = findRosterStudent(sid);
        if (stu) {
          state.pinDigits = String(stu.id).slice(-3);
          applyRosterToLocalState(stu, true);
          publishMyPresence();
          publishPacket("cmd", { type: "who_is_here" }, false);
          renderParticipantModal();
        }
      } else if (act === "pick-faculty") {
        const fcode = actBtn.getAttribute("data-fcode");
        const fac = FACULTY_LIST.find((f) => f.code === fcode);
        if (fac) {
          applyFacultyToLocalState(fac, true);
          publishMyPresence();
          publishPacket("cmd", { type: "who_is_here" }, false);
          renderParticipantModal();
        }
      } else if (act === "join-now") {
        if (state.memberType === "faculty") {
          const finp = document.getElementById("orlFacLookupInput");
          const fval = finp ? finp.value.trim() : "";
          if (fval) {
            applyFacultyToLocalState({ code: randomId("fc"), short: fval.slice(0, 28), fullName: fval.slice(0, 60) }, true);
          } else if (state.nickname) {
            state.joined = true;
            safeSet("racm303_orient_joined_v1", "1");
          } else {
            applyFacultyToLocalState(FACULTY_LIST[0], true);
          }
        } else {
          if (state.studentId && state.memberType === "student") {
            state.joined = true;
            safeSet("racm303_orient_joined_v1", "1");
          } else if (state.pinDigits.length === 3) {
            const m3 = findStudentsBy3Digits(state.pinDigits);
            if (m3.length >= 1) {
              applyRosterToLocalState(m3[0], true);
            } else {
              state.shortNo = state.pinDigits;
              state.nickname = `นศพ. ${state.pinDigits}`;
              safeSet("racm303_orient_sno_v1", state.shortNo);
              safeSet("racm303_orient_nick_v1", state.nickname);
              state.joined = true;
              safeSet("racm303_orient_joined_v1", "1");
            }
          } else {
            const inp = document.getElementById("orlStuLookupInput");
            const rawVal = inp ? inp.value.trim() : "";
            if (rawVal) {
              const matched = findRosterStudent(rawVal);
              if (matched) {
                state.pinDigits = String(matched.id).slice(-3);
                applyRosterToLocalState(matched, true);
              } else {
                state.nickname = rawVal.slice(0, 28);
                safeSet("racm303_orient_nick_v1", state.nickname);
                state.joined = true;
                safeSet("racm303_orient_joined_v1", "1");
              }
            } else {
              return;
            }
          }
        }
        publishMyPresence();
        publishPacket("cmd", { type: "who_is_here" }, false);
        renderParticipantModal();
      } else if (act === "edit-profile") {
        state.joined = false;
        safeSet("racm303_orient_joined_v1", "0");
        renderParticipantModal();
      } else if (act === "view-synced-slides") {
        state.followHostSlide = true;
        safeSet("racm303_orient_follow_v1", "1");
        closeParticipantModal();
        if (window.RACM_ORIENTATION_DECK) {
          window.RACM_ORIENTATION_DECK.open(state.session.hostSlideIdx || 0, { viewMode: "deck" });
        }
      } else if (act === "submit-choice") {
        const cIdx = Number(actBtn.getAttribute("data-choice-idx"));
        submitMyAnswer(cIdx);
      } else if (act === "rcmd") {
        const rcmd = actBtn.getAttribute("data-rcmd");
        const sIdx = actBtn.hasAttribute("data-sidx") ? Number(actBtn.getAttribute("data-sidx")) : undefined;
        sendRemoteCommand(rcmd, sIdx !== undefined ? { slideIdx: sIdx } : undefined);
      }
    });

    el.addEventListener("input", (ev) => {
      if (ev.target && ev.target.id === "orlStuLookupInput") {
        const val = ev.target.value.trim();
        if (/^\d{1,3}$/.test(val)) {
          state.pinDigits = val;
        }
        const sugBox = document.getElementById("orlRosterSuggestBox");
        if (!sugBox) return;
        const matches = searchRosterCandidates(val);
        sugBox.innerHTML = matches
          .slice(0, 4)
          .map(
            (s) => `
            <button type="button" class="orl-sug-item" data-orl-mact="pick-roster-join" data-sid="${esc(s.id)}">
              <strong>${esc(String(s.id).slice(-3))} · ${esc(s.nickname || s.name)}</strong>
              <span>${esc(s.fullName || s.name)} · กลุ่ม ${esc(s.area)}</span>
            </button>
          `
          )
          .join("");
      }
    });

    return el;
  }

  function renderParticipantModal() {
    const modal = ensureParticipantModal();
    if (!state.participantModalOpen) {
      modal.hidden = true;
      document.body.classList.remove("orl-participant-open");
      return;
    }
    mountOverlayToActiveRoot(modal);
    syncVisualViewportVars();
    modal.hidden = false;
    document.body.classList.add("orl-participant-open");

    const cloudOk = isCloudConnected();
    const board = computeLeaderboard();
    const myRankIdx = board.findIndex((x) => x.participantId === state.participantId);
    const myEntry = myRankIdx >= 0 ? board[myRankIdx] : { score: 0, correctCount: 0, avgCorrectSec: null };
    const canRemote = ROLE === "faculty" || state.memberType === "faculty";

    let bodyHtml = "";
    if (canRemote && state.joined && state.mobileTab === "remote") {
      const deckSlides =
        window.RACM_ORIENTATION_DECK && typeof window.RACM_ORIENTATION_DECK.getSlides === "function"
          ? window.RACM_ORIENTATION_DECK.getSlides()
          : [];
      const quizIdx = Math.max(0, deckSlides.findIndex((s) => s.id === "s14-quiz-osmu"));
      const critIdx = Math.max(0, deckSlides.findIndex((s) => s.id === "s15-osmu-criteria"));
      const quizSlideNum = deckSlides[quizIdx] ? deckSlides[quizIdx].num : "28";
      const critSlideNum = deckSlides[critIdx] ? deckSlides[critIdx].num : "29";
      bodyHtml = `
        <div class="orl-m-card is-appletv-remote-card">
          <div class="orl-m-badge">🎛️ KEYNOTE CLICKER · รีโมตไร้สายควบคุมสไลด์</div>
          <div class="orl-m-slide-tracker" style="text-align:center">
            สไลด์ปัจจุบัน: <strong>Slide ${esc(state.session.hostSlideNum || "01")}</strong> · ${esc(state.session.hostSlideTitle || "Orientation")}
          </div>
          <button type="button" class="orl-m-join-btn is-clicker-giant-next" data-orl-mact="rcmd" data-rcmd="slide-next" style="min-height:84px;font-size:18px;border-radius:22px">
            สไลด์ถัดไป · NEXT SLIDE ▶
          </button>
          <div class="orl-m-foot-btns">
            <button type="button" class="orl-m-sec-btn" data-orl-mact="rcmd" data-rcmd="slide-prev">◀ ก่อนหน้า (Prev)</button>
            <button type="button" class="orl-m-sec-btn" data-orl-mact="rcmd" data-rcmd="toggle-blackout">⬛ พักจอดำ (Blackout)</button>
          </div>
          <div class="orl-m-foot-btns">
            <button type="button" class="orl-m-sec-btn" data-orl-mact="rcmd" data-rcmd="goto-slide" data-sidx="${quizIdx || 27}">🎮 ไป Slide ${quizSlideNum} (Kahoot)</button>
            <button type="button" class="orl-m-sec-btn" data-orl-mact="rcmd" data-rcmd="goto-slide" data-sidx="${critIdx || 28}">⚖️ ไป Slide ${critSlideNum} (เกณฑ์ O/S/M/U)</button>
          </div>
          <div class="orl-m-lbl" style="margin-top:6px">ควบคุม Kahoot Quiz สด (${state.participants.size} คนในห้อง)</div>
          <button type="button" class="orl-m-join-btn" data-orl-mact="rcmd" data-rcmd="start-q0">⚡ เริ่มยิงคำถามข้อที่ 1</button>
          <div class="orl-m-foot-btns">
            <button type="button" class="orl-m-sec-btn" data-orl-mact="rcmd" data-rcmd="reveal-now">⏭️ ปิดรับ &amp; เฉลย</button>
            <button type="button" class="orl-m-sec-btn" data-orl-mact="rcmd" data-rcmd="next-question">ข้อถัดไป / Podium →</button>
          </div>
          <button type="button" class="orl-m-sec-btn" data-orl-mact="view-synced-slides" style="margin-top:4px">📖 เปิดดูหน้าสไลด์เต็มจอ (Pinch-Zoom ได้)</button>
        </div>
      `;
    } else if (!state.joined) {
      const isFacPick = state.memberType === "faculty";
      const pin3 = state.pinDigits || "";
      const pinMatches = pin3.length === 3 ? findStudentsBy3Digits(pin3) : [];
      const hasBoundStu = Boolean(state.studentId && state.memberType === "student");

      let pinStatusHtml = "";
      if (pin3.length === 3) {
        if (pinMatches.length === 1) {
          const s = pinMatches[0];
          pinStatusHtml = `
            <div class="orl-m-selected-stu is-ready">
              ✅ <strong>${esc(s.id)} · ${esc(s.nickname || s.name)}</strong> (${esc(s.fullName || s.name)} · กลุ่ม รพ.${esc(s.area)})
            </div>
          `;
        } else if (pinMatches.length > 1) {
          pinStatusHtml = `
            <div class="orl-pin-multi-box">
              <div class="orl-m-lbl">พบรหัสท้าย <strong>${esc(pin3)}</strong> จำนวน ${pinMatches.length} คน — แตะชื่อของคุณเพื่อเข้าห้องทันที:</div>
              ${pinMatches
                .map(
                  (s) => `
                  <button type="button" class="orl-sug-item is-pin-choice" data-orl-mact="pick-roster-join" data-sid="${esc(s.id)}">
                    <strong>🎓 ${esc(s.id)} · ${esc(s.nickname || s.name)}</strong>
                    <span>${esc(s.fullName || s.name)} · กลุ่ม รพ.${esc(s.area)}</span>
                  </button>
                `
                )
                .join("")}
            </div>
          `;
        } else {
          pinStatusHtml = `<div class="orl-pin-miss-note">⚠️ ไม่พบรหัสท้าย ${esc(pin3)} ในรายชื่อ 169 คน — กด ⌫ แก้ไข หรือกดเข้าห้องด้วยรหัสนี้ได้</div>`;
        }
      } else if (hasBoundStu) {
        pinStatusHtml = `<div class="orl-m-selected-stu is-ready">✅ <strong>${esc(state.studentId)} · ${esc(state.nickname)}</strong> (กลุ่ม รพ.${esc(state.area)})</div>`;
      }

      bodyHtml = `
        <div class="orl-m-card is-kahoot-login-card">
          <div class="orl-m-head-compact">
            <div class="orl-m-badge">🎮 RACM 303 · KAHOOT! LIVE LOBBY</div>
            <h2 class="orl-m-title">กดรหัสนักศึกษา 3 ตัวท้ายเพื่อ Login</h2>
          </div>

          <div class="orl-role-tabs" role="tablist" aria-label="เลือกบทบาทผู้เข้าร่วม">
            <button type="button" class="orl-role-tab${!isFacPick ? " is-active" : ""}" data-orl-mact="switch-mtype" data-mtype="student">🎓 นักศึกษาแพทย์ (PIN 3 ตัว)</button>
            <button type="button" class="orl-role-tab${isFacPick ? " is-active" : ""}" data-orl-mact="switch-mtype" data-mtype="faculty">👨‍⚕️ อาจารย์ประจำรายวิชา</button>
          </div>

          ${
            isFacPick
              ? `
              <div class="orl-m-lbl">แตะเลือกชื่ออาจารย์เพื่อเข้าร่วมทันที (14 ท่าน)</div>
              <div class="orl-fac-grid">
                ${FACULTY_LIST.map(
                  (f) =>
                    `<button type="button" class="orl-fac-chip-btn" data-orl-mact="pick-faculty" data-fcode="${f.code}">👨‍⚕️ ${esc(f.short)}</button>`
                ).join("")}
              </div>
              <label class="orl-m-lbl" for="orlFacLookupInput">หรือพิมพ์ชื่ออาจารย์ / ผู้ร่วมฟัง</label>
              <input id="orlFacLookupInput" class="orl-m-input" type="text" autocomplete="off" value="${esc(state.memberType === "faculty" ? state.nickname : "")}" placeholder="เช่น อ.สมชาย…">
              <button type="button" class="orl-m-join-btn" data-orl-mact="join-now">🚀 เข้าร่วมในฐานะอาจารย์</button>
            `
              : `
              <div class="orl-pin-slots" aria-label="รหัสนักศึกษา 3 ตัวท้าย">
                ${[0, 1, 2]
                  .map((i) => {
                    const ch = pin3[i] || "";
                    const active = pin3.length === i;
                    return `<div class="orl-pin-slot${ch ? " is-filled" : ""}${active ? " is-cursor" : ""}">${ch || "•"}</div>`;
                  })
                  .join("")}
              </div>

              ${pinStatusHtml}

              <div class="orl-pin-numpad" role="group" aria-label="แป้นกดรหัสนักศึกษา 3 ตัวท้าย">
                ${["1", "2", "3", "4", "5", "6", "7", "8", "9"]
                  .map((d) => `<button type="button" class="orl-pin-key" data-orl-mact="pin-digit" data-digit="${d}">${d}</button>`)
                  .join("")}
                <button type="button" class="orl-pin-key is-fn" data-orl-mact="pin-clear">ล้าง</button>
                <button type="button" class="orl-pin-key" data-orl-mact="pin-digit" data-digit="0">0</button>
                <button type="button" class="orl-pin-key is-fn" data-orl-mact="pin-back" aria-label="ลบตัวท้าย">⌫</button>
              </div>

              <button type="button" class="orl-m-join-btn is-kahoot-enter${hasBoundStu || pin3.length === 3 ? " is-ready-pulse" : ""}" data-orl-mact="join-now">
                🚀 เข้าห้อง Kahoot! ทันที ${hasBoundStu ? `(${esc(state.shortNo)} ${esc(state.nickname)})` : ""}
              </button>

              <input id="orlStuLookupInput" class="orl-m-input is-compact-fallback" type="search" inputmode="search" autocomplete="off" placeholder="หรือค้นหาด้วยชื่อเล่น / รหัส 7 หลัก…">
              <div class="orl-sug-list" id="orlRosterSuggestBox"></div>
            `
          }
        </div>
      `;
    } else if (state.session.phase === "question") {
      const q = getCurrentQuestion();
      const qMap = q && state.answersByQ.get(q.id);
      const myAns = qMap ? qMap.get(state.participantId) : null;
      const remSec = Math.ceil(getRemainingMs() / 1000);
      const pct = Math.max(0, Math.min(100, (getRemainingMs() / Math.max(1000, (state.session.durationSec || 10) * 1000)) * 100));

      if (myAns) {
        const pickedMeta = getChoiceMeta(q, myAns.choiceIdx);
        const secTaken = (Math.max(80, myAns.elapsedMs || 500) / 1000).toFixed(2);
        bodyHtml = `
          <div class="orl-m-card is-centered">
            <div class="orl-m-locked-chip ${pickedMeta.cls}">${pickedMeta.shape}${pickedMeta.grade ? " " + esc(pickedMeta.grade) : ""} ส่งคำตอบแล้ว!</div>
            <h2 class="orl-m-title">⚡ ความไวของคุณ: ${secTaken} วินาที</h2>
            <p class="orl-m-desc">รอลุ้นเสียงฉาบหมดเวลาและผลคะแนนพร้อมกันทั้งห้อง…</p>
            <div class="orl-m-wait-pulse">เหลือเวลา <strong data-orl-timer-sec>${remSec}s</strong></div>
          </div>
        `;
      } else {
        const padGridCls = q.choices.length >= 6 ? "is-6-pad" : "is-4-pad";
        bodyHtml = `
          <div class="orl-m-q-wrap">
            <div class="orl-m-q-head">
              <span class="orl-q-num-pill">ข้อ ${state.session.qPos + 1} / ${getActiveQuestionList().length}</span>
              <span class="orl-timer-badge${remSec <= 3 ? " is-urgent" : ""}" data-orl-timer-sec>${remSec}s</span>
            </div>
            <div class="orl-timer-progress-track">
              <div class="orl-timer-progress-fill" data-orl-timer-bar style="width:${pct.toFixed(1)}%"></div>
            </div>
            <div class="orl-m-q-stem">${esc(q.stem)}</div>
            <div class="orl-m-pad-grid ${padGridCls}">
              ${q.choices
                .map((txt, idx) => {
                  const meta = getChoiceMeta(q, idx);
                  return `
                    <button type="button" class="orl-m-pad-btn ${meta.cls}" data-orl-mact="submit-choice" data-choice-idx="${idx}">
                      <span class="orl-m-pad-shape">${meta.shape}${meta.grade ? ` <strong>${esc(meta.grade)}</strong>` : ""}</span>
                      <span class="orl-m-pad-txt">${esc(txt)}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          </div>
        `;
      }
    } else if (state.session.phase === "reveal") {
      const q = getCurrentQuestion();
      const qMap = q && state.answersByQ.get(q.id);
      const myAns = qMap ? qMap.get(state.participantId) : null;
      const rightMeta = getChoiceMeta(q, q.correctIdx);
      const gotRight = Boolean(myAns && myAns.correct);
      const secTaken = myAns ? (Math.max(80, myAns.elapsedMs || 500) / 1000).toFixed(2) : null;

      bodyHtml = `
        <div class="orl-m-card ${gotRight ? "is-res-correct" : "is-res-review"}">
          <div class="orl-m-verdict-banner ${gotRight ? "is-ok" : "is-miss"}">
            ${
              gotRight
                ? `🎉 ถูกต้อง! +${myAns.points} แต้ม (⚡ ${secTaken}s)`
                : myAns
                ? `💡 พลาดไปนิด! คำตอบที่ถูกคือ ${rightMeta.shape}${rightMeta.grade ? " " + rightMeta.grade : ""}`
                : `⏰ หมดเวลา! คำตอบที่ถูกคือ ${rightMeta.shape}${rightMeta.grade ? " " + rightMeta.grade : ""}`
            }
          </div>
          <div class="orl-m-correct-ans-box">
            <strong>✓ เฉลย:</strong> ${esc(q.choices[q.correctIdx])}
          </div>
          <div class="orl-m-recheck-notes">
            <div><strong>✅ DO:</strong> ${esc(q.doSummary)}</div>
            <div><strong>🚫 DON'T:</strong> ${esc(q.dontSummary)}</div>
            <div><strong>⚖️ สรุปเกณฑ์:</strong> ${esc(q.osmuRule)}</div>
          </div>
          <div class="orl-m-rank-strip">
            <span>แต้มรวม: <strong>${myEntry.score.toLocaleString()} แต้ม</strong></span>
            <span>อันดับ: <strong>#${myRankIdx >= 0 ? myRankIdx + 1 : "-"}</strong></span>
          </div>
        </div>
      `;
    } else if (state.session.phase === "podium") {
      const deck = getActiveQuestionList();
      const top3 = board.slice(0, 3);
      const missedList = deck.filter((q) => {
        const qMap = state.answersByQ.get(q.id);
        const mine = qMap && qMap.get(state.participantId);
        return !mine || !mine.correct;
      });
      bodyHtml = `
        <div class="orl-m-card">
          <div class="orl-m-badge">🏆 KAHOOT! PODIUM · อันดับ 1 · 2 · 3</div>
          ${
            top3.length
              ? `
            <div class="orl-m-top3-strip">
              ${top3
                .map((p, i) => {
                  const med = i === 0 ? "🥇 #1" : i === 1 ? "🥈 #2" : "🥉 #3";
                  return `<div class="orl-m-top3-row is-r${i + 1}"><span><strong>${med}</strong> ${esc(p.avatar)} ${esc(p.label)}</span><strong>${p.score.toLocaleString()} แต้ม</strong></div>`;
                })
                .join("")}
            </div>
          `
              : ""
          }
          <h2 class="orl-m-title" style="margin-top:6px">${esc(state.avatar)} คุณ: ${esc(getPlayerLabel(state))}</h2>
          <div class="orl-m-rank-strip" style="margin:4px 0 8px">
            <span>แต้มของคุณ: <strong>${myEntry.score.toLocaleString()} แต้ม</strong></span>
            <span>ถูก: <strong>${myEntry.correctCount}/${deck.length}</strong></span>
            <span>อันดับ: <strong>#${myRankIdx >= 0 ? myRankIdx + 1 : "-"}</strong></span>
          </div>
          ${
            missedList.length === 0
              ? `<div class="orl-m-selected-stu">🌟 ยอดเยี่ยม! คุณตอบถูกครบทั้ง ${deck.length} ข้อ!</div>`
              : `
                <div class="orl-m-lbl">📌 สรุปประเด็นสำคัญที่ควรจดจำ:</div>
                <div class="orl-m-recheck-notes">
                  ${missedList.map((q) => `<div>• <strong>${esc(q.badge)}:</strong> ${esc(q.osmuRule)}</div>`).join("")}
                </div>
              `
          }
          <button type="button" class="orl-m-join-btn" data-orl-mact="view-synced-slides" style="margin-top:8px">📘 เปิดดูสไลด์สรุปเกณฑ์ O/S/M/U &rarr;</button>
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="orl-m-card is-centered">
          <div class="orl-m-you-in">🎉 You're in! เข้าห้อง Kahoot! สำเร็จ</div>
          <div class="orl-m-player-hero">
            <span class="orl-m-big-ava">${esc(state.avatar)}</span>
            <div>
              <div class="orl-m-pname">${esc(getPlayerLabel(state))}</div>
              <div class="orl-m-parea">${esc(state.memberType === "faculty" ? "คณาจารย์ประจำรายวิชา RACM 303" : state.area ? `กลุ่ม รพ.${state.area}` : "ผู้เข้าร่วม RACM 303")}</div>
            </div>
          </div>

          <div class="orl-m-wait-box">
            <div class="orl-m-spinner" aria-hidden="true"></div>
            <strong>เห็นชื่อของคุณบนจอหน้าห้องแล้วใช่ไหม? 🚀</strong>
            <p>เตรียมนิ้วให้พร้อม! เมื่ออาจารย์เริ่มยิงคำถาม แป้นกดตอบ Kahoot! (ข้อละ 10 วินาที · ตอบถูก + เร็วสุดได้แต้มสูงสุด) จะเด้งขึ้นมาอัตโนมัติ</p>
            <div class="orl-m-slide-tracker">
              📡 สไลด์ปัจจุบัน: <strong>Slide ${esc(state.session.hostSlideNum || "01")}</strong> · ${esc(state.session.hostSlideTitle || "Orientation")}
            </div>
          </div>

          <button type="button" class="orl-m-join-btn" data-orl-mact="view-synced-slides" style="width:100%">📖 ดูสไลด์ซิงค์ตามจอหน้าห้อง (Pinch-Zoom ได้)</button>
          <div class="orl-m-foot-btns">
            <button type="button" class="orl-m-sec-btn" data-orl-mact="edit-profile">✏️ เปลี่ยนรหัส 3 ตัว / บทบาท</button>
            <button type="button" class="orl-m-sec-btn" data-orl-mact="close">ย่อหน้าต่าง</button>
          </div>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="orl-m-shell">
        <div class="orl-m-topbar">
          <span class="orl-live-pill"><span class="orl-dot${cloudOk ? " is-online" : ""}"></span> RACM 303 KAHOOT!</span>
          ${
            canRemote && state.joined
              ? `
            <div class="orl-seg-group">
              <button type="button" class="orl-seg-btn${state.mobileTab === "pad" ? " is-active" : ""}" data-orl-mact="switch-mtab" data-mtab="pad">🎮 ตอบ Quiz</button>
              <button type="button" class="orl-seg-btn${state.mobileTab === "remote" ? " is-active" : ""}" data-orl-mact="switch-mtab" data-mtab="remote">🎛️ รีโมท</button>
            </div>
          `
              : `<span class="orl-m-score-pill">${myEntry.score.toLocaleString()} แต้ม</span>`
          }
          <button type="button" class="orl-m-close" data-orl-mact="close" aria-label="ย่อหน้าต่าง">&times;</button>
        </div>
        <div class="orl-m-body">${bodyHtml}</div>
      </div>
    `;
  }

  function openParticipantModal() {
    state.participantModalOpen = true;
    renderParticipantModal();
  }

  function closeParticipantModal() {
    state.participantModalOpen = false;
    renderParticipantModal();
    if (window.location.hash === "#live" || window.location.hash === "#orient-live") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  /* ---------- 13. Zoomed QR & Custom Poll Modals ---------- */
  function ensureAuxOverlay() {
    let el = document.getElementById("orientLiveAuxOverlay");
    if (el) return el;
    el = document.createElement("div");
    el.id = "orientLiveAuxOverlay";
    el.className = "orl-aux-backdrop";
    el.hidden = true;
    document.body.appendChild(el);

    el.addEventListener("click", (ev) => {
      if (ev.target === el || ev.target.closest("[data-orl-aux-close]")) {
        state.qrZoomOpen = false;
        state.customPollModalOpen = false;
        renderAuxOverlay();
        return;
      }
      const urlSwitch = ev.target.closest("[data-orl-url-mode]");
      if (urlSwitch) {
        state.qrUrlMode = urlSwitch.getAttribute("data-orl-url-mode");
        renderAuxOverlay();
        renderAllSurfaces(true);
      }
    });

    el.addEventListener("submit", (ev) => {
      if (ev.target && ev.target.id === "orlCustomPollForm") {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const stem = String(fd.get("stem") || "").trim();
        const c0 = String(fd.get("c0") || "").trim();
        const c1 = String(fd.get("c1") || "").trim();
        const c2 = String(fd.get("c2") || "").trim();
        const c3 = String(fd.get("c3") || "").trim();
        const right = Math.max(0, Math.min(3, Number(fd.get("correctIdx")) || 0));
        const note = String(fd.get("osmuRule") || "").trim() || "คำถามทวนสอบเพิ่มเติมจากอาจารย์ผู้สอน";
        if (!stem || !c0 || !c1) return;
        const newQ = {
          id: randomId("custq"),
          quick5: true,
          isOsmuScenario: false,
          badge: "LIVE POLL · คำถามสดจากอาจารย์",
          impactTag: "ทวนสอบความเข้าใจในห้องปฐมนิเทศ",
          durationSec: state.customDurationSec || 10,
          stem,
          choices: [c0, c1, c2 || "ไม่มีข้อใดถูก", c3 || "ถูกทุกข้อที่กล่าวมา"],
          correctIdx: right,
          sourceRef: "คำถามสดคาบปฐมนิเทศ RACM 303",
          doSummary: "ตรวจสอบความเข้าใจร่วมกับคณาจารย์ประจำรายวิชา",
          dontSummary: "ระวังความเข้าใจคลาดเคลื่อนในประเด็นที่อภิปราย",
          osmuRule: note,
          wrongHints: ["", "", "", ""]
        };
        state.customQuestions.push(newQ);
        safeSet("racm303_orient_custom_qs_v1", JSON.stringify(state.customQuestions));
        state.session.activeDeckIds.push(newQ.id);
        state.customPollModalOpen = false;
        renderAuxOverlay();
        renderAllSurfaces(true);
      }
    });
    return el;
  }

  function renderAuxOverlay() {
    const el = ensureAuxOverlay();
    if (!state.qrZoomOpen && !state.customPollModalOpen) {
      el.hidden = true;
      return;
    }
    mountOverlayToActiveRoot(el);
    syncVisualViewportVars();
    el.hidden = false;

    if (state.qrZoomOpen) {
      const joinUrl = getJoinUrl();
      const brk = getParticipantRoleBreakdown();
      el.innerHTML = `
        <div class="orl-qr-zoom-card">
          <div class="orl-qz-top">
            <span class="orl-live-pill is-lg"><span class="orl-dot is-online"></span> สแกน QR แล้วกดรหัสนักศึกษา 3 ตัวท้าย</span>
            <button type="button" class="orl-m-close" data-orl-aux-close="1">&times;</button>
          </div>
          <div class="orl-qz-svg-wrap">
            ${buildQrSvg(joinUrl, "is-giant-qr")}
          </div>
          <div class="orl-qz-url">${esc(joinUrl)}</div>
          <div class="orl-qz-foot">
            <span>เข้าร่วมสด <strong data-orl-participant-count>${brk.total}</strong> คน (<span data-orl-role-breakdown>🎓 นศพ. ${brk.stu}/169 · 👨‍⚕️ อาจารย์ ${brk.fac} ท่าน</span>)</span>
            <div class="orl-seg-group">
              <button type="button" class="orl-seg-btn${state.qrUrlMode === "prod" ? " is-active" : ""}" data-orl-url-mode="prod">🔵 ลิงก์รวม นศ.+อาจารย์</button>
              <button type="button" class="orl-seg-btn${state.qrUrlMode === "faculty" ? " is-active" : ""}" data-orl-url-mode="faculty">🔴 ลิงก์ Faculty Portal</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    if (state.customPollModalOpen) {
      el.innerHTML = `
        <form class="orl-custom-form-card" id="orlCustomPollForm">
          <div class="orl-qz-top">
            <strong>➕ เพิ่มคำถามสดด่วน (Quick Kahoot Question)</strong>
            <button type="button" class="orl-m-close" data-orl-aux-close="1">&times;</button>
          </div>
          <label class="orl-m-lbl">โจทย์คำถาม Recheck</label>
          <input name="stem" class="orl-m-input" required placeholder="พิมพ์คำถามที่ต้องการถามผู้เรียนสด…">
          <div class="orl-cf-grid">
            <input name="c0" class="orl-m-input" required placeholder="▲ ตัวเลือกสีแดง (จำเป็น)">
            <input name="c1" class="orl-m-input" required placeholder="◆ ตัวเลือกสีน้ำเงิน (จำเป็น)">
            <input name="c2" class="orl-m-input" placeholder="● ตัวเลือกสีเหลือง">
            <input name="c3" class="orl-m-input" placeholder="■ ตัวเลือกสีเขียว">
          </div>
          <div class="orl-cf-row">
            <label class="orl-m-lbl">ข้อที่ถูกต้อง:</label>
            <select name="correctIdx" class="orl-m-input" style="max-width:220px">
              <option value="0">▲ สีแดง</option>
              <option value="1">◆ สีน้ำเงิน</option>
              <option value="2">● สีเหลือง</option>
              <option value="3">■ สีเขียว</option>
            </select>
          </div>
          <label class="orl-m-lbl">สรุปเฉลย / เกณฑ์ที่แสดงหลังเฉลย</label>
          <input name="osmuRule" class="orl-m-input" placeholder="คำอธิบายสั้นๆ เมื่อเฉลยคำตอบ…">
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
            <button type="button" class="orl-bar-btn" data-orl-aux-close="1">ยกเลิก</button>
            <button type="submit" class="orl-bar-btn is-primary-next">บันทึกเข้าชุดคำถาม</button>
          </div>
        </form>
      `;
    }
  }

  /* ---------- 14. Surgical In-Place DOM Refresh & Event Delegation ---------- */
  function updateTimerDomInPlace(remMs) {
    const sec = Math.ceil(remMs / 1000);
    const durMs = Math.max(1000, (state.session.durationSec || 10) * 1000);
    const pct = Math.max(0, Math.min(100, (remMs / durMs) * 100));
    document.querySelectorAll("[data-orl-timer-sec]").forEach((el) => {
      el.textContent = `${sec}s`;
      el.classList.toggle("is-urgent", sec <= 3);
    });
    document.querySelectorAll("[data-orl-timer-num]").forEach((el) => {
      el.textContent = String(sec);
    });
    document.querySelectorAll("[data-orl-timer-orb]").forEach((el) => {
      el.classList.toggle("is-urgent", sec <= 3);
    });
    document.querySelectorAll("[data-orl-timer-bar]").forEach((el) => {
      el.style.width = `${pct.toFixed(1)}%`;
    });
  }

  function refreshLiveCountsAndChips() {
    const brk = getParticipantRoleBreakdown();
    document.querySelectorAll("[data-orl-participant-count]").forEach((el) => {
      el.textContent = String(brk.total);
    });
    document.querySelectorAll("[data-orl-role-breakdown]").forEach((el) => {
      el.textContent = `🎓 นศพ. ${brk.stu}/169 · 👨‍⚕️ อาจารย์ ${brk.fac} ท่าน`;
    });
    document.querySelectorAll("[data-orl-participant-chips]").forEach((el) => {
      el.innerHTML = buildJoinedChipsMarkup(8, true);
    });
    document.querySelectorAll("[data-orl-participant-wall]").forEach((el) => {
      el.innerHTML = buildJoinedChipsMarkup(48, false);
    });
    document.querySelectorAll("[data-orl-area-strip]").forEach((areaStrip) => {
      const areaCounts = getAreaCounts();
      const areasOrder = ["คณาจารย์", "กุฉินารายณ์", "ด่านซ้าย", "ตะกั่วป่า", "ท่าวังผา", "เพชรบูรณ์ 1", "เพชรบูรณ์ 2", "อุบลรัตน์", "ท่าสองยาง", "อุ้มผาง"];
      areaStrip.innerHTML = areasOrder
        .map((area) => {
          const c = areaCounts[area] || 0;
          const isFacPill = area === "คณาจารย์";
          return `<span class="orl-area-pill${c > 0 ? " has-joined" : ""}${isFacPill ? " is-fac-area" : ""}">${isFacPill ? "👨‍⚕️ " : ""}${esc(area)} <strong>${c}</strong></span>`;
        })
        .join("");
    });
    const q = getCurrentQuestion();
    if (q) {
      const stats = getQuestionStats(q);
      document.querySelectorAll("[data-orl-answered-count]").forEach((el) => {
        el.textContent = String(stats.total);
      });
    }
    const cloudOk = isCloudConnected();
    document.querySelectorAll("[data-orl-sync-label]").forEach((el) => {
      el.textContent = cloudOk ? "ซิงค์สดทุกแพลตฟอร์ม" : "พร้อมซิงค์ในเครือข่าย";
    });
  }

  function renderAllSurfaces(rerenderDeckIfLive) {
    if (rerenderDeckIfLive && window.RACM_ORIENTATION_DECK && typeof window.RACM_ORIENTATION_DECK.refreshLiveSurface === "function") {
      window.RACM_ORIENTATION_DECK.refreshLiveSurface();
    } else {
      refreshLiveCountsAndChips();
    }
    if (state.participantModalOpen) renderParticipantModal();
    if (state.qrZoomOpen || state.customPollModalOpen) renderAuxOverlay();
  }

  function updateFloatingBanner() {
    let bar = document.getElementById("orlFloatingJoinPill");
    const isActiveQuiz = state.session.phase === "question" || (state.session.updatedWallMs > 0 && Date.now() - state.session.updatedWallMs < 45 * 60 * 1000);
    if (!isActiveQuiz || state.participantModalOpen) {
      if (bar) bar.hidden = true;
      return;
    }
    if (!bar) {
      bar = document.createElement("button");
      bar.type = "button";
      bar.id = "orlFloatingJoinPill";
      bar.className = "orl-floating-join-pill";
      bar.addEventListener("click", openParticipantModal);
      document.body.appendChild(bar);
    }
    bar.hidden = false;
    bar.innerHTML =
      state.session.phase === "question"
        ? `⚡ Kahoot! Quiz กำลังนับเวลา! แตะเพื่อตอบทันที &rarr;`
        : `🟢 Kahoot! Live เปิดอยู่ (${state.participants.size} คน) · แตะเปิดแป้นตอบ/ซิงค์สไลด์`;
  }

  document.addEventListener("click", (ev) => {
    getAudioCtx();
    const btn = ev.target.closest("[data-orl-action], [data-orl-preset], [data-orl-dur], [data-orl-jump-q]");
    if (!btn) return;

    if (btn.hasAttribute("data-orl-preset")) {
      applyPresetDeck(btn.getAttribute("data-orl-preset"));
      renderAllSurfaces(true);
      return;
    }
    if (btn.hasAttribute("data-orl-dur")) {
      state.customDurationSec = Number(btn.getAttribute("data-orl-dur")) || 10;
      renderAllSurfaces(true);
      return;
    }
    if (btn.hasAttribute("data-orl-jump-q")) {
      const idx = Number(btn.getAttribute("data-orl-jump-q")) || 0;
      hostStartQuestionAt(idx);
      return;
    }

    const act = btn.getAttribute("data-orl-action");
    if (act === "show-cover-hero") {
      state.coverPaneMode = "hero";
      renderAllSurfaces(true);
    } else if (act === "show-cover-lobby") {
      state.coverPaneMode = "lobby";
      renderAllSurfaces(true);
    } else if (act === "zoom-qr") {
      ev.stopPropagation();
      state.qrZoomOpen = true;
      renderAuxOverlay();
    } else if (act === "open-custom-modal") {
      state.customPollModalOpen = true;
      renderAuxOverlay();
    } else if (act === "open-deck-live") {
      if (ROLE === "faculty" && state.session.seq === 0) hostOpenLobby();
      if (window.RACM_ORIENTATION_DECK && typeof window.RACM_ORIENTATION_DECK.openLiveLobby === "function") {
        window.RACM_ORIENTATION_DECK.openLiveLobby();
      }
    } else if (act === "jump-to-quiz-slide") {
      if (window.RACM_ORIENTATION_DECK && typeof window.RACM_ORIENTATION_DECK.goToSlideById === "function") {
        window.RACM_ORIENTATION_DECK.goToSlideById("s14a-kahoot-qr-lobby");
      }
    } else if (act === "launch-kahoot-slide") {
      if (window.RACM_ORIENTATION_DECK && typeof window.RACM_ORIENTATION_DECK.goToSlideById === "function") {
        window.RACM_ORIENTATION_DECK.goToSlideById("s14-quiz-osmu");
      }
      hostStartQuestionAt(0);
    } else if (act === "goto-criteria-slide") {
      stopKahootCountdownBgm();
      if (window.RACM_ORIENTATION_DECK && typeof window.RACM_ORIENTATION_DECK.goToSlideById === "function") {
        window.RACM_ORIENTATION_DECK.goToSlideById("s15-osmu-criteria");
      }
    } else if (act === "quick-start-quiz") {
      if (window.RACM_ORIENTATION_DECK && typeof window.RACM_ORIENTATION_DECK.openLiveLobby === "function") {
        window.RACM_ORIENTATION_DECK.openLiveLobby();
      }
      hostStartQuestionAt(0);
    } else if (act === "start-q0") {
      hostStartQuestionAt(0);
    } else if (act === "reveal-now") {
      hostRevealAnswer();
    } else if (act === "next-question") {
      hostNextStep();
    } else if (act === "back-to-lobby") {
      hostOpenLobby();
    } else if (act === "reset-session") {
      hostResetSession();
    } else if (act === "toggle-q-picker") {
      state.questionPickerOpen = !state.questionPickerOpen;
      renderAllSurfaces(true);
    } else if (act === "toggle-mute") {
      state.soundMuted = !state.soundMuted;
      safeSet("racm303_orient_mute_v1", state.soundMuted ? "1" : "0");
      if (state.soundMuted) stopKahootCountdownBgm();
      else if (state.session.phase === "question" && state.session.timerRunning) startKahootCountdownBgm();
      renderAllSurfaces(true);
    } else if (act === "open-participant-pad") {
      openParticipantModal();
    } else if (act === "continue-slides") {
      if (window.RACM_ORIENTATION_DECK && typeof window.RACM_ORIENTATION_DECK.resumeSlidesFromLobby === "function") {
        window.RACM_ORIENTATION_DECK.resumeSlidesFromLobby();
      }
    }
  });

  function hasOpenOverlay() {
    return Boolean(state.qrZoomOpen || state.customPollModalOpen || state.participantModalOpen);
  }

  function closeTopOverlay() {
    if (state.qrZoomOpen || state.customPollModalOpen) {
      state.qrZoomOpen = false;
      state.customPollModalOpen = false;
      renderAuxOverlay();
      return true;
    }
    if (state.participantModalOpen) {
      closeParticipantModal();
      return true;
    }
    return false;
  }

  document.addEventListener(
    "keydown",
    (ev) => {
      if (ev.key === "Escape" && hasOpenOverlay()) {
        ev.preventDefault();
        ev.stopPropagation();
        closeTopOverlay();
        return;
      }
      if (state.participantModalOpen && !state.joined && state.memberType === "student") {
        const tag = (ev.target && ev.target.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (/^[0-9]$/.test(ev.key)) {
          ev.preventDefault();
          handlePinDigitInput(ev.key);
        } else if (ev.key === "Backspace") {
          ev.preventDefault();
          state.pinDigits = state.pinDigits.slice(0, -1);
          state.studentId = "";
          renderParticipantModal();
        } else if (ev.key === "Enter" && (state.studentId || state.pinDigits.length === 3)) {
          ev.preventDefault();
          const m3 = state.pinDigits.length === 3 ? findStudentsBy3Digits(state.pinDigits) : [];
          if (m3.length === 1 || state.studentId) {
            if (!state.studentId && m3[0]) applyRosterToLocalState(m3[0], true);
            else {
              state.joined = true;
              safeSet("racm303_orient_joined_v1", "1");
            }
            publishMyPresence();
            publishPacket("cmd", { type: "who_is_here" }, false);
            renderParticipantModal();
          }
        }
      }
    },
    true
  );

  function checkAutoJoinUrl() {
    const params = new URLSearchParams(window.location.search);
    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (params.get("orient_join") === "1" || h === "live" || h === "orient-live") {
      setTimeout(() => {
        openParticipantModal();
      }, 60);
    }
  }

  window.addEventListener("hashchange", checkAutoJoinUrl);

  document.addEventListener("fullscreenchange", () => {
    if (state.participantModalOpen) mountOverlayToActiveRoot(document.getElementById("orientParticipantModal"));
    if (state.qrZoomOpen || state.customPollModalOpen) mountOverlayToActiveRoot(document.getElementById("orientLiveAuxOverlay"));
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncVisualViewportVars();
      if (state.joined) publishMyPresence();
      publishPacket("cmd", { type: "who_is_here" }, false);
    }
  });

  initTransports();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAutoJoinUrl);
  } else {
    checkAutoJoinUrl();
  }

  window.RACM_ORIENTATION_LIVE = {
    renderCoverCardHtml,
    renderQrLobbySlideHtml,
    renderDeckLiveStageHtml,
    renderEmbeddedQuizSlideHtml,
    openParticipantModal,
    closeParticipantModal,
    hasOpenOverlay,
    closeTopOverlay,
    notifyHostSlide,
    hostOpenLobby,
    hostResetSession,
    hostStartQuestionAt,
    stopKahootCountdownBgm,
    isFollowEnabled: () => state.followHostSlide,
    toggleFollowHostSlide: () => {
      state.followHostSlide = !state.followHostSlide;
      safeSet("racm303_orient_follow_v1", state.followHostSlide ? "1" : "0");
      return state.followHostSlide;
    },
    getParticipantCount: () => state.participants.size,
    getPhase: () => state.session.phase,
    stepQuizWithClicker,
    getJoinUrl,
    buildQrSvg
  };
})();
