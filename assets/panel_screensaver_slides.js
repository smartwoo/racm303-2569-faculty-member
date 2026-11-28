/* ==========================================================================
   RACM 303 (2569) — Apple TV Aerial & Netflix Idle Screensaver Slide Engine
   Reusable Multi-Panel Stage + Complete 21-Slide Deck for GLOBAL (25 Nov 2569)
   Works seamlessly across Faculty Member (Red) and Student (Blue) Portals
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const ASSET_VER = "20261125global12";
  const IMG_DIR = "assets/images/panel_screensaver";
  const MODERATOR_PPTX_HREF =
    ROLE === "faculty" ? `exports/pptx/RACM303_2569_Physician_Roles_Moderator.pptx?v=${ASSET_VER}` : "";

  const PROD_STUDENT_BASE = "https://smartwoo.github.io/racm303-2569-student/";
  const QA_HASH_SLUG = "panel-qa";
  const SYNC_BC_NAME = "racm303_panel_deck_sync_v1";
  const QA_BC_NAME = "racm303_panel_live_qa_v1";
  const MQTT_TOPIC = "racm303/2569/panel_deck_sync/v1";
  const QA_MQTT_NS = "racm303/2569/panel_qa/v1";
  const MQTT_BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://test.mosquitto.org:8081/mqtt"
  ];
  const PEER_HOST_IDS = [
    "racm303-2569-pqa-host-1",
    "racm303-2569-pqa-host-2",
    "racm303-2569-pqa-host-3"
  ];
  const STALE_QA_MS = 14 * 24 * 60 * 60 * 1000;
  const QA_TARGET_OPTIONS = [
    "วิทยากรทุกท่าน",
    "นพ.ทักษพล",
    "นพ.วิรุฬ",
    "ศ.พญ.สุวรรณา"
  ];
  const IDLE_HIDE_MS = 3600;
  const AMBIENT_CYCLE_MS = 12000;
  const STATION_CYCLE_MS = 5800;

  /* ---------- Pure-JS ISO/IEC 18004 QR Code SVG Generator (Versions 1..10, ECC-M, 8-Mask Optimal) ---------- */
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
  function buildQrSvg(text) {
    const key = String(text || "");
    if (qrSvgCache.has(key)) return qrSvgCache.get(key);
    const bytes = Array.from(new TextEncoder().encode(key));
    let ver = 10;
    for (let v = 1; v <= 10; v += 1) {
      const [, b1, d1, b2, d2] = QR_ECC_M[v];
      const totalData = b1 * d1 + b2 * d2;
      const lenBits = v <= 9 ? 8 : 16;
      if (4 + lenBits + bytes.length * 8 <= totalData * 8) {
        ver = v;
        break;
      }
    }
    const [ecCw, b1, d1, b2, d2] = QR_ECC_M[ver];
    const totalData = b1 * d1 + b2 * d2;
    const bits = [];
    const pushBits = (val, n) => {
      for (let i = n - 1; i >= 0; i -= 1) bits.push((val >>> i) & 1);
    };
    pushBits(0b0100, 4);
    pushBits(bytes.length, ver <= 9 ? 8 : 16);
    bytes.forEach((b) => pushBits(b, 8));
    for (let i = 0; i < 4 && bits.length < totalData * 8; i += 1) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
      codewords.push(byte);
    }
    let padToggle = true;
    while (codewords.length < totalData) {
      codewords.push(padToggle ? 0xec : 0x11);
      padToggle = !padToggle;
    }

    const blocksData = [];
    const blocksEc = [];
    let offset = 0;
    for (let b = 0; b < b1 + b2; b += 1) {
      const len = b < b1 ? d1 : d2;
      const slice = codewords.slice(offset, offset + len);
      offset += len;
      blocksData.push(slice);
      blocksEc.push(rsRemainder(slice, ecCw));
    }
    const interleaved = [];
    const maxDataLen = Math.max(d1, d2);
    for (let i = 0; i < maxDataLen; i += 1) {
      for (let bi = 0; bi < blocksData.length; bi += 1) {
        if (i < blocksData[bi].length) interleaved.push(blocksData[bi][i]);
      }
    }
    for (let i = 0; i < ecCw; i += 1) {
      for (let bi = 0; bi < blocksEc.length; bi += 1) interleaved.push(blocksEc[bi][i]);
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
      for (let b = 7; b >= 0; b -= 1) allBits.push((interleaved[i] >>> b) & 1);
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

    const qz = 4;
    const vb = size + qz * 2;
    let path = "";
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (bestMat[r][c]) path += `M${c + qz},${r + qz}h1v1h-1z`;
      }
    }
    const svg = `<svg viewBox="0 0 ${vb} ${vb}" shape-rendering="crispEdges" role="img" aria-label="QR Code ส่งคำถามสด"><rect width="${vb}" height="${vb}" fill="#ffffff"/><path d="${path}" fill="#090d16"/></svg>`;
    qrSvgCache.set(key, svg);
    return svg;
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ==========================================================================
     PANEL DECKS DATA REGISTRY (Reusable Across All 4 RACM 303 Panel Sessions)
     ========================================================================== */
  const PANEL_DECKS = {
    "w1-d1-global": {
      id: "w1-d1-global",
      hashSlug: "panel-global",
      code: "GLOBAL",
      seriesTag: "RACM 303 PANEL SERIES · EPISODE 01",
      shortTitle: "GLOBAL · จากการดูแลผู้ป่วยรายบุคคลสู่เวชปฏิบัติฐานระบบ (25 พ.ย. 69)",
      sessionMeta: "วันพุธที่ 25 พฤศจิกายน 2569 · 13.30 – 17.00 น. · ห้อง 2C2-03",
      sessionLimitMin: 150,
      pptxHref: MODERATOR_PPTX_HREF,
      qaLoopRange: [7, 12], // Slides 08..13 (0-indexed 7..12: Q1..Q4, Live Q&A, Q5)
      slides: [
        {
          id: "g-s01",
          num: "01",
          navLabel: "01 · เปิดเวทีเสวนา",
          type: "cover",
          bilingualCover: true,
          bg: "bg_01_bedside_horizon.jpg",
          kb: "kb-a",
          orbs: ["rgba(56,189,248,0.28)", "rgba(245,158,11,0.24)", "rgba(99,102,241,0.22)"],
          kicker: "RACM 303 · วันพุธที่ 25 พฤศจิกายน 2569 · 13.30 – 17.00 น. · ห้อง 2C2-03",
          kickerSub: "PANEL DISCUSSION · BEDSIDE TO SYSTEMS-BASED PRACTICE",
          title: "จากการดูแลผู้ป่วยรายบุคคลสู่เวชปฏิบัติฐานระบบ: เรียนรู้บทบาทและเส้นทางวิชาชีพจากแพทย์ผู้มีประสบการณ์ในการสร้างเสริมระบบสุขภาพ เพื่อลดความเหลื่อมล้ำและเอื้อให้สังคมเติบโตได้อย่างปลอดภัย ท่ามกลางสิ่งแวดล้อมที่เกื้อกูลชีวิตอย่างยั่งยืน",
          enSubtitle: "(From Bedside to Systems-Based Practice: Learning Roles and Career Pathways from Experienced Physicians in Strengthening Health Systems to Reduce Inequity and Foster Safe, Thriving Communities Within a Sustainable, Life-Supporting Environment)",
          cast: [
            { initials: "ทพ", groupTag: "วิทยากรร่วมเสวนา (Panelist)", photo: `${IMG_DIR}/dicut_thaksaphon.png?v=${ASSET_VER}`, name: "นพ.ทักษพล ธรรมรังสี", role: "(ผู้อำนวยการมูลนิธิไชน่าเมดิคอลบอร์ด China Medical Board (CMB) Foundation)" },
            { initials: "วร", groupTag: "วิทยากรร่วมเสวนา (Panelist)", photo: `${IMG_DIR}/dicut_wirun.png?v=${ASSET_VER}`, name: "นพ.วิรุฬ ลิ้มสวาท", role: "หัวหน้ากลุ่มงานวิจัยสังคมและสุขภาพ กระทรวงสาธารณสุข" },
            { initials: "สว", groupTag: "วิทยากรร่วมเสวนา (Panelist)", photo: `${IMG_DIR}/dicut_suwanna.png?v=${ASSET_VER}`, name: "ศาสตราจารย์เกียรติคุณ พญ.สุวรรณา เรืองกาญจนเศรษฐ์", role: "รองผู้อำนวยการฝ่ายบริหาร ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ (ศจย.)" },
            { initials: "ณว", isModerator: true, groupTag: "ผู้ดำเนินรายการ (Moderator)", photo: "assets/photos/advisor_nuttawut.jpg", name: "อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์", role: "ภาควิชาเวชศาสตร์ชุมชน รพ.รามาธิบดี ม.มหิดล" }
          ],
          moderatorNotes: {
            lead: "เปิดวงด้วยการแนะนำหัวข้อเสวนา วัตถุประสงค์การเรียนรู้ทั้ง 4 ข้อ และไทม์ไลน์ของวิทยากรทั้งสามท่าน ใช้ประวัติเป็นทางเข้าให้แต่ละท่านเลือกเล่าเหตุการณ์จริงของตนเอง แล้วถามคำถามหลักชุดเดียวกันตามลำดับ",
            bullets: [
              "ต่อยอดแนวทางจากกรอบการสะท้อนคิด What? → So what? → Now what? และ Public Narrative",
              "สามารถกดปุ่ม 🌊 โหมด Screensaver ช่วงรอนักศึกษาเข้าห้อง 13.15–13.30 น. เพื่อให้จอฉายวนภาพบรรยากาศอัตโนมัติแบบ Apple TV / Netflix หรือกด 📱 QR เพื่อให้นักศึกษาเปิดสไลด์คู่ขนานบนไอแพด/มือถือ"
            ],
            refs: [
              { label: "Ganz และคณะ • Public Narrative (Harvard Kennedy School)", url: "https://www.hks.harvard.edu/publications/crafting-public-narrative-enable-collective-action-pedagogy-leadership-development" },
              { label: "University of Edinburgh • What? So what? Now what?", url: "https://reflection.ed.ac.uk/reflectors-toolkit/reflecting-on-experience/what-so-what-now-what" }
            ]
          }
        },
        {
          id: "g-s02-lo",
          num: "02",
          navLabel: "02 · วัตถุประสงค์ (LO 1–4)",
          type: "objectives",
          bg: "bg_06_ripples_perspective.jpg",
          kb: "kb-d",
          orbs: ["rgba(56,189,248,0.28)", "rgba(16,185,129,0.22)", "rgba(245,158,11,0.22)"],
          kicker: "วัตถุประสงค์การเรียนรู้ (LEARNING OBJECTIVES)",
          kickerSub: "เชื่อมตรงวัตถุประสงค์รายวิชาข้อที่ 5 · บทบาทแพทย์ในระบบสุขภาพ (HSS & SBP)",
          stemLead: "จากการรับฟังและแลกเปลี่ยนมุมมองร่วมกับวิทยากรทั้ง 3 ท่านในเวทีเสวนา (Panel Discussion) นักศึกษาแพทย์สามารถ",
          objectives: [
            {
              num: "LO 1",
              tag: "Bedside → SBP & HSS",
              text: "ถอดบทเรียนบทบาทและเส้นทางวิชาชีพแพทย์ต่อผู้ป่วยและสังคมจากประสบการณ์การทำงานจริงของวิทยากร เพื่อเข้าใจการขยับขยายมุมมองจากการดูแลผู้ป่วยรายบุคคลอย่างองค์รวม มาสู่เวชปฏิบัติฐานระบบ (Systems-Based Practice: SBP) และวิทยาระบบสุขภาพ (Health Systems Science: HSS)"
            },
            {
              num: "LO 2",
              tag: "Health Advocate & HPSR",
              text: "วิเคราะห์บทบาทแพทย์ในฐานะผู้เสริมพลังชุมชน ผู้ชี้นำสุขภาพ (Health Advocate) และนักวิจัยนโยบายและระบบสุขภาพ (Health Policy and Systems Researcher: HPSR) ที่ไม่หยุดอยู่เพียงการรักษาเฉพาะราย แต่นำปัญหาสุขภาพที่พบในคลินิก ครอบครัว และชุมชน มาทำความเข้าใจปัจจัยเชิงโครงสร้างและบริบททางสังคม ตลอดจนสร้างและจัดการความรู้ เพื่อกล้าชี้นำสังคมและขับเคลื่อนนโยบายสาธารณะบนพื้นฐานทางวิชาการ"
            },
            {
              num: "LO 3",
              tag: "Change Agent · Global & Planetary Health",
              text: "สังเคราะห์บทบาทแพทย์ในฐานะผู้นำการเปลี่ยนแปลง (Change Agent) ที่ประสานความร่วมมือกับทีมสหวิชาชีพและภาคส่วนต่าง ๆ ทั้งในและนอกระบบสุขภาพ เพื่อยกระดับสุขภาวะตั้งแต่ระดับพื้นที่และประเทศ (เช่น การสร้างเสริมสุขภาพและการชี้นำสังคมในการรณรงค์ไม่สูบบุหรี่และบุหรี่ไฟฟ้า) เชื่อมต่อไปยังสุขภาพโลก (Global Health) ที่มุ่งแก้ปัญหาสุขภาพประชากรข้ามพรมแดนและลดความเหลื่อมล้ำผ่านความร่วมมือระหว่างประเทศ ตลอดจนสุขภาพของพิภพโลก (Planetary Health) ที่ให้ความสำคัญกับความยั่งยืนทางสิ่งแวดล้อม โดยมองลึกถึงความเชื่อมโยงระหว่างสุขภาพของมนุษย์กับระบบนิเวศของโลกซึ่งมนุษย์กำลังเปลี่ยนแปลงไป"
            },
            {
              num: "LO 4",
              tag: "Reflective Growth & Physician Attributes",
              text: "สะท้อนคิดมุมมองและแรงบันดาลใจจากการแลกเปลี่ยนกับวิทยากร เพื่อวางแนวทางพัฒนาตนเองทั้งด้าน HSS และ SBP ควบคู่กับการบ่มเพาะคุณสมบัติสำคัญของแพทย์ (อาทิ การมององค์รวมและการคิดเชิงระบบ ความใฝ่รู้ตลอดชีวิต การสื่อสารและทำงานร่วมกับผู้อื่น คุณธรรมจริยธรรม และจิตสาธารณะเพื่อชุมชนและสังคม) บนเส้นทางวิชาชีพในอนาคต"
            }
          ],
          moderatorNotes: {
            lead: "เชื่อมเป้าหมายการเรียนรู้ 4 ข้อให้เห็นภาพร่วมกันสั้น ๆ ก่อนเข้าสู่ไทม์ไลน์วิทยากร: (1) ข้างเตียงสู่ SBP & HSS · (2) Health Advocate & HPSR · (3) Change Agent สู่ Global & Planetary Health · (4) การสะท้อนคิดพัฒนาตนเอง",
            bullets: [
              "ไม่ต้องอ่านตัวอักษรทุกคำบนจอ ให้ชี้แก่นว่าทั้ง 4 ข้อจะปรากฏมีชีวิตขึ้นมาผ่านเรื่องเล่าจริงของอาจารย์ทั้ง 3 ท่าน และช่วง Q&A 60 นาทีของนักศึกษา",
              "ย้ำว่าตอนท้ายคาบ (LO 4) นักศึกษาจะได้ตกผลึก 1 ประโยคสิ่งที่จะลองทำต่อในวอร์ดและพื้นที่ภาคสนาม (ต่อยอดสู่ SRN 1)"
            ],
            refs: [
              { label: "AMA • Health Systems Science", url: "https://www.ama-assn.org/education/changemeded-initiative/give-your-medical-students-head-start-health-systems-science" },
              { label: "AMEE • Planetary health & sustainable healthcare education", url: "https://pubmed.ncbi.nlm.nih.gov/33602043/" }
            ]
          }
        },
        {
          id: "g-s02",
          num: "03",
          navLabel: "03 · นพ.ทักษพล",
          type: "timeline",
          dicutImg: "dicut_thaksaphon.png",
          roleSubtitle: "ผู้อำนวยการมูลนิธิไชน่าเมดิคอลบอร์ด China Medical Board (CMB) Foundation",
          bg: "bg_02_nahwa_to_world.jpg",
          kb: "kb-b",
          orbs: ["rgba(245,158,11,0.36)", "rgba(14,165,233,0.24)", "rgba(16,185,129,0.20)"],
          kicker: "เส้นทางรถไฟสายวิชาชีพ · วิทยากรท่านที่ 1 · ครบทั้ง 6 สถานี",
          kickerSub: "จากโรงพยาบาลชุมชนริมฝั่งโขง สู่นโยบายสุขภาพระดับประเทศ องค์การอนามัยโลก และมูลนิธิไชน่าเมดิคอลบอร์ด",
          title: "นพ.ทักษพล ธรรมรังสี",
          haloLogos: [
            { key: "moph", logo: "logo_moph.png", label: "รพ.นาหว้า · สธ." },
            { key: "siriraj", logo: "logo_siriraj.png", label: "ศิริราชพยาบาล" },
            { key: "massey", logo: "logo_massey.png", label: "Massey Univ." },
            { key: "thaihealth", logo: "logo_thaihealth.png", label: "ศวส. · สสส." },
            { key: "ihpp", logo: "logo_ihpp.png", label: "IHPP" },
            { key: "who", logo: "logo_who.png", label: "WHO SEARO" },
            { key: "cmb", logo: "logo_cmb.png", label: "CMB Foundation" }
          ],
          wallPhotos: [
            { img: "bg_02_nahwa_to_world.jpg", label: "01 · รพ.นาหว้า นครพนม", pinIdx: 0 },
            { img: "st_thak_02_massey.jpg", label: "02 · Massey Ph.D.", pinIdx: 1 },
            { img: "bg_05_compass_crossroads.jpg", label: "03 · ผอ.ศวส. (CAS)", pinIdx: 2 },
            { img: "st_thak_05_who.jpg", label: "04 · ผอ.IHPP & WHO", pinIdx: 3 },
            { img: "st_suw_05_assembly.jpg", label: "05 · DPM · WHO SEARO", pinIdx: 4 },
            { img: "st_thak_06_cmb.jpg", label: "06 · ผอ.CMB Foundation", pinIdx: 5 }
          ],
          milestones: [
            {
              year: "2539–2547",
              shortStop: "รพ.นาหว้า",
              orgKey: "moph",
              logo: "logo_moph.png",
              logoLabel: "สธ. / ศิริราช",
              roleTag: "Bedside & Rural Hospital",
              sceneLabel: "📍 รพ.นาหว้า จ.นครพนม · ลุ่มน้ำโขง",
              bg: "bg_02_nahwa_to_world.jpg",
              headline: "แพทย์ รพ.ชุมชนริมฝั่งโขง — รพ.นาหว้า จ.นครพนม",
              text: "จบแพทยศาสตร์ศิริราช (2539) ปฏิบัติงานดูแลผู้ป่วยและชุมชนที่ รพ.นาหว้า ต่อสาธารณสุขศาสตรมหาบัณฑิต ม.มหิดล (2544) และเริ่มงานวิจัยระบบสุขภาพที่ IHPP (2546)",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "คนไข้ซ้ำเดิมหน้าห้องตรวจ ชี้ให้เห็นว่าลำพังการรักษาเฉพาะรายไม่พอ ต้องขยับไปแก้ที่ระบบสุขภาพชุมชน"
            },
            {
              year: "2551",
              shortStop: "Massey Ph.D.",
              orgKey: "massey",
              logo: "logo_massey.png",
              logoLabel: "Massey Univ.",
              roleTag: "Health Policy Research",
              sceneLabel: "📍 Massey University · New Zealand",
              bg: "st_thak_02_massey.jpg",
              headline: "ปริญญาเอกนโยบายสุขภาพ — Massey University นิวซีแลนด์",
              text: "วิจัยดุษฎีนิพนธ์กระบวนการกำหนดนโยบายแอลกอฮอล์ไทย ถอดรหัสกลไกเศรษฐศาสตร์การเมืองและปัจจัยกำหนดสุขภาพเชิงพาณิชย์",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "นโยบายสุขภาพไม่ได้ขับเคลื่อนด้วยหลักฐานการแพทย์ลำพัง แต่ต้องเข้าใจบริบทสังคมและการเมืองของนโยบาย"
            },
            {
              year: "2552–2556",
              shortStop: "ผอ.ศวส.",
              orgKey: "thaihealth",
              logo: "logo_thaihealth.png",
              logoLabel: "ศวส. · สสส.",
              roleTag: "Evidence-to-Policy",
              sceneLabel: "📍 ศูนย์วิจัยปัญหาสุรา (ศวส.)",
              bg: "bg_05_compass_crossroads.jpg",
              headline: "ผู้อำนวยการศูนย์วิจัยปัญหาสุรา (ศวส. / CAS)",
              text: "สร้างและจัดการความรู้เชิงระบบเพื่อคุ้มครองสังคมจากผลกระทบแอลกอฮอล์และโรคไม่ติดต่อเรื้อรัง (NCDs) สู่มาตรการกฎหมายระดับประเทศ",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "แปลงงานวิจัยระบาดวิทยาให้เป็น ‘ปัญญาปฏิบัติ’ เพื่อชี้นำสังคมและลดความสูญเสียเชิงโครงสร้าง"
            },
            {
              year: "2558 / 2565",
              shortStop: "ผอ.IHPP · WHO",
              orgKey: "ihpp",
              logo: "logo_ihpp.png",
              logoLabel: "IHPP",
              roleTag: "National HPSR & Regional NCDs",
              sceneLabel: "📍 สำนักงานพัฒนานโยบายสุขภาพระหว่างประเทศ (IHPP) & WHO SEARO",
              bg: "st_thak_05_who.jpg",
              headline: "ผู้อำนวยการ IHPP และ ผอ.ฝ่ายโรคไม่ติดต่อฯ WHO SEARO",
              text: "นำทีมวิจัยระบบสุขภาพระดับชาติ (IHPP · 2558, 2565) ควบคู่บทบาท Director, NCDs & Environmental Health ณ WHO SEARO (ก.ค. 2558)",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "เชื่อมหลักฐานวิชาการ พลังสังคม และกลไกนโยบายสาธารณะ ขยายผลจากประเทศไทยสู่ระดับภูมิภาค"
            },
            {
              year: "2567–2568",
              shortStop: "DPM · WHO SEARO",
              orgKey: "who",
              logo: "logo_who.png",
              logoLabel: "WHO SEARO",
              roleTag: "Global Health Governance",
              sceneLabel: "📍 WHO South-East Asia Regional Office",
              bg: "st_suw_05_assembly.jpg",
              headline: "Director of Programme Management — WHO SEARO",
              text: "กำกับยุทธศาสตร์และบริหารแผนงานความร่วมมือระบบสุขภาพของประเทศสมาชิกในภูมิภาค รวมถึงงานป้องกันการบาดเจ็บและระบบบริการยั่งยืน",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "Global Health คือการประสานความร่วมมือข้ามพรมแดนเพื่อลดความเหลื่อมล้ำและเสริมระบบสุขภาพให้ยั่งยืน"
            },
            {
              year: "2569",
              shortStop: "ผอ.CMB",
              orgKey: "cmb",
              logo: "logo_cmb.png",
              logoLabel: "CMB Foundation",
              roleTag: "Regional Health Systems Leadership",
              sceneLabel: "📍 มูลนิธิไชน่าเมดิคอลบอร์ด (CMB Foundation · กรุงเทพฯ)",
              bg: "st_thak_06_cmb.jpg",
              headline: "ผู้อำนวยการมูลนิธิไชน่าเมดิคอลบอร์ด China Medical Board (CMB) Foundation",
              text: "เริ่มดำรงตำแหน่ง ม.ค. 2569 ขับเคลื่อนความร่วมมือสถาบันการแพทย์ทั่วเอเชียเพื่อพัฒนาศักยภาพผู้นำวิชาชีพสุขภาพและเวชปฏิบัติฐานระบบ (SBP)",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "บ่มเพาะแพทย์รุ่นใหม่ให้มองเห็นทั้งคนไข้ตรงหน้าและโครงสร้างระบบสุขภาพที่โอบอุ้มสังคม"
            }
          ],
          footnote: "คลิกที่การ์ดแต่ละสถานีเพื่อขยายอ่านรายละเอียด · กดลูกศร → / Space 1 คลิกเพื่อไปยังวิทยากรท่านถัดไป · อ้างอิงหน้า 20",
          moderatorNotes: {
            lead: "กล่าวแนะนำ: นพ.ทักษพล ธรรมรังสี (ผู้อำนวยการมูลนิธิไชน่าเมดิคอลบอร์ด China Medical Board (CMB) Foundation) — แสดงครบทั้ง 6 สถานีพร้อมโลโก้หน่วยงานในคลิกเดียว",
            bullets: [
              "2544 สาธารณสุขศาสตรมหาบัณฑิต ม.มหิดล · เริ่มงานวิจัยที่ IHPP ปี 2546 ระหว่างช่วงงานโรงพยาบาล",
              "2558 Director, NCD and Environmental Health, WHO SEARO · ส.ค. 2567 Director of Programme Management, WHO SEARO",
              "ม.ค. 2568 ผลักดันความร่วมมือ WHO–ศิริราชด้านการป้องกันการบาดเจ็บและการหกล้ม · ม.ค. 2569 ผู้อำนวยการมูลนิธิไชน่าเมดิคอลบอร์ด"
            ],
            refs: [
              { label: "IHPP • Move That Mountain (2565), น. 132–133", url: "https://thaincd.com/document/file/download/knowledge/Movethat_MountainFinal65.pdf" },
              { label: "Massey University • วิทยานิพนธ์นโยบายแอลกอฮอล์ (2551)", url: "https://mro.massey.ac.nz/items/e5864b36-fa99-4f95-ac13-6b08db49d9a6" },
              { label: "CMB Foundation • ประวัติและวันเริ่มตำแหน่ง", url: "https://cmbfound.org/staff/thaksaphon-mek-thamarangsi/" }
            ]
          }
        },
        {
          id: "g-s03",
          num: "04",
          navLabel: "04 · นพ.วิรุฬ",
          type: "timeline",
          dicutImg: "dicut_wirun.png",
          roleSubtitle: "หัวหน้ากลุ่มงานวิจัยสังคมและสุขภาพ กระทรวงสาธารณสุข",
          bg: "st_wirun_01_south.jpg",
          kb: "kb-c",
          orbs: ["rgba(16,185,129,0.36)", "rgba(56,189,248,0.26)", "rgba(245,158,11,0.22)"],
          kicker: "เส้นทางรถไฟสายวิชาชีพ · วิทยากรท่านที่ 2 · ครบทั้ง 5 สถานี",
          kickerSub: "จากผู้รอดชีวิตผ่าตัดสมองและ ผอ.รพ.ชุมชนภาคใต้ สู่ดุษฎีบัณฑิต Harvard พรมแดนสุขภาพ คลองเตยโมเดล และอากาศสะอาด",
          title: "นพ.วิรุฬ ลิ้มสวาท",
          haloLogos: [
            { key: "siriraj", logo: "logo_siriraj.png", label: "ศิริราชพยาบาล" },
            { key: "moph", logo: "logo_moph.png", label: "รพ.ชุมชน · สธ." },
            { key: "who", logo: "logo_who.png", label: "ทุน WHO" },
            { key: "harvard", logo: "logo_harvard.png", label: "Harvard Ph.D." },
            { key: "hsri", logo: "logo_hsri.png", label: "สวรส. (HSRI)" },
            { key: "nhco", logo: "logo_nhco.png", label: "สช. · เวทีสาธารณะ" }
          ],
          wallPhotos: [
            { img: "wirun_voa_02_surgery1.jpg", label: "VOA · หลังผ่าตัดสมองครั้งแรก", pinIdx: 0 },
            { img: "wirun_voa_05_family_swing.jpg", label: "VOA · ครอบครัวที่สหรัฐฯ", pinIdx: 1 },
            { img: "wirun_voa_07_radiation.jpg", label: "VOA · รักษาซ้ำปี 2556", pinIdx: 1 },
            { img: "wirun_voa_08_bedside_son.jpg", label: "VOA · กำลังใจข้างเตียง", pinIdx: 1 },
            { img: "wirun_voa_03_harvard_gown.jpg", label: "VOA · ดุษฎีบัณฑิต Harvard", pinIdx: 2 },
            { img: "wirun_voa_09_border_mirror.jpg", label: "VOA · วิจัยชายแดน 14 เดือน", pinIdx: 2 },
            { img: "wirun_news_khlongtoei.jpg", label: "Active Talk · คลองเตยโมเดล", pinIdx: 3 },
            { img: "wirun_news_cleanair.jpg", label: "เวทีสาธารณะ · อากาศสะอาด", pinIdx: 4 }
          ],
          milestones: [
            {
              year: "2543–2551",
              shortStop: "ผ่าตัดสมอง · รพ.ใต้",
              orgKey: "moph",
              logo: "logo_moph.png",
              logoLabel: "ศิริราช · สธ.",
              roleTag: "Doctor, Patient & Caregiver",
              sceneLabel: "📍 ศิริราช → รพ.ถ้ำพรรณรา & รพร.ฉวาง จ.นครศรีธรรมราช",
              bg: "wirun_voa_02_surgery1.jpg",
              photos: [
                { src: "wirun_voa_02_surgery1.jpg", cap: "VOA · หลังผ่าตัดสมองครั้งแรกกับคุณบุหงา" },
                { src: "wirun_voa_10_desk_son.jpg", cap: "VOA · อ่านตำราเคียงข้างลูกชาย" }
              ],
              headline: "ผ่าตัดเนื้องอกสมองปีสุดท้ายศิริราช สู่ ผอ.รพ.ถ้ำพรรณรา & รพร.ฉวาง",
              text: "ชักหมดสติบนรถเมล์ก่อนจบแพทย์ 3 เดือน ผ่าตัดเนื้องอกสมองรอดชีวิต กลับไปบริหาร รพ.ชุมชนนครศรีธรรมราช และดูแลภรรยาที่ป่วยติดเตียง 2–3 ปี",
              quoteLabel: "💬 VOA Thai:",
              quote: "“เมื่อได้เป็นทั้งหมอ คนไข้ และญาติคนไข้ จึงเห็นว่าโจทย์ใหญ่คือ ‘วัฒนธรรมการแพทย์’ (Medical Culture)”"
            },
            {
              year: "2555–2556",
              shortStop: "ทุน WHO · สู้โรคซ้ำ",
              orgKey: "who",
              logo: "logo_who.png",
              logoLabel: "WHO · Harvard",
              roleTag: "WHO Scholar & Resilience",
              sceneLabel: "📍 Harvard University · ก้อนเนื้อสมองงอกซ้ำปี 2556",
              bg: "wirun_voa_07_radiation.jpg",
              photos: [
                { src: "wirun_voa_07_radiation.jpg", cap: "VOA · ผ่าตัด/ฉายแสงครั้งที่ 2 (2556)" },
                { src: "wirun_voa_08_bedside_son.jpg", cap: "VOA · ลูกชายจับมือให้กำลังใจ" }
              ],
              headline: "ทุน WHO เรียนมานุษยวิทยาการแพทย์ Harvard & ฝ่าวิกฤตผ่าตัดสมองครั้งที่ 2",
              text: "รับทุน WHO เรียน A.M. มานุษยวิทยาการแพทย์ (2555) ก่อนเนื้องอกสมองกลับมาโตซ้ำช่วงซัมเมอร์ปี 2556 ต้องผ่าตัดและฉายแสงอีกครั้งพร้อมดูแลครอบครัว",
              quoteLabel: "💬 VOA Thai:",
              quote: "“ยึดคำสอนพระราชบิดา True Success is in its application to the benefit of mankind — ถ้าหยุดก็สูญเปล่า!”"
            },
            {
              year: "2561",
              shortStop: "Ph.D. · ชายแดน TB",
              orgKey: "harvard",
              logo: "logo_harvard.png",
              logoLabel: "Harvard Ph.D.",
              roleTag: "Medical Anthropology & Border TB",
              sceneLabel: "📍 Harvard Ph.D. & พรมแดนไทย–เมียนมา 14 เดือน",
              bg: "wirun_voa_03_harvard_gown.jpg",
              photos: [
                { src: "wirun_voa_03_harvard_gown.jpg", cap: "VOA · พิชิตชุดครุย Ph.D. Harvard" },
                { src: "wirun_voa_09_border_mirror.jpg", cap: "VOA · ฝังตัววิจัยชายแดน 14 เดือน" }
              ],
              headline: "พิชิต Ph.D. มานุษยวิทยาสังคม Harvard & วิจัยวัณโรคชายแดน 14 เดือน",
              text: "ศึกษาระบบราชการ การดูแลด่านหน้า และการควบคุมวัณโรคข้ามพรมแดนไทย–เมียนมา จน Prof. Arthur Kleinman ชื่นชมจิตวิญญาณนักสู้เพื่อคนชนบท",
              quoteLabel: "💬 VOA Thai:",
              quote: "“สิ่งสำคัญไม่ใช่แค่รู้กว้างขวาง แต่คือความกล้าตั้งคำถามและรับฟังเสียงที่ระบบเคยมองข้าม”"
            },
            {
              year: "2564",
              shortStop: "คลองเตยโมเดล",
              orgKey: "hsri",
              logo: "logo_hsri.png",
              logoLabel: "วิจัยสังคม · สวรส.",
              roleTag: "Urban Crisis & Community Power",
              sceneLabel: "📍 Active Talk · “คลองเตยโมเดล” หยุดระบาดชุมชนแออัด",
              bg: "wirun_news_khlongtoei.jpg",
              photos: [
                { src: "wirun_news_khlongtoei.jpg", cap: "ThaiPBS · Active Talk คลองเตยโมเดล" },
                { src: "wirun_voa_04_seminar.jpg", cap: "VOA · แลกเปลี่ยนวิชาการเชิงระบบ" }
              ],
              headline: "ผอ.สำนักวิจัยสังคมและสุขภาพฯ — ถอดบทเรียน “คลองเตยโมเดล” หยุดระบาดชุมชนแออัด",
              text: "เชื่อมงานวิจัยสังคมศาสตร์การแพทย์เข้ากับพลังชุมชนเมืองรับมือวิกฤตโควิด-19 ในชุมชนแออัด ควบคู่งานวิจัยการเตรียมแพทย์สู่ รพ.ชุมชน",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "การหยุดโรคระบาดในชุมชนเปราะบาง ต้องเริ่มจากการเข้าใจบริบทชีวิตจริงและเสริมพลังคนในพื้นที่"
            },
            {
              year: "2568–2569",
              shortStop: "อากาศสะอาด · สธ.",
              orgKey: "nhco",
              logo: "logo_nhco.png",
              logoLabel: "สช. · วิจัยสังคม สธ.",
              roleTag: "Planetary Health & Health Equity",
              sceneLabel: "📍 เวทีสาธารณะอากาศสะอาด & กลุ่มงานวิจัยสังคมและสุขภาพ สธ.",
              bg: "wirun_news_cleanair.jpg",
              photos: [
                { src: "wirun_news_cleanair.jpg", cap: "รัฐสภา · ร่วมคิด ร่วมสร้าง อากาศสะอาด" },
                { src: "wirun_voa_01_smile.jpg", cap: "VOA · ความหวังและการลงมือทำ" }
              ],
              headline: "เวทีสาธารณะสิทธิอากาศสะอาด & หัวหน้ากลุ่มงานวิจัยสังคมและสุขภาพ สธ.",
              text: "ร่วมขับเคลื่อนเวทีสาธารณะคืนลมหายใจบริสุทธิ์ให้ประชาชนและแรงงาน พร้อมสังเคราะห์รายงานสถานการณ์ระบบสุขภาพไทยให้รับฟังเสียงกลุ่มเปราะบาง",
              quoteLabel: "💬 VOA Thai:",
              quote: "“We have no choice but to be hopeful — แต่ความหวังอย่างเดียวไม่พอ ต้องกล้าลงมือทำ”"
            }
          ],
          footnote: "คลิกที่ภาพข่าว VOA / เวทีสาธารณะเพื่อขยายใหญ่ · กดลูกศร → / Space 1 คลิกเพื่อไปยังวิทยากรท่านถัดไป · อ้างอิงหน้า 20",
          moderatorNotes: {
            lead: "กล่าวแนะนำ: นพ.วิรุฬ ลิ้มสวาท หัวหน้ากลุ่มงานวิจัยสังคมและสุขภาพ กระทรวงสาธารณสุข — รวมภาพชุด VOA Thai ทั้งผ่าตัดสมอง 2 ครั้ง ชุดครุย Harvard วิจัยชายแดน คลองเตยโมเดล และเวทีอากาศสะอาดครบในคลิกเดียว",
            bullets: [
              "จุดเปลี่ยนชีวิตจาก VOA Thai: ป่วยเนื้องอกสมองก่อนจบศิริราช 3 เดือน + ดูแลภรรยาป่วยติดเตียง 2–3 ปี ทำให้เข้าใจทั้งมุมหมอ คนไข้ และญาติคนไข้",
              "รับทุน WHO เรียน Harvard A.M. (2555) & Ph.D. (2561) ฝ่าการผ่าตัดสมองครั้งที่ 2 ปี 2556 · ฝังตัวชายแดน 14 เดือนศึกษาวัณโรค",
              "พ.ค. 2564 ร่วมเวที Active Talk 'คลองเตยโมเดล' หยุดระบาดชุมชนแออัด · เวทีสาธารณะรัฐสภา 'ร่วมคิด ร่วมสร้าง อากาศสะอาด'"
            ],
            refs: [
              { label: "VOA Thai (ตอน 1) • ป่วยกายใจไม่แพ้! เปิดใจ นพ.วิรุฬ ลิ้มสวาท", url: "https://www.voathai.com/a/wirun-limsawart-meeting-part-1/4478824.html" },
              { label: "VOA Thai (ตอน 2) • คุณหมอไทยผู้พิชิตดุษฎีบัณฑิต ม.ฮาร์วาร์ด", url: "https://www.voathai.com/a/wirun-limsawart-interview-part-2/4486443.html" },
              { label: "Harvard Gazette • บทสัมภาษณ์ นพ.วิรุฬ (2561)", url: "https://news.harvard.edu/gazette/story/2018/05/doctor-gets-a-doctorate-and-takes-it-home-to-thailand/" }
            ]
          }
        },
        {
          id: "g-s04",
          num: "05",
          navLabel: "05 · พญ.สุวรรณา",
          type: "timeline",
          dicutImg: "dicut_suwanna.png",
          roleSubtitle: "รองผู้อำนวยการฝ่ายบริหาร ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ (ศจย.)",
          bg: "st_suw_01_rama.jpg",
          kb: "kb-d",
          orbs: ["rgba(168,85,247,0.34)", "rgba(56,189,248,0.26)", "rgba(245,158,11,0.22)"],
          kicker: "เส้นทางรถไฟสายวิชาชีพ · วิทยากรท่านที่ 3 · ครบทั้ง 5 สถานี",
          kickerSub: "จากกุมารเวชศาสตร์และระบาดวิทยาคลินิก สู่มหิดลโมเดลและการคุ้มครองเยาวชนจากบุหรี่และบุหรี่ไฟฟ้าระดับชาติ",
          title: "ศาสตราจารย์เกียรติคุณ พญ.สุวรรณา เรืองกาญจนเศรษฐ์",
          haloLogos: [
            { key: "siriraj", logo: "logo_siriraj.png", label: "ศิริราชพยาบาล" },
            { key: "moph", logo: "logo_moph.png", label: "รพ.อุดรธานี · สธ." },
            { key: "rama", logo: "logo_ramathibodi.png", label: "กุมารฯ รามาธิบดี" },
            { key: "mahidol", logo: "logo_mahidol.png", label: "ม.มหิดล" },
            { key: "trc", logo: "logo_trc.png", label: "ศจย. (TRC)" },
            { key: "thaihealth", logo: "logo_thaihealth.png", label: "สสส." },
            { key: "nhco", logo: "logo_nhco.png", label: "สช. · สมัชชาสุขภาพ" }
          ],
          wallPhotos: [
            { img: "st_suw_01_rama.jpg", label: "01 · กุมารแพทย์ รามาธิบดี", pinIdx: 0 },
            { img: "bg_01_bedside_horizon.jpg", label: "02 · ระบาดวิทยาเด็ก & วัยรุ่น", pinIdx: 1 },
            { img: "st_suw_03_mahidol.jpg", label: "03 · รองอธิการบดี & มหิดลโมเดล", pinIdx: 2 },
            { img: "bg_07_lantern_purpose.jpg", label: "04 · รอง ผอ.ศจย. (TRC)", pinIdx: 3 },
            { img: "bg_04_youth_city_canopy.jpg", label: "05 · สมัชชาควบคุมบุหรี่ไฟฟ้า", pinIdx: 4 }
          ],
          milestones: [
            {
              year: "2520–2527",
              shortStop: "กุมารแพทย์ รามาฯ",
              orgKey: "rama",
              logo: "logo_ramathibodi.png",
              logoLabel: "รามาธิบดี",
              roleTag: "Pediatrics & Academic Medicine",
              sceneLabel: "📍 รพ.อุดรธานี → คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี",
              bg: "st_suw_01_rama.jpg",
              headline: "จากแพทย์ภูมิภาค รพ.อุดรธานี สู่กุมารแพทย์และอาจารย์แพทย์รามาธิบดี",
              text: "จบแพทยศาสตร์ศิริราช ปฏิบัติงานที่ รพ.อุดรธานี ได้รับวุฒิบัตรกุมารเวชศาสตร์ (2526) และเข้ารับตำแหน่งอาจารย์ภาควิชากุมารเวชศาสตร์ รามาธิบดี (2527)",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "การรักษาเด็กป่วยข้างเตียงจุดคำถามสำคัญว่า สภาพแวดล้อมนอกโรงพยาบาลกำลังทำร้ายเด็กไทยอีกกี่แสนคน"
            },
            {
              year: "2534 / 2548",
              shortStop: "ระบาดวิทยาวัยรุ่น",
              orgKey: "rama",
              logo: "logo_ramathibodi.png",
              logoLabel: "Clinical Epi",
              roleTag: "Clinical Epidemiology & Youth Health",
              sceneLabel: "📍 ระบาดวิทยาคลินิก & สุขภาวะวัยรุ่นกรุงเทพมหานคร",
              bg: "bg_01_bedside_horizon.jpg",
              headline: "ระบาดวิทยาคลินิก พิษวิทยาตะกั่วในเด็ก และสำรวจพฤติกรรมเสี่ยงวัยรุ่น",
              text: "วิจัยระดับสารตะกั่วในเด็กไทยร่วมผลักดันนโยบายน้ำมันไร้สารตะกั่ว และริเริ่ม Bangkok Youth Risk Behavior Survey (2548) มองรากเหง้าปัญหาสุขภาพวัยรุ่นเชิงประชากร",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "ข้อมูลระบาดวิทยาที่แม่นยำ เปลี่ยนประสบการณ์หน้าห้องตรวจให้เป็นนโยบายสาธารณะที่ปกป้องเด็กทั้งประเทศ"
            },
            {
              year: "2554–2563",
              shortStop: "มหิดลโมเดล",
              orgKey: "mahidol",
              logo: "logo_mahidol.png",
              logoLabel: "ม.มหิดล",
              roleTag: "University-School-Community System",
              sceneLabel: "📍 มหาวิทยาลัยมหิดล · ระบบนิเวศโรงเรียน–ครอบครัว–ชุมชน",
              bg: "st_suw_03_mahidol.jpg",
              headline: "รองอธิการบดี ม.มหิดล & การสังเคราะห์ “มหิดลโมเดล” (2563)",
              text: "บริหารงานระดับมหาวิทยาลัยและพัฒนา “มหิดลโมเดล” เชื่อมโยงระบบเฝ้าระวังและดูแลวัยรุ่นแบบบูรณาการระหว่างโรงเรียน ครอบครัว ชุมชน และโรงพยาบาล",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "ระบบนิเวศที่ปลอดภัยต้องเชื่อมบ้าน–โรงเรียน–ชุมชนเป็นตาข่ายรองรับ ไม่ปล่อยให้วัยรุ่นเผชิญความเสี่ยงลำพัง"
            },
            {
              year: "2565",
              shortStop: "รอง ผอ.ศจย.",
              orgKey: "trc",
              logo: "logo_trc.png",
              logoLabel: "ศจย. (TRC)",
              roleTag: "Tobacco Control Knowledge Hub",
              sceneLabel: "📍 ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ (ศจย.)",
              bg: "bg_07_lantern_purpose.jpg",
              headline: "รองผู้อำนวยการฝ่ายบริหาร ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ (ศจย.)",
              text: "ขับเคลื่อนคลังหลักฐานวิชาการและการจัดการความรู้ระดับประเทศ เปิดโปงกลยุทธ์อุตสาหกรรมยาสูบและปกป้องสังคมจากผลิตภัณฑ์ยาสูบรูปแบบใหม่",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "การจัดการความรู้เชิงประจักษ์ คือหัวใจของการชี้นำสังคมให้รู้เท่าทันภัยสุขภาพเชิงพาณิชย์"
            },
            {
              year: "2566–2567",
              shortStop: "สมัชชาบุหรี่ไฟฟ้า",
              orgKey: "nhco",
              logo: "logo_nhco.png",
              logoLabel: "สช. · สมัชชาสุขภาพ",
              roleTag: "National Health Advocate & Change Agent",
              sceneLabel: "📍 เวทีสมัชชาสุขภาพเฉพาะประเด็น · คุ้มครองเด็กและเยาวชน",
              bg: "bg_04_youth_city_canopy.jpg",
              headline: "ประธานคณะพัฒนานโยบายสาธารณะควบคุมบุหรี่ไฟฟ้า — สมัชชาสุขภาพเฉพาะประเด็น",
              text: "ประสานพลังสหวิชาชีพ เครือข่ายครู ผู้ปกครอง เยาวชน และภาครัฐ ขับเคลื่อนมติสมัชชาสุขภาพเฉพาะประเด็นเพื่อปกป้องเด็กและเยาวชนไทยอย่างเป็นระบบ",
              quoteLabel: "💡 มุมมองเชิงระบบ:",
              quote: "แพทย์ในฐานะ Change Agent ต้องสานพลังทุกภาคส่วนทั้งในและนอกระบบสุขภาพ เพื่อปกป้องอนาคตของเยาวชนร่วมกัน"
            }
          ],
          footnote: "คลิกที่การ์ดแต่ละสถานีเพื่อขยายอ่านรายละเอียด · กดลูกศร → / Space 1 คลิกเพื่อไปยังสไลด์ถัดไป · อ้างอิงหน้า 20",
          moderatorNotes: {
            lead: "กล่าวแนะนำ: ศาสตราจารย์เกียรติคุณ พญ.สุวรรณา เรืองกาญจนเศรษฐ์ รองผู้อำนวยการฝ่ายบริหาร ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ (ศจย.) — แสดงครบทั้ง 5 สถานีพร้อมโลโก้หน่วยงานในคลิกเดียว",
            bullets: [
              "2521 รพ.อุดรธานี · 2526 วุฒิบัตรกุมารเวชศาสตร์ · 2527 อาจารย์ภาควิชากุมารเวชศาสตร์ รามาฯ · 2551 ศาสตราจารย์ · 2554–2557 รองอธิการบดี ม.มหิดล",
              "เริ่มวิจัยพฤติกรรมวัยรุ่นตั้งแต่ปี 2541 (เก็บข้อมูล Bangkok Youth Risk Behavior Survey ปี 2544 ตีพิมพ์ 2548)",
              "ธ.ค. 2566 ประธานคณะกรรมการพัฒนานโยบายสาธารณะประเด็นการควบคุมบุหรี่ไฟฟ้า (จัดสมัชชาเฉพาะประเด็น 13 พ.ค. 2567)"
            ],
            refs: [
              { label: "สมาคมแพทย์สตรีฯ • ประวัติแพทย์สตรีตัวอย่าง (2567), น. 77–79", url: "https://www.tmwa.or.th/download/vatm2567.pdf" },
              { label: "PubMed • Bangkok Youth Risk Behavior Survey (2548)", url: "https://pubmed.ncbi.nlm.nih.gov/15737779/" },
              { label: "วารสารวิชาการสาธารณสุข • มหิดลโมเดล (2563)", url: "https://thaidj.org/index.php/JHS/article/view/8532" }
            ]
          }
        },
        {
          id: "g-s05",
          num: "06",
          navLabel: "06 · โครงเวลาเสวนา",
          type: "pacing",
          bg: "bg_05_compass_crossroads.jpg",
          kb: "kb-a",
          orbs: ["rgba(56,189,248,0.26)", "rgba(251,191,36,0.22)", "rgba(99,102,241,0.22)"],
          kicker: "โครงสร้างวงเสวนา · รวม 150 นาที",
          kickerSub: "เสวนาแนวคำถาม Q1–Q4 → เปิดฟลอร์ Live Q&A จากนักศึกษา → ปิดท้ายด้วย Q5 และสะท้อนคิด",
          title: "ลำดับจังหวะการสนทนาและแลกเปลี่ยน",
          phases: [
            { min: "00 – 15 นาที", title: "เปิดวงและเส้นทางวิทยากร", desc: "แนะนำหัวข้อ วัตถุประสงค์ LO 1–4 และเส้นทางอาชีพวิทยากรทั้ง 3 ท่าน" },
            { min: "15 – 71 นาที", title: "เสวนาแนวคำถาม Q1–Q4", desc: "สำรวจจุดเปลี่ยน มุมมองเชิงระบบ–โลก สมรรถนะ และโอกาสสำหรับแพทย์รุ่นใหม่", featured: true },
            { min: "71 – 131 นาที", title: "Live Q&A จากฟลอร์ (60 นาที)", desc: "สแกน QR ส่งคำถามสดจากฟลอร์ แลกเปลี่ยนมุมมองกับวิทยากรเต็มเวลา", featured: true },
            { min: "131 – 150 นาที", title: "Q5 · Key Takeaways & สะท้อนคิดปิดวง", desc: "ข้อคิดฝากอนาคต (Q5) สรุปแก่นการสะท้อนคิด & Learning Loops และบันทึกก้าวถัดไป" }
          ],
          moderatorNotes: {
            lead: "เปิดประมาณ 3 นาที แนะนำไทม์ไลน์วิทยากรท่านละ ~4 นาที เดินคำถามหลัก Q1–Q4 ข้อละ ~14 นาที (นาที 15–71) → เปิดฟลอร์ Live Q&A เต็ม 60 นาที (นาที 71–131) → เชิญฝากข้อคิด Q5 (นาที 131–142) → สรุป Key Takeaways 4 ภาพ (นาที 142–146) และสะท้อนคิดปิดวงนาที 146–150",
            bullets: [
              "สลับผู้ตอบคนแรกในแต่ละข้อ และเชิญทุกท่านเติมมุมมองตามความถนัดและประสบการณ์จริง",
              "ลำดับ: Q1–Q4 → Live Q&A จากฟลอร์ (Slide 12) → Q5 ข้อคิดเข็มทิศวิชาชีพ (Slide 13) → Key Takeaways (Slides 14–18) → สะท้อนคิดปิดวง (Slide 19)",
              "หากเข้าใกล้นาที 71 ให้รวบคำถามต่อยอดเพื่อส่งเข้าช่วงสแกน QR Live Q&A บน Slide 12 เต็ม 60 นาที"
            ],
            refs: [
              { label: "AMA • Health Systems Science", url: "https://www.ama-assn.org/education/changemeded-initiative/give-your-medical-students-head-start-health-systems-science" },
              { label: "AMEE • Planetary health & sustainable healthcare education", url: "https://pubmed.ncbi.nlm.nih.gov/33602043/" }
            ]
          }
        },
        {
          id: "g-s06-outline",
          num: "07",
          navLabel: "07 · โครงคำถาม Q1–Q5",
          type: "outline",
          bg: "bg_04_youth_city_canopy.jpg",
          kb: "kb-d",
          orbs: ["rgba(56,189,248,0.28)", "rgba(245,158,11,0.26)", "rgba(16,185,129,0.22)"],
          kicker: "PANEL DISCUSSION OUTLINE · โครงคำถามหลักเวทีเสวนา",
          kickerSub: "4 Core Questions (Q1–Q4) → Open-Floor Live Q&A → Closing Wisdom (Q5)",
          title: "Panel Outline: Q1–Q4 → Live Q&A → Closing Q5",
          coreQuestions: [
            {
              badge: "Q1",
              phase: "Slide 08 · Min 15–29",
              targetSlideIdx: 7,
              en: "Career Pathways & Pivotal Turning Points",
              th: "สำรวจเส้นทางจากข้างเตียงผู้ป่วยสู่เวชปฏิบัติฐานระบบ (SBP) และเหตุการณ์จุดเปลี่ยนสำคัญของอาจารย์"
            },
            {
              badge: "Q2",
              phase: "Slide 09 · Min 29–43",
              targetSlideIdx: 8,
              en: "Shifting Lenses: Systems, Global & Planetary Health",
              th: "มุมมองต่อผู้ป่วยและบทบาทแพทย์ที่เปลี่ยนไป เมื่อทำงานเชื่อมสังคม นโยบาย สุขภาพโลก และสิ่งแวดล้อม"
            },
            {
              badge: "Q3",
              phase: "Slide 10 · Min 43–57",
              targetSlideIdx: 9,
              en: "Core Competencies & Real-World Cultivation",
              th: "สมรรถนะและทักษะสำคัญในการสานพลังสหวิชาชีพและภาคส่วนต่าง ๆ พร้อมวิธีบ่มเพาะจากสนามทำงานจริง"
            },
            {
              badge: "Q4",
              phase: "Slide 11 · Min 57–71",
              targetSlideIdx: 10,
              en: "Future Pathways: Challenges & Emerging Opportunities",
              th: "คำแนะนำในการเริ่มต้น ความท้าทายที่ควรรู้เท่าทัน และโอกาสใหม่ของแพทย์รุ่นใหม่ในทุกสายวิชาชีพ"
            }
          ],
          qaBridge: {
            badge: "💬 LIVE Q&A",
            phase: "Slide 12 · Min 71–131 (60 Min)",
            targetSlideIdx: 11,
            en: "Live Questions & Open Dialogue from the Floor",
            th: "เปิดฟลอร์สแกน QR พิมพ์ส่งคำถามสดขึ้นจอ แลกเปลี่ยนต่อยอดมุมมองร่วมกับวิทยากรทั้ง 3 ท่าน"
          },
          closingQuestion: {
            badge: "Q5 · Finale",
            phase: "Slide 13 · Min 131–142 (After Q&A)",
            targetSlideIdx: 12,
            en: "Closing Wisdom & Compass for Future Generations",
            th: "บทเรียนหลักและข้อคิดเข็มทิศวิชาชีพฝากถึงแพทย์รุ่นอนาคต หลังได้แลกเปลี่ยนกับนักศึกษาแพทย์"
          },
          moderatorNotes: {
            lead: "ใช้สไลด์นี้ปูภาพรวมโครงคำถามสั้น ๆ ~1 นาที เพื่อให้นักศึกษาและวิทยากรเห็นจังหวะการเดินเรื่องร่วมกันก่อนเริ่ม Q1",
            bullets: [
              "ชี้ให้เห็นว่าเราจะคุย 4 คำถามหลัก (Q1–Q4) ก่อน แล้วเปิดเวทีให้น้อง ๆ สแกน QR ส่งคำถามสดบน Slide 12 เต็มเวลา ก่อนปิดท้ายด้วย Q5 และ Key Takeaways",
              "ผู้ดำเนินรายการสามารถคลิกที่การ์ดแต่ละข้อบนหน้าจอเพื่อกระโดดไปยังสไลด์ข้อนั้นได้โดยตรง"
            ],
            refs: []
          }
        },
        {
          id: "g-s06",
          num: "08",
          navLabel: "08 · Q1 จุดเปลี่ยนสำคัญ",
          type: "prompt",
          qStep: 1,
          bg: "bg_05_compass_crossroads.jpg",
          kb: "kb-b",
          orbs: ["rgba(245,158,11,0.28)", "rgba(56,189,248,0.22)", "rgba(30,64,175,0.28)"],
          kicker: "แนวคำถามกึ่งโครงสร้างช่วงที่ 1 · คำถามข้อที่ 1 / 5",
          kickerSub: "Semi-Structured Panel Questions (Q1–Q4 ก่อนช่วง Q&A) · นาทีที่ 15–29",
          title: "Q1: สำรวจเส้นทางวิชาชีพและจุดเปลี่ยนสำคัญ",
          enHeading: "(Career Path Exploration & Turning Points)",
          subQuestions: [
            "ขอเชิญอาจารย์ร่วมแบ่งปันเรื่องราวเส้นทางวิชาชีพ นับตั้งแต่เริ่มต้นดูแลรักษาผู้ป่วยรายบุคคล จนขยับขยายบทบาทมาสู่การทำงานในระดับเวชปฏิบัติฐานระบบ (Systems-Based Practice: SBP) ในปัจจุบัน",
            "ตลอดเส้นทางที่ผ่านมา มีเหตุการณ์หรือประสบการณ์ใดที่เป็น “จุดเปลี่ยนสำคัญ” ซึ่งทำให้อาจารย์เริ่มขยายมุมมองจากการรักษาเฉพาะรายมาสู่การทำงานเชื่อมโยงระบบสุขภาพ?"
          ],
          moderatorNotes: {
            lead: "ลำดับเปิดแนะนำ: เริ่มที่ นพ.ทักษพล → เชิญ นพ.วิรุฬ → ศ.เกียรติคุณ พญ.สุวรรณา",
            bullets: [
              "เชื่อมจากเส้นทางรถไฟสายวิชาชีพของแต่ละท่าน ให้ท่านเล่าเหตุการณ์จริงที่เป็นจุดเปลี่ยนจากข้างเตียง (Bedside) สู่การมองระดับระบบ (SBP)",
              "จดชื่อเหตุการณ์สำคัญของทั้ง 3 ท่านไว้เชื่อมต่อไปยัง Q2 (มุมมองที่เปลี่ยนไปอย่างเป็นรูปธรรม)"
            ],
            refs: [
              { label: "Ganz และคณะ • Public Narrative", url: "https://www.hks.harvard.edu/publications/crafting-public-narrative-enable-collective-action-pedagogy-leadership-development" }
            ]
          }
        },
        {
          id: "g-s07",
          num: "09",
          navLabel: "09 · Q2 มุมมองเชิงระบบ",
          type: "prompt",
          qStep: 2,
          bg: "bg_06_ripples_perspective.jpg",
          kb: "kb-c",
          orbs: ["rgba(56,189,248,0.28)", "rgba(20,184,166,0.22)", "rgba(99,102,241,0.22)"],
          kicker: "แนวคำถามกึ่งโครงสร้างช่วงที่ 1 · คำถามข้อที่ 2 / 5",
          kickerSub: "Semi-Structured Panel Questions (Q1–Q4 ก่อนช่วง Q&A) · นาทีที่ 29–43",
          title: "Q2: มุมมองที่เปลี่ยนไปจากการทำงานเชิงระบบสู่สังคม โลก และสิ่งแวดล้อม",
          enHeading: "(Understanding Shifts in Viewpoints through Systems-Based Work)",
          subQuestions: [
            "การได้เข้าไปทำงานในภาพใหญ่ของระบบ—ทั้งในมิติสังคมและสุขภาพ การวิจัยนโยบายและระบบสุขภาพ (HPSR) การจัดการความรู้เพื่อชี้นำและขับเคลื่อนนโยบายสาธารณะ ตลอดจนงานด้านสุขภาพโลก (Global Health) และสุขภาพของพิภพโลก (Planetary Health)—ได้เปลี่ยนมุมมองของอาจารย์ต่อผู้ป่วย ปัญหาสุขภาพ และบทบาทของแพทย์ไปอย่างไรบ้าง?",
            "พอจะมีกรณีตัวอย่างหรือเหตุการณ์จริงที่สะท้อนการเปลี่ยนมุมมองดังกล่าวอย่างเป็นรูปธรรมหรือไม่?"
          ],
          moderatorNotes: {
            lead: "ลำดับเปิดแนะนำ: เริ่มที่ นพ.วิรุฬ (มิติสังคม/พรมแดน/อากาศสะอาด) → ศ.เกียรติคุณ พญ.สุวรรณา (การจัดการความรู้/บุหรี่ไฟฟ้า) → นพ.ทักษพล (HPSR & Global Health)",
            bullets: [
              "ชวนให้เห็นการเชื่อมโยงตั้งแต่ผู้ป่วยตรงหน้า → ปัจจัยกำหนดสุขภาพทางสังคม/พาณิชย์ → นโยบายสาธารณะ → Global & Planetary Health",
              "ขอให้ยก 1 กรณีตัวอย่างที่เป็นรูปธรรมเพื่อให้นักศึกษาปี 3 เห็นภาพชัดเจน"
            ],
            refs: [
              { label: "AMEE • Planetary health & sustainable healthcare education", url: "https://pubmed.ncbi.nlm.nih.gov/33602043/" }
            ]
          }
        },
        {
          id: "g-s08",
          num: "10",
          navLabel: "10 · Q3 สมรรถนะ & ทักษะ",
          type: "prompt",
          qStep: 3,
          bg: "bg_03_border_anthropology.jpg",
          kb: "kb-d",
          orbs: ["rgba(16,185,129,0.28)", "rgba(245,158,11,0.22)", "rgba(56,189,248,0.2)"],
          kicker: "แนวคำถามกึ่งโครงสร้างช่วงที่ 1 · คำถามข้อที่ 3 / 5",
          kickerSub: "Semi-Structured Panel Questions (Q1–Q4 ก่อนช่วง Q&A) · นาทีที่ 43–57",
          title: "Q3: สมรรถนะและทักษะสำคัญที่บ่มเพาะขึ้นระหว่างทาง",
          enHeading: "(Competencies Developed Through Evolving Perspectives)",
          subQuestions: [
            "ในการขยับขยายมุมมองมาทำงานเชิงระบบร่วมกับทีมสหวิชาชีพและภาคส่วนต่าง ๆ ทั้งในและนอกระบบสุขภาพ ทักษะ สมรรถนะ หรือคุณสมบัติสำคัญใดที่อาจารย์พบว่าจำเป็นอย่างยิ่งต่อการขับเคลื่อนงานให้เกิดผลจริง?",
            "อาจารย์มีแนวทางฝึกฝน เรียนรู้ และบ่มเพาะทักษะเหล่านั้นขึ้นมาอย่างไรตลอดเส้นทางการทำงานที่ผ่านมา?"
          ],
          moderatorNotes: {
            lead: "ลำดับเปิดแนะนำ: เริ่มที่ ศ.เกียรติคุณ พญ.สุวรรณา → นพ.ทักษพล → นพ.วิรุฬ",
            bullets: [
              "เชื่อมเข้ากับ LO 3–4: การประสานความร่วมมือกับทีมสหวิชาชีพและภาคส่วนนอกระบบสุขภาพ การสื่อสาร การฟังอย่างลึกซึ้ง และความใฝ่รู้ตลอดชีวิต",
              "ชวนถามต่อว่าทักษะใดที่โรงเรียนแพทย์ไม่ได้สอนตรง ๆ แต่ได้มาจากการลงมือทำงานจริง"
            ],
            refs: [
              { label: "AMA • Health Systems Science", url: "https://www.ama-assn.org/education/changemeded-initiative/give-your-medical-students-head-start-health-systems-science" }
            ]
          }
        },
        {
          id: "g-s09",
          num: "11",
          navLabel: "11 · Q4 คำแนะนำ & โอกาส",
          type: "prompt",
          qStep: 4,
          bg: "bg_07_lantern_purpose.jpg",
          kb: "kb-a",
          orbs: ["rgba(245,158,11,0.3)", "rgba(99,102,241,0.25)", "rgba(14,165,233,0.2)"],
          kicker: "แนวคำถามกึ่งโครงสร้างช่วงที่ 1 · คำถามข้อที่ 4 / 5",
          kickerSub: "Semi-Structured Panel Questions (Q1–Q4 ก่อนส่งเข้า Live Q&A) · นาทีที่ 57–71",
          title: "Q4: คำแนะนำ ความท้าทาย และโอกาสสำหรับแพทย์รุ่นใหม่",
          enHeading: "(Advice for Aspiring Professionals: Challenges & Opportunities)",
          subQuestions: [
            "สำหรับนักศึกษาแพทย์และแพทย์รุ่นใหม่ที่ต้องการนำมุมมองเวชปฏิบัติฐานระบบ (SBP) และวิทยาระบบสุขภาพ (HSS) ไปใช้—ไม่ว่าจะเติบโตในสายคลินิกเฉพาะทาง สายชุมชน สายวิชาการ หรือสายพัฒนาระบบและนโยบาย—อาจารย์มีคำแนะนำในการเตรียมตัวและเริ่มต้นอย่างไร?",
            "บนเส้นทางดังกล่าวมีความท้าทายใดที่ควรรู้เท่าทัน และมีโอกาสใหม่ ๆ ด้านใดบ้างที่กำลังเปิดกว้างให้ค้นพบ?"
          ],
          moderatorNotes: {
            lead: "ลำดับเปิดแนะนำ: เริ่มที่ นพ.ทักษพล → นพ.วิรุฬ → ศ.เกียรติคุณ พญ.สุวรรณา (ก่อนส่งเข้าช่วงสแกน QR Live Q&A บน Slide 12 ที่นาที 71)",
            bullets: [
              "ย้ำว่า SBP และ HSS ไม่ได้จำกัดเฉพาะคนทำนโยบาย แต่แพทย์คลินิกเฉพาะทาง แพทย์ชุมชน และอาจารย์แพทย์ล้วนใช้สร้างการเปลี่ยนแปลงได้",
              "เมื่อครบทั้ง 3 ท่าน ชวนนักศึกษาหยิบมือถือเตรียมสแกน QR บนสไลด์ถัดไป (Slide 12) เพื่อส่งคำถามสดจากฟลอร์"
            ],
            refs: [
              { label: "AMA • Health Systems Science", url: "https://www.ama-assn.org/education/changemeded-initiative/give-your-medical-students-head-start-health-systems-science" }
            ]
          }
        },
        {
          id: "g-s11",
          num: "12",
          navLabel: "12 · Live Q&A 60 นาที",
          type: "qa",
          bg: "bg_08_dialogue_constellation.jpg",
          kb: "kb-c",
          orbs: ["rgba(245,158,11,0.26)", "rgba(56,189,248,0.24)", "rgba(139,92,246,0.22)"],
          kicker: "นาทีที่ 71–131 · 60 นาทีเต็ม · LIVE QUESTIONS FROM THE FLOOR",
          kickerSub: "สแกน QR เพื่อส่งคำถามสดขึ้นจอ · Clicker เลื่อนทีละคำถามจนครบ หรือคลิกเมาส์เพื่อไป Q5 ทันที",
          title: "“เรื่องไหนที่คุณอยากชวนอาจารย์คิดต่อจากสิ่งที่เพิ่งได้ฟัง?”",
          logline: "สแกน QR Code ด้านขวาเพื่อพิมพ์ส่งคำถามสดจากมือถือหรือไอแพด — คำถามจากฟลอร์จะปรากฏขึ้นบนจอนี้แบบเรียลไทม์",
          moderatorNotes: {
            lead: "นาทีที่ 71–131 (60 นาที): เชิญนักศึกษาสแกน QR Code ด้านขวาบนจอเพื่อพิมพ์ส่งคำถามสด (และเปิดไมค์ถามสดควบคู่กันได้เลย)",
            bullets: [
              "การควบคุมด้วย Clicker (→ / PageDown / Space): จะเลื่อนแสดงทีละคำถาม (#1 → #2 → ... → #N) จนครบทุกข้อก่อน จึงจะข้ามไป Slide 13 (Q5)",
              "การข้ามด้วยเมาส์ (Mouse Override): หากต้องการข้ามไป Slide 13 (Q5) ทันทีโดยไม่รอเลื่อนครบทุกข้อ คลิกปุ่ม ‘🖱️ ไปสไลด์ถัดไป (Q5) ›’ หรือลูกศรขอบขวาจอได้เลย",
              "สามารถคลิกที่ QR Code เพื่อขยายใหญ่เต็มจอได้หากต้องการให้นักศึกษาแถวหลังสแกนพร้อมกัน"
            ],
            refs: []
          }
        },
        {
          id: "g-s10",
          num: "13",
          navLabel: "13 · Q5 ข้อคิดฝากอนาคต",
          type: "prompt",
          qStep: 5,
          afterQa: true,
          bg: "bg_01_bedside_horizon.jpg",
          kb: "kb-b",
          orbs: ["rgba(56,189,248,0.28)", "rgba(16,185,129,0.24)", "rgba(245,158,11,0.22)"],
          kicker: "แนวคำถามปิดท้ายหลังช่วง Q&A · คำถามข้อที่ 5 / 5",
          kickerSub: "Closing Panel Question (หลังรับฟังคำถามจากฟลอร์) · นาทีที่ 131–142",
          title: "Q5: ข้อคิดและบทเรียนสำคัญฝากถึงแพทย์รุ่นอนาคต",
          enHeading: "(Wisdom for Future Generations)",
          subQuestions: [
            "เมื่อมองย้อนกลับไปตลอดเส้นทางการทำงานและการเติบโตทางความคิดที่ผ่านมา อะไรคือ “บทเรียนสำคัญ” หรือข้อคิดหลัก ที่อาจารย์อยากฝากไว้ให้แก่นักศึกษาแพทย์รุ่นใหม่ เพื่อเป็นเข็มทิศในการดูแลผู้ป่วยและร่วมสร้างสรรค์สังคมด้วยจิตสาธารณะต่อไปในอนาคต?"
          ],
          moderatorNotes: {
            lead: "นาทีที่ 131–142 (หลังจบช่วง Q&A จากนักศึกษา): เชิญทั้ง 3 ท่านฝากบทเรียนเข็มทิศวิชาชีพปิดท้ายท่านละ ~3 นาที ก่อนสรุป Key Takeaways (Slides 14–18)",
            bullets: [
              "เชื่อมโยงเสียงคำถามของนักศึกษาเมื่อสักครู่เข้าสู่วัตถุประสงค์ข้อที่ 4: การมององค์รวมและการคิดเชิงระบบ ความใฝ่รู้ตลอดชีวิต คุณธรรมจริยธรรม และจิตสาธารณะเพื่อชุมชนและสังคม"
            ],
            refs: [
              { label: "University of Edinburgh • What? So what? Now what?", url: "https://reflection.ed.ac.uk/reflectors-toolkit/reflecting-on-experience/what-so-what-now-what" }
            ]
          }
        },
        {
          id: "g-kt00",
          num: "14",
          navLabel: "14 · Key Takeaways",
          type: "takeaway-cover",
          bg: "bg_05_compass_crossroads.jpg",
          kb: "kb-a",
          orbs: ["rgba(245,158,11,0.3)", "rgba(56,189,248,0.24)", "rgba(244,63,94,0.18)"],
          kicker: "นาทีที่ 142–146 · SYNTHESIS BEFORE CLOSING REFLECTION",
          title: "Key Takeaways",
          subtitleEn: "Learning through Question-Asking & Self-Reflection for Personal Development",
          subtitleTh: "สรุปกรอบการตั้งคำถามและสะท้อนคิดจากเวทีเสวนา ก่อนบันทึกพันธสัญญาส่วนตัวใน SRN 1",
          roadmap: [
            { num: "01", label: "What? · So What? · Now What?", targetSlideIdx: 14 },
            { num: "02", label: "+ What If? (Hindsight → Foresight)", targetSlideIdx: 15 },
            { num: "03", label: "Reflective Practice & Learning Loops", targetSlideIdx: 16 },
            { num: "04", label: "Single · Double · Triple Loop", targetSlideIdx: 17 }
          ],
          moderatorNotes: {
            lead: "นาทีที่ 142–146 (~4 นาที): ขอบคุณวิทยากรทั้ง 3 ท่าน แล้วชวนนักศึกษาสรุปเครื่องมือการเรียนรู้ผ่านการตั้งคำถามและสะท้อนคิด (Key Takeaways 4 ภาพ) เพื่อใช้ต่อยอดตลอดรายวิชา RACM 303 และบันทึก SRN 1",
            bullets: [
              "ชี้ให้เห็นว่าเรื่องเล่าของวิทยากรทั้ง 3 ท่านมีจุดร่วมสำคัญคือ ‘ความกล้าตั้งคำถาม’ และ ‘การสะท้อนคิดจนเปลี่ยนกรอบการมองปัญหา’"
            ],
            refs: []
          }
        },
        {
          id: "g-kt01",
          num: "15",
          navLabel: "15 · What–So What–Now What",
          type: "takeaway-visual",
          ktStep: 1,
          ktTotal: 4,
          bg: "bg_06_ripples_perspective.jpg",
          kb: "kb-b",
          orbs: ["rgba(6,182,212,0.28)", "rgba(245,158,11,0.2)", "rgba(15,23,42,0.5)"],
          kicker: "KEY TAKEAWAYS · ภาพที่ 1 / 4 · Terry Borton Reflective Model",
          titlePrefix: "Key Takeaway:",
          title: "Learning through Question-Asking & Self-Reflection for Personal Development",
          figImg: "kt_01_borton_what_sowhat_nowwhat.jpg",
          matte: "dark",
          captionTh: "3 คำถามหลักของการสะท้อนคิด: What? (เกิดอะไรขึ้นในอดีต) → So What? (ตีความหมายในปัจจุบัน) → Now What? (ก้าวต่อไปในอนาคต)",
          sourceLabel: "Terry Borton (1970) · MODELTHINKERS.com",
          sourceUrl: "https://modelthinkers.com/mental-model/what-so-what-now-what",
          moderatorNotes: {
            lead: "ภาพที่ 1/4 (~45 วินาที): กรอบสะท้อนคิดพื้นฐานของ Terry Borton — What? So What? Now What?",
            bullets: [
              "เชื่อมเส้นเวลา Past → Present → Future: สังเกตข้อเท็จจริงโดยยังไม่ด่วนตัดสิน (What?) → วิเคราะห์ความหมายและปัจจัยเบื้องหลัง (So What?) → เลือกก้าวปฏิบัติถัดไป (Now What?)"
            ],
            refs: [
              { label: "ModelThinkers • What? So What? Now What?", url: "https://modelthinkers.com/mental-model/what-so-what-now-what" }
            ]
          }
        },
        {
          id: "g-kt02",
          num: "16",
          navLabel: "16 · + What If? Foresight",
          type: "takeaway-visual",
          ktStep: 2,
          ktTotal: 4,
          bg: "bg_06_ripples_perspective.jpg",
          kb: "kb-c",
          orbs: ["rgba(99,102,241,0.26)", "rgba(245,158,11,0.22)", "rgba(56,189,248,0.22)"],
          kicker: "KEY TAKEAWAYS · ภาพที่ 2 / 4 · Extending Reflection with Inquiry",
          titlePrefix: "Key Takeaway:",
          title: "Learning through Question-Asking & Self-Reflection for Personal Development",
          figImg: "kt_02_pearson_what_if.jpg",
          matte: "ice",
          captionTh: "เติมคำถาม “What If?” เชื่อม Hindsight (Analysis) → Insight (Synthesis) → Foresight (Goals, Risk Plan & Strategy)",
          sourceLabel: "© Garry Pearson OAM, 2022",
          moderatorNotes: {
            lead: "ภาพที่ 2/4 (~45 วินาที): ยกระดับด้วยคำถาม ‘What If?’ คั่นกลางระหว่างจังหวะสะท้อนคิด",
            bullets: [
              "หลังเห็น What? ให้ตั้งสมมติฐาน (What If? → Hypothesis) เพื่อสังเคราะห์ความเข้าใจ (So What? → Insight) แล้วถาม What If? อีกครั้งเพื่อออกแบบเป้าหมายและยุทธศาสตร์สู่อนาคต (Now What? → Foresight)"
            ],
            refs: []
          }
        },
        {
          id: "g-kt03",
          num: "17",
          navLabel: "17 · Learning Loops (3 ระดับ)",
          type: "takeaway-visual",
          ktStep: 3,
          ktTotal: 4,
          bg: "bg_03_border_anthropology.jpg",
          kb: "kb-d",
          orbs: ["rgba(16,185,129,0.26)", "rgba(56,189,248,0.24)", "rgba(245,158,11,0.2)"],
          kicker: "KEY TAKEAWAYS · ภาพที่ 3 / 4 · Multi-Loop Reflective Practice",
          titlePrefix: "Key Takeaway:",
          title: "Reflective Practice & Learning Loops",
          figImg: "kt_03_reflective_learning_loops.jpg",
          matte: "paper",
          captionTh: "เลือกความลึกของการเปลี่ยนแปลงจาก Now What?: Loop 1 Refine (แก้การกระทำ) · Loop 2 Reframe (รื้อกรอบคิด) · Loop 3 Relearn (เปลี่ยนบริบทและตัวตน)",
          sourceLabel: "Borton (1970) · Argyris (1977) · Peschl (2007)",
          moderatorNotes: {
            lead: "ภาพที่ 3/4 (~1 นาที): เชื่อม What? → So What? → Now What? เข้ากับความลึกของการเรียนรู้ 3 ระดับ (Single / Double / Triple-Loop Learning)",
            bullets: [
              "Loop 1 (Refine): ทำสิ่งเดิมให้ดีขึ้น · Loop 2 (Reframe): ทบทวนสมมติฐานและกรอบคิดเดิมเหมือนที่วิทยากรขยับจากข้างเตียงสู่ระบบ · Loop 3 (Relearn): ทบทวนตัวตนและบทบาทวิชาชีพแพทย์ในสังคม"
            ],
            refs: [
              { label: "Argyris (1977) • Double-Loop Learning", url: "https://hbr.org/1977/09/double-loop-learning-in-organizations" }
            ]
          }
        },
        {
          id: "g-kt04",
          num: "18",
          navLabel: "18 · Single·Double·Triple Loop",
          type: "takeaway-visual",
          ktStep: 4,
          ktTotal: 4,
          bg: "bg_07_lantern_purpose.jpg",
          kb: "kb-a",
          orbs: ["rgba(245,158,11,0.28)", "rgba(56,189,248,0.22)", "rgba(244,63,94,0.18)"],
          kicker: "KEY TAKEAWAYS · ภาพที่ 4 / 4 · Mental Models & Meta-Learning",
          titlePrefix: "Key Takeaway:",
          title: "Learning through Question-Asking & Self-Reflection for Personal Development",
          figImg: "kt_04_triple_loop_cartoon.jpg",
          matte: "paper",
          captionTh: "Single Loop ปรับกระบวนการ (Input → Output) · Double Loop ตั้งคำถามกับเป้าหมาย ทางเลือก และเหตุผล · Triple Loop ถอยกลับมาทบทวนตัวตนและวิธีเรียนรู้",
          sourceLabel: "Source: karthik-suresh.com",
          sourceUrl: "https://karthik-suresh.com/",
          moderatorNotes: {
            lead: "ภาพที่ 4/4 (~30 วินาที): ภาพจำสั้น ๆ ก่อนส่งเข้าสไลด์สะท้อนคิดปิดวง (Slide 19)",
            bullets: [
              "ชวนนักศึกษาถอยออกมาเป็นคนยืนมองก้อนเมฆความคิด (Triple Loop): วันนี้เราเข้าใจบทบาทแพทย์เปลี่ยนไปอย่างไร และจะลองก้าวเล็ก ๆ อะไรในครั้งหน้า"
            ],
            refs: [
              { label: "Karthik Suresh • Single, Double & Triple Loop Learning", url: "https://karthik-suresh.com/" }
            ]
          }
        },
        {
          id: "g-s12",
          num: "19",
          navLabel: "19 · สะท้อนคิดปิดวง",
          type: "reflection",
          bg: "bg_07_lantern_purpose.jpg",
          kb: "kb-d",
          orbs: ["rgba(251,191,36,0.28)", "rgba(56,189,248,0.22)", "rgba(16,185,129,0.22)"],
          kicker: "นาทีที่ 146–150 · สะท้อนคิดและปิดวง",
          kickerSub: "สิ่งที่ฉันจะลองทำครั้งหน้า (Personal Commitment to Action)",
          title: "“วันนี้คุณเข้าใจบทบาทแพทย์อย่างไร และอยากลองทำอะไรกับความเข้าใจนั้น?”",
          stem: "« ครั้งหน้า ฉันจะลอง… แล้วฟัง… เพื่อทบทวน »",
          logline: "เชื่อมการดูแลผู้ป่วยข้างเตียง การทำงานกับทีมสหวิชาชีพ และการเรียนรู้ร่วมกับชุมชนในภาคสนาม (สามารถบันทึกไว้ต่อยอดใน SRN 1)",
          moderatorNotes: {
            lead: "ให้เวลาจดเงียบ ๆ 1 นาที ชวนอาสาสมัครแชร์สั้น ๆ 1–2 คน แล้วสรุปปิดวงจากถ้อยคำที่เกิดขึ้นจริงในห้อง",
            bullets: [
              "รวบยอด 3 จังหวะ: วันนี้เราได้ฟังว่าเกิดอะไรขึ้น (What) · สำรวจกรอบที่ใช้มองปัญหา (So what) · และเลือกก้าวเล็ก ๆ ที่จะลองทำและรับฟังผู้อื่น (Now what)",
              "เชื่อมต่อไปยังคาบพรุ่งนี้เช้า (HS1 สุขภาพและปัจจัยกำหนดสุขภาพ) และการบันทึกสะท้อนคิด SRN 1"
            ],
            refs: [
              { label: "University of Edinburgh • What? So what? Now what?", url: "https://reflection.ed.ac.uk/reflectors-toolkit/reflecting-on-experience/what-so-what-now-what" },
              { label: "AMA • Health Systems Science", url: "https://www.ama-assn.org/education/changemeded-initiative/give-your-medical-students-head-start-health-systems-science" }
            ]
          }
        },
        {
          id: "g-s13",
          num: "20",
          navLabel: "20 · หลักฐานประวัติ",
          type: "sources",
          bg: "bg_02_nahwa_to_world.jpg",
          kb: "kb-a",
          orbs: ["rgba(56,189,248,0.24)", "rgba(245,158,11,0.2)", "rgba(30,41,59,0.4)"],
          kicker: "ภาคผนวก 1 · กดที่ชื่อแหล่งเพื่อเปิดเอกสารต้นฉบับ",
          kickerSub: "ตรวจสอบความถูกต้องจากคลังวิทยานิพนธ์ รายงานสถาบัน และบทสัมภาษณ์ทางการ",
          title: "หลักฐานเส้นทางอาชีพวิทยากรทั้ง 3 ท่าน",
          columns: [
            {
              heading: "นพ.ทักษพล ธรรมรังสี",
              items: [
                { label: "IHPP • Move That Mountain (2565), น. 132–133", url: "https://thaincd.com/document/file/download/knowledge/Movethat_MountainFinal65.pdf" },
                { label: "Massey University • วิทยานิพนธ์นโยบายแอลกอฮอล์ (2551)", url: "https://mro.massey.ac.nz/items/e5864b36-fa99-4f95-ac13-6b08db49d9a6" },
                { label: "IHPP • ประวัติผู้อำนวยการและงานวิจัย", url: "https://ihpp.or.th/who-we-are/history" },
                { label: "CMB Foundation • ประวัติและวันเริ่มตำแหน่ง", url: "https://cmbfound.org/staff/thaksaphon-mek-thamarangsi/" }
              ]
            },
            {
              heading: "นพ.วิรุฬ ลิ้มสวาท",
              items: [
                { label: "VOA Thai • ป่วยกายใจไม่แพ้! เปิดใจ นพ.วิรุฬ (ตอน 1–2)", url: "https://www.voathai.com/a/wirun-limsawart-interview-part-2/4486443.html" },
                { label: "Sanook / VOA • เส้นทางคุณหมอไทยพิชิตดุษฎีบัณฑิต ม.ฮาร์วาร์ด", url: "https://www.sanook.com/men/37825/" },
                { label: "Harvard Gazette • บทสัมภาษณ์ นพ.วิรุฬ (2561)", url: "https://news.harvard.edu/gazette/story/2018/05/doctor-gets-a-doctorate-and-takes-it-home-to-thailand/" },
                { label: "Harvard DASH • วิทยานิพนธ์วัณโรคชายแดน (2561)", url: "https://dash.harvard.edu/entities/publication/dd0c41a2-e964-4bdc-a8d4-5e0c376fbefb" },
                { label: "HITAP & สช. • ประวัติผู้ร่วมวิจัยและรายงานระบบสุขภาพไทย", url: "https://www.nationalhealth.or.th/storage/ebooks_attach/NHSIR_2026.pdf" }
              ]
            },
            {
              heading: "ศ.เกียรติคุณ พญ.สุวรรณา เรืองกาญจนเศรษฐ์",
              items: [
                { label: "สมาคมแพทย์สตรีฯ • ประวัติแพทย์สตรีตัวอย่าง น. 77–79", url: "https://www.tmwa.or.th/download/vatm2567.pdf" },
                { label: "PubMed • งานสำรวจพฤติกรรมเสี่ยงวัยรุ่นกรุงเทพฯ (2548)", url: "https://pubmed.ncbi.nlm.nih.gov/15737779/" },
                { label: "วารสารวิชาการสาธารณสุข • มหิดลโมเดล (2563)", url: "https://thaidj.org/index.php/JHS/article/view/8532" },
                { label: "ศจย. • รายชื่อคณะผู้บริหาร", url: "https://www.trc.or.th/en/trc-english-site/" }
              ]
            }
          ]
        },
        {
          id: "g-s14",
          num: "21",
          navLabel: "21 · กรอบสะท้อนคิด",
          type: "sources",
          bg: "bg_06_ripples_perspective.jpg",
          kb: "kb-b",
          orbs: ["rgba(139,92,246,0.25)", "rgba(56,189,248,0.22)", "rgba(245,158,11,0.18)"],
          kicker: "ภาคผนวก 2 · กดที่ชื่อแหล่งเพื่อเปิดเอกสารต้นฉบับ",
          kickerSub: "รากฐานแนวคิดที่ใช้ในการออกแบบลำดับคำถามและ Key Takeaways ของเวทีเสวนา",
          title: "กรอบสะท้อนคิดและแหล่งเอกสารประกอบ",
          columns: [
            {
              heading: "การสะท้อนคิด (Reflective Practice)",
              items: [
                { label: "Borton (1970) • Reach, Touch and Teach", url: "https://archive.org/details/reachtouchteachs0000bort" },
                { label: "University of Edinburgh • What? So what? Now what?", url: "https://reflection.ed.ac.uk/reflectors-toolkit/reflecting-on-experience/what-so-what-now-what" },
                { label: "ModelThinkers • What? So What? Now What? (Terry Borton)", url: "https://modelthinkers.com/mental-model/what-so-what-now-what" },
                { label: "IHI • 5 Whys ในบริบทการปรับปรุงคุณภาพ", url: "https://www.ihi.org/library/tools/5-whys-finding-root-cause" }
              ]
            },
            {
              heading: "การเรียนรู้หลายระดับ (Multi-Loop Learning)",
              items: [
                { label: "Argyris (1977) • Single และ Double-Loop Learning", url: "https://hbr.org/1977/09/double-loop-learning-in-organizations" },
                { label: "Peschl (2007) • Triple-Loop Learning", url: "https://constructivist.info/2/2-3/136" },
                { label: "Tosey และคณะ (2012) • นิยาม Triple Loop ในวรรณกรรม", url: "https://doi.org/10.1177/1350507611426239" },
                { label: "Karthik Suresh • Single, Double & Triple Loop Learning", url: "https://karthik-suresh.com/" }
              ]
            },
            {
              heading: "กรอบประกอบการอภิปรายวิชาชีพ",
              items: [
                { label: "Ganz และคณะ • Public Narrative (Harvard HKS)", url: "https://www.hks.harvard.edu/publications/crafting-public-narrative-enable-collective-action-pedagogy-leadership-development" },
                { label: "AMA • Health Systems Science", url: "https://www.ama-assn.org/education/changemeded-initiative/give-your-medical-students-head-start-health-systems-science" },
                { label: "AMEE • สุขภาพดาวเคราะห์และการศึกษาแพทย์", url: "https://pubmed.ncbi.nlm.nih.gov/33602043/" }
              ]
            }
          ]
        }
      ]
    }
  };

  /* ---------- Runtime State ---------- */
  const state = {
    isOpen: false,
    deckId: "w1-d1-global",
    slideIdx: 0,
    stationIdx: 0,
    qaFocusIdx: 0,
    qaViewedIds: new Set(),
    qaComposerOpen: false,
    qaComposerStandalone: false,
    qaSelectedTarget: QA_TARGET_OPTIONS[0],
    qaToastMsg: "",
    qaToastTimer: null,
    backdropMode: localStorage.getItem("racm303_psv_backdrop") === "aurora" ? "aurora" : "cinema",
    ambientCycle: false,
    qaLoopOnly: false,
    idleClean: false,
    showQrOnCover: false,
    qrLightboxOpen: false,
    modDrawerOpen: false,
    stuDrawerOpen: false,
    fontScale: parseFloat(localStorage.getItem("racm303_psv_font_scale") || "1") || 1,
    followHost: ROLE === "student",
    activeBgSlot: 0,
    currentBgUrl: "",
    currentDicutUrl: "",
    idleTimer: null,
    cycleTimer: null,
    clockTimer: null,
    sessionSec: 0,
    sessionRunning: false,
    sessionTimer: null,
    resizeRaf: 0
  };

  /* ---------- Preload Images Smoothly ---------- */
  const preloadedSet = new Set();
  function preloadImageOnce(relName) {
    if (!relName || preloadedSet.has(relName)) return;
    preloadedSet.add(relName);
    const img = new Image();
    img.src = `${IMG_DIR}/${relName}?v=${ASSET_VER}`;
  }

  function preloadDeckImages(deck) {
    if (!deck || !deck.slides) return;
    deck.slides.forEach((sl) => {
      preloadImageOnce(sl.bg);
      preloadImageOnce(sl.dicutImg);
      preloadImageOnce(sl.figImg);
      if (Array.isArray(sl.haloLogos)) {
        sl.haloLogos.forEach((hl) => preloadImageOnce(hl && hl.logo));
      }
      if (Array.isArray(sl.wallPhotos)) {
        sl.wallPhotos.forEach((wp) => preloadImageOnce(wp && wp.img));
      }
      if (Array.isArray(sl.milestones)) {
        sl.milestones.forEach((m) => {
          if (!m) return;
          preloadImageOnce(m.bg);
          preloadImageOnce(m.logo);
          if (Array.isArray(m.photos)) {
            m.photos.forEach((ph) => preloadImageOnce(ph && ph.src));
          }
        });
      }
    });
  }

  /* ---------- Live Sync & Real-Time Floor Q&A Engine (BroadcastChannel + Dual MQTT WSS + PeerJS 443 + LocalStorage) ---------- */
  let bc = null;
  let qaBc = null;
  const mqttClients = [];
  const connectedBrokers = new Set();
  const pendingQaPublishes = [];
  let peerInst = null;
  let peerHostSlotIdx = 0;
  let peerReconnectTimer = null;
  const peerConns = new Map();
  const pendingPeerPublishes = [];
  const qaBuckets = Object.create(null);

  function getDeviceId() {
    try {
      let id = localStorage.getItem("racm303_psv_device_id");
      if (!id) {
        id = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
        localStorage.setItem("racm303_psv_device_id", id);
      }
      return id;
    } catch (_) {
      return "dev_anon";
    }
  }

  function getSavedQaAuthor() {
    try {
      return localStorage.getItem("racm303_psv_qa_author") || "";
    } catch (_) {
      return "";
    }
  }

  function saveQaAuthor(name) {
    try {
      localStorage.setItem("racm303_psv_qa_author", String(name || "").trim());
    } catch (_) {}
  }

  function getQaScanUrl() {
    try {
      const host = window.location.hostname || "";
      if (host === "localhost" || host === "127.0.0.1") {
        const stuPath = (window.location.pathname || "/").replace(
          "/racm303-2569-faculty-member/",
          "/racm303-2569-student/"
        );
        return `${window.location.origin}${stuPath}?qa=1#${QA_HASH_SLUG}`;
      }
    } catch (_) {}
    return `${PROD_STUDENT_BASE}?qa=1#${QA_HASH_SLUG}`;
  }

  function ensureQaBucket(deckId) {
    const key = deckId || "w1-d1-global";
    if (qaBuckets[key]) return qaBuckets[key];
    const bucket = {
      items: new Map(),
      hiddenIds: new Set(),
      likes: new Map(),
      clearedBeforeTs: 0
    };
    try {
      const raw = localStorage.getItem(`racm303_panel_live_qa_v1_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (typeof parsed.clearedBeforeTs === "number") {
            bucket.clearedBeforeTs = parsed.clearedBeforeTs;
          }
          if (Array.isArray(parsed.hiddenIds)) {
            parsed.hiddenIds.forEach((id) => id && bucket.hiddenIds.add(String(id)));
          }
          if (Array.isArray(parsed.items)) {
            parsed.items.forEach((it) => {
              if (it && it.id && it.text) bucket.items.set(String(it.id), it);
            });
          }
          if (parsed.likes && typeof parsed.likes === "object") {
            Object.keys(parsed.likes).forEach((qId) => {
              const arr = parsed.likes[qId];
              if (Array.isArray(arr)) bucket.likes.set(qId, new Set(arr));
            });
          }
        }
      }
    } catch (_) {}
    qaBuckets[key] = bucket;
    return bucket;
  }

  function persistQaBucket(deckId) {
    const key = deckId || "w1-d1-global";
    const bucket = ensureQaBucket(key);
    try {
      const likesObj = {};
      bucket.likes.forEach((set, qId) => {
        likesObj[qId] = Array.from(set);
      });
      const payload = {
        clearedBeforeTs: bucket.clearedBeforeTs,
        hiddenIds: Array.from(bucket.hiddenIds),
        items: Array.from(bucket.items.values()).slice(-150),
        likes: likesObj
      };
      localStorage.setItem(`racm303_panel_live_qa_v1_${key}`, JSON.stringify(payload));
    } catch (_) {}
  }

  function getVisibleQaList(deckId) {
    const bucket = ensureQaBucket(deckId || state.deckId);
    const now = Date.now();
    const myId = getDeviceId();
    const out = [];
    bucket.items.forEach((it) => {
      if (!it || !it.id || !it.text) return;
      if (bucket.hiddenIds.has(it.id)) return;
      const ts = Number(it.ts) || 0;
      if (bucket.clearedBeforeTs && ts <= bucket.clearedBeforeTs) return;
      if (ts > 0 && now - ts > STALE_QA_MS) return;
      const likeSet = bucket.likes.get(it.id);
      out.push({
        id: String(it.id),
        deckId: it.deckId || deckId || "w1-d1-global",
        text: String(it.text).trim(),
        target: String(it.target || QA_TARGET_OPTIONS[0]).trim(),
        author: String(it.author || "").trim(),
        senderId: String(it.senderId || ""),
        ts,
        likeCount: likeSet ? likeSet.size : 0,
        likedByMe: Boolean(likeSet && likeSet.has(myId))
      });
    });
    out.sort((a, b) => (a.ts - b.ts) || a.id.localeCompare(b.id));
    return out;
  }

  function formatQaTimeAgo(ts) {
    if (!ts) return "";
    try {
      return new Intl.DateTimeFormat("th-TH", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date(ts)) + " น.";
    } catch (_) {
      return "";
    }
  }

  function publishQaMqtt(subtopic, obj, retain) {
    const fullTopic = `${QA_MQTT_NS}/${subtopic}`;
    const str = JSON.stringify(obj);
    let sentAny = false;
    mqttClients.forEach((cl) => {
      if (cl && cl.connected) {
        try {
          cl.publish(fullTopic, str, { qos: 0, retain: Boolean(retain) });
          sentAny = true;
        } catch (_) {}
      }
    });
    if (!sentAny) {
      pendingQaPublishes.push({ topic: fullTopic, payload: str, retain: Boolean(retain) });
      if (pendingQaPublishes.length > 80) pendingQaPublishes.shift();
    }
  }

  function ingestQaPacket(kind, data) {
    if (!data || typeof data !== "object") return;
    const deckId = data.deckId || "w1-d1-global";
    const bucket = ensureQaBucket(deckId);
    const prevList = getVisibleQaList(deckId);
    const prevCurrentId = prevList[state.qaFocusIdx] ? prevList[state.qaFocusIdx].id : "";
    let changed = false;

    if (kind === "question" && data.id && data.text) {
      const cleanText = String(data.text).trim().slice(0, 420);
      if (!cleanText) return;
      const existing = bucket.items.get(String(data.id));
      if (!existing || existing.text !== cleanText) {
        bucket.items.set(String(data.id), {
          id: String(data.id),
          deckId,
          text: cleanText,
          target: String(data.target || QA_TARGET_OPTIONS[0]).trim().slice(0, 60),
          author: String(data.author || "").trim().slice(0, 60),
          senderId: String(data.senderId || ""),
          ts: Number(data.ts) || Date.now()
        });
        changed = true;
      }
    } else if (kind === "mod" && data.id) {
      const qId = String(data.id);
      if (data.hidden && !bucket.hiddenIds.has(qId)) {
        bucket.hiddenIds.add(qId);
        changed = true;
      }
    } else if (kind === "clear" && typeof data.clearedBeforeTs === "number") {
      if (data.clearedBeforeTs > bucket.clearedBeforeTs) {
        bucket.clearedBeforeTs = data.clearedBeforeTs;
        changed = true;
      }
    } else if (kind === "like" && data.id && data.voterId) {
      const qId = String(data.id);
      const voter = String(data.voterId);
      let set = bucket.likes.get(qId);
      if (!set) {
        set = new Set();
        bucket.likes.set(qId, set);
      }
      if (data.liked && !set.has(voter)) {
        set.add(voter);
        changed = true;
      } else if (!data.liked && set.has(voter)) {
        set.delete(voter);
        changed = true;
      }
    }

    if (!changed) return false;
    persistQaBucket(deckId);
    refreshQaComposerFeedOnly();
    refreshQrModalCountOnly(deckId);

    if (state.isOpen && state.deckId === deckId && getCurrentSlide().type === "qa") {
      const nextList = getVisibleQaList(deckId);
      if (prevList.length === 0 && nextList.length > 0) {
        state.qaFocusIdx = 0;
        state.qaViewedIds.add(nextList[0].id);
        updateStageView();
      } else if (nextList.length === 0) {
        state.qaFocusIdx = 0;
        updateStageView();
      } else {
        const preservedIdx = prevCurrentId ? nextList.findIndex((x) => x.id === prevCurrentId) : -1;
        if (preservedIdx >= 0) {
          state.qaFocusIdx = preservedIdx;
          refreshLiveQaStageChromeInPlace(nextList);
        } else {
          state.qaFocusIdx = Math.max(0, Math.min(nextList.length - 1, state.qaFocusIdx));
          if (nextList[state.qaFocusIdx]) state.qaViewedIds.add(nextList[state.qaFocusIdx].id);
          updateStageView();
        }
      }
    }
    return true;
  }

  function buildQaSnapshotPayload(deckId) {
    const key = deckId || state.deckId || "w1-d1-global";
    const bucket = ensureQaBucket(key);
    const likesObj = {};
    bucket.likes.forEach((set, qId) => {
      likesObj[qId] = Array.from(set);
    });
    return {
      deckId: key,
      clearedBeforeTs: bucket.clearedBeforeTs || 0,
      hiddenIds: Array.from(bucket.hiddenIds),
      items: Array.from(bucket.items.values()).slice(-150),
      likes: likesObj
    };
  }

  function ingestQaSnapshot(snap) {
    if (!snap || typeof snap !== "object") return false;
    const deckId = snap.deckId || "w1-d1-global";
    const bucket = ensureQaBucket(deckId);
    let anyChanged = false;
    const newQuestions = [];

    if (typeof snap.clearedBeforeTs === "number" && snap.clearedBeforeTs > bucket.clearedBeforeTs) {
      bucket.clearedBeforeTs = snap.clearedBeforeTs;
      anyChanged = true;
    }
    if (Array.isArray(snap.hiddenIds)) {
      snap.hiddenIds.forEach((id) => {
        const sId = String(id || "");
        if (sId && !bucket.hiddenIds.has(sId)) {
          bucket.hiddenIds.add(sId);
          anyChanged = true;
        }
      });
    }
    if (Array.isArray(snap.items)) {
      snap.items.forEach((it) => {
        if (!it || !it.id || !it.text) return;
        const cleanText = String(it.text).trim().slice(0, 420);
        if (!cleanText) return;
        const sId = String(it.id);
        const existing = bucket.items.get(sId);
        if (!existing || existing.text !== cleanText) {
          const rec = {
            id: sId,
            deckId,
            text: cleanText,
            target: String(it.target || QA_TARGET_OPTIONS[0]).trim().slice(0, 60),
            author: String(it.author || "").trim().slice(0, 60),
            senderId: String(it.senderId || ""),
            ts: Number(it.ts) || Date.now()
          };
          bucket.items.set(sId, rec);
          newQuestions.push(rec);
          anyChanged = true;
        }
      });
    }
    if (snap.likes && typeof snap.likes === "object") {
      Object.keys(snap.likes).forEach((qId) => {
        const arr = snap.likes[qId];
        if (!Array.isArray(arr)) return;
        let set = bucket.likes.get(qId);
        if (!set) {
          set = new Set();
          bucket.likes.set(qId, set);
        }
        arr.forEach((v) => {
          const sV = String(v || "");
          if (sV && !set.has(sV)) {
            set.add(sV);
            anyChanged = true;
          }
        });
      });
    }

    if (anyChanged) {
      persistQaBucket(deckId);
      refreshQaComposerFeedOnly();
      refreshQrModalCountOnly(deckId);
      if (state.isOpen && state.deckId === deckId && getCurrentSlide().type === "qa") {
        updateStageView();
      }
      if (ROLE === "faculty" && newQuestions.length > 0) {
        newQuestions.forEach((qObj) => {
          publishQaMqtt(`${deckId}/q/${qObj.id}`, qObj, true);
        });
      }
    }
    return anyChanged;
  }

  function sendPeerPacket(pkt, excludePeerId) {
    let sentAny = false;
    peerConns.forEach((conn, pid) => {
      if (excludePeerId && pid === excludePeerId) return;
      if (conn && conn.open) {
        try {
          conn.send(pkt);
          sentAny = true;
        } catch (_) {}
      }
    });
    if (!sentAny && pkt && pkt.type === "qa_pkt") {
      pendingPeerPublishes.push(pkt);
      if (pendingPeerPublishes.length > 80) pendingPeerPublishes.shift();
    }
  }

  function wirePeerConnection(conn) {
    if (!conn || !conn.peer) return;
    const pid = String(conn.peer);
    const onOpen = () => {
      peerConns.set(pid, conn);
      connectedBrokers.add(`peer:${pid}`);
      refreshQaConnBadge();
      try {
        conn.send({
          type: "qa_snapshot",
          snap: buildQaSnapshotPayload(state.deckId || "w1-d1-global")
        });
        if (ROLE === "faculty" && state.isOpen) {
          conn.send({
            type: "host_sync",
            data: {
              senderRole: "faculty",
              deckId: state.deckId,
              slideIdx: state.slideIdx,
              stationIdx: state.stationIdx,
              qaFocusIdx: state.qaFocusIdx,
              backdropMode: state.backdropMode,
              ts: Date.now()
            }
          });
        }
      } catch (_) {}
      if (pendingPeerPublishes.length > 0) {
        const batch = pendingPeerPublishes.splice(0, pendingPeerPublishes.length);
        batch.forEach((item) => {
          try {
            conn.send(item);
          } catch (_) {}
        });
      }
    };

    if (conn.open) onOpen();
    else conn.on("open", onOpen);

    conn.on("data", (msg) => {
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "qa_pkt" && msg.kind && msg.data) {
        const changed = ingestQaPacket(msg.kind, msg.data);
        if (ROLE === "faculty" && changed) {
          sendPeerPacket(msg, pid);
          const dId = msg.data.deckId || "w1-d1-global";
          if (msg.kind === "question" && msg.data.id) {
            publishQaMqtt(`${dId}/q/${msg.data.id}`, msg.data, true);
          } else if (msg.kind === "like" && msg.data.id && msg.data.voterId) {
            publishQaMqtt(`${dId}/like/${msg.data.id}/${msg.data.voterId}`, msg.data, true);
          } else if (msg.kind === "mod" && msg.data.id) {
            publishQaMqtt(`${dId}/mod/${msg.data.id}`, msg.data, true);
          }
        }
      } else if (msg.type === "qa_snapshot" && msg.snap) {
        const merged = ingestQaSnapshot(msg.snap);
        if (ROLE === "faculty" && merged) {
          sendPeerPacket({ type: "qa_snapshot", snap: buildQaSnapshotPayload(msg.snap.deckId || state.deckId) }, pid);
        }
      } else if (msg.type === "host_sync" && msg.data) {
        handleIncomingSync(msg.data);
      }
    });

    const onClose = () => {
      peerConns.delete(pid);
      connectedBrokers.delete(`peer:${pid}`);
      refreshQaConnBadge();
    };
    conn.on("close", onClose);
    conn.on("error", onClose);
  }

  function connectPeerToHosts() {
    if (!peerInst || peerInst.destroyed || !peerInst.open) return;
    PEER_HOST_IDS.forEach((hostId) => {
      if (peerInst.id === hostId) return;
      const existing = peerConns.get(hostId);
      if (existing && existing.open) return;
      try {
        const conn = peerInst.connect(hostId, { reliable: true });
        if (conn) wirePeerConnection(conn);
      } catch (_) {}
    });
  }

  function initPeerBridge() {
    if (typeof window.Peer !== "function") return;
    if (peerInst && !peerInst.destroyed) return;

    try {
      if (ROLE === "faculty") {
        const desiredId =
          peerHostSlotIdx < PEER_HOST_IDS.length ? PEER_HOST_IDS[peerHostSlotIdx] : undefined;
        const p = desiredId ? new window.Peer(desiredId, { debug: 0 }) : new window.Peer(undefined, { debug: 0 });
        peerInst = p;
        p.on("open", () => {
          connectedBrokers.add("peer:signaling");
          refreshQaConnBadge();
          connectPeerToHosts();
        });
        p.on("connection", (conn) => wirePeerConnection(conn));
        p.on("disconnected", () => {
          connectedBrokers.delete("peer:signaling");
          refreshQaConnBadge();
          try { p.reconnect(); } catch (_) {}
        });
        p.on("error", (err) => {
          if (err && err.type === "unavailable-id" && peerHostSlotIdx < PEER_HOST_IDS.length) {
            peerHostSlotIdx += 1;
            try { p.destroy(); } catch (_) {}
            peerInst = null;
            setTimeout(initPeerBridge, 120);
          }
        });
      } else {
        const p = new window.Peer(undefined, { debug: 0 });
        peerInst = p;
        p.on("open", () => {
          connectedBrokers.add("peer:signaling");
          refreshQaConnBadge();
          connectPeerToHosts();
        });
        p.on("connection", (conn) => wirePeerConnection(conn));
        p.on("disconnected", () => {
          connectedBrokers.delete("peer:signaling");
          refreshQaConnBadge();
          try { p.reconnect(); } catch (_) {}
        });
        p.on("error", () => {});
      }
    } catch (_) {}

    if (!peerReconnectTimer) {
      peerReconnectTimer = setInterval(() => {
        if (!state.isOpen && !state.qaComposerOpen) return;
        if (!peerInst || peerInst.destroyed) {
          initPeerBridge();
        } else if (peerInst.open) {
          connectPeerToHosts();
        }
      }, 8000);
    }
  }

  function submitLiveFloorQuestion(deckId, rawText, rawAuthor, rawTarget) {
    const text = String(rawText || "").replace(/\s+/g, " ").trim().slice(0, 420);
    if (text.length < 2) return null;
    const author = String(rawAuthor || "").trim().slice(0, 50);
    const target = String(rawTarget || QA_TARGET_OPTIONS[0]).trim().slice(0, 50);
    saveQaAuthor(author);

    const qObj = {
      id: "fq_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7),
      deckId: deckId || "w1-d1-global",
      text,
      target,
      author,
      senderId: getDeviceId(),
      ts: Date.now()
    };

    initLiveSync();
    ingestQaPacket("question", qObj);
    if (qaBc) {
      try { qaBc.postMessage({ kind: "question", data: qObj }); } catch (_) {}
    }
    publishQaMqtt(`${qObj.deckId}/q/${qObj.id}`, qObj, true);
    sendPeerPacket({ type: "qa_pkt", kind: "question", data: qObj });
    return qObj;
  }

  function toggleLikeFloorQuestion(deckId, qId) {
    const bucket = ensureQaBucket(deckId);
    const myId = getDeviceId();
    const set = bucket.likes.get(qId);
    const nextLiked = !(set && set.has(myId));
    const pkt = {
      deckId: deckId || "w1-d1-global",
      id: qId,
      voterId: myId,
      liked: nextLiked,
      ts: Date.now()
    };
    initLiveSync();
    ingestQaPacket("like", pkt);
    if (qaBc) {
      try { qaBc.postMessage({ kind: "like", data: pkt }); } catch (_) {}
    }
    publishQaMqtt(`${pkt.deckId}/like/${qId}/${myId}`, pkt, true);
    sendPeerPacket({ type: "qa_pkt", kind: "like", data: pkt });
  }

  function hideFloorQuestion(deckId, qId) {
    if (!qId) return;
    const pkt = {
      deckId: deckId || "w1-d1-global",
      id: qId,
      hidden: true,
      ts: Date.now()
    };
    initLiveSync();
    ingestQaPacket("mod", pkt);
    if (qaBc) {
      try { qaBc.postMessage({ kind: "mod", data: pkt }); } catch (_) {}
    }
    publishQaMqtt(`${pkt.deckId}/mod/${qId}`, pkt, true);
    sendPeerPacket({ type: "qa_pkt", kind: "mod", data: pkt });
  }

  function initLiveSync() {
    ensureQaBucket(state.deckId || "w1-d1-global");
    initPeerBridge();

    if (typeof BroadcastChannel !== "undefined" && !bc) {
      try {
        bc = new BroadcastChannel(SYNC_BC_NAME);
        bc.onmessage = (ev) => handleIncomingSync(ev.data);
      } catch (_) {}
    }
    if (typeof BroadcastChannel !== "undefined" && !qaBc) {
      try {
        qaBc = new BroadcastChannel(QA_BC_NAME);
        qaBc.onmessage = (ev) => {
          if (ev && ev.data && ev.data.kind) {
            ingestQaPacket(ev.data.kind, ev.data.data);
          }
        };
      } catch (_) {}
    }
    if (window.mqtt && typeof window.mqtt.connect === "function" && mqttClients.length === 0) {
      MQTT_BROKERS.forEach((brokerUrl, bIdx) => {
        try {
          const tag = `b${bIdx + 1}`;
          const client = window.mqtt.connect(brokerUrl, {
            clientId: `racm_psv_${tag}_` + Math.random().toString(36).slice(2, 10),
            clean: true,
            connectTimeout: 7000,
            reconnectPeriod: 5000,
            keepalive: 45
          });
          client.on("connect", () => {
            connectedBrokers.add(tag);
            try {
              client.subscribe(MQTT_TOPIC, { qos: 0 });
              client.subscribe(`${QA_MQTT_NS}/#`, { qos: 0 });
            } catch (_) {}
            if (pendingQaPublishes.length > 0) {
              const batch = pendingQaPublishes.splice(0, pendingQaPublishes.length);
              batch.forEach((item) => {
                try {
                  client.publish(item.topic, item.payload, { qos: 0, retain: item.retain });
                } catch (_) {}
              });
            }
            refreshQaConnBadge();
          });
          client.on("close", () => {
            connectedBrokers.delete(tag);
            refreshQaConnBadge();
          });
          client.on("error", () => {
            connectedBrokers.delete(tag);
            refreshQaConnBadge();
          });
          client.on("message", (topic, payload) => {
            try {
              const rawStr = payload ? payload.toString() : "";
              if (!rawStr) return;
              if (topic === MQTT_TOPIC) {
                handleIncomingSync(JSON.parse(rawStr));
                return;
              }
              if (topic.startsWith(`${QA_MQTT_NS}/`)) {
                const sub = topic.slice(QA_MQTT_NS.length + 1);
                const parts = sub.split("/");
                const parsed = JSON.parse(rawStr);
                if (parts[1] === "q") ingestQaPacket("question", parsed);
                else if (parts[1] === "mod") ingestQaPacket("mod", parsed);
                else if (parts[1] === "like") ingestQaPacket("like", parsed);
                else if (parts[1] === "clear") ingestQaPacket("clear", parsed);
              }
            } catch (_) {}
          });
          mqttClients.push(client);
        } catch (_) {}
      });
    }
  }

  function broadcastHostState() {
    if (ROLE !== "faculty" || !state.isOpen) return;
    const msg = {
      senderRole: "faculty",
      deckId: state.deckId,
      slideIdx: state.slideIdx,
      stationIdx: state.stationIdx,
      qaFocusIdx: state.qaFocusIdx,
      backdropMode: state.backdropMode,
      ts: Date.now()
    };
    if (bc) {
      try { bc.postMessage(msg); } catch (_) {}
    }
    mqttClients.forEach((cl) => {
      if (cl && cl.connected) {
        try { cl.publish(MQTT_TOPIC, JSON.stringify(msg)); } catch (_) {}
      }
    });
    sendPeerPacket({ type: "host_sync", data: msg });
  }

  function handleIncomingSync(msg) {
    if (!msg || msg.senderRole !== "faculty") return;
    if (!state.isOpen || ROLE === "faculty" || !state.followHost) return;
    let changed = false;
    if (msg.deckId && PANEL_DECKS[msg.deckId] && msg.deckId !== state.deckId) {
      state.deckId = msg.deckId;
      state.stationIdx = 0;
      state.qaFocusIdx = 0;
      changed = true;
    }
    const deck = getCurrentDeck();
    if (typeof msg.slideIdx === "number" && msg.slideIdx >= 0 && msg.slideIdx < deck.slides.length && msg.slideIdx !== state.slideIdx) {
      state.slideIdx = msg.slideIdx;
      state.stationIdx = 0;
      state.qaFocusIdx = 0;
      changed = true;
    }
    if (typeof msg.stationIdx === "number" && msg.stationIdx >= 0 && msg.stationIdx !== state.stationIdx) {
      state.stationIdx = msg.stationIdx;
      changed = true;
    }
    if (typeof msg.qaFocusIdx === "number" && msg.qaFocusIdx >= 0 && msg.qaFocusIdx !== state.qaFocusIdx) {
      state.qaFocusIdx = msg.qaFocusIdx;
      changed = true;
    }
    if (msg.backdropMode && msg.backdropMode !== state.backdropMode) {
      state.backdropMode = msg.backdropMode;
      changed = true;
    }
    if (changed) updateStageView();
  }

  function getCurrentDeck() {
    return PANEL_DECKS[state.deckId] || PANEL_DECKS["w1-d1-global"];
  }

  function getCurrentSlide() {
    const deck = getCurrentDeck();
    const idx = Math.max(0, Math.min(deck.slides.length - 1, state.slideIdx));
    return deck.slides[idx];
  }

  /* ---------- Clock & Session Timer ---------- */
  function formatBangkokClock() {
    try {
      return new Intl.DateTimeFormat("th-TH", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date()) + " น.";
    } catch (_) {
      return "";
    }
  }

  function formatElapsed(sec, limitMin) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} / ${limitMin || 150}:00`;
  }

  function toggleSessionTimer() {
    if (state.sessionRunning) {
      state.sessionRunning = false;
      if (state.sessionTimer) {
        clearInterval(state.sessionTimer);
        state.sessionTimer = null;
      }
    } else {
      state.sessionRunning = true;
      state.sessionTimer = setInterval(() => {
        state.sessionSec += 1;
        const el = document.getElementById("psvTimerBtn");
        if (el) {
          el.textContent = `⏱ ${formatElapsed(state.sessionSec, getCurrentDeck().sessionLimitMin)}`;
        }
      }, 1000);
    }
    syncHudButtonsOnly();
  }

  /* ---------- Auto-Hide HUD ("Zero Persistent Chrome" Idle Detection) ---------- */
  function clearIdleTimer() {
    if (state.idleTimer) {
      clearTimeout(state.idleTimer);
      state.idleTimer = null;
    }
  }

  function resetIdleActivity() {
    if (!state.isOpen) return;
    if (state.idleClean) {
      state.idleClean = false;
      const modal = document.getElementById("panelDeckModal");
      if (modal) modal.classList.remove("is-idle-clean");
    }
    clearIdleTimer();
    if (state.modDrawerOpen || state.stuDrawerOpen || state.qrLightboxOpen || state.qaComposerOpen) return;
    state.idleTimer = setTimeout(() => {
      if (!state.isOpen || state.modDrawerOpen || state.stuDrawerOpen || state.qrLightboxOpen || state.qaComposerOpen) return;
      const activeTag = document.activeElement && document.activeElement.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;
      state.idleClean = true;
      const modal = document.getElementById("panelDeckModal");
      if (modal) modal.classList.add("is-idle-clean");
    }, IDLE_HIDE_MS);
  }

  function forceCleanScreenNow() {
    clearIdleTimer();
    state.modDrawerOpen = false;
    state.stuDrawerOpen = false;
    state.qrLightboxOpen = false;
    state.idleClean = true;
    const modal = document.getElementById("panelDeckModal");
    if (modal) {
      modal.classList.add("is-idle-clean");
      const dr = document.getElementById("psvModDrawer");
      if (dr) dr.hidden = true;
      const sdr = document.getElementById("psvStuDrawer");
      if (sdr) sdr.hidden = true;
      const qm = document.getElementById("psvQrModal");
      if (qm) qm.hidden = true;
    }
  }

  /* ---------- Ambient Screensaver Auto-Cycle ---------- */
  function clearCycleTimer() {
    if (state.cycleTimer) {
      clearTimeout(state.cycleTimer);
      state.cycleTimer = null;
    }
  }

  function scheduleNextAmbientTick() {
    clearCycleTimer();
    const modal = document.getElementById("panelDeckModal");
    const tickMs = AMBIENT_CYCLE_MS;
    if (modal) {
      modal.classList.toggle("is-ambient-cycling", Boolean(state.isOpen && state.ambientCycle));
      modal.style.setProperty("--psv-cycle-ms", `${tickMs}ms`);
    }
    if (!state.isOpen || !state.ambientCycle) return;
    const bar = document.getElementById("psvAmbientProgressBar");
    if (bar) {
      bar.style.animation = "none";
      void bar.offsetWidth;
      bar.style.animation = "";
    }
    state.cycleTimer = setTimeout(() => {
      if (!state.isOpen || !state.ambientCycle) return;
      const deck = getCurrentDeck();
      if (state.qaLoopOnly && deck.qaLoopRange) {
        const [startIdx, endIdx] = deck.qaLoopRange;
        const next = state.slideIdx < startIdx || state.slideIdx >= endIdx ? startIdx : state.slideIdx + 1;
        goToSlide(next, true);
      } else {
        const next = (state.slideIdx + 1) % deck.slides.length;
        goToSlide(next, true);
      }
    }, tickMs);
  }

  function toggleAmbientCycle(qaOnly) {
    if (qaOnly) {
      state.qaLoopOnly = !state.qaLoopOnly;
      state.ambientCycle = state.qaLoopOnly;
    } else {
      state.qaLoopOnly = false;
      state.ambientCycle = !state.ambientCycle;
    }
    syncHudButtonsOnly();
    scheduleNextAmbientTick();
  }

  /* ---------- Bidirectional Auto-Fit + Live Question Font Optimizer ---------- */
  function setFontScale(nextScale) {
    const clamped = Math.max(0.78, Math.min(1.38, Math.round(nextScale * 100) / 100));
    state.fontScale = clamped;
    try {
      localStorage.setItem("racm303_psv_font_scale", String(clamped));
    } catch (_) {}
    const modal = document.getElementById("panelDeckModal");
    if (modal) {
      modal.style.setProperty("--psv-font-scale", String(clamped));
    }
    const ro = document.getElementById("psvFontReadout");
    if (ro) ro.textContent = `${Math.round(clamped * 100)}%`;
    scheduleFitSlideBody();
  }

  function fitLiveQaSpotlightText() {
    const viewportEl = document.getElementById("psvQaTextViewport");
    const textEl = document.getElementById("psvQaSpotlightText");
    if (!viewportEl || !textEl) return;

    const scale = state.fontScale || 1;
    const len = (textEl.textContent || "").trim().length;

    if (window.innerWidth <= 960) {
      const mobPx = len <= 70 ? 24 : len <= 150 ? 20 : len <= 260 ? 18 : 16;
      textEl.style.fontSize = `${Math.round(mobPx * scale)}px`;
      textEl.style.lineHeight = "1.38";
      return;
    }

    const availH = viewportEl.clientHeight - 8;
    const availW = viewportEl.clientWidth - 4;
    if (availH < 48 || availW < 120) return;

    const maxCeil = len <= 55 ? 52 : len <= 110 ? 46 : len <= 190 ? 40 : len <= 290 ? 34 : 29;
    let lo = 15;
    let hi = Math.max(18, Math.round(maxCeil * scale));

    for (let i = 0; i < 11; i += 1) {
      const mid = (lo + hi) * 0.5;
      const lh = mid >= 38 ? 1.25 : mid >= 28 ? 1.32 : 1.4;
      textEl.style.fontSize = `${mid.toFixed(2)}px`;
      textEl.style.lineHeight = String(lh);
      const fits = textEl.scrollHeight <= availH && textEl.scrollWidth <= availW + 2;
      if (fits) lo = mid;
      else hi = mid;
    }
    const finalPx = Math.max(15, lo * 0.97);
    textEl.style.fontSize = `${finalPx.toFixed(1)}px`;
    textEl.style.lineHeight = String(finalPx >= 38 ? 1.25 : finalPx >= 28 ? 1.32 : 1.4);
  }

  function fitCurrentSlideBody() {
    const modal = document.getElementById("panelDeckModal");
    const viewport = document.getElementById("psvStageViewport");
    const body = document.getElementById("psvSlideBody");
    if (!modal || modal.hidden || !viewport || !body) return;

    const hudTop = document.getElementById("psvHudTop");
    const hudH = hudTop ? Math.ceil(hudTop.offsetHeight || 44) : 44;
    const topClear = Math.max(46, hudH + 10);
    modal.style.setProperty("--psv-top-clear", `${topClear}px`);

    if (body.classList.contains("is-qa-live-mode")) {
      modal.style.setProperty("--psv-fit-scale", "1");
      fitLiveQaSpotlightText();
      return;
    }

    if (body.classList.contains("is-takeaway-mode")) {
      modal.style.setProperty("--psv-fit-scale", "1");
      return;
    }

    if (window.innerWidth <= 960) {
      modal.style.setProperty("--psv-fit-scale", "1");
      return;
    }

    const isRail = body.classList.contains("is-railway-mode");
    const cs = window.getComputedStyle(viewport);
    const padBottom = parseFloat(cs.paddingBottom) || 0;
    const availH = viewport.clientHeight - topClear - padBottom - 4;
    if (availH < 120) return;

    body.setAttribute("data-measuring", "1");
    let lo = isRail ? 0.50 : 0.62;
    let hi = isRail ? 1.04 : 1.18;
    for (let i = 0; i < 12; i += 1) {
      const mid = (lo + hi) * 0.5;
      modal.style.setProperty("--psv-fit-scale", mid.toFixed(4));
      const fits = body.scrollHeight <= availH && body.scrollWidth <= body.clientWidth + 4;
      if (fits) lo = mid;
      else hi = mid;
    }
    const safeScale = Math.max(isRail ? 0.50 : 0.62, Math.min(isRail ? 1.02 : 1.16, lo * 0.975));
    modal.style.setProperty("--psv-fit-scale", safeScale.toFixed(4));
    body.removeAttribute("data-measuring");
  }

  function scheduleFitSlideBody() {
    if (state.resizeRaf) cancelAnimationFrame(state.resizeRaf);
    state.resizeRaf = requestAnimationFrame(() => {
      state.resizeRaf = 0;
      fitCurrentSlideBody();
    });
  }

  /* ---------- Crossfade Backdrop, Panoramic Wall & Speaker Die-Cut Logo Halo ---------- */
  function updateBackdropForSlide(slide) {
    const modal = document.getElementById("panelDeckModal");
    if (!modal || !slide) return;
    modal.setAttribute("data-backdrop", state.backdropMode);

    const orbs = slide.orbs;
    if (orbs && orbs.length === 3) {
      modal.style.setProperty("--psv-orb-1", orbs[0]);
      modal.style.setProperty("--psv-orb-2", orbs[1]);
      modal.style.setProperty("--psv-orb-3", orbs[2]);
    }

    const isTimelineAll = Boolean(slide.type === "timeline" && Array.isArray(slide.milestones) && slide.milestones.length);
    const isTakeaway = slide.type === "takeaway-cover" || slide.type === "takeaway-visual";
    modal.classList.toggle("is-multi-station-bg", isTimelineAll);
    modal.classList.toggle("is-qa-stage", slide.type === "qa");
    modal.classList.toggle("is-takeaway-stage", isTakeaway);

    const multiWall = document.getElementById("psvMultiBgWall");
    if (multiWall) {
      if (isTimelineAll) {
        const wallItems =
          Array.isArray(slide.wallPhotos) && slide.wallPhotos.length
            ? slide.wallPhotos
            : slide.milestones.map((m, idx) => ({
                img: m.bg || slide.bg,
                label: `0${idx + 1} · ${m.shortStop || m.year}`,
                pinIdx: idx
              }));
        const wallSig = `${slide.id}:${wallItems.length}`;
        multiWall.hidden = false;
        multiWall.removeAttribute("data-focus-col");
        multiWall.style.setProperty("--psv-wall-cols", String(wallItems.length));
        if (multiWall.getAttribute("data-wall-sig") !== wallSig) {
          multiWall.setAttribute("data-wall-sig", wallSig);
          multiWall.innerHTML = wallItems
            .map(
              (wp, wIdx) => `
              <div class="psv-mbg-col" data-wall-col="${wIdx}" data-wall-pin="${typeof wp.pinIdx === "number" ? wp.pinIdx : wIdx}">
                <div class="psv-mbg-photo" style="background-image:url('${IMG_DIR}/${esc(wp.img)}?v=${ASSET_VER}')"></div>
                ${wp.label ? `<span class="psv-mbg-cap">${esc(wp.label)}</span>` : ""}
              </div>
            `
            )
            .join("");
        }
      } else {
        multiWall.hidden = true;
        multiWall.removeAttribute("data-focus-col");
      }
    }

    const bgFile = slide.bg || "bg_01_bedside_horizon.jpg";
    const kbCls = slide.kb || "kb-a";
    const nextUrl = `${IMG_DIR}/${bgFile}?v=${ASSET_VER}`;
    const slot0 = document.getElementById("psvBgSlot0");
    const slot1 = document.getElementById("psvBgSlot1");
    if (!slot0 || !slot1) return;

    if (state.currentBgUrl !== nextUrl) {
      state.currentBgUrl = nextUrl;
      const nextSlotIdx = state.activeBgSlot === 0 ? 1 : 0;
      const incoming = nextSlotIdx === 0 ? slot0 : slot1;
      const outgoing = nextSlotIdx === 0 ? slot1 : slot0;

      incoming.className = `psv-bg-slot ${kbCls}`;
      incoming.style.backgroundImage = `url("${nextUrl}")`;
      void incoming.offsetWidth;
      incoming.classList.add("is-active");
      outgoing.classList.remove("is-active");
      state.activeBgSlot = nextSlotIdx;
    }

    const dicutStage = document.getElementById("psvDicutStage");
    const dicutImgEl = document.getElementById("psvDicutImg");
    const dicutHaloEl = document.getElementById("psvDicutLogoHalo");
    if (dicutStage && dicutImgEl) {
      if (slide.dicutImg) {
        const dicutUrl = `${IMG_DIR}/${slide.dicutImg}?v=${ASSET_VER}`;
        dicutStage.hidden = false;
        dicutStage.style.transform = "";
        if (state.currentDicutUrl !== dicutUrl) {
          state.currentDicutUrl = dicutUrl;
          dicutImgEl.src = dicutUrl;
          dicutImgEl.alt = slide.title || "วิทยากร";
          dicutImgEl.style.animation = "none";
          void dicutImgEl.offsetWidth;
          dicutImgEl.style.animation = "";
        }
        if (dicutHaloEl) {
          const haloList = Array.isArray(slide.haloLogos) ? slide.haloLogos.slice(0, 7) : [];
          dicutHaloEl.innerHTML = haloList
            .map(
              (hl, hIdx) => `
              <div class="psv-halo-plaque" data-halo-slot="${hIdx}" data-org-key="${esc(hl.key || "")}" title="${esc(hl.label || "")}">
                <img class="psv-halo-logo-img" src="${IMG_DIR}/${esc(hl.logo)}?v=${ASSET_VER}" alt="${esc(hl.label || "")}" />
                <span class="psv-halo-logo-lbl">${esc(hl.label || "")}</span>
              </div>
            `
            )
            .join("");
        }
      } else {
        dicutStage.hidden = true;
        state.currentDicutUrl = "";
        if (dicutHaloEl) dicutHaloEl.innerHTML = "";
      }
    }
  }

  /* ---------- Render Slide Inner HTML by Archetype ---------- */
  function getSavedStudentNote(key) {
    try {
      return localStorage.getItem(`racm303_psv_note_${key}`) || "";
    } catch (_) {
      return "";
    }
  }

  function saveStudentNote(key, val) {
    try {
      localStorage.setItem(`racm303_psv_note_${key}`, val);
    } catch (_) {}
  }

  function buildQaSpotTopHtml(qList, focusIdx) {
    const total = qList.length;
    if (total === 0) {
      return `
        <div class="psv-qa-spot-meta-left">
          <span class="psv-qa-live-pill"><span class="psv-qa-live-dot"></span>LIVE FLOOR Q&amp;A</span>
          <span class="psv-qa-author-badge">กำลังเปิดรับคำถามสดจากฟลอร์ (0 ข้อ)</span>
        </div>
        <span class="psv-qa-clicker-status is-all-done">🖱️ คลิกเมาส์ หรือกด Clicker (→) เพื่อไป Q5</span>
      `;
    }
    const cur = qList[focusIdx] || qList[0];
    const remaining = Math.max(0, total - 1 - focusIdx);
    const authorTxt = cur.author ? `👩‍⚕️ ${cur.author}` : "👩‍⚕️ นักศึกษาแพทย์จากฟลอร์";
    const timeTxt = formatQaTimeAgo(cur.ts);
    const likeBadge = cur.likeCount > 0 ? `<span class="psv-qa-author-badge">❤️ ${cur.likeCount}</span>` : "";
    const statusHtml =
      remaining > 0
        ? `<span class="psv-qa-clicker-status">🕹️ Clicker (→) คำถามถัดไป · เหลืออีก ${remaining} ข้อ</span>`
        : `<span class="psv-qa-clicker-status is-all-done">✓ ครบทุกคำถามแล้ว · Clicker (→) ไปสไลด์ถัดไป (Q5)</span>`;

    return `
      <div class="psv-qa-spot-meta-left">
        <span class="psv-qa-live-pill"><span class="psv-qa-live-dot"></span>LIVE</span>
        <span class="psv-qa-counter-pill">คำถามที่ ${focusIdx + 1} / ${total}</span>
        ${cur.target ? `<span class="psv-qa-target-badge">🎤 ถึง: ${esc(cur.target)}</span>` : ""}
        <span class="psv-qa-author-badge">${esc(authorTxt)}${timeTxt ? ` · ${esc(timeTxt)}` : ""}</span>
        ${likeBadge}
      </div>
      ${statusHtml}
    `;
  }

  function buildQaSpotFootHtml(qList, focusIdx) {
    const total = qList.length;
    const pillsHtml =
      total > 0
        ? qList
            .map((q, idx) => {
              const isCur = idx === focusIdx;
              const isViewed = state.qaViewedIds.has(q.id);
              const cls = isCur ? " is-current" : isViewed ? " is-viewed" : " is-unread";
              return `<button type="button" class="psv-qa-q-pill${cls}" data-psv-qa-idx="${idx}" title="${esc(q.text.slice(0, 80))}">#${idx + 1}${isViewed && !isCur ? " ✓" : ""}</button>`;
            })
            .join("")
        : `<span style="font-size:12px;color:#94a3b8;font-weight:600">สแกน QR ขวามือเพื่อส่งคำถามแรกขึ้นบนเวทีเสวนา</span>`;

    const cur = total > 0 ? qList[focusIdx] : null;
    const stepBtnsHtml =
      total > 1
        ? `
          <button type="button" class="psv-qa-step-btn" data-psv-act="qa-prev-item" ${focusIdx <= 0 ? "disabled" : ""} title="ดูคำถามก่อนหน้า">‹ ก่อนหน้า</button>
          <button type="button" class="psv-qa-step-btn" data-psv-act="qa-next-item" ${focusIdx >= total - 1 ? "disabled" : ""} title="ดูคำถามถัดไป">ถัดไป ›</button>
        `
        : "";
    const hideBtnHtml =
      cur && ROLE === "faculty"
        ? `<button type="button" class="psv-qa-step-btn" data-psv-act="hide-current-qa" title="ซ่อนคำถามข้อนี้จากหน้าจอ">✕ ซ่อน</button>`
        : "";

    return `
      <div class="psv-qa-queue-strip" id="psvQaQueueStrip">${pillsHtml}</div>
      <div class="psv-qa-mouse-actions">
        ${stepBtnsHtml}
        <button type="button" class="psv-qa-step-btn psv-qa-ask-btn" data-psv-act="open-qa-composer" title="เปิดหน้าต่างพิมพ์ส่งคำถามสดขึ้นจอ">✍️ ส่งคำถามสด</button>
        ${hideBtnHtml}
        <button type="button" class="psv-qa-skip-slide-btn" data-psv-act="force-next-slide" title="คลิกเมาส์เพื่อข้ามไปสไลด์ถัดไป (Slide 13 · Q5) ได้ทันทีโดยไม่ต้องเลื่อนครบทุกคำถาม">🖱️ ไปสไลด์ถัดไป (Q5) ›</button>
      </div>
    `;
  }

  function refreshLiveQaStageChromeInPlace(qList) {
    const topEl = document.getElementById("psvQaSpotTop");
    const footEl = document.getElementById("psvQaSpotFoot");
    if (topEl) topEl.innerHTML = buildQaSpotTopHtml(qList, state.qaFocusIdx);
    if (footEl) footEl.innerHTML = buildQaSpotFootHtml(qList, state.qaFocusIdx);
  }

  function renderSlideInnerHtml(deck, slide) {
    if (slide.type === "cover") {
      const castHtml = (slide.cast || [])
        .map((c) => {
          const avatarHtml = c.photo
            ? `<img class="psv-cast-avatar" src="${esc(c.photo)}" alt="${esc(c.name)}" loading="eager" />`
            : `<span class="psv-cast-avatar">${esc(c.initials || "MD")}</span>`;
          const modCls = c.isModerator ? " is-moderator" : "";
          const tagHtml = c.groupTag ? `<span class="psv-cast-tag">${esc(c.groupTag)}</span>` : "";
          return `
            <div class="psv-cast-chip${modCls}">
              ${avatarHtml}
              <div class="psv-cast-meta">
                ${tagHtml}
                <span class="psv-cast-name">${esc(c.name)}</span>
                <span class="psv-cast-role">${esc(c.role)}</span>
              </div>
            </div>
          `;
        })
        .join("");

      const titleCls = slide.bilingualCover ? "psv-hero-title is-bilingual-cover" : "psv-hero-title";
      return `
        <div class="psv-cover-split is-no-qr">
          <div style="display:flex;flex-direction:column;gap:calc(10px * var(--psv-eff-scale));min-width:0">
            <div class="psv-kicker-row">
              <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
              ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
            </div>
            <h2 class="${titleCls}">${esc(slide.title)}</h2>
            ${slide.enSubtitle ? `<p class="psv-en-subtitle">${esc(slide.enSubtitle)}</p>` : ""}
            ${slide.subtitle ? `<p class="psv-logline">${esc(slide.subtitle)}</p>` : ""}
            <div class="psv-cast-strip">${castHtml}</div>
          </div>
        </div>
      `;
    }

    if (slide.type === "objectives") {
      const loHtml = (slide.objectives || [])
        .map(
          (o) => `
          <div class="psv-lo-card">
            <div class="psv-lo-head">
              <span class="psv-lo-num">${esc(o.num)}</span>
              ${o.tag ? `<span class="psv-lo-tag">${esc(o.tag)}</span>` : ""}
            </div>
            <p class="psv-lo-text">${esc(o.text)}</p>
          </div>
        `
        )
        .join("");
      return `
        <div class="psv-kicker-row">
          <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
          ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
        </div>
        ${slide.stemLead ? `<p class="psv-lo-stem">${esc(slide.stemLead)}</p>` : ""}
        <div class="psv-lo-grid">${loHtml}</div>
      `;
    }

    if (slide.type === "timeline") {
      const milestones = slide.milestones || [];
      const totalSt = Math.max(1, milestones.length);
      const zzCols = totalSt === 5 ? 15 : totalSt === 6 ? 13 : totalSt * 2 + 1;
      const pinCols5 = [2, 5, 8, 11, 14];
      const cardSpans5 = ["1 / span 5", "3 / span 5", "6 / span 5", "9 / span 5", "11 / span 5"];
      const pinCols6 = [2, 4, 6, 8, 10, 12];
      const cardSpans6 = ["1 / span 4", "2 / span 4", "5 / span 4", "6 / span 4", "9 / span 4", "10 / span 4"];

      const orgChipsHtml = (slide.haloLogos || [])
        .map(
          (hl) => `
          <span class="psv-org-mini-chip" data-org-chip="${esc(hl.key || "")}">
            <img src="${IMG_DIR}/${esc(hl.logo)}?v=${ASSET_VER}" alt="${esc(hl.label || "")}" />
            <span>${esc(hl.label || "")}</span>
          </span>
        `
        )
        .join("");

      const mobDicutHtml = slide.dicutImg
        ? `
          <div class="psv-mobile-dicut-banner">
            <img class="psv-mobile-dicut-thumb" src="${IMG_DIR}/${esc(slide.dicutImg)}?v=${ASSET_VER}" alt="${esc(slide.title)}" />
            <div style="min-width:0">
              <h2 class="psv-hero-title is-compact-title">${esc(slide.title)}</h2>
              ${slide.roleSubtitle ? `<p class="psv-spk-role-sub" style="margin-top:2px">${esc(slide.roleSubtitle)}</p>` : ""}
            </div>
          </div>
        `
        : "";

      const deskHeadHtml = `
        <div class="psv-spk-head-bar">
          <div class="psv-desk-spk-head">
            <h2 class="psv-hero-title is-compact-title">${esc(slide.title)}</h2>
            ${slide.roleSubtitle ? `<p class="psv-spk-role-sub">${esc(slide.roleSubtitle)}</p>` : ""}
          </div>
          ${orgChipsHtml ? `<div class="psv-spk-org-strip">${orgChipsHtml}</div>` : ""}
        </div>
      `;

      let pinCellsHtml = "";
      let cardsHtml = "";

      milestones.forEach((m, i) => {
        const isTop = i % 2 === 0;
        const posCls = isTop ? "is-top" : "is-bottom";
        const pinCol = totalSt === 5 ? pinCols5[i] : totalSt === 6 ? pinCols6[i] : i * 2 + 2;
        const cardSpan =
          totalSt === 5
            ? cardSpans5[i]
            : totalSt === 6
            ? cardSpans6[i]
            : `${Math.max(1, pinCol - 1)} / span 4`;
        const numStr = String(i + 1).padStart(2, "0");

        pinCellsHtml += `
          <div class="psv-zz-pin-cell ${posCls}" data-pin-cell="${i}" style="--pin-col:${pinCol}">
            <div class="psv-zz-stem" aria-hidden="true"></div>
            <button type="button" class="psv-zz-node" data-psv-zoom-pin="${i}" title="คลิกเพื่อขยายรายละเอียดสถานี ${numStr}">
              📍 ${numStr}
            </button>
          </div>
        `;

        const logoBadge = m.logo
          ? `<span class="psv-pin-logo-pill" title="${esc(m.logoLabel || "")}"><img src="${IMG_DIR}/${esc(m.logo)}?v=${ASSET_VER}" alt="${esc(m.logoLabel || "")}" /></span>`
          : "";

        const photosArr = Array.isArray(m.photos) ? m.photos : [];
        const photosHtml = photosArr.length
          ? `
            <div class="psv-pin-photos" style="--pin-photo-cols:${Math.min(2, photosArr.length)}">
              ${photosArr
                .map(
                  (ph) => `
                  <div class="psv-pin-photo-wrap">
                    <img src="${IMG_DIR}/${esc(ph.src)}?v=${ASSET_VER}" alt="${esc(ph.cap || m.headline || "")}" loading="eager" />
                    ${ph.cap ? `<span class="psv-pin-photo-tag">${esc(ph.cap)}</span>` : ""}
                  </div>
                `
                )
                .join("")}
            </div>
          `
          : "";

        const quoteHtml = m.quote
          ? `<blockquote class="psv-pin-quote">${m.quoteLabel ? `<span class="psv-pin-quote-lbl">${esc(m.quoteLabel)}</span>` : ""}${esc(m.quote)}</blockquote>`
          : "";

        cardsHtml += `
          <article class="psv-pin-card ${posCls}" data-psv-zoom-pin="${i}" data-pin-org="${esc(m.orgKey || "")}" style="--card-col:${cardSpan};--mob-order:${i}">
            <div class="psv-pin-head">
              <span class="psv-pin-yr-badge">📍 ${numStr} · ${esc(m.year || "")}${m.shortStop ? ` · ${esc(m.shortStop)}` : ""}</span>
              ${logoBadge}
            </div>
            ${photosHtml}
            ${m.headline ? `<h3 class="psv-pin-headline">${esc(m.headline)}</h3>` : ""}
            <p class="psv-pin-text">${esc(m.text || "")}</p>
            ${quoteHtml}
          </article>
        `;
      });

      return `
        <div class="psv-kicker-row">
          <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
          ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
        </div>
        ${mobDicutHtml}
        ${deskHeadHtml}
        <div class="psv-pin-zigzag" style="--psv-zz-cols:${zzCols}">
          <div class="psv-zz-track-bar" aria-hidden="true"></div>
          ${pinCellsHtml}
          ${cardsHtml}
        </div>
        ${slide.footnote ? `<div class="psv-footnote-whisper">${esc(slide.footnote)}</div>` : ""}
      `;
    }

    if (slide.type === "pacing") {
      const paceHtml = (slide.phases || [])
        .map(
          (p) => `
          <div class="psv-pace-card${p.featured ? " is-featured" : ""}">
            <span class="psv-pace-min">${esc(p.min)}</span>
            <h3 class="psv-pace-title">${esc(p.title)}</h3>
            <p class="psv-pace-desc">${esc(p.desc)}</p>
          </div>
        `
        )
        .join("");
      return `
        <div class="psv-kicker-row">
          <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
          ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
        </div>
        <h2 class="psv-hero-title is-compact-title">${esc(slide.title)}</h2>
        <div class="psv-pacing-grid">${paceHtml}</div>
      `;
    }

    if (slide.type === "outline") {
      const qCardsHtml = (slide.coreQuestions || [])
        .map(
          (item) => `
          <button type="button" class="psv-outline-card" data-psv-idx="${item.targetSlideIdx}">
            <div class="psv-outline-head">
              <span class="psv-outline-badge">${esc(item.badge)}</span>
              ${item.phase ? `<span class="psv-outline-phase">${esc(item.phase)}</span>` : ""}
            </div>
            <h3 class="psv-outline-en">${esc(item.en)}</h3>
            <p class="psv-outline-th">${esc(item.th)}</p>
          </button>
        `
        )
        .join("");

      const qa = slide.qaBridge || {};
      const q5 = slide.closingQuestion || {};
      return `
        <div class="psv-kicker-row">
          <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
          ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
        </div>
        <h2 class="psv-hero-title is-compact-title">${esc(slide.title)}</h2>
        <div class="psv-outline-wrap">
          <div class="psv-outline-q-grid">${qCardsHtml}</div>
          <div class="psv-outline-flow-row">
            <button type="button" class="psv-outline-card is-qa-bridge" data-psv-idx="${qa.targetSlideIdx || 11}">
              <div class="psv-outline-head">
                <span class="psv-outline-badge">${esc(qa.badge || "LIVE Q&A")}</span>
                ${qa.phase ? `<span class="psv-outline-phase">${esc(qa.phase)}</span>` : ""}
              </div>
              <h3 class="psv-outline-en">${esc(qa.en || "")}</h3>
              <p class="psv-outline-th">${esc(qa.th || "")}</p>
            </button>
            <div class="psv-outline-arrow" aria-hidden="true">→</div>
            <button type="button" class="psv-outline-card is-q5-finale" data-psv-idx="${q5.targetSlideIdx || 12}">
              <div class="psv-outline-head">
                <span class="psv-outline-badge">${esc(q5.badge || "Q5")}</span>
                ${q5.phase ? `<span class="psv-outline-phase">${esc(q5.phase)}</span>` : ""}
              </div>
              <h3 class="psv-outline-en">${esc(q5.en || "")}</h3>
              <p class="psv-outline-th">${esc(q5.th || "")}</p>
            </button>
          </div>
        </div>
      `;
    }

    if (slide.type === "prompt") {
      const total = slide.totalSteps || 5;
      const cur = slide.qStep || 1;
      let pips = "";
      for (let i = 1; i <= total; i += 1) {
        if (i === 5) {
          pips += `<span class="psv-q-qa-tag">Q&amp;A</span>`;
        }
        const cls = i === cur ? " is-current" : i < cur ? " is-done" : "";
        pips += `<span class="psv-q-pip${cls}"></span>`;
      }
      const subs = Array.isArray(slide.subQuestions) ? slide.subQuestions : [];
      const subCardsHtml = subs.length
        ? `
          <div class="psv-semi-q-stack">
            ${subs
              .map(
                (sq, idx) => `
                <div class="psv-semi-q-item">
                  <span class="psv-semi-q-bullet">${subs.length > 1 ? `${cur}.${idx + 1}` : `Q${cur}`}</span>
                  <p class="psv-semi-q-text">${esc(sq)}</p>
                </div>
              `
              )
              .join("")}
          </div>
        `
        : "";

      return `
        <div class="psv-kicker-row">
          <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
          ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
          <div class="psv-q-progress" aria-hidden="true">${pips}</div>
        </div>
        <div class="psv-q-head-wrap">
          <h2 class="psv-hero-title ${subs.length ? "is-semi-q-title" : "is-prompt-quote"}">${esc(slide.title)}</h2>
          ${slide.enHeading ? `<p class="psv-q-en-sub">${esc(slide.enHeading)}</p>` : ""}
        </div>
        ${subCardsHtml}
        ${slide.logline ? `<p class="psv-logline">${esc(slide.logline)}</p>` : ""}
      `;
    }

    if (slide.type === "qa") {
      const qList = getVisibleQaList(deck.id);
      if (qList.length > 0) {
        state.qaFocusIdx = Math.max(0, Math.min(qList.length - 1, state.qaFocusIdx));
        state.qaViewedIds.add(qList[state.qaFocusIdx].id);
      } else {
        state.qaFocusIdx = 0;
      }
      const activeQ = qList.length > 0 ? qList[state.qaFocusIdx] : null;
      const qrAskUrl = getQaScanUrl();

      const centerHtml = activeQ
        ? `<p class="psv-qa-spotlight-text" id="psvQaSpotlightText">“${esc(activeQ.text)}”</p>`
        : `
          <div class="psv-qa-empty-box">
            <h2 class="psv-qa-empty-title">${esc(slide.title)}</h2>
            ${slide.logline ? `<p class="psv-qa-empty-sub">${esc(slide.logline)}</p>` : ""}
          </div>
        `;

      return `
        <div class="psv-kicker-row">
          <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
          ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
        </div>
        <div class="psv-qa-stage-grid">
          <section class="psv-qa-spotlight-card${activeQ ? " has-active-q" : ""}" aria-live="polite">
            <div class="psv-qa-spot-top" id="psvQaSpotTop">
              ${buildQaSpotTopHtml(qList, state.qaFocusIdx)}
            </div>
            <div class="psv-qa-text-viewport" id="psvQaTextViewport">
              ${centerHtml}
            </div>
            <div class="psv-qa-spot-foot" id="psvQaSpotFoot">
              ${buildQaSpotFootHtml(qList, state.qaFocusIdx)}
            </div>
          </section>

          <aside class="psv-qa-qr-dock" data-psv-act="open-qr-modal" title="คลิกเพื่อขยาย QR Code ขนาดใหญ่สำหรับสแกนส่งคำถามสด">
            <span class="psv-qa-qr-kicker">SCAN TO ASK LIVE</span>
            <div class="psv-qa-qr-svg-box">${buildQrSvg(qrAskUrl)}</div>
            <div>
              <div class="psv-qa-qr-title">📱 สแกนพิมพ์คำถามสด</div>
              <div class="psv-qa-qr-sub">กดส่งแล้วขึ้นจอใหญ่ทันที</div>
              <div class="psv-qa-qr-slug" style="margin-top:4px">#${esc(QA_HASH_SLUG)}</div>
            </div>
          </aside>
        </div>
      `;
    }

    if (slide.type === "reflection") {
      const savedRef = getSavedStudentNote(`${deck.id}_ref`);
      const stuPad =
        ROLE === "student"
          ? `
            <div class="psv-student-pad">
              <div style="font-size:12px;font-weight:700;color:#fde68a;margin-bottom:6px">✍️ เติมประโยคสะท้อนคิดของฉัน (เก็บไว้ต่อยอดใน SRN 1)</div>
              <div class="psv-pad-row">
                <input type="text" class="psv-pad-input" id="psvStudentRefInput" value="${esc(savedRef)}" placeholder="ครั้งหน้า ฉันจะลอง… แล้วฟัง… เพื่อทบทวน…" />
                <button type="button" class="psv-pill-btn" data-psv-act="copy-reflection">📋 คัดลอก</button>
              </div>
            </div>
          `
          : "";
      return `
        <div class="psv-kicker-row">
          <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
          ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
        </div>
        <h2 class="psv-hero-title is-prompt-quote">${esc(slide.title)}</h2>
        ${slide.stem ? `<div class="psv-stem-callout">${esc(slide.stem)}</div>` : ""}
        ${slide.logline ? `<p class="psv-logline">${esc(slide.logline)}</p>` : ""}
        ${stuPad}
      `;
    }

    if (slide.type === "takeaway-cover") {
      const roadmapHtml = (slide.roadmap || [])
        .map(
          (rm) => `
          <button type="button" class="psv-kt-roadmap-pill" data-psv-idx="${rm.targetSlideIdx}">
            <span class="psv-kt-roadmap-num">${esc(rm.num)}</span>
            <span>${esc(rm.label)}</span>
          </button>
        `
        )
        .join("");
      return `
        <div class="psv-kt-cover-card">
          <div class="psv-kt-geo-side is-left" aria-hidden="true">
            <svg viewBox="0 0 120 580" preserveAspectRatio="none">
              <path d="M48,0 H120 V88 A60,57 0 0 1 0,88 V48 A48,48 0 0 1 48,0 Z" fill="rgba(245,158,11,0.74)"/>
              <rect x="0" y="145" width="120" height="72" fill="rgba(251,191,36,0.32)"/>
              <polygon points="54,290 120,364 54,364" fill="rgba(56,189,248,0.42)"/>
              <rect x="0" y="364" width="54" height="74" fill="rgba(251,191,36,0.36)"/>
              <path d="M0,438 A120,142 0 0 1 120,580 H0 Z" fill="rgba(245,158,11,0.7)"/>
            </svg>
          </div>
          <div class="psv-kt-geo-side is-right" aria-hidden="true">
            <svg viewBox="0 0 120 580" preserveAspectRatio="none">
              <polygon points="120,0 120,144 0,144" fill="rgba(56,189,248,0.38)"/>
              <rect x="0" y="216" width="120" height="74" fill="rgba(251,191,36,0.34)"/>
              <path d="M0,290 H120 A120,146 0 0 1 0,436 Z" fill="rgba(245,158,11,0.74)"/>
              <circle cx="60" cy="510" r="58" fill="rgba(56,189,248,0.34)"/>
            </svg>
          </div>
          <span class="psv-kt-cover-kicker"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
          <h2 class="psv-kt-cover-title">${esc(slide.title)}</h2>
          ${slide.subtitleEn ? `<p class="psv-kt-cover-sub">${esc(slide.subtitleEn)}</p>` : ""}
          ${slide.subtitleTh ? `<p class="psv-kt-cover-th">${esc(slide.subtitleTh)}</p>` : ""}
          ${roadmapHtml ? `<div class="psv-kt-roadmap-strip">${roadmapHtml}</div>` : ""}
        </div>
      `;
    }

    if (slide.type === "takeaway-visual") {
      const total = slide.ktTotal || 4;
      const cur = slide.ktStep || 1;
      const stepDots = Array.from({ length: total }, (_, idx) => {
        const s = idx + 1;
        const cls = s === cur ? " is-active" : s < cur ? " is-done" : "";
        return `<span class="psv-kt-step-dot${cls}"></span>`;
      }).join("");
      const matteCls =
        slide.matte === "dark"
          ? "is-dark-matte"
          : slide.matte === "ice"
          ? "is-ice-matte"
          : "is-paper-matte";
      const srcHtml = slide.sourceLabel
        ? slide.sourceUrl
          ? `<a class="psv-kt-fig-src" href="${esc(slide.sourceUrl)}" target="_blank" rel="noopener noreferrer"><span>${esc(slide.sourceLabel)}</span><span aria-hidden="true">↗</span></a>`
          : `<span class="psv-kt-fig-src">${esc(slide.sourceLabel)}</span>`
        : "";
      return `
        <div class="psv-kt-visual-head">
          <div class="psv-kt-head-left">
            <div class="psv-kt-kicker-line">
              <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
              <span class="psv-kt-step-dots" aria-hidden="true">${stepDots}</span>
            </div>
            <h2 class="psv-kt-visual-title">${
              slide.titlePrefix ? `<span class="psv-kt-title-accent">${esc(slide.titlePrefix)}</span> ` : ""
            }${esc(slide.title)}</h2>
          </div>
          <button type="button" class="psv-kt-zoom-btn" data-psv-act="zoom-takeaway-fig" title="คลิกเพื่อขยายแผนภาพเต็มจอ">🔍 ขยายเต็มจอ</button>
        </div>
        <div class="psv-kt-fig-bezel">
          <div class="psv-kt-fig-canvas ${matteCls}" data-psv-act="zoom-takeaway-fig" title="คลิกเพื่อขยายแผนภาพเต็มจอ">
            <img class="psv-kt-fig-img" src="${IMG_DIR}/${esc(slide.figImg)}?v=${ASSET_VER}" alt="${esc(slide.title)}" />
          </div>
          <div class="psv-kt-fig-foot">
            <span class="psv-kt-fig-note">${esc(slide.captionTh || "")}</span>
            ${srcHtml}
          </div>
        </div>
      `;
    }

    if (slide.type === "sources") {
      const colsHtml = (slide.columns || [])
        .map((col) => {
          const itemsHtml = (col.items || [])
            .map(
              (it) => `
              <a class="psv-source-link" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">
                <span>${esc(it.label)}</span>
                <span aria-hidden="true">↗</span>
              </a>
            `
            )
            .join("");
          return `
            <div class="psv-source-col">
              <h3 class="psv-source-col-head">${esc(col.heading)}</h3>
              ${itemsHtml}
            </div>
          `;
        })
        .join("");
      return `
        <div class="psv-kicker-row">
          <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
          ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
        </div>
        <h2 class="psv-hero-title is-compact-title">${esc(slide.title)}</h2>
        <div class="psv-sources-grid">${colsHtml}</div>
      `;
    }

    return `<h2 class="psv-hero-title">${esc(slide.title)}</h2>`;
  }

  /* ---------- Faculty-Only Moderator Cue Drawer ---------- */
  function renderModeratorDrawerHtml(slide) {
    if (ROLE !== "faculty") return "";
    const mn = slide && slide.moderatorNotes;
    if (!mn) {
      return `
        <div class="psv-mod-sec">
          <div class="psv-mod-kicker">สำหรับผู้ดำเนินการอภิปราย</div>
          <p style="margin:0">สไลด์บรรยากาศสำหรับฉายประกอบเวทีเสวนา สามารถกด H หรือปล่อยเมาส์นิ่ง 3.5 วินาทีเพื่อซ่อนปุ่มควบคุมทั้งหมดบนจอใหญ่</p>
        </div>
      `;
    }
    const bulletsHtml = (mn.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("");
    const refsHtml = (mn.refs || [])
      .map((r) => `<a class="psv-mod-ref-link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(r.label)} ↗</a>`)
      .join("");

    return `
      <div class="psv-mod-sec">
        <div class="psv-mod-kicker">🎙️ แนวทางนำวงและลำดับผู้พูด (${esc(slide.num)})</div>
        <p style="margin:0;font-weight:600;color:#ffffff">${esc(mn.lead || "")}</p>
      </div>
      ${
        bulletsHtml
          ? `<div class="psv-mod-sec"><div class="psv-mod-kicker">💡 คำถามต่อยอด (Probing / Multi-Loop / 5 Whys)</div><ul class="psv-mod-list">${bulletsHtml}</ul></div>`
          : ""
      }
      ${
        refsHtml
          ? `<div class="psv-mod-sec"><div class="psv-mod-kicker">📚 แหล่งอ้างอิงประจำหน้า</div><div class="psv-mod-refs">${refsHtml}</div></div>`
          : ""
      }
    `;
  }

  /* ---------- Dedicated Mobile Scan-to-Ask Live Floor Q&A Composer (#panel-qa) ---------- */
  function refreshQaConnBadge() {
    const el = document.getElementById("psvQacConnBadge");
    if (!el) return;
    const online = connectedBrokers.size > 0;
    el.className = `psv-qac-conn${online ? "" : " is-connecting"}`;
    el.textContent = online ? "🟢 เชื่อมต่อเวทีเสวนาสดแล้ว" : "🟡 กำลังเชื่อมต่อสัญญาณสด…";
  }

  function renderQaComposerFeedHtml(deckId) {
    const qList = getVisibleQaList(deckId);
    const myId = getDeviceId();
    if (qList.length === 0) {
      return `
        <div class="psv-qac-feed-head">
          <span>💬 คำถามจากฟลอร์ล่าสุด (0 ข้อ)</span>
        </div>
        <div class="psv-qac-feed-item" style="text-align:center;color:#94a3b8;font-size:13.5px">
          ยังไม่มีคำถามจากฟลอร์ — มาร่วมเปิดประเด็นคำถามแรกกันเลย!
        </div>
      `;
    }
    const itemsHtml = qList
      .slice()
      .reverse()
      .map((q) => {
        const origNum = qList.findIndex((x) => x.id === q.id) + 1;
        const isMine = q.senderId === myId;
        const authorTxt = q.author ? q.author : "ไม่ระบุชื่อ";
        const timeTxt = formatQaTimeAgo(q.ts);
        return `
          <article class="psv-qac-feed-item${isMine ? " is-mine" : ""}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span class="psv-qa-counter-pill" style="font-size:11.5px;padding:2px 9px">#${origNum}</span>
                <span class="psv-qa-target-badge" style="font-size:11.5px;padding:2px 9px">🎤 ${esc(q.target)}</span>
                ${isMine ? `<span style="font-size:11px;font-weight:800;color:#7dd3fc">★ คำถามของคุณ</span>` : ""}
              </div>
              <span style="font-size:11.5px;color:#94a3b8">${esc(authorTxt)}${timeTxt ? ` · ${esc(timeTxt)}` : ""}</span>
            </div>
            <p style="margin:0;font-size:15px;font-weight:600;line-height:1.48;color:#f8fafc">${esc(q.text)}</p>
            <div style="display:flex;justify-content:flex-end">
              <button type="button" class="psv-qac-like-btn${q.likedByMe ? " is-liked" : ""}" data-qac-like="${esc(q.id)}">
                ❤️ ชวนฟัง${q.likeCount > 0 ? ` (${q.likeCount})` : ""}
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    return `
      <div class="psv-qac-feed-head">
        <span>💬 คำถามสดจากฟลอร์ทั้งหมด (${qList.length} ข้อ)</span>
        <span style="font-size:11.5px;font-weight:500;color:#cbd5e1">อัปเดตเรียลไทม์</span>
      </div>
      <div class="psv-qac-feed-list">${itemsHtml}</div>
    `;
  }

  function refreshQaComposerFeedOnly() {
    const wrap = document.getElementById("psvQacFeedWrap");
    if (!wrap || !state.qaComposerOpen) return;
    wrap.innerHTML = renderQaComposerFeedHtml(state.deckId || "w1-d1-global");
  }

  function refreshQrModalCountOnly(deckId) {
    const pill = document.getElementById("psvQrLiveCountPill");
    if (!pill) return;
    const qList = getVisibleQaList(deckId || state.deckId || "w1-d1-global");
    const cnt = qList.length;
    pill.classList.toggle("has-questions", cnt > 0);
    pill.textContent =
      cnt > 0
        ? `🟢 รับคำถามสดเข้าคิวแล้ว ${cnt} ข้อ · คลิกเปิด Slide 12 →`
        : "📡 พร้อมรับคำถามสดขึ้นจอ Slide 12 (0 ข้อ)";
  }

  function ensureQaComposerElement() {
    let el = document.getElementById("panelQaComposerModal");
    if (el) return el;
    el = document.createElement("div");
    el.id = "panelQaComposerModal";
    el.className = "psv-qac-modal";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.hidden = true;
    document.body.appendChild(el);

    el.addEventListener("click", (ev) => {
      if (!window.RACM_UNIVERSAL_NAV && ev.target.closest("[data-racm-nav]")) {
        closeQaComposerModal();
        return;
      }
      const targetBtn = ev.target.closest("[data-qac-target]");
      if (targetBtn) {
        state.qaSelectedTarget = targetBtn.getAttribute("data-qac-target") || QA_TARGET_OPTIONS[0];
        el.querySelectorAll("[data-qac-target]").forEach((b) => {
          b.classList.toggle("is-selected", b.getAttribute("data-qac-target") === state.qaSelectedTarget);
        });
        return;
      }
      const likeBtn = ev.target.closest("[data-qac-like]");
      if (likeBtn) {
        toggleLikeFloorQuestion(state.deckId || "w1-d1-global", likeBtn.getAttribute("data-qac-like"));
        return;
      }
      const actBtn = ev.target.closest("[data-qac-act]");
      if (!actBtn) return;
      const act = actBtn.getAttribute("data-qac-act");
      if (act === "close") {
        closeQaComposerModal();
      } else if (act === "open-slides") {
        const wasStandalone = state.qaComposerStandalone;
        closeQaComposerModal(true);
        if (wasStandalone || !state.isOpen) {
          openDeck(state.deckId || "w1-d1-global", 11);
        }
      }
    });

    el.addEventListener("submit", (ev) => {
      if (ev.target && ev.target.id === "psvQacForm") {
        ev.preventDefault();
        const txtEl = document.getElementById("psvQacTextarea");
        const authEl = document.getElementById("psvQacAuthor");
        const countEl = document.getElementById("psvQacCharCount");
        if (!txtEl) return;
        const val = txtEl.value.trim();
        if (val.length < 2) {
          txtEl.focus();
          return;
        }
        const sent = submitLiveFloorQuestion(
          state.deckId || "w1-d1-global",
          val,
          authEl ? authEl.value : "",
          state.qaSelectedTarget
        );
        if (sent) {
          txtEl.value = "";
          if (countEl) countEl.textContent = "0 / 420";
          const toastEl = document.getElementById("psvQacToast");
          if (toastEl) {
            toastEl.hidden = false;
            toastEl.textContent = "✅ ส่งคำถามขึ้นจอเวทีเสวนาเรียบร้อยแล้ว! สามารถพิมพ์ส่งประเด็นเพิ่มได้อีก";
            if (state.qaToastTimer) clearTimeout(state.qaToastTimer);
            state.qaToastTimer = setTimeout(() => {
              const t = document.getElementById("psvQacToast");
              if (t) t.hidden = true;
            }, 5000);
          }
          refreshQaComposerFeedOnly();
        }
      }
    });

    el.addEventListener("input", (ev) => {
      if (ev.target && ev.target.id === "psvQacTextarea") {
        const countEl = document.getElementById("psvQacCharCount");
        if (countEl) countEl.textContent = `${ev.target.value.length} / 420`;
      }
    });

    return el;
  }

  function openQaComposerModal(deckId, standalone) {
    initLiveSync();
    if (deckId) state.deckId = resolveDeckId(deckId);
    state.qrLightboxOpen = false;
    const qrM = document.getElementById("psvQrModal");
    if (qrM) qrM.hidden = true;
    state.qaComposerOpen = true;
    state.qaComposerStandalone = Boolean(standalone);
    clearIdleTimer();

    const deck = getCurrentDeck();
    const el = ensureQaComposerElement();
    const online = connectedBrokers.size > 0;
    const savedAuthor = getSavedQaAuthor();

    const targetsHtml = QA_TARGET_OPTIONS.map(
      (t) =>
        `<button type="button" class="psv-qac-target-chip${t === state.qaSelectedTarget ? " is-selected" : ""}" data-qac-target="${esc(t)}">${esc(t)}</button>`
    ).join("");

    const rightBtnHtml = state.isOpen
      ? `<button type="button" class="psv-pill-btn is-active" data-qac-act="close">✕ กลับสู่สไลด์</button>`
      : `<button type="button" class="psv-pill-btn" data-qac-act="open-slides">🎬 ดูสไลด์เสวนา</button>`;

    el.innerHTML = `
      <div class="psv-qac-shell">
        <div class="psv-qac-top">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <div class="racm-unav-pair is-compact is-dark-hud" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่"><button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button><button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button></div>
            <span class="psv-qac-conn${online ? "" : " is-connecting"}" id="psvQacConnBadge">
              ${online ? "🟢 เชื่อมต่อเวทีเสวนาสดแล้ว" : "🟡 กำลังเชื่อมต่อสัญญาณสด…"}
            </span>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${rightBtnHtml}
            ${!state.isOpen ? `<button type="button" class="psv-pill-btn is-close" data-qac-act="close">✕ ปิด</button>` : ""}
          </div>
        </div>

        <form class="psv-qac-card" id="psvQacForm">
          <div>
            <div style="font-size:11.5px;font-weight:800;letter-spacing:0.06em;color:#fbbf24;text-transform:uppercase;margin-bottom:4px">${esc(deck.code)} · LIVE FLOOR QUESTIONS</div>
            <h2 class="psv-qac-title">ส่งคำถามสดขึ้นเวทีเสวนา</h2>
            <p class="psv-qac-sub">พิมพ์คำถามหรือประเด็นที่อยากแลกเปลี่ยนกับอาจารย์วิทยากร — เมื่อกดส่งจะปรากฏแบบเรียลไทม์บนจอ Slide 12 ทันที</p>
          </div>

          <div>
            <span class="psv-qac-label">🎤 อยากฝากคำถามถึงท่านใด</span>
            <div class="psv-qac-targets">${targetsHtml}</div>
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <label class="psv-qac-label" for="psvQacTextarea">💬 คำถามของคุณ</label>
              <span style="font-size:11.5px;color:#94a3b8" id="psvQacCharCount">0 / 420</span>
            </div>
            <textarea class="psv-qac-textarea" id="psvQacTextarea" maxlength="420" required placeholder="พิมพ์คำถามหรือประเด็นที่อยากชวนอาจารย์คิดต่อ…"></textarea>
          </div>

          <div>
            <label class="psv-qac-label" for="psvQacAuthor">👩‍⚕️ ชื่อเล่น / กลุ่ม (ไม่บังคับ — เว้นว่างเพื่อไม่ระบุชื่อได้)</label>
            <input type="text" class="psv-qac-input" id="psvQacAuthor" maxlength="50" value="${esc(savedAuthor)}" placeholder="เช่น นศพ.กลุ่ม 3 หรือเว้นว่างไว้" />
          </div>

          <button type="submit" class="psv-qac-send-btn">🚀 ส่งคำถามขึ้นจอสด (Send Live)</button>
          <div class="psv-qac-toast" id="psvQacToast" hidden></div>
        </form>

        <div id="psvQacFeedWrap">
          ${renderQaComposerFeedHtml(deck.id)}
        </div>
      </div>
    `;

    el.hidden = false;
    document.body.classList.add("psv-deck-open");
    setTimeout(() => {
      const ta = document.getElementById("psvQacTextarea");
      if (ta && window.innerWidth > 768) ta.focus();
    }, 60);
  }

  function closeQaComposerModal(keepBodyLock) {
    state.qaComposerOpen = false;
    state.qaComposerStandalone = false;
    const el = document.getElementById("panelQaComposerModal");
    if (el) el.hidden = true;
    if (!state.isOpen && !keepBodyLock) {
      document.body.classList.remove("psv-deck-open");
      try {
        const sp = new URLSearchParams(window.location.search);
        let touched = false;
        if (sp.has("qa")) { sp.delete("qa"); touched = true; }
        if (sp.has("ask")) { sp.delete("ask"); touched = true; }
        const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
        const clearHash = h === QA_HASH_SLUG || h === "panel-global-qa";
        if (touched || clearHash) {
          const rest = sp.toString();
          const nextHash = clearHash ? "" : window.location.hash || "";
          history.replaceState(null, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${nextHash}`);
        }
      } catch (_) {}
    } else if (state.isOpen) {
      resetIdleActivity();
      updateStageView();
    }
  }

  /* ---------- Build & Update Modal DOM ---------- */
  function ensureModalElement() {
    let modal = document.getElementById("panelDeckModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "panelDeckModal";
    modal.className = "psv-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("data-role", ROLE);
    modal.hidden = true;

    modal.innerHTML = `
      <div class="psv-backdrop-stage" aria-hidden="true">
        <div class="psv-bg-slot kb-a" id="psvBgSlot0"></div>
        <div class="psv-bg-slot kb-b" id="psvBgSlot1"></div>
        <div class="psv-multi-bg-wall" id="psvMultiBgWall" hidden></div>
        <div class="psv-aurora-layer" id="psvAuroraLayer"></div>
        <div class="psv-scrim-vignette"></div>
      </div>

      <div class="psv-dicut-stage" id="psvDicutStage" hidden aria-hidden="true">
        <div class="psv-dicut-aura"></div>
        <div class="psv-dicut-logo-halo" id="psvDicutLogoHalo"></div>
        <img class="psv-dicut-img" id="psvDicutImg" alt="" />
      </div>

      <header class="psv-hud-top" id="psvHudTop">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1">
          <div class="racm-unav-pair is-compact is-dark-hud" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่"><button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button><button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button></div>
          <div class="psv-chapter-dots" id="psvChapterDots" role="tablist" aria-label="สารบัญสไลด์เสวนา"></div>
        </div>
        <div class="psv-hud-foot-right" id="psvFootRight"></div>
      </header>

      <button type="button" class="psv-edge-nav is-prev" data-psv-act="prev" aria-label="สไลด์ก่อนหน้า" title="คลิกเมาส์ไปสไลด์ก่อนหน้า">‹</button>
      <button type="button" class="psv-edge-nav is-next" data-psv-act="next" aria-label="สไลด์ถัดไป" title="คลิกเมาส์ไปสไลด์ถัดไปทันที">›</button>

      <div class="psv-upnext-card" id="psvUpNextCard" data-psv-act="next" title="คลิกเพื่อข้ามไปยังสไลด์ถัดไปทันที">
        <div class="psv-upnext-thumb" id="psvUpNextThumb"></div>
        <div class="psv-upnext-meta">
          <span class="psv-upnext-kicker">UP NEXT · สไลด์ถัดไป</span>
          <span class="psv-upnext-title" id="psvUpNextTitle"></span>
        </div>
      </div>

      <main class="psv-stage-viewport" id="psvStageViewport">
        <div class="psv-slide-body" id="psvSlideBody"></div>
      </main>

      ${
        ROLE === "faculty"
          ? `
        <aside class="psv-mod-drawer" id="psvModDrawer" hidden aria-label="โพยคำถามต่อยอดสำหรับผู้ดำเนินการอภิปราย">
          <div class="psv-mod-head">
            <strong>🎙️ โพยผู้ดำเนินรายการ (เฉพาะฝั่งอาจารย์)</strong>
            <div style="display:inline-flex;align-items:center;gap:6px"><div class="racm-unav-pair is-compact is-dark-hud"><button type="button" class="racm-unav-btn is-back" data-racm-nav="back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button><button type="button" class="racm-unav-btn is-home" data-racm-nav="home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button></div><button type="button" class="psv-pill-btn" data-psv-act="toggle-mod-drawer">ปิด ✕</button></div>
          </div>
          <div class="psv-mod-body" id="psvModBody"></div>
        </aside>
      `
          : `
        <aside class="psv-mod-drawer psv-stu-drawer" id="psvStuDrawer" hidden aria-label="สมุดจดคำถามและสะท้อนคิดส่วนตัวของนักศึกษา">
          <div class="psv-mod-head">
            <strong>📝 สมุดโน้ต & สะท้อนคิดส่วนตัว (บันทึกในเครื่อง)</strong>
            <div style="display:inline-flex;align-items:center;gap:6px"><div class="racm-unav-pair is-compact is-dark-hud"><button type="button" class="racm-unav-btn is-back" data-racm-nav="back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button><button type="button" class="racm-unav-btn is-home" data-racm-nav="home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button></div><button type="button" class="psv-pill-btn" data-psv-act="toggle-stu-drawer">ปิด ✕</button></div>
          </div>
          <div class="psv-mod-body" id="psvStuBody"></div>
        </aside>
      `
      }

      <div class="psv-qr-modal" id="psvQrModal" hidden>
        <div class="psv-qr-modal-card">
          <div style="width:100%;display:flex;justify-content:flex-end"><div class="racm-unav-pair is-compact is-dark-hud"><button type="button" class="racm-unav-btn is-back" data-racm-nav="back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button><button type="button" class="racm-unav-btn is-home" data-racm-nav="home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button></div></div>
          <span class="psv-series-pill"><span class="psv-n-bar"></span>SCAN TO ASK LIVE QUESTIONS</span>
          <div class="psv-qr-big" id="psvQrBigBox"></div>
          <a class="psv-qr-url-link" id="psvQrUrlLabel" href="https://smartwoo.github.io/racm303-2569-student/?qa=1#panel-qa" target="_blank" rel="noopener">smartwoo.github.io/racm303-2569-student/#panel-qa ↗</a>
          <button type="button" class="psv-qr-live-count-pill" id="psvQrLiveCountPill" data-psv-act="jump-qa-slide" title="คลิกเพื่อปิด QR และเปิดดูคำถามสดบน Slide 12">📡 พร้อมรับคำถามสดขึ้นจอ Slide 12 (0 ข้อ)</button>
          <p style="margin:0;font-size:13px;color:#cbd5e1">สแกนด้วยกล้องมือถือหรือไอแพดเพื่อพิมพ์คำถามสดส่งขึ้นจอ Slide 12 แบบเรียลไทม์</p>
          <div class="psv-qr-modal-actions">
            <button type="button" class="psv-pill-btn psv-qr-compose-btn" data-psv-act="open-qa-composer-from-qr">✍️ พิมพ์คำถามสดทันที</button>
            <button type="button" class="psv-pill-btn is-active" data-psv-act="close-qr-modal">ปิดหน้าต่าง QR (Esc)</button>
          </div>
        </div>
      </div>

      <div class="psv-pin-zoom-modal" id="psvPinZoomModal" hidden>
        <div class="psv-pin-zoom-card" id="psvPinZoomCard"></div>
      </div>

      <div class="psv-ambient-progress" aria-hidden="true">
        <div class="psv-ambient-progress-bar" id="psvAmbientProgressBar"></div>
      </div>
    `;

    document.body.appendChild(modal);
    bindModalEvents(modal);
    return modal;
  }

  function populateDeckPicker() {
    const badge = document.getElementById("psvSessionBadge");
    const deck = getCurrentDeck();
    if (badge && deck) {
      badge.textContent = deck.shortTitle || deck.code || "";
    }
  }

  function syncHudButtonsOnly() {
    const controls = document.getElementById("psvHudControls");
    const deck = getCurrentDeck();
    if (!controls) return;

    const pptxBtn =
      ROLE === "faculty" && deck.pptxHref
        ? `<a class="psv-pill-btn" href="${esc(deck.pptxHref)}" download title="ดาวน์โหลดไฟล์ .pptx ต้นฉบับสำหรับผู้ดำเนินรายการ">⬇ .pptx</a>`
        : "";

    const roleControlHtml =
      ROLE === "faculty"
        ? `
          <button type="button" class="psv-pill-btn${state.modDrawerOpen ? " is-active" : ""}" data-psv-act="toggle-mod-drawer" title="เปิด/ปิดโพยผู้ดำเนินรายการ (เฉพาะอาจารย์ · กด N)">🎙️ โพยพิธีกร</button>
          <button type="button" class="psv-pill-btn${state.sessionRunning ? " is-ambient-on" : ""}" id="psvTimerBtn" data-psv-act="toggle-timer" title="เริ่ม/หยุดเวลาเสวนา">⏱ ${formatElapsed(state.sessionSec, deck.sessionLimitMin)}</button>
        `
        : `
          <button type="button" class="psv-pill-btn${state.stuDrawerOpen ? " is-active" : ""}" data-psv-act="toggle-stu-drawer" title="เปิดสมุดจดคำถามและบันทึกสะท้อนคิดส่วนตัว (กด N)">📝 โน้ตของฉัน</button>
          <button type="button" class="psv-pill-btn${state.followHost ? " is-ambient-on" : ""}" data-psv-act="toggle-follow" title="ซิงก์หน้าสไลด์ตามจอห้องเรียนอัตโนมัติ">📡 ${state.followHost ? "ซิงก์สด: เปิด" : "ซิงก์สด: ปิด"}</button>
        `;

    controls.innerHTML = `
      <button type="button" class="psv-pill-btn${state.ambientCycle ? " is-ambient-on" : ""}" data-psv-act="toggle-ambient" title="โหมด Apple TV / Netflix Screensaver ไหลเปลี่ยนสไลด์ช้าๆ ทุก 18 วินาที (กด P)">
        ${state.ambientCycle ? "⏸ Screensaver: ไหลอัตโนมัติ" : "🌊 โหมด Screensaver"}
      </button>
      <button type="button" class="psv-pill-btn" data-psv-act="toggle-backdrop" title="สลับฉากหลังระหว่างภาพถ่าย Ken Burns กับแสง Aurora มินิมอล (กด B)">
        ${state.backdropMode === "cinema" ? "🎬 ภาพ Ken Burns" : "🌌 แสง Aurora"}
      </button>
      <div class="psv-font-seg" role="group" aria-label="ปรับขนาดตัวอักษร">
        <button type="button" class="psv-font-btn" data-psv-act="font-down" title="ลดขนาดตัวอักษร (A-)">A−</button>
        <span class="psv-font-readout" id="psvFontReadout" data-psv-act="font-reset" title="คลิกเพื่อรีเซ็ตขนาดตัวอักษร 100%">${Math.round(state.fontScale * 100)}%</span>
        <button type="button" class="psv-font-btn" data-psv-act="font-up" title="เพิ่มขนาดตัวอักษร (A+)">A+</button>
      </div>
      ${roleControlHtml}
      <button type="button" class="psv-pill-btn" data-psv-act="open-qr-modal" title="แสดง QR Code ส่งคำถามสด">📱 QR Q&amp;A</button>
      <button type="button" class="psv-pill-btn" data-psv-act="clean-now" title="ซ่อนแถบปุ่มทั้งหมดทันทีเพื่อฉายขึ้นจอแบบ Clean Screensaver (กด H)">👁️ ซ่อนปุ่ม</button>
      <button type="button" class="psv-pill-btn" data-psv-act="fullscreen" title="ฉายเต็มจอ (กด F)">⛶ เต็มจอ</button>
      ${pptxBtn}
      <button type="button" class="psv-pill-btn is-close" data-psv-act="close" title="ปิดหน้าสไลด์เสวนา (Esc)">✕ ปิด</button>
    `;
  }

  function updateStageView() {
    const modal = ensureModalElement();
    const deck = getCurrentDeck();
    const slide = getCurrentSlide();
    preloadDeckImages(deck);

    modal.style.setProperty("--psv-font-scale", String(state.fontScale));
    populateDeckPicker();
    syncHudButtonsOnly();
    updateBackdropForSlide(slide);

    const wmSeries = document.getElementById("psvWmSeries");
    if (wmSeries) wmSeries.textContent = `${deck.seriesTag} · ${slide.navLabel}`;
    const wmClock = document.getElementById("psvWmClock");
    if (wmClock) wmClock.textContent = formatBangkokClock();

    const nextIdx =
      state.qaLoopOnly && deck.qaLoopRange
        ? state.slideIdx < deck.qaLoopRange[0] || state.slideIdx >= deck.qaLoopRange[1]
          ? deck.qaLoopRange[0]
          : state.slideIdx + 1
        : (state.slideIdx + 1) % deck.slides.length;
    const nextSlide = deck.slides[nextIdx] || deck.slides[0];
    const upThumb = document.getElementById("psvUpNextThumb");
    const upTitle = document.getElementById("psvUpNextTitle");
    if (upThumb && nextSlide) {
      upThumb.style.backgroundImage = `url("${IMG_DIR}/${nextSlide.bg || "bg_01_bedside_horizon.jpg"}?v=${ASSET_VER}")`;
    }
    if (upTitle && nextSlide) {
      upTitle.textContent = nextSlide.navLabel || nextSlide.title || "";
    }

    const slideBody = document.getElementById("psvSlideBody");
    if (slideBody) {
      slideBody.classList.toggle("is-railway-mode", Boolean(slide.type === "timeline" && slide.dicutImg));
      slideBody.classList.toggle("is-qa-live-mode", slide.type === "qa");
      slideBody.classList.toggle("is-takeaway-mode", slide.type === "takeaway-cover" || slide.type === "takeaway-visual");
      slideBody.innerHTML = renderSlideInnerHtml(deck, slide);
      wireStudentInputs(deck);
      const activeStop = slideBody.querySelector(".psv-rail-stop.is-active");
      if (activeStop && activeStop.scrollIntoView) {
        activeStop.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
      const activeQaPill = slideBody.querySelector(".psv-qa-q-pill.is-current");
      if (activeQaPill && activeQaPill.scrollIntoView) {
        activeQaPill.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }

    const dots = document.getElementById("psvChapterDots");
    if (dots) {
      dots.innerHTML = deck.slides
        .map(
          (sl, i) =>
            `<button type="button" class="psv-ch-btn${i === state.slideIdx ? " is-active" : ""}" data-psv-idx="${i}">${esc(sl.navLabel)}</button>`
        )
        .join("");
      const activeBtn = dots.querySelector(".psv-ch-btn.is-active");
      if (activeBtn && activeBtn.scrollIntoView) {
        activeBtn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }

    const footRight = document.getElementById("psvFootRight");
    if (footRight) {
      footRight.innerHTML = `<span class="psv-top-counter">${state.slideIdx + 1} / ${deck.slides.length}</span><button type="button" class="psv-top-close-btn" data-psv-act="close" title="ปิดหน้าสไลด์เสวนา (Esc)" aria-label="ปิดหน้าสไลด์เสวนา">✕</button>`;
    }

    if (ROLE === "faculty") {
      const modDr = document.getElementById("psvModDrawer");
      const modBody = document.getElementById("psvModBody");
      if (modDr) modDr.hidden = !state.modDrawerOpen;
      if (modBody) modBody.innerHTML = renderModeratorDrawerHtml(slide);
    } else {
      const stuDr = document.getElementById("psvStuDrawer");
      const stuBody = document.getElementById("psvStuBody");
      if (stuDr) stuDr.hidden = !state.stuDrawerOpen;
      if (stuBody && state.stuDrawerOpen) {
        const savedQ = getSavedStudentNote(`${deck.id}_qa`);
        const savedRef = getSavedStudentNote(`${deck.id}_ref`);
        stuBody.innerHTML = `
          <div class="psv-mod-sec">
            <div class="psv-mod-kicker">💬 คำถามหรือประเด็นที่อยากแลกเปลี่ยนช่วง Q&A</div>
            <textarea class="psv-stu-textarea" id="psvStuDrawerQa" placeholder="จดประเด็นที่ได้ยินจากวิทยากร หรือคำถามที่อยากชวนคิดต่อ…">${esc(savedQ)}</textarea>
          </div>
          <div class="psv-mod-sec">
            <div class="psv-mod-kicker">✍️ ประโยคสะท้อนคิดของฉัน (สำหรับต่อยอดใน SRN 1)</div>
            <div style="font-size:12px;color:#fde68a;margin-bottom:6px;font-weight:600">« ครั้งหน้า ฉันจะลอง… แล้วฟัง… เพื่อทบทวน »</div>
            <textarea class="psv-stu-textarea" id="psvStuDrawerRef" placeholder="วันนี้ฉันเข้าใจบทบาทแพทย์อย่างไร และอยากลองทำก้าวเล็ก ๆ อะไรเป็นก้าวแรก…">${esc(savedRef)}</textarea>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:11.5px;color:#94a3b8">บันทึกอัตโนมัติในเบราว์เซอร์เครื่องนี้</span>
            <button type="button" class="psv-pill-btn is-active" data-psv-act="copy-stu-all">📋 คัดลอกโน้ตทั้งหมด</button>
          </div>
        `;
        wireStudentInputs(deck);
      }
    }

    const qrModal = document.getElementById("psvQrModal");
    if (qrModal) {
      qrModal.hidden = !state.qrLightboxOpen;
      if (state.qrLightboxOpen) {
        const askUrl = getQaScanUrl();
        const qrBox = document.getElementById("psvQrBigBox");
        const qrLbl = document.getElementById("psvQrUrlLabel");
        if (qrBox && qrBox.getAttribute("data-qr-url") !== askUrl) {
          qrBox.innerHTML = buildQrSvg(askUrl);
          qrBox.setAttribute("data-qr-url", askUrl);
        }
        if (qrLbl) {
          qrLbl.href = askUrl;
          qrLbl.textContent = `smartwoo.github.io/racm303-2569-student/#${QA_HASH_SLUG} ↗`;
        }
        refreshQrModalCountOnly(deck.id);
      }
    }

    fitCurrentSlideBody();
    scheduleFitSlideBody();
    scheduleNextAmbientTick();
    broadcastHostState();
  }

  function wireStudentInputs(deck) {
    const qaDr = document.getElementById("psvStuDrawerQa");
    if (qaDr) {
      qaDr.addEventListener("input", () => {
        saveStudentNote(`${deck.id}_qa`, qaDr.value);
      });
    }
    const refIn = document.getElementById("psvStudentRefInput");
    const refDr = document.getElementById("psvStuDrawerRef");
    if (refIn) {
      refIn.addEventListener("input", () => {
        saveStudentNote(`${deck.id}_ref`, refIn.value);
        if (refDr && refDr !== document.activeElement) refDr.value = refIn.value;
      });
    }
    if (refDr) {
      refDr.addEventListener("input", () => {
        saveStudentNote(`${deck.id}_ref`, refDr.value);
        if (refIn && refIn !== document.activeElement) refIn.value = refDr.value;
      });
    }
  }

  function openPinZoomLightbox(pinIdx) {
    const sl = getCurrentSlide();
    const zoomModal = document.getElementById("psvPinZoomModal");
    const zoomCard = document.getElementById("psvPinZoomCard");
    if (!sl || !Array.isArray(sl.milestones) || !zoomModal || !zoomCard) return;
    const m = sl.milestones[pinIdx];
    if (!m) return;

    const numStr = String(pinIdx + 1).padStart(2, "0");
    const galleryItems =
      Array.isArray(m.photos) && m.photos.length
        ? m.photos
        : m.bg
        ? [{ src: m.bg, cap: m.sceneLabel || m.shortStop || m.year }]
        : [];

    const galHtml = galleryItems.length
      ? `
        <div class="psv-pin-zoom-gallery">
          ${galleryItems
            .map(
              (ph) => `
              <div class="psv-pin-zoom-img-box">
                <img src="${IMG_DIR}/${esc(ph.src)}?v=${ASSET_VER}" alt="${esc(ph.cap || m.headline || "")}" />
                ${ph.cap ? `<div class="psv-pin-zoom-img-cap">${esc(ph.cap)}</div>` : ""}
              </div>
            `
            )
            .join("")}
        </div>
      `
      : "";

    const logoHtml = m.logo
      ? `<span class="psv-pin-logo-pill"><img src="${IMG_DIR}/${esc(m.logo)}?v=${ASSET_VER}" alt="${esc(m.logoLabel || "")}" style="height:22px;max-width:64px" /></span>`
      : "";

    zoomCard.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="psv-station-pill">📍 สถานี ${numStr} · พ.ศ. ${esc(m.year || "")}</span>
          ${m.roleTag ? `<span class="psv-station-role-tag">${esc(m.roleTag)}</span>` : ""}
          ${logoHtml}
        </div>
        <div style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div class="racm-unav-pair is-compact is-dark-hud"><button type="button" class="racm-unav-btn is-back" data-racm-nav="back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button><button type="button" class="racm-unav-btn is-home" data-racm-nav="home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button></div>
          <button type="button" class="psv-pill-btn is-active" data-psv-act="close-pin-zoom">✕ ปิด (Esc)</button>
        </div>
      </div>
      ${m.sceneLabel ? `<div style="font-size:13px;font-weight:600;color:#cbd5e1">${esc(m.sceneLabel)}</div>` : ""}
      <h3 style="margin:0;font-size:clamp(20px,2.2vw,28px);font-weight:700;color:#fff;line-height:1.28">${esc(m.headline || "")}</h3>
      ${galHtml}
      <p style="margin:0;font-size:16px;line-height:1.58;color:#f1f5f9">${esc(m.text || "")}</p>
      ${
        m.quote
          ? `<blockquote class="psv-pin-quote" style="font-size:15px;padding:10px 14px">${
              m.quoteLabel ? `<span class="psv-pin-quote-lbl">${esc(m.quoteLabel)}</span>` : ""
            }${esc(m.quote)}</blockquote>`
          : ""
      }
    `;
    clearIdleTimer();
    zoomModal.hidden = false;
  }

  function openTakeawayZoomLightbox() {
    const sl = getCurrentSlide();
    const zoomModal = document.getElementById("psvPinZoomModal");
    const zoomCard = document.getElementById("psvPinZoomCard");
    if (!sl || !sl.figImg || !zoomModal || !zoomCard) return;
    const matteCls = sl.matte === "dark" ? " is-dark-matte" : "";
    zoomCard.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="psv-station-pill">✨ ${esc(sl.kicker || "KEY TAKEAWAYS")}</span>
          ${sl.sourceLabel ? `<span class="psv-station-role-tag">${esc(sl.sourceLabel)}</span>` : ""}
        </div>
        <div style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div class="racm-unav-pair is-compact is-dark-hud"><button type="button" class="racm-unav-btn is-back" data-racm-nav="back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button><button type="button" class="racm-unav-btn is-home" data-racm-nav="home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button></div>
          <button type="button" class="psv-pill-btn is-active" data-psv-act="close-pin-zoom">✕ ปิดภาพขยาย (Esc)</button>
        </div>
      </div>
      <h3 style="margin:0;font-size:clamp(18px,2vw,25px);font-weight:800;color:#fff;line-height:1.25">${esc(sl.title || "")}</h3>
      <div class="psv-kt-zoom-full-box${matteCls}">
        <img src="${IMG_DIR}/${esc(sl.figImg)}?v=${ASSET_VER}" alt="${esc(sl.title || "")}" />
      </div>
      ${sl.captionTh ? `<p style="margin:0;font-size:15px;line-height:1.5;color:#e2e8f0">${esc(sl.captionTh)}</p>` : ""}
    `;
    clearIdleTimer();
    zoomModal.hidden = false;
  }

  function closePinZoomLightbox() {
    const zoomModal = document.getElementById("psvPinZoomModal");
    if (zoomModal && !zoomModal.hidden) {
      zoomModal.hidden = true;
      resetIdleActivity();
      return true;
    }
    return false;
  }

  function goToSlide(idx, fromAutoCycle, initialQaFocusIdx) {
    const deck = getCurrentDeck();
    const clean = Math.max(0, Math.min(deck.slides.length - 1, idx));
    state.slideIdx = clean;
    state.stationIdx = 0;
    state.qaFocusIdx = typeof initialQaFocusIdx === "number" ? Math.max(0, initialQaFocusIdx) : 0;
    closePinZoomLightbox();
    if (!fromAutoCycle) resetIdleActivity();
    updateStageView();
  }

  /* Mouse / Direct Slide Navigation — skips remaining Q&A items immediately */
  function stepSlide(delta) {
    const deck = getCurrentDeck();
    const next = (state.slideIdx + delta + deck.slides.length) % deck.slides.length;
    goToSlide(next, false, 0);
  }

  /* Clicker / Keyboard Navigation — steps through every Floor Question on Slide 12 before advancing */
  function stepSlideByClicker(delta) {
    const deck = getCurrentDeck();
    const curSlide = getCurrentSlide();
    if (curSlide && curSlide.type === "qa") {
      const qList = getVisibleQaList(deck.id);
      if (delta > 0) {
        if (qList.length > 0 && state.qaFocusIdx < qList.length - 1) {
          state.qaFocusIdx += 1;
          state.qaViewedIds.add(qList[state.qaFocusIdx].id);
          resetIdleActivity();
          updateStageView();
          return;
        }
        stepSlide(1);
        return;
      }
      if (delta < 0) {
        if (qList.length > 0 && state.qaFocusIdx > 0) {
          state.qaFocusIdx -= 1;
          resetIdleActivity();
          updateStageView();
          return;
        }
        stepSlide(-1);
        return;
      }
    }

    if (delta < 0) {
      const prevIdx = (state.slideIdx - 1 + deck.slides.length) % deck.slides.length;
      const prevSlide = deck.slides[prevIdx];
      if (prevSlide && prevSlide.type === "qa") {
        const qList = getVisibleQaList(deck.id);
        goToSlide(prevIdx, false, Math.max(0, qList.length - 1));
        return;
      }
    }

    stepSlide(delta);
  }

  function applyPinHoverHighlight(modal, pinIdx, orgKey) {
    const wall = document.getElementById("psvMultiBgWall");
    const halo = document.getElementById("psvDicutLogoHalo");
    modal.querySelectorAll(".psv-zz-pin-cell.is-hovered").forEach((el) => el.classList.remove("is-hovered"));
    if (halo) halo.querySelectorAll(".psv-halo-plaque.is-highlighted").forEach((el) => el.classList.remove("is-highlighted"));
    if (wall) wall.querySelectorAll(".psv-mbg-col.is-col-focused").forEach((el) => el.classList.remove("is-col-focused"));

    if (typeof pinIdx !== "number" || pinIdx < 0) {
      if (wall) wall.removeAttribute("data-focus-col");
      return;
    }
    const cell = modal.querySelector(`.psv-zz-pin-cell[data-pin-cell="${pinIdx}"]`);
    if (cell) cell.classList.add("is-hovered");

    if (halo && orgKey) {
      halo.querySelectorAll(`.psv-halo-plaque[data-org-key="${orgKey}"]`).forEach((el) => el.classList.add("is-highlighted"));
    }
    if (wall) {
      const cols = wall.querySelectorAll(`.psv-mbg-col[data-wall-pin="${pinIdx}"]`);
      if (cols.length) {
        wall.setAttribute("data-focus-col", String(pinIdx));
        cols.forEach((c) => c.classList.add("is-col-focused"));
      } else {
        wall.removeAttribute("data-focus-col");
      }
    }
  }

  /* ---------- Event Delegation & Clicker / Mouse / Touch Navigation ---------- */
  function bindModalEvents(modal) {
    ["mousemove", "mousedown", "touchstart", " wheel"].forEach((evName) => {
      modal.addEventListener(evName.trim(), () => resetIdleActivity(), { passive: true });
    });

    modal.addEventListener("mouseover", (ev) => {
      const card = ev.target.closest(".psv-pin-card[data-psv-zoom-pin]");
      if (card) {
        const pIdx = parseInt(card.getAttribute("data-psv-zoom-pin"), 10);
        const oKey = card.getAttribute("data-pin-org") || "";
        applyPinHoverHighlight(modal, pIdx, oKey);
      }
    });

    modal.addEventListener("mouseout", (ev) => {
      const card = ev.target.closest(".psv-pin-card[data-psv-zoom-pin]");
      if (card && !card.contains(ev.relatedTarget)) {
        applyPinHoverHighlight(modal, -1, "");
      }
    });

    modal.addEventListener("change", (ev) => {
      if (ev.target && ev.target.id === "psvDeckPicker") {
        const nextId = ev.target.value;
        if (PANEL_DECKS[nextId]) {
          state.deckId = nextId;
          state.slideIdx = 0;
          state.qaFocusIdx = 0;
          state.qaLoopOnly = false;
          updateStageView();
        }
      }
    });

    modal.addEventListener("click", (ev) => {
      if (ev.target && ev.target.id === "psvPinZoomModal") {
        closePinZoomLightbox();
        return;
      }
      if (ev.target && ev.target.id === "psvQrModal") {
        state.qrLightboxOpen = false;
        resetIdleActivity();
        updateStageView();
        return;
      }
      const qaPill = ev.target.closest("[data-psv-qa-idx]");
      if (qaPill) {
        if (qaPill.blur) qaPill.blur();
        const qIdx = parseInt(qaPill.getAttribute("data-psv-qa-idx"), 10) || 0;
        const qList = getVisibleQaList(state.deckId);
        if (qList[qIdx]) {
          state.qaFocusIdx = qIdx;
          state.qaViewedIds.add(qList[qIdx].id);
          updateStageView();
        }
        return;
      }
      const zoomTrig = ev.target.closest("[data-psv-zoom-pin]");
      if (zoomTrig) {
        const pIdx = parseInt(zoomTrig.getAttribute("data-psv-zoom-pin"), 10) || 0;
        openPinZoomLightbox(pIdx);
        return;
      }
      const haloPlaque = ev.target.closest(".psv-halo-plaque[data-org-key]");
      if (haloPlaque) {
        const ok = haloPlaque.getAttribute("data-org-key") || "";
        const sl = getCurrentSlide();
        if (sl && Array.isArray(sl.milestones)) {
          const mIdx = sl.milestones.findIndex((m) => m && m.orgKey === ok);
          if (mIdx >= 0) openPinZoomLightbox(mIdx);
        }
        return;
      }
      const idxBtn = ev.target.closest("[data-psv-idx]");
      if (idxBtn) {
        if (idxBtn.blur) idxBtn.blur();
        goToSlide(parseInt(idxBtn.getAttribute("data-psv-idx"), 10) || 0, false);
        return;
      }
      const actEl = ev.target.closest("[data-psv-act]");
      if (!actEl) return;
      if (actEl.blur) actEl.blur();
      const act = actEl.getAttribute("data-psv-act");
      const isKeyboardTriggered = ev.detail === 0;

      if (act === "prev") {
        if (isKeyboardTriggered) stepSlideByClicker(-1);
        else stepSlide(-1);
      } else if (act === "next" || act === "force-next-slide") {
        if (isKeyboardTriggered) stepSlideByClicker(1);
        else stepSlide(1);
      } else if (act === "qa-prev-item") {
        if (state.qaFocusIdx > 0) {
          state.qaFocusIdx -= 1;
          updateStageView();
        }
      } else if (act === "qa-next-item") {
        const qList = getVisibleQaList(state.deckId);
        if (state.qaFocusIdx < qList.length - 1) {
          state.qaFocusIdx += 1;
          state.qaViewedIds.add(qList[state.qaFocusIdx].id);
          updateStageView();
        }
      } else if (act === "open-qa-composer") {
        openQaComposerModal(state.deckId, false);
      } else if (act === "open-qa-composer-from-qr") {
        state.qrLightboxOpen = false;
        openQaComposerModal(state.deckId, false);
      } else if (act === "jump-qa-slide") {
        state.qrLightboxOpen = false;
        const deck = getCurrentDeck();
        const qaSlideIdx = deck.slides.findIndex((s) => s && s.type === "qa");
        goToSlide(qaSlideIdx >= 0 ? qaSlideIdx : 11, false);
      } else if (act === "hide-current-qa") {
        const qList = getVisibleQaList(state.deckId);
        const curQ = qList[state.qaFocusIdx];
        if (curQ) hideFloorQuestion(state.deckId, curQ.id);
      } else if (act === "zoom-takeaway-fig") {
        openTakeawayZoomLightbox();
      } else if (act === "close-pin-zoom") {
        closePinZoomLightbox();
      } else if (act === "toggle-ambient") {
        toggleAmbientCycle(false);
      } else if (act === "toggle-qa-loop") {
        toggleAmbientCycle(true);
      } else if (act === "toggle-backdrop") {
        state.backdropMode = state.backdropMode === "cinema" ? "aurora" : "cinema";
        try { localStorage.setItem("racm303_psv_backdrop", state.backdropMode); } catch (_) {}
        updateStageView();
      } else if (act === "font-down") {
        setFontScale(state.fontScale - 0.08);
      } else if (act === "font-up") {
        setFontScale(state.fontScale + 0.08);
      } else if (act === "font-reset") {
        setFontScale(1);
      } else if (act === "toggle-mod-drawer" && ROLE === "faculty") {
        state.modDrawerOpen = !state.modDrawerOpen;
        if (!state.modDrawerOpen) resetIdleActivity();
        else clearIdleTimer();
        updateStageView();
      } else if (act === "toggle-stu-drawer" && ROLE === "student") {
        state.stuDrawerOpen = !state.stuDrawerOpen;
        if (!state.stuDrawerOpen) resetIdleActivity();
        else clearIdleTimer();
        updateStageView();
      } else if (act === "copy-stu-all") {
        const deck = getCurrentDeck();
        const qTxt = getSavedStudentNote(`${deck.id}_qa`);
        const rTxt = getSavedStudentNote(`${deck.id}_ref`);
        const fullTxt = `[${deck.shortTitle}]\n• ประเด็น/คำถาม Q&A: ${qTxt || "-"}\n• สะท้อนคิดส่วนตัว: ${rTxt || "-"}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(fullTxt).then(() => {
            actEl.textContent = "✓ คัดลอกแล้ว";
            setTimeout(() => { actEl.textContent = "📋 คัดลอกโน้ตทั้งหมด"; }, 1800);
          }).catch(() => {});
        }
      } else if (act === "toggle-timer" && ROLE === "faculty") {
        toggleSessionTimer();
      } else if (act === "toggle-follow") {
        state.followHost = !state.followHost;
        syncHudButtonsOnly();
      } else if (act === "open-qr-modal") {
        state.qrLightboxOpen = true;
        clearIdleTimer();
        updateStageView();
      } else if (act === "close-qr-modal") {
        state.qrLightboxOpen = false;
        resetIdleActivity();
        updateStageView();
      } else if (act === "clean-now") {
        forceCleanScreenNow();
      } else if (act === "fullscreen") {
        if (!document.fullscreenElement) {
          if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
        } else if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } else if (act === "copy-reflection") {
        const refIn = document.getElementById("psvStudentRefInput");
        if (refIn && navigator.clipboard) {
          navigator.clipboard.writeText(refIn.value || getCurrentSlide().stem || "").then(() => {
            actEl.textContent = "✓ คัดลอกแล้ว";
            setTimeout(() => { actEl.textContent = "📋 คัดลอก"; }, 1800);
          }).catch(() => {});
        }
      } else if (act === "close") {
        closeDeck();
      }
    });

    // Touch Swipe Left/Right
    let touchStartX = 0;
    let touchStartY = 0;
    modal.addEventListener("touchstart", (ev) => {
      if (ev.touches && ev.touches.length === 1) {
        touchStartX = ev.touches[0].clientX;
        touchStartY = ev.touches[0].clientY;
      }
    }, { passive: true });
    modal.addEventListener("touchend", (ev) => {
      if (!ev.changedTouches || ev.changedTouches.length !== 1) return;
      const dx = ev.changedTouches[0].clientX - touchStartX;
      const dy = ev.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) stepSlideByClicker(1);
        else stepSlideByClicker(-1);
      }
    }, { passive: true });

    window.addEventListener("resize", () => {
      if (state.isOpen) scheduleFitSlideBody();
    });

    document.addEventListener("keydown", (ev) => {
      if (state.qaComposerOpen) {
        if (ev.key === "Escape") {
          ev.preventDefault();
          closeQaComposerModal();
        }
        return;
      }
      if (!state.isOpen) return;
      const tag = ev.target && ev.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (ev.key === "Escape") ev.target.blur();
        return;
      }
      if (ev.key === "Escape") {
        if (closePinZoomLightbox()) {
          return;
        }
        if (state.qrLightboxOpen) {
          state.qrLightboxOpen = false;
          resetIdleActivity();
          updateStageView();
          return;
        }
        if (state.modDrawerOpen) {
          state.modDrawerOpen = false;
          resetIdleActivity();
          updateStageView();
          return;
        }
        if (state.stuDrawerOpen) {
          state.stuDrawerOpen = false;
          resetIdleActivity();
          updateStageView();
          return;
        }
        closeDeck();
        return;
      }
      resetIdleActivity();
      if (ev.key === "ArrowRight" || ev.key === "PageDown" || ev.key === " " || ev.key === "ArrowDown") {
        ev.preventDefault();
        stepSlideByClicker(1);
      } else if (ev.key === "ArrowLeft" || ev.key === "PageUp" || ev.key === "ArrowUp") {
        ev.preventDefault();
        stepSlideByClicker(-1);
      } else if (ev.key === "p" || ev.key === "P") {
        toggleAmbientCycle(false);
      } else if (ev.key === "b" || ev.key === "B") {
        state.backdropMode = state.backdropMode === "cinema" ? "aurora" : "cinema";
        updateStageView();
      } else if (ev.key === "h" || ev.key === "H") {
        forceCleanScreenNow();
      } else if ((ev.key === "n" || ev.key === "N") && ROLE === "faculty") {
        state.modDrawerOpen = !state.modDrawerOpen;
        updateStageView();
      } else if ((ev.key === "n" || ev.key === "N") && ROLE === "student") {
        state.stuDrawerOpen = !state.stuDrawerOpen;
        updateStageView();
      } else if (ev.key === "f" || ev.key === "F") {
        if (!document.fullscreenElement && modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
        else if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      } else if (ev.key === "+" || ev.key === "=") {
        setFontScale(state.fontScale + 0.08);
      } else if (ev.key === "-" || ev.key === "_") {
        setFontScale(state.fontScale - 0.08);
      }
    });
  }

  /* ---------- Public Open / Close API ---------- */
  function resolveDeckId(rawId) {
    if (!rawId) return "w1-d1-global";
    const s = String(rawId).trim();
    if (PANEL_DECKS[s]) return s;
    const upper = s.toUpperCase();
    if (upper === "GLOBAL" || upper === "PNL1" || s === "panel-global") return "w1-d1-global";
    if (upper === "PANEL-DHS" || upper === "DHS" || s === "panel-dhs") return "w3-d3-dhs-panel";
    if (upper === "PANEL-6BB" || upper === "6BB" || s === "panel-6bb") return "w5-d3-panel-homeless";
    if (upper === "PANEL-HP" || upper === "PANEL-POLICY" || s === "panel-policy") return "w5-d4-policy";
    return "w1-d1-global";
  }

  function openDeck(deckIdOrIdx, maybeIdx, opts) {
    initLiveSync();
    let targetDeckId = state.deckId || "w1-d1-global";
    let targetIdx = 0;
    let options = opts || {};

    if (typeof deckIdOrIdx === "number") {
      targetIdx = deckIdOrIdx;
      if (typeof maybeIdx === "object" && maybeIdx) options = maybeIdx;
    } else if (typeof deckIdOrIdx === "string") {
      targetDeckId = resolveDeckId(deckIdOrIdx);
      if (typeof maybeIdx === "number") targetIdx = maybeIdx;
      else if (typeof maybeIdx === "object" && maybeIdx) options = maybeIdx;
    }

    state.deckId = targetDeckId;
    const deck = getCurrentDeck();
    state.slideIdx = Math.max(0, Math.min(deck.slides.length - 1, targetIdx || 0));
    state.stationIdx = typeof options.stationIdx === "number" ? options.stationIdx : 0;
    state.qaFocusIdx = typeof options.qaFocusIdx === "number" ? options.qaFocusIdx : 0;
    state.isOpen = true;
    state.idleClean = false;
    state.qrLightboxOpen = false;
    if (typeof options.ambientCycle === "boolean") state.ambientCycle = options.ambientCycle;
    if (options.backdropMode === "aurora" || options.backdropMode === "cinema") {
      state.backdropMode = options.backdropMode;
    }

    if (deck.hashSlug) {
      const curH = (window.location.hash || "").replace(/^#/, "").toLowerCase();
      if (curH !== deck.hashSlug) {
        try {
          history.replaceState(null, "", window.location.pathname + window.location.search + "#" + deck.hashSlug);
        } catch (_) {}
      }
    }

    const modal = ensureModalElement();
    modal.hidden = false;
    modal.classList.remove("is-idle-clean");
    document.body.classList.add("psv-deck-open");

    if (!state.clockTimer) {
      state.clockTimer = setInterval(() => {
        const c = document.getElementById("psvWmClock");
        if (c) c.textContent = formatBangkokClock();
      }, 15000);
    }

    updateStageView();
    resetIdleActivity();

    if (options.fullscreen && modal.requestFullscreen) {
      modal.requestFullscreen().catch(() => {});
    }
  }

  function closeDeck() {
    state.isOpen = false;
    state.ambientCycle = false;
    state.qaLoopOnly = false;
    state.modDrawerOpen = false;
    state.stuDrawerOpen = false;
    state.qrLightboxOpen = false;
    clearIdleTimer();
    clearCycleTimer();
    if (state.clockTimer) {
      clearInterval(state.clockTimer);
      state.clockTimer = null;
    }
    if (!state.qaComposerOpen) {
      document.body.classList.remove("psv-deck-open");
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    const modal = document.getElementById("panelDeckModal");
    if (modal) modal.hidden = true;

    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (h.startsWith("panel-") && h !== QA_HASH_SLUG) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  function mountInlineShelf(containerEl, sessionId) {
    if (!containerEl) return;
    const resolvedId = resolveDeckId(sessionId);
    const deck = PANEL_DECKS[resolvedId];
    if (!deck || !Array.isArray(deck.slides) || !deck.slides.length) {
      containerEl.hidden = true;
      return;
    }

    let curIdx = 0;
    const renderShelf = () => {
      const sl = deck.slides[curIdx] || deck.slides[0];
      const bgImg = sl.bg || "bg_01_bedside_horizon.jpg";
      const dicutHtml = sl.dicutImg
        ? `<img class="psv-inl-dicut" src="${IMG_DIR}/${esc(sl.dicutImg)}?v=${ASSET_VER}" alt="${esc(sl.title || "")}" />`
        : "";
      const orgStripHtml = Array.isArray(sl.haloLogos)
        ? `<div class="psv-inl-logos">${sl.haloLogos
            .slice(0, 6)
            .map((hl) => `<span class="psv-inl-logo-pill"><img src="${IMG_DIR}/${esc(hl.logo)}?v=${ASSET_VER}" alt="" />${esc(hl.label)}</span>`)
            .join("")}</div>`
        : "";
      const previewSub =
        sl.enSubtitle ||
        sl.enHeading ||
        sl.roleSubtitle ||
        (Array.isArray(sl.coreQuestions) && "Q1–Q4 Core Panel Questions → Live Floor Q&A → Q5 Closing Wisdom") ||
        (Array.isArray(sl.subQuestions) && sl.subQuestions[0]) ||
        sl.stemLead ||
        sl.logline ||
        sl.kickerSub ||
        "";

      const pptxBtnHtml =
        ROLE === "faculty" && deck.pptxHref
          ? `<a class="btn sm" href="${esc(deck.pptxHref)}" download>⬇ ดาวน์โหลด .pptx</a>`
          : "";

      const chaptersHtml = deck.slides
        .map(
          (item, idx) =>
            `<button type="button" class="psv-inl-ch-btn${idx === curIdx ? " is-active" : ""}" data-inl-idx="${idx}">${esc(
              item.navLabel || item.num
            )}</button>`
        )
        .join("");

      containerEl.innerHTML = `
        <div class="psv-inl-head">
          <div>
            <div class="sf-detail-kicker">🎬 Slide ประกอบคาบ ${esc(deck.code)} · แขวนประจำคาบ (${deck.slides.length} สไลด์ · 16:9 Top-Aligned)</div>
            <p class="sf-detail-lead" style="margin-top:4px">ชุดสไลด์ประจำคาบเสวนาโดยเฉพาะ (จัดวางเนื้อหาชิดริมบนเพื่อไม่ให้โซฟาวิทยากรบังจอ) สามารถกดเลื่อนดูตัวอย่างสไลด์ด้านล่าง หรือกดฉายเต็มหน้าจอ 16:9 ได้ทันที</p>
          </div>
          <div class="psv-inl-actions">
            <button type="button" class="btn sm primary" data-inl-act="open-fs">📺 เปิดฉายเต็มจอ 16:9 (เริ่มสไลด์ ${esc(sl.num)})</button>
            <button type="button" class="btn sm teal" data-inl-act="copy-link">🔗 คัดลอกลิงก์ #${esc(deck.hashSlug)}</button>
            ${pptxBtnHtml}
          </div>
        </div>

        <div class="psv-inl-stage" style="background-image:linear-gradient(180deg,rgba(4,7,16,0.88) 0%,rgba(4,7,16,0.72) 62%,rgba(4,7,16,0.38) 100%),url('${IMG_DIR}/${esc(
        bgImg
      )}?v=${ASSET_VER}')" data-inl-act="open-fs" title="คลิกเพื่อเปิดฉายสไลด์หน้านี้แบบเต็มหน้าจอ 16:9">
          <div class="psv-inl-stage-top">
            <div class="psv-inl-stage-copy">
              <span class="psv-inl-kicker">${esc(sl.kicker || deck.seriesTag)}</span>
              <h4 class="psv-inl-title">${esc(sl.title || "")}</h4>
              ${previewSub ? `<p class="psv-inl-sub">${esc(previewSub)}</p>` : ""}
              ${orgStripHtml}
            </div>
            ${dicutHtml}
          </div>
          <div class="psv-inl-stage-foot">
            <button type="button" class="psv-inl-nav-btn" data-inl-act="prev">‹ สไลด์ก่อนหน้า</button>
            <span class="psv-inl-counter">สไลด์ ${curIdx + 1} / ${deck.slides.length} · คลิกเพื่อขยายเต็มจอ ⛶</span>
            <button type="button" class="psv-inl-nav-btn" data-inl-act="next">สไลด์ถัดไป ›</button>
          </div>
        </div>

        <div class="psv-inl-ch-strip" role="tablist" aria-label="เลือกดูสไลด์ประจำคาบ">
          ${chaptersHtml}
        </div>
      `;
    };

    containerEl.onclick = (ev) => {
      const chBtn = ev.target.closest("[data-inl-idx]");
      if (chBtn) {
        ev.stopPropagation();
        curIdx = parseInt(chBtn.getAttribute("data-inl-idx"), 10) || 0;
        renderShelf();
        return;
      }
      const actEl = ev.target.closest("[data-inl-act]");
      if (!actEl) return;
      const act = actEl.getAttribute("data-inl-act");
      if (act === "prev") {
        ev.stopPropagation();
        curIdx = (curIdx - 1 + deck.slides.length) % deck.slides.length;
        renderShelf();
      } else if (act === "next") {
        ev.stopPropagation();
        curIdx = (curIdx + 1) % deck.slides.length;
        renderShelf();
      } else if (act === "copy-link") {
        ev.stopPropagation();
        const fullUrl = `${window.location.origin}${window.location.pathname}#${deck.hashSlug}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(fullUrl).then(() => {
            actEl.textContent = "✓ คัดลอกลิงก์แล้ว";
            setTimeout(() => {
              actEl.textContent = `🔗 คัดลอกลิงก์ #${deck.hashSlug}`;
            }, 1800);
          }).catch(() => {});
        }
      } else if (act === "open-fs") {
        ev.stopPropagation();
        openDeck(deck.id, curIdx);
      }
    };

    renderShelf();
  }

  window.RACM_PANEL_DECK = {
    open: openDeck,
    close: closeDeck,
    openQaComposer: openQaComposerModal,
    submitLiveQuestion: submitLiveFloorQuestion,
    getLiveQuestions: getVisibleQaList,
    goToSlide,
    stepSlide,
    stepSlideByClicker,
    setFontScale,
    toggleAmbientCycle,
    mountInlineShelf,
    hasDeck: (id) => Boolean(PANEL_DECKS[id] || PANEL_DECKS[resolveDeckId(id)]),
    getDecks: () => PANEL_DECKS,
    pptxHref: MODERATOR_PPTX_HREF
  };

  function checkUrlAutoOpen() {
    const params = new URLSearchParams(window.location.search);
    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    const slideParam = (params.get("slides") || params.get("panel") || "").toUpperCase();
    const qaParam = (params.get("qa") || params.get("ask") || "").toLowerCase();

    if (h === QA_HASH_SLUG || h === "panel-global-qa" || qaParam === "global" || qaParam === "1" || qaParam === "true") {
      openQaComposerModal("w1-d1-global", true);
      return;
    }
    if (qaParam && PANEL_DECKS[resolveDeckId(qaParam)]) {
      openQaComposerModal(resolveDeckId(qaParam), true);
      return;
    }
    if ((h === "panel-global" || slideParam === "GLOBAL") && PANEL_DECKS["w1-d1-global"]) {
      openDeck("w1-d1-global", 0);
    }
  }

  window.addEventListener("hashchange", checkUrlAutoOpen);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkUrlAutoOpen);
  } else {
    checkUrlAutoOpen();
  }
})();
