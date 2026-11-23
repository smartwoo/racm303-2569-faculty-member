/* ==========================================================================
   RACM 303 (2569) — Apple TV (tvOS) & Google TV Launcher + Remote Navigator
   Works seamlessly across both Student (Blue) and Faculty Member (Red) Portals
   ========================================================================== */
(function () {
  "use strict";

  const ROLE = window.PORTAL_ROLE === "faculty" ? "faculty" : "student";
  const SCHED = window.RACM_SCHEDULE_DATA || {};
  const ROSTER = window.RACM_ROSTER_DATA || { students: [], courseTeachers: [] };
  const HSD = window.RACM_HS_DISCUSSION_DATA || { modules: [] };
  const $ = (id) => document.getElementById(id);

  let lastHomeTileFocusSelector = "";
  let selectedProfileAreaFilter = "";

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

  /* Extract clean base consonant/letter without orphan Thai combining vowel/tone marks */
  function getCleanMonogram(raw) {
    const str = String(raw || "").trim();
    const m = str.match(/[ก-ฮA-Za-z0-9]/);
    return m ? m[0].toUpperCase() : "R";
  }

  function getBangkokTodayISO() {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date());
    } catch (_) {
      return "2026-11-25";
    }
  }

  /* ---------- Crisp Monochrome Vector Icons ---------- */
  const ICONS = {
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    slides: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2.5"/><path d="M8 21h8"/><path d="M12 17v4"/><polygon points="10 8 15 10.5 10 13 10 8" fill="currentColor" stroke="none"/></svg>`,
    book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9.5 14.5 2.5-2.5 2.5 2.5"/></svg>`,
    quiz: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    user: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    video: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
    bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    search: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    sun: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg>`,
    dots: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`
  };

  const NAV_GROUP_MAP = {
    home: "home",
    schedule: "schedule",
    fieldwork: "groups",
    discussion: "groups",
    "hs-discussion": "health-systems",
    textbooks: "health-systems",
    practice: "health-systems",
    manual: "manual",
    "faculty-docs": "health-systems",
    epidemiology: "epidemiology",
    submissions: "admin",
    leave: "admin",
    audit: "admin"
  };

  const rememberedSubTab = {
    "health-systems": "textbooks",
    groups: "fieldwork",
    admin: "submissions"
  };

  let portalViewMode = "tv";
  let driveBrowserActive = false;
  let drivePath = []; // [] | ["schedule"] | ["health-systems"] | ["health-systems","HS1"] | ["epidemiology"] | ["fieldwork"] | ["manuals"] | ["admin"]
  let driveLayout = localStorage.getItem("racm303_course_drive_layout") === "list" ? "list" : "grid";
  let driveSearchQuery = "";

  const COURSE_DRIVE_TRIANGLE_SVG =
    `<svg class="gdrive-logo-svg" viewBox="0 0 87.3 78" aria-hidden="true">` +
    `<path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>` +
    `<path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>` +
    `<path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>` +
    `<path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>` +
    `<path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>` +
    `<path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>` +
    `</svg>`;

  const COURSE_DRIVE_FOLDER_SVG =
    `<svg class="gdrive-folder-svg" viewBox="0 0 24 24" aria-hidden="true">` +
    `<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h3.9c.7 0 1.36.3 1.82.82l1.16 1.36c.3.35.74.55 1.2.55H18.5A2.5 2.5 0 0 1 21 9.23v8.27A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11z" fill="#f59e0b"/>` +
    `<path d="M3 9.2h18v8.3A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5V9.2z" fill="#fbbf24"/>` +
    `</svg>`;

  /* ---------- 1. Mount Floating Top TV Capsule Bar ---------- */
  function mountTvTopCapsule() {
    const header = document.querySelector("header.masthead");
    if (!header || $("tvHeaderDock")) return;
    header.classList.add("tv-masthead");

    const dock = document.createElement("div");
    dock.className = "tv-header-dock";
    dock.id = "tvHeaderDock";

    const otherPortalUrl =
      ROLE === "faculty"
        ? "https://smartwoo.github.io/racm303-2569-student/"
        : "https://smartwoo.github.io/racm303-2569-faculty-member/";

    dock.innerHTML = `
      <div class="tv-nav-capsule" role="navigation" aria-label="เมนูนำทางหลัก">
        <button type="button" class="tv-brand-pill" id="tvBrandHomeBtn" data-tv-focus data-tv-row="0">
          <span class="tv-brand-badge">${ROLE === "faculty" ? "FAC" : "STU"}</span>
          <span class="tv-brand-text">
            <span class="tv-brand-title">RACM 303</span>
            <span class="tv-brand-role" id="tvBrandRoleLabel">${ROLE === "faculty" ? "อาจารย์" : "นักศึกษา"}</span>
          </span>
        </button>

        <div class="tv-pill-nav" id="tvPillNavList">
          <button type="button" class="tv-nav-pill" data-tv-nav="home" data-tv-focus data-tv-row="0" aria-current="page">หน้าหลัก</button>
          <button type="button" class="tv-nav-pill" data-tv-nav="schedule" data-tv-focus data-tv-row="0">${ROLE === "faculty" ? "ตารางสอน" : "ตารางเรียน"}</button>
          <button type="button" class="tv-nav-pill" data-tv-nav="groups" data-tv-focus data-tv-row="0">กลุ่ม &amp; พื้นที่</button>
          <button type="button" class="tv-nav-pill" data-tv-nav="health-systems" data-tv-focus data-tv-row="0">ระบบสุขภาพ</button>
          <button type="button" class="tv-nav-pill" data-tv-nav="epidemiology" data-tv-focus data-tv-row="0">ระบาดวิทยา</button>
          <button type="button" class="tv-nav-pill" data-tv-nav="manual" data-tv-focus data-tv-row="0">คู่มือรายวิชา</button>
          <button type="button" class="tv-nav-pill" data-tv-nav="admin" data-tv-focus data-tv-row="0">
            <span>${ROLE === "faculty" ? "ตรวจงาน & ใบลา" : "ส่งงาน & ใบลา"}</span>
            <span class="tv-pill-dot" id="tvAdminNotifDot" hidden>0</span>
          </button>
        </div>

        <div class="tv-utility-cluster">
          <button type="button" class="tv-icon-pill" id="tvSearchBtn" data-tv-focus data-tv-row="0" title="ค้นหาด่วน (⌘K หรือ /)" aria-label="ค้นหา">${ICONS.search}</button>
          <button type="button" class="tv-profile-pill" id="tvProfileBtn" data-tv-focus data-tv-row="0" title="ตั้งค่าชื่อหรือกลุ่มของฉัน">
            <span class="tv-profile-avatar" id="tvProfileAvatar">${ICONS.user}</span>
            <span class="tv-profile-label" id="tvProfileLabel">${ROLE === "faculty" ? "เลือกอาจารย์" : "เลือกโปรไฟล์"}</span>
          </button>
          <button type="button" class="tv-icon-pill" id="tvThemeQuickBtn" data-tv-focus data-tv-row="0" title="สลับโหมดสว่าง / โหมดมืด" aria-label="สลับโหมดสี">${ICONS.moon}</button>
          <button type="button" class="tv-icon-pill" id="tvMoreBtn" data-tv-focus data-tv-row="0" aria-expanded="false" title="ตัวเลือกเพิ่มเติม" aria-label="ตัวเลือกเพิ่มเติม">${ICONS.dots}</button>
        </div>
      </div>

      <div class="tv-more-popover" id="tvMorePopover" hidden>
        <button type="button" class="tv-menu-item" id="tvMenuLangBtn">
          <span>สลับภาษา (Language)</span>
          <strong id="tvMenuLangCode">TH / EN</strong>
        </button>
        ${
          ROLE === "faculty"
            ? `<button type="button" class="tv-menu-item" id="tvMenuUploadSlideBtn"><span>อัปโหลด Slide ประกอบการสอน</span><span>→</span></button>`
            : `<a class="tv-menu-item" href="https://forms.gle/1Gsg2SmSfuuEwmcE9" target="_blank" rel="noopener"><span>ส่งสไลด์ &amp; Health Survey</span><span>↗</span></a>`
        }
        <a class="tv-menu-item" href="https://elearning.ra.mahidol.ac.th/ramed/course/view.php?id=398" target="_blank" rel="noopener">
          <span>ห้องเรียน RAMA E-learning</span>
          <span>↗</span>
        </a>
        <div class="tv-menu-divider"></div>
        <a class="tv-menu-item" href="${otherPortalUrl}" target="_blank" rel="noopener">
          <span>${ROLE === "faculty" ? "สลับไปฝั่งนักศึกษา (Student)" : "สำหรับอาจารย์ (Faculty Portal)"}</span>
          <span>↗</span>
        </a>
      </div>
    `;

    header.appendChild(dock);

    $("tvBrandHomeBtn").addEventListener("click", () => {
      navigateTvTab("home");
    });

    dock.querySelectorAll("[data-tv-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const navKey = btn.dataset.tvNav;
        if (navKey === "home" || navKey === "schedule" || navKey === "epidemiology" || navKey === "manual") {
          navigateTvTab(navKey);
        } else if (navKey === "health-systems") {
          const api = getApi();
          const st = api && api.getState ? api.getState() : null;
          if (st && st.activeTab === "textbooks" && (st.textbookSubMode !== "docs-drive" || st.tbDriveScope !== "folders") && api.openTextbookDriveFolder) {
            api.openTextbookDriveFolder("FOLDERS");
          } else {
            navigateTvTab(rememberedSubTab["health-systems"] || "textbooks");
          }
        } else if (navKey === "groups") {
          navigateTvTab(rememberedSubTab.groups || "fieldwork");
        } else if (navKey === "admin") {
          navigateTvTab(rememberedSubTab.admin || "submissions");
        }
      });
    });

    $("tvSearchBtn").addEventListener("click", () => {
      const api = getApi();
      if (api && api.openGlobalSpotlight) api.openGlobalSpotlight();
    });

    $("tvProfileBtn").addEventListener("click", () => openProfileModal());

    $("tvThemeQuickBtn").addEventListener("click", () => {
      const legacyThemeBtn = $("themeToggleBtn");
      if (legacyThemeBtn) legacyThemeBtn.click();
      syncThemeIcon();
    });

    const moreBtn = $("tvMoreBtn");
    const morePop = $("tvMorePopover");
    moreBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const next = morePop.hidden;
      morePop.hidden = !next;
      moreBtn.setAttribute("aria-expanded", next ? "true" : "false");
    });

    $("tvMenuLangBtn").addEventListener("click", () => {
      morePop.hidden = true;
      moreBtn.setAttribute("aria-expanded", "false");
      if ($("langToggleBtn")) $("langToggleBtn").click();
      setTimeout(() => {
        syncTopBarLabels();
        renderHomeLauncher();
        syncSubpageBar();
      }, 30);
    });

    const upSlideBtn = $("tvMenuUploadSlideBtn");
    if (upSlideBtn) {
      upSlideBtn.addEventListener("click", () => {
        morePop.hidden = true;
        moreBtn.setAttribute("aria-expanded", "false");
        if ($("facQuickSlideTopBtn")) $("facQuickSlideTopBtn").click();
      });
    }

    document.addEventListener("click", (ev) => {
      if (!morePop.hidden && !dock.contains(ev.target)) {
        morePop.hidden = true;
        moreBtn.setAttribute("aria-expanded", "false");
      }
    });

    syncThemeIcon();
    syncProfilePill();
  }

  function syncThemeIcon() {
    const btn = $("tvThemeQuickBtn");
    if (!btn) return;
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    btn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    btn.title = isDark ? t("สลับเป็นโหมดสว่าง", "Switch to Light Mode") : t("สลับเป็นโหมดมืด", "Switch to Dark Mode");
  }

  function syncTopBarLabels() {
    const roleLbl = $("tvBrandRoleLabel");
    if (roleLbl) {
      roleLbl.textContent = ROLE === "faculty" ? t("อาจารย์", "Faculty") : t("นักศึกษา", "Student");
    }
    const labels = {
      home: t("หน้าหลัก", "Home"),
      schedule: ROLE === "faculty" ? t("ตารางสอน", "Schedule") : t("ตารางเรียน", "Schedule"),
      groups: t("กลุ่ม & พื้นที่", "Groups & Sites"),
      "health-systems": t("ระบบสุขภาพ", "Health Systems"),
      epidemiology: t("ระบาดวิทยา", "Epidemiology"),
      manual: t("คู่มือรายวิชา", "Manual"),
      admin: ROLE === "faculty" ? t("ตรวจงาน & ใบลา", "Admin & Leave") : t("ส่งงาน & ใบลา", "Submit & Leave")
    };
    document.querySelectorAll("[data-tv-nav]").forEach((btn) => {
      const k = btn.dataset.tvNav;
      if (k === "admin") {
        const span = btn.querySelector("span:first-child");
        if (span) span.textContent = labels[k];
      } else if (labels[k]) {
        btn.textContent = labels[k];
      }
    });
    syncViewModeSwitchUI();
    syncProfilePill();
  }

  function syncProfilePill() {
    const api = getApi();
    const st = api && api.getState ? api.getState() : {};
    const pill = $("tvProfileBtn");
    const avatar = $("tvProfileAvatar");
    const label = $("tvProfileLabel");
    if (!pill || !avatar || !label) return;

    if (ROLE === "student" && st.myStudent) {
      const s = st.myStudent;
      const nick = s.nickname ? s.nickname : s.name.split(" ")[0];
      pill.classList.add("has-profile");
      avatar.textContent = getCleanMonogram(nick);
      label.textContent = `${nick} · ${s.area}`;
    } else if (ROLE === "faculty" && st.myTeacherKey) {
      pill.classList.add("has-profile");
      avatar.textContent = getCleanMonogram(st.myTeacherKey);
      label.textContent = `อ.${st.myTeacherKey}`;
    } else {
      pill.classList.remove("has-profile");
      avatar.innerHTML = ICONS.user;
      label.textContent = ROLE === "faculty" ? t("เลือกอาจารย์", "Select Faculty") : t("เลือกโปรไฟล์", "My Profile");
    }

    const legacyLeaveBadge = $("facTopLeaveBadge");
    const dot = $("tvAdminNotifDot");
    if (dot && legacyLeaveBadge) {
      const cnt = Number(legacyLeaveBadge.textContent || "0");
      dot.hidden = legacyLeaveBadge.hidden || !(cnt > 0);
      dot.textContent = String(cnt);
    }
  }

  function navigateTvTab(tabId) {
    hideCourseDriveBrowser();
    const api = getApi();
    if (!api) return;
    api.switchTab(tabId, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- 2. Mount Apple TV / Google TV Home Launcher (#panel-home) ---------- */
  function ensureHomePanelExists() {
    const main = document.querySelector(".portal-main");
    if (!main) return null;
    let panel = $("panel-home");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "tab-panel";
      panel.id = "panel-home";
      panel.setAttribute("aria-label", "หน้าหลัก RACM 303");
      main.insertBefore(panel, main.firstChild);
    }
    return panel;
  }

  function getNextFeaturedSession() {
    const api = getApi();
    const st = api && api.getState ? api.getState() : {};
    const todayISO = getBangkokTodayISO();
    const sessions = (SCHED.sessions || []).filter(
      (s) => (ROLE === "faculty" || s.studentVisible !== false) && s.category !== "STAFF" && s.category !== "HOLIDAY"
    );

    let pool = sessions;
    if (ROLE === "faculty" && st.myTeacherKey) {
      const tMatches = sessions.filter((s) => {
        if (String(s.lecturers || "").includes(st.myTeacherKey)) return true;
        if (s.hsModule) {
          return (SCHED.hsRotation || []).some((r) => {
            const slot = r && r[s.hsModule];
            const inst = slot && typeof slot === "object" ? slot.instructor : slot;
            return String(inst || "").includes(st.myTeacherKey);
          });
        }
        return JSON.stringify(s.groupRooms || "").includes(st.myTeacherKey);
      });
      if (tMatches.length) pool = tMatches;
    }

    const upcoming = pool.filter((s) => (s.dateISO || "") >= todayISO);
    return upcoming[0] || pool[0] || null;
  }

  function renderHomeLauncher() {
    const panel = ensureHomePanelExists();
    if (!panel) return;

    const api = getApi();
    const st = api && api.getState ? api.getState() : {};
    const nextSess = getNextFeaturedSession();
    const ctx = api && api.getActivePersonalContext ? api.getActivePersonalContext() : {};
    const eff =
      nextSess && api && api.resolveEffectiveSessionDetails
        ? api.resolveEffectiveSessionDetails(nextSess, ctx)
        : null;

    const hasProfile = Boolean(
      (ROLE === "student" && st.myStudent) || (ROLE === "faculty" && st.myTeacherKey)
    );

    let heroKicker =
      ROLE === "faculty"
        ? t("สำหรับคณาจารย์ · คาบสอนถัดไป", "Faculty · Up Next")
        : t("สำหรับนักศึกษา · คาบเรียนถัดไป", "For You · Up Next");

    if (ROLE === "student" && st.myStudent) {
      const s = st.myStudent;
      heroKicker = `${s.fullName}${s.nickname ? ` (${s.nickname})` : ""} · Discussion ${s.disc} · ${s.area}`;
    } else if (ROLE === "faculty" && st.myTeacherKey) {
      const foundT = (ROSTER.courseTeachers || []).find((x) => x.key === st.myTeacherKey);
      heroKicker = foundT ? foundT.label : `อ.${st.myTeacherKey}`;
    }

    const heroTitle = nextSess
      ? nextSess.title
      : t("เวชศาสตร์ชุมชนและวิทยาศาสตร์ระบบสุขภาพ (RACM 303)", "Community Medicine & Health Systems Science");
    const heroRoom = (eff && eff.room) || (nextSess && nextSess.room) || "";
    const heroMeta = nextSess
      ? `${nextSess.dateTH || nextSess.dateISO}  ·  ${nextSess.timeLabel || ""}${heroRoom ? `  ·  ${heroRoom}` : ""}`
      : t("พุธที่ 25 พฤศจิกายน – พุธที่ 30 ธันวาคม 2569", "25 Nov – 30 Dec 2026");

    const zoomUrl = nextSess && nextSess.zoom && nextSess.zoom.url ? nextSess.zoom.url : "";

    const appTiles =
      ROLE === "faculty"
        ? [
            {
              id: "app-sched",
              tone: "tone-blue",
              icon: ICONS.calendar,
              title: t("ตารางสอน & อัปโหลด Slide", "Teaching Schedule & Slides"),
              sub: t("ดูภาระงานสอนรายอาจารย์ ซิงค์ปฏิทิน และแนบสไลด์", "Personal teaching calendar & slide upload"),
              badge: t("6 สัปดาห์", "6 Weeks"),
              action: () => navigateFromTile("app-sched", () => navigateTvTab("schedule"))
            },
            {
              id: "app-sites",
              tone: "tone-emerald",
              icon: ICONS.map,
              title: t("กลุ่ม & 9 พื้นที่ภาคสนาม", "Groups & 9 Fieldwork Sites"),
              sub: t("โรงพยาบาลชุมชน 9 แห่ง ผังห้อง Discussion 1–6 และใบรูปถ่าย A4", "9 community hospitals, 6 discussion rooms & photo sheets"),
              badge: t("9 แห่ง · 6 กลุ่ม", "9 Sites · 6 Groups"),
              action: () => navigateFromTile("app-sites", () => navigateTvTab("fieldwork"))
            },
            {
              id: "app-hsd",
              tone: "tone-crimson",
              icon: ICONS.slides,
              title: t("ระบบสุขภาพ · Google Drive", "Health Systems · Google Drive"),
              sub: t("File Explorer รวมโฟลเดอร์ HS1–HS6: เอกสารคำสอน สไลด์ Discussion .pptx เฉลย และ Slide อาจารย์", "Unified File Explorer for HS1–HS6 folders: docs, Discussion .pptx, Teacher Key & lecture slides"),
              badge: "HS1 – HS6",
              action: () => navigateFromTile("app-hsd", () => {
                const a = getApi();
                if (a && a.openTextbookDriveFolder) a.openTextbookDriveFolder("FOLDERS");
                else navigateTvTab("textbooks");
              })
            },
            {
              id: "app-guides",
              tone: "tone-amber",
              icon: ICONS.book,
              title: t("คู่มือผู้สอน & โจทย์อภิปราย", "Facilitator Guides & Key"),
              sub: t("แนวทางนำอภิปราย เฉลย Teacher Key โจทย์ 60 ข้อ และเอกสารต้นฉบับ HS1–HS6", "Facilitator guides, Teacher Key, 60 practice items & HS1–HS6 references"),
              badge: "HS1 – HS6",
              action: () => navigateFromTile("app-guides", () => navigateTvTab("faculty-docs"))
            },
            {
              id: "app-epi",
              tone: "tone-teal",
              icon: ICONS.chart,
              title: t("ระบาดวิทยา (EP1–EP9)", "Epidemiology (EP1–EP9)"),
              sub: t("อัปโหลด Slide คาบ EP1–EP9 & Ex 1–6 ห้องเรียน Zoom · SPSS และฟอร์ม 4A", "Slide upload, EP1–EP9 & Ex 1–6, Zoom rooms, SPSS & Form 4A"),
              badge: "EP1 – EP9",
              action: () => navigateFromTile("app-epi", () => navigateTvTab("epidemiology"))
            },
            {
              id: "app-admin",
              tone: "tone-slate",
              icon: ICONS.upload,
              title: t("ตรวจงาน · ใบลา · ตาราง", "Grading, Leave & Audit"),
              sub: t("ตรวจ SRN อนุมัติใบลานักศึกษา และตรวจซิงค์ตาราง", "Grade SRN, sign leave forms & audit schedule"),
              badge: "E-learning",
              action: () => navigateFromTile("app-admin", () => navigateTvTab("submissions"))
            }
          ]
        : [
            {
              id: "app-sched",
              tone: "tone-blue",
              icon: ICONS.calendar,
              title: t("ตารางเรียน & ปฏิทิน", "Class Schedule & Calendar"),
              sub: t("เช็กวัน-เวลาเรียน ห้องเรียน และซิงค์ลงมือถือ", "Weekly timetable & 1-tap iCal / Google sync"),
              badge: t("6 สัปดาห์", "6 Weeks"),
              action: () => navigateFromTile("app-sched", () => navigateTvTab("schedule"))
            },
            {
              id: "app-sites",
              tone: "tone-emerald",
              icon: ICONS.map,
              title: t("กลุ่ม & 9 พื้นที่ภาคสนาม", "Groups & 9 Fieldwork Sites"),
              sub: t("แผนที่โรงพยาบาลชุมชน วันเดินทาง กลุ่ม Discussion และเพื่อนในกลุ่ม", "Hospital sites, travel dates & group roster"),
              badge: t("9 แห่ง · 6 กลุ่ม", "9 Sites · 6 Groups"),
              action: () => navigateFromTile("app-sites", () => navigateTvTab("fieldwork"))
            },
            {
              id: "app-hsd",
              tone: "tone-teal",
              icon: ICONS.slides,
              title: t("ระบบสุขภาพ · Google Drive", "Health Systems · Google Drive"),
              sub: t("เปิด File Explorer โฟลเดอร์ HS1–HS6 รวมเอกสารคำสอน สไลด์ Discussion .pptx และ Slide อาจารย์", "Unified File Explorer for HS1–HS6 folders: docs, Discussion .pptx, lecture slides & worksheets"),
              badge: t("HS1 – HS6", "HS1 – HS6"),
              action: () => navigateFromTile("app-hsd", () => {
                const a = getApi();
                if (a && a.openTextbookDriveFolder) a.openTextbookDriveFolder("FOLDERS");
                else navigateTvTab("textbooks");
              })
            },
            {
              id: "app-books",
              tone: "tone-amber",
              icon: ICONS.book,
              title: t("คำศัพท์ 111 คำ & โจทย์ 60 ข้อ", "111 Flashcards & 60 Quiz"),
              sub: t("ตารางทบทวนเร็ว High-Yield บัตรคำศัพท์ และโจทย์ฝึกคิด Active Recall ครบ HS1–HS6", "High-Yield rapid review, flashcards & 60 active recall questions"),
              badge: t("HS1 – HS6", "HS1 – HS6"),
              action: () => navigateFromTile("app-books", () => navigateTvTab("practice"))
            },
            {
              id: "app-epi",
              tone: "tone-slate",
              icon: ICONS.chart,
              title: t("ระบาดวิทยา (EP1–EP9)", "Epidemiology (EP1–EP9)"),
              sub: t("คาบเรียน EP1–EP9 & Exercise 1–6 ห้องเรียน Zoom · SPSS สัดส่วนสอบ & ฟอร์ม 4A", "EP1–EP9 lectures, Exercises 1–6, Zoom rooms, SPSS & Form 4A"),
              badge: t("EP1 – EP9", "EP1 – EP9"),
              action: () => navigateFromTile("app-epi", () => navigateTvTab("epidemiology"))
            },
            {
              id: "app-submit",
              tone: "tone-crimson",
              icon: ICONS.upload,
              title: t("ส่งงาน & ยื่นใบลา", "Submissions & Leave Form"),
              sub: t("ส่ง SRN 1–2 เช็กหน้า PDF และเขียนใบลาออนไลน์", "Submit SRN, check PDF pages & e-sign leave"),
              badge: t("4 ชิ้นงาน", "4 Tasks"),
              action: () => navigateFromTile("app-submit", () => navigateTvTab("submissions"))
            }
          ];

    const modules = HSD.modules || [];
    const sites = SCHED.fieldworkSites || [];

    panel.innerHTML = `
      <div class="tv-home-launcher">
        <!-- HERO STAGE -->
        <div class="tv-hero-stage" id="tvHeroStage">
          <div class="tv-hero-top-row">
            <span class="tv-hero-kicker">${esc(heroKicker)}</span>
            <span class="tv-remote-hint"><kbd>◀</kbd><kbd>▲</kbd><kbd>▼</kbd><kbd>▶</kbd> ${esc(t("เลื่อนเลือกเหมือนรีโมต TV", "Arrow keys to navigate"))} · <kbd>Enter</kbd> ${esc(t("เปิด", "Open"))}</span>
          </div>

          <div class="tv-hero-body">
            <h1 class="tv-hero-title">${esc(heroTitle)}</h1>
            <p class="tv-hero-meta">${esc(heroMeta)}</p>
          </div>

          <div class="tv-hero-actions">
            ${
              zoomUrl
                ? `<a class="tv-hero-btn is-primary" href="${esc(zoomUrl)}" target="_blank" rel="noopener" data-tv-focus data-tv-row="1">${ICONS.video} <span>${esc(t("เข้าห้องเรียน Zoom", "Join Zoom Room"))}</span></a>`
                : `<button type="button" class="tv-hero-btn is-primary" id="tvHeroPrimaryBtn" data-tv-focus data-tv-row="1">▶ <span>${esc(
                    nextSess && nextSess.hsModule
                      ? t(`เปิดสไลด์ ${nextSess.hsModule}`, `Open ${nextSess.hsModule} Slides`)
                      : ROLE === "faculty"
                        ? t("เปิดดูตารางสอน", "Open Schedule")
                        : t("เปิดดูตารางเรียน", "Open Schedule")
                  )}</span></button>`
            }
            ${
              hasProfile
                ? `<button type="button" class="tv-hero-btn is-glass" id="tvHeroSyncIcsBtn" data-tv-focus data-tv-row="1">${ICONS.calendar} <span>${esc(t("บันทึกเข้าปฏิทินมือถือ (.ics)", "Add to Calendar (.ics)"))}</span></button>
                   <button type="button" class="tv-hero-btn is-glass" id="tvHeroProfileBtn" data-tv-focus data-tv-row="1">${ICONS.edit} <span>${esc(t("เปลี่ยนโปรไฟล์", "Switch Profile"))}</span></button>`
                : `<button type="button" class="tv-hero-btn is-glass" id="tvHeroProfileBtn" data-tv-focus data-tv-row="1">${ICONS.user} <span>${esc(
                    ROLE === "faculty"
                      ? t("เลือกชื่ออาจารย์ผู้สอน", "Select Faculty Profile")
                      : t("เลือกชื่อ / กลุ่มของฉัน", "Select My Name or Group")
                  )}</span></button>`
            }
          </div>
        </div>

        <!-- SHELF 1: MAIN APPS -->
        <div class="tv-shelf" aria-label="เมนูหลัก">
          <div class="tv-shelf-head">
            <div>
              <h2 class="tv-shelf-title">${esc(t("เลือกเมนูหลัก", "Main Menu"))}</h2>
            </div>
            <span class="tv-shelf-sub">${esc(t("คลิกหรือกด Enter เพื่อเข้าใช้งาน", "Click or press Enter"))}</span>
          </div>
          <div class="tv-apps-grid" id="tvAppsGrid">
            ${appTiles
              .map(
                (tile) => `
              <button type="button" class="tv-app-tile" id="${tile.id}" data-tv-focus data-tv-row="2">
                <span class="tv-app-icon ${tile.tone}">${tile.icon}</span>
                <span class="tv-app-copy">
                  <span class="tv-app-title">${esc(tile.title)}</span>
                  <span class="tv-app-sub">${esc(tile.sub)}</span>
                  <span class="tv-app-badge">${esc(tile.badge)}</span>
                </span>
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- SHELF 2: EPISODES HS1 - HS6 -->
        <div class="tv-shelf" aria-label="บทเรียนระบบสุขภาพ HS1 ถึง HS6">
          <div class="tv-shelf-head">
            <div>
              <h2 class="tv-shelf-title">${esc(t("ระบบสุขภาพ HS1 – HS6", "Health Systems Episodes (HS1–HS6)"))}</h2>
            </div>
            <div class="tv-shelf-controls">
              <button type="button" class="tv-paddle-btn" data-scroll-target="tvEpisodesTrack" data-scroll-dir="-1" aria-label="เลื่อนซ้าย">‹</button>
              <button type="button" class="tv-paddle-btn" data-scroll-target="tvEpisodesTrack" data-scroll-dir="1" aria-label="เลื่อนขวา">›</button>
            </div>
          </div>
          <div class="tv-shelf-track is-episodes" id="tvEpisodesTrack">
            ${modules
              .map(
                (m, idx) => `
              <button type="button" class="tv-episode-card ep-${idx + 1}" id="tvEpCard-${m.code}" data-ep-code="${esc(m.code)}" data-ep-num="0${idx + 1}" data-tv-focus data-tv-row="3">
                <span class="tv-ep-top">
                  <span class="tv-ep-code">${esc(m.code)}</span>
                  <span class="tv-ep-weight">${esc(t(`น้ำหนักสอบ ${m.examWeight}`, `Exam ${m.examWeight}`))}</span>
                </span>
                <span class="tv-ep-bottom">
                  <span class="tv-ep-title">${esc(getLang() === "en" && m.enTitle ? m.enTitle : m.title)}</span>
                  <span class="tv-ep-date">${esc(m.scheduleDate.replace(/^วัน/, ""))} · ${esc(m.discTime)}</span>
                </span>
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- SHELF 3: 9 FIELDWORK HOSPITALS -->
        <div class="tv-shelf" aria-label="พื้นที่ฝึกภาคสนาม 9 โรงพยาบาล">
          <div class="tv-shelf-head">
            <div>
              <h2 class="tv-shelf-title">${esc(t("พื้นที่ภาคสนาม 9 โรงพยาบาล", "9 Fieldwork Hospitals"))}</h2>
            </div>
            <div class="tv-shelf-controls">
              <button type="button" class="tv-paddle-btn" data-scroll-target="tvSitesTrack" data-scroll-dir="-1" aria-label="เลื่อนซ้าย">‹</button>
              <button type="button" class="tv-paddle-btn" data-scroll-target="tvSitesTrack" data-scroll-dir="1" aria-label="เลื่อนขวา">›</button>
            </div>
          </div>
          <div class="tv-shelf-track is-sites" id="tvSitesTrack">
            ${sites
              .map((s) => {
                const cleanStaff = String(s.staffRef || "")
                  .replace(/\s*\[[^\]]*\]/g, "")
                  .trim();
                return `
              <button type="button" class="tv-site-card" id="tvSiteCard-${s.id}" data-site-short="${esc(s.shortName)}" data-tv-focus data-tv-row="4">
                <span class="tv-site-top">
                  <span class="tv-site-num">0${s.id}</span>
                  <span class="tv-site-count">${s.count} ${esc(t("คน", "students"))}</span>
                </span>
                <span>
                  <span class="tv-site-name">${esc(s.hospital)}</span>
                  <span class="tv-site-prov">${esc(s.province)}</span>
                </span>
                <span class="tv-site-mentor">
                  <strong>${esc(t("อ.ประจำกลุ่ม:", "Advisor:"))}</strong> ${esc(s.advisors || "-")}${
                  cleanStaff
                    ? `<br><strong>${esc(t("ผู้ประสานงาน:", "Coordinator:"))}</strong> ${esc(cleanStaff)}`
                    : ""
                }
                </span>
                <span class="tv-site-dates">${esc(s.badgeDates || s.datesTH)}</span>
              </button>
            `;
              })
              .join("")}
          </div>
        </div>

        <!-- SHELF 4: QUICK LINKS (ZOOM & LEAVE) -->
        <div class="tv-shelf" aria-label="ห้องเรียนออนไลน์และทางลัดด่วน">
          <div class="tv-shelf-head">
            <h2 class="tv-shelf-title">${esc(t("ห้องเรียน Zoom & ทางลัดด่วน", "Zoom Rooms & Quick Links"))}</h2>
          </div>
          <div class="tv-quick-grid">
            <a class="tv-quick-card" href="https://zoom.us/j/91022561292?pwd=et9CaKS1UfrmfbU3euz5UKpDqKHrrV.1" target="_blank" rel="noopener" data-tv-focus data-tv-row="5">
              <span class="tv-quick-tag">ZOOM · ศ. 27 พ.ย. 69</span>
              <span class="tv-quick-title">EP1 – EP3 &amp; Exercise 1–2</span>
              <span class="tv-quick-meta">ID: 910 2256 1292 · Pass: 346256</span>
            </a>
            <a class="tv-quick-card" href="https://zoom.us/j/94317626613?pwd=0M6tElkd5gdbRjjdMQ1wYUmThR7Bla.1" target="_blank" rel="noopener" data-tv-focus data-tv-row="5">
              <span class="tv-quick-tag">ZOOM · พ. 2 ธ.ค. 69</span>
              <span class="tv-quick-title">EP4 – EP5 &amp; Exercise 3–4</span>
              <span class="tv-quick-meta">ID: 943 1762 6613 · Pass: 547989</span>
            </a>
            <a class="tv-quick-card" href="https://zoom.us/j/92940953542?pwd=95C9xFpBvOFg8gtuaXkDBkc4ivtFGU.1" target="_blank" rel="noopener" data-tv-focus data-tv-row="5">
              <span class="tv-quick-tag">ZOOM · พฤ. 3 ธ.ค. 69</span>
              <span class="tv-quick-title">EP6 – EP9 &amp; Exercise 5–6</span>
              <span class="tv-quick-meta">ID: 929 4095 3542 · Pass: 165796</span>
            </a>
            <button type="button" class="tv-quick-card" id="tvQuickLeaveCardBtn" data-tv-focus data-tv-row="5">
              <span class="tv-quick-tag">${ROLE === "faculty" ? "ธุรการรายวิชา" : "ใบลาออนไลน์"}</span>
              <span class="tv-quick-title">${esc(ROLE === "faculty" ? t("ดูคำขอใบลานักศึกษา", "Student Leave Inbox") : t("ยื่นใบลากิจ / ลาป่วย", "Submit Leave Request"))}</span>
              <span class="tv-quick-meta">${esc(t("ลงลายมือชื่อดิจิทัล & ส่งออก PDF", "Digital signature & PDF export"))}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const heroPrimary = $("tvHeroPrimaryBtn");
    if (heroPrimary) {
      heroPrimary.addEventListener("click", () => {
        if (nextSess && nextSess.hsModule && api && api.openHsDiscussion) {
          api.openHsDiscussion(nextSess.hsModule);
        } else {
          navigateTvTab("schedule");
        }
      });
    }

    const heroSyncBtn = $("tvHeroSyncIcsBtn");
    if (heroSyncBtn) {
      heroSyncBtn.addEventListener("click", () => {
        if (api && api.downloadScheduleIcs) api.downloadScheduleIcs();
      });
    }

    const heroProfBtn = $("tvHeroProfileBtn");
    if (heroProfBtn) {
      heroProfBtn.addEventListener("click", () => openProfileModal());
    }

    appTiles.forEach((tile) => {
      const el = $(tile.id);
      if (el) el.addEventListener("click", tile.action);
    });

    panel.querySelectorAll("[data-ep-code]").forEach((card) => {
      card.addEventListener("click", () => {
        lastHomeTileFocusSelector = `#${card.id}`;
        openEpisodeModal(card.dataset.epCode);
      });
    });

    panel.querySelectorAll("[data-site-short]").forEach((card) => {
      card.addEventListener("click", () => {
        lastHomeTileFocusSelector = `#${card.id}`;
        if (api && api.openFieldworkSite) api.openFieldworkSite(card.dataset.siteShort);
      });
    });

    const leaveCard = $("tvQuickLeaveCardBtn");
    if (leaveCard) {
      leaveCard.addEventListener("click", () => {
        lastHomeTileFocusSelector = "#tvQuickLeaveCardBtn";
        navigateTvTab("leave");
      });
    }

    panel.querySelectorAll("[data-scroll-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const track = $(btn.dataset.scrollTarget);
        if (!track) return;
        const dir = Number(btn.dataset.scrollDir) || 1;
        track.scrollBy({ left: dir * 560, behavior: "smooth" });
      });
    });
  }

  function navigateFromTile(tileId, fn) {
    lastHomeTileFocusSelector = `#${tileId}`;
    fn();
  }

  /* ---------- 3. Episode Quick-Action Sheet Modal ---------- */
  function openEpisodeModal(epCode) {
    const mod = (HSD.modules || []).find((m) => m.code === epCode);
    if (!mod) return;
    closeAllTvModals();

    const api = getApi();
    const backdrop = document.createElement("div");
    backdrop.className = "tv-modal-backdrop";
    backdrop.id = "tvEpisodeModal";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    backdrop.innerHTML = `
      <div class="tv-modal-sheet is-compact">
        <div class="tv-modal-head">
          <div>
            <span class="tv-app-badge" style="margin-top:0;margin-bottom:8px">${esc(mod.code)} · ${esc(mod.scheduleDate.replace(/^วัน/, ""))}</span>
            <h3 class="tv-modal-title">${esc(getLang() === "en" && mod.enTitle ? mod.enTitle : mod.title)}</h3>
            <p class="tv-modal-sub">${esc(mod.summaryFocus || "")}</p>
          </div>
          <button type="button" class="tv-modal-close" id="tvCloseEpModalBtn" aria-label="ปิด">✕</button>
        </div>

        <div class="tv-ep-action-list">
          <button type="button" class="tv-ep-action-btn is-primary" id="tvEpActSlides" data-tv-modal-focus>
            <span>
              <span class="tv-ep-action-title-row">▶ <span>${esc(
                ROLE === "faculty"
                  ? t(`เปิดไฟล์สไลด์ Discussion ระบบสุขภาพ (${mod.code}.pptx) & เฉลย`, `Open ${mod.code}.pptx Discussion Slides & Key`)
                  : t(`เปิดไฟล์สไลด์ Discussion ระบบสุขภาพ (${mod.code}.pptx)`, `Open ${mod.code}.pptx Discussion Slides`)
              )}</span></span>
              <span class="tv-ep-action-sub">${esc(
                ROLE === "faculty"
                  ? t(`เริ่มด้วยสไลด์เปิดคาบเช็คชื่อ Kahoot + โจทย์ 16:9 และเฉลย · คาบ ${mod.discTime}`, `Starts with Opening Kahoot slide + 16:9 Case Slides & Key · ${mod.discTime}`)
                  : t(`สไลด์หน้าแรกเช็คชื่อกลุ่มย่อย Kahoot + โจทย์สไลด์ 16:9 · คาบ ${mod.discTime}`, `Slide 1 Opening Kahoot check-in + 16:9 Case Slides · ${mod.discTime}`)
              )}</span>
            </span>
            <span>→</span>
          </button>

          <button type="button" class="tv-ep-action-btn" id="tvEpActDocsDrive" data-tv-modal-focus>
            <span>
              <span class="tv-ep-action-title-row">${ICONS.book} <span>${esc(t(`เอกสารคำสอน (${mod.code} · ฉบับย่อ & ฉบับเต็ม)`, `Open ${mod.code} Teaching Docs (Concise & Full)`))}</span></span>
              <span class="tv-ep-action-sub">${esc(t("เลือกอ่านฉบับย่อ (Abridged) หรือฉบับเต็ม พร้อมดาวน์โหลด PDF / Word", "Concise & Full textbooks + PDF/Word downloads"))}</span>
            </span>
            <span>→</span>
          </button>

          <button type="button" class="tv-ep-action-btn" id="tvEpActLecSlides" data-tv-modal-focus>
            <span>
              <span class="tv-ep-action-title-row">${ICONS.slides} <span>${esc(t(`Slide อาจารย์ประจำคาบ ${mod.code} (รออาจารย์ Upload)`, `${mod.code} Instructor Lecture Slides (Pending Upload)`))}</span></span>
              <span class="tv-ep-action-sub">${esc(t(`สไลด์ประกอบการบรรยายช่วงต้นคาบ (${mod.lectureTime || "1 ชม. แรก"})`, "Instructor lecture slides"))}</span>
            </span>
            <span>→</span>
          </button>

          <button type="button" class="tv-ep-action-btn" id="tvEpActQuiz" data-tv-modal-focus>
            <span>
              <span class="tv-ep-action-title-row">${ICONS.quiz} <span>${esc(t(`ฝึกทำโจทย์และคำศัพท์ประจำบท ${mod.code}`, `Practice ${mod.code} Quiz & Flashcards`))}</span></span>
              <span class="tv-ep-action-sub">${esc(t("เช็กความเข้าใจด้วยโจทย์ Active Recall", "Active recall questions & key terms"))}</span>
            </span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => {
      backdrop.remove();
      restoreHomeFocus();
    };

    $("tvCloseEpModalBtn").addEventListener("click", close);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });

    $("tvEpActSlides").addEventListener("click", () => {
      backdrop.remove();
      if (api && api.openHsDiscussion) api.openHsDiscussion(mod.code);
    });

    $("tvEpActDocsDrive").addEventListener("click", () => {
      backdrop.remove();
      if (api && api.openTextbookDriveFolder) {
        api.openTextbookDriveFolder(mod.code);
      } else if (api && api.openTextbookDoc) {
        api.openTextbookDoc(mod.conciseDocId || `${mod.code}-CONCISE`);
      }
    });

    $("tvEpActLecSlides").addEventListener("click", () => {
      backdrop.remove();
      if (api && api.openHsLectureSlides) api.openHsLectureSlides(mod.code);
    });

    $("tvEpActQuiz").addEventListener("click", () => {
      backdrop.remove();
      if (api && api.openPractice) api.openPractice(mod.code, "qa");
    });

    requestAnimationFrame(() => {
      const firstBtn = $("tvEpActSlides");
      if (firstBtn) firstBtn.focus();
    });
  }

  /* ---------- 4. Apple TV Profile Picker Modal ---------- */
  function openProfileModal() {
    closeAllTvModals();
    const api = getApi();
    const st = api && api.getState ? api.getState() : {};

    const backdrop = document.createElement("div");
    backdrop.className = "tv-modal-backdrop";
    backdrop.id = "tvProfileModal";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    if (ROLE === "faculty") {
      const teachers = ROSTER.courseTeachers || [];
      backdrop.innerHTML = `
        <div class="tv-modal-sheet">
          <div class="tv-modal-head">
            <div>
              <h3 class="tv-modal-title">${esc(t("เลือกชื่ออาจารย์ผู้สอน", "Select Faculty Profile"))}</h3>
              <p class="tv-modal-sub">${esc(t("ระบบจะกรองตารางสอน ห้องคุมกลุ่ม และลิงก์ปฏิทิน (.ics) เฉพาะของท่านให้อัตโนมัติ", "Automatically tailors your teaching schedule & room assignments"))}</p>
            </div>
            <button type="button" class="tv-modal-close" id="tvCloseProfModalBtn" aria-label="ปิด">✕</button>
          </div>

          <div style="margin-bottom:14px;display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="tv-hosp-chip ${!st.myTeacherKey ? "is-active" : ""}" id="tvClearTeacherBtn" data-tv-modal-focus>
              แสดงรวมทุกอาจารย์ (ทั้งหมด)
            </button>
          </div>

          <div class="tv-profiles-grid" id="tvTeacherCardsGrid">
            ${teachers
              .map(
                (tc) => `
              <button type="button" class="tv-person-card ${st.myTeacherKey === tc.key ? "is-selected" : ""}" data-teacher-key="${esc(tc.key)}" data-tv-modal-focus>
                <span class="tv-person-avatar">${esc(getCleanMonogram(tc.key))}</span>
                <span class="tv-person-info">
                  <span class="tv-person-name">${esc(tc.label.replace(/\s*\(.*?\)\s*/g, ""))}</span>
                  <span class="tv-person-meta">${esc((tc.label.match(/\((.*?)\)/) || ["", "คณาจารย์ผู้สอน"])[1])}</span>
                </span>
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      const close = () => {
        backdrop.remove();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      $("tvCloseProfModalBtn").addEventListener("click", close);
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) close();
      });

      $("tvClearTeacherBtn").addEventListener("click", () => {
        if (api && api.clearAllPersonalization) api.clearAllPersonalization();
        syncProfilePill();
        renderHomeLauncher();
        close();
      });

      backdrop.querySelectorAll("[data-teacher-key]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (api && api.selectActiveTeacher) api.selectActiveTeacher(btn.dataset.teacherKey, true);
          syncProfilePill();
          renderHomeLauncher();
          close();
        });
      });

      requestAnimationFrame(() => {
        const sel = backdrop.querySelector(".tv-person-card.is-selected") || backdrop.querySelector(".tv-person-card");
        if (sel) sel.focus({ preventScroll: true });
      });
      return;
    }

    // STUDENT PROFILE PICKER
    const sites = SCHED.fieldworkSites || [];
    if (!selectedProfileAreaFilter && st.myStudent) {
      selectedProfileAreaFilter = st.myStudent.area || "";
    }

    backdrop.innerHTML = `
      <div class="tv-modal-sheet">
        <div class="tv-modal-head">
          <div>
            <h3 class="tv-modal-title">${esc(t("เลือกโปรไฟล์นักศึกษาของคุณ", "Choose Your Student Profile"))}</h3>
            <p class="tv-modal-sub">${esc(t("เลือกโรงพยาบาลภาคสนามด้านล่าง หรือพิมพ์ชื่อ/รหัส 7 หลัก เพื่อผูกตารางเรียนและห้องกลุ่มอัตโนมัติ", "Pick your hospital group or search your name / 7-digit ID"))}</p>
          </div>
          <button type="button" class="tv-modal-close" id="tvCloseProfModalBtn" aria-label="ปิด">✕</button>
        </div>

        <input type="search" class="tv-profile-search" id="tvStudentSearchInput" placeholder="${esc(t("พิมพ์ชื่อเล่น ชื่อจริง หรือรหัสนักศึกษา 6702xxx…", "Type nickname, name, or 6702xxx…"))}" autocomplete="off">

        <div class="tv-hospital-chips" id="tvHospitalChipsBar">
          <button type="button" class="tv-hosp-chip ${!selectedProfileAreaFilter ? "is-active" : ""}" data-area-chip="">ทุกกลุ่ม (169)</button>
          ${sites
            .map(
              (s) => `
            <button type="button" class="tv-hosp-chip ${selectedProfileAreaFilter === s.shortName ? "is-active" : ""}" data-area-chip="${esc(s.shortName)}">${s.id}. ${esc(s.shortName)}</button>
          `
            )
            .join("")}
          ${
            st.myStudent
              ? `<button type="button" class="tv-hosp-chip" id="tvResetStudentProfileBtn" style="margin-left:auto;color:#dc2626;border-color:rgba(220,38,38,0.3)">✕ ล้างโปรไฟล์ของฉัน</button>`
              : ""
          }
        </div>

        <div class="tv-profiles-grid" id="tvStudentCardsGrid"></div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => {
      backdrop.remove();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    $("tvCloseProfModalBtn").addEventListener("click", close);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });

    const resetBtn = $("tvResetStudentProfileBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        selectedProfileAreaFilter = "";
        if (api && api.clearAllPersonalization) api.clearAllPersonalization();
        syncProfilePill();
        renderHomeLauncher();
        close();
      });
    }

    const searchInput = $("tvStudentSearchInput");
    const grid = $("tvStudentCardsGrid");

    function renderStudentChoices() {
      const q = (searchInput.value || "").trim().toLocaleLowerCase("th");
      const matched = (ROSTER.students || []).filter((s) => {
        if (selectedProfileAreaFilter && s.area !== selectedProfileAreaFilter) return false;
        if (!q) return true;
        const hay = `${s.id} ${s.fullName} ${s.nickname || ""} ${s.area} กลุ่ม ${s.disc}`.toLocaleLowerCase("th");
        return hay.includes(q);
      });

      const shown = matched.slice(0, 48);
      grid.innerHTML = shown
        .map((s) => {
          const isMe = st.myStudent && st.myStudent.id === s.id;
          const labelName = s.nickname ? `${s.nickname} · ${s.name}` : s.fullName;
          const mono = getCleanMonogram(s.nickname || s.name || "น");
          return `
            <button type="button" class="tv-person-card ${isMe ? "is-selected" : ""}" data-sid="${esc(s.id)}" data-tv-modal-focus>
              <span class="tv-person-avatar">${esc(mono)}</span>
              <span class="tv-person-info">
                <span class="tv-person-name">${esc(labelName)}</span>
                <span class="tv-person-meta">${esc(s.id)} · ${esc(s.area)} · G${s.disc}</span>
              </span>
            </button>
          `;
        })
        .join("");

      grid.querySelectorAll("[data-sid]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const student = (ROSTER.students || []).find((x) => x.id === btn.dataset.sid);
          if (student && api && api.applyMyStudent) {
            api.applyMyStudent(student, true);
            syncProfilePill();
            renderHomeLauncher();
          }
          close();
        });
      });
    }

    backdrop.querySelectorAll("[data-area-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        selectedProfileAreaFilter = chip.dataset.areaChip || "";
        backdrop.querySelectorAll("[data-area-chip]").forEach((c) =>
          c.classList.toggle("is-active", (c.dataset.areaChip || "") === selectedProfileAreaFilter)
        );
        renderStudentChoices();
      });
    });

    searchInput.addEventListener("input", renderStudentChoices);
    renderStudentChoices();

    requestAnimationFrame(() => searchInput.focus({ preventScroll: true }));
  }

  function closeAllTvModals() {
    ["tvEpisodeModal", "tvProfileModal"].forEach((id) => {
      if ($(id)) $(id).remove();
    });
  }

  function restoreHomeFocus() {
    if (!lastHomeTileFocusSelector) return;
    const el = document.querySelector(lastHomeTileFocusSelector);
    if (el && typeof el.focus === "function") {
      requestAnimationFrame(() => el.focus({ preventScroll: true }));
    }
  }

  /* ---------- 5. Sub-Page Bar & Progressive Disclosure on Inner Screens ---------- */
  function mountSubpageEnhancements() {
    const main = document.querySelector(".portal-main");
    if (!main || $("tvSubpageBar")) return;

    const bar = document.createElement("div");
    bar.className = "tv-subpage-bar";
    bar.id = "tvSubpageBar";
    bar.hidden = true;
    main.insertBefore(bar, main.firstChild);

    // Schedule Progressive Disclosure Toggles
    const schedHeader = document.querySelector("#panel-schedule > .section-header");
    const schedHub = $("schedUnifiedHub");
    if (schedHeader && schedHub && !$("tvSchedQuickBar")) {
      const exportGroup = schedHeader.querySelector(".cal-export-group") || schedHeader;
      const quickWrap = document.createElement("div");
      quickWrap.className = "tv-sched-quickbar";
      quickWrap.id = "tvSchedQuickBar";

      const syncBtn = document.createElement("button");
      syncBtn.type = "button";
      syncBtn.className = "tv-pill-action-btn is-primary";
      syncBtn.id = "tvQuickIcsBtn";
      syncBtn.innerHTML = `${ICONS.calendar} <span>${esc(t("เพิ่มเข้าปฏิทิน (.ics)", "Add to Calendar (.ics)"))}</span>`;
      syncBtn.addEventListener("click", () => {
        const api = getApi();
        if (api && api.downloadScheduleIcs) api.downloadScheduleIcs();
      });

      const filterToggleBtn = document.createElement("button");
      filterToggleBtn.type = "button";
      filterToggleBtn.className = "tv-pill-action-btn";
      filterToggleBtn.id = "tvToggleSchedHubBtn";
      filterToggleBtn.setAttribute("aria-expanded", "false");
      filterToggleBtn.innerHTML = `${ICONS.sliders} <span>${esc(t("ตัวกรอง & ส่งออกไฟล์", "Filters & Export"))}</span>`;
      filterToggleBtn.addEventListener("click", () => {
        const open = !schedHub.classList.contains("is-tv-open");
        schedHub.classList.toggle("is-tv-open", open);
        filterToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });

      exportGroup.insertBefore(filterToggleBtn, exportGroup.firstChild);
      exportGroup.insertBefore(syncBtn, exportGroup.firstChild);
    }

    // Ensure Calendar Right Sidebar starts collapsed for clean full-width view
    const calSplit = $("calWorkspaceSplit");
    const calInspector = $("calSideInspector");
    const calToggleBtn = $("toggleCalSidebarBtn");
    if (calSplit && calInspector) {
      calInspector.hidden = true;
      calSplit.classList.add("is-sidebar-collapsed");
      if (calToggleBtn) calToggleBtn.setAttribute("aria-expanded", "false");
    }

    // Tuck multi-button export rows inside .section-header into a clean "ดาวน์โหลด / พิมพ์" menu
    document.querySelectorAll(".tab-panel > .section-header > .header-actions").forEach((actionsEl) => {
      if (actionsEl.dataset.tvSimplified) return;
      const children = [...actionsEl.children];
      if (children.length < 3) return;
      actionsEl.dataset.tvSimplified = "1";

      const exportBtns = children.filter((el) => {
        const txt = (el.textContent || "").toLowerCase();
        return (
          el.classList.contains("pdf-red") ||
          el.classList.contains("docx-blue") ||
          el.classList.contains("xlsx-green") ||
          el.classList.contains("print-ink") ||
          txt.includes("export") ||
          txt.includes("print") ||
          txt.includes("ใบงาน") ||
          txt.includes("ต้นฉบับ")
        );
      });

      if (exportBtns.length < 2) return;

      const wrap = document.createElement("div");
      wrap.className = "tv-export-menu-wrap";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "tv-pill-action-btn";
      trigger.setAttribute("aria-expanded", "false");
      trigger.innerHTML = `${ICONS.download} <span>ดาวน์โหลด / พิมพ์ ▾</span>`;

      const menu = document.createElement("div");
      menu.className = "tv-export-dropdown";
      menu.hidden = true;

      exportBtns.forEach((b) => menu.appendChild(b));
      wrap.append(trigger, menu);
      actionsEl.appendChild(wrap);

      trigger.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const willOpen = menu.hidden;
        document.querySelectorAll(".tv-export-dropdown").forEach((d) => (d.hidden = true));
        menu.hidden = !willOpen;
        trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });

      document.addEventListener("click", (ev) => {
        if (!menu.hidden && !wrap.contains(ev.target)) {
          menu.hidden = true;
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  function syncSubpageBar() {
    const bar = $("tvSubpageBar");
    const api = getApi();
    if (!bar || !api) return;
    const st = api.getState ? api.getState() : {};
    const activeTab = st.activeTab || "home";
    const groupKey = NAV_GROUP_MAP[activeTab] || "home";

    if (groupKey === "health-systems" || groupKey === "groups" || groupKey === "admin") {
      rememberedSubTab[groupKey] = activeTab;
    }

    document.querySelectorAll("[data-tv-nav]").forEach((btn) => {
      if (btn.dataset.tvNav === groupKey) {
        btn.setAttribute("aria-current", "page");
      } else {
        btn.removeAttribute("aria-current");
      }
    });

    if ($("panel-home")) {
      $("panel-home").hidden = activeTab !== "home";
    }

    if (activeTab === "home") {
      bar.hidden = true;
      renderHomeLauncher();
      return;
    }

    bar.hidden = false;

    if (groupKey === "health-systems") {
      const isLiveJoined = Boolean(ROLE === "student" && st.hsdSessionJoined && st.myStudent);

      bar.innerHTML = `
        <div class="tv-subpage-left-group">
          <button type="button" class="tv-back-home-btn" id="tvSubBackHomeBtn" data-tv-focus>
            <span>← ${esc(t("หน้าหลัก", "Home"))}</span>
          </button>
        </div>
        ${
          isLiveJoined
            ? `<div class="tv-hsd-bar-right">
                 <span class="tv-live-active-pill">
                   <span>🟢 ${esc(t(`กลุ่ม ${st.myStudent.disc} · ${st.myStudent.nickname || st.myStudent.id}`, `G${st.myStudent.disc} · ${st.myStudent.nickname || st.myStudent.id}`))}</span>
                   <button type="button" class="tv-live-exit-btn" id="tvHsdExitLiveBtn">${esc(t("ออกกลุ่ม", "Leave"))}</button>
                 </span>
               </div>`
            : ""
        }
      `;
      $("tvSubBackHomeBtn").addEventListener("click", () => {
        navigateTvTab("home");
        restoreHomeFocus();
      });
      const exitLiveBtn = $("tvHsdExitLiveBtn");
      if (exitLiveBtn) {
        exitLiveBtn.addEventListener("click", () => {
          if (api && api.exitHsLiveMode) api.exitHsLiveMode();
          syncSubpageBar();
        });
      }
      return;
    }

    // Epidemiology section filter bar (#panel-epidemiology)
    if (groupKey === "epidemiology") {
      const curEpSec = st.epSection || "all";
      const epPills = [
        { id: "all", label: t("ภาพรวมทั้งหมด", "All Sections") },
        { id: "sessions", label: t("คาบเรียน EP1–EP9 & Ex 1–6", "EP1–EP9 & Ex 1–6") },
        { id: "zoom-spss", label: t("ห้องเรียน Zoom & SPSS", "Zoom & SPSS") },
        { id: "exam-field", label: t("สัดส่วนสอบ & นำเสนอ (4A)", "Exam Spec & Form 4A") }
      ];
      bar.innerHTML = `
        <button type="button" class="tv-back-home-btn" id="tvSubBackHomeBtn">
          <span>← ${esc(t("หน้าหลัก", "Home"))}</span>
        </button>
        <div class="tv-sibling-pills" role="tablist" aria-label="หมวดย่อยระบาดวิทยา">
          ${epPills
            .map(
              (p) => `
            <button type="button" class="tv-sibling-pill ${p.id === curEpSec ? "is-active" : ""}" data-tv-ep-sec="${p.id}">${esc(p.label)}</button>
          `
            )
            .join("")}
        </div>
      `;
      $("tvSubBackHomeBtn").addEventListener("click", () => {
        navigateTvTab("home");
        restoreHomeFocus();
      });
      bar.querySelectorAll("[data-tv-ep-sec]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (api && api.setEpidemiologySection) {
            api.setEpidemiologySection(btn.dataset.tvEpSec);
          }
          syncSubpageBar();
        });
      });
      return;
    }

    let siblings = [];
    if (groupKey === "groups") {
      siblings = [
        { id: "fieldwork", label: t("9 พื้นที่ภาคสนาม", "9 Fieldwork Sites") },
        { id: "discussion", label: t("6 กลุ่ม Discussion", "6 Discussion Groups") }
      ];
    } else if (groupKey === "admin") {
      siblings =
        ROLE === "faculty"
          ? [
              { id: "submissions", label: t("รับงาน & ตรวจ SRN", "Submissions & SRN") },
              { id: "leave", label: t("อนุมัติใบลานักศึกษา", "Student Leave") },
              { id: "audit", label: t("ตรวจซิงค์ตารางสอน", "Schedule Audit") }
            ]
          : [
              { id: "submissions", label: t("ส่งงาน E-learning & SRN", "Submit Work & SRN") },
              { id: "leave", label: t("ยื่นใบลากิจ / ลาป่วย", "Leave Request") }
            ];
    }

    bar.innerHTML = `
      <button type="button" class="tv-back-home-btn" id="tvSubBackHomeBtn">
        <span>← ${esc(t("หน้าหลัก", "Home"))}</span>
      </button>
      ${
        siblings.length
          ? `<div class="tv-sibling-pills" role="tablist">
              ${siblings
                .map(
                  (s) => `
                <button type="button" class="tv-sibling-pill ${s.id === activeTab ? "is-active" : ""}" data-tv-sib="${s.id}">${esc(s.label)}</button>
              `
                )
                .join("")}
            </div>`
          : ""
      }
    `;

    $("tvSubBackHomeBtn").addEventListener("click", () => {
      navigateTvTab("home");
      restoreHomeFocus();
    });

    bar.querySelectorAll("[data-tv-sib]").forEach((btn) => {
      btn.addEventListener("click", () => navigateTvTab(btn.dataset.tvSib));
    });
  }

  /* ---------- 6. True Apple TV / Google TV 2D Spatial D-Pad Keyboard Controller ---------- */
  function isEditableElement(el) {
    if (!el) return false;
    const tag = (el.tagName || "").toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function isVisible(el) {
    if (!el || el.hidden) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== "hidden";
  }

  function findNextSpatialTarget(currentEl, candidates, dir) {
    const curRect = currentEl.getBoundingClientRect();
    const curCx = curRect.left + curRect.width / 2;
    const curCy = curRect.top + curRect.height / 2;
    const curRow = currentEl.dataset.tvRow;

    let best = null;
    let bestScore = Infinity;

    candidates.forEach((cand) => {
      if (cand === currentEl) return;
      const r = cand.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = cx - curCx;
      const dy = cy - curCy;

      if (dir === "ArrowRight") {
        if (dx <= 6) return;
        const sameRowPenalty = curRow && cand.dataset.tvRow === curRow ? 0 : Math.abs(dy) > curRect.height * 0.8 ? 9000 : 0;
        const score = dx + Math.abs(dy) * 3.2 + sameRowPenalty;
        if (score < bestScore) {
          bestScore = score;
          best = cand;
        }
      } else if (dir === "ArrowLeft") {
        if (dx >= -6) return;
        const sameRowPenalty = curRow && cand.dataset.tvRow === curRow ? 0 : Math.abs(dy) > curRect.height * 0.8 ? 9000 : 0;
        const score = Math.abs(dx) + Math.abs(dy) * 3.2 + sameRowPenalty;
        if (score < bestScore) {
          bestScore = score;
          best = cand;
        }
      } else if (dir === "ArrowDown") {
        if (dy <= 14) return;
        const score = dy * 1.8 + Math.abs(dx) * 0.55;
        if (score < bestScore) {
          bestScore = score;
          best = cand;
        }
      } else if (dir === "ArrowUp") {
        if (dy >= -14) return;
        const score = Math.abs(dy) * 1.8 + Math.abs(dx) * 0.55;
        if (score < bestScore) {
          bestScore = score;
          best = cand;
        }
      }
    });

    return best;
  }

  function initTvRemoteNavigation() {
    document.addEventListener("keydown", (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;

      const openModal = $("tvEpisodeModal") || $("tvProfileModal");

      if (ev.key === "Escape") {
        if (openModal) {
          ev.preventDefault();
          openModal.remove();
          restoreHomeFocus();
          return;
        }
        const morePop = $("tvMorePopover");
        if (morePop && !morePop.hidden) {
          morePop.hidden = true;
          return;
        }
        if (isEditableElement(ev.target)) {
          ev.target.blur();
          return;
        }
        const drivePickerEl = $("hsdGoogleDrivePickerModal");
        const pptExportEl = $("hsdPptExportStudioModal");
        if (pptExportEl && !pptExportEl.hidden) {
          ev.preventDefault();
          pptExportEl.hidden = true;
          return;
        }
        const otherDialogsOpen =
          (drivePickerEl && !drivePickerEl.hidden) ||
          ($("imageLightbox") && !$("imageLightbox").hidden) ||
          ($("calendarEventModal") && !$("calendarEventModal").hidden) ||
          ($("globalSpotlightModal") && !$("globalSpotlightModal").hidden) ||
          document.fullscreenElement;
        const api = getApi();
        const st = api && api.getState ? api.getState() : null;
        const curTab = st ? st.activeTab : "home";
        if (!otherDialogsOpen && st && st.hsdLobbyOpen) {
          return;
        }
        if (
          !otherDialogsOpen &&
          curTab === "hs-discussion" &&
          st &&
          st.hsdViewMode === "slide" &&
          !st.hsdDriveFolderOpen &&
          !st.hsdShowJoinGate &&
          !st.hsdTheater &&
          !st.hsdPptWindowMax &&
          api &&
          api.openHsDriveFolder
        ) {
          ev.preventDefault();
          api.openHsDriveFolder();
          return;
        }
        if (!otherDialogsOpen && curTab !== "home") {
          ev.preventDefault();
          navigateTvTab("home");
          restoreHomeFocus();
        }
        return;
      }

      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(ev.key)) return;
      if (isEditableElement(ev.target)) {
        if (openModal && ev.key === "ArrowDown" && ev.target.id === "tvStudentSearchInput") {
          const firstCard = openModal.querySelector("[data-tv-modal-focus]");
          if (firstCard) {
            ev.preventDefault();
            firstCard.focus({ preventScroll: true });
          }
        }
        return;
      }

      if (openModal) {
        const modalTargets = [...openModal.querySelectorAll("[data-tv-modal-focus]")].filter(isVisible);
        if (!modalTargets.length) return;
        ev.preventDefault();
        const cur = openModal.contains(document.activeElement) ? document.activeElement : null;
        if (!cur) {
          modalTargets[0].focus({ preventScroll: true });
          return;
        }
        const next = findNextSpatialTarget(cur, modalTargets, ev.key);
        if (next) {
          next.focus({ preventScroll: true });
          next.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
        return;
      }

      const api = getApi();
      const st = api && api.getState ? api.getState() : null;
      const activeTab = st ? st.activeTab : "home";
      const inTopBar = $("tvHeaderDock") && $("tvHeaderDock").contains(document.activeElement);
      const inDriveFolder = Boolean(activeTab === "hs-discussion" && st && st.hsdDriveFolderOpen && st.hsdViewMode === "slide");
      if (activeTab !== "home" && !inDriveFolder && !inTopBar) return;

      const candidates = [...document.querySelectorAll("[data-tv-focus]")].filter(isVisible);
      if (!candidates.length) return;

      ev.preventDefault();
      const cur = candidates.includes(document.activeElement) ? document.activeElement : null;
      if (!cur) {
        const defaultTarget = $("tvHeroPrimaryBtn") || candidates[0];
        if (defaultTarget) defaultTarget.focus({ preventScroll: true });
        return;
      }

      const next = findNextSpatialTarget(cur, candidates, ev.key);
      if (next) {
        next.focus({ preventScroll: true });
        next.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    });
  }

  /* ---------- 7. Full-Course Google Drive File Explorer View Mode (Dual View: TV vs Drive) ---------- */
  function ensureDrivePanelExists() {
    let panel = $("portalDriveExplorerPanel");
    if (!panel) {
      const main = document.querySelector("main.portal-main");
      if (!main) return null;
      panel = document.createElement("section");
      panel.className = "portal-drive-view-panel hsd-no-print";
      panel.id = "portalDriveExplorerPanel";
      panel.setAttribute("aria-label", "Google Drive File Explorer รายวิชา RACM 303");
      panel.hidden = true;
      main.prepend(panel);
    }
    return panel;
  }

  function syncViewModeSwitchUI() {
    document.body.dataset.portalViewMode = "study";
  }

  function hideCourseDriveBrowser() {
    driveBrowserActive = false;
    const panel = $("portalDriveExplorerPanel");
    if (panel) panel.hidden = true;
    const api = getApi();
    const activeTab = (api && api.getState && api.getState().activeTab) || "home";
    document.querySelectorAll("main.portal-main > .tab-panel").forEach((tp) => {
      tp.hidden = tp.id !== `panel-${activeTab}`;
    });
  }

  function syncTopNavForDrivePath(pathArr) {
    const first = pathArr && pathArr[0] ? pathArr[0] : "home";
    const navMap = {
      home: "home",
      schedule: "schedule",
      "health-systems": "health-systems",
      epidemiology: "epidemiology",
      fieldwork: "groups",
      manuals: "manual",
      admin: "admin"
    };
    const activeNav = navMap[first] || "home";
    document.querySelectorAll("#tvPillNavList [data-tv-nav]").forEach((btn) => {
      if (btn.dataset.tvNav === activeNav) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
  }

  function openCourseDriveAtPath(pathArr) {
    drivePath = Array.isArray(pathArr) ? [...pathArr] : [];
    driveBrowserActive = true;
    const panel = ensureDrivePanelExists();
    if (!panel) return;
    document.querySelectorAll("main.portal-main > .tab-panel").forEach((tp) => {
      tp.hidden = true;
    });
    const subBar = $("tvSubpageBar");
    if (subBar) subBar.hidden = true;
    panel.hidden = false;
    syncViewModeSwitchUI();
    syncTopNavForDrivePath(drivePath);
    renderFullCourseDriveExplorer();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setPortalViewMode() {
    const api = getApi();
    const st = api && api.getState ? api.getState() : {};
    const curTab = st.activeTab || "home";
    const inHs = NAV_GROUP_MAP[curTab] === "health-systems";

    portalViewMode = "tv";
    try {
      localStorage.removeItem("racm303_portal_view_mode");
      localStorage.removeItem("racm303_hs_ui_mode_v1");
    } catch (_) {}
    if (driveBrowserActive) {
      hideCourseDriveBrowser();
    }

    if (inHs && api && api.setHsUiMode) {
      api.setHsUiMode("apple-tv");
    }

    syncViewModeSwitchUI();
    syncSubpageBar();
  }

  function getFullCourseDriveCatalog() {
    const api = getApi();
    const HS_DATA = window.RACM_HS_DATA || { docs: [], glossary: [], selfCheck: [] };
    const modules = (HSD.modules && HSD.modules.length)
      ? HSD.modules
      : ["HS1", "HS2", "HS3", "HS4", "HS5", "HS6"].map((c) => ({ id: c, code: c, title: c }));
    const sites = SCHED.fieldworkSites || [];

    const openFileAction = (fn) => () => {
      hideCourseDriveBrowser();
      fn();
      syncSubpageBar();
    };

    const buildHsModuleFiles = (m) => {
      const files = [];
      const docs = HS_DATA.docs || [];
      const addDoc = (docId, suffix, kicker, icoCls, icoTxt, chip) => {
        if (!docId) return;
        const docObj = docs.find((d) => d.id === docId);
        if (!docObj) return;
        files.push({
          id: `hsdoc:${docId}`,
          folderPath: ["health-systems", m.id],
          name: `RACM303_${m.code}_${suffix}.gdoc`,
          title: `${m.code}: ${docObj.title || m.title}`,
          sub: kicker,
          meta: `${m.scheduleDate ? m.scheduleDate.replace(/^วัน/, "") : ""} · น้ำหนักสอบ ${m.examWeight || ""}`,
          badge: chip,
          icoCls,
          icoTxt,
          pdfHref: `exports/pdf/${encodeURIComponent(docId)}.pdf`,
          docxHref: `exports/docx/${encodeURIComponent(docId)}.docx`,
          onOpen: openFileAction(() => {
            if (api && api.openTextbookDoc) api.openTextbookDoc(docId);
          })
        });
      };

      addDoc(m.conciseDocId, "เอกสารคำสอน_ฉบับย่อ_(Abridged)", "⚡ เอกสารคำสอนฉบับย่อ + แผนภาพเตรียมสอบ", "is-gdoc", "≡", "ฉบับย่อ · อ่านไว");
      addDoc(m.docId, "เอกสารคำสอน_ฉบับเต็ม_(Full_Textbook)", "📚 เอกสารคำสอนฉบับสมบูรณ์พร้อมอ้างอิง", "is-gdoc", "≡", "ฉบับเต็ม");
      addDoc(m.wbDocId, "สมุดใบงาน_Worksheet", "📋 ใบงานฝึกคิดเตรียมความพร้อมก่อนเข้าคาบ", "is-gdoc", "📋", "Worksheet");

      const modCases = (HSD.cases || []).filter((c) => c.module === m.id);
      const qCount = modCases.reduce((acc, c) => acc + ((c.questions && c.questions.length) || 0), 0);
      files.push({
        id: `hsppt:${m.id}`,
        folderPath: ["health-systems", m.id],
        name: `RACM303_คาบ_${m.code}_Case_Discussion.pptx`,
        title: `สไลด์อภิปรายกลุ่มย่อย 16:9 · ${m.code}: ${m.title}`,
        sub: ROLE === "faculty" ? `สไลด์เปิดคาบ Kahoot + ${modCases.length} กรณีศึกษา (${qCount} ข้อ) พร้อมเฉลย Teacher Key` : `สไลด์เปิดคาบ Kahoot + ${modCases.length} กรณีศึกษา (${qCount} ข้อ)`,
        meta: `${m.discTime || ""} · สอบ ${m.examWeight || ""}`,
        badge: ROLE === "faculty" ? `★ สไลด์ + เฉลย` : `▶ สไลด์ 16:9`,
        icoCls: "is-pptx",
        icoTxt: "P",
        onOpen: openFileAction(() => {
          if (api && api.openHsDiscussion) api.openHsDiscussion(m.code);
        })
      });

      files.push({
        id: `hslec:${m.id}`,
        folderPath: ["health-systems", m.id],
        name: `RACM303_คาบ_${m.code}_Slide_อาจารย์บรรยาย.pptx`,
        title: `สไลด์ประกอบการบรรยายโดยอาจารย์ประจำคาบ ${m.code}`,
        sub: `ช่วงบรรยาย ${m.lectureTime || "1 ชม. แรก"} — สถานะรออาจารย์อัปโหลดไฟล์ (.pptx / .pdf)`,
        meta: m.scheduleDate ? m.scheduleDate.replace(/^วัน/, "") : "",
        badge: "⏳ รออาจารย์ Upload",
        isPending: true,
        icoCls: "is-pptx is-muted-pptx",
        icoTxt: "P",
        onOpen: openFileAction(() => {
          if (api && api.openHsLectureSlides) api.openHsLectureSlides(m.code);
        })
      });

      const gCnt = (HS_DATA.glossary || []).filter((g) => g.module === m.code).length;
      const qCnt = (HS_DATA.selfCheck || []).filter((q) => q.module === m.code).length;
      files.push({
        id: `hsquiz:${m.id}`,
        folderPath: ["health-systems", m.id],
        name: `RACM303_${m.code}_คำศัพท์และโจทย์ทบทวน_(Active_Recall).app`,
        title: `ตารางทบทวนเร็ว · คำศัพท์ ${gCnt} คำ · โจทย์ ${qCnt} ข้อ (${m.code})`,
        sub: "ฝึกพลิกบัตรคำศัพท์และตอบคำถาม Active Recall เฉพาะบทนี้",
        meta: `${gCnt} คำศัพท์ · ${qCnt} ข้อ`,
        badge: "🧠 ฝึกทำโจทย์",
        icoCls: "is-quiz",
        icoTxt: "🧠",
        onOpen: openFileAction(() => {
          if (api && api.openPractice) api.openPractice(m.code, "qa");
        })
      });

      if (ROLE === "faculty") {
        files.push({
          id: `hsfac:${m.id}`,
          folderPath: ["health-systems", m.id],
          name: `RACM303_${m.code}_คู่มือผู้สอนและเฉลย_(Teacher_Key).gdoc`,
          title: `คู่มือผู้สอนและแนวทางนำอภิปรายประจำคาบ ${m.code}`,
          sub: "เฉพาะคณาจารย์ — แผนนำอภิปราย ประเด็นเฉลย 4 ขั้น และเกณฑ์ประเมิน",
          meta: "Faculty Member Only",
          badge: "📕 คู่มือผู้สอน",
          icoCls: "is-faculty",
          icoTxt: "📕",
          onOpen: openFileAction(() => {
            if (api && api.switchTab) api.switchTab("faculty-docs");
          })
        });
      }

      return files;
    };

    const folders = {
      schedule: {
        id: "schedule",
        code: "01_ตารางเรียนและปฏิทิน",
        title: ROLE === "faculty" ? "ปฏิทินภาระงานสอน · ซิงค์ iCal / Google Calendar · Zoom · อัปโหลด Slide" : "ตารางเรียน 6 สัปดาห์ · ซิงค์ปฏิทินมือถือ (.ics) · ลิงก์ห้อง Zoom",
        meta: "6 สัปดาห์ (23 พ.ย. 2569 – 3 ม.ค. 2570)",
        tags: ["📅 ปฏิทิน 6 สัปดาห์", "📲 ซิงค์ .ics", "🎥 Zoom 3 ห้อง"],
        files: [
          {
            id: "sched:cal",
            folderPath: ["schedule"],
            name: ROLE === "faculty" ? "RACM303_ปฏิทินภาระงานสอน_6_สัปดาห์.app" : "RACM303_ตารางเรียนรวม_6_สัปดาห์.app",
            title: "ปฏิทินรายเดือน / รายสัปดาห์ / ตารางเรียนครบทั้ง 6 สัปดาห์",
            sub: "กรองตามอาจารย์ กลุ่มพื้นที่ หรือสัปดาห์ พร้อมส่งออก Excel / PDF / Word",
            meta: "23 พ.ย. 69 – 3 ม.ค. 70",
            badge: "เปิดปฏิทิน →",
            icoCls: "is-manual",
            icoTxt: "📅",
            onOpen: openFileAction(() => navigateTvTab("schedule"))
          },
          {
            id: "sched:ics",
            folderPath: ["schedule"],
            name: "RACM303_2569_Sync_Google_Calendar_&_Apple_iCal.ics",
            title: "ดาวน์โหลดไฟล์ปฏิทิน (.ics) สำหรับบันทึกเข้ามือถือทันที",
            sub: "รองรับ Google Calendar, Apple Calendar (iPhone/iPad/Mac) และ Outlook",
            meta: "ไฟล์มาตรฐาน .ics",
            badge: "⬇ ดาวน์โหลด .ics",
            icoCls: "is-quiz",
            icoTxt: "📲",
            onOpen: () => {
              if (api && api.downloadScheduleIcs) api.downloadScheduleIcs();
            }
          },
          {
            id: "sched:zoom",
            folderPath: ["schedule"],
            name: "RACM303_รวมลิงก์ห้องเรียนออนไลน์_Zoom_(3_ห้อง).link",
            title: "ศูนย์รวมลิงก์ Zoom ห้องเรียนออนไลน์ประจำรายวิชา",
            sub: "เปิดแผงรวมลิงก์ Zoom สำหรับคาบบรรยายและระบาดวิทยา",
            meta: "3 ห้องเรียนออนไลน์",
            badge: "🎥 เปิดลิงก์ Zoom",
            icoCls: "is-gdoc",
            icoTxt: "🎥",
            onOpen: openFileAction(() => {
              navigateTvTab("schedule");
              setTimeout(() => {
                const zBtn = $("toggleZoomDrawerBtn");
                if (zBtn && zBtn.getAttribute("aria-expanded") !== "true") zBtn.click();
              }, 80);
            })
          },
          ...(ROLE === "faculty"
            ? [
                {
                  id: "sched:upload",
                  folderPath: ["schedule"],
                  name: "Faculty_Slide_Upload_Studio_(อัปโหลดสไลด์สอน).app",
                  title: "ระบบอัปโหลด Slide ประกอบการสอนสำหรับอาจารย์ประจำคาบ",
                  sub: "อัปโหลดไฟล์ .pptx / .pdf ประจำคาบ HS1–HS6 และ EP1–EP9",
                  meta: "เฉพาะคณาจารย์",
                  badge: "📊 เปิดหน้าอัปโหลด",
                  icoCls: "is-faculty",
                  icoTxt: "📊",
                  onOpen: openFileAction(() => {
                    navigateTvTab("schedule");
                    setTimeout(() => {
                      const sBtn = $("toggleSlideStudioBtn");
                      if (sBtn && sBtn.getAttribute("aria-expanded") !== "true") sBtn.click();
                    }, 80);
                  })
                }
              ]
            : [])
        ]
      },
      "health-systems": {
        id: "health-systems",
        code: "02_ระบบสุขภาพ (HS1–HS6)",
        title: "โฟลเดอร์เรียงตามบทเรียน HS1–HS6 รวมเอกสารคำสอน สไลด์ Discussion .pptx Slide อาจารย์ และโจทย์",
        meta: "6 โฟลเดอร์บทเรียน (HS1–HS6) + เอกสารรวม",
        tags: ["📁 HS1–HS6", "📄 คำสอนย่อ/เต็ม", "🟠 Discussion .pptx", "⏳ Slide อาจารย์"],
        subfolders: modules.map((m) => ({
          id: m.id,
          code: m.code,
          title: m.title,
          examWeight: m.examWeight || "",
          meta: `${m.scheduleDate ? m.scheduleDate.replace(/^วัน/, "") : ""} · สอบ ${m.examWeight || ""}`,
          files: buildHsModuleFiles(m)
        })),
        files: [
          {
            id: "hs:all-scroll",
            folderPath: ["health-systems"],
            name: "RACM303_ใบงาน_Discussion_รวมทุกบท_HS1-HS6_(เลื่อนอ่านยาว).web",
            title: "ใบงานกรณีศึกษา HS1–HS6 รวมทุกบทในหน้าเดียว (Scroll View)",
            sub: "ครบ 10 กรณีศึกษา · 20 ข้อย่อย สำหรับอ่านทบทวนหรือพิมพ์เตรียมสอบ Open Note",
            meta: "HS1–HS6 รวมทุกบท",
            badge: "📜 เปิดอ่านรวม",
            icoCls: "is-gdoc",
            icoTxt: "≡",
            onOpen: openFileAction(() => {
              const st = api && api.getState ? api.getState() : null;
              if (st) {
                st.hsdViewMode = "scroll";
                st.hsdModule = "ALL";
                st.hsdDriveFolderOpen = false;
              }
              navigateTvTab("hs-discussion");
            })
          },
          {
            id: "hs:practice-all",
            folderPath: ["health-systems"],
            name: "RACM303_คลังคำศัพท์_111คำ_และโจทย์ฝึกหัด_60ข้อ_HS1-HS6.app",
            title: "ตารางทบทวนเร็ว High-Yield · บัตรคำศัพท์ 111 คำ · โจทย์ 60 ข้อ",
            sub: "ทบทวนครบทุกบทเรียนระบบสุขภาพพร้อมโหมดพลิกบัตรคำศัพท์",
            meta: "111 คำศัพท์ · 60 ข้อ",
            badge: "🧠 เปิดคลังทบทวน",
            icoCls: "is-quiz",
            icoTxt: "🧠",
            onOpen: openFileAction(() => {
              if (api && api.openPractice) api.openPractice("", "rapid");
            })
          }
        ]
      },
      epidemiology: {
        id: "epidemiology",
        code: "03_ระบาดวิทยา (EP1–EP9)",
        title: "คาบเรียน EP1–EP9 & Exercise 1–6 · ห้องเรียน Zoom · SPSS · สัดส่วนข้อสอบ & ฟอร์ม 4A",
        meta: "9 คาบบรรยาย · 6 แบบฝึกหัด",
        tags: ["📊 EP1–EP9", "💻 Ex 1–6 & SPSS", "📋 สัดส่วนสอบ & 4A"],
        files: [
          {
            id: "ep:all",
            folderPath: ["epidemiology"],
            name: "RACM303_ระบาดวิทยา_ภาพรวมและคาบเรียน_EP1-EP9_&_Ex1-6.app",
            title: "ตารางเรียนและรายละเอียดคาบ EP1–EP9 และแบบฝึกหัด Exercise 1–6",
            sub: "เช็กหัวข้อเรียน อาจารย์ผู้สอน วันเวลา และลิงก์เอกสารประกอบทุกคาบ",
            meta: "EP1–EP9 · Ex 1–6",
            badge: "📊 เปิดหมวด EP",
            icoCls: "is-manual",
            icoTxt: "📊",
            onOpen: openFileAction(() => {
              if (api && api.openEpidemiology) api.openEpidemiology("sessions");
              else navigateTvTab("epidemiology");
            })
          },
          {
            id: "ep:zoom-spss",
            folderPath: ["epidemiology"],
            name: "RACM303_ห้องเรียนออนไลน์_Zoom_&_คู่มือโปรแกรม_SPSS.link",
            title: "ลิงก์ห้องเรียน Zoom ระบาดวิทยาและชุดข้อมูลฝึกปฏิบัติ SPSS",
            sub: "ทางลัดเข้าห้องเรียนออนไลน์และไฟล์เตรียมฝึกวิเคราะห์ข้อมูล",
            meta: "Zoom · SPSS",
            badge: "🎥 เปิด Zoom & SPSS",
            icoCls: "is-gdoc",
            icoTxt: "💻",
            onOpen: openFileAction(() => {
              if (api && api.openEpidemiology) api.openEpidemiology("zoom-spss");
              else navigateTvTab("epidemiology");
            })
          },
          {
            id: "ep:exam-4a",
            folderPath: ["epidemiology"],
            name: "RACM303_สัดส่วนข้อสอบ_EP_&_แบบฟอร์มนำเสนอภาคสนาม_4A.app",
            title: "ผังสัดส่วนการออกข้อสอบระบาดวิทยาและแบบฟอร์ม 4A",
            sub: "รายละเอียดโครงสร้างข้อสอบ EP และแนวทางจัดทำรายงาน/นำเสนอฟอร์ม 4A",
            meta: "สอบ EP · ฟอร์ม 4A",
            badge: "📋 เปิดดูเกณฑ์",
            icoCls: "is-quiz",
            icoTxt: "📋",
            onOpen: openFileAction(() => {
              if (api && api.openEpidemiology) api.openEpidemiology("exam-field");
              else navigateTvTab("epidemiology");
            })
          }
        ]
      },
      fieldwork: {
        id: "fieldwork",
        code: "04_กลุ่มเรียนและพื้นที่ภาคสนาม (9 แห่ง)",
        title: "9 โรงพยาบาลชุมชนภาคสนาม · อาจารย์ที่ปรึกษา · แผนที่ · ผังกลุ่ม Discussion 6 กลุ่ม (169 คน)",
        meta: "9 พื้นที่ภาคสนาม · 6 กลุ่มอภิปราย",
        tags: ["🏥 9 โรงพยาบาลภาคสนาม", "👥 6 กลุ่ม (169 คน)", "🗺️ แผนที่ 3D"],
        files: [
          {
            id: "fw:map",
            folderPath: ["fieldwork"],
            name: "RACM303_แผนที่และข้อมูล_9_พื้นที่ภาคสนาม_(โรงพยาบาลชุมชน).app",
            title: "แผนที่ 3D และข้อมูลโรงพยาบาลภาคสนามครบทั้ง 9 แห่ง",
            sub: "วันเดินทาง ที่พัก อาจารย์ที่ปรึกษา ผู้ประสานงาน และรายชื่อนักศึกษาประจำพื้นที่",
            meta: "9 พื้นที่ภาคสนาม",
            badge: "🗺️ เปิดแผนที่ภาคสนาม",
            icoCls: "is-quiz",
            icoTxt: "🏥",
            onOpen: openFileAction(() => navigateTvTab("fieldwork"))
          },
          {
            id: "fw:disc",
            folderPath: ["fieldwork"],
            name: "RACM303_ผังกลุ่ม_Discussion_6_กลุ่ม_&_รายชื่อนักศึกษา_169_คน.app",
            title: "ผังกลุ่มอภิปราย 6 กลุ่ม · ห้องเรียน · อาจารย์ประจำกลุ่มแต่ละคาบ",
            sub: "ตรวจสอบรายชื่อสมาชิกและตารางหมุนเวียนห้องเรียนกลุ่ม 1–6",
            meta: "6 กลุ่ม · 169 คน",
            badge: "👥 เปิดผังกลุ่ม",
            icoCls: "is-gdoc",
            icoTxt: "👥",
            onOpen: openFileAction(() => navigateTvTab("discussion"))
          },
          ...sites.map((s) => ({
            id: `fw:site:${s.id}`,
            folderPath: ["fieldwork"],
            name: `พื้นที่_${s.id}_${s.shortName}_(${s.province}).site`,
            title: `โรงพยาบาลภาคสนามพื้นที่ ${s.id}: ${s.shortName} (${s.province})`,
            sub: `อาจารย์ที่ปรึกษา: ${s.advisor || "-"} · นักศึกษา ${s.count || ""} คน`,
            meta: s.travelDate || s.province,
            badge: "🏥 เปิดข้อมูลพื้นที่",
            icoCls: "is-manual",
            icoTxt: String(s.id),
            onOpen: openFileAction(() => {
              if (api && api.openFieldworkSite) api.openFieldworkSite(s.shortName);
              else navigateTvTab("fieldwork");
            })
          }))
        ]
      },
      manuals: {
        id: "manuals",
        code: "05_คู่มือรายวิชาและเอกสารอ้างอิง",
        title: ROLE === "faculty" ? "คู่มือรายวิชา 2569 (17 บท) · คู่มือผู้สอน & เฉลย Teacher Answer Key" : "คู่มือการจัดการเรียนการสอน RACM 303 ปีการศึกษา 2569 (17 บท)",
        meta: ROLE === "faculty" ? "คู่มือวิชา 17 บท + คู่มือผู้สอน" : "คู่มือรายวิชา 17 บท",
        tags: ["📘 คู่มือ 17 บท", "⬇ PDF / Word", ...(ROLE === "faculty" ? ["📕 คู่มือผู้สอน"] : [])],
        files: [
          {
            id: "man:course",
            folderPath: ["manuals"],
            name: "คู่มือการจัดการเรียนการสอน_RACM303_2569_(17_บท).gdoc",
            title: "คู่มือรายวิชา RACM 303 ปีการศึกษา 2569 ฉบับสมบูรณ์ (17 บท)",
            sub: "อ่านบนเว็บพร้อมสารบัญ ค้นหาคำสำคัญ และดาวน์โหลด PDF / Word",
            meta: "17 บทครบถ้วน",
            badge: "📘 เปิดอ่านคู่มือ",
            icoCls: "is-manual",
            icoTxt: "📘",
            onOpen: openFileAction(() => navigateTvTab("manual"))
          },
          ...(ROLE === "faculty"
            ? [
                {
                  id: "man:faculty",
                  folderPath: ["manuals"],
                  name: "RACM303_คู่มือผู้สอน_แนวทางนำอภิปราย_และเฉลยรวม_HS1-HS6.gdoc",
                  title: "คู่มือผู้สอนและต้นฉบับ Teacher Answer Key (เฉพาะคณาจารย์)",
                  sub: "แผนนำอภิปรายกลุ่มย่อย เฉลยครบ 10 กรณีศึกษา และเอกสารอ้างอิงสำหรับคณาจารย์",
                  meta: "Faculty Member Portal",
                  badge: "📕 เปิดคู่มือผู้สอน",
                  icoCls: "is-faculty",
                  icoTxt: "📕",
                  onOpen: openFileAction(() => navigateTvTab("faculty-docs"))
                }
              ]
            : [])
        ]
      },
      admin: {
        id: "admin",
        code: ROLE === "faculty" ? "06_รับงาน_อนุมัติใบลา_และตรวจตาราง" : "06_ส่งงาน_ยื่นใบลา_และ E-learning",
        title: ROLE === "faculty" ? "ระบบรับงาน SRN · อนุมัติใบลานักศึกษา · ตรวจซิงค์ตารางสอน 6 จุด" : "ส่งงาน SRN 1–2 · เช็กหน้า PDF · ยื่นใบลากิจ/ลาป่วยออนไลน์",
        meta: "RAMED E-learning · ระบบใบลาออนไลน์",
        tags: ["📤 ส่งงาน SRN", "📝 ใบลาออนไลน์", ...(ROLE === "faculty" ? ["✅ ตรวจตาราง 6 จุด"] : ["🔗 E-learning"])],
        files: [
          {
            id: "adm:sub",
            folderPath: ["admin"],
            name: ROLE === "faculty" ? "RACM303_ระบบรับงาน_SRN_และ_E-learning.app" : "RACM303_ระบบส่งงาน_SRN_1-2_&_ตรวจหน้า_PDF.app",
            title: ROLE === "faculty" ? "ระบบรับงานและตรวจเช็กการส่งงาน SRN 1–2 (RAMED)" : "เช็กลิสต์ส่งงาน SRN 1–2 ตรวจจำนวนหน้า PDF และลิงก์ RAMED",
            sub: "ตรวจสอบกำหนดส่งชิ้นงานทั้งหมดในรายวิชา RACM 303",
            meta: "4 ชิ้นงานหลัก",
            badge: "📤 เปิดระบบส่งงาน",
            icoCls: "is-gdoc",
            icoTxt: "📤",
            onOpen: openFileAction(() => navigateTvTab("submissions"))
          },
          {
            id: "adm:leave",
            folderPath: ["admin"],
            name: ROLE === "faculty" ? "RACM303_ระบบอนุมัติใบลานักศึกษาออนไลน์.app" : "RACM303_ระบบยื่นใบลากิจ_ลาป่วยออนไลน์.app",
            title: ROLE === "faculty" ? "ตรวจสอบและลงนามอนุมัติใบลานักศึกษาออนไลน์" : "กรอกและลงนามใบลากิจ / ลาป่วยออนไลน์ พร้อมส่ง PDF",
            sub: "บันทึกและติดตามสถานะใบลาออนไลน์ได้ทันที",
            meta: "e-Sign Leave Form",
            badge: "📝 เปิดระบบใบลา",
            icoCls: "is-pptx",
            icoTxt: "📝",
            onOpen: openFileAction(() => navigateTvTab("leave"))
          },
          ...(ROLE === "faculty"
            ? [
                {
                  id: "adm:audit",
                  folderPath: ["admin"],
                  name: "RACM303_ตรวจตารางและซิงค์ข้อมูล_(6_จุด).app",
                  title: "เครื่องมือตรวจสอบความถูกต้องของตารางสอนและการซิงค์ข้อมูล",
                  sub: "เช็กความสอดคล้อง 6 จุดระหว่างปฏิทิน กลุ่มอภิปราย และภาคสนาม",
                  meta: "Audit 6 จุด",
                  badge: "✅ เปิดหน้าตรวจ",
                  icoCls: "is-quiz",
                  icoTxt: "✅",
                  onOpen: openFileAction(() => navigateTvTab("audit"))
                }
              ]
            : [])
        ]
      }
    };

    return { folders, order: ["schedule", "health-systems", "epidemiology", "fieldwork", "manuals", "admin"] };
  }

  function renderFullCourseDriveExplorer() {
    const panel = $("portalDriveExplorerPanel");
    if (!panel || !driveBrowserActive) return;

    const catalog = getFullCourseDriveCatalog();
    const { folders, order } = catalog;
    const isGrid = driveLayout !== "list";
    const q = (driveSearchQuery || "").trim().toLocaleLowerCase("th");
    const rootKey = drivePath[0] || "";
    const subKey = drivePath[1] || "";

    panel.replaceChildren();

    // Top Dual-View Mode Banner
    const modeBanner = document.createElement("div");
    modeBanner.className = "portal-drive-mode-banner";
    modeBanner.innerHTML = `
      <div class="portal-drive-mode-copy">
        <strong>📁 ${esc(t("มุมมอง Google Drive (File Explorer) — รายวิชา RACM 303 ปีการศึกษา 2569", "Google Drive File Explorer View — RACM 303 (2569)"))}</strong>
        <span>${esc(t("เปิดดูทุกโฟลเดอร์ของทั้งรายวิชาแบบ File Explorer จริง (ตารางเรียน · ระบบสุขภาพ HS1–HS6 · ระบาดวิทยา · ภาคสนาม · คู่มือ · ส่งงาน) และสลับกลับโหมดเรียนได้ตลอดเวลา", "Browse every course folder like a real Google Drive File Explorer, or switch back to Study View anytime."))}</span>
      </div>
      <button type="button" class="portal-drive-switch-tv-btn" id="portalDriveBackToTvBtn">📚 <span>${esc(t("สลับเป็นโหมดเรียน", "Switch to Study View"))}</span></button>
    `;
    panel.appendChild(modeBanner);
    $("portalDriveBackToTvBtn").addEventListener("click", () => setPortalViewMode("tv"));

    // Main Google Drive Shell
    const shell = document.createElement("div");
    shell.className = "gdrive-explorer-shell";

    // Topbar
    const topBar = document.createElement("div");
    topBar.className = "gdrive-topbar";
    topBar.innerHTML = `
      <div class="gdrive-brand">
        ${COURSE_DRIVE_TRIANGLE_SVG}
        <span class="gdrive-brand-title">${esc(t("Google Drive · RACM 303 (2569)", "Google Drive · RACM 303 (2569)"))}</span>
      </div>
      <div class="gdrive-search-pill">
        <svg class="gdrive-search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="search" class="gdrive-search-input" id="courseDriveSearchInput" placeholder="${esc(t("ค้นหาไฟล์และโฟลเดอร์ทั้งรายวิชา RACM 303 — HS1–HS6, EP1–EP9, .pptx, ฉบับย่อ, ภาคสนาม, ใบลา…", "Search all RACM 303 folders & files…"))}" value="${esc(driveSearchQuery)}">
        <button type="button" class="gdrive-search-clear" id="courseDriveSearchClear" ${driveSearchQuery ? "" : "hidden"}>✕</button>
      </div>
      <div class="gdrive-top-actions">
        <button type="button" class="gdrive-top-action-btn" id="courseDriveGoHsBtn">📁 โฟลเดอร์ HS1–HS6</button>
      </div>
    `;
    shell.appendChild(topBar);

    const body = document.createElement("div");
    body.className = "gdrive-body";

    // Left Sidebar Tree (Real File Explorer!)
    const sidebar = document.createElement("aside");
    sidebar.className = "gdrive-sidebar";
    sidebar.setAttribute("aria-label", "โครงสร้างโฟลเดอร์ Google Drive ทั้งรายวิชา");

    const fab = document.createElement("button");
    fab.type = "button";
    fab.className = "gdrive-fab-btn";
    fab.innerHTML =
      `<span class="gdrive-fab-plus"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v8" stroke="#ea4335" stroke-width="2.8" stroke-linecap="round"/><path d="M12 12h8" stroke="#4285f4" stroke-width="2.8" stroke-linecap="round"/><path d="M12 12v8" stroke="#34a853" stroke-width="2.8" stroke-linecap="round"/><path d="M4 12h8" stroke="#fbbc05" stroke-width="2.8" stroke-linecap="round"/></svg></span>` +
      `<span>${drivePath.length ? "↑ หน้าหลักไดรฟ์ (RACM 303)" : "📁 เปิดโฟลเดอร์ HS1–HS6"}</span>`;
    fab.addEventListener("click", () => {
      if (drivePath.length) openCourseDriveAtPath([]);
      else openCourseDriveAtPath(["health-systems"]);
    });
    sidebar.appendChild(fab);

    const navList = document.createElement("div");
    navList.className = "gdrive-nav-list";

    const addSideItem = (label, count, isAct, onClick, isTree, iconStr) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `gdrive-nav-item${isTree ? " is-tree-folder" : ""}${isAct ? " is-active" : ""}`;
      b.innerHTML = `<span class="gdrive-nav-left"><span>${iconStr}</span><span class="gdrive-tree-sub">${esc(label)}</span></span>${count !== "" ? `<span class="gdrive-nav-count">${esc(count)}</span>` : ""}`;
      b.addEventListener("click", onClick);
      navList.appendChild(b);
    };

    addSideItem("ไดรฟ์รายวิชา RACM 303", order.length, !rootKey, () => openCourseDriveAtPath([]), false, "🏠");

    const treeLbl = document.createElement("div");
    treeLbl.className = "gdrive-sidebar-section-label";
    treeLbl.textContent = "โฟลเดอร์หลัก (6 หมวด)";
    navList.appendChild(treeLbl);

    order.forEach((fKey) => {
      const f = folders[fKey];
      const isActFolder = rootKey === fKey && !subKey;
      const cnt = f.subfolders ? f.subfolders.length + f.files.length : f.files.length;
      addSideItem(f.code, cnt, isActFolder, () => openCourseDriveAtPath([fKey]), false, isActFolder ? "📂" : "📁");

      if (fKey === "health-systems" && f.subfolders) {
        f.subfolders.forEach((sf) => {
          const isSubAct = rootKey === "health-systems" && subKey === sf.id;
          addSideItem(`${sf.code} · ${sf.title}`, sf.files.length, isSubAct, () => openCourseDriveAtPath(["health-systems", sf.id]), true, isSubAct ? "📂" : "📁");
        });
      }
    });

    sidebar.appendChild(navList);

    const storageBox = document.createElement("div");
    storageBox.className = "gdrive-storage-box";
    storageBox.innerHTML =
      `<div class="gdrive-storage-head">☁️ <span>Google Drive · RACM 303</span></div>` +
      `<div class="gdrive-storage-track"><div class="gdrive-storage-fill" style="width:100%"></div></div>` +
      `<div class="gdrive-storage-caption">จัดเก็บไฟล์ครบทั้ง <strong>6 หมวดรายวิชา</strong> (รวมโฟลเดอร์ <strong>HS1–HS6</strong>) สลับกลับ <strong>📚 โหมดเรียน</strong> ได้ทุกเมื่อ</div>`;
    sidebar.appendChild(storageBox);

    // Right Canvas
    const canvas = document.createElement("div");
    canvas.className = "gdrive-canvas";

    // Breadcrumb & View Switcher Bar
    const crumbBar = document.createElement("div");
    crumbBar.className = "gdrive-breadcrumb-bar";
    const crumbs = document.createElement("div");
    crumbs.className = "gdrive-breadcrumbs";

    const mkCrumbBtn = (label, path) => {
      const cb = document.createElement("button");
      cb.type = "button";
      cb.className = "gdrive-crumb";
      cb.textContent = label;
      cb.addEventListener("click", () => openCourseDriveAtPath(path));
      return cb;
    };
    const mkSep = () => {
      const sp = document.createElement("span");
      sp.className = "gdrive-crumb-sep";
      sp.textContent = "›";
      return sp;
    };
    const mkCur = (label) => {
      const sp = document.createElement("span");
      sp.className = "gdrive-crumb-current";
      sp.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden="true"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg><span>${esc(label)}</span>`;
      return sp;
    };

    crumbs.appendChild(mkCrumbBtn("ไดรฟ์ที่แชร์", []));
    crumbs.appendChild(mkSep());
    if (!rootKey) {
      crumbs.appendChild(mkCur("RACM 303 (ปีการศึกษา 2569)"));
    } else {
      crumbs.appendChild(mkCrumbBtn("RACM 303 (2569)", []));
      crumbs.appendChild(mkSep());
      const curRoot = folders[rootKey];
      if (!subKey) {
        crumbs.appendChild(mkCur(curRoot ? curRoot.code : rootKey));
      } else {
        crumbs.appendChild(mkCrumbBtn(curRoot ? curRoot.code : rootKey, [rootKey]));
        crumbs.appendChild(mkSep());
        const sf = curRoot && curRoot.subfolders ? curRoot.subfolders.find((x) => x.id === subKey) : null;
        crumbs.appendChild(mkCur(sf ? `${sf.code}: ${sf.title}` : subKey));
      }
    }

    const tbRight = document.createElement("div");
    tbRight.className = "gdrive-toolbar-right";
    const viewToggle = document.createElement("div");
    viewToggle.className = "gdrive-view-toggle";
    const listBtn = document.createElement("button");
    listBtn.type = "button";
    listBtn.className = `gdrive-vmode-btn${!isGrid ? " is-active" : ""}`;
    listBtn.textContent = `${!isGrid ? "✓ " : ""}☰ รายการ`;
    listBtn.addEventListener("click", () => {
      driveLayout = "list";
      try { localStorage.setItem("racm303_course_drive_layout", "list"); } catch (_) {}
      renderFullCourseDriveExplorer();
    });
    const gridBtn = document.createElement("button");
    gridBtn.type = "button";
    gridBtn.className = `gdrive-vmode-btn${isGrid ? " is-active" : ""}`;
    gridBtn.textContent = `${isGrid ? "✓ " : ""}⊞ ตารางการ์ด`;
    gridBtn.addEventListener("click", () => {
      driveLayout = "grid";
      try { localStorage.setItem("racm303_course_drive_layout", "grid"); } catch (_) {}
      renderFullCourseDriveExplorer();
    });
    viewToggle.append(listBtn, gridBtn);
    tbRight.appendChild(viewToggle);
    crumbBar.append(crumbs, tbRight);
    canvas.appendChild(crumbBar);

    const renderFilesSection = (fileList, headingText) => {
      if (!fileList.length) return;
      const sh = document.createElement("div");
      sh.className = "gdrive-section-head";
      sh.innerHTML = `<span class="gdrive-section-label">${esc(headingText)}</span>`;
      canvas.appendChild(sh);

      if (isGrid) {
        const grid = document.createElement("div");
        grid.className = "gdrive-files-grid";
        fileList.forEach((f) => {
          const card = document.createElement("div");
          card.className = `gdrive-file-card${f.isPending ? " is-pending-upload" : ""}`;
          card.tabIndex = 0;
          card.setAttribute("role", "button");
          card.setAttribute("aria-label", `เปิด ${f.name}`);

          const dlHtml =
            f.pdfHref && f.docxHref
              ? `<div class="gdrive-card-quick-acts"><a class="gdrive-icon-act-btn is-mini-badge" href="${esc(f.pdfHref)}" download>PDF</a><a class="gdrive-icon-act-btn is-mini-badge" href="${esc(f.docxHref)}" download>W</a></div>`
              : "";

          card.innerHTML =
            `<div class="gdrive-card-head">` +
            `<span class="gdrive-filetype-ico ${esc(f.icoCls || "is-gdoc")}">${esc(f.icoTxt || "≡")}</span>` +
            `<span class="gdrive-card-filename">${esc(f.name)}</span>` +
            dlHtml +
            `</div>` +
            `<div class="gd-mini-pane" style="min-height:86px;justify-content:center;gap:4px">` +
            `<div class="gd-doc-title" style="font-size:12.6px">${esc(f.title)}</div>` +
            `<div class="gd-doc-sub">${esc(f.sub)}</div>` +
            `</div>` +
            `<div class="gdrive-card-foot">` +
            `<span class="gdrive-card-date">${esc(f.meta || "")}</span>` +
            `<span class="gdrive-status-chip ${f.isPending ? "is-pending" : "is-open-now"}">${esc(f.badge || "เปิดไฟล์ →")}</span>` +
            `</div>`;

          card.querySelectorAll("a[download]").forEach((a) => a.addEventListener("click", (ev) => ev.stopPropagation()));
          card.addEventListener("click", f.onOpen);
          card.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              f.onOpen();
            }
          });
          grid.appendChild(card);
        });
        canvas.appendChild(grid);
      } else {
        const listWrap = document.createElement("div");
        listWrap.className = "gdrive-list-wrap";
        const tbl = document.createElement("table");
        tbl.className = "gdrive-list-table";
        tbl.innerHTML = `<thead><tr><th>ชื่อไฟล์ (Name)</th><th>รายละเอียด / สถานะ</th><th>ข้อมูลเพิ่มเติม</th><th>การดำเนินการ</th></tr></thead>`;
        const tb = document.createElement("tbody");
        fileList.forEach((f) => {
          const trEl = document.createElement("tr");
          trEl.className = "gdrive-list-row";
          trEl.tabIndex = 0;
          trEl.innerHTML =
            `<td><div class="gdrive-list-name-cell"><span class="gdrive-filetype-ico ${esc(f.icoCls || "is-gdoc")}">${esc(f.icoTxt || "≡")}</span><div class="gdrive-list-name-copy"><span class="gdrive-list-fname">${esc(f.name)}</span><span class="gdrive-list-fsub">${esc(f.title)}</span></div></div></td>` +
            `<td><span class="gdrive-status-chip ${f.isPending ? "is-pending" : "is-open-now"}">${esc(f.badge || "เปิดไฟล์")}</span></td>` +
            `<td>${esc(f.meta || "")}</td>` +
            `<td><div class="gdrive-list-actions"><button type="button" class="gdrive-row-open-btn">เปิดไฟล์ →</button>${
              f.pdfHref ? `<a class="gdrive-row-sec-btn" href="${esc(f.pdfHref)}" download style="text-decoration:none">⬇ PDF</a>` : ""
            }${
              f.docxHref ? `<a class="gdrive-row-sec-btn" href="${esc(f.docxHref)}" download style="text-decoration:none">⬇ .docx</a>` : ""
            }</div></td>`;
          trEl.querySelectorAll("a[download]").forEach((a) => a.addEventListener("click", (ev) => ev.stopPropagation()));
          trEl.querySelector(".gdrive-row-open-btn").addEventListener("click", (ev) => {
            ev.stopPropagation();
            f.onOpen();
          });
          trEl.addEventListener("click", f.onOpen);
          tb.appendChild(trEl);
        });
        tbl.appendChild(tb);
        listWrap.appendChild(tbl);
        canvas.appendChild(listWrap);
      }
    };

    const renderFolderCards = (folderObjs, headingText) => {
      if (!folderObjs.length) return;
      const sh = document.createElement("div");
      sh.className = "gdrive-section-head";
      sh.innerHTML = `<span class="gdrive-section-label">${esc(headingText)}</span>`;
      canvas.appendChild(sh);

      if (isGrid) {
        const grid = document.createElement("div");
        grid.className = "gdrive-folders-grid";
        folderObjs.forEach((fo) => {
          const fc = document.createElement("div");
          fc.className = "gdrive-folder-card";
          fc.tabIndex = 0;
          fc.setAttribute("role", "button");
          fc.dataset.courseDriveFolder = fo.path.join("/");
          fc.innerHTML =
            `<div class="gdrive-folder-head">` +
            `<div class="gdrive-folder-head-left">${COURSE_DRIVE_FOLDER_SVG}<span class="gdrive-folder-code">${esc(fo.code)}</span></div>` +
            (fo.pill ? `<span class="gdrive-folder-weight">${esc(fo.pill)}</span>` : "") +
            `</div>` +
            `<div class="gdrive-folder-title">${esc(fo.title)}</div>` +
            `<div class="gdrive-folder-meta">${esc(fo.meta)}</div>` +
            (fo.tags && fo.tags.length
              ? `<div class="gdrive-folder-tags">${fo.tags.map((tg) => `<span class="gdrive-folder-tag">${esc(tg)}</span>`).join("")}</div>`
              : "") +
            `<div class="gdrive-folder-foot"><span>${esc(fo.countLabel)}</span><span class="gdrive-folder-open-cta">📂 เปิดโฟลเดอร์ →</span></div>`;
          fc.addEventListener("click", () => openCourseDriveAtPath(fo.path));
          fc.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              openCourseDriveAtPath(fo.path);
            }
          });
          grid.appendChild(fc);
        });
        canvas.appendChild(grid);
      } else {
        const listWrap = document.createElement("div");
        listWrap.className = "gdrive-list-wrap";
        const tbl = document.createElement("table");
        tbl.className = "gdrive-list-table";
        tbl.innerHTML = `<thead><tr><th>ชื่อโฟลเดอร์ (Folder Name)</th><th>เนื้อหาภายใน</th><th>ข้อมูล</th><th>การดำเนินการ</th></tr></thead>`;
        const tb = document.createElement("tbody");
        folderObjs.forEach((fo) => {
          const trEl = document.createElement("tr");
          trEl.className = "gdrive-list-row";
          trEl.tabIndex = 0;
          trEl.innerHTML =
            `<td><div class="gdrive-list-name-cell"><span style="display:inline-flex;align-items:center;flex-shrink:0">${COURSE_DRIVE_FOLDER_SVG}</span><div class="gdrive-list-name-copy"><span class="gdrive-list-fname">${esc(fo.code)}</span><span class="gdrive-list-fsub">${esc(fo.title)}</span></div></div></td>` +
            `<td>${esc(fo.countLabel)}</td>` +
            `<td>${esc(fo.meta)}</td>` +
            `<td><button type="button" class="gdrive-row-open-btn">📂 เปิดโฟลเดอร์ →</button></td>`;
          trEl.querySelector(".gdrive-row-open-btn").addEventListener("click", (ev) => {
            ev.stopPropagation();
            openCourseDriveAtPath(fo.path);
          });
          trEl.addEventListener("click", () => openCourseDriveAtPath(fo.path));
          tb.appendChild(trEl);
        });
        tbl.appendChild(tb);
        listWrap.appendChild(tbl);
        canvas.appendChild(listWrap);
      }
    };

    // Global Drive Search across entire course
    if (q) {
      const matchedFiles = [];
      order.forEach((fKey) => {
        const f = folders[fKey];
        (f.files || []).forEach((item) => {
          if (`${item.name} ${item.title} ${item.sub} ${item.meta}`.toLocaleLowerCase("th").includes(q)) {
            matchedFiles.push(item);
          }
        });
        (f.subfolders || []).forEach((sf) => {
          (sf.files || []).forEach((item) => {
            if (`${sf.code} ${sf.title} ${item.name} ${item.title} ${item.sub} ${item.meta}`.toLocaleLowerCase("th").includes(q)) {
              matchedFiles.push(item);
            }
          });
        });
      });

      if (!matchedFiles.length) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "ไม่พบโฟลเดอร์หรือไฟล์ที่ตรงกับคำค้นหาในไดรฟ์รายวิชา RACM 303";
        canvas.appendChild(empty);
      } else {
        renderFilesSection(matchedFiles, `ผลการค้นหาใน Google Drive ทั้งรายวิชา (${matchedFiles.length} ไฟล์)`);
      }
    } else if (!rootKey) {
      // ROOT VIEW: All 6 top-level RACM 303 Course Folders
      const rootFolderObjs = order.map((fKey) => {
        const f = folders[fKey];
        const totalCnt = f.subfolders
          ? `${f.subfolders.length} โฟลเดอร์ (HS1–HS6) · ${f.subfolders.reduce((a, s) => a + s.files.length, 0) + f.files.length} ไฟล์`
          : `${f.files.length} ไฟล์ในโฟลเดอร์`;
        return {
          code: f.code,
          title: f.title,
          meta: f.meta,
          tags: f.tags,
          pill: fKey === "health-systems" ? "HS1–HS6" : fKey === "epidemiology" ? "EP1–EP9" : "",
          countLabel: totalCnt,
          path: [fKey]
        };
      });
      renderFolderCards(rootFolderObjs, "โฟลเดอร์ทั้งหมดในไดรฟ์รายวิชา RACM 303 ปีการศึกษา 2569 (6 โฟลเดอร์หลัก)");
    } else if (rootKey === "health-systems" && !subKey) {
      // HEALTH SYSTEMS ROOT: HS1–HS6 Subfolders First!
      const backBar = document.createElement("div");
      backBar.className = "gdrive-section-head";
      backBar.innerHTML = `<div class="gdrive-section-head-left"><button type="button" class="gdrive-back-folders-btn" id="cdUpBtn">← กลับหน้าหลักไดรฟ์ RACM 303</button></div>`;
      canvas.appendChild(backBar);
      backBar.querySelector("#cdUpBtn").addEventListener("click", () => openCourseDriveAtPath([]));

      const hsF = folders["health-systems"];
      const hsFolderObjs = hsF.subfolders.map((sf) => ({
        code: sf.code,
        title: sf.title,
        meta: sf.meta,
        pill: sf.examWeight ? `สอบ ${sf.examWeight}` : "",
        tags: ["📄 คำสอน", "🟠 Discussion .pptx", "⏳ Slide อ.", "🧠 โจทย์"],
        countLabel: `${sf.files.length} ไฟล์ในโฟลเดอร์`,
        path: ["health-systems", sf.id]
      }));
      renderFolderCards(hsFolderObjs, "โฟลเดอร์บทเรียนระบบสุขภาพเรียงตาม HS1–HS6 (6 โฟลเดอร์)");
      renderFilesSection(hsF.files, "ไฟล์รวมทั้งหมวดระบบสุขภาพ (HS1–HS6)");
    } else if (rootKey === "health-systems" && subKey) {
      // INSIDE SPECIFIC HS FOLDER (HS1..HS6)
      const hsF = folders["health-systems"];
      const sf = hsF.subfolders.find((x) => x.id === subKey);
      const backBar = document.createElement("div");
      backBar.className = "gdrive-section-head";
      backBar.innerHTML = `<div class="gdrive-section-head-left"><button type="button" class="gdrive-back-folders-btn" id="cdUpBtn">← กลับหน้ารวมโฟลเดอร์ HS1–HS6</button></div>`;
      canvas.appendChild(backBar);
      backBar.querySelector("#cdUpBtn").addEventListener("click", () => openCourseDriveAtPath(["health-systems"]));

      if (sf) {
        renderFilesSection(sf.files, `ไฟล์ทั้งหมดในโฟลเดอร์ ${sf.code}: ${sf.title} (${sf.files.length} ไฟล์)`);
      }

      // Sibling HS1–HS6 quick switcher at bottom
      const strip = document.createElement("div");
      strip.className = "gdrive-companion-strip";
      strip.innerHTML = `<span class="gdrive-folder-hint">สลับไปยังโฟลเดอร์บทอื่น:</span><div class="gdrive-companion-pills"></div>`;
      const pills = strip.querySelector(".gdrive-companion-pills");
      hsF.subfolders.forEach((other) => {
        const pb = document.createElement("button");
        pb.type = "button";
        pb.className = `gdrive-doc-pill${other.id === subKey ? " is-active-folder-pill" : ""}`;
        pb.innerHTML = `<span>📁</span> <span>${esc(other.code)}</span>`;
        pb.addEventListener("click", () => openCourseDriveAtPath(["health-systems", other.id]));
        pills.appendChild(pb);
      });
      canvas.appendChild(strip);
    } else {
      // OTHER TOP-LEVEL COURSE FOLDERS (schedule, epidemiology, fieldwork, manuals, admin)
      const curF = folders[rootKey];
      const backBar = document.createElement("div");
      backBar.className = "gdrive-section-head";
      backBar.innerHTML = `<div class="gdrive-section-head-left"><button type="button" class="gdrive-back-folders-btn" id="cdUpBtn">← กลับหน้าหลักไดรฟ์ RACM 303</button></div>`;
      canvas.appendChild(backBar);
      backBar.querySelector("#cdUpBtn").addEventListener("click", () => openCourseDriveAtPath([]));

      if (curF) {
        renderFilesSection(curF.files, `ไฟล์ในโฟลเดอร์ ${curF.code} (${curF.files.length} รายการ)`);
      }
    }

    body.append(sidebar, canvas);
    shell.appendChild(body);
    panel.appendChild(shell);

    // Wire Search & Quick Button
    const sIn = $("courseDriveSearchInput");
    const sClr = $("courseDriveSearchClear");
    if (sIn) {
      sIn.addEventListener("input", () => {
        driveSearchQuery = sIn.value;
        const caret = sIn.selectionStart;
        renderFullCourseDriveExplorer();
        const nextIn = $("courseDriveSearchInput");
        if (nextIn) {
          nextIn.focus();
          try { nextIn.setSelectionRange(caret, caret); } catch (_) {}
        }
      });
    }
    if (sClr) {
      sClr.addEventListener("click", () => {
        driveSearchQuery = "";
        renderFullCourseDriveExplorer();
        const nextIn = $("courseDriveSearchInput");
        if (nextIn) nextIn.focus();
      });
    }
    const goHs = $("courseDriveGoHsBtn");
    if (goHs) {
      goHs.addEventListener("click", () => openCourseDriveAtPath(["health-systems"]));
    }
  }

  /* ---------- Boot Sequence ---------- */
  function bootTvInterface() {
    if (document.body.classList.contains("is-ppt-slideshare-window")) return;
    ensureHomePanelExists();
    ensureDrivePanelExists();
    mountTvTopCapsule();
    syncTopBarLabels();
    mountSubpageEnhancements();
    renderHomeLauncher();
    syncViewModeSwitchUI();
    syncSubpageBar();
    syncProfilePill();
    initTvRemoteNavigation();

    window.addEventListener("racm:tabchange", () => {
      syncViewModeSwitchUI();
      syncSubpageBar();
      syncProfilePill();
    });

    window.addEventListener("racm:hsdstatechange", () => {
      syncViewModeSwitchUI();
      syncSubpageBar();
      syncProfilePill();
    });

    window.addEventListener("racm:epstatechange", () => {
      syncSubpageBar();
    });

    window.addEventListener("racm:profilechange", () => {
      syncProfilePill();
      const api = getApi();
      if (!api || !api.getState || api.getState().activeTab === "home") {
        renderHomeLauncher();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootTvInterface);
  } else {
    bootTvInterface();
  }
})();
