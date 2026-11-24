/* ==========================================================================
   RACM 303 (2569) — Orientation to Community Medicine & Health Systems Science
   15-Slide Non-Interactive 16:9 Widescreen Apple-Keynote Slide Deck
   Constructive Policy-Brief Prose · Source-Validated HSS · Auto-Fit Typography
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const ASSET_VER = "20261124gio2";
  const PPTX_HREF = `exports/pptx/RACM303_2569_Orientation_Slides.pptx?v=${ASSET_VER}`;
  const PDF_HREF = `exports/pdf/RACM303_2569_Orientation_Slides.pdf?v=${ASSET_VER}`;
  const IMG_DIR = "assets/images/orientation";
  const AUTOPLAY_MS = 9000;

  function loadIoStageTheme() {
    try {
      const saved = localStorage.getItem("racm303_io_clean_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (document.documentElement.getAttribute("data-theme") === "dark") return "dark";
    } catch (_) {}
    return "light";
  }

  const state = {
    isOpen: false,
    slideIdx: 0,
    viewMode: "deck", // "deck" | "live" | "sorter" | "handout"
    ioStageTheme: loadIoStageTheme(), // "light" (Google Minimalist Clean) | "dark" (Samsung/Google Dark Stage + Dark PNGs)
    hasManualIoTheme: false,
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
    resizeRaf: 0
  };

  function getEffectiveIoTheme() {
    if (document.body.classList.contains("is-printing-orientation-deck") || state.viewMode === "handout") {
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

  function figPlate(fileName, altText, captionHtml, extraCls, badgeText) {
    const resolved = resolveSlideImgFile(fileName);
    return `
      <figure class="or-fig-plate${extraCls ? " " + extraCls : ""}">
        ${badgeText ? `<div class="or-fig-top-badge">${esc(badgeText)}</div>` : ""}
        <div class="or-fig-img-wrap">
          <img class="or-fig-img" data-base-img="${esc(fileName)}" src="${IMG_DIR}/${esc(resolved)}?v=${ASSET_VER}" alt="${esc(altText)}" loading="eager" decoding="async" />
        </div>
        ${captionHtml ? `<figcaption class="or-fig-cap">${captionHtml}</figcaption>` : ""}
      </figure>
    `;
  }

  function s02FlowCard(opts) {
    const resolved = resolveSlideImgFile(opts.fileName);
    return `
      <div class="or-s02-flow-card ${esc(opts.tintCls || "")}">
        <figure class="or-fig-plate is-s02-plate">
          <div class="or-fig-top-badge">${esc(opts.stepBadge)}</div>
          <div class="or-fig-img-wrap">
            <img class="or-fig-img" data-base-img="${esc(opts.fileName)}" src="${IMG_DIR}/${esc(resolved)}?v=${ASSET_VER}" alt="${esc(opts.altText)}" loading="eager" decoding="async" />
          </div>
          <figcaption class="or-fig-cap">${opts.citationHtml}</figcaption>
        </figure>
        <div class="or-card ${esc(opts.takeawayCls || "is-white")} or-s02-takeaway-box">
          <span class="or-card-kicker">${esc(opts.takeawayKicker)}</span>
          <h3 class="or-card-title">${esc(opts.takeawayTitle)}</h3>
          <p class="or-card-text">${opts.takeawayHtml}</p>
        </div>
      </div>
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

  /* ---------- Complete 15-Slide Deck (Constructive Concise Prose · Source-Validated · Auto-Fit) ---------- */
  const SLIDES = [
    {
      id: "s01-cover",
      num: "01",
      section: "intro",
      sectionLabel: "Opening",
      actClass: "",
      actLabel: "OPENING · 4-ACT STORY",
      timeWindow: "08.30 – 08.34 น. (4 นาที)",
      kicker: "RACM 303 · ACADEMIC YEAR 2569 · COURSE ORIENTATION",
      title: "Orientation to Community Medicine & Health Systems Science",
      keyTag: "สาระสำคัญ",
      keyMessageHtml:
        "เชื่อมโยง <strong>การดูแลผู้ป่วยข้างเตียง</strong> เข้ากับ <strong>วิถีชุมชนและระบบสุขภาพ</strong> ผ่านประสบการณ์เรียนรู้จริงตลอด 6 สัปดาห์ เพื่อพัฒนาสมรรถนะหลักทั้ง 5 ด้าน",
      notes:
        "กล่าวต้อนรับนักศึกษาแพทย์ชั้นปีที่ 3 รุ่นปีการศึกษา 2569 ทั้ง 169 คน แนะนำคณาจารย์ประจำรายวิชา ชี้แจงภาพรวมคาบปฐมนิเทศ 1 ชั่วโมงแรก (08.30–09.30 น.) ทั้ง 4 ช่วง ได้แก่ ความสำคัญและวัตถุประสงค์รายวิชา เส้นทางการเรียนรู้ 6 สัปดาห์และโรงพยาบาลแหล่งฝึก 9 แห่ง การประเมินผลตามสมรรถนะหลัก 5 ด้าน ตลอดจนแนวทางดูแลความปลอดภัยและก้าวแรกของสัปดาห์ที่ 1",
      isCover: true
    },
    {
      id: "s02-prem-buri-founder",
      num: "02",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · FOUNDING FATHER",
      timeWindow: "08.34 – 08.38 น. (4 นาที)",
      kicker: "01 · RAMATHIBODI COMMUNITY MEDICINE HERITAGE",
      title: "Prof. Dr. Prem Buri — บิดาผู้วางรากฐานและต้นแบบการสอนเวชศาสตร์ชุมชน รามาธิบดี",
      keyTag: "ต้นแบบครูแพทย์",
      keyMessageHtml:
        "<strong>Prof. Dr. Prem Buri</strong>, our founding father and our role model of teaching community medicine in Ramathibodi",
      notes:
        "รำลึกถึงศาสตราจารย์เกียรติคุณ นายแพทย์เปรม บุรี หัวหน้าภาควิชาศัลยศาสตร์ท่านแรก และผู้อำนวยการโครงการเวชศาสตร์ชุมชนท่านแรกของคณะแพทยศาสตร์โรงพยาบาลรามาธิบดี (พ.ศ. 2512–2520) ผู้วางรากฐานการจัดการเรียนการสอนเวชศาสตร์ชุมชนแบบสหสาขาวิชาชีพ ณ อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา ร่วมกับกระทรวงสาธารณสุข เพื่อให้บัณฑิตแพทย์เข้าใจชีวิตจริงของประชาชนและเป็นผู้นำการเปลี่ยนแปลงในระบบสุขภาพ",
      render: () => `
        <div class="or-infog-split is-fig-left">
          ${figPlate(
            "orient_s02_prem_buri.png",
            "Prof. Dr. Prem Buri — กตเวทิตาคารวะ ๑๐๐ ปี ศาสตราจารย์เกียรติคุณ นายแพทย์เปรม บุรี",
            "<strong>กตเวทิตาคารวะ ๑๐๐ ปี เปรม บุรี</strong> · ศาสตราจารย์เกียรติคุณ นายแพทย์เปรม บุรี"
          )}

          <div class="or-stack-col is-s03-stack" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">FOUNDING DIRECTOR · พ.ศ. 2512 – 2520</span>
              <h3 class="or-card-title">ผู้อำนวยการโครงการเวชศาสตร์ชุมชนท่านแรก</h3>
              <p class="or-card-text">จากหัวหน้าภาควิชาศัลยศาสตร์ท่านแรกของรามาธิบดี สู่การบุกเบิก<strong>โครงการเวชศาสตร์ชุมชน อ.บางปะอิน จ.พระนครศรีอยุธยา</strong> เพื่อปูรากฐานให้บัณฑิตแพทย์เข้าใจบริบทสังคมชนบทไทยอย่างแท้จริง</p>
            </div>

            <div class="or-card is-white">
              <span class="or-card-kicker">MULTIDISCIPLINARY MODEL · บูรณาการข้ามศาสตร์</span>
              <h3 class="or-card-title">เชื่อมโรงเรียนแพทย์เข้ากับระบบสาธารณสุขระดับอำเภอ</h3>
              <p class="or-card-text">ริเริ่มหน่วยทำงาน<strong>สหสาขาวิชาชีพ (Multidisciplinary Unit)</strong> ร่วมกับกระทรวงสาธารณสุข ผสานการรักษา การป้องกันโรค และการสร้างเสริมสุขภาพ ตั้งแต่ระดับบุคคล ครอบครัว หมู่บ้าน ตำบล ถึงอำเภอ</p>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">LIVING LEGACY · สู่ RACM 303 ในปัจจุบัน</span>
              <h3 class="or-card-title">เรียนรู้จากชีวิตจริง สู่ผู้นำการเปลี่ยนแปลง (Change Agent)</h3>
              <p class="or-card-text">สืบสานปณิธานการพาแพทย์ออกจากข้างเตียงไปเรียนรู้ร่วมกับชุมชนจริง (<code>Experiential Learning</code>) เพื่อให้เข้าใจปัจจัยกำหนดสุขภาพและร่วมพัฒนาระบบสุขภาพอย่างยั่งยืน</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s02-third-pillar-why",
      num: "03",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · START WITH WHY",
      timeWindow: "08.38 – 08.42 น. (4 นาที)",
      kicker: "01 · HEALTH SYSTEMS SCIENCE (HSS) · THE THIRD PILLAR OF MEDICAL EDUCATION",
      title: "วิทยาศาสตร์ระบบสุขภาพ: เสาหลักที่ 3 ที่ต่อยอดความรู้พื้นฐานและคลินิกสู่การดูแลผู้ป่วยในระบบจริง",
      keyTag: "สาระสำคัญ",
      keyMessageHtml:
        "<strong>วิทยาศาสตร์พื้นฐาน</strong> อธิบายกลไกของโรค <strong>วิทยาศาสตร์คลินิก</strong> ชี้แนวทางวินิจฉัยและรักษาผู้ป่วยรายบุคคล ควบคู่กับ <strong>วิทยาศาสตร์ระบบสุขภาพ (HSS)</strong> ที่ศึกษาการจัดบริการ การทำงานร่วมกันของทีม และการพัฒนาระบบให้ดียิ่งขึ้น",
      notes:
        "ไล่เรียงตามลำดับความคิดของแผนภาพต้นฉบับทั้ง 3 รูป: (1) รูปที่ 1 แสดงเสาหลักทั้ง 3 ของแพทยศาสตรศึกษา ชี้ให้เห็นว่าแม้การวินิจฉัยและรักษาทางคลินิกจะแม่นยำ แต่เมื่อระบบส่งต่อ สิทธิการรักษา หรือการดูแลต่อเนื่องยังไม่เชื่อมถึงกัน ผู้ป่วยก็ยังมีความเสี่ยงที่จะกลับมาป่วยซ้ำ การเสริมเสาหลักด้านระบบสุขภาพจึงช่วยให้การรักษาเกิดผลต่อเนื่อง (2) รูปที่ 2A (Gonzalo et al., 2017) แสดงโครงสร้างหลักสูตรที่ประกอบด้วยโดเมนหลัก 6 ด้านและโดเมนตัดขวาง 5 ด้าน โดยมี Systems thinking เป็นตัวเชื่อมเข้ากับความรู้พื้นฐานและคลินิก และ (3) รูปที่ 2B (AMA / Skochelak et al., 2020) เป็นแผนภาพกรอบแนวคิดเดียวกันกับรูป 2A แต่ปรับจุดเน้นเพื่อสื่อสารว่าทุกระบบมุ่งรับใช้ผู้ป่วย ครอบครัว และชุมชนเป็นศูนย์กลาง",
      render: () => `
        <div class="or-s02-3fig-grid" data-fit-group="s02-takeaways">
          ${s02FlowCard({
            stepBadge: "1 · THREE-PILLAR MODEL (ทำไมต้องมีเสาหลักที่ 3)",
            fileName: "orient_s02_three_pillars_orig.png",
            altText: "Three-pillar model of medical education: Basic science, Clinical science, and Health systems science",
            citationHtml: "<strong>Fig. 1.4</strong> Three-pillar model · <em>Skochelak SE et al., Health Systems Science</em> (AMA / Elsevier, 2017)",
            takeawayCls: "is-rose-tint",
            takeawayKicker: "KEY TAKEAWAY · ภาพที่ 1",
            takeawayTitle: "การผสานทั้งสามเสาหลักช่วยให้การรักษาต่อเนื่องถึงชีวิตจริง",
            takeawayHtml:
              "แม้การวินิจฉัยและรักษาทางคลินิกจะแม่นยำ แต่เมื่อระบบส่งต่อ สิทธิการรักษา หรือการดูแลต่อเนื่องยังไม่เชื่อมถึงกัน ผู้ป่วยก็ยัง<strong>มีความเสี่ยงที่จะกลับมาป่วยซ้ำ</strong> การเรียนรู้ระบบสุขภาพควบคู่กับความรู้พื้นฐานและคลินิกจึงช่วยให้การดูแลเกิดผลต่อเนื่อง"
          })}

          ${s02FlowCard({
            stepBadge: "2A · HSS CURRICULAR DOMAINS (เรียนอะไรและเชื่อมอย่างไร)",
            fileName: "orient_s02_hss_domains_orig.png",
            altText: "Core, cross-cutting, and linking domains for a health systems science curricular framework",
            citationHtml: "<strong>Fig. 1</strong> Curricular domains · <em>Gonzalo JD et al., Acad Med.</em> 2017;92(1):123–131",
            takeawayCls: "is-navy-tint",
            takeawayKicker: "KEY TAKEAWAY · ภาพที่ 2A",
            takeawayTitle: "คิดเชิงระบบเชื่อม 6 โดเมนหลักและ 5 โดเมนตัดขวางเข้ากับคลินิก",
            takeawayHtml:
              "ครอบคลุม<strong>โดเมนหลัก 6 ด้าน</strong> (โครงสร้างและกระบวนการบริการ นโยบาย เศรษฐศาสตร์และการจัดการ สารสนเทศสุขภาพ สุขภาพประชากร การดูแลที่คุ้มค่า และการพัฒนาระบบ) ร่วมกับ<strong>โดเมนตัดขวาง 5 ด้าน</strong> (ผู้นำการเปลี่ยนแปลง ทีมสหวิชาชีพ เวชปฏิบัติอิงหลักฐาน จริยธรรมวิชาชีพ และการสร้างองค์ความรู้) โดยมี <strong>Systems thinking</strong> เชื่อมทุกมิติให้เห็นบริบทสังคมและเศรษฐกิจของผู้ป่วย"
          })}

          ${s02FlowCard({
            stepBadge: "2B · SAME FRAMEWORK, PATIENT FOCUS (รูปเดียวกับ 2A ต่างจุดเน้น)",
            fileName: "orient_s02_ama_wheel_orig.png",
            altText: "AMA Health Systems Science framework wheel with Patient, family and community at the center",
            citationHtml: "<strong>Fig. 1.2</strong> AMA HSS wheel · <em>Skochelak SE et al., Health Systems Science</em>, 2nd ed. (AMA / Elsevier, 2020)",
            takeawayCls: "is-teal-tint",
            takeawayKicker: "KEY TAKEAWAY · ภาพที่ 2B (กรอบเดียวกับ 2A)",
            takeawayTitle: "แผนภาพชุดเดียวกับ 2A ที่วางผู้ป่วย ครอบครัว และชุมชนไว้ตรงกลาง",
            takeawayHtml:
              "สื่อสารหัวใจคนละมุมกับรูป 2A โดยชี้ว่า<strong>ทุกระบบขับเคลื่อนไปเพื่อผู้ป่วย ครอบครัว และชุมชน</strong> ขยายมิติปัจจัยกำหนดสุขภาพทางสังคม (SDH) พร้อมเน้นรากฐานด้านภาวะผู้นำ การทำงานเป็นทีม จริยธรรมและกฎหมาย ตลอดจนการขับเคลื่อนการเปลี่ยนแปลงและสนับสนุนนโยบาย โดยมีลูกศรการคิดเชิงระบบโอบประสานทุกวงล้อ"
          })}
        </div>
      `
    },
    {
      id: "s03-beyond-bedside",
      num: "04",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · START WITH WHY",
      timeWindow: "08.42 – 08.46 น. (4 นาที)",
      kicker: "01 · BEYOND THE BEDSIDE & RAMATHIBODI COMMUNITY MEDICINE HERITAGE",
      title: "มองให้ลึกกว่าข้างเตียง จากรากเหง้าสุขภาพชุมชนสู่ปณิธานรามาธิบดี",
      keyTag: "สาระสำคัญ",
      keyMessageHtml:
        "การรักษาข้างเตียงช่วยดูแลผู้ป่วยเฉพาะราย ควบคู่กับ <strong>ความเข้าใจปัจจัยกำหนดสุขภาพ ชุมชน และระบบบริการ</strong> ที่ช่วยลดความเสี่ยงการเจ็บป่วยซ้ำของประชากร",
      notes:
        "เชื่อมภาพสิ่งที่พบในโรงพยาบาลเข้ากับปัจจัยพื้นฐานในชุมชน (อาชีพ โภชนาการ ที่อยู่อาศัย อสม. ระบบบริการปฐมภูมิ หลักประกันสุขภาพ และนโยบายสาธารณะ) สืบเนื่องจากปณิธานก่อตั้งเวชศาสตร์ชุมชน รามาธิบดี ตั้งแต่ พ.ศ. 2511 โดย ศ.นพ.อารี วัลยะเสวี และ ศ.นพ.เปรม บุรี",
      render: () => `
        <div class="or-infog-split is-fig-left">
          ${figPlate(
            "orient_s03_beyond_bedside.png",
            "เชื่อมโยงการดูแลข้างเตียง ปัจจัยกำหนดสุขภาพในชุมชน และระบบสุขภาพ สู่บทบาทผู้นำการเปลี่ยนแปลง",
            ""
          )}

          <div class="or-stack-col is-s03-stack" data-fit-group="cards">
            <div class="or-card is-navy-tint">
              <span class="or-card-kicker">FOUNDING VISION · พ.ศ. 2511 ถึงปัจจุบัน</span>
              <h3 class="or-card-title">ปณิธาน ศ.นพ.อารี วัลยะเสวี และ ศ.นพ.เปรม บุรี</h3>
              <p class="or-card-text">เตรียมบัณฑิตแพทย์ให้เข้าใจบริบทชีวิตจริงของประชาชน ทำงานร่วมกับชุมชนและทีมสาธารณสุขอย่างมีความสุขเพื่อร่วมพัฒนาระบบสุขภาพ</p>
            </div>

            <div class="or-card is-white">
              <span class="or-card-kicker">RAMATHIBODI HERITAGE · พัฒนาการและพันธกิจหลัก 3 ด้าน</span>
              <ul class="or-list">
                <li><strong>พ.ศ. 2511–2512:</strong> บุกเบิกสำรวจสุขภาพ ต.บางชัน และโครงการสหวิชาชีพ อ.บางปะอิน</li>
                <li><strong>พ.ศ. 2525–2546:</strong> พัฒนาจากศูนย์เวชศาสตร์ชุมชนสู่<strong>ภาควิชาเวชศาสตร์ชุมชน</strong></li>
                <li><strong>พันธกิจ 3 ด้าน:</strong> สร้างเสริมสุขภาพและสุขภาพโลก วิจัยระบบสุขภาพ และอาชีวเวชศาสตร์</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint">
              <span class="or-card-kicker">3-LEVEL CLINICAL LENS</span>
              <h3 class="or-card-title">เชื่อมโยงมุมมอง 3 ระดับในทุกกรณีศึกษา</h3>
              <p class="or-card-text">พิจารณาสุขภาพของ<strong>ผู้ป่วยตรงหน้า</strong>ควบคู่กับบริบท<strong>ครอบครัวและชุมชน (SDH, CDoH)</strong> ตลอดจน<strong>การจัดบริการของระบบสุขภาพ</strong>อย่างเป็นองค์รวม</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s04-course-objectives",
      num: "05",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · OBJECTIVES",
      timeWindow: "08.46 – 08.50 น. (4 นาที)",
      kicker: "01 · COURSE GOALS (ก–ง) & 5 CORE PHYSICIAN COMPETENCIES",
      title: "วัตถุประสงค์รายวิชา (ก–ง) เชื่อมตรงสู่สมรรถนะหลักของแพทย์ทั้ง 5 ด้าน",
      keyTag: "ความสอดคล้องเชิงหลักสูตร",
      keyMessageHtml:
        "ทุกกิจกรรมการเรียนรู้และการประเมินผลใน RACM 303 ออกแบบให้สอดรับกันตั้งแต่ <strong>วัตถุประสงค์ ก–ง ไปจนถึงสมรรถนะหลักทั้ง 5 ด้าน (C1–C5)</strong>",
      notes:
        "ชี้ให้เห็นว่าวัตถุประสงค์รายวิชาทั้ง 4 หมวด (ก–ง) ในคู่มือรายวิชา ออกแบบให้รองรับสมรรถนะหลัก 5 ด้านของบัณฑิตแพทย์ ซึ่งจะใช้เป็นกรอบประเมินผลสัมฤทธิ์ของรายวิชาอย่างโปร่งใส",
      render: () => `
        <div class="or-infog-split is-fig-left-compact">
          ${figPlate(
            "orient_s04_competencies.png",
            "5 Core Physician Competencies of RACM 303",
            ""
          )}

          <div class="or-grid-2 is-s04-grid" data-fit-group="cards">
            <div class="or-card is-navy-tint is-vcenter">
              <span class="or-card-kicker">ก. COGNITIVE · สมรรถนะ C1, C3</span>
              <h3 class="or-card-title">ประยุกต์ใช้ระบบสุขภาพและระบาดวิทยา</h3>
              <ul class="or-list is-s04-list">
                <li>ระบาดวิทยาคลินิกและชุมชนควบคู่เวชปฏิบัติอิงหลักฐาน (<code>EP1–EP9</code>)</li>
                <li>สุขภาพ ปัจจัยกำหนดสุขภาพ <code>SDH, CDoH</code> และการป้องกันโรค (<code>HS1</code>)</li>
                <li>ระบบบริการ <code>6BB/6W</code> คุณลักษณะ <code>EQESaRR</code> ปฐมภูมิ และหลักประกันสุขภาพ (<code>HS2–6</code>)</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint is-vcenter">
              <span class="or-card-kicker">ข. AWARENESS · สมรรถนะ C3, C5</span>
              <h3 class="or-card-title">ตระหนักในบทบาทแพทย์ ชุมชน และจริยธรรม</h3>
              <ul class="or-list is-s04-list">
                <li>เข้าใจบทบาทของแพทย์ในการทำงานร่วมกับระบบสุขภาพ</li>
                <li>เคารพศักยภาพ ภูมิปัญญา และทุนทางสังคมของชุมชน</li>
                <li>ตรงต่อเวลา ซื่อสัตย์ เห็นอกเห็นใจ และรับผิดชอบต่อส่วนรวม</li>
              </ul>
            </div>

            <div class="or-card is-white is-vcenter">
              <span class="or-card-kicker">ค. SKILLS · สมรรถนะ C1, C2, C3</span>
              <h3 class="or-card-title">คิดเชิงระบบ สำรวจจริง และสื่อสารทำงานร่วมกัน</h3>
              <ul class="or-list is-s04-list">
                <li><strong>ด้านความคิด:</strong> วิเคราะห์ปัญหาเชิงระบบและวางแผนแก้ไขอย่างมีหลักฐานรองรับ</li>
                <li><strong>ด้านปฏิบัติ:</strong> ลงมือสำรวจสุขภาพชุมชนตามระเบียบวิธีวิจัย</li>
                <li><strong>ด้านสื่อสาร:</strong> ประสานงานกับเพื่อนร่วมทีม สหวิชาชีพ และชุมชนอย่างเหมาะสม</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint is-vcenter">
              <span class="or-card-kicker">ง. CHARACTER · สมรรถนะ C2, C4, C5</span>
              <h3 class="or-card-title">ร่วมรับผิดชอบงานทีมและพัฒนาตนเองต่อเนื่อง</h3>
              <ul class="or-list is-s04-list">
                <li><strong>ความรับผิดชอบร่วม:</strong> ช่วยเหลือเกื้อกูลกันในการทำงานภาคสนามของกลุ่ม</li>
                <li><strong>การสะท้อนคิดพัฒนาตน:</strong> ทบทวนประสบการณ์และนำคำแนะนำมาพัฒนาตนเองอย่างเป็นระบบ (<code>SRN 1–2</code>)</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s05-hs-5objectives",
      num: "06",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · FIVE HSS OBJECTIVES",
      timeWindow: "08.50 – 08.54 น. (4 นาที)",
      kicker: "01 · FIVE HEALTH SYSTEMS OBJECTIVES LINKED BY SYSTEMS THINKING",
      title: "วัตถุประสงค์หมวดระบบสุขภาพทั้ง 5 ด้านที่เชื่อมโยงกันด้วยการคิดเชิงระบบ",
      keyTag: "การเชื่อมโยงเชิงระบบ",
      keyMessageHtml:
        "การนำเสนอหมวดระบบสุขภาพ (<code>ฟอร์ม 3A</code>) มุ่งใช้ <strong>การคิดเชิงระบบ (Systems Thinking)</strong> เชื่อมโยงทั้ง 5 วัตถุประสงค์ให้เห็นภาพรวมของพื้นที่จริงโดยไม่แยกส่วนรายข้อ",
      notes:
        "ย้ำหัวใจสำคัญของการเรียนรู้หมวดระบบสุขภาพ ทั้ง 5 วัตถุประสงค์ออกแบบให้เชื่อมถึงกันผ่านการคิดเชิงระบบ (Linking Domain) เพื่อให้ทีมมองเห็นความสัมพันธ์ของปัญหาและศักยภาพในพื้นที่จริงอย่างเป็นองค์รวมในการนำเสนอฟอร์ม 3A",
      render: () => `
        <div class="or-infog-split is-fig-left">
          ${figPlate(
            "orient_s05_district_lenses.png",
            "Systems Thinking as Linking Domain Connecting the 5 Core Objectives of Health Systems",
            ""
          )}

          <div class="or-stack-col is-s05-stack" data-fit-group="cards">
            <div class="or-card is-white is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">1 · สุขภาพ ปัจจัยกำหนดสุขภาพ (SDH, CDoH) และการป้องกันโรค</span><span class="or-mini-chip">HS1</span></div>
              <p class="or-card-text is-s05-text"><strong>1.1</strong> สุขภาพองค์รวม · <strong>1.2</strong> ปัจจัยกำหนดสุขภาพทางสังคมและพาณิชย์ · <strong>1.3</strong> ระดับการป้องกันโรคในคลินิกและชุมชน</p>
            </div>

            <div class="or-card is-navy-tint is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">2 · ระบบสุขภาพและระบบบริการสุขภาพ (Health Service Systems)</span><span class="or-mini-chip">ST1 · HS2–3, 5–6</span></div>
              <p class="or-card-text is-s05-text"><strong>2.1</strong> ระบบซับซ้อนและการคิดเชิงระบบ · <strong>2.2</strong> ระบบบริการ (<code>6BB/6W/PHC/UHC</code>) · <strong>2.3</strong> คุณลักษณะ <code>EQESaRR</code> · <strong>2.4</strong> วิจัยพัฒนาระบบ</p>
            </div>

            <div class="or-card is-amber-tint is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">3 · ศักยภาพชุมชนในการพัฒนาสุขภาพ (Community Potential)</span><span class="or-mini-chip">HS1 · HS5</span></div>
              <p class="or-card-text is-s05-text"><strong>3.1</strong> ความหมายและองค์ประกอบของชุมชน · <strong>3.2</strong> บทบาททุนทางสังคม อสม. และองค์กรท้องถิ่นในการร่วมดูแลสุขภาพ</p>
            </div>

            <div class="or-card is-teal-tint is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">4 · การสร้างเสริมสุขภาพ (Health Promotion)</span><span class="or-mini-chip">HS4 · COM-B</span></div>
              <p class="or-card-text is-s05-text"><strong>4.1</strong> แนวคิดการสร้างเสริมสุขภาพ · <strong>4.2</strong> กลยุทธ์ Ottawa Charter, HiAP และกรอบ <code>COM-B</code> · <strong>4.3</strong> การเชื่อมเข้ากับระบบบริการ</p>
            </div>

            <div class="or-card is-white is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">5 · บทบาทแพทย์ในระบบสุขภาพ (Physician Roles in Health Systems)</span><span class="or-mini-chip">Applying HSS</span></div>
              <p class="or-card-text is-s05-text"><strong>5.1</strong> บทบาทของแพทย์ในแต่ละระดับบริการ · <strong>5.2</strong> การประยุกต์สมรรถนะระบบสุขภาพร่วมกับทีมสหวิชาชีพและชุมชน</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s06-roadmap-6weeks",
      num: "07",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "08.54 – 09.00 น. (6 นาที)",
      kicker: "02 · 6-WEEK LEARNING JOURNEY (25 NOV – 30 DEC 2569)",
      title: "เส้นทางการเรียนรู้ 6 สัปดาห์ จากการปูกรอบคิดสู่โรงพยาบาลแหล่งฝึกและการสังเคราะห์ทีม",
      keyTag: "ลำดับการเรียนรู้",
      keyMessageHtml:
        "จัดสอบ <strong>ระบาดวิทยา</strong> ก่อนลงสำรวจจริง และจัดสอบ <strong>ระบบสุขภาพ</strong> หลังเห็นการทำงานในพื้นที่ เพื่อต่อยอดสู่ <strong>การนำเสนอผลงานร่วมกันเป็นทีม</strong>",
      notes:
        "พากวาดสายตาภาพรวม 6 สัปดาห์ ช่วงที่ 1 (สัปดาห์ 1–3) ปูพื้นฐานทฤษฎี สอบระบาดวิทยา 8 ธ.ค. ฝึก SPSS และส่ง SRN 1 ก่อนเดินทาง ช่วงที่ 2 (สัปดาห์ 4) เรียนรู้ภาคสนาม ณ โรงพยาบาลแหล่งฝึก 9 แห่ง (7–9 คืน) และช่วงที่ 3 (สัปดาห์ 5–6) สอบระบบสุขภาพ 22 ธ.ค. ฝึกเขียนแผนผังความคิดเชิงระบบ และนำเสนอผลงานทีมวันที่ 29–30 ธ.ค.",
      render: () => `
        <div class="or-top-fig-stack is-s06-stack">
          ${figPlate("orient_s06_roadmap.png", "6-Week Learning Journey across Classroom Preparation, 9 Training Hospitals, and Team Synthesis", "")}

          <div class="or-grid-6 is-s06-grid" data-fit-group="cards">
            <div class="or-card is-white is-s06-card">
              <div>
                <span class="or-card-kicker">W1 · 25–27 พ.ย.</span>
                <h3 class="or-card-title is-s06-title">เปิดมุมมองระบบและระบาดฯ</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>25 พ.ย.:</strong> <code>ST1</code> และสุขภาพโลก</li>
                <li><strong>26 พ.ย.:</strong> <code>HS1</code> ควบคู่ SG #1</li>
                <li><strong>27 พ.ย.:</strong> <code>EP1–3</code> และ Ex 1–2</li>
              </ul>
            </div>

            <div class="or-card is-white is-s06-card">
              <div>
                <span class="or-card-kicker">W2 · 30 พ.ย.–4 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">เติมเต็ม HS2–6 และ EP4–9</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>30 พ.ย.–1 ธ.ค.:</strong> <code>HS2–HS5</code></li>
                <li><strong>2–3 ธ.ค.:</strong> <code>EP4–9</code> รูปแบบผสมผสาน</li>
                <li><strong>4 ธ.ค.:</strong> <code>HS6</code> ควบคู่ SG #2</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W3 · 8–12 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">สอบระบาดฯ และเตรียมทีม</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>8 ธ.ค.:</strong> <strong>Epi Exam</strong> และ SPSS</li>
                <li><strong>9 ธ.ค.:</strong> ระบบสุขภาพอำเภอและ <strong>SRN 1</strong></li>
                <li><strong>9–12 ธ.ค.:</strong> SG #4–6 ก่อนออกเดินทาง</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W4 · 9–20 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">โรงพยาบาลแหล่งฝึก 9 แห่ง</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li>เรียนรู้ในพื้นที่จริง <strong>7–9 คืน</strong></li>
                <li>เชื่อมโยงทั้ง 5 วัตถุประสงค์ระบบฯ</li>
                <li>สำรวจชุมชนและรับคำแนะนำ SRN 1</li>
              </ul>
            </div>

            <div class="or-card is-navy-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W5 · 21–25 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">สอบระบบสุขภาพและฝึก CLD</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>21 ธ.ค.:</strong> เตรียมโน้ตสรุป A4</li>
                <li><strong>22 ธ.ค.:</strong> <strong>HS Exam</strong> และฝึก CLD</li>
                <li><strong>23–25 ธ.ค.:</strong> เสวนานโยบายและ SG</li>
              </ul>
            </div>

            <div class="or-card is-rose-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W6 · 28–30 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">สังเคราะห์และนำเสนอทีม</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>28 ธ.ค.:</strong> SG #11–12 เตรียมนำเสนอ</li>
                <li><strong>29 ธ.ค.:</strong> <strong>นำเสนอระบบสุขภาพ (3A)</strong></li>
                <li><strong>30 ธ.ค.:</strong> <strong>นำเสนอระบาดฯ และ SRN 2</strong></li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s07-hs-guided-learning",
      num: "08",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.00 – 09.04 น. (4 นาที)",
      kicker: "02 · HEALTH SYSTEMS SCIENCE ARCHITECTURE (ST1 & HS1–HS6)",
      title: "การเรียนรู้หมวดระบบสุขภาพแบบนำทาง 5 ขั้นตอน ควบคู่กับ 6 เวทีฝึกคิดเชิงระบบ",
      keyTag: "การออกแบบการเรียนรู้",
      keyMessageHtml:
        "สร้างพื้นฐานความรู้สู่ <strong>โน้ตสรุป A4 สำหรับสอบข้อเขียน</strong> ควบคู่กับการฝึก <strong>การคิดเชิงระบบ</strong> เพื่อเชื่อมโยงทั้ง 5 วัตถุประสงค์ในการนำเสนอทีม (<code>ฟอร์ม 3A</code>)",
      notes:
        "อธิบายเส้นทางเรียนรู้ 5 ขั้นตอนของ ST1 และ HS1–HS6 ควบคู่กับ 6 เวทีฝึกคิดเชิงระบบ (17.5 ชม.) ซึ่งช่วยบ่มเพาะสมรรถนะการคิดเชิงระบบเพื่อใช้เชื่อมโยงทั้ง 5 วัตถุประสงค์ในการนำเสนอผลงานทีมฟอร์ม 3A และงานสะท้อนคิด",
      render: () => `
        <div class="or-top-fig-stack is-s07-stack">
          ${figPlate("orient_s07_guided_flow.png", "5-Step Guided Learning Flow and Systems Thinking & Policy Panels", "")}

          <div class="or-infog-split is-even is-full-h">
            <div class="or-card is-navy-tint is-vcenter" data-fit-solo="1">
              <span class="or-card-kicker">5-STEP GUIDED LEARNING (ST1 และ HS1–HS6)</span>
              <h3 class="or-card-title">จากการอ่านเตรียมความพร้อมสู่การอภิปรายกรณีศึกษาเปรียบเทียบ</h3>
              <ul class="or-list is-s07-list">
                <li><strong>ขั้นที่ 1–2 เอกสารฉบับเต็มและฉบับย่อ:</strong> ศึกษาแนวคิดหลักและตอบคำถามนำก่อนเข้าชั้นเรียน</li>
                <li><strong>ขั้นที่ 3 แบบทดสอบทบทวน 66 ข้อและคำศัพท์ 125 คำ:</strong> ฝึกทบทวนความเข้าใจด้วยตนเองเพื่อพัฒนาการเรียนรู้</li>
                <li><strong>ขั้นที่ 4–5 บรรยายสรุป 1 ชม. (<code>2C2-03</code>) และกลุ่มย่อย 6 ห้อง (<code>1C1-02..07</code>):</strong> วิเคราะห์กรณีศึกษาเชิงระบบ</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint is-vcenter" data-fit-solo="1">
              <div>
                <span class="or-card-kicker">6 เวทีบ่มเพาะการคิดเชิงระบบ (18.5 ชั่วโมง)</span>
                <p class="or-card-text is-s07-note">มุ่งเน้นฝึกเชื่อมโยงทั้ง 5 วัตถุประสงค์สำหรับการนำเสนอทีม (ฟอร์ม 3A) และงานสะท้อนคิด โดยไม่ออกสอบข้อเขียน</p>
              </div>
              <div class="or-s07-chips-grid">
                <span class="or-mini-chip is-s07-chip">1. ST1 ระบบซับซ้อนและการคิดเชิงระบบ (25 พ.ย.)</span>
                <span class="or-mini-chip is-s07-chip">2. สุขภาพโลกและวิจัยระบบสุขภาพ (25 พ.ย.)</span>
                <span class="or-mini-chip is-s07-chip">3. ระบบสุขภาพอำเภอและการมีส่วนร่วม (9 ธ.ค.)</span>
                <span class="or-mini-chip is-s07-chip">4. แผนผังวงจรเหตุผล CLD (22 ธ.ค.)</span>
                <span class="or-mini-chip is-s07-chip">5. วิเคราะห์ 6BB สุขภาวะข้างถนน (23 ธ.ค.)</span>
                <span class="or-mini-chip is-s07-chip">6. นโยบายและเศรษฐศาสตร์การเมืองสุขภาพ (24 ธ.ค.)</span>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s08-epidemiology",
      num: "09",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.04 – 09.08 น. (4 นาที)",
      kicker: "02 · CLINICAL & COMMUNITY EPIDEMIOLOGY PIPELINE (EP1–EP9)",
      title: "หมวดระบาดวิทยาคลินิกและชุมชน (EP1–EP9) จากหลักฐานวิชาการสู่การสำรวจจริง",
      keyTag: "จากหลักฐานสู่การปฏิบัติ",
      keyMessageHtml:
        "การประเมินความแม่นยำของการตรวจและการจัดการอคติ (<strong>Selection Bias, Information Bias และ Confounding</strong>) ช่วยให้ผลสำรวจสุขภาพชุมชนน่าเชื่อถือและนำไปใช้ได้จริง",
      notes:
        "ชี้แจงแผนการเรียนระบาดวิทยาทั้ง 4 ช่วง วันศุกร์ 27 พ.ย. บรรยาย EP1–EP3 เวลา 09.00–11.00 น. (ห้อง 2A01 และ Zoom) ต่อด้วยแบบฝึกหัดที่ 1–2 ในระบบ E-learning วันที่ 2–3 ธ.ค. เรียนรูปแบบผสมผสาน เริ่ม 09.00 น. (ห้อง 2C2-03 และ Zoom) และวันอังคาร 8 ธ.ค. ช่วงเช้าสอบภาคทฤษฎี ช่วงบ่ายฝึกวิเคราะห์ข้อมูลด้วย SPSS",
      render: () => `
        <div class="or-top-fig-stack is-s08-stack">
          ${figPlate("orient_s08_epi_pipeline.png", "4-Stage Clinical and Community Epidemiology Pipeline", "")}

          <div class="or-grid-4 is-s08-grid" data-fit-group="cards">
            <div class="or-card is-white is-s08-card">
              <div>
                <span class="or-card-kicker">STAGE 1 · ศ. 27 พ.ย. 69</span>
                <h3 class="or-card-title">EP1–EP3 · การวินิจฉัยและอคติ</h3>
                <div class="or-s08-inst-row"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_jakkrit.jpg?v=${ASSET_VER}" alt="อ.จักรกฤษณ์" loading="eager" decoding="async" /></span><span>อ. นพ.จักรกฤษณ์</span></span></div>
              </div>
              <p class="or-card-text"><strong>09.00–11.00 น.</strong> (<code>Auditorium</code> และ Zoom) ศึกษา Sens/Spec/PPV/LR และการจัดการอคติ ต่อด้วย<strong>แบบฝึกหัด 1–2 หลัง 11.00 น.</strong></p>
            </div>

            <div class="or-card is-white is-s08-card">
              <div>
                <span class="or-card-kicker">STAGE 2 · พ. 2 ธ.ค. 69</span>
                <h3 class="or-card-title">EP4–EP5 · รูปแบบวิจัยและสอบสวนโรค</h3>
                <div class="or-s08-inst-row"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_sawanee.jpg?v=${ASSET_VER}" alt="อ.สวนีย์" loading="eager" decoding="async" /></span><span>อ. พญ.สวนีย์</span></span></div>
              </div>
              <p class="or-card-text"><strong>09.00–12.00 น. (<code>2C2-03</code> และ Zoom):</strong> Cohort, Case-control, RR/OR/AR/PAR และการสอบสวนการระบาด ต่อด้วย<strong>แบบฝึกหัด 3–4</strong></p>
            </div>

            <div class="or-card is-teal-tint is-s08-card">
              <div>
                <span class="or-card-kicker">STAGE 3 · พฤ. 3 ธ.ค. 69</span>
                <h3 class="or-card-title">EP6–EP9 · ภาระโรคและเวชปฏิบัติอิงหลักฐาน</h3>
                <div class="or-s08-inst-row"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_pawin.jpg?v=${ASSET_VER}" alt="อ.ปวินท์" loading="eager" decoding="async" /></span><span>อ.ปวินท์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_wichai.jpg?v=${ASSET_VER}" alt="ศ.วิชัย" loading="eager" decoding="async" /></span><span>ศ.วิชัย</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_chathaya.jpg?v=${ASSET_VER}" alt="ผศ.ฉัฐญาณ์" loading="eager" decoding="async" /></span><span>ผศ.ฉัฐญาณ์</span></span></div>
              </div>
              <p class="or-card-text"><strong>09.00–12.00 น. (<code>2C2-03</code> และ Zoom):</strong> Incidence, Prevalence, DALYs, การสำรวจชุมชน และประเมินงานวิจัย RCT ต่อด้วย<strong>EP9 &amp; แบบฝึกหัด 5–6</strong></p>
            </div>

            <div class="or-card is-navy-tint is-s08-card">
              <div>
                <span class="or-card-kicker">STAGE 4 · 8 ถึง 30 ธ.ค. 69</span>
                <h3 class="or-card-title">สอบทฤษฎี ฝึก SPSS และนำเสนอวิจัย</h3>
                <div class="or-s08-inst-row"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_sawanee.jpg?v=${ASSET_VER}" alt="อ.สวนีย์" loading="eager" decoding="async" /></span><span>อ.สวนีย์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_jakkrit.jpg?v=${ASSET_VER}" alt="อ.จักรกฤษณ์" loading="eager" decoding="async" /></span><span>อ.จักรกฤษณ์ และทีม</span></span></div>
              </div>
              <p class="or-card-text"><strong>8 ธ.ค.:</strong> เช้าสอบ <strong>Epi Exam</strong> บ่ายฝึก <strong>SPSS</strong> เพื่อเตรียมเก็บข้อมูลในพื้นที่จริงและนำเสนอผลงานวิจัยทีม (<code>ฟอร์ม 4A</code>) วันที่ 30 ธ.ค.</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s09-fieldwork-9sites",
      num: "10",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.08 – 09.13 น. (5 นาที)",
      kicker: "02 · KOLB'S EXPERIENTIAL LEARNING & 9 FIELDWORK TRAINING HOSPITALS",
      title: "การเรียนรู้จากประสบการณ์จริงตามวงจร Kolb ณ โรงพยาบาลแหล่งฝึกทั้ง 9 แห่ง",
      keyTag: "การเรียนรู้ร่วมกัน",
      keyMessageHtml:
        "เตรียมความพร้อมใน <code>SG 1–6</code> ก่อนลงเรียนรู้ในพื้นที่จริง ณ <strong>โรงพยาบาลแหล่งฝึก 9 แห่ง (7–9 คืน)</strong> แล้วนำบทเรียนกลับมาแลกเปลี่ยนให้เห็นบริบทระบบสุขภาพไทยอย่างรอบด้าน",
      notes:
        "แนะนำโรงพยาบาลแหล่งฝึกทั้ง 9 แห่งทั่วภูมิภาค อาจารย์ที่ปรึกษาประจำกลุ่ม ห้องกลุ่มย่อย และกำหนดการเดินทางของแต่ละกลุ่ม พร้อมเชื่อมโยงกับวงจรการเรียนรู้จากประสบการณ์จริงของ Kolb ทั้ง 4 ขั้นตอน",
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
            <div class="or-card is-white is-s09-legend" data-fit-solo="1">
              <span class="or-card-kicker">4-COLOR REGIONAL PINS · โรงพยาบาลแหล่งฝึก 9 แห่ง</span>
              <div class="or-s09-pins-grid">
                <span><span style="color:#009e73">&#9679;</span> อีสาน: กาฬสินธุ์ · เลย · ขอนแก่น</span>
                <span><span style="color:#0072b2">&#9679;</span> เหนือและตาก: น่าน · ท่าสองยาง · อุ้มผาง</span>
                <span><span style="color:#d97706">&#9679;</span> เพชรบูรณ์: รพ.เพชรบูรณ์ (กลุ่ม 5, 6)</span>
                <span><span style="color:#d55e00">&#9679;</span> ภาคใต้: รพ.ตะกั่วป่า จ.พังงา</span>
              </div>
            </div>
          </div>

          <div class="or-table-wrap is-s09-table" data-fit-table="1" data-mobile-scroll-hint="เลื่อนตารางซ้ายและขวาเพื่อดูห้องกลุ่มย่อยและกำหนดการครบทุกคอลัมน์">
            <table class="or-table">
              <thead>
                <tr>
                  <th style="width:5.5%">กลุ่ม</th>
                  <th style="width:23.5%">โรงพยาบาลแหล่งฝึกและจังหวัด</th>
                  <th style="width:7.5%">นศพ.</th>
                  <th style="width:32%">อาจารย์ที่ปรึกษาประจำกลุ่ม</th>
                  <th style="width:9.5%">ห้อง SG</th>
                  <th style="width:22%">กำหนดการฝึกภาคสนาม</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>1</strong></td><td><strong>รพร.กุฉินารายณ์</strong> จ.กาฬสินธุ์</td><td>20 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_nuttawut.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์</span></span></span></td><td><code>3B1-01</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                <tr><td><strong>2</strong></td><td><strong>รพร.ด่านซ้าย</strong> จ.เลย</td><td>19 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_chathaya.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>ผศ. พญ.ฉัฐญาณ์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_warisa.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. พญ.วริษา</span></span></span></td><td><code>1C1-02</code></td><td>12–19 ธ.ค. 69 (7 คืน 8 วัน)</td></tr>
                <tr><td><strong>3</strong></td><td><strong>รพ.ตะกั่วป่า</strong> จ.พังงา</td><td>18 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_chatchai.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. นพ.ฉัตรชัย อิ่มอารมย์</span></span></span></td><td><code>3B1-05</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                <tr><td><strong>4</strong></td><td><strong>รพ.ท่าวังผา</strong> จ.น่าน</td><td>18 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_jakkrit.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. นพ.จักรกฤษณ์ เอื้อสุนทรวัฒนา</span></span></span></td><td><code>3B1-06</code></td><td>12–19 ธ.ค. 69 (7 คืน 8 วัน)</td></tr>
                <tr><td><strong>5</strong></td><td><strong>รพ.เพชรบูรณ์ (1)</strong> จ.เพชรบูรณ์</td><td>18 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_samrit.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>ผศ. นพ.สัมฤทธิ์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_peerasit.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>นพ.พีรสิชฌ์</span></span></span></td><td><code>1C1-04</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                <tr><td><strong>6</strong></td><td><strong>รพ.เพชรบูรณ์ (2)</strong> จ.เพชรบูรณ์</td><td>18 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_pawin.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. นพ.ปวินท์ ศรีวิเชียร</span></span></span></td><td><code>1C1-05</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                <tr><td><strong>7</strong></td><td><strong>รพ.อุบลรัตน์</strong> จ.ขอนแก่น</td><td>18 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_phusit.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. นพ.ภูษิต ประคองสาย</span></span></span></td><td><code>1C1-03</code></td><td>12–20 ธ.ค. 69 (8 คืน 9 วัน)</td></tr>
                <tr><td><strong>8</strong></td><td><strong>รพ.ท่าสองยาง</strong> จ.ตาก</td><td>20 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_wich.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>ผศ. นพ.วิชช์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_pharanyu.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>นพ.ภรัณยู</span></span></span></td><td><code>1C1-06</code></td><td>11–19 ธ.ค. 69 (8 คืน 9 วัน)</td></tr>
                <tr><td><strong>9</strong></td><td><strong>รพ.อุ้มผาง</strong> จ.ตาก</td><td>20 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_roengrudee.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>รศ. พญ.เริงฤดี ปธานวนิช</span></span></span></td><td><code>1C1-07</code></td><td>9–18 ธ.ค. 69 (ออกคืน 9 ธ.ค. 23.00)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `
    },
    {
      id: "s10-competency-blueprint",
      num: "11",
      section: "evaluation",
      sectionLabel: "Act III · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · EVALUATION",
      timeWindow: "09.13 – 09.17 น. (4 นาที)",
      kicker: "03 · COMPETENCY-BASED ASSESSMENT BLUEPRINT (RACM 303 · ปีการศึกษา 2569)",
      title: "โครงสร้างการประเมินผลตามสมรรถนะหลัก 5 ด้าน ทั้งเพื่อพัฒนาและตัดสินผล",
      keyTag: "หลักการประเมินผล",
      keyMessageHtml:
        "แยก <strong>การประเมินเพื่อพัฒนา (Formative)</strong> ซึ่งเปิดพื้นที่ให้ฝึกคิดและรับคำแนะนำ ออกจาก <strong>การประเมินเพื่อตัดสินผล (Summative)</strong> อย่างชัดเจน",
      notes:
        "อธิบายตารางโครงสร้างการประเมินผล 4 คอลัมน์ของ RACM 303 ปีการศึกษา 2569 แบ่งเป็นภาคทฤษฎี (สมรรถนะที่ 1 สอบระบาดวิทยาและระบบสุขภาพ คิดเกณฑ์ผ่านแยกกันตั้งแต่ 2.00 ขึ้นไป และระดับ O ตั้งแต่ 3.75) และภาคปฏิบัติในชุมชน (สมรรถนะที่ 2–5 รวมถึงการนำเสนอผลงานทีมทั้งสองหมวด)",
      render: () => `
        <div class="or-infog-split is-s10-split">
          ${figPlate(
            "orient_s10_blueprint_visual.png",
            "Formative Assessment for Growth leading to Summative Assessment for Mastery across 5 Competencies",
            ""
          )}

          <div class="or-table-wrap is-s10-table" data-fit-table="1" data-mobile-scroll-hint="เลื่อนตารางซ้ายและขวาเพื่อดูเครื่องมือและเกณฑ์ตัดสินผลครบทุกช่อง">
            <table class="or-table">
              <thead>
                <tr>
                  <th style="width:22%">สมรรถนะหลัก 5 ด้าน</th>
                  <th style="width:46%">เครื่องมือประเมินเพื่อพัฒนาและตัดสินผล</th>
                  <th style="width:14%">ผู้ประเมิน</th>
                  <th style="width:18%">เกณฑ์ตัดสินผล</th>
                </tr>
              </thead>
              <tbody>
                <tr class="is-domain-divider"><td colspan="4">ภาคทฤษฎี (Theoretical Domain)</td></tr>
                <tr>
                  <td><strong>1. Knowledge base</strong><br><span class="or-td-sub">ระบบสุขภาพและระบาดวิทยา</span></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> แบบฝึกกรณีศึกษา แบบทดสอบทบทวน 66 ข้อ (<code>ST1, HS1–6</code>) แบบฝึกหัด <code>EP 1–6</code> และ <code>SRN 1</code></div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> <strong>Epi Exam</strong> (8 ธ.ค.) และ <strong>Health Systems Exam</strong> (โน้ต A4 · 22 ธ.ค.)</div>
                  </td>
                  <td>คณาจารย์</td>
                  <td><strong>แยกเกณฑ์สองหมวด:</strong><br>ผ่าน <strong>&ge; 2.00</strong> (<strong>O &ge; 3.75</strong>)</td>
                </tr>

                <tr class="is-domain-divider"><td colspan="4">ภาคปฏิบัติและสมรรถนะวิชาชีพในชุมชน (Practical, Community &amp; Professionalism)</td></tr>
                <tr>
                  <td><strong>2. Communication &amp; Interpersonal</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> แลกเปลี่ยนเรียนรู้ในกลุ่มย่อย 13 ครั้ง และฝึกสื่อสารทำงานร่วมกัน</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> ประเมินโดยเพื่อนร่วมกลุ่ม <code>ฟอร์ม 1A</code> (ข้อ 1, 3, 4) และการนำเสนอทีม (<code>3A, 4A</code>)</div>
                  </td>
                  <td>เพื่อนและอาจารย์</td>
                  <td><strong>O / S / M / U</strong><br><span class="or-td-sub">(รายบุคคลประกอบ 2A)</span></td>
                </tr>
                <tr>
                  <td><strong>3. Community, Pop. &amp; Health System</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> ให้คำปรึกษาเชื่อมโยง 5 วัตถุประสงค์ด้วยคิดเชิงระบบ ณ รพ.แหล่งฝึก และการสำรวจชุมชน</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> <strong>นำเสนอระบบสุขภาพ (3A)</strong> เชื่อมทั้ง 5 วัตถุประสงค์ และ<strong>ระบาดวิทยา (4A)</strong> ร่วมกับ <code>1A</code></div>
                  </td>
                  <td>คณาจารย์และเพื่อน</td>
                  <td><strong>O / S / M / U</strong><br><span class="or-td-sub">(3A, 4A ทีม · 1A บุคคล)</span></td>
                </tr>
                <tr>
                  <td><strong>4. Continuous Prof. Development</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> <code>SRN 1</code> (ส่ง 9 ธ.ค. เพื่อรับคำแนะนำรายบุคคลระหว่างฝึกภาคสนาม)</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> <code>SRN 2</code> (ส่ง 30 ธ.ค.) ควบคู่ <code>ฟอร์ม 1A</code> ข้อ 2 ด้านความใฝ่รู้พัฒนาตน</div>
                  </td>
                  <td>อาจารย์และเพื่อน</td>
                  <td><strong>O / S / M / U</strong><br><span class="or-td-sub">(รายบุคคล)</span></td>
                </tr>
                <tr>
                  <td><strong>5. Habits, Attitudes, Moral &amp; Ethics</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> สังเกตและให้คำแนะนำด้านความรับผิดชอบและจริยธรรมวิชาชีพตลอดรายวิชา</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> ประเมินตาม <code>ฟอร์ม 1A</code> (ข้อ 6.1–6.3 ความรับผิดชอบ ซื่อสัตย์ น้ำใจ) สรุปใน <code>ฟอร์ม 2A</code></div>
                  </td>
                  <td>อาจารย์ที่ปรึกษา</td>
                  <td><strong>O / S / U</strong><br><span class="or-td-sub is-danger">(ระดับ U ลงทะเบียนใหม่)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `
    },
    {
      id: "s11-eval-written-exams",
      num: "12",
      section: "evaluation",
      sectionLabel: "Act III · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · EVALUATION",
      timeWindow: "09.17 – 09.20 น. (3 นาที)",
      kicker: "03 · COMPETENCY 1 DEEP DIVE · EPIDEMIOLOGY EXAM & HEALTH SYSTEMS EXAM",
      title: "รายละเอียดการสอบภาคทฤษฎี หมวดระบาดวิทยาและหมวดระบบสุขภาพ",
      keyTag: "แนวปฏิบัติการสอบ",
      keyMessageHtml:
        "ผ่านเกณฑ์แยกหมวดตั้งแต่ <strong>2.00 ขึ้นไป (ระดับ O &ge; 3.75)</strong> เข้าห้องสอบไม่เกิน <strong>15 นาทีหลังเริ่มสอบ</strong> และงดใช้อุปกรณ์อิเล็กทรอนิกส์หรือเอกสารพิมพ์",
      notes:
        "ชี้แจงโครงสร้างข้อสอบทั้ง 2 วัน วันอังคาร 8 ธ.ค. สอบระบาดวิทยาแบบไม่เปิดตำรา และวันอังคาร 22 ธ.ค. สอบระบบสุขภาพโดยอนุญาตให้นำกระดาษ A4 เขียนสรุปด้วยลายมือตนเองเข้าห้องสอบได้ 1 แผ่น (หน้าและหลัง) ตามสัดส่วนเนื้อหาทั้ง 5 วัตถุประสงค์ของระบบสุขภาพ",
      render: () => `
        <div class="or-infog-split is-s11-split">
          ${figPlate(
            "orient_s11_exam_vertical.png",
            "Vertical Comparison of Epidemiology Exam (Closed-Book) and Health Systems Exam (Open-Note A4)",
            ""
          )}

          <div class="or-grid-2 is-s11-grid" data-fit-group="cards">
            <div class="or-card is-white is-s11-card">
              <div>
                <span class="or-card-kicker">SUMMATIVE 2.1 · อ. 8 ธ.ค. 69 (09.00–12.00 น.)</span>
                <h3 class="or-card-title">Epidemiology Exam (Closed-Book)</h3>
                <p class="or-card-text is-s11-sub">ห้อง <code>2C2-02, 2C2-03</code> · เนื้อหา <code>EP1–EP9</code> (รวม 100%)</p>
              </div>
              <div class="or-stat-bar-list is-s11-bars">
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><code>EP2</code> การตรวจวินิจฉัย และ <code>EP3</code> อคติ</span><span>อย่างละ 15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:75%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><code>EP5</code> สอบสวนโรค และ <code>EP6</code> ภาระโรค</span><span>อย่างละ 15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:75%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><code>EP8</code> การศึกษาเชิงทดลอง (RCT Appraisal)</span><span>15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:55%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><code>EP4</code> รูปแบบวิจัยและค่าผลกระทบ (AR, PAR)</span><span>10%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:40%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><code>EP7</code> สำรวจชุมชน และ <code>EP9</code> เวชปฏิบัติอิงหลักฐาน</span><span>อย่างละ 7.5%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill" style="width:55%"></div></div></div>
              </div>
              <div class="or-s11-foot-badge is-blue">
                ข้อสอบแบบปิดตำรา · ผ่านเกณฑ์เมื่อได้คะแนนตั้งแต่ 2.00 ขึ้นไป (ระดับ O &ge; 3.75)
              </div>
            </div>

            <div class="or-card is-navy-tint is-s11-card">
              <div>
                <span class="or-card-kicker">SUMMATIVE 2.2 · อ. 22 ธ.ค. 69 (09.00–12.00 น.)</span>
                <h3 class="or-card-title">Health Systems Exam (Open Note A4)</h3>
                <p class="or-card-text is-s11-sub is-teal-sub">ห้อง <code>2C2-01..03</code> · ครอบคลุม <strong>5 วัตถุประสงค์ระบบสุขภาพ</strong> (รวม 100%)</p>
              </div>
              <div class="or-stat-bar-list is-s11-bars">
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><strong>1.</strong> สุขภาพ ปัจจัยกำหนดสุขภาพ และการป้องกันโรค (<code>HS1</code>)</span><span>20%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:76%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><strong>2.</strong> ระบบบริการสุขภาพและคุณลักษณะ <code>EQESaRR</code></span><span>25%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:94%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><strong>3.</strong> ศักยภาพชุมชนในการร่วมพัฒนาสุขภาพ</span><span>20%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:76%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><strong>4.</strong> การสร้างเสริมสุขภาพและกรอบ <code>COM-B</code> (<code>HS4</code>)</span><span>20%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:76%"></div></div></div>
                <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span><strong>5.</strong> บทบาทแพทย์ในการทำงานร่วมกับระบบสุขภาพ</span><span>15%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:58%"></div></div></div>
              </div>
              <div class="or-s11-foot-badge is-teal">
                นำกระดาษ A4 เขียนสรุปด้วยลายมือตนเองเข้าห้องสอบได้ 1 แผ่น (หน้าและหลัง) งดสิ่งพิมพ์และสำเนา
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s12-eval-practical-rubrics",
      num: "13",
      section: "evaluation",
      sectionLabel: "Act III · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · EVALUATION",
      timeWindow: "09.20 – 09.23 น. (3 นาที)",
      kicker: "03 · COMPETENCIES 2–5 · TEAM PRESENTATION, REFLECTION & INTEGRITY",
      title: "การประเมินภาคปฏิบัติ การนำเสนอผลงานทีม งานสะท้อนคิด และเจตคติวิชาชีพ",
      keyTag: "การสังเคราะห์ร่วมกัน",
      keyMessageHtml:
        "การนำเสนอหมวดระบบสุขภาพ (<code>ฟอร์ม 3A</code>) มุ่งให้ทีมใช้ <strong>การคิดเชิงระบบเชื่อมโยงทั้ง 5 วัตถุประสงค์เข้าด้วยกัน</strong> แทนการแบ่งหัวข้อรายงานแยกส่วน",
      notes:
        "ย้ำแนวทางการนำเสนอหมวดระบบสุขภาพ (ฟอร์ม 3A นำเสนอ 10 นาที แลกเปลี่ยน 20 นาที) ที่มุ่งให้ทีมใช้การคิดเชิงระบบร้อยเรียงทั้ง 5 วัตถุประสงค์ให้เห็นพลวัตของพื้นที่จริง ควบคู่กับการนำเสนอวิจัยระบาดวิทยา (ฟอร์ม 4A นำเสนอ 7 นาที แลกเปลี่ยน 18 นาที) งานสะท้อนคิด SRN 1–2 และการประเมินเจตคติวิชาชีพตามฟอร์ม 1A และ 2A",
      render: () => `
        <div class="or-grid-3 is-s12-grid" data-fit-group="pillars">
          <div class="or-card is-teal-tint or-visual-pillar-card">
            <div class="or-visual-pillar-img-box">
              <img data-base-img="orient_s12_col1.png" src="${IMG_DIR}/${resolveSlideImgFile("orient_s12_col1.png")}?v=${ASSET_VER}" alt="Reflective Growth SRN 1 and SRN 2 with Advisor Feedback" loading="eager" decoding="async" />
            </div>
            <div class="or-visual-pillar-copy">
              <span class="or-card-kicker">1 · COMPETENCY 4 · รายบุคคล</span>
              <h3 class="or-card-title">งานเขียนสะท้อนคิดพัฒนาตน (SRN 1 และ 2)</h3>
              <ul class="or-list is-s12-list">
                <li><strong><code>SRN 1</code> (เพื่อพัฒนา):</strong> ส่งพุธ <strong>9 ธ.ค. (ภายใน 17.00 น.)</strong> เพื่อรับคำแนะนำจากอาจารย์ที่ปรึกษา</li>
                <li><strong><code>SRN 2</code> (ตัดสินผล):</strong> ส่งพุธ <strong>30 ธ.ค. (ภายใน 17.00 น.)</strong> ทาง E-learning</li>
                <li><strong>รูปแบบไฟล์:</strong> PDF <strong>ไม่เกิน 5 หน้า A4</strong> อักษร <code>TH Sarabun New 16pt</code></li>
              </ul>
            </div>
          </div>

          <div class="or-card is-navy-tint or-visual-pillar-card">
            <div class="or-visual-pillar-img-box">
              <img data-base-img="orient_s12_col2.png" src="${IMG_DIR}/${resolveSlideImgFile("orient_s12_col2.png")}?v=${ASSET_VER}" alt="Team Presentation Connecting 5 Dots via Systems Thinking Linking Domain" loading="eager" decoding="async" />
            </div>
            <div class="or-visual-pillar-copy">
              <span class="or-card-kicker">2 · PRESENTATION · ผลงานร่วมของทีม</span>
              <h3 class="or-card-title">การนำเสนอเชื่อมโยงระบบสุขภาพและวิจัยชุมชน</h3>
              <ul class="or-list is-s12-list">
                <li><strong>ระบบสุขภาพ (3A · 29 ธ.ค.):</strong> นำเสนอ 10 นาที แลกเปลี่ยน 20 นาที โดยใช้<strong>การคิดเชิงระบบเชื่อมทั้ง 5 วัตถุประสงค์</strong></li>
                <li><strong>ระบาดวิทยา (4A · 30 ธ.ค.):</strong> นำเสนอสด 7 นาที แลกเปลี่ยน 18 นาที (งดใช้วิดีโอบันทึกล่วงหน้า)</li>
              </ul>
            </div>
          </div>

          <div class="or-card is-amber-tint or-visual-pillar-card">
            <div class="or-visual-pillar-img-box">
              <img data-base-img="orient_s12_col3.png" src="${IMG_DIR}/${resolveSlideImgFile("orient_s12_col3.png")}?v=${ASSET_VER}" alt="Professional Integrity Forms 1A and 2A" loading="eager" decoding="async" />
            </div>
            <div class="or-visual-pillar-copy">
              <span class="or-card-kicker">3 · COMPETENCY 2 และ 5 · รายบุคคล</span>
              <h3 class="or-card-title">ความซื่อสัตย์และเจตคติวิชาชีพ (ฟอร์ม 1A, 2A)</h3>
              <ul class="or-list is-s12-list">
                <li><strong>ฟอร์ม 1A:</strong> ความสุภาพอ่อนน้อม ใฝ่รู้ การทำงานร่วมกับผู้อื่น ความรับผิดชอบ น้ำใจ และ<strong>ความซื่อสัตย์ทางวิชาการ</strong> (เก็บข้อมูลจริง ไม่คัดลอกผลงาน และลงชื่อด้วยตนเอง)</li>
                <li><strong>การประเมินเพื่อนร่วมกลุ่มและฟอร์ม 2A:</strong> สรุปผลภาพรวมระดับ <strong>O / S / U</strong></li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s13-attendance-safety",
      num: "14",
      section: "action",
      sectionLabel: "Act IV · Conduct & Launch",
      actClass: "is-act-4",
      actLabel: "ACT IV · CONDUCT & SAFETY",
      timeWindow: "09.23 – 09.25 น. (2 นาที)",
      kicker: "04 · ATTENDANCE (≥ 80%), LEAVE QUOTAS (3d / 1.5d) & 6 SAFETY RULES",
      title: "เวลาเรียน สิทธิ์เข้าสอบ โควตาการลา และแนวทางดูแลความปลอดภัยภาคสนาม 6 ข้อ",
      keyTag: "สิทธิ์เข้าสอบ & ความปลอดภัย",
      keyMessageHtml:
        "นักศึกษาจะมีสิทธิ์เข้าสอบเมื่อมี <strong>เวลาเรียนไม่น้อยกว่าร้อยละ 80</strong> (ลาไม่เกิน <strong>3 วัน</strong> ช่วงก่อน-หลังภาคสนาม และช่วงภาคสนามลาได้ไม่เกิน <strong>1.5 วัน</strong>) พร้อมปฏิบัติตามระเบียบภาคสนาม 6 ข้อ",
      notes:
        "ชี้แจงเกณฑ์เวลาเรียนไม่น้อยกว่าร้อยละ 80 จึงมีสิทธิ์เข้าสอบ โควตาการลาช่วงก่อนและหลังภาคสนามรวมกันไม่เกิน 3 วัน ช่วงฝึกภาคสนามลาได้ไม่เกิน 1.5 วัน ช่วงเวลาลงชื่อเข้าเรียน (ก่อนเริ่มคาบ 15 นาที ถึงหลังเริ่มคาบ 15 นาที) และระเบียบการฝึกปฏิบัติงานนอกสถานที่ พ.ศ. 2561 ทั้ง 6 ข้อ ก่อนเข้าสู่ช่วง Live Quiz ทดสอบความเข้าใจเกณฑ์ O/S/M/U ในสไลด์ถัดไป",
      render: () => `
        <div class="or-infog-split is-s14-split">
          <div class="or-schematic-box is-s14-left" data-fit-solo="1">
            <div>
              <span class="or-card-kicker">SIGN-IN WINDOW &amp; LEAVE QUOTAS</span>
              <h3 class="or-card-title">การลงชื่อเข้าเรียน สิทธิ์เข้าสอบ และโควตาการลา</h3>
            </div>

            <div>
              <div class="or-s14-subhead">ช่วงเวลาลงชื่อเข้าเรียนประจำแต่ละคาบ</div>
              <div class="or-s14-signin-bar">
                <div class="is-open">ก่อนคาบ 15 นาที เปิดระบบ</div>
                <div class="is-norm">0–15 นาที ตรงเวลา</div>
                <div class="is-late">เกิน 15 นาที นับว่าสาย</div>
              </div>
            </div>

            <div class="or-stat-bar-list is-s14-bars">
              <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span>เวลาเรียนรวมตลอดรายวิชาที่มีสิทธิ์เข้าสอบ</span><span>&ge; 80%</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-teal" style="width:80%"></div></div></div>
              <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span>โควตาลาช่วงก่อนและหลังภาคสนามรวมกัน</span><span>&le; 3.0 วัน</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-amber" style="width:45%"></div></div></div>
              <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span>โควตาลาเฉพาะช่วงฝึกปฏิบัติงานภาคสนาม</span><span>&le; 1.5 วัน</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-crimson" style="width:24%"></div></div></div>
            </div>

            <div class="or-card is-amber-tint is-s14-note">
              <p class="or-card-text"><strong>การขอลา:</strong> ยื่นใบลาล่วงหน้าและได้รับอนุมัติจากอาจารย์ที่ปรึกษาก่อนเสมอ (กรณีเจ็บป่วยกะทันหันในพื้นที่ให้รีบแจ้งอาจารย์ทันที)</p>
            </div>
          </div>

          <div class="or-s14-right-stack">
            ${figPlate("orient_s14_safety_shields.png", "6 Fieldwork Safety and Professionalism Shields", "")}
            <div class="or-card is-white is-s14-shield-note" data-fit-solo="1">
              <p class="or-card-text">
                <strong>ระเบียบภาคสนาม พ.ศ. 2561:</strong> (1) <strong>งดนำรถยนต์หรือพาหนะส่วนตัวไปใช้</strong> · (2) <strong>งดออกนอกพื้นที่หรือเดินทางลำพัง</strong> · (3) งดให้บุคคลภายนอกเข้าเยี่ยมในที่พัก · (4) แต่งกายสุภาพและติดป้ายชื่อ · (5) <strong>งดเครื่องดื่มแอลกอฮอล์ สารเสพติด และการพนัน</strong> · (6) เคารพสิทธิผู้ป่วยและชุมชนในการสื่อสารออนไลน์
              </p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s14-quiz-osmu",
      num: "15",
      section: "evaluation",
      sectionLabel: "Act IV · Live Quiz O/S/M/U",
      actClass: "is-act-4",
      actLabel: "LIVE QUIZ · O / S / M / U",
      timeWindow: "09.25 – 09.27 น. (กิจกรรมสด)",
      kicker: "04 · INTERACTIVE KAHOOT QUIZ · DO'S & DON'TS & ATTITUDE (O · S · M · U)",
      title: "Live Quiz ทวนสอบความเข้าใจ: เวลาเรียน พฤติกรรมไม่พึงประสงค์ และเกณฑ์ O · S · M · U",
      keyTag: "ร่วมตอบสดพร้อมกัน",
      keyMessageHtml:
        "ผู้ที่สแกน QR Code แล้วกดตอบคำถาม 4 สีบนมือถือ/แท็บเล็ตได้ทันที เพื่อ <strong>Recheck ความเข้าใจก่อนชี้แจงเกณฑ์ตัดสิน O · S · M · U ฉบับสมบูรณ์ในสไลด์ถัดไป</strong>",
      notes:
        "กดปุ่มเริ่มยิงคำถาม Quiz O/S/M/U บนสไลด์นี้เพื่อให้ทั้งนักศึกษาและคณาจารย์ที่สแกน QR Code ร่วมกันกดตอบสดบนมือถือ ทดสอบความเข้าใจเรื่องเวลาเรียน ≥ 80% โควตาลา 3 วัน / 1.5 วัน ประกาศคณะฯ พ.ศ. 2567 (M/U) แบบประเมินเพื่อนในกลุ่ม การสอบซ่อมแยกวิชา (< 2.00) ผลต่อเกียรตินิยม และการลงทะเบียนเรียนใหม่ แล้วกดไปสไลด์ที่ 15 เพื่อสรุปเกณฑ์ O/S/M/U อย่างเป็นทางการ",
      isLiveQuizSlide: true,
      render: () => `
        <div class="orl-s14-quiz-wrap" data-orl-slide-mount="quiz">
          ${
            window.RACM_ORIENTATION_LIVE && typeof window.RACM_ORIENTATION_LIVE.renderEmbeddedQuizSlideHtml === "function"
              ? window.RACM_ORIENTATION_LIVE.renderEmbeddedQuizSlideHtml({ viewMode: state.viewMode })
              : ""
          }
        </div>
      `
    },
    {
      id: "s15-osmu-criteria",
      num: "16",
      section: "evaluation",
      sectionLabel: "Act IV · เกณฑ์ O / S / M / U",
      actClass: "is-act-3",
      actLabel: "OFFICIAL CRITERIA · O · S · M · U",
      timeWindow: "09.27 – 09.28 น. (1 นาที)",
      kicker: "04 · SECTION 12–13 · ATTENDANCE, RAMA ATTITUDE RULES B.E. 2567 & FINAL GRADE O / S / M / U",
      title: "ชี้แจงเกณฑ์เวลาเรียน การประเมินด้านเจตคติ (พ.ศ. 2567) และเกณฑ์ตัดสิน O · S · M · U",
      keyTag: "หมายเหตุสำคัญ",
      keyMessageHtml:
        "ผลการประเมินเจตคติและพฤติกรรมได้ <strong><code>U</code> ต้องลงทะเบียนเรียนใหม่</strong> · การสอบซ่อมแยกวิชา [แต้ม <strong>&lt; 2.00</strong>] ให้โอกาสแก้ตัว <strong>1 ครั้ง</strong> (ผ่านได้เกรด <strong><code>S</code></strong> และ<strong>มีผลต่อการได้รับเกียรตินิยม</strong>)",
      notes:
        "ชี้แจงสรุปเกณฑ์ตามคู่มือรายวิชาหัวข้อเวลาเรียนและข้อ 13 การประเมินด้านเจตคติ: (1) เวลาเรียน ≥ ร้อยละ 80 จึงมีสิทธิ์เข้าสอบ ลาช่วงก่อน-หลังภาคสนาม ≤ 3 วัน ภาคสนาม ≤ 1.5 วัน (2) อ้างอิงประกาศคณะฯ เรื่องหลักเกณฑ์การประเมินเจตคติเกี่ยวกับพฤติกรรมที่ไม่พึงประสงค์ พ.ศ. 2567 และใช้แบบประเมินจากเพื่อนในกลุ่มประกอบการพิจารณาของอาจารย์ (3) เกรดสุดท้ายได้ O มาจากเจตคติภาพรวม O + สอบทฤษฎีได้ O ทั้งสองวิชา + ไม่มีการสอบซ่อม (4) แต้มต่ำกว่า 2.00 ต้องสอบซ่อมแยกวิชาระบบฯ/ระบาดฯ โอกาสแก้ตัว 1 ครั้ง ผ่านได้เกรด S มีผลต่อเกียรตินิยม หากไม่ผ่านหรือเจตคติได้ U ต้องลงทะเบียนเรียนใหม่",
      render: () => `
        <div class="or-grid-2 is-s15-osmu-grid" data-fit-group="cards">
          <div class="or-card is-teal-tint">
            <span class="or-card-kicker">① เวลาเรียน · สิทธิ์เข้าสอบ &amp; โควตาการลา</span>
            <h3 class="or-card-title">เงื่อนไขเวลาเรียนไม่น้อยกว่าร้อยละ 80</h3>
            <ul class="or-list">
              <li><strong>สิทธิ์เข้าสอบ:</strong> นักศึกษาจะมีสิทธิ์เข้าสอบได้ต่อเมื่อมี <strong>เวลาเรียนไม่น้อยกว่าร้อยละ 80</strong></li>
              <li><strong>ช่วงก่อนและหลังภาคสนาม:</strong> ลาได้รวมกัน <strong>ไม่เกิน 3 วัน</strong></li>
              <li><strong>ช่วงฝึกภาคสนาม:</strong> ลาได้ <strong>ไม่เกิน 1.5 วัน</strong> (ยื่นใบลาและได้รับอนุมัติจากอาจารย์ที่ปรึกษา)</li>
            </ul>
          </div>

          <div class="or-card is-amber-tint">
            <span class="or-card-kicker">② ข้อ 13 การประเมินด้านเจตคติ · ประกาศคณะฯ พ.ศ. 2567</span>
            <h3 class="or-card-title">พฤติกรรมไม่พึงประสงค์ (M / U) &amp; เพื่อนประเมิน</h3>
            <ul class="or-list">
              <li><strong>แบบประเมินจากเพื่อนในกลุ่ม:</strong> เป็นข้อมูลที่อาจารย์ใช้ประกอบการพิจารณาประเมินผลนักศึกษา</li>
              <li><strong>ระดับ <code>M</code> (ควรปรับปรุง):</strong> สายเกิน 15 นาที <strong>4 ครั้ง</strong> · ขาดเรียนไม่ลา <strong>&ge; 2 ครั้ง</strong> · ส่งงานช้า <strong>2 ครั้ง</strong> <em>(ได้ M &ge; 2 หมวด หรือซ้ำหมวดเดิม &rarr; ปรับเป็น <strong>U</strong>)</em></li>
              <li><strong>ระดับ <code>U</code> (ไม่ผ่าน):</strong> สาย <strong>&ge; 5 ครั้ง</strong> · ส่งงานช้า <strong>&ge; 3 ครั้ง</strong> · ไม่ซื่อสัตย์ (เซ็นชื่อแทนกัน/เมคข้อมูล/ลอกงาน) หรือฝ่าฝืนระเบียบภาคสนาม</li>
            </ul>
          </div>

          <div class="or-card is-navy-tint">
            <span class="or-card-kicker">③ การตัดสินเกรดสุดท้าย O / S &amp; การสอบซ่อมแยกวิชา</span>
            <h3 class="or-card-title">เกณฑ์ได้เกรด O และการสอบแก้ตัว [แต้ม &lt; 2.00]</h3>
            <ul class="or-list">
              <li><strong>เกรดสุดท้ายได้ <code>O</code>:</strong> มาจากคะแนนประเมินภาพรวมของ<strong>เจตคติและพฤติกรรมได้ <code>O</code></strong> + <strong>ผลสอบทฤษฎีได้ <code>O</code></strong> ทั้งวิชาระบบฯ และระบาดฯ (&ge; 3.75) + <strong>ไม่มีการสอบซ่อม</strong></li>
              <li><strong>การสอบซ่อม (แยกวิชาระบบฯ / ระบาดฯ):</strong> วิชาที่ได้ <strong>[แต้มต่ำกว่า 2.00] ต้องสอบซ่อม</strong> ให้โอกาสแก้ตัวได้ <strong>1 ครั้ง</strong> &rarr; ถ้าสอบผ่านจะได้รับ<strong>เกรดเป็น <code>S</code></strong></li>
            </ul>
          </div>

          <div class="or-card is-rose-tint">
            <span class="or-card-kicker">④ การลงทะเบียนเรียนใหม่ &amp; ผลต่อเกียรตินิยม</span>
            <h3 class="or-card-title">กรณีไม่ผ่านรายวิชาและข้อควรระวังสำคัญ</h3>
            <ul class="or-list">
              <li><strong>สอบซ่อมไม่ผ่าน:</strong> หากสอบแก้ตัว 1 ครั้งแล้วยังไม่ผ่านเกณฑ์ <strong>ต้องลงทะเบียนเรียนใหม่</strong></li>
              <li><strong>เจตคติได้ <code>U</code>:</strong> ผลการประเมินเจตคติและพฤติกรรมได้ <strong><code>U</code> ต้องลงทะเบียนเรียนใหม่ทันที</strong> (ไม่มีการสอบซ่อมด้านเจตคติ)</li>
              <li><strong>หมายเหตุสำคัญ:</strong> <strong>หากนักศึกษามีการสอบซ่อม จะมีผลต่อการได้รับเกียรตินิยม</strong></li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "s16-grading-milestones",
      num: "17",
      section: "evaluation",
      sectionLabel: "Act IV · ผังเกรด & 7 กำหนดการ",
      actClass: "is-act-3",
      actLabel: "ACT IV · FLOW & 7 MILESTONES",
      timeWindow: "09.28 – 09.29 น. (สรุปกำหนดการ)",
      kicker: "04 · FINAL GRADE FLOWCHART & 7 KEY ASSESSMENT MILESTONES",
      title: "ผังสรุปการตัดสินเกรดรายวิชา และกำหนดการสอบ–ส่งงานสำคัญ 7 รายการ",
      keyTag: "ข้อควรจำสำคัญ",
      keyMessageHtml:
        "ก่อนส่งงานสะท้อนคิด <code>SRN 1</code> (9 ธ.ค.) และ <code>SRN 2</code> (30 ธ.ค.) ในระบบ E-learning นักศึกษาต้องทำ <strong>แบบประเมินการสอนและแบบประเมินรายวิชา</strong> ให้ครบถ้วน",
      notes:
        "ทบทวนผังไหลการตัดสินเกรด O, S, U และตารางกำหนดการสอบ-ส่งงานสำคัญทั้ง 7 รายการตลอด 6 สัปดาห์ พร้อมย้ำการทำแบบประเมินออนไลน์ก่อนส่ง SRN 1 และ SRN 2",
      render: () => `
        <div class="or-top-fig-stack is-s13-stack">
          ${figPlate(
            "orient_s13_grading_flow.png",
            "Final Grade Criteria Flow: Grade O (Outstanding), Grade S (Satisfactory), and Retest or Grade U",
            ""
          )}

          <div class="or-infog-split is-s13-bottom">
            <div class="or-stack-col" data-fit-group="cards">
              <div class="or-card is-teal-tint">
                <span class="or-card-kicker">เกณฑ์ระดับดีเยี่ยม (O) และระดับผ่านมาตรฐาน (S)</span>
                <ul class="or-list is-s13-list">
                  <li><strong>เกรด O:</strong> สอบได้ <strong>&ge; 3.75</strong> ทั้งหมวดระบาดวิทยาและระบบสุขภาพ ควบคู่ผลประเมิน <strong>เจตคติภาพรวม (ฟอร์ม 2A) ระดับ O</strong> โดยไม่เคยสอบซ่อม</li>
                  <li><strong>เกรด S:</strong> สอบผ่านเกณฑ์ทั้งสองหมวด (<strong>&ge; 2.00</strong>) และผลประเมิน <strong>เจตคติได้ระดับ O หรือ S</strong></li>
                </ul>
              </div>

              <div class="or-card is-rose-tint">
                <span class="or-card-kicker">การสอบซ่อมแยกวิชาและการลงทะเบียนเรียนใหม่ (U)</span>
                <ul class="or-list is-s13-list">
                  <li><strong>สอบซ่อมได้ 1 ครั้ง:</strong> แยกวิชาระบบฯ / ระบาดฯ ที่ได้ต่ำกว่า <strong>2.00</strong> สอบผ่านได้เกรด <strong>S</strong> <em>(มีผลต่อการได้รับเกียรตินิยม)</em></li>
                  <li><strong>ลงทะเบียนเรียนใหม่:</strong> สอบซ่อมไม่ผ่าน หรือผลประเมินเจตคติและพฤติกรรมได้ <strong>U</strong></li>
                </ul>
              </div>
            </div>

            <div class="or-table-wrap is-s13-table" data-fit-table="1">
              <table class="or-table">
                <thead>
                  <tr><th>กำหนดการสอบและส่งงานสำคัญ 7 รายการ</th><th>วัน เวลา และช่องทางดำเนินการ</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>1. สอบข้อเขียนระบาดวิทยา (EP1–9)</strong></td><td>อ. 8 ธ.ค. 69 (09.00–12.00 น.) · <code>2C2-02..03</code></td></tr>
                  <tr><td><strong>2. ส่งงานสะท้อนคิด SRN 1</strong> พร้อมประเมินภาคทฤษฎี</td><td>พ. 9 ธ.ค. 69 (ภายใน 17.00 น.) · E-learning</td></tr>
                  <tr><td><strong>3. สอบข้อเขียนระบบสุขภาพ (โน้ต A4)</strong></td><td>อ. 22 ธ.ค. 69 (09.00–12.00 น.) · <code>2C2-01..03</code></td></tr>
                  <tr><td><strong>4. นำเสนอผลงานทีม หมวดระบบสุขภาพ (3A)</strong></td><td>อ. 29 ธ.ค. 69 (08.30–15.30 น.) · <code>2C2-03</code></td></tr>
                  <tr><td><strong>5. นำเสนอผลงานทีม หมวดระบาดวิทยา (4A)</strong></td><td>พ. 30 ธ.ค. 69 (08.30–13.00 น.) · <code>2C2-03</code></td></tr>
                  <tr><td><strong>6. ส่งงานสะท้อนคิด SRN 2</strong> พร้อมประเมินรายวิชา</td><td>พ. 30 ธ.ค. 69 (ภายใน 17.00 น.) · E-learning</td></tr>
                  <tr><td><strong>7. ส่งไฟล์สไลด์นำเสนอและรายงานสำรวจชุมชน</strong></td><td>พ. 30 ธ.ค. 69 (ภายใน 17.00 น.) · Google Form</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s17-digital-launch",
      num: "18",
      section: "action",
      sectionLabel: "Act IV · Conduct & Launch",
      actClass: "is-act-4",
      actLabel: "ACT IV · LAUNCHPAD",
      timeWindow: "09.29 – 09.30 น. (1 นาที)",
      kicker: "04 · DIGITAL ECOSYSTEM HUB & WEEK-1 ACTION PLAN",
      title: "ระบบสนับสนุนการเรียนรู้ดิจิทัล RACM 303 และแนวทางเตรียมพร้อมสัปดาห์ที่ 1",
      keyTag: "ก้าวต่อไป · 09.30 น.",
      keyMessageHtml:
        "ยินดีต้อนรับสู่ <strong>RACM 303 ปีการศึกษา 2569</strong> เชื่อมปฏิทินเรียนเข้ากับอุปกรณ์ส่วนตัวเพื่อเตรียมพร้อมเข้าสู่คาบแรก <code>ST1</code> เวลา <strong>09.30 น.</strong>",
      notes:
        "สรุปปิดท้ายคาบปฐมนิเทศ แนะนำ 3 ช่องทางดิจิทัลหลักของรายวิชา ชวนให้นักศึกษาผูกกลุ่มเพื่อซิงค์ปฏิทิน .ics เข้ามือถือ เตรียมอ่านบทเรียน HS1 ล่วงหน้าสำหรับวันพรุ่งนี้ และส่งต่อเข้าสู่คาบ ST1 เวลา 09.30 น. ณ ห้อง 2C2-03",
      render: () => `
        <div class="or-infog-split is-fig-left">
          <div class="or-s15-left-stack">
            ${figPlate("orient_s15_digital_hub.png", "RACM 303 Connected Digital Learning Hub", "")}
            <div class="or-card is-navy-tint is-s15-hub-note" data-fit-solo="1">
              <p class="or-card-text">
                <strong>1. Smart Portal:</strong> ตารางเรียนเฉพาะกลุ่ม ปฏิทิน <code>.ics</code> บทเรียนนำทาง 5 ขั้น ลิงก์ Zoom และระบบใบลา<br>
                <strong>2. RAMA E-learning (<code>id=398</code>):</strong> ทำแบบฝึกหัดระบาดวิทยาและส่งงานสะท้อนคิด <code>SRN 1–2</code><br>
                <strong>3. Google Form ประจำปี 2569:</strong> ส่งไฟล์สไลด์นำเสนอทีม (<code>3A, 4A</code>) และรายงานการสำรวจชุมชน
              </p>
            </div>
          </div>

          <div class="or-inspector-box is-teal is-s15-right">
            <div>
              <span class="or-card-kicker">WEEK 1 ACTION PLAN · เริ่มต้นการเรียนรู้สัปดาห์ที่ 1</span>
              <h3 class="or-card-title">4 กิจกรรมสำคัญในช่วงเริ่มต้นรายวิชา</h3>
            </div>

            <div class="or-stack-col is-s15-steps" data-fit-group="cards">
              <div class="or-card is-white is-s15-step">
                <span class="or-card-kicker">① วันนี้ · 09.30 – 12.00 น. (ห้อง 2C2-03)</span>
                <p class="or-card-text"><strong>เรียนคาบแรก <code>ST1</code>: ระบบซับซ้อนและการคิดเชิงระบบในระบบสุขภาพ</strong></p>
              </div>
              <div class="or-card is-white is-s15-step">
                <span class="or-card-kicker">② วันนี้ · 13.30 – 16.30 น. (ห้อง 2C2-03)</span>
                <p class="or-card-text"><strong>ร่วมเสวนาจากข้างเตียงสู่ระบบสุขภาพ สุขภาพโลก และการวิจัยระบบสุขภาพ</strong></p>
              </div>
              <div class="or-card is-white is-s15-step">
                <span class="or-card-kicker">③ เย็นวันนี้ · เตรียมตัวล่วงหน้าก่อนเข้าชั้นเรียนพรุ่งนี้</span>
                <p class="or-card-text"><strong>ศึกษาเอกสารและตอบคำถามนำ <code>HS1</code> ก่อนเข้าฟังบรรยายพรุ่งนี้ 09.00 น. และกลุ่มย่อย 10.10 น.</strong></p>
              </div>
              <div class="or-card is-white is-s15-step">
                <span class="or-card-kicker">④ พฤหัสบดี 26 พ.ย. · 13.30 – 16.30 น.</span>
                <p class="or-card-text"><strong>พบอาจารย์ที่ปรึกษาประจำกลุ่มโรงพยาบาลแหล่งฝึกทั้ง 9 แห่ง ในชั่วโมงกลุ่มย่อยครั้งที่ 1</strong></p>
              </div>
            </div>
          </div>
        </div>
      `
    }
  ];

  const SECTION_FILTERS = [
    { id: "all", labelTh: "ทั้งหมด (18)", labelEn: "All Slides (18)" },
    { id: "intro", labelTh: "เปิดเรื่อง & QR Lobby (1)", labelEn: "Opening & Lobby (1)" },
    { id: "objectives", labelTh: "Act I · รากฐานและเป้าหมาย (5)", labelEn: "Act I · Heritage & Why (5)" },
    { id: "experience", labelTh: "Act II · เส้นทางเรียนรู้ (4)", labelEn: "Act II · Experience (4)" },
    { id: "evaluation", labelTh: "Act III · วัดผล & Quiz O/S/M/U (6)", labelEn: "Act III · Evaluation & O/S/M/U (6)" },
    { id: "action", labelTh: "Act IV · เวลาเรียน & ก้าวแรก (2)", labelEn: "Act IV · Conduct & Launch (2)" }
  ];

  /* ---------- Per-Frame Binary-Search Auto-Fit Typography & Multi-Device Reflow ---------- */
  function isScrollReflowDevice() {
    const w = window.innerWidth || 1024;
    const h = window.innerHeight || 768;
    if (w <= 760) return true;
    if (h <= 520) return true;
    if (w <= 1040 && w / Math.max(1, h) < 1.32) return true;
    return false;
  }

  function isPortraitMobileMode() {
    return isScrollReflowDevice();
  }

  function findMaxScaleForBox(el, checkFn, minS, maxS, safetyFactor) {
    let lo = minS;
    let hi = maxS;
    for (let step = 0; step < 12; step++) {
      const mid = (lo + hi) * 0.5;
      el.style.setProperty("--fit-scale", mid.toFixed(4));
      if (checkFn([el])) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return Math.max(minS, lo * safetyFactor);
  }

  function binarySearchUniformScale(els, checkFn, minS, maxS, safetyFactor) {
    let lo = minS;
    let hi = maxS;
    for (let step = 0; step < 12; step++) {
      const mid = (lo + hi) * 0.5;
      for (let i = 0; i < els.length; i++) {
        els[i].style.setProperty("--fit-scale", mid.toFixed(4));
      }
      if (checkFn(els)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    const finalScale = Math.max(minS, lo * safetyFactor);
    for (let i = 0; i < els.length; i++) {
      els[i].style.setProperty("--fit-scale", finalScale.toFixed(4));
    }
  }

  function fitHarmonizedCardGroup(els, minS, maxS, safetyFactor, maxSiblingSpread) {
    if (!els.length) return;
    const rawScales = els.map((el) => findMaxScaleForBox(el, boxesFitCleanly, minS, maxS, safetyFactor));
    const minGroupScale = Math.min.apply(null, rawScales);
    const cap = minGroupScale * (maxSiblingSpread || 1.24);
    for (let i = 0; i < els.length; i++) {
      const s = Math.min(rawScales[i], cap);
      els[i].style.setProperty("--fit-scale", s.toFixed(4));
    }
  }

  function boxesFitCleanly(els) {
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (el.clientHeight <= 0 || el.clientWidth <= 0) continue;
      if (el.scrollHeight > el.clientHeight + 1) return false;
      if (el.scrollWidth > el.clientWidth + 1) return false;
    }
    return true;
  }

  function tablesFitCleanly(wraps) {
    for (let i = 0; i < wraps.length; i++) {
      const w = wraps[i];
      const tbl = w.querySelector(".or-table");
      if (!tbl || w.clientHeight <= 0 || w.clientWidth <= 0) continue;
      if (tbl.offsetHeight > w.clientHeight - 1) return false;
      if (w.scrollHeight > w.clientHeight + 1) return false;
      if (tbl.scrollWidth > w.clientWidth + 1) return false;
    }
    return true;
  }

  function fitSingleSlideCanvas(canvas) {
    if (
      !canvas ||
      canvas.classList.contains("is-live-canvas") ||
      canvas.getAttribute("data-slide-id") === "s14-quiz-osmu"
    ) {
      return;
    }
    const allScaled = canvas.querySelectorAll(
      ".or-card, .or-visual-pillar-copy, .or-table-wrap, .or-schematic-box, .or-cover-kpi, .or-cover-act-chip"
    );
    if (isPortraitMobileMode() && !document.body.classList.contains("is-printing-orientation-deck")) {
      allScaled.forEach((el) => el.style.removeProperty("--fit-scale"));
      return;
    }
    if (canvas.clientWidth < 120 || canvas.clientHeight < 80) return;

    canvas.setAttribute("data-measuring", "1");

    // 1. Cover Slide KPI tiles & Act chips
    if (canvas.classList.contains("is-cover-canvas")) {
      const kpis = Array.from(canvas.querySelectorAll(".or-cover-kpi"));
      if (kpis.length) binarySearchUniformScale(kpis, boxesFitCleanly, 0.58, 1.55, 0.96);
      const acts = Array.from(canvas.querySelectorAll(".or-cover-act-chip"));
      if (acts.length) fitHarmonizedCardGroup(acts, 0.58, 1.75, 0.96, 1.16);
      canvas.removeAttribute("data-measuring");
      return;
    }

    // 2. Harmonized Card Groups (fills each frame ~93%-96% while keeping sibling fonts cohesive!)
    canvas.querySelectorAll("[data-fit-group]").forEach((grp) => {
      const kind = grp.getAttribute("data-fit-group");
      let targets = [];
      let spread = 1.24;
      if (kind === "pillars") {
        targets = Array.from(grp.querySelectorAll(":scope > .or-visual-pillar-card > .or-visual-pillar-copy"));
        spread = 1.24;
      } else if (kind === "s02-takeaways") {
        targets = Array.from(grp.querySelectorAll(":scope > .or-s02-flow-card > .or-s02-takeaway-box"));
        spread = 1.32;
      } else {
        targets = Array.from(grp.querySelectorAll(":scope > .or-card"));
        spread = 1.24;
      }
      if (targets.length) {
        fitHarmonizedCardGroup(targets, 0.58, 2.20, 0.965, spread);
      }
    });

    // 3. Standalone Fixed-Track Boxes
    canvas.querySelectorAll("[data-fit-solo]").forEach((box) => {
      const s = findMaxScaleForBox(box, boxesFitCleanly, 0.58, 2.05, 0.95);
      box.style.setProperty("--fit-scale", s.toFixed(4));
    });

    // 4. Full-Space Tables (Slides 09, 10, 13)
    canvas.querySelectorAll("[data-fit-table]").forEach((tw) => {
      const s = findMaxScaleForBox(tw, tablesFitCleanly, 0.56, 1.85, 0.968);
      tw.style.setProperty("--fit-scale", s.toFixed(4));
    });

    canvas.removeAttribute("data-measuring");
  }

  function fitAllVisibleCanvases() {
    const modal = document.getElementById("orientationDeckModal");
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
          btn.classList.toggle("is-running", state.timerRunning && state.timerSeconds <= 3600);
          btn.classList.toggle("is-overtime", state.timerSeconds > 3600);
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
              <span class="or-cover-kicker">Course Orientation · พุธ 25 พฤศจิกายน 2569 · 08.30 – 09.30 น.</span>
              <h2 class="or-cover-h1">${esc(slide.title)}</h2>
              <div class="or-top-key-banner is-cover-key">
                <span class="or-top-key-text">${slide.keyMessageHtml}</span>
              </div>
            </div>

            <div class="or-cover-kpi-row">
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val" data-count-to="169">169</span>
                <span class="or-cover-kpi-lbl">นศพ. ชั้นปีที่ 3</span>
              </div>
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val" data-count-to="6">6</span>
                <span class="or-cover-kpi-lbl">สัปดาห์เรียนรู้</span>
              </div>
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val" data-count-to="9">9</span>
                <span class="or-cover-kpi-lbl">โรงพยาบาลแหล่งฝึก</span>
              </div>
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val" data-count-to="5">5</span>
                <span class="or-cover-kpi-lbl">สมรรถนะหลัก</span>
              </div>
            </div>

            <div class="or-cover-acts-grid">
              <div class="or-cover-act-chip"><strong>Act I · Why HSS</strong> เสาหลักที่ 3 และวัตถุประสงค์ระบบสุขภาพทั้ง 5 ด้าน</div>
              <div class="or-cover-act-chip"><strong>Act II · Journey</strong> เส้นทางเรียนรู้ 6 สัปดาห์ ณ โรงพยาบาลแหล่งฝึก 9 แห่ง</div>
              <div class="or-cover-act-chip"><strong>Act III · Mastery</strong> การประเมินผลตามสมรรถนะหลัก 5 ด้าน</div>
              <div class="or-cover-act-chip"><strong>Act IV · Launch</strong> แนวปฏิบัติความปลอดภัย 6 ข้อ และก้าวแรกสัปดาห์ที่ 1</div>
            </div>
          </div>

          <div class="or-cover-right-col is-aura-stage" data-orl-slide-mount="cover">
            ${
              window.RACM_ORIENTATION_LIVE && typeof window.RACM_ORIENTATION_LIVE.renderCoverCardHtml === "function"
                ? window.RACM_ORIENTATION_LIVE.renderCoverCardHtml({ viewMode: state.viewMode, ioTheme: getEffectiveIoTheme() })
                : figPlate(
                    "orient_s01_hero.png",
                    "Bedside Care connected to Community & Livelihood and Health Systems Science",
                    "",
                    "is-cover-hero"
                  )
            }
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
          <span class="or-cover-code-chip">${SLIDES.length} Slides · 16:9</span>
        </div>
      </div>
    `;
  }

  function renderSingleSlideCanvasHtml(slide, idx, animateDeck) {
    const animCls = animateDeck ? " is-keynote-animated" : "";
    const ioTheme = getEffectiveIoTheme();
    if (slide.isCover) {
      return `
        <article class="or-slide-canvas is-io-pitch is-cover-canvas${animCls}" data-io-theme="${ioTheme}" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
          ${renderCoverSlideHtml(slide)}
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
          <span class="or-sld-foot-course">RACM 303 · Community Medicine &amp; Health Systems Science</span>
          <span class="or-sld-foot-num">${String(idx + 1).padStart(2, "0")} / ${SLIDES.length}</span>
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

    // Multi-Touch Pinch-Zoom In/Out + Double-Tap Zoom + Single-Finger Swipe (within bounded slide!)
    let touchStartX = 0;
    let touchStartY = 0;
    let ignoreSwipe = false;
    let hadMultiTouch = false;
    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    function getTouchDist(t0, t1) {
      return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    }

    modal.addEventListener(
      "touchstart",
      (ev) => {
        if (!state.isOpen || (state.viewMode !== "deck" && state.viewMode !== "live") || !ev.touches) return;
        if (ev.touches.length >= 2) {
          hadMultiTouch = true;
          ignoreSwipe = true;
          pinchStartDist = Math.max(20, getTouchDist(ev.touches[0], ev.touches[1]));
          pinchStartZoom = state.zoomScale || 1;
          return;
        }
        if (ev.touches.length === 1) {
          hadMultiTouch = false;
          const t0 = ev.touches[0];
          touchStartX = t0.clientX;
          touchStartY = t0.clientY;
          const inInteractiveZone =
            ev.target &&
            ev.target.closest &&
            ev.target.closest(
              ".or-table-wrap, .or-filmstrip, .or-tools-popover, .orl-players-wall, .orl-chips-stream, .orl-diag-list, input, select, textarea"
            );
          ignoreSwipe = Boolean(inInteractiveZone) || (state.zoomScale || 1) > 1.03;
        }
      },
      { passive: true }
    );

    modal.addEventListener(
      "touchmove",
      (ev) => {
        if (!state.isOpen || (state.viewMode !== "deck" && state.viewMode !== "live") || !ev.touches) return;
        if (ev.touches.length >= 2 && pinchStartDist > 0) {
          hadMultiTouch = true;
          ignoreSwipe = true;
          ev.preventDefault();
          const curDist = getTouchDist(ev.touches[0], ev.touches[1]);
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

        // Double-tap on slide figure/canvas (outside buttons & inputs) toggles 1.0x <-> 1.75x zoom!
        if (Math.abs(dx) < 16 && Math.abs(dy) < 16) {
          const isControl =
            ev.target &&
            ev.target.closest &&
            ev.target.closest("button, a, input, select, textarea, label, .or-deck-topbar, .or-deck-bottombar");
          if (!isControl && (state.viewMode === "deck" || state.viewMode === "live")) {
            const now = Date.now();
            if (now - lastTapTime < 310 && Math.hypot(t1.clientX - lastTapX, t1.clientY - lastTapY) < 36) {
              const targetZ = (state.zoomScale || 1) > 1.08 ? 1 : 1.75;
              setZoomScale(targetZ, t1.clientX, t1.clientY);
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
          if (dx < 0 && state.slideIdx < SLIDES.length - 1) {
            goToSlide(state.slideIdx + 1);
          } else if (dx > 0 && state.slideIdx > 0) {
            goToSlide(state.slideIdx - 1);
          }
        }
      },
      { passive: true }
    );

    modal.addEventListener(
      "wheel",
      (ev) => {
        if (!state.isOpen || (state.viewMode !== "deck" && state.viewMode !== "live")) return;
        if (ev.ctrlKey || ev.metaKey) {
          ev.preventDefault();
          const factor = ev.deltaY < 0 ? 1.12 : 0.89;
          setZoomScale((state.zoomScale || 1) * factor, ev.clientX, ev.clientY);
        }
      },
      { passive: false }
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
      } else if (ev.key === "k" || ev.key === "K") {
        ev.preventDefault();
        state.autoPlay = false;
        state.viewMode = state.viewMode === "live" ? "deck" : "live";
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
    document.body.classList.add("is-printing-orientation-deck");
    renderModal();
    setTimeout(() => {
      fitAllVisibleCanvases();
      window.print();
      setTimeout(() => {
        document.body.classList.remove("is-printing-orientation-deck");
        state.viewMode = prevMode;
        renderModal();
      }, 300);
    }, 140);
  }

  function togglePresentationMode() {
    const modal = ensureModalElement();
    state.toolsMenuOpen = false;
    if (!state.presentationMode) {
      if (state.viewMode !== "live") state.viewMode = "deck";
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

  function applyZoomToCurrentSlide(prevZoom, focalX, focalY) {
    const vp = document.getElementById("orDeckViewport");
    if (!vp) return;
    const z = state.zoomScale || 1;
    vp.classList.toggle("is-zoomed", z > 1.02 || z < 0.98);
    document.querySelectorAll("[data-or-zoom-label]").forEach((el) => {
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

    // Measure natural unzoomed layout dimensions
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

  function syncHostSlideToLive() {
    if (window.RACM_ORIENTATION_LIVE && typeof window.RACM_ORIENTATION_LIVE.notifyHostSlide === "function") {
      window.RACM_ORIENTATION_LIVE.notifyHostSlide(state.slideIdx, SLIDES[state.slideIdx]);
    }
  }

  function goToSlide(idx) {
    state.slideIdx = Math.max(0, Math.min(SLIDES.length - 1, idx));
    state.zoomScale = 1;
    state.toolsMenuOpen = false;
    syncHostSlideToLive();
    renderModal();
    const vp = document.getElementById("orDeckViewport");
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
    if (idx >= 0) {
      goToSlide(idx);
    } else {
      renderModal();
    }
  }

  function followRemoteSlide(remoteIdx) {
    if (!state.isOpen || state.viewMode !== "deck") return;
    const safeIdx = Math.max(0, Math.min(SLIDES.length - 1, Number(remoteIdx) || 0));
    if (safeIdx === state.slideIdx) return;
    state.slideIdx = safeIdx;
    state.zoomScale = 1;
    renderModal();
    const vp = document.getElementById("orDeckViewport");
    if (vp) {
      vp.scrollTop = 0;
      vp.scrollLeft = 0;
    }
  }

  function openLiveLobby() {
    state.isOpen = true;
    state.autoPlay = false;
    state.toolsMenuOpen = false;
    state.zoomScale = 1;
    state.viewMode = "live";
    renderModal();
  }

  function resumeSlidesFromLobby() {
    state.autoPlay = false;
    state.toolsMenuOpen = false;
    state.zoomScale = 1;
    state.viewMode = "deck";
    if (state.slideIdx === 0 && SLIDES.length > 1) {
      state.slideIdx = 1;
    }
    syncHostSlideToLive();
    renderModal();
  }

  function refreshLiveSurface() {
    if (!state.isOpen || !window.RACM_ORIENTATION_LIVE) return;
    const modal = document.getElementById("orientationDeckModal");
    if (!modal || modal.hidden) return;
    const count = window.RACM_ORIENTATION_LIVE.getParticipantCount
      ? window.RACM_ORIENTATION_LIVE.getParticipantCount()
      : 0;
    modal.querySelectorAll("[data-orl-participant-count]").forEach((el) => {
      el.textContent = String(count);
    });
    if (state.viewMode === "live") {
      const liveCanvas = modal.querySelector(".or-slide-canvas.is-live-canvas");
      if (liveCanvas) {
        liveCanvas.innerHTML = window.RACM_ORIENTATION_LIVE.renderDeckLiveStageHtml(false);
        return;
      }
      renderModal();
      return;
    }
    if (state.viewMode === "deck") {
      modal.querySelectorAll("[data-orl-slide-mount]").forEach((mount) => {
        const kind = mount.getAttribute("data-orl-slide-mount");
        if (kind === "quiz" && typeof window.RACM_ORIENTATION_LIVE.renderEmbeddedQuizSlideHtml === "function") {
          mount.innerHTML = window.RACM_ORIENTATION_LIVE.renderEmbeddedQuizSlideHtml({ viewMode: state.viewMode, ioTheme: getEffectiveIoTheme() });
        } else {
          mount.innerHTML = window.RACM_ORIENTATION_LIVE.renderCoverCardHtml({ viewMode: state.viewMode, ioTheme: getEffectiveIoTheme() });
        }
      });
    }
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
    const liveCount =
      window.RACM_ORIENTATION_LIVE && typeof window.RACM_ORIENTATION_LIVE.getParticipantCount === "function"
        ? window.RACM_ORIENTATION_LIVE.getParticipantCount()
        : 0;

    const followOn =
      window.RACM_ORIENTATION_LIVE && typeof window.RACM_ORIENTATION_LIVE.isFollowEnabled === "function"
        ? window.RACM_ORIENTATION_LIVE.isFollowEnabled()
        : false;
    const zoomPct = Math.round((state.zoomScale || 1) * 100);
    const effectiveIoTheme = getEffectiveIoTheme();
    const isIoDark = effectiveIoTheme === "dark";

    let viewportHtml = "";
    if (state.viewMode === "deck") {
      viewportHtml = `
        ${state.autoPlay ? `<div class="or-autoplay-progress" aria-hidden="true"></div>` : ""}
        <div class="or-slide-frame-wrap">
          <div class="or-slide-zoom-sizer">
            ${renderSingleSlideCanvasHtml(cur, state.slideIdx, true)}
          </div>
        </div>
      `;
    } else if (state.viewMode === "live") {
      viewportHtml = `
        <div class="or-slide-frame-wrap">
          <div class="or-slide-zoom-sizer">
            <article class="or-slide-canvas is-io-pitch is-live-canvas" data-io-theme="${effectiveIoTheme}" aria-label="Live Orientation Lobby and Kahoot Recheck">
              ${
                window.RACM_ORIENTATION_LIVE && typeof window.RACM_ORIENTATION_LIVE.renderDeckLiveStageHtml === "function"
                  ? window.RACM_ORIENTATION_LIVE.renderDeckLiveStageHtml(false)
                  : ""
              }
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
              <button type="button" class="or-sorter-card is-sec-${esc(s.section)}${i === state.slideIdx ? " is-current" : ""}" data-or-jump="${i}">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">
                  <span class="or-code-pill">Slide ${s.num}</span>
                  <span class="or-sorter-time">${esc(s.timeWindow)}</span>
                </div>
                <div class="or-sorter-title">
                  ${esc(s.title)}
                </div>
                <div class="or-sorter-act">
                  <span>${esc(s.actLabel || s.sectionLabel)}</span>
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

    modal.setAttribute("data-io-theme", effectiveIoTheme);
    modal.innerHTML = `
      <div class="or-deck-shell is-io-deck${showNotesNow ? " has-notes-open" : ""}" data-io-theme="${effectiveIoTheme}">
        <div class="or-deck-topbar">
          <div class="or-top-left">
            <span class="or-code-pill is-io-brand-pill">RACM 303</span>
            <div class="or-top-title-wrap">
              <span class="or-top-title">${esc(
                t(
                  "Course Orientation · Community Medicine & Health Systems Science",
                  "RACM 303 Orientation · Community Medicine & Health Systems Science"
                )
              )}</span>
              <span class="or-top-sub">พุธ 25 พ.ย. 2569 · 08.30 – 09.30 น. · ห้อง 2C2-03 อาคารพรีคลินิก</span>
            </div>
          </div>

          <div class="or-top-center" role="tablist" aria-label="สลับมุมมองสไลด์">
            <button type="button" class="or-mode-btn${state.viewMode === "deck" ? " is-active" : ""}" data-or-vmode="deck">${SVG.slides} <span>Slide</span></button>
            <button type="button" class="or-mode-btn is-live-tab${state.viewMode === "live" ? " is-active" : ""}" data-or-vmode="live" title="เปิดห้องรอผู้เข้าร่วม (Live Waiting Lobby) และยิงคำถาม Kahoot Recheck (กด K)"><span class="or-live-tab-dot"></span><span>Live (${liveCount})</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "sorter" ? " is-active" : ""}" data-or-vmode="sorter">${SVG.grid} <span>Sorter</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "handout" ? " is-active" : ""}" data-or-vmode="handout">${SVG.handout} <span>Handout</span></button>
          </div>

          <div class="or-top-right">
            <div class="or-desktop-tools">
              <button type="button" class="or-tool-btn is-io-theme-toggle" id="orIoThemeBtn" title="สลับโทนสไลด์ Clean Light / Dark (พร้อมเปลี่ยนภาพ PNG เป็น Dark BG อัตโนมัติ · กด T)"><span>${isIoDark ? "🌙 Dark" : "☀️ Light"}</span></button>
              ${
                ROLE === "faculty"
                  ? `<button type="button" class="or-timer-pill${state.timerRunning && state.timerSeconds <= 3600 ? " is-running" : ""}${state.timerSeconds > 3600 ? " is-overtime" : ""}" id="orTimerBtn" data-or-timer-display title="คลิกเพื่อเริ่ม/หยุดจับเวลาคาบปฐมนิเทศ 60 นาที (ดับเบิลคลิกเพื่อรีเซ็ต)">${formatTimer(state.timerSeconds)}</button>`
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
                <button type="button" class="or-pop-item" id="orPopIoThemeBtn"><span>${isIoDark ? "☀️ สลับเป็นโหมด Clean Light" : "🌙 สลับเป็นโหมด Clean Dark"}</span></button>
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

        <div class="or-deck-viewport${state.viewMode !== "deck" && state.viewMode !== "live" ? " is-scrollable-mode" : ""}" id="orDeckViewport">
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
          state.viewMode === "deck" || state.viewMode === "live"
            ? `
          <div class="or-deck-bottombar">
            <div class="or-nav-cluster">
              ${
                state.viewMode === "deck"
                  ? `
                <button type="button" class="or-tool-btn or-prevnext-btn" id="orPrevBtn" ${state.slideIdx === 0 ? "disabled" : ""}>&larr; <span class="or-nav-word">${esc(t("ก่อนหน้า", "Prev"))}</span></button>
                <select class="or-slide-select" id="orSlideSelect" aria-label="เลือกสไลด์">
                  ${SLIDES.map(
                    (s, i) =>
                      `<option value="${i}" ${i === state.slideIdx ? "selected" : ""}>${s.num}/${SLIDES.length} · ${esc(s.title)}</option>`
                  ).join("")}
                </select>
                <button type="button" class="or-tool-btn is-primary or-prevnext-btn" id="orNextBtn" ${state.slideIdx === SLIDES.length - 1 ? "disabled" : ""}><span class="or-nav-word">${esc(t("ถัดไป", "Next"))}</span> &rarr;</button>
              `
                  : `<button type="button" class="or-tool-btn is-primary" id="orBackToSlidesBtn">&larr; กลับไปยังสไลด์ (${cur.num}/${SLIDES.length})</button>`
              }
            </div>

            <div class="or-zoom-sync-cluster">
              ${
                ROLE === "student"
                  ? `<button type="button" class="or-follow-pill${followOn ? " is-on" : ""}" id="orFollowLiveBtn" title="ซิงค์เปลี่ยนหน้าสไลด์ตามจอผู้สอนอัตโนมัติ">📡 ${followOn ? "ซิงค์สด On" : "ซิงค์สด Off"}</button>`
                  : ""
              }
              <div class="or-zoom-pill" role="group" aria-label="ย่อขยายสไลด์ (Pinch-Zoom ได้)">
                <button type="button" class="or-zoom-btn" id="orZoomOutBtn" title="ซูมออก (−)">&minus;</button>
                <button type="button" class="or-zoom-lbl" id="orZoomResetBtn" data-or-zoom-label title="แตะเพื่อรีเซ็ตขนาด 100% (หรือใช้ 2 นิ้วถ่างซูมบนจอ)">${zoomPct}%</button>
                <button type="button" class="or-zoom-btn" id="orZoomInBtn" title="ซูมเข้า (+)">&#43;</button>
              </div>
            </div>

            ${
              state.viewMode === "deck"
                ? `
              <div class="or-filmstrip" role="navigation" aria-label="แถบลำดับสไลด์">
                ${SLIDES.map(
                  (s, i) =>
                    `<button type="button" class="or-film-dot${i === state.slideIdx ? " is-active" : ""}${s.isLiveQuizSlide ? " is-quiz-dot" : ""}" data-or-jump="${i}" title="${s.num}. ${esc(s.title)}">${s.num}</button>`
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

    ["orIoThemeBtn", "orPopIoThemeBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", toggleIoStageTheme);
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

    const backToSlidesBtn = document.getElementById("orBackToSlidesBtn");
    if (backToSlidesBtn) {
      backToSlidesBtn.addEventListener("click", () => {
        state.viewMode = "deck";
        state.zoomScale = 1;
        renderModal();
      });
    }

    const zoomOutBtn = document.getElementById("orZoomOutBtn");
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => setZoomScale((state.zoomScale || 1) - 0.25));
    const zoomInBtn = document.getElementById("orZoomInBtn");
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => setZoomScale((state.zoomScale || 1) + 0.25));
    const zoomResetBtn = document.getElementById("orZoomResetBtn");
    if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => setZoomScale(1));

    const followBtn = document.getElementById("orFollowLiveBtn");
    if (followBtn && window.RACM_ORIENTATION_LIVE && typeof window.RACM_ORIENTATION_LIVE.toggleFollowHostSlide === "function") {
      followBtn.addEventListener("click", () => {
        window.RACM_ORIENTATION_LIVE.toggleFollowHostSlide();
        renderModal();
      });
    }

    // Run Per-Frame Auto-Fit Typography synchronously before paint & re-verify on image decode!
    fitAllVisibleCanvases();
    applyZoomToCurrentSlide(1);
    wireImageLoadRefit(modal);
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
    syncHostSlideToLive();
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
    goToSlideById,
    stepSlide,
    followRemoteSlide,
    setZoomScale,
    openLiveLobby,
    resumeSlidesFromLobby,
    refreshLiveSurface,
    toggleAutoPlay,
    fitAllVisibleCanvases,
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
