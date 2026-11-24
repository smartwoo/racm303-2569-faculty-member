/* ==========================================================================
   RACM 303 (2569) — Apple TV Aerial & Netflix Idle Screensaver Slide Engine
   Reusable Multi-Panel Stage + Complete 14-Slide Deck for GLOBAL (25 Nov 2569)
   Works seamlessly across Faculty Member (Red) and Student (Blue) Portals
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const ASSET_VER = "20261124psv6";
  const IMG_DIR = "assets/images/panel_screensaver";
  const MODERATOR_PPTX_HREF =
    ROLE === "faculty" ? `exports/pptx/RACM303_2569_Physician_Roles_Moderator.pptx?v=${ASSET_VER}` : "";

  const PROD_STUDENT_BASE = "https://smartwoo.github.io/racm303-2569-student/";
  const SYNC_BC_NAME = "racm303_panel_deck_sync_v1";
  const MQTT_TOPIC = "racm303/2569/panel_deck_sync/v1";
  const IDLE_HIDE_MS = 3600;
  const AMBIENT_CYCLE_MS = 12000;
  const STATION_CYCLE_MS = 5800;

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

  function buildQrSvg(text) {
    const bytes = Array.from(new TextEncoder().encode(String(text || "")));
    let ver = 1;
    while (ver <= 10) {
      const p = QR_ECC_M[ver];
      const cap = p[1] * p[2] + p[3] * p[4];
      const lenBits = ver <= 9 ? 8 : 16;
      if (Math.ceil((4 + lenBits + bytes.length * 8) / 8) <= cap) break;
      ver += 1;
    }
    if (ver > 10) ver = 10;
    const [ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data] = QR_ECC_M[ver];
    const totalData = g1Blocks * g1Data + g2Blocks * g2Data;
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
    const blocks = [];
    const ecBlocks = [];
    let offset = 0;
    for (let b = 0; b < g1Blocks + g2Blocks; b += 1) {
      const len = b < g1Blocks ? g1Data : g2Data;
      const slice = codewords.slice(offset, offset + len);
      offset += len;
      blocks.push(slice);
      ecBlocks.push(rsRemainder(slice, ecPerBlock));
    }
    const finalBytes = [];
    const maxDataLen = Math.max(g1Data, g2Data);
    for (let i = 0; i < maxDataLen; i += 1) {
      blocks.forEach((bl) => {
        if (i < bl.length) finalBytes.push(bl[i]);
      });
    }
    for (let i = 0; i < ecPerBlock; i += 1) {
      ecBlocks.forEach((ec) => finalBytes.push(ec[i]));
    }
    const size = ver * 4 + 17;
    const grid = Array.from({ length: size }, () => new Int8Array(size));
    const reserved = Array.from({ length: size }, () => new Uint8Array(size));

    const placeFinder = (r0, c0) => {
      for (let dr = -1; dr <= 7; dr += 1) {
        for (let dc = -1; dc <= 7; dc += 1) {
          const r = r0 + dr;
          const c = c0 + dc;
          if (r < 0 || r >= size || c < 0 || c >= size) continue;
          const on =
            (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
            (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
          grid[r][c] = on ? 1 : 0;
          reserved[r][c] = 1;
        }
      }
    };
    placeFinder(0, 0);
    placeFinder(0, size - 7);
    placeFinder(size - 7, 0);

    const alignPts = QR_ALIGN[ver];
    for (let i = 0; i < alignPts.length; i += 1) {
      for (let j = 0; j < alignPts.length; j += 1) {
        const cr = alignPts[i];
        const cc = alignPts[j];
        if (reserved[cr][cc]) continue;
        for (let dr = -2; dr <= 2; dr += 1) {
          for (let dc = -2; dc <= 2; dc += 1) {
            const on = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            grid[cr + dr][cc + dc] = on ? 1 : 0;
            reserved[cr + dr][cc + dc] = 1;
          }
        }
      }
    }
    for (let i = 8; i < size - 8; i += 1) {
      if (!reserved[6][i]) {
        grid[6][i] = i % 2 === 0 ? 1 : 0;
        reserved[6][i] = 1;
      }
      if (!reserved[i][6]) {
        grid[i][6] = i % 2 === 0 ? 1 : 0;
        reserved[i][6] = 1;
      }
    }
    for (let i = 0; i <= 8; i += 1) {
      if (i < size) {
        reserved[8][i] = 1;
        reserved[i][8] = 1;
      }
    }
    for (let i = 0; i < 8; i += 1) {
      reserved[8][size - 1 - i] = 1;
      reserved[size - 1 - i][8] = 1;
    }
    grid[size - 8][8] = 1;
    reserved[size - 8][8] = 1;

    const streamBits = [];
    finalBytes.forEach((b) => {
      for (let i = 7; i >= 0; i -= 1) streamBits.push((b >>> i) & 1);
    });
    let bitIdx = 0;
    let upward = true;
    for (let col = size - 1; col >= 1; col -= 2) {
      if (col === 6) col -= 1;
      for (let step = 0; step < size; step += 1) {
        const r = upward ? size - 1 - step : step;
        for (let dx = 0; dx < 2; dx += 1) {
          const c = col - dx;
          if (!reserved[r][c]) {
            const bit = bitIdx < streamBits.length ? streamBits[bitIdx++] : 0;
            grid[r][c] = (r + c) % 2 === 0 ? bit ^ 1 : bit;
          }
        }
      }
      upward = !upward;
    }
    let fmt = (0b00 << 3) | 0b000;
    let rem = fmt << 10;
    for (let i = 14; i >= 10; i -= 1) {
      if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10);
    }
    const fmtBits = ((fmt << 10) | rem) ^ 0x5412;
    const fmtCoordsA = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    const fmtCoordsB = [
      [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8],
      [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
    ];
    for (let i = 0; i < 15; i += 1) {
      const bit = (fmtBits >>> i) & 1;
      grid[fmtCoordsA[i][0]][fmtCoordsA[i][1]] = bit;
      grid[fmtCoordsB[i][0]][fmtCoordsB[i][1]] = bit;
    }
    let path = "";
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c]) path += `M${c + 1},${r + 1}h1v1h-1z`;
      }
    }
    return `<svg viewBox="0 0 ${size + 2} ${size + 2}" shape-rendering="crispEdges" aria-label="QR Code"><rect width="${size + 2}" height="${size + 2}" fill="#fff"/><path d="${path}" fill="#090d16"/></svg>`;
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
      qaLoopRange: [6, 11], // Slides 07..12 (0-indexed 6..11)
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
              text: "ถอดบทเรียนบทบาทและเส้นทางวิชาชีพแพทย์ต่อผู้ป่วยและสังคมจากประสบการณ์การทำงานจริงของวิทยากร เพื่อเข้าใจการขยับขยายมุมมองจากการดูแลผู้ป่วยรายบุคคลอย่างองค์รวม มาสู่เวชปฏิบัติฐานระบบ (Systems-Based Practice: SBP) และศาสตร์วิทยาระบบสุขภาพ (Health Systems Science: HSS)"
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
          orbs: ["rgba(245,158,11,0.34)", "rgba(14,165,233,0.24)", "rgba(16,185,129,0.18)"],
          kicker: "เส้นทางรถไฟสายวิชาชีพ · วิทยากรท่านที่ 1",
          kickerSub: "จากโรงพยาบาลชุมชนริมฝั่งโขง สู่นโยบายสุขภาพระดับประเทศ องค์การอนามัยโลก และมูลนิธิไชน่าเมดิคอลบอร์ด",
          title: "นพ.ทักษพล ธรรมรังสี",
          milestones: [
            {
              year: "2539–2547",
              shortStop: "รพ.นาหว้า",
              roleTag: "Bedside & Rural Hospital",
              sceneLabel: "📍 รพ.นาหว้า จ.นครพนม · ลุ่มน้ำโขง",
              bg: "bg_02_nahwa_to_world.jpg",
              kb: "kb-a",
              orbs: ["rgba(245,158,11,0.34)", "rgba(14,165,233,0.22)", "rgba(16,185,129,0.18)"],
              headline: "แพทย์โรงพยาบาลชุมชนริมฝั่งโขง — รพ.นาหว้า จ.นครพนม",
              text: "จบแพทยศาสตรบัณฑิต ศิริราชพยาบาล (2539) ปฏิบัติงานดูแลผู้ป่วยและชุมชนที่ รพ.นาหว้า จ.นครพนม พร้อมศึกษาสาธารณสุขศาสตรมหาบัณฑิต ม.มหิดล (2544) และเริ่มเชื่อมงานคลินิกเข้ากับงานวิจัยระบบสุขภาพที่ IHPP (2546)"
            },
            {
              year: "2551",
              shortStop: "Massey Ph.D.",
              roleTag: "Health Policy Research",
              sceneLabel: "📍 Massey University · New Zealand",
              bg: "st_thak_02_massey.jpg",
              kb: "kb-b",
              orbs: ["rgba(16,185,129,0.32)", "rgba(56,189,248,0.24)", "rgba(245,158,11,0.18)"],
              headline: "ปริญญาเอกนโยบายสุขภาพ — Massey University นิวซีแลนด์",
              text: "ศึกษาวิจัยเชิงลึกระดับปริญญาเอกด้านกระบวนการกำหนดนโยบายแอลกอฮอล์ของประเทศไทย (Alcohol Policy Process in Thailand) ถอดรหัสกลไกเศรษฐศาสตร์การเมือง ปัจจัยกำหนดสุขภาพเชิงพาณิชย์ และการขับเคลื่อนนโยบายสาธารณะบนฐานหลักฐานวิชาการ"
            },
            {
              year: "2552–2556",
              shortStop: "ผอ.ศวส.",
              roleTag: "Evidence-to-Policy",
              sceneLabel: "📍 ศูนย์วิจัยปัญหาสุรา (ศวส.)",
              bg: "bg_05_compass_crossroads.jpg",
              kb: "kb-c",
              orbs: ["rgba(245,158,11,0.34)", "rgba(239,68,68,0.20)", "rgba(56,189,248,0.22)"],
              headline: "ผู้อำนวยการศูนย์วิจัยปัญหาสุรา (ศวส. / CAS)",
              text: "สร้างและจัดการความรู้เชิงระบบเพื่อคุ้มครองสังคมจากผลกระทบของเครื่องดื่มแอลกอฮอล์และโรคไม่ติดต่อเรื้อรัง (NCDs) เชื่อมโยงข้อมูลระบาดวิทยาเข้ากับการชี้นำสังคมและมาตรการทางกฎหมายระดับประเทศ"
            },
            {
              year: "2558 / 2565",
              shortStop: "ผอ.IHPP · WHO",
              roleTag: "National HPSR & Regional NCDs",
              sceneLabel: "📍 สำนักงานพัฒนานโยบายสุขภาพระหว่างประเทศ (IHPP) & WHO SEARO",
              bg: "st_thak_05_who.jpg",
              kb: "kb-d",
              orbs: ["rgba(56,189,248,0.34)", "rgba(99,102,241,0.24)", "rgba(245,158,11,0.20)"],
              headline: "ผู้อำนวยการ IHPP และผอ.ฝ่ายโรคไม่ติดต่อฯ WHO SEARO",
              text: "ดำรงตำแหน่งผู้อำนวยการสำนักงานพัฒนานโยบายสุขภาพระหว่างประเทศ (IHPP · ม.ค. 2558 และกลับมาดำรงตำแหน่งอีกครั้ง ม.ค. 2565) ควบคู่กับบทบาท Director, Noncommunicable Diseases and Environmental Health ณ องค์การอนามัยโลกภูมิภาคเอเชียตะวันออกเฉียงใต้ (ก.ค. 2558)"
            },
            {
              year: "2567–2568",
              shortStop: "DPM · WHO SEARO",
              roleTag: "Global Health Governance",
              sceneLabel: "📍 WHO South-East Asia Regional Office",
              bg: "st_suw_05_assembly.jpg",
              kb: "kb-a",
              orbs: ["rgba(14,165,233,0.36)", "rgba(245,158,11,0.24)", "rgba(99,102,241,0.22)"],
              headline: "ผู้อำนวยการฝ่ายบริหารแผนงาน (Director of Programme Management) WHO SEARO",
              text: "กำกับยุทธศาสตร์และบริหารแผนงานความร่วมมือด้านระบบสุขภาพของประเทศสมาชิกในภูมิภาคเอเชียตะวันออกเฉียงใต้ รวมถึงการเชื่อมความร่วมมือด้านการป้องกันการบาดเจ็บและระบบบริการสุขภาพที่ยั่งยืน"
            },
            {
              year: "2569",
              shortStop: "ผอ.CMB",
              roleTag: "Regional Health Systems Leadership",
              sceneLabel: "📍 มูลนิธิไชน่าเมดิคอลบอร์ด (CMB Foundation · กรุงเทพฯ)",
              bg: "st_thak_06_cmb.jpg",
              kb: "kb-b",
              orbs: ["rgba(251,191,36,0.36)", "rgba(56,189,248,0.24)", "rgba(239,68,68,0.18)"],
              headline: "ผู้อำนวยการมูลนิธิไชน่าเมดิคอลบอร์ด China Medical Board (CMB) Foundation",
              text: "เริ่มดำรงตำแหน่งตั้งแต่ 1 ม.ค. 2569 ขับเคลื่อนความร่วมมือกับสถาบันการแพทย์และสาธารณสุขทั่วเอเชีย เพื่อพัฒนาศักยภาพผู้นำวิชาชีพสุขภาพ ยกระดับเวชปฏิบัติฐานระบบ (SBP) และลดความเหลื่อมล้ำทางสุขภาพ"
            }
          ],
          footnote: "กดลูกศร → / Space หรือคลิกที่สถานีบนรางรถไฟเพื่อเลื่อนดูแต่ละบทบาท · เอกสารอ้างอิงฉบับเต็มอยู่ในหน้า 14",
          moderatorNotes: {
            lead: "กล่าวแนะนำ: นพ.ทักษพล ธรรมรังสี (ผู้อำนวยการมูลนิธิไชน่าเมดิคอลบอร์ด China Medical Board (CMB) Foundation) — กด Clicker ไล่ตามสถานี 1 ถึง 6",
            bullets: [
              "2544 สาธารณสุขศาสตรมหาบัณฑิต ม.มหิดล · เริ่มงานวิจัยที่ IHPP ปี 2546 ระหว่างช่วงงานโรงพยาบาล",
              "2558 Director, NCD and Environmental Health, WHO SEARO · ส.ค. 2567 Director of Programme Management, WHO SEARO",
              "ม.ค. 2568 ผลักดันความร่วมมือ WHO–ศิริราชด้านการป้องกันการบาดเจ็บและการหกล้ม"
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
          orbs: ["rgba(16,185,129,0.34)", "rgba(56,189,248,0.24)", "rgba(245,158,11,0.18)"],
          kicker: "เส้นทางรถไฟสายวิชาชีพ · วิทยากรท่านที่ 2",
          kickerSub: "จากผู้อำนวยการโรงพยาบาลชุมชนภาคใต้ สู่มานุษยวิทยาการแพทย์ พรมแดนสุขภาพ และสิทธิอากาศสะอาด",
          title: "นพ.วิรุฬ ลิ้มสวาท",
          milestones: [
            {
              year: "2544–2551",
              shortStop: "รพ.ชุมชนใต้",
              roleTag: "Community Hospital Director",
              sceneLabel: "📍 รพ.ถ้ำพรรณรา & รพร.ฉวาง จ.นครศรีธรรมราช",
              bg: "st_wirun_01_south.jpg",
              kb: "kb-a",
              orbs: ["rgba(16,185,129,0.34)", "rgba(56,189,248,0.22)", "rgba(245,158,11,0.18)"],
              headline: "แพทย์และผู้บริหารโรงพยาบาลชุมชนภาคใต้ — จ.นครศรีธรรมราช",
              text: "จบแพทยศาสตรบัณฑิต ศิริราชพยาบาล ปฏิบัติงานและบริหารโรงพยาบาลถ้ำพรรณรา (2545–2551) และโรงพยาบาลสมเด็จพระยุพราชฉวาง (2548–2551) สัมผัสความซับซ้อนของชีวิตผู้ป่วยจริง ระบบราชการ และบริบทชุมชนท้องถิ่น"
            },
            {
              year: "2555 / 2561",
              shortStop: "Harvard Ph.D.",
              roleTag: "Medical & Social Anthropology",
              sceneLabel: "📍 Harvard University · Cambridge",
              bg: "st_wirun_02_harvard.jpg",
              kb: "kb-b",
              orbs: ["rgba(245,158,11,0.34)", "rgba(239,68,68,0.22)", "rgba(56,189,248,0.20)"],
              headline: "ปริญญาโทและเอกมานุษยวิทยาการแพทย์และสังคม — Harvard University",
              text: "ขยายกรอบคิดจากชีวเวชศาสตร์สู่มานุษยวิทยาการแพทย์ (A.M. 2555) และมานุษยวิทยาสังคม (Ph.D. 2561) ณ มหาวิทยาลัยฮาร์วาร์ด เพื่อตั้งคำถามต่อโครงสร้างทางสังคม วัฒนธรรมของระบบบริการ และความทุกข์ของผู้คนอย่างลึกซึ้ง"
            },
            {
              year: "2561",
              shortStop: "พรมแดนวัณโรค",
              roleTag: "Cross-Border Health Equity",
              sceneLabel: "📍 พื้นที่ชายแดนไทย–เมียนมา",
              bg: "bg_03_border_anthropology.jpg",
              kb: "kb-c",
              orbs: ["rgba(20,184,166,0.34)", "rgba(56,189,248,0.24)", "rgba(245,158,11,0.18)"],
              headline: "ฝังตัววิจัยภาคสนาม 14 เดือน — การดูแลและควบคุมวัณโรคชายแดน",
              text: "ศึกษาปฏิสัมพันธ์ระหว่างระบบหลักประกันสุขภาพ การทำงานของบุคลากรด่านหน้า และการควบคุมวัณโรคข้ามพรมแดน ชี้ให้เห็นว่าโรคติดเชื้อและสิทธิสุขภาพไม่อาจแยกขาดจากพรมแดนทางสังคมและชีวิตของแรงงานข้ามชาติ"
            },
            {
              year: "2562 / 2568",
              shortStop: "อากาศสะอาด",
              roleTag: "Planetary Health & Civic Forum",
              sceneLabel: "📍 เวทีสาธารณะสิทธิอากาศสะอาดและสุขภาพแรงงาน",
              bg: "st_wirun_04_cleanair.jpg",
              kb: "kb-d",
              orbs: ["rgba(56,189,248,0.34)", "rgba(16,185,129,0.26)", "rgba(251,191,36,0.20)"],
              headline: "วิจัยการเตรียมแพทย์สู่ รพ.ชุมชน & ขับเคลื่อนสิทธิอากาศสะอาด",
              text: "ร่วมวิจัยระบบการศึกษาแพทย์เพื่อชนบท และดำเนินเวทีสาธารณะเชื่อมโยงปัญหาฝุ่นพิษ สิ่งแวดล้อม และความเปราะบางของคนทำงาน สู่การขับเคลื่อนสิทธิอากาศสะอาดและสุขภาพของพิภพโลก (Planetary Health)"
            },
            {
              year: "2569",
              shortStop: "วิจัยสังคม สธ.",
              roleTag: "Society & Health Systems Research",
              sceneLabel: "📍 กลุ่มงานวิจัยสังคมและสุขภาพ กระทรวงสาธารณสุข",
              bg: "bg_06_ripples_perspective.jpg",
              kb: "kb-a",
              orbs: ["rgba(14,165,233,0.34)", "rgba(16,185,129,0.26)", "rgba(139,92,246,0.22)"],
              headline: "หัวหน้ากลุ่มงานวิจัยสังคมและสุขภาพ กระทรวงสาธารณสุข",
              text: "นำมุมมองสังคมศาสตร์และมานุษยวิทยาการแพทย์มาสังเคราะห์ข้อเสนอเชิงระบบและรายงานสถานการณ์ระบบสุขภาพไทย เพื่อให้ระบบสาธารณสุขรับฟังเสียงของประชาชนและกลุ่มเปราะบางอย่างเป็นธรรม"
            }
          ],
          footnote: "กดลูกศร → / Space หรือคลิกที่สถานีบนรางรถไฟเพื่อเลื่อนดูแต่ละบทบาท · เอกสารอ้างอิงฉบับเต็มอยู่ในหน้า 14",
          moderatorNotes: {
            lead: "กล่าวแนะนำ: นพ.วิรุฬ ลิ้มสวาท หัวหน้ากลุ่มงานวิจัยสังคมและสุขภาพ กระทรวงสาธารณสุข — กด Clicker ไล่ตามสถานี 1 ถึง 5",
            bullets: [
              "ทำงานบริหาร รพ.ถ้ำพรรณรา (2545–2551) และ รพร.ฉวาง (2548–2551)",
              "บทสัมภาษณ์ Harvard Gazette สะท้อนแรงจูงใจจากข้อขัดแย้งทางการแพทย์และชีวิตผู้ป่วยจริง · ลงพื้นที่ชายแดน 14 เดือนศึกษาระบบราชการ การดูแล และวัณโรค",
              "ธ.ค. 2568 ดำเนินวงเสวนาสาธารณะว่าด้วยสิทธิสุขภาพและการสัมผัสฝุ่นของแรงงาน"
            ],
            refs: [
              { label: "Harvard Gazette • บทสัมภาษณ์ นพ.วิรุฬ (2561)", url: "https://news.harvard.edu/gazette/story/2018/05/doctor-gets-a-doctorate-and-takes-it-home-to-thailand/" },
              { label: "Harvard DASH • วิทยานิพนธ์วัณโรคชายแดน (2561)", url: "https://dash.harvard.edu/entities/publication/dd0c41a2-e964-4bdc-a8d4-5e0c376fbefb" },
              { label: "HITAP • ประวัติผู้ร่วมวิจัย (2567), น. 88–89", url: "https://www.hitap.net/wp-content/uploads/2024/06/FINAL-HSRI-proposal_KRT-policy-TH_13Mar24-1.pdf" }
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
          orbs: ["rgba(168,85,247,0.32)", "rgba(56,189,248,0.26)", "rgba(245,158,11,0.22)"],
          kicker: "เส้นทางรถไฟสายวิชาชีพ · วิทยากรท่านที่ 3",
          kickerSub: "จากกุมารเวชศาสตร์และระบาดวิทยาคลินิก สู่มหิดลโมเดลและการคุ้มครองเยาวชนจากบุหรี่และบุหรี่ไฟฟ้าระดับชาติ",
          title: "ศาสตราจารย์เกียรติคุณ พญ.สุวรรณา เรืองกาญจนเศรษฐ์",
          milestones: [
            {
              year: "2520–2527",
              shortStop: "กุมารแพทย์ รามาฯ",
              roleTag: "Pediatrics & Academic Medicine",
              sceneLabel: "📍 รพ.อุดรธานี → คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี",
              bg: "st_suw_01_rama.jpg",
              kb: "kb-a",
              orbs: ["rgba(56,189,248,0.34)", "rgba(168,85,247,0.24)", "rgba(245,158,11,0.18)"],
              headline: "จากแพทย์ภูมิภาค รพ.อุดรธานี สู่กุมารแพทย์และอาจารย์แพทย์รามาธิบดี",
              text: "จบแพทยศาสตรบัณฑิต ศิริราชพยาบาล ปฏิบัติงานที่ รพ.อุดรธานี ได้รับวุฒิบัตรกุมารเวชศาสตร์ (2526) และเข้ารับตำแหน่งอาจารย์ภาควิชากุมารเวชศาสตร์ คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี (2527)"
            },
            {
              year: "2534 / 2548",
              shortStop: "ระบาดวิทยาวัยรุ่น",
              roleTag: "Clinical Epidemiology & Youth Health",
              sceneLabel: "📍 ระบาดวิทยาคลินิก & สุขภาวะวัยรุ่นกรุงเทพมหานคร",
              bg: "bg_01_bedside_horizon.jpg",
              kb: "kb-b",
              orbs: ["rgba(245,158,11,0.32)", "rgba(56,189,248,0.26)", "rgba(16,185,129,0.20)"],
              headline: "ระบาดวิทยาคลินิก พิษวิทยาเด็ก และงานสำรวจพฤติกรรมเสี่ยงวัยรุ่น",
              text: "ต่อยอดองค์ความรู้ Clinical Epidemiology สู่การวิจัยระดับสารตะกั่วในเด็กไทยที่ร่วมผลักดันนโยบายน้ำมันไร้สารตะกั่ว และริเริ่มงานสำรวจ Bangkok Youth Risk Behavior Survey (ตีพิมพ์ 2548) เพื่อให้เห็นรากเหง้าปัญหาสุขภาพวัยรุ่นเชิงประชากร"
            },
            {
              year: "2554–2563",
              shortStop: "มหิดลโมเดล",
              roleTag: "University-School-Community System",
              sceneLabel: "📍 มหาวิทยาลัยมหิดล · ระบบนิเวศโรงเรียน–ครอบครัว–ชุมชน",
              bg: "st_suw_03_mahidol.jpg",
              kb: "kb-c",
              orbs: ["rgba(16,185,129,0.34)", "rgba(56,189,248,0.24)", "rgba(245,158,11,0.20)"],
              headline: "รองอธิการบดี ม.มหิดล & การสังเคราะห์ “มหิดลโมเดล” (2563)",
              text: "บริหารงานระดับมหาวิทยาลัยและพัฒนา “มหิดลโมเดล” เชื่อมโยงระบบเฝ้าระวังและดูแลวัยรุ่นแบบบูรณาการระหว่างโรงเรียน ครอบครัว ชุมชน และโรงพยาบาล ไม่ปล่อยให้เด็กต้องเผชิญความเสี่ยงตามลำพัง"
            },
            {
              year: "2565",
              shortStop: "รอง ผอ.ศจย.",
              roleTag: "Tobacco Control Knowledge Hub",
              sceneLabel: "📍 ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ (ศจย.)",
              bg: "bg_07_lantern_purpose.jpg",
              kb: "kb-d",
              orbs: ["rgba(251,191,36,0.34)", "rgba(168,85,247,0.24)", "rgba(56,189,248,0.22)"],
              headline: "รองผู้อำนวยการฝ่ายบริหาร ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ (ศจย.)",
              text: "ขับเคลื่อนคลังหลักฐานวิชาการและการจัดการความรู้ระดับประเทศ เพื่อเปิดโปงกลยุทธ์อุตสาหกรรมยาสูบ สร้างเสริมสุขภาพ และปกป้องประชากรไทยจากพิษภัยของบุหรี่และผลิตภัณฑ์ยาสูบรูปแบบใหม่"
            },
            {
              year: "2566–2567",
              shortStop: "สมัชชาบุหรี่ไฟฟ้า",
              roleTag: "National Health Advocate & Change Agent",
              sceneLabel: "📍 เวทีสมัชชาสุขภาพเฉพาะประเด็น · คุ้มครองเด็กและเยาวชน",
              bg: "bg_04_youth_city_canopy.jpg",
              kb: "kb-a",
              orbs: ["rgba(168,85,247,0.34)", "rgba(245,158,11,0.26)", "rgba(16,185,129,0.22)"],
              headline: "ประธานคณะพัฒนานโยบายสาธารณะควบคุมบุหรี่ไฟฟ้า — สมัชชาสุขภาพเฉพาะประเด็น",
              text: "ประสานพลังสหวิชาชีพ เครือข่ายครู ผู้ปกครอง เยาวชน และหน่วยงานรัฐ ขับเคลื่อนมติสมัชชาสุขภาพเฉพาะประเด็นเพื่อปกป้องเด็กและเยาวชนไทยจากการระบาดของบุหรี่ไฟฟ้าอย่างเป็นระบบ"
            }
          ],
          footnote: "กดลูกศร → / Space หรือคลิกที่สถานีบนรางรถไฟเพื่อเลื่อนดูแต่ละบทบาท · เอกสารอ้างอิงฉบับเต็มอยู่ในหน้า 14",
          moderatorNotes: {
            lead: "กล่าวแนะนำ: ศาสตราจารย์เกียรติคุณ พญ.สุวรรณา เรืองกาญจนเศรษฐ์ รองผู้อำนวยการฝ่ายบริหาร ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ (ศจย.) — กด Clicker ไล่ตามสถานี 1 ถึง 5",
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
          kickerSub: "ใช้เหตุการณ์จริงที่วิทยากรแต่ละท่านเลือก เป็นแกนร่วมของคำถามทั้ง 5 ข้อ",
          title: "ลำดับจังหวะการสนทนาและแลกเปลี่ยน",
          phases: [
            { min: "00 – 15 นาที", title: "เปิดวงและเส้นทางวิทยากร", desc: "ทำความรู้จักหมุดหมายสำคัญบนเส้นทางอาชีพของวิทยากรทั้ง 3 ท่าน" },
            { min: "15 – 85 นาที", title: "เสวนาด้วยคำถามหลัก 5 ข้อ", desc: "สำรวจจุดตัดสินใจ ผลลัพธ์ มุมมองผู้อื่น ความหมายของแพทย์ และก้าวแรก", featured: true },
            { min: "85 – 145 นาที", title: "Q&A จากนักศึกษา (60 นาที)", desc: "เปิดฟลอร์ให้นักศึกษาแพทย์ปี 3 ถามต่อยอดและเชื่อมคำถามของตนเองเต็มเวลา", featured: true },
            { min: "145 – 150 นาที", title: "สะท้อนคิดและปิดวง", desc: "ตกผลึก 1 ประโยคสิ่งที่จะนำไปลองทำและรับฟังในก้าวถัดไป" }
          ],
          moderatorNotes: {
            lead: "เปิดประมาณ 3 นาที ใช้ไทม์ไลน์ท่านละ ~4 นาที จากนั้นใช้คำถามหลักข้อละ ~14 นาที แล้วเริ่ม Q&A ที่นาที 85 ให้ครบ 60 นาที จบด้วยสะท้อนคิดนาที 145",
            bullets: [
              "สลับผู้ตอบคนแรกในแต่ละข้อ และเชิญทุกท่านเติมมุมมองตามเวลา",
              "ข้อ 1 ให้วิทยากรเลือกเหตุการณ์จริงของตนเอง → ข้อ 2–4 กลับไปขุดลึกในเรื่องนั้น → ข้อ 5 ส่งต่อบทเรียนสู่นักศึกษาปี 3",
              "โครงสะท้อนคิด: What? (ข้อ 1–2) → So what? (ข้อ 3–4) → Now what? (ข้อ 5) คู่กับ Single / Double / Triple Loop และ 5 Whys",
              "หากเข้าใกล้นาที 85 ให้รวบคำถามต่อยอดเพื่อรักษาเวลา Q&A 60 นาทีให้นักศึกษา"
            ],
            refs: [
              { label: "Argyris (1977) • Double-Loop Learning in Organizations", url: "https://hbr.org/1977/09/double-loop-learning-in-organizations" },
              { label: "Peschl (2007) • Triple-loop learning", url: "https://constructivist.info/2/2-3/136" },
              { label: "IHI • 5 Whys: Finding the Root Cause", url: "https://www.ihi.org/library/tools/5-whys-finding-root-cause" }
            ]
          }
        },
        {
          id: "g-s06",
          num: "07",
          navLabel: "07 · คำถาม 1/5",
          type: "prompt",
          qStep: 1,
          bg: "bg_05_compass_crossroads.jpg",
          kb: "kb-b",
          orbs: ["rgba(245,158,11,0.28)", "rgba(56,189,248,0.22)", "rgba(30,64,175,0.28)"],
          kicker: "คำถาม 1 จาก 5 · นาทีที่ 15–29",
          kickerSub: "จุดตัดสินใจบนเส้นทางอาชีพ (Turning Point · What?)",
          title: "“จากเส้นทางนี้ อาจารย์อยากพาเรากลับไปดูเหตุการณ์ไหนที่ต้องตัดสินใจครั้งสำคัญครับ?”",
          logline: "ฟังเรื่องเล่าจากเหตุการณ์จริงในห้องตรวจ โรงพยาบาลชุมชน ชายแดน หรือเวทีนโยบาย ที่กลายเป็นจุดเปลี่ยนสำคัญของเส้นทางแพทย์",
          moderatorNotes: {
            lead: "ลำดับเปิด: เริ่มที่ นพ.ทักษพล → เชิญ นพ.วิรุฬ → ศ.เกียรติคุณ พญ.สุวรรณา",
            bullets: [
              "หยิบหนึ่งหมุดจากไทม์ไลน์ของแต่ละท่านเป็นทางเข้า แล้วให้ท่านเลือกเหตุการณ์เอง (ในห้องตรวจ ชุมชน หรือการทำงานกับระบบ)",
              "คำถามต่อยอด (Probing): ตอนนั้นเกิดอะไรขึ้น และอาจารย์ต้องเลือกระหว่างเรื่องอะไรครับ?",
              "คำถามต่อยอด: อะไรทำให้วันนี้ยังจำเหตุการณ์นี้ได้ชัดเจน?",
              "จดคำสำคัญและชื่อเหตุการณ์ของทั้ง 3 ท่านไว้เป็นสมอสำหรับถามต่อในข้อ 2–4"
            ],
            refs: [
              { label: "Ganz และคณะ • Public Narrative", url: "https://www.hks.harvard.edu/publications/crafting-public-narrative-enable-collective-action-pedagogy-leadership-development" }
            ]
          }
        },
        {
          id: "g-s07",
          num: "08",
          navLabel: "08 · คำถาม 2/5",
          type: "prompt",
          qStep: 2,
          bg: "bg_06_ripples_perspective.jpg",
          kb: "kb-c",
          orbs: ["rgba(56,189,248,0.28)", "rgba(20,184,166,0.22)", "rgba(99,102,241,0.22)"],
          kicker: "คำถาม 2 จาก 5 · นาทีที่ 29–43",
          kickerSub: "สิ่งที่ทำและผลที่เห็น (Action & Consequences · Single Loop)",
          title: "“ตอนนั้นอาจารย์เลือกทำอะไร แล้วผลที่เห็นบอกอะไรเกี่ยวกับวิธีที่เลือกครับ?”",
          logline: "สำรวจเหตุผลเบื้องหลังการลงมือทำ ผลลัพธ์ที่เกิดขึ้นจริงเทียบกับสิ่งที่คาดหวัง และข้อจำกัดของวิธีการเดิม",
          moderatorNotes: {
            lead: "ลำดับเปิด: เริ่มที่ ศ.เกียรติคุณ พญ.สุวรรณา → วนกลับไปยังเรื่องของอีกสองท่าน (ใช้คำที่ท่านเพิ่งเล่าเป็นทางเข้า)",
            bullets: [
              "คำถามต่อยอด: อะไรทำให้อาจารย์เลือกใช้วิธีนี้ในเวลานั้น?",
              "คำถามต่อยอด: อะไรทำให้คิดว่าผลลัพธ์ออกมาแบบที่เห็น?",
              "What if? ครั้งที่ 1 (Single Loop — ภายใต้เป้าหมายเดิม): ถ้าย้อนกลับไปได้โดยยังมีเป้าหมายเดิม อาจารย์จะลองทำอะไรต่างไปบ้างครับ?",
              "หากผลยังไม่ชัด ให้ถามว่าตอนนั้นสังเกตเห็นสัญญาณอะไร และยังอยากรู้อะไรเพิ่ม"
            ],
            refs: [
              { label: "Argyris (1977) • Single & Double-Loop Learning", url: "https://hbr.org/1977/09/double-loop-learning-in-organizations" },
              { label: "IHI • 5 Whys ในบริบทการปรับปรุงคุณภาพ", url: "https://www.ihi.org/library/tools/5-whys-finding-root-cause" }
            ]
          }
        },
        {
          id: "g-s08",
          num: "09",
          navLabel: "09 · คำถาม 3/5",
          type: "prompt",
          qStep: 3,
          bg: "bg_03_border_anthropology.jpg",
          kb: "kb-d",
          orbs: ["rgba(16,185,129,0.28)", "rgba(245,158,11,0.22)", "rgba(56,189,248,0.2)"],
          kicker: "คำถาม 3 จาก 5 · นาทีที่ 43–57",
          kickerSub: "โจทย์เดิมในสายตาคนอื่น (Reframing Assumptions · Double Loop)",
          title: "“ถ้ามองเหตุการณ์เดิมจากมุมของคนอีกคน โจทย์ที่เราเห็นจะเปลี่ยนไปไหมครับ?”",
          logline: "ก้าวออกจากกรอบคิดของแพทย์ผู้รักษา ไปฟังเสียงของผู้ป่วย ครอบครัว เพื่อนร่วมทีม ชุมชน หรือผู้กำหนดนโยบาย",
          moderatorNotes: {
            lead: "ลำดับเปิด: เริ่มที่ นพ.วิรุฬ → ชวนอีกสองท่านกลับไปสำรวจเรื่องของตนเอง",
            bullets: [
              "ขอให้วิทยากรระบุว่า ‘คนอีกคนนั้น’ คือใคร (เช่น ผู้ป่วย ครอบครัว พยาบาล/ทีม ชาวบ้าน หรือฝ่ายนโยบาย)",
              "คำถามต่อยอด: อะไรทำให้โจทย์เดิมดูสมเหตุสมผลในสายตาเราตอนนั้น?",
              "คำถามต่อยอด (Double Loop): มีเสียงหรือข้อมูลอะไรที่ทำให้อาจารย์เริ่มตั้งคำถามกับ ‘เป้าหมายเดิม’ หรือเกณฑ์ตัดสินความสำเร็จเดิม?",
              "คำถามต่อยอด: ถ้าต้องตั้งชื่อโจทย์นี้ใหม่ อาจารย์จะเรียกปัญหานี้ว่าอะไรครับ?"
            ],
            refs: [
              { label: "Argyris (1977) • Double-Loop Learning in Organizations", url: "https://hbr.org/1977/09/double-loop-learning-in-organizations" },
              { label: "University of Edinburgh • What? So what? Now what?", url: "https://reflection.ed.ac.uk/reflectors-toolkit/reflecting-on-experience/what-so-what-now-what" }
            ]
          }
        },
        {
          id: "g-s09",
          num: "10",
          navLabel: "10 · คำถาม 4/5",
          type: "prompt",
          qStep: 4,
          bg: "bg_07_lantern_purpose.jpg",
          kb: "kb-a",
          orbs: ["rgba(245,158,11,0.3)", "rgba(99,102,241,0.25)", "rgba(14,165,233,0.2)"],
          kicker: "คำถาม 4 จาก 5 · นาทีที่ 57–71",
          kickerSub: "ความหมายของบทบาทแพทย์ (Identity & Purpose · Triple Loop)",
          title: "“เมื่อย้อนมองเรื่องนี้ วันนี้อาจารย์เข้าใจว่าแพทย์ทำงานเพื่อใครและเพื่ออะไรครับ?”",
          logline: "ทบทวนคุณค่ารากฐาน อัตลักษณ์วิชาชีพ และขอบเขตความรับผิดชอบของแพทย์เมื่อปัญหาสุขภาพเชื่อมโยงทั้งสังคมและโลก",
          moderatorNotes: {
            lead: "ลำดับเปิด: เริ่มที่ นพ.ทักษพล (หยิบคำจากข้อ 3 มาสะท้อนกลับ) → เชิญอีกสองท่านนิยามบทบาทแพทย์ในภาษาของตนเอง",
            bullets: [
              "คำถามต่อยอด (Triple Loop): ประสบการณ์หรือคุณค่าอะไรที่หล่อหลอมความเข้าใจนี้ครับ?",
              "คำถามต่อยอด: วิธีที่ทีมสุขภาพ ‘ฟัง’ หรือ ‘เรียนรู้’ ควรเปลี่ยนไปอย่างไร เพื่อให้มองเห็นสิ่งที่เคยมองข้าม?",
              "คำถามต่อยอด: เมื่อปัญหากว้างกว่าคนไข้หนึ่งราย ใครควรมีส่วนร่วมกำหนดโจทย์และตัดสินใจ และความรับผิดชอบของแพทย์ขยายไปถึงใคร?"
            ],
            refs: [
              { label: "Peschl (2007) • Triple-loop learning", url: "https://constructivist.info/2/2-3/136" },
              { label: "Tosey และคณะ (2012) • ทบทวนแนวคิด Triple Loop", url: "https://doi.org/10.1177/1350507611426239" },
              { label: "AMEE • Planetary health & sustainable healthcare education", url: "https://pubmed.ncbi.nlm.nih.gov/33602043/" }
            ]
          }
        },
        {
          id: "g-s10",
          num: "11",
          navLabel: "11 · คำถาม 5/5",
          type: "prompt",
          qStep: 5,
          bg: "bg_01_bedside_horizon.jpg",
          kb: "kb-b",
          orbs: ["rgba(56,189,248,0.28)", "rgba(16,185,129,0.24)", "rgba(245,158,11,0.22)"],
          kicker: "คำถาม 5 จาก 5 · นาทีที่ 71–85",
          kickerSub: "ก้าวแรกของนักศึกษาแพทย์ (Now What? · Systems-Based Practice)",
          title: "“ถ้าเจอเรื่องคล้ายกัน นักศึกษาแพทย์จะลองทำอะไรเป็นก้าวแรก และควรเรียนรู้จากใครครับ?”",
          logline: "แปลงมุมมองเชิงระบบให้เป็นก้าวเล็ก ๆ ที่นักศึกษาแพทย์ชั้นปีที่ 3 ลองฝึกได้จริง ทั้งในวอร์ด ชุมชน และพื้นที่ภาคสนาม 9 แห่ง",
          moderatorNotes: {
            lead: "ลำดับเปิด: เริ่มที่ ศ.เกียรติคุณ พญ.สุวรรณา → ให้ทั้งสามท่านฝากคนละหนึ่งก้าวที่ นศพ.ปี 3 ลองทำได้จริงภายใต้การดูแลของทีม",
            bullets: [
              "What if? ครั้งที่ 2 + Now what?: ถ้าเงื่อนไขในสถานการณ์ใหม่ต่างไป บทเรียนอะไรยังใช้ได้และต้องปรับอะไร?",
              "คำถามต่อยอด: นักศึกษาควรสังเกตอะไร หรือขอความเห็นจากใคร เพื่อรู้ว่าควรทำต่อหรือทบทวน?",
              "หากคำตอบยังกว้าง ขอให้ท่านยกตัวอย่างสิ่งที่จะลองในคลินิก ชุมชน หรืองานระบบอย่างน้อย 1 อย่าง แล้วส่งไมค์เข้าช่วง Q&A ที่นาที 85"
            ],
            refs: [
              { label: "AMA • Health Systems Science", url: "https://www.ama-assn.org/education/changemeded-initiative/give-your-medical-students-head-start-health-systems-science" }
            ]
          }
        },
        {
          id: "g-s11",
          num: "12",
          navLabel: "12 · Q&A 60 นาที",
          type: "qa",
          bg: "bg_08_dialogue_constellation.jpg",
          kb: "kb-c",
          orbs: ["rgba(245,158,11,0.26)", "rgba(56,189,248,0.24)", "rgba(139,92,246,0.22)"],
          kicker: "นาทีที่ 85–145 · 60 นาทีเต็ม · OPEN FLOOR DIALOGUE",
          kickerSub: "ช่วงแลกเปลี่ยนและตั้งคำถามจากนักศึกษาแพทย์ชั้นปีที่ 3",
          title: "“เรื่องไหนที่คุณอยากชวนอาจารย์คิดต่อจากสิ่งที่เพิ่งได้ฟัง?”",
          logline: "ถามต่อยอดจากเรื่องเล่าที่ได้ฟัง หรือเชื่อมกับคำถามที่คุณกำลังค้นหาความหมายด้วยตนเอง",
          moderatorNotes: {
            lead: "กันเวลานาทีที่ 85–145 เต็ม 60 นาทีสำหรับนักศึกษา เปิดไมค์ทันทีเมื่อมีคนพร้อม หรือให้เวลาจดคำถาม 1–2 นาทีแล้วชวนเริ่ม",
            bullets: [
              "จังหวะแนะนำ: 5 นาทีเปิดรับคำถามชุดแรก · 20 นาทีคำถามจากเรื่องเล่า · 20 นาทีเชื่อมกรอบคิด/ทีม/ระบบ · 15 นาทีคำถามที่อยากฟังวิทยากรต่อยอดกัน",
              "ให้นักศึกษาถามกระชับ ~45–60 วินาที · ผู้ถูกถามตอบก่อน ~2 นาที แล้วเชิญอีกท่านเมื่อมีมุมต่าง",
              "ถ้าห้องเงียบ ใช้คำชวนสั้น ๆ: ‘คำตอบไหนเมื่อสักครู่ทำให้เราอยากถามว่า เพราะอะไร ต่ออีกครั้ง?’",
              "เคล็ดลับจอห้อง 2C2-03: สามารถกดปุ่ม ‘🌊 หมุนภาพ Q&A Loop’ เพื่อให้จอฉายทวนคำถาม 1–5 สลับกับหน้า Q&A แบบ Screensaver ช้า ๆ ได้"
            ],
            refs: []
          }
        },
        {
          id: "g-s12",
          num: "13",
          navLabel: "13 · สะท้อนคิดปิดวง",
          type: "reflection",
          bg: "bg_07_lantern_purpose.jpg",
          kb: "kb-d",
          orbs: ["rgba(251,191,36,0.28)", "rgba(56,189,248,0.22)", "rgba(16,185,129,0.22)"],
          kicker: "นาทีที่ 145–150 · สะท้อนคิดและปิดวง",
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
          num: "14",
          navLabel: "14 · หลักฐานประวัติ",
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
                { label: "HITAP • ประวัติผู้ร่วมวิจัย (2567), น. 88–89", url: "https://www.hitap.net/wp-content/uploads/2024/06/FINAL-HSRI-proposal_KRT-policy-TH_13Mar24-1.pdf" },
                { label: "Harvard Gazette • บทสัมภาษณ์ นพ.วิรุฬ (2561)", url: "https://news.harvard.edu/gazette/story/2018/05/doctor-gets-a-doctorate-and-takes-it-home-to-thailand/" },
                { label: "Harvard DASH • วิทยานิพนธ์วัณโรคชายแดน (2561)", url: "https://dash.harvard.edu/entities/publication/dd0c41a2-e964-4bdc-a8d4-5e0c376fbefb" },
                { label: "สช. • รายงานสถานการณ์ระบบสุขภาพไทย (2569)", url: "https://www.nationalhealth.or.th/storage/ebooks_attach/NHSIR_2026.pdf" }
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
          num: "15",
          navLabel: "15 · กรอบสะท้อนคิด",
          type: "sources",
          bg: "bg_06_ripples_perspective.jpg",
          kb: "kb-b",
          orbs: ["rgba(139,92,246,0.25)", "rgba(56,189,248,0.22)", "rgba(245,158,11,0.18)"],
          kicker: "ภาคผนวก 2 · กดที่ชื่อแหล่งเพื่อเปิดเอกสารต้นฉบับ",
          kickerSub: "รากฐานแนวคิดที่ใช้ในการออกแบบลำดับคำถามของเวทีเสวนา",
          title: "กรอบสะท้อนคิดและแหล่งเอกสารประกอบ",
          columns: [
            {
              heading: "การสะท้อนคิด (Reflective Practice)",
              items: [
                { label: "Borton (1970) • Reach, Touch and Teach", url: "https://archive.org/details/reachtouchteachs0000bort" },
                { label: "University of Edinburgh • What? So what? Now what?", url: "https://reflection.ed.ac.uk/reflectors-toolkit/reflecting-on-experience/what-so-what-now-what" },
                { label: "IHI • 5 Whys ในบริบทการปรับปรุงคุณภาพ", url: "https://www.ihi.org/library/tools/5-whys-finding-root-cause" }
              ]
            },
            {
              heading: "การเรียนรู้หลายระดับ (Multi-Loop Learning)",
              items: [
                { label: "Argyris (1977) • Single และ Double-Loop Learning", url: "https://hbr.org/1977/09/double-loop-learning-in-organizations" },
                { label: "Peschl (2007) • Triple-Loop Learning", url: "https://constructivist.info/2/2-3/136" },
                { label: "Tosey และคณะ (2012) • นิยาม Triple Loop ในวรรณกรรม", url: "https://doi.org/10.1177/1350507611426239" }
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
    },

    /* ---------- Reusable Ambient Screensaver Decks for Remaining 3 Panel Sessions ---------- */
    "w3-d3-dhs-panel": {
      id: "w3-d3-dhs-panel",
      hashSlug: "panel-dhs",
      code: "PANEL-DHS",
      seriesTag: "RACM 303 PANEL SERIES · EPISODE 02",
      shortTitle: "PANEL-DHS · ระบบสุขภาพอำเภอ 6BB+1 (9 ธ.ค. 69)",
      sessionMeta: "วันพุธที่ 9 ธันวาคม 2569 · 09.00 – 12.00 น. · ห้อง 2C2-02..03",
      sessionLimitMin: 180,
      pptxHref: "",
      slides: [
        {
          id: "dhs-01",
          num: "01",
          navLabel: "01 · เปิดเวที DHS",
          type: "cover",
          bg: "bg_02_nahwa_to_world.jpg",
          kb: "kb-a",
          orbs: ["rgba(16,185,129,0.28)", "rgba(245,158,11,0.22)", "rgba(56,189,248,0.2)"],
          kicker: "RACM 303 · พุธ 9 ธ.ค. 2569 · 09.00–12.00 น. · ก่อนเดินทางออกภาคสนาม",
          kickerSub: "Learning How to Learn & Experiential Fieldwork Compass",
          title: "District Health Systems – Six Building Blocks Plus One",
          subtitle: "ฝึกทักษะการฟังอย่างลึกซึ้งและท่าทีการเรียนรู้ร่วมกับชุมชนและระบบสุขภาพอำเภอ ก่อนลงพื้นที่จริงทั้ง 9 แห่ง",
          cast: [
            { initials: "สก", name: "รศ. นพ.สุรเกียรติ อาชานานุภาพ", role: "วิทยากรหลัก · ระบบสุขภาพอำเภอและการเรียนรู้จากการปฏิบัติจริง" }
          ]
        },
        {
          id: "dhs-02",
          num: "02",
          navLabel: "02 · คำถามชวนคิด 1",
          type: "prompt",
          qStep: 1,
          totalSteps: 2,
          bg: "bg_03_border_anthropology.jpg",
          kb: "kb-b",
          orbs: ["rgba(16,185,129,0.28)", "rgba(56,189,248,0.22)", "rgba(245,158,11,0.18)"],
          kicker: "คำถามชวนคิดก่อนลงภาคสนาม · ข้อ 1 จาก 2",
          kickerSub: "Learning with Community vs. Extracting Data",
          title: "“ท่าทีของการ ‘ไปเรียนรู้ร่วมกับชุมชน’ แตกต่างจากการ ‘ไปเก็บข้อมูลจากชุมชน’ อย่างไร?”",
          logline: "สำรวจผลของท่าทีความอ่อนน้อมและการรับฟังอย่างไม่ด่วนตัดสิน ต่อความลึกซึ้งของสิ่งที่ทีมจะค้นพบในพื้นที่จริง"
        },
        {
          id: "dhs-03",
          num: "03",
          navLabel: "03 · คำถามชวนคิด 2",
          type: "prompt",
          qStep: 2,
          totalSteps: 2,
          bg: "bg_06_ripples_perspective.jpg",
          kb: "kb-c",
          orbs: ["rgba(56,189,248,0.26)", "rgba(251,191,36,0.22)", "rgba(16,185,129,0.2)"],
          kicker: "คำถามชวนคิดก่อนลงภาคสนาม · ข้อ 2 จาก 2",
          kickerSub: "After Action Review & Collective Reflection",
          title: "“ทีมของเราจะใช้กระบวนการทบทวนหลังปฏิบัติงานร่วมกันอย่างไรตลอด 8–10 วันในพื้นที่?”",
          logline: "เชื่อมโยงประสบการณ์ตรงรายวันสู่ภาพรวมของระบบสุขภาพอำเภอและศักยภาพของชุมชน"
        }
      ]
    },

    "w5-d3-panel-homeless": {
      id: "w5-d3-panel-homeless",
      hashSlug: "panel-6bb",
      code: "PANEL-6BB",
      seriesTag: "RACM 303 PANEL SERIES · EPISODE 03",
      shortTitle: "PANEL-6BB · สุขภาวะข้างถนน & ความเป็นธรรม (23 ธ.ค. 69)",
      sessionMeta: "วันพุธที่ 23 ธันวาคม 2569 · 09.00 – 12.00 น. · ห้อง 2C2-03",
      sessionLimitMin: 180,
      pptxHref: "",
      slides: [
        {
          id: "hb-01",
          num: "01",
          navLabel: "01 · เปิดเวที 6BB",
          type: "cover",
          bg: "bg_04_youth_city_canopy.jpg",
          kb: "kb-a",
          orbs: ["rgba(245,158,11,0.28)", "rgba(239,68,68,0.2)", "rgba(56,189,248,0.22)"],
          kicker: "RACM 303 · พุธ 23 ธ.ค. 2569 · 09.00–12.00 น. · ห้อง 2C2-03",
          kickerSub: "Connecting the Six Building Blocks for Health Equity",
          title: "เมื่อระบบสุขภาพไม่ได้แยกส่วน: บทเรียนจาก “สุขภาวะข้างถนน”",
          subtitle: "การเชื่อมโยง 6 องค์ประกอบของระบบสุขภาพและการจัดบริการปฐมภูมิเชิงรุก เพื่อสร้างความเป็นธรรมแก่ชุมชนคนไร้บ้าน",
          cast: [
            { initials: "ภท", name: "นพ.ภูริทัต แสงทองพานิชกุล", role: "ผู้อำนวยการโรงพยาบาลราชพิพัฒน์" },
            { initials: "อน", name: "นพ.อานนท์ กุลธรรมานุสรณ์", role: "นักวิจัยระบบสุขภาพ" },
            { initials: "อฆ", name: "อ.อนรรฆ พิทักษ์ธานิน", role: "นักวิชาการด้านเมืองและคนไร้บ้าน" },
            { initials: "ยพ", name: "รศ. ภญ. ดร.ยุพดี ศิริสินสุข", role: "รองเลขาธิการ สปสช." },
            { initials: "ณว", photo: "assets/photos/advisor_nuttawut.jpg", name: "อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์", role: "ผู้ดำเนินการอภิปราย" }
          ]
        },
        {
          id: "hb-02",
          num: "02",
          navLabel: "02 · คำถามหลัก 1",
          type: "prompt",
          qStep: 1,
          totalSteps: 2,
          bg: "bg_05_compass_crossroads.jpg",
          kb: "kb-b",
          orbs: ["rgba(245,158,11,0.28)", "rgba(56,189,248,0.22)", "rgba(99,102,241,0.22)"],
          kicker: "คำถามหลักประจำเวที · ข้อ 1 จาก 2",
          kickerSub: "Structural Barriers & Disconnected Building Blocks",
          title: "“อุปสรรคด้านสิทธิ บัตรประชาชน ที่อยู่อาศัย และอคติทางสังคม ทำให้ 6 องค์ประกอบของระบบสุขภาพขาดการเชื่อมต่อกันตรงจุดใด?”",
          logline: "วิเคราะห์รอยต่อที่ทำให้กลุ่มเปราะบางหลุดออกจากระบบบริการตั้งรับแบบดั้งเดิม"
        },
        {
          id: "hb-03",
          num: "03",
          navLabel: "03 · คำถามหลัก 2",
          type: "prompt",
          qStep: 2,
          totalSteps: 2,
          bg: "bg_08_dialogue_constellation.jpg",
          kb: "kb-c",
          orbs: ["rgba(16,185,129,0.26)", "rgba(245,158,11,0.24)", "rgba(56,189,248,0.2)"],
          kicker: "คำถามหลักประจำเวที · ข้อ 2 จาก 2",
          kickerSub: "Proactive Primary Health Care & Co-Creation",
          title: "“บทเรียนเชิงรุกจาก ‘สุขภาวะข้างถนน’ ช่วยชี้แนวทางออกแบบระบบบริการปฐมภูมิเพื่อลดความเหลื่อมล้ำในพื้นที่ของเราได้อย่างไร?”",
          logline: "เชื่อมบทเรียนการทำงานข้ามภาคส่วนเข้ากับการสังเคราะห์ข้อเสนอแนะภาคสนาม (ฟอร์ม 3A)"
        }
      ]
    },

    "w5-d4-policy": {
      id: "w5-d4-policy",
      hashSlug: "panel-policy",
      code: "PANEL-HP",
      seriesTag: "RACM 303 PANEL SERIES · EPISODE 04",
      shortTitle: "PANEL-HP · Young-Gen & นโยบายสร้างเสริมสุขภาพ (24 ธ.ค. 69)",
      sessionMeta: "วันพฤหัสบดีที่ 24 ธันวาคม 2569 · 13.00 – 16.30 น. · ห้อง 2C2-03",
      sessionLimitMin: 210,
      pptxHref: "",
      slides: [
        {
          id: "hp-01",
          num: "01",
          navLabel: "01 · เปิดเวทีนโยบาย",
          type: "cover",
          bg: "bg_05_compass_crossroads.jpg",
          kb: "kb-a",
          orbs: ["rgba(56,189,248,0.28)", "rgba(168,85,247,0.24)", "rgba(245,158,11,0.2)"],
          kicker: "RACM 303 · พฤหัสบดี 24 ธ.ค. 2569 · 13.00–16.30 น. · ห้อง 2C2-03",
          kickerSub: "Integrated Health Promotion & Political Economy of Health Policy",
          title: "Young-Gen Systems-based Practitioner",
          subtitle: "การขับเคลื่อนข้อเสนอเชิงนโยบายและการสร้างเสริมสุขภาพเชิงบูรณาการภายใต้บริบทเศรษฐศาสตร์การเมือง",
          cast: [
            { initials: "พท", name: "นพ.พงศ์เทพ วงศ์วัชรไพบูลย์", role: "ผู้จัดการกองทุนสนับสนุนการสร้างเสริมสุขภาพ (สสส.)" },
            { initials: "กต", name: "นพ.กติกา อรรฆศิลป์", role: "หัวหน้าฝ่ายการผสานข้อมูลและประเมินโครงการส่งเสริมสุขภาพ" },
            { initials: "ฐต", name: "นพ.ฐิติกร โตโพธิ์ไทย", role: "กองกิจกรรมทางกายเพื่อสุขภาพ กรมอนามัย" },
            { initials: "ณว", photo: "assets/photos/advisor_nuttawut.jpg", name: "อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์", role: "ผู้ดำเนินการอภิปราย" }
          ]
        },
        {
          id: "hp-02",
          num: "02",
          navLabel: "02 · คำถามหลัก 1",
          type: "prompt",
          qStep: 1,
          totalSteps: 2,
          bg: "bg_04_youth_city_canopy.jpg",
          kb: "kb-b",
          orbs: ["rgba(56,189,248,0.26)", "rgba(16,185,129,0.24)", "rgba(245,158,11,0.2)"],
          kicker: "คำถามหลักประจำเวที · ข้อ 1 จาก 2",
          kickerSub: "Beyond Health Education → Data, Environment & Public Policy",
          title: "“เหตุใดการรณรงค์ให้ความรู้เพียงอย่างเดียวจึงไม่พอ และข้อมูล สิ่งแวดล้อม กับนโยบายสาธารณะเข้ามาเสริมพลังอย่างไร?”",
          logline: "ถอดกลไก Ottawa Charter และ COM-B สู่การออกแบบมาตรการระดับประชากรที่ได้ผลจริง"
        },
        {
          id: "hp-03",
          num: "03",
          navLabel: "03 · คำถามหลัก 2",
          type: "prompt",
          qStep: 2,
          totalSteps: 2,
          bg: "bg_07_lantern_purpose.jpg",
          kb: "kb-c",
          orbs: ["rgba(245,158,11,0.28)", "rgba(168,85,247,0.24)", "rgba(56,189,248,0.2)"],
          kicker: "คำถามหลักประจำเวที · ข้อ 2 จาก 2",
          kickerSub: "Translating Fieldwork Insights into System Proposals",
          title: "“กลุ่มของเราจะนำบทเรียนการผสานข้อมูลและการขับเคลื่อนนโยบายไปยกระดับข้อเสนอแนะของพื้นที่ภาคสนามได้อย่างไร?”",
          logline: "เตรียมความพร้อมสู่การนำเสนอระบบสุขภาพภาคสนาม (ฟอร์ม 3A) และการสะท้อนคิด SRN 2"
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
    backdropMode: localStorage.getItem("racm303_psv_backdrop") === "aurora" ? "aurora" : "cinema",
    ambientCycle: false,
    qaLoopOnly: false,
    idleClean: false,
    showQrOnCover: true,
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
      if (Array.isArray(sl.milestones)) {
        sl.milestones.forEach((m) => preloadImageOnce(m && m.bg));
      }
    });
  }

  /* ---------- Live Sync (BroadcastChannel + MQTT) ---------- */
  let bc = null;
  let mqttClient = null;

  function initLiveSync() {
    if (typeof BroadcastChannel !== "undefined" && !bc) {
      try {
        bc = new BroadcastChannel(SYNC_BC_NAME);
        bc.onmessage = (ev) => handleIncomingSync(ev.data);
      } catch (_) {}
    }
    if (window.mqtt && !mqttClient) {
      try {
        mqttClient = window.mqtt.connect("wss://broker.emqx.io:8084/mqtt", {
          clientId: "racm_psv_" + Math.random().toString(36).slice(2, 10),
          clean: true,
          reconnectPeriod: 5000
        });
        mqttClient.on("connect", () => {
          try {
            mqttClient.subscribe(MQTT_TOPIC);
          } catch (_) {}
        });
        mqttClient.on("message", (_topic, payload) => {
          try {
            handleIncomingSync(JSON.parse(payload.toString()));
          } catch (_) {}
        });
      } catch (_) {}
    }
  }

  function broadcastHostState() {
    if (ROLE !== "faculty" || !state.isOpen) return;
    const msg = {
      senderRole: "faculty",
      deckId: state.deckId,
      slideIdx: state.slideIdx,
      stationIdx: state.stationIdx,
      backdropMode: state.backdropMode,
      ts: Date.now()
    };
    if (bc) {
      try { bc.postMessage(msg); } catch (_) {}
    }
    if (mqttClient && mqttClient.connected) {
      try { mqttClient.publish(MQTT_TOPIC, JSON.stringify(msg)); } catch (_) {}
    }
  }

  function handleIncomingSync(msg) {
    if (!msg || msg.senderRole !== "faculty") return;
    if (!state.isOpen || ROLE === "faculty" || !state.followHost) return;
    let changed = false;
    if (msg.deckId && PANEL_DECKS[msg.deckId] && msg.deckId !== state.deckId) {
      state.deckId = msg.deckId;
      state.stationIdx = 0;
      changed = true;
    }
    const deck = getCurrentDeck();
    if (typeof msg.slideIdx === "number" && msg.slideIdx >= 0 && msg.slideIdx < deck.slides.length && msg.slideIdx !== state.slideIdx) {
      state.slideIdx = msg.slideIdx;
      state.stationIdx = 0;
      changed = true;
    }
    if (typeof msg.stationIdx === "number" && msg.stationIdx >= 0 && msg.stationIdx !== state.stationIdx) {
      state.stationIdx = msg.stationIdx;
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
    if (state.modDrawerOpen || state.stuDrawerOpen || state.qrLightboxOpen) return;
    state.idleTimer = setTimeout(() => {
      if (!state.isOpen || state.modDrawerOpen || state.stuDrawerOpen || state.qrLightboxOpen) return;
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
    const curSlide = getCurrentSlide();
    const isTimeline = curSlide && curSlide.type === "timeline" && Array.isArray(curSlide.milestones) && curSlide.milestones.length > 1;
    const tickMs = isTimeline ? STATION_CYCLE_MS : AMBIENT_CYCLE_MS;
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
      const sl = getCurrentSlide();
      if (!state.qaLoopOnly && sl && sl.type === "timeline" && Array.isArray(sl.milestones) && state.stationIdx < sl.milestones.length - 1) {
        state.stationIdx += 1;
        updateStageView();
        return;
      }
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

  /* ---------- Bidirectional Auto-Fit + A-/A+ Font Scale ---------- */
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

  function fitCurrentSlideBody() {
    const modal = document.getElementById("panelDeckModal");
    const viewport = document.getElementById("psvStageViewport");
    const body = document.getElementById("psvSlideBody");
    if (!modal || modal.hidden || !viewport || !body) return;

    if (window.innerWidth <= 720) {
      modal.style.setProperty("--psv-fit-scale", "1");
      return;
    }

    const availH = viewport.clientHeight - 28;
    const availW = viewport.clientWidth - 48;
    if (availH < 120 || availW < 200) return;

    body.setAttribute("data-measuring", "1");
    let lo = 0.52;
    let hi = 1.24;
    for (let i = 0; i < 12; i += 1) {
      const mid = (lo + hi) * 0.5;
      modal.style.setProperty("--psv-fit-scale", mid.toFixed(4));
      const fits = body.scrollHeight <= availH && body.scrollWidth <= availW;
      if (fits) lo = mid;
      else hi = mid;
    }
    const safeScale = Math.max(0.52, Math.min(1.22, lo * 0.96));
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

  /* ---------- Crossfade Backdrop & Speaker Die-Cut Updater ---------- */
  function getActiveStationMilestone(slide) {
    if (!slide || slide.type !== "timeline" || !Array.isArray(slide.milestones) || !slide.milestones.length) {
      return null;
    }
    const idx = Math.max(0, Math.min(slide.milestones.length - 1, state.stationIdx || 0));
    return slide.milestones[idx] || slide.milestones[0];
  }

  function updateBackdropForSlide(slide) {
    const modal = document.getElementById("panelDeckModal");
    if (!modal || !slide) return;
    modal.setAttribute("data-backdrop", state.backdropMode);

    const activeMs = getActiveStationMilestone(slide);
    const orbs = (activeMs && activeMs.orbs) || slide.orbs;
    if (orbs && orbs.length === 3) {
      modal.style.setProperty("--psv-orb-1", orbs[0]);
      modal.style.setProperty("--psv-orb-2", orbs[1]);
      modal.style.setProperty("--psv-orb-3", orbs[2]);
    }

    const bgFile = (activeMs && activeMs.bg) || slide.bg || "bg_01_bedside_horizon.jpg";
    const kbCls = (activeMs && activeMs.kb) || slide.kb || "kb-a";
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
    if (dicutStage && dicutImgEl) {
      if (slide.dicutImg) {
        const dicutUrl = `${IMG_DIR}/${slide.dicutImg}?v=${ASSET_VER}`;
        dicutStage.hidden = false;
        if (state.currentDicutUrl !== dicutUrl) {
          state.currentDicutUrl = dicutUrl;
          dicutImgEl.src = dicutUrl;
          dicutImgEl.alt = slide.title || "วิทยากร";
          dicutImgEl.style.animation = "none";
          void dicutImgEl.offsetWidth;
          dicutImgEl.style.animation = "";
        }
        const stShift = Math.max(0, state.stationIdx || 0) * -4;
        dicutStage.style.transform = `translate3d(${stShift}px, 0, 0)`;
      } else {
        dicutStage.hidden = true;
        state.currentDicutUrl = "";
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

  function renderSlideInnerHtml(deck, slide) {
    const qrJoinUrl = `${PROD_STUDENT_BASE}#${deck.hashSlug}`;

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

      const qrHtml = state.showQrOnCover
        ? `
          <div class="psv-qr-plaque" data-psv-act="open-qr-modal" title="คลิกเพื่อขยาย QR Code ขนาดใหญ่สำหรับสแกนเข้าคาบเสวนา">
            <div class="psv-qr-box">${buildQrSvg(qrJoinUrl)}</div>
            <div class="psv-qr-caption">📱 สแกนเปิดสไลด์คู่ขนาน<br/><span style="opacity:0.75;font-weight:500">#${esc(deck.hashSlug)}</span></div>
          </div>
        `
        : "";

      const titleCls = slide.bilingualCover ? "psv-hero-title is-bilingual-cover" : "psv-hero-title";
      return `
        <div class="psv-cover-split">
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
          ${qrHtml}
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
      const curStIdx = Math.max(0, Math.min(totalSt - 1, state.stationIdx || 0));
      const curSt = milestones[curStIdx] || milestones[0] || {};
      const nextSt = curStIdx < totalSt - 1 ? milestones[curStIdx + 1] : null;
      const railPct = totalSt > 1 ? ((curStIdx / (totalSt - 1)) * 100).toFixed(2) : "100";

      const stopsHtml = milestones
        .map((m, i) => {
          const stStateCls = i < curStIdx ? " is-passed" : i === curStIdx ? " is-active" : " is-upcoming";
          const dotInner = i < curStIdx ? "✓" : String(i + 1);
          const stopShort = m.shortStop || m.year;
          return `
            <button type="button" class="psv-rail-stop${stStateCls}" data-psv-station="${i}" title="คลิกเพื่อไปยังสถานีที่ ${i + 1}: ${esc(m.headline || m.text)}">
              <span class="psv-rail-stop-yr">${esc(m.year)}</span>
              <span class="psv-rail-stop-dot">${esc(dotInner)}</span>
              <span class="psv-rail-stop-lbl">${esc(stopShort)}</span>
            </button>
          `;
        })
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

      const deskTitleHtml = slide.dicutImg
        ? `
          <div class="psv-desk-spk-head" style="display:flex;flex-direction:column;gap:calc(4px * var(--psv-eff-scale))">
            <h2 class="psv-hero-title is-compact-title">${esc(slide.title)}</h2>
            ${slide.roleSubtitle ? `<p class="psv-spk-role-sub">${esc(slide.roleSubtitle)}</p>` : ""}
          </div>
        `
        : `<h2 class="psv-hero-title is-compact-title">${esc(slide.title)}</h2>`;

      const hintTxt = nextSt
        ? `🖱️ Clicker / ปุ่ม → สถานีถัดไป (${curStIdx + 2}/${totalSt}): ${nextSt.shortStop || nextSt.year}`
        : "✨ ถึงสถานีปัจจุบันแล้ว · กด → อีกครั้งเพื่อไปสไลด์ถัดไป";

      return `
        <div class="psv-kicker-row">
          <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)} · สถานี ${curStIdx + 1}/${totalSt}</span>
          ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
        </div>
        ${mobDicutHtml}
        ${deskTitleHtml}
        <div class="psv-rail-map" style="--psv-station-count:${totalSt};--psv-rail-pct:${railPct}%">
          <div class="psv-rail-nodes">
            <div class="psv-rail-track-line" aria-hidden="true">
              <div class="psv-rail-track-fill"></div>
            </div>
            ${stopsHtml}
          </div>
        </div>
        <article class="psv-station-spotlight">
          <div class="psv-station-top">
            <div class="psv-station-badges">
              <span class="psv-station-pill">🚉 สถานี ${curStIdx + 1} / ${totalSt} · พ.ศ. ${esc(curSt.year || "")}</span>
              ${curSt.roleTag ? `<span class="psv-station-role-tag">${esc(curSt.roleTag)}</span>` : ""}
            </div>
            ${curSt.sceneLabel ? `<span class="psv-station-scene-loc">${esc(curSt.sceneLabel)}</span>` : ""}
          </div>
          ${curSt.headline ? `<h3 class="psv-station-headline">${esc(curSt.headline)}</h3>` : ""}
          <p class="psv-station-body">${esc(curSt.text || "")}</p>
          <div class="psv-station-clicker-bar">
            <span class="psv-station-hint">${esc(hintTxt)}</span>
            <div class="psv-station-btns">
              <button type="button" class="psv-st-btn" data-psv-act="station-prev"${curStIdx === 0 ? " disabled" : ""}>◀ สถานีก่อน</button>
              <button type="button" class="psv-st-btn is-primary-next" data-psv-act="next">${nextSt ? "สถานีถัดไป ▶" : "สไลด์ถัดไป ▶"}</button>
              ${nextSt ? `<button type="button" class="psv-st-btn" data-psv-act="skip-slide" title="ข้ามสถานีที่เหลือไปยังสไลด์ถัดไป">⏭ ข้ามสไลด์</button>` : ""}
            </div>
          </div>
        </article>
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

    if (slide.type === "prompt") {
      const total = slide.totalSteps || 5;
      const cur = slide.qStep || 1;
      let pips = "";
      for (let i = 1; i <= total; i += 1) {
        const cls = i === cur ? " is-current" : i < cur ? " is-done" : "";
        pips += `<span class="psv-q-pip${cls}"></span>`;
      }
      return `
        <div class="psv-kicker-row">
          <span class="psv-kicker-badge"><span class="psv-k-bar"></span>${esc(slide.kicker)}</span>
          ${slide.kickerSub ? `<span class="psv-kicker-sub">${esc(slide.kickerSub)}</span>` : ""}
        </div>
        <div class="psv-q-progress" aria-hidden="true">${pips}</div>
        <h2 class="psv-hero-title is-prompt-quote">${esc(slide.title)}</h2>
        ${slide.logline ? `<p class="psv-logline">${esc(slide.logline)}</p>` : ""}
      `;
    }

    if (slide.type === "qa") {
      const savedQ = getSavedStudentNote(`${deck.id}_qa`);
      const qaActionHtml =
        ROLE === "faculty" && deck.qaLoopRange
          ? `
            <div style="margin-top:4px">
              <button type="button" class="psv-pill-btn${state.qaLoopOnly && state.ambientCycle ? " is-ambient-on" : ""}" data-psv-act="toggle-qa-loop">
                ${state.qaLoopOnly && state.ambientCycle ? "⏸ หยุดหมุนทวนคำถาม 1–5" : "🌊 หมุนภาพ & ทวนคำถาม 1–5 ช้าๆ ระหว่างช่วง Q&A"}
              </button>
            </div>
          `
          : ROLE === "student"
          ? `
            <div class="psv-student-pad">
              <div style="font-size:12px;font-weight:700;color:#7dd3fc;margin-bottom:6px">💬 สมุดทดประเด็นคำถามส่วนตัวของคุณ (บันทึกอัตโนมัติในเครื่อง)</div>
              <div class="psv-pad-row">
                <input type="text" class="psv-pad-input" id="psvStudentQaInput" value="${esc(savedQ)}" placeholder="จดคำถามหรือประเด็นที่อยากแลกเปลี่ยนกับวิทยากร…" />
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
        ${slide.logline ? `<p class="psv-logline">${esc(slide.logline)}</p>` : ""}
        ${qaActionHtml}
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
        <div class="psv-aurora-layer" id="psvAuroraLayer"></div>
        <div class="psv-scrim-vignette"></div>
      </div>

      <div class="psv-dicut-stage" id="psvDicutStage" hidden aria-hidden="true">
        <div class="psv-dicut-aura"></div>
        <img class="psv-dicut-img" id="psvDicutImg" alt="" />
      </div>

      <div class="psv-ambient-watermark" aria-hidden="true">
        <span class="psv-wm-left"><span class="psv-wm-dot"></span><span id="psvWmSeries">RACM 303 PANEL SERIES</span></span>
        <span class="psv-wm-clock" id="psvWmClock"></span>
      </div>

      <header class="psv-hud-top" id="psvHudTop">
        <div class="psv-hud-brand">
          <span class="psv-series-pill"><span class="psv-n-bar"></span>PANEL SCREENSAVER</span>
          <select class="psv-deck-picker" id="psvDeckPicker" aria-label="เลือกคาบเสวนา Panel Discussion"></select>
        </div>
        <div class="psv-hud-controls" id="psvHudControls"></div>
      </header>

      <button type="button" class="psv-edge-nav is-prev" data-psv-act="prev" aria-label="สไลด์ก่อนหน้า" title="สไลด์ก่อนหน้า (←)">‹</button>
      <button type="button" class="psv-edge-nav is-next" data-psv-act="next" aria-label="สไลด์ถัดไป" title="สไลด์ถัดไป (→)">›</button>

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
            <button type="button" class="psv-pill-btn" data-psv-act="toggle-mod-drawer">ปิด ✕</button>
          </div>
          <div class="psv-mod-body" id="psvModBody"></div>
        </aside>
      `
          : `
        <aside class="psv-mod-drawer psv-stu-drawer" id="psvStuDrawer" hidden aria-label="สมุดจดคำถามและสะท้อนคิดส่วนตัวของนักศึกษา">
          <div class="psv-mod-head">
            <strong>📝 สมุดโน้ต & สะท้อนคิดส่วนตัว (บันทึกในเครื่อง)</strong>
            <button type="button" class="psv-pill-btn" data-psv-act="toggle-stu-drawer">ปิด ✕</button>
          </div>
          <div class="psv-mod-body" id="psvStuBody"></div>
        </aside>
      `
      }

      <div class="psv-qr-modal" id="psvQrModal" hidden>
        <div class="psv-qr-modal-card">
          <span class="psv-series-pill"><span class="psv-n-bar"></span>SCAN TO JOIN PANEL COMPANION</span>
          <div class="psv-qr-big" id="psvQrBigBox"></div>
          <div style="font-size:15px;font-weight:700;color:#fff" id="psvQrUrlLabel"></div>
          <p style="margin:0;font-size:13px;color:#cbd5e1">นักศึกษาสามารถสแกนเพื่อดูไทม์ไลน์ คำถามเสวนา ลิงก์หลักฐาน และบันทึกสะท้อนคิดบนไอแพดหรือมือถือ</p>
          <button type="button" class="psv-pill-btn is-active" data-psv-act="close-qr-modal">ปิดหน้าต่าง QR (Esc)</button>
        </div>
      </div>

      <footer class="psv-hud-bottom" id="psvHudBottom">
        <div class="psv-chapter-dots" id="psvChapterDots" role="tablist" aria-label="สารบัญสไลด์เสวนา"></div>
        <div class="psv-hud-foot-right" id="psvFootRight"></div>
      </footer>

      <div class="psv-ambient-progress" aria-hidden="true">
        <div class="psv-ambient-progress-bar" id="psvAmbientProgressBar"></div>
      </div>
    `;

    document.body.appendChild(modal);
    bindModalEvents(modal);
    return modal;
  }

  function populateDeckPicker() {
    const picker = document.getElementById("psvDeckPicker");
    if (!picker) return;
    picker.innerHTML = Object.keys(PANEL_DECKS)
      .map((id) => {
        const d = PANEL_DECKS[id];
        return `<option value="${esc(id)}"${id === state.deckId ? " selected" : ""}>${esc(d.shortTitle)}</option>`;
      })
      .join("");
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
      <button type="button" class="psv-pill-btn" data-psv-act="open-qr-modal" title="แสดง QR Code เข้าสไลด์">📱 QR</button>
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
      slideBody.innerHTML = renderSlideInnerHtml(deck, slide);
      wireStudentInputs(deck);
      const activeStop = slideBody.querySelector(".psv-rail-stop.is-active");
      if (activeStop && activeStop.scrollIntoView) {
        activeStop.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
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
      footRight.innerHTML = `<span>${esc(deck.sessionMeta)}</span><span>·</span><strong>${state.slideIdx + 1} / ${deck.slides.length}</strong>`;
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
        const joinUrl = `${PROD_STUDENT_BASE}#${deck.hashSlug}`;
        const qrBox = document.getElementById("psvQrBigBox");
        const qrLbl = document.getElementById("psvQrUrlLabel");
        if (qrBox) qrBox.innerHTML = buildQrSvg(joinUrl);
        if (qrLbl) qrLbl.textContent = `smartwoo.github.io/racm303-2569-student/#${deck.hashSlug}`;
      }
    }

    scheduleFitSlideBody();
    scheduleNextAmbientTick();
    broadcastHostState();
  }

  function wireStudentInputs(deck) {
    const qaIn = document.getElementById("psvStudentQaInput");
    const qaDr = document.getElementById("psvStuDrawerQa");
    if (qaIn) {
      qaIn.addEventListener("input", () => {
        saveStudentNote(`${deck.id}_qa`, qaIn.value);
        if (qaDr && qaDr !== document.activeElement) qaDr.value = qaIn.value;
      });
    }
    if (qaDr) {
      qaDr.addEventListener("input", () => {
        saveStudentNote(`${deck.id}_qa`, qaDr.value);
        if (qaIn && qaIn !== document.activeElement) qaIn.value = qaDr.value;
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

  function goToSlide(idx, fromAutoCycle, targetStationIdx) {
    const deck = getCurrentDeck();
    const clean = Math.max(0, Math.min(deck.slides.length - 1, idx));
    state.slideIdx = clean;
    const targetSlide = deck.slides[clean];
    if (typeof targetStationIdx === "number" && targetSlide && Array.isArray(targetSlide.milestones)) {
      state.stationIdx = Math.max(0, Math.min(targetSlide.milestones.length - 1, targetStationIdx));
    } else {
      state.stationIdx = 0;
    }
    if (!fromAutoCycle) resetIdleActivity();
    updateStageView();
  }

  function stepSlide(delta) {
    const deck = getCurrentDeck();
    const curSlide = getCurrentSlide();
    if (curSlide && curSlide.type === "timeline" && Array.isArray(curSlide.milestones) && curSlide.milestones.length > 1) {
      if (delta > 0 && state.stationIdx < curSlide.milestones.length - 1) {
        state.stationIdx += 1;
        resetIdleActivity();
        updateStageView();
        return;
      }
      if (delta < 0 && state.stationIdx > 0) {
        state.stationIdx -= 1;
        resetIdleActivity();
        updateStageView();
        return;
      }
    }
    const next = (state.slideIdx + delta + deck.slides.length) % deck.slides.length;
    const nextSlide = deck.slides[next];
    const initialStation =
      delta < 0 && nextSlide && nextSlide.type === "timeline" && Array.isArray(nextSlide.milestones)
        ? Math.max(0, nextSlide.milestones.length - 1)
        : 0;
    goToSlide(next, false, initialStation);
  }

  /* ---------- Event Delegation & Keyboard / Touch Navigation ---------- */
  function bindModalEvents(modal) {
    ["mousemove", "mousedown", "touchstart", " wheel"].forEach((evName) => {
      modal.addEventListener(evName.trim(), () => resetIdleActivity(), { passive: true });
    });

    modal.addEventListener("change", (ev) => {
      if (ev.target && ev.target.id === "psvDeckPicker") {
        const nextId = ev.target.value;
        if (PANEL_DECKS[nextId]) {
          state.deckId = nextId;
          state.slideIdx = 0;
          state.qaLoopOnly = false;
          updateStageView();
        }
      }
    });

    modal.addEventListener("click", (ev) => {
      const stBtn = ev.target.closest("[data-psv-station]");
      if (stBtn) {
        const stIdx = parseInt(stBtn.getAttribute("data-psv-station"), 10) || 0;
        const sl = getCurrentSlide();
        if (sl && Array.isArray(sl.milestones)) {
          state.stationIdx = Math.max(0, Math.min(sl.milestones.length - 1, stIdx));
          resetIdleActivity();
          updateStageView();
        }
        return;
      }
      const idxBtn = ev.target.closest("[data-psv-idx]");
      if (idxBtn) {
        goToSlide(parseInt(idxBtn.getAttribute("data-psv-idx"), 10) || 0, false, 0);
        return;
      }
      const actEl = ev.target.closest("[data-psv-act]");
      if (!actEl) return;
      const act = actEl.getAttribute("data-psv-act");
      if (act === "prev") stepSlide(-1);
      else if (act === "next") stepSlide(1);
      else if (act === "station-prev") {
        if (state.stationIdx > 0) {
          state.stationIdx -= 1;
          resetIdleActivity();
          updateStageView();
        }
      } else if (act === "skip-slide") {
        const deck = getCurrentDeck();
        const next = (state.slideIdx + 1) % deck.slides.length;
        goToSlide(next, false, 0);
      }
      else if (act === "toggle-ambient") toggleAmbientCycle(false);
      else if (act === "toggle-qa-loop") toggleAmbientCycle(true);
      else if (act === "toggle-backdrop") {
        state.backdropMode = state.backdropMode === "cinema" ? "aurora" : "cinema";
        try { localStorage.setItem("racm303_psv_backdrop", state.backdropMode); } catch (_) {}
        updateStageView();
      } else if (act === "font-down") setFontScale(state.fontScale - 0.08);
      else if (act === "font-up") setFontScale(state.fontScale + 0.08);
      else if (act === "font-reset") setFontScale(1);
      else if (act === "toggle-mod-drawer" && ROLE === "faculty") {
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

    // Touch Swipe Left/Right (tvOS Remote Feel)
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
        if (dx < 0) stepSlide(1);
        else stepSlide(-1);
      }
    }, { passive: true });

    window.addEventListener("resize", () => {
      if (state.isOpen) scheduleFitSlideBody();
    });

    document.addEventListener("keydown", (ev) => {
      if (!state.isOpen) return;
      const tag = ev.target && ev.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (ev.key === "Escape") ev.target.blur();
        return;
      }
      if (ev.key === "Escape") {
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
      if (ev.key === "ArrowRight" || ev.key === "PageDown" || ev.key === " ") {
        ev.preventDefault();
        stepSlide(1);
      } else if (ev.key === "ArrowLeft" || ev.key === "PageUp") {
        ev.preventDefault();
        stepSlide(-1);
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
    document.body.classList.remove("psv-deck-open");
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    const modal = document.getElementById("panelDeckModal");
    if (modal) modal.hidden = true;

    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (h.startsWith("panel-")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  window.RACM_PANEL_DECK = {
    open: openDeck,
    close: closeDeck,
    goToSlide,
    stepSlide,
    setFontScale,
    toggleAmbientCycle,
    hasDeck: (id) => Boolean(PANEL_DECKS[resolveDeckId(id)] && PANEL_DECKS[id]),
    getDecks: () => PANEL_DECKS,
    pptxHref: MODERATOR_PPTX_HREF
  };

  function checkUrlAutoOpen() {
    const params = new URLSearchParams(window.location.search);
    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    const slideParam = (params.get("slides") || params.get("panel") || "").toUpperCase();
    if (h === "panel-global" || slideParam === "GLOBAL") {
      setTimeout(() => openDeck("w1-d1-global", 0), 70);
    } else if (h === "panel-dhs" || slideParam === "PANEL-DHS") {
      setTimeout(() => openDeck("w3-d3-dhs-panel", 0), 70);
    } else if (h === "panel-6bb" || slideParam === "PANEL-6BB") {
      setTimeout(() => openDeck("w5-d3-panel-homeless", 0), 70);
    } else if (h === "panel-policy" || slideParam === "PANEL-HP" || slideParam === "PANEL-POLICY") {
      setTimeout(() => openDeck("w5-d4-policy", 0), 70);
    }
  }

  window.addEventListener("hashchange", checkUrlAutoOpen);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkUrlAutoOpen);
  } else {
    checkUrlAutoOpen();
  }
})();
