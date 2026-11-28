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
  var HS_CORE_ORDER = ["HS1", "HS2", "HS3", "HS4", "HS5", "HS6"];

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
      title: "VDO Lecture · สุขภาพ (Health) ปัจจัยกำหนดสุขภาพ (Determinants of Health) และระดับการป้องกันโรค (Level of Disease Prevention)",
      uploaded: true,
      readyLabel: "พร้อมรับชม Interactive Studio",
      statusLabel: "พร้อมรับชม",
      statusEn: "Interactive Studio Ready",
      stylePreset: "vdo-studio-ready",
      studioGlobalKey: "RACM303_HS1_VDO_STUDIO",
      videoUrl: "assets/videos/hs1.mp4",
      externalUrl: "https://drive.google.com/file/d/17uz1ZCsGAgqYTQ1IqffNRNuIUl0ecfbb/view?usp=sharing",
      durationLabel: "56:47 · 35 สไลด์",
      lecturer: "อ. พญ.วริษา สุนทรวินิต",
      note: "เปิดรับชมวิดีโอบรรยาย HS1 แบบ Interactive VDO Lecture Studio เต็มรูปแบบ (กรอ ±10s · ซับไตเติลไทย CC · คำพูดอาจารย์ Verbatim เลื่อนขึ้นอัตโนมัติ · Conceptualized + Logical Flow · ✓ Timeline Sync · หน้าต่างลอย PiP ย้ายและกางนิ้วย่อขยายได้)",
      slides: [],
      chapters: [],
      companionHeClips: []
    },
    HS2: {
      code: "HS2",
      title: "VDO Lecture · โครงสร้างของระบบสุขภาพและรูปแบบการดูแล (Structure of Health Systems & Models of Care)",
      uploaded: true,
      readyLabel: "พร้อมรับชม Interactive Studio",
      statusLabel: "พร้อมรับชม",
      statusEn: "Interactive Studio Ready",
      stylePreset: "vdo-studio-ready",
      studioGlobalKey: "RACM303_HS2_VDO_STUDIO",
      videoUrl: "assets/videos/hs2a_structure_models.mp4?v=20261124hs2v2",
      externalUrl: "https://drive.google.com/file/d/1Bwd8lwEZAO2qfWRSnicZgzEtL6-Uh8Dw/view?usp=sharing",
      durationLabel: "79:33 · 47 สไลด์",
      lecturer: "อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์",
      note: "เปิดรับชมวิดีโอบรรยาย HS2 แบบ Interactive VDO Lecture Studio เต็มรูปแบบ (กรอ ±10s · ซับไตเติลไทย CC · คำพูดอาจารย์ Verbatim เลื่อนขึ้นอัตโนมัติ · Conceptualized + Logical Flow · ✓ Timeline Sync · หน้าต่างลอย PiP ย้ายและกางนิ้วย่อขยายได้)",
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
      note: "เปิดรับชมวิดีโอบรรยาย HS3 แบบ Interactive VDO Lecture Studio เต็มรูปแบบ (กรอ ±10s · ซับไตเติลไทย CC · คำพูดอาจารย์ Verbatim เลื่อนขึ้นอัตโนมัติ · Conceptualized + Logical Flow · ✓ Timeline Sync · หน้าต่างลอย PiP ย้ายและกางนิ้วย่อขยายได้)",
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
      title: "VDO Lecture · พฤติกรรมสุขภาพ การปรับเปลี่ยนพฤติกรรม และการสร้างเสริมสุขภาพ (รวมคลิปเก่าทบทวน Health Promotion)",
      uploaded: true,
      readyLabel: "พร้อมรับชม (คลิปเก่าทบทวน Health Promotion)",
      statusLabel: "พร้อมรับชม (คลิปเก่าทบทวน)",
      statusEn: "Archive Review Clip Ready",
      stylePreset: "vdo-studio-ready",
      studioGlobalKey: "RACM303_HS4_VDO_STUDIO",
      videoUrl: "assets/videos/hs4a_hp_archive_2020.mp4",
      externalUrl: "https://www.youtube.com/watch?v=faRiYM-h4Oc&t=1546s",
      durationLabel: "🕰️ คลิปเก่าทบทวน HP · 39:50 · 15 สไลด์",
      lecturer: "ผศ. นพ.วิชช์ เกษมทรัพย์ · (คลิปเก่าทบทวน HP ปี 2563: อ. นพ.ฉัตรชัย อิ่มอารมย์ (อ.บาส) & อ. นพ.ภาณุวิชญ์ แก้วกำจรชัย (อ.เต๊ะ))",
      heroNote: "🕰️ แขวนหนึ่งในคลิปบรรยายเก่า (บันทึกเมื่อ 28 เมษายน 2563 / ค.ศ. 2020 สมัยรายวิชา RACM 404 โดย อ. นพ.ฉัตรชัย อิ่มอารมย์ (อ.บาส) และ อ. นพ.ภาณุวิชญ์ แก้วกำจรชัย (อ.เต๊ะ)) เพื่อใช้ทบทวนเนื้อหาส่วนที่ 4 เรื่องการสร้างเสริมสุขภาพ (Health Promotion: ปฏิญญาเซี่ยงไฮ้ & กฎบัตรออตตาวา) ควบคู่กับเอกสารคำสอน HS4 — พร้อมรองรับการแขวนคลิปเพิ่มเติมในหมวด HS4",
      note: "เปิดรับชมหนึ่งในคลิปบรรยายเก่า (Archive 28 เม.ย. 2563 · 39:50 นาที · 15 สไลด์คมชัด Full HD) เพื่อทบทวนเรื่องการสร้างเสริมสุขภาพ (Health Promotion: Shanghai Declaration 3 Pillars & Ottawa Charter 5 Action Areas) แบบ Interactive VDO Lecture Studio เต็มรูปแบบ",
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
      title: "VDO Lecture · หลักการและองค์ประกอบของการประกันสุขภาพ และการคลังสุขภาพ (Health Economics & Financing ครบทั้ง 6 ตอน)",
      uploaded: true,
      readyLabel: "พร้อมรับชม Interactive Studio (6 ตอน)",
      statusLabel: "พร้อมรับชม",
      statusEn: "Interactive Studio Ready (6 Episodes)",
      stylePreset: "vdo-studio-ready",
      studioGlobalKey: "RACM303_HS6_VDO_STUDIO",
      videoUrl: "assets/videos/he00.mp4",
      externalUrl: "https://drive.google.com/drive/folders/1RqT-o4rvYE7DXf7bFU7HfPgue0vp49LW?usp=sharing",
      durationLabel: "6 ตอน · 141:09 · 71 สไลด์",
      lecturer: "อ. นพ.สัมฤทธิ์ ศรีธำรงสวัสดิ์ · นพ.ภานุวิชญ์ แก้วกำจรชัย · อ. นพ.ณัฐวุฒิ เอี่ยงธนรัตน์",
      note: "เปิดรับชมวิดีโอบรรยาย HS6 ครบทั้ง 6 ตอน (HE00–HE05 · รวม 141 นาที 71 สไลด์) แบบ Interactive VDO Lecture Studio เต็มรูปแบบ (สลับตอน HE00–HE05 ทันที · กรอ ±10s · ซับไตเติลไทย CC · คำพูดอาจารย์ Verbatim เลื่อนขึ้นอัตโนมัติ · Conceptualized + Logical Flow · ✓ Timeline Sync · หน้าต่างลอย PiP ย้ายและกางนิ้วย่อขยายได้)",
      slides: [],
      chapters: [],
      companionHeClips: [
        { clipId: "HE00", startSec: 128, label: "HE 00 · เกณฑ์แพทยสภา & แผนผัง 5 โมดูล (02:08)" },
        { clipId: "HE01", startSec: 258, label: "HE 01 · Allocative/Technical Efficiency, Equity & Opportunity Cost (04:18)" },
        { clipId: "HE02", startSec: 982, label: "HE 02 · CUA (QALY), ICER ≤ 160,000 & ชุดสิทธิประโยชน์ UCS (16:22)" },
        { clipId: "HE03", startSec: 936, label: "HE 03 · Risk Pooling, Adverse Selection & SHI vs General Tax (15:36)" },
        { clipId: "HE04", startSec: 368, label: "HE 04 · 3 กองทุนไทย, FFS, DRGs (RW/CMI), Capitation & Moral Hazard (06:08)" },
        { clipId: "HE05", startSec: 456, label: "HE 05 · กรณีศึกษาร่วมจ่ายบัตรทอง & กราฟจริง CSMBS OP/IP (07:36)" }
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
    if (base.studioGlobalKey && ov && !ov.videoUrl && !ov.externalUrl) {
      ov = null;
    }
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
    for (var i = 0; i < HS_CORE_ORDER.length; i++) {
      if (getVdoRecord(HS_CORE_ORDER[i]).uploaded) uploaded += 1;
    }
    return { uploaded: uploaded, total: HS_CORE_ORDER.length };
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
