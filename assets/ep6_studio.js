/* ==========================================================================
   RACM 303 — Epidemiology Multi-Lecture Interactive Studio (EP4 · EP5 · EP6 · EP7 · EP8 · EP9)
   - 100% Standalone Native HTML5 <video> Streaming (Zero YouTube · Sliced Per Lecture)
   - Synchronized Captured HD Slides + Non-Overlapping Thai CC + Verbatim -> Conceptualized
   - Seamless Auto & Manual Floating Picture-in-Picture (PiP) Without Reloading Video
   - 4 Workspace Layouts + 7 Hide/Unhide Section Toggles + Clickable Slide Bridges
   ========================================================================== */
(function () {
  "use strict";

  const STORAGE_UI_PREFS_KEY = "racm303_ep_studio_prefs_v10";
  const LEGACY_UI_PREFS_KEYS = ["racm303_ep_studio_prefs_v9", "racm303_ep_studio_prefs_v8"];
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const MODULE_ORDER = ["EP4", "EP5", "EP6", "EP7", "EP8", "EP9"];

  function getModulesMap() {
    const map = {};
    if (window.RACM303_EP4_STUDY_DESIGNS) map.EP4 = window.RACM303_EP4_STUDY_DESIGNS;
    if (window.RACM303_EP5_SURVEILLANCE) map.EP5 = window.RACM303_EP5_SURVEILLANCE;
    if (window.RACM303_EP6_MORBIDITY) map.EP6 = window.RACM303_EP6_MORBIDITY;
    if (window.RACM303_EP7_SURVEY) map.EP7 = window.RACM303_EP7_SURVEY;
    if (window.RACM303_EP8_EXPERIMENTAL) map.EP8 = window.RACM303_EP8_EXPERIMENTAL;
    if (window.RACM303_EP9_EBM) map.EP9 = window.RACM303_EP9_EBM;
    return map;
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

  function findCaptionAtTime(dataObj, sec) {
    const cues = dataObj && dataObj.captions;
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

  function findSlideAtTime(dataObj, sec) {
    const minS = dataObj.meta.startSec || 0;
    const maxS = dataObj.meta.endSec || dataObj.meta.durationSec || 3600;
    const t = Math.max(minS, Math.min(maxS, Number(sec) || minS));
    const segs = dataObj.timelineSegments || [];
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

  function getSlideById(dataObj, id) {
    return (dataObj.slides || []).find((s) => s.id === id) || dataObj.slides[0];
  }

  function getStageById(dataObj, id) {
    return (dataObj.stages || []).find((st) => st.id === id) || dataObj.stages[0];
  }

  const DEFAULT_PANELS = {
    stages: true,
    video: true,
    slide: false,
    verbatim: true,
    scrubber: true,
    concept: true,
    flow: true,
    atlas: true
  };

  const studioState = {
    activeModule: "EP4",
    perBundleEpisode: {},
    perLectureSec: { EP4: 0, EP5: 0, EP6: 4, EP7: 0, EP8: 0, EP9: 0 },
    currentSec: 4,
    activeSlideId: 1,
    activeStageId: 1,
    imgQuality: "hd", // 'hd' | 'yt'
    layoutMode: "balanced", // 'balanced' | 'tri' | 'cinema' | 'stack'
    panels: { ...DEFAULT_PANELS },
    atlasView: "flow", // 'flow' | 'matrix'
    stageFilter: 0,
    searchQuery: "",
    isPlaying: false,
    timelineSync: true,
    playbackSpeed: 1,
    ccEnabled: true,
    ccLarge: false,
    isPipActive: false,
    isPipMinimized: false,
    pipCorner: "right",
    pipWidth: 400,
    pipCustomPos: null,
    manualPipPinned: false,
    pipDismissedWhileScrolled: false
  };

  (function loadPersistedPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_UI_PREFS_KEY);
      if (!raw) {
        for (let i = 0; i < LEGACY_UI_PREFS_KEYS.length; i++) {
          const legacyRaw = localStorage.getItem(LEGACY_UI_PREFS_KEYS[i]);
          if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw);
            if (legacy && typeof legacy === "object") {
              if (MODULE_ORDER.includes(legacy.activeModule)) {
                studioState.activeModule = legacy.activeModule;
              }
              if (typeof legacy.playbackSpeed === "number" && SPEEDS.includes(legacy.playbackSpeed)) {
                studioState.playbackSpeed = legacy.playbackSpeed;
              }
              if (typeof legacy.timelineSync === "boolean") {
                studioState.timelineSync = legacy.timelineSync;
              }
              break;
            }
          }
        }
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (MODULE_ORDER.includes(parsed.activeModule)) {
          studioState.activeModule = parsed.activeModule;
        }
        if (["cinema", "tri", "balanced", "stack"].includes(parsed.layoutMode)) {
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
        if (["right", "left"].includes(parsed.pipCorner)) {
          studioState.pipCorner = parsed.pipCorner;
        }
        if (typeof parsed.pipWidth === "number" && parsed.pipWidth >= 240 && parsed.pipWidth <= 1000) {
          studioState.pipWidth = parsed.pipWidth;
        }
        if (
          parsed.pipCustomPos &&
          typeof parsed.pipCustomPos.x === "number" &&
          typeof parsed.pipCustomPos.y === "number"
        ) {
          studioState.pipCustomPos = { x: parsed.pipCustomPos.x, y: parsed.pipCustomPos.y };
        }
        if (typeof parsed.playbackSpeed === "number" && SPEEDS.includes(legacyOrNum(parsed.playbackSpeed))) {
          studioState.playbackSpeed = parsed.playbackSpeed;
        }
        if (typeof parsed.timelineSync === "boolean") {
          studioState.timelineSync = parsed.timelineSync;
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
    function legacyOrNum(v) {
      return Number(v);
    }
  })();

  function savePersistedPrefs() {
    try {
      localStorage.setItem(
        STORAGE_UI_PREFS_KEY,
        JSON.stringify({
          activeModule: studioState.activeModule,
          layoutMode: studioState.layoutMode,
          imgQuality: studioState.imgQuality,
          ccEnabled: studioState.ccEnabled,
          ccLarge: studioState.ccLarge,
          pipCorner: studioState.pipCorner,
          pipWidth: studioState.pipWidth,
          pipCustomPos: studioState.pipCustomPos,
          playbackSpeed: studioState.playbackSpeed,
          timelineSync: studioState.timelineSync,
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
    if (activeInstance.videoEl) {
      try {
        activeInstance.videoEl.pause();
        activeInstance.videoEl.removeAttribute("src");
        activeInstance.videoEl.load();
      } catch (_) {}
      activeInstance.videoEl = null;
    }
    activeInstance = null;
  }

  const PANEL_DEFS = [
    { key: "stages", label: "🗺️ แถบ 5 องก์" },
    { key: "video", label: "🎥 วิดีโอ" },
    { key: "slide", label: "🖼️ สไลด์ซิงก์" },
    { key: "verbatim", label: "🎙️ คำพูดอาจารย์" },
    { key: "scrubber", label: "⏱️ แถบเลื่อนเวลา" },
    { key: "concept", label: "💡 Conceptualized" },
    { key: "flow", label: "🧭 Logical Flow" },
    { key: "atlas", label: "📋 ผังสไลด์ทั้งหมด" }
  ];

  const LAYOUT_DEFS = [
    { id: "balanced", label: "⚖️ 2 คอลัมน์สมดุล (ซ้าย VDO · ขวาเนื้อหา)" },
    { id: "tri", label: "🎬 วิดีโอ+สไลด์คู่ขนาน" },
    { id: "cinema", label: "🖥️ จอกว้าง (วิดีโอ+สไลด์บน · เนื้อหาล่าง)" },
    { id: "stack", label: "📄 เรียงเดี่ยวแนวตั้ง" }
  ];

  const MODULE_SHORT_LABELS = {
    EP4: { short: "Study Designs & Measurement of Impact", sub: "Cohort / Case-Control / OR / RR & AR, AR%, PAR, PAR%" },
    EP5: { short: "Disease Surveillance & Outbreak Investigation", sub: "Passive/Active รง.506 · Median 5 ปี · Epi Curve & Attack Rate" },
    EP6: { short: "Measures of Morbidity & Mortality", sub: "ความชุก อุบัติการณ์ อัตราตาย DALY & Standardization" },
    EP7: { short: "Health Survey", sub: "การสำรวจสุขภาพชุมชน ขนาดตัวอย่าง & Probability Sampling" },
    EP8: { short: "Experimental Study", sub: "การวิจัยเชิงทดลอง RCT, Blinding & RR / ARR / NNT" },
    EP9: { short: "Evidence-Based Medicine (EBM)", sub: "การตั้งคำถาม PICO, พีระมิด 5S & Levels of Evidence" }
  };

  function renderEpStudio(container, opts) {
    if (!container) return;
    const standaloneData = opts && opts.standaloneData && typeof opts.standaloneData === "object" ? opts.standaloneData : null;
    const isMultiStandalone = Boolean(standaloneData && standaloneData.isMultiEpisode && standaloneData.episodes);
    const standaloneCode = standaloneData
      ? String((opts && opts.moduleCode) || (standaloneData.meta && standaloneData.meta.moduleCode) || "VDO")
      : "";
    const modules = isMultiStandalone
      ? standaloneData.episodes
      : standaloneData
      ? { [standaloneCode]: standaloneData }
      : getModulesMap();
    const availableCodes = isMultiStandalone
      ? (standaloneData.episodeOrder || Object.keys(modules)).filter((c) => Boolean(modules[c]))
      : standaloneData
      ? [standaloneCode]
      : MODULE_ORDER.filter((c) => Boolean(modules[c]));
    if (!availableCodes.length) return;

    let modCode = standaloneCode;
    if (isMultiStandalone) {
      const wantedEp = opts && opts.episodeCode && modules[opts.episodeCode] ? opts.episodeCode : null;
      const savedEp = studioState.perBundleEpisode[standaloneCode];
      const defEp = standaloneData.defaultEpisode && modules[standaloneData.defaultEpisode] ? standaloneData.defaultEpisode : availableCodes[0];
      modCode = wantedEp || (savedEp && modules[savedEp] ? savedEp : defEp);
      studioState.perBundleEpisode[standaloneCode] = modCode;
    } else if (!standaloneData) {
      if (opts && opts.moduleCode && modules[opts.moduleCode]) {
        studioState.activeModule = opts.moduleCode;
      } else if (!modules[studioState.activeModule]) {
        studioState.activeModule = availableCodes[0];
      }
      modCode = studioState.activeModule;
    }

    const DATA = modules[modCode];
    const MIN_SEC = Number(DATA.meta.startSec) || 0;
    const MAX_SEC = Number(DATA.meta.endSec || DATA.meta.durationSec) || 3600;
    const TOTAL_SLIDES = (DATA.slides || []).length;
    const rawParts = Array.isArray(DATA.meta.videoParts) && DATA.meta.videoParts.length
      ? DATA.meta.videoParts
      : [{ src: DATA.meta.videoSrc, duration: MAX_SEC }];
    const partsList = [];
    let accOffset = 0;
    rawParts.forEach((pt, idx) => {
      const dur = Math.max(1, Number(pt.duration) || MAX_SEC);
      partsList.push({ idx, src: pt.src, startOffset: accOffset, duration: dur, label: pt.label || "" });
      accOffset += dur;
    });
    function resolvePartForVirtualSec(vSec) {
      const clampedV = Math.max(MIN_SEC, Math.min(MAX_SEC - 0.05, Number(vSec) || 0));
      let chosen = partsList[partsList.length - 1];
      for (let i = 0; i < partsList.length; i++) {
        if (clampedV < partsList[i].startOffset + partsList[i].duration - 0.02 || i === partsList.length - 1) {
          chosen = partsList[i];
          break;
        }
      }
      return {
        partIdx: chosen.idx,
        src: chosen.src,
        startOffset: chosen.startOffset,
        duration: chosen.duration,
        localSec: Math.max(0, Math.min(chosen.duration - 0.05, clampedV - chosen.startOffset))
      };
    }

    // Restore saved position (or explicit initialSeekSec) for this specific lecture
    const savedSec =
      opts && typeof opts.initialSeekSec === "number"
        ? opts.initialSeekSec
        : studioState.perLectureSec[modCode];
    studioState.currentSec = Math.max(MIN_SEC, Math.min(MAX_SEC - 1, savedSec != null ? savedSec : MIN_SEC));
    studioState.perLectureSec[modCode] = studioState.currentSec;
    studioState.activeSlideId = findSlideAtTime(DATA, studioState.currentSec);
    studioState.activeStageId = getSlideById(DATA, studioState.activeSlideId).stageId;
    studioState.stageFilter = 0;
    studioState.searchQuery = "";
    studioState.isPlaying = false;
    studioState.isPipActive = false;
    studioState.isPipMinimized = false;

    destroyActiveTimers();
    container.replaceChildren();

    const isCompactEmbed = Boolean(opts && opts.compactHeader);
    const root = document.createElement("section");
    root.className = "ep6-studio-root";
    root.id = "ep6MorbidityStudioRoot";
    root.dataset.epModule = modCode;
    root.tabIndex = -1;

    const initPartInfo = resolvePartForVirtualSec(studioState.currentSec);
    const instance = {
      container,
      opts,
      root,
      videoEl: null,
      activePartIdx: initPartInfo.partIdx,
      pendingLocalSeek: initPartInfo.localSec,
      pendingAutoPlay: Boolean(opts && opts.autoPlay),
      flashTimer: null,
      dockedMeasuredHeight: 0,
      cleanupListeners: null
    };
    activeInstance = instance;

    // 0. Multi-Lecture Switcher Ribbon
    if (availableCodes.length > 1) {
      const switcherHeading = standaloneData
        ? standaloneData.switcherLabel || "🎬 เลือกตอนวิดีโอบรรยายประจำคาบ"
        : "🎬 เลือกคาบบรรยายระบาดวิทยา";
      const switcher = document.createElement("div");
      switcher.className = "ep6-module-switcher";
      switcher.setAttribute("role", "tablist");
      switcher.setAttribute("aria-label", switcherHeading);
      switcher.innerHTML = `
        <div class="ep6-ms-label">${esc(switcherHeading)}</div>
        <div class="ep6-ms-grid">
          ${availableCodes
            .map((code) => {
              const m = modules[code];
              const info =
                (standaloneData && standaloneData.shortLabels && standaloneData.shortLabels[code]) ||
                MODULE_SHORT_LABELS[code] ||
                { short: m.meta.courseTitle, sub: "" };
              const cardBadgeRight = m.meta.examWeight
                ? `สอบ ${m.meta.examWeight}`
                : m.meta.cardTag || m.meta.sessionTag || standaloneCode || "VDO";
              const active = code === modCode;
              return `
                <button type="button" role="tab" aria-selected="${active}" class="ep6-ms-card ${active ? "is-active" : ""}" data-switch-ep-mod="${code}">
                  <div class="ep6-ms-top">
                    <span class="ep6-ms-code">${esc(code)} · ${esc(cardBadgeRight)}</span>
                    <span class="ep6-ms-dur">⏱ ${esc(m.meta.durationLabel || fmtTime(m.meta.durationSec))} · ${m.slides.length} สไลด์</span>
                  </div>
                  <div class="ep6-ms-title">${esc(info.short)}</div>
                  <div class="ep6-ms-sub">${esc(m.meta.lecturer || "")}${info.sub ? ` — ${esc(info.sub)}` : ""}</div>
                </button>
              `;
            })
            .join("")}
        </div>
      `;
      root.appendChild(switcher);
    }

    // 1. Header Banner
    const pdfFilename = (DATA.meta.pdfDownloadPath || "").split("/").pop() || `${modCode}_Slides.pdf`;
    const badgeRightTxt = DATA.meta.examWeight
      ? `สอบ ${DATA.meta.examWeight}`
      : DATA.meta.sessionTag || "STEP 06 · VDO Lecture";
    const header = document.createElement("div");
    header.className = "ep6-studio-header";
    header.innerHTML = `
      <div class="ep6-head-main">
        <div class="ep6-head-eyebrow">
          <span class="ep6-badge-code">${esc(modCode)} · ${esc(badgeRightTxt)}</span>
          <span class="ep6-badge-meta">🎬 Native Video Player (ไม่ใช้ YouTube · หั่นคลิปตรงคาบ)</span>
          <span class="ep6-badge-meta">${TOTAL_SLIDES} Captured Slides · Verbatim → Conceptualized</span>
          <span class="ep6-badge-meta">⏱ ${esc(DATA.meta.durationLabel || fmtTime(MAX_SEC))}</span>
        </div>
        <h3 class="ep6-head-title">${esc(DATA.meta.courseTitle)}</h3>
        <p class="ep6-head-sub">${esc(DATA.meta.recordedInfo)} — เล่นวิดีโอบรรยายพร้อมเสียงครบเต็มรูปแบบ ปรับความเร็ว 0.5x–2x ข้าม ±10 วินาที มีคำบรรยายไทย CC แยกใต้จอวิดีโอไม่บังปุ่มควบคุม และรองรับโหมดหน้าต่างลอย PiP อัตโนมัติเมื่อเลื่อนอ่านด้านล่าง</p>
      </div>
      <div class="ep6-head-actions">
        ${DATA.meta.pdfDownloadPath ? `<a class="btn sm" href="${esc(DATA.meta.pdfDownloadPath)}" download="${esc(pdfFilename)}">📥 ดาวน์โหลดสไลด์ ${esc(modCode)} (.PDF)</a>` : ""}
        <span class="ep6-protected-pill" title="สตรีมวิดีโอตรงประจำคาบเรียนสำหรับนักศึกษา RACM 303">🔒 สตรีมประจำคาบ ${esc(modCode)}</span>
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
            <button type="button" class="ep6-tool-btn ${studioState.imgQuality === "hd" ? "is-active" : ""}" data-imgq="hd">✨ สไลด์คมชัด HD</button>
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
        <div class="ep6-ws-right-actions">
          <button type="button" class="ep6-sync-toggle-pill ${studioState.timelineSync ? "is-on" : ""}" data-timeline-sync-btn aria-pressed="${studioState.timelineSync}" title="ติ๊กเปิด/ปิด Timeline Sync เลื่อนสไลด์และคำพูดตามช่วงเวลาวิดีโออัตโนมัติ">
            <span class="ep6-sync-box">${studioState.timelineSync ? "✓" : ""}</span>
            <span>Timeline Sync ตาม VDO</span>
          </button>
          <button type="button" class="ep6-reset-ws-btn" id="ep6ResetWorkspaceBtn" title="คืนค่า Layout มาตรฐาน (วิดีโอคู่เนื้อหา · ปิดสไลด์ซิงก์ไว้ก่อน)">↺ คืนค่าเริ่มต้น</button>
        </div>
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
        <span class="ep6-ribbon-label">🗺️ Logical Flow ${DATA.stages.length} องก์ต่อเนื่องของ ${esc(modCode)} (คลิกเพื่อข้ามไปยังช่วงเวลาของแต่ละองก์):</span>
        <button type="button" class="ep6-inline-hide-btn" data-hide-panel="stages" title="ซ่อนแถบองก์การเรียนรู้">ซ่อน ✕</button>
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

    // 4. Synchronized Theater (Direct Native HTML5 <video> + Non-Overlapping CC + Floating PiP!)
    const firstSlide = DATA.slides[0];
    const theater = document.createElement("div");
    theater.className = `ep6-theater layout-${studioState.layoutMode}`;
    theater.id = "ep6TheaterGrid";
    theater.innerHTML = `
      <div class="ep6-media-col" id="ep6MediaCol">
        <div class="ep6-player-stage" id="ep6PlayerStage">
          <!-- STANDALONE NATIVE HTML5 VIDEO DOCK (Zero YouTube · Full Audio · Non-Overlapping CC · Seamless PiP) -->
          <div class="ep6-video-slot" id="ep6VideoSlot">
            <div class="ep6-pip-placeholder" id="ep6PipPlaceholder" hidden>
              <div class="ep6-pip-ph-inner">
                <span class="ep6-pip-ph-icon">⧉</span>
                <div>
                  <strong>วิดีโอ ${esc(modCode)} กำลังแสดงแบบหน้าต่างลอย (Picture-in-Picture)</strong>
                  <p>เลื่อนอ่านแผนผังตรรกะทั้ง ${TOTAL_SLIDES} สไลด์ด้านล่างควบคู่กับการดูวิดีโอและฟังเสียงบรรยายได้ต่อเนื่อง</p>
                </div>
                <button type="button" class="btn sm" id="ep6ReturnFromPipBtn">ดึงกลับช่องหลัก</button>
              </div>
            </div>

            <div class="ep6-video-dock ${studioState.pipCorner === "left" ? "is-pip-left" : ""}" id="ep6VideoDock">
              <span class="ep6-pip-resizer is-tl ep6-pip-only" data-pip-resize="tl" title="ลากมุมหรือกางนิ้ว (Pinch) เพื่อย่อ/ขยายขนาด PiP"></span>
              <span class="ep6-pip-resizer is-tr ep6-pip-only" data-pip-resize="tr" title="ลากมุมหรือกางนิ้ว (Pinch) เพื่อย่อ/ขยายขนาด PiP"></span>
              <span class="ep6-pip-resizer is-bl ep6-pip-only" data-pip-resize="bl" title="ลากมุมหรือกางนิ้ว (Pinch) เพื่อย่อ/ขยายขนาด PiP"></span>
              <span class="ep6-pip-resizer is-br ep6-pip-only" data-pip-resize="br" title="ลากมุมหรือกางนิ้ว (Pinch) เพื่อย่อ/ขยายขนาด PiP">⤡</span>
              <div class="ep6-vdock-head" id="ep6VdockHead">
                <div class="ep6-vdock-title-wrap">
                  <span class="ep6-pip-drag-grip ep6-pip-only" title="ลากแถบหัวนี้เพื่อย้ายตำแหน่ง PiP ได้อิสระ">⠿</span>
                  <span class="ep6-live-dot" id="ep6DockDot"></span>
                  <span class="ep6-slide-pill" id="ep6DockHeaderLabel">🎥 ${esc(modCode)} วิดีโอบรรยาย · Slide 1/${TOTAL_SLIDES}</span>
                </div>
                <div class="ep6-vdock-actions">
                  <button type="button" class="ep6-dock-icon-btn" id="ep6PinPipBtn" title="เปิด/ปิด โหมดหน้าต่างลอย (Picture-in-Picture)">⧉ PiP</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-dock-only" id="ep6BrowserPipBtn" title="เปิดโหมดหน้าต่างลอยระดับเบราว์เซอร์ (OS Picture-in-Picture)">⧉ แยกจอ</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-dock-only" data-hide-panel="video" title="ซ่อนส่วนวิดีโอ">ซ่อน</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only ${studioState.timelineSync ? "is-active" : ""}" data-timeline-sync-btn data-pip-sync-pill="1" aria-pressed="${studioState.timelineSync}" title="เปิด/ปิด Timeline Sync เลื่อนผังสไลด์ตามเวลา VDO อัตโนมัติ">${studioState.timelineSync ? "✓ Sync" : "☐ Sync"}</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipZoomOutBtn" title="ย่อขนาดหน้าต่าง PiP (หรือบีบ 2 นิ้ว)">−</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipZoomInBtn" title="ขยายขนาดหน้าต่าง PiP (หรือกาง 2 นิ้ว Pinch Out)">+</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipSideBtn" title="สลับมุมซ้าย / ขวา และคืนตำแหน่งมาตรฐาน">⇄ ซ้าย/ขวา</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipMinBtn" title="ย่อเก็บเฉพาะแถบเสียง/เวลา">—</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipTopBtn" title="เลื่อนกลับขึ้นด้านบนสุด">⬆ บนสุด</button>
                  <button type="button" class="ep6-dock-icon-btn ep6-pip-only" id="ep6PipCloseBtn" title="ดึงกลับช่องหลัก / ปิด PiP">✕</button>
                </div>
              </div>

              <!-- Pure 16:9 Native HTML5 Video Frame (Zero YouTube · Zero CC Overlap on Video Controller!) -->
              <div class="ep6-yt-aspect" id="ep6VideoAspect">
                <video
                  id="ep6NativeVideoEl"
                  class="ep6-native-video"
                  src="${esc(initPartInfo.src)}"
                  poster="${esc(getSlideImg(firstSlide))}"
                  preload="metadata"
                  playsinline
                  controls
                  controlslist="nodownload"
                ></video>
                <div class="ep6-skip-flash" id="ep6SkipFlash" hidden></div>
              </div>

              <!-- Dedicated Cinema Closed Captions (CC) Bar BELOW Video Frame (0% Overlap with Video Controller!) -->
              <div class="ep6-cc-dock-strip ${studioState.ccLarge ? "is-large" : ""}" id="ep6CcOverlay" ${studioState.ccEnabled ? "" : "hidden"}>
                <span class="ep6-cc-badge">CC</span>
                <span class="ep6-cc-text" id="ep6CcText">คำบรรยายภาษาไทยตามเวลาการบรรยาย (${esc(DATA.meta.lecturer || "")})</span>
              </div>

              <!-- YouTube-Style Quick Transport Bar (Speed 0.5x–2x, ±10s, CC Toggle, Fullscreen) -->
              <div class="ep6-ytstyle-bar" id="ep6YtStyleBar">
                <div class="ep6-ytb-left">
                  <button type="button" class="ep6-ytb-btn is-play" id="ep6DockPlayBtn" title="เล่น / หยุดวิดีโอ (K)">▶ เล่น</button>
                  <button type="button" class="ep6-ytb-btn" id="ep6DockRew15Btn" title="ถอยหลัง 10 วินาที (J หรือ ←)">↺ -10s</button>
                  <button type="button" class="ep6-ytb-btn" id="ep6DockFwd15Btn" title="เดินหน้า 10 วินาที (L หรือ →)">+10s ↻</button>
                  <button type="button" class="ep6-ytb-btn ep6-pip-only" id="ep6PipPrevSlideBtn" title="สไลด์ก่อนหน้า">⏮</button>
                  <button type="button" class="ep6-ytb-btn ep6-pip-only" id="ep6PipNextSlideBtn" title="สไลด์ถัดไป">⏭</button>
                  <span class="ep6-ytb-time"><strong id="ep6DockTimeTxt">${fmtTime(studioState.currentSec)}</strong> / ${esc(DATA.meta.durationLabel || fmtTime(MAX_SEC))}</span>
                </div>
                <div class="ep6-ytb-right">
                  <button type="button" class="ep6-ytb-btn is-cc ${studioState.ccEnabled ? "is-on" : ""}" id="ep6CcToggleBtn" aria-pressed="${studioState.ccEnabled}" title="เปิด/ปิด คำบรรยายภาษาไทยใต้จอวิดีโอ (C)">CC</button>
                  <button type="button" class="ep6-ytb-btn ${studioState.ccLarge ? "is-on" : ""}" id="ep6CcSizeBtn" title="ขยาย/ย่อ ขนาดตัวอักษรคำบรรยาย CC">A+</button>
                  <select id="ep6SpeedSelect" class="ep6-speed-select" aria-label="ปรับความเร็ววิดีโอ (Playback Speed)" title="ปรับความเร็วเสียงและวิดีโอ (0.5x – 2x)">
                    ${SPEEDS.map(
                      (sp) => `<option value="${sp}" ${studioState.playbackSpeed === sp ? "selected" : ""}>${sp}x</option>`
                    ).join("")}
                  </select>
                  <button type="button" class="ep6-ytb-btn" id="ep6FullscreenBtn" title="ขยายเต็มจอพร้อมคำบรรยาย CC">⛶</button>
                </div>
              </div>
            </div>
          </div>

          <!-- SYNCHRONIZED CAPTURED SLIDE PANEL -->
          <div class="ep6-sync-slide-box" id="ep6SyncSlideBox">
            <div class="ep6-slide-frame-head">
              <span id="ep6SyncSlideBadge" class="ep6-slide-pill">Slide 1 / ${TOTAL_SLIDES}</span>
              <div class="ep6-slide-head-btns">
                <button type="button" class="ep6-zoom-btn" id="ep6ZoomCurrentSlideBtn">🔍 ขยายสไลด์เต็มจอ</button>
                <button type="button" class="ep6-inline-hide-btn" data-hide-panel="slide" title="ซ่อนกรอบสไลด์">ซ่อน ✕</button>
              </div>
            </div>
            <div class="ep6-slide-img-wrap" id="ep6SyncSlideImgWrap" title="คลิกเพื่อขยายภาพสไลด์เต็มจอ">
              <img id="ep6SyncSlideImg" src="${esc(getSlideImg(firstSlide))}" alt="Captured lecture slide">
            </div>
          </div>
        </div>

        <!-- LIVE AUTO-SCROLL-UP VERBATIM QUOTATION TICKER DIRECTLY UNDER PLAYER -->
        <div class="ep6-upv-box" id="ep6UnderPlayerVerbatim" aria-live="polite">
          <div class="ep6-upv-head">
            <div class="ep6-upv-title-wrap">
              <span class="ep6-live-dot" id="ep6UpvDot"></span>
              <span class="ep6-upv-title">🎙️ คำพูดอาจารย์ผู้สอนแบบคำต่อคำ <small>(Verbatim Quotation · คลิกเวลาเพื่อฟังเสียงช่วงนั้นทันที)</small></span>
            </div>
            <div class="ep6-upv-controls">
              <div class="ep6-upv-dots" id="ep6UpvDots" role="tablist" aria-label="ช่วงคำพูดในสไลด์นี้"></div>
              <span class="ep6-upv-counter" id="ep6UpvCounter">1 / 1</span>
              <div class="ep6-upv-nav">
                <button type="button" class="ep6-upv-step-btn" id="ep6UpvPrevBtn" title="คำพูดก่อนหน้า">▲</button>
                <button type="button" class="ep6-upv-step-btn" id="ep6UpvNextBtn" title="คำพูดถัดไป">▼</button>
              </div>
              <button type="button" class="ep6-inline-hide-btn" data-hide-panel="verbatim" title="ซ่อนส่วนคำพูดอาจารย์">ซ่อน ✕</button>
            </div>
          </div>
          <div class="ep6-upv-stage" id="ep6UpvStage"></div>
        </div>

        <!-- Custom Interactive Timeline Scrubber with 5-Stage Color Segments & Slide Ticks -->
        <div class="ep6-scrubber-card" id="ep6ScrubberCard">
          <div class="ep6-scrubber-controls">
            <div class="ep6-transport-btns">
              <button type="button" class="ep6-ctrl-btn" id="ep6PrevSlideBtn" title="สไลด์ก่อนหน้า">⏮ สไลด์ก่อน</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6Rew15Btn" title="ถอยหลัง 10 วินาที">↺ -10 วิ</button>
              <button type="button" class="ep6-ctrl-btn is-primary" id="ep6PlayPauseBtn">▶ เล่นวิดีโอ</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6Fwd15Btn" title="เดินหน้า 10 วินาที">+10 วิ ↻</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6NextSlideBtn" title="สไลด์ถัดไป">สไลด์ถัดไป ⏭</button>
            </div>
            <div class="ep6-scrubber-right-meta">
              <div class="ep6-time-readout">
                <strong id="ep6CurTimeTxt">${fmtTime(studioState.currentSec)}</strong>
                <span>/ ${esc(DATA.meta.durationLabel || fmtTime(MAX_SEC))}</span>
              </div>
              <button type="button" class="ep6-inline-hide-btn" data-hide-panel="scrubber" title="ซ่อนแถบเลื่อนเวลา">ซ่อน ✕</button>
            </div>
          </div>

          <div class="ep6-track-outer" id="ep6TimelineTrack" role="slider" aria-label="แถบเวลาคาบเรียน ${esc(modCode)}" aria-valuemin="${MIN_SEC}" aria-valuemax="${MAX_SEC}" aria-valuenow="${Math.floor(studioState.currentSec)}" tabindex="0">
            <div class="ep6-track-stages">
              ${DATA.stages
                .map((st) => {
                  const span = Math.max(1, MAX_SEC - MIN_SEC);
                  const leftPct = Math.max(0, ((st.startSec - MIN_SEC) / span) * 100);
                  const widthPct = Math.max(0.5, ((st.endSec - st.startSec) / span) * 100);
                  return `<div class="ep6-track-seg stage-${st.id}" style="left:${leftPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%" title="${esc(st.code)}: ${esc(st.title)}"></div>`;
                })
                .join("")}
            </div>
            <div class="ep6-track-ticks">
              ${DATA.slides
                .map((sl) => {
                  const span = Math.max(1, MAX_SEC - MIN_SEC);
                  const pct = Math.max(0, Math.min(100, ((sl.startSec - MIN_SEC) / span) * 100));
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
            <span id="ep6LiveStageBadge" class="ep6-live-stage-pill">Stage 1/${DATA.stages.length}</span>
            <span id="ep6LiveTimeRange" class="ep6-live-range-txt">Slide 1/${TOTAL_SLIDES}</span>
          </div>
          <div class="ep6-live-bar-acts">
            <button type="button" class="ep6-sync-toggle-pill is-compact ${studioState.timelineSync ? "is-on" : ""}" data-timeline-sync-btn aria-pressed="${studioState.timelineSync}" title="ติ๊กเปิด/ปิด Timeline Sync เลื่อนผังสไลด์ตามเวลาวิดีโออัตโนมัติ">
              <span class="ep6-sync-box">${studioState.timelineSync ? "✓" : ""}</span>
              <span>Timeline Sync</span>
            </button>
            <button type="button" class="ep6-jump-atlas-btn" id="ep6JumpToActiveCardBtn" title="คลิกเพื่อเลื่อนลงไปซิงก์อ่านผังสไลด์ด้านล่างตามเวลาวิดีโอ">
              ⬇ ดูในผัง ${TOTAL_SLIDES} สไลด์
            </button>
          </div>
        </div>

        <div class="ep6-live-card" id="ep6LiveConceptCard"></div>

        <div class="ep6-live-bridge-card" id="ep6LiveBridgePanel"></div>
      </div>
    `;
    root.appendChild(theater);

    // Floating Restore Pill when PiP was manually closed while scrolled down
    const pipRestorePill = document.createElement("button");
    pipRestorePill.type = "button";
    pipRestorePill.className = "ep6-pip-restore-pill";
    pipRestorePill.id = "ep6PipRestorePill";
    pipRestorePill.hidden = true;
    pipRestorePill.innerHTML = `🎥 เปิดวิดีโอ ${esc(modCode)} หน้าต่างลอย (PiP)`;
    root.appendChild(pipRestorePill);

    // 5. Complete Slide Logical Flow Atlas & Rapid Review Matrix
    const atlas = document.createElement("div");
    atlas.className = "ep6-atlas-wrap";
    atlas.id = "ep6PanelAtlas";
    atlas.innerHTML = `
      <div class="ep6-atlas-bar">
        <div class="ep6-atlas-tabs" role="tablist">
          <button type="button" class="ep6-atlas-tab ${studioState.atlasView === "flow" ? "is-active" : ""}" data-aview="flow">🧭 แผนผังตรรกะครบทั้ง ${TOTAL_SLIDES} สไลด์ (${esc(modCode)}: Captured Slide + Verbatim → Conceptualized)</button>
          <button type="button" class="ep6-atlas-tab ${studioState.atlasView === "matrix" ? "is-active" : ""}" data-aview="matrix">⚡ ตารางสรุปสูตร &amp; ประเด็นออกสอบ (${(DATA.rapidReview || []).length} หัวข้อสำคัญ)</button>
        </div>
        <div class="ep6-atlas-filters" id="ep6AtlasFiltersRow">
          <button type="button" class="ep6-sync-toggle-pill ${studioState.timelineSync ? "is-on" : ""}" data-timeline-sync-btn data-atlas-sync-trigger="1" aria-pressed="${studioState.timelineSync}" title="เมื่อติ๊กถูก (✓) ผังสไลด์ด้านล่างจะติ๊กผ่านและเลื่อนลงไปยัง Slide ถัดไปตามเวลา VDO อัตโนมัติ">
            <span class="ep6-sync-box">${studioState.timelineSync ? "✓" : ""}</span>
            <span>Timeline Sync (เลื่อนตาม VDO อัตโนมัติ)</span>
          </button>
          <select id="ep6StageFilterSelect" class="ep6-select" aria-label="กรองตามองก์การเรียนรู้">
            <option value="0">แสดงครบทั้ง ${DATA.stages.length} องก์ (${TOTAL_SLIDES} สไลด์)</option>
            ${DATA.stages
              .map((st) => `<option value="${st.id}" ${studioState.stageFilter === st.id ? "selected" : ""}>${esc(st.code)} (${esc(st.rangeLabel)}): ${esc(st.title)}</option>`)
              .join("")}
          </select>
          <input type="search" id="ep6SlideSearchInput" class="ep6-search-input" placeholder="ค้นหาสไลด์ สูตร หรือคำพูดอาจารย์ใน ${esc(modCode)}..." value="${esc(studioState.searchQuery)}">
          <button type="button" class="ep6-inline-hide-btn" data-hide-panel="atlas" title="ซ่อนผังสไลด์ด้านล่าง">ซ่อนผัง ✕</button>
        </div>
      </div>
      <div id="ep6AtlasBody"></div>
    `;
    root.appendChild(atlas);

    container.appendChild(root);

    const videoEl = root.querySelector("#ep6NativeVideoEl");
    instance.videoEl = videoEl;

    // Prevent casual right-click video save
    root.querySelector("#ep6VideoAspect")?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    function showSkipFlash(deltaSec) {
      const el = root.querySelector("#ep6SkipFlash");
      if (!el) return;
      el.textContent = deltaSec < 0 ? `« ${deltaSec} วินาที` : `+${deltaSec} วินาที »`;
      el.className = `ep6-skip-flash ${deltaSec < 0 ? "is-left" : "is-right"}`;
      el.hidden = false;
      if (instance.flashTimer) clearTimeout(instance.flashTimer);
      instance.flashTimer = setTimeout(() => {
        el.hidden = true;
      }, 700);
    }

    // Apply Layout Mode & Section Visibility dynamically
    function applyWorkspaceLayout() {
      const p = studioState.panels;

      const stagesEl = root.querySelector("#ep6PanelStages");
      const videoSlot = root.querySelector("#ep6VideoSlot");
      const slideBox = root.querySelector("#ep6SyncSlideBox");
      const playerStage = root.querySelector("#ep6PlayerStage");
      const upvBox = root.querySelector("#ep6UnderPlayerVerbatim");
      const scrubberCard = root.querySelector("#ep6ScrubberCard");
      const mediaCol = root.querySelector("#ep6MediaCol");
      const conceptCol = root.querySelector("#ep6ConceptCol");
      const liveCardEl = root.querySelector("#ep6LiveConceptCard");
      const bridgeBox = root.querySelector("#ep6LiveBridgePanel");
      const atlasEl = root.querySelector("#ep6PanelAtlas");

      if (stagesEl) stagesEl.hidden = !p.stages;
      if (videoSlot) videoSlot.hidden = !p.video;
      if (slideBox) slideBox.hidden = !p.slide;
      if (playerStage) playerStage.hidden = !p.video && !p.slide;
      if (upvBox) upvBox.hidden = !p.verbatim;
      if (scrubberCard) scrubberCard.hidden = !p.scrubber;
      if (liveCardEl) liveCardEl.hidden = !p.concept;
      if (bridgeBox) bridgeBox.hidden = !p.flow;
      if (atlasEl) atlasEl.hidden = !p.atlas;

      const anyMediaShown = p.video || p.slide || p.verbatim || p.scrubber;
      const anyConceptShown = p.concept || p.flow;
      if (mediaCol) mediaCol.hidden = !anyMediaShown;
      if (conceptCol) conceptCol.hidden = !anyConceptShown;

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
      studioState.perLectureSec[modCode] = clamped;

      const slideId = findSlideAtTime(DATA, clamped);
      const slide = getSlideById(DATA, slideId);
      const stage = getStageById(DATA, slide.stageId);
      const slideChanged = studioState.activeSlideId !== slide.id;
      studioState.activeSlideId = slide.id;
      studioState.activeStageId = stage.id;

      // 1. Update Scrubber & Time Readout
      const span = Math.max(1, MAX_SEC - MIN_SEC);
      const pct = Math.max(0, Math.min(100, ((clamped - MIN_SEC) / span) * 100));
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

      // 2. Update Dedicated Below-Video Closed Captions (CC)
      const ccTxtEl = root.querySelector("#ep6CcText");
      const ccStrip = root.querySelector("#ep6CcOverlay");
      if (ccTxtEl && ccStrip) {
        const cue = findCaptionAtTime(DATA, clamped);
        if (cue) {
          ccTxtEl.textContent = cue;
          ccStrip.classList.remove("is-idle");
        } else {
          ccTxtEl.textContent = "…";
          ccStrip.classList.add("is-idle");
        }
      }

      // 3. Update Dock Header Label (Zero Conceptualized inside video player!)
      const dockLabel = root.querySelector("#ep6DockHeaderLabel");
      if (dockLabel) {
        dockLabel.textContent = studioState.isPipActive
          ? `🎥 ${modCode} PiP · Slide ${slide.id}/${TOTAL_SLIDES} (${fmt})`
          : `🎥 ${modCode} วิดีโอบรรยาย · Slide ${slide.id}/${TOTAL_SLIDES}`;
      }

      // 4. Highlight active & completed Stages in Stepper & Legend
      root.querySelectorAll("[data-stage-jump]").forEach((btn) => {
        const sid = Number(btn.getAttribute("data-stage-jump"));
        btn.classList.toggle("is-active", sid === stage.id);
        btn.classList.toggle("is-stage-done", sid < stage.id);
      });

      // 5. Update Synchronized Slide Image
      const syncImg = root.querySelector("#ep6SyncSlideImg");
      const syncBadge = root.querySelector("#ep6SyncSlideBadge");
      if (syncImg) {
        const wantedSrc = getSlideImg(slide);
        if (syncImg.getAttribute("src") !== wantedSrc) {
          syncImg.setAttribute("src", wantedSrc);
        }
        syncImg.alt = `${modCode} Slide ${slide.id}: ${slide.title}`;
      }
      if (syncBadge) {
        syncBadge.textContent = `${modCode} · Slide ${slide.id} / ${TOTAL_SLIDES} · หน้า ${slide.deckSlideNo} (${studioState.imgQuality === "hd" ? "คมชัด HD" : "ภาพขณะบรรยาย"})`;
      }

      // 6. Update Conceptualized & Verbatim Column
      const stagePill = root.querySelector("#ep6LiveStageBadge");
      const rangeTxt = root.querySelector("#ep6LiveTimeRange");
      if (stagePill) {
        stagePill.textContent = `${stage.code} / ${DATA.stages.length} · ${stage.title}`;
        stagePill.className = `ep6-live-stage-pill stage-${stage.id}`;
      }
      if (rangeTxt) {
        rangeTxt.textContent = `Slide ${slide.id}/${TOTAL_SLIDES} · ${slide.timeLabel}`;
      }

      const quotes = slide.verbatimQuotes || [];
      let activeQuoteIdx = 0;
      for (let i = 0; i < quotes.length; i++) {
        if (clamped >= quotes[i].tSec - 0.12) {
          activeQuoteIdx = i;
        }
      }

      const prevSlide = slide.id > 1 ? getSlideById(DATA, slide.id - 1) : null;
      const nextSlide = slide.id < TOTAL_SLIDES ? getSlideById(DATA, slide.id + 1) : null;

      // 6A. Update Under-Player Live Auto-Scroll-Up Verbatim Ticker
      const upvStage = root.querySelector("#ep6UpvStage");
      const upvCounter = root.querySelector("#ep6UpvCounter");
      const upvDots = root.querySelector("#ep6UpvDots");
      const upvKey = `${modCode}:${slide.id}:${activeQuoteIdx}`;
      if (upvStage && (optsUpdate?.forceCard || instance.lastUpvKey !== upvKey)) {
        const activeQ = quotes[activeQuoteIdx] || null;
        const activeQSec = activeQ ? Number(activeQ.tSec) || slide.startSec : slide.startSec;
        const shouldAnimate = Boolean(instance.lastUpvKey && instance.lastUpvKey !== upvKey && !optsUpdate?.forceCard);
        const goingForward = activeQSec >= (instance.lastUpvSec ?? -1);
        instance.lastUpvKey = upvKey;
        instance.lastUpvSec = activeQSec;

        if (upvCounter) {
          upvCounter.textContent = quotes.length
            ? `ช่วงคำพูด ${activeQuoteIdx + 1} / ${quotes.length}`
            : `Slide ${slide.id}/${TOTAL_SLIDES}`;
        }
        if (upvDots) {
          upvDots.classList.toggle("is-dense", quotes.length > 8);
          upvDots.innerHTML =
            quotes.length > 1 && quotes.length <= 16
              ? quotes
                  .map(
                    (qItem, qIdx) =>
                      `<button type="button" class="ep6-upv-dot ${qIdx === activeQuoteIdx ? "is-active" : qIdx < activeQuoteIdx ? "is-done" : ""}" data-upv-seek="${qItem.tSec}" title="ข้ามไปคำพูดช่วง ${esc(qItem.time)}" aria-label="คำพูดที่ ${qIdx + 1} (${esc(qItem.time)})"></button>`
                  )
                  .join("")
              : "";
          upvDots.querySelectorAll("[data-upv-seek]").forEach((dBtn) => {
            dBtn.addEventListener("click", (ev) => {
              ev.stopPropagation();
              seekToSecond(Number(dBtn.getAttribute("data-upv-seek")) || slide.startSec, true);
            });
          });
        }

        const nextHintTxt =
          activeQuoteIdx + 1 < quotes.length
            ? `ถัดไป ${quotes[activeQuoteIdx + 1].time} ↑`
            : nextSlide
            ? `ถัดไป Slide ${nextSlide.id} (${fmtTime(nextSlide.startSec)}) ↑`
            : "";

        const cardEl = document.createElement("blockquote");
        cardEl.className = `ep6-upv-card ${shouldAnimate ? (goingForward ? "is-enter-from-bottom" : "is-enter-from-top") : "is-current"}`;
        if (activeQ) {
          cardEl.setAttribute("data-seek-sec", String(activeQ.tSec));
          cardEl.title = `คลิกเพื่อฟังเสียงช่วง ${activeQ.time} ทันที`;
          cardEl.innerHTML = `
            <div class="ep6-upv-card-meta">
              <button type="button" class="ep6-quote-time is-live" data-seek-sec="${activeQ.tSec}">▶ ${esc(activeQ.time)}</button>
              <span class="ep6-upv-slide-chip">${esc(modCode)} · Slide ${slide.id}/${TOTAL_SLIDES}</span>
              ${nextHintTxt ? `<span class="ep6-upv-next-chip">${esc(nextHintTxt)}</span>` : ""}
            </div>
            <p class="ep6-upv-quote-text">“${esc(activeQ.text)}”</p>
          `;
          cardEl.addEventListener("click", (ev) => {
            ev.stopPropagation();
            seekToSecond(Number(activeQ.tSec) || slide.startSec, true);
          });
          cardEl.querySelector(".ep6-quote-time")?.addEventListener("click", (ev) => {
            ev.stopPropagation();
            seekToSecond(Number(activeQ.tSec) || slide.startSec, true);
          });
        } else {
          cardEl.innerHTML = `<p class="ep6-upv-quote-text">กำลังบรรยาย ${esc(slide.title)}</p>`;
        }

        if (shouldAnimate) {
          const prevCards = Array.from(upvStage.querySelectorAll(".ep6-upv-card"));
          prevCards.forEach((oldEl) => {
            oldEl.classList.remove("is-current", "is-enter-from-bottom", "is-enter-from-top");
            oldEl.classList.add(goingForward ? "is-exit-up" : "is-exit-down");
            setTimeout(() => {
              if (oldEl.parentNode === upvStage) oldEl.remove();
            }, 390);
          });
          upvStage.appendChild(cardEl);
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              cardEl.classList.remove("is-enter-from-bottom", "is-enter-from-top");
              cardEl.classList.add("is-current");
            });
          });
        } else {
          upvStage.replaceChildren(cardEl);
        }
      }

      // 6B. Update Right Column: Conceptualized ONLY + Separate Bottom Logical Flow Card
      const liveCard = root.querySelector("#ep6LiveConceptCard");
      const bridgePanel = root.querySelector("#ep6LiveBridgePanel");
      if ((liveCard || bridgePanel) && (slideChanged || optsUpdate?.forceCard || !liveCard?.dataset.renderedSlide)) {
        if (liveCard) liveCard.dataset.renderedSlide = String(slide.id);
        const modIdx = availableCodes.indexOf(modCode);
        const prevModCode = modIdx > 0 ? availableCodes[modIdx - 1] : null;
        const nextModCode = modIdx >= 0 && modIdx < availableCodes.length - 1 ? availableCodes[modIdx + 1] : null;

        const prevBridgeHtml = prevSlide
          ? `<button type="button" class="ep6-bridge-step is-prev is-clickable" data-jump-slide="${prevSlide.id}" title="คลิกเพื่อไปยัง Slide ${prevSlide.id}: ${esc(prevSlide.title)}">
               <div class="ep6-bridge-head">
                 <span class="ep6-bridge-lbl">← รับช่วงจาก Slide ${prevSlide.id}</span>
                 <span class="ep6-bridge-go-pill">ไปยัง Slide ${prevSlide.id} (${fmtTime(prevSlide.startSec)})</span>
               </div>
               <p>${esc(slide.logicalFlow?.fromPrev || "")}</p>
             </button>`
          : prevModCode
          ? `<button type="button" class="ep6-bridge-step is-prev is-clickable" data-switch-ep-mod="${prevModCode}">
               <div class="ep6-bridge-head">
                 <span class="ep6-bridge-lbl">← เชื่อมต่อจากคาบ ${esc(prevModCode)}</span>
                 <span class="ep6-bridge-go-pill">เปิดคาบ ${esc(prevModCode)}</span>
               </div>
               <p>${esc(slide.logicalFlow?.fromPrev || "")}</p>
             </button>`
          : `<div class="ep6-bridge-step is-prev">
               <div class="ep6-bridge-head">
                 <span class="ep6-bridge-lbl">จุดตั้งต้นคาบเรียน (${esc(modCode)} Slide 1)</span>
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
          : nextModCode
          ? `<button type="button" class="ep6-bridge-step is-next is-clickable" data-switch-ep-mod="${nextModCode}">
               <div class="ep6-bridge-head">
                 <span class="ep6-bridge-lbl">ส่งต่อไปยังคาบ ${esc(nextModCode)} →</span>
                 <span class="ep6-bridge-go-pill">เปิดคาบ ${esc(nextModCode)} →</span>
               </div>
               <p>${esc(slide.logicalFlow?.toNext || "")}</p>
             </button>`
          : `<div class="ep6-bridge-step is-next">
               <div class="ep6-bridge-head">
                 <span class="ep6-bridge-lbl">${esc(DATA.meta.completionBadge || "สรุปครบชุดบรรยายระบาดวิทยาคลินิก (EP4–EP9)")}</span>
               </div>
               <p>${esc(slide.logicalFlow?.toNext || "")}</p>
             </div>`;

        if (liveCard) {
          liveCard.innerHTML = `
            <div class="ep6-lc-head">
              <div class="ep6-lc-kicker">${esc(modCode)} · ประเด็น Conceptualized ขณะกำลังบรรยาย (Slide ${slide.id}/${TOTAL_SLIDES} · หน้า ${slide.deckSlideNo})</div>
              <h4 class="ep6-lc-title">${esc(slide.title)}</h4>
              <div class="ep6-lc-entitle">${esc(slide.enTitle || "")}</div>
              ${slide.revisitNotes ? `<div class="ep6-lc-revisit">🔄 ${esc(slide.revisitNotes)}</div>` : ""}
            </div>

            <div class="ep6-lc-thesis-box" id="ep6LiveThesisPanel">
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
          `;
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

        if (bridgePanel) {
          bridgePanel.innerHTML = `
            <div class="ep6-sec-head-inline">
              <div class="ep6-lc-sec-tag">🧭 การเชื่อมโยงตาม Logical Flow (คลิกปุ่มเพื่อข้ามสไลด์หรือเปลี่ยนคาบ)</div>
              <button type="button" class="ep6-inline-hide-btn" data-hide-panel="flow" title="ซ่อนส่วนการเชื่อมโยงตาม Logical Flow">ซ่อน ✕</button>
            </div>
            <div class="ep6-bridge-grid">
              ${prevBridgeHtml}
              ${nextBridgeHtml}
            </div>
          `;

          bridgePanel.querySelectorAll("[data-jump-slide]").forEach((btn) => {
            btn.addEventListener("click", (ev) => {
              ev.stopPropagation();
              const targetId = Number(btn.getAttribute("data-jump-slide"));
              if (targetId) {
                jumpToSlide(targetId, studioState.isPlaying);
              }
            });
          });

          bridgePanel.querySelectorAll("[data-switch-ep-mod]").forEach((btn) => {
            btn.addEventListener("click", (ev) => {
              ev.stopPropagation();
              const nextCode = btn.getAttribute("data-switch-ep-mod");
              if (nextCode && modules[nextCode]) {
                switchActiveModule(nextCode);
              }
            });
          });

          bridgePanel.querySelectorAll("[data-hide-panel]").forEach((btn) => {
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
      }

      // 7. Sync Timeline Ticks (✓) & Active Highlight in Slide Atlas + Auto-Scroll when Timeline Sync is ON
      syncAtlasTimelineTicks(clamped, slide.id, activeQuoteIdx);
      if (slideChanged && !optsUpdate?.skipAutoScroll && studioState.timelineSync && isUserInAtlasZone()) {
        scrollAtlasToSlide(slide.id, true);
      }
    }

    function isUserInAtlasZone() {
      if (!studioState.panels.atlas || studioState.atlasView !== "flow") return false;
      if (studioState.isPipActive || !studioState.panels.video) return true;
      const slot = root.querySelector("#ep6VideoSlot");
      if (!slot) return true;
      return slot.getBoundingClientRect().bottom < 160;
    }

    function scrollAtlasToSlide(targetSlideId, smooth) {
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
      let card = root.querySelector(`#ep6AtlasSlideCard-${targetSlideId}`);
      if (!card && (studioState.stageFilter !== 0 || studioState.searchQuery)) {
        studioState.stageFilter = 0;
        studioState.searchQuery = "";
        const stSel = root.querySelector("#ep6StageFilterSelect");
        const sIn = root.querySelector("#ep6SlideSearchInput");
        if (stSel) stSel.value = "0";
        if (sIn) sIn.value = "";
        renderAtlasBody();
        card = root.querySelector(`#ep6AtlasSlideCard-${targetSlideId}`);
      }
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const offsetTop = Math.max(84, Math.round(window.innerHeight * 0.13));
      const destY = Math.max(0, window.scrollY + rect.top - offsetTop);
      window.scrollTo({ top: destY, behavior: smooth === false ? "auto" : "smooth" });
    }

    function syncAtlasTimelineTicks(sec, activeSlId, activeQIdx) {
      root.querySelectorAll(".ep6-flow-slide-card").forEach((card) => {
        const cid = Number(card.getAttribute("data-slide-card"));
        const isCurrent = cid === activeSlId;
        const isDone = cid < activeSlId;
        card.classList.toggle("is-active-playing", isCurrent);
        card.classList.toggle("is-completed-slide", isDone);
        const badge = card.querySelector("[data-fsc-sync-badge]");
        if (badge) {
          if (isCurrent) {
            badge.textContent = "▶ กำลังเล่นช่วงนี้";
            badge.className = "ep6-fsc-sync-badge is-live";
            badge.hidden = false;
          } else if (isDone) {
            badge.textContent = "✓ ผ่านแล้ว";
            badge.className = "ep6-fsc-sync-badge is-done";
            badge.hidden = false;
          } else {
            badge.hidden = true;
          }
        }
        const qWrap = card.querySelector(".ep6-fsc-quotes");
        card.querySelectorAll(".ep6-fsc-qitem").forEach((qEl, qIdx) => {
          const qBtn = qEl.querySelector(".ep6-qtime-mini");
          const baseTime = qBtn ? qBtn.getAttribute("data-q-label") || "" : "";
          const qSpeaking = isCurrent && qIdx === activeQIdx;
          const qDone = isDone || (isCurrent && qIdx < activeQIdx);
          const wasSpeaking = qEl.classList.contains("is-speaking");
          qEl.classList.toggle("is-speaking", qSpeaking);
          qEl.classList.toggle("is-spoken-done", qDone);
          if (qBtn && baseTime) {
            qBtn.textContent = `${qDone ? "✓" : "▶"} ${baseTime}`;
          }
          if (
            qSpeaking &&
            !wasSpeaking &&
            studioState.timelineSync &&
            qWrap &&
            qWrap.classList.contains("is-scrollable-vq") &&
            !qWrap.classList.contains("is-expanded")
          ) {
            const relTop = qEl.offsetTop - qWrap.offsetTop - 28;
            qWrap.scrollTo({ top: Math.max(0, relTop), behavior: "smooth" });
          }
        });
      });
    }

    function syncTimelineSyncControls() {
      const on = Boolean(studioState.timelineSync);
      root.querySelectorAll("[data-timeline-sync-btn]").forEach((btn) => {
        btn.setAttribute("aria-pressed", String(on));
        if (btn.hasAttribute("data-pip-sync-pill")) {
          btn.classList.toggle("is-active", on);
          btn.textContent = on ? "✓ Sync" : "☐ Sync";
        } else {
          btn.classList.toggle("is-on", on);
          const box = btn.querySelector(".ep6-sync-box");
          if (box) box.textContent = on ? "✓" : "";
        }
      });
    }

    function syncTransportButtons() {
      const p1 = root.querySelector("#ep6DockPlayBtn");
      const p2 = root.querySelector("#ep6PlayPauseBtn");
      const dot1 = root.querySelector("#ep6LiveDot");
      const dot2 = root.querySelector("#ep6DockDot");
      const dot3 = root.querySelector("#ep6UpvDot");
      const ccBtn = root.querySelector("#ep6CcToggleBtn");
      const ccBox = root.querySelector("#ep6CcOverlay");
      const ccSizeBtn = root.querySelector("#ep6CcSizeBtn");
      const speedSel = root.querySelector("#ep6SpeedSelect");

      if (p1) p1.textContent = studioState.isPlaying ? "⏸ หยุด" : "▶ เล่น";
      if (p2) p2.textContent = studioState.isPlaying ? "⏸ หยุดชั่วคราว" : "▶ เล่นวิดีโอ";
      if (dot1) dot1.classList.toggle("is-playing", studioState.isPlaying);
      if (dot2) dot2.classList.toggle("is-playing", studioState.isPlaying);
      if (dot3) dot3.classList.toggle("is-playing", studioState.isPlaying);
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

    function seekToSecond(sec, autoPlay) {
      const target = Math.max(MIN_SEC, Math.min(MAX_SEC - 0.5, Number(sec) || MIN_SEC));
      const res = resolvePartForVirtualSec(target);
      instance.pendingSeekSec = target;
      instance.pendingLocalSeek = res.localSec;
      instance.pendingAutoPlay = Boolean(autoPlay);
      instance.pendingSeekUntil = performance.now() + 1100;
      updateLiveUI(target, { forceCard: true });
      if (videoEl) {
        try {
          if (res.partIdx !== instance.activePartIdx) {
            instance.activePartIdx = res.partIdx;
            videoEl.src = res.src;
            videoEl.load();
          } else {
            if (videoEl.readyState >= 1) {
              videoEl.currentTime = res.localSec;
            }
            videoEl.playbackRate = studioState.playbackSpeed;
            if (autoPlay) {
              if (videoEl.muted) videoEl.muted = false;
              const p = videoEl.play();
              if (p && typeof p.catch === "function") p.catch(() => {});
            }
          }
        } catch (_) {}
      }
    }

    function jumpToSlide(slideId, autoPlay) {
      const sl = getSlideById(DATA, Number(slideId) || 1);
      if (!sl) return;
      const seg = (DATA.timelineSegments || []).find((sg) => sg.slideId === sl.id);
      const exactSec = seg ? Math.max(MIN_SEC, seg.startSec + 0.4) : sl.startSec + 0.4;
      seekToSecond(exactSec, Boolean(autoPlay));
    }

    function skipBySeconds(deltaSec) {
      showSkipFlash(deltaSec);
      const base = studioState.currentSec;
      seekToSecond(base + deltaSec, studioState.isPlaying);
    }

    function switchActiveModule(nextCode) {
      if (!modules[nextCode] || nextCode === modCode) return;
      if (isMultiStandalone) {
        studioState.perBundleEpisode[standaloneCode] = nextCode;
        window.dispatchEvent(new CustomEvent("racm:epmodulechange", { detail: { moduleCode: nextCode } }));
        renderEpStudio(container, {
          ...opts,
          episodeCode: nextCode,
          initialSeekSec: undefined,
          autoPlay: false
        });
        return;
      }
      studioState.activeModule = nextCode;
      savePersistedPrefs();
      window.dispatchEvent(new CustomEvent("racm:epmodulechange", { detail: { moduleCode: nextCode } }));
      renderEpStudio(container, { ...opts, moduleCode: nextCode });
    }

    // Bind Native HTML5 <video> Events (Supports Both Single MP4 & Multi-Part Seamless Timeline)
    if (videoEl) {
      const getCurrentVirtualSec = () => {
        const pt = partsList[instance.activePartIdx] || partsList[0];
        return pt.startOffset + (Number(videoEl.currentTime) || 0);
      };
      const applyInitialVideoProps = () => {
        try {
          videoEl.playbackRate = studioState.playbackSpeed;
          const wantedLocal = instance.pendingLocalSeek != null
            ? instance.pendingLocalSeek
            : resolvePartForVirtualSec(studioState.currentSec).localSec;
          if (wantedLocal > 0 && Math.abs(videoEl.currentTime - wantedLocal) > 0.4) {
            videoEl.currentTime = wantedLocal;
          }
          if (instance.pendingAutoPlay) {
            instance.pendingAutoPlay = false;
            if (videoEl.muted) videoEl.muted = false;
            const p = videoEl.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          }
        } catch (_) {}
      };
      videoEl.addEventListener("loadedmetadata", applyInitialVideoProps);
      videoEl.addEventListener("play", () => {
        studioState.isPlaying = true;
        videoEl.playbackRate = studioState.playbackSpeed;
        syncTransportButtons();
        if (studioState.timelineSync && isUserInAtlasZone()) {
          const card = root.querySelector(`#ep6AtlasSlideCard-${studioState.activeSlideId}`);
          if (card) {
            const r = card.getBoundingClientRect();
            if (r.top < 40 || r.top > window.innerHeight * 0.62) {
              scrollAtlasToSlide(studioState.activeSlideId, true);
            }
          }
        }
      });
      videoEl.addEventListener("pause", () => {
        if (instance.pendingAutoPlay) return;
        studioState.isPlaying = false;
        syncTransportButtons();
      });
      videoEl.addEventListener("ended", () => {
        if (instance.activePartIdx < partsList.length - 1) {
          const nextIdx = instance.activePartIdx + 1;
          instance.activePartIdx = nextIdx;
          instance.pendingLocalSeek = 0;
          instance.pendingAutoPlay = true;
          instance.pendingSeekSec = partsList[nextIdx].startOffset;
          instance.pendingSeekUntil = performance.now() + 1100;
          videoEl.src = partsList[nextIdx].src;
          videoEl.load();
          return;
        }
        studioState.isPlaying = false;
        syncTransportButtons();
      });
      videoEl.addEventListener("ratechange", () => {
        if (videoEl.playbackRate && SPEEDS.includes(videoEl.playbackRate)) {
          studioState.playbackSpeed = videoEl.playbackRate;
          syncTransportButtons();
        }
      });
      videoEl.addEventListener("timeupdate", () => {
        if (!Number.isNaN(videoEl.currentTime)) {
          const vSec = getCurrentVirtualSec();
          if (
            instance.pendingSeekUntil &&
            performance.now() < instance.pendingSeekUntil &&
            Math.abs(vSec - instance.pendingSeekSec) > 3.5
          ) {
            return;
          }
          updateLiveUI(vSec);
        }
      });
      videoEl.addEventListener("seeked", () => {
        if (!Number.isNaN(videoEl.currentTime)) {
          const vSec = getCurrentVirtualSec();
          if (
            instance.pendingSeekUntil &&
            performance.now() < instance.pendingSeekUntil &&
            videoEl.currentTime < 0.5 &&
            (instance.pendingLocalSeek || 0) > 2
          ) {
            return;
          }
          instance.pendingSeekUntil = 0;
          updateLiveUI(vSec, { forceCard: true });
        }
      });
    }

    function showPipSizeFlash(wPx) {
      const el = root.querySelector("#ep6SkipFlash");
      if (!el) return;
      const pct = Math.round((wPx / 400) * 100);
      el.textContent = `🔍 ขนาด PiP ${pct}% (${Math.round(wPx)}px)`;
      el.className = "ep6-skip-flash is-left";
      el.hidden = false;
      if (instance.flashTimer) clearTimeout(instance.flashTimer);
      instance.flashTimer = setTimeout(() => {
        el.hidden = true;
      }, 750);
    }

    function clampPipWidth(wantedW) {
      const vw = Math.max(320, window.innerWidth || 1280);
      const minW = Math.min(250, vw - 16);
      const maxW = Math.max(minW, Math.min(920, vw - 16));
      return Math.round(Math.max(minW, Math.min(maxW, Number(wantedW) || 400)));
    }

    function clearPipInlineGeometry(dock) {
      if (!dock) return;
      dock.style.width = "";
      dock.style.maxWidth = "";
      dock.style.left = "";
      dock.style.top = "";
      dock.style.right = "";
      dock.style.bottom = "";
    }

    function applyPipGeometry() {
      const dock = root.querySelector("#ep6VideoDock");
      if (!dock || !studioState.isPipActive) return;
      const vw = Math.max(320, window.innerWidth || 1280);
      const vh = Math.max(320, window.innerHeight || 800);
      const cw = clampPipWidth(studioState.pipWidth);
      studioState.pipWidth = cw;
      dock.style.width = `${cw}px`;
      dock.style.maxWidth = "calc(100vw - 16px)";

      if (studioState.pipCustomPos && typeof studioState.pipCustomPos.x === "number") {
        const estH = Math.min(vh - 16, Math.max(64, dock.offsetHeight || Math.round(cw * 0.68)));
        const cx = Math.round(Math.max(8, Math.min(vw - cw - 8, studioState.pipCustomPos.x)));
        const cy = Math.round(Math.max(8, Math.min(vh - estH - 8, studioState.pipCustomPos.y)));
        studioState.pipCustomPos = { x: cx, y: cy };
        dock.style.left = `${cx}px`;
        dock.style.top = `${cy}px`;
        dock.style.right = "auto";
        dock.style.bottom = "auto";
      } else {
        dock.style.left = "";
        dock.style.top = "";
        dock.style.right = "";
        dock.style.bottom = "";
      }
    }

    // Seamless Floating Picture-in-Picture (PiP) Controller — Never moves <video> in DOM!
    function applyPipMode(enablePip) {
      const slot = root.querySelector("#ep6VideoSlot");
      const dock = root.querySelector("#ep6VideoDock");
      const ph = root.querySelector("#ep6PipPlaceholder");
      const pinBtn = root.querySelector("#ep6PinPipBtn");
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
          if (
            studioState.timelineSync &&
            studioState.isPlaying &&
            instance.lastPipAutoScrolledSlide !== studioState.activeSlideId
          ) {
            instance.lastPipAutoScrolledSlide = studioState.activeSlideId;
            const activeCard = root.querySelector(`#ep6AtlasSlideCard-${studioState.activeSlideId}`);
            if (activeCard) {
              const r = activeCard.getBoundingClientRect();
              if (r.top < 30 || r.top > window.innerHeight * 0.65) {
                setTimeout(() => {
                  if (studioState.isPipActive && studioState.timelineSync) {
                    scrollAtlasToSlide(studioState.activeSlideId, true);
                  }
                }, 80);
              }
            }
          }
        }
        dock.classList.add("is-pip-floating");
        dock.classList.toggle("is-pip-left", !studioState.pipCustomPos && studioState.pipCorner === "left");
        dock.classList.toggle("is-pip-minimized", studioState.isPipMinimized);
        applyPipGeometry();
        if (minBtn) minBtn.textContent = studioState.isPipMinimized ? "▢ ขยาย" : "—";
        if (ph) ph.hidden = false;
        if (restorePill) restorePill.hidden = true;
      } else {
        studioState.isPipActive = false;
        studioState.isPipMinimized = false;
        dock.classList.remove("is-pip-floating", "is-pip-minimized", "is-pip-dragging");
        clearPipInlineGeometry(dock);
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
              <h4>ตารางสังเคราะห์กรอบแนวคิด ตัวชี้วัด และจุดเน้นออกสอบประจำคาบ ${esc(modCode)}${DATA.meta.examWeight ? ` (สอบ ${esc(DATA.meta.examWeight)})` : ""}</h4>
              <p>สรุปเปรียบเทียบโครงสร้างแนวคิด ตัวชี้วัด และข้อควรระวังในการวิเคราะห์จากคำสอนของอาจารย์</p>
            </div>
            <div class="ep6-matrix-table-wrap">
              <table class="ep6-matrix-table">
                <thead>
                  <tr>
                    <th>หัวข้อ / ตัวชี้วัด (Concept / Metric)</th>
                    <th>สูตร / โครงสร้างหลัก</th>
                    <th>หมวดหมู่</th>
                    <th>แก่นแนวคิดและจุดเน้นออกสอบ</th>
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
          .map((id) => getSlideById(DATA, id))
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
                <span class="ep6-sb-pill">${esc(modCode)} · ${esc(st.code)} · ${esc(st.rangeLabel)}</span>
                <button type="button" class="btn sm" data-atlas-seek="${st.startSec}">▶ เล่นตั้งแต่องก์นี้ (${fmtTime(st.startSec)})</button>
              </div>
              <h4 class="ep6-sb-title">${esc(st.title)} <span class="ep6-sb-en">(${esc(st.enTitle)})</span></h4>
              <p class="ep6-sb-question"><strong>คำถามนำขององก์:</strong> ${esc(st.guidingQuestion)}</p>
              <p class="ep6-sb-thesis"><strong>แก่นความคิดรวบยอด:</strong> ${esc(st.coreThesis)}</p>
            </div>

            <div class="ep6-slides-flow-list">
              ${stageSlides
                .map((sl) => {
                  const prevSl = sl.id > 1 ? getSlideById(DATA, sl.id - 1) : null;
                  const nextSl = sl.id < TOTAL_SLIDES ? getSlideById(DATA, sl.id + 1) : null;
                  return `
                <article class="ep6-flow-slide-card ${sl.id === studioState.activeSlideId ? "is-active-playing" : sl.id < studioState.activeSlideId ? "is-completed-slide" : ""}" id="ep6AtlasSlideCard-${sl.id}" data-slide-card="${sl.id}">
                  <div class="ep6-fsc-left">
                    <div class="ep6-fsc-meta">
                      <span class="ep6-fsc-num">Slide ${sl.id} / ${TOTAL_SLIDES} <small>(หน้า ${sl.deckSlideNo})</small></span>
                      <span class="ep6-fsc-sync-badge ${sl.id === studioState.activeSlideId ? "is-live" : sl.id < studioState.activeSlideId ? "is-done" : ""}" data-fsc-sync-badge="${sl.id}" ${sl.id <= studioState.activeSlideId ? "" : "hidden"}>${sl.id === studioState.activeSlideId ? "▶ กำลังเล่นช่วงนี้" : "✓ ผ่านแล้ว"}</span>
                      <button type="button" class="ep6-play-chip" data-atlas-seek="${sl.startSec}">▶ ${esc(sl.timeLabel)}</button>
                    </div>
                    <div class="ep6-fsc-thumb" data-zoom-slide="${sl.id}" title="คลิกเพื่อขยายภาพสไลด์ขนาดเต็ม">
                      <img src="${esc(getSlideImg(sl))}" alt="Slide ${sl.id}: ${esc(sl.title)}" loading="lazy">
                      <span class="ep6-thumb-zoom-hint">🔍 ขยายสไลด์</span>
                    </div>
                  </div>

                  <div class="ep6-fsc-mid">
                    <div class="ep6-fsc-col-label">① Verbatim Quotation ครบตาม CC (${(sl.verbatimQuotes || []).length} ช่วงต่อเนื่อง)</div>
                    <h5 class="ep6-fsc-title">${esc(sl.title)}</h5>
                    <div class="ep6-fsc-quotes ${(sl.verbatimQuotes || []).length > 6 ? "is-scrollable-vq" : ""}" id="ep6AtlasVqWrap-${sl.id}">
                      ${(sl.verbatimQuotes || [])
                        .map(
                          (vq) => `
                        <div class="ep6-fsc-qitem" data-q-sec="${vq.tSec}">
                          <button type="button" class="ep6-qtime-mini" data-atlas-seek="${vq.tSec}" data-q-label="${esc(vq.time)}">▶ ${esc(vq.time)}</button>
                          <span>“${esc(vq.text)}”</span>
                        </div>
                      `
                        )
                        .join("")}
                    </div>
                    ${(sl.verbatimQuotes || []).length > 6 ? `<button type="button" class="ep6-fsc-expand-vq-btn" data-expand-vq="${sl.id}">↕ กางดูคำพูดทั้งหมด (${(sl.verbatimQuotes || []).length} ช่วง)</button>` : ""}
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
          const targetSl = getSlideById(DATA, targetId);
          if (!targetSl) return;
          jumpToSlide(targetSl.id, studioState.isPlaying);
          const targetCard = root.querySelector(`#ep6AtlasSlideCard-${targetSl.id}`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      });

      body.querySelectorAll("[data-zoom-slide]").forEach((el) => {
        el.addEventListener("click", () => {
          const sl = getSlideById(DATA, Number(el.getAttribute("data-zoom-slide")));
          openSlideLightbox(
            getSlideImg(sl),
            `${modCode} · Slide ${sl.id}/${TOTAL_SLIDES} (หน้า ${sl.deckSlideNo} · ${sl.timeLabel}) — ${sl.title}`
          );
        });
      });

      body.querySelectorAll("[data-expand-vq]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const sid = btn.getAttribute("data-expand-vq");
          const wrap = root.querySelector(`#ep6AtlasVqWrap-${sid}`);
          if (!wrap) return;
          const expanded = wrap.classList.toggle("is-expanded");
          const count = wrap.querySelectorAll(".ep6-fsc-qitem").length;
          btn.textContent = expanded ? "▴ ย่อกล่องคำพูด" : `↕ กางดูคำพูดทั้งหมด (${count} ช่วง)`;
        });
      });

      const curSl = getSlideById(DATA, studioState.activeSlideId);
      const curQuotes = (curSl && curSl.verbatimQuotes) || [];
      let curQIdx = 0;
      for (let i = 0; i < curQuotes.length; i++) {
        if (studioState.currentSec >= curQuotes[i].tSec - 0.12) curQIdx = i;
      }
      syncAtlasTimelineTicks(studioState.currentSec, studioState.activeSlideId, curQIdx);
    }

    // Wire Module Switcher Cards
    root.querySelectorAll(".ep6-module-switcher [data-switch-ep-mod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextCode = btn.getAttribute("data-switch-ep-mod");
        if (nextCode) switchActiveModule(nextCode);
      });
    });

    // Wire Layout Mode & Hide/Unhide Section Controls
    root.querySelectorAll("[data-layout-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        studioState.layoutMode = btn.getAttribute("data-layout-mode") || "balanced";
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
      studioState.layoutMode = "balanced";
      studioState.timelineSync = true;
      studioState.pipWidth = 400;
      studioState.pipCustomPos = null;
      studioState.panels = { ...DEFAULT_PANELS };
      syncTimelineSyncControls();
      applyWorkspaceLayout();
      if (studioState.isPipActive) applyPipGeometry();
    });

    root.querySelectorAll("[data-timeline-sync-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        studioState.timelineSync = !studioState.timelineSync;
        syncTimelineSyncControls();
        savePersistedPrefs();
        if (
          studioState.timelineSync &&
          (btn.hasAttribute("data-atlas-sync-trigger") || btn.hasAttribute("data-pip-sync-pill") || isUserInAtlasZone())
        ) {
          scrollAtlasToSlide(studioState.activeSlideId, true);
        }
      });
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
        const st = getStageById(DATA, Number(btn.getAttribute("data-stage-jump")));
        if (st && st.slideIds && st.slideIds.length) {
          jumpToSlide(st.slideIds[0], true);
        }
      });
    });

    // Wire Slide Zoom
    const zoomHandler = () => {
      const sl = getSlideById(DATA, studioState.activeSlideId);
      openSlideLightbox(
        getSlideImg(sl),
        `${modCode} · Slide ${sl.id}/${TOTAL_SLIDES} (หน้า ${sl.deckSlideNo} · ${sl.timeLabel}) — ${sl.title}`
      );
    };
    root.querySelector("#ep6ZoomCurrentSlideBtn")?.addEventListener("click", zoomHandler);
    root.querySelector("#ep6SyncSlideImgWrap")?.addEventListener("click", zoomHandler);

    // Wire Play/Pause, ±10s, Prev/Next Slide, CC, Speed, Fullscreen
    const togglePlayPause = () => {
      if (!videoEl) return;
      if (videoEl.paused) {
        if (videoEl.muted) videoEl.muted = false;
        videoEl.playbackRate = studioState.playbackSpeed;
        const p = videoEl.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } else {
        videoEl.pause();
      }
    };

    const goPrevSlide = () => {
      const prevId = Math.max(1, studioState.activeSlideId - 1);
      jumpToSlide(prevId, studioState.isPlaying);
    };
    const goNextSlide = () => {
      const nextId = Math.min(TOTAL_SLIDES, studioState.activeSlideId + 1);
      jumpToSlide(nextId, studioState.isPlaying);
    };

    // Step across Verbatim Quotes chronologically (Under-Player ▲ / ▼ controls)
    const stepVerbatimQuote = (dir) => {
      const allQuotes = [];
      (DATA.slides || []).forEach((sl) => {
        (sl.verbatimQuotes || []).forEach((vq, qIdx) => {
          allQuotes.push({ slideId: sl.id, qIdx, tSec: Number(vq.tSec) || sl.startSec });
        });
      });
      allQuotes.sort((a, b) => a.tSec - b.tSec);
      if (!allQuotes.length) return;
      let curFlatIdx = 0;
      for (let i = 0; i < allQuotes.length; i++) {
        if (studioState.currentSec >= allQuotes[i].tSec - 0.12) {
          curFlatIdx = i;
        }
      }
      const nextFlatIdx = Math.max(0, Math.min(allQuotes.length - 1, curFlatIdx + dir));
      seekToSecond(allQuotes[nextFlatIdx].tSec + 0.08, true);
    };
    root.querySelector("#ep6UpvPrevBtn")?.addEventListener("click", () => stepVerbatimQuote(-1));
    root.querySelector("#ep6UpvNextBtn")?.addEventListener("click", () => stepVerbatimQuote(1));

    root.querySelector("#ep6DockPlayBtn")?.addEventListener("click", togglePlayPause);
    root.querySelector("#ep6PlayPauseBtn")?.addEventListener("click", togglePlayPause);
    root.querySelector("#ep6DockRew15Btn")?.addEventListener("click", () => skipBySeconds(-10));
    root.querySelector("#ep6Rew15Btn")?.addEventListener("click", () => skipBySeconds(-10));
    root.querySelector("#ep6DockFwd15Btn")?.addEventListener("click", () => skipBySeconds(10));
    root.querySelector("#ep6Fwd15Btn")?.addEventListener("click", () => skipBySeconds(10));
    root.querySelector("#ep6PrevSlideBtn")?.addEventListener("click", goPrevSlide);
    root.querySelector("#ep6NextSlideBtn")?.addEventListener("click", goNextSlide);
    root.querySelector("#ep6PipPrevSlideBtn")?.addEventListener("click", goPrevSlide);
    root.querySelector("#ep6PipNextSlideBtn")?.addEventListener("click", goNextSlide);

    root.querySelector("#ep6CcToggleBtn")?.addEventListener("click", () => {
      studioState.ccEnabled = !studioState.ccEnabled;
      syncTransportButtons();
    });

    root.querySelector("#ep6CcSizeBtn")?.addEventListener("click", () => {
      studioState.ccLarge = !studioState.ccLarge;
      syncTransportButtons();
    });

    root.querySelector("#ep6SpeedSelect")?.addEventListener("change", (ev) => {
      const sp = Number(ev.target.value) || 1;
      studioState.playbackSpeed = sp;
      if (videoEl) videoEl.playbackRate = sp;
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

    root.querySelector("#ep6BrowserPipBtn")?.addEventListener("click", async () => {
      if (!videoEl) return;
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (typeof videoEl.requestPictureInPicture === "function") {
          await videoEl.requestPictureInPicture();
        } else {
          studioState.manualPipPinned = true;
          applyPipMode(true);
        }
      } catch (_) {
        studioState.manualPipPinned = true;
        applyPipMode(true);
      }
    });

    // Wire Floating PiP Controls
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
      studioState.pipCustomPos = null;
      studioState.pipCorner = studioState.pipCorner === "left" ? "right" : "left";
      const dock = root.querySelector("#ep6VideoDock");
      if (dock) {
        dock.classList.toggle("is-pip-left", studioState.pipCorner === "left");
        applyPipGeometry();
      }
      savePersistedPrefs();
    });

    const zoomPipByDelta = (deltaPx) => {
      if (!studioState.isPipActive) return;
      const dock = root.querySelector("#ep6VideoDock");
      if (!dock) return;
      const rect = dock.getBoundingClientRect();
      const nextW = clampPipWidth((studioState.pipWidth || rect.width || 400) + deltaPx);
      if (studioState.pipCustomPos) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const scale = nextW / Math.max(1, rect.width);
        studioState.pipCustomPos = {
          x: cx - nextW / 2,
          y: cy - (rect.height * scale) / 2
        };
      }
      studioState.pipWidth = nextW;
      applyPipGeometry();
      showPipSizeFlash(nextW);
      savePersistedPrefs();
    };
    root.querySelector("#ep6PipZoomOutBtn")?.addEventListener("click", () => zoomPipByDelta(-60));
    root.querySelector("#ep6PipZoomInBtn")?.addEventListener("click", () => zoomPipByDelta(60));

    root.querySelector("#ep6PipMinBtn")?.addEventListener("click", () => {
      studioState.isPipMinimized = !studioState.isPipMinimized;
      const dock = root.querySelector("#ep6VideoDock");
      const minBtn = root.querySelector("#ep6PipMinBtn");
      if (dock) {
        dock.classList.toggle("is-pip-minimized", studioState.isPipMinimized);
        applyPipGeometry();
      }
      if (minBtn) minBtn.textContent = studioState.isPipMinimized ? "▢ ขยาย" : "—";
    });

    // Free Drag-to-Move + 2-Finger Pinch-Out + Trackpad Pinch + 4-Corner Resize for Floating PiP
    let cleanupPipDragListeners = null;
    (function setupFloatingPipGestures() {
      const dock = root.querySelector("#ep6VideoDock");
      if (!dock) return;

      let activeMode = null; // 'move' | 'resize' | 'pinch'
      let startX = 0;
      let startY = 0;
      let startRect = null;
      let resizeDir = "br";
      let movedEnough = false;
      let pinchDist0 = 0;
      let pinchMidX0 = 0;
      let pinchMidY0 = 0;
      let pinchAnchorRx = 0.5;
      let pinchAnchorRy = 0.5;

      const endPointerGesture = () => {
        if (activeMode === "move" || activeMode === "resize") {
          activeMode = null;
          dock.classList.remove("is-pip-dragging");
          window.removeEventListener("pointermove", onWinPointerMove);
          window.removeEventListener("pointerup", endPointerGesture);
          window.removeEventListener("pointercancel", endPointerGesture);
          savePersistedPrefs();
        }
      };

      const onWinPointerMove = (ev) => {
        if (!studioState.isPipActive || !startRect) {
          endPointerGesture();
          return;
        }
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!movedEnough && Math.hypot(dx, dy) < 3) return;
        movedEnough = true;
        dock.classList.add("is-pip-dragging");
        dock.classList.remove("is-pip-left");

        if (activeMode === "move") {
          studioState.pipCustomPos = {
            x: startRect.left + dx,
            y: startRect.top + dy
          };
          applyPipGeometry();
        } else if (activeMode === "resize") {
          const signX = resizeDir.includes("l") ? -1 : 1;
          const signY = resizeDir.includes("t") ? -1 : 1;
          const deltaFromAspect = (signX * dx + signY * dy * (16 / 10)) * 0.65;
          const nextW = clampPipWidth(startRect.width + deltaFromAspect);
          const ratio = nextW / Math.max(1, startRect.width);
          const nextH = startRect.height * ratio;
          const nextLeft = resizeDir.includes("l") ? startRect.right - nextW : startRect.left;
          const nextTop = resizeDir.includes("t") ? startRect.bottom - nextH : startRect.top;
          studioState.pipWidth = nextW;
          studioState.pipCustomPos = { x: nextLeft, y: nextTop };
          applyPipGeometry();
          showPipSizeFlash(nextW);
        }
      };

      // 1) Corner Handle Drag-Resize
      dock.querySelectorAll("[data-pip-resize]").forEach((handle) => {
        handle.addEventListener("pointerdown", (ev) => {
          if (!studioState.isPipActive) return;
          ev.preventDefault();
          ev.stopPropagation();
          activeMode = "resize";
          resizeDir = handle.getAttribute("data-pip-resize") || "br";
          startX = ev.clientX;
          startY = ev.clientY;
          startRect = dock.getBoundingClientRect();
          movedEnough = true;
          dock.classList.add("is-pip-dragging");
          window.addEventListener("pointermove", onWinPointerMove);
          window.addEventListener("pointerup", endPointerGesture);
          window.addEventListener("pointercancel", endPointerGesture);
        });
      });

      // 2) Header & CC Strip Free Drag-to-Move
      const startMoveFromBar = (ev) => {
        if (!studioState.isPipActive) return;
        if (ev.pointerType === "mouse" && ev.button !== 0) return;
        if (ev.target.closest("button, select, input, a, [data-pip-resize]")) return;
        activeMode = "move";
        startX = ev.clientX;
        startY = ev.clientY;
        startRect = dock.getBoundingClientRect();
        movedEnough = false;
        window.addEventListener("pointermove", onWinPointerMove);
        window.addEventListener("pointerup", endPointerGesture);
        window.addEventListener("pointercancel", endPointerGesture);
      };
      dock.querySelector("#ep6VdockHead")?.addEventListener("pointerdown", startMoveFromBar);
      dock.querySelector("#ep6CcOverlay")?.addEventListener("pointerdown", startMoveFromBar);

      // Double-click PiP header to reset size & snap back to corner
      dock.querySelector("#ep6VdockHead")?.addEventListener("dblclick", (ev) => {
        if (!studioState.isPipActive || ev.target.closest("button, select, input, a")) return;
        studioState.pipWidth = 400;
        studioState.pipCustomPos = null;
        dock.classList.toggle("is-pip-left", studioState.pipCorner === "left");
        applyPipGeometry();
        showPipSizeFlash(400);
        savePersistedPrefs();
      });

      // 3) True 2-Finger Touch Pinch-Out / Pinch-In + Simultaneous 2-Finger Pan
      dock.addEventListener(
        "touchstart",
        (ev) => {
          if (!studioState.isPipActive || ev.touches.length < 2) return;
          endPointerGesture();
          ev.preventDefault();
          const t0 = ev.touches[0];
          const t1 = ev.touches[1];
          pinchDist0 = Math.max(24, Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY));
          pinchMidX0 = (t0.clientX + t1.clientX) / 2;
          pinchMidY0 = (t0.clientY + t1.clientY) / 2;
          startRect = dock.getBoundingClientRect();
          pinchAnchorRx = Math.max(0, Math.min(1, (pinchMidX0 - startRect.left) / Math.max(1, startRect.width)));
          pinchAnchorRy = Math.max(0, Math.min(1, (pinchMidY0 - startRect.top) / Math.max(1, startRect.height)));
          activeMode = "pinch";
          dock.classList.add("is-pip-dragging");
          dock.classList.remove("is-pip-left");
        },
        { passive: false }
      );

      dock.addEventListener(
        "touchmove",
        (ev) => {
          if (!studioState.isPipActive || activeMode !== "pinch" || ev.touches.length < 2 || !startRect) return;
          ev.preventDefault();
          const t0 = ev.touches[0];
          const t1 = ev.touches[1];
          const distNow = Math.max(20, Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY));
          const midXNow = (t0.clientX + t1.clientX) / 2;
          const midYNow = (t0.clientY + t1.clientY) / 2;
          const rawScale = distNow / pinchDist0;
          const nextW = clampPipWidth(startRect.width * rawScale);
          const effScale = nextW / Math.max(1, startRect.width);
          const nextH = startRect.height * effScale;
          studioState.pipWidth = nextW;
          studioState.pipCustomPos = {
            x: midXNow - pinchAnchorRx * nextW,
            y: midYNow - pinchAnchorRy * nextH
          };
          applyPipGeometry();
          showPipSizeFlash(nextW);
        },
        { passive: false }
      );

      const endPinch = (ev) => {
        if (activeMode === "pinch" && (!ev.touches || ev.touches.length < 2)) {
          activeMode = null;
          dock.classList.remove("is-pip-dragging");
          savePersistedPrefs();
        }
      };
      dock.addEventListener("touchend", endPinch);
      dock.addEventListener("touchcancel", endPinch);

      // 4) Trackpad Pinch-Out / Pinch-In (Ctrl + Wheel on Chrome/Edge/Firefox & Safari GestureEvents)
      dock.addEventListener(
        "wheel",
        (ev) => {
          if (!studioState.isPipActive || !ev.ctrlKey) return;
          ev.preventDefault();
          ev.stopPropagation();
          const rect = dock.getBoundingClientRect();
          const factor = Math.exp(-ev.deltaY * 0.0085);
          const nextW = clampPipWidth(rect.width * factor);
          const effScale = nextW / Math.max(1, rect.width);
          const nextH = rect.height * effScale;
          const rx = Math.max(0, Math.min(1, (ev.clientX - rect.left) / Math.max(1, rect.width)));
          const ry = Math.max(0, Math.min(1, (ev.clientY - rect.top) / Math.max(1, rect.height)));
          dock.classList.remove("is-pip-left");
          studioState.pipWidth = nextW;
          studioState.pipCustomPos = {
            x: ev.clientX - rx * nextW,
            y: ev.clientY - ry * nextH
          };
          applyPipGeometry();
          showPipSizeFlash(nextW);
          savePersistedPrefs();
        },
        { passive: false }
      );

      let safariStartRect = null;
      dock.addEventListener("gesturestart", (ev) => {
        if (!studioState.isPipActive) return;
        ev.preventDefault();
        safariStartRect = dock.getBoundingClientRect();
        dock.classList.add("is-pip-dragging");
      });
      dock.addEventListener("gesturechange", (ev) => {
        if (!studioState.isPipActive || !safariStartRect) return;
        ev.preventDefault();
        const nextW = clampPipWidth(safariStartRect.width * (Number(ev.scale) || 1));
        const effScale = nextW / Math.max(1, safariStartRect.width);
        const cx = safariStartRect.left + safariStartRect.width / 2;
        const cy = safariStartRect.top + safariStartRect.height / 2;
        dock.classList.remove("is-pip-left");
        studioState.pipWidth = nextW;
        studioState.pipCustomPos = {
          x: cx - nextW / 2,
          y: cy - (safariStartRect.height * effScale) / 2
        };
        applyPipGeometry();
        showPipSizeFlash(nextW);
      });
      dock.addEventListener("gestureend", () => {
        safariStartRect = null;
        dock.classList.remove("is-pip-dragging");
        savePersistedPrefs();
      });

      cleanupPipDragListeners = endPointerGesture;
    })();

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

    // Explicit click-only button to jump down to active slide in the Atlas & enable Timeline Sync
    root.querySelector("#ep6JumpToActiveCardBtn")?.addEventListener("click", () => {
      studioState.timelineSync = true;
      syncTimelineSyncControls();
      savePersistedPrefs();
      scrollAtlasToSlide(studioState.activeSlideId, true);
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
          const sl = getSlideById(DATA, findSlideAtTime(DATA, hoverSec));
          const rect = track.getBoundingClientRect();
          const leftPx = Math.max(60, Math.min(rect.width - 60, e.clientX - rect.left));
          tooltip.style.left = `${leftPx}px`;
          tooltip.textContent = `${fmtTime(hoverSec)} · Slide ${sl.id}: ${sl.title.slice(0, 48)}`;
          tooltip.hidden = false;
        }
        if (dragging) {
          updateLiveUI(hoverSec, { forceCard: true, skipAutoScroll: true });
        }
      });
      track.addEventListener("pointerup", (e) => {
        if (dragging) {
          dragging = false;
          seekToSecond(secFromPointer(e.clientX), studioState.isPlaying);
        }
      });
      track.addEventListener("pointerleave", () => {
        if (tooltip) tooltip.hidden = true;
      });
      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
          skipBySeconds(10);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          skipBySeconds(-10);
        }
      });
    }

    // Keyboard shortcuts inside Studio (J / ← = -10s, K = Play/Pause, L / → = +10s, C = CC)
    root.addEventListener("keydown", (e) => {
      const tag = (e.target && e.target.tagName ? e.target.tagName : "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || tag === "video") return;
      if (e.key === "j" || e.key === "J" || e.key === "ArrowLeft") {
        e.preventDefault();
        skipBySeconds(-10);
      } else if (e.key === "l" || e.key === "L" || e.key === "ArrowRight") {
        e.preventDefault();
        skipBySeconds(10);
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

    // Passive window scroll/resize listener for Auto-PiP & Viewport Clamping
    let scrollRaf = 0;
    const onScrollOrResize = () => {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        evaluateScrollPiP();
        if (studioState.isPipActive) {
          applyPipGeometry();
        }
      });
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    instance.cleanupListeners = () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (cleanupPipDragListeners) cleanupPipDragListeners();
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
    };

    // Initial render
    renderAtlasBody();
    syncTimelineSyncControls();
    applyWorkspaceLayout();
    updateLiveUI(studioState.currentSec, { forceCard: true, skipAutoScroll: true });
    syncTransportButtons();
  }

  const studioApi = {
    render: renderEpStudio,
    setModule: (code) => {
      const modules = getModulesMap();
      if (modules[code]) {
        studioState.activeModule = code;
        savePersistedPrefs();
        if (activeInstance && activeInstance.container && activeInstance.container.isConnected) {
          renderEpStudio(activeInstance.container, { ...activeInstance.opts, moduleCode: code });
        }
      }
    },
    getState: () => studioState,
    destroy: destroyActiveTimers,
    destroyIfInside: (hostEl) => {
      if (activeInstance && activeInstance.container && hostEl && hostEl.contains(activeInstance.container)) {
        destroyActiveTimers();
      }
    }
  };

  window.RACM303_EP6_STUDIO = studioApi;
  window.RACM303_EP_STUDIO = studioApi;
})();
