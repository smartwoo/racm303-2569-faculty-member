/* ==========================================================================
   RACM 303 (2569) — SPSS Workshop: Mahidol IBM SPSS v31 Setup & Survey Analysis
   10-Slide 16:9 Widescreen Minimalist Keynote Deck (Clicker & Handout Ready)
   Instructor: อ. พญ.สวนีย์ ศรีเจริญธรรม · MUIT Software License Guide (v31)
   Session: วันอังคารที่ 8 ธันวาคม 2569 · 13.30 – 15.00 น. · ห้อง 2C2-03 & Zoom
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const ASSET_VER = "20261124spss1";
  const PPTX_HREF = `exports/pptx/RACM303_2569_SPSS_Workshop_Slides.pptx?v=${ASSET_VER}`;
  const PDF_HREF = `exports/pdf/RACM303_2569_SPSS_Workshop_Slides.pdf?v=${ASSET_VER}`;
  const MUIT_SPSS_URL = "https://muit.mahidol.ac.th/docs/users-guide/manual-install-programs/manual-spss/";
  const MUIT_DL_URL = "https://softwaredownload.mahidol.ac.th/";
  const MUIT_VPN_URL = "https://muit.mahidol.ac.th/docs/users-guide/manual-network-and-connectivity/manual-vpn/";
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
    viewMode: "deck", // "deck" | "sorter" | "handout"
    ioStageTheme: loadIoStageTheme(),
    hasManualIoTheme: false,
    zoomScale: 1,
    presentationMode: false,
    showNotes: ROLE === "faculty" && window.innerWidth >= 1024 && window.innerHeight >= 620,
    toolsMenuOpen: false,
    autoPlay: false,
    autoPlayTimeout: null,
    blackoutActive: false,
    resizeRaf: 0
  };

  function getEffectiveIoTheme() {
    if (document.body.classList.contains("is-printing-spss-deck") || state.viewMode === "handout") {
      return "light";
    }
    return state.ioStageTheme === "dark" ? "dark" : "light";
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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
    fullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`
  };

  const SLIDES = [
    {
      id: "spss-01-cover",
      num: "01",
      actClass: "is-act-2",
      actLabel: "SPSS WORKSHOP · PRE-FIELDWORK LAB",
      timeWindow: "อ. 8 ธ.ค. 2569 · 13.30 – 15.00 น.",
      kicker: "RACM 303 · STATISTICAL SOFTWARE FOR COMMUNITY HEALTH SURVEY",
      title: "ปฏิบัติการวิเคราะห์ข้อมูลสถิติด้วย IBM SPSS Statistics v31 (ลิขสิทธิ์ ม.มหิดล)",
      keyMessageHtml:
        "เตรียมเครื่องให้พร้อมก่อนเข้าคาบ <strong>SPSS Workshop</strong> และก่อนลงพื้นที่ภาคสนาม 9 แห่ง — ดาวน์โหลดผ่านอินทราเน็ต/VPN ม.มหิดล ตั้งค่า <code>Concurrent user license</code> ชี้เซิร์ฟเวอร์ <code>spss-mu.mahidol</code> และฝึกวิเคราะห์ครบ 4 ขั้นตอนสู่ <code>ฟอร์ม 4A</code>",
      notes:
        "สไลด์เปิดคาบปฏิบัติการ SPSS Workshop วันอังคารที่ 8 ธันวาคม 2569 เวลา 13.30–15.00 น. ณ ห้อง 2C2-03 และ Zoom (Meeting ID: 952 7054 4175 / Passcode: 756928) โดย อ. พญ.สวนีย์ ศรีเจริญธรรม แนะนำให้นักศึกษาดาวน์โหลดและติดตั้ง IBM SPSS Statistics v31 ลิขสิทธิ์มหาวิทยาลัยมหิดลให้เรียบร้อยก่อนวันเรียนและก่อนออกเดินทางสู่ รพ.ภาคสนาม",
      isCover: true
    },
    {
      id: "spss-02-license-vpn",
      num: "02",
      actClass: "is-act-2",
      actLabel: "PART 1 · MAHIDOL LICENSE & VPN",
      timeWindow: "เตรียมเครื่องล่วงหน้า · เงื่อนไขสำคัญ",
      kicker: "01 · MAHIDOL UNIVERSITY CONCURRENT LICENSE & NETWORK REQUIREMENT",
      title: "เงื่อนไขสิทธิ์การใช้งาน IBM SPSS v31 ม.มหิดล: เครือข่ายภายใน & Mahidol VPN",
      keyMessageHtml:
        "IBM SPSS Statistics v31 ของ ม.มหิดล เป็นลิขสิทธิ์แบบ <strong>Concurrent User</strong> ที่ต้องเชื่อมต่อ <strong>เครือข่าย ม.มหิดล (MU-WiFi / LAN)</strong> หรือต่อ <strong>Mahidol VPN</strong> ทุกครั้งทั้งขณะดาวน์โหลด Activate และเปิดใช้งานในพื้นที่ภาคสนาม",
      notes:
        "ย้ำจุดที่นักศึกษาพบบ่อยที่สุดเวลาลงพื้นที่โรงพยาบาลชุมชน 9 แห่ง: หากอยู่นอกเครือข่ายมหาวิทยาลัยมหิดลแล้วไม่ได้เชื่อมต่อ Mahidol VPN ก่อนเปิดโปรแกรม SPSS โปรแกรมจะมองไม่เห็น License Server (spss-mu.mahidol) และเปิดใช้งานไม่ได้ จึงควรติดตั้งทั้งตัวโปรแกรม SPSS และตัวลูกข่าย Mahidol VPN ให้พร้อมตั้งแต่อยู่ที่รามาธิบดี",
      render: () => `
        <div class="or-grid-3" data-fit-group="cards" style="height:100%">
          <div class="or-card is-navy-tint is-vcenter">
            <span class="or-card-kicker">1 · เวอร์ชันและระบบปฏิบัติการที่รองรับ (MUIT 2569)</span>
            <h3 class="or-card-title">IBM SPSS Statistics Version 31</h3>
            <ul class="or-list">
              <li><strong>เวอร์ชันแนะนำล่าสุด:</strong> <code>IBM SPSS Statistics v31</code> (มี v30 สำรองในระบบสำหรับเครื่องรุ่นเก่า)</li>
              <li><strong>Microsoft Windows:</strong> รองรับ <strong>Windows 10 และ Windows 11 (64-bit)</strong> ขึ้นไป</li>
              <li><strong>Apple macOS:</strong> รองรับ <strong>macOS 10.15 (Catalina) ขึ้นไป</strong> ทั้งชิป Apple Silicon (M1–M4) และ Intel</li>
            </ul>
          </div>

          <div class="or-card is-amber-tint is-vcenter">
            <span class="or-card-kicker">2 · กฎเหล็กเมื่อใช้นอกมหาวิทยาลัย / ภาคสนาม 9 แห่ง</span>
            <h3 class="or-card-title">ต้องต่อ MU-WiFi หรือ Mahidol VPN ทุกครั้ง!</h3>
            <ul class="or-list">
              <li><strong>ในพื้นที่คณะฯ / ม.มหิดล:</strong> เชื่อมต่อผ่าน <code>MU-WiFi</code>, <code>eduroam</code> หรือสาย LAN ของมหาวิทยาลัยได้ทันที</li>
              <li><strong>นอกมหาวิทยาลัย (หอพัก / บ้าน / รพ.ภาคสนาม):</strong> ต้องเปิดเชื่อมต่อ <strong>Mahidol VPN</strong> ก่อนเปิดโปรแกรม SPSS ทุกครั้ง</li>
              <li><strong>คำแนะนำสำคัญ:</strong> ติดตั้งและทดสอบล็อกอิน VPN ให้ผ่านตั้งแต่วันนี้ก่อนเดินทางลงพื้นที่จริง</li>
            </ul>
          </div>

          <div class="or-card is-teal-tint is-vcenter">
            <span class="or-card-kicker">3 · ระบบโควตาสิทธิ์ใช้งานพร้อมกัน</span>
            <h3 class="or-card-title">Concurrent User License คืออะไร?</h3>
            <ul class="or-list">
              <li>มหาวิทยาลัยให้บริการลิขสิทธิ์แบบ<strong>แบ่งปันจำนวนผู้ใช้งานพร้อมกัน (Concurrent User)</strong></li>
              <li>หากขณะนั้นมีผู้ใช้งานเต็มจำนวนโควตา ระบบจะแจ้งเตือนเข้าไม่ได้ชั่วคราว ให้เว้นช่วงแล้วเข้าใหม่</li>
              <li><strong>มารยาทการใช้งานร่วมกัน:</strong> เมื่อวิเคราะห์เสร็จและบันทึกไฟล์แล้ว <strong>ควรปิดโปรแกรม SPSS ทุกครั้ง</strong> เพื่อคืนสิทธิ์ให้เพื่อนกลุ่มอื่นใช้งานต่อ</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "spss-03-download-portal",
      num: "03",
      actClass: "is-act-2",
      actLabel: "PART 1 · DOWNLOAD CENTER",
      timeWindow: "ขั้นตอนที่ 1 · ดาวน์โหลดตัวติดตั้ง",
      kicker: "01 · MAHIDOL SOFTWARE DOWNLOAD CENTER (INTRANET ONLY)",
      title: "ช่องทางดาวน์โหลดตัวติดตั้ง IBM SPSS v31 และคู่มือทางการของกองเทคโนโลยีสารสนเทศ (MUIT)",
      keyMessageHtml:
        "เชื่อมต่อ <code>MU-WiFi</code> หรือ <strong>Mahidol VPN</strong> ก่อนเข้าสู่เว็บไซต์ <code>https://softwaredownload.mahidol.ac.th/</code> (เข้าได้เฉพาะเครือข่ายภายในอินทราเน็ต ม.มหิดล เท่านั้น)",
      notes:
        "อธิบายลำดับการเข้าไปดาวน์โหลดตัวติดตั้งจากระบบ Software Download Center ของกองเทคโนโลยีสารสนเทศ มหาวิทยาลัยมหิดล (MUIT) ซึ่งเปิดให้เข้าเฉพาะภายในเครือข่ายอินทราเน็ต หากกดเข้าจากอินเทอร์เน็ตบ้านหรือมือถือโดยไม่ต่อ VPN หน้าเว็บจะไม่โหลด",
      render: () => `
        <div class="or-grid-2" data-fit-group="cards" style="height:100%">
          <div class="or-card is-white is-vcenter">
            <span class="or-card-kicker">STEP A · เตรียมเครือข่าย &amp; เข้าเว็บดาวน์โหลดซอฟต์แวร์ลิขสิทธิ์</span>
            <h3 class="or-card-title">ดาวน์โหลดผ่าน Software Download Center</h3>
            <ul class="or-list">
              <li><strong>1. เชื่อมต่อเครือข่ายภายใน:</strong> ต่อ <code>MU-WiFi</code> หรือเปิดโปรแกรม <strong>Mahidol VPN Client</strong> แล้วล็อกอินด้วยบัญชีนักศึกษา (<code>name.sur</code>)</li>
              <li><strong>2. เข้าสู่ระบบดาวน์โหลด:</strong> เปิดเบราว์เซอร์ไปที่ <code>https://softwaredownload.mahidol.ac.th/</code> <em>(เฉพาะเครือข่ายอินทราเน็ต ม.มหิดล เท่านั้น)</em></li>
              <li><strong>3. เลือกไฟล์ติดตั้งตามเครื่องของตน:</strong>
                <br>• สำหรับ Windows: <code>IBM SPSS Statistics V31 For Windows.zip</code>
                <br>• สำหรับ Mac: <code>IBM SPSS Statistics V31 For MAC.zip</code></li>
            </ul>
          </div>

          <div class="or-card is-navy-tint is-vcenter">
            <span class="or-card-kicker">STEP B · ลิงก์คู่มือทางการ MUIT &amp; ช่องทางติดต่อช่วยเหลือ</span>
            <h3 class="or-card-title">คู่มือการติดตั้งทีละภาพ (MUIT User Guide)</h3>
            <ul class="or-list">
              <li><strong>คู่มือรวมโปรแกรม SPSS (MUIT):</strong><br><a href="${MUIT_SPSS_URL}" target="_blank" rel="noopener" style="color:var(--or-blue);font-weight:700;text-decoration:underline">muit.mahidol.ac.th/docs/users-guide/manual-install-programs/manual-spss/ ↗</a></li>
              <li><strong>คู่มือติดตั้งและใช้งาน Mahidol VPN (Windows / macOS / iOS / Android):</strong><br><a href="${MUIT_VPN_URL}" target="_blank" rel="noopener" style="color:var(--or-blue);font-weight:700;text-decoration:underline">muit.mahidol.ac.th/docs/users-guide/manual-network-and-connectivity/manual-vpn/ ↗</a></li>
              <li><strong>ติดต่อแจ้งปัญหา IT ม.มหิดล (MUIT Helpdesk):</strong> โทร. <code>02-849-6022</code> หรืออีเมล <code>consult@mahidol.ac.th</code></li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "spss-04-install-windows",
      num: "04",
      actClass: "is-act-2",
      actLabel: "PART 1 · WINDOWS INSTALLATION",
      timeWindow: "ขั้นตอนที่ 2A · สำหรับ Windows 10 / 11",
      kicker: "01 · INSTALLING IBM SPSS STATISTICS V31 ON MICROSOFT WINDOWS",
      title: "ขั้นตอนการติดตั้ง IBM SPSS Statistics v31 บนระบบปฏิบัติการ Microsoft Windows",
      keyMessageHtml:
        "แตกไฟล์ <code>.zip</code> ออกมาก่อนเสมอ &rarr; คลิกขวาที่ <code>SPSSStatistics.exe</code> เลือก <strong>Run as administrator</strong> &rarr; ติดตั้งจนเสร็จแล้วกด <strong>Launch License Wizard</strong>",
      notes:
        "ชี้แจงขั้นตอนการติดตั้งบน Windows 10 และ Windows 11 ตามคู่มือ MUIT: ต้อง Extract ไฟล์ซิปออกเป็นโฟลเดอร์ปกติก่อน (ห้ามดับเบิลคลิกรันจากข้างในซิปโดยตรง) และคลิกขวาเลือก Run as administrator เพื่อให้สิทธิ์เขียนไฟล์ระบบและลงทะเบียน License Wizard ได้สมบูรณ์ พร้อมแนะนำวิธีแก้ฟอนต์ภาษาไทยหากเครื่องใดแสดงสระเป็นสี่เหลี่ยม",
      render: () => `
        <div class="or-grid-2" data-fit-group="cards" style="height:100%">
          <div class="or-card is-white is-vcenter">
            <span class="or-card-kicker">ขั้นตอนที่ 1 – 8 · การติดตั้งตัวโปรแกรมหลัก (Windows)</span>
            <h3 class="or-card-title">แตกไฟล์ซิป &amp; รันด้วยสิทธิ์ผู้ดูแลระบบ</h3>
            <ul class="or-list">
              <li><strong>1–2. Extract ไฟล์:</strong> แตกไฟล์ <code>IBM SPSS Statistics V31 For Windows.zip</code> ออกเป็นโฟลเดอร์ จะพบไฟล์ติดตั้ง <code>SPSSStatistics.exe</code></li>
              <li><strong>3. Run as administrator:</strong> คลิกขวาที่ไฟล์ <code>SPSSStatistics.exe</code> แล้วเลือก <strong>Run as administrator</strong></li>
              <li><strong>4–7. InstallShield Wizard:</strong> คลิก <code>Next</code> &rarr; เลือก <em>I accept the terms in the license agreement</em> &rarr; เลือกโฟลเดอร์ติดตั้งมาตรฐาน &rarr; คลิก <strong>Install</strong></li>
              <li><strong>8–9. เสร็จสิ้นการติดตั้ง:</strong> คลิก <code>Finish</code> แล้วคลิกปุ่ม <strong>Launch License Wizard</strong> เพื่อเข้าสู่ขั้นตอนผูกสิทธิ์</li>
            </ul>
          </div>

          <div class="or-card is-teal-tint is-vcenter">
            <span class="or-card-kicker">ทิปสำคัญสำหรับภาษาไทยบน WINDOWS</span>
            <h3 class="or-card-title">การตั้งค่าให้แสดงผลภาษาไทยครบถ้วนไม่เป็นสี่เหลี่ยม</h3>
            <ul class="or-list">
              <li>ในเครื่อง Windows บางเครื่อง หากเปิดตารางข้อมูลหรือกราฟภาษาไทยแล้วตัวอักษรแสดงเป็นสี่เหลี่ยม:</li>
              <li>ให้คัดลอกโฟลเดอร์ฟอนต์ <strong><code>fallback</code></strong> (ที่แนบมากับชุดติดตั้งของ MUIT) ไปวางไว้ที่พาธ:<br><code>C:\\Program Files\\IBM\\SPSS Statistics\\JRE\\lib\\fonts</code></li>
              <li><em>หมายเหตุ:</em> หากในโฟลเดอร์ <code>lib</code> ยังไม่มีโฟลเดอร์ชื่อ <code>fonts</code> ให้สร้าง New Folder ตั้งชื่อว่า <code>fonts</code> ก่อนแล้วจึงวางโฟลเดอร์ <code>fallback</code> ลงไป จากนั้นเปิดโปรแกรมใหม่</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "spss-05-install-macos",
      num: "05",
      actClass: "is-act-2",
      actLabel: "PART 1 · macOS INSTALLATION",
      timeWindow: "ขั้นตอนที่ 2B · สำหรับ macOS 10.15+",
      kicker: "01 · INSTALLING IBM SPSS STATISTICS V31 ON APPLE macOS",
      title: "ขั้นตอนการติดตั้ง IBM SPSS Statistics v31 บนระบบปฏิบัติการ Apple macOS",
      keyMessageHtml:
        "แตกไฟล์ <code>IBM SPSS Statistics V31 For MAC.zip</code> &rarr; คลิกขวาที่ <code>Stats 31_MAC.pkg</code> เลือก <strong>Open</strong> &rarr; ยืนยันรหัสผ่านเครื่อง Mac &rarr; กด <strong>Launch License Wizard</strong>",
      notes:
        "ชี้แจงขั้นตอนสำหรับนักศึกษาที่ใช้ MacBook (macOS 10.15 ขึ้นไป): การคลิกขวาที่ไฟล์ .pkg แล้วเลือก Open ช่วยให้ macOS Gatekeeper อนุญาตการเปิดแพ็กเกจตัวติดตั้งได้อย่างราบรื่น จากนั้นกรอกรหัสผ่านปลดล็อกเครื่อง Mac จนติดตั้งเสร็จแล้วกด Close เพื่อเปิด License Wizard",
      render: () => `
        <div class="or-grid-2" data-fit-group="cards" style="height:100%">
          <div class="or-card is-white is-vcenter">
            <span class="or-card-kicker">ขั้นตอนที่ 1 – 9 · การติดตั้งตัวโปรแกรมหลัก (macOS)</span>
            <h3 class="or-card-title">ติดตั้งแพ็กเกจ Stats 31_MAC.pkg</h3>
            <ul class="or-list">
              <li><strong>1–2. Extract ไฟล์:</strong> แตกไฟล์ <code>IBM SPSS Statistics V31 For MAC.zip</code> จะพบไฟล์ <code>Stats 31_MAC.pkg</code></li>
              <li><strong>3. คลิกขวาเลือก Open:</strong> คลิกขวา (หรือ Control-Click) ที่ไฟล์ <code>Stats 31_MAC.pkg</code> แล้วเลือก <strong>Open</strong></li>
              <li><strong>4–6. ตัวช่วยติดตั้ง:</strong> คลิก <code>Continue</code> &rarr; อ่านข้อตกลงแล้วคลิก <code>Continue</code> และ <strong>Agree</strong> &rarr; คลิก <strong>Install</strong></li>
              <li><strong>7–9. ยืนยันสิทธิ์ &amp; เปิด Wizard:</strong> กรอกรหัสผ่านเครื่อง Mac (หรือสแกน Touch ID) รอติดตั้งจนเสร็จ คลิก <code>Close</code> แล้วคลิกปุ่ม <strong>Launch License Wizard</strong></li>
            </ul>
          </div>

          <div class="or-card is-amber-tint is-vcenter">
            <span class="or-card-kicker">ข้อควรรู้สำหรับผู้ใช้ MACBOOK</span>
            <h3 class="or-card-title">การอนุญาตสิทธิ์ไฟล์ &amp; การเปิด License Wizard ซ้ำ</h3>
            <ul class="or-list">
              <li><strong>สิทธิ์เข้าถึงโฟลเดอร์:</strong> เมื่อเปิด SPSS ครั้งแรกแล้วระบบถามสิทธิ์เข้าถึงโฟลเดอร์ <em>Documents / Downloads / Desktop</em> ให้กด <strong>Allow (อนุญาต)</strong> เพื่อเปิดไฟล์ <code>.sav</code> และ <code>.xlsx</code> ได้สะดวก</li>
              <li><strong>กรณีเผลอปิดหน้าต่าง License Wizard ไปก่อน:</strong> สามารถเข้าไปเปิดซ้ำได้ที่ <code>Applications &rarr; IBM SPSS Statistics &rarr; License Authorization Wizard</code> (ต้องต่อ MU-WiFi หรือ VPN อยู่ขณะทำรายการ)</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "spss-06-license-activation",
      num: "06",
      actClass: "is-act-3",
      actLabel: "PART 1 · LICENSE SERVER ACTIVATION",
      timeWindow: "ขั้นตอนที่ 3 · หัวใจสำคัญที่สุด",
      kicker: "01 · PRODUCT AUTHORIZATION · CONCURRENT LICENSE SERVER",
      title: "การ Activate License กับเซิร์ฟเวอร์ ม.มหิดล (spss-mu.mahidol) และการตรวจสอบความพร้อม",
      keyMessageHtml:
        "ในหน้าต่าง <strong>Product Authorization</strong> ให้เลือก <strong><code>Concurrent user license</code></strong> (ไม่ใช่ Authorized user) แล้วกรอกชื่อเซิร์ฟเวอร์ว่า <strong><code>spss-mu.mahidol</code></strong>",
      notes:
        "เน้นย้ำ 2 จุดที่ห้ามเลือกผิดเด็ดขาด: (1) ต้องเลือก Concurrent user license เท่านั้น ไม่ใช่ Authorized user license เพราะมหาวิทยาลัยใช้ระบบ License Manager กลาง และ (2) พิมพ์ชื่อเซิร์ฟเวอร์ spss-mu.mahidol ให้ถูกต้องทุกตัวอักษรโดยไม่มีเว้นวรรค พร้อมเชื่อมต่อ MU-WiFi หรือ Mahidol VPN",
      render: () => `
        <div class="or-grid-2" data-fit-group="cards" style="height:100%">
          <div class="or-card is-navy-tint is-vcenter">
            <span class="or-card-kicker">ขั้นตอนที่ 10 – 14 · IBM SPSS LICENSE AUTHORIZATION WIZARD</span>
            <h3 class="or-card-title">ตั้งค่า Concurrent License ชี้ไปที่ spss-mu.mahidol</h3>
            <ul class="or-list">
              <li><strong>ขั้นที่ 10 (เลือกประเภทสิทธิ์):</strong> หน้าต่าง <em>Product Authorization</em> เลือกตัวเลือกที่ 2: <strong><code>Concurrent user license</code></strong> <em>(My organization purchased the product and my administrator gave me a computer name...)</em> แล้วคลิก <code>Next</code></li>
              <li><strong>ขั้นที่ 11 (ระบุชื่อเซิร์ฟเวอร์):</strong> ช่อง <em>License Manager Server Name</em> พิมพ์คำว่า:<br><code style="font-size:1.15em;font-weight:800;padding:3px 10px">spss-mu.mahidol</code> แล้วคลิก <code>Next</code></li>
              <li><strong>ขั้นที่ 12–14 (เสร็จสมบูรณ์):</strong> เมื่อขึ้นสถานะสำเร็จ คลิก <code>Finish</code> และกด <strong>Restart Program</strong> เพื่อเข้าใช้งานได้ทันที</li>
            </ul>
          </div>

          <div class="or-card is-white is-vcenter">
            <span class="or-card-kicker">TROUBLESHOOTING · วิธีแก้ปัญหาที่พบบ่อยก่อนเข้า Workshop</span>
            <h3 class="or-card-title">เช็กลิสต์ตรวจสอบตัวเองก่อนวันอังคารที่ 8 ธ.ค. 69</h3>
            <ul class="or-list">
              <li><strong>ขึ้น Error ไม่พบ License / Server Unreachable:</strong> ตรวจสอบว่าเชื่อมต่อ <code>MU-WiFi</code> หรือเปิด <strong>Mahidol VPN</strong> สำเร็จแล้วหรือยัง แล้วลองเปิดโปรแกรมใหม่อีกครั้ง</li>
              <li><strong>ตรวจสอบเวอร์ชันโปรแกรม:</strong> เปิด SPSS ไปที่เมนู <code>Help &rarr; About</code> (Windows) หรือ <code>IBM SPSS Statistics &rarr; About</code> (Mac) ต้องแสดงเวอร์ชัน <strong>31.x</strong> และสถานะ License ใช้งานได้</li>
              <li><strong>ทดสอบเปิดไฟล์ข้อมูลจำลอง:</strong> ลองสร้างตัวแปรสั้น ๆ บันทึกเป็นไฟล์ <code>.sav</code> และเปิดหน้าต่าง Output เพื่อยืนยันความพร้อม 100%</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "spss-07-step1-codebook",
      num: "07",
      actClass: "is-act-2",
      actLabel: "WORKSHOP STEP 01 · CODEBOOK",
      timeWindow: "ปฏิบัติการขั้นที่ 1 · โครงสร้างฐานข้อมูล",
      kicker: "02 · VARIABLE VIEW & COMMUNITY HEALTH SURVEY CODEBOOK",
      title: "Step 01 · การออกแบบโครงสร้างฐานข้อมูล (Variable View) และรหัสตัวแปร (Codebook)",
      keyMessageHtml:
        "ก่อนคีย์ข้อมูลจากแบบสอบถามชุมชน ต้องสร้าง <strong>Codebook มาตรฐานเดียวกันทั้งกลุ่ม</strong> และตั้งค่าในแท็บ <strong>Variable View</strong> ให้ครบทั้ง <code>Name · Type · Label · Values · Missing · Measure</code>",
      notes:
        "เข้าสู่เนื้อหาปฏิบัติการ SPSS 4 ขั้นตอนสำหรับการสำรวจสุขภาพชุมชน: ขั้นที่ 1 คือการวางโครงสร้าง Variable View ให้ตรงกันทั้งกลุ่มโรงพยาบาลภาคสนาม เพื่อป้องกันปัญหาการรวมไฟล์ข้อมูล (Merge Files) เมื่อแบ่งกันคีย์ข้อมูลในพื้นที่",
      render: () => `
        <div class="or-table-wrap" data-fit-table="1">
          <table class="or-table">
            <colgroup>
              <col style="width:16%" />
              <col style="width:36%" />
              <col style="width:48%" />
            </colgroup>
            <thead>
              <tr>
                <th>คอลัมน์ใน Variable View</th>
                <th>หลักการตั้งค่าที่ถูกต้อง</th>
                <th>ตัวอย่างจริงจากแบบสอบถาม Health Survey ภาคสนาม</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong><code>Name</code></strong></td>
                <td>ชื่อตัวแปรสั้น กระชับ ภาษาอังกฤษ ห้ามเว้นวรรค ห้ามขึ้นต้นด้วยตัวเลข</td>
                <td><code>resp_id</code>, <code>age_yr</code>, <code>sex</code>, <code>ht_status</code>, <code>sbp_mean</code>, <code>salt_score</code></td>
              </tr>
              <tr>
                <td><strong><code>Type</code></strong></td>
                <td>ใช้ <strong>Numeric</strong> เป็นหลักแม้เป็นตัวแปรกลุ่ม (ใช้รหัสตัวเลขแทนข้อความเพื่อวิเคราะห์สถิติได้ทันที)</td>
                <td><code>Numeric</code> (ความกว้าง 8, ทศนิยม 0 สำหรับรหัสกลุ่ม หรือ 1–2 สำหรับค่าต่อเนื่อง เช่น BMI, HbA1c)</td>
              </tr>
              <tr>
                <td><strong><code>Label</code></strong></td>
                <td>คำอธิบายชื่อตัวแปรเต็มพร้อมหน่วยวัด (แสดงบนหัวตาราง Output อัตโนมัติ)</td>
                <td><code>อายุของผู้ตอบแบบสอบถาม (ปี)</code>, <code>ภาวะความดันโลหิตสูงที่ได้รับการวินิจฉัย</code></td>
              </tr>
              <tr>
                <td><strong><code>Values</code></strong></td>
                <td>กำหนดความหมายของรหัสตัวเลขทุกค่าให้ชัดเจนตรงกันทั้งทีม</td>
                <td><code>0 = ไม่มีภาวะ HT</code>, <code>1 = มีภาวะ HT</code> · หรือเพศ <code>1 = ชาย</code>, <code>2 = หญิง</code></td>
              </tr>
              <tr>
                <td><strong><code>Missing</code></strong></td>
                <td>กำหนดรหัสข้อมูลสูญหาย (User-Missing) แยกจากค่าจริง เพื่อไม่ให้ดึงค่าเฉลี่ยเพี้ยน!</td>
                <td>กำหนด Discrete missing values เป็น <code>99</code> หรือ <code>999</code> (กรณีผู้ตอบไม่ทราบ/ไม่ตอบ/ไม่มีผลตรวจ)</td>
              </tr>
              <tr>
                <td><strong><code>Measure</code></strong></td>
                <td>เลือกระดับการวัดให้ตรงชนิดตัวแปร (เชื่อมความรู้พื้นฐาน <code>RAGE 201</code>)</td>
                <td><strong>Nominal</strong> (เพศ/สิทธิรักษา) · <strong>Ordinal</strong> (ระดับความรู้ ต่ำ/กลาง/สูง) · <strong>Scale</strong> (อายุ, BMI, SBP)</td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    },
    {
      id: "spss-08-step2-cleaning",
      num: "08",
      actClass: "is-act-2",
      actLabel: "WORKSHOP STEP 02 · CLEANING & RECODE",
      timeWindow: "ปฏิบัติการขั้นที่ 2 · เตรียมข้อมูล",
      kicker: "02 · DATA SCREENING, RECODING INTO DIFFERENT VARIABLES & COMPUTE",
      title: "Step 02 · การตรวจสอบความถูกต้องของข้อมูล (Data Cleaning) การจัดกลุ่มและคำนวณตัวแปรใหม่",
      keyMessageHtml:
        "ตรวจหาค่าผิดปกติ (Out-of-range / Missing) ก่อนวิเคราะห์เสมอ และเมื่อจัดกลุ่มตัวแปรต่อเนื่องเป็นช่วงต้องใช้ <strong><code>Recode into Different Variables</code></strong> เพื่อ<strong>ไม่เขียนทับข้อมูลดิบเดิม</strong>",
      notes:
        "ย้ำข้อผิดพลาดคลาสสิกในการทำงานวิจัยภาคสนาม: ห้ามใช้ Recode into Same Variables เด็ดขาด เพราะจะทำให้ค่าต่อเนื่องเดิม เช่น อายุ หรือความดันโลหิต หายไปทันที ให้สร้างเป็นตัวแปรใหม่เสมอ เช่น age_yr -> age_grp",
      render: () => `
        <div class="or-grid-3" data-fit-group="cards" style="height:100%">
          <div class="or-card is-white is-vcenter">
            <span class="or-card-kicker">1 · DATA CLEANING &amp; SCREENING</span>
            <h3 class="or-card-title">ตรวจกรองข้อมูลผิดปกติก่อนรันสถิติ</h3>
            <ul class="or-list">
              <li>ใช้เมนู <code>Analyze &rarr; Descriptive Statistics &rarr; Frequencies</code> หรือ <code>Descriptives</code></li>
              <li>เช็กค่า <strong>Minimum – Maximum</strong> ของตัวแปรต่อเนื่อง (เช่น อายุเป็น <code>250</code> จากการพิมพ์เกิน) และเช็กรหัสแปลกปลอมในตัวแปรกลุ่ม</li>
              <li>ใช้ <code>Data &rarr; Sort Cases</code> หรือ <code>Select Cases</code> เพื่อกลับไปตรวจสอบกับแบบสอบถามต้นฉบับตาม <code>resp_id</code></li>
            </ul>
          </div>

          <div class="or-card is-amber-tint is-vcenter">
            <span class="or-card-kicker">2 · TRANSFORM &rarr; RECODE</span>
            <h3 class="or-card-title">จัดกลุ่มช่วงค่าด้วย Recode into Different Variables</h3>
            <ul class="or-list">
              <li>ไปที่ <code>Transform &rarr; Recode into Different Variables</code> <em>(ห้ามใช้ Same Variables!)</em></li>
              <li>ตั้งชื่อ Output Variable ใหม่ เช่น <code>bmi</code> &rarr; <code>bmi_cat</code> แล้วคลิก <strong>Old and New Values</strong></li>
              <li>กำหนดช่วง เช่น <code>Range, LOWEST through 22.99 &rarr; 0</code> (ปกติ) และ <code>23.00 through HIGHEST &rarr; 1</code> (น้ำหนักเกิน/อ้วน) และคง <code>System- or user-missing &rarr; System-missing</code></li>
            </ul>
          </div>

          <div class="or-card is-teal-tint is-vcenter">
            <span class="or-card-kicker">3 · TRANSFORM &rarr; COMPUTE VARIABLE</span>
            <h3 class="or-card-title">คำนวณดัชนีสุขภาพและคะแนนรวม</h3>
            <ul class="or-list">
              <li>ไปที่ <code>Transform &rarr; Compute Variable</code></li>
              <li><strong>คำนวณ BMI:</strong> Target Variable = <code>bmi</code> · Numeric Expression = <code>weight_kg / ((height_cm / 100) ** 2)</code></li>
              <li><strong>คำนวณคะแนนรวมพฤติกรรม/ความรู้:</strong> ใช้ <code>q1 + q2 + q3 + q4 + q5</code> หรือฟังก์ชัน <code>SUM(q1 to q5)</code> แล้วอย่าลืมตั้ง Label ใน Variable View</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "spss-09-step3-descriptive",
      num: "09",
      actClass: "is-act-3",
      actLabel: "WORKSHOP STEP 03 · DESCRIPTIVE STATS",
      timeWindow: "ปฏิบัติการขั้นที่ 3 · สถิติเชิงพรรณนา",
      kicker: "02 · DESCRIPTIVE ANALYSIS · LINKING RAGE 201 & EP6–EP7",
      title: "Step 03 · การวิเคราะห์สถิติเชิงพรรณนาของชุมชน (Frequencies & Explore)",
      keyMessageHtml:
        "ตัวแปรเชิงกลุ่มรายงานเป็น <strong>จำนวนและร้อยละ <code>n (%)</code> (Valid Percent)</strong> · ตัวแปรเชิงปริมาณตรวจสอบการแจกแจงด้วย <code>Explore</code> เพื่อเลือกรายงาน <strong><code>Mean &plusmn; SD</code></strong> (แจกแจงปกติ) หรือ <strong><code>Median (IQR)</code></strong> (ข้อมูลเบ้)",
      notes:
        "เชื่อมโยงความรู้ RAGE 201 และ EP6–EP7 เข้าสู่การสร้างตารางที่ 1 (ลักษณะทั่วไปของกลุ่มตัวอย่างและความชุกของปัญหาสุขภาพในชุมชน) โดยเน้นให้ดูคอลัมน์ Valid Percent เมื่อมีข้อมูลสูญหาย และตรวจ Histogram/Shapiro-Wilk ก่อนเลือกค่ากลาง",
      render: () => `
        <div class="or-grid-2" data-fit-group="cards" style="height:100%">
          <div class="or-card is-white is-vcenter">
            <span class="or-card-kicker">CATEGORICAL VARIABLES · ตัวแปรเชิงกลุ่ม (Nominal / Ordinal)</span>
            <h3 class="or-card-title">Analyze &rarr; Descriptive Statistics &rarr; Frequencies</h3>
            <ul class="or-list">
              <li>เลือกตัวแปรเชิงกลุ่ม เช่น เพศ อาชีพ สิทธิการรักษา พฤติกรรมเสี่ยง และสถานะโรค (มี/ไม่มีโรค)</li>
              <li><strong>การอ่านผล Output:</strong> อ่านจำนวน <code>Frequency (n)</code> คู่กับ <strong><code>Valid Percent (%)</code></strong> (ซึ่งตัด Missing ออกให้ถูกต้องแล้ว) และระบุจำนวน <code>n</code> ที่มีข้อมูลจริงกำกับไว้ในตารางเสมอ</li>
              <li><strong>การรายงานความชุก (Prevalence):</strong> สามารถหา 95% CI ของสัดส่วนเพิ่มเติมผ่าน <code>Analyze &rarr; Descriptive Statistics &rarr; Proportion</code> (ใน SPSS v31!)</li>
            </ul>
          </div>

          <div class="or-card is-navy-tint is-vcenter">
            <span class="or-card-kicker">CONTINUOUS VARIABLES · ตัวแปรเชิงปริมาณต่อเนื่อง (Scale)</span>
            <h3 class="or-card-title">Analyze &rarr; Descriptive Statistics &rarr; Explore</h3>
            <ul class="or-list">
              <li>ใส่ตัวแปรต่อเนื่องในช่อง <em>Dependent List</em> &rarr; คลิกปุ่ม <code>Plots</code> ติ๊ก <strong>Histogram</strong> และ <strong>Normality plots with tests</strong></li>
              <li><strong>กรณีแจกแจงปกติ (Symmetric / Normal):</strong> รายงานค่าเฉลี่ยและส่วนเบี่ยงเบนมาตรฐาน <strong><code>Mean &plusmn; SD</code></strong> (พร้อมค่า Min–Max หากต้องการ)</li>
              <li><strong>กรณีข้อมูลเบ้หรือมีค่าสุดโต่ง (Skewed / Outliers เช่น รายได้ ค่ารักษา ระยะเวลารอคอย):</strong> รายงานค่ามัธยฐานและพิสัยควอไทล์ <strong><code>Median (IQR)</code> หรือ <code>Median (Q1–Q3)</code></strong></li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "spss-10-step4-analytical-4a",
      num: "10",
      actClass: "is-act-3",
      actLabel: "WORKSHOP STEP 04 · ANALYTICAL & FORM 4A",
      timeWindow: "ปฏิบัติการขั้นที่ 4 · ทดสอบสมมติฐานสู่ฟอร์ม 4A",
      kicker: "02 · BIVARIATE ANALYSIS, EFFECT SIZE, 95% CI & FORM 4A PRESENTATION",
      title: "Step 04 · การทดสอบความสัมพันธ์และแปลผลสู่งานนำเสนอระบาดวิทยา (ฟอร์ม 4A)",
      keyMessageHtml:
        "รายงานทั้ง <strong>ขนาดผลกระทบ (Effect Size เช่น OR / Prevalence Ratio / Mean Diff)</strong> คู่กับ <strong><code>95% CI</code> และ <code>p-value</code></strong> พร้อมอภิปรายทั้ง<strong>นัยสำคัญทางสถิติและนัยสำคัญทางคลินิก/สาธารณสุข</strong> รวมถึงอคติและข้อจำกัดของข้อมูล",
      notes:
        "สรุปตารางเลือกสถิติพื้นฐานใน SPSS สำหรับตอบคำถามวิจัยภาคสนาม และการเชื่อมโยงผลลัพธ์เข้ากับเกณฑ์ประเมินการนำเสนอ Quantitative Study (ฟอร์ม 4A ข้อ 3 และข้อ 4): เลือกสถิติให้ตรงชนิดตัวแปรและวัตถุประสงค์ ไม่จำเป็นต้องใช้สถิติซับซ้อนเกินความจำเป็น แต่ต้องอธิบายเหตุผลการเลือกและแปลผลอย่างถูกต้องกระชับ",
      render: () => `
        <div class="or-table-wrap" data-fit-table="1">
          <table class="or-table">
            <colgroup>
              <col style="width:24%" />
              <col style="width:38%" />
              <col style="width:38%" />
            </colgroup>
            <thead>
              <tr>
                <th>รูปแบบคำถามวิจัย (Exposure &rarr; Outcome)</th>
                <th>เมนูคำสั่งใน IBM SPSS Statistics v31</th>
                <th>ค่าสำคัญที่ต้องอ่านและนำไปอภิปรายในฟอร์ม 4A</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>กลุ่ม &times; กลุ่ม (ตาราง 2&times;2 หรือ R&times;C)</strong><br><span class="or-td-sub">เช่น พฤติกรรมเสี่ยง (มี/ไม่มี) กับการเกิดโรค (เป็น/ไม่เป็น)</span></td>
                <td><code>Analyze &rarr; Descriptive Statistics &rarr; Crosstabs</code><br>• ใส่ Exposure ใน <em>Row</em>, Outcome ใน <em>Column</em><br>• ปุ่ม <code>Statistics</code>: ติ๊ก <strong>Chi-square</strong> และ <strong>Risk</strong><br>• ปุ่ม <code>Cells</code>: ติ๊ก <strong>Row %</strong></td>
                <td>• อ่าน <strong>Pearson Chi-Square</strong> (แต่ถ้าเซลล์ที่มีค่าคาดหวัง &lt; 5 เกิน 20% ให้อ่าน <strong>Fisher's Exact Test</strong> แทน!)<br>• อ่านขนาดความสัมพันธ์ <strong>Odds Ratio / Relative Risk พร้อม <code>95% CI</code></strong></td>
              </tr>
              <tr>
                <td><strong>เปรียบเทียบค่ากลาง 2 กลุ่มอิสระ</strong><br><span class="or-td-sub">เช่น คะแนนความรู้ หรือ SBP ระหว่าง 2 หมู่บ้าน/กลุ่ม</span></td>
                <td>• <strong>แจกแจงปกติ:</strong> <code>Analyze &rarr; Compare Means &rarr; Independent-Samples T Test</code><br>• <strong>ข้อมูลเบ้:</strong> <code>Analyze &rarr; Nonparametric Tests &rarr; Independent Samples</code> (Mann-Whitney U)</td>
                <td>• ใน T Test ดูผล <em>Levene's Test</em> ก่อนเลือกบรรทัดอ่านค่า <strong>Mean Difference, 95% CI และ p-value</strong><br>• หากข้อมูลเบ้ รายงาน Median (IQR) ทั้งสองกลุ่มคู่กับค่า <code>p-value</code> จาก Mann-Whitney U</td>
              </tr>
              <tr>
                <td><strong>เปรียบเทียบก่อน–หลัง (กลุ่มเดิม) / &ge; 3 กลุ่ม</strong><br><span class="or-td-sub">เช่น คะแนนก่อน–หลังให้ความรู้ หรือเทียบ 3 ตำบล</span></td>
                <td>• <strong>คู่เดิมก่อน–หลัง:</strong> <code>Paired-Samples T Test</code> (หรือ <em>Wilcoxon</em>)<br>• <strong>&ge; 3 กลุ่มอิสระ:</strong> <code>One-Way ANOVA</code> (หรือ <em>Kruskal-Wallis</em>)</td>
                <td>• <strong>หัวใจฟอร์ม 4A:</strong> เลือกสถิติที่ตรงวัตถุประสงค์ อธิบายเหตุผลที่เลือก เปรียบเทียบขนาดผลกระทบกับความหมายจริงในชุมชน และอภิปราย Bias / Sample Size อย่างมีวิจารณญาณ</td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    }
  ];

  function isPhoneReflowMode() {
    const w = window.innerWidth || 1024;
    const h = window.innerHeight || 768;
    return w <= 700 && w <= h;
  }

  function singleBoxFitsCleanly(el) {
    if (el.clientHeight <= 0 || el.clientWidth <= 0) return true;
    if (el.scrollHeight > el.clientHeight + 1) return false;
    if (el.scrollWidth > el.clientWidth + 1) return false;
    return true;
  }

  function tablesFitCleanly(wraps) {
    for (let i = 0; i < wraps.length; i += 1) {
      const w = wraps[i];
      const tbl = w.querySelector(".or-table");
      if (!tbl || w.clientHeight <= 0 || w.clientWidth <= 0) continue;
      if (tbl.offsetHeight > w.clientHeight + 1 || w.scrollHeight > w.clientHeight + 1 || tbl.scrollWidth > w.clientWidth + 1) {
        return false;
      }
    }
    return true;
  }

  function findMaxScaleForBox(el, checkFn, minS, maxS, safetyFactor) {
    let lo = minS;
    let hi = maxS;
    for (let step = 0; step < 14; step += 1) {
      const mid = (lo + hi) * 0.5;
      el.style.setProperty("--fit-scale", mid.toFixed(4));
      if (checkFn([el])) lo = mid;
      else hi = mid;
    }
    return Math.max(minS, lo * safetyFactor);
  }

  function fitSingleSlideCanvas(canvas) {
    if (!canvas) return;
    const allScaled = Array.from(canvas.querySelectorAll(".or-card, .or-table-wrap, .or-cover-kpi, .or-cover-act-chip"));
    if (isPhoneReflowMode() && !document.body.classList.contains("is-printing-spss-deck")) {
      allScaled.forEach((el) => el.style.removeProperty("--fit-scale"));
      return;
    }
    if (canvas.clientWidth < 120 || canvas.clientHeight < 80) return;

    canvas.setAttribute("data-measuring", "1");
    canvas.querySelectorAll("[data-fit-group]").forEach((grp) => {
      const cards = Array.from(grp.querySelectorAll(":scope > .or-card")).filter((c) => c.clientHeight > 0);
      if (!cards.length) return;
      const scales = cards.map((c) => findMaxScaleForBox(c, (arr) => singleBoxFitsCleanly(arr[0]), 0.48, 2.1, 0.94));
      const minG = Math.min.apply(null, scales);
      const cap = minG * 1.24;
      cards.forEach((c, idx) => c.style.setProperty("--fit-scale", Math.min(scales[idx], cap).toFixed(4)));
    });
    canvas.querySelectorAll("[data-fit-table]").forEach((tw) => {
      const s = findMaxScaleForBox(tw, tablesFitCleanly, 0.48, 1.95, 0.95);
      tw.style.setProperty("--fit-scale", s.toFixed(4));
    });
    canvas.removeAttribute("data-measuring");
  }

  function fitAllVisibleCanvases() {
    const modal = document.getElementById("spssDeckModal");
    if (!modal || modal.hidden) return;
    modal.querySelectorAll(".or-slide-canvas").forEach(fitSingleSlideCanvas);
  }

  function renderCoverSlideHtml(slide) {
    return `
      <div class="or-cover-stage">
        <div class="or-cover-top">
          <span class="or-cover-dept">ภาควิชาเวชศาสตร์ชุมชน · คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล</span>
          <span class="or-cover-code-chip">SPSS WORKSHOP · ปีการศึกษา 2569</span>
        </div>

        <div class="or-cover-split" style="grid-template-columns:1.25fr 0.95fr">
          <div class="or-cover-left-col">
            <div class="or-cover-head-stack">
              <span class="or-cover-kicker">อังคาร 8 ธันวาคม 2569 · 13.30 – 15.00 น. · ห้อง 2C2-03 &amp; Online Zoom</span>
              <h2 class="or-cover-h1">${esc(slide.title)}</h2>
              <div class="or-top-key-banner is-cover-key">
                <span class="or-top-key-text">${slide.keyMessageHtml}</span>
              </div>
            </div>

            <div class="or-cover-kpi-row">
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val">v31</span>
                <span class="or-cover-kpi-lbl">IBM SPSS ม.มหิดล</span>
              </div>
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val">VPN</span>
                <span class="or-cover-kpi-lbl">ต่อเมื่ออยู่นอกคณะฯ</span>
              </div>
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val">4</span>
                <span class="or-cover-kpi-lbl">ขั้นตอนวิเคราะห์ Survey</span>
              </div>
              <div class="or-cover-kpi is-io-squircle">
                <span class="or-cover-kpi-val">4A</span>
                <span class="or-cover-kpi-lbl">เชื่อมสู่นำเสนอวิจัย</span>
              </div>
            </div>
          </div>

          <div class="or-card is-navy-tint is-vcenter" style="padding:20px 22px;display:flex;flex-direction:column;gap:10px;justify-content:center">
            <span class="or-card-kicker">QUICK SETUP SUMMARY · สรุปตั้งค่าด่วนใน 4 ขั้น</span>
            <h3 class="or-card-title" style="font-size:20px">เตรียมเครื่องให้พร้อมก่อนเข้าห้องเรียน</h3>
            <ul class="or-list" style="font-size:14.5px;line-height:1.5">
              <li><strong>1. เครือข่าย:</strong> ต่อ <code>MU-WiFi</code> หรือเปิด <strong>Mahidol VPN</strong> ทุกครั้ง</li>
              <li><strong>2. ดาวน์โหลด:</strong> เข้า <code>softwaredownload.mahidol.ac.th</code> (Intranet)</li>
              <li><strong>3. ติดตั้ง:</strong> Windows คลิกขวา <em>Run as administrator</em> · Mac เปิด <code>Stats 31_MAC.pkg</code></li>
              <li><strong>4. Activate:</strong> เลือก <strong><code>Concurrent user license</code></strong> &rarr; Server: <strong><code>spss-mu.mahidol</code></strong></li>
            </ul>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
              <a class="or-tool-btn is-primary" href="${MUIT_SPSS_URL}" target="_blank" rel="noopener" style="text-decoration:none">📘 คู่มือ MUIT SPSS ↗</a>
              <a class="or-tool-btn" href="${MUIT_VPN_URL}" target="_blank" rel="noopener" style="text-decoration:none">🔐 คู่มือ Mahidol VPN ↗</a>
            </div>
          </div>
        </div>

        <div class="or-cover-bottom">
          <div class="or-cover-meta-grid">
            <div class="or-cover-meta-item">
              <span class="or-cover-meta-lbl">อาจารย์ผู้สอน</span>
              <span class="or-cover-meta-val">อ. พญ.สวนีย์ ศรีเจริญธรรม</span>
            </div>
            <div class="or-cover-meta-item">
              <span class="or-cover-meta-lbl">ห้องปฏิบัติการ &amp; Zoom</span>
              <span class="or-cover-meta-val">ห้อง 2C2-03 · Zoom ID: 952 7054 4175 (Pass: 756928)</span>
            </div>
            <div class="or-cover-meta-item">
              <span class="or-cover-meta-lbl">แหล่งอ้างอิงลิขสิทธิ์</span>
              <span class="or-cover-meta-val">กองเทคโนโลยีสารสนเทศ ม.มหิดล (MUIT)</span>
            </div>
          </div>
          <span class="or-cover-code-chip">${SLIDES.length} Slides · 16:9</span>
        </div>
      </div>
    `;
  }

  function renderSingleSlideCanvasHtml(slide, idx, animateDeck) {
    const animCls = animateDeck ? " is-keynote-animated is-dir-next" : "";
    const ioTheme = getEffectiveIoTheme();
    if (slide.isCover) {
      return `
        <article class="or-slide-canvas is-io-pitch is-cover-canvas${animCls}" data-io-theme="${ioTheme}" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
          ${renderCoverSlideHtml(slide)}
        </article>
      `;
    }
    return `
      <article class="or-slide-canvas is-io-pitch${animCls}" data-io-theme="${ioTheme}" data-slide-id="${esc(slide.id)}" aria-label="Slide ${idx + 1}: ${esc(slide.title)}">
        <div class="or-sld-inner">
          <header class="or-sld-head">
            <div class="or-sld-eyebrow-row">
              <span class="or-sld-kicker">
                <span class="or-act-badge ${esc(slide.actClass || "")}">${esc(slide.actLabel)}</span>
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
          <span class="or-sld-foot-course">RACM 303 · SPSS Workshop &amp; Mahidol IBM SPSS v31 Guide</span>
          <span class="or-sld-foot-num">${String(idx + 1).padStart(2, "0")} / ${SLIDES.length}</span>
        </footer>
      </article>
    `;
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

  function ensureModalElement() {
    let modal = document.getElementById("spssDeckModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "spssDeckModal";
    modal.className = "or-deck-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "SPSS Workshop and Mahidol IBM SPSS v31 Installation Slide Deck");
    modal.hidden = true;
    document.body.appendChild(modal);

    window.addEventListener("resize", () => {
      if (state.resizeRaf) cancelAnimationFrame(state.resizeRaf);
      state.resizeRaf = requestAnimationFrame(fitAllVisibleCanvases);
    });

    modal.addEventListener("click", (ev) => {
      if (state.blackoutActive) {
        state.blackoutActive = false;
        renderModal();
        return;
      }
      if (ev.target === modal && !state.presentationMode) {
        closeDeck();
      }
    });

    window.addEventListener(
      "keydown",
      (ev) => {
        if (!state.isOpen || modal.hidden) return;
        if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
        const tag = (ev.target && ev.target.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

        if (state.blackoutActive) {
          ev.preventDefault();
          ev.stopPropagation();
          state.blackoutActive = false;
          renderModal();
          return;
        }
        if (ev.key === "Escape") {
          ev.preventDefault();
          ev.stopPropagation();
          if (state.presentationMode) exitPresentationMode();
          else closeDeck();
          return;
        }
        if (ev.key === "ArrowRight" || ev.key === "ArrowDown" || ev.key === "PageDown" || ev.key === " ") {
          if (state.viewMode === "deck") {
            ev.preventDefault();
            ev.stopPropagation();
            stepSlide(1);
          }
        } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp" || ev.key === "PageUp" || ev.key === "Backspace") {
          if (state.viewMode === "deck") {
            ev.preventDefault();
            ev.stopPropagation();
            stepSlide(-1);
          }
        } else if (ev.key === "f" || ev.key === "F" || ev.key === "F5") {
          ev.preventDefault();
          ev.stopPropagation();
          togglePresentationMode();
        } else if (ev.key === "t" || ev.key === "T") {
          ev.preventDefault();
          ev.stopPropagation();
          state.ioStageTheme = state.ioStageTheme === "dark" ? "light" : "dark";
          renderModal();
        } else if (ev.key === "g" || ev.key === "G") {
          ev.preventDefault();
          ev.stopPropagation();
          state.viewMode = state.viewMode === "sorter" ? "deck" : "sorter";
          renderModal();
        } else if (ev.key === "n" || ev.key === "N") {
          ev.preventDefault();
          ev.stopPropagation();
          state.showNotes = !state.showNotes;
          renderModal();
        } else if (ev.key === "b" || ev.key === "B" || ev.key === ".") {
          if (state.viewMode === "deck") {
            ev.preventDefault();
            ev.stopPropagation();
            state.blackoutActive = !state.blackoutActive;
            renderModal();
          }
        }
      },
      true
    );

    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && state.presentationMode) {
        state.presentationMode = false;
        modal.classList.remove("is-presentation-mode");
        renderModal();
      }
    });

    return modal;
  }

  function goToSlide(idx) {
    state.slideIdx = Math.max(0, Math.min(SLIDES.length - 1, Number(idx) || 0));
    state.viewMode = "deck";
    renderModal();
  }

  function stepSlide(delta) {
    state.autoPlay = false;
    goToSlide(state.slideIdx + (Number(delta) || 0));
  }

  function togglePresentationMode() {
    const modal = ensureModalElement();
    if (!state.presentationMode) {
      state.viewMode = "deck";
      state.presentationMode = true;
      modal.classList.add("is-presentation-mode");
      if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
      renderModal();
    } else {
      exitPresentationMode();
    }
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

  function printHandout() {
    state.autoPlay = false;
    clearAutoPlayTimer();
    const prevMode = state.viewMode;
    state.viewMode = "handout";
    document.body.classList.add("is-printing-spss-deck");

    let pageRule = document.getElementById("spssWidescreenPrintRule");
    if (!pageRule) {
      pageRule = document.createElement("style");
      pageRule.id = "spssWidescreenPrintRule";
      document.head.appendChild(pageRule);
    }
    pageRule.textContent = `
      @page { size: 13.333in 7.5in !important; margin: 0 !important; }
      @media print {
        body.is-printing-spss-deck > *:not(#spssDeckModal) { display: none !important; }
        body.is-printing-spss-deck #spssDeckModal { position: static !important; background: #fff !important; }
        body.is-printing-spss-deck .or-deck-topbar,
        body.is-printing-spss-deck .or-deck-bottombar,
        body.is-printing-spss-deck .or-notes-dock { display: none !important; }
        body.is-printing-spss-deck .or-slide-canvas {
          width: 13.333in !important; height: 7.5in !important;
          max-width: 13.333in !important; max-height: 7.5in !important;
          margin: 0 !important; border: 0 !important; border-radius: 0 !important;
          break-after: page; page-break-after: always;
        }
      }
    `;
    renderModal();
    setTimeout(() => {
      fitAllVisibleCanvases();
      window.print();
      setTimeout(() => {
        document.body.classList.remove("is-printing-spss-deck");
        if (pageRule && pageRule.parentNode) pageRule.parentNode.removeChild(pageRule);
        state.viewMode = prevMode;
        renderModal();
      }, 300);
    }, 160);
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
    const effectiveIoTheme = getEffectiveIoTheme();
    const isIoDark = effectiveIoTheme === "dark";
    const showNotesNow = state.viewMode === "deck" && state.showNotes;
    const progressPct = (((state.slideIdx + 1) / SLIDES.length) * 100).toFixed(1);

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
      viewportHtml = `
        <div class="or-sorter-wrap">
          <div class="or-sorter-grid">
            ${SLIDES.map(
              (s, i) => `
              <button type="button" class="or-sorter-card${i === state.slideIdx ? " is-current" : ""}" data-spss-jump="${i}">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">
                  <span class="or-code-pill">Slide ${s.num}</span>
                  <span class="or-sorter-time">${esc(s.timeWindow)}</span>
                </div>
                <div class="or-sorter-title">${esc(s.title)}</div>
                <div class="or-sorter-act"><span>${esc(s.actLabel)}</span></div>
              </button>
            `
            ).join("")}
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
      <div class="or-deck-shell is-io-deck is-appletv-deck${showNotesNow ? " has-notes-open" : ""}" data-io-theme="${effectiveIoTheme}">
        <div class="or-deck-topbar is-tv-capsule">
          <div class="or-top-left">
            <div class="racm-unav-pair is-compact is-dark-hud" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่">
              <button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button>
              <button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button>
            </div>
            <span class="or-code-pill is-io-brand-pill">SPSS v31</span>
            <div class="or-top-title-wrap">
              <span class="or-top-title">SPSS Workshop · การดาวน์โหลด ติดตั้ง IBM SPSS ม.มหิดล &amp; วิเคราะห์ Health Survey</span>
              <span class="or-top-sub">อ. 8 ธ.ค. 2569 · 13.30 – 15.00 น. · ห้อง 2C2-03 &amp; Zoom (952 7054 4175) · อ. พญ.สวนีย์</span>
            </div>
          </div>

          <div class="or-top-center" role="tablist" aria-label="สลับมุมมองสไลด์">
            <button type="button" class="or-mode-btn${state.viewMode === "deck" ? " is-active" : ""}" data-spss-vmode="deck">${SVG.slides} <span>Slide</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "sorter" ? " is-active" : ""}" data-spss-vmode="sorter">${SVG.grid} <span>Sorter</span></button>
            <button type="button" class="or-mode-btn${state.viewMode === "handout" ? " is-active" : ""}" data-spss-vmode="handout">${SVG.handout} <span>Handout</span></button>
          </div>

          <div class="or-top-right">
            <div class="or-desktop-tools">
              <button type="button" class="or-tool-btn is-io-theme-toggle" id="spssIoThemeBtn" title="สลับโทนสไลด์ Light / Dark (กด T)"><span>${isIoDark ? "🌙 Dark" : "☀️ Light"}</span></button>
              <button type="button" class="or-tool-btn${state.autoPlay ? " is-active-toggle" : ""}" id="spssAutoPlayBtn">${state.autoPlay ? SVG.pause : SVG.play} <span>${state.autoPlay ? "หยุดเล่น" : "Auto-Play"}</span></button>
              <button type="button" class="or-tool-btn${state.showNotes ? " is-active-toggle" : ""}" id="spssNotesBtn">${SVG.notes} <span>คำอธิบาย</span></button>
              <a class="or-tool-btn" href="${MUIT_SPSS_URL}" target="_blank" rel="noopener" title="เปิดเว็บคู่มือติดตั้ง SPSS ของกองเทคโนโลยีสารสนเทศ ม.มหิดล (MUIT)"><span>📘 คู่มือ MUIT ↗</span></a>
              <a class="or-tool-btn" href="${PPTX_HREF}" download="RACM303_2569_SPSS_Workshop_Slides.pptx">${SVG.download} <span>.pptx</span></a>
              <a class="or-tool-btn" href="${PDF_HREF}" download="RACM303_2569_SPSS_Workshop_Slides.pdf">${SVG.download} <span>PDF</span></a>
              <button type="button" class="or-tool-btn" id="spssPrintBtn">${SVG.print} <span>พิมพ์</span></button>
            </div>
            <button type="button" class="or-tool-btn is-primary or-present-btn" id="spssPresentBtn">${SVG.fullscreen} <span class="or-present-lbl">${state.presentationMode ? "ออกเต็มจอ" : "เต็มจอ"}</span></button>
            <button type="button" class="or-tool-btn is-close" id="spssCloseBtn" aria-label="ปิดหน้าต่างสไลด์">&times;</button>
          </div>
        </div>

        <div class="or-deck-viewport${state.viewMode !== "deck" ? " is-scrollable-mode" : ""}" id="spssDeckViewport">
          ${viewportHtml}
        </div>

        ${
          state.viewMode === "deck"
            ? `<div class="or-keynote-progress-rail" aria-hidden="true"><div class="or-keynote-progress-fill" style="width:${progressPct}%"></div></div>`
            : ""
        }

        ${
          state.blackoutActive
            ? `<div class="or-blackout-curtain"><div class="or-blackout-card"><span class="or-blackout-dot"></span><div class="or-blackout-title">SPSS WORKSHOP · STAGE PAUSED</div><div class="or-blackout-sub">กดปุ่มใดก็ได้หรือคลิกเพื่อกลับสู่สไลด์ ${cur.num}/${SLIDES.length}</div></div></div>`
            : ""
        }

        ${
          showNotesNow
            ? `<div class="or-notes-dock"><div style="min-width:0;flex:1"><div class="or-notes-kicker">${esc(cur.timeWindow)} · SLIDE GUIDE</div><p class="or-notes-text">${esc(cur.notes)}</p></div></div>`
            : ""
        }

        ${
          state.viewMode === "deck"
            ? `
          <div class="or-deck-bottombar is-tv-capsule">
            <div class="or-nav-cluster">
              <button type="button" class="or-tool-btn or-prevnext-btn" id="spssPrevBtn" ${state.slideIdx === 0 ? "disabled" : ""}>&larr; <span class="or-nav-word">ก่อนหน้า</span></button>
              <select class="or-slide-select" id="spssSlideSelect" aria-label="เลือกสไลด์">
                ${SLIDES.map(
                  (s, i) => `<option value="${i}" ${i === state.slideIdx ? "selected" : ""}>${s.num}/${SLIDES.length} · ${esc(s.title)}</option>`
                ).join("")}
              </select>
              <button type="button" class="or-tool-btn is-primary or-prevnext-btn" id="spssNextBtn" ${state.slideIdx === SLIDES.length - 1 ? "disabled" : ""}><span class="or-nav-word">ถัดไป</span> &rarr;</button>
            </div>
            <div class="or-filmstrip" role="navigation" aria-label="แถบลำดับสไลด์">
              ${SLIDES.map(
                (s, i) => `<button type="button" class="or-film-dot${i === state.slideIdx ? " is-active" : ""}" data-spss-jump="${i}" title="${s.num}. ${esc(s.title)}">${s.num}</button>`
              ).join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    modal.querySelectorAll("[data-spss-vmode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.viewMode = btn.dataset.spssVmode;
        if (state.viewMode !== "deck") state.autoPlay = false;
        renderModal();
      });
    });

    modal.querySelectorAll("[data-spss-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.autoPlay = false;
        goToSlide(Number(btn.dataset.spssJump) || 0);
      });
    });

    const themeBtn = document.getElementById("spssIoThemeBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        state.ioStageTheme = state.ioStageTheme === "dark" ? "light" : "dark";
        try {
          localStorage.setItem("racm303_io_clean_theme", state.ioStageTheme);
        } catch (_) {}
        renderModal();
      });
    }

    const autoBtn = document.getElementById("spssAutoPlayBtn");
    if (autoBtn) {
      autoBtn.addEventListener("click", () => {
        state.viewMode = "deck";
        state.autoPlay = !state.autoPlay;
        if (state.autoPlay && state.slideIdx >= SLIDES.length - 1) state.slideIdx = 0;
        renderModal();
      });
    }

    const notesBtn = document.getElementById("spssNotesBtn");
    if (notesBtn) {
      notesBtn.addEventListener("click", () => {
        state.showNotes = !state.showNotes;
        renderModal();
      });
    }

    const printBtn = document.getElementById("spssPrintBtn");
    if (printBtn) printBtn.addEventListener("click", printHandout);

    const presBtn = document.getElementById("spssPresentBtn");
    if (presBtn) presBtn.addEventListener("click", togglePresentationMode);

    const closeBtn = document.getElementById("spssCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeDeck);

    const prevBtn = document.getElementById("spssPrevBtn");
    if (prevBtn) prevBtn.addEventListener("click", () => stepSlide(-1));

    const nextBtn = document.getElementById("spssNextBtn");
    if (nextBtn) nextBtn.addEventListener("click", () => stepSlide(1));

    const sel = document.getElementById("spssSlideSelect");
    if (sel) sel.addEventListener("change", () => goToSlide(Number(sel.value) || 0));

    fitAllVisibleCanvases();
    scheduleAutoPlayTick();
  }

  function openDeck(initialSlideIdx, opts) {
    const o = opts || {};
    state.isOpen = true;
    if (typeof initialSlideIdx === "number" && !Number.isNaN(initialSlideIdx)) {
      state.slideIdx = Math.max(0, Math.min(SLIDES.length - 1, initialSlideIdx));
    }
    state.viewMode = o.viewMode || "deck";
    renderModal();
  }

  function closeDeck() {
    state.isOpen = false;
    state.autoPlay = false;
    clearAutoPlayTimer();
    document.body.classList.remove("orient-deck-open");
    if (state.presentationMode) {
      state.presentationMode = false;
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
    const modal = document.getElementById("spssDeckModal");
    if (modal) {
      modal.hidden = true;
      modal.classList.remove("is-presentation-mode");
      modal.innerHTML = "";
    }
    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (h === "spss" || h === "spss-slides") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  window.RACM_SPSS_DECK = {
    open: openDeck,
    close: closeDeck,
    goToSlide,
    stepSlide,
    fitAllVisibleCanvases,
    getSlides: () => SLIDES,
    pptxHref: PPTX_HREF,
    pdfHref: PDF_HREF
  };

  function checkUrlAutoOpen() {
    const params = new URLSearchParams(window.location.search);
    const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (params.get("page") === "spss-slides" || params.get("spss_print") === "1" || h === "spss" || h === "spss-slides") {
      setTimeout(() => {
        openDeck(0, { viewMode: params.get("spss_print") === "1" ? "handout" : "deck" });
      }, 60);
    }
  }

  window.addEventListener("hashchange", checkUrlAutoOpen);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkUrlAutoOpen);
  } else {
    checkUrlAutoOpen();
  }
})();
