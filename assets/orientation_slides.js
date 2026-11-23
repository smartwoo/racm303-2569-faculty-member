/* ==========================================================================
   RACM 303 (2569) — Orientation to Community Medicine & Health Systems Science
   16:9 Widescreen Keynote Slide Studio (Objectives · Learning Experience · Evaluation)
   Includes 5-Competency Formative/Summative Assessment Blueprint for AY 2569
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const PPTX_HREF = "exports/pptx/RACM303_2569_Orientation_Slides.pptx";
  const PDF_HREF = "exports/pdf/RACM303_2569_Orientation_Slides.pdf";

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

  const SVG = {
    play: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
    handout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="17" x2="13" y2="17"/></svg>`,
    slides: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    notes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>`,
    fullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`
  };

  /* ---------- Complete 14-Slide Curriculum & Assessment Definition ---------- */
  const SLIDES = [
    {
      id: "s01-cover",
      num: "01",
      section: "intro",
      sectionLabel: "Opening",
      timeWindow: "09.00 – 09.02 น. (2 นาที)",
      kicker: "RACM 303 · ACADEMIC YEAR 2569 · COURSE ORIENTATION",
      title: "Orientation to Community Medicine and Health Systems Science",
      lead: "Objectives, Learning Experience, and Competency-Based Evaluation",
      notes:
        "กล่าวต้อนรับนักศึกษาแพทย์ชั้นปีที่ 3 รุ่นปีการศึกษา 2569 ทั้ง 169 คน แนะนำคณาจารย์ประจำรายวิชา ชี้แจงกรอบเวลา 30 นาทีแรก (09.00–09.30 น.) ซึ่งแบ่งเป็น 3 แกนหลัก: (1) Objectives, (2) Learning Experience 6 สัปดาห์ และ (3) Competency-Based Evaluation ก่อนเชื่อมต่อเข้าสู่คาบ Systems & Systems Thinking เวลา 09.30 น.",
      isCover: true
    },
    {
      id: "s02-why-hss",
      num: "02",
      section: "objectives",
      sectionLabel: "01 · Objectives",
      timeWindow: "09.02 – 09.04 น. (2 นาที)",
      kicker: "01 · WHY COMMUNITY MEDICINE & HEALTH SYSTEMS SCIENCE",
      title: "จากข้างเตียงสู่ชุมชนและระบบสุขภาพ: ทำไมแพทย์ยุคใหม่ต้องเข้าใจมากกว่าโรคในโรงพยาบาล?",
      lead: "เชื่อมโยงวิทยาศาสตร์การแพทย์พื้นฐานและเวชศาสตร์คลินิกเข้ากับวิทยาศาสตร์ระบบสุขภาพ เพื่อดูแลทั้งผู้ป่วยตรงหน้าและระบบที่กำหนดชีวิตของเขา",
      notes:
        "ย้อนจุดกำเนิดโครงการเวชศาสตร์ชุมชน รามาธิบดี (พ.ศ. 2511–2512 โดย ศ.นพ.อารี วัลยะเสวี และ ศ.นพ.เปรม บุรี) จากคำถามท้าทายว่าจะทำอย่างไรให้แพทย์จบใหม่ออกไปทำงานในสังคมจริงอย่างมีประสิทธิภาพ มีความสุข และเป็น Change Agent พร้อมชี้ให้เห็นเสาหลักที่ 3 ของแพทยศาสตรศึกษายุคใหม่ (Health Systems Science)",
      render: () => `
        <div class="or-grid-2-asym">
          <div class="or-card is-navy-tint">
            <span class="or-card-kicker">รากฐานเวชศาสตร์ชุมชน รามาธิบดี (พ.ศ. 2511 → ปัจจุบัน)</span>
            <h3 class="or-card-title">จากคำถามท้าทายของ ศ.นพ.อารี วัลยะเสวี &amp; ศ.นพ.เปรม บุรี สู่การสร้างแพทย์ที่เป็น Change Agent</h3>
            <p class="or-card-text">“เราจะเตรียมบัณฑิตแพทย์อย่างไร ให้ไม่เพียงรักษาโรคในโรงพยาบาลเมือง แต่เข้าใจบริบทชีวิตจริงของประชาชนในชนบทและสังคมไทย สามารถทำงานร่วมกับชุมชนและระบบสาธารณสุขได้อย่างมีประสิทธิภาพและมีความหมาย?”</p>
            <ul class="or-list">
              <li><strong>พ.ศ. 2511–2512:</strong> เริ่มสำรวจชุมชน ต.บางชัน และพัฒนาโครงการสหวิชาชีพ ณ อ.บางปะอิน</li>
              <li><strong>พ.ศ. 2525 → 2546:</strong> ยกระดับเป็นศูนย์เวชศาสตร์ชุมชน และจัดตั้งเป็น <strong>ภาควิชาเวชศาสตร์ชุมชน</strong></li>
              <li><strong>3 พันธกิจหลักปัจจุบัน:</strong> (1) Health Promotion &amp; Global Health · (2) Health Systems Research Unit · (3) Occupational &amp; Environmental Medicine</li>
            </ul>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.9cqw">
            <div class="or-card is-white">
              <span class="or-card-kicker">เสาหลักที่ 3 ของแพทยศาสตรศึกษายุคใหม่</span>
              <h3 class="or-card-title">Three Pillars of Modern Medical Education</h3>
              <ul class="or-list">
                <li><strong>1. Basic Science:</strong> กลไกระดับเซลล์ อวัยวะ และพยาธิสรีรวิทยาของโรค</li>
                <li><strong>2. Clinical Science:</strong> การซักประวัติ ตรวจร่างกาย วินิจฉัย และรักษาผู้ป่วยรายบุคคลข้างเตียง</li>
                <li><strong>3. Health Systems Science &amp; Epidemiology:</strong> เข้าใจปัจจัยกำหนดสุขภาพ ระบาดวิทยา ระบบบริการสุขภาพ การเงินการคลัง และนโยบายสาธารณะ</li>
              </ul>
            </div>
            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">หัวใจสำคัญของ RACM 303</span>
              <p class="or-card-text"><strong>การรักษาที่ปลายเหตุในโรงพยาบาลไม่เพียงพอ</strong> หากผู้ป่วยต้องกลับไปอยู่ในสภาพแวดล้อม อาชีพ ชุมชน หรือระบบบริการสุขภาพที่ยังเปราะบาง — แพทย์จึงต้องมองเห็นทั้ง <strong>“คน” “ชุมชน” และ “ระบบ”</strong> ไปพร้อมกัน</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s03-course-objectives",
      num: "03",
      section: "objectives",
      sectionLabel: "01 · Objectives",
      timeWindow: "09.04 – 09.06 น. (2 นาที)",
      kicker: "01 · COURSE GOALS & LEARNING OBJECTIVES (ก – ง)",
      title: "จุดมุ่งหมายและวัตถุประสงค์รายวิชา: พัฒนาครบทั้งฐานความรู้ ทักษะ ระบบคิด และเจตคติวิชาชีพ",
      lead: "เข้าใจวิทยาระบบสุขภาพในระดับบุคคล ชุมชน ประเทศ และโลก ตลอดจนปัจจัยทางสังคม เศรษฐกิจ และสิ่งแวดล้อมที่ส่งผลต่อการปฏิบัติงานคลินิก",
      notes:
        "ชี้ให้เห็นว่าวัตถุประสงค์ ก–ง ในคู่มือรายวิชา ไม่ได้วัดแค่การท่องจำเนื้อหา แต่เชื่อมตรงกับสมรรถนะแพทย์ 5 ด้าน (Knowledge base, Communication, Community & Health Systems, CPD และ Professionalism/Ethics) ที่จะใช้เป็นกรอบวัดผลสัมฤทธิ์ตลอด 6 สัปดาห์",
      render: () => `
        <div class="or-grid-4">
          <div class="or-card is-navy-tint">
            <span class="or-card-kicker">วัตถุประสงค์ ก. · COGNITIVE</span>
            <h3 class="or-card-title">อธิบายและประยุกต์ใช้วิทยาระบบสุขภาพ &amp; ระบาดวิทยา</h3>
            <ul class="or-list">
              <li>ระบาดวิทยาพื้นฐาน &amp; EBM (<code>EP1–EP9</code>)</li>
              <li>สุขภาพ SDH/CDH &amp; การป้องกัน 4 ระดับ (<code>HS1</code>)</li>
              <li>โครงสร้างระบบสุขภาพ 6BB, 6W &amp; Systems Thinking (<code>HS2</code>)</li>
              <li>คุณลักษณะพึงประสงค์ <code>EQESaRR</code> (<code>HS3</code>)</li>
              <li>สร้างเสริมสุขภาพ Ottawa, Nudge, <code>COM-B</code> (<code>HS4</code>)</li>
              <li>ระบบสุขภาพปฐมภูมิ PHC (<code>HS5</code>) &amp; ประกันสุขภาพ/การจ่ายเงิน (<code>HS6</code>)</li>
              <li>Global / Planetary Health &amp; SDGs</li>
            </ul>
          </div>
          <div class="or-card is-teal-tint">
            <span class="or-card-kicker">วัตถุประสงค์ ข. · AWARENESS</span>
            <h3 class="or-card-title">ตระหนักในบทบาทผู้นำ ศักยภาพชุมชน และจริยธรรม</h3>
            <ul class="or-list">
              <li><strong>บทบาทแพทย์ในฐานะผู้นำระบบสุขภาพ</strong> (Leadership roles of physicians)</li>
              <li><strong>ศักยภาพชุมชน</strong> และทุนทางสังคมในการดูแลสุขภาพตนเอง</li>
              <li><strong>คุณธรรม จริยธรรม</strong> ความตรงต่อเวลา ความซื่อสัตย์ เห็นอกเห็นใจ และไม่เอาเปรียบผู้อื่น</li>
            </ul>
          </div>
          <div class="or-card is-white">
            <span class="or-card-kicker">วัตถุประสงค์ ค. · SKILLS</span>
            <h3 class="or-card-title">คิดวิเคราะห์ สำรวจชุมชน และสื่อสารทำงานเป็นทีม</h3>
            <ul class="or-list">
              <li><strong>Cognitive Skill:</strong> คิด วิเคราะห์ วางแผน และแก้ปัญหาเชิงระบบ</li>
              <li><strong>Psychomotor Skill:</strong> ลงมือสำรวจและศึกษาชุมชนเชิงประจักษ์</li>
              <li><strong>Communication &amp; Collaboration:</strong> ทำงานร่วมกับเพื่อน สหวิชาชีพ เจ้าหน้าที่พื้นที่ และประชาชน พร้อมนำเสนอบทเรียน</li>
            </ul>
          </div>
          <div class="or-card is-amber-tint">
            <span class="or-card-kicker">วัตถุประสงค์ ง. · CHARACTER</span>
            <h3 class="or-card-title">คุณลักษณะการทำงานร่วมกันและการรู้คิดพัฒนาตน</h3>
            <ul class="or-list">
              <li><strong>Team Accountability:</strong> แสดงออกถึงความสามารถในการทำงานร่วมกับผู้อื่นเพื่อบรรลุภารกิจของทีม</li>
              <li><strong>Metacognition &amp; CPD:</strong> ทบทวนและสะท้อนคิดประสบการณ์การเรียนรู้ของตนเองอย่างเป็นระบบ (<code>SRN 1–2</code>)</li>
            </ul>
          </div>
        </div>
        <div class="or-callout-strip">
          <span><strong>ความเชื่อมโยงสำคัญ:</strong> วัตถุประสงค์ทั้ง 4 หมวด (ก–ง) รองรับ <strong>สมรรถนะหลัก 5 ด้าน (5 Core Competencies)</strong> ที่ใช้เป็นกรอบประเมินผลรายวิชานี้โดยตรง</span>
          <span>คู่มือรายวิชา บทที่ 3–4</span>
        </div>
      `
    },
    {
      id: "s04-fieldwork-5obj",
      num: "04",
      section: "objectives",
      sectionLabel: "01 · Objectives",
      timeWindow: "09.06 – 09.08 น. (2 นาที)",
      kicker: "01 · FIVE INTEGRATED FIELDWORK OBJECTIVES",
      title: "เข็มทิศ 5 วัตถุประสงค์การเรียนรู้ภาคสนาม: โจทย์บูรณาการสำหรับทั้ง 9 โรงพยาบาลชุมชน",
      lead: "ทุกบทเรียนในชั้นเรียน (HS1–HS6, EP1–EP9 และเวทีคิดเชิงระบบ) จะถูกนำไปสังเคราะห์จริงครบทั้ง 5 วัตถุประสงค์ในพื้นที่ภาคสนาม",
      notes:
        "ย้ำกับนักศึกษาว่าในปีการศึกษา 2569 การสังเคราะห์และนำเสนอการเรียนรู้ภาคสนามด้านระบบสุขภาพ (ฟอร์ม 3A วันที่ 29 ธ.ค.) กำหนดให้นำเสนอบูรณาการครบทั้ง 5 วัตถุประสงค์นี้ และการสำรวจเชิงปริมาณในข้อ 5 จะนำไปสู่งานนำเสนอระบาดวิทยา (ฟอร์ม 4A วันที่ 30 ธ.ค.)",
      render: () => `
        <div class="or-grid-5">
          <div class="or-card is-white">
            <div style="display:flex;align-items:center;justify-content:space-between"><span class="or-num-badge">01</span><span class="or-mini-chip">HS1</span></div>
            <h3 class="or-card-title">วิถีชุมชน &amp; ปัจจัยกำหนดสุขภาพ</h3>
            <p class="or-card-text">ศึกษาบริบทชุมชน ประวัติศาสตร์ อาชีพ สิ่งแวดล้อม และวิเคราะห์ปัจจัยกำหนดสุขภาพทางสังคมและพาณิชย์ (SDH / CDH) ในชีวิตจริง</p>
          </div>
          <div class="or-card is-white">
            <div style="display:flex;align-items:center;justify-content:space-between"><span class="or-num-badge">02</span><span class="or-mini-chip">HS1 · HS4 · HS5</span></div>
            <h3 class="or-card-title">ศักยภาพชุมชน &amp; ทุนทางสังคม</h3>
            <p class="or-card-text">วิเคราะห์ความเข้มแข็งขององค์กรชุมชน ผู้นำชุมชน อสม. และการมีส่วนร่วมของประชาชนในการจัดการปัญหาสุขภาพตนเอง</p>
          </div>
          <div class="or-card is-navy-tint">
            <div style="display:flex;align-items:center;justify-content:space-between"><span class="or-num-badge">03</span><span class="or-mini-chip">HS2 · HS3 · HS5 · HS6</span></div>
            <h3 class="or-card-title">ระบบบริการสุขภาพอำเภอ (DHS)</h3>
            <p class="or-card-text">วิเคราะห์โครงสร้างและการทำงานของ รพช. และ รพ.สต. เชื่อมโยงกรอบ Six Building Blocks, 6W Models of Care และคุณลักษณะ <code>EQESaRR</code></p>
          </div>
          <div class="or-card is-white">
            <div style="display:flex;align-items:center;justify-content:space-between"><span class="or-num-badge">04</span><span class="or-mini-chip">Leadership</span></div>
            <h3 class="or-card-title">บทบาทแพทย์ รพช. &amp; สหวิชาชีพ</h3>
            <p class="or-card-text">เรียนรู้บทบาทแพทย์โรงพยาบาลชุมชนทั้งในฐานะผู้ดูแลผู้ป่วย ผู้นำทีมสหวิชาชีพ และผู้ประสานภาคีเครือข่ายระดับอำเภอ</p>
          </div>
          <div class="or-card is-teal-tint">
            <div style="display:flex;align-items:center;justify-content:space-between"><span class="or-num-badge">05</span><span class="or-mini-chip">HS4 · EP1–EP9</span></div>
            <h3 class="or-card-title">สร้างเสริมสุขภาพ &amp; Health Survey</h3>
            <p class="or-card-text">วิเคราะห์/ออกแบบกิจกรรมสร้างเสริมสุขภาพ (<code>COM-B</code> / Ottawa Charter) และดำเนินการสำรวจสุขภาพชุมชนเชิงปริมาณตามหลักระบาดวิทยา</p>
          </div>
        </div>
        <div class="or-callout-strip">
          <span><strong>เป้าหมายปลายทางสัปดาห์ที่ 6:</strong> บูรณาการข้อ 1–5 สู่การนำเสนอระบบสุขภาพ (<strong>ฟอร์ม 3A · 29 ธ.ค.</strong>) และนำเสนอผลสำรวจเชิงปริมาณ (<strong>ฟอร์ม 4A · 30 ธ.ค.</strong>)</span>
          <span>7 เครื่องมือวิถีชุมชน + Quantitative Survey</span>
        </div>
      `
    },
    {
      id: "s05-roadmap-6weeks",
      num: "05",
      section: "experience",
      sectionLabel: "02 · Learning Experience",
      timeWindow: "09.08 – 09.11 น. (3 นาที)",
      kicker: "02 · 6-WEEK LEARNING JOURNEY (25 NOV – 30 DEC 2569)",
      title: "แผนที่เส้นทางการเรียนรู้ 6 สัปดาห์: เตรียมกรอบคิด → สัมผัสพื้นที่จริง → สังเคราะห์เชิงระบบ",
      lead: "ออกแบบตามจังหวะ Pre-fieldwork Foundation (สัปดาห์ 1–3) → Fieldwork Immersion (สัปดาห์ 4) → Post-fieldwork Synthesis (สัปดาห์ 5–6)",
      notes:
        "พากวาดสายตาภาพรวม 6 สัปดาห์ให้นักศึกษาเห็นจังหวะสำคัญ: สอบระบาดวิทยาก่อนไปภาคสนาม (8 ธ.ค.) และส่ง SRN 1 (9 ธ.ค.) จากนั้นลงพื้นที่จริง 7–9 คืน แล้วกลับมาทบทวนเตรียมโน้ต A4 สอบระบบสุขภาพ Open Note (22 ธ.ค.) ต่อด้วย CLD Workshop และการสังเคราะห์นำเสนอสัปดาห์ที่ 6",
      render: () => `
        <div class="or-grid-6">
          <div class="or-card is-white">
            <span class="or-card-kicker">สัปดาห์ที่ 1 · 25–27 พ.ย.</span>
            <h3 class="or-card-title">เปิดเลนส์ระบบ &amp; เริ่ม HS / EP</h3>
            <ul class="or-list">
              <li><strong>25 พ.ย.:</strong> Orientation · Systems Thinking · Global Health &amp; HPSR</li>
              <li><strong>26 พ.ย.:</strong> <code>HS1</code> + กลุ่มย่อย #1 (รู้จักทีม 9 พื้นที่)</li>
              <li><strong>27 พ.ย.:</strong> <code>EP1–EP3</code> &amp; Ex 1–2</li>
            </ul>
          </div>
          <div class="or-card is-white">
            <span class="or-card-kicker">สัปดาห์ที่ 2 · 30 พ.ย.–4 ธ.ค.</span>
            <h3 class="or-card-title">เข้มข้นทฤษฎี HS2–6 &amp; EP4–9</h3>
            <ul class="or-list">
              <li><strong>30 พ.ย.–1 ธ.ค.:</strong> <code>HS2, HS3, HS4, HS5</code> (ห้องใหญ่ + 6 กลุ่ม)</li>
              <li><strong>2–3 ธ.ค.:</strong> <code>EP4–EP9</code> &amp; Ex 3–6 (Hybrid/Zoom)</li>
              <li><strong>4 ธ.ค.:</strong> <code>HS6</code> + กลุ่มย่อย #2</li>
            </ul>
          </div>
          <div class="or-card is-amber-tint">
            <span class="or-card-kicker">สัปดาห์ที่ 3 · 8–12 ธ.ค.</span>
            <h3 class="or-card-title">สอบ EP · เตรียมเครื่องมือลงพื้นที่</h3>
            <ul class="or-list">
              <li><strong>8 ธ.ค.:</strong> <strong>สอบทฤษฎี EP</strong> · บ่ายเรียน SPSS + กลุ่มย่อย #3</li>
              <li><strong>9 ธ.ค.:</strong> Panel DHS (รศ.สุรเกียรติ) + กลุ่มย่อย #4 + <strong>ส่ง SRN 1</strong></li>
              <li><strong>9–12 ธ.ค.:</strong> กลุ่มย่อย #5–6 &amp; ออกเดินทาง</li>
            </ul>
          </div>
          <div class="or-card is-teal-tint">
            <span class="or-card-kicker">สัปดาห์ที่ 4 · 9–20 ธ.ค.</span>
            <h3 class="or-card-title">ฝึกปฏิบัติงานภาคสนาม 9 แห่ง</h3>
            <ul class="or-list">
              <li><strong>ระยะเวลา 7–9 คืน</strong> ตามกำหนดการแต่ละ รพช.</li>
              <li>ศึกษาวิถีชุมชน 7 เครื่องมือ ระบบสุขภาพอำเภอ และเก็บข้อมูล Health Survey</li>
              <li>อ.ที่ปรึกษาให้ Feedback <code>SRN 1</code></li>
            </ul>
          </div>
          <div class="or-card is-navy-tint">
            <span class="or-card-kicker">สัปดาห์ที่ 5 · 21–25 ธ.ค.</span>
            <h3 class="or-card-title">สอบ HS · CLD &amp; ถอดบทเรียน</h3>
            <ul class="or-list">
              <li><strong>21 ธ.ค.:</strong> SDL เตรียมกระดาษโน้ต A4</li>
              <li><strong>22 ธ.ค.:</strong> <strong>สอบทฤษฎี HS (Open Note)</strong> · บ่าย CLD Workshop</li>
              <li><strong>23–25 ธ.ค.:</strong> Panel 6BB · Policy Exercise · กลุ่มย่อย #7–10</li>
            </ul>
          </div>
          <div class="or-card is-rose-tint">
            <span class="or-card-kicker">สัปดาห์ที่ 6 · 28–30 ธ.ค.</span>
            <h3 class="or-card-title">นำเสนอแลกเปลี่ยน &amp; ปัจฉิมนิเทศ</h3>
            <ul class="or-list">
              <li><strong>28 ธ.ค.:</strong> กลุ่มย่อย #11–12 ซ้อมใหญ่</li>
              <li><strong>29 ธ.ค.:</strong> <strong>นำเสนอระบบสุขภาพ (3A)</strong> + กลุ่มย่อย #13</li>
              <li><strong>30 ธ.ค.:</strong> <strong>นำเสนอระบาดฯ (4A)</strong> · ปัจฉิมนิเทศ · <strong>ส่ง SRN 2</strong></li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "s06-hs-guided-learning",
      num: "06",
      section: "experience",
      sectionLabel: "02 · Learning Experience",
      timeWindow: "09.11 – 09.14 น. (3 นาที)",
      kicker: "02 · HEALTH SYSTEMS SCIENCE ARCHITECTURE",
      title: "การเรียนรู้หมวดระบบสุขภาพ: Guided Learning 5 ขั้นตอน (HS1–HS6) ควบคู่ 6 เวทีคิดเชิงระบบ",
      lead: "เปลี่ยนจากการนั่งฟังบรรยายทางเดียว สู่การอ่านคิดล่วงหน้า ฝึกดึงความรู้ สังเคราะห์ห้องใหญ่ และอภิปรายกรณีศึกษาใน 6 กลุ่มย่อย",
      notes:
        "อธิบายเส้นทาง 5 ขั้นตอนของ HS1–HS6: ① อ่านฉบับเต็ม → ② ทบทวนฉบับย่อ → ③ ฝึกทำ Self-Quiz 60 ข้อ/คำศัพท์ 111 คำ → ④ Slide อาจารย์สังเคราะห์ห้องใหญ่ 1 ชม. → ⑤ แยกเข้า 6 กลุ่มย่อย (1C1-02 ถึง 1C1-07) อภิปรายโจทย์ Contrasting Cases 2 ชม. 20 นาที ควบคู่ 6 คาบนอกกรอบสอบทฤษฎี (18.5 ชม.)",
      render: () => `
        <div class="or-grid-5">
          <div class="or-card is-white">
            <span class="or-card-kicker">STEP 01 · FULL</span>
            <h3 class="or-card-title">① ฉบับเต็ม</h3>
            <p class="or-card-text">ศึกษาแนวคิดหลัก หลักฐานเชิงประจักษ์ และทำคำถามนำในสมุดแบบฝึกหัดก่อนเข้าชั้นเรียน</p>
          </div>
          <div class="or-card is-white">
            <span class="or-card-kicker">STEP 02 · ABRIDGED</span>
            <h3 class="or-card-title">② ฉบับย่อ</h3>
            <p class="or-card-text">ทบทวนโครงสร้างความคิด แผนภาพสังเคราะห์ และตารางเปรียบเทียบเตรียมทำโน้ต A4</p>
          </div>
          <div class="or-card is-teal-tint">
            <span class="or-card-kicker">STEP 03 · SELF-QUIZ</span>
            <h3 class="or-card-title">③ โจทย์ 60 ข้อ</h3>
            <p class="or-card-text">ฝึก Active Recall พร้อมคำแนะนำจาก AI Mentor คำศัพท์ 111 คำ และ Rapid Review</p>
          </div>
          <div class="or-card is-white">
            <span class="or-card-kicker">STEP 04 · LECTURE</span>
            <h3 class="or-card-title">④ Slide อาจารย์</h3>
            <p class="or-card-text">ชั่วโมงสังเคราะห์แนวคิดในห้องใหญ่ 1 ชม. (<code>2C2-03</code>) เชื่อมโยงคำถามหลักและคลี่คลายจุดสับสน</p>
          </div>
          <div class="or-card is-navy-tint">
            <span class="or-card-kicker">STEP 05 · DISCUSSION</span>
            <h3 class="or-card-title">⑤ Case 6 กลุ่มย่อย</h3>
            <p class="or-card-text">อภิปรายเปรียบเทียบกรณีศึกษา (Contrasting Cases) แยก 6 กลุ่ม (<code>1C1-02..07</code> · 2 ชม. 20 นาที)</p>
          </div>
        </div>
        <div class="or-card is-amber-tint" style="padding:0.9cqw 1.2cqw">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:1cqw;flex-wrap:wrap">
            <span class="or-card-kicker" style="margin:0">BEYOND HS1–HS6 · 6 เวทีคิดเชิงระบบและเสวนาผู้เชี่ยวชาญ (18.5 ชม. · ไม่ได้ออกข้อสอบทฤษฎี แต่เป็นแกนหลักของภาคสนาม ฟอร์ม 3A &amp; SRN)</span>
          </div>
          <div class="or-chip-row">
            <span class="or-mini-chip">1. Systems &amp; CAS / Iceberg (25 พ.ย.)</span>
            <span class="or-mini-chip">2. Global/Planetary Health &amp; HPSR (25 พ.ย.)</span>
            <span class="or-mini-chip">3. District Health Systems · รศ.สุรเกียรติ (9 ธ.ค.)</span>
            <span class="or-mini-chip">4. CLD &amp; System Archetypes Workshop (22 ธ.ค.)</span>
            <span class="or-mini-chip">5. 6 Building Blocks “สุขภาวะข้างถนน” (23 ธ.ค.)</span>
            <span class="or-mini-chip">6. Policy &amp; Political Economy Exercise (24 ธ.ค.)</span>
          </div>
        </div>
      `
    },
    {
      id: "s07-epidemiology",
      num: "07",
      section: "experience",
      sectionLabel: "02 · Learning Experience",
      timeWindow: "09.14 – 09.16 น. (2 นาที)",
      kicker: "02 · CLINICAL & COMMUNITY EPIDEMIOLOGY (EP1 – EP9)",
      title: "หมวดระบาดวิทยาและเวชศาสตร์เชิงประจักษ์: จากการแปลผลหลักฐานสู่การสำรวจสุขภาพชุมชนจริง",
      lead: "เรียนรู้ครบวงจรตั้งแต่การวัดภาระโรค การประเมินความตรงและอคติของงานวิจัย ไปจนถึงการออกแบบ Health Survey และวิเคราะห์ด้วย SPSS",
      notes:
        "ชี้แจงรูปแบบการเรียนระบาดวิทยาทั้ง 3 วันหลัก: ศ. 27 พ.ย. บรรยาย 08.30–11.00 น. (Auditorium 2A01 + Zoom) และหลัง 11.00 น. ทำ Exercise 1–2 แบบ SDL ในระบบ E-learning ส่วน พ. 2 ธ.ค. และ พฤ. 3 ธ.ค. เรียน Hybrid (ห้อง 2C2-03 + Zoom) พร้อมช่วง Q&A เพื่อปูพื้นฐานสู่การสอบเช้าวันที่ 8 ธ.ค. และการเรียน SPSS บ่ายวันที่ 8 ธ.ค.",
      render: () => `
        <div class="or-grid-2-asym">
          <div style="display:flex;flex-direction:column;gap:0.8cqw">
            <div class="or-card is-white">
              <span class="or-card-kicker">DAY 1 · วันศุกร์ที่ 27 พ.ย. 2569 (08.30–11.00 น. Auditorium 2A01 + Zoom)</span>
              <h3 class="or-card-title">EP1 Intro · EP2 Diagnostic Test · EP3 Errors in Epidemiology</h3>
              <p class="or-card-text">Sensitivity, Specificity, PPV, NPV, LR และการจำแนก Random Error, Bias, Confounding + หลัง 11.00 น. <strong>Exercise 1–2 (SDL ใน E-learning)</strong> (อ. นพ.จักรกฤษณ์)</p>
            </div>
            <div class="or-card is-white">
              <span class="or-card-kicker">DAY 2 · วันพุธที่ 2 ธ.ค. 2569 (ห้อง 2C2-03 + Zoom)</span>
              <h3 class="or-card-title">EP4 Study Designs &amp; Impact · EP5 Surveillance &amp; Outbreak</h3>
              <p class="or-card-text">Cohort, Case-control, Cross-sectional, RR, OR, AR, PAR และการสอบสวนการระบาด + <strong>Exercise 3–4 &amp; Q&amp;A</strong> (อ. พญ.สวนีย์)</p>
            </div>
            <div class="or-card is-white">
              <span class="or-card-kicker">DAY 3 · วันพฤหัสบดีที่ 3 ธ.ค. 2569 (ห้อง 2C2-03 + Zoom)</span>
              <h3 class="or-card-title">EP6 Burden · EP7 Health Survey · EP8 Experimental · EP9 EBM</h3>
              <p class="or-card-text">Incidence/Prevalence/DALYs, การออกแบบสำรวจชุมชน, RCT และการประเมินหลักฐานตามกรอบ PICO + <strong>Exercise 5–6</strong> (อ.ปวินท์, ศ.วิชัย, ผศ.ฉัฐญาณ์)</p>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.9cqw">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">เชื่อมต่อสู่ปฏิบัติการภาคสนาม</span>
              <h3 class="or-card-title">SPSS Workshop &amp; Quantitative Health Survey</h3>
              <ul class="or-list">
                <li><strong>อังคาร 8 ธ.ค. (09.00–12.00 น.):</strong> สอบภาคทฤษฎีระบาดวิทยา (<code>2C2-02, 2C2-03</code>)</li>
                <li><strong>อังคาร 8 ธ.ค. (13.00–14.30 น.):</strong> ปฏิบัติการโปรแกรม <strong>SPSS</strong> สำหรับสร้างฐานข้อมูล ลงรหัส และวิเคราะห์สถิติสำรวจชุมชน</li>
                <li><strong>กลุ่มย่อย #3–#6 &amp; ภาคสนาม:</strong> ออกแบบโครงร่าง เก็บข้อมูลจริง ลดอคติ และสรุปข้อเสนอแนะเชิงพื้นที่</li>
                <li><strong>พุธ 30 ธ.ค. (08.30–12.45 น.):</strong> นำเสนอผลการศึกษาเชิงปริมาณกลุ่มละ 1 เรื่อง (<strong>ฟอร์ม 4A</strong>)</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s08-fieldwork-9sites",
      num: "08",
      section: "experience",
      sectionLabel: "02 · Learning Experience",
      timeWindow: "09.16 – 09.19 น. (3 นาที)",
      kicker: "02 · EXPERIENTIAL LEARNING & 9 COMMUNITY HOSPITALS",
      title: "การเรียนรู้จากประสบการณ์จริง (Kolb's Cycle) ณ 9 โรงพยาบาลชุมชนและชุมชนเป้าหมาย",
      lead: "ทำงานร่วมกันในกลุ่มย่อย 13 ครั้ง (เตรียมตัว SG 1–6 → ลงพื้นที่จริง 7–9 คืน → ถอดบทเรียนและสังเคราะห์ SG 7–13)",
      notes:
        "แนะนำทั้ง 9 พื้นที่ฝึกปฏิบัติงานภาคสนาม อาจารย์ที่ปรึกษาประจำกลุ่ม ห้องประชุมกลุ่มย่อยประจำ และช่วงวันเดินทางของแต่ละกลุ่ม ย้ำว่ากระบวนการเรียนรู้ใช้ Kolb's Experiential Learning Cycle คือต้องออกไปสัมผัสจริง สังเกตสะท้อนคิด สังเคราะห์ด้วยทฤษฎี และทดลองออกแบบข้อเสนอแนะ",
      render: () => `
        <div class="or-table-wrap">
          <table class="or-table">
            <thead>
              <tr>
                <th style="width:5%">กลุ่ม</th>
                <th style="width:23%">โรงพยาบาลภาคสนาม &amp; จังหวัด</th>
                <th style="width:8%">จำนวน</th>
                <th style="width:28%">อาจารย์ที่ปรึกษาประจำกลุ่ม</th>
                <th style="width:12%">ห้องกลุ่มย่อย</th>
                <th style="width:24%">กำหนดการฝึกภาคสนาม</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><strong>1</strong></td><td><strong>รพร.กุฉินารายณ์</strong> จ.กาฬสินธุ์</td><td>20 คน</td><td>อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์</td><td><code>3B1-01</code></td><td>พฤ. 10 – ส. 19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
              <tr><td><strong>2</strong></td><td><strong>รพร.ด่านซ้าย</strong> จ.เลย</td><td>19 คน</td><td>ผศ. พญ.ฉัฐญาณ์ / อ. พญ.วริษา</td><td><code>1C1-02</code></td><td>ส. 12 – ส. 19 ธ.ค. 69 (7 คืน 8 วัน)</td></tr>
              <tr><td><strong>3</strong></td><td><strong>รพ.ตะกั่วป่า</strong> จ.พังงา</td><td>18 คน</td><td>อ. นพ.ฉัตรชัย อิ่มอารมย์</td><td><code>3B1-05</code></td><td>พฤ. 10 – ส. 19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
              <tr><td><strong>4</strong></td><td><strong>รพ.ท่าวังผา</strong> จ.น่าน</td><td>18 คน</td><td>อ. นพ.จักรกฤษณ์ เอื้อสุนทรวัฒนา</td><td><code>3B1-06</code></td><td>ส. 12 – ส. 19 ธ.ค. 69 (7 คืน 8 วัน)</td></tr>
              <tr><td><strong>5</strong></td><td><strong>รพ.เพชรบูรณ์ (กลุ่ม 1)</strong> จ.เพชรบูรณ์</td><td>18 คน</td><td>ผศ. นพ.สัมฤทธิ์ / นพ.พีรสิชฌ์</td><td><code>1C1-04</code></td><td>พฤ. 10 – ส. 19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
              <tr><td><strong>6</strong></td><td><strong>รพ.เพชรบูรณ์ (กลุ่ม 2)</strong> จ.เพชรบูรณ์</td><td>18 คน</td><td>อ. นพ.ปวินท์ ศรีวิเชียร</td><td><code>1C1-05</code></td><td>พฤ. 10 – ส. 19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
              <tr><td><strong>7</strong></td><td><strong>รพ.อุบลรัตน์</strong> จ.ขอนแก่น</td><td>18 คน</td><td>อ. นพ.ภูษิต ประคองสาย</td><td><code>1C1-03</code></td><td>ส. 12 – อา. 20 ธ.ค. 69 (8 คืน 9 วัน)</td></tr>
              <tr><td><strong>8</strong></td><td><strong>รพ.ท่าสองยาง</strong> จ.ตาก</td><td>20 คน</td><td>ผศ. นพ.วิชช์ / นพ.ภรัณยู</td><td><code>1C1-06</code></td><td>ศ. 11 – ส. 19 ธ.ค. 69 (8 คืน 9 วัน)</td></tr>
              <tr><td><strong>9</strong></td><td><strong>รพ.อุ้มผาง</strong> จ.ตาก</td><td>20 คน</td><td>รศ. พญ.เริงฤดี ปธานวนิช</td><td><code>1C1-07</code></td><td>พ. 9 – ศ. 18 ธ.ค. 69 (เดินทางคืน 9 ธ.ค. 23.00 น.)</td></tr>
            </tbody>
          </table>
        </div>
      `
    },
    {
      id: "s09-competency-blueprint",
      num: "09",
      section: "evaluation",
      sectionLabel: "03 · Evaluation",
      timeWindow: "09.19 – 09.22 น. (3 นาที)",
      kicker: "03 · COMPETENCY-BASED ASSESSMENT BLUEPRINT (RACM 303 · ปีการศึกษา 2569)",
      title: "กรอบการวัดผลสัมฤทธิ์ในการเรียน RACM 303 ตามสมรรถนะหลัก 5 ด้าน (Formative & Summative)",
      lead: "เชื่อมโยงเครื่องมือวัดผลทุกชิ้นในรายวิชาเข้ากับสมรรถนะแพทย์ 5 ด้าน โดยแยกการประเมินเพื่อพัฒนา (Formative) ออกจากเกณฑ์ตัดสินผล (Summative)",
      notes:
        "สไลด์หัวใจสำคัญของพาร์ท Evaluation: ชี้ให้นักศึกษาเห็นโครงสร้างการวัดผลสัมฤทธิ์ทั้งระบบตามสมรรถนะ 5 ด้าน (1. Knowledge base, 2. Communication & Interpersonal skills, 3. Community skills, population health & health system, 4. Continuous professional development, 5. Professional habits, attitudes, moral, ethics) พร้อมแยก Formative (ฝึกและรับ Feedback โดยไม่กดดันเรื่องตก) กับ Summative (เกณฑ์ตัดสินผล O/S/M/U และคะแนนสอบทฤษฎี ≥ 2.00 / O ≥ 3.75)",
      render: () => `
        <div class="or-table-wrap">
          <table class="or-table">
            <thead>
              <tr>
                <th style="width:23%">Competency (สมรรถนะหลัก)</th>
                <th style="width:41%">เครื่องมือวัดผล (Assessment Tools)</th>
                <th style="width:17%">ผู้ประเมิน</th>
                <th style="width:19%">เกณฑ์การประเมินผล</th>
              </tr>
            </thead>
            <tbody>
              <tr class="is-domain-divider"><td colspan="4">ภาคทฤษฎี (Theoretical Domain)</td></tr>
              <tr>
                <td><strong>1. Knowledge base</strong><br><span style="font-size:0.86em;color:#64748b">ฐานความรู้ระบบสุขภาพและระบาดวิทยา</span></td>
                <td>
                  <div><span class="or-tag-inline is-formative">1. Formative</span> 1.1 คำถามนำ Case Workbook &amp; Self-Quiz 60 ข้อ (<code>HS1–6</code>) · 1.2 แบบฝึกหัด <code>EP Ex 1–6</code> · 1.3 <code>SRN 1</code> (รับ Feedback ช่วงภาคสนาม)</div>
                  <div style="margin-top:0.22cqw"><span class="or-tag-inline is-summative">2. Summative</span> 2.1 สอบทฤษฎีระบาดวิทยา (<code>EP1–9</code> · 8 ธ.ค.) · 2.2 สอบทฤษฎีระบบสุขภาพ (<code>HS1–6</code> Open Note · 22 ธ.ค.)</div>
                </td>
                <td>คณาจารย์ภาควิชาเวชศาสตร์ชุมชน</td>
                <td><strong>แยกเกณฑ์ EP &amp; HS:</strong><br>ผ่านเมื่อแต่ละส่วน <strong>&ge; 2.00</strong><br>(แต้มรวมแต่ละส่วน <strong>&ge; 3.75</strong> ได้ <strong>O</strong>)</td>
              </tr>
              <tr class="is-domain-divider"><td colspan="4">ภาคปฏิบัติและสมรรถนะวิชาชีพในชุมชน (Practical, Community &amp; Professionalism Domain)</td></tr>
              <tr>
                <td><strong>2. Communication &amp; Interpersonal skills</strong></td>
                <td>1. แบบประเมินพฤติกรรมจากเพื่อนในกลุ่ม (Peer Assessment)<br>2. แบบประเมินพฤติกรรมจากอาจารย์ (<code>ฟอร์ม 1A</code> ข้อ 1, 3, 4.1–4.2 &amp; การสื่อสารนำเสนอ <code>3A/4A</code>)</td>
                <td>เพื่อนในกลุ่ม ·<br>อาจารย์ที่ปรึกษากลุ่ม</td>
                <td><strong>O / S / M / U</strong><br><span style="font-size:0.86em;color:#64748b">(รายบุคคล · ประกอบฟอร์ม 2A)</span></td>
              </tr>
              <tr>
                <td><strong>3. Community skills, population health &amp; health system</strong></td>
                <td>1. นำเสนอการเรียนรู้ภาคสนาม ระบบสุขภาพ (<code>ฟอร์ม 3A</code> · 29 ธ.ค.) &amp; ระบาดวิทยา/Health Survey (<code>ฟอร์ม 4A</code> · 30 ธ.ค.)<br>2. แบบประเมินพฤติกรรมจากเพื่อนในกลุ่ม และจากอาจารย์ที่ปรึกษากลุ่ม (<code>ฟอร์ม 1A</code>)</td>
                <td>คณาจารย์ประจำวิชา ·<br>เพื่อนในกลุ่ม ·<br>อาจารย์ที่ปรึกษากลุ่ม</td>
                <td><strong>O / S / M / U</strong><br><span style="font-size:0.86em;color:#64748b">(ฟอร์ม 3A, 4A รายกลุ่ม · ฟอร์ม 1A รายบุคคล)</span></td>
              </tr>
              <tr>
                <td><strong>4. Continuous professional development</strong></td>
                <td>1. <span class="or-tag-inline is-formative">Formative</span> <code>SRN 1</code> (9 ธ.ค.) &amp; <span class="or-tag-inline is-summative">Summative</span> <code>SRN 2</code> (30 ธ.ค.)<br>2. แบบประเมินพฤติกรรมจากเพื่อนในกลุ่ม และอาจารย์ที่ปรึกษากลุ่ม (<code>ฟอร์ม 1A</code> ข้อ 2 ความใฝ่รู้)</td>
                <td>อาจารย์ที่ปรึกษากลุ่ม ·<br>เพื่อนในกลุ่ม</td>
                <td><strong>O / S / M / U</strong><br><span style="font-size:0.86em;color:#64748b">(รายบุคคล)</span></td>
              </tr>
              <tr>
                <td><strong>5. Professional habits, attitudes, moral, ethics</strong></td>
                <td>1. แบบประเมินพฤติกรรม Global Rating Scale (<code>ฟอร์ม 1A</code> ข้อ 6.1–6.3: ความรับผิดชอบ ซื่อสัตย์ น้ำใจ)<br>2. แบบประเมินภาพรวมของเจตคติและพฤติกรรม (<code>ฟอร์ม 2A</code>)</td>
                <td>อาจารย์ที่ปรึกษากลุ่ม<br><span style="font-size:0.86em;color:#64748b">(ข้อมูลประกอบจากเพื่อน)</span></td>
                <td><strong>O / S / M / U</strong> &rarr; ภาพรวม <strong>O / S / U</strong><br><span style="font-size:0.86em;color:#be123c">(ได้ U = ลงทะเบียนเรียนใหม่)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    },
    {
      id: "s10-eval-written-exams",
      num: "10",
      section: "evaluation",
      sectionLabel: "03 · Evaluation",
      timeWindow: "09.22 – 09.24 น. (2 นาที)",
      kicker: "03 · COMPETENCY 1 DEEP DIVE · TABLE SPECIFICATION & EXAM RULES",
      title: "เจาะลึกการสอบภาคทฤษฎีทั้ง 2 หมวด: สัดส่วนเนื้อหา (Table Specification) และกติกา Open Note",
      lead: "ระบาดวิทยาและระบบสุขภาพคิดเกณฑ์ผ่านแยกกัน (แต่ละส่วนต้องได้ ≥ 2.00) โดยระบบสุขภาพอนุญาตให้นำกระดาษโน้ต A4 ลายมือตนเองเข้าห้องสอบได้ 1 แผ่น",
      notes:
        "เน้นความแตกต่างของการสอบทั้ง 2 วัน: (1) อังคาร 8 ธ.ค. สอบระบาดวิทยา EP1–EP9 แบบ Closed-book ห้ามนำเครื่องคิดเลขหรือสมาร์ตวอทช์เข้าห้องสอบ และ (2) อังคาร 22 ธ.ค. สอบระบบสุขภาพ HS1–HS6 แบบ Open Note โดยต้องเป็นกระดาษ A4 เขียนด้วยลายมือตนเอง ปากกาหรือดินสอ 1 แผ่น หน้า-หลัง (ห้ามพิมพ์หรือถ่ายเอกสาร)",
      render: () => `
        <div class="or-grid-2">
          <div class="or-card is-white">
            <span class="or-card-kicker">SUMMATIVE 2.1 · อังคารที่ 8 ธ.ค. 2569 (09.00–12.00 น.)</span>
            <h3 class="or-card-title">สอบภาคทฤษฎีระบาดวิทยา (EP1–EP9 · Closed-Book)</h3>
            <p class="or-card-text">สถานที่: ห้อง <code>2C2-02</code> และ <code>2C2-03</code> ชั้น 2 อาคารพรีคลินิก</p>
            <ul class="or-list">
              <li><code>EP1</code> Introduction to Epidemiology — <em>ปูพื้นฐาน</em></li>
              <li><code>EP2</code> Diagnostic Test — <strong>15%</strong> · <code>EP3</code> Errors in Epidemiology — <strong>15%</strong></li>
              <li><code>EP4</code> Study Designs &amp; Impact (AR, PAR) — <strong>10%</strong></li>
              <li><code>EP5</code> Disease Surveillance &amp; Outbreak Investigation — <strong>15%</strong></li>
              <li><code>EP6</code> Measure of Burden of Disease — <strong>15%</strong> · <code>EP7</code> Health Survey — <strong>7.5%</strong></li>
              <li><code>EP8</code> Experimental Study — <strong>15%</strong> · <code>EP9</code> Evidence-Based Medicine — <strong>7.5%</strong></li>
            </ul>
          </div>
          <div class="or-card is-navy-tint">
            <span class="or-card-kicker">SUMMATIVE 2.2 · อังคารที่ 22 ธ.ค. 2569 (09.00–12.00 น.)</span>
            <h3 class="or-card-title">สอบภาคทฤษฎีระบบสุขภาพ (HS1–HS6 · Open Note)</h3>
            <p class="or-card-text">สถานที่: ห้อง <code>2C2-01</code>, <code>2C2-02</code>, <code>2C2-03</code> · <strong>กระดาษ A4 เขียนลายมือตนเอง 1 แผ่น (หน้า–หลัง)</strong></p>
            <ul class="or-list">
              <li><code>HS1</code> สุขภาพ ปัจจัยกำหนดสุขภาพ (SDH/CDH) &amp; การป้องกัน 4 ระดับ — <strong>20%</strong></li>
              <li><code>HS2</code> หน้าที่และโครงสร้างระบบสุขภาพ (6BB) &amp; รูปแบบการดูแล (6W) — <strong>15%</strong></li>
              <li><code>HS3</code> คุณลักษณะของระบบบริการสุขภาพที่พึงประสงค์ (<code>EQESaRR</code>) — <strong>15%</strong></li>
              <li><code>HS4</code> พฤติกรรมสุขภาพ การปรับพฤติกรรม (<code>COM-B</code>) &amp; สร้างเสริมสุขภาพ — <strong>15%</strong></li>
              <li><code>HS5</code> ระบบบริการสุขภาพปฐมภูมิ (PHC) &amp; บริการปฐมภูมิ — <strong>15%</strong></li>
              <li><code>HS6</code> การประกันสุขภาพ UHC &amp; กลไกการจ่ายเงินแก่ผู้ให้บริการ — <strong>20%</strong></li>
            </ul>
          </div>
        </div>
        <div class="or-callout-strip">
          <span><strong>ระเบียบห้องสอบเคร่งครัด:</strong> สายเกิน <strong>15 นาที</strong> ไม่อนุญาตเข้าห้องสอบ · แต่งกายถูกระเบียบติดป้ายชื่อ · ห้ามนำกระเป๋า สมาร์ตวอทช์ มือถือ เครื่องคิดเลข หรือเอกสารพิมพ์เข้าห้องสอบ</span>
          <span>คู่มือรายวิชา บทที่ 8–9</span>
        </div>
      `
    },
    {
      id: "s11-eval-practical-rubrics",
      num: "11",
      section: "evaluation",
      sectionLabel: "03 · Evaluation",
      timeWindow: "09.24 – 09.26 น. (2 นาที)",
      kicker: "03 · COMPETENCIES 2 – 5 DEEP DIVE · AUTHENTIC & PROFESSIONALISM RUBRICS",
      title: "เจาะลึกการประเมินภาคปฏิบัติ การสะท้อนคิด และเจตคติวิชาชีพ (สมรรถนะที่ 2–5)",
      lead: "ประเมินครบทั้งรายบุคคล (SRN 1–2, ฟอร์ม 1A, ฟอร์ม 2A, Peer Feedback) และรายกลุ่ม (การนำเสนอแลกเปลี่ยนเรียนรู้ฟอร์ม 3A และ 4A)",
      notes:
        "ชี้แจงรายละเอียดชิ้นงานสำคัญของสมรรถนะที่ 2–5: (1) SRN 1 ส่งก่อนไปภาคสนามเพื่อรับ Feedback (Formative) และ SRN 2 ส่งวันสุดท้าย, (2) การนำเสนอ 29–30 ธ.ค. ห้ามใช้ VDO อัดล่วงหน้า และควบคุมเวลาเคร่งครัดตามเสียงกริ่งเตือน, (3) ฟอร์ม 1A & 2A เน้นความซื่อสัตย์ ไม่ลอกงาน ไม่เซ็นชื่อแทนกัน และการทำงานร่วมกับผู้อื่น",
      render: () => `
        <div class="or-grid-3">
          <div class="or-card is-teal-tint">
            <span class="or-card-kicker">COMPETENCY 4 · SELF-REFLECTION (รายบุคคล)</span>
            <h3 class="or-card-title">บันทึกสะท้อนคิด SRN 1 &amp; SRN 2</h3>
            <ul class="or-list">
              <li><strong><code>SRN 1</code> (Formative + O/S/M/U):</strong> ส่งพุธ <strong>9 ธ.ค. 69 (17.00 น.)</strong> ทาง E-learning (ทำแบบประเมินภาคทฤษฎีก่อนส่ง · อ.ที่ปรึกษาให้ Feedback ช่วงภาคสนาม)</li>
              <li><strong><code>SRN 2</code> (Summative · O/S/M/U):</strong> ส่งพุธ <strong>30 ธ.ค. 69 (17.00 น.)</strong> หลังทำแบบประเมินรายวิชา</li>
              <li><strong>รูปแบบไฟล์:</strong> PDF <strong>ไม่เกิน 5 หน้า A4</strong> (<code>TH Sarabun New</code> 16 pt) ชื่อไฟล์ <code>SRN1_ชื่อกลุ่ม_รหัส_ชื่อ-สกุล.pdf</code></li>
            </ul>
          </div>
          <div class="or-card is-navy-tint">
            <span class="or-card-kicker">COMPETENCY 2 &amp; 3 · ORAL PRESENTATION (รายกลุ่ม)</span>
            <h3 class="or-card-title">การนำเสนอภาคสนาม ฟอร์ม 3A &amp; 4A</h3>
            <ul class="or-list">
              <li><strong>ระบบสุขภาพ (ฟอร์ม 3A · อ. 29 ธ.ค. 69):</strong> บูรณาการครบ <strong>5 วัตถุประสงค์</strong> · นำเสนอ <strong>&le; 10 นาที</strong> + อภิปราย <strong>&le; 20 นาที</strong> (รวม 30 นาที/กลุ่ม)</li>
              <li><strong>ระบาดวิทยา (ฟอร์ม 4A · พ. 30 ธ.ค. 69):</strong> Quantitative 1 เรื่อง · นำเสนอ <strong>&le; 7 นาที</strong> + อภิปราย <strong>&le; 18 นาที</strong> (รวม 25 นาที/กลุ่ม)</li>
              <li><strong>ข้อกำหนด:</strong> Formal presentation รูปแบบใดก็ได้ <strong>ยกเว้นห้ามใช้ VDO บันทึกล่วงหน้า</strong></li>
            </ul>
          </div>
          <div class="or-card is-amber-tint">
            <span class="or-card-kicker">COMPETENCY 2 &amp; 5 · GRS &amp; ATTITUDE (รายบุคคล)</span>
            <h3 class="or-card-title">ฟอร์ม 1A, ฟอร์ม 2A &amp; Peer Feedback</h3>
            <ul class="or-list">
              <li><strong>ฟอร์ม 1A (GRS):</strong> สื่อสารอ่อนน้อม · ความใฝ่รู้ · ภาวะผู้นำและทีม · มีส่วนร่วม · ความรับผิดชอบ · <strong>ความซื่อสัตย์ (ไม่บิดเบือนข้อมูล/ไม่ลอกงาน/ไม่เซ็นชื่อแทนกัน)</strong> · น้ำใจส่วนรวม</li>
              <li><strong>Peer Assessment:</strong> ข้อมูลจากเพื่อนร่วมกลุ่มใช้ประกอบการพิจารณารายบุคคล</li>
              <li><strong>ฟอร์ม 2A:</strong> สรุปภาพรวมพฤติกรรมและเจตคติเป็น <strong>O / S / U</strong></li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "s12-grading-milestones",
      num: "12",
      section: "evaluation",
      sectionLabel: "03 · Evaluation",
      timeWindow: "09.26 – 09.28 น. (2 นาที)",
      kicker: "03 · FINAL GRADE CRITERIA, REMEDIATION & SUBMISSION TIMELINE",
      title: "เกณฑ์การตัดสินเกรดสุดท้าย (O / S / U) การสอบซ่อม และสรุปกำหนดส่งงานสำคัญ",
      lead: "ตัดสินผลด้วยความโปร่งใส ชัดเจน ทั้งเงื่อนไขการผ่าน (S) เงื่อนไขเกรดดีเยี่ยม (O) และการสอบแก้ตัวแยกหมวดวิชา",
      notes:
        "สรุปกติกาการตัดเกรดรายวิชาให้ชัดเจนที่สุด: (1) จะได้ O ต้องได้ O ทั้งผลสอบทฤษฎี (แต่ละส่วน ≥ 3.75) และภาพรวมเจตคติ/พฤติกรรม (ฟอร์ม 2A) โดยไม่เคยสอบซ่อม, (2) ถ้าสอบทฤษฎีส่วนใดต่ำกว่า 2.00 สอบซ่อมเฉพาะส่วนนั้นได้ 1 ครั้ง ผ่านจะได้ S และมีผลต่อการรับเกียรตินิยม, (3) ถ้าเจตคติได้ U หรือสอบแก้ตัวไม่ผ่าน ต้องลงทะเบียนเรียนใหม่",
      render: () => `
        <div class="or-grid-2-asym">
          <div style="display:flex;flex-direction:column;gap:0.8cqw">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">เกณฑ์การได้เกรด O (OUTSTANDING)</span>
              <h3 class="or-card-title">ต้องครบทั้ง 3 เงื่อนไขพร้อมกัน</h3>
              <ul class="or-list">
                <li><strong>1. ผลสอบทฤษฎีได้ O:</strong> ทั้งระบบสุขภาพและระบาดวิทยา ผ่านเกณฑ์ (&ge; 2.00) และแต้มรวมของแต่ละส่วน <strong>&ge; 3.75</strong></li>
                <li><strong>2. ภาพรวมเจตคติและพฤติกรรม (ฟอร์ม 2A) ได้ O</strong></li>
                <li><strong>3. ไม่มีการสอบซ่อม</strong> ในส่วนใดส่วนหนึ่ง</li>
              </ul>
            </div>
            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">การสอบซ่อม &amp; การลงทะเบียนเรียนใหม่</span>
              <ul class="or-list">
                <li><strong>สอบซ่อมแยกวิชา (EP / HS):</strong> เมื่อแต้มส่วนใด <strong>&lt; 2.00</strong> มีโอกาสสอบแก้ตัว <strong>1 ครั้ง</strong> — หากสอบผ่านจะได้เกรด <strong>S</strong> <em>(มีผลต่อการได้รับเกียรตินิยม)</em></li>
                <li><strong>ต้องลงทะเบียนเรียนใหม่เมื่อ:</strong> (1) สอบแก้ตัวไม่ผ่าน หรือ (2) ผลประเมินเจตคติและพฤติกรรมได้ <strong>U</strong></li>
              </ul>
            </div>
          </div>
          <div class="or-table-wrap">
            <table class="or-table">
              <thead>
                <tr><th>กำหนดการสอบ / ส่งงานสำคัญ</th><th>วัน – เวลา &amp; ช่องทาง</th></tr>
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
      `
    },
    {
      id: "s13-attendance-safety",
      num: "13",
      section: "action",
      sectionLabel: "04 · Conduct & Launch",
      timeWindow: "09.28 – 09.29 น. (1 นาที)",
      kicker: "04 · ATTENDANCE, LEAVE POLICY & FIELDWORK REGULATIONS (B.E. 2561)",
      title: "กติกาเวลาเรียน การลา และระเบียบความปลอดภัยในการฝึกปฏิบัติงานนอกสถานที่",
      lead: "คุ้มครองความปลอดภัยของนักศึกษา ชุมชน และผู้เกี่ยวข้อง พร้อมรักษามาตรฐานวิชาชีพตลอดเวลาทั้งในสถานที่จริงและสื่อออนไลน์",
      notes:
        "ย้ำกติกาการเช็คชื่อ (ก่อนเรียน 15 นาที สายหลังเริ่ม 15 นาที) โควตาการลา (เวลาเรียนรวม ≥ 80%, ลาก่อน-หลังภาคสนาม ≤ 3 วัน, ช่วงภาคสนาม ≤ 1.5 วัน) และกฎความปลอดภัยเหล็กของประกาศภาควิชาฯ พ.ศ. 2561 โดยเฉพาะห้ามนำรถส่วนตัวไปใช้ ห้ามออกนอกเขตโดยพลการ งดเครื่องดื่มแอลกอฮอล์ และระมัดระวังการโพสต์สื่อออนไลน์",
      render: () => `
        <div class="or-grid-2">
          <div class="or-card is-white">
            <span class="or-card-kicker">เวลาเรียน &amp; การยื่นใบลา</span>
            <h3 class="or-card-title">วินัยการเข้าเรียนและสิทธิ์เข้าสอบ</h3>
            <ul class="or-list">
              <li><strong>การลงชื่อเข้าเรียน:</strong> ลงชื่อได้ <strong>15 นาทีก่อนเวลาเรียน</strong> และเริ่มนับว่า <strong>สายเมื่อเกิน 15 นาที</strong> หลังเวลาเริ่มเรียนตามตาราง</li>
              <li><strong>เกณฑ์มีสิทธิ์เข้าสอบ:</strong> ต้องมีเวลาเรียนรวมตลอดรายวิชา <strong>ไม่น้อยกว่าร้อยละ 80</strong></li>
              <li><strong>ช่วงก่อนและหลังภาคสนาม:</strong> ลาได้รวมกัน <strong>ไม่เกิน 3 วัน</strong></li>
              <li><strong>ช่วงฝึกปฏิบัติงานภาคสนาม:</strong> ลาได้ <strong>ไม่เกิน 1.5 วัน</strong></li>
              <li><strong>ขั้นตอนการลา:</strong> เขียนใบลาเป็นลายลักษณ์อักษร (ยื่นผ่านระบบใบลาออนไลน์ในพอร์ทัลได้) และต้องได้รับอนุญาตจากอาจารย์ที่ปรึกษาก่อนทุกครั้ง (หากป่วยกะทันหันในพื้นที่ ให้แจ้งอาจารย์/ครูพี่เลี้ยงทันที)</li>
            </ul>
          </div>
          <div class="or-card is-amber-tint">
            <span class="or-card-kicker">ประกาศภาควิชาฯ พ.ศ. 2561</span>
            <h3 class="or-card-title">6 กฎเหล็กความปลอดภัยและจริยธรรมภาคสนาม</h3>
            <ul class="or-list">
              <li><strong>1. การเดินทาง:</strong> ใช้เฉพาะยานพาหนะที่ภาควิชาฯ หรือ รพช. จัดไว้ให้ <strong>ห้ามนำยานพาหนะส่วนตัวไปใช้</strong> และไม่เปลี่ยนเส้นทางโดยพลการ</li>
              <li><strong>2. ที่พักและขอบเขตพื้นที่:</strong> พักในสถานที่ที่จัดไว้ให้เท่านั้น <strong>ห้ามออกนอกเขตฝึกปฏิบัติงาน</strong> หรือไปเก็บข้อมูลตามลำพังโดยไม่แจ้งขออนุญาต</li>
              <li><strong>3. การเข้าพบ:</strong> ขอความร่วมมือผู้ปกครอง/บุคคลภายนอกหลีกเลี่ยงการเข้าพบระหว่างฝึกภาคสนาม (หากจำเป็นต้องขออนุญาตล่วงหน้าทุกกรณี)</li>
              <li><strong>4. การแต่งกาย:</strong> สุภาพเรียบร้อยเหมาะสมกับบริบท (ติดป้ายชื่อ/ชุดนักศึกษาเมื่อปฏิบัติงานในโรงพยาบาลและสถานที่ราชการ)</li>
              <li><strong>5. ข้อห้ามทางวินัย:</strong> <strong>งดดื่มแอลกอฮอล์ สารเสพติด การพนัน</strong> และการประพฤติผิดกฎหมายตลอดทริป (รวมนอกเวลาเรียน)</li>
              <li><strong>6. ความเคารพและสื่อโซเชียล:</strong> สุภาพ อ่อนน้อม เคารพสิทธิชุมชน และระมัดระวังการเผยแพร่ภาพ/ข้อมูลในสื่อออนไลน์</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "s14-digital-launch",
      num: "14",
      section: "action",
      sectionLabel: "04 · Conduct & Launch",
      timeWindow: "09.29 – 09.30 น. (1 นาที)",
      kicker: "04 · DIGITAL ECOSYSTEM & WEEK 1 ACTION CHECKLIST",
      title: "ระบบดิจิทัลประจำรายวิชา และ 4 ก้าวแรกที่ต้องทำทันทีในสัปดาห์ที่ 1",
      lead: "เชื่อมต่อตารางเรียน บทเรียน HS1–HS6 ห้องเรียน Zoom พื้นที่ภาคสนาม และระบบส่งงานไว้ในที่เดียว พร้อมเริ่มต้นคาบแรกทันทีเวลา 09.30 น.",
      notes:
        "สรุปปิดท้ายปฐมนิเทศ: ให้นักศึกษาเลือกชื่อ/กลุ่มในพอร์ทัลเพื่อซิงค์ปฏิทิน .ics ลงมือถือ เตรียมตัวอ่านและทำคำถามนำ HS1 เย็นนี้สำหรับคาบพรุ่งนี้เช้า (พฤ. 26 พ.ย. 08.30 น.) และส่งต่อเข้าสู่คาบ Systems & Systems Thinking เวลา 09.30–12.00 น. ณ ห้อง 2C2-03 ได้ทันที",
      render: () => `
        <div class="or-grid-2">
          <div class="or-card is-navy-tint">
            <span class="or-card-kicker">RACM 303 DIGITAL ECOSYSTEM</span>
            <h3 class="or-card-title">3 ช่องทางหลักที่ใช้ตลอดรายวิชา</h3>
            <ul class="or-list">
              <li><strong>1. RACM 303 Smart Portal:</strong> ผูกชื่อ/รหัสนักศึกษาเพื่อดูตารางเฉพาะกลุ่ม · ซิงค์ปฏิทิน <code>.ics</code> เข้า Google/Apple Calendar · เรียน <code>HS1–HS6</code> ครบ 5 ขั้นตอน · เช็กห้อง Zoom ระบาดวิทยา · ยื่นใบลาออนไลน์</li>
              <li><strong>2. RAMA E-learning (<code>course id=398</code>):</strong> ส่งบันทึกสะท้อนคิด <code>SRN 1</code> (9 ธ.ค.) และ <code>SRN 2</code> (30 ธ.ค.)</li>
              <li><strong>3. Google Form ประจำปี 2569:</strong> ส่งไฟล์สไลด์นำเสนอแลกเปลี่ยนเรียนรู้ภาคสนาม (29–30 ธ.ค.) และชุดแบบสอบถาม Health Survey</li>
            </ul>
            <div style="display:flex;flex-wrap:wrap;gap:0.5cqw;margin-top:0.4cqw">
              <button type="button" class="or-jump-btn" data-or-action="profile">ตั้งค่าชื่อ / กลุ่มของฉัน &rarr;</button>
              <button type="button" class="or-jump-btn" data-or-action="ics">ดาวน์โหลดปฏิทิน .ics &rarr;</button>
              <button type="button" class="or-jump-btn" data-or-action="hs1">เปิดบทเรียน HS1 &rarr;</button>
            </div>
          </div>
          <div class="or-card is-teal-tint">
            <span class="or-card-kicker">WEEK 1 CHECKLIST · เริ่มต้นทันทีวันนี้!</span>
            <h3 class="or-card-title">4 กิจกรรมแรกของสัปดาห์ที่ 1</h3>
            <ul class="or-list">
              <li><strong>① วันนี้ 09.30 – 12.00 น. (ห้อง <code>2C2-03</code>):</strong> เรียนต่อเนื่องคาบ <strong>Systems &amp; Systems Thinking</strong> (CAS &amp; Iceberg Model)</li>
              <li><strong>② วันนี้ 13.00 – 16.00 น. (ห้อง <code>2C2-03</code>):</strong> เวทีเสวนา <strong>Bedside to Systems-Based Practice: Global/Planetary Health &amp; HPSR</strong></li>
              <li><strong>③ เย็นวันนี้ (Pre-class <code>HS1</code>):</strong> อ่านเอกสารและตอบคำถามนำก่อนเรียน <code>HS1</code> เพื่อเตรียมเข้าห้องใหญ่ <code>08.30 น.</code> และแยก 6 กลุ่มย่อย <code>09.40 น.</code> พรุ่งนี้</li>
              <li><strong>④ พฤหัสบดี 26 พ.ย. (13.00 – 16.30 น.):</strong> พบอาจารย์ที่ปรึกษาประจำกลุ่มภาคสนามทั้ง 9 กลุ่ม ใน <strong>กิจกรรมกลุ่มย่อย ครั้งที่ 1</strong></li>
            </ul>
          </div>
        </div>
      `
    }
  ];

  const SECTION_FILTERS = [
    { id: "all", labelTh: "ทั้งหมด (14)", labelEn: "All Slides (14)" },
    { id: "intro", labelTh: "เปิดคาบ (1)", labelEn: "Opening (1)" },
    { id: "objectives", labelTh: "01 · วัตถุประสงค์ (3)", labelEn: "01 · Objectives (3)" },
    { id: "experience", labelTh: "02 · ประสบการณ์เรียนรู้ (4)", labelEn: "02 · Learning Experience (4)" },
    { id: "evaluation", labelTh: "03 · การวัดผล 5 สมรรถนะ (4)", labelEn: "03 · Competency Evaluation (4)" },
    { id: "action", labelTh: "04 · ระเบียบ & ก้าวแรก (2)", labelEn: "04 · Conduct & Launch (2)" }
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

    return `
      <div class="or-cover-stage">
        <div class="or-cover-top">
          <span class="or-cover-dept">ภาควิชาเวชศาสตร์ชุมชน · คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล</span>
          <span class="or-cover-code-chip">RACM 303 · ปีการศึกษา 2569</span>
        </div>

        <div class="or-cover-main">
          <span class="or-cover-kicker">COURSE ORIENTATION · วันพุธที่ 25 พฤศจิกายน 2569 · 09.00 – 09.30 น.</span>
          <h2 class="or-cover-h1">Orientation to Community Medicine and Health Systems Science</h2>
          <p class="or-cover-sub">Objectives, Learning Experience, and Competency-Based Evaluation — สำหรับนักศึกษาแพทย์ชั้นปีที่ 3 (169 คน)</p>

          <div class="or-cover-pillars">
            <div class="or-cover-pillar">
              <span class="or-cover-pillar-num">PART 01 · OBJECTIVES</span>
              <span class="or-cover-pillar-title">จุดมุ่งหมาย &amp; 5 วัตถุประสงค์</span>
              <span class="or-cover-pillar-desc">เชื่อมผู้ป่วยข้างเตียงสู่ชุมชน ระบบสุขภาพอำเภอ และบทบาท Change Agent</span>
            </div>
            <div class="or-cover-pillar">
              <span class="or-cover-pillar-num">PART 02 · LEARNING EXPERIENCE</span>
              <span class="or-cover-pillar-title">เส้นทาง 6 สัปดาห์ &amp; 9 พื้นที่จริง</span>
              <span class="or-cover-pillar-desc">Guided Learning 5 ขั้น (HS1–6) · 6 เวทีเชิงระบบ · EP1–9 · ภาคสนาม 9 รพช.</span>
            </div>
            <div class="or-cover-pillar">
              <span class="or-cover-pillar-num">PART 03 · EVALUATION</span>
              <span class="or-cover-pillar-title">การวัดผลสัมฤทธิ์ 5 สมรรถนะ</span>
              <span class="or-cover-pillar-desc">แยก Formative เพื่อพัฒนา กับ Summative ตัดสินผล (EP/HS, SRN 1–2, ฟอร์ม 1A–4A)</span>
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
              <span class="or-sld-kicker">${esc(slide.kicker)}</span>
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
          <span>RACM 303 (ปีการศึกษา 2569) · Orientation to Community Medicine &amp; Health Systems Science</span>
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

  function wireCanvasInteractiveButtons(rootEl) {
    rootEl.querySelectorAll("[data-or-action]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        handleSlideAction(btn.dataset.orAction);
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
                  ${esc(s.sectionLabel)}
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
            <span class="or-code-pill">ORIENT · 16:9</span>
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
            <button type="button" class="or-mode-btn${state.viewMode === "deck" ? " is-active" : ""}" data-or-vmode="deck">${SVG.slides} <span>16:9 Slide</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "sorter" ? " is-active" : ""}" data-or-vmode="sorter">${SVG.grid} <span>Slide Sorter (${SLIDES.length})</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "handout" ? " is-active" : ""}" data-or-vmode="handout">${SVG.handout} <span>Handout</span></button>
          </div>

          <div class="or-top-right">
            ${
              ROLE === "faculty"
                ? `<button type="button" class="or-timer-pill${state.timerRunning && state.timerSeconds <= 1800 ? " is-running" : ""}${state.timerSeconds > 1800 ? " is-overtime" : ""}" id="orTimerBtn" title="คลิกเพื่อเริ่ม/หยุดจับเวลาคาบปฐมนิเทศ 30 นาที (ดับเบิลคลิกเพื่อรีเซ็ต)">${formatTimer(state.timerSeconds)}</button>`
                : ""
            }
            <button type="button" class="or-tool-btn${state.showNotes ? " is-active-toggle" : ""}" id="orToggleNotesBtn" title="เปิด/ปิดบทพูดและแผนคุมเวลาผู้สอน (กด N)">${SVG.notes} <span>${esc(
              ROLE === "faculty" ? t("โน้ตผู้สอน", "Presenter Notes") : t("คำอธิบายเสริม", "Slide Notes")
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
              <div class="or-notes-kicker">${esc(cur.timeWindow)} · PRESENTER GUIDE &amp; KEY POINTS</div>
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

    modal.querySelectorAll("[data-or-jump]").forEach((btn) => {
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

  // Auto-open if URL hash or query param explicitly requests orientation slides
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
