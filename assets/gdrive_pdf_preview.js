/* ==========================================================================
   RACM 303 (2569) — Google Drive-Style PDF Preview Before Download
   Intercepts PDF download/view clicks across the portal and opens an
   interactive Google Drive-identical PDF preview modal first:
   - Page [ 1 ] / N jump input & live scroll indicator
   - Download (triggers real .pdf file download), Print, Fit-to-width / Fit-to-page
   - Zoom Out (-), Zoom % dropdown (50%..200%), Zoom In (+), Ctrl+Wheel zoom
   ========================================================================== */
(function () {
  "use strict";

  const PDFJS_SRC = "assets/vendor/pdf.min.js";
  const PDFJS_WORKER_SRC = "assets/vendor/pdf.worker.min.js";
  const CMAP_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/";
  const STD_FONT_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/";
  const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5];

  let pdfJsPromise = null;
  let overlayEl = null;
  let stageEl = null;
  let pagesColEl = null;
  let titleEl = null;
  let pageInputEl = null;
  let pageTotalEl = null;
  let fitBtnEl = null;
  let zoomOutBtnEl = null;
  let zoomInBtnEl = null;
  let zoomLabelBtnEl = null;
  let zoomMenuEl = null;
  let printFrameEl = null;
  let ioObserver = null;
  let scrollRaf = 0;

  const state = {
    isOpen: false,
    url: "",
    title: "",
    downloadName: "",
    pdfDoc: null,
    numPages: 0,
    curPage: 1,
    scale: 1.0,
    fitMode: "width", // "width" | "page" | "custom"
    basePageSizes: [], // [{ w, h }] at scale=1
    renderedScales: new Map(), // pageNum -> rendered scale
    renderTasks: new Map(), // pageNum -> RenderTask
    openToken: 0,
    prevFocus: null
  };

  function loadPdfJs() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
      return Promise.resolve(window.pdfjsLib);
    }
    if (pdfJsPromise) return pdfJsPromise;
    pdfJsPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = PDFJS_SRC;
      s.async = true;
      s.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
          resolve(window.pdfjsLib);
        } else {
          reject(new Error("pdfjsLib unavailable"));
        }
      };
      s.onerror = () => {
        pdfJsPromise = null;
        reject(new Error("Failed to load pdf.min.js"));
      };
      document.head.appendChild(s);
    });
    return pdfJsPromise;
  }

  const SVG = {
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 19h14"/><path d="M5 16v3"/><path d="M19 16v3"/></svg>`,
    print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 3 18 3 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/></svg>`,
    fit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V5h4"/><path d="M20 9V5h-4"/><path d="M4 15v4h4"/><path d="M20 15v4h-4"/></svg>`,
    minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    caret: `<svg class="gdpv-zoom-caret" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>`,
    newTab: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  function ensureDom() {
    if (overlayEl) return;
    overlayEl = document.createElement("div");
    overlayEl.className = "gdpv-overlay";
    overlayEl.id = "gdrivePdfPreviewModal";
    overlayEl.setAttribute("role", "dialog");
    overlayEl.setAttribute("aria-modal", "true");
    overlayEl.setAttribute("aria-label", "ตัวอย่างไฟล์ PDF ก่อนดาวน์โหลด");
    overlayEl.hidden = true;

    overlayEl.innerHTML = `
      <header class="gdpv-topbar">
        <div class="gdpv-top-left">
          <div class="racm-unav-pair is-compact is-dark-hud" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่">
            <button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้">${SVG.back}<span class="racm-unav-lbl">ย้อนกลับ</span></button>
            <button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button>
          </div>
          <span class="gdpv-pdf-badge" aria-hidden="true">PDF</span>
          <span class="gdpv-doc-title" id="gdpvDocTitle">เอกสาร.pdf</span>
        </div>
        <div class="gdpv-top-right">
          <button type="button" class="gdpv-icon-btn" data-gdpv-act="print" title="พิมพ์เอกสาร (Print)">${SVG.print}</button>
          <button type="button" class="gdpv-top-dl-btn" data-gdpv-act="download" title="ดาวน์โหลดไฟล์ PDF ลงเครื่อง">${SVG.download}<span>ดาวน์โหลด</span></button>
          <button type="button" class="gdpv-icon-btn" data-gdpv-act="newtab" title="เปิดไฟล์ PDF ในแท็บใหม่">${SVG.newTab}</button>
          <button type="button" class="gdpv-icon-btn" data-gdpv-act="close" title="ปิด (Esc)">${SVG.close}</button>
        </div>
      </header>

      <div class="gdpv-stage" id="gdpvStage">
        <div class="gdpv-pages-col" id="gdpvPagesCol"></div>
      </div>

      <div class="gdpv-bottom-dock">
        <div class="gdpv-pill" role="toolbar" aria-label="แถบควบคุมตัวอย่าง PDF">
          <div class="gdpv-page-group">
            <span class="gdpv-page-label">Page</span>
            <input type="text" inputmode="numeric" class="gdpv-page-input" id="gdpvPageInput" value="1" aria-label="หมายเลขหน้า" />
            <span class="gdpv-page-slash">/</span>
            <span class="gdpv-page-total" id="gdpvPageTotal">1</span>
          </div>

          <span class="gdpv-divider" aria-hidden="true"></span>

          <button type="button" class="gdpv-pill-btn" data-gdpv-act="download" title="ดาวน์โหลด (Download)">${SVG.download}</button>
          <button type="button" class="gdpv-pill-btn" data-gdpv-act="print" title="พิมพ์ (Print)">${SVG.print}</button>
          <button type="button" class="gdpv-pill-btn is-active" id="gdpvFitBtn" data-gdpv-act="toggle-fit" title="ปรับขนาดพอดีความกว้าง / พอดีทั้งหน้า">${SVG.fit}</button>

          <span class="gdpv-divider" aria-hidden="true"></span>

          <button type="button" class="gdpv-pill-btn" id="gdpvZoomOutBtn" data-gdpv-act="zoom-out" title="ย่อขนาด (Zoom out)">${SVG.minus}</button>
          <div class="gdpv-zoom-wrap">
            <button type="button" class="gdpv-zoom-select-btn" id="gdpvZoomSelectBtn" data-gdpv-act="zoom-menu" aria-expanded="false" title="เลือกระดับการซูม"><span id="gdpvZoomPctText">100%</span>${SVG.caret}</button>
            <div class="gdpv-zoom-menu" id="gdpvZoomMenu" hidden>
              <button type="button" class="gdpv-zoom-opt" data-gdpv-zoom="fit-width">พอดีความกว้าง</button>
              <button type="button" class="gdpv-zoom-opt" data-gdpv-zoom="fit-page">พอดีทั้งหน้า</button>
              <button type="button" class="gdpv-zoom-opt" data-gdpv-zoom="0.5">50%</button>
              <button type="button" class="gdpv-zoom-opt" data-gdpv-zoom="0.75">75%</button>
              <button type="button" class="gdpv-zoom-opt" data-gdpv-zoom="1">100%</button>
              <button type="button" class="gdpv-zoom-opt" data-gdpv-zoom="1.25">125%</button>
              <button type="button" class="gdpv-zoom-opt" data-gdpv-zoom="1.5">150%</button>
              <button type="button" class="gdpv-zoom-opt" data-gdpv-zoom="2">200%</button>
            </div>
          </div>
          <button type="button" class="gdpv-pill-btn" id="gdpvZoomInBtn" data-gdpv-act="zoom-in" title="ขยายขนาด (Zoom in)">${SVG.plus}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);

    stageEl = overlayEl.querySelector("#gdpvStage");
    pagesColEl = overlayEl.querySelector("#gdpvPagesCol");
    titleEl = overlayEl.querySelector("#gdpvDocTitle");
    pageInputEl = overlayEl.querySelector("#gdpvPageInput");
    pageTotalEl = overlayEl.querySelector("#gdpvPageTotal");
    fitBtnEl = overlayEl.querySelector("#gdpvFitBtn");
    zoomOutBtnEl = overlayEl.querySelector("#gdpvZoomOutBtn");
    zoomInBtnEl = overlayEl.querySelector("#gdpvZoomInBtn");
    zoomLabelBtnEl = overlayEl.querySelector("#gdpvZoomSelectBtn");
    zoomMenuEl = overlayEl.querySelector("#gdpvZoomMenu");

    // Backdrop click outside pages closes preview (Google Drive behavior)
    stageEl.addEventListener("click", (ev) => {
      if (ev.target === stageEl || ev.target === pagesColEl) {
        if (!zoomMenuEl.hidden) {
          zoomMenuEl.hidden = true;
          return;
        }
        closePreview();
      }
    });

    overlayEl.addEventListener("click", (ev) => {
      const zoomOpt = ev.target.closest("[data-gdpv-zoom]");
      if (zoomOpt) {
        ev.stopPropagation();
        const val = zoomOpt.getAttribute("data-gdpv-zoom");
        zoomMenuEl.hidden = true;
        zoomLabelBtnEl.setAttribute("aria-expanded", "false");
        if (val === "fit-width") applyFitMode("width");
        else if (val === "fit-page") applyFitMode("page");
        else applyCustomScale(parseFloat(val) || 1);
        return;
      }

      const actBtn = ev.target.closest("[data-gdpv-act]");
      if (!actBtn) {
        if (!ev.target.closest(".gdpv-zoom-wrap")) zoomMenuEl.hidden = true;
        return;
      }
      const act = actBtn.getAttribute("data-gdpv-act");
      if (act === "close") closePreview();
      else if (act === "download") triggerRealDownload();
      else if (act === "print") triggerPrint();
      else if (act === "newtab") window.open(state.url, "_blank", "noopener");
      else if (act === "toggle-fit") {
        applyFitMode(state.fitMode === "width" ? "page" : "width");
      } else if (act === "zoom-out") {
        stepZoom(-1);
      } else if (act === "zoom-in") {
        stepZoom(1);
      } else if (act === "zoom-menu") {
        ev.stopPropagation();
        const nextHidden = !zoomMenuEl.hidden;
        zoomMenuEl.hidden = nextHidden;
        zoomLabelBtnEl.setAttribute("aria-expanded", nextHidden ? "false" : "true");
        syncToolbarState();
      }
    });

    // Page input jump
    pageInputEl.addEventListener("focus", () => pageInputEl.select());
    pageInputEl.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        jumpToInputPage();
        pageInputEl.blur();
      } else if (ev.key === "Escape") {
        ev.stopPropagation();
        pageInputEl.value = String(state.curPage);
        pageInputEl.blur();
      }
    });
    pageInputEl.addEventListener("change", jumpToInputPage);

    // Track current visible page on scroll
    stageEl.addEventListener(
      "scroll",
      () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = 0;
          updateCurrentPageFromScroll();
        });
      },
      { passive: true }
    );

    // Ctrl + Wheel smooth zoom inside preview
    stageEl.addEventListener(
      "wheel",
      (ev) => {
        if (!ev.ctrlKey && !ev.metaKey) return;
        ev.preventDefault();
        stepZoom(ev.deltaY < 0 ? 1 : -1);
      },
      { passive: false }
    );

    // Keyboard shortcuts while open
    document.addEventListener(
      "keydown",
      (ev) => {
        if (!state.isOpen) return;
        if (document.activeElement === pageInputEl) return;
        if (ev.key === "Escape") {
          ev.preventDefault();
          ev.stopPropagation();
          if (!zoomMenuEl.hidden) {
            zoomMenuEl.hidden = true;
          } else {
            closePreview();
          }
        } else if ((ev.ctrlKey || ev.metaKey) && (ev.key === "p" || ev.key === "P")) {
          ev.preventDefault();
          triggerPrint();
        } else if (ev.key === "+" || ev.key === "=") {
          ev.preventDefault();
          stepZoom(1);
        } else if (ev.key === "-") {
          ev.preventDefault();
          stepZoom(-1);
        }
      },
      true
    );

    window.addEventListener("resize", () => {
      if (!state.isOpen || !state.pdfDoc) return;
      if (state.fitMode === "width" || state.fitMode === "page") {
        applyFitMode(state.fitMode, true);
      }
    });
  }

  function computeFitScale(mode) {
    if (!state.basePageSizes.length || !stageEl) return 1.0;
    const first = state.basePageSizes[0];
    const availW = Math.max(280, stageEl.clientWidth - 44);
    const availH = Math.max(280, stageEl.clientHeight - 48);
    if (mode === "page") {
      return Math.max(0.35, Math.min(2.5, Math.min(availW / first.w, availH / first.h)));
    }
    // Default Google Drive pleasant reading width (capped at ~1040px paper width on large monitors)
    const targetW = Math.min(availW, 1020);
    return Math.max(0.4, Math.min(2.5, targetW / first.w));
  }

  function applyFitMode(mode, keepScrollRatio) {
    const prevScrollRatio =
      keepScrollRatio && stageEl.scrollHeight > 0 ? stageEl.scrollTop / stageEl.scrollHeight : null;
    state.fitMode = mode;
    state.scale = computeFitScale(mode);
    resizeAllPageSlots();
    if (prevScrollRatio != null) {
      stageEl.scrollTop = prevScrollRatio * stageEl.scrollHeight;
    }
    syncToolbarState();
    rerenderVisiblePages();
  }

  function applyCustomScale(nextScale) {
    const clamped = Math.max(0.4, Math.min(2.5, nextScale));
    const ratio = stageEl.scrollHeight > 0 ? stageEl.scrollTop / stageEl.scrollHeight : 0;
    state.fitMode = "custom";
    state.scale = clamped;
    resizeAllPageSlots();
    stageEl.scrollTop = ratio * stageEl.scrollHeight;
    syncToolbarState();
    rerenderVisiblePages();
  }

  function stepZoom(dir) {
    const cur = state.scale;
    let target = cur;
    if (dir > 0) {
      const higher = ZOOM_STEPS.find((z) => z > cur + 0.04);
      target = higher != null ? higher : Math.min(2.5, Math.round((cur + 0.25) * 100) / 100);
    } else {
      const lower = [...ZOOM_STEPS].reverse().find((z) => z < cur - 0.04);
      target = lower != null ? lower : Math.max(0.4, Math.round((cur - 0.25) * 100) / 100);
    }
    applyCustomScale(target);
  }

  function syncToolbarState() {
    if (!overlayEl) return;
    const pct = Math.round(state.scale * 100);
    const pctEl = overlayEl.querySelector("#gdpvZoomPctText");
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (pageInputEl && document.activeElement !== pageInputEl) {
      pageInputEl.value = String(state.curPage || 1);
    }
    if (pageTotalEl) pageTotalEl.textContent = String(state.numPages || 1);
    if (fitBtnEl) {
      fitBtnEl.classList.toggle("is-active", state.fitMode === "width" || state.fitMode === "page");
      fitBtnEl.title =
        state.fitMode === "width"
          ? "คลิกเพื่อปรับพอดีทั้งหน้า (Fit to page)"
          : "คลิกเพื่อปรับพอดีความกว้าง (Fit to width)";
    }
    if (zoomOutBtnEl) zoomOutBtnEl.disabled = state.scale <= 0.41 || !state.pdfDoc;
    if (zoomInBtnEl) zoomInBtnEl.disabled = state.scale >= 2.49 || !state.pdfDoc;

    if (zoomMenuEl) {
      zoomMenuEl.querySelectorAll("[data-gdpv-zoom]").forEach((btn) => {
        const z = btn.getAttribute("data-gdpv-zoom");
        const selected =
          (z === "fit-width" && state.fitMode === "width") ||
          (z === "fit-page" && state.fitMode === "page") ||
          (state.fitMode === "custom" && Math.abs(parseFloat(z) - state.scale) < 0.03);
        btn.classList.toggle("is-selected", selected);
      });
    }
  }

  function resizeAllPageSlots() {
    if (!pagesColEl) return;
    const slots = pagesColEl.querySelectorAll(".gdpv-page-slot");
    slots.forEach((slot) => {
      const pNum = Number(slot.dataset.pageNum || 1);
      const sz = state.basePageSizes[pNum - 1] || state.basePageSizes[0];
      if (!sz) return;
      slot.style.width = `${Math.round(sz.w * state.scale)}px`;
      slot.style.height = `${Math.round(sz.h * state.scale)}px`;
    });
  }

  function jumpToInputPage() {
    if (!state.numPages) return;
    const parsed = parseInt(String(pageInputEl.value || "").trim(), 10);
    if (!Number.isFinite(parsed)) {
      pageInputEl.value = String(state.curPage);
      return;
    }
    const targetPage = Math.max(1, Math.min(state.numPages, parsed));
    state.curPage = targetPage;
    pageInputEl.value = String(targetPage);
    const slot = pagesColEl.querySelector(`.gdpv-page-slot[data-page-num="${targetPage}"]`);
    if (slot) {
      stageEl.scrollTop = Math.max(0, slot.offsetTop - 16);
      renderPageIntoSlot(targetPage, slot);
    }
  }

  function updateCurrentPageFromScroll() {
    if (!pagesColEl || !state.numPages) return;
    const slots = pagesColEl.querySelectorAll(".gdpv-page-slot");
    if (!slots.length) return;
    const midY = stageEl.scrollTop + stageEl.clientHeight * 0.36;
    let bestPage = 1;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (s.offsetTop <= midY) {
        bestPage = i + 1;
      } else {
        break;
      }
    }
    if (bestPage !== state.curPage) {
      state.curPage = bestPage;
      if (document.activeElement !== pageInputEl) {
        pageInputEl.value = String(bestPage);
      }
    }
  }

  async function renderPageIntoSlot(pageNum, slotEl) {
    if (!state.pdfDoc || !slotEl) return;
    const targetScale = state.scale;
    const alreadyScale = state.renderedScales.get(pageNum);
    if (alreadyScale && Math.abs(alreadyScale - targetScale) < 0.02) return;

    const prevTask = state.renderTasks.get(pageNum);
    if (prevTask && prevTask.cancel) {
      try {
        prevTask.cancel();
      } catch (_) {}
    }

    const token = state.openToken;
    try {
      const page = await state.pdfDoc.getPage(pageNum);
      if (token !== state.openToken || !state.isOpen) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2.25);
      const viewport = page.getViewport({ scale: targetScale * dpr });
      const cssW = Math.round(viewport.width / dpr);
      const cssH = Math.round(viewport.height / dpr);

      slotEl.style.width = `${cssW}px`;
      slotEl.style.height = `${cssH}px`;
      state.basePageSizes[pageNum - 1] = {
        w: viewport.width / (targetScale * dpr),
        h: viewport.height / (targetScale * dpr)
      };

      const offCanvas = document.createElement("canvas");
      offCanvas.width = Math.ceil(viewport.width);
      offCanvas.height = Math.ceil(viewport.height);
      const ctx = offCanvas.getContext("2d", { alpha: false });

      const task = page.render({ canvasContext: ctx, viewport });
      state.renderTasks.set(pageNum, task);
      await task.promise;
      if (token !== state.openToken || !state.isOpen) return;

      slotEl.replaceChildren(offCanvas);
      state.renderedScales.set(pageNum, targetScale);
      state.renderTasks.delete(pageNum);
    } catch (err) {
      if (err && err.name === "RenderingCancelledException") return;
    }
  }

  function rerenderVisiblePages() {
    if (!pagesColEl || !state.pdfDoc) return;
    const viewTop = stageEl.scrollTop - stageEl.clientHeight;
    const viewBot = stageEl.scrollTop + stageEl.clientHeight * 2;
    pagesColEl.querySelectorAll(".gdpv-page-slot").forEach((slot) => {
      const top = slot.offsetTop;
      const bot = top + slot.offsetHeight;
      if (bot >= viewTop && top <= viewBot) {
        const pNum = Number(slot.dataset.pageNum || 1);
        renderPageIntoSlot(pNum, slot);
      }
    });
  }

  function setupIntersectionObserver() {
    if (ioObserver) ioObserver.disconnect();
    ioObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            const slot = ent.target;
            const pNum = Number(slot.dataset.pageNum || 1);
            renderPageIntoSlot(pNum, slot);
          }
        });
      },
      {
        root: stageEl,
        rootMargin: "900px 0px 900px 0px",
        threshold: 0.01
      }
    );
    pagesColEl.querySelectorAll(".gdpv-page-slot").forEach((s) => ioObserver.observe(s));
  }

  function triggerRealDownload() {
    if (!state.url) return;
    const a = document.createElement("a");
    a.href = state.url;
    a.dataset.bypassPdfPreview = "1";
    const dlName = state.downloadName || inferFilenameFromUrl(state.url);
    a.setAttribute("download", dlName);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function triggerPrint() {
    if (!state.url) return;
    try {
      if (printFrameEl) printFrameEl.remove();
      printFrameEl = document.createElement("iframe");
      printFrameEl.className = "gdpv-print-frame";
      printFrameEl.src = state.url;
      printFrameEl.onload = () => {
        try {
          printFrameEl.contentWindow.focus();
          printFrameEl.contentWindow.print();
        } catch (_) {
          window.open(state.url, "_blank", "noopener");
        }
      };
      document.body.appendChild(printFrameEl);
    } catch (_) {
      window.open(state.url, "_blank", "noopener");
    }
  }

  function cleanupPdfState() {
    if (ioObserver) {
      ioObserver.disconnect();
      ioObserver = null;
    }
    state.renderTasks.forEach((t) => {
      if (t && t.cancel) {
        try {
          t.cancel();
        } catch (_) {}
      }
    });
    state.renderTasks.clear();
    state.renderedScales.clear();
    if (state.pdfDoc && state.pdfDoc.destroy) {
      try {
        state.pdfDoc.destroy();
      } catch (_) {}
    }
    state.pdfDoc = null;
    state.basePageSizes = [];
  }

  function closePreview() {
    if (!state.isOpen) return;
    state.isOpen = false;
    state.openToken++;
    cleanupPdfState();
    if (zoomMenuEl) zoomMenuEl.hidden = true;
    if (overlayEl) overlayEl.hidden = true;
    if (pagesColEl) pagesColEl.replaceChildren();
    document.documentElement.style.overflow = "";
    if (state.prevFocus && typeof state.prevFocus.focus === "function") {
      try {
        state.prevFocus.focus();
      } catch (_) {}
    }
  }

  function inferFilenameFromUrl(url) {
    try {
      const clean = String(url || "").split("#")[0].split("?")[0];
      const seg = decodeURIComponent(clean.split("/").pop() || "document.pdf");
      return seg.toLowerCase().endsWith(".pdf") ? seg : `${seg}.pdf`;
    } catch (_) {
      return "document.pdf";
    }
  }

  async function openPreview(url, opts) {
    if (!url) return;
    ensureDom();
    const options = opts || {};
    state.prevFocus = document.activeElement;
    cleanupPdfState();

    const token = ++state.openToken;
    state.isOpen = true;
    state.url = url;
    state.downloadName = options.downloadName || inferFilenameFromUrl(url);
    state.title = options.title || state.downloadName;
    state.numPages = 1;
    state.curPage = 1;
    state.fitMode = "width";
    state.scale = 1.0;

    titleEl.textContent = state.title;
    pageInputEl.value = "1";
    pageTotalEl.textContent = "…";
    pagesColEl.innerHTML = `
      <div class="gdpv-loading-box">
        <div class="gdpv-spinner" aria-hidden="true"></div>
        <div>กำลังเปิดตัวอย่างไฟล์ PDF…</div>
      </div>
    `;
    overlayEl.hidden = false;
    document.documentElement.style.overflow = "hidden";
    stageEl.scrollTop = 0;
    syncToolbarState();

    try {
      const pdfjsLib = await loadPdfJs();
      const loadingTask = pdfjsLib.getDocument({
        url,
        cMapUrl: CMAP_URL,
        cMapPacked: true,
        standardFontDataUrl: STD_FONT_URL
      });
      const pdfDoc = await loadingTask.promise;
      if (token !== state.openToken || !state.isOpen) {
        pdfDoc.destroy();
        return;
      }

      state.pdfDoc = pdfDoc;
      state.numPages = pdfDoc.numPages || 1;
      pageTotalEl.textContent = String(state.numPages);

      const firstPage = await pdfDoc.getPage(1);
      if (token !== state.openToken || !state.isOpen) return;
      const vp1 = firstPage.getViewport({ scale: 1 });
      state.basePageSizes = Array.from({ length: state.numPages }, () => ({
        w: vp1.width,
        h: vp1.height
      }));

      state.scale = computeFitScale("width");
      pagesColEl.replaceChildren();

      const frag = document.createDocumentFragment();
      for (let p = 1; p <= state.numPages; p++) {
        const slot = document.createElement("div");
        slot.className = "gdpv-page-slot";
        slot.dataset.pageNum = String(p);
        slot.style.width = `${Math.round(vp1.width * state.scale)}px`;
        slot.style.height = `${Math.round(vp1.height * state.scale)}px`;
        const ph = document.createElement("div");
        ph.className = "gdpv-page-placeholder";
        ph.textContent = `Page ${p} / ${state.numPages}`;
        slot.appendChild(ph);
        frag.appendChild(slot);
      }
      pagesColEl.appendChild(frag);

      syncToolbarState();
      setupIntersectionObserver();

      // Immediately render pages 1 and 2 for instant crisp display
      const slot1 = pagesColEl.querySelector('.gdpv-page-slot[data-page-num="1"]');
      const slot2 = pagesColEl.querySelector('.gdpv-page-slot[data-page-num="2"]');
      if (slot1) renderPageIntoSlot(1, slot1);
      if (slot2) renderPageIntoSlot(2, slot2);
    } catch (err) {
      if (token !== state.openToken || !state.isOpen) return;
      // Graceful native PDF viewer fallback if PDF.js cannot parse
      pagesColEl.innerHTML = `
        <iframe class="gdpv-native-iframe" src="${url.replace(/"/g, "&quot;")}" title="PDF Preview"></iframe>
      `;
      pageTotalEl.textContent = "1";
      syncToolbarState();
    }
  }

  function isLocalPdfHref(href) {
    if (!href) return false;
    const raw = String(href).trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("javascript:") || raw.startsWith("mailto:")) return false;
    const clean = raw.split("#")[0].split("?")[0].toLowerCase();
    if (!clean.endsWith(".pdf")) return false;
    // Allow same-origin / relative PDFs (exports/pdf/..., downloads/...)
    if (/^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw, window.location.href);
        if (u.origin !== window.location.origin) return false;
      } catch (_) {
        return false;
      }
    }
    return true;
  }

  // Global capture-phase click interceptor so every PDF download button opens Preview first
  document.addEventListener(
    "click",
    (ev) => {
      if (ev.defaultPrevented) return;
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const anchor = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
      if (!anchor) return;
      if (anchor.dataset.bypassPdfPreview === "1") return;
      const rawHref = anchor.getAttribute("href");
      if (!isLocalPdfHref(rawHref)) return;

      ev.preventDefault();
      ev.stopPropagation();

      // Close any open dropdown menus nicely before showing preview
      document.querySelectorAll(".tv-export-dropdown").forEach((d) => {
        d.hidden = true;
      });

      const dlAttr = anchor.getAttribute("download") || "";
      const customTitle = anchor.getAttribute("data-pdf-preview-title") || "";
      const downloadName = dlAttr || inferFilenameFromUrl(rawHref);
      const title = customTitle || dlAttr || anchor.title || downloadName;
      openPreview(anchor.href, { title, downloadName });
    },
    true
  );

  window.RACM_PDF_PREVIEW = {
    open: openPreview,
    close: closePreview,
    downloadCurrent: triggerRealDownload,
    printCurrent: triggerPrint
  };
})();
