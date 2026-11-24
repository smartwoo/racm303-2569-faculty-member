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
    { idx: 0, shape: "▲", cls: "is-red", hex: "#ea4335", nameTh: "สีแดง Google Red (▲)" },
    { idx: 1, shape: "◆", cls: "is-blue", hex: "#4285f4", nameTh: "สีน้ำเงิน Google Blue (◆)" },
    { idx: 2, shape: "●", cls: "is-gold", hex: "#f9ab00", nameTh: "สีเหลือง Google Yellow (●)" },
    { idx: 3, shape: "■", cls: "is-green", hex: "#34a853", nameTh: "สีเขียว Google Green (■)" }
  ];

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

  /* ---------- 2. Source-Verified O/S/M/U & Do's/Don'ts Question Bank ---------- */
  const BASE_QUESTIONS = [
    {
      id: "q1_attendance_leave",
      quick5: true,
      badge: "เวลาเรียน & สิทธิ์เข้าสอบ · โควตาการลา",
      impactTag: "เวลาเรียน ≥ 80% · ทฤษฎี ≤ 3 วัน · ภาคสนาม ≤ 1.5 วัน",
      durationSec: 20,
      stem: "ตามคู่มือรายวิชา RACM 303 นักศึกษาจะมี “สิทธิ์เข้าสอบ” เมื่อมีเวลาเรียนไม่น้อยกว่าร้อยละเท่าใด และลาได้ไม่เกินกี่วันในช่วงก่อน-หลังภาคสนาม และช่วงภาคสนามตามลำดับ?",
      choices: [
        "เวลาเรียน ≥ ร้อยละ 70 · ลาช่วงก่อน-หลังภาคสนาม ≤ 5 วัน · ภาคสนาม ≤ 2 วัน",
        "เวลาเรียน ≥ ร้อยละ 80 · ลาช่วงก่อนและหลังภาคสนามรวมกัน ≤ 3 วัน · ช่วงภาคสนาม ≤ 1.5 วัน",
        "เวลาเรียน ≥ ร้อยละ 80 · ลาช่วงก่อน-หลังภาคสนาม ≤ 4 วัน · ช่วงภาคสนามห้ามลาทุกกรณี",
        "เวลาเรียน ≥ ร้อยละ 90 · ลาได้รวมตลอดรายวิชาไม่เกิน 3 วันโดยไม่แยกช่วง"
      ],
      correctIdx: 1,
      sourceRef: "คู่มือการเรียนการสอน RACM 303 ปี 2569 หัวข้อ เวลาเรียนและการลา",
      doSummary: "รักษาเวลาเรียนรวมตลอดรายวิชา ≥ ร้อยละ 80 และยื่นใบลาขออนุมัติล่วงหน้าเสมอ (ก่อน-หลังภาคสนามรวม ≤ 3 วัน · ภาคสนาม ≤ 1.5 วัน)",
      dontSummary: "ห้ามขาดเรียนโดยไม่ยื่นใบลา (ขาดไม่ลา ≥ 2 ครั้ง = M) และห้ามลาเกินโควตาที่กำหนด",
      osmuRule: "เวลาเรียนต่ำกว่าร้อยละ 80 จะไม่มีสิทธิ์เข้าสอบ · ขาดเรียนโดยไม่ได้รับอนุญาต ≥ 2 ครั้งติดระดับ M ตามประกาศคณะฯ พ.ศ. 2567",
      wrongHints: [
        "เกณฑ์สิทธิ์เข้าสอบต้องมีเวลาเรียนไม่น้อยกว่าร้อยละ 80 และโควตาลาช่วงทฤษฎีรวมไม่เกิน 3 วัน ภาคสนามไม่เกิน 1.5 วัน",
        "",
        "ช่วงภาคสนามสามารถลาเมื่อมีเหตุจำเป็นได้ไม่เกิน 1.5 วัน (ต้องแจ้งและได้รับอนุมัติจากอาจารย์ที่ปรึกษา)",
        "รายวิชาแยกเพดานวันลาชัดเจน: ช่วงก่อนและหลังภาคสนามรวม ≤ 3 วัน และช่วงภาคสนาม ≤ 1.5 วัน"
      ]
    },
    {
      id: "q2_conduct_2567_mu",
      quick5: true,
      badge: "ประกาศคณะฯ พ.ศ. 2567 · พฤติกรรมไม่พึงประสงค์ (M / U)",
      impactTag: "สาย 4 ครั้ง = M (≥ 5 = U) · ได้ M ซ้ำ/2 หมวด = U",
      durationSec: 22,
      stem: "ตามประกาศคณะแพทยศาสตร์ รพ.รามาธิบดี เรื่องหลักเกณฑ์การประเมินเจตคติเกี่ยวกับพฤติกรรมที่ไม่พึงประสงค์ พ.ศ. 2567 ข้อใดเกิดระดับ M (ควรปรับปรุง) และขยับเป็น U (ไม่ผ่าน) อย่างถูกต้อง?",
      choices: [
        "เข้าเรียนสายเกิน 15 นาที 4 ครั้ง = M (≥ 5 ครั้ง = U) · ส่งงานช้า 2 ครั้ง = M (≥ 3 ครั้ง = U) · และได้ M ≥ 2 หมวดหรือซ้ำหมวดเดิมจะกลายเป็น U",
        "สายเกิน 15 นาที 2 ครั้ง = M · สาย 3 ครั้ง = U · แต่ส่งงานช้าไม่มีผลต่อเกรดเจตคติ",
        "ขาดเรียนไม่ลา 1 ครั้งได้ U ทันที ส่วนการมาสายหักเฉพาะคะแนนสอบทฤษฎี",
        "ติดระดับ M กี่หมวดก็ได้ ตราบใดที่คะแนนสอบทฤษฎีเกิน 2.00 จะไม่กลายเป็น U"
      ],
      correctIdx: 0,
      sourceRef: "คู่มือรายวิชา ข้อ 13 & ประกาศคณะฯ เรื่องพฤติกรรมที่ไม่พึงประสงค์ พ.ศ. 2567 (มม.4 หน้า 11–13)",
      doSummary: "ลงชื่อเข้าเรียนภายใน 15 นาทีแรกของคาบ ส่งงานทุกชิ้นตรงเวลา และรับผิดชอบต่อกลุ่มร่วมกัน",
      dontSummary: "ห้ามสายเกิน 15 นาทีสะสม (4 ครั้ง = M, ≥ 5 = U) ห้ามขาดไม่ลา (≥ 2 = M) และห้ามส่งงานช้า (2 ครั้ง = M, ≥ 3 = U)",
      osmuRule: "สำคัญมาก: หากได้รับ M ตั้งแต่ 2 หมวดขึ้นไป หรือทำผิดซ้ำในหมวด M เดิม จะถูกปรับผลเจตคติเป็น U ทันที!",
      wrongHints: [
        "",
        "สายเกิน 15 นาทีติด M ที่ครั้งที่ 4 (และ U ที่ครั้งที่ 5) ส่วนการส่งงานช้ามีผลโดยตรง: ช้า 2 ครั้ง = M และ ≥ 3 ครั้ง = U",
        "ขาดเรียนโดยไม่ได้รับอนุญาตตั้งแต่ 2 ครั้งขึ้นไปจะได้ระดับ M และการมาสายมีผลตรงต่อเจตคติ M / U",
        "หากได้ M ตั้งแต่ 2 หมวดขึ้นไป หรือทำผิดซ้ำในหมวด M เดิม จะขยับเป็น U ทันทีแม้สอบทฤษฎีผ่าน!"
      ]
    },
    {
      id: "q3_peer_and_grade_o",
      quick5: true,
      badge: "ข้อ 13 การประเมินเจตคติ · เพื่อนในกลุ่ม & เกรด O",
      impactTag: "เจตคติ O + สอบทฤษฎี O ทั้งคู่ + ไม่เคยสอบซ่อม = เกรด O",
      durationSec: 22,
      stem: "ข้อใดกล่าว “ถูกต้อง” เกี่ยวกับแบบประเมินพฤติกรรมและเจตคติจากเพื่อนในกลุ่ม และการได้รับเกรดสุดท้ายระดับ O (Outstanding) ของรายวิชา RACM 303?",
      choices: [
        "แบบประเมินจากเพื่อนไม่มีผลใด ๆ และเกรด O ดูเฉพาะคะแนนสอบทฤษฎีเฉลี่ยรวมกันเกิน 3.50",
        "ได้เกรด O ได้แม้เคยสอบซ่อม 1 ครั้ง หากหลังสอบซ่อมได้คะแนนสูงและเพื่อนประเมินให้ดี",
        "แบบประเมินจากเพื่อนเป็นข้อมูลที่อาจารย์ใช้ประกอบการพิจารณาประเมินนักศึกษา และเกรดสุดท้ายได้ O เมื่อเจตคติภาพรวมได้ O + ผลสอบทฤษฎีได้ O ทั้งสองวิชา + ไม่มีการสอบซ่อม",
        "แบบประเมินจากเพื่อนใช้ตัดสินเกรดสุดท้ายแทนคะแนนสอบทฤษฎีทั้งหมด"
      ],
      correctIdx: 2,
      sourceRef: "คู่มือการเรียนการสอน RACM 303 ปี 2569 ข้อ 13 การประเมินด้านเจตคติและการตัดสินเกรด",
      doSummary: "ทำงานร่วมกับเพื่อนในกลุ่มอย่างรับผิดชอบ มีน้ำใจ ซื่อสัตย์ (สะท้อนใน Peer Evaluation & ฟอร์ม 2A) และเตรียมสอบทั้งสองวิชาให้พร้อมตั้งแต่รอบแรก",
      dontSummary: "อย่ากินแรงกลุ่ม และอย่าประมาททิ้งวิชาใดวิชาหนึ่ง เพราะต้องผ่านเกณฑ์ระดับ O ทั้งเจตคติและผลสอบทฤษฎีโดยไม่มีการสอบซ่อม",
      osmuRule: "เกรดสุดท้าย O = คะแนนประเมินภาพรวมเจตคติและพฤติกรรมได้ O + ผลสอบทฤษฎีได้ O (≥ 3.75 ทั้งระบบฯ และระบาดฯ) + ไม่มีการสอบซ่อม",
      wrongHints: [
        "คู่มือข้อ 13 ระบุชัดว่า แบบประเมินจากเพื่อนในกลุ่มเป็นข้อมูลสำคัญที่อาจารย์ใช้ประกอบการพิจารณาประเมินผลนักศึกษา",
        "หากมีการสอบซ่อม จะไม่ได้รับเกรด O (เมื่อสอบซ่อมผ่านจะได้รับเกรดเป็น S เท่านั้น)",
        "",
        "ผลประเมินจากเพื่อนเป็นข้อมูลประกอบการพิจารณาของอาจารย์ ควบคู่กับฟอร์ม 1A/2A และผลสอบทฤษฎี"
      ]
    },
    {
      id: "q4_retest_honors",
      quick5: true,
      badge: "การสอบซ่อมแยกวิชา (< 2.00) · เกรด S & เกียรตินิยม",
      impactTag: "ต่ำกว่า 2.00 สอบซ่อมแยกวิชา 1 ครั้ง → ผ่านได้ S & กระทบเกียรตินิยม",
      durationSec: 22,
      stem: "นศพ. สอบวิชาระบาดวิทยาได้ 3.80 แต่สอบวิชาระบบสุขภาพได้ 1.85 [แต้มต่ำกว่า 2.00] และผลเจตคติได้ O ข้อใดคือผลตามเกณฑ์การสอบซ่อมของรายวิชา?",
      choices: [
        "นำคะแนนทั้งสองวิชามาถัวเฉลี่ยกันได้ 2.82 จึงผ่านเป็นเกรด S ทันทีโดยไม่ต้องสอบซ่อม",
        "ต้องสอบซ่อมเฉพาะวิชาระบบสุขภาพ (แก้ตัวได้ 1 ครั้ง) ถ้าผ่านจะได้เกรด S (และมีผลต่อการได้รับเกียรตินิยม) ถ้าไม่ผ่านต้องลงทะเบียนเรียนใหม่",
        "ต้องสอบซ่อมใหม่ทั้งวิชาระบาดวิทยาและระบบสุขภาพพร้อมกัน และยังลุ้นเกรด O ได้",
        "ให้โอกาสสอบแก้ตัวได้ไม่จำกัดจำนวนครั้งจนกว่าจะผ่าน 2.00 โดยไม่กระทบเกียรตินิยม"
      ],
      correctIdx: 1,
      sourceRef: "คู่มือการเรียนการสอน RACM 303 ปี 2569 ข้อ 13 หัวข้อการสอบซ่อมและหมายเหตุเกียรตินิยม",
      doSummary: "เตรียมตัวสอบให้ได้แต้ม ≥ 2.00 แยกกันทั้งวิชาระบบสุขภาพและวิชาระบาดวิทยาตั้งแต่การสอบรอบแรก",
      dontSummary: "ห้ามเข้าใจผิดว่าคะแนนสอบทั้งสองวิชาถัวเฉลี่ยข้ามหมวดกันได้ — แต้มต่ำกว่า 2.00 แม้หมวดเดียวต้องสอบซ่อม!",
      osmuRule: "สอบแยกวิชา [แต้ม < 2.00 ต้องสอบซ่อม] แก้ตัวได้ 1 ครั้ง: ผ่านได้เกรด S (หมายเหตุ: มีผลต่อการได้รับเกียรตินิยม!) · ไม่ผ่านต้องลงทะเบียนเรียนใหม่",
      wrongHints: [
        "คะแนนสอบคิดแยกวิชาระบบฯ และวิชาระบาดฯ ไม่นำมาถัวเฉลี่ยกัน หากวิชาใดต่ำกว่า 2.00 ต้องสอบซ่อมวิชานั้น!",
        "",
        "สอบซ่อมเฉพาะวิชาที่ได้แต้มต่ำกว่า 2.00 เท่านั้น และเมื่อสอบซ่อมผ่านจะได้รับเกรดเป็น S (ไม่ได้ O)",
        "รายวิชาให้โอกาสสอบแก้ตัวได้เพียง 1 ครั้งเท่านั้น และคู่มือระบุหมายเหตุชัดว่า การสอบซ่อมมีผลต่อการได้รับเกียรตินิยม!"
      ]
    },
    {
      id: "q5_attitude_u_reregister",
      quick5: true,
      badge: "การลงทะเบียนเรียนใหม่ · เจตคติได้ U & ความซื่อสัตย์",
      impactTag: "ผลประเมินเจตคติและพฤติกรรมได้ U → ต้องลงทะเบียนเรียนใหม่ทันที",
      durationSec: 20,
      stem: "เพื่อนฝากเช็คชื่อเข้าเรียน หรือช่วยกันเมคข้อมูลเท็จในแบบสำรวจชุมชน จนผลการประเมินเจตคติและพฤติกรรมได้ระดับ “U” ผลตามคู่มือข้อ 13 คือข้อใด?",
      choices: [
        "ขอสอบข้อเขียนแก้ตัวเพิ่มเติม 1 ครั้งเพื่อเปลี่ยนเกรดจาก U เป็น S ได้",
        "ทำรายงานบำเพ็ญประโยชน์ส่งท้ายรายวิชาเพื่อปรับระดับ U เป็น M",
        "ตักเตือนเฉพาะผู้ฝากเช็คชื่อ ส่วนผู้ทำให้ถือว่ามีน้ำใจช่วยเหลือเพื่อนในกลุ่ม",
        "ทั้งผู้ฝากและผู้ทำแทนเข้าข่ายไม่ซื่อสัตย์ได้รับเจตคติระดับ U และเมื่อเจตคติและพฤติกรรมได้ U ต้องลงทะเบียนเรียนใหม่ (ไม่มีการสอบซ่อม)"
      ],
      correctIdx: 3,
      sourceRef: "คู่มือรายวิชา 2569 ข้อ 13 การลงทะเบียนเรียนใหม่ & ภาคผนวกฟอร์ม 1A ข้อ 6.2",
      doSummary: "ลงชื่อเข้าเรียนด้วยตนเอง เก็บข้อมูลชุมชนตามความจริง ไม่คัดลอกผลงาน และซื่อสัตย์ต่อวิชาชีพแพทย์",
      dontSummary: "ห้ามเซ็นชื่อแทนกัน ห้ามบิดเบือน/เมคข้อมูลสำรวจ ห้ามปลอมใบรับรองแพทย์ และห้ามทุจริตการสอบเด็ดขาด",
      osmuRule: "การลงทะเบียนเรียนใหม่: ผลการประเมินเจตคติและพฤติกรรมได้ U ต้องลงทะเบียนเรียนใหม่สถานเดียว (ไม่มีการสอบแก้ตัว!)",
      wrongHints: [
        "การสอบแก้ตัว 1 ครั้งใช้เฉพาะกรณีคะแนนสอบทฤษฎีต่ำกว่า 2.00 เท่านั้น ส่วนเจตคติได้ U ต้องลงทะเบียนเรียนใหม่ทันที!",
        "เมื่อสรุปผลเจตคติและพฤติกรรมเป็น U แล้ว ไม่สามารถทำรายงานแก้ตัวได้ ต้องลงทะเบียนเรียนใหม่",
        "ประกาศคณะฯ พ.ศ. 2567 และ มม.4 ระบุชัดว่าทั้งผู้ให้ทำแทนและผู้ทำแทนในการลงชื่อหรือทำงานแทน ได้รับ U ทั้งคู่",
        ""
      ]
    },
    {
      id: "q6_fieldwork_donts",
      quick5: false,
      badge: "DO'S & DON'TS · ระเบียบภาคสนาม พ.ศ. 2561",
      impactTag: "งดพาหนะส่วนตัว · งดออกนอกเขตฝึก · งดแอลกอฮอล์/พนัน",
      durationSec: 20,
      stem: "ระหว่างฝึกภาคสนาม ณ รพ.แหล่งฝึกทั้ง 9 แห่ง ข้อใดคือ “Don't (ห้ามทำเด็ดขาด)” ที่ฝ่าฝืนระเบียบฝึกปฏิบัติงานนอกสถานที่ พ.ศ. 2561 และนำไปสู่ระดับ U?",
      choices: [
        "เดินทางเป็นทีมด้วยรถที่ภาควิชา/รพ.จัดให้ และแจ้งอาจารย์ที่ปรึกษาทุกครั้งก่อนลงพื้นที่",
        "นำรถยนต์/มอเตอร์ไซค์ส่วนตัวไปใช้ ออกนอกเขตฝึกโดยพลการ ดื่มแอลกอฮอล์/เล่นพนัน หรือพาคนนอกเข้าที่พักโดยไม่ขออนุญาต",
        "แต่งกายสุภาพลงชุมชน และสวมชุดนักศึกษาแพทย์ติดป้ายชื่อเมื่อขึ้นปฏิบัติงานใน รพช.",
        "เคารพสิทธิผู้ป่วยและชุมชนโดยไม่โพสต์ภาพหรือข้อมูลผู้ป่วยลงสื่อสังคมออนไลน์"
      ],
      correctIdx: 1,
      sourceRef: "คู่มือรายวิชา 2569 หัวข้อ 2, 10, 14 (ประกาศระเบียบฝึกปฏิบัติงานนอกสถานที่ พ.ศ. 2561)",
      doSummary: "ใช้พาหนะและพักในที่พักที่จัดให้ ลงพื้นที่เป็นทีม แต่งกายสุภาพติดป้ายชื่อ และดูแลความปลอดภัยของเพื่อนร่วมทีม",
      dontSummary: "งดพาหนะส่วนตัว งดออกนอกพื้นที่โดยพลการ งดแอลกอฮอล์/สารเสพติด/การพนัน งดพาคนนอกเข้าที่พัก และห้ามปกปิดการกระทำผิด",
      osmuRule: "ฝ่าฝืนระเบียบภาคสนาม พ.ศ. 2561 หรือปกปิดการฝ่าฝืน = ดำเนินการทางวินัยและประเมินเจตคติเป็น U (ลงทะเบียนเรียนใหม่)",
      wrongHints: [
        "ข้อนี้เป็นแนวปฏิบัติที่ถูกต้อง (Do) เพื่อความปลอดภัยตลอดการฝึกภาคสนาม",
        "",
        "ข้อนี้เป็นแนวปฏิบัติการแต่งกายที่ถูกต้อง (Do)",
        "ข้อนี้เป็นแนวปฏิบัติการคุ้มครองสิทธิผู้ป่วยที่ถูกต้อง (Do)"
      ]
    },
    {
      id: "q7_exam_opennote",
      quick5: false,
      badge: "DO'S & DON'TS · ระเบียบห้องสอบ & โน้ต A4",
      impactTag: "สาย > 15 นาทีหมดสิทธิ์สอบ · A4 เขียนลายมือตนเองเท่านั้น",
      durationSec: 20,
      stem: "ข้อใดปฏิบัติ “ถูกต้อง (Do)” ในการเข้าสอบทฤษฎีระบาดวิทยา (8 ธ.ค.) และการสอบระบบสุขภาพ (22 ธ.ค. แบบ Open Note)?",
      choices: [
        "เข้าห้องสอบสายได้ไม่เกิน 30 นาที และสวม Smart Watch เข้าห้องสอบได้หากปิดเสียง",
        "สอบระบบสุขภาพนำกระดาษ A4 ที่พิมพ์สรุปจาก iPad หรือถ่ายเอกสารลายมือเพื่อนเข้าห้องสอบได้ 1 แผ่น",
        "เข้าห้องสอบไม่สายเกิน 15 นาที งดกระเป๋า/มือถือ/Smart Watch/เครื่องคิดเลข และสอบระบบสุขภาพนำ A4 เขียนลายมือตนเอง (หน้า-หลัง) เข้าได้ 1 แผ่น",
        "สอบระบาดวิทยาอนุญาตให้นำเครื่องคิดเลขวิทยาศาสตร์ส่วนตัวเข้าห้องสอบได้"
      ],
      correctIdx: 2,
      sourceRef: "คู่มือรายวิชา 2569 หัวข้อที่ 9 ระเบียบการสอบภาคทฤษฎี (หน้า 11–12)",
      doSummary: "แต่งชุด นศพ. ติดป้ายชื่อ เข้าห้องสอบก่อนเวลา (สายเกิน 15 นาทีไม่อนุญาตให้เข้าสอบ) และเขียนสรุป A4 ด้วยลายมือตนเอง",
      dontSummary: "ห้ามนำกระเป๋า มือถือ Smart Watch เครื่องคิดเลข เอกสารพิมพ์/สำเนา และอาหารเครื่องดื่มเข้าห้องสอบเด็ดขาด",
      osmuRule: "ทุจริตหรือนำอุปกรณ์ต้องห้ามเข้าห้องสอบ = U ทันที · สอบต่ำกว่า 2.00 ต้องสอบซ่อมแยกหมวด",
      wrongHints: [
        "สายเกิน 15 นาทีหมดสิทธิ์เข้าสอบ และห้ามสวม Smart Watch ทุกชนิดเข้าห้องสอบ!",
        "กระดาษ A4 1 แผ่นในวิชาสอบระบบสุขภาพต้องเขียนสดด้วยลายมือตนเองเท่านั้น ห้ามพิมพ์หรือถ่ายสำเนา!",
        "",
        "ไม่อนุญาตให้นำเครื่องคิดเลขและอุปกรณ์อิเล็กทรอนิกส์ทุกชนิดเข้าห้องสอบ"
      ]
    },
    {
      id: "q8_ai_pdpa_3a4a",
      quick5: false,
      badge: "DO'S & DON'TS · AI, PDPA & นำเสนอ 3A/4A",
      impactTag: "SRN 1–2 = No AI · งด VDO ล่วงหน้า · ห้ามข้อมูลชาวบ้านเข้า AI",
      durationSec: 22,
      stem: "ข้อใดปฏิบัติ “ถูกต้อง” ตามเกณฑ์การใช้ AI ม.มหิดล, กฎหมาย PDPA และการนำเสนอผลงานภาคสนาม (ฟอร์ม 3A / 4A)?",
      choices: [
        "ใช้ Generative AI เขียนบันทึกสะท้อนคิด SRN 1 และ SRN 2 แทนตนเองเพื่อส่งให้ทันเวลา",
        "อัปโหลดไฟล์ข้อมูลดิบที่มีชื่อ-นามสกุลผู้ป่วยในชุมชนเข้า AI สาธารณะเพื่อวิเคราะห์สถิติ",
        "อัดคลิปวิดีโอนำเสนอล่วงหน้ามาเปิดฉายในวันนำเสนอ 29–30 ธ.ค. เพื่อคุมเวลาให้เป๊ะ",
        "เขียน SRN 1–2 ด้วยตนเอง (No AI) · งานกลุ่ม 3A/4A ใช้ AI ช่วยได้โดยต้อง Declare Prompt ห้ามใส่ข้อมูลระบุตัวบุคคล และต้องนำเสนอสดตรงเวลา"
      ],
      correctIdx: 3,
      sourceRef: "มม.4 ปี 2569 (AI Scale Assessment) & คู่มือรายวิชา หัวข้อ 15–17",
      doSummary: "เขียน SRN 1–2 ด้วยตนเอง (ทำแบบประเมินออนไลน์ก่อนส่ง!) · นำเสนอ 3A (≤ 10 นาที) และ 4A (≤ 7 นาที) แบบสด และ Declare Prompt เมื่อใช้ AI",
      dontSummary: "ห้ามใช้ AI เขียน SRN ห้ามนำข้อมูลระบุตัวบุคคลเข้า AI สาธารณะ และห้ามใช้วิดีโออัดล่วงหน้าในการนำเสนอ",
      osmuRule: "ละเมิด PDPA/ลอกหรือปลอมงาน = U · ไม่รักษาเวลาหรือไม่หยุดเมื่อเตือนใน 3A/4A เสี่ยงติดหมวด U!",
      wrongHints: [
        "SRN 1–2 กำหนดเป็น No AI เด็ดขาด เพื่อประเมินการสะท้อนคิดจริงของนักศึกษา",
        "ห้ามนำข้อมูลระบุตัวบุคคลของชาวบ้านเข้า AI สาธารณะโดยเด็ดขาด (ผิด PDPA และจริยธรรมวิจัย)",
        "คู่มือรายวิชา หัวข้อ 16–17 ไม่อนุญาตให้ใช้วิดีโอถ่ายบันทึกล่วงหน้ามาเปิดนำเสนอ!",
        ""
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

  const state = {
    role: ROLE,
    participantId: savedPid,
    memberType: safeGet("racm303_orient_mtype_v1", ROLE === "faculty" ? "faculty" : "student"), // "student" | "faculty"
    joined: safeGet("racm303_orient_joined_v1", "0") === "1",
    studentId: safeGet("racm303_orient_sid_v1", ""),
    shortNo: safeGet("racm303_orient_sno_v1", ""),
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

    presetMode: "quick5", // Default to crisp 5-question core O/S/M/U & Conduct 2567 check! ("quick5" | "all8")
    customDurationSec: 20,
    customQuestions: loadCustomQuestions(),

    session: {
      seq: 0,
      sessionId: safeGet("racm303_orient_sess_id_v1", "orient_2569"),
      phase: "lobby", // "lobby" | "question" | "reveal" | "podium"
      activeDeckIds: BASE_QUESTIONS.filter((q) => q.quick5).map((q) => q.id),
      qPos: 0,
      currentQuestion: null,
      durationSec: 20,
      baseRemainingMs: 20000,
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
    const parenNick = raw.match(/\(([^)]+)\)/);
    return (
      list.find((s) => String(s.id) === q) ||
      list.find((s) => String(s.id).slice(-3) === q) ||
      (id3 && list.find((s) => String(s.id).slice(-3) === id3[1])) ||
      (parenNick && list.find((s) => String(s.nickname || "").toLowerCase() === parenNick[1].trim().toLowerCase())) ||
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
        return sid.includes(q) || sno === q || nick.includes(q) || name.includes(q) || area.includes(q);
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

  /* ---------- 4. Subtle Web Audio Game Sounds ---------- */
  function playTone(freqs, durSec, typeOpt, volOpt) {
    if (state.soundMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const vol = volOpt || 0.09;
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = typeOpt || "triangle";
        osc.frequency.value = f;
        const t0 = ctx.currentTime + idx * (durSec * 0.68);
        gain.gain.setValueAtTime(0.0008, t0);
        gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + durSec + 0.02);
      });
      setTimeout(() => {
        if (ctx && typeof ctx.close === "function") ctx.close().catch(() => {});
      }, 1200);
    } catch (_) {}
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
      if (isRetained && msg.sentWallMs && Date.now() - Number(msg.sentWallMs) > STALE_SESSION_MS) {
        return;
      }
      const incomingSeq = Number(msg.seq) || 0;
      if (incomingSeq < state.session.seq && (msg.sentWallMs || 0) < (state.session.updatedWallMs || 0)) {
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
      state.session.currentQuestion = msg.currentQuestion || null;
      state.session.durationSec = Math.max(5, Number(msg.durationSec) || 20);
      state.session.baseRemainingMs = rem;
      state.session.anchorPerfNow = performance.now();
      state.session.timerRunning = Boolean(msg.timerRunning) && rem > 0;
      if (msg.hostSlideIdx !== undefined) state.session.hostSlideIdx = Number(msg.hostSlideIdx) || 0;
      if (msg.hostSlideNum) state.session.hostSlideNum = String(msg.hostSlideNum);
      if (msg.hostSlideTitle) state.session.hostSlideTitle = String(msg.hostSlideTitle);
      state.session.updatedWallMs = Number(msg.sentWallMs) || Date.now();

      // Synced Slide Follow: if participant has Deck open with Follow Live Slide enabled, follow presenter!
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
        // Auto-open answer pad for any joined participant (both student and faculty participants!) unless this screen is presenting the Deck!
        const deckModal = document.getElementById("orientationDeckModal");
        const isPresentingBigScreen =
          state.role === "faculty" && deckModal && !deckModal.hidden && window.innerWidth >= 1024;
        if (state.joined && !isPresentingBigScreen) {
          state.participantModalOpen = true;
          state.mobileTab = "pad";
        }
        playTone([523.25, 659.25, 783.99], 0.13, "triangle", 0.08);
      } else if (state.session.phase === "reveal" && prevPhase === "question") {
        playTone([587.33, 783.99, 1046.5], 0.16, "sine", 0.1);
      }

      renderAllSurfaces(true);
      updateFloatingBanner();
      return;
    }

    if (msg.type === "remote_cmd" && !isRetained) {
      if (state.role === "faculty" && window.RACM_ORIENTATION_DECK) {
        const cmd = String(msg.cmd || "");
        if (cmd === "slide-next") {
          window.RACM_ORIENTATION_DECK.stepSlide(1);
        } else if (cmd === "slide-prev") {
          window.RACM_ORIENTATION_DECK.stepSlide(-1);
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
      if (!qMap.has(pid)) {
        qMap.set(pid, {
          participantId: pid,
          memberType: msg.memberType === "faculty" ? "faculty" : "student",
          qId,
          choiceIdx: Math.max(0, Math.min(3, Number(msg.choiceIdx) || 0)),
          correct: Boolean(msg.correct),
          points: Math.max(0, Math.min(1500, Number(msg.points) || 0)),
          elapsedMs: Math.max(0, Number(msg.elapsedMs) || 0),
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

      if (
        state.role === "faculty" &&
        state.session.phase === "question" &&
        state.session.timerRunning &&
        state.session.currentQuestion &&
        state.session.currentQuestion.id === qId &&
        state.participants.size > 0 &&
        qMap.size >= state.participants.size
      ) {
        setTimeout(() => {
          if (state.session.phase === "question" && state.session.currentQuestion && state.session.currentQuestion.id === qId) {
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
            publishPacket(`answer/${mine.qId}/${state.participantId}`, Object.assign({ type: "answer", sessionId: state.session.sessionId }, mine), false);
          }
        });
      }
      if (state.role === "faculty" && state.session.seq > 0) {
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

  /* ---------- 6. Presence, Breakdown & Leaderboard ---------- */
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
        maxStreak: 0
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
            maxStreak: 0
          });
        }
        const entry = board.get(pid);
        entry.answeredCount += 1;
        if (ans.correct) {
          entry.correctCount += 1;
          entry.streak += 1;
          if (entry.streak > entry.maxStreak) entry.maxStreak = entry.streak;
          const streakBonus = entry.streak >= 3 ? 100 : entry.streak === 2 ? 50 : 0;
          entry.score += (ans.points || 500) + streakBonus;
        } else {
          entry.streak = 0;
        }
      });
    });

    const list = Array.from(board.values());
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.label.localeCompare(b.label, "th");
    });
    return list;
  }

  function getQuestionStats(q) {
    const counts = [0, 0, 0, 0];
    if (!q) return { counts, total: 0, correctCount: 0, pctCorrect: 0, topWrongIdx: -1, topWrongCount: 0 };
    const qMap = state.answersByQ.get(q.id);
    if (qMap) {
      qMap.forEach((ans) => {
        const c = Math.max(0, Math.min(3, Number(ans.choiceIdx) || 0));
        counts[c] += 1;
      });
    }
    const total = counts[0] + counts[1] + counts[2] + counts[3];
    const correctCount = counts[q.correctIdx] || 0;
    const pctCorrect = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    let topWrongIdx = -1;
    let topWrongCount = 0;
    for (let i = 0; i < 4; i += 1) {
      if (i !== q.correctIdx && counts[i] > topWrongCount) {
        topWrongCount = counts[i];
        topWrongIdx = i;
      }
    }
    return { counts, total, correctCount, pctCorrect, topWrongIdx, topWrongCount };
  }

  /* ---------- 7. Host & Remote Controls ---------- */
  function buildSessionPacket() {
    return {
      type: "session",
      msgId: randomId("sess"),
      seq: state.session.seq,
      sessionId: state.session.sessionId,
      phase: state.session.phase,
      activeDeckIds: state.session.activeDeckIds,
      qPos: state.session.qPos,
      currentQuestion: state.session.currentQuestion,
      durationSec: state.session.durationSec,
      remainingMs: getRemainingMs(),
      timerRunning: state.session.timerRunning,
      hostSlideIdx: state.session.hostSlideIdx,
      hostSlideNum: state.session.hostSlideNum,
      hostSlideTitle: state.session.hostSlideTitle
    };
  }

  function broadcastSessionState() {
    state.session.seq += 1;
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
    const dur = Number(state.customDurationSec) || q.durationSec || 20;
    state.session.qPos = safePos;
    state.session.currentQuestion = q;
    state.session.phase = "question";
    state.session.durationSec = dur;
    state.session.baseRemainingMs = dur * 1000;
    state.session.anchorPerfNow = performance.now();
    state.session.timerRunning = true;
    state.questionPickerOpen = false;
    playTone([440, 554.37, 659.25], 0.12, "triangle", 0.08);
    broadcastSessionState();
    renderAllSurfaces(true);
  }

  function hostRevealAnswer() {
    state.session.phase = "reveal";
    state.session.baseRemainingMs = 0;
    state.session.timerRunning = false;
    playTone([587.33, 783.99, 1046.5], 0.16, "sine", 0.1);
    broadcastSessionState();
    renderAllSurfaces(true);
  }

  function hostNextStep() {
    const deck = getActiveQuestionList();
    if (state.session.qPos + 1 < deck.length) {
      hostStartQuestionAt(state.session.qPos + 1);
    } else {
      state.session.phase = "podium";
      state.session.timerRunning = false;
      playTone([523.25, 659.25, 783.99, 1046.5], 0.18, "triangle", 0.11);
      broadcastSessionState();
      renderAllSurfaces(true);
    }
  }

  function hostResetSession() {
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
      else if (cmd === "goto-slide" && extra && typeof extra.slideIdx === "number") {
        window.RACM_ORIENTATION_DECK.goToSlide(extra.slideIdx);
      }
    }
    if (state.role === "faculty") {
      if (cmd === "start-q0") hostStartQuestionAt(0);
      else if (cmd === "reveal-now") hostRevealAnswer();
      else if (cmd === "next-question") hostNextStep();
    }
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
    const durMs = Math.max(1000, (state.session.durationSec || 20) * 1000);
    const elapsedMs = Math.max(0, durMs - remMs);
    const isCorrect = Number(choiceIdx) === Number(q.correctIdx);
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
    publishPacket(`answer/${q.id}/${state.participantId}`, Object.assign({ type: "answer", sessionId: state.session.sessionId }, rec), false);
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
        if (secLeft > 0 && secLeft <= 5) {
          playTone([secLeft === 1 ? 880 : 660], 0.07, "sine", 0.05);
        }
      }
      updateTimerDomInPlace(rem);
      if (rem <= 0) {
        state.session.timerRunning = false;
        state.session.baseRemainingMs = 0;
        if (state.role === "faculty") {
          hostRevealAnswer();
        } else {
          renderParticipantModal();
        }
      }
    }
  }, 200);

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
          <div class="orl-eo-subhint">📲 สแกน QR Code ด้านซ้ายเพื่อเข้าร่วมเพิ่มเติม — รายชื่อผู้เข้าร่วมและกลุ่มพื้นที่ฝึกจะแสดงสดที่นี่อัตโนมัติ</div>
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

  /* ---------- 11. UI Surface 2: Full / Embedded Kahoot Stage (Lobby, Question, Reveal, Podium) ---------- */
  function renderLobbyStageHtml(isEmbeddedSlide) {
    const joinUrl = getJoinUrl();
    const qrSvg = buildQrSvg(joinUrl, "is-stage-qr");
    const brk = getParticipantRoleBreakdown();
    const areaCounts = getAreaCounts();
    const areasOrder = ["คณาจารย์", "กุฉินารายณ์", "ด่านซ้าย", "ตะกั่วป่า", "ท่าวังผา", "เพชรบูรณ์ 1", "เพชรบูรณ์ 2", "อุบลรัตน์", "ท่าสองยาง", "อุ้มผาง"];
    const deck = getActiveQuestionList();

    return `
      <div class="orl-stage is-lobby-stage${isEmbeddedSlide ? " is-embedded-slide-stage" : ""}">
        <div class="orl-stage-topbar">
          <div class="orl-st-left">
            <span class="orl-live-pill is-lg"><span class="orl-dot is-online"></span> ${isEmbeddedSlide ? "LIVE QUIZ · PRE-CHECK O / S / M / U" : "LIVE WAITING LOBBY · อาจารย์ & นศพ."}</span>
            <span class="orl-st-sub">สแกน QR ร่วมกันได้ทุกอุปกรณ์ (มือถือแนวตั้ง/แนวนอน · จอพับ Duo · แท็บเล็ต)</span>
          </div>
          <div class="orl-st-right">
            <button type="button" class="orl-bar-btn" data-orl-action="zoom-qr">🔍 ขยาย QR</button>
            <button type="button" class="orl-bar-btn" data-orl-action="toggle-mute">${state.soundMuted ? "🔇 ปิดเสียง" : "🔊 เสียง On"}</button>
            <button type="button" class="orl-bar-btn" data-orl-action="open-participant-pad">📱 จอผู้เข้าร่วม</button>
            ${ROLE === "faculty" ? `<button type="button" class="orl-bar-btn" data-orl-action="open-custom-modal">+ คำถามสด</button>` : ""}
          </div>
        </div>

        <div class="orl-lobby-grid">
          <div class="orl-lobby-qr-panel">
            <button type="button" class="orl-stage-qr-box" data-orl-action="zoom-qr" title="แตะเพื่อขยาย QR Code เต็มจอ">
              ${qrSvg}
            </button>
            <div class="orl-stage-join-steps">
              <div class="orl-step-badge">1. อาจารย์และนักศึกษาสแกน QR Code พร้อมกัน</div>
              <div class="orl-url-pill">${state.qrUrlMode === "faculty" ? "smartwoo.github.io/racm303-2569-faculty-member/#live" : "smartwoo.github.io/racm303-2569-student/#live"}</div>
              <div class="orl-step-badge">2. เลือก <code>นศพ. (รหัส 3 ตัวท้าย)</code> หรือ <code>คณาจารย์</code></div>
            </div>

            ${
              ROLE === "faculty"
                ? `
              <div class="orl-host-config-box">
                <div class="orl-cfg-row">
                  <span class="orl-cfg-lbl">ชุดคำถาม:</span>
                  <div class="orl-seg-group">
                    <button type="button" class="orl-seg-btn${state.presetMode === "quick5" ? " is-active" : ""}" data-orl-preset="quick5">เน้นเกณฑ์ O·S·M·U (5 ข้อ)</button>
                    <button type="button" class="orl-seg-btn${state.presetMode === "all8" ? " is-active" : ""}" data-orl-preset="all8">ครบทุกหมวด (${getAllQuestions().length} ข้อ)</button>
                  </div>
                </div>
                <div class="orl-cfg-row">
                  <span class="orl-cfg-lbl">เวลาต่อข้อ:</span>
                  <div class="orl-seg-group">
                    ${[15, 20, 30]
                      .map(
                        (sec) =>
                          `<button type="button" class="orl-seg-btn${state.customDurationSec === sec ? " is-active" : ""}" data-orl-dur="${sec}">${sec} วิ</button>`
                      )
                      .join("")}
                  </div>
                </div>
              </div>
            `
                : ""
            }
          </div>

          <div class="orl-lobby-players-panel">
            <div class="orl-players-head">
              <div class="orl-players-counter">
                <span class="orl-players-num" data-orl-participant-count>${brk.total}</span>
                <div>
                  <div class="orl-players-title">ผู้เข้าร่วมในห้องสด (<span data-orl-role-breakdown>🎓 นศพ. ${brk.stu}/169 · 👨‍⚕️ อาจารย์ ${brk.fac} ท่าน</span>)</div>
                  <div class="orl-players-sub">ทวนสอบเวลาเรียน ≥ 80% · ประกาศเจตคติ พ.ศ. 2567 · เกณฑ์ O / S / M / U (${deck.length} ข้อ)</div>
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
                isEmbeddedSlide
                  ? `
                <button type="button" class="orl-big-btn is-secondary" data-orl-action="goto-criteria-slide">
                  📘 ข้ามไปดูสไลด์ชี้แจงเกณฑ์ O / S / M / U ทันที &rarr;
                  <small>อธิบายเวลาเรียน ≥ 80%, ประกาศเจตคติ 2567, การสอบซ่อม และเกียรตินิยม</small>
                </button>
              `
                  : `
                <button type="button" class="orl-big-btn is-secondary" data-orl-action="continue-slides">
                  ▶ ไปต่อเนื้อหาสไลด์ Orientation &rarr;
                  <small>ผู้ที่สแกนแล้วดูสไลด์ซิงค์สดและรอรับคำถามบนมือถือได้ต่อเนื่อง</small>
                </button>
              `
              }
              ${
                ROLE === "faculty"
                  ? `
                <button type="button" class="orl-big-btn is-primary" data-orl-action="start-q0">
                  ⚡ เริ่มยิงคำถาม Quiz O / S / M / U ข้อที่ 1 (${deck.length} ข้อ)
                  <small>ส่งคำถามขึ้นจอมือถือของทั้งนักศึกษาและคณาจารย์พร้อมกันทันที</small>
                </button>
              `
                  : `
                <button type="button" class="orl-big-btn is-primary" data-orl-action="open-participant-pad">
                  🙋 เปิดแป้นกดตอบคำถามบนอุปกรณ์นี้
                  <small>${state.joined ? `เชื่อมต่อในชื่อ ${esc(getPlayerLabel(state))} แล้ว` : "แตะเพื่อลงชื่อเข้าร่วมตอบคำถามสด"}</small>
                </button>
              `
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderQuestionStageHtml(isEmbeddedSlide) {
    const q = getCurrentQuestion();
    const deck = getActiveQuestionList();
    const stats = getQuestionStats(q);
    const remMs = getRemainingMs();
    const sec = Math.ceil(remMs / 1000);
    const durMs = Math.max(1000, (state.session.durationSec || 20) * 1000);
    const pct = Math.max(0, Math.min(100, (remMs / durMs) * 100));

    return `
      <div class="orl-stage is-question-stage${isEmbeddedSlide ? " is-embedded-slide-stage" : ""}">
        <div class="orl-q-topbar">
          <div class="orl-q-meta">
            <span class="orl-q-num-pill">ข้อ ${state.session.qPos + 1} / ${deck.length}</span>
            <span class="orl-q-cat-pill">${esc(q.badge)}</span>
            <span class="orl-q-impact-pill">${esc(q.impactTag)}</span>
          </div>
          <div class="orl-q-stats-right">
            <div class="orl-ans-counter-box">
              <strong data-orl-answered-count>${stats.total}</strong>
              <span>/ <span data-orl-participant-count>${state.participants.size}</span> ตอบแล้ว</span>
            </div>
            <div class="orl-timer-badge${sec <= 5 ? " is-urgent" : ""}" data-orl-timer-sec>${sec}s</div>
            ${
              ROLE === "faculty"
                ? `<button type="button" class="orl-bar-btn is-accent" data-orl-action="reveal-now">⏭️ ปิดรับ &amp; เฉลยทันที</button>`
                : `<button type="button" class="orl-bar-btn is-accent" data-orl-action="open-participant-pad">📱 เปิดแป้นกดตอบ</button>`
            }
          </div>
        </div>

        <div class="orl-timer-progress-track">
          <div class="orl-timer-progress-fill" data-orl-timer-bar style="width:${pct.toFixed(1)}%"></div>
        </div>

        <div class="orl-q-stem-card">
          <h2 class="orl-q-stem-title">${esc(q.stem)}</h2>
        </div>

        <div class="orl-choices-grid">
          ${q.choices
            .map((txt, idx) => {
              const meta = CHOICE_META[idx];
              return `
                <div class="orl-choice-tile ${meta.cls}">
                  <span class="orl-choice-shape">${meta.shape}</span>
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

    let recheckInsightHtml = "";
    if (stats.total === 0) {
      recheckInsightHtml = `<div class="orl-insight-banner is-neutral">ℹ️ ยังไม่มีคำตอบส่งเข้ามาในข้อนี้ — อภิปรายหลักเกณฑ์ที่ถูกต้องด้านล่างร่วมกันได้ทันที</div>`;
    } else if (stats.topWrongCount === 0) {
      recheckInsightHtml = `<div class="orl-insight-banner is-perfect">🎯 <strong>ยอดเยี่ยม! ผู้ตอบทั้ง ${stats.total} คน (100%) ตอบถูกต้องครบทุกคน</strong> — เข้าใจเกณฑ์ข้อนี้ตรงกันอย่างแม่นยำ</div>`;
    } else {
      const wrongMeta = CHOICE_META[stats.topWrongIdx];
      const hintText = (q.wrongHints && q.wrongHints[stats.topWrongIdx]) || "ตรวจสอบรายละเอียดเกณฑ์ที่ถูกต้องตามคู่มือรายวิชาด้านล่าง";
      recheckInsightHtml = `
        <div class="orl-insight-banner is-recheck">
          <div>
            <strong>🔍 Recheck จุดที่ยังสับสน (${stats.pctCorrect}% ตอบถูก · เลือก ${wrongMeta.nameTh} ${stats.topWrongCount} คน):</strong>
            <span>${esc(hintText)}</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="orl-stage is-reveal-stage${isEmbeddedSlide ? " is-embedded-slide-stage" : ""}">
        <div class="orl-q-topbar">
          <div class="orl-q-meta">
            <span class="orl-q-num-pill">เฉลยข้อ ${state.session.qPos + 1} / ${deck.length}</span>
            <span class="orl-q-cat-pill">${esc(q.badge)}</span>
            <span class="orl-source-cite">📘 ${esc(q.sourceRef)}</span>
          </div>
          <div class="orl-q-stats-right">
            ${
              ROLE === "faculty"
                ? `
              <div class="orl-picker-wrap">
                <button type="button" class="orl-bar-btn" data-orl-action="toggle-q-picker">🔢 เลือกข้อ ▾</button>
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
              <button type="button" class="orl-bar-btn" data-orl-action="goto-criteria-slide">📘 ไปสไลด์ชี้แจงเกณฑ์ O/S/M/U</button>
              <button type="button" class="orl-bar-btn is-primary-next" data-orl-action="next-question">
                ${state.session.qPos + 1 < deck.length ? `ข้อถัดไป (${state.session.qPos + 2}/${deck.length}) →` : "🏆 ดูสรุปผล & Podium →"}
              </button>
            `
                : `<span class="orl-q-cat-pill">ตอบถูก ${stats.correctCount}/${stats.total} (${stats.pctCorrect}%)</span>`
            }
          </div>
        </div>

        <h3 class="orl-reveal-stem">${esc(q.stem)}</h3>

        <div class="orl-reveal-bars-grid">
          ${q.choices
            .map((txt, idx) => {
              const meta = CHOICE_META[idx];
              const cnt = stats.counts[idx];
              const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0;
              const barH = stats.total > 0 ? Math.max(12, Math.round((cnt / maxCount) * 100)) : 12;
              const isCorrect = idx === q.correctIdx;
              return `
                <div class="orl-rev-card ${meta.cls}${isCorrect ? " is-correct" : " is-dimmed"}">
                  <div class="orl-rev-bar-row">
                    <span class="orl-rev-shape">${meta.shape}</span>
                    <div class="orl-rev-bar-track">
                      <div class="orl-rev-bar-fill" style="width:${barH}%"></div>
                    </div>
                    <span class="orl-rev-count">${cnt} คน (${pct}%)</span>
                    ${isCorrect ? `<span class="orl-rev-correct-badge">✓ ถูกต้อง</span>` : ""}
                  </div>
                  <div class="orl-rev-choice-txt">${esc(txt)}</div>
                </div>
              `;
            })
            .join("")}
        </div>

        ${recheckInsightHtml}

        <div class="orl-recheck-3col">
          <div class="orl-rc-box is-do">
            <span class="orl-rc-kicker">✅ DO · แนวปฏิบัติที่ถูกต้อง</span>
            <p>${esc(q.doSummary)}</p>
          </div>
          <div class="orl-rc-box is-dont">
            <span class="orl-rc-kicker">🚫 DON'T · ข้อพึงระวัง / ห้ามทำ</span>
            <p>${esc(q.dontSummary)}</p>
          </div>
          <div class="orl-rc-box is-osmu">
            <span class="orl-rc-kicker">⚖️ ผลต่อเกรด O · S · M · U</span>
            <p>${esc(q.osmuRule)}</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderPodiumStageHtml(isEmbeddedSlide) {
    const deck = getActiveQuestionList();
    const board = computeLeaderboard();
    const top3 = [board[0], board[1], board[2]];

    return `
      <div class="orl-stage is-podium-stage${isEmbeddedSlide ? " is-embedded-slide-stage" : ""}">
        <div class="orl-stage-topbar">
          <div class="orl-st-left">
            <span class="orl-live-pill is-lg"><span class="orl-dot is-online"></span> สรุปผล Quiz O / S / M / U — พร้อมไปสไลด์ชี้แจงเกณฑ์ฉบับเต็ม</span>
          </div>
          <div class="orl-st-right">
            ${
              ROLE === "faculty"
                ? `
              <button type="button" class="orl-bar-btn" data-orl-action="back-to-lobby">📺 หน้า Lobby</button>
              <button type="button" class="orl-bar-btn" data-orl-action="reset-session">🔄 รีเซ็ต</button>
            `
                : ""
            }
            <button type="button" class="orl-bar-btn is-primary-next" data-orl-action="goto-criteria-slide">📘 ไปสไลด์ถัดไป: ชี้แจงเกณฑ์ O / S / M / U &rarr;</button>
          </div>
        </div>

        <div class="orl-podium-split">
          <div class="orl-diagnostic-panel">
            <h3 class="orl-panel-h3">📊 ความแม่นยำรายหัวข้อ (Class Rule Mastery)</h3>
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
                        <span class="orl-diag-pct">${st.total > 0 ? `${st.pctCorrect}% (${st.correctCount}/${st.total})` : "ยังไม่ถาม"}</span>
                        ${ROLE === "faculty" ? `<button type="button" class="orl-reask-btn" data-orl-jump-q="${idx}">ถามซ้ำ</button>` : ""}
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>

          <div class="orl-leaderboard-panel">
            <h3 class="orl-panel-h3">🏆 Kahoot Recheck Podium (ผู้ตอบแม่นยำและไวที่สุด)</h3>
            ${
              board.length === 0
                ? `<p class="orl-empty-wait">ยังไม่มีคะแนนผู้เข้าร่วมในรอบนี้</p>`
                : `
              <div class="orl-podium-top3">
                ${[1, 0, 2]
                  .map((rankIdx) => {
                    const p = top3[rankIdx];
                    if (!p) return `<div class="orl-podium-col is-empty"></div>`;
                    const medal = rankIdx === 0 ? "🥇 อันดับ 1" : rankIdx === 1 ? "🥈 อันดับ 2" : "🥉 อันดับ 3";
                    return `
                      <div class="orl-podium-col is-rank-${rankIdx + 1}">
                        <span class="orl-pod-ava">${esc(p.avatar)}</span>
                        <strong class="orl-pod-name">${esc(p.label)}</strong>
                        <span class="orl-pod-area">${esc(p.area || "RACM 303")}</span>
                        <div class="orl-pod-pedestal">
                          <span class="orl-pod-medal">${medal}</span>
                          <span class="orl-pod-pts">${p.score.toLocaleString()} pts</span>
                          <small>ถูก ${p.correctCount}/${deck.length} ข้อ</small>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>

              <div class="orl-runners-list">
                ${board
                  .slice(3, 9)
                  .map(
                    (p, idx) => `
                  <div class="orl-runner-row">
                    <span><strong>#${idx + 4}</strong> ${esc(p.avatar)} ${esc(p.label)} ${p.area ? `<em>(${esc(p.area)})</em>` : ""}</span>
                    <strong>${p.score.toLocaleString()} pts · ${p.correctCount}/${deck.length}</strong>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
            }
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
    return renderLobbyStageHtml(isEmbeddedSlide);
  }

  function renderEmbeddedQuizSlideHtml(opts) {
    const o = opts || {};
    if (o.viewMode === "handout") {
      return `
        <div class="or-grid-2">
          ${BASE_QUESTIONS.slice(0, 4)
            .map(
              (q, i) => `
            <div class="or-card is-white">
              <span class="or-card-kicker">QUIZ ${i + 1} · ${esc(q.badge)}</span>
              <p class="or-card-text"><strong>คำถาม:</strong> ${esc(q.stem)}<br><strong>หลักเกณฑ์สำคัญ:</strong> ${esc(q.osmuRule)}</p>
            </div>
          `
            )
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
      } else if (act === "pick-avatar") {
        state.avatar = actBtn.getAttribute("data-ava") || "🩺";
        safeSet("racm303_orient_avatar_v1", state.avatar);
        renderParticipantModal();
      } else if (act === "pick-roster") {
        const sid = actBtn.getAttribute("data-sid");
        const stu = findRosterStudent(sid);
        if (stu) {
          applyRosterToLocalState(stu, false);
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
          const inp = document.getElementById("orlStuLookupInput");
          const rawVal = inp ? inp.value.trim() : "";
          if (rawVal) {
            const matched = findRosterStudent(rawVal);
            if (matched) {
              applyRosterToLocalState(matched, true);
            } else {
              state.nickname = rawVal.slice(0, 28);
              safeSet("racm303_orient_nick_v1", state.nickname);
              state.joined = true;
              safeSet("racm303_orient_joined_v1", "1");
            }
          } else if (state.studentId || state.nickname) {
            state.joined = true;
            safeSet("racm303_orient_joined_v1", "1");
          } else {
            if (inp) inp.focus();
            return;
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
        const sugBox = document.getElementById("orlRosterSuggestBox");
        if (!sugBox) return;
        const matches = searchRosterCandidates(ev.target.value);
        sugBox.innerHTML = matches
          .map(
            (s) => `
            <button type="button" class="orl-sug-item" data-orl-mact="pick-roster" data-sid="${esc(s.id)}">
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
    const myEntry = myRankIdx >= 0 ? board[myRankIdx] : { score: 0, correctCount: 0 };
    const canRemote = ROLE === "faculty" || state.memberType === "faculty";

    let bodyHtml = "";
    if (canRemote && state.joined && state.mobileTab === "remote") {
      bodyHtml = `
        <div class="orl-m-card">
          <div class="orl-m-badge">🎛️ PRESENTER REMOTE · ควบคุมสไลด์และคำถามสด</div>
          <div class="orl-m-slide-tracker" style="text-align:center">
            สไลด์ปัจจุบัน: <strong>Slide ${esc(state.session.hostSlideNum || "01")}</strong> · ${esc(state.session.hostSlideTitle || "Orientation")}
          </div>
          <div class="orl-m-foot-btns">
            <button type="button" class="orl-m-sec-btn" data-orl-mact="rcmd" data-rcmd="slide-prev">◀ สไลด์ก่อนหน้า</button>
            <button type="button" class="orl-m-sec-btn" data-orl-mact="rcmd" data-rcmd="slide-next">สไลด์ถัดไป ▶</button>
          </div>
          <div class="orl-m-foot-btns">
            <button type="button" class="orl-m-sec-btn" data-orl-mact="rcmd" data-rcmd="goto-slide" data-sidx="14">🎮 ไป Slide 15 (Quiz)</button>
            <button type="button" class="orl-m-sec-btn" data-orl-mact="rcmd" data-rcmd="goto-slide" data-sidx="15">⚖️ ไป Slide 16 (เกณฑ์ O/S/M/U)</button>
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
      const cleanPrefillNick = sanitizeStudentNickname(state.nickname, state.studentId, state.shortNo);
      const prefill = !isFacPick && state.studentId
        ? `${state.studentId}${cleanPrefillNick ? ` (${cleanPrefillNick})` : ""}`
        : cleanPrefillNick || state.nickname || "";
      const initialMatches = searchRosterCandidates(state.studentId || "");

      bodyHtml = `
        <div class="orl-m-card">
          <div class="orl-m-head-compact">
            <div class="orl-m-badge">🎮 RACM 303 · SCAN-TO-JOIN LIVE</div>
            <h2 class="orl-m-title">เข้าร่วมปฐมนิเทศสดพร้อมกัน</h2>
            <p class="orl-m-desc">รองรับทั้งคณาจารย์และนักศึกษาแพทย์ — ดูสไลด์ซิงค์สด (Pinch-Zoom ได้) และกดตอบ Quiz เกณฑ์ O · S · M · U</p>
          </div>

          <div class="orl-role-tabs" role="tablist" aria-label="เลือกบทบาทผู้เข้าร่วม">
            <button type="button" class="orl-role-tab${!isFacPick ? " is-active" : ""}" data-orl-mact="switch-mtype" data-mtype="student">🎓 นักศึกษาแพทย์ (169)</button>
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
              <label class="orl-m-lbl" for="orlStuLookupInput">พิมพ์รหัสนักศึกษา 3 ตัวท้าย หรือชื่อเล่น</label>
              <input id="orlStuLookupInput" class="orl-m-input" type="search" inputmode="search" enterkeyhint="go" autocomplete="off" value="${esc(prefill)}" placeholder="เช่น 006, เดือนอ้าย, มิน, 6702xxx…">

              ${
                state.studentId && state.memberType === "student"
                  ? `<div class="orl-m-selected-stu">✅ เลือกแล้ว: <strong>${esc(state.shortNo)} ${esc(state.nickname)}</strong> · ${esc(state.fullName)} (${esc(state.area)})</div>`
                  : ""
              }

              <div class="orl-sug-list" id="orlRosterSuggestBox">
                ${initialMatches
                  .slice(0, 5)
                  .map(
                    (s) => `
                  <button type="button" class="orl-sug-item" data-orl-mact="pick-roster" data-sid="${esc(s.id)}">
                    <strong>${esc(String(s.id).slice(-3))} · ${esc(s.nickname || s.name)}</strong>
                    <span>${esc(s.fullName || s.name)} · กลุ่ม ${esc(s.area)}</span>
                  </button>
                `
                  )
                  .join("")}
              </div>

              <div class="orl-ava-section">
                <div class="orl-m-lbl">เลือกไอคอนประจำตัว</div>
                <div class="orl-ava-picker">
                  ${AVATARS.map(
                    (a) =>
                      `<button type="button" class="orl-ava-btn${state.avatar === a ? " is-picked" : ""}" data-orl-mact="pick-avatar" data-ava="${a}">${a}</button>`
                  ).join("")}
                </div>
              </div>

              <button type="button" class="orl-m-join-btn" data-orl-mact="join-now">🚀 เข้าร่วม Live Lobby ทันที</button>
            `
          }
        </div>
      `;
    } else if (state.session.phase === "question") {
      const q = getCurrentQuestion();
      const qMap = q && state.answersByQ.get(q.id);
      const myAns = qMap ? qMap.get(state.participantId) : null;
      const remSec = Math.ceil(getRemainingMs() / 1000);
      const pct = Math.max(0, Math.min(100, (getRemainingMs() / Math.max(1000, (state.session.durationSec || 20) * 1000)) * 100));

      if (myAns) {
        const pickedMeta = CHOICE_META[myAns.choiceIdx];
        bodyHtml = `
          <div class="orl-m-card is-centered">
            <div class="orl-m-locked-chip ${pickedMeta.cls}">${pickedMeta.shape} เลือก${pickedMeta.nameTh}แล้ว</div>
            <h2 class="orl-m-title">ส่งคำตอบสำเร็จ! ⏳</h2>
            <p class="orl-m-desc">รอลุ้นผลเฉลยและคำอธิบายเกณฑ์ O / S / M / U พร้อมกันทั้งห้อง…</p>
            <div class="orl-m-wait-pulse">เหลือเวลา <strong data-orl-timer-sec>${remSec}s</strong></div>
          </div>
        `;
      } else {
        bodyHtml = `
          <div class="orl-m-q-wrap">
            <div class="orl-m-q-head">
              <span class="orl-q-num-pill">ข้อ ${state.session.qPos + 1} / ${getActiveQuestionList().length}</span>
              <span class="orl-timer-badge${remSec <= 5 ? " is-urgent" : ""}" data-orl-timer-sec>${remSec}s</span>
            </div>
            <div class="orl-timer-progress-track">
              <div class="orl-timer-progress-fill" data-orl-timer-bar style="width:${pct.toFixed(1)}%"></div>
            </div>
            <div class="orl-m-q-stem">${esc(q.stem)}</div>
            <div class="orl-m-pad-grid">
              ${q.choices
                .map((txt, idx) => {
                  const meta = CHOICE_META[idx];
                  return `
                    <button type="button" class="orl-m-pad-btn ${meta.cls}" data-orl-mact="submit-choice" data-choice-idx="${idx}">
                      <span class="orl-m-pad-shape">${meta.shape}</span>
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
      const rightMeta = CHOICE_META[q.correctIdx];
      const gotRight = Boolean(myAns && myAns.correct);

      bodyHtml = `
        <div class="orl-m-card ${gotRight ? "is-res-correct" : "is-res-review"}">
          <div class="orl-m-verdict-banner ${gotRight ? "is-ok" : "is-miss"}">
            ${
              gotRight
                ? `🎉 ถูกต้อง! +${myAns.points} คะแนน`
                : myAns
                ? `💡 ทบทวนจุดสำคัญ! คำตอบที่ถูกคือ ${rightMeta.shape}`
                : `⏰ หมดเวลา · คำตอบที่ถูกคือ ${rightMeta.shape}`
            }
          </div>
          <div class="orl-m-correct-ans-box">
            <strong>✓ เฉลย:</strong> ${esc(q.choices[q.correctIdx])}
          </div>
          <div class="orl-m-recheck-notes">
            <div><strong>✅ DO:</strong> ${esc(q.doSummary)}</div>
            <div><strong>🚫 DON'T:</strong> ${esc(q.dontSummary)}</div>
            <div><strong>⚖️ เกณฑ์ O·S·M·U:</strong> ${esc(q.osmuRule)}</div>
          </div>
          <div class="orl-m-rank-strip">
            <span>คะแนนสะสม: <strong>${myEntry.score.toLocaleString()} pts</strong></span>
            <span>อันดับปัจจุบัน: <strong>#${myRankIdx >= 0 ? myRankIdx + 1 : "-"}</strong></span>
          </div>
        </div>
      `;
    } else if (state.session.phase === "podium") {
      const deck = getActiveQuestionList();
      const missedList = deck.filter((q) => {
        const qMap = state.answersByQ.get(q.id);
        const mine = qMap && qMap.get(state.participantId);
        return !mine || !mine.correct;
      });
      bodyHtml = `
        <div class="orl-m-card">
          <div class="orl-m-badge">🏆 สรุปผล Quiz O / S / M / U ของคุณ</div>
          <h2 class="orl-m-title">${esc(state.avatar)} ${esc(getPlayerLabel(state))}</h2>
          <div class="orl-m-rank-strip" style="margin:4px 0 8px">
            <span>คะแนนรวม: <strong>${myEntry.score.toLocaleString()} pts</strong></span>
            <span>ตอบถูก: <strong>${myEntry.correctCount}/${deck.length}</strong></span>
            <span>อันดับ: <strong>#${myRankIdx >= 0 ? myRankIdx + 1 : "-"}</strong></span>
          </div>
          ${
            missedList.length === 0
              ? `<div class="orl-m-selected-stu">🌟 ยอดเยี่ยม! คุณตอบถูกครบทุกข้อ แม่นยำทุกเกณฑ์ O / S / M / U</div>`
              : `
                <div class="orl-m-lbl">📌 สรุปเกณฑ์สำคัญที่ควรจดจำ:</div>
                <div class="orl-m-recheck-notes">
                  ${missedList.map((q) => `<div>• <strong>${esc(q.badge)}:</strong> ${esc(q.osmuRule)}</div>`).join("")}
                </div>
              `
          }
          <button type="button" class="orl-m-join-btn" data-orl-mact="view-synced-slides" style="margin-top:8px">📘 เปิดอ่านสไลด์ชี้แจงเกณฑ์ O/S/M/U (Pinch-Zoom ได้) &rarr;</button>
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="orl-m-card is-centered">
          <div class="orl-m-you-in">🎉 You're in! เข้าร่วมห้องสดสำเร็จ</div>
          <div class="orl-m-player-hero">
            <span class="orl-m-big-ava">${esc(state.avatar)}</span>
            <div>
              <div class="orl-m-pname">${esc(getPlayerLabel(state))}</div>
              <div class="orl-m-parea">${esc(state.memberType === "faculty" ? "คณาจารย์ประจำรายวิชา RACM 303" : state.area ? `กลุ่ม รพ.${state.area}` : "ผู้เข้าร่วม RACM 303")}</div>
            </div>
          </div>

          <div class="orl-m-wait-box">
            <div class="orl-m-spinner" aria-hidden="true"></div>
            <strong>รอรับคำถาม Quiz O / S / M / U อัตโนมัติ…</strong>
            <p>คุณสามารถกดเปิดอ่านสไลด์ซิงค์ตามจอหน้าห้อง (รองรับ Pinch-Zoom และเลื่อนขึ้น-ลงในสไลด์) ได้เลย เมื่อถึงข้อคำถาม แป้นกดตอบ 4 สีจะเด้งขึ้นมาเองอัตโนมัติ!</p>
            <div class="orl-m-slide-tracker">
              📡 สไลด์ปัจจุบัน: <strong>Slide ${esc(state.session.hostSlideNum || "01")}</strong> · ${esc(state.session.hostSlideTitle || "Orientation")}
            </div>
          </div>

          <button type="button" class="orl-m-join-btn" data-orl-mact="view-synced-slides" style="width:100%">📖 ดูสไลด์ซิงค์ตามจอหน้าห้อง (Pinch-Zoom ได้)</button>
          <div class="orl-m-foot-btns">
            <button type="button" class="orl-m-sec-btn" data-orl-mact="edit-profile">✏️ เปลี่ยนชื่อ / บทบาท</button>
            <button type="button" class="orl-m-sec-btn" data-orl-mact="close">เข้าหน้าหลักพอร์ทัล</button>
          </div>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="orl-m-shell">
        <div class="orl-m-topbar">
          <span class="orl-live-pill"><span class="orl-dot${cloudOk ? " is-online" : ""}"></span> RACM 303 LIVE</span>
          ${
            canRemote && state.joined
              ? `
            <div class="orl-seg-group">
              <button type="button" class="orl-seg-btn${state.mobileTab === "pad" ? " is-active" : ""}" data-orl-mact="switch-mtab" data-mtab="pad">🎮 ตอบ Quiz</button>
              <button type="button" class="orl-seg-btn${state.mobileTab === "remote" ? " is-active" : ""}" data-orl-mact="switch-mtab" data-mtab="remote">🎛️ รีโมท</button>
            </div>
          `
              : `<span class="orl-m-score-pill">${myEntry.score.toLocaleString()} pts</span>`
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
          badge: "LIVE POLL · คำถามสดจากอาจารย์",
          impactTag: "ทวนสอบความเข้าใจในห้องปฐมนิเทศ",
          durationSec: state.customDurationSec || 20,
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
            <span class="orl-live-pill is-lg"><span class="orl-dot is-online"></span> สแกนพร้อมกันทั้งอาจารย์ &amp; นศพ.</span>
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
          <label class="orl-m-lbl">สรุปเฉลย / เกณฑ์ O·S·M·U ที่แสดงหลังเฉลย</label>
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
    const durMs = Math.max(1000, (state.session.durationSec || 20) * 1000);
    const pct = Math.max(0, Math.min(100, (remMs / durMs) * 100));
    document.querySelectorAll("[data-orl-timer-sec]").forEach((el) => {
      el.textContent = `${sec}s`;
      el.classList.toggle("is-urgent", sec <= 5);
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
        ? `⚡ คำถาม Quiz O/S/M/U กำลังเปิดรับคำตอบ! แตะเพื่อตอบทันที &rarr;`
        : `🟢 Orientation Live เปิดอยู่ (${state.participants.size} คน) · แตะเปิดแป้นตอบ/ซิงค์สไลด์`;
  }

  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-orl-action], [data-orl-preset], [data-orl-dur], [data-orl-jump-q]");
    if (!btn) return;

    if (btn.hasAttribute("data-orl-preset")) {
      applyPresetDeck(btn.getAttribute("data-orl-preset"));
      renderAllSurfaces(true);
      return;
    }
    if (btn.hasAttribute("data-orl-dur")) {
      state.customDurationSec = Number(btn.getAttribute("data-orl-dur")) || 20;
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
        window.RACM_ORIENTATION_DECK.goToSlideById("s14-quiz-osmu");
      }
    } else if (act === "goto-criteria-slide") {
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
    renderDeckLiveStageHtml,
    renderEmbeddedQuizSlideHtml,
    openParticipantModal,
    closeParticipantModal,
    hasOpenOverlay,
    closeTopOverlay,
    notifyHostSlide,
    isFollowEnabled: () => state.followHostSlide,
    toggleFollowHostSlide: () => {
      state.followHostSlide = !state.followHostSlide;
      safeSet("racm303_orient_follow_v1", state.followHostSlide ? "1" : "0");
      return state.followHostSlide;
    },
    getParticipantCount: () => state.participants.size,
    getPhase: () => state.session.phase,
    buildQrSvg
  };
})();
