/* ==========================================================================
   RACM 303 (2569) — Live Orientation Lobby & Kahoot-Style Recheck Engine
   Scan-to-Join QR Code (Pure-JS ISO/IEC 18004 SVG) · Live Participant Lobby
   Real-Time Cross-Portal Sync (MQTT WSS + PeerJS WebRTC + BroadcastChannel)
   Do's & Don'ts + O / S / M / U Mastery Recheck (Course Manual & TQF3 2569)
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
  const STALE_SESSION_MS = 3 * 60 * 60 * 1000;
  const STALE_PRESENCE_MS = 90 * 60 * 1000;

  const AVATARS = ["🩺", "🏥", "🌿", "🧭", "🔬", "💡", "🤝", "🌟"];
  const CHOICE_META = [
    { idx: 0, shape: "▲", cls: "is-red", hex: "#e21b3c", nameTh: "สีแดง (▲)" },
    { idx: 1, shape: "◆", cls: "is-blue", hex: "#1368ce", nameTh: "สีน้ำเงิน (◆)" },
    { idx: 2, shape: "●", cls: "is-gold", hex: "#d89e00", nameTh: "สีเหลือง (●)" },
    { idx: 3, shape: "■", cls: "is-green", hex: "#26890c", nameTh: "สีเขียว (■)" }
  ];

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

  /* ---------- 2. Source-Verified Question Bank (Course Manual 2569, มม.4 2569, Regs 2561, Forms 1A–4A) ---------- */
  const BASE_QUESTIONS = [
    {
      id: "q1_late_osmu",
      quick5: true,
      badge: "DO'S & DON'TS · เวลาเข้าเรียน & เกณฑ์ M / U",
      impactTag: "สาย 4 ครั้ง = M · สาย ≥ 5 ครั้ง = U",
      durationSec: 20,
      stem: "ในกิจกรรมที่กำหนดให้เช็คชื่อเข้าเรียน หาก นศพ. เข้าห้องเรียน “สายเกิน 15 นาที” จะเกิดผลประเมินเจตคติระดับ M (ควรปรับปรุง) และ U (ไม่ผ่าน) เมื่อสายกี่ครั้งตามลำดับ?",
      choices: [
        "สาย 2 ครั้ง = M · สาย 3 ครั้งขึ้นไป = U",
        "สาย 4 ครั้ง = M · สาย 5 ครั้งขึ้นไป = U (ต้องลงทะเบียนเรียนใหม่)",
        "สาย 5 ครั้ง = M · สาย 8 ครั้งขึ้นไป = U",
        "หักเฉพาะคะแนนเก็บรายคาบ ไม่มีผลต่อเกรด M หรือ U"
      ],
      correctIdx: 1,
      sourceRef: "มม.4 RACM 303 ปีการศึกษา 2569 (หน้า 11–12) & คู่มือรายวิชา 2569",
      doSummary: "ลงชื่อเข้าเรียนตั้งแต่ก่อนเริ่มคาบ 15 นาที ถึงไม่เกิน 15 นาทีหลังเริ่มคาบ และมีเวลาเรียนรวมตลอดรายวิชา ≥ 80%",
      dontSummary: "ห้ามเข้าห้องเรียนสายเกิน 15 นาทีสะสม (หากมีเหตุสุดวิสัยต้องรีบแจ้ง อ.ที่ปรึกษาทันที)",
      osmuRule: "สายเกิน 15 นาที 4 ครั้ง = M (Marginal) · สายตั้งแต่ 5 ครั้งขึ้นไป = U (Unsatisfactory · ลงทะเบียนเรียนใหม่)",
      wrongHints: [
        "เกณฑ์จริงให้โอกาสถึงครั้งที่ 3 ยังไม่ติด M แต่ครั้งที่ 4 ติด M และครั้งที่ 5 ติด U ทันที",
        "",
        "ระวังจำสลับ! เกิน 15 นาทีครบ 5 ครั้งคือ U ทันที ไม่ใช่แค่ M",
        "การมาสายมีผลตรงต่อเกณฑ์เจตคติ M และ U ตามประกาศคณะฯ พ.ศ. 2567"
      ]
    },
    {
      id: "q2_absence_m_to_u",
      quick5: true,
      badge: "เกณฑ์ O · S · M · U · การขาดเรียน & ส่งงานช้า",
      impactTag: "ได้ M ≥ 2 หมวด หรือซ้ำหมวดเดิม → กลายเป็น U",
      durationSec: 22,
      stem: "ข้อใดกล่าว “ถูกต้อง” เกี่ยวกับการเกิดระดับ M (Marginal) และการขยับเป็น U (Unsatisfactory) ตามคู่มือและ มม.4 รายวิชา RACM 303?",
      choices: [
        "ขาดเรียนโดยไม่ลา 1 ครั้ง ได้รับเกรด U ทันทีโดยไม่มีข้อยกเว้น",
        "ส่งงานช้ากว่ากำหนด 2 ครั้ง ยังได้เกรด O หากคะแนนสอบทฤษฎีถึง 3.75",
        "ขาดเรียนไม่ลา ≥ 2 ครั้ง หรือส่งงานช้า ≥ 2 ครั้ง ได้ M (และหากได้ M ≥ 2 หมวด หรือทำซ้ำหมวดเดิม จะกลายเป็น U)",
        "หากติด U ด้านเจตคติ สามารถขอสอบข้อเขียนแก้ตัว 1 ครั้งเพื่อปรับเป็น S ได้"
      ],
      correctIdx: 2,
      sourceRef: "มม.4 RACM 303 ปีการศึกษา 2569 (หน้า 11–13) & คู่มือรายวิชา หัวข้อ 13–14",
      doSummary: "ส่งงานครบตรงเวลา และหากจำเป็นต้องลา ให้ยื่นใบลาล่วงหน้าและได้รับอนุมัติก่อนเสมอ (ทฤษฎี ≤ 3 วัน · ภาคสนาม ≤ 1.5 วัน)",
      dontSummary: "ห้ามขาดเรียนโดยไม่ลา (≥ 2 ครั้ง = M) และห้ามส่งงานล่าช้า (ช้า ≥ 2 ครั้ง = M · ช้า ≥ 3 ครั้ง = U)",
      osmuRule: "ได้ M ตั้งแต่ 2 หมวดขึ้นไป หรือทำผิดซ้ำในหมวด M เดิม → ปรับเป็น U ทันที และ U ด้านเจตคติไม่มีการสอบแก้ตัว!",
      wrongHints: [
        "ขาดเรียนโดยไม่ได้รับอนุญาตตั้งแต่ 2 ครั้งขึ้นไปจึงจะได้ M (แต่ควรยื่นใบลาให้ถูกต้องทุกครั้ง)",
        "ไม่ส่งงานตามกำหนดตั้งแต่ 2 ครั้งขึ้นไปจะได้ M ทันที (และ ≥ 3 ครั้งได้ U)",
        "",
        "สำคัญมาก: เกรด U จากหมวดเจตคติและพฤติกรรม ไม่มีการสอบแก้ตัว ต้องลงทะเบียนเรียนใหม่เท่านั้น!"
      ]
    },
    {
      id: "q3_fieldwork_donts",
      quick5: true,
      badge: "DO'S & DON'TS · ระเบียบภาคสนาม พ.ศ. 2561",
      impactTag: "ฝ่าฝืนระเบียบภาคสนาม/ปกปิด = โทษวินัย & U",
      durationSec: 22,
      stem: "ระหว่างฝึกภาคสนาม ณ รพ.แหล่งฝึกทั้ง 9 แห่ง ข้อใดคือ “Don't (ห้ามทำเด็ดขาด)” ที่ฝ่าฝืนประกาศระเบียบฝึกนอกสถานที่ พ.ศ. 2561 และเสี่ยงได้รับ U?",
      choices: [
        "เดินทางเป็นทีมด้วยรถที่ภาควิชา/รพ.จัดให้ และแจ้ง อ.ที่ปรึกษาทุกครั้งก่อนลงพื้นที่",
        "นำรถยนต์/มอเตอร์ไซค์ส่วนตัวไปใช้ ออกนอกเขตฝึกโดยพลการ ดื่มแอลกอฮอล์/เล่นพนัน หรือให้คนนอกเข้าที่พักโดยไม่ขออนุญาต",
        "แต่งกายชุดสุภาพ (กางเกงขายาว เสื้อมีแขน) ลงชุมชน และแต่งชุด นศพ. ติดป้ายชื่อเมื่อขึ้น รพช.",
        "ขออนุมัติใบลาเป็นลายลักษณ์อักษรจาก อ.ที่ปรึกษาก่อนลาหยุด (โควตาภาคสนามไม่เกิน 1.5 วัน)"
      ],
      correctIdx: 1,
      sourceRef: "คู่มือรายวิชา 2569 หัวข้อที่ 2, 10, 14 (ประกาศระเบียบฝึกปฏิบัติงานนอกสถานที่ พ.ศ. 2561 ข้อ 3–8)",
      doSummary: "ใช้พาหนะและพักในที่พักที่จัดให้ ลงเก็บข้อมูลเป็นทีม แต่งกายสุภาพติดป้ายชื่อ ดูแลความปลอดภัยของตนเองและเพื่อน",
      dontSummary: "งดพาหนะส่วนตัว งดออกนอกเขตฝึกโดยพลการ งดแอลกอฮอล์/สารเสพติด/การพนัน งดพาบุคคลภายนอกเข้าที่พักโดยไม่ได้รับอนุญาต",
      osmuRule: "การฝ่าฝืนประกาศฯ หรือพยายามปกปิดการฝ่าฝืนของตนเอง/ผู้อื่น → พิจารณาดำเนินการทางวินัยและประเมินรายวิชาเป็น U",
      wrongHints: [
        "ข้อนี้คือแนวปฏิบัติที่ถูกต้อง (Do) เพื่อความปลอดภัยตลอดการฝึกภาคสนาม",
        "",
        "ข้อนี้คือแนวปฏิบัติการแต่งกายที่ถูกต้อง (Do) ตามคู่มือรายวิชา หัวข้อที่ 10",
        "ข้อนี้คือแนวปฏิบัติการลาที่ถูกต้อง (Do) โดยช่วงภาคสนามลาได้ไม่เกิน 1.5 วัน"
      ]
    },
    {
      id: "q4_integrity_1a",
      quick5: false,
      badge: "DO'S & DON'TS · ความซื่อสัตย์วิชาชีพ (ฟอร์ม 1A)",
      impactTag: "เซ็นชื่อแทนกัน / เมคข้อมูล / ลอกงาน = U ทั้งคู่",
      durationSec: 20,
      stem: "เพื่อนฝากเช็คชื่อเข้าเรียน หรือช่วยกันกรอกข้อมูลเท็จในแบบสำรวจ Health Survey เพื่อให้เก็บครบเร็วขึ้น ผลตามเกณฑ์ฟอร์ม 1A (ข้อ 6.2) และ มม.4 คือข้อใด?",
      choices: [
        "ตักเตือนเฉพาะผู้ฝากเช็คชื่อ ส่วนผู้กดเช็คชื่อให้ถือว่ามีน้ำใจช่วยเหลือเพื่อน",
        "ได้รับระดับ M ในฟอร์ม 1A แต่ยังผ่านรายวิชาเป็นเกรด S ได้",
        "หักคะแนนเฉพาะพาร์ทการนำเสนอวิจัยฟอร์ม 4A ลงครึ่งหนึ่ง",
        "เข้าข่ายไม่ซื่อสัตย์ (ทั้งผู้ให้ทำแทนและผู้ทำแทนโดยสิเน่หา/สินจ้าง บิดเบือนข้อมูล หรือลอกรายงาน) ได้รับ U ทั้งคู่"
      ],
      correctIdx: 3,
      sourceRef: "คู่มือรายวิชา 2569 ภาคผนวก ฟอร์ม 1A (ข้อ 6.2 ความซื่อสัตย์) & มม.4 หน้า 12",
      doSummary: "ลงชื่อเข้าเรียนด้วยตนเอง เก็บข้อมูลชุมชนตามความจริง ซื่อสัตย์ต่อหน้าและลับหลัง และกล้ารับผิดชอบเมื่อเกิดข้อผิดพลาด",
      dontSummary: "ห้ามเซ็นชื่อแทนกัน ห้ามบิดเบือน/เมคข้อมูลวิจัย ห้ามปลอมใบรับรองแพทย์ และห้ามคัดลอกรายงาน",
      osmuRule: "การบิดเบือนข้อมูล ลอกงาน ปลอมลายเซ็น หรือทำกิจกรรมแทนกัน (ทั้งผู้รับและผู้ทำให้) = ประเมินเจตคติเป็น U ทันที",
      wrongHints: [
        "มม.4 ระบุชัดว่าทั้งผู้ให้ทำแทนและผู้ทำให้โดยสิเน่หา/สินจ้างในการเซ็นชื่อหรือเขียนงานแทน มีความผิดระดับ U ทั้งคู่",
        "ความไม่ซื่อสัตย์ทางวิชาการและวิชาชีพจัดเป็นพฤติกรรมระดับ U ไม่ใช่ M",
        "การเมคหรือบิดเบือนข้อมูลวิจัยชุมชนผิดจริยธรรมวิชาชีพร้ายแรง ส่งผลถึงระดับ U รายบุคคล",
        ""
      ]
    },
    {
      id: "q5_exam_opennote",
      quick5: true,
      badge: "DO'S & DON'TS · ระเบียบห้องสอบ & โน้ต A4",
      impactTag: "สาย > 15 นาทีหมดสิทธิ์เข้าสอบ · A4 ลายมือตนเองเท่านั้น",
      durationSec: 20,
      stem: "ข้อใดปฏิบัติ “ถูกต้อง (Do)” ในการเข้าสอบภาคทฤษฎีระบาดวิทยา (8 ธ.ค.) และการสอบระบบสุขภาพ (22 ธ.ค. แบบ Open Note)?",
      choices: [
        "เข้าห้องสอบสายได้ไม่เกิน 30 นาที และสวม Smart Watch เข้าห้องสอบได้หากเปิด Airplane Mode",
        "สอบระบบสุขภาพนำกระดาษ A4 ที่พิมพ์สรุปจาก iPad หรือถ่ายเอกสารลายมือเพื่อนเข้าห้องสอบได้ 1 แผ่น",
        "เข้าห้องสอบไม่เกิน 15 นาที งดกระเป๋า/มือถือ/Smart Watch และสอบระบบสุขภาพนำ A4 เขียนลายมือตนเอง (ปากกา/ดินสอ หน้า-หลัง) เข้าได้ 1 แผ่น",
        "สอบระบาดวิทยาเป็น Closed-Book แต่อนุญาตให้นำเครื่องคิดเลขวิทยาศาสตร์ส่วนตัวเข้าห้องสอบได้"
      ],
      correctIdx: 2,
      sourceRef: "คู่มือรายวิชา 2569 หัวข้อที่ 9 ระเบียบการสอบภาคทฤษฎี (หน้า 11–12)",
      doSummary: "แต่งชุด นศพ. ถูกระเบียบ ติดป้ายชื่อมีรูปชัดเจน เข้าห้องสอบก่อนเวลา (สายเกิน 15 นาทีไม่ให้เข้าสอบ) และเขียนสรุป A4 ด้วยลายมือตนเอง",
      dontSummary: "ห้ามนำกระเป๋า มือถือ Smart Watch เครื่องคิดเลข เอกสารพิมพ์/สำเนา และอาหารเครื่องดื่มเข้าห้องสอบเด็ดขาด",
      osmuRule: "ทุจริตการสอบหรือนำอุปกรณ์ต้องห้ามเข้าห้องสอบ = U · คะแนนสอบแต่ละหมวดต้อง ≥ 2.00 จึงผ่าน (≥ 3.75 จึงมีสิทธิ์ลุ้น O)",
      wrongHints: [
        "เข้าห้องสอบสายเกิน 15 นาที ไม่อนุญาตให้เข้าห้องสอบ และห้ามสวม Smart Watch ทุกชนิดเข้าห้องสอบ!",
        "กระดาษ A4 1 แผ่นในวิชาสอบระบบสุขภาพ ต้องเขียนสดด้วยลายมือตนเอง (ปากกา/ดินสอ) เท่านั้น ห้ามพิมพ์จาก iPad หรือถ่ายสำเนา!",
        "",
        "ห้ามนำเครื่องคิดเลขและอุปกรณ์อิเล็กทรอนิกส์ทุกชนิดเข้าห้องสอบ"
      ]
    },
    {
      id: "q6_ai_pdpa",
      quick5: true,
      badge: "DO'S & DON'TS · การใช้ AI & กฎหมาย PDPA",
      impactTag: "SRN 1–2 = No AI · ห้ามนำข้อมูลชาวบ้านเข้า AI สาธารณะ",
      durationSec: 22,
      stem: "ข้อใดปฏิบัติ “ถูกต้อง” ตามเกณฑ์ AI Scale Assessment ม.มหิดล และการคุ้มครองสิทธิผู้ป่วย/ชุมชน (PDPA) ในรายวิชา RACM 303 ปี 2569?",
      choices: [
        "ใช้ Generative AI ร่างบันทึกสะท้อนคิด SRN 1 และ SRN 2 ได้ หากนำมาปรับสำนวนเป็นตัวเอง",
        "อัปโหลดตารางข้อมูลดิบที่มีชื่อ-นามสกุลและประวัติโรคของผู้ป่วยในชุมชนเข้า AI สาธารณะเพื่อช่วยวิเคราะห์สถิติ",
        "ถ่ายภาพใบหน้าผู้ป่วยติดเตียงขณะเยี่ยมบ้านลงโซเชียลสาธารณะเพื่อบอกเล่าความประทับใจโดยไม่ต้องขอความยินยอม",
        "SRN 1–2 และการสอบเป็น No AI เด็ดขาด · ส่วนสไลด์กลุ่ม (3A/4A) ใช้ AI ช่วยวางโครง/ทำกราฟได้โดยต้อง Declare Prompt และห้ามใส่ข้อมูลระบุตัวบุคคล"
      ],
      correctIdx: 3,
      sourceRef: "มม.4 RACM 303 ปีการศึกษา 2569 (หน้า 9–10 AI Scale Assessment) & ระเบียบภาคสนาม ข้อ 5",
      doSummary: "เขียน SRN 1–2 จากการสะท้อนคิดจริงด้วยตนเอง (PDF ≤ 5 หน้า TH Sarabun New 16pt) และระบุชื่อเครื่องมือ + Prompt เมื่อใช้ AI ช่วยงานกลุ่ม 3A/4A",
      dontSummary: "ห้ามใช้ AI เขียน SRN ห้ามนำข้อมูลดิบ/ข้อมูลระบุตัวบุคคลเข้า AI สาธารณะ และห้ามโพสต์ละเมิดสิทธิผู้ป่วยในสื่อออนไลน์",
      osmuRule: "จงใจละเมิดสิทธิผู้ป่วย/PDPA หรือลอก/ปลอมผลงาน = U · ส่ง SRN ช้า ≥ 2 ครั้ง = M (และต้องทำแบบประเมินออนไลน์ก่อนส่ง SRN)",
      wrongHints: [
        "SRN 1–2 กำหนดเป็น No AI เด็ดขาด เพื่อป้องกันความเข้าอกเข้าใจสังเคราะห์ (Synthetic Empathy)",
        "ห้ามนำข้อมูลดิบหรือข้อมูลที่ระบุตัวบุคคลของประชาชนเข้าสู่ระบบ AI สาธารณะโดยเด็ดขาด (ผิด PDPA และจริยธรรมวิจัย)",
        "การโพสต์ภาพหรือข้อมูลผู้ป่วยลงสื่อออนไลน์โดยไม่เคารพสิทธิผู้ป่วย ผิดระเบียบภาคสนามและจริยธรรมวิชาชีพ (เสี่ยง U)",
        ""
      ]
    },
    {
      id: "q7_grade_criteria",
      quick5: false,
      badge: "เกณฑ์ตัดสินเกรด · O / S / สอบซ่อม / U",
      impactTag: "เกรด O = สอบ ≥ 3.75 ทั้งสองหมวด + 2A ได้ O + ไม่เคยซ่อม",
      durationSec: 22,
      stem: "นศพ. สอบระบาดวิทยาได้ 3.80 สอบระบบสุขภาพรอบแรกได้ 1.85 (สอบซ่อมครั้งที่ 1 ผ่านได้ 3.50) และได้ฟอร์ม 2A ระดับ O เกรดสุดท้ายของรายวิชาจะเป็นข้อใด?",
      choices: [
        "ได้เกรด O เพราะคะแนนหลังสอบซ่อมสูงและผลประเมินเจตคติ 2A ได้ระดับ O",
        "ได้เกรด S (เนื่องจากหมวดที่ได้ < 2.00 ต้องสอบซ่อม และเมื่อมีการสอบซ่อมผ่านจะได้รับเกรดเป็น S)",
        "ได้เกรด M เพราะผ่านจากการสอบแก้ตัว",
        "ได้เกรด U เพราะมีหมวดที่ต่ำกว่า 2.00 ในการสอบรอบแรก"
      ],
      correctIdx: 1,
      sourceRef: "คู่มือรายวิชา 2569 หัวข้อที่ 13 (หน้า 13) & มม.4 หน้า 11–13",
      doSummary: "เตรียมตัวให้ผ่านเกณฑ์ ≥ 2.00 แยกทั้งระบาดวิทยาและระบบสุขภาพตั้งแต่รอบแรก (ลุ้น O เมื่อได้ ≥ 3.75 ทั้งสองหมวดคู่กับ 2A ระดับ O)",
      dontSummary: "อย่าชะล่าใจทิ้งหมวดใดหมวดหนึ่ง เพราะคะแนนคิดแยกหมวดกัน ไม่นำมาถัวเฉลี่ยข้ามหมวดเพื่อผ่านเกณฑ์ 2.00!",
      osmuRule: "ต่ำกว่า 2.00 สอบซ่อมแยกหมวดได้ 1 ครั้ง: ซ่อมผ่านได้เกรด S · ซ่อมไม่ผ่านได้เกรด U ต้องลงทะเบียนเรียนใหม่",
      wrongHints: [
        "เกรด O ต้องได้ ≥ 3.75 ทั้งสองหมวดตั้งแต่รอบแรก คู่กับฟอร์ม 2A ระดับ O และต้องไม่มีการสอบซ่อม",
        "",
        "เกรดสรุปรายวิชาเมื่อสอบซ่อมผ่านจะได้รับสัญลักษณ์ S (ไม่ใช่ M)",
        "รายวิชาให้โอกาสสอบแก้ตัวได้ 1 ครั้งในหมวดที่ได้ต่ำกว่า 2.00 จะได้ U ก็ต่อเมื่อสอบแก้ตัวไม่ผ่าน"
      ]
    },
    {
      id: "q8_presentation_3a4a",
      quick5: false,
      badge: "DO'S & DON'TS · การนำเสนอทีม (ฟอร์ม 3A & 4A)",
      impactTag: "ห้ามใช้ VDO อัดล่วงหน้า · รักษาเวลาเคร่งครัด",
      durationSec: 20,
      stem: "ในวันนำเสนอผลงานภาคสนาม (29–30 ธ.ค. 2569) ข้อใดคือแนวปฏิบัติที่ถูกต้องตามกติกาและนำไปสู่ระดับ “โดดเด่น (O)” ในฟอร์ม 3A และ 4A?",
      choices: [
        "อัดคลิปวิดีโอนำเสนอล่วงหน้ามาเปิดฉายในห้อง 2C2-03 เพื่อป้องกันการพูดเกินเวลา",
        "แบ่งสไลด์ระบบสุขภาพออกเป็น 5 ส่วนแยกขาดจากกันตามคนพูดโดยไม่ต้องเชื่อมโยงกัน",
        "นำเสนอสด (งด VDO ล่วงหน้า) รักษาเวลาเคร่งครัด (3A พูด ≤ 10 นาที · 4A พูด ≤ 7 นาที) ใช้ Systems Thinking เชื่อม 5 วัตถุประสงค์ และวิพากษ์ข้อจำกัดข้อมูลอย่างตรงไปตรงมา",
        "พูดเกินเวลาที่กำหนดไปเรื่อย ๆ เพื่อให้ครอบคลุมข้อมูลทุกตารางแม้กรรมการกดกริ่งเตือนแล้ว"
      ],
      correctIdx: 2,
      sourceRef: "คู่มือรายวิชา 2569 หัวข้อที่ 16–17 & ภาคผนวกเกณฑ์ฟอร์ม 3A และ 4A",
      doSummary: "นำเสนอสด ซ้อมจับเวลาทีม (3A: 10+20 นาที · 4A: 7+18 นาที) เชื่อมโยง 5 วัตถุประสงค์เชิงระบบ และส่งสไลด์+Health Survey ภายใน 30 ธ.ค. 17.00 น.",
      dontSummary: "ห้ามใช้วิดีโอถ่ายบันทึกล่วงหน้ามาเปิดนำเสนอ และห้ามพูดเกินเวลาแม้กรรมการกดกริ่งเตือน",
      osmuRule: "ไม่รักษาเวลา/ไม่หยุดเมื่อเตือน หรืออ้างข้อมูลเกินจริงโดยไม่ตระหนักข้อจำกัด = ได้หมวด U ในฟอร์ม 3A/4A (และต้องไม่ได้ U ในการนำเสนอรายกลุ่มจึงจะผ่านวิชา!)",
      wrongHints: [
        "คู่มือรายวิชา หัวข้อ 16 และ 17 ระบุชัดว่า ยกเว้น (ไม่อนุญาต) การถ่ายบันทึก VDO ล่วงหน้ามาเปิด Present!",
        "หัวใจของฟอร์ม 3A ระดับ O คือการใช้ Systems Thinking ร้อยเรียงทั้ง 5 วัตถุประสงค์เข้าด้วยกัน ไม่ใช่แยกส่วน",
        "",
        "เกณฑ์ฟอร์ม 3A/4A หมวดการรักษาเวลา: ไม่หยุดนำเสนอเมื่อกรรมการเตือน ได้ 0–4 คะแนน (ระดับไม่ผ่าน U)"
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
    savedPid = randomId("stu");
    safeSet("racm303_orient_pid_v1", savedPid);
  }

  const state = {
    role: ROLE,
    participantId: savedPid,
    joined: safeGet("racm303_orient_joined_v1", "0") === "1",
    studentId: safeGet("racm303_orient_sid_v1", ""),
    shortNo: safeGet("racm303_orient_sno_v1", ""),
    nickname: safeGet("racm303_orient_nick_v1", ""),
    fullName: safeGet("racm303_orient_fname_v1", ""),
    area: safeGet("racm303_orient_area_v1", ""),
    disc: Number(safeGet("racm303_orient_disc_v1", "0")) || 0,
    avatar: safeGet("racm303_orient_avatar_v1", "🩺"),

    coverPaneMode: "lobby", // "lobby" | "hero"
    qrUrlMode: "prod", // "prod" | "current"
    qrZoomOpen: false,
    customPollModalOpen: false,
    questionPickerOpen: false,
    soundMuted: safeGet("racm303_orient_mute_v1", "0") === "1",
    participantModalOpen: false,

    presetMode: "all8", // "all8" | "quick5"
    customDurationSec: 20,
    customQuestions: loadCustomQuestions(),

    // Shared Live Session State (controlled by Faculty / Host)
    session: {
      seq: 0,
      sessionId: safeGet("racm303_orient_sess_id_v1", "orient_2569"),
      phase: "lobby", // "lobby" | "question" | "reveal" | "podium"
      activeDeckIds: BASE_QUESTIONS.map((q) => q.id),
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

    // Map<participantId, ParticipantRecord>
    participants: new Map(),
    // Map<questionId, Map<participantId, AnswerRecord>>
    answersByQ: new Map(),

    // Transports
    transports: new Set(),
    mqttClients: [],
    peer: null,
    peerConns: new Map(),
    hostConn: null,
    bc: null
  };

  // Auto-seed student profile if already bound in Student Portal!
  (function tryPrebindFromPortal() {
    if (state.studentId) return;
    const portalSid = safeGet("racm303_personal_student_id", "") || safeGet("racm303_student_id", "");
    if (!portalSid) return;
    const stu = findRosterStudent(portalSid);
    if (stu) applyRosterToLocalState(stu, false);
  })();

  function getRosterList() {
    return (window.RACM_ROSTER_DATA && Array.isArray(window.RACM_ROSTER_DATA.students))
      ? window.RACM_ROSTER_DATA.students
      : [];
  }

  function findRosterStudent(query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return null;
    const list = getRosterList();
    return (
      list.find((s) => String(s.id) === q) ||
      list.find((s) => String(s.id).slice(-3) === q) ||
      list.find((s) => String(s.nickname || "").toLowerCase() === q) ||
      list.find((s) => String(s.name || "").toLowerCase().includes(q) || String(s.nickname || "").toLowerCase().includes(q)) ||
      null
    );
  }

  function searchRosterCandidates(query) {
    const q = String(query || "").trim().toLowerCase();
    const list = getRosterList();
    if (!q) return list.slice(0, 8);
    return list
      .filter((s) => {
        const sid = String(s.id || "");
        const sno = sid.slice(-3);
        const nick = String(s.nickname || "").toLowerCase();
        const name = String(s.name || s.fullName || "").toLowerCase();
        const area = String(s.area || "").toLowerCase();
        return sid.includes(q) || sno === q || nick.includes(q) || name.includes(q) || area.includes(q);
      })
      .slice(0, 10);
  }

  function applyRosterToLocalState(stu, persistJoin) {
    if (!stu || !stu.id) return;
    state.studentId = String(stu.id);
    state.shortNo = String(stu.id).slice(-3);
    state.participantId = `sid_${stu.id}`;
    state.nickname = String(stu.nickname || "").trim();
    state.fullName = String(stu.fullName || stu.name || "").trim();
    state.area = String(stu.area || "").trim();
    state.disc = Number(stu.disc) || 0;
    safeSet("racm303_orient_pid_v1", state.participantId);
    safeSet("racm303_orient_sid_v1", state.studentId);
    safeSet("racm303_orient_sno_v1", state.shortNo);
    safeSet("racm303_orient_nick_v1", state.nickname);
    safeSet("racm303_orient_fname_v1", state.fullName);
    safeSet("racm303_orient_area_v1", state.area);
    safeSet("racm303_orient_disc_v1", String(state.disc));
    if (persistJoin) {
      state.joined = true;
      safeSet("racm303_orient_joined_v1", "1");
    }
  }

  function getJoinUrl() {
    if (state.qrUrlMode === "current" && typeof window !== "undefined" && window.location) {
      const href = window.location.href.split("#")[0].split("?")[0];
      if (href.includes("racm303-2569-faculty-member")) {
        return href.replace("racm303-2569-faculty-member", "racm303-2569-student") + "#live";
      }
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
    const ids = state.session.activeDeckIds && state.session.activeDeckIds.length
      ? state.session.activeDeckIds
      : all.map((q) => q.id);
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

      const nextQId = state.session.currentQuestion && state.session.currentQuestion.id;
      if (state.role === "student" && state.session.phase === "question" && (prevPhase !== "question" || prevQId !== nextQId)) {
        // Vibrate phone & auto-surface participant pad when teacher launches a question!
        if (navigator.vibrate) {
          try { navigator.vibrate([110, 50, 110]); } catch (_) {}
        }
        if (state.joined) {
          state.participantModalOpen = true;
        }
        playTone([523.25, 659.25, 783.99], 0.13, "triangle", 0.08);
      } else if (state.session.phase === "reveal" && prevPhase === "question") {
        playTone([587.33, 783.99, 1046.5], 0.16, "sine", 0.1);
      }

      renderAllSurfaces(true);
      updateFloatingBanner();
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
        studentId: String(msg.studentId || "").slice(0, 16),
        shortNo: String(msg.shortNo || "").slice(0, 6),
        nickname: String(msg.nickname || "").slice(0, 32),
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
          qId,
          choiceIdx: Math.max(0, Math.min(3, Number(msg.choiceIdx) || 0)),
          correct: Boolean(msg.correct),
          points: Math.max(0, Math.min(1500, Number(msg.points) || 0)),
          elapsedMs: Math.max(0, Number(msg.elapsedMs) || 0),
          studentId: String(msg.studentId || "").slice(0, 16),
          shortNo: String(msg.shortNo || "").slice(0, 6),
          nickname: String(msg.nickname || "").slice(0, 32),
          area: String(msg.area || "").slice(0, 40),
          avatar: String(msg.avatar || "🩺").slice(0, 8),
          sentWallMs: Number(msg.sentWallMs) || Date.now()
        });
      }
      // Refresh sender's presence too
      if (!state.participants.has(pid)) {
        state.participants.set(pid, {
          participantId: pid,
          studentId: String(msg.studentId || "").slice(0, 16),
          shortNo: String(msg.shortNo || "").slice(0, 6),
          nickname: String(msg.nickname || "ผู้เข้าร่วม").slice(0, 32),
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

      // Auto-reveal if Host is running a question and 100% of joined participants answered!
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
      if (state.joined && state.role === "student") {
        publishMyPresence();
        // Re-broadcast my submitted answers in current session so a refreshed Host recovers scores!
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
            if (state.joined && state.role === "student") publishMyPresence();
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

  /* ---------- 6. Presence, Scoring & Leaderboard Computations ---------- */
  function getPlayerLabel(p) {
    if (!p) return "ผู้เข้าร่วม";
    const sno = p.shortNo || (p.studentId ? String(p.studentId).slice(-3) : "");
    if (sno && p.nickname) return `${sno} ${p.nickname}`;
    if (p.nickname) return p.nickname;
    if (sno && p.fullName) return `${sno} ${p.fullName.split(" ")[0]}`;
    return p.fullName || p.studentId || "ผู้เข้าร่วม";
  }

  function publishMyPresence() {
    if (!state.joined) return;
    const rec = {
      participantId: state.participantId,
      studentId: state.studentId || "",
      shortNo: state.shortNo || (state.studentId ? String(state.studentId).slice(-3) : ""),
      nickname: state.nickname || "ผู้เข้าร่วม",
      fullName: state.fullName || "",
      area: state.area || "",
      disc: state.disc || 0,
      avatar: state.avatar || "🩺",
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
      const k = p.area || "ทั่วไป/คณาจารย์";
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }

  function computeLeaderboard() {
    const board = new Map();
    state.participants.forEach((p, pid) => {
      board.set(pid, {
        participantId: pid,
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

  /* ---------- 7. Host Controls (Start Lobby, Launch Question, Reveal, Podium, Reset) ---------- */
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
    // If teacher moves to slides 02..15 while quiz was idle/podium, keep lobby waiting state synced
    if (state.session.phase !== "question") {
      broadcastSessionState();
    }
  }

  /* ---------- 8. Student Answer Submission ---------- */
  function submitMyAnswer(choiceIdx) {
    if (state.session.phase !== "question") return;
    const q = getCurrentQuestion();
    if (!q) return;
    if (!state.answersByQ.has(q.id)) state.answersByQ.set(q.id, new Map());
    const qMap = state.answersByQ.get(q.id);
    if (qMap.has(state.participantId)) return; // Already locked in!

    const remMs = getRemainingMs();
    const durMs = Math.max(1000, (state.session.durationSec || 20) * 1000);
    const elapsedMs = Math.max(0, durMs - remMs);
    const isCorrect = Number(choiceIdx) === Number(q.correctIdx);
    const speedRatio = Math.max(0, Math.min(1, remMs / durMs));
    const points = isCorrect ? Math.round(500 + 500 * speedRatio) : 0;

    const rec = {
      participantId: state.participantId,
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
    if (state.joined && state.role === "student") publishMyPresence();
  }, 18000);

  /* ---------- 10. UI Surface 1: Cover Slide Right-Column Card (Slide 01) ---------- */
  function buildJoinedChipsMarkup(limit) {
    const list = getSortedParticipants();
    if (!list.length) {
      return `<span class="orl-empty-wait">สแกน QR ด้วยกล้องมือถือหรือ LINE เพื่อแสดงชื่อขึ้นหน้าจอสดทันที…</span>`;
    }
    const slice = list.slice(0, limit || 10);
    const extra = list.length - slice.length;
    return (
      slice
        .map(
          (p) =>
            `<span class="orl-p-chip" title="${esc(p.fullName || p.nickname)} (${esc(p.area || "RACM 303")})"><span class="orl-p-ava">${esc(p.avatar || "🩺")}</span><strong>${esc(getPlayerLabel(p))}</strong>${p.area ? `<em>· ${esc(p.area)}</em>` : ""}</span>`
        )
        .join("") +
      (extra > 0 ? `<span class="orl-p-chip is-more">+ อีก ${extra} คน</span>` : "")
    );
  }

  function renderCoverCardHtml(opts) {
    const o = opts || {};
    const isHandout = o.viewMode === "handout";
    const joinUrl = getJoinUrl();
    const qrSvg = buildQrSvg(joinUrl);
    const count = state.participants.size;
    const cloudOk = isCloudConnected();

    if (state.coverPaneMode === "hero" && !isHandout) {
      return `
        <div class="orl-cover-card is-hero-view">
          <div class="orl-cover-head">
            <span class="orl-live-pill"><span class="orl-dot"></span> COURSE VISUAL</span>
            <button type="button" class="orl-mini-switch" data-orl-action="show-cover-lobby">📱 สลับกลับหน้า QR &amp; Live Lobby (${count})</button>
          </div>
          <figure class="or-fig-plate is-cover-hero" style="flex:1;min-height:0">
            <div class="or-fig-img-wrap">
              <img class="or-fig-img" src="assets/images/orientation/orient_s01_hero.png?v=20261124orl1" alt="Bedside Care connected to Community & Health Systems Science" loading="eager" decoding="async" />
            </div>
          </figure>
        </div>
      `;
    }

    return `
      <div class="orl-cover-card" data-orl-cover-mount="1">
        <div class="orl-cover-head">
          <div class="orl-cover-head-left">
            <span class="orl-live-pill"><span class="orl-dot${cloudOk ? " is-online" : ""}"></span> LIVE LOBBY · KAHOOT RECHECK</span>
            <span class="orl-sync-sub" data-orl-sync-label>${cloudOk ? "ซิงค์สดข้ามอุปกรณ์พร้อมใช้งาน" : "พร้อมซิงค์ในเครือข่าย"}</span>
          </div>
          <div class="orl-cover-head-actions">
            ${!isHandout ? `<button type="button" class="orl-mini-switch" data-orl-action="zoom-qr" title="ขยาย QR Code เต็มจอสำหรับแถวหลัง">🔍 ขยาย QR</button>` : ""}
            ${!isHandout ? `<button type="button" class="orl-mini-switch" data-orl-action="show-cover-hero" title="สลับดูภาพประกอบหน้าปก">🖼️ ภาพปก</button>` : ""}
          </div>
        </div>

        <div class="orl-cover-body">
          <div class="orl-cover-qr-col">
            <button type="button" class="orl-qr-frame-btn" data-orl-action="zoom-qr" title="คลิกเพื่อขยาย QR Code ขนาดใหญ่">
              ${qrSvg}
            </button>
            <div class="orl-qr-url-box">
              <span class="orl-qr-scan-kicker">📱 สแกนเข้าร่วมเป็น Participants</span>
              <code class="orl-qr-url-code">smartwoo.github.io/racm303-2569-student/#live</code>
            </div>
          </div>

          <div class="orl-cover-info-col">
            <div class="orl-count-hero-box">
              <div class="orl-count-nums">
                <span class="orl-count-big" data-orl-participant-count>${count}</span>
                <span class="orl-count-denom">/ 169 คน</span>
              </div>
              <span class="orl-count-caption">เข้าร่วมรอคำถาม Recheck สดในห้องแล้ว</span>
            </div>

            <div class="orl-topic-tags">
              <span class="orl-tag is-do">✅ Do &amp; Don'ts</span>
              <span class="orl-tag is-osmu">⚖️ เกณฑ์ O · S · M · U</span>
              <span class="orl-tag is-exam">📝 ห้องสอบ &amp; โน้ต A4</span>
              <span class="orl-tag is-ai">🤖 AI &amp; PDPA</span>
            </div>

            <div class="orl-chips-stream" data-orl-participant-chips>
              ${buildJoinedChipsMarkup(6)}
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
                📺 เปิดห้อง Live Lobby เต็มจอ (รอคนครบก่อนไปต่อ)
              </button>
              <button type="button" class="orl-cta-btn is-launch-quiz" data-orl-action="quick-start-quiz">
                ⚡ เริ่มคำถาม Recheck
              </button>
            `
                : `
              <button type="button" class="orl-cta-btn is-launch-quiz" data-orl-action="open-participant-pad">
                🙋 เข้าร่วมเป็นผู้ตอบคำถาม (Join Live Lobby)
              </button>
              <button type="button" class="orl-cta-btn is-lobby-expand" data-orl-action="open-deck-live">
                📺 ดูหน้าจอ Live Lobby
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

  /* ---------- 11. UI Surface 2: Full 16:9 Kahoot Stage Inside Orientation Deck ---------- */
  function renderLobbyStageHtml() {
    const joinUrl = getJoinUrl();
    const qrSvg = buildQrSvg(joinUrl, "is-stage-qr");
    const count = state.participants.size;
    const areaCounts = getAreaCounts();
    const areasOrder = ["กุฉินารายณ์", "ด่านซ้าย", "ตะกั่วป่า", "ท่าวังผา", "เพชรบูรณ์ 1", "เพชรบูรณ์ 2", "อุบลรัตน์", "ท่าสองยาง", "อุ้มผาง"];
    const deck = getActiveQuestionList();

    return `
      <div class="orl-stage is-lobby-stage">
        <div class="orl-stage-topbar">
          <div class="orl-st-left">
            <span class="orl-live-pill is-lg"><span class="orl-dot is-online"></span> RACM 303 · LIVE WAITING LOBBY</span>
            <span class="orl-st-sub">สแกน QR เพื่อเข้าห้องรอคำถาม Recheck (Do's &amp; Don'ts และเกณฑ์ O / S / M / U ตามคู่มือนักศึกษา 2569)</span>
          </div>
          <div class="orl-st-right">
            <button type="button" class="orl-bar-btn" data-orl-action="toggle-mute">${state.soundMuted ? "🔇 ปิดเสียงอยู่" : "🔊 เสียงเกม On"}</button>
            <button type="button" class="orl-bar-btn" data-orl-action="copy-join-url">🔗 คัดลอกลิงก์</button>
            <button type="button" class="orl-bar-btn" data-orl-action="open-participant-pad">📱 จำลองจอผู้เรียน</button>
            ${ROLE === "faculty" ? `<button type="button" class="orl-bar-btn" data-orl-action="open-custom-modal">+ เพิ่มคำถามสด</button>` : ""}
          </div>
        </div>

        <div class="orl-lobby-grid">
          <div class="orl-lobby-qr-panel">
            <button type="button" class="orl-stage-qr-box" data-orl-action="zoom-qr" title="คลิกเพื่อขยาย QR Code เต็มจอ">
              ${qrSvg}
            </button>
            <div class="orl-stage-join-steps">
              <div class="orl-step-badge">1. เปิดกล้องมือถือ / LINE สแกน QR Code</div>
              <div class="orl-url-pill">smartwoo.github.io/racm303-2569-student/#live</div>
              <div class="orl-step-badge">2. พิมพ์เลขท้ายรหัส 3 ตัว (เช่น <code>006</code>) เพื่อเข้าห้องรอคำถาม</div>
            </div>

            ${
              ROLE === "faculty"
                ? `
              <div class="orl-host-config-box">
                <div class="orl-cfg-row">
                  <span class="orl-cfg-lbl">ชุดคำถาม:</span>
                  <div class="orl-seg-group">
                    <button type="button" class="orl-seg-btn${state.presetMode === "all8" ? " is-active" : ""}" data-orl-preset="all8">ครบ ${ getAllQuestions().length } ข้อ</button>
                    <button type="button" class="orl-seg-btn${state.presetMode === "quick5" ? " is-active" : ""}" data-orl-preset="quick5">เน้นพลาดบ่อย 5 ข้อ</button>
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
                <span class="orl-players-num" data-orl-participant-count>${count}</span>
                <div>
                  <div class="orl-players-title">ผู้เข้าร่วมใน Live Lobby (จาก นศพ. 169 คน)</div>
                  <div class="orl-players-sub">พร้อมรับคำถามแบบ Kahoot (${deck.length} ข้อ · เฉลยเชื่อมเกณฑ์ O / S / M / U ทันที)</div>
                </div>
              </div>
              ${
                ROLE === "faculty" && state.answersByQ.size > 0
                  ? `<button type="button" class="orl-bar-btn is-subtle" data-orl-action="reset-session" title="ล้างคะแนนรอบเก่าเพื่อเริ่มรอบใหม่">↺ รีเซ็ตคะแนน</button>`
                  : ""
              }
            </div>

            <div class="orl-area-Checkin-strip" data-orl-area-strip>
              ${areasOrder
                .map((area) => {
                  const c = areaCounts[area] || 0;
                  return `<span class="orl-area-pill${c > 0 ? " has-joined" : ""}">${esc(area)} <strong>${c}</strong></span>`;
                })
                .join("")}
            </div>

            <div class="orl-players-wall" data-orl-participant-wall>
              ${buildJoinedChipsMarkup(48)}
            </div>

            <div class="orl-lobby-action-bar">
              <button type="button" class="orl-big-btn is-secondary" data-orl-action="continue-slides">
                ▶ ไปต่อเนื้อหาสไลด์ Orientation (Slide 02) &rarr;
                <small>ผู้เข้าร่วมถือมือถือค้างไว้ในโหมดรอคำถามได้ตลอดการบรรยาย</small>
              </button>
              ${
                ROLE === "faculty"
                  ? `
                <button type="button" class="orl-big-btn is-primary" data-orl-action="start-q0">
                  ⚡ เริ่มยิงคำถาม Recheck ข้อที่ 1 (${deck.length} ข้อ)
                  <small>ตรวจสอบความเข้าใจ Do's &amp; Don'ts &amp; เกณฑ์ O · S · M · U</small>
                </button>
              `
                  : `
                <button type="button" class="orl-big-btn is-primary" data-orl-action="open-participant-pad">
                  🙋 เปิดจอกดตอบคำถามบนเครื่องนี้
                  <small>${state.joined ? `เชื่อมต่อในชื่อ ${esc(getPlayerLabel(state))} แล้ว` : "คลิกเพื่อลงชื่อเข้าห้องรอคำถาม"}</small>
                </button>
              `
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderQuestionStageHtml() {
    const q = getCurrentQuestion();
    const deck = getActiveQuestionList();
    const stats = getQuestionStats(q);
    const remMs = getRemainingMs();
    const sec = Math.ceil(remMs / 1000);
    const durMs = Math.max(1000, (state.session.durationSec || 20) * 1000);
    const pct = Math.max(0, Math.min(100, (remMs / durMs) * 100));

    return `
      <div class="orl-stage is-question-stage">
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
                : `<button type="button" class="orl-bar-btn is-accent" data-orl-action="open-participant-pad">📱 เปิดปุ่มกดตอบ</button>`
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

  function renderRevealStageHtml() {
    const q = getCurrentQuestion();
    const deck = getActiveQuestionList();
    const stats = getQuestionStats(q);
    const maxCount = Math.max(1, ...stats.counts);

    let recheckInsightHtml = "";
    if (stats.total === 0) {
      recheckInsightHtml = `<div class="orl-insight-banner is-neutral">ℹ️ ยังไม่มีคำตอบที่ส่งเข้ามาในข้อนี้ — อาจารย์สามารถชวนผู้เรียนอภิปรายเกณฑ์ด้านล่างร่วมกันได้ทันที</div>`;
    } else if (stats.topWrongCount === 0) {
      recheckInsightHtml = `<div class="orl-insight-banner is-perfect">🎯 <strong>ยอดเยี่ยม! ผู้ตอบทั้ง ${stats.total} คน (100%) ตอบถูกต้องครบทุกคน</strong> — เข้าใจเกณฑ์ข้อนี้ตรงกันอย่างแม่นยำ</div>`;
    } else {
      const wrongMeta = CHOICE_META[stats.topWrongIdx];
      const hintText = (q.wrongHints && q.wrongHints[stats.topWrongIdx]) || "ตรวจสอบรายละเอียดเกณฑ์ที่ถูกต้องตามคู่มือรายวิชาด้านล่าง";
      recheckInsightHtml = `
        <div class="orl-insight-banner is-recheck">
          <div>
            <strong>🔍 Recheck จุดที่ผู้เข้าร่วมยังสับสน (${stats.pctCorrect}% ตอบถูก · เลือก ${wrongMeta.nameTh} ${stats.topWrongCount} คน):</strong>
            <span>${esc(hintText)}</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="orl-stage is-reveal-stage">
        <div class="orl-q-topbar">
          <div class="orl-q-meta">
            <span class="orl-q-num-pill">เฉลยข้อ ${state.session.qPos + 1} / ${deck.length}</span>
            <span class="orl-q-cat-pill">${esc(q.badge)}</span>
            <span class="orl-source-cite">📘 อ้างอิง: ${esc(q.sourceRef)}</span>
          </div>
          <div class="orl-q-stats-right">
            ${
              ROLE === "faculty"
                ? `
              <div class="orl-picker-wrap">
                <button type="button" class="orl-bar-btn" data-orl-action="toggle-q-picker">🔢 เลือกข้ออื่น ▾</button>
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
              <button type="button" class="orl-bar-btn" data-orl-action="continue-slides">▶ กลับไปสไลด์บรรยาย</button>
              <button type="button" class="orl-bar-btn is-primary-next" data-orl-action="next-question">
                ${state.session.qPos + 1 < deck.length ? `ข้อถัดไป (ข้อ ${state.session.qPos + 2}) →` : "🏆 ดูสรุปผล & Podium →"}
              </button>
            `
                : `<span class="orl-q-cat-pill">ตอบถูก ${stats.correctCount} / ${stats.total} คน (${stats.pctCorrect}%)</span>`
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
                    ${isCorrect ? `<span class="orl-rev-correct-badge">✓ คำตอบที่ถูก</span>` : ""}
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
            <span class="orl-rc-kicker">✅ DO · สิ่งที่ต้องปฏิบัติ</span>
            <p>${esc(q.doSummary)}</p>
          </div>
          <div class="orl-rc-box is-dont">
            <span class="orl-rc-kicker">🚫 DON'T · สิ่งที่ห้ามทำเด็ดขาด</span>
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

  function renderPodiumStageHtml() {
    const deck = getActiveQuestionList();
    const board = computeLeaderboard();
    const top3 = [board[0], board[1], board[2]];

    return `
      <div class="orl-stage is-podium-stage">
        <div class="orl-stage-topbar">
          <div class="orl-st-left">
            <span class="orl-live-pill is-lg"><span class="orl-dot is-online"></span> สรุปผล Recheck ความเข้าใจกติการายวิชา RACM 303</span>
            <span class="orl-st-sub">ทวนสอบความพร้อม Do's &amp; Don'ts และเกณฑ์ O / S / M / U ก่อนเริ่มเรียนคาบแรก</span>
          </div>
          <div class="orl-st-right">
            ${
              ROLE === "faculty"
                ? `
              <button type="button" class="orl-bar-btn" data-orl-action="back-to-lobby">📺 กลับหน้า Lobby</button>
              <button type="button" class="orl-bar-btn" data-orl-action="reset-session">🔄 เริ่มรอบใหม่</button>
            `
                : ""
            }
            <button type="button" class="orl-bar-btn is-primary-next" data-orl-action="continue-slides">▶ ไปต่อสไลด์ Orientation &rarr;</button>
          </div>
        </div>

        <div class="orl-podium-split">
          <div class="orl-diagnostic-panel">
            <h3 class="orl-panel-h3">📊 ความแม่นยำรายประเด็น (Class Rule Mastery)</h3>
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
                        ${ROLE === "faculty" ? `<button type="button" class="orl-reask-btn" data-orl-jump-q="${idx}">ดู/ถามซ้ำ</button>` : ""}
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

  function renderDeckLiveStageHtml() {
    const ph = state.session.phase;
    if (ph === "question") return renderQuestionStageHtml();
    if (ph === "reveal") return renderRevealStageHtml();
    if (ph === "podium") return renderPodiumStageHtml();
    return renderLobbyStageHtml();
  }

  /* ---------- 12. UI Surface 3: Mobile Participant Controller Modal (#live) ---------- */
  function ensureParticipantModal() {
    let el = document.getElementById("orientParticipantModal");
    if (el) return el;
    el = document.createElement("div");
    el.id = "orientParticipantModal";
    el.className = "orl-mobile-backdrop";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "RACM 303 Live Orientation Participant");
    el.hidden = true;
    document.body.appendChild(el);

    el.addEventListener("click", (ev) => {
      const actBtn = ev.target.closest("[data-orl-mact]");
      if (actBtn) {
        const act = actBtn.getAttribute("data-orl-mact");
        if (act === "close") {
          closeParticipantModal();
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
        } else if (act === "join-now") {
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
          publishMyPresence();
          publishPacket("cmd", { type: "who_is_here" }, false);
          renderParticipantModal();
        } else if (act === "edit-profile") {
          state.joined = false;
          safeSet("racm303_orient_joined_v1", "0");
          renderParticipantModal();
        } else if (act === "view-slides") {
          closeParticipantModal();
          if (window.RACM_ORIENTATION_DECK) {
            window.RACM_ORIENTATION_DECK.open(state.session.hostSlideIdx || 0);
          }
        } else if (act === "submit-choice") {
          const cIdx = Number(actBtn.getAttribute("data-choice-idx"));
          submitMyAnswer(cIdx);
        }
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

  function mountOverlayToActiveRoot(el) {
    if (!el) return;
    const hostParent = document.fullscreenElement || document.body;
    if (hostParent && el.parentElement !== hostParent) {
      hostParent.appendChild(el);
    }
  }

  function renderParticipantModal() {
    const modal = ensureParticipantModal();
    if (!state.participantModalOpen) {
      modal.hidden = true;
      document.body.classList.remove("orl-participant-open");
      return;
    }
    mountOverlayToActiveRoot(modal);
    modal.hidden = false;
    document.body.classList.add("orl-participant-open");

    const cloudOk = isCloudConnected();
    const board = computeLeaderboard();
    const myRankIdx = board.findIndex((x) => x.participantId === state.participantId);
    const myEntry = myRankIdx >= 0 ? board[myRankIdx] : { score: 0, correctCount: 0 };

    let bodyHtml = "";
    if (!state.joined) {
      const prefill = state.studentId
        ? `${state.studentId} ${state.nickname ? `(${state.nickname})` : ""}`
        : state.nickname || "";
      const initialMatches = searchRosterCandidates(state.studentId || "");
      bodyHtml = `
        <div class="orl-m-card">
          <div class="orl-m-badge">🎮 RACM 303 · LIVE ORIENTATION</div>
          <h2 class="orl-m-title">เข้าร่วมห้องรอคำถาม Recheck</h2>
          <p class="orl-m-desc">พิมพ์เลขท้ายรหัสนักศึกษา 3 หลัก หรือชื่อเล่น เพื่อขึ้นชื่อบนหน้าจอ Lobby และรอกดตอบคำถาม Do's &amp; Don'ts / เกณฑ์ O·S·M·U</p>

          <label class="orl-m-lbl" for="orlStuLookupInput">รหัสนักศึกษา 3 ตัวท้าย / ชื่อเล่น</label>
          <input id="orlStuLookupInput" class="orl-m-input" type="search" autocomplete="off" value="${esc(prefill)}" placeholder="เช่น 006, เดือนอ้าย, มิน, 6702xxx…">

          ${
            state.studentId
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

          <div class="orl-m-lbl" style="margin-top:8px">เลือกไอคอนประจำตัว</div>
          <div class="orl-ava-picker">
            ${AVATARS.map(
              (a) =>
                `<button type="button" class="orl-ava-btn${state.avatar === a ? " is-picked" : ""}" data-orl-mact="pick-avatar" data-ava="${a}">${a}</button>`
            ).join("")}
          </div>

          <button type="button" class="orl-m-join-btn" data-orl-mact="join-now">🚀 เข้าร่วม Live Lobby ทันที</button>
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
            <p class="orl-m-desc">รอลุ้นผลเฉลยและทบทวนเกณฑ์ O / S / M / U พร้อมเพื่อนทั้งห้องบนหน้าจอหลัก…</p>
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
            <div><strong>⚖️ O·S·M·U:</strong> ${esc(q.osmuRule)}</div>
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
          <div class="orl-m-badge">🏆 สรุปผล Recheck ของคุณ</div>
          <h2 class="orl-m-title">${esc(state.avatar)} ${esc(getPlayerLabel(state))}</h2>
          <div class="orl-m-rank-strip" style="margin:8px 0 12px">
            <span>คะแนนรวม: <strong>${myEntry.score.toLocaleString()} pts</strong></span>
            <span>ตอบถูก: <strong>${myEntry.correctCount} / ${deck.length} ข้อ</strong></span>
            <span>อันดับ: <strong>#${myRankIdx >= 0 ? myRankIdx + 1 : "-"}</strong></span>
          </div>
          ${
            missedList.length === 0
              ? `<div class="orl-m-selected-stu">🌟 ยอดเยี่ยม! คุณตอบถูกครบทุกข้อ พร้อมลุย RACM 303 อย่างมั่นใจ</div>`
              : `
                <div class="orl-m-lbl">📌 กติกาสำคัญที่ควรทบทวนเตือนตัวเอง:</div>
                <div class="orl-m-recheck-notes">
                  ${missedList.map((q) => `<div>• <strong>${esc(q.badge)}:</strong> ${esc(q.osmuRule)}</div>`).join("")}
                </div>
              `
          }
          <button type="button" class="orl-m-join-btn" data-orl-mact="close" style="margin-top:14px">เข้าใช้งาน Student Portal ต่อ &rarr;</button>
        </div>
      `;
    } else {
      // Waiting in Lobby!
      bodyHtml = `
        <div class="orl-m-card is-centered">
          <div class="orl-m-you-in">🎉 You're in! เชื่อมต่อสำเร็จ</div>
          <div class="orl-m-player-hero">
            <span class="orl-m-big-ava">${esc(state.avatar)}</span>
            <div>
              <div class="orl-m-pname">${esc(getPlayerLabel(state))}</div>
              <div class="orl-m-parea">${esc(state.area ? `กลุ่ม รพ.${state.area}` : "ผู้เข้าร่วม RACM 303")}</div>
            </div>
          </div>

          <div class="orl-m-wait-box">
            <div class="orl-m-spinner" aria-hidden="true"></div>
            <strong>กำลังรออาจารย์ปล่อยคำถาม Recheck บนหน้าจอ…</strong>
            <p>เมื่ออาจารย์เริ่มคำถาม หน้าจอมือถือนี้จะเปลี่ยนเป็นปุ่มกดตอบ 4 สีอัตโนมัติ (ผู้เข้าร่วมในห้องขณะนี้ <strong data-orl-participant-count>${state.participants.size}</strong> คน)</p>
            <div class="orl-m-slide-tracker">
              📡 สไลด์ปัจจุบัน: <strong>Slide ${esc(state.session.hostSlideNum || "01")}</strong> · ${esc(state.session.hostSlideTitle || "Orientation")}
            </div>
          </div>

          <div class="orl-m-foot-btns">
            <button type="button" class="orl-m-sec-btn" data-orl-mact="view-slides">📖 เปิดอ่านสไลด์ควบคู่</button>
            <button type="button" class="orl-m-sec-btn" data-orl-mact="edit-profile">✏️ เปลี่ยนชื่อ/รหัส</button>
          </div>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="orl-m-shell">
        <div class="orl-m-topbar">
          <span class="orl-live-pill"><span class="orl-dot${cloudOk ? " is-online" : ""}"></span> RACM 303 LIVE</span>
          <span class="orl-m-score-pill">${myEntry.score.toLocaleString()} pts</span>
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
        renderAllSurfaces(false);
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
    el.hidden = false;

    if (state.qrZoomOpen) {
      const joinUrl = getJoinUrl();
      el.innerHTML = `
        <div class="orl-qr-zoom-card">
          <div class="orl-qz-top">
            <span class="orl-live-pill is-lg"><span class="orl-dot is-online"></span> สแกนเข้าร่วม Live Orientation RACM 303</span>
            <button type="button" class="orl-m-close" data-orl-aux-close="1">&times;</button>
          </div>
          <div class="orl-qz-svg-wrap">
            ${buildQrSvg(joinUrl, "is-giant-qr")}
          </div>
          <div class="orl-qz-url">${esc(joinUrl)}</div>
          <div class="orl-qz-foot">
            <span>เข้าร่วมแล้ว <strong data-orl-participant-count>${state.participants.size}</strong> / 169 คน</span>
            <div class="orl-seg-group">
              <button type="button" class="orl-seg-btn${state.qrUrlMode === "prod" ? " is-active" : ""}" data-orl-url-mode="prod">GitHub Pages (มือถือ 5G)</button>
              <button type="button" class="orl-seg-btn${state.qrUrlMode === "current" ? " is-active" : ""}" data-orl-url-mode="current">ลิงก์โดเมนปัจจุบัน</button>
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
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
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
    const count = state.participants.size;
    document.querySelectorAll("[data-orl-participant-count]").forEach((el) => {
      el.textContent = String(count);
    });
    document.querySelectorAll("[data-orl-participant-chips]").forEach((el) => {
      el.innerHTML = buildJoinedChipsMarkup(6);
    });
    document.querySelectorAll("[data-orl-participant-wall]").forEach((el) => {
      el.innerHTML = buildJoinedChipsMarkup(48);
    });
    const areaStrip = document.querySelector("[data-orl-area-strip]");
    if (areaStrip) {
      const areaCounts = getAreaCounts();
      const areasOrder = ["กุฉินารายณ์", "ด่านซ้าย", "ตะกั่วป่า", "ท่าวังผา", "เพชรบูรณ์ 1", "เพชรบูรณ์ 2", "อุบลรัตน์", "ท่าสองยาง", "อุ้มผาง"];
      areaStrip.innerHTML = areasOrder
        .map((area) => {
          const c = areaCounts[area] || 0;
          return `<span class="orl-area-pill${c > 0 ? " has-joined" : ""}">${esc(area)} <strong>${c}</strong></span>`;
        })
        .join("");
    }
    const q = getCurrentQuestion();
    if (q) {
      const stats = getQuestionStats(q);
      document.querySelectorAll("[data-orl-answered-count]").forEach((el) => {
        el.textContent = String(stats.total);
      });
    }
    const cloudOk = isCloudConnected();
    document.querySelectorAll("[data-orl-sync-label]").forEach((el) => {
      el.textContent = cloudOk ? "ซิงค์สดข้ามอุปกรณ์พร้อมใช้งาน" : "พร้อมซิงค์ในเครือข่าย";
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
    if (ROLE !== "student") return;
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
        ? `⚡ อาจารย์กำลังถามคำถามสด Orientation! กดตอบทันที &rarr;`
        : `🟢 ห้อง Orientation Live เปิดอยู่ (${state.participants.size} คน) · กดเข้าร่วม`;
  }

  // Global delegated click handler for Cover Card & Deck Live Stage buttons
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
    } else if (act === "copy-join-url") {
      const url = getJoinUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          btn.textContent = "✅ คัดลอกลิงก์แล้ว!";
          setTimeout(() => renderAllSurfaces(true), 1400);
        }).catch(() => {});
      }
    } else if (act === "open-participant-pad") {
      openParticipantModal();
    } else if (act === "continue-slides") {
      if (window.RACM_ORIENTATION_DECK && typeof window.RACM_ORIENTATION_DECK.resumeSlidesFromLobby === "function") {
        window.RACM_ORIENTATION_DECK.resumeSlidesFromLobby();
      }
    }
  });

  function checkAutoJoinUrl() {
    const params = new URLSearchParams(window.location.search);
    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (params.get("orient_join") === "1" || h === "live" || h === "orient-live") {
      setTimeout(() => {
        openParticipantModal();
      }, 60);
    }
  }

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && hasOpenOverlay()) {
      ev.preventDefault();
      ev.stopPropagation();
      closeTopOverlay();
    }
  }, true);

  window.addEventListener("hashchange", checkAutoJoinUrl);

  document.addEventListener("fullscreenchange", () => {
    if (state.participantModalOpen) mountOverlayToActiveRoot(document.getElementById("orientParticipantModal"));
    if (state.qrZoomOpen || state.customPollModalOpen) mountOverlayToActiveRoot(document.getElementById("orientLiveAuxOverlay"));
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (state.joined && state.role === "student") publishMyPresence();
      publishPacket("cmd", { type: "who_is_here" }, false);
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

  initTransports();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAutoJoinUrl);
  } else {
    checkAutoJoinUrl();
  }

  window.RACM_ORIENTATION_LIVE = {
    renderCoverCardHtml,
    renderDeckLiveStageHtml,
    openParticipantModal,
    closeParticipantModal,
    hasOpenOverlay,
    closeTopOverlay,
    notifyHostSlide,
    getParticipantCount: () => state.participants.size,
    getPhase: () => state.session.phase,
    buildQrSvg
  };
})();
