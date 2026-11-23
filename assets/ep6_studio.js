/* ==========================================================================
   RACM 303 — EP6: Measures of Morbidity & Mortality Interactive Lecture Studio (v6)
   - Original Unmuted YouTube IFrame Player (Version 1 Direct YouTube Sync + Native Controls)
   - Seamless Auto & Manual Floating Picture-in-Picture (PiP) Without Reloading Video
   - Synchronized 43 Captured Slides + Verbatim Quotations -> Conceptualized Logical Flow
   - Customizable 4-Mode Workspace Layout + Hide/Unhide Toggles for All 7 Sections
   - Zero Unwanted Auto-Scroll + Clickable Logical Flow Slide Jump Buttons
   ========================================================================== */
(function () {
  "use strict";

  const DATA = window.RACM303_EP6_MORBIDITY;
  if (!DATA) return;

  const YT_ID = DATA.meta.youtubeId || "pPAfYlneRQA";
  const MIN_SEC = DATA.meta.startSec || 4;
  const MAX_SEC = DATA.meta.endSec || 3806;
  const STORAGE_UI_PREFS_KEY = "racm303_ep6_ui_prefs_v6";

  let ytApiLoaded = false;
  let ytApiReady = false;
  const ytReadyCallbacks = [];

  function ensureYouTubeIframeAPI(cb) {
    if (window.YT && window.YT.Player) {
      ytApiReady = true;
      cb();
      return;
    }
    ytReadyCallbacks.push(cb);
    if (ytApiLoaded) return;
    ytApiLoaded = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      ytApiReady = true;
      if (typeof prev === "function") {
        try {
          prev();
        } catch (_) {}
      }
      while (ytReadyCallbacks.length) {
        const fn = ytReadyCallbacks.shift();
        try {
          fn();
        } catch (_) {}
      }
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
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
    layoutMode: "cinema", // 'cinema' | 'tri' | 'balanced' | 'stack'
    panels: { ...DEFAULT_PANELS },
    atlasView: "flow", // 'flow' | 'matrix'
    stageFilter: 0,
    searchQuery: "",
    simPlaying: false,
    simSpeed: 1,
    ytError: false,
    ytPlaying: false,
    isPipActive: false,
    isPipMinimized: false,
    pipCorner: "right", // 'right' | 'left'
    manualPipPinned: false,
    pipDismissedWhileScrolled: false
  };

  (function loadPersistedPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_UI_PREFS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (["cinema", "tri", "balanced", "stack"].includes(parsed.layoutMode)) {
          studioState.layoutMode = parsed.layoutMode;
        }
        if (["hd", "yt"].includes(parsed.imgQuality)) {
          studioState.imgQuality = parsed.imgQuality;
        }
        if (["right", "left"].includes(parsed.pipCorner)) {
          studioState.pipCorner = parsed.pipCorner;
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
          pipCorner: studioState.pipCorner,
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
    if (activeInstance.pollTimer) {
      clearInterval(activeInstance.pollTimer);
      activeInstance.pollTimer = null;
    }
    if (activeInstance.simTimer) {
      clearInterval(activeInstance.simTimer);
      activeInstance.simTimer = null;
    }
    if (activeInstance.cleanupListeners) {
      try {
        activeInstance.cleanupListeners();
      } catch (_) {}
      activeInstance.cleanupListeners = null;
    }
    if (activeInstance.ytPlayer && typeof activeInstance.ytPlayer.destroy === "function") {
      try {
        activeInstance.ytPlayer.destroy();
      } catch (_) {}
      activeInstance.ytPlayer = null;
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
    { id: "tri", label: "🎬 วิดีโอ+สไลด์คู่ขนาน (แบบดั้งเดิม)" },
    { id: "balanced", label: "⚖️ 2 คอลัมน์สมดุล (ซ้ายสื่อ · ขวาเนื้อหา)" },
    { id: "stack", label: "📄 เรียงเดี่ยวแนวตั้ง" }
  ];

  function renderEp6MorbidityStudio(container, opts) {
    if (!container) return;
    destroyActiveTimers();
    container.replaceChildren();

    const isCompactEmbed = Boolean(opts && opts.compactHeader);
    const root = document.createElement("section");
    root.className = "ep6-studio-root";
    root.id = "ep6MorbidityStudioRoot";

    const instance = {
      root,
      ytPlayer: null,
      ytReady: false,
      pollTimer: null,
      simTimer: null,
      dockedMeasuredHeight: 0,
      cleanupListeners: null
    };
    activeInstance = instance;

    // 1. Header Banner (Version 1 style)
    const header = document.createElement("div");
    header.className = "ep6-studio-header";
    header.innerHTML = `
      <div class="ep6-head-main">
        <div class="ep6-head-eyebrow">
          <span class="ep6-badge-code">EP6 · สอบ 15%</span>
          <span class="ep6-badge-meta">43 Captured Slides · Verbatim → Conceptualized Logical Flow</span>
          <span class="ep6-badge-meta">⏱ 00:04 – 62:00 · รองรับ PiP</span>
        </div>
        <h3 class="ep6-head-title">Measures of Morbidity &amp; Mortality · การวัดการป่วย การตาย ภาระโรค (DALY) และการปรับมาตรฐานอัตรา</h3>
        <p class="ep6-head-sub">${esc(DATA.meta.recordedInfo)} — เล่นวิดีโอบรรยายพร้อมเสียงครบเต็มรูปแบบ (รองรับโหมดหน้าต่างลอย Picture-in-Picture อัตโนมัติเมื่อเลื่อนอ่านด้านล่าง) ควบคู่กับสไลด์และประเด็นสังเคราะห์ตาม Timeline</p>
      </div>
      <div class="ep6-head-actions">
        <a class="btn sm" href="${esc(DATA.meta.pdfDownloadPath)}" download="EP6_Measures_of_Morbidity_and_Mortality_Slides.pdf">📥 ดาวน์โหลดสไลด์ (.PDF)</a>
        <a class="btn sm" id="ep6ExternalYtLink" href="https://www.youtube.com/watch?v=${esc(YT_ID)}&t=${Math.floor(studioState.currentSec)}s" target="_blank" rel="noopener">▶ เปิดบน YouTube ↗</a>
      </div>
    `;
    if (!isCompactEmbed) {
      root.appendChild(header);
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
            <button type="button" class="ep6-tool-btn ${studioState.imgQuality === "hd" ? "is-active" : ""}" data-imgq="hd" title="สไลด์คมชัดสูงสำหรับอ่านสูตรและตาราง">✨ สไลด์คมชัด HD</button>
            <button type="button" class="ep6-tool-btn ${studioState.imgQuality === "yt" ? "is-active" : ""}" data-imgq="yt" title="ภาพ Capture ต้นฉบับจากวิดีโอ">📸 ภาพจริงจากวิดีโอ</button>
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
        <span class="ep6-ribbon-label">Logical Flow 5 องก์ต่อเนื่อง (คลิกเพื่อข้ามไปยังช่วงเวลาของแต่ละองก์):</span>
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

    // 4. Synchronized Theater (Original Version 1 Unmuted YouTube Player + Floating PiP!)
    const theater = document.createElement("div");
    theater.className = `ep6-theater layout-${studioState.layoutMode}`;
    theater.id = "ep6TheaterGrid";
    theater.innerHTML = `
      <div class="ep6-media-col" id="ep6MediaCol">
        <div class="ep6-player-stage" id="ep6PlayerStage">
          <!-- VERSION 1 YOUTUBE PLAYER WITH SEAMLESS FLOATING PICTURE-IN-PICTURE (PiP) -->
          <div class="ep6-video-slot" id="ep6VideoSlot">
            <div class="ep6-pip-placeholder" id="ep6PipPlaceholder" hidden>
              <div class="ep6-pip-ph-inner">
                <span class="ep6-pip-ph-icon">⧉</span>
                <div>
                  <strong>วิดีโอกำลังเล่นแบบหน้าต่างลอย (Picture-in-Picture)</strong>
                  <p>เลื่อนอ่านแผนผังตรรกะทั้ง 43 สไลด์ด้านล่างควบคู่กับการดูวิดีโอและฟังเสียงบรรยายได้ต่อเนื่อง</p>
                </div>
                <button type="button" class="btn sm" id="ep6ReturnFromPipBtn">ดึงกลับช่องหลัก</button>
              </div>
            </div>

            <div class="ep6-yt-box ep6-video-dock ${studioState.pipCorner === "left" ? "is-pip-left" : ""}" id="ep6VideoDock">
              <div class="ep6-vdock-head">
                <div class="ep6-vdock-title-wrap">
                  <span class="ep6-live-dot" id="ep6DockDot"></span>
                  <span class="ep6-slide-pill" id="ep6DockHeaderLabel">🎥 วิดีโอบรรยายสด (Synced Timeline)</span>
                </div>
                <div class="ep6-vdock-actions">
                  <button type="button" class="ep6-dock-icon-btn" id="ep6PinPipBtn" title="เปิด/ปิด โหมดหน้าต่างลอย (Picture-in-Picture)">⧉ PiP</button>
                  <a class="ep6-dock-icon-btn ep6-dock-only" id="ep6MiniYtLink" href="https://www.youtube.com/watch?v=${esc(YT_ID)}&t=${Math.floor(studioState.currentSec)}s" target="_blank" rel="noopener" style="text-decoration:none">YouTube ↗</a>
                  <button type="button" class="ep6-dock-icon-btn ep6-dock-only" data-hide-panel="video" title="ซ่อนส่วนวิดีโอ">ซ่อน</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipSideBtn" title="สลับตำแหน่งมุมซ้าย / ขวา">⇄ ซ้าย/ขวา</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipMinBtn" title="ย่อ/ขยาย หน้าต่าง PiP">—</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipTopBtn" title="เลื่อนกลับขึ้นด้านบนสุด">⬆ บนสุด</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipCloseBtn" title="ดึงกลับช่องหลัก / ปิด PiP">✕</button>
                </div>
              </div>

              <!-- Pure Original Version 1 YouTube IFrame Player (100% Native Audio & Controls, Zero Shields!) -->
              <div class="ep6-yt-aspect" id="ep6YtAspect">
                <iframe
                  id="ep6YtIframeEl"
                  src="https://www.youtube.com/embed/${esc(YT_ID)}?enablejsapi=1&amp;start=${Math.floor(studioState.currentSec || 4)}&amp;rel=0&amp;modestbranding=1&amp;playsinline=1"
                  title="Measures of Morbidity &amp; Mortality — RACM 303 Epidemiology"
                  referrerpolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
              </div>

              <!-- Shown ONLY when PiP is minimized to a compact audio strip so lecture voice continues seamlessly -->
              <div class="ep6-pip-mini-bar" id="ep6PipMiniBar" hidden>
                <button type="button" class="ep6-dock-icon-btn" id="ep6MiniPlayBtn">▶ เล่น / หยุด</button>
                <button type="button" class="ep6-dock-icon-btn" id="ep6MiniPrevBtn" title="สไลด์ก่อนหน้า">⏮</button>
                <button type="button" class="ep6-dock-icon-btn" id="ep6MiniNextBtn" title="สไลด์ถัดไป">⏭</button>
                <span class="ep6-pip-mini-time" id="ep6MiniTimeTxt">00:04 / 62:00</span>
              </div>

              <div class="ep6-yt-fallback" id="ep6YtFallbackBanner" hidden>
                <span>โหมดออฟไลน์หรือเครือข่ายบล็อก YouTube Embed — คุณยังสามารถกดปุ่ม <strong>“⏱ จำลองเลื่อนเวลา”</strong> ด้านล่างเพื่อเลื่อนดูสไลด์และประเด็น Conceptualized ตามเวลาจริง หรือ</span>
                <a id="ep6FallbackYtBtn" href="https://www.youtube.com/watch?v=${esc(YT_ID)}&t=4s" target="_blank" rel="noopener">เปิดดูวิดีโอบน YouTube โดยตรง ↗</a>
              </div>
            </div>
          </div>

          <!-- SYNCHRONIZED CAPTURED SLIDE PANEL -->
          <div class="ep6-sync-slide-box" id="ep6SyncSlideBox">
            <div class="ep6-slide-frame-head">
              <span id="ep6SyncSlideBadge" class="ep6-slide-pill">Slide 1 / 43</span>
              <div class="ep6-slide-head-btns">
                <button type="button" class="ep6-zoom-btn" id="ep6ZoomCurrentSlideBtn">🔍 ขยายสไลด์เต็มจอ</button>
                <button type="button" class="ep6-inline-hide-btn" data-hide-panel="slide" title="ซ่อนกรอบสไลด์">ซ่อน ✕</button>
              </div>
            </div>
            <div class="ep6-slide-img-wrap" id="ep6SyncSlideImgWrap" title="คลิกเพื่อขยายภาพสไลด์เต็มจอ">
              <img id="ep6SyncSlideImg" src="${esc(getSlideImg(DATA.slides[0]))}" alt="Captured lecture slide">
            </div>
          </div>
        </div>

        <!-- Custom Interactive Timeline Scrubber with 5-Stage Color Segments & Slide Ticks -->
        <div class="ep6-scrubber-card" id="ep6ScrubberCard">
          <div class="ep6-scrubber-controls">
            <div class="ep6-transport-btns">
              <button type="button" class="ep6-ctrl-btn" id="ep6PrevSlideBtn" title="สไลด์ก่อนหน้า">⏮ สไลด์ก่อน</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6Rew15Btn" title="ถอยหลัง 15 วินาที">↺ -15 วิ</button>
              <button type="button" class="ep6-ctrl-btn is-primary" id="ep6PlayPauseBtn">▶ เล่น / หยุด</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6Fwd15Btn" title="เดินหน้า 15 วินาที">+15 วิ ↻</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6NextSlideBtn" title="สไลด์ถัดไป">สไลด์ถัดไป ⏭</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6SimToggleBtn" title="เลื่อน Timeline อัตโนมัติแม้ไม่ได้เล่น YouTube">⏱ จำลองเลื่อนเวลา (1x)</button>
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

    // Floating Restore Pill when PiP was manually closed while scrolled down
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

      const thesisBox = root.querySelector("#ep6LiveThesisPanel");
      const quotesBox = root.querySelector("#ep6LiveVerbatimPanel");
      const bridgeBox = root.querySelector("#ep6LiveBridgePanel");
      if (thesisBox) thesisBox.hidden = !p.concept;
      if (quotesBox) quotesBox.hidden = !p.verbatim;
      if (bridgeBox) bridgeBox.hidden = !p.verbatim;

      const cls = [`ep6-theater`, `layout-${studioState.layoutMode}`];
      if (!anyMediaShown || !anyConceptShown) cls.push("is-single-col");
      if (p.video && !p.slide) cls.push("only-video");
      if (!p.video && p.slide) cls.push("only-slide");
      theater.className = cls.join(" ");

      root.querySelectorAll("[data-layout-mode]").forEach((btn) => {
        btn.classList.toggle("is-active", btn.getAttribute("data-layout-mode") === studioState.layoutMode);
      });

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

    // Core UI update — NEVER triggers unwanted page scroll!
    function updateLiveUI(sec, optsUpdate) {
      const clamped = Math.max(MIN_SEC, Math.min(MAX_SEC, Number(sec) || MIN_SEC));
      studioState.currentSec = clamped;
      const slideId = findSlideAtTime(clamped);
      const slide = getSlideById(slideId);
      const stage = getStageById(slide.stageId);
      const slideChanged = studioState.activeSlideId !== slide.id;
      studioState.activeSlideId = slide.id;
      studioState.activeStageId = stage.id;

      // Update Scrubber & Time Readout
      const pct = ((clamped - MIN_SEC) / (MAX_SEC - MIN_SEC)) * 100;
      const progEl = root.querySelector("#ep6TrackProgress");
      const headEl = root.querySelector("#ep6TrackPlayhead");
      const curTxt = root.querySelector("#ep6CurTimeTxt");
      const miniTimeTxt = root.querySelector("#ep6MiniTimeTxt");
      const trackEl = root.querySelector("#ep6TimelineTrack");
      const fmt = fmtTime(clamped);

      if (progEl) progEl.style.width = `${pct.toFixed(2)}%`;
      if (headEl) headEl.style.left = `${pct.toFixed(2)}%`;
      if (curTxt) curTxt.textContent = fmt;
      if (miniTimeTxt) miniTimeTxt.textContent = `Slide ${slide.id}/43 · ${fmt}`;
      if (trackEl) trackEl.setAttribute("aria-valuenow", String(Math.floor(clamped)));

      // Update YouTube direct timestamp links
      const ytTimestampUrl = `https://www.youtube.com/watch?v=${YT_ID}&t=${Math.floor(clamped)}s`;
      const extLink = root.querySelector("#ep6ExternalYtLink");
      const miniLink = root.querySelector("#ep6MiniYtLink");
      const fbLink = root.querySelector("#ep6FallbackYtBtn");
      if (extLink) extLink.href = ytTimestampUrl;
      if (miniLink) miniLink.href = ytTimestampUrl;
      if (fbLink) fbLink.href = ytTimestampUrl;

      // Update Dock Header Label (Pure Slide number & time in PiP — zero Conceptualized inside player!)
      const dockLabel = root.querySelector("#ep6DockHeaderLabel");
      if (dockLabel) {
        dockLabel.textContent = studioState.isPipActive
          ? `🎥 PiP · Slide ${slide.id}/43 (${fmt})`
          : `🎥 วิดีโอบรรยายสด · Slide ${slide.id}/43`;
      }

      // Highlight active Stage in Stepper & Legend
      root.querySelectorAll("[data-stage-jump]").forEach((btn) => {
        const sid = Number(btn.getAttribute("data-stage-jump"));
        btn.classList.toggle("is-active", sid === stage.id);
      });

      // Update Synchronized Slide Image
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
        syncBadge.textContent = `Slide ${slide.id} / 43 · หน้าสไลด์ ${slide.deckSlideNo} (${studioState.imgQuality === "hd" ? "คมชัด HD" : "ภาพจากวิดีโอ"})`;
      }

      // Update Conceptualized & Verbatim Column
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
            <div class="ep6-lc-kicker">ประเด็น Conceptualized ขณะกำลังบรรยาย (Slide ${slide.id}/43 · หน้า ${slide.deckSlideNo})</div>
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
              <div class="ep6-lc-sec-tag">🎙️ คำพูดอาจารย์ผู้สอนแบบคำต่อคำ (Verbatim Quotation · คลิกเวลาเพื่อฟังเสียงช่วงนั้น)</div>
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
            <div class="ep6-lc-sec-tag">🧭 การเชื่อมโยงตาม Logical Flow (คลิกปุ่มเพื่อไปยังสไลด์ก่อนหน้า / ถัดไป)</div>
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
            seekToSecond(target, true);
          });
        });

        liveCard.querySelectorAll("[data-jump-slide]").forEach((btn) => {
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const targetId = Number(btn.getAttribute("data-jump-slide"));
            if (targetId) {
              jumpToSlide(targetId, studioState.ytPlaying || studioState.simPlaying);
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

      // Highlight active card in the 43-Slide Atlas below (NEVER auto-scrolls page!)
      if (slideChanged || optsUpdate?.forceCard) {
        root.querySelectorAll(".ep6-flow-slide-card").forEach((card) => {
          const cid = Number(card.getAttribute("data-slide-card"));
          card.classList.toggle("is-active-playing", cid === slide.id);
        });
      }
    }

    function ensurePlayerUnmuted() {
      if (!instance.ytReady || !instance.ytPlayer) return;
      try {
        if (typeof instance.ytPlayer.isMuted === "function" && instance.ytPlayer.isMuted()) {
          instance.ytPlayer.unMute();
        }
        if (typeof instance.ytPlayer.getVolume === "function" && instance.ytPlayer.getVolume() === 0) {
          instance.ytPlayer.setVolume(100);
        }
      } catch (_) {}
    }

    function seekToSecond(sec, autoPlay) {
      const target = Math.max(MIN_SEC, Math.min(MAX_SEC - 1, Number(sec) || MIN_SEC));
      updateLiveUI(target, { forceCard: true });
      if (instance.ytReady && instance.ytPlayer && !studioState.ytError && typeof instance.ytPlayer.seekTo === "function") {
        try {
          instance.ytPlayer.seekTo(target, true);
          if (autoPlay && typeof instance.ytPlayer.playVideo === "function") {
            ensurePlayerUnmuted();
            instance.ytPlayer.playVideo();
          }
        } catch (_) {}
      } else if (autoPlay) {
        startSimulatedTimeline();
      }
    }

    function jumpToSlide(slideId, autoPlay) {
      const sl = getSlideById(Number(slideId) || 1);
      if (!sl) return;
      const seg = (DATA.timelineSegments || []).find((sg) => sg.slideId === sl.id);
      const exactSec = seg ? Math.max(MIN_SEC, seg.startSec + 0.4) : sl.startSec + 0.4;
      seekToSecond(exactSec, Boolean(autoPlay));
    }

    function stopSimulatedTimeline() {
      studioState.simPlaying = false;
      if (instance.simTimer) {
        clearInterval(instance.simTimer);
        instance.simTimer = null;
      }
      syncTransportButtons();
    }

    function startSimulatedTimeline() {
      stopSimulatedTimeline();
      studioState.simPlaying = true;
      instance.simTimer = setInterval(() => {
        const next = studioState.currentSec + 1 * studioState.simSpeed;
        if (next >= MAX_SEC - 1) {
          updateLiveUI(MAX_SEC - 1);
          stopSimulatedTimeline();
          return;
        }
        updateLiveUI(next);
      }, 1000);
      syncTransportButtons();
    }

    function syncTransportButtons() {
      const playBtn = root.querySelector("#ep6PlayPauseBtn");
      const miniPlayBtn = root.querySelector("#ep6MiniPlayBtn");
      const simBtn = root.querySelector("#ep6SimToggleBtn");
      const dot1 = root.querySelector("#ep6LiveDot");
      const dot2 = root.querySelector("#ep6DockDot");
      const isPlayingAny = studioState.ytPlaying || studioState.simPlaying;
      if (playBtn) {
        playBtn.textContent = isPlayingAny ? "⏸ หยุดชั่วคราว" : "▶ เล่นวิดีโอ";
      }
      if (miniPlayBtn) {
        miniPlayBtn.textContent = isPlayingAny ? "⏸ หยุด" : "▶ เล่น";
      }
      if (simBtn) {
        simBtn.textContent = studioState.simPlaying
          ? `⏹ หยุดจำลองเวลา (${studioState.simSpeed}x)`
          : `⏱ จำลองเลื่อนเวลา (${studioState.simSpeed}x)`;
        simBtn.classList.toggle("is-active", studioState.simPlaying);
      }
      if (dot1) dot1.classList.toggle("is-playing", isPlayingAny);
      if (dot2) dot2.classList.toggle("is-playing", isPlayingAny);
    }

    // Seamless Floating Picture-in-Picture (PiP) Controller — Never reloads YouTube iframe!
    function applyPipMode(enablePip) {
      const slot = root.querySelector("#ep6VideoSlot");
      const dock = root.querySelector("#ep6VideoDock");
      const ph = root.querySelector("#ep6PipPlaceholder");
      const pinBtn = root.querySelector("#ep6PinPipBtn");
      const miniBar = root.querySelector("#ep6PipMiniBar");
      const minBtn = root.querySelector("#ep6PipMinBtn");
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
        dock.classList.toggle("is-pip-left", studioState.pipCorner === "left");
        dock.classList.toggle("is-pip-minimized", studioState.isPipMinimized);
        if (miniBar) miniBar.hidden = !studioState.isPipMinimized;
        if (minBtn) minBtn.textContent = studioState.isPipMinimized ? "▢ ขยาย" : "—";
        if (ph) ph.hidden = false;
        if (restorePill) restorePill.hidden = true;
      } else {
        studioState.isPipActive = false;
        studioState.isPipMinimized = false;
        dock.classList.remove("is-pip-floating", "is-pip-minimized");
        if (miniBar) miniBar.hidden = true;
        if (minBtn) minBtn.textContent = "—";
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
          seekToSecond(sec, true);
          evaluateScrollPiP();
        });
      });

      body.querySelectorAll("[data-atlas-jump-slide]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const targetId = Number(btn.getAttribute("data-atlas-jump-slide"));
          const targetSl = getSlideById(targetId);
          if (!targetSl) return;
          jumpToSlide(targetSl.id, studioState.ytPlaying || studioState.simPlaying);
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
          jumpToSlide(st.slideIds[0], true);
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

    // Wire Transport Controls
    const togglePlayPause = () => {
      if (studioState.simPlaying) {
        stopSimulatedTimeline();
        return;
      }
      if (instance.ytReady && instance.ytPlayer && !studioState.ytError) {
        const st = instance.ytPlayer.getPlayerState ? instance.ytPlayer.getPlayerState() : -1;
        if (st === 1) {
          instance.ytPlayer.pauseVideo();
        } else {
          ensurePlayerUnmuted();
          instance.ytPlayer.playVideo();
        }
      } else {
        startSimulatedTimeline();
      }
    };

    const goPrevSlide = () => {
      const prevId = Math.max(1, studioState.activeSlideId - 1);
      jumpToSlide(prevId, studioState.ytPlaying || studioState.simPlaying);
    };
    const goNextSlide = () => {
      const nextId = Math.min(DATA.slides.length, studioState.activeSlideId + 1);
      jumpToSlide(nextId, studioState.ytPlaying || studioState.simPlaying);
    };

    root.querySelector("#ep6PlayPauseBtn")?.addEventListener("click", togglePlayPause);
    root.querySelector("#ep6MiniPlayBtn")?.addEventListener("click", togglePlayPause);
    root.querySelector("#ep6PrevSlideBtn")?.addEventListener("click", goPrevSlide);
    root.querySelector("#ep6NextSlideBtn")?.addEventListener("click", goNextSlide);
    root.querySelector("#ep6MiniPrevBtn")?.addEventListener("click", goPrevSlide);
    root.querySelector("#ep6MiniNextBtn")?.addEventListener("click", goNextSlide);
    root.querySelector("#ep6Rew15Btn")?.addEventListener("click", () => {
      seekToSecond(studioState.currentSec - 15, studioState.ytPlaying || studioState.simPlaying);
    });
    root.querySelector("#ep6Fwd15Btn")?.addEventListener("click", () => {
      seekToSecond(studioState.currentSec + 15, studioState.ytPlaying || studioState.simPlaying);
    });

    root.querySelector("#ep6SimToggleBtn")?.addEventListener("click", () => {
      if (studioState.simPlaying) {
        if (studioState.simSpeed === 1) {
          studioState.simSpeed = 2;
          startSimulatedTimeline();
        } else if (studioState.simSpeed === 2) {
          studioState.simSpeed = 4;
          startSimulatedTimeline();
        } else {
          studioState.simSpeed = 1;
          stopSimulatedTimeline();
        }
      } else {
        if (instance.ytReady && instance.ytPlayer && studioState.ytPlaying) {
          try {
            instance.ytPlayer.pauseVideo();
          } catch (_) {}
        }
        studioState.simSpeed = 1;
        startSimulatedTimeline();
      }
    });

    // Wire PiP Controls
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

    root.querySelector("#ep6PipSideBtn")?.addEventListener("click", () => {
      studioState.pipCorner = studioState.pipCorner === "left" ? "right" : "left";
      const dock = root.querySelector("#ep6VideoDock");
      if (dock) dock.classList.toggle("is-pip-left", studioState.pipCorner === "left");
      savePersistedPrefs();
    });

    root.querySelector("#ep6PipMinBtn")?.addEventListener("click", () => {
      studioState.isPipMinimized = !studioState.isPipMinimized;
      const dock = root.querySelector("#ep6VideoDock");
      const minBtn = root.querySelector("#ep6PipMinBtn");
      const miniBar = root.querySelector("#ep6PipMiniBar");
      if (dock) dock.classList.toggle("is-pip-minimized", studioState.isPipMinimized);
      if (miniBar) miniBar.hidden = !studioState.isPipMinimized;
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

    // Explicit click-only button to jump down to active slide in the 43-Slide Atlas
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

    // Wire Scrubber Drag/Click + Hover Tooltip — ZERO unwanted page scroll!
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
        seekToSecond(secFromPointer(e.clientX), false);
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
          seekToSecond(secFromPointer(e.clientX), false);
        }
      });
      track.addEventListener("pointerleave", () => {
        if (tooltip) tooltip.hidden = true;
      });
      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          seekToSecond(studioState.currentSec + 15, false);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          seekToSecond(studioState.currentSec - 15, false);
        }
      });
    }

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

    // Bind passive window scroll/resize listener for Auto-PiP
    let scrollRaf = 0;
    const onScrollOrResize = () => {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        evaluateScrollPiP();
      });
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    instance.cleanupListeners = () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
    };

    // Initial render
    renderAtlasBody();
    applyWorkspaceLayout();
    updateLiveUI(studioState.currentSec, { forceCard: true });
    syncTransportButtons();

    // Initialize Official YouTube IFrame Player (Exact Version 1 Unmuted Flow)
    if (window.location.protocol === "file:") {
      studioState.ytError = true;
      const fb = root.querySelector("#ep6YtFallbackBanner");
      if (fb) fb.hidden = false;
    }

    ensureYouTubeIframeAPI(() => {
      if (activeInstance !== instance) return;
      const iframeEl = root.querySelector("#ep6YtIframeEl");
      if (!iframeEl || !window.YT || !window.YT.Player) return;

      try {
        instance.ytPlayer = new window.YT.Player(iframeEl, {
          events: {
            onReady: () => {
              instance.ytReady = true;
              studioState.ytError = false;
              ensurePlayerUnmuted();
              instance.pollTimer = setInterval(() => {
                if (!instance.ytPlayer || typeof instance.ytPlayer.getCurrentTime !== "function") return;
                const st = instance.ytPlayer.getPlayerState ? instance.ytPlayer.getPlayerState() : -1;
                if (st === 1) {
                  const t = instance.ytPlayer.getCurrentTime();
                  if (t >= MAX_SEC) {
                    instance.ytPlayer.pauseVideo();
                    updateLiveUI(MAX_SEC - 1);
                  } else if (Math.abs(t - studioState.currentSec) >= 0.35) {
                    updateLiveUI(t);
                  }
                }
              }, 280);
            },
            onStateChange: (ev) => {
              const playing = ev.data === 1;
              studioState.ytPlaying = playing;
              if (playing && studioState.simPlaying) {
                stopSimulatedTimeline();
              }
              if (instance.ytPlayer && typeof instance.ytPlayer.getCurrentTime === "function") {
                const t = instance.ytPlayer.getCurrentTime();
                if (t > 0) updateLiveUI(t);
              }
              syncTransportButtons();
            },
            onError: () => {
              studioState.ytError = true;
              studioState.ytPlaying = false;
              const fb = root.querySelector("#ep6YtFallbackBanner");
              if (fb) fb.hidden = false;
              syncTransportButtons();
            }
          }
        });
      } catch (_) {
        studioState.ytError = true;
        const fb = root.querySelector("#ep6YtFallbackBanner");
        if (fb) fb.hidden = false;
      }
    });
  }

  window.RACM303_EP6_STUDIO = {
    render: renderEp6MorbidityStudio,
    getState: () => studioState,
    destroy: destroyActiveTimers
  };
})();
