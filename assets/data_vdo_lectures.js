/* ==========================================================================
   RACM 303 (ปีการศึกษา 2569) — STEP 06 · VDO Lecture Manifest & Studio Bridge
   --------------------------------------------------------------------------
   • รองรับครบทั้ง 7 บทเรียน: ST1, HS1, HS2, HS3, HS4, HS5, HS6
   • สถานะเริ่มต้น: uploaded = false ("รอแขวน VDO")
   • ออกแบบให้ Plug-and-Play สำหรับนำ VDO บรรยายมาแขวน และรองรับการ Apply Style
     จาก Interactive VDO Lecture Studio (window.RACM_VDO_LECTURE_STUDIO)
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "racm303_vdo_lectures_v1";
  var MODULE_ORDER = ["ST1", "HS1", "HS2", "HS3", "HS4", "HS5", "HS6"];

  var DEFAULT_MANIFEST = {
    ST1: {
      code: "ST1",
      title: "VDO Lecture · แนวคิดเบื้องต้นเกี่ยวกับระบบและการคิดเชิงระบบ (Systems & Systems Thinking)",
      uploaded: false,
      statusLabel: "รอแขวน VDO",
      statusEn: "Awaiting VDO",
      stylePreset: "vdo-studio-pending",
      videoUrl: "",
      externalUrl: "",
      durationLabel: "",
      lecturer: "อ.นพ.ณัฐวุฒิ เอี่ยงธนรัตน์",
      note: "รอแขวน VDO บรรยายประจำคาบ ST1 (CAS · CLD · Iceberg Model) — พร้อมรองรับ Interactive VDO Lecture Studio",
      slides: [],
      chapters: [],
      companionHeClips: []
    },
    HS1: {
      code: "HS1",
      title: "VDO Lecture · แนวคิดด้านสุขภาพ ปัจจัยกำหนดสุขภาพ และการป้องกันโรค",
      uploaded: false,
      statusLabel: "รอแขวน VDO",
      statusEn: "Awaiting VDO",
      stylePreset: "vdo-studio-pending",
      videoUrl: "",
      externalUrl: "",
      durationLabel: "",
      lecturer: "อ.พญ.วริษา สุนทรวินิต",
      note: "รอแขวน VDO บรรยายประจำคาบ HS1 (Disease–Illness–Sickness · SDH · Primordial–Quaternary Prevention)",
      slides: [],
      chapters: [],
      companionHeClips: []
    },
    HS2: {
      code: "HS2",
      title: "VDO Lecture · โครงสร้างของระบบสุขภาพและรูปแบบการดูแล (Structure of Health Systems & Models of Care)",
      uploaded: false,
      statusLabel: "รอแขวน VDO",
      statusEn: "Awaiting VDO",
      stylePreset: "vdo-studio-pending",
      videoUrl: "",
      externalUrl: "",
      durationLabel: "",
      lecturer: "อ.นพ.ณัฐวุฒิ เอี่ยงธนรัตน์",
      note: "รอแขวน VDO บรรยายประจำคาบ HS2 (WHO 6 Building Blocks & Models of Care 6W)",
      slides: [],
      chapters: [],
      companionHeClips: [
        { clipId: "HE00", startSec: 215, label: "HE 00 · Health Care Market & WHO System Goals (03:35)" },
        { clipId: "HE02", startSec: 65, label: "HE 02 · Supply of Health Care & Hospital Behavior (01:05)" },
        { clipId: "HE05", startSec: 25, label: "HE 05 · Strategic Purchasing & Service Delivery Incentives (00:25)" }
      ]
    },
    HS3: {
      code: "HS3",
      title: "VDO Lecture · หน้าที่ของระบบสุขภาพและคุณลักษณะของระบบบริการสุขภาพที่พึงประสงค์ (EQESaRR)",
      uploaded: true,
      readyLabel: "พร้อมรับชม Interactive Studio",
      statusLabel: "พร้อมรับชม",
      statusEn: "Interactive Studio Ready",
      stylePreset: "vdo-studio-ready",
      studioGlobalKey: "RACM303_HS3_VDO_STUDIO",
      videoUrl: "assets/videos/hs3a_desirable_hss.mp4",
      externalUrl: "https://drive.google.com/file/d/1Ld7BH6tNlHJ87tDsCoAy0mv__oGO-vss/view?usp=sharing",
      durationLabel: "83:49 · 57 สไลด์",
      lecturer: "รศ. ดร. นพ.บวรศม ลีระพันธ์ · อ. นพ.ภูษิต ประคองสาย",
      note: "เปิดรับชมวิดีโอบรรยาย HS3 แบบ Interactive VDO Lecture Studio เต็มรูปแบบ (เล่นตรงไม่ผ่าน YouTube · กรอ ±10s · ซับไตเติลไทย CC · คำพูดอาจารย์ Verbatim เลื่อนขึ้นอัตโนมัติ · Conceptualized + Logical Flow · ✓ Timeline Sync · หน้าต่างลอย PiP ย้ายและกางนิ้วย่อขยายได้)",
      slides: [],
      chapters: [],
      companionHeClips: [
        { clipId: "HE00", startSec: 270, label: "HE 00 · Technical vs Allocative Efficiency & Equity (04:30)" },
        { clipId: "HE01", startSec: 120, label: "HE 01 · Need vs Demand & Financial Barriers to Access (02:00)" },
        { clipId: "HE02", startSec: 1090, label: "HE 02 · Quality–Efficiency Trade-offs in Hospital Supply (18:10)" }
      ]
    },
    HS4: {
      code: "HS4",
      title: "VDO Lecture · พฤติกรรมสุขภาพ ความรอบรู้ด้านสุขภาพ และการสร้างเสริมสุขภาพ",
      uploaded: false,
      statusLabel: "รอแขวน VDO",
      statusEn: "Awaiting VDO",
      stylePreset: "vdo-studio-pending",
      videoUrl: "",
      externalUrl: "",
      durationLabel: "",
      lecturer: "ผศ.นพ.วิชช์ เกษมทรัพย์",
      note: "รอแขวน VDO บรรยายประจำคาบ HS4 (COM-B · Nudge · Health Literacy · Ottawa Charter & Shanghai Declaration)",
      slides: [],
      chapters: [],
      companionHeClips: []
    },
    HS5: {
      code: "HS5",
      title: "VDO Lecture · ระบบสุขภาพปฐมภูมิและบริการปฐมภูมิ (Primary Health Care & Primary Care)",
      uploaded: false,
      statusLabel: "รอแขวน VDO",
      statusEn: "Awaiting VDO",
      stylePreset: "vdo-studio-pending",
      videoUrl: "",
      externalUrl: "",
      durationLabel: "",
      lecturer: "อ.นพ.ฉัตรชัย อิ่มอารมย์",
      note: "รอแขวน VDO บรรยายประจำคาบ HS5 (Alma-Ata → Astana 3 เสาหลัก · 5 คุณลักษณะ Primary Care · EPHFs)",
      slides: [],
      chapters: [],
      companionHeClips: []
    },
    HS6: {
      code: "HS6",
      title: "VDO Lecture · หลักการและองค์ประกอบของการประกันสุขภาพ และการคลังสุขภาพ",
      uploaded: false,
      statusLabel: "รอแขวน VDO",
      statusEn: "Awaiting VDO",
      stylePreset: "vdo-studio-pending",
      videoUrl: "",
      externalUrl: "",
      durationLabel: "",
      lecturer: "อ.นพ.สัมฤทธิ์ ศรีธำรงสวัสดิ์ · อ.นพ.ณัฐวุฒิ เอี่ยงธนรัตน์",
      note: "รอแขวน VDO บรรยายหลักประจำคาบ HS6 — ระหว่างรอสามารถรับชมคลิปบรรยายชุด Health Economics 00–05 (6 ตอนครบ) ด้านล่างได้ทันที",
      slides: [],
      chapters: [],
      companionHeClips: [
        { clipId: "HE00", startSec: 15, label: "HE 00 · Overview & Health System Financing Flow (00:15)" },
        { clipId: "HE01", startSec: 40, label: "HE 01 · Uncertainty, Need vs Demand & Elasticity (00:40)" },
        { clipId: "HE02", startSec: 1090, label: "HE 02 · Asymmetric Information & Supplier-Induced Demand (18:10)" },
        { clipId: "HE03", startSec: 41, label: "HE 03 · Risk Pooling, Adverse Selection & Moral Hazard (00:41)" },
        { clipId: "HE04", startSec: 36, label: "HE 04 · UHC Cube, Beveridge/SHI/PHI & Thai 3 Schemes (00:36)" },
        { clipId: "HE05", startSec: 25, label: "HE 05 · Strategic Purchasing: FFS, Capitation, DRG & Global Budget (00:25)" }
      ]
    }
  };

  window.RACM_VDO_LECTURE_MANIFEST = Object.assign({}, DEFAULT_MANIFEST, window.RACM_VDO_LECTURE_MANIFEST || {});

  function readLocalOverrides() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function writeLocalOverrides(mapObj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapObj || {}));
    } catch (_) {}
  }

  function normalizeModCode(modCode) {
    var clean = String(modCode || "").trim().toUpperCase();
    return /^(ST1|HS[1-6])$/.test(clean) ? clean : "HS1";
  }

  function getVdoRecord(modCode) {
    var code = normalizeModCode(modCode);
    var base = window.RACM_VDO_LECTURE_MANIFEST[code] || DEFAULT_MANIFEST[code] || DEFAULT_MANIFEST.HS1;
    var overrides = readLocalOverrides();
    var ov = overrides[code] || null;
    var merged = Object.assign({}, base, ov || {});
    var hasUrl = Boolean(String(merged.videoUrl || merged.externalUrl || "").trim());
    var isUploaded = Boolean(merged.uploaded || hasUrl);
    merged.uploaded = isUploaded;
    merged.statusLabel = isUploaded ? (merged.readyLabel || "พร้อมรับชม") : (base.statusLabel || "รอแขวน VDO");
    merged.extBadge = isUploaded ? (merged.durationLabel || "VDO") : "รอแขวน VDO";
    return merged;
  }

  function countUploaded() {
    var uploaded = 0;
    for (var i = 0; i < MODULE_ORDER.length; i++) {
      if (getVdoRecord(MODULE_ORDER[i]).uploaded) uploaded += 1;
    }
    return { uploaded: uploaded, total: MODULE_ORDER.length };
  }

  function saveOverride(modCode, patch) {
    var code = normalizeModCode(modCode);
    var cur = readLocalOverrides();
    cur[code] = Object.assign({}, cur[code] || {}, patch || {}, {
      updatedAt: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
    });
    writeLocalOverrides(cur);
    window.dispatchEvent(new CustomEvent("racm:vdolecchange", { detail: { code: code } }));
    return getVdoRecord(code);
  }

  function clearOverride(modCode) {
    var code = normalizeModCode(modCode);
    var cur = readLocalOverrides();
    delete cur[code];
    writeLocalOverrides(cur);
    window.dispatchEvent(new CustomEvent("racm:vdolecchange", { detail: { code: code } }));
    return getVdoRecord(code);
  }

  window.RACM_VDO_LECTURE_HELPER = {
    moduleOrder: MODULE_ORDER,
    getRecord: getVdoRecord,
    countUploaded: countUploaded,
    saveOverride: saveOverride,
    clearOverride: clearOverride
  };

  /* Pluggable Studio Hook — ready for Interactive VDO Lecture Studio style */
  window.RACM_VDO_LECTURE_STUDIO = window.RACM_VDO_LECTURE_STUDIO || {
    version: "pending-style-bridge-1.0",
    renderCustomStage: null,
    registerStudio: function (impl) {
      if (impl && typeof impl === "object") {
        Object.assign(window.RACM_VDO_LECTURE_STUDIO, impl);
        window.dispatchEvent(new CustomEvent("racm:vdolecchange", { detail: { studioRegistered: true } }));
      }
    }
  };
})();
