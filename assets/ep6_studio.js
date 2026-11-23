/* ==========================================================================
   RACM 303 — EP6: Measures of Morbidity & Mortality Interactive Lecture Studio
   Synchronized YouTube Playback + 43 Captured Slides + Verbatim Quotations
   -> Conceptualized Insights Organized by 5-Stage Logical Flow
   ========================================================================== */
(function () {
  "use strict";

  const DATA = window.RACM303_EP6_MORBIDITY;
  if (!DATA) return;

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
        try { prev(); } catch (_) {}
      }
      while (ytReadyCallbacks.length) {
        const fn = ytReadyCallbacks.shift();
        try { fn(); } catch (_) {}
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

  // Studio singleton state so switching filters preserves position & preferences
  const studioState = {
    currentSec: DATA.meta.startSec || 4,
    activeSlideId: 1,
    activeStageId: 1,
    imgQuality: "hd", // 'hd' | 'yt'
    theaterMode: "split", // 'split' | 'video' | 'slides'
    atlasView: "flow", // 'flow' | 'matrix'
    stageFilter: 0, // 0 = all stages, 1..5 = specific stage
    searchQuery: "",
    autoScrollCards: false,
    simPlaying: false,
    simSpeed: 1,
    ytError: false,
    ytPlaying: false
  };

  let activeInstance = null;

  function findSlideAtTime(sec) {
    const t = Math.max(DATA.meta.startSec, Math.min(DATA.meta.endSec, Number(sec) || 4));
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

  function getSlideImg(slide) {
    return studioState.imgQuality === "yt" ? slide.ytImg : slide.hdImg;
  }

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
    if (activeInstance.ytPlayer && typeof activeInstance.ytPlayer.destroy === "function") {
      try { activeInstance.ytPlayer.destroy(); } catch (_) {}
      activeInstance.ytPlayer = null;
    }
  }

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
      simTimer: null
    };
    activeInstance = instance;

    // 1. Header Banner
    const header = document.createElement("div");
    header.className = "ep6-studio-header";
    header.innerHTML = `
      <div class="ep6-head-main">
        <div class="ep6-head-eyebrow">
          <span class="ep6-badge-code">EP6 · สอบ 15%</span>
          <span class="ep6-badge-meta">43 Captured Slides · Verbatim → Conceptualized Logical Flow</span>
          <span class="ep6-badge-meta">⏱ 00:04 – 62:00</span>
        </div>
        <h3 class="ep6-head-title">Measures of Morbidity &amp; Mortality · การวัดการป่วย การตาย ภาระโรค (DALY) และการปรับมาตรฐานอัตรา</h3>
        <p class="ep6-head-sub">${esc(DATA.meta.recordedInfo)} — เล่นวิดีโอบรรยายควบคู่กับการติดตามประเด็นสังเคราะห์เชิงแนวคิด (Conceptualized Insights) และคำพูดต้นฉบับ (Verbatim Quotations) ที่อัปเดตอัตโนมัติตาม Timeline</p>
      </div>
      <div class="ep6-head-actions">
        <a class="btn sm" href="${esc(DATA.meta.pdfDownloadPath)}" download="EP6_Measures_of_Morbidity_and_Mortality_Slides.pdf">📥 ดาวน์โหลดสไลด์ (.PDF)</a>
        <a class="btn sm" id="ep6ExternalYtLink" href="https://www.youtube.com/watch?v=${esc(DATA.meta.youtubeId)}&t=${Math.floor(studioState.currentSec)}s" target="_blank" rel="noopener">▶ เปิดบน YouTube ↗</a>
      </div>
    `;
    if (!isCompactEmbed) {
      root.appendChild(header);
    }

    // 2. 5-Stage Logical Flow Stepper Ribbon
    const stepperWrap = document.createElement("div");
    stepperWrap.className = "ep6-stage-ribbon";
    stepperWrap.setAttribute("role", "navigation");
    stepperWrap.setAttribute("aria-label", "ลำดับตรรกะการเรียนรู้ 5 องก์ (5-Stage Logical Flow)");
    stepperWrap.innerHTML = `
      <div class="ep6-ribbon-label">Logical Flow 5 องก์ต่อเนื่อง (คลิกเพื่อข้ามไปยังช่วงเวลาของแต่ละองก์):</div>
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

    // 3. Synchronized Theater (Left: Video + Scrubber + Captured Slide | Right: Live Conceptualized Insight + Verbatim)
    const theater = document.createElement("div");
    theater.className = `ep6-theater mode-${studioState.theaterMode}`;
    theater.id = "ep6TheaterGrid";
    theater.innerHTML = `
      <div class="ep6-media-col">
        <div class="ep6-toolbar">
          <div class="ep6-mode-group" role="group" aria-label="รูปแบบการแสดงผลวิดีโอและสไลด์">
            <button type="button" class="ep6-tool-btn ${studioState.theaterMode === "split" ? "is-active" : ""}" data-tmode="split">🎬 วิดีโอ + สไลด์คู่ขนาน</button>
            <button type="button" class="ep6-tool-btn ${studioState.theaterMode === "video" ? "is-active" : ""}" data-tmode="video">📺 เน้นวิดีโอ</button>
            <button type="button" class="ep6-tool-btn ${studioState.theaterMode === "slides" ? "is-active" : ""}" data-tmode="slides">🖼️ เน้นสไลด์ + Timeline จำลอง</button>
          </div>
          <div class="ep6-mode-group" role="group" aria-label="ความละเอียดภาพสไลด์">
            <button type="button" class="ep6-tool-btn ${studioState.imgQuality === "hd" ? "is-active" : ""}" data-imgq="hd" title="สไลด์คมชัดสูงสำหรับอ่านสูตรและตาราง">✨ สไลด์คมชัด HD</button>
            <button type="button" class="ep6-tool-btn ${studioState.imgQuality === "yt" ? "is-active" : ""}" data-imgq="yt" title="ภาพ Capture ต้นฉบับจากวิดีโอ YouTube">📸 ภาพจริงจากวิดีโอ</button>
          </div>
        </div>

        <div class="ep6-player-stage">
          <div class="ep6-yt-box" id="ep6YtBox">
            <div class="ep6-slide-frame-head">
              <span class="ep6-slide-pill">🎥 วิดีโอบรรยายสด (Synced Timeline)</span>
              <a class="ep6-zoom-btn" id="ep6MiniYtLink" href="https://www.youtube.com/watch?v=${esc(DATA.meta.youtubeId)}&t=${Math.floor(studioState.currentSec)}s" target="_blank" rel="noopener" style="text-decoration:none">YouTube ↗</a>
            </div>
            <div class="ep6-yt-aspect">
              <iframe
                id="ep6YtIframeEl"
                src="https://www.youtube.com/embed/${esc(DATA.meta.youtubeId)}?enablejsapi=1&amp;start=${Math.floor(studioState.currentSec || 4)}&amp;rel=0&amp;modestbranding=1&amp;playsinline=1"
                title="Measures of Morbidity &amp; Mortality — RACM 303 Epidemiology"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </div>
            <div class="ep6-yt-fallback" id="ep6YtFallbackBanner" hidden>
              <span>โหมดออฟไลน์หรือเครือข่ายบล็อก YouTube Embed — คุณยังสามารถกดปุ่ม <strong>“▶ เล่น Timeline จำลอง”</strong> ด้านล่างเพื่อเลื่อนดูสไลด์และประเด็น Conceptualized ตามเวลาจริง หรือ</span>
              <a id="ep6FallbackYtBtn" href="https://www.youtube.com/watch?v=${esc(DATA.meta.youtubeId)}&t=4s" target="_blank" rel="noopener">เปิดดูวิดีโอบน YouTube โดยตรง ↗</a>
            </div>
          </div>

          <div class="ep6-sync-slide-box" id="ep6SyncSlideBox">
            <div class="ep6-slide-frame-head">
              <span id="ep6SyncSlideBadge" class="ep6-slide-pill">Slide 1 / 43</span>
              <button type="button" class="ep6-zoom-btn" id="ep6ZoomCurrentSlideBtn">🔍 ขยายสไลด์เต็มจอ</button>
            </div>
            <div class="ep6-slide-img-wrap" id="ep6SyncSlideImgWrap" title="คลิกเพื่อขยายภาพสไลด์เต็มจอ">
              <img id="ep6SyncSlideImg" src="${esc(getSlideImg(DATA.slides[0]))}" alt="Captured lecture slide">
            </div>
          </div>
        </div>

        <!-- Custom Interactive Timeline Scrubber with 5-Stage Color Segments & Slide Ticks -->
        <div class="ep6-scrubber-card">
          <div class="ep6-scrubber-controls">
            <div class="ep6-transport-btns">
              <button type="button" class="ep6-ctrl-btn" id="ep6PrevSlideBtn" title="สไลด์ก่อนหน้า">⏮ สไลด์ก่อน</button>
              <button type="button" class="ep6-ctrl-btn is-primary" id="ep6PlayPauseBtn">▶ เล่น / หยุด</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6NextSlideBtn" title="สไลด์ถัดไป">สไลด์ถัดไป ⏭</button>
              <button type="button" class="ep6-ctrl-btn" id="ep6SimToggleBtn" title="เลื่อน Timeline อัตโนมัติแม้ไม่ได้เล่น YouTube">⏱ จำลองเลื่อนเวลา (1x)</button>
            </div>
            <div class="ep6-time-readout">
              <strong id="ep6CurTimeTxt">00:04</strong>
              <span>/ 62:00</span>
            </div>
          </div>

          <div class="ep6-track-outer" id="ep6TimelineTrack" role="slider" aria-label="แถบเวลาคาบเรียน Measures of Morbidity & Mortality" aria-valuemin="4" aria-valuemax="3806" aria-valuenow="4" tabindex="0">
            <div class="ep6-track-stages">
              ${DATA.stages
                .map((st) => {
                  const leftPct = ((st.startSec - 4) / (3806 - 4)) * 100;
                  const widthPct = ((st.endSec - st.startSec) / (3806 - 4)) * 100;
                  return `<div class="ep6-track-seg stage-${st.id}" style="left:${leftPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%" title="${esc(st.code)}: ${esc(st.title)}"></div>`;
                })
                .join("")}
            </div>
            <div class="ep6-track-ticks">
              ${DATA.slides
                .map((sl) => {
                  const pct = ((sl.startSec - 4) / (3806 - 4)) * 100;
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

      <!-- RIGHT COLUMN: LIVE CONCEPTUALIZED INSIGHT & VERBATIM QUOTATION -->
      <div class="ep6-concept-col" aria-live="polite">
        <div class="ep6-live-status-bar">
          <div class="ep6-live-indicator">
            <span class="ep6-live-dot" id="ep6LiveDot"></span>
            <span id="ep6LiveStageBadge" class="ep6-live-stage-pill">Stage 1/5</span>
            <span id="ep6LiveTimeRange" class="ep6-live-range-txt">00:04 – 04:40</span>
          </div>
          <label class="ep6-autoscroll-toggle" title="เลื่อนการ์ดด้านล่างตามเวลาวิดีโออัตโนมัติ">
            <input type="checkbox" id="ep6AutoScrollChk" ${studioState.autoScrollCards ? "checked" : ""}>
            <span>เลื่อนรายการตามอัตโนมัติ</span>
          </label>
        </div>

        <div class="ep6-live-card" id="ep6LiveConceptCard"></div>
      </div>
    `;
    root.appendChild(theater);

    // 4. Complete 43-Slide Logical Flow Atlas & Rapid Review Matrix
    const atlas = document.createElement("div");
    atlas.className = "ep6-atlas-wrap";
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
        </div>
      </div>
      <div id="ep6AtlasBody"></div>
    `;
    root.appendChild(atlas);

    container.appendChild(root);

    // Render sub-sections & bind events
    function updateLiveUI(sec, optsUpdate) {
      const clamped = Math.max(4, Math.min(3806, Number(sec) || 4));
      studioState.currentSec = clamped;
      const slideId = findSlideAtTime(clamped);
      const slide = getSlideById(slideId);
      const stage = getStageById(slide.stageId);
      const slideChanged = studioState.activeSlideId !== slide.id;
      studioState.activeSlideId = slide.id;
      studioState.activeStageId = stage.id;

      // Update scrubber & time readout
      const pct = ((clamped - 4) / (3806 - 4)) * 100;
      const progEl = root.querySelector("#ep6TrackProgress");
      const headEl = root.querySelector("#ep6TrackPlayhead");
      const curTxt = root.querySelector("#ep6CurTimeTxt");
      const trackEl = root.querySelector("#ep6TimelineTrack");
      if (progEl) progEl.style.width = `${pct.toFixed(2)}%`;
      if (headEl) headEl.style.left = `${pct.toFixed(2)}%`;
      if (curTxt) curTxt.textContent = fmtTime(clamped);
      if (trackEl) trackEl.setAttribute("aria-valuenow", String(Math.floor(clamped)));

      const extLink = root.querySelector("#ep6ExternalYtLink");
      if (extLink) {
        extLink.href = `https://www.youtube.com/watch?v=${DATA.meta.youtubeId}&t=${Math.floor(clamped)}s`;
      }
      const miniLink = root.querySelector("#ep6MiniYtLink");
      if (miniLink) {
        miniLink.href = `https://www.youtube.com/watch?v=${DATA.meta.youtubeId}&t=${Math.floor(clamped)}s`;
      }
      const fbLink = root.querySelector("#ep6FallbackYtBtn");
      if (fbLink) {
        fbLink.href = `https://www.youtube.com/watch?v=${DATA.meta.youtubeId}&t=${Math.floor(clamped)}s`;
      }

      // Highlight active Stage in Stepper
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

      // Update Right-Column Live Conceptualized Card
      const stagePill = root.querySelector("#ep6LiveStageBadge");
      const rangeTxt = root.querySelector("#ep6LiveTimeRange");
      if (stagePill) {
        stagePill.textContent = `${stage.code} / 5 · ${stage.title}`;
        stagePill.className = `ep6-live-stage-pill stage-${stage.id}`;
      }
      if (rangeTxt) {
        rangeTxt.textContent = `Slide ${slide.id}/43 · ${slide.timeLabel}`;
      }

      // Determine active verbatim quote within this slide
      const quotes = slide.verbatimQuotes || [];
      let activeQuoteIdx = 0;
      for (let i = 0; i < quotes.length; i++) {
        if (clamped >= quotes[i].tSec - 2) {
          activeQuoteIdx = i;
        }
      }

      const liveCard = root.querySelector("#ep6LiveConceptCard");
      if (liveCard && (slideChanged || optsUpdate?.forceCard || liveCard.dataset.activeQuote !== String(activeQuoteIdx))) {
        liveCard.dataset.activeQuote = String(activeQuoteIdx);
        const prevSlide = slide.id > 1 ? getSlideById(slide.id - 1) : null;
        const nextSlide = slide.id < DATA.slides.length ? getSlideById(slide.id + 1) : null;

        liveCard.innerHTML = `
          <div class="ep6-lc-head">
            <div class="ep6-lc-kicker">ประเด็น Conceptualized ขณะกำลังบรรยาย (Slide ${slide.id}/43 · หน้า ${slide.deckSlideNo})</div>
            <h4 class="ep6-lc-title">${esc(slide.title)}</h4>
            <div class="ep6-lc-entitle">${esc(slide.enTitle || "")}</div>
            ${slide.revisitNotes ? `<div class="ep6-lc-revisit">🔄 ${esc(slide.revisitNotes)}</div>` : ""}
          </div>

          <div class="ep6-lc-thesis-box">
            <div class="ep6-lc-sec-tag">💡 แก่นแนวคิดที่สังเคราะห์ได้ (Conceptualized Takeaway)</div>
            <p class="ep6-lc-thesis">${esc(slide.conceptThesis)}</p>
            ${slide.formula ? `<div class="ep6-lc-formula"><code>${esc(slide.formula)}</code></div>` : ""}
            <ul class="ep6-lc-bullets">
              ${(slide.conceptBullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}
            </ul>
          </div>

          <div class="ep6-lc-quotes-box">
            <div class="ep6-lc-sec-tag">🎙️ คำพูดอาจารย์ผู้สอนแบบคำต่อคำ (Verbatim Quotation · คลิกเวลาเพื่อฟังเสียงช่วงนั้น)</div>
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

          <div class="ep6-lc-flow-bridge">
            <div class="ep6-lc-sec-tag">🧭 การเชื่อมโยงตาม Logical Flow</div>
            <div class="ep6-bridge-grid">
              <div class="ep6-bridge-step is-prev">
                <span class="ep6-bridge-lbl">${prevSlide ? `← รับช่วงจาก Slide ${prevSlide.id}` : "จุดตั้งต้นคาบเรียน"}</span>
                <p>${esc(slide.logicalFlow?.fromPrev || "")}</p>
              </div>
              <div class="ep6-bridge-step is-next">
                <span class="ep6-bridge-lbl">${nextSlide ? `ส่งต่อไปยัง Slide ${nextSlide.id} →` : "เชื่อมต่อคาบถัดไป (EP7)"}</span>
                <p>${esc(slide.logicalFlow?.toNext || "")}</p>
              </div>
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
      }

      // Highlight active card in the 43-Slide Atlas below
      if (slideChanged || optsUpdate?.forceCard) {
        root.querySelectorAll(".ep6-flow-slide-card").forEach((card) => {
          const cid = Number(card.getAttribute("data-slide-card"));
          const active = cid === slide.id;
          card.classList.toggle("is-active-playing", active);
          if (active && studioState.autoScrollCards && !optsUpdate?.skipAutoScroll) {
            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
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
                <button type="button" class="btn sm" data-seek-sec="${st.startSec}">▶ เล่นตั้งแต่องก์นี้ (${fmtTime(st.startSec)})</button>
              </div>
              <h4 class="ep6-sb-title">${esc(st.title)} <span class="ep6-sb-en">(${esc(st.enTitle)})</span></h4>
              <p class="ep6-sb-question"><strong>คำถามนำขององก์:</strong> ${esc(st.guidingQuestion)}</p>
              <p class="ep6-sb-thesis"><strong>แก่นความคิดรวบยอด:</strong> ${esc(st.coreThesis)}</p>
            </div>

            <div class="ep6-slides-flow-list">
              ${stageSlides
                .map(
                  (sl) => `
                <article class="ep6-flow-slide-card ${sl.id === studioState.activeSlideId ? "is-active-playing" : ""}" data-slide-card="${sl.id}">
                  <div class="ep6-fsc-left">
                    <div class="ep6-fsc-meta">
                      <span class="ep6-fsc-num">Slide ${sl.id} / 43 <small>(หน้า ${sl.deckSlideNo})</small></span>
                      <button type="button" class="ep6-play-chip" data-seek-sec="${sl.startSec}">▶ ${esc(sl.timeLabel)}</button>
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
                          <button type="button" class="ep6-qtime-mini" data-seek-sec="${vq.tSec}">▶ ${esc(vq.time)}</button>
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
                      <span><strong>Logical Flow →</strong> ${esc(sl.logicalFlow?.toNext || "")}</span>
                    </div>
                  </div>
                </article>
              `
                )
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

      body.querySelectorAll("[data-seek-sec]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const sec = Number(btn.getAttribute("data-seek-sec")) || 4;
          seekToSecond(sec, true);
          root.querySelector("#ep6TheaterGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });

      body.querySelectorAll("[data-zoom-slide]").forEach((el) => {
        el.addEventListener("click", () => {
          const sl = getSlideById(Number(el.getAttribute("data-zoom-slide")));
          openSlideLightbox(getSlideImg(sl), `Slide ${sl.id}/43 (หน้า ${sl.deckSlideNo} · ${sl.timeLabel}) — ${sl.title}`);
        });
      });
    }

    function seekToSecond(sec, autoPlay) {
      const target = Math.max(4, Math.min(3805, Number(sec) || 4));
      updateLiveUI(target, { forceCard: true, skipAutoScroll: false });
      if (instance.ytReady && instance.ytPlayer && typeof instance.ytPlayer.seekTo === "function") {
        try {
          instance.ytPlayer.seekTo(target, true);
          if (autoPlay && typeof instance.ytPlayer.playVideo === "function") {
            instance.ytPlayer.playVideo();
          }
        } catch (_) {}
      } else if (autoPlay && (studioState.ytError || studioState.theaterMode === "slides")) {
        startSimulatedTimeline();
      }
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
        if (next >= 3805) {
          updateLiveUI(3805);
          stopSimulatedTimeline();
          return;
        }
        updateLiveUI(next);
      }, 1000);
      syncTransportButtons();
    }

    function syncTransportButtons() {
      const playBtn = root.querySelector("#ep6PlayPauseBtn");
      const simBtn = root.querySelector("#ep6SimToggleBtn");
      const dot = root.querySelector("#ep6LiveDot");
      const isPlayingAny = studioState.ytPlaying || studioState.simPlaying;
      if (playBtn) {
        playBtn.textContent = isPlayingAny ? "⏸ หยุดชั่วคราว" : "▶ เล่นวิดีโอ";
      }
      if (simBtn) {
        simBtn.textContent = studioState.simPlaying
          ? `⏹ หยุดจำลองเวลา (${studioState.simSpeed}x)`
          : `⏱ จำลองเลื่อนเวลา (${studioState.simSpeed}x)`;
        simBtn.classList.toggle("is-active", studioState.simPlaying);
      }
      if (dot) {
        dot.classList.toggle("is-playing", isPlayingAny);
      }
    }

    // Wire Theater Mode & Image Quality buttons
    root.querySelectorAll("[data-tmode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        studioState.theaterMode = btn.getAttribute("data-tmode") || "split";
        theater.className = `ep6-theater mode-${studioState.theaterMode}`;
        root.querySelectorAll("[data-tmode]").forEach((b) =>
          b.classList.toggle("is-active", b.getAttribute("data-tmode") === studioState.theaterMode)
        );
      });
    });

    root.querySelectorAll("[data-imgq]").forEach((btn) => {
      btn.addEventListener("click", () => {
        studioState.imgQuality = btn.getAttribute("data-imgq") === "yt" ? "yt" : "hd";
        root.querySelectorAll("[data-imgq]").forEach((b) =>
          b.classList.toggle("is-active", b.getAttribute("data-imgq") === studioState.imgQuality)
        );
        updateLiveUI(studioState.currentSec, { forceCard: true, skipAutoScroll: true });
        renderAtlasBody();
      });
    });

    // Wire Stage Jump buttons
    root.querySelectorAll("[data-stage-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const st = getStageById(Number(btn.getAttribute("data-stage-jump")));
        if (st) seekToSecond(st.startSec, true);
      });
    });

    // Wire Slide Zoom
    const zoomHandler = () => {
      const sl = getSlideById(studioState.activeSlideId);
      openSlideLightbox(getSlideImg(sl), `Slide ${sl.id}/43 (หน้า ${sl.deckSlideNo} · ${sl.timeLabel}) — ${sl.title}`);
    };
    root.querySelector("#ep6ZoomCurrentSlideBtn")?.addEventListener("click", zoomHandler);
    root.querySelector("#ep6SyncSlideImgWrap")?.addEventListener("click", zoomHandler);

    // Wire Transport Controls
    root.querySelector("#ep6PrevSlideBtn")?.addEventListener("click", () => {
      const prevId = Math.max(1, studioState.activeSlideId - 1);
      seekToSecond(getSlideById(prevId).startSec, false);
    });
    root.querySelector("#ep6NextSlideBtn")?.addEventListener("click", () => {
      const nextId = Math.min(DATA.slides.length, studioState.activeSlideId + 1);
      seekToSecond(getSlideById(nextId).startSec, false);
    });
    root.querySelector("#ep6PlayPauseBtn")?.addEventListener("click", () => {
      if (studioState.simPlaying) {
        stopSimulatedTimeline();
        return;
      }
      if (instance.ytReady && instance.ytPlayer && !studioState.ytError) {
        const st = instance.ytPlayer.getPlayerState ? instance.ytPlayer.getPlayerState() : -1;
        if (st === 1) {
          instance.ytPlayer.pauseVideo();
        } else {
          instance.ytPlayer.playVideo();
        }
      } else {
        startSimulatedTimeline();
      }
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
          try { instance.ytPlayer.pauseVideo(); } catch (_) {}
        }
        studioState.simSpeed = 1;
        startSimulatedTimeline();
      }
    });

    // Wire Scrubber Drag/Click + Hover Tooltip
    const track = root.querySelector("#ep6TimelineTrack");
    const tooltip = root.querySelector("#ep6TrackTooltip");
    if (track) {
      const secFromPointer = (clientX) => {
        const rect = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
        return 4 + ratio * (3806 - 4);
      };

      let dragging = false;
      track.addEventListener("pointerdown", (e) => {
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
          updateLiveUI(hoverSec, { forceCard: true, skipAutoScroll: true });
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

    // Wire Auto-scroll checkbox
    const autoChk = root.querySelector("#ep6AutoScrollChk");
    if (autoChk) {
      autoChk.addEventListener("change", () => {
        studioState.autoScrollCards = autoChk.checked;
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

    // Initial render
    renderAtlasBody();
    updateLiveUI(studioState.currentSec, { forceCard: true, skipAutoScroll: true });
    syncTransportButtons();

    // Initialize Official YouTube IFrame Player
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
              instance.pollTimer = setInterval(() => {
                if (!instance.ytPlayer || typeof instance.ytPlayer.getCurrentTime !== "function") return;
                const st = instance.ytPlayer.getPlayerState ? instance.ytPlayer.getPlayerState() : -1;
                if (st === 1) {
                  const t = instance.ytPlayer.getCurrentTime();
                  if (t >= 3806) {
                    instance.ytPlayer.pauseVideo();
                    updateLiveUI(3805);
                  } else if (Math.abs(t - studioState.currentSec) >= 0.35) {
                    updateLiveUI(t);
                  }
                }
              }, 300);
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
