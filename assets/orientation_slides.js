/* ==========================================================================
   RACM 303 (2569) — Orientation to Community Medicine & Health Systems Science
   20-Slide Interactive 16:9 Widescreen Apple-Keynote Slide Deck
   Constructive Policy-Brief Prose · Source-Validated HSS · Auto-Fit Typography
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const ASSET_VER = "20261125kahoot3";
  const PPTX_HREF = `exports/pptx/RACM303_2569_Orientation_Slides.pptx?v=${ASSET_VER}`;
  const PDF_HREF = `exports/pdf/RACM303_2569_Orientation_Slides.pdf?v=${ASSET_VER}`;
  const IMG_DIR = "assets/images/orientation";
  const PREM_BURI_DIR = "assets/images/orientation/prem_buri";
  const PREM_SCREENSAVER_MS = 6000;
  const CLOSING_VDO_DELAY_MS = 5000;
  const CLOSING_VDO_SRC = `assets/videos/intro_hss_subtitle.mp4?v=${ASSET_VER}`;
  const CLOSING_VDO_POSTER = `assets/images/orient_s18_intro_hss_poster.jpg?v=${ASSET_VER}`;
  const CLOSING_VDO_DRIVE_URL = "https://drive.google.com/file/d/1Ic3FbXnCdMqAOBGZaPOANMYlJ-M7eChf/view?usp=sharing";
  const AUTOPLAY_MS = 9000;
  const CLICKER_HUD_IDLE_MS = 2300;

  const closingVdoState = {
    timerId: 0,
    tickId: 0,
    remainSec: 5,
    cinemaFull: false,
    fullscreenCinema: false,
    unlocking: false
  };

  /* ---------- Netflix Pause Screensaver × Apple TV Photo Grid Catalog (Slide 02: Prem Buri) ---------- */
  const PREM_BURI_REEL_ITEMS = [
    {
      id: "pb_01",
      file: "pb_01_smiling_portrait.webp",
      orient: "portrait",
      pos: "50% 22%",
      badge: "FEATURED #1 · FOUNDING FATHER",
      era: "พ.ศ. 2461 – 2558",
      shortTag: "รอยยิ้มครูแพทย์ผู้บุกเบิก",
      title: "ศ.เกียรติคุณ นพ.เปรม บุรี — รอยยิ้มและจิตวิญญาณครูแพทย์รามาธิบดี",
      desc: "จากเสรีไทยสายอังกฤษและหัวหน้าภาควิชาศัลยศาสตร์ท่านแรก สู่ผู้บุกเบิกเวชศาสตร์ชุมชนที่พาแพทย์เรียนรู้ชีวิตจริงของประชาชน"
    },
    {
      id: "pb_02",
      file: "pb_02_cmc_disciples_2551.webp",
      orient: "wide",
      preserveFrame: true,
      pos: "50% 46%",
      badge: "COMMUNITY MEDICINE CENTER · 28 ต.ค. 2551",
      era: "สำนักงานศูนย์เวชศาสตร์ชุมชน",
      shortTag: "ถ่ายรูปรวมกับลูกศิษย์หน้าป้าย COMMED",
      title: "ถ่ายรูปรวมกับลูกศิษย์หน้าป้าย “สำนักงานศูนย์เวชศาสตร์ชุมชน” (COMMED)",
      desc: "ภาพถ่ายประวัติศาสตร์วันที่ 28 ตุลาคม 2551 พร้อมหน้าลูกศิษย์ คณาจารย์ และบุคลากรผู้สืบสานพันธกิจเวชศาสตร์ชุมชน รามาธิบดี"
    },
    {
      id: "pb_03",
      file: "pb_03_pipe_map_vision.webp",
      orient: "portrait",
      pos: "50% 26%",
      badge: "SYSTEMS VISIONARY · พ.ศ. 2509 – 2514",
      era: "จากข้างเตียงสู่แผนที่ชุมชน",
      shortTag: "เข็มทิศสู่ชนบทไทย",
      title: "จากศัลยแพทย์หัวใจและหลอดเลือด สู่การวางแผนระบบสุขภาพชนบท",
      desc: "แรงบันดาลใจจากหน่วยแพทย์เคลื่อนที่ จ.อุดรธานี จุดประกายการออกแบบหลักสูตรให้แพทย์เข้าใจบริบทพื้นที่จริงนอกโรงพยาบาล"
    },
    {
      id: "pb_04",
      file: "pb_04_field_pha_khao_ma.webp",
      orient: "portrait",
      pos: "55% 18%",
      badge: "RURAL FIELDWORK · BEYOND THE IVORY TOWER",
      era: "ห้องเรียนกลางหมู่บ้าน",
      shortTag: "ผ้าขาวม้าและไม้เท้าลงพื้นที่",
      title: "เคียงข้างชุมชนด้วยความถ่อมตน — ต้นแบบการลงพื้นที่จริง",
      desc: "ภาพจำของอาจารย์เปรมในชุดเรียบง่ายโพกผ้าขาวม้าถือไม้เท้า นั่งรับฟังและทำงานร่วมกับทีมและชาวบ้านในพื้นที่ชนบท"
    },
    {
      id: "pb_05",
      file: "pb_05_tree_planting_community.webp",
      orient: "portrait",
      pos: "55% 50%",
      badge: "GROWING ROOTS · LIVING LEGACY",
      era: "หยั่งรากสร้างคน สร้างระบบ",
      shortTag: "ร่วมปลูกต้นไม้กับศิษย์",
      title: "หยั่งรากเมล็ดพันธุ์เวชศาสตร์ชุมชนร่วมกับลูกศิษย์และชุมชน",
      desc: "การสร้างบัณฑิตแพทย์เปรียบเสมือนการปลูกต้นไม้ที่ต้องอาศัยความเข้าใจบริบทของพื้นที่และการลงมือทำร่วมกัน"
    },
    {
      id: "pb_06",
      file: "pb_06_multidisciplinary_dialogue.webp",
      orient: "wide",
      pos: "48% 30%",
      badge: "MULTIDISCIPLINARY UNIT · สหสาขาวิชาชีพ",
      era: "บูรณาการข้ามภาควิชา",
      shortTag: "วงสนทนาสหสาขาวิชา",
      title: "เวชศาสตร์ชุมชนคือความร่วมมือข้ามศาสตร์ ไม่แยกส่วนเป็นเกาะเดี่ยว",
      desc: "แนวคิดหลักของ อ.เปรม ในการประสานความร่วมมือระหว่างคลินิกทุกสาขา พยาบาล และทีมสาธารณสุขในพื้นที่"
    },
    {
      id: "pb_07",
      file: "pb_07_seminar_warm_smile.webp",
      orient: "wide",
      pos: "48% 36%",
      badge: "OUT OF THE IVORY TOWER · กัลยาณมิตร",
      era: "ก้าวออกจากหอคอยงาช้าง",
      shortTag: "ก้าวออกจากหอคอยงาช้าง",
      title: "พาอาจารย์แพทย์ พยาบาล และนักศึกษาออกจาก “หอคอยงาช้าง”",
      desc: "บรรยากาศการแลกเปลี่ยนเรียนรู้อย่างอบอุ่นเป็นกันเอง เปิดพื้นที่ให้ทุกคนตั้งคำถามและวิเคราะห์ปัญหาสุขภาพร่วมกัน"
    },
    {
      id: "pb_08",
      file: "pb_08_academic_panel_mic.webp",
      orient: "wide",
      preserveFrame: true,
      pos: "50% 32%",
      badge: "CURRICULUM PIONEER · MEDICAL EDUCATION",
      era: "ปฏิรูปแพทยศาสตรศึกษา",
      shortTag: "เวทีอภิปรายหลักสูตร",
      title: "บรรจุเวชศาสตร์ชุมชนในชั่วโมงหลักสูตรหลักของคณะแพทยศาสตร์",
      desc: "ผลักดันให้การเรียนรู้ชุมชนเป็นแกนหลักของหลักสูตรแพทยศาสตรบัณฑิต ไม่ใช่เพียงกิจกรรมดูงานระยะสั้นนอกเวลา"
    },
    {
      id: "pb_09",
      file: "pb_09_village_walk_field.webp",
      orient: "wide",
      pos: "50% 20%",
      badge: "COMMUNITY WALK · EXPERIENTIAL LEARNING",
      era: "เดินสำรวจวิถีชุมชน",
      shortTag: "เดินเท้าเยี่ยมชุมชน",
      title: "เดินเท้าเรียนรู้วิถีชีวิต ปัจจัยกำหนดสุขภาพ และภูมิปัญญาท้องถิ่น",
      desc: "นำทีมคณาจารย์และนักศึกษาเดินสำรวจชุมชนด้วยตนเอง เพื่อเห็นความเชื่อมโยงระหว่างความเป็นอยู่ อาชีพ และสุขภาพ"
    },
    {
      id: "pb_10",
      file: "pb_10_campus_community_sport.webp",
      orient: "wide",
      pos: "52% 40%",
      badge: "TEAM SPIRIT · HOLISTIC WELLBEING",
      era: "พลังทีมและความผูกพัน",
      shortTag: "กิจกรรมเชื่อมพลังทีม",
      title: "สร้างพลังทีมและความสุขในการทำงานร่วมกับชุมชนและสหวิชาชีพ",
      desc: "ความเรียบง่ายและเปี่ยมพลังของ อ.เปรม ในกิจกรรมร่วมกับพยาบาล เจ้าหน้าที่ และนักศึกษาอย่างไม่ถือตัว"
    },
    {
      id: "pb_11",
      file: "pb_11_cmc_monk_blessing_2526.webp",
      orient: "wide",
      preserveFrame: true,
      pos: "50% 32%",
      badge: "ARCHIVAL MILESTONE · พ.ศ. 2526",
      era: "ก่อตั้งศูนย์เวชศาสตร์ชุมชน",
      shortTag: "เจิมป้ายศูนย์เวชศาสตร์ชุมชน",
      title: "พิธีเจิมป้าย “ศูนย์เวชศาสตร์ชุมชน” คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี",
      desc: "หมุดหมายสำคัญในการยกระดับหน่วยทำงานสหวิชาชีพสู่ศูนย์เวชศาสตร์ชุมชน ก่อนพัฒนาเป็นภาควิชาเวชศาสตร์ชุมชน"
    },
    {
      id: "pb_12",
      file: "pb_12_founding_committee_table.webp",
      orient: "wide",
      preserveFrame: true,
      pos: "50% 45%",
      badge: "FOUNDING ERA · พ.ศ. 2512 – 2520",
      era: "โครงการบางปะอิน จ.อยุธยา",
      shortTag: "ประชุมวางรากฐานยุคบุกเบิก",
      title: "ประชุมวางรากฐานโครงการเวชศาสตร์ชุมชน ร่วมกับกระทรวงสาธารณสุข",
      desc: "เชื่อมโรงเรียนแพทย์เข้ากับระบบบริการสาธารณสุขระดับอำเภอ ณ อ.บางปะอิน จ.พระนครศรีอยุธยา เป็นแห่งแรก"
    },
    {
      id: "pb_13",
      file: "pb_13_evening_mentorship_table.webp",
      orient: "portrait",
      pos: "54% 26%",
      badge: "REFLECTIVE MENTORSHIP · สะท้อนคิดยามค่ำ",
      era: "ครูผู้รับฟังอย่างลึกซึ้ง",
      shortTag: "วงสนทนาสะท้อนคิดยามค่ำ",
      title: "วงสนทนาสะท้อนคิดหลังลงพื้นที่ — ต้นกำเนิดจิตวิญญาณ Small Group",
      desc: "อาจารย์เปรมนั่งรับฟังประสบการณ์ของทีมแพทย์รุ่นใหม่และลูกศิษย์อย่างตั้งใจ ชวนคิดต่อยอดจากสิ่งที่พบเห็นในชุมชน"
    },
    {
      id: "pb_15",
      file: "pb_15_small_group_teaching.webp",
      orient: "wide",
      pos: "50% 38%",
      badge: "STUDENT-CENTERED · ห้องเรียนคิดวิเคราะห์",
      era: "การสอนที่เน้นผู้เรียนเป็นสำคัญ",
      shortTag: "ชั่วโมงอภิปรายกับ นศพ.",
      title: "ห้องเรียนที่ชวนนักศึกษาแพทย์ตั้งคำถามและคิดเชิงระบบจากโจทย์จริง",
      desc: "เปลี่ยนการเรียนการสอนจากการท่องจำหน้าชั้น สู่การอภิปรายแลกเปลี่ยนเพื่อแก้ปัญหาสุขภาพของประชากร"
    },
    {
      id: "pb_16",
      file: "pb_16_student_circle_harmony.webp",
      orient: "wide",
      preserveFrame: true,
      pos: "50% 40%",
      badge: "SHARED RESPONSIBILITY · พลังกลุ่ม",
      era: "เรียนรู้ร่วมกันเป็นทีม",
      shortTag: "วงล้อมความสามัคคี นศพ.",
      title: "วงล้อมแห่งความไว้วางใจและการทำงานร่วมกันของนักศึกษาแพทย์",
      desc: "รากฐานของการเรียนรู้ภาคสนามเป็นกลุ่มที่ช่วยเหลือเกื้อกูลกัน ซึ่งเป็นหัวใจสำคัญของ RACM 303 จนถึงวันนี้"
    },
    {
      id: "pb_17",
      file: "pb_17_curriculum_seminar_2527.webp",
      orient: "wide",
      preserveFrame: true,
      pos: "50% 48%",
      badge: "CURRICULUM SEMINAR · 17–19 ก.พ. 2527",
      era: "สัมมนาหลักสูตรเวชศาสตร์ชุมชน",
      shortTag: "สัมมนาหลักสูตร ปี 2527",
      title: "สัมมนาผลการเรียนการสอนหลักสูตรเวชศาสตร์ชุมชน พ.ศ. 2527",
      desc: "การทบทวนและพัฒนาหลักสูตรอย่างต่อเนื่องจากข้อมูลสะท้อนกลับของนักศึกษา คณาจารย์ และโรงพยาบาลแหล่งฝึก"
    },
    {
      id: "pb_18",
      file: "pb_18_colleagues_laughter.webp",
      orient: "portrait",
      pos: "50% 22%",
      badge: "COLLEGIALITY · มิตรภาพผู้ร่วมบุกเบิก",
      era: "รอยยิ้มกัลยาณมิตร",
      shortTag: "รอยยิ้มกับเพื่อนคณาจารย์",
      title: "พลังกัลยาณมิตรผู้ร่วมบุกเบิกคณะแพทยศาสตร์โรงพยาบาลรามาธิบดี",
      desc: "ความสุขและเสียงหัวเราะในการทำงานร่วมกันของคณาจารย์ผู้วางรากฐานการแพทย์และระบบสาธารณสุขไทย"
    },
    {
      id: "pb_19",
      file: "pb_19_field_jacket_portrait.webp",
      orient: "portrait",
      pos: "50% 16%",
      badge: "ROLE MODEL · CHANGE AGENT",
      era: "ความสมถะและมุ่งมั่น",
      shortTag: "ความสมถะของครูแพทย์",
      title: "ความสมถะ มุ่งมั่น และยืนหยัดเพื่อสุขภาพของประชาชน",
      desc: "ต้นแบบของแพทย์ผู้มองไกลกว่าโรคเฉพาะหน้า สู่การพัฒนาศักยภาพชุมชนและระบบบริการสุขภาพที่ยั่งยืน"
    }
  ];

  const PREM_ICO = {
    pause: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    play: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
    shuffle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>`,
    expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    split: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="13" y1="4" x2="13" y2="20"/></svg>`
  };

  function premToggleBtnHtml(isPaused) {
    return isPaused ? `${PREM_ICO.play}<span>เล่นต่อ</span>` : `${PREM_ICO.pause}<span>6s</span>`;
  }

  function premExpandBtnHtml(isExpanded) {
    return isExpanded ? `${PREM_ICO.split}<span>คู่เนื้อหา</span>` : `${PREM_ICO.expand}<span>เต็มกรอบ</span>`;
  }

  function buildPremCuratedBaseOrder() {
    const lockedIds = ["pb_01", "pb_11", "pb_02"];
    const locked = lockedIds
      .map((id) => PREM_BURI_REEL_ITEMS.find((x) => x.id === id))
      .filter(Boolean);
    const rest = PREM_BURI_REEL_ITEMS.filter((x) => lockedIds.indexOf(x.id) === -1);
    return { locked, rest };
  }

  function buildPremShuffledOrder() {
    const { locked, rest } = buildPremCuratedBaseOrder();
    for (let i = rest.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = rest[i];
      rest[i] = rest[j];
      rest[j] = tmp;
    }
    return locked.concat(rest);
  }

  function buildPremStaticOrder() {
    const { locked, rest } = buildPremCuratedBaseOrder();
    return locked.concat(rest);
  }

  const premReelState = {
    order: buildPremShuffledOrder(),
    cursor: 0,
    paused: false,
    expanded: false,
    timerId: 0,
    kbFlip: false,
    wasOnSlide: false
  };

  function premImgHref(item) {
    return `${PREM_BURI_DIR}/${item.file}?v=${ASSET_VER}`;
  }

  function clearPremScreensaverTimer() {
    if (premReelState.timerId) {
      clearTimeout(premReelState.timerId);
      premReelState.timerId = 0;
    }
  }

  function preloadPremUpcoming(startAtZero) {
    if (typeof Image === "undefined" || !premReelState.order.length) return;
    const n = premReelState.order.length;
    const startOffset = startAtZero ? 0 : 1;
    for (let k = startOffset; k <= 6; k += 1) {
      const item = premReelState.order[(premReelState.cursor + k) % n];
      if (item && !item._preloaded) {
        const im = new Image();
        im.decoding = "async";
        im.src = premImgHref(item);
        item._preloaded = true;
      }
    }
  }

  function buildPremGridLayerInnerHtml(isStaticPrint) {
    const order = isStaticPrint ? buildPremStaticOrder() : premReelState.order;
    const n = order.length;
    const curIdx = isStaticPrint ? 0 : ((premReelState.cursor % n) + n) % n;
    const hero = order[curIdx] || PREM_BURI_REEL_ITEMS[0];
    const mosaicCount = !isStaticPrint && premReelState.expanded ? 4 : 3;
    const mosaics = [];
    for (let m = 1; m <= mosaicCount; m += 1) {
      mosaics.push(order[(curIdx + m) % n]);
    }

    const layoutCls =
      !isStaticPrint && premReelState.expanded
        ? "is-wall-5"
        : hero.preserveFrame
          ? "is-hero-fullframe"
          : hero.orient === "wide"
            ? "is-hero-wide"
            : "is-hero-portrait";

    const kbHero = premReelState.kbFlip ? "is-kb-b" : "is-kb-a";
    const preserveCls = hero.preserveFrame ? " is-preserve-frame" : "";

    const heroHtml = hero.preserveFrame
      ? `
      <div class="or-prem-tile is-hero is-docked-hero ${kbHero}${preserveCls}" data-prem-tile-hero="${esc(hero.id)}" style="--prem-pos:${esc(hero.pos || "50% 50%")}">
        <div class="or-prem-hero-media">
          <img class="or-prem-tile-amb" src="${esc(premImgHref(hero))}" alt="" aria-hidden="true" decoding="async" />
          <img class="or-prem-img" src="${esc(premImgHref(hero))}" alt="${esc(hero.title)}" loading="eager" decoding="sync" />
        </div>
        <div class="or-prem-hero-overlay is-docked-caption">
          <div class="or-prem-hero-meta">
            <span class="or-prem-ep-badge">${esc(hero.badge)}</span>
            <span class="or-prem-era-tag">${esc(hero.era)}</span>
          </div>
          <h4 class="or-prem-hero-title">${esc(hero.title)}</h4>
          <p class="or-prem-hero-desc">${esc(hero.desc)}</p>
          <div class="or-prem-progress-rail" aria-hidden="true">
            <div class="or-prem-progress-fill"></div>
          </div>
        </div>
      </div>
    `
      : `
      <div class="or-prem-tile is-hero ${kbHero}${preserveCls}" data-prem-tile-hero="${esc(hero.id)}" style="--prem-pos:${esc(hero.pos || "50% 24%")}">
        <img class="or-prem-img" src="${esc(premImgHref(hero))}" alt="${esc(hero.title)}" loading="eager" decoding="sync" />
        <div class="or-prem-hero-overlay">
          <div class="or-prem-hero-meta">
            <span class="or-prem-ep-badge">${esc(hero.badge)}</span>
            <span class="or-prem-era-tag">${esc(hero.era)}</span>
          </div>
          <h4 class="or-prem-hero-title">${esc(hero.title)}</h4>
          <p class="or-prem-hero-desc">${esc(hero.desc)}</p>
          <div class="or-prem-progress-rail" aria-hidden="true">
            <div class="or-prem-progress-fill"></div>
          </div>
        </div>
      </div>
    `;

    const mosaicHtml = mosaics
      .map((item, idx) => {
        const kbCls = (idx + (premReelState.kbFlip ? 1 : 0)) % 2 === 0 ? "is-kb-b" : "is-kb-a";
        const mPreserveCls = item.preserveFrame ? " is-preserve-frame" : "";
        return `
          <div class="or-prem-tile is-mosaic ${kbCls}${mPreserveCls}" data-prem-jump-id="${esc(item.id)}" title="คลิกเพื่อแสดงภาพนี้เป็นภาพหลัก: ${esc(item.title)}" style="--prem-pos:${esc(item.pos || "50% 26%")}">
            ${item.preserveFrame ? `<img class="or-prem-tile-amb" src="${esc(premImgHref(item))}" alt="" aria-hidden="true" decoding="async" />` : ""}
            <img class="or-prem-img" src="${esc(premImgHref(item))}" alt="${esc(item.title)}" loading="eager" decoding="sync" />
            <div class="or-prem-mosaic-overlay">
              <span class="or-prem-mosaic-kicker">${idx === 0 ? "UP NEXT · ถัดไป" : "ARCHIVAL MOMENT"}</span>
              <span class="or-prem-mosaic-title">${esc(item.shortTag || item.title)}</span>
            </div>
          </div>
        `;
      })
      .join("");

    return {
      layoutCls,
      hero,
      curIdx,
      total: n,
      innerHtml: heroHtml + mosaicHtml
    };
  }

  function renderPremScreensaverStageHtml() {
    const isStatic =
      state.viewMode === "handout" ||
      Boolean(window.__RACM_EXPORTING_DECK) ||
      document.body.classList.contains("is-printing-orientation-deck");
    const built = buildPremGridLayerInnerHtml(isStatic);
    const numStr = `${String(built.curIdx + 1).padStart(2, "0")} / ${String(built.total).padStart(2, "0")}`;
    const pausedCls = premReelState.paused ? " is-screensaver-paused" : "";
    const staticCls = isStatic ? " is-static-mode" : "";
    return `
      <div class="or-prem-tv-stage${pausedCls}${staticCls}" data-prem-stage>
        <div class="or-prem-ambient-bg" data-prem-amb style="background-image:url('${esc(premImgHref(built.hero))}')"></div>
        <div class="or-prem-ambient-scrim" aria-hidden="true"></div>

        <div class="or-prem-topbar">
          <div class="or-prem-top-left">
            <span class="or-prem-brand-mark">ARCHIVE</span>
            <span class="or-prem-series-kicker">PREM BURI · PHOTO GRID SCREENSAVER</span>
            <span class="or-prem-counter-pill" data-prem-counter>${numStr}</span>
          </div>
          <div class="or-prem-ctrls">
            <button type="button" class="or-prem-ctrl-btn is-icon-only" data-prem-ctrl="prev" title="ภาพก่อนหน้า" aria-label="ภาพก่อนหน้า">&lsaquo;</button>
            <button type="button" class="or-prem-ctrl-btn${premReelState.paused ? " is-paused" : ""}" data-prem-ctrl="toggle" title="พักหรือเล่น Screensaver เปลี่ยนภาพอัตโนมัติทุก 6 วินาที">${premToggleBtnHtml(premReelState.paused)}</button>
            <button type="button" class="or-prem-ctrl-btn is-icon-only" data-prem-ctrl="next" title="ภาพถัดไป" aria-label="ภาพถัดไป">&rsaquo;</button>
            <button type="button" class="or-prem-ctrl-btn" data-prem-ctrl="shuffle" title="สุ่มลำดับชุดภาพใหม่ (โดยเริ่มจากภาพแรกของ อ.เปรม เสมอ)">${PREM_ICO.shuffle}<span>Shuffle</span></button>
            <button type="button" class="or-prem-ctrl-btn is-hide-mobile${premReelState.expanded ? " is-expanded-on" : ""}" data-prem-ctrl="expand" title="ขยาย Photo Grid เต็มสไลด์แบบ Apple TV Screensaver">${premExpandBtnHtml(premReelState.expanded)}</button>
          </div>
        </div>

        <div class="or-prem-grid-viewport" data-prem-viewport>
          <div class="or-prem-grid-layer ${built.layoutCls}" data-prem-layer>
            ${built.innerHtml}
          </div>
        </div>
      </div>
    `;
  }

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
    clickerStage: false, // Apple Keynote / Google I/O Cinema Pitch Stage (Auto-hiding HUD + Click-anywhere + Hardware Clicker)
    hudIdle: false,
    hudIdleTimer: 0,
    blackoutActive: false,
    clickerGuideOpen: false,
    transitionDir: "next", // "next" | "prev"
    jumpDigits: "",
    jumpTimer: 0,
    stepToastActive: false,
    stepToastTimer: 0,
    s02Focus: 0, // 0 = 3-figure overview, 1 = Fig 1.4, 2 = Fig 2A, 3 = Fig 2B, 4 = final overview
    s02Timer: 0,
    s02PendingTarget: null,
    heroReveal: 0, // Slides 06 & 09: 0 = full-stage diagram, 1 = diagram + bottom cards
    pipeFocus: 0, // Slides 10 & 12: 0 = full-stage diagram, 1 = overview + 4 cards, 2..5 = cropped stage 1..4, 6 = final overview + 4 cards
    pipeTimer: 0,
    pipePendingTarget: null,
    siteFocus: 0, // Slide 14 (s09-fieldwork-9sites): 0 = 9-sites overview table, 1..9 = live 3D map + broadcast formation board
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
      <div class="or-s02-flow-card ${esc(opts.tintCls || "")}" data-s02-slot="${esc(opts.slot || "")}">
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

  function pipeDomFocusStr(pf) {
    if (!pf || pf === 0) return "hero";
    if (pf === 1 || pf === 6) return "0";
    if (pf >= 2 && pf <= 5) return String(pf - 1);
    return "0";
  }

  function renderPipeZoomStageHtml(opts) {
    const isExportOrPrint =
      Boolean(window.__RACM_EXPORTING_DECK) || document.body.classList.contains("is-printing-orientation-deck");
    const focusVal = isExportOrPrint ? "0" : pipeDomFocusStr(state.pipeFocus || 0);
    const ovResolved = resolveSlideImgFile(opts.overviewFile);
    const anchorsHtml = (opts.regions || [])
      .map(
        (r) =>
          `<div class="or-pipe-region-anchor" data-pipe-region="${esc(r.slot)}" style="left:${r.left};width:${r.width}" title="${esc(r.title || "")}"></div>`
      )
      .join("");
    const cropsHtml = (opts.crops || [])
      .map((c) => {
        const crResolved = resolveSlideImgFile(c.fileName);
        return `
          <figure class="or-fig-plate is-s02-plate is-pipe-crop-plate" data-pipe-crop="${esc(c.slot)}">
            <div class="or-fig-top-badge">${esc(c.badge)}</div>
            <div class="or-fig-img-wrap">
              <img class="or-fig-img" data-base-img="${esc(c.fileName)}" src="${IMG_DIR}/${esc(crResolved)}?v=${ASSET_VER}" alt="${esc(c.altText)}" loading="eager" decoding="async" />
            </div>
            ${c.captionHtml ? `<figcaption class="or-fig-cap">${c.captionHtml}</figcaption>` : ""}
          </figure>
        `;
      })
      .join("");
    const cardsHtml = (opts.cards || [])
      .map(
        (cd) => `
          <div class="or-card ${esc(cd.tintCls || "is-white")} is-s08-card" data-pipe-slot="${esc(cd.slot)}">
            <div>
              <span class="or-card-kicker">${cd.kickerHtml}</span>
              <h3 class="or-card-title">${cd.titleHtml}</h3>
              ${cd.instRowHtml || ""}
            </div>
            <p class="or-card-text">${cd.bodyHtml}</p>
          </div>
        `
      )
      .join("");

    return `
      <div class="or-top-fig-stack is-s08-stack is-pipe-zoom-stage" data-pipe-focus="${focusVal}">
        <figure class="or-fig-plate is-pipe-overview-plate">
          <div class="or-fig-img-wrap">
            <img class="or-fig-img" data-base-img="${esc(opts.overviewFile)}" src="${IMG_DIR}/${esc(ovResolved)}?v=${ASSET_VER}" alt="${esc(opts.overviewAlt)}" loading="eager" decoding="async" />
            ${anchorsHtml}
          </div>
        </figure>
        ${cropsHtml}
        <div class="or-grid-4 is-s08-grid" data-fit-group="pipe-cards">
          ${cardsHtml}
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
    clicker: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="5"/><circle cx="12" cy="8" r="2"/><line x1="12" y1="14" x2="12" y2="17"/></svg>`,
    more: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`
  };

  const S09_SITE_META = [
    { id: 1, shortName: "กุฉินารายณ์", hosp: "รพร.กุฉินารายณ์", prov: "จ.กาฬสินธุ์", color: "#007aff" },
    { id: 2, shortName: "ด่านซ้าย", hosp: "รพร.ด่านซ้าย", prov: "จ.เลย", color: "#00a388" },
    { id: 3, shortName: "ตะกั่วป่า", hosp: "รพ.ตะกั่วป่า", prov: "จ.พังงา", color: "#e66100" },
    { id: 4, shortName: "ท่าวังผา", hosp: "รพ.ท่าวังผา", prov: "จ.น่าน", color: "#5e35b1" },
    { id: 5, shortName: "เพชรบูรณ์ 1", hosp: "รพ.เพชรบูรณ์ (1)", prov: "จ.เพชรบูรณ์", color: "#d81b60" },
    { id: 6, shortName: "เพชรบูรณ์ 2", hosp: "รพ.เพชรบูรณ์ (2)", prov: "จ.เพชรบูรณ์", color: "#ad1457" },
    { id: 7, shortName: "อุบลรัตน์", hosp: "รพ.อุบลรัตน์", prov: "จ.ขอนแก่น", color: "#2e7d32" },
    { id: 8, shortName: "ท่าสองยาง", hosp: "รพ.ท่าสองยาง", prov: "จ.ตาก", color: "#00838f" },
    { id: 9, shortName: "อุ้มผาง", hosp: "รพ.อุ้มผาง", prov: "จ.ตาก", color: "#c62828" }
  ];

  function renderSegmented100BarHtml(titleLeft, sumLabel, segments) {
    const segHtml = (segments || [])
      .filter((s) => s.pct > 0)
      .map(
        (s) => `
          <div class="or-100pct-seg" style="width:${s.pct}%;background:${s.color}" title="${esc(s.code)}: ${esc(s.label)} (${s.pctLabel || s.pct + "%"})">
            <span>${esc(s.code)}</span>
            <small>${esc(s.pctLabel || s.pct + "%")}</small>
          </div>
        `
      )
      .join("");
    return `
      <div class="or-100pct-wrap">
        <div class="or-100pct-scale-head">
          <span>${titleLeft}</span>
          <span class="or-100pct-sum-pill">${sumLabel}</span>
        </div>
        <div class="or-100pct-track" role="img" aria-label="${esc(titleLeft)} รวม 100%">
          ${segHtml}
        </div>
      </div>
    `;
  }

  function renderKolbCycleSvgHtml() {
    return `
      <svg class="or-kolb-svg" viewBox="0 0 980 620" role="img" aria-label="การเรียนรู้ร่วมกันจากประสบการณ์ภาคสนาม Kolb's Experiential Learning Cycle">
        <defs>
          <marker id="kolbArrowBlue" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M1,1 L11,6 L1,11 Z" fill="#0284c7" />
          </marker>
          <marker id="kolbArrowTeal" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M1,1 L11,6 L1,11 Z" fill="#0d9488" />
          </marker>
          <marker id="kolbArrowAmber" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M1,1 L11,6 L1,11 Z" fill="#d97706" />
          </marker>
          <marker id="kolbArrowIndigo" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M1,1 L11,6 L1,11 Z" fill="#4f46e5" />
          </marker>
          <filter id="kolbSoftShadow" x="-12%" y="-12%" width="124%" height="128%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.12" />
          </filter>
        </defs>

        <!-- Subtle outer orbit ring -->
        <ellipse cx="490" cy="312" rx="255" ry="188" fill="none" stroke="#cbd5e1" stroke-width="2.2" stroke-dasharray="7 6" opacity="0.78" />

        <!-- Clockwise Curved Arrows Connecting the 4 Stages -->
        <path d="M 598 158 C 690 176, 742 218, 756 260" fill="none" stroke="#0284c7" stroke-width="5.5" stroke-linecap="round" marker-end="url(#kolbArrowBlue)" />
        <path d="M 754 366 C 734 418, 682 456, 602 472" fill="none" stroke="#0d9488" stroke-width="5.5" stroke-linecap="round" marker-end="url(#kolbArrowTeal)" />
        <path d="M 378 472 C 298 456, 246 418, 226 366" fill="none" stroke="#d97706" stroke-width="5.5" stroke-linecap="round" marker-end="url(#kolbArrowAmber)" />
        <path d="M 224 260 C 240 214, 294 176, 382 158" fill="none" stroke="#4f46e5" stroke-width="5.5" stroke-linecap="round" marker-end="url(#kolbArrowIndigo)" />

        <!-- Center Core Emblem -->
        <g filter="url(#kolbSoftShadow)">
          <rect class="kolb-center-bg" x="352" y="256" width="276" height="112" rx="56" fill="#ffffff" stroke="#94a3b8" stroke-width="2" />
          <text class="kolb-center-txt" x="490" y="294" text-anchor="middle" font-family="Anuphan, Sarabun, sans-serif" font-size="16.5" font-weight="800" fill="#0f172a">การเรียนรู้ร่วมกัน</text>
          <text class="kolb-center-txt" x="490" y="318" text-anchor="middle" font-family="Anuphan, Sarabun, sans-serif" font-size="16.5" font-weight="800" fill="#0f172a">จากประสบการณ์ภาคสนาม</text>
          <text x="490" y="344" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="12.5" font-weight="700" fill="#0284c7">Kolb&apos;s Experiential Learning Cycle</text>
        </g>

        <!-- TOP STAGE 1: Concrete Experience -->
        <g filter="url(#kolbSoftShadow)">
          <rect class="kolb-callout-bg" x="245" y="16" width="490" height="54" rx="27" fill="#eff6ff" stroke="#38bdf8" stroke-width="2.2" />
          <text class="kolb-callout-th" x="490" y="50" text-anchor="middle" font-family="Anuphan, Sarabun, sans-serif" font-size="20" font-weight="800" fill="#0c4a6e">“ทำกิจกรรมทั้งส่วนตัวและร่วมกันเป็นทีมในพื้นที่ต่างๆ”</text>

          <rect x="372" y="92" width="236" height="92" rx="20" fill="#0284c7" />
          <text x="490" y="128" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="18.5" font-weight="800" fill="#ffffff">Concrete Experience</text>
          <text x="490" y="153" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600" fill="#e0f2fe">(doing / having an</text>
          <text x="490" y="170" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600" fill="#e0f2fe">experience)</text>
        </g>

        <!-- RIGHT STAGE 2: Reflective Observation -->
        <g filter="url(#kolbSoftShadow)">
          <rect x="646" y="266" width="228" height="94" rx="20" fill="#0d9488" />
          <text x="760" y="300" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="18" font-weight="800" fill="#ffffff">Reflective Observation</text>
          <text x="760" y="324" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="12.8" font-weight="600" fill="#ccfbf1">(reviewing / reflecting</text>
          <text x="760" y="342" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="12.8" font-weight="600" fill="#ccfbf1">on the experience)</text>

          <rect class="kolb-callout-bg" x="596" y="192" width="368" height="54" rx="27" fill="#ecfdf5" stroke="#2dd4bf" stroke-width="2.2" />
          <text class="kolb-callout-th" x="780" y="226" text-anchor="middle" font-family="Anuphan, Sarabun, sans-serif" font-size="18.5" font-weight="800" fill="#065f46">“สะท้อนคิด ตั้งคำถาม จากประสบการณ์จริง”</text>
        </g>

        <!-- BOTTOM STAGE 3: Abstract Conceptualisation -->
        <g filter="url(#kolbSoftShadow)">
          <rect x="364" y="438" width="252" height="92" rx="20" fill="#d97706" />
          <text x="490" y="472" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="17.8" font-weight="800" fill="#ffffff">Abstract Conceptualisation</text>
          <text x="490" y="496" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="12.8" font-weight="600" fill="#fef3c7">(concluding / learning</text>
          <text x="490" y="514" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="12.8" font-weight="600" fill="#fef3c7">from the experience)</text>

          <rect class="kolb-callout-bg" x="330" y="548" width="320" height="54" rx="27" fill="#fffbeb" stroke="#fbbf24" stroke-width="2.2" />
          <text class="kolb-callout-th" x="490" y="582" text-anchor="middle" font-family="Anuphan, Sarabun, sans-serif" font-size="20" font-weight="800" fill="#92400e">“ร่วมสรุปเป็นหลักการ”</text>
        </g>

        <!-- LEFT STAGE 4: Active Experimentation -->
        <g filter="url(#kolbSoftShadow)">
          <rect x="106" y="266" width="228" height="94" rx="20" fill="#4f46e5" />
          <text x="220" y="300" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="18" font-weight="800" fill="#ffffff">Active Experimentation</text>
          <text x="220" y="324" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="12.8" font-weight="600" fill="#e0e7ff">(planning / trying out</text>
          <text x="220" y="342" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="12.8" font-weight="600" fill="#e0e7ff">what you have learned)</text>

          <rect class="kolb-callout-bg" x="16" y="192" width="372" height="54" rx="27" fill="#eef2ff" stroke="#818cf8" stroke-width="2.2" />
          <text class="kolb-callout-th" x="202" y="226" text-anchor="middle" font-family="Anuphan, Sarabun, sans-serif" font-size="18.5" font-weight="800" fill="#312e81">“แลกเปลี่ยน เกิดการเรียนรู้อย่างต่อเนื่อง”</text>
        </g>
      </svg>
    `;
  }

  /* ---------- Complete 30-Slide Deck (Constructive Concise Prose · Source-Validated · Auto-Fit) ---------- */
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
      timeWindow: "08.34 – 08.39 น. (5 นาที)",
      kicker: "01 · RAMATHIBODI COMMUNITY MEDICINE HERITAGE",
      title: "Prof. Dr. Prem Buri — บิดาผู้วางรากฐานและต้นแบบการสอนเวชศาสตร์ชุมชน รามาธิบดี",
      keyTag: "ต้นแบบครูแพทย์",
      keyMessageHtml:
        "<strong>Prof. Dr. Prem Buri</strong>, our founding father and our role model of teaching community medicine in Ramathibodi",
      notes:
        "รำลึกถึงศาสตราจารย์เกียรติคุณ นายแพทย์เปรม บุรี หัวหน้าภาควิชาศัลยศาสตร์ท่านแรก และผู้อำนวยการโครงการเวชศาสตร์ชุมชนท่านแรกของคณะแพทยศาสตร์โรงพยาบาลรามาธิบดี (พ.ศ. 2512–2520) ผู้วางรากฐานการจัดการเรียนการสอนเวชศาสตร์ชุมชนแบบสหสาขาวิชาชีพ ณ อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา ร่วมกับกระทรวงสาธารณสุข เพื่อให้บัณฑิตแพทย์เข้าใจชีวิตจริงของประชาชนและเป็นผู้นำการเปลี่ยนแปลงในระบบสุขภาพ (Photo Grid Screensaver แสดงภาพ 1/18 รอยยิ้ม อ.เปรม บุรี, 2/18 พิธีเจิมป้ายศูนย์เวชศาสตร์ชุมชน, 3/18 ถ่ายรูปรวมกับลูกศิษย์หน้าป้าย COMMED และสุ่มลำดับภาพจดหมายเหตุที่เหลือทุก 6 วินาที)",
      render: () => `
        <div class="or-infog-split is-prem-tv-split${premReelState.expanded ? " is-cinema-expanded" : ""}" data-prem-split>
          ${renderPremScreensaverStageHtml()}

          <div class="or-stack-col is-s03-stack or-prem-right-cards" data-fit-group="cards">
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
      timeWindow: "08.39 – 08.45 น. (6 นาที)",
      kicker: "01 · HEALTH SYSTEMS SCIENCE (HSS) · THE THIRD PILLAR OF MEDICAL EDUCATION",
      title: "ศาสตร์วิทยาระบบสุขภาพ (HSS): เสาหลักที่ 3 ที่ต่อยอดความรู้พื้นฐานและคลินิกสู่การดูแลผู้ป่วยในระบบจริง",
      keyTag: "สาระสำคัญ",
      keyMessageHtml:
        "<strong>วิทยาศาสตร์พื้นฐาน</strong> อธิบายกลไกของโรค <strong>วิทยาศาสตร์คลินิก</strong> ชี้แนวทางวินิจฉัยและรักษาผู้ป่วยรายบุคคล ควบคู่กับ <strong>ศาสตร์วิทยาระบบสุขภาพ (HSS)</strong> ที่ศึกษาการจัดบริการ การทำงานร่วมกันของทีม และการพัฒนาระบบให้ดียิ่งขึ้น",
      notes:
        "ไล่เรียงตามลำดับความคิดของแผนภาพต้นฉบับทั้ง 3 รูป: (1) รูปที่ 1 แสดงเสาหลักทั้ง 3 ของแพทยศาสตรศึกษา ชี้ให้เห็นว่าลำพังการวินิจฉัยและรักษาทางคลินิกที่แม่นยำยังไม่เพียงพอ หากระบบส่งต่อ สิทธิการรักษา หรือการดูแลต่อเนื่องที่บ้านและชุมชนยังขาดช่วงจนผู้ป่วยกลับมาป่วยซ้ำ (2) รูปที่ 2A (Gonzalo et al., 2017) แสดงกรอบการเรียนรู้ศาสตร์วิทยาระบบสุขภาพ (HSS) ที่ผสานองค์ประกอบหลักของระบบสุขภาพ 6 ด้าน เข้ากับสมรรถนะร่วมที่ใช้สอดประสานในการทำงานทุกบริบท 5 ด้าน โดยมี Systems thinking เป็นตัวเชื่อมเข้ากับความรู้พื้นฐานและคลินิก และ (3) รูปที่ 2B (AMA / Skochelak et al., 2020) นำกรอบแนวคิดชุดเดียวกันมาจัดวางใหม่เพื่อย้ำว่าผู้ป่วย ครอบครัว และชุมชนคือจุดมุ่งหมายตรงกลางของทุกระบบ ก่อนซูมออกกลับมาเห็นภาพรวมทั้ง 3 รูปอีกครั้ง",
      render: () => {
        const isExportOrPrint =
          Boolean(window.__RACM_EXPORTING_DECK) || document.body.classList.contains("is-printing-orientation-deck");
        const focusVal = isExportOrPrint || state.s02Focus === 4 ? 0 : state.s02Focus || 0;
        return `
        <div class="or-s02-3fig-grid" data-fit-group="s02-takeaways" data-s02-focus="${focusVal}">
          ${s02FlowCard({
            slot: "1",
            stepBadge: "1 · THREE-PILLAR MODEL (ทำไมต้องเข้าใจระบบสุขภาพ)",
            fileName: "orient_s02_three_pillars_orig.png",
            altText: "Three-pillar model of medical education: Basic science, Clinical science, and Health systems science",
            citationHtml: "<strong>Fig. 1.4</strong> Three-pillar model · <em>Skochelak SE et al., Health Systems Science</em> (AMA / Elsevier, 2017)",
            takeawayCls: "is-rose-tint",
            takeawayKicker: "KEY TAKEAWAY · ภาพที่ 1",
            takeawayTitle: "รักษาข้างเตียงได้แม่นยำ จะเกิดผลต่อเนื่องเมื่อระบบรองรับผู้ป่วยได้จริง",
            takeawayHtml:
              "แม้การวินิจฉัยและรักษาในโรงพยาบาลจะแม่นยำ แต่หากระบบส่งต่อ สิทธิการรักษา หรือการดูแลต่อเนื่องที่บ้านและชุมชนยังขาดช่วง ผู้ป่วยก็ยัง<strong>เสี่ยงกลับมาป่วยซ้ำ</strong> เสาหลักที่ 3 จึงช่วยให้แพทย์มองเห็นและร่วมพัฒนาระบบที่ประคองผู้ป่วยได้ตลอดเส้นทางชีวิตจริง"
          })}

          ${s02FlowCard({
            slot: "2",
            stepBadge: "2A · HSS FRAMEWORK (เรียนรู้อะไรและเชื่อมกันอย่างไร)",
            fileName: "orient_s02_hss_domains_orig.png",
            altText: "Health systems science curricular framework connecting 6 core areas and 5 shared professional capabilities via systems thinking",
            citationHtml: "<strong>Fig. 1</strong> Curricular framework · <em>Gonzalo JD et al., Acad Med.</em> 2017;92(1):123–131",
            takeawayCls: "is-navy-tint",
            takeawayKicker: "KEY TAKEAWAY · ภาพที่ 2A",
            takeawayTitle: "ผสาน ‘องค์ประกอบหลักของระบบ 6 ด้าน’ เข้ากับ ‘สมรรถนะร่วมในการทำงานจริง 5 ด้าน’",
            takeawayHtml:
              "เรียนรู้<strong>องค์ประกอบหลักของระบบสุขภาพ 6 ด้าน</strong> (การจัดบริการ · นโยบายและเศรษฐศาสตร์ · สารสนเทศสุขภาพ · สุขภาพประชากร · การดูแลที่คุ้มค่า · การพัฒนาระบบ) ควบคู่กับ<strong>สมรรถนะร่วมที่ใช้สอดประสานในทุกบริบทการทำงาน 5 ด้าน</strong> (ภาวะผู้นำการเปลี่ยนแปลง · ทีมสหวิชาชีพ · เวชปฏิบัติอิงหลักฐาน · จริยธรรมวิชาชีพ · การสร้างองค์ความรู้) โดยมี<strong>การคิดเชิงระบบ (Systems thinking)</strong> เชื่อมความรู้ทั้งหมดเข้ากับการดูแลผู้ป่วย"
          })}

          ${s02FlowCard({
            slot: "3",
            stepBadge: "2B · PATIENT & COMMUNITY FOCUS (หัวใจเดียวกันในมุมผู้ป่วย)",
            fileName: "orient_s02_ama_wheel_orig.png",
            altText: "AMA Health Systems Science framework wheel with Patient, family and community at the center",
            citationHtml: "<strong>Fig. 1.2</strong> AMA HSS wheel · <em>Skochelak SE et al., Health Systems Science</em>, 2nd ed. (AMA / Elsevier, 2020)",
            takeawayCls: "is-teal-tint",
            takeawayKicker: "KEY TAKEAWAY · ภาพที่ 2B (กรอบเดียวกับ 2A)",
            takeawayTitle: "กรอบคิดเดียวกันที่วาง ‘ผู้ป่วย ครอบครัว และชุมชน’ ไว้เป็นหัวใจตรงกลาง",
            takeawayHtml:
              "นำองค์ประกอบชุดเดียวกับภาพ 2A มาจัดวางใหม่เป็นวงล้อ เพื่อย้ำว่า<strong>กลไกของระบบสุขภาพทุกระดับมีไว้เกื้อหนุนผู้ป่วย ครอบครัว และชุมชน</strong> พร้อมขยายความเข้าใจเรื่องปัจจัยกำหนดสุขภาพทางสังคม (SDH) และการขับเคลื่อนเชิงนโยบาย โดยมี<strong>การคิดเชิงระบบ</strong>โอบประสานการทำงานทุกมิติ"
          })}
        </div>
      `;
      }
    },
    {
      id: "s04-course-objectives",
      num: "04",
      section: "objectives",
      sectionLabel: "Act I · Start with Why",
      actClass: "",
      actLabel: "ACT I · OBJECTIVES",
      timeWindow: "08.45 – 08.50 น. (5 นาที)",
      kicker: "01 · COURSE GOALS (ก–ง) & 5 CORE PHYSICIAN COMPETENCIES",
      title: "วัตถุประสงค์รายวิชา (ก–ง) เชื่อมตรงสู่สมรรถนะหลักของแพทย์ทั้ง 5 ด้าน",
      keyTag: "ความสอดคล้องเชิงหลักสูตร",
      keyMessageHtml:
        "ทุกกิจกรรมการเรียนรู้และการประเมินผลใน RACM 303 ออกแบบให้สอดรับกันตั้งแต่ <strong>วัตถุประสงค์ ก–ง ไปจนถึงสมรรถนะหลักทั้ง 5 ด้าน (C1–C5)</strong>",
      notes:
        "ชี้ให้เห็นว่าวัตถุประสงค์รายวิชาทั้ง 4 หมวด (ก–ง) ในคู่มือรายวิชา ออกแบบให้รองรับบทบาทแพทย์เวชปฏิบัติอิงระบบ (Physician in Systems-Based Practice) และสมรรถนะหลัก 5 ด้านของบัณฑิตแพทย์ ซึ่งจะใช้เป็นกรอบประเมินผลสัมฤทธิ์ของรายวิชาอย่างโปร่งใส",
      render: () => `
        <div class="or-infog-split is-fig-left-compact">
          ${figPlate(
            "orient_s04_competencies.png",
            "Physician in Systems-Based Practice: 5 Core Competencies of RACM 303",
            ""
          )}

          <div class="or-grid-2 is-s04-grid" data-fit-group="cards">
            <div class="or-card is-navy-tint is-vcenter">
              <span class="or-card-kicker">ก. COGNITIVE · สมรรถนะ C1, C3</span>
              <h3 class="or-card-title">ประยุกต์ใช้ระบบสุขภาพและระบาดวิทยา</h3>
              <ul class="or-list is-s04-list">
                <li>ระบาดวิทยาคลินิกและชุมชนควบคู่เวชปฏิบัติอิงหลักฐาน (<code>EP1–EP9</code>)</li>
                <li>สุขภาพ ปัจจัยกำหนดสุขภาพ <code>SDH, CDoH</code> และการป้องกันโรค (<code>HS1</code>)</li>
                <li>ระบบบริการ <code>6BB/Models of Care</code> คุณลักษณะ <code>EQESaRR</code> ปฐมภูมิ และหลักประกันสุขภาพ (<code>HS2–6</code>)</li>
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
      num: "05",
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
        "ย้ำหัวใจสำคัญของการเรียนรู้หมวดระบบสุขภาพ ทั้ง 5 วัตถุประสงค์ออกแบบให้เชื่อมถึงกันผ่านการคิดเชิงระบบซึ่งทำหน้าที่เชื่อมทุกมิติเข้าด้วยกัน เพื่อให้ทีมมองเห็นความสัมพันธ์ของปัญหาและศักยภาพในพื้นที่จริงอย่างเป็นองค์รวมในการนำเสนอฟอร์ม 3A",
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
              <p class="or-card-text is-s05-text or-inline-sublist"><span class="or-subitem"><span class="or-num-keep"><strong>1.1</strong>&nbsp;สุขภาพองค์รวม</span><span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep"><strong>1.2</strong>&nbsp;ปัจจัยกำหนดสุขภาพ</span>ทางสังคมและพาณิชย์<span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep"><strong>1.3</strong>&nbsp;ระดับการป้องกันโรค</span>ในคลินิกและชุมชน</span></p>
            </div>

            <div class="or-card is-navy-tint is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">2 · ระบบสุขภาพและระบบบริการสุขภาพ (Health Service Systems)</span><span class="or-mini-chip">ST1 · HS2–3, 5–6</span></div>
              <p class="or-card-text is-s05-text or-inline-sublist"><span class="or-subitem"><span class="or-num-keep"><strong>2.1</strong>&nbsp;ระบบซับซ้อน</span>และการคิดเชิงระบบ<span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep"><strong>2.2</strong>&nbsp;ระบบบริการ</span>&nbsp;(<code>6BB/Models of Care/PHC/UHC</code>)<span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep"><strong>2.3</strong>&nbsp;คุณลักษณะ&nbsp;<code>EQESaRR</code></span><span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep"><strong>2.4</strong>&nbsp;วิจัยพัฒนาระบบ</span></span></p>
            </div>

            <div class="or-card is-amber-tint is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">3 · ศักยภาพชุมชนในการพัฒนาสุขภาพ (Community Potential)</span><span class="or-mini-chip">HS1 · HS5</span></div>
              <p class="or-card-text is-s05-text or-inline-sublist"><span class="or-subitem"><span class="or-num-keep"><strong>3.1</strong>&nbsp;ความหมาย</span>และองค์ประกอบของชุมชน<span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep"><strong>3.2</strong>&nbsp;บทบาททุนทางสังคม</span> อสม. และองค์กรท้องถิ่นในการร่วมดูแลสุขภาพ</span></p>
            </div>

            <div class="or-card is-teal-tint is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">4 · การสร้างเสริมสุขภาพ (Health Promotion)</span><span class="or-mini-chip">HS4 · COM-B</span></div>
              <p class="or-card-text is-s05-text or-inline-sublist"><span class="or-subitem"><span class="or-num-keep"><strong>4.1</strong>&nbsp;แนวคิด</span>การสร้างเสริมสุขภาพ<span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep"><strong>4.2</strong>&nbsp;กลยุทธ์</span> Ottawa Charter, HiAP และกรอบ&nbsp;<code>COM-B</code><span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep"><strong>4.3</strong>&nbsp;การเชื่อมเข้ากับระบบบริการ</span></span></p>
            </div>

            <div class="or-card is-white is-s05-card">
              <div class="or-card-head-inline"><span class="or-card-kicker">5 · บทบาทแพทย์ในระบบสุขภาพ (Physician Roles in Health Systems)</span><span class="or-mini-chip">Applying HSS</span></div>
              <p class="or-card-text is-s05-text or-inline-sublist"><span class="or-subitem"><span class="or-num-keep"><strong>5.1</strong>&nbsp;บทบาทของแพทย์</span>ในแต่ละระดับบริการ<span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep"><strong>5.2</strong>&nbsp;การประยุกต์สมรรถนะ</span>ระบบสุขภาพร่วมกับทีมสหวิชาชีพและชุมชน</span></p>
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
      timeWindow: "08.54 – 08.57 น. (3 นาที)",
      kicker: "02 · 6-WEEK LEARNING JOURNEY (25 NOV – 30 DEC 2569)",
      title: "เส้นทางการเรียนรู้ 6 สัปดาห์ จากการปูความรู้สู่การฝึกภาคสนามและการนำเสนอบูรณาการ",
      keyTag: "ลำดับการเรียนรู้",
      keyMessageHtml:
        "<strong>เรียนความรู้ระบบและระบาดฯ จนครบ</strong> &rarr; <strong>สอบระบาดฯ</strong> &rarr; <strong>ลงฝึกภาคสนามและทำ Health Survey</strong> &rarr; <strong>กลับมาสอบระบบฯ ภาคทฤษฎี</strong> &rarr; <strong>สะท้อนการคิดเชิงระบบเชื่อมโยงองค์ความรู้อย่างบูรณาการผ่านการนำเสนองานทั้งระบบและระบาดฯ</strong>",
      notes:
        "สรุปเส้นทางการเรียนรู้ 6 สัปดาห์แบบเข้าใจง่ายตามลำดับขั้น: สัปดาห์ที่ 1–2 เรียนเนื้อหาระบบสุขภาพและระบาดวิทยาจนครบ สัปดาห์ที่ 3 สอบทฤษฎีระบาดวิทยา (8 ธ.ค.) เวิร์กชอป Learning How to Learn (9 ธ.ค.) และเตรียมพร้อมก่อนเดินทาง สัปดาห์ที่ 4 ลงฝึกภาคสนาม ณ โรงพยาบาลแหล่งฝึก 9 แห่ง (7–9 คืน) พร้อมทำ Health Survey ในชุมชน สัปดาห์ที่ 5 กลับมาสอบทฤษฎีระบบสุขภาพ (22 ธ.ค.) และฝึกวาดผังคิดเชิงระบบ (CLD) ก่อนเข้าสู่สัปดาห์ที่ 6 สะท้อนการคิดเชิงระบบเชื่อมโยงองค์ความรู้อย่างบูรณาการผ่านการนำเสนองานทั้งระบบสุขภาพ (29 ธ.ค.) และระบาดวิทยา (30 ธ.ค.)",
      render: () => {
        const isExportOrPrint =
          Boolean(window.__RACM_EXPORTING_DECK) || document.body.classList.contains("is-printing-orientation-deck");
        const revVal = isExportOrPrint ? 1 : state.heroReveal ? 1 : 0;
        return `
        <div class="or-top-fig-stack is-s06-stack is-hero-reveal-stage" data-hero-reveal="${revVal}">
          ${figPlate("orient_s06_roadmap.png", "6-Week Learning Journey across Classroom Preparation, 9 Training Hospitals, and Team Synthesis", "")}

          <div class="or-grid-6 is-s06-grid" data-fit-group="cards">
            <div class="or-card is-white is-s06-card">
              <div>
                <span class="or-card-kicker">W1 · 25–27 พ.ย.</span>
                <h3 class="or-card-title is-s06-title">เปิดมุมมองระบบและระบาดฯ</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li>ปูพื้นฐานคิดเชิงระบบ (<code>ST1</code>) และบทบาท <code>SBP</code></li>
                <li>เริ่มเรียนระบบสุขภาพ (<code>HS1</code>) และระบาดฯ (<code>EP1–3</code>)</li>
                <li>พบอาจารย์ที่ปรึกษาเตรียมทีม (<code>SG #1</code>)</li>
              </ul>
            </div>

            <div class="or-card is-white is-s06-card">
              <div>
                <span class="or-card-kicker">W2 · 30 พ.ย.–4 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">เรียนความรู้ระบบ–ระบาดฯ จนครบ</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li>เรียนระบบบริการ ปฐมภูมิ และหลักประกันฯ (<code>HS2–6</code>)</li>
                <li>เรียนวิจัย สอบสวนโรค สำรวจ และ EBM (<code>EP4–9</code>)</li>
                <li>วางแผนสำรวจสุขภาพชุมชนร่วมกัน (<code>SG #2</code>)</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W3 · 8–12 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">สอบระบาดฯ ก่อนลงภาคสนาม</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>สอบทฤษฎีระบาดฯ (8 ธ.ค.)</strong> และฝึก <code>SPSS</code></li>
                <li>เวิร์กชอป <code>Learning How to Learn</code> และส่ง <code>SRN 1</code></li>
                <li>เตรียมเครื่องมือพร้อมเดินทาง (<code>SG #3–5</code>)</li>
              </ul>
            </div>

            <div class="or-card is-teal-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W4 · 9–20 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">ฝึกภาคสนามและทำ Health Survey</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li>เรียนรู้ รพ. และชุมชนจริง <strong>9 แห่ง (7–9 คืน)</strong></li>
                <li>เก็บข้อมูลสำรวจสุขภาพ (<strong>Health Survey</strong>)</li>
                <li>สังเกตการเชื่อมโยงระบบสุขภาพในพื้นที่จริง</li>
              </ul>
            </div>

            <div class="or-card is-navy-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W5 · 21–25 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">กลับมาสอบระบบฯ ภาคทฤษฎี</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li><strong>สอบทฤษฎีระบบสุขภาพ (22 ธ.ค. · โน้ต A4)</strong></li>
                <li>สังเคราะห์ความซับซ้อนจากพื้นที่ (<code>ST2</code>) และเสวนานโยบาย</li>
                <li>วิเคราะห์ข้อมูลและถอดบทเรียน (<code>SG #6–8</code>)</li>
              </ul>
            </div>

            <div class="or-card is-rose-tint is-s06-card">
              <div>
                <span class="or-card-kicker">W6 · 28–30 ธ.ค.</span>
                <h3 class="or-card-title is-s06-title">นำเสนอบูรณาการระบบและระบาดฯ</h3>
              </div>
              <ul class="or-list is-s06-list">
                <li>สะท้อนการคิดเชิงระบบเชื่อมโยงองค์ความรู้</li>
                <li><strong>นำเสนองานระบบฯ (29 ธ.ค.) และระบาดฯ (30 ธ.ค.)</strong></li>
                <li>สรุปบทเรียนพัฒนาตนในงานเขียน <code>SRN 2</code></li>
              </ul>
            </div>
          </div>
        </div>
      `;
      }
    },
    {
      id: "s06b-schedule-w1-w3",
      num: "07",
      section: "experience",
      sectionLabel: "Act II · Schedule W1–W3",
      actClass: "is-act-2",
      actLabel: "ACT II · RACM 303 SCHEDULE (W1–W3)",
      timeWindow: "08.57 – 08.59 น. (2 นาที)",
      kicker: "02 · RACM 303 SCHEDULE · WEEKS 1–3 (25 NOV – 12 DEC 2569)",
      title: "RACM 303 Schedule · ตารางเรียนรายสัปดาห์ ปีการศึกษา 2569 (สัปดาห์ที่ 1 – 3)",
      keyTag: "ตารางสัปดาห์ 1–3",
      keyMessageHtml:
        "คาบ <strong>HS1–HS6</strong> บรรยายห้องใหญ่ <code>2C2-03</code> (1 ชม.) ต่อด้วยอภิปราย <strong>6 ห้องย่อย</strong> (<code>1C1-02..07</code>) · <strong>ระบาดวิทยา Day 1–3</strong> ผสมผสาน <code>Auditorium / 2C2-03</code> และ <strong>Online Exercise</strong> · สอบทฤษฎีระบาดฯ <strong>อ. 8 ธ.ค.</strong>",
      notes:
        "ชี้แจงตารางเรียนรายคาบเช้าและบ่ายของสัปดาห์ที่ 1 ถึงสัปดาห์ที่ 3 ปีการศึกษา 2569: สัปดาห์ที่ 1 เริ่มวันพุธ 25 พ.ย. 08.30 น. Orientation ต่อด้วย ST1 และบ่ายเสวนา Global/Planetary Health & HPSR วันพฤหัสฯ 26 พ.ย. HS1 เช้า และพบ อ.ที่ปรึกษา ครั้งที่ 1 (9 กลุ่ม) บ่าย วันศุกร์ 27 พ.ย. ระบาด Day 1 (EP1–3) ณ ห้อง Auditorium และทำแบบฝึกหัดออนไลน์ สัปดาห์ที่ 2 เรียน HS2–HS5 จันทร์-อังคาร ระบาด Day 2–3 พุธ-พฤหัสฯ และ HS6 + พบ อ.ที่ปรึกษา ครั้งที่ 2 วันศุกร์ สัปดาห์ที่ 3 หยุดชดเชยวันพ่อ 7 ธ.ค. สอบระบาดฯ เช้า 8 ธ.ค. บ่ายเรียน SPSS และกลุ่มย่อยครั้งที่ 3 วันพุธ 9 ธ.ค. Workshop: Learning How to Learn เช้า กลุ่มย่อยครั้งที่ 4 บ่าย ส่ง SRN 1 ภายใน 17.00 น. และเริ่มทยอยเดินทางสู่พื้นที่ภาคสนาม 9–12 ธ.ค.",
      render: () => `
        <div class="or-table-wrap is-sched-matrix" data-fit-table="1" data-mobile-scroll-hint="เลื่อนตารางซ้ายและขวาเพื่อดูตารางเรียนสัปดาห์ที่ 1–3 ครบทุกวัน">
          <table class="or-table or-sched-matrix">
            <colgroup>
              <col style="width:10.5%" />
              <col style="width:17.9%" />
              <col style="width:17.9%" />
              <col style="width:17.9%" />
              <col style="width:17.9%" />
              <col style="width:17.9%" />
            </colgroup>
            <tbody>
              <tr class="is-wk-head">
                <th class="is-wk-badge">สัปดาห์ที่ 1</th>
                <th>จันทร์ 23 พ.ย.</th>
                <th>อังคาร 24 พ.ย.</th>
                <th>พุธ 25 พฤศจิกายน</th>
                <th>พฤหัสบดี 26 พฤศจิกายน</th>
                <th>ศุกร์ 27 พฤศจิกายน</th>
              </tr>
              <tr>
                <td class="is-period-col"><strong>เช้า</strong><span class="or-sch-p-time">(08.30–12.00)</span></td>
                <td rowspan="2" class="is-muted-off"><span class="or-sch-off">—</span><span class="or-sch-room">ยังไม่มีคาบเรียน</span></td>
                <td rowspan="2" class="is-prep-off"><strong>เตรียมขึ้นกองภาควิชาฯ</strong><span class="or-sch-room">(นศพ. เริ่มเรียน พ. 25 พ.ย.)</span></td>
                <td class="is-panel">
                  <div><strong>08.30–09.30 Orientation</strong> <span class="or-sch-room">(2C2-03)</span></div>
                  <div><strong>09.30–12.00 ST1: Systems Thinking</strong> <span class="or-sch-room">(ห้องใหญ่ 2C2-03)</span></div>
                </td>
                <td class="is-hs">
                  <div><strong>HS1: Health, SDH &amp; Prevention</strong></div>
                  <div class="or-sch-room">08.30–09.30 (ห้องใหญ่ 2C2-03)<br>09.40–12.00 (ห้องย่อย 6 ห้อง)</div>
                </td>
                <td class="is-ep">
                  <div><strong>ระบาด Day 1 (EP1–EP3)</strong></div>
                  <div class="or-sch-room">08.30–11.00 (Auditorium) · 11.00–12.00 Ex 2–3<br>(SDL Exercise via Moodle RAMA e-Learning · ไม่เช็คชื่อ)</div>
                </td>
              </tr>
              <tr>
                <td class="is-period-col"><strong>บ่าย</strong><span class="or-sch-p-time">(13.30–17.00)</span></td>
                <td class="is-panel">
                  <div><strong>13.30–17.00 เสวนา Bedside to SBP</strong></div>
                  <div class="or-sch-room">Global/Planetary Health &amp; HPSR (ห้องใหญ่ 2C2-03)</div>
                </td>
                <td class="is-sg">
                  <div><strong>พบ อ.ที่ปรึกษา ครั้งที่ 1 (SG1)</strong></div>
                  <div class="or-sch-room">13.30–17.00 น. (ห้องย่อย 9 ห้อง)</div>
                </td>
                <td class="is-ep">
                  <div><strong>SDL Exercise via Moodle RAMA e-Learning</strong></div>
                  <div class="or-sch-room">13.30–17.00 น. Exercise Day 1 (ไม่เช็คชื่อ)</div>
                </td>
              </tr>

              <tr class="is-wk-head">
                <th class="is-wk-badge">สัปดาห์ที่ 2</th>
                <th>จันทร์ 30 พฤศจิกายน</th>
                <th>อังคาร 1 ธันวาคม</th>
                <th>พุธ 2 ธันวาคม</th>
                <th>พฤหัสบดี 3 ธันวาคม</th>
                <th>ศุกร์ 4 ธันวาคม</th>
              </tr>
              <tr>
                <td class="is-period-col"><strong>เช้า</strong><span class="or-sch-p-time">(08.30–12.00)</span></td>
                <td class="is-hs">
                  <div><strong>HS2: Health Services I</strong></div>
                  <div class="or-sch-room">08.30–09.30 (ห้องใหญ่ 2C2-03)<br>09.40–12.00 (ห้องย่อย 6 ห้อง)</div>
                </td>
                <td class="is-hs">
                  <div><strong>HS4: Health Promotion &amp; COM-B</strong></div>
                  <div class="or-sch-room">08.30–09.30 (ห้องใหญ่ 2C2-03)<br>09.40–12.00 (ห้องย่อย 6 ห้อง)</div>
                </td>
                <td class="is-ep">
                  <div><strong>ระบาด Day 2 (EP4–EP5)</strong></div>
                  <div class="or-sch-room">08.30–12.00 น. Study Designs &amp; Outbreak (2C2-03 / Zoom)</div>
                </td>
                <td class="is-ep">
                  <div><strong>ระบาด Day 3 (EP6–EP8)</strong></div>
                  <div class="or-sch-room">08.30–12.00 น. Burden, Survey &amp; RCT<br>(2C2-03 / Zoom)</div>
                </td>
                <td class="is-hs">
                  <div><strong>HS6: Health Insurance &amp; Payment</strong></div>
                  <div class="or-sch-room">08.30–09.30 &amp; 09.40–12.00<br>(รวม 6 กลุ่ม ณ ห้องใหญ่ 2C2-03)</div>
                </td>
              </tr>
              <tr>
                <td class="is-period-col"><strong>บ่าย</strong><span class="or-sch-p-time">(13.30–17.00)</span></td>
                <td class="is-hs">
                  <div><strong>HS3: Health Services II (EQESaRR)</strong></div>
                  <div class="or-sch-room">13.30–14.30 (ห้องใหญ่ 2C2-03)<br>14.40–17.00 (ห้องย่อย 6 ห้อง)</div>
                </td>
                <td class="is-hs">
                  <div><strong>HS5: Primary Health Care &amp; PC</strong></div>
                  <div class="or-sch-room">13.30–14.30 (ห้องใหญ่ 2C2-03)<br>14.40–17.00 (ห้องย่อย 6 ห้อง)</div>
                </td>
                <td class="is-ep">
                  <div><strong>Exercise ระบาด 4–5 &amp; Q&amp;A</strong></div>
                  <div class="or-sch-room">13.30–16.30 Ex 4–5 · 16.30–17.00 Q&amp;A Day 1–2 (Zoom)</div>
                </td>
                <td class="is-ep">
                  <div><strong>13.30–14.30 EP9: EBM</strong> <span class="or-sch-room">(2C2-03)</span></div>
                  <div class="or-sch-room">14.30–17.00 Ex 6–7 &amp; Q&amp;A Day 3 (Online / Zoom)</div>
                </td>
                <td class="is-sg">
                  <div><strong>พบ อ.ที่ปรึกษา ครั้งที่ 2 (SG2)</strong></div>
                  <div class="or-sch-room">13.30–17.00 น. (ห้องย่อย 9 ห้อง)</div>
                </td>
              </tr>

              <tr class="is-wk-head">
                <th class="is-wk-badge">สัปดาห์ที่ 3</th>
                <th>จันทร์ 7 ธันวาคม</th>
                <th>อังคาร 8 ธันวาคม</th>
                <th>พุธ 9 ธันวาคม</th>
                <th>พฤหัสบดี 10 ธันวาคม</th>
                <th>ศุกร์ 11 ธ.ค. (+ ส. 12 ธ.ค.)</th>
              </tr>
              <tr>
                <td class="is-period-col"><strong>เช้า</strong><span class="or-sch-p-time">(08.30–12.00)</span></td>
                <td rowspan="2" class="is-holiday">
                  <span class="or-sch-hol">หยุดชดเชยวันพ่อแห่งชาติ</span>
                  <span class="or-sch-room">(วันคล้ายวันพระราชสมภพ ร.9)</span>
                </td>
                <td class="is-exam">
                  <div><strong class="or-sch-exam-txt">สอบทฤษฎีระบาดวิทยา (EP1–9)</strong></div>
                  <div class="or-sch-room">08.30–12.00 น. (ห้องใหญ่ 2C2-02..03)</div>
                </td>
                <td class="is-panel">
                  <div><strong>Workshop: Learning How to Learn</strong></div>
                  <div class="or-sch-room">08.30–12.00 น. รศ.สุรเกียรติ (ห้องใหญ่ 2C2-02..03)</div>
                </td>
                <td rowspan="2" class="is-holiday">
                  <span class="or-sch-hol">หยุดวันรัฐธรรมนูญ</span>
                  <span class="or-sch-travel">เดินทาง: เพชรบูรณ์ 1–2 (เช้า)<br>กุฉินารายณ์, ตะกั่วป่า (รถไฟเย็น)</span>
                </td>
                <td class="is-sg">
                  <div><strong>พบ อ.ที่ปรึกษา ครั้งที่ 4 (เตรียมพื้นที่ 1)</strong></div>
                  <div class="or-sch-room">09.00–12.00 น. (4 กลุ่ม: ด่านซ้าย, ท่าวังผา, อุบลรัตน์, ท่าสองยาง)</div>
                </td>
              </tr>
              <tr>
                <td class="is-period-col"><strong>บ่าย</strong><span class="or-sch-p-time">(13.30–17.00)</span></td>
                <td class="is-sg">
                  <div><strong>13.30–15.00 SPSS</strong> <span class="or-sch-room">(2C2-03 / Zoom)</span></div>
                  <div><strong>15.00–17.00 พบ อ.ที่ปรึกษา ครั้งที่ 3</strong> <span class="or-sch-room">(ห้องย่อย 9 ห้อง)</span></div>
                </td>
                <td class="is-sg">
                  <div><strong>13.30–17.00 พบ อ.ที่ปรึกษา ครั้งที่ 4</strong> <span class="or-sch-room" style="white-space:nowrap">(9 ห้อง)</span></div>
                  <div><strong class="or-sch-dl">ส่ง SRN 1 (17.00)</strong> · <span class="or-sch-travel">23.00 อุ้มผางเดินทาง</span></div>
                </td>
                <td class="is-sg">
                  <div><strong>พบ อ.ที่ปรึกษา ครั้งที่ 5 (7 เครื่องมือ)</strong></div>
                  <div class="or-sch-travel">13.30–17.00 น. · เย็นท่าสองยาง · ส. 12 ธ.ค. ด่านซ้าย, ท่าวังผา, อุบลรัตน์เดินทาง</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    },
    {
      id: "s06c-schedule-w4-w6",
      num: "08",
      section: "experience",
      sectionLabel: "Act II · Schedule W4–W6",
      actClass: "is-act-2",
      actLabel: "ACT II · RACM 303 SCHEDULE (W4–W6)",
      timeWindow: "08.59 – 09.01 น. (2 นาที)",
      kicker: "02 · RACM 303 SCHEDULE · WEEKS 4–6 (13 – 30 DEC 2569)",
      title: "RACM 303 Schedule · ตารางเรียนรายสัปดาห์ ปีการศึกษา 2569 (สัปดาห์ที่ 4 – 6)",
      keyTag: "ตารางสัปดาห์ 4–6",
      keyMessageHtml:
        "สัปดาห์ที่ 4 <strong>ฝึกภาคสนาม 9 พื้นที่ (9–20 ธ.ค.)</strong> · สัปดาห์ที่ 5 <strong>สอบทฤษฎีระบบสุขภาพ (22 ธ.ค. · โน้ต A4)</strong> ต่อด้วย <code>ST2</code> และสังเคราะห์ข้อมูลใน <code>SG 6–10</code> · สัปดาห์ที่ 6 <strong>นำเสนอระบบฯ (29 ธ.ค.) และระบาดฯ (30 ธ.ค.)</strong>",
      notes:
        "ชี้แจงตารางเรียนสัปดาห์ที่ 4 ถึงสัปดาห์ที่ 6 ปีการศึกษา 2569: สัปดาห์ที่ 4 ลงฝึกภาคสนาม ณ รพ.ชุมชนและชุมชนเป้าหมายทั้ง 9 พื้นที่ (เดินทางกลับครบทุกกลุ่มภายในอาทิตย์ที่ 20 ธ.ค.) สัปดาห์ที่ 5 วันจันทร์ 21 ธ.ค. เตรียมสอบ (SDL ไม่เช็คชื่อ) วันอังคาร 22 ธ.ค. เช้าสอบทฤษฎีระบบสุขภาพ (จัดสอบ 3 ห้องใหญ่ Open Note A4 ลายมือ 1 แผ่น) บ่าย ST2 - Synthesis from Dynamic Complexity from the field วันพุธ 23 – ศุกร์ 25 ธ.ค. เสวนาสุขภาวะข้างถนน เสวนานโยบายสุขภาพ และพบ อ.ที่ปรึกษา ครั้งที่ 6–8 สัปดาห์ที่ 6 วันจันทร์ 28 ธ.ค. พบ อ.ที่ปรึกษา ครั้งที่ 9–10 วันอังคาร 29 ธ.ค. นำเสนอระบบสุขภาพ (10 นาที + อภิปราย 20 นาที) วันพุธ 30 ธ.ค. เช้านำเสนอระบาดวิทยา (7 นาที + อภิปราย 18 นาที) บ่ายประเมินเจตคติและส่ง SRN 2 + สไลด์ภายใน 17.00 น. ก่อนหยุดวันสิ้นปี 31 ธ.ค. และวันปีใหม่ 1 ม.ค.",
      render: () => `
        <div class="or-table-wrap is-sched-matrix is-w46-matrix" data-fit-table="1" data-mobile-scroll-hint="เลื่อนตารางซ้ายและขวาเพื่อดูตารางเรียนสัปดาห์ที่ 4–6 ครบทุกวัน">
          <table class="or-table or-sched-matrix">
            <colgroup>
              <col style="width:10.5%" />
              <col style="width:17.9%" />
              <col style="width:17.9%" />
              <col style="width:17.9%" />
              <col style="width:17.9%" />
              <col style="width:17.9%" />
            </colgroup>
            <tbody>
              <tr class="is-wk-head">
                <th class="is-wk-badge">สัปดาห์ที่ 4</th>
                <th colspan="5">14 – 20 ธันวาคม 2569 (ต่อเนื่องช่วงเดินทางและฝึกปฏิบัติงานภาคสนาม 9 – 20 ธันวาคม 2569)</th>
              </tr>
              <tr>
                <td class="is-period-col"><strong>เช้า</strong></td>
                <td colspan="5" rowspan="2" class="is-field-band">
                  <div class="or-sch-field-pill">วันที่ 9 – 20 ธันวาคม 2569 · ฝึกปฏิบัติงานภาคสนาม ณ โรงพยาบาลแหล่งฝึกและชุมชนทั้ง 9 พื้นที่ (7–9 คืน)</div>
                  <div class="or-sch-field-sub or-inline-sublist"><strong>เดินทางกลับถึง:</strong> <span class="or-subitem">อุ้มผาง (ศ.&nbsp;18&nbsp;ธ.ค.)<span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem">กุฉินารายณ์, ด่านซ้าย, ตะกั่วป่า, ท่าวังผา, เพชรบูรณ์&nbsp;1–2, ท่าสองยาง (ส.&nbsp;19&nbsp;ธ.ค.)<span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem">อุบลรัตน์ (อา.&nbsp;20&nbsp;ธ.ค.)</span></div>
                </td>
              </tr>
              <tr>
                <td class="is-period-col"><strong>บ่าย</strong></td>
              </tr>

              <tr class="is-wk-head">
                <th class="is-wk-badge">สัปดาห์ที่ 5</th>
                <th>จันทร์ 21 ธันวาคม</th>
                <th>อังคาร 22 ธันวาคม</th>
                <th>พุธ 23 ธันวาคม</th>
                <th>พฤหัสบดี 24 ธันวาคม</th>
                <th>ศุกร์ 25 ธันวาคม</th>
              </tr>
              <tr>
                <td class="is-period-col"><strong>เช้า</strong><span class="or-sch-p-time">(08.30/09.00–12.00)</span></td>
                <td class="is-sdl">
                  <div><strong>เตรียมสอบ (SDL · 09.00–12.00)</strong></div>
                  <div class="or-sch-room">ทบทวนและสรุปโน้ต A4<br>(ห้องย่อย 9 ห้อง · ไม่เช็คชื่อ)</div>
                </td>
                <td class="is-exam">
                  <div><strong class="or-sch-exam-txt">สอบทฤษฎีระบบสุขภาพ (HS1–6)</strong></div>
                  <div class="or-sch-room">08.30–12.00 น. · Open Note A4<br>(จัดสอบ 3 ห้องใหญ่ 2C2-01..03)</div>
                </td>
                <td class="is-panel">
                  <div><strong>เสวนา 6BB สู่ระบบที่เป็นธรรม</strong></div>
                  <div class="or-sch-room">09.00–12.00 น. “สุขภาวะข้างถนน”<br>(ห้องใหญ่ 2C2-03)</div>
                </td>
                <td class="is-sg">
                  <div><strong>พบ อ.ที่ปรึกษา ครั้งที่ 6 (ต่อ)</strong></div>
                  <div class="or-sch-room">09.00–12.00 น. สรุปข้อมูล &amp; Survey<br>(ห้องย่อย 9 ห้อง)</div>
                </td>
                <td class="is-sg">
                  <div><strong>พบ อ.ที่ปรึกษา ครั้งที่ 7 (SG7)</strong></div>
                  <div class="or-sch-room">09.00–12.00 น. สรุปข้อมูล &amp; Survey<br>(ห้องย่อย 9 ห้อง · ไม่เช็คชื่อ)</div>
                </td>
              </tr>
              <tr>
                <td class="is-period-col"><strong>บ่าย</strong><span class="or-sch-p-time">(13.30–17.00)</span></td>
                <td class="is-sdl">
                  <div><strong>เตรียมสอบ (SDL ต่อ)</strong></div>
                  <div class="or-sch-room">13.30–17.00 น.<br>(ห้องย่อย 9 ห้อง · ไม่เช็คชื่อ)</div>
                </td>
                <td class="is-panel">
                  <div><strong>ST2: Synthesis from Dynamic Complexity</strong></div>
                  <div><span class="or-sch-accent">13.30–17.00 น. from the field</span> <span class="or-sch-room">(ห้องใหญ่ 2C2-03)</span></div>
                </td>
                <td class="is-sg">
                  <div><strong>พบ อ.ที่ปรึกษา ครั้งที่ 6 (SG6)</strong></div>
                  <div class="or-sch-room">13.30–17.00 น. สรุปข้อมูลภาคสนาม (ห้องย่อย 9 ห้อง)</div>
                </td>
                <td class="is-panel">
                  <div><strong>Panel: Young-Gen SBP &amp; นโยบาย</strong></div>
                  <div class="or-sch-room">13.30–17.00 น. เศรษฐศาสตร์การเมืองสุขภาพ (ห้องใหญ่ 2C2-03)</div>
                </td>
                <td class="is-sg">
                  <div><strong>พบ อ.ที่ปรึกษา ครั้งที่ 8 (SG8)</strong></div>
                  <div class="or-sch-room">13.30–17.00 น. สรุปข้อมูล &amp; Survey<br>(ห้องย่อย 9 ห้อง · ไม่เช็คชื่อ)</div>
                </td>
              </tr>

              <tr class="is-wk-head">
                <th class="is-wk-badge">สัปดาห์ที่ 6</th>
                <th>จันทร์ 28 ธันวาคม</th>
                <th>อังคาร 29 ธันวาคม</th>
                <th>พุธ 30 ธันวาคม</th>
                <th>พฤหัสบดี 31 ธันวาคม</th>
                <th>ศุกร์ 1 มกราคม 70</th>
              </tr>
              <tr>
                <td class="is-period-col"><strong>เช้า</strong><span class="or-sch-p-time">(08.30/09.00–12.00)</span></td>
                <td class="is-sg">
                  <div><strong>พบ อ.ที่ปรึกษา ครั้งที่ 9 (SG9)</strong></div>
                  <div class="or-sch-room">09.00–12.00 น. สรุปข้อมูลภาคสนาม (ห้องย่อย 9 ห้อง · ไม่เช็คชื่อ)</div>
                </td>
                <td class="is-oral">
                  <div><strong class="or-sch-oral-txt">นำเสนอระบบ (10 นาที + อภิปราย 20 นาที)</strong></div>
                  <div class="or-sch-room">08.30–12.00 น. (ลงทะเบียน 08.00 · ห้องใหญ่ 2C2-03)</div>
                </td>
                <td class="is-oral">
                  <div><strong class="or-sch-oral-txt">นำเสนอระบาด (7 นาที + อภิปราย 18 นาที)</strong></div>
                  <div class="or-sch-room">08.30–12.00 น. (ลงทะเบียน 08.00 · ห้องใหญ่ 2C2-03)</div>
                </td>
                <td rowspan="2" class="is-holiday">
                  <span class="or-sch-hol">หยุดวันสิ้นปี</span>
                </td>
                <td rowspan="2" class="is-holiday">
                  <span class="or-sch-hol">หยุดวันขึ้นปีใหม่</span>
                </td>
              </tr>
              <tr>
                <td class="is-period-col"><strong>บ่าย</strong><span class="or-sch-p-time">(13.30–17.00)</span></td>
                <td class="is-sg">
                  <div><strong>พบ อ.ที่ปรึกษา ครั้งที่ 10 (SG10)</strong></div>
                  <div class="or-sch-room">13.30–17.00 น. ซักซ้อมการนำเสนอ (ห้องย่อย 9 ห้อง · ไม่เช็คชื่อ)</div>
                </td>
                <td class="is-oral">
                  <div><strong>13.30–15.30 นำเสนอระบบ (ต่อ)</strong> <span class="or-sch-room" style="white-space:nowrap">(2C2-03)</span></div>
                  <div><strong>15.30–17.00 เตรียมนำเสนอระบาด</strong> <span class="or-sch-room" style="white-space:nowrap">(9 ห้อง · ไม่เช็คชื่อ)</span></div>
                </td>
                <td class="is-sdl">
                  <div><strong>13.30–17.00 SDL &amp; ประเมินเจตคติ</strong></div>
                  <div><strong class="or-sch-dl">ภายใน 17.00 ส่ง SRN 2 + สไลด์ &amp; Survey</strong></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    },
    {
      id: "s07-hs-guided-learning",
      num: "09",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.01 – 09.04 น. (3 นาที)",
      kicker: "02 · HEALTH SYSTEMS SCIENCE ARCHITECTURE (ST1 & HS1–HS6)",
      title: "การเรียนรู้หมวดระบบสุขภาพแบบนำทาง 6 ขั้นตอน ควบคู่กับ 6 เวทีฝึกคิดเชิงระบบ",
      keyTag: "การออกแบบการเรียนรู้",
      keyMessageHtml:
        "สร้างพื้นฐานความรู้สู่ <strong>โน้ตสรุป A4 สำหรับสอบข้อเขียน</strong> ควบคู่กับการฝึก <strong>การคิดเชิงระบบ</strong> เพื่อเชื่อมโยงทั้ง 5 วัตถุประสงค์ในการนำเสนอทีม (<code>ฟอร์ม 3A</code>)",
      notes:
        "อธิบายเส้นทางเรียนรู้ 6 ขั้นตอนของ ST1 และ HS1–HS6 ตั้งแต่เอกสารฉบับเต็มและฉบับย่อ แบบทดสอบและคำศัพท์ทบทวน บรรยายสรุป อภิปรายกลุ่มย่อย ไปจนถึงการดู VDO Lecture ทบทวน ควบคู่กับ 6 เวทีฝึกคิดเชิงระบบ (18.5 ชม.) ซึ่งช่วยบ่มเพาะสมรรถนะการคิดเชิงระบบเพื่อใช้เชื่อมโยงทั้ง 5 วัตถุประสงค์ในการนำเสนอผลงานทีมฟอร์ม 3A และงานสะท้อนคิด",
      render: () => {
        const isExportOrPrint =
          Boolean(window.__RACM_EXPORTING_DECK) || document.body.classList.contains("is-printing-orientation-deck");
        const revVal = isExportOrPrint ? 1 : state.heroReveal ? 1 : 0;
        return `
        <div class="or-top-fig-stack is-s07-stack is-hero-reveal-stage" data-hero-reveal="${revVal}">
          ${figPlate("orient_s07_guided_flow.png", "6-Step Guided Learning Flow including Subgroup Discussion and VDO Lecture Review", "")}

          <div class="or-infog-split is-even is-full-h">
            <div class="or-card is-navy-tint is-vcenter" data-fit-solo="1">
              <span class="or-card-kicker">6-STEP GUIDED LEARNING (ST1 และ HS1–HS6)</span>
              <h3 class="or-card-title">จากการอ่านเตรียมความพร้อมสู่การอภิปรายกลุ่มย่อยและดู VDO ทบทวน</h3>
              <ul class="or-list is-s07-list">
                <li><strong>ขั้นที่ 1–2 เอกสารฉบับเต็มและฉบับย่อ:</strong> ศึกษาแนวคิดหลักและตอบคำถามนำก่อนเข้าชั้นเรียน</li>
                <li><strong>ขั้นที่ 3 แบบทดสอบและคำศัพท์ทบทวน:</strong> ฝึกทบทวนความเข้าใจด้วยตนเองเพื่อพัฒนาการเรียนรู้</li>
                <li><strong>ขั้นที่ 4–5 บรรยายสรุป 1 ชม. (<code>2C2-03</code>) และอภิปรายกลุ่มย่อย 6 ห้อง (<code>1C1-02..07</code>):</strong> ร่วมอภิปรายกรณีศึกษาเชิงระบบ</li>
                <li><strong>ขั้นที่ 6 ดู VDO Lecture ทบทวน:</strong> ทบทวนสาระสำคัญและประเด็นเชื่อมโยงได้ทุกที่ตามจังหวะการเรียนรู้</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint is-vcenter" data-fit-solo="1">
              <div>
                <span class="or-card-kicker">6 เวทีบ่มเพาะการคิดเชิงระบบ (18.5 ชั่วโมง)</span>
                <p class="or-card-text is-s07-note">มุ่งเน้นฝึกเชื่อมโยงทั้ง 5 วัตถุประสงค์สำหรับการนำเสนอทีม (ฟอร์ม 3A) และงานสะท้อนคิด โดยไม่ออกสอบข้อเขียน</p>
              </div>
              <div class="or-s07-chips-grid">
                <span class="or-mini-chip is-s07-chip"><span class="or-num-keep">1.&nbsp;ST1</span> ระบบซับซ้อนและการคิดเชิงระบบ (25&nbsp;พ.ย.)</span>
                <span class="or-mini-chip is-s07-chip"><span class="or-num-keep">2.&nbsp;สุขภาพโลก</span>และวิจัยระบบสุขภาพ (25&nbsp;พ.ย.)</span>
                <span class="or-mini-chip is-s07-chip"><span class="or-num-keep">3.&nbsp;Learning How to Learn</span> เตรียมลงพื้นที่ (9&nbsp;ธ.ค.)</span>
                <span class="or-mini-chip is-s07-chip"><span class="or-num-keep">4.&nbsp;ST2</span> Synthesis from Dynamic Complexity (22&nbsp;ธ.ค.)</span>
                <span class="or-mini-chip is-s07-chip"><span class="or-num-keep">5.&nbsp;วิเคราะห์&nbsp;6BB</span> สุขภาวะข้างถนน (23&nbsp;ธ.ค.)</span>
                <span class="or-mini-chip is-s07-chip"><span class="or-num-keep">6.&nbsp;นโยบาย</span>และเศรษฐศาสตร์การเมืองสุขภาพ (24&nbsp;ธ.ค.)</span>
              </div>
            </div>
          </div>
        </div>
      `;
      }
    },
    {
      id: "s08-epidemiology",
      num: "10",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.04 – 09.07 น. (3 นาที)",
      kicker: "02 · CLINICAL & COMMUNITY EPIDEMIOLOGY PIPELINE (EP1–EP9)",
      title: "หมวดระบาดวิทยาคลินิกและชุมชน (EP1–EP9): จากภาคทฤษฎี สอบ และ SPSS สู่การสำรวจจริงและนำเสนอวิจัย",
      keyTag: "จากหลักฐานสู่การปฏิบัติ",
      keyMessageHtml:
        "<strong>เรียนครบ EP1–EP9</strong> &rarr; <strong>สอบระบาดฯ และฝึก SPSS Workshop</strong> &rarr; <strong>ออกแบบ Study Design &amp; Data Collection ในภาคสนาม</strong> &rarr; <strong>กลับมา Analysis</strong> &rarr; <strong>นำเสนอเชื่อมโยง Problem Identification &middot; Research Questions &middot; Study Design &middot; Data Collection &middot; Data Analysis/Synthesis สู่ Implications (Body of Knowledge, Policy &amp; Practices)</strong>",
      notes:
        "ไล่เรียงเส้นทางหมวดระบาดวิทยาครบทั้ง 8 จังหวะตามลำดับเวลาจริง (พร้อมซูมขยายทีละช่วง): (1–3) เรียนภาคทฤษฎีครบ EP1–EP9 วันที่ 27 พ.ย. และ 2–3 ธ.ค. (4) สอบภาคทฤษฎีระบาดวิทยาเช้าวันอังคารที่ 8 ธ.ค. แยกจากคาบเรียนชัดเจน (5) บ่ายวันเดียวกันฝึก SPSS Workshop เตรียมพร้อมก่อนลงพื้นที่ (6) ออกแบบ Study Design และเก็บข้อมูลจริง (Data Collection) ในภาคสนาม 9 พื้นที่ (7) กลับมาทำ Data Analysis & Synthesis และ (8) นำเสนอผลงานวิจัยทีม (ฟอร์ม 4A · 30 ธ.ค.) เชื่อมโยงตั้งแต่ Problem Identification, Research Questions, Study Design, Data Collection, Data Analysis/Synthesis และต่อยอดสู่ข้อเสนอแนะและคุณูปการ (Implications for Body of Knowledge, Policy and Practices) ก่อนซูมออกกลับมาเห็นภาพรวมทั้ง 8 จังหวะ",
      render: () =>
        renderPipeZoomStageHtml({
          overviewFile: "orient_s08_epi_pipeline.png",
          overviewAlt:
            "8-Stage Epidemiology Pipeline from EP1–EP9, Epi Exam, and SPSS Workshop to Fieldwork, Analysis, and Research Presentation",
          regions: [
            { slot: "1", left: "0.8%", width: "36.2%", title: "ซูม Stage 1–3: ทฤษฎีครบ EP1–EP9" },
            { slot: "2", left: "37.6%", width: "24.2%", title: "ซูม Stage 4–5: สอบทฤษฎีระบาดฯ & SPSS Workshop" },
            { slot: "3", left: "62.4%", width: "12.0%", title: "ซูม Stage 6: ภาคสนาม 9 พื้นที่ (Study Design & Data Collection)" },
            { slot: "4", left: "75.0%", width: "24.2%", title: "ซูม Stage 7–8: วิเคราะห์ สังเคราะห์ และนำเสนอวิจัย (ฟอร์ม 4A)" }
          ],
          crops: [
            {
              slot: "1",
              badge: "STAGE 1–3 · CLASSROOM THEORY (EP1–EP9)",
              fileName: "orient_s08_epi_f1.png",
              altText: "Stages 1 to 3 of Epidemiology: EP1–EP3 Diagnostic and Bias, EP4–EP5 Study Designs and Outbreak, EP6–EP9 Burden, Survey, RCT and EBM",
              captionHtml:
                "<strong>Stage 1–3 (27 พ.ย. &amp; 2–3 ธ.ค. 69):</strong> ปูรากฐานทฤษฎีและแบบฝึกหัดครบ <code>EP1–EP9</code> ทั้งการตรวจวินิจฉัย อคติ รูปแบบวิจัย สอบสวนโรค ภาระโรค การสำรวจ และ EBM"
            },
            {
              slot: "2",
              badge: "STAGE 4–5 · PRE-FIELD EXAM & SPSS LAB (8 ธ.ค. 69)",
              fileName: "orient_s08_epi_f2.png",
              altText: "Stages 4 and 5 of Epidemiology: Morning Closed-Book Theory Exam and Afternoon SPSS Workshop",
              captionHtml:
                "<strong>Stage 4–5 (อังคาร 8 ธ.ค. 69):</strong> เช้าสอบทฤษฎีระบาดวิทยาแยกหลังเรียนจบครบ · บ่ายฝึกปฏิบัติการ <code>SPSS Workshop</code> เตรียมพร้อมก่อนออกภาคสนาม"
            },
            {
              slot: "3",
              badge: "STAGE 6 · FIELDWORK HEALTH SURVEY (9–20 ธ.ค. 69)",
              fileName: "orient_s08_epi_f3.png",
              altText: "Stage 6 of Epidemiology: Study Design and Data Collection across 9 Fieldwork Sites",
              captionHtml:
                "<strong>Stage 6 (9–20 ธ.ค. 69):</strong> ร่วมกับพื้นที่จริงกำหนดโจทย์ <code>Problem Identification &rarr; Research Questions</code> ออกแบบ <code>Study Design</code> และเก็บข้อมูล <code>Data Collection</code>"
            },
            {
              slot: "4",
              badge: "STAGE 7–8 · DATA ANALYSIS, SYNTHESIS & IMPLICATIONS (ฟอร์ม 4A)",
              fileName: "orient_s08_epi_f4.png",
              altText: "Stages 7 and 8 of Epidemiology: Data Analysis, Synthesis, and Team Oral Presentation with Key Implications",
              captionHtml:
                "<strong>Stage 7–8 (21–30 ธ.ค. 69 · ฟอร์ม 4A):</strong> วิเคราะห์และนำเสนอสายโซ่วิจัยครบวงจร ต่อยอดสู่ <code>Implications for Body of Knowledge · Policy · Practices</code>"
            }
          ],
          cards: [
            {
              slot: "1",
              tintCls: "is-white",
              kickerHtml: "STAGE 1–3 · ทฤษฎีครบ EP1–EP9 (27 พ.ย. &amp; 2–3 ธ.ค.)",
              titleHtml: "เรียนพื้นฐาน วินิจฉัย วิจัย ภาระโรค สำรวจ และ EBM",
              instRowHtml: `<div class="or-s08-inst-row"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_jakkrit.jpg?v=${ASSET_VER}" alt="อ.จักรกฤษณ์" loading="eager" decoding="async" /></span><span>อ.จักรกฤษณ์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_sawanee.jpg?v=${ASSET_VER}" alt="อ.สวนีย์" loading="eager" decoding="async" /></span><span>อ.สวนีย์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_pawin.jpg?v=${ASSET_VER}" alt="อ.ปวินท์" loading="eager" decoding="async" /></span><span>อ.ปวินท์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_wichai.jpg?v=${ASSET_VER}" alt="ศ.วิชัย" loading="eager" decoding="async" /></span><span>ศ.วิชัย</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_chathaya.jpg?v=${ASSET_VER}" alt="ผศ.ฉัฐญาณ์" loading="eager" decoding="async" /></span><span>ผศ.ฉัฐญาณ์</span></span></div>`,
              bodyHtml:
                "<code>EP1</code> แนวคิดระบาดฯ · <code>EP2</code> การตรวจวินิจฉัย · <code>EP3</code> อคติ · <code>EP4</code> รูปแบบวิจัย · <code>EP5</code> สอบสวนโรค · <code>EP6</code> ภาระโรค · <code>EP7</code> สำรวจสุขภาพ · <code>EP8</code> <code>RCT</code> · <code>EP9</code> <code>EBM</code>"
            },
            {
              slot: "2",
              tintCls: "is-amber-tint",
              kickerHtml: "STAGE 4–5 · อ. 8 ธ.ค. 69 (ก่อนออกภาคสนาม)",
              titleHtml: "สอบทฤษฎีระบาดฯ และฝึก SPSS Workshop",
              instRowHtml: `<div class="or-s08-inst-row"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_sawanee.jpg?v=${ASSET_VER}" alt="อ.สวนีย์" loading="eager" decoding="async" /></span><span>อ.สวนีย์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_jakkrit.jpg?v=${ASSET_VER}" alt="อ.จักรกฤษณ์" loading="eager" decoding="async" /></span><span>อ.จักรกฤษณ์ และทีม</span></span></div>`,
              bodyHtml:
                "<strong>เช้า (08.30–12.00 น.):</strong> สอบภาคทฤษฎีระบาดวิทยา (<code>Closed-Book</code>) แยกหลังเรียนจบครบ <code>EP1–9</code> · <strong>บ่าย (13.30–15.00 น.):</strong> ฝึกปฏิบัติการ <strong>SPSS Workshop</strong> ก่อนลงพื้นที่จริง"
            },
            {
              slot: "3",
              tintCls: "is-teal-tint",
              kickerHtml: "STAGE 6 · ภาคสนาม 9 พื้นที่ (9–20 ธ.ค. 69)",
              titleHtml: "ออกแบบ Study Design &amp; Data Collection",
              bodyHtml:
                "ระบุปัญหาสุขภาพและคำถามวิจัยร่วมกับพื้นที่จริง <strong>ออกแบบระเบียบวิธีวิจัย (<code>Study Design</code>) การสุ่มตัวอย่าง และเครื่องมือ</strong> แล้วลงมือเก็บข้อมูลสำรวจสุขภาพชุมชน (<code>Data Collection</code>)"
            },
            {
              slot: "4",
              tintCls: "is-navy-tint",
              kickerHtml: "STAGE 7–8 · 21–30 ธ.ค. 69 (ฟอร์ม 4A)",
              titleHtml: "กลับมา Analysis สู่นำเสนอและสรุปข้อเสนอแนะ",
              bodyHtml:
                "วิเคราะห์และสังเคราะห์ผลเชื่อมโยง <code>Problem Identification</code> &rarr; <code>Research Questions</code> &rarr; <code>Study Design</code> &rarr; <code>Data Collection</code> &rarr; <code>Data Analysis/Synthesis</code> เพื่อต่อยอดสู่ <strong><code>Implications for Body of Knowledge, Policy &amp; Practices</code></strong>"
            }
          ]
        })
    },
    {
      id: "s08a-spss-workshop",
      num: "11",
      section: "experience",
      sectionLabel: "Act II · SPSS Workshop",
      actClass: "is-act-2",
      actLabel: "ACT II · SPSS WORKSHOP & MUIT GUIDE",
      timeWindow: "อ. 8 ธ.ค. 69 · 13.30–15.00 น.",
      kicker: "02 · STATISTICAL SOFTWARE LAB · MAHIDOL IBM SPSS STATISTICS v31",
      title: "คาบ SPSS Workshop & คู่มือการดาวน์โหลด–ติดตั้ง IBM SPSS v31 ลิขสิทธิ์ ม.มหิดล",
      keyTag: "เตรียมเครื่องก่อนเรียน",
      keyMessageHtml:
        "ดาวน์โหลดล่วงหน้าผ่านเครือข่าย ม.มหิดล หรือต่อ <strong>Mahidol VPN</strong> (<code>softwaredownload.mahidol.ac.th</code>) · เลือก <strong><code>Concurrent user license</code></strong> ชี้เซิร์ฟเวอร์ <strong><code>spss-mu.mahidol</code></strong> · <strong>ในพื้นที่ภาคสนามต้องต่อ VPN ทุกครั้งก่อนเปิดใช้งาน</strong>",
      notes:
        "ชี้แจงการเตรียมความพร้อมสำหรับคาบ SPSS Workshop (วันอังคารที่ 8 ธันวาคม 2569 เวลา 13.30–15.00 น. ณ ห้อง 2C2-03 และ Zoom โดย อ. พญ.สวนีย์ ศรีเจริญธรรม) ตามคู่มือกองเทคโนโลยีสารสนเทศ ม.มหิดล (MUIT): ต้องเชื่อมต่อ MU-WiFi หรือ Mahidol VPN ทุกครั้งทั้งขณะดาวน์โหลดจาก softwaredownload.mahidol.ac.th ขณะ Activate ด้วย Concurrent user license -> spss-mu.mahidol และทุกครั้งที่เปิดโปรแกรมวิเคราะห์ข้อมูลใน รพ.ภาคสนามทั้ง 9 แห่ง พร้อมปุ่มเปิดชุดสไลด์ประจำคาบ SPSS Workshop ครบ 10 สไลด์",
      render: () => `
        <div class="or-infog-split is-even" style="height:100%">
          <div class="or-card is-navy-tint" data-fit-solo="1" style="display:flex;flex-direction:column;justify-content:space-between;height:100%">
            <div>
              <span class="or-card-kicker">MUIT OFFICIAL GUIDE · การดาวน์โหลด ติดตั้ง &amp; ผูกสิทธิ์ IBM SPSS v31</span>
              <h3 class="or-card-title">ขั้นตอนติดตั้งลิขสิทธิ์ ม.มหิดล (Windows 10/11 &amp; macOS 10.15+)</h3>
              <ul class="or-list" style="margin-top:0.35cqw">
                <li><strong>1. เครือข่ายบังคับ (MU-WiFi / Mahidol VPN):</strong> ต้องต่อเน็ตภายใน ม.มหิดล หรือเชื่อมต่อ <strong>Mahidol VPN</strong> ทุกครั้ง ทั้งตอนเข้าเว็บดาวน์โหลด <code>softwaredownload.mahidol.ac.th</code> ตอน Activate และ<strong>ทุกครั้งก่อนเปิดใช้งานในพื้นที่ภาคสนาม 9 แห่ง</strong></li>
                <li><strong>2. Windows 10/11:</strong> แตกไฟล์ <code>.zip</code> &rarr; คลิกขวา <code>SPSSStatistics.exe</code> เลือก <strong><code>Run as administrator</code></strong> <em>(หากเมนู/ข้อมูลภาษาไทยเป็นสี่เหลี่ยม ให้คัดลอกโฟลเดอร์ <code>fallback</code> ไปวางที่ <code>C:\\Program Files\\IBM\\SPSS Statistics\\JRE\\lib\\fonts</code>)</em></li>
                <li><strong>3. macOS (10.15+):</strong> แตกไฟล์ <code>.zip</code> &rarr; คลิกขวา <code>Stats 31_MAC.pkg</code> เลือก <strong><code>Open</code></strong> และทำตามขั้นตอนติดตั้ง</li>
                <li><strong>4. การผูกสิทธิ์ (License Authorization Wizard):</strong> เลือก <strong><code>Concurrent user license</code></strong> &rarr; ช่อง <em>License Manager Server Name</em> พิมพ์ <strong><code>spss-mu.mahidol</code></strong> กด Next จนเสร็จสมบูรณ์</li>
              </ul>
            </div>
            <div class="or-spss-cta-row">
              <button type="button" class="or-spss-cta-btn is-primary" data-open-spss-deck="1">🖥️ เปิด Slide คาบ SPSS Workshop (10 สไลด์)</button>
              <a class="or-spss-cta-btn" href="https://muit.mahidol.ac.th/docs/users-guide/manual-install-programs/manual-spss/" target="_blank" rel="noopener">📘 คู่มือติดตั้ง SPSS (MUIT) ↗</a>
              <a class="or-spss-cta-btn" href="https://muit.mahidol.ac.th/docs/users-guide/manual-network-and-connectivity/manual-vpn/" target="_blank" rel="noopener">🔐 คู่มือต่อ Mahidol VPN ↗</a>
            </div>
          </div>

          <div class="or-grid-2" data-fit-group="cards" style="height:100%;grid-template-rows:repeat(2,minmax(0,1fr))">
            <div class="or-card is-white is-vcenter">
              <span class="or-card-kicker">STEP 01 · VARIABLE VIEW &amp; CODEBOOK</span>
              <h3 class="or-card-title">ออกแบบโครงสร้างฐานข้อมูลสำรวจ</h3>
              <p class="or-card-text">กำหนด <code>Name</code>, <code>Type</code>, <code>Label</code>, <code>Values</code> (เช่น <code>0 = ไม่เสี่ยง, 1 = เสี่ยง</code>), รหัสข้อมูลสูญหาย <code>Missing (99/999)</code> และระดับการวัด (<code>Nominal / Ordinal / Scale</code>) ให้ตรงแบบสอบถามทีม</p>
            </div>
            <div class="or-card is-amber-tint is-vcenter">
              <span class="or-card-kicker">STEP 02 · DATA CLEANING, RECODE &amp; COMPUTE</span>
              <h3 class="or-card-title">ตรวจความถูกต้องและสร้างตัวแปรใหม่</h3>
              <p class="or-card-text">เช็กค่าหลุดขอบด้วย <code>Frequencies (Min–Max)</code> · จัดกลุ่มช่วงอายุ/คะแนนด้วย <code>Recode into Different Variables</code> (ห้ามทับตัวแปรเดิม) และคำนวณค่าดัชนีด้วย <code>Compute Variable</code></p>
            </div>
            <div class="or-card is-teal-tint is-vcenter">
              <span class="or-card-kicker">STEP 03 · DESCRIPTIVE STATISTICS</span>
              <h3 class="or-card-title">สถิติเชิงพรรณนาอธิบายบริบทชุมชน</h3>
              <p class="or-card-text">ตัวแปรกลุ่มใช้ <code>Frequencies</code> สรุปจำนวนและร้อยละ <code>n (%)</code> · ตัวแปรต่อเนื่องใช้ <code>Explore</code> ตรวจการแจกแจงเพื่อเลือกรายงาน <code>Mean &plusmn; SD</code> หรือ <code>Median (IQR)</code> อย่างถูกต้อง</p>
            </div>
            <div class="or-card is-white is-vcenter">
              <span class="or-card-kicker">STEP 04 · ANALYTICAL TESTING สู่ฟอร์ม 4A</span>
              <h3 class="or-card-title">วิเคราะห์ความสัมพันธ์และแปลผล</h3>
              <p class="or-card-text">เปรียบเทียบสัดส่วนด้วย <code>Crosstabs</code> (ติ๊ก <code>Chi-square</code> + <code>Risk</code> + <code>Row %</code>) รายงานค่า <code>OR / PR, 95% CI, p-value</code> หรือเปรียบเทียบค่าเฉลี่ยด้วย <code>t-test / Mann-Whitney U</code></p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s08b-hs-pipeline",
      num: "12",
      section: "experience",
      sectionLabel: "Act II · Learning Journey",
      actClass: "is-act-2",
      actLabel: "ACT II · THE JOURNEY",
      timeWindow: "09.07 – 09.10 น. (3 นาที)",
      kicker: "02 · HEALTH SYSTEMS SCIENCE PIPELINE (ST1 & HS1–HS6)",
      title: "หมวดระบบสุขภาพ (ST1 และ HS1–HS6): จากกรอบทฤษฎีสู่การสังเกตระบบจริง สอบ และนำเสนอบูรณาการ",
      keyTag: "จากกรอบคิดสู่ระบบจริง",
      keyMessageHtml:
        "<strong>เรียนครบ ST1 และ HS1–HS6</strong> &rarr; <strong>เวิร์กชอป Learning How to Learn &amp; SRN 1</strong> &rarr; <strong>ลงสังเกตระบบจริงในภาคสนาม</strong> &rarr; <strong>กลับมาสอบทฤษฎีระบบฯ (โน้ต A4) และเรียน ST2</strong> &rarr; <strong>นำเสนอเชื่อมโยง 5 วัตถุประสงค์ด้วยคิดเชิงระบบ สู่ Implications (Body of Knowledge, Policy &amp; Practices)</strong>",
      notes:
        "อธิบายเส้นทางหมวดระบบสุขภาพตามหลักคิดคู่ขนานกับหมวดระบาดวิทยา (พร้อมซูมขยายทีละช่วง): (1–3) เรียนภาคทฤษฎีครบ ST1 และ HS1–HS6 ในสัปดาห์ที่ 1–2 (4) เวิร์กชอป Learning How to Learn ร่วมกับ รศ. นพ.สุรเกียรติ และส่ง SRN 1 วันที่ 9 ธ.ค. ก่อนออกเดินทาง (5) ลงสังเกตการทำงานของระบบบริการและชุมชนจริงในภาคสนาม 9 พื้นที่ (6) กลับมาสอบภาคทฤษฎีระบบสุขภาพเช้าวันอังคารที่ 22 ธ.ค. แบบ Open Note A4 (7) บ่ายเรียน ST2 - Synthesis from Dynamic Complexity from the field และร่วมเสวนานโยบาย 23–24 ธ.ค. ก่อน (8) นำเสนอผลงานทีม (ฟอร์ม 3A · 29 ธ.ค.) สะท้อนการคิดเชิงระบบเชื่อมโยงครบทั้ง 5 วัตถุประสงค์ พร้อมสังเคราะห์จุดคานงัดและต่อยอดสู่ Implications for Body of Knowledge, Policy and Practices ก่อนซูมออกกลับมาเห็นภาพรวมทั้ง 8 จังหวะ",
      render: () =>
        renderPipeZoomStageHtml({
          overviewFile: "orient_s08b_hs_pipeline.png",
          overviewAlt:
            "8-Stage Health Systems Science Pipeline from ST1 and HS1–HS6 to Learning How to Learn, Fieldwork, Open-Note Exam, ST2 Synthesis, and Integrated Presentation",
          regions: [
            { slot: "1", left: "0.8%", width: "36.2%", title: "ซูม Stage 1–3: ทฤษฎีครบ ST1 & HS1–HS6" },
            { slot: "2", left: "37.6%", width: "24.2%", title: "ซูม Stage 4–5: Learning How to Learn & ภาคสนาม 9 พื้นที่" },
            { slot: "3", left: "62.4%", width: "24.2%", title: "ซูม Stage 6–7: สอบทฤษฎีระบบฯ (โน้ต A4) & ST2" },
            { slot: "4", left: "87.2%", width: "12.0%", title: "ซูม Stage 8: นำเสนอบูรณาการ 5 วัตถุประสงค์ (ฟอร์ม 3A)" }
          ],
          crops: [
            {
              slot: "1",
              badge: "STAGE 1–3 · CLASSROOM FOUNDATION (ST1 & HS1–HS6)",
              fileName: "orient_s08b_hs_f1.png",
              altText: "Stages 1 to 3 of Health Systems Science: ST1 Systems Thinking, HS1 Health, Determinants of Health, Level of Disease Prevention, HS2–HS3 6BB and EQESaRR, HS4–HS6 COM-B, Health Promotion, PHC/PC, Health Insurance and UHC Concept",
              captionHtml:
                "<strong>Stage 1–3 (25 พ.ย.–4 ธ.ค. 69):</strong> <code>Systems Thinking</code> · <code>Health, Determinants of Health, Level of Disease Prevention</code> · <code>6BB &amp; EQESaRR</code> · <code>Health Promotion</code> · <code>PHC/PC</code> · <code>Health Insurance and UHC Concept</code>"
            },
            {
              slot: "2",
              badge: "STAGE 4–5 · LEARNING HOW TO LEARN & FIELDWORK (9–20 ธ.ค. 69)",
              fileName: "orient_s08b_hs_f2.png",
              altText: "Stages 4 and 5 of Health Systems Science: Learning How to Learn Workshop, SRN 1, and Observing Real Health Systems in 9 Sites",
              captionHtml:
                "<strong>Stage 4–5 (9–20 ธ.ค. 69):</strong> เวิร์กชอป <code>Learning How to Learn</code> (9 ธ.ค.) และส่ง <code>SRN 1</code> ก่อนลงเรียนรู้ระบบบริการและชุมชนจริง 9 พื้นที่"
            },
            {
              slot: "3",
              badge: "STAGE 6–7 · OPEN-NOTE EXAM & ST2 SYNTHESIS (22 ธ.ค. 69)",
              fileName: "orient_s08b_hs_f3.png",
              altText: "Stages 6 and 7 of Health Systems Science: Open-Note A4 Theory Exam and ST2 - Synthesis from Dynamic Complexity from the field",
              captionHtml:
                "<strong>Stage 6–7 (อังคาร 22 ธ.ค. 69):</strong> เช้าสอบทฤษฎีระบบสุขภาพ (<code>Open Note A4</code>) · บ่ายเรียน <code>ST2 - Synthesis from Dynamic Complexity from the field</code>"
            },
            {
              slot: "4",
              badge: "STAGE 8 · INTEGRATED 5 OBJECTIVES & IMPLICATIONS (ฟอร์ม 3A)",
              fileName: "orient_s08b_hs_f4.png",
              altText: "Stage 8 of Health Systems Science: Team Presentation Integrating 5 Objectives and Key Implications",
              captionHtml:
                "<strong>Stage 8 (อังคาร 29 ธ.ค. 69 · ฟอร์ม 3A):</strong> เชื่อมโยงทั้ง 5 วัตถุประสงค์ด้วยคิดเชิงระบบ สู่จุดคานงัดและ <code>Implications for Body of Knowledge · Policy · Practices</code>"
            }
          ],
          cards: [
            {
              slot: "1",
              tintCls: "is-white",
              kickerHtml: "STAGE 1–3 · ทฤษฎีครบ ST1 &amp; HS1–6 (25 พ.ย.–4 ธ.ค.)",
              titleHtml: "คิดเชิงระบบ สุขภาพ บริการ สร้างเสริม ปฐมภูมิ และหลักประกันฯ",
              instRowHtml: `<div class="or-s08-inst-row"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_nuttawut.jpg?v=${ASSET_VER}" alt="อ.ณัฐวุฒิ" loading="eager" decoding="async" /></span><span>อ.ณัฐวุฒิ</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_warisa.jpg?v=${ASSET_VER}" alt="อ.วริษา" loading="eager" decoding="async" /></span><span>อ.วริษา</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_phusit.jpg?v=${ASSET_VER}" alt="อ.ภูษิต" loading="eager" decoding="async" /></span><span>อ.ภูษิต</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_wich.jpg?v=${ASSET_VER}" alt="ผศ.วิชช์" loading="eager" decoding="async" /></span><span>ผศ.วิชช์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_chatchai.jpg?v=${ASSET_VER}" alt="อ.ฉัตรชัย" loading="eager" decoding="async" /></span><span>อ.ฉัตรชัย</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_samrit.jpg?v=${ASSET_VER}" alt="ผศ.สัมฤทธิ์" loading="eager" decoding="async" /></span><span>ผศ.สัมฤทธิ์</span></span></div>`,
              bodyHtml:
                "<code>ST1</code> Systems Thinking · <code>HS1</code> Health, Determinants of Health, Level of Disease Prevention · <code>HS2–3</code> <code>6BB &amp; EQESaRR</code> · <code>HS4</code> <code>COM-B</code> &amp; Health Promotion · <code>HS5</code> <code>PHC/PC</code> · <code>HS6</code> Health Insurance &amp; UHC Concept"
            },
            {
              slot: "2",
              tintCls: "is-teal-tint",
              kickerHtml: "STAGE 4–5 · Learning How to Learn &amp; ภาคสนาม (9–20 ธ.ค.)",
              titleHtml: "เตรียมท่าทีการเรียนรู้ สู่การสังเกตระบบจริง 9 พื้นที่",
              bodyHtml:
                "<strong>9 ธ.ค.:</strong> เวิร์กชอป <code>Learning How to Learn</code> (รศ.สุรเกียรติ) และส่ง <code>SRN 1</code> ก่อนลงเรียนรู้การทำงานเชื่อมโยงของ <strong>รพ. · รพ.สต. · อสม. · ท้องถิ่น · ชุมชน</strong> ในพื้นที่จริง"
            },
            {
              slot: "3",
              tintCls: "is-amber-tint",
              kickerHtml: "STAGE 6–7 · อ. 22 – พฤ. 24 ธ.ค. 69 (หลังกลับพื้นที่)",
              titleHtml: "กลับมาสอบระบบฯ ภาคทฤษฎี และสังเคราะห์ใน ST2",
              bodyHtml:
                "<strong>เช้า 22 ธ.ค.:</strong> สอบทฤษฎีระบบสุขภาพ (<code>Open Note A4</code>) หลังเห็นภาพจริง · <strong>บ่าย 22 ธ.ค.:</strong> <code>ST2 - Synthesis from Dynamic Complexity from the field</code> ต่อด้วยเสวนานโยบาย (23–24 ธ.ค.)"
            },
            {
              slot: "4",
              tintCls: "is-navy-tint",
              kickerHtml: "STAGE 8 · อ. 29 ธ.ค. 69 (ฟอร์ม 3A)",
              titleHtml: "นำเสนอบูรณาการ 5 วัตถุประสงค์และข้อเสนอแนะ",
              bodyHtml:
                "สะท้อนการคิดเชิงระบบเชื่อมโยงทั้ง <strong>5 วัตถุประสงค์ระบบสุขภาพ</strong> เข้าด้วยกันอย่างบูรณาการ พร้อมสังเคราะห์จุดคานงัดและต่อยอดสู่ <strong><code>Implications for Body of Knowledge, Policy &amp; Practices</code></strong>"
            }
          ]
        })
    },
    {
      id: "s09a-kolb-learning-guide",
      num: "13",
      section: "experience",
      sectionLabel: "Act II · แนวทางการเรียนรู้ (Kolb)",
      actClass: "is-act-2",
      actLabel: "ACT II · EXPERIENTIAL LEARNING GUIDE",
      timeWindow: "09.10 – 09.11 น. (แนวทางการเรียนรู้)",
      kicker: "02 · KOLB'S EXPERIENTIAL LEARNING CYCLE · แนวทางการเรียนรู้ภาคสนาม",
      title: "แนวทางการเรียนรู้: การเรียนรู้ร่วมกันจากประสบการณ์ภาคสนาม (Kolb's Experiential Learning)",
      keyTag: "วงจรการเรียนรู้ 4 ขั้น",
      keyMessageHtml:
        "<strong>ทำกิจกรรมทั้งส่วนตัวและร่วมกันเป็นทีมในพื้นที่ต่างๆ</strong> &rarr; <strong>สะท้อนคิด ตั้งคำถาม จากประสบการณ์จริง</strong> &rarr; <strong>ร่วมสรุปเป็นหลักการ</strong> &rarr; <strong>แลกเปลี่ยน เกิดการเรียนรู้อย่างต่อเนื่อง</strong>",
      notes:
        "ปูแนวทางการเรียนรู้ก่อนเข้าสู่รายละเอียดโรงพยาบาลแหล่งฝึกทั้ง 9 แห่ง ด้วยวงจรการเรียนรู้จากประสบการณ์จริงของ Kolb (Experiential Learning Cycle): (1) Concrete Experience — ลงมือทำกิจกรรมทั้งส่วนตัวและร่วมกันเป็นทีมในพื้นที่ต่างๆ (2) Reflective Observation — สะท้อนคิด ตั้งคำถาม จากประสบการณ์จริง (3) Abstract Conceptualisation — ร่วมสรุปเป็นหลักการเชื่อมโยงทฤษฎีระบบสุขภาพและระบาดวิทยา และ (4) Active Experimentation — แลกเปลี่ยนข้ามพื้นที่เพื่อให้เกิดการเรียนรู้อย่างต่อเนื่อง",
      render: () => `
        <div class="or-infog-split is-kolb-split">
          <div class="or-kolb-diagram-card">
            ${renderKolbCycleSvgHtml()}
          </div>

          <div class="or-stack-col" data-fit-group="cards" style="height:100%">
            <div class="or-card is-white is-vcenter">
              <span class="or-card-kicker">① CONCRETE EXPERIENCE · ลงมือมีประสบการณ์จริง</span>
              <h3 class="or-card-title">ทำกิจกรรมทั้งส่วนตัวและร่วมกันเป็นทีมในพื้นที่ต่างๆ</h3>
              <p class="or-card-text">ออกฝึกปฏิบัติงานจริง ณ รพ.ชุมชน รพ.สต. และหมู่บ้านเป้าหมายทั้ง 9 แห่ง ลงเดินสำรวจวิถีชีวิต พูดคุยรับฟังผู้ป่วย อสม. ผู้นำชุมชน และเก็บข้อมูล Health Survey ร่วมกัน</p>
            </div>

            <div class="or-card is-teal-tint is-vcenter">
              <span class="or-card-kicker">② REFLECTIVE OBSERVATION · ทบทวนใคร่ครวญ</span>
              <h3 class="or-card-title">สะท้อนคิด ตั้งคำถาม จากประสบการณ์จริง</h3>
              <p class="or-card-text">ตั้งวงสนทนาสะท้อนคิดหลังลงพื้นที่ร่วมกับเพื่อนในทีมและอาจารย์ที่ปรึกษา (<code>SG</code>) ตั้งคำถามต่อสิ่งที่เห็นเทียบกับสมมติฐานเดิม และบันทึกพัฒนาการใน <code>SRN 1–2</code></p>
            </div>

            <div class="or-card is-amber-tint is-vcenter">
              <span class="or-card-kicker">③ ABSTRACT CONCEPTUALISATION · สังเคราะห์หลักการ</span>
              <h3 class="or-card-title">ร่วมสรุปเป็นหลักการเชื่อมโยงทฤษฎี</h3>
              <p class="or-card-text">ร้อยเรียงข้อมูลเชิงประจักษ์จากพื้นที่เข้ากับกรอบคิดเชิงระบบ (<code>ST1–2, CLD</code>) วัตถุประสงค์ระบบสุขภาพทั้ง 5 ด้าน (<code>HS1–6</code>) และหลักระบาดวิทยา (<code>EP1–9</code>)</p>
            </div>

            <div class="or-card is-navy-tint is-vcenter">
              <span class="or-card-kicker">④ ACTIVE EXPERIMENTATION · ต่อยอดสู่การปฏิบัติ</span>
              <h3 class="or-card-title">แลกเปลี่ยน เกิดการเรียนรู้อย่างต่อเนื่อง</h3>
              <p class="or-card-text">นำบทเรียนและข้อเสนอแนะจากทั้ง 9 บริบทพื้นที่มาแลกเปลี่ยนเรียนรู้ร่วมกันทั้งชั้นปีในวันนำเสนอ (<code>ฟอร์ม 3A &amp; 4A</code>) เพื่อต่อยอดสู่บทบาทแพทย์ในอนาคต</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s09-fieldwork-9sites",
      num: "14",
      section: "experience",
      sectionLabel: "Act II · 9 กลุ่มพื้นที่ภาคสนาม",
      actClass: "is-act-2",
      actLabel: "ACT II · 9 SITES & LIVE TEAM FORMATIONS",
      timeWindow: "09.11 – 09.13 น. (Clicker กลุ่ม 1–9)",
      kicker: "02 · 9 FIELDWORK TRAINING HOSPITALS · INTERACTIVE 3D MAP & TEAM FORMATION",
      title: "โรงพยาบาลแหล่งฝึกภาคสนามทั้ง 9 แห่ง — ตารางภาพรวมและผังทีมพร้อมแผนที่ 3 มิติ (กลุ่ม 1–9)",
      keyTag: "กด Clicker เรียงกลุ่ม 1–9",
      keyMessageHtml:
        "แสดงตารางสรุปทั้ง <strong>9 กลุ่มพื้นที่ภาคสนาม</strong> แล้วกด <strong>Clicker ถัดไป (หรือคลิกชื่อกลุ่ม)</strong> เพื่อดู <strong>แผนที่ประเทศไทย 3 มิติ พร้อมผังทีม (<code>SITE 01–09</code>)</strong> เรียงลำดับจนครบทั้ง 9 กลุ่ม",
      notes:
        "จังหวะที่ 0 แสดงตารางภาพรวมโรงพยาบาลแหล่งฝึกทั้ง 9 แห่งทั่วภูมิภาค อาจารย์ที่ปรึกษา ห้องกลุ่มย่อย และวันเดินทาง จากนั้นเมื่อกด Clicker ถัดไป (Space / ลูกศรขวา / PageDown) สไลด์จะดึงสคริปต์ผังทีมและแผนที่ 3 มิติจากหน้า กลุ่ม & พื้นที่ มาแสดงเรียงตามลำดับตั้งแต่กลุ่มที่ 1 กุฉินารายณ์ จนครบกลุ่มที่ 9 อุ้มผาง แล้วจึงก้าวเข้าสู่สไลด์การประเมินผล",
      render: () => {
        const isStaticExport =
          state.viewMode === "handout" ||
          Boolean(window.__RACM_EXPORTING_DECK) ||
          document.body.classList.contains("is-printing-orientation-deck");
        const curSiteFocus = isStaticExport ? 0 : Number(state.siteFocus) || 0;
        if (curSiteFocus >= 1 && curSiteFocus <= 9) {
          return `
            <div class="or-s09-stage-wrap" data-s09-site-focus="${curSiteFocus}">
              <div class="or-s09-live-site-stage" data-s09-live-mount="${curSiteFocus}"></div>
            </div>
          `;
        }
        const pillsHtml = S09_SITE_META.map(
          (m) =>
            `<button type="button" class="or-s09-q-pill" data-s09-jump-site="${m.id}" title="เปิดผังทีมและแผนที่ 3D กลุ่มที่ ${m.id}: ${esc(m.hosp)}"><span class="or-s09-q-dot" style="background:${m.color}"></span><span>${m.id}.${esc(m.shortName)}</span></button>`
        ).join("");
        return `
          <div class="or-s09-stage-wrap" data-s09-site-focus="0">
            <div class="or-s09-quickbar">
              <div class="or-s09-q-pills">
                <button type="button" class="or-s09-q-pill is-active" data-s09-jump-site="0">≡ ตารางรวม 9 แห่ง</button>
                ${pillsHtml}
              </div>
              <span class="or-s09-clicker-hint">🎛️ กดถัดไปเพื่อดูผังทีม + แผนที่ 3D กลุ่ม 1 &rarr; 9</span>
            </div>

            <div class="or-table-wrap is-s09-table is-s09-fulltable" data-fit-table="1" data-mobile-scroll-hint="แตะแถวกลุ่มเพื่อเปิดดูผังทีมและแผนที่ 3 มิติ">
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
                  <tr data-s09-jump-site="1"><td><strong>1</strong></td><td><strong>รพร.กุฉินารายณ์</strong> จ.กาฬสินธุ์</td><td>20 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_nuttawut.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์</span></span></span></td><td><code>3B1-01</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                  <tr data-s09-jump-site="2"><td><strong>2</strong></td><td><strong>รพร.ด่านซ้าย</strong> จ.เลย</td><td>19 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_chathaya.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>ผศ. พญ.ฉัฐญาณ์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_warisa.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. พญ.วริษา</span></span></span></td><td><code>1C1-02</code></td><td>12–19 ธ.ค. 69 (7 คืน 8 วัน)</td></tr>
                  <tr data-s09-jump-site="3"><td><strong>3</strong></td><td><strong>รพ.ตะกั่วป่า</strong> จ.พังงา</td><td>18 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_chatchai.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. นพ.ฉัตรชัย อิ่มอารมย์</span></span></span></td><td><code>3B1-05</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                  <tr data-s09-jump-site="4"><td><strong>4</strong></td><td><strong>รพ.ท่าวังผา</strong> จ.น่าน</td><td>18 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_jakkrit.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. นพ.จักรกฤษณ์ เอื้อสุนทรวัฒนา</span></span></span></td><td><code>3B1-06</code></td><td>12–19 ธ.ค. 69 (7 คืน 8 วัน)</td></tr>
                  <tr data-s09-jump-site="5"><td><strong>5</strong></td><td><strong>รพ.เพชรบูรณ์ (1)</strong> จ.เพชรบูรณ์</td><td>18 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_samrit.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>ผศ. นพ.สัมฤทธิ์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_peerasit.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>นพ.พีรสิชฌ์</span></span></span></td><td><code>1C1-04</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                  <tr data-s09-jump-site="6"><td><strong>6</strong></td><td><strong>รพ.เพชรบูรณ์ (2)</strong> จ.เพชรบูรณ์</td><td>18 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_pawin.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. นพ.ปวินท์ ศรีวิเชียร</span></span></span></td><td><code>1C1-05</code></td><td>10–19 ธ.ค. 69 (9 คืน 10 วัน)</td></tr>
                  <tr data-s09-jump-site="7"><td><strong>7</strong></td><td><strong>รพ.อุบลรัตน์</strong> จ.ขอนแก่น</td><td>18 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_phusit.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>อ. นพ.ภูษิต ประคองสาย</span></span></span></td><td><code>1C1-03</code></td><td>12–20 ธ.ค. 69 (8 คืน 9 วัน)</td></tr>
                  <tr data-s09-jump-site="8"><td><strong>8</strong></td><td><strong>รพ.ท่าสองยาง</strong> จ.ตาก</td><td>20 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_wich.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>ผศ. นพ.วิชช์</span></span><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_pharanyu.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>นพ.ภรัณยู</span></span></span></td><td><code>1C1-06</code></td><td>11–19 ธ.ค. 69 (8 คืน 9 วัน)</td></tr>
                  <tr data-s09-jump-site="9"><td><strong>9</strong></td><td><strong>รพ.อุ้มผาง</strong> จ.ตาก</td><td>20 คน</td><td><span class="or-s09-adv-cell"><span class="or-adv-pair"><span class="or-s09-adv-frame"><img class="or-s09-adv-av" src="assets/photos/advisor_roengrudee.jpg?v=${ASSET_VER}" alt="" loading="eager" decoding="async" /></span><span>รศ. พญ.เริงฤดี ปธานวนิช</span></span></span></td><td><code>1C1-07</code></td><td>9–18 ธ.ค. 69 (ออกคืน 9 ธ.ค. 23.00)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    },
    {
      id: "s10-competency-blueprint",
      num: "13",
      section: "evaluation",
      sectionLabel: "Act III · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · EVALUATION",
      timeWindow: "09.13 – 09.16 น. (3 นาที)",
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
              <colgroup>
                <col style="width:19.5%" />
                <col style="width:50.5%" />
                <col style="width:13.0%" />
                <col style="width:17.0%" />
              </colgroup>
              <thead>
                <tr>
                  <th>สมรรถนะหลัก 5 ด้าน</th>
                  <th>เครื่องมือประเมินเพื่อพัฒนาและตัดสินผล</th>
                  <th>ผู้ประเมิน</th>
                  <th>เกณฑ์ตัดสินผล</th>
                </tr>
              </thead>
              <tbody>
                <tr class="is-domain-divider"><td colspan="4">ภาคทฤษฎี (Theoretical Domain)</td></tr>
                <tr>
                  <td><strong>1. Knowledge base</strong><br><span class="or-td-sub">ระบบสุขภาพและระบาดวิทยา</span></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> แบบฝึกกรณีศึกษา ทบทวนด้วยตนเอง (<code>ST1–2, HS1–6</code>) แบบฝึกหัด <code>EP</code> และ <code>SRN 1</code></div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> <strong>Epi Exam</strong> (8 ธ.ค.) และ <strong>Health Systems Exam</strong> (โน้ต A4 · 22 ธ.ค.)</div>
                  </td>
                  <td>คณาจารย์</td>
                  <td><strong>แยกเกณฑ์ 2 หมวด:</strong><br>ผ่าน <strong>&ge; 2.00</strong> (<strong>O &ge; 3.75</strong>)</td>
                </tr>

                <tr class="is-domain-divider"><td colspan="4">ภาคปฏิบัติและสมรรถนะวิชาชีพในชุมชน (Practical, Community &amp; Professionalism)</td></tr>
                <tr>
                  <td><strong>2. Communication &amp;<wbr> Interpersonal</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> แลกเปลี่ยนเรียนรู้ในกลุ่มย่อย 10 ครั้ง และอภิปราย 6 ครั้ง พร้อมฝึกสื่อสารทำงานร่วมกัน</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> ประเมินโดยเพื่อนร่วมกลุ่ม <code>ฟอร์ม 1A</code> (ข้อ 1, 3, 4) และการนำเสนอทีม (<code>3A, 4A</code>)</div>
                  </td>
                  <td>เพื่อนและ<wbr>อาจารย์</td>
                  <td><strong>O / S / M / U</strong><br><span class="or-td-sub">(รายบุคคลประกอบ 2A)</span></td>
                </tr>
                <tr>
                  <td><strong>3. Community, Pop. &amp; Health System</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> ให้คำปรึกษาเชื่อมโยง 5 วัตถุประสงค์ด้วยคิดเชิงระบบ ณ รพ.แหล่งฝึก และการสำรวจชุมชน</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> <strong>นำเสนอระบบสุขภาพ (3A)</strong> เชื่อมทั้ง 5 วัตถุประสงค์ และ<strong>ระบาดวิทยา (4A)</strong> ร่วมกับ <code>1A</code></div>
                  </td>
                  <td>คณาจารย์<wbr>และเพื่อน</td>
                  <td><strong>O / S / M / U</strong><br><span class="or-td-sub">(3A, 4A ทีม · 1A บุคคล)</span></td>
                </tr>
                <tr>
                  <td><strong>4. Continuous Prof.<wbr> Development</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> <code>SRN 1</code> (ส่ง 9 ธ.ค. เพื่อรับคำแนะนำรายบุคคลระหว่างฝึกภาคสนาม)</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> <code>SRN 2</code> (ส่ง 30 ธ.ค.) ควบคู่ <code>ฟอร์ม 1A</code> ข้อ 2 ด้านความใฝ่รู้พัฒนาตน</div>
                  </td>
                  <td>อาจารย์<wbr>และเพื่อน</td>
                  <td><strong>O / S / M / U</strong><br><span class="or-td-sub">(รายบุคคล)</span></td>
                </tr>
                <tr>
                  <td><strong>5. Habits, Attitudes,<wbr> Moral &amp; Ethics</strong></td>
                  <td>
                    <div><span class="or-tag-inline is-formative">Formative</span> สังเกตและให้คำแนะนำด้านความรับผิดชอบและจริยธรรมวิชาชีพตลอดรายวิชา</div>
                    <div class="or-td-gap"><span class="or-tag-inline is-summative">Summative</span> ประเมินตาม <code>ฟอร์ม 1A</code> (ข้อ 6.1–6.3 ความรับผิดชอบ ซื่อสัตย์ น้ำใจ) สรุปใน <code>ฟอร์ม 2A</code></div>
                  </td>
                  <td>อาจารย์<wbr>ที่ปรึกษา</td>
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
      num: "16",
      section: "evaluation",
      sectionLabel: "Act III · Table Spec 100%",
      actClass: "is-act-3",
      actLabel: "ACT III · TABLE SPECIFICATION (∑ = 100%)",
      timeWindow: "09.15 – 09.17 น. (Table Spec)",
      kicker: "03 · COMPETENCY 1 · WRITTEN EXAM TABLE SPECIFICATION (HEALTH SYSTEMS & EPIDEMIOLOGY)",
      title: "สัดส่วนข้อสอบภาคทฤษฎี (Table Specification · รวม 100% ทั้ง 2 หมวดวิชา)",
      keyTag: "Table Spec 100%",
      keyMessageHtml:
        "<strong>6.1 ระบบสุขภาพ (รวม 100% · 6 Discussions):</strong> <code>HS1 20%</code> · <code>HS2–5 บทละ 15%</code> · <code>HS6 20%</code> &nbsp;|&nbsp; <strong>6.2 ระบาดวิทยา (รวม 100% · 7 Exercises):</strong> <code>EP1 ไม่ออกสอบ</code> · <code>EP2,3,5,6,8 บทละ 15%</code> · <code>EP4 10%</code> · <code>EP7,9 บทละ 7.5%</code>",
      notes:
        "ชี้แจงสัดส่วนข้อสอบภาคทฤษฎี (Table Specification) ฉบับถูกต้อง 100% ทั้งสองหมวดวิชา พร้อมแถบสัดส่วนสะสมครบ 100%: (6.1) ระบบสุขภาพ สอบวันอังคาร 22 ธ.ค. 69 แบบ Open Note A4 ประกอบด้วย HS1 20%, HS2 15%, HS3 15%, HS4 15%, HS5 15%, HS6 20% รวม 100% และมี 6 Discussions (6.2) ระบาดวิทยา สอบวันอังคาร 8 ธ.ค. 69 แบบ Closed-Book โดย EP1 ไม่ออกสอบ (-), EP2 15%, EP3 15%, EP4 (Study designs & AR, AR%, PAR, PAR%) 10%, EP5 15%, EP6 15%, EP7 7.5%, EP8 15%, EP9 7.5% รวม 100% และมี 7 Exercises เกณฑ์ผ่านแยกวิชาตั้งแต่ 2.00 ขึ้นไป (O >= 3.75)",
      render: () => `
        <div class="or-grid-2" data-fit-group="cards" style="height:100%">
          <div class="or-card is-navy-tint or-spec-card-shell">
            <div>
              <span class="or-card-kicker">6.1 ระบบสุขภาพ · อ. 22 ธ.ค. 69 (08.30–12.00 น. · ห้อง 2C2-01..03)</span>
              <h3 class="or-card-title">Health Systems Exam (Open Note A4 · รวม 100%)</h3>
            </div>

            ${renderSegmented100BarHtml("สัดส่วนสะสมตามโครงสร้างข้อสอบระบบสุขภาพ (0% → 100%)", "∑ = 100%", [
              { code: "HS1", label: "สุขภาพ ปัจจัยกำหนดฯ & ป้องกันโรค", pct: 20, pctLabel: "20%", color: "#0284c7" },
              { code: "HS2", label: "ระบบบริการสุขภาพ 1", pct: 15, pctLabel: "15%", color: "#0d9488" },
              { code: "HS3", label: "ระบบบริการสุขภาพ 2", pct: 15, pctLabel: "15%", color: "#059669" },
              { code: "HS4", label: "การสร้างเสริมสุขภาพ", pct: 15, pctLabel: "15%", color: "#d97706" },
              { code: "HS5", label: "สาธารณสุขมูลฐาน & ปฐมภูมิ", pct: 15, pctLabel: "15%", color: "#7c3aed" },
              { code: "HS6", label: "หลักประกันฯ & การคลังสุขภาพ", pct: 20, pctLabel: "20%", color: "#1d4ed8" }
            ])}

            <div class="or-spec-mini-table-wrap">
              <table class="or-spec-mini-table">
                <thead>
                  <tr>
                    <th style="width:14%">รหัส</th>
                    <th>หัวข้อบทเรียนระบบสุขภาพ</th>
                    <th style="width:24%;text-align:right">สัดส่วนข้อสอบ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><code>HS1</code></td><td>สุขภาพ ปัจจัยกำหนดสุขภาพ และการป้องกันโรค</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:100%;background:#0284c7"></span></span><strong>20%</strong></div></td></tr>
                  <tr><td><code>HS2</code></td><td>ระบบบริการสุขภาพ 1 (Health Service System I · 6BB)</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:75%;background:#0d9488"></span></span><strong>15%</strong></div></td></tr>
                  <tr><td><code>HS3</code></td><td>ระบบบริการสุขภาพ 2 (Health Service System II · EQESaRR)</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:75%;background:#059669"></span></span><strong>15%</strong></div></td></tr>
                  <tr><td><code>HS4</code></td><td>การสร้างเสริมสุขภาพ (Health Promotion &amp; COM-B)</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:75%;background:#d97706"></span></span><strong>15%</strong></div></td></tr>
                  <tr><td><code>HS5</code></td><td>การสาธารณสุขมูลฐานและบริการปฐมภูมิ (PHC &amp; PC)</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:75%;background:#7c3aed"></span></span><strong>15%</strong></div></td></tr>
                  <tr><td><code>HS6</code></td><td>หลักประกันสุขภาพและการคลังสุขภาพ (Insurance &amp; Financing)</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:100%;background:#1d4ed8"></span></span><strong>20%</strong></div></td></tr>
                  <tr class="is-sum-row"><td colspan="2">รวมสัดส่วนข้อสอบภาคทฤษฎีระบบสุขภาพ</td><td style="text-align:right">100%</td></tr>
                </tbody>
              </table>
            </div>

            <div class="or-s11-foot-badge is-teal">
              <strong>ระบบสุขภาพมีทั้งสิ้น 6 Discussions</strong> · สอบผ่านเมื่อแต้ม <strong>&ge; 2.00</strong> (ระดับ <strong>O &ge; 3.75</strong>)
            </div>
          </div>

          <div class="or-card is-white or-spec-card-shell">
            <div>
              <span class="or-card-kicker">6.2 ระบาดวิทยา · อ. 8 ธ.ค. 69 (08.30–12.00 น. · ห้อง 2C2-02..03)</span>
              <h3 class="or-card-title">Epidemiology Exam (Closed-Book · รวม 100%)</h3>
            </div>

            ${renderSegmented100BarHtml("สัดส่วนสะสมข้อสอบระบาดวิทยา (EP1 ไม่ออกสอบ · EP2–EP9 = 100%)", "∑ = 100%", [
              { code: "EP2", label: "Diagnostic test", pct: 15, pctLabel: "15%", color: "#1d4ed8" },
              { code: "EP3", label: "Errors in epidemiology", pct: 15, pctLabel: "15%", color: "#0284c7" },
              { code: "EP4", label: "Study designs & Impact", pct: 10, pctLabel: "10%", color: "#0d9488" },
              { code: "EP5", label: "Surveillance & Outbreak", pct: 15, pctLabel: "15%", color: "#059669" },
              { code: "EP6", label: "Burden of disease", pct: 15, pctLabel: "15%", color: "#d97706" },
              { code: "EP7", label: "Health survey", pct: 7.5, pctLabel: "7.5%", color: "#ea580c" },
              { code: "EP8", label: "Experimental study", pct: 15, pctLabel: "15%", color: "#7c3aed" },
              { code: "EP9", label: "EBM", pct: 7.5, pctLabel: "7.5%", color: "#be185d" }
            ])}

            <div class="or-spec-mini-table-wrap">
              <table class="or-spec-mini-table">
                <thead>
                  <tr>
                    <th style="width:13%">รหัส</th>
                    <th>หัวข้อบทเรียนระบาดวิทยา</th>
                    <th style="width:24%;text-align:right">สัดส่วนข้อสอบ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="is-zero-row"><td><code>EP1</code></td><td>Introduction to epidemiology</td><td style="text-align:right"><strong>-</strong> <em>(ไม่ออกสอบ)</em></td></tr>
                  <tr><td><code>EP2</code></td><td>Diagnostic test</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:100%;background:#1d4ed8"></span></span><strong>15%</strong></div></td></tr>
                  <tr><td><code>EP3</code></td><td>Errors in epidemiology</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:100%;background:#0284c7"></span></span><strong>15%</strong></div></td></tr>
                  <tr><td><code>EP4</code></td><td>Overview of study designs &amp; Measurement of impact (<code>AR, AR%, PAR, PAR%</code>)</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:66.7%;background:#0d9488"></span></span><strong>10%</strong></div></td></tr>
                  <tr><td><code>EP5</code></td><td>Disease surveillance &amp; Outbreak investigation</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:100%;background:#059669"></span></span><strong>15%</strong></div></td></tr>
                  <tr><td><code>EP6</code></td><td>Measure of burden of disease</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:100%;background:#d97706"></span></span><strong>15%</strong></div></td></tr>
                  <tr><td><code>EP7</code></td><td>Health survey</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:50%;background:#ea580c"></span></span><strong>7.5%</strong></div></td></tr>
                  <tr><td><code>EP8</code></td><td>Experimental study</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:100%;background:#7c3aed"></span></span><strong>15%</strong></div></td></tr>
                  <tr><td><code>EP9</code></td><td>Evidence-based medicine (<code>EBM</code>)</td><td><div class="or-spec-pct-cell"><span class="or-spec-inline-bar"><span style="width:50%;background:#be185d"></span></span><strong>7.5%</strong></div></td></tr>
                  <tr class="is-sum-row"><td colspan="2">รวมสัดส่วนข้อสอบภาคทฤษฎีระบาดวิทยา</td><td style="text-align:right">100%</td></tr>
                </tbody>
              </table>
            </div>

            <div class="or-s11-foot-badge is-blue">
              <strong>ระบาดวิทยามีทั้งสิ้น 7 Exercises</strong> · สอบผ่านเมื่อแต้ม <strong>&ge; 2.00</strong> (ระดับ <strong>O &ge; 3.75</strong>)
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s11b-exam-regulations",
      num: "17",
      section: "evaluation",
      sectionLabel: "Act III · ระเบียบการสอบ",
      actClass: "is-act-3",
      actLabel: "ACT III · WRITTEN EXAM REGULATIONS",
      timeWindow: "09.17 – 09.18 น. (ระเบียบสอบ)",
      kicker: "03 · OFFICIAL EXAM ROOM REGULATIONS & OPEN-NOTE A4 SPECIFICATION",
      title: "ระเบียบการเข้าห้องสอบภาคทฤษฎี สิ่งของต้องห้าม และเกณฑ์กระดาษ Open Note A4",
      keyTag: "กติกาห้องสอบสำคัญ",
      keyMessageHtml:
        "<strong>สายเกิน 15 นาที ไม่ให้เข้าห้องสอบ</strong> · แต่งกายถูกระเบียบและติดป้ายชื่อรูปชัดเจน · <strong>งดกระเป๋า มือถือ Smart Watch เครื่องคิดเลข อาหารเครื่องดื่ม</strong> · สอบระบบฯ นำ <strong>กระดาษ A4 ลายมือตนเอง 1 แผ่น (หน้า–หลัง)</strong> เข้าได้",
      notes:
        "ย้ำระเบียบการสอบภาคทฤษฎีทุกข้อตามคู่มือรายวิชาอย่างครบถ้วน: (1) มาสายเกิน 15 นาที ไม่ให้เข้าห้องสอบ (2) แต่งกายถูกต้องตามระเบียบของคณะฯ ติดเข็มกลัด สวมเข็มขัด และรองเท้าให้เรียบร้อย (3) ติดป้ายชื่อประจำตัวที่มีรูปให้เห็นชัดเจน (4) สิ่งของที่ห้ามนำเข้าห้องสอบทั้ง 4 หมวด ได้แก่ กระเป๋าทุกชนิด เครื่องมือสื่อสารและ Smart Watch เอกสาร/ตำรา/เครื่องคิดเลข/อุปกรณ์อิเล็กทรอนิกส์ และอาหารเครื่องดื่ม (5) สอบระบบสุขภาพแบบ Open Note นำกระดาษ A4 จำนวน 1 แผ่น จดเขียนด้วยลายมือตัวเอง ใช้ปากกาหรือดินสอ เขียนได้ทั้งหน้า-หลัง เข้าห้องสอบได้",
      render: () => `
        <div class="or-grid-3" data-fit-group="cards" style="height:100%">
          <div class="or-card is-navy-tint is-vcenter">
            <span class="or-card-kicker">1 · การเข้าห้องสอบและการแต่งกาย</span>
            <h3 class="or-card-title">เวลาเข้าสอบ เครื่องแบบ &amp; ป้ายชื่อ</h3>
            <ul class="or-list">
              <li><strong>เวลาเข้าห้องสอบ:</strong> <strong>สายเกิน 15 นาที ไม่ให้เข้าห้องสอบ</strong>โดยเด็ดขาด</li>
              <li><strong>การแต่งกาย:</strong> แต่งกายถูกต้องตามระเบียบของคณะฯ <strong>ติดเข็มกลัด สวมเข็มขัด และรองเท้าให้เรียบร้อย</strong></li>
              <li><strong>การแสดงตัวตน:</strong> <strong>ติดป้ายชื่อประจำตัวที่มีรูปให้เห็นชัดเจน</strong>ตลอดเวลาที่อยู่ในห้องสอบ</li>
            </ul>
          </div>

          <div class="or-card is-rose-tint is-vcenter">
            <span class="or-card-kicker">2 · ห้ามนำเข้าห้องสอบโดยเด็ดขาด</span>
            <h3 class="or-card-title">สิ่งของต้องห้ามทั้ง 4 หมวด</h3>
            <ul class="or-list">
              <li>🚫 <strong>กระเป๋าบรรจุสิ่งของทุกชนิด</strong></li>
              <li>🚫 <strong>เครื่องมือสื่อสาร และนาฬิกาข้อมือประเภท Smart Watch</strong> ทุกชนิด</li>
              <li>🚫 <strong>เอกสาร ตำรา เครื่องคิดเลข และอุปกรณ์อิเล็กทรอนิกส์</strong>ทุกชนิด</li>
              <li>🚫 <strong>อาหาร และเครื่องดื่ม</strong>ทุกชนิด</li>
            </ul>
          </div>

          <div class="or-card is-teal-tint is-vcenter">
            <span class="or-card-kicker">3 · เงื่อนไขเฉพาะวิชาสอบ (OPEN NOTE vs CLOSED-BOOK)</span>
            <h3 class="or-card-title">เกณฑ์กระดาษ A4 สำหรับสอบระบบสุขภาพ</h3>
            <ul class="or-list">
              <li><strong>สอบภาคทฤษฎีระบบสุขภาพ (อ. 22 ธ.ค. · แบบ Open Note):</strong> นำ <strong>กระดาษ A4 จำนวน 1 แผ่น</strong> เข้าห้องสอบได้ โดย<strong>จดเขียนด้วยลายมือตัวเอง ใช้ปากกาหรือดินสอ เขียนได้ทั้งหน้า–หลัง</strong> <em>(ห้ามพิมพ์ ห้ามถ่ายสำเนา และห้ามแปะกระดาษเพิ่ม)</em></li>
              <li><strong>สอบภาคทฤษฎีระบาดวิทยา (อ. 8 ธ.ค. · Closed-Book):</strong> ไม่อนุญาตให้นำเอกสาร โน้ตย่อ หรือเครื่องคิดเลขเข้าห้องสอบ</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "s12-eval-practical-rubrics",
      num: "18",
      section: "evaluation",
      sectionLabel: "Act III · Evaluation",
      actClass: "is-act-3",
      actLabel: "ACT III · EVALUATION",
      timeWindow: "09.18 – 09.19 น. (ภาพรวมภาคปฏิบัติ)",
      kicker: "03 · COMPETENCIES 2–5 · TEAM PRESENTATION, REFLECTION & INTEGRITY",
      title: "ภาพรวมการประเมินภาคปฏิบัติ การนำเสนอผลงานทีม งานสะท้อนคิด และเจตคติวิชาชีพ",
      keyTag: "การสังเคราะห์ร่วมกัน",
      keyMessageHtml:
        "การนำเสนอหมวดระบบสุขภาพ (<code>ฟอร์ม 3A</code>) มุ่งให้ทีมใช้ <strong>การคิดเชิงระบบเชื่อมโยงทั้ง 5 วัตถุประสงค์เข้าด้วยกัน</strong> ควบคู่กับวิจัยระบาดวิทยา (<code>ฟอร์ม 4A</code>) งานสะท้อนคิด <code>SRN 1–2</code> และเจตคติ (<code>ฟอร์ม 1A, 2A</code>)",
      notes:
        "ปูภาพรวมการประเมินภาคปฏิบัติทั้ง 3 เสาหลัก ได้แก่ งานสะท้อนคิดรายบุคคล (SRN 1 และ 2) การนำเสนอผลงานทีม (ฟอร์ม 3A ระบบสุขภาพ และฟอร์ม 4A ระบาดวิทยา) และการประเมินพฤติกรรม-เจตคติ (ฟอร์ม 1A และ 2A) ก่อนเจาะลึกรายละเอียดเกณฑ์แต่ละฟอร์มในสไลด์ถัดไป",
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
                <li><strong>รูปแบบไฟล์:</strong> PDF <strong>ไม่เกิน 5 หน้า A4</strong> อักษร <code>TH Sarabun New 16pt</code> (<strong>No AI</strong>)</li>
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
                <li><strong>ระบาดวิทยา (4A · 30 ธ.ค.):</strong> นำเสนอสด 7 นาที แลกเปลี่ยน 18 นาที (<strong>ยกเว้นการถ่ายบันทึก VDO ล่วงหน้า</strong>)</li>
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
                <li><strong>ฟอร์ม 1A:</strong> การสื่อสาร ความใฝ่รู้ ภาวะผู้นำ/ทำงานทีม การมีส่วนร่วม ความรับผิดชอบ ความซื่อสัตย์ และน้ำใจ</li>
                <li><strong>ฟอร์ม 2A (แจ้งผล นศพ.):</strong> สรุปผลภาคพฤติกรรม + เจตคติ สู่ภาพรวมระดับ <strong>O / S / U</strong></li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s12b-hs-presentation-3a",
      num: "19",
      section: "evaluation",
      sectionLabel: "Act III · นำเสนอระบบฯ (3A)",
      actClass: "is-act-3",
      actLabel: "ACT III · HEALTH SYSTEMS RUBRIC (FORM 3A)",
      timeWindow: "อ. 29 ธ.ค. 69 · ฟอร์ม 3A (100 คะแนน)",
      kicker: "03 · HEALTH SYSTEMS ORAL PRESENTATION GUIDELINES & FORM 3A RUBRIC",
      title: "เกณฑ์การนำเสนอและแบบประเมินผลหมวดระบบสุขภาพ (ฟอร์ม 3A · เต็ม 100 คะแนน)",
      keyTag: "ฟอร์ม 3A · ระบบสุขภาพ",
      keyMessageHtml:
        "บูรณาการวัตถุประสงค์ภาคสนามด้วยคิดเชิงระบบ · <strong>30 นาที/กลุ่ม</strong> (ตารางปี 69: <strong>นำเสนอ &le; 10 นาที + อภิปราย 20 นาที</strong>) · <strong>Formal presentation รูปแบบใดก็ได้ ยกเว้นการถ่ายบันทึก VDO ล่วงหน้ามา Present</strong>",
      notes:
        "ชี้แจงเกณฑ์การนำเสนอระบบสุขภาพ (วันอังคาร 29 ธ.ค. 69 ห้อง 2C2-03 ลงทะเบียน 08.00 น.): บูรณาการเชื่อมโยงวัตถุประสงค์การเรียนรู้ภาคสนามระบบสุขภาพ เวลารวม 30 นาที/กลุ่ม (ตารางปี 2569 นำเสนอไม่เกิน 10 นาที + อภิปราย 20 นาที / เกณฑ์เดิมนำเสนอไม่เกิน 12 นาที + อภิปราย 18 นาที) รูปแบบ Formal presentation ใดก็ได้ ยกเว้นการถ่ายบันทึก VDO ล่วงหน้ามา Present สัญญาณกริ่งเตือน: กดกริ่ง 1 ครั้งก่อนหมดเวลานำเสนอ 5 นาที, กดกริ่ง 2 ครั้งเมื่อครบเวลานำเสนอ และเมื่อหมดเวลา 30 นาที ยกป้ายและกดกริ่ง 2 ครั้ง พร้อมเกณฑ์คะแนนฟอร์ม 3A ทั้ง 5 ข้อ รวม 100 คะแนน",
      render: () => `
        <div class="or-pres-rubric-stack">
          <div class="or-pres-rules-strip">
            <div class="or-pres-rule-chip is-outline">
              <span class="or-pres-rule-kicker">โจทย์บูรณาการ &amp; รูปแบบการนำเสนอ</span>
              บูรณาการวัตถุประสงค์การเรียนรู้ภาคสนามระบบสุขภาพ (เชื่อมทั้ง <strong>5 วัตถุประสงค์</strong> ด้วยคิดเชิงระบบ / คู่มือเดิม 2–5 ข้อ) · <strong>Formal presentation รูปแบบใดก็ได้ ยกเว้นการถ่ายบันทึก VDO ล่วงหน้ามา Present</strong>
            </div>
            <div class="or-pres-rule-chip">
              <span class="or-pres-rule-kicker">การจัดสรรเวลา (รวม 30 นาที / กลุ่ม)</span>
              ตารางปี 2569: <strong>นำเสนอไม่เกิน 10 นาที + อภิปราย 20 นาที</strong> <em>(เกณฑ์คู่มือเดิม: นำเสนอ &le; 12 นาที + อภิปราย 18 นาที)</em> · วันอังคารที่ 29 ธ.ค. 69 ณ ห้อง <code>2C2-03</code>
            </div>
            <div class="or-pres-rule-chip is-bell">
              <span class="or-pres-rule-kicker">🔔 การเตือนหมดเวลา</span>
              <strong>กริ่ง 1 ครั้ง:</strong> ก่อนหมดเวลานำเสนอ 5 นาที · <strong>กริ่ง 2 ครั้ง:</strong> ครบเวลานำเสนอ · <strong>หมดเวลา 30 นาที:</strong> ยกป้ายและกดกริ่ง 2 ครั้ง
            </div>
          </div>

          ${renderSegmented100BarHtml("สัดส่วนคะแนนแบบประเมินการนำเสนอระบบสุขภาพ (ฟอร์ม 3A)", "รวมเต็ม 100 คะแนน", [
            { code: "ข้อ 1 เนื้อหาบูรณาการ", label: "เนื้อหาบูรณาการวัตถุประสงค์", pct: 30, pctLabel: "30 คะแนน", color: "#0284c7" },
            { code: "ข้อ 2 วิเคราะห์/สังเคราะห์", label: "คิดวิเคราะห์ สังเคราะห์ & ข้อจำกัด", pct: 20, pctLabel: "20 คะแนน", color: "#0d9488" },
            { code: "ข้อ 3 บทบาทแพทย์ & ระบบ", label: "ประโยชน์ต่อบทบาทแพทย์และระบบ (Paradigm)", pct: 20, pctLabel: "20 คะแนน", color: "#d97706" },
            { code: "ข้อ 4 ตอบคำถาม", label: "การอธิบายและตอบข้อซักถาม", pct: 20, pctLabel: "20 คะแนน", color: "#4f46e5" },
            { code: "ข้อ 5 สื่อ & เวลา", label: "รูปแบบ สื่อ และการรักษาเวลา", pct: 10, pctLabel: "10 คะแนน", color: "#be185d" }
          ])}

          <div class="or-table-wrap is-rubric-matrix" data-fit-table="1">
            <table class="or-table">
              <colgroup>
                <col style="width:23%" />
                <col style="width:25%" />
                <col style="width:25%" />
                <col style="width:27%" />
              </colgroup>
              <thead>
                <tr>
                  <th>หัวข้อการประเมิน (ฟอร์ม 3A)</th>
                  <th class="is-col-u">ไม่ผ่าน (U)</th>
                  <th class="is-col-s">ผ่าน (S)</th>
                  <th class="is-col-o">โดดเด่น (O)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>1. เนื้อหาบูรณาการวัตถุประสงค์ครอบคลุมประเด็นสำคัญ</strong> <span class="or-pts-pill">30 คะแนน</span></td>
                  <td><strong>(0–14)</strong> ขาดข้อมูลสำคัญของประสบการณ์ภาคสนามทั้งเชิงปริมาณหรือคุณภาพ ทำให้ไม่สามารถวิเคราะห์เชื่อมกับบทเรียนได้</td>
                  <td><strong>(15–23)</strong> ข้อมูลครอบคลุมเนื้อหาสำคัญในประเด็นที่เกี่ยวข้อง ตกหล่นเล็กน้อย เพียงพอที่จะประยุกต์กับวัตถุประสงค์การเรียนรู้</td>
                  <td><strong>(24–30)</strong> เนื้อหาประสบการณ์ภาคสนามครอบคลุมวัตถุประสงค์เป็นอย่างดี พอเหมาะ ชัดเจน ถูกต้อง และสอดคล้องกับวัตถุประสงค์</td>
                </tr>
                <tr>
                  <td><strong>2. คิดวิเคราะห์เชื่อมโยงปัจจัย (analytical) สังเคราะห์ (synthesis) &amp; รู้ข้อจำกัดข้อมูล (critical)</strong> <span class="or-pts-pill">20 คะแนน</span></td>
                  <td><strong>(0–9)</strong> ไม่สามารถวิเคราะห์เชื่อมโยงบทเรียนกับภาคสนาม ผิดพลาดในจุดสำคัญ อ้างข้อมูลเกินจริงโดยไม่ตระหนักข้อจำกัดข้อมูล</td>
                  <td><strong>(10–15)</strong> นำประสบการณ์ภาคสนามมาคิดวิเคราะห์เชื่อมโยงกับบทเรียนได้เป็นส่วนใหญ่ คลาดเคลื่อนเล็กน้อย และสังเคราะห์ได้บ้าง</td>
                  <td><strong>(16–20)</strong> วิเคราะห์เชื่อมโยงบทเรียนเข้ากับประสบการณ์ภาคสนามได้อย่างดี ประเด็นชัดเจน นำไปสู่การสังเคราะห์ที่น่าสนใจและถูกหลักการ</td>
                </tr>
                <tr>
                  <td><strong>3. ประโยชน์ต่อการพัฒนาบทบาทแพทย์ในอนาคตและระบบสุขภาพ</strong> <span class="or-pts-pill">20 คะแนน</span></td>
                  <td><strong>(0–9)</strong> เรื่องที่นำเสนอไม่มีประโยชน์ต่อการพัฒนาระบบสุขภาพ อาจเป็นเพียงการพัฒนาระดับบุคคลหรือองค์กรเล็ก ๆ</td>
                  <td><strong>(10–15)</strong> เกี่ยวข้องกับการพัฒนาระบบสุขภาพในมิติเดิม ทำให้เห็นแนวทางการพัฒนาภายใต้บริบทเดิม</td>
                  <td><strong>(16–20)</strong> มีประโยชน์ต่อระบบสุขภาพในอนาคตอย่างยิ่ง เกิดแนวคิดพัฒนาระบบนอกเหนือบริบทเดิม (<strong>ปรับเปลี่ยนกระบวนทัศน์: Paradigm</strong>)</td>
                </tr>
                <tr>
                  <td><strong>4. การอธิบายและตอบข้อซักถาม แสดงความเข้าใจอย่างเป็นระบบ</strong> <span class="or-pts-pill">20 คะแนน</span></td>
                  <td><strong>(0–9)</strong> ตอบคำถามได้น้อย คลาดเคลื่อนจากหลักวิชาการมาก ข้อมูลที่ตอบไม่เป็นความจริง ไม่เป็นเหตุเป็นผล</td>
                  <td><strong>(10–15)</strong> คลายข้อสงสัยได้เป็นส่วนมาก ใช้ความเห็นร่วมกับการอ้างอิงหลักวิชาการหรือหลักฐานเชิงประจักษ์เป็นส่วนมาก</td>
                  <td><strong>(16–20)</strong> ใช้หลักการทางวิชาการและข้อมูลความจริง สามารถให้ทั้งความเห็นและหลักวิชาการได้อย่างชัดเจนและเหมาะสม</td>
                </tr>
                <tr>
                  <td><strong>5. รูปแบบและวิธีการนำเสนอ สื่อที่ใช้ และการรักษาเวลา</strong> <span class="or-pts-pill">10 คะแนน</span></td>
                  <td><strong>(0–4)</strong> ไม่รักษาเวลา ไม่หยุดนำเสนอแม้กรรมการเตือนหลายครั้ง สื่อไม่ช่วยให้ผู้ฟังเข้าใจ</td>
                  <td><strong>(5–7)</strong> ใช้สื่อเหมาะสม ทำให้เข้าใจเนื้อหาที่ต้องการสื่อ พยายามรักษาเวลาตามกำหนด</td>
                  <td><strong>(8–10)</strong> รูปแบบน่าสนใจ ทำให้ผู้ฟังติดตามเรื่องราวได้ตลอดการนำเสนอ ควบคุมเวลาได้เป็นอย่างดี</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `
    },
    {
      id: "s12c-epi-presentation-4a",
      num: "20",
      section: "evaluation",
      sectionLabel: "Act III · นำเสนอระบาดฯ (4A)",
      actClass: "is-act-3",
      actLabel: "ACT III · EPIDEMIOLOGY RUBRIC (FORM 4A)",
      timeWindow: "พ. 30 ธ.ค. 69 · ฟอร์ม 4A (100 คะแนน)",
      kicker: "03 · EPIDEMIOLOGY ORAL PRESENTATION GUIDELINES & FORM 4A RUBRIC",
      title: "เกณฑ์การนำเสนอและแบบประเมินผลหมวดระบาดวิทยา (ฟอร์ม 4A · เต็ม 100 คะแนน)",
      keyTag: "ฟอร์ม 4A · ระบาดวิทยา",
      keyMessageHtml:
        "<strong>นำเสนอกลุ่มละไม่เกิน 7 นาที + อภิปรายไม่เกิน 18 นาที (25 นาที/กลุ่ม)</strong> · ครบ <strong>Outline 8 หัวข้อ</strong> · <strong>Formal presentation รูปแบบใดก็ได้ ยกเว้นการถ่ายบันทึก VDO ล่วงหน้ามา Present</strong>",
      notes:
        "ชี้แจงเกณฑ์การนำเสนอระบาดวิทยา (วันพุธ 30 ธ.ค. 69 เวลา 08.30–12.00 น. ห้อง 2C2-03): นำเสนอกลุ่มละไม่เกิน 7 นาที และอภิปรายไม่เกิน 18 นาที (รวม 25 นาที/กลุ่ม) Formal presentation รูปแบบใดก็ได้ ยกเว้นการถ่ายบันทึก VDO ล่วงหน้ามา Present โครงร่าง (Outline) ประกอบด้วย คำถามงานวิจัย ที่มาและความสำคัญ วัตถุประสงค์ ระเบียบวิธีวิจัย ผลการวิจัย อภิปรายผล สรุปผล และการนำไปใช้ประโยชน์ สัญญาณกริ่งเตือน: ครบ 7 นาที กดกริ่ง 1 ครั้ง และหมดเวลา 25 นาที ยกป้ายและกดกริ่ง 2 ครั้ง พร้อมเกณฑ์คะแนนฟอร์ม 4A (Quantitative study) ทั้ง 7 ข้อ รวม 100 คะแนน",
      render: () => `
        <div class="or-pres-rubric-stack">
          <div class="or-pres-rules-strip">
            <div class="or-pres-rule-chip is-outline">
              <span class="or-pres-rule-kicker">OUTLINE การนำเสนอครบ 8 องค์ประกอบ</span>
              <strong>คำถามงานวิจัย · ที่มาและความสำคัญ · วัตถุประสงค์ · ระเบียบวิธีวิจัย · ผลการวิจัย · อภิปรายผล · สรุปผล · และการนำไปใช้ประโยชน์</strong>
            </div>
            <div class="or-pres-rule-chip">
              <span class="or-pres-rule-kicker">เวลา &amp; รูปแบบการนำเสนอ (25 นาที / กลุ่ม)</span>
              <strong>นำเสนอไม่เกิน 7 นาที + อภิปรายไม่เกิน 18 นาที</strong> · Formal presentation รูปแบบใดก็ได้ <strong>ยกเว้นการถ่ายบันทึก VDO ล่วงหน้ามา Present</strong>
            </div>
            <div class="or-pres-rule-chip is-bell">
              <span class="or-pres-rule-kicker">🔔 การเตือนหมดเวลา</span>
              <strong>ครบ 7 นาที:</strong> กดกริ่ง 1 ครั้ง · <strong>หมดเวลา 25 นาที:</strong> ยกป้าย และกดกริ่ง 2 ครั้ง
            </div>
          </div>

          ${renderSegmented100BarHtml("สัดส่วนคะแนนแบบประเมินการนำเสนอ Quantitative Study (ฟอร์ม 4A)", "รวมเต็ม 100 คะแนน", [
            { code: "1. ที่มา/วัตถุประสงค์", label: "ที่มาความสำคัญและวัตถุประสงค์", pct: 20, pctLabel: "20", color: "#1d4ed8" },
            { code: "2. วิธีวิจัย", label: "กรอบแนวคิดและระเบียบวิธี", pct: 20, pctLabel: "20", color: "#0284c7" },
            { code: "3. สถิติ", label: "ผลและการวิเคราะห์สถิติ", pct: 10, pctLabel: "10", color: "#0d9488" },
            { code: "4. สรุป/อภิปราย", label: "สรุป อภิปราย & ข้อจำกัด", pct: 20, pctLabel: "20", color: "#059669" },
            { code: "5. ประโยชน์", label: "ประโยชน์จากงานวิจัย", pct: 10, pctLabel: "10", color: "#d97706" },
            { code: "6. ตอบคำถาม", label: "การอธิบายและตอบซักถาม", pct: 10, pctLabel: "10", color: "#7c3aed" },
            { code: "7. สื่อ/เวลา", label: "รูปแบบน่าสนใจและตรงเวลา", pct: 10, pctLabel: "10", color: "#be185d" }
          ])}

          <div class="or-table-wrap is-rubric-matrix" data-fit-table="1">
            <table class="or-table">
              <colgroup>
                <col style="width:23.5%" />
                <col style="width:24.5%" />
                <col style="width:24.5%" />
                <col style="width:27.5%" />
              </colgroup>
              <thead>
                <tr>
                  <th>หัวข้อการประเมิน (ฟอร์ม 4A · Quantitative)</th>
                  <th class="is-col-u">ไม่ผ่าน (U)</th>
                  <th class="is-col-s">ผ่าน (S)</th>
                  <th class="is-col-o">โดดเด่น (O)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>1. ความชัดเจนของที่มา ความสำคัญของปัญหา และวัตถุประสงค์</strong> <span class="or-pts-pill">20 คะแนน</span></td>
                  <td><strong>(0–9)</strong> ชี้แจงที่มาและความสำคัญของปัญหาไม่ได้ หรือไม่ชัดเจน ขาดข้อมูลสนับสนุน</td>
                  <td><strong>(10–15)</strong> ระบุที่มาและความสำคัญของปัญหาได้ มีข้อมูลสนับสนุนชัดเจน</td>
                  <td><strong>(16–20)</strong> ระบุที่มาและความสำคัญได้ชัดเจน มีข้อมูลสนับสนุนที่ผ่านการวิเคราะห์วิพากษ์ และเปรียบเทียบกลุ่มอ้างอิงชัดเจน</td>
                </tr>
                <tr>
                  <td><strong>2. ความถูกต้องของกรอบแนวคิด และระเบียบวิธีการศึกษา</strong> <span class="or-pts-pill">20 คะแนน</span></td>
                  <td><strong>(0–9)</strong> ไม่มีระเบียบวิธีวิจัยที่ชัดเจน ระบุไม่ได้ หรือระบุผิดไปจากข้อเท็จจริง</td>
                  <td><strong>(10–15)</strong> กรอบแนวคิดสอดคล้องกับปัญหา มีระเบียบวิธีวิจัยชัดเจน อธิบายกระบวนการได้ถูกต้อง</td>
                  <td><strong>(16–20)</strong> กรอบแนวคิดแหลมคม บูรณาการความรู้ได้ดี เลือกวิธีวิจัยเหมาะสมประณีตและ<strong>ลดอคติ (Bias) ต่าง ๆ ได้เป็นอย่างดี</strong></td>
                </tr>
                <tr>
                  <td><strong>3. ผลการศึกษา เลือกใช้สถิติวิเคราะห์และนำเสนอข้อมูลถูกต้อง</strong> <span class="or-pts-pill">10 คะแนน</span></td>
                  <td><strong>(0–4)</strong> เลือกสถิติไม่สอดคล้องกับวัตถุประสงค์ กระบวนการวิเคราะห์ผิดพลาด หรือนำเสนอผิด</td>
                  <td><strong>(5–7)</strong> เลือกสถิติวิเคราะห์ได้เหมาะสมกับวัตถุประสงค์ วิเคราะห์ถูกต้อง และนำเสนอเหมาะสม</td>
                  <td><strong>(8–10)</strong> เลือกและวิเคราะห์สถิติถูกต้องเหมาะสมโดยตลอด อธิบายเหตุผลเปรียบเทียบวิธีวิเคราะห์ได้ นำเสนอกระชับเข้าใจง่าย</td>
                </tr>
                <tr>
                  <td><strong>4. สรุปและอภิปรายผล สังเคราะห์ (synthesis) &amp; รู้ข้อจำกัดข้อมูล (critical)</strong> <span class="or-pts-pill">20 คะแนน</span></td>
                  <td><strong>(0–9)</strong> ไม่สามารถสรุปหรือสังเคราะห์ข้อค้นพบได้ หรือสรุปไม่สอดคล้องกับผลการวิเคราะห์</td>
                  <td><strong>(10–15)</strong> ได้ข้อสรุปและสังเคราะห์จากข้อค้นพบได้บ้าง โดยสอดคล้องกับวัตถุประสงค์การศึกษา</td>
                  <td><strong>(16–20)</strong> ระบุข้อค้นพบชัดเจน สังเคราะห์ข้อค้นพบที่เป็นประโยชน์พร้อมอ้างอิงข้อมูลแหล่งอื่นและตระหนักข้อจำกัดข้อมูลอย่างรอบด้าน</td>
                </tr>
                <tr>
                  <td><strong>5. ประโยชน์ที่ได้จากงานวิจัย</strong> <span class="or-pts-pill">10 คะแนน</span></td>
                  <td><strong>(0–4)</strong> ไม่สามารถระบุประโยชน์จากการศึกษาของตนเองได้</td>
                  <td><strong>(5–7)</strong> สามารถระบุประโยชน์ที่ได้จากการศึกษาได้ชัดเจน</td>
                  <td><strong>(8–10)</strong> การศึกษาเกิดประโยชน์ต่อชุมชนและสังคมอย่างชัดเจน สมควรเป็นแบบอย่าง</td>
                </tr>
                <tr>
                  <td><strong>6. การอธิบายและตอบข้อซักถามอย่างเป็นระบบ</strong> <span class="or-pts-pill">10 คะแนน</span></td>
                  <td><strong>(0–4)</strong> ตอบคำถามไม่เป็นระบบ ผิดหลักวิชาการ หรือไม่ใช้ข้อมูลความจริงในการตอบ</td>
                  <td><strong>(5–7)</strong> ตอบคำถามหรืออธิบายโดยใช้หลักวิชาการได้ถูกต้องเป็นส่วนใหญ่ อ้างอิงข้อมูลเหมาะสม</td>
                  <td><strong>(8–10)</strong> ตอบตรงประเด็น ใช้หลักวิชาการถูกต้อง มีหลักฐานสนับสนุนชัดเจน อธิบายกระชับไม่อ้อมค้อม</td>
                </tr>
                <tr>
                  <td><strong>7. รูปแบบการนำเสนอน่าสนใจ และตรงต่อเวลา (&le; 7 นาที)</strong> <span class="or-pts-pill">10 คะแนน</span></td>
                  <td><strong>(0–4)</strong> รูปแบบไม่เหมาะสม ไม่บรรลุวัตถุประสงค์ ไม่รักษาเวลา ได้รับการตักเตือนหลายรอบ</td>
                  <td><strong>(5–7)</strong> นำเสนอได้น่าสนใจ สื่อสารให้ผู้ฟังเข้าใจได้ และรักษาเวลาได้ดี</td>
                  <td><strong>(8–10)</strong> การนำเสนอโดดเด่น ดึงดูดความสนใจผู้ฟังได้ตลอดการนำเสนอ และตรงต่อเวลาอย่างแม่นยำ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `
    },
    {
      id: "s12d-form-2a-1a-part1",
      num: "21",
      section: "evaluation",
      sectionLabel: "Act III · ฟอร์ม 2A & 1A (ข้อ 1–3)",
      actClass: "is-act-3",
      actLabel: "ACT III · PRACTICAL & ATTITUDE (FORM 2A & 1A)",
      timeWindow: "เกณฑ์ภาคปฏิบัติและเจตคติ (1/2)",
      kicker: "03 · PRACTICAL & ATTITUDE EVALUATION STRUCTURE (FORM 2A) & BEHAVIOR RUBRIC (FORM 1A · ITEMS 1–3)",
      title: "เกณฑ์การประเมินภาคปฏิบัติและเจตคติ (ฟอร์ม 2A) และเกณฑ์ประเมินพฤติกรรม (ฟอร์ม 1A · ข้อ 1–3)",
      keyTag: "ฟอร์ม 2A & ฟอร์ม 1A",
      keyMessageHtml:
        "ผลที่จะแจ้ง นศพ. คือ <strong>ข้อ 3 ภาพรวมเจตคติและพฤติกรรม (<code>O / S / U</code>)</strong> โดยใช้ Input จาก <strong>ข้อ 1 ภาคพฤติกรรม</strong> + <strong>ข้อ 2 เจตคติ</strong> (ประเมินโดยเพื่อน นศพ. และอาจารย์ตามเกณฑ์ <strong>ฟอร์ม 1A</strong>)",
      notes:
        "แสดงโครงสร้างการให้คะแนนเกณฑ์การประเมินภาคปฏิบัติและเจตคติ หลักสูตรเวชศาสตร์ชุมชน สำหรับ นศพ. ชั้นปีที่ 3 (ฟอร์ม 2A) ทั้ง 3 หัวข้อ พร้อมหมายเหตุครบทั้ง 3 ข้อ (ที่มาของคะแนนจากแบบประเมินโดย นศพ. และอาจารย์, ข้อ 3 ส่งเป็นรายงานแจ้ง นศพ., และการใช้ Personal Judgement กรณีผลข้อ 1 และ 2 ไม่ตรงกัน) แขวนคู่กับเกณฑ์ในการประเมินผลพฤติกรรม นศพ. ชั้นปีที่ 3 (ฟอร์ม 1A) ข้อ 1 การสื่อสารและมนุษยสัมพันธ์, ข้อ 2 ความใฝ่รู้ และข้อ 3 ภาวะผู้นำและการทำงานเป็นทีม",
      render: () => `
        <div class="or-infog-split is-form2a-1a-split">
          <div class="or-card is-navy-tint" data-fit-solo="1" style="display:flex;flex-direction:column;justify-content:space-between;height:100%">
            <div>
              <span class="or-card-kicker">โครงสร้างการให้คะแนน · หลักสูตรเวชศาสตร์ชุมชน ปีที่ 3</span>
              <h3 class="or-card-title">เกณฑ์การประเมินภาคปฏิบัติและเจตคติ (ฟอร์ม 2A)</h3>
            </div>

            <div class="or-form2a-items-list">
              <div class="or-form2a-item-row">
                <span>1. การประเมินภาคพฤติกรรม</span>
                <span class="or-osu-scale-pill">O / S / U</span>
              </div>
              <div class="or-form2a-item-row">
                <span>2. การประเมินเจตคติ</span>
                <span class="or-osu-scale-pill">O / S / U</span>
              </div>
              <div class="or-form2a-item-row is-final">
                <span>3. การประเมินภาพรวมเจตคติและพฤติกรรม</span>
                <span class="or-osu-scale-pill">O / S / U</span>
              </div>
            </div>

            <div class="or-card is-amber-tint" style="padding:0.42cqw 0.56cqw">
              <ul class="or-list" style="gap:0.22cqw">
                <li><strong>*ที่มาของคะแนนข้อ 1 และ ข้อ 2:</strong> มาจากแบบประเมินผลพฤติกรรมและเจตคตินักศึกษา โดย <strong>นศพ. (เพื่อนร่วมกลุ่ม)</strong> และ<strong>อาจารย์ประจำกลุ่ม (ฟอร์ม 1A)</strong></li>
                <li><strong>*การแจ้งผลในข้อ 3:</strong> ภาพรวมเจตคติและพฤติกรรมจะถูก<strong>ส่งเป็นรายงานให้นักศึกษาทราบ</strong> (ใช้ Input จากข้อ 1. ภาคพฤติกรรม/ปฏิบัติ และ ข้อ 2. เจตคติ)</li>
                <li><strong>*กรณีผลข้อ 1 และ 2 ไม่ตรงกัน:</strong> อาจารย์สามารถใช้ดุลยพินิจ (<strong>Personal Judgement</strong>) เพื่อตัดสินผลในข้อ 3</li>
              </ul>
            </div>
          </div>

          <div class="or-table-wrap is-rubric-matrix" data-fit-table="1">
            <table class="or-table">
              <colgroup>
                <col style="width:24%" />
                <col style="width:25%" />
                <col style="width:25%" />
                <col style="width:26%" />
              </colgroup>
              <thead>
                <tr>
                  <th class="is-col-u">ไม่ดี (U)</th>
                  <th class="is-col-s">พอใช้ (S)</th>
                  <th class="is-col-s">ดี (S)</th>
                  <th class="is-col-o">ดีมาก (O)</th>
                </tr>
              </thead>
              <tbody>
                <tr class="is-domain-divider"><td colspan="4">เกณฑ์ในการประเมินผลพฤติกรรม นศพ. ชั้นปีที่ 3 (ฟอร์ม 1A) — 1. การสื่อสารและมนุษยสัมพันธ์</td></tr>
                <tr>
                  <td>สื่อสารไม่อ่อนน้อม และไม่สุภาพ ไม่ตรงความจริง ไม่รู้กาลเทศะ ไม่มีประโยชน์ ขาดเมตตา ไม่เอาใจเขามาใส่ใจเรา ไม่รับฟังความเห็นของผู้อื่น ใช้ตัวเองเป็นตัวตั้งในการเกี่ยวข้องกับผู้อื่น</td>
                  <td><strong>บางครั้ง</strong> สื่อสารไม่อ่อนน้อมและไม่สุภาพ ไม่ตรงความจริง ไม่รู้กาลเทศะ ไม่มีประโยชน์ ขาดเมตตา ไม่เอาใจเขามาใส่ใจเรา ไม่รับฟังความเห็นของผู้อื่น ใช้ตัวเองเป็นตัวตั้งในการเกี่ยวข้องกับผู้อื่น</td>
                  <td><strong>ส่วนใหญ่</strong> สื่อสารอย่างอ่อนน้อมและสุภาพ ตรงความจริง รู้กาลเทศะ มีประโยชน์ กอปรด้วยเมตตา เอาใจเขามาใส่ใจเรา รับฟังความเห็นของผู้อื่น ใช้ประโยชน์ร่วมเป็นตัวตั้งในการเกี่ยวข้องกับผู้อื่น</td>
                  <td><strong>กระทำสม่ำเสมอ</strong>ในเรื่องสื่อสารอย่างอ่อนน้อมและสุภาพ ตรงความจริง รู้กาลเทศะ มีประโยชน์ กอปรด้วยเมตตา เอาใจเขามาใส่ใจเรา รับฟังความเห็นของผู้อื่น ใช้ส่วนรวมเป็นตัวตั้งในการเกี่ยวข้องกับผู้อื่น</td>
                </tr>
                <tr class="is-domain-divider"><td colspan="4">2. ความใฝ่รู้</td></tr>
                <tr>
                  <td>- ไม่เคยมาแลกเปลี่ยน สอบถามเนื้อหาวิชาการกับอาจารย์<br>- ไม่มีการศึกษาหรือค้นคว้าเพิ่มเติม</td>
                  <td>- มาแลกเปลี่ยนสอบถามเนื้อหาวิชาการกับอาจารย์สม่ำเสมอ<strong>เป็นบางครั้ง</strong><br>- ศึกษาค้นคว้าเพิ่มเติมสม่ำเสมอ<strong>เป็นบางครั้ง</strong></td>
                  <td>- มาแลกเปลี่ยนสอบถามเนื้อหาวิชาการกับอาจารย์<strong>ค่อนข้างสม่ำเสมอ</strong><br>- ศึกษาค้นคว้าเพิ่มเติม<strong>ค่อนข้างสม่ำเสมอ</strong></td>
                  <td>- มาแลกเปลี่ยนสอบถามเนื้อหาวิชาการกับอาจารย์<strong>สม่ำเสมอ</strong><br>- ศึกษาค้นคว้าเพิ่มเติม<strong>สม่ำเสมอ</strong></td>
                </tr>
                <tr class="is-domain-divider"><td colspan="4">3. ภาวะผู้นำและการทำงานเป็นทีม</td></tr>
                <tr>
                  <td><strong>ไม่เคยหรือแทบไม่เคย</strong>แสดงพฤติกรรมในเรื่อง:<br>- กล้าแสดงความคิดเห็น และโน้มนำกลุ่มให้ปฏิบัติตามในสิ่งที่เห็นว่าถูกว่าควร แม้ส่วนใหญ่จะไม่เห็นด้วย<br>- รับฟังความเห็นของกลุ่ม และพร้อมทำตามมติของส่วนใหญ่ แม้จะเห็นแตกต่าง<br>- ให้ความเห็นและความร่วมมือในการทำงาน</td>
                  <td><strong>ปฏิบัติเป็นบางครั้ง</strong>ในเรื่อง:<br>- กล้าแสดงความคิดเห็น และโน้มนำกลุ่มให้ปฏิบัติตามในสิ่งที่เห็นว่าถูกว่าควร แม้ส่วนใหญ่จะไม่เห็นด้วย<br>- รับฟังความเห็นของกลุ่ม และพร้อมทำตามมติของส่วนใหญ่ แม้จะเห็นแตกต่าง<br>- ให้ความเห็นและความร่วมมือในการทำงาน</td>
                  <td><strong>ปฏิบัติค่อนข้างสม่ำเสมอ</strong>ในเรื่อง:<br>- กล้าแสดงความคิดเห็น และโน้มนำกลุ่มให้ปฏิบัติตามในสิ่งที่เห็นว่าถูกว่าควร แม้ส่วนใหญ่จะไม่เห็นด้วย<br>- รับฟังความเห็นของกลุ่ม และพร้อมทำตามมติของส่วนใหญ่ แม้จะเห็นแตกต่าง<br>- ให้ความเห็นและความร่วมมือในการทำงาน</td>
                  <td><strong>ปฏิบัติสม่ำเสมอ</strong>ในเรื่อง:<br>- กล้าแสดงความคิดเห็น และโน้มนำกลุ่มให้ปฏิบัติตามในสิ่งที่เห็นว่าถูกว่าควร แม้ส่วนใหญ่จะไม่เห็นด้วย<br>- รับฟังความเห็นของกลุ่ม และพร้อมทำตามมติของส่วนใหญ่ แม้จะเห็นแตกต่าง<br>- ให้ความเห็นและความร่วมมือในการทำงาน</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `
    },
    {
      id: "s12e-form-1a-part2",
      num: "22",
      section: "evaluation",
      sectionLabel: "Act III · ฟอร์ม 1A (ข้อ 4 & ข้อ 6)",
      actClass: "is-act-3",
      actLabel: "ACT III · FORM 1A RUBRIC (ITEMS 4.1–4.3 & 6.1–6.3)",
      timeWindow: "เกณฑ์ภาคปฏิบัติและเจตคติ (2/2)",
      kicker: "03 · MEDICAL STUDENT BEHAVIOR & ATTITUDE GLOBAL RATING CRITERIA (FORM 1A · ITEMS 4.1–4.3 & 6.1–6.3)",
      title: "เกณฑ์ในการประเมินผลพฤติกรรมนักศึกษาแพทย์ชั้นปีที่ 3 (ฟอร์ม 1A · ข้อ 4.1–4.3 และข้อ 6.1–6.3)",
      keyTag: "ฟอร์ม 1A · ครบทุกข้อ",
      keyMessageHtml:
        "<strong>ข้อ 1–4.3</strong> สะท้อน <strong>การประเมินภาคพฤติกรรม (<code>O / S / U</code>)</strong> และ <strong>ข้อ 6.1–6.3 (ความรับผิดชอบ · ความซื่อสัตย์ · มีน้ำใจช่วยเหลือผู้อื่น)</strong> สะท้อน <strong>การประเมินเจตคติ (<code>O / S / U</code>)</strong> เพื่อสรุปเป็นภาพรวมใน <code>ฟอร์ม 2A</code>",
      notes:
        "แสดงตารางเกณฑ์ในการประเมินผลพฤติกรรมนักศึกษาแพทย์ชั้นปีที่ 3 (ฟอร์ม 1A) ส่วนที่ 2 ครบทุกช่องตามต้นฉบับ ได้แก่ ข้อ 4.1 การแสดงความเห็นในชั้นเรียน & 4.2 การออกความคิดเห็นในการทำงานกลุ่ม, ข้อ 4.3 การมีส่วนร่วมอื่น ๆ ในการทำงานกลุ่ม, ข้อ 6.1 ความรับผิดชอบ, ข้อ 6.2 ความซื่อสัตย์ (พูดความจริง ไม่บิดเบือนข้อมูล ไม่ลอกรายงาน ไม่เซ็นชื่อแทนกัน ทั้งต่อหน้าและลับหลัง) และข้อ 6.3 มีน้ำใจช่วยเหลือผู้อื่น",
      render: () => `
        <div class="or-table-wrap is-rubric-matrix" data-fit-table="1">
          <table class="or-table">
            <colgroup>
              <col style="width:24%" />
              <col style="width:25%" />
              <col style="width:25%" />
              <col style="width:26%" />
            </colgroup>
            <thead>
              <tr>
                <th class="is-col-u">ไม่ดี (U)</th>
                <th class="is-col-s">พอใช้ (S)</th>
                <th class="is-col-s">ดี (S)</th>
                <th class="is-col-o">ดีมาก (O)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="is-domain-divider"><td colspan="4">4.1 การแสดงความเห็นในชั้นเรียน, 4.2 การออกความคิดเห็นในการทำงานกลุ่ม</td></tr>
              <tr>
                <td>- หลับหรือทำอย่างอื่นบ่อยครั้ง<br>- เงียบหรือไม่แสดงความเห็น เมื่อถูกกระตุ้น หรือแสดงความเห็นอย่างเสียไม่ได้ เสมือนไม่ได้สนใจในเรื่องนั้น หรือไม่คิดไม่ไตร่ตรอง</td>
                <td>- หลับหรือทำอย่างอื่น เป็นบางครั้ง เช่น เล่นเกมส์<br>- แสดงความคิดเห็นต่อเมื่อถูกกระตุ้น ความเห็นนั้นธรรมดาหรือแสดงถึงความไม่ค่อยสนใจในเรื่องนั้น</td>
                <td><strong>ส่วนใหญ่</strong><br>- สนใจฟัง ไม่หลับ ไม่ทำอย่างอื่น เช่น เล่นเกมส์ ให้ความคิดเห็น โดยไม่ต้องกระตุ้น และความเห็นนั้นดี มีคุณค่าแสดงถึง <code>critical thinking</code> หรือความใส่ใจในเรื่องนั้น</td>
                <td>- <strong>สนใจฟังตลอดเวลา</strong> ไม่หลับ ไม่ทำอย่างอื่น เช่น เล่นเกมส์ ให้ความคิดเห็นโดยไม่ต้องกระตุ้น และความเห็นนั้นดีมีคุณค่า แสดงถึง <code>critical thinking</code> หรือความใส่ใจในเรื่องนั้น</td>
              </tr>
              <tr class="is-domain-divider"><td colspan="4">4.3 การมีส่วนร่วมอื่น ๆ ในการทำงานกลุ่ม</td></tr>
              <tr>
                <td>- ไม่สนใจช่วยเหลืองานกลุ่ม</td>
                <td>- ช่วยเหลืองานกลุ่มบ้าง</td>
                <td>- ส่วนใหญ่ช่วยเหลืองานกลุ่ม</td>
                <td>- ช่วยเหลืองานกลุ่มอย่างสม่ำเสมอ</td>
              </tr>
              <tr class="is-domain-divider"><td colspan="4">6.1 ความรับผิดชอบ (หมวดเจตคติ)</td></tr>
              <tr>
                <td>- ไม่ทำงานที่ได้รับมอบหมาย หรือเสร็จไม่ทันเวลา คุณภาพใช้ไม่ได้ เนื่องจากไม่ใส่ใจหรือรับผิดชอบงานนั้น<br>- ไม่ยอมรับข้อผิดพลาดของตนเองและไม่ยอมแก้ไข</td>
                <td><strong>บางครั้ง</strong><br>- ทำงานที่ได้รับมอบหมายเสร็จไม่ทันเวลา หรือคุณภาพพอใช้ เนื่องจากไม่ได้ใช้ความพยายามเต็มที่<br>- ยอมรับข้อบกพร่องของตนเองและยินดีแก้ไขเสมอ</td>
                <td>- <strong>ส่วนใหญ่</strong>กระตือรือร้นในการทำงานที่ได้รับมอบหมายเสร็จทันเวลา และคุณภาพดี<br>- ส่วนใหญ่ยอมรับข้อบกพร่องของตนเองและยินดีแก้ไขเสมอ</td>
                <td>- <strong>กระตือรือร้น</strong>ในการทำงานที่ได้รับมอบหมายให้เสร็จทันเวลา และมีคุณภาพดีเลิศอย่างสม่ำเสมอ<br>- ยอมรับข้อบกพร่องของตนเองและยินดีแก้ไขเสมอ</td>
              </tr>
              <tr class="is-domain-divider"><td colspan="4">6.2 ความซื่อสัตย์ (หมวดเจตคติ)</td></tr>
              <tr>
                <td>ประพฤติเป็นประจำในเรื่อง: <strong>พูดแต่ความเท็จ</strong> หรือ <strong>บิดเบือนข้อมูล</strong> หรือ <strong>เซ็นชื่อแทนกัน</strong> หรือ <strong>ลอกรายงาน</strong></td>
                <td>- หลีกเลี่ยงการพูดความจริง หรือเจตนาให้เข้าใจผิด เมื่อมีข้อผิดพลาด<br>- ไม่บิดเบือนข้อมูล ไม่ลอกรายงาน ไม่เซ็นชื่อแทนกัน<br>- ประพฤติตนเช่นเดียวกัน ทั้งต่อหน้าและลับหลังผู้ที่สามารถให้คุณให้โทษได้</td>
                <td>- <strong>ค่อนข้างชัดเจน</strong>ในการพูดแต่ความจริง แม้มีข้อผิดพลาด<br>- ไม่บิดเบือนข้อมูล ไม่ลอกรายงาน ไม่เซ็นชื่อแทนกัน<br>- ประพฤติตนเช่นเดียวกัน ทั้งต่อหน้าและลับหลังผู้ที่สามารถให้คุณให้โทษได้</td>
                <td>- <strong>แสดงให้เห็นอย่างชัดเจน</strong>ในการให้ข้อมูลแต่ความจริง แม้จะมีข้อผิดพลาด<br>- ไม่บิดเบือนข้อมูล ไม่ลอกรายงาน ไม่เซ็นชื่อแทนกัน ประพฤติตนเช่นเดียวกันทั้งต่อหน้าและลับหลังผู้ที่สามารถให้คุณให้โทษได้</td>
              </tr>
              <tr class="is-domain-divider"><td colspan="4">6.3 มีน้ำใจช่วยเหลือผู้อื่น (หมวดเจตคติ)</td></tr>
              <tr>
                <td>- ไม่ช่วยเหลืองานส่วนรวม หรืองานผู้อื่น ทำแต่งานตนเอง</td>
                <td>- ช่วยเหลืองานส่วนรวม งานผู้อื่น เป็นบางครั้ง</td>
                <td>- ช่วยเหลืองานส่วนรวม งานผู้อื่น อย่างสม่ำเสมอ</td>
                <td>- ช่วยเหลืออย่างเต็มที่ในงานส่วนรวม งานผู้อื่นอย่างสม่ำเสมอ</td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    },
    {
      id: "s13-attendance-safety",
      num: "23",
      section: "action",
      sectionLabel: "Act IV · Conduct & Launch",
      actClass: "is-act-4",
      actLabel: "ACT IV · CONDUCT & SAFETY",
      timeWindow: "09.22 – 09.23 น. (เวลาเรียน & ภาคสนาม)",
      kicker: "04 · ATTENDANCE (≥ 80%), LEAVE QUOTAS (3d / 1.5d) & 6 SAFETY RULES",
      title: "เวลาเรียน สิทธิ์เข้าสอบ โควตาการลา และแนวทางดูแลความปลอดภัยภาคสนาม 6 ข้อ",
      keyTag: "สิทธิ์เข้าสอบ & ความปลอดภัย",
      keyMessageHtml:
        "นักศึกษาจะมีสิทธิ์เข้าสอบเมื่อมี <strong>เวลาเรียนไม่น้อยกว่าร้อยละ 80</strong> (ลาไม่เกิน <strong>3 วัน = คาบเช้า–บ่าย รวม 6 คาบที่เช็คชื่อ</strong> ช่วงก่อน-หลังภาคสนาม และช่วงภาคสนามลาได้ไม่เกิน <strong>1.5 วัน</strong>) พร้อมปฏิบัติตามระเบียบภาคสนาม 6 ข้อ",
      notes:
        "ชี้แจงเกณฑ์เวลาเรียนไม่น้อยกว่าร้อยละ 80 จึงมีสิทธิ์เข้าสอบ โควตาการลาช่วงก่อนและหลังภาคสนามรวมกันไม่เกิน 3 วัน (= คาบเช้า–บ่าย รวม 6 คาบที่เช็คชื่อ) ช่วงฝึกภาคสนามลาได้ไม่เกิน 1.5 วัน ช่วงเวลาลงชื่อเข้าเรียน (ก่อนเริ่มคาบ 15 นาที ถึงหลังเริ่มคาบ 15 นาที) และระเบียบการฝึกปฏิบัติงานนอกสถานที่ พ.ศ. 2561 ทั้ง 6 ข้อ",
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
              <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span>โควตาลาช่วงก่อนและหลังภาคสนามรวมกัน (= เช้า–บ่าย 6 คาบที่เช็คชื่อ)</span><span>&le; 3.0 วัน (6 คาบ)</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-amber" style="width:45%"></div></div></div>
              <div class="or-stat-bar-row"><div class="or-stat-bar-head"><span>โควตาลาเฉพาะช่วงฝึกปฏิบัติงานภาคสนาม</span><span>&le; 1.5 วัน</span></div><div class="or-stat-bar-track"><div class="or-stat-bar-fill is-crimson" style="width:24%"></div></div></div>
            </div>

            <div class="or-card is-amber-tint is-s14-note">
              <p class="or-card-text"><strong>การขอลา:</strong> ยื่นใบลาล่วงหน้าและได้รับอนุมัติจากอาจารย์ที่ปรึกษาก่อนเสมอ (กรณีเจ็บป่วยกะทันหันในพื้นที่ให้รีบแจ้งอาจารย์ทันที)</p>
            </div>
          </div>

          <div class="or-s14-right-stack">
            ${figPlate("orient_s14_safety_shields.png", "6 Fieldwork Safety and Professionalism Shields", "")}
            <div class="or-card is-white is-s14-shield-note" data-fit-solo="1">
              <p class="or-card-text or-inline-sublist">
                <strong>ระเบียบภาคสนาม พ.ศ.&nbsp;2561:</strong> <span class="or-subitem"><span class="or-num-keep">(1)&nbsp;<strong>งดนำรถยนต์</strong></span><strong>หรือพาหนะส่วนตัวไปใช้</strong><span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep">(2)&nbsp;<strong>งดออกนอกพื้นที่</strong></span><strong>หรือเดินทางลำพัง</strong><span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep">(3)&nbsp;งดให้บุคคลภายนอก</span>เข้าเยี่ยมในที่พัก<span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep">(4)&nbsp;แต่งกายสุภาพ</span>และติดป้ายชื่อ<span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep">(5)&nbsp;<strong>งดเครื่องดื่มแอลกอฮอล์</strong></span> <strong>สารเสพติด และการพนัน</strong><span class="or-sub-sep">&nbsp;·</span></span> <span class="or-subitem"><span class="or-num-keep">(6)&nbsp;เคารพสิทธิผู้ป่วย</span>และชุมชนในการสื่อสารออนไลน์</span>
              </p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s13b-conduct-2567-c2a",
      num: "24",
      section: "evaluation",
      sectionLabel: "Act IV · ประกาศเจตคติ 67 (ข้อ 2.1–2.2)",
      actClass: "is-act-4",
      actLabel: "RAMA ATTITUDE RULES 2567 · CLAUSE 2.1–2.2",
      timeWindow: "ประกาศคณะฯ พ.ศ. 2567 (1/3)",
      kicker: "04 · RAMATHIBODI UNDESIRABLE BEHAVIOR CRITERIA B.E. 2567 · ข้อ 2 (หมวด 2.1 – 2.2)",
      title: "ประกาศคณะฯ พ.ศ. 2567 เรื่องพฤติกรรมที่ไม่พึงประสงค์: ข้อ 2.1 ความไม่ซื่อสัตย์ และ ข้อ 2.2 ขาดความเอาใจใส่",
      keyTag: "ข้อ 2.1 – 2.2",
      keyMessageHtml:
        "ป้ายสีแดง <span class=\"or-mu-tag is-u\">U ร้ายแรง</span> คือข้อที่เข้าข่าย <strong>พิจารณาให้ <code>U</code> ได้ทันทีตั้งแต่ครั้งแรกตามข้อ 3.2.1</strong> ได้แก่ <strong>ข้อ 2.1 ทุกข้อย่อย (<code>2.1.1–2.1.9</code>)</strong>, <strong>ข้อ <code>2.2.3</code></strong> และ <strong>ข้อ <code>2.2.5</code></strong>",
      notes:
        "ไล่เรียงประกาศคณะแพทยศาสตร์โรงพยาบาลรามาธิบดี เรื่อง หลักเกณฑ์การประเมินเจตคติเกี่ยวกับพฤติกรรมที่ไม่พึงประสงค์ของนักศึกษาแพทย์ พ.ศ. 2567 (ประกาศ ณ วันที่ 22 ต.ค. 2567) รายข้ออย่างครบถ้วน เริ่มจากข้อ 2.1 พฤติกรรมความไม่ซื่อสัตย์ (2.1.1–2.1.9 ซึ่งทุกข้อเป็นความผิดร้ายแรงพิจารณาให้ U ตามข้อ 3.2.1 รวมถึง 2.1.6 การฝากเช็คชื่อ/ทำกิจกรรมแทนกันทั้งผู้ฝากและผู้ทำแทน) และข้อ 2.2 พฤติกรรมที่ขาดความเอาใจใส่ในการเรียนรู้ (2.2.1–2.2.9 โดย 2.2.3 ลาป่วย >= 3 วันไม่ส่งใบรับรองแพทย์ และ 2.2.5 ขาดกิจกรรมห้ามขาดโดยไม่ขออนุญาต เป็นความผิดร้ายแรงพิจารณาให้ U)",
      render: () => `
        <div class="or-grid-2" data-fit-group="cards" style="height:100%">
          <div class="or-card is-rose-tint" style="display:flex;flex-direction:column;gap:0.28cqw;height:100%">
            <div>
              <span class="or-card-kicker">ข้อ 2.1 · พฤติกรรมความไม่ซื่อสัตย์ (ทุกข้อย่อย = ร้ายแรง พิจารณาให้ U ตามข้อ 3.2.1)</span>
              <h3 class="or-card-title">หมวด 2.1 ความไม่ซื่อสัตย์ (2.1.1 – 2.1.9)</h3>
            </div>
            <ul class="or-clause-list">
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.1.1</strong> เจตนากระทำการทุจริตในการสอบหรือการวัดผลการศึกษาทุกประเภทและทุกรูปแบบ</li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.1.2</strong> ให้ข้อมูลอันเป็นเท็จหรือปกปิดข้อมูลอันพึงแจ้งให้ทราบ</li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.1.3</strong> รายงานข้อมูลผู้ป่วยไม่ตรงตามความเป็นจริงในสาระสำคัญโดยไม่มีเหตุผลอันสมควร</li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.1.4</strong> คัดลอกข้อมูลในการเขียนรายงานผู้ป่วย บันทึกประวัติผู้ป่วย หรืองานที่ได้รับมอบหมายจากแหล่งอื่นโดยมิชอบ</li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.1.5</strong> ปลอมแปลงเอกสาร ลายมือชื่อ หรือลายมือชื่ออิเล็กทรอนิกส์ (รวมรหัสผ่าน/มาตรการยืนยันตัวตน) ของผู้อื่น</li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.1.6</strong> ให้/รับประโยชน์ หรือกระทำการแทนกัน/ยินยอมให้ผู้อื่นทำแทนโดยมิชอบ เช่น อยู่เวร รับผู้ป่วย เขียนรายงาน หรือ<strong>ลงชื่อเข้าร่วมกิจกรรมแทนกัน (ได้ U ทั้งผู้ฝากและผู้ทำแทน)</strong></li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.1.7</strong> คัดลอกผลงานของผู้อื่น</li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.1.8</strong> ไม่ปฏิบัติตนตามนโยบาย คำสั่ง กฎ ข้อบังคับ หรือข้อตกลงที่ได้มีการแจ้งหรือประกาศไว้แล้ว</li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.1.9</strong> กระทำการอื่น ๆ โดยมีเจตนาอันไม่ซื่อสัตย์</li>
            </ul>
          </div>

          <div class="or-card is-amber-tint" style="display:flex;flex-direction:column;gap:0.28cqw;height:100%">
            <div>
              <span class="or-card-kicker">ข้อ 2.2 · ขาดความเอาใจใส่ในการเรียนรู้ (2.2.3 &amp; 2.2.5 = U ร้ายแรง · ข้ออื่นพิจารณาให้ M)</span>
              <h3 class="or-card-title">หมวด 2.2 ขาดความเอาใจใส่ในการเรียนรู้ (2.2.1 – 2.2.9)</h3>
            </div>
            <ul class="or-clause-list">
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.2.1</strong> ลากิจส่วนตัวโดยไม่ได้รับอนุญาตล่วงหน้าและไม่มีเหตุผลอันสมควร</li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.2.2</strong> ลาป่วยโดยไม่แจ้งหรือไม่ส่งใบลาภายในวันแรกที่กลับมาปฏิบัติงานโดยไม่มีเหตุผลอันสมควร</li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.2.3</strong> <strong>ไม่ส่งใบรับรองแพทย์โดยไม่มีเหตุผลอันสมควร กรณีการลาป่วยตั้งแต่ 3 วันขึ้นไป</strong> <em>(ร้ายแรง ข้อ 3.2.1)</em></li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.2.4</strong> ขึ้นปฏิบัติงานหรือเข้าร่วมกิจกรรม<strong>สายเกิน 15 นาที</strong> ในงานผู้ป่วยหรือกิจกรรมการเรียนการสอนที่กำหนดว่าห้ามขาด โดยไม่ได้รับอนุญาต</li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.2.5</strong> <strong>ขาดปฏิบัติงานผู้ป่วย หรือขาดกิจกรรมการเรียนการสอนที่กำหนดว่าห้ามขาด</strong> โดยไม่ได้รับอนุญาต/ไม่มีเหตุผลอันสมควร <em>(ร้ายแรง ข้อ 3.2.1)</em></li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.2.6</strong> ส่งงานที่ได้รับมอบหมายล่าช้ากว่ากำหนดโดยไม่มีเหตุผลอันสมควร</li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.2.7</strong> ไม่ส่งงานที่ได้รับมอบหมายตามกำหนดโดยไม่มีเหตุผลอันสมควร</li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.2.8</strong> ขาดความระมัดระวัง ไม่รอบคอบ ประมาทเลินเล่อ ไม่เป็นระเบียบ จนเป็นเหตุให้เกิดอันตรายหรือความเสียหาย</li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.2.9</strong> เพิกเฉยไม่ให้ความร่วมมือทำกิจกรรมหรือการร่วมงานกับผู้อื่นในการทำงานที่ได้รับมอบหมาย</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "s13c-conduct-2567-c2b",
      num: "25",
      section: "evaluation",
      sectionLabel: "Act IV · ประกาศเจตคติ 67 (ข้อ 2.3–2.5)",
      actClass: "is-act-4",
      actLabel: "RAMA ATTITUDE RULES 2567 · CLAUSE 2.3–2.5",
      timeWindow: "ประกาศคณะฯ พ.ศ. 2567 (2/3)",
      kicker: "04 · RAMATHIBODI UNDESIRABLE BEHAVIOR CRITERIA B.E. 2567 · ข้อ 2 (หมวด 2.3 – 2.5)",
      title: "ประกาศคณะฯ พ.ศ. 2567: ข้อ 2.3 ความไม่เคารพ/ไม่เหมาะสม, ข้อ 2.4 ไม่ตระหนักรู้ตน และ ข้อ 2.5",
      keyTag: "ข้อ 2.3 – 2.5",
      keyMessageHtml:
        "ระวังสูงสุดในภาคสนามและสื่อออนไลน์: <strong>ข้อ <code>2.3.3</code> การเก็บ ใช้ หรือเปิดเผยข้อมูลส่วนบุคคลของผู้ป่วยในที่สาธารณะ/โซเชียลมีเดียโดยมิชอบ</strong> เป็นความผิดร้ายแรง <span class=\"or-mu-tag is-u\">U ทันที</span> ตามข้อ 3.2.1",
      notes:
        "ไล่เรียงประกาศคณะฯ พ.ศ. 2567 ต่อเนื่องครบถ้วน: ข้อ 2.3 พฤติกรรมที่แสดงถึงความไม่เคารพหรือไม่เหมาะสม (2.3.1–2.3.9 โดยเน้น 2.3.3 การละเมิดข้อมูลส่วนบุคคล/ความลับผู้ป่วยบนสื่อสาธารณะหรือโซเชียลมีเดีย ซึ่งเข้าข่ายความผิดร้ายแรงให้ U ทันทีตามข้อ 3.2.1), ข้อ 2.4 พฤติกรรมไม่ตระหนักรู้ตนเอง (2.4.1–2.4.5 เช่น หลีกเลี่ยงการรับ Feedback ต่อต้านไม่พัฒนาตนหลังได้รับคำเตือน หรือทำเกินขีดความสามารถจนเสี่ยงอันตราย) และข้อ 2.5 พฤติกรรมไม่พึงประสงค์อื่น ๆ ที่ผิดต่อคุณธรรม จริยธรรม หรือความเป็นมืออาชีพทางการแพทย์",
      render: () => `
        <div class="or-grid-2" data-fit-group="cards" style="height:100%">
          <div class="or-card is-white" style="display:flex;flex-direction:column;gap:0.26cqw;height:100%">
            <div>
              <span class="or-card-kicker">ข้อ 2.3 · ความไม่เคารพหรือไม่เหมาะสม (2.3.3 = U ร้ายแรง · ข้ออื่นพิจารณาให้ M)</span>
              <h3 class="or-card-title">หมวด 2.3 ความไม่เคารพหรือไม่เหมาะสม (2.3.1 – 2.3.9)</h3>
            </div>
            <ul class="or-clause-list">
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.3.1</strong> แต่งกายไม่สุภาพเรียบร้อยหรือผิดจากข้อบังคับ/ประกาศ/ระเบียบของ ม.มหิดล หรือคณะฯ</li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.3.2</strong> นำเครื่องแบบ/ชุดปฏิบัติงานของ รพ. หรือ รพ.สมทบ ที่ห้ามไว้ออกไปสวมใส่นอกพื้นที่ที่กำหนด</li>
              <li class="is-severe-u"><span class="or-mu-tag is-u">U</span><strong>2.3.3</strong> <strong>เก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคลของผู้ป่วย</strong> ในที่สาธารณะหรือสื่อสังคมออนไลน์โดยมิได้เป็นไปเพื่อการเรียนการสอน/ดูแลผู้ป่วย หรือละเมิดความลับผู้ป่วยโดยไม่รับความยินยอม <em>(ร้ายแรง ข้อ 3.2.1)</em></li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.3.4</strong> แสดงพฤติกรรมทางกายหรือวาจาไม่สุภาพ ส่อเสียด ดูถูก เหยียดหยาม ไม่ให้เกียรติผู้ป่วย เพื่อน หรือบุคลากร</li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.3.5</strong> มีพฤติกรรมในลักษณะคุกคามทางเพศด้วยวิธีการอย่างใดอย่างหนึ่ง</li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.3.6</strong> ใช้สื่อสังคมอย่างไม่เหมาะสม ไม่เคารพ คุกคามผู้อื่น หรืออาจทำให้เกิดความเสียหายต่อคณะฯ หรือ ม.มหิดล</li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.3.7</strong> มีพฤติกรรมไม่เหมาะสม อันแสดงถึงการรบกวนการเรียนการสอน</li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.3.8</strong> ล่วงละเมิดความเป็นส่วนตัว หรือสิทธิของผู้อื่น</li>
              <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.3.9</strong> มีพฤติกรรมกลั่นแกล้ง รังแก หรือการเลือกปฏิบัติ</li>
            </ul>
          </div>

          <div class="or-card is-navy-tint" style="display:flex;flex-direction:column;justify-content:space-between;gap:0.32cqw;height:100%">
            <div>
              <span class="or-card-kicker">ข้อ 2.4 · พฤติกรรมไม่ตระหนักรู้ตนเอง (2.4.1 – 2.4.5)</span>
              <h3 class="or-card-title">หมวด 2.4 ไม่ตระหนักรู้ตนเอง &amp; หมวด 2.5 อื่น ๆ</h3>
              <ul class="or-clause-list" style="margin-top:0.30cqw">
                <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.4.1</strong> หลีกเลี่ยงการรับข้อมูลป้อนกลับจากอาจารย์ เช่น หลีกเลี่ยงไม่มาตามที่อาจารย์นัดหมายโดยไม่มีเหตุผลอันสมควร</li>
                <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.4.2</strong> ขาดการตระหนักรู้ในพฤติกรรมไม่เหมาะสมของตนเอง</li>
                <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.4.3</strong> เพิกเฉยไม่สนใจความจำเป็นหรือความต้องการของผู้อื่น</li>
                <li class="is-warn-m"><span class="or-mu-tag is-m">M &rarr; U</span><strong>2.4.4</strong> ไม่ยอมรับ หรือต่อต้าน หรือไม่มีการพัฒนาตนเองหลังจากได้รับข้อมูลป้อนกลับหรือคำตักเตือน <em>(เข้าข่ายให้ U ตามข้อ 3.2.2!)</em></li>
                <li class="is-warn-m"><span class="or-mu-tag is-m">M</span><strong>2.4.5</strong> ทำเกินขอบเขตความสามารถของตนเอง ไม่ตระหนักถึงขีดจำกัดความสามารถ จนเกิดความเสี่ยงให้เกิดอันตรายหรือความเสียหาย</li>
              </ul>
            </div>

            <div class="or-card is-amber-tint" style="padding:0.44cqw 0.58cqw">
              <span class="or-card-kicker">ข้อ 2.5 · พฤติกรรมไม่พึงประสงค์อื่น ๆ</span>
              <p class="or-card-text"><strong>2.5</strong> พฤติกรรมไม่พึงประสงค์อื่น ๆ ที่<strong>คณะกรรมการรายวิชา หรือคณะกรรมการบริหารหลักสูตร</strong>เห็นสมควรว่าไม่เหมาะสม ผิดต่อคุณธรรม จริยธรรม หรือความเป็นมืออาชีพทางการแพทย์</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s13d-conduct-2567-mu-rules",
      num: "26",
      section: "evaluation",
      sectionLabel: "Act IV · ข้อ 3–6 & สรุป M vs U",
      actClass: "is-act-4",
      actLabel: "RAMA ATTITUDE RULES 2567 · CLAUSES 3–6 & M vs U",
      timeWindow: "ประกาศคณะฯ พ.ศ. 2567 (3/3)",
      kicker: "04 · CLAUSES 3–6 & DECISION SYNTHESIS: WHEN DO YOU GET 'M' vs 'U'?",
      title: "ประกาศคณะฯ พ.ศ. 2567 (ข้อ 3 – ข้อ 6) และสรุปชัด: จะได้ M เมื่อไหร่ · จะได้ U ก็ต่อเมื่ออะไรบ้าง",
      keyTag: "สรุปเกณฑ์ M vs U",
      keyMessageHtml:
        "<strong>ได้ <code>M</code> (ข้อ 3.2.3):</strong> ผิดข้อ 2 (นอกกลุ่มร้ายแรง) ครั้งแรก &nbsp;|&nbsp; <strong>ได้ <code>U</code> (ต้องลงทะเบียนใหม่!):</strong> ① ผิดร้ายแรง <code>2.1, 2.2.3, 2.2.5, 2.3.3</code> · ② ตักเตือนแล้วไม่ปรับปรุง · ③ เคยได้ <code>M</code> จากวิชาใด ๆ แล้วผิดซ้ำในกลุ่มข้อ 2 เดียวกัน",
      notes:
        "สรุปข้อ 3 ถึงข้อ 6 ของประกาศคณะฯ พ.ศ. 2567 จนครบทุกข้อ ได้แก่ ข้อ 3.1 ความหมายสัญลักษณ์ M/U/S, ข้อ 3.2 กระบวนการสอบข้อเท็จจริงและเกณฑ์ตัดสิน 3.2.1–3.2.3, ข้อ 3.3 พฤติกรรมนอกสถานที่/นอกเวลา/ในอดีตที่เพิ่งพบหลักฐาน (แก้ไขผลการศึกษาได้), ข้อ 4 มาตรการแก้ไขเพิ่มเติม 4.1–4.3, ข้อ 5 การดำเนินการทางวินัย ม.มหิดล ควบคู่ และข้อ 6 การบังคับใช้ทุกหลักสูตร พร้อมตารางสังเคราะห์ชัดเจนว่า นักศึกษาจะได้ M เมื่อไหร่ และจะได้ U ก็ต่อเมื่อเข้าเงื่อนไขใดใน 3 กรณีหลัก",
      render: () => `
        <div class="or-infog-split is-even" style="height:100%">
          <div class="or-card is-white" data-fit-solo="1" style="display:flex;flex-direction:column;justify-content:space-between;height:100%">
            <div>
              <span class="or-card-kicker">หลักเกณฑ์ข้อ 3 – ข้อ 6 ครบทุกข้อ (ประกาศคณะฯ 22 ต.ค. 2567)</span>
              <h3 class="or-card-title">กระบวนการพิจารณา มาตรการแก้ไข และการบังคับใช้</h3>
              <ul class="or-clause-list" style="margin-top:0.28cqw">
                <li><strong>ข้อ 3.1 สัญลักษณ์:</strong> <code>M</code> = คาบเส้น (Marginal) · <code>U</code> = ไม่พอใจ (Unsatisfactory) · <code>S</code> = พอใจ (Satisfactory)</li>
                <li><strong>ข้อ 3.2 ในรายวิชา:</strong> รายงานประธานรายวิชา &rarr; เรียกพบ นศพ. &rarr; ประชุมรายวิชาพิจารณาให้ <code>U</code> (<strong>3.2.1</strong> ร้ายแรง / <strong>3.2.2</strong> เตือนไม่แก้ หรือซ้ำกลุ่มเดิมหลังได้ M) หรือให้ <code>M</code> (<strong>3.2.3</strong> กรณีอื่น) แล้วเสนอมติต่อ<strong>คณะกรรมการบริหารหลักสูตร</strong>อนุมัติ</li>
                <li><strong>ข้อ 3.3 นอกสถานที่ / นอกเวลา / ในอดีตที่เพิ่งพบหลักฐาน:</strong> รายงานประธานกรรมการบริหารหลักสูตร นำเข้าที่ประชุมหลักสูตรเพื่อตัดสินหรือ<strong>แก้ไขผลการศึกษาในรายวิชาที่เกี่ยวข้องย้อนหลังได้</strong></li>
                <li><strong>ข้อ 4 มาตรการแก้ไขเพิ่มเติม:</strong> <strong>4.1</strong> ปฏิบัติงาน/ส่งงานเพิ่ม · <strong>4.2</strong> ชดเชยความเสียหาย/เยียวยา · <strong>4.3</strong> เข้ารับการอบรมปรับพฤติกรรม <em>(หากไม่ทำตาม &rarr; สอบสวนวินัย ม.มหิดล)</em></li>
                <li><strong>ข้อ 5 วินัยและจรรยาบรรณ:</strong> หากเข้าข่ายผิดวินัย/จรรยาบรรณ ม.มหิดล ให้ดำเนินการสอบสวนและลงโทษควบคู่กัน</li>
                <li><strong>ข้อ 6 การบังคับใช้:</strong> ใช้กับ นศพ. หลักสูตรแพทยศาสตรบัณฑิต รามาธิบดี <strong>ทุกหลักสูตรและโครงการร่วม</strong> (ตั้งแต่ปีการศึกษา 2568 เป็นต้นไป)</li>
              </ul>
            </div>
            <div class="or-spss-cta-row">
              <a class="or-spss-cta-btn is-primary" href="downloads/rama_attitude_criteria_2567.pdf" target="_blank" rel="noopener" data-open-attitude-pdf="1">📄 เปิดอ่านประกาศคณะฯ พ.ศ. 2567 ฉบับเต็ม (PDF)</a>
            </div>
          </div>

          <div class="or-stack-col" data-fit-group="cards" style="height:100%">
            <div class="or-card is-amber-tint is-vcenter">
              <span class="or-card-kicker">สรุปจับประเด็นที่ 1 · จะได้สัญลักษณ์ M (คาบเส้น) เมื่อไหร่?</span>
              <h3 class="or-card-title">ได้ <code>M</code> เมื่อทำผิดข้อ 2 (นอกกลุ่มร้ายแรง) ครั้งแรก [ข้อ 3.2.3]</h3>
              <ul class="or-list">
                <li>กระทำพฤติกรรมในข้อ 2 ที่<strong>ไม่ใช่ข้อร้ายแรง 3.2.1</strong> เป็นครั้งแรก เช่น <strong>ลากิจไม่ขออนุญาตล่วงหน้า (<code>2.2.1</code>)</strong>, <strong>ไม่ส่งใบลาป่วยวันแรกที่กลับ (<code>2.2.2</code>)</strong>, <strong>สายเกิน 15 นาที (<code>2.2.4</code>)</strong>, <strong>ส่งงานช้า/ไม่ส่งงาน (<code>2.2.6–2.2.7</code>)</strong>, <strong>เพิกเฉยงานกลุ่ม (<code>2.2.9</code>)</strong>, <strong>แต่งกาย/วาจา/โซเชียลไม่เหมาะสม (<code>2.3</code>)</strong> หรือ <strong>หลีกเลี่ยง Feedback (<code>2.4</code>)</strong></li>
                <li><em>ผลสำคัญของ <code>M</code>:</em> ประวัติ <code>M</code> จะถูกบันทึกไว้ หากทำผิดซ้ำในกลุ่มข้อ 2 เดียวกันในรายวิชาใด ๆ ภายหลัง จะกลายเป็น <strong><code>U</code></strong>!</li>
              </ul>
            </div>

            <div class="or-card is-rose-tint is-vcenter">
              <span class="or-card-kicker">สรุปจับประเด็นที่ 2 · จะได้สัญลักษณ์ U (ลงทะเบียนเรียนใหม่!) ก็ต่อเมื่ออะไรบ้าง?</span>
              <h3 class="or-card-title">ได้ <code>U</code> ทันทีเมื่อเข้าข้อใดข้อหนึ่งใน 3 กรณีนี้ [ข้อ 3.2.1 – 3.2.2]</h3>
              <ul class="or-list">
                <li><strong>1) ผิดร้ายแรงแม้ครั้งแรก (ข้อ 3.2.1):</strong> <strong>ข้อ <code>2.1</code> ไม่ซื่อสัตย์ทุกกรณี</strong> (ทุจริตสอบ, ข้อมูลเท็จ, เมคข้อมูลผู้ป่วย, ลอกงาน, ปลอมลายเซ็น, <strong>ฝากเช็คชื่อ/ทำแทนกันทั้งสองฝ่าย</strong>, ฝ่าฝืนกฎที่ประกาศแล้ว) · <strong><code>2.2.3</code></strong> ลาป่วย &ge; 3 วันไม่ส่งใบรับรองแพทย์ · <strong><code>2.2.5</code></strong> ขาดงานผู้ป่วย/คาบห้ามขาดโดยไม่ลา · <strong><code>2.3.3</code></strong> เปิดเผยข้อมูลผู้ป่วยในที่สาธารณะ/โซเชียล</li>
                <li><strong>2) ตักเตือนแล้วไม่ปรับปรุง (ข้อ 3.2.2 วรรคหนึ่ง):</strong> ได้รับคำตักเตือนแล้วยังไม่พัฒนา ไม่ปรับปรุง หรือไม่ยอมรับ</li>
                <li><strong>3) เคยได้ <code>M</code> แล้วผิดซ้ำกลุ่มเดิมข้ามวิชาได้ (ข้อ 3.2.2 วรรคสอง):</strong> เคยได้รับ <code>M</code> จาก<strong>รายวิชาใด ๆ</strong> แล้วทำผิดซ้ำใน<strong>พฤติกรรมกลุ่มเดียวกันตามข้อ 2</strong> (เช่น กลุ่ม <code>2.2</code> ซ้ำอีก)</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s15-osmu-criteria",
      num: "29",
      section: "evaluation",
      sectionLabel: "Act IV · เกณฑ์ O / S / M / U",
      actClass: "is-act-3",
      actLabel: "OFFICIAL CRITERIA · O · S · M · U",
      timeWindow: "09.26 – 09.28 น. (2 นาที)",
      kicker: "04 · SECTION 12–13 · ATTENDANCE, RAMA ATTITUDE RULES B.E. 2567 & FINAL GRADE O / S / M / U",
      title: "ชี้แจงเกณฑ์เวลาเรียน การประเมินด้านเจตคติ (พ.ศ. 2567) และเกณฑ์ตัดสิน O · S · M · U",
      keyTag: "หมายเหตุสำคัญ",
      keyMessageHtml:
        "ผลการประเมินเจตคติและพฤติกรรมได้ <strong><code>U</code> ต้องลงทะเบียนเรียนใหม่</strong> · การสอบซ่อมแยกวิชา [แต้ม <strong>&lt; 2.00</strong>] ให้โอกาสแก้ตัว <strong>1 ครั้ง</strong> (ผ่านได้เกรด <strong><code>S</code></strong> และ<strong>มีผลต่อการได้รับเกียรตินิยม</strong>)",
      notes:
        "ชี้แจงสรุปเกณฑ์ตามคู่มือรายวิชาหัวข้อเวลาเรียนและข้อ 13 การประเมินด้านเจตคติ: (1) เวลาเรียน ≥ ร้อยละ 80 จึงมีสิทธิ์เข้าสอบ ลาช่วงก่อน-หลังภาคสนาม ≤ 3 วัน (= คาบเช้า-บ่าย รวม 6 คาบที่เช็คชื่อ) ภาคสนาม ≤ 1.5 วัน (2) อ้างอิงประกาศคณะฯ เรื่องหลักเกณฑ์การประเมินเจตคติเกี่ยวกับพฤติกรรมที่ไม่พึงประสงค์ พ.ศ. 2567 (ข้อ 3.2.1–3.2.3) และใช้แบบประเมินจากเพื่อนในกลุ่มประกอบการพิจารณาของอาจารย์ (3) เกรดสุดท้ายได้ O มาจากเจตคติภาพรวม O + สอบทฤษฎีได้ O ทั้งสองวิชา + ไม่มีการสอบซ่อม (4) แต้มต่ำกว่า 2.00 ต้องสอบซ่อมแยกวิชาระบบฯ/ระบาดฯ โอกาสแก้ตัว 1 ครั้ง ผ่านได้เกรด S มีผลต่อเกียรตินิยม หากไม่ผ่านหรือเจตคติได้ U ต้องลงทะเบียนเรียนใหม่",
      render: () => `
        <div class="or-grid-2 is-s15-osmu-grid" data-fit-group="cards">
          <div class="or-card is-teal-tint">
            <span class="or-card-kicker">① เวลาเรียน · สิทธิ์เข้าสอบ &amp; โควตาการลา</span>
            <h3 class="or-card-title">เงื่อนไขเวลาเรียนไม่น้อยกว่าร้อยละ 80</h3>
            <ul class="or-list">
              <li><strong>สิทธิ์เข้าสอบ:</strong> นักศึกษาจะมีสิทธิ์เข้าสอบได้ต่อเมื่อมี <strong>เวลาเรียนไม่น้อยกว่าร้อยละ 80</strong></li>
              <li><strong>ช่วงก่อนและหลังภาคสนาม:</strong> ลาได้รวมกัน <strong>ไม่เกิน 3 วัน (= คาบเช้า–บ่าย รวม 6 คาบที่เช็คชื่อ)</strong></li>
              <li><strong>ช่วงฝึกภาคสนาม:</strong> ลาได้ <strong>ไม่เกิน 1.5 วัน</strong> (ยื่นใบลาและได้รับอนุมัติจากอาจารย์ที่ปรึกษา)</li>
            </ul>
          </div>

          <div class="or-card is-amber-tint">
            <span class="or-card-kicker">② ข้อ 13 การประเมินด้านเจตคติ · ประกาศคณะฯ พ.ศ. 2567</span>
            <h3 class="or-card-title">เกณฑ์ M / U ตามข้อ 3.2.1–3.2.3 &amp; เพื่อนประเมิน</h3>
            <ul class="or-list">
              <li><strong>แบบประเมินจากเพื่อนในกลุ่ม:</strong> เป็นข้อมูลประกอบการพิจารณาของอาจารย์ร่วมกับ <code>ฟอร์ม 1A &amp; 2A</code></li>
              <li><strong>ระดับ <code>M</code> (ข้อ 3.2.3):</strong> พฤติกรรมไม่พึงประสงค์ข้อ 2 อื่น ๆ ครั้งแรก เช่น สายเกิน 15 นาที (<code>2.2.4</code>), ส่งงานช้า/ไม่ส่ง (<code>2.2.6–7</code>), ลากิจไม่ขออนุญาตล่วงหน้า (<code>2.2.1</code>)</li>
              <li><strong>ระดับ <code>U</code> (ข้อ 3.2.1–3.2.2):</strong> ผิดร้ายแรง (<strong><code>2.1</code> ไม่ซื่อสัตย์ทุกข้อ · <code>2.2.3</code> ลาป่วย &ge; 3 วันไม่ส่งใบรับรองแพทย์ · <code>2.2.5</code> ขาดคาบห้ามขาดโดยไม่ลา · <code>2.3.3</code> เปิดเผยข้อมูลผู้ป่วย</strong>) หรือ<strong>ตักเตือนไม่ปรับปรุง</strong> หรือ<strong>เคยได้ <code>M</code> แล้วผิดซ้ำกลุ่มเดิม</strong></li>
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
      num: "29",
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
                  <tr><td><strong>1. สอบข้อเขียนระบาดวิทยา (EP1–9)</strong></td><td>อ. 8 ธ.ค. 69 (08.30–12.00 น.) · <code>2C2-02..03</code></td></tr>
                  <tr><td><strong>2. ส่งงานสะท้อนคิด SRN 1</strong> พร้อมประเมินภาคทฤษฎี</td><td>พ. 9 ธ.ค. 69 (ภายใน 17.00 น.) · E-learning</td></tr>
                  <tr><td><strong>3. สอบข้อเขียนระบบสุขภาพ (โน้ต A4)</strong></td><td>อ. 22 ธ.ค. 69 (08.30–12.00 น.) · <code>2C2-01..03</code></td></tr>
                  <tr><td><strong>4. นำเสนอผลงานทีม หมวดระบบสุขภาพ (3A)</strong></td><td>อ. 29 ธ.ค. 69 (08.30–15.30 น.) · <code>2C2-03</code></td></tr>
                  <tr><td><strong>5. นำเสนอผลงานทีม หมวดระบาดวิทยา (4A)</strong></td><td>พ. 30 ธ.ค. 69 (08.30–12.00 น.) · <code>2C2-03</code></td></tr>
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
      num: "30",
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
                <strong>1. Smart Portal:</strong> ตารางเรียนเฉพาะกลุ่ม ปฏิทิน <code>.ics</code> บทเรียนนำทาง 6 ขั้น ลิงก์ Zoom และระบบใบลา<br>
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
                <span class="or-card-kicker">② วันนี้ · 13.30 – 17.00 น. (ห้อง 2C2-03)</span>
                <p class="or-card-text"><strong>ร่วมเสวนาจากข้างเตียงสู่ระบบสุขภาพ สุขภาพโลก และการวิจัยระบบสุขภาพ</strong></p>
              </div>
              <div class="or-card is-white is-s15-step">
                <span class="or-card-kicker">③ เย็นวันนี้ · เตรียมตัวล่วงหน้าก่อนเข้าชั้นเรียนพรุ่งนี้</span>
                <p class="or-card-text"><strong>ศึกษาเอกสารและตอบคำถามนำ <code>HS1</code> ก่อนเข้าฟังบรรยายพรุ่งนี้ 08.30 น. และกลุ่มย่อย 09.40 น.</strong></p>
              </div>
              <div class="or-card is-white is-s15-step">
                <span class="or-card-kicker">④ พฤหัสบดี 26 พ.ย. · 13.30 – 17.00 น.</span>
                <p class="or-card-text"><strong>พบอาจารย์ที่ปรึกษาประจำกลุ่มโรงพยาบาลแหล่งฝึกทั้ง 9 แห่ง ในชั่วโมงกลุ่มย่อยครั้งที่ 1</strong></p>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "s18-closing-vdo-hss",
      num: "32",
      section: "action",
      sectionLabel: "Act IV · Closing VDO",
      actClass: "is-act-4",
      actLabel: "CLOSING VDO · FULLSCREEN + UNMUTE 5s",
      timeWindow: "ส่งต่อสู่คาบ ST1 · 06:53 นาที",
      kicker: "04 · INTRODUCTION TO HEALTH SYSTEMS SCIENCE · CLOSING BRIDGE VDO",
      title: "บทนำเข้าสู่วิทยาระบบสุขภาพ: Introduction to Health Systems Science (VDO)",
      keyTag: "Autoplay Fullscreen 5s",
      keyMessageHtml:
        "เมื่อเข้าสู่สไลด์สุดท้ายนี้ ระบบจะนับถอยหลัง <strong>5 วินาที</strong> แล้วขยายเต็มจอ (<strong>Full Screen + เปิดเสียง Unmute</strong>) เล่นวิดีโอ <strong>Introduction to Health Systems Science (06:53 นาที)</strong> อัตโนมัติ เพื่อส่งต่อสู่คาบ <code>ST1</code> เวลา <strong>09.30 น.</strong>",
      notes:
        "สไลด์ปิดท้ายคาบปฐมนิเทศ: เมื่อกด Next Slide เข้ามาที่สไลด์สุดท้ายนี้ ระบบจะนับถอยหลัง 5 วินาที แล้วขยายเต็มจอพร้อมเปิดเสียงบรรยาย (Full Screen + Unmuted) เล่นวิดีโอ Introduction to Health Systems Science (with Subtitle, ความยาว 6 นาที 53 วินาที) โดยอัตโนมัติ (สามารถกด Esc หรือปุ่มมุมขวาบนเพื่อย่อกลับมาหน้าสไลด์ได้ทุกเมื่อ)",
      render: () => {
        const isStaticExport =
          state.viewMode === "handout" ||
          Boolean(window.__RACM_EXPORTING_DECK) ||
          document.body.classList.contains("is-printing-orientation-deck");
        return `
          <div class="or-closing-vdo-split${closingVdoState.cinemaFull && !isStaticExport ? " is-cinema-full" : ""}" data-closing-vdo-split="1">
            <div class="or-closing-vdo-player-card${closingVdoState.fullscreenCinema && !isStaticExport ? " is-fullscreen-playing" : ""}" data-closing-vdo-card="1">
              ${
                isStaticExport
                  ? `<img class="or-closing-vdo-el" src="${CLOSING_VDO_POSTER}" alt="Introduction to Health Systems Science (Based on True Story)" loading="eager" decoding="async" />`
                  : `<video class="or-closing-vdo-el" data-closing-vdo-el="1" src="${CLOSING_VDO_SRC}" poster="${CLOSING_VDO_POSTER}" preload="auto" playsinline controls></video>
                     <button type="button" class="or-closing-vdo-fs-exit" data-vdo-action="exit-fs-cinema" title="ย่อกลับหน้าสไลด์ (Esc)">🔊 Full Screen · ✕ ย่อกลับสไลด์ (Esc)</button>
                     <button type="button" class="or-closing-vdo-unmute-float" data-vdo-action="unmute" hidden>🔇 คลิกเพื่อเปิดเสียงบรรยาย 🔊</button>
                     <div class="or-closing-vdo-countdown-overlay" data-closing-vdo-overlay="1">
                       <div class="or-closing-vdo-cd-box">
                         <div class="or-closing-vdo-cd-top">
                           <span class="or-closing-vdo-cd-pill">🎬 Full Screen + เสียง ใน <span data-closing-vdo-sec="1">5</span> วินาที</span>
                           <span class="or-closing-vdo-cd-sub">Introduction to Health Systems Science · 06:53 นาที</span>
                         </div>
                         <div class="or-closing-vdo-cd-bar">
                           <div class="or-closing-vdo-cd-bar-fill is-counting" data-closing-vdo-bar="1"></div>
                         </div>
                         <div class="or-closing-vdo-cd-actions">
                           <span class="or-closing-vdo-cd-sub">เล่นเต็มจอแบบเปิดเสียงอัตโนมัติหลังเปลี่ยนเข้าสไลด์ครบ 5 วินาที</span>
                           <div style="display:flex;gap:6px;flex-wrap:wrap">
                             <button type="button" class="or-closing-vdo-btn is-primary" data-vdo-action="play-now">▶ เล่นเต็มจอทันที</button>
                             <button type="button" class="or-closing-vdo-btn" data-vdo-action="cancel-autoplay">⏸ ยกเลิกนับถอยหลัง</button>
                           </div>
                         </div>
                       </div>
                     </div>`
              }
            </div>

            <div class="or-closing-vdo-side">
              <div class="or-card is-navy-tint" data-fit-solo="1" style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between">
                <div>
                  <span class="or-card-kicker">BASED ON A TRUE STORY · 06:53 MIN</span>
                  <h3 class="or-card-title">จากข้างเตียงผู้ป่วยสู่ “วิทยาระบบสุขภาพ”</h3>
                </div>
                <ul class="or-list">
                  <li><strong>1. เรื่องจริงจากข้างเตียง:</strong> ผู้ป่วยเบาหวานที่มีภาวะไตวายแทรกซ้อนและตารางนัดที่แยกส่วนกัน สะท้อนข้อจำกัดของการรักษาเฉพาะโรคตามลำพัง</li>
                  <li><strong>2. เสาหลักที่ 3 ของแพทยศาสตร์:</strong> เชื่อมโยง <code>Patient Safety</code>, <code>Quality Improvement</code> และการออกแบบระบบบริการรอบตัวผู้ป่วย</li>
                  <li><strong>3. สะพานสู่คาบ <code>ST1</code> (09.30 น.):</strong> เตรียมกรอบคิดเชิงระบบ (<code>Systems Thinking</code>) ก่อนเริ่มคาบเรียนแรกทันทีหลังจบวิดีโอ</li>
                </ul>
              </div>

              <div class="or-closing-vdo-status-bar">
                <div class="or-closing-vdo-status-txt" data-closing-vdo-status="1">${
                  isStaticExport
                    ? "🎬 วิดีโอแนะนำวิทยาระบบสุขภาพ (06:53 นาที · Autoplay 5s)"
                    : "⏳ นับถอยหลัง 5 วินาทีก่อนเล่นวิดีโออัตโนมัติ..."
                }</div>
                <div class="or-closing-vdo-ctrl-row">
                  <button type="button" class="or-closing-vdo-btn is-light-surface is-primary" data-vdo-action="toggle-play">▶ เล่น / พัก</button>
                  <button type="button" class="or-closing-vdo-btn is-light-surface" data-vdo-action="cinema-toggle">${
                    closingVdoState.cinemaFull ? "◫ แสดงแถบสรุป" : "⤢ ขยายเต็มสไลด์"
                  }</button>
                  <button type="button" class="or-closing-vdo-btn is-light-surface" data-vdo-action="fullscreen">⛶ เต็มจอ</button>
                  <a class="or-closing-vdo-btn is-light-surface" href="${CLOSING_VDO_DRIVE_URL}" target="_blank" rel="noopener">🔗 Drive ↗</a>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }
  ];

  SLIDES.forEach((s, i) => {
    s.num = String(i + 1).padStart(2, "0");
  });

  function countSlidesInSection(secId) {
    return SLIDES.filter((s) => s.section === secId).length;
  }

  const SECTION_FILTERS = [
    { id: "all", labelTh: `ทั้งหมด (${SLIDES.length})`, labelEn: `All Slides (${SLIDES.length})` },
    { id: "intro", labelTh: `เปิดเรื่องรายวิชา (${countSlidesInSection("intro")})`, labelEn: `Course Opening (${countSlidesInSection("intro")})` },
    { id: "objectives", labelTh: `Act I · รากฐานและเป้าหมาย (${countSlidesInSection("objectives")})`, labelEn: `Act I · Heritage & Why (${countSlidesInSection("objectives")})` },
    { id: "experience", labelTh: `Act II · ตารางเรียน & เส้นทางเรียนรู้ (${countSlidesInSection("experience")})`, labelEn: `Act II · Schedule & Journey (${countSlidesInSection("experience")})` },
    { id: "evaluation", labelTh: `Act III · วัดผลและเกณฑ์ O/S/M/U (${countSlidesInSection("evaluation")})`, labelEn: `Act III · Rubrics & O/S/M/U (${countSlidesInSection("evaluation")})` },
    { id: "action", labelTh: `Act IV · เวลาเรียน & ก้าวแรก (${countSlidesInSection("action")})`, labelEn: `Act IV · Conduct & Launch (${countSlidesInSection("action")})` }
  ];

  /* ---------- Per-Frame Binary-Search Auto-Fit Typography & Multi-Device Reflow ---------- */
  function isPhoneReflowMode() {
    const w = window.innerWidth || 1024;
    const h = window.innerHeight || 768;
    return w <= 700 && w <= h;
  }

  function isAutoHeightBox(el) {
    if (!el || el.clientHeight <= 0) return true;
    el.style.setProperty("--fit-scale", "0.70");
    const h1 = el.clientHeight;
    el.style.setProperty("--fit-scale", "1.45");
    const h2 = el.clientHeight;
    el.style.removeProperty("--fit-scale");
    return h2 - h1 > Math.max(16, h1 * 0.24);
  }

  function filterBoundedGroup(els) {
    if (!els.length) return [];
    els.forEach((el) => el.style.setProperty("--fit-scale", "0.70"));
    const h1 = els.map((el) => el.clientHeight);
    els.forEach((el) => el.style.setProperty("--fit-scale", "1.45"));
    const h2 = els.map((el) => el.clientHeight);
    els.forEach((el) => el.style.removeProperty("--fit-scale"));
    const bounded = [];
    for (let i = 0; i < els.length; i++) {
      if (els[i].clientHeight > 0 && h2[i] - h1[i] <= Math.max(16, h1[i] * 0.24)) {
        bounded.push(els[i]);
      }
    }
    return bounded;
  }

  function findMaxScaleForBox(el, checkFn, minS, maxS, safetyFactor) {
    let lo = minS;
    let hi = maxS;
    for (let step = 0; step < 14; step++) {
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
    const bounded = filterBoundedGroup(els);
    els.forEach((el) => {
      if (bounded.indexOf(el) === -1) el.style.removeProperty("--fit-scale");
    });
    if (!bounded.length) return;
    let lo = minS;
    let hi = maxS;
    for (let step = 0; step < 14; step++) {
      const mid = (lo + hi) * 0.5;
      for (let i = 0; i < bounded.length; i++) {
        bounded[i].style.setProperty("--fit-scale", mid.toFixed(4));
      }
      if (checkFn(bounded)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    const finalScale = Math.max(minS, lo * safetyFactor);
    for (let i = 0; i < bounded.length; i++) {
      bounded[i].style.setProperty("--fit-scale", finalScale.toFixed(4));
    }
  }

  function fitHarmonizedCardGroup(els, minS, maxS, safetyFactor, maxSiblingSpread) {
    if (!els.length) return;
    const bounded = filterBoundedGroup(els);
    els.forEach((el) => {
      if (bounded.indexOf(el) === -1) el.style.removeProperty("--fit-scale");
    });
    if (!bounded.length) return;
    const rawScales = bounded.map((el) => findMaxScaleForBox(el, boxesFitCleanly, minS, maxS, safetyFactor));
    const minGroupScale = Math.min.apply(null, rawScales);
    const cap = minGroupScale * (maxSiblingSpread || 1.28);
    for (let i = 0; i < bounded.length; i++) {
      const s = Math.min(rawScales[i], cap);
      bounded[i].style.setProperty("--fit-scale", s.toFixed(4));
    }
  }

  function singleBoxFitsCleanly(el) {
    if (el.clientHeight <= 0 || el.clientWidth <= 0) return true;
    if (el.scrollHeight > el.clientHeight + 1) return false;
    if (el.scrollWidth > el.clientWidth + 1) return false;

    const cs = window.getComputedStyle(el);
    const padT = parseFloat(cs.paddingTop) || 0;
    const padB = parseFloat(cs.paddingBottom) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const bT = parseFloat(cs.borderTopWidth) || 0;
    const bB = parseFloat(cs.borderBottomWidth) || 0;
    const bR = parseFloat(cs.borderRightWidth) || 0;
    const r = el.getBoundingClientRect();
    const innerTop = r.top + bT + padT - 1.25;
    const innerBot = r.bottom - bB - padB + 1.25;
    const innerRight = r.right - bR - padR + 1.5;

    const kids = el.children;
    for (let k = 0; k < kids.length; k++) {
      const kid = kids[k];
      const kcs = window.getComputedStyle(kid);
      if (kcs.display === "none" || kcs.position === "absolute") continue;
      const kr = kid.getBoundingClientRect();
      if (kr.height <= 0 && kr.width <= 0) continue;
      if (kr.top < innerTop || kr.bottom > innerBot || kr.right > innerRight) {
        return false;
      }
    }
    const miniWrap = el.querySelector(".or-spec-mini-table-wrap");
    if (miniWrap && (miniWrap.scrollHeight > miniWrap.clientHeight + 1 || miniWrap.scrollWidth > miniWrap.clientWidth + 1)) {
      return false;
    }
    return true;
  }

  function boxesFitCleanly(els) {
    for (let i = 0; i < els.length; i++) {
      if (!singleBoxFitsCleanly(els[i])) return false;
    }
    return true;
  }

  function tablesFitCleanly(wraps) {
    for (let i = 0; i < wraps.length; i++) {
      const w = wraps[i];
      const tbl = w.querySelector(".or-table");
      if (!tbl || w.clientHeight <= 0 || w.clientWidth <= 0) continue;
      if (tbl.offsetHeight > w.clientHeight + 1) return false;
      if (w.scrollHeight > w.clientHeight + 1) return false;
      if (tbl.scrollWidth > w.clientWidth + 1) return false;
      if (tbl.classList.contains("or-sched-matrix")) {
        const cells = tbl.querySelectorAll("th, td");
        for (let c = 0; c < cells.length; c++) {
          const cell = cells[c];
          if (cell.clientWidth > 0 && cell.scrollWidth > cell.clientWidth + 2) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function verifyPostMeasureFit(els, checkSingleFn, minS) {
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const curStr = el.style.getPropertyValue("--fit-scale");
      if (!curStr) continue;
      let s = parseFloat(curStr);
      if (!Number.isFinite(s)) continue;
      for (let guard = 0; guard < 6; guard++) {
        if (checkSingleFn(el)) break;
        s = Math.max(minS, s * 0.96);
        el.style.setProperty("--fit-scale", s.toFixed(4));
      }
    }
  }

  const THAI_COMPOUND_RE = new RegExp(
    "(" +
      [
        "ศาสตร์วิทยาระบบสุขภาพ",
        "วิทยาศาสตร์ระบบสุขภาพ",
        "สหสาขาวิชาชีพ",
        "สหวิชาชีพ",
        "เวชศาสตร์ชุมชน",
        "เวชศาสตร์ครอบครัว",
        "อาชีวเวชศาสตร์",
        "แพทยศาสตรศึกษา",
        "แพทยศาสตร์",
        "เวชปฏิบัติ",
        "หลักประกันสุขภาพ",
        "ปัจจัยกำหนดสุขภาพ",
        "สร้างเสริมสุขภาพ",
        "บริการสุขภาพ",
        "สุขภาพประชากร",
        "สุขภาพดาวเคราะห์",
        "สุขภาพโลก",
        "สุขภาพจิต",
        "ระบบสุขภาพ",
        "สาธารณสุข",
        "สุขภาวะ",
        "ระบาดวิทยา",
        "เศรษฐศาสตร์",
        "สารสนเทศ",
        "ภูมิปัญญา",
        "จริยธรรม",
        "วิชาชีพ",
        "สมรรถนะ",
        "เจตคติ",
        "เกียรตินิยม",
        "พฤติกรรม",
        "ปฐมภูมิ",
        "ทุติยภูมิ",
        "ตติยภูมิ",
        "โรงพยาบาล",
        "คลินิก",
        "ผู้ป่วย",
        "ครอบครัว",
        "ประชากร",
        "ประชาชน",
        "นักศึกษาแพทย์",
        "นักศึกษา",
        "คณาจารย์",
        "เพื่อนร่วมทีม",
        "เพื่อนร่วมกลุ่ม",
        "ภาคสนาม",
        "ภาคทฤษฎี",
        "ภาคปฏิบัติ",
        "ห้องฉุกเฉิน",
        "โรคเรื้อรัง",
        "โรคเฉียบพลัน",
        "ภาวะแทรกซ้อน",
        "องค์ประกอบ",
        "องค์ความรู้",
        "องค์รวม",
        "กระบวนการ",
        "โครงสร้าง",
        "ความสัมพันธ์",
        "ความเหลื่อมล้ำ",
        "ความเป็นธรรม",
        "ความปลอดภัย",
        "ความรับผิดชอบ",
        "ความซื่อสัตย์",
        "ความไม่แน่นอน",
        "ประสานงาน",
        "อย่างบูรณาการ",
        "บูรณาการ",
        "จุดคานงัด",
        "หลักประกันฯ",
        "ปฏิบัติการ",
        "ต่อยอด",
        "ปิดจบ",
        "สังเคราะห์",
        "วิเคราะห์",
        "ประเมินผล",
        "วินิจฉัย",
        "อภิปราย",
        "กลุ่มย่อย",
        "การเรียนรู้",
        "เรียนรู้",
        "นำเสนอ",
        "ได้จริง",
        "ระบาดฯ",
        "แหล่งฝึก",
        "ข้างเตียง",
        "ต่อเนื่อง",
        "แม่นยำ",
        "ขาดช่วง",
        "ป่วยซ้ำ",
        "ส่งต่อ",
        "รองรับ",
        "ประคอง",
        "เกื้อหนุน",
        "เชื่อมโยง",
        "สอดประสาน",
        "เปลี่ยนแปลง",
        "สะท้อนคิด",
        "ยั่งยืน",
        "รอบด้าน",
        "ครบถ้วน",
        "ครบวงจร",
        "คุ้มค่า",
        "รายบุคคล",
        "รายวิชา",
        "หลักสูตร",
        "สอบซ่อม",
        "ลงทะเบียน",
        "จัดวางใหม่",
        "ทุกมิติ",
        "\\d+(?:\\.\\d+)?\\s*(?:นาที|ชั่วโมง|ชม\\.|วัน|คืน|สัปดาห์|ครั้ง|แห่ง|ห้อง|ด้าน|ข้อ|คน|ท่าน|แผ่น|หน้า|รายการ|หมวด|ขั้นตอน|ระดับ)"
      ].join("|") +
      ")",
    "g"
  );

  function protectThaiCompounds(rootEl) {
    if (!rootEl || rootEl.getAttribute("data-thai-protected") === "1") return;
    rootEl.setAttribute("data-thai-protected", "1");
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let curNode;
    while ((curNode = walker.nextNode())) {
      const val = curNode.nodeValue;
      if (!val || val.length < 3) continue;
      const p = curNode.parentElement;
      if (!p) continue;
      const tag = p.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "CODE" || tag === "KBD" || tag === "PRE" || tag === "SVG") continue;
      if (p.closest(".or-nw, .or-num-keep, code, kbd, svg")) continue;
      THAI_COMPOUND_RE.lastIndex = 0;
      if (THAI_COMPOUND_RE.test(val)) {
        nodes.push(curNode);
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      const tn = nodes[i];
      const text = tn.nodeValue || "";
      THAI_COMPOUND_RE.lastIndex = 0;
      let lastIdx = 0;
      let match;
      const frag = document.createDocumentFragment();
      while ((match = THAI_COMPOUND_RE.exec(text)) !== null) {
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        }
        const sp = document.createElement("span");
        sp.className = "or-nw";
        sp.textContent = match[0];
        frag.appendChild(sp);
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }
      if (tn.parentNode) {
        tn.parentNode.replaceChild(frag, tn);
      }
    }
  }

  function fitSingleSlideCanvas(canvas) {
    if (!canvas || canvas.classList.contains("is-live-canvas")) {
      return;
    }
    protectThaiCompounds(canvas);
    const allScaled = Array.from(
      canvas.querySelectorAll(
        ".or-card, .or-visual-pillar-copy, .or-table-wrap, .or-schematic-box, .or-cover-kpi, .or-cover-act-chip"
      )
    );
    if (isPhoneReflowMode() && !document.body.classList.contains("is-printing-orientation-deck")) {
      allScaled.forEach((el) => el.style.removeProperty("--fit-scale"));
      canvas._lastFitSig = "";
      return;
    }
    if (canvas.clientWidth < 120 || canvas.clientHeight < 80) return;

    const s02Grid = canvas.querySelector(".or-s02-3fig-grid");
    const pipeStage = canvas.querySelector(".or-top-fig-stack.is-pipe-zoom-stage");
    const heroStage = canvas.querySelector(".or-top-fig-stack.is-hero-reveal-stage");
    const s09Stage = canvas.querySelector(".or-s09-stage-wrap");
    const focusKey = s02Grid
      ? s02Grid.getAttribute("data-s02-focus") || "0"
      : pipeStage
        ? "pipe:" + (pipeStage.getAttribute("data-pipe-focus") || "0")
        : heroStage
          ? "hero:" + (heroStage.getAttribute("data-hero-reveal") || "1")
          : s09Stage
            ? "s09:" + (s09Stage.getAttribute("data-s09-site-focus") || "0")
            : "";
    const printKey = document.body.classList.contains("is-printing-orientation-deck") ? "P" : "S";
    const fitSig = `${canvas.clientWidth}x${canvas.clientHeight}:${focusKey}:${printKey}`;
    if (canvas._lastFitSig === fitSig) return;
    canvas._lastFitSig = fitSig;

    if (canvas.querySelector(".or-s09-live-site-stage")) {
      return;
    }

    canvas.setAttribute("data-measuring", "1");

    // 1. Cover Slide KPI tiles & Act chips
    if (canvas.classList.contains("is-cover-canvas")) {
      const kpis = Array.from(canvas.querySelectorAll(".or-cover-kpi"));
      if (kpis.length) binarySearchUniformScale(kpis, boxesFitCleanly, 0.48, 1.85, 0.95);
      const acts = Array.from(canvas.querySelectorAll(".or-cover-act-chip"));
      if (acts.length) fitHarmonizedCardGroup(acts, 0.48, 1.95, 0.95, 1.18);
      canvas.removeAttribute("data-measuring");
      verifyPostMeasureFit(kpis.concat(acts), singleBoxFitsCleanly, 0.45);
      return;
    }

    // 2. Harmonized Card Groups (fills each frame ~88%-95% while keeping sibling fonts cohesive!)
    canvas.querySelectorAll("[data-fit-group]").forEach((grp) => {
      const kind = grp.getAttribute("data-fit-group");
      let targets = [];
      let spread = 1.28;
      if (kind === "pillars") {
        targets = Array.from(grp.querySelectorAll(":scope > .or-visual-pillar-card > .or-visual-pillar-copy"));
        spread = 1.28;
      } else if (kind === "s02-takeaways") {
        targets = Array.from(grp.querySelectorAll(":scope > .or-s02-flow-card > .or-s02-takeaway-box")).filter(
          (el) => el.clientHeight > 0 && el.offsetParent !== null
        );
        spread = 1.34;
      } else if (kind === "pipe-cards") {
        targets = Array.from(grp.querySelectorAll(":scope > .or-card")).filter(
          (el) => el.clientHeight > 0 && el.offsetParent !== null
        );
        spread = 1.32;
        if (targets.length === 1) {
          fitHarmonizedCardGroup(targets, 0.45, 1.82, 0.95, 1.0);
          return;
        }
      } else {
        targets = Array.from(grp.querySelectorAll(":scope > .or-card"));
        spread = 1.28;
      }
      if (targets.length) {
        fitHarmonizedCardGroup(targets, 0.45, 2.50, 0.96, spread);
      }
    });

    // 3. Standalone Fixed-Track Boxes
    canvas.querySelectorAll("[data-fit-solo]").forEach((box) => {
      if (isAutoHeightBox(box)) {
        box.style.removeProperty("--fit-scale");
        return;
      }
      const s = findMaxScaleForBox(box, boxesFitCleanly, 0.45, 2.45, 0.95);
      box.style.setProperty("--fit-scale", s.toFixed(4));
    });

    // 4. Full-Space Tables (Slides 09, 10, 13)
    const tableWraps = Array.from(canvas.querySelectorAll("[data-fit-table]"));
    tableWraps.forEach((tw) => {
      if (isAutoHeightBox(tw)) {
        tw.style.removeProperty("--fit-scale");
        return;
      }
      const s = findMaxScaleForBox(tw, tablesFitCleanly, 0.45, 2.15, 0.965);
      tw.style.setProperty("--fit-scale", s.toFixed(4));
    });

    canvas.removeAttribute("data-measuring");

    // 5. Post-layout subpixel safety check after centering / space-between is restored
    const nonTableBoxes = allScaled.filter((el) => !el.hasAttribute("data-fit-table"));
    verifyPostMeasureFit(nonTableBoxes, singleBoxFitsCleanly, 0.44);
    verifyPostMeasureFit(tableWraps, (tw) => tablesFitCleanly([tw]), 0.44);
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
      if (img.closest && img.closest("[data-prem-stage]")) return;
      if (!img.complete) {
        img.addEventListener(
          "load",
          () => {
            const c = img.closest && img.closest(".or-slide-canvas");
            if (c) c._lastFitSig = "";
            scheduleFitOnResize();
          },
          { once: true }
        );
      }
    });
  }

  function formatTimer(sec) {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")} / 60:00`;
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
    if (
      !rootEl ||
      state.viewMode !== "deck" ||
      window.__RACM_EXPORTING_DECK ||
      document.body.classList.contains("is-printing-orientation-deck")
    ) {
      return;
    }
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
              <div class="or-cover-act-chip"><strong>Act I · Why HSS</strong><span>เสาหลักที่ 3 และวัตถุประสงค์ระบบสุขภาพทั้ง 5 ด้าน</span></div>
              <div class="or-cover-act-chip"><strong>Act II · Journey</strong><span>เส้นทางเรียนรู้ 6 สัปดาห์ ณ โรงพยาบาลแหล่งฝึก 9 แห่ง</span></div>
              <div class="or-cover-act-chip"><strong>Act III · Mastery</strong><span>การประเมินผลตามสมรรถนะหลัก 5 ด้าน</span></div>
              <div class="or-cover-act-chip"><strong>Act IV · Launch</strong><span>แนวปฏิบัติความปลอดภัย 6 ข้อ และก้าวแรกสัปดาห์ที่ 1</span></div>
            </div>
          </div>

          <div class="or-cover-right-col is-aura-stage">
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
          <span class="or-cover-code-chip">${SLIDES.length} Slides · 16:9</span>
        </div>
      </div>
    `;
  }

  function renderSingleSlideCanvasHtml(slide, idx, animateDeck) {
    const dirCls = animateDeck ? (state.transitionDir === "prev" ? " is-dir-prev" : " is-dir-next") : "";
    const animCls = animateDeck ? " is-keynote-animated" + dirCls : "";
    const ioTheme = getEffectiveIoTheme();
    if (slide.isCover) {
      return `
        <article class="or-slide-canvas is-io-pitch is-cover-canvas${animCls}" data-io-theme="${ioTheme}" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
          ${renderCoverSlideHtml(slide)}
        </article>
      `;
    }
    return `
      <article class="or-slide-canvas is-io-pitch${slide.isLiveQuizSlide || slide.isLiveLobbySlide ? " is-quiz-slide-canvas" : ""}${animCls}" data-io-theme="${ioTheme}" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
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

    modal.addEventListener("mousemove", (ev) => {
      if (!state.isOpen || modal.hidden) return;
      if (state.clickerStage) {
        const nearEdge = ev.clientY <= 76 || ev.clientY >= window.innerHeight - 76;
        if (nearEdge || !state.hudIdle) {
          wakeHud();
        }
      } else if (state.presentationMode) {
        wakeHud();
      }
    });

    modal.addEventListener("click", (ev) => {
      if (state.blackoutActive && !ev.target.closest(".or-blackout-card button")) {
        state.blackoutActive = false;
        renderModal();
        return;
      }
      if (state.clickerGuideOpen && ev.target.classList && ev.target.classList.contains("or-clicker-guide-backdrop")) {
        state.clickerGuideOpen = false;
        renderModal();
        return;
      }
      if (ev.target === modal && !state.presentationMode && !state.clickerStage) {
        closeDeck();
        return;
      }
      if (state.toolsMenuOpen && !ev.target.closest(".or-tools-menu-wrap")) {
        state.toolsMenuOpen = false;
        const pop = modal.querySelector(".or-tools-popover");
        if (pop) pop.hidden = true;
      }
      // Click-anywhere stage advance in Keynote Clicker / Presentation mode (zero mouse button hunting!)
      if (
        (state.clickerStage || state.presentationMode) &&
        state.viewMode === "deck" &&
        Math.abs((state.zoomScale || 1) - 1) < 0.04
      ) {
        const curSlide = SLIDES[state.slideIdx];
        const inInteractive =
          ev.target &&
          ev.target.closest &&
          ev.target.closest(
            "button, a, video, input, select, textarea, label, .or-deck-topbar, .or-deck-bottombar, .or-notes-dock, .or-tools-popover, .or-clicker-guide-sheet, .orl-cover-card, .orl-s14-quiz-wrap, .or-prem-tile, [data-prem-ctrl], [data-map-site], [data-s09-jump-site], [data-open-spss-deck], [data-open-attitude-pdf], .fm-tab, .fm-token, .th-map-pin-group, .or-closing-vdo-player-card, .or-closing-vdo-status-bar, [data-vdo-action]"
          );
        if (!inInteractive && !(curSlide && (curSlide.isLiveQuizSlide || curSlide.isLiveLobbySlide))) {
          const vpRect = modal.getBoundingClientRect();
          const relX = (ev.clientX - vpRect.left) / Math.max(1, vpRect.width);
          state.autoPlay = false;
          if (relX <= 0.22) {
            stepSlide(-1);
          } else {
            stepSlide(1);
          }
          return;
        }
      }
      // Keep focus off toolbar <button>s so follow-up Space / Enter on wireless clicker or keyboard always advances slides!
      const clickedBtn = ev.target && ev.target.closest && ev.target.closest("button");
      if (clickedBtn && typeof clickedBtn.blur === "function") {
        setTimeout(() => {
          if (document.activeElement === clickedBtn) clickedBtn.blur();
        }, 0);
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
          if (dx < 0) {
            stepSlide(1);
          } else if (dx > 0) {
            stepSlide(-1);
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

    // Capture-phase Hardware Wireless Clicker, Apple TV Remote & Keynote Pitch Keyboard Engine
    window.addEventListener(
      "keydown",
      (ev) => {
        if (!state.isOpen || modal.hidden) return;
        if (ev.ctrlKey || ev.metaKey || ev.altKey) return;

        const pdfPrev = document.getElementById("gdrivePdfPreviewModal");
        if (pdfPrev && !pdfPrev.hidden) return;

        const tag = (ev.target && ev.target.tagName) || "";
        const isTextInput =
          tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(ev.target && ev.target.isContentEditable);
        if (isTextInput) return;

        if (tag === "BUTTON" && ev.target && modal.contains(ev.target)) {
          if (
            [
              " ",
              "Enter",
              "PageDown",
              "PageUp",
              "ArrowRight",
              "ArrowLeft",
              "ArrowDown",
              "ArrowUp"
            ].includes(ev.key)
          ) {
            try {
              ev.target.blur();
            } catch (_) {}
          }
        }

        if (state.blackoutActive) {
          ev.preventDefault();
          ev.stopPropagation();
          state.blackoutActive = false;
          flashStepToast();
          renderModal();
          return;
        }

        if (state.clickerGuideOpen && (ev.key === "Escape" || ev.key === "?")) {
          ev.preventDefault();
          ev.stopPropagation();
          state.clickerGuideOpen = false;
          renderModal();
          return;
        }

        if (ev.key === "Escape") {
          ev.preventDefault();
          ev.stopPropagation();
          if (closingVdoState.fullscreenCinema) {
            exitClosingVdoFullscreenCinema(modal);
          } else if (state.jumpDigits) {
            clearJumpBuffer();
            renderModal();
          } else if (state.toolsMenuOpen) {
            state.toolsMenuOpen = false;
            renderModal();
          } else if (state.clickerStage || state.presentationMode) {
            exitPresentationMode();
          } else {
            closeDeck();
          }
          return;
        }

        if (ev.key === "F5" || ev.key === "c" || ev.key === "C") {
          ev.preventDefault();
          ev.stopPropagation();
          toggleClickerStage();
          return;
        }

        if (ev.key === "." || ev.key === "b" || ev.key === "B") {
          if (state.viewMode === "deck") {
            ev.preventDefault();
            ev.stopPropagation();
            toggleBlackout();
            return;
          }
        }

        if (/^[0-9]$/.test(ev.key) && state.viewMode === "deck") {
          if (ev.key === "0" && !state.jumpDigits && Math.abs((state.zoomScale || 1) - 1) > 0.04) {
            ev.preventDefault();
            ev.stopPropagation();
            setZoomScale(1);
            return;
          }
          if (ev.key !== "0" || state.jumpDigits.length > 0) {
            ev.preventDefault();
            ev.stopPropagation();
            pushJumpDigit(ev.key);
            return;
          }
        }

        const isNextKey =
          ev.key === "PageDown" ||
          ev.key === "ArrowRight" ||
          ev.key === "ArrowDown" ||
          ev.key === " " ||
          ev.key === "Enter" ||
          ev.key === "MediaTrackNext" ||
          ev.key === "BrowserForward";

        const isPrevKey =
          ev.key === "PageUp" ||
          ev.key === "ArrowLeft" ||
          ev.key === "ArrowUp" ||
          ev.key === "Backspace" ||
          ev.key === "MediaTrackPrevious" ||
          ev.key === "BrowserBack";

        if (ev.key === "Enter" && state.jumpDigits && state.viewMode === "deck") {
          ev.preventDefault();
          ev.stopPropagation();
          commitJumpBuffer();
          return;
        }

        if (isNextKey && state.viewMode === "deck") {
          ev.preventDefault();
          ev.stopPropagation();
          state.autoPlay = false;
          const curSlide = SLIDES[state.slideIdx];
          if (curSlide && curSlide.id === "s18-closing-vdo-hss") {
            handleClosingVdoClickerAction();
            return;
          }
          stepSlide(1);
          return;
        }

        if (isPrevKey && state.viewMode === "deck") {
          ev.preventDefault();
          ev.stopPropagation();
          state.autoPlay = false;
          if (ev.key === "Backspace" && state.jumpDigits) {
            state.jumpDigits = state.jumpDigits.slice(0, -1);
            renderModal();
            return;
          }
          stepSlide(-1);
          return;
        }

        if (ev.key === "Home" && state.viewMode === "deck") {
          ev.preventDefault();
          ev.stopPropagation();
          state.autoPlay = false;
          goToSlide(0);
        } else if (ev.key === "End" && state.viewMode === "deck") {
          ev.preventDefault();
          ev.stopPropagation();
          state.autoPlay = false;
          goToSlide(SLIDES.length - 1);
        } else if (ev.key === "p" || ev.key === "P") {
          ev.preventDefault();
          ev.stopPropagation();
          toggleAutoPlay();
        } else if (ev.key === "f" || ev.key === "F") {
          ev.preventDefault();
          ev.stopPropagation();
          togglePresentationMode();
        } else if (ev.key === "h" || ev.key === "H") {
          ev.preventDefault();
          ev.stopPropagation();
          state.hudIdle = !state.hudIdle;
          modal.classList.toggle("is-hud-idle", state.hudIdle);
        } else if (ev.key === "?") {
          ev.preventDefault();
          ev.stopPropagation();
          state.clickerGuideOpen = !state.clickerGuideOpen;
          renderModal();
        } else if (ev.key === "g" || ev.key === "G") {
          ev.preventDefault();
          ev.stopPropagation();
          state.autoPlay = false;
          state.viewMode = state.viewMode === "sorter" ? "deck" : "sorter";
          renderModal();
        } else if (ev.key === "n" || ev.key === "N") {
          ev.preventDefault();
          ev.stopPropagation();
          state.showNotes = !state.showNotes;
          renderModal();
        } else if (ev.key === "l" || ev.key === "L") {
          ev.preventDefault();
          ev.stopPropagation();
          state.laserActive = !state.laserActive;
          renderModal();
        } else if (ev.key === "t" || ev.key === "T") {
          ev.preventDefault();
          ev.stopPropagation();
          toggleIoStageTheme();
        } else if (ev.key === "+" || ev.key === "=") {
          ev.preventDefault();
          ev.stopPropagation();
          setZoomScale((state.zoomScale || 1) + 0.25);
        } else if (ev.key === "-" || ev.key === "_") {
          ev.preventDefault();
          ev.stopPropagation();
          setZoomScale((state.zoomScale || 1) - 0.25);
        } else if (ev.key === "0") {
          ev.preventDefault();
          ev.stopPropagation();
          setZoomScale(1);
        }
      },
      true
    );

    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && (state.presentationMode || state.clickerStage)) {
        state.presentationMode = false;
        state.clickerStage = false;
        state.hudIdle = false;
        clearHudIdleTimer();
        modal.classList.remove("is-presentation-mode", "is-clicker-stage", "is-hud-idle");
        renderModal();
      }
    });

    return modal;
  }

  function clearHudIdleTimer() {
    if (state.hudIdleTimer) {
      clearTimeout(state.hudIdleTimer);
      state.hudIdleTimer = 0;
    }
  }

  function armHudIdleTimer() {
    clearHudIdleTimer();
    if (!state.isOpen || (!state.clickerStage && !state.presentationMode) || state.viewMode !== "deck" || state.toolsMenuOpen || state.clickerGuideOpen) {
      state.hudIdle = false;
      const m = document.getElementById("orientationDeckModal");
      if (m) m.classList.remove("is-hud-idle");
      return;
    }
    state.hudIdleTimer = setTimeout(() => {
      if (!state.isOpen || (!state.clickerStage && !state.presentationMode) || state.viewMode !== "deck" || state.toolsMenuOpen || state.clickerGuideOpen) return;
      state.hudIdle = true;
      const m = document.getElementById("orientationDeckModal");
      if (m) m.classList.add("is-hud-idle");
    }, CLICKER_HUD_IDLE_MS);
  }

  function wakeHud() {
    state.hudIdle = false;
    const m = document.getElementById("orientationDeckModal");
    if (m) m.classList.remove("is-hud-idle");
    armHudIdleTimer();
  }

  function flashStepToast() {
    state.stepToastActive = true;
    if (state.stepToastTimer) clearTimeout(state.stepToastTimer);
    state.stepToastTimer = setTimeout(() => {
      state.stepToastActive = false;
      const pill = document.getElementById("orClickerCornerHud");
      if (pill) pill.classList.remove("is-visible");
    }, 1850);
  }

  function clearJumpBuffer() {
    state.jumpDigits = "";
    if (state.jumpTimer) {
      clearTimeout(state.jumpTimer);
      state.jumpTimer = 0;
    }
  }

  function pushJumpDigit(d) {
    const next = (state.jumpDigits + d).slice(-2);
    state.jumpDigits = next;
    if (state.jumpTimer) clearTimeout(state.jumpTimer);
    state.jumpTimer = setTimeout(() => {
      commitJumpBuffer();
    }, 1150);
    renderModal();
  }

  function commitJumpBuffer() {
    if (!state.jumpDigits) return;
    const num = parseInt(state.jumpDigits, 10);
    clearJumpBuffer();
    if (Number.isFinite(num) && num >= 1 && num <= SLIDES.length) {
      goToSlide(num - 1);
    } else {
      renderModal();
    }
  }

  function toggleBlackout() {
    state.blackoutActive = !state.blackoutActive;
    state.toolsMenuOpen = false;
    renderModal();
  }

  function toggleClickerStage() {
    const modal = ensureModalElement();
    state.toolsMenuOpen = false;
    state.clickerGuideOpen = false;
    if (!state.clickerStage) {
      clearHudIdleTimer();
      state.viewMode = "deck";
      state.clickerStage = true;
      state.presentationMode = true;
      state.showNotes = false;
      state.hudIdle = true;
      modal.classList.add("is-presentation-mode", "is-clicker-stage", "is-hud-idle");
      if (modal.requestFullscreen) {
        modal.requestFullscreen().catch(() => {});
      }
      flashStepToast();
      renderModal();
    } else {
      exitPresentationMode();
    }
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
    state.clickerGuideOpen = false;
    state.blackoutActive = false;
    clearAutoPlayTimer();
    const prevMode = state.viewMode;
    state.viewMode = "handout";
    document.body.classList.add("is-printing-orientation-deck");

    let pageRule = document.getElementById("orWidescreenPrintRule");
    if (!pageRule) {
      pageRule = document.createElement("style");
      pageRule.id = "orWidescreenPrintRule";
      document.head.appendChild(pageRule);
    }
    pageRule.textContent = `
      @page { size: 13.333in 7.5in !important; margin: 0 !important; }
      @media print {
        html, body {
          width: 13.333in !important;
          height: 7.5in !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body.is-printing-orientation-deck .or-slide-canvas {
          width: 13.333in !important;
          height: 7.5in !important;
          max-width: 13.333in !important;
          max-height: 7.5in !important;
          margin: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          break-after: page;
          page-break-after: always;
        }
        body.is-printing-orientation-deck .or-slide-canvas:last-child {
          break-after: auto;
          page-break-after: auto;
        }
      }
    `;

    renderModal();
    setTimeout(() => {
      fitAllVisibleCanvases();
      window.print();
      setTimeout(() => {
        document.body.classList.remove("is-printing-orientation-deck");
        if (pageRule && pageRule.parentNode) pageRule.parentNode.removeChild(pageRule);
        state.viewMode = prevMode;
        renderModal();
      }, 300);
    }, 160);
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
      flashStepToast();
      renderModal();
      armHudIdleTimer();
    } else {
      exitPresentationMode();
    }
  }

  function exitPresentationMode() {
    const modal = ensureModalElement();
    state.presentationMode = false;
    state.clickerStage = false;
    state.hudIdle = false;
    state.blackoutActive = false;
    clearHudIdleTimer();
    modal.classList.remove("is-presentation-mode", "is-clicker-stage", "is-hud-idle");
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

  function syncHostSlideToLive() {}

  function clearS02Timer() {
    if (state.s02Timer) {
      clearTimeout(state.s02Timer);
      state.s02Timer = 0;
    }
    state.s02PendingTarget = null;
  }

  function clearPipeTimer() {
    if (state.pipeTimer) {
      clearTimeout(state.pipeTimer);
      state.pipeTimer = 0;
    }
    state.pipePendingTarget = null;
  }

  function isHeroRevealSlide(slide) {
    return Boolean(slide && (slide.id === "s06-roadmap-6weeks" || slide.id === "s07-hs-guided-learning"));
  }

  function isPipeZoomSlide(slide) {
    return Boolean(slide && (slide.id === "s08-epidemiology" || slide.id === "s08b-hs-pipeline"));
  }

  function animateFlipElement(el, firstRect, durationMs, easing) {
    if (!el || !firstRect || typeof el.animate !== "function") return;
    const lastRect = el.getBoundingClientRect();
    if (firstRect.width <= 4 || firstRect.height <= 4 || lastRect.width <= 4 || lastRect.height <= 4) return;
    const dx = firstRect.left - lastRect.left;
    const dy = firstRect.top - lastRect.top;
    const sx = firstRect.width / lastRect.width;
    const sy = firstRect.height / lastRect.height;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.015 && Math.abs(sy - 1) < 0.015) return;
    try {
      el.getAnimations().forEach((a) => a.cancel());
      el.animate(
        [
          {
            transformOrigin: "0 0",
            transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`
          },
          {
            transformOrigin: "0 0",
            transform: "translate(0px, 0px) scale(1, 1)"
          }
        ],
        {
          duration: durationMs,
          easing: easing || "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "none"
        }
      );
    } catch (_) {}
  }

  function applyS02DomFocus(targetFocus, animSlot) {
    state.s02Focus = targetFocus;
    const domFocus = targetFocus === 4 ? 0 : targetFocus;
    const modal = document.getElementById("orientationDeckModal");
    if (!modal || modal.hidden) return false;
    const canvas = modal.querySelector('.or-slide-canvas[data-slide-id="s02-third-pillar-why"]');
    const grid = canvas && canvas.querySelector(".or-s02-3fig-grid");
    if (!canvas || !grid) return false;

    const slotStr = animSlot ? String(animSlot) : "";
    const activeCard = slotStr ? grid.querySelector(`.or-s02-flow-card[data-s02-slot="${slotStr}"]`) : null;
    const plateEl = activeCard && activeCard.querySelector(".or-fig-plate");
    const boxEl = activeCard && activeCard.querySelector(".or-s02-takeaway-box");

    const reduceMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plateFirst = !reduceMotion && plateEl && plateEl.offsetParent !== null ? plateEl.getBoundingClientRect() : null;
    const boxFirst = !reduceMotion && boxEl && boxEl.offsetParent !== null ? boxEl.getBoundingClientRect() : null;

    grid.setAttribute("data-s02-focus", String(domFocus));

    const footNum = canvas.querySelector(".or-sld-foot-num");
    const stepLabels = {
      0: "",
      1: " · ภาพ 1 (Fig. 1.4)",
      2: " · ภาพ 2A (Framework)",
      3: " · ภาพ 2B (Patient Focus)",
      4: " · ภาพรวมสรุป"
    };
    if (footNum) {
      footNum.textContent = `03 / ${SLIDES.length}${stepLabels[targetFocus] || ""}`;
    }
    const cchNum = document.querySelector("#orClickerCornerHud .or-cch-num");
    if (cchNum) {
      const shortLabels = { 0: "", 1: " [1]", 2: " [2A]", 3: " [2B]", 4: " [รวม]" };
      cchNum.textContent = `03${shortLabels[targetFocus] || ""} / ${SLIDES.length}`;
    }
    flashStepToast();

    fitSingleSlideCanvas(canvas);

    if (!reduceMotion && activeCard) {
      const dur = domFocus === 0 ? 360 : 450;
      animateFlipElement(plateEl, plateFirst, dur);
      animateFlipElement(boxEl, boxFirst, dur);
      if (domFocus === 0) {
        grid.querySelectorAll(".or-s02-flow-card").forEach((card) => {
          if (card === activeCard || typeof card.animate !== "function") return;
          try {
            card.getAnimations().forEach((a) => a.cancel());
            card.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
          } catch (_) {}
        });
      }
    }
    return true;
  }

  function applyHeroRevealDom(slideId, targetRev) {
    state.heroReveal = targetRev ? 1 : 0;
    const modal = document.getElementById("orientationDeckModal");
    if (!modal || modal.hidden) return false;
    const canvas = modal.querySelector(`.or-slide-canvas[data-slide-id="${slideId}"]`);
    const stageEl = canvas && canvas.querySelector(".or-top-fig-stack.is-hero-reveal-stage");
    if (!canvas || !stageEl) return false;

    const figPlateEl = stageEl.querySelector(":scope > .or-fig-plate");
    const bottomEl = stageEl.children[1] || null;
    const reduceMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const figFirst =
      !reduceMotion && figPlateEl && figPlateEl.offsetParent !== null ? figPlateEl.getBoundingClientRect() : null;

    stageEl.setAttribute("data-hero-reveal", String(state.heroReveal));

    const slideObj = SLIDES.find((s) => s.id === slideId);
    const sNum = slideObj ? slideObj.num : "06";
    const footNum = canvas.querySelector(".or-sld-foot-num");
    if (footNum) {
      footNum.textContent = `${sNum} / ${SLIDES.length}${state.heroReveal === 0 ? " · ภาพรวมเต็มจอ" : ""}`;
    }
    const cchNum = document.querySelector("#orClickerCornerHud .or-cch-num");
    if (cchNum) {
      cchNum.textContent = `${sNum}${state.heroReveal === 0 ? " [ภาพ]" : ""} / ${SLIDES.length}`;
    }
    flashStepToast();

    fitSingleSlideCanvas(canvas);

    if (!reduceMotion) {
      if (figPlateEl && figFirst) {
        animateFlipElement(figPlateEl, figFirst, 430);
      }
      if (state.heroReveal === 1 && bottomEl && typeof bottomEl.animate === "function") {
        try {
          bottomEl.getAnimations().forEach((a) => a.cancel());
          bottomEl.animate(
            [
              { opacity: 0, transform: "translateY(20px)" },
              { opacity: 1, transform: "translateY(0)" }
            ],
            { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
          );
        } catch (_) {}
      }
    }
    return true;
  }

  function applyPipeDomFocus(slideId, targetFocus, animSlot) {
    state.pipeFocus = targetFocus;
    const modal = document.getElementById("orientationDeckModal");
    if (!modal || modal.hidden) return false;
    const canvas = modal.querySelector(`.or-slide-canvas[data-slide-id="${slideId}"]`);
    const stageEl = canvas && canvas.querySelector(".or-top-fig-stack.is-pipe-zoom-stage");
    if (!canvas || !stageEl) return false;

    const prevDomFocus = stageEl.getAttribute("data-pipe-focus") || "hero";
    const domFocus = pipeDomFocusStr(targetFocus);
    const slotStr = animSlot ? String(animSlot) : "";
    const overviewPlate = stageEl.querySelector(".or-fig-plate.is-pipe-overview-plate");
    const gridEl = stageEl.querySelector(".or-grid-4.is-s08-grid");
    const regionAnchor = slotStr ? stageEl.querySelector(`.or-pipe-region-anchor[data-pipe-region="${slotStr}"]`) : null;
    const cropPlate = slotStr ? stageEl.querySelector(`.or-fig-plate.is-pipe-crop-plate[data-pipe-crop="${slotStr}"]`) : null;
    const activeCard = slotStr ? stageEl.querySelector(`.or-card.is-s08-card[data-pipe-slot="${slotStr}"]`) : null;

    const reduceMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const overviewFirst =
      !reduceMotion && overviewPlate && overviewPlate.offsetParent !== null ? overviewPlate.getBoundingClientRect() : null;
    const regionFirst =
      !reduceMotion &&
      domFocus !== "hero" &&
      domFocus !== "0" &&
      regionAnchor &&
      overviewPlate &&
      overviewPlate.offsetParent !== null
        ? regionAnchor.getBoundingClientRect()
        : null;
    const cardFirst =
      !reduceMotion && activeCard && activeCard.offsetParent !== null ? activeCard.getBoundingClientRect() : null;

    stageEl.setAttribute("data-pipe-focus", domFocus);

    const slideObj = SLIDES.find((s) => s.id === slideId);
    const sNum = slideObj ? slideObj.num : "10";
    const isEpi = slideId === "s08-epidemiology";
    const stepLabels = isEpi
      ? {
          0: " · ภาพรวมเต็มจอ",
          1: "",
          2: " · Stage 1–3 (EP1–9)",
          3: " · Stage 4–5 (Exam & SPSS)",
          4: " · Stage 6 (Fieldwork)",
          5: " · Stage 7–8 (Analysis & 4A)",
          6: " · ภาพรวมสรุป"
        }
      : {
          0: " · ภาพรวมเต็มจอ",
          1: "",
          2: " · Stage 1–3 (ST1 & HS1–6)",
          3: " · Stage 4–5 (LHTL & Field)",
          4: " · Stage 6–7 (Exam & ST2)",
          5: " · Stage 8 (Present 3A)",
          6: " · ภาพรวมสรุป"
        };
    const shortLabels = { 0: " [ภาพ]", 1: "", 2: " [S1]", 3: " [S2]", 4: " [S3]", 5: " [S4]", 6: " [รวม]" };
    const footNum = canvas.querySelector(".or-sld-foot-num");
    if (footNum) {
      footNum.textContent = `${sNum} / ${SLIDES.length}${stepLabels[targetFocus] || ""}`;
    }
    const cchNum = document.querySelector("#orClickerCornerHud .or-cch-num");
    if (cchNum) {
      cchNum.textContent = `${sNum}${shortLabels[targetFocus] || ""} / ${SLIDES.length}`;
    }
    flashStepToast();

    fitSingleSlideCanvas(canvas);

    if (!reduceMotion) {
      // Transition between Full-Stage Hero ("hero") and Overview + 4 Cards ("0")
      if ((prevDomFocus === "hero" && domFocus === "0") || (prevDomFocus === "0" && domFocus === "hero")) {
        if (overviewPlate && overviewFirst) {
          animateFlipElement(overviewPlate, overviewFirst, 430);
        }
        if (domFocus === "0" && gridEl && typeof gridEl.animate === "function") {
          try {
            gridEl.getAnimations().forEach((a) => a.cancel());
            gridEl.animate(
              [
                { opacity: 0, transform: "translateY(20px)" },
                { opacity: 1, transform: "translateY(0)" }
              ],
              { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
            );
          } catch (_) {}
        }
      } else if (activeCard) {
        if (domFocus !== "0" && domFocus !== "hero") {
          if (cropPlate && regionFirst) {
            animateFlipElement(cropPlate, regionFirst, 450);
          }
          animateFlipElement(activeCard, cardFirst, 450);
        } else if (domFocus === "0") {
          animateFlipElement(activeCard, cardFirst, 360);
          if (overviewPlate && typeof overviewPlate.animate === "function") {
            try {
              overviewPlate.getAnimations().forEach((a) => a.cancel());
              overviewPlate.animate(
                [
                  { opacity: 0.35, transform: "scale(1.035)" },
                  { opacity: 1, transform: "scale(1)" }
                ],
                { duration: 330, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
              );
            } catch (_) {}
          }
          stageEl.querySelectorAll(".or-card.is-s08-card").forEach((card) => {
            if (card === activeCard || typeof card.animate !== "function") return;
            try {
              card.getAnimations().forEach((a) => a.cancel());
              card.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
            } catch (_) {}
          });
        }
      }
    }
    return true;
  }

  function updateS09HudCounters(canvas, clampedSite) {
    const slideObj = SLIDES.find((s) => s.id === "s09-fieldwork-9sites");
    const sNum = slideObj ? slideObj.num : "14";
    const footNum = canvas && canvas.querySelector(".or-sld-foot-num");
    const cchNum = document.querySelector("#orClickerCornerHud .or-cch-num");
    if (clampedSite >= 1 && clampedSite <= 9) {
      const meta = S09_SITE_META.find((m) => m.id === clampedSite);
      if (footNum) {
        footNum.textContent = `${sNum} / ${SLIDES.length} · กลุ่ม ${clampedSite}/9 (${meta ? meta.shortName : ""})`;
      }
      if (cchNum) {
        cchNum.textContent = `${sNum} [G${clampedSite}/9] / ${SLIDES.length}`;
      }
    } else {
      if (footNum) footNum.textContent = `${sNum} / ${SLIDES.length}`;
      if (cchNum) cchNum.textContent = `${sNum} / ${SLIDES.length}`;
    }
  }

  function mountActiveS09LiveStage(modal) {
    if (!modal || modal.hidden) return;
    const canvas = modal.querySelector('.or-slide-canvas[data-slide-id="s09-fieldwork-9sites"]');
    const mountEl = canvas && canvas.querySelector("[data-s09-live-mount]");
    if (!canvas || !mountEl) return;
    const targetId = Math.max(1, Math.min(9, Number(state.siteFocus) || 1));
    const api = window.RACM_PORTAL_API;
    if (api && typeof api.mountSlideFieldworkSiteStage === "function") {
      api.mountSlideFieldworkSiteStage(mountEl, targetId, {
        onSelectSite: (nextId) => {
          state.autoPlay = false;
          applySiteFocusDom(Number(nextId) || 0);
        }
      });
    }
    updateS09HudCounters(canvas, targetId);
  }

  function wireSlideCustomActions(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll("[data-s09-jump-site]").forEach((el) => {
      if (el._orWiredJumpSite) return;
      el._orWiredJumpSite = true;
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        state.autoPlay = false;
        applySiteFocusDom(Number(el.getAttribute("data-s09-jump-site")) || 0);
      });
    });
    rootEl.querySelectorAll("[data-open-spss-deck]").forEach((btn) => {
      if (btn._orWiredSpss) return;
      btn._orWiredSpss = true;
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        state.autoPlay = false;
        if (window.RACM_SPSS_DECK && typeof window.RACM_SPSS_DECK.open === "function") {
          closeDeck();
          window.RACM_SPSS_DECK.open(0);
        } else if (window.RACM_PORTAL_API && typeof window.RACM_PORTAL_API.openSpssDeck === "function") {
          closeDeck();
          window.RACM_PORTAL_API.openSpssDeck(0);
        }
      });
    });
    rootEl.querySelectorAll("[data-open-attitude-pdf]").forEach((link) => {
      if (link._orWiredAttPdf) return;
      link._orWiredAttPdf = true;
      link.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (window.RACM_PDF_PREVIEW && typeof window.RACM_PDF_PREVIEW.open === "function") {
          ev.preventDefault();
          window.RACM_PDF_PREVIEW.open("downloads/rama_attitude_criteria_2567.pdf", {
            title: "ประกาศคณะฯ เรื่องหลักเกณฑ์การประเมินเจตคติเกี่ยวกับพฤติกรรมที่ไม่พึงประสงค์ พ.ศ. 2567.pdf",
            downloadName: "rama_attitude_criteria_2567.pdf"
          });
        }
      });
    });
  }

  function applySiteFocusDom(targetSite) {
    const clamped = Math.max(0, Math.min(9, Number(targetSite) || 0));
    state.siteFocus = clamped;
    const modal = document.getElementById("orientationDeckModal");
    if (!modal || modal.hidden) return false;
    const canvas = modal.querySelector('.or-slide-canvas[data-slide-id="s09-fieldwork-9sites"]');
    const bodyEl = canvas && canvas.querySelector(".or-sld-body");
    const slideObj = SLIDES.find((s) => s.id === "s09-fieldwork-9sites");
    if (!canvas || !bodyEl || !slideObj) return false;

    bodyEl.innerHTML = slideObj.render();
    flashStepToast();

    if (clamped >= 1) {
      mountActiveS09LiveStage(modal);
    } else {
      updateS09HudCounters(canvas, 0);
      canvas._lastFitSig = "";
      wireSlideCustomActions(canvas);
      wireImageLoadRefit(canvas);
      fitSingleSlideCanvas(canvas);
    }

    const reduceMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion && !window.__RACM_EXPORTING_DECK && bodyEl.firstElementChild && typeof bodyEl.firstElementChild.animate === "function") {
      try {
        bodyEl.firstElementChild.animate(
          [
            { opacity: 0.35, transform: "translateY(6px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      } catch (_) {}
    }
    return true;
  }

  function goToSlide(idx, opts) {
    const o = opts || {};
    clearS02Timer();
    clearPipeTimer();
    const nextIdx = Math.max(0, Math.min(SLIDES.length - 1, idx));
    state.transitionDir = nextIdx < state.slideIdx ? "prev" : "next";
    state.slideIdx = nextIdx;
    state.s02Focus = typeof o.s02Focus === "number" ? o.s02Focus : 0;
    state.heroReveal = typeof o.heroReveal === "number" ? o.heroReveal : 0;
    state.pipeFocus = typeof o.pipeFocus === "number" ? o.pipeFocus : 0;
    state.siteFocus = typeof o.siteFocus === "number" ? o.siteFocus : 0;
    state.zoomScale = 1;
    state.toolsMenuOpen = false;
    clearJumpBuffer();
    flashStepToast();
    renderModal();
    const vp = document.getElementById("orDeckViewport");
    if (vp) {
      vp.scrollTop = 0;
      vp.scrollLeft = 0;
    }
  }

  function stepSlide(delta) {
    const d = Number(delta) || 0;
    if (!d) return;

    if (state.s02Timer && typeof state.s02PendingTarget === "number") {
      const snapFocus = state.s02PendingTarget;
      clearS02Timer();
      state.s02Focus = snapFocus;
      applyS02DomFocus(snapFocus, 0);
    }
    if (state.pipeTimer && typeof state.pipePendingTarget === "number") {
      const snapPipe = state.pipePendingTarget;
      const curPipeSlide = SLIDES[state.slideIdx];
      clearPipeTimer();
      state.pipeFocus = snapPipe;
      if (isPipeZoomSlide(curPipeSlide)) {
        applyPipeDomFocus(curPipeSlide.id, snapPipe, 0);
      }
    }

    const cur = SLIDES[state.slideIdx];
    if (state.viewMode === "deck" && cur && cur.id === "s09-fieldwork-9sites") {
      if (d > 0) {
        if (state.siteFocus < 9) {
          applySiteFocusDom(state.siteFocus + 1);
          return;
        }
        goToSlide(state.slideIdx + 1, { siteFocus: 0 });
        return;
      } else {
        if (state.siteFocus > 0) {
          applySiteFocusDom(state.siteFocus - 1);
          return;
        }
        goToSlide(state.slideIdx - 1, { siteFocus: 0 });
        return;
      }
    }

    if (state.viewMode === "deck" && cur && cur.id === "s02-third-pillar-why") {
      if (d > 0) {
        if (state.s02Focus === 0) {
          applyS02DomFocus(1, 1);
          return;
        }
        if (state.s02Focus === 1) {
          applyS02DomFocus(0, 1);
          state.s02PendingTarget = 2;
          state.s02Timer = setTimeout(() => {
            state.s02Timer = 0;
            state.s02PendingTarget = null;
            if (state.isOpen && SLIDES[state.slideIdx] && SLIDES[state.slideIdx].id === "s02-third-pillar-why") {
              applyS02DomFocus(2, 2);
            }
          }, 365);
          return;
        }
        if (state.s02Focus === 2) {
          applyS02DomFocus(0, 2);
          state.s02PendingTarget = 3;
          state.s02Timer = setTimeout(() => {
            state.s02Timer = 0;
            state.s02PendingTarget = null;
            if (state.isOpen && SLIDES[state.slideIdx] && SLIDES[state.slideIdx].id === "s02-third-pillar-why") {
              applyS02DomFocus(3, 3);
            }
          }, 365);
          return;
        }
        if (state.s02Focus === 3) {
          applyS02DomFocus(4, 3);
          return;
        }
        goToSlide(state.slideIdx + 1, { s02Focus: 0 });
        return;
      } else {
        if (state.s02Focus === 4) {
          applyS02DomFocus(3, 3);
          return;
        }
        if (state.s02Focus === 3) {
          applyS02DomFocus(0, 3);
          state.s02PendingTarget = 2;
          state.s02Timer = setTimeout(() => {
            state.s02Timer = 0;
            state.s02PendingTarget = null;
            if (state.isOpen && SLIDES[state.slideIdx] && SLIDES[state.slideIdx].id === "s02-third-pillar-why") {
              applyS02DomFocus(2, 2);
            }
          }, 365);
          return;
        }
        if (state.s02Focus === 2) {
          applyS02DomFocus(0, 2);
          state.s02PendingTarget = 1;
          state.s02Timer = setTimeout(() => {
            state.s02Timer = 0;
            state.s02PendingTarget = null;
            if (state.isOpen && SLIDES[state.slideIdx] && SLIDES[state.slideIdx].id === "s02-third-pillar-why") {
              applyS02DomFocus(1, 1);
            }
          }, 365);
          return;
        }
        if (state.s02Focus === 1) {
          applyS02DomFocus(0, 1);
          return;
        }
        goToSlide(state.slideIdx - 1, { s02Focus: 0 });
        return;
      }
    }

    // Slides 06 & 09: Full-Stage Hero Diagram (0) -> Click #1 Reveals Cards Below (1) -> Click #2 Next Slide!
    if (state.viewMode === "deck" && isHeroRevealSlide(cur)) {
      if (d > 0) {
        if (state.heroReveal === 0) {
          applyHeroRevealDom(cur.id, 1);
          return;
        }
        goToSlide(state.slideIdx + 1);
        return;
      } else {
        if (state.heroReveal === 1) {
          applyHeroRevealDom(cur.id, 0);
          return;
        }
        const prevIdx = state.slideIdx - 1;
        if (prevIdx >= 0 && isHeroRevealSlide(SLIDES[prevIdx])) {
          goToSlide(prevIdx, { heroReveal: 1 });
          return;
        }
        if (prevIdx >= 0 && isPipeZoomSlide(SLIDES[prevIdx])) {
          goToSlide(prevIdx, { pipeFocus: 6 });
          return;
        }
        goToSlide(prevIdx);
        return;
      }
    }

    // Slides 10 & 11: Full-Stage Hero Diagram (0) -> Reveal 4 Cards (1) -> Zoom Stages 1..4 (2..5) -> Overview+Cards (6) -> Next Slide!
    if (state.viewMode === "deck" && isPipeZoomSlide(cur)) {
      const sid = cur.id;
      if (d > 0) {
        if (state.pipeFocus === 0) {
          applyPipeDomFocus(sid, 1, 0);
          return;
        }
        if (state.pipeFocus === 1) {
          applyPipeDomFocus(sid, 2, 1);
          return;
        }
        if (state.pipeFocus >= 2 && state.pipeFocus <= 4) {
          const curSlot = state.pipeFocus - 1;
          const nextFocus = state.pipeFocus + 1;
          const nextSlot = nextFocus - 1;
          applyPipeDomFocus(sid, 1, curSlot);
          state.pipePendingTarget = nextFocus;
          state.pipeTimer = setTimeout(() => {
            state.pipeTimer = 0;
            state.pipePendingTarget = null;
            if (state.isOpen && SLIDES[state.slideIdx] && SLIDES[state.slideIdx].id === sid) {
              applyPipeDomFocus(sid, nextFocus, nextSlot);
            }
          }, 365);
          return;
        }
        if (state.pipeFocus === 5) {
          // Zoom out Stage 4 back to Overview + 4 Cards and WAIT for the next clicker press!
          applyPipeDomFocus(sid, 6, 4);
          return;
        }
        goToSlide(state.slideIdx + 1, { pipeFocus: 0 });
        return;
      } else {
        if (state.pipeFocus === 6) {
          applyPipeDomFocus(sid, 5, 4);
          return;
        }
        if (state.pipeFocus >= 3 && state.pipeFocus <= 5) {
          const curSlot = state.pipeFocus - 1;
          const prevFocus = state.pipeFocus - 1;
          const prevSlot = prevFocus - 1;
          applyPipeDomFocus(sid, 1, curSlot);
          state.pipePendingTarget = prevFocus;
          state.pipeTimer = setTimeout(() => {
            state.pipeTimer = 0;
            state.pipePendingTarget = null;
            if (state.isOpen && SLIDES[state.slideIdx] && SLIDES[state.slideIdx].id === sid) {
              applyPipeDomFocus(sid, prevFocus, prevSlot);
            }
          }, 365);
          return;
        }
        if (state.pipeFocus === 2) {
          applyPipeDomFocus(sid, 1, 1);
          return;
        }
        if (state.pipeFocus === 1) {
          applyPipeDomFocus(sid, 0, 0);
          return;
        }
        const prevIdx = state.slideIdx - 1;
        if (prevIdx >= 0 && isPipeZoomSlide(SLIDES[prevIdx])) {
          goToSlide(prevIdx, { pipeFocus: 6 });
          return;
        }
        if (prevIdx >= 0 && isHeroRevealSlide(SLIDES[prevIdx])) {
          goToSlide(prevIdx, { heroReveal: 1 });
          return;
        }
        goToSlide(prevIdx);
        return;
      }
    }

    // Stepping backward lands on final overview of Slide 03 (4), Slides 06/09 (heroReveal: 1), Slides 10/11 (6), or Slide 14 (siteFocus: 9)
    const targetIdx = state.slideIdx + d;
    if (d < 0 && targetIdx >= 0 && SLIDES[targetIdx]) {
      if (SLIDES[targetIdx].id === "s09-fieldwork-9sites") {
        goToSlide(targetIdx, { siteFocus: 9 });
        return;
      }
      if (SLIDES[targetIdx].id === "s02-third-pillar-why") {
        goToSlide(targetIdx, { s02Focus: 4 });
        return;
      }
      if (isHeroRevealSlide(SLIDES[targetIdx])) {
        goToSlide(targetIdx, { heroReveal: 1 });
        return;
      }
      if (isPipeZoomSlide(SLIDES[targetIdx])) {
        goToSlide(targetIdx, { pipeFocus: 6 });
        return;
      }
    }
    goToSlide(targetIdx, { s02Focus: 0, heroReveal: 0, pipeFocus: 0, siteFocus: 0 });
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
    state.transitionDir = safeIdx < state.slideIdx ? "prev" : "next";
    state.slideIdx = safeIdx;
    state.siteFocus = 0;
    state.zoomScale = 1;
    flashStepToast();
    renderModal();
    const vp = document.getElementById("orDeckViewport");
    if (vp) {
      vp.scrollTop = 0;
      vp.scrollLeft = 0;
    }
  }

  function renderClickerGuideHtml() {
    if (!state.clickerGuideOpen) return "";
    return `
      <div class="or-clicker-guide-backdrop" role="dialog" aria-modal="true" aria-label="Keynote Clicker & Keyboard Guide">
        <div class="or-clicker-guide-sheet">
          <div class="or-cg-head">
            <div>
              <span class="or-cg-pill">● APPLE TV × KEYNOTE PITCH · CLICKER READY</span>
              <h3 class="or-cg-title">ควบคุมสไลด์แบบไม่ต้องใช้เมาส์ (Wireless Presentation Clicker &amp; Keyboard)</h3>
            </div>
            <div style="display:inline-flex;align-items:center;gap:8px;flex-shrink:0">
              <div class="racm-unav-pair is-compact is-dark-hud" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่">
                <button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button>
                <button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button>
              </div>
              <button type="button" class="or-tool-btn is-close" id="orCloseClickerGuideBtn" aria-label="ปิดหน้าต่างแนะนำ Clicker">&times;</button>
            </div>
          </div>
          <div class="or-cg-grid is-single-col">
            <div class="or-cg-col">
              <div class="or-cg-kicker">USB / BLUETOOTH PRESENTATION CLICKER &amp; KEYBOARD SHORTCUTS</div>
              <div class="or-cg-keymap">
                <div class="or-cg-krow"><kbd>PageDown</kbd> <kbd>&rarr;</kbd> <kbd>Space</kbd> <kbd>Enter</kbd><span>สไลด์ถัดไป (Next Slide)</span></div>
                <div class="or-cg-krow"><kbd>PageUp</kbd> <kbd>&larr;</kbd> <kbd>Backspace</kbd><span>สไลด์ก่อนหน้า (Previous Slide)</span></div>
                <div class="or-cg-krow"><kbd>F5</kbd> หรือ <kbd>C</kbd><span>เข้า/ออกโหมด <strong>Keynote Pitch Stage</strong> (ซ่อนแถบเมนูอัตโนมัติ)</span></div>
                <div class="or-cg-krow"><kbd>.</kbd> หรือ <kbd>B</kbd><span>พักหน้าจอดำ <strong>Blackout Stage</strong> (รองรับปุ่มจอดำบน Clicker ทุกรุ่น)</span></div>
                <div class="or-cg-krow"><kbd>1–${SLIDES.length}</kbd> + <kbd>Enter</kbd><span>พิมพ์เลขสไลด์แล้วกด Enter เพื่อกระโดดข้ามหน้าทันที</span></div>
                <div class="or-cg-krow"><kbd>L</kbd> เลเซอร์ · <kbd>H</kbd> ซ่อน/แสดงแถบ · <kbd>T</kbd> โทนสว่าง/มืด<span>ควบคุมเวทีครบมือโดยไม่ต้องจับเมาส์</span></div>
              </div>
              <div class="or-cg-actions">
                <button type="button" class="or-tool-btn is-clicker-launch" id="orGuideStartClickerBtn">${SVG.clicker} <span>เริ่มโหมด Keynote Pitch เต็มจอทันที (F5)</span></button>
                <button type="button" class="or-tool-btn" id="orGuideBlackoutBtn">⬛ ทดสอบพักจอดำ (B)</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function openLiveLobby() {
    state.isOpen = true;
    state.autoPlay = false;
    state.toolsMenuOpen = false;
    state.zoomScale = 1;
    state.viewMode = "deck";
    renderModal();
  }

  function resumeSlidesFromLobby() {
    state.autoPlay = false;
    state.toolsMenuOpen = false;
    state.zoomScale = 1;
    state.viewMode = "deck";
    renderModal();
  }

  function refreshLiveSurface() {}

  function renderModal() {
    const modal = ensureModalElement();
    if (!state.isOpen) {
      clearAutoPlayTimer();
      clearPremScreensaverTimer();
      clearClosingVdoTimers(true);
      premReelState.wasOnSlide = false;
      document.body.classList.remove("orient-deck-open");
      modal.hidden = true;
      return;
    }
    document.body.classList.add("orient-deck-open");
    modal.hidden = false;
    modal.classList.toggle("is-presentation-mode", state.presentationMode);
    modal.classList.toggle("is-clicker-stage", state.clickerStage);
    modal.classList.toggle("is-hud-idle", Boolean((state.clickerStage || state.presentationMode) && state.hudIdle));

    if (state.viewMode === "live") {
      state.viewMode = "deck";
    }

    const cur = SLIDES[state.slideIdx] || SLIDES[0];
    const onPremSlideNow =
      state.viewMode === "deck" &&
      !document.body.classList.contains("is-printing-orientation-deck") &&
      !window.__RACM_EXPORTING_DECK &&
      cur.id === "s02-prem-buri-founder";
    if (onPremSlideNow && !premReelState.wasOnSlide) {
      premReelState.order = buildPremShuffledOrder();
      premReelState.cursor = 0;
      premReelState.paused = false;
      premReelState.kbFlip = false;
    }
    premReelState.wasOnSlide = onPremSlideNow;
    if (!onPremSlideNow || state.blackoutActive) {
      clearPremScreensaverTimer();
    }

    const onClosingVdoSlideNow =
      state.viewMode === "deck" &&
      !document.body.classList.contains("is-printing-orientation-deck") &&
      !window.__RACM_EXPORTING_DECK &&
      !state.blackoutActive &&
      cur.id === "s18-closing-vdo-hss";
    clearClosingVdoTimers(!onClosingVdoSlideNow);

    const progressPct = (((state.slideIdx + 1) / Math.max(1, SLIDES.length)) * 100).toFixed(1);
    const showNotesNow = state.viewMode === "deck" && state.showNotes;
    const notesLabel = ROLE === "faculty" ? t("โน้ตผู้สอน", "Presenter Notes") : t("คำอธิบายสไลด์", "Slide Notes");
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
      <div class="or-deck-shell is-io-deck is-appletv-deck${showNotesNow ? " has-notes-open" : ""}${state.clickerStage ? " is-clicker-active" : ""}" data-io-theme="${effectiveIoTheme}">
        <div class="or-deck-topbar is-tv-capsule">
          <div class="or-top-left">
            <div class="racm-unav-pair is-compact is-dark-hud" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่">
              <button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button>
              <button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button>
            </div>
            <span class="or-code-pill is-io-brand-pill">RACM 303</span>
            <div class="or-top-title-wrap">
              <span class="or-top-title">${esc(
                t(
                  "Course Orientation · Community Medicine & Health Systems Science",
                  "RACM 303 Orientation · Community Medicine & Health Systems Science"
                )
              )}</span>
              <span class="or-top-sub">พุธ 25 พ.ย. 2569 · 08.30 – 09.30 น. · ห้อง 2C2-03 · <strong>Clicker Ready</strong></span>
            </div>
          </div>

          <div class="or-top-center" role="tablist" aria-label="สลับมุมมองสไลด์">
            <button type="button" class="or-mode-btn${state.viewMode === "deck" ? " is-active" : ""}" data-or-vmode="deck">${SVG.slides} <span>Slide</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "sorter" ? " is-active" : ""}" data-or-vmode="sorter">${SVG.grid} <span>Sorter</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "handout" ? " is-active" : ""}" data-or-vmode="handout">${SVG.handout} <span>Handout</span></button>
          </div>

          <div class="or-top-right">
            <div class="or-desktop-tools">
              <button type="button" class="or-tool-btn is-clicker-pill${state.clickerStage ? " is-active-toggle" : ""}" id="orClickerStageBtn" title="โหมด Keynote / Google I/O Pitch Stage — กดด้วย Wireless Clicker / Space / ลูกศร / คลิกที่จอ โดยไม่ต้องเล็งเมาส์ (กด F5 หรือ C)">${SVG.clicker} <span>${state.clickerStage ? "Pitch On" : "Clicker"}</span></button>
              <button type="button" class="or-tool-btn is-clicker-help-btn" id="orClickerGuideBtn" title="ดูปุ่มลัด Presentation Clicker และคีย์บอร์ด (กด ?)">🎛️</button>
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
              <a class="or-tool-btn" href="${PPTX_HREF}" download="RACM303_2569_Orientation_Slides.pptx" title="ดาวน์โหลดไฟล์ PowerPoint (.pptx) อัตราส่วน 16:9">${SVG.download} <span>.pptx</span></a>
              <a class="or-tool-btn" href="${PDF_HREF}" download="RACM303_2569_Orientation_Slides.pdf" title="เปิดดู Preview และดาวน์โหลดสไลด์ PDF ขนาด 16:9">${SVG.download} <span>PDF</span></a>
              <button type="button" class="or-tool-btn" id="orPrintBtn" title="สั่งพิมพ์ / Save as PDF ขนาด Widescreen 16:9">${SVG.print} <span>${esc(t("พิมพ์", "Print"))}</span></button>
            </div>

            <div class="or-tools-menu-wrap">
              <button type="button" class="or-tool-btn or-compact-more-btn${state.toolsMenuOpen || state.autoPlay || state.showNotes || state.clickerStage ? " is-active-toggle" : ""}" id="orMoreToolsBtn" aria-expanded="${state.toolsMenuOpen ? "true" : "false"}" title="เครื่องมือสไลด์เพิ่มเติม">${SVG.more}</button>
              <div class="or-tools-popover" ${state.toolsMenuOpen ? "" : "hidden"}>
                <button type="button" class="or-pop-item${state.clickerStage ? " is-active" : ""}" id="orPopClickerStageBtn">${SVG.clicker} <span>${state.clickerStage ? "ออกจากโหมด Keynote Pitch" : "โหมด Keynote Pitch / Clicker (F5)"}</span></button>
                <button type="button" class="or-pop-item" id="orPopClickerGuideBtn"><span>🎛️ คู่มือ Presentation Clicker &amp; คีย์บอร์ด (?)</span></button>
                <button type="button" class="or-pop-item" id="orPopBlackoutBtn"><span>⬛ พักหน้าจอดำ Blackout (B / .)</span></button>
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
                <a class="or-pop-item" href="${PDF_HREF}" download="RACM303_2569_Orientation_Slides.pdf">${SVG.download} <span>ดาวน์โหลดสไลด์ PDF (16:9)</span></a>
                <button type="button" class="or-pop-item" id="orPopPrintBtn">${SVG.print} <span>${esc(t("สั่งพิมพ์ 16:9 (Print)", "Print 16:9 Handout"))}</span></button>
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
          state.viewMode === "deck"
            ? `
          <div class="or-clicker-corner-hud${state.stepToastActive ? " is-visible" : ""}" id="orClickerCornerHud" aria-live="polite">
            <span class="or-cch-badge">KEYNOTE</span>
            <span class="or-cch-num">${cur.num} / ${SLIDES.length}</span>
            <span class="or-cch-sep">·</span>
            <span class="or-cch-time">${esc(cur.timeWindow)}</span>
          </div>
          ${
            state.jumpDigits
              ? `<div class="or-jump-buffer-pill" role="status">ไปสไลด์ที่ <strong>${esc(state.jumpDigits)}</strong> &crarr; <small>(กด Enter)</small></div>`
              : ""
          }
          <div class="or-keynote-progress-rail" aria-hidden="true">
            <div class="or-keynote-progress-fill" style="width:${progressPct}%"></div>
          </div>
        `
            : ""
        }

        ${
          state.blackoutActive
            ? `
          <div class="or-blackout-curtain" role="dialog" aria-label="Keynote Stage Paused">
            <div class="or-blackout-card">
              <span class="or-blackout-dot"></span>
              <div class="or-blackout-title">RACM 303 · KEYNOTE STAGE PAUSED</div>
              <div class="or-blackout-sub">กดปุ่มใดก็ได้บน Clicker / Space / ลูกศร หรือแตะหน้าจอเพื่อกลับสู่สไลด์ ${cur.num}/${SLIDES.length}</div>
            </div>
          </div>
        `
            : ""
        }

        ${renderClickerGuideHtml()}

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
          <div class="or-deck-bottombar is-tv-capsule">
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

            <div class="or-zoom-sync-cluster">
              <div class="or-zoom-pill" role="group" aria-label="ย่อขยายสไลด์ (Pinch-Zoom ได้)">
                <button type="button" class="or-zoom-btn" id="orZoomOutBtn" title="ซูมออก (−)">&minus;</button>
                <button type="button" class="or-zoom-lbl" id="orZoomResetBtn" data-or-zoom-label title="แตะเพื่อรีเซ็ตขนาด 100% (หรือใช้ 2 นิ้วถ่างซูมบนจอ)">${zoomPct}%</button>
                <button type="button" class="or-zoom-btn" id="orZoomInBtn" title="ซูมเข้า (+)">&#43;</button>
              </div>
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
        state.s02Focus = 0;
        state.heroReveal = 0;
        state.pipeFocus = 0;
        state.siteFocus = 0;
        state.viewMode = "deck";
        renderModal();
      });
    });

    ["orIoThemeBtn", "orPopIoThemeBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", toggleIoStageTheme);
    });

    ["orClickerStageBtn", "orPopClickerStageBtn", "orGuideStartClickerBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", toggleClickerStage);
    });

    ["orClickerGuideBtn", "orPopClickerGuideBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) {
        b.addEventListener("click", () => {
          state.toolsMenuOpen = false;
          state.clickerGuideOpen = !state.clickerGuideOpen;
          renderModal();
        });
      }
    });

    ["orPopBlackoutBtn", "orGuideBlackoutBtn"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) {
        b.addEventListener("click", () => {
          state.clickerGuideOpen = false;
          toggleBlackout();
        });
      }
    });

    const closeGuideBtn = document.getElementById("orCloseClickerGuideBtn");
    if (closeGuideBtn) {
      closeGuideBtn.addEventListener("click", () => {
        state.clickerGuideOpen = false;
        renderModal();
      });
    }

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
        stepSlide(-1);
      });
    }

    const nextBtn = document.getElementById("orNextBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        state.autoPlay = false;
        stepSlide(1);
      });
    }

    modal.querySelectorAll(".or-s02-flow-card[data-s02-slot]").forEach((card) => {
      card.addEventListener("click", (ev) => {
        if (state.viewMode !== "deck" || state.clickerStage || state.presentationMode) return;
        if (ev.target && ev.target.closest && ev.target.closest("a, button")) return;
        const slotNum = Number(card.getAttribute("data-s02-slot")) || 0;
        if (!slotNum) return;
        state.autoPlay = false;
        if (state.s02Focus === 0 || state.s02Focus === 4) {
          applyS02DomFocus(slotNum, slotNum);
        } else {
          stepSlide(1);
        }
      });
    });

    modal.querySelectorAll(".or-top-fig-stack.is-hero-reveal-stage > .or-fig-plate").forEach((plate) => {
      plate.addEventListener("click", (ev) => {
        if (state.viewMode !== "deck" || state.clickerStage || state.presentationMode) return;
        if (ev.target && ev.target.closest && ev.target.closest("a, button")) return;
        const curSlideNow = SLIDES[state.slideIdx];
        if (!isHeroRevealSlide(curSlideNow)) return;
        if (state.heroReveal === 0) {
          state.autoPlay = false;
          applyHeroRevealDom(curSlideNow.id, 1);
        }
      });
    });

    modal.querySelectorAll(".or-fig-plate.is-pipe-overview-plate").forEach((plate) => {
      plate.addEventListener("click", (ev) => {
        if (state.viewMode !== "deck" || state.clickerStage || state.presentationMode) return;
        if (ev.target && ev.target.closest && ev.target.closest("a, button, .or-pipe-region-anchor")) return;
        const curSlideNow = SLIDES[state.slideIdx];
        if (!isPipeZoomSlide(curSlideNow)) return;
        if (state.pipeFocus === 0) {
          state.autoPlay = false;
          applyPipeDomFocus(curSlideNow.id, 1, 0);
        }
      });
    });

    modal.querySelectorAll(".or-card.is-s08-card[data-pipe-slot], .or-pipe-region-anchor[data-pipe-region]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        if (state.viewMode !== "deck" || state.clickerStage || state.presentationMode) return;
        if (ev.target && ev.target.closest && ev.target.closest("a, button")) return;
        const curSlideNow = SLIDES[state.slideIdx];
        if (!isPipeZoomSlide(curSlideNow)) return;
        const slotNum = Number(el.getAttribute("data-pipe-slot") || el.getAttribute("data-pipe-region")) || 0;
        if (!slotNum) return;
        state.autoPlay = false;
        if (state.pipeFocus === 1 || state.pipeFocus === 6) {
          applyPipeDomFocus(curSlideNow.id, slotNum + 1, slotNum);
        } else {
          stepSlide(1);
        }
      });
    });

    const sel = document.getElementById("orSlideSelect");
    if (sel) {
      sel.addEventListener("change", () => {
        state.autoPlay = false;
        goToSlide(Number(sel.value) || 0);
      });
    }

    const zoomOutBtn = document.getElementById("orZoomOutBtn");
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => setZoomScale((state.zoomScale || 1) - 0.25));
    const zoomInBtn = document.getElementById("orZoomInBtn");
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => setZoomScale((state.zoomScale || 1) + 0.25));
    const zoomResetBtn = document.getElementById("orZoomResetBtn");
    if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => setZoomScale(1));

    // Run Per-Frame Auto-Fit Typography synchronously before paint & re-verify on image decode!
    fitAllVisibleCanvases();
    applyZoomToCurrentSlide(1);
    wireSlideCustomActions(modal);
    if (state.viewMode === "deck" && cur && cur.id === "s09-fieldwork-9sites" && state.siteFocus >= 1) {
      mountActiveS09LiveStage(modal);
    }
    wireImageLoadRefit(modal);
    wireLaserIfActive(modal);
    if (cur.isCover) {
      animateCoverKpis(modal);
      setTimeout(() => preloadPremUpcoming(true), 160);
    }
    if (onPremSlideNow) wirePremScreensaver(modal);
    if (onClosingVdoSlideNow) wireClosingVdoSlide(modal);
    scheduleAutoPlayTick();
    if (state.clickerStage || state.presentationMode) {
      armHudIdleTimer();
    }
  }

  function exitClosingVdoFullscreenCinema(modal) {
    closingVdoState.fullscreenCinema = false;
    const m = modal || document.getElementById("orientationDeckModal");
    if (m) {
      m.classList.remove("is-vdo-fullscreen-cinema");
      m.querySelectorAll("[data-closing-vdo-card]").forEach((c) => c.classList.remove("is-fullscreen-playing"));
    }
    if (document.fullscreenElement && !state.presentationMode && !state.clickerStage && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function clearClosingVdoTimers(pauseVideo) {
    if (closingVdoState.timerId) {
      clearTimeout(closingVdoState.timerId);
      closingVdoState.timerId = 0;
    }
    if (closingVdoState.tickId) {
      clearInterval(closingVdoState.tickId);
      closingVdoState.tickId = 0;
    }
    closingVdoState.unlocking = false;
    if (pauseVideo) {
      closingVdoState.fullscreenCinema = false;
      const m = document.getElementById("orientationDeckModal");
      if (m) {
        m.classList.remove("is-vdo-fullscreen-cinema");
        m.querySelectorAll("[data-closing-vdo-card]").forEach((c) => c.classList.remove("is-fullscreen-playing"));
        m.querySelectorAll("[data-closing-vdo-el]").forEach((v) => {
          try {
            if (!v.paused) v.pause();
          } catch (_) {}
        });
      }
    }
  }

  function startClosingVdoPlayback(modal, enterFullScreen) {
    clearClosingVdoTimers(false);
    if (!modal || modal.hidden) return;
    const cardEl = modal.querySelector("[data-closing-vdo-card]");
    const videoEl = modal.querySelector("[data-closing-vdo-el]");
    const overlayEl = modal.querySelector("[data-closing-vdo-overlay]");
    const unmuteBtn = modal.querySelector('[data-vdo-action="unmute"]');
    const statusEl = modal.querySelector("[data-closing-vdo-status]");
    if (overlayEl) overlayEl.classList.add("is-hidden");
    if (!videoEl) return;

    if (enterFullScreen !== false) {
      closingVdoState.fullscreenCinema = true;
      modal.classList.add("is-vdo-fullscreen-cinema");
      if (cardEl) cardEl.classList.add("is-fullscreen-playing");
      if (!document.fullscreenElement) {
        if (modal.requestFullscreen) {
          modal.requestFullscreen().catch(() => {});
        } else if (videoEl.requestFullscreen) {
          videoEl.requestFullscreen().catch(() => {});
        }
      }
    }

    videoEl.muted = false;
    videoEl.volume = 1;
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          if (unmuteBtn) unmuteBtn.hidden = true;
          if (statusEl) statusEl.textContent = "▶ กำลังเล่นเต็มจอพร้อมเสียง: Introduction to Health Systems Science (06:53)";
        })
        .catch(() => {
          videoEl.muted = true;
          if (unmuteBtn) unmuteBtn.hidden = false;
          if (statusEl) statusEl.textContent = "▶ กำลังเล่นเต็มจอ (แตะปุ่มเปิดเสียงมุมขวาบน)";
          videoEl.play().catch(() => {});
        });
    }
  }

  function handleClosingVdoClickerAction() {
    const modal = document.getElementById("orientationDeckModal");
    if (!modal || modal.hidden) return;
    const videoEl = modal.querySelector("[data-closing-vdo-el]");
    if (!videoEl) return;
    if (closingVdoState.timerId) {
      startClosingVdoPlayback(modal, true);
      return;
    }
    if (videoEl.paused) {
      startClosingVdoPlayback(modal, true);
    } else {
      videoEl.pause();
    }
  }

  function wireClosingVdoSlide(modal) {
    if (!modal || modal.hidden) return;
    const splitEl = modal.querySelector("[data-closing-vdo-split]");
    const videoEl = modal.querySelector("[data-closing-vdo-el]");
    const overlayEl = modal.querySelector("[data-closing-vdo-overlay]");
    const secEl = modal.querySelector("[data-closing-vdo-sec]");
    const statusEl = modal.querySelector("[data-closing-vdo-status]");
    const unmuteBtn = modal.querySelector('[data-vdo-action="unmute"]');
    if (!videoEl) return;

    clearClosingVdoTimers(false);
    closingVdoState.fullscreenCinema = false;
    modal.classList.remove("is-vdo-fullscreen-cinema");
    closingVdoState.remainSec = Math.round(CLOSING_VDO_DELAY_MS / 1000);
    if (secEl) secEl.textContent = String(closingVdoState.remainSec);
    if (statusEl) {
      statusEl.textContent = `⏳ Autoplay เต็มจอ + เปิดเสียง ใน ${closingVdoState.remainSec} วินาที...`;
    }

    closingVdoState.tickId = setInterval(() => {
      closingVdoState.remainSec = Math.max(1, closingVdoState.remainSec - 1);
      if (secEl) secEl.textContent = String(closingVdoState.remainSec);
      if (statusEl && videoEl.paused) {
        statusEl.textContent = `⏳ Autoplay เต็มจอ + เปิดเสียง ใน ${closingVdoState.remainSec} วินาที...`;
      }
    }, 1000);

    closingVdoState.timerId = setTimeout(() => {
      closingVdoState.timerId = 0;
      if (!state.isOpen || state.viewMode !== "deck" || state.blackoutActive) return;
      const curNow = SLIDES[state.slideIdx];
      if (!curNow || curNow.id !== "s18-closing-vdo-hss") return;
      startClosingVdoPlayback(modal, true);
    }, CLOSING_VDO_DELAY_MS);

    // Synchronously bless HTMLMediaElement with the user's "Next Slide" gesture so unmuted play() succeeds 5s later!
    try {
      closingVdoState.unlocking = true;
      videoEl.muted = false;
      videoEl.volume = 1;
      const unlockPromise = videoEl.play();
      if (unlockPromise && typeof unlockPromise.then === "function") {
        unlockPromise
          .then(() => {
            if (closingVdoState.timerId) {
              videoEl.pause();
              try {
                videoEl.currentTime = 0;
              } catch (_) {}
            }
            closingVdoState.unlocking = false;
          })
          .catch(() => {
            closingVdoState.unlocking = false;
          });
      } else {
        if (closingVdoState.timerId) videoEl.pause();
        closingVdoState.unlocking = false;
      }
    } catch (_) {
      closingVdoState.unlocking = false;
    }

    videoEl.addEventListener("play", () => {
      if (closingVdoState.unlocking) return;
      clearClosingVdoTimers(false);
      if (overlayEl) overlayEl.classList.add("is-hidden");
      if (statusEl) statusEl.textContent = "▶ กำลังเล่นวิดีโอ Introduction to Health Systems Science (06:53)";
    });
    videoEl.addEventListener("pause", () => {
      if (closingVdoState.unlocking) return;
      if (!videoEl.ended && statusEl && !closingVdoState.timerId) {
        statusEl.textContent = "⏸ หยุดเล่นชั่วคราว — กดเล่นต่อได้ทันที";
      }
    });
    videoEl.addEventListener("ended", () => {
      if (statusEl) statusEl.textContent = "✓ เล่นจบแล้ว — พร้อมส่งต่อเข้าสู่คาบ ST1 (09.30 น.)";
    });
    videoEl.addEventListener("volumechange", () => {
      if (closingVdoState.unlocking) return;
      if (unmuteBtn) unmuteBtn.hidden = !videoEl.muted;
    });

    modal.querySelectorAll("[data-vdo-action]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const act = btn.getAttribute("data-vdo-action");
        if (act === "play-now") {
          startClosingVdoPlayback(modal, true);
        } else if (act === "exit-fs-cinema") {
          exitClosingVdoFullscreenCinema(modal);
        } else if (act === "cancel-autoplay") {
          clearClosingVdoTimers(false);
          if (overlayEl) overlayEl.classList.add("is-hidden");
          if (statusEl) statusEl.textContent = "⏸ ยกเลิก Autoplay แล้ว — กดปุ่ม ▶ เมื่อต้องการเริ่มเล่น";
        } else if (act === "unmute") {
          videoEl.muted = false;
          videoEl.volume = 1;
          btn.hidden = true;
          if (videoEl.paused) videoEl.play().catch(() => {});
        } else if (act === "toggle-play") {
          if (videoEl.paused) {
            startClosingVdoPlayback(modal, false);
          } else {
            videoEl.pause();
          }
        } else if (act === "cinema-toggle") {
          closingVdoState.cinemaFull = !closingVdoState.cinemaFull;
          if (splitEl) splitEl.classList.toggle("is-cinema-full", closingVdoState.cinemaFull);
          btn.textContent = closingVdoState.cinemaFull ? "◫ แสดงแถบสรุป" : "⤢ ขยายเต็มสไลด์";
          if (!closingVdoState.cinemaFull) {
            const c = splitEl && splitEl.closest(".or-slide-canvas");
            if (c) c._lastFitSig = "";
            requestAnimationFrame(() => fitAllVisibleCanvases());
          }
        } else if (act === "fullscreen") {
          startClosingVdoPlayback(modal, true);
        }
        if (typeof btn.blur === "function") btn.blur();
      });
    });
  }

  function crossfadePremStageTo(modal, nextCursor) {
    if (!modal) return;
    const stageEl = modal.querySelector("[data-prem-stage]");
    const vpEl = stageEl && stageEl.querySelector("[data-prem-viewport]");
    if (!stageEl || !vpEl) return;

    const n = premReelState.order.length || 1;
    premReelState.cursor = ((nextCursor % n) + n) % n;
    premReelState.kbFlip = !premReelState.kbFlip;

    const built = buildPremGridLayerInnerHtml(false);
    const numStr = `${String(built.curIdx + 1).padStart(2, "0")} / ${String(built.total).padStart(2, "0")}`;

    const counterEl = stageEl.querySelector("[data-prem-counter]");
    if (counterEl) counterEl.textContent = numStr;

    const ambEl = stageEl.querySelector("[data-prem-amb]");
    if (ambEl) {
      ambEl.style.backgroundImage = `url('${premImgHref(built.hero)}')`;
    }

    const oldLayers = Array.from(vpEl.querySelectorAll("[data-prem-layer]:not(.is-outgoing)"));
    oldLayers.forEach((old) => {
      old.classList.add("is-outgoing");
      setTimeout(() => {
        if (old.parentNode) old.parentNode.removeChild(old);
      }, 940);
    });

    const nextLayer = document.createElement("div");
    nextLayer.className = `or-prem-grid-layer ${built.layoutCls} is-entering-start`;
    nextLayer.setAttribute("data-prem-layer", "");
    nextLayer.innerHTML = built.innerHtml;
    vpEl.appendChild(nextLayer);

    void nextLayer.offsetWidth;
    requestAnimationFrame(() => {
      nextLayer.classList.remove("is-entering-start");
    });

    preloadPremUpcoming();
  }

  function schedulePremScreensaverTick(modal) {
    clearPremScreensaverTimer();
    if (!state.isOpen || state.viewMode !== "deck" || state.blackoutActive || premReelState.paused) return;
    const cur = SLIDES[state.slideIdx];
    if (!cur || cur.id !== "s02-prem-buri-founder") return;
    if (document.body.classList.contains("is-printing-orientation-deck") || window.__RACM_EXPORTING_DECK) return;

    premReelState.timerId = setTimeout(() => {
      premReelState.timerId = 0;
      if (!state.isOpen || state.viewMode !== "deck" || state.blackoutActive || premReelState.paused) return;
      const activeSlide = SLIDES[state.slideIdx];
      if (!activeSlide || activeSlide.id !== "s02-prem-buri-founder") return;
      crossfadePremStageTo(modal, premReelState.cursor + 1);
      schedulePremScreensaverTick(modal);
    }, PREM_SCREENSAVER_MS);
  }

  function wirePremScreensaver(modal) {
    const stageEl = modal && modal.querySelector("[data-prem-stage]");
    if (!stageEl || stageEl.classList.contains("is-static-mode")) return;

    preloadPremUpcoming();
    if (!state.blackoutActive && !premReelState.paused) {
      schedulePremScreensaverTick(modal);
    }

    stageEl.addEventListener("click", (ev) => {
      const ctrlBtn = ev.target && ev.target.closest && ev.target.closest("[data-prem-ctrl]");
      if (ctrlBtn) {
        ev.stopPropagation();
        const action = ctrlBtn.getAttribute("data-prem-ctrl");
        if (action === "prev") {
          crossfadePremStageTo(modal, premReelState.cursor - 1);
          if (!premReelState.paused) schedulePremScreensaverTick(modal);
        } else if (action === "next") {
          crossfadePremStageTo(modal, premReelState.cursor + 1);
          if (!premReelState.paused) schedulePremScreensaverTick(modal);
        } else if (action === "toggle") {
          premReelState.paused = !premReelState.paused;
          stageEl.classList.toggle("is-screensaver-paused", premReelState.paused);
          ctrlBtn.classList.toggle("is-paused", premReelState.paused);
          ctrlBtn.innerHTML = premToggleBtnHtml(premReelState.paused);
          if (premReelState.paused) {
            clearPremScreensaverTimer();
          } else {
            const prog = stageEl.querySelector(".or-prem-progress-fill");
            if (prog) {
              prog.style.animation = "none";
              void prog.offsetWidth;
              prog.style.animation = "";
            }
            schedulePremScreensaverTick(modal);
          }
        } else if (action === "shuffle") {
          premReelState.order = buildPremShuffledOrder();
          premReelState.paused = false;
          stageEl.classList.remove("is-screensaver-paused");
          const tBtn = stageEl.querySelector('[data-prem-ctrl="toggle"]');
          if (tBtn) {
            tBtn.classList.remove("is-paused");
            tBtn.innerHTML = premToggleBtnHtml(false);
          }
          crossfadePremStageTo(modal, 0);
          schedulePremScreensaverTick(modal);
        } else if (action === "expand") {
          premReelState.expanded = !premReelState.expanded;
          const splitEl = modal.querySelector("[data-prem-split]");
          if (splitEl) splitEl.classList.toggle("is-cinema-expanded", premReelState.expanded);
          ctrlBtn.classList.toggle("is-expanded-on", premReelState.expanded);
          ctrlBtn.innerHTML = premExpandBtnHtml(premReelState.expanded);
          crossfadePremStageTo(modal, premReelState.cursor);
          if (!premReelState.expanded) {
            requestAnimationFrame(() => fitAllVisibleCanvases());
          }
          if (!premReelState.paused) schedulePremScreensaverTick(modal);
        }
        if (typeof ctrlBtn.blur === "function") ctrlBtn.blur();
        return;
      }

      const mosaicTile = ev.target && ev.target.closest && ev.target.closest("[data-prem-jump-id]");
      if (mosaicTile) {
        ev.stopPropagation();
        const jumpId = mosaicTile.getAttribute("data-prem-jump-id");
        const foundIdx = premReelState.order.findIndex((x) => x.id === jumpId);
        if (foundIdx >= 0) {
          crossfadePremStageTo(modal, foundIdx);
          if (!premReelState.paused) schedulePremScreensaverTick(modal);
        }
        return;
      }

      const heroTile = ev.target && ev.target.closest && ev.target.closest("[data-prem-tile-hero]");
      if (heroTile) {
        ev.stopPropagation();
        crossfadePremStageTo(modal, premReelState.cursor + 1);
        if (!premReelState.paused) schedulePremScreensaverTick(modal);
      }
    });
  }

  function openDeck(initialSlideIdx, opts) {
    const o = opts || {};
    state.isOpen = true;
    state.toolsMenuOpen = false;
    state.clickerGuideOpen = false;
    state.blackoutActive = false;
    if (typeof initialSlideIdx === "number" && !Number.isNaN(initialSlideIdx)) {
      state.slideIdx = Math.max(0, Math.min(SLIDES.length - 1, initialSlideIdx));
      state.siteFocus = typeof o.siteFocus === "number" ? o.siteFocus : 0;
    } else if (typeof o.siteFocus === "number") {
      state.siteFocus = o.siteFocus;
    }
    if (o.viewMode) state.viewMode = o.viewMode;
    if (o.presentationMode || o.clickerStage) {
      state.presentationMode = true;
      state.clickerStage = Boolean(o.clickerStage);
    }
    syncHostSlideToLive();
    renderModal();
    if (o.presentationMode || o.clickerStage) {
      const modal = ensureModalElement();
      if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
    }
  }

  function closeDeck() {
    state.isOpen = false;
    state.autoPlay = false;
    state.toolsMenuOpen = false;
    state.clickerGuideOpen = false;
    state.blackoutActive = false;
    state.hudIdle = false;
    premReelState.wasOnSlide = false;
    clearPremScreensaverTimer();
    clearClosingVdoTimers(true);
    clearS02Timer();
    clearPipeTimer();
    clearJumpBuffer();
    clearHudIdleTimer();
    clearAutoPlayTimer();
    document.body.classList.remove("orient-deck-open");
    if (state.presentationMode || state.clickerStage) {
      state.presentationMode = false;
      state.clickerStage = false;
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
    const modal = document.getElementById("orientationDeckModal");
    if (modal) {
      modal.hidden = true;
      modal.classList.remove("is-presentation-mode", "is-clicker-stage", "is-hud-idle");
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
    toggleClickerStage,
    toggleBlackout,
    fitAllVisibleCanvases,
    getS02Focus: () => state.s02Focus,
    getHeroReveal: () => state.heroReveal,
    getPipeFocus: () => state.pipeFocus,
    getSiteFocus: () => state.siteFocus,
    setSiteFocus: (n) => applySiteFocusDom(n),
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
