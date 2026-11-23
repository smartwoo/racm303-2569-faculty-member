/* ==========================================================================
   RACM 303 — EP6: Measures of Morbidity & Mortality Interactive Lecture Studio (v3)
   - Protected Google Drive Video Stream (View-Only · No Student Download · Zero YouTube)
   - Pure Clean Video (Zero Conceptualized text inside video or PiP player)
   - Dedicated Non-Overlapping Cinema CC Bar (Never covers Drive video controller!)
   - Customizable 4-Mode Workspace Layout + Hide/Unhide Toggles for All 7 Sections
   - Auto Picture-in-Picture (PiP) on Scroll, Zero Unwanted Auto-Scroll, Clickable Slide Bridges
   ========================================================================== */
(function () {
  "use strict";

  const DATA = window.RACM303_EP6_MORBIDITY;
  if (!DATA) return;

  const STORAGE_DRIVE_KEY = "racm303_ep6_drive_file_id";
  const STORAGE_UI_PREFS_KEY = "racm303_ep6_ui_prefs_v3";
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const MIN_SEC = DATA.meta.startSec || 4;
  const MAX_SEC = DATA.meta.endSec || 3806;

  function isFacultyPortal() {
    return (
      window.PORTAL_ROLE === "faculty" ||
      (document.body && document.body.classList.contains("role-faculty"))
    );
  }

  function extractDriveFileId(rawInput) {
    const s = String(rawInput || "").trim();
    if (!s) return "";
    const mFile = s.match(/\/file\/d\/([a-zA-Z0-9_-]{15,})/);
    if (mFile) return mFile[1];
    const mId = s.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    if (mId) return mId[1];
    if (/^[a-zA-Z0-9_-]{18,}$/.test(s)) return s;
    return "";
  }

  function getActiveDriveFileId() {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = extractDriveFileId(params.get("ep6DriveId"));
      if (fromUrl) return fromUrl;
      const saved = extractDriveFileId(localStorage.getItem(STORAGE_DRIVE_KEY));
      if (saved) return saved;
    } catch (_) {}
    return DATA.meta.driveFileId || "";
  }

  function buildDrivePreviewUrl(driveId, sec, autoPlay) {
    const cleanSec = Math.max(0, Math.floor(Number(sec) || 0));
    const base = `https://drive.google.com/file/d/${encodeURIComponent(driveId)}/preview`;
    const qp = [`t=${cleanSec}s`, `start=${cleanSec}`];
    if (autoPlay) qp.push("autoplay=1");
    return `${base}?${qp.join("&")}`;
  }

  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openSlideLightbox(imgSrc, captionText) {
    const lb = document.getElementById("imageLightbox");
    const lbImg = document.getElementById("lightboxImg");
    const lbCap = document.getElementById("lightboxCaption");
    if (lb && lbImg) {
      lbImg.src = imgSrc;
      lbImg.alt = captionText || "";
      if (lbCap) lbCap.textContent = captionText || "";
      lb.hidden = false;
    } else {
      window.open(imgSrc, "_blank", "noopener");
    }
  }

  function findCaptionAtTime(sec) {
    const cues = DATA.captions;
    if (!Array.isArray(cues) || !cues.length) return "";
    const t = Number(sec) || 0;
    let lo = 0;
    let hi = cues.length - 1;
    let bestIdx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (cues[mid][0] <= t) {
        bestIdx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (bestIdx >= 0) {
      const [st, en, txt] = cues[bestIdx];
      if (t >= st && t <= en + 1.2) return txt;
    }
    return "";
  }

  function findSlideAtTime(sec) {
    const t = Math.max(MIN_SEC, Math.min(MAX_SEC, Number(sec) || MIN_SEC));
    const segs = DATA.timelineSegments || [];
    for (let i = 0; i < segs.length; i++) {
      if (t >= segs[i].startSec && t < segs[i].endSec) {
        return segs[i].slideId;
      }
    }
    if (segs.length && t >= segs[segs.length - 1].endSec) {
      return segs[segs.length - 1].slideId;
    }
    return 1;
  }

  function getSlideById(id) {
    return (DATA.slides || []).find((s) => s.id === id) || DATA.slides[0];
  }

  function getStageById(id) {
    return (DATA.stages || []).find((st) => st.id === id) || DATA.stages[0];
  }

  const DEFAULT_PANELS = {
    stages: true,
    video: true,
    slide: true,
    scrubber: true,
    concept: true,
    verbatim: true,
    atlas: true
  };

  const studioState = {
    currentSec: MIN_SEC,
    activeSlideId: 1,
    activeStageId: 1,
    imgQuality: "hd", // 'hd' | 'yt'
    layoutMode: "cinema", // 'cinema' | 'balanced' | 'tri' | 'stack'
    panels: { ...DEFAULT_PANELS },
    atlasView: "flow", // 'flow' | 'matrix'
    stageFilter: 0,
    searchQuery: "",
    isPlaying: false,
    playbackSpeed: 1,
    ccEnabled: true,
    ccLarge: false,
    isPipActive: false,
    isPipMinimized: false,
    manualPipPinned: false,
    pipDismissedWhileScrolled: false
  };

  // Load persisted layout & panel visibility preferences
  (function loadPersistedPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_UI_PREFS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (["cinema", "balanced", "tri", "stack"].includes(parsed.layoutMode)) {
          studioState.layoutMode = parsed.layoutMode;
        }
        if (["hd", "yt"].includes(parsed.imgQuality)) {
          studioState.imgQuality = parsed.imgQuality;
        }
        if (typeof parsed.ccEnabled === "boolean") {
          studioState.ccEnabled = parsed.ccEnabled;
        }
        if (typeof parsed.ccLarge === "boolean") {
          studioState.ccLarge = parsed.ccLarge;
        }
        if (parsed.panels && typeof parsed.panels === "object") {
          Object.keys(DEFAULT_PANELS).forEach((k) => {
            if (typeof parsed.panels[k] === "boolean") {
              studioState.panels[k] = parsed.panels[k];
            }
          });
        }
      }
    } catch (_) {}
  })();

  function savePersistedPrefs() {
    try {
      localStorage.setItem(
        STORAGE_UI_PREFS_KEY,
        JSON.stringify({
          layoutMode: studioState.layoutMode,
          imgQuality: studioState.imgQuality,
          ccEnabled: studioState.ccEnabled,
          ccLarge: studioState.ccLarge,
          panels: studioState.panels
        })
      );
    } catch (_) {}
  }

  function getSlideImg(slide) {
    return studioState.imgQuality === "yt" ? slide.ytImg : slide.hdImg;
  }

  let activeInstance = null;

  function destroyActiveTimers() {
    if (!activeInstance) return;
    if (activeInstance.clockTimer) {
      clearInterval(activeInstance.clockTimer);
      activeInstance.clockTimer = null;
    }
    if (activeInstance.seekDebounceTimer) {
      clearTimeout(activeInstance.seekDebounceTimer);
      activeInstance.seekDebounceTimer = null;
    }
    if (activeInstance.flashTimer) {
      clearTimeout(activeInstance.flashTimer);
      activeInstance.flashTimer = null;
    }
    if (activeInstance.cleanupListeners) {
      try {
        activeInstance.cleanupListeners();
      } catch (_) {}
      activeInstance.cleanupListeners = null;
    }
    activeInstance = null;
  }

  const PANEL_DEFS = [
    { key: "stages", label: "🗺️ แถบ 5 องก์" },
    { key: "video", label: "🎥 วิดีโอ" },
    { key: "slide", label: "🖼️ สไลด์ซิงก์" },
    { key: "scrubber", label: "⏱️ แถบเลื่อนเวลา" },
    { key: "concept", label: "💡 Conceptualized" },
    { key: "verbatim", label: "🎙️ คำพูด & Flow" },
    { key: "atlas", label: "🧭 ผัง 43 สไลด์" }
  ];

  const LAYOUT_DEFS = [
    { id: "cinema", label: "🖥️ จอกว้าง (วิดีโอ+สไลด์บน · เนื้อหาล่าง)" },
    { id: "balanced", label: "⚖️ 2 คอลัมน์สมดุล (ซ้ายสื่อ · ขวาเนื้อหา)" },
    { id: "tri", label: "🎬 3 ช่องขนาน (วิดีโอ · สไลด์ · เนื้อหา)" },
    { id: "stack", label: "📄 เรียงเดี่ยวแนวตั้ง" }
  ];

  function renderEp6MorbidityStudio(container, opts) {
    if (!container) return;
    destroyActiveTimers();
    container.replaceChildren();

    const isCompactEmbed = Boolean(opts && opts.compactHeader);
    const facultyMode = isFacultyPortal();
    let currentDriveId = getActiveDriveFileId();

    const root = document.createElement("section");
    root.className = "ep6-studio-root";
    root.id = "ep6MorbidityStudioRoot";
    root.tabIndex = -1;

    const instance = {
      root,
      clockTimer: null,
      lastTickMs: 0,
      seekDebounceTimer: null,
      flashTimer: null,
      dockedMeasuredHeight: 0,
      cleanupListeners: null
    };
    activeInstance = instance;

    // 1. Header Banner
    const header = document.createElement("div");
    header.className = "ep6-studio-header";
    header.innerHTML = `
      <div class="ep6-head-main">
        <div class="ep6-head-eyebrow">
          <span class="ep6-badge-code">EP6 · สอบ 15%</span>
          <span class="ep6-badge-meta">🔒 Google Drive Protected Stream (ห้ามดาวน์โหลด)</span>
          <span class="ep6-badge-meta">43 Captured Slides · Verbatim → Conceptualized</span>
          <span class="ep6-badge-meta">⏱ 00:04 – 62:00</span>
        </div>
        <h3 class="ep6-head-title">Measures of Morbidity &amp; Mortality · การวัดการป่วย การตาย ภาระโรค (DALY) และการปรับมาตรฐานอัตรา</h3>
        <p class="ep6-head-sub">${esc(DATA.meta.recordedInfo)} — เลือกจัด Layout และซ่อน/แสดงแต่ละส่วนได้อิสระ พร้อมคำบรรยายไทย CC แยกใต้จอวิดีโอไม่บังปุ่มควบคุม และโหมดหน้าต่างลอย PiP เมื่อเลื่อนอ่านด้านล่าง</p>
      </div>
      <div class="ep6-head-actions">
        <a class="btn sm" href="${esc(DATA.meta.pdfDownloadPath)}" download="EP6_Measures_of_Morbidity_and_Mortality_Slides.pdf">📥 ดาวน์โหลดสไลด์ประกอบ (.PDF)</a>
        ${
          facultyMode
            ? `<button type="button" class="btn sm" id="ep6ToggleFacultyDriveBtn">🔐 ตั้งค่าไฟล์วิดีโอ Drive (อาจารย์)</button>`
            : `<span class="ep6-protected-pill" title="วิดีโอสงวนสิทธิ์เฉพาะการเรียนในรายวิชา RACM 303 ห้ามดาวน์โหลดหรือเผยแพร่ซ้ำ">🔒 เล่นผ่านเว็บเท่านั้น (No Download)</span>`
        }
      </div>
    `;
    if (!isCompactEmbed) {
      root.appendChild(header);
    }

    // Faculty-Only Protected Drive Configuration Drawer
    if (facultyMode) {
      const facBar = document.createElement("div");
      facBar.className = "ep6-faculty-drive-bar";
      facBar.id = "ep6FacultyDriveBar";
      facBar.hidden = true;
      facBar.innerHTML = `
        <div class="ep6-fdb-head">
          <strong>🔐 จัดการไฟล์วิดีโอใน Google Drive แบบป้องกันนักศึกษาดาวน์โหลด (เฉพาะอาจารย์)</strong>
          <a class="btn sm" href="https://drive.google.com/drive/folders/${esc(DATA.meta.driveProtectedFolderId)}" target="_blank" rel="noopener">📂 เปิดโฟลเดอร์ Drive ที่ป้องกันสิทธิ์ ↗</a>
        </div>
        <p class="ep6-fdb-note">
          วิธีอัปเดตไฟล์เสียงบรรยายเต็มทับไฟล์เดิมโดยไม่ต้องแก้โค้ด: เปิดโฟลเดอร์ด้านบน → คลิกขวาที่ <code>EP6_Measures_of_Morbidity_and_Mortality.mp4</code> → <strong>จัดการเวอร์ชัน (Manage versions) → อัปโหลดเวอร์ชันใหม่</strong> และในเมนู <strong>แชร์ (Share) → ⚙️</strong> ให้เอาเครื่องหมายถูกออกจาก <em>“ผู้มีสิทธิ์อ่านและผู้แสดงความคิดเห็นจะเห็นตัวเลือกในการดาวน์โหลด พิมพ์ และคัดลอก”</em> หรือวางลิงก์ไฟล์วิดีโอ Drive อื่นด้านล่าง:
        </p>
        <div class="ep6-fdb-form">
          <input type="text" id="ep6FacultyDriveInput" class="ep6-search-input" value="${esc(currentDriveId)}" placeholder="วางลิงก์ Google Drive (https://drive.google.com/file/d/.../view) หรือ File ID">
          <button type="button" class="btn sm primary" id="ep6SaveDriveIdBtn">บันทึก &amp; โหลดวิดีโอใหม่</button>
          <button type="button" class="btn sm" id="ep6ResetDriveIdBtn">คืนค่าเริ่มต้น</button>
        </div>
      `;
      root.appendChild(facBar);
    }

    // 2. Workspace Layout Switcher & Hide/Unhide Section Control Bar
    const workspaceBar = document.createElement("div");
    workspaceBar.className = "ep6-workspace-bar";
    workspaceBar.id = "ep6WorkspaceBar";
    workspaceBar.innerHTML = `
      <div class="ep6-ws-row">
        <div class="ep6-ws-group">
          <span class="ep6-ws-label">📐 จัดรูปแบบ Layout:</span>
          <div class="ep6-mode-group" role="group" aria-label="เลือกรูปแบบการจัดวางหน้าจอ">
            ${LAYOUT_DEFS.map(
              (ld) =>
                `<button type="button" class="ep6-tool-btn ${studioState.layoutMode === ld.id ? "is-active" : ""}" data-layout-mode="${ld.id}">${esc(ld.label)}</button>`
            ).join("")}
          </div>
        </div>
        <div class="ep6-ws-group">
          <span class="ep6-ws-label">ความชัดสไลด์:</span>
          <div class="ep6-mode-group" role="group" aria-label="ความละเอียดภาพสไลด์">
            <button type="button" class="ep6-tool-btn ${studioState.imgQuality === "hd" ? "is-active" : ""}" data-imgq="hd">✨ คมชัด HD</button>
            <button type="button" class="ep6-tool-btn ${studioState.imgQuality === "yt" ? "is-active" : ""}" data-imgq="yt">📸 ภาพจริงขณะบรรยาย</button>
          </div>
        </div>
      </div>

      <div class="ep6-ws-row ep6-ws-toggles-row">
        <div class="ep6-ws-group ep6-ws-vis-wrap">
          <span class="ep6-ws-label">👁️ ซ่อน / แสดงส่วนต่างๆ:</span>
          <div class="ep6-vis-pills" id="ep6VisPills">
            ${PANEL_DEFS.map(
              (p) =>
                `<button type="button" class="ep6-vis-pill ${studioState.panels[p.key] ? "is-shown" : "is-hidden"}" data-toggle-panel="${p.key}" aria-pressed="${studioState.panels[p.key]}">
                  <span class="ep6-vis-eye">${studioState.panels[p.key] ? "✓" : "+"}</span> ${esc(p.label)}
                </button>`
            ).join("")}
          </div>
        </div>
        <button type="button" class="ep6-reset-ws-btn" id="ep6ResetWorkspaceBtn" title="แสดงครบทุกส่วนและคืนค่า Layout มาตรฐาน">↺ แสดงครบทุกส่วน</button>
      </div>
    `;
    root.appendChild(workspaceBar);

    // 3. 5-Stage Logical Flow Stepper Ribbon
    const stepperWrap = document.createElement("div");
    stepperWrap.className = "ep6-stage-ribbon";
    stepperWrap.id = "ep6PanelStages";
    stepperWrap.setAttribute("role", "navigation");
    stepperWrap.setAttribute("aria-label", "ลำดับตรรกะการเรียนรู้ 5 องก์ (5-Stage Logical Flow)");
    stepperWrap.innerHTML = `
      <div class="ep6-sec-head-inline">
        <span class="ep6-ribbon-label">🗺️ Logical Flow 5 องก์ต่อเนื่อง (คลิกเพื่อข้ามไปยังช่วงเวลาของแต่ละองก์):</span>
        <button type="button" class="ep6-inline-hide-btn" data-hide-panel="stages" title="ซ่อนแถบ 5 องก์">ซ่อน ✕</button>
      </div>
      <div class="ep6-stage-grid" id="ep6StageStepperGrid">
        ${DATA.stages
          .map(
            (st) => `
          <button type="button" class="ep6-stage-step" data-stage-jump="${st.id}">
            <div class="ep6-st-top">
              <span class="ep6-st-num">${esc(st.code)}</span>
              <span class="ep6-st-time">${esc(st.rangeLabel)}</span>
            </div>
            <div class="ep6-st-title">${esc(st.title)}</div>
            <div class="ep6-st-count">${st.slideIds.length} สไลด์</div>
          </button>
        `
          )
          .join("")}
      </div>
    `;
    root.appendChild(stepperWrap);

    // 4. Synchronized Theater (adapts dynamically to layoutMode + hidden panels!)
    const theater = document.createElement("div");
    theater.className = `ep6-theater layout-${studioState.layoutMode}`;
    theater.id = "ep6TheaterGrid";
    theater.innerHTML = `
      <div class="ep6-media-col" id="ep6MediaCol">
        <div class="ep6-player-stage" id="ep6PlayerStage">
          <!-- VIDEO PANEL (Pure Clean Video + Non-Overlapping Dedicated CC Strip Below Video!) -->
          <div class="ep6-video-slot" id="ep6VideoSlot">
            <div class="ep6-pip-placeholder" id="ep6PipPlaceholder" hidden>
              <div class="ep6-pip-ph-inner">
                <span class="ep6-pip-ph-icon">⧉</span>
                <div>
                  <strong>วิดีโอกำลังแสดงแบบหน้าต่างลอย (Picture-in-Picture) มุมขวาล่าง</strong>
                  <p>เลื่อนอ่านแผนผังตรรกะทั้ง 43 สไลด์ด้านล่างควบคู่กับการดูวิดีโอได้ทันที</p>
                </div>
                <button type="button" class="btn sm" id="ep6ReturnFromPipBtn">ดึงกลับช่องหลัก</button>
              </div>
            </div>

            <div class="ep6-video-dock" id="ep6VideoDock">
              <div class="ep6-vdock-head">
                <div class="ep6-vdock-title-wrap">
                  <span class="ep6-live-dot" id="ep6DockDot"></span>
                  <span class="ep6-slide-pill" id="ep6DockHeaderLabel">🎥 วิดีโอบรรยาย (Drive Protected) · Slide 1/43</span>
                </div>
                <div class="ep6-vdock-actions">
                  <button type="button" class="ep6-dock-icon-btn" id="ep6PinPipBtn" title="เปิด/ปิด โหมดหน้าต่างลอย (Picture-in-Picture)">⧉ PiP</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-dock-only" data-hide-panel="video" title="ซ่อนส่วนวิดีโอ">ซ่อน</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipMinBtn" title="ย่อ/ขยาย หน้าต่าง PiP">—</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipTopBtn" title="เลื่อนกลับขึ้นด้านบนสุด">⬆ บนสุด</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipCloseBtn" title="ปิดหน้าต่างลอย PiP ชั่วคราว">✕</button>
                </div>
              </div>

              <!-- Pure 16:9 Drive Video Frame: ZERO CC or Conceptualized overlay covering Drive's video controller! -->
              <div class="ep6-drive-aspect" id="ep6DriveAspect">
                <iframe
                  id="ep6DriveIframeEl"
                  src="${esc(buildDrivePreviewUrl(currentDriveId, studioState.currentSec, false))}"
                  title="Measures of Morbidity &amp; Mortality — RACM 303 Protected Drive Video"
                  allow="autoplay; fullscreen"
                  allowfullscreen
                ></iframe>

                <!-- Shield over Google Drive top-right pop-out icon ONLY (never touches bottom controller!) -->
                <div class="ep6-drive-popout-shield" title="สงวนสิทธิ์การรับชมเฉพาะบนเว็บไซต์รายวิชา RACM 303 (ห้ามดาวน์โหลด)">
                  <span>🔒 RACM 303</span>
                </div>

                <!-- Temporary 0.7s ±15s Skip Feedback Pill at upper-center (never touches bottom controller!) -->
                <div class="ep6-skip-flash" id="ep6SkipFlash" hidden></div>
              </div>

              <!-- Dedicated Cinema Closed Captions (CC) Bar BELOW video frame -> 0% overlap with Drive video controller! -->
              <div class="ep6-cc-dock-strip ${studioState.ccLarge ? "is-large" : ""}" id="ep6CcOverlay" ${studioState.ccEnabled ? "" : "hidden"}>
                <span class="ep6-cc-badge">CC</span>
                <span class="ep6-cc-text" id="ep6CcText">คำบรรยายภาษาไทยตามเวลาการบรรยายของ ศ. นพ.วิชัย เอกพลากร</span>
              </div>

              <!-- Compact YouTube-Style Transport Bar (ZERO Conceptualized text inside video player!) -->
              <div class="ep6-ytstyle-bar" id="ep6YtStyleBar">
                <div class="ep6-ytb-left">
                  <button type="button" class="ep6-ytb-btn is-play" id="ep6PlayPauseBtn" title="เล่น/หยุดซิงก์เวลาและคำบรรยาย (K)">▶ เล่น</button>
                  <button type="button" class="ep6-ytb-btn" id="ep6Rew15Btn" title="ถอยหลัง 15 วินาที (J หรือ ←)">↺ -15s</button>
                  <button type="button" class="ep6-ytb-btn" id="ep6Fwd15Btn" title="เดินหน้า 15 วินาที (L หรือ →)">+15s ↻</button>
                  <button type="button" class="ep6-ytb-btn ep6-pip-only" id="ep6PipPrevSlideBtn" title="สไลด์ก่อนหน้า">⏮</button>
                  <button type="button" class="ep6-ytb-btn ep6-pip-only" id="ep6PipNextSlideBtn" title="สไลด์ถัดไป">⏭</button>
                  <span class="ep6-ytb-time"><strong id="ep6DockTimeTxt">00:04</strong> / 62:00</span>
                </div>
                <div class="ep6-ytb-right">
                  <button type="button" class="ep6-ytb-btn is-cc ${studioState.ccEnabled ? "is-on" : ""}" id="ep6CcToggleBtn" aria-pressed="${studioState.ccEnabled}" title="เปิด/ปิด คำบรรยายภาษาไทยใต้จอวิดีโอ (C)">CC</button>
                  <button type="button" class="ep6-ytb-btn" id="ep6CcSizeBtn" title="ขยาย/ย่อ ขนาดตัวอักษรคำบรรยาย CC">A+</button>
                  <div class="ep6-speed-wrap">
                    <select id="ep6SpeedSelect" class="ep6-speed-select" aria-label="ปรับความเร็วการเล่น (Playback Speed)" title="ปรับความเร็วการซิงก์เวลาและคำบรรยาย (0.5x – 2x)">
                      ${SPEEDS.map(
                        (sp) => `<option value="${sp}" ${studioState.playbackSpeed === sp ? "selected" : ""}>${sp}x</option>`
                      ).join("")}
                    </select>
                  </div>
                  <button type="button" class="ep6-ytb-btn" id="ep6FullscreenBtn" title="ขยายเต็มจอพร้อมคำบรรยาย CC">⛶</button>
                </div>
              </div>
            </div>
          </div>

          <!-- CAPTURED SLIDE PANEL -->
          <div class="ep6-sync-slide-box" id="ep6SyncSlideBox">
            <div class="ep6-slide-frame-head">
              <span id="ep6SyncSlideBadge" class="ep6-slide-pill">Slide 1 / 43</span>
              <div class="ep6-slide-head-btns">
                <button type="button" class="ep6-zoom-btn" id="ep6ZoomCurrentSlideBtn">🔍 ขยายเต็มจอ</button>
                <button type="button" class="ep6-inline-hide-btn" data-hide-panel="slide" title="ซ่อนกรอบสไลด์">ซ่อน ✕</button>
              </div>
            </div>
            <div class="ep6-slide-img-wrap" id="ep6SyncSlideImgWrap" title="คลิกเพื่อขยายภาพสไลด์เต็มจอ">
              <img id="ep6SyncSlideImg" src="${esc(getSlideImg(DATA.slides[0]))}" alt="Captured lecture slide">
            </div>
          </div>
        </div>

        <!-- TIMELINE SCRUBBER PANEL (ZERO unwanted auto-scroll down!) -->
        <div class="ep6-scrubber-card" id="ep6ScrubberCard">
          <div class="ep6-scrubber-controls">
            <div class="ep6-transport-btns">
              <button type="button" class="ep6-ctrl-btn" id="ep6PrevSlideBtn" title="ข้ามไปสไลด์ก่อนหน้า">⏮ สไลด์ก่อน</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6ScrubRew15Btn" title="ถอยหลัง 15 วินาที">↺ -15 วิ</button>
              <button type="button" class="ep6-ctrl-btn is-primary" id="ep6MainPlayBtn">▶ เล่น / หยุด</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6ScrubFwd15Btn" title="เดินหน้า 15 วินาที">+15 วิ ↻</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6NextSlideBtn" title="ข้ามไปสไลด์ถัดไป">สไลด์ถัดไป ⏭</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6ForceSyncDriveBtn" title="ซิงก์ตัวเล่นวิดีโอ Google Drive ให้กระโดดมายังเวลาปัจจุบันบนแถบ Timeline">🎯 ซิงก์วิดีโอมาเวลานี้</button>
            </div>
            <div class="ep6-scrubber-right-meta">
              <div class="ep6-time-readout">
                <strong id="ep6CurTimeTxt">00:04</strong>
                <span>/ 62:00</span>
              </div>
              <button type="button" class="ep6-inline-hide-btn" data-hide-panel="scrubber" title="ซ่อนแถบเลื่อนเวลา">ซ่อน ✕</button>
            </div>
          </div>

          <div class="ep6-track-outer" id="ep6TimelineTrack" role="slider" aria-label="แถบเวลาคาบเรียน Measures of Morbidity & Mortality" aria-valuemin="${MIN_SEC}" aria-valuemax="${MAX_SEC}" aria-valuenow="${MIN_SEC}" tabindex="0">
            <div class="ep6-track-stages">
              ${DATA.stages
                .map((st) => {
                  const leftPct = ((st.startSec - MIN_SEC) / (MAX_SEC - MIN_SEC)) * 100;
                  const widthPct = ((st.endSec - st.startSec) / (MAX_SEC - MIN_SEC)) * 100;
                  return `<div class="ep6-track-seg stage-${st.id}" style="left:${leftPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%" title="${esc(st.code)}: ${esc(st.title)}"></div>`;
                })
                .join("")}
            </div>
            <div class="ep6-track-ticks">
              ${DATA.slides
                .map((sl) => {
                  const pct = ((sl.startSec - MIN_SEC) / (MAX_SEC - MIN_SEC)) * 100;
                  return `<span class="ep6-tick" style="left:${pct.toFixed(2)}%" data-tick-slide="${sl.id}"></span>`;
                })
                .join("")}
            </div>
            <div class="ep6-track-progress" id="ep6TrackProgress" style="width:0%"></div>
            <div class="ep6-track-playhead" id="ep6TrackPlayhead" style="left:0%"></div>
            <div class="ep6-track-tooltip" id="ep6TrackTooltip" hidden></div>
          </div>

          <div class="ep6-track-legend">
            ${DATA.stages
              .map(
                (st) =>
                  `<button type="button" class="ep6-legend-chip stage-${st.id}" data-stage-jump="${st.id}"><span>${esc(st.code)}</span> ${esc(st.rangeLabel)}</button>`
              )
              .join("")}
          </div>
        </div>
      </div>

      <!-- CONCEPTUALIZED INSIGHT & VERBATIM QUOTATION COLUMN -->
      <div class="ep6-concept-col" id="ep6ConceptCol" aria-live="polite">
        <div class="ep6-live-status-bar">
          <div class="ep6-live-indicator">
            <span class="ep6-live-dot" id="ep6LiveDot"></span>
            <span id="ep6LiveStageBadge" class="ep6-live-stage-pill">Stage 1/5</span>
            <span id="ep6LiveTimeRange" class="ep6-live-range-txt">00:04 – 04:40</span>
          </div>
          <div class="ep6-live-bar-acts">
            <button type="button" class="ep6-jump-atlas-btn" id="ep6JumpToActiveCardBtn" title="คลิกเมื่อต้องการเลื่อนลงไปดูสไลด์นี้ในตาราง 43 สไลด์ด้านล่าง">
              ⬇ ดูในผัง 43 สไลด์
            </button>
          </div>
        </div>

        <div class="ep6-live-card" id="ep6LiveConceptCard"></div>
      </div>
    `;
    root.appendChild(theater);

    // Floating Restore Pill when PiP was manually dismissed while scrolled down
    const pipRestorePill = document.createElement("button");
    pipRestorePill.type = "button";
    pipRestorePill.className = "ep6-pip-restore-pill";
    pipRestorePill.id = "ep6PipRestorePill";
    pipRestorePill.hidden = true;
    pipRestorePill.innerHTML = `🎥 เปิดวิดีโอหน้าต่างลอย (PiP)`;
    root.appendChild(pipRestorePill);

    // 5. Complete 43-Slide Logical Flow Atlas & Rapid Review Matrix
    const atlas = document.createElement("div");
    atlas.className = "ep6-atlas-wrap";
    atlas.id = "ep6PanelAtlas";
    atlas.innerHTML = `
      <div class="ep6-atlas-bar">
        <div class="ep6-atlas-tabs" role="tablist">
          <button type="button" class="ep6-atlas-tab ${studioState.atlasView === "flow" ? "is-active" : ""}" data-aview="flow">🧭 แผนผังตรรกะครบทั้ง 43 สไลด์ (Captured Slide + Verbatim → Conceptualized)</button>
          <button type="button" class="ep6-atlas-tab ${studioState.atlasView === "matrix" ? "is-active" : ""}" data-aview="matrix">⚡ ตารางสรุปสูตร &amp; จุดตัดสำคัญ (Rapid Review 15 ตัวชี้วัด)</button>
        </div>
        <div class="ep6-atlas-filters" id="ep6AtlasFiltersRow">
          <select id="ep6StageFilterSelect" class="ep6-select" aria-label="กรองตามองก์การเรียนรู้">
            <option value="0">แสดงครบทั้ง 5 องก์ (43 สไลด์)</option>
            ${DATA.stages
              .map((st) => `<option value="${st.id}" ${studioState.stageFilter === st.id ? "selected" : ""}>${esc(st.code)} (${esc(st.rangeLabel)}): ${esc(st.title)}</option>`)
              .join("")}
          </select>
          <input type="search" id="ep6SlideSearchInput" class="ep6-search-input" placeholder="ค้นหาสไลด์ สูตร หรือคำพูด เช่น Prevalence, Person-year, DALY, SMR..." value="${esc(studioState.searchQuery)}">
          <button type="button" class="ep6-inline-hide-btn" data-hide-panel="atlas" title="ซ่อนผัง 43 สไลด์ด้านล่าง">ซ่อนผัง ✕</button>
        </div>
      </div>
      <div id="ep6AtlasBody"></div>
    `;
    root.appendChild(atlas);

    container.appendChild(root);

    root.querySelector("#ep6DriveAspect")?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Apply Layout Mode & Section Visibility dynamically
    function applyWorkspaceLayout() {
      const p = studioState.panels;

      const stagesEl = root.querySelector("#ep6PanelStages");
      const videoSlot = root.querySelector("#ep6VideoSlot");
      const slideBox = root.querySelector("#ep6SyncSlideBox");
      const playerStage = root.querySelector("#ep6PlayerStage");
      const scrubberCard = root.querySelector("#ep6ScrubberCard");
      const mediaCol = root.querySelector("#ep6MediaCol");
      const conceptCol = root.querySelector("#ep6ConceptCol");
      const atlasEl = root.querySelector("#ep6PanelAtlas");

      if (stagesEl) stagesEl.hidden = !p.stages;
      if (videoSlot) videoSlot.hidden = !p.video;
      if (slideBox) slideBox.hidden = !p.slide;
      if (playerStage) playerStage.hidden = !p.video && !p.slide;
      if (scrubberCard) scrubberCard.hidden = !p.scrubber;
      if (atlasEl) atlasEl.hidden = !p.atlas;

      const anyMediaShown = p.video || p.slide || p.scrubber;
      const anyConceptShown = p.concept || p.verbatim;
      if (mediaCol) mediaCol.hidden = !anyMediaShown;
      if (conceptCol) conceptCol.hidden = !anyConceptShown;

      // Update Live Card sub-panels if already rendered
      const thesisBox = root.querySelector("#ep6LiveThesisPanel");
      const quotesBox = root.querySelector("#ep6LiveVerbatimPanel");
      const bridgeBox = root.querySelector("#ep6LiveBridgePanel");
      if (thesisBox) thesisBox.hidden = !p.concept;
      if (quotesBox) quotesBox.hidden = !p.verbatim;
      if (bridgeBox) bridgeBox.hidden = !p.verbatim;

      // Compute layout classes on #ep6TheaterGrid and #ep6PlayerStage
      const cls = [`ep6-theater`, `layout-${studioState.layoutMode}`];
      if (!anyMediaShown || !anyConceptShown) cls.push("is-single-col");
      if (p.video && !p.slide) cls.push("only-video");
      if (!p.video && p.slide) cls.push("only-slide");
      theater.className = cls.join(" ");

      // Sync layout buttons
      root.querySelectorAll("[data-layout-mode]").forEach((btn) => {
        btn.classList.toggle("is-active", btn.getAttribute("data-layout-mode") === studioState.layoutMode);
      });

      // Sync visibility pills
      root.querySelectorAll("[data-toggle-panel]").forEach((btn) => {
        const key = btn.getAttribute("data-toggle-panel");
        const on = Boolean(p[key]);
        btn.classList.toggle("is-shown", on);
        btn.classList.toggle("is-hidden", !on);
        btn.setAttribute("aria-pressed", String(on));
        const eye = btn.querySelector(".ep6-vis-eye");
        if (eye) eye.textContent = on ? "✓" : "+";
      });

      if (!p.video && studioState.isPipActive) {
        applyPipMode(false);
      } else {
        evaluateScrollPiP();
      }
      savePersistedPrefs();
    }

    function showSkipFlash(deltaSec) {
      const el = root.querySelector("#ep6SkipFlash");
      if (!el) return;
      el.textContent = deltaSec < 0 ? `« ถอยหลัง ${Math.abs(deltaSec)} วินาที` : `เดินหน้า +${deltaSec} วินาที »`;
      el.className = `ep6-skip-flash ${deltaSec < 0 ? "is-left" : "is-right"}`;
      el.hidden = false;
      if (instance.flashTimer) clearTimeout(instance.flashTimer);
      instance.flashTimer = setTimeout(() => {
        el.hidden = true;
      }, 750);
    }

    function syncDriveIframeTo(sec, autoPlay, immediate) {
      const iframe = root.querySelector("#ep6DriveIframeEl");
      if (!iframe || !currentDriveId) return;
      const applySrc = () => {
        const nextUrl = buildDrivePreviewUrl(currentDriveId, sec, autoPlay);
        if (iframe.getAttribute("src") !== nextUrl) {
          iframe.setAttribute("src", nextUrl);
        }
      };
      if (instance.seekDebounceTimer) {
        clearTimeout(instance.seekDebounceTimer);
        instance.seekDebounceTimer = null;
      }
      if (immediate) {
        applySrc();
      } else {
        instance.seekDebounceTimer = setTimeout(applySrc, 360);
      }
    }

    function stopClock() {
      studioState.isPlaying = false;
      if (instance.clockTimer) {
        clearInterval(instance.clockTimer);
        instance.clockTimer = null;
      }
      syncTransportButtons();
    }

    function startClock(syncDriveNow) {
      if (instance.clockTimer) clearInterval(instance.clockTimer);
      studioState.isPlaying = true;
      instance.lastTickMs = performance.now();
      if (syncDriveNow) {
        syncDriveIframeTo(studioState.currentSec, true, true);
      }
      instance.clockTimer = setInterval(() => {
        const now = performance.now();
        const dtSec = Math.max(0, (now - instance.lastTickMs) / 1000);
        instance.lastTickMs = now;
        const next = studioState.currentSec + dtSec * studioState.playbackSpeed;
        if (next >= MAX_SEC - 0.5) {
          updateLiveUI(MAX_SEC - 1);
          stopClock();
          return;
        }
        updateLiveUI(next);
      }, 250);
      syncTransportButtons();
    }

    function syncTransportButtons() {
      const p1 = root.querySelector("#ep6PlayPauseBtn");
      const p2 = root.querySelector("#ep6MainPlayBtn");
      const dot1 = root.querySelector("#ep6LiveDot");
      const dot2 = root.querySelector("#ep6DockDot");
      const ccBtn = root.querySelector("#ep6CcToggleBtn");
      const ccBox = root.querySelector("#ep6CcOverlay");
      const ccSizeBtn = root.querySelector("#ep6CcSizeBtn");
      const speedSel = root.querySelector("#ep6SpeedSelect");

      if (p1) p1.textContent = studioState.isPlaying ? "⏸ หยุด" : "▶ เล่น";
      if (p2) p2.textContent = studioState.isPlaying ? "⏸ หยุดชั่วคราว" : "▶ เล่นวิดีโอ";
      if (dot1) dot1.classList.toggle("is-playing", studioState.isPlaying);
      if (dot2) dot2.classList.toggle("is-playing", studioState.isPlaying);
      if (ccBtn) {
        ccBtn.classList.toggle("is-on", studioState.ccEnabled);
        ccBtn.setAttribute("aria-pressed", String(studioState.ccEnabled));
      }
      if (ccBox) {
        ccBox.hidden = !studioState.ccEnabled;
        ccBox.classList.toggle("is-large", studioState.ccLarge);
      }
      if (ccSizeBtn) {
        ccSizeBtn.classList.toggle("is-on", studioState.ccLarge);
      }
      if (speedSel && String(speedSel.value) !== String(studioState.playbackSpeed)) {
        speedSel.value = String(studioState.playbackSpeed);
      }
      savePersistedPrefs();
    }

    // Core UI update — NEVER triggers window scroll or card.scrollIntoView!
    function updateLiveUI(sec, optsUpdate) {
      const clamped = Math.max(MIN_SEC, Math.min(MAX_SEC, Number(sec) || MIN_SEC));
      studioState.currentSec = clamped;
      const slideId = findSlideAtTime(clamped);
      const slide = getSlideById(slideId);
      const stage = getStageById(slide.stageId);
      const slideChanged = studioState.activeSlideId !== slide.id;
      studioState.activeSlideId = slide.id;
      studioState.activeStageId = stage.id;

      // 1. Update Scrubber & Time Readouts
      const pct = ((clamped - MIN_SEC) / (MAX_SEC - MIN_SEC)) * 100;
      const progEl = root.querySelector("#ep6TrackProgress");
      const headEl = root.querySelector("#ep6TrackPlayhead");
      const curTxt = root.querySelector("#ep6CurTimeTxt");
      const dockTxt = root.querySelector("#ep6DockTimeTxt");
      const trackEl = root.querySelector("#ep6TimelineTrack");
      const fmt = fmtTime(clamped);

      if (progEl) progEl.style.width = `${pct.toFixed(2)}%`;
      if (headEl) headEl.style.left = `${pct.toFixed(2)}%`;
      if (curTxt) curTxt.textContent = fmt;
      if (dockTxt) dockTxt.textContent = fmt;
      if (trackEl) trackEl.setAttribute("aria-valuenow", String(Math.floor(clamped)));

      // 2. Update Dedicated Below-Video Closed Captions (CC) — ONLY spoken verbatim words, never Conceptualized!
      const ccTxtEl = root.querySelector("#ep6CcText");
      const ccStrip = root.querySelector("#ep6CcOverlay");
      if (ccTxtEl && ccStrip) {
        const cue = findCaptionAtTime(clamped);
        if (cue) {
          ccTxtEl.textContent = cue;
          ccStrip.classList.remove("is-idle");
        } else {
          ccTxtEl.textContent = "…";
          ccStrip.classList.add("is-idle");
        }
      }

      // 3. Update Dock Header Label (Pure Slide number & time — ZERO Conceptualized text inside video player!)
      const dockLabel = root.querySelector("#ep6DockHeaderLabel");
      if (dockLabel) {
        dockLabel.textContent = studioState.isPipActive
          ? `🎥 PiP · Slide ${slide.id}/43 (${fmt})`
          : `🎥 วิดีโอบรรยาย (Drive Protected) · Slide ${slide.id}/43`;
      }

      // 4. Highlight active Stage in Stepper & Legend
      root.querySelectorAll("[data-stage-jump]").forEach((btn) => {
        const sid = Number(btn.getAttribute("data-stage-jump"));
        btn.classList.toggle("is-active", sid === stage.id);
      });

      // 5. Update Synchronized Slide Image
      const syncImg = root.querySelector("#ep6SyncSlideImg");
      const syncBadge = root.querySelector("#ep6SyncSlideBadge");
      if (syncImg) {
        const wantedSrc = getSlideImg(slide);
        if (syncImg.getAttribute("src") !== wantedSrc) {
          syncImg.setAttribute("src", wantedSrc);
        }
        syncImg.alt = `Slide ${slide.id}: ${slide.title}`;
      }
      if (syncBadge) {
        syncBadge.textContent = `Slide ${slide.id} / 43 · หน้าสไลด์ ${slide.deckSlideNo} (${studioState.imgQuality === "hd" ? "คมชัด HD" : "ภาพขณะบรรยาย"})`;
      }

      // 6. Update Conceptualized Card (respects Hide/Unhide for Concept vs Verbatim!)
      const stagePill = root.querySelector("#ep6LiveStageBadge");
      const rangeTxt = root.querySelector("#ep6LiveTimeRange");
      if (stagePill) {
        stagePill.textContent = `${stage.code} / 5 · ${stage.title}`;
        stagePill.className = `ep6-live-stage-pill stage-${stage.id}`;
      }
      if (rangeTxt) {
        rangeTxt.textContent = `Slide ${slide.id}/43 · ${slide.timeLabel}`;
      }

      const quotes = slide.verbatimQuotes || [];
      let activeQuoteIdx = 0;
      for (let i = 0; i < quotes.length; i++) {
        if (clamped >= quotes[i].tSec - 2) {
          activeQuoteIdx = i;
        }
      }

      const liveCard = root.querySelector("#ep6LiveConceptCard");
      if (
        liveCard &&
        (slideChanged || optsUpdate?.forceCard || liveCard.dataset.activeQuote !== String(activeQuoteIdx))
      ) {
        liveCard.dataset.activeQuote = String(activeQuoteIdx);
        const prevSlide = slide.id > 1 ? getSlideById(slide.id - 1) : null;
        const nextSlide = slide.id < DATA.slides.length ? getSlideById(slide.id + 1) : null;

        const prevBridgeHtml = prevSlide
          ? `<button type="button" class="ep6-bridge-step is-prev is-clickable" data-jump-slide="${prevSlide.id}" title="คลิกเพื่อไปยัง Slide ${prevSlide.id}: ${esc(prevSlide.title)}">
               <div class="ep6-bridge-head">
                 <span class="ep6-bridge-lbl">← รับช่วงจาก Slide ${prevSlide.id}</span>
                 <span class="ep6-bridge-go-pill">ไปยัง Slide ${prevSlide.id} (${fmtTime(prevSlide.startSec)})</span>
               </div>
               <p>${esc(slide.logicalFlow?.fromPrev || "")}</p>
             </button>`
          : `<div class="ep6-bridge-step is-prev">
               <div class="ep6-bridge-head">
                 <span class="ep6-bridge-lbl">จุดตั้งต้นคาบเรียน (Slide 1)</span>
               </div>
               <p>${esc(slide.logicalFlow?.fromPrev || "")}</p>
             </div>`;

        const nextBridgeHtml = nextSlide
          ? `<button type="button" class="ep6-bridge-step is-next is-clickable" data-jump-slide="${nextSlide.id}" title="คลิกเพื่อไปยัง Slide ${nextSlide.id}: ${esc(nextSlide.title)}">
               <div class="ep6-bridge-head">
                 <span class="ep6-bridge-lbl">ส่งต่อไปยัง Slide ${nextSlide.id} →</span>
                 <span class="ep6-bridge-go-pill">ไปยัง Slide ${nextSlide.id} (${fmtTime(nextSlide.startSec)}) →</span>
               </div>
               <p>${esc(slide.logicalFlow?.toNext || "")}</p>
             </button>`
          : `<div class="ep6-bridge-step is-next">
               <div class="ep6-bridge-head">
                 <span class="ep6-bridge-lbl">เชื่อมต่อคาบถัดไป (EP7 Health Survey)</span>
               </div>
               <p>${esc(slide.logicalFlow?.toNext || "")}</p>
             </div>`;

        liveCard.innerHTML = `
          <div class="ep6-lc-head">
            <div class="ep6-lc-kicker">Slide ${slide.id}/43 · หน้าสไลด์ ${slide.deckSlideNo} (${esc(slide.timeLabel)})</div>
            <h4 class="ep6-lc-title">${esc(slide.title)}</h4>
            <div class="ep6-lc-entitle">${esc(slide.enTitle || "")}</div>
            ${slide.revisitNotes ? `<div class="ep6-lc-revisit">🔄 ${esc(slide.revisitNotes)}</div>` : ""}
          </div>

          <div class="ep6-lc-thesis-box" id="ep6LiveThesisPanel" ${studioState.panels.concept ? "" : "hidden"}>
            <div class="ep6-sec-head-inline">
              <div class="ep6-lc-sec-tag">💡 แก่นแนวคิดที่สังเคราะห์ได้ (Conceptualized Takeaway)</div>
              <button type="button" class="ep6-inline-hide-btn" data-hide-panel="concept" title="ซ่อนส่วน Conceptualized">ซ่อน ✕</button>
            </div>
            <p class="ep6-lc-thesis">${esc(slide.conceptThesis)}</p>
            ${slide.formula ? `<div class="ep6-lc-formula"><code>${esc(slide.formula)}</code></div>` : ""}
            <ul class="ep6-lc-bullets">
              ${(slide.conceptBullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}
            </ul>
          </div>

          <div class="ep6-lc-quotes-box" id="ep6LiveVerbatimPanel" ${studioState.panels.verbatim ? "" : "hidden"}>
            <div class="ep6-sec-head-inline">
              <div class="ep6-lc-sec-tag">🎙️ คำพูดอาจารย์ผู้สอนแบบคำต่อคำ (Verbatim Quotation · คลิกเวลาเพื่อซิงก์เสียงช่วงนั้น)</div>
              <button type="button" class="ep6-inline-hide-btn" data-hide-panel="verbatim" title="ซ่อนส่วนคำพูดต้นฉบับและ Logical Flow">ซ่อน ✕</button>
            </div>
            <div class="ep6-lc-quotes-list">
              ${quotes
                .map(
                  (q, idx) => `
                <blockquote class="ep6-quote-item ${idx === activeQuoteIdx ? "is-speaking" : ""}" data-seek-sec="${q.tSec}">
                  <button type="button" class="ep6-quote-time" data-seek-sec="${q.tSec}">▶ ${esc(q.time)}</button>
                  <span class="ep6-quote-text">“${esc(q.text)}”</span>
                </blockquote>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="ep6-lc-flow-bridge" id="ep6LiveBridgePanel" ${studioState.panels.verbatim ? "" : "hidden"}>
            <div class="ep6-lc-sec-tag">🧭 การเชื่อมโยงตาม Logical Flow (คลิกปุ่มเพื่อข้ามไปยังสไลด์ก่อนหน้า / ถัดไป)</div>
            <div class="ep6-bridge-grid">
              ${prevBridgeHtml}
              ${nextBridgeHtml}
            </div>
          </div>
        `;

        liveCard.querySelectorAll("[data-seek-sec]").forEach((el) => {
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const target = Number(el.getAttribute("data-seek-sec")) || slide.startSec;
            seekToSecond(target, { syncDrive: true, autoPlay: true });
          });
        });

        liveCard.querySelectorAll("[data-jump-slide]").forEach((btn) => {
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const targetId = Number(btn.getAttribute("data-jump-slide"));
            if (targetId) {
              jumpToSlide(targetId, {
                syncDrive: true,
                autoPlay: studioState.isPlaying
              });
            }
          });
        });

        liveCard.querySelectorAll("[data-hide-panel]").forEach((btn) => {
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const key = btn.getAttribute("data-hide-panel");
            if (key && key in studioState.panels) {
              studioState.panels[key] = false;
              applyWorkspaceLayout();
            }
          });
        });
      }

      // 7. Highlight active card in the 43-Slide Atlas below (STRICTLY NO scrollIntoView!)
      if (slideChanged || optsUpdate?.forceCard) {
        root.querySelectorAll(".ep6-flow-slide-card").forEach((card) => {
          const cid = Number(card.getAttribute("data-slide-card"));
          card.classList.toggle("is-active-playing", cid === slide.id);
        });
      }
    }

    function seekToSecond(sec, seekOpts) {
      const o = seekOpts || {};
      const target = Math.max(MIN_SEC, Math.min(MAX_SEC - 1, Number(sec) || MIN_SEC));
      updateLiveUI(target, { forceCard: true });
      if (o.autoPlay) {
        startClock(false);
      }
      if (o.syncDrive !== false) {
        syncDriveIframeTo(target, Boolean(o.autoPlay || studioState.isPlaying), Boolean(o.immediate));
      }
    }

    function jumpToSlide(slideId, jumpOpts) {
      const sl = getSlideById(Number(slideId) || 1);
      if (!sl) return;
      const seg = (DATA.timelineSegments || []).find((sg) => sg.slideId === sl.id);
      const exactSec = seg ? Math.max(MIN_SEC, seg.startSec + 0.4) : sl.startSec + 0.4;
      seekToSecond(exactSec, jumpOpts);
    }

    function skipBySeconds(deltaSec) {
      showSkipFlash(deltaSec);
      const target = Math.max(MIN_SEC, Math.min(MAX_SEC - 1, studioState.currentSec + deltaSec));
      seekToSecond(target, {
        syncDrive: true,
        autoPlay: studioState.isPlaying,
        immediate: false
      });
    }

    // Floating Picture-in-Picture (PiP) State Controller
    function applyPipMode(enablePip) {
      const slot = root.querySelector("#ep6VideoSlot");
      const dock = root.querySelector("#ep6VideoDock");
      const ph = root.querySelector("#ep6PipPlaceholder");
      const pinBtn = root.querySelector("#ep6PinPipBtn");
      const restorePill = root.querySelector("#ep6PipRestorePill");
      if (!slot || !dock) return;

      if (enablePip && studioState.panels.video) {
        if (!studioState.isPipActive) {
          const h = slot.offsetHeight;
          if (h > 120) {
            instance.dockedMeasuredHeight = h;
            slot.style.minHeight = `${h}px`;
          }
          studioState.isPipActive = true;
        }
        dock.classList.add("is-pip-floating");
        dock.classList.toggle("is-pip-minimized", studioState.isPipMinimized);
        if (ph) ph.hidden = false;
        if (restorePill) restorePill.hidden = true;
      } else {
        studioState.isPipActive = false;
        studioState.isPipMinimized = false;
        dock.classList.remove("is-pip-floating", "is-pip-minimized");
        slot.style.minHeight = "";
        if (ph) ph.hidden = true;
      }

      if (pinBtn) {
        pinBtn.classList.toggle("is-active", studioState.isPipActive);
        pinBtn.textContent = studioState.isPipActive ? "⧉ กำลังลอย (PiP)" : "⧉ PiP";
      }
      updateLiveUI(studioState.currentSec);
    }

    function evaluateScrollPiP() {
      if (!root.isConnected || root.offsetParent === null || !studioState.panels.video) {
        if (studioState.isPipActive) applyPipMode(false);
        return;
      }
      const slot = root.querySelector("#ep6VideoSlot");
      const theaterEl = root.querySelector("#ep6TheaterGrid");
      const restorePill = root.querySelector("#ep6PipRestorePill");
      if (!slot || !theaterEl) return;

      const slotRect = slot.getBoundingClientRect();
      const theaterRect = theaterEl.getBoundingClientRect();
      const enteredAtlasZone = slotRect.bottom < 40 && theaterRect.bottom < 260;
      const backInTheaterZone = slotRect.bottom > 120 || theaterRect.bottom > 340;

      if (backInTheaterZone) {
        studioState.pipDismissedWhileScrolled = false;
        if (restorePill) restorePill.hidden = true;
        if (!studioState.manualPipPinned && studioState.isPipActive) {
          applyPipMode(false);
        }
        return;
      }

      if (enteredAtlasZone) {
        if (studioState.pipDismissedWhileScrolled && !studioState.manualPipPinned) {
          if (studioState.isPipActive) applyPipMode(false);
          if (restorePill) restorePill.hidden = false;
        } else {
          if (!studioState.isPipActive) applyPipMode(true);
        }
      } else if (studioState.manualPipPinned && !studioState.isPipActive) {
        applyPipMode(true);
      }
    }

    function renderAtlasBody() {
      const body = root.querySelector("#ep6AtlasBody");
      const filterRow = root.querySelector("#ep6AtlasFiltersRow");
      if (!body) return;

      if (studioState.atlasView === "matrix") {
        if (filterRow) filterRow.hidden = true;
        body.innerHTML = `
          <div class="ep6-matrix-card">
            <div class="ep6-matrix-head">
              <h4>ตารางสังเคราะห์ตัวชี้วัดและสูตรสำคัญทั้งคาบ (Rapid Review Matrix · สำหรับทบทวนสอบ 15% และออกภาคสนาม)</h4>
              <p>สรุปเปรียบเทียบโครงสร้างตัวตั้ง–ตัวหาร ประเภทตัวชี้วัด และจุดเน้นที่อาจารย์ย้ำในการบรรยาย</p>
            </div>
            <div class="ep6-matrix-table-wrap">
              <table class="ep6-matrix-table">
                <thead>
                  <tr>
                    <th>ตัวชี้วัด (Indicator)</th>
                    <th>สูตร / โครงสร้างเศษส่วน</th>
                    <th>ประเภทเชิงคณิตศาสตร์</th>
                    <th>แก่นแนวคิดและข้อควรระวังในการแปลผล</th>
                  </tr>
                </thead>
                <tbody>
                  ${(DATA.rapidReview || [])
                    .map(
                      (r) => `
                    <tr>
                      <td><strong>${esc(r.metric)}</strong></td>
                      <td><code>${esc(r.formula)}</code></td>
                      <td><span class="ep6-type-chip">${esc(r.type)}</span></td>
                      <td>${esc(r.keyPoint)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        `;
        return;
      }

      if (filterRow) filterRow.hidden = false;
      const q = studioState.searchQuery.trim().toLowerCase();
      const stFilter = Number(studioState.stageFilter) || 0;

      const stagesToRender = DATA.stages.filter((st) => !stFilter || st.id === stFilter);
      const htmlParts = [];

      stagesToRender.forEach((st) => {
        const stageSlides = st.slideIds
          .map((id) => getSlideById(id))
          .filter((sl) => {
            if (!q) return true;
            const hay = [
              sl.title,
              sl.enTitle,
              sl.formula,
              sl.conceptThesis,
              ...(sl.conceptBullets || []),
              ...(sl.verbatimQuotes || []).map((x) => x.text),
              sl.logicalFlow?.fromPrev,
              sl.logicalFlow?.toNext
            ]
              .join(" ")
              .toLowerCase();
            return hay.includes(q);
          });

        if (!stageSlides.length) return;

        htmlParts.push(`
          <section class="ep6-stage-section stage-${st.id}">
            <div class="ep6-stage-banner">
              <div class="ep6-sb-top">
                <span class="ep6-sb-pill">${esc(st.code)} · ${esc(st.rangeLabel)}</span>
                <button type="button" class="btn sm" data-atlas-seek="${st.startSec}">▶ เล่นตั้งแต่องก์นี้ (${fmtTime(st.startSec)})</button>
              </div>
              <h4 class="ep6-sb-title">${esc(st.title)} <span class="ep6-sb-en">(${esc(st.enTitle)})</span></h4>
              <p class="ep6-sb-question"><strong>คำถามนำขององก์:</strong> ${esc(st.guidingQuestion)}</p>
              <p class="ep6-sb-thesis"><strong>แก่นความคิดรวบยอด:</strong> ${esc(st.coreThesis)}</p>
            </div>

            <div class="ep6-slides-flow-list">
              ${stageSlides
                .map((sl) => {
                  const prevSl = sl.id > 1 ? getSlideById(sl.id - 1) : null;
                  const nextSl = sl.id < DATA.slides.length ? getSlideById(sl.id + 1) : null;
                  return `
                <article class="ep6-flow-slide-card ${sl.id === studioState.activeSlideId ? "is-active-playing" : ""}" id="ep6AtlasSlideCard-${sl.id}" data-slide-card="${sl.id}">
                  <div class="ep6-fsc-left">
                    <div class="ep6-fsc-meta">
                      <span class="ep6-fsc-num">Slide ${sl.id} / 43 <small>(หน้า ${sl.deckSlideNo})</small></span>
                      <button type="button" class="ep6-play-chip" data-atlas-seek="${sl.startSec}">▶ ${esc(sl.timeLabel)}</button>
                    </div>
                    <div class="ep6-fsc-thumb" data-zoom-slide="${sl.id}" title="คลิกเพื่อขยายภาพสไลด์ขนาดเต็ม">
                      <img src="${esc(getSlideImg(sl))}" alt="Slide ${sl.id}: ${esc(sl.title)}" loading="lazy">
                      <span class="ep6-thumb-zoom-hint">🔍 ขยายสไลด์</span>
                    </div>
                  </div>

                  <div class="ep6-fsc-mid">
                    <div class="ep6-fsc-col-label">① Verbatim Quotation (คำพูดผู้สอนคำต่อคำ)</div>
                    <h5 class="ep6-fsc-title">${esc(sl.title)}</h5>
                    <div class="ep6-fsc-quotes">
                      ${(sl.verbatimQuotes || [])
                        .map(
                          (vq) => `
                        <div class="ep6-fsc-qitem">
                          <button type="button" class="ep6-qtime-mini" data-atlas-seek="${vq.tSec}">▶ ${esc(vq.time)}</button>
                          <span>“${esc(vq.text)}”</span>
                        </div>
                      `
                        )
                        .join("")}
                    </div>
                  </div>

                  <div class="ep6-fsc-right">
                    <div class="ep6-fsc-col-label is-concept">② Then Conceptualized ตาม Logical Flow</div>
                    <p class="ep6-fsc-thesis">${esc(sl.conceptThesis)}</p>
                    ${sl.formula ? `<div class="ep6-fsc-formula"><code>${esc(sl.formula)}</code></div>` : ""}
                    <ul class="ep6-fsc-bullets">
                      ${(sl.conceptBullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}
                    </ul>
                    <div class="ep6-fsc-bridge">
                      <p class="ep6-fsc-bridge-txt"><strong>Logical Flow →</strong> ${esc(sl.logicalFlow?.toNext || "")}</p>
                      <div class="ep6-fsc-bridge-btns">
                        ${prevSl ? `<button type="button" class="ep6-fsc-jump-btn" data-atlas-jump-slide="${prevSl.id}">← ไป Slide ${prevSl.id}</button>` : ""}
                        ${nextSl ? `<button type="button" class="ep6-fsc-jump-btn is-next" data-atlas-jump-slide="${nextSl.id}">ไป Slide ${nextSl.id} →</button>` : ""}
                      </div>
                    </div>
                  </div>
                </article>
              `;
                })
                .join("")}
            </div>
          </section>
        `);
      });

      if (!htmlParts.length) {
        body.innerHTML = `<div class="ep6-empty-search">ไม่พบสไลด์ที่ตรงกับคำค้นหา “${esc(studioState.searchQuery)}” — ลองล้างคำค้นหาหรือเลือกแสดงทุกองก์</div>`;
        return;
      }

      body.innerHTML = htmlParts.join("");

      body.querySelectorAll("[data-atlas-seek]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const sec = Number(btn.getAttribute("data-atlas-seek")) || MIN_SEC;
          studioState.pipDismissedWhileScrolled = false;
          seekToSecond(sec, { syncDrive: true, autoPlay: true, immediate: true });
          evaluateScrollPiP();
        });
      });

      body.querySelectorAll("[data-atlas-jump-slide]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const targetId = Number(btn.getAttribute("data-atlas-jump-slide"));
          const targetSl = getSlideById(targetId);
          if (!targetSl) return;
          jumpToSlide(targetSl.id, {
            syncDrive: true,
            autoPlay: studioState.isPlaying
          });
          const targetCard = root.querySelector(`#ep6AtlasSlideCard-${targetSl.id}`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      });

      body.querySelectorAll("[data-zoom-slide]").forEach((el) => {
        el.addEventListener("click", () => {
          const sl = getSlideById(Number(el.getAttribute("data-zoom-slide")));
          openSlideLightbox(
            getSlideImg(sl),
            `Slide ${sl.id}/43 (หน้า ${sl.deckSlideNo} · ${sl.timeLabel}) — ${sl.title}`
          );
        });
      });
    }

    // Wire Faculty Drive Drawer
    if (facultyMode) {
      const toggleBtn = root.querySelector("#ep6ToggleFacultyDriveBtn");
      const bar = root.querySelector("#ep6FacultyDriveBar");
      const inp = root.querySelector("#ep6FacultyDriveInput");
      const saveBtn = root.querySelector("#ep6SaveDriveIdBtn");
      const resetBtn = root.querySelector("#ep6ResetDriveIdBtn");

      toggleBtn?.addEventListener("click", () => {
        if (bar) bar.hidden = !bar.hidden;
      });
      saveBtn?.addEventListener("click", () => {
        const parsed = extractDriveFileId(inp?.value || "");
        if (!parsed) {
          window.alert("กรุณาวางลิงก์ Google Drive หรือ File ID ที่ถูกต้อง");
          return;
        }
        currentDriveId = parsed;
        try {
          localStorage.setItem(STORAGE_DRIVE_KEY, parsed);
        } catch (_) {}
        if (inp) inp.value = parsed;
        syncDriveIframeTo(studioState.currentSec, false, true);
      });
      resetBtn?.addEventListener("click", () => {
        currentDriveId = DATA.meta.driveFileId || "";
        try {
          localStorage.removeItem(STORAGE_DRIVE_KEY);
        } catch (_) {}
        if (inp) inp.value = currentDriveId;
        syncDriveIframeTo(studioState.currentSec, false, true);
      });
    }

    // Wire Layout Mode & Hide/Unhide Section Controls
    root.querySelectorAll("[data-layout-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        studioState.layoutMode = btn.getAttribute("data-layout-mode") || "cinema";
        applyWorkspaceLayout();
      });
    });

    root.querySelectorAll("[data-toggle-panel]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-toggle-panel");
        if (key && key in studioState.panels) {
          studioState.panels[key] = !studioState.panels[key];
          applyWorkspaceLayout();
        }
      });
    });

    root.querySelectorAll("[data-hide-panel]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-hide-panel");
        if (key && key in studioState.panels) {
          studioState.panels[key] = false;
          applyWorkspaceLayout();
        }
      });
    });

    root.querySelector("#ep6ResetWorkspaceBtn")?.addEventListener("click", () => {
      studioState.layoutMode = "cinema";
      studioState.panels = { ...DEFAULT_PANELS };
      applyWorkspaceLayout();
    });

    root.querySelectorAll("[data-imgq]").forEach((btn) => {
      btn.addEventListener("click", () => {
        studioState.imgQuality = btn.getAttribute("data-imgq") === "yt" ? "yt" : "hd";
        root.querySelectorAll("[data-imgq]").forEach((b) =>
          b.classList.toggle("is-active", b.getAttribute("data-imgq") === studioState.imgQuality)
        );
        updateLiveUI(studioState.currentSec, { forceCard: true });
        renderAtlasBody();
        savePersistedPrefs();
      });
    });

    // Wire Stage Jump buttons
    root.querySelectorAll("[data-stage-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const st = getStageById(Number(btn.getAttribute("data-stage-jump")));
        if (st && st.slideIds && st.slideIds.length) {
          jumpToSlide(st.slideIds[0], { syncDrive: true, autoPlay: studioState.isPlaying, immediate: true });
        }
      });
    });

    // Wire Slide Zoom
    const zoomHandler = () => {
      const sl = getSlideById(studioState.activeSlideId);
      openSlideLightbox(
        getSlideImg(sl),
        `Slide ${sl.id}/43 (หน้า ${sl.deckSlideNo} · ${sl.timeLabel}) — ${sl.title}`
      );
    };
    root.querySelector("#ep6ZoomCurrentSlideBtn")?.addEventListener("click", zoomHandler);
    root.querySelector("#ep6SyncSlideImgWrap")?.addEventListener("click", zoomHandler);

    // Wire Play/Pause, -15s, +15s, Prev/Next Slide, CC, Speed, Fullscreen, PiP
    const togglePlayPause = () => {
      if (studioState.isPlaying) {
        stopClock();
      } else {
        startClock(true);
      }
    };
    root.querySelector("#ep6PlayPauseBtn")?.addEventListener("click", togglePlayPause);
    root.querySelector("#ep6MainPlayBtn")?.addEventListener("click", togglePlayPause);

    root.querySelector("#ep6Rew15Btn")?.addEventListener("click", () => skipBySeconds(-15));
    root.querySelector("#ep6ScrubRew15Btn")?.addEventListener("click", () => skipBySeconds(-15));
    root.querySelector("#ep6Fwd15Btn")?.addEventListener("click", () => skipBySeconds(15));
    root.querySelector("#ep6ScrubFwd15Btn")?.addEventListener("click", () => skipBySeconds(15));

    const goPrevSlide = () => {
      const prevId = Math.max(1, studioState.activeSlideId - 1);
      jumpToSlide(prevId, {
        syncDrive: true,
        autoPlay: studioState.isPlaying,
        immediate: false
      });
    };
    const goNextSlide = () => {
      const nextId = Math.min(DATA.slides.length, studioState.activeSlideId + 1);
      jumpToSlide(nextId, {
        syncDrive: true,
        autoPlay: studioState.isPlaying,
        immediate: false
      });
    };
    root.querySelector("#ep6PrevSlideBtn")?.addEventListener("click", goPrevSlide);
    root.querySelector("#ep6NextSlideBtn")?.addEventListener("click", goNextSlide);
    root.querySelector("#ep6PipPrevSlideBtn")?.addEventListener("click", goPrevSlide);
    root.querySelector("#ep6PipNextSlideBtn")?.addEventListener("click", goNextSlide);

    root.querySelector("#ep6ForceSyncDriveBtn")?.addEventListener("click", () => {
      syncDriveIframeTo(studioState.currentSec, true, true);
      if (!studioState.isPlaying) startClock(false);
    });

    root.querySelector("#ep6CcToggleBtn")?.addEventListener("click", () => {
      studioState.ccEnabled = !studioState.ccEnabled;
      syncTransportButtons();
    });

    root.querySelector("#ep6CcSizeBtn")?.addEventListener("click", () => {
      studioState.ccLarge = !studioState.ccLarge;
      syncTransportButtons();
    });

    root.querySelector("#ep6SpeedSelect")?.addEventListener("change", (ev) => {
      const v = Number(ev.target.value) || 1;
      studioState.playbackSpeed = v;
      syncTransportButtons();
    });

    root.querySelector("#ep6FullscreenBtn")?.addEventListener("click", () => {
      const dock = root.querySelector("#ep6VideoDock");
      if (!dock) return;
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        dock.requestFullscreen?.();
      }
    });

    // PiP Controls
    root.querySelector("#ep6PinPipBtn")?.addEventListener("click", () => {
      if (studioState.isPipActive) {
        studioState.manualPipPinned = false;
        studioState.pipDismissedWhileScrolled = true;
        applyPipMode(false);
        evaluateScrollPiP();
      } else {
        studioState.manualPipPinned = true;
        studioState.pipDismissedWhileScrolled = false;
        applyPipMode(true);
      }
    });

    root.querySelector("#ep6ReturnFromPipBtn")?.addEventListener("click", () => {
      studioState.manualPipPinned = false;
      applyPipMode(false);
    });

    root.querySelector("#ep6PipMinBtn")?.addEventListener("click", () => {
      studioState.isPipMinimized = !studioState.isPipMinimized;
      const dock = root.querySelector("#ep6VideoDock");
      const minBtn = root.querySelector("#ep6PipMinBtn");
      if (dock) dock.classList.toggle("is-pip-minimized", studioState.isPipMinimized);
      if (minBtn) minBtn.textContent = studioState.isPipMinimized ? "▢ ขยาย" : "—";
    });

    root.querySelector("#ep6PipTopBtn")?.addEventListener("click", () => {
      studioState.manualPipPinned = false;
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    root.querySelector("#ep6PipCloseBtn")?.addEventListener("click", () => {
      studioState.manualPipPinned = false;
      studioState.pipDismissedWhileScrolled = true;
      applyPipMode(false);
      evaluateScrollPiP();
    });

    root.querySelector("#ep6PipRestorePill")?.addEventListener("click", () => {
      studioState.pipDismissedWhileScrolled = false;
      applyPipMode(true);
    });

    // Explicit click-only button to view active slide in the 43-slide Atlas below
    root.querySelector("#ep6JumpToActiveCardBtn")?.addEventListener("click", () => {
      if (!studioState.panels.atlas) {
        studioState.panels.atlas = true;
        applyWorkspaceLayout();
      }
      if (studioState.atlasView !== "flow") {
        studioState.atlasView = "flow";
        root.querySelectorAll("[data-aview]").forEach((b) =>
          b.classList.toggle("is-active", b.getAttribute("data-aview") === "flow")
        );
        renderAtlasBody();
      }
      const card = root.querySelector(`#ep6AtlasSlideCard-${studioState.activeSlideId}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    // Wire Scrubber Drag/Click + Hover Tooltip — ZERO page scroll!
    const track = root.querySelector("#ep6TimelineTrack");
    const tooltip = root.querySelector("#ep6TrackTooltip");
    if (track) {
      const secFromPointer = (clientX) => {
        const rect = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
        return MIN_SEC + ratio * (MAX_SEC - MIN_SEC);
      };

      let dragging = false;
      track.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        try {
          track.focus({ preventScroll: true });
        } catch (_) {}
        dragging = true;
        track.setPointerCapture(e.pointerId);
        updateLiveUI(secFromPointer(e.clientX), { forceCard: true });
      });
      track.addEventListener("pointermove", (e) => {
        const hoverSec = secFromPointer(e.clientX);
        if (tooltip) {
          const sl = getSlideById(findSlideAtTime(hoverSec));
          const rect = track.getBoundingClientRect();
          const leftPx = Math.max(60, Math.min(rect.width - 60, e.clientX - rect.left));
          tooltip.style.left = `${leftPx}px`;
          tooltip.textContent = `${fmtTime(hoverSec)} · Slide ${sl.id}: ${sl.title.slice(0, 48)}`;
          tooltip.hidden = false;
        }
        if (dragging) {
          updateLiveUI(hoverSec, { forceCard: true });
        }
      });
      track.addEventListener("pointerup", (e) => {
        if (dragging) {
          dragging = false;
          const targetSec = secFromPointer(e.clientX);
          updateLiveUI(targetSec, { forceCard: true });
          if (studioState.isPlaying) {
            syncDriveIframeTo(targetSec, true, false);
          }
        }
      });
      track.addEventListener("pointerleave", () => {
        if (tooltip) tooltip.hidden = true;
      });
      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          skipBySeconds(15);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          skipBySeconds(-15);
        }
      });
    }

    // Keyboard shortcuts when focus is inside the EP6 Studio
    root.addEventListener("keydown", (e) => {
      const tag = (e.target && e.target.tagName ? e.target.tagName : "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        skipBySeconds(-15);
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        skipBySeconds(15);
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        studioState.ccEnabled = !studioState.ccEnabled;
        syncTransportButtons();
      }
    });

    // Wire Atlas Tabs, Stage Filter & Search
    root.querySelectorAll("[data-aview]").forEach((btn) => {
      btn.addEventListener("click", () => {
        studioState.atlasView = btn.getAttribute("data-aview") || "flow";
        root.querySelectorAll("[data-aview]").forEach((b) =>
          b.classList.toggle("is-active", b.getAttribute("data-aview") === studioState.atlasView)
        );
        renderAtlasBody();
      });
    });

    const stageSel = root.querySelector("#ep6StageFilterSelect");
    if (stageSel) {
      stageSel.addEventListener("change", () => {
        studioState.stageFilter = Number(stageSel.value) || 0;
        renderAtlasBody();
      });
    }

    const searchIn = root.querySelector("#ep6SlideSearchInput");
    if (searchIn) {
      searchIn.addEventListener("input", () => {
        studioState.searchQuery = searchIn.value || "";
        renderAtlasBody();
      });
    }

    // Bind scroll & resize listeners for Floating Picture-in-Picture (PiP)
    const onScrollOrResize = () => evaluateScrollPiP();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    instance.cleanupListeners = () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };

    // Initial render
    renderAtlasBody();
    updateLiveUI(studioState.currentSec, { forceCard: true });
    applyWorkspaceLayout();
    syncTransportButtons();
    requestAnimationFrame(evaluateScrollPiP);
  }

  window.RACM303_EP6_STUDIO = {
    render: renderEp6MorbidityStudio,
    getState: () => studioState,
    destroy: destroyActiveTimers
  };
})();
