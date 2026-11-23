/* ==========================================================================
   RACM 303 (2569) — Orientation to Community Medicine & Health Systems Science
   15-Slide Non-Interactive 16:9 Widescreen Keynote Slide Deck
   Design System: Nano Banana Publication PNG Infographics (assets/images/orientation/)
                × NotebookLM "Start with Why" 4-Act Visual Storytelling
   Includes 5-Competency Formative & Summative Assessment Blueprint for AY 2569
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const PPTX_HREF = "exports/pptx/RACM303_2569_Orientation_Slides.pptx";
  const PDF_HREF = "exports/pdf/RACM303_2569_Orientation_Slides.pdf";
  const IMG_DIR = "assets/images/orientation";

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

  function figPlate(fileName, altText, captionText, extraCls) {
    return `
      <figure class="or-fig-plate${extraCls ? " " + extraCls : ""}" style="margin:0">
        <div class="or-fig-img-wrap">
          <img class="or-fig-img" src="${IMG_DIR}/${esc(fileName)}" alt="${esc(altText)}" loading="eager" decoding="async" />
        </div>
        ${captionText ? `<figcaption class="or-fig-cap">${captionText}</figcaption>` : ""}
      </figure>
    `;
  }

  const SVG = {
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
    handout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="17" x2="13" y2="17"/></svg>`,
    slides: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    notes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>`,
    fullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`
  };

  /* ---------- Complete 15-Slide Non-Interactive Deck ---------- */
  const SLIDES = [
    {
      id: "s01-cover",
      num: "01",
      section: "intro",
      sectionLabel: "Opening",
      actClass: "",
      actLabel: "OPENING · 4-ACT STORY",
      timeWindow: "09.00 – 09.02 น. (2 นาที)",
      kicker: "RACM 303 · ACADEMIC YEAR 2569 · COURSE ORIENTATION",
      title: "Orientation to Community Medicine and Health Systems Science",
      lead: "Start with Why, 6-Week Learning Experience, and 5-Competency Evaluation",
      notes:
        "กล่าวต้อนรับนักศึกษาแพทย์ชั้นปีที่ 3 รุ่นปีการศึกษา 2569 ทั้ง 169 คน แนะนำคณาจารย์ประจำรายวิชา ชี้แจงภาพรวม 30 นาทีแรก (09.00–09.30 น.) ที่ร้อยเรียงเป็น 4 องก์: (1) Start with Why & Objectives, (2) 6-Week Learning Journey & โรงพยาบาลแหล่งฝึก 9 แห่ง, (3) การวัดผลสัมฤทธิ์ 5 สมรรถนะ และ (4) ระเบียบความปลอดภัยและก้าวแรกสัปดาห์ที่ 1",
      isCover: true
    },
    {
      id: "s02-third-pillar-why",
      num: "02",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · START WITH WHY",
      timeWindow: "09.02 – 09.04 น. (2 นาที)",
      kicker: "01 · HEALTH SYSTEMS SCIENCE AS THE THIRD PILLAR OF MEDICAL EDUCATION",
      title: "Start with Why: ทำไม Health Systems Science จึงเป็น “เสาหลักที่ 3” ของแพทยศาสตรศึกษายุคใหม่?",
      lead: "ความรู้ระดับเซลล์ (Basic Science) และทักษะข้างเตียง (Clinical Science) จะเกิดคุณค่าต่อผู้ป่วยจริงได้ ต้องอาศัยเสาหลักที่ 3 เชื่อมโยงระบบบริการสุขภาพ",
      notes:
        "เริ่มด้วยคำถาม Start with Why (Simon Sinek) คู่กับแผนภาพ Three-Pillar Model ของ AMA (Skochelak et al.): หากแพทย์เก่งแต่กลไกโรคและการสั่งยาข้างเตียง แต่ไม่เข้าใจระบบบริการ การส่งต่อ สิทธิการรักษา และบริบทสังคม การรักษาที่ดีที่สุดในตำราก็อาจไปไม่ถึงชีวิตจริงของผู้ป่วย",
      render: () => `
        <div class="or-infog-split is-fig-left">
          ${figPlate(
            "orient_s02_third_pillar.png",
            "The Three-Pillar Model of Medical Education: Basic Science, Clinical Science, and Health Systems Science",
            "Three-Pillar Model of Medical Education — Health Systems Science (“The Third Science”) ผสานพลังร่วมกับ Basic และ Clinical Science"
          )}

          <div style="display:flex;flex-direction:column;gap:0.55cqw;min-height:0">
            <div class="or-card is-rose-tint" style="padding:0.68cqw 0.92cqw;gap:0.2cqw">
              <span class="or-card-kicker">1 · START WITH WHY (เหตุผลตั้งต้นของวิชาชีพแพทย์)</span>
              <h3 class="or-card-title">ทำไมเก่งแค่การวินิจฉัยและสั่งยาข้างเตียงจึงยังไม่เพียงพอ?</h3>
              <p class="or-card-text">เพราะแม้การรักษาในโรงพยาบาลจะถูกต้องตามตำรา แต่หากผู้ป่วยเข้าไม่ถึงบริการ ขาดระบบดูแลต่อเนื่อง ล้มละลายจากค่ารักษา หรือกลับไปอยู่ในสภาพแวดล้อมเดิม ผู้ป่วยก็จะกลับมาป่วยซ้ำไม่รู้จบ</p>
            </div>

            <div class="or-card is-navy-tint" style="padding:0.68cqw 0.92cqw;gap:0.2cqw">
              <span class="or-card-kicker">2 · HOW THE 3 PILLARS SYNERGIZE (กลไกการผสาน 3 เสาหลัก)</span>
              <ul class="or-list" style="gap:0.2cqw">
                <li><strong>Basic Science:</strong> เข้าใจกลไกพยาธิสรีรวิทยาของโรคระดับเซลล์และอวัยวะ</li>
                <li><strong>Clinical Science:</strong> ซักประวัติ ตรวจร่างกาย วินิจฉัย และรักษาผู้ป่วยรายบุคคล</li>
                <li><strong>Health Systems Science:</strong> เข้าใจระบบบริการ การทำงานเป็นทีม คุณภาพ/ความปลอดภัย การเงินการคลัง และปัจจัยกำหนดสุขภาพ</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint or-mt-auto" style="padding:0.62cqw 0.92cqw;gap:0.18cqw">
              <span class="or-card-kicker">3 · WHAT RACM 303 DELIVERS (การเปลี่ยนผ่านในชั้นปีที่ 3)</span>
              <p class="or-card-text">ขยายกรอบคิดจาก <strong>“ผู้รักษาโรคเฉพาะหน้า”</strong> สู่ <strong>“แพทย์ผู้เข้าใจระบบและร่วมสร้างสุขภาวะที่มีคุณค่า (Value-Based &amp; Equitable Care)”</strong></p>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Start with Why</span>
          <span class="or-story-a">Basic &amp; Clinical Science ตอบว่า <strong>“เราจะรักษาโรคอย่างไร”</strong> แต่ Health Systems Science ตอบว่า <strong>“ทำไมการรักษาของเราจึงส่งผลเปลี่ยนชีวิตผู้ป่วยและสังคมได้จริง”</strong></span>
        </div>
      `
    },
    {
      id: "s03-beyond-bedside",
      num: "03",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · START WITH WHY",
      timeWindow: "09.04 – 09.06 น. (2 นาที)",
      kicker: "01 · BEYOND THE HOSPITAL WATERLINE & RAMATHIBODI HERITAGE",
      title: "มองให้ลึกกว่าสิ่งที่เห็นในวอร์ด: จากรากเหง้าสุขภาพในชุมชน สู่ปณิธานเวชศาสตร์ชุมชน รามาธิบดี",
      lead: "เชื่อมโยงการดูแลข้างเตียงเข้ากับบริบทอาชีพ สิ่งแวดล้อม ชุมชน และระบบสุขภาพ เพื่อสร้างแพทย์ที่เป็นผู้นำการเปลี่ยนแปลง (Change Agent)",
      notes:
        "เชื่อมภาพสิ่งที่เห็นเหนือระดับโรงพยาบาลกับรากเหง้าด้านล่าง (อาชีพ โภชนาการ ที่อยู่อาศัย อสม. ระบบบริการปฐมภูมิ หลักประกันสุขภาพ และนโยบาย) เข้ากับปณิธานก่อตั้งเวชศาสตร์ชุมชน รามาธิบดี ตั้งแต่ พ.ศ. 2511 โดย ศ.นพ.อารี วัลยะเสวี และ ศ.นพ.เปรม บุรี",
      render: () => `
        <div class="or-infog-split is-fig-left">
          ${figPlate(
            "orient_s03_beyond_bedside.png",
            "เชื่อมโยงการดูแลข้างเตียง ปัจจัยกำหนดสุขภาพในชุมชน และระบบสุขภาพ สู่บทบาท Change Agent",
            "จากอาการเจ็บป่วยที่ปลายเหตุในโรงพยาบาล สู่ปัจจัยกำหนดสุขภาพ (SDH/CDH) และโครงสร้างระบบสุขภาพที่กำหนดชีวิตจริงของประชาชน"
          )}

          <div style="display:flex;flex-direction:column;gap:0.55cqw;min-height:0">
            <div class="or-card is-navy-tint" style="padding:0.72cqw 0.95cqw;gap:0.24cqw">
              <span class="or-card-kicker">รากฐานเวชศาสตร์ชุมชน รามาธิบดี (พ.ศ. 2511 &rarr; ปัจจุบัน)</span>
              <h3 class="or-card-title">คำถามตั้งต้นของ ศ.นพ.อารี วัลยะเสวี &amp; ศ.นพ.เปรม บุรี</h3>
              <p class="or-card-text">“เราจะเตรียมบัณฑิตแพทย์อย่างไร ให้ไม่เพียงรักษาโรคในโรงพยาบาลเมือง แต่เข้าใจบริบทชีวิตจริงของประชาชนไทย ทำงานร่วมกับชุมชนและระบบสาธารณสุขได้อย่างมีประสิทธิภาพ มีความสุข และเป็น <strong>Change Agent</strong>?”</p>
            </div>

            <div class="or-card is-white" style="padding:0.68cqw 0.95cqw;gap:0.24cqw">
              <span class="or-card-kicker">พัฒนาการสำคัญ &amp; 3 หน่วยงานหลักของภาควิชาฯ</span>
              <ul class="or-list" style="gap:0.24cqw">
                <li><strong>พ.ศ. 2511–2512:</strong> เริ่มสำรวจสุขภาพชุมชน ต.บางชัน และพัฒนาโครงการเวชศาสตร์ชุมชนสหวิชาชีพ ณ อ.บางปะอิน</li>
                <li><strong>พ.ศ. 2525 &rarr; 2546:</strong> ยกระดับเป็นศูนย์เวชศาสตร์ชุมชน และจัดตั้งเป็น <strong>ภาควิชาเวชศาสตร์ชุมชน</strong></li>
                <li><strong>3 พันธกิจหลักปัจจุบัน:</strong> (1) สร้างเสริมสุขภาพ &amp; สุขภาพโลก · (2) หน่วยวิจัยระบบสุขภาพ (HSR) · (3) อาชีวเวชศาสตร์และเวชศาสตร์สิ่งแวดล้อม</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint or-mt-auto" style="padding:0.56cqw 0.95cqw">
              <p class="or-card-text"><strong>หัวใจของ RACM 303:</strong> แพทย์ที่ดีต้องมองเห็นทั้ง <strong>“ผู้ป่วยตรงหน้า” “วิถีชุมชน” และ “ระบบสุขภาพ”</strong> ไปพร้อมกัน</p>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Core Perspective</span>
          <span class="or-story-a">การรักษาข้างเตียงช่วยชีวิตผู้ป่วยรายบุคคล แต่ <strong>ความเข้าใจชุมชนและระบบสุขภาพ</strong> ช่วยป้องกันไม่ให้คนทั้งชุมชนต้องเจ็บป่วยซ้ำ</span>
        </div>
      `
    },
    {
      id: "s04-course-objectives",
      num: "04",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · OBJECTIVES",
      timeWindow: "09.06 – 09.08 น. (2 นาที)",
      kicker: "01 · COURSE GOALS (ก–ง) & 5 CORE PHYSICIAN COMPETENCIES",
      title: "วัตถุประสงค์รายวิชา (ก–ง) เชื่อมตรงสู่สมรรถนะหลักของแพทย์ทั้ง 5 ด้าน",
      lead: "พัฒนาครบทั้งฐานความรู้ ทักษะวิเคราะห์และสำรวจชุมชน การทำงานร่วมกับผู้อื่น การสะท้อนคิดพัฒนาตน และจริยธรรมวิชาชีพ",
      notes:
        "ชี้ให้เห็นว่าวัตถุประสงค์รายวิชาทั้ง 4 หมวด (ก–ง) ในคู่มือรายวิชา ถูกออกแบบให้รองรับสมรรถนะหลัก 5 ด้าน (Holistic Physician Competencies) ซึ่งจะใช้เป็นกรอบประเมินผลสัมฤทธิ์ของรายวิชาในพาร์ทที่ 3",
      render: () => `
        <div class="or-infog-split is-fig-left-compact">
          ${figPlate(
            "orient_s04_competencies.png",
            "5 Core Physician Competencies of RACM 303",
            "สมรรถนะหลักทั้ง 5 ด้านของรายวิชา RACM 303"
          )}

          <div class="or-grid-2" style="gap:0.6cqw">
            <div class="or-card is-navy-tint" style="padding:0.68cqw 0.85cqw;gap:0.22cqw">
              <span class="or-card-kicker">วัตถุประสงค์ ก. · COGNITIVE &rarr; C1, C3</span>
              <h3 class="or-card-title">อธิบายและประยุกต์ใช้วิทยาระบบสุขภาพ &amp; ระบาดวิทยา</h3>
              <ul class="or-list" style="gap:0.16cqw;font-size:clamp(9px,0.92cqw,13.2px)">
                <li>ระบาดวิทยาพื้นฐาน &amp; เวชศาสตร์เชิงประจักษ์ (<code>EP1–EP9</code>)</li>
                <li>สุขภาพ ปัจจัยกำหนดสุขภาพ SDH/CDH &amp; การป้องกัน 4 ระดับ (<code>HS1</code>)</li>
                <li>โครงสร้างระบบสุขภาพ 6BB, 6W (<code>HS2</code>) &amp; คุณลักษณะ <code>EQESaRR</code> (<code>HS3</code>)</li>
                <li>สร้างเสริมสุขภาพ <code>COM-B</code> (<code>HS4</code>) · ปฐมภูมิ (<code>HS5</code>) · การคลัง UHC (<code>HS6</code>)</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint" style="padding:0.68cqw 0.85cqw;gap:0.22cqw">
              <span class="or-card-kicker">วัตถุประสงค์ ข. · AWARENESS &rarr; C3, C5</span>
              <h3 class="or-card-title">ตระหนักบทบาทผู้นำ ศักยภาพชุมชน &amp; จริยธรรม</h3>
              <ul class="or-list" style="gap:0.18cqw;font-size:clamp(9px,0.92cqw,13.2px)">
                <li>ตระหนักใน <strong>บทบาทแพทย์ในฐานะผู้นำระบบสุขภาพ</strong></li>
                <li>เคารพ <strong>ศักยภาพและทุนทางสังคมของชุมชน</strong> ในการดูแลตนเอง</li>
                <li>ยึดมั่นความตรงต่อเวลา ซื่อสัตย์ เห็นอกเห็นใจ ไม่เอาเปรียบผู้อื่น</li>
              </ul>
            </div>

            <div class="or-card is-white" style="padding:0.68cqw 0.85cqw;gap:0.22cqw">
              <span class="or-card-kicker">วัตถุประสงค์ ค. · SKILLS &rarr; C1, C2, C3</span>
              <h3 class="or-card-title">คิดวิเคราะห์ สำรวจชุมชน &amp; สื่อสารทำงานเป็นทีม</h3>
              <ul class="or-list" style="gap:0.18cqw;font-size:clamp(9px,0.92cqw,13.2px)">
                <li><strong>Cognitive:</strong> คิด วิเคราะห์ วางแผน และแก้ปัญหาเชิงระบบ</li>
                <li><strong>Psychomotor:</strong> ลงมือสำรวจและศึกษาชุมชนเชิงประจักษ์</li>
                <li><strong>Communication:</strong> ประสานงานกับเพื่อน สหวิชาชีพ และชุมชน</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint" style="padding:0.68cqw 0.85cqw;gap:0.22cqw">
              <span class="or-card-kicker">วัตถุประสงค์ ง. · CHARACTER &rarr; C2, C4, C5</span>
              <h3 class="or-card-title">ความรับผิดชอบร่วมกัน &amp; การรู้คิดพัฒนาตนเอง</h3>
              <ul class="or-list" style="gap:0.18cqw;font-size:clamp(9px,0.92cqw,13.2px)">
                <li><strong>Team Accountability:</strong> ร่วมแรงบรรลุเป้าหมายของทีมในพื้นที่จริง</li>
                <li><strong>Metacognition &amp; CPD:</strong> ทบทวนและสะท้อนคิดประสบการณ์การเรียนรู้ของตนเองอย่างเป็นระบบ (<code>SRN 1–2</code>)</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Competency Alignment</span>
          <span class="or-story-a">ทุกกิจกรรมการเรียนและการวัดผลใน RACM 303 เชื่อมตรงจาก <strong>วัตถุประสงค์ ก–ง สู่สมรรถนะหลักทั้ง 5 ด้าน</strong> โดยไม่มีงานชิ้นใดแยกส่วนลอยตัว</span>
        </div>
      `
    },
    {
      id: "s05-hs-5objectives",
      num: "05",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · 5 HSS OBJECTIVES",
      timeWindow: "09.08 – 09.10 น. (2 นาที)",
      kicker: "01 · FIVE CORE OBJECTIVES OF HEALTH SYSTEMS (TABLE OF SPECIFICATIONS · 100%)",
      title: "5 วัตถุประสงค์หลักของ Health Systems: เข็มทิศเชื่อมบทเรียน โรงพยาบาลแหล่งฝึก และการวัดผล",
      lead: "กรอบแม่บทที่ร้อยเรียงตั้งแต่คาบเรียน ST1 & HS1–HS6 การเรียนรู้ภาคสนาม 9 แห่ง สู่ Health Systems Exam และ Presentation ร่วมกันเป็นทีม",
      notes:
        "สื่อสาร 5 วัตถุประสงค์หลักของระบบสุขภาพและน้ำหนักคะแนนรวม 100%: (1) สุขภาพและปัจจัยกำหนดสุขภาพ 20%, (2) ระบบสุขภาพและระบบบริการสุขภาพ 25%, (3) ศักยภาพชุมชนในการพัฒนาสุขภาพ 20%, (4) การสร้างเสริมสุขภาพ 20%, (5) บทบาทแพทย์ในระบบสุขภาพ 15% ซึ่งใช้ทั้งในการเรียนภาคทฤษฎี การศึกษาที่โรงพยาบาลแหล่งฝึก Health Systems Exam และ Presentation (Health Systems) ฟอร์ม 3A",
      render: () => `
        <div class="or-infog-split is-fig-left">
          ${figPlate(
            "orient_s05_district_lenses.png",
            "5 Core Objectives of Health Systems in RACM 303",
            "5 วัตถุประสงค์หลักของระบบสุขภาพ (น้ำหนักรวม 100%) เชื่อมโยงชุมชน โรงพยาบาลแหล่งฝึก และทีมสุขภาพ"
          )}

          <div style="display:flex;flex-direction:column;gap:0.34cqw;justify-content:space-between;min-height:0">
            <div class="or-card is-white" style="padding:0.42cqw 0.75cqw;gap:0.08cqw">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw"><span class="or-card-kicker">1 · สุขภาพและปัจจัยกำหนดสุขภาพ (Health &amp; Determinants of Health)</span><span class="or-mini-chip">น้ำหนัก 20% · HS1</span></div>
              <p class="or-card-text" style="font-size:clamp(8.3px,0.86cqw,12.4px)"><strong>1.1</strong> สุขภาพแบบองค์รวม · <strong>1.2</strong> ความสัมพันธ์ระหว่างสุขภาพและปัจจัยกำหนดสุขภาพ (SDH/CDH) · <strong>1.3</strong> การป้องกันโรค 4 ระดับ</p>
            </div>

            <div class="or-card is-navy-tint" style="padding:0.42cqw 0.75cqw;gap:0.08cqw">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw"><span class="or-card-kicker">2 · ระบบสุขภาพและระบบบริการสุขภาพ (Health Systems &amp; Services)</span><span class="or-mini-chip">น้ำหนัก 25% · ST1, HS2–3, 5–6</span></div>
              <p class="or-card-text" style="font-size:clamp(8.3px,0.86cqw,12.4px)"><strong>2.1</strong> ระบบซับซ้อนและการคิดเชิงระบบ · <strong>2.2</strong> ระบบสุขภาพและระบบบริการสุขภาพ (6BB/6W/PHC/UHC) · <strong>2.3</strong> คุณสมบัติที่พึงประสงค์ (<code>EQESaRR</code>) · <strong>2.4</strong> ประยุกต์ระเบียบวิธีวิจัยพัฒนาระบบสุขภาพ</p>
            </div>

            <div class="or-card is-amber-tint" style="padding:0.42cqw 0.75cqw;gap:0.08cqw">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw"><span class="or-card-kicker" style="color:#b45309">3 · ศักยภาพชุมชนในการพัฒนาสุขภาพ (Community Potential)</span><span class="or-mini-chip">น้ำหนัก 20% · HS1, HS5, ชุมชน</span></div>
              <p class="or-card-text" style="font-size:clamp(8.3px,0.86cqw,12.4px)"><strong>3.1</strong> ความหมายและคุณสมบัติของชุมชน · <strong>3.2</strong> ความสัมพันธ์ระหว่างศักยภาพชุมชน (ทุนทางสังคม/อสม./องค์กรท้องถิ่น) กับสุขภาพ</p>
            </div>

            <div class="or-card is-teal-tint" style="padding:0.42cqw 0.75cqw;gap:0.08cqw">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw"><span class="or-card-kicker" style="color:#0f766e">4 · การสร้างเสริมสุขภาพ (Health Promotion)</span><span class="or-mini-chip">น้ำหนัก 20% · HS4</span></div>
              <p class="or-card-text" style="font-size:clamp(8.3px,0.86cqw,12.4px)"><strong>4.1</strong> แนวคิดการสร้างเสริมสุขภาพ · <strong>4.2</strong> หลักการและกลยุทธ์สร้างเสริมสุขภาพ (Ottawa Charter, HiAP, <code>COM-B</code>) · <strong>4.3</strong> ความสัมพันธ์ระหว่างการสร้างเสริมสุขภาพและระบบบริการสุขภาพ</p>
            </div>

            <div class="or-card is-white" style="padding:0.42cqw 0.75cqw;gap:0.08cqw">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4cqw"><span class="or-card-kicker" style="color:#1e3a8a">5 · บทบาทแพทย์ในระบบสุขภาพ (Physician's Roles in Health Systems)</span><span class="or-mini-chip">น้ำหนัก 15% · บูรณาการ</span></div>
              <p class="or-card-text" style="font-size:clamp(8.3px,0.86cqw,12.4px)"><strong>5.1</strong> ภาพรวมของบทบาทแพทย์ในระบบสุขภาพ · <strong>5.2</strong> บูรณาการบทบาทแพทย์ต่อผู้ป่วย ครอบครัว และชุมชน (ทั้งในโรงพยาบาลแหล่งฝึกและทีมสหวิชาชีพ)</p>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">End-to-End Alignment</span>
          <span class="or-story-a">ทั้ง <strong>5 วัตถุประสงค์ของ Health Systems</strong> เป็นแกนเดียวกันตั้งแต่ห้องเรียน &rarr; โรงพยาบาลแหล่งฝึก &rarr; <strong>Health Systems Exam</strong> &rarr; <strong>Presentation (Health Systems)</strong> ร่วมกันเป็นทีม</span>
        </div>
      `
    },
    {
      id: "s06-roadmap-6weeks",
      num: "06",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.10 – 09.13 น. (3 นาที)",
      kicker: "02 · 6-WEEK LEARNING JOURNEY (25 NOV – 30 DEC 2569)",
      title: "แผนที่เส้นทางการเรียนรู้ 6 สัปดาห์: ปูกรอบคิด → ลงพื้นที่โรงพยาบาลแหล่งฝึก → สังเคราะห์เป็นทีม",
      lead: "ออกแบบจังหวะการเรียนรู้เป็น 3 ระยะต่อเนื่อง ตั้งแต่วันพุธที่ 25 พฤศจิกายน ถึง วันพุธที่ 30 ธันวาคม 2569",
      notes:
        "พากวาดสายตาภาพรวม 6 สัปดาห์: Phase 1 (W1–W3) เรียนทฤษฎี สอบ Epi Exam 8 ธ.ค. ฝึก SPSS และส่ง SRN 1 ก่อนเดินทาง → Phase 2 (W4) ฝึกภาคสนาม ณ โรงพยาบาลแหล่งฝึก 9 แห่ง (7–9 คืน) → Phase 3 (W5–W6) สอบ Health Systems Exam 22 ธ.ค., ฝึก Systems CLD และ Presentation (Health Systems, Epi) เพื่อแสดงการบรรลุ Learning Objectives ร่วมกันเป็นทีมในวันที่ 29–30 ธ.ค.",
      render: () => `
        <div class="or-top-fig-stack">
          ${figPlate("orient_s06_roadmap.png", "6-Week Learning Journey: Systems & HSS, Epi Exam, 9 Training Hospitals, Health Systems Exam, Systems CLD, and Presentation (Health Systems, Epi)", "")}

          <div class="or-grid-6">
            <div class="or-card is-white" style="padding:0.52cqw 0.65cqw;gap:0.18cqw">
              <span class="or-card-kicker">W1 · 25–27 พ.ย.</span>
              <h3 class="or-card-title" style="font-size:clamp(9.4px,0.98cqw,14px)">เปิดเลนส์ระบบ &amp; HS/EP</h3>
              <ul class="or-list" style="padding-left:1cqw;gap:0.14cqw;font-size:clamp(8.1px,0.83cqw,11.8px)">
                <li><strong>25 พ.ย.:</strong> <code>ST1</code> · Global Health</li>
                <li><strong>26 พ.ย.:</strong> <code>HS1</code> + กลุ่มย่อย #1</li>
                <li><strong>27 พ.ย.:</strong> <code>EP1–3</code> + SDL Ex 1–2</li>
              </ul>
            </div>

            <div class="or-card is-white" style="padding:0.52cqw 0.65cqw;gap:0.18cqw">
              <span class="or-card-kicker">W2 · 30 พ.ย.–4 ธ.ค.</span>
              <h3 class="or-card-title" style="font-size:clamp(9.4px,0.98cqw,14px)">เข้มข้น HS2–6 &amp; EP4–9</h3>
              <ul class="or-list" style="padding-left:1cqw;gap:0.14cqw;font-size:clamp(8.1px,0.83cqw,11.8px)">
                <li><strong>30 พ.ย.–1 ธ.ค.:</strong> <code>HS2–HS5</code></li>
                <li><strong>2–3 ธ.ค.:</strong> <code>EP4–9</code> Hybrid</li>
                <li><strong>4 ธ.ค.:</strong> <code>HS6</code> + กลุ่มย่อย #2</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint" style="padding:0.52cqw 0.65cqw;gap:0.18cqw">
              <span class="or-card-kicker">W3 · 8–12 ธ.ค.</span>
              <h3 class="or-card-title" style="font-size:clamp(9.4px,0.98cqw,14px)">Epi Exam · SPSS · ทีม</h3>
              <ul class="or-list" style="padding-left:1cqw;gap:0.14cqw;font-size:clamp(8.1px,0.83cqw,11.8px)">
                <li><strong>8 ธ.ค.:</strong> <strong>Epi Exam</strong> · SPSS</li>
                <li><strong>9 ธ.ค.:</strong> DHS · <strong>ส่ง SRN 1</strong></li>
                <li><strong>9–12 ธ.ค.:</strong> SG #4–6 &amp; เดินทาง</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint" style="padding:0.52cqw 0.65cqw;gap:0.18cqw">
              <span class="or-card-kicker">W4 · 9–20 ธ.ค.</span>
              <h3 class="or-card-title" style="font-size:clamp(9.4px,0.98cqw,14px)">โรงพยาบาลแหล่งฝึก 9 แห่ง</h3>
              <ul class="or-list" style="padding-left:1cqw;gap:0.14cqw;font-size:clamp(8.1px,0.83cqw,11.8px)">
                <li>ฝังตัวเรียนรู้จริง <strong>7–9 คืน</strong></li>
                <li>ศึกษา 5 วัตถุประสงค์ระบบฯ</li>
                <li>เก็บ Survey · รับ Feedback SRN1</li>
              </ul>
            </div>

            <div class="or-card is-navy-tint" style="padding:0.52cqw 0.65cqw;gap:0.18cqw">
              <span class="or-card-kicker">W5 · 21–25 ธ.ค.</span>
              <h3 class="or-card-title" style="font-size:clamp(9.4px,0.98cqw,14px)">Health Systems Exam</h3>
              <ul class="or-list" style="padding-left:1cqw;gap:0.14cqw;font-size:clamp(8.1px,0.83cqw,11.8px)">
                <li><strong>21 ธ.ค.:</strong> SDL เตรียมโน้ต A4</li>
                <li><strong>22 ธ.ค.:</strong> <strong>HS Exam</strong> · บ่าย CLD</li>
                <li><strong>23–25 ธ.ค.:</strong> 6BB · Policy · SG #7–10</li>
              </ul>
            </div>

            <div class="or-card is-rose-tint" style="padding:0.52cqw 0.65cqw;gap:0.18cqw">
              <span class="or-card-kicker">W6 · 28–30 ธ.ค.</span>
              <h3 class="or-card-title" style="font-size:clamp(9.4px,0.98cqw,14px)">Presentation (as a Team)</h3>
              <ul class="or-list" style="padding-left:1cqw;gap:0.14cqw;font-size:clamp(8.1px,0.83cqw,11.8px)">
                <li><strong>28 ธ.ค.:</strong> SG #11–12 ซ้อมทีม</li>
                <li><strong>29 ธ.ค.:</strong> <strong>Presentation (HS · 3A)</strong></li>
                <li><strong>30 ธ.ค.:</strong> <strong>Presentation (Epi · 4A)</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Design Logic</span>
          <span class="or-story-a">สอบ <strong>Epi Exam</strong> ก่อนลงพื้นที่ทำ Survey สอบ <strong>Health Systems Exam</strong> หลังเห็นระบบจริง และทำ <strong>Presentation (Health Systems, Epi)</strong> เพื่อแสดงการบรรลุ LO ร่วมกันเป็นทีม</span>
        </div>
      `
    },
    {
      id: "s07-hs-guided-learning",
      num: "07",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.13 – 09.15 น. (2 นาที)",
      kicker: "02 · HEALTH SYSTEMS SCIENCE ARCHITECTURE (ST1 & HS1–HS6)",
      title: "สถาปัตยกรรมการเรียนหมวดระบบสุขภาพ: Guided Learning 5 ขั้นตอน ควบคู่ 6 เวทีคิดเชิงระบบ",
      lead: "เปลี่ยนจากการฟังบรรยายทางเดียว สู่การอ่านคิดล่วงหน้า ฝึกดึงความรู้ สังเคราะห์ห้องใหญ่ และอภิปรายกรณีศึกษา 6 กลุ่มย่อย",
      notes:
        "อธิบายเส้นทาง 5 ขั้นตอนของ ST1 และ HS1–HS6: ① ฉบับเต็ม → ② ฉบับย่อ → ③ โจทย์ 66 ข้อ & คำศัพท์ 125 คำ พร้อม AI Mentor → ④ Slide อาจารย์ห้องใหญ่ 1 ชม. → ⑤ Case Discussion 6 กลุ่มย่อย (1C1-02..07 · 2 ชม. 20 นาที) ควบคู่กับ 6 เวทีคิดเชิงระบบนอกกรอบข้อสอบทฤษฎี (18.5 ชม.)",
      render: () => `
        <div class="or-top-fig-stack">
          ${figPlate("orient_s07_guided_flow.png", "5-Step Guided Learning Flow and Systems Thinking & Policy Panels", "")}

          <div class="or-infog-split is-even">
            <div class="or-card is-navy-tint" style="padding:0.65cqw 0.9cqw;gap:0.22cqw">
              <span class="or-card-kicker">5-STEP GUIDED LEARNING FLOW (HS1–HS6 &amp; ST1)</span>
              <ul class="or-list" style="gap:0.18cqw;font-size:clamp(8.8px,0.92cqw,13.2px)">
                <li><strong>① ฉบับเต็ม &amp; ② ฉบับย่อ:</strong> ศึกษาแนวคิดหลัก ตอบคำถามนำก่อนเข้าเรียน และจัดโครงสร้างความคิดเชื่อม 5 วัตถุประสงค์ระบบสุขภาพ</li>
                <li><strong>③ Self-Quiz 66 ข้อ &amp; คำศัพท์ 125 คำ:</strong> ฝึก Active Recall แบบ Formative พร้อมคำแนะนำจาก AI Mentor</li>
                <li><strong>④ Slide อาจารย์ (1 ชม. · <code>2C2-03</code>) &rarr; ⑤ Case 6 กลุ่มย่อย (2 ชม. 20 น. · <code>1C1-02..07</code>):</strong> สังเคราะห์แนวคิดและถกเถียงโจทย์ Contrasting Cases</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint" style="padding:0.65cqw 0.9cqw;gap:0.22cqw">
              <span class="or-card-kicker">BEYOND HS1–HS6 · 6 เวทีคิดเชิงระบบและเสวนา (18.5 ชม.)</span>
              <p class="or-card-text" style="font-size:clamp(8.6px,0.88cqw,12.6px);font-weight:700;color:#92400e">ไม่ได้นำมาออกข้อสอบข้อเขียน — แต่เป็นเครื่องมือหลักของภาคสนาม Presentation (ฟอร์ม 3A) และ SRN:</p>
              <div class="or-chip-row" style="gap:0.28cqw">
                <span class="or-mini-chip">1. ST1 Systems &amp; CAS Thinking (25 พ.ย.)</span>
                <span class="or-mini-chip">2. Global/Planetary Health &amp; HPSR (25 พ.ย.)</span>
                <span class="or-mini-chip">3. District Health Systems · รศ.สุรเกียรติ (9 ธ.ค.)</span>
                <span class="or-mini-chip">4. CLD &amp; System Archetypes (22 ธ.ค.)</span>
                <span class="or-mini-chip">5. 6BB “สุขภาวะข้างถนน” (23 ธ.ค.)</span>
                <span class="or-mini-chip">6. Policy &amp; Political Economy (24 ธ.ค.)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Health Systems Exam Prep</span>
          <span class="or-story-a">การผ่านครบทั้ง 5 ขั้นตอนช่วยให้ <strong>สังเคราะห์ทั้ง 5 วัตถุประสงค์ของระบบสุขภาพลงกระดาษ A4 ลายมือตนเอง 1 แผ่น</strong> สำหรับ Health Systems Exam ได้อย่างแม่นยำ</span>
        </div>
      `
    },
    {
      id: "s08-epidemiology",
      num: "08",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.15 – 09.17 น. (2 นาที)",
      kicker: "02 · CLINICAL & COMMUNITY EPIDEMIOLOGY PIPELINE (EP1–EP9)",
      title: "หมวดระบาดวิทยาและเวชศาสตร์เชิงประจักษ์: จากการแปลผลหลักฐาน สู่การสำรวจชุมชนด้วย SPSS",
      lead: "เรียนรู้ครบวงจรตั้งแต่ความแม่นยำการวินิจฉัย อคติ รูปแบบวิจัย ภาระโรค ไปจนถึงการทำ Quantitative Health Survey",
      notes:
        "ชี้แจงตารางเรียนระบาดวิทยาทั้ง 4 ช่วง: วันศุกร์ 27 พ.ย. บรรยาย EP1–EP3 เวลา 08.30–11.00 น. (ห้อง 2A01 + Zoom) และหลัง 11.00 น. ทำ Exercise 1–2 แบบ SDL ใน E-learning, วันที่ 2–3 ธ.ค. เรียน Hybrid (ห้อง 2C2-03 + Zoom) และวันอังคาร 8 ธ.ค. เช้าสอบทฤษฎี บ่ายฝึกปฏิบัติการ SPSS",
      render: () => `
        <div class="or-top-fig-stack">
          ${figPlate("orient_s08_epi_pipeline.png", "4-Stage Clinical and Community Epidemiology Pipeline", "")}

          <div class="or-grid-4">
            <div class="or-card is-white" style="padding:0.58cqw 0.75cqw;gap:0.18cqw">
              <span class="or-card-kicker">STAGE 1 · ศ. 27 พ.ย. 69</span>
              <h3 class="or-card-title" style="font-size:clamp(9.8px,1.04cqw,14.8px)">EP1–EP3 · Diagnostic &amp; Bias</h3>
              <p class="or-card-text" style="font-size:clamp(8.5px,0.88cqw,12.6px)"><strong>08.30–11.00 น.</strong> (<code>2A01</code> + Zoom): Sens/Spec/PPV/LR, Random Error, Bias &amp; Confounding · <strong>หลัง 11.00 น. ทำ Ex 1–2 (SDL ใน E-learning)</strong></p>
            </div>

            <div class="or-card is-white" style="padding:0.58cqw 0.75cqw;gap:0.18cqw">
              <span class="or-card-kicker">STAGE 2 · พ. 2 ธ.ค. 69</span>
              <h3 class="or-card-title" style="font-size:clamp(9.8px,1.04cqw,14.8px)">EP4–EP5 · Designs &amp; Outbreak</h3>
              <p class="or-card-text" style="font-size:clamp(8.5px,0.88cqw,12.6px)"><strong>Hybrid (<code>2C2-03</code> + Zoom):</strong> Cohort, Case-control, Cross-sectional, RR/OR/AR/PAR และการสอบสวนโรคระบาด + <strong>Ex 3–4 &amp; Q&amp;A</strong></p>
            </div>

            <div class="or-card is-teal-tint" style="padding:0.58cqw 0.75cqw;gap:0.18cqw">
              <span class="or-card-kicker">STAGE 3 · พฤ. 3 ธ.ค. 69</span>
              <h3 class="or-card-title" style="font-size:clamp(9.8px,1.04cqw,14.8px)">EP6–EP9 · Burden &amp; EBM</h3>
              <p class="or-card-text" style="font-size:clamp(8.5px,0.88cqw,12.6px)"><strong>Hybrid (<code>2C2-03</code> + Zoom):</strong> Incidence/Prevalence/DALYs, Health Survey, RCT Appraisal และกรอบ PICO + <strong>Ex 5–6</strong></p>
            </div>

            <div class="or-card is-navy-tint" style="padding:0.58cqw 0.75cqw;gap:0.18cqw">
              <span class="or-card-kicker">STAGE 4 · 8 &rarr; 30 ธ.ค. 69</span>
              <h3 class="or-card-title" style="font-size:clamp(9.8px,1.04cqw,14.8px)">Exam · SPSS · Survey (4A)</h3>
              <p class="or-card-text" style="font-size:clamp(8.5px,0.88cqw,12.6px)"><strong>อ. 8 ธ.ค.:</strong> เช้าสอบทฤษฎี EP · บ่ายฝึก <strong>SPSS</strong> &rarr; เก็บข้อมูลจริงในพื้นที่ &rarr; นำเสนอวิจัยเชิงปริมาณ <strong>ฟอร์ม 4A (30 ธ.ค.)</strong></p>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Evidence to Action</span>
          <span class="or-story-a">ความรู้เรื่อง <strong>Selection Bias, Information Bias และ Confounding</strong> จากห้องเรียน คือเกราะป้องกันสำคัญที่ทำให้ผลสำรวจสุขภาพชุมชนของกลุ่มน่าเชื่อถือจริง</span>
        </div>
      `
    },
    {
      id: "s09-fieldwork-9sites",
      num: "09",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.17 – 09.20 น. (3 นาที)",
      kicker: "02 · KOLB'S EXPERIENTIAL LEARNING & 9 FIELDWORK TRAINING HOSPITALS",
      title: "การเรียนรู้จากประสบการณ์จริง (Kolb's Cycle) ณ โรงพยาบาลแหล่งฝึกภาคสนามทั้ง 9 แห่ง",
      lead: "ทำงานร่วมกันในกลุ่มย่อย 13 ครั้ง (เตรียมความพร้อม SG 1–6 → ฝึกภาคสนาม 7–9 คืน → ถอดบทเรียนและสังเคราะห์ SG 7–13)",
      notes:
        "แนะนำโรงพยาบาลแหล่งฝึกทั้ง 9 แห่งทั่วภูมิภาค อาจารย์ที่ปรึกษาประจำกลุ่ม ห้องกลุ่มย่อย และกำหนดการเดินทางของแต่ละกลุ่ม พร้อมเชื่อมโยงกับวงจร Kolb's Experiential Learning ทั้ง 4 ขั้นตอน",
      render: () => `
        <div class="or-infog-split is-fig-left-compact">
          ${figPlate(
            "orient_s09_kolb_map.png",
            "Kolb's Experiential Learning Cycle around Thailand's 9 Fieldwork Training Hospitals",
            "วงจรการเรียนรู้จากประสบการณ์จริง (Kolb's Cycle) เชื่อมเครือข่ายโรงพยาบาลแหล่งฝึกทั้ง 9 แห่ง"
          )}

          <div class="or-table-wrap">
            <table class="or-table" style="font-size:clamp(8px,0.84cqw,12.2px);line-height:1.3">
              <thead>
                <tr>
                  <th style="width:6%">กลุ่ม</th>
                  <th style="width:26%">โรงพยาบาลแหล่งฝึก &amp; จังหวัด</th>
                  <th style="width:8%">นศพ.</th>
                  <th style="width:27%">อาจารย์ที่ปรึกษาประจำกลุ่ม</th>
                  <th style="width:10%">ห้อง SG</th>
                  <th style="width:23%">กำหนดการฝึกภาคสนาม</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>1</strong></td><td><strong>รพร.กุฉินารายณ์</strong> จ.กาฬสินธุ์</td><td>20 คน</td><td>อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์</td><td><code>3B1-01</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                <tr><td><strong>2</strong></td><td><strong>รพร.ด่านซ้าย</strong> จ.เลย</td><td>19 คน</td><td>ผศ. พญ.ฉัฐญาณ์ / อ. พญ.วริษา</td><td><code>1C1-02</code></td><td>12–19 ธ.ค. 69 (7 คืน 8 วัน)</td></tr>
                <tr><td><strong>3</strong></td><td><strong>รพ.ตะกั่วป่า</strong> จ.พังงา</td><td>18 คน</td><td>อ. นพ.ฉัตรชัย อิ่มอารมย์</td><td><code>3B1-05</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                <tr><td><strong>4</strong></td><td><strong>รพ.ท่าวังผา</strong> จ.น่าน</td><td>18 คน</td><td>อ. นพ.จักรกฤษณ์ เอื้อสุนทรวัฒนา</td><td><code>3B1-06</code></td><td>12–19 ธ.ค. 69 (7 คืน 8 วัน)</td></tr>
                <tr><td><strong>5</strong></td><td><strong>รพ.เพชรบูรณ์ (1)</strong> จ.เพชรบูรณ์</td><td>18 คน</td><td>ผศ. นพ.สัมฤทธิ์ / นพ.พีรสิชฌ์</td><td><code>1C1-04</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                <tr><td><strong>6</strong></td><td><strong>รพ.เพชรบูรณ์ (2)</strong> จ.เพชรบูรณ์</td><td>18 คน</td><td>อ. นพ.ปวินท์ ศรีวิเชียร</td><td><code>1C1-05</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                <tr><td><strong>7</strong></td><td><strong>รพ.อุบลรัตน์</strong> จ.ขอนแก่น</td><td>18 คน</td><td>อ. นพ.ภูษิต ประคองสาย</td><td><code>1C1-03</code></td><td>12–20 ธ.ค. 69 (8 คืน 9 วัน)</td></tr>
                <tr><td><strong>8</strong></td><td><strong>รพ.ท่าสองยาง</strong> จ.ตาก</td><td>20 คน</td><td>ผศ. นพ.วิชช์ / นพ.ภรัณยู</td><td><code>1C1-06</code></td><td>11–19 ธ.ค. 69 (8 คืน 9 วัน)</td></tr>
                <tr><td><strong>9</strong></td><td><strong>รพ.อุ้มผาง</strong> จ.ตาก</td><td>20 คน</td><td>รศ. พญ.เริงฤดี ปธานวนิช</td><td><code>1C1-07</code></td><td>9–18 ธ.ค. 69 (ออกคืน 9 ธ.ค. 23.00)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Shared Learning</span>
          <span class="or-story-a">โรงพยาบาลแหล่งฝึกทั้ง 9 แห่งมีบริบทพื้นที่แตกต่างกันอย่างทรงคุณค่า เมื่อกลับมาแลกเปลี่ยนเรียนรู้ในสัปดาห์ที่ 6 นักศึกษาจะได้เห็น <strong>ภาพรวมระบบสุขภาพไทยครบทุกมิติ</strong></span>
        </div>
      `
    },
    {
      id: "s10-competency-blueprint",
      num: "10",
      section: "evaluation",
      sectionLabel: "Act III · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · EVALUATION",
      timeWindow: "09.20 – 09.23 น. (3 นาที)",
      kicker: "03 · COMPETENCY-BASED ASSESSMENT BLUEPRINT (RACM 303 · ปีการศึกษา 2569)",
      title: "กรอบการวัดผลสัมฤทธิ์ในการเรียน RACM 303 ตามสมรรถนะหลัก 5 ด้าน (Formative & Summative)",
      lead: "เชื่อมโยงเครื่องมือวัดผลทุกชิ้นเข้ากับสมรรถนะแพทย์ 5 ด้าน โดยแยกการประเมินเพื่อพัฒนา (Formative) ออกจากเกณฑ์ตัดสินผล (Summative)",
      notes:
        "อธิบายตารางแม่บทการวัดผลสัมฤทธิ์ 4 คอลัมน์ของ RACM 303 ปีการศึกษา 2569: แบ่งเป็นภาคทฤษฎี (สมรรถนะที่ 1: Epi Exam และ Health Systems Exam คิดเกณฑ์ผ่านแยกกัน ≥ 2.00 / O ≥ 3.75) และภาคปฏิบัติในชุมชน (สมรรถนะที่ 2–5 รวมถึง Presentation ทั้ง Health Systems และ Epi เพื่อแสดงการบรรลุ Learning Objectives ร่วมกันเป็นทีม)",
      render: () => `
        <div class="or-table-wrap" style="flex:1">
          <table class="or-table" style="font-size:clamp(8.3px,0.87cqw,12.6px);line-height:1.32">
            <thead>
              <tr>
                <th style="width:22%">Competency (สมรรถนะหลัก 5 ด้าน)</th>
                <th style="width:44%">เครื่องมือวัดผล (Formative &amp; Summative Assessment Tools)</th>
                <th style="width:16%">ผู้ประเมิน</th>
                <th style="width:18%">เกณฑ์การประเมินผล</th>
              </tr>
            </thead>
            <tbody>
              <tr class="is-domain-divider"><td colspan="4" style="padding:0.24cqw 0.8cqw">ภาคทฤษฎี (Theoretical Domain)</td></tr>
              <tr>
                <td style="padding:0.36cqw 0.78cqw"><strong>1. Knowledge base</strong><br><span style="font-size:0.86em;color:#64748b">ฐานความรู้ระบบสุขภาพและระบาดวิทยา</span></td>
                <td style="padding:0.36cqw 0.78cqw">
                  <div><span class="or-tag-inline is-formative">Formative</span> คำถามนำ Case Workbook &amp; Self-Quiz 66 ข้อ (<code>ST1 &amp; HS1–6</code>) · แบบฝึกหัด <code>EP Ex 1–6</code> · <code>SRN 1</code></div>
                  <div style="margin-top:0.14cqw"><span class="or-tag-inline is-summative">Summative</span> <strong>Epi Exam</strong> (<code>EP1–9</code> · 8 ธ.ค.) · <strong>Health Systems Exam</strong> (ครบ 5 วัตถุประสงค์ · Open Note A4 · 22 ธ.ค.)</div>
                </td>
                <td style="padding:0.36cqw 0.78cqw">คณาจารย์ภาควิชาเวชศาสตร์ชุมชน</td>
                <td style="padding:0.36cqw 0.78cqw"><strong>แยกเกณฑ์ EP &amp; HS:</strong><br>ผ่านแต่ละส่วน <strong>&ge; 2.00</strong><br>(แต้มรวม <strong>&ge; 3.75</strong> ได้ <strong>O</strong>)</td>
              </tr>

              <tr class="is-domain-divider"><td colspan="4" style="padding:0.24cqw 0.8cqw">ภาคปฏิบัติและสมรรถนะวิชาชีพในชุมชน (Practical, Community &amp; Professionalism Domain)</td></tr>
              <tr>
                <td style="padding:0.36cqw 0.78cqw"><strong>2. Communication &amp; Interpersonal skills</strong></td>
                <td style="padding:0.36cqw 0.78cqw">
                  <div><span class="or-tag-inline is-formative">Formative</span> การแลกเปลี่ยนในกลุ่มย่อย 13 ครั้ง และการซ้อมสื่อสารร่วมกันเป็นทีม</div>
                  <div style="margin-top:0.12cqw"><span class="or-tag-inline is-summative">Summative</span> Peer Assessment · <code>ฟอร์ม 1A</code> (ข้อ 1, 3, 4.1–4.2) · <strong>Presentation (Health Systems, Epi)</strong> ร่วมกันเป็นทีม (<code>3A/4A</code>)</div>
                </td>
                <td style="padding:0.36cqw 0.78cqw">เพื่อนในกลุ่ม · อาจารย์ที่ปรึกษากลุ่ม</td>
                <td style="padding:0.36cqw 0.78cqw"><strong>O / S / M / U</strong><br><span style="font-size:0.86em;color:#64748b">(รายบุคคล · ประกอบฟอร์ม 2A)</span></td>
              </tr>
              <tr>
                <td style="padding:0.36cqw 0.78cqw"><strong>3. Community skills, population health &amp; health system</strong></td>
                <td style="padding:0.36cqw 0.78cqw">
                  <div><span class="or-tag-inline is-formative">Formative</span> การโค้ชระหว่างศึกษา 5 วัตถุประสงค์ระบบสุขภาพ ณ โรงพยาบาลแหล่งฝึก และทำ Health Survey</div>
                  <div style="margin-top:0.12cqw"><span class="or-tag-inline is-summative">Summative</span> <strong>Presentation (Health Systems, Epi)</strong> เพื่อแสดงการบรรลุ LO ร่วมกันเป็นทีม (<code>3A</code> 29 ธ.ค. &amp; <code>4A</code> 30 ธ.ค.) · <code>1A</code></div>
                </td>
                <td style="padding:0.36cqw 0.78cqw">คณาจารย์ประจำวิชา · เพื่อน · อ.ที่ปรึกษากลุ่ม</td>
                <td style="padding:0.36cqw 0.78cqw"><strong>O / S / M / U</strong><br><span style="font-size:0.86em;color:#64748b">(3A, 4A รายทีม · 1A บุคคล)</span></td>
              </tr>
              <tr>
                <td style="padding:0.36cqw 0.78cqw"><strong>4. Continuous professional development</strong></td>
                <td style="padding:0.36cqw 0.78cqw">
                  <div><span class="or-tag-inline is-formative">Formative</span> <code>SRN 1</code> (ส่ง 9 ธ.ค. เพื่อรับ Feedback รายบุคคลจากอาจารย์ที่ปรึกษาช่วงภาคสนาม)</div>
                  <div style="margin-top:0.12cqw"><span class="or-tag-inline is-summative">Summative</span> <code>SRN 2</code> (ส่ง 30 ธ.ค.) · <code>ฟอร์ม 1A</code> ข้อ 2 ความใฝ่รู้และพัฒนาตนเอง</div>
                </td>
                <td style="padding:0.36cqw 0.78cqw">อาจารย์ที่ปรึกษากลุ่ม · เพื่อนในกลุ่ม</td>
                <td style="padding:0.36cqw 0.78cqw"><strong>O / S / M / U</strong><br><span style="font-size:0.86em;color:#64748b">(รายบุคคล)</span></td>
              </tr>
              <tr>
                <td style="padding:0.36cqw 0.78cqw"><strong>5. Professional habits, attitudes, moral, ethics</strong></td>
                <td style="padding:0.36cqw 0.78cqw">
                  <div><span class="or-tag-inline is-formative">Formative</span> การสังเกตและให้ข้อมูลป้อนกลับด้านวินัยและจริยธรรมตลอดการเรียนและภาคสนาม</div>
                  <div style="margin-top:0.12cqw"><span class="or-tag-inline is-summative">Summative</span> Global Rating Scale <code>ฟอร์ม 1A</code> (ข้อ 6.1–6.3: รับผิดชอบ ซื่อสัตย์ น้ำใจ) &amp; ภาพรวมเจตคติ <code>ฟอร์ม 2A</code></div>
                </td>
                <td style="padding:0.36cqw 0.78cqw">อาจารย์ที่ปรึกษากลุ่ม (ข้อมูลประกอบจากเพื่อน)</td>
                <td style="padding:0.36cqw 0.78cqw"><strong>O / S / M / U &rarr; O / S / U</strong><br><span style="font-size:0.86em;color:#be123c">(ได้ U = ลงทะเบียนเรียนใหม่)</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Assessment Philosophy</span>
          <span class="or-story-a">แยก <strong>Formative (พื้นที่ปลอดภัยสำหรับฝึกคิดและรับคำแนะนำ)</strong> ออกจาก <strong>Summative (การตัดสินผลตามเกณฑ์มาตรฐาน)</strong> อย่างชัดเจนในทุกสมรรถนะ</span>
        </div>
      `
    },
    {
      id: "s11-eval-written-exams",
      num: "11",
      section: "evaluation",
      sectionLabel: "Act III · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · EVALUATION",
      timeWindow: "09.23 – 09.25 น. (2 นาที)",
      kicker: "03 · COMPETENCY 1 DEEP DIVE · EPIDEMIOLOGY EXAM & HEALTH SYSTEMS EXAM",
      title: "เจาะลึกการสอบภาคทฤษฎีทั้ง 2 หมวด: Table of Specifications (EP & 5 วัตถุประสงค์ระบบสุขภาพ)",
      lead: "คิดเกณฑ์ผ่านแยกกัน (แต่ละหมวดต้องได้ ≥ 2.00 · O ≥ 3.75) โดย Health Systems Exam อนุญาตกระดาษ A4 ลายมือตนเอง 1 แผ่น",
      notes:
        "เน้นโครงสร้างข้อสอบทั้ง 2 วัน: อังคาร 8 ธ.ค. สอบ Epidemiology Exam แบบ Closed-book และอังคาร 22 ธ.ค. สอบ Health Systems Exam แบบ Open Note (A4 เขียนลายมือตนเอง 1 แผ่น หน้า-หลัง) ตามสัดส่วน Table of Specifications ทั้ง 5 วัตถุประสงค์ของระบบสุขภาพ (20% · 25% · 20% · 20% · 15%)",
      render: () => `
        <div class="or-infog-split is-fig-left-compact">
          ${figPlate(
            "orient_s11_exam_spec.png",
            "Comparison of Closed-Book Epidemiology Exam and Open-Note A4 Health Systems Exam",
            "Epidemiology Exam (Closed-Book) vs. Health Systems Exam (Open-Note A4 · 1 แผ่น หน้า-หลัง)"
          )}

          <div class="or-grid-2" style="gap:0.65cqw">
            <div class="or-card is-white" style="padding:0.62cqw 0.85cqw;gap:0.22cqw">
              <span class="or-card-kicker">SUMMATIVE 2.1 · อ. 8 ธ.ค. 69 (09.00–12.00)</span>
              <h3 class="or-card-title" style="font-size:clamp(10.2px,1.12cqw,16px)">Epidemiology Exam (Closed-Book)</h3>
              <p class="or-card-text" style="font-size:clamp(8.2px,0.84cqw,12px);color:#64748b">ห้อง <code>2C2-02, 2C2-03</code> · <code>EP1–EP9</code> (รวมน้ำหนัก 100%)</p>
              <div class="or-stat-bar-list" style="gap:0.22cqw">
                <div class="or-stat-bar-row" style="padding:0.1cqw 0;cursor:default"><div class="or-stat-bar-head"><span><code>EP2</code> Diagnostic · <code>EP3</code> Errors</span><span>15% + 15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:75%"></div></div></div>
                <div class="or-stat-bar-row" style="padding:0.1cqw 0;cursor:default"><div class="or-stat-bar-head"><span><code>EP5</code> Outbreak · <code>EP6</code> Burden</span><span>15% + 15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:75%"></div></div></div>
                <div class="or-stat-bar-row" style="padding:0.1cqw 0;cursor:default"><div class="or-stat-bar-head"><span><code>EP8</code> Experimental (RCT)</span><span>15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:55%"></div></div></div>
                <div class="or-stat-bar-row" style="padding:0.1cqw 0;cursor:default"><div class="or-stat-bar-head"><span><code>EP4</code> Designs &amp; Impact (AR/PAR)</span><span>10%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:40%"></div></div></div>
                <div class="or-stat-bar-row" style="padding:0.1cqw 0;cursor:default"><div class="or-stat-bar-head"><span><code>EP7</code> Survey · <code>EP9</code> EBM</span><span>7.5% + 7.5%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:55%"></div></div></div>
              </div>
            </div>

            <div class="or-card is-navy-tint" style="padding:0.62cqw 0.85cqw;gap:0.22cqw">
              <span class="or-card-kicker">SUMMATIVE 2.2 · อ. 22 ธ.ค. 69 (09.00–12.00)</span>
              <h3 class="or-card-title" style="font-size:clamp(10.2px,1.12cqw,16px)">Health Systems Exam (Open Note A4)</h3>
              <p class="or-card-text" style="font-size:clamp(8.2px,0.84cqw,12px);color:#0369a1">ห้อง <code>2C2-01..03</code> · <strong>5 วัตถุประสงค์ระบบสุขภาพ</strong> (A4 ลายมือตนเอง 1 แผ่น)</p>
              <div class="or-stat-bar-list" style="gap:0.22cqw">
                <div class="or-stat-bar-row" style="padding:0.1cqw 0;cursor:default"><div class="or-stat-bar-head"><span><strong>1.</strong> สุขภาพ &amp; ปัจจัยกำหนด · ป้องกัน 4 ระดับ (<code>HS1</code>)</span><span>20%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:76%"></div></div></div>
                <div class="or-stat-bar-row" style="padding:0.1cqw 0;cursor:default"><div class="or-stat-bar-head"><span><strong>2.</strong> ระบบสุขภาพ &amp; บริการ · <code>EQESaRR</code> (<code>HS2–3, 5–6</code>)</span><span>25%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:94%"></div></div></div>
                <div class="or-stat-bar-row" style="padding:0.1cqw 0;cursor:default"><div class="or-stat-bar-head"><span><strong>3.</strong> ศักยภาพชุมชนในการพัฒนาสุขภาพ (<code>HS1, 5</code>)</span><span>20%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:76%"></div></div></div>
                <div class="or-stat-bar-row" style="padding:0.1cqw 0;cursor:default"><div class="or-stat-bar-head"><span><strong>4.</strong> การสร้างเสริมสุขภาพ (<code>HS4</code> · Ottawa/<code>COM-B</code>)</span><span>20%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:76%"></div></div></div>
                <div class="or-stat-bar-row" style="padding:0.1cqw 0;cursor:default"><div class="or-stat-bar-head"><span><strong>5.</strong> บทบาทแพทย์ต่อผู้ป่วย ครอบครัว &amp; ชุมชน</span><span>15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:58%"></div></div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Strict Exam Rules</span>
          <span class="or-story-a">สายเกิน <strong>15 นาที</strong> ไม่อนุญาตเข้าห้องสอบ · แต่งกายถูกระเบียบติดป้ายชื่อ · <strong>ห้ามนำเครื่องคิดเลข สมาร์ตวอทช์ มือถือ หรือเอกสารพิมพ์/ถ่ายเอกสาร</strong> เข้าห้องสอบ</span>
        </div>
      `
    },
    {
      id: "s12-eval-practical-rubrics",
      num: "12",
      section: "evaluation",
      sectionLabel: "Act III · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · EVALUATION",
      timeWindow: "09.25 – 09.27 น. (2 นาที)",
      kicker: "03 · COMPETENCIES 2–5 DEEP DIVE · TEAM PRESENTATION, REFLECTION & PROFESSIONALISM",
      title: "เจาะลึกการประเมินภาคปฏิบัติ: Presentation (Health Systems, Epi) ร่วมกันเป็นทีม สะท้อนคิด และเจตคติ",
      lead: "พิสูจน์การบรรลุ Learning Objectives ร่วมกันเป็นทีม (ฟอร์ม 3A และ 4A) ควบคู่กับการเติบโตและจริยธรรมรายบุคคล",
      notes:
        "อธิบายชิ้นงานหลักของสมรรถนะที่ 2–5: (1) SRN 1 ส่ง 9 ธ.ค. เพื่อรับ Feedback ช่วงภาคสนาม ก่อนส่ง SRN 2 วันที่ 30 ธ.ค., (2) Presentation ทั้ง Health Systems (ฟอร์ม 3A · 10+20 นาที) และ Epi (ฟอร์ม 4A · 7+18 นาที) เพื่อแสดงการบรรลุวัตถุประสงค์การเรียนรู้ร่วมกันเป็นทีม ห้ามใช้ VDO อัดล่วงหน้า, (3) ฟอร์ม 1A/2A เน้นความรับผิดชอบและความซื่อสัตย์วิชาชีพ",
      render: () => `
        <div class="or-top-fig-stack">
          ${figPlate("orient_s12_authentic_rubrics.png", "Reflective Growth, Presentation (Health Systems, Epi) to Demonstrate LOs as a Team, and Professional Integrity", "")}

          <div class="or-grid-3">
            <div class="or-card is-teal-tint" style="padding:0.55cqw 0.78cqw;gap:0.16cqw">
              <span class="or-card-kicker">1 · บันทึกสะท้อนคิด (COMPETENCY 4 · รายบุคคล)</span>
              <ul class="or-list" style="gap:0.14cqw;font-size:clamp(8.3px,0.86cqw,12.4px)">
                <li><strong><code>SRN 1</code> (Formative):</strong> ส่งพุธ <strong>9 ธ.ค. 69 (&le;17.00)</strong> ทาง E-learning เพื่อรับ Feedback จาก อ.ที่ปรึกษา</li>
                <li><strong><code>SRN 2</code> (Summative):</strong> ส่งพุธ <strong>30 ธ.ค. 69 (&le;17.00)</strong> หลังทำแบบประเมินรายวิชา</li>
                <li><strong>รูปแบบ:</strong> PDF <strong>&le; 5 หน้า A4</strong> (<code>TH Sarabun New 16pt</code>)</li>
              </ul>
            </div>

            <div class="or-card is-navy-tint" style="padding:0.55cqw 0.78cqw;gap:0.16cqw">
              <span class="or-card-kicker">2 · PRESENTATION (HEALTH SYSTEMS, EPI) · AS A TEAM</span>
              <ul class="or-list" style="gap:0.14cqw;font-size:clamp(8.3px,0.86cqw,12.4px)">
                <li><strong>เป้าหมาย:</strong> <strong>แสดงการบรรลุ Learning Objectives ร่วมกันเป็นทีม</strong> (ห้ามใช้ VDO บันทึกล่วงหน้า)</li>
                <li><strong>Health Systems (3A · 29 ธ.ค.):</strong> ครบ 5 วัตถุประสงค์ · พูด <strong>&le;10 น.</strong> + อภิปราย <strong>&le;20 น.</strong></li>
                <li><strong>Epi (4A · 30 ธ.ค.):</strong> วิจัยเชิงปริมาณ 1 เรื่อง · พูด <strong>&le;7 น.</strong> + อภิปราย <strong>&le;18 น.</strong></li>
              </ul>
            </div>

            <div class="or-card is-amber-tint" style="padding:0.55cqw 0.78cqw;gap:0.16cqw">
              <span class="or-card-kicker">3 · GRS &amp; เจตคติวิชาชีพ (COMPETENCY 2 &amp; 5 · รายบุคคล)</span>
              <ul class="or-list" style="gap:0.14cqw;font-size:clamp(8.3px,0.86cqw,12.4px)">
                <li><strong>ฟอร์ม 1A (GRS):</strong> อ่อนน้อม · ใฝ่รู้ · ผู้นำ/ทีม · มีส่วนร่วม · รับผิดชอบ · <strong>ซื่อสัตย์ (ไม่เมคข้อมูล/ไม่ลอกงาน/ไม่เซ็นชื่อแทน)</strong> · น้ำใจ</li>
                <li><strong>Peer + ฟอร์ม 2A:</strong> ประมวลเป็นภาพรวมเจตคติ <strong>O / S / U</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Team LO Achievement</span>
          <span class="or-story-a">เวที <strong>Presentation (Health Systems, Epi)</strong> ออกแบบให้สมาชิกทุกคนในกลุ่มร่วมกันสังเคราะห์และแลกเปลี่ยน เพื่อพิสูจน์ <strong>การบรรลุวัตถุประสงค์การเรียนรู้ในฐานะทีมเดียวกัน</strong></span>
        </div>
      `
    },
    {
      id: "s13-grading-milestones",
      num: "13",
      section: "evaluation",
      sectionLabel: "Act III · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · EVALUATION",
      timeWindow: "09.27 – 09.28 น. (1 นาที)",
      kicker: "03 · FINAL GRADE CRITERIA (O / S / U), REMEDIATION & 7 MILESTONES",
      title: "เกณฑ์การตัดสินเกรดสุดท้าย (O / S / U) การสอบซ่อม และสรุป 7 กำหนดการสำคัญ",
      lead: "โปร่งใส ชัดเจน ทั้งเงื่อนไขเกรดดีเยี่ยม (O) เกณฑ์ผ่านมาตรฐาน (S) และการสอบแก้ตัวแยกหมวดวิชา",
      notes:
        "สรุปกติกาตัดเกรดรายวิชา: (1) เกรด O ต้องได้ ≥ 3.75 ทั้ง Epi Exam และ Health Systems Exam + ฟอร์ม 2A ได้ O + ไม่เคยสอบซ่อม, (2) เกรด S เมื่อผ่านทั้ง EP และ HS (≥ 2.00) และฟอร์ม 2A ไม่เป็น U, (3) หากหมวดใด < 2.00 สอบซ่อมเฉพาะหมวดนั้นได้ 1 ครั้ง ผ่านได้ S (มีผลต่อเกียรตินิยม), (4) ลงทะเบียนเรียนใหม่เมื่อซ่อมไม่ผ่าน หรือฟอร์ม 2A ได้ U",
      render: () => `
        <div class="or-infog-split">
          <div style="display:flex;flex-direction:column;gap:0.52cqw;min-height:0">
            <div class="or-card is-teal-tint" style="padding:0.62cqw 0.88cqw;gap:0.2cqw">
              <span class="or-card-kicker">เกรด O (OUTSTANDING · ดีเยี่ยม) — ต้องครบทั้ง 3 ข้อ</span>
              <ul class="or-list" style="gap:0.16cqw;font-size:clamp(8.8px,0.92cqw,13.2px)">
                <li><strong>1. ผลสอบทฤษฎีได้ O:</strong> ทั้ง <strong>Epi Exam</strong> และ <strong>Health Systems Exam</strong> ผ่านเกณฑ์ (&ge; 2.00) และแต้มรวมแต่ละส่วน <strong>&ge; 3.75</strong></li>
                <li><strong>2. ภาพรวมเจตคติและพฤติกรรม (ฟอร์ม 2A) ได้ O</strong></li>
                <li><strong>3. ไม่เคยสอบซ่อม</strong> ในส่วนใดส่วนหนึ่ง</li>
              </ul>
            </div>

            <div class="or-card is-navy-tint" style="padding:0.56cqw 0.88cqw;gap:0.16cqw">
              <span class="or-card-kicker">เกรด S (SATISFACTORY · ผ่านเกณฑ์มาตรฐาน)</span>
              <p class="or-card-text" style="font-size:clamp(8.8px,0.92cqw,13.2px)">สอบผ่านทั้งสองหมวด (<strong>Epi Exam &ge; 2.00</strong> และ <strong>Health Systems Exam &ge; 2.00</strong>) และภาพรวมเจตคติ <strong>ฟอร์ม 2A ได้ O หรือ S</strong></p>
            </div>

            <div class="or-card is-rose-tint or-mt-auto" style="padding:0.6cqw 0.88cqw;gap:0.18cqw">
              <span class="or-card-kicker">การสอบซ่อมแยกหมวด &amp; เงื่อนไขลงทะเบียนเรียนใหม่ (U)</span>
              <ul class="or-list" style="gap:0.16cqw;font-size:clamp(8.6px,0.9cqw,12.8px)">
                <li><strong>สอบซ่อม 1 ครั้ง:</strong> เมื่อแต้มทฤษฎีหมวดใด <strong>&lt; 2.00</strong> ซ่อมเฉพาะหมวดนั้น — ผ่านได้ <strong>S</strong> <em>(มีผลต่อการรับเกียรตินิยม)</em></li>
                <li><strong>ลงทะเบียนเรียนใหม่เมื่อ:</strong> (1) สอบแก้ตัวไม่ผ่าน หรือ (2) ผลประเมินเจตคติ <strong>ฟอร์ม 2A ได้ U</strong></li>
              </ul>
            </div>
          </div>

          <div class="or-table-wrap">
            <table class="or-table" style="font-size:clamp(8.4px,0.88cqw,12.6px)">
              <thead>
                <tr><th>7 กำหนดการสอบ &amp; ส่งงานสำคัญ</th><th>วัน – เวลา &amp; ช่องทาง</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>1. Epidemiology Exam (EP1–9)</strong></td><td>อ. 8 ธ.ค. 69 (09.00–12.00) · <code>2C2-02..03</code></td></tr>
                <tr><td><strong>2. ส่ง SRN 1</strong> + ประเมินภาคทฤษฎี</td><td>พ. 9 ธ.ค. 69 (&le; 17.00 น.) · E-learning</td></tr>
                <tr><td><strong>3. Health Systems Exam (Open Note)</strong></td><td>อ. 22 ธ.ค. 69 (09.00–12.00) · <code>2C2-01..03</code></td></tr>
                <tr><td><strong>4. Presentation: Health Systems (Team · 3A)</strong></td><td>อ. 29 ธ.ค. 69 (08.30–15.30) · <code>2C2-03</code></td></tr>
                <tr><td><strong>5. Presentation: Epi (Team · 4A)</strong></td><td>พ. 30 ธ.ค. 69 (08.30–12.45) · <code>2C2-03</code></td></tr>
                <tr><td><strong>6. ส่ง SRN 2</strong> + ประเมินรายวิชา</td><td>พ. 30 ธ.ค. 69 (&le; 17.00 น.) · E-learning</td></tr>
                <tr><td><strong>7. ส่งสไลด์ Presentation &amp; Health Survey</strong></td><td>พ. 30 ธ.ค. 69 (&le; 17.00 น.) · Google Form</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Key Reminder</span>
          <span class="or-story-a">ก่อนส่ง <code>SRN 1</code> และ <code>SRN 2</code> ในระบบ E-learning อย่าลืมทำ <strong>แบบประเมินการสอนภาคทฤษฎีและแบบประเมินรายวิชา</strong> ให้เรียบร้อยครบถ้วน</span>
        </div>
      `
    },
    {
      id: "s14-attendance-safety",
      num: "14",
      section: "action",
      sectionLabel: "Act IV · Conduct & Launch",
      actClass: "is-act-4",
      actLabel: "ACT IV · CONDUCT & SAFETY",
      timeWindow: "09.28 – 09.29 น. (1 นาที)",
      kicker: "04 · ATTENDANCE POLICY & 6 FIELDWORK SAFETY REGULATIONS (B.E. 2561)",
      title: "วินัยเวลาเรียน โควตาการลา และเกราะความปลอดภัย 6 ข้อในการฝึกปฏิบัติงานภาคสนาม",
      lead: "คุ้มครองความปลอดภัยของนักศึกษา ทีมงาน และชุมชนเจ้าบ้าน พร้อมรักษามาตรฐานวิชาชีพตลอดเวลาทั้งในพื้นที่และสื่อออนไลน์",
      notes:
        "ย้ำเกณฑ์ลงชื่อเข้าเรียน (-15 ถึง +15 นาที) เวลาเรียนรวม ≥ 80% โควตาการลา (ก่อน+หลังภาคสนาม ≤ 3 วัน, ช่วงภาคสนาม ≤ 1.5 วัน) และระเบียบปฏิบัติงานนอกสถานที่ พ.ศ. 2561 ทั้ง 6 ข้อ",
      render: () => `
        <div class="or-infog-split">
          <div class="or-schematic-box">
            <div>
              <span class="or-card-kicker">SIGN-IN WINDOW &amp; LEAVE QUOTAS</span>
              <h3 class="or-card-title" style="margin-top:0.15cqw">กติกาเวลาเรียนและการยื่นใบลา</h3>
            </div>

            <div>
              <div style="font-size:clamp(8.4px,0.86cqw,12.2px);font-weight:700;margin-bottom:0.18cqw;color:#475569">หน้าต่างเวลาลงชื่อเข้าเรียนในแต่ละคาบ</div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1.1fr;border-radius:8px;overflow:hidden;font-family:var(--font-display);font-size:clamp(8px,0.82cqw,11.8px);font-weight:800;color:#fff;text-align:center">
                <div style="background:#009E73;padding:0.36cqw 0.25cqw">-15 น. เปิดลงชื่อ</div>
                <div style="background:#0072B2;padding:0.36cqw 0.25cqw">00:00–15:00 ปกติ</div>
                <div style="background:#D55E00;padding:0.36cqw 0.25cqw">&gt; +15 น. นับว่าสาย</div>
              </div>
            </div>

            <div class="or-stat-bar-list">
              <div class="or-stat-bar-row" style="cursor:default"><div class="or-stat-bar-head"><span>เวลาเรียนรวมตลอดรายวิชา (สิทธิ์สอบ)</span><span>&ge; 80%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:80%"></div></div></div>
              <div class="or-stat-bar-row" style="cursor:default"><div class="or-stat-bar-head"><span>โควตาลาก่อน + หลังภาคสนามรวมกัน</span><span>&le; 3.0 วัน</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-amber" style="width:45%"></div></div></div>
              <div class="or-stat-bar-row" style="cursor:default"><div class="or-stat-bar-head"><span>โควตาลาช่วงฝึกปฏิบัติงานภาคสนาม</span><span>&le; 1.5 วัน</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-crimson" style="width:24%"></div></div></div>
            </div>

            <div class="or-card is-amber-tint or-mt-auto" style="padding:0.52cqw 0.75cqw;gap:0.12cqw">
              <p class="or-card-text" style="font-size:clamp(8.5px,0.88cqw,12.5px)"><strong>ขั้นตอนการลา:</strong> ยื่นใบลาล่วงหน้าเป็นลายลักษณ์อักษร (หรือผ่าน Portal) และต้องได้รับอนุญาตจาก อ.ที่ปรึกษาก่อนเสมอ (ป่วยกะทันหันในพื้นที่ แจ้งอาจารย์/ครูพี่เลี้ยงทันที)</p>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:0.48cqw;min-height:0">
            ${figPlate("orient_s14_safety_shields.png", "6 Fieldwork Safety and Professionalism Shields", "")}
            <div class="or-card is-white" style="padding:0.5cqw 0.78cqw">
              <p class="or-card-text" style="font-size:clamp(8.3px,0.85cqw,12.2px);line-height:1.35">
                <strong>ประกาศภาควิชาฯ พ.ศ. 2561:</strong> (1) <strong>ห้ามนำรถส่วนตัวไปใช้</strong> · (2) <strong>ห้ามออกนอกเขต/ไปเก็บข้อมูลลำพัง</strong> · (3) งดบุคคลภายนอกเยี่ยม · (4) แต่งกายสุภาพติดป้ายชื่อ · (5) <strong>งดแอลกอฮอล์ สารเสพติด การพนัน</strong> · (6) เคารพชุมชนและระมัดระวังการโพสต์โซเชียล
              </p>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Zero Accident Goal</span>
          <span class="or-story-a">กฎเหล็กทั้ง 6 ข้อมีไว้เพื่อดูแลให้ <strong>นักศึกษาทั้ง 169 คนเดินทางไปเรียนรู้ร่วมกับชุมชนและกลับถึงรามาธิบดีอย่างปลอดภัย 100%</strong></span>
        </div>
      `
    },
    {
      id: "s15-digital-launch",
      num: "15",
      section: "action",
      sectionLabel: "Act IV · Conduct & Launch",
      actClass: "is-act-4",
      actLabel: "ACT IV · LAUNCHPAD",
      timeWindow: "09.29 – 09.30 น. (1 นาที)",
      kicker: "04 · DIGITAL ECOSYSTEM HUB & WEEK-1 ACTION PLAN",
      title: "ระบบนิเวศดิจิทัลประจำรายวิชา และ 4 ก้าวแรกของสัปดาห์ที่ 1",
      lead: "เชื่อมต่อตารางเรียน บทเรียน ST1 & HS1–HS6 ห้อง Zoom โรงพยาบาลแหล่งฝึก และระบบส่งงานไว้ครบในที่เดียว",
      notes:
        "สรุปปิดท้ายคาบปฐมนิเทศ: แนะนำ 3 แพลตฟอร์มดิจิทัลหลัก ย้ำให้นักศึกษาผูกชื่อ/กลุ่มเพื่อซิงค์ปฏิทิน .ics เข้ามือถือ เตรียมอ่าน HS1 เย็นนี้สำหรับพรุ่งนี้เช้า และส่งต่อเวทีเข้าสู่คาบ ST1: Systems & Systems Thinking เวลา 09.30 น. ณ ห้อง 2C2-03",
      render: () => `
        <div class="or-infog-split is-fig-left">
          <div style="display:flex;flex-direction:column;gap:0.48cqw;min-height:0">
            ${figPlate("orient_s15_digital_hub.png", "RACM 303 Connected Digital Learning Hub", "")}
            <div class="or-card is-navy-tint" style="padding:0.52cqw 0.78cqw;gap:0.14cqw">
              <p class="or-card-text" style="font-size:clamp(8.4px,0.86cqw,12.4px);line-height:1.35">
                <strong>1. Smart Portal:</strong> ตารางเฉพาะกลุ่ม · ปฏิทิน <code>.ics</code> · บทเรียน 5 ขั้น · ลิงก์ Zoom · ใบลาออนไลน์<br>
                <strong>2. RAMA E-learning (<code>id=398</code>):</strong> แบบฝึกหัด SDL ระบาดฯ &amp; ส่ง <code>SRN 1–2</code><br>
                <strong>3. Google Form 2569:</strong> ส่งไฟล์สไลด์นำเสนอ <code>3A/4A</code> &amp; แบบสอบถาม Health Survey
              </p>
            </div>
          </div>

          <div class="or-inspector-box is-teal">
            <div>
              <span class="or-card-kicker">WEEK 1 ACTION PLAN · เริ่มต้นทันทีวันนี้!</span>
              <h3 class="or-card-title" style="margin-top:0.15cqw">4 ก้าวแรกของสัปดาห์ที่ 1</h3>
            </div>

            <div style="display:flex;flex-direction:column;gap:0.42cqw">
              <div class="or-card is-white" style="padding:0.5cqw 0.75cqw;gap:0.1cqw">
                <span class="or-card-kicker">① วันนี้ · 09.30 – 12.00 น. (ห้อง 2C2-03)</span>
                <p class="or-card-text" style="font-weight:700">เรียนต่อเนื่องคาบแรก <code>ST1</code>: Systems &amp; Systems Thinking</p>
              </div>
              <div class="or-card is-white" style="padding:0.5cqw 0.75cqw;gap:0.1cqw">
                <span class="or-card-kicker">② วันนี้ · 13.00 – 16.00 น. (ห้อง 2C2-03)</span>
                <p class="or-card-text" style="font-weight:700">เสวนา Bedside to Systems-Based Practice: Global/Planetary Health &amp; HPSR</p>
              </div>
              <div class="or-card is-white" style="padding:0.5cqw 0.75cqw;gap:0.1cqw">
                <span class="or-card-kicker">③ เย็นวันนี้ · เตรียมพร้อมก่อนเข้าเรียนพรุ่งนี้</span>
                <p class="or-card-text" style="font-weight:700">อ่านบทเรียนและตอบคำถามนำ Pre-class <code>HS1</code> (เข้าห้องใหญ่พรุ่งนี้ 08.30 น. &rarr; 6 กลุ่มย่อย 09.40 น.)</p>
              </div>
              <div class="or-card is-white" style="padding:0.5cqw 0.75cqw;gap:0.1cqw">
                <span class="or-card-kicker">④ พฤหัสบดี 26 พ.ย. · 13.00 – 16.30 น.</span>
                <p class="or-card-text" style="font-weight:700">พบอาจารย์ที่ปรึกษาประจำกลุ่มโรงพยาบาลแหล่งฝึกทั้ง 9 แห่ง ในกิจกรรมกลุ่มย่อย ครั้งที่ 1</p>
              </div>
            </div>
          </div>
        </div>

        <div class="or-story-ribbon">
          <span class="or-story-q">Up Next · 09.30 น.</span>
          <span class="or-story-a">ยินดีต้อนรับเข้าสู่รายวิชา <strong>RACM 303 ปีการศึกษา 2569</strong> — ขอให้เป็น 6 สัปดาห์แห่งการเติบโตที่มีความหมายสำหรับทุกคน!</span>
        </div>
      `
    }
  ];

  const SECTION_FILTERS = [
    { id: "all", labelTh: "ทั้งหมด (15)", labelEn: "All Slides (15)" },
    { id: "intro", labelTh: "เปิดเรื่อง (1)", labelEn: "Opening (1)" },
    { id: "objectives", labelTh: "Act I · Start with Why (4)", labelEn: "Act I · Start with Why (4)" },
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
            <h2 class="or-cover-h1" style="font-size:clamp(19px,2.58cqw,38px)">Orientation to Community Medicine and Health Systems Science</h2>
            <p class="or-cover-sub" style="font-size:clamp(11px,1.25cqw,18.5px)">Start with Why, Learning Experience, and Competency-Based Evaluation — จากข้างเตียงสู่ชุมชนและระบบสุขภาพ</p>

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
                <span class="or-cover-kpi-lbl">โรงพยาบาลแหล่งฝึก</span>
              </div>
              <div class="or-cover-kpi">
                <span class="or-cover-kpi-val">5</span>
                <span class="or-cover-kpi-lbl">สมรรถนะหลัก</span>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5cqw;margin-top:0.2cqw">
              <div style="background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:0.45cqw 0.7cqw;font-size:clamp(8.5px,0.88cqw,12.6px)"><strong style="color:#fde68a">Act I · Start with Why:</strong> เสาหลักที่ 3 HSS &amp; 5 วัตถุประสงค์</div>
              <div style="background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:0.45cqw 0.7cqw;font-size:clamp(8.5px,0.88cqw,12.6px)"><strong style="color:#6ee7b7">Act II · Journey:</strong> 6 สัปดาห์ &amp; 9 โรงพยาบาลแหล่งฝึก</div>
              <div style="background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:0.45cqw 0.7cqw;font-size:clamp(8.5px,0.88cqw,12.6px)"><strong style="color:#93c5fd">Act III · Mastery:</strong> วัดผล 5 สมรรถนะ (Formative/Summative)</div>
              <div style="background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:0.45cqw 0.7cqw;font-size:clamp(8.5px,0.88cqw,12.6px)"><strong style="color:#fda4af">Act IV · Launch:</strong> 6 กฎเหล็กปลอดภัย &amp; ก้าวแรกวันนี้</div>
            </div>
          </div>

          <!-- Right: Nano Banana Cover Panorama Figure -->
          <div style="display:flex;flex-direction:column;justify-content:center;min-height:0;height:100%">
            ${figPlate(
              "orient_s01_hero.png",
              "Bedside Care connected to Community & Livelihood and Health Systems Science",
              "",
              "is-cover-hero"
            )}
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
          <span class="or-cover-code-chip">15 Widescreen Slides · 16:9</span>
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
        if (tag === "BUTTON" && ev.key === " ") return;
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
            <span class="or-code-pill">ORIENT · 16:9</span>
            <div class="or-top-title-wrap">
              <span class="or-top-title">${esc(
                t(
                  "ปฐมนิเทศรายวิชา RACM 303: Start with Why, Learning Experience & Evaluation",
                  "RACM 303 Orientation: Start with Why, Learning Experience & Evaluation"
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
            <button type="button" class="or-tool-btn${state.showNotes ? " is-active-toggle" : ""}" id="orToggleNotesBtn" title="เปิด/ปิดโน้ตผู้สอน (กด N)">${SVG.notes} <span>${esc(
              ROLE === "faculty" ? t("โน้ตผู้สอน", "Presenter Notes") : t("คำอธิบายสไลด์", "Slide Notes")
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
              <div class="or-notes-kicker">${esc(cur.timeWindow)} · PRESENTER STORYTELLING GUIDE</div>
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

    wireLaserIfActive(modal);
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
