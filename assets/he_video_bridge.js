/* ==========================================================================
   RACM 303 — Health Economics (HE00–HE05) Handout ↔ Video Companion Bridge (v2)
   - Direct Native HTML5 <video> Streaming (assets/videos/he00..he05.mp4 · +faststart)
   - Works 100% in LINE In-App Browser (iOS/Android), Safari, Chrome, Incognito & TV
     (Zero Google 401 Malformed Request / Zero Third-Party Cookie Blocks!)
   - Real-Time Live Slide & Teaching-Note Sync via native `timeupdate`
   - Instant Sub-Second Seeking, Speed Control (0.75x–2x), & Seamless PiP Corner Mode
   ========================================================================== */
(function () {
  "use strict";

  const FOLDER_URL =
    "https://drive.google.com/drive/folders/1RqT-o4rvYE7DXf7bFU7HfPgue0vp49LW?usp=sharing";
  const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

  const VIDEOS = {
    HE00: {
      code: "HE00",
      videoSrc: "assets/videos/he00.mp4",
      poster: "assets/images/he_vdo/slides/he00_overview.webp",
      driveId: "1iKcqmZnI1AtNPThuggw03aRdPfUVHlkT",
      durationSec: 278,
      durationLabel: "04:38",
      shortTH: "แนะนำภาพรวมชุดสื่อเศรษฐศาสตร์สาธารณสุขและประกันสุขภาพ",
      shortEN: "Course Overview: Health Economics & Health Financing",
      speakers: "อ.นพ.สัมฤทธิ์ ศรีธำรงสวัสดิ์ · นพ.ภานุวิชญ์ แก้วกำจรชัย",
      chapters: [
        {
          id: "he00-overview",
          startSec: 131,
          endSec: 278,
          slide: "assets/images/he_vdo/slides/he00_overview.webp",
          ktKey: "HS2:4",
          titleTH: "เกณฑ์แพทยสภาและแผนผังเนื้อหา 5 บทย่อย (HE01–HE05)",
          titleEN: "Medical Council Competency & 5-Part Study Map",
          noteTH:
            "เชื่อมเกณฑ์ความรู้ความสามารถแพทยสภา พ.ศ. 2555 ด้านเศรษฐศาสตร์สาธารณสุขและระบบประกันสุขภาพ เข้ากับลำดับการเรียนรู้ 5 ตอน ตั้งแต่แนวคิดต้นทุน การประเมินความคุ้มค่า ทฤษฎีประกันสุขภาพ ไปจนถึงกลไกจ่ายเงินและกรณีศึกษาจริงในไทย",
        },
      ],
    },

    HE01: {
      code: "HE01",
      videoSrc: "assets/videos/he01.mp4",
      poster: "assets/images/he_vdo/slides/he01_three_questions.webp",
      driveId: "1hy8GbsNMmw2rUZOJoxQ7SJuFkfR_ZV7t",
      durationSec: 1413,
      durationLabel: "23:33",
      shortTH: "หลักการพื้นฐานทางเศรษฐศาสตร์สาธารณสุขและการวิเคราะห์ต้นทุน",
      shortEN: "Basic Principles of Health Economics & Cost Analysis",
      speakers: "อ.นพ.สัมฤทธิ์ ศรีธำรงสวัสดิ์ · นพ.ภานุวิชญ์ แก้วกำจรชัย",
      chapters: [
        {
          id: "he01-what",
          startSec: 78,
          endSec: 257,
          slide: "assets/images/he_vdo/slides/he01_what_is_he.webp",
          ktKey: "HS3:4",
          titleTH: "ความขาดแคลนทรัพยากร (Scarcity) และความหมายของเศรษฐศาสตร์สาธารณสุข",
          titleEN: "Resource Scarcity & What Is Health Economics?",
          noteTH:
            "ทรัพยากรด้านสุขภาพ (งบประมาณ บุคลากร เวลา เตียง) มีจำกัด ขณะที่ความต้องการด้านสุขภาพไม่จำกัด ทุกการตัดสินใจจึงต้องจัดสรรทรัพยากรให้เกิดคุณค่าสูงสุด",
        },
        {
          id: "he01-three-q",
          startSec: 257,
          endSec: 343,
          slide: "assets/images/he_vdo/slides/he01_three_questions.webp",
          ktKey: "HS3:4",
          titleTH: "โจทย์หลัก 3 ข้อ: What (Allocative) · How (Technical) · For Whom (Equity)",
          titleEN: "Three Core Questions: Allocative, Technical & Equity",
          noteTH:
            "ชี้ความเชื่อมโยงตรงกับ HS3 หมวด 4: 'ผลิตบริการอะไร' คือ Allocative efficiency, 'ผลิตอย่างไรให้ไม่สูญเปล่า' คือ Technical/Productive efficiency และ 'ผลิตเพื่อใคร' คือ Equity",
        },
        {
          id: "he01-why",
          startSec: 343,
          endSec: 484,
          slide: "assets/images/he_vdo/slides/he01_why_he.webp",
          ktKey: "HS3:4",
          titleTH: "เหตุผลที่แพทย์และผู้กำหนดนโยบายต้องเข้าใจเศรษฐศาสตร์สาธารณสุข",
          titleEN: "Why Clinicians & Policymakers Need Health Economics",
          noteTH:
            "การตัดสินใจทางคลินิกและการบริหารโรงพยาบาลส่งผลโดยตรงต่อการใช้ทรัพยากรส่วนรวมและความยั่งยืนของระบบสุขภาพ",
        },
        {
          id: "he01-blocks",
          startSec: 484,
          endSec: 536,
          slide: "assets/images/he_vdo/slides/he01_building_blocks.webp",
          ktKey: "HS2:4",
          titleTH: "กรอบ WHO 6 Building Blocks สู่เป้าหมายการคุ้มครองความเสี่ยงและประสิทธิภาพ",
          titleEN: "WHO Six Building Blocks → Financial Protection & Efficiency",
          noteTH:
            "เชื่อม HS2 หมวด 4 เข้ากับ HS3 และ HS6: เสาการคลังสุขภาพ (Health Financing) และบริการสุขภาพทำงานร่วมกันผ่าน Access, Coverage, Quality, Safety สู่เป้าหมายสุดท้าย 4 ประการของ WHO",
        },
        {
          id: "he01-cost-concept",
          startSec: 536,
          endSec: 729,
          slide: "assets/images/he_vdo/slides/he01_cost_concept.webp",
          ktKey: "HS3:4",
          titleTH: "แนวคิดต้นทุนทางเศรษฐศาสตร์และต้นทุนค่าเสียโอกาส (Opportunity Cost)",
          titleEN: "Economic Cost & Opportunity Cost Concept",
          noteTH:
            "ต้นทุนทางเศรษฐศาสตร์ไม่ได้มองแค่รายจ่ายตัวเงินในใบเสร็จ แต่รวมคุณค่าของทางเลือกที่ดีที่สุดลำดับถัดไปที่ต้องสละไป (Opportunity cost)",
        },
        {
          id: "he01-cost-comp",
          startSec: 729,
          endSec: 889,
          slide: "assets/images/he_vdo/slides/he01_cost_components.webp",
          ktKey: "HS3:4",
          titleTH: "องค์ประกอบของต้นทุน: Direct Medical · Direct Non-Medical · Indirect Cost",
          titleEN: "Cost Components: Direct Medical, Non-Medical & Indirect",
          noteTH:
            "แยกแยะค่ารักษาพยาบาลทางตรง ค่าเดินทาง/ค่าอาหารของผู้ป่วยและญาติ และต้นทุนทางอ้อมจากการขาดงานหรือสูญเสียผลิตภาพ",
        },
        {
          id: "he01-cost-types",
          startSec: 889,
          endSec: 1026,
          slide: "assets/images/he_vdo/slides/he01_cost_types.webp",
          ktKey: "HS3:4",
          titleTH: "ประเภทของต้นทุน: Total, Average (Unit), Incremental และ Marginal Cost",
          titleEN: "Total, Unit, Incremental, and Marginal Costs",
          noteTH:
            "เปรียบเทียบต้นทุนรวม ต้นทุนเฉลี่ยต่อหน่วย ต้นทุนส่วนเพิ่มระหว่างสองทางเลือก (Incremental cost) และต้นทุนหน่วยสุดท้ายเมื่อขยายบริการเพิ่ม 1 ราย (Marginal cost)",
        },
        {
          id: "he01-perspectives",
          startSec: 1026,
          endSec: 1102,
          slide: "assets/images/he_vdo/slides/he01_cost_perspectives.webp",
          ktKey: "HS3:4",
          titleTH: "มุมมองการวิเคราะห์ต้นทุน 3 ระดับ: ผู้ให้บริการ ผู้ป่วย และสังคม (Societal)",
          titleEN: "Provider, Patient, and Societal Cost Perspectives",
          noteTH:
            "การประเมินชุดสิทธิประโยชน์ระดับประเทศนิยมใช้มุมมองทางสังคม (Societal perspective) เพื่อไม่ให้เกิดการผลักภาระต้นทุนแฝงไปให้ครัวเรือนผู้ป่วย",
        },
        {
          id: "he01-tb-ex",
          startSec: 1102,
          endSec: 1413,
          slide: "assets/images/he_vdo/slides/he01_exercise_tb.webp",
          ktKey: "HS3:4",
          titleTH: "แบบฝึกหัด: เปรียบเทียบต้นทุนการรักษาวัณโรคในชุมชนโดย อสม. กับโรงพยาบาล",
          titleEN: "Exercise: Community DOT via VHVs vs Hospital-Based TB Care",
          noteTH:
            "ตัวอย่างจริงที่ชี้ให้เห็นว่าเมื่อคิดรวมค่าเดินทางและค่าเสียเวลาของผู้ป่วย (มุมมองสังคม) การดูแลในชุมชนร่วมกับ อสม. ช่วยลดภาระครัวเรือนได้อย่างชัดเจน",
        },
      ],
    },

    HE02: {
      code: "HE02",
      videoSrc: "assets/videos/he02.mp4",
      poster: "assets/images/he_vdo/slides/he02_forms_matrix.webp",
      driveId: "1n9ypS2_ybWH8s9j2hTc-qevXpO15aLGU",
      durationSec: 1641,
      durationLabel: "27:21",
      shortTH: "การประเมินทางเศรษฐศาสตร์และการกำหนดชุดสิทธิประโยชน์ (HTA)",
      shortEN: "Economic Evaluation & Health Technology Assessment",
      speakers: "อ.นพ.สัมฤทธิ์ ศรีธำรงสวัสดิ์ · นพ.ภานุวิชญ์ แก้วกำจรชัย",
      chapters: [
        {
          id: "he02-what",
          startSec: 100,
          endSec: 309,
          slide: "assets/images/he_vdo/slides/he02_what_is_ee.webp",
          ktKey: "HS3:4",
          titleTH: "ความหมายและเงื่อนไขพื้นฐานก่อนทำ Economic Evaluation",
          titleEN: "Prerequisites & Concept of Economic Evaluation",
          noteTH:
            "เทคโนโลยีที่จะนำมาประเมินความคุ้มค่าต้องมีหลักฐานประสิทธิผลและความปลอดภัยทางคลินิกชัดเจนก่อนเสมอ",
        },
        {
          id: "he02-matrix",
          startSec: 309,
          endSec: 433,
          slide: "assets/images/he_vdo/slides/he02_forms_matrix.webp",
          ktKey: "HS3:4",
          titleTH: "เมทริกซ์จำแนก Partial vs Full Economic Evaluation",
          titleEN: "2×2 Classification of Economic Evaluations",
          noteTH:
            "การประเมินทางเศรษฐศาสตร์เต็มรูปแบบ (Full EE) ต้องครบ 2 เงื่อนไขพร้อมกัน คือ (1) เปรียบเทียบตั้งแต่ 2 ทางเลือกขึ้นไป และ (2) วัดทั้งต้นทุนและผลลัพธ์",
        },
        {
          id: "he02-cma-cea",
          startSec: 433,
          endSec: 518,
          slide: "assets/images/he_vdo/slides/he02_cma_cea.webp",
          ktKey: "HS3:4",
          titleTH: "การวิเคราะห์ต้นทุนต่ำสุด (CMA) และต้นทุน–ประสิทธิผล (CEA)",
          titleEN: "Cost-Minimization (CMA) & Cost-Effectiveness Analysis (CEA)",
          noteTH:
            "CMA ใช้เมื่อผลลัพธ์ทางคลินิกเท่ากันทุกประการ ส่วน CEA วัดผลลัพธ์เป็นหน่วยธรรมชาติทางคลินิก เช่น ปีชีวิตที่เพิ่มขึ้นหรือจำนวนผู้ป่วยที่ป้องกันได้",
        },
        {
          id: "he02-cua-cba",
          startSec: 518,
          endSec: 705,
          slide: "assets/images/he_vdo/slides/he02_cua_cba.webp",
          ktKey: "HS3:4",
          titleTH: "การวิเคราะห์ต้นทุน–อรรถประโยชน์ (CUA / QALYs) และต้นทุน–ผลได้ (CBA)",
          titleEN: "Cost-Utility Analysis (QALYs) & Cost-Benefit Analysis",
          noteTH:
            "CUA วัดผลลัพธ์เป็น QALY (ปีสุขภาวะปรับด้วยคุณภาพชีวิต) ทำให้เปรียบเทียบความคุ้มค่าข้ามกลุ่มโรคเพื่อจัดลำดับชุดสิทธิประโยชน์ระดับชาติได้",
        },
        {
          id: "he02-summary",
          startSec: 705,
          endSec: 926,
          slide: "assets/images/he_vdo/slides/he02_summary_table.webp",
          ktKey: "HS3:4",
          titleTH: "ตารางสรุปเปรียบเทียบหน่วยวัดต้นทุนและผลลัพธ์ของ CMA · CEA · CUA · CBA",
          titleEN: "Summary Comparison Table of CMA, CEA, CUA, and CBA",
          noteTH:
            "สรุปจุดต่างของหน่วยวัดผลลัพธ์ทั้ง 4 รูปแบบและการอ่านค่าอัตราส่วนต้นทุนต่อประสิทธิผลส่วนเพิ่ม (ICER)",
        },
        {
          id: "he02-hta-ucs",
          startSec: 926,
          endSec: 1142,
          slide: "assets/images/he_vdo/slides/he02_hta_ucs_criteria.webp",
          ktKey: "HS6:2",
          titleTH: "เกณฑ์คัดเลือกชุดสิทธิประโยชน์ UCS และบัญชียาหลักแห่งชาติ (ICER & ล้างไต)",
          titleEN: "Benefit Package Criteria in Thailand: ICER, Budget Impact & Equity",
          noteTH:
            "เชื่อม HS3 หมวด 4 กับ HS6 หมวด 2: ไทยไม่ได้ดูแค่ ICER ไม่เกิน 1 GDP/หัว/QALY แต่ชั่งน้ำหนักการป้องกันรายจ่ายหายนะของครัวเรือน (เช่น สิทธิบำบัดทดแทนไต) ภาระงบประมาณ และความเป็นธรรมร่วมด้วย",
        },
        {
          id: "he02-dm-ex",
          startSec: 1142,
          endSec: 1641,
          slide: "assets/images/he_vdo/slides/he02_exercise_dm.webp",
          ktKey: "HS3:4",
          titleTH: "แบบฝึกหัดคำนวณ ICER และผลกระทบงบประมาณของยารักษาเบาหวาน A เทียบกับ B",
          titleEN: "Worked Exercise: ICER & Budget Impact of Diabetes Drugs A vs B",
          noteTH:
            "ฝึกคำนวณส่วนต่างต้นทุน ส่วนต่าง QALY ค่า ICER และการวิเคราะห์ภาระงบประมาณรวมของกองทุนประกันสุขภาพ",
        },
      ],
    },

    HE03: {
      code: "HE03",
      videoSrc: "assets/videos/he03.mp4",
      poster: "assets/images/he_vdo/slides/he03_buying_certainty.webp",
      driveId: "18HJhxQx8TvdAI6KsVLPBFxkAixTwYvJU",
      durationSec: 1623,
      durationLabel: "27:03",
      shortTH: "หลักการของการประกันสุขภาพ เงื่อนไขตลาดสมัครใจ และรูปแบบกองทุนภาคบังคับ",
      shortEN: "Principles of Health Insurance, Adverse Selection & Financing Models",
      speakers: "อ.นพ.สัมฤทธิ์ ศรีธำรงสวัสดิ์ · นพ.ภานุวิชญ์ แก้วกำจรชัย",
      chapters: [
        {
          id: "he03-certainty",
          startSec: 41,
          endSec: 100,
          slide: "assets/images/he_vdo/slides/he03_buying_certainty.webp",
          ktKey: "HS6:1",
          titleTH: "ทำไมคนจึงซื้อประกันสุขภาพ: การซื้อความแน่นอน (Certainty) และการจ่ายล่วงหน้า",
          titleEN: "Why Buy Health Insurance? Buying Certainty via Prepayment",
          noteTH:
            "ตรงกับย่อหน้าแรกของเอกสารคำสอน HS6 หมวดที่ 1: ผู้ไม่พึงปรารถนาจะรับความเสี่ยงยอมจ่ายเบี้ยล่วงหน้าที่แน่นอน เพื่อแลกกับการคุ้มครองภาระค่ารักษาในอนาคต",
        },
        {
          id: "he03-indiv",
          startSec: 100,
          endSec: 187,
          slide: "assets/images/he_vdo/slides/he03_individual_uncertainty.webp",
          ktKey: "HS6:1",
          titleTH: "ความไม่แน่นอนของรายจ่ายค่ารักษาเทียบกับรายได้ครัวเรือนระดับปัจเจก",
          titleEN: "Individual Illness Uncertainty vs Household Income",
          noteTH:
            "แสดงกราฟเปรียบเทียบรายได้ที่ค่อนข้างคงที่กับค่ารักษาที่อาจพุ่งทะลุรายได้เมื่อเกิดโรคร้ายแรงหรืออุบัติเหตุรุนแรง (ที่มาของภาพประกอบวิดีโอที่ 1.1 ก)",
        },
        {
          id: "he03-equity",
          startSec: 187,
          endSec: 294,
          slide: "assets/images/he_vdo/slides/he03_society_equity.webp",
          ktKey: "HS6:1",
          titleTH: "มุมมองระดับสังคม: ความเป็นธรรมด้านการเข้าถึงบริการและด้านการคลัง",
          titleEN: "Societal Perspective: Equity in Access and Financing",
          noteTH:
            "ในระดับสังคม ประกันสุขภาพเป็นกลไกสร้างความเป็นธรรมเพื่อให้ผู้จำเป็นได้รับบริการตามความจำเป็นและร่วมจ่ายตามความสามารถ",
        },
        {
          id: "he03-pooling",
          startSec: 294,
          endSec: 353,
          slide: "assets/images/he_vdo/slides/he03_risk_pooling.webp",
          ktKey: "HS6:1",
          titleTH: "การรวมกองทุนและกระจายความเสี่ยง (Risk Pooling & Cross-Subsidy)",
          titleEN: "Risk Sharing and Pooling Across Low- and High-Risk Members",
          noteTH:
            "เมื่อนำเงินจ่ายล่วงหน้าของคนจำนวนมากมารวมกัน กฎจำนวนมากทำให้คาดการณ์รายจ่ายรวมได้และเกิดการถัวเฉลี่ยจากคนแข็งแรงไปช่วยคนเจ็บป่วย (ภาพประกอบวิดีโอที่ 1.2 ก)",
        },
        {
          id: "he03-catastrophic",
          startSec: 353,
          endSec: 406,
          slide: "assets/images/he_vdo/slides/he03_catastrophic_protection.webp",
          ktKey: "HS6:1",
          titleTH: "การคุ้มครองครัวเรือนจากรายจ่ายสุขภาพระดับหายนะ (Catastrophic Protection)",
          titleEN: "Protecting Households Against Catastrophic Expenditure",
          noteTH:
            "เบี้ยรายย่อยจำนวนมากช่วยกันรองรับเหตุการณ์ค่ารักษาสูงมากที่เกิดไม่บ่อย ป้องกันภาวะล้มละลายหรือยากจนจากการรักษา (ภาพประกอบวิดีโอที่ 1.2 ข)",
        },
        {
          id: "he03-uhc",
          startSec: 406,
          endSec: 478,
          slide: "assets/images/he_vdo/slides/he03_functions_uhc.webp",
          ktKey: "HS6:1",
          titleTH: "หน้าที่หลัก 2 ประการของประกันสุขภาพสู่หลักประกันสุขภาพถ้วนหน้า (UHC)",
          titleEN: "Two Core Functions of Health Insurance & Path to UHC",
          noteTH:
            "สรุป 2 หน้าที่หลักใน HS6 หมวด 1: (1) Enable access to needed care และ (2) Financial risk protection ควบคู่กับการกระจายหน่วยบริการให้ทั่วถึง",
        },
        {
          id: "he03-types",
          startSec: 478,
          endSec: 557,
          slide: "assets/images/he_vdo/slides/he03_types_overview.webp",
          ktKey: "HS6:3",
          titleTH: "จำแนกประเภทระบบประกันสุขภาพ: ภาคสมัครใจเทียบกับภาคบังคับ",
          titleEN: "Overview of Voluntary vs Compulsory Health Insurance",
          noteTH:
            "ปูโครงสร้างเปรียบเทียบประกันภาคสมัครใจ (เอกชนรายบุคคล/กลุ่ม) กับประกันภาคบังคับตามกฎหมาย",
        },
        {
          id: "he03-assumptions",
          startSec: 557,
          endSec: 719,
          slide: "assets/images/he_vdo/slides/he03_voluntary_assumptions.webp",
          ktKey: "HS6:1",
          titleTH: "เงื่อนไขพื้นฐาน 4 ข้อของการประกันสุขภาพภาคสมัครใจ",
          titleEN: "Four Insurability Assumptions in Voluntary Markets",
          noteTH:
            "ตรงกับ HS6 หมวด 1 ข้อ 1–4: โอกาสเกิด < 1 (สุ่ม), ข้อมูลไม่เหลื่อมล้ำเกินไป, ความเสี่ยงอิสระต่อกันและกลุ่มใหญ่พอ, และไม่จูงใจให้ใช้เกินจำเป็นมากเกินไป",
        },
        {
          id: "he03-demand-supply",
          startSec: 719,
          endSec: 887,
          slide: "assets/images/he_vdo/slides/he03_demand_supply.webp",
          ktKey: "HS6:2",
          titleTH: "อุปสงค์และอุปทานของประกันสุขภาพ และสมการเบี้ยประกัน π = pL + T",
          titleEN: "Demand & Supply of Insurance: Premium Formula π = pL + T",
          noteTH:
            "เชื่อม HS6 หมวด 2: ผู้รับประกันต้องบริหารการคลังให้เบี้ยประกันครอบคลุมค่าคาดหมายความเสียหาย (p × L) บวกต้นทุนบริหารจัดการกองทุน (T)",
        },
        {
          id: "he03-matrix",
          startSec: 887,
          endSec: 935,
          slide: "assets/images/he_vdo/slides/he03_insurable_matrix.webp",
          ktKey: "HS6:1",
          titleTH: "เมทริกซ์ 2×2: บริการแบบใดเหมาะต่อการประกันสุขภาพภาคสมัครใจ",
          titleEN: "2×2 Insurable Services Matrix (Low Probability, High Loss)",
          noteTH:
            "ชี้ชัดว่าบริการที่ตลาดสมัครใจรับประกันได้ดีคือ โอกาสเกิดต่ำแต่ความเสียหายสูง (Low probability, High loss) ส่วนโรคเรื้อรังที่เป็นอยู่แล้วต้องอาศัยกองทุนภาคบังคับ (ภาพประกอบวิดีโอที่ 1.1 ข)",
        },
        {
          id: "he03-adverse",
          startSec: 935,
          endSec: 1012,
          slide: "assets/images/he_vdo/slides/he03_adverse_selection.webp",
          ktKey: "HS6:3",
          titleTH: "กลไกการเกิด Adverse Selection ในระบบประกันสุขภาพภาคสมัครใจ",
          titleEN: "Why Voluntary Health Insurance Suffers from Adverse Selection",
          noteTH:
            "ตรงกับ HS6 หมวด 3.1: ผู้มีความเสี่ยงสูงรู้ตัวและตัดสินใจซื้อประกันมากกว่าคนแข็งแรง ทำให้ค่าใช้จ่ายเฉลี่ยสูงกว่าเบี้ยที่ตั้งไว้และกองทุนเสี่ยงขาดทุน",
        },
        {
          id: "he03-prevent-as",
          startSec: 1012,
          endSec: 1140,
          slide: "assets/images/he_vdo/slides/he03_prevent_adverse.webp",
          ktKey: "HS6:3",
          titleTH: "มาตรการป้องกัน Adverse Selection: จาก Underwriting สู่ระบบภาคบังคับถ้วนหน้า",
          titleEN: "Preventing Adverse Selection: Private Screening vs Mandatory UHC",
          noteTH:
            "เปรียบเทียบมาตรการเอกชน (Risk rating, Underwriting, ตัดโรคเดิม, ประกันกลุ่ม) กับทางแก้เบ็ดเสร็จคือหลักประกันสุขภาพภาคบังคับถ้วนหน้า (ภาพประกอบวิดีโอที่ 3.1 ก)",
        },
        {
          id: "he03-shi",
          startSec: 1140,
          endSec: 1432,
          slide: "assets/images/he_vdo/slides/he03_compulsory_shi.webp",
          ktKey: "HS6:3",
          titleTH: "ประกันสุขภาพภาคบังคับรูปแบบประกันสังคม (Social Health Insurance: SHI)",
          titleEN: "Compulsory Social Health Insurance (Payroll Contributions)",
          noteTH:
            "อธิบายการหักเงินสมทบตามสัดส่วนเงินเดือนในภาคแรงงานในระบบ จุดแข็งด้านความชัดเจนของแหล่งเงิน และข้อจำกัดเมื่อประชากรอยู่นอกระบบแรงงานจำนวนมาก",
        },
        {
          id: "he03-tax",
          startSec: 1432,
          endSec: 1623,
          slide: "assets/images/he_vdo/slides/he03_general_tax_nhs.webp",
          ktKey: "HS6:1",
          titleTH: "ระบบหลักประกันสุขภาพจากภาษีทั่วไป (Tax-Financed System) และเหตุผลของไทย",
          titleEN: "General Tax Financing & Why Thailand Adopted Tax-Financed UCS",
          noteTH:
            "ตรงกับ HS6 หมวด 1 และ 3.2.2: ไทยมีแรงงานนอกระบบสัดส่วนสูงซึ่งบังคับเก็บเงินสมทบยาก จึงใช้ภาษีทั่วไปขยายความครอบคลุม UCS ได้รวดเร็วและก้าวหน้า",
        },
      ],
    },

    HE04: {
      code: "HE04",
      videoSrc: "assets/videos/he04.mp4",
      poster: "assets/images/he_vdo/slides/he04_drgs.webp",
      driveId: "13-SqlVfRC5-zxyTtvl1nDPkFguSI3Yuo",
      durationSec: 2176,
      durationLabel: "36:16",
      shortTH: "สามกองทุนหลักของไทย รูปแบบการจ่ายค่าบริการ และปัญหา Moral Hazard",
      shortEN: "Thai Schemes, Provider Payment Methods & Moral Hazard Containment",
      speakers: "อ.นพ.สัมฤทธิ์ ศรีธำรงสวัสดิ์ · นพ.ภานุวิชญ์ แก้วกำจรชัย",
      chapters: [
        {
          id: "he04-thai",
          startSec: 54,
          endSec: 237,
          slide: "assets/images/he_vdo/slides/he04_thai_schemes.webp",
          ktKey: "HS6:3",
          titleTH: "เปรียบเทียบ 3 ระบบประกันสุขภาพหลักของไทย: CSMBS · SSS · UCS",
          titleEN: "Comparing Thailand's Three Main Schemes (CSMBS, SSS, UCS)",
          noteTH:
            "สอดคล้องกับตารางที่ 1 ในเอกสารคำสอน HS6 หมวดที่ 3: เปรียบเทียบกลุ่มเป้าหมาย แหล่งเงิน ชุดสิทธิประโยชน์ และวิธีจ่ายค่าบริการผู้ป่วยนอก/ผู้ป่วยใน (ภาพประกอบวิดีโอที่ 3.1 ข)",
        },
        {
          id: "he04-ffs",
          startSec: 237,
          endSec: 368,
          slide: "assets/images/he_vdo/slides/he04_ffs.webp",
          ktKey: "HS6:4",
          titleTH: "การจ่ายตามรายบริการ (Fee-for-Service): แรงจูงใจและความเสี่ยงของกองทุน",
          titleEN: "Fee-for-Service (FFS): Volume Incentives & Payer Risk",
          noteTH:
            "ตรงกับ HS6 หมวด 4 ข้อ 1: จ่ายย้อนหลังตามปริมาณและราคาบริการจริง จูงใจให้เพิ่มปริมาณและความเข้มข้นบริการ โดยกองทุนเป็นผู้รับความเสี่ยงทางการเงิน",
        },
        {
          id: "he04-drgs",
          startSec: 368,
          endSec: 782,
          slide: "assets/images/he_vdo/slides/he04_drgs.webp",
          ktKey: "HS6:4",
          titleTH: "กลุ่มวินิจฉัยโรคร่วม (DRGs), ค่าน้ำหนักสัมพัทธ์ (RW), CMI และปัญหา DRG Creep",
          titleEN: "Case-Based Payment (DRGs), Relative Weight, CMI & DRG Creep",
          noteTH:
            "อธิบายละเอียดตรงกับ HS6 หมวด 4 ข้อ 3: วิธีคำนวณ RW ตามความรุนแรงและทรัพยากรที่ใช้ การคูณอัตราจ่ายต่อ RW การคุมต้นทุนต่อราย และตัวอย่าง DRG creep (ภาพประกอบวิดีโอที่ 4.1 ข)",
        },
        {
          id: "he04-capitation",
          startSec: 782,
          endSec: 1000,
          slide: "assets/images/he_vdo/slides/he04_capitation.webp",
          ktKey: "HS6:4",
          titleTH: "การเหมาจ่ายรายหัว (Capitation) ระบบด่านหน้า (Gatekeeper) และ Global Budget",
          titleEN: "Capitation, Primary Care Gatekeeping & Global Budget",
          noteTH:
            "ตรงกับ HS6 หมวด 4 ข้อ 2 และ 4: โยกความเสี่ยงทางการเงินให้หน่วยบริการด่านหน้าดูแลประชากรที่ขึ้นทะเบียน เน้นสร้างเสริมป้องกันโรค แต่ต้องกำกับคุณภาพไม่ให้ให้บริการต่ำกว่ามาตรฐาน",
        },
        {
          id: "he04-incentives",
          startSec: 1000,
          endSec: 1167,
          slide: "assets/images/he_vdo/slides/he04_provider_incentives.webp",
          ktKey: "HS6:4",
          titleTH: "ตารางสังเคราะห์แรงจูงใจของผู้ให้บริการภายใต้กลไกการจ่ายเงินแต่ละรูปแบบ",
          titleEN: "Provider Behavioral Incentives Matrix Across Payment Methods",
          noteTH:
            "สรุปเปรียบเทียบว่า FFS, Case-based/DRGs, Capitation และ Global budget ส่งผลต่อจำนวนครั้ง ต้นทุนต่อราย การส่งต่อ และการป้องกันโรคอย่างไร (ภาพประกอบวิดีโอที่ 4.1 ก)",
        },
        {
          id: "he04-concerns",
          startSec: 1167,
          endSec: 1441,
          slide: "assets/images/he_vdo/slides/he04_major_concerns.webp",
          ktKey: "HS6:5",
          titleTH: "ประเด็นท้าทายสำคัญของระบบประกันสุขภาพและความยั่งยืนทางการคลัง",
          titleEN: "Major Issues of Concern in Health Insurance Systems",
          noteTH:
            "เชื่อมจากกลไกการจ่ายเงินในหมวด 4 เข้าสู่โจทย์ใหญ่ด้านค่าใช้จ่ายที่เพิ่มขึ้น พฤติกรรมผู้ใช้/ผู้ให้บริการ และความเป็นธรรมในหมวด 5",
        },
        {
          id: "he04-mh-diag",
          startSec: 1441,
          endSec: 1598,
          slide: "assets/images/he_vdo/slides/he04_moral_hazard_diagram.webp",
          ktKey: "HS6:5",
          titleTH: "แผนภาพกลไก Moral Hazard เมื่อมีบุคคลที่สามเป็นผู้จ่ายแทน (Third-Party Payer)",
          titleEN: "Consumer & Provider Moral Hazard Under Third-Party Payment",
          noteTH:
            "ตรงกับ HS6 หมวด 5: เมื่อไม่ต้องควักกระเป๋าจ่ายเอง ณ จุดบริการ ทั้งฝั่งผู้ป่วยและฝั่งผู้ให้บริการจึงมีโอกาสใช้หรือสั่งบริการเกินความจำเป็น (ภาพประกอบวิดีโอที่ 5.1 ก)",
        },
        {
          id: "he04-csection",
          startSec: 1598,
          endSec: 1718,
          slide: "assets/images/he_vdo/slides/he04_csection_map.webp",
          ktKey: "HS6:5",
          titleTH: "ตัวอย่างเชิงประจักษ์: อัตราผ่าตัดคลอดทั่วโลกกับแรงจูงใจฝั่งผู้ให้บริการ",
          titleEN: "Empirical Illustration: Global Cesarean Section Rates & Incentives",
          noteTH:
            "แสดงหลักฐานเชิงประจักษ์ว่าความไม่สมมาตรของข้อมูลทางการแพทย์ร่วมกับวิธีจ่ายเงินส่งผลต่ออัตราหัตถการที่เกินความจำเป็นทางการแพทย์ได้อย่างไร (ภาพประกอบวิดีโอที่ 5.1 ข)",
        },
        {
          id: "he04-prov-mh",
          startSec: 1718,
          endSec: 1872,
          slide: "assets/images/he_vdo/slides/he04_provider_moral_hazard.webp",
          ktKey: "HS6:5",
          titleTH: "Provider Moral Hazard และ Supplier-Induced Demand (SID)",
          titleEN: "Provider Moral Hazard & Supplier-Induced Demand",
          noteTH:
            "อธิบายว่าเหตุใดฝั่งผู้ให้บริการจึงมีอิทธิพลต่อค่าใช้จ่ายสุขภาพมากกว่าฝั่งผู้ป่วย เพราะแพทย์เป็นผู้วินิจฉัยและสั่งการรักษาโดยตรง",
        },
        {
          id: "he04-consumer-ctrl",
          startSec: 1872,
          endSec: 1985,
          slide: "assets/images/he_vdo/slides/he04_consumer_measures.webp",
          ktKey: "HS6:5",
          titleTH: "มาตรการฝั่งผู้ใช้บริการ: Co-payment, Co-insurance, Deductible และ Gatekeeper",
          titleEN: "Demand-Side Measures: Cost-Sharing Forms & Gatekeeping",
          noteTH:
            "ตรงกับ HS6 หมวด 5 (ก): เปรียบเทียบส่วนร่วมจ่ายทั้ง 3 รูปแบบ กำหนดด่านหน้าปฐมภูมิ และเพดานความคุ้มครอง พร้อมข้อควรระวังผลกระทบต่อคนจน",
        },
        {
          id: "he04-prov-direct",
          startSec: 1985,
          endSec: 2120,
          slide: "assets/images/he_vdo/slides/he04_provider_direct.webp",
          ktKey: "HS6:5",
          titleTH: "มาตรการควบคุมฝั่งผู้ให้บริการทางตรง: บัญชียาหลัก, PA และ Utilization Review",
          titleEN: "Direct Supply-Side Controls: NLEM, Prior Auth & Utilization Review",
          noteTH:
            "ตรงกับ HS6 หมวด 5 (ข) มาตรการทางตรง: ควบคุมราคา กำหนดบัญชียาหลักแห่งชาติ ขออนุมัติสิทธิก่อนใช้ยาราคาแพง และทบทวนเวชระเบียน",
        },
        {
          id: "he04-prov-indirect",
          startSec: 2120,
          endSec: 2176,
          slide: "assets/images/he_vdo/slides/he04_provider_indirect.webp",
          ktKey: "HS6:5",
          titleTH: "มาตรการควบคุมฝั่งผู้ให้บริการทางอ้อม: ปรับวิธีจ่ายเงินเป็นแบบล่วงหน้า",
          titleEN: "Indirect Supply-Side Control: Prospective Payment Reform",
          noteTH:
            "บทสรุปสำคัญของ HS6 หมวด 5: การเปลี่ยนจาก FFS เป็น Capitation, DRGs และ Global budget มีประสิทธิผลที่สุดโดยไม่ต้องก้าวล่วงดุลยพินิจทางคลินิกเป็นรายเคส",
        },
      ],
    },

    HE05: {
      code: "HE05",
      videoSrc: "assets/videos/he05.mp4",
      poster: "assets/images/he_vdo/slides/he05_csmbs_op_ffs.webp",
      driveId: "1uqwf0po7RKplyLFyC5tV1WMJWj6-JuXX",
      durationSec: 1338,
      durationLabel: "22:18",
      shortTH: "อภิปรายกรณีศึกษา: การร่วมจ่ายในกลุ่มเปราะบาง และหลักฐานเชิงประจักษ์ CSMBS",
      shortEN: "Case Discussions: Co-payment Guardrails & CSMBS Empirical Evidence",
      speakers: "อ.นพ.สัมฤทธิ์ ศรีธำรงสวัสดิ์ · นพ.ภานุวิชญ์ แก้วกำจรชัย",
      chapters: [
        {
          id: "he05-copay",
          startSec: 27,
          endSec: 455,
          slide: "assets/images/he_vdo/slides/he05_copay_discussion.webp",
          ktKey: "HS6:5",
          titleTH: "อภิปราย: เหตุใดต้องยกเว้นการร่วมจ่ายแก่คนจน ผู้ป่วยเรื้อรัง ผู้สูงอายุ และผู้พิการ",
          titleEN: "Why Vulnerable Groups Must Be Exempted from Cost-Sharing",
          noteTH:
            "ตรงกับย่อหน้ามาตรการฝั่งผู้ใช้บริการใน HS6 หมวด 5: การเก็บส่วนร่วมจ่ายในผู้มีรายได้น้อยหรือป่วยเรื้อรังจะสกัดกั้นการเข้าถึงบริการที่จำเป็นจนป่วยรุนแรงขึ้นในภายหลัง",
        },
        {
          id: "he05-csmbs-op",
          startSec: 455,
          endSec: 899,
          slide: "assets/images/he_vdo/slides/he05_csmbs_op_ffs.webp",
          ktKey: "HS6:5",
          titleTH: "กราฟจริง CSMBS ผู้ป่วยนอก (2545–2561): ผลของ Direct Billing แบบ Fee-for-Service",
          titleEN: "Empirical Evidence: CSMBS Outpatient Spending Surge Under FFS",
          noteTH:
            "หลักฐานเชิงประจักษ์ในไทยเมื่อเปลี่ยนผู้ป่วยนอกข้าราชการเป็นเบิกจ่ายตรงแบบ FFS ทำให้รายจ่ายผู้ป่วยนอกโดยเฉพาะค่ายาพุ่งสูงขึ้นอย่างต่อเนื่อง (ภาพประกอบวิดีโอที่ 5.2 ก)",
        },
        {
          id: "he05-csmbs-ip",
          startSec: 899,
          endSec: 1338,
          slide: "assets/images/he_vdo/slides/he05_csmbs_ip_drg.webp",
          ktKey: "HS6:4",
          titleTH: "กราฟจริง CSMBS ผู้ป่วยใน (2545–2561): ผลของการปฏิรูปจ่ายเงินด้วย DRGs ในปี 2550",
          titleEN: "Empirical Evidence: CSMBS Inpatient Cost Containment via 2007 DRG Reform",
          noteTH:
            "เปรียบเทียบให้เห็นพลังของมาตรการทางอ้อมฝั่งผู้ให้บริการ: เมื่อกรมบัญชีกลางเปลี่ยนการจ่ายผู้ป่วยในเป็น DRGs ในปี 2550 อัตราเพิ่มของรายจ่ายผู้ป่วยในชะลอตัวลงทันที (ภาพประกอบวิดีโอที่ 5.2 ข)",
        },
      ],
    },
  };

  /* Lookup Drive File ID -> Video Code */
  const DRIVE_ID_TO_CODE = {};
  Object.values(VIDEOS).forEach((v) => {
    DRIVE_ID_TO_CODE[v.driveId] = v.code;
  });

  /* Curated Section -> Recommended Video Highlights */
  const SECTION_RECOMMENDED_CLIPS = {
    "HS2:4": [
      { code: "HE01", sec: 484, labelTH: "HE01 · 08:04 WHO 6 Building Blocks", labelEN: "HE01 · 08:04 WHO 6 Building Blocks" },
      { code: "HE00", sec: 131, labelTH: "HE00 · 02:11 แผนผัง 5 บท HE01–05", labelEN: "HE00 · 02:11 5-Module Map" },
    ],
    "HS3:4": [
      { code: "HE01", sec: 257, labelTH: "HE01 · 04:17 โจทย์ 3 ข้อ & Efficiency", labelEN: "HE01 · 04:17 3 Core Questions" },
      { code: "HE01", sec: 1026, labelTH: "HE01 · 17:06 มุมมองต้นทุน 3 ระดับ", labelEN: "HE01 · 17:06 Cost Perspectives" },
      { code: "HE02", sec: 309, labelTH: "HE02 · 05:09 CMA · CEA · CUA · CBA", labelEN: "HE02 · 05:09 Full EE Matrix" },
      { code: "HE02", sec: 926, labelTH: "HE02 · 15:26 เกณฑ์ ICER & ชุดสิทธิประโยชน์", labelEN: "HE02 · 15:26 ICER & UHC Criteria" },
    ],
    "HS6:1": [
      { code: "HE03", sec: 41, labelTH: "HE03 · 00:41 ซื้อความแน่นอน & ความเสี่ยง", labelEN: "HE03 · 00:41 Buying Certainty" },
      { code: "HE03", sec: 294, labelTH: "HE03 · 04:54 Risk Pooling & รายจ่ายหายนะ", labelEN: "HE03 · 04:54 Pooling & Catastrophic" },
      { code: "HE03", sec: 557, labelTH: "HE03 · 09:17 เงื่อนไขประกันสมัครใจ 4 ข้อ", labelEN: "HE03 · 09:17 4 Insurability Rules" },
      { code: "HE03", sec: 1432, labelTH: "HE03 · 23:52 ระบบภาษีทั่วไป & UCS ไทย", labelEN: "HE03 · 23:52 Tax Financing & UCS" },
    ],
    "HS6:2": [
      { code: "HE03", sec: 719, labelTH: "HE03 · 11:59 ผู้รับประกัน & สมการ π = pL + T", labelEN: "HE03 · 11:59 Insurer & π = pL + T" },
      { code: "HE02", sec: 926, labelTH: "HE02 · 15:26 การกำหนดชุดสิทธิประโยชน์", labelEN: "HE02 · 15:26 Benefit Package HTA" },
    ],
    "HS6:3": [
      { code: "HE03", sec: 935, labelTH: "HE03 · 15:35 Adverse Selection & วิธีแก้", labelEN: "HE03 · 15:35 Adverse Selection" },
      { code: "HE03", sec: 1140, labelTH: "HE03 · 19:00 ประกันสังคม (SHI) vs ภาษี", labelEN: "HE03 · 19:00 SHI vs Tax System" },
      { code: "HE04", sec: 54, labelTH: "HE04 · 00:54 เปรียบเทียบ CSMBS · SSS · UCS", labelEN: "HE04 · 00:54 3 Main Thai Schemes" },
    ],
    "HS6:4": [
      { code: "HE04", sec: 237, labelTH: "HE04 · 03:57 Fee-for-Service", labelEN: "HE04 · 03:57 Fee-for-Service" },
      { code: "HE04", sec: 368, labelTH: "HE04 · 06:08 DRGs, RW & DRG Creep", labelEN: "HE04 · 06:08 DRGs & DRG Creep" },
      { code: "HE04", sec: 782, labelTH: "HE04 · 13:02 Capitation & Global Budget", labelEN: "HE04 · 13:02 Capitation & GB" },
      { code: "HE04", sec: 1000, labelTH: "HE04 · 16:40 ตารางแรงจูงใจผู้ให้บริการ", labelEN: "HE04 · 16:40 Provider Incentives" },
    ],
    "HS6:5": [
      { code: "HE04", sec: 1441, labelTH: "HE04 · 24:01 Moral Hazard 2 ฝั่ง", labelEN: "HE04 · 24:01 Consumer & Provider MH" },
      { code: "HE04", sec: 1872, labelTH: "HE04 · 31:12 มาตรการควบคุมทางตรง & ทางอ้อม", labelEN: "HE04 · 31:12 Containment Levers" },
      { code: "HE05", sec: 27, labelTH: "HE05 · 00:27 ยกเว้นร่วมจ่ายกลุ่มเปราะบาง", labelEN: "HE05 · 00:27 Vulnerable Exemptions" },
      { code: "HE05", sec: 455, labelTH: "HE05 · 07:35 กราฟจริง CSMBS OP (FFS) vs IP (DRG)", labelEN: "HE05 · 07:35 CSMBS Empirical Graphs" },
    ],
    "HS6:sum": [
      { code: "HE03", sec: 406, labelTH: "HE03 · 06:46 หน้าที่คู่ประกันสุขภาพสู่ UHC", labelEN: "HE03 · 06:46 Dual Functions & UHC" },
      { code: "HE04", sec: 2120, labelTH: "HE04 · 35:20 สรุปคานงัดวิธีจ่ายเงินล่วงหน้า", labelEN: "HE04 · 35:20 Prospective Payment Lever" },
      { code: "HE05", sec: 899, labelTH: "HE05 · 14:59 บทเรียนปฏิรูป DRG ในไทย", labelEN: "HE05 · 14:59 Thai DRG Reform Lesson" },
    ],
  };

  /* ---------- Utilities ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function buildDriveViewUrl(driveId) {
    return `https://drive.google.com/file/d/${encodeURIComponent(driveId)}/view`;
  }

  function parseHeDriveLink(href) {
    const raw = String(href || "").trim();
    if (!raw) return null;
    const m = raw.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{15,})/);
    if (!m) return null;
    const driveId = m[1];
    const code = DRIVE_ID_TO_CODE[driveId];
    if (!code) return null;
    let sec = 0;
    const mt = raw.match(/[?&](?:t|start)=(\d+)/);
    if (mt) sec = parseInt(mt[1], 10) || 0;
    return { code, driveId, sec };
  }

  function findChapterForTime(code, sec) {
    const v = VIDEOS[code];
    if (!v || !v.chapters || !v.chapters.length) return null;
    const t = Number(sec) || 0;
    for (let i = 0; i < v.chapters.length; i++) {
      const ch = v.chapters[i];
      if (t >= ch.startSec && t < ch.endSec) return ch;
    }
    if (t < v.chapters[0].startSec) return v.chapters[0];
    return v.chapters[v.chapters.length - 1];
  }

  function openSlideInLightbox(src, caption) {
    const lb = document.getElementById("imageLightbox");
    const lbImg = document.getElementById("lightboxImg");
    const lbCap = document.getElementById("lightboxCaption");
    if (lb && lbImg) {
      lbImg.src = src;
      lbImg.alt = caption || "";
      if (lbCap) lbCap.textContent = caption || "";
      lb.hidden = false;
    } else {
      window.open(src, "_blank", "noopener");
    }
  }

  /* ---------- Floating Companion Studio / PiP Dock State ---------- */
  const state = {
    isOpen: false,
    isPip: false,
    activeCode: "HE03",
    currentSec: 41,
    activeChapterId: "",
    playbackRate: 1,
    mountedCode: "",
  };

  let dockEl = null;

  function ensureDockDOM() {
    if (dockEl && document.body.contains(dockEl)) return dockEl;
    dockEl = document.createElement("aside");
    dockEl.id = "heVdoCompanionDock";
    dockEl.className = "he-vdo-dock hsd-no-print";
    dockEl.hidden = true;
    dockEl.setAttribute("aria-label", "สตูดิโอวิดีโอบรรยายประกอบคำสอน Health Economics");
    document.body.appendChild(dockEl);
    return dockEl;
  }

  function getVideoEl() {
    return dockEl ? dockEl.querySelector("video.he-native-video") : null;
  }

  function seekAndPlay(sec, autoPlay) {
    const v = VIDEOS[state.activeCode] || VIDEOS.HE03;
    const clamped = Math.max(0, Math.min(v.durationSec - 1, Math.floor(Number(sec) || 0)));
    state.currentSec = clamped;
    const videoEl = getVideoEl();
    if (!videoEl) return;

    const applySeek = () => {
      try {
        videoEl.playbackRate = state.playbackRate || 1;
        if (Math.abs((videoEl.currentTime || 0) - clamped) > 0.6) {
          videoEl.currentTime = clamped;
        }
        if (autoPlay) {
          const p = videoEl.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        }
      } catch (_) {}
    };

    if (videoEl.readyState >= 1) {
      applySeek();
    } else {
      videoEl.addEventListener("loadedmetadata", applySeek, { once: true });
    }
    syncDynamicUI();
  }

  function syncDynamicUI() {
    if (!dockEl || !state.isOpen) return;
    const v = VIDEOS[state.activeCode] || VIDEOS.HE03;
    const ch = findChapterForTime(v.code, state.currentSec) || v.chapters[0];
    const chIdx = v.chapters.indexOf(ch);
    const prevCh = chIdx > 0 ? v.chapters[chIdx - 1] : null;
    const nextCh = chIdx >= 0 && chIdx < v.chapters.length - 1 ? v.chapters[chIdx + 1] : null;

    dockEl.classList.toggle("is-pip", !!state.isPip);

    // 1. Live timestamp badge
    const livePill = dockEl.querySelector(".he-dock-live-pill");
    if (livePill) livePill.textContent = `🎥 ${v.code} · ${fmtTime(state.currentSec)}`;

    // 2. PiP button text
    const pipBtn = dockEl.querySelector("[data-he-toggle-pip]");
    if (pipBtn) {
      pipBtn.textContent = state.isPip ? "⤢ ขยายสตูดิโอ" : "❐ ย่อเป็นจอร่วมอ่าน (PiP)";
      pipBtn.title = state.isPip
        ? "ขยายดูสไลด์ HD และสารบัญรายหัวข้อ"
        : "ย่อเป็นหน้าต่างเล็กมุมขวาล่างเพื่อเลื่อนอ่านเอกสารคำสอนไปพร้อมกับฟังบรรยาย";
    }

    // 3. Speed select
    const speedSel = dockEl.querySelector(".he-speed-select");
    if (speedSel && String(speedSel.value) !== String(state.playbackRate)) {
      speedSel.value = String(state.playbackRate);
    }

    // 4. Only re-render chapter-dependent DOM when chapter actually changes
    const chId = ch ? ch.id : "";
    if (chId !== state.activeChapterId) {
      state.activeChapterId = chId;

      const rangeEl = dockEl.querySelector(".he-dock-note-time");
      if (rangeEl && ch) {
        rangeEl.textContent = `📍 ช่วงสไลด์ ${fmtTime(ch.startSec)}–${fmtTime(ch.endSec)}`;
      }
      const prevBtn = dockEl.querySelector("[data-he-nav-ch='prev']");
      if (prevBtn) {
        prevBtn.disabled = !prevCh;
        prevBtn.setAttribute("data-he-seek", prevCh ? String(prevCh.startSec) : "0");
      }
      const nextBtn = dockEl.querySelector("[data-he-nav-ch='next']");
      if (nextBtn) {
        nextBtn.disabled = !nextCh;
        nextBtn.setAttribute("data-he-seek", nextCh ? String(nextCh.startSec) : String(v.durationSec - 3));
      }

      const titleEl = dockEl.querySelector(".he-dock-note-title");
      if (titleEl && ch) titleEl.textContent = ch.titleTH;

      const descEl = dockEl.querySelector(".he-dock-note-desc");
      if (descEl && ch) descEl.textContent = ch.noteTH;

      // Update synchronized HD slide image & zoom attributes
      const slideImg = dockEl.querySelector(".he-dock-slide-img-btn img");
      if (slideImg && ch && ch.slide) {
        slideImg.src = ch.slide;
        slideImg.alt = ch.titleTH;
      }
      const capLabel = ch ? `${v.code} (${fmtTime(ch.startSec)}–${fmtTime(ch.endSec)}) — ${ch.titleTH}` : "";
      dockEl.querySelectorAll("[data-he-zoom-slide]").forEach((btn) => {
        if (ch && ch.slide) {
          btn.setAttribute("data-he-zoom-slide", ch.slide);
          btn.setAttribute("data-he-zoom-cap", capLabel);
        }
      });

      const ktBtn = dockEl.querySelector("[data-he-open-kt]");
      if (ktBtn && ch) {
        if (ch.ktKey) {
          ktBtn.hidden = false;
          ktBtn.setAttribute("data-he-open-kt", ch.ktKey);
          ktBtn.textContent = `📋 ประเด็นที่ควรรู้ (${ch.ktKey})`;
        } else {
          ktBtn.hidden = true;
        }
      }

      // Highlight active chapter in list
      dockEl.querySelectorAll(".he-dock-ch-btn").forEach((b) => {
        const isCur = b.getAttribute("data-ch-id") === chId;
        b.classList.toggle("is-active", isCur);
      });
    }
  }

  function renderDockShell(autoPlay) {
    if (!dockEl || !state.isOpen) return;
    const v = VIDEOS[state.activeCode] || VIDEOS.HE03;
    state.mountedCode = v.code;
    state.activeChapterId = "";

    const modTabsHtml = Object.values(VIDEOS)
      .map((mv) => {
        const isAct = mv.code === v.code;
        const defaultStart = mv.chapters[0] ? mv.chapters[0].startSec : 0;
        return `<button type="button" class="he-dock-mod-pill${isAct ? " is-active" : ""}" data-he-switch-mod="${esc(mv.code)}" data-he-sec="${defaultStart}" title="${esc(mv.shortTH)}">${esc(mv.code)} <span>${esc(mv.durationLabel)}</span></button>`;
      })
      .join("");

    const chaptersHtml = v.chapters
      .map(
        (item) => `
          <button type="button" class="he-dock-ch-btn" data-ch-id="${esc(item.id)}" data-he-seek="${item.startSec}">
            <span class="he-dock-ch-time">${fmtTime(item.startSec)}–${fmtTime(item.endSec)}</span>
            <span class="he-dock-ch-title">${esc(item.titleTH)}</span>
          </button>`
      )
      .join("");

    const speedOptsHtml = SPEEDS.map(
      (sp) => `<option value="${sp}"${sp === state.playbackRate ? " selected" : ""}>${sp}x</option>`
    ).join("");

    const initCh = findChapterForTime(v.code, state.currentSec) || v.chapters[0];

    dockEl.innerHTML = `
      <div class="he-dock-head">
        <div class="he-dock-head-left">
          <span class="he-dock-live-pill">🎥 ${esc(v.code)} · ${fmtTime(state.currentSec)}</span>
          <div class="he-dock-head-titles">
            <strong class="he-dock-main-title">${esc(v.shortTH)}</strong>
            <span class="he-dock-sub-speaker">${esc(v.speakers)}</span>
          </div>
        </div>
        <div class="he-dock-head-actions">
          <div class="racm-unav-pair is-compact is-dark-hud" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่">
            <button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button>
            <button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button>
          </div>
          <button type="button" class="he-dock-ctrl-btn is-pip-btn" data-he-toggle-pip="1">
            ${state.isPip ? "⤢ ขยายสตูดิโอ" : "❐ ย่อเป็นจอร่วมอ่าน (PiP)"}
          </button>
          <a class="he-dock-ctrl-btn" href="${esc(buildDriveViewUrl(v.driveId))}" target="_blank" rel="noopener" title="เปิดไฟล์ต้นฉบับใน Google Drive">↗ Drive</a>
          <button type="button" class="he-dock-close-btn" data-he-close="1" aria-label="ปิดหน้าต่างวิดีโอ">✕</button>
        </div>
      </div>

      <div class="he-dock-mod-strip">
        ${modTabsHtml}
      </div>

      <div class="he-dock-stage">
        <!-- Left: Pure Clean 16:9 Native HTML5 Video + Dedicated Non-Overlapping Teaching Bar Below -->
        <div class="he-dock-video-col">
          <div class="he-dock-iframe-wrap">
            <video
              class="he-native-video"
              src="${esc(v.videoSrc)}"
              poster="${esc((initCh && initCh.slide) || v.poster)}"
              controls
              playsinline
              webkit-playsinline
              preload="metadata"
              controlsList="nodownload"
              oncontextmenu="return false;"
            ></video>
          </div>

          <div class="he-dock-note-bar">
            <div class="he-dock-note-top">
              <span class="he-dock-note-time">📍 ช่วงสไลด์ ${initCh ? `${fmtTime(initCh.startSec)}–${fmtTime(initCh.endSec)}` : fmtTime(state.currentSec)}</span>
              <div class="he-dock-transport">
                <button type="button" class="he-mini-seek" data-he-delta="-10" title="ย้อนกลับ 10 วินาที">↺ -10s</button>
                <button type="button" class="he-mini-seek" data-he-nav-ch="prev" data-he-seek="0">‹ สไลด์ก่อน</button>
                <button type="button" class="he-mini-seek" data-he-nav-ch="next" data-he-seek="0">สไลด์ถัดไป ›</button>
                <button type="button" class="he-mini-seek" data-he-delta="10" title="ข้ามไปข้างหน้า 10 วินาที">+10s ↻</button>
                <select class="he-speed-select" aria-label="ความเร็วการเล่นวิดีโอ" title="ปรับความเร็วเสียงบรรยาย">${speedOptsHtml}</select>
              </div>
            </div>
            <div class="he-dock-note-title">${esc(initCh ? initCh.titleTH : "")}</div>
            <p class="he-dock-note-desc">${esc(initCh ? initCh.noteTH : "")}</p>
          </div>
        </div>

        <!-- Right: Synchronized Captured HD Slide Preview + Chapter Navigator -->
        <div class="he-dock-side-col">
          <div class="he-dock-slide-card">
            <div class="he-dock-slide-head">
              <span>🖼 สไลด์ประกอบช่วงเวลานี้ (ซิงค์อัตโนมัติตามเวลาคลิป)</span>
              <div class="he-dock-slide-acts">
                <button type="button" class="he-slide-act-pill" data-he-open-kt="${esc((initCh && initCh.ktKey) || "HS6:1")}">📋 ประเด็นที่ควรรู้</button>
                <button type="button" class="he-slide-act-pill" data-he-zoom-slide="${esc((initCh && initCh.slide) || v.poster)}" data-he-zoom-cap="">🔍 ขยายภาพ</button>
              </div>
            </div>
            <button type="button" class="he-dock-slide-img-btn" data-he-zoom-slide="${esc((initCh && initCh.slide) || v.poster)}" data-he-zoom-cap="" title="คลิกเพื่อขยายภาพสไลด์เต็มจอ">
              <img src="${esc((initCh && initCh.slide) || v.poster)}" alt="${esc(initCh ? initCh.titleTH : v.shortTH)}" loading="lazy" />
            </button>
          </div>

          <div class="he-dock-ch-list-wrap">
            <div class="he-dock-ch-head">
              <span>สารบัญช่วงเวลาในคลิป ${esc(v.code)} (${v.chapters.length} ช่วง)</span>
              <a href="${esc(FOLDER_URL)}" target="_blank" rel="noopener">โฟลเดอร์รวม ↗</a>
            </div>
            <div class="he-dock-ch-list">
              ${chaptersHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    const videoEl = getVideoEl();
    if (videoEl) {
      videoEl.addEventListener("timeupdate", () => {
        const cur = Math.floor(videoEl.currentTime || 0);
        if (cur !== state.currentSec) {
          state.currentSec = cur;
          syncDynamicUI();
        }
      });
      videoEl.addEventListener("ratechange", () => {
        if (videoEl.playbackRate) state.playbackRate = videoEl.playbackRate;
      });
    }

    syncDynamicUI();
    seekAndPlay(state.currentSec, autoPlay);
  }

  function openPlayer(code, sec, preferPip) {
    const v = VIDEOS[code] || VIDEOS.HE03;
    const sameVideoAlreadyMounted = state.isOpen && state.mountedCode === v.code && dockEl && !dockEl.hidden && getVideoEl();

    state.activeCode = v.code;
    state.currentSec = Math.max(0, Math.min(v.durationSec - 1, Math.floor(Number(sec) || 0)));
    if (typeof preferPip === "boolean") state.isPip = preferPip;
    state.isOpen = true;

    const ktModal = document.getElementById("ktModalBackdrop");
    if (ktModal && !ktModal.hidden && window.RACM_SECTION_TAKEAWAYS) {
      window.RACM_SECTION_TAKEAWAYS.closeTakeawayModal();
    }

    ensureDockDOM();
    dockEl.hidden = false;

    if (sameVideoAlreadyMounted) {
      seekAndPlay(state.currentSec, true);
    } else {
      renderDockShell(true);
    }
  }

  function closePlayer() {
    const videoEl = getVideoEl();
    if (videoEl) {
      try {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
      } catch (_) {}
    }
    state.isOpen = false;
    state.mountedCode = "";
    if (dockEl) {
      dockEl.hidden = true;
      dockEl.innerHTML = "";
    }
  }

  /* ---------- Render Compact Chips Inside Key Takeaways Modal ---------- */
  function renderSectionChipsHtml(ktKey, lang) {
    const clips = SECTION_RECOMMENDED_CLIPS[ktKey];
    if (!clips || !clips.length) return "";
    const useEN = lang === "en";
    const pills = clips
      .map((c) => {
        const lbl = useEN ? c.labelEN : c.labelTH;
        return `<button type="button" class="kt-vdo-chip" data-he-play="${esc(c.code)}" data-he-sec="${c.sec}">▶ ${esc(lbl)}</button>`;
      })
      .join("");
    return `
      <section class="kt-block kt-vdo-bridge-block" aria-label="Health Economics Video Companion">
        <div class="kt-section-kicker">🎥 VIDEO COMPANION · เชื่อมวิดีโอบรรยายประกอบหมวดนี้ (คลิกเพื่อเปิดฟังตรงช่วงเวลา)</div>
        <div class="kt-vdo-chip-row">${pills}</div>
      </section>
    `;
  }

  /* ---------- Upgrade Handout Prose: Interactive Video Callouts & Overview Strip ---------- */
  function enhanceProse(proseContainer, explicitDocId) {
    if (!proseContainer || !proseContainer.querySelectorAll) return;

    const docH1 = proseContainer.querySelector("h2.doc-h1, .doc-h1");
    const h1Text = (docH1 && docH1.textContent) || "";
    const docIdStr = String(explicitDocId || (proseContainer.dataset && proseContainer.dataset.docId) || "");
    const isHs6 = /^HS6/i.test(docIdStr) || /^HS6\b/i.test(h1Text.trim());

    if (isHs6 && docH1 && !proseContainer.querySelector(".he-vdo-series-banner")) {
      const banner = document.createElement("div");
      banner.className = "he-vdo-series-banner hsd-no-print";
      banner.innerHTML = `
        <div class="he-series-copy">
          <span class="he-series-kicker">🎬 HEALTH ECONOMICS VIDEO COMPANION (HE00–HE05)</span>
          <strong>เชื่อมเนื้อหาคำสอน HS6 เข้ากับวิดีโอบรรยายและภาพสไลด์สำคัญรายช่วงเวลา</strong>
          <span>คลิกปุ่มช่วงเวลาในแต่ละหมวดด้านล่างเพื่อเปิดดูวิดีโอได้ทันทีทุกอุปกรณ์ (รองรับโหมดจอเล็ก PiP ฟังไปอ่านไป ไม่เลื่อนหน้ากระดาษหนี)</span>
        </div>
        <div class="he-series-btns">
          <button type="button" class="he-series-open-btn is-primary" data-he-play="HE03" data-he-sec="41">▶ เริ่มฟัง HE03 (หลักการประกันสุขภาพ)</button>
          <button type="button" class="he-series-open-btn" data-he-play="HE04" data-he-sec="54">▶ HE04 (3 กองทุน · DRGs · Moral Hazard)</button>
          <button type="button" class="he-series-open-btn" data-he-play="HE05" data-he-sec="27">▶ HE05 (ร่วมจ่าย &amp; กราฟจริง CSMBS)</button>
        </div>
      `;
      let anchor = docH1;
      while (
        anchor.nextElementSibling &&
        anchor.nextElementSibling.tagName === "P" &&
        (anchor.nextElementSibling.textContent || "").trim().length < 130
      ) {
        anchor = anchor.nextElementSibling;
      }
      anchor.insertAdjacentElement("afterend", banner);
    }

    const bqs = [...proseContainer.querySelectorAll("blockquote")];
    bqs.forEach((bq) => {
      if (bq.dataset.heEnhanced === "1") return;
      const txt = bq.textContent || "";
      if (!txt.includes("🎥") && !bq.classList.contains("he-vdo-callout")) return;

      bq.classList.add("he-vdo-callout");
      bq.dataset.heEnhanced = "1";

      const links = [...bq.querySelectorAll("a[href*='drive.google.com/file/d/']")];
      let firstParsed = null;
      links.forEach((a) => {
        const parsed = parseHeDriveLink(a.getAttribute("href"));
        if (!parsed) return;
        if (!firstParsed) firstParsed = parsed;
        a.classList.add("he-inline-play-link");
        a.setAttribute("data-he-play", parsed.code);
        a.setAttribute("data-he-sec", String(parsed.sec));
        a.setAttribute(
          "title",
          `คลิกเพื่อเปิดดูคลิป ${parsed.code} ที่นาที ${fmtTime(parsed.sec)} ในหน้าต่าง Companion Player ควบคู่การอ่าน`
        );
      });

      const firstP = bq.querySelector("p");
      if (firstP && firstParsed && !firstP.querySelector(".he-callout-pip-btn")) {
        firstP.classList.add("he-callout-head-row");
        const pipBtn = document.createElement("button");
        pipBtn.type = "button";
        pipBtn.className = "he-callout-pip-btn hsd-no-print";
        pipBtn.setAttribute("data-he-play", firstParsed.code);
        pipBtn.setAttribute("data-he-sec", String(firstParsed.sec));
        pipBtn.setAttribute("data-he-pip", "1");
        pipBtn.textContent = "❐ เปิดจอเล็กฟังไปอ่านไป (PiP)";
        firstP.appendChild(pipBtn);
      }
    });

    const vdoFigs = [...proseContainer.querySelectorAll("figure.is-vdo-capture-fig, figure.editorial-figure")];
    vdoFigs.forEach((fig) => {
      const cap = fig.querySelector("figcaption");
      if (!cap || cap.dataset.heCapEnhanced === "1") return;
      const capTxt = cap.textContent || "";
      if (!capTxt.trim().startsWith("ภาพประกอบวิดีโอที่")) return;
      fig.classList.add("is-vdo-capture-fig");
      cap.dataset.heCapEnhanced = "1";

      const matches = [...capTxt.matchAll(/\b(HE0[0-5])\s*·\s*(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/g)];
      if (matches.length) {
        const chipBar = document.createElement("div");
        chipBar.className = "he-figcap-chips hsd-no-print";
        matches.forEach((m, idx) => {
          const code = m[1];
          const sec = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
          const rangeStr = `${m[2]}:${m[3]}–${m[4]}:${m[5]}`;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "he-figcap-play-chip";
          btn.setAttribute("data-he-play", code);
          btn.setAttribute("data-he-sec", String(sec));
          btn.textContent = `▶ เปิดฟังสไลด์ (${idx === 0 ? "ก" : "ข"}) ${code} · ${rangeStr}`;
          chipBar.appendChild(btn);
        });
        cap.appendChild(chipBar);
      }
    });
  }

  /* ---------- Global Delegated Event Listeners ---------- */
  document.addEventListener("click", (ev) => {
    const t = ev.target && ev.target.closest ? ev.target : null;
    if (!t) return;

    const playEl = t.closest("[data-he-play]");
    if (playEl) {
      if (playEl.tagName === "A" && (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1)) {
        return;
      }
      ev.preventDefault();
      ev.stopPropagation();
      const code = playEl.getAttribute("data-he-play");
      const sec = parseInt(playEl.getAttribute("data-he-sec") || "0", 10) || 0;
      const forcePip = playEl.getAttribute("data-he-pip") === "1";
      openPlayer(code, sec, forcePip ? true : state.isPip);
      return;
    }

    const rawLink = t.closest("a[href*='drive.google.com/file/d/']");
    if (rawLink && !rawLink.closest("#heVdoCompanionDock")) {
      const parsed = parseHeDriveLink(rawLink.getAttribute("href"));
      if (parsed && !(ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1)) {
        ev.preventDefault();
        openPlayer(parsed.code, parsed.sec, state.isPip);
        return;
      }
    }

    if (!dockEl || dockEl.hidden) return;

    if (t.closest("[data-he-close]")) {
      ev.preventDefault();
      closePlayer();
      return;
    }

    if (t.closest("[data-he-toggle-pip]")) {
      ev.preventDefault();
      state.isPip = !state.isPip;
      syncDynamicUI();
      return;
    }

    const modBtn = t.closest("[data-he-switch-mod]");
    if (modBtn) {
      ev.preventDefault();
      const code = modBtn.getAttribute("data-he-switch-mod");
      const sec = parseInt(modBtn.getAttribute("data-he-sec") || "0", 10) || 0;
      openPlayer(code, sec, state.isPip);
      return;
    }

    const deltaBtn = t.closest("[data-he-delta]");
    if (deltaBtn) {
      ev.preventDefault();
      const d = parseInt(deltaBtn.getAttribute("data-he-delta") || "0", 10) || 0;
      const videoEl = getVideoEl();
      const base = videoEl ? Math.floor(videoEl.currentTime || state.currentSec) : state.currentSec;
      seekAndPlay(base + d, true);
      return;
    }

    const seekBtn = t.closest("[data-he-seek]");
    if (seekBtn && !seekBtn.disabled) {
      ev.preventDefault();
      const nextSec = parseInt(seekBtn.getAttribute("data-he-seek") || "0", 10) || 0;
      seekAndPlay(nextSec, true);
      return;
    }

    const zoomBtn = t.closest("[data-he-zoom-slide]");
    if (zoomBtn) {
      ev.preventDefault();
      openSlideInLightbox(
        zoomBtn.getAttribute("data-he-zoom-slide"),
        zoomBtn.getAttribute("data-he-zoom-cap") || ""
      );
      return;
    }

    const ktBtn = t.closest("[data-he-open-kt]");
    if (ktBtn && window.RACM_SECTION_TAKEAWAYS) {
      ev.preventDefault();
      const ktKey = ktBtn.getAttribute("data-he-open-kt");
      state.isPip = true;
      syncDynamicUI();
      window.RACM_SECTION_TAKEAWAYS.openTakeawayModal(ktKey, false);
    }
  });

  document.addEventListener("change", (ev) => {
    const sel = ev.target && ev.target.closest ? ev.target.closest(".he-speed-select") : null;
    if (!sel) return;
    const rate = parseFloat(sel.value) || 1;
    state.playbackRate = rate;
    const videoEl = getVideoEl();
    if (videoEl) videoEl.playbackRate = rate;
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && state.isOpen && !state.isPip) {
      const lb = document.getElementById("imageLightbox");
      if (lb && !lb.hidden) return;
      const kt = document.getElementById("ktModalBackdrop");
      if (kt && !kt.hidden) return;
      closePlayer();
    }
  });

  window.RACM_HE_VIDEO_BRIDGE = {
    VIDEOS,
    open: openPlayer,
    openPlayer,
    closePlayer,
    enhanceProse,
    renderSectionChipsHtml,
  };
})();
