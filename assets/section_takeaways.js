(function () {
  "use strict";

  const GEMINI_KEY_STORAGE = "racm303_gemini_api_key_v1";
  const LIVE_CACHE_STORAGE = "racm303_carbon_high_takeaways_v1";
  const LANG_PREF_STORAGE = "racm303_kt_lang_v1";

  /* ---------- Gemini 4 Carbon · High Profile & Fallback Chain ---------- */
  const CARBON_PROFILES = [
    {
      id: "carbon_high",
      model: "gemini-4-carbon",
      thinkingLevel: "HIGH",
      maxOutputTokens: 8192,
      timeoutMs: 55000,
      badge: "Gemini 4 Carbon · High",
      isGemini4: true,
    },
    {
      id: "neon_high",
      model: "gemini-4-neon",
      thinkingLevel: "HIGH",
      maxOutputTokens: 8192,
      timeoutMs: 35000,
      badge: "Gemini 4 Neon · High",
      isGemini4: true,
    },
    {
      id: "hydrogen_high",
      model: "gemini-4-hydrogen",
      thinkingLevel: "HIGH",
      maxOutputTokens: 8192,
      timeoutMs: 30000,
      badge: "Gemini 4 Hydrogen · High",
      isGemini4: true,
    },
    {
      id: "flash_38",
      model: "gemini-3.8-flash",
      thinkingLevel: "MEDIUM",
      maxOutputTokens: 6144,
      timeoutMs: 25000,
      badge: "Gemini 3.8 Flash",
      isGemini4: false,
    },
  ];

  /* ---------- Overarching Curriculum Spine (ST1 -> HS1 -> HS2 -> HS3 -> HS4 -> HS5 -> HS6) ---------- */
  const MODULE_META = {
    ST1: {
      code: "ST1",
      order: 0,
      shortTH: "การคิดเชิงระบบ",
      shortEN: "Systems Thinking",
      arcTH: "กรอบคิดตั้งต้น: มองระบบสุขภาพเป็นระบบซับซ้อนที่ปรับตัวได้ (CAS) และค้นหาคานงัดใต้ภูเขาน้ำแข็ง",
      arcEN: "Foundational Lens: Viewing health systems as Complex Adaptive Systems (CAS) and finding leverage beneath the iceberg",
      sections: ["1", "2", "3", "4", "sum"],
    },
    HS1: {
      code: "HS1",
      order: 1,
      shortTH: "สุขภาพ ปัจจัยกำหนดสุขภาพ และการป้องกัน 4 ระดับ",
      shortEN: "Health, Determinants & 4 Levels of Prevention",
      arcTH: "เป้าหมายต้นทาง: นิยามสุขภาพองค์รวม เข้าใจรากเหง้าความเหลื่อมล้ำ (SDH) และเลือกจุดสกัดโรคครบ 4 ระดับ",
      arcEN: "Upstream Purpose: Defining holistic health, tracing social determinants (SDH), and intervening across 4 prevention levels",
      sections: ["1", "2", "3", "sum"],
    },
    HS2: {
      code: "HS2",
      order: 2,
      shortTH: "หน้าที่ โครงสร้างระบบสุขภาพ และรูปแบบการดูแล",
      shortEN: "Health System Structure, Functions & Models of Care",
      arcTH: "สถาปัตยกรรมระบบ: ประกอบ 6 Building Blocks และออกแบบรูปแบบการดูแลให้ส่งถึงประชาชนอย่างต่อเนื่อง",
      arcEN: "System Architecture: Aligning 6 Building Blocks and Models of Care to translate resources into health outcomes",
      sections: ["1", "2", "3", "4", "5", "sum"],
    },
    HS3: {
      code: "HS3",
      order: 3,
      shortTH: "คุณลักษณะที่พึงประสงค์ของระบบบริการสุขภาพ (EQESaRR)",
      shortEN: "Desirable Characteristics of Health Services (EQESaRR)",
      arcTH: "เข็มทิศประเมินคุณค่า: ชั่งน้ำหนักความเป็นธรรม คุณภาพ ประสิทธิภาพ ธรรมาภิบาล ความสอดคล้อง และความยืดหยุ่น",
      arcEN: "Evaluative Compass: Balancing Equity, Quality, Efficiency, Social Accountability, Relevance, and Resilience",
      sections: ["1", "2", "3", "4", "5", "6", "7", "sum"],
    },
    HS4: {
      code: "HS4",
      order: 4,
      shortTH: "พฤติกรรมสุขภาพ การปรับเปลี่ยนพฤติกรรม และการสร้างเสริมสุขภาพ",
      shortEN: "Health Behaviour, Behaviour Change & Health Promotion",
      arcTH: "พลังฝั่งประชาชนและสิ่งแวดล้อม: เข้าใจพฤติกรรม 3 ระยะ ออกแบบมาตรการ (Nudge & BCW/COM-B) ความรอบรู้ด้านสุขภาพ และกฎบัตรออตตาวา–เจนีวา",
      arcEN: "People & Environment: Health behaviour stages, Nudge & BCW/COM-B design, dual-level Health Literacy, and Ottawa–Geneva Health Promotion",
      sections: ["1", "2", "3", "4", "sum"],
    },
    HS5: {
      code: "HS5",
      order: 5,
      shortTH: "ระบบบริการสุขภาพปฐมภูมิและบริการปฐมภูมิ",
      shortEN: "Primary Health Care (PHC) & Primary Care (PC)",
      arcTH: "ฐานรากของการจัดบริการ: ยึดปฐมภูมิ 4Cs และ EPHFs เป็นแกนกลางเชื่อมคน ชุมชน และระบบหลักประกัน",
      arcEN: "Delivery Backbone: Anchoring person-centered 4Cs Primary Care and population EPHFs at the heart of UHC",
      sections: ["1", "2", "3", "4", "5", "6", "7", "sum"],
    },
    HS6: {
      code: "HS6",
      order: 6,
      shortTH: "การประกันสุขภาพ หลักประกันสุขภาพถ้วนหน้า และกลไกการจ่ายเงิน",
      shortEN: "Health Insurance, UHC & Provider Payment Methods",
      arcTH: "กลไกการคลังคุ้มครองทุกคน: รวมความเสี่ยงด้วยกองทุนภาคบังคับ และออกแบบการจ่ายเงินให้ยั่งยืนโดยไม่ทิ้งกลุ่มเปราะบาง",
      arcEN: "Financing Engine: Pooling risks equitably, overcoming market failures, and aligning provider payment incentives",
      sections: ["1", "2", "3", "4", "5", "sum"],
    },
  };

  /* ==========================================================================
   * GEMINI 4 CARBON · HIGH CONCEPTUALIZED KEY TAKEAWAYS BANK (ALL 44 SECTIONS)
   * Grounded 100% in RACM 303 Teaching Handouts (ST1 & HS1–HS6)
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
      secLabelTH: "หมวดที่ 1 · มิติของการป่วยและนิยามของสุขภาพ",
      secLabelEN: "Section 1 · Disease–Illness–Sickness & Definitions of Health",
      titleTH: "แยกแยะมิติของการป่วย (Disease, Illness, Sickness) และวิวัฒนาการนิยามสุขภาพ",
      titleEN: "Unpacking the Sickness Triad and Holistic Definitions of Health",
      summaryTH: "แพทย์ตรวจพบโรค ผู้ป่วยรับรู้ความทุกข์ และสังคมนิยามบทบาทคนป่วย สุขภาพที่แท้จริงจึงเป็นดุลยภาพองค์รวมทั้งกาย จิต ปัญญา และสังคม",
      summaryEN: "Clinicians diagnose disease, patients experience illness, and society assigns sickness; true health harmonizes physical, mental, spiritual, and social well-being.",
      bullets: [
        {
          th: "<strong>แยก 3 มิติของการป่วยให้ชัด:</strong> `Disease` คือพยาธิสภาพทางการแพทย์ `Illness` คือประสบการณ์ความทุกข์ของผู้ป่วย และ `Sickness` คือบทบาททางสังคม ซึ่งทั้งสามไม่จำเป็นต้องเกิดพร้อมกัน",
          en: "<strong>Master the Triad:</strong> Disease (biomedical pathology), Illness (lived suffering), and Sickness (social role) can occur together or independently.",
        },
        {
          th: "<strong>นิยามสุขภาพก้าวพ้นการไร้โรค:</strong> WHO (1948) ขยายสู่สุขภาวะกาย จิต สังคม และ พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550 เติมมิติ 'ทางปัญญา' เชื่อมโยงเป็นองค์รวมอย่างสมดุล",
          en: "<strong>Beyond Absence of Disease:</strong> WHO (1948) established physical, mental, and social well-being, while Thailand's 2007 National Health Act added spiritual wisdom (`ปัญญา`) in dynamic balance.",
        },
        {
          th: "<strong>สุขภาพคือความสามารถในการปรับตัว:</strong> มุมมองร่วมสมัยเน้นความสามารถของมนุษย์ในการปรับตัวและจัดการตนเองแม้มีโรคเรื้อรังอยู่ร่วมด้วย",
          en: "<strong>Health as Adaptive Capacity:</strong> Contemporary views highlight people's capacity to adapt and self-manage meaningfully even while living with chronic conditions.",
        },
      ],
      flowRoleTH: "วางฐานความเข้าใจว่า 'สุขภาพและการป่วยคืออะไร' ก่อนถามต่อในหมวด 2 ว่า 'อะไรเป็นตัวกำหนดให้คนมีสุขภาพต่างกัน'",
      flowRoleEN: "Clarifies what health and sickness mean before Section 2 asks what shapes unequal health across populations.",
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
          whyTH: "นิยามสุขภาพ 4 มิติตาม พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550 เป็นรากฐานคุณค่าของธรรมนูญสุขภาพไทย",
          whyEN: "Thailand's 4-dimensional holistic health definition anchors the National Health Charter.",
        },
      ],
      keywords: [
        { th: "โรค · ความเจ็บป่วย · บทบาทผู้ป่วย", en: "Disease · Illness · Sickness" },
        { th: "สุขภาวะองค์รวม 4 มิติ", en: "Holistic Well-Being (4 Dimensions)" },
        { th: "พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550", en: "National Health Act B.E. 2550" },
        { th: "ความสามารถในการปรับตัว", en: "Capacity to Adapt" },
      ],
    },
    "HS1:2": {
      secLabelTH: "หมวดที่ 2 · ปัจจัยกำหนดสุขภาพและปัจจัยสังคมกำหนดสุขภาพ",
      secLabelEN: "Section 2 · Determinants of Health & Social Determinants (SDH)",
      titleTH: "สามกรอบแนวคิดปัจจัยกำหนดสุขภาพและต้นตอความไม่เป็นธรรมทางสุขภาพ",
      titleEN: "Three Frameworks of Health Determinants and Structural Health Inequity",
      summaryTH: "สุขภาพไม่ได้สร้างขึ้นในโรงพยาบาลเพียงอย่างเดียว แต่ก่อตัวขึ้นจากสภาพชีวิต การงาน และโครงสร้างสังคมที่ผู้คนเติบโตและอาศัยอยู่",
      summaryEN: "Health is shaped far upstream of hospital walls—by the daily living conditions and social structures in which people live and work.",
      bullets: [
        {
          th: "<strong>กรอบ Dahlgren & Whitehead จำแนกชั้นปัจจัยเป็นวงแหวน:</strong> ตั้งแต่ปัจจัยชีวภาพ พฤติกรรม เครือข่ายชุมชน สภาพชีวิตและการทำงาน ไปจนถึงโครงสร้างเศรษฐกิจสังคมมหภาค",
          en: "<strong>Rainbow Layers (Dahlgren & Whitehead):</strong> Maps determinants from constitutional traits and lifestyle outward to social networks, living/working conditions, and macro-policies.",
        },
        {
          th: "<strong>กรอบ CSDH (Solar & Irwin) อธิบายกลไกความเหลื่อมล้ำ:</strong> แยก 'ปัจจัยเชิงโครงสร้าง' (ฐานะ อำนาจ นโยบาย) ที่กำหนดการได้รับ 'ปัจจัยขั้นกลาง' (ที่อยู่อาศัย งาน พฤติกรรม และระบบบริการสุขภาพ)",
          en: "<strong>Mechanism of Inequity (CSDH):</strong> Shows how socioeconomic governance and social position unevenly distribute intermediary exposures and health system access.",
        },
        {
          th: "<strong>กรอบ Frieden (Health Impact Pyramid) ชี้จุดลงทุนที่ได้ผลกว้างที่สุด:</strong> การปรับปัจจัยเศรษฐกิจสังคมและสิ่งแวดล้อมฐานพีระมิดสร้างผลกระทบระดับประชากรได้ยั่งยืนและพึ่งความพยายามรายบุคคลน้อยที่สุด",
          en: "<strong>Action Leverage (Frieden's Pyramid):</strong> Socioeconomic and default-environment interventions at the pyramid's base yield the broadest population impact with the least individual effort.",
        },
      ],
      flowRoleTH: "ขยายมุมมองจากนิยามสุขภาพในหมวด 1 สู่รากเหง้าต้นน้ำของปัญหาสุขภาพ เพื่อชี้ตำแหน่งการป้องกันโรคทั้ง 4 ระดับในหมวด 3",
      flowRoleEN: "Moves from defining health (Section 1) to mapping its upstream causes, setting up where and when to intervene in Section 3.",
      crossLinks: [
        {
          target: "HS4:4",
          labelTH: "HS4 · หมวด 4 (กฎบัตรออตตาวาควบคุมปัจจัยสุขภาพ)",
          labelEN: "HS4 · Sec 4 (Ottawa Charter & Determinants)",
          whyTH: "การสร้างเสริมสุขภาพมุ่งเสริมพลังและสร้างนโยบายสาธารณะเพื่อจัดการปัจจัยกำหนดสุขภาพนอกภาคการแพทย์",
          whyEN: "Health promotion operationalizes upstream action on determinants through Healthy Public Policy.",
        },
        {
          target: "HS6:1",
          labelTH: "HS6 · หมวด 1 (คุ้มครองครัวเรือนไม่ให้ยากจนจากค่ารักษา)",
          labelEN: "HS6 · Sec 1 (Financial Risk Protection)",
          whyTH: "หลักประกันสุขภาพตัดวงจรที่ความเจ็บป่วยผลักครัวเรือนตกลงสู่ความยากจน (`medical impoverishment`)",
          whyEN: "Health insurance prevents illness from worsening socioeconomic determinants through medical impoverishment.",
        },
      ],
      keywords: [
        { th: "ปัจจัยสังคมกำหนดสุขภาพ", en: "Social Determinants of Health (SDH)" },
        { th: "ปัจจัยเชิงโครงสร้างและปัจจัยขั้นกลาง", en: "Structural & Intermediary Determinants" },
        { th: "พีระมิดผลกระทบทางสุขภาพ", en: "Health Impact Pyramid" },
        { th: "ความไม่เป็นธรรมทางสุขภาพ", en: "Health Inequity" },
      ],
    },
    "HS1:3": {
      secLabelTH: "หมวดที่ 3 · ระดับของการป้องกันโรคทั้งสี่ระดับ",
      secLabelEN: "Section 3 · Four Levels of Disease Prevention",
      titleTH: "การป้องกันปฐมภูมิ ทุติยภูมิ ตติยภูมิ และการป้องกันระดับที่สี่ (Quaternary Prevention)",
      titleEN: "Primary, Secondary, Tertiary, and Quaternary Prevention",
      summaryTH: "ป้องกันให้ถูกระยะช่วยลดโรคและความพิการ แต่การรู้เท่าทันไม่ตรวจรักษาเกินจำเป็นคือหัวใจของการไม่ทำอันตรายผู้รับบริการ",
      summaryEN: "Timely prevention halts disease progression, while wise restraint through quaternary prevention protects people from overmedicalization.",
      bullets: [
        {
          th: "<strong>สามระดับแรกเรียงตามธรรมชาติการดำเนินโรค:</strong> ปฐมภูมิลดอุบัติการณ์ก่อนเกิดโรค ทุติยภูมิตรวจพบระยะไร้สัญญานเพื่อรักษาแต่เนิ่น ๆ และตติยภูมิลดภาวะแทรกซ้อนพร้อมฟื้นฟูสมรรถภาพ",
          en: "<strong>Three Chronological Stages:</strong> Primary prevents onset, Secondary detects asymptomatic disease early, and Tertiary limits disability and restores function.",
        },
        {
          th: "<strong>การป้องกันระดับที่สี่ (Quaternary Prevention) เกิดจากรอยต่อ Disease vs. Illness:</strong> ปกป้องผู้ที่กังวลหรือผู้ป่วยจากการวินิจฉัยเกินจริง (`overdiagnosis`) และการรักษาเกินจำเป็น (`overtreatment`)",
          en: "<strong>Quaternary Prevention Guards Against Harm:</strong> Born from the relational matrix of physician-disease vs. patient-illness, it prevents overdiagnosis and overmedicalization.",
        },
        {
          th: "<strong>จำแนกระดับด้วยการถาม 3 คำถาม:</strong> ใครคือกลุ่มเป้าหมาย มุ่งผลลัพธ์ระยะใดของโรค และต้องระวังผลลบลวง (ระดับ 2) หรือผลบวกลวง (ระดับ 4) มากกว่ากัน",
          en: "<strong>Three Diagnostic Questions:</strong> Identify target population, disease stage, and whether false negatives (Secondary) or false positives (Quaternary) pose the primary risk.",
        },
      ],
      flowRoleTH: "ผสานความเข้าใจ Disease–Illness (หมวด 1) และปัจจัยต้นน้ำ (หมวด 2) ออกมาเป็นกรอบปฏิบัติการป้องกันครบทั้ง 4 ระดับ",
      flowRoleEN: "Integrates the Disease–Illness matrix (Section 1) and upstream determinants (Section 2) into four actionable levels of prevention.",
      crossLinks: [
        {
          target: "HS3:3",
          labelTH: "HS3 · หมวด 3 (ความปลอดภัยในกรอบคุณภาพ STEP)",
          labelEN: "HS3 · Sec 3 (Safety in STEP Quality)",
          whyTH: "การป้องกันระดับที่สี่คุ้มครองความปลอดภัยของผู้ป่วยจากอันตรายของการบริการทางการแพทย์ที่เกินจำเป็น",
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
        { th: "การป้องกันปฐมภูมิ · ทุติยภูมิ · ตติยภูมิ", en: "Primary · Secondary · Tertiary Prevention" },
        { th: "การป้องกันระดับที่สี่", en: "Quaternary Prevention" },
        { th: "การดูแลทางการแพทย์เกินจำเป็น", en: "Overmedicalization & Overdiagnosis" },
        { th: "ผลลบลวงเทียบกับผลบวกลวง", en: "False Negative vs. False Positive" },
      ],
    },
    "HS1:sum": {
      secLabelTH: "บทสรุป · สังเคราะห์สุขภาพ ปัจจัยกำหนดสุขภาพ และการป้องกันโรค",
      secLabelEN: "Synthesis · Health, Determinants, and Prevention",
      titleTH: "บทสรุปความเชื่อมโยงจากความหมายของสุขภาพสู่การป้องกันโรคทั้งสี่ระดับ",
      titleEN: "Connecting Holistic Health, Upstream Determinants, and Four-Level Prevention",
      summaryTH: "เข้าใจคนป่วยอย่างเป็นองค์รวม แก้ปัญหาที่รากเหง้าทางสังคม และเลือกการป้องกันที่พอดี คือเข็มทิศแรกของแพทย์ระบบสุขภาพ",
      summaryEN: "Understanding whole persons, addressing social roots, and calibrating prevention wisely form the physician's first health-systems compass.",
      bullets: [
        {
          th: "<strong>สามเสาหลักของ HS1 ร้อยเรียงเป็นเรื่องเดียวกัน:</strong> นิยามสุขภาพกำหนดเป้าหมาย ปัจจัยกำหนดสุขภาพชี้ต้นเหตุความเหลื่อมล้ำ และการป้องกัน 4 ระดับกำหนดจังหวะการแทรกแซง",
          en: "<strong>One Cohesive Arc:</strong> Health definitions set the goal, determinants reveal upstream inequities, and 4-level prevention guides proportionate action.",
        },
      ],
      flowRoleTH: "สรุปเป้าหมายด้านสุขภาพของประชากรใน HS1 ก่อนก้าวสู่ HS2 เพื่อศึกษาว่า 'ระบบสุขภาพจัดโครงสร้างและหน้าที่อย่างไรเพื่อบรรลุเป้าหมายนี้'",
      flowRoleEN: "Concludes HS1's health goals and transitions to HS2: how health systems are structured and organized to achieve them.",
      crossLinks: [
        {
          target: "HS2:1",
          labelTH: "ต่อยอดสู่ HS2 · หมวด 1 (นิยามและขอบเขตระบบสุขภาพ)",
          labelEN: "Next: HS2 · Sec 1 (Health System Definition)",
          whyTH: "เมื่อรู้ว่าสุขภาพถูกกำหนดจากหลายภาคส่วน จึงต้องนิยามระบบสุขภาพให้ครอบคลุมทุกกิจกรรมที่มุ่งสร้างสุขภาพ",
          whyEN: "Because health has multi-sectoral determinants, HS2 defines the health system around all health-enhancing actions.",
        },
      ],
      keywords: [
        { th: "สุขภาวะองค์รวม", en: "Holistic Well-Being" },
        { th: "การแก้ปัญหาที่ต้นน้ำ", en: "Upstream Action" },
        { th: "การป้องกันโรคที่สมดุล", en: "Proportionate Prevention" },
      ],
    },

    /* -------------------- HS2: Structure, Functions & Models of Care -------------------- */
    "HS2:1": {
      secLabelTH: "หมวดที่ 1 · นิยามและขอบเขตของระบบสุขภาพ",
      secLabelEN: "Section 1 · Definition and Boundaries of Health Systems",
      titleTH: "เกณฑ์เจตนาหลักเพื่อสุขภาพ (Primary Intent) และการทำงานข้ามภาคส่วน",
      titleEN: "Primary Intent Criterion and Intersectoral Responsibility",
      summaryTH: "ระบบสุขภาพกว้างกว่ารั้วโรงพยาบาล เพราะนับรวมทุกองค์กรและกิจกรรมที่มีเจตนาหลักเพื่อคุ้มครองและฟื้นฟูสุขภาพของผู้คน",
      summaryEN: "A health system extends far beyond hospital walls to encompass every actor and action whose primary intent is to promote, restore, or maintain health.",
      bullets: [
        {
          th: "<strong>ใช้เกณฑ์เจตนาหลัก (Primary Intent) ขีดเส้นขอบเขต:</strong> ตามนิยาม WHO (2000) กิจกรรมอย่างกฎหมายคาดเข็มขัดนิรภัยหรือการดูแลผู้ป่วยโดยครอบครัวถือเป็นส่วนหนึ่งของระบบสุขภาพ",
          en: "<strong>Primary-Intent Criterion (WHO 2000):</strong> Road-safety laws and family caregiving belong inside the health system because their primary purpose is health.",
        },
        {
          th: "<strong>แยกกิจกรรมในระบบออกจากการผลักดันข้ามภาคส่วน:</strong> นโยบายด้านอื่น (เช่น การศึกษาหรือการค้า) ที่ส่งผลต่อสุขภาพแต่ไม่มีเจตนาหลักเพื่อสุขภาพ เป็นพื้นที่ที่ระบบสุขภาพต้องเข้าไปร่วมผลักดัน (`intersectoral action`)",
          en: "<strong>Inside vs. Intersectoral Advocacy:</strong> Policies like general education affect health without having health as their primary intent, calling for intersectoral stewardship.",
        },
      ],
      flowRoleTH: "กำหนดเส้นแบ่งขอบเขตของระบบสุขภาพให้ชัดเจน ก่อนแยกโครงสร้างภายในระบบออกเป็นสองวงจรที่สัมพันธ์กันในหมวด 2",
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
      summaryTH: "ระบบบริการสุขภาพกับปัจจัยทางสังคมไม่ได้แยกกันเดิน แต่ส่งแรงสะท้อนถึงกันสองทิศทางตลอดเวลา",
      summaryEN: "Health care delivery and social determinants do not run on separate tracks; they continuously reinforce or buffer each other in both directions.",
      bullets: [
        {
          th: "<strong>ทิศทางที่ 1 ปัจจัยกำหนดสุขภาพสร้างภาระโรคเข้าสู่โรงพยาบาล:</strong> สภาพแวดล้อม เศรษฐกิจ และพฤติกรรมกำหนดว่าใครเจ็บป่วยด้วยโรคใดและเข้าถึงบริการได้ยากง่ายเพียงใด",
          en: "<strong>Determinants Drive Service Demand:</strong> Living conditions and social position shape both disease burden and barriers to seeking care.",
        },
        {
          th: "<strong>ทิศทางที่ 2 ระบบบริการสุขภาพย้อนกลับไปเปลี่ยนปัจจัยกำหนดสุขภาพได้:</strong> ระบบบริการที่เข้าถึงได้โดยไม่ล้มละลายช่วยรักษาความสามารถในการทำงานและฐานะทางเศรษฐกิจของครัวเรือน",
          en: "<strong>Services Reshape Determinants:</strong> Accessible, financially protective care preserves household livelihoods and prevents downward social drift.",
        },
      ],
      flowRoleTH: "เชื่อมโครงสร้างสองซีกของระบบสุขภาพจากหมวด 1 เพื่อปูทางสู่การแยกแยะ 'หน้าที่' กับ 'เป้าหมาย' ของระบบในหมวด 3",
      flowRoleEN: "Connects the health system's service and determinant subsystems, setting up Functions vs. Goals in Section 3.",
      crossLinks: [
        {
          target: "HS1:2",
          labelTH: "HS1 · หมวด 2 (กรอบ CSDH Solar & Irwin)",
          labelEN: "HS1 · Sec 2 (CSDH Framework)",
          whyTH: "ในกรอบ CSDH ระบบบริการสุขภาพทำหน้าที่เป็นปัจจัยขั้นกลางที่ลดผลกระทบจากการป่วยต่อสถานะทางสังคมได้",
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
        { th: "การคุ้มครองฐานะเศรษฐกิจครัวเรือน", en: "Livelihood Protection" },
      ],
    },
    "HS2:3": {
      secLabelTH: "หมวดที่ 3 · หน้าที่ เป้าหมาย และคุณลักษณะที่พึงประสงค์ของระบบสุขภาพ",
      secLabelEN: "Section 3 · Functions, Intrinsic Goals, and Desirable Attributes",
      titleTH: "แยกสิ่งที่ระบบทำ (4 หน้าที่) ออกจากผลลัพธ์ที่ระบบมุ่งหวัง (3 เป้าหมายหลัก)",
      titleEN: "Distinguishing What Systems Do (4 Functions) from Why They Exist (3 Goals)",
      summaryTH: "อย่าสับสนระหว่างเครื่องมือกับจุดหมาย หน้าที่ทั้งสี่คือสิ่งที่ระบบลงมือทำ ส่วนสุขภาพดี การตอบสนอง และความเป็นธรรมทางการเงินคือจุดหมายปลายทาง",
      summaryEN: "Never confuse means with ends: four core functions are what a health system does, while health, responsiveness, and fair financing are why it exists.",
      bullets: [
        {
          th: "<strong>4 หน้าที่หลัก (WHO 2000):</strong> (1) การจัดบริการสุขภาพ (2) การสร้างทรัพยากร (3) การคลังสุขภาพ (ระดมทุน รวมความเสี่ยง ซื้อบริการ) และ (4) การอภิบาลระบบ (`stewardship`)",
          en: "<strong>Four Core Functions (WHO 2000):</strong> Service provision, resource generation, financing (collecting, pooling, purchasing), and stewardship.",
        },
        {
          th: "<strong>3 เป้าหมายสุดท้ายวัดทั้งระดับเฉลี่ยและการกระจายที่เป็นธรรม:</strong> สุขภาพดีขึ้น (`health`) ตอบสนองความคาดหวังที่ไม่ใช่ด้านคลินิก (`responsiveness`) และความเป็นธรรมในการจ่ายเงินสมทบ (`fairness in financial contribution`)",
          en: "<strong>Three Intrinsic Goals (Level & Equity):</strong> Improving health, enhancing non-clinical responsiveness, and ensuring fair financial contribution.",
        },
        {
          th: "<strong>คุณลักษณะที่พึงประสงค์เป็นตัวชี้วัดขั้นกลาง:</strong> การเข้าถึง ความครอบคลุม คุณภาพ ประสิทธิภาพ และความยืดหยุ่น เชื่อมการทำงานของหน้าที่ไปสู่เป้าหมายสุดท้าย",
          en: "<strong>Intermediate Performance Bridges:</strong> Access, quality, efficiency, and resilience translate functional inputs into intrinsic system goals.",
        },
      ],
      flowRoleTH: "วางกรอบวิธีคิด Means vs. Ends ของ WHO (2000) ก่อนแปลงออกเป็นองค์ประกอบปฏิบัติการ 6 Building Blocks ในหมวด 4",
      flowRoleEN: "Establishes WHO 2000's functions-to-goals logic before translating functions into the 6 operational Building Blocks in Section 4.",
      crossLinks: [
        {
          target: "HS3:1",
          labelTH: "HS3 · หมวด 1 (คุณลักษณะพึงประสงค์ในฐานะสัญญาณเตือนล่วงหน้า)",
          labelEN: "HS3 · Sec 1 (Process Attributes as Early Signals)",
          whyTH: "บท HS3 ทั้งบทขยายรายละเอียดของคุณลักษณะขั้นกลาง (EQESaRR) ที่เชื่อมหน้าที่ไปสู่เป้าหมายสุดท้าย",
          whyEN: "All of HS3 elaborates the intermediate process qualities (EQESaRR) introduced here.",
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
        { th: "สี่หน้าที่หลักของระบบสุขภาพ", en: "Four Health System Functions" },
        { th: "การอภิบาลระบบ", en: "Stewardship" },
        { th: "การตอบสนองความคาดหวัง", en: "Responsiveness" },
        { th: "ความเป็นธรรมด้านการคลัง", en: "Fairness in Financial Contribution" },
      ],
    },
    "HS2:4": {
      secLabelTH: "หมวดที่ 4 · หกองค์ประกอบหลัก (6 Building Blocks) และห่วงโซ่ผลลัพธ์",
      secLabelEN: "Section 4 · Six Building Blocks, CAS Dynamics, and Results Chain",
      titleTH: "การทำงานสอดประสานของ 6 Building Blocks และการติดตามประเมินผลตลอดห่วงโซ่",
      titleEN: "Dynamic Interplay of the Six Building Blocks and M&E Results Chain",
      summaryTH: "หกเสาหลักของระบบสุขภาพแข็งแรงเมื่อยึดโยงกันเป็นเครือข่าย การแก้เพียงเสาเดียวโดยลืมการอภิบาลและข้อมูลไม่อาจสร้างผลลัพธ์ที่ยั่งยืนได้",
      summaryEN: "Six building blocks stand strong only as a connected web; strengthening one block in isolation cannot sustain system-wide health gains.",
      bullets: [
        {
          th: "<strong>6 Building Blocks (WHO 2007) แปลงหน้าที่ให้จับต้องได้:</strong> บริการสุขภาพ กำลังคน ข้อมูลสารสนเทศ ยาและเทคโนโลยี การคลังสุขภาพ และภาวะผู้นำ/การอภิบาล",
          en: "<strong>Six Operational Building Blocks (WHO 2007):</strong> Service delivery, workforce, information systems, medical products/technologies, financing, and leadership/governance.",
        },
        {
          th: "<strong>ภาวะผู้นำและข้อมูลเป็นแกนเชื่อมทุกเสา:</strong> ในระบบซับซ้อน (`CAS`) การเพิ่มยาหรือคนโดยขาดระบบข้อมูลและการกำกับดูแลมักไม่เกิดผลลัพธ์ทางสุขภาพจริง",
          en: "<strong>Governance & Information Bind the Web:</strong> Within a CAS, adding drugs or staff without information feedback and governance fails to improve care.",
        },
        {
          th: "<strong>ติดตามประเมินผลตามห่วงโซ่ Input → Output → Outcome → Impact:</strong> ช่วยแยกแยะว่าปัญหาติดขัดที่ทรัพยากร การส่งมอบบริการ ความครอบคลุม หรือผลลัพธ์สุขภาพ",
          en: "<strong>Results-Chain M&E:</strong> Tracing inputs, outputs, outcomes, and impacts pinpoints exactly where implementation bottlenecks arise.",
        },
      ],
      flowRoleTH: "จากภาพรวม 6 เสาหลักของระบบในหมวด 4 จึงซูมเข้าสู่เสาที่ใกล้ชิดแพทย์ที่สุดคือ 'การออกแบบการจัดบริการสุขภาพ' ในหมวด 5",
      flowRoleEN: "Zooms from the 6 system-wide Building Blocks into the block closest to clinical practice—Service Delivery design—in Section 5.",
      crossLinks: [
        {
          target: "ST1:2",
          labelTH: "ST1 · หมวด 2 (ปฏิสัมพันธ์ในระบบซับซ้อน CAS)",
          labelEN: "ST1 · Sec 2 (CAS Interdependence)",
          whyTH: "De Savigny & Adam (2009) ชี้ว่า 6 Building Blocks ต้องอ่านผ่านแว่น CAS เพราะทุกกล่องมีวงจรป้อนกลับถึงกัน",
          whyEN: "Applies CAS thinking so the 6 Building Blocks are managed as dynamic interactions, not static checklists.",
        },
        {
          target: "HS6:2",
          labelTH: "HS6 · หมวด 2 (บทบาทผู้รับประกัน ระบบการคลัง และข้อมูล)",
          labelEN: "HS6 · Sec 2 (Insurer, Financing & Information)",
          whyTH: "ผู้รับประกันเชื่อมเสาการคลัง เสาข้อมูลสารสนเทศ และเสาการจัดบริการเข้าด้วยกันผ่านการซื้อบริการ",
          whyEN: "Third-party insurers link the financing, health information, and service delivery blocks.",
        },
      ],
      keywords: [
        { th: "หกองค์ประกอบหลักของระบบสุขภาพ", en: "WHO Six Building Blocks" },
        { th: "ห่วงโซ่ผลลัพธ์การติดตามประเมินผล", en: "M&E Results Chain" },
        { th: "ภาวะผู้นำและการอภิบาล", en: "Leadership & Governance" },
      ],
    },
    "HS2:5": {
      secLabelTH: "หมวดที่ 5 · การออกแบบการจัดบริการ ระดับบริการ และรูปแบบการดูแล",
      secLabelEN: "Section 5 · Service Delivery Levels & Models of Care",
      titleTH: "การเชื่อมโยงบริการระดับปฐมภูมิ ทุติยภูมิ ตติยภูมิ และรูปแบบการดูแลที่ยึดคนเป็นศูนย์กลาง",
      titleEN: "Integrating Care Levels and Person-Centered Models of Care",
      summaryTH: "โรงพยาบาลตติยภูมิรักษาโรคซับซ้อนได้ดีที่สุดก็ต่อเมื่อมีบริการปฐมภูมิที่เข้มแข็งคอยคัดกรอง ประสาน และดูแลผู้ป่วยต่อเนื่องใกล้บ้าน",
      summaryEN: "Tertiary hospitals excel at complex care only when anchored by strong primary care that coordinates continuous care close to home.",
      bullets: [
        {
          th: "<strong>จำแนกหน่วยบริการและ 4 ระดับการดูแล:</strong> การดูแลตนเองและครอบครัว → ปฐมภูมิ (ด่านแรกต่อเนื่อง) → ทุติยภูมิ → ตติยภูมิ/จตุตถภูมิ ซึ่งต้องมีระบบส่งต่อไป–กลับสองทาง (`two-way referral`)",
          en: "<strong>Four Connected Levels of Care:</strong> Self/family care, primary, secondary, and tertiary care work эффективно only with seamless two-way referral and counter-referral.",
        },
        {
          th: "<strong>รูปแบบการดูแล (Model of Care) ตอบโจทย์ภาระโรคยุคใหม่:</strong> สังคมสูงวัยและโรคเรื้อรังต้องการการดูแลแบบบูรณาการต่อเนื่อง (`integrated people-centred care`) แทนการตั้งรับเป็นครั้งคราว",
          en: "<strong>Models of Care Must Fit Disease Burden:</strong> Aging populations and multimorbidity require integrated, team-based, person-centered models rather than episodic acute visits.",
        },
      ],
      flowRoleTH: "ปิดท้ายบท HS2 ด้วยสถาปัตยกรรมการจัดบริการหน้างาน ซึ่งจะถูกนำไปประเมินคุณค่าด้วยเกณฑ์ EQESaRR ใน HS3 และขยายผลสู่ปฐมภูมิใน HS5",
      flowRoleEN: "Completes HS2's architectural blueprint with frontline Models of Care, setting up quality/equity evaluation in HS3 and PHC deep-dive in HS5.",
      crossLinks: [
        {
          target: "HS5:5",
          labelTH: "HS5 · หมวด 5 (หน้าที่หลัก 4Cs ของบริการปฐมภูมิ)",
          labelEN: "HS5 · Sec 5 (Starfield's 4Cs of Primary Care)",
          whyTH: "บท HS5 ขยายรายละเอียดการออกแบบด่านหน้าระบบบริการและทีมหมอครอบครัวอย่างเจาะลึก",
          whyEN: "HS5 expands primary-level service design into Starfield's 4Cs and Thailand's PCC model.",
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
        { th: "ระดับบริการปฐมภูมิ · ทุติยภูมิ · ตติยภูมิ", en: "Primary · Secondary · Tertiary Care" },
        { th: "รูปแบบการดูแลสุขภาพ", en: "Models of Care" },
        { th: "ระบบส่งต่อสองทาง", en: "Two-Way Referral System" },
        { th: "บริการบูรณาการที่ยึดคนเป็นศูนย์กลาง", en: "Integrated People-Centred Care" },
      ],
    },
    "HS2:sum": {
      secLabelTH: "บทสรุป · สังเคราะห์โครงสร้าง หน้าที่ และการจัดบริการของระบบสุขภาพ",
      secLabelEN: "Synthesis · Structure, Functions, and Models of Care",
      titleTH: "บทสรุปจากขอบเขตระบบสุขภาพสู่การทำงานร่วมกันของ 6 Building Blocks และรูปแบบการดูแล",
      titleEN: "From System Boundaries to Building Blocks and Integrated Care",
      summaryTH: "ระบบสุขภาพที่ดีรู้ขอบเขตความรับผิดชอบ เชื่อมโยงทั้งหกองค์ประกอบอย่างสมดุล และจัดรูปแบบบริการให้ตอบเป้าหมายสุดท้ายของประชาชน",
      summaryEN: "An effective health system honors its broad boundary, orchestrates all six building blocks, and designs care models around intrinsic human goals.",
      bullets: [
        {
          th: "<strong>โครงสร้าง → หน้าที่ → การจัดบริการ → เป้าหมาย:</strong> ทุกการปฏิรูปในระบบสุขภาพต้องตรวจสอบว่าช่วยยกระดับสุขภาพ การตอบสนอง และความเป็นธรรมทางการเงินจริงหรือไม่",
          en: "<strong>Structure → Function → Delivery → Goals:</strong> Every health reform should be judged by whether it advances health, responsiveness, and fair financing.",
        },
      ],
      flowRoleTH: "สรุปสถาปัตยกรรมระบบสุขภาพใน HS2 เพื่อส่งต่อเข้าสู่ HS3: 'เราจะใช้เกณฑ์อะไรวัดว่าระบบบริการสุขภาพทำงานได้ดีและพึงประสงค์เพียงใด'",
      flowRoleEN: "Wraps up HS2's system architecture and hands off to HS3: the evaluative criteria (EQESaRR) for judging health service performance.",
      crossLinks: [
        {
          target: "HS3:1",
          labelTH: "ต่อยอดสู่ HS3 · หมวด 1 (เกณฑ์คุณลักษณะที่พึงประสงค์ EQESaRR)",
          labelEN: "Next: HS3 · Sec 1 (Desirable Characteristics EQESaRR)",
          whyTH: "นำโครงสร้างและกระบวนการของ HS2 มาตั้งเกณฑ์ประเมินคุณภาพและความเป็นธรรม 6 มิติใน HS3",
          whyEN: "Evaluates HS2's service processes using HS3's six-dimensional EQESaRR compass.",
        },
      ],
      keywords: [
        { th: "สถาปัตยกรรมระบบสุขภาพ", en: "Health System Architecture" },
        { th: "หกองค์ประกอบหลัก", en: "Six Building Blocks" },
        { th: "เป้าหมายสุดท้ายของระบบสุขภาพ", en: "Intrinsic Health System Goals" },
      ],
    },

    /* -------------------- HS3: Desirable Characteristics (EQESaRR) -------------------- */
    "HS3:1": {
      secLabelTH: "หมวดที่ 1 · คุณลักษณะที่พึงประสงค์ในฐานะสัญญาณเตือนล่วงหน้า",
      secLabelEN: "Section 1 · Process Characteristics as Early Warning Signals",
      titleTH: "เหตุผลที่ต้องวัดคุณลักษณะของกระบวนการบริการควบคู่กับผลลัพธ์สุดท้าย",
      titleEN: "Why Process Qualities Serve as Early Warning Signals of System Goals",
      summaryTH: "อย่ารอให้อัตราตายพุ่งแล้วจึงรู้ว่าระบบมีปัญหา คุณลักษณะของกระบวนการบริการคือสัญญาณเตือนล่วงหน้าที่ช่วยให้เราแก้ไขได้ทันท่วงที",
      summaryEN: "Do not wait for mortality statistics to reveal system failure; desirable service characteristics act as early warning signals we can fix today.",
      bullets: [
        {
          th: "<strong>ผลลัพธ์สุดท้ายเปลี่ยนช้าและมีหลายปัจจัยกวน:</strong> สุขภาพของประชากรได้รับอิทธิพลจากเศรษฐกิจและสังคมนอกระบบบริการ จึงต้องวัดคุณลักษณะของกระบวนการบริการ (`EQESaRR`) ควบคู่กัน",
          en: "<strong>Final Outcomes Lag and Confound:</strong> Population health shifts slowly and reflects non-medical factors, making intermediate service qualities essential operational gauges.",
        },
        {
          th: "<strong>เชื่อม框架 Donabedian (Structure–Process–Outcome):</strong> เกณฑ์คุณลักษณะที่พึงประสงค์ตรวจสอบว่าทรัพยากรทั้ง 6 Building Blocks ถูกแปรเป็นบริการที่ดีจริงหรือไม่",
          en: "<strong>Operationalizing Donabedian's Chain:</strong> Process attributes verify whether structural inputs genuinely translate into trustworthy care.",
        },
      ],
      flowRoleTH: "ปูเหตุผลว่าเหตุใดต้องมีเข็มทิศ `EQESaRR` ก่อนเจาะลึกทีละมิติเริ่มจากความเป็นธรรม (`Equity`) ในหมวด 2",
      flowRoleEN: "Explains why intermediate process criteria matter before examining each pillar of EQESaRR, starting with Equity in Section 2.",
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
        { th: "คุณลักษณะที่พึงประสงค์", en: "Desirable Characteristics (EQESaRR)" },
        { th: "สัญญาณเตือนล่วงหน้า", en: "Early Warning Signals" },
        { th: "โครงสร้าง–กระบวนการ–ผลลัพธ์", en: "Structure–Process–Outcome" },
      ],
    },
    "HS3:2": {
      secLabelTH: "หมวดที่ 2 · ความเป็นธรรมในระบบบริการและการคลังสุขภาพ (Equity)",
      secLabelEN: "Section 2 · Equity in Health Services & Health Financing",
      titleTH: "รับบริการตามความจำเป็น และร่วมจ่ายเงินตามความสามารถในการจ่าย",
      titleEN: "Care According to Need, Contribution According to Ability to Pay",
      summaryTH: "ความเป็นธรรมไม่ใช่การหารเท่ากันทุกคน แต่คือการดูแลตามความจำเป็นทางสุขภาพและเก็บเงินตามกำลังความสามารถในการจ่าย",
      summaryEN: "Equity is not identical shares for all—it means receiving care according to health need and contributing according to ability to pay.",
      bullets: [
        {
          th: "<strong>แยก Equity ออกจาก Equality:</strong> ความไม่เท่าเทียมที่เป็นธรรมต้องจัดสรรทรัพยากรมากขึ้นให้กลุ่มที่มีความจำเป็นสูงกว่า (`vertical equity`) และดูแลผู้มีความจำเป็นเท่ากันให้เข้าถึงได้เท่าเทียม (`horizontal equity`)",
          en: "<strong>Equity vs. Equality:</strong> Horizontal equity treats equal needs equally; vertical equity devotes greater support to those with greater health needs or lower means.",
        },
        {
          th: "<strong>การเข้าถึงบริการมีหลายมิติ:</strong> ทั้งทางภูมิศาสตร์ การเงิน วัฒนธรรมภาษา และเวลารอคอย ไม่ใช่เพียงการมีชื่ออยู่ในทะเบียนสิทธิ",
          en: "<strong>Multidimensional Access:</strong> True access spans geographic reach, affordability, cultural acceptability, and timely availability.",
        },
        {
          th: "<strong>ความเป็นธรรมด้านการคลังวัดความก้าวหน้าของการเก็บเงิน:</strong> ระบบการคลังที่เป็นธรรมเน้นการจัดเก็บอัตราก้าวหน้า (`progressive`) และคุ้มครองไม่ให้เกิดรายจ่ายหายนะ",
          en: "<strong>Fair Health Financing:</strong> Links progressive revenue collection with pooling that shields households from catastrophic out-of-pocket bills.",
        },
      ],
      flowRoleTH: "เปิดมิติแรกของ `EQESaRR` คือ 'เข้าถึงอย่างเป็นธรรม' ก่อนชี้ต่อในหมวด 3 ว่า 'เข้าถึงเพียงอย่างเดียวไม่พอ หากบริการนั้นไร้คุณภาพ'",
      flowRoleEN: "Establishes the first pillar—equitable access and financing—before Section 3 shows why access without quality falls short.",
      crossLinks: [
        {
          target: "HS1:2",
          labelTH: "HS1 · หมวด 2 (ความไม่เป็นธรรมจากปัจจัยสังคม)",
          labelEN: "HS1 · Sec 2 (Social Health Inequity)",
          whyTH: "ระบบบริการที่เป็นธรรมต้องช่วยลดช่องว่างสุขภาพที่เกิดจากปัจจัยสังคมต้นน้ำ ไม่ใช่ซ้ำเติมคนจน",
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
        { th: "ความสามารถในการจ่าย", en: "Ability to Pay" },
        { th: "ความจำเป็นทางสุขภาพ", en: "Health Need" },
        { th: "อุปสรรคการเข้าถึงบริการ", en: "Barriers to Access" },
      ],
    },
    "HS3:3": {
      secLabelTH: "หมวดที่ 3 · คุณภาพบริการและความครอบคลุมอย่างมีประสิทธิผล (Quality)",
      secLabelEN: "Section 3 · Quality (STEP) & Effective Coverage",
      titleTH: "กรอบคุณภาพ STEP และช่องว่างระหว่างการเข้าถึงกับการได้รับบริการที่มีคุณภาพจริง",
      titleEN: "The STEP Quality Framework and Effective Coverage Cascade",
      summaryTH: "การเข้าถึงบริการที่ไร้คุณภาพไม่ได้สร้างสุขภาพ ความครอบคลุมที่มีความหมายต้องปลอดภัย ได้ผล ทันเวลา และเคารพความเป็นมนุษย์ของผู้ป่วย",
      summaryEN: "Access without quality delivers false reassurance; meaningful coverage must be Safe, Timely, Effective, and Person-centered.",
      bullets: [
        {
          th: "<strong>จำกรอบคุณภาพด้วย STEP (IOM):</strong> `Safe` (ปลอดภัยไม่เกิดอันตราย) `Timely` (ทันเวลาไม่ล่าช้า) `Effective` (อิงหลักฐานวิชาการ ไม่ขาดหรือเกิน) และ `Patient-centered` (เคารพคุณค่าผู้ป่วย)",
          en: "<strong>STEP Quality Compass:</strong> Care must be Safe, Timely, Effective (evidence-based without underuse or overuse), and Patient-centered.",
        },
        {
          th: "<strong>ความครอบคลุมอย่างมีประสิทธิผล (Effective Coverage):</strong> ผสานความจำเป็น (`Need`) × การมาใช้บริการ (`Use`) × คุณภาพการดูแลจนควบคุมโรคได้จริง (`Quality`)",
          en: "<strong>Effective Coverage Cascade:</strong> Multiplies population need, service utilization, and clinical quality so coverage translates into real health gain.",
        },
      ],
      flowRoleTH: "ต่อยอดจาก Equity (หมวด 2) ว่าเมื่อคนเข้าถึงบริการแล้ว บริการต้องมีคุณภาพจริง ก่อนถามในหมวด 4 ว่าเราจะจัดสรรทรัพยากรจำกัดให้คุ้มค่าได้อย่างไร",
      flowRoleEN: "Builds on Equity (Section 2) to ensure access yields real health benefit, leading into how scarce resources sustain quality in Section 4.",
      crossLinks: [
        {
          target: "HS1:3",
          labelTH: "HS1 · หมวด 3 (ป้องกันระดับ 4 ลด Overuse)",
          labelEN: "HS1 · Sec 3 (Quaternary Prevention)",
          whyTH: "ความมีประสิทธิผลและความปลอดภัย (`Effective & Safe`) ต้องหลีกเลี่ยงทั้งการให้การรักษาน้อยเกินไปและมากเกินจำเป็น",
          whyEN: "Clinical quality guards against both underuse of needed care and harmful overuse.",
        },
        {
          target: "HS5:5",
          labelTH: "HS5 · หมวด 5 (บริการปฐมภูมิยึดคนเป็นศูนย์กลาง)",
          labelEN: "HS5 · Sec 5 (Person-Centered Primary Care)",
          whyTH: "บริการปฐมภูมิ 4Cs เป็นรากฐานของการสร้างความครอบคลุมอย่างมีประสิทธิผลในโรคเรื้อรัง",
          whyEN: "Continuous, coordinated primary care closes the quality gap in chronic disease control.",
        },
      ],
      keywords: [
        { th: "ปลอดภัย · ทันเวลา · ได้ผล · ยึดผู้ป่วยเป็นศูนย์กลาง", en: "Safe · Timely · Effective · Patient-Centered (STEP)" },
        { th: "ความครอบคลุมอย่างมีประสิทธิผล", en: "Effective Coverage" },
        { th: "ช่องว่างด้านคุณภาพ", en: "Quality Gap" },
      ],
    },
    "HS3:4": {
      secLabelTH: "หมวดที่ 4 · ประสิทธิภาพและการประเมินเทคโนโลยีด้านสุขภาพ (Efficiency & HTA)",
      secLabelEN: "Section 4 · Efficiency, Opportunity Cost, and Health Technology Assessment",
      titleTH: "การใช้ทรัพยากรจำกัดให้เกิดคุณค่าสุขภาพสูงสุดโดยไม่ลดทอนความปลอดภัยและความเป็นธรรม",
      titleEN: "Maximizing Health Value Under Scarcity Without Compromising Safety or Equity",
      summaryTH: "ประสิทธิภาพไม่ใช่การตัดงบให้ถูกที่สุด แต่คือการลดความสูญเปล่าเพื่อนำทรัพยากรที่มีจำกัดไปสร้างคุณค่าทางสุขภาพให้ได้มากที่สุด",
      summaryEN: "Efficiency is never blind cost-cutting; it eliminates waste so scarce resources generate the greatest possible health value.",
      bullets: [
        {
          th: "<strong>ทุกการใช้จ่ายมีต้นทุนค่าเสียโอกาส (Opportunity Cost):</strong> เงินที่จ่ายกับบริการราคาแพงแต่ไม่คุ้มค่า คือสุขภาพที่สูญเสียไปของผู้ป่วยกลุ่มอื่นที่ไม่ได้รับบริการที่จำเป็น",
          en: "<strong>Opportunity Cost Matters:</strong> Spending on low-value interventions foregoes greater health gains elsewhere in the system.",
        },
        {
          th: "<strong>แยก 3 ระดับของประสิทธิภาพ:</strong> `Technical` (ไม่สูญเปล่าในขั้นตอน) `Productive` (ผสมผสานทรัพยากร/ทักษะด้วยต้นทุนเหมาะสม) และ `Allocative` (จัดสรรงบไปสู่แผนงานที่สร้างสุขภาพคุ้มค่าที่สุด)",
          en: "<strong>Three Efficiency Tiers:</strong> Technical (waste-free execution), Productive (optimal input/skill mix), and Allocative (funding the right mix of programs).",
        },
        {
          th: "<strong>HTA เป็นเครื่องมือจัดชุดสิทธิประโยชน์ที่มีรั้วกั้นทางจริยธรรม:</strong> ใช้ประเมินความคุ้มค่า (`ICER / QALY`) ควบคู่กับความเป็นธรรมและผลกระทบงบประมาณ ไม่ทิ้งโรคหายากหรือกลุ่มเปราะบาง",
          en: "<strong>HTA with Ethical Guardrails:</strong> Health Technology Assessment weighs cost-effectiveness alongside budget impact, safety, and protection for vulnerable groups.",
        },
      ],
      flowRoleTH: "เชื่อมคุณภาพ (หมวด 3) เข้ากับข้อจำกัดด้านทรัพยากร ก่อนก้าวสู่หมวด 5 ว่า 'ใครเป็นคนตัดสินใจจัดสรรทรัพยากร และตรวจสอบความโปร่งใสอย่างไร'",
      flowRoleEN: "Connects Quality (Section 3) to resource scarcity, raising Section 5's question: how should public priority-setting be governed accountably?",
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
        { th: "ต้นทุนค่าเสียโอกาส", en: "Opportunity Cost" },
        { th: "ประสิทธิภาพเชิงเทคนิค · การผลิต · การจัดสรร", en: "Technical · Productive · Allocative Efficiency" },
        { th: "การประเมินเทคโนโลยีด้านสุขภาพ", en: "Health Technology Assessment (HTA)" },
      ],
    },
    "HS3:5": {
      secLabelTH: "หมวดที่ 5 · ธรรมาภิบาล ภาระรับผิดชอบต่อสังคม และความสอดคล้องกับบริบท",
      secLabelEN: "Section 5 · Good Governance, Social Accountability, and Relevance",
      titleTH: "การกำกับดูแลอำนาจสาธารณะให้โปร่งใส รับฟังประชาชน และตรงปัญหาพื้นที่",
      titleEN: "Transparent Stewardship, Citizen Voice, and Local Relevance",
      summaryTH: "ระบบสุขภาพที่น่าเชื่อถือต้องโปร่งใส ตรวจสอบได้ และจัดบริการให้ตรงกับปัญหาจริงของชุมชน ไม่ใช่จัดตามความคุ้นชินของส่วนกลาง",
      summaryEN: "Trustworthy health systems govern transparently, answer to the communities they serve, and tailor services to real local priorities.",
      bullets: [
        {
          th: "<strong>แก้ปัญหาตัวการ–ตัวแทน (Principal–Agent) ด้วยธรรมาภิบาล:</strong> ลดช่องว่างข้อมูลและผลประโยชน์ทับซ้อนด้วยความโปร่งใส การมีส่วนร่วม และหลักนิติธรรม",
          en: "<strong>Aligning Principal–Agent Relationships:</strong> Transparency, participation, and rule of law align health institutions with public interest.",
        },
        {
          th: "<strong>ภาระรับผิดชอบต่อสังคม (Social Accountability) และความสอดคล้อง (`Relevance`):</strong> เปิดช่องทางให้ประชาชนร่วมออกแบบและสะท้อนผล เพื่อให้ทรัพยากรมุ่งแก้ปัญหาสำคัญของพื้นที่จริง",
          en: "<strong>Social Accountability & Relevance:</strong> Citizen voice and community oversight keep service priorities anchored in local health needs.",
        },
      ],
      flowRoleTH: "วางรากฐานธรรมาภิบาลและความไว้เนื้อเชื่อใจในภาวะปกติ ซึ่งเป็นต้นทุนสำคัญที่ทำให้ระบบยืนหยัดและปรับตัวได้เมื่อเกิดวิกฤตในหมวด 6",
      flowRoleEN: "Builds everyday public trust and responsive governance, which become the decisive foundation for crisis Resilience in Section 6.",
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
          whyTH: "การมีส่วนร่วมของชุมชนและท้องถิ่นในระบบปฐมภูมิคือกลไกสร้าง Social Accountability ในระดับพื้นที่",
          whyEN: "Community engagement in PHC brings social accountability and local relevance to life.",
        },
      ],
      keywords: [
        { th: "ธรรมาภิบาลระบบสุขภาพ", en: "Health System Governance" },
        { th: "ภาระรับผิดชอบต่อสังคม", en: "Social Accountability" },
        { th: "ความสอดคล้องกับปัญหาและบริบท", en: "Contextual Relevance" },
        { th: "ความสัมพันธ์ตัวการ–ตัวแทน", en: "Principal–Agent Theory" },
      ],
    },
    "HS3:6": {
      secLabelTH: "หมวดที่ 6 · ความสามารถในการปรับตัวและความยืดหยุ่นของระบบสุขภาพ (Resilience)",
      secLabelEN: "Section 6 · Health System Resilience",
      titleTH: "การดูดซับแรงกระแทก การปรับตัว และการปฏิรูปโครงสร้างโดยไม่ผลักภาระให้คนหน้างาน",
      titleEN: "Absorptive, Adaptive, and Transformative Capacities Without Frontline Burnout",
      summaryTH: "ระบบที่ยืดหยุ่นไม่ใช่ระบบที่ปล่อยให้คนหน้างานอดทนแบกรับวิกฤตลำพัง แต่คือระบบที่คงบริการจำเป็นไว้ได้พร้อมปรับโครงสร้างให้แข็งแกร่งกว่าเดิม",
      summaryEN: "True resilience never relies on exhausting frontline staff; it protects essential care during shocks while transforming structures for the future.",
      bullets: [
        {
          th: "<strong>3 ระดับขีดความสามารถเมื่อเผชิญวิกฤต:</strong> `Absorptive` (รับแรงกระแทกเบื้องต้น) `Adaptive` (ปรับวิธีจัดบริการให้ยืดหยุ่น) และ `Transformative` (ปฏิรูปโครงสร้างระยะยาว)",
          en: "<strong>Three Resilience Capacities:</strong> Absorptive buffering, Adaptive operational flexibility, and Transformative structural reform.",
        },
        {
          th: "<strong>ระวังกับดักคำว่า Resilience เชิงอำนาจ:</strong> ห้ามใช้ความยืดหยุ่นเป็นข้ออ้างผลักภาระความเหนื่อยล้าให้บุคลากรหรือชุมชนโดยรัฐไม่ลงทุนแก้โครงสร้างที่เปราะบาง",
          en: "<strong>Guard Against Burnout Shifting:</strong> Resilience must mean systemic support and structural investment, never normalizing chronic frontline overload.",
        },
      ],
      flowRoleTH: "เติมมิติพลวัตตามเวลา (`Resilience`) ให้ครบทั้ง 6 เกณฑ์ ก่อนนำ `EQESaRR` ทั้งหมดมาสังเคราะห์การชั่งน้ำหนัก `Trade-off` ในบริบทไทยในหมวด 7",
      flowRoleEN: "Completes all six EQESaRR pillars with dynamic crisis readiness before Section 7 synthesizes multi-criteria trade-offs in Thailand.",
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
        { th: "ความสามารถดูดซับ · ปรับตัว · เปลี่ยนผ่านโครงสร้าง", en: "Absorptive · Adaptive · Transformative Capacity" },
        { th: "การคงบริการสุขภาพที่จำเป็น", en: "Maintaining Essential Health Services" },
      ],
    },
    "HS3:7": {
      secLabelTH: "หมวดที่ 7 · บริบทระบบสุขภาพไทยและการชั่งน้ำหนักเกณฑ์ EQESaRR",
      secLabelEN: "Section 7 · Thai National Health Charter & Multi-Criteria Trade-Offs",
      titleTH: "ธรรมนูญว่าด้วยระบบสุขภาพแห่งชาติและการประเมินการแลกได้แลกเสีย (Trade-offs) ด้วย EQESaRR",
      titleEN: "Thailand's National Health Charter and Balancing EQESaRR Trade-Offs",
      summaryTH: "ในโลกความจริงไม่มีนโยบายใดสมบูรณ์แบบทุกด้าน การประเมินระบบสุขภาพที่รอบด้านจึงต้องใช้ทั้งหกเกณฑ์ชั่งน้ำหนักการแลกได้แลกเสียอย่างโปร่งใส",
      summaryEN: "No real-world policy scores 100% on every dimension; wise stewardship weighs trade-offs transparently across all six EQESaRR criteria.",
      bullets: [
        {
          th: "<strong>ธรรมนูญสุขภาพไทยวางฐานคุณค่าและธรรมาภิบาล:</strong> ยึดสุขภาพองค์รวมและปรัชญาเศรษฐกิจพอเพียง แต่ในการประเมินระดับระบบบริการยังต้องใช้เกณฑ์ `EQESaRR` กำกับอย่างเป็นรูปธรรม",
          en: "<strong>Charter Values Meet Service Metrics:</strong> Thailand's National Health Charter sets holistic governance values, complemented operationally by EQESaRR.",
        },
        {
          th: "<strong>มองเห็น Trade-off เสมอ:</strong> เช่น การรวมศูนย์บริการซับซ้อนในเมืองเพิ่มคุณภาพ (`Q`) และประสิทธิภาพเทคนิค (`E`) แต่อาจลดความเป็นธรรมในการเข้าถึง (`E`) ของผู้ป่วยห่างไกล จึงต้องออกแบบระบบส่งต่อและปฐมภูมิชดเชย",
          en: "<strong>Navigate Inevitable Trade-Offs:</strong> Centralizing specialized surgery boosts clinical Quality and technical Efficiency but can widen geographic Equity gaps unless mitigated.",
        },
      ],
      flowRoleTH: "รวบยอดทั้งบท HS3 เป็นกรอบคิดชั่งน้ำหนัก 6 เกณฑ์ (`EQESaRR`) ที่จะใช้ประเมินมาตรการปรับพฤติกรรม (HS4) ปฐมภูมิ (HS5) และการคลังสุขภาพ (HS6)",
      flowRoleEN: "Integrates all six EQESaRR criteria into a practical trade-off lens used across HS4, HS5, and HS6.",
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
        { th: "กรอบเกณฑ์ประเมินหกมิติ", en: "EQESaRR Multi-Criteria Framework" },
        { th: "การแลกได้แลกเสียเชิงนโยบาย", en: "Policy Trade-Offs" },
      ],
    },
    "HS3:sum": {
      secLabelTH: "บทสรุป · สังเคราะห์คุณลักษณะที่พึงประสงค์ของระบบบริการสุขภาพ",
      secLabelEN: "Synthesis · Desirable Characteristics (EQESaRR)",
      titleTH: "บทสรุปเข็มทิศ EQESaRR เพื่อการวินิจฉัยและพัฒนาระบบบริการสุขภาพ",
      titleEN: "Using the EQESaRR Compass to Diagnose and Improve Health Services",
      summaryTH: "เป็นธรรม มีคุณภาพ คุ้มค่า โปร่งใส ตรงปัญหา และปรับตัวได้ คือหกคำถามตรวจสอบระบบบริการที่แพทย์ชุมชนควรพกติดตัวเสมอ",
      summaryEN: "Equitable, high-quality, efficient, accountable, relevant, and resilient—six diagnostic questions every health-systems physician carries into practice.",
      bullets: [
        {
          th: "<strong>ใช้ครบทั้ง 6 เลนส์ร่วมกัน:</strong> การมุ่งเน้นเพียงมิติเดียวโดยละเลยมิติอื่นมักสร้างผลกระทบข้างเคียงต่อกลุ่มเปราะบางหรือบุคลากรหน้างาน",
          en: "<strong>Always Apply All Six Lenses:</strong> Optimizing a single metric in isolation risks unintended harm to vulnerable patients or frontline teams.",
        },
      ],
      flowRoleTH: "จบกรอบเกณฑ์ประเมินระบบบริการใน HS3 แล้วก้าวสู่ HS4 เพื่อดูว่าเราจะเสริมพลังประชาชนและสิ่งแวดล้อมให้สร้างสุขภาพก่อนป่วยได้อย่างไร",
      flowRoleEN: "Concludes HS3's evaluative compass and moves to HS4: empowering people and environments for health promotion and behavior change.",
      crossLinks: [
        {
          target: "HS4:1",
          labelTH: "ต่อยอดสู่ HS4 · หมวด 1 (การเปลี่ยนผ่านทางระบาดวิทยาและพฤติกรรมสุขภาพ)",
          labelEN: "Next: HS4 · Sec 1 (Epidemiological Transition & Health Behaviour)",
          whyTH: "ยกระดับประสิทธิภาพการจัดสรร (`Allocative Efficiency`) และความเป็นธรรมด้วยการลดปัจจัยเสี่ยง NCDs ตั้งแต่ต้นน้ำ",
          whyEN: "Upstream NCD risk reduction advances both allocative efficiency and health equity.",
        },
      ],
      keywords: [
        { th: "เข็มทิศหกมิติ EQESaRR", en: "EQESaRR Six-Pillar Compass" },
        { th: "ดุลยภาพเชิงระบบ", en: "Systemic Balance" },
      ],
    },

    /* -------------------- HS4: Health Behaviour, Behaviour Change & Health Promotion -------------------- */
    "HS4:1": {
      secLabelTH: "หมวดที่ 1 · การเปลี่ยนผ่านทางระบาดวิทยาและพฤติกรรมสุขภาพ 3 ระยะ",
      secLabelEN: "Section 1 · Epidemiological Transition & 3 Stages of Health Behaviour",
      titleTH: "สังคมสูงวัย ภาระโรค NCDs กลไกพฤติกรรมมนุษย์ และการแยกคัดกรองตามเกณฑ์เสี่ยงออกจากตรวจสุขภาพทั่วไป",
      titleEN: "Aged Society, NCD Burden, Stimulus–Response Behaviour & Targeted Screening",
      summaryTH: "เมื่อ NCDs คิดเป็น 76% ของการเสียชีวิตในไทย การดูแลผู้ป่วยต้องผสานการปรับพฤติกรรมภายใต้บริบทสังคมเข้ากับการรักษาด้วยยา และแยกแยะพฤติกรรมสุขภาพทั้ง 3 ระยะอย่างแม่นยำ",
      summaryEN: "With NCDs driving 76% of Thai deaths, clinical care must pair context-aware behaviour change with pharmacotherapy across all three stages of health behaviour.",
      bullets: [
        {
          th: "<strong>สังคมสูงวัยสมบูรณ์ + NCDs 76% ต้องผสานปรับพฤติกรรมคู่กับยา:</strong> การปรับวิถีชีวิตเข้มข้นลดอุบัติการณ์เบาหวานได้ 58% (`DPP`) แต่ในโรคที่เป็นแล้ว (`Look AHEAD`) ยังต้องใช้ยาร่วมด้วยเพื่อลดโรคหัวใจและหลอดเลือด",
          en: "<strong>Lifestyle + Pharmacotherapy Synergy:</strong> Intensive lifestyle cuts T2DM onset by 58% (DPP), yet established disease still requires combining lifestyle modification with medication.",
        },
        {
          th: "<strong>กลไกสิ่งเร้า–การตอบสนอง และพฤติกรรมสุขภาพ 3 ระยะ (Kasl & Cobb):</strong> แยกพฤติกรรมภายนอก (`overt`; อัตราหัวใจเต้นเป็นสรีรวิทยา ไม่ใช่ `overt`) พฤติกรรมภายใน (`covert`) และ 3 ระยะตั้งแต่แข็งแรง เริ่มมีอาการ จนถึงบทบาทผู้ป่วย (`sick-role`)",
          en: "<strong>Overt/Covert & Kasl–Cobb's 3 Stages:</strong> Distinguish observable vs. inner behaviour (heart rate is physiological, not overt) across preventive, illness, and sick-role stages.",
        },
        {
          th: "<strong>คัดกรองตามเกณฑ์อายุ/ความเสี่ยง ≠ ตรวจสุขภาพประจำปีแบบไม่จำเพาะ:</strong> หลักฐาน Cochrane (`Krogsbøll et al., 2019`) ชี้ว่าการตรวจสุขภาพทั่วไปแบบไม่เลือกกลุ่มเสี่ยงไม่ลดอัตราตายรวม (`RR = 1.00`) จึงต้องมุ่งคัดกรองเฉพาะโรคตามเกณฑ์ความเสี่ยง",
          en: "<strong>Targeted Screening vs. Untargeted Checkups:</strong> Untargeted general health checks do not reduce total mortality (Cochrane RR = 1.00); prioritize age- and risk-appropriate screening.",
        },
      ],
      flowRoleTH: "ปูฐานว่า 'ทำไมแพทย์ต้องเข้าใจพฤติกรรมควบคู่การรักษา' และจำแนกพฤติกรรมทั้ง 3 ระยะ ก่อนเข้าสู่ทฤษฎีอธิบายและเครื่องมือปรับพฤติกรรมในหมวด 2",
      flowRoleEN: "Establishes the epidemiological urgency and 3-stage behavioural taxonomy before Section 2 unpacks behaviour-change theories and tools.",
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
          whyTH: "ภาระโรค NCDs ต้องอาศัยทั้งการปรับพฤติกรรมต้นน้ำและการจัดระบบดูแลผู้ป่วยโรคเรื้อรังแบบบูรณาการ",
          whyEN: "Rising NCDs require pairing lifestyle support with continuous chronic care delivery.",
        },
      ],
      keywords: [
        { th: "การเปลี่ยนผ่านทางระบาดวิทยา", en: "Epidemiological Transition" },
        { th: "พฤติกรรมสุขภาพ 3 ระยะ (Kasl & Cobb)", en: "Kasl & Cobb's 3 Stages" },
        { th: "คัดกรองตามเกณฑ์ความเสี่ยง", en: "Risk-Appropriate Screening" },
      ],
    },
    "HS4:2": {
      secLabelTH: "หมวดที่ 2 · ทฤษฎีพฤติกรรมสุขภาพ เศรษฐศาสตร์พฤติกรรม (Nudge) และวงล้อ BCW (COM-B)",
      secLabelEN: "Section 2 · Behaviour Theories, Choice Architecture (Nudge) & BCW (COM-B)",
      titleTH: "ก้าวข้ามข้อจำกัดของ KAP สู่ HBM, Stages of Change, ระบบคิดที่ 1–2 และวงล้อการปรับเปลี่ยนพฤติกรรม",
      titleEN: "From KAP & HBM to Stages of Change, Dual-Process Nudges, and the Behaviour Change Wheel",
      summaryTH: "ความรู้จำเป็นต่อการตัดสินใจอย่างรู้เท่าทันแต่ไม่เพียงพอที่จะเปลี่ยนพฤติกรรม การออกแบบมาตรการต้องเชื่อมทั้งความเชื่อ ระบบคิดอัตโนมัติ และปัจจัยนิเวศวิทยาผ่านกรอบ COM-B และ BCW",
      summaryEN: "Knowledge enables informed choice but rarely suffices alone; effective interventions address beliefs, System 1 habits, and environmental context via Nudge and COM-B/BCW.",
      bullets: [
        {
          th: "<strong>นิเวศวิทยา 5 ระดับ, ช่องว่าง KAP และลำดับพลังของ HBM:</strong> การให้ความรู้ลำพังติด `Intention–Behaviour Gap` และเสี่ยงโทษผู้ป่วย ส่วนใน `HBM` การรับรู้ประโยชน์และอุปสรรคมีพลังทำนายสูงกว่าการขู่ให้กลัวความรุนแรงของโรค",
          en: "<strong>5 Ecological Levels, KAP Gap & HBM Hierarchy:</strong> Knowledge alone faces the intention–behaviour gap; in HBM, perceived benefits and barriers far outweigh threat perception.",
        },
        {
          th: "<strong>Stages of Change และข้อเท็จจริงจาก 41 RCTs:</strong> ช่วยเข้าใจความพร้อมและการกลับเป็นซ้ำ (`relapse`) แต่หลักฐาน Cochrane (`Cahill et al., 2010`) พบว่าโปรแกรมจับคู่ตามขั้นไม่ได้เหนือกว่าโปรแกรมมาตรฐาน จึงไม่ควรงดให้ความช่วยเหลือผู้ที่ยังไม่พร้อม",
          en: "<strong>Stages of Change Reality Check:</strong> Useful for empathetic counseling, but Cochrane's 41-RCT review shows stage-matched care adds no extra quit benefit—never withhold help by stage.",
        },
        {
          th: "<strong>Nudge (`System 1`) และวงล้อ `BCW / COM-B`:</strong> ค่าตั้งต้น (`default`, `d = 0.62`) ทรงพลังแต่ผลระดับประชากรเฉลี่ยเพียง `+1.4%` (`Buy 1 Get 1 Free` ไม่ใช่ Nudge) จึงต้องใช้เสริมกฎหมายและภาษีผ่านการวินิจฉัย `Capability · Opportunity · Motivation` สู่ 9 มาตรการ และ 7 นโยบาย",
          en: "<strong>Nudge + BCW/COM-B System Design:</strong> Defaults lead nudges (d = 0.62) yet real-world nudges average +1.4 pp; pair choice architecture with laws/taxes using COM-B, 9 functions, and 7 policies.",
        },
      ],
      flowRoleTH: "สังเคราะห์วิวัฒนาการของทฤษฎีพฤติกรรมศาสตร์สู่เครื่องมือออกแบบมาตรการเชิงระบบ (`BCW`) ก่อนเจาะลึกสมรรถนะการใช้ข้อมูลและบทบาทองค์กร (`Health Literacy`) ในหมวด 3",
      flowRoleEN: "Synthesizes behavioural theories into the BCW system-design wheel before Section 3 examines personal and organizational Health Literacy.",
      crossLinks: [
        {
          target: "HS1:2",
          labelTH: "HS1 · หมวด 2 (พีระมิดผลกระทบทางสุขภาพของ Frieden)",
          labelEN: "HS1 · Sec 2 (Frieden's Health Impact Pyramid)",
          whyTH: "การปรับค่าตั้งต้น (`Nudge`) และโอกาสเชิงสิ่งแวดล้อมใน `COM-B` สอดคล้องกับชั้นเปลี่ยนบริบททางเลือกของ Frieden",
          whyEN: "Nudges and COM-B Opportunity redesign match Frieden's high-leverage context-changing tier.",
        },
        {
          target: "ST1:4",
          labelTH: "ST1 · หมวด 4 (คานงัดเชิงโครงสร้างใต้ภูเขาน้ำแข็ง)",
          labelEN: "ST1 · Sec 4 (Structural Leverage Beneath the Iceberg)",
          whyTH: "วงกลางและวงนอกของ `BCW` ช่วยยกระดับการแก้ปัญหาจากการสั่งสอนรายบุคคลไปสู่การปรับโครงสร้างและนโยบาย",
          whyEN: "BCW's outer intervention and policy rings shift clinical thinking from individual blame to structural leverage.",
        },
      ],
      keywords: [
        { th: "แบบแผนความเชื่อด้านสุขภาพ", en: "Health Belief Model (HBM)" },
        { th: "ลำดับขั้นของการเปลี่ยนแปลง", en: "Stages of Change (TTM)" },
        { th: "เศรษฐศาสตร์พฤติกรรมและการสะกิด", en: "Behavioural Economics & Nudge" },
        { th: "ตัวแบบ COM-B และวงล้อ BCW", en: "COM-B & Behaviour Change Wheel" },
      ],
    },
    "HS4:3": {
      secLabelTH: "หมวดที่ 3 · ความรอบรู้ด้านสุขภาพระดับบุคคลและระดับองค์กร",
      secLabelEN: "Section 3 · Personal & Organizational Health Literacy",
      titleTH: "สมรรถนะ 4 ขั้นใน 3 บริบทของ Sørensen ควบคู่ความรับผิดชอบขององค์กรตามนิยาม CDC 2020",
      titleEN: "Sørensen's 4 Competences × 3 Domains Paired with CDC 2020 Organizational Responsibility",
      summaryTH: "ความรอบรู้ด้านสุขภาพไม่ใช่ภาระของประชาชนฝ่ายเดียว แต่องค์กรสุขภาพต้องออกแบบข้อมูลและบริการเพื่อเอื้ออย่างเป็นธรรมให้ทุกคนตัดสินใจอย่างรอบด้านได้จริง",
      summaryEN: "Health literacy is a shared responsibility: personal competences thrive only when organizations equitably enable clear navigation and informed decisions.",
      bullets: [
        {
          th: "<strong>สมรรถนะ 4 ขั้น × 3 บริบท (Sørensen et al., 2012) + องค์กรรอบรู้ด้านสุขภาพ (CDC, 2020):</strong> ประชาชนเข้าถึง (`access`) เข้าใจ (`understand`) ประเมิน (`appraise`) และนำไปใช้ (`apply`) ข้อมูลทั้งในด้านการรักษา การป้องกันโรค และการสร้างเสริมสุขภาพ ขณะที่องค์กรมีหน้าที่เอื้ออย่างเป็นธรรม (`equitably enable`)",
          en: "<strong>Dual-Level Health Literacy:</strong> Unites personal competences (access, understand, appraise, apply across 3 domains) with organizational responsibility to equitably enable patients.",
        },
        {
          th: "<strong>หลักฐานเชิงสหสัมพันธ์ต่อระบบสุขภาพและความเป็นธรรม:</strong> ความรอบรู้ด้านสุขภาพต่ำมีความสัมพันธ์เชิงสังเกตการณ์กับการนอนโรงพยาบาล ห้องฉุกเฉิน อัตราตายในผู้สูงอายุ และค่าใช้จ่ายที่เพิ่มขึ้นราว `3–5%` ของรายจ่ายสุขภาพรวม และทำหน้าที่เป็นตัวแปรส่งผ่านบางส่วนของความเหลื่อมล้ำ",
          en: "<strong>Correlational Evidence & Equity Role:</strong> Low health literacy associates observationally with higher hospitalization/ED use, ~3–5% added system costs, and socioeconomic health disparities.",
        },
      ],
      flowRoleTH: "เชื่อมสมรรถนะของประชาชนและหน่วยบริการในหมวด 3 เข้าสู่วาระใหญ่ระดับประชากรและนโยบายสาธารณะ คือ 'การสร้างเสริมสุขภาพ (Health Promotion)' ในหมวด 4",
      flowRoleEN: "Bridges personal and organizational health literacy to macro-level population empowerment and Healthy Public Policy in Section 4.",
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
          whyTH: "ความสัมพันธ์ต่อเนื่องกับทีมหมอครอบครัวช่วยเสริมความรอบรู้ด้านสุขภาพและการดูแลตนเองของผู้ป่วย",
          whyEN: "Longitudinal primary care relationships strengthen patient health literacy and self-management.",
        },
      ],
      keywords: [
        { th: "ความรอบรู้ด้านสุขภาพส่วนบุคคล", en: "Personal Health Literacy" },
        { th: "ความรอบรู้ด้านสุขภาพระดับองค์กร", en: "Organizational Health Literacy" },
        { th: "เข้าถึง · เข้าใจ · ประเมิน · นำไปใช้", en: "Access · Understand · Appraise · Apply" },
      ],
    },
    "HS4:4": {
      secLabelTH: "หมวดที่ 4 · การสร้างเสริมสุขภาพ กฎบัตรออตตาวา เซี่ยงไฮ้ และเจนีวา",
      secLabelEN: "Section 4 · Health Promotion: From Ottawa (1986) to Shanghai (2016) & Geneva (2021)",
      titleTH: "ขบวนการทางสังคมระดับประชากรที่เสริมพลังผ่าน 5 หลักการ 3 ยุทธศาสตร์ 5 ด้านปฏิบัติการ สู่สังคมสุขภาวะ",
      titleEN: "Population-Wide Empowerment via Ottawa's 5 Action Areas, Shanghai's 3 Pillars & Geneva's Well-Being Societies",
      summaryTH: "การสร้างเสริมสุขภาพก้าวข้ามการดูแลเฉพาะผู้ป่วยในคลินิก ไปสู่การเสริมพลังประชาชนทั้งประชากรให้ควบคุมปัจจัยกำหนดสุขภาพผ่านนโยบายสาธารณะ สิ่งแวดล้อม ชุมชน และการปรับระบบบริการ",
      summaryEN: "Health promotion transcends clinical care to empower whole populations over health determinants through healthy public policy, supportive environments, and reoriented services.",
      bullets: [
        {
          th: "<strong>ถอดรหัสตราสัญลักษณ์กฎบัตรออตตาวา (1986):</strong> บนฐานปัจจัยพื้นฐาน 9 ประการและหลักการ 5 ข้อ วงกลมในคือ 3 บทบาทหลัก (`Advocate`, `Mediate`, `Enable`) วงแหวนนอกคือนโยบายสาธารณะเพื่อสุขภาพ (เช่น ภาษีเครื่องดื่มน้ำตาลไทยลดยอดซื้อ `-15%`) และ 3 ปีกครอบคลุมสิ่งแวดล้อมเอื้อ ชุมชนเข้มแข็ง ทักษะส่วนบุคคล และการปรับระบบบริการ",
          en: "<strong>Ottawa Charter Architecture (1986):</strong> Three core strategies (Advocate, Mediate, Enable) drive five action areas anchored by Healthy Public Policy (e.g., Thai SSB tax cutting sales by 15%).",
        },
        {
          th: "<strong>จาก 3 เสาหลักเซี่ยงไฮ้ (2016) สู่กฎบัตรเจนีวาเพื่อสุขภาวะ (2021):</strong> ผสานธรรมาภิบาลที่ดี (`Good Governance`) เมืองสุขภาพดี (`Healthy Cities`) และความรอบรู้ด้านสุขภาพ (`Health Literacy`) มุ่งสู่ `Well-being Societies` ที่เชื่อมสุขภาพ ความเป็นธรรม และความยั่งยืนของระบบนิเวศ",
          en: "<strong>Shanghai 3 Pillars (2016) to Geneva Charter (2021):</strong> Unites Good Governance, Healthy Cities, and Health Literacy toward equitable, ecologically sustainable Well-being Societies.",
        },
      ],
      flowRoleTH: "ปิดท้ายบท HS4 ด้วยยุทธศาสตร์การสร้างเสริมสุขภาพระดับประชากร เพื่อส่งต่อสู่ HS5 ว่า 'ระบบสุขภาพปฐมภูมิ (PHC)' จะเป็นกลไกหลักขับเคลื่อนสิ่งนี้ในพื้นที่จริงอย่างไร",
      flowRoleEN: "Culminates HS4 with population health promotion, setting up HS5 on how Primary Health Care operationalizes multisectoral action and community empowerment.",
      crossLinks: [
        {
          target: "HS1:2",
          labelTH: "HS1 · หมวด 2 (ปัจจัยกำหนดสุขภาพทางสังคม SDH)",
          labelEN: "HS1 · Sec 2 (Social Determinants of Health)",
          whyTH: "นโยบายสาธารณะเพื่อสุขภาพและธรรมาภิบาลที่ดีคือเครื่องมือหลักในการปรับปัจจัยต้นน้ำของ `SDH`",
          whyEN: "Healthy Public Policy and Good Governance directly reshape structural Social Determinants of Health.",
        },
        {
          target: "HS5:4",
          labelTH: "HS5 · หมวด 4 (ปฏิญญาแอสทานาเชื่อมปฐมภูมิ นโยบายข้ามภาคส่วน และชุมชน)",
          labelEN: "HS5 · Sec 4 (Astana Multisectoral PHC)",
          whyTH: "การปรับระบบบริการสู่การสร้างเสริมสุขภาพ (`Reorienting Health Services`) มีระบบสุขภาพปฐมภูมิเป็นหัวใจหลัก",
          whyEN: "Reorienting health services toward health promotion is anchored in Primary Health Care.",
        },
      ],
      keywords: [
        { th: "กฎบัตรออตตาวา ค.ศ. 1986", en: "Ottawa Charter (1986)" },
        { th: "ชี้นำผลักดัน · ไกล่เกลี่ย · เสริมพลัง", en: "Advocate · Mediate · Enable" },
        { th: "สามเสาหลักเซี่ยงไฮ้ ค.ศ. 2016", en: "Shanghai 3 Pillars (2016)" },
        { th: "กฎบัตรเจนีวาเพื่อสุขภาวะ ค.ศ. 2021", en: "Geneva Charter for Well-being (2021)" },
      ],
    },
    "HS4:sum": {
      secLabelTH: "บทสรุป · สังเคราะห์พฤติกรรมสุขภาพ การปรับเปลี่ยนพฤติกรรม และการสร้างเสริมสุขภาพ",
      secLabelEN: "Synthesis · Health Behaviour, Behaviour Change & Health Promotion",
      titleTH: "ผสานความเข้าใจพฤติกรรมรายบุคคล การจัดสถาปัตยกรรมทางเลือก ความรอบรู้ด้านสุขภาพ และนโยบายสาธารณะ",
      titleEN: "Integrating Clinical Behaviour Support, Choice Architecture, Health Literacy & Healthy Public Policy",
      summaryTH: "การจัดการภาระโรคไม่ติดต่อเรื้อรังอย่างยั่งยืนต้องไม่โทษผู้ป่วยฝ่ายเดียว แต่ผสานการรักษาทางการแพทย์เข้ากับการเสริมสมรรถนะ โอกาส ความรอบรู้ด้านสุขภาพ และสิ่งแวดล้อม–นโยบายที่เอื้อต่อสุขภาพ",
      summaryEN: "Sustainable NCD control replaces victim-blaming with an integrated ecosystem uniting pharmacotherapy, COM-B/Nudge design, dual-level health literacy, and healthy public policy.",
      bullets: [
        {
          th: "<strong>บูรณาการครบ 4 มิติของ HS4:</strong> (1) เข้าใจพฤติกรรม 3 ระยะและคัดกรองตามเกณฑ์ความเสี่ยง (2) ออกแบบมาตรการด้วย `HBM`, `Nudge` และ `BCW/COM-B` (3) ยกระดับทั้งความรอบรู้ส่วนบุคคลและองค์กร และ (4) ขับเคลื่อนกฎบัตรออตตาวา–เซี่ยงไฮ้–เจนีวา",
          en: "<strong>Four-Pillar HS4 Synthesis:</strong> Combine risk-appropriate clinical care, COM-B & Nudge intervention design, personal/organizational health literacy, and Ottawa–Geneva health promotion.",
        },
      ],
      flowRoleTH: "สรุปกลไกพฤติกรรมสุขภาพและการสร้างเสริมสุขภาพใน HS4 เพื่อส่งไม้ต่อสู่ HS5: 'ระบบบริการสุขภาพปฐมภูมิ (PHC) จะเชื่อมคลินิก ชุมชน และนโยบายข้ามภาคส่วนเข้าด้วยกันอย่างไร'",
      flowRoleEN: "Synthesizes HS4 and hands off to HS5: how Primary Health Care unites clinical primary care, public health functions, and empowered communities.",
      crossLinks: [
        {
          target: "HS5:1",
          labelTH: "ต่อยอดสู่ HS5 · หมวด 1 (ระบบบริการสุขภาพปฐมภูมิ PHC vs. PC)",
          labelEN: "Next: HS5 · Sec 1 (PHC vs. Primary Care)",
          whyTH: "ระบบบริการสุขภาพปฐมภูมิ (`PHC`) คือเวทีหลักที่เชื่อมการสร้างเสริมสุขภาพ ชุมชน และบริการคลินิกเข้าด้วยกัน",
          whyEN: "Primary Health Care is the frontline platform uniting health promotion, community action, and clinical care.",
        },
      ],
      keywords: [
        { th: "การไม่กล่าวโทษเหยื่อ", en: "Avoiding Victim-Blaming" },
        { th: "นิเวศวิทยาเอื้อสุขภาพ", en: "Health-Enabling Ecosystem" },
      ],
    },

    /* -------------------- HS5: Primary Health Care & Primary Care -------------------- */
    "HS5:1": {
      secLabelTH: "หมวดที่ 1 · ความหมายและความแตกต่างระหว่าง PHC กับ Primary Care",
      secLabelEN: "Section 1 · Primary Health Care (PHC) vs. Primary Care (PC)",
      titleTH: "ระบบบริการสุขภาพปฐมภูมิในฐานะยุทธศาสตร์ของทั้งสังคม เทียบกับบริการปฐมภูมิเชิงคลินิก",
      titleEN: "Whole-of-Society Primary Health Care vs. Clinical Primary Care",
      summaryTH: "บริการปฐมภูมิคือคลินิกด่านหน้าที่ดูแลผู้คนอย่างใกล้ชิด ส่วนระบบบริการสุขภาพปฐมภูมิคือยุทธศาสตร์ของทั้งสังคมที่สร้างสุขภาพดีและความเป็นธรรมแก่ทุกคน",
      summaryEN: "Primary Care is the trusted clinical front door; Primary Health Care is the whole-of-society strategy for equitable health for all.",
      bullets: [
        {
          th: "<strong>แยกแยะขอบเขตให้ชัด:</strong> `Primary Care (PC)` คือการจัดบริการสุขภาพระดับบุคคลและครอบครัวด่านแรก ส่วน `Primary Health Care (PHC)` (Alma-Ata 1978) กว้างกว่าโดยรวมนโยบายข้ามภาคส่วนและการมีส่วนร่วมของชุมชน",
          en: "<strong>Scope Distinction:</strong> Primary Care delivers first-contact clinical services, whereas PHC encompasses multisectoral policy and community empowerment.",
        },
        {
          th: "<strong>PC เป็นแกนกลางของระบบบริการภายในร่มใหญ่ PHC:</strong> ทั้งสองไม่ใช่สิ่งเดียวกันแต่เกื้อหนุนกันโดยมีเป้าหมายคือสุขภาพดีถ้วนหน้าและความเป็นธรรม",
          en: "<strong>Nested Partnership:</strong> High-performing Primary Care sits at the service-delivery core of the broader Primary Health Care approach.",
        },
      ],
      flowRoleTH: "วางนิยามแม่บท `PHC` เทียบกับ `PC` ก่อนชี้ให้เห็นความท้าทายจากการเปลี่ยนผ่านทางระบาดวิทยาและการกระจุกตัวของงบในโรงพยาบาลใหญ่ในหมวด 2",
      flowRoleEN: "Clarifies PHC vs. PC before Section 2 examines how epidemiological shifts and hospital-centrism strain primary-level resources.",
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
        { th: "ระบบบริการสุขภาพปฐมภูมิ", en: "Primary Health Care (PHC)" },
        { th: "บริการปฐมภูมิ", en: "Primary Care (PC)" },
        { th: "คำประกาศอัลมา-อาตา ค.ศ. 1978", en: "Declaration of Alma-Ata (1978)" },
      ],
    },
    "HS5:2": {
      secLabelTH: "หมวดที่ 2 · การเปลี่ยนผ่านภาระโรคและกับดักการยึดโรงพยาบาลเป็นศูนย์กลาง",
      secLabelEN: "Section 2 · Epidemiological Shifts & Hospital-Centrism",
      titleTH: "จากบริการปฐมภูมิแบบเลือกเฉพาะโรค สู่การดูแลรอบด้านและการแก้ความเหลื่อมล้ำของทรัพยากร",
      titleEN: "Overcoming Selective Vertical Programs and Hospital-Centric Resource Skew",
      summaryTH: "เมื่อทรัพยากรไหลไปกระจุกที่ปลายทางโรงพยาบาลใหญ่ ด่านหน้าปฐมภูมิที่ควรป้องกันและคุมโรคเรื้อรังให้คนส่วนใหญ่ย่อมอ่อนแอลง",
      summaryEN: "When budgets gravitate toward specialist hospitals, the frontline primary care needed to prevent and manage chronic illness is starved.",
      bullets: [
        {
          th: "<strong>ก้าวข้าม Selective PHC:</strong> การจัดบริการเฉพาะบางโรคแบบแยกส่วนไม่เพียงพอต่อผู้สูงอายุและผู้ป่วยโรคเรื้อรังร่วมหลายโรค (`multimorbidity`)",
          en: "<strong>Beyond Selective Silos:</strong> Narrow disease-specific programs cannot meet the complex needs of aging patients with multimorbidity.",
        },
        {
          th: "<strong>แก้พีระมิดหัวกลับของงบประมาณและกำลังคน (`Hospital-centrism`):</strong> ต้องปรับทิศทางการลงทุนกลับมาเสริมความเข้มแข็งให้หน่วยบริการปฐมภูมิใกล้บ้าน",
          en: "<strong>Rebalance Hospital-Centrism:</strong> Shifting resources toward community-based primary care improves both equity and allocative efficiency.",
        },
      ],
      flowRoleTH: "ชี้จุดอ่อนของการแยกส่วนและการยึดโรงพยาบาลเป็นศูนย์กลาง เพื่อนำไปสู่ข้อเสนอการปฏิรูป PHC 4 ด้านของ WHO (2008) ในหมวด 3",
      flowRoleEN: "Diagnoses fragmentation and hospital-centrism, motivating WHO's 2008 four-pillar PHC reforms in Section 3.",
      crossLinks: [
        {
          target: "ST1:3",
          labelTH: "ST1 · หมวด 3 (วงจรอุบาทว์ความแออัดโรงพยาบาล)",
          labelEN: "ST1 · Sec 3 (Hospital Crowding Loop)",
          whyTH: "การยึดโรงพยาบาลเป็นศูนย์กลางทำให้ปฐมภูมิอ่อนแอและยิ่งผลักผู้ป่วยกลับไปแออัดในโรงพยาบาลใหญ่",
          whyEN: "Underfunding primary care fuels the exact hospital overcrowding feedback loop analyzed in ST1.",
        },
        {
          target: "HS3:4",
          labelTH: "HS3 · หมวด 4 (ประสิทธิภาพการจัดสรร Allocative Efficiency)",
          labelEN: "HS3 · Sec 4 (Allocative Efficiency)",
          whyTH: "การลงทุนในปฐมภูมิให้ผลตอบแทนทางสุขภาพต่อประชากรคุ้มค่ากว่าการทุ่มงบปลายเหตุเพียงด้านเดียว",
          whyEN: "Investing in comprehensive primary care strengthens system-wide allocative efficiency.",
        },
      ],
      keywords: [
        { th: "การยึดโรงพยาบาลเป็นศูนย์กลาง", en: "Hospital-Centrism" },
        { th: "ภาวะโรคร่วมหลายโรค", en: "Multimorbidity" },
        { th: "ปฐมภูมิแบบรอบด้านเทียบกับเฉพาะโรค", en: "Comprehensive vs. Selective PHC" },
      ],
    },
    "HS5:3": {
      secLabelTH: "หมวดที่ 3 · การปฏิรูประบบบริการสุขภาพปฐมภูมิ 4 ด้าน (WHR 2008)",
      secLabelEN: "Section 3 · World Health Report 2008 Four PHC Reforms",
      titleTH: "หลักประกันถ้วนหน้า บริการยึดคนเป็นศูนย์กลาง นโยบายสาธารณะ และภาวะผู้นำแบบมีส่วนร่วม",
      titleEN: "UHC, People-Centered Service Delivery, Public Policy, and Inclusive Leadership",
      summaryTH: "ปฐมภูมิที่เข้มแข็งไม่ได้สร้างด้วยการตั้งคลินิกเพิ่มเพียงอย่างเดียว แต่ต้องปฏิรูปพร้อมกันทั้งหลักประกันสุขภาพถ้วนหน้า รูปแบบบริการ นโยบายสาธารณะ และการอภิบาล",
      summaryEN: "Strong PHC requires more than building clinics—it demands synchronized reforms in universal health coverage, care delivery, public policy, and leadership.",
      bullets: [
        {
          th: "<strong>4 เสาการปฏิรูป WHR 2008:</strong> (1) ปฏิรูปสู่หลักประกันสุขภาพถ้วนหน้าเพื่อความเป็นธรรม (2) ปฏิรูปบริการให้ยึดประชาชนเป็นศูนย์กลางและมีปฐมภูมิเป็นตัวเชื่อม (`hub`) (3) ปฏิรูปนโยบายสาธารณะเพื่อสุขภาพ และ (4) ปฏิรูปภาวะผู้นำสู่การสานเสวนา",
          en: "<strong>Four Interlocking Reforms (WHR 2008):</strong> Universal health coverage, people-centered service delivery with primary care as hub, healthy public policies, and inclusive leadership.",
        },
      ],
      flowRoleTH: "วางกรอบการปฏิรูป 4 ด้านของปี 2008 ก่อนต่อยอดสู่กรอบมาตรฐานสากลฉบับปัจจุบันคือ 'ปฏิญญาแอสทานา ค.ศ. 2018' ในหมวด 4",
      flowRoleEN: "Sets out WHO 2008's four reform pillars, leading directly into the contemporary 2018 Astana Operational Framework in Section 4.",
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
        { th: "ปฐมภูมิในฐานะศูนย์กลางเชื่อมประสาน", en: "Primary Care as Coordination Hub" },
        { th: "ภาวะผู้นำแบบมีส่วนร่วม", en: "Inclusive Leadership" },
      ],
    },
    "HS5:4": {
      secLabelTH: "หมวดที่ 4 · สามองค์ประกอบหลักตามปฏิญญาแอสทานา ค.ศ. 2018",
      secLabelEN: "Section 4 · Three Components of PHC Under the Declaration of Astana",
      titleTH: "บริการสุขภาพบูรณาการ นโยบายข้ามภาคส่วน และการเสริมพลังประชาชนและชุมชน",
      titleEN: "Integrated Health Services, Multisectoral Policy, and Empowered Communities",
      summaryTH: "ปฏิญญาแอสทานาหลอมรวมสามพลังเข้าด้วยกัน คือบริการปฐมภูมิที่เชื่อมกับสาธารณสุข นโยบายข้ามภาคส่วน และชุมชนที่เป็นเจ้าของการดูแลสุขภาพ",
      summaryEN: "The Astana Declaration unites three forces: integrated primary care and public health, multisectoral action, and empowered communities.",
      bullets: [
        {
          th: "<strong>3 องค์ประกอบของ PHC ยุคใหม่ (Astana 2018):</strong> (1) บริการสุขภาพบูรณาการที่ผสานบริการปฐมภูมิเข้ากับหน้าที่สาธารณสุขพื้นฐาน (2) นโยบายและการกระทำข้ามภาคส่วนจัดการปัจจัยต้นน้ำ และ (3) การเสริมพลังบุคคล ครอบครัว และชุมชน",
          en: "<strong>Three Astana Pillars (2018):</strong> Integrated primary care & essential public health functions, multisectoral policy on determinants, and empowered people and communities.",
        },
      ],
      flowRoleTH: "จากองค์ประกอบที่ 1 ของแอสทานา จึงแตกออกเป็น 2 หมวดถัดไปอย่างเป็นระบบ คือ 'บริการปฐมภูมิระดับบุคคล 4Cs' (หมวด 5) และ 'หน้าที่สาธารณสุขระดับประชากร EPHFs' (หมวด 6)",
      flowRoleEN: "Unpacks Astana's first pillar directly into Section 5 (individual-level 4Cs Primary Care) and Section 6 (population-level EPHFs).",
      crossLinks: [
        {
          target: "HS4:4",
          labelTH: "HS4 · หมวด 4 (กฎบัตรออตตาวาและการเสริมพลังชุมชน)",
          labelEN: "HS4 · Sec 4 (Ottawa Charter Empowerment)",
          whyTH: "องค์ประกอบที่ 2 และ 3 ของแอสทานาสอดประสานเป็นเนื้อเดียวกับยุทธศาสตร์การสร้างเสริมสุขภาพใน HS4",
          whyEN: "Astana's multisectoral and community-empowerment pillars align directly with HS4's Ottawa Charter.",
        },
      ],
      keywords: [
        { th: "ปฏิญญาแอสทานา ค.ศ. 2018", en: "Declaration of Astana (2018)" },
        { th: "บริการสุขภาพแบบบูรณาการ", en: "Integrated Health Services" },
        { th: "การเสริมพลังประชาชนและชุมชน", en: "Empowered People & Communities" },
      ],
    },
    "HS5:5": {
      secLabelTH: "หมวดที่ 5 · คุณลักษณะหลักของบริการปฐมภูมิที่ดี (Starfield's 4Cs)",
      secLabelEN: "Section 5 · Core Functions of High-Quality Primary Care (4Cs)",
      titleTH: "ด่านแรก ครอบคลุมรอบด้าน ต่อเนื่อง และประสานการดูแล บนฐานการยึดคนเป็นศูนย์กลาง",
      titleEN: "First-Contact, Comprehensive, Continuous, and Coordinated Person-Centered Care",
      summaryTH: "หัวใจของหมอครอบครัวไม่ใช่แค่การอยู่ใกล้บ้าน แต่คือการเป็นด่านแรกที่รู้จักชีวิตผู้ป่วย ดูแลรอบด้าน ต่อเนื่องยาวนาน และช่วยประสานทุกขั้นตอนการรักษา",
      summaryEN: "Great primary care is defined not merely by proximity, but by being first-contact, comprehensive, longitudinal, and seamlessly coordinated around the whole person.",
      bullets: [
        {
          th: "<strong>ครบทั้ง 4Cs ของ Starfield:</strong> `First-contact` (ด่านแรกเข้าถึงสะดวก) `Comprehensiveness` (ดูแลครบส่งเสริม ป้องกัน รักษา ฟื้นฟู) `Continuity` (ต่อเนื่องทั้งความสัมพันธ์และข้อมูล) และ `Coordination` (ประสานการส่งต่อไป–กลับ)",
          en: "<strong>Starfield's 4Cs:</strong> First-contact accessibility, Comprehensiveness across care needs, relational/informational Continuity, and active Coordination across levels.",
        },
        {
          th: "<strong>ยึดคนและครอบครัวในบริบทชุมชนเป็นศูนย์กลาง:</strong> ช่วยเพิ่มคุณภาพ ลดการนอนโรงพยาบาลที่หลีกเลี่ยงได้ และสร้างประสิทธิภาพให้ทั้งระบบ",
          en: "<strong>Person- & Family-Centered Impact:</strong> Strong 4Cs primary care lowers avoidable hospitalizations, improves equity, and contains total system costs.",
        },
      ],
      flowRoleTH: "เจาะลึกขาที่ 1 ของบริการบูรณาการ (ดูแลระดับบุคคลและครอบครัวด้วย 4Cs) ก่อนเติมขาที่ 2 คือการคุ้มครองระดับประชากร (`EPHFs`) ในหมวด 6",
      flowRoleEN: "Details the individual/family clinical leg (4Cs) before pairing it with the population public-health leg (EPHFs) in Section 6.",
      crossLinks: [
        {
          target: "HS2:5",
          labelTH: "HS2 · หมวด 5 (ระดับบริการและรูปแบบการดูแล)",
          labelEN: "HS2 · Sec 5 (Levels & Models of Care)",
          whyTH: "4Cs คือนิยามเชิงคุณภาพที่ทำให้บริการระดับปฐมภูมิทำหน้าที่เป็นแกนหลักของระบบส่งต่อได้จริง",
          whyEN: "Starfield's 4Cs define what makes primary-level service delivery work as an integrated hub.",
        },
        {
          target: "HS6:4",
          labelTH: "HS6 · หมวด 4 (การจ่ายเหมาจ่ายรายหัว Capitation แก่ด่านหน้า)",
          labelEN: "HS6 · Sec 4 (Capitation for Gatekeepers)",
          whyTH: "การจ่ายงบเหมาจ่ายรายหัวตามประชากรขึ้นทะเบียนใน HS6 ออกแบบมาเพื่อหนุนหน่วยบริการด่านหน้าตามหลัก 4Cs",
          whyEN: "Population-based capitation in HS6 financially supports registered primary care gatekeepers.",
        },
      ],
      keywords: [
        { th: "ด่านแรก · รอบด้าน · ต่อเนื่อง · ประสานการดูแล", en: "First-Contact · Comprehensive · Continuous · Coordinated (4Cs)" },
        { th: "การดูแลที่ยึดคนเป็นศูนย์กลาง", en: "Person-Centered Care" },
        { th: "ทีมหมอครอบครัว", en: "Family Care Team" },
      ],
    },
    "HS5:6": {
      secLabelTH: "หมวดที่ 6 · หน้าที่ด้านสาธารณสุขที่จำเป็น (EPHFs) ในระบบปฐมภูมิ",
      secLabelEN: "Section 6 · Essential Public Health Functions (EPHFs) in PHC",
      titleTH: "การเฝ้าระวัง คุ้มครอง สร้างเสริม ป้องกัน และเตรียมพร้อมรับภัยสุขภาพระดับประชากร",
      titleEN: "Population Surveillance, Health Protection, Promotion, and Emergency Readiness",
      summaryTH: "คลินิกปฐมภูมิจะสมบูรณ์ได้เมื่อมองข้ามโต๊ะตรวจออกไปดูแลทั้งชุมชน ด้วยการเฝ้าระวังโรค คุ้มครองภัยสุขภาพ และเตรียมพร้อมรับวิกฤต",
      summaryEN: "Primary care fulfills its mission when it looks beyond the exam room to protect whole communities through surveillance, prevention, and emergency readiness.",
      bullets: [
        {
          th: "<strong>ผสานงานคลินิกรายบุคคลเข้ากับสาธารณสุขระดับประชากร (EPHFs):</strong> ครอบคลุมการเฝ้าระวังโรค การคุ้มครองสุขภาพและสิ่งแวดล้อม การสร้างเสริมสุขภาพ การป้องกันโรค และการรับมือภาวะฉุกเฉิน",
          en: "<strong>Unite Clinical Care with Population EPHFs:</strong> Combines epidemiological surveillance, environmental/occupational protection, health promotion, prevention, and disaster preparedness.",
        },
      ],
      flowRoleTH: "เติมเต็มบริการบูรณาการให้ครบทั้งระดับบุคคล (หมวด 5) และระดับประชากร (หมวด 6) ก่อนเชื่อมสู่ระบบหลักประกันและพัฒนาการของไทยในหมวด 7",
      flowRoleEN: "Completes integrated care by joining population EPHFs with individual 4Cs before examining Thailand's PHC–UHC evolution in Section 7.",
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
      titleEN: "From Rural Infrastructure and VHVs to the 2019 Primary Health Care Act & Decentralization",
      summaryTH: "หลักประกันสุขภาพถ้วนหน้าของไทยสำเร็จได้เพราะมีโครงข่ายปฐมภูมิเป็นฐานรองรับ และโจทย์ใหม่ของการกระจายอำนาจคือการรักษาความเชื่อมโยงไม่ให้แยกส่วน",
      summaryEN: "Thailand's UHC succeeded because decades of district primary care laid its foundation; today's decentralization challenge is keeping care seamlessly connected.",
      bullets: [
        {
          th: "<strong>PHC คือรากฐานที่ทำให้ UHC เกิดผลจริงในพื้นที่:</strong> การลงทุนโรงพยาบาลชุมชน สถานีอนามัย/รพ.สต. และ อสม. ยาวนานหลายทศวรรษทำให้สิทธิหลักประกันไม่เป็นเพียงสิทธิบนกระดาษ",
          en: "<strong>PHC Turns Legal UHC into Real Access:</strong> Thailand's rural district health network and Village Health Volunteers enabled equitable access once UHC removed financial barriers.",
        },
        {
          th: "<strong>กฎหมายปฐมภูมิและการถ่ายโอน รพ.สต. สู่ อบจ.:</strong> พ.ร.บ.ระบบสุขภาพปฐมภูมิ พ.ศ. 2562 รับรองสิทธิการมีทีมหมอครอบครัว ขณะที่การถ่ายโอน รพ.สต. ต้องออกแบบการอภิบาลการเงินและระบบส่งต่อร่วมกันไม่ให้เกิดช่องว่าง",
          en: "<strong>2019 PHC Act & Decentralization:</strong> Guarantees family-care teams by law, while transferring subdistrict health centers to local governments requires tight clinical and financing coordination.",
        },
      ],
      flowRoleTH: "สังเคราะห์พัฒนาการปฐมภูมิไทยและชี้ว่า 'มีหน่วยบริการใกล้บ้านแล้วยังต้องมีกลไกการคลังและหลักประกันสุขภาพมารองรับ' ส่งไม้ต่อเข้าสู่ HS6 โดยตรง",
      flowRoleEN: "Synthesizes Thailand's PHC platform and bridges directly into HS6: the health insurance and purchasing mechanisms that finance universal access.",
      crossLinks: [
        {
          target: "HS6:1",
          labelTH: "HS6 · หมวด 1 (หลักประกันสุขภาพคู่โครงสร้างบริการที่ทั่วถึง)",
          labelEN: "HS6 · Sec 1 (Insurance + Service Infrastructure for UHC)",
          whyTH: "หมวดที่ 1 ของ HS6 ระบุชัดว่า UHC ต้องอาศัยทั้งหลักประกันสุขภาพและโครงสร้างระบบบริการที่กระจายทั่วถึงควบคู่กัน",
          whyEN: "Directly mirrors HS6 Section 1's thesis that UHC requires both financial pooling and geographically accessible delivery infrastructure.",
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
      secLabelTH: "บทสรุป · สังเคราะห์ระบบบริการสุขภาพปฐมภูมิและบริการปฐมภูมิ",
      secLabelEN: "Synthesis · Primary Health Care & Primary Care",
      titleTH: "บทสรุปปฐมภูมิในฐานะหัวใจของระบบสุขภาพที่เป็นธรรม คุ้มค่า และยึดประชาชนเป็นศูนย์กลาง",
      titleEN: "Primary Health Care as the Cornerstone of Equitable, Resilient Health Systems",
      summaryTH: "ระบบปฐมภูมิที่ผสานคลินิก 4Cs งานสาธารณสุข EPHFs และพลังชุมชนเข้าด้วยกัน คือคานงัดสำคัญที่สุดสู่สุขภาพดีถ้วนหน้า",
      summaryEN: "Uniting 4Cs clinical primary care, population EPHFs, and community empowerment provides the single strongest lever for Universal Health Coverage.",
      bullets: [
        {
          th: "<strong>เชื่อมครบทั้งบริการ นโยบาย และชุมชน:</strong> เมื่อด่านหน้าปฐมภูมิเข้มแข็ง ระบบบริการทั้งหมดจะทำงานได้อย่างมีคุณภาพ เป็นธรรม และประหยัดทรัพยากรปลายน้ำ",
          en: "<strong>Strong Frontline, Sustainable System:</strong> Robust primary health care elevates quality and equity while relieving costly hospital bottlenecks.",
        },
      ],
      flowRoleTH: "สรุปฐานการจัดบริการปฐมภูมิใน HS5 แล้วส่งต่อสู่บทสุดท้าย HS6: 'เราจะออกแบบระบบประกันสุขภาพและการจ่ายเงินอย่างไรให้คนเข้าถึงบริการนี้โดยไม่ล้มละลาย'",
      flowRoleEN: "Completes the delivery backbone in HS5 and hands off to HS6: financing universal access and aligning provider payment incentives.",
      crossLinks: [
        {
          target: "HS6:1",
          labelTH: "ต่อยอดสู่ HS6 · หมวด 1 (หลักการของการประกันสุขภาพ)",
          labelEN: "Next: HS6 · Sec 1 (Principles of Health Insurance)",
          whyTH: "เติมกลไกการคลังสุขภาพและหลักประกันความเสี่ยงทางการเงินเพื่อปลดล็อกอุปสรรคค่าใช้จ่ายในการเข้าถึงบริการ",
          whyEN: "Adds the health-financing and risk-pooling engine that removes financial barriers to care.",
        },
      ],
      keywords: [
        { th: "ปฐมภูมิเป็นฐานรากของ UHC", en: "PHC Foundation of UHC" },
        { th: "การบูรณาการคลินิกและสาธารณสุข", en: "Clinical–Public Health Integration" },
      ],
    },

    /* -------------------- HS6: Health Insurance, UHC & Provider Payment -------------------- */
    "HS6:1": {
      secLabelTH: "หมวดที่ 1 · หลักการของการประกันสุขภาพ",
      secLabelEN: "Section 1 · Principles of Health Insurance",
      titleTH: "การซื้อความแน่นอน กฎจำนวนมาก หน้าที่คุ้มครองสองมิติ และศักยภาพการเกลี่ยความเสี่ยงและรายได้",
      titleEN: "Buying Certainty, Law of Large Numbers, Dual Protection, and Redistributive Pooling",
      summaryTH: "ป่วยเมื่อไรไม่มีใครรู้ล่วงหน้า แต่เมื่อรวมคนกลุ่มใหญ่จ่ายเงินเข้ากองทุนภาคบังคับตามกำลังทรัพย์ ความเสี่ยงของแต่ละคนจึงกลายเป็นหลักประกันที่เป็นธรรมของทุกคน",
      summaryEN: "Individual illness is unpredictable, yet pooling mandatory prepayments across a large, diverse population turns personal uncertainty into equitable security for all.",
      bullets: [
        {
          th: "<strong>จากความไม่แน่นอนปัจเจกสู่ความคาดการณ์ได้ระดับประชากร:</strong> ผู้ซื้อประกันแลกเบี้ยกับความแน่นอน (`certainty`) และช่องทางเข้าถึงการรักษาราคาแพง (`access motive`) โดยอาศัยกฎจำนวนมาก (`law of large numbers`) คำนวณค่าใช้จ่ายคาดหมายของกลุ่ม",
          en: "<strong>Predictability Through Pooling:</strong> Insurance satisfies both risk aversion (buying certainty) and the access motive by applying the law of large numbers across a population.",
        },
        {
          th: "<strong>ตลาดประกันสมัครใจมีเงื่อนไขจำกัด 4 ข้อ:</strong> ทำงานได้เฉพาะเมื่อโอกาสป่วย < 1 เป็นเหตุสุ่ม ความเสี่ยงอิสระต่อกัน และไม่มี `adverse selection` หรือ `moral hazard` รุนแรงเกินไป",
          en: "<strong>Strict Limits of Voluntary Insurability:</strong> Voluntary markets require random independent losses (< 1) without excessive information asymmetry (adverse selection) or moral hazard.",
        },
        {
          th: "<strong>หน้าที่คู่สู่ความเป็นธรรมและ UHC:</strong> (1) อำนวยการเข้าถึงบริการที่จำเป็น และ (2) ปกป้องครัวเรือนจากรายจ่ายหายนะและความยากจนจากค่ารักษา ควบคู่กับโครงสร้างบริการที่กระจายทั่วถึง",
          en: "<strong>Dual Insurance Function for UHC:</strong> Enables access to needed care and protects households from catastrophic spending and medical impoverishment alongside accessible service infrastructure.",
        },
        {
          th: "<strong>ศักยภาพการเกลี่ยขึ้นกับขนาด ความหลากหลาย ความเป็นภาคบังคับ และสูตรเงินสมทบ:</strong> ลำดับเชิงหลักการคือ `อัตราก้าวหน้า > สัดส่วนรายได้ไม่มีเพดาน > มีเพดาน > community rating > risk rating` (และไทยใช้ภาษีทั่วไปใน UCS เพราะแรงงานนอกระบบบังคับเก็บเงินสมทบยาก)",
          en: "<strong>Redistributive Capacity Design:</strong> Large, diverse, compulsory pools redistribute best; contribution equity ranks Progressive > Uncapped Proportional > Capped Proportional > Community Rating > Individual Risk Rating.",
        },
      ],
      flowRoleTH: "วางรากฐานทฤษฎีการรวมความเสี่ยงและความเป็นธรรมในหมวด 1 ก่อนดูว่าต้องมี 'องค์กรผู้รับประกันทำหน้าที่อะไรบ้าง' เพื่อบริหารกองทุนนี้ในหมวด 2",
      flowRoleEN: "Establishes the theoretical rationale for prepayment and pooling before Section 2 introduces the third-party insurer needed to run the pool.",
      crossLinks: [
        {
          target: "HS3:2",
          labelTH: "HS3 · หมวด 2 (ความเป็นธรรมด้านบริการและการคลัง)",
          labelEN: "HS3 · Sec 2 (Equity in Access & Finance)",
          whyTH: "หน้าที่ทั้งสองประการและลำดับความก้าวหน้าของเงินสมทบสร้างความเป็นธรรมทั้งด้านการใช้บริการและด้านการคลังโดยตรง",
          whyEN: "Directly operationalizes HS3's horizontal/vertical equity in care access and progressive financing.",
        },
        {
          target: "HS5:7",
          labelTH: "HS5 · หมวด 7 (โครงข่ายปฐมภูมิเป็นฐานรองรับ UHC)",
          labelEN: "HS5 · Sec 7 (PHC Platform for UHC)",
          whyTH: "การมีหลักประกันสุขภาพต้องเดินคู่กับโครงข่ายหน่วยบริการปฐมภูมิที่กระจายทั่วถึงจึงจะบรรลุ UHC ได้จริง",
          whyEN: "Financial coverage achieves UHC only when paired with geographically distributed primary care.",
        },
      ],
      keywords: [
        { th: "การซื้อความแน่นอนและแรงจูงใจเข้าถึงบริการ", en: "Certainty & Access Motive" },
        { th: "การจ่ายล่วงหน้าและการรวมกองทุน", en: "Prepayment & Risk Pooling" },
        { th: "รายจ่ายสุขภาพระดับหายนะ", en: "Catastrophic Health Expenditure" },
        { th: "การเกลี่ยความเสี่ยงและการเกลี่ยปันรายได้", en: "Risk Cross-Subsidy & Income Redistribution" },
      ],
    },
    "HS6:2": {
      secLabelTH: "หมวดที่ 2 · องค์ประกอบของการประกันสุขภาพ",
      secLabelEN: "Section 2 · Components of Health Insurance",
      titleTH: "บทบาทของผู้รับประกันในฐานะบุคคลที่สาม การบริหารการคลัง และระบบข้อมูลสารสนเทศ",
      titleEN: "The Third-Party Insurer, Financial Management, and Information Systems",
      summaryTH: "เมื่อเปลี่ยนจากจ่ายเงินเองเป็นระบบประกัน ผู้รับประกันจะก้าวเข้ามาเป็นบุคคลที่สามที่เชื่อมสิทธิของประชาชนเข้ากับคุณภาพและความสมดุลทางการคลังของหน่วยบริการ",
      summaryEN: "Moving from out-of-pocket payment to insurance introduces a third-party payer that stewards benefits, fund solvency, provider contracts, and data.",
      bullets: [
        {
          th: "<strong>เปลี่ยนความสัมพันธ์จากสองฝ่ายเป็นสามฝ่าย:</strong> มีผู้รับประกัน (`Insurer`) ทำหน้าที่บริหารชุดสิทธิประโยชน์ให้ผู้มีสิทธิ (`Beneficiaries`) พร้อมทำสัญญาและจ่ายค่าบริการแก่หน่วยบริการ (`Providers`)",
          en: "<strong>Triangular Health Financing Relationship:</strong> A third-party insurer/purchaser mediates between beneficiaries and healthcare providers.",
        },
        {
          th: "<strong>หัวใจความสำเร็จคือการบริหารการคลังและระบบข้อมูล:</strong> ต้องคำนวณและระดมทุนให้เพียงพอ กำหนดอัตราและบริหารการเบิกจ่ายอย่างมีประสิทธิภาพ บนฐานระบบข้อมูลสารสนเทศที่ใช้วางแผนและกำกับติดตามได้จริง",
          en: "<strong>Financial Stewardship & Data Backbone:</strong> Sustainable purchasing depends on sound actuarial budgeting, rate-setting, claims management, and robust health information systems.",
        },
      ],
      flowRoleTH: "อธิบายกลไกการทำงานของ 'ผู้รับประกัน' ในหมวด 2 เพื่อเป็นกรอบเปรียบเทียบระบบประกันภาคสมัครใจและภาคบังคับของไทยในหมวด 3",
      flowRoleEN: "Defines the institutional functions of the third-party payer before comparing how voluntary and compulsory Thai schemes organize this role in Section 3.",
      crossLinks: [
        {
          target: "HS2:4",
          labelTH: "HS2 · หมวด 4 (เชื่อมเสาการคลัง ข้อมูล และบริการ)",
          labelEN: "HS2 · Sec 4 (Linking Building Blocks)",
          whyTH: "ผู้รับประกันเป็นจุดเชื่อมสำคัญระหว่าง Building Block ด้านการคลัง ระบบข้อมูลสารสนเทศ และการจัดบริการสุขภาพ",
          whyEN: "Illustrates how the financing block relies on health information systems to purchase services effectively.",
        },
      ],
      keywords: [
        { th: "ผู้รับประกันในฐานะบุคคลที่สาม", en: "Third-Party Payer / Insurer" },
        { th: "ผู้มีสิทธิและหน่วยบริการคู่สัญญา", en: "Beneficiaries & Contracted Providers" },
        { th: "การบริหารจัดการด้านการคลังและข้อมูล", en: "Financial Management & Health Information" },
      ],
    },
    "HS6:3": {
      secLabelTH: "หมวดที่ 3 · ประเภทของการประกันสุขภาพในประเทศไทย",
      secLabelEN: "Section 3 · Types of Health Insurance in Thailand",
      titleTH: "ปัญหา Adverse Selection ในประกันสมัครใจ และสถาปัตยกรรมประกันภาคบังคับสามระบบหลักของไทย",
      titleEN: "Adverse Selection in Voluntary Markets & Thailand's Compulsory Coverage Architecture",
      summaryTH: "ตลาดสมัครใจคัดกรองคนเสี่ยงออกเพื่อความอยู่รอดของกองทุน แต่ระบบภาคบังคับโอบรับทุกคนเข้าด้วยกันเพื่อแก้ปัญหาการคัดเลือกที่ขัดผลประโยชน์อย่างเบ็ดเสร็จ",
      summaryEN: "Voluntary insurers screen out high risks to survive, whereas compulsory universal systems include everyone to solve adverse selection completely.",
      bullets: [
        {
          th: "<strong>Adverse selection คือจุดเปราะบางของประกันสมัครใจ:</strong> คนเสี่ยงสูงอยากซื้อมากกว่าคนแข็งแรง เอกชนจึงใช้ `risk rating`, `underwriting`, ตัดโรคเดิม หรือแบ่งแผน ขณะที่ทางแก้เบ็ดเสร็จคือระบบภาคบังคับถ้วนหน้า",
          en: "<strong>Adverse Selection & Policy Remedies:</strong> Private insurers counter high-risk self-selection via risk rating, underwriting, and exclusions, whereas mandatory universal pooling eliminates it at the root.",
        },
        {
          th: "<strong>จำแนกประกันภาคบังคับในไทยครบ 4 รูปแบบ:</strong> ประกันสังคม (`SHI` ร่วมสมทบ 3 ฝ่าย เฉพาะตัวผู้ประกันตน) ระบบภาษี (`UCS`, `CSMBS`, ท้องถิ่น, ผู้มีปัญหาสถานะและสิทธิ) ประกันเฉพาะกรณี (พ.ร.บ.รถ, กองทุนเงินทดแทน) และประกันสุขภาพแรงงานต่างด้าว",
          en: "<strong>Four Compulsory Modes in Thailand:</strong> Tripartite Social Health Insurance (SSS), tax-financed schemes (UCS, CSMBS, local govt, stateless), specific-risk mandates (Road Traffic Act, WCS), and Migrant Health Insurance.",
        },
        {
          th: "<strong>ภาพรวม 3 กองทุนหลักของไทย (ต.ค. 2567):</strong> `UCS` 46.9 ล้านคน, `SSS` 12.8 ล้านคน และ `CSMBS` 5.4 ล้านคน ทำงานควบคู่กับสิทธิซ้ำซ้อนเฉพาะกรณี โดยมีความต่างสำคัญที่แหล่งเงินและวิธีจ่ายค่าบริการ",
          en: "<strong>Thailand's Three Main Schemes:</strong> UCS (46.9M), SSS (12.8M), and CSMBS (5.4M) achieve near-universal health coverage while differing in revenue sources and provider payment methods.",
        },
      ],
      flowRoleTH: "ชี้ให้เห็นในตารางที่ 1 ว่าแต่ละกองทุนของไทยใช้วิธีจ่ายเงินแก่โรงพยาบาลต่างกัน จึงส่งต่อเข้าสู่หมวด 4 เพื่อวิเคราะห์กลไกวิธีจ่ายเงินทั้ง 4 รูปแบบอย่างเป็นระบบ",
      flowRoleEN: "Table 1 reveals distinct provider payment designs across UCS, SSS, and CSMBS, motivating Section 4's systematic comparison of the four payment methods.",
      crossLinks: [
        {
          target: "HS6:1",
          labelTH: "HS6 · หมวด 1 (เงื่อนไขรับประกันข้อ 2 และขนาดกองทุน)",
          labelEN: "HS6 · Sec 1 (Information Asymmetry & Pool Size)",
          whyTH: "ปัญหา `adverse selection` ในหมวด 3 คือผลในโลกจริงเมื่อเงื่อนไขข้อมูลสมมาตรในหมวด 1 ไม่เป็นจริง",
          whyEN: "Shows the real-world market consequence when Section 1's no-excessive-asymmetry condition fails.",
        },
        {
          target: "HS3:2",
          labelTH: "HS3 · หมวด 2 (ความเหลื่อมล้ำระหว่างกองทุน)",
          labelEN: "HS3 · Sec 2 (Cross-Scheme Equity)",
          whyTH: "การเปรียบเทียบสิทธิ แหล่งเงิน และวิธีจ่ายของ UCS, SSS, CSMBS เป็นโจทย์สำคัญของการวิเคราะห์ความเป็นธรรมในไทย",
          whyEN: "Comparing UCS, SSS, and CSMBS illuminates ongoing horizontal equity questions in Thailand.",
        },
      ],
      keywords: [
        { th: "การคัดเลือกที่ขัดผลประโยชน์กัน", en: "Adverse Selection" },
        { th: "การคัดกรองความเสี่ยงและตัดโรคเดิม", en: "Underwriting & Pre-Existing Exclusions" },
        { th: "สามกองทุนหลัก (UCS · SSS · CSMBS)", en: "Thailand's Three Main Schemes" },
        { th: "การประกันแบบซ้ำซ้อน", en: "Duplicated Coverage" },
      ],
    },
    "HS6:4": {
      secLabelTH: "หมวดที่ 4 · รูปแบบการจ่ายค่าบริการในระบบประกันสุขภาพ",
      secLabelEN: "Section 4 · Provider Payment Methods",
      titleTH: "สมการต้นทุน ปัจจัยผลักดันค่าใช้จ่าย (Cost Drivers) และการโยกความเสี่ยงทางการเงินทั้ง 4 รูปแบบ",
      titleEN: "Cost Equations, Cost Drivers, and Financial Risk Transfer Across 4 Payment Methods",
      summaryTH: "วิธีที่กองทุนจ่ายเงินคือสัญญาณกำหนดพฤติกรรมโรงพยาบาล จ่ายตามรายการกองทุนรับความเสี่ยง แต่เหมาจ่ายล่วงหน้าโยกความเสี่ยงให้หน่วยบริการร่วมคุมต้นทุน",
      summaryEN: "How a fund pays providers shapes how care is delivered: retrospective fee-for-service leaves financial risk with the payer, while prospective payments shift risk to providers.",
      bullets: [
        {
          th: "<strong>Fee-for-service (จ่ายย้อนหลังตามรายการ):</strong> ทุกตัวคูณ (`Visits × Quantity × Price × Intensity`) ผลักดันรายจ่าย ความเสี่ยงทางการเงินจึงตกอยู่ที่กองทุนเป็นหลัก",
          en: "<strong>Fee-for-Service (Retrospective):</strong> Every volume, price, and intensity variable drives spending, leaving financial risk squarely on the insurance fund.",
        },
        {
          th: "<strong>Capitation (เหมาจ่ายรายหัว):</strong> ผูกงบตามจำนวนผู้มีสิทธิขึ้นทะเบียนหน่วยบริการด่านหน้า (`gatekeeper`) โยกความเสี่ยงให้หน่วยบริการบริหารจัดการต้นทุนและเน้นสร้างเสริมป้องกัน",
          en: "<strong>Capitation (Per Registered Person):</strong> Ties revenue to enrolled population size, shifting financial risk to primary care gatekeepers to manage costs proactively.",
        },
        {
          th: "<strong>Case-based / DRGs และ Global Budget:</strong> `DRGs` จ่ายตามค่าน้ำหนักสัมพัทธ์ความรุนแรงโรคให้โรงพยาบาลคุมต้นทุนต่อรายแต่ต้องระวัง `DRG creep` (ลงรหัสสูงเกินจริง) ส่วน `Global budget` เพดานงบรวมคงที่ทำให้กองทุนไม่เสี่ยงงบบานปลาย",
          en: "<strong>DRGs & Global Budget:</strong> DRGs incentivize within-case efficiency (requiring audit against DRG creep upcoding), while a global budget caps total fund liability.",
        },
      ],
      flowRoleTH: "เข้าใจสมการแรงจูงใจของวิธีจ่ายเงินทั้ง 4 แบบในหมวด 4 แล้ว จึงพร้อมวิเคราะห์ปัญหา `Moral hazard` และการใช้วิธีจ่ายเงินเป็นมาตรการควบคุมทางอ้อมในหมวด 5",
      flowRoleEN: "Mastering payment incentives in Section 4 directly unlocks Section 5: why third-party payment induces moral hazard and how prospective payment contains it.",
      crossLinks: [
        {
          target: "ST1:4",
          labelTH: "ST1 · หมวด 4 (กติกาการจ่ายเงินคือโครงสร้างใต้ภูเขาน้ำแข็ง)",
          labelEN: "ST1 · Sec 4 (Payment Rules as System Structure)",
          whyTH: "กติกาการจ่ายค่าบริการเป็นชั้น 'โครงสร้างระบบ' ที่กำหนดแนวโน้มพฤติกรรมการให้บริการและ `DRG creep`",
          whyEN: "Provider payment formulas act as powerful structural incentives beneath clinical utilization patterns.",
        },
        {
          target: "HS3:4",
          labelTH: "HS3 · หมวด 4 (ประสิทธิภาพของระบบบริการ)",
          labelEN: "HS3 · Sec 4 (System Efficiency)",
          whyTH: "การผสมผสาน Capitation และ DRG ภายใต้งบยอดรวมเป็นกลไกสำคัญที่ทำให้ระบบสุขภาพไทยควบคุมต้นทุนได้อย่างมีประสิทธิภาพ",
          whyEN: "Closed-end capitation and DRG global budgets underpin Thailand's renowned health-system efficiency.",
        },
      ],
      keywords: [
        { th: "การจ่ายตามรายบริการ · เหมาจ่ายรายหัว", en: "Fee-for-Service · Capitation" },
        { th: "กลุ่มวินิจฉัยโรคร่วมและน้ำหนักสัมพัทธ์", en: "DRGs & Relative Weight (RW)" },
        { th: "การลงรหัสโรคสูงเกินจริง", en: "DRG Creep (Upcoding)" },
        { th: "งบประมาณยอดรวมและการโยกความเสี่ยง", en: "Global Budget & Financial Risk Transfer" },
      ],
    },
    "HS6:5": {
      secLabelTH: "หมวดที่ 5 · ปัญหาการขาดจริยธรรม (Moral Hazard) และการควบคุมค่าใช้จ่าย",
      secLabelEN: "Section 5 · Moral Hazard & Cost Containment",
      titleTH: "Moral Hazard สองฝั่ง การยกเว้นส่วนร่วมจ่ายให้กลุ่มเปราะบาง และพลังของการควบคุมทางอ้อมฝั่งผู้ให้บริการ",
      titleEN: "Dual-Sided Moral Hazard, Protecting Vulnerable Groups, and Indirect Supply-Side Control",
      summaryTH: "เมื่อมีผู้จ่ายแทนย่อมเสี่ยงเกิดการใช้และสั่งบริการเกินจำเป็น การคุมรายจ่ายที่ชาญฉลาดจึงเน้นปรับแรงจูงใจฝั่งผู้ให้บริการโดยไม่ตั้งกำแพงร่วมจ่ายกั้นกลุ่มเปราะบาง",
      summaryEN: "Third-party payment tempts overuse on both sides; wise cost containment realigns provider payment incentives while shielding vulnerable patients from user fees.",
      bullets: [
        {
          th: "<strong>Moral hazard เกิดได้ทั้งสองฝั่ง:</strong> ฝั่งผู้ใช้บริการอาจลดความระมัดระวังหรือใช้บริการเกินจำเป็น ขณะที่ฝั่งผู้ให้บริการมีอิทธิพลต่อค่าใช้จ่ายมากกว่าผ่านการสั่งยาแพง การตรวจวินิจฉัย หรือการนอนโรงพยาบาลเกินจำเป็น (โดยเฉพาะภายใต้ `FFS`)",
          en: "<strong>Two-Sided Moral Hazard:</strong> Consumers may increase risky habits or discretionary visits, while providers hold far greater sway over costly drugs, tests, and admissions under FFS.",
        },
        {
          th: "<strong>ระวังผลข้างเคียงของส่วนร่วมจ่าย (`Co-payment`, `Co-insurance`, `Deductible`):</strong> สำหรับคนจน ผู้ป่วยโรคเรื้อรัง ผู้สูงอายุ และผู้พิการ การร่วมจ่ายไม่ต่างจากการจ่ายเงินเองที่กั้นการรักษาที่จำเป็น จึงต้องยกเว้นให้กลุ่มเปราะบางและใช้ `primary care gatekeeper` ช่วยคัดกรอง",
          en: "<strong>Protect Vulnerable Groups from User Fees:</strong> Cost-sharing deters essential care among the poor, elderly, disabled, and chronically ill—requiring explicit exemptions alongside primary care gatekeeping.",
        },
        {
          th: "<strong>มาตรการทางอ้อมฝั่งผู้ให้บริการเหมาะสมและยั่งยืนกว่ามาตรการทางตรง:</strong> แทนที่จะก้าวล่วงดุลยพินิจแพทย์ทุกเคส การเปลี่ยนวิธีจ่ายเงินจาก `FFS` เป็นแบบล่วงหน้า (`capitation`, `case-based`, `global budget`) ควบคู่กับบัญชียาหลักแห่งชาติช่วยคุมต้นทุนโดยไม่เสียคุณภาพและการเข้าถึง",
          en: "<strong>Indirect Payment Reform Beats Micromanagement:</strong> Shifting from FFS to prospective payment—supported by essential drug lists and targeted prior authorization—contains costs without intruding on clinical autonomy.",
        },
      ],
      flowRoleTH: "ประสานหลักความเป็นธรรม (หมวด 1) และวิธีจ่ายเงิน (หมวด 4) เข้าด้วยกัน เพื่อสรุปหลักการออกแบบระบบประกันสุขภาพที่สมดุลทั้งประสิทธิภาพ คุณภาพ และการเข้าถึง",
      flowRoleEN: "Synthesizes Equity (Section 1) and Payment Incentives (Section 4) into balanced cost containment that preserves Efficiency, Quality, and Access.",
      crossLinks: [
        {
          target: "HS1:3",
          labelTH: "HS1 · หมวด 3 (การป้องกันระดับที่สี่ลดบริการเกินจำเป็น)",
          labelEN: "HS1 · Sec 3 (Quaternary Prevention)",
          whyTH: "การตระหนักรู้ต่อ `provider's moral hazard` และ `supplier-induced demand` สอดคล้องโดยตรงกับจริยธรรมการป้องกันระดับที่สี่",
          whyEN: "Curbing supplier-induced demand aligns financial stewardship with quaternary prevention ethics.",
        },
        {
          target: "HS3:7",
          labelTH: "HS3 · หมวด 7 (ชั่งน้ำหนัก Efficiency · Quality · Equity)",
          labelEN: "HS3 · Sec 7 (Balancing EQESaRR Trade-Offs)",
          whyTH: "การยกเว้นส่วนร่วมจ่ายให้กลุ่มเปราะบางและเปลี่ยนวิธีจ่ายเงินผู้ให้บริการคือตัวอย่างต้นแบบของการรักษาสมดุล EQESaRR",
          whyEN: "Exempting vulnerable patients while reforming provider payment exemplifies balanced EQESaRR policy design.",
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
      secLabelTH: "บทสรุป · สังเคราะห์การประกันสุขภาพ หลักประกันสุขภาพถ้วนหน้า และกลไกการจ่ายเงิน",
      secLabelEN: "Synthesis · Health Insurance, UHC, and Provider Payment",
      titleTH: "บทสรุปความเป็นปึกแผ่นทางสังคม (Solidarity) ความเป็นธรรม และความยั่งยืนของระบบหลักประกันสุขภาพ",
      titleEN: "Achieving Social Solidarity, Equity, and Financial Sustainability Under UHC",
      summaryTH: "หลักประกันสุขภาพภาคบังคับสร้างความเป็นปึกแผ่นที่คุ้มครองทุกคนจากความยากจนยามเจ็บป่วย และยั่งยืนได้ด้วยการจ่ายเงินผู้ให้บริการที่สมดุลระหว่างประสิทธิภาพ คุณภาพ และการเข้าถึง",
      summaryEN: "Compulsory universal insurance builds social solidarity against medical impoverishment, sustained by smart provider payments that safeguard efficiency, quality, and access.",
      bullets: [
        {
          th: "<strong>ร้อยเรียงครบวงจร HS6:</strong> รวมความเสี่ยงระดับประชากร (หมวด 1) → บริหารผ่านผู้รับประกันและข้อมูล (หมวด 2) → ใช้ระบบภาคบังคับแก้ `adverse selection` (หมวด 3) → ออกแบบวิธีจ่ายเงินและมาตรการฝั่งผู้ให้บริการแก้ `moral hazard` โดยไม่กระทบกลุ่มเปราะบาง (หมวด 4–5)",
          en: "<strong>Complete HS6 Logic Chain:</strong> Population risk pooling (Sec 1) → Third-party purchasing (Sec 2) → Compulsory solidarity overcoming adverse selection (Sec 3) → Prospective supply-side incentives containing moral hazard equitably (Sec 4–5).",
        },
      ],
      flowRoleTH: "ปิดฉากเส้นทางการเรียนรู้ทั้งชุด `ST1 → HS1 → HS2 → HS3 → HS4 → HS5 → HS6` อย่างสมบูรณ์ เชื่อมแนวคิดระบบ สุขภาพ ปฐมภูมิ และการคลังสุขภาพเข้าเป็นภาพเดียวกัน",
      flowRoleEN: "Completes the entire RACM 303 Health Systems arc (ST1 → HS1–HS6), uniting systems thinking, determinants, primary care, and equitable health financing.",
      crossLinks: [
        {
          target: "ST1:4",
          labelTH: "ย้อนเชื่อมรากฐาน ST1 · หมวด 4 (การคิดเชิงระบบครบวงจร)",
          labelEN: "Full Circle: ST1 · Sec 4 (Systems Thinking Synthesis)",
          whyTH: "เห็นครบทั้งเหตุการณ์ผู้ป่วย แนวโน้มค่าใช้จ่าย โครงสร้างกองทุน/การจ่ายเงิน และกรอบความคิดความเป็นปึกแผ่นในสังคม (`Solidarity`)",
          whyEN: "Completes the Iceberg lens from bedside illness events down to financing structures and the mental model of social solidarity.",
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
        { th: "หลักประกันสุขภาพถ้วนหน้า", en: "Universal Health Coverage (UHC)" },
        { th: "ความเป็นปึกแผ่นในสังคม", en: "Social Solidarity" },
        { th: "ดุลยภาพประสิทธิภาพ · คุณภาพ · ความเป็นธรรม", en: "Efficiency · Quality · Equity Balance" },
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

  function getGeminiKey() {
    try {
      return (localStorage.getItem(GEMINI_KEY_STORAGE) || "").trim();
    } catch (_) {
      return "";
    }
  }

  function setGeminiKey(k) {
    try {
      if (k && k.trim()) localStorage.setItem(GEMINI_KEY_STORAGE, k.trim());
      else localStorage.removeItem(GEMINI_KEY_STORAGE);
    } catch (_) {
      /* ignore */
    }
  }

  function loadLiveCache() {
    try {
      const raw = localStorage.getItem(LIVE_CACHE_STORAGE);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveLiveCache(cache) {
    try {
      localStorage.setItem(LIVE_CACHE_STORAGE, JSON.stringify(cache));
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

  function matchSubheadingToSectionKey(modCode, h3Text) {
    if (!modCode || !MODULE_META[modCode]) return "";
    const clean = String(h3Text || "").replace(/\s+/g, " ").trim();
    const m = clean.match(/^(\d+)\.\d+\b/);
    if (m) {
      const k = `${modCode}:${m[1]}`;
      return TAKEAWAYS_DB[k] ? k : "";
    }
    return "";
  }

  /* ---------- Extract Raw Section Prose for Live Gemini 4 Carbon · High ---------- */
  function extractSectionProseFromDocs(ktKey) {
    const [modCode, secId] = String(ktKey || "").split(":");
    const docs = (window.RACM_HS_DATA && window.RACM_HS_DATA.docs) || [];
    const targetDoc =
      docs.find((d) => d.id === modCode) || docs.find((d) => d.id === `${modCode}-CONCISE`);
    if (!targetDoc || !targetDoc.html) return "";

    const tmp = document.createElement("div");
    tmp.innerHTML = targetDoc.html;
    const h2s = [...tmp.querySelectorAll("h2")];
    for (let i = 0; i < h2s.length; i++) {
      const h = h2s[i];
      if (h.classList && h.classList.contains("doc-h1")) continue;
      const matched = matchHeadingToSectionKey(modCode, h.textContent || "");
      if (matched === ktKey) {
        const parts = [h.textContent.trim()];
        let cur = h.nextElementSibling;
        while (cur && cur.tagName !== "H2") {
          const t = (cur.textContent || "").replace(/\s+/g, " ").trim();
          if (t) parts.push(t);
          cur = cur.nextElementSibling;
        }
        return parts.join("\n").slice(0, 6500);
      }
    }
    return "";
  }

  function extractTextFromGeminiJson(json) {
    const cands = (json && json.candidates) || [];
    if (!cands.length || !cands[0].content || !Array.isArray(cands[0].content.parts)) return "";
    const nonThought = cands[0].content.parts
      .filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text)
      .join("")
      .trim();
    if (nonThought) return nonThought;
    return cands[0].content.parts
      .map((p) => (typeof p.text === "string" ? p.text : ""))
      .join("")
      .trim();
  }

  async function callCarbonHighLive(ktKey, customFocusPrompt) {
    const apiKey = getGeminiKey();
    if (!apiKey) {
      throw new Error("กรุณาใส่ Gemini API Key ก่อนเริ่มสังเคราะห์สดด้วย Gemini 4 Carbon · High");
    }
    const baseEntry = TAKEAWAYS_DB[ktKey];
    const [modCode, secId] = ktKey.split(":");
    const modMeta = MODULE_META[modCode];
    const proseExcerpt = extractSectionProseFromDocs(ktKey);

    const syllabusMap = Object.values(MODULE_META)
      .map((m) => `- ${m.code} (${m.shortTH} / ${m.shortEN}): ${m.arcTH}`)
      .join("\n");

    const sysPrompt = [
      "คุณคืออาจารย์แพทย์เวชศาสตร์ชุมชนและวิทยาศาสตร์ระบบสุขภาพ (RACM 303 คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี มหาวิทยาลัยมหิดล) ที่ใช้ Gemini 4 Carbon · High ในการสังเคราะห์แก่นความคิด (Conceptualized Key Takeaways for Lessons Learned)",
      "เป้าหมาย: สังเคราะห์เนื้อหาของหัวข้อนี้ให้ย่อยง่าย (digestible) สร้างความเข้าใจเชิงมโนทัศน์ (conceptualized comprehension) และชี้ให้เห็นความสอดรับของลำดับตรรกะ (internal alignment of logical flow) ทั้งภายในบทเรียนเดียวกันและเชื่อมโยงข้ามบท ST1 & HS1–HS6",
      "กฎเหล็กด้านน้ำเสียงและรูปแบบ:",
      "1. Summary Statement (summaryTH และ summaryEN): ต้องกระชับ คมคาย จับประเด็นหลักได้ทันที ติดหู ติดหัว (catchy & memorable) แต่ต้องสุภาพ อบอุ่น ให้เกียรติ และไม่ประชดประชันเด็ดขาด (strictly polite, respectful, non-sarcastic) ความยาว 1–2 ประโยคสั้น",
      "2. Key Takeaways (bullets): 3–4 ข้อ โดยแต่ละข้อแทน 1 บทเรียนสำคัญ (1 bullet = 1 complete take-home message) ขึ้นต้นด้วย **คำหลักตัวหนา:** ตามด้วยคำอธิบายกระชับเข้าใจง่าย ทั้งภาษาไทย (th) และภาษาอังกฤษ (en) ยึดโยงเนื้อหาคำสอน 100% ห้ามแต่งข้อเท็จจริงใหม่",
      "3. Logical Flow (flowRoleTH และ flowRoleEN): อธิบายสั้นๆ 1 ประโยคว่าหัวข้อนี้รับไม้ต่อจากหัวข้อก่อนหน้าและส่งไม้ต่อสู่หัวข้อถัดไปในบทเรียนนี้อย่างไร",
      "4. Keywords (keywords): 4–5 คำสำคัญหลัก คู่ภาษาไทย (th) และภาษาอังกฤษ (en)",
      "ตอบเป็น JSON ตาม schema ที่กำหนดเท่านั้น",
    ].join("\n");

    const userPrompt = [
      `บทเรียนปัจจุบัน: ${modCode} — ${modMeta.shortTH} (${modMeta.shortEN})`,
      `หัวข้อปัจจุบัน: ${baseEntry.secLabelTH} — ${baseEntry.titleTH}`,
      customFocusPrompt ? `ประเด็นที่ผู้เรียนต้องการเน้นเป็นพิเศษ: ${customFocusPrompt}` : "",
      "",
      "=== แผนที่ความเชื่อมโยงทั้งหลักสูตร (ST1 & HS1–HS6) ===",
      syllabusMap,
      "",
      "=== เนื้อหาประกอบคำสอนของหัวข้อนี้ ===",
      proseExcerpt || `${baseEntry.summaryTH}\n${baseEntry.bullets.map((b) => b.th).join("\n")}`,
    ]
      .filter(Boolean)
      .join("\n");

    const responseSchema = {
      type: "OBJECT",
      properties: {
        summaryTH: { type: "STRING" },
        summaryEN: { type: "STRING" },
        bullets: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              th: { type: "STRING" },
              en: { type: "STRING" },
            },
            required: ["th", "en"],
          },
        },
        flowRoleTH: { type: "STRING" },
        flowRoleEN: { type: "STRING" },
        keywords: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              th: { type: "STRING" },
              en: { type: "STRING" },
            },
            required: ["th", "en"],
          },
        },
      },
      required: ["summaryTH", "summaryEN", "bullets", "flowRoleTH", "flowRoleEN", "keywords"],
    };

    let lastErr = null;
    for (let i = 0; i < CARBON_PROFILES.length; i++) {
      const prof = CARBON_PROFILES[i];
      const generationConfig = {
        responseMimeType: "application/json",
        responseSchema,
        maxOutputTokens: prof.maxOutputTokens,
        thinkingConfig: { thinkingLevel: prof.thinkingLevel },
      };
      if (!prof.isGemini4) generationConfig.temperature = 0.25;

      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), prof.timeoutMs) : null;

      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(prof.model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller ? controller.signal : undefined,
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: sysPrompt }] },
              contents: [{ role: "user", parts: [{ text: userPrompt }] }],
              generationConfig,
            }),
          }
        );
        if (!resp.ok) {
          let detail = `HTTP ${resp.status}`;
          try {
            const ej = await resp.json();
            if (ej && ej.error && ej.error.message) detail = `${resp.status}: ${ej.error.message}`;
          } catch (_) {
            /* ignore */
          }
          const e = new Error(detail);
          e.httpStatus = resp.status;
          throw e;
        }
        const json = await resp.json();
        const txt = extractTextFromGeminiJson(json);
        const parsed = JSON.parse(txt);
        if (!parsed.summaryTH || !Array.isArray(parsed.bullets) || !parsed.bullets.length) {
          throw new Error("รูปแบบผลลัพธ์ JSON ไม่ครบถ้วน");
        }
        return {
          summaryTH: parsed.summaryTH,
          summaryEN: parsed.summaryEN,
          bullets: parsed.bullets.map((b) => ({
            th: formatSafeRich(b.th),
            en: formatSafeRich(b.en),
            isLiveFormatted: true,
          })),
          flowRoleTH: parsed.flowRoleTH || baseEntry.flowRoleTH,
          flowRoleEN: parsed.flowRoleEN || baseEntry.flowRoleEN,
          keywords:
            Array.isArray(parsed.keywords) && parsed.keywords.length
              ? parsed.keywords
              : baseEntry.keywords,
          modelBadge: prof.badge,
          customFocus: customFocusPrompt || "",
          updatedAt: new Date().toISOString(),
        };
      } catch (err) {
        lastErr = err;
        if (err && (err.httpStatus === 401 || /API key not valid|INVALID_ARGUMENT.*key/i.test(err.message || ""))) {
          break;
        }
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    throw lastErr || new Error("ไม่สามารถเชื่อมต่อ Gemini API ได้ในขณะนี้");
  }

  /* ==========================================================================
   * POPUP MODAL CONTROLLER & INTERACTIVE LOGICAL FLOW VIEWER
   * ========================================================================== */
  const SPARK_SVG =
    '<svg class="kt-icon-svg" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
    '<path d="M10 2.2L11.9 7.5L17.2 9.4L11.9 11.3L10 16.6L8.1 11.3L2.8 9.4L8.1 7.5L10 2.2Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/>' +
    '<circle cx="15.6" cy="4.4" r="1.15" fill="currentColor"/>' +
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
  let showApiPanel = false;
  let isGeneratingLive = false;
  let liveStatusMsg = "";
  let liveErrorMsg = "";

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

  function jumpToSectionInPortal(ktKey) {
    const [modCode, secId] = String(ktKey || "").split(":");
    closeTakeawayModal();

    // Check if the current textbook reader already shows this module
    const existingBar = document.querySelector(`#textbookProseContainer .sec-kt-bar[data-kt-key="${ktKey}"]`);
    if (existingBar) {
      const heading = existingBar.previousElementSibling || existingBar;
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Otherwise navigate to that module's doc via window.racmOpenTextbookDoc
    if (typeof window.racmOpenTextbookDoc === "function") {
      window.racmOpenTextbookDoc(modCode);
    } else {
      const sel = document.getElementById("hsModuleSelect");
      if (sel && modCode.startsWith("HS")) {
        sel.value = modCode;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const modPill = document.querySelector(
        `#textbookUnifiedBannerWrap [data-hs-mod="${modCode}"], .hs-unified-mod-pill[data-mod="${modCode}"]`
      );
      if (modPill) modPill.click();
    }

    setTimeout(() => {
      const targetBar = document.querySelector(`#textbookProseContainer .sec-kt-bar[data-kt-key="${ktKey}"]`);
      if (targetBar) {
        const heading = targetBar.previousElementSibling || targetBar;
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 180);
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
    liveErrorMsg = "";
    liveStatusMsg = "";
    ensureModalDOM();
    renderModalContents();
    modalBackdrop.hidden = false;
    document.body.classList.add("kt-modal-open");
  }

  function renderModalContents() {
    if (!modalBackdrop) return;
    const base = TAKEAWAYS_DB[activeKtKey];
    if (!base) return;

    const liveCache = loadLiveCache();
    const liveOverride = liveCache[activeKtKey] || null;
    const activeData = liveOverride ? { ...base, ...liveOverride, crossLinks: base.crossLinks } : base;

    const [modCode, secId] = activeKtKey.split(":");
    const modMeta = MODULE_META[modCode];
    const lang = getLangPref();
    const showTH = lang === "both" || lang === "th";
    const showEN = lang === "both" || lang === "en";
    const { prevKey, nextKey } = getAdjacentKeys(activeKtKey);
    const prevEntry = prevKey ? TAKEAWAYS_DB[prevKey] : null;
    const nextEntry = nextKey ? TAKEAWAYS_DB[nextKey] : null;

    const modelBadgeText = liveOverride && liveOverride.modelBadge
      ? `${liveOverride.modelBadge} · Live`
      : "Gemini 4 Carbon · High";

    // Build section stepper pills across the current module
    const stepperHtml = modMeta.sections
      .map((s) => {
        const k = `${modCode}:${s}`;
        const isAct = k === activeKtKey;
        const lbl = s === "sum" ? (showTH ? "สรุป" : "Summary") : s;
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
        return `<button type="button" class="kt-mod-chip${isCurrentMod ? " is-current" : ""}" data-kt-switch-push="${escapeHtml(firstKey)}" title="${escapeHtml(m.shortTH)} (${escapeHtml(m.shortEN)})">${escapeHtml(m.code)}</button>`;
      })
      .join('<span class="kt-spine-sep" aria-hidden="true">·</span>');

    // Back breadcrumb if navigated across modules/sections
    const backCrumbHtml = navHistoryStack.length
      ? `<button type="button" class="kt-back-crumb" data-kt-pop-history="1">← กลับไป ${escapeHtml(navHistoryStack[navHistoryStack.length - 1].replace(":sum", " · สรุป").replace(":", " · หมวด "))}</button>`
      : "";

    // Bullets HTML
    const bulletsHtml = (activeData.bullets || [])
      .map((b, idx) => {
        const thLine = b.isLiveFormatted ? b.th : formatCuratedHtml(b.th);
        const enLine = b.isLiveFormatted ? b.en : formatCuratedHtml(b.en);
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

    // Within-module 3-step alignment cards (Prev -> Current -> Next)
    const prevCardHtml = prevEntry
      ? `<button type="button" class="kt-flow-node is-neighbor" data-kt-switch="${escapeHtml(prevKey)}">
           <span class="kt-flow-dir">← รับไม้ต่อจาก (${escapeHtml(prevKey.replace(":", " · "))})</span>
           <strong class="kt-flow-node-title">${escapeHtml(showTH ? prevEntry.titleTH : prevEntry.titleEN)}</strong>
         </button>`
      : `<div class="kt-flow-node is-origin">
           <span class="kt-flow-dir">จุดเริ่มต้นของบท ${escapeHtml(modCode)}</span>
           <strong class="kt-flow-node-title">${escapeHtml(showTH ? modMeta.arcTH : modMeta.arcEN)}</strong>
         </div>`;

    const nextCardHtml = nextEntry
      ? `<button type="button" class="kt-flow-node is-neighbor" data-kt-switch="${escapeHtml(nextKey)}">
           <span class="kt-flow-dir">ส่งไม้ต่อสู่ (${escapeHtml(nextKey.replace(":sum", " · สรุป").replace(":", " · "))}) →</span>
           <strong class="kt-flow-node-title">${escapeHtml(showTH ? nextEntry.titleTH : nextEntry.titleEN)}</strong>
         </button>`
      : `<div class="kt-flow-node is-origin">
           <span class="kt-flow-dir">จุดสังเคราะห์ท้ายบท ${escapeHtml(modCode)}</span>
           <strong class="kt-flow-node-title">${escapeHtml(showTH ? "เชื่อมสู่การทำ Self-Quiz และอภิปรายกรณีศึกษาในชั้นเรียน" : "Connects to Self-Quiz & Classroom Case Discussion")}</strong>
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
            <button type="button" class="kt-cross-jump-doc" data-kt-jump-doc="${escapeHtml(c.target)}" title="เปิดอ่านเนื้อหาเต็มของหัวข้อนี้">
              เปิดเอกสาร
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

    const savedKey = getGeminiKey();

    modalBackdrop.innerHTML = `
      <div class="kt-modal-sheet" role="document">
        <header class="kt-modal-head">
          <div class="kt-head-top-row">
            <div class="kt-head-badges">
              <span class="kt-mod-badge">${escapeHtml(modCode)}</span>
              <span class="kt-sec-label">${escapeHtml(showTH ? activeData.secLabelTH : activeData.secLabelEN)}</span>
              <span class="kt-carbon-badge" title="Conceptualized with Gemini 4 Carbon (High Thinking)">${SPARK_SVG}<span>${escapeHtml(modelBadgeText)}</span></span>
              ${backCrumbHtml}
            </div>
            <div class="kt-head-controls">
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
              <span class="kt-bar-caption">ลำดับในบท ${escapeHtml(modCode)}:</span>
              <div class="kt-stepper-pills">${stepperHtml}</div>
            </div>
            <div class="kt-spine-row">
              <span class="kt-bar-caption">ข้ามบทเรียน:</span>
              <div class="kt-spine-pills">${moduleSpineHtml}</div>
            </div>
          </div>
        </header>

        <div class="kt-modal-body">
          <!-- 1. Catchy, Polite Summary Statement -->
          <section class="kt-summary-box" aria-label="Summary Statement">
            <div class="kt-section-kicker">SUMMARY STATEMENT · ประเด็นสื่อสารหลัก</div>
            ${showTH ? `<p class="kt-summary-th">“${escapeHtml(activeData.summaryTH)}”</p>` : ""}
            ${showEN ? `<p class="kt-summary-en">“${escapeHtml(activeData.summaryEN)}”</p>` : ""}
          </section>

          <!-- 2. Digestible Key Takeaways Bullets -->
          <section class="kt-block" aria-label="Key Takeaways">
            <div class="kt-section-kicker">KEY TAKEAWAYS FOR LESSONS LEARNED · บทเรียนสำคัญรายประเด็น</div>
            <ul class="kt-bullet-list">
              ${bulletsHtml}
            </ul>
          </section>

          ${
            window.RACM_HE_VIDEO_BRIDGE &&
            typeof window.RACM_HE_VIDEO_BRIDGE.renderSectionChipsHtml === "function"
              ? window.RACM_HE_VIDEO_BRIDGE.renderSectionChipsHtml(activeKtKey, lang)
              : ""
          }

          <!-- 3. Internal & Cross-HS Logical Flow Alignment -->
          <section class="kt-block kt-flow-section" aria-label="Internal Alignment of Logical Flow">
            <div class="kt-section-kicker">${FLOW_SVG}<span>INTERNAL &amp; CROSS-HS LOGICAL FLOW · ความสอดรับของลำดับความคิด</span></div>

            <div class="kt-within-flow-grid">
              ${prevCardHtml}
              <div class="kt-flow-node is-current">
                <span class="kt-flow-dir">บทบาทของหัวข้อนี้ในสายตรรกะ (${escapeHtml(activeKtKey.replace(":sum", " · สรุป").replace(":", " · หมวด "))})</span>
                ${showTH ? `<p class="kt-flow-role-th">${formatCuratedHtml(activeData.flowRoleTH)}</p>` : ""}
                ${showEN ? `<p class="kt-flow-role-en">${formatCuratedHtml(activeData.flowRoleEN)}</p>` : ""}
              </div>
              ${nextCardHtml}
            </div>

            ${
              crossHtml
                ? `<div class="kt-cross-wrap">
                     <div class="kt-cross-heading">ความเชื่อมโยงข้ามบทเรียน (ST1 &amp; HS1–HS6 Curriculum Alignment)</div>
                     <div class="kt-cross-grid">${crossHtml}</div>
                   </div>`
                : ""
            }
          </section>

          <!-- 4. Ending with Keywords -->
          <section class="kt-block kt-keywords-section" aria-label="Keywords">
            <div class="kt-section-kicker">KEYWORDS · คำสำคัญหลัก</div>
            <div class="kt-kw-row">${keywordsHtml}</div>
          </section>
        </div>

        <footer class="kt-modal-foot">
          <div class="kt-foot-main">
            <div class="kt-foot-nav">
              <button type="button" class="btn sm" data-kt-switch="${escapeHtml(prevKey)}" ${prevKey ? "" : "disabled"}>← หัวข้อก่อนหน้า</button>
              <button type="button" class="btn sm" data-kt-switch="${escapeHtml(nextKey)}" ${nextKey ? "" : "disabled"}>หัวข้อถัดไป →</button>
              <button type="button" class="btn sm" data-kt-jump-doc="${escapeHtml(activeKtKey)}">ไปยังเนื้อหาส่วนนี้ในเอกสาร</button>
            </div>
            <div class="kt-foot-ai-btns">
              ${
                liveOverride
                  ? `<button type="button" class="btn sm" data-kt-reset-live="1">คืนค่าต้นฉบับมาตรฐาน</button>`
                  : ""
              }
              <button type="button" class="btn sm kt-ai-toggle-btn" data-kt-toggle-api="1">
                ${SPARK_SVG}<span>สังเคราะห์สดด้วย Gemini 4 Carbon · High</span>
              </button>
            </div>
          </div>

          ${
            showApiPanel
              ? `<div class="kt-api-drawer">
                   <div class="kt-api-row">
                     <input type="password" id="ktGeminiKeyInput" class="kt-api-input" placeholder="Gemini API Key (AIza... ใช้ร่วมกับระบบตรวจคำตอบอัตโนมัติ)" value="${escapeHtml(savedKey)}" autocomplete="off" />
                     <input type="text" id="ktCustomFocusInput" class="kt-api-focus-input" placeholder="ประเด็นที่อยากให้เน้นเพิ่มเติม (เว้นว่างได้ เช่น เชื่อมมุมคลินิกเวชปฏิบัติ)" value="${escapeHtml((liveOverride && liveOverride.customFocus) || "")}" />
                     <button type="button" class="btn sm primary" data-kt-run-live="1" ${isGeneratingLive ? "disabled" : ""}>
                       ${isGeneratingLive ? "กำลังสังเคราะห์ด้วย Carbon High…" : "สังเคราะห์ใหม่"}
                     </button>
                   </div>
                   ${liveStatusMsg ? `<div class="kt-api-status is-ok">${escapeHtml(liveStatusMsg)}</div>` : ""}
                   ${liveErrorMsg ? `<div class="kt-api-status is-err">${escapeHtml(liveErrorMsg)}</div>` : ""}
                 </div>`
              : ""
          }
        </footer>
      </div>
    `;
  }

  /* ---------- Prose Enhancement: Inject Section Key Takeaways Trigger Buttons ---------- */
  function createTriggerBar(ktKey, compactLabel) {
    const entry = TAKEAWAYS_DB[ktKey];
    if (!entry) return null;
    const bar = document.createElement("div");
    bar.className = "sec-kt-bar hsd-no-print";
    bar.setAttribute("data-kt-key", ktKey);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sec-kt-btn";
    btn.setAttribute("data-kt-open", ktKey);
    btn.innerHTML =
      `${SPARK_SVG}` +
      `<span class="sec-kt-btn-main">${escapeHtml(compactLabel || "Key Takeaways · สรุปแก่นความคิดและสายตรรกะ")}</span>` +
      `<span class="sec-kt-btn-model">Carbon High · TH/EN</span>`;

    bar.appendChild(btn);
    return bar;
  }

  function enhanceProse(proseContainer, explicitDocId) {
    if (!proseContainer || !proseContainer.querySelectorAll) return;
    const modCode = detectModCodeFromContainer(proseContainer, explicitDocId);
    if (!modCode || !MODULE_META[modCode]) return;

    // 1. Add overview Logical Flow & Key Takeaways bar beneath h2.doc-h1 if present (Scroll reader)
    const docH1 = proseContainer.querySelector("h2.doc-h1, .doc-h1");
    if (docH1 && !proseContainer.querySelector(".doc-kt-overview-bar")) {
      const mod = MODULE_META[modCode];
      const firstKey = `${modCode}:1`;
      if (TAKEAWAYS_DB[firstKey]) {
        const ov = document.createElement("div");
        ov.className = "doc-kt-overview-bar hsd-no-print";
        ov.innerHTML = `
          <div class="doc-kt-ov-copy">
            <span class="doc-kt-ov-badge">${SPARK_SVG}<span>Conceptualized Flow · ${escapeHtml(modCode)}</span></span>
            <span class="doc-kt-ov-text">${escapeHtml(mod.arcTH)}</span>
          </div>
          <button type="button" class="sec-kt-btn is-overview" data-kt-open="${escapeHtml(firstKey)}">
            ${FLOW_SVG}
            <span class="sec-kt-btn-main">ดู Key Takeaways &amp; Logical Flow ทั้งบท (${mod.sections.length - 1} หมวด)</span>
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

    // 2. Inject Key Takeaways button right after every numbered H2 and Conclusion H2
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
        isSum
          ? "Key Takeaways · สังเคราะห์บทเรียนทั้งบท & เชื่อมข้ามบท"
          : "Key Takeaways · สรุปแก่นความคิดและสายตรรกะประจำหมวด"
      );
      if (bar) {
        h2.insertAdjacentElement("afterend", bar);
        injectedAny = true;
      }
    });

    // 3. In 16:9 Slide Deck mode, sub-slides may begin with an H3 (e.g., "1.2 ...", "3.1 ...") without an H2
    if (
      !injectedAny &&
      proseContainer.classList &&
      proseContainer.classList.contains("deck-slide-canvas") &&
      !proseContainer.querySelector(".sec-kt-bar")
    ) {
      const firstH3 = proseContainer.querySelector("h3");
      if (firstH3) {
        const ktKey = matchSubheadingToSectionKey(modCode, firstH3.textContent || "");
        if (ktKey) {
          const bar = createTriggerBar(ktKey, "Key Takeaways ของหมวดหลักนี้ · สรุปแก่นความคิด & สายตรรกะ");
          if (bar) firstH3.insertAdjacentElement("afterend", bar);
        }
      }
    }
  }

  /* ---------- Global Delegated Event Listeners ---------- */
  document.addEventListener("click", async (ev) => {
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
        liveErrorMsg = "";
        liveStatusMsg = "";
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

    const jumpBtn = target.closest("[data-kt-jump-doc]");
    if (jumpBtn) {
      ev.preventDefault();
      jumpToSectionInPortal(jumpBtn.getAttribute("data-kt-jump-doc"));
      return;
    }

    if (target.closest("[data-kt-toggle-api]")) {
      ev.preventDefault();
      showApiPanel = !showApiPanel;
      liveErrorMsg = "";
      liveStatusMsg = "";
      renderModalContents();
      return;
    }

    if (target.closest("[data-kt-reset-live]")) {
      ev.preventDefault();
      const c = loadLiveCache();
      delete c[activeKtKey];
      saveLiveCache(c);
      liveStatusMsg = "คืนค่าแก่นความคิดมาตรฐานเรียบร้อยแล้ว";
      liveErrorMsg = "";
      renderModalContents();
      return;
    }

    if (target.closest("[data-kt-run-live]")) {
      ev.preventDefault();
      if (isGeneratingLive) return;
      const keyInp = document.getElementById("ktGeminiKeyInput");
      const focusInp = document.getElementById("ktCustomFocusInput");
      if (keyInp) setGeminiKey(keyInp.value);
      const customFocus = focusInp ? focusInp.value.trim() : "";

      isGeneratingLive = true;
      liveErrorMsg = "";
      liveStatusMsg = "";
      renderModalContents();

      try {
        const result = await callCarbonHighLive(activeKtKey, customFocus);
        const c = loadLiveCache();
        c[activeKtKey] = result;
        saveLiveCache(c);
        liveStatusMsg = `สังเคราะห์สำเร็จด้วย ${result.modelBadge}`;
      } catch (err) {
        liveErrorMsg = (err && err.message) || "เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini API";
      } finally {
        isGeneratingLive = false;
        renderModalContents();
      }
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
