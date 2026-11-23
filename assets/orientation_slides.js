/* ==========================================================================
   RACM 303 (2569) — Orientation to Community Medicine & Health Systems Science
   15-Slide Non-Interactive 16:9 Widescreen Apple-Keynote Slide Deck
   1/3 Hero Header + 2/3 Simplified Bento Body · All-Device Responsive Edition
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const ASSET_VER = "20261123or15";
  const PPTX_HREF = `exports/pptx/RACM303_2569_Orientation_Slides.pptx?v=${ASSET_VER}`;
  const PDF_HREF = `exports/pdf/RACM303_2569_Orientation_Slides.pdf?v=${ASSET_VER}`;
  const IMG_DIR = "assets/images/orientation";
  const AUTOPLAY_MS = 9000;

  const state = {
    isOpen: false,
    slideIdx: 0,
    viewMode: "deck", // "deck" | "sorter" | "handout"
    sorterFilter: "all",
    presentationMode: false,
    showNotes: ROLE === "faculty" && window.innerWidth >= 1024 && window.innerHeight >= 620,
    toolsMenuOpen: false,
    laserActive: false,
    autoPlay: false,
    autoPlayTimeout: null,
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

  function figPlate(fileName, altText, captionHtml, extraCls, badgeText) {
    return `
      <figure class="or-fig-plate${extraCls ? " " + extraCls : ""}">
        ${badgeText ? `<div class="or-fig-top-badge">${esc(badgeText)}</div>` : ""}
        <div class="or-fig-img-wrap">
          <img class="or-fig-img" src="${IMG_DIR}/${esc(fileName)}?v=${ASSET_VER}" alt="${esc(altText)}" loading="eager" decoding="async" />
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

  /* ---------- Complete 15-Slide Apple-Keynote Simplified Deck (1/3 Header + 2/3 Bento Body) ---------- */
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
      title: "Orientation to Community Medicine & Health Systems Science",
      keyTag: "KEY TAKEAWAY",
      keyMessageHtml:
        "เชื่อม <strong>การรักษาข้างเตียง</strong> เข้ากับ <strong>วิถีชุมชนและระบบสุขภาพ</strong> ผ่านประสบการณ์จริง 6 สัปดาห์ · 5 สมรรถนะหลัก",
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
      kicker: "01 · HEALTH SYSTEMS SCIENCE (HSS) CURRICULAR FRAMEWORK",
      title: "Health Systems Science: “เสาหลักที่ 3” และแกนเชื่อมโยงแพทยศาสตรศึกษา",
      keyTag: "START WITH WHY",
      keyMessageHtml:
        "Basic &amp; Clinical Science ตอบว่า <strong>“รักษาโรคอย่างไร”</strong> — แต่ <strong>Health Systems Science</strong> ตอบว่า <strong>“ทำไมการรักษาจึงเปลี่ยนชีวิตผู้ป่วยและสังคมได้จริง”</strong>",
      notes:
        "อธิบายผ่าน 2 แผนภาพต้นฉบับของ AMA Health Systems Science: (1) The Three-Pillar Model of Medical Education (Skochelak SE et al., AMA/Elsevier, 2017, Fig. 1.4) ที่ชี้ว่า HSS คือเสาหลักที่ 3 คู่กับ Basic และ Clinical Science และ (2) กรอบสมรรถนะ HSS (Gonzalo JD et al., Acad Med. 2017;92(1):123–131, Fig. 1) ที่มี Systems thinking เป็น Linking domain เชื่อม Core domains ทั้ง 6 ด้านเข้ากับ Cross-cutting domains ทั้ง 5 ด้าน",
      render: () => `
        <div class="or-s02-bento-grid">
          ${figPlate(
            "orient_s02_three_pillars_orig.png",
            "The three-pillar model of medical education: Basic science, Clinical science, and Health systems science",
            "<strong>Fig. 1.4</strong> Three-pillar model — <em>Skochelak SE et al., Health Systems Science</em> (AMA / Elsevier, 2017)",
            "is-s02-plate",
            "1 · THREE-PILLAR MODEL"
          )}

          ${figPlate(
            "orient_s02_hss_domains_orig.png",
            "Core, cross-cutting, and linking domains for a health systems science curricular framework",
            "<strong>Fig. 1</strong> Core, cross-cutting &amp; linking domains — <em>Gonzalo JD et al., Acad Med.</em> 2017;92(1):123–131",
            "is-s02-plate",
            "2 · HSS DOMAINS & LINKING DOMAIN"
          )}

          <div class="or-stack-col is-s02-stack">
            <div class="or-card is-rose-tint">
              <span class="or-card-kicker">WHY THE 3RD PILLAR?</span>
              <h3 class="or-card-title">ลำพังเก่งข้างเตียงยังไม่พอ</h3>
              <p class="or-card-text">หากขาดระบบส่งต่อ สิทธิการรักษา และการดูแลต่อเนื่อง ผู้ป่วยย่อมกลับไปป่วยซ้ำ — จึงต้องผสานครบ <strong>Basic + Clinical + HSS</strong></p>
            </div>

            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">CORE × CROSS-CUTTING</span>
              <h3 class="or-card-title">6 แกนระบบ × 5 สมรรถนะร่วม</h3>
              <p class="or-card-text">เชื่อมโครงสร้างบริการ นโยบาย สุขภาพประชากร และคุณค่า เข้ากับ <strong>ภาวะผู้นำ ทีมสหวิชาชีพ EBM และจริยธรรม</strong></p>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">SYSTEMS THINKING = LINKING DOMAIN</span>
              <h3 class="or-card-title">คิดเชิงระบบเชื่อมทุกมิติ</h3>
              <p class="or-card-text">เป็นวงแหวนเชื่อมโยงทุกโดเมนสู่การดูแลที่เกิดคุณค่าและเป็นธรรม (<strong>Value-Based &amp; Equitable Care</strong>)</p>
            </div>
          </div>
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
      kicker: "01 · BEYOND THE BEDSIDE & RAMATHIBODI COMMUNITY MEDICINE HERITAGE",
      title: "มองให้ลึกกว่าข้างเตียง: จากรากเหง้าสุขภาพชุมชน สู่ปณิธานรามาธิบดี",
      keyTag: "KEY TAKEAWAY",
      keyMessageHtml:
        "การรักษาข้างเตียงช่วยชีวิตผู้ป่วยรายบุคคล แต่ <strong>ความเข้าใจ SDH, CDoH ชุมชน และระบบสุขภาพ</strong> ป้องกันไม่ให้คนทั้งชุมชนต้องเจ็บป่วยซ้ำ",
      notes:
        "เชื่อมภาพสิ่งที่เห็นในโรงพยาบาลกับรากเหง้าด้านล่าง (อาชีพ โภชนาการ ที่อยู่อาศัย อสม. ระบบบริการปฐมภูมิ หลักประกันสุขภาพ และนโยบาย) เข้ากับปณิธานก่อตั้งเวชศาสตร์ชุมชน รามาธิบดี ตั้งแต่ พ.ศ. 2511 โดย ศ.นพ.อารี วัลยะเสวี และ ศ.นพ.เปรม บุรี",
      render: () => `
        <div class="or-infog-split is-fig-left">
          ${figPlate(
            "orient_s03_beyond_bedside.png",
            "เชื่อมโยงการดูแลข้างเตียง ปัจจัยกำหนดสุขภาพในชุมชน และระบบสุขภาพ สู่บทบาท Change Agent",
            ""
          )}

          <div class="or-stack-col">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">FOUNDING VISION · พ.ศ. 2511 &rarr; ปัจจุบัน</span>
              <h3 class="or-card-title">ปณิธาน ศ.นพ.อารี วัลยะเสวี &amp; ศ.นพ.เปรม บุรี</h3>
              <p class="or-card-text">เตรียมบัณฑิตแพทย์ให้เข้าใจบริบทชีวิตจริงของประชาชน ทำงานร่วมกับชุมชนและระบบสาธารณสุขอย่างมีความสุข ในฐานะ <strong>Change Agent</strong></p>
            </div>

            <div class="or-card is-white">
              <span class="or-card-kicker">RAMATHIBODI HERITAGE · พัฒนาการ &amp; 3 พันธกิจหลัก</span>
              <ul class="or-list">
                <li><strong>พ.ศ. 2511–2512:</strong> บุกเบิกสำรวจสุขภาพ ต.บางชัน &amp; โครงการสหวิชาชีพ อ.บางปะอิน</li>
                <li><strong>พ.ศ. 2525 &rarr; 2546:</strong> ศูนย์เวชศาสตร์ชุมชน &rarr; <strong>ภาควิชาเวชศาสตร์ชุมชน</strong></li>
                <li><strong>3 พันธกิจ:</strong> สร้างเสริมสุขภาพ/สุขภาพโลก · วิจัยระบบสุขภาพ · อาชีวเวชศาสตร์ฯ</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">3-LEVEL CLINICAL LENS</span>
              <h3 class="or-card-title">มองเห็น 3 ระดับเชื่อมโยงกันเสมอในทุกเคส</h3>
              <p class="or-card-text">บูรณาการ <strong>“ผู้ป่วยตรงหน้า”</strong> &times; <strong>“ครอบครัวและชุมชน (SDH, CDoH)”</strong> &times; <strong>“โครงสร้างระบบบริการสุขภาพ”</strong></p>
            </div>
          </div>
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
      keyTag: "COMPETENCY ALIGNMENT",
      keyMessageHtml:
        "ทุกกิจกรรมการเรียนและการประเมินใน RACM 303 ออกแบบเชื่อมตรงจาก <strong>วัตถุประสงค์ ก–ง สู่สมรรถนะหลักทั้ง 5 ด้าน (C1–C5)</strong>",
      notes:
        "ชี้ให้เห็นว่าวัตถุประสงค์รายวิชาทั้ง 4 หมวด (ก–ง) ในคู่มือรายวิชา ถูกออกแบบให้รองรับสมรรถนะหลัก 5 ด้าน (Holistic Physician Competencies) ซึ่งจะใช้เป็นกรอบประเมินผลสัมฤทธิ์ของรายวิชาในพาร์ทที่ 3",
      render: () => `
        <div class="or-infog-split is-fig-left-compact">
          ${figPlate(
            "orient_s04_competencies.png",
            "5 Core Physician Competencies of RACM 303",
            ""
          )}

          <div class="or-grid-2 is-s04-grid">
            <div class="or-card is-navy-tint is-vcenter">
              <span class="or-card-kicker">ก. COGNITIVE &rarr; C1, C3</span>
              <h3 class="or-card-title">ประยุกต์ใช้ HSS &amp; ระบาดวิทยา</h3>
              <ul class="or-list is-s04-list">
                <li>ระบาดวิทยาคลินิก/ชุมชน &amp; EBM (<code>EP1–EP9</code>)</li>
                <li>สุขภาพ ปัจจัยกำหนดสุขภาพ <code>SDH, CDoH</code> &amp; การป้องกันโรค (<code>HS1</code>)</li>
                <li>ระบบบริการ <code>6BB/6W</code> · <code>EQESaRR</code> · <code>COM-B</code> · ปฐมภูมิ &amp; UHC (<code>HS2–6</code>)</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint is-vcenter">
              <span class="or-card-kicker">ข. AWARENESS &rarr; C3, C5</span>
              <h3 class="or-card-title">บทบาทแพทย์ ชุมชน &amp; จริยธรรม</h3>
              <ul class="or-list is-s04-list">
                <li>ตระหนักใน <strong>Physician Roles in Health Systems</strong></li>
                <li>เคารพ <strong>ศักยภาพและทุนทางสังคมของชุมชน</strong></li>
                <li>ตรงต่อเวลา ซื่อสัตย์ เห็นอกเห็นใจ ไม่เอาเปรียบผู้อื่น</li>
              </ul>
            </div>

            <div class="or-card is-white is-vcenter">
              <span class="or-card-kicker">ค. SKILLS &rarr; C1, C2, C3</span>
              <h3 class="or-card-title">คิดเชิงระบบ สำรวจจริง &amp; สื่อสารทีม</h3>
              <ul class="or-list is-s04-list">
                <li><strong>Cognitive:</strong> คิดเชิงระบบ วิเคราะห์ และวางแผนแก้ปัญหา</li>
                <li><strong>Psychomotor:</strong> ลงมือสำรวจสุขภาพชุมชนเชิงประจักษ์</li>
                <li><strong>Communication:</strong> ประสานงานกับเพื่อน สหวิชาชีพ และชุมชน</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint is-vcenter">
              <span class="or-card-kicker">ง. CHARACTER &rarr; C2, C4, C5</span>
              <h3 class="or-card-title">ความรับผิดชอบร่วม &amp; พัฒนาตนเอง</h3>
              <ul class="or-list is-s04-list">
                <li><strong>Team Accountability:</strong> ร่วมรับผิดชอบเป้าหมายทีมในพื้นที่จริง</li>
                <li><strong>Metacognition &amp; CPD:</strong> ทบทวนและสะท้อนคิดประสบการณ์ตนเองอย่างเป็นระบบ (<code>SRN 1–2</code>)</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s05-hs-5objectives",
      num: "05",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · 5 HSS × LINKING DOMAIN",
      timeWindow: "09.08 – 09.10 น. (2 นาที)",
      kicker: "01 · FIVE HEALTH SYSTEMS OBJECTIVES × SYSTEMS THINKING AS LINKING DOMAIN",
      title: "5 วัตถุประสงค์ Health Systems: เชื่อมจุดด้วย Systems Thinking",
      keyTag: "CONNECTING THE DOTS",
      keyMessageHtml:
        "<strong>Presentation (Health Systems · 3A)</strong> เน้นสมรรถนะ <strong>Systems Thinking (Linking Domain)</strong> เชื่อมทั้ง 5 วัตถุประสงค์ — <strong>ไม่แยกส่วนรายข้อ</strong>",
      notes:
        "ย้ำหัวใจสำคัญที่สุดของการบูรณาการหมวดระบบสุขภาพ: ทั้ง 5 วัตถุประสงค์ไม่ได้มีไว้ให้นักศึกษาแบ่งงานกันเรียนรู้หรือนำเสนอแบบแยกส่วน (Siloed) แต่ต้องใช้สมรรถนะ Systems Thinking ในฐานะ Linking Domain มาเชื่อมจุด (Connecting the Dots) ให้เห็นความสัมพันธ์เชิงระบบของพื้นที่จริง โดยเฉพาะในเวที Presentation (Health Systems) ฟอร์ม 3A",
      render: () => `
        <div class="or-infog-split is-fig-left">
          ${figPlate(
            "orient_s05_district_lenses.png",
            "Systems Thinking as Linking Domain Connecting the 5 Core Objectives of Health Systems",
            ""
          )}

          <div class="or-stack-col is-s05-stack">
            <div class="or-card is-white is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">1 · Health, Determinants of Health (SDH, CDoH) &amp; Disease Prevention</span><span class="or-mini-chip">HS1</span></div>
              <p class="or-card-text is-s05-text"><strong>1.1</strong> สุขภาพองค์รวม · <strong>1.2</strong> ปัจจัยกำหนดสุขภาพ (<strong>SDH, CDoH</strong>) · <strong>1.3</strong> ระดับการป้องกันโรค (Level of Disease Prevention)</p>
            </div>

            <div class="or-card is-navy-tint is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">2 · ระบบสุขภาพและระบบบริการสุขภาพ (Health Systems &amp; Health Service Systems)</span><span class="or-mini-chip">ST1 · HS2–3, 5–6</span></div>
              <p class="or-card-text is-s05-text"><strong>2.1</strong> ระบบซับซ้อน/คิดเชิงระบบ · <strong>2.2</strong> ระบบบริการ (<code>6BB/6W/PHC/UHC</code>) · <strong>2.3</strong> คุณลักษณะ <code>EQESaRR</code> · <strong>2.4</strong> วิจัยพัฒนาระบบสุขภาพ</p>
            </div>

            <div class="or-card is-amber-tint is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">3 · ศักยภาพชุมชนในการพัฒนาสุขภาพ (Community Potential)</span><span class="or-mini-chip">HS1 · HS5</span></div>
              <p class="or-card-text is-s05-text"><strong>3.1</strong> ความหมายและคุณสมบัติของชุมชน · <strong>3.2</strong> ทุนทางสังคม อสม. และองค์กรท้องถิ่นกับการพัฒนาสุขภาพ</p>
            </div>

            <div class="or-card is-teal-tint is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">4 · การสร้างเสริมสุขภาพ (Health Promotion)</span><span class="or-mini-chip">HS4 · COM-B</span></div>
              <p class="or-card-text is-s05-text"><strong>4.1</strong> แนวคิดสร้างเสริมสุขภาพ · <strong>4.2</strong> กลยุทธ์ Ottawa Charter, HiAP &amp; <code>COM-B</code> · <strong>4.3</strong> เชื่อมโยงกับระบบบริการสุขภาพ</p>
            </div>

            <div class="or-card is-white is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">5 · บทบาทแพทย์ในระบบสุขภาพ (Physician Roles in Health Systems)</span><span class="or-mini-chip">Applying HSS</span></div>
              <p class="or-card-text is-s05-text"><strong>5.1</strong> ภาพรวมบทบาทแพทย์ในระบบสุขภาพ · <strong>5.2</strong> ประยุกต์สมรรถนะ HSS ดูแลผู้ป่วย ครอบครัว และชุมชนร่วมกับทีมสุขภาพ</p>
            </div>
          </div>
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
      title: "เส้นทางการเรียนรู้ 6 สัปดาห์: ปูกรอบคิด → โรงพยาบาลแหล่งฝึก → สังเคราะห์ทีม",
      keyTag: "DESIGN LOGIC",
      keyMessageHtml:
        "สอบ <strong>Epi Exam</strong> ก่อนทำ Survey · สอบ <strong>Health Systems Exam</strong> หลังเห็นระบบจริง · เชื่อมสู่ <strong>Presentation (Health Systems, Epi)</strong> ร่วมกันเป็นทีม",
      notes:
        "พากวาดสายตาภาพรวม 6 สัปดาห์: Phase 1 (W1–W3) เรียนทฤษฎี สอบ Epi Exam 8 ธ.ค. ฝึก SPSS และส่ง SRN 1 ก่อนเดินทาง → Phase 2 (W4) ฝึกภาคสนาม ณ โรงพยาบาลแหล่งฝึก 9 แห่ง (7–9 คืน) → Phase 3 (W5–W6) สอบ Health Systems Exam 22 ธ.ค., ฝึก Systems CLD และ Presentation (Health Systems, Epi) เพื่อแสดงการบรรลุ Learning Objectives ร่วมกันเป็นทีมในวันที่ 29–30 ธ.ค.",
      render: () => `
        <div class="or-top-fig-stack is-s06-stack">
          ${figPlate("orient_s06_roadmap.png", "6-Week Learning Journey: Systems & HSS, Epi Exam, 9 Training Hospitals, Health Systems Exam, Systems CLD, and Presentation (Health Systems, Epi)", "")}

          <div class="or-grid-6 is-s06-grid">
            <div class="or-card is-white is-s06-card">
              <div>
                <span class="or-card-kicker">W1 · 25–27 พ.ย.</span>
                <h3 class="or-card-title is-s06-title">เปิดเลนส์ระบบ &amp; EP</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>25 พ.ย.:</strong> <code>ST1</code> · Global Health</li>
                <li><strong>26 พ.ย.:</strong> <code>HS1</code> + SG #1</li>
                <li><strong>27 พ.ย.:</strong> <code>EP1–3</code> + Ex 1–2</li>
              </ul>
            </div>

            <div class="or-card is-white is-s06-card">
              <div>
                <span class="or-card-kicker">W2 · 30 พ.ย.–4 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">เข้มข้น HS2–6 &amp; EP4–9</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>30 พ.ย.–1 ธ.ค.:</strong> <code>HS2–HS5</code></li>
                <li><strong>2–3 ธ.ค.:</strong> <code>EP4–9</code> Hybrid</li>
                <li><strong>4 ธ.ค.:</strong> <code>HS6</code> + SG #2</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W3 · 8–12 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">Epi Exam · SPSS · ทีม</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>8 ธ.ค.:</strong> <strong>Epi Exam</strong> · SPSS</li>
                <li><strong>9 ธ.ค.:</strong> DHS · <strong>ส่ง SRN 1</strong></li>
                <li><strong>9–12 ธ.ค.:</strong> SG #4–6 &amp; เดินทาง</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W4 · 9–20 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">โรงพยาบาลแหล่งฝึก 9 แห่ง</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li>ฝังตัวเรียนรู้จริง <strong>7–9 คืน</strong></li>
                <li>เชื่อมโยง 5 วัตถุประสงค์ระบบฯ</li>
                <li>เก็บ Survey · Feedback SRN1</li>
              </ul>
            </div>

            <div class="or-card is-navy-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W5 · 21–25 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">Health Systems Exam</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>21 ธ.ค.:</strong> SDL โน้ต A4</li>
                <li><strong>22 ธ.ค.:</strong> <strong>HS Exam</strong> · CLD</li>
                <li><strong>23–25 ธ.ค.:</strong> 6BB · Policy · SG</li>
              </ul>
            </div>

            <div class="or-card is-rose-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W6 · 28–30 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">Team Presentation</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>28 ธ.ค.:</strong> SG #11–12 ซ้อมทีม</li>
                <li><strong>29 ธ.ค.:</strong> <strong>HS: Connect 5 Dots</strong></li>
                <li><strong>30 ธ.ค.:</strong> <strong>Epi (4A) · SRN 2</strong></li>
              </ul>
            </div>
          </div>
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
      title: "สถาปัตยกรรมหมวดระบบสุขภาพ: Guided Learning 5 ขั้น × 6 เวทีคิดเชิงระบบ",
      keyTag: "LINKING DOMAIN MASTERY",
      keyMessageHtml:
        "ปูฐานความรู้สู่ <strong>โน้ต A4 สอบ Health Systems Exam</strong> และสร้างสมรรถนะ <strong>Systems Thinking</strong> เพื่อ <strong>Connecting the Dots</strong> ในเวที 3A",
      notes:
        "อธิบายเส้นทาง 5 ขั้นตอนของ ST1 และ HS1–HS6 ควบคู่กับ 6 เวทีคิดเชิงระบบ (18.5 ชม.) ซึ่งทำหน้าที่สร้างสมรรถนะ Systems Thinking (Linking Domain) เพื่อให้ทีมสามารถ Connecting the Dots ทั้ง 5 วัตถุประสงค์ใน Presentation (Health Systems) ฟอร์ม 3A",
      render: () => `
        <div class="or-top-fig-stack is-s07-stack">
          ${figPlate("orient_s07_guided_flow.png", "5-Step Guided Learning Flow and Systems Thinking & Policy Panels", "")}

          <div class="or-infog-split is-even is-full-h">
            <div class="or-card is-navy-tint is-vcenter">
              <span class="or-card-kicker">5-STEP GUIDED LEARNING (ST1 &amp; HS1–HS6)</span>
              <h3 class="or-card-title">จากอ่านล่วงหน้า สู่ถกโจทย์ Contrasting Cases</h3>
              <ul class="or-list is-s07-list">
                <li><strong>① ฉบับเต็ม &amp; ② ฉบับย่อ:</strong> อ่านแนวคิดหลัก ตอบคำถามนำก่อนเข้าเรียน เชื่อม 5 วัตถุประสงค์</li>
                <li><strong>③ Self-Quiz 66 ข้อ &amp; คำศัพท์ 125 คำ:</strong> ฝึกดึงความรู้ (Active Recall) แบบ Formative</li>
                <li><strong>④ บรรยาย 1 ชม. (<code>2C2-03</code>) &rarr; ⑤ Case 6 กลุ่มย่อย (<code>1C1-02..07</code>):</strong> สังเคราะห์เชิงระบบ</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint is-vcenter">
              <div>
                <span class="or-card-kicker">6 เวทีสร้าง SYSTEMS THINKING LINKING DOMAIN (18.5 ชม.)</span>
                <p class="or-card-text is-s07-note">ไม่ออกสอบข้อเขียน — ใช้ Connecting the Dots ทั้ง 5 วัตถุประสงค์ในเวที 3A &amp; SRN:</p>
              </div>
              <div class="or-s07-chips-grid">
                <span class="or-mini-chip is-s07-chip">1. ST1 Systems &amp; CAS (25 พ.ย.)</span>
                <span class="or-mini-chip is-s07-chip">2. Global/Planetary Health (25 พ.ย.)</span>
                <span class="or-mini-chip is-s07-chip">3. District Health Systems (9 ธ.ค.)</span>
                <span class="or-mini-chip is-s07-chip">4. CLD &amp; Archetypes (22 ธ.ค.)</span>
                <span class="or-mini-chip is-s07-chip">5. 6BB “สุขภาวะข้างถนน” (23 ธ.ค.)</span>
                <span class="or-mini-chip is-s07-chip">6. Policy &amp; Political Econ (24 ธ.ค.)</span>
              </div>
            </div>
          </div>
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
      title: "หมวดระบาดวิทยา (EP1–EP9): จากหลักฐานเชิงประจักษ์ สู่การสำรวจจริงด้วย SPSS",
      keyTag: "EVIDENCE TO ACTION",
      keyMessageHtml:
        "ความแม่นยำการวินิจฉัยและการคุม <strong>Selection Bias, Information Bias และ Confounding</strong> ทำให้ <strong>ผลสำรวจชุมชนของทีมน่าเชื่อถือจริง</strong>",
      notes:
        "ชี้แจงตารางเรียนระบาดวิทยาทั้ง 4 ช่วง: วันศุกร์ 27 พ.ย. บรรยาย EP1–EP3 เวลา 08.30–11.00 น. (ห้อง 2A01 + Zoom) และหลัง 11.00 น. ทำ Exercise 1–2 แบบ SDL ใน E-learning, วันที่ 2–3 ธ.ค. เรียน Hybrid (ห้อง 2C2-03 + Zoom) และวันอังคาร 8 ธ.ค. เช้าสอบทฤษฎี บ่ายฝึกปฏิบัติการ SPSS",
      render: () => `
        <div class="or-top-fig-stack is-s08-stack">
          ${figPlate("orient_s08_epi_pipeline.png", "4-Stage Clinical and Community Epidemiology Pipeline", "")}

          <div class="or-grid-4 is-s08-grid">
            <div class="or-card is-white is-s08-card">
              <div>
                <span class="or-card-kicker">STAGE 1 · ศ. 27 พ.ย. 69</span>
                <h3 class="or-card-title">EP1–EP3 · Diagnostic &amp; Bias</h3>
              </div>
              <p class="or-card-text"><strong>08.30–11.00</strong> (<code>2A01</code> + Zoom): Sens/Spec/PPV/LR, Bias &amp; Confounding · <strong>หลัง 11.00 ทำ Ex 1–2 (SDL)</strong></p>
            </div>

            <div class="or-card is-white is-s08-card">
              <div>
                <span class="or-card-kicker">STAGE 2 · พ. 2 ธ.ค. 69</span>
                <h3 class="or-card-title">EP4–EP5 · Designs &amp; Outbreak</h3>
              </div>
              <p class="or-card-text"><strong>Hybrid (<code>2C2-03</code> + Zoom):</strong> Cohort, Case-control, RR/OR/AR/PAR &amp; Outbreak Investigation + <strong>Ex 3–4</strong></p>
            </div>

            <div class="or-card is-teal-tint is-s08-card">
              <div>
                <span class="or-card-kicker">STAGE 3 · พฤ. 3 ธ.ค. 69</span>
                <h3 class="or-card-title">EP6–EP9 · Burden &amp; EBM</h3>
              </div>
              <p class="or-card-text"><strong>Hybrid (<code>2C2-03</code> + Zoom):</strong> Incidence/Prevalence/DALYs, Health Survey, RCT Appraisal &amp; PICO + <strong>Ex 5–6</strong></p>
            </div>

            <div class="or-card is-navy-tint is-s08-card">
              <div>
                <span class="or-card-kicker">STAGE 4 · 8 &rarr; 30 ธ.ค. 69</span>
                <h3 class="or-card-title">Exam · SPSS · Presentation</h3>
              </div>
              <p class="or-card-text"><strong>8 ธ.ค.:</strong> เช้า <strong>Epi Exam</strong> · บ่าย <strong>SPSS</strong> &rarr; สำรวจจริงในพื้นที่ &rarr; <strong>Presentation (Epi · 4A)</strong> 30 ธ.ค.</p>
            </div>
          </div>
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
      title: "เรียนรู้จากประสบการณ์จริง (Kolb's Cycle) ณ โรงพยาบาลแหล่งฝึกทั้ง 9 แห่ง",
      keyTag: "SHARED LEARNING",
      keyMessageHtml:
        "เตรียมทีมใน <code>SG 1–6</code> &rarr; ฝังตัวเรียนรู้จริง ณ <strong>โรงพยาบาลแหล่งฝึก 9 แห่ง (7–9 คืน)</strong> &rarr; กลับมาแลกเปลี่ยนให้เห็น <strong>ระบบสุขภาพไทยครบทุกบริบท</strong>",
      notes:
        "แนะนำโรงพยาบาลแหล่งฝึกทั้ง 9 แห่งทั่วภูมิภาค อาจารย์ที่ปรึกษาประจำกลุ่ม ห้องกลุ่มย่อย และกำหนดการเดินทางของแต่ละกลุ่ม พร้อมเชื่อมโยงกับวงจร Kolb's Experiential Learning ทั้ง 4 ขั้นตอน",
      render: () => `
        <div class="or-infog-split is-s09-split">
          <div class="or-s09-left-col">
            <div class="or-s09-fig-grow">
              ${figPlate(
                "orient_s09_kolb_map.png",
                "Kolb's Experiential Learning Cycle around Thailand's 9 Fieldwork Training Hospitals",
                ""
              )}
            </div>
            <div class="or-card is-white is-s09-legend">
              <span class="or-card-kicker">4-COLOR REGIONAL PINS · 9 โรงพยาบาลแหล่งฝึก</span>
              <div class="or-s09-pins-grid">
                <span><span style="color:#009e73">&#9679;</span> อีสาน: กาฬสินธุ์ · เลย · ขอนแก่น</span>
                <span><span style="color:#0072b2">&#9679;</span> เหนือ/ตาก: น่าน · ท่าสองยาง · อุ้มผาง</span>
                <span><span style="color:#d97706">&#9679;</span> เพชรบูรณ์: รพ.เพชรบูรณ์ (1, 2)</span>
                <span><span style="color:#d55e00">&#9679;</span> ภาคใต้: รพ.ตะกั่วป่า จ.พังงา</span>
              </div>
            </div>
          </div>

          <div class="or-table-wrap is-s09-table" data-mobile-scroll-hint="↔ เลื่อนตารางซ้าย–ขวาเพื่อดูห้อง SG และกำหนดการครบทุกคอลัมน์">
            <table class="or-table">
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
      title: "พิมพ์เขียวการวัดผลสัมฤทธิ์ตามสมรรถนะหลัก 5 ด้าน (Formative & Summative)",
      keyTag: "ASSESSMENT PHILOSOPHY",
      keyMessageHtml:
        "แยก <strong>Formative (พื้นที่ปลอดภัยเพื่อฝึกคิดและรับคำแนะนำ)</strong> ออกจาก <strong>Summative (การตัดสินผลตามเกณฑ์มาตรฐาน)</strong> อย่างชัดเจน",
      notes:
        "อธิบายตารางแม่บทการวัดผลสัมฤทธิ์ 4 คอลัมน์ของ RACM 303 ปีการศึกษา 2569: แบ่งเป็นภาคทฤษฎี (สมรรถนะที่ 1: Epi Exam และ Health Systems Exam คิดเกณฑ์ผ่านแยกกัน ≥ 2.00 / O ≥ 3.75) และภาคปฏิบัติในชุมชน (สมรรถนะที่ 2–5 รวมถึง Presentation ทั้ง Health Systems และ Epi เพื่อแสดงการบรรลุ Learning Objectives ร่วมกันเป็นทีม)",
      render: () => `
        <div class="or-infog-split is-s10-split">
          ${figPlate(
            "orient_s10_blueprint_visual.png",
            "Formative Assessment for Growth leading to Summative Assessment for Mastery across 5 Competencies",
            ""
          )}

          <div class="or-table-wrap is-s10-table" data-mobile-scroll-hint="↔ เลื่อนตารางซ้าย–ขวาเพื่อดูเครื่องมือและเกณฑ์ประเมินครบทุกช่อง">
            <table class="or-table">
              <thead>
                <tr>
                  <th style="width:22%">สมรรถนะหลัก 5 ด้าน</th>
                  <th style="width:46%">เครื่องมือวัดผล (Formative &amp; Summative)</th>
                  <th style="width:14%">ผู้ประเมิน</th>
                  <th style="width:18%">เกณฑ์ตัดสินผล</th>
                </tr>
              </thead>
              <tbody>
                <tr class="is-domain-divider"><td colspan="4">ภาคทฤษฎี (Theoretical Domain)</td></tr>
                <tr>
                  <td><strong>1. Knowledge base</strong><br><span class="or-td-sub">ระบบสุขภาพ &amp; ระบาดฯ</span></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> Case Workbook · Self-Quiz 66 ข้อ (<code>ST1, HS1–6</code>) · <code>EP Ex 1–6</code> · <code>SRN 1</code></div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> <strong>Epi Exam</strong> (8 ธ.ค.) · <strong>Health Systems Exam</strong> (Open Note A4 · 22 ธ.ค.)</div>
                  </td>
                  <td>คณาจารย์</td>
                  <td><strong>แยกเกณฑ์ EP &amp; HS:</strong><br>ผ่าน <strong>&ge; 2.00</strong> (<strong>O &ge; 3.75</strong>)</td>
                </tr>

                <tr class="is-domain-divider"><td colspan="4">ภาคปฏิบัติและสมรรถนะวิชาชีพในชุมชน (Practical, Community &amp; Professionalism)</td></tr>
                <tr>
                  <td><strong>2. Communication &amp; Interpersonal</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> แลกเปลี่ยนในกลุ่มย่อย 13 ครั้ง &amp; ซ้อมสื่อสารทีม</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> Peer · <code>ฟอร์ม 1A</code> (ข้อ 1, 3, 4) · <strong>Presentation (HS, Epi)</strong> ทีม (<code>3A/4A</code>)</div>
                  </td>
                  <td>เพื่อน · อ.ที่ปรึกษา</td>
                  <td><strong>O / S / M / U</strong><br><span class="or-td-sub">(บุคคล · ประกอบ 2A)</span></td>
                </tr>
                <tr>
                  <td><strong>3. Community, Pop. &amp; Health System</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> โค้ชเชื่อม 5 วัตถุประสงค์ด้วย Systems Thinking ณ รพ.แหล่งฝึก &amp; Survey</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> <strong>Presentation (HS · 3A)</strong> <strong>Connecting 5 Dots</strong> (ไม่แยกส่วน) &amp; <strong>Epi (4A)</strong> · <code>1A</code></div>
                  </td>
                  <td>คณาจารย์ · เพื่อน</td>
                  <td><strong>O / S / M / U</strong><br><span class="or-td-sub">(3A, 4A ทีม · 1A บุคคล)</span></td>
                </tr>
                <tr>
                  <td><strong>4. Continuous Prof. Development</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> <code>SRN 1</code> (ส่ง 9 ธ.ค. รับ Feedback รายบุคคลช่วงภาคสนาม)</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> <code>SRN 2</code> (ส่ง 30 ธ.ค.) · <code>ฟอร์ม 1A</code> ข้อ 2 ใฝ่รู้พัฒนาตน</div>
                  </td>
                  <td>อ.ที่ปรึกษา · เพื่อน</td>
                  <td><strong>O / S / M / U</strong><br><span class="or-td-sub">(รายบุคคล)</span></td>
                </tr>
                <tr>
                  <td><strong>5. Habits, Attitudes, Moral &amp; Ethics</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> สังเกตและให้ข้อมูลป้อนกลับด้านวินัยและจริยธรรมตลอดรายวิชา</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> GRS <code>ฟอร์ม 1A</code> (ข้อ 6.1–6.3 รับผิดชอบ ซื่อสัตย์ น้ำใจ) &amp; ภาพรวม <code>2A</code></div>
                  </td>
                  <td>อ.ที่ปรึกษา (เพื่อน)</td>
                  <td><strong>O / S / U</strong><br><span class="or-td-sub is-danger">(ได้ U = ลงทะเบียนใหม่)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
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
      title: "เจาะลึกการสอบภาคทฤษฎี: Epi Exam & Health Systems Exam (ToS)",
      keyTag: "STRICT EXAM RULES",
      keyMessageHtml:
        "เกณฑ์ผ่านแยกหมวด <strong>&ge; 2.00 (O &ge; 3.75)</strong> · สายเกิน <strong>15 นาทีห้ามเข้าสอบ</strong> · <strong>งดเครื่องคิดเลข สมาร์ตวอทช์ มือถือ และชีทพิมพ์</strong>",
      notes:
        "เน้นโครงสร้างข้อสอบทั้ง 2 วัน: อังคาร 8 ธ.ค. สอบ Epidemiology Exam แบบ Closed-book และอังคาร 22 ธ.ค. สอบ Health Systems Exam แบบ Open Note (A4 เขียนลายมือตนเอง 1 แผ่น หน้า-หลัง) ตามสัดส่วน Table of Specifications ทั้ง 5 วัตถุประสงค์ของระบบสุขภาพ (20% · 25% · 20% · 20% · 15%)",
      render: () => `
        <div class="or-infog-split is-s11-split">
          ${figPlate(
            "orient_s11_exam_vertical.png",
            "Vertical Comparison of Epidemiology Exam (Closed-Book) and Health Systems Exam (Open-Note A4)",
            ""
          )}

          <div class="or-grid-2 is-s11-grid">
            <div class="or-card is-white is-s11-card">
              <div>
                <span class="or-card-kicker">SUMMATIVE 2.1 · อ. 8 ธ.ค. 69 (09.00–12.00)</span>
                <h3 class="or-card-title">Epidemiology Exam (Closed-Book)</h3>
                <p class="or-card-text is-s11-sub">ห้อง <code>2C2-02, 2C2-03</code> · <code>EP1–EP9</code> (รวม 100%)</p>
              </div>
              <div class="or-stat-bar-list is-s11-bars">
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><code>EP2</code> Diagnostic · <code>EP3</code> Errors</span><span>15% + 15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:75%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><code>EP5</code> Outbreak · <code>EP6</code> Burden</span><span>15% + 15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:75%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><code>EP8</code> Experimental (RCT Appraisal)</span><span>15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:55%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><code>EP4</code> Designs &amp; Impact (AR/PAR)</span><span>10%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:40%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><code>EP7</code> Health Survey · <code>EP9</code> EBM</span><span>7.5% + 7.5%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:55%"></div></div></div>
              </div>
              <div class="or-s11-foot-badge is-blue">
                Closed-Book 100% · ผ่านหมวด EP &ge; 2.00 (ได้ O เมื่อ &ge; 3.75)
              </div>
            </div>

            <div class="or-card is-navy-tint is-s11-card">
              <div>
                <span class="or-card-kicker">SUMMATIVE 2.2 · อ. 22 ธ.ค. 69 (09.00–12.00)</span>
                <h3 class="or-card-title">Health Systems Exam (Open Note A4)</h3>
                <p class="or-card-text is-s11-sub is-teal-sub">ห้อง <code>2C2-01..03</code> · <strong>5 วัตถุประสงค์ระบบสุขภาพ</strong> (รวม 100%)</p>
              </div>
              <div class="or-stat-bar-list is-s11-bars">
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><strong>1.</strong> Health, SDH/CDoH &amp; Prevention (<code>HS1</code>)</span><span>20%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:76%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><strong>2.</strong> Health Service Systems &amp; <code>EQESaRR</code></span><span>25%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:94%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><strong>3.</strong> ศักยภาพชุมชนในการพัฒนาสุขภาพ</span><span>20%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:76%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><strong>4.</strong> การสร้างเสริมสุขภาพ (<code>HS4</code> · <code>COM-B</code>)</span><span>20%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:76%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><strong>5.</strong> Physician Roles in Health Systems</span><span>15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:58%"></div></div></div>
              </div>
              <div class="or-s11-foot-badge is-teal">
                อนุญาต A4 เขียนลายมือตนเอง 1 แผ่น (หน้า-หลัง) · ห้ามพิมพ์/ถ่ายเอกสาร
              </div>
            </div>
          </div>
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
      kicker: "03 · COMPETENCIES 2–5 · TEAM PRESENTATION, REFLECTION & INTEGRITY",
      title: "เจาะลึกการประเมินภาคปฏิบัติ: Team Presentation, สะท้อนคิด และเจตคติ",
      keyTag: "CONNECT 5 DOTS · NOT SILOED",
      keyMessageHtml:
        "<strong>Presentation (Health Systems · 3A)</strong> ไม่แบ่งหัวข้อเล่าแยกส่วน แต่ทั้งทีมใช้ <strong>Systems Thinking เชื่อมจุดทั้ง 5 วัตถุประสงค์</strong> ให้เห็นระบบจริง",
      notes:
        "ย้ำความคาดหวังของเวที Presentation (Health Systems · ฟอร์ม 3A · 10+20 นาที): ไม่ใช่การแบ่งหัวข้อเล่าแยกส่วนทีละวัตถุประสงค์ แต่เน้นสมรรถนะ Systems Thinking เป็น Linking Domain ที่ร้อยเรียงทั้ง 5 วัตถุประสงค์ให้เห็นพลวัตของระบบสุขภาพในพื้นที่จริง ควบคู่กับ Presentation (Epi · ฟอร์ม 4A · 7+18 นาที), SRN 1–2 และฟอร์ม 1A/2A",
      render: () => `
        <div class="or-grid-3 is-s12-grid">
          <div class="or-card is-teal-tint or-visual-pillar-card">
            <div class="or-visual-pillar-img-box">
              <img src="${IMG_DIR}/orient_s12_col1.png?v=${ASSET_VER}" alt="Reflective Growth SRN 1 and SRN 2 with Advisor Feedback" loading="eager" decoding="async" />
            </div>
            <div class="or-visual-pillar-copy">
              <span class="or-card-kicker">1 · COMPETENCY 4 · รายบุคคล</span>
              <h3 class="or-card-title">Reflective Growth (SRN 1 &rarr; 2)</h3>
              <ul class="or-list is-s12-list">
                <li><strong><code>SRN 1</code> (Formative):</strong> พ. <strong>9 ธ.ค. (&le;17.00)</strong> รับ Feedback อ.ที่ปรึกษา</li>
                <li><strong><code>SRN 2</code> (Summative):</strong> พ. <strong>30 ธ.ค. (&le;17.00)</strong> E-learning</li>
                <li><strong>รูปแบบ:</strong> PDF <strong>&le; 5 หน้า A4</strong> (<code>TH Sarabun New 16pt</code>)</li>
              </ul>
            </div>
          </div>

          <div class="or-card is-navy-tint or-visual-pillar-card">
            <div class="or-visual-pillar-img-box">
              <img src="${IMG_DIR}/orient_s12_col2.png?v=${ASSET_VER}" alt="Team Presentation Connecting 5 Dots via Systems Thinking Linking Domain" loading="eager" decoding="async" />
            </div>
            <div class="or-visual-pillar-copy">
              <span class="or-card-kicker">2 · PRESENTATION (HS, EPI) · AS A TEAM</span>
              <h3 class="or-card-title">Connecting 5 Dots as a Team</h3>
              <ul class="or-list is-s12-list">
                <li><strong>Health Systems (3A · 29 ธ.ค. · 10+20 น.):</strong> ใช้ <strong>Systems Thinking</strong> เชื่อม 5 วัตถุประสงค์ (ไม่เล่าแยกส่วน)</li>
                <li><strong>Epi (4A · 30 ธ.ค. · 7+18 น.):</strong> วิจัย 1 เรื่อง (งด VDO อัดล่วงหน้า)</li>
              </ul>
            </div>
          </div>

          <div class="or-card is-amber-tint or-visual-pillar-card">
            <div class="or-visual-pillar-img-box">
              <img src="${IMG_DIR}/orient_s12_col3.png?v=${ASSET_VER}" alt="Professional Integrity Forms 1A and 2A" loading="eager" decoding="async" />
            </div>
            <div class="or-visual-pillar-copy">
              <span class="or-card-kicker">3 · COMPETENCY 2 &amp; 5 · รายบุคคล</span>
              <h3 class="or-card-title">Integrity &amp; Attitude (1A &amp; 2A)</h3>
              <ul class="or-list is-s12-list">
                <li><strong>ฟอร์ม 1A (GRS):</strong> อ่อนน้อม · ใฝ่รู้ · ทีม · รับผิดชอบ · <strong>ซื่อสัตย์ (ไม่เมคข้อมูล/ไม่ลอก/ไม่เซ็นแทน)</strong> · น้ำใจ</li>
                <li><strong>Peer + ฟอร์ม 2A:</strong> สรุปภาพรวมเจตคติ <strong>O / S / U</strong></li>
              </ul>
            </div>
          </div>
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
      title: "เกณฑ์ตัดสินเกรดสุดท้าย (O / S / U) การสอบซ่อม และ 7 กำหนดการสำคัญ",
      keyTag: "KEY REMINDER",
      keyMessageHtml:
        "ก่อนส่ง <code>SRN 1</code> (9 ธ.ค.) และ <code>SRN 2</code> (30 ธ.ค.) ในระบบ E-learning ต้องทำ <strong>แบบประเมินการสอนและแบบประเมินรายวิชา</strong> ให้ครบถ้วน",
      notes:
        "สรุปกติกาตัดเกรดรายวิชา: (1) เกรด O ต้องได้ ≥ 3.75 ทั้ง Epi Exam และ Health Systems Exam + ฟอร์ม 2A ได้ O + ไม่เคยสอบซ่อม, (2) เกรด S เมื่อผ่านทั้ง EP และ HS (≥ 2.00) และฟอร์ม 2A ไม่เป็น U, (3) หากหมวดใด < 2.00 สอบซ่อมเฉพาะหมวดนั้นได้ 1 ครั้ง ผ่านได้ S (มีผลต่อเกียรตินิยม), (4) ลงทะเบียนเรียนใหม่เมื่อซ่อมไม่ผ่าน หรือฟอร์ม 2A ได้ U",
      render: () => `
        <div class="or-top-fig-stack is-s13-stack">
          ${figPlate(
            "orient_s13_grading_flow.png",
            "Final Grade Criteria Flow: Grade O (Outstanding), Grade S (Satisfactory), and Retest or Grade U",
            ""
          )}

          <div class="or-infog-split is-s13-bottom">
            <div class="or-stack-col">
              <div class="or-card is-teal-tint">
                <span class="or-card-kicker">เกรดดีเยี่ยม (O) &amp; เกรดผ่านมาตรฐาน (S)</span>
                <ul class="or-list is-s13-list">
                  <li><strong>เกรด O:</strong> ได้ <strong>&ge; 3.75</strong> ทั้ง Epi &amp; HS Exam + <strong>2A ได้ O</strong> + <strong>ไม่เคยสอบซ่อม</strong></li>
                  <li><strong>เกรด S:</strong> สอบผ่านทั้งสองหมวด (<strong>&ge; 2.00</strong>) และ <strong>ฟอร์ม 2A ได้ O หรือ S</strong></li>
                </ul>
              </div>

              <div class="or-card is-rose-tint">
                <span class="or-card-kicker">การสอบซ่อมแยกหมวด &amp; ลงทะเบียนเรียนใหม่ (U)</span>
                <ul class="or-list is-s13-list">
                  <li><strong>สอบซ่อม 1 ครั้ง:</strong> หมวดที่ <strong>&lt; 2.00</strong> ผ่านได้ <strong>S</strong> <em>(มีผลต่อเกียรตินิยม)</em></li>
                  <li><strong>ลงทะเบียนใหม่:</strong> ซ่อมไม่ผ่าน หรือ <strong>ฟอร์ม 2A ได้ U</strong></li>
                </ul>
              </div>
            </div>

            <div class="or-table-wrap is-s13-table">
              <table class="or-table">
                <thead>
                  <tr><th>7 กำหนดการสอบ &amp; ส่งงานสำคัญ</th><th>วัน – เวลา &amp; ช่องทาง</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>1. Epidemiology Exam (EP1–9)</strong></td><td>อ. 8 ธ.ค. 69 (09.00–12.00) · <code>2C2-02..03</code></td></tr>
                  <tr><td><strong>2. ส่ง SRN 1</strong> + ประเมินภาคทฤษฎี</td><td>พ. 9 ธ.ค. 69 (&le; 17.00 น.) · E-learning</td></tr>
                  <tr><td><strong>3. Health Systems Exam (Open Note)</strong></td><td>อ. 22 ธ.ค. 69 (09.00–12.00) · <code>2C2-01..03</code></td></tr>
                  <tr><td><strong>4. Presentation: Health Systems (3A)</strong></td><td>อ. 29 ธ.ค. 69 (08.30–15.30) · <code>2C2-03</code></td></tr>
                  <tr><td><strong>5. Presentation: Epi (Team · 4A)</strong></td><td>พ. 30 ธ.ค. 69 (08.30–12.45) · <code>2C2-03</code></td></tr>
                  <tr><td><strong>6. ส่ง SRN 2</strong> + ประเมินรายวิชา</td><td>พ. 30 ธ.ค. 69 (&le; 17.00 น.) · E-learning</td></tr>
                  <tr><td><strong>7. ส่งสไลด์นำเสนอ &amp; Health Survey</strong></td><td>พ. 30 ธ.ค. 69 (&le; 17.00 น.) · Google Form</td></tr>
                </tbody>
              </table>
            </div>
          </div>
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
      title: "วินัยเวลาเรียน โควตาการลา และเกราะความปลอดภัยภาคสนาม 6 ข้อ",
      keyTag: "ZERO ACCIDENT GOAL",
      keyMessageHtml:
        "กฎเหล็กทั้ง 6 ข้อมีไว้เพื่อดูแลให้ <strong>นักศึกษาแพทย์ทั้ง 169 คนไปเรียนรู้ร่วมกับชุมชนและกลับถึงรามาธิบดีอย่างปลอดภัย 100%</strong>",
      notes:
        "ย้ำเกณฑ์ลงชื่อเข้าเรียน (-15 ถึง +15 นาที) เวลาเรียนรวม ≥ 80% โควตาการลา (ก่อน+หลังภาคสนาม ≤ 3 วัน, ช่วงภาคสนาม ≤ 1.5 วัน) และระเบียบปฏิบัติงานนอกสถานที่ พ.ศ. 2561 ทั้ง 6 ข้อ",
      render: () => `
        <div class="or-infog-split is-s14-split">
          <div class="or-schematic-box is-s14-left">
            <div>
              <span class="or-card-kicker">SIGN-IN WINDOW &amp; LEAVE QUOTAS</span>
              <h3 class="or-card-title">กติกาเวลาเรียนและการยื่นใบลา</h3>
            </div>

            <div>
              <div class="or-s14-subhead">หน้าต่างเวลาลงชื่อเข้าเรียนในแต่ละคาบ</div>
              <div class="or-s14-signin-bar">
                <div class="is-open">-15 น. เปิดลงชื่อ</div>
                <div class="is-norm">00–15 น. ปกติ</div>
                <div class="is-late">&gt; +15 น. สาย</div>
              </div>
            </div>

            <div class="or-stat-bar-list is-s14-bars">
              <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span>เวลาเรียนรวมตลอดรายวิชา (สิทธิ์สอบ)</span><span>&ge; 80%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:80%"></div></div></div>
              <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span>โควตาลาก่อน + หลังภาคสนามรวมกัน</span><span>&le; 3.0 วัน</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-amber" style="width:45%"></div></div></div>
              <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span>โควตาลาช่วงฝึกปฏิบัติงานภาคสนาม</span><span>&le; 1.5 วัน</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-crimson" style="width:24%"></div></div></div>
            </div>

            <div class="or-card is-amber-tint is-s14-note">
              <p class="or-card-text"><strong>การลา:</strong> ยื่นล่วงหน้าเป็นลายลักษณ์อักษร (หรือผ่าน Portal) และได้รับอนุญาตจาก อ.ที่ปรึกษาก่อนเสมอ (ป่วยกะทันหันในพื้นที่ แจ้งทันที)</p>
            </div>
          </div>

          <div class="or-s14-right-stack">
            ${figPlate("orient_s14_safety_shields.png", "6 Fieldwork Safety and Professionalism Shields", "")}
            <div class="or-card is-white is-s14-shield-note">
              <p class="or-card-text">
                <strong>ระเบียบ พ.ศ. 2561:</strong> (1) <strong>ห้ามนำรถส่วนตัวไปใช้</strong> · (2) <strong>ห้ามออกนอกเขต/ไปลำพัง</strong> · (3) งดคนนอกเยี่ยม · (4) แต่งกายสุภาพติดป้ายชื่อ · (5) <strong>งดแอลกอฮอล์ สารเสพติด พนัน</strong> · (6) ระวังโซเชียลมีเดีย
              </p>
            </div>
          </div>
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
      title: "ระบบนิเวศดิจิทัล RACM 303 และ 4 ก้าวแรกของสัปดาห์ที่ 1",
      keyTag: "UP NEXT · 09.30 น.",
      keyMessageHtml:
        "ยินดีต้อนรับสู่ <strong>RACM 303 ปีการศึกษา 2569</strong> — ซิงค์ปฏิทินเข้ามือถือแล้วก้าวสู่คาบแรก <code>ST1</code> เวลา <strong>09.30 น.</strong>!",
      notes:
        "สรุปปิดท้ายคาบปฐมนิเทศ: แนะนำ 3 แพลตฟอร์มดิจิทัลหลัก ย้ำให้นักศึกษาผูกชื่อ/กลุ่มเพื่อซิงค์ปฏิทิน .ics เข้ามือถือ เตรียมอ่าน HS1 เย็นนี้สำหรับพรุ่งนี้เช้า และส่งต่อเวทีเข้าสู่คาบ ST1: Systems & Systems Thinking เวลา 09.30 น. ณ ห้อง 2C2-03",
      render: () => `
        <div class="or-infog-split is-fig-left">
          <div class="or-s15-left-stack">
            ${figPlate("orient_s15_digital_hub.png", "RACM 303 Connected Digital Learning Hub", "")}
            <div class="or-card is-navy-tint is-s15-hub-note">
              <p class="or-card-text">
                <strong>1. Smart Portal:</strong> ตารางเฉพาะกลุ่ม · ปฏิทิน <code>.ics</code> · บทเรียน 5 ขั้น · Zoom · ใบลา<br>
                <strong>2. RAMA E-learning (<code>id=398</code>):</strong> แบบฝึกหัด SDL ระบาดฯ &amp; ส่ง <code>SRN 1–2</code><br>
                <strong>3. Google Form 2569:</strong> ส่งสไลด์ <code>3A/4A</code> &amp; แบบสอบถาม Health Survey
              </p>
            </div>
          </div>

          <div class="or-inspector-box is-teal is-s15-right">
            <div>
              <span class="or-card-kicker">WEEK 1 ACTION PLAN · เริ่มต้นทันทีวันนี้!</span>
              <h3 class="or-card-title">4 ก้าวแรกของสัปดาห์ที่ 1</h3>
            </div>

            <div class="or-stack-col is-s15-steps">
              <div class="or-card is-white is-s15-step">
                <span class="or-card-kicker">① วันนี้ · 09.30 – 12.00 น. (ห้อง 2C2-03)</span>
                <p class="or-card-text"><strong>เรียนต่อเนื่องคาบแรก <code>ST1</code>: Systems &amp; Systems Thinking</strong></p>
              </div>
              <div class="or-card is-white is-s15-step">
                <span class="or-card-kicker">② วันนี้ · 13.00 – 16.00 น. (ห้อง 2C2-03)</span>
                <p class="or-card-text"><strong>เสวนา Bedside to Systems-Based Practice: Global/Planetary Health &amp; HPSR</strong></p>
              </div>
              <div class="or-card is-white is-s15-step">
                <span class="or-card-kicker">③ เย็นวันนี้ · เตรียมพร้อมก่อนเข้าเรียนพรุ่งนี้</span>
                <p class="or-card-text"><strong>อ่านบทเรียนและตอบคำถามนำ Pre-class <code>HS1</code> (พรุ่งนี้ 08.30 น. &rarr; 6 กลุ่มย่อย 09.40 น.)</strong></p>
              </div>
              <div class="or-card is-white is-s15-step">
                <span class="or-card-kicker">④ พฤหัสบดี 26 พ.ย. · 13.00 – 16.30 น.</span>
                <p class="or-card-text"><strong>พบอาจารย์ที่ปรึกษาประจำกลุ่มโรงพยาบาลแหล่งฝึกทั้ง 9 แห่ง ในกลุ่มย่อย ครั้งที่ 1</strong></p>
              </div>
            </div>
          </div>
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
    if (state.viewMode !== "deck") {
      state.viewMode = "deck";
    }
    state.autoPlay = !state.autoPlay;
    state.toolsMenuOpen = false;
    if (state.autoPlay && state.slideIdx >= SLIDES.length - 1) {
      state.slideIdx = 0;
    }
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
        document.querySelectorAll("[data-or-timer-display]").forEach((btn) => {
          btn.textContent = formatTimer(state.timerSeconds);
          btn.classList.toggle("is-running", state.timerRunning && state.timerSeconds <= 1800);
          btn.classList.toggle("is-overtime", state.timerSeconds > 1800);
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

  function animateCoverKpis(rootEl) {
    if (!rootEl || state.viewMode !== "deck") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = rootEl.querySelectorAll("[data-count-to]");
    els.forEach((el) => {
      const target = Number(el.getAttribute("data-count-to")) || 0;
      if (!target) return;
      const start = performance.now();
      const dur = 680;
      function step(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = String(target);
        }
      }
      requestAnimationFrame(step);
    });
  }

  function renderCoverSlideHtml(slide) {
    return `
      <div class="or-cover-stage">
        <div class="or-cover-top">
          <span class="or-cover-dept">ภาควิชาเวชศาสตร์ชุมชน · คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล</span>
          <span class="or-cover-code-chip">RACM 303 · ปีการศึกษา 2569</span>
        </div>

        <div class="or-cover-split">
          <div class="or-cover-left-col">
            <div class="or-cover-head-stack">
              <span class="or-cover-kicker">COURSE ORIENTATION · วันพุธที่ 25 พฤศจิกายน 2569 · 09.00 – 09.30 น.</span>
              <h2 class="or-cover-h1">${esc(slide.title)}</h2>
              <div class="or-top-key-banner is-cover-key">
                <span class="or-top-key-pill">${esc(slide.keyTag || "KEY TAKEAWAY")}</span>
                <span class="or-top-key-text">${slide.keyMessageHtml}</span>
              </div>
            </div>

            <div class="or-cover-kpi-row">
              <div class="or-cover-kpi">
                <span class="or-cover-kpi-val" data-count-to="169">169</span>
                <span class="or-cover-kpi-lbl">นศพ. ชั้นปีที่ 3</span>
              </div>
              <div class="or-cover-kpi">
                <span class="or-cover-kpi-val" data-count-to="6">6</span>
                <span class="or-cover-kpi-lbl">สัปดาห์การเรียนรู้</span>
              </div>
              <div class="or-cover-kpi">
                <span class="or-cover-kpi-val" data-count-to="9">9</span>
                <span class="or-cover-kpi-lbl">โรงพยาบาลแหล่งฝึก</span>
              </div>
              <div class="or-cover-kpi">
                <span class="or-cover-kpi-val" data-count-to="5">5</span>
                <span class="or-cover-kpi-lbl">สมรรถนะหลัก</span>
              </div>
            </div>

            <div class="or-cover-acts-grid">
              <div class="or-cover-act-chip"><strong class="is-gold">Act I · Why HSS:</strong> เสาหลักที่ 3 &amp; 5 วัตถุประสงค์</div>
              <div class="or-cover-act-chip"><strong class="is-mint">Act II · Journey:</strong> 6 สัปดาห์ &amp; 9 โรงพยาบาลแหล่งฝึก</div>
              <div class="or-cover-act-chip"><strong class="is-sky">Act III · Mastery:</strong> วัดผล 5 สมรรถนะ (Formative/Summative)</div>
              <div class="or-cover-act-chip"><strong class="is-rose">Act IV · Launch:</strong> 6 กฎเหล็กปลอดภัย &amp; ก้าวแรกวันนี้</div>
            </div>
          </div>

          <div class="or-cover-right-col">
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

  function renderSingleSlideCanvasHtml(slide, idx, animateDeck) {
    const animCls = animateDeck ? " is-keynote-animated" : "";
    if (slide.isCover) {
      return `
        <article class="or-slide-canvas is-cover-canvas${animCls}" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
          ${renderCoverSlideHtml(slide)}
        </article>
      `;
    }
    return `
      <article class="or-slide-canvas${animCls}" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
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
              <span class="or-top-key-pill">${esc(slide.keyTag || "KEY TAKEAWAY")}</span>
              <span class="or-top-key-text">${slide.keyMessageHtml}</span>
            </div>
          </header>
          <div class="or-sld-body">
            ${slide.render()}
          </div>
        </div>
        <footer class="or-sld-foot">
          <span class="or-sld-foot-course">RACM 303 (ปีการศึกษา 2569) · Orientation to Community Medicine &amp; Health Systems Science</span>
          <span class="or-sld-foot-num">Slide ${idx + 1} / ${SLIDES.length}</span>
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
        return;
      }
      if (state.toolsMenuOpen && !ev.target.closest(".or-tools-menu-wrap")) {
        state.toolsMenuOpen = false;
        const pop = modal.querySelector(".or-tools-popover");
        if (pop) pop.hidden = true;
      }
    });

    // Touch swipe left/right for phones, foldables, and tablets
    let touchStartX = 0;
    let touchStartY = 0;
    let ignoreSwipe = false;
    modal.addEventListener(
      "touchstart",
      (ev) => {
        if (!state.isOpen || state.viewMode !== "deck" || !ev.touches || ev.touches.length !== 1) return;
        const t0 = ev.touches[0];
        touchStartX = t0.clientX;
        touchStartY = t0.clientY;
        const inScrollTable = ev.target && ev.target.closest && ev.target.closest(".or-table-wrap, .or-filmstrip, .or-tools-popover");
        ignoreSwipe = !!inScrollTable;
      },
      { passive: true }
    );

    modal.addEventListener(
      "touchend",
      (ev) => {
        if (!state.isOpen || state.viewMode !== "deck" || ignoreSwipe || !ev.changedTouches || !ev.changedTouches.length) return;
        const t1 = ev.changedTouches[0];
        const dx = t1.clientX - touchStartX;
        const dy = t1.clientY - touchStartY;
        if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(dy) * 1.45) {
          state.autoPlay = false;
          if (dx < 0 && state.slideIdx < SLIDES.length - 1) {
            goToSlide(state.slideIdx + 1);
          } else if (dx > 0 && state.slideIdx > 0) {
            goToSlide(state.slideIdx - 1);
          }
        }
      },
      { passive: true }
    );

    document.addEventListener("keydown", (ev) => {
      if (!state.isOpen || modal.hidden) return;
      const tag = (ev.target && ev.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (ev.key === "Escape") {
        ev.preventDefault();
        if (state.toolsMenuOpen) {
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
      } else if (ev.key === "Home") {
        if (state.viewMode === "deck") {
          ev.preventDefault();
          state.autoPlay = false;
          goToSlide(0);
        }
      } else if (ev.key === "End") {
        if (state.viewMode === "deck") {
          ev.preventDefault();
          state.autoPlay = false;
          goToSlide(SLIDES.length - 1);
        }
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
    state.autoPlay = false;
    state.toolsMenuOpen = false;
    clearAutoPlayTimer();
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
    state.toolsMenuOpen = false;
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
    state.toolsMenuOpen = false;
    renderModal();
    const vp = document.getElementById("orDeckViewport");
    if (vp) vp.scrollTop = 0;
  }

  function renderModal() {
    const modal = ensureModalElement();
    if (!state.isOpen) {
      clearAutoPlayTimer();
      document.body.classList.remove("orient-deck-open");
      modal.hidden = true;
      return;
    }
    document.body.classList.add("orient-deck-open");
    modal.hidden = false;
    modal.classList.toggle("is-presentation-mode", state.presentationMode);

    const cur = SLIDES[state.slideIdx] || SLIDES[0];
    const showNotesNow = state.viewMode === "deck" && state.showNotes;
    const notesLabel = ROLE === "faculty" ? t("โน้ตผู้สอน", "Presenter Notes") : t("คำอธิบายสไลด์", "Slide Notes");

    let viewportHtml = "";
    if (state.viewMode === "deck") {
      viewportHtml = `
        ${state.autoPlay ? `<div class="or-autoplay-progress" aria-hidden="true"></div>` : ""}
        <div class="or-slide-frame-wrap">
          ${renderSingleSlideCanvasHtml(cur, state.slideIdx, true)}
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
          ${SLIDES.map((s, i) => renderSingleSlideCanvasHtml(s, i, false)).join("")}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="or-deck-shell${showNotesNow ? " has-notes-open" : ""}">
        <div class="or-deck-topbar">
          <div class="or-top-left">
            <span class="or-code-pill">ORIENT</span>
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
            <button type="button" class="or-mode-btn${state.viewMode === "deck" ? " is-active" : ""}" data-or-vmode="deck">${SVG.slides} <span>Slide</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "sorter" ? " is-active" : ""}" data-or-vmode="sorter">${SVG.grid} <span>Sorter (${SLIDES.length})</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "handout" ? " is-active" : ""}" data-or-vmode="handout">${SVG.handout} <span>Handout</span></button>
          </div>

          <div class="or-top-right">
            <div class="or-desktop-tools">
              ${
                ROLE === "faculty"
                  ? `<button type="button" class="or-timer-pill${state.timerRunning && state.timerSeconds <= 1800 ? " is-running" : ""}${state.timerSeconds > 1800 ? " is-overtime" : ""}" id="orTimerBtn" data-or-timer-display title="คลิกเพื่อเริ่ม/หยุดจับเวลาคาบปฐมนิเทศ 30 นาที (ดับเบิลคลิกเพื่อรีเซ็ต)">${formatTimer(state.timerSeconds)}</button>`
                  : ""
              }
              <button type="button" class="or-tool-btn${state.autoPlay ? " is-active-toggle" : ""}" id="orAutoPlayBtn" title="เล่นสไลด์อัตโนมัติแบบ Keynote Reel (กด P)">${state.autoPlay ? SVG.pause : SVG.play} <span>${esc(
                state.autoPlay ? t("หยุดเล่น", "Pause") : t("Auto-Play", "Auto-Play")
              )}</span></button>
              <button type="button" class="or-tool-btn${state.showNotes ? " is-active-toggle" : ""}" id="orToggleNotesBtn" title="เปิด/ปิดโน้ตผู้สอน (กด N)">${SVG.notes} <span>${esc(notesLabel)}</span></button>
              <a class="or-tool-btn" href="${PPTX_HREF}" download="RACM303_2569_Orientation_Slides.pptx" title="ดาวน์โหลดไฟล์ PowerPoint (.pptx) อัตราส่วน 16:9 แก้ไขได้">${SVG.download} <span>.pptx</span></a>
              <a class="or-tool-btn" href="${PDF_HREF}" download="RACM303_2569_Orientation_Slides.pdf" title="ดาวน์โหลดไฟล์สไลด์ PDF 16:9 คมชัดสูง">${SVG.download} <span>PDF</span></a>
              <button type="button" class="or-tool-btn" id="orPrintBtn" title="สั่งพิมพ์เอกสารประกอบสไลด์ 16:9">${SVG.print} <span>${esc(t("พิมพ์", "Print"))}</span></button>
            </div>

            <div class="or-tools-menu-wrap">
              <button type="button" class="or-tool-btn or-compact-more-btn${state.toolsMenuOpen || state.autoPlay || state.showNotes ? " is-active-toggle" : ""}" id="orMoreToolsBtn" aria-expanded="${state.toolsMenuOpen ? "true" : "false"}" title="เครื่องมือสไลด์เพิ่มเติม">${SVG.more}</button>
              <div class="or-tools-popover" ${state.toolsMenuOpen ? "" : "hidden"}>
                ${
                  ROLE === "faculty"
                    ? `<button type="button" class="or-pop-item" id="orPopTimerBtn" data-or-timer-display>${formatTimer(state.timerSeconds)}</button>`
                    : ""
                }
                <button type="button" class="or-pop-item${state.autoPlay ? " is-active" : ""}" id="orPopAutoPlayBtn">${state.autoPlay ? SVG.pause : SVG.play} <span>${esc(
                  state.autoPlay ? t("หยุดเล่นอัตโนมัติ", "Pause Auto-Play") : t("เล่นอัตโนมัติ (Auto-Play)", "Auto-Play Reel")
                )}</span></button>
                <button type="button" class="or-pop-item${state.showNotes ? " is-active" : ""}" id="orPopNotesBtn">${SVG.notes} <span>${esc(notesLabel)}</span></button>
                <a class="or-pop-item" href="${PPTX_HREF}" download="RACM303_2569_Orientation_Slides.pptx">${SVG.download} <span>ดาวน์โหลด PowerPoint (.pptx)</span></a>
                <a class="or-pop-item" href="${PDF_HREF}" download="RACM303_2569_Orientation_Slides.pdf">${SVG.download} <span>ดาวน์โหลดสไลด์ PDF</span></a>
                <button type="button" class="or-pop-item" id="orPopPrintBtn">${SVG.print} <span>${esc(t("สั่งพิมพ์ (Print)", "Print Handout"))}</span></button>
              </div>
            </div>

            <button type="button" class="or-tool-btn is-primary or-present-btn" id="orPresentBtn" title="นำเสนอเต็มจอ (กด F)">${SVG.fullscreen} <span class="or-present-lbl">${esc(
              state.presentationMode ? t("ออกเต็มจอ", "Exit") : t("เต็มจอ", "Present")
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
            <button type="button" class="or-tool-btn or-laser-toggle${state.laserActive ? " is-active-toggle" : ""}" id="orLaserBtn" title="เปิด/ปิดจุดชี้เลเซอร์บนสไลด์ (กด L)">Laser (L)</button>
          </div>
        `
            : ""
        }

        ${
          state.viewMode === "deck"
            ? `
          <div class="or-deck-bottombar">
            <div class="or-nav-cluster">
              <button type="button" class="or-tool-btn or-prevnext-btn" id="orPrevBtn" ${state.slideIdx === 0 ? "disabled" : ""}>&larr; <span class="or-nav-word">${esc(t("ก่อนหน้า", "Prev"))}</span></button>
              <select class="or-slide-select" id="orSlideSelect" aria-label="เลือกสไลด์">
                ${SLIDES.map(
                  (s, i) =>
                    `<option value="${i}" ${i === state.slideIdx ? "selected" : ""}>${s.num}/${SLIDES.length} · ${esc(s.title)}</option>`
                ).join("")}
              </select>
              <button type="button" class="or-tool-btn is-primary or-prevnext-btn" id="orNextBtn" ${state.slideIdx === SLIDES.length - 1 ? "disabled" : ""}><span class="or-nav-word">${esc(t("ถัดไป", "Next"))}</span> &rarr;</button>
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
        state.toolsMenuOpen = false;
        if (state.viewMode !== "deck") state.autoPlay = false;
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
        state.autoPlay = false;
        state.toolsMenuOpen = false;
        state.slideIdx = Number(btn.dataset.orJump) || 0;
        state.viewMode = "deck";
        renderModal();
      });
    });

    ["orTimerBtn", "orPopTimerBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) {
        b.addEventListener("click", toggleTimer);
        b.addEventListener("dblclick", (ev) => {
          ev.preventDefault();
          resetTimer();
        });
      }
    });

    ["orAutoPlayBtn", "orPopAutoPlayBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", toggleAutoPlay);
    });

    ["orToggleNotesBtn", "orPopNotesBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) {
        b.addEventListener("click", () => {
          state.showNotes = !state.showNotes;
          state.toolsMenuOpen = false;
          renderModal();
        });
      }
    });

    ["orPrintBtn", "orPopPrintBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", printHandout);
    });

    const moreBtn = document.getElementById("orMoreToolsBtn");
    if (moreBtn) {
      moreBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        state.toolsMenuOpen = !state.toolsMenuOpen;
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

    const presentBtn = document.getElementById("orPresentBtn");
    if (presentBtn) presentBtn.addEventListener("click", togglePresentationMode);

    const closeBtn = document.getElementById("orCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeDeck);

    const prevBtn = document.getElementById("orPrevBtn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        state.autoPlay = false;
        goToSlide(state.slideIdx - 1);
      });
    }

    const nextBtn = document.getElementById("orNextBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        state.autoPlay = false;
        goToSlide(state.slideIdx + 1);
      });
    }

    const sel = document.getElementById("orSlideSelect");
    if (sel) {
      sel.addEventListener("change", () => {
        state.autoPlay = false;
        goToSlide(Number(sel.value) || 0);
      });
    }

    wireLaserIfActive(modal);
    if (cur.isCover) animateCoverKpis(modal);
    scheduleAutoPlayTick();
  }

  function openDeck(initialSlideIdx, opts) {
    const o = opts || {};
    state.isOpen = true;
    state.toolsMenuOpen = false;
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
    state.autoPlay = false;
    state.toolsMenuOpen = false;
    clearAutoPlayTimer();
    document.body.classList.remove("orient-deck-open");
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
    toggleAutoPlay,
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
