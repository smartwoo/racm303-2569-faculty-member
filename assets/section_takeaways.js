(function () {
  "use strict";

  const LANG_PREF_STORAGE = "racm303_kt_lang_v1";

  /* ---------- Official RACM 303 (2569) Case Discussion Readiness & Table Specification Spine ---------- */
  const MODULE_META = {
    ST1: {
      code: "ST1",
      order: 0,
      specWeight: "รากฐาน",
      caseCountTH: "",
      caseCountEN: "",
      specPillTH: "รากฐานคิดเชิงระบบ · TH/EN",
      specPillEN: "Systems Foundation · TH/EN",
      specBadgeTH: "กรอบรายวิชา: รากฐานคิดเชิงระบบเชื่อม HS1–HS6 · ฟอร์ม 3A · SRN 1–2",
      specBadgeEN: "Course Blueprint: Foundational Systems Lens for HS1–HS6 · Form 3A · SRN 1–2",
      shortTH: "การคิดเชิงระบบ",
      shortEN: "Systems Thinking",
      arcTH: "สิ่งที่ควรรู้ระดับรากฐาน: มองระบบสุขภาพเป็นระบบซับซ้อนที่ปรับตัวได้ (CAS) อ่านวงจรป้อนกลับ และหาคานงัดใต้ภูเขาน้ำแข็ง",
      arcEN: "Foundational Scope: Viewing health systems as Complex Adaptive Systems (CAS), reading feedback loops, and finding structural leverage",
      sections: ["1", "2", "3", "4", "sum"],
    },
    HS1: {
      code: "HS1",
      order: 1,
      specWeight: "20%",
      caseCountTH: "3 กรณีศึกษา",
      caseCountEN: "3 Cases",
      specPillTH: "Case + Spec 20% · TH/EN",
      specPillEN: "Case + Spec 20% · TH/EN",
      specBadgeTH: "เตรียมตอบ Case Discussion (3 เคส) & Table Spec 20% · Open Note A4",
      specBadgeEN: "Case Discussion Readiness (3 Cases) & Table Spec 20% · Open Note A4",
      shortTH: "สุขภาพ ปัจจัยกำหนดสุขภาพ และการป้องกัน 4 ระดับ",
      shortEN: "Health, Determinants & 4 Levels of Prevention",
      arcTH: "สิ่งที่ควรรู้เพื่อตอบ Case Discussion (3 เคส) & Table Spec (20%): แยกมิติ Disease–Illness–Sickness ประเมินสุขภาวะ 4 มิติ (แยกภาวะสุขภาพที่เป็นอยู่ออกจากปัจจัยที่ส่งผลกระทบทั้งทางบวกและทางลบ) เชื่อมแผนภาพปัจจัยกำหนดสุขภาพ 4 หมวดและกรอบ WHO CSDH (Structural vs Intermediary) พร้อมจำแนกการป้องกันโรค 4 ระดับตามกลุ่มเป้าหมายและระยะของโรค",
      arcEN: "Case Discussion & Table Spec Readiness (3 Cases · 20%): Distinguish Disease–Illness–Sickness, assess 4-dimensional health (separating health status from positive and negative affecting factors), map the 4-ring DoH diagram & WHO CSDH (Structural vs. Intermediary), and classify 4 prevention levels by target group and disease stage",
      sections: ["1", "2", "3", "sum"],
    },
    HS2: {
      code: "HS2",
      order: 2,
      specWeight: "15%",
      caseCountTH: "2 กรณีศึกษา",
      caseCountEN: "2 Cases",
      specPillTH: "Case + Spec 15% · TH/EN",
      specPillEN: "Case + Spec 15% · TH/EN",
      specBadgeTH: "เตรียมตอบ Case Discussion (2 เคส) & Table Spec 15% · Open Note A4",
      specBadgeEN: "Case Discussion Readiness (2 Cases) & Table Spec 15% · Open Note A4",
      shortTH: "โครงสร้างของระบบสุขภาพและรูปแบบการดูแล",
      shortEN: "Structure of Health Systems & Models of Care",
      arcTH: "สิ่งที่ควรรู้เพื่อตอบ Case Discussion (2 เคส) & Table Spec (15%): ขีดขอบเขตระบบสุขภาพ เชื่อม 4 หน้าที่สู่ 3 เป้าหมาย วินิจฉัยคอขวดและทางออกโรงพยาบาลครบ 6 Building Blocks แบบ CAS และเปรียบเทียบรูปแบบการดูแล (Acute vs Chronic/Ambulatory & Rehab) ตามกรอบ WHAT–WHY–HOW (6W)",
      arcEN: "Case Discussion & Table Spec Readiness (2 Cases · 15%): Define health system boundaries, link 4 Functions to 3 Goals, diagnose hospital bottlenecks across all 6 Building Blocks as a CAS, and align Acute vs. Chronic/Rehab Models of Care via WHAT–WHY–HOW (6W)",
      sections: ["1", "2", "3", "4", "5", "sum"],
    },
    HS3: {
      code: "HS3",
      order: 3,
      specWeight: "15%",
      caseCountTH: "2 กรณีศึกษา",
      caseCountEN: "2 Cases",
      specPillTH: "Case + Spec 15% · TH/EN",
      specPillEN: "Case + Spec 15% · TH/EN",
      specBadgeTH: "เตรียมตอบ Case Discussion (2 เคส) & Table Spec 15% · Open Note A4",
      specBadgeEN: "Case Discussion Readiness (2 Cases) & Table Spec 15% · Open Note A4",
      shortTH: "หน้าที่ของระบบสุขภาพและคุณลักษณะที่พึงประสงค์ (EQESaRR)",
      shortEN: "Functions of Health Systems & Desirable Characteristics (EQESaRR)",
      arcTH: "สิ่งที่ควรรู้เพื่อตอบ Case Discussion (2 เคส) & Table Spec (15%): ประเมินนโยบายและบริการด้วย EQESaRR แยกองค์ประกอบหลัก–ย่อยพร้อมนิยามทฤษฎี (Equity การเข้าถึง 4 มิติ, Quality กรอบ STEP/ACP & Effective Coverage, Efficiency เชิงเทคนิค vs การจัดสรร, ธรรมาภิบาล PPP และความยืดหยุ่น/ยั่งยืน)",
      arcEN: "Case Discussion & Table Spec Readiness (2 Cases · 15%): Evaluate policies using Main + Sub-dimensions of EQESaRR—4-dimension Equity of Access, STEP Quality/ACP & Effective Coverage, Technical vs. Allocative Efficiency, PPP Governance, and Resilience/Sustainability trade-offs",
      sections: ["1", "2", "3", "4", "5", "6", "7", "sum"],
    },
    HS4: {
      code: "HS4",
      order: 4,
      specWeight: "15%",
      caseCountTH: "1 กรณีศึกษา · 3 ประเด็น",
      caseCountEN: "1 Case · 3 Sub-Qs",
      specPillTH: "Case + Spec 15% · TH/EN",
      specPillEN: "Case + Spec 15% · TH/EN",
      specBadgeTH: "เตรียมตอบ Case Discussion (3 ประเด็น) & Table Spec 15% · Open Note A4",
      specBadgeEN: "Case Discussion Readiness (3 Sub-Qs) & Table Spec 15% · Open Note A4",
      shortTH: "พฤติกรรมสุขภาพ การปรับเปลี่ยนพฤติกรรม และการสร้างเสริมสุขภาพ",
      shortEN: "Health Behaviour, Behaviour Change & Health Promotion",
      arcTH: "สิ่งที่ควรรู้เพื่อตอบ Case Discussion (3 ประเด็น) & Table Spec (15%): แยกพฤติกรรมปัญหา–พฤติกรรมเป้าหมายออกจากผลลัพธ์สุขภาพ วิเคราะห์แรงบีบคั้นเชิงพาณิชย์ (CDoH) วินิจฉัยกลไก COM-B ครบ 6 องค์ประกอบย่อย คู่ความรอบรู้ด้านสุขภาพ และกฎบัตรออตตาวาครบ 5 ด้านปฏิบัติการ",
      arcEN: "Case Discussion & Table Spec Readiness (3 Sub-Qs · 15%): Distinguish Problem vs. Target Behavior from clinical outcomes, diagnose Commercial Determinants (CDoH) & all 6 COM-B sub-components, pair dual-level Health Literacy, and apply all 5 Ottawa Charter Action Areas",
      sections: ["1", "2", "3", "4", "sum"],
    },
    HS5: {
      code: "HS5",
      order: 5,
      specWeight: "15%",
      caseCountTH: "1 กรณีศึกษา · 2 ประเด็น",
      caseCountEN: "1 Case · 2 Sub-Qs",
      specPillTH: "Case + Spec 15% · TH/EN",
      specPillEN: "Case + Spec 15% · TH/EN",
      specBadgeTH: "เตรียมตอบ Case Discussion (2 ประเด็น) & Table Spec 15% · Open Note A4",
      specBadgeEN: "Case Discussion Readiness (2 Sub-Qs) & Table Spec 15% · Open Note A4",
      shortTH: "ระบบสุขภาพปฐมภูมิและบริการปฐมภูมิ",
      shortEN: "Primary Health Care (PHC) & Primary Care (PC)",
      arcTH: "สิ่งที่ควรรู้เพื่อตอบ Case Discussion (2 ประเด็น) & Table Spec (15%): แยกบริการปฐมภูมิระดับบุคคลครบ 5 คุณลักษณะ (4Cs + ยึดคนเป็นศูนย์กลาง และความต่อเนื่องข้ามรอยต่อ) ออกจากระบบสุขภาพปฐมภูมิ 3 เสาหลักตามปฏิญญา Astana (บริการบูรณาการคู่ EPHFs · นโยบายข้ามภาคส่วน · การเสริมพลังชุมชน)",
      arcEN: "Case Discussion & Table Spec Readiness (2 Sub-Qs · 15%): Distinguish 5 Personal/Primary Care attributes (4Cs + Person-Centeredness & care transitions) from Astana's 3 whole-of-society PHC pillars (Integrated PC + EPHFs · Multisectoral Policy · Empowered Communities)",
      sections: ["1", "2", "3", "4", "5", "6", "7", "sum"],
    },
    HS6: {
      code: "HS6",
      order: 6,
      specWeight: "20%",
      caseCountTH: "3 กรณีศึกษา",
      caseCountEN: "3 Cases",
      specPillTH: "Case + Spec 20% · TH/EN",
      specPillEN: "Case + Spec 20% · TH/EN",
      specBadgeTH: "เตรียมตอบ Case Discussion (3 เคส) & Table Spec 20% · Open Note A4",
      specBadgeEN: "Case Discussion Readiness (3 Cases) & Table Spec 20% · Open Note A4",
      shortTH: "การประกันสุขภาพ หลักประกันสุขภาพถ้วนหน้า และกลไกการจ่ายเงิน",
      shortEN: "Health Insurance, UHC & Provider Payment Methods",
      arcTH: "สิ่งที่ควรรู้เพื่อตอบ Case Discussion (3 เคส) & Table Spec (20%): วิเคราะห์ความก้าวหน้า UHC โลก (SDG 3.8.1–3.8.2 & UHC Cube 3 แกน) สมมติฐานประกันสมัครใจ 5 ข้อ ข้อยกเว้นเอกชนและ Externalities สิทธิ 3 กองทุนและประกันสังคม ม.33/39/40 ตลอดจนแรงจูงใจ FFS · Capitation · DRG · P4P",
      arcEN: "Case Discussion & Table Spec Readiness (3 Cases · 20%): Analyze global UHC trends (SDG 3.8.1–3.8.2 & 3-axis UHC Cube), 5 voluntary insurance assumptions, private exclusions & Externalities, Thai schemes + SSS Sec 33/39/40, and FFS · Capitation · DRG · P4P incentives",
      sections: ["1", "2", "3", "4", "5", "sum"],
    },
  };

  /* ==========================================================================
   * RACM 303 CASE DISCUSSION READINESS & TABLE SPEC — WHAT YOU SHOULD KNOW BANK
   * Backward-designed from all 12 HS Case Discussions & RACM 303 Handouts
   * ========================================================================== */
  const TAKEAWAYS_DB = {
    /* -------------------- ST1: Systems & Systems Thinking -------------------- */
    "ST1:1": {
      secLabelTH: "หมวดที่ 1 · แนวคิดพื้นฐานของระบบและบริบท",
      secLabelEN: "Section 1 · Core System Concepts & Context",
      titleTH: "องค์ประกอบ ความสัมพันธ์ ขอบเขต และบริบทของระบบ",
      titleEN: "Elements, Interconnections, Boundaries, and Context",
      summaryTH: "ระบบไม่ได้วัดกันที่จำนวนชิ้นส่วน แต่วัดกันที่ความสัมพันธ์และบริบทที่หล่อหลอมให้ชิ้นส่วนทำงานร่วมกันสู่เป้าหมาย",
      summaryEN: "A system is defined not by a collection of parts, but by how relationships and context shape those parts toward a shared purpose.",
      bullets: [
        {
          th: "<strong>ระบบคือความเชื่อมโยงที่มีเป้าหมาย:</strong> ระบบประกอบด้วยองค์ประกอบย่อย (`elements`) ที่สัมพันธ์กันผ่านกระบวนการแปลงปัจจัยนำเข้าเป็นผลลัพธ์ (`input–process–output`) ภายใต้เส้นแบ่งขอบเขต (`boundary`) ที่ชัดเจน",
          en: "<strong>Purposeful Interconnectedness:</strong> Every system links interdependent elements through an input–process–output flow bounded from its external environment.",
        },
        {
          th: "<strong>เส้นแบ่งขอบเขตกำหนดความรับผิดชอบ:</strong> การขีดเส้นขอบเขตที่ต่างกันทำให้ผู้วิเคราะห์มองเห็นผู้เกี่ยวข้อง สาเหตุ และขอบเขตการแก้ปัญหาแตกต่างกัน",
          en: "<strong>Boundaries Frame Solutions:</strong> Where we draw a system's boundary determines which actors, causes, and responsibilities become visible.",
        },
        {
          th: "<strong>บริบทเปลี่ยนพฤติกรรมของระบบได้:</strong> เวลา สถานที่ และการให้ความหมายของผู้คน (`meaning-making`) ทำให้มาตรการเดียวกันให้ผลลัพธ์ต่างกันในแต่ละพื้นที่",
          en: "<strong>Context Shapes Performance:</strong> Time, place, and human meaning-making cause identical interventions to behave differently across settings.",
        },
      ],
      flowRoleTH: "วางนิยามพื้นฐานของคำว่า 'ระบบ ขอบเขต และบริบท' ก่อนจำแนกธรรมชาติของระบบสามัญ ยุ่งยาก และซับซ้อนในหมวดที่ 2",
      flowRoleEN: "Establishes the foundational vocabulary of elements, boundaries, and context before classifying system complexity in Section 2.",
      crossLinks: [
        {
          target: "HS2:1",
          labelTH: "HS2 · หมวด 1 (ขอบเขตระบบสุขภาพ)",
          labelEN: "HS2 · Sec 1 (Health System Boundary)",
          whyTH: "การขีดเส้นขอบเขตระบบสุขภาพตาม WHO กำหนดว่ากิจกรรมใดอยู่ในความรับผิดชอบของระบบสุขภาพ",
          whyEN: "WHO's health-action boundary applies ST1 boundary thinking to define what belongs inside a health system.",
        },
        {
          target: "HS3:5",
          labelTH: "HS3 · หมวด 5 (ความสอดคล้องกับบริบท)",
          labelEN: "HS3 · Sec 5 (Contextual Relevance)",
          whyTH: "ความสอดคล้องกับบริบทพื้นที่ (`Relevance`) ใน EQESaRR ต่อยอดโดยตรงจากหลักบริบทของระบบ",
          whyEN: "Contextual relevance in EQESaRR builds directly on context-dependent system behavior.",
        },
      ],
      keywords: [
        { th: "องค์ประกอบและความสัมพันธ์", en: "Elements & Interconnections" },
        { th: "เส้นแบ่งขอบเขตระบบ", en: "System Boundary" },
        { th: "ปัจจัยนำเข้า–กระบวนการ–ผลลัพธ์", en: "Input–Process–Output" },
        { th: "บริบทและการให้ความหมาย", en: "Context & Meaning-Making" },
      ],
    },
    "ST1:2": {
      secLabelTH: "หมวดที่ 2 · ระบบสามัญ ระบบยุ่งยาก และระบบซับซ้อน (CAS)",
      secLabelEN: "Section 2 · Simple, Complicated, and Complex Adaptive Systems",
      titleTH: "การจำแนกธรรมชาติของระบบและระบบซับซ้อนที่ปรับตัวได้",
      titleEN: "System Typology and Complex Adaptive Systems (CAS)",
      summaryTH: "สูตรสำเร็จใช้ส่งจรวดในระบบยุ่งยากได้แม่นยำ แต่การดูแลชีวิตมนุษย์ในระบบซับซ้อนต้องอาศัยการปรับตัวร่วมกันอย่างเข้าใจ",
      summaryEN: "Blueprints launch rockets reliably in complicated systems, but nurturing human health in complex adaptive systems requires continuous mutual adaptation.",
      bullets: [
        {
          th: "<strong>แยกแยะ Simple · Complicated · Complex ให้แม่น:</strong> ระบบสามัญทำตามสูตร ระบบยุ่งยากอาศัยความเชี่ยวชาญเฉพาะทางเชิงเส้นตรง ส่วนระบบซับซ้อนมีความสัมพันธ์ไม่เป็นเส้นตรงและคาดเดาผลตายตัวไม่ได้",
          en: "<strong>Distinguish Three System Regimes:</strong> Simple systems follow recipes, complicated systems follow expert blueprints, while complex systems exhibit nonlinear, emergent outcomes.",
        },
        {
          th: "<strong>ระบบซับซ้อนที่ปรับตัวได้ (CAS) มีชีวิตและเรียนรู้เอง:</strong> สมาชิกในระบบเป็นระบบเปิดที่มีอิสระ ปรับตัวตามประสบการณ์ และสร้างวงจรป้อนกลับ (`feedback loops`)",
          en: "<strong>CAS Learn from Within:</strong> Agents in an open Complex Adaptive System self-organize, adapt to history, and interact through feedback loops.",
        },
        {
          th: "<strong>ไม่แน่นอนไม่ได้แปลว่าพัฒนาไม่ได้:</strong> แม้ผลลัพธ์เป็นเชิงความน่าจะเป็น แต่ผู้เข้าใจธรรมชาติของระบบสามารถจัดเงื่อนไขเกื้อหนุนให้เกิดผลลัพธ์ที่ดีขึ้นได้",
          en: "<strong>Probabilistic Yet Improvable:</strong> Uncertainty does not mean helplessness; shaping enabling conditions guides emergence toward better outcomes.",
        },
      ],
      flowRoleTH: "ต่อยอดจากนิยามระบบในหมวด 1 มาชี้ความแตกต่างสำคัญของ CAS เพื่อใช้วิเคราะห์ปัญหาคลินิกและโรงพยาบาลในหมวด 3",
      flowRoleEN: "Builds on Section 1's system basics to contrast linear reductionism with CAS, preparing for clinical and hospital applications in Section 3.",
      crossLinks: [
        {
          target: "HS2:4",
          labelTH: "HS2 · หมวด 4 (6 Building Blocks ในฐานะ CAS)",
          labelEN: "HS2 · Sec 4 (Building Blocks as CAS)",
          whyTH: "องค์ประกอบทั้ง 6 ของระบบสุขภาพไม่ได้ทำงานแยกส่วน แต่มีปฏิสัมพันธ์ไม่เป็นเส้นตรงแบบ CAS",
          whyEN: "WHO's 6 Building Blocks interact dynamically as a Complex Adaptive System rather than isolated silos.",
        },
        {
          target: "HS4:2",
          labelTH: "HS4 · หมวด 2 (ข้อจำกัดของ KAP และระบบคิดอัตโนมัติ)",
          labelEN: "HS4 · Sec 2 (Beyond KAP & Automatic Thinking)",
          whyTH: "การให้ความรู้เพียงอย่างเดียวไม่เปลี่ยนพฤติกรรมเสมอไป สะท้อนความไม่เป็นเส้นตรงของมนุษย์ใน CAS",
          whyEN: "Why knowledge alone fails to change behavior mirrors nonlinear human agency in CAS.",
        },
      ],
      keywords: [
        { th: "กระบวนทัศน์ลดทอนแยกส่วน", en: "Reductionism" },
        { th: "ระบบยุ่งยากเทียบกับระบบซับซ้อน", en: "Complicated vs. Complex" },
        { th: "ระบบซับซ้อนที่ปรับตัวได้", en: "Complex Adaptive Systems (CAS)" },
        { th: "ความไม่เป็นเส้นตรงและการจัดการตนเอง", en: "Nonlinearity & Self-Organization" },
      ],
    },
    "ST1:3": {
      secLabelTH: "หมวดที่ 3 · ระบบสุขภาพในฐานะระบบซับซ้อนที่ปรับตัวได้",
      secLabelEN: "Section 3 · Health Systems as Complex Adaptive Systems",
      titleTH: "ความซับซ้อนในเวชปฏิบัติ โรคเรื้อรัง และวงจรอุบาทว์ในระบบบริการ",
      titleEN: "Clinical Complexity, Chronic Care, and Vicious Cycles in Health Services",
      summaryTH: "การแก้ปัญหาเฉพาะจุดในระบบที่เชื่อมโยงกันมักสร้างผลข้างเคียงที่คาดไม่ถึง แพทย์จึงต้องมองเห็นวงจรป้อนกลับทั้งในคลินิกและโรงพยาบาล",
      summaryEN: "Isolated fixes in interconnected health systems often trigger unintended rebounds; clinicians must read feedback loops across bedside and hospital.",
      bullets: [
        {
          th: "<strong>เปลี่ยนจากช่างซ่อมเครื่องจักรเป็นผู้เอื้อให้ระบบเรียนรู้:</strong> ระบบสุขภาพไม่ใช่เครื่องยนต์ที่ถอดซ่อมแยกชิ้น แต่เป็นระบบสิ่งมีชีวิตที่ขับเคลื่อนด้วยความหมายและแรงจูงใจ",
          en: "<strong>From Mechanic to Steward of Learning:</strong> Health systems are living human networks rather than machines that can be repaired part by part.",
        },
        {
          th: "<strong>โรคเรื้อรังต้องการการดูแลแบบหุ้นส่วน ไม่ใช่สูตรโรคเฉียบพลัน:</strong> เมื่อความไม่แน่นอนสูงและความเข้าใจยังไม่ตรงกัน แพทย์ต้องสื่อสารสร้างข้อตกลงร่วมกับผู้ป่วยและครอบครัว",
          en: "<strong>Chronic Care Demands Partnership:</strong> Acute-care templates fail in chronic complex illness where clinical uncertainty and differing patient priorities coexist.",
        },
        {
          th: "<strong>ระวังวงจรอุบาทว์ของการแก้ปัญหาเฉพาะหน้า:</strong> การทุ่มทรัพยากรเพิ่มเฉพาะในห้องฉุกเฉินเพียงจุดเดียวอาจดึงงบจากคลินิกนอกเวลาและเร่งให้ผู้ป่วยไหลเข้า ER หนักกว่าเดิม",
          en: "<strong>Beware Single-Point Fixes:</strong> Expanding ER capacity alone drains outpatient/primary care resources and paradoxically draws even more non-urgent ER visits.",
        },
      ],
      flowRoleTH: "นำทฤษฎี CAS จากหมวด 2 มาฉายภาพจริงทั้งระดับดูแลผู้ป่วยและระดับห้องฉุกเฉิน ก่อนเรียนรู้เครื่องมือวิเคราะห์เชิงลึกในหมวด 4",
      flowRoleEN: "Translates CAS theory from Section 2 into bedside chronic care and ER crowding loops, motivating the analytical tools in Section 4.",
      crossLinks: [
        {
          target: "HS5:5",
          labelTH: "HS5 · หมวด 5 (บริการปฐมภูมิ 4Cs แก้แออัด)",
          labelEN: "HS5 · Sec 5 (4Cs Primary Care Relief)",
          whyTH: "การเสริมทีมหมอครอบครัวและบริการปฐมภูมินอกเวลาคือทางออกเชิงโครงสร้างที่ตัดวงจรแออัดห้องฉุกเฉิน",
          whyEN: "Strong first-contact, continuous primary care breaks the hospital ER crowding feedback loop.",
        },
        {
          target: "HS6:4",
          labelTH: "HS6 · หมวด 4 (แรงจูงใจจากวิธีจ่ายเงิน)",
          labelEN: "HS6 · Sec 4 (Payment Incentives & Feedback)",
          whyTH: "วิธีการจ่ายค่าบริการสร้างแรงจูงใจและผลลัพธ์ไม่ตั้งใจต่อพฤติกรรมโรงพยาบาล เช่น DRG creep",
          whyEN: "Provider payment rules create powerful feedback incentives and unintended behaviors like DRG creep.",
        },
      ],
      keywords: [
        { th: "อุปมาสิ่งมีชีวิตเทียบกับเครื่องจักร", en: "Living System vs. Machine Metaphor" },
        { th: "ความไม่แน่นอนและความเข้าใจตรงกัน", en: "Uncertainty & Agreement" },
        { th: "วงจรอุบาทว์", en: "Vicious Cycle" },
        { th: "ผลลัพธ์ที่ไม่ได้ตั้งใจ", en: "Unintended Consequences" },
      ],
    },
    "ST1:4": {
      secLabelTH: "หมวดที่ 4 · การคิดเชิงระบบและแบบจำลองภูเขาน้ำแข็ง",
      secLabelEN: "Section 4 · Systems Thinking & The Iceberg Model",
      titleTH: "มองทะลุเหตุการณ์เหนือผิวน้ำสู่โครงสร้างและกรอบความคิด",
      titleEN: "Seeing Beneath Events to System Structures and Mental Models",
      summaryTH: "เหตุการณ์วิกฤตเป็นเพียงยอดภูเขาน้ำแข็ง การเปลี่ยนแปลงที่ยั่งยืนเกิดเมื่อเราปรับโครงสร้างกติกาและกรอบความคิดใต้น้ำ",
      summaryEN: "Crises are only the visible tip of the iceberg; lasting transformation begins when we redesign underlying structures and mental models.",
      bullets: [
        {
          th: "<strong>4 ชั้นของภูเขาน้ำแข็งชี้ระดับคานงัด:</strong> ไล่จาก (1) เหตุการณ์เฉพาะหน้า → (2) แนวโน้มซ้ำซาก → (3) โครงสร้าง กติกา และแรงจูงใจ → (4) กรอบความคิด (`mental models`) ซึ่งให้พลังเปลี่ยนแปลงสูงสุด",
          en: "<strong>Four Iceberg Layers Reveal Leverage:</strong> Move from reactive events to recurring patterns, system structures/incentives, and deep mental models.",
        },
        {
          th: "<strong>คิดเชิงระบบ (Systems) ต่างจากคิดเป็นขั้นตอน (Systematic):</strong> `Systematic thinking` ช่วยจัดระเบียบแนวทางปฏิบัติให้ครบถ้วน ส่วน `Systems thinking` ช่วยเข้าใจพลวัตความสัมพันธ์ของทั้งระบบ",
          en: "<strong>Systems vs. Systematic Thinking:</strong> Systematic thinking organizes step-by-step protocols, whereas systems thinking uncovers dynamic whole-system relationships.",
        },
        {
          th: "<strong>ตั้งคำถามแบบเข้าใจความจริงเชิงบริบท:</strong> แทนที่จะถามเพียงว่ามาตรการได้ผลหรือไม่ ให้ถามว่า 'อะไรได้ผล สำหรับใคร และภายใต้บริบทเงื่อนไขใด'",
          en: "<strong>Context-Sensitive Inquiry:</strong> Ask not merely whether an intervention works, but what works, for whom, and under what contextual conditions.",
        },
      ],
      flowRoleTH: "สรุปเครื่องมือปฏิบัติการคิดเชิงระบบ (Iceberg Model) ปิดท้ายบท ST1 เพื่อเป็นแว่นขยายหลักในการเรียน HS1–HS6 ทุกบทถัดไป",
      flowRoleEN: "Equips learners with the 4-level Iceberg Model as the master analytical lens carried forward through HS1–HS6.",
      crossLinks: [
        {
          target: "HS1:2",
          labelTH: "HS1 · หมวด 2 (ปัจจัยโครงสร้างกำหนดสุขภาพ)",
          labelEN: "HS1 · Sec 2 (Structural Determinants / SDH)",
          whyTH: "ปัจจัยสังคมและเศรษฐกิจในกรอบ CSDH คือ 'โครงสร้างใต้ผิวน้ำ' ที่สร้างแนวโน้มความเหลื่อมล้ำทางสุขภาพ",
          whyEN: "WHO's structural determinants represent the underwater system structures driving health inequities.",
        },
        {
          target: "HS6:5",
          labelTH: "HS6 · หมวด 5 (ปรับโครงสร้างการจ่ายแทนคำสั่งตรง)",
          labelEN: "HS6 · Sec 5 (Indirect Payment Redesign)",
          whyTH: "การเปลี่ยนวิธีจ่ายเงินเป็นแบบล่วงหน้าคือการแก้ที่ชั้น 'โครงสร้างแรงจูงใจ' ใต้ภูเขาน้ำแข็ง",
          whyEN: "Shifting from FFS to prospective payment redesigns the structural incentive layer beneath provider behavior.",
        },
      ],
      keywords: [
        { th: "แบบจำลองภูเขาน้ำแข็ง 4 ระดับ", en: "Four-Level Iceberg Model" },
        { th: "โครงสร้างระบบและกติกา", en: "System Structures" },
        { th: "กรอบความคิด", en: "Mental Models" },
        { th: "การคิดเชิงระบบเทียบกับการคิดเป็นขั้นตอน", en: "Systems vs. Systematic Thinking" },
      ],
    },
    "ST1:sum": {
      secLabelTH: "บทสรุป · สังเคราะห์การคิดเชิงระบบสำหรับแพทย์",
      secLabelEN: "Synthesis · Systems Thinking for Clinicians",
      titleTH: "บทสรุปการคิดเชิงระบบเพื่อการดูแลผู้ป่วยและพัฒนาระบบสุขภาพ",
      titleEN: "Synthesizing Systems Thinking Across Bedside and Health Policy",
      summaryTH: "แพทย์ที่คิดเชิงระบบจะไม่เพียงรักษาอาการตรงหน้า แต่จะร่วมออกแบบกติกาและบริบทที่ทำให้ทุกคนมีสุขภาพดีได้อย่างยั่งยืน",
      summaryEN: "A systems-thinking physician treats today's patient while redesigning the rules and contexts that keep tomorrow's community healthy.",
      bullets: [
        {
          th: "<strong>เชื่อมคลินิกเข้ากับระบบ:</strong> ทุกปัญหาซ้ำซากในหอผู้ป่วยหรือห้องฉุกเฉินล้วนสะท้อนโครงสร้างการส่งต่อ ทรัพยากร และกรอบความคิดของระบบ",
          en: "<strong>Bridge Bedside and System:</strong> Recurrent clinical bottlenecks mirror deeper referral, resource, and mental-model structures.",
        },
        {
          th: "<strong>ใช้ทั้งสองโหมดคิดอย่างสมดุล:</strong> ใช้ `systematic thinking` เพื่อความปลอดภัยตามมาตรฐานคลินิก และใช้ `systems thinking` เมื่อเผชิญปัญหาซับซ้อนเรื้อรัง",
          en: "<strong>Pair Both Modes Wisely:</strong> Combine systematic clinical checklists for safety with systems thinking for complex chronic and organizational challenges.",
        },
      ],
      flowRoleTH: "รวบยอดกรอบคิด ST1 ทั้ง 4 หมวด เพื่อส่งไม้ต่อเข้าสู่ HS1 (นิยามสุขภาพ ปัจจัยกำหนดสุขภาพ และการป้องกัน 4 ระดับ)",
      flowRoleEN: "Consolidates ST1's four sections and hands off directly to HS1 (Health, Determinants, and Prevention).",
      crossLinks: [
        {
          target: "HS1:1",
          labelTH: "ต่อยอดสู่ HS1 · หมวด 1 (นิยามสุขภาพและมิติความป่วย)",
          labelEN: "Next: HS1 · Sec 1 (Health & Sickness Triad)",
          whyTH: "เริ่มใช้มุมมององค์รวมและบริบทของ ST1 เพื่อทำความเข้าใจความหมายของสุขภาพและมิติของการป่วย",
          whyEN: "Applies ST1's holistic lens directly to how patients, clinicians, and society define health and sickness.",
        },
      ],
      keywords: [
        { th: "ระบบซับซ้อนที่ปรับตัวได้", en: "Complex Adaptive Systems" },
        { th: "คานงัดเชิงโครงสร้าง", en: "Structural Leverage" },
        { th: "การเรียนรู้ร่วมกันในระบบ", en: "System-Wide Learning" },
      ],
    },

    /* -------------------- HS1: Health, Determinants & Prevention -------------------- */
    "HS1:1": {
      secLabelTH: "หมวดที่ 1 · มิติของการป่วยและนิยามสุขภาวะ 4 มิติ",
      secLabelEN: "Section 1 · Disease–Illness–Sickness & 4-Dimensional Health",
      titleTH: "แยกแยะมิติของการป่วย (Disease, Illness, Sickness) และการประเมินสุขภาวะองค์รวม 4 มิติ",
      titleEN: "Unpacking the Sickness Triad and Assessing 4-Dimensional Holistic Health",
      summaryTH: "แพทย์ตรวจพบโรค ผู้ป่วยรับรู้ความทุกข์ และสังคมกำหนดบทบาทคนป่วย ขณะที่การประเมินสุขภาพต้องมองครบทั้งกาย จิต ปัญญา และสังคม โดยแยกภาวะสุขภาพที่เป็นอยู่ออกจากปัจจัยแวดล้อมที่มากระทบ",
      summaryEN: "Clinicians diagnose disease, patients experience illness, and society assigns sickness; holistic health assessment spans physical, mental, spiritual/intellectual, and social dimensions while separating health status from affecting events.",
      bullets: [
        {
          th: "<strong>แยก 3 มิติของการป่วย (`Disease · Illness · Sickness`) ที่เกิดแยกจากกันได้:</strong> `Disease` คือความผิดปกติทางชีวเวชศาสตร์ที่แพทย์ตรวจพบ (เช่น ดัชนีมวลกายเข้าเกณฑ์อ้วน หรือความดัน/ไขมันในเลือดสูงระยะไร้สัญญาน) `Illness` คือความทุกข์ไม่สบายที่เจ้าตัวรับรู้ และ `Sickness` คือสถานะคนป่วยในสังคม ผู้ที่มี `Disease` โดยไม่มี `Illness` จึงมักไม่เดินมารับบริการเองหากระบบตั้งรับรอในคลินิก",
          en: "<strong>Three Independent Dimensions of Malady:</strong> Biomedical Disease (e.g., elevated BMI or asymptomatic hypertension), lived Illness, and social Sickness need not coincide—explaining why people with Disease but no Illness rarely seek passive clinic care.",
        },
        {
          th: "<strong>ประเมินสุขภาวะ 4 มิติ ตาม พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550 และธรรมนูญสุขภาพแห่งชาติ:</strong> ก้าวข้ามการปราศจากโรคและนิยาม 3 มิติของ WHO (1948) สู่ดุลยภาพทั้ง <strong>สุขภาวะทางกาย</strong> (สมรรถนะร่างกายและโรคหรือความเสี่ยงทางชีวภาพ) <strong>สุขภาวะทางจิต</strong> (สมดุลอารมณ์ ความเครียดสะสม การผ่อนคลาย) <strong>สุขภาวะทางสังคม</strong> (สัมพันธภาพในครอบครัว ที่ทำงาน ชุมชน) และ <strong>สุขภาวะทางปัญญา</strong> (สติ รู้เท่าทันตนเอง ไตร่ตรองเชื่อมโยงเหตุปัจจัยและลุกขึ้นปรับพฤติกรรมดูแลตนเอง ไม่ได้จำกัดเฉพาะพิธีกรรมทางศาสนา)",
          en: "<strong>Four Holistic Dimensions (Thai Health Act & Charter):</strong> Assess Physical, Mental, Social, and Spiritual/Intellectual well-being (`สุขภาวะทางปัญญา`—mindful self-awareness, learning from health feedback, and wise life choices beyond religious rituals).",
        },
        {
          th: "<strong>แยก 'ภาวะสุขภาพที่เป็นอยู่' ออกจาก 'พฤติกรรม/เหตุการณ์ที่ส่งผลกระทบ' และมองสุขภาพเป็นพลวัต:</strong> เวลาประเมินรายกรณีต้องแยกแยะสถานะสุขภาพของเจ้าตัวในแต่ละมิติ ออกจากพฤติกรรมหรือบริบทแวดล้อมที่ส่งผลทั้งทางบวกและทางลบ พร้อมเชื่อมมุมมองสุขภาพในฐานะความสามารถในการปรับตัวและจัดการตนเองแม้มีโรคเรื้อรัง",
          en: "<strong>Separate Health Status from Positive/Negative Influences:</strong> Clearly distinguish a person's current state in each dimension from the behaviors and workplace/family events positively or negatively affecting it, viewing health as dynamic capacity to adapt.",
        },
      ],
      caseLensTH: "ในการตอบ Case Discussion เรื่องสุขภาวะ 4 มิติ ให้แยกคอลัมน์ 'ภาวะสุขภาพของบุคคลนั้น (Health Status)' ออกจาก 'พฤติกรรมหรือเหตุการณ์ที่ส่งผลกระทบ (ทั้งผลบวกและผลลบ)' ให้ชัดเจนในครบทั้งกาย จิต สังคม และปัญญา และสังเกตรอยต่อผู้ที่มี Disease แต่ไม่รู้สึก Illness",
      caseLensEN: "When analyzing 4-dimensional health cases, strictly separate current 'Health Status' from positive and negative 'Affecting Behaviors/Events' across all four dimensions, and spot gaps where Disease exists without perceived Illness.",
      flowRoleTH: "วางฐานความเข้าใจว่า 'สุขภาพและการป่วยคืออะไรและประเมินครบ 4 มิติอย่างไร' ก่อนถามต่อในหมวด 2 ว่า 'ปัจจัยหลายระดับใดหล่อหลอมให้คนมีสุขภาพต่างกัน'",
      flowRoleEN: "Clarifies what health and malady mean across 4 dimensions before Section 2 maps the multi-level determinants shaping unequal health.",
      crossLinks: [
        {
          target: "ST1:3",
          labelTH: "ST1 · หมวด 3 (ความเข้าใจตรงกันในคลินิก)",
          labelEN: "ST1 · Sec 3 (Clinical Shared Meaning)",
          whyTH: "ช่องว่างระหว่าง `Disease` ของแพทย์กับ `Illness` ของผู้ป่วยคือจุดที่ต้องสร้างความเข้าใจร่วมกันในระบบซับซ้อน",
          whyEN: "Bridging biomedical Disease and lived Illness is central to managing clinical complexity.",
        },
        {
          target: "HS3:7",
          labelTH: "HS3 · หมวด 7 (ฐานคิดธรรมนูญสุขภาพไทย)",
          labelEN: "HS3 · Sec 7 (Thai National Health Charter)",
          whyTH: "นิยามสุขภาพ 4 มิติตาม พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550 เป็นรากฐานคุณค่าของธรรมนูญว่าด้วยระบบสุขภาพแห่งชาติ",
          whyEN: "Thailand's 4-dimensional holistic health definition anchors the National Health Charter.",
        },
      ],
      keywords: [
        { th: "โรค · ความเจ็บป่วย · สถานะผู้ป่วยในสังคม", en: "Disease · Illness · Sickness" },
        { th: "สุขภาวะ 4 มิติ (กาย · จิต · สังคม · ปัญญา)", en: "4-Dimensional Holistic Health" },
        { th: "การแยกภาวะสุขภาพออกจากปัจจัยที่ส่งผลกระทบ", en: "Health Status vs. Affecting Factors" },
        { th: "ความสามารถในการปรับตัวและจัดการตนเอง", en: "Capacity to Adapt & Self-Manage" },
      ],
    },
    "HS1:2": {
      secLabelTH: "หมวดที่ 2 · กรอบปัจจัยกำหนดสุขภาพ แผนภาพเชิงระบบ และ WHO CSDH",
      secLabelEN: "Section 2 · Determinants of Health Diagram & WHO CSDH Framework",
      titleTH: "แผนภาพพลวัตปัจจัยกำหนดสุขภาพ 4 หมวด กรอบ WHO CSDH และต้นตอความเหลื่อมล้ำทางสุขภาพ",
      titleEN: "Multi-Level Determinants Diagram, WHO CSDH (Structural vs. Intermediary), and Action Leverage",
      summaryTH: "พฤติกรรมและโรคไม่ได้เกิดจากความตั้งใจส่วนบุคคลโดด ๆ แต่เกิดจากปฏิสัมพันธ์สองทางระหว่างปัจเจก สิ่งแวดล้อม และระบบบริการ ภายใต้วงล้อมของปัจจัยเชิงโครงสร้างต้นน้ำ",
      summaryEN: "Health behaviors and outcomes never arise in isolation; they emerge from bidirectional links among individual traits, environments, and health services within an outer ring of structural determinants.",
      bullets: [
        {
          th: "<strong>สร้างแผนภาพปัจจัยกำหนดสุขภาพ 4 หมวดที่เชื่อมความสัมพันธ์แบบส่งผลถึงกันสองทิศทาง:</strong> วางปัญหาสุขภาพหลักตรงกลาง เชื่อมปฏิสัมพันธ์สองทิศทางระหว่าง <strong>(1) ปัจจัยส่วนบุคคล</strong> (พันธุกรรม/อายุ/เพศที่ปรับไม่ได้ เทียบกับความรู้ ทัศนคติ พฤติกรรมการกินและกิจกรรมทางกาย) กับ <strong>(2) สังคมและสิ่งแวดล้อมใกล้ตัว</strong> (เวลาครอบครัว ที่พัก โรงเรียน ที่ทำงาน สิ่งแวดล้อมทางอาหาร พื้นที่ออกกำลังกาย บรรทัดฐานคนรอบข้าง) และ <strong>(3) ระบบบริการสุขภาพ</strong> (บริการเชิงรุก อนามัยโรงเรียน อาชีวเวชศาสตร์ การคัดกรองและนัดติดตาม ควบคู่บทบาทแพทย์ `Clinician · Manager · Health Promoter`) ภายใต้วงล้อมชั้นนอกคือ <strong>(4) ปัจจัยเชิงโครงสร้างด้านการเมือง เศรษฐกิจ และสังคม</strong> (การกระจายอำนาจ ผังเมือง นโยบายองค์กร/โรงเรียน โครงสร้างชั่วโมงทำงาน และการตลาดอาหาร `CDoH`)",
          en: "<strong>4-Group Systemic DoH Diagram:</strong> Place the central health problem in the middle with bidirectional links among (1) Individual, (2) Social/Physical Environment, and (3) Health Services (spanning Clinician, Manager, and Health Promoter roles), all enclosed within (4) Macro-Structural Determinants.",
        },
        {
          th: "<strong>แยกปัจจัยต้นน้ำกับปัจจัยตัวกลางตามกรอบ WHO CSDH (`Solar & Irwin`):</strong> <strong>ปัจจัยเชิงโครงสร้างที่มีอิทธิพลต่อความเหลื่อมล้ำด้านสุขภาพ (`Structural determinants`)</strong> คือบริบทเศรษฐกิจ–การเมือง การบังคับใช้กฎหมายควบคุมแหล่งเสี่ยง ระบบการศึกษา โครงสร้างอาชีพแรงงานนอกระบบไร้หลักประกัน และค่านิยมทางสังคม ซึ่งกำหนดการได้รับ <strong>ปัจจัยทางสังคมที่มีผลต่อสุขภาพ (`Intermediary determinants`)</strong> ได้แก่ สภาพการทำงานและที่อยู่อาศัยจริง ช่วงวัยเปราะบาง (เช่น วัยรุ่นตั้งครรภ์ที่ขาดความพร้อม `self-care`) อิทธิพลคู่สมรส/ครอบครัว/เพื่อนร่วมอาชีพ และระบบบริการสุขภาพ",
          en: "<strong>WHO CSDH Structural vs. Intermediary Split:</strong> Structural determinants (education system, informal labor structure, law enforcement on community supply, societal norms) stratify exposure to Intermediary determinants (material work/living conditions, vulnerable life-stage self-care capacity, family/peer substance use, and health services).",
        },
        {
          th: "<strong>พีระมิดผลกระทบทางสุขภาพ (`Frieden's Health Impact Pyramid`):</strong> การให้คำปรึกษาและสอนสุขศึกษาปลายพีระมิดต้องอาศัยความพยายามรายบุคคลสูง แต่การปรับปัจจัยเศรษฐกิจสังคมและเปลี่ยนบริบทแวดล้อมให้ทางเลือกที่ดีต่อสุขภาพทำได้ง่ายที่ฐานพีระมิด สร้างผลกระทบระดับประชากรได้กว้างและยั่งยืนที่สุด",
          en: "<strong>Frieden's Health Impact Pyramid:</strong> Socioeconomic improvements and changing environmental defaults at the pyramid's base achieve broader, more equitable population impact than individual counseling alone.",
        },
      ],
      caseLensTH: "เมื่อวิเคราะห์แผนภาพ DoH หรือตาราง WHO CSDH ต้องเชื่อมหลักฐานจากโจทย์ให้ตรงหมวดโดยไม่กล่าวโทษผู้ป่วย (`non-blaming`): แยก 'โครงสร้างต้นน้ำ' (ระบบการศึกษา โครงสร้างจ้างงาน กฎหมาย/แหล่งขาย ผังเมือง โฆษณา นโยบายองค์กร) ออกจาก 'ปัจจัยตัวกลาง/สิ่งแวดล้อมใกล้ตัว' (ครอบครัว เพื่อนร่วมงาน ช่วงวัย ที่พัก โรงอาหาร บริการสุขภาพ)",
      caseLensEN: "In DoH diagram and WHO CSDH cases, cite concrete scenario clues without victim-blaming—cleanly separating macro-structural upstream rules (education, informal labor, law enforcement, urban/school policy, marketing) from intermediary/proximal conditions.",
      flowRoleTH: "ขยายมุมมองจากนิยามสุขภาวะ 4 มิติในหมวด 1 สู่แผนภาพต้นน้ำ–ปลายน้ำของปัญหาสุขภาพ เพื่อชี้จังหวะการป้องกันโรคทั้ง 4 ระดับในหมวด 3",
      flowRoleEN: "Moves from 4-dimensional health (Section 1) to upstream–intermediary determinant pathways, setting up targeted 4-level prevention in Section 3.",
      crossLinks: [
        {
          target: "HS4:4",
          labelTH: "HS4 · หมวด 4 (กฎบัตรออตตาวาจัดการปัจจัยกำหนดสุขภาพ)",
          labelEN: "HS4 · Sec 4 (Ottawa Charter & Determinants)",
          whyTH: "การสร้างเสริมสุขภาพใช้การสร้างนโยบายสาธารณะและสิ่งแวดล้อมที่เอื้อต่อสุขภาพเพื่อปรับปัจจัยต้นน้ำและปัจจัยเชิงพาณิชย์ (`CDoH`)",
          whyEN: "Health promotion operationalizes upstream action on social and commercial determinants via Healthy Public Policy.",
        },
        {
          target: "HS6:1",
          labelTH: "HS6 · หมวด 1 (คุ้มครองครัวเรือนไม่ให้ยากจนจากค่ารักษา)",
          labelEN: "HS6 · Sec 1 (Financial Risk Protection)",
          whyTH: "หลักประกันสุขภาพตัดวงจรย้อนกลับที่ความเจ็บป่วยผลักครัวเรือนตกลงสู่ความยากจน (`medical impoverishment`)",
          whyEN: "Health insurance prevents illness from worsening socioeconomic status through catastrophic bills.",
        },
      ],
      keywords: [
        { th: "แผนภาพปัจจัยกำหนดสุขภาพ 4 หมวด", en: "4-Group Determinants Diagram" },
        { th: "ปัจจัยเชิงโครงสร้างเทียบกับปัจจัยตัวกลาง", en: "Structural vs. Intermediary Determinants (CSDH)" },
        { th: "พีระมิดผลกระทบทางสุขภาพ", en: "Health Impact Pyramid" },
        { th: "ความไม่เป็นธรรมทางสุขภาพ", en: "Health Inequity" },
      ],
    },
    "HS1:3": {
      secLabelTH: "หมวดที่ 3 · ระดับของการป้องกันโรคทั้งสี่ระดับ",
      secLabelEN: "Section 3 · Four Levels of Disease Prevention",
      titleTH: "การจำแนก Primary · Secondary · Tertiary · Quaternary Prevention ตามระยะของโรคและมุมมองความสัมพันธ์",
      titleEN: "Classifying Primary, Secondary, Tertiary, and Quaternary Prevention by Disease Stage and Relational Matrix",
      summaryTH: "ระดับของการป้องกันโรคไม่ได้ตัดสินจากชื่อโครงการตายตัว แต่ตัดสินจากระยะของโรคในกลุ่มเป้าหมายและวัตถุประสงค์ของมาตรการ ควบคู่กับการไม่ตรวจรักษาเกินจำเป็น",
      summaryEN: "Prevention levels are defined never by activity labels alone, but by the target group's disease stage and intervention purpose—paired with quaternary protection against overmedicalization.",
      bullets: [
        {
          th: "<strong>กฎเหล็ก 3 องค์ประกอบ (`① กลุ่มเป้าหมาย · ② ระยะโรค/วัตถุประสงค์ · ③ มาตรการ`):</strong> กิจกรรมชื่อเดียวกันอยู่คนละระดับได้ตามกลุ่มเป้าหมาย เช่น โครงการปรับอาหาร/นับแคลอรีและออกกำลังกาย เมื่อทำในคนสุขภาพดีเพื่อป้องกันไม่ให้เกิดโรคจัดเป็น `Primary` แต่เมื่อผู้ป่วยความดันโลหิตสูงหรือไขมันในเลือดสูงเข้าร่วมเพื่อคุมโรคและลดภาวะแทรกซ้อนหลอดเลือดหัวใจจัดเป็น `Tertiary`",
          en: "<strong>3-Element Classification Rule (Target Group · Disease Stage/Purpose · Intervention):</strong> Identical activities shift levels by target population—lifestyle/calorie programs are Primary in healthy workers to prevent disease onset, but Tertiary in diagnosed HT/dyslipidemia patients to prevent cardiovascular complications.",
        },
        {
          th: "<strong>สามระดับตามลำดับเวลา (`Chronological View` — Leavell & Clark):</strong> `Primary` มุ่งผู้ยังไม่เกิดโรค (สร้างเสริมสุขภาพ จัดสิ่งแวดล้อม/การยศาสตร์ เลิกบุหรี่) เพื่อลดอุบัติการณ์ · `Secondary` มุ่งผู้ที่เริ่มมีความผิดปกติหรือเกิดการใช้สาร/ความเสี่ยงขึ้นแล้วแต่ยังไม่มีอาการแทรกซ้อน ด้วยการ <strong>ค้นหาระยะแรกเริ่ม (`Early detection / Screening`) และบำบัดรักษาทันที (`Prompt intervention`)</strong> (เช่น ตรวจสุขภาพประจำปีค้นหา HT/ไขมันสูง หรือคัดกรองสารเสพติดในคลินิกฝากครรภ์ทุกรายเพื่อบำบัดทันทีก่อนเกิดอันตรายต่อมารดาและทารกโดยไม่ตีตรา) · `Tertiary` มุ่งผู้ป่วยที่วินิจฉัยแล้ว (นัดติดตามรักษาต่อเนื่อง ฟื้นฟูสมรรถภาพ) เพื่อลดภาวะแทรกซ้อนและทุพพลภาพ",
          en: "<strong>Chronological Stages (Primary · Secondary · Tertiary):</strong> Primary prevents onset in healthy groups; Secondary applies screening/early detection and non-stigmatizing prompt intervention (e.g., workplace screening or universal ANC substance screening before maternal–fetal complications); Tertiary provides ongoing disease control and rehabilitation to prevent complications.",
        },
        {
          th: "<strong>การป้องกันระดับที่สี่ตามมุมมองความสัมพันธ์ (`Relational View` — Jamoulle):</strong> `Quaternary prevention` เกิดที่รอยต่อระหว่างมุมมองแพทย์กับผู้รับบริการ เพื่อปกป้องผู้รับบริการจากการตรวจคัดกรองแบบหว่าน การวินิจฉัยเกินจริง (`Overdiagnosis`) ผลบวกลวง และการรักษาเกินจำเป็น (`Overmedicalization`) เช่น การให้แพทย์อาชีวเวชศาสตร์ออกแบบโปรแกรมตรวจสุขภาพตามความเสี่ยงจริงของคนทำงานแทนการตรวจหว่านทุกรายการ",
          en: "<strong>Quaternary Prevention (Jamoulle's Relational Matrix):</strong> Protects individuals from over-testing, false positives, overdiagnosis, and overtreatment—exemplified by occupational physicians tailoring checkup panels strictly to evidence-based risks.",
        },
      ],
      caseLensTH: "ในการตอบ Case Discussion เรื่องระดับการป้องกันโรค ห้ามเขียนแค่ชื่อระดับลอย ๆ ต้องระบุควบคู่กันเสมอว่า (1) กลุ่มเป้าหมายอยู่ในระยะใดของโรค/ความเสี่ยง (2) วัตถุประสงค์มุ่งป้องกันอะไร (เช่น ค้นหาเร็วเพื่อบำบัดก่อนเกิดภาวะแทรกซ้อนต่อแม่และทารก = Secondary; ออกแบบชุดตรวจตามความเสี่ยงเพื่อกัน Over-testing = Quaternary)",
      caseLensEN: "Never state a prevention level without justifying both (1) the target group's exact stage (healthy vs. asymptomatic/early exposure vs. established disease vs. at risk of over-testing) and (2) the intended clinical/preventive outcome.",
      flowRoleTH: "ผสานความเข้าใจ Disease–Illness (หมวด 1) และปัจจัยกำหนดสุขภาพต้นน้ำ–ตัวกลาง (หมวด 2) ออกมาเป็นกรอบปฏิบัติการป้องกันครบทั้ง 4 ระดับ",
      flowRoleEN: "Integrates the Disease–Illness matrix (Section 1) and upstream determinants (Section 2) into four actionable levels of prevention.",
      crossLinks: [
        {
          target: "HS3:3",
          labelTH: "HS3 · หมวด 3 (ความปลอดภัยในกรอบคุณภาพ STEP)",
          labelEN: "HS3 · Sec 3 (Safety in STEP Quality)",
          whyTH: "การป้องกันระดับที่สี่คุ้มครองความปลอดภัยของผู้ป่วยจากอันตรายของการส่งตรวจและรักษาที่เกินจำเป็น",
          whyEN: "Quaternary prevention directly advances Patient Safety (`S` in STEP) by curbing iatrogenic harm.",
        },
        {
          target: "HS6:5",
          labelTH: "HS6 · หมวด 5 (Provider's Moral Hazard & การใช้บริการเกินจำเป็น)",
          labelEN: "HS6 · Sec 5 (Provider Moral Hazard & Overuse)",
          whyTH: "แรงจูงใจจ่ายตามรายบริการ (`FFS`) อาจกระตุ้นการตรวจรักษาเกินจำเป็น จึงต้องมีทั้งจริยธรรมระดับ 4 และกลไกการคลังกำกับ",
          whyEN: "Fee-for-service incentives can fuel clinical overuse, linking quaternary prevention ethics with payment reform.",
        },
      ],
      keywords: [
        { th: "ปฐมภูมิ · ทุติยภูมิ · ตติยภูมิ · จตุรภูมิ", en: "Primary · Secondary · Tertiary · Quaternary Prevention" },
        { th: "ค้นหาระยะแรกและบำบัดทันท่วงที", en: "Early Detection & Prompt Intervention" },
        { th: "กลุ่มเป้าหมายและระยะดำเนินโรค", en: "Target Population & Disease Stage" },
        { th: "ป้องกันการตรวจรักษาเกินจำเป็น", en: "Preventing Over-Testing & Overmedicalization" },
      ],
    },
    "HS1:sum": {
      secLabelTH: "บทสรุป · เช็กลิสต์สังเคราะห์ก่อนทำ Case Discussion HS1 & Open Note",
      secLabelEN: "Synthesis · HS1 Case Discussion & Open-Note Readiness",
      titleTH: "ร้อยเรียงสุขภาวะ 4 มิติ แผนภาพปัจจัยกำหนดสุขภาพ (DoH / CSDH) และการป้องกัน 4 ระดับ",
      titleEN: "Synthesizing 4D Holistic Health, DoH/CSDH Pathways, and 4-Level Prevention",
      summaryTH: "ประเมินคนครบสี่มิติ วาดความเชื่อมโยงปัจจัยกำหนดสุขภาพตั้งแต่ระดับปัจเจกถึงโครงสร้างต้นน้ำ และเลือกการป้องกันทั้งสี่ระดับให้ตรงกลุ่มเป้าหมาย คือหัวใจของการวิเคราะห์กรณีศึกษา HS1",
      summaryEN: "Assessing 4D well-being, mapping individual-to-structural determinants, and matching all 4 prevention levels to target disease stages anchor every HS1 case analysis.",
      bullets: [
        {
          th: "<strong>เช็กลิสต์พร้อมตอบครบทั้ง 3 กรณีศึกษาของ HS1:</strong> (1) แยก `Disease–Illness–Sickness` และประเมินสุขภาวะ 4 มิติโดยแยกภาวะสุขภาพที่เป็นอยู่ออกจากปัจจัยที่ส่งผลกระทบทั้งทางบวกและทางลบ (2) เชื่อมความสัมพันธ์สองทิศทางในแผนภาพปัจจัยกำหนดสุขภาพ 4 หมวด และแยก `Structural` ออกจาก `Intermediary determinants` ตามกรอบ WHO CSDH และ (3) จำแนก `Primary–Quaternary prevention` จากระยะของโรคในกลุ่มเป้าหมายและเป้าหมายของมาตรการ",
          en: "<strong>Complete HS1 Case Toolkit:</strong> (1) Separate 4D health status from positive and negative affecting events; (2) map bidirectional DoH rings and CSDH Structural vs. Intermediary determinants; and (3) justify all 4 prevention levels by target group and disease stage.",
        },
      ],
      caseLensTH: "ก่อนเข้าห้องอภิปราย HS1 ตรวจทาน 3 จุดที่มักพลาดบ่อย: (1) สุขภาวะทางปัญญาคือสติรู้เท่าทันและการไตร่ตรองปรับพฤติกรรมดูแลตนเอง (2) กฎหมาย การศึกษา โครงสร้างงานนอกระบบ และผังเมืองเป็น Structural ส่วนครอบครัว เพื่อน และสภาพงานรายวันเป็น Intermediary และ (3) กิจกรรมเดียวกันเปลี่ยนจาก Primary เป็น Tertiary เมื่อทำในผู้ป่วยที่วินิจฉัยโรคแล้ว",
      caseLensEN: "Pre-discussion check: (1) Spiritual/intellectual health means mindful reflection and informed action; (2) education, labor laws, enforcement, and urban policy are Structural while family/peer norms and daily work conditions are Intermediary; (3) same activity shifts from Primary to Tertiary once disease is diagnosed.",
      flowRoleTH: "สรุปเป้าหมายและรากเหง้าด้านสุขภาพใน HS1 ก่อนก้าวสู่ HS2 เพื่อวิเคราะห์ว่า 'ระบบสุขภาพจัดโครงสร้าง 6 Building Blocks และรูปแบบการดูแล 6W อย่างไร'",
      flowRoleEN: "Concludes HS1's health and determinant foundations and transitions to HS2: organizing 6 Building Blocks and 6W Models of Care.",
      crossLinks: [
        {
          target: "HS2:1",
          labelTH: "ต่อยอดสู่ HS2 · หมวด 1 (นิยามและขอบเขตระบบสุขภาพ)",
          labelEN: "Next: HS2 · Sec 1 (Health System Definition)",
          whyTH: "เมื่อรู้ว่าสุขภาพถูกกำหนดจากหลายภาคส่วน จึงต้องนิยามระบบสุขภาพให้ครอบคลุมทุกกิจกรรมที่มีเจตนาหลักเพื่อสุขภาพ",
          whyEN: "Because health has multi-sectoral determinants, HS2 defines the health system around all health-enhancing actions.",
        },
      ],
      keywords: [
        { th: "สุขภาวะองค์รวม 4 มิติ", en: "4D Holistic Well-Being" },
        { th: "แผนภาพ DoH และกรอบ WHO CSDH", en: "DoH Diagram & WHO CSDH" },
        { th: "การป้องกันโรค 4 ระดับตามกลุ่มเป้าหมาย", en: "Stage-Specific 4-Level Prevention" },
      ],
    },

    /* -------------------- HS2: Structure, Functions & Models of Care -------------------- */
    "HS2:1": {
      secLabelTH: "หมวดที่ 1 · นิยามและขอบเขตของระบบสุขภาพ",
      secLabelEN: "Section 1 · Definition and Boundaries of Health Systems",
      titleTH: "เกณฑ์เจตนาหลักเพื่อสุขภาพ (Primary Intent) และการทำงานข้ามภาคส่วน",
      titleEN: "Primary Intent Criterion and Intersectoral Responsibility",
      summaryTH: "ระบบสุขภาพกว้างกว่ารั้วโรงพยาบาล เพราะนับรวมทุกองค์กร ทรัพยากร และกิจกรรมที่มีเจตนาหลักเพื่อส่งเสริม ฟื้นฟู หรือธำรงรักษาสุขภาพ",
      summaryEN: "A health system extends far beyond hospital walls to encompass every actor and action whose primary intent is to promote, restore, or maintain health.",
      bullets: [
        {
          th: "<strong>ใช้เกณฑ์เจตนาหลักเพื่อสุขภาพ (`Primary Intent`) ขีดเส้นแบ่งขอบเขต:</strong> ตามนิยาม WHO (2000) กิจกรรมอย่างการดูแลผู้ป่วยโดยครอบครัวในบ้าน อาสาสมัครชุมชน หรือกฎหมายความปลอดภัยทางถนนเพื่อลดการบาดเจ็บ ล้วนอยู่ในขอบเขตของระบบสุขภาพ",
          en: "<strong>Primary-Intent Criterion (WHO 2000):</strong> Family caregiving, community volunteers, and road-safety mandates belong inside the health system because their primary purpose is health.",
        },
        {
          th: "<strong>แยกกิจกรรมในระบบออกจากการผลักดันข้ามภาคส่วน (`Intersectoral Action`):</strong> นโยบายด้านอื่น (เช่น การศึกษา การเกษตร อุตสาหกรรม หรือการปกครองท้องถิ่น) ที่มีเจตนาหลักด้านอื่นแต่ส่งผลกระทบต่อสุขภาพ เป็นพื้นที่ที่ภาคสุขภาพต้องเข้าไปร่วมชี้นำและประสานความร่วมมือ",
          en: "<strong>Inside Boundary vs. Intersectoral Stewardship:</strong> Policies like general education or local administration affect health without having health as their primary intent, calling for intersectoral collaboration.",
        },
      ],
      caseLensTH: "ใช้เกณฑ์ Primary Intent ช่วยขีดเส้นว่าเมื่อแก้ปัญหาระบบบริการและการดูแลระยะยาวในชุมชน ผู้ดูแลในครอบครัว อสม. และองค์กรปกครองส่วนท้องถิ่นที่จัดบริการสุขภาพถือเป็นกำลังสำคัญภายในระบบสุขภาพ ไม่ใช่คนนอก",
      caseLensEN: "Apply the Primary Intent rule to recognize family caregivers, community health volunteers, and local government health initiatives as integral actors inside the health system.",
      flowRoleTH: "กำหนดเส้นแบ่งขอบเขตของระบบสุขภาพให้ชัดเจน ก่อนแยกโครงสร้างภายในระบบออกเป็นสองวงจรที่ส่งผลถึงกันในหมวด 2",
      flowRoleEN: "Draws the boundary of the health system before unpacking its two internal structural subsystems in Section 2.",
      crossLinks: [
        {
          target: "ST1:1",
          labelTH: "ST1 · หมวด 1 (เส้นแบ่งขอบเขตระบบ)",
          labelEN: "ST1 · Sec 1 (System Boundaries)",
          whyTH: "ประยุกต์แนวคิดการขีดเส้นขอบเขตระบบของ ST1 มาสู่นิยามระบบสุขภาพระดับสากล",
          whyEN: "Operationalizes ST1's system-boundary concept using WHO's primary-intent rule.",
        },
        {
          target: "HS1:2",
          labelTH: "HS1 · หมวด 2 (ปัจจัยกำหนดสุขภาพนอกภาคการแพทย์)",
          labelEN: "HS1 · Sec 2 (Non-Medical Determinants)",
          whyTH: "อธิบายบทบาทของภาคสุขภาพในการเชื่อมประสานกับภาคส่วนอื่นที่กำหนดสุขภาพของประชาชน",
          whyEN: "Clarifies how the health sector engages non-health sectors that shape social determinants.",
        },
      ],
      keywords: [
        { th: "เจตนาหลักเพื่อสุขภาพ", en: "Primary Intent for Health" },
        { th: "ขอบเขตของระบบสุขภาพ", en: "Health System Boundary" },
        { th: "การทำงานข้ามภาคส่วน", en: "Intersectoral Action" },
      ],
    },
    "HS2:2": {
      secLabelTH: "หมวดที่ 2 · โครงสร้างและความสัมพันธ์สองทิศทางในระบบสุขภาพ",
      secLabelEN: "Section 2 · Components and Bidirectional Structure of Health Systems",
      titleTH: "ความเชื่อมโยงสองทิศทางระหว่างระบบบริการสุขภาพและปัจจัยกำหนดสุขภาพ",
      titleEN: "Bidirectional Links Between Health Services and Health Determinants",
      summaryTH: "ระบบบริการสุขภาพกับปัจจัยกำหนดสุขภาพไม่ได้แยกกันเดิน แต่ส่งแรงสะท้อนถึงกันสองทิศทางทั้งการสร้างภาระโรคและการประคองวิถีชีวิตครัวเรือน",
      summaryEN: "Health care delivery and social determinants continuously reinforce or buffer each other in both directions.",
      bullets: [
        {
          th: "<strong>ทิศทางที่ 1 ปัจจัยกำหนดสุขภาพกำหนดภาระโรคและรูปแบบการมาใช้บริการ:</strong> โครงสร้างประชากรสูงวัย สภาพเศรษฐกิจ สิ่งแวดล้อม และความพร้อมของครอบครัวกำหนดว่าผู้ป่วยจะเข้าสู่โรงพยาบาลด้วยโรคเรื้อรังหรือภาวะวิกฤตเพียงใด",
          en: "<strong>Determinants Shape Service Load:</strong> Aging demographics, living conditions, and family caregiving capacity drive both chronic disease volume and acute hospital demand.",
        },
        {
          th: "<strong>ทิศทางที่ 2 ระบบบริการสุขภาพย้อนกลับไปเปลี่ยนปัจจัยกำหนดสุขภาพได้:</strong> บริการที่เข้าถึงได้ ฟื้นฟูสมรรถภาพต่อเนื่อง และไม่ทำให้ครัวเรือนล้มละลาย ช่วยให้ผู้ป่วยกลับไปพึ่งพาตนเอง ประกอบอาชีพ และดำรงชีวิตในสังคมได้",
          en: "<strong>Services Reshape Social Determinants:</strong> Accessible, rehabilitative, and financially protective care restores functional independence, employability, and household stability.",
        },
      ],
      caseLensTH: "ช่วยอธิบายในกรณีศึกษาว่าเมื่อครอบครัวและชุมชนเกินขีดความสามารถในการรับมือระยะวิกฤต โรงพยาบาลต้องเข้ามารองรับ และเมื่ออาการสงบ ระบบบริการต้องฟื้นฟูทักษะสังคมและอาชีพเพื่อส่งผู้ป่วยกลับสู่ชุมชนอย่างมั่นคง",
      caseLensEN: "Explains why inpatient services must step in when acute illness exceeds family capacity, and why outpatient/rehabilitative services must rebuild social and vocational functioning afterward.",
      flowRoleTH: "เชื่อมโครงสร้างสองซีกของระบบสุขภาพจากหมวด 1 เพื่อปูทางสู่การแยกแยะ '4 หน้าที่' กับ '3 เป้าหมายหลัก' ของระบบในหมวด 3",
      flowRoleEN: "Connects the health system's service and determinant subsystems, setting up Functions vs. Intrinsic Objectives in Section 3.",
      crossLinks: [
        {
          target: "HS1:2",
          labelTH: "HS1 · หมวด 2 (กรอบ CSDH Solar & Irwin)",
          labelEN: "HS1 · Sec 2 (CSDH Framework)",
          whyTH: "ในกรอบ CSDH ระบบบริการสุขภาพทำหน้าที่เป็นปัจจัยตัวกลางที่ลดผลกระทบจากการป่วยต่อสถานะทางเศรษฐกิจและสังคมได้",
          whyEN: "Matches CSDH's insight that health systems mediate whether illness causes socioeconomic loss.",
        },
        {
          target: "HS6:1",
          labelTH: "HS6 · หมวด 1 (ปกป้องรายจ่ายหายนะครัวเรือน)",
          labelEN: "HS6 · Sec 1 (Catastrophic Spending Protection)",
          whyTH: "การประกันสุขภาพคือกลไกหลักที่ป้องกันไม่ให้ค่ารักษาพยาบาลย้อนกลับไปทำลายเศรษฐกิจครัวเรือน",
          whyEN: "Health insurance prevents medical bills from becoming an impoverishing social determinant.",
        },
      ],
      keywords: [
        { th: "ระบบบริการสุขภาพ", en: "Health Services System" },
        { th: "ความสัมพันธ์สองทิศทาง", en: "Bidirectional Relationship" },
        { th: "การฟื้นฟูการพึ่งตนเองและอาชีพ", en: "Livelihood & Functional Recovery" },
      ],
    },
    "HS2:3": {
      secLabelTH: "หมวดที่ 3 · หน้าที่ 4 ด้าน เป้าหมายหลัก 3 ประการ และคุณลักษณะขั้นกลาง",
      secLabelEN: "Section 3 · Four Functions, Three Intrinsic Objectives, and Intermediate Attributes",
      titleTH: "แยกสิ่งที่ระบบทำ (4 Functions) ออกจากผลลัพธ์ปลายทาง (3 Objectives) ตามกรอบ WHO (2000)",
      titleEN: "Distinguishing What Systems Do (4 Functions) from Why They Exist (3 Objectives — WHO 2000)",
      summaryTH: "อย่าสับสนระหว่างเครื่องมือกับจุดหมาย หน้าที่ทั้งสี่คือกลไกต้นน้ำที่ระบบลงมือทำ ส่วนสุขภาพดี การตอบสนอง และความเป็นธรรมทางการเงินคือเป้าหมายสุดท้าย",
      summaryEN: "Never confuse means with ends: four core functions are how a system operates, while health, responsiveness, and fair financial contribution are why it exists.",
      bullets: [
        {
          th: "<strong>4 หน้าที่หลักและความเชื่อมโยงเชิงโครงสร้าง (`WHO 2000 Framework`):</strong> `Stewardship` (การอภิบาลระบบ) ส่งลูกศรกำกับทุกหน้าที่ ขณะที่ `Financing` (ระดมทุน รวมความเสี่ยง ซื้อบริการ) หนุนทั้ง `Creating resources` (สร้างกำลังคน ยา/เทคโนโลยี และข้อมูล) เพื่อนำไปสู่ `Delivering services` (การจัดบริการสุขภาพ)",
          en: "<strong>Four Interlinked Functions (WHO 2000):</strong> Stewardship guides the entire system, while Financing enables Resource Generation and Service Provision.",
        },
        {
          th: "<strong>3 เป้าหมายหลักปลายทาง (`Intrinsic Objectives` — วัดทั้งค่าเฉลี่ยและความเป็นธรรมของการกระจาย):</strong> (1) `Health` (สุขภาพดีขึ้นและเหลื่อมล้ำลดลง) (2) `Responsiveness` (ตอบสนองความคาดหวังอันชอบธรรมที่ไม่ใช่ด้านเทคนิคคลินิก เช่น เคารพศักดิ์ศรี รวดเร็ว เลือกหน่วยบริการได้) และ (3) `Fairness in financial contribution` (ร่วมจ่ายตามกำลัง ไม่ล้มละลายยามป่วย)",
          en: "<strong>Three Intrinsic Objectives (Level & Distribution):</strong> Improving Health, enhancing non-clinical Responsiveness, and ensuring Fair Financial Contribution.",
        },
        {
          th: "<strong>คุณลักษณะที่พึงประสงค์เป็นสะพานขั้นกลาง:</strong> การเข้าถึง คุณภาพ ประสิทธิภาพ และความยืดหยุ่น เป็นเกณฑ์ตรวจสอบว่าการทำหน้าที่ทั้ง 4 ด้านกำลังมุ่งไปสู่เป้าหมายทั้ง 3 ประการจริงหรือไม่",
          en: "<strong>Intermediate Performance Bridges:</strong> Access, quality, efficiency, and resilience verify whether functional operations actually advance intrinsic goals.",
        },
      ],
      caseLensTH: "ใช้แผนผัง WHO (2000) มองทะลุปัญหาหน้างานว่า คอขวดของการจัดบริการ (`Delivering services`) มักมีรากมาจากกฎระเบียบการอภิบาล (`Stewardship`) การคลัง (`Financing`) หรือการสร้างและจัดสรรทรัพยากร (`Creating resources` ซึ่งขยายเป็น 3 กล่องใน WHO 2007)",
      caseLensEN: "Use the WHO (2000) arrow diagram to trace frontline service bottlenecks back to upstream Stewardship rules, Financing constraints, and Resource Generation.",
      flowRoleTH: "วางกรอบวิธีคิด Means vs. Ends ของ WHO (2000) ก่อนแตกออกเป็นกรอบวิเคราะห์ปฏิบัติการ 6 Building Blocks ในหมวด 4",
      flowRoleEN: "Establishes WHO 2000's functions-to-objectives architecture before unpacking the 6 operational Building Blocks in Section 4.",
      crossLinks: [
        {
          target: "HS3:1",
          labelTH: "HS3 · หมวด 1 (คุณลักษณะพึงประสงค์ในฐานะสัญญาณเตือนล่วงหน้า)",
          labelEN: "HS3 · Sec 1 (Process Attributes as Early Signals)",
          whyTH: "บท HS3 ทั้งบทขยายรายละเอียดของคุณลักษณะขั้นกลาง (`EQESaRR`) ที่เชื่อมหน้าที่ไปสู่เป้าหมายสุดท้าย",
          whyEN: "All of HS3 elaborates the intermediate process qualities (`EQESaRR`) introduced here.",
        },
        {
          target: "HS6:1",
          labelTH: "HS6 · หมวด 1 (หน้าที่การคลังสุขภาพและ Fairness in Finance)",
          labelEN: "HS6 · Sec 1 (Health Financing & Fair Contribution)",
          whyTH: "บท HS6 เจาะลึกหน้าที่การคลังสุขภาพและเป้าหมายความเป็นธรรมทางการเงินโดยตรง",
          whyEN: "HS6 unpacks the health financing function and fairness-in-financial-contribution goal in full depth.",
        },
      ],
      keywords: [
        { th: "สี่หน้าที่หลักของระบบสุขภาพ", en: "Four Health System Functions (WHO 2000)" },
        { th: "การอภิบาลระบบ", en: "Stewardship" },
        { th: "การตอบสนองความคาดหวัง", en: "Responsiveness" },
        { th: "ความเป็นธรรมด้านการคลัง", en: "Fairness in Financial Contribution" },
      ],
    },
    "HS2:4": {
      secLabelTH: "หมวดที่ 4 · หกองค์ประกอบหลัก (WHO 6 Building Blocks) และพลวัต CAS",
      secLabelEN: "Section 4 · WHO Six Building Blocks, CAS Dynamics & Results Chain",
      titleTH: "การวินิจฉัยคอขวดและทางออกของโรงพยาบาลอย่างเป็นระบบครบทั้ง 6 Building Blocks",
      titleEN: "Diagnosing Hospital Bottlenecks and Aligned Solutions Across All Six Building Blocks",
      summaryTH: "วิกฤตในโรงพยาบาลไม่เคยเกิดจากองค์ประกอบเดียวโดด ๆ ผู้บริหารเชิงระบบต้องจำแนกปัญหาและจับคู่ทางออกให้ตรงครบทั้งหกองค์ประกอบพร้อมเห็นจุดคานงัดด้านการอภิบาลและการคลัง",
      summaryEN: "Hospital crises never stem from one isolated silo; systems leaders map evidence and aligned solutions across all six building blocks while spotting governance and financing leverage.",
      bullets: [
        {
          th: "<strong>จำแนกขอบเขตของทั้ง 6 Building Blocks (`WHO 2007`) ให้แม่นยำไม่ปนกัน:</strong> <strong>(1) `Service Delivery`</strong> (รูปแบบบริการ ระบบด่านหน้า `Gatekeeper` ลดแออัดเคสคงที่ ความรวดเร็วปลอดภัยของ `EMS` และ `Teleconsultation`) · <strong>(2) `Health Workforce`</strong> (ชั่วโมงงาน ภาวะหมดไฟ `Burnout` การลาออก การใช้ทักษะไม่ตรงศักยภาพ และการแก้ด้วย `Nurse-led clinic` / `Task-shifting`) · <strong>(3) `Health Information Systems`</strong> (การเชื่อมต่อข้อมูล `Interoperability` กับแอปภายนอก ลดการกรอกข้อมูลซ้ำซ้อน)",
          en: "<strong>Master Blocks 1–3 Distinctly:</strong> (1) Service Delivery (gatekeeping for stable NCDs, EMS timeliness, teleconsultation); (2) Health Workforce (burnout, retention, skill mix, nurse-led clinics & task-shifting); (3) Health Information Systems (interoperability and eliminating duplicate data entry).",
        },
        {
          th: "<strong>เชื่อมอีก 3 องค์ประกอบสนับสนุนและกำกับทิศทาง:</strong> <strong>(4) `Medical Products, Vaccines & Technologies`</strong> (มาตรฐานคลังยา ระบบลูกโซ่ความเย็น `Cold chain` และห่วงโซ่อุปทานเวชภัณฑ์ใน รพ.สต.) · <strong>(5) `Health Financing`</strong> (ความคล่องตัวของงบลงทุน `Capital investment` และงบสนับสนุนจากการกระจายอำนาจทางการคลังสู่ท้องถิ่น/อบจ.) · <strong>(6) `Leadership & Governance`</strong> (อำนาจตัดสินใจอิสระของโรงพยาบาล `Autonomy` การปลดล็อกระเบียบส่วนกลางที่ล่าช้า และการกระจายอำนาจอภิบาล)",
          en: "<strong>Master Blocks 4–6 Distinctly:</strong> (4) Medical Products & Technologies (supply chain and cold-chain standards); (5) Health Financing (capital investment flexibility and fiscal decentralization); (6) Leadership & Governance (hospital autonomy, timely regulatory guidelines, and decentralized stewardship).",
        },
        {
          th: "<strong>อ่านความเชื่อมโยงข้ามกล่องแบบ `CAS` (`de Savigny & Adam, 2009`) และห่วงโซ่ผลลัพธ์:</strong> ทั้ง 6 องค์ประกอบมี `People` อยู่ตรงกลาง โดยคอขวดของ `Governance` (รอกฎระเบียบส่วนกลาง) และ `Financing` มักไปล็อกการปรับ `Workforce`, `HIS` และ `Cold chain` จนเกิดวิกฤตที่ `Service Delivery` จึงต้องประเมินครบห่วงโซ่ `Input → Output → Outcome → Impact`",
          en: "<strong>CAS Interdependence & Results Chain:</strong> With People at the center, Governance and Financing bottlenecks constrain Workforce, HIS, and Cold-Chain readiness—requiring synchronized solutions tracked across Input → Output → Outcome → Impact.",
        },
      ],
      caseLensTH: "ในการตอบตารางวิเคราะห์ปัญหาโรงพยาบาลตามกรอบ WHO 6 Building Blocks ต้องตรวจสอบความสอดคล้องกันทั้ง 3 คอลัมน์ในแต่ละแถว ได้แก่ ชื่อองค์ประกอบหลัก หลักฐานปัญหาจากสถานการณ์ที่ตรงกับองค์ประกอบนั้น และแนวทางแก้ปัญหาที่ตรงจุดเดียวกัน เช่น ปัญหาคลังยาและระบบลูกโซ่ความเย็นคู่กับด้านเวชภัณฑ์และเทคโนโลยี ส่วนปัญหาการรอระเบียบส่วนกลางจนขาดอิสระในการตัดสินใจคู่กับด้านภาวะผู้นำและการอภิบาล",
      caseLensEN: "When completing a 6 Building Blocks matrix, ensure strict 3-column alignment per row—matching each Building Block to its exact scenario evidence and corresponding solution (e.g., cold-chain standards → Medical Products; centralized regulatory bottlenecks/autonomy → Leadership & Governance).",
      flowRoleTH: "จากภาพรวมระดับบริหารทั้ง 6 เสาหลักในหมวด 4 จึงซูมเข้าสู่เสาที่ใกล้ชิดเวชปฏิบัติที่สุดคือ 'การเลือกรูปแบบการดูแลผู้ป่วย (Models of Care)' ในหมวด 5",
      flowRoleEN: "Zooms from macro hospital stewardship across the 6 Building Blocks into clinical Service Delivery design and Models of Care in Section 5.",
      crossLinks: [
        {
          target: "ST1:2",
          labelTH: "ST1 · หมวด 2 (ปฏิสัมพันธ์ในระบบซับซ้อน CAS)",
          labelEN: "ST1 · Sec 2 (CAS Interdependence)",
          whyTH: "De Savigny & Adam (2009) ชี้ว่า 6 Building Blocks ต้องอ่านผ่านแว่น CAS เพราะทุกกล่องส่งผลสะท้อนถึงกัน",
          whyEN: "Applies CAS thinking so the 6 Building Blocks are managed as dynamic interactions rather than isolated checklists.",
        },
        {
          target: "HS5:7",
          labelTH: "HS5 · หมวด 7 (เครือข่าย รพช.–รพ.สต. และการถ่ายโอนสู่ อบจ.)",
          labelEN: "HS5 · Sec 7 (District Network & PHC Decentralization)",
          whyTH: "การยกระดับ รพ.สต. เป็นด่านหน้าและการบริหารจัดการหลังถ่ายโอนสู่ อบจ. เชื่อมโยงโดยตรงกับพัฒนาการปฐมภูมิไทยใน HS5",
          whyEN: "Strengthening subdistrict gatekeepers and local-government decentralization connects directly to Thailand's PHC evolution in HS5.",
        },
      ],
      keywords: [
        { th: "หกองค์ประกอบหลักของระบบสุขภาพ", en: "WHO Six Building Blocks" },
        { th: "การขยายบทบาทและมอบหมายงาน", en: "Nurse-Led Clinic & Task-Shifting" },
        { th: "การเชื่อมต่อข้อมูลและลูกโซ่ความเย็น", en: "Interoperability & Cold Chain" },
        { th: "ความเป็นอิสระและการกระจายอำนาจ", en: "Autonomy & Decentralization" },
      ],
    },
    "HS2:5": {
      secLabelTH: "หมวดที่ 5 · ระดับบริการ รูปแบบการดูแล (Models of Care) และกรอบ 6W",
      secLabelEN: "Section 5 · Levels of Care, Models of Care & The 6W Design Framework",
      titleTH: "การเลือกรูปแบบการดูแล (Acute vs. Chronic/Ambulatory & Rehab) ให้สอดคล้องกันทั้ง WHAT · WHY · HOW (6W)",
      titleEN: "Aligning Acute vs. Chronic/Ambulatory & Rehabilitative Models of Care via WHAT · WHY · HOW (6W)",
      summaryTH: "ผู้ป่วยคนละระยะโรคต้องการรูปแบบการดูแลคนละแบบ แพทย์จึงต้องออกแบบเป้าหมาย วิธีการ สถานที่ และบทบาททีมสหวิชาชีพให้สอดรับกับสภาวะผู้ป่วยอย่างเป็นเหตุเป็นผล",
      summaryEN: "Different illness trajectories demand distinct Models of Care—aligning clinical conditions (WHY) with the right care model (WHAT) and 6W management design (HOW).",
      bullets: [
        {
          th: "<strong>จำแนกรูปแบบการดูแล (`WHAT: Model of Care`) จากสภาวะทางคลินิกและการพึ่งตนเอง (`WHY: Patient Conditions`):</strong> <strong>`Acute Care`</strong> เหมาะกับระยะกำเริบเฉียบพลัน (`Acute exacerbation`) หรือภาวะละเลยการดูแลตนเองรุนแรง (`Severe self-neglect` เช่น ไม่กินน้ำ/อาหารหลายวันจนทรุดโทรม แม้สัญญาณชีพยังปกติ) ซึ่งเกินขีดความสามารถของบ้านและต้องดูแลใกล้ชิด 24 ชม. · ส่วน <strong>`Chronic / Ambulatory Care` ควบคู่ `Rehabilitative Care`</strong> เหมาะกับโรคเรื้อรังระยะอาการสงบคงที่ (`Stable`) ที่อยู่ร่วมกับครอบครัวในชุมชนได้ แต่ต้องป้องกันการกลับเป็นซ้ำและฟื้นฟูทักษะสังคม/อาชีพ",
          en: "<strong>Match WHAT (Model) to WHY (Clinical & Functional Condition):</strong> Choose Acute Care when acute exacerbation or severe self-neglect (even with stable vital signs) exceeds home safety and requires 24-hour stabilization; choose Chronic/Ambulatory + Rehabilitative Care for stable long-term conditions needing relapse prevention and social/vocational recovery.",
        },
        {
          th: "<strong>ออกแบบแนวทางการจัดการดูแล (`HOW: Care Management — กรอบ 6W`) ให้ตรงกับรูปแบบที่เลือก:</strong> เปรียบเทียบครบ 4 แกน ได้แก่ <strong>(1) `Guiding Principle` (`Why`)</strong>: ทำให้พ้นขีดอันตรายและอาการสงบ (`Stabilization`) vs เสริมพลังจัดการตนเอง (`Empowerment & Self-management`) · <strong>(2) `Interventions` (`What`)</strong>: เฝ้าระวัง 24 ชม./ปรับยาจำเพาะ/โภชนาการ vs ติดตามยาต่อเนื่องและฟื้นฟูสมรรถภาพทางจิตสังคม/อาชีพ · <strong>(3) `Settings` (`Where`)</strong>: หอผู้ป่วยใน (`IPD`) vs คลินิกผู้ป่วยนอก (`OPD`)/รพ.สต./บ้านและชุมชน · <strong>(4) `Providers & Interaction` (`Who & How`)</strong>: แพทย์เจ้าของไข้และทีมผู้ป่วยในดูแลกำกับใกล้ชิด (`Directive / Close monitoring`) vs ทีมสหวิชาชีพทำงานแบบหุ้นส่วน (`Partnership` ตาม `Wagner's Chronic Care Model`) ร่วมกับผู้ป่วยที่ตื่นรู้ (`Activated patient`) และครอบครัว",
          en: "<strong>Align HOW (6W Care Management) Across 4 Axes:</strong> Contrast Guiding Principles (24-h stabilization vs. empowerment/self-management), Interventions (definitive inpatient Rx vs. longitudinal follow-up & psychosocial/vocational rehab), Settings (inpatient ward vs. OPD/primary care/home/community), and Providers/Interaction (directive inpatient team vs. Wagner CCM partnership between multidisciplinary team and activated patient).",
        },
        {
          th: "<strong>เชื่อม 4 ระดับความซับซ้อนของการดูแลอย่างไร้รอยต่อ:</strong> ดูแลตนเองและครอบครัว → ปฐมภูมิ (ศูนย์กลางประสานงานใกล้บ้าน) → ทุติยภูมิ → ตติยภูมิ ด้วยระบบส่งต่อไป–กลับสองทาง (`Two-way referral`)",
          en: "<strong>Four Connected Levels of Care:</strong> Self/family care, primary, secondary, and tertiary care work effectively only through two-way referral and counter-referral anchored in primary care.",
        },
      ],
      caseLensTH: "กฎการให้คะแนนสำคัญของโจทย์ Contrasting Cases (`Alignment Rule`): เหตุผลสภาวะผู้ป่วย (`WHY`) และรายละเอียดการจัดการดูแลทั้ง 4 แกน (`HOW`) ต้องสอดคล้องเป็นเนื้อเดียวกันกับ `Model of Care (WHAT)` ที่เลือก และระวังกับดัก 'สัญญาณชีพปกติ'—หากผู้ป่วยไม่กินน้ำ/อาหารหลายวันจนดูแลตนเองไม่ได้เฉียบพลัน ต้องเลือก `Acute Care` ในหอผู้ป่วยใน ไม่ใช่ `Ambulatory Care`",
      caseLensEN: "Critical Alignment Rule for Contrasting Cases: WHY (patient condition) and all 4 elements of HOW (principle, interventions, setting, provider–patient interaction) must strictly match your chosen WHAT (Model of Care)—and remember that acute severe self-neglect requires inpatient Acute Care even if vital signs remain stable.",
      flowRoleTH: "ปิดท้ายบท HS2 ด้วยสถาปัตยกรรมการจัดบริการตามระยะโรค ซึ่งจะถูกนำไปประเมินคุณค่าด้วยเกณฑ์ EQESaRR ใน HS3 และขยายผลสู่บริการปฐมภูมิใน HS5",
      flowRoleEN: "Completes HS2's architectural blueprint with 6W Models of Care, setting up EQESaRR evaluation in HS3 and Primary Health Care in HS5.",
      crossLinks: [
        {
          target: "HS5:5",
          labelTH: "HS5 · หมวด 5 (คุณลักษณะ 5 ประการของบริการปฐมภูมิ)",
          labelEN: "HS5 · Sec 5 (5 Core Attributes of Primary Care)",
          whyTH: "บท HS5 ขยายรายละเอียดการดูแลต่อเนื่องและประสานการส่งต่อในชุมชนของทีมปฐมภูมิอย่างเจาะลึก",
          whyEN: "HS5 expands community-based continuity, coordination, and person-centered primary care.",
        },
        {
          target: "HS6:5",
          labelTH: "HS6 · หมวด 5 (Primary Care Gatekeeper คุมค่าใช้จ่าย)",
          labelEN: "HS6 · Sec 5 (Primary Care Gatekeeping)",
          whyTH: "การจัดบริการปฐมภูมิเป็นด่านหน้า (`gatekeeper`) ช่วยให้การใช้ทรัพยากรในระบบประกันสุขภาพมีประสิทธิภาพขึ้น",
          whyEN: "Primary care gatekeeping aligns service delivery design with efficient health insurance utilization.",
        },
      ],
      keywords: [
        { th: "การดูแลเฉียบพลันเทียบกับเรื้อรังและฟื้นฟู", en: "Acute vs. Chronic / Ambulatory & Rehabilitative Care" },
        { th: "กรอบการออกแบบบริการ 6W (WHAT · WHY · HOW)", en: "6W Service Design & Alignment" },
        { th: "รูปแบบการดูแลโรคเรื้อรัง (Wagner CCM)", en: "Wagner's Chronic Care Model" },
        { th: "ระบบส่งต่อสองทาง", en: "Two-Way Referral System" },
      ],
    },
    "HS2:sum": {
      secLabelTH: "บทสรุป · เช็กลิสต์สังเคราะห์ก่อนทำ Case Discussion HS2 & Open Note",
      secLabelEN: "Synthesis · HS2 Case Discussion & Open-Note Readiness",
      titleTH: "บทสรุปการวิเคราะห์โรงพยาบาลด้วย 6 Building Blocks และการออกแบบรูปแบบการดูแลด้วย WHAT · WHY · HOW (6W)",
      titleEN: "Synthesizing 6 Building Blocks Hospital Diagnostics and 6W Models of Care",
      summaryTH: "มองภาพใหญ่ให้เห็นความเชื่อมโยงครบหกองค์ประกอบของโรงพยาบาล และมองภาพคลินิกให้เลือกรูปแบบการดูแลสอดคล้องกับระยะโรคของผู้ป่วย คือสองทักษะคู่ขนานของ HS2",
      summaryEN: "Diagnosing whole-hospital bottlenecks across all six building blocks and tailoring 6W care models to patient trajectories form the twin pillars of HS2.",
      bullets: [
        {
          th: "<strong>เช็กลิสต์พร้อมตอบครบทั้ง 2 กรณีศึกษาของ HS2:</strong> (1) เชื่อมผัง `WHO 2000` (4 หน้าที่ → 3 เป้าหมาย) สู่การแยกปัญหาและทางออกครบทั้ง `6 Building Blocks` โดยชี้คอขวดด้าน `Governance` และ `Financing` และ (2) เปรียบเทียบ `Acute Care` กับ `Chronic/Ambulatory & Rehabilitative Care` ให้สอดคล้องกันทั้ง `WHAT · WHY · HOW (Principle, Interventions, Settings, Providers/Partnership)`",
          en: "<strong>Complete HS2 Case Toolkit:</strong> (1) Map evidence and solutions across all 6 Building Blocks with CAS feedback awareness; and (2) align WHAT, WHY, and all 4 dimensions of HOW across contrasting acute and chronic/rehabilitative cases.",
        },
      ],
      caseLensTH: "ทบทวนก่อนเข้าคาบ HS2: ในระดับโรงพยาบาล อย่าลืมจับคู่ปัญหาให้ตรงทั้ง 6 กล่อง (เช่น แอป 1669 ไม่เชื่อม = HIS, คลังยา/Cold chain = Medical Products, รอระเบียบส่วนกลาง = Governance) และในระดับผู้ป่วย ตรวจสอบความสอดคล้อง WHAT–WHY–HOW ทุกบรรทัด",
      caseLensEN: "Final HS2 check: match hospital clues cleanly to all 6 blocks (EMS data link → HIS; cold chain → Medical Products; centralized rules → Governance) and verify strict WHAT–WHY–HOW alignment for every patient stage.",
      flowRoleTH: "สรุปสถาปัตยกรรมระบบสุขภาพใน HS2 เพื่อส่งต่อเข้าสู่ HS3: 'เราจะใช้เกณฑ์หลักและเกณฑ์ย่อยของ EQESaRR ประเมินนโยบายและบริการสุขภาพอย่างไร'",
      flowRoleEN: "Wraps up HS2's system architecture and hands off to HS3: evaluating health policies with Main and Sub-criteria of EQESaRR.",
      crossLinks: [
        {
          target: "HS3:1",
          labelTH: "ต่อยอดสู่ HS3 · หมวด 1 (เกณฑ์คุณลักษณะที่พึงประสงค์ EQESaRR)",
          labelEN: "Next: HS3 · Sec 1 (Desirable Characteristics EQESaRR)",
          whyTH: "นำโครงสร้างและกระบวนการจัดบริการของ HS2 มาประเมินจุดแข็งและช่องว่างด้วยเข็มทิศ 6 มิติใน HS3",
          whyEN: "Evaluates HS2's service processes using HS3's six-dimensional EQESaRR compass.",
        },
      ],
      keywords: [
        { th: "สี่หน้าที่สู่สามเป้าหมาย (WHO 2000)", en: "4 Functions to 3 Objectives" },
        { th: "หกองค์ประกอบหลักของระบบสุขภาพ", en: "WHO Six Building Blocks" },
        { th: "ความสอดคล้อง WHAT · WHY · HOW (6W)", en: "WHAT–WHY–HOW Model Alignment" },
      ],
    },

    /* -------------------- HS3: Desirable Characteristics (EQESaRR) -------------------- */
    "HS3:1": {
      secLabelTH: "หมวดที่ 1 · คุณลักษณะที่พึงประสงค์ในฐานะสัญญาณเตือนล่วงหน้า",
      secLabelEN: "Section 1 · Process Characteristics as Early Warning Signals",
      titleTH: "เหตุผลที่ต้องวัดคุณลักษณะของกระบวนการบริการควบคู่ผลลัพธ์ และโครงสร้างการวิเคราะห์หลัก–ย่อย",
      titleEN: "Why Process Qualities Serve as Early Warning Signals & Main–Sub Analytical Structure",
      summaryTH: "อย่ารอให้อัตราตายพุ่งแล้วจึงรู้ว่าระบบมีปัญหา คุณลักษณะที่พึงประสงค์ของกระบวนการบริการคือสัญญาณเตือนล่วงหน้าที่ใช้ประเมินจุดแข็งและช่องว่างของนโยบายได้ทันที",
      summaryEN: "Do not wait for mortality statistics to reveal policy failure; desirable service characteristics act as early warning signals for diagnosing strengths and gaps.",
      bullets: [
        {
          th: "<strong>ผลลัพธ์สุดท้ายเปลี่ยนช้าและมีปัจจัยกวนนอกภาคสุขภาพ:</strong> ภาวะสุขภาพประชากรได้รับอิทธิพลจากเศรษฐกิจและสังคมด้วย จึงต้องวัดคุณลักษณะของกระบวนการจัดบริการ (`EQESaRR`) ควบคู่กัน",
          en: "<strong>Final Outcomes Lag and Confound:</strong> Population health shifts slowly and reflects non-medical factors, making intermediate service qualities essential operational gauges.",
        },
        {
          th: "<strong>เชื่อมกรอบแนวคิด Donabedian (`Structure → Process → Outcome`) สู่การวิเคราะห์ 4 ขั้น:</strong> ตรวจสอบว่าทรัพยากร 6 Building Blocks ถูกแปรเป็นบริการที่ดีจริงหรือไม่ โดยแยก <strong>(1) คุณลักษณะหลัก → (2) คุณลักษณะย่อย → (3) นิยามเชิงทฤษฎี → (4) ข้อมูลหลักฐานจากสถานการณ์</strong>",
          en: "<strong>Donabedian's Chain & 4-Step Policy Critique:</strong> Verify whether structural inputs become trustworthy processes by specifying (1) Main Characteristic → (2) Sub-Characteristic → (3) Theoretical Definition → (4) Scenario Evidence.",
        },
      ],
      caseLensTH: "โครงสร้างการตอบโจทย์ Case Discussion ของ HS3 ทุกข้อกำหนดให้แยกคอลัมน์ 'องค์ประกอบหลัก (Main)' ออกจาก 'องค์ประกอบย่อย (Sub)' อย่างชัดเจน พร้อมเขียนคำจำกัดความตามทฤษฎีขององค์ประกอบย่อยนั้นก่อนยกเหตุการณ์จากบทความมาสนับสนุน",
      caseLensEN: "Every HS3 Case Discussion table scores 'Main Characteristic', 'Sub-Characteristic', 'Theoretical Definition', and 'Scenario Evidence' separately—always state both the exact sub-dimension and its conceptual definition.",
      flowRoleTH: "ปูเหตุผลและโครงสร้างการประเมินด้วยเข็มทิศ `EQESaRR` ก่อนเจาะลึกองค์ประกอบย่อยทีละมิติเริ่มจากความเป็นธรรม (`Equity`) ในหมวด 2",
      flowRoleEN: "Establishes the 4-part evaluative logic of EQESaRR before examining each pillar and its sub-dimensions, starting with Equity in Section 2.",
      crossLinks: [
        {
          target: "HS2:3",
          labelTH: "HS2 · หมวด 3 (หน้าที่และเป้าหมายระบบสุขภาพ)",
          labelEN: "HS2 · Sec 3 (Functions & Goals)",
          whyTH: "เชื่อมต่อตรงระหว่างสี่หน้าที่ของระบบสุขภาพกับเป้าหมายสุดท้ายทั้งสามประการ",
          whyEN: "Forms the evaluative bridge between HS2's four functions and three intrinsic goals.",
        },
      ],
      keywords: [
        { th: "คุณลักษณะที่พึงประสงค์ (EQESaRR)", en: "Desirable Characteristics (EQESaRR)" },
        { th: "องค์ประกอบหลักและองค์ประกอบย่อย", en: "Main & Sub-Characteristics" },
        { th: "โครงสร้าง–กระบวนการ–ผลลัพธ์", en: "Structure–Process–Outcome" },
      ],
    },
    "HS3:2": {
      secLabelTH: "หมวดที่ 2 · ความเป็นธรรม (Equity) และองค์ประกอบย่อยของการเข้าถึงบริการ",
      secLabelEN: "Section 2 · Equity & Sub-Dimensions of Accessibility",
      titleTH: "ความเป็นธรรมตามความจำเป็นทางสุขภาพ และการแยกแยะอุปสรรคการเข้าถึงบริการทั้ง 4 มิติ",
      titleEN: "Equity According to Health Need and Four Sub-Dimensions of Service Accessibility",
      summaryTH: "ความเป็นธรรมคือผู้มีความจำเป็นเท่ากันมีโอกาสเข้าถึงบริการได้ทัดเทียมกันโดยปราศจากกำแพงด้านการเงิน ภูมิศาสตร์ ขั้นตอนบริหาร และวัฒนธรรมข้อมูล",
      summaryEN: "Equity ensures equal access for equal health need—removing financial, geographical, administrative, and cultural/informational barriers while financing according to ability to pay.",
      bullets: [
        {
          th: "<strong>แยก `Equity` ออกจาก `Equality`:</strong> `Horizontal equity` คือผู้มีความจำเป็นทางสุขภาพเท่ากันมีโอกาสเข้าถึงบริการที่มีมาตรฐานเท่าเทียมกัน ส่วน `Vertical equity` คือการจัดสรรการสนับสนุนเพิ่มขึ้นแก่ผู้ที่มีความจำเป็นสูงกว่าหรือเปราะบางกว่า",
          en: "<strong>Equity vs. Equality:</strong> Horizontal equity ensures equal access for equal need; vertical equity devotes greater support to those with greater health needs.",
        },
        {
          th: "<strong>จำแนกองค์ประกอบย่อยของการเข้าถึงบริการ (`Accessibility`) ให้แม่นยำ:</strong> <strong>`Financial accessibility`</strong> (รับบริการที่จำเป็นโดยไม่เสียค่าใช้จ่ายเพิ่มหน้างาน) · <strong>`Geographical accessibility`</strong> (ลดภาระเดินทางข้ามพื้นที่) · <strong>`Administrative accessibility`</strong> (ปลดล็อกขั้นตอนเอกสารราชการ เช่น การไม่ต้องกลับไปขอใบส่งตัว) · และ <strong>`Cultural/Informational accessibility`</strong> ควบคู่กับความเสมอภาคเชิงคุณภาพระหว่างพื้นที่ (`Equity in quality`)",
          en: "<strong>Four Sub-Dimensions of Accessibility:</strong> Distinguish Financial (no added point-of-care fees), Geographical (reduced travel burden), Administrative (removing referral-letter red tape), and Cultural/Informational accessibility, alongside cross-regional Equity in Quality.",
        },
        {
          th: "<strong>ความเป็นธรรมด้านการคลังและการตอบสนอง (`Responsiveness`):</strong> จัดเก็บเงินตามความสามารถในการจ่ายแบบก้าวหน้า (`Progressive`) เพื่อกันรายจ่ายหายนะ พร้อมเคารพศักดิ์ศรีและสิทธิการเลือกหน่วยบริการของผู้ป่วย",
          en: "<strong>Fair Financing & Responsiveness:</strong> Progressive revenue pooling prevents catastrophic spending, complemented by non-clinical responsiveness (choice of provider and prompt attention).",
        },
      ],
      caseLensTH: "เมื่อวิเคราะห์นโยบายที่เปิดให้ผู้ป่วยรับบริการได้ทุกหน่วยบริการโดยไม่ต้องใช้ใบส่งตัวและไม่เสียค่าใช้จ่ายเพิ่ม คุณลักษณะหลักที่เด่นชัดคือ `Equity` (องค์ประกอบย่อย: `Financial accessibility` รวมถึงการลดอุปสรรคเชิงบริหารและภูมิศาสตร์ — ผู้มีความจำเป็นเท่ากันเข้าถึงบริการได้โดยไม่มีกำแพงค่าใช้จ่ายหรือขั้นตอนใบส่งตัวกั้น)",
      caseLensEN: "When evaluating policies that remove referral-slip requirements and extra charges, highlight Main: Equity → Sub: Financial (and Administrative/Geographical) Accessibility—equal access for equal need without financial or bureaucratic barriers.",
      flowRoleTH: "เปิดมิติแรกของ `EQESaRR` คือ 'เข้าถึงอย่างเป็นธรรม' ก่อนชี้ต่อในหมวด 3 ว่า 'มีสิทธิหรือมีบริการเปิดอยู่ยังไม่พอ หากบริการขาดคุณภาพและความครอบคลุมที่มีประสิทธิผล'",
      flowRoleEN: "Establishes equitable access before Section 3 shows why nominal access fails without clinical quality and effective coverage.",
      crossLinks: [
        {
          target: "HS1:2",
          labelTH: "HS1 · หมวด 2 (ความไม่เป็นธรรมจากปัจจัยสังคม)",
          labelEN: "HS1 · Sec 2 (Social Health Inequity)",
          whyTH: "ระบบบริการที่เป็นธรรมต้องช่วยลดช่องว่างสุขภาพที่เกิดจากปัจจัยสังคมต้นน้ำ ไม่ใช่ซ้ำเติมครัวเรือนรายได้น้อย",
          whyEN: "Equitable health services buffer rather than amplify upstream social gradients.",
        },
        {
          target: "HS6:1",
          labelTH: "HS6 · หมวด 1 (หน้าที่ประกันสุขภาพและลำดับเงินสมทบ)",
          labelEN: "HS6 · Sec 1 (Insurance Functions & Progressivity)",
          whyTH: "หลักการประกันสุขภาพและลำดับความก้าวหน้าของการเก็บเงินสมทบใน HS6 คือเครื่องมือสร้าง Equity มิตินี้โดยตรง",
          whyEN: "HS6's prepayment, pooling, and progressive contribution ranking directly operationalize Equity.",
        },
      ],
      keywords: [
        { th: "ความเป็นธรรมแนวนอนและแนวตั้ง", en: "Horizontal & Vertical Equity" },
        { th: "การเข้าถึงทางการเงิน · ภูมิศาสตร์ · บริหาร", en: "Financial · Geographical · Administrative Accessibility" },
        { th: "ความสามารถในการจ่าย", en: "Ability to Pay" },
        { th: "ความเสมอภาคเชิงคุณภาพ", en: "Equity in Quality" },
      ],
    },
    "HS3:3": {
      secLabelTH: "หมวดที่ 3 · คุณภาพบริการ (Quality: STEP) และความครอบคลุมอย่างมีประสิทธิผล",
      secLabelEN: "Section 3 · Quality Sub-Dimensions (STEP / IOM) & Effective Coverage",
      titleTH: "นิยามองค์ประกอบย่อยของ Quality (Safety · Timeliness · Effectiveness · Patient-Centeredness) และ Effective Coverage",
      titleEN: "Defining Quality Sub-Dimensions (STEP, ACP) and Contact vs. Effective Coverage",
      summaryTH: "การมีบริการเปิดอยู่ยังไม่เท่ากับการได้รับบริการที่มีคุณภาพจริง บริการที่ดีต้องปลอดภัย ทันเวลา ได้มาตรฐานตามหลักฐานวิชาการ และเคารพเจตจำนงของผู้ป่วยและครอบครัว",
      summaryEN: "Having a service on paper does not guarantee real benefit; care must be Safe, Timely, Effective by clinical standards, and genuinely Patient-centered.",
      bullets: [
        {
          th: "<strong>แยกนิยามองค์ประกอบย่อยของ `Quality` (`IOM / STEP`) ให้ชัดทุกตัว:</strong> <strong>`Safety`</strong> (ปลอดภัย ไม่ก่ออันตรายจากการรักษา) · <strong>`Timeliness`</strong> (ความทันเวลา — ลดเวลารอคอยและความล่าช้าที่เป็นอันตรายต่อการลุกลามของโรค เช่น เข้าถึงผ่าตัด/เคมีบำบัด/ฉายรังสีได้เร็วขึ้น) · <strong>`Effectiveness`</strong> (ประสิทธิผล — จัดบริการอิงหลักฐานวิชาการและครบตามมาตรฐานวิชาชีพ เช่น มียาแก้ปวดกลุ่ม `opioids` เพียงพอและจัดทำแผนดูแลล่วงหน้าตามมาตรฐาน) · และ <strong>`Patient-Centeredness`</strong> (ยึดผู้ป่วยเป็นศูนย์กลาง — เคารพคุณค่า ศักดิ์ศรี และให้ผู้ป่วยกับญาติร่วมตัดสินใจวางแผนการดูแลล่วงหน้า `Advance Care Plan: ACP` เพื่อไม่ส่งห้องฉุกเฉินสวนทางกับความต้องการของผู้ป่วย)",
          en: "<strong>Exact Sub-Definitions of Quality (IOM / STEP):</strong> Safety (avoiding harm), Timeliness (reducing harmful waiting times for time-sensitive care like oncology), Effectiveness (delivering evidence-based standard care, essential opioids, and systematic ACP), and Patient-Centeredness (shared decision-making and honoring patient/family values via Advance Care Planning).",
        },
        {
          th: "<strong>แยก `Contact Coverage` ออกจาก `Effective Coverage` (`Tanahashi / WHO`):</strong> การมีนโยบายหรือมีหน่วยบริการตั้งอยู่ (`Contact coverage`) ยังไม่เกิดผลลัพธ์สุขภาพ หากติดคอขวดด้านความพร้อมของยา บุคลากร มาตรฐานคลินิก และการมีส่วนร่วมตัดสินใจ (`Effective coverage = Need × Utilization × Quality`)",
          en: "<strong>Contact Coverage vs. Effective Coverage:</strong> Nominal policy or clinic availability falls short unless patients receive complete, standard-compliant, person-centered care (`Need × Use × Quality`).",
        },
      ],
      caseLensTH: "จุดเน้นในการตอบโจทย์ HS3: (1) เมื่อนโยบายลดคิวรอคอยจนผู้ป่วยได้รับเคมีบำบัด/ฉายรังสี/ผ่าตัดเร็วขึ้น ให้ระบุ `Main: Quality` → `Sub: Timeliness` และ (2) เมื่อบริการระยะท้ายยังขาดมาตรฐาน/ขาดยาจำเป็น หรือไม่ได้ทำ `ACP` ร่วมกับผู้ป่วยและญาติจนถูกส่ง ER ขัดเจตจำนง ให้แยกตอบ `Main: Quality` → `Sub: Effectiveness` และ `Sub: Patient-Centeredness` พร้อมเชื่อมแนวคิด `Effective Coverage`",
      caseLensEN: "HS3 case precision: (1) Faster oncology treatment maps to Main: Quality → Sub: Timeliness; (2) missing clinical standards/opioids vs. lack of shared Advance Care Planning (leading to unwanted ER transfers) map distinctly to Quality → Effectiveness and Quality → Patient-Centeredness.",
      flowRoleTH: "ต่อยอดจาก Equity (หมวด 2) ว่าเมื่อเข้าถึงได้แล้วบริการต้องมีคุณภาพจริง ก่อนถามในหมวด 4 ว่าการจัดสรรทรัพยากรแบบแยกโรคหรือขาดการเชื่อมข้อมูลกระทบประสิทธิภาพอย่างไร",
      flowRoleEN: "Builds on Equity (Section 2) to ensure quality and effective coverage, leading into Technical vs. Allocative Efficiency in Section 4.",
      crossLinks: [
        {
          target: "HS1:3",
          labelTH: "HS1 · หมวด 3 (ป้องกันระดับ 4 ลด Overuse)",
          labelEN: "HS1 · Sec 3 (Quaternary Prevention)",
          whyTH: "ความมีประสิทธิผลและความปลอดภัย (`Effective & Safe`) ต้องหลีกเลี่ยงทั้งการให้การรักษาน้อยเกินไปและหัตถการยื้อชีวิตที่เกินความมุ่งหมาย",
          whyEN: "Clinical quality guards against both underuse of needed care and non-beneficial overuse.",
        },
        {
          target: "HS5:5",
          labelTH: "HS5 · หมวด 5 (บริการปฐมภูมิยึดคนเป็นศูนย์กลาง)",
          labelEN: "HS5 · Sec 5 (Person-Centered Primary Care)",
          whyTH: "บริการปฐมภูมิ 5 คุณลักษณะเป็นรากฐานของการสร้างความครอบคลุมอย่างมีประสิทธิผลและการดูแลต่อเนื่องที่บ้าน",
          whyEN: "Continuous, coordinated primary care closes the effective-coverage gap across home and community.",
        },
      ],
      keywords: [
        { th: "ปลอดภัย · ทันเวลา · ประสิทธิผล · ยึดผู้ป่วยเป็นศูนย์กลาง", en: "Safety · Timeliness · Effectiveness · Patient-Centeredness" },
        { th: "การวางแผนการดูแลล่วงหน้า", en: "Advance Care Plan (ACP)" },
        { th: "ความครอบคลุมอย่างมีประสิทธิผล", en: "Contact vs. Effective Coverage" },
      ],
    },
    "HS3:4": {
      secLabelTH: "หมวดที่ 4 · ประสิทธิภาพของระบบบริการ (Technical · Productive · Allocative Efficiency)",
      secLabelEN: "Section 4 · Technical, Productive & Allocative Efficiency and HTA",
      titleTH: "แยกประสิทธิภาพเชิงเทคนิค การผลิต และการจัดสรรทรัพยากร (Allocative Efficiency) ภายใต้ต้นทุนค่าเสียโอกาส",
      titleEN: "Distinguishing Technical, Productive, and Allocative Efficiency Under Opportunity Cost",
      summaryTH: "ประสิทธิภาพไม่ใช่การตัดงบให้ถูกที่สุด แต่คือการจัดสรรชุดบริการและระดับหน่วยบริการให้สร้างคุณค่าสุขภาพและสวัสดิการสังคมรวมสูงสุดโดยไม่เกิดความสูญเปล่าแยกส่วน",
      summaryEN: "Efficiency is never blind cost-cutting; it eliminates fragmentation and waste so scarce resources generate maximum total health and social value.",
      bullets: [
        {
          th: "<strong>แยก `Allocative Efficiency` ออกจาก `Technical` และ `Productive Efficiency` ให้ขาด:</strong> <strong>`Allocative efficiency` (ประสิทธิภาพการจัดสรรทรัพยากร)</strong> คือการจัดสรรงบประมาณ ชุดสิทธิประโยชน์ และระดับหน่วยบริการให้เกิดผลลัพธ์สุขภาพและสวัสดิการรวมสูงสุด (รวมต้นทุนเวลาและค่าเดินทางของครัวเรือน) · ส่วน <strong>`Technical efficiency`</strong> คือการลดความสูญเปล่าในกระบวนการ (เช่น เชื่อมเวชระเบียนอิเล็กทรอนิกส์ลดตรวจซ้ำ) และ <strong>`Productive efficiency`</strong> คือการผสมผสานทักษะบุคลากรอย่างเหมาะสม",
          en: "<strong>Separate Allocative from Technical & Productive Efficiency:</strong> Allocative efficiency designs the right mix of benefits and care levels to maximize overall health and household welfare; Technical efficiency eliminates operational waste (e.g., interoperable EHRs); Productive efficiency optimizes skill mix.",
        },
        {
          th: "<strong>สัญญาณความบกพร่องของ `Allocative Efficiency` และต้นทุนค่าเสียโอกาส (`Opportunity Cost`):</strong> เกิดขึ้นเมื่อนโยบายออกแบบสิทธิประโยชน์แบบแยกส่วนเฉพาะโรคเดี่ยว (`Disease-specific silo`) โดยไม่ครอบคลุมโรคร่วมเรื้อรัง (`Comorbidities`) ทำให้ผู้ป่วยต้องตระเวนรับบริการหลายโรงพยาบาล เสียค่าเดินทาง เวลา และรายได้ หรือเมื่อเคสไม่ซับซ้อนไหลไปแออัดในโรงพยาบาลตติยภูมิ",
          en: "<strong>Classic Allocative Efficiency Deficits:</strong> Single-disease benefit silos that exclude chronic comorbidities force patients to visit multiple hospitals—imposing heavy travel, time, and income costs—while crowding tertiary centers creates high opportunity costs.",
        },
        {
          th: "<strong>`HTA` เป็นเครื่องมือจัดชุดสิทธิประโยชน์ที่มีรั้วกั้นทางจริยธรรม:</strong> ประเมินความคุ้มค่า (`ICER / QALY`) ควบคู่ผลกระทบงบประมาณ ความปลอดภัย และความเป็นธรรมต่อกลุ่มเปราะบาง",
          en: "<strong>HTA with Ethical Guardrails:</strong> Health Technology Assessment weighs cost-effectiveness alongside budget sustainability, safety, and equity.",
        },
      ],
      caseLensTH: "จุดชี้ขาดในโจทย์ประเมินช่องว่างนโยบาย: หากสิทธิประโยชน์เปิดเสรีเฉพาะโรคหนึ่งแต่ไม่ครอบคลุมโรคร่วม (เช่น เบาหวาน ความดัน ไตเรื้อรัง) จนผู้ป่วยต้องเดินทางแยกไปรักษาหลายแห่งและเกิดความแออัดใน รพ.ใหญ่ คุณลักษณะหลักที่บกพร่องชัดเจนคือ `Efficiency` → องค์ประกอบย่อย `Allocative Efficiency` (ควบคู่กับ `Technical Efficiency` เมื่อเวชระเบียนยังไม่เชื่อมโยง)",
      caseLensEN: "Key diagnostic clue: when a disease-specific policy excludes chronic comorbidities—forcing multi-hospital travel and tertiary congestion—identify Main: Efficiency → Sub: Allocative Efficiency (alongside Technical Efficiency for unlinked electronic records).",
      flowRoleTH: "เชื่อมคุณภาพ (หมวด 3) เข้ากับประสิทธิภาพการจัดสรรทรัพยากร (หมวด 4) ก่อนก้าวสู่หมวด 5 ว่า 'ต้องกำกับดูแลความโปร่งใสและบูรณาการความร่วมมืออย่างไร'",
      flowRoleEN: "Connects Quality (Section 3) to Allocative and Technical Efficiency, raising Section 5's question of transparent stewardship and cross-sector governance.",
      crossLinks: [
        {
          target: "HS6:4",
          labelTH: "HS6 · หมวด 4 (วิธีจ่ายค่าบริการสร้างประสิทธิภาพ)",
          labelEN: "HS6 · Sec 4 (Provider Payment & Efficiency)",
          whyTH: "การจ่ายแบบเหมาจ่ายรายหัวและ DRGs จูงใจให้หน่วยบริการยกระดับประสิทธิภาพเชิงเทคนิคและการผลิต",
          whyEN: "Capitation and DRG payments incentivize hospitals to improve technical and productive efficiency.",
        },
        {
          target: "HS6:5",
          labelTH: "HS6 · หมวด 5 (บัญชียาหลักแห่งชาติและ Prior Authorization)",
          labelEN: "HS6 · Sec 5 (NLEM & Rational Use Controls)",
          whyTH: "การคัดเลือกยาเข้าบัญชียาหลักแห่งชาติอาศัย HTA เพื่อคุ้มครองทั้งความคุ้มค่าและความยั่งยืนของกองทุน",
          whyEN: "Thailand's National List of Essential Medicines applies HTA to align clinical value with fund sustainability.",
        },
      ],
      keywords: [
        { th: "ประสิทธิภาพการจัดสรรทรัพยากร", en: "Allocative Efficiency" },
        { th: "ประสิทธิภาพเชิงเทคนิคและการผลิต", en: "Technical & Productive Efficiency" },
        { th: "ต้นทุนค่าเสียโอกาสและปัญหาแยกส่วนโรค", en: "Opportunity Cost & Disease Silos" },
        { th: "การประเมินเทคโนโลยีด้านสุขภาพ", en: "Health Technology Assessment (HTA)" },
      ],
    },
    "HS3:5": {
      secLabelTH: "หมวดที่ 5 · ธรรมาภิบาล ภาระรับผิดชอบต่อสังคม และความสอดคล้องกับบริบท",
      secLabelEN: "Section 5 · Good Governance, Social Accountability, and Relevance",
      titleTH: "การกำกับติดตามอย่างโปร่งใส ความร่วมมือรัฐ–เอกชน–ประชาสังคม (PPP) และความสอดคล้องปัญหาพื้นที่",
      titleEN: "Transparent Monitoring, Public–Private–Civil Partnerships (PPP), and Contextual Relevance",
      summaryTH: "ระบบบริการไร้รอยต่อเกิดขึ้นไม่ได้หากรัฐ เอกชน และประชาสังคมต่างคนต่างทำ จึงต้องมีธรรมาภิบาลที่โปร่งใส รับฟังประชาชน และสอดรับบริบทพื้นที่จริง",
      summaryEN: "Seamless care requires transparent stewardship, citizen accountability, local relevance, and clear governance frameworks across public, private, and civil-society providers.",
      bullets: [
        {
          th: "<strong>ธรรมาภิบาล (`Good Governance`) และกรอบความร่วมมือเชิงระบบ (`PPP`):</strong> แก้ปัญหาตัวการ–ตัวแทนและการทำงานแยกส่วนด้วยการวางมาตรฐานกลาง ระบบกำกับติดตามที่โปร่งใสทั้งปริมาณและคุณภาพ และกลไกความร่วมมือระหว่างภาครัฐ เอกชน และองค์กรไม่แสวงกำไร",
          en: "<strong>Stewardship & Integrated PPP Governance:</strong> Overcomes fragmented silos via shared service standards, transparent volume-and-quality monitoring, and structured Public–Private–NGO partnerships.",
        },
        {
          th: "<strong>ภาระรับผิดชอบต่อสังคม (`Social Accountability`) และความสอดคล้อง (`Relevance`):</strong> เปิดช่องทางให้ผู้ป่วย ครอบครัว และชุมชนร่วมออกแบบและสะท้อนผล เพื่อให้การจัดลำดับความสำคัญตอบโจทย์สังคมสูงวัยและปัญหาจริงของพื้นที่",
          en: "<strong>Social Accountability & Contextual Relevance:</strong> Citizen voice and community oversight align benefit packages and care models with aging demographics and local realities.",
        },
      ],
      caseLensTH: "เมื่อสถานการณ์ชี้ว่าบริการยังอยู่ในขั้นเริ่มบูรณาการ หน่วยบริการรัฐ–เอกชน–องค์กรไม่แสวงกำไรยังทำงานแยกส่วน ขาดกรอบกำกับติดตามหรือกรอบ PPP ที่ชัดเจน สามารถเชื่อมโยงช่องว่างด้าน `Governance / Coordination` และ `Relevance` เสริมการวิเคราะห์คลินิกได้",
      caseLensEN: "When scenarios highlight fragmented public, private, and NGO delivery or missing transparent M&E frameworks, connect those gaps to Governance, Care Integration, and Contextual Relevance.",
      flowRoleTH: "วางรากฐานธรรมาภิบาลและความไว้เนื้อเชื่อใจในภาวะปกติ ซึ่งเป็นต้นทุนสำคัญของความยั่งยืนและความยืดหยุ่นเมื่อเผชิญแรงกดดันในหมวด 6",
      flowRoleEN: "Builds transparent governance and cross-sector coordination that underpin system Sustainability and crisis Resilience in Section 6.",
      crossLinks: [
        {
          target: "ST1:1",
          labelTH: "ST1 · หมวด 1 (บริบทกำหนดการทำงานของระบบ)",
          labelEN: "ST1 · Sec 1 (Context Matters)",
          whyTH: "เกณฑ์ `Relevance` ยืนยันว่ามาตรการที่ดีต้องสอดรับกับบริบทประชากรและวัฒนธรรมของแต่ละพื้นที่",
          whyEN: "Contextual relevance ensures system designs fit local demographic and cultural realities.",
        },
        {
          target: "HS5:4",
          labelTH: "HS5 · หมวด 4 (ปฏิญญาแอสทานาและการมีส่วนร่วมของชุมชน)",
          labelEN: "HS5 · Sec 4 (Astana Community Empowerment)",
          whyTH: "การมีส่วนร่วมของชุมชนและภาคประชาสังคมในระบบปฐมภูมิคือกลไกสร้าง Social Accountability ในระดับพื้นที่",
          whyEN: "Community engagement in PHC brings social accountability and local relevance to life.",
        },
      ],
      keywords: [
        { th: "ธรรมาภิบาลและการกำกับติดตาม", en: "Governance & Transparent Monitoring" },
        { th: "ความร่วมมือภาครัฐ–เอกชน–ประชาสังคม", en: "Public–Private Partnership (PPP)" },
        { th: "ภาระรับผิดชอบต่อสังคม", en: "Social Accountability" },
        { th: "ความสอดคล้องกับบริบท", en: "Contextual Relevance" },
      ],
    },
    "HS3:6": {
      secLabelTH: "หมวดที่ 6 · ความยืดหยุ่นของระบบสุขภาพ (Resilience) และความยั่งยืน",
      secLabelEN: "Section 6 · Health System Resilience & Sustainability",
      titleTH: "การดูดซับแรงกระแทก การปรับตัว การปฏิรูปโครงสร้าง และการไม่ผลักภาระให้คนหน้างาน",
      titleEN: "Absorptive, Adaptive, and Transformative Capacities Alongside Workforce & Fiscal Sustainability",
      summaryTH: "ระบบที่ยืดหยุ่นและยั่งยืนต้องคงบริการจำเป็นไว้ได้พร้อมปรับโครงสร้างรองรับภาระงานที่เปลี่ยนไป โดยไม่ปล่อยให้บุคลากรโรงพยาบาลรับส่งต่อเกิดภาวะเหนื่อยล้าเรื้อรัง",
      summaryEN: "Resilient, sustainable systems protect essential care and adapt structures without shifting chronic overload onto frontline hospital staff.",
      bullets: [
        {
          th: "<strong>3 ระดับขีดความสามารถเมื่อเผชิญวิกฤตหรือการเปลี่ยนผ่าน:</strong> `Absorptive` (ดูดซับแรงกระแทกเบื้องต้น) `Adaptive` (ปรับวิธีจัดบริการและกระจายภาระงานให้ยืดหยุ่น) และ `Transformative` (ปฏิรูปโครงสร้างระยะยาว)",
          en: "<strong>Three Resilience Capacities:</strong> Absorptive buffering, Adaptive operational flexibility, and Transformative structural reform.",
        },
        {
          th: "<strong>เชื่อมความยืดหยุ่นเข้ากับความยั่งยืนทางการคลังและกำลังคน (`Sustainability`):</strong> ห้ามใช้วาทกรรมความทุ่มเทผลักภาระงานล้นมือให้บุคลากรหน้างาน ต้องลงทุนกระจายศักยภาพหน่วยบริการและวางสมดุลงบประมาณระยะยาวควบคู่กัน",
          en: "<strong>Protect Frontline & Fiscal Sustainability:</strong> Never normalize staff exhaustion; pair access expansion with regional capacity investment and long-term fiscal stewardship.",
        },
      ],
      caseLensTH: "เมื่อการเปิดเสรีเข้าถึงบริการทำให้ผู้ป่วยไหลเข้ากระจุกตัวในโรงพยาบาลศูนย์จนพยาบาลและแพทย์หน้างานเหนื่อยล้า และผู้บริหารกังวลเรื่องงบประมาณระยะยาว ให้ชี้ประเด็นความท้าทายด้าน `Sustainability` (ทั้งด้านการคลังและภาระงานกำลังคน) และการกระจายศักยภาพเครือข่าย",
      caseLensEN: "When rapid access expansion concentrates patients at tertiary centers—straining frontline nurses and long-term budgets—flag Workforce & Financial Sustainability challenges.",
      flowRoleTH: "เติมมิติพลวัตตามเวลา (`Resilience & Sustainability`) ให้ครบทุกเกณฑ์ ก่อนนำ `EQESaRR` ทั้งหมดมาสังเคราะห์การชั่งน้ำหนัก `Trade-offs` ในหมวด 7",
      flowRoleEN: "Completes the EQESaRR criteria with dynamic Resilience and Sustainability before Section 7 synthesizes multi-criteria policy trade-offs.",
      crossLinks: [
        {
          target: "HS5:6",
          labelTH: "HS5 · หมวด 6 (EPHFs และการเตรียมพร้อมรับภาวะฉุกเฉิน)",
          labelEN: "HS5 · Sec 6 (EPHFs & Emergency Preparedness)",
          whyTH: "หน้าที่สาธารณสุขที่จำเป็น (`EPHFs`) ในระบบปฐมภูมิเป็นด่านเฝ้าระวังและคงบริการจำเป็นยามเกิดโรคระบาด",
          whyEN: "Primary-level surveillance and Essential Public Health Functions anchor real-world system resilience.",
        },
      ],
      keywords: [
        { th: "ความยืดหยุ่นของระบบสุขภาพ", en: "Health System Resilience" },
        { th: "ดูดซับ · ปรับตัว · เปลี่ยนผ่านโครงสร้าง", en: "Absorptive · Adaptive · Transformative" },
        { th: "ความยั่งยืนทางการคลังและกำลังคน", en: "Financial & Workforce Sustainability" },
      ],
    },
    "HS3:7": {
      secLabelTH: "หมวดที่ 7 · บริบทระบบสุขภาพไทยและการชั่งน้ำหนักเกณฑ์ EQESaRR",
      secLabelEN: "Section 7 · Thai National Health Charter & Multi-Criteria Trade-Offs",
      titleTH: "ธรรมนูญว่าด้วยระบบสุขภาพแห่งชาติและการประเมินการแลกได้แลกเสีย (Trade-offs) ของนโยบายจริง",
      titleEN: "Thailand's National Health Charter and Navigating Real-World EQESaRR Trade-Offs",
      summaryTH: "ไม่มีนโยบายใดได้คะแนนเต็มทุกด้านพร้อมกันโดยอัตโนมัติ การปลดล็อกการเข้าถึงด้านหนึ่งจึงต้องออกแบบกลไกรองรับด้านประสิทธิภาพ คุณภาพ และความยั่งยืนควบคู่กันเสมอ",
      summaryEN: "No policy automatically maximizes every metric at once; expanding access on one front requires deliberate safeguards for efficiency, quality parity, and sustainability.",
      bullets: [
        {
          th: "<strong>ธรรมนูญสุขภาพไทยวางฐานคุณค่า คู่กับ `EQESaRR` ที่ใช้วัดผลระดับบริการ:</strong> ธรรมนูญฯ ยึดสุขภาพองค์รวม 4 มิติและธรรมาภิบาลแบบมีส่วนร่วม ขณะที่ `EQESaRR` เป็นเครื่องมือเจาะลึกจุดแข็งและข้อบกพร่องของระบบบริการสุขภาพอย่างเป็นรูปธรรม",
          en: "<strong>Charter Values Paired with Service Metrics:</strong> Thailand's National Health Charter sets holistic governance values, operationalized at the service level through EQESaRR.",
        },
        {
          th: "<strong>ฝึกอ่าน `Trade-offs` ข้ามเกณฑ์อย่างรอบด้าน:</strong> นโยบายปลดล็อกสิทธิรักษาเฉพาะโรคช่วยเพิ่ม `Equity (Accessibility)` และ `Quality (Timeliness)` ได้เด่นชัด แต่หากแยกส่วนจากโรคร่วมและยังไม่เชื่อมเวชระเบียน จะเกิดช่องว่างด้าน `Allocative Efficiency`, `Technical Efficiency`, `Equity in Quality` และ `Sustainability`",
          en: "<strong>Diagnose Policy Trade-Offs Clearly:</strong> Policies that boost Equity of Access and Timeliness for one disease can simultaneously expose gaps in Allocative Efficiency (comorbidity silos), EHR Technical Efficiency, and Tertiary Sustainability.",
        },
      ],
      caseLensTH: "สูตรทองของการอภิปรายนโยบายใน HS3: ชื่นชมจุดแข็งที่ปลดล็อกได้จริง (เช่น `Equity → Financial/Administrative Accessibility` และ `Quality → Timeliness`) พร้อมชี้จุดบกพร่องเชิงระบบอย่างแม่นยำ (เช่น `Efficiency → Allocative Efficiency` หรือ `Quality → Effectiveness & Patient-Centeredness`) โดยอ้างอิงหลักฐานจากบทความทุกข้อ",
      caseLensEN: "Golden formula for HS3 policy cases: pair exact credit for unlocked strengths (Equity of Access, Timeliness) with precise diagnosis of systemic deficits (Allocative Efficiency, Effectiveness, Patient-Centeredness) backed by scenario evidence.",
      flowRoleTH: "รวบยอดทั้งบท HS3 เป็นกรอบคิดชั่งน้ำหนักเกณฑ์หลัก–ย่อยของ `EQESaRR` ที่จะใช้ประเมินงานสร้างเสริมสุขภาพ (HS4) ปฐมภูมิ (HS5) และการคลังสุขภาพ (HS6)",
      flowRoleEN: "Integrates all EQESaRR main and sub-criteria into a balanced policy-evaluation lens carried into HS4, HS5, and HS6.",
      crossLinks: [
        {
          target: "HS6:5",
          labelTH: "HS6 · หมวด 5 (คุมค่าใช้จ่ายโดยไม่เสียคุณภาพและการเข้าถึง)",
          labelEN: "HS6 · Sec 5 (Cost Containment vs. Quality & Access)",
          whyTH: "การออกแบบมาตรการคุม Moral hazard ใน HS6 คือโจทย์ชั่งน้ำหนัก Efficiency คู่กับ Quality และ Equity โดยตรง",
          whyEN: "Controlling moral hazard in HS6 exemplifies balancing Efficiency without sacrificing Quality or Equity.",
        },
      ],
      keywords: [
        { th: "ธรรมนูญว่าด้วยระบบสุขภาพแห่งชาติ", en: "National Health Charter" },
        { th: "กรอบเกณฑ์ประเมินหกมิติ EQESaRR", en: "EQESaRR Multi-Criteria Framework" },
        { th: "การแลกได้แลกเสียเชิงนโยบาย", en: "Policy Trade-Offs" },
      ],
    },
    "HS3:sum": {
      secLabelTH: "บทสรุป · เช็กลิสต์สังเคราะห์ก่อนทำ Case Discussion HS3 & Open Note",
      secLabelEN: "Synthesis · HS3 Case Discussion & Open-Note Readiness",
      titleTH: "บทสรุปการจับคู่องค์ประกอบหลัก–องค์ประกอบย่อย–นิยามทฤษฎีตามกรอบ EQESaRR",
      titleEN: "Mastering Main Characteristic → Sub-Characteristic → Theoretical Definition in EQESaRR",
      summaryTH: "จำแนกองค์ประกอบหลักและองค์ประกอบย่อยให้แม่น นิยามตามทฤษฎีให้ชัด และดึงหลักฐานจากสถานการณ์มาจับคู่ให้ตรงจุด คือหัวใจของการทำคะแนนเต็มในกรณีศึกษา HS3",
      summaryEN: "Naming the exact Main and Sub-characteristic, stating its theoretical definition, and grounding it in case evidence form the blueprint for every HS3 policy analysis.",
      bullets: [
        {
          th: "<strong>เช็กลิสต์คู่หลัก–ย่อยที่ใช้บ่อยที่สุดใน Case Discussion HS3:</strong> `Equity` → `Financial / Geographical / Administrative Accessibility` · `Quality` → `Timeliness`, `Effectiveness` (มาตรฐานวิชาชีพ/ยาจำเป็น), `Patient-Centeredness` (ร่วมตัดสินใจ/ทำ `ACP`) คู่แนวคิด `Contact vs. Effective Coverage` · และ `Efficiency` → `Allocative Efficiency` (ปัญหาแยกส่วนโรคเดี่ยวไม่รวมโรคร่วม/ความแออัดตติยภูมิ) เทียบกับ `Technical Efficiency` (เวชระเบียนไม่เชื่อมโยง)",
          en: "<strong>High-Yield Main → Sub Pairs for HS3 Cases:</strong> Equity → Financial/Administrative/Geographical Accessibility; Quality → Timeliness, Effectiveness, and Patient-Centeredness (ACP) alongside Contact vs. Effective Coverage; Efficiency → Allocative Efficiency (comorbidity silos & congestion) vs. Technical Efficiency (unlinked EHRs).",
        },
      ],
      caseLensTH: "ตรวจทานก่อนส่งใบงาน HS3 ทุกข้อว่าได้เขียนครบทั้ง 4 ส่วนหรือยัง: ① คุณลักษณะหลัก ② คุณลักษณะย่อย ③ คำอธิบายความหมายตามทฤษฎีของข้อย่อยนั้น และ ④ ตัวอย่างเหตุการณ์จากบทความที่สอดคล้องกันโดยตรง",
      caseLensEN: "Before submitting any HS3 worksheet row, verify all 4 components: (1) Main attribute, (2) Sub-attribute, (3) Theoretical definition of that sub-attribute, and (4) Direct supporting evidence from the text.",
      flowRoleTH: "จบกรอบเกณฑ์ประเมินระบบบริการใน HS3 แล้วก้าวสู่ HS4 เพื่อวิเคราะห์กลไกพฤติกรรมสุขภาพ ปัจจัยเชิงพาณิชย์ (`CDoH`) ตัวแบบ `COM-B` และกฎบัตรออตตาวา",
      flowRoleEN: "Concludes HS3's evaluative compass and moves to HS4: diagnosing behavior change via COM-B, CDoH, and the Ottawa Charter.",
      crossLinks: [
        {
          target: "HS4:1",
          labelTH: "ต่อยอดสู่ HS4 · หมวด 1 (พฤติกรรมสุขภาพและการระบุพฤติกรรมเป้าหมาย)",
          labelEN: "Next: HS4 · Sec 1 (Health Behaviour & Specifying Target Behaviour)",
          whyTH: "ยกระดับประสิทธิภาพการจัดสรร (`Allocative Efficiency`) และความเป็นธรรมด้วยการปรับพฤติกรรมและสิ่งแวดล้อมตั้งแต่ต้นน้ำ",
          whyEN: "Upstream behavior and environment redesign advances both allocative efficiency and health equity.",
        },
      ],
      keywords: [
        { th: "เข็มทิศหกมิติ EQESaRR (หลัก–ย่อย)", en: "EQESaRR Main & Sub-Dimensions" },
        { th: "ความครอบคลุมอย่างมีประสิทธิผล", en: "Effective Coverage" },
        { th: "ดุลยภาพและการแลกได้แลกเสีย", en: "Systemic Balance & Trade-Offs" },
      ],
    },

    /* -------------------- HS4: Health Behaviour, Behaviour Change & Health Promotion -------------------- */
    "HS4:1": {
      secLabelTH: "หมวดที่ 1 · พฤติกรรมสุขภาพ 3 ระยะ และการระบุพฤติกรรมปัญหา–พฤติกรรมเป้าหมาย",
      secLabelEN: "Section 1 · 3 Stages of Health Behaviour & Specifying Problem vs. Target Behaviour",
      titleTH: "ภาระโรค NCDs พฤติกรรมสุขภาพ 3 ระยะ และการแยก 'พฤติกรรมที่สังเกตได้' ออกจาก 'ผลลัพธ์สุขภาพ'",
      titleEN: "NCD Burden, 3 Behavioural Stages, and Separating Observable Behaviour from Clinical Outcomes",
      summaryTH: "จุดตั้งต้นของการปรับพฤติกรรมคือการนิยามการกระทำที่ต้องการเปลี่ยนให้จำเพาะและสังเกตได้ โดยไม่สับสนกับค่าผลตรวจทางคลินิก และเข้าใจพฤติกรรมมนุษย์ครบทั้งสามระยะ",
      summaryEN: "Effective behaviour change starts by specifying concrete, observable target actions—never confusing behaviour with clinical lab outcomes—across all three stages of health behaviour.",
      bullets: [
        {
          th: "<strong>สังคมสูงวัยสมบูรณ์ + NCDs 76% ต้องผสานปรับพฤติกรรมคู่กับการรักษาด้วยยา:</strong> การปรับวิถีชีวิตเข้มข้นลดอุบัติการณ์เบาหวานได้ 58% (`DPP`) แต่เมื่อเป็นโรคแล้ว (`Look AHEAD`) ยังต้องใช้ยาร่วมด้วย และควรเน้นคัดกรองตามเกณฑ์อายุ/ความเสี่ยงแทนการตรวจสุขภาพทั่วไปแบบไม่จำเพาะ (`Cochrane RR = 1.00`)",
          en: "<strong>Lifestyle + Pharmacotherapy & Risk-Targeted Screening:</strong> Intensive lifestyle cuts T2DM onset by 58% (DPP), established disease still requires medication alongside lifestyle, and screening should follow age/risk criteria rather than untargeted general checkups.",
        },
        {
          th: "<strong>กลไกสิ่งเร้า–การตอบสนอง และพฤติกรรมสุขภาพ 3 ระยะ (`Kasl & Cobb`):</strong> แยกพฤติกรรมภายนอกที่สังเกตได้ (`overt`; อัตราหัวใจเต้นเป็นสรีรวิทยา ไม่ใช่ `overt`) พฤติกรรมภายใน (`covert`) และจำแนก 3 ระยะตามการรับรู้สถานะสุขภาพ ได้แก่ ระยะป้องกันก่อนป่วย (`preventive`), ระยะเริ่มมีอาการ (`illness`), และระยะบทบาทผู้ป่วย (`sick-role`)",
          en: "<strong>Overt/Covert & Kasl–Cobb's 3 Stages:</strong> Distinguish observable actions vs. inner thoughts/feelings (heart rate is physiological, not overt) across preventive, illness, and sick-role behaviour.",
        },
        {
          th: "<strong>กฎขั้นที่ 1 ของการออกแบบการปรับเปลี่ยนพฤติกรรม (`Problem vs. Target Behavior`):</strong> ต้องระบุทั้ง 'พฤติกรรมเสี่ยงเดิมที่เป็นปัญหา' และ 'พฤติกรรมเป้าหมายใหม่ที่ต้องการส่งเสริม' เป็น <strong>กริยาการกระทำของกลุ่มเป้าหมายที่สังเกตได้ชัดเจน</strong> (ใคร ทำอะไร แทนที่วิถีปฏิบัติเดิมใด) โดยห้ามเขียนเป็นผลลัพธ์สุขภาพหรือค่าผลเลือด (`Health outcome`)",
          en: "<strong>Specifying Problem vs. Target Behavior (Michie et al.):</strong> Define both the existing Problem Behavior and desired Target Behavior as concrete, observable human actions (who does what instead of what)—never as a downstream lab or clinical outcome.",
        },
      ],
      caseLensTH: "กับดักสำคัญในโจทย์ HS4 ข้อแรก: ห้ามตอบพฤติกรรมเป้าหมายเป็นผลลัพธ์ทางคลินิก เช่น 'ค่าสารเคมีตกค้างในเลือดลดลง' หรือ 'มีสุขภาพดีขึ้น' (นั่นคือ `Health outcome`!) ต้องระบุเป็นการกระทำจำเพาะของกลุ่มเป้าหมาย เช่น การเปลี่ยนจากใช้สารเคมีปริมาณมากมาทำเกษตรปลอดภัยหรือเกษตรอินทรีย์",
      caseLensEN: "Avoid the #1 HS4 Case Discussion trap: never write a clinical or lab result (e.g., 'lower blood toxin levels') as a Target Behavior—specify the concrete action performed by the target group.",
      flowRoleTH: "ปูฐานการนิยามพฤติกรรมที่สังเกตได้และ 3 ระยะพฤติกรรม ก่อนเข้าสู่การวินิจฉัยว่า 'อะไรล็อกพฤติกรรมเดิมไว้ และจะปลดล็อกด้วย COM-B อย่างไร' ในหมวด 2",
      flowRoleEN: "Establishes observable target-behavior specification and 3-stage taxonomy before Section 2 diagnoses behavioural locks and solutions via CDoH and COM-B.",
      crossLinks: [
        {
          target: "HS1:1",
          labelTH: "HS1 · หมวด 1 (Disease, Illness & Sickness Role)",
          labelEN: "HS1 · Sec 1 (Disease, Illness & Sick Role)",
          whyTH: "พฤติกรรมระยะมีอาการและระยะบทบาทผู้ป่วยเชื่อมโยงโดยตรงกับมโนทัศน์ `Illness` และ `Sickness` ใน HS1",
          whyEN: "Illness behaviour and sick-role behaviour map directly onto HS1's Illness and Sickness concepts.",
        },
        {
          target: "HS2:5",
          labelTH: "HS2 · หมวด 5 (รูปแบบการดูแลโรคเรื้อรังต่อเนื่อง)",
          labelEN: "HS2 · Sec 5 (Chronic Care Models)",
          whyTH: "ภาระโรค NCDs ต้องอาศัยทั้งการปรับพฤติกรรมต้นน้ำและการจัดระบบดูแลผู้ป่วยโรคเรื้อรังแบบหุ้นส่วน",
          whyEN: "Rising NCDs require pairing lifestyle support with collaborative chronic care delivery.",
        },
      ],
      keywords: [
        { th: "พฤติกรรมปัญหาเทียบกับพฤติกรรมเป้าหมาย", en: "Problem vs. Target Behavior" },
        { th: "พฤติกรรมเทียบกับผลลัพธ์สุขภาพ", en: "Behavior vs. Health Outcome" },
        { th: "พฤติกรรมสุขภาพ 3 ระยะ (Kasl & Cobb)", en: "Kasl & Cobb's 3 Stages" },
      ],
    },
    "HS4:2": {
      secLabelTH: "หมวดที่ 2 · ทฤษฎีพฤติกรรม ปัจจัยเชิงพาณิชย์ (CDoH) Nudge และตัวแบบ COM-B ครบ 6 มิติย่อย",
      secLabelEN: "Section 2 · Behaviour Theories, CDoH, Nudge & All 6 Sub-Components of COM-B",
      titleTH: "ก้าวข้ามกับดักการสอนสุขศึกษา (KAP) สู่การวิเคราะห์ CDoH, HBM, Nudge และตัวแบบ COM-B ทั้ง 6 องค์ประกอบย่อย",
      titleEN: "Beyond KAP: Diagnosing CDoH, HBM, Nudge, and the 6 Sub-Components of COM-B (BCW)",
      summaryTH: "เมื่อคนรู้ว่าเสี่ยงแต่ถูกเงื่อนไขตลาดและปากท้องบังคับ การอบรมให้ความรู้ซ้ำ ๆ ย่อมไร้ผล ต้องปลดล็อกครบทั้งความสามารถ โอกาส และแรงจูงใจทั้งหกองค์ประกอบย่อยของ COM-B",
      summaryEN: "When people already know a hazard yet commercial market rules trap their livelihood, education alone fails; lasting change unlocks all six Capability, Opportunity, and Motivation sub-components.",
      bullets: [
        {
          th: "<strong>ข้อจำกัดของ `KAP`, ปัจจัยกำหนดสุขภาพเชิงพาณิชย์ (`CDoH`), `HBM` และ `Stages of Change`:</strong> ความรู้เพียงอย่างเดียวติด `Intention–Behaviour Gap` โดยเฉพาะเมื่อโครงสร้างตลาดและเกณฑ์รับซื้อของพ่อค้ารายใหญ่ (`CDoH`) บีบให้ต้องคงพฤติกรรมเสี่ยงเพื่อความอยู่รอด ส่วนใน `HBM` การลดอุปสรรคและเห็นประโยชน์มีพลังเหนือการขู่ให้กลัว และใน `Stages of Change` (`41 RCTs`) ไม่ควรงดช่วยเหลือผู้ที่ยังไม่พร้อม",
          en: "<strong>KAP Limits, CDoH Locks, HBM & TTM:</strong> Knowledge alone cannot overcome Commercial Determinants of Health (`CDoH`, such as market standards penalizing safe practices); in HBM, lowering barriers outweighs fear appeals, and help should never be withheld by stage of change.",
        },
        {
          th: "<strong>จำแนกองค์ประกอบหลักและ 6 องค์ประกอบย่อยของ `COM-B` (`Michie et al., 2011`) ให้แม่นยำทุกตัว:</strong> <strong>`Capability` (ความสามารถ)</strong> แยกเป็น `C-Ph (Physical Capability)` สมรรถนะร่างกาย/ทักษะปฏิบัติทางกาย และ `C-Ps (Psychological Capability)` ความรู้โทษภัยที่ชัดเจนและทักษะคิดประเมินความเสี่ยง · <strong>`Opportunity` (โอกาสภายนอก)</strong> แยกเป็น `O-Ph (Physical Opportunity)` บริบทแวดล้อม ทรัพยากร ช่องทางตลาดรับซื้อทางเลือกและราคาที่เป็นธรรม และ `O-So (Social Opportunity)` การรวมกลุ่มเครือข่ายช่วยเหลือเกื้อกูล อำนาจต่อรอง และค่านิยมผู้บริโภค · <strong>`Motivation` (แรงจูงใจภายใน)</strong> แยกเป็น `M-Re (Reflective Motivation)` การหยุดคิดทบทวนผลดี–ผลเสีย การตัดสินใจอย่างมีเหตุผล และความเชื่อมั่นว่าฉันทำได้ (`Self-efficacy`) และ `M-Au (Automatic Motivation)` อารมณ์ความรู้สึก ความมั่นคงทางใจ และการคลายความกลัวขาดทุน",
          en: "<strong>Master All 6 COM-B Sub-Components:</strong> Capability = `C-Ph` (physical skill/stamina) & `C-Ps` (knowledge & risk appraisal); Opportunity = `O-Ph` (environmental resources, alternative fair-price markets) & `O-So` (farmer/peer groups, social support, consumer norms); Motivation = `M-Re` (reflective evaluation, planning, `self-efficacy`) & `M-Au` (emotional security, easing fear of income loss, habits).",
        },
        {
          th: "<strong>เชื่อม `Nudge` (`System 1`) เข้ากับวงล้อ `BCW` (9 มาตรการ · 7 นโยบาย):</strong> ค่าตั้งต้น (`default`, `d = 0.62`) ช่วยสะกิดทางเลือกอัตโนมัติ (โปรโมชันซื้อ 1 แถม 1 เป็นแรงจูงใจราคา ไม่ใช่ `Nudge`) แต่ผลเฉลี่ยระดับประชากรราว `+1.4%` จึงต้องผสานเข้ากับมาตรการปรับสิ่งแวดล้อม กฎหมาย และการคลังในวงล้อ `BCW`",
          en: "<strong>Nudge Paired with BCW Policy Rings:</strong> Choice-architecture defaults aid System 1 decisions (price promotions are not nudges), yet achieve lasting scale only when combined with environmental, fiscal, and regulatory policies in BCW.",
        },
      ],
      caseLensTH: "ในการตอบตาราง COM-B ของ Case Discussion ต้องระบุแยกทั้ง 'องค์ประกอบหลัก (`C / O / M`)' และ 'องค์ประกอบย่อย (`C-Ph, C-Ps, O-Ph, O-So, M-Re, M-Au`)' ให้ตรงกับหลักฐานในโจทย์ (เช่น ตลาดรับซื้อทางเลือก = `O-Ph`; รวมกลุ่มแลกเปลี่ยน/ไม่โดดเดี่ยว = `O-So`; ความรู้โทษภัย = `C-Ps`; หยุดคิดตัดสินใจ/เชื่อมั่นว่าทำได้ = `M-Re`; มั่นคงทางใจคลายกังวล = `M-Au` และอย่าเลือก `C-Ph` หากโจทย์ไม่ได้กล่าวถึงสมรรถนะทางกาย)",
      caseLensEN: "In COM-B case tables, name both Main (`C/O/M`) and exact Sub-component (`C-Ph, C-Ps, O-Ph, O-So, M-Re, M-Au`) grounded in scenario evidence—and avoid citing `C-Ph` unless physical/motor skill is actually supported by the text.",
      flowRoleTH: "สังเคราะห์เครื่องมือวิเคราะห์กลไกพฤติกรรมครบ 6 มิติย่อยของ `COM-B` ก่อนเชื่อมสู่ความรอบรู้ด้านสุขภาพระดับบุคคลและองค์กร (`Health Literacy`) ในหมวด 3",
      flowRoleEN: "Equips learners with full 6-subcomponent COM-B diagnostics before Section 3 examines personal and organizational Health Literacy.",
      crossLinks: [
        {
          target: "HS1:2",
          labelTH: "HS1 · หมวด 2 (พีระมิดผลกระทบทางสุขภาพของ Frieden)",
          labelEN: "HS1 · Sec 2 (Frieden's Health Impact Pyramid)",
          whyTH: "การปลดล็อก `O-Ph` (โครงสร้างตลาดและสภาพแวดล้อม) สอดคล้องกับฐานพีระมิดของ Frieden ที่เปลี่ยนบริบทให้ทางเลือกปลอดภัยทำได้จริง",
          whyEN: "Unlocking Physical Opportunity (`O-Ph`) mirrors Frieden's context-changing tier.",
        },
        {
          target: "ST1:4",
          labelTH: "ST1 · หมวด 4 (คานงัดเชิงโครงสร้างใต้ภูเขาน้ำแข็ง)",
          labelEN: "ST1 · Sec 4 (Structural Leverage Beneath the Iceberg)",
          whyTH: "การแก้ที่โครงสร้างตลาด (`CDoH`) และวงนอกของ `BCW` คือการแก้ที่ชั้นโครงสร้างใต้ภูเขาน้ำแข็งแทนการโทษตัวบุคคล",
          whyEN: "Addressing commercial market structures applies deep Iceberg leverage instead of blaming individuals.",
        },
      ],
      keywords: [
        { th: "ปัจจัยกำหนดสุขภาพเชิงพาณิชย์", en: "Commercial Determinants of Health (CDoH)" },
        { th: "ตัวแบบ COM-B ครบ 6 องค์ประกอบย่อย", en: "COM-B (C-Ph · C-Ps · O-Ph · O-So · M-Re · M-Au)" },
        { th: "ความเชื่อมั่นในศักยภาพตนเอง", en: "Self-Efficacy (M-Re)" },
        { th: "เศรษฐศาสตร์พฤติกรรมและวงล้อ BCW", en: "Nudge & Behaviour Change Wheel" },
      ],
    },
    "HS4:3": {
      secLabelTH: "หมวดที่ 3 · ความรอบรู้ด้านสุขภาพระดับบุคคลและระดับองค์กร",
      secLabelEN: "Section 3 · Personal & Organizational Health Literacy",
      titleTH: "สมรรถนะ 4 ขั้นใน 3 บริบทของ Sørensen ควบคู่ความรับผิดชอบขององค์กรตามนิยาม CDC 2020",
      titleEN: "Sørensen's 4 Competences × 3 Domains Paired with CDC 2020 Organizational Responsibility",
      summaryTH: "ความรอบรู้ด้านสุขภาพไม่ใช่ภาระของประชาชนฝ่ายเดียว แต่องค์กรและระบบต้องสื่อสารอย่างเข้าใจง่ายและเอื้ออย่างเป็นธรรมให้ทั้งผู้ผลิตและผู้บริโภคตัดสินใจบนฐานข้อมูลที่ถูกต้อง",
      summaryEN: "Health literacy is a shared responsibility: personal competences thrive only when organizations equitably enable clear communication and informed choices.",
      bullets: [
        {
          th: "<strong>สมรรถนะ 4 ขั้น × 3 บริบท (`Sørensen et al., 2012`) และ 3 ระดับของ `Nutbeam`:</strong> บุคคลเข้าถึง (`access`) เข้าใจ (`understand`) ประเมิน (`appraise`) และนำไปใช้ (`apply`) ข้อมูลสุขภาพทั้งในบริบทการรักษา การป้องกันโรค และการสร้างเสริมสุขภาพ ตั้งแต่ระดับพื้นฐาน ปฏิสัมพันธ์ ไปจนถึงระดับวิจารณญาณ (`critical health literacy`)",
          en: "<strong>Sørensen's 4 Competences & Nutbeam's 3 Tiers:</strong> Spans accessing, understanding, appraising, and applying health information across care, prevention, and promotion—up to critical health literacy.",
        },
        {
          th: "<strong>ความรอบรู้ระดับองค์กร (`CDC, 2020`) และหลักฐานเชิงสหสัมพันธ์:</strong> องค์กรมีหน้าที่เอื้ออย่างเป็นธรรม (`equitably enable`) ให้ผู้คนใช้ข้อมูลได้จริง ทั้งนี้ความรอบรู้ต่ำมีความสัมพันธ์เชิงสังเกตการณ์กับการใช้ห้องฉุกเฉิน การนอนโรงพยาบาล และค่าใช้จ่ายระบบที่สูงขึ้นราว `3–5%`",
          en: "<strong>Organizational Health Literacy & System Evidence:</strong> Organizations must equitably enable navigation and informed action; low health literacy associates observationally with higher ED/inpatient use and ~3–5% added system costs.",
        },
      ],
      caseLensTH: "เชื่อมโยงในกรณีศึกษาได้ทั้งสองฝั่ง: การสื่อสารข้อมูลพิษภัยและวิถีปฏิบัติที่ชัดเจนช่วยยกระดับทักษะและความรอบรู้ด้านสุขภาพของกลุ่มเสี่ยง ขณะที่การสื่อสารสาธารณะให้ผู้บริโภคเข้าใจคุณค่าของผลิตภัณฑ์ปลอดภัยช่วยปรับอุปสงค์ของตลาด",
      caseLensEN: "Apply health literacy on both sides of a case: clear risk communication builds personal appraisal skills among producers/patients, while public communication reshapes consumer demand.",
      flowRoleTH: "เชื่อมสมรรถนะการใช้ข้อมูลของประชาชนและองค์กรในหมวด 3 เข้าสู่กรอบปฏิบัติการระดับสังคม คือ 'กลยุทธ์การสร้างเสริมสุขภาพ 5 ด้านตามกฎบัตรออตตาวา' ในหมวด 4",
      flowRoleEN: "Bridges personal and organizational health literacy to macro-level population empowerment via the Ottawa Charter's 5 Action Areas in Section 4.",
      crossLinks: [
        {
          target: "HS3:2",
          labelTH: "HS3 · หมวด 2 (ลดอุปสรรคด้านข้อมูลและวัฒนธรรมเพื่อความเป็นธรรม)",
          labelEN: "HS3 · Sec 2 (Information & Cultural Equity)",
          whyTH: "องค์กรรอบรู้ด้านสุขภาพช่วยลดอุปสรรคการเข้าถึงที่ไม่ใช่ตัวเงิน ทำให้บริการมีความเป็นธรรมจริง",
          whyEN: "Organizational health literacy lowers non-financial navigation barriers to equitable care.",
        },
        {
          target: "HS5:5",
          labelTH: "HS5 · หมวด 5 (บริการปฐมภูมิที่สื่อสารต่อเนื่องยึดคนเป็นศูนย์กลาง)",
          labelEN: "HS5 · Sec 5 (People-Centered Primary Care)",
          whyTH: "ความสัมพันธ์ต่อเนื่องกับทีมปฐมภูมิช่วยเสริมความรอบรู้ด้านสุขภาพและการดูแลตนเองของผู้ป่วย",
          whyEN: "Longitudinal primary care relationships strengthen patient health literacy and self-management.",
        },
      ],
      keywords: [
        { th: "ความรอบรู้ด้านสุขภาพส่วนบุคคลและองค์กร", en: "Personal & Organizational Health Literacy" },
        { th: "เข้าถึง · เข้าใจ · ประเมิน · นำไปใช้", en: "Access · Understand · Appraise · Apply" },
        { th: "ความรอบรู้เชิงวิจารณญาณ", en: "Critical Health Literacy" },
      ],
    },
    "HS4:4": {
      secLabelTH: "หมวดที่ 4 · การสร้างเสริมสุขภาพและกลยุทธ์ 5 ด้านของกฎบัตรออตตาวา",
      secLabelEN: "Section 4 · Health Promotion: Ottawa's 5 Action Areas, Shanghai & Geneva",
      titleTH: "จำแนกครบ 5 ด้านปฏิบัติการและ 3 ยุทธศาสตร์ของกฎบัตรออตตาวา (1986) สู่เซี่ยงไฮ้ (2016) และเจนีวา (2021)",
      titleEN: "Mastering All 5 Action Areas & 3 Strategies of the Ottawa Charter Through Geneva's Well-Being Societies",
      summaryTH: "การสร้างเสริมสุขภาพคือกระบวนการเสริมพลังให้ผู้คนและชุมชนควบคุมปัจจัยกำหนดสุขภาพได้มากขึ้น ผ่านการขับเคลื่อนประสานกันครบทั้งห้าด้านปฏิบัติการของกฎบัตรออตตาวา",
      summaryEN: "Health promotion empowers people and communities to increase control over health determinants by orchestrating all five action areas of the Ottawa Charter.",
      bullets: [
        {
          th: "<strong>จำแนกครบ 5 ด้านปฏิบัติการของกฎบัตรออตตาวา (`Ottawa Charter 5 Action Areas`, 1986) ให้แม่นยำ:</strong> <strong>(1) `Build Healthy Public Policy`</strong> (สร้างนโยบายสาธารณะเพื่อสุขภาพ เช่น กฎหมาย ภาษีน้ำตาล หรือมาตรการรัฐ–เอกชนจัดตั้งกลไกรับซื้อในราคาที่เป็นธรรม) · <strong>(2) `Create Supportive Environments`</strong> (สร้างสิ่งแวดล้อมทางกายภาพ เศรษฐกิจ และค่านิยมตลาดที่เอื้อให้ทางเลือกที่ปลอดภัยทำได้ง่ายและอยู่รอดได้จริง) · <strong>(3) `Strengthen Community Actions`</strong> (เสริมความเข้มแข็งของชุมชน เช่น การรวมกลุ่มเครือข่ายแลกเปลี่ยนเรียนรู้ ช่วยเหลือกัน และสร้างอำนาจต่อรอง) · <strong>(4) `Develop Personal Skills`</strong> (พัฒนาทักษะส่วนบุคคลและให้ความรู้เพื่อตัดสินใจดูแลตนเอง) · และ <strong>(5) `Reorient Health Services`</strong> (ปรับบริการสุขภาพจากตั้งรับในโรงพยาบาลสู่การคัดกรองเชิงรุกและทำงานร่วมกับชุมชน/ภาคส่วนอื่น)",
          en: "<strong>All 5 Ottawa Charter Action Areas:</strong> (1) Build Healthy Public Policy (fiscal/market/regulatory policies); (2) Create Supportive Environments (making healthy, safe choices economically viable and easy); (3) Strengthen Community Actions (collective organization, peer learning, bargaining power); (4) Develop Personal Skills (knowledge & practical skills); and (5) Reorient Health Services (proactive community prevention beyond curative clinics).",
        },
        {
          th: "<strong>3 บทบาทหลักของบุคลากรสุขภาพ (`Advocate · Mediate · Enable`) สู่เซี่ยงไฮ้ (2016) และเจนีวา (2021):</strong> ชี้นำผลักดันนโยบาย ไกล่เกลี่ยผลประโยชน์ข้ามภาคส่วน และเสริมพลังประชาชน เชื่อมต่อสู่ 3 เสาหลักเซี่ยงไฮ้ (`Good Governance · Healthy Cities · Health Literacy`) และ `Well-being Societies` ตามกฎบัตรเจนีวา",
          en: "<strong>Advocate · Mediate · Enable to Well-Being Societies:</strong> Health professionals advocate, mediate across sectors, and enable communities—advancing Shanghai's 3 pillars and Geneva's equitable, sustainable Well-being Societies.",
        },
      ],
      caseLensTH: "ในการตอบโจทย์ความสอดคล้องกับกฎบัตรออตตาวา ให้ระบุชื่อกลยุทธ์ทั้งภาษาไทย/อังกฤษให้ตรงทั้ง 5 ด้าน แล้วเชื่อมเหตุการณ์ในโจทย์แยกกันอย่างชัดเจน (เช่น นโยบายรัฐ–เอกชนตั้งกลไกราคาเป็นธรรม = `Build Healthy Public Policy`; ระบบตลาดทางเลือกและค่านิยมผู้บริโภคที่ขจัดกำแพงเศรษฐกิจ = `Create Supportive Environments`; การรวมกลุ่มสร้างอำนาจต่อรอง = `Strengthen Community Actions`; ให้ความรู้โทษภัยและทางเลือก = `Develop Personal Skills`; ลงพื้นที่คัดกรองเชิงรุก = `Reorient Health Services`)",
      caseLensEN: "When mapping interventions to the Ottawa Charter, explicitly name at least 3–5 distinct Action Areas and pair each with its specific mechanism from the case (policy/pricing rules → Healthy Public Policy; alternative market & consumer norms → Supportive Environments; collective peer groups → Community Action; risk/skill education → Personal Skills; proactive field screening → Reorient Health Services).",
      flowRoleTH: "ปิดท้ายบท HS4 ด้วยยุทธศาสตร์การสร้างเสริมสุขภาพครบ 5 ด้าน เพื่อส่งต่อสู่ HS5 ว่า 'ระบบสุขภาพปฐมภูมิ (PHC)' จะบูรณาการสิ่งนี้เข้ากับบริการด่านหน้าอย่างไร",
      flowRoleEN: "Culminates HS4 with all 5 Ottawa Action Areas, setting up HS5 on how Primary Health Care operationalizes multisectoral action and community empowerment.",
      crossLinks: [
        {
          target: "HS1:2",
          labelTH: "HS1 · หมวด 2 (ปัจจัยกำหนดสุขภาพทางสังคม SDH)",
          labelEN: "HS1 · Sec 2 (Social Determinants of Health)",
          whyTH: "นโยบายสาธารณะเพื่อสุขภาพและสิ่งแวดล้อมที่เอื้อต่อสุขภาพคือเครื่องมือหลักในการแก้ปัจจัยต้นน้ำของ `SDH` และ `CDoH`",
          whyEN: "Healthy Public Policy and Supportive Environments directly reshape structural and commercial determinants.",
        },
        {
          target: "HS5:4",
          labelTH: "HS5 · หมวด 4 (ปฏิญญาแอสทานาเชื่อมปฐมภูมิ นโยบายข้ามภาคส่วน และชุมชน)",
          labelEN: "HS5 · Sec 4 (Astana Multisectoral PHC)",
          whyTH: "การปรับระบบบริการสู่การสร้างเสริมสุขภาพ (`Reorient Health Services`) มีระบบสุขภาพปฐมภูมิเป็นกลไกหลักในพื้นที่",
          whyEN: "Reorienting health services toward health promotion is anchored in frontline Primary Health Care.",
        },
      ],
      keywords: [
        { th: "กฎบัตรออตตาวา 5 ด้านปฏิบัติการ", en: "Ottawa Charter 5 Action Areas" },
        { th: "ชี้นำผลักดัน · ไกล่เกลี่ย · เสริมพลัง", en: "Advocate · Mediate · Enable" },
        { th: "สามเสาหลักเซี่ยงไฮ้และกฎบัตรเจนีวา", en: "Shanghai 3 Pillars & Geneva Charter" },
      ],
    },
    "HS4:sum": {
      secLabelTH: "บทสรุป · เช็กลิสต์สังเคราะห์ก่อนทำ Case Discussion HS4 & Open Note",
      secLabelEN: "Synthesis · HS4 Case Discussion & Open-Note Readiness",
      titleTH: "ร้อยเรียงการนิยามพฤติกรรมเป้าหมาย การวินิจฉัย COM-B 6 มิติย่อย และการขับเคลื่อนกฎบัตรออตตาวา 5 ด้าน",
      titleEN: "Uniting Target-Behavior Specification, 6-Subcomponent COM-B, and 5 Ottawa Action Areas",
      summaryTH: "ระบุพฤติกรรมเป้าหมายให้เป็นการกระทำที่ชัดเจน ปลดล็อกอุปสรรคเชิงพาณิชย์และจิตสังคมครบหกมิติย่อยของ COM-B และขับเคลื่อนครบห้ากลยุทธ์ของกฎบัตรออตตาวา คือสูตรสำเร็จของ HS4",
      summaryEN: "Specifying observable target behaviors, unlocking all 6 COM-B sub-components under CDoH constraints, and applying Ottawa's 5 Action Areas complete the HS4 analytical workflow.",
      bullets: [
        {
          th: "<strong>เช็กลิสต์พร้อมตอบครบทั้ง 3 ประเด็นของกรณีศึกษา HS4:</strong> (1) แยก `Problem Behavior` กับ `Target Behavior` เป็นการกระทำที่สังเกตได้ (ไม่ใช่ค่าผลเลือด) (2) จับคู่มาตรการเข้ากับ `COM-B` ทั้งองค์ประกอบหลักและย่อย (`C-Ph, C-Ps, O-Ph, O-So, M-Re, M-Au`) โดยเห็นรากปัญหา `CDoH` และ (3) เชื่อมโยงมาตรการเข้ากับ `5 Action Areas` ของกฎบัตรออตตาวาพร้อมเหตุผลเชิงกลไก",
          en: "<strong>Complete HS4 Case Toolkit:</strong> (1) Contrast observable Problem vs. Target Behavior; (2) map interventions precisely across COM-B's 6 sub-components (`C-Ph, C-Ps, O-Ph, O-So, M-Re, M-Au`); and (3) justify alignment with Ottawa Charter's 5 Action Areas.",
        },
      ],
      caseLensTH: "ทบทวนเร็ว 3 ขั้นก่อนเข้าห้องอภิปราย HS4: ขั้นที่ 1 'ใครเปลี่ยนจากการทำอะไรไปทำอะไร' → ขั้นที่ 2 'มาตรการไปเสริม C-Ps, O-Ph, O-So, M-Re หรือ M-Au อย่างไรจึงไม่ต้องสู้ลำพังกับตลาดเดิม' → ขั้นที่ 3 'ตรงกับ Build Healthy Public Policy, Create Supportive Environments, Strengthen Community Actions, Develop Personal Skills และ Reorient Health Services อย่างไร'",
      caseLensEN: "3-step HS4 case drill: (1) Who changes from what action to what action? → (2) How do interventions unlock C-Ps, O-Ph, O-So, M-Re, and M-Au? → (3) How do they operationalize Ottawa's 5 Action Areas?",
      flowRoleTH: "สรุปกลไกพฤติกรรมสุขภาพและการสร้างเสริมสุขภาพใน HS4 เพื่อส่งไม้ต่อสู่ HS5: 'บริการปฐมภูมิ 5 คุณลักษณะและระบบสุขภาพปฐมภูมิ 3 เสาหลักทำงานร่วมกันอย่างไร'",
      flowRoleEN: "Synthesizes HS4 and hands off to HS5: distinguishing 5-attribute Primary Care from 3-pillar Astana Primary Health Care.",
      crossLinks: [
        {
          target: "HS5:1",
          labelTH: "ต่อยอดสู่ HS5 · หมวด 1 (ระบบสุขภาพปฐมภูมิ PHC vs. PC)",
          labelEN: "Next: HS5 · Sec 1 (PHC vs. Primary Care)",
          whyTH: "ระบบสุขภาพปฐมภูมิ (`PHC`) คือเวทีหลักที่เชื่อมการสร้างเสริมสุขภาพ ชุมชน นโยบายข้ามภาคส่วน และบริการคลินิกเข้าด้วยกัน",
          whyEN: "Primary Health Care is the frontline platform uniting health promotion, community action, and clinical care.",
        },
      ],
      keywords: [
        { th: "ไม่สับสนพฤติกรรมกับผลลัพธ์คลินิก", en: "Behavior ≠ Clinical Outcome" },
        { th: "ปลดล็อก COM-B 6 มิติย่อย", en: "6-Subcomponent COM-B Unlocking" },
        { th: "กฎบัตรออตตาวาครบ 5 ด้าน", en: "5 Ottawa Action Areas" },
      ],
    },

    /* -------------------- HS5: Primary Health Care & Primary Care -------------------- */
    "HS5:1": {
      secLabelTH: "หมวดที่ 1 · ความแตกต่างระหว่าง Primary Health Care (PHC) กับ Primary Care (PC)",
      secLabelEN: "Section 1 · Primary Health Care (PHC) vs. Primary Care (PC)",
      titleTH: "ระบบสุขภาพปฐมภูมิในฐานะยุทธศาสตร์ของทั้งสังคม เทียบกับบริการปฐมภูมิระดับบุคคลและครอบครัว",
      titleEN: "Whole-of-Society Primary Health Care vs. Personal/Clinical Primary Care",
      summaryTH: "บริการปฐมภูมิคือบริการด่านหน้าระดับบุคคลและครอบครัว ส่วนระบบสุขภาพปฐมภูมิคือยุทธศาสตร์ของทั้งสังคมที่หลอมรวมบริการสุขภาพ นโยบายข้ามภาคส่วน และพลังชุมชนเพื่อความเป็นธรรม",
      summaryEN: "Primary Care is first-contact clinical care for individuals and families, whereas Primary Health Care is the whole-of-society strategy uniting health services, multisectoral action, and empowered communities.",
      bullets: [
        {
          th: "<strong>แยกขอบเขตสองคำนี้ไม่ให้สับสนเด็ดขาด:</strong> `Primary Care (PC)` คือการจัดบริการสุขภาพระดับบุคคลและครอบครัวด่านแรก (`personal care`) ส่วน `Primary Health Care (PHC)` (`Alma-Ata 1978` · `Astana 2018`) เป็นแนวทางของทั้งสังคม (`whole-of-society approach`) ที่มีขอบเขตกว้างกว่าคลินิก",
          en: "<strong>Crucial Scope Distinction:</strong> Primary Care (`PC`) delivers first-contact personal/family clinical care, whereas Primary Health Care (`PHC`) is a whole-of-society approach spanning beyond the health sector.",
        },
        {
          th: "<strong>ความสัมพันธ์แบบซ้อนอยู่ข้างใน (`Nested Partnership`):</strong> `Primary Care` ทำหน้าที่เป็นแกนกลางของการจัดบริการสุขภาพภายในเสาที่ 1 ของร่มใหญ่ `Primary Health Care` เพื่อมุ่งสู่สุขภาพดีถ้วนหน้าและลดความเหลื่อมล้ำ",
          en: "<strong>Nested Partnership:</strong> High-performing Primary Care forms the clinical service-delivery core inside the broader Primary Health Care umbrella.",
        },
      ],
      caseLensTH: "โครงสร้างโจทย์ Case Discussion ของ HS5 ออกแบบมาทดสอบเส้นแบ่งนี้โดยตรง: ข้อแรกถามระดับ `Primary Care` (คุณลักษณะบริการระดับบุคคล 5 ประการ) ส่วนข้อที่สองถามระดับ `Primary Health Care` (อีก 2 เสาหลักนอกเหนือจากบริการสุขภาพ)",
      caseLensEN: "HS5's Case Discussion tests this exact boundary: Question 1 evaluates personal-level Primary Care (5 attributes), while Question 2 evaluates the broader non-clinical pillars of Primary Health Care.",
      flowRoleTH: "วางนิยามแม่บท `PHC` เทียบกับ `PC` ก่อนชี้ให้เห็นความท้าทายจากการเปลี่ยนผ่านภาระโรคและกับดักการยึดโรงพยาบาลเป็นศูนย์กลางในหมวด 2",
      flowRoleEN: "Clarifies PHC vs. PC before Section 2 examines how aging, multimorbidity, and hospital-centrism strain frontline care.",
      crossLinks: [
        {
          target: "HS2:1",
          labelTH: "HS2 · หมวด 1 (ขอบเขตกว้างของระบบสุขภาพ)",
          labelEN: "HS2 · Sec 1 (Broad Health System Scope)",
          whyTH: "แนวคิด `PHC` สอดรับกับขอบเขตระบบสุขภาพแบบกว้างที่รวมการทำงานร่วมกับชุมชนและภาคส่วนอื่น",
          whyEN: "PHC mirrors HS2's broad primary-intent health system boundary.",
        },
      ],
      keywords: [
        { th: "ระบบสุขภาพปฐมภูมิ (ทั้งสังคม)", en: "Primary Health Care (Whole-of-Society)" },
        { th: "บริการปฐมภูมิ (ระดับบุคคล)", en: "Primary Care (Personal Care)" },
        { th: "คำประกาศอัลมา-อาตา ค.ศ. 1978", en: "Declaration of Alma-Ata (1978)" },
      ],
    },
    "HS5:2": {
      secLabelTH: "หมวดที่ 2 · การเปลี่ยนผ่านภาระโรคและกับดักการยึดโรงพยาบาลเป็นศูนย์กลาง",
      secLabelEN: "Section 2 · Epidemiological Shifts & Hospital-Centrism",
      titleTH: "จากบริการแบบเลือกเฉพาะโรค สู่การดูแลรอบด้านและการทลายวงจรป่วยซ้ำของกลุ่มเปราะบาง",
      titleEN: "Overcoming Selective Silos, Hospital-Centrism, and Revolving-Door Readmissions",
      summaryTH: "เมื่อทรัพยากรกระจุกตัวที่โรงพยาบาลใหญ่และตั้งรับรอเฉพาะผู้มีเอกสารสิทธิครบ กลุ่มเปราะบางและผู้ป่วยโรคร่วมย่อมหลุดออกจากระบบและวนกลับมานอนโรงพยาบาลซ้ำไม่รู้จบ",
      summaryEN: "When resources concentrate in passive hospitals, multimorbid and socially vulnerable patients fall through the cracks into a cycle of avoidable readmissions.",
      bullets: [
        {
          th: "<strong>ก้าวข้าม `Selective PHC` สู่การดูแลรอบด้าน (`Comprehensive`):</strong> สังคมสูงวัย ภาวะโรคร่วมหลายโรค (`multimorbidity`) และความเปราะบางทางจิตสังคม ไม่อาจแก้ด้วยโปรแกรมแยกเฉพาะโรคหรือการจ่ายยาเฉพาะหน้าเพียงอย่างเดียว",
          en: "<strong>Beyond Selective Silos:</strong> Aging populations, multimorbidity, and psychosocial vulnerability require comprehensive care rather than narrow vertical programs.",
        },
        {
          th: "<strong>แก้พีระมิดหัวกลับ (`Hospital-centrism`) และวงจรป่วยซ้ำหลังจำหน่าย (`Revolving-door readmission`):</strong> การรักษาในโรงพยาบาลเพียงอย่างเดียวแล้วส่งผู้ป่วยกลับสู่สภาพแวดล้อมที่ไม่ปลอดภัยทำให้ติดเชื้อหรืออาการทรุดซ้ำ จึงต้องลงทุนระบบปฐมภูมิและการพักฟื้นเชื่อมรอยต่อในชุมชน",
          en: "<strong>Break Hospital-Centrism & Readmission Loops:</strong> Discharging vulnerable patients without community primary care and safe sub-acute recovery fuels costly revolving-door hospitalizations.",
        },
      ],
      caseLensTH: "ช่วยอ่านบริบทต้นเรื่องของกรณีศึกษาว่าเหตุใดการตั้งรับในโรงพยาบาลจึงล้มเหลวต่อกลุ่มเปราะบาง (เช่น กำแพงเอกสาร/บัตรประชาชน ความกลัวสถานที่ราชการ และการขาดที่พักฟื้นที่ถูกสุขลักษณะหลัง `Hospital discharge` จนเกิดวงจรป่วยซ้ำ)",
      caseLensEN: "Illuminates why passive hospital care fails marginalized groups facing ID/entitlement barriers, institutional distrust, and unsafe post-discharge environments.",
      flowRoleTH: "ชี้จุดอ่อนของการแยกส่วนและการยึดโรงพยาบาลเป็นศูนย์กลาง เพื่อนำไปสู่ข้อเสนอการปฏิรูป PHC 4 ด้านของ WHO (2008) ในหมวด 3",
      flowRoleEN: "Diagnoses fragmentation and hospital-centrism, motivating WHO's 2008 four-pillar PHC reforms in Section 3.",
      crossLinks: [
        {
          target: "ST1:3",
          labelTH: "ST1 · หมวด 3 (วงจรอุบาทว์ความแออัดโรงพยาบาล)",
          labelEN: "ST1 · Sec 3 (Hospital Crowding Loop)",
          whyTH: "การยึดโรงพยาบาลเป็นศูนย์กลางทำให้ด่านหน้าปฐมภูมิอ่อนแอและผลักผู้ป่วยกลับไปแออัดซ้ำในโรงพยาบาล",
          whyEN: "Underfunding frontline and transitional community care drives recurrent hospital crowding.",
        },
        {
          target: "HS3:4",
          labelTH: "HS3 · หมวด 4 (ประสิทธิภาพการจัดสรร Allocative Efficiency)",
          labelEN: "HS3 · Sec 4 (Allocative Efficiency)",
          whyTH: "การลงทุนในปฐมภูมิและบริการพักฟื้นกึ่งเฉียบพลันในชุมชนคุ้มค่ากว่าการปล่อยให้ผู้ป่วยกลับมานอนโรงพยาบาลซ้ำ",
          whyEN: "Investing in comprehensive primary and transitional care improves system-wide allocative efficiency.",
        },
      ],
      keywords: [
        { th: "การยึดโรงพยาบาลเป็นศูนย์กลาง", en: "Hospital-Centrism" },
        { th: "วงจรการเจ็บป่วยและนอนโรงพยาบาลซ้ำ", en: "Revolving-Door Readmission" },
        { th: "ปฐมภูมิแบบรอบด้านเทียบกับเฉพาะโรค", en: "Comprehensive vs. Selective PHC" },
      ],
    },
    "HS5:3": {
      secLabelTH: "หมวดที่ 3 · การปฏิรูประบบสุขภาพปฐมภูมิ 4 ด้าน (WHR 2008)",
      secLabelEN: "Section 3 · World Health Report 2008 Four PHC Reforms",
      titleTH: "หลักประกันถ้วนหน้า บริการยึดคนเป็นศูนย์กลาง นโยบายสาธารณะ และภาวะผู้นำแบบมีส่วนร่วม",
      titleEN: "UHC, People-Centered Service Delivery, Public Policy, and Inclusive Leadership",
      summaryTH: "ปฐมภูมิที่เข้มแข็งต้องปฏิรูปประสานกันทั้งสี่ด้าน คือลดกำแพงสิทธิด้วยหลักประกันถ้วนหน้า จัดบริการยึดคนเป็นศูนย์กลางโดยมีปฐมภูมิเป็นตัวเชื่อม ขับเคลื่อนนโยบายสาธารณะ และนำแบบมีส่วนร่วม",
      summaryEN: "Strong PHC synchronizes four reforms: universal coverage for equity, people-centered care with primary care as hub, healthy public policies, and inclusive leadership.",
      bullets: [
        {
          th: "<strong>4 เสาการปฏิรูป `WHR 2008`:</strong> (1) ปฏิรูปหลักประกันถ้วนหน้า (`UHC`) ลดความเหลื่อมล้ำด้านสิทธิ (2) ปฏิรูปบริการให้ยึดคนเป็นศูนย์กลางและวางปฐมภูมิเป็นศูนย์กลางประสานงาน (`Coordination hub`) (3) ปฏิรูปนโยบายสาธารณะเชื่อมสุขภาพในทุกนโยบาย และ (4) ปฏิรูปภาวะผู้นำสู่การทำงานร่วมกับภาคประชาสังคมและชุมชน",
          en: "<strong>Four Interlocking Reforms (WHR 2008):</strong> Universal coverage reforms, people-centered delivery with primary care as coordination hub, healthy public policy reforms, and inclusive collaborative leadership.",
        },
      ],
      caseLensTH: "ชี้ให้เห็นว่าการพากลุ่มเปราะบางที่ตกหล่นทางทะเบียนราษฎรกลับเข้าสู่สิทธิหลักประกันสุขภาพ ควบคู่กับการตั้งจุดประสานงานกลาง (`Hub`) ร่วมกับมูลนิธิภาคประชาสังคม คือการเดินเครื่องปฏิรูป WHR 2008 ในชีวิตจริง",
      caseLensEN: "Shows how restoring legal ID/insurance entitlements while building a collaborative NGO–clinician coordination hub operationalizes WHR 2008 reforms.",
      flowRoleTH: "วางกรอบการปฏิรูป 4 ด้านของปี 2008 ก่อนต่อยอดสู่กรอบมาตรฐานสากลฉบับปัจจุบันคือ '3 องค์ประกอบหลักตามปฏิญญาแอสทานา ค.ศ. 2018' ในหมวด 4",
      flowRoleEN: "Sets out WHO 2008's four reform pillars, leading directly into the 2018 Astana 3-component framework in Section 4.",
      crossLinks: [
        {
          target: "HS6:1",
          labelTH: "HS6 · หมวด 1 (หลักประกันสุขภาพถ้วนหน้าคู่โครงสร้างบริการ)",
          labelEN: "HS6 · Sec 1 (UHC + Delivery Infrastructure)",
          whyTH: "การปฏิรูปหลักประกันถ้วนหน้า (`UHC`) และการปฏิรูปบริการปฐมภูมิเป็นสองขาที่ต้องเดินคู่กันเสมอ",
          whyEN: "Universal financial protection and primary-care hub delivery are mutually reinforcing reforms.",
        },
      ],
      keywords: [
        { th: "รายงานอนามัยโลก ค.ศ. 2008", en: "World Health Report 2008" },
        { th: "ศูนย์กลางเชื่อมประสานการดูแล", en: "Primary Care Coordination Hub" },
        { th: "ภาวะผู้นำแบบมีส่วนร่วม", en: "Inclusive Leadership" },
      ],
    },
    "HS5:4": {
      secLabelTH: "หมวดที่ 4 · สามองค์ประกอบหลักของ PHC ตามปฏิญญาแอสทานา ค.ศ. 2018",
      secLabelEN: "Section 4 · Three Components of PHC Under the Declaration of Astana (2018)",
      titleTH: "แยกชัด 3 เสาหลักของ Astana: (1) บริการบูรณาการ PC+EPHFs · (2) นโยบายข้ามภาคส่วน · (3) การเสริมพลังประชาชนและชุมชน",
      titleEN: "Astana's Three Pillars: Integrated Services (PC+EPHFs), Multisectoral Policy & Action, and Empowered Communities",
      summaryTH: "ปฏิญญาแอสทานาทำให้เห็นชัดเจนว่าระบบสุขภาพปฐมภูมิไม่ได้มีแค่บริการคลินิกและสาธารณสุข แต่ต้องมีอีกสองเสาหลักคือนโยบายข้ามภาคส่วนและการเสริมพลังผู้คนและชุมชน",
      summaryEN: "The Astana Declaration defines PHC through three co-equal pillars: integrated primary care and public health functions, multisectoral policy and action, and empowered people and communities.",
      bullets: [
        {
          th: "<strong>เสาหลักที่ 1 — บริการสุขภาพแบบบูรณาการ (`Integrated Health Services`):</strong> ผสานบริการปฐมภูมิระดับบุคคลที่มีคุณภาพ (`Primary Care`) เข้ากับหน้าที่สาธารณสุขที่จำเป็นระดับประชากร (`Essential Public Health Functions: EPHFs`)",
          en: "<strong>Pillar 1 — Integrated Health Services:</strong> Unites personal Primary Care with population-level Essential Public Health Functions (`EPHFs`).",
        },
        {
          th: "<strong>เสาหลักที่ 2 และ 3 (นอกเหนือจากบริการสุขภาพ):</strong> <strong>(2) `Multisectoral Policy and Action` (การมีนโยบายและมาตรการร่วมกับหลากหลายภาคส่วน)</strong> ทำงานร่วมกับภาคส่วนนอกระบบสาธารณสุข (เช่น ทะเบียนราษฎร/บัตรประชาชน องค์กรภาคประชาสังคม โครงการสร้างอาชีพ/รายได้ และโครงการที่อยู่อาศัย) เพื่อจัดการรากเหง้า `SDH` · และ <strong>(3) `Empowered People and Communities` (การเสริมพลังประชาชนและชุมชน)</strong> ฟื้นฟูความไว้วางใจและพลังใจให้ผู้รับบริการและชุมชนเข้ามามีส่วนร่วมดูแลสุขภาวะและพึ่งพาตนเองได้อย่างยั่งยืน",
          en: "<strong>Pillars 2 & 3 (Beyond Health Services):</strong> (2) Multisectoral Policy and Action addresses upstream social/economic determinants (legal ID, employment, housing) with non-health partners; (3) Empowered People and Communities builds trust, agency, and self-reliance.",
        },
      ],
      caseLensTH: "จุดออกสอบตรง ๆ ใน Case Discussion HS5 ข้อที่ 2: เมื่อโจทย์ถามว่า 'นอกเหนือจาก Primary Care และ EPHFs แล้ว โครงการสอดคล้องกับองค์ประกอบหลักอื่นของ PHC อย่างไร' ต้องระบุชื่ออีก 2 เสาหลักของ Astana ให้เป๊ะ คือ `1) Empowered People and Communities` และ `2) Multisectoral Policy and Action` พร้อมยกกิจกรรมรูปธรรม (เช่น การฟื้นพลังใจให้ดูแลตนเองได้ vs การร่วมกับมูลนิธิ/หน่วยงานแก้เรื่องบัตรประชาชน งานสร้างรายได้ และที่อยู่อาศัย)",
      caseLensEN: "Direct HS5 Case Discussion target: when asked which PHC pillars apply *beyond* Primary Care & EPHFs, explicitly name (1) `Empowered People and Communities` and (2) `Multisectoral Policy and Action`, backing each with concrete social/community interventions.",
      flowRoleTH: "จากเสาหลักที่ 1 ของแอสทานา จึงแตกออกเป็น 2 หมวดถัดไปอย่างเป็นระบบ คือ 'คุณลักษณะบริการปฐมภูมิระดับบุคคล 5 ประการ' (หมวด 5) และ 'หน้าที่สาธารณสุขระดับประชากร EPHFs' (หมวด 6)",
      flowRoleEN: "Unpacks Astana's first pillar directly into Section 5 (5-attribute personal Primary Care) and Section 6 (population-level EPHFs).",
      crossLinks: [
        {
          target: "HS4:4",
          labelTH: "HS4 · หมวด 4 (กฎบัตรออตตาวาและการเสริมพลังชุมชน)",
          labelEN: "HS4 · Sec 4 (Ottawa Charter Empowerment)",
          whyTH: "เสาหลักที่ 2 และ 3 ของแอสทานาสอดประสานเป็นเนื้อเดียวกับยุทธศาสตร์การสร้างเสริมสุขภาพของกฎบัตรออตตาวา",
          whyEN: "Astana's multisectoral and community-empowerment pillars align directly with HS4's Ottawa Charter.",
        },
      ],
      keywords: [
        { th: "ปฏิญญาแอสทานา 3 องค์ประกอบหลัก", en: "Astana 3 Components of PHC (2018)" },
        { th: "นโยบายและการกระทำข้ามภาคส่วน", en: "Multisectoral Policy and Action" },
        { th: "การเสริมพลังประชาชนและชุมชน", en: "Empowered People and Communities" },
      ],
    },
    "HS5:5": {
      secLabelTH: "หมวดที่ 5 · คุณลักษณะหลักครบ 5 ประการของบริการปฐมภูมิที่ดี (4Cs + Person-Centeredness)",
      secLabelEN: "Section 5 · Five Core Attributes of High-Quality Personal / Primary Care",
      titleTH: "วิเคราะห์ครบ 5 คุณลักษณะบริการระดับบุคคล: ด่านแรก · รอบด้าน · ต่อเนื่อง · ประสานการดูแล · ยึดคนเป็นศูนย์กลาง",
      titleEN: "First-Contact, Comprehensive, Continuous, Coordinated, and Person-Centered Care",
      summaryTH: "บริการปฐมภูมิระดับบุคคลที่มีคุณภาพต้องครบทั้งห้าคุณลักษณะ ตั้งแต่การเข้าถึงด่านแรกโดยไร้กำแพง ไปจนถึงการดูแลต่อเนื่องข้ามรอยต่อหลังออกจากโรงพยาบาลด้วยความเข้าใจศักดิ์ศรีความเป็นมนุษย์",
      summaryEN: "High-quality personal primary care unites five attributes: barrier-free first contact, whole-person comprehensiveness, 3D continuity across hospital transitions, cross-sector coordination, and non-stigmatizing person-centeredness.",
      bullets: [
        {
          th: "<strong>จำแนกครบทั้ง 5 คุณลักษณะของบริการสุขภาพระดับบุคคล (`Characteristics of Personal / Primary Care`):</strong> <strong>(1) `First-Contact Accessibility` (ด่านแรกเข้าถึงได้จริง)</strong> จัดบริการเชิงรุกในจุดที่กลุ่มเป้าหมายเข้าถึงสะดวกโดยไม่ปฏิเสธแม้ขาดเอกสาร พร้อมช่วยทลายกำแพงบัตรประชาชนและขึ้นทะเบียนสิทธิ · <strong>(2) `Comprehensiveness` (ครอบคลุมรอบด้าน)</strong> ดูแลครบทั้งคัดกรอง/รักษาเบื้องต้น สุขภาพจิตและบาดแผลจิตสังคม การพักฟื้นกึ่งเฉียบพลัน และการเชื่อมสวัสดิการสังคม",
          en: "<strong>Attributes 1 & 2 (First-Contact & Comprehensiveness):</strong> Proactive, barrier-free first contact (including outreach at community hubs and restoring legal ID/insurance rights) paired with comprehensive physical, psychological, sub-acute, and social care.",
        },
        {
          th: "<strong>ความต่อเนื่อง 3 มิติ (`Continuity`) และการประสานไร้รอยต่อ (`Coordination`):</strong> <strong>(3) `Continuity of Care`</strong> ครอบคลุมทั้งความต่อเนื่องด้านความสัมพันธ์ (`Relational`), แผนการดูแลข้ามระยะโรค (`Management` เช่น บ้านพักพิงทางการแพทย์ชั่วคราว `Medical Respite Care` รับช่วงต่อหลังออกจากโรงพยาบาลเพื่อสกัดวงจรติดเชื้อ/ป่วยซ้ำ), และข้อมูล (`Informational`) · <strong>(4) `Coordination of Care`</strong> ทำหน้าที่เป็นศูนย์กลาง (`Hub`) ประสานทั้งภายในระบบสุขภาพและข้ามภาคส่วน (`Cross-sectoral`) ลดความเสี่ยงช่วงเปลี่ยนผ่านจุดดูแล (`Care transition`)",
          en: "<strong>Attributes 3 & 4 (Continuity & Coordination):</strong> Continuity spans relational trust, longitudinal management across post-discharge transitions (e.g., Medical Respite Care preventing readmission), and shared information; Coordination acts as the hub linking hospitals with social/housing/employment agencies.",
        },
        {
          th: "<strong>คุณลักษณะที่ 5 — `Person-Centeredness` (การยึดผู้รับบริการ/คนเป็นศูนย์กลาง):</strong> เคารพศักดิ์ศรีความเป็นมนุษย์ เข้าใจความระแวงและบาดแผลทางจิตสังคม สร้างพื้นที่ปลอดภัยในการรับฟังอย่างไม่ตีตรา (เช่น ใช้กิจกรรมบำบัดสร้างความไว้วางใจ) และออกแบบบริการให้สอดคล้องกับบริบทชีวิตจริงของผู้รับบริการ",
          en: "<strong>Attribute 5 (Person-Centeredness):</strong> Honors human dignity and psychosocial context—building non-judgmental trust (e.g., through music/psychosocial therapy) and co-designing care around people's lived realities.",
        },
      ],
      caseLensTH: "ในการตอบตาราง Case Discussion HS5 ข้อที่ 1 ต้องวิเคราะห์ให้ครบทั้ง **5 คุณลักษณะ** (`First-Contact`, `Comprehensiveness`, `Continuity`, `Coordination`, `Person-Centeredness`) โดยชี้ความแตกต่างให้ชัด เช่น บ้านพักพิงพักฟื้น 2–4 สัปดาห์หลังออกจาก รพ. จนส่งต่อที่พักยั่งยืน สะท้อน `Continuity` (สกัดวงจร Readmission) ส่วนการเป็นศูนย์กลางเชื่อม รพ. กับมูลนิธิด้านบัตรประชาชน อาชีพ และที่อยู่อาศัย สะท้อน `Coordination`",
      caseLensEN: "In HS5 Question 1, analyze all **5 attributes** distinctly—highlighting how post-discharge Medical Respite Care sustains `Continuity` against readmission, whereas acting as a hub linking hospitals with ID, job, and housing partners exemplifies `Coordination`.",
      flowRoleTH: "เจาะลึกขาที่ 1 ของบริการบูรณาการ (ดูแลระดับบุคคลครบ 5 คุณลักษณะ) ก่อนเติมขาที่ 2 คือการคุ้มครองระดับประชากร (`EPHFs`) ในหมวด 6",
      flowRoleEN: "Details the 5-attribute personal clinical leg before pairing it with the population public-health leg (`EPHFs`) in Section 6.",
      crossLinks: [
        {
          target: "HS2:5",
          labelTH: "HS2 · หมวด 5 (ระดับบริการและรูปแบบการดูแล 6W)",
          labelEN: "HS2 · Sec 5 (Levels & 6W Models of Care)",
          whyTH: "คุณลักษณะทั้ง 5 ประการทำให้นวัตกรรมบริการปฐมภูมิเชื่อมต่อจากหอผู้ป่วยในสู่การฟื้นฟูในชุมชนได้จริง",
          whyEN: "The 5 attributes operationalize seamless transitions from acute hospital wards back to community living.",
        },
        {
          target: "HS6:4",
          labelTH: "HS6 · หมวด 4 (การจ่ายเหมาจ่ายรายหัว Capitation แก่ด่านหน้า)",
          labelEN: "HS6 · Sec 4 (Capitation for Gatekeepers)",
          whyTH: "การจ่ายงบเหมาจ่ายรายหัวตามประชากรขึ้นทะเบียนใน HS6 ออกแบบมาเพื่อหนุนหน่วยบริการด่านหน้าตามหลักบริการปฐมภูมิ",
          whyEN: "Population-based capitation in HS6 financially supports registered primary care gatekeepers.",
        },
      ],
      keywords: [
        { th: "คุณลักษณะบริการปฐมภูมิครบ 5 ประการ", en: "5 Attributes (4Cs + Person-Centeredness)" },
        { th: "ความต่อเนื่อง 3 มิติและรอยต่อการดูแล", en: "3D Continuity & Care Transitions" },
        { th: "บ้านพักพิงทางการแพทย์ระยะพักฟื้น", en: "Medical Respite / Sub-Acute Care" },
      ],
    },
    "HS5:6": {
      secLabelTH: "หมวดที่ 6 · หน้าที่ด้านสาธารณสุขที่จำเป็น (EPHFs) ในระบบปฐมภูมิ",
      secLabelEN: "Section 6 · Essential Public Health Functions (EPHFs) in PHC",
      titleTH: "การเฝ้าระวัง คุ้มครอง สร้างเสริม ป้องกัน และเตรียมพร้อมรับภัยสุขภาพระดับประชากร",
      titleEN: "Population Surveillance, Health Protection, Promotion, and Emergency Readiness",
      summaryTH: "คลินิกปฐมภูมิจะสมบูรณ์ได้เมื่อผสานการดูแลรายบุคคลเข้ากับงานสาธารณสุขระดับประชากร ทั้งการเฝ้าระวังโรค การคุ้มครองสิ่งแวดล้อม และการรับมือภาวะฉุกเฉิน",
      summaryEN: "Primary care fulfills Astana's integrated-service pillar when paired with population surveillance, health protection, prevention, and emergency preparedness.",
      bullets: [
        {
          th: "<strong>ผสานงานคลินิกรายบุคคล (`PC`) เข้ากับสาธารณสุขระดับประชากร (`EPHFs`):</strong> ครอบคลุมการเฝ้าระวังทางระบาดวิทยา การคุ้มครองสุขภาพและอนามัยสิ่งแวดล้อม การสร้างเสริมสุขภาพ การป้องกันควบคุมโรค และการเตรียมพร้อมรับภาวะฉุกเฉินในชุมชน",
          en: "<strong>Unite Personal PC with Population EPHFs:</strong> Combines epidemiological surveillance, environmental/occupational protection, health promotion, disease control, and disaster preparedness.",
        },
      ],
      caseLensTH: "ช่วยให้เข้าใจว่าเหตุใดเสาหลักที่ 1 ของปฏิญญา Astana จึงเขียนคู่กันว่า `Primary Care and Essential Public Health Functions` — ดังนั้นเมื่อโจทย์ถามหาองค์ประกอบอื่นนอกเหนือจากคู่นี้ จึงต้องตอบเสาหลักที่ 2 (`Multisectoral Policy & Action`) และเสาหลักที่ 3 (`Empowered People & Communities`)",
      caseLensEN: "Clarifies why Astana groups Primary Care and EPHFs together as Pillar 1—so questions asking for PHC components *beyond* PC & EPHFs point directly to Pillars 2 and 3.",
      flowRoleTH: "เติมเต็มบริการบูรณาการให้ครบทั้งระดับบุคคล (หมวด 5) และระดับประชากร (หมวด 6) ก่อนเชื่อมสู่ระบบหลักประกันและพัฒนาการของไทยในหมวด 7",
      flowRoleEN: "Completes integrated care by joining population EPHFs with 5-attribute personal care before examining Thailand's PHC–UHC evolution in Section 7.",
      crossLinks: [
        {
          target: "HS3:6",
          labelTH: "HS3 · หมวด 6 (ความยืดหยุ่นของระบบสุขภาพยามวิกฤต)",
          labelEN: "HS3 · Sec 6 (Health System Resilience)",
          whyTH: "ระบบเฝ้าระวังและ EPHFs ในพื้นที่ปฐมภูมิคือปราการด่านแรกที่สร้างความยืดหยุ่นของระบบเมื่อเกิดโรคระบาด",
          whyEN: "Community-embedded EPHFs provide the frontline detection and response capacity essential for system resilience.",
        },
      ],
      keywords: [
        { th: "หน้าที่ด้านสาธารณสุขที่จำเป็น", en: "Essential Public Health Functions (EPHFs)" },
        { th: "การเฝ้าระวังทางระบาดวิทยา", en: "Epidemiological Surveillance" },
        { th: "การเตรียมพร้อมรับภาวะฉุกเฉิน", en: "Health Emergency Preparedness" },
      ],
    },
    "HS5:7": {
      secLabelTH: "หมวดที่ 7 · ปัจจัยหนุนเสริม ความเชื่อมโยงกับ UHC และพัฒนาการระบบปฐมภูมิไทย",
      secLabelEN: "Section 7 · Enablers, UHC Synergy, and Thailand's PHC Evolution",
      titleTH: "จากสาธารณสุขมูลฐานและ อสม. สู่ พ.ร.บ.ระบบสุขภาพปฐมภูมิ พ.ศ. 2562 และการถ่ายโอน รพ.สต.",
      titleEN: "From District Networks and VHVs to the 2019 Primary Health Care Act & Decentralization",
      summaryTH: "หลักประกันสุขภาพถ้วนหน้าของไทยเกิดผลจริงได้เพราะมีโครงข่ายปฐมภูมิกระจายทั่วประเทศเป็นฐานรองรับ ขณะที่กลุ่มตกหล่นในเมืองและการกระจายอำนาจต้องการนวัตกรรมการประสานงานเชิงรุก",
      summaryEN: "Thailand's UHC succeeded on the backbone of nationwide district primary care, while urban marginalized groups and decentralization call for proactive coordination.",
      bullets: [
        {
          th: "<strong>`PHC` คือรากฐานที่เปลี่ยนสิทธิ `UHC` บนกระดาษให้เป็นการเข้าถึงจริง:</strong> การลงทุนโรงพยาบาลชุมชน รพ.สต. และ อสม. ต่อเนื่องหลายทศวรรษ ร่วมกับการช่วยทบทวนสิทธิแก่กลุ่มเปราะบางไร้เอกสาร ทำให้ประชาชนเข้าถึงบริการได้จริง",
          en: "<strong>PHC Turns Legal UHC into Real Access:</strong> Nationwide district health networks, VHVs, and proactive civil-registration outreach convert statutory coverage into real utilization.",
        },
        {
          th: "<strong>พ.ร.บ.ระบบสุขภาพปฐมภูมิ พ.ศ. 2562 และการถ่ายโอน รพ.สต. สู่ อบจ.:</strong> กฎหมายรับรองสิทธิการได้รับการดูแลจากทีมหมอครอบครัว ขณะที่การถ่ายโอนสู่ท้องถิ่นต้องวางกลไกประสานข้อมูล การส่งต่อ และการคลังร่วมกับ รพช. ไม่ให้เกิดรอยต่อ",
          en: "<strong>2019 PHC Act & Decentralization:</strong> Guarantees family-care teams by law, while transferring subdistrict health centers to local governments requires seamless clinical and financing coordination.",
        },
      ],
      caseLensTH: "เชื่อมบทเรียนปฐมภูมิไทยเข้ากับทั้ง HS2 (บทบาท รพ.สต. เป็น Gatekeeper และการถ่ายโอนสู่ อบจ.) และ HS6 (การมีเครือข่ายหน่วยบริการปฐมภูมิกระจายทั่วถึงเป็นปัจจัยหลักที่ยกระดับดัชนีความครอบคลุมบริการ SDG 3.8.1)",
      caseLensEN: "Connects Thailand's PHC network directly to HS2 (gatekeeping & decentralization) and HS6 (widespread primary care infrastructure driving SDG 3.8.1 service coverage).",
      flowRoleTH: "สังเคราะห์พัฒนาการปฐมภูมิไทยและชี้ว่า 'มีหน่วยบริการด่านหน้าแล้วยังต้องมีระบบหลักประกันสุขภาพและกลไกจ่ายเงินที่เหมาะสมมารองรับ' ส่งไม้ต่อเข้าสู่ HS6",
      flowRoleEN: "Synthesizes Thailand's PHC platform and bridges directly into HS6: health insurance theory, UHC monitoring, and provider payment incentives.",
      crossLinks: [
        {
          target: "HS6:1",
          labelTH: "HS6 · หมวด 1 (หลักประกันสุขภาพคู่โครงสร้างบริการปฐมภูมิสู่ SDG 3.8)",
          labelEN: "HS6 · Sec 1 (Insurance + Primary Care Infrastructure for UHC)",
          whyTH: "ความก้าวหน้าของความครอบคลุมบริการที่จำเป็น (`SDG 3.8.1`) ต้องอาศัยทั้งการขยายหลักประกันสุขภาพและหน่วยบริการปฐมภูมิที่กระจายทั่วถึง",
          whyEN: "Advancing SDG 3.8.1 essential service coverage requires pairing insurance expansion with accessible primary care networks.",
        },
      ],
      keywords: [
        { th: "พ.ร.บ.ระบบสุขภาพปฐมภูมิ พ.ศ. 2562", en: "Primary Health Care Act B.E. 2562" },
        { th: "อาสาสมัครสาธารณสุขประจำหมู่บ้าน (อสม.)", en: "Village Health Volunteers (VHVs)" },
        { th: "การถ่ายโอน รพ.สต. สู่องค์กรปกครองส่วนท้องถิ่น", en: "PHC Decentralization" },
        { th: "ความเชื่อมโยงปฐมภูมิกับหลักประกันถ้วนหน้า", en: "PHC–UHC Synergy" },
      ],
    },
    "HS5:sum": {
      secLabelTH: "บทสรุป · เช็กลิสต์สังเคราะห์ก่อนทำ Case Discussion HS5 & Open Note",
      secLabelEN: "Synthesis · HS5 Case Discussion & Open-Note Readiness",
      titleTH: "บทสรุปการแยกแยะบริการปฐมภูมิครบ 5 คุณลักษณะ ออกจากระบบสุขภาพปฐมภูมิ 3 เสาหลักของ Astana",
      titleEN: "Distinguishing 5-Attribute Personal Primary Care from Astana's 3-Pillar Primary Health Care",
      summaryTH: "แม่นยำทั้งห้าคุณลักษณะของบริการปฐมภูมิระดับบุคคล และแยกอีกสองเสาหลักของระบบสุขภาพปฐมภูมิระดับสังคมได้ชัดเจน คือหัวใจของการวิเคราะห์กรณีศึกษา HS5",
      summaryEN: "Mastering all five personal Primary Care attributes alongside Astana's non-clinical PHC pillars (Multisectoral Policy and Empowered Communities) unlocks every HS5 case analysis.",
      bullets: [
        {
          th: "<strong>เช็กลิสต์พร้อมตอบครบทั้ง 2 ประเด็นของกรณีศึกษา HS5:</strong> (1) วิเคราะห์ `Primary Care` ครบ 5 คุณลักษณะ (`First-Contact`, `Comprehensiveness`, `Continuity` ข้ามรอยต่อหลังจำหน่าย รพ., `Coordination` เชื่อมภายในและข้ามภาคส่วน, และ `Person-Centeredness` สร้างความไว้วางใจไม่ตีตรา) และ (2) แยกอีก 2 เสาหลักของ `PHC` ตามปฏิญญา Astana คือ `Empowered People & Communities` และ `Multisectoral Policy & Action`",
          en: "<strong>Complete HS5 Case Toolkit:</strong> (1) Map concrete outreach, psychosocial, and respite services across all 5 Primary Care attributes; and (2) articulate Astana's remaining 2 PHC pillars (`Empowered People & Communities` and `Multisectoral Policy & Action`).",
        },
      ],
      caseLensTH: "จำง่ายก่อนเข้าคาบ HS5: ถามเรื่อง `Personal / Primary Care` = ตอบ **5 คุณลักษณะ** (4Cs + Person-Centeredness) · ถามเรื่ององค์ประกอบอื่นของ `Primary Health Care` นอกเหนือจากบริการสุขภาพ = ตอบ **2 เสาหลัก Astana** (การเสริมพลังประชาชน/ชุมชน + นโยบายและการทำงานข้ามภาคส่วนแก้ปัจจัยสังคมเศรษฐกิจ)",
      caseLensEN: "Quick HS5 memory rule: Personal/Primary Care = **5 attributes** (`First-Contact · Comprehensiveness · Continuity · Coordination · Person-Centeredness`); PHC beyond health services = **2 Astana pillars** (`Empowered People & Communities` + `Multisectoral Policy & Action`).",
      flowRoleTH: "สรุปฐานการจัดบริการปฐมภูมิใน HS5 แล้วส่งต่อสู่บทสุดท้าย HS6: 'หลักประกันสุขภาพถ้วนหน้า ทฤษฎีประกันเอกชน สิทธิแรงงานนอกระบบ และกลไกจ่ายเงิน FFS · Capitation · P4P'",
      flowRoleEN: "Completes the PHC backbone in HS5 and hands off to HS6: UHC monitoring, voluntary insurance limits, informal-worker social security, and provider payments.",
      crossLinks: [
        {
          target: "HS6:1",
          labelTH: "ต่อยอดสู่ HS6 · หมวด 1 (หลักการประกันสุขภาพ ลูกบาศก์ UHC และ SDG 3.8)",
          labelEN: "Next: HS6 · Sec 1 (Insurance Principles, UHC Cube & SDG 3.8)",
          whyTH: "เติมกลไกการคลังสุขภาพและหลักประกันความเสี่ยงทางการเงินเพื่อปลดล็อกอุปสรรคค่าใช้จ่ายในการเข้าถึงบริการ",
          whyEN: "Adds the health-financing and risk-pooling engine that removes financial barriers to care.",
        },
      ],
      keywords: [
        { th: "บริการปฐมภูมิ 5 คุณลักษณะ", en: "5 Personal Primary Care Attributes" },
        { th: "ปฏิญญาแอสทานา 3 เสาหลัก", en: "Astana 3 Pillars of PHC" },
        { th: "ปฐมภูมิเป็นฐานรากของ UHC", en: "PHC Foundation of UHC" },
      ],
    },

    /* -------------------- HS6: Health Insurance, UHC & Provider Payment -------------------- */
    "HS6:1": {
      secLabelTH: "หมวดที่ 1 · หลักการประกันสุขภาพ สมมติฐานพื้นฐาน 5 ข้อ ลูกบาศก์ UHC และ SDG 3.8",
      secLabelEN: "Section 1 · Insurance Principles, 5 Basic Assumptions, WHO UHC Cube & SDG 3.8",
      titleTH: "ทฤษฎีการประกันสุขภาพ 5 สมมติฐาน ลูกบาศก์หลักประกันสุขภาพ 3 แกน (X · Z · Y) และการติดตาม SDG 3.8.1–3.8.2",
      titleEN: "5 Voluntary Insurance Assumptions, the 3-Axis UHC Cube, and Global Monitoring (SDG 3.8.1 & 3.8.2)",
      summaryTH: "การประกันสุขภาพเปลี่ยนความไม่แน่นอนรายบุคคลเป็นหลักประกันระดับประชากร แต่การบรรลุ UHC จริงต้องขยายครบสามแกนของลูกบาศก์ UHC พร้อมกระจายหน่วยบริการปฐมภูมิให้ทั่วถึง",
      summaryEN: "Health insurance pools unpredictable individual risks, yet achieving UHC requires advancing all three axes of the UHC Cube alongside accessible primary care networks.",
      bullets: [
        {
          th: "<strong>จากความไม่แน่นอนสู่การรวมความเสี่ยง และสมมติฐานพื้นฐาน 5 ข้อของตลาดสมัครใจ:</strong> ผู้ซื้อแลกเบี้ยกับความแน่นอน (`certainty`) และโอกาสเข้าถึงบริการราคาแพง (`access motive`) ตามกฎจำนวนมาก แต่ตลาดสมัครใจถัวเฉลี่ยความเสี่ยงได้เฉพาะเมื่อ <strong>(1) ผู้รับประกันรู้ค่า `p` และ `E` · (2) โอกาสเกิดเหตุ `p < 1` · (3) ผู้ซื้อไม่รู้ค่า `p` เหนือกว่าผู้รับประกัน (ไม่เกิด `Adverse selection`) · (4) ความเสี่ยงอิสระต่อกัน (`non-covariate`) · และ (5) การป่วยไม่สร้างผลประโยชน์แก่ผู้เอาประกัน</strong>",
          en: "<strong>Pooling Logic & 5 Voluntary Insurance Assumptions:</strong> Voluntary actuarial pooling requires (1) insurer knows p and E, (2) probability p < 1, (3) insured lacks superior knowledge of p (no adverse selection), (4) independent/non-covariate risks, and (5) illness yields no net gain to the insured.",
        },
        {
          th: "<strong>ติดตามความก้าวหน้า UHC ด้วยคู่ตัวชี้วัด `SDG 3.8.1` และ `SDG 3.8.2` คู่บันได `Effective Coverage` (`Campbell et al., 2013`):</strong> `SDG 3.8.1` (`Service Coverage Index`) ดีขึ้นเกือบทุกประเทศเพราะ (1) ความครอบคลุมหลักประกันสุขภาพเพิ่มขึ้น (2) มีหน่วยบริการปฐมภูมิกระจายทั่วถึง และ (3) มีบริการเชิงรุก ลดช่องว่าง `Availability → Accessibility → Acceptability → Utilization → Quality`",
          en: "<strong>SDG 3.8.1 & Campbell's Effective Coverage Staircase:</strong> Essential service coverage rises when expanding insurance enrollment is paired with geographically distributed primary care and proactive outreach.",
        },
        {
          th: "<strong>วิเคราะห์สาเหตุการล้มละลายจากค่ารักษาพยาบาล (`SDG 3.8.2: Catastrophic OOP`) ด้วย 3 แกนของ `WHO UHC Cube`:</strong> เมื่อคนเข้าถึงบริการมากขึ้นแต่ยังพึ่งเงินจ่ายเองหน้างาน รายจ่ายวิบัติจะแย่ลงจาก 3 สาเหตุตรงตาม 3 แกน ได้แก่ <strong>แกน X (`Population`)</strong> ความครอบคลุมประชากรยังขยายได้จำกัด · <strong>แกน Z (`Services`)</strong> ชุดสิทธิประโยชน์ยังมีจำกัดไม่รอบด้าน · และ <strong>แกน Y (`Direct costs`)</strong> ประชาชนยังต้องร่วมจ่าย (`Co-payment / User fees`) หน้างานค่อนข้างสูง",
          en: "<strong>SDG 3.8.2 & Three Axes of the WHO UHC Cube:</strong> Catastrophic out-of-pocket spending persists or worsens when any cube axis lags—X (limited population coverage), Z (narrow benefit package), or Y (high point-of-care cost-sharing/co-payments).",
        },
        {
          th: "<strong>ศักยภาพการเกลี่ยความเสี่ยงและรายได้:</strong> กองทุนภาคบังคับขนาดใหญ่และหลากหลายเกลี่ยความเสี่ยงได้ดีที่สุด โดยความเป็นธรรมของเงินสมทบเรียงลำดับ `อัตราก้าวหน้า > สัดส่วนรายได้ไม่มีเพดาน > มีเพดาน > community rating > risk rating`",
          en: "<strong>Redistributive Capacity:</strong> Large, diverse, compulsory pools redistribute best, with contribution equity ranking Progressive > Uncapped Proportional > Capped Proportional > Community Rating > Individual Risk Rating.",
        },
      ],
      caseLensTH: "ใช้หมวดนี้ตอบโจทย์ HS6 เคสที่ 1 ได้ครบทั้งสองข้อ: ข้อ 1.1 อธิบายปัจจัยหนุน `SDG 3.8.1` จากฝั่งหลักประกันสุขภาพ + เครือข่ายบริการปฐมภูมิกระจายทั่วถึง/บริการเชิงรุก · ข้อ 1.2 อธิบายสาเหตุที่หลายประเทศยังมี `SDG 3.8.2` แย่ลงด้วย **3 แกนของ UHC Cube** (แกน X ประชากรครอบคลุมจำกัด · แกน Z ชุดสิทธิประโยชน์ไม่รอบด้าน · แกน Y ร่วมจ่าย Co-payment สูง)",
      caseLensEN: "Directly unlocks HS6 Case 1: pair insurance expansion + primary-care distribution/outreach to explain SDG 3.8.1 gains, and apply the 3 UHC Cube axes (X population gaps, Z narrow benefits, Y high co-payments) to explain worsening SDG 3.8.2 catastrophic spending.",
      flowRoleTH: "วางรากฐานทฤษฎีการประกันสุขภาพและ `UHC Cube` ในหมวด 1 ก่อนดูว่าต้องมี 'ผู้รับประกันในฐานะบุคคลที่สาม' ทำหน้าที่บริหารจัดการอย่างไรในหมวด 2",
      flowRoleEN: "Establishes insurance theory, SDG 3.8 metrics, and the UHC Cube before Section 2 examines the third-party purchaser running the pool.",
      crossLinks: [
        {
          target: "HS3:2",
          labelTH: "HS3 · หมวด 2 (ความเป็นธรรมด้านบริการและการคลัง)",
          labelEN: "HS3 · Sec 2 (Equity in Access & Finance)",
          whyTH: "การคุ้มครองทั้ง 3 แกนของ UHC Cube และเงินสมทบอัตราก้าวหน้าสร้างความเป็นธรรมทั้งการเข้าถึงและการคลังโดยตรง",
          whyEN: "Expanding all 3 UHC Cube axes with progressive financing directly operationalizes Equity.",
        },
        {
          target: "HS5:7",
          labelTH: "HS5 · หมวด 7 (โครงข่ายปฐมภูมิเป็นฐานรองรับ UHC)",
          labelEN: "HS5 · Sec 7 (PHC Platform for UHC)",
          whyTH: "การมีหลักประกันสุขภาพต้องเดินคู่กับโครงข่ายหน่วยบริการปฐมภูมิที่กระจายทั่วถึงจึงจะยกระดับ SDG 3.8.1 ได้จริง",
          whyEN: "Insurance coverage improves SDG 3.8.1 only when paired with geographically accessible primary care.",
        },
      ],
      keywords: [
        { th: "สมมติฐานพื้นฐานประกันสุขภาพ 5 ข้อ", en: "5 Basic Insurance Assumptions (p < 1)" },
        { th: "ลูกบาศก์หลักประกันสุขภาพ 3 แกน (X · Z · Y)", en: "WHO UHC Cube (X · Z · Y Axes)" },
        { th: "ดัชนีครอบคลุมบริการและรายจ่ายหายนะ", en: "SDG 3.8.1 & SDG 3.8.2" },
        { th: "บันไดความครอบคลุมที่มีประสิทธิผล", en: "Effective Coverage Staircase" },
      ],
    },
    "HS6:2": {
      secLabelTH: "หมวดที่ 2 · องค์ประกอบของระบบประกันสุขภาพและการจัดซื้อเชิงยุทธศาสตร์",
      secLabelEN: "Section 2 · Components of Health Insurance & Strategic Purchasing",
      titleTH: "บทบาทของผู้รับประกันในฐานะบุคคลที่สาม การจัดซื้อเชิงยุทธศาสตร์ การบริหารการคลัง และระบบข้อมูล",
      titleEN: "The Third-Party Insurer, Strategic Purchasing, Financial Stewardship, and Information Systems",
      summaryTH: "เมื่อเปลี่ยนจากจ่ายเงินเองเป็นระบบประกัน ผู้รับประกันจะเข้ามาเป็นบุคคลที่สามที่ออกแบบชุดสิทธิประโยชน์ สัญญาจ่ายเงิน และระบบข้อมูลเพื่อซื้อบริการที่มีคุณภาพและคุ้มค่า",
      summaryEN: "Moving from out-of-pocket payment to insurance introduces a third-party purchaser that designs benefits, payment incentives, and data systems for strategic purchasing.",
      bullets: [
        {
          th: "<strong>เปลี่ยนความสัมพันธ์จากสองฝ่ายเป็นสามฝ่าย (`Triangular Relationship`):</strong> ผู้รับประกัน (`Insurer / Purchaser`) บริหารชุดสิทธิประโยชน์แก่ผู้มีสิทธิ (`Beneficiaries`) พร้อมทำสัญญาและออกแบบกติกาจ่ายเงินแก่หน่วยบริการ (`Providers`)",
          en: "<strong>Triangular Financing Relationship:</strong> A third-party insurer/purchaser mediates between beneficiaries and contracted healthcare providers.",
        },
        {
          th: "<strong>การจัดซื้อเชิงยุทธศาสตร์ (`Strategic Purchasing`) บนฐานการคลังและข้อมูล:</strong> ไม่เพียงจ่ายบิลตามใบเสร็จ แต่ใช้ข้อมูลผลลัพธ์ทางคลินิกและต้นทุนมากำหนดอัตราจ่าย เงื่อนไขคุณภาพ (เช่น `P4P`) และการกำกับติดตามอย่างโปร่งใส",
          en: "<strong>Strategic Purchasing & Data Backbone:</strong> Uses actuarial budgeting and clinical/claims information to link provider payment with quality and efficiency.",
        },
      ],
      caseLensTH: "เชื่อมบทบาทของผู้ซื้อบริการเชิงยุทธศาสตร์ (เช่น สปสช. หรือสำนักงานประกันสังคม) ในการออกแบบทั้งชุดสิทธิประโยชน์สร้างเสริมป้องกันโรค และเกณฑ์จ่ายเงินเพิ่มเติมตามผลลัพธ์ทางคลินิก",
      caseLensEN: "Explains how public purchasers like NHSO design preventive benefit packages and outcome-based payment add-ons.",
      flowRoleTH: "เข้าใจกลไก 'ผู้รับประกัน' ในหมวด 2 แล้ว จึงก้าวสู่หมวด 3 เพื่อเปรียบเทียบข้อยกเว้นของตลาดสมัครใจเอกชน กับระบบภาคบังคับและสิทธิแรงงานนอกระบบของไทย",
      flowRoleEN: "Defines the third-party payer before Section 3 contrasts private market exclusions with Thailand's compulsory schemes and informal-worker coverage.",
      crossLinks: [
        {
          target: "HS2:4",
          labelTH: "HS2 · หมวด 4 (เชื่อมเสาการคลัง ข้อมูล และบริการ)",
          labelEN: "HS2 · Sec 4 (Linking Building Blocks)",
          whyTH: "ผู้รับประกันเชื่อม Building Block ด้านการคลัง ระบบสารสนเทศ และการจัดบริการเข้าด้วยกันผ่านการจัดซื้อเชิงยุทธศาสตร์",
          whyEN: "Shows how the financing block relies on health information systems to purchase services strategically.",
        },
      ],
      keywords: [
        { th: "ผู้รับประกันในฐานะบุคคลที่สาม", en: "Third-Party Payer / Insurer" },
        { th: "การจัดซื้อบริการเชิงยุทธศาสตร์", en: "Strategic Purchasing" },
        { th: "การบริหารการคลังและสารสนเทศ", en: "Financial & Information Management" },
      ],
    },
    "HS6:3": {
      secLabelTH: "หมวดที่ 3 · ประกันสมัครใจ ข้อยกเว้นเอกชน ผลกระทบภายนอก และระบบประกันสังคมไทย (ม.33 · 39 · 40)",
      secLabelEN: "Section 3 · Private Exclusions, Externalities, Thai 3 Schemes & Social Security Sec 33 · 39 · 40",
      titleTH: "เหตุผลข้อยกเว้นประกันเอกชน (Adverse Selection, p → 1, Externalities) และสิทธิประกันสังคมไทยสำหรับแรงงานนอกระบบ",
      titleEN: "Why Private Insurance Excludes High Risks & Preventive Externalities, Plus Thai UCS & SSS Section 40",
      summaryTH: "ตลาดประกันเอกชนตั้งข้อยกเว้นโรคเสี่ยงสูงและบริการป้องกันที่มีผลกระทบภายนอกเพื่อความอยู่รอด รัฐจึงต้องจัดหลักประกันถ้วนหน้าควบคู่ทางเลือกความมั่นคงทางสังคมแก่แรงงานนอกระบบ",
      summaryEN: "Private insurers exclude high-probability risks and positive-externality prevention to avoid losses; public systems step in with universal healthcare and voluntary social security for informal workers.",
      bullets: [
        {
          th: "<strong>วิเคราะห์ข้อยกเว้นของประกันสุขภาพเอกชน (`ข้อยกเว้นมาตรฐาน คปภ. 21 ข้อ`) ด้วยทฤษฎีการประกันสุขภาพ:</strong> (1) กรณีโรคที่สัมพันธ์กับพฤติกรรมเสี่ยงสูง (เช่น โรคติดต่อทางเพศสัมพันธ์/HIV): เกิด `Adverse selection` (ผู้ซื้อมีพฤติกรรมเสี่ยงและรู้ความเสี่ยงตนมากกว่าบริษัท) และมีความเสี่ยงเกิดโรคสูงจนค่า <strong>`p เข้าใกล้ 1` (`p → 1`)</strong> ขัดสมมติฐาน `p < 1` จึงถัวเฉลี่ยความเสี่ยงไม่ได้ · (2) กรณีบริการป้องกันเชิงรุก (เช่น `PrEP / PEP` หรือวัคซีน): เป็นบริการที่มี <strong>ผลกระทบภายนอกทางบวก (`Positive externalities`)</strong> ต่อสังคมซึ่งตลาดเอกชนไม่จูงใจจัดสรร และหากเปิดขายจะมีเฉพาะกลุ่มเสี่ยงที่ตั้งใจใช้เข้ามาซื้อทำให้ <strong>`p → 1`</strong> (ในไทย งบ `P&P` ของ สปสช. จึงจัดบริการฟรีแก่คนไทยทุกสิทธิ)",
          en: "<strong>Why Private Insurance Excludes STI/HIV & PrEP/PEP:</strong> (1) Risky-behavior conditions trigger `Adverse selection` and push probability `p → 1` (violating `p < 1`, making risk-pooling impossible); (2) Proactive prevention (`PrEP/PEP`) generates societal `Positive externalities` (public sector role, covered free under Thai NHSO P&P) and would attract only intended users (`p → 1`).",
        },
        {
          th: "<strong>ภาพรวมประกันภาคบังคับและ 3 กองทุนสุขภาพหลักของไทย:</strong> `UCS` (บัตรทอง 46.9 ล้านคน ใช้ภาษีทั่วไป ครอบคลุมแรงงานนอกระบบและคนไทยที่ไม่มีสิทธิอื่น), `SSS` (ประกันสังคม 12.8 ล้านคน สมทบ 3 ฝ่าย), และ `CSMBS` (ข้าราชการ 5.4 ล้านคน ภาษีทั่วไป) ทำงานร่วมกับประกันเฉพาะกรณี (พ.ร.บ.ผู้ประสบภัยจากรถ, กองทุนเงินทดแทนเฉพาะลูกจ้าง ม.33) และประกันแรงงานต่างด้าว",
          en: "<strong>Thailand's Compulsory Coverage Architecture:</strong> Tax-financed UCS (46.9M, including informal workers), tripartite SSS (12.8M), and tax-financed CSMBS (5.4M), complemented by specific-risk mandates and migrant insurance.",
        },
        {
          th: "<strong>เปรียบเทียบประกันสังคม `มาตรา 33 · 39 · 40` สำหรับแรงงานนอกระบบ:</strong> ลูกจ้างในระบบอยู่ใน `ม.33` (7 กรณี) · ผู้เคยอยู่ ม.33 สมัครต่อ `ม.39` (6 กรณี) · ส่วน <strong>แรงงานนอกระบบ/อาชีพอิสระสมัครภาคสมัครใจ `มาตรา 40`</strong> ได้โดยไม่เสียสิทธิรักษาพยาบาลบัตรทอง (`UCS`) มี 3 ทางเลือกสมทบ: `70 บาท/เดือน` (3 กรณี: เงินทดแทนขาดรายได้เมื่อเจ็บป่วย ทุพพลภาพ เสียชีวิต), `100 บาท/เดือน` (4 กรณี: เพิ่มบำเหน็จชราภาพ), และ <strong>`ไม่น้อยกว่า 300 บาท/เดือน` (ทางเลือกที่ 3 ครบ 5 กรณี: เจ็บป่วย ทุพพลภาพ เสียชีวิต บำเหน็จชราภาพ และสงเคราะห์บุตร)</strong>",
          en: "<strong>Social Security Section 33 · 39 · 40:</strong> Informal workers retain UCS healthcare and can enroll voluntarily in SSS **Section 40** across 3 tiers: 70 THB/mo (sickness income loss, disability, death), 100 THB/mo (+ old-age lump sum), or **≥300 THB/mo (all 5 benefits: sickness, disability, death, old-age lump sum, and child allowance)**.",
        },
      ],
      caseLensTH: "ใช้หมวดนี้ตอบโจทย์ HS6 เคสที่ 2 ได้ครบทุกคะแนน: ข้อ 2.1 แยกเหตุผล STI/HIV (`พฤติกรรมเสี่ยง/Adverse selection` + `p เข้าใกล้ 1`) ออกจากเหตุผล PrEP/PEP (`เป็นบริการที่มี Externalities` + `มีเฉพาะกลุ่มเสี่ยงเข้ามาซื้อทำให้ p เข้าใกล้ 1`) · ข้อ 2.2 แรงงานนอกระบบที่ต้องการความมั่นคงครบทั้ง 5 กรณี (รวมบำเหน็จชราภาพและสงเคราะห์บุตร) ต้องสมัคร `ระบบประกันสังคม` แบบ `ภาคสมัครใจ / มาตรา 40` และจ่ายเงินสมทบ `ไม่น้อยกว่า 300 บาท/เดือน`",
      caseLensEN: "Unlocks HS6 Case 2 completely: for Q2.1, pair risky behavior/Adverse Selection + `p → 1` (STI/HIV) and Positive Externalities + high-risk self-selection `p → 1` (PrEP/PEP); for Q2.2, specify voluntary **Social Security Section 40 at ≥300 THB/month** to cover all 5 social-protection benefits.",
      flowRoleTH: "เห็นโครงสร้างกองทุนทั้งเอกชนและภาครัฐในหมวด 3 แล้ว จึงส่งต่อเข้าสู่หมวด 4 เพื่อเปรียบเทียบกลไกการจ่ายเงินแก่โรงพยาบาล (`FFS`, `Capitation`, `DRG`, `Global Budget`, `P4P`)",
      flowRoleEN: "Moves from insurance market structure and Thai schemes in Section 3 to provider payment mechanisms and incentives in Section 4.",
      crossLinks: [
        {
          target: "HS6:1",
          labelTH: "HS6 · หมวด 1 (สมมติฐานพื้นฐาน 5 ข้อของทฤษฎีประกัน)",
          labelEN: "HS6 · Sec 1 (5 Basic Insurance Assumptions)",
          whyTH: "ข้อยกเว้นของประกันเอกชนในหมวด 3 คือผลโดยตรงเมื่อสมมติฐาน `p < 1` และข้อมูลสมมาตรในหมวด 1 ไม่เป็นจริง",
          whyEN: "Private exclusions directly reflect violations of Section 1's `p < 1` and symmetric-information assumptions.",
        },
        {
          target: "HS3:2",
          labelTH: "HS3 · หมวด 2 (ความเป็นธรรมของแรงงานนอกระบบและระหว่างกองทุน)",
          labelEN: "HS3 · Sec 2 (Equity for Informal Workers & Across Schemes)",
          whyTH: "การมีบัตรทอง (`UCS`) คู่กับประกันสังคม `มาตรา 40` ช่วยลดช่องว่างความคุ้มครองสุขภาพและรายได้ของแรงงานนอกระบบ",
          whyEN: "Pairing tax-financed UCS with voluntary Section 40 narrows social-protection gaps for informal workers.",
        },
      ],
      keywords: [
        { th: "การคัดเลือกในทางตรงข้ามและ p เข้าใกล้ 1", en: "Adverse Selection & p → 1" },
        { th: "ผลกระทบภายนอกทางบวก (PrEP/PEP)", en: "Positive Externalities" },
        { th: "ประกันสังคม มาตรา 33 · 39 · 40 (300 บาท/เดือน)", en: "SSS Sec 33 · 39 · 40 (70/100/300 THB)" },
        { th: "สามกองทุนหลัก (UCS · SSS · CSMBS)", en: "Thailand's Three Main Schemes" },
      ],
    },
    "HS6:4": {
      secLabelTH: "หมวดที่ 4 · กลไกการจ่ายค่าบริการ (FFS · Capitation · DRGs · Global Budget · P4P)",
      secLabelEN: "Section 4 · Provider Payment Methods, WHR 2000 Matrix & Pay for Performance (P4P)",
      titleTH: "สมการรายจ่าย พฤติกรรมแพทย์ จุดแข็ง–จุดอ่อนของ FFS เทียบกับ Capitation และบทบาทของ P4P",
      titleEN: "Expenditure Equations, Provider Behaviors, FFS vs. Capitation Trade-Offs, and P4P Gap-Closing",
      summaryTH: "ไม่มีวิธีจ่ายเงินเดี่ยววิธีใดสมบูรณ์แบบ จ่ายตามรายการกระตุ้นปริมาณบริการแต่งบบานปลาย ส่วนเหมาจ่ายรายหัวคุมงบและหนุนป้องกันโรคแต่เสี่ยงให้บริการต่ำกว่าเกณฑ์ จึงต้องเสริมด้วย P4P และการจ่ายแบบผสมผสาน",
      summaryEN: "No single payment method is flawless: FFS boosts responsiveness yet fuels SID and high costs, whereas Capitation contains costs and encourages prevention yet risks under-provision—motivating P4P and blended payment.",
      bullets: [
        {
          th: "<strong>เปรียบเทียบสมการและพฤติกรรมแพทย์: `Fee-for-Service (FFS)` vs. `Inclusive / Exclusive Capitation`:</strong> ภายใต้ `FFS` (`Expenditure = Visits × Quantity × Price × Intensity`) กองทุนรับความเสี่ยง แพทย์เรียกเก็บได้ทุกรายการจึงมีอิสระตัดสินใจให้บริการเต็มที่และมีแนวโน้มสั่งยาราคาแพง/ตรวจมาก (`Over-provision`) · ส่วนภายใต้ `Capitation` (`Beneficiaries × Capitation rate`; `Inclusive` เหมาทั้ง OPD+IPD ส่วน `Exclusive` แยก IPD ออก) โรงพยาบาลรับความเสี่ยงภายใต้งบคงที่ที่ได้รับมาแล้ว แพทย์จึงระมัดระวังค่าใช้จ่ายและเลี่ยงการรักษาราคาแพง",
          en: "<strong>FFS vs. Capitation Equations & Provider Behaviors:</strong> Under retrospective FFS, payer-borne risk lets clinicians bill every item freely (tending toward expensive drugs/over-provision); under prospective Capitation (especially Inclusive Capitation covering OPD+IPD), hospital-borne risk under a fixed budget makes clinicians cost-conscious.",
        },
        {
          th: "<strong>จุดแข็งและจุดอ่อนตามทฤษฎี (`WHO World Health Report 2000 Matrix`):</strong> <strong>`FFS`</strong> มีจุดแข็งคือสร้างแรงจูงใจในการให้บริการและตอบสนองผู้ป่วยสูง แต่มีจุดอ่อน 2 ข้อคือเกิด <strong>อุปสงค์ที่ผู้ให้บริการกระตุ้น (`Supplier-Induced Demand: SID`)</strong> และเกิด <strong>ภาระค่าใช้จ่ายด้านสุขภาพที่สูง</strong> · ส่วน <strong>`Capitation`</strong> มีจุดแข็ง 2 ข้อคือ <strong>ควบคุมค่าใช้จ่ายได้ดี</strong> และ <strong>สร้างแรงจูงใจในการส่งเสริมป้องกันโรค</strong> แต่มีจุดอ่อนคือเสี่ยงเกิด <strong>การให้บริการต่ำกว่าเกณฑ์ (`Under-provision`)</strong> (ขณะที่ `DRGs` จ่ายตาม `RW` เสี่ยง `DRG creep` และ `Global Budget` คุมเพดานงบรวม)",
          en: "<strong>Theoretical Strengths & Weaknesses (WHR 2000):</strong> FFS excels at service responsiveness (`+`) but suffers from `Supplier-Induced Demand (SID)` and high total expenditure (`-`); Capitation excels at cost containment and preventive care (`+`) but risks `Under-provision` (`-`); DRGs require audit against `DRG creep` under a `Global Budget`.",
        },
        {
          th: "<strong>เงื่อนไขของ `Pay for Performance (P4P)` ในการปิดช่องว่างของฐานเดิม และการจ่ายแบบผสมผสาน (`Blended Payment`):</strong> เมื่อเติม `P4P` (จ่ายเพิ่มตามผลลัพธ์ เช่น ลดอัตรา `Acute exacerbation` ที่นอน รพ./เข้า ER): <strong>บนฐาน `FFS`</strong> <em>อาจปิดช่องว่างได้หรือไม่ได้</em> ขึ้นอยู่กับว่า <strong>อัตราจ่าย P4P มากเพียงพอหรือไม่</strong> ที่จะจูงใจให้โรงพยาบาลหันมาทำบริการส่งเสริม ป้องกัน และฟื้นฟู (เทียบกับรายรับ FFS เมื่อผู้ป่วยกำเริบ) · ส่วน <strong>บนฐาน `Inclusive Capitation`</strong> `P4P` <strong>ช่วยปิดช่องว่าง (`Under-provision`) ได้สอดคล้องตรงทิศทาง</strong> เพราะจูงใจให้ส่งเสริม ป้องกัน ฟื้นฟูเพื่อลด `Acute exacerbation` ไปในทิศทางเดียวกับการประหยัดต้นทุน IPD ของโรงพยาบาล (ไทยจึงใช้ `Blended Payment`: `Exclusive Capitation` + `DRGs Global Budget` + `P4P`)",
          en: "<strong>How P4P Interacts with Base Payment Systems:</strong> Layered onto `FFS`, P4P *may or may not* close the prevention gap—depending on whether the P4P bonus is large enough relative to FFS acute-care revenue; layered onto `Inclusive Capitation`, P4P *effectively closes the under-provision gap* by reinforcing promotion, prevention, and rehabilitation to cut acute exacerbations.",
        },
      ],
      caseLensTH: "ใช้หมวดนี้ตอบโจทย์ HS6 เคสที่ 3 ได้ครบทั้ง 3 ข้อย่อย (8 คะแนนเต็ม): (3.1) เทียบพฤติกรรมแพทย์และสาเหตุจากผู้รับความเสี่ยงงบประมาณ (`FFS` เรียกเก็บตามจริง vs `Inclusive Capitation` ตระหนักภาระในงบเหมาจ่ายคงที่) · (3.2) จุดแข็ง–จุดอ่อน (`FFS`: จูงใจบริการสูง vs `SID` + งบสูง; `Capitation`: คุมงบดี + จูงใจส่งเสริมป้องกัน vs `Under-provision`) · (3.3) `P4P` บนฐาน `FFS` อาจมีผลหรือไม่มีผลขึ้นกับอัตราจ่าย P4P ว่ามากพอหรือไม่ ส่วนบนฐาน `Inclusive Capitation` ช่วยปิดช่องว่างได้โดยตรง",
      caseLensEN: "Directly powers all 3 parts of HS6 Case 3: (3.1) contrast clinician autonomy/expensive prescribing under FFS vs. cost-conscious prescribing under fixed Inclusive Capitation; (3.2) list exact WHR 2000 strengths and weaknesses (SID & high cost vs. cost control, prevention & under-provision); (3.3) contrast conditional P4P impact under FFS (depends on bonus size) vs. synergistic gap-closing under Inclusive Capitation.",
      flowRoleTH: "เข้าใจสมการแรงจูงใจของ `FFS`, `Capitation`, `DRG`, `Global Budget` และ `P4P` ในหมวด 4 แล้ว จึงพร้อมวิเคราะห์ `Moral hazard` และมาตรการคุมค่าใช้จ่ายที่เป็นธรรมในหมวด 5",
      flowRoleEN: "Mastering payment incentives and P4P in Section 4 directly unlocks Section 5: managing dual-sided moral hazard equitably.",
      crossLinks: [
        {
          target: "ST1:4",
          labelTH: "ST1 · หมวด 4 (กติกาการจ่ายเงินคือโครงสร้างใต้ภูเขาน้ำแข็ง)",
          labelEN: "ST1 · Sec 4 (Payment Rules as System Structure)",
          whyTH: "กติกาการจ่ายค่าบริการเป็นชั้น 'โครงสร้างแรงจูงใจ' ใต้ภูเขาน้ำแข็งที่กำหนดแนวโน้มพฤติกรรมโรงพยาบาล",
          whyEN: "Provider payment formulas act as structural incentives shaping clinical utilization patterns.",
        },
        {
          target: "HS3:4",
          labelTH: "HS3 · หมวด 4 (ประสิทธิภาพของระบบบริการ)",
          labelEN: "HS3 · Sec 4 (System Efficiency)",
          whyTH: "การผสมผสาน Exclusive Capitation, DRGs ภายใต้งบยอดรวม และ P4P เฉพาะโรค ช่วยรักษาสมดุลทั้งประสิทธิภาพและคุณภาพ",
          whyEN: "Blended capitation, global-budget DRGs, and targeted P4P balance efficiency with clinical quality.",
        },
      ],
      keywords: [
        { th: "จ่ายตามรายบริการเทียบกับเหมาจ่ายรายหัว", en: "FFS vs. Inclusive/Exclusive Capitation" },
        { th: "อุปสงค์ที่ผู้ให้บริการกระตุ้น · บริการต่ำกว่าเกณฑ์", en: "SID vs. Under-Provision" },
        { th: "การจ่ายตามผลงานและการจ่ายแบบผสมผสาน", en: "Pay for Performance (P4P) & Blended Payment" },
        { th: "กลุ่มวินิจฉัยโรคร่วมและงบประมาณยอดรวม", en: "DRGs & Global Budget" },
      ],
    },
    "HS6:5": {
      secLabelTH: "หมวดที่ 5 · ปัญหาการขาดจริยธรรม (Moral Hazard) และการควบคุมค่าใช้จ่าย",
      secLabelEN: "Section 5 · Moral Hazard, Supplier-Induced Demand & Cost Containment",
      titleTH: "Moral Hazard สองฝั่ง ผลกระทบของส่วนร่วมจ่ายต่อแกน Y ของ UHC Cube และการควบคุมทางอ้อมฝั่งผู้ให้บริการ",
      titleEN: "Dual-Sided Moral Hazard, Protecting Vulnerable Groups on UHC Axis Y, and Supply-Side Control",
      summaryTH: "เมื่อมีบุคคลที่สามจ่ายแทนย่อมเสี่ยงเกิดการใช้และสั่งบริการเกินจำเป็น การคุมรายจ่ายที่เป็นธรรมจึงเน้นปรับวิธีจ่ายเงินฝั่งผู้ให้บริการโดยไม่ตั้งกำแพงร่วมจ่ายซ้ำเติมกลุ่มเปราะบาง",
      summaryEN: "Third-party payment tempts overuse on both sides; equitable cost containment reforms supply-side payment incentives while shielding vulnerable groups from user fees.",
      bullets: [
        {
          th: "<strong>`Moral hazard` เกิดได้ทั้งสองฝั่ง แต่ฝั่งผู้ให้บริการมีอิทธิพลต่อค่าใช้จ่ายมากกว่า:</strong> ผู้ใช้บริการอาจลดความระมัดระวังหรือมาใช้บริการเกินจำเป็น (`Consumer's moral hazard`) ขณะที่ผู้ให้บริการมีข้อมูลทางการแพทย์เหนือกว่า จึงกำหนดการตรวจ ยาราคาแพง และการรับไว้ในโรงพยาบาลได้มากกว่า (`Provider's moral hazard / SID` โดยเฉพาะภายใต้ `FFS`)",
          en: "<strong>Two-Sided Moral Hazard & Information Asymmetry:</strong> Consumers may increase discretionary visits, yet providers wield far greater influence over costly diagnostics, drugs, and admissions via `SID` under FFS.",
        },
        {
          th: "<strong>ระวังผลข้างเคียงของส่วนร่วมจ่าย (`Co-payment`, `Co-insurance`, `Deductible`):</strong> การเก็บส่วนร่วมจ่ายหน้างานสูงเกินไปจะบั่นทอนแกน Y ของ `UHC Cube` ทำให้เกิดรายจ่ายวิบัติ (`SDG 3.8.2`) และสกัดกั้นการรักษาที่จำเป็นในคนจน ผู้ป่วยโรคเรื้อรัง ผู้สูงอายุ และผู้พิการ จึงต้องยกเว้นให้กลุ่มเปราะบางและใช้ `Primary care gatekeeper` แทน",
          en: "<strong>Cost-Sharing Trade-Offs & Vulnerable Exemptions:</strong> High user fees erode UHC Cube Axis Y—driving catastrophic OOP spending and deterring essential care among poor, elderly, disabled, and chronically ill patients.",
        },
        {
          th: "<strong>มาตรการทางอ้อมฝั่งผู้ให้บริการยั่งยืนกว่าการก้าวล่วงรายเคส:</strong> การเปลี่ยนวิธีจ่ายเงินจาก `FFS` เป็นแบบล่วงหน้า (`Capitation`, `DRGs`, `Global budget`) เสริมด้วย `P4P` ด้านคุณภาพและบัญชียาหลักแห่งชาติ ช่วยควบคุมต้นทุนโดยไม่ลดทอนคุณภาพและการเข้าถึง",
          en: "<strong>Indirect Supply-Side Reform Beats Micromanagement:</strong> Prospective payment paired with targeted P4P and essential medicine lists contains costs sustainably while preserving clinical autonomy and quality.",
        },
      ],
      caseLensTH: "เชื่อมหมวด 5 ย้อนกลับไปเสริมทั้งเคสที่ 1 (ส่วนร่วมจ่าย `Co-payment` ที่สูงคือสาเหตุแกน Y ที่ทำให้เกิด `Catastrophic OOP` ใน `SDG 3.8.2`) และเคสที่ 3 (เหตุผลที่ต้องใช้มาตรการจ่ายเงินฝั่งผู้ให้บริการอย่าง `Capitation + P4P` คุมค่าใช้จ่ายควบคู่คุณภาพ)",
      caseLensEN: "Links Section 5 directly to Case 1 (high co-payments eroding Axis Y and worsening SDG 3.8.2) and Case 3 (using prospective supply-side payment + P4P to balance efficiency and quality).",
      flowRoleTH: "ประสานหลักความเป็นธรรม (หมวด 1) และวิธีจ่ายเงิน (หมวด 4) เข้าด้วยกัน เพื่อสรุปหลักการออกแบบระบบหลักประกันสุขภาพที่สมดุลทั้งประสิทธิภาพ คุณภาพ และการเข้าถึง",
      flowRoleEN: "Synthesizes Equity (Section 1) and Payment Incentives (Section 4) into balanced cost containment preserving Efficiency, Quality, and Access.",
      crossLinks: [
        {
          target: "HS1:3",
          labelTH: "HS1 · หมวด 3 (การป้องกันระดับที่สี่ลดบริการเกินจำเป็น)",
          labelEN: "HS1 · Sec 3 (Quaternary Prevention)",
          whyTH: "การรู้เท่าทัน `provider's moral hazard` และ `SID` สอดคล้องโดยตรงกับจริยธรรมการป้องกันระดับที่สี่",
          whyEN: "Curbing supplier-induced demand aligns financial stewardship with quaternary prevention ethics.",
        },
        {
          target: "HS3:7",
          labelTH: "HS3 · หมวด 7 (ชั่งน้ำหนัก Efficiency · Quality · Equity)",
          labelEN: "HS3 · Sec 7 (Balancing EQESaRR Trade-Offs)",
          whyTH: "การยกเว้นส่วนร่วมจ่ายให้กลุ่มเปราะบางและใช้การจ่ายเงินแบบผสมผสานคือต้นแบบของการรักษาสมดุล EQESaRR",
          whyEN: "Exempting vulnerable patients while blending provider payments exemplifies balanced EQESaRR policy design.",
        },
      ],
      keywords: [
        { th: "ปัญหาการขาดจริยธรรมสองฝั่ง", en: "Consumer & Provider Moral Hazard" },
        { th: "การโน้มน้าวอุปสงค์โดยผู้ให้บริการ", en: "Supplier-Induced Demand (SID)" },
        { th: "ส่วนร่วมจ่ายและการยกเว้นกลุ่มเปราะบาง", en: "Cost-Sharing & Vulnerable Exemptions" },
        { th: "การควบคุมทางตรงเทียบกับทางอ้อม", en: "Direct vs. Indirect Supply-Side Control" },
      ],
    },
    "HS6:sum": {
      secLabelTH: "บทสรุป · เช็กลิสต์สังเคราะห์ก่อนทำ Case Discussion HS6 & Open Note",
      secLabelEN: "Synthesis · HS6 Case Discussion & Open-Note Readiness",
      titleTH: "บทสรุปการวิเคราะห์ UHC (SDG 3.8 & UHC Cube) ทฤษฎีประกันและ ม.40 ตลอดจนแรงจูงใจ FFS · Capitation · P4P",
      titleEN: "Synthesizing SDG 3.8 & UHC Cube, Insurability & SSS Sec 40, and FFS · Capitation · P4P Incentives",
      summaryTH: "อ่านแนวโน้ม UHC โลกผ่านลูกบาศก์สามแกน อธิบายข้อยกเว้นประกันเอกชนและสิทธิแรงงานนอกระบบได้แม่นยำ และเปรียบเทียบแรงจูงใจของ FFS, Capitation และ P4P ได้ครบถ้วน คือหมุดหมายสุดท้ายของ HS1–HS6",
      summaryEN: "Analyzing global UHC via the 3-axis UHC Cube, explaining private exclusions and SSS Section 40, and comparing FFS, Capitation, and P4P incentives complete the entire HS1–HS6 curriculum.",
      bullets: [
        {
          th: "<strong>เช็กลิสต์พร้อมตอบครบทั้ง 3 กรณีศึกษาของ HS6:</strong> (1) `SDG 3.8.1` ดีขึ้นจากหลักประกัน + ปฐมภูมิกระจายทั่วถึง/เชิงรุก ส่วน `SDG 3.8.2` วิเคราะห์สาเหตุด้วย 3 แกน `UHC Cube (X · Z · Y)` · (2) ประกันเอกชนยกเว้น STI/HIV เพราะพฤติกรรมเสี่ยง/`Adverse selection` และ `p → 1` ยกเว้น PrEP/PEP เพราะมี `Externalities` และ `p → 1` ขณะที่แรงงานนอกระบบเพิ่มความมั่นคงครบ 5 กรณีผ่าน `ประกันสังคม มาตรา 40 (≥300 บาท/เดือน)` · และ (3) เทียบ `FFS` (`SID`/งบสูง; `P4P` ขึ้นกับขนาดอัตราจ่าย) กับ `Inclusive Capitation` (คุมงบ/เน้นป้องกันแต่เสี่ยง `Under-provision`; `P4P` ช่วยปิดช่องว่างลด `Acute exacerbation` ได้ตรงทิศทาง)",
          en: "<strong>Complete HS6 Case Toolkit:</strong> (1) Pair SDG 3.8.1 enablers with 3-axis UHC Cube causes of SDG 3.8.2; (2) explain STI/HIV & PrEP/PEP private exclusions (`Adverse selection`, `p → 1`, `Externalities`) plus voluntary SSS Section 40 (`≥300 THB/mo` for 5 benefits); and (3) contrast FFS vs. Inclusive Capitation behaviors, trade-offs, and conditional vs. synergistic P4P effects.",
        },
      ],
      caseLensTH: "ทบทวนตัวเลขและเงื่อนไขสำคัญก่อนเข้าห้องอภิปราย HS6: อ่านผลรวมตาราง 3×3 ของ 138 ประเทศให้แม่น · แยกเหตุผล `Adverse selection + p → 1` คู่กับ `Externalities + p → 1` · จำอัตราสมทบ `ม.40 ทางเลือก 300 บาท/เดือน` (5 กรณี โดยไม่เสียสิทธิบัตรทอง) · และชี้เงื่อนไขว่าในระบบ `FFS` อัตราจ่าย `P4P` ต้องสูงพอจึงจะจูงใจเปลี่ยนพฤติกรรมได้",
      caseLensEN: "Final HS6 checklist: read 3×3 country matrix totals carefully, pair `p → 1` with `Adverse selection` (STI/HIV) and `Externalities` (PrEP/PEP), recall `SSS Section 40 ≥300 THB/mo` (retaining UCS), and highlight why P4P on an FFS base depends critically on bonus magnitude.",
      flowRoleTH: "ปิดฉากเส้นทางการเรียนรู้ทั้งชุด `ST1 → HS1 → HS2 → HS3 → HS4 → HS5 → HS6` อย่างสมบูรณ์ เชื่อมแนวคิดระบบ สุขภาพ ปฐมภูมิ และการคลังสุขภาพเพื่อพร้อมทั้งอภิปรายกลุ่ม ลงพื้นที่ รพช. และสอบ Open Note",
      flowRoleEN: "Completes the entire RACM 303 Health Systems arc (`ST1 → HS1–HS6`), uniting systems thinking, determinants, primary care, and equitable health financing for Case Discussions, fieldwork, and the Open-Note exam.",
      crossLinks: [
        {
          target: "ST1:4",
          labelTH: "ย้อนเชื่อมรากฐาน ST1 · หมวด 4 (การคิดเชิงระบบครบวงจร)",
          labelEN: "Full Circle: ST1 · Sec 4 (Systems Thinking Synthesis)",
          whyTH: "เห็นครบทั้งเหตุการณ์ผู้ป่วย แนวโน้มรายจ่าย โครงสร้างกองทุน/การจ่ายเงิน และกรอบความคิดความเป็นปึกแผ่นในสังคม (`Solidarity`)",
          whyEN: "Completes the Iceberg lens from bedside illness events down to financing structures and social solidarity.",
        },
        {
          target: "HS3:7",
          labelTH: "HS3 · หมวด 7 (ประเมินดุลยภาพ Efficiency · Quality · Equity)",
          labelEN: "HS3 · Sec 7 (EQESaRR Synthesis)",
          whyTH: "บทสรุปของ HS6 ย้ำเป้าหมายสูงสุดว่ามาตรการการคลังทุกชิ้นต้องเพิ่มประสิทธิภาพโดยไม่ลดทอนคุณภาพและการเข้าถึงบริการ",
          whyEN: "Reaffirms that every financing instrument must enhance efficiency without harming clinical quality or equitable access.",
        },
      ],
      keywords: [
        { th: "ลูกบาศก์ UHC และ SDG 3.8.1–3.8.2", en: "UHC Cube & SDG 3.8 Monitoring" },
        { th: "ประกันสังคม มาตรา 40 (แรงงานนอกระบบ)", en: "SSS Section 40 (Informal Labor)" },
        { th: "ดุลยภาพ FFS · Capitation · DRG · P4P", en: "Blended Payment & P4P Balance" },
      ],
    },
  };

  /* ---------- Helper Utilities ---------- */
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatSafeRich(s) {
    let out = escapeHtml(s);
    out = out.replace(/\*\*([^*\n]{1,220})\*\*/g, "<strong>$1</strong>");
    out = out.replace(/`([^`\n]{1,140})`/g, "<code>$1</code>");
    return out;
  }

  function formatCuratedHtml(s) {
    // Convert inline backticks in curated strings to <code> while preserving trusted <strong> tags
    return String(s || "").replace(/`([^`\n]{1,140})`/g, "<code>$1</code>");
  }

  function getLangPref() {
    try {
      const v = localStorage.getItem(LANG_PREF_STORAGE);
      return v === "th" || v === "en" || v === "both" ? v : "both";
    } catch (_) {
      return "both";
    }
  }

  function setLangPref(v) {
    try {
      localStorage.setItem(LANG_PREF_STORAGE, v);
    } catch (_) {
      /* ignore */
    }
  }

  function parseModCodeFromDocId(docId) {
    const m = String(docId || "").trim().match(/^(ST1|HS[1-6])/i);
    return m ? m[1].toUpperCase() : "";
  }

  function detectModCodeFromContainer(container, explicitDocId) {
    const direct = parseModCodeFromDocId(
      explicitDocId || (container && container.dataset && container.dataset.docId) || ""
    );
    if (direct) return direct;
    const h1 =
      (container && container.querySelector && container.querySelector(".doc-h1")) ||
      document.querySelector("#textbookProseContainer .doc-h1");
    if (h1) {
      const m = (h1.textContent || "").trim().match(/^(ST1|HS[1-6])\b/i);
      if (m) return m[1].toUpperCase();
    }
    return "";
  }

  function matchHeadingToSectionKey(modCode, headingText) {
    if (!modCode || !MODULE_META[modCode]) return "";
    const clean = String(headingText || "").replace(/\s+/g, " ").trim();
    // Skip non-content utility sections
    if (/^(วัตถุประสงค์|ประเด็นอภิปราย|เชิงอรรถ|แนวคำตอบ|เอกสารอ้างอิง|คำชี้แจง)/i.test(clean)) {
      return "";
    }
    if (/^(บทสรุป|สรุป)(\s|\(|:|$)/.test(clean)) {
      const k = `${modCode}:sum`;
      return TAKEAWAYS_DB[k] ? k : "";
    }
    const m = clean.match(/^\(?(\d+)\)?(?:[.)]|\s)\s*/);
    if (m) {
      const secNum = m[1];
      const k = `${modCode}:${secNum}`;
      return TAKEAWAYS_DB[k] ? k : "";
    }
    return "";
  }

  function matchSubheadingToSectionKey(modCode, h3Text, h3Id) {
    if (!modCode || !MODULE_META[modCode]) return "";
    if (modCode === "HS1" && h3Id) {
      if (h3Id === "hs1c-h-1_2") return "HS1:2";
      if (h3Id === "hs1c-h-1_4") return "HS1:3";
      if (h3Id === "hs1c-h-1_1" || h3Id === "hs1c-h-1_3") return "HS1:1";
    }
    const clean = String(h3Text || "").replace(/\s+/g, " ").trim();
    const m = clean.match(/^(\d+)\.\d+\b/);
    if (m) {
      const k = `${modCode}:${m[1]}`;
      return TAKEAWAYS_DB[k] ? k : "";
    }
    return "";
  }

  function resolveSectionAnchorInDoc(docId, modCode, secId) {
    const docs = (window.RACM_HS_DATA && window.RACM_HS_DATA.docs) || [];
    const doc = docs.find((d) => d.id === docId);
    if (!doc || !doc.html) return "";

    // Special exact mapping for HS1-CONCISE (compressed 1.1–1.4 structure)
    if (docId === "HS1-CONCISE") {
      if (secId === "1") return "hs1c-h-1_1";
      if (secId === "2") return "hs1c-h-1_2";
      if (secId === "3") return "hs1c-h-1_4";
      return "hs1c-sec-2";
    }

    const tmp = document.createElement("div");
    tmp.innerHTML = doc.html;
    const h2s = [...tmp.querySelectorAll("h2, h3")];
    for (const h of h2s) {
      if (h.classList && h.classList.contains("doc-h1")) continue;
      if (h.tagName === "H2") {
        const matched = matchHeadingToSectionKey(modCode, h.textContent || "");
        if (matched === `${modCode}:${secId}` && h.id) return h.id;
      }
    }
    for (const h of h2s) {
      if (h.tagName === "H3" && secId !== "sum") {
        const matchedSub = matchSubheadingToSectionKey(modCode, h.textContent || "", h.id || "");
        if (matchedSub === `${modCode}:${secId}` && h.id) return h.id;
      }
    }
    return "";
  }

  /* ==========================================================================
   * POPUP MODAL CONTROLLER — WHAT YOU SHOULD KNOW PER TABLE SPECIFICATION
   * ========================================================================== */
  const SPEC_SVG =
    '<svg class="kt-icon-svg" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
    '<rect x="3.5" y="2.8" width="13" height="14.4" rx="2.2" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M6.8 7.2H13.2M6.8 10.4H13.2M6.8 13.6H10.8" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>' +
    "</svg>";

  const FLOW_SVG =
    '<svg class="kt-icon-svg" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
    '<circle cx="4.2" cy="10" r="2.1" stroke="currentColor" stroke-width="1.6"/>' +
    '<circle cx="10" cy="5.2" r="2.1" stroke="currentColor" stroke-width="1.6"/>' +
    '<circle cx="15.8" cy="10" r="2.1" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M6.1 8.8L8.2 6.5M11.8 6.5L13.9 8.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    "</svg>";

  let modalBackdrop = null;
  let activeKtKey = "HS6:1";
  let navHistoryStack = [];

  function ensureModalDOM() {
    if (modalBackdrop && document.body.contains(modalBackdrop)) return modalBackdrop;
    modalBackdrop = document.createElement("div");
    modalBackdrop.id = "ktModalBackdrop";
    modalBackdrop.className = "kt-modal-backdrop hsd-no-print";
    modalBackdrop.hidden = true;
    modalBackdrop.setAttribute("role", "dialog");
    modalBackdrop.setAttribute("aria-modal", "true");
    modalBackdrop.setAttribute("aria-labelledby", "ktModalTitle");

    modalBackdrop.addEventListener("click", (ev) => {
      if (ev.target === modalBackdrop) closeTakeawayModal();
    });

    document.body.appendChild(modalBackdrop);
    return modalBackdrop;
  }

  function closeTakeawayModal() {
    if (!modalBackdrop) return;
    modalBackdrop.hidden = true;
    document.body.classList.remove("kt-modal-open");
  }

  function getAdjacentKeys(ktKey) {
    const [modCode, secId] = String(ktKey || "").split(":");
    const mod = MODULE_META[modCode];
    if (!mod) return { prevKey: "", nextKey: "" };
    const idx = mod.sections.indexOf(secId);
    if (idx === -1) return { prevKey: "", nextKey: "" };
    return {
      prevKey: idx > 0 ? `${modCode}:${mod.sections[idx - 1]}` : "",
      nextKey: idx < mod.sections.length - 1 ? `${modCode}:${mod.sections[idx + 1]}` : "",
    };
  }

  function jumpToSectionInPortal(ktKey, preferFormat) {
    const [modCode, secId] = String(ktKey || "").split(":");
    if (!modCode) return;
    closeTakeawayModal();

    const targetDocId = preferFormat === "concise" ? `${modCode}-CONCISE` : modCode;
    const anchorId = resolveSectionAnchorInDoc(targetDocId, modCode, secId || "1");

    // If no explicit format requested and the current textbook reader already shows this module, scroll directly
    if (!preferFormat) {
      const existingBar = document.querySelector(`#textbookProseContainer .sec-kt-bar[data-kt-key="${ktKey}"]`);
      if (existingBar) {
        const heading = existingBar.previousElementSibling || existingBar;
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    if (typeof window.racmOpenTextbookDoc === "function") {
      window.racmOpenTextbookDoc(targetDocId, anchorId);
      return;
    }

    setTimeout(() => {
      const targetBar = document.querySelector(`#textbookProseContainer .sec-kt-bar[data-kt-key="${ktKey}"]`);
      if (targetBar) {
        const heading = targetBar.previousElementSibling || targetBar;
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 180);
  }

  function openSelfQuizFromModal(modCode) {
    closeTakeawayModal();
    if (window.RACM_PORTAL && typeof window.RACM_PORTAL.openSelfQuizForModule === "function") {
      window.RACM_PORTAL.openSelfQuizForModule(modCode, "qa");
    }
  }

  function openCaseDiscussionFromModal(modCode) {
    if (!/^HS[1-6]$/i.test(modCode || "")) return;
    const targetHash = `#hs-discussion-${modCode.toUpperCase()}`;
    closeTakeawayModal();
    if (window.location.hash === targetHash) {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else {
      window.location.hash = targetHash;
    }
  }

  function openTakeawayModal(ktKey, pushHistory) {
    if (!TAKEAWAYS_DB[ktKey]) return;
    if (pushHistory && activeKtKey && activeKtKey !== ktKey) {
      navHistoryStack.push(activeKtKey);
      if (navHistoryStack.length > 10) navHistoryStack.shift();
    } else if (!pushHistory) {
      navHistoryStack = [];
    }
    activeKtKey = ktKey;
    ensureModalDOM();
    renderModalContents();
    modalBackdrop.hidden = false;
    document.body.classList.add("kt-modal-open");
  }

  function renderModalContents() {
    if (!modalBackdrop) return;
    const activeData = TAKEAWAYS_DB[activeKtKey];
    if (!activeData) return;

    const [modCode] = activeKtKey.split(":");
    const modMeta = MODULE_META[modCode];
    const isHsMod = /^HS[1-6]$/.test(modCode);
    const lang = getLangPref();
    const showTH = lang === "both" || lang === "th";
    const showEN = lang === "both" || lang === "en";
    const { prevKey, nextKey } = getAdjacentKeys(activeKtKey);
    const prevEntry = prevKey ? TAKEAWAYS_DB[prevKey] : null;
    const nextEntry = nextKey ? TAKEAWAYS_DB[nextKey] : null;

    const specBadgeText = showTH ? modMeta.specBadgeTH : modMeta.specBadgeEN;

    // Build section stepper pills across the current module
    const stepperHtml = modMeta.sections
      .map((s) => {
        const k = `${modCode}:${s}`;
        const isAct = k === activeKtKey;
        const lbl = s === "sum" ? (showTH ? "สรุปทั้งบท" : "Summary") : s;
        const tEntry = TAKEAWAYS_DB[k];
        const tip = tEntry ? (showTH ? tEntry.titleTH : tEntry.titleEN) : k;
        return `<button type="button" class="kt-step-pill${isAct ? " is-active" : ""}" data-kt-switch="${escapeHtml(k)}" title="${escapeHtml(tip)}">${escapeHtml(lbl)}</button>`;
      })
      .join('<span class="kt-step-arrow" aria-hidden="true">→</span>');

    // Build all-module spine strip (ST1 -> HS1 -> HS2 -> HS3 -> HS4 -> HS5 -> HS6)
    const moduleSpineHtml = Object.values(MODULE_META)
      .sort((a, b) => a.order - b.order)
      .map((m) => {
        const isCurrentMod = m.code === modCode;
        const firstKey = `${m.code}:1`;
        const wTxt = m.specWeight && m.specWeight !== "รากฐาน" ? ` (${m.specWeight})` : "";
        return `<button type="button" class="kt-mod-chip${isCurrentMod ? " is-current" : ""}" data-kt-switch-push="${escapeHtml(firstKey)}" title="${escapeHtml(m.shortTH)} — ${escapeHtml(m.specBadgeTH)}">${escapeHtml(m.code + wTxt)}</button>`;
      })
      .join('<span class="kt-spine-sep" aria-hidden="true">·</span>');

    // Back breadcrumb if navigated across modules/sections
    const backCrumbHtml = navHistoryStack.length
      ? `<button type="button" class="kt-back-crumb" data-kt-pop-history="1">← กลับไป ${escapeHtml(navHistoryStack[navHistoryStack.length - 1].replace(":sum", " · สรุป").replace(":", " · หมวด "))}</button>`
      : "";

    // Bullets HTML — What You Should Know for Case Discussion & Table Spec
    const bulletsHtml = (activeData.bullets || [])
      .map((b, idx) => {
        const thLine = formatCuratedHtml(b.th);
        const enLine = formatCuratedHtml(b.en);
        return `
          <li class="kt-bullet-item">
            <span class="kt-bullet-num">${String(idx + 1).padStart(2, "0")}</span>
            <div class="kt-bullet-copy">
              ${showTH ? `<div class="kt-bullet-th">${thLine}</div>` : ""}
              ${showEN ? `<div class="kt-bullet-en">${enLine}</div>` : ""}
            </div>
          </li>`;
      })
      .join("");

    // Analytical Lens for Case Discussion callout (when present on HS1–HS6 entries)
    const caseLensHtml =
      activeData.caseLensTH || activeData.caseLensEN
        ? `<div class="kt-case-lens-box">
             <div class="kt-case-lens-kicker">🎯 แนวทางประยุกต์ตอบโจทย์ CASE DISCUSSION · ANALYTICAL LENS FOR CASE DISCUSSION</div>
             ${showTH && activeData.caseLensTH ? `<p class="kt-case-lens-th">${formatCuratedHtml(activeData.caseLensTH)}</p>` : ""}
             ${showEN && activeData.caseLensEN ? `<p class="kt-case-lens-en">${formatCuratedHtml(activeData.caseLensEN)}</p>` : ""}
           </div>`
        : "";

    const hsdJumpBtnHtml = isHsMod
      ? `<button type="button" class="kt-study-jump-btn is-hsd" data-kt-open-hsd="${escapeHtml(modCode)}">💬 ฝึกวิเคราะห์ Case Discussion ${escapeHtml(modCode)}${modMeta.caseCountTH ? ` (${escapeHtml(modMeta.caseCountTH)})` : ""} →</button>`
      : "";

    // Within-module 3-step alignment cards (Prev -> Current -> Next)
    const prevCardHtml = prevEntry
      ? `<button type="button" class="kt-flow-node is-neighbor" data-kt-switch="${escapeHtml(prevKey)}">
           <span class="kt-flow-dir">← พื้นฐานก่อนหน้า (${escapeHtml(prevKey.replace(":", " · หมวด "))})</span>
           <strong class="kt-flow-node-title">${escapeHtml(showTH ? prevEntry.titleTH : prevEntry.titleEN)}</strong>
         </button>`
      : `<div class="kt-flow-node is-origin">
           <span class="kt-flow-dir">${escapeHtml(isHsMod ? `ขอบเขตรวมของบท ${modCode} สำหรับ Case Discussion & Table Spec` : `ขอบเขตรวมของบท ${modCode}`)}</span>
           <strong class="kt-flow-node-title">${escapeHtml(showTH ? modMeta.arcTH : modMeta.arcEN)}</strong>
         </div>`;

    const nextCardHtml = nextEntry
      ? `<button type="button" class="kt-flow-node is-neighbor" data-kt-switch="${escapeHtml(nextKey)}">
           <span class="kt-flow-dir">เชื่อมต่อไปยัง (${escapeHtml(nextKey.replace(":sum", " · สรุปทั้งบท").replace(":", " · หมวด "))}) →</span>
           <strong class="kt-flow-node-title">${escapeHtml(showTH ? nextEntry.titleTH : nextEntry.titleEN)}</strong>
         </button>`
      : `<div class="kt-flow-node is-origin">
           <span class="kt-flow-dir">การนำไปประยุกต์ท้ายบท ${escapeHtml(modCode)}</span>
           <strong class="kt-flow-node-title">${escapeHtml(showTH ? "พร้อมลงมือวิเคราะห์โจทย์ Case Discussion ประจำคาบ จดสรุป A4 Open Note และทำแบบฝึกหัดทบทวน" : "Ready for Classroom Case Discussion, A4 Open-Note synthesis & Self-Quiz")}</strong>
         </div>`;

    // Cross-HS alignment cards
    const crossHtml = (activeData.crossLinks || [])
      .map(
        (c) => `
        <div class="kt-cross-card">
          <div class="kt-cross-top">
            <button type="button" class="kt-cross-pill" data-kt-switch-push="${escapeHtml(c.target)}">
              ${escapeHtml(showTH ? c.labelTH : c.labelEN)} →
            </button>
            <button type="button" class="kt-cross-jump-doc" data-kt-jump-concise="${escapeHtml(c.target)}" title="เปิดอ่านฉบับย่อของหัวข้อนี้">
              ⚡ ฉบับย่อ
            </button>
            <button type="button" class="kt-cross-jump-doc" data-kt-jump-full="${escapeHtml(c.target)}" title="เปิดอ่านฉบับเต็มของหัวข้อนี้">
              📘 ฉบับเต็ม
            </button>
          </div>
          ${showTH ? `<p class="kt-cross-why-th">${formatCuratedHtml(c.whyTH)}</p>` : ""}
          ${showEN ? `<p class="kt-cross-why-en">${formatCuratedHtml(c.whyEN)}</p>` : ""}
        </div>`
      )
      .join("");

    // Keywords chips at bottom
    const keywordsHtml = (activeData.keywords || [])
      .map((kw) => {
        const label =
          lang === "th"
            ? kw.th
            : lang === "en"
            ? kw.en
            : `${kw.th} · ${kw.en}`;
        return `<span class="kt-kw-chip">${escapeHtml(label)}</span>`;
      })
      .join("");

    modalBackdrop.innerHTML = `
      <div class="kt-modal-sheet" role="document">
        <header class="kt-modal-head">
          <div class="kt-head-top-row">
            <div class="kt-head-badges">
              <span class="kt-mod-badge">${escapeHtml(modCode)}</span>
              <span class="kt-sec-label">${escapeHtml(showTH ? activeData.secLabelTH : activeData.secLabelEN)}</span>
              <span class="kt-carbon-badge" title="กรอบสิ่งที่ควรรู้สำหรับ Case Discussion & Table Specification รายวิชา RACM 303">${SPEC_SVG}<span>${escapeHtml(specBadgeText)}</span></span>
              ${backCrumbHtml}
            </div>
            <div class="kt-head-controls">
              <div class="racm-unav-pair is-compact" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่">
                <button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button>
                <button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button>
              </div>
              <div class="kt-lang-seg" role="group" aria-label="ตัวเลือกภาษา">
                <button type="button" class="kt-lang-btn${lang === "both" ? " is-active" : ""}" data-kt-lang="both">TH + EN</button>
                <button type="button" class="kt-lang-btn${lang === "th" ? " is-active" : ""}" data-kt-lang="th">ไทย</button>
                <button type="button" class="kt-lang-btn${lang === "en" ? " is-active" : ""}" data-kt-lang="en">EN</button>
              </div>
              <button type="button" class="kt-close-btn" data-kt-close="1" aria-label="ปิดหน้าต่าง">✕</button>
            </div>
          </div>

          <h3 id="ktModalTitle" class="kt-modal-title">
            ${showTH ? `<span class="kt-title-th">${escapeHtml(activeData.titleTH)}</span>` : ""}
            ${showEN ? `<span class="kt-title-en">${escapeHtml(activeData.titleEN)}</span>` : ""}
          </h3>

          <div class="kt-nav-bars">
            <div class="kt-stepper-row">
              <span class="kt-bar-caption">หมวดในบท ${escapeHtml(modCode)}:</span>
              <div class="kt-stepper-pills">${stepperHtml}</div>
            </div>
            <div class="kt-spine-row">
              <span class="kt-bar-caption">Case &amp; Spec ทั้งชุด:</span>
              <div class="kt-spine-pills">${moduleSpineHtml}</div>
            </div>
          </div>
        </header>

        <div class="kt-modal-body">
          <!-- 1. Core Competency / Learning Objective Statement -->
          <section class="kt-summary-box" aria-label="ขอบเขตความเข้าใจเพื่อตอบ Case Discussion และ Table Spec">
            <div class="kt-section-kicker">${isHsMod ? "CASE DISCUSSION &amp; TABLE SPEC COMPETENCY · เป้าหมายความเข้าใจที่ต้องทำได้ในหมวดนี้" : "LEARNING OBJECTIVE &amp; FOUNDATIONAL SCOPE · เป้าหมายความเข้าใจที่ต้องทำได้ในหมวดนี้"}</div>
            ${showTH ? `<p class="kt-summary-th">${escapeHtml(activeData.summaryTH)}</p>` : ""}
            ${showEN ? `<p class="kt-summary-en">${escapeHtml(activeData.summaryEN)}</p>` : ""}
          </section>

          <!-- 2. What You Should Know Bullets + Case Discussion Lens -->
          <section class="kt-block" aria-label="ประเด็นสำคัญที่ควรรู้เพื่อตอบ Case Discussion และ Table Spec">
            <div class="kt-section-kicker">${isHsMod ? "WHAT YOU SHOULD KNOW FOR CASE DISCUSSION · สิ่งที่ควรรู้ แยกแยะ และนำไปใช้ตอบกรณีศึกษาได้จริง" : "WHAT YOU SHOULD KNOW · ประเด็นสำคัญที่ควรรู้ แยกแยะ และนำไปใช้ได้จริง"}</div>
            <ul class="kt-bullet-list">
              ${bulletsHtml}
            </ul>
            ${caseLensHtml}
            <div class="kt-study-jump-row">
              ${hsdJumpBtnHtml}
              <button type="button" class="kt-study-jump-btn is-concise" data-kt-jump-concise="${escapeHtml(activeKtKey)}">⚡ เปิดอ่านส่วนนี้ในฉบับย่อ (${escapeHtml(modCode)} Abridged) →</button>
              <button type="button" class="kt-study-jump-btn is-full" data-kt-jump-full="${escapeHtml(activeKtKey)}">📘 เปิดอ่านขยายความในฉบับเต็ม (${escapeHtml(modCode)} Full) →</button>
              <button type="button" class="kt-study-jump-btn is-quiz" data-kt-open-quiz="${escapeHtml(modCode)}">🧠 ลองทำโจทย์ทบทวนบท ${escapeHtml(modCode)} →</button>
            </div>
          </section>

          ${
            window.RACM_HE_VIDEO_BRIDGE &&
            typeof window.RACM_HE_VIDEO_BRIDGE.renderSectionChipsHtml === "function"
              ? window.RACM_HE_VIDEO_BRIDGE.renderSectionChipsHtml(activeKtKey, lang)
              : ""
          }

          <!-- 3. Curriculum & Case Discussion Alignment -->
          <section class="kt-block kt-flow-section" aria-label="ความเชื่อมโยงตามโครงสร้างหลักสูตร">
            <div class="kt-section-kicker">${FLOW_SVG}<span>CURRICULUM &amp; CASE DISCUSSION ALIGNMENT · ความเชื่อมโยงในบทและข้ามบทเรียน</span></div>

            <div class="kt-within-flow-grid">
              ${prevCardHtml}
              <div class="kt-flow-node is-current">
                <span class="kt-flow-dir">จุดเน้นของหมวดนี้ในโครงสร้างเนื้อหา (${escapeHtml(activeKtKey.replace(":sum", " · สรุปทั้งบท").replace(":", " · หมวด "))})</span>
                ${showTH ? `<p class="kt-flow-role-th">${formatCuratedHtml(activeData.flowRoleTH)}</p>` : ""}
                ${showEN ? `<p class="kt-flow-role-en">${formatCuratedHtml(activeData.flowRoleEN)}</p>` : ""}
              </div>
              ${nextCardHtml}
            </div>

            ${
              crossHtml
                ? `<div class="kt-cross-wrap">
                     <div class="kt-cross-heading">ประเด็นเชื่อมโยงข้ามบทที่ใช้ร่วมกันใน Case Discussion, ภาคสนาม และข้อสอบ (ST1 &amp; HS1–HS6)</div>
                     <div class="kt-cross-grid">${crossHtml}</div>
                   </div>`
                : ""
            }
          </section>

          <!-- 4. Core Terms for Case Discussion & Open-Note A4 -->
          <section class="kt-block kt-keywords-section" aria-label="คำสำคัญสำหรับ Case Discussion และเตรียมสอบ Open Note">
            <div class="kt-section-kicker">CORE TERMS FOR CASE DISCUSSION &amp; OPEN NOTE (A4) · คำสำคัญและกรอบแนวคิดที่ควรแม่นยำ</div>
            <div class="kt-kw-row">${keywordsHtml}</div>
          </section>
        </div>

        <footer class="kt-modal-foot">
          <div class="kt-foot-main">
            <div class="kt-foot-nav">
              <button type="button" class="btn sm" data-kt-switch="${escapeHtml(prevKey)}" ${prevKey ? "" : "disabled"}>← หมวดก่อนหน้า</button>
              <button type="button" class="btn sm" data-kt-switch="${escapeHtml(nextKey)}" ${nextKey ? "" : "disabled"}>หมวดถัดไป →</button>
              <button type="button" class="btn sm" data-kt-jump-doc="${escapeHtml(activeKtKey)}">ไปยังหัวข้อนี้ในหน้าปัจจุบัน</button>
            </div>
            <div class="kt-foot-ai-btns">
              <button type="button" class="btn sm teal" data-kt-jump-concise="${escapeHtml(activeKtKey)}">⚡ อ่านฉบับย่อหมวดนี้</button>
              <button type="button" class="btn sm primary" data-kt-jump-full="${escapeHtml(activeKtKey)}">📘 อ่านฉบับเต็มหมวดนี้</button>
            </div>
          </div>
        </footer>
      </div>
    `;
  }

  /* ---------- Prose Enhancement: Inject Section Case Discussion & Table Spec Trigger Buttons ---------- */
  function createTriggerBar(ktKey, compactLabel) {
    const entry = TAKEAWAYS_DB[ktKey];
    if (!entry) return null;
    const [modCode] = String(ktKey || "").split(":");
    const modMeta = MODULE_META[modCode] || {};
    const pillBadge = modMeta.specPillTH || "Case + Spec · TH/EN";

    const bar = document.createElement("div");
    bar.className = "sec-kt-bar hsd-no-print";
    bar.setAttribute("data-kt-key", ktKey);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sec-kt-btn";
    btn.setAttribute("data-kt-open", ktKey);
    btn.innerHTML =
      `${SPEC_SVG}` +
      `<span class="sec-kt-btn-main">${escapeHtml(compactLabel || "ประเด็นที่ควรรู้ประจำหมวด · เตรียมตอบ Case Discussion & Table Spec")}</span>` +
      `<span class="sec-kt-btn-model">${escapeHtml(pillBadge)}</span>`;

    bar.appendChild(btn);
    return bar;
  }

  function enhanceProse(proseContainer, explicitDocId) {
    if (!proseContainer || !proseContainer.querySelectorAll) return;
    const modCode = detectModCodeFromContainer(proseContainer, explicitDocId);
    if (!modCode || !MODULE_META[modCode]) return;
    const isHsMod = /^HS[1-6]$/.test(modCode);

    // 1. Add overview Case Discussion & Table Specification Scope bar beneath h2.doc-h1 if present (Scroll reader)
    const docH1 = proseContainer.querySelector("h2.doc-h1, .doc-h1");
    if (docH1 && !proseContainer.querySelector(".doc-kt-overview-bar")) {
      const mod = MODULE_META[modCode];
      const firstKey = `${modCode}:1`;
      if (TAKEAWAYS_DB[firstKey]) {
        const badgeLabel = isHsMod
          ? `กรอบสิ่งที่ควรรู้สำหรับ Case Discussion & Table Spec · ${modCode} (${mod.caseCountTH ? `${mod.caseCountTH} · ` : ""}สัดส่วนข้อสอบ ${mod.specWeight} · Open Note A4)`
          : `กรอบสิ่งที่ควรรู้ตามโครงสร้างรายวิชา · ${modCode} (รากฐานคิดเชิงระบบเชื่อม HS1–HS6)`;
        const ov = document.createElement("div");
        ov.className = "doc-kt-overview-bar hsd-no-print";
        ov.innerHTML = `
          <div class="doc-kt-ov-copy">
            <span class="doc-kt-ov-badge">${SPEC_SVG}<span>${escapeHtml(badgeLabel)}</span></span>
            <span class="doc-kt-ov-text">${escapeHtml(mod.arcTH)}</span>
          </div>
          <button type="button" class="sec-kt-btn is-overview" data-kt-open="${escapeHtml(firstKey)}">
            ${FLOW_SVG}
            <span class="sec-kt-btn-main">ดูประเด็นที่ควรรู้ครบทุกหมวด (${mod.sections.length - 1} หมวด)</span>
          </button>
        `;
        // Insert right after the author/date header paragraphs following doc-h1
        let anchor = docH1;
        while (
          anchor.nextElementSibling &&
          anchor.nextElementSibling.tagName === "P" &&
          (anchor.nextElementSibling.textContent || "").trim().length < 130
        ) {
          anchor = anchor.nextElementSibling;
        }
        anchor.insertAdjacentElement("afterend", ov);
      }
    }

    // 2. Inject "ประเด็นที่ควรรู้" button right after every numbered H2 and Conclusion H2
    const h2List = [...proseContainer.querySelectorAll("h2")];
    let injectedAny = false;
    h2List.forEach((h2) => {
      if (h2.classList && h2.classList.contains("doc-h1")) return;
      if (h2.nextElementSibling && h2.nextElementSibling.classList.contains("sec-kt-bar")) {
        injectedAny = true;
        return;
      }
      const ktKey = matchHeadingToSectionKey(modCode, h2.textContent || "");
      if (!ktKey) return;
      const isSum = ktKey.endsWith(":sum");
      const bar = createTriggerBar(
        ktKey,
        isHsMod
          ? isSum
            ? "สรุปสิ่งที่ควรรู้ทั้งบท · เช็กลิสต์ก่อนทำ Case Discussion & Open Note A4"
            : "ประเด็นที่ควรรู้ประจำหมวด · เตรียมตอบ Case Discussion & Table Spec"
          : isSum
          ? "สรุปสิ่งที่ควรรู้ทั้งบท · รากฐานคิดเชิงระบบเชื่อม HS1–HS6"
          : "ประเด็นที่ควรรู้ประจำหมวด · รากฐานการคิดเชิงระบบ"
      );
      if (bar) {
        h2.insertAdjacentElement("afterend", bar);
        injectedAny = true;
      }
    });

    // 2b. Special handling for HS1-CONCISE (compressed 1.1–1.4 under single H2): inject HS1:2 and HS1:3 on 1.2 and 1.4
    if (modCode === "HS1") {
      const hs1ConciseMap = { "hs1c-h-1_2": "HS1:2", "hs1c-h-1_4": "HS1:3" };
      [...proseContainer.querySelectorAll("h3")].forEach((h3) => {
        const mappedKey = h3.id && hs1ConciseMap[h3.id];
        if (!mappedKey) return;
        if (h3.nextElementSibling && h3.nextElementSibling.classList.contains("sec-kt-bar")) {
          injectedAny = true;
          return;
        }
        const bar = createTriggerBar(
          mappedKey,
          "ประเด็นที่ควรรู้ประจำหมวด · เตรียมตอบ Case Discussion & Table Spec"
        );
        if (bar) {
          h3.insertAdjacentElement("afterend", bar);
          injectedAny = true;
        }
      });
    }

    // 3. In 16:9 Slide Deck mode, sub-slides may begin with an H3 (e.g., "1.2 ...", "3.1 ...") without an H2
    if (
      !injectedAny &&
      proseContainer.classList &&
      proseContainer.classList.contains("deck-slide-canvas") &&
      !proseContainer.querySelector(".sec-kt-bar")
    ) {
      const firstH3 = proseContainer.querySelector("h3");
      if (firstH3) {
        const ktKey = matchSubheadingToSectionKey(modCode, firstH3.textContent || "", firstH3.id || "");
        if (ktKey) {
          const bar = createTriggerBar(
            ktKey,
            isHsMod
              ? "ประเด็นที่ควรรู้ของหมวดหลักนี้ · เตรียมตอบ Case Discussion & Table Spec"
              : "ประเด็นที่ควรรู้ของหมวดหลักนี้ · รากฐานการคิดเชิงระบบ"
          );
          if (bar) firstH3.insertAdjacentElement("afterend", bar);
        }
      }
    }
  }

  /* ---------- Global Delegated Event Listeners ---------- */
  document.addEventListener("click", (ev) => {
    const target = ev.target && ev.target.closest ? ev.target : null;
    if (!target) return;

    const openBtn = target.closest("[data-kt-open]");
    if (openBtn) {
      ev.preventDefault();
      openTakeawayModal(openBtn.getAttribute("data-kt-open"), false);
      return;
    }

    if (!modalBackdrop || modalBackdrop.hidden) return;

    if (target.closest("[data-kt-close]")) {
      ev.preventDefault();
      closeTakeawayModal();
      return;
    }

    const langBtn = target.closest("[data-kt-lang]");
    if (langBtn) {
      ev.preventDefault();
      setLangPref(langBtn.getAttribute("data-kt-lang"));
      renderModalContents();
      return;
    }

    const switchBtn = target.closest("[data-kt-switch]");
    if (switchBtn) {
      ev.preventDefault();
      const k = switchBtn.getAttribute("data-kt-switch");
      if (k && TAKEAWAYS_DB[k]) {
        activeKtKey = k;
        renderModalContents();
      }
      return;
    }

    const pushBtn = target.closest("[data-kt-switch-push]");
    if (pushBtn) {
      ev.preventDefault();
      const k = pushBtn.getAttribute("data-kt-switch-push");
      if (k && TAKEAWAYS_DB[k]) {
        openTakeawayModal(k, true);
      }
      return;
    }

    if (target.closest("[data-kt-pop-history]")) {
      ev.preventDefault();
      const prev = navHistoryStack.pop();
      if (prev && TAKEAWAYS_DB[prev]) {
        activeKtKey = prev;
        renderModalContents();
      }
      return;
    }

    const jumpConciseBtn = target.closest("[data-kt-jump-concise]");
    if (jumpConciseBtn) {
      ev.preventDefault();
      jumpToSectionInPortal(jumpConciseBtn.getAttribute("data-kt-jump-concise"), "concise");
      return;
    }

    const jumpFullBtn = target.closest("[data-kt-jump-full]");
    if (jumpFullBtn) {
      ev.preventDefault();
      jumpToSectionInPortal(jumpFullBtn.getAttribute("data-kt-jump-full"), "full");
      return;
    }

    const jumpBtn = target.closest("[data-kt-jump-doc]");
    if (jumpBtn) {
      ev.preventDefault();
      jumpToSectionInPortal(jumpBtn.getAttribute("data-kt-jump-doc"), "");
      return;
    }

    const openHsdBtn = target.closest("[data-kt-open-hsd]");
    if (openHsdBtn) {
      ev.preventDefault();
      openCaseDiscussionFromModal(openHsdBtn.getAttribute("data-kt-open-hsd"));
      return;
    }

    const openQuizBtn = target.closest("[data-kt-open-quiz]");
    if (openQuizBtn) {
      ev.preventDefault();
      openSelfQuizFromModal(openQuizBtn.getAttribute("data-kt-open-quiz"));
    }
  });

  document.addEventListener("keydown", (ev) => {
    if (!modalBackdrop || modalBackdrop.hidden) return;
    if (ev.key === "Escape") {
      ev.preventDefault();
      closeTakeawayModal();
      return;
    }
    if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/i.test(ev.target.tagName || "")) return;
    if (ev.key === "ArrowLeft") {
      const { prevKey } = getAdjacentKeys(activeKtKey);
      if (prevKey) {
        ev.preventDefault();
        activeKtKey = prevKey;
        renderModalContents();
      }
    } else if (ev.key === "ArrowRight") {
      const { nextKey } = getAdjacentKeys(activeKtKey);
      if (nextKey) {
        ev.preventDefault();
        activeKtKey = nextKey;
        renderModalContents();
      }
    }
  });

  window.RACM_SECTION_TAKEAWAYS = {
    enhanceProse,
    openTakeawayModal,
    closeTakeawayModal,
    TAKEAWAYS_DB,
    MODULE_META,
  };
})();
