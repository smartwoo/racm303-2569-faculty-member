/* ==========================================================================
   RACM 303 (2569) — Orientation to Community Medicine & Health Systems Science
   Interactive 16:9 Widescreen Slide Studio
   Design System: Nano Banana Infographics (60/40 Visual Ratio, Okabe-Ito Palette)
                × NotebookLM Visual Storytelling (4-Act Narrative + Guided Lens)
   Includes 5-Competency Formative & Summative Assessment Blueprint for AY 2569
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const PPTX_HREF = "exports/pptx/RACM303_2569_Orientation_Slides.pptx";
  const PDF_HREF = "exports/pdf/RACM303_2569_Orientation_Slides.pdf";
  const CHECK_STORAGE_KEY = "racm303_2569_orient_w1_checks_v1";

  function loadSavedChecks() {
    try {
      const raw = localStorage.getItem(CHECK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (_) {}
    return { c1: false, c2: false, c3: false, c4: false };
  }

  function saveChecks(obj) {
    try {
      localStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  const state = {
    isOpen: false,
    slideIdx: 0,
    viewMode: "deck", // "deck" | "sorter" | "handout"
    sorterFilter: "all",
    presentationMode: false,
    showNotes: ROLE === "faculty",
    laserActive: false,
    timerRunning: false,
    timerSeconds: 0,
    timerInterval: null
  };

  /* Interactive Infographic State per Slide */
  const ui = {
    s01Act: 0,
    s02Lens: 2, // 0: Bedside, 1: Community/SDH, 2: Health System (Pillar 3)
    s02Era: 2, // 0: 2511, 1: 2525, 2: 2546-Now
    s03Focus: "all", // "all" | "gA".."gD" | "c1".."c5"
    s04Obj: 2, // 0..4 (default highlights DHS hub + shows full radial wheel)
    s05Week: 0, // 0..5
    s06Step: 2, // 0..4 (default highlights Step 3 Active Recall in 5-step flow)
    s06Beyond: 0, // 0..5
    s07Stage: 0, // 0..3
    s08Region: "all", // "all" | "north" | "isan" | "phet" | "south"
    s08Group: 0, // 0..8
    s09Mode: "all", // "all" | "formative" | "summative"
    s09Comp: 0, // 0..4
    s10Focus: "HS1", // selected exam bar code
    s11Pillar: 1, // 0: SRN, 1: Oral 3A/4A, 2: Form 1A/2A
    s12Ep: "high", // "fail" | "pass" | "high"
    s12Hs: "high", // "fail" | "pass" | "high"
    s12Att: "O", // "O" | "S" | "U"
    s12Retake: "no", // "no" | "yes"
    s13Shield: 0, // 0..5
    s14Checks: loadSavedChecks()
  };

  function getApi() {
    return window.RACM_PORTAL_API || null;
  }

  function syncPersonalGroupDefault() {
    const api = getApi();
    const st = api && api.getState ? api.getState() : {};
    if (st && st.myStudent && st.myStudent.groupNo) {
      const g = Number(st.myStudent.groupNo);
      if (g >= 1 && g <= 9) ui.s08Group = g - 1;
    }
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

  const SVG = {
    play: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
    handout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="17" x2="13" y2="17"/></svg>`,
    slides: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    notes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>`,
    fullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    spark: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2.5"/></svg>`,
    check: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
    shield: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  };

  /* ---------- Structured Datasets for Interactive Infographics ---------- */

  const COVER_ACTS = [
    {
      act: "ACT I · THE WHY",
      slides: "Slides 02–04",
      jumpIdx: 1,
      ring: 3,
      q: "ทำไมรักษาโรคใน รพ. เก่งอย่างเดียวจึงยังไม่พอ?",
      desc: "ขยายเลนส์จากข้างเตียง (Bedside) สู่ปัจจัยกำหนดสุขภาพ ชุมชน และเสาหลักที่ 3 Health Systems Science พร้อมเข็มทิศภาคสนาม 5 ข้อ"
    },
    {
      act: "ACT II · THE JOURNEY",
      slides: "Slides 05–08",
      jumpIdx: 4,
      ring: 2,
      q: "ตลอด 6 สัปดาห์ เราจะเรียนรู้และลงพื้นที่จริงอย่างไร?",
      desc: "Guided Learning 5 ขั้น (HS1–6) · 6 เวทีคิดเชิงระบบ · ระบาดวิทยา EP1–9 & SPSS · ฝึกภาคสนาม 9 รพช. ด้วย Kolb's Cycle"
    },
    {
      act: "ACT III · MASTERY",
      slides: "Slides 09–12",
      jumpIdx: 8,
      ring: 1,
      q: "วัดผล 5 สมรรถนะอย่างไรให้พัฒนาจริงโดยไม่ตื่นตระหนก?",
      desc: "แยก Formative (ฝึกคิดและรับ Feedback) ออกจาก Summative (สอบ EP/HS, SRN 2, ฟอร์ม 1A–4A) พร้อมเครื่องจำลองเกรด O / S / U"
    },
    {
      act: "ACT IV · LAUNCH",
      slides: "Slides 13–14",
      jumpIdx: 12,
      ring: 0,
      q: "กติกาความปลอดภัยและก้าวแรกวันนี้ต้องเริ่มตรงไหน?",
      desc: "วินัยเวลาเรียน ≥ 80% · 6 กฎเหล็กความปลอดภัยภาคสนาม พ.ศ. 2561 · เชื่อม Smart Portal และ Checklist สัปดาห์ที่ 1"
    }
  ];

  const S02_LENSES = [
    {
      id: 0,
      short: "① เลนส์ข้างเตียง",
      pillar: "Pillar 1 & 2 · Basic + Clinical Science",
      color: "#0072B2",
      headline: "เห็นพยาธิสภาพและอาการเฉียบพลันของผู้ป่วยตรงหน้า",
      caseStory: "ตัวอย่าง: ผู้ป่วยเบาหวานน้ำตาลสูงวิกฤต (DKA) มารักษาในวอร์ดจนพ้นขีดอันตรายและกลับบ้านได้",
      limit: "ข้อจำกัดหากหยุดแค่นี้: อีก 2 เดือนผู้ป่วยคนเดิมกลับมานอน รพ. ซ้ำ (Revolving-door patient) เพราะบริบทชีวิตไม่เคยเปลี่ยน"
    },
    {
      id: 1,
      short: "② เลนส์วิถีชุมชน & อาชีพ",
      pillar: "Community & Env/Occ Medicine",
      color: "#009E73",
      headline: "มองลึกลงใต้น้ำ: อาชีพ รายได้ อาหาร สิ่งแวดล้อม และทุนทางสังคม",
      caseStory: "เมื่อลงชุมชน: พบว่าผู้ป่วยทำงานกะดึก รายได้รายวัน เข้าถึงแต่อาหารแปรรูป (CDH/SDH) และอยู่ลำพังไม่มีคนจัดยา",
      limit: "จุดเปลี่ยน: แพทย์เริ่มทำงานร่วมกับครอบครัว อสม. และปรับสภาพแวดล้อมร่วมกับชุมชนแทนการสั่งยาเพิ่มเพียงอย่างเดียว"
    },
    {
      id: 2,
      short: "③ เลนส์ระบบสุขภาพ (HSS)",
      pillar: "Pillar 3 · Health Systems Science & Epi",
      color: "#D55E00",
      headline: "ออกแบบระบบบริการ ปฐมภูมิ การคลัง และนโยบายให้ดูแลคนทั้งอำเภอ",
      caseStory: "มองระดับระบบ: เชื่อม รพช.–รพ.สต. ระบบเยี่ยมบ้าน สิทธิประกันสุขภาพ (UHC) และข้อมูลระบาดวิทยาเพื่อป้องกันทั้งประชากร",
      limit: "หัวใจของ RACM 303: บูรณาการครบทั้ง “คน · ชุมชน · ระบบ” เพื่อเป็นแพทย์ผู้นำการเปลี่ยนแปลง (Change Agent)"
    }
  ];

  const S02_ERAS = [
    {
      yr: "พ.ศ. 2511–2512",
      title: "จุดกำเนิดคำถามท้าทาย ณ บางชัน & บางปะอิน",
      detail: "ศ.นพ.อารี วัลยะเสวี และ ศ.นพ.เปรม บุรี ริเริ่มสำรวจชุมชน ต.บางชัน และพัฒนาโครงการเวชศาสตร์ชุมชนสหวิชาชีพ อ.บางปะอิน เพื่อสร้างแพทย์ที่เข้าใจชีวิตจริงของสังคมไทย"
    },
    {
      yr: "พ.ศ. 2525",
      title: "ยกระดับสู่ศูนย์เวชศาสตร์ชุมชน รามาธิบดี",
      detail: "ขยายเครือข่ายการเรียนรู้ร่วมกับโรงพยาบาลชุมชนทั่วภูมิภาค พัฒนาการเรียนการสอนจากประสบการณ์จริงในพื้นที่ชนบทอย่างเป็นระบบ"
    },
    {
      yr: "พ.ศ. 2546 – ปัจจุบัน",
      title: "ภาควิชาเวชศาสตร์ชุมชน · 3 หน่วยงานหลัก",
      detail: "ขับเคลื่อน (1) สร้างเสริมสุขภาพ & สุขภาพโลก · (2) วิจัยระบบสุขภาพ (HSR) · (3) อาชีวเวชศาสตร์และเวชศาสตร์สิ่งแวดล้อม"
    }
  ];

  const S03_GOALS = [
    {
      id: "gA",
      code: "ก.",
      name: "Cognitive & Systems",
      sub: "อธิบาย & ประยุกต์ใช้ HSS + Epi",
      comps: ["c1", "c3"],
      modules: "EP1–EP9 · HS1 (SDH/CDH) · HS2 (6BB/6W) · HS3 (EQESaRR) · HS4 (Ottawa/COM-B) · HS5 (PHC) · HS6 (UHC) · Global Health",
      story: "สร้างคลังกรอบคิดเชิงประจักษ์ เพื่อใช้อ่านปัญหาสุขภาพระดับบุคคล ชุมชน ประเทศ และโลกอย่างเป็นระบบ"
    },
    {
      id: "gB",
      code: "ข.",
      name: "Leadership & Ethics",
      sub: "ตระหนักบทบาทผู้นำ & ศักยภาพชุมชน",
      comps: ["c3", "c5"],
      modules: "Physician Leadership · ทุนทางสังคมของชุมชน · ความตรงต่อเวลา ซื่อสัตย์ เห็นอกเห็นใจ ไม่เอาเปรียบผู้อื่น",
      story: "เปลี่ยนมุมมองจาก 'แพทย์ผู้รู้ทุกอย่าง' สู่ผู้นำที่เคารพศักยภาพชุมชนและยึดมั่นในจริยธรรมวิชาชีพ"
    },
    {
      id: "gC",
      code: "ค.",
      name: "Analytical & Field Skills",
      sub: "วิเคราะห์ สำรวจชุมชน & สื่อสารทีม",
      comps: ["c1", "c2", "c3"],
      modules: "Systems Problem-Solving · ลงมือสำรวจชุมชนเชิงประจักษ์ · ทำงานกับสหวิชาชีพ/ประชาชน · นำเสนอ 3A & 4A",
      story: "ฝึกทั้งทักษะสมอง ทักษะลงมือเก็บข้อมูลจริง และทักษะสื่อสารประสานใจกับผู้คนหลากหลายบริบท"
    },
    {
      id: "gD",
      code: "ง.",
      name: "Team & Metacognition",
      sub: "รับผิดชอบภารกิจทีม & รู้คิดพัฒนาตน",
      comps: ["c2", "c4", "c5"],
      modules: "Team Accountability · Metacognition & Self-Reflection Note (SRN 1 Formative → SRN 2 Summative)",
      story: "กลั่นกรองประสบการณ์ตรงเป็นบทเรียนพัฒนาตนเองต่อเนื่องตลอดชีวิตวิชาชีพแพทย์ (CPD)"
    }
  ];

  const S03_COMPS = [
    { id: "c1", short: "C1 · Knowledge Base", th: "ฐานความรู้ระบาดวิทยาและระบบสุขภาพ", goals: ["gA", "gC"], color: "#0072B2" },
    { id: "c2", short: "C2 · Communication", th: "การสื่อสารและสัมพันธภาพระหว่างบุคคล", goals: ["gC", "gD"], color: "#009E73" },
    { id: "c3", short: "C3 · Community & HSS", th: "ทักษะชุมชน สุขภาพประชากร และระบบสุขภาพ", goals: ["gA", "gB", "gC"], color: "#0284C7" },
    { id: "c4", short: "C4 · Continuous PD", th: "การพัฒนาตนเองอย่างต่อเนื่องและการสะท้อนคิด", goals: ["gD"], color: "#E69F00" },
    { id: "c5", short: "C5 · Professionalism", th: "เจตคติ คุณธรรม จริยธรรม และวินัยวิชาชีพ", goals: ["gB", "gD"], color: "#D55E00" }
  ];

  const S04_FIELD_OBJS = [
    {
      num: "01",
      short: "วิถีชุมชน & SDH/CDH",
      chips: "HS1 · 7 เครื่องมือวิถีชุมชน",
      color: "#0072B2",
      question: "อะไรคือรากเหง้าทางสังคม อาชีพ เศรษฐกิจ และการค้า ที่กำหนดสุขภาพของคนในชุมชนนี้?",
      tools: "แผนที่เดินดิน · ปฏิทินชุมชน · ประวัติศาสตร์ชุมชน · ผังเครือญาติ · การวิเคราะห์ SDH & CDH รายกรณี",
      output: "สังเคราะห์เป็นบริบทพื้นที่และรากเหง้าปัญหาในงานนำเสนอระบบสุขภาพ (ฟอร์ม 3A · 29 ธ.ค.)"
    },
    {
      num: "02",
      short: "ศักยภาพชุมชน & อสม.",
      chips: "HS1 · HS4 · HS5",
      color: "#009E73",
      question: "ชุมชนมีทุนทางสังคม ผู้นำท้องถิ่น และ อสม. ที่ลุกขึ้นมาจัดการสุขภาพตนเองอย่างไร?",
      tools: "ผังองค์กรชุมชน · การสัมภาษณ์ผู้นำธรรมชาติ/อสม./อบต. · การวิเคราะห์การมีส่วนร่วมของประชาชน",
      output: "ชี้จุดแข็งและกลไกชุมชนที่เชื่อมต่อกับระบบบริการปฐมภูมิในฟอร์ม 3A"
    },
    {
      num: "03",
      short: "ระบบสุขภาพอำเภอ (DHS)",
      chips: "HS2 · HS3 · HS5 · HS6",
      color: "#0284C7",
      question: "รพช. และ รพ.สต. จัดบริการ กำลังคน การเงิน และข้อมูลอย่างไรให้บรรลุคุณลักษณะ EQESaRR?",
      tools: "WHO 6 Building Blocks · 6W Models of Care · กรอบประเมิน EQESaRR · กลไกสิทธิประกันสุขภาพในพื้นที่",
      output: "แกนกลางของการวิเคราะห์ระบบบริการสุขภาพอำเภอเชิงลึกในฟอร์ม 3A"
    },
    {
      num: "04",
      short: "บทบาทแพทย์ รพช. & ทีม",
      chips: "Physician Leadership",
      color: "#E69F00",
      question: "แพทย์ รพช. ทำหน้าที่มากกว่าการตรวจโรคใน OPD อย่างไรในการนำทีมสหวิชาชีพและภาคีอำเภอ?",
      tools: "การตามรอย (Shadowing) แพทย์พี่เลี้ยง พยาบาลเวชปฏิบัติ เภสัชกร และทีมเยี่ยมบ้านสหวิชาชีพ",
      output: "ตกผลึกบทบาทแพทย์ผู้นำการเปลี่ยนแปลงในฟอร์ม 3A และบันทึกสะท้อนคิด SRN 2"
    },
    {
      num: "05",
      short: "สร้างเสริมสุขภาพ & Survey",
      chips: "HS4 · EP1–EP9 · SPSS",
      color: "#D55E00",
      question: "จะวัดขนาดปัญหาสุขภาพชุมชนอย่างแม่นยำและออกแบบการปรับพฤติกรรม/สิ่งแวดล้อมอย่างไร?",
      tools: "Ottawa Charter · COM-B / Nudge · การสุ่มตัวอย่าง สร้างแบบสอบถาม เก็บข้อมูลจริง และวิเคราะห์ SPSS",
      output: "เชื่อมทั้งข้อเสนอสร้างเสริมสุขภาพ (ฟอร์ม 3A) และงานวิจัยเชิงปริมาณ 1 เรื่อง (ฟอร์ม 4A · 30 ธ.ค.)"
    }
  ];

  const S05_WEEKS = [
    {
      wk: "W1",
      dates: "25–27 พ.ย.",
      phase: "Phase 1 · Foundation",
      tag: "เปิดเลนส์ระบบ",
      color: "#0072B2",
      title: "สัปดาห์ที่ 1: เปิดมุมมองคิดเชิงระบบ เริ่มต้น HS1 และปูฐานระบาดวิทยา EP1–3",
      days: [
        "พุธ 25 พ.ย.: ปฐมนิเทศ (09.00) · Systems Thinking & Iceberg · เสวนา Global/Planetary Health & HPSR",
        "พฤ. 26 พ.ย.: HS1 (ห้องใหญ่ + 6 กลุ่มย่อย) · บ่ายกลุ่มย่อย #1 รู้จักทีมและพื้นที่ 9 รพช.",
        "ศ. 27 พ.ย.: EP1–EP3 (08.30–11.00 น. ห้อง 2A01 + Zoom) · หลัง 11.00 น. ทำ Ex 1–2 แบบ SDL ใน E-learning"
      ],
      mix: [
        { lbl: "ทฤษฎี & คิดเชิงระบบ", pct: 65, cls: "" },
        { lbl: "อภิปรายกลุ่มย่อย & SDL", pct: 35, cls: "is-teal" }
      ]
    },
    {
      wk: "W2",
      dates: "30 พ.ย.–4 ธ.ค.",
      phase: "Phase 1 · Foundation",
      tag: "เข้มข้น HS2–6 & EP4–9",
      color: "#0072B2",
      title: "สัปดาห์ที่ 2: เจาะลึกโครงสร้างระบบสุขภาพครบ HS2–HS6 และระบาดวิทยาคลินิก/ชุมชน EP4–EP9",
      days: [
        "จ. 30 พ.ย. – อ. 1 ธ.ค.: เรียนและอภิปรายกรณีศึกษา HS2, HS3, HS4, HS5 ครบทั้ง 6 กลุ่มย่อย",
        "พ. 2 – พฤ. 3 ธ.ค.: EP4–EP9 & Ex 3–6 รูปแบบ Hybrid (ห้อง 2C2-03 + Zoom)",
        "ศ. 4 ธ.ค.: HS6 การเงินการคลังสุขภาพ + บ่ายกลุ่มย่อย #2 เตรียมโจทย์พื้นที่"
      ],
      mix: [
        { lbl: "Guided Learning & Hybrid Epi", pct: 55, cls: "" },
        { lbl: "Case Discussion & แบบฝึกหัด", pct: 45, cls: "is-teal" }
      ]
    },
    {
      wk: "W3",
      dates: "8–12 ธ.ค.",
      phase: "Phase 1 → 2 Bridge",
      tag: "สอบ EP · SPSS · ส่ง SRN 1",
      color: "#E69F00",
      title: "สัปดาห์ที่ 3: สอบทฤษฎีระบาดวิทยา ฝึก SPSS เตรียมเครื่องมือ 7 ชิ้น + Survey ก่อนออกเดินทาง",
      days: [
        "อ. 8 ธ.ค.: เช้าสอบทฤษฎี EP1–9 (09.00–12.00) · บ่ายเรียน SPSS + กลุ่มย่อย #3 ออกแบบโครงร่างสำรวจ",
        "พ. 9 ธ.ค.: เสวนา DHS (รศ.สุรเกียรติ) · กลุ่มย่อย #4 · ส่ง SRN 1 (≤ 17.00 น.) · กลุ่ม 9 อุ้มผางเดินทาง 23.00 น.",
        "พฤ. 10 – ส. 12 ธ.ค.: กลุ่มย่อย #5–6 เตรียมความพร้อมขั้นสุดท้าย และทยอยออกเดินทางสู่ 9 รพช."
      ],
      mix: [
        { lbl: "การสอบ EP & ส่ง SRN 1", pct: 35, cls: "is-amber" },
        { lbl: "SPSS & เตรียมเครื่องมือภาคสนาม", pct: 65, cls: "is-teal" }
      ]
    },
    {
      wk: "W4",
      dates: "9–20 ธ.ค.",
      phase: "Phase 2 · Field Immersion",
      tag: "ภาคสนาม 9 รพช.",
      color: "#009E73",
      title: "สัปดาห์ที่ 4: ฝังตัวเรียนรู้จากประสบการณ์จริง (7–9 คืน) ณ โรงพยาบาลชุมชนและหมู่บ้านเป้าหมาย",
      days: [
        "เรียนรู้ระบบบริการสุขภาพอำเภอ (รพช. – รพ.สต.) บทบาทแพทย์พี่เลี้ยง และการทำงานสหวิชาชีพ",
        "ลงชุมชนใช้ 7 เครื่องมือศึกษาวิถีชีวิต ปัจจัยกำหนดสุขภาพ (SDH/CDH) และทุนทางสังคม",
        "เก็บข้อมูล Quantitative Health Survey จริงในพื้นที่ + รับ Formative Feedback SRN 1 จากอาจารย์ที่ปรึกษา"
      ],
      mix: [
        { lbl: "เรียนรู้หน้างาน รพช. & ชุมชนจริง", pct: 80, cls: "is-teal" },
        { lbl: "สะท้อนคิดกลุ่มย่อยรายวัน & วิเคราะห์ข้อมูล", pct: 20, cls: "" }
      ]
    },
    {
      wk: "W5",
      dates: "21–25 ธ.ค.",
      phase: "Phase 3 · Synthesis",
      tag: "สอบ HS · CLD & นโยบาย",
      color: "#0284C7",
      title: "สัปดาห์ที่ 5: ทบทวนทำโน้ต A4 สอบระบบสุขภาพ (Open Note) และถอดบทเรียนด้วยเครื่องมือคิดเชิงระบบ",
      days: [
        "จ. 21 ธ.ค.: Self-Directed Learning สรุปแผนภาพความคิดลงกระดาษ A4 ลายมือตนเอง 1 แผ่น",
        "อ. 22 ธ.ค.: เช้าสอบทฤษฎี HS1–6 (Open Note) · บ่าย Workshop วาดแผนภาพวงจรเหตุผล (CLD)",
        "พ. 23 – ศ. 25 ธ.ค.: เสวนา 6BB สุขภาวะข้างถนน · Policy Exercise · กลุ่มย่อย #7–10 วิเคราะห์ผลและสังเคราะห์บทเรียน"
      ],
      mix: [
        { lbl: "สอบ HS Open Note", pct: 30, cls: "is-amber" },
        { lbl: "CLD / Policy & สังเคราะห์ภาคสนาม", pct: 70, cls: "" }
      ]
    },
    {
      wk: "W6",
      dates: "28–30 ธ.ค.",
      phase: "Phase 3 · Culmination",
      tag: "นำเสนอ 3A/4A & SRN 2",
      color: "#D55E00",
      title: "สัปดาห์ที่ 6: เวทีแลกเปลี่ยนเรียนรู้ 9 พื้นที่ (ฟอร์ม 3A & 4A) ปัจฉิมนิเทศ และส่ง SRN 2",
      days: [
        "จ. 28 ธ.ค.: กลุ่มย่อย #11–12 ซ้อมใหญ่และขัดเกลาตรรกะการนำเสนอทั้งสองเวที",
        "อ. 29 ธ.ค.: นำเสนอการเรียนรู้ภาคสนามด้านระบบสุขภาพ (ฟอร์ม 3A · 10+20 นาที/กลุ่ม) + กลุ่มย่อย #13",
        "พ. 30 ธ.ค.: นำเสนอวิจัยเชิงปริมาณระบาดวิทยา (ฟอร์ม 4A · 7+18 นาที/กลุ่ม) · ปัจฉิมนิเทศ · ส่ง SRN 2 & ไฟล์สไลด์ (≤ 17.00 น.)"
      ],
      mix: [
        { lbl: "นำเสนอแลกเปลี่ยนเรียนรู้ 9 รพช.", pct: 70, cls: "is-crimson" },
        { lbl: "สะท้อนคิดปลายทาง (SRN 2)", pct: 30, cls: "is-teal" }
      ]
    }
  ];

  const S06_STEPS = [
    {
      no: "01",
      tag: "PRE-CLASS",
      title: "① อ่านฉบับเต็ม",
      sub: "Full Guided Text",
      what: "อ่านบทเรียนหลักที่ออกแบบตามหลัก Guided Learning พร้อมตอบคำถามชวนคิดในสมุดแบบฝึกหัดก่อนเข้าห้องเรียน",
      whyA4: "สร้างความเข้าใจเชิงลึกในกลไกและตัวอย่างจริงของไทย ไม่ใช่แค่จำนิยามสั้น ๆ"
    },
    {
      no: "02",
      tag: "STRUCTURE",
      title: "② ทบทวนฉบับย่อ",
      sub: "Abridged Visual Summary",
      what: "จัดระเบียบโครงสร้างความคิดด้วยตารางเปรียบเทียบและกรอบสังเคราะห์สาระสำคัญของแต่ละบท (HS1–HS6)",
      whyA4: "เป็นต้นแบบชั้นดีในการออกแบบโครงร่างกระดาษโน้ต A4 ลายมือตนเองสำหรับสอบ Open Note"
    },
    {
      no: "03",
      tag: "ACTIVE RECALL",
      title: "③ โจทย์ 66 ข้อ & ศัพท์",
      sub: "Self-Quiz + 125 Terms",
      what: "ฝึกดึงความรู้ด้วยข้อสอบจำลอง 66 ข้อ (Formative · ST1 & HS1–6) พร้อม AI Mentor และบัตรคำศัพท์หลัก 125 คำ",
      whyA4: "เช็กจุดบอดของตนเองทันทีโดยไม่มีคะแนนตัดเกรด ทำให้รู้ว่าต้องเน้นเรื่องใดตอนเข้าห้องเรียน"
    },
    {
      no: "04",
      tag: "SYNTHESIS (1 HR)",
      title: "④ Slide อาจารย์",
      sub: "Plenary Room 2C2-03",
      what: "ชั่วโมงสังเคราะห์แนวคิดร่วมกับอาจารย์ผู้สอนในห้องใหญ่ 1 ชั่วโมง เชื่อมโยงกรอบทฤษฎีและคลี่คลายประเด็นซับซ้อน",
      whyA4: "จับประเด็นเชื่อมโยงข้ามบท (เช่น SDH → 6BB → EQESaRR → UHC) ก่อนลงมือแก้โจทย์กรณีศึกษา"
    },
    {
      no: "05",
      tag: "CASE LAB (2H 20M)",
      title: "⑤ Case 6 กลุ่มย่อย",
      sub: "Rooms 1C1-02 ถึง 1C1-07",
      what: "อภิปรายเปรียบเทียบกรณีศึกษา (Contrasting Cases) ร่วมกับเพื่อนและอาจารย์ประจำกลุ่มย่อยทั้ง 6 ห้อง",
      whyA4: "ฝึกประยุกต์ใช้ทฤษฎีตัดสินใจแก้ปัญหาเชิงระบบ ซึ่งเป็นทักษะเดียวกับข้อสอบ Open Note และภาคสนาม"
    }
  ];

  const S06_BEYOND = [
    { name: "1. ST1 · Systems & CAS / Iceberg (25 พ.ย.)", role: "ปูวิธีคิดระบบซับซ้อนปรับตัวได้ (CAS) และภูเขาน้ำแข็ง 4 ชั้น ตั้งแต่วันแรก (มีเอกสารคำสอน ST1 ครบ 5 ขั้นตอน)" },
    { name: "2. Global/Planetary Health & HPSR (25 พ.ย.)", role: "เชื่อมปัญหาข้างเตียงเข้ากับสุขภาพโลก การเปลี่ยนแปลงสภาพภูมิอากาศ และงานวิจัยระบบสุขภาพ" },
    { name: "3. District Health Systems · รศ.สุรเกียรติ (9 ธ.ค.)", role: "ถอดรหัสการทำงานจริงของระบบสุขภาพอำเภอจากประสบการณ์ตรงก่อนออกเดินทางสู่ 9 รพช." },
    { name: "4. CLD & System Archetypes (22 ธ.ค.)", role: "ฝึกวาดแผนภาพวงจรเหตุและผล (Reinforcing / Balancing Loops) จากข้อมูลที่เก็บมาจริงในพื้นที่" },
    { name: "5. 6BB “สุขภาวะข้างถนน” (23 ธ.ค.)", role: "วิเคราะห์ 6 Building Blocks ผ่านชีวิตจริงของกลุ่มเปราะบางในเมืองและชุมชน" },
    { name: "6. Policy & Political Economy (24 ธ.ค.)", role: "เข้าใจการขับเคลื่อนนโยบายสาธารณะ เศรษฐศาสตร์การเมือง และการต่อรองของผู้มีส่วนได้ส่วนเสีย" }
  ];

  const S07_STAGES = [
    {
      code: "DAY 1",
      when: "ศ. 27 พ.ย. 69 · 08.30–11.00 น. + SDL",
      room: "Auditorium 2A01 + Zoom · อ.จักรกฤษณ์",
      topics: "EP1 Intro · EP2 Diagnostic Test · EP3 Errors in Epidemiology",
      sdl: "หลัง 11.00 น.: ทำ Exercise 1–2 (SDL ในระบบ E-learning)",
      concepts: ["Sensitivity / Specificity / PPV / NPV / LR", "Random Error vs. Systematic Error (Bias)", "Selection Bias · Information Bias · Confounding"],
      fieldLink: "ช่วยให้ทีมออกแบบการเก็บข้อมูลภาคสนามโดยไม่เกิดอคติการคัดเลือกตัวอย่างหรือวัดผลคลาดเคลื่อน"
    },
    {
      code: "DAY 2",
      when: "พ. 2 ธ.ค. 69 · เต็มวัน (Hybrid)",
      room: "ห้อง 2C2-03 + Zoom · อ.สวนีย์",
      topics: "EP4 Study Designs & Impact · EP5 Surveillance & Outbreak",
      sdl: "ฝึกทำ Exercise 3–4 พร้อมชั่วโมง Q&A วิเคราะห์โจทย์",
      concepts: ["Observational Studies: Cohort · Case-control · Cross-sectional", "การแปลผล RR, OR, AR และ PAR เชิงนโยบาย", "ระบบเฝ้าระวังทางระบาดวิทยาและขั้นตอนสอบสวนโรคระบาด"],
      fieldLink: "เลือกรูปแบบการศึกษา (เช่น Cross-sectional analytic survey) และคำนวณขนาดความสัมพันธ์ได้ถูกต้อง"
    },
    {
      code: "DAY 3",
      when: "พฤ. 3 ธ.ค. 69 · เต็มวัน (Hybrid)",
      room: "ห้อง 2C2-03 + Zoom · อ.ปวินท์, ศ.วิชัย, ผศ.ฉัฐญาณ์",
      topics: "EP6 Burden · EP7 Health Survey · EP8 Experimental · EP9 EBM",
      sdl: "ฝึกทำ Exercise 5–6 เตรียมความพร้อมก่อนสอบทฤษฎี",
      concepts: ["Incidence, Prevalence, Mortality & DALYs", "การสุ่มตัวอย่างและการสร้างแบบสอบถาม Health Survey", "RCT Appraisal & กรอบ PICO ในเวชศาสตร์เชิงประจักษ์"],
      fieldLink: "ต่อยอดตรงสู่การสร้างแบบสอบถามและการวัดภาระโรคของชุมชนเป้าหมายทั้ง 9 พื้นที่"
    },
    {
      code: "FIELD → 4A",
      when: "อ. 8 ธ.ค. → พ. 30 ธ.ค. 69",
      room: "สอบ 2C2-02..03 · SPSS · 9 รพช. · นำเสนอ 2C2-03",
      topics: "Exam → SPSS Workshop → Field Survey → Oral Presentation (4A)",
      sdl: "บ่าย 8 ธ.ค. (13.00–14.30): ปฏิบัติการ SPSS สร้างฐานข้อมูลและวิเคราะห์สถิติ",
      concepts: ["เช้า 8 ธ.ค.: สอบทฤษฎี EP1–9 (Closed-book)", "9–20 ธ.ค.: เก็บข้อมูลจริงและตรวจสอบคุณภาพข้อมูลในพื้นที่", "พุธ 30 ธ.ค.: นำเสนอ Quantitative Study กลุ่มละ 1 เรื่อง (7+18 นาที)"],
      fieldLink: "ครบวงจรตั้งแต่เข้าใจทฤษฎี → ลงมือวิจัยจริง → นำเสนอข้อค้นพบเพื่อประโยชน์ของพื้นที่"
    }
  ];

  const S08_SITES = [
    { g: 1, reg: "isan", x: 184, y: 118, hosp: "รพร.กุฉินารายณ์", prov: "จ.กาฬสินธุ์", n: 20, adv: "อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์", room: "3B1-01", dates: "พฤ. 10 – ส. 19 ธ.ค. 69", nights: "9 คืน 10 วัน" },
    { g: 2, reg: "isan", x: 132, y: 98, hosp: "รพร.ด่านซ้าย", prov: "จ.เลย", n: 19, adv: "ผศ. พญ.ฉัฐญาณ์ / อ. พญ.วริษา", room: "1C1-02", dates: "ส. 12 – ส. 19 ธ.ค. 69", nights: "7 คืน 8 วัน" },
    { g: 3, reg: "south", x: 92, y: 248, hosp: "รพ.ตะกั่วป่า", prov: "จ.พังงา", n: 18, adv: "อ. นพ.ฉัตรชัย อิ่มอารมย์", room: "3B1-05", dates: "พฤ. 10 – ส. 19 ธ.ค. 69", nights: "9 คืน 10 วัน" },
    { g: 4, reg: "north", x: 118, y: 58, hosp: "รพ.ท่าวังผา", prov: "จ.น่าน", n: 18, adv: "อ. นพ.จักรกฤษณ์ เอื้อสุนทรวัฒนา", room: "3B1-06", dates: "ส. 12 – ส. 19 ธ.ค. 69", nights: "7 คืน 8 วัน" },
    { g: 5, reg: "phet", x: 124, y: 118, hosp: "รพ.เพชรบูรณ์ (กลุ่ม 1)", prov: "จ.เพชรบูรณ์", n: 18, adv: "ผศ. นพ.สัมฤทธิ์ / นพ.พีรสิชฌ์", room: "1C1-04", dates: "พฤ. 10 – ส. 19 ธ.ค. 69", nights: "9 คืน 10 วัน" },
    { g: 6, reg: "phet", x: 138, y: 124, hosp: "รพ.เพชรบูรณ์ (กลุ่ม 2)", prov: "จ.เพชรบูรณ์", n: 18, adv: "อ. นพ.ปวินท์ ศรีวิเชียร", room: "1C1-05", dates: "พฤ. 10 – ส. 19 ธ.ค. 69", nights: "9 คืน 10 วัน" },
    { g: 7, reg: "isan", x: 158, y: 112, hosp: "รพ.อุบลรัตน์", prov: "จ.ขอนแก่น", n: 18, adv: "อ. นพ.ภูษิต ประคองสาย", room: "1C1-03", dates: "ส. 12 – อา. 20 ธ.ค. 69", nights: "8 คืน 9 วัน" },
    { g: 8, reg: "north", x: 66, y: 108, hosp: "รพ.ท่าสองยาง", prov: "จ.ตาก", n: 20, adv: "ผศ. นพ.วิชช์ / นพ.ภรัณยู", room: "1C1-06", dates: "ศ. 11 – ส. 19 ธ.ค. 69", nights: "8 คืน 9 วัน" },
    { g: 9, reg: "north", x: 74, y: 136, hosp: "รพ.อุ้มผาง", prov: "จ.ตาก", n: 20, adv: "รศ. พญ.เริงฤดี ปธานวนิช", room: "1C1-07", dates: "พ. 9 – ศ. 18 ธ.ค. 69 (ออก 9 ธ.ค. 23.00 น.)", nights: "8 คืน 9 วัน" }
  ];

  const S09_BLUEPRINT = [
    {
      domain: "theory",
      code: "1. Knowledge base",
      sub: "ฐานความรู้ระบบสุขภาพและระบาดวิทยา",
      formative: "คำถามนำ Case Workbook & Self-Quiz 66 ข้อ (ST1 & HS1–6) · แบบฝึกหัด EP Ex 1–6 · SRN 1 (รับ Feedback)",
      summative: "สอบทฤษฎีระบาดวิทยา (EP1–9 · 8 ธ.ค.) · สอบทฤษฎีระบบสุขภาพ (HS1–6 Open Note · 22 ธ.ค.)",
      assessor: "คณาจารย์ภาควิชาเวชศาสตร์ชุมชน",
      criteria: "แยกเกณฑ์ EP & HS: ผ่าน ≥ 2.00 (แต้มรวมแต่ละส่วน ≥ 3.75 ได้ O)",
      takeaway: "ฝึกทำ Self-Quiz และ EP Exercise เต็มที่ในขั้น Formative เพื่อสร้างความแม่นยำก่อนสอบจริงทั้ง 2 หมวด"
    },
    {
      domain: "practice",
      code: "2. Communication & Interpersonal",
      sub: "การสื่อสาร การทำงานร่วมกัน และสัมพันธภาพ",
      formative: "การแลกเปลี่ยนในกลุ่มย่อย 13 ครั้ง · การซ้อมนำเสนอและการสื่อสารหน้างานกับชุมชน/รพช.",
      summative: "Peer Assessment จากเพื่อนในกลุ่ม · ฟอร์ม 1A (ข้อ 1, 3, 4.1–4.2) · การนำเสนอและตอบคำถาม 3A/4A",
      assessor: "เพื่อนในกลุ่ม · อาจารย์ที่ปรึกษากลุ่ม",
      criteria: "O / S / M / U (รายบุคคล · ประกอบฟอร์ม 2A)",
      takeaway: "การฟังอย่างตั้งใจ อ่อนน้อมต่อชุมชน และช่วยเพื่อนตอบคำถามอย่างเป็นทีม คือหัวใจของสมรรถนะด้านที่ 2"
    },
    {
      domain: "practice",
      code: "3. Community, Pop Health & HSS",
      sub: "ทักษะชุมชน สุขภาพประชากร และระบบสุขภาพ",
      formative: "การโค้ชระหว่างเก็บข้อมูล 7 เครื่องมือวิถีชุมชน วิเคราะห์ รพช. และออกแบบ Health Survey กับครูพี่เลี้ยง",
      summative: "นำเสนอภาคสนามระบบสุขภาพครบ 5 วัตถุประสงค์ (ฟอร์ม 3A) & วิจัยระบาดวิทยา (ฟอร์ม 4A) · ฟอร์ม 1A",
      assessor: "คณาจารย์ประจำวิชา · อาจารย์กลุ่ม · เพื่อน",
      criteria: "O / S / M / U (3A, 4A รายกลุ่ม · 1A รายบุคคล)",
      takeaway: "เชื่อมข้อมูลจริงจากหมู่บ้านและ รพช. เข้ากับกรอบทฤษฎี HS/EP อย่างมีเหตุผล ไม่ใช่แค่เล่ากิจกรรมรายวัน"
    },
    {
      domain: "practice",
      code: "4. Continuous Prof. Development",
      sub: "การสะท้อนคิดและพัฒนาตนเองต่อเนื่อง (CPD)",
      formative: "SRN 1 (ส่ง 9 ธ.ค. เพื่อรับ Formative Feedback รายบุคคลจากอาจารย์ที่ปรึกษาช่วงภาคสนาม)",
      summative: "SRN 2 (ส่ง 30 ธ.ค. ประเมินการเติบโตและบทเรียนสังเคราะห์ปลายทาง) · ฟอร์ม 1A ข้อ 2 ความใฝ่รู้",
      assessor: "อาจารย์ที่ปรึกษากลุ่ม · เพื่อนในกลุ่ม",
      criteria: "O / S / M / U (รายบุคคล)",
      takeaway: "ใช้ SRN 1 เป็นพื้นที่สะท้อนคิดตามจริงเพื่อรับคำแนะนำ แล้วต่อยอดสู่การตกผลึกเชิงลึกใน SRN 2"
    },
    {
      domain: "practice",
      code: "5. Prof. Habits, Moral & Ethics",
      sub: "ความรับผิดชอบ ความซื่อสัตย์ วินัย และจริยธรรม",
      formative: "การตักเตือนและสะท้อนพฤติกรรมระหว่างเรียนกลุ่มย่อยและการใช้ชีวิตร่วมกันในพื้นที่ภาคสนาม",
      summative: "ฟอร์ม 1A GRS (ข้อ 6.1–6.3: รับผิดชอบ ซื่อสัตย์ น้ำใจ) · ฟอร์ม 2A สรุปภาพรวมเจตคติ · เวลาเรียน ≥ 80%",
      assessor: "อาจารย์ที่ปรึกษากลุ่ม (ข้อมูลประกอบจากเพื่อน)",
      criteria: "O / S / M / U → ภาพรวม O / S / U (ได้ U = เรียนซ้ำ)",
      takeaway: "ความซื่อสัตย์ (ไม่เมคข้อมูลสำรวจ ไม่ลอกงาน ไม่เซ็นชื่อแทนกัน) และความปลอดภัยในพื้นที่คือกติกาสำคัญที่สุด"
    }
  ];

  const S10_EP_BARS = [
    { code: "EP2", name: "Diagnostic Test (Sens/Spec/PPV/LR)", pct: 15, tip: "ฝึกตั้งตาราง 2×2 และตีความ PPV/NPV ตามความชุกของโรคในคลินิก vs ชุมชน" },
    { code: "EP3", name: "Errors: Random, Bias & Confounding", pct: 15, tip: "แยกแยะ Selection Bias, Information Bias และ Confounding ออกจากกันในโจทย์งานวิจัย" },
    { code: "EP5", name: "Surveillance & Outbreak Investigation", pct: 15, tip: "เข้าใจขั้นตอนสอบสวนการระบาด การสร้าง Epidemic Curve และการคำนวณ Attack Rate" },
    { code: "EP6", name: "Burden of Disease (Incidence/DALYs)", pct: 15, tip: "แม่นความต่างของ Incidence Density, Cumulative Incidence, Prevalence และ DALYs" },
    { code: "EP8", name: "Experimental Study (RCT)", pct: 15, tip: "ประเมิน Randomization, Blinding, Intention-to-Treat และ NNT/NNH" },
    { code: "EP4", name: "Study Designs & Impact (RR/OR/PAR)", pct: 10, tip: "เลือกมาตราวัดความสัมพันธ์ (RR vs OR) และผลกระทบระดับประชากร (AR, PAR) ให้ตรงรูปแบบวิจัย" },
    { code: "EP7+9", name: "Health Survey (7.5%) & EBM/PICO (7.5%)", pct: 15, tip: "เชื่อม EP1 พื้นฐาน เข้ากับการสุ่มตัวอย่างสำรวจชุมชนและการตั้งคำถาม PICO" }
  ];

  const S10_HS_BARS = [
    { code: "HS1", name: "แนวคิดสุขภาพ · SDH/CDH & การป้องกัน 4 ระดับ", pct: 20, tip: "สัดส่วนสูงสุด (20%): เตรียมแผนภาพปัจจัยกำหนดสุขภาพและตัวอย่าง Primordial–Quaternary Prevention ลงในโน้ต A4" },
    { code: "HS6", name: "ประกันสุขภาพ UHC & กลไกจ่ายเงินผู้ให้บริการ", pct: 20, tip: "สัดส่วนสูงสุด (20%): เปรียบเทียบ 3 กองทุนหลัก และผลจูงใจของ Capitation, DRG, Fee-for-service ในตารางเดียว" },
    { code: "HS2", name: "โครงสร้างระบบสุขภาพ (6BB) & รูปแบบดูแล (6W)", pct: 15, tip: "เชื่อมความสัมพันธ์ของ 6 Building Blocks กับการออกแบบระบบดูแลผู้ป่วยต่อเนื่อง 6W" },
    { code: "HS3", name: "คุณลักษณะระบบบริการที่พึงประสงค์ (EQESaRR)", pct: 15, tip: "จำแนก Equity, Quality, Efficiency, Safety, Responsiveness และ Resilience จากสถานการณ์จริง" },
    { code: "HS4", name: "พฤติกรรมสุขภาพ (COM-B / Nudge) & Ottawa", pct: 15, tip: "วางกรอบวิเคราะห์ Capability-Opportunity-Motivation คู่กับยุทธศาสตร์ Ottawa Charter 5 ด้าน" },
    { code: "HS5", name: "ระบบสุขภาพปฐมภูมิ (PHC) & Primary Care", pct: 15, tip: "แยกความต่างของ PHC กับ Primary Care และคุณสมบัติ 4Cs (First-contact, Continuity, Comprehensiveness, Coordination)" }
  ];

  const S13_SHIELDS = [
    {
      no: "01",
      title: "การเดินทางและยานพาหนะ",
      short: "ห้ามนำรถส่วนตัวไปใช้เด็ดขาด",
      detail: "เดินทางด้วยยานพาหนะที่ภาควิชาฯ หรือ รพช. จัดไว้ให้เท่านั้น ห้ามนำรถยนต์/จักรยานยนต์ส่วนตัวไปใช้ และไม่เปลี่ยนเส้นทางโดยพลการ"
    },
    {
      no: "02",
      title: "ที่พักและขอบเขตพื้นที่",
      short: "ห้ามออกนอกเขต / ไปลำพัง",
      detail: "พักในสถานที่ที่จัดไว้ให้เท่านั้น ห้ามออกนอกเขตพื้นที่ฝึกปฏิบัติงาน หรือออกไปเก็บข้อมูลตามลำพังโดยไม่แจ้งขออนุญาตอาจารย์/ครูพี่เลี้ยง"
    },
    {
      no: "03",
      title: "การเยี่ยมของบุคคลภายนอก",
      short: "งดผู้ปกครอง/คนนอกเข้าพบ",
      detail: "ขอความร่วมมือผู้ปกครองและบุคคลภายนอกหลีกเลี่ยงการเข้าพบระหว่างฝึกภาคสนาม เพื่อให้เรียนรู้ร่วมกับทีมอย่างเต็มที่ (กรณีจำเป็นต้องขออนุญาตล่วงหน้า)"
    },
    {
      no: "04",
      title: "การแต่งกายและป้ายชื่อ",
      short: "สุภาพ เหมาะสม ติดป้ายชื่อเสมอ",
      detail: "สวมชุดนักศึกษา/แต่งกายสุภาพติดป้ายชื่อเมื่อปฏิบัติงานใน รพช. และสถานที่ราชการ และแต่งกายทะมัดทะแมงสุภาพเมื่อลงชุมชน"
    },
    {
      no: "05",
      title: "ข้อห้ามทางวินัยร้ายแรง",
      short: "งดแอลกอฮอล์ สารเสพติด การพนัน",
      detail: "ห้ามดื่มสุรา/แอลกอฮอล์ เสพสารเสพติด เล่นการพนัน หรือประพฤติผิดกฎหมายตลอดระยะเวลาฝึกภาคสนาม รวมถึงนอกเวลาเรียน"
    },
    {
      no: "06",
      title: "ความเคารพและสื่อโซเชียล",
      short: "เคารพสิทธิชุมชน ระวังโพสต์ภาพ",
      detail: "สุภาพอ่อนน้อมต่อชาวบ้านและเจ้าหน้าที่ ระมัดระวังการถ่ายภาพและห้ามเผยแพร่ข้อมูลส่วนบุคคลของผู้ป่วยหรือชุมชนลงโซเชียลมีเดีย"
    }
  ];

  /* ---------- Helper: Compute Simulated Final Grade (Slide 12) ---------- */
  function computeGradeVerdict() {
    if (ui.s12Att === "U") {
      return {
        cls: "is-grade-u",
        letter: "U",
        title: "ไม่ผ่านรายวิชา (U) — ต้องลงทะเบียนเรียนใหม่",
        desc: "ตามเกณฑ์คู่มือรายวิชา: หากผลประเมินภาพรวมเจตคติและพฤติกรรม (ฟอร์ม 2A) ได้ U จะตัดสินผลเป็น U ทันทีและต้องลงทะเบียนเรียนซ้ำ"
      };
    }
    if (ui.s12Ep === "fail" || ui.s12Hs === "fail") {
      const which =
        ui.s12Ep === "fail" && ui.s12Hs === "fail"
          ? "ทั้งหมวดระบาดวิทยาและระบบสุขภาพ"
          : ui.s12Ep === "fail"
            ? "เฉพาะหมวดระบาดวิทยา (EP < 2.00)"
            : "เฉพาะหมวดระบบสุขภาพ (HS < 2.00)";
      return {
        cls: "is-grade-retest",
        letter: "ซ่อม",
        title: `สอบแก้ตัว 1 ครั้ง (${which})`,
        desc: "เมื่อสอบผ่านจะได้เกรด S (มีผลต่อการรับเกียรตินิยม) — แต่หากสอบแก้ตัวแล้วยังไม่ผ่าน จะต้องลงทะเบียนเรียนใหม่"
      };
    }
    if (ui.s12Ep === "high" && ui.s12Hs === "high" && ui.s12Att === "O" && ui.s12Retake === "no") {
      return {
        cls: "is-grade-o",
        letter: "O",
        title: "เกรด O (Outstanding · ดีเยี่ยม)",
        desc: "ครบทั้ง 3 เงื่อนไข: (1) สอบทฤษฎีทั้ง EP และ HS ได้ ≥ 3.75, (2) เจตคติและพฤติกรรมภาพรวม (ฟอร์ม 2A) ได้ O และ (3) ไม่เคยสอบซ่อม"
      };
    }
    return {
      cls: "is-grade-s",
      letter: "S",
      title: "เกรด S (Satisfactory · ผ่านเกณฑ์มาตรฐาน)",
      desc:
        ui.s12Retake === "yes"
          ? "ผ่านเกณฑ์ทั้งสองหมวด แต่เนื่องจากมีประวัติสอบซ่อมจึงได้เกรดสูงสุดที่ S (และมีผลต่อการพิจารณาเกียรตินิยม)"
          : "สอบผ่านทั้ง EP และ HS (≥ 2.00) และผ่านเกณฑ์เจตคติ/พฤติกรรม (ฟอร์ม 2A ได้ O หรือ S)"
    };
  }

  /* ---------- Complete 14-Slide Interactive Infographic Definitions ---------- */
  const SLIDES = [
    {
      id: "s01-cover",
      num: "01",
      section: "intro",
      sectionLabel: "Opening",
      actClass: "",
      actLabel: "STORY MAP · 4 ACTS",
      timeWindow: "09.00 – 09.02 น. (2 นาที)",
      kicker: "RACM 303 · ACADEMIC YEAR 2569 · COURSE ORIENTATION",
      title: "Orientation to Community Medicine and Health Systems Science",
      lead: "Objectives, Learning Experience, and Competency-Based Evaluation",
      notes:
        "กล่าวต้อนรับนักศึกษาแพทย์ชั้นปีที่ 3 รุ่นปีการศึกษา 2569 ทั้ง 169 คน ชวนมองแผนภาพวงโคจร 3 ระดับทางขวา (จากผู้ป่วยข้างเตียง → ชุมชน → ระบบสุขภาพ) และชี้แจงเส้นทางเล่าเรื่อง 4 องก์ (Objectives, 6-Week Journey, 5-Competency Mastery, Launchpad) ตลอด 30 นาทีนี้ ก่อนเข้าสู่คาบ Systems Thinking เวลา 09.30 น.",
      isCover: true
    },
    {
      id: "s02-why-hss",
      num: "02",
      section: "objectives",
      sectionLabel: "01 · Objectives",
      actClass: "",
      actLabel: "ACT I · THE WHY",
      timeWindow: "09.02 – 09.04 น. (2 นาที)",
      kicker: "01 · FROM BEDSIDE TO COMMUNITY & HEALTH SYSTEMS",
      title: "ทำไมรักษาโรคในโรงพยาบาลเก่งอย่างเดียวไม่พอ? ภูเขาน้ำแข็งสุขภาพและเสาหลักที่ 3",
      lead: "ขยายมุมมองจากผู้ป่วยตรงหน้า (Clinical) สู่บริบทวิถีชุมชน (SDH/CDH) และวิทยาศาสตร์ระบบสุขภาพ (HSS) เพื่อหยุดวงจรป่วยซ้ำ",
      notes:
        "ชวนคลิกสลับเลนส์ 3 ระดับบนแผนภาพภูเขาน้ำแข็งเพื่อเล่าเรื่อง Revolving-door patient (ผู้ป่วยกลับมานอน รพ. ซ้ำด้วยโรคเดิม) แล้วเชื่อมสู่ปณิธานก่อตั้งเวชศาสตร์ชุมชน รามาธิบดี ตั้งแต่ พ.ศ. 2511 โดย ศ.นพ.อารี วัลยะเสวี และ ศ.นพ.เปรม บุรี เพื่อสร้างแพทย์ที่เป็น Change Agent",
      render: () => {
        const lens = S02_LENSES[ui.s02Lens] || S02_LENSES[2];
        const era = S02_ERAS[ui.s02Era] || S02_ERAS[2];
        return `
          <div class="or-infog-split">
            <div class="or-schematic-box">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5cqw;flex-wrap:wrap">
                <span class="or-card-kicker" style="margin:0">ICEBERG &amp; 3 PILLARS ZOOM SCHEMATIC</span>
                <div class="or-lens-bar" role="tablist" aria-label="สลับเลนส์การมองปัญหาสุขภาพ">
                  ${S02_LENSES.map(
                    (l) => `
                    <button type="button" class="or-lens-btn${ui.s02Lens === l.id ? " is-active" : ""}" data-or-set="s02Lens:${l.id}">${esc(l.short)}</button>
                  `
                  ).join("")}
                </div>
              </div>

              <svg class="or-svg-diagram" viewBox="0 0 560 192" aria-label="แผนภาพภูเขาน้ำแข็งสุขภาพและ 3 เสาหลักแพทยศาสตรศึกษา">
                <!-- Waterline -->
                <rect x="8" y="68" width="544" height="118" rx="10" fill="#f0f9ff" stroke="#bae6fd" stroke-dasharray="4 3"/>
                <line x1="8" y1="68" x2="552" y2="68" stroke="#0284c7" stroke-width="2" stroke-dasharray="6 4"/>
                <rect x="14" y="47" width="114" height="17" rx="4" fill="#e0f2fe"/>
                <text x="71" y="59" text-anchor="middle" font-size="9.5" font-weight="800" fill="#0369a1">ผิวน้ำ: OPD / Ward</text>

                <!-- Stratum 1: Tip of Iceberg (Bedside) -->
                <g class="or-svg-node" data-or-set="s02Lens:0" opacity="${ui.s02Lens === 0 || ui.s02Lens === 2 ? "1" : "0.48"}">
                  <polygon points="164,10 416,10 438,65 142,65" fill="${ui.s02Lens === 0 ? "#0072B2" : "#dbeafe"}" stroke="#0072B2" stroke-width="2"/>
                  <text x="290" y="32" text-anchor="middle" font-size="11.8" font-weight="800" fill="${ui.s02Lens === 0 ? "#ffffff" : "#0f172a"}">① ข้างเตียง (Bedside Care)</text>
                  <text x="290" y="51" text-anchor="middle" font-size="10.2" font-weight="600" fill="${ui.s02Lens === 0 ? "#e0f2fe" : "#1e3a8a"}">Basic + Clinical Science: โรค อาการ ยา หัตถการ</text>
                </g>

                <!-- Stratum 2: Community, Work & SDH/CDH -->
                <g class="or-svg-node" data-or-set="s02Lens:1" opacity="${ui.s02Lens === 1 || ui.s02Lens === 2 ? "1" : "0.48"}">
                  <polygon points="136,72 444,72 468,125 112,125" fill="${ui.s02Lens === 1 ? "#009E73" : "#ccfbf1"}" stroke="#009E73" stroke-width="2"/>
                  <text x="290" y="94" text-anchor="middle" font-size="11.8" font-weight="800" fill="${ui.s02Lens === 1 ? "#ffffff" : "#0f172a"}">② วิถีชุมชน อาชีพ &amp; ปัจจัยกำหนดสุขภาพ (SDH / CDH)</text>
                  <text x="290" y="113" text-anchor="middle" font-size="10.2" font-weight="600" fill="${ui.s02Lens === 1 ? "#ecfdf5" : "#115e59"}">รายได้ · สภาพงาน · สิ่งแวดล้อม · พฤติกรรม · ครอบครัว · อสม.</text>
                </g>

                <!-- Stratum 3: Health Systems Science -->
                <g class="or-svg-node" data-or-set="s02Lens:2" opacity="${ui.s02Lens === 2 ? "1" : "0.52"}">
                  <polygon points="106,131 474,131 500,182 80,182" fill="${ui.s02Lens === 2 ? "#002d72" : "#e0e7ff"}" stroke="#002d72" stroke-width="2"/>
                  <text x="290" y="153" text-anchor="middle" font-size="12" font-weight="800" fill="${ui.s02Lens === 2 ? "#ffffff" : "#0f172a"}">③ เสาหลักที่ 3: Health Systems Science &amp; Epidemiology</text>
                  <text x="290" y="172" text-anchor="middle" font-size="10.2" font-weight="600" fill="${ui.s02Lens === 2 ? "#bae6fd" : "#1e3a8a"}">ระบบบริการปฐมภูมิ (PHC) · 6 Building Blocks · สิทธิ UHC · นโยบายสาธารณะ</text>
                </g>
              </svg>

              <div class="or-card is-navy-tint or-mt-auto" style="padding:0.56cqw 0.85cqw;gap:0.18cqw">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5cqw">
                  <span class="or-card-kicker">${esc(lens.pillar)}</span>
                  <span style="font-size:clamp(8.5px,0.84cqw,12px);font-weight:700;color:#0f766e">คลิกชั้นภูเขาน้ำแข็งเพื่อเปรียบเทียบ</span>
                </div>
                <div style="font-size:clamp(9.8px,1.02cqw,14.5px);font-weight:700;color:inherit">${esc(lens.caseStory)}</div>
                <div style="font-size:clamp(9.2px,0.94cqw,13.4px);color:#475569">${esc(lens.limit)}</div>
              </div>
            </div>

            <div class="or-inspector-box">
              <div>
                <span class="or-card-kicker">รากฐานเวชศาสตร์ชุมชน รามาธิบดี (คลิกช่วงปี)</span>
                <h3 class="or-card-title" style="margin-top:0.2cqw">ปณิธาน ศ.นพ.อารี วัลยะเสวี &amp; ศ.นพ.เปรม บุรี</h3>
                <p class="or-card-text" style="margin-top:0.25cqw">“เตรียมบัณฑิตแพทย์ให้เข้าใจชีวิตจริงของสังคมไทย ทำงานร่วมกับชุมชนและระบบสาธารณสุขได้อย่างมีประสิทธิภาพและเป็น <strong>Change Agent</strong>”</p>
              </div>

              <div style="display:flex;flex-direction:column;gap:0.38cqw">
                ${S02_ERAS.map(
                  (e, i) => `
                  <button type="button" class="or-node-btn${ui.s02Era === i ? " is-selected" : ""}" data-or-set="s02Era:${i}">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw">
                      <span style="font-family:var(--font-display);font-size:clamp(8.8px,0.9cqw,13px);font-weight:800;color:#0072B2">${esc(e.yr)}</span>
                      <span style="font-size:clamp(8.5px,0.85cqw,12px);font-weight:700;color:#64748b">${i === ui.s02Era ? "● กำลังแสดง" : "คลิกดู"}</span>
                    </div>
                    <div style="font-family:var(--font-display);font-size:clamp(9.8px,1.02cqw,14.6px);font-weight:700">${esc(e.title)}</div>
                    ${i === ui.s02Era ? `<div style="font-size:clamp(9px,0.92cqw,13.2px);line-height:1.38;color:#475569">${esc(e.detail)}</div>` : ""}
                  </button>
                `
                ).join("")}
              </div>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">NotebookLM Takeaway</span>
            <span class="or-story-a">การรักษาในโรงพยาบาลช่วยชีวิตผู้ป่วยตรงหน้า แต่ <strong>เวชศาสตร์ชุมชนและวิทยาระบบสุขภาพ</strong> ช่วยเปลี่ยนบริบทที่ทำให้คนนับหมื่นไม่ต้องป่วยซ้ำ</span>
          </div>
        `;
      }
    },
    {
      id: "s03-course-objectives",
      num: "03",
      section: "objectives",
      sectionLabel: "01 · Objectives",
      actClass: "",
      actLabel: "ACT I · THE WHY",
      timeWindow: "09.04 – 09.06 น. (2 นาที)",
      kicker: "01 · COURSE GOALS (ก–ง) MAPPED TO 5 CORE COMPETENCIES",
      title: "แผนผังสะพานเชื่อม: จากวัตถุประสงค์รายวิชา (ก–ง) สู่สมรรถนะหลัก 5 ด้าน",
      lead: "คลิกที่วัตถุประสงค์ ก–ง หรือสมรรถนะ C1–C5 เพื่อดูเส้นทางเชื่อมโยงสู่บทเรียนและเครื่องมือประเมินผลจริง",
      notes:
        "ใช้แผนภาพสะพานเชื่อม (Interactive Bridge Diagram) ชี้ให้นักศึกษาเห็นว่าวัตถุประสงค์ ก–ง ในคู่มือรายวิชา ไม่ได้ลอยอยู่ตามลำพัง แต่ทุกข้อวิ่งเข้าสู่สมรรถนะหลัก 5 ด้านที่จะใช้ประเมินผลในสัปดาห์ที่ 1–6",
      render: () => {
        const f = ui.s03Focus;
        const isLinkActive = (gId, cId) => {
          if (f === "all") return true;
          if (f === gId) return true;
          if (f === cId) return true;
          return false;
        };
        const goalY = { gA: 42, gB: 108, gC: 174, gD: 240 };
        const compY = { c1: 32, c2: 86, c3: 140, c4: 194, c5: 248 };
        const links = [
          ["gA", "c1", "#0072B2"],
          ["gA", "c3", "#0284C7"],
          ["gB", "c3", "#0284C7"],
          ["gB", "c5", "#D55E00"],
          ["gC", "c1", "#0072B2"],
          ["gC", "c2", "#009E73"],
          ["gC", "c3", "#0284C7"],
          ["gD", "c2", "#009E73"],
          ["gD", "c4", "#E69F00"],
          ["gD", "c5", "#D55E00"]
        ];

        const activeGoal = S03_GOALS.find((g) => g.id === f);
        const activeComp = S03_COMPS.find((c) => c.id === f);

        return `
          <div class="or-infog-split is-wide-left">
            <div class="or-schematic-box">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5cqw;flex-wrap:wrap">
                <span class="or-card-kicker" style="margin:0">OBJECTIVES (ก–ง) &rarr; 5 COMPETENCIES BRIDGE</span>
                <div class="or-lens-bar">
                  <button type="button" class="or-lens-btn${f === "all" ? " is-active" : ""}" data-or-set="s03Focus:all">แสดงทุกเส้นเชื่อม</button>
                  ${S03_GOALS.map(
                    (g) => `<button type="button" class="or-lens-btn${f === g.id ? " is-active" : ""}" data-or-set="s03Focus:${g.id}">หมวด ${g.code}</button>`
                  ).join("")}
                </div>
              </div>

              <svg class="or-svg-diagram" viewBox="0 0 640 280" aria-label="แผนผังเชื่อมวัตถุประสงค์รายวิชา ก ถึง ง เข้ากับสมรรถนะหลัก 5 ด้าน">
                <!-- Curved Bezier Connectors -->
                ${links
                  .map(([gId, cId, col]) => {
                    const active = isLinkActive(gId, cId);
                    const y1 = goalY[gId];
                    const y2 = compY[cId];
                    return `<path d="M 242 ${y1} C 318 ${y1}, 322 ${y2}, 398 ${y2}" fill="none" stroke="${col}" stroke-width="${active ? (f === "all" ? "2.6" : "4") : "1.4"}" opacity="${active ? (f === "all" ? "0.62" : "0.95") : "0.12"}"/>`;
                  })
                  .join("")}

                <!-- Left Nodes: Course Objectives ก-ง -->
                ${S03_GOALS.map((g) => {
                  const y = goalY[g.id] - 24;
                  const sel = f === g.id || (activeComp && activeComp.goals.includes(g.id));
                  const dim = f !== "all" && !sel;
                  return `
                    <g class="or-svg-node" data-or-set="s03Focus:${g.id}" opacity="${dim ? "0.35" : "1"}">
                      <rect x="8" y="${y}" width="234" height="48" rx="9" fill="${f === g.id ? "#002d72" : "#f8fafc"}" stroke="${sel ? "#002d72" : "#94a3b8"}" stroke-width="${sel ? "2.2" : "1.3"}"/>
                      <rect x="16" y="${y + 10}" width="28" height="28" rx="6" fill="${f === g.id ? "#ffffff" : "#002d72"}"/>
                      <text x="30" y="${y + 29}" text-anchor="middle" font-size="12.5" font-weight="800" fill="${f === g.id ? "#002d72" : "#ffffff"}">${g.code}</text>
                      <text x="52" y="${y + 21}" font-size="11.5" font-weight="800" fill="${f === g.id ? "#ffffff" : "#0f172a"}">${esc(g.name)}</text>
                      <text x="52" y="${y + 37}" font-size="10" font-weight="600" fill="${f === g.id ? "#dbeafe" : "#475569"}">${esc(g.sub)}</text>
                    </g>
                  `;
                }).join("")}

                <!-- Right Nodes: 5 Core Competencies -->
                ${S03_COMPS.map((c) => {
                  const y = compY[c.id] - 20;
                  const sel = f === c.id || (activeGoal && activeGoal.comps.includes(c.id));
                  const dim = f !== "all" && !sel;
                  return `
                    <g class="or-svg-node" data-or-set="s03Focus:${c.id}" opacity="${dim ? "0.35" : "1"}">
                      <rect x="398" y="${y}" width="234" height="40" rx="8" fill="${f === c.id ? c.color : "#ffffff"}" stroke="${c.color}" stroke-width="${sel ? "2.2" : "1.4"}"/>
                      <circle cx="414" cy="${y + 20}" r="5.5" fill="${f === c.id ? "#ffffff" : c.color}"/>
                      <text x="426" y="${y + 17}" font-size="11.2" font-weight="800" fill="${f === c.id ? "#ffffff" : "#0f172a"}">${esc(c.short)}</text>
                      <text x="426" y="${y + 31}" font-size="9.6" font-weight="600" fill="${f === c.id ? "#f8fafc" : "#475569"}">${esc(c.th)}</text>
                    </g>
                  `;
                }).join("")}
              </svg>
            </div>

            <div class="or-inspector-box is-navy">
              ${
                activeGoal
                  ? `
                  <div>
                    <span class="or-card-kicker">วัตถุประสงค์หมวด ${esc(activeGoal.code)} · SELECTED</span>
                    <h3 class="or-card-title" style="margin-top:0.2cqw">${esc(activeGoal.name)} — ${esc(activeGoal.sub)}</h3>
                    <p class="or-card-text" style="margin-top:0.35cqw">${esc(activeGoal.story)}</p>
                  </div>
                  <div class="or-card is-white" style="padding:0.65cqw 0.8cqw">
                    <span class="or-card-kicker">บทเรียนและชิ้นงานที่รองรับ</span>
                    <p class="or-card-text">${esc(activeGoal.modules)}</p>
                  </div>
                  <div style="font-size:clamp(9px,0.92cqw,13px);font-weight:700;color:#0369a1">
                    เชื่อมสู่สมรรถนะหลัก: ${activeGoal.comps.map((cid) => cid.toUpperCase()).join(" · ")}
                  </div>
                `
                  : activeComp
                    ? `
                  <div>
                    <span class="or-card-kicker">CORE COMPETENCY · SELECTED</span>
                    <h3 class="or-card-title" style="margin-top:0.2cqw">${esc(activeComp.short)}</h3>
                    <p class="or-card-text" style="margin-top:0.3cqw"><strong>${esc(activeComp.th)}</strong> — พัฒนาขึ้นจากการบูรณาการวัตถุประสงค์หมวด ${activeComp.goals.map((gid) => S03_GOALS.find((x) => x.id === gid).code).join(" และ ")}</p>
                  </div>
                  <div class="or-card is-white" style="padding:0.65cqw 0.8cqw">
                    <span class="or-card-kicker">ความหมายต่อผู้เรียน</span>
                    <p class="or-card-text">สมรรถนะด้านนี้จะถูกฝึกแบบ Formative ตลอดรายวิชา ก่อนประเมินตัดสินผลในตารางแม่บท Slide 09</p>
                  </div>
                  <button type="button" class="or-jump-btn" data-or-jump="8">ดูผังการวัดผลสมรรถนะนี้ใน Slide 09 &rarr;</button>
                `
                    : `
                  <div>
                    <span class="or-card-kicker">HOW TO READ THIS MAP</span>
                    <h3 class="or-card-title" style="margin-top:0.2cqw">ทำไมต้องเชื่อม ก–ง เข้ากับ 5 สมรรถนะ?</h3>
                    <p class="or-card-text" style="margin-top:0.3cqw">หลักสูตรแพทยศาสตรศึกษายุคใหม่ไม่ได้แยกวัดแค่ “จำเนื้อหาได้ไหม” แต่ถักทอความรู้ ทักษะ ระบบคิด และจริยธรรมเข้าด้วยกัน:</p>
                  </div>
                  <ul class="or-list" style="gap:0.28cqw">
                    <li><strong>ก. Cognitive:</strong> รู้ลึก <code>EP1–9</code> และ <code>HS1–6</code></li>
                    <li><strong>ข. Awareness:</strong> ตระหนักบทบาทผู้นำ &amp; ศักยภาพชุมชน</li>
                    <li><strong>ค. Skills:</strong> วิเคราะห์ สำรวจจริง สื่อสารทำงานเป็นทีม</li>
                    <li><strong>ง. Character:</strong> รับผิดชอบร่วมกัน &amp; สะท้อนคิด (<code>SRN 1–2</code>)</li>
                  </ul>
                  <div style="font-size:clamp(8.8px,0.9cqw,12.8px);font-weight:700;color:#0072B2">คลิกโหนดซ้ายหรือขวาบนแผนภาพเพื่อแยกดูเส้นเชื่อม</div>
                `
              }
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">NotebookLM Synthesis</span>
            <span class="or-story-a">ทุกกิจกรรมใน RACM 303 มีเหตุผลรองรับเสมอ — <strong>ไม่มีงานชิ้นใดเป็นภาระลอย ๆ</strong> เพราะทุกชิ้นผูกตรงกับสมรรถนะแพทย์ทั้ง 5 ด้าน</span>
          </div>
        `;
      }
    },
    {
      id: "s04-fieldwork-5obj",
      num: "04",
      section: "objectives",
      sectionLabel: "01 · Objectives",
      actClass: "",
      actLabel: "ACT I · THE WHY",
      timeWindow: "09.06 – 09.08 น. (2 นาที)",
      kicker: "01 · 5 INTEGRATED FIELDWORK LENSES FOR ALL 9 SITES",
      title: "แว่นขยาย 5 เลนส์ในพื้นที่ภาคสนาม: โจทย์บูรณาการเดียวกันทั้ง 9 โรงพยาบาลชุมชน",
      lead: "คลิกแต่ละเลนส์ (01–05) บนเข็มทิศระบบสุขภาพอำเภอ เพื่อดูคำถามสืบค้นหน้างาน เครื่องมือ และงานนำเสนอปลายทาง",
      notes:
        "ใช้เข็มทิศ 5 เลนส์อธิบายให้นักศึกษาเห็นภาพว่าเมื่อก้าวลงพื้นที่ รพช. ทั้ง 9 แห่ง ไม่ได้ไปเดินดูงานเฉย ๆ แต่ต้องสวมแว่น 5 เลนส์นี้เพื่อสังเคราะห์นำเสนอในฟอร์ม 3A (ครบ 5 ข้อ) และต่อยอดข้อ 05 สู่ฟอร์ม 4A",
      render: () => {
        const cur = S04_FIELD_OBJS[ui.s04Obj] || S04_FIELD_OBJS[2];
        const coords = [
          { x: 280, y: 40 },
          { x: 472, y: 108 },
          { x: 410, y: 226 },
          { x: 150, y: 226 },
          { x: 88, y: 108 }
        ];
        return `
          <div class="or-infog-split">
            <div class="or-schematic-box">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5cqw">
                <span class="or-card-kicker" style="margin:0">5-LENS DISTRICT ECOSYSTEM COMPASS</span>
                <span class="or-interactive-pill">คลิกโหนด 01–05 เพื่อส่องคำถามหน้างาน</span>
              </div>

              <svg class="or-svg-diagram" viewBox="0 0 560 268" aria-label="เข็มทิศ 5 วัตถุประสงค์การเรียนรู้ภาคสนาม">
                <circle cx="280" cy="142" r="96" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="5 4"/>
                ${coords
                  .map((pt, i) => {
                    const active = ui.s04Obj === i;
                    const item = S04_FIELD_OBJS[i];
                    return `<line x1="280" y1="142" x2="${pt.x}" y2="${pt.y}" stroke="${active ? item.color : "#cbd5e1"}" stroke-width="${active ? "3.2" : "1.6"}"/>`;
                  })
                  .join("")}

                <!-- Center Hub -->
                <circle cx="280" cy="142" r="46" fill="#0f172a" stroke="#334155" stroke-width="2"/>
                <text x="280" y="137" text-anchor="middle" font-size="11" font-weight="800" fill="#ffffff">9 รพช. &amp; ชุมชน</text>
                <text x="280" y="153" text-anchor="middle" font-size="9.5" font-weight="600" fill="#93c5fd">ฟอร์ม 3A + 4A</text>

                <!-- 5 Satellite Nodes -->
                ${S04_FIELD_OBJS.map((item, i) => {
                  const pt = coords[i];
                  const active = ui.s04Obj === i;
                  return `
                    <g class="or-svg-node" data-or-set="s04Obj:${i}">
                      <rect x="${pt.x - 82}" y="${pt.y - 24}" width="164" height="48" rx="10" fill="${active ? item.color : "#ffffff"}" stroke="${item.color}" stroke-width="${active ? "2.5" : "1.6"}"/>
                      <text x="${pt.x}" y="${pt.y - 4}" text-anchor="middle" font-size="11" font-weight="800" fill="${active ? "#ffffff" : "#0f172a"}">${item.num} · ${esc(item.short)}</text>
                      <text x="${pt.x}" y="${pt.y + 13}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${active ? "#f8fafc" : item.color}">${esc(item.chips)}</text>
                    </g>
                  `;
                }).join("")}
              </svg>
            </div>

            <div class="or-inspector-box is-teal">
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5cqw">
                  <span class="or-num-badge" style="background:${cur.color}">${cur.num}</span>
                  <span class="or-mini-chip">${esc(cur.chips)}</span>
                </div>
                <h3 class="or-card-title" style="margin-top:0.4cqw">เลนส์ที่ ${cur.num}: ${esc(cur.short)}</h3>
              </div>

              <div class="or-card is-white" style="padding:0.62cqw 0.8cqw;gap:0.2cqw">
                <span class="or-card-kicker">คำถามสืบค้นในพื้นที่จริง (KEY INQUIRY)</span>
                <p class="or-card-text" style="font-weight:700">${esc(cur.question)}</p>
              </div>

              <div class="or-card is-white" style="padding:0.62cqw 0.8cqw;gap:0.2cqw">
                <span class="or-card-kicker">เครื่องมือและทฤษฎีที่นำไปจับ</span>
                <p class="or-card-text">${esc(cur.tools)}</p>
              </div>

              <div style="font-size:clamp(9.2px,0.94cqw,13.4px);font-weight:700;color:#0f766e">
                ผลลัพธ์สัปดาห์ที่ 6: ${esc(cur.output)}
              </div>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">Fieldwork Rule of 5</span>
            <span class="or-story-a">การนำเสนอระบบสุขภาพ (<strong>ฟอร์ม 3A · 29 ธ.ค.</strong>) ต้องร้อยเรียงให้เห็นความเชื่อมโยงครบทั้ง <strong>5 เลนส์</strong> ส่วนผลสำรวจเชิงปริมาณในเลนส์ที่ 05 นำไปอภิปรายต่อใน <strong>ฟอร์ม 4A · 30 ธ.ค.</strong></span>
          </div>
        `;
      }
    },
    {
      id: "s05-roadmap-6weeks",
      num: "05",
      section: "experience",
      sectionLabel: "02 · Learning Experience",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.08 – 09.11 น. (3 นาที)",
      kicker: "02 · 6-WEEK LEARNING JOURNEY (25 NOV – 30 DEC 2569)",
      title: "แผนที่เดินทาง 6 สัปดาห์: ปูกรอบคิด 3 สัปดาห์ → ฝังตัวพื้นที่จริง → สังเคราะห์เชิงระบบ",
      lead: "คลิกเลือกแต่ละสัปดาห์ (W1–W6) เพื่อสำรวจจังหวะการเรียน จุดสอบสำคัญ และสัดส่วนกิจกรรมการเรียนรู้",
      notes:
        "คลิกไล่จาก W1 ถึง W6 เพื่อให้นักศึกษาเห็นจังหวะชีวิตตลอด 6 สัปดาห์อย่างชัดเจน: สอบ EP ก่อนไปภาคสนาม (8 ธ.ค.), ส่ง SRN 1 (9 ธ.ค.), ลงพื้นที่จริง W4, กลับมาเตรียมโน้ต A4 สอบ HS Open Note (22 ธ.ค.) และปิดท้ายด้วยการนำเสนอ 3A/4A วันที่ 29–30 ธ.ค.",
      render: () => {
        const w = S05_WEEKS[ui.s05Week] || S05_WEEKS[0];
        return `
          <div style="display:flex;flex-direction:column;gap:0.65cqw;flex:1;min-height:0">
            <!-- 3-Phase Macro Ribbon -->
            <div style="display:grid;grid-template-columns:3fr 1fr 2fr;gap:0.55cqw">
              <div style="background:#e0f2fe;color:#0369a1;padding:0.26cqw 0.7cqw;border-radius:6px;font-family:var(--font-display);font-size:clamp(8.2px,0.82cqw,11.8px);font-weight:800">PHASE 1 · PRE-FIELDWORK FOUNDATION (W1–W3)</div>
              <div style="background:#ccfbf1;color:#0f766e;padding:0.26cqw 0.6cqw;border-radius:6px;font-family:var(--font-display);font-size:clamp(8.2px,0.82cqw,11.8px);font-weight:800;text-align:center">PHASE 2 · IMMERSION (W4)</div>
              <div style="background:#fef3c7;color:#b45309;padding:0.26cqw 0.7cqw;border-radius:6px;font-family:var(--font-display);font-size:clamp(8.2px,0.82cqw,11.8px);font-weight:800">PHASE 3 · POST-FIELDWORK SYNTHESIS (W5–W6)</div>
            </div>

            <!-- 6 Interactive Week Nodes -->
            <div class="or-grid-6">
              ${S05_WEEKS.map(
                (item, idx) => `
                <button type="button" class="or-node-btn${ui.s05Week === idx ? " is-selected" : ""}" data-or-set="s05Week:${idx}">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:0.3cqw">
                    <span class="or-num-badge" style="width:1.7cqw;height:1.7cqw;background:${item.color}">${item.wk}</span>
                    <span style="font-size:clamp(8px,0.8cqw,11.4px);font-weight:700;color:#64748b">${esc(item.dates)}</span>
                  </div>
                  <div style="font-family:var(--font-display);font-size:clamp(9.4px,0.98cqw,14px);font-weight:800;margin-top:0.15cqw;line-height:1.25">${esc(item.tag)}</div>
                </button>
              `
              ).join("")}
            </div>

            <!-- Selected Week Detail & Workload Proportion -->
            <div class="or-infog-split" style="flex:1">
              <div class="or-schematic-box">
                <div>
                  <span class="or-card-kicker" style="color:${w.color}">${esc(w.phase)} · ${esc(w.dates)}</span>
                  <h3 class="or-card-title" style="margin-top:0.18cqw">${esc(w.title)}</h3>
                </div>
                <ul class="or-list" style="margin-top:0.1cqw">
                  ${w.days.map((d) => `<li>${esc(d)}</li>`).join("")}
                </ul>
                <svg class="or-svg-diagram or-mt-auto" viewBox="0 0 540 54" aria-label="เส้นเวลาจุดสำคัญตลอด 6 สัปดาห์">
                  <line x1="28" y1="22" x2="512" y2="22" stroke="#cbd5e1" stroke-width="2.5"/>
                  ${[
                    [44, "25 พ.ย. เปิดวิชา", 0],
                    [156, "8 ธ.ค. สอบ EP", 2],
                    [268, "9–20 ธ.ค. 9 รพช.", 3],
                    [388, "22 ธ.ค. สอบ HS", 4],
                    [496, "29–30 ธ.ค. 3A/4A", 5]
                  ]
                    .map(
                      ([cx, lbl, wkMatch]) => `
                    <g class="or-svg-node" data-or-set="s05Week:${wkMatch}">
                      <circle cx="${cx}" cy="22" r="${ui.s05Week === wkMatch ? "7.5" : "5.5"}" fill="${ui.s05Week === wkMatch ? "#D55E00" : "#0072B2"}" stroke="#fff" stroke-width="1.5"/>
                      <text x="${cx}" y="44" text-anchor="middle" font-size="9.5" font-weight="700" fill="${ui.s05Week === wkMatch ? "#b91c1c" : "#475569"}">${lbl}</text>
                    </g>
                  `
                    )
                    .join("")}
                </svg>
              </div>

              <div class="or-inspector-box">
                <div>
                  <span class="or-card-kicker">WEEKLY RHYTHM &amp; ENERGY MIX (${w.wk})</span>
                  <h3 class="or-card-title" style="margin-top:0.18cqw">สัดส่วนรูปแบบการเรียนรู้ประจำสัปดาห์</h3>
                </div>
                <div class="or-stat-bar-list">
                  ${w.mix
                    .map(
                      (m) => `
                    <div class="or-stat-bar-row" style="cursor:default">
                      <div class="or-stat-bar-head"><span>${esc(m.lbl)}</span><span>${m.pct}%</span></div>
                      <div class="or-stat-bar-track"><div class="or-stat-bar-fill ${m.cls}" style="width:${m.pct}%"></div></div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
                <div class="or-card is-white or-mt-auto" style="padding:0.5cqw 0.72cqw;font-size:clamp(8.8px,0.9cqw,12.8px);color:#475569">
                  <span><strong>จุดสำคัญที่ห้ามพลาด:</strong> สอบ EP <code>8 ธ.ค.</code> &rarr; ส่ง SRN 1 <code>9 ธ.ค.</code> &rarr; สอบ HS <code>22 ธ.ค.</code> &rarr; นำเสนอ 3A/4A &amp; SRN 2 <code>29–30 ธ.ค.</code></span>
                </div>
              </div>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">Why This Sequence?</span>
            <span class="or-story-a">สอบระบาดวิทยาให้จบก่อนลงพื้นที่เพื่อใช้ทำ <strong>Health Survey</strong> ได้ทันที และกลับมาสอบระบบสุขภาพแบบ <strong>Open Note</strong> หลังเห็นโรงพยาบาลชุมชนจริงแล้ว</span>
          </div>
        `;
      }
    },
    {
      id: "s06-hs-guided-learning",
      num: "06",
      section: "experience",
      sectionLabel: "02 · Learning Experience",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.11 – 09.14 น. (3 นาที)",
      kicker: "02 · HEALTH SYSTEMS SCIENCE LEARNING ARCHITECTURE",
      title: "สถาปัตยกรรมการเรียนหมวดระบบสุขภาพ: Guided Learning 5 ขั้นตอน + 6 เวทีคิดเชิงระบบ",
      lead: "คลิกแต่ละขั้นตอน (①–⑤) และคลิกเลือก 6 เวทีคิดเชิงระบบด้านล่าง เพื่อดูวิธีเปลี่ยนความรู้เป็นสายตาเชิงระบบ",
      notes:
        "อธิบายลำดับ 5 ขั้นตอนของ HS1–HS6 ล่าสุด: ① ฉบับเต็ม → ② ฉบับย่อ → ③ Self-Quiz 60 ข้อ & 111 คำศัพท์ → ④ Slide อาจารย์ห้องใหญ่ 1 ชม. → ⑤ Case Discussion 6 กลุ่มย่อย 2 ชม. 20 นาที และชี้แจงความสำคัญของ 6 เวที Beyond HS1–HS6 (18.5 ชม.)",
      render: () => {
        const st = S06_STEPS[ui.s06Step] || S06_STEPS[2];
        const by = S06_BEYOND[ui.s06Beyond] || S06_BEYOND[0];
        return `
          <div style="display:flex;flex-direction:column;gap:0.65cqw;flex:1;min-height:0">
            <!-- 5-Step Interactive Conveyor -->
            <div class="or-grid-5">
              ${S06_STEPS.map(
                (s, i) => `
                <button type="button" class="or-node-btn${ui.s06Step === i ? " is-selected" : ""}" data-or-set="s06Step:${i}">
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <span style="font-family:var(--font-display);font-size:clamp(8px,0.8cqw,11.4px);font-weight:800;color:#0072B2">${esc(s.tag)}</span>
                    <span style="font-size:clamp(8.5px,0.85cqw,12px);font-weight:800;color:#94a3b8">&rarr;</span>
                  </div>
                  <div style="font-family:var(--font-display);font-size:clamp(10px,1.06cqw,15px);font-weight:800">${esc(s.title)}</div>
                  <div style="font-size:clamp(8.5px,0.86cqw,12.2px);color:#64748b">${esc(s.sub)}</div>
                </button>
              `
              ).join("")}
            </div>

            <div class="or-infog-split is-even" style="flex:1">
              <!-- Active Step Coach -->
              <div class="or-schematic-box">
                <div>
                  <span class="or-card-kicker">STEP ${st.no} FOCUS · ${esc(st.tag)}</span>
                  <h3 class="or-card-title" style="margin-top:0.18cqw">${esc(st.title)} (${esc(st.sub)})</h3>
                  <p class="or-card-text" style="margin-top:0.25cqw">${esc(st.what)}</p>
                </div>

                <svg class="or-svg-diagram" viewBox="0 0 460 52" aria-label="แผนผังการสะสมความเข้าใจจากขั้นตอนที่ 1 ถึง 5">
                  ${[0, 1, 2, 3, 4]
                    .map((k) => {
                      const x = 10 + k * 90;
                      const done = k <= ui.s06Step;
                      return `
                        <g class="or-svg-node" data-or-set="s06Step:${k}">
                          <rect x="${x}" y="8" width="76" height="34" rx="7" fill="${k === ui.s06Step ? "#0072B2" : done ? "#dbeafe" : "#f1f5f9"}" stroke="${done ? "#0072B2" : "#cbd5e1"}"/>
                          <text x="${x + 38}" y="29" text-anchor="middle" font-size="10.5" font-weight="800" fill="${k === ui.s06Step ? "#fff" : "#0f172a"}">Step 0${k + 1}</text>
                        </g>
                      `;
                    })
                    .join("")}
                </svg>

                <div class="or-card is-teal-tint or-mt-auto" style="padding:0.55cqw 0.8cqw;gap:0.15cqw">
                  <span class="or-card-kicker">ต่อยอดสู่ห้องสอบ Open Note &amp; พื้นที่จริงอย่างไร?</span>
                  <p class="or-card-text" style="font-weight:600">${esc(st.whyA4)}</p>
                </div>
              </div>

              <!-- Beyond HS1-HS6 Interactive Explorer -->
              <div class="or-inspector-box is-amber">
                <div>
                  <span class="or-card-kicker">BEYOND HS1–HS6 · 6 เวทีคิดเชิงระบบ (18.5 ชม.)</span>
                  <h3 class="or-card-title" style="margin-top:0.15cqw">ไม่ได้ออกสอบข้อเขียน — แต่เป็นหัวใจของภาคสนาม ฟอร์ม 3A &amp; SRN</h3>
                </div>
                <div class="or-chip-row">
                  ${S06_BEYOND.map(
                    (b, idx) => `
                    <button type="button" class="or-lens-btn${ui.s06Beyond === idx ? " is-active" : ""}" style="font-size:clamp(8px,0.8cqw,11.4px);padding:0.22cqw 0.52cqw" data-or-set="s06Beyond:${idx}">${esc(b.name)}</button>
                  `
                  ).join("")}
                </div>
                <div class="or-card is-white or-mt-auto" style="padding:0.55cqw 0.75cqw;gap:0.15cqw">
                  <span class="or-card-kicker">${esc(by.name)}</span>
                  <p class="or-card-text">${esc(by.role)}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">Guided Learning Secret</span>
            <span class="or-story-a">คนที่ได้เกรด O ในหมวด HS ไม่ใช่คนที่ลอกตัวหนังสือเล็กที่สุดลงกระดาษ A4 แต่คือคนที่ <strong>ผ่านครบ 5 ขั้นตอนจนเข้าใจโครงสร้างระบบด้วยภาษาของตนเอง</strong></span>
          </div>
        `;
      }
    },
    {
      id: "s07-epidemiology",
      num: "07",
      section: "experience",
      sectionLabel: "02 · Learning Experience",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.14 – 09.16 น. (2 นาที)",
      kicker: "02 · CLINICAL & COMMUNITY EPIDEMIOLOGY PIPELINE (EP1–EP9)",
      title: "ท่อส่งต่อความรู้ระบาดวิทยา: จากการอ่านหลักฐานคลินิก สู่การทำ Health Survey ด้วย SPSS",
      lead: "คลิกแต่ละระยะ (Day 1 → Day 2 → Day 3 → Field Survey) เพื่อดูรูปแบบการเรียน แบบฝึกหัด และการนำไปใช้จริง",
      notes:
        "ย้ำตารางเรียนระบาดวิทยาที่อัปเดตล่าสุด: วันศุกร์ที่ 27 พ.ย. บรรยาย EP1–EP3 เวลา 08.30–11.00 น. (ห้อง 2A01 + Zoom) และหลัง 11.00 น. ทำ Exercise 1–2 แบบ SDL ในระบบ E-learning ส่วนวันที่ 2–3 ธ.ค. เรียนแบบ Hybrid เพื่อเตรียมสอบเช้า 8 ธ.ค. และเรียน SPSS บ่าย 8 ธ.ค.",
      render: () => {
        const stg = S07_STAGES[ui.s07Stage] || S07_STAGES[0];
        return `
          <div class="or-infog-split">
            <div class="or-schematic-box">
              <span class="or-card-kicker">4-STAGE EPIDEMIOLOGY-TO-ACTION PIPELINE (คลิกเลือกระยะ)</span>

              <svg class="or-svg-diagram" viewBox="0 0 520 50" aria-label="แผนภาพท่อส่งต่อความรู้ระบาดวิทยา 4 ระยะ">
                ${[
                  ["Day 1 · 27 พ.ย.", "EP1–3 + SDL", "#0072B2"],
                  ["Day 2 · 2 ธ.ค.", "EP4–5 Hybrid", "#0284C7"],
                  ["Day 3 · 3 ธ.ค.", "EP6–9 Hybrid", "#009E73"],
                  ["8–30 ธ.ค.", "Exam·SPSS·4A", "#D55E00"]
                ]
                  .map(([t1, t2, col], k) => {
                    const x = 6 + k * 129;
                    const active = ui.s07Stage === k;
                    return `
                      <g class="or-svg-node" data-or-set="s07Stage:${k}">
                        <rect x="${x}" y="4" width="120" height="42" rx="8" fill="${active ? col : "#f8fafc"}" stroke="${col}" stroke-width="${active ? "2.2" : "1.3"}"/>
                        <text x="${x + 60}" y="21" text-anchor="middle" font-size="9.8" font-weight="800" fill="${active ? "#fff" : "#0f172a"}">${t1}</text>
                        <text x="${x + 60}" y="36" text-anchor="middle" font-size="9.2" font-weight="700" fill="${active ? "#f8fafc" : col}">${t2}</text>
                      </g>
                    `;
                  })
                  .join("")}
              </svg>

              <div style="display:flex;flex-direction:column;gap:0.38cqw">
                ${S07_STAGES.map(
                  (s, i) => `
                  <button type="button" class="or-node-btn${ui.s07Stage === i ? " is-selected" : ""}" data-or-set="s07Stage:${i}" style="padding:0.46cqw 0.7cqw">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5cqw;flex-wrap:wrap">
                      <span style="font-family:var(--font-display);font-size:clamp(8.6px,0.88cqw,12.6px);font-weight:800;color:#0072B2">${esc(s.code)} · ${esc(s.when)}</span>
                      <span class="or-mini-chip" style="padding:0.08cqw 0.42cqw">${esc(s.room)}</span>
                    </div>
                    <div style="font-family:var(--font-display);font-size:clamp(9.6px,1cqw,14.2px);font-weight:700">${esc(s.topics)}</div>
                  </button>
                `
                ).join("")}
              </div>
            </div>

            <div class="or-inspector-box is-navy">
              <div>
                <span class="or-card-kicker">${esc(stg.code)} · ${esc(stg.when)}</span>
                <h3 class="or-card-title" style="margin-top:0.2cqw">${esc(stg.topics)}</h3>
                <p class="or-card-text" style="margin-top:0.22cqw;font-weight:700;color:#0369a1">${esc(stg.sdl)}</p>
              </div>

              <div class="or-card is-white" style="padding:0.6cqw 0.8cqw">
                <span class="or-card-kicker">แนวคิดหลักที่ต้องแม่น</span>
                <ul class="or-list" style="gap:0.24cqw">
                  ${stg.concepts.map((c) => `<li>${esc(c)}</li>`).join("")}
                </ul>
              </div>

              <div class="or-card is-teal-tint" style="padding:0.55cqw 0.75cqw;gap:0.15cqw">
                <span class="or-card-kicker">เชื่อมสู่ปฏิบัติการภาคสนาม (ฟอร์ม 4A)</span>
                <p class="or-card-text">${esc(stg.fieldLink)}</p>
              </div>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">Schedule Update</span>
            <span class="or-story-a">วันศุกร์ที่ 27 พ.ย. บรรยาย <code>EP1–EP3</code> เวลา <strong>08.30–11.00 น.</strong> (Auditorium 2A01 + Zoom) และหลัง 11.00 น. ฝึกทำ <strong>Exercise 1–2 แบบ SDL ใน E-learning</strong></span>
          </div>
        `;
      }
    },
    {
      id: "s08-fieldwork-9sites",
      num: "08",
      section: "experience",
      sectionLabel: "02 · Learning Experience",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.16 – 09.19 น. (3 นาที)",
      kicker: "02 · KOLB'S EXPERIENTIAL CYCLE & 9 COMMUNITY HOSPITALS MAP",
      title: "แผนที่เครือข่าย 9 โรงพยาบาลชุมชน และการเรียนรู้จากประสบการณ์จริง (Kolb's Cycle)",
      lead: "คลิกหมุดบนแผนที่หรือเลือกกลุ่ม (1–9) เพื่อดูอาจารย์ที่ปรึกษา ห้องกลุ่มย่อย และวันเดินทางของแต่ละพื้นที่",
      notes:
        "ชวนนักศึกษาคลิกดูพื้นที่ภาคสนามของกลุ่มตนเองบนแผนที่ประเทศไทย พร้อมย้ำหัวใจของ Kolb's Cycle ตลอดกลุ่มย่อย 13 ครั้ง (เตรียมตัว SG 1–6 → ประสบการณ์ตรง 7–9 คืน → ถอดบทเรียนและสังเคราะห์ SG 7–13)",
      render: () => {
        const cur = S08_SITES[ui.s08Group] || S08_SITES[0];
        const visibleSites = S08_SITES.filter((s) => ui.s08Region === "all" || s.reg === ui.s08Region);
        return `
          <div class="or-infog-split is-map-left">
            <!-- Stylized Thailand Schematic Map + Kolb Cycle -->
            <div class="or-schematic-box" style="padding:0.75cqw 0.95cqw">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span class="or-card-kicker" style="margin:0">9 COMMUNITY HOSPITALS NETWORK</span>
                <span style="font-size:clamp(8.2px,0.82cqw,11.6px);font-weight:700;color:#0f766e">169 นศพ. · 7–9 คืน</span>
              </div>

              <svg class="or-svg-diagram" viewBox="0 0 260 278" style="max-height:20.5cqw" aria-label="แผนที่เครือข่ายโรงพยาบาลชุมชนทั้ง 9 แห่ง">
                <!-- Stylized Thailand Silhouette -->
                <path d="M84,26 L132,32 L148,66 L198,84 L212,134 L168,158 L132,156 L116,184 L106,226 L122,266 L90,270 L78,224 L94,174 L74,148 L56,112 L62,64 Z" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.8" stroke-linejoin="round"/>
                <!-- Bangkok Reference -->
                <circle cx="116" cy="164" r="3.5" fill="#64748b"/>
                <text x="124" y="167" font-size="8.5" font-weight="700" fill="#64748b">รามาธิบดี</text>

                <!-- Connection line to active site -->
                <line x1="116" y1="164" x2="${cur.x}" y2="${cur.y}" stroke="#0072B2" stroke-width="1.6" stroke-dasharray="4 3"/>

                <!-- 9 Hospital Pins -->
                ${S08_SITES.map((s, idx) => {
                  const isSel = ui.s08Group === idx;
                  const inReg = ui.s08Region === "all" || s.reg === ui.s08Region;
                  return `
                    <g class="or-svg-node" data-or-set="s08Group:${idx}" opacity="${inReg ? "1" : "0.25"}">
                      ${isSel ? `<circle cx="${s.x}" cy="${s.y}" r="14" fill="rgba(213,94,0,0.22)"/>` : ""}
                      <circle cx="${s.x}" cy="${s.y}" r="${isSel ? "9.5" : "7.5"}" fill="${isSel ? "#D55E00" : "#002d72"}" stroke="#ffffff" stroke-width="1.8"/>
                      <text x="${s.x}" y="${s.y + 3.2}" text-anchor="middle" font-size="8.5" font-weight="800" fill="#ffffff">${s.g}</text>
                    </g>
                  `;
                }).join("")}
              </svg>

              <!-- Compact Kolb Cycle Strip -->
              <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:0.42cqw 0.6cqw;font-size:clamp(8.2px,0.83cqw,11.8px);line-height:1.32;color:#115e59">
                <strong>Kolb's Cycle (13 กลุ่มย่อย):</strong> เตรียมกรอบ (<code>SG 1–6</code>) &rarr; สัมผัสจริง 7–9 คืน &rarr; สะท้อนคิด &amp; สังเคราะห์ทฤษฎี (<code>SG 7–13</code>)
              </div>
            </div>

            <!-- Interactive Region Filter + 9-Group Selector + Active Site Card -->
            <div class="or-inspector-box" style="padding:0.8cqw 1cqw">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw;flex-wrap:wrap">
                <div class="or-lens-bar">
                  <button type="button" class="or-lens-btn${ui.s08Region === "all" ? " is-active" : ""}" data-or-set="s08Region:all">ทั้งหมด (9)</button>
                  <button type="button" class="or-lens-btn${ui.s08Region === "north" ? " is-active" : ""}" data-or-set="s08Region:north">เหนือ/ตาก (3)</button>
                  <button type="button" class="or-lens-btn${ui.s08Region === "isan" ? " is-active" : ""}" data-or-set="s08Region:isan">อีสาน (3)</button>
                  <button type="button" class="or-lens-btn${ui.s08Region === "phet" ? " is-active" : ""}" data-or-set="s08Region:phet">เพชรบูรณ์ (2)</button>
                  <button type="button" class="or-lens-btn${ui.s08Region === "south" ? " is-active" : ""}" data-or-set="s08Region:south">ใต้ (1)</button>
                </div>
              </div>

              <!-- Compact 3x3 Group Grid -->
              <div class="or-grid-3" style="gap:0.38cqw">
                ${visibleSites
                  .map((s) => {
                    const idx = s.g - 1;
                    return `
                    <button type="button" class="or-node-btn${ui.s08Group === idx ? " is-selected" : ""}" data-or-set="s08Group:${idx}" style="padding:0.38cqw 0.52cqw;gap:0.1cqw">
                      <div style="display:flex;align-items:center;justify-content:space-between">
                        <span style="font-family:var(--font-display);font-size:clamp(8.2px,0.83cqw,11.8px);font-weight:800;color:#0072B2">กลุ่ม ${s.g} · ${s.n} คน</span>
                        <code style="font-size:clamp(7.8px,0.78cqw,11px)">${esc(s.room)}</code>
                      </div>
                      <div style="font-family:var(--font-display);font-size:clamp(9px,0.92cqw,13.2px);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.hosp)}</div>
                      <div style="font-size:clamp(7.8px,0.78cqw,11px);color:#64748b">${esc(s.prov)}</div>
                    </button>
                  `;
                  })
                  .join("")}
              </div>

              <!-- Spotlight Card for Selected Hospital -->
              <div class="or-card is-navy-tint" style="padding:0.58cqw 0.82cqw;gap:0.22cqw">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5cqw;flex-wrap:wrap">
                  <span class="or-card-kicker">กลุ่มที่ ${cur.g} SPOTLIGHT · ห้องประจำกลุ่ม ${esc(cur.room)}</span>
                  <span class="or-mini-chip">${esc(cur.nights)}</span>
                </div>
                <div style="font-family:var(--font-display);font-size:clamp(10.5px,1.12cqw,16px);font-weight:800">${esc(cur.hosp)} ${esc(cur.prov)} (${cur.n} คน)</div>
                <div style="font-size:clamp(9px,0.94cqw,13.4px)"><strong>อาจารย์ที่ปรึกษา:</strong> ${esc(cur.adv)} · <strong>วันเดินทาง:</strong> ${esc(cur.dates)}</div>
              </div>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">Experiential Key</span>
            <span class="or-story-a">แต่ละพื้นที่บริบทต่างกันตั้งแต่อุ้มผางชายแดนถึงตะกั่วป่าชายฝั่ง แต่ทุกกลุ่มใช้ <strong>เข็มทิศ 5 เลนส์เดียวกัน</strong> เพื่อนำกลับมาแลกเปลี่ยนเรียนรู้ในสัปดาห์ที่ 6</span>
          </div>
        `;
      }
    },
    {
      id: "s09-competency-blueprint",
      num: "09",
      section: "evaluation",
      sectionLabel: "03 · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · MASTERY",
      timeWindow: "09.19 – 09.22 น. (3 นาที)",
      kicker: "03 · RACM 303 (2569) 5-COMPETENCY ASSESSMENT BLUEPRINT",
      title: "แม่บทการวัดผลสัมฤทธิ์ตามสมรรถนะหลัก 5 ด้าน: แยก Formative เพื่อพัฒนา vs Summative ตัดสินผล",
      lead: "สลับเลนส์ Formative / Summative ด้านบน หรือคลิกแต่ละสมรรถนะ (1–5) เพื่อดูกลไกการเติบโตสู่เกรด O / S",
      notes:
        "สไลด์หัวใจสำคัญของการประเมินผล RACM 303 ปี 2569: ลองคลิกสลับปุ่ม 'เฉพาะ Formative' ให้นักศึกษาคลายกังวลว่ามีพื้นที่ฝึกคิดและรับ Feedback ตลอดทาง ก่อนคลิก 'เฉพาะ Summative' เพื่อชี้แจงเกณฑ์ตัดสินผล O/S/M/U และเกณฑ์ผ่านแยกหมวด EP/HS ≥ 2.00 (O ≥ 3.75)",
      render: () => {
        const mode = ui.s09Mode;
        const selComp = S09_BLUEPRINT[ui.s09Comp] || S09_BLUEPRINT[0];
        return `
          <div style="display:flex;flex-direction:column;gap:0.52cqw;flex:1;min-height:0">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:0.6cqw;flex-wrap:wrap">
              <div class="or-lens-bar" role="tablist" aria-label="กรองรูปแบบการวัดผล Formative และ Summative">
                <button type="button" class="or-lens-btn${mode === "all" ? " is-active" : ""}" data-or-set="s09Mode:all">แสดงครบทั้งระบบ (Formative + Summative)</button>
                <button type="button" class="or-lens-btn${mode === "formative" ? " is-active" : ""}" data-or-set="s09Mode:formative">1. เฉพาะ Formative (ฝึก &amp; รับ Feedback)</button>
                <button type="button" class="or-lens-btn${mode === "summative" ? " is-active" : ""}" data-or-set="s09Mode:summative">2. เฉพาะ Summative (ตัดสินเกรด)</button>
              </div>
              <span class="or-interactive-pill">คลิกแถวสมรรถนะ 1–5 เพื่อดูคำแนะนำ</span>
            </div>

            <div class="or-table-wrap" style="flex:1">
              <table class="or-table" style="font-size:clamp(8.5px,0.89cqw,12.9px);line-height:1.33">
                <thead>
                  <tr>
                    <th style="width:22%">Competency (สมรรถนะหลัก 5 ด้าน)</th>
                    <th style="width:44%">เครื่องมือวัดผล (Formative &amp; Summative Tools)</th>
                    <th style="width:16%">ผู้ประเมิน</th>
                    <th style="width:18%">เกณฑ์การประเมินผล</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="is-domain-divider"><td colspan="4" style="padding:0.22cqw 0.78cqw">ภาคทฤษฎี (Theoretical Domain)</td></tr>
                  ${S09_BLUEPRINT.map(
                    (row, idx) => `
                    ${idx === 1 ? `<tr class="is-domain-divider"><td colspan="4" style="padding:0.22cqw 0.78cqw">ภาคปฏิบัติและสมรรถนะวิชาชีพในชุมชน (Practical, Community &amp; Professionalism Domain)</td></tr>` : ""}
                    <tr class="or-bp-row${ui.s09Comp === idx ? " is-selected" : ""}" data-or-set="s09Comp:${idx}">
                      <td style="padding:0.36cqw 0.75cqw">
                        <strong>${esc(row.code)}</strong><br>
                        <span style="font-size:0.88em;color:#64748b">${esc(row.sub)}</span>
                      </td>
                      <td style="padding:0.36cqw 0.75cqw">
                        <div class="or-bp-seg${mode === "summative" ? " is-dimmed" : ""}">
                          <span class="or-tag-inline is-formative">Formative</span>${esc(row.formative)}
                        </div>
                        <div class="or-bp-seg${mode === "formative" ? " is-dimmed" : ""}" style="margin-top:0.12cqw">
                          <span class="or-tag-inline is-summative">Summative</span>${esc(row.summative)}
                        </div>
                      </td>
                      <td style="padding:0.36cqw 0.75cqw">${esc(row.assessor)}</td>
                      <td style="padding:0.36cqw 0.75cqw"><strong>${esc(row.criteria)}</strong></td>
                    </tr>
                  `
                  ).join("")}
                </tbody>
              </table>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">${esc(selComp.code)}</span>
            <span class="or-story-a"><strong>กลยุทธ์สู่ความสำเร็จ:</strong> ${esc(selComp.takeaway)}</span>
          </div>
        `;
      }
    },
    {
      id: "s10-eval-written-exams",
      num: "10",
      section: "evaluation",
      sectionLabel: "03 · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · MASTERY",
      timeWindow: "09.22 – 09.24 น. (2 นาที)",
      kicker: "03 · COMPETENCY 1 VISUAL SPEC · EP (CLOSED-BOOK) VS HS (OPEN NOTE)",
      title: "สัดส่วนข้อสอบทฤษฎีทั้ง 2 หมวด (Table Specification) และกติกากระดาษโน้ต A4",
      lead: "คิดเกณฑ์ผ่านแยกกัน (แต่ละส่วน ≥ 2.00 · O ≥ 3.75) — คลิกแต่ละแท่งสัดส่วนเพื่อดูจุดเน้นสำคัญในการเตรียมสอบ",
      notes:
        "เปรียบเทียบสัดส่วนน้ำหนักคะแนนของทั้งสองหมวดด้วยกราฟแท่งสัดส่วน: EP สอบวันอังคารที่ 8 ธ.ค. แบบ Closed-book ห้ามเครื่องคิดเลข/สมาร์ตวอทช์ ส่วน HS สอบวันอังคารที่ 22 ธ.ค. แบบ Open Note ใช้กระดาษ A4 เขียนลายมือตนเอง 1 แผ่น หน้า-หลัง",
      render: () => {
        const allBars = S10_EP_BARS.concat(S10_HS_BARS);
        const activeBar = allBars.find((b) => b.code === ui.s10Focus) || S10_HS_BARS[0];
        return `
          <div class="or-infog-split is-even">
            <!-- Left: EP1-9 Proportional Spec -->
            <div class="or-schematic-box">
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw">
                  <span class="or-card-kicker">SUMMATIVE 2.1 · อ. 8 ธ.ค. 69 (09.00–12.00)</span>
                  <span class="or-mini-chip">Closed-Book · 2C2-02..03</span>
                </div>
                <h3 class="or-card-title" style="margin-top:0.15cqw">สอบทฤษฎีระบาดวิทยา (EP1–EP9)</h3>
              </div>

              <div class="or-stat-bar-list">
                ${S10_EP_BARS.map(
                  (b) => `
                  <div class="or-stat-bar-row${ui.s10Focus === b.code ? " is-selected" : ""}" data-or-set="s10Focus:${b.code}">
                    <div class="or-stat-bar-head"><span><code>${esc(b.code)}</code> ${esc(b.name)}</span><span>${b.pct}%</span></div>
                    <div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:${b.pct * 4.5}%"></div></div>
                  </div>
                `
                ).join("")}
              </div>

              <div class="or-card is-navy-tint or-mt-auto" style="padding:0.48cqw 0.72cqw">
                <p class="or-card-text" style="font-size:clamp(8.5px,0.86cqw,12.4px)"><strong><code>EP1</code> Introduction:</strong> ปูรากฐานความคิดทางระบาดวิทยา · ห้องสอบ <strong>Closed-Book</strong> ห้ามเครื่องคิดเลข มือถือ และสมาร์ตวอทช์</p>
              </div>
            </div>

            <!-- Right: HS1-6 Proportional Spec + A4 Visual Guide -->
            <div class="or-inspector-box is-navy">
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw">
                  <span class="or-card-kicker">SUMMATIVE 2.2 · อ. 22 ธ.ค. 69 (09.00–12.00)</span>
                  <span class="or-mini-chip">Open Note A4 · 2C2-01..03</span>
                </div>
                <h3 class="or-card-title" style="margin-top:0.15cqw">สอบทฤษฎีระบบสุขภาพ (HS1–HS6)</h3>
              </div>

              <div class="or-stat-bar-list">
                ${S10_HS_BARS.map(
                  (b) => `
                  <div class="or-stat-bar-row${ui.s10Focus === b.code ? " is-selected" : ""}" data-or-set="s10Focus:${b.code}">
                    <div class="or-stat-bar-head"><span><code>${esc(b.code)}</code> ${esc(b.name)}</span><span>${b.pct}%</span></div>
                    <div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:${b.pct * 4.2}%"></div></div>
                  </div>
                `
                ).join("")}
              </div>

              <div class="or-card is-white or-mt-auto" style="padding:0.48cqw 0.72cqw">
                <p class="or-card-text" style="font-size:clamp(8.5px,0.86cqw,12.4px);line-height:1.36"><strong>กติกาโน้ต A4 &amp; ห้องสอบ:</strong> เขียนลายมือตนเองลงกระดาษ A4 <strong>1 แผ่น (หน้า–หลัง)</strong> ปากกา/ดินสอ · <strong>ห้ามพิมพ์/ถ่ายเอกสาร/แปะกระดาษ</strong> · สายเกิน <strong>15 นาที</strong> ไม่อนุญาตเข้าห้องสอบ</p>
              </div>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">High-Yield · ${esc(activeBar.code)}</span>
            <span class="or-story-a">${esc(activeBar.tip)}</span>
          </div>
        `;
      }
    },
    {
      id: "s11-eval-practical-rubrics",
      num: "11",
      section: "evaluation",
      sectionLabel: "03 · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · MASTERY",
      timeWindow: "09.24 – 09.26 น. (2 นาที)",
      kicker: "03 · COMPETENCIES 2–5 ARCHITECTURE · SRN, ORAL DEFENSE & PROFESSIONALISM",
      title: "สถาปัตยกรรมการประเมินภาคปฏิบัติ การสะท้อนคิด และเจตคติวิชาชีพ (สมรรถนะที่ 2–5)",
      lead: "คลิกแต่ละเสาหลักเพื่อดูความต่างของ SRN 1→2 สัดส่วนเวลาถาม-ตอบของฟอร์ม 3A/4A และเกณฑ์ความซื่อสัตย์ในฟอร์ม 1A/2A",
      notes:
        "ชี้ให้เห็นภาพชัดเจนว่าทำไมเวลาอภิปรายของฟอร์ม 3A (20 นาที) และฟอร์ม 4A (18 นาที) จึงยาวเป็น 2 เท่าของเวลานำเสนอ: เพราะอาจารย์ต้องการฟังวิธีคิดร่วมกันของทั้งทีม (ห้ามใช้ VDO อัดล่วงหน้า) และย้ำเรื่องความซื่อสัตย์ในฟอร์ม 1A",
      render: () => {
        const p = ui.s11Pillar;
        const pillarTips = [
          "SRN 1 (ส่ง 9 ธ.ค.) เป็นพื้นที่ปลอดภัยให้เขียนสะท้อนคิดตามจริงเพื่อรับคำแนะนำจากอาจารย์ที่ปรึกษาช่วงภาคสนาม ก่อนพัฒนาสู่ SRN 2 (ส่ง 30 ธ.ค.)",
          "เกือบ 70% ของเวลาแต่ละกลุ่มคือช่วงถาม-ตอบและอภิปราย (20 นาทีใน 3A และ 18 นาทีใน 4A) — ทุกคนในทีมจึงต้องเข้าใจงานร่วมกันอย่างแท้จริง",
          "ความซื่อสัตย์ทางวิชาการและวิชาชีพสำคัญที่สุด: ห้ามบิดเบือนข้อมูลสำรวจ ห้ามคัดลอกงาน และห้ามลงชื่อเข้าเรียนแทนกันโดยเด็ดขาด"
        ];
        return `
          <div class="or-grid-3" style="flex:1;align-items:stretch">
            <!-- Pillar 1: SRN 1 -> SRN 2 Loop -->
            <div class="or-node-btn${p === 0 ? " is-selected" : ""}" data-or-set="s11Pillar:0" style="padding:0.85cqw 1cqw;justify-content:space-between">
              <div>
                <span class="or-card-kicker" style="color:#0f766e">COMPETENCY 4 · INDIVIDUAL CPD</span>
                <h3 class="or-card-title" style="margin-top:0.18cqw">วงจรสะท้อนคิด SRN 1 &rarr; SRN 2</h3>
              </div>

              <svg class="or-svg-diagram" viewBox="0 0 300 135" aria-label="วงจรการพัฒนาจาก SRN 1 สู่ SRN 2">
                <rect x="8" y="14" width="284" height="32" rx="7" fill="#e0f2fe" stroke="#0284c7"/>
                <text x="150" y="34" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0369a1">① พ. 9 ธ.ค. (≤17.00): ส่ง SRN 1 (Formative)</text>
                <line x1="150" y1="46" x2="150" y2="56" stroke="#0f766e" stroke-width="2"/>
                <rect x="28" y="56" width="244" height="28" rx="7" fill="#f0fdfa" stroke="#0d9488" stroke-dasharray="4 2"/>
                <text x="150" y="74" text-anchor="middle" font-size="10" font-weight="700" fill="#0f766e">② ช่วงภาคสนาม: รับ Feedback จาก อ.ที่ปรึกษา</text>
                <line x1="150" y1="84" x2="150" y2="94" stroke="#0f766e" stroke-width="2"/>
                <rect x="8" y="94" width="284" height="32" rx="7" fill="#dcfce7" stroke="#16a34a"/>
                <text x="150" y="114" text-anchor="middle" font-size="10.5" font-weight="800" fill="#15803d">③ พ. 30 ธ.ค. (≤17.00): ส่ง SRN 2 (Summative)</text>
              </svg>

              <div style="font-size:clamp(8.6px,0.88cqw,12.6px);color:#475569;line-height:1.35">
                <strong>รูปแบบ:</strong> PDF <strong>&le; 5 หน้า A4</strong> (<code>TH Sarabun New 16pt</code>) ส่งทาง E-learning หลังทำแบบประเมิน
              </div>
            </div>

            <!-- Pillar 2: Oral Defense Time-Bar Infographic -->
            <div class="or-node-btn${p === 1 ? " is-selected" : ""}" data-or-set="s11Pillar:1" style="padding:0.85cqw 1cqw;justify-content:space-between">
              <div>
                <span class="or-card-kicker" style="color:#0072B2">COMPETENCY 2 &amp; 3 · GROUP SYNTHESIS</span>
                <h3 class="or-card-title" style="margin-top:0.18cqw">สัดส่วนเวลานำเสนอ ฟอร์ม 3A &amp; 4A</h3>
              </div>

              <div style="display:flex;flex-direction:column;gap:0.55cqw">
                <div>
                  <div style="font-size:clamp(8.8px,0.9cqw,12.8px);font-weight:700;margin-bottom:0.2cqw">ฟอร์ม 3A ระบบสุขภาพ (อ. 29 ธ.ค. · ครบ 5 วัตถุประสงค์)</div>
                  <div style="display:grid;grid-template-columns:1fr 2fr;border-radius:7px;overflow:hidden;font-size:clamp(8.2px,0.84cqw,12px);font-weight:800;color:#fff;text-align:center">
                    <div style="background:#0072B2;padding:0.32cqw 0.2cqw">นำเสนอ ≤10 น.</div>
                    <div style="background:#009E73;padding:0.32cqw 0.2cqw">ถาม-ตอบ &amp; อภิปราย ≤20 น.</div>
                  </div>
                </div>

                <div>
                  <div style="font-size:clamp(8.8px,0.9cqw,12.8px);font-weight:700;margin-bottom:0.2cqw">ฟอร์ม 4A ระบาดวิทยา Quantitative (พ. 30 ธ.ค. · 1 เรื่อง)</div>
                  <div style="display:grid;grid-template-columns:7fr 18fr;border-radius:7px;overflow:hidden;font-size:clamp(8.2px,0.84cqw,12px);font-weight:800;color:#fff;text-align:center">
                    <div style="background:#0072B2;padding:0.32cqw 0.2cqw">≤7 น.</div>
                    <div style="background:#E69F00;padding:0.32cqw 0.2cqw">ถาม-ตอบ &amp; อภิปราย ≤18 น.</div>
                  </div>
                </div>
              </div>

              <div style="font-size:clamp(8.6px,0.88cqw,12.6px);color:#b91c1c;font-weight:700;line-height:1.34">
                Formal presentation รูปแบบใดก็ได้ — <strong>ยกเว้นห้ามใช้ VDO บันทึกล่วงหน้า</strong>
              </div>
            </div>

            <!-- Pillar 3: Form 1A GRS + Peer -> Form 2A -->
            <div class="or-node-btn${p === 2 ? " is-selected" : ""}" data-or-set="s11Pillar:2" style="padding:0.85cqw 1cqw;justify-content:space-between">
              <div>
                <span class="or-card-kicker" style="color:#b45309">COMPETENCY 2 &amp; 5 · PROFESSIONALISM</span>
                <h3 class="or-card-title" style="margin-top:0.18cqw">ฟอร์ม 1A (GRS), Peer &amp; ฟอร์ม 2A</h3>
              </div>

              <div class="or-chip-row" style="gap:0.32cqw">
                <span class="or-mini-chip">1. สื่อสารอ่อนน้อม</span>
                <span class="or-mini-chip">2. ความใฝ่รู้</span>
                <span class="or-mini-chip">3. ภาวะผู้นำ &amp; ทีม</span>
                <span class="or-mini-chip">4. มีส่วนร่วมอภิปราย</span>
                <span class="or-mini-chip">5. ความรับผิดชอบ</span>
                <span class="or-mini-chip" style="border-color:#f87171;color:#b91c1c;font-weight:800">6. ความซื่อสัตย์วิชาชีพ</span>
                <span class="or-mini-chip">7. น้ำใจต่อส่วนรวม</span>
              </div>

              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:0.48cqw 0.65cqw;font-size:clamp(8.6px,0.88cqw,12.6px);line-height:1.34;color:#78350f">
                <strong>Peer Feedback + ฟอร์ม 1A</strong> นำมาประมวลเป็นภาพรวมเจตคติ <strong>ฟอร์ม 2A (O / S / U)</strong> รายบุคคล
              </div>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">Rubric Insight</span>
            <span class="or-story-a">${esc(pillarTips[p] || pillarTips[1])}</span>
          </div>
        `;
      }
    },
    {
      id: "s12-grading-milestones",
      num: "12",
      section: "evaluation",
      sectionLabel: "03 · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · MASTERY",
      timeWindow: "09.26 – 09.28 น. (2 นาที)",
      kicker: "03 · INTERACTIVE FINAL GRADE SIMULATOR (O / S / U) & 7 MILESTONES",
      title: "เครื่องจำลองเกณฑ์ตัดสินเกรดสุดท้าย (O / S / U) และเส้นตายการส่งงานทั้ง 7 จุด",
      lead: "ทดลองคลิกปรับผลคะแนน EP, HS, ฟอร์ม 2A และประวัติสอบซ่อม เพื่อดูผลลัพธ์ตามระเบียบรายวิชาแบบโปร่งใส",
      notes:
        "สาธิตการกดจำลองเกรดให้นักศึกษาดูสดบนจอ: (1) ทำอย่างไรถึงได้ O (EP ≥ 3.75, HS ≥ 3.75, ฟอร์ม 2A = O, ไม่เคยซ่อม), (2) หากหลุดหมวดใด < 2.00 สอบซ่อมเฉพาะหมวดนั้นได้ 1 ครั้ง ผ่านได้ S แต่มีผลต่อเกียรตินิยม, (3) หากฟอร์ม 2A ได้ U ต้องลงทะเบียนเรียนใหม่",
      render: () => {
        const verdict = computeGradeVerdict();
        return `
          <div class="or-infog-split">
            <!-- Left: Live Grade Simulator -->
            <div class="or-schematic-box">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw;flex-wrap:wrap">
                <span class="or-card-kicker" style="margin:0">LIVE GRADE SIMULATOR · ทดลองปรับเงื่อนไข</span>
                <div class="or-lens-bar">
                  <button type="button" class="or-lens-btn" style="padding:0.16cqw 0.5cqw;font-size:clamp(7.8px,0.78cqw,11px)" data-or-preset="O">ตัวอย่างเกรด O</button>
                  <button type="button" class="or-lens-btn" style="padding:0.16cqw 0.5cqw;font-size:clamp(7.8px,0.78cqw,11px)" data-or-preset="S">ตัวอย่างเกรด S</button>
                  <button type="button" class="or-lens-btn" style="padding:0.16cqw 0.5cqw;font-size:clamp(7.8px,0.78cqw,11px)" data-or-preset="R">ตัวอย่างสอบซ่อม</button>
                </div>
              </div>

              <!-- 3-Tier Grade Rule Visual Banner -->
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.4cqw">
                <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:7px;padding:0.32cqw 0.5cqw;font-size:clamp(8px,0.82cqw,11.6px);color:#065f46"><strong>O:</strong> EP&amp;HS &ge;3.75 + 2A=O</div>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;padding:0.32cqw 0.5cqw;font-size:clamp(8px,0.82cqw,11.6px);color:#1e40af"><strong>S:</strong> EP&amp;HS &ge;2.00 + 2A&ne;U</div>
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:7px;padding:0.32cqw 0.5cqw;font-size:clamp(8px,0.82cqw,11.6px);color:#991b1b"><strong>U:</strong> ซ่อมไม่ผ่าน / 2A=U</div>
              </div>

              <div>
                <div class="or-sim-row">
                  <span class="or-sim-lbl">1. ผลสอบระบาดวิทยา (EP)</span>
                  <div class="or-sim-opts">
                    <button type="button" class="or-sim-opt${ui.s12Ep === "fail" ? " is-active" : ""}" data-or-set="s12Ep:fail">&lt; 2.00</button>
                    <button type="button" class="or-sim-opt${ui.s12Ep === "pass" ? " is-active" : ""}" data-or-set="s12Ep:pass">2.00–3.74</button>
                    <button type="button" class="or-sim-opt${ui.s12Ep === "high" ? " is-active" : ""}" data-or-set="s12Ep:high">&ge; 3.75 (O)</button>
                  </div>
                </div>
                <div class="or-sim-row">
                  <span class="or-sim-lbl">2. ผลสอบระบบสุขภาพ (HS)</span>
                  <div class="or-sim-opts">
                    <button type="button" class="or-sim-opt${ui.s12Hs === "fail" ? " is-active" : ""}" data-or-set="s12Hs:fail">&lt; 2.00</button>
                    <button type="button" class="or-sim-opt${ui.s12Hs === "pass" ? " is-active" : ""}" data-or-set="s12Hs:pass">2.00–3.74</button>
                    <button type="button" class="or-sim-opt${ui.s12Hs === "high" ? " is-active" : ""}" data-or-set="s12Hs:high">&ge; 3.75 (O)</button>
                  </div>
                </div>
                <div class="or-sim-row">
                  <span class="or-sim-lbl">3. ภาพรวมเจตคติ (ฟอร์ม 2A)</span>
                  <div class="or-sim-opts">
                    <button type="button" class="or-sim-opt${ui.s12Att === "O" ? " is-active" : ""}" data-or-set="s12Att:O">ได้ O</button>
                    <button type="button" class="or-sim-opt${ui.s12Att === "S" ? " is-active" : ""}" data-or-set="s12Att:S">ได้ S</button>
                    <button type="button" class="or-sim-opt${ui.s12Att === "U" ? " is-active" : ""}" data-or-set="s12Att:U">ได้ U</button>
                  </div>
                </div>
                <div class="or-sim-row">
                  <span class="or-sim-lbl">4. ประวัติการสอบซ่อม</span>
                  <div class="or-sim-opts">
                    <button type="button" class="or-sim-opt${ui.s12Retake === "no" ? " is-active" : ""}" data-or-set="s12Retake:no">ไม่เคยสอบซ่อม</button>
                    <button type="button" class="or-sim-opt${ui.s12Retake === "yes" ? " is-active" : ""}" data-or-set="s12Retake:yes">เคยซ่อมผ่าน</button>
                  </div>
                </div>
              </div>

              <div class="or-sim-verdict ${verdict.cls} or-mt-auto">
                <div class="or-sim-letter">${esc(verdict.letter)}</div>
                <div style="min-width:0">
                  <div style="font-family:var(--font-display);font-size:clamp(10px,1.08cqw,15.5px);font-weight:800">${esc(verdict.title)}</div>
                  <div style="font-size:clamp(8.6px,0.88cqw,12.6px);line-height:1.34;color:#334155">${esc(verdict.desc)}</div>
                </div>
              </div>
            </div>

            <!-- Right: 7 Submission Milestones Visual Track -->
            <div class="or-table-wrap">
              <table class="or-table" style="font-size:clamp(8.5px,0.88cqw,12.6px)">
                <thead>
                  <tr><th>7 กำหนดการสอบ &amp; ส่งงานสำคัญ</th><th>วัน – เวลา &amp; ช่องทาง</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>1. สอบทฤษฎีระบาดวิทยา (EP1–9)</strong></td><td>อ. 8 ธ.ค. 69 (09.00–12.00) · <code>2C2-02..03</code></td></tr>
                  <tr><td><strong>2. ส่ง SRN 1</strong> + ประเมินภาคทฤษฎี</td><td>พ. 9 ธ.ค. 69 (&le; 17.00 น.) · E-learning</td></tr>
                  <tr><td><strong>3. สอบทฤษฎีระบบสุขภาพ (Open Note)</strong></td><td>อ. 22 ธ.ค. 69 (09.00–12.00) · <code>2C2-01..03</code></td></tr>
                  <tr><td><strong>4. นำเสนอภาคสนาม ระบบสุขภาพ (3A)</strong></td><td>อ. 29 ธ.ค. 69 (08.30–15.30) · <code>2C2-03</code></td></tr>
                  <tr><td><strong>5. นำเสนอภาคสนาม ระบาดวิทยา (4A)</strong></td><td>พ. 30 ธ.ค. 69 (08.30–12.45) · <code>2C2-03</code></td></tr>
                  <tr><td><strong>6. ส่ง SRN 2</strong> + ประเมินรายวิชา</td><td>พ. 30 ธ.ค. 69 (&le; 17.00 น.) · E-learning</td></tr>
                  <tr><td><strong>7. ส่งสไลด์นำเสนอ &amp; Health Survey</strong></td><td>พ. 30 ธ.ค. 69 (&le; 17.00 น.) · Google Form</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">Fair &amp; Clear</span>
            <span class="or-story-a">เกณฑ์ประเมินแยกหมวดชัดเจน: หากพลาดทฤษฎีหมวดใดหมวดหนึ่ง <strong>ซ่อมเฉพาะหมวดนั้นได้ 1 ครั้ง</strong> แต่เรื่องจริยธรรมและความรับผิดชอบต้องรักษามาตรฐานตั้งแต่วันแรก</span>
          </div>
        `;
      }
    },
    {
      id: "s13-attendance-safety",
      num: "13",
      section: "action",
      sectionLabel: "04 · Conduct & Launch",
      actClass: "is-act-4",
      actLabel: "ACT IV · LAUNCH",
      timeWindow: "09.28 – 09.29 น. (1 นาที)",
      kicker: "04 · ATTENDANCE GAUGE & 6 FIELDWORK SAFETY SHIELDS (B.E. 2561)",
      title: "มาตรวัดเวลาเรียน โควตาการลา และเกราะความปลอดภัย 6 ข้อในการฝึกภาคสนาม",
      lead: "คลิกแต่ละเกราะความปลอดภัย (01–06) เพื่อดูแนวทางคุ้มครองตนเอง เพื่อนร่วมทีม และชุมชนเจ้าบ้าน",
      notes:
        "ชี้ให้ดูแถบเวลาเช็คชื่อ (-15 ถึง +15 นาที) มาตรวัดเวลาเรียน ≥ 80% และคลิกย้ำกฎเหล็กประกาศภาควิชาฯ พ.ศ. 2561 โดยเฉพาะข้อ 01 ห้ามนำรถส่วนตัวไปใช้ ข้อ 02 ห้ามออกนอกเขตลำพัง และข้อ 05–06 งดแอลกอฮอล์และระวังโซเชียลมีเดีย",
      render: () => {
        const sh = S13_SHIELDS[ui.s13Shield] || S13_SHIELDS[0];
        return `
          <div class="or-infog-split">
            <!-- Left: Attendance Clock & Quota Gauges -->
            <div class="or-schematic-box">
              <div>
                <span class="or-card-kicker">SIGN-IN WINDOW &amp; ATTENDANCE QUOTA</span>
                <h3 class="or-card-title" style="margin-top:0.15cqw">กติกาลงชื่อเข้าเรียนและสิทธิ์เข้าสอบ</h3>
              </div>

              <!-- Visual Sign-in Window Bar -->
              <div>
                <div style="font-size:clamp(8.5px,0.86cqw,12.2px);font-weight:700;margin-bottom:0.2cqw;color:#475569">หน้าต่างเวลาลงชื่อเข้าเรียนในแต่ละคาบ</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1.1fr;border-radius:8px;overflow:hidden;font-family:var(--font-display);font-size:clamp(8px,0.82cqw,11.8px);font-weight:800;color:#fff;text-align:center">
                  <div style="background:#009E73;padding:0.38cqw 0.25cqw">-15 น. เปิดลงชื่อ</div>
                  <div style="background:#0072B2;padding:0.38cqw 0.25cqw">00:00–15:00 ปกติ</div>
                  <div style="background:#D55E00;padding:0.38cqw 0.25cqw">&gt; +15 น. นับว่าสาย</div>
                </div>
              </div>

              <!-- Quota Gauges -->
              <div class="or-stat-bar-list">
                <div class="or-stat-bar-row" style="cursor:default">
                  <div class="or-stat-bar-head"><span>เกณฑ์เวลาเรียนรวมมีสิทธิ์สอบ</span><span>&ge; 80%</span></div>
                  <div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:80%"></div></div>
                </div>
                <div class="or-stat-bar-row" style="cursor:default">
                  <div class="or-stat-bar-head"><span>โควตาลาก่อน + หลังภาคสนามรวมกัน</span><span>&le; 3.0 วัน</span></div>
                  <div class="or-stat-bar-track"><div class="or-stat-bar-fill is-amber" style="width:45%"></div></div>
                </div>
                <div class="or-stat-bar-row" style="cursor:default">
                  <div class="or-stat-bar-head"><span>โควตาลาช่วงฝึกภาคสนาม</span><span>&le; 1.5 วัน</span></div>
                  <div class="or-stat-bar-track"><div class="or-stat-bar-fill is-crimson" style="width:24%"></div></div>
                </div>
              </div>

              <div class="or-card is-white or-mt-auto" style="padding:0.45cqw 0.68cqw">
                <p class="or-card-text" style="font-size:clamp(8.5px,0.86cqw,12.2px);line-height:1.34"><strong>การลาทุกกรณี:</strong> ยื่นใบลาล่วงหน้า (ผ่านระบบใบลาออนไลน์ใน Portal ได้) และต้องได้รับอนุญาตจากอาจารย์ที่ปรึกษาก่อนเสมอ</p>
              </div>
            </div>

            <!-- Right: 6 Interactive Safety Shields -->
            <div class="or-inspector-box is-amber">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw">
                <span class="or-card-kicker">ประกาศภาควิชาฯ พ.ศ. 2561 · 6 เกราะความปลอดภัย</span>
                <span style="font-size:clamp(8px,0.8cqw,11.4px);font-weight:700;color:#b45309">คลิกแต่ละข้อ</span>
              </div>

              <div class="or-grid-2" style="gap:0.42cqw">
                ${S13_SHIELDS.map(
                  (item, idx) => `
                  <button type="button" class="or-node-btn${ui.s13Shield === idx ? " is-selected" : ""}" data-or-set="s13Shield:${idx}" style="padding:0.46cqw 0.62cqw;gap:0.12cqw">
                    <div style="display:flex;align-items:center;gap:0.32cqw;font-family:var(--font-display);font-size:clamp(8.6px,0.88cqw,12.6px);font-weight:800;color:#991b1b">
                      ${SVG.shield} <span>${item.no} · ${esc(item.title)}</span>
                    </div>
                    <div style="font-size:clamp(8.2px,0.84cqw,12px);color:#475569;font-weight:600">${esc(item.short)}</div>
                  </button>
                `
                ).join("")}
              </div>

              <div class="or-card is-white or-mt-auto" style="padding:0.55cqw 0.78cqw;gap:0.15cqw">
                <span class="or-card-kicker">ข้อ ${sh.no} · ${esc(sh.title)}</span>
                <p class="or-card-text">${esc(sh.detail)}</p>
              </div>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">Safety First</span>
            <span class="or-story-a">กฎทั้ง 6 ข้อออกแบบจากบทเรียนหน้างานจริง เพื่อให้ <strong>ทุกคนเดินทางไปเรียนรู้และกลับถึงรามาธิบดีอย่างปลอดภัย 100%</strong></span>
          </div>
        `;
      }
    },
    {
      id: "s14-digital-launch",
      num: "14",
      section: "action",
      sectionLabel: "04 · Conduct & Launch",
      actClass: "is-act-4",
      actLabel: "ACT IV · LAUNCH",
      timeWindow: "09.29 – 09.30 น. (1 นาที)",
      kicker: "04 · DIGITAL ECOSYSTEM HUB & INTERACTIVE WEEK-1 LAUNCHPAD",
      title: "ระบบนิเวศดิจิทัลประจำรายวิชา และ Checklist 4 ก้าวแรกของสัปดาห์ที่ 1",
      lead: "เชื่อมต่อเครื่องมือครบวงจรในที่เดียว — คลิกติ๊กเช็กรายการเตรียมพร้อมด้านขวาแล้วเริ่มต้นคาบแรกเวลา 09.30 น.!",
      notes:
        "สรุปจบคาบปฐมนิเทศอย่างมีพลัง: ชี้ 3 ช่องทางดิจิทัลหลัก ชวนกดปุ่มผูกชื่อ/ดาวน์โหลดปฏิทิน .ics และติ๊ก Checklist 4 ก้าวแรกของสัปดาห์ที่ 1 ก่อนส่งต่อเวทีเข้าสู่คาบ Systems & Systems Thinking เวลา 09.30 น. ณ ห้อง 2C2-03",
      render: () => {
        const items = [
          { key: "c1", time: "วันนี้ 09.30 – 12.00 น. · ห้อง 2C2-03", title: "เข้าเรียนต่อเนื่องคาบ Systems & Systems Thinking (CAS & Iceberg Model)" },
          { key: "c2", time: "วันนี้ 13.00 – 16.00 น. · ห้อง 2C2-03", title: "ร่วมเสวนา Bedside to Systems-Based Practice: Global/Planetary Health & HPSR" },
          { key: "c3", time: "เย็นวันนี้ · Pre-class HS1", title: "อ่านบทเรียนและทำคำถามนำ HS1 เตรียมเข้าห้องใหญ่ 08.30 น. และแยก 6 กลุ่มย่อยพรุ่งนี้" },
          { key: "c4", time: "พฤหัสบดี 26 พ.ย. · 13.00 – 16.30 น.", title: "พบอาจารย์ที่ปรึกษาประจำกลุ่มภาคสนามทั้ง 9 พื้นที่ ในกิจกรรมกลุ่มย่อย ครั้งที่ 1" }
        ];
        const doneCount = items.filter((it) => ui.s14Checks[it.key]).length;
        const pct = Math.round((doneCount / items.length) * 100);

        return `
          <div class="or-infog-split is-even">
            <!-- Left: 3-Platform Digital Ecosystem Hub -->
            <div class="or-schematic-box">
              <div>
                <span class="or-card-kicker">3-PLATFORM DIGITAL ECOSYSTEM</span>
                <h3 class="or-card-title" style="margin-top:0.15cqw">ช่องทางไหนใช้ทำอะไรตลอด 6 สัปดาห์?</h3>
              </div>

              <div style="display:flex;flex-direction:column;gap:0.42cqw">
                <div class="or-card is-navy-tint" style="padding:0.55cqw 0.78cqw;gap:0.14cqw">
                  <span class="or-card-kicker">1 · RACM 303 SMART PORTAL (ศูนย์กลางการเรียนรู้)</span>
                  <p class="or-card-text">ดูตารางเฉพาะกลุ่ม · ซิงค์ปฏิทิน <code>.ics</code> · เรียน <code>HS1–HS6</code> ครบ 5 ขั้น · ลิงก์ห้อง Zoom ระบาดฯ · ยื่นใบลาออนไลน์</p>
                </div>
                <div class="or-card is-teal-tint" style="padding:0.55cqw 0.78cqw;gap:0.14cqw">
                  <span class="or-card-kicker">2 · RAMA E-LEARNING (COURSE ID = 398)</span>
                  <p class="or-card-text">ทำแบบฝึกหัด SDL ระบาดวิทยา และส่งไฟล์ <code>SRN 1</code> (9 ธ.ค.) &amp; <code>SRN 2</code> (30 ธ.ค.)</p>
                </div>
                <div class="or-card is-amber-tint" style="padding:0.55cqw 0.78cqw;gap:0.14cqw">
                  <span class="or-card-kicker">3 · GOOGLE FORM ประจำปี 2569</span>
                  <p class="or-card-text">ส่งไฟล์สไลด์นำเสนอแลกเปลี่ยนเรียนรู้ภาคสนาม (29–30 ธ.ค.) และชุดแบบสอบถาม Health Survey</p>
                </div>
              </div>

              <div class="or-mt-auto" style="display:flex;flex-wrap:wrap;gap:0.45cqw">
                <button type="button" class="or-jump-btn" data-or-action="profile">ตั้งค่าชื่อ / กลุ่มของฉัน &rarr;</button>
                <button type="button" class="or-jump-btn" data-or-action="ics">ซิงค์ปฏิทิน .ics &rarr;</button>
                <button type="button" class="or-jump-btn" data-or-action="hs1">เปิดบทเรียน HS1 &rarr;</button>
              </div>
            </div>

            <!-- Right: Interactive Persisted Checklist -->
            <div class="or-inspector-box is-teal">
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5cqw">
                  <span class="or-card-kicker">WEEK 1 LAUNCHPAD · คลิกเช็กรายการ</span>
                  <span class="or-mini-chip" style="font-weight:800;color:#0f766e">${doneCount} / 4 พร้อมแล้ว (${pct}%)</span>
                </div>
                <div class="or-stat-bar-track" style="margin-top:0.3cqw"><div class="or-stat-bar-fill is-teal" style="width:${pct}%"></div></div>
              </div>

              <div style="display:flex;flex-direction:column;gap:0.42cqw">
                ${items
                  .map((it) => {
                    const checked = Boolean(ui.s14Checks[it.key]);
                    return `
                    <button type="button" class="or-check-item${checked ? " is-checked" : ""}" data-or-check="${it.key}">
                      <span class="or-check-box">${checked ? SVG.check : ""}</span>
                      <span style="display:flex;flex-direction:column;gap:0.08cqw;min-width:0">
                        <span style="font-family:var(--font-display);font-size:clamp(8.2px,0.84cqw,12px);font-weight:800;color:#0f766e">${esc(it.time)}</span>
                        <span style="font-size:clamp(9px,0.94cqw,13.4px);font-weight:600;line-height:1.32">${esc(it.title)}</span>
                      </span>
                    </button>
                  `;
                  })
                  .join("")}
              </div>
            </div>
          </div>

          <div class="or-story-ribbon">
            <span class="or-story-q">Next Up · 09.30 น.</span>
            <span class="or-story-a">ยินดีต้อนรับสู่ <strong>RACM 303 ปีการศึกษา 2569</strong> — เตรียมเปิดมุมมองใหม่ในคาบแรก <strong>Systems &amp; Systems Thinking</strong> ต่อจากนี้ได้เลย!</span>
          </div>
        `;
      }
    }
  ];

  const SECTION_FILTERS = [
    { id: "all", labelTh: "ทั้งหมด (14)", labelEn: "All Slides (14)" },
    { id: "intro", labelTh: "เปิดเรื่อง (1)", labelEn: "Opening (1)" },
    { id: "objectives", labelTh: "Act I · วัตถุประสงค์ (3)", labelEn: "Act I · Objectives (3)" },
    { id: "experience", labelTh: "Act II · เส้นทางเรียนรู้ (4)", labelEn: "Act II · Experience (4)" },
    { id: "evaluation", labelTh: "Act III · วัดผล 5 สมรรถนะ (4)", labelEn: "Act III · Evaluation (4)" },
    { id: "action", labelTh: "Act IV · กติกา & ก้าวแรก (2)", labelEn: "Act IV · Launch (2)" }
  ];

  function formatTimer(sec) {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")} / 30:00`;
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
        const btn = document.getElementById("orTimerBtn");
        if (btn) {
          btn.textContent = formatTimer(state.timerSeconds);
          btn.classList.toggle("is-running", state.timerRunning && state.timerSeconds <= 1800);
          btn.classList.toggle("is-overtime", state.timerSeconds > 1800);
        }
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

  function renderCoverSlideHtml() {
    const api = getApi();
    const st = api && api.getState ? api.getState() : {};
    let personalTag = "";
    if (ROLE === "student" && st.myStudent) {
      const s = st.myStudent;
      personalTag = `นศพ. ${s.fullName} · กลุ่ม Discussion ${s.disc} · พื้นที่ ${s.area}`;
    } else if (ROLE === "faculty" && st.myTeacherKey) {
      personalTag = `คณาจารย์ผู้สอน: อ.${st.myTeacherKey}`;
    }

    const actObj = COVER_ACTS[ui.s01Act] || COVER_ACTS[0];

    return `
      <div class="or-cover-stage">
        <div class="or-cover-top">
          <span class="or-cover-dept">ภาควิชาเวชศาสตร์ชุมชน · คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล</span>
          <span class="or-cover-code-chip">RACM 303 · ปีการศึกษา 2569</span>
        </div>

        <div class="or-cover-split">
          <!-- Left: Editorial Cover + Hero KPI Pyramid -->
          <div style="display:flex;flex-direction:column;gap:0.85cqw;min-width:0">
            <span class="or-cover-kicker">COURSE ORIENTATION · วันพุธที่ 25 พฤศจิกายน 2569 · 09.00 – 09.30 น.</span>
            <h2 class="or-cover-h1" style="font-size:clamp(19px,2.65cqw,39px)">Orientation to Community Medicine and Health Systems Science</h2>
            <p class="or-cover-sub" style="font-size:clamp(11px,1.28cqw,19px)">จากข้างเตียงสู่ชุมชนและระบบสุขภาพ — แผนที่วัตถุประสงค์ ประสบการณ์เรียนรู้ และการวัดผลตามสมรรถนะหลัก 5 ด้าน</p>

            <div class="or-cover-kpi-row">
              <div class="or-cover-kpi">
                <span class="or-cover-kpi-val">169</span>
                <span class="or-cover-kpi-lbl">นศพ. ชั้นปีที่ 3</span>
              </div>
              <div class="or-cover-kpi">
                <span class="or-cover-kpi-val">6</span>
                <span class="or-cover-kpi-lbl">สัปดาห์การเรียนรู้</span>
              </div>
              <div class="or-cover-kpi">
                <span class="or-cover-kpi-val">9</span>
                <span class="or-cover-kpi-lbl">รพช. เครือข่าย</span>
              </div>
              <div class="or-cover-kpi">
                <span class="or-cover-kpi-val">5</span>
                <span class="or-cover-kpi-lbl">สมรรถนะหลัก</span>
              </div>
            </div>
          </div>

          <!-- Right: Interactive 3-Ring Bedside-to-System Orbit & 4-Act Story Navigator -->
          <div class="or-cover-orbit-card">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw">
              <span style="font-family:var(--font-display);font-size:clamp(8.5px,0.88cqw,12.6px);font-weight:800;letter-spacing:0.06em;color:#bae6fd">INTERACTIVE STORY COMPASS · คลิกเลือกองก์</span>
              <span style="font-size:clamp(8px,0.82cqw,11.6px);color:rgba(255,255,255,0.8)">${esc(actObj.slides)}</span>
            </div>

            <svg class="or-svg-diagram" viewBox="0 0 380 162" style="max-height:11.8cqw" aria-label="วงโคจรเชื่อมโยงผู้ป่วย ชุมชน และระบบสุขภาพ">
              <ellipse cx="190" cy="84" rx="178" ry="72" fill="rgba(56,189,248,0.10)" stroke="${ui.s01Act === 0 || ui.s01Act === 2 ? "#7dd3fc" : "rgba(255,255,255,0.28)"}" stroke-width="${ui.s01Act === 0 || ui.s01Act === 2 ? "2.4" : "1.2"}"/>
              <text x="190" y="34" text-anchor="middle" font-size="9.2" font-weight="700" fill="#e0f2fe">วงนอก: ระบบสุขภาพ การคลัง &amp; นโยบาย (HSS)</text>

              <ellipse cx="190" cy="94" rx="126" ry="48" fill="rgba(16,185,129,0.14)" stroke="${ui.s01Act === 1 ? "#6ee7b7" : "rgba(255,255,255,0.32)"}" stroke-width="${ui.s01Act === 1 ? "2.4" : "1.2"}"/>
              <text x="190" y="64" text-anchor="middle" font-size="9.2" font-weight="700" fill="#a7f3d0">วงกลาง: วิถีชุมชน อาชีพ &amp; 9 รพช.</text>

              <ellipse cx="190" cy="105" rx="66" ry="24" fill="rgba(251,191,36,0.24)" stroke="#fde68a" stroke-width="1.8"/>
              <text x="190" y="109" text-anchor="middle" font-size="10.2" font-weight="800" fill="#ffffff">ผู้ป่วยข้างเตียง</text>
            </svg>

            <div class="or-cover-act-tabs">
              ${COVER_ACTS.map(
                (a, idx) => `
                <button type="button" class="or-cover-act-btn${ui.s01Act === idx ? " is-active" : ""}" data-or-set="s01Act:${idx}">Act 0${idx + 1}</button>
              `
              ).join("")}
            </div>

            <div style="background:rgba(255,255,255,0.1);border-radius:9px;padding:0.55cqw 0.75cqw;display:flex;flex-direction:column;gap:0.22cqw">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw">
                <span style="font-family:var(--font-display);font-size:clamp(8.5px,0.88cqw,12.5px);font-weight:800;color:#fde68a">${esc(actObj.act)}</span>
                <button type="button" class="or-cover-act-btn" style="padding:0.18cqw 0.55cqw" data-or-jump="${actObj.jumpIdx}">เปิดสไลด์หมวดนี้ &rarr;</button>
              </div>
              <div style="font-size:clamp(9.2px,0.96cqw,13.8px);font-weight:700;color:#ffffff">${esc(actObj.q)}</div>
              <div style="font-size:clamp(8.4px,0.86cqw,12.2px);color:rgba(255,255,255,0.85);line-height:1.32">${esc(actObj.desc)}</div>
            </div>
          </div>
        </div>

        <div class="or-cover-bottom">
          <div class="or-cover-meta-grid">
            <div class="or-cover-meta-item">
              <span class="or-cover-meta-lbl">สถานที่เรียน</span>
              <span class="or-cover-meta-val">ห้อง 2C2-03 ชั้น 2 อาคารพรีคลินิก (CNMI)</span>
            </div>
            <div class="or-cover-meta-item">
              <span class="or-cover-meta-lbl">ระยะเวลารายวิชา</span>
              <span class="or-cover-meta-val">พุธ 25 พ.ย. – พุธ 30 ธ.ค. 2569 (6 สัปดาห์)</span>
            </div>
            <div class="or-cover-meta-item">
              <span class="or-cover-meta-lbl">ประธานรายวิชา</span>
              <span class="or-cover-meta-val">อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์ และคณาจารย์ 14 ท่าน</span>
            </div>
          </div>
          ${
            personalTag
              ? `<span class="or-cover-code-chip">${esc(personalTag)}</span>`
              : `<button type="button" class="or-cover-cta-btn" data-or-action="profile">${esc(
                  ROLE === "faculty" ? "เลือกชื่ออาจารย์ผู้สอน" : "เลือกชื่อ / กลุ่มของฉัน"
                )}</button>`
          }
        </div>
      </div>
    `;
  }

  function renderSingleSlideCanvasHtml(slide, idx) {
    if (slide.isCover) {
      return `
        <article class="or-slide-canvas is-cover-canvas" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
          ${renderCoverSlideHtml()}
        </article>
      `;
    }
    return `
      <article class="or-slide-canvas" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
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
            <p class="or-sld-lead">${esc(slide.lead)}</p>
          </header>
          <div class="or-sld-body">
            ${slide.render()}
          </div>
        </div>
        <footer class="or-sld-foot">
          <span>RACM 303 (ปีการศึกษา 2569) · Interactive Infographic &amp; Storytelling Deck</span>
          <span>Slide ${idx + 1} / ${SLIDES.length}</span>
        </footer>
      </article>
    `;
  }

  function ensureModalElement() {
    let modal = document.getElementById("orientationDeckModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "orientationDeckModal";
    modal.className = "or-deck-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Orientation to Community Medicine and Health Systems Science Slide Deck");
    modal.hidden = true;
    document.body.appendChild(modal);

    modal.addEventListener("click", (ev) => {
      if (ev.target === modal && !state.presentationMode) {
        closeDeck();
      }
    });

    document.addEventListener("keydown", (ev) => {
      if (!state.isOpen || modal.hidden) return;
      const tag = (ev.target && ev.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (ev.key === "Escape") {
        ev.preventDefault();
        if (state.presentationMode) {
          exitPresentationMode();
        } else {
          closeDeck();
        }
      } else if (ev.key === "ArrowRight" || ev.key === "PageDown" || ev.key === " ") {
        if (tag === "BUTTON" && ev.key === " ") return; // allow keyboard button activation
        if (state.viewMode === "deck") {
          ev.preventDefault();
          goToSlide(state.slideIdx + 1);
        }
      } else if (ev.key === "ArrowLeft" || ev.key === "PageUp") {
        if (state.viewMode === "deck") {
          ev.preventDefault();
          goToSlide(state.slideIdx - 1);
        }
      } else if (ev.key === "Home") {
        if (state.viewMode === "deck") {
          ev.preventDefault();
          goToSlide(0);
        }
      } else if (ev.key === "End") {
        if (state.viewMode === "deck") {
          ev.preventDefault();
          goToSlide(SLIDES.length - 1);
        }
      } else if (ev.key === "f" || ev.key === "F") {
        ev.preventDefault();
        togglePresentationMode();
      } else if (ev.key === "g" || ev.key === "G") {
        ev.preventDefault();
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

  function handleSlideAction(actionKey) {
    const api = getApi();
    if (actionKey === "profile") {
      closeDeck();
      const profBtn = document.getElementById("tvProfileBtn") || document.getElementById("personalStudentInput");
      if (profBtn && profBtn.id === "tvProfileBtn") profBtn.click();
      else if (profBtn) profBtn.focus();
    } else if (actionKey === "ics") {
      if (api && api.downloadScheduleIcs) api.downloadScheduleIcs();
    } else if (actionKey === "hs1") {
      closeDeck();
      if (api && api.openTextbookDriveFolder) api.openTextbookDriveFolder("HS1");
      else if (api && api.openTextbookDoc) api.openTextbookDoc("HS1");
    }
  }

  function applyStateMutation(spec) {
    const idx = spec.indexOf(":");
    if (idx < 0) return;
    const key = spec.slice(0, idx);
    const rawVal = spec.slice(idx + 1);
    const numKeys = new Set([
      "s01Act",
      "s02Lens",
      "s02Era",
      "s04Obj",
      "s05Week",
      "s06Step",
      "s06Beyond",
      "s07Stage",
      "s08Group",
      "s09Comp",
      "s11Pillar",
      "s13Shield"
    ]);
    ui[key] = numKeys.has(key) ? Number(rawVal) || 0 : rawVal;

    // If region filter changed on Slide 08, ensure selected group belongs to visible region
    if (key === "s08Region" && rawVal !== "all") {
      const curSite = S08_SITES[ui.s08Group];
      if (!curSite || curSite.reg !== rawVal) {
        const firstMatch = S08_SITES.find((s) => s.reg === rawVal);
        if (firstMatch) ui.s08Group = firstMatch.g - 1;
      }
    }
  }

  function applyGradePreset(preset) {
    if (preset === "O") {
      ui.s12Ep = "high";
      ui.s12Hs = "high";
      ui.s12Att = "O";
      ui.s12Retake = "no";
    } else if (preset === "S") {
      ui.s12Ep = "pass";
      ui.s12Hs = "high";
      ui.s12Att = "S";
      ui.s12Retake = "no";
    } else if (preset === "R") {
      ui.s12Ep = "fail";
      ui.s12Hs = "pass";
      ui.s12Att = "S";
      ui.s12Retake = "no";
    }
  }

  function refreshViewportOnly() {
    const viewport = document.getElementById("orDeckViewport");
    if (!viewport || state.viewMode !== "deck") {
      renderModal();
      return;
    }
    const cur = SLIDES[state.slideIdx] || SLIDES[0];
    viewport.innerHTML = `
      <div class="or-slide-frame-wrap">
        ${renderSingleSlideCanvasHtml(cur, state.slideIdx)}
      </div>
    `;
    wireCanvasInteractiveButtons(viewport);
  }

  function wireCanvasInteractiveButtons(rootEl) {
    rootEl.querySelectorAll("[data-or-action]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        handleSlideAction(btn.dataset.orAction);
      });
    });

    rootEl.querySelectorAll("[data-or-set]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        applyStateMutation(el.getAttribute("data-or-set") || "");
        refreshViewportOnly();
      });
    });

    rootEl.querySelectorAll("[data-or-preset]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        applyGradePreset(el.getAttribute("data-or-preset") || "");
        refreshViewportOnly();
      });
    });

    rootEl.querySelectorAll("[data-or-check]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const k = el.getAttribute("data-or-check");
        if (k) {
          ui.s14Checks[k] = !ui.s14Checks[k];
          saveChecks(ui.s14Checks);
          refreshViewportOnly();
        }
      });
    });

    rootEl.querySelectorAll("[data-or-jump]").forEach((btn) => {
      if (btn.closest(".or-filmstrip") || btn.closest(".or-sorter-grid")) return;
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        state.slideIdx = Number(btn.getAttribute("data-or-jump")) || 0;
        state.viewMode = "deck";
        renderModal();
      });
    });

    if (state.laserActive) {
      const canvas = rootEl.querySelector(".or-slide-canvas");
      if (canvas) {
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
    }
  }

  function printHandout() {
    const prevMode = state.viewMode;
    state.viewMode = "handout";
    renderModal();
    document.body.classList.add("is-printing-orientation-deck");
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove("is-printing-orientation-deck");
        state.viewMode = prevMode;
        renderModal();
      }, 300);
    }, 120);
  }

  function togglePresentationMode() {
    const modal = ensureModalElement();
    if (!state.presentationMode) {
      state.viewMode = "deck";
      state.presentationMode = true;
      modal.classList.add("is-presentation-mode");
      if (modal.requestFullscreen) {
        modal.requestFullscreen().catch(() => {});
      }
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

  function goToSlide(idx) {
    state.slideIdx = Math.max(0, Math.min(SLIDES.length - 1, idx));
    renderModal();
  }

  function renderModal() {
    const modal = ensureModalElement();
    if (!state.isOpen) {
      modal.hidden = true;
      return;
    }
    modal.hidden = false;
    modal.classList.toggle("is-presentation-mode", state.presentationMode);

    const cur = SLIDES[state.slideIdx] || SLIDES[0];
    const showNotesNow = state.viewMode === "deck" && state.showNotes;

    let viewportHtml = "";
    if (state.viewMode === "deck") {
      viewportHtml = `
        <div class="or-slide-frame-wrap">
          ${renderSingleSlideCanvasHtml(cur, state.slideIdx)}
        </div>
      `;
    } else if (state.viewMode === "sorter") {
      const visible = SLIDES.map((s, i) => ({ s, i })).filter(
        (x) => state.sorterFilter === "all" || x.s.section === state.sorterFilter
      );
      viewportHtml = `
        <div class="or-sorter-wrap">
          <div class="or-sorter-filters" role="group" aria-label="กรองตามหมวดสไลด์">
            ${SECTION_FILTERS.map(
              (f) => `
              <button type="button" class="or-tool-btn${state.sorterFilter === f.id ? " is-active-toggle" : ""}" data-or-sfilter="${f.id}">
                ${esc(t(f.labelTh, f.labelEn))}
              </button>
            `
            ).join("")}
          </div>
          <div class="or-sorter-grid">
            ${visible
              .map(
                ({ s, i }) => `
              <button type="button" class="or-sorter-card${i === state.slideIdx ? " is-current" : ""}" data-or-jump="${i}">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">
                  <span class="or-code-pill">Slide ${s.num}</span>
                  <span style="font-size:11.5px;color:#64748b;font-weight:600">${esc(s.timeWindow)}</span>
                </div>
                <div style="font-family:var(--font-display);font-size:14px;font-weight:700;line-height:1.34;color:inherit">
                  ${esc(s.title)}
                </div>
                <div style="font-size:12px;color:#64748b;line-height:1.4">
                  ${esc(s.actLabel || s.sectionLabel)}
                </div>
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
          ${SLIDES.map((s, i) => renderSingleSlideCanvasHtml(s, i)).join("")}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="or-deck-shell${showNotesNow ? " has-notes-open" : ""}">
        <div class="or-deck-topbar">
          <div class="or-top-left">
            <span class="or-code-pill">ORIENT · INTERACTIVE 16:9</span>
            <div class="or-top-title-wrap">
              <span class="or-top-title">${esc(
                t(
                  "ปฐมนิเทศรายวิชา RACM 303: Objectives, Learning Experience & Evaluation",
                  "RACM 303 Orientation: Objectives, Learning Experience & Evaluation"
                )
              )}</span>
              <span class="or-top-sub">วันพุธที่ 25 พฤศจิกายน 2569 · 09.00 – 09.30 น. · ห้อง 2C2-03 ชั้น 2 อาคารพรีคลินิก</span>
            </div>
          </div>

          <div class="or-top-center" role="tablist" aria-label="สลับมุมมองสไลด์">
            <button type="button" class="or-mode-btn${state.viewMode === "deck" ? " is-active" : ""}" data-or-vmode="deck">${SVG.slides} <span>Interactive 16:9</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "sorter" ? " is-active" : ""}" data-or-vmode="sorter">${SVG.grid} <span>Slide Sorter (${SLIDES.length})</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "handout" ? " is-active" : ""}" data-or-vmode="handout">${SVG.handout} <span>Handout</span></button>
          </div>

          <div class="or-top-right">
            ${
              ROLE === "faculty"
                ? `<button type="button" class="or-timer-pill${state.timerRunning && state.timerSeconds <= 1800 ? " is-running" : ""}${state.timerSeconds > 1800 ? " is-overtime" : ""}" id="orTimerBtn" title="คลิกเพื่อเริ่ม/หยุดจับเวลาคาบปฐมนิเทศ 30 นาที (ดับเบิลคลิกเพื่อรีเซ็ต)">${formatTimer(state.timerSeconds)}</button>`
                : ""
            }
            <button type="button" class="or-tool-btn${state.showNotes ? " is-active-toggle" : ""}" id="orToggleNotesBtn" title="เปิด/ปิดบทเล่าเรื่องและแผนคุมเวลาผู้สอน (กด N)">${SVG.notes} <span>${esc(
              ROLE === "faculty" ? t("โน้ตผู้สอน", "Presenter Notes") : t("คำอธิบายเสริม", "Story Notes")
            )}</span></button>
            <a class="or-tool-btn" href="${PPTX_HREF}" download="RACM303_2569_Orientation_Slides.pptx" title="ดาวน์โหลดไฟล์ PowerPoint (.pptx) อัตราส่วน 16:9 แก้ไขได้">${SVG.download} <span>.pptx</span></a>
            <a class="or-tool-btn" href="${PDF_HREF}" download="RACM303_2569_Orientation_Slides.pdf" title="ดาวน์โหลดไฟล์สไลด์ PDF 16:9 คมชัดสูง">${SVG.download} <span>PDF</span></a>
            <button type="button" class="or-tool-btn" id="orPrintBtn" title="สั่งพิมพ์เอกสารประกอบสไลด์ 16:9">${SVG.print} <span>${esc(t("พิมพ์", "Print"))}</span></button>
            <button type="button" class="or-tool-btn is-primary" id="orPresentBtn" title="นำเสนอเต็มจอ (กด F)">${SVG.fullscreen} <span>${esc(
              state.presentationMode ? t("ออกจากเต็มจอ", "Exit Show") : t("นำเสนอเต็มจอ", "Slide Show")
            )}</span></button>
            <button type="button" class="or-tool-btn is-close" id="orCloseBtn" aria-label="ปิดหน้าต่างสไลด์" title="ปิด (Esc)">&times;</button>
          </div>
        </div>

        <div class="or-deck-viewport${state.viewMode !== "deck" ? " is-scrollable-mode" : ""}" id="orDeckViewport">
          ${viewportHtml}
        </div>

        ${
          showNotesNow
            ? `
          <div class="or-notes-dock">
            <div style="min-width:0;flex:1">
              <div class="or-notes-kicker">${esc(cur.timeWindow)} · NOTEBOOKLM STORYTELLING &amp; PRESENTER GUIDE</div>
              <p class="or-notes-text">${esc(cur.notes)}</p>
            </div>
            <button type="button" class="or-tool-btn${state.laserActive ? " is-active-toggle" : ""}" id="orLaserBtn" title="เปิด/ปิดจุดชี้เลเซอร์บนสไลด์ (กด L)">Laser (L)</button>
          </div>
        `
            : ""
        }

        ${
          state.viewMode === "deck"
            ? `
          <div class="or-deck-bottombar">
            <div class="or-nav-cluster">
              <button type="button" class="or-tool-btn" id="orPrevBtn" ${state.slideIdx === 0 ? "disabled" : ""}>&larr; ${esc(t("ก่อนหน้า", "Prev"))}</button>
              <select class="or-slide-select" id="orSlideSelect" aria-label="เลือกสไลด์">
                ${SLIDES.map(
                  (s, i) =>
                    `<option value="${i}" ${i === state.slideIdx ? "selected" : ""}>${s.num}. ${esc(s.title)}</option>`
                ).join("")}
              </select>
              <button type="button" class="or-tool-btn is-primary" id="orNextBtn" ${state.slideIdx === SLIDES.length - 1 ? "disabled" : ""}>${esc(t("ถัดไป", "Next"))} &rarr;</button>
            </div>

            <div class="or-filmstrip" role="navigation" aria-label="แถบลำดับสไลด์">
              ${SLIDES.map(
                (s, i) =>
                  `<button type="button" class="or-film-dot${i === state.slideIdx ? " is-active" : ""}" data-or-jump="${i}" title="${s.num}. ${esc(s.title)}">${s.num}</button>`
              ).join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    // Wire events
    modal.querySelectorAll("[data-or-vmode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.viewMode = btn.dataset.orVmode;
        renderModal();
      });
    });

    modal.querySelectorAll("[data-or-sfilter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sorterFilter = btn.dataset.orSfilter;
        renderModal();
      });
    });

    modal.querySelectorAll(".or-filmstrip [data-or-jump], .or-sorter-grid [data-or-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.slideIdx = Number(btn.dataset.orJump) || 0;
        state.viewMode = "deck";
        renderModal();
      });
    });

    const timerBtn = document.getElementById("orTimerBtn");
    if (timerBtn) {
      timerBtn.addEventListener("click", toggleTimer);
      timerBtn.addEventListener("dblclick", (ev) => {
        ev.preventDefault();
        resetTimer();
      });
    }

    const notesBtn = document.getElementById("orToggleNotesBtn");
    if (notesBtn) {
      notesBtn.addEventListener("click", () => {
        state.showNotes = !state.showNotes;
        renderModal();
      });
    }

    const laserBtn = document.getElementById("orLaserBtn");
    if (laserBtn) {
      laserBtn.addEventListener("click", () => {
        state.laserActive = !state.laserActive;
        renderModal();
      });
    }

    const printBtn = document.getElementById("orPrintBtn");
    if (printBtn) printBtn.addEventListener("click", printHandout);

    const presentBtn = document.getElementById("orPresentBtn");
    if (presentBtn) presentBtn.addEventListener("click", togglePresentationMode);

    const closeBtn = document.getElementById("orCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeDeck);

    const prevBtn = document.getElementById("orPrevBtn");
    if (prevBtn) prevBtn.addEventListener("click", () => goToSlide(state.slideIdx - 1));

    const nextBtn = document.getElementById("orNextBtn");
    if (nextBtn) nextBtn.addEventListener("click", () => goToSlide(state.slideIdx + 1));

    const sel = document.getElementById("orSlideSelect");
    if (sel) {
      sel.addEventListener("change", () => goToSlide(Number(sel.value) || 0));
    }

    wireCanvasInteractiveButtons(modal);
  }

  function openDeck(initialSlideIdx, opts) {
    const o = opts || {};
    syncPersonalGroupDefault();
    state.isOpen = true;
    if (typeof initialSlideIdx === "number" && !Number.isNaN(initialSlideIdx)) {
      state.slideIdx = Math.max(0, Math.min(SLIDES.length - 1, initialSlideIdx));
    }
    if (o.viewMode) state.viewMode = o.viewMode;
    if (o.presentationMode) {
      state.presentationMode = true;
    }
    renderModal();
    if (o.presentationMode) {
      const modal = ensureModalElement();
      if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
    }
  }

  function closeDeck() {
    state.isOpen = false;
    if (state.presentationMode) {
      state.presentationMode = false;
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
    const modal = document.getElementById("orientationDeckModal");
    if (modal) {
      modal.hidden = true;
      modal.classList.remove("is-presentation-mode");
    }
    if (window.location.hash === "#orientation" || window.location.hash === "#orientation-slides") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  window.RACM_ORIENTATION_DECK = {
    open: openDeck,
    close: closeDeck,
    goToSlide,
    getSlides: () => SLIDES,
    pptxHref: PPTX_HREF,
    pdfHref: PDF_HREF
  };

  function checkUrlAutoOpen() {
    const params = new URLSearchParams(window.location.search);
    const h = (window.location.hash || "").replace(/^#/, "");
    if (
      params.get("page") === "orientation" ||
      params.get("orient_print") === "1" ||
      h === "orientation" ||
      h === "orientation-slides"
    ) {
      setTimeout(() => {
        openDeck(0, {
          viewMode: params.get("orient_print") === "1" ? "handout" : "deck"
        });
      }, 60);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkUrlAutoOpen);
  } else {
    checkUrlAutoOpen();
  }
})();
