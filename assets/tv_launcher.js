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
    dots: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`
  };

  const NAV_GROUP_MAP = {
    home: "home",
    schedule: "schedule",
    "hs-discussion": "hs-discussion",
    textbooks: "knowledge",
    practice: "knowledge",
    manual: "knowledge",
    "faculty-docs": "knowledge",
    fieldwork: "groups",
    discussion: "groups",
    submissions: "admin",
    leave: "admin",
    audit: "admin"
  };

  const rememberedSubTab = {
    knowledge: ROLE === "faculty" ? "faculty-docs" : "textbooks",
    groups: "fieldwork",
    admin: "submissions"
  };

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
          <button type="button" class="tv-nav-pill" data-tv-nav="hs-discussion" data-tv-focus data-tv-row="0">อภิปรายสด</button>
          <button type="button" class="tv-nav-pill" data-tv-nav="knowledge" data-tv-focus data-tv-row="0">บทเรียน</button>
          <button type="button" class="tv-nav-pill" data-tv-nav="groups" data-tv-focus data-tv-row="0">กลุ่ม &amp; พื้นที่</button>
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

    $("tvBrandHomeBtn").addEventListener("click", () => navigateTvTab("home"));

    dock.querySelectorAll("[data-tv-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const navKey = btn.dataset.tvNav;
        if (navKey === "home" || navKey === "schedule" || navKey === "hs-discussion") {
          navigateTvTab(navKey);
        } else if (navKey === "knowledge") {
          navigateTvTab(rememberedSubTab.knowledge || "textbooks");
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
    btn.title = isDark ? t("สลับเป็นโหมดสว่าง", "Switch to Light Mode") : t("สลับเป็นโหมดมืดสไตล์ Apple TV", "Switch to Dark Mode");
  }

  function syncTopBarLabels() {
    const roleLbl = $("tvBrandRoleLabel");
    if (roleLbl) {
      roleLbl.textContent = ROLE === "faculty" ? t("อาจารย์", "Faculty") : t("นักศึกษา", "Student");
    }
    const labels = {
      home: t("หน้าหลัก", "Home"),
      schedule: ROLE === "faculty" ? t("ตารางสอน", "Schedule") : t("ตารางเรียน", "Schedule"),
      "hs-discussion": t("อภิปรายสด", "Live Cases"),
      knowledge: t("บทเรียน", "Library"),
      groups: t("กลุ่ม & พื้นที่", "Groups & Sites"),
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
              id: "app-hsd",
              tone: "tone-crimson",
              icon: ICONS.slides,
              title: t("สไลด์สอน & เฉลย HS1–6", "Live Slides & Answer Key"),
              sub: t("ฉายสไลด์ 16:9 ดูคำตอบสด และเปิด Teacher Key", "16:9 classroom deck, live responses & key"),
              badge: "HS1 – HS6",
              action: () => navigateFromTile("app-hsd", () => navigateTvTab("hs-discussion"))
            },
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
              title: t("9 พื้นที่ภาคสนาม", "9 Fieldwork Hospitals"),
              sub: t("โรงพยาบาลชุมชน อาจารย์ที่ปรึกษา และใบรูปถ่าย A4", "Community hospitals, advisors & photo sheets"),
              badge: t("9 โรงพยาบาล", "9 Sites"),
              action: () => navigateFromTile("app-sites", () => navigateTvTab("fieldwork"))
            },
            {
              id: "app-disc",
              tone: "tone-teal",
              icon: ICONS.users,
              title: t("กลุ่ม Discussion 1–6", "6 Discussion Groups"),
              sub: t("ผังห้องเรียน 1C1-02..07 และตารางหมุนเวียนอาจารย์", "Rooms 1C1-02..07 & instructor rotation"),
              badge: t("169 คน", "169 Students"),
              action: () => navigateFromTile("app-disc", () => navigateTvTab("discussion"))
            },
            {
              id: "app-guides",
              tone: "tone-amber",
              icon: ICONS.book,
              title: t("คู่มือผู้สอน & บทเรียน", "Teacher Guides & Textbooks"),
              sub: t("แนวทางนำอภิปราย บทเรียน HS1–6 และลิงก์ต้นฉบับ", "Facilitator guides, HS1–6 & Drive links"),
              badge: "Teacher Key",
              action: () => navigateFromTile("app-guides", () => navigateTvTab("faculty-docs"))
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
              id: "app-hsd",
              tone: "tone-teal",
              icon: ICONS.slides,
              title: t("อภิปรายสด HS1–HS6", "Slide Case Discussion"),
              sub: t("ดูสไลด์ล่วงหน้าได้โดยไม่ต้องใช้รหัส และเช็คชื่อ Interactive ในคาบเรียน", "Preview 16:9 case slides ID-free & join live room in class"),
              badge: t("อ่านล่วงหน้า / Live", "Preview & Live"),
              action: () => navigateFromTile("app-hsd", () => navigateTvTab("hs-discussion"))
            },
            {
              id: "app-books",
              tone: "tone-amber",
              icon: ICONS.book,
              title: t("บทเรียน HS1–HS6", "Health Systems Textbooks"),
              sub: t("อ่านฉบับสรุปกระชับพร้อมแผนภาพ และฉบับเต็ม", "Concise visual summaries, full texts & workbooks"),
              badge: t("เตรียมสอบ Open Note", "Open Note"),
              action: () => navigateFromTile("app-books", () => navigateTvTab("textbooks"))
            },
            {
              id: "app-sites",
              tone: "tone-emerald",
              icon: ICONS.map,
              title: t("9 พื้นที่ภาคสนาม", "9 Fieldwork Hospitals"),
              sub: t("แผนที่โรงพยาบาลชุมชน วันเดินทาง และเพื่อนในกลุ่ม", "Hospital sites, travel dates & group roster"),
              badge: t("9 แห่ง", "9 Sites"),
              action: () => navigateFromTile("app-sites", () => navigateTvTab("fieldwork"))
            },
            {
              id: "app-submit",
              tone: "tone-crimson",
              icon: ICONS.upload,
              title: t("ส่งงาน & ยื่นใบลา", "Submissions & Leave Form"),
              sub: t("ส่ง SRN 1–2 เช็กหน้า PDF และเขียนใบลาออนไลน์", "Submit SRN, check PDF pages & e-sign leave"),
              badge: t("4 ชิ้นงาน", "4 Tasks"),
              action: () => navigateFromTile("app-submit", () => navigateTvTab("submissions"))
            },
            {
              id: "app-quiz",
              tone: "tone-slate",
              icon: ICONS.quiz,
              title: t("คำศัพท์ · โจทย์ · คู่มือ", "Flashcards, Quiz & Manual"),
              sub: t("ทบทวนบัตรคำศัพท์ 111 คำ โจทย์ 82 ข้อ และคู่มือวิชา", "111 flashcards, 82 practice questions & manual"),
              badge: t("82 ข้อฝึกหัด", "82 Qs"),
              action: () => navigateFromTile("app-quiz", () => navigateTvTab("practice"))
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
                  ? t(`เปิดสไลด์สอน & เฉลย ${mod.code}`, `Open ${mod.code} Slides & Teacher Key`)
                  : t(`เปิดดูสไลด์ Case Discussion ${mod.code} (ไม่ต้องใช้รหัส)`, `Preview ${mod.code} Case Slides (No ID Required)`)
              )}</span></span>
              <span class="tv-ep-action-sub">${esc(
                ROLE === "faculty"
                  ? t(`มุมมองสไลด์ 16:9 คาบ ${mod.discTime}`, `16:9 Slide Deck · ${mod.discTime}`)
                  : t(`อ่านโจทย์ล่วงหน้าได้ทันที มุมมองสไลด์ 16:9 · คาบ ${mod.discTime}`, `Read ahead anytime in 16:9 Slide Deck · ${mod.discTime}`)
              )}</span>
            </span>
            <span>→</span>
          </button>

          ${
            ROLE === "student"
              ? `
          <button type="button" class="tv-ep-action-btn is-live-green" id="tvEpActLiveJoin" data-tv-modal-focus>
            <span>
              <span class="tv-ep-action-title-row">🟢 <span>${esc(t(`เข้าห้องเรียนสด ${mod.code} (Interactive ในคาบเรียน)`, `Join ${mod.code} Live Interactive Class`))}</span></span>
              <span class="tv-ep-action-sub">${esc(t("กรอกรหัสนักศึกษาเช็คชื่อเข้ากลุ่มย่อย 1–6 ซิงค์สไลด์ & ส่งคำตอบขึ้นจอ", "Enter Student ID to join Group 1–6 & submit live answers"))}</span>
            </span>
            <span>→</span>
          </button>
          `
              : ""
          }

          <button type="button" class="tv-ep-action-btn" id="tvEpActConcise" data-tv-modal-focus>
            <span>
              <span class="tv-ep-action-title-row">${ICONS.bolt} <span>${esc(t("อ่านฉบับสรุปกระชับ + แผนภาพ (Concise)", "Read Concise Visual Summary"))}</span></span>
              <span class="tv-ep-action-sub">${esc(t("สรุปประเด็นสำคัญพร้อมอินโฟกราฟิก อ่านเข้าใจไว", "High-yield summary with diagrams"))}</span>
            </span>
            <span>→</span>
          </button>

          <button type="button" class="tv-ep-action-btn" id="tvEpActFull" data-tv-modal-focus>
            <span>
              <span class="tv-ep-action-title-row">${ICONS.book} <span>${esc(t("อ่านบทเรียนฉบับเต็ม (Full Textbook)", "Read Full Guided Textbook"))}</span></span>
              <span class="tv-ep-action-sub">${esc(t("เนื้อหาละเอียดครบทุกหัวข้อสำหรับเตรียมสอบ Open Note", "Complete chapter text"))}</span>
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

    const liveJoinBtn = $("tvEpActLiveJoin");
    if (liveJoinBtn) {
      liveJoinBtn.addEventListener("click", () => {
        backdrop.remove();
        if (api && api.openHsLiveJoinGate) {
          api.openHsLiveJoinGate(mod.code);
        } else if (api && api.openHsDiscussion) {
          api.openHsDiscussion(mod.code);
        }
      });
    }

    $("tvEpActConcise").addEventListener("click", () => {
      backdrop.remove();
      if (api && api.openTextbookDoc) api.openTextbookDoc(mod.conciseDocId || `${mod.code}-CONCISE`);
    });

    $("tvEpActFull").addEventListener("click", () => {
      backdrop.remove();
      if (api && api.openTextbookDoc) api.openTextbookDoc(mod.docId || mod.code);
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

    if (groupKey === "knowledge" || groupKey === "groups" || groupKey === "admin") {
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

    // Special clean mode switcher when inside Live Case Discussion (#panel-hs-discussion)
    if (activeTab === "hs-discussion") {
      const curMode = st.hsdViewMode || "slide";
      const isGateOpen = Boolean(
        ROLE === "student" && st.hsdShowJoinGate && (!st.hsdSessionJoined || !st.myStudent)
      );
      const isLiveJoined = Boolean(ROLE === "student" && st.hsdSessionJoined && st.myStudent);

      if (isGateOpen) {
        bar.innerHTML = `
          <button type="button" class="tv-back-home-btn" id="tvSubBackHomeBtn">
            <span>← ${esc(t("หน้าหลัก", "Home"))}</span>
          </button>
          <div class="tv-hsd-bar-right">
            <button type="button" class="tv-pill-action-btn is-primary" id="tvHsdSkipGateBtn">
              📖 <span>${esc(t("ดูสไลด์ล่วงหน้าโดยไม่ใช้รหัส →", "Preview Slides Without ID →"))}</span>
            </button>
          </div>
        `;
        $("tvSubBackHomeBtn").addEventListener("click", () => {
          navigateTvTab("home");
          restoreHomeFocus();
        });
        $("tvHsdSkipGateBtn").addEventListener("click", () => {
          if (api && api.openHsDiscussion) {
            api.openHsDiscussion(st.hsdModule || "HS1");
          }
          syncSubpageBar();
        });
        return;
      }

      bar.innerHTML = `
        <button type="button" class="tv-back-home-btn" id="tvSubBackHomeBtn">
          <span>← ${esc(t("หน้าหลัก", "Home"))}</span>
        </button>
        <div class="tv-hsd-bar-right">
          ${
            ROLE === "student"
              ? isLiveJoined
                ? `<span class="tv-live-active-pill">
                     <span>🟢 ${esc(t(`ห้องสด กลุ่ม ${st.myStudent.disc} · ${st.myStudent.nickname || st.myStudent.id}`, `Live G${st.myStudent.disc} · ${st.myStudent.nickname || st.myStudent.id}`))}</span>
                     <button type="button" class="tv-live-exit-btn" id="tvHsdExitLiveBtn">${esc(t("ออกโหมดสด", "Exit Live"))}</button>
                   </span>`
                : `<span class="tv-preview-mode-tag">📖 ${esc(t("โหมดอ่านล่วงหน้า (ไม่ต้องใช้รหัส)", "Preview Mode (No ID)"))}</span>
                   <button type="button" class="tv-live-join-pill" id="tvHsdEnterLiveBtn">🟢 ${esc(t("เข้าห้องเรียนสด (Interactive)", "Join Live Class"))}</button>`
              : ""
          }
          <div class="tv-sibling-pills" role="group" aria-label="รูปแบบการแสดงผลอภิปราย">
            <button type="button" class="tv-sibling-pill ${curMode === "slide" ? "is-active" : ""}" id="tvHsdModeSlideBtn">${esc(t("สไลด์ 16:9", "16:9 Slides"))}</button>
            <button type="button" class="tv-sibling-pill ${curMode === "scroll" ? "is-active" : ""}" id="tvHsdModeScrollBtn">${esc(t("เลื่อนอ่านยาว", "Full Scroll"))}</button>
          </div>
        </div>
      `;
      $("tvSubBackHomeBtn").addEventListener("click", () => {
        navigateTvTab("home");
        restoreHomeFocus();
      });
      const enterLiveBtn = $("tvHsdEnterLiveBtn");
      if (enterLiveBtn) {
        enterLiveBtn.addEventListener("click", () => {
          if (api && api.openHsLiveJoinGate) api.openHsLiveJoinGate(st.hsdModule);
          syncSubpageBar();
        });
      }
      const exitLiveBtn = $("tvHsdExitLiveBtn");
      if (exitLiveBtn) {
        exitLiveBtn.addEventListener("click", () => {
          if (api && api.exitHsLiveMode) api.exitHsLiveMode();
          syncSubpageBar();
        });
      }
      $("tvHsdModeSlideBtn").addEventListener("click", () => {
        if ($("hsdViewSlideBtn")) $("hsdViewSlideBtn").click();
        syncSubpageBar();
      });
      $("tvHsdModeScrollBtn").addEventListener("click", () => {
        if ($("hsdViewScrollBtn")) $("hsdViewScrollBtn").click();
        syncSubpageBar();
      });
      return;
    }

    let siblings = [];
    if (groupKey === "knowledge") {
      siblings = [
        { id: "textbooks", label: t("บทเรียน HS1–HS6", "HS1–HS6 Textbooks") },
        { id: "practice", label: t("คำศัพท์ & โจทย์ (82 ข้อ)", "Flashcards & Quiz") },
        { id: "manual", label: t("คู่มือรายวิชา", "Course Manual") }
      ];
      if (ROLE === "faculty") {
        siblings.unshift({ id: "faculty-docs", label: t("คู่มือผู้สอน & ข้อสอบ", "Teacher Guides") });
      }
    } else if (groupKey === "groups") {
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
        const otherDialogsOpen =
          ($("imageLightbox") && !$("imageLightbox").hidden) ||
          ($("calendarEventModal") && !$("calendarEventModal").hidden) ||
          ($("globalSpotlightModal") && !$("globalSpotlightModal").hidden) ||
          document.fullscreenElement;
        const api = getApi();
        const curTab = api && api.getState ? api.getState().activeTab : "home";
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
      const activeTab = api && api.getState ? api.getState().activeTab : "home";
      const inTopBar = $("tvHeaderDock") && $("tvHeaderDock").contains(document.activeElement);
      if (activeTab !== "home" && !inTopBar) return;

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

  /* ---------- Boot Sequence ---------- */
  function bootTvInterface() {
    if (document.body.classList.contains("is-ppt-slideshare-window")) return;
    ensureHomePanelExists();
    mountTvTopCapsule();
    mountSubpageEnhancements();
    renderHomeLauncher();
    syncSubpageBar();
    syncProfilePill();
    initTvRemoteNavigation();

    window.addEventListener("racm:tabchange", () => {
      syncSubpageBar();
      syncProfilePill();
    });

    window.addEventListener("racm:hsdstatechange", () => {
      syncSubpageBar();
      syncProfilePill();
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
