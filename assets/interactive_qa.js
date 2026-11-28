(function () {
  "use strict";

  const STORAGE_KEY = "racm303_iq_answers_v1";

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  let answerStore = loadStore();

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answerStore));
    } catch (_) {
      /* ignore quota errors */
    }
  }

  /* ---------- Conceptualized Answer Overrides for Guiding Questions (Abridged-First Synthesis) ---------- */
  const CONCEPTUALIZED_RUBRIC_OVERRIDES = {
    hs1_bq_1:
      "<div class='iq-model-prose'><p><strong>สุขภาพ (health)</strong> มิใช่เพียงการปราศจากโรคหรือความพิการ แต่คือ <strong>ภาวะที่สมบูรณ์และสมดุลเชื่อมโยงเป็นองค์รวมทั้งทางกาย จิต ปัญญา และสังคม</strong> (องค์การอนามัยโลก ค.ศ. 1946 และ พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550) รวมถึง<strong>ความสามารถในการปรับตัวและจัดการตนเอง</strong>เมื่อเผชิญความท้าทายของชีวิต (Huber, 2011; Bircher, 2005) โดยแพทย์ต้องแยกแยะสามมิติของความป่วยไข้ ได้แก่ <strong>โรค (disease)</strong> <strong>การเจ็บป่วย (illness)</strong> และ<strong>ภาวะที่สังคมยอมรับว่าป่วย (sickness)</strong> ตลอดจนแยก<strong>สุขภาวะ (well-being)</strong> ออกจาก<strong>ความเป็นอยู่ที่ดี (wellness)</strong></p></div>",
    hs1_bq_12:
      "<div class='iq-model-prose'><p>นิยามสุขภาพแบ่งเป็น 2 แนวคิดหลัก คือ <strong>แนวทางข้อเท็จจริงทางชีววิทยาที่ตรวจวัดได้ (value-free)</strong> เหมาะกับการวินิจฉัยโรคทางคลินิก และ <strong>แนวทางประเมินคุณค่าและบริบทชีวิตโดยรวม (value-laden)</strong> เช่น นิยามองค์รวม 3 มิติของ WHO และ 4 มิติของกฎหมายไทย (เพิ่มมิติทางปัญญา) ซึ่งเหมาะกับการกำหนดนโยบายสาธารณะ ทั้งนี้ในสังคมสูงวัยและโรคเรื้อรัง นิยามแนวใหม่ที่เน้น<strong>ความสามารถในการปรับตัวและจัดการตนเอง</strong> (Huber) หรือ<strong>ดุลยภาพระหว่างศักยภาพกับความท้าทายของชีวิต</strong> (Bircher) จะช่วยป้องกันการพึ่งพาการแพทย์เกินจำเป็นได้ดีกว่าการยึดคำว่า “สมบูรณ์” อย่างตายตัว</p></div>",
    hs1_bq_18:
      "<div class='iq-model-prose'><p>หากตีความคำว่า <strong>“สมบูรณ์ (complete)”</strong> อย่างเคร่งครัด ผู้สูงอายุที่มีโรคเรื้อรังแม้ควบคุมอาการได้ดีและยังใช้ชีวิตพึ่งตนเองได้ก็จะถูกจัดว่า<strong>ไม่มีสุขภาพดี</strong>ทันที และหากนำเกณฑ์นี้ไปใช้กับประชากรทั้งประเทศในยุคสังคมสูงวัย จะทำให้คนส่วนใหญ่ถูกตีตราเป็นคนป่วยตลอดเวลา เกิด<strong>การทำให้เรื่องปกติของวัยกลายเป็นโรคเกินจำเป็น (overmedicalization)</strong> ดันค่าใช้จ่ายด้านสุขภาพให้พุ่งสูง และมองข้ามความสามารถในการปรับตัวและใช้ชีวิตอย่างมีคุณค่าของผู้สูงอายุ</p></div>",
    hs1_bq_26:
      "<div class='iq-model-prose'><p>ประชากรต่างกลุ่มมีสถานะสุขภาพต่างกันอย่างไม่เป็นธรรม (<strong>health inequity</strong> — ความต่างที่เป็นระบบและหลีกเลี่ยงได้ ต่างจาก <em>inequality</em> ทั่วไป) เพราะถูกกำหนดโดยปัจจัยหลายระดับตั้งแต่ต้นน้ำถึงปลายน้ำ: ตามกรอบ <strong>Dahlgren &amp; Whitehead</strong> และ <strong>CSDH (Solar &amp; Irwin)</strong> บริบทเศรษฐกิจการเมืองและฐานะทางสังคม (<strong>ปัจจัยเชิงโครงสร้างต้นน้ำ</strong>) เป็นตัวกำหนดสภาพความเป็นอยู่ การทำงาน พฤติกรรม และระบบบริการสุขภาพ (<strong>ปัจจัยขั้นกลางปลายน้ำ</strong>) ซึ่งสามารถเข้าไปสกัดกั้นความเหลื่อมล้ำได้ครบ <strong>5 ช่องทางของ Diderichsen</strong> (ลดความเหลื่อมล้ำทางฐานะ ลดการสัมผัสสิ่งคุกคาม ลดความเปราะบาง ลดผลกระทบหลังป่วย และเสริมความผูกพันในสังคม)</p></div>",
    hs2_bq_1:
      "<div class='iq-model-prose'><p>ตามเกณฑ์ของ <strong>องค์การอนามัยโลก (WHO, 2000)</strong> ระบบสุขภาพครอบคลุมทุกองค์กร บุคคล และการกระทำที่มี <strong>“เจตนาหลัก (primary intent)”</strong> เพื่อส่งเสริม ฟื้นฟู หรือธำรงรักษาสุขภาพ (เช่น การรักษาพยาบาล การรณรงค์สวมหมวกนิรภัย หรือแม่ดูแลลูกที่ป่วย) ส่วนกิจกรรมที่ส่งผลดีต่อสุขภาพแต่มีเจตนาหลักเพื่อด้านอื่น (เช่น การศึกษาชั้นประถมทั่วไป) จะอยู่นอกขอบเขตระบบสุขภาพแต่เป็นปัจจัยกำหนดสุขภาพที่ต้องทำงานข้ามภาคส่วน ขณะที่ <strong>พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550</strong> ขีดวงกว้างกว่าเป็น<strong>ระบบความสัมพันธ์ทั้งมวลที่เชื่อมโยงกับสุขภาพ</strong></p></div>",
    hs2_bq_6:
      "<div class='iq-model-prose'><p>ระบบสุขภาพประกอบด้วย 2 ส่วนหลักที่ส่งผลสองทิศทางในชีวิตผู้ป่วย คือ <strong>(1) ระบบบริการสุขภาพ (health services system)</strong> ที่ทำหน้าที่ส่งเสริม ป้องกัน รักษา และฟื้นฟูโดยตรง และ <strong>(2) ปัจจัยกำหนดสุขภาพนอกโรงพยาบาล</strong> ทั้งด้านปัจเจก สภาพแวดล้อม เศรษฐกิจ และสังคม ในชีวิตจริงผู้ป่วยได้รับบริการคลินิกเพียงชั่วคราวแล้วต้องกลับไปใช้ชีวิตในบริบทเดิม หากไม่เชื่อมการรักษากับสภาพความเป็นอยู่และการทำงาน ผู้ป่วยก็จะกลับมามีอาการซ้ำอีก</p></div>",
    hs2_bq_11:
      "<div class='iq-model-prose'><p>ตามกรอบ WHO ระบบสุขภาพทำ <strong>4 หน้าที่หลัก</strong> ได้แก่ การจัดบริการ (service provision) การสร้างทรัพยากร (resource generation) การคลังสุขภาพ (financing) และการอภิบาลระบบ (stewardship) เพื่อมุ่งสู่ <strong>เป้าหมายปลายทางระดับประเทศ 3 ประการ</strong> คือ สุขภาพที่ดีและเป็นธรรมของประชากร การตอบสนองต่อความคาดหวังที่ไม่ใช่ทางการแพทย์ และการคุ้มครองทางการเงินที่เป็นธรรม โดยมี <strong>คุณลักษณะพึงประสงค์ 6 ประการ (EQESaRR)</strong> เป็นเกณฑ์กำกับคุณภาพกระบวนการ</p></div>",
    hs2_bq_14:
      "<div class='iq-model-prose'><p>โรงพยาบาลดังกล่าวยัง<strong>ไม่ถือว่าสำเร็จอย่างยั่งยืน</strong> จึงเป็นเหตุให้กรอบเป้าหมายต้องขยายจาก <strong>Triple Aim</strong> (สุขภาพประชากร ประสบการณ์ผู้ป่วย และต้นทุนต่อหัว) สู่ <strong>Quadruple Aim</strong> โดยเพิ่ม<strong>สุขภาวะและความปลอดภัยจากภาวะหมดไฟของบุคลากรสุขภาพ</strong> เพราะหากคนทำงานเหนื่อยล้าและลาออก คุณภาพบริการย่อมล่มสลาย และขยายต่อสู่ <strong>Quintuple Aim</strong> โดยเพิ่ม<strong>ความเป็นธรรมทางสุขภาพ (health equity)</strong> เพื่อไม่ให้ค่าเฉลี่ยที่ดีขึ้นบดบังความเหลื่อมล้ำของผู้ป่วยพื้นที่ห่างไกล</p></div>",
    hs2_bq_22:
      "<div class='iq-model-prose'><p>กลไกภายในระบบบริการสุขภาพขับเคลื่อนผ่าน <strong>6 องค์ประกอบหลัก (WHO Six Building Blocks)</strong> ได้แก่ การจัดบริการ กำลังคน สารสนเทศ ยาและเทคโนโลยี การคลัง และการอภิบาล ซึ่งไม่ได้ทำงานแยกส่วนแต่เชื่อมโยงแบบ<strong>ระบบซับซ้อนที่ปรับตัวได้ (CAS)</strong> ที่มีวงจรป้อนกลับ ส่วนการติดตามประเมินผลใช้<strong>ห่วงโซ่ผลลัพธ์ (ปัจจัยนำเข้า → กระบวนการ → ผลผลิต → ผลลัพธ์ → ผลกระทบ)</strong> คู่กับระบบสารสนเทศสุขภาพที่แปลงข้อมูลเป็นสารสนเทศเพื่อการตัดสินใจ</p></div>",
    hs2_bq_31:
      "<div class='iq-model-prose'><p>การจัดบริการตลอดความต่อเนื่องของการดูแลต้องผสาน 3 มิติเข้าด้วยกัน คือ (1) เข้าใจบทบาทหน่วยบริการภาครัฐ เอกชนไม่แสวงหากำไร และเอกชนแสวงหากำไร (2) จัดระดับบริการปฐมภูมิ–ทุติยภูมิ–ตติยภูมิตามความซับซ้อนของปัญหา และ (3) ออกแบบ <strong>รูปแบบการดูแล 7 รูปแบบตามกรอบ 6W (WHO, WHY, WHEN, WHAT, WHICH, WHERE)</strong> ตั้งแต่ฉุกเฉิน เฉียบพลัน ระยะกลาง (IMC) ผู้ป่วยนอก/ทางไกล ภาวะเรื้อรัง ระยะยาว (LTC) จนถึงประคับประคอง โดยมี<strong>บริการปฐมภูมิเป็นศูนย์กลางประสานการส่งต่อ</strong></p></div>",
    hs3_bq_1:
      "<div class='iq-model-prose'><p>เนื่องจากผลลัพธ์สุขภาพระดับประชากรต้องใช้เวลานานจึงจะปรากฏและได้รับอิทธิพลจากปัจจัยนอกระบบบริการด้วย ตามตรรกะ <strong>โครงสร้าง–กระบวนการ–ผลลัพธ์ (Donabedian)</strong> คุณลักษณะของกระบวนการจัดบริการทั้ง 6 ด้าน (<strong>EQESaRR</strong>: ความเป็นธรรม คุณภาพ ประสิทธิภาพ ภาระรับผิดชอบต่อสังคม ความสอดคล้องบริบท และความยืดหยุ่น) จึงทำหน้าที่เป็น<strong>ตัวชี้วัดระยะกลางและสัญญาณเตือนล่วงหน้า</strong>ที่ทำให้ตรวจจับจุดบกพร่องและแก้ไขได้ทันก่อนที่ผู้ป่วยจะได้รับอันตรายหรือล้มละลาย</p></div>",
    hs3_bq_12:
      "<div class='iq-model-prose'><p>ระบบบริการสุขภาพที่เป็นธรรม (<strong>equity</strong>) มุ่งจัดสรรบริการ<strong>ตามความจำเป็นทางสุขภาพ</strong>และเก็บเงิน<strong>ตามความสามารถในการจ่าย</strong> ต่างจากความเท่าเทียมแบบหารเท่า (<em>equality</em>) โดยมีรากฐานจากหลักความยุติธรรมเชิงจัดสรร (อริสโตเติล รอลส์ แดเนียลส์ และเซน) การเข้าถึงที่เป็นธรรมต้องครบทั้งมีบริการ เข้าถึงสะดวก ราคาไม่เป็นอุปสรรค และเป็นที่ยอมรับ ทั้งนี้การพึ่งพาการจ่ายเงินสดหน้างาน (OOP) จะบั่นทอนความเป็นธรรมและก่อค่าใช้จ่ายวิกฤต (CHE) ขณะที่<strong>การจ่ายล่วงหน้าและรวมกองทุนเฉลี่ยความเสี่ยง</strong>ช่วยส่งเสริมความเป็นธรรม</p></div>",
    hs3_bq_28:
      "<div class='iq-model-prose'><p>บริการสุขภาพที่มีคุณภาพตามกรอบ <strong>STEP</strong> ต้องมีความปลอดภัย (Safety) ทันเวลา (Timeliness) มีประสิทธิผลตามหลักฐานวิชาการ (Effectiveness) และยึดผู้ป่วยเป็นศูนย์กลาง (Person-centredness) ทั้งนี้<strong>การที่ประชาชนมาใช้บริการเพียงอย่างเดียวยังไม่พอที่จะสรุปว่าสุขภาพดีขึ้น</strong> ต้องประเมินด้วย<strong>ความครอบคลุมอย่างมีประสิทธิผล (effective coverage)</strong> ซึ่งเชื่อมความจำเป็น (Need) การได้ใช้บริการ (Use) และคุณภาพที่ควบคุมโรคได้จริง (Quality) เข้าด้วยกัน</p></div>",
    hs3_bq_29:
      "<div class='iq-model-prose'><p>แนวคิดคุณภาพบริการสุขภาพพัฒนาเป็น 4 ระยะสำคัญ ได้แก่ (1) <strong>Codman</strong> ริเริ่มการติดตามผลลัพธ์ปลายทางของผู้ป่วยรายบุคคลหลังการรักษา (2) <strong>Donabedian</strong> วางกรอบประเมินคุณภาพอย่างเป็นระบบผ่าน<strong>โครงสร้าง–กระบวนการ–ผลลัพธ์</strong> (3) <strong>สถาบันการแพทย์สหรัฐฯ (IOM)</strong> ชี้ว่าความผิดพลาดทางการแพทย์ส่วนใหญ่เกิดจากช่องโหว่เชิงระบบ (แบบจำลองแผ่นเนยแข็งสวิส) และกำหนดมิติคุณภาพมาตรฐาน และ (4) <strong>Tanahashi</strong> ชี้คอขวดของความครอบคลุมตั้งแต่มีบริการจนถึงความครอบคลุมอย่างมีประสิทธิผล</p></div>",
    hs3_bq_42:
      "<div class='iq-model-prose'><p>เพราะทรัพยากรสุขภาพมีจำกัดและการนำไปใช้จุดหนึ่งย่อมมี<strong>ต้นทุนค่าเสียโอกาส (opportunity cost)</strong> คือผลประโยชน์สุขภาพที่สูญเสียไปจากการไม่ได้นำไปช่วยผู้ป่วยกลุ่มอื่น ระบบจึงต้องสร้างประสิทธิภาพครบ 3 ระดับ ได้แก่ <strong>เชิงเทคนิค</strong> (ไม่สูญเปล่า) <strong>เชิงการผลิต</strong> (เลือกวิธีที่ต้นทุนคุ้มค่าที่สุด) และ<strong>การจัดสรรทรัพยากร (allocative efficiency)</strong> โดยใช้การประเมินเทคโนโลยีด้านสุขภาพ (<strong>HTA</strong> และ QALY/DALY) ร่วมกับเกณฑ์ความเป็นธรรมและความปลอดภัย เพื่อลดความสูญเปล่าโดยไม่ตัดบริการจำเป็นของกลุ่มเปราะบาง</p></div>",
    hs3_bq_43:
      "<div class='iq-model-prose'><p>รากฐานทางเศรษฐศาสตร์ทั้ง 4 ประการเชื่อมโยงกันดังนี้: (1) <strong>ความขาดแคลน (scarcity)</strong> ทำให้ไม่สามารถจัดทุกบริการได้ไม่จำกัด (2) ทุกการเลือกจึงเกิด<strong>ต้นทุนค่าเสียโอกาส (opportunity cost)</strong> คือผลลัพธ์สุขภาพสูงสุดของทางเลือกที่ต้องสละไป (3) <strong>ประสิทธิภาพแบบพาเรโต</strong> เตือนให้ลดความสูญเปล่าที่ปรับปรุงผลลัพธ์ได้โดยไม่ทำให้ใครแย่ลง และ (4) กรอบ <strong>extra-welfarism</strong> เปลี่ยนเป้าหมายจากการวัดความพึงพอใจตามกำลังซื้อในตลาดทั่วไป มาเป็น<strong>การเพิ่มผลลัพธ์ด้านสุขภาพโดยตรง (เช่น QALY)</strong> อย่างคุ้มค่าและเป็นธรรม</p></div>",
    hs3_bq_54:
      "<div class='iq-model-prose'><p>การอภิบาลระบบที่ดี (<strong>good governance / stewardship</strong>) คือการกำหนดทิศทาง กติกา และกลไกตรวจสอบที่โปร่งใสและมีส่วนร่วม แนวคิดภาระรับผิดชอบต่อยอดจากปัญหา<strong>ความไม่สมมาตรของข้อมูลระหว่างผู้มอบหมายกับผู้รับมอบหมายหน้าที่ (principal–agent)</strong> ระบบบริการสุขภาพจึงต้องมี<strong>ภาระรับผิดชอบต่อสังคม (social accountability)</strong> ที่ชี้แจงและรับฟังประชาชนได้จริง ควบคู่กับ<strong>ความสอดคล้องกับบริบท (relevance)</strong> คือจัดลำดับความสำคัญให้ตรงกับปัญหาสุขภาพจริงของชุมชนนั้น</p></div>",
    hs3_bq_63:
      "<div class='iq-model-prose'><p>แนวคิดความยืดหยุ่นของระบบ (<strong>resilience</strong>) พัฒนาจากนิเวศวิทยาและทฤษฎีระบบสังคม–นิเวศเข้าสู่ระบบสุขภาพหลังวิกฤตอีโบลาและโควิด-19 โดยระบบจะคงบริการที่จำเป็นไว้ได้เมื่อมีขีดความสามารถ 3 ระดับ คือ <strong>(1) การดูดซับรับมือเบื้องต้น (absorptive)</strong> <strong>(2) การปรับวิธีทำงานเมื่อทรัพยากรตึงตัว (adaptive)</strong> และ <strong>(3) การปฏิรูปโครงสร้างเพื่ออนาคต (transformative)</strong> บนฐานการอภิบาล ข้อมูล กำลังคนที่ได้รับการคุ้มครองไม่ให้แบกรับภาระเกินตัว และความไว้วางใจของชุมชน</p></div>",
    hs5_bq_1:
      "<div class='iq-model-prose'><p>ทุกระบบสุขภาพต้องมีปฐมภูมิเป็นฐานรากเพราะหลักฐานเชิงประจักษ์ (เช่น Starfield) ยืนยันว่าช่วยให้ประชากรมีผลลัพธ์สุขภาพดีขึ้น ลดความเหลื่อมล้ำ และคุมค่าใช้จ่ายรวมได้ดีกว่าการเน้นโรงพยาบาลเฉพาะทาง ทั้งนี้ต้องแยกให้ชัดว่า <strong>บริการปฐมภูมิ (Primary Care: PC)</strong> คือบริการคลินิกด่านแรกรายบุคคลและครอบครัวที่มีคุณลักษณะ 4Cs ส่วน <strong>ระบบสุขภาพปฐมภูมิ (Primary Health Care: PHC)</strong> คือยุทธศาสตร์ระดับทั้งระบบและสังคมที่ผสานบริการสุขภาพ งานข้ามภาคส่วน และการเสริมพลังชุมชน (ปฏิญญาอัลมา-อตา และแอสทานา)</p></div>",
    hs5_bq_8:
      "<div class='iq-model-prose'><p>จุดเน้นของระบบปฐมภูมิเปลี่ยนจากยุคแรกที่มุ่งโรคติดเชื้อและอนามัยแม่และเด็กในชนบท มาสู่<strong>การจัดการโรคไม่ติดต่อเรื้อรัง (NCDs) สังคมสูงวัย โรคร่วมหลายโรค และสุขภาพเขตเมือง</strong> ตามการเปลี่ยนผ่านทางระบาดวิทยา ส่วนสาเหตุที่ปฐมภูมิมักได้ทรัพยากรน้อยกว่าโรงพยาบาลเกิดจากอิทธิพลทางประวัติศาสตร์ของแนวคิด <em>selective PHC</em> และเศรษฐศาสตร์การเมืองที่งบประมาณ อำนาจวิชาชีพ และความคาดหวังทางการเมืองมักกระจุกอยู่ในโรงพยาบาลขนาดใหญ่ในเมือง (<em>hospital-centrism</em>)</p></div>",
    hs5_bq_15:
      "<div class='iq-model-prose'><p>องค์การอนามัยโลกเสนอปฏิรูป PHC ในรายงานอนามัยโลก ค.ศ. 2008 เพื่อแก้ปัญหา 3 แนวโน้มที่บิดเบือนระบบสุขภาพ ได้แก่ การเน้นแต่โรงพยาบาล การแยกส่วนงานตามโรค และการปล่อยให้บริการกลายเป็นสินค้าเชิงพาณิชย์ โดยขับเคลื่อน <strong>ชุดการปฏิรูป 4 ด้าน</strong> คือ (1) <strong>หลักประกันสุขภาพถ้วนหน้า</strong>เพื่อความเป็นธรรม (2) <strong>ปฏิรูปการจัดบริการ</strong>ให้ยึดคนเป็นศูนย์กลางโดยมีปฐมภูมิเป็นแม่ข่ายประสานงาน (3) <strong>นโยบายสาธารณะข้ามภาคส่วน</strong> และ (4) <strong>การอภิบาลแบบมีส่วนร่วม</strong></p></div>",
    hs5_bq_22:
      "<div class='iq-model-prose'><p>ปฏิญญาแอสทานา ค.ศ. 2018 ย้ำ <strong>3 องค์ประกอบที่แยกกันไม่ได้ของ PHC</strong> เพราะลำพังบริการคลินิกไม่สามารถจัดการต้นตอของโรคเรื้อรังและความเหลื่อมล้ำได้ จึงต้องเชื่อม (1) <strong>บริการปฐมภูมิและหน้าที่สาธารณสุขที่จำเป็นแบบบูรณาการ</strong> เข้ากับ (2) <strong>นโยบายและการทำงานข้ามภาคส่วน</strong>เพื่อจัดการปัจจัยกำหนดสุขภาพด้านสังคม เศรษฐกิจ และสิ่งแวดล้อม และ (3) <strong>การเสริมพลังบุคคล ครอบครัว และชุมชน</strong>ให้ร่วมกำหนดปัญหาและดูแลสุขภาพตนเองได้อย่างยั่งยืน</p></div>",
    hs5_bq_28:
      "<div class='iq-model-prose'><p>คุณลักษณะหลักของบริการปฐมภูมิที่ดี (<strong>Starfield's 4Cs + ยึดคนเป็นศูนย์กลาง</strong>) ทำงานเสริมกันอย่างเป็นระบบ: <strong>ด่านแรก (first contact)</strong> ช่วยให้เข้าถึงง่ายและคัดกรองลดความแออัดโรงพยาบาล <strong>ครอบคลุมรอบด้าน (comprehensiveness)</strong> ตอบสนองทั้งส่งเสริม ป้องกัน รักษา ฟื้นฟูในที่เดียว <strong>ต่อเนื่อง (continuity)</strong> สร้างความไว้วางใจและเข้าใจบริบทชีวิตร่วมกันระยะยาว <strong>ประสานการดูแล (coordination)</strong> เชื่อมรอยต่อเมื่อส่งต่อไปผู้เชี่ยวชาญไม่ให้การรักษาขาดตอน และ<strong>ยึดคนเป็นศูนย์กลาง</strong> ให้ความสำคัญกับคนทั้งคนในบริบทครอบครัวและชุมชนมากกว่ามองเฉพาะโรค</p></div>",
    hs5_bq_38:
      "<div class='iq-model-prose'><p>เพราะการรักษาผู้ป่วยทีละรายที่เดินเข้าคลินิกเป็นเพียงการแก้ปลายเหตุ ระบบสุขภาพปฐมภูมิจึงต้องผสาน<strong>หน้าที่ด้านสาธารณสุขที่จำเป็น (Essential Public Health Functions: EPHFs)</strong> ระดับประชากรควบคู่กันเสมอ ทั้งการเฝ้าระวังโรคและปัจจัยเสี่ยงในพื้นที่ การคุ้มครองสุขภาพและควบคุมสิ่งคุกคามสิ่งแวดล้อม การสร้างเสริมสุขภาพและความรอบรู้ด้านสุขภาพในชุมชน การป้องกันโรคเชิงรุก และการเตรียมพร้อมรับภาวะฉุกเฉินด้านสาธารณสุข</p></div>",
    hs5_bq_45:
      "<div class='iq-model-prose'><p>PHC เป็นรากฐานของ <strong>หลักประกันสุขภาพถ้วนหน้า (UHC)</strong> และเป้าหมายการพัฒนาที่ยั่งยืน (SDG 3) เพราะเป็นกลไกที่ส่งมอบบริการจำเป็นใกล้บ้านได้อย่างคุ้มค่าและเป็นธรรมที่สุด บทเรียนของไทยสะท้อนโอกาสจากการวางรากฐาน<strong>งานสาธารณสุขมูลฐาน (อสม.) และระบบสุขภาพอำเภอ (รพช.–รพ.สต.)</strong> จนหนุนให้ UHC พ.ศ. 2545 สำเร็จรวดเร็ว แต่ปัจจุบันเผชิญความท้าทายใหม่ด้านสังคมสูงวัย ปฐมภูมิเขตเมือง การพัฒนาทีมหมอครอบครัวตาม พ.ร.บ.ระบบสุขภาพปฐมภูมิ พ.ศ. 2562 และการประสานรอยต่อการถ่ายโอน รพ.สต. สู่ อปท.</p></div>",
    hs5_bq_50:
      "<div class='iq-model-prose'><p>ประเทศไทยขยายความครอบคลุมหลักประกันสุขภาพถ้วนหน้า พ.ศ. 2545 ได้อย่างรวดเร็วแม้เป็นประเทศรายได้ปานกลาง เพราะมีการลงทุนวาง<strong>โครงสร้างพื้นฐานปฐมภูมิและระบบสุขภาพอำเภอไว้ล่วงหน้าอย่างต่อเนื่องหลายทศวรรษ</strong> ทั้งการกระจายโรงพยาบาลชุมชนครบทุกอำเภอและสถานีอนามัย (รพ.สต.) ครบทุกตำบล นโยบายแพทย์และบุคลากรปฏิบัติงานใช้ทุนในชนบท เครือข่าย อสม. ในชุมชน และประสบการณ์บริหารกองทุนสวัสดิการรักษาพยาบาลและบัตรประกันสุขภาพมาก่อนหน้า</p></div>",
  };

  let enrichedRubricsCache = null;

  function getRubrics() {
    const raw = (window.RACM_HS_DATA && window.RACM_HS_DATA.interactiveRubrics) || {};
    if (enrichedRubricsCache && enrichedRubricsCache._src === raw) {
      return enrichedRubricsCache.map;
    }
    const map = {};
    for (const k of Object.keys(raw)) {
      const r = raw[k];
      if (CONCEPTUALIZED_RUBRIC_OVERRIDES[k]) {
        map[k] = { ...r, answerHtml: CONCEPTUALIZED_RUBRIC_OVERRIDES[k] };
      } else {
        map[k] = r;
      }
    }
    enrichedRubricsCache = { _src: raw, map };
    return map;
  }

  function getDocs() {
    return (window.RACM_HS_DATA && window.RACM_HS_DATA.docs) || [];
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Safely render plain text with lightweight **bold**, *italic*, and `code` markdown while escaping HTML. */
  function formatSafeRichText(s) {
    let out = escapeHtml(s);
    out = out.replace(/\*\*([^*\n]{1,180})\*\*/g, "<strong>$1</strong>");
    out = out.replace(/`([^`\n]{1,120})`/g, "<code>$1</code>");
    out = out.replace(/(^|[\s(])\*([^*\n]{2,120})\*(?=[\s).,;:]|$)/g, "$1<em>$2</em>");
    return out;
  }

  function stripTags(html) {
    return String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function clipText(s, maxLen) {
    const clean = String(s || "").replace(/\s+/g, " ").trim();
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
  }

  /* ==========================================================================
   * LAYER 1: DUAL-DOCUMENT TEACHING GROUNDING & DEEP-LINK ENGINE
   * Maps every question to ② ฉบับย่อ (Abridged) + ① ฉบับเต็ม (Full) with anchors
   * ========================================================================== */
  const docSectionsCache = new Map();

  function parseDocSections(doc) {
    if (!doc || !doc.html) return [];
    if (docSectionsCache.has(doc.id)) return docSectionsCache.get(doc.id);

    const html = doc.html;
    const headingRe = /<h([1-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
    const heads = [];
    let m;
    while ((m = headingRe.exec(html)) !== null) {
      const attrs = m[2] || "";
      const idMatch = attrs.match(/\bid="([^"]+)"/i);
      heads.push({
        level: Number(m[1]),
        anchorId: idMatch ? idMatch[1] : "",
        title: stripTags(m[3]),
        start: m.index,
        bodyStart: m.index + m[0].length,
      });
    }

    const sections = [];
    for (let i = 0; i < heads.length; i++) {
      const h = heads[i];
      const end = i + 1 < heads.length ? heads[i + 1].start : html.length;
      const bodyHtml = html.slice(h.bodyStart, end);
      if (/เฉลยท้ายเล่ม|แนวคำตอบ|เอกสารอ้างอิง|วัตถุประสงค์การเรียนรู้และคำถามนำ/.test(h.title)) continue;

      let summaryNote = "";
      const bqMatches = [...bodyHtml.matchAll(/<blockquote\b([^>]*)>([\s\S]*?)<\/blockquote>/gi)];
      for (const bqm of bqMatches) {
        if (/data-qa-id=/i.test(bqm[1] || "")) continue;
        const bqTxt = stripTags(bqm[2]);
        if (bqTxt.length >= 25) {
          summaryNote = bqTxt.replace(/^ประเด็นสำคัญของหัวข้อ(?:ย่อย)?นี้คือ\s*/, "").trim();
          break;
        }
      }

      const cleanBodyHtml = bodyHtml
        .replace(/<blockquote[^>]*data-qa-id=[\s\S]*?<\/blockquote>/gi, " ")
        .replace(/<details\b[\s\S]*?<\/details>/gi, " ");
      const liBullets = [];
      const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let lm;
      while ((lm = liRe.exec(cleanBodyHtml)) !== null && liBullets.length < 4) {
        const liPlain = stripTags(lm[1])
          .replace(/\([A-Z][a-zA-Z\s&.,;0-9\-]+\d{4}[a-z]?\)/g, "")
          .replace(/\s+/g, " ")
          .trim();
        if (liPlain.length >= 20) liBullets.push(clipText(liPlain, 220));
      }

      const prosePlain = stripTags(cleanBodyHtml);
      const numMatch = h.title.match(/^\(?(\d+(?:\.\d+)*)\)?(?:\s|[.)]|$)/);
      sections.push({
        docId: doc.id,
        level: h.level,
        anchorId: h.anchorId,
        num: numMatch ? numMatch[1] : "",
        title: h.title,
        shortTitle: clipText(h.title.replace(/\s*\([^)]+\)\s*$/, ""), 76),
        start: h.start,
        end,
        summaryNote: summaryNote ? clipText(summaryNote, 260) : "",
        bullets: liBullets,
        plain: prosePlain,
      });
    }

    docSectionsCache.set(doc.id, sections);
    return sections;
  }

  function getDocById(docId) {
    return getDocs().find((d) => d.id === docId) || null;
  }

  function getModuleDocsPair(docId) {
    const baseMatch = String(docId || "").match(/^(HS[1-6]|ST1)/i);
    if (!baseMatch) return { moduleCode: "", fullDoc: null, conciseDoc: null };
    const moduleCode = baseMatch[1].toUpperCase();
    return {
      moduleCode,
      fullDoc: getDocById(moduleCode),
      conciseDoc: getDocById(`${moduleCode}-CONCISE`),
    };
  }

  function scoreOverlap(queryText, candidateText) {
    if (!queryText || !candidateText) return 0;
    const qLow = queryText.toLowerCase();
    const cLow = candidateText.toLowerCase();
    let score = 0;

    const enWords = [...new Set(qLow.match(/[a-z][a-z0-9\-]{2,}/g) || [])];
    for (const w of enWords) {
      if (cLow.includes(w)) score += 3;
    }

    const thRuns = qLow.match(/[ก-๙]{4,}/g) || [];
    const seen = new Set();
    for (const run of thRuns) {
      const step = run.length > 10 ? 3 : 2;
      for (let i = 0; i <= run.length - 4; i += step) {
        const g = run.slice(i, i + 4);
        if (seen.has(g)) continue;
        seen.add(g);
        if (cLow.includes(g)) score += 1;
      }
    }
    return score;
  }

  function pickBestConciseSection(moduleCode, conciseSections, fullSectionNum, queryBlob) {
    if (!conciseSections || !conciseSections.length) return null;

    if (moduleCode === "HS1") {
      const fn = String(fullSectionNum || "");
      const qLow = String(queryBlob || "").toLowerCase();
      if (fn.startsWith("1.1") || /disease|illness|sickness|ใบรับรองแพทย์|สามมิติ/.test(qLow)) {
        const s13 = conciseSections.find((s) => s.num === "1.3");
        if (s13 && !/องค์การอนามัยโลก|bircher|huber|well-being|wellness/.test(qLow)) return s13;
      }
      if (fn.startsWith("1.2") || fn.startsWith("1.3") || /นิยามสุขภาพ|องค์การอนามัยโลก|สมบูรณ์|bircher|huber|well-being|wellness/.test(qLow)) {
        const s11 = conciseSections.find((s) => s.num === "1.1");
        if (s11) return s11;
      }
      if (fn.startsWith("2") || /ปัจจัยกำหนด|diderichsen|bishai|เหลื่อมล้ำ|สภาพการทำงาน|เด็กคนที่สอง/.test(qLow)) {
        const s12 = conciseSections.find((s) => s.num === "1.2");
        if (s12) return s12;
      }
      if (fn.startsWith("3") || /การป้องกัน|คัดกรอง|ผลบวกลวง|ผลลบลวง|primordial|quaternary|psa/.test(qLow)) {
        const s14 = conciseSections.find((s) => s.num === "1.4");
        if (s14) return s14;
      }
    }

    if (fullSectionNum) {
      const exact = conciseSections.find((s) => s.num === fullSectionNum);
      if (exact) return exact;
      const parts = fullSectionNum.split(".");
      if (parts.length >= 2) {
        const twoLvl = `${parts[0]}.${parts[1]}`;
        const m2 = conciseSections.find((s) => s.num === twoLvl);
        if (m2) return m2;
      }
      const m1 = conciseSections.find((s) => s.num === parts[0] || (s.num && s.num.startsWith(parts[0] + ".")));
      if (m1) return m1;
    }

    let best = null;
    let topScore = 0;
    for (const s of conciseSections) {
      if (s.level === 2 && s.plain.length < 30 && conciseSections.length > 3) continue;
      const sc = scoreOverlap(queryBlob, `${s.title} ${s.plain.slice(0, 1400)}`);
      if (sc > topScore) {
        topScore = sc;
        best = s;
      }
    }
    return best || conciseSections[0] || null;
  }

  function buildDocDeepLinkHtml(docId, anchorId, labelText, variantClass) {
    const cls = variantClass ? `iq-doc-deep-link ${variantClass}` : "iq-doc-deep-link";
    const href = anchorId ? `#${escapeHtml(anchorId)}` : `#${escapeHtml(docId)}`;
    return `<a href="${href}" class="${cls}" data-racm-doc="${escapeHtml(docId)}" data-racm-anchor="${escapeHtml(anchorId || "")}">${escapeHtml(labelText)}</a>`;
  }

  const rubricContextCache = new Map();

  function extractTeachingContext(rubric) {
    if (rubric && rubric.id && rubricContextCache.has(rubric.id)) {
      return rubricContextCache.get(rubric.id);
    }
    const docId = (rubric && rubric.docId) || "";
    const { moduleCode, fullDoc, conciseDoc } = getModuleDocsPair(docId);
    const curDoc = getDocById(docId) || fullDoc;

    let headingPath = (rubric && rubric.sectionTitle) || "";
    let enclosingAnchorId = "";
    let enclosingNum = "";
    let caseVignette = "";
    let followingProse = "";

    if (curDoc && curDoc.html && rubric && rubric.id) {
      const html = curDoc.html;
      let pos = html.indexOf(`"${rubric.id}"`);
      if (pos < 0 && rubric.prompt) {
        const probe = rubric.prompt.trim().slice(0, 36);
        if (probe.length >= 12) pos = html.indexOf(probe);
      }

      if (pos >= 0) {
        const beforeHtml = html.slice(Math.max(0, pos - 9000), pos);
        const hRe = /<h([2-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
        const foundHeads = [];
        let hm;
        while ((hm = hRe.exec(beforeHtml)) !== null) {
          const idM = (hm[2] || "").match(/\bid="([^"]+)"/i);
          const tClean = stripTags(hm[3]);
          const nM = tClean.match(/^\(?(\d+(?:\.\d+)*)\)?(?:\s|[.)]|$)/);
          foundHeads.push({
            level: Number(hm[1]),
            anchorId: idM ? idM[1] : "",
            num: nM ? nM[1] : "",
            title: tClean,
            relEnd: hm.index + hm[0].length,
          });
        }

        if (foundHeads.length > 0) {
          const stack = [];
          for (const fh of foundHeads) {
            while (stack.length && stack[stack.length - 1].level >= fh.level) stack.pop();
            stack.push(fh);
          }
          const builtPath = stack.map((x) => x.title).filter(Boolean).join(" › ");
          if (builtPath && (!headingPath || headingPath.length < 18)) {
            headingPath = builtPath;
          }
          const lastHead = foundHeads[foundHeads.length - 1];
          enclosingAnchorId = lastHead.anchorId || "";
          enclosingNum = lastHead.num || (stack[0] && stack[0].num) || "";

          const prevSectionHead = foundHeads.length >= 2 ? foundHeads[foundHeads.length - 2] : lastHead;
          const sliceStart = Math.max(0, prevSectionHead.relEnd);
          const rawBefore = beforeHtml.slice(sliceStart);
          const cleanBefore = stripTags(rawBefore.replace(/<ol\b[^>]*>[\s\S]*?<\/ol>/gi, " "));
          if (cleanBefore.length >= 25) {
            caseVignette = clipText(cleanBefore, 1400);
          }
        }

        const afterHtml = html.slice(pos, Math.min(html.length, pos + 3600));
        const tagEnd = afterHtml.search(/<\/(?:blockquote|li|p|table|ul)>/i);
        if (tagEnd > 0) {
          let afterSlice = afterHtml.slice(tagEnd);
          const nextMajorHead = afterSlice.search(/<h[1-3]\b/i);
          if (nextMajorHead > 80) afterSlice = afterSlice.slice(0, nextMajorHead);
          const proseOnly = afterSlice
            .replace(/<blockquote[^>]*data-qa-id=[\s\S]*?<\/blockquote>/gi, " ")
            .replace(/<details\b[\s\S]*?<\/details>/gi, " ");
          const plainAfter = stripTags(proseOnly);
          if (plainAfter.length >= 40) {
            followingProse = clipText(plainAfter, 1100);
          }
        }
      }
    }

    const fullSections = fullDoc ? parseDocSections(fullDoc) : [];
    const conciseSections = conciseDoc ? parseDocSections(conciseDoc) : [];
    const queryBlob = `${(rubric && rubric.prompt) || ""} ${stripTags((rubric && rubric.answerHtml) || "")} ${headingPath}`;

    let bestFullSec = null;
    if (fullSections.length > 0) {
      if (rubric && rubric.fullAnchor) {
        bestFullSec = fullSections.find((s) => s.anchorId === rubric.fullAnchor) || null;
      }
      if (!bestFullSec && docId === (fullDoc && fullDoc.id) && enclosingAnchorId) {
        bestFullSec = fullSections.find((s) => s.anchorId === enclosingAnchorId) || null;
        if (
          bestFullSec &&
          bestFullSec.level === 2 &&
          bestFullSec.num &&
          !bestFullSec.summaryNote &&
          bestFullSec.bullets.length === 0 &&
          bestFullSec.plain.length < 520
        ) {
          const childPrefix = `${bestFullSec.num}.`;
          const childSecs = fullSections.filter((s) => s.num && s.num.startsWith(childPrefix));
          if (childSecs.length > 0) {
            let bestChild = childSecs[0];
            let bestChildScore = -1;
            for (const cs of childSecs) {
              const sc = scoreOverlap(queryBlob, `${cs.title} ${cs.summaryNote || ""} ${cs.plain.slice(0, 1500)}`);
              if (sc > bestChildScore) {
                bestChildScore = sc;
                bestChild = cs;
              }
            }
            bestFullSec = bestChild;
          }
        }
      }
      if (!bestFullSec) {
        const secNumMatches = [...queryBlob.matchAll(/หัวข้อ(?:ย่อย)?(?:ที่)?\s*(\d+(?:\.\d+)*)/g)].map((x) => x[1]);
        for (const targetNum of secNumMatches) {
          bestFullSec = fullSections.find((s) => s.num === targetNum);
          if (bestFullSec) break;
        }
        if (!bestFullSec && secNumMatches.length > 0) {
          const prefix = secNumMatches[0] + ".";
          bestFullSec = fullSections.find((s) => s.num && s.num.startsWith(prefix));
        }
      }
      if (!bestFullSec && enclosingNum && docId.includes("-CONCISE")) {
        bestFullSec = fullSections.find((s) => s.num === enclosingNum) || null;
      }
      if (!bestFullSec) {
        let topScore = 0;
        for (const s of fullSections) {
          if (s.plain.length < 50 && fullSections.length > 4) continue;
          const sc = scoreOverlap(queryBlob, `${s.title} ${s.plain.slice(0, 1500)}`);
          if (sc > topScore) {
            topScore = sc;
            bestFullSec = s;
          }
        }
      }
      if (!bestFullSec) bestFullSec = fullSections[0];
    }

    let bestConciseSec = null;
    if (conciseSections.length > 0) {
      if (rubric && rubric.conciseAnchor) {
        bestConciseSec = conciseSections.find((s) => s.anchorId === rubric.conciseAnchor) || null;
      }
      if (!bestConciseSec && docId === (conciseDoc && conciseDoc.id) && enclosingAnchorId) {
        bestConciseSec = conciseSections.find((s) => s.anchorId === enclosingAnchorId) || null;
      }
      if (!bestConciseSec) {
        bestConciseSec = pickBestConciseSection(
          moduleCode,
          conciseSections,
          (bestFullSec && bestFullSec.num) || enclosingNum,
          queryBlob
        );
      }
    }

    const companionHeading = bestFullSec ? bestFullSec.title : "";
    const companionExcerpt = bestFullSec ? clipText(bestFullSec.plain, 1500) : "";

    const cleanHeading = headingPath.replace(/\s*\([^)]*เชื่อมโยง[^)]*\)\s*$/g, "").trim();
    const shortCompanion = bestFullSec ? bestFullSec.shortTitle : "";
    const shortConcise = bestConciseSec ? bestConciseSec.shortTitle : "";
    const shortHeading = cleanHeading ? clipText(cleanHeading, 78) : "";

    let groundingLabel = "";
    if (docId && docId.includes("-WB")) {
      groundingLabel = shortCompanion
        ? `${docId}${shortHeading ? ` · ${shortHeading}` : ""} — เชื่อมโยง ${moduleCode} หัวข้อ ${shortCompanion}`
        : `${docId}${shortHeading ? ` · ${shortHeading}` : ""}`;
    } else if (shortCompanion) {
      groundingLabel = `${moduleCode || docId} · ${shortCompanion}`;
    } else if (shortHeading) {
      groundingLabel = `${docId || moduleCode} · ${shortHeading}`;
    } else {
      groundingLabel = `${docId || "RACM 303"} · เอกสารประกอบการสอนระบบสุขภาพ`;
    }

    const teachingExcerptParts = [];
    if (caseVignette) teachingExcerptParts.push(`[สถานการณ์/บริบทหน้าโจทย์] ${caseVignette}`);
    if (companionExcerpt) teachingExcerptParts.push(`[เนื้อหาประกอบคำสอน ${moduleCode} ${companionHeading}] ${companionExcerpt}`);
    else if (followingProse) teachingExcerptParts.push(`[เนื้อหาประกอบคำสอนในบท] ${followingProse}`);

    const result = {
      moduleCode,
      docId,
      headingPath,
      caseVignette,
      followingProse,
      companionHeading,
      companionExcerpt,
      teachingExcerpt: teachingExcerptParts.join("\n\n"),
      groundingLabel,
      fullSec: bestFullSec,
      conciseSec: bestConciseSec,
      fullSections,
      conciseSections,
      shortConcise,
      shortCompanion,
    };
    if (rubric && rubric.id) rubricContextCache.set(rubric.id, result);
    return result;
  }

  function findSectionForConcept(concept, sections, fallbackSec) {
    if (!sections || !sections.length) return fallbackSec || null;
    if (!concept || !concept.tokens || !concept.tokens.length) return fallbackSec || sections[0];
    let best = null;
    let bestScore = 0;
    for (const sec of sections) {
      const hay = `${sec.title} ${sec.summaryNote || ""} ${sec.plain.slice(0, 1800)}`.toLowerCase();
      let sc = 0;
      for (const tok of concept.tokens) {
        if (tok.length >= 3 && hay.includes(tok)) {
          sc += sec.title.toLowerCase().includes(tok) ? 5 : 2;
        }
      }
      if (sc > bestScore) {
        bestScore = sc;
        best = sec;
      }
    }
    return bestScore > 0 ? best : fallbackSec || sections[0];
  }

  /* ==========================================================================
   * LAYER 2: INPUT QUALITY, GIBBERISH, KEYBOARD-MASH & OFF-TOPIC DETECTOR
   * ========================================================================== */

  // Valid medical / health-systems English acronyms & short words that must NEVER trigger gibberish
  const VALID_MEDICAL_EN_WORDS = new Set([
    "who", "phc", "pc", "uhc", "ucs", "sss", "csmbs", "drg", "drgs", "adjrw", "ffs", "sid",
    "che", "oop", "imc", "ltc", "ccm", "iccc", "acp", "ods", "cas", "step", "comb", "com-b",
    "bcw", "hta", "eqesarr", "4cs", "6w", "sdh", "sdhs", "sdoh", "daly", "qaly", "ncd", "ncds",
    "opd", "ipd", "er", "ems", "kpi", "nhso", "moph", "pcu", "rph", "psa", "bp", "dm", "ht",
    "copd", "cva", "mi", "tb", "hiv", "bmi", "hba1c", "gfr", "egfr", "ldl", "hdl", "cbc", "lft",
    "ecg", "ekg", "ct", "mri", "xray", "x-ray", "csdh", "wonca", "mindspace", "nudge", "ottawa",
    "starfield", "bircher", "huber", "eisenberg", "boorse", "nordenfelt", "donabedian", "bishai",
    "diderichsen", "tudor", "hart", "kahneman", "thaler", "green", "leonardi", "solar", "irwin",
    "disease", "illness", "sickness", "health", "wellness", "well-being", "wellbeing", "healthy",
    "primary", "secondary", "tertiary", "quaternary", "primordial", "prevention", "equity",
    "equality", "quality", "safety", "efficiency", "effectiveness", "governance", "resilience",
    "accountability", "relevance", "stewardship", "continuity", "comprehensiveness", "coordination",
    "contact", "first", "acute", "chronic", "palliative", "hospice", "ambulatory", "emergency",
    "triage", "reablement", "step-down", "step-up", "barthel", "telemedicine", "prepayment",
    "pooling", "capitation", "budget", "global", "upcoding", "treadmill", "moral", "hazard",
    "adverse", "selection", "cream", "skimming", "gatekeeping", "co-payment", "copayment",
    "system", "policy", "intent", "value-free", "value-laden", "holistic", "biomedical",
    "adapt", "self-manage", "potential", "demands", "ageing", "aging", "intrinsic", "capacity",
    "functional", "ability", "structural", "intermediary", "determinants", "inequity", "inequality",
    "false", "positive", "negative", "overdiagnosis", "overmedicalization", "shared", "decision",
    "decision-making", "screening", "vaccine", "smoking", "literacy", "teach-back", "capability",
    "opportunity", "motivation", "behaviour", "behavior", "upstream", "downstream", "yes", "no",
    "true", "false", "high", "low", "not", "for", "profit", "public", "private", "patient",
    "doctor", "physician", "care", "medical", "clinical", "community", "hospital", "clinic",
    "social", "mental", "physical", "spiritual", "complete", "absence", "risk", "factor", "factors",
    "input", "process", "output", "outcome", "impact", "feedback", "context", "building", "blocks",
    "triple", "quadruple", "quintuple", "aim", "burnout", "inverse", "law", "swiss", "cheese",
    "near", "miss", "catastrophic", "impoverishment", "opportunity", "cost", "technical",
    "productive", "allocative", "absorptive", "adaptive", "transformative", "alma-ata", "astana",
    "mandatory", "voluntary", "insurance", "coverage", "effective", "need", "use",
    "p4p", "sdg", "prep", "pep", "cdoh", "ephf", "ephfs", "ppp", "c-ph", "c-ps", "o-ph", "o-so", "m-re", "m-au",
    "respite", "autonomy", "interoperability", "opioid", "opioids", "exacerbation", "neglect", "self-neglect",
    "comorbidity", "comorbidities", "silo", "silos", "covariate", "non-covariate", "externality", "externalities",
    "stabilization", "empowerment", "self-efficacy", "cube", "axes", "axis", "blended", "inclusive", "exclusive",
    "the", "and", "but", "with", "from", "that", "this", "because", "therefore", "however",
    "different", "same", "group", "person", "people", "work", "working", "child", "mother",
    "elderly", "family", "income", "education", "environment", "water", "sanitation", "rural",
    "urban", "access", "cost", "time", "wait", "distance", "home", "life", "good", "bad", "more",
    "less", "only", "both", "all", "none", "can", "cannot", "may", "should", "must", "need",
  ]);

  // Common Thai words & morphemes to verify genuine Thai language vs keyboard mash / random consonants
  const COMMON_THAI_MORPHEMES = [
    "การ", "ความ", "ไม่", "มี", "เป็น", "ของ", "ที่", "ใน", "จาก", "และ", "หรือ", "แต่",
    "เพราะ", "จึง", "ได้", "ต้อง", "ให้", "ผู้", "คน", "โรค", "ป่วย", "แพทย์", "หมอ",
    "ระบบ", "สุขภาพ", "บริการ", "บุคคล", "ใช่", "ข้อ", "ระดับ", "ปัจจัย", "นโยบาย",
    "สังคม", "ร่างกาย", "รู้สึก", "ตรวจ", "รักษา", "ป้องกัน", "ดูแล", "จ่าย", "เงิน",
    "สิทธิ", "ชุมชน", "งาน", "ชีวิต", "ดี", "แย่", "มาก", "น้อย", "สูง", "ต่ำ", "ต่าง",
    "เหมือน", "กลุ่ม", "เดียว", "กัน", "กันหรือ", "แยก", "มิติ", "นิยาม", "สมบูรณ์",
    "ปรับตัว", "จัดการ", "ศักยภาพ", "ท้าทาย", "ไม้เท้า", "ต้นน้ำ", "ปลายน้ำ", "โครงสร้าง",
    "ความเหลื่อมล้ำ", "เป็นธรรม", "เท่าเทียม", "คุณภาพ", "ปลอดภัย", "ประสิทธิผล",
    "ประสิทธิภาพ", "ธรรมาภิบาล", "พฤติกรรม", "สุขภาวะ", "จิตใจ", "อารมณ์", "กังวล",
    "เครียด", "นอน", "หลับ", "อ่อนเพลีย", "ปวด", "ร้อน", "วูบวาบ", "ไข้", "หวัด",
    "เบาหวาน", "ความดัน", "มะเร็ง", "หลอดเลือด", "สมอง", "หัวใจ", "ฟื้นฟู", "พิการ",
    "ฉุกเฉิน", "เฉียบพลัน", "ระยะกลาง", "เรื้อรัง", "ระยะยาว", "ประคับประคอง", "ผู้สูงอายุ",
    "เด็ก", "มารดา", "แม่", "ลูก", "ครอบครัว", "แรงงาน", "น้ำ", "สะอาด", "สุขาภิบาล",
    "วัคซีน", "บุหรี่", "คัดกรอง", "ใบรับรอง", "วินิจฉัย", "อาการ", "ผลเลือด", "ปกติ",
    "ผิดปกติ", "รับฟัง", "อธิบาย", "ตัดสินใจ", "ร่วมกัน", "เจตนา", "หลัก", "องค์กร",
    "รัฐ", "เอกชน", "มูลนิธิ", "โรงพยาบาล", "คลินิก", "ปฐมภูมิ", "ทุติยภูมิ", "ตติยภูมิ",
    "จตุรภูมิ", "บัตรทอง", "ประกัน", "กองทุน", "งบ", "ค่าใช้จ่าย", "คุ้มครอง", "ยากจน",
    "เสี่ยง", "เฉลี่ย", "รวม", "ล่วงหน้า", "สมัครใจ", "บังคับ", "เหมา", "รายหัว",
    "ต่อ", "ตาม", "เช่น", "คือ", "ว่า", "กับ", "โดย", "เพื่อ", "เมื่อ", "หาก", "ถ้า",
    "จะ", "อาจ", "ควร", "ยัง", "แล้ว", "อยู่", "ไป", "มา", "ทำ", "ใช้", "ช่วย", "ลด",
    "เพิ่ม", "เกิด", "ส่งผล", "ทำให", "เนื่องจาก", "ดังนั้น", "กล่าวคือ", "ขณะ", "ส่วน",
    "แรก", "สอง", "สาม", "สี่", "ห้า", "หก", "ครึ่ง", "ร้อยละ", "ประเทศ", "จังหวัด",
    "อำเภอ", "ตำบล", "บ้าน", "เรียน", "สอบ", "ลา", "ถาม", "ตอบ", "เหตุผล", "ตัวอย่าง",
    "กรณี", "สถานการณ์", "ข้อมูล", "หลักฐาน", "วิจัย", "เปลี่ยน", "พัฒนา", "สร้าง",
    "เสริม", "แก้", "ปัญหา", "โอกาส", "เข้าถึง", "เวลา", "ระยะทาง", "เดินทาง", "รอ",
    "ยา", "เตียง", "ทีม", "ผู้ดูแล", "ญาติ", "เพื่อน", "วัฒนธรรม", "ความเชื่อ", "มอง",
    "คิด", "เห็น", "เข้าใจ", "ประเมิน", "วัด", "เกณฑ์", "ขอบเขต", "เป้าหมาย", "หน้าที่",
    "ผลผลิต", "ผลลัพธ์", "ผลกระทบ", "สะท้อน", "ซับซ้อน", "ยืดหยุ่น", "วิกฤต", "ด่านแรก",
    "ต่อเนื่อง", "ครอบคลุม", "ประสาน", "ส่งต่อ", "คลัง", "กำลังคน", "สารสนเทศ", "อภิบาล",
    "ตรวจสอบ", "ชี้แจง", "บริบท", "คล้าย", "ตรงข้าม", "สัมพันธ์", "เชื่อมโยง", "กระทบ",
    "เสียชีวิต", "ตาย", "รอด", "หาย", "เกิน", "จำเป็น", "ลวง", "บวก", "ลบ", "พลาด",
    "ถูกต้อง", "คลาดเคลื่อน", "ผิด", "จริง", "เท็จ", "ไม่จริง", "ไม่ใช่", "ไม่มี", "ไม่ได้",
  ];

  // Comprehensive Health Systems & Medical domain lexicon for off-topic check (avoiding 2-char Thai substrings that collide with everyday words like ยา/อยาก, งบ/สงบ, เดิน/เดินทางเที่ยว)
  const DOMAIN_LEXICON_TOKENS = [
    "สุขภาพ", "โรค", "ป่วย", "เจ็บป่วย", "อาการ", "แพทย์", "หมอ", "พยาบาล", "คนไข้", "ผู้ป่วย",
    "ผู้รับบริการ", "รักษา", "ตรวจ", "ป้องกัน", "รับประทานยา", "ใช้ยา", "กินยา", "จ่ายยา", "สั่งยา", "ขาดยา", "บัญชียา", "คลังยา",
    "โรงพยาบาล", "คลินิก", "รพ.", "รพ.สต.",
    "ปฐมภูมิ", "ทุติยภูมิ", "ตติยภูมิ", "จตุรภูมิ", "ระบบ", "บริการ", "นโยบาย", "สังคม", "ชุมชน",
    "สิ่งแวดล้อม", "เศรษฐกิจ", "รายได้", "ฐานะ", "เหลื่อมล้ำ", "เป็นธรรม", "เท่าเทียม", "สิทธิ",
    "ประกัน", "บัตรทอง", "กองทุน", "จ่ายเงิน", "งบประมาณ", "งบปลาย", "ค่าใช้จ่าย", "ค่ารักษา", "คุ้มครอง", "คุณภาพ",
    "ปลอดภัย", "ประสิทธิผล", "ประสิทธิภาพ", "ธรรมาภิบาล", "พฤติกรรม", "สุขภาวะ", "ชีวิต",
    "ร่างกาย", "จิตใจ", "มิติทางจิต", "ปัญญา", "กังวล", "นอนไม่หลับ", "อ่อนเพลีย", "ร้อนวูบวาบ", "ไข้หวัด", "เป็นไข้",
    "เบาหวาน", "ความดัน", "มะเร็ง", "หลอดเลือด", "สมอง", "หัวใจ", "ฟื้นฟู", "พิการ", "ฉุกเฉิน",
    "เฉียบพลัน", "ระยะกลาง", "เรื้อรัง", "ระยะยาว", "ประคับประคอง", "ผู้สูงอายุ", "เด็กเล็ก", "มารดา", "แม่และเด็ก",
    "ครอบครัว", "แรงงาน", "สภาพการทำงาน", "น้ำสะอาด", "น้ำประปา", "สุขาภิบาล", "วัคซีน", "บุหรี่",
    "คัดกรอง", "ใบรับรอง", "วินิจฉัย", "บุคคล", "กลุ่มเดียวกัน", "ต่างกลุ่ม", "คนละกลุ่ม",
    "แยกจากกัน", "มิติ", "นิยาม", "สมบูรณ์", "ปรับตัว", "จัดการตนเอง", "ศักยภาพ", "ความท้าทาย",
    "ไม้เท้า", "ต้นน้ำ", "ปลายน้ำ", "ปัจจัย", "เจตนา", "พ.ร.บ.", "องค์กร", "อสม.", "สาธารณสุข",
    "กระทรวง", "ท้องถิ่น", "อนามัย", "คลอด", "โภชนาการ", "สูบบุหรี่", "เลิกบุหรี่", "สุรา", "ออกกำลัง", "น้ำหนัก",
    "ผลตรวจ", "ผลเลือด", "ไขมัน", "พอกตับ", "ขาดสอบ", "ลาป่วย", "หมดประจำเดือน", "วัฒนธรรม",
    "ผลบวกลวง", "ผลลบลวง", "เกินจำเป็น", "ตัดสินใจ", "รับฟัง", "ทางไกล", "ส่งต่อ", "ด่านแรก",
    "ต่อเนื่อง", "ครอบคลุม", "ประสาน", "เหมาจ่าย", "รายหัว", "ตามรายการ", "ร่วมจ่าย", "ความเสี่ยง", "กลุ่มเสี่ยง",
    "เฉลี่ย", "รวมกองทุน", "ล่วงหน้า", "สมัครใจ", "ภาคบังคับ", "ข้าราชการ", "มอร์ฟีน", "บาร์เธล",
    "1669", "คัดแยก", "หมดไฟ", "ค่าเสียโอกาส", "เนยแข็ง", "รูรั่ว", "เกือบพลาด", "ยืดหยุ่น",
    "ออตตาวา", "สะกิด", "อัตโนมัติ", "ไตร่ตรอง", "รอบรู้", "ความสามารถ", "แรงจูงใจ",
    "อัลมา", "อัสตานา", "ข้อเข่า", "อาสาสมัคร", "ดูแล", "ผู้ดูแล", "พึ่งพิง", "เตียง",
    "คลาดเคลื่อน", "ไม่ถูกต้อง",
    "health", "disease", "illness", "sickness", "medical", "doctor", "patient", "care", "system",
    "policy", "equity", "equality", "quality", "safety", "primary", "secondary", "tertiary",
    "quaternary", "primordial", "prevention", "insurance", "finance", "behavior", "behaviour",
    "community", "hospital", "clinic", "who", "phc", "pc", "uhc", "ucs", "sss", "csmbs",
    "drg", "ffs", "capitation", "nudge", "comb", "com-b", "bcw", "ottawa", "starfield", "4cs",
    "6w", "step", "eqesarr", "imc", "ltc", "ccm", "iccc", "acp", "ods", "cas", "che", "oop",
    "sid", "psa", "bircher", "huber", "bishai", "diderichsen", "donabedian", "csdh", "wellness",
    "well-being", "false positive", "false negative", "overdiagnosis", "shared decision",
    "telemedicine", "barthel", "triage", "palliative", "hospice", "resilience", "governance",
    "accountability", "relevance", "efficiency", "effectiveness", "hta", "gatekeeping",
    "p4p", "sdg", "prep", "pep", "cdoh", "ephf", "ephfs", "ppp", "c-ph", "c-ps", "o-ph", "o-so", "m-re", "m-au",
    "มาตรา 40", "มาตรา 33", "มาตรา 39", "ม.40", "ม.33", "ม.39", "300 บาท", "ลูกบาศก์", "แกน x", "แกน y", "แกน z",
    "ผลกระทบภายนอก", "ลูกโซ่ความเย็น", "cold chain", "respite", "ไร้บ้าน", "เกษตรกร", "สารเคมี", "โรคร่วม",
  ];

  // Placeholder / test / give-up exact phrases (pure digits handled separately as numeric_noise gibberish)
  const PLACEHOLDER_TEST_EXACT = new Set([
    "test", "testing", "test1", "test123", "tes", "tset", "asdf", "asdfg", "asdfgh", "qwer",
    "qwerty", "zxcv", "zxcvb", "abc", "abcd", "abcdef", "xyz", "aaa", "aaaa", "xxx", "xxxx",
    "haha", "hahaha", "lol", "lmao", "ok", "okay", "k", "hi", "hello", "hey", "yo",
    "none", "na", "n/a", "null", "nil", "blank", "empty", "skip", "pass", "next", "blah",
    "ทดสอบ", "ทดลอง", "ลองส่ง", "ลองดู", "ลองตอบ", "ลองพิมพ์", "เทส", "เทสต์", "โอเค",
    "ครับ", "ค่ะ", "คะ", "จ้า", "จ๊ะ", "น้า", "เย้", "อิอิ", "หึหึ", "ฮ่าๆ", "ฮ่าๆๆ", "555+",
    "ข้าม", "ผ่าน", "ไม่มีอะไร", "ว่าง", "สวัสดี", "หวัดดี", "ดีครับ", "ดีค่ะ",
  ]);

  const HONEST_UNSURE_EXACT = new Set([
    "ไม่รู้", "ไม่รู้ครับ", "ไม่รู้ค่ะ", "ไม่รู้เลย", "ไม่ทราบ", "ไม่ทราบครับ", "ไม่ทราบค่ะ",
    "ไม่แน่ใจ", "ไม่แน่ใจครับ", "ไม่แน่ใจค่ะ", "ตอบไม่ได้", "คิดไม่ออก", "นึกไม่ออก",
    "จำไม่ได้", "งง", "งงมาก", "ไม่เข้าใจ", "ยังไม่เข้าใจ", "ยังตอบไม่ได้", "ขอคิดก่อน",
    "idk", "dunno", "no idea", "i don't know", "i dont know", "not sure", "unsure", "confused",
  ]);

  // Standard Thai Kedmanee EN -> TH keyboard map for detecting accidental wrong-language typing
  const EN_TO_TH_KEDMANEE = {
    "`": "_", "1": "ๅ", "2": "/", "3": "-", "4": "ภ", "5": "ถ", "6": "ุ", "7": "ึ", "8": "ค", "9": "ต", "0": "จ", "-": "ข", "=": "ช",
    "q": "ๆ", "w": "ไ", "e": "ำ", "r": "พ", "t": "ะ", "y": "ั", "u": "ี", "i": "ร", "o": "น", "p": "ย", "[": "บ", "]": "ล", "\\": "ฃ",
    "a": "ฟ", "s": "ห", "d": "ก", "f": "ด", "g": "เ", "h": "้", "j": "่", "k": "า", "l": "ส", ";": "ว", "'": "ง",
    "z": "ผ", "x": "ป", "c": "แ", "v": "อ", "b": "ิ", "n": "ื", "m": "ท", ",": "ม", ".": "ใ", "/": "ฝ",
    "Q": "๐", "W": "\"", "E": "ฎ", "R": "ฑ", "T": "ธ", "Y": "ํ", "U": "๊", "I": "ณ", "O": "ฯ", "P": "ญ", "{": "ฐ", "}": ",",
    "A": "ฤ", "S": "ฆ", "D": "ฏ", "F": "โ", "G": "ฌ", "H": "็", "J": "๋", "K": "ษ", "L": "ศ", ":": "ซ", "\"": ".",
    "Z": "(", "X": ")", "C": "ฉ", "V": "ฮ", "B": "ฺ", "N": "์", "M": "?", "<": "ฒ", ">": "ฬ", "?": "ฦ",
  };

  function decodeEnToThaiKedmanee(str) {
    let out = "";
    for (const ch of str) {
      out += EN_TO_TH_KEDMANEE[ch] || ch;
    }
    return out;
  }

  function hasValidThaiWord(str) {
    if (!str) return false;
    // Reject impossible leading combining marks or stacked tone marks
    if (/(?:^|\s)[ัิีึืุู็่้๊๋์]/.test(str)) return false;
    if (/[่้๊๋]{2,}/.test(str)) return false;
    for (const w of COMMON_THAI_MORPHEMES) {
      if (w.length >= 2 && str.includes(w)) return true;
    }
    return false;
  }

  function hasThaiKeyboardMash(str) {
    const clean = str.replace(/\s+/g, "");
    if (clean.length < 4) return false;
    const thaiRows = [
      "ฟหกด่าสว",
      "วสา่ดกหฟ",
      "ๆไำพะัีรนยบล",
      "ลบยนรีัะพำไๆ",
      "ผปแอิืทมใฝ",
      "ฝใมทืิแอปผ",
      "กขคงจฉชซฌญฎฏ",
    ];
    let mashHits = 0;
    for (let i = 0; i <= clean.length - 3; i++) {
      const tri = clean.slice(i, i + 3);
      if (thaiRows.some((r) => r.includes(tri))) {
        mashHits++;
      }
    }
    // High proportion of adjacent Kedmanee triples OR explicit classic home-row mash
    if (/ฟหกด|หกด่|กด่า|ด่าส|่าสว|ดฟหก|กหฟด|กขคง|ผปแอ|ไำพะ/.test(clean)) return true;
    if (clean.length >= 5 && mashHits >= 2 && mashHits / Math.max(1, clean.length - 2) >= 0.45) return true;
    return false;
  }

  function isLatinTokenGibberish(rawToken, contextWordsSet) {
    const tok = rawToken.trim();
    if (!tok) return false;
    const low = tok.toLowerCase();
    const stripped = low.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
    if (!stripped) return true;

    // Whitelisted medical/English word or appears in question/answer/teaching text
    if (VALID_MEDICAL_EN_WORDS.has(stripped) || (contextWordsSet && contextWordsSet.has(stripped))) {
      return false;
    }
    // Allow valid codes like HS1, HS2, 6W, 4Cs, PM2.5, HbA1c, COVID-19
    if (/^(?:hs[1-6]|6w|4cs?|pm2\.?5|hba1c|covid-?19|com-?b|step|iccc|eqesarr)$/i.test(stripped)) {
      return false;
    }

    // Internal or leading stray keyboard punctuation glued to letters/digits (e.g. ";ldfgk", "l604k;fu", "dfg;l", "s,v")
    if (/^[;,'/\\[\]]+[a-z0-9]{2,}|[a-z0-9][;\\[\],][a-z0-9]/i.test(low)) {
      return true;
    }

    // Mixed digits interleaved inside Latin letters (e.g. "l604k", "s4d2f") that isn't a whitelisted medical code
    if (/[a-z]\d+[a-z]|\d[a-z]+\d/i.test(stripped)) {
      return true;
    }

    // Only examine alphabetic portion
    const alpha = stripped.replace(/[^a-z]/g, "");
    if (alpha.length < 3) {
      // 1-2 random Latin chars that aren't whitelisted (like "fg", "lk", "zz", "xq")
      if (alpha.length >= 2 && !VALID_MEDICAL_EN_WORDS.has(alpha) && !/^(?:in|on|at|to|of|is|be|or|as|by|we|he|it|if|do|so|up|us|my|go|er|dm|ht|mi|tb|bp|ct|pc)$/i.test(alpha)) {
        return true;
      }
      return false;
    }

    // Repeated char >= 3 (e.g. "aaaa", "ssss", "zzzz")
    if (/(.)\1{2,}/.test(alpha)) return true;

    // Repeated 2-4 char chunk (e.g. "dfgdfg", "asdasd", "fgfg")
    if (/^([a-z]{2,4})\1+$/.test(alpha)) return true;

    // Zero vowels in length >= 4 (e.g. "dfgdfg", "ldfgk", "zxcvb", "bcdfg")
    const vowels = (alpha.match(/[aeiouy]/g) || []).length;
    if (alpha.length >= 4 && vowels === 0) return true;

    // 5+ consecutive consonants (almost impossible in normal English/medical terms except rare whitelisted ones)
    if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(alpha)) return true;

    // Very low vowel ratio in long Latin token
    if (alpha.length >= 7 && vowels / alpha.length < 0.14) return true;

    // QWERTY keyboard-row walk detection
    const qwertyRows = [
      "qwertyuiop[]",
      "poiuytrewq",
      "asdfghjkl;'",
      "';lkjhgfdsa",
      "zxcvbnm,./",
      "/.,mnbvcxz",
    ];
    let walkHits = 0;
    for (let i = 0; i <= low.length - 3; i++) {
      const tri = low.slice(i, i + 3);
      if (qwertyRows.some((r) => r.includes(tri))) walkHits++;
    }
    if (walkHits >= 1 && (vowels === 0 || low.length >= 5)) {
      // Guard real English words that happen to contain a 3-letter row walk (like "were", "type", "power", "assert", "asked", "flash", "sad")
      if (!/^(?:were|where|type|power|assert|asked|flash|sad|fast|last|past|gas|has|was|ask|desk|try|true|tree|free|three|write|power|lower|point|joint|minor|prior|equity|require|quality|query|quote|quiet|quite|system|study|story|short|sport|score|sector|server|service|control|country|support|report|import|export|effort|effect|affect|better|letter|matter|water|later|after|other|mother|father|rather|either|neither|public|policy|social|health|mental|normal|formal|global|local|rural|urban|human|woman|women|child|elder|older|under|order|offer|differ|suffer|refer|prefer|severe|review|prevent|primary|present|problem|process|program|provide|patient|payment|percent|person|people|period|place|plan|play|plus|poor|post|part|care|case|cost|cure|data|date|days|dead|deal|death|deep|diet|does|done|down|drug|duty|each|early|earn|ease|east|easy|else|even|ever|evil|exam|face|fact|fail|fair|fall|farm|fear|feel|felt|fill|find|fine|fire|firm|five|flow|food|foot|form|four|full|fund|gain|game|gave|girl|give|goal|goes|gold|gone|good|grow|half|hand|hard|harm|have|head|hear|heat|held|help|here|high|hold|home|hope|hour|huge|hurt|idea|into|item|join|just|keep|kept|kind|knew|know|lack|lady|land|late|lead|left|less|life|like|line|link|list|live|load|loan|long|look|lose|loss|lost|love|made|main|make|male|many|mark|mass|mean|meet|mild|mind|miss|mode|more|most|move|much|must|name|near|neck|need|news|next|nice|nine|none|note|once|only|onto|open|over|page|paid|pain|pair|pale|park|pass|path|pick|pill|plan|play|plot|plus|poll|pool|poor|port|post|pull|pure|push|race|rain|rank|rare|rate|read|real|rear|rely|rent|rest|rich|ride|ring|rise|risk|road|role|roll|room|root|rose|rule|rush|safe|said|sake|sale|salt|same|save|seat|seed|seek|seem|seen|self|sell|send|sent|sept|ship|shop|shot|show|shut|sick|side|sign|site|size|skin|slip|slow|snow|soft|soil|sold|sole|some|song|soon|sort|soul|spot|star|stay|step|stop|such|suit|sure|take|tale|talk|tall|tank|tape|task|team|tear|tell|tend|term|text|than|that|them|then|they|thin|this|thus|till|time|tiny|told|toll|tone|took|tool|tour|town|tree|trip|true|tube|turn|twin|unit|upon|used|user|vary|vast|very|vice|view|vote|wage|wait|wake|walk|wall|want|ward|warm|warn|wash|wave|ways|weak|wear|week|well|went|were|west|what|when|whom|wide|wife|wild|will|wind|wine|wing|wire|wise|wish|with|wood|word|wore|work|yard|yeah|year|your|zero|zone)$/.test(alpha)) {
        if (walkHits >= 2 || (walkHits >= 1 && (alpha.length >= 6 && vowels / alpha.length < 0.3))) {
          return true;
        }
        // Single home-row mash like "dfg", "sdf", "fgh", "ghj", "hjk", "jkl", "zxc", "xcv", "cvb", "qwe", "rty"
        if (/dfg|sdf|fgh|ghj|hjk|jkl|lkj|kjh|jhg|hgf|gfd|fds|zxc|xcv|cvb|qwe|rty/.test(low)) {
          return true;
        }
      }
    }

    // All characters from a single home-row keyboard line (e.g. "dfgkl;as")
    if (alpha.length >= 5 && /^[asdfghjkl;']+$/.test(low) && !/^(?:shall|flask|glass|salad|falls|halls|flags|slash|flash|dash|half|hall|fall|flag|glad|lass|asks|adds|dads|lads)$/.test(alpha)) {
      return true;
    }

    return false;
  }

  function buildContextWordsSet(rubric, teachingCtx) {
    const blob = `${(rubric && rubric.prompt) || ""} ${stripTags((rubric && rubric.answerHtml) || "")} ${(teachingCtx && teachingCtx.teachingExcerpt) || ""}`;
    const set = new Set();
    const enMatches = blob.toLowerCase().match(/[a-z][a-z0-9\-]{1,}/g) || [];
    for (const w of enMatches) set.add(w);
    return set;
  }

  function computeCharNgramContainment(a, b, n) {
    const cleanA = String(a || "").toLowerCase().replace(/[\s"“”'‘’.,;:!?()[\]{}\-–—/]/g, "");
    const cleanB = String(b || "").toLowerCase().replace(/[\s"“”'‘’.,;:!?()[\]{}\-–—/]/g, "");
    if (cleanA.length < n || cleanB.length < n) return 0;
    const setB = new Set();
    for (let i = 0; i <= cleanB.length - n; i++) setB.add(cleanB.slice(i, i + n));
    let hit = 0;
    const total = cleanA.length - n + 1;
    for (let i = 0; i <= cleanA.length - n; i++) {
      if (setB.has(cleanA.slice(i, i + n))) hit++;
    }
    return hit / total;
  }

  /**
   * Comprehensive input quality & gibberish detector.
   * Returns { status: "valid" | "empty" | "gibberish" | "keyboard_layout_typo" | "non_answer" | "prompt_copy" | "off_topic",
   *           subReason, decodedThai?, detail }
   */
  function analyzeSubmissionQuality(rawText, rubric, teachingCtx, opts) {
    const options = opts || {};
    const text = String(rawText || "").trim();
    if (!text) return { status: "empty", subReason: "empty" };

    // 1. Punctuation / symbols / emoji only
    const alphaNumThai = text.replace(/[^ก-๙a-zA-Z0-9]/g, "");
    if (!alphaNumThai) {
      return { status: "gibberish", subReason: "punctuation_only", detail: "มีเพียงเครื่องหมายวรรคตอนหรือสัญลักษณ์โดยไม่มีข้อความคำตอบ" };
    }

    const low = text.toLowerCase();
    const normCompact = low.replace(/[\s"“”'‘’.,;:!?()[\]{}\-–—/]+/g, "");

    // Allow valid short categorical table answers like "ยังไม่ทราบ", "ใช่", "ไม่ใช่"
    if (options.isCategoricalCell) {
      const catAllowed = ["ใช่", "ไม่ใช่", "ยังไม่ทราบ", "อยู่", "ไม่อยู่", "อยู่ที่ขอบ", "บกพร่อง", "ไม่บกพร่อง"];
      if (catAllowed.some((c) => text.includes(c))) return { status: "valid" };
    }

    // 2. Honest unsure vs test/placeholder (only when NOT a numeric cloze blank)
    if (!options.allowBareNumbers) {
      if (HONEST_UNSURE_EXACT.has(low) || HONEST_UNSURE_EXACT.has(normCompact)) {
        return { status: "non_answer", subReason: "honest_unsure", detail: "ผู้เรียนระบุว่ายังไม่แน่ใจ/ยังไม่ทราบ" };
      }
      if (PLACEHOLDER_TEST_EXACT.has(low) || PLACEHOLDER_TEST_EXACT.has(normCompact)) {
        return { status: "non_answer", subReason: "placeholder_test", detail: "เป็นข้อความทดสอบหรือคำสั้นที่ยังไม่ได้ตอบคำถาม" };
      }
    }

    // 3. Repeated single character or tiny repeated pattern across whole input (e.g. "กกกกก", "555555", "dfgdfg", "ababab")
    const noSpace = low.replace(/\s+/g, "");
    if (noSpace.length >= 4 && /^(.)\1+$/.test(noSpace)) {
      return { status: "gibberish", subReason: "repeated_chars", detail: "พิมพ์ตัวอักษรซ้ำตัวเดิมต่อเนื่อง" };
    }
    if (noSpace.length >= 6 && /^(.{2,4})\1{2,}$/.test(noSpace) && !/^[0-9.%]+$/.test(noSpace)) {
      return { status: "gibberish", subReason: "repeated_pattern", detail: "พิมพ์ชุดตัวอักษรซ้ำวนโดยไม่มีความหมาย" };
    }

    // 4. Pure digits / numeric noise on non-numeric open-ended questions
    const promptPlain = (rubric && rubric.prompt) || "";
    const answerPlain = stripTags((rubric && rubric.answerHtml) || "");
    const expectsNumeric =
      options.allowBareNumbers ||
      /กี่|เท่าใด|ร้อยละ|สัดส่วน|ประมาณ|จำนวน|ตัวเลข|1669|146|1,000|ค\.ศ\.|พ\.ศ\.|คะแนน|บาร์เธล|barthel|6w|4c/i.test(
        `${promptPlain} ${answerPlain}`
      );
    if (/^[\d\s.,%+\-–—/]+$/.test(text)) {
      if (!expectsNumeric) {
        return { status: "gibberish", subReason: "numeric_noise", detail: "พิมพ์เฉพาะตัวเลขซึ่งไม่สอดคล้องกับโจทย์เชิงอธิบายข้อนี้" };
      }
      return { status: "valid" };
    }

    // Quick pass if student explicitly mentioned any key case entity or rubric keyword (e.g., "บุคคล ก", "ข้อ ค", "โรค")
    const hasExplicitCaseEntity = /(?:บุคคล\s*[กขคงจ]|ผู้รับบริการ(?:รายที่)?\s*[1-4]|ผู้ป่วย(?:รายที่)?\s*[1-4]|เด็กคนที่[ห12]|ข้อ\s*[กขคงจ]|ระดับ(?:ที่)?\s*[1-4หนึ่งสองสามสี่]|ช่อง(?:ที่)?\s*[1-4]|เส้น\s*[A-E]|(?:ไม่)?ใช่(?:กลุ่ม)?เดียวกัน|ต่างกลุ่ม|คนละกลุ่ม)/i.test(
      text
    );

    const contextWordsSet = buildContextWordsSet(rubric, teachingCtx);

    // 5. Inspect Thai & Latin portions separately
    const thaiChars = (text.match(/[ก-๙]/g) || []).length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalLetters = thaiChars + latinChars;

    // 5a. Predominantly Latin / ASCII input (like "dfgdfg ;ldfgk" or "asdfghjkl" or "l604k;")
    if (latinChars > 0 && thaiChars === 0 && !hasExplicitCaseEntity) {
      const tokens = text.split(/\s+/).filter(Boolean);
      let gibTokens = 0;
      for (const t of tokens) {
        if (isLatinTokenGibberish(t, contextWordsSet)) gibTokens++;
      }
      if (tokens.length > 0 && gibTokens / tokens.length >= 0.5) {
        // Check whether user accidentally forgot to switch EN -> TH Kedmanee keyboard!
        if (text.length >= 4 && text.length <= 160) {
          const decoded = decodeEnToThaiKedmanee(text);
          if (hasValidThaiWord(decoded) && !hasThaiKeyboardMash(decoded)) {
            return {
              status: "keyboard_layout_typo",
              subReason: "forgot_switch_en_to_th",
              decodedThai: decoded,
              detail: `ดูเหมือนแป้นพิมพ์อาจค้างอยู่ภาษาอังกฤษ (เทียบแป้นไทยใกล้เคียง “${decoded}”)`,
            };
          }
        }
        return {
          status: "gibberish",
          subReason: "latin_keyboard_mash",
          detail: "ตรวจพบกลุ่มตัวอักษรภาษาอังกฤษแบบสุ่ม/เรียงตามแป้นพิมพ์ที่ไม่เป็นคำที่มีความหมาย",
        };
      }
      // Single ultra-short non-whitelisted Latin noise (1-2 chars like "a", "x", "fg")
      if (latinChars <= 2 && !VALID_MEDICAL_EN_WORDS.has(normCompact) && !contextWordsSet.has(normCompact)) {
        return { status: "gibberish", subReason: "too_short_noise", detail: "ข้อความสั้นเกินไปและไม่ใช่คำย่อหรือคำตอบที่มีความหมาย" };
      }
    }

    // 5b. Thai input checks (keyboard mash, impossible Thai orthography, random Thai consonants)
    if (thaiChars > 0 && !hasExplicitCaseEntity) {
      // Impossible leading combining vowels/tone marks or stacked tone marks
      if (/(?:^|\s)[ัิีึืุู็่้๊๋์]/.test(text) || /[่้๊๋]{2,}/.test(text)) {
        return { status: "gibberish", subReason: "invalid_thai_orthography", detail: "ตรวจพบการพิมพ์วรรณยุกต์หรือสระซ้อนผิดหลักภาษาไทยคล้ายการพิมพ์สุ่ม" };
      }

      // Thai Kedmanee keyboard row mashing (e.g. "ฟหกด่าสว", "ผปแอิืทม", "กขคงจฉ")
      if (hasThaiKeyboardMash(text)) {
        return { status: "gibberish", subReason: "thai_keyboard_mash", detail: "ตรวจพบการกดแป้นพิมพ์ภาษาไทยเรียงแถว (เช่น ฟหกด่าสว / กขคง) ซึ่งไม่ใช่คำตอบที่มีความหมาย" };
      }

      // Long Thai run with zero recognizable Thai morphemes + abnormal consonant clustering
      const thaiOnly = text.replace(/[^ก-๙]/g, "");
      if (thaiOnly.length >= 6) {
        const recognized = hasValidThaiWord(text);
        const thaiVowels = (thaiOnly.match(/[ะัาำิีึืุูเแโใไฤฦ]/g) || []).length;
        const longConsonantRun = /[ก-ฮ]{8,}/.test(thaiOnly);
        const rareConsonants = (thaiOnly.match(/[ฅฆฌฎฏฐฑฒณฬฮฃ]/g) || []).length;
        if (!recognized && (thaiVowels === 0 || longConsonantRun || rareConsonants / thaiOnly.length >= 0.35)) {
          return { status: "gibberish", subReason: "nonsense_thai", detail: "ตรวจพบลำดับอักษรภาษาไทยที่ไม่ประกอบเป็นคำที่มีความหมาย" };
        }
        // Even with scattered vowels, if >= 9 Thai chars and ZERO recognized Thai morphemes AND zero overlap with prompt/answer/domain
        if (!recognized && thaiOnly.length >= 9) {
          const overlapPromptAns = computeCharNgramContainment(text, `${promptPlain} ${answerPlain}`, 3);
          if (overlapPromptAns < 0.08) {
            return { status: "gibberish", subReason: "unrecognizable_thai", detail: "ข้อความภาษาไทยที่พิมพ์ไม่สามารถอ่านเป็นประโยคหรือคำที่มีความหมายได้" };
          }
        }
      }

      // Ultra-short 1-2 Thai chars that aren't valid answers (like "ก", "หก", "ฟห", excluding "ใช่" / "ดี" / "มี" / "ยา" / "โรค")
      if (thaiOnly.length <= 2 && latinChars === 0 && !/^(?:ใช่|ดี|มี|ยา|โรค|ก\.|ข\.|ค\.|ง\.|จ\.)$/.test(text.trim())) {
        return { status: "gibberish", subReason: "too_short_noise", detail: "พิมพ์ตัวอักษรสั้นเพียง 1–2 ตัว ซึ่งยังไม่เป็นคำตอบที่ประเมินได้" };
      }
    }

    // 5c. Mixed Thai + Latin gibberish (e.g. "กกก dfgdfg ;ldfgk")
    if (thaiChars > 0 && latinChars > 0) {
      const latinTokens = (text.match(/[a-zA-Z;,'/\\[\]]{3,}/g) || []);
      const badLatin = latinTokens.filter((t) => isLatinTokenGibberish(t, contextWordsSet));
      if (latinTokens.length > 0 && badLatin.length === latinTokens.length && !hasValidThaiWord(text)) {
        return { status: "gibberish", subReason: "mixed_gibberish", detail: "ตรวจพบข้อความปนอักษรสุ่มที่ไม่เป็นคำที่มีความหมาย" };
      }
    }

    // 5d. Random alphanumeric smash like "a1b2c3d4" or "1a2s3d4f"
    if (totalLetters >= 3 && /\d/.test(text) && /(?:[a-z]\d){3,}|(?:\d[a-z]){3,}/i.test(noSpace)) {
      return { status: "gibberish", subReason: "alphanumeric_smash", detail: "ตรวจพบการพิมพ์ตัวอักษรสลับตัวเลขแบบสุ่ม" };
    }

    // 6. Prompt-copy detection (skip for short table cells)
    if (!options.skipPromptCopy && promptPlain.length >= 24 && text.length >= 20) {
      const cleanU = low.replace(/[\s"“”'‘’.,;:!?()[\]{}\-–—/]/g, "");
      const cleanP = promptPlain.toLowerCase().replace(/[\s"“”'‘’.,;:!?()[\]{}\-–—/]/g, "");
      const containment = computeCharNgramContainment(text, promptPlain, 4);
      const extraChars = Math.max(0, cleanU.length - Math.round(cleanU.length * containment));
      if ((cleanP.includes(cleanU) && cleanU.length >= 18) || (containment >= 0.78 && extraChars < 18)) {
        return { status: "prompt_copy", subReason: "copied_prompt", detail: "คำตอบเกือบทั้งหมดคัดลอกมาจากข้อความโจทย์โดยตรง ยังไม่ได้เพิ่มข้อสรุปหรือเหตุผลของตนเอง" };
      }
    }

    // 7. Off-topic detection (real readable language, but 0% connection to rubric, case, teaching text, or health systems)
    if (!options.skipOffTopic && text.length >= 12 && !hasExplicitCaseEntity) {
      const hasDomainHit = DOMAIN_LEXICON_TOKENS.some((tok) => low.includes(tok));
      const refBlob = `${promptPlain} ${answerPlain} ${(teachingCtx && teachingCtx.caseVignette) || ""} ${(teachingCtx && teachingCtx.companionHeading) || ""}`;
      const refOverlap = computeCharNgramContainment(text, refBlob, 4);
      // Also check English words in refBlob
      const uEnWords = (low.match(/[a-z]{3,}/g) || []);
      const enRefHit = uEnWords.some((w) => !["the", "and", "for", "are", "but", "not", "you", "all", "can", "was", "one", "our", "out", "very", "much", "like", "love", "good", "have", "this", "that", "with"].includes(w) && contextWordsSet.has(w));

      if (!hasDomainHit && !enRefHit && refOverlap < 0.08) {
        return {
          status: "off_topic",
          subReason: "unrelated_content",
          detail: "ข้อความที่พิมพ์เป็นประโยคที่อ่านเข้าใจได้ แต่ยังไม่เชื่อมโยงกับโจทย์และเนื้อหาวิทยาศาสตร์ระบบสุขภาพ (RACM 303) ในข้อนี้",
        };
      }
    }

    return { status: "valid" };
  }

  /* ==========================================================================
   * LAYER 3: NORMALIZATION, 100+ CONCEPT BANK, CASE & MISCONCEPTION ANALYZER
   * ========================================================================== */
  const SYNONYM_GROUPS = [
    ["ใช่", "มี", "พบ", "ผิดปกติ", "yes", "true"],
    ["ไม่ใช่", "ไม่มี", "ไม่พบ", "ปกติ", "ไม่ได้", "no", "false"],
    ["ยังไม่ทราบ", "ไม่ทราบ", "ไม่แน่ใจ", "สรุปไม่ได้", "unknown"],
    ["อยู่", "อยู่ในระบบ", "อยู่ในระบบสุขภาพ"],
    ["อยู่ที่ขอบ", "ก้ำกึ่ง", "ขอบเขต", "ขึ้นกับการตีความ"],
    ["ไม่อยู่", "ไม่อยู่ในระบบ", "นอกระบบ"],
    ["บกพร่อง", "มีปัญหา", "ขาดแคลน"],
    ["ไม่บกพร่อง", "ไม่พบความบกพร่อง", "ดำเนินการแล้ว"],
    ["ระดับที่หนึ่ง", "ระดับ 1", "ปฐมภูมิ", "primary prevention", "primary"],
    ["ระดับที่สอง", "ระดับ 2", "ทุติยภูมิ", "secondary prevention", "secondary"],
    ["ระดับที่สาม", "ระดับ 3", "ตติยภูมิ", "tertiary prevention", "tertiary"],
    ["ระดับที่สี่", "ระดับ 4", "จตุรภูมิ", "quaternary prevention", "quaternary"],
    ["ก่อนเกิดปัจจัยเสี่ยง", "primordial prevention", "primordial"],
    ["ภาครัฐ", "ของรัฐ", "รัฐ"],
    ["เอกชนไม่แสวงหากำไร", "ไม่แสวงหากำไร", "มูลนิธิ", "การกุศล", "not-for-profit"],
    ["เอกชนแสวงหากำไร", "แสวงหากำไร", "เอกชน", "for-profit"],
  ];

  function normalizeShortToken(s) {
    const clean = String(s || "")
      .toLowerCase()
      .replace(/[\s"“”'‘’.,()\-–—/]/g, "")
      .trim();
    if (!clean) return "";
    for (let i = 0; i < SYNONYM_GROUPS.length; i++) {
      const grp = SYNONYM_GROUPS[i];
      for (const item of grp) {
        const normItem = item.toLowerCase().replace(/[\s"“”'‘’.,()\-–—/]/g, "");
        if (clean === normItem) return `syn_${i}`;
      }
    }
    return clean;
  }

  function matchCellValue(userVal, expectedVal, rubric, teachingCtx) {
    const uRaw = String(userVal || "").trim();
    const eRaw = String(expectedVal || "").trim();
    if (!uRaw) return { status: "empty" };

    const isCat = eRaw.length > 0 && eRaw.length <= 24;
    const qual = analyzeSubmissionQuality(uRaw, rubric, teachingCtx, {
      isCategoricalCell: isCat,
      skipPromptCopy: true,
      skipOffTopic: true,
    });
    if (qual.status === "gibberish" || qual.status === "keyboard_layout_typo" || (qual.status === "non_answer" && qual.subReason === "placeholder_test")) {
      return { status: "gibberish", qual };
    }

    if (!eRaw || eRaw === "—" || eRaw === "-") return { status: "open_ok" };

    const uNorm = normalizeShortToken(uRaw);
    const eNorm = normalizeShortToken(eRaw);
    if (uNorm && uNorm === eNorm) return { status: "exact" };

    if (isCat) {
      const uLow = uRaw.toLowerCase();
      const eLow = eRaw.toLowerCase();
      if (
        (eLow === "ใช่" && uLow.includes("ไม่ใช่")) ||
        (eLow === "ไม่ใช่" && uLow === "ใช่") ||
        (eLow === "อยู่" && (uLow.includes("ไม่อยู่") || uLow.includes("อยู่ที่ขอบ"))) ||
        (eLow === "บกพร่อง" && uLow.includes("ไม่บกพร่อง"))
      ) {
        return { status: "mismatch" };
      }
      for (const grp of SYNONYM_GROUPS) {
        if (grp.some((g) => eLow === g.toLowerCase())) {
          if (grp.some((g) => uLow === g.toLowerCase() || (g.length >= 4 && uLow.includes(g.toLowerCase())))) {
            return { status: "exact" };
          }
          return { status: "mismatch" };
        }
      }
      if (uLow.includes(eLow) || eLow.includes(uLow)) return { status: "exact" };
      return { status: "mismatch" };
    }

    // Descriptive cell: check concept overlap
    const concepts = extractKeyConceptsFromText(eRaw, "");
    if (!concepts.length) return { status: uRaw.length >= 6 ? "partial" : "brief" };
    const uLow = uRaw.toLowerCase();
    const hit = concepts.filter((c) => c.tokens.some((t) => uLow.includes(t)));
    if (hit.length >= Math.max(1, Math.ceil(concepts.length * 0.4))) return { status: "exact" };
    if (hit.length > 0) return { status: "partial" };
    return { status: "review" };
  }

  const STOP_PHRASES = new Set([
    "แนวคำตอบ",
    "แนวคำตอบหนึ่งที่สมเหตุสมผล",
    "แนวคำตอบหนึ่งที่สมเหตุสมผลคือ",
    "แนวคำตอบต่อไปนี้เป็นแนวคำตอบหนึ่งที่สมเหตุสมผล",
    "แนวคำตอบหนึ่งที่สมเหตุสมผล (เทียบกรณีบุคคล ก–ง และ HS1 หัวข้อ 1.1)",
    "แนวคิดหลักจากเนื้อหาส่วนนี้",
    "คำตอบหนึ่งที่สมเหตุสมผลคือ",
    "ตัวอย่างหนึ่งคือ",
    "ตัวอย่างเช่น",
    "คำถามนำ",
    "ส่วนที่หนึ่ง",
    "ส่วนที่สอง",
    "กล่าวคือ",
    "อย่างไรก็ตาม",
    "นอกจากนี้",
    "ในทางกลับกัน",
    "ดังนั้น",
    "เนื่องจาก",
    "เพราะเหตุใด",
  ]);

  // Expanded HS1–HS6 Domain Concept Bank with rich Thai colloquial + standard English student synonyms
  const DOMAIN_TERMS = [
    // HS1: Disease / Illness / Sickness & Health Definitions & Determinants & Prevention
    ["โรค (disease)", ["เป็นโรค", "มีโรค", "ความผิดปกติในร่างกาย", "ความผิดปกติของโครงสร้าง", "ตรวจพบความผิดปกติ", "ไขมันพอกตับ", "ไขมันในเลือดสูง", "ตรวจวัดได้", "disease"]],
    ["การเจ็บป่วย (illness)", ["การเจ็บป่วย", "รู้สึกไม่สบาย", "รู้สึกป่วย", "ความทุกข์ไม่สบาย", "อ่อนเพลีย", "นอนไม่หลับ", "ร้อนวูบวาบ", "ประสบการณ์ความรู้สึก", "illness"]],
    ["ภาวะที่สังคมยอมรับว่าป่วย (sickness)", ["สังคมยอมรับว่าป่วย", "สังคมยอมรับ", "ใบรับรองแพทย์", "รับรองการป่วย", "ลาป่วย", "เลื่อนสอบ", "บทบาทผู้ป่วย", "สถานะผู้ป่วย", "sickness"]],
    ["สามมิติแยกจากกัน (ไม่ใช่บุคคลกลุ่มเดียวกัน)", ["ไม่ใช่บุคคลกลุ่มเดียวกัน", "ไม่ใช่กลุ่มเดียวกัน", "คนละกลุ่ม", "ต่างกลุ่ม", "แยกจากกัน", "ไม่จำเป็นต้องเกิดพร้อมกัน", "ไม่จำเป็นต้องเกิดขึ้นพร้อมกัน"]],
    ["อิทธิพลของวัฒนธรรมและความเชื่อต่อการเจ็บป่วย", ["วัฒนธรรม", "ความเชื่อ", "บรรทัดฐาน", "เรื่องปกติของวัย", "การเปลี่ยนแปลงตามวัย"]],
    ["การสอบถามกรอบความเข้าใจของผู้ป่วย", ["กรอบความเข้าใจ", "คิดว่าตนเป็นอะไร", "คิดว่าเกิดจากสาเหตุใด", "ส่งผลต่อชีวิต", "กังวลใดมากที่สุด", "คาดหวังให้แพทย์"]],
    ["แนวทางข้อเท็จจริงที่ตรวจวัดได้ vs การประเมินสภาพโดยรวม (value-free vs value-laden)", ["value-free", "value-laden", "ข้อเท็จจริงที่ตรวจวัดได้", "ประเมินสภาพโดยรวม", "ชีวการแพทย์", "องค์รวม"]],
    ["นิยามสุขภาพ WHO ค.ศ. 1946 และข้อวิพากษ์คำว่า 'สมบูรณ์'", ["สมบูรณ์", "complete", "1946", "กาย จิตใจ และสังคม", "กาย จิต สังคม", "พึ่งพาการแพทย์", "overmedicalization"]],
    ["พ.ร.บ. สุขภาพแห่งชาติ พ.ศ. 2550 (เพิ่มมิติทางปัญญา)", ["มิติทางปัญญา", "ทางปัญญา", "สี่มิติ", "4 มิติ", "2550", "spiritual"]],
    ["ความสามารถในการปรับตัวและจัดการตนเอง (Huber)", ["ปรับตัว", "จัดการตนเอง", "รับมือกับความท้าทาย", "adapt", "self-manage", "huber", "leonardi"]],
    ["ศักยภาพทางสุขภาพเทียบความท้าทายของชีวิต (Bircher)", ["ศักยภาพ", "ความท้าทาย", "ทุนทางชีวภาพ", "ทุนที่สะสม", "ตาชั่ง", "bircher", "potential", "demands of life"]],
    ["การสูงวัยอย่างมีสุขภาพดี (Healthy Ageing)", ["สูงวัยอย่างมีสุขภาพดี", "healthy ageing", "สิ่งที่ตนเห็นคุณค่า", "สมรรถภาพภายใน", "สิ่งแวดล้อมที่เอื้อ", "ไม้เท้า"]],
    ["สุขภาวะ (well-being) vs ความเป็นอยู่ที่ดี (wellness)", ["สุขภาวะ", "well-being", "อยู่ดีมีสุข", "ความเป็นอยู่ที่ดี", "wellness", "พัฒนาสุขภาพของตน"]],
    ["ปัจจัยกำหนดสุขภาพ 3 กลุ่ม (ตัวบุคคล–สิ่งแวดล้อม–บริการสุขภาพ)", ["ตัวเด็กและครอบครัว", "สิ่งแวดล้อม", "บริการสุขภาพ", "สามกลุ่ม", "3 กลุ่ม"]],
    ["ปัจจัยต้นน้ำเชิงโครงสร้าง vs ปัจจัยปลายน้ำ (CSDH)", ["ต้นน้ำ", "เชิงโครงสร้าง", "ปลายน้ำ", "นโยบาย", "การเมือง", "ฐานะทางสังคม", "แรงงาน", "สภาพความเป็นอยู่", "ที่อยู่อาศัย", "น้ำสะอาด", "น้ำประปา", "สุขาภิบาล", "structural", "intermediary", "csdh"]],
    ["ห้าช่องทางลดความเหลื่อมล้ำ (Diderichsen)", ["ห้าช่องทาง", "5 ช่องทาง", "ลดความเหลื่อมล้ำทางฐานะ", "ลดการสัมผัส", "ลดความเปราะบาง", "ลดผลกระทบหลัง", "ความผูกพันในสังคม", "diderichsen"]],
    ["หลักฐาน 146 ประเทศ (Bishai) — ภาคสุขภาพและนอกภาคสุขภาพราวครึ่งต่อครึ่ง + ข้อควรระวัง", ["ครึ่งต่อครึ่ง", "146 ประเทศ", "ร้อยละ 89", "43", "40", "ในภาคสุขภาพ", "นอกภาคสุขภาพ", "แบบจำลองระดับประเทศ", "รายบุคคล", "bishai"]],
    ["สภาพการทำงานและสุขภาพ", ["สภาพการทำงาน", "แรงงาน", "ความเครียดในงาน", "งานไม่มั่นคง", "อาชีพ"]],
    ["การป้องกันก่อนเกิดปัจจัยเสี่ยง (primordial prevention)", ["ก่อนเกิดปัจจัยเสี่ยง", "primordial"]],
    ["การป้องกันระดับที่หนึ่ง (primary prevention)", ["ระดับที่หนึ่ง", "ระดับ 1", "วัคซีน", "เลิกบุหรี่", "ลดปัจจัยเสี่ยง", "ส่งเสริมสุขภาพ", "primary prevention", "primary"]],
    ["การป้องกันระดับที่สอง (secondary prevention) และผลลบลวง", ["ระดับที่สอง", "ระดับ 2", "คัดกรอง", "ระยะเริ่มแรก", "ก่อนมีอาการ", "รักษาทันท่วงที", "ผลลบลวง", "false negative", "secondary"]],
    ["การป้องกันระดับที่สาม (tertiary prevention)", ["ระดับที่สาม", "ระดับ 3", "ฟื้นฟู", "ภาวะแทรกซ้อน", "ความพิการ", "กลับไปทำงาน", "tertiary"]],
    ["การป้องกันระดับที่สี่ (quaternary prevention) และผลบวกลวง", ["ระดับที่สี่", "ระดับ 4", "เกินจำเป็น", "ผลบวกลวง", "false positive", "วินิจฉัยเกินจริง", "overdiagnosis", "overmedicalization", "quaternary"]],
    ["การตัดสินใจร่วมกันและการสื่อสารความไม่แน่นอน (shared decision-making / PSA)", ["ตัดสินใจร่วมกัน", "รับฟังความกังวล", "ประโยชน์และผลเสีย", "shared decision", "psa", "2012", "2018", "สื่อสารอย่างตรงไปตรงมา", "ความไม่แน่นอน"]],

    // HS2: Structure, Functions, CAS, 6W, Continuum of Care
    ["เจตนาหลัก (primary intent) ตามนิยาม WHO", ["เจตนาหลัก", "primary intent", "เป้าหมายแรกเพื่อสุขภาพ", "เป้าหมายหลักเพื่อสุขภาพ"]],
    ["ระบบความสัมพันธ์ทั้งมวล (พ.ร.บ. สุขภาพแห่งชาติ พ.ศ. 2550)", ["ความสัมพันธ์ทั้งมวล", "พ.ร.บ. สุขภาพ", "พระราชบัญญัติสุขภาพแห่งชาติ"]],
    ["หกองค์ประกอบหลักของระบบสุขภาพ (6 building blocks)", ["องค์ประกอบหลัก", "กำลังคน", "การคลัง", "สารสนเทศ", "ยาและเทคโนโลยี", "การอภิบาล", "การจัดบริการ", "building blocks", "6 องค์ประกอบ"]],
    ["ระบบที่ซับซ้อนและปรับตัวได้ (CAS) และวงจรผลสะท้อนกลับ", ["ซับซ้อนและปรับตัวได้", "ผลสะท้อนกลับ", "บริบท", "ไม่เป็นเส้นตรง", "feedback", "adaptive", "cas"]],
    ["ห่วงโซ่ผลลัพธ์ (ปัจจัยนำเข้า–กระบวนการ–ผลผลิต–ผลลัพธ์–ผลกระทบ)", ["ปัจจัยนำเข้า", "กระบวนการ", "ผลผลิต", "ผลลัพธ์", "ผลกระทบ", "results chain", "input", "output", "outcome", "impact"]],
    ["เป้าหมายห้าประการ (Quintuple Aim)", ["ห้าประการ", "หมดไฟ", "คนทำงาน", "ความเหลื่อมล้ำ", "quintuple", "quadruple", "triple aim"]],
    ["กรอบ 6W (WHO, WHY, WHEN, WHAT, WHICH, WHERE)", ["6w", "who", "why", "when", "what", "which", "where", "มิติเวลา", "ผู้ให้บริการ"]],
    ["การดูแลฉุกเฉิน (1669 / คัดแยกอาการ)", ["1669", "ฉุกเฉิน", "คัดแยก", "triage", "จุดเกิดเหตุ", "ชั่วโมงแรก"]],
    ["การดูแลระยะเฉียบพลัน (ทำให้ภาวะคงที่)", ["เฉียบพลัน", "คงที่", "พ้นวิกฤต", "หอผู้ป่วย", "acute"]],
    ["การดูแลระยะกลาง (IMC / Barthel / 6 เดือน / step-down)", ["ระยะกลาง", "imc", "บาร์เธล", "barthel", "reablement", "6 เดือน", "หกเดือน", "ระยะเวลาทอง", "ลดระดับ", "step-down", "step-up"]],
    ["การดูแลผู้ป่วยนอกและระบบทางไกล (Ambulatory / ODS / Telemedicine)", ["ผู้ป่วยนอก", "ไม่ค้างคืน", "วันเดียวกลับ", "ใกล้บ้าน", "ทางไกล", "telemedicine", "ambulatory", "ods", "27 เท่า", "217"]],
    ["การดูแลภาวะเรื้อรัง (CCM / ICCC / ผู้ป่วยเป็นนักบิน)", ["เรื้อรัง", "จัดการตนเอง", "เชิงรุก", "ไตรภาคี", "นักบิน", "ccm", "iccc"]],
    ["การดูแลระยะยาว (LTC / สมรรถภาพ / ผู้ดูแล)", ["ระยะยาว", "ltc", "ดำเนินชีวิต", "พึ่งพิง", "ผู้ดูแล", "functional ability", "intrinsic capacity"]],
    ["การดูแลแบบประคับประคอง (Palliative Care / 4 มิติ / ACP / มาตรา 12)", ["ประคับประคอง", "palliative", "บรรเทาทุกข์", "วางแผนการดูแลล่วงหน้า", "acp", "มาตรา 12", "มอร์ฟีน", "โฮสปิซ", "hospice"]],

    // HS3: Desirable Characteristics (EQESaRR)
    ["คุณลักษณะที่พึงประสงค์ 6 ประการ (EQESaRR) และกรอบ Donabedian", ["eqesarr", "donabedian", "โครงสร้าง-กระบวนการ-ผลลัพธ์", "สัญญาณเตือนล่วงหน้า"]],
    ["ความเป็นธรรม vs ความเท่าเทียม (equity vs equality)", ["ความเป็นธรรม", "ความเท่าเทียม", "ตามความจำเป็น", "equity", "equality"]],
    ["กฎการดูแลสวนทางความจำเป็น (Inverse Care Law)", ["ต้องการการดูแลมาก", "สวนทางกับความจำเป็น", "inverse care", "ทิวดอร์ ฮาร์ต", "tudor hart"]],
    ["การคุ้มครองทางการเงินและค่าใช้จ่ายวิกฤต (CHE / OOP / Impoverishment)", ["คุ้มครองทางการเงิน", "หนักเกินกำลัง", "ยากจนลง", "ร้อยละ 40", "catastrophic", "che", "จ่ายเงินสด", "oop"]],
    ["กรอบคุณภาพ STEP และแบบจำลองแผ่นเนยแข็งสวิส (Swiss Cheese)", ["ความปลอดภัย", "ทันเวลา", "ประสิทธิผล", "ผู้ป่วยเป็นศูนย์กลาง", "เนยแข็งสวิส", "รูรั่ว", "เกือบพลาด", "near miss", "swiss cheese", "step"]],
    ["ความครอบคลุมอย่างมีประสิทธิผล (Effective Coverage: Need–Use–Quality)", ["ความครอบคลุมอย่างมีประสิทธิผล", "effective coverage", "need", "quality", "ควบคุมโรคได้จริง"]],
    ["ต้นทุนค่าเสียโอกาสและประสิทธิภาพ 3 ระดับ + HTA", ["ค่าเสียโอกาส", "opportunity cost", "เชิงเทคนิค", "เชิงการผลิต", "การจัดสรรทรัพยากร", "allocative", "technical", "hta"]],
    ["ธรรมาภิบาล ภาระรับผิดชอบต่อสังคม และความสอดคล้องกับบริบท", ["ธรรมาภิบาล", "ภาระรับผิดชอบต่อสังคม", "ชี้แจง", "ตรวจสอบ", "รู้ข้อมูลไม่เท่ากัน", "ผู้มอบหมาย", "principal-agent", "บริบท", "accountability", "stewardship", "relevance"]],
    ["ความยืดหยุ่นของระบบ 3 ระดับ (Absorptive–Adaptive–Transformative)", ["รองรับวิกฤต", "รองรับเบื้องต้น", "ปรับวิธีทำงาน", "ปฏิรูปโครงสร้าง", "absorptive", "adaptive", "transformative", "resilience", "ความยืดหยุ่น"]],

    // HS4: Health Behaviour & Health Promotion
    ["กฎบัตรออตตาวา 5 กลยุทธ์ (Ottawa Charter)", ["ออตตาวา", "นโยบายสาธารณะ", "สิ่งแวดล้อมที่เอื้อ", "ชุมชนเข้มแข็ง", "ทักษะส่วนบุคคล", "ปรับระบบบริการ", "ottawa"]],
    ["ระบบคิดแบบอัตโนมัติ vs ไตร่ตรอง (System 1 & 2) และ Nudge", ["อัตโนมัติ", "ไตร่ตรอง", "system 1", "system 2", "สะกิด", "nudge", "ตีกรอบ", "ค่าเริ่มต้น", "สถาปัตยกรรมทางเลือก", "mindspace", "kahneman"]],
    ["ตัวแบบ COM-B และวงล้อการปรับเปลี่ยนพฤติกรรม (BCW)", ["ความสามารถ", "โอกาส", "แรงจูงใจ", "com-b", "capability", "opportunity", "motivation", "bcw", "วงล้อ"]],
    ["ความรอบรู้ด้านสุขภาพระดับบุคคลและองค์กร + Teach-back", ["ความรอบรู้ด้านสุขภาพ", "health literacy", "ระดับองค์กร", "teach-back", "ทวนความเข้าใจ"]],

    // HS5: Primary Health Care & Primary Care
    ["ระบบสุขภาพปฐมภูมิ (PHC) vs บริการปฐมภูมิ (PC)", ["ระบบสุขภาพปฐมภูมิ", "ระบบบริการสุขภาพปฐมภูมิ", "บริการปฐมภูมิ", "ข้ามภาคส่วน", "มีส่วนร่วมของชุมชน", "อัลมา-อตา", "อัสตานา", "phc", "primary care", "alma-ata", "astana"]],
    ["คุณลักษณะบริการปฐมภูมิ 4 ประการ (Starfield 4Cs)", ["ด่านแรก", "ต่อเนื่อง", "ครอบคลุม", "ประสานงาน", "4cs", "starfield", "first contact", "continuity", "comprehensiveness", "coordination"]],

    // HS6: Health Insurance & Provider Payment
    ["การจ่ายล่วงหน้า การรวมกองทุน และการเฉลี่ยความเสี่ยง/เกลี่ยรายได้", ["จ่ายเงินล่วงหน้า", "จ่ายล่วงหน้า", "รวมกองทุน", "เฉลี่ยความเสี่ยง", "เกลี่ยรายได้", "กฎของจำนวนมาก", "prepayment", "pooling", "risk sharing"]],
    ["ตลาดประกันสมัครใจ vs ภาคบังคับ (Adverse Selection & Cream Skimming)", ["ภาคบังคับ", "สมัครใจ", "ความเสี่ยงสูงเข้าซื้อ", "คัดกรองความเสี่ยง", "เลือกคนแข็งแรง", "วงจรขาลง", "adverse selection", "cream skimming", "risk selection", "death spiral"]],
    ["สามกองทุนหลักของไทย (บัตรทอง ประกันสังคม สวัสดิการข้าราชการ)", ["บัตรทอง", "หลักประกันสุขภาพแห่งชาติ", "ประกันสังคม", "สวัสดิการข้าราชการ", "ucs", "sss", "csmbs"]],
    ["กลไกจ่ายเงินผู้ให้บริการ (FFS, Capitation, DRGs, Global Budget)", ["จ่ายตามรายการ", "เหมาจ่ายรายหัว", "กลุ่มวินิจฉัยโรคร่วม", "งบประมาณยอดรวม", "งบปลายปิด", "งบปลายเปิด", "เร่งทำแต้ม", "ให้รหัสสูงเกินจริง", "ลดบริการ", "ffs", "capitation", "drg", "adjrw", "global budget", "upcoding", "treadmill"]],
    ["Moral Hazard และ Supplier-Induced Demand (SID) + Gatekeeping", ["ผู้จ่ายแทน", "สั่งการตรวจรักษาเกิน", "สั่งบริการเกิน", "ร่วมจ่าย", "ด่านหน้า", "moral hazard", "sid", "gatekeeping", "co-payment"]],

    // ST1: Systems & Systems Thinking
    ["องค์ประกอบ ขอบเขต และบริบทของระบบ (Elements, Boundary & Contexts)", ["บริบท", "ขอบเขต", "การให้ความหมาย", "เวลาและสถานที่", "ปัจจัยนำเข้า", "context", "boundary", "meaning"]],
    ["ระบบยุ่งยาก vs ระบบซับซ้อนที่ปรับตัวได้ (Complicated vs CAS)", ["ระบบยุ่งยาก", "ระบบซับซ้อน", "ไม่เป็นเส้นตรง", "จัดการตัวเอง", "ผุดบังเกิด", "ความน่าจะเป็น", "เงื่อนไขเกื้อหนุน", "complicated", "complex adaptive", "nonlinear", "emergent", "enabling"]],
    ["ความไม่แน่นอนและความเข้าใจที่ตรงกันในคลินิก", ["ความไม่แน่นอน", "ความเข้าใจไม่ตรงกัน", "ความเข้าใจร่วมกัน", "รับฟังความกังวล", "สับสนวุ่นวาย", "chaotic", "uncertainty"]],
    ["วงจรอุบาทว์และผลลัพธ์ที่ไม่ได้ตั้งใจ (Vicious Cycle & Unintended Consequences)", ["วงจรอุบาทว์", "ผลลัพธ์ที่ไม่ได้ตั้งใจ", "ผลลัพธ์ไม่ตั้งใจ", "ห้องฉุกเฉิน", "ดึงงบ", "ปฐมภูมิ", "vicious cycle", "unintended"]],
    ["แบบจำลองภูเขาน้ำแข็ง 4 ระดับ และ Systems vs Systematic Thinking", ["ภูเขาน้ำแข็ง", "เหตุการณ์", "แนวโน้ม", "โครงสร้างระบบ", "กรอบความคิด", "คิดเชิงระบบ", "คิดอย่างเป็นระบบ", "คิดเป็นขั้นตอน", "iceberg", "mental model", "systems thinking", "systematic thinking"]],

    // Table Spec Competency Precision Concepts (HS1–HS6)
    ["การแยก 'ภาวะสุขภาพที่เป็นอยู่ (Health Status)' ออกจาก 'ปัจจัยที่ส่งผลกระทบ (+/-)'", ["ภาวะสุขภาพ", "health status", "ปัจจัยที่ส่งผล", "เหตุการณ์ที่ส่งผล", "ทางบวก", "ทางลบ", "แยกออก"]],
    ["แผนภาพปัจจัยกำหนดสุขภาพ 4 หมวด และบทบาทแพทย์ (Clinician · Manager · Promoter)", ["สี่หมวด", "4 หมวด", "สองทิศทาง", "ปรับเปลี่ยนไม่ได้", "ปรับเปลี่ยนได้", "clinician", "manager", "promoter", "พีระมิด", "frieden"]],
    ["กฎจำแนกการป้องกันโรคตามกลุ่มเป้าหมายและระยะของโรค (Stage-Specific Prevention)", ["กลุ่มเป้าหมาย", "ระยะของโรค", "ระยะดำเนินโรค", "ค้นหาระยะแรก", "บำบัดรักษาทันที", "early detection", "prompt intervention", "ตรวจหว่าน", "over-testing"]],
    ["การวินิจฉัยโรงพยาบาลครบ 6 Building Blocks (Gatekeeper · Burnout/Task-shifting · HIS · Cold chain · Autonomy)", ["gatekeeper", "nurse-led", "task-shifting", "interoperability", "กรอกข้อมูลซ้ำ", "ลูกโซ่ความเย็น", "cold chain", "งบลงทุน", "autonomy", "อิสระ", "ระเบียบส่วนกลาง"]],
    ["ความสอดคล้อง WHAT · WHY · HOW และภาวะละเลยการดูแลตนเองรุนแรง (Severe Self-Neglect)", ["ละเลยการดูแลตนเอง", "self-neglect", "ไม่กินน้ำ", "ไม่ดื่มน้ำ", "สัญญาณชีพปกติ", "stabilization", "guiding principle", "activated patient", "หุ้นส่วน", "partnership", "two-way referral"]],
    ["โครงสร้างการวิเคราะห์หลัก–ย่อย (Main → Sub → นิยามทฤษฎี → หลักฐาน) & มิติย่อย Accessibility", ["คุณลักษณะหลัก", "คุณลักษณะย่อย", "องค์ประกอบหลัก", "องค์ประกอบย่อย", "คำจำกัดความ", "ใบส่งตัว", "financial accessibility", "administrative accessibility", "geographical accessibility", "equity in quality"]],
    ["ความยั่งยืนด้านการคลังและกำลังคน (Sustainability) & การชั่งน้ำหนัก Trade-offs", ["ความยั่งยืน", "sustainability", "แลกได้แลกเสีย", "trade-off", "ธรรมนูญ", "โรคร่วม", "comorbidities", "แยกส่วนเฉพาะโรค"]],
    ["การแยกพฤติกรรมเป้าหมายที่สังเกตได้ (Target Behavior) ออกจากผลลัพธ์ทางคลินิก (Health Outcome)", ["พฤติกรรมเดิม", "พฤติกรรมเป้าหมาย", "problem behavior", "target behavior", "สังเกตเห็นได้", "ไม่ใช่ผลลัพธ์", "ผลลัพธ์ทางคลินิก", "health outcome", "kasl", "sick-role"]],
    ["ปัจจัยกำหนดสุขภาพเชิงพาณิชย์ (CDoH) และ 6 องค์ประกอบย่อยของ COM-B", ["เชิงพาณิชย์", "cdoh", "ตลาดรับซื้อ", "c-ph", "c-ps", "o-ph", "o-so", "m-re", "m-au", "self-efficacy", "รวมกลุ่ม", "อำนาจต่อรอง", "กลัวขาดทุน"]],
    ["ยุทธศาสตร์ Advocate · Mediate · Enable สู่ปฏิญญาเซี่ยงไฮ้และกฎบัตรเจนีวา", ["advocate", "mediate", "enable", "ชี้นำ", "ไกล่เกลี่ย", "เสริมพลัง", "เซี่ยงไฮ้", "เจนีวา", "well-being societies"]],
    ["วงจรป่วยซ้ำ (Revolving-Door Readmission), บ้านพักพิงพักฟื้น (Medical Respite) และ Coordination Hub", ["ป่วยซ้ำ", "นอนโรงพยาบาลซ้ำ", "readmission", "hospital-centrism", "บ้านพักพิง", "พักฟื้น", "respite", "บัตรประชาชน", "ศูนย์กลางเชื่อมประสาน", "coordination hub", "person-centeredness"]],
    ["ปฏิญญาแอสทานา 3 เสาหลัก (EPHFs · นโยบายข้ามภาคส่วน · การเสริมพลังชุมชน) & การถ่ายโอน รพ.สต.", ["หน้าที่ด้านสาธารณสุขที่จำเป็น", "ephfs", "multisectoral", "empowered people", "เสริมพลังประชาชน", "ทีมหมอครอบครัว", "2562", "ถ่ายโอน", "อบจ."]],
    ["สมมติฐานประกันสมัครใจ 5 ข้อ (p < 1) · SDG 3.8.1–3.8.2 & ลูกบาศก์ UHC 3 แกน (X · Z · Y)", ["p < 1", "p เข้าใกล้ 1", "p → 1", "non-covariate", "sdg 3.8", "3.8.1", "3.8.2", "uhc cube", "ลูกบาศก์", "แกน x", "แกน y", "แกน z", "ชุดสิทธิประโยชน์"]],
    ["ข้อยกเว้นประกันเอกชน (Positive Externalities · PrEP/PEP) & ประกันสังคม มาตรา 40 (≥300 บาท/เดือน)", ["ผลกระทบภายนอก", "externalities", "prep", "pep", "มาตรา 40", "ม.40", "300 บาท", "5 กรณี", "บำเหน็จชราภาพ", "สงเคราะห์บุตร", "แรงงานนอกระบบ"]],
    ["การจ่ายตามผลงาน (P4P) บนฐาน FFS เทียบกับ Inclusive Capitation & การจ่ายแบบผสมผสาน", ["pay for performance", "p4p", "inclusive capitation", "under-provision", "ต่ำกว่าเกณฑ์", "อัตราจ่าย", "มากเพียงพอ", "ปิดช่องว่าง", "blended payment", "จัดซื้อบริการเชิงยุทธศาสตร์", "strategic purchasing"]],
  ];

  function extractKeyConceptsFromText(plainText, rawHtml) {
    const concepts = [];
    const seen = new Set();

    const addConcept = (label, altTokens = []) => {
      const cleanLabel = String(label || "")
        .replace(/^[\d.)\s•\-–:]+/, "")
        .replace(/[\s.,;:]+$/, "")
        .trim();
      if (!cleanLabel || cleanLabel.length < 3 || cleanLabel.length > 78) return;
      if (STOP_PHRASES.has(cleanLabel)) return;
      const key = cleanLabel.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      const tokens = [
        key,
        ...altTokens.map((t) => String(t || "").toLowerCase().trim()).filter((t) => t.length >= 2),
      ];
      const parenM = cleanLabel.match(/^(.+?)\s*\(([^)]+)\)$/);
      if (parenM) {
        const p1 = parenM[1].trim().toLowerCase();
        const p2 = parenM[2].trim().toLowerCase();
        if (p1.length >= 3) tokens.push(p1);
        if (p2.length >= 2) tokens.push(p2);
      }
      concepts.push({ label: cleanLabel, tokens: [...new Set(tokens)] });
    };

    // 1. First prioritize canonical DOMAIN_TERMS that ACTUALLY appear in this specific answer!
    const pLow = String(plainText || "").toLowerCase();
    for (const [label, toks] of DOMAIN_TERMS) {
      if (toks.some((t) => pLow.includes(t.toLowerCase()))) {
        addConcept(label, toks);
      }
    }

    // 2. Extract "Thai phrase (English term)" pairs from this answer
    const pairRe = /([ก-๙][ก-๙\s\-–/]{2,40}?)\s*\(([A-Za-z][A-Za-z0-9\s\-–/&:.]{1,42})\)/g;
    let pm;
    while ((pm = pairRe.exec(plainText)) !== null) {
      const th = pm[1].trim().split(/\s+/).slice(-3).join(" ");
      const en = pm[2].trim();
      if (!/^\d{4}$/.test(en) && !en.toLowerCase().includes("et al")) {
        // Avoid duplicating an already-added domain concept sharing the same English term
        const enLow = en.toLowerCase();
        if (!concepts.some((c) => c.tokens.includes(enLow))) {
          addConcept(`${th} (${en})`, [th, en]);
        }
      }
    }

    // 3. Extract <strong>...</strong> anchors from HTML only if not redundant
    if (rawHtml && concepts.length < 6) {
      const strongRe = /<(?:strong|b)\b[^>]*>(.*?)<\/(?:strong|b)>/gi;
      let m;
      while ((m = strongRe.exec(rawHtml)) !== null) {
        const st = stripTags(m[1]);
        if (!st || STOP_PHRASES.has(st) || st.length < 4 || st.length > 60) continue;
        if (/^(?:แนวคำตอบ|คำตอบ|ตัวอย่าง|ส่วนที่|ข้อที่|ประเด็น)/.test(st)) continue;
        const stLow = st.toLowerCase();
        if (!concepts.some((c) => c.tokens.some((t) => stLow.includes(t) || t.includes(stLow)))) {
          addConcept(st);
        }
      }
    }

    return concepts.slice(0, 7);
  }

  // Case characters / named entities to track coverage specifically
  const CASE_ENTITY_PATTERNS = [
    { label: "บุคคล ก", re: /บุคคล\s*ก(?!\S)/ },
    { label: "บุคคล ข", re: /บุคคล\s*ข(?!\S)/ },
    { label: "บุคคล ค", re: /บุคคล\s*ค(?!\S)/ },
    { label: "บุคคล ง", re: /บุคคล\s*ง(?!\S)/ },
    { label: "บุคคล จ", re: /บุคคล\s*จ(?!\S)/ },
    { label: "เด็กคนที่หนึ่ง", re: /เด็กคนที่(?:หนึ่ง|1)/ },
    { label: "เด็กคนที่สอง", re: /เด็กคนที่(?:สอง|2)/ },
    { label: "ผู้รับบริการรายที่ 1", re: /ผู้รับบริการ(?:รายที่)?\s*1/ },
    { label: "ผู้รับบริการรายที่ 2", re: /ผู้รับบริการ(?:รายที่)?\s*2/ },
    { label: "ผู้รับบริการรายที่ 3", re: /ผู้รับบริการ(?:รายที่)?\s*3/ },
    { label: "ผู้รับบริการรายที่ 4", re: /ผู้รับบริการ(?:รายที่)?\s*4/ },
    { label: "ผู้ป่วยรายที่ 3", re: /ผู้ป่วย(?:รายที่)?\s*3/ },
    { label: "WHO (องค์การอนามัยโลก)", re: /องค์การอนามัยโลก|\bwho\b/i },
    { label: "พ.ร.บ. สุขภาพแห่งชาติ พ.ศ. 2550", re: /พ\.?ร\.?บ\.?\s*สุขภาพ|พระราชบัญญัติสุขภาพ|2550/ },
    { label: "Bircher", re: /bircher|เบอร์เชอร์/i },
    { label: "Huber", re: /huber|ฮูเบอร์/i },
    { label: "Starfield (4Cs)", re: /starfield|4cs?|ด่านแรก.*ต่อเนื่อง/i },
    { label: "Ottawa Charter", re: /ottawa|ออตตาวา/i },
    { label: "COM-B", re: /com-?b|ความสามารถ.*โอกาส.*แรงจูงใจ/i },
  ];

  function detectCaseEntityCoverage(studentText, answerPlain, promptPlain) {
    const expected = [];
    const matched = [];
    const missed = [];
    const combinedRef = `${promptPlain} ${answerPlain}`;
    for (const ent of CASE_ENTITY_PATTERNS) {
      if (ent.re.test(answerPlain) && (ent.re.test(combinedRef))) {
        expected.push(ent.label);
        if (ent.re.test(studentText)) matched.push(ent.label);
        else missed.push(ent.label);
      }
    }
    return { expected, matched, missed };
  }

  /** Detect targeted conceptual misconceptions & polarity contradictions grounded in HS1–HS6 */
  function detectMisconceptions(studentText, rubric) {
    const issues = [];
    const u = String(studentText || "").toLowerCase();
    const p = String((rubric && rubric.prompt) || "").toLowerCase();
    const a = stripTags((rubric && rubric.answerHtml) || "").toLowerCase();

    // 1. Error-correction statements (HS1-WB กิจกรรมบูรณาการที่ 1: hs1_wb_q_21..26) where prompt is a FALSE claim
    const isFalseStatementPrompt =
      /^hs1_wb_q_(21|22|23|24|25|26)$/.test((rubric && rubric.id) || "") ||
      ((a.includes("มิใช่") || a.includes("ไม่ได้หมายความว่า")) && !/[?]|อย่างไร|เหตุใด|หรือไม่|คืออะไร|ยกตัวอย่าง|อธิบาย|พิจารณา/.test(p));

    if (isFalseStatementPrompt) {
      const agrees = /^(?:ใช่|ถูก|ถูกต้อง|จริง|เห็นด้วย|yes|true)(?:[\s.,]|$)/.test(u.trim());
      const refutes = /ไม่จริง|ไม่ใช่|ไม่ถูกต้อง|คลาดเคลื่อน|ผิด|ไม่ได้หมายความว่า|มิใช่|ไม่เสมอไป|แต่(?:เป็น|หมายถึง|มุ่ง)/.test(u);
      if (agrees && !refutes) {
        issues.push(
          "ข้อความในโจทย์เป็น **ข้อความที่คลาดเคลื่อน (false statement)** — ลองทบทวนใหม่ว่าจุดใดในประโยคที่ขัดแย้งกับหลักการในเนื้อหาประกอบคำสอน"
        );
      }
    }

    // 2. Claiming disease/illness/sickness are the SAME group when answer explicitly says NOT the same group
    if (a.includes("ไม่ใช่บุคคลกลุ่มเดียวกัน") || a.includes("แยกจากกัน")) {
      const saysSame = /(?:เป็น(?:บุคคล)?กลุ่มเดียวกัน|คนเดียวกัน|กลุ่มเดียวกันหมด)/.test(u);
      const saysNotSame = /(?:ไม่(?:ใช่|ได้เป็น)(?:บุคคล)?กลุ่มเดียวกัน|ต่างกลุ่ม|คนละกลุ่ม|แยกจากกัน|ไม่เหมือนกัน)/.test(u);
      if (saysSame && !saysNotSame) {
        issues.push(
          "จุดสำคัญที่ยังคลาดเคลื่อน: คำตอบทั้งสามข้อ **ไม่ใช่บุคคลกลุ่มเดียวกัน** เพราะความผิดปกติที่ตรวจพบ (**โรค / disease**), ความรู้สึกไม่สบาย (**การเจ็บป่วย / illness**), และความต้องการการรับรองจากสังคม (**sickness**) เกิดขึ้นแยกจากกันได้ (เช่น บุคคล ก มีโรคแต่ไม่รู้สึกป่วย ส่วนบุคคล ข รู้สึกป่วยแต่ผลเลือดปกติ)"
        );
      }
    }

    // 3. Conflating "no disease" with "no illness"
    if (a.includes("ไม่ได้หมายความว่าไม่มีการเจ็บป่วย") && /ไม่มีโรค.{0,18}(?:จึง|เลย|ก็).{0,12}ไม่(?:ป่วย|มีการเจ็บป่วย)/.test(u) && !/ไม่ได้หมายความว่า|แต่|ไม่จริง|คลาดเคลื่อน/.test(u)) {
      issues.push(
        "จุดที่ยังคลาดเคลื่อน: การตรวจไม่พบ **โรค (disease)** ไม่ได้แปลว่าไม่มี **การเจ็บป่วย (illness)** เพราะบุคคล ข ยังรู้สึกอ่อนเพลียและนอนไม่หลับจริง แม้ผลตรวจเลือดปกติ"
      );
    }

    // 4. Swapping false negative vs false positive between Secondary and Quaternary prevention
    if ((a.includes("ผลลบลวง") || a.includes("ผลบวกลวง")) && (p.includes("ระดับที่สอง") || p.includes("ระดับที่สี่"))) {
      const swappedSec = /ระดับ(?:ที่)?(?:สอง|2).{0,24}(?:ลด|ระวัง|ป้องกัน).{0,14}(?:ผลบวกลวง|false positive)/.test(u);
      const swappedQuat = /ระดับ(?:ที่)?(?:สี่|4).{0,24}(?:ลด|ระวัง|ป้องกัน).{0,14}(?:ผลลบลวง|false negative)/.test(u);
      if (swappedSec || swappedQuat) {
        issues.push(
          "ระวังสลับชนิดความคลาดเคลื่อนของผลตรวจ: **การป้องกันระดับที่สอง (secondary)** มุ่งลด **ผลลบลวง (false negative)** เพื่อไม่ให้พลาดคนป่วยจริง ส่วน **การป้องกันระดับที่สี่ (quaternary)** มุ่งลด **ผลบวกลวง (false positive)** เพื่อไม่ให้คนปกติถูกวินิจฉัยหรือรักษาเกินจำเป็น"
        );
      }
    }

    // 5. Misinterpreting Quaternary prevention as "never test anyone"
    if (a.includes("มิใช่การปฏิเสธการตรวจทั้งหมด") && /ไม่ตรวจ(?:เลย|ใด\s*ๆ|ทั้งหมด)/.test(u) && !/มิใช่|ไม่ใช่|ไม่ได้แปลว่า|หลีกเลี่ยง.{0,18}เกินจำเป็น/.test(u)) {
      issues.push(
        "ข้อควรระวัง: **การป้องกันระดับที่สี่ (quaternary prevention)** มิใช่การปฏิเสธการตรวจทั้งหมด แต่คือการหลีกเลี่ยงการตรวจ/รักษาที่**เกินจำเป็น** โดยรับฟังความกังวล อธิบายประโยชน์-ผลเสีย และตัดสินใจร่วมกัน (shared decision-making)"
      );
    }

    // 6. Conflating Equity with Equality
    if (a.includes("ความเป็นธรรม") && a.includes("ความเท่าเทียม")) {
      if (/ความเป็นธรรม.{0,16}(?:คือ|หมายถึง).{0,18}(?:ให้ทุกคนเท่ากัน|เท่ากันหมด)/.test(u) && !/ความจำเป็น|ต่างกัน|ไม่เท่ากัน/.test(u)) {
        issues.push(
          "ระวังสับสนระหว่าง **ความเป็นธรรม (equity)** กับ **ความเท่าเทียม (equality)**: ความเท่าเทียมคือให้ทุกคนเท่ากันหมด แต่ความเป็นธรรมคือการจัดสรร**ตามความจำเป็นทางสุขภาพ** เพื่อให้กลุ่มเปราะบางเข้าถึงโอกาสทางสุขภาพได้ทัดเทียมกัน"
        );
      }
    }

    // 7. Saying Bishai study found health services had NO role
    if (a.includes("ราวครึ่งหนึ่ง") && /แทบไม่มีบทบาท|ไม่มีผล|ไม่สำคัญ/.test(u) && !/ไม่ใช่|มิใช่|คลาดเคลื่อน|ครึ่ง/.test(u)) {
      issues.push(
        "ข้อควรตรวจสอบจากงานวิจัย Bishai และคณะ (146 ประเทศ): ราวครึ่งหนึ่งของการลดการเสียชีวิตมารดาและเด็กมาจาก**การพัฒนาในภาคสุขภาพ** และอีกราวครึ่งหนึ่งมาจากนอกภาคสุขภาพ ระบบบริการสุขภาพจึงมีบทบาทสำคัญมาก แต่มิใช่ปัจจัยเดียว"
      );
    }

    // 8. Table Spec Trap (HS1): Classifying lifestyle/exercise in ALREADY-DIAGNOSED patients as Primary instead of Tertiary Prevention
    if (p.includes("โครงการปรับอาหาร") && p.includes("คนละระดับ") && /(?:วินิจฉัย|ความดัน|ไขมัน).{0,28}(?:เป็น|จัดเป็น)\s*(?:primary|ระดับ(?:ที่)?\s*1|ปฐมภูมิ)/.test(u) && !/tertiary|ตติยภูมิ|ระดับ(?:ที่)?\s*3/.test(u)) {
      issues.push(
        "ระวังกับดักการจำแนกระดับการป้องกันโรค: โครงการปรับอาหารและออกกำลังกายใน**ผู้ป่วยที่ได้รับการวินิจฉัยโรคแล้ว** มุ่งคุมโรคและลดภาวะแทรกซ้อน จึงจัดเป็น **Tertiary Prevention** (ไม่ใช่ Primary Prevention ซึ่งทำในผู้ที่ยังไม่เกิดโรค)"
      );
    }

    // 9. Table Spec Trap (HS2): Putting severe self-neglect with normal vital signs into Ambulatory Care instead of inpatient Acute Care
    if (p.includes("สัญญาณชีพยังปกติ") && /(?:ควร|จัดเข้า|เลือก)\s*(?:ambulatory|ผู้ป่วยนอก|opd)/.test(u) && !/ห้าม|ไม่ใช่|ไม่ควร|acute care|ผู้ป่วยใน|ipd/.test(u)) {
      issues.push(
        "ระวังกับดัก 'สัญญาณชีพปกติ' ใน HS2: ผู้ป่วยที่มีภาวะละเลยการดูแลตนเองอย่างรุนแรง (**Severe self-neglect** เช่น ไม่ดื่มน้ำและไม่กินอาหารหลายวัน) เสี่ยงต่ออันตรายคุกคามชีวิตและเกินขีดความสามารถของบ้าน จึง**ต้องเลือก Acute Care ในหอผู้ป่วยใน (IPD)** ไม่ใช่ Ambulatory Care"
      );
    }

    // 10. Table Spec Trap (HS4): Writing a lab/clinical outcome as Target Behavior
    if (p.includes("พฤติกรรมเป้าหมาย") && /(?:พฤติกรรมเป้าหมาย|target behavior)\s*(?:คือ|ได้แก่)\s*(?:ค่า|ระดับ)?(?:สารพิษ|สารเคมี|น้ำตาล|hba1c|ความดัน).{0,18}ลดลง/.test(u) && !/ไม่ใช่|ห้าม|ผลลัพธ์/.test(u)) {
      issues.push(
        "ระวังกับดักอันดับ 1 ของ HS4: ค่าผลเลือดหรือระดับสารเคมีที่ลดลงเป็น **ผลลัพธ์ทางคลินิก (Health outcome)** ไม่ใช่พฤติกรรม — **Target Behavior** ต้องระบุเป็นกริยาการกระทำของกลุ่มเป้าหมายที่สังเกตเห็นได้จริง"
      );
    }

    // 11. Table Spec Trap (HS5): Swapping Continuity (Medical Respite post-discharge) with Coordination (cross-sector hub)
    if (p.includes("medical respite") && /บ้านพักพิง.{0,28}(?:เป็น|ตรงกับ|สะท้อน)\s*(?:coordination|การประสาน)/.test(u) && !/continuity|ความต่อเนื่อง/.test(u)) {
      issues.push(
        "ระวังสลับคู่ใน HS5: **บ้านพักพิงทางการแพทย์ระยะพักฟื้นหลังออกจาก รพ. (Medical Respite Care)** มุ่งดูแลต่อเนื่องข้ามรอยต่อเพื่อสกัดการป่วยซ้ำ จึงตรงกับ **Continuity of Care** ส่วนการเป็นตัวกลางเชื่อม รพ. กับหน่วยงานบัตรประชาชน–อาชีพ–ที่อยู่อาศัย จึงตรงกับ **Coordination of Care**"
      );
    }

    // 12. Table Spec Trap (HS6): Wrong Social Security section or wrong Section 40 contribution tier for informal workers needing all 5 benefits
    if (p.includes("แรงงานนอกระบบ") && p.includes("5 กรณี")) {
      if (/(?:มาตรา|ม\.)\s*(?:33|39)/.test(u) && !/(?:มาตรา|ม\.)\s*40/.test(u)) {
        issues.push(
          "ตรวจสอบมาตราประกันสังคมอีกครั้ง: มาตรา 33 สำหรับลูกจ้างในระบบ และมาตรา 39 สำหรับผู้เคยอยู่ ม.33 — สำหรับ**แรงงานนอกระบบ/อาชีพอิสระ** ต้องสมัครภาคสมัครใจตาม **มาตรา 40 (ทางเลือกสมทบไม่น้อยกว่า 300 บาท/เดือน)** โดยไม่เสียสิทธิบัตรทอง"
        );
      } else if (/(?:70|100)\s*บาท/.test(u) && !/300/.test(u)) {
        issues.push(
          "ตรวจสอบอัตราเงินสมทบมาตรา 40 อีกครั้ง: ทางเลือก 70 บาทคุ้มครอง 3 กรณี และ 100 บาทคุ้มครอง 4 กรณี — หากต้องการครบทั้ง **5 กรณี (รวมบำเหน็จชราภาพและสงเคราะห์บุตร)** ต้องเลือกทางเลือกสมทบ **ไม่น้อยกว่า 300 บาท/เดือน**"
        );
      }
    }

    return issues;
  }

  function buildStarterScaffold(rubric, teachingCtx) {
    const p = (rubric && rubric.prompt) || "";
    const aPlain = stripTags((rubric && rubric.answerHtml) || "");
    const concepts = extractKeyConceptsFromText(aPlain, rubric && rubric.answerHtml);
    const entCov = detectCaseEntityCoverage("", aPlain, p);

    // Special tailored starter frame for multi-question vignette prompts like hs1_wb_bq_6
    if (p.includes("สามคำถาม") && p.includes("บุคคลกลุ่มเดียวกันหรือไม่")) {
      return (
        "ลองอ่านกรณี **บุคคล ก–ง** ด้านบนอีกครั้ง แล้วเริ่มเขียนสั้น ๆ ตามโครงนี้ได้เลย: " +
        "“1) ตรวจพบความผิดปกติ: บุคคล … / 2) รู้สึกไม่สบาย: บุคคล … / 3) ต้องการใบรับรองแพทย์: บุคคล … สรุปว่าทั้งสามข้อเป็น/ไม่ใช่กลุ่มเดียวกัน เพราะ…”"
      );
    }
    if (entCov.expected.length >= 2) {
      return (
        `ลองตั้งต้นจากกรณีศึกษาในหัวข้อนี้ โดยระบุทีละกรณี (${entCov.expected.slice(0, 4).join(", ")}) ` +
        `พร้อมเชื่อมโยงกับประเด็นสำคัญในเนื้อหาคำสอน (${concepts.slice(0, 2).map((c) => `**${c.label}**`).join(" และ ") || teachingCtx.groundingLabel})`
      );
    }
    if (/ต่างกันอย่างไร|เปรียบเทียบ/.test(p)) {
      return (
        "ลองเริ่มเขียนแบบเทียบสองฝั่งสั้น ๆ ด้วยโครงประโยค: " +
        `“ฝั่งแรกมุ่งเน้นเรื่อง… ขณะที่ฝั่งที่สองมุ่งเน้นเรื่อง… ซึ่งแตกต่างกันตรงที่…”` +
        (concepts.length ? ` (คำสำคัญตั้งต้นจากเนื้อหา: ${concepts.slice(0, 2).map((c) => `**${c.label}**`).join(", ")})` : "")
      );
    }
    if (/^hs1_wb_q_(21|22|23|24|25|26)$/.test((rubric && rubric.id) || "")) {
      return (
        "ข้อนี้เป็นโจทย์จับผิดข้อความที่คลาดเคลื่อน ลองเริ่มเขียนว่า: " +
        "“ข้อความนี้คลาดเคลื่อนตรงที่… ที่ถูกต้องตามเนื้อหาคำสอนคือ…”"
      );
    }
    if (concepts.length > 0) {
      return (
        `ลองเริ่มพิมพ์คำตอบสั้น ๆ 2–3 ประโยคด้วยภาษาของตนเอง โดยชวนคิดเชื่อมโยงกับแนวคิด ` +
        `${concepts.slice(0, 2).map((c) => `**${c.label}**`).join(" และ ")} ใน ${teachingCtx.groundingLabel}`
      );
    }
    return `ลองสรุปความคิดเห็นของตนเองสั้น ๆ 2–3 ประโยคเทียบกับเนื้อหาใน ${teachingCtx.groundingLabel} แล้วกดส่งอีกครั้งเพื่อรับคำแนะนำเฉพาะบุคคล`;
  }

  function buildSocraticFollowUp(rubric, teachingCtx, verdict, matchedConcepts, missedConcepts) {
    const mod = teachingCtx.moduleCode;
    if (verdict === "gibberish" || verdict === "keyboard_layout_typo" || verdict === "non_answer" || verdict === "empty" || verdict === "prompt_copy") {
      if (mod === "HS1") {
        return "หากคุณเป็นแพทย์เวรที่พบผู้ป่วยซึ่งผลตรวจปกติแต่ยืนยันว่านอนไม่หลับมา 1 เดือน คุณจะเริ่มต้นถามคำถามแรกกับเขาว่าอย่างไร?";
      }
      if (mod === "HS2") {
        return "ลองนึกถึงผู้ป่วย 1 รายที่คุณเคยพบในโรงพยาบาล — มีองค์ประกอบใดนอกเหนือจากแพทย์และยาที่กำหนดว่าผู้ป่วยรายนั้นจะหายดีหรือไม่?";
      }
      if (mod === "HS3") {
        return "ในมุมมองของประชาชน ระบบบริการที่ “รักษาเก่ง” แต่ทำให้ครอบครัวผู้ป่วยล้มละลายจากค่ารักษา ถือเป็นระบบสุขภาพที่ดีพอหรือยัง?";
      }
      if (mod === "HS4") {
        return "เหตุใดการให้ความรู้ด้านสุขภาพเพียงอย่างเดียวจึงมักไม่พอที่จะทำให้คนเปลี่ยนพฤติกรรมระยะยาวได้จริง?";
      }
      if (mod === "HS5") {
        return "หากแพทย์ประจำคลินิกปฐมภูมิรู้จักผู้ป่วยและครอบครัวต่อเนื่องหลายปี การดูแลจะต่างจากการเจอแพทย์เวรแบบครั้งเดียวจบอย่างไร?";
      }
      if (mod === "HS6") {
        return "หากโรงพยาบาลถูกจ่ายเงินแบบเหมาจ่ายรายหัวเทียบกับจ่ายตามรายการ แรงจูงใจต่อการสั่งตรวจรักษาจะเปลี่ยนไปในทิศทางใด?";
      }
      return "ลองตั้งต้นจากประสบการณ์จริง 1 เหตุการณ์ที่เชื่อมโยงกับโจทย์ข้อนี้ แล้วเขียนเหตุผลสั้น ๆ ด้วยภาษาของตนเอง";
    }

    if (missedConcepts && missedConcepts.length > 0) {
      return `หากนำแนวคิด <strong>${escapeHtml(missedConcepts[0].label)}</strong> เข้ามาพิจารณาร่วมกับคำตอบเดิมของคุณ ข้อสรุปหรือแนวทางปฏิบัติของแพทย์จะรอบด้านขึ้นอย่างไร?`;
    }
    if (mod === "HS1") {
      return "หากผู้เรียนต้องอธิบายประเด็นนี้ให้ผู้ป่วยหรือครอบครัวเข้าใจในห้องตรวจจริงภายใน 1 นาที จะเลือกใช้คำพูดแบบใดให้เข้าใจง่ายและไม่ทำให้ผู้ป่วยรู้สึกถูกตัดสิน?";
    }
    if (mod === "HS2") {
      return "หากเกิดการเปลี่ยนแปลงในหนึ่งองค์ประกอบของระบบสุขภาพตามกรณีนี้ คุณคาดว่าจะเกิดผลสะท้อนกลับ (feedback) ไปยังส่วนอื่นของระบบอย่างไร?";
    }
    if (mod === "HS3") {
      return "ในฐานะแพทย์ที่ทำงานในโรงพยาบาลชุมชน คุณจะสังเกต “สัญญาณเตือนล่วงหน้า” ใดที่บ่งชี้ว่าคุณลักษณะข้อนี้กำลังบกพร่องก่อนที่จะเกิดผลเสียหายต่อผู้ป่วย?";
    }
    if (mod === "HS4") {
      return "หากต้องออกแบบมาตรการในชุมชนจริง คุณจะผสมผสานการปรับสิ่งแวดล้อม (Opportunity) กับแรงจูงใจ (Motivation) อย่างไรโดยไม่พึ่งการให้ความรู้เพียงอย่างเดียว?";
    }
    if (mod === "HS5") {
      return "บทบาทของแพทย์และทีมสหวิชาชีพปฐมภูมิควรเชื่อมโยงกับชุมชนและภาคส่วนนอกสาธารณสุขอย่างไรเพื่อให้เกิดผลลัพธ์ด้านสุขภาพที่ยั่งยืน?";
    }
    if (mod === "HS6") {
      return "หากต้องออกแบบกลไกการจ่ายเงินเพื่อลดทั้งการใช้บริการเกินจำเป็นและการปฏิเสธผู้ป่วยอาการหนัก ควรผสมผสานกลไกใดร่วมกันและมีระบบกำกับอย่างไร?";
    }
    return "ลองเชื่อมโยงคำตอบนี้กับบริบทการทำงานของแพทย์ในระบบสุขภาพไทย — อะไรคือความท้าทายสำคัญที่สุดเมื่อนำไปปฏิบัติจริง?";
  }

  /* ---------- Built-In Zero-Setup Deep Grounded Evaluator ---------- */
  function evaluateLocally(rubric, submission, precomputedCtx) {
    const teachingCtx = precomputedCtx || extractTeachingContext(rubric);
    const didWell = [];
    const needsAttention = [];
    const canImprove = [];

    /* --- 1. Fillable Table Evaluation --- */
    if (rubric.kind === "table") {
      const cells = (submission && submission.cells) || {};
      const headers = rubric.headers || [];
      const qRows = rubric.rows || [];
      const aRows = rubric.answerRows || null;

      let totalFillable = 0;
      let filledCount = 0;
      let gibberishCount = 0;
      const cellFeedbackMap = {};
      const correctRowLabels = [];
      const gibberishDetails = [];
      const mismatchDetails = [];
      const partialDetails = [];
      const emptyRowLabels = [];

      qRows.forEach((rCells, rIdx) => {
        const rowLabel = rCells[0] || `แถวที่ ${rIdx + 1}`;
        let rowHasEmpty = false;
        let rowAllGood = true;
        let rowCheckedAny = false;

        rCells.forEach((origVal, cIdx) => {
          if (cIdx === 0 || (origVal && origVal.trim() !== "")) return;
          totalFillable++;
          const key = `${rIdx}_${cIdx}`;
          const uVal = (cells[key] || "").trim();
          const colName = headers[cIdx] || `ช่องที่ ${cIdx}`;

          if (!uVal) {
            rowHasEmpty = true;
            rowAllGood = false;
            cellFeedbackMap[key] = "empty";
            return;
          }
          filledCount++;

          const expVal = aRows && aRows[rIdx] && aRows[rIdx][cIdx] !== undefined ? aRows[rIdx][cIdx] : "";
          const res = matchCellValue(uVal, expVal, rubric, teachingCtx);
          cellFeedbackMap[key] = res.status;

          if (res.status === "gibberish") {
            rowAllGood = false;
            gibberishCount++;
            gibberishDetails.push(
              `<strong>${escapeHtml(rowLabel)} (${escapeHtml(colName)})</strong>: ข้อความ <code>${escapeHtml(uVal)}</code> ดูเหมือนพิมพ์สุ่ม/ไม่เป็นคำที่มีความหมาย กรุณาพิมพ์คำตอบจริง`
            );
          } else if (expVal) {
            rowCheckedAny = true;
            if (res.status === "mismatch") {
              rowAllGood = false;
              mismatchDetails.push(
                `<strong>${escapeHtml(rowLabel)} (${escapeHtml(colName)})</strong>: ผู้เรียนกรอก <code>${escapeHtml(uVal)}</code> — แนวคำตอบคือ <strong>“${escapeHtml(expVal)}”</strong>`
              );
            } else if (res.status === "review" || res.status === "brief") {
              rowAllGood = false;
              partialDetails.push(
                `<strong>${escapeHtml(rowLabel)} (${escapeHtml(colName)})</strong>: ลองเชื่อมประเด็น <em>“${escapeHtml(expVal)}”</em> เพิ่มเติม`
              );
            }
          } else if (uVal.length < 4) {
            cellFeedbackMap[key] = "brief";
            rowAllGood = false;
          }
        });

        if (rowHasEmpty) emptyRowLabels.push(rowLabel);
        else if (rowAllGood && (rowCheckedAny || filledCount > 0)) correctRowLabels.push(rowLabel);
      });

      if (filledCount === 0) {
        return {
          emptySubmission: true,
          verdict: "empty",
          verdictLabel: "📝 ยังไม่ได้กรอกคำตอบในตาราง",
          groundingRef: teachingCtx.groundingLabel,
          cellFeedbackMap,
          whatDidWell: ["คุณเปิดตารางฝึกวิเคราะห์พร้อมเริ่มทำแล้ว — ลองเลือกหรือพิมพ์คำตอบอย่างน้อยบางแถวก่อนกดส่ง เพื่อรับคำแนะนำรายช่องได้ทันที"],
          whatNeedsAttention: [`ยังไม่ได้กรอกข้อมูลในตาราง (มีช่องว่างทั้งหมด ${totalFillable} ช่อง)`],
          whatCanImprove: ["เริ่มจากแถวที่มั่นใจที่สุดก่อน แล้วเทียบความแตกต่างระหว่างแต่ละแถวตามเกณฑ์ในหัวตาราง"],
          socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, "empty"),
        };
      }

      if (gibberishCount > 0 && gibberishCount === filledCount) {
        return {
          verdict: "gibberish",
          verdictLabel: "⚠️ ตรวจพบข้อความพิมพ์มั่วในช่องตาราง",
          groundingRef: teachingCtx.groundingLabel,
          cellFeedbackMap,
          whatDidWell: ["ยังไม่สามารถประเมินจุดแข็งได้ เนื่องจากทุกช่องที่กรอกเป็นข้อความพิมพ์สุ่ม/ไม่เป็นคำที่มีความหมาย — ลองกรอกคำตอบตามความเข้าใจจริงแล้วส่งใหม่อีกครั้งนะครับ"],
          whatNeedsAttention: gibberishDetails.slice(0, 5),
          whatCanImprove: [
            "สำหรับช่องจำแนก (เช่น ใช่/ไม่ใช่/ยังไม่ทราบ) สามารถคลิกเลือกจากปุ่มตัวเลือกด้านบนในแต่ละช่องได้ทันที",
            formatSafeRichText(buildStarterScaffold(rubric, teachingCtx)),
          ],
          socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, "gibberish"),
        };
      }

      if (correctRowLabels.length > 0) {
        didWell.push(`วิเคราะห์และเติมข้อมูลในแถว <strong>${escapeHtml(correctRowLabels.join(", "))}</strong> ได้สอดคล้องกับแนวคำตอบอย่างแม่นยำ`);
      } else if (filledCount - gibberishCount > 0) {
        didWell.push(`ตั้งต้นกรอกข้อมูลที่เป็นคำตอบจริงแล้ว ${filledCount - gibberishCount} จาก ${totalFillable} ช่อง ช่วยให้ตรวจสอบจุดที่ควรปรับได้รายช่อง`);
      } else {
        didWell.push("ยังไม่มีช่องที่กรอกคำตอบจริงได้ตรงเกณฑ์ — ลองแก้ไขช่องที่ระบบแจ้งเตือนแล้วส่งตรวจอีกครั้ง");
      }

      const allTyped = Object.values(cells).join(" ");
      const ansConcepts = extractKeyConceptsFromText(stripTags(rubric.answerHtml), rubric.answerHtml);
      const matchedConcepts = ansConcepts.filter((c) => c.tokens.some((t) => allTyped.toLowerCase().includes(t)));
      if (matchedConcepts.length > 0) {
        didWell.push(
          `เชื่อมโยงแนวคิดสำคัญในเนื้อหาได้ดี ได้แก่ ${matchedConcepts.slice(0, 3).map((c) => `<strong>${escapeHtml(c.label)}</strong>`).join(", ")}`
        );
      }

      gibberishDetails.slice(0, 4).forEach((msg) => needsAttention.push(msg));
      mismatchDetails.slice(0, 5).forEach((msg) => needsAttention.push(msg));
      if (emptyRowLabels.length > 0) {
        needsAttention.push(`ยังมีช่องว่างที่ยังไม่ได้กรอกในแถว <strong>${escapeHtml(emptyRowLabels.join(", "))}</strong> (${totalFillable - filledCount} ช่อง)`);
      }
      if (!needsAttention.length && partialDetails.length > 0) {
        partialDetails.slice(0, 3).forEach((msg) => needsAttention.push(msg));
      }
      if (!needsAttention.length) {
        needsAttention.push("ไม่พบจุดคลาดเคลื่อนในช่องจำแนกหลัก — คำตอบในตารางมีความถูกต้องครบถ้วนดีมาก");
      }

      if (partialDetails.length > 0) canImprove.push(...partialDetails.slice(0, 3));
      const missingConcepts = ansConcepts.filter((c) => !matchedConcepts.includes(c));
      if (missingConcepts.length > 0) {
        canImprove.push(
          `ในช่องสรุปประเด็น/เหตุผล อาจระบุแนวคิดให้คมชัดขึ้น เช่น ${missingConcepts.slice(0, 3).map((c) => `<strong>${escapeHtml(c.label)}</strong>`).join(", ")}`
        );
      } else {
        canImprove.push("ลองเปรียบเทียบถ้อยคำในช่องสรุปกับตารางแนวคำตอบด้านล่าง เพื่อฝึกเขียนเหตุผลให้กระชับสำหรับใช้อภิปรายในกลุ่มย่อย");
      }

      const verdict =
        gibberishCount > 0
          ? "misconception"
          : mismatchDetails.length === 0 && emptyRowLabels.length === 0 && partialDetails.length === 0
          ? "exemplary"
          : mismatchDetails.length === 0 && emptyRowLabels.length <= 1
          ? "proficient"
          : "developing";
      const verdictMap = {
        misconception: "🔍 พบช่องที่พิมพ์ไม่เป็นคำหรือคลาดเคลื่อน",
        developing: "🌱 กำลังพัฒนา · มีจุดที่ควรเติมและตรวจสอบเพิ่ม",
        proficient: "✅ ดีมาก · จำแนกส่วนใหญ่ตรงแนวคำตอบ",
        exemplary: "🌟 ยอดเยี่ยม · วิเคราะห์ตารางครบถ้วนแม่นยำ",
      };

      return {
        verdict,
        verdictLabel: verdictMap[verdict],
        groundingRef: teachingCtx.groundingLabel,
        cellFeedbackMap,
        matchedConcepts,
        missedConcepts: missingConcepts,
        whatDidWell: didWell,
        whatNeedsAttention: needsAttention,
        whatCanImprove: canImprove,
        socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, verdict, matchedConcepts, missingConcepts),
      };
    }

    /* --- 2. Cloze Paragraph Evaluation --- */
    if (rubric.kind === "cloze") {
      const blanks = (submission && submission.blanks) || {};
      const cMap = rubric.clozeMap || {};
      const keys = Object.keys(cMap);
      const blankStatus = {};
      const rightNums = [];
      const wrongItems = [];
      const gibItems = [];
      const emptyNums = [];

      keys.forEach((k) => {
        const u = (blanks[k] || "").trim();
        const exp = cMap[k];
        if (!u) {
          blankStatus[k] = "empty";
          emptyNums.push(`(${k})`);
          return;
        }
        const q = analyzeSubmissionQuality(u, rubric, teachingCtx, { allowBareNumbers: true, skipPromptCopy: true, skipOffTopic: true });
        if (q.status === "gibberish" || q.status === "keyboard_layout_typo") {
          blankStatus[k] = "mismatch";
          gibItems.push(`ช่อง <strong>(${k})</strong> กรอก <code>${escapeHtml(u)}</code> ดูเหมือนพิมพ์สุ่ม/ไม่เป็นคำ — แนวคำตอบคือ <strong>${escapeHtml(exp)}</strong>`);
          return;
        }
        const uClean = u.replace(/ร้อยละ|%/g, "").trim().toLowerCase();
        const eClean = exp.replace(/ร้อยละ|%/g, "").trim().toLowerCase();
        if (uClean === eClean || (eClean.length >= 4 && (eClean.includes(uClean) || uClean.includes(eClean)) && uClean.length >= 3)) {
          blankStatus[k] = "exact";
          rightNums.push(`(${k}) ${exp}`);
        } else {
          blankStatus[k] = "mismatch";
          wrongItems.push(`ช่อง <strong>(${k})</strong> กรอก <code>${escapeHtml(u)}</code> → แนวคำตอบคือ <strong>${escapeHtml(exp)}</strong>`);
        }
      });

      if (emptyNums.length === keys.length) {
        return {
          emptySubmission: true,
          verdict: "empty",
          verdictLabel: "📝 ยังไม่ได้เติมช่องว่าง",
          groundingRef: teachingCtx.groundingLabel,
          blankStatus,
          whatDidWell: ["พร้อมเริ่มฝึกอ่านข้อมูลจากตารางแล้ว — ลองเติมตัวเลขและคำสำคัญในช่อง (1)–(7) ก่อนกดส่งคำตอบ"],
          whatNeedsAttention: ["ยังไม่ได้กรอกช่องว่าง (1)–(7)"],
          whatCanImprove: ["เทียบตัวเลขจากตารางสรุปผลการศึกษาด้านบนทีละแถว แล้วเติมลงในช่องว่างตามลำดับ"],
        };
      }

      if (gibItems.length > 0 && rightNums.length === 0 && wrongItems.length === 0) {
        return {
          verdict: "gibberish",
          verdictLabel: "⚠️ ตรวจพบข้อความพิมพ์มั่วในช่องว่าง",
          groundingRef: teachingCtx.groundingLabel,
          blankStatus,
          whatDidWell: ["ยังไม่สามารถประเมินจุดแข็งได้ เนื่องจากข้อความที่เติมเป็นอักษรสุ่ม — ลองดึงตัวเลขและคำจากตารางด้านบนมาเติมใหม่อีกครั้ง"],
          whatNeedsAttention: gibItems,
          whatCanImprove: ["สังเกตตัวเลขในตาราง Bishai และคณะ (146 ประเทศ) แล้วเติมตัวเลขและคำสำคัญลงในช่อง (1)–(7) ทีละช่อง"],
        };
      }

      if (rightNums.length > 0) {
        didWell.push(`ดึงข้อมูลจากตารางมาเติมได้ถูกต้อง ${rightNums.length}/${keys.length} ช่อง ได้แก่ <strong>${escapeHtml(rightNums.join(", "))}</strong>`);
      } else {
        didWell.push("ได้ทดลองเติมข้อมูลจากตารางแล้ว ทำให้เห็นทันทีว่าช่องใดควรกลับไปเทียบกับตัวเลขต้นทางใหม่");
      }

      gibItems.forEach((g) => needsAttention.push(g));
      wrongItems.forEach((w) => needsAttention.push(w));
      if (emptyNums.length > 0) needsAttention.push(`ยังไม่ได้เติมช่อง <strong>${emptyNums.join(", ")}</strong>`);
      if (!needsAttention.length) needsAttention.push("เติมข้อมูลครบทุกช่องและถูกต้องตรงตามตารางทั้งหมด");

      canImprove.push(
        "เมื่อเติมตัวเลขครบแล้ว สังเกตข้อคิดสำคัญตามเนื้อหา HS1 ว่าแม้ค่าเฉลี่ยรวมจะมาจากในภาคสุขภาพและนอกภาคสุขภาพราวครึ่งต่อครึ่ง แต่สัดส่วนจริงแตกต่างกันมากตามบริบทของแต่ละประเทศ จึงไม่ควรนำค่าเฉลี่ยระดับโลกไปใช้ตัดสินรายพื้นที่โดยไม่ดูข้อมูลท้องถิ่น"
      );
      const verdict = rightNums.length === keys.length ? "exemplary" : rightNums.length >= Math.ceil(keys.length * 0.6) ? "proficient" : "developing";
      return {
        verdict,
        verdictLabel: verdict === "exemplary" ? "🌟 ยอดเยี่ยม · เติมข้อมูลถูกต้องครบทุกช่อง" : verdict === "proficient" ? "✅ ดีมาก · ถูกต้องเป็นส่วนใหญ่" : "🌱 กำลังพัฒนา · ลองตรวจทานตัวเลขจากตารางอีกครั้ง",
        groundingRef: teachingCtx.groundingLabel,
        blankStatus,
        whatDidWell: didWell,
        whatNeedsAttention: needsAttention,
        whatCanImprove: canImprove,
      };
    }

    /* --- 3. Checklist Evaluation (HS2-WB กิจกรรมขอบเขตระบบสุขภาพ) --- */
    if (rubric.kind === "checklist") {
      const checked = (submission && submission.checked) || [];
      const notes = ((submission && submission.notes) || "").trim();
      if (!checked.length && !notes) {
        return {
          emptySubmission: true,
          verdict: "empty",
          verdictLabel: "📝 ยังไม่ได้เลือกรายการหรือระบุเกณฑ์",
          groundingRef: teachingCtx.groundingLabel,
          whatDidWell: ["ลองคลิกทำเครื่องหมายหน้ากิจกรรม ก.–จ. ที่คิดว่าเป็นส่วนหนึ่งของระบบสุขภาพ พร้อมเขียนเกณฑ์ที่ใช้ตัดสินสั้น ๆ ก่อนกดส่ง"],
          whatNeedsAttention: ["ยังไม่ได้เลือกรายการหรือระบุเกณฑ์การตัดสิน"],
          whatCanImprove: ["ลองถามตนเองว่าแต่ละกิจกรรมมี 'เจตนาหลัก (primary intent)' เพื่อสุขภาพโดยตรง หรือเป็นผลพลอยได้"],
        };
      }

      const noteQual = notes ? analyzeSubmissionQuality(notes, rubric, teachingCtx) : { status: "empty" };
      if (!checked.length && (noteQual.status === "gibberish" || noteQual.status === "keyboard_layout_typo" || noteQual.status === "non_answer")) {
        return {
          verdict: noteQual.status === "keyboard_layout_typo" ? "keyboard_layout_typo" : noteQual.status,
          verdictLabel: "⚠️ ตรวจพบข้อความที่ยังไม่ใช่คำตอบ",
          groundingRef: teachingCtx.groundingLabel,
          whatDidWell: ["ยังไม่สามารถประเมินจุดแข็งได้ เนื่องจากยังไม่ได้เลือกกิจกรรม ก.–จ. และข้อความเหตุผลยังไม่ใช่คำตอบที่มีความหมาย"],
          whatNeedsAttention: [formatSafeRichText(`ช่องเหตุผล <code>${notes}</code>: ${noteQual.detail}`)],
          whatCanImprove: ["ลองติ๊กเลือกกิจกรรม ก.–จ. ที่มีเป้าหมายหลักเพื่อสุขภาพ แล้วเขียนเกณฑ์ที่ใช้ตัดสินสั้น ๆ 1–2 ประโยค"],
        };
      }

      const coreHits = ["ก.", "ค.", "ง."].filter((x) => checked.includes(x));
      if (coreHits.length > 0) {
        didWell.push(`เลือกรายการ <strong>${coreHits.join(", ")}</strong> ซึ่งสอดคล้องกับกิจกรรมที่มี<strong>เจตนาหลัก (primary intent)</strong> เพื่อส่งเสริมหรือคงไว้ซึ่งสุขภาพตามกรอบองค์การอนามัยโลก`);
      }
      if (checked.includes("ข.")) {
        didWell.push("สังเกตเห็นความเชื่อมโยงด้านสุขภาพของข้อ ข. (ร้านอาหารลดความเค็มเพื่อลูกค้า) ซึ่งเป็นกรณีรอยต่อสำคัญสำหรับเทียบนิยาม WHO กับ พ.ร.บ. สุขภาพแห่งชาติ");
      }
      if (!didWell.length) {
        didWell.push("ได้เริ่มต้นทดลองจำแนกกิจกรรมแล้ว — ลองตรวจสอบเกณฑ์ที่ใช้ตัดสินเทียบกับกรอบ WHO และ พ.ร.บ. สุขภาพแห่งชาติ");
      }

      const missedCore = ["ก.", "ค.", "ง."].filter((x) => !checked.includes(x));
      if (missedCore.length > 0) {
        needsAttention.push(
          `ยังไม่ได้เลือกข้อ <strong>${missedCore.join(", ")}</strong> — แม้ผู้ดำเนินการจะอยู่นอกกระทรวงสาธารณสุข (เช่น ตำรวจรณรงค์สวมหมวกนิรภัย หรือแม่ดูแลลูกที่ป่วย) แต่มีเจตนาหลักเพื่อสุขภาพ จึงนับอยู่ในระบบสุขภาพตามนิยาม WHO`
        );
      }
      if (checked.includes("จ.") && !notes.includes("ความสัมพันธ์") && !notes.includes("พ.ร.บ.")) {
        needsAttention.push("ข้อ จ. (การจัดการศึกษาชั้นประถมทั่วไป) มีเจตนาหลักเพื่อการศึกษา จึงไม่อยู่ในระบบสุขภาพตามเกณฑ์เจตนาหลักของ WHO (ยกเว้นตีความกว้างตามระบบความสัมพันธ์ทั้งมวล)");
      }
      if (!notes) {
        needsAttention.push("ยังไม่ได้ระบุ 'เกณฑ์' และเหตุผลที่ใช้ตัดสินในช่องข้อความด้านล่าง");
      } else if (noteQual.status === "gibberish" || noteQual.status === "keyboard_layout_typo") {
        needsAttention.push(`ช่องเหตุผลที่พิมพ์ (<code>${escapeHtml(notes)}</code>) ดูเหมือนพิมพ์สุ่ม/ไม่เป็นคำที่มีความหมาย — ลองเขียนเกณฑ์ที่ใช้ตัดสินด้วยคำของตนเอง`);
      } else if (!needsAttention.length) {
        needsAttention.push("การจำแนกกิจกรรมสอดคล้องกับหลักคิดเรื่องขอบเขตของระบบสุขภาพเป็นอย่างดี");
      }

      canImprove.push(
        "ลองสรุปเกณฑ์เปรียบเทียบให้ชัดทั้ง 2 กรอบตามเนื้อหา HS2 หัวข้อ 1 คือ (1) เกณฑ์ <strong>เจตนาหลัก (primary intent)</strong> ของ WHO และ (2) เกณฑ์ <strong>ระบบความสัมพันธ์ทั้งมวลที่เกี่ยวข้องกับสุขภาพ</strong> ตาม พ.ร.บ. สุขภาพแห่งชาติ พ.ศ. 2550"
      );
      const verdict = missedCore.length === 0 && notes && noteQual.status === "valid" ? "proficient" : "developing";
      return {
        verdict,
        verdictLabel: verdict === "proficient" ? "✅ ดีมาก · จำแนกขอบเขตระบบสุขภาพได้ตรงหลัก" : "🌱 กำลังพัฒนา · ลองทบทวนเกณฑ์เจตนาหลักเพิ่มเติม",
        groundingRef: teachingCtx.groundingLabel,
        whatDidWell: didWell,
        whatNeedsAttention: needsAttention,
        whatCanImprove: canImprove,
        socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, verdict),
      };
    }

    /* --- 4. Open-ended Question / Reflection Evaluation --- */
    const text = String((submission && submission.text) || "").trim();
    const quality = analyzeSubmissionQuality(text, rubric, teachingCtx);

    if (quality.status === "empty") {
      return {
        emptySubmission: true,
        verdict: "empty",
        verdictLabel: "📝 ยังไม่ได้พิมพ์คำตอบ",
        groundingRef: teachingCtx.groundingLabel,
        whatDidWell: ["พร้อมเริ่มฝึกดึงความรู้ (Active Recall) — ลองพิมพ์คำตอบด้วยภาษาของตนเองสั้น ๆ 2–4 ประโยคก่อนกดส่งคำตอบ"],
        whatNeedsAttention: ["ยังไม่ได้พิมพ์คำตอบในกล่องข้อความ"],
        whatCanImprove: [
          formatSafeRichText(buildStarterScaffold(rubric, teachingCtx)),
          "ไม่ต้องกังวลว่าจะต้องเขียนสมบูรณ์แบบในครั้งแรก การลองคิดด้วยตนเองก่อนเห็นเฉลยช่วยให้จำแม่นและเข้าใจลึกกว่าการเปิดเฉลยทันที",
        ],
        socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, "empty"),
      };
    }

    // Immediate, honest, ZERO-FAKE-PRAISE handling for gibberish / keyboard mash / wrong keyboard layout / non-answer / prompt copy / off-topic!
    if (quality.status === "gibberish") {
      return {
        verdict: "gibberish",
        verdictLabel: "⚠️ ตรวจพบข้อความพิมพ์มั่ว / ไม่ใช่คำตอบ",
        groundingRef: teachingCtx.groundingLabel,
        hideKeyByDefault: true,
        whatDidWell: [
          "ยังไม่สามารถประเมินจุดแข็งของคำตอบได้ เนื่องจากข้อความที่ส่งมายังไม่ใช่คำตอบที่มีความหมาย — ยินดีที่คุณเปิดกล่องฝึกคิดไว้แล้ว ลองพิมพ์แนวคิดของตนเองสั้น ๆ แล้วส่งใหม่อีกครั้งได้เลย",
        ],
        whatNeedsAttention: [
          `ตรวจพบว่าข้อความ <code>${escapeHtml(clipText(text, 80))}</code> เป็นการพิมพ์มั่ว/ตัวอักษรแบบสุ่ม (${escapeHtml(quality.detail)}) จึงไม่สามารถวิเคราะห์ความเข้าใจเทียบกับเกณฑ์แนวคำตอบได้`,
          `โจทย์ข้อนี้ยึดโยงกับ <strong>${escapeHtml(teachingCtx.groundingLabel)}</strong> — จำเป็นต้องระบุข้อสรุปหรือเหตุผลตามบริบทของโจทย์จริง`,
        ],
        whatCanImprove: [
          formatSafeRichText(buildStarterScaffold(rubric, teachingCtx)),
          "ลองพิมพ์คำตอบจริงอย่างน้อย 1–3 ประโยคด้วยภาษาของตนเอง แล้วกดส่งอีกครั้ง เพื่อให้ระบบวิเคราะห์จุดที่เข้าใจแม่นยำและจุดที่ควรเสริมได้ตรงจุด",
        ],
        socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, "gibberish"),
      };
    }

    if (quality.status === "keyboard_layout_typo") {
      return {
        verdict: "keyboard_layout_typo",
        verdictLabel: "⌨️ อาจลืมเปลี่ยนภาษาแป้นพิมพ์ (EN → TH)",
        groundingRef: teachingCtx.groundingLabel,
        hideKeyByDefault: true,
        whatDidWell: [
          "ยังไม่สามารถตรวจคำตอบได้ทันที เนื่องจากข้อความที่ส่งมาเป็นตัวอักษรภาษาอังกฤษที่เรียงคล้ายการลืมเปลี่ยนภาษาแป้นพิมพ์",
        ],
        whatNeedsAttention: [
          `ข้อความ <code>${escapeHtml(clipText(text, 80))}</code> มีรูปแบบเหมือนพิมพ์ภาษาไทยขณะแป้นพิมพ์ค้างภาษาอังกฤษ (ระบบเทียบแป้นพิมพ์ไทยได้ใกล้เคียง: <strong>“${escapeHtml(clipText(quality.decodedThai || "", 80))}”</strong>)`,
        ],
        whatCanImprove: [
          "ลองสลับแป้นพิมพ์เป็นภาษาไทย พิมพ์คำตอบใหม่อีกครั้ง แล้วกดส่งเพื่อรับคำแนะนำเชิงลึกที่ยึดโยงกับเนื้อหาคำสอน",
          formatSafeRichText(buildStarterScaffold(rubric, teachingCtx)),
        ],
        socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, "keyboard_layout_typo"),
      };
    }

    if (quality.status === "non_answer") {
      const isHonestUnsure = quality.subReason === "honest_unsure";
      return {
        verdict: "non_answer",
        verdictLabel: isHonestUnsure ? "🌱 ยังไม่มั่นใจ · เริ่มต้นจากคำใบ้ก่อนได้" : "⚠️ ข้อความทดสอบ · ยังไม่ใช่คำตอบ",
        groundingRef: teachingCtx.groundingLabel,
        hideKeyByDefault: true,
        whatDidWell: [
          isHonestUnsure
            ? "ชื่นชมความตรงไปตรงมาที่บอกว่ายังไม่มั่นใจ — การรู้ว่าเรายังไม่เข้าใจจุดไหนคือก้าวแรกของการเรียนรู้ที่สำคัญ (metacognition)"
            : "ยังไม่สามารถประเมินจุดแข็งของคำตอบได้ เนื่องจากข้อความที่ส่งมาเป็นเพียงคำทดสอบ/ข้อความสั้นที่ยังไม่ได้ตอบประเด็นของโจทย์",
        ],
        whatNeedsAttention: [
          isHonestUnsure
            ? `ยังไม่ได้ลองร่างแนวคิดเบื้องต้นสำหรับโจทย์ใน <strong>${escapeHtml(teachingCtx.groundingLabel)}</strong>`
            : `ข้อความ <code>${escapeHtml(clipText(text, 60))}</code> เป็นข้อความทดสอบ/คำทั่วไป (${escapeHtml(quality.detail)}) จึงยังไม่สามารถตรวจเทียบเกณฑ์แนวคำตอบได้`,
        ],
        whatCanImprove: [
          formatSafeRichText(buildStarterScaffold(rubric, teachingCtx)),
          "ลองเดาอย่างมีเหตุผลสั้น ๆ 1–2 ประโยคก่อนเปิดดูเฉลย เพื่อฝึกเชื่อมโยงความรู้ด้วยตนเอง",
        ],
        socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, "non_answer"),
      };
    }

    if (quality.status === "prompt_copy") {
      return {
        verdict: "prompt_copy",
        verdictLabel: "📋 คัดลอกข้อความจากโจทย์โดยตรง",
        groundingRef: teachingCtx.groundingLabel,
        hideKeyByDefault: true,
        whatDidWell: [
          "คุณจับข้อความโจทย์ขึ้นมาตั้งต้นได้ครบถ้วนแล้ว — ขั้นต่อไปคือการเติมคำตอบและเหตุผลด้วยภาษาของตนเองต่อท้าย",
        ],
        whatNeedsAttention: [
          "ระบบตรวจพบว่าคำตอบเกือบทั้งหมดเป็นการคัดลอกข้อความโจทย์คำถามมาวางโดยตรง ยังไม่มีข้อสรุปหรือคำอธิบายที่ตอบโจทย์",
        ],
        whatCanImprove: [
          formatSafeRichText(buildStarterScaffold(rubric, teachingCtx)),
          "ลองลบข้อความโจทย์ออกหรือตอบสั้น ๆ ทีละประเด็นที่โจทย์ถามด้วยคำพูดของคุณเอง แล้วกดส่งตรวจใหม่อีกครั้ง",
        ],
        socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, "prompt_copy"),
      };
    }

    if (quality.status === "off_topic") {
      return {
        verdict: "off_topic",
        verdictLabel: "🧭 เนื้อหายังไม่ตรงประเด็นของโจทย์",
        groundingRef: teachingCtx.groundingLabel,
        hideKeyByDefault: true,
        whatDidWell: [
          "เขียนเป็นประโยคที่อ่านเข้าใจได้ชัดเจน แต่เนื้อหายังไม่ได้เชื่อมโยงเข้าสู่คำถามและกรอบแนวคิดของรายวิชา RACM 303 ในหัวข้อนี้",
        ],
        whatNeedsAttention: [
          `ข้อความที่ส่งมาไม่พบความเชื่อมโยงกับตัวละคร/กรณีศึกษา คำสำคัญ หรือเนื้อหาใน <strong>${escapeHtml(teachingCtx.groundingLabel)}</strong>`,
        ],
        whatCanImprove: [
          formatSafeRichText(buildStarterScaffold(rubric, teachingCtx)),
          "ลองกลับไปอ่านโจทย์และกรณีศึกษาด้านบนอีกครั้ง แล้วเขียนคำตอบที่ตอบตรงประเด็นของบทเรียน",
        ],
        socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, "off_topic"),
      };
    }

    /* --- Valid substantive student attempt: Perform deep grounded diagnostic evaluation --- */
    const ansPlain = stripTags(rubric.answerHtml);
    const promptPlain = rubric.prompt || "";
    const concepts = extractKeyConceptsFromText(ansPlain, rubric.answerHtml);
    const tLow = text.toLowerCase();

    const matched = [];
    const missed = [];
    concepts.forEach((c) => {
      if (c.tokens.some((tok) => tLow.includes(tok))) matched.push(c);
      else missed.push(c);
    });

    const entCov = detectCaseEntityCoverage(text, ansPlain, promptPlain);
    const misconceptions = detectMisconceptions(text, rubric);

    const hasReasoning = /เพราะ|เนื่องจาก|ส่งผล|ทำให้|จึง|ดังนั้น|กล่าวคือ|แตกต่าง|ต่างจาก|ขณะที่|ส่วน|โดยอาศัย|ช่วย(?:ให้|ลด|ป้องกัน)|เพื่อ(?:ให้|มิให้|ป้องกัน)/.test(text);
    const hasExample = /เช่น|ตัวอย่าง|กรณี|ได้แก่|โรงพยาบาล|ผู้ป่วย|ชุมชน|บุคคล\s*[ก-จ]|ผู้รับบริการ|เด็กคนที่/.test(text);
    const isComparePrompt = /ต่างกันอย่างไร|เปรียบเทียบ|แตกต่างจาก/.test(promptPlain);
    const hasContrastCue = /ต่าง|แต่|ขณะที่|ส่วน|ในทางกลับกัน|เทียบกับ|มิใช่|ไม่ใช่/.test(text);

    // 1. What you did well (strictly earned, concrete, grounded)
    if (matched.length > 0) {
      didWell.push(
        `จับแนวคิดสำคัญที่สอดคล้องกับเนื้อหาประกอบคำสอนได้ตรงจุด ได้แก่ ${matched
          .slice(0, 4)
          .map((c) => `<strong>${escapeHtml(c.label)}</strong>`)
          .join(", ")}`
      );
    }
    if (entCov.matched.length > 0) {
      didWell.push(
        `วิเคราะห์เชื่อมโยงกับกรณีศึกษา/ตัวแบบในโจทย์ได้ชัดเจน ได้แก่ <strong>${escapeHtml(entCov.matched.slice(0, 4).join(", "))}</strong>`
      );
    }
    if (hasReasoning && (matched.length > 0 || entCov.matched.length > 0)) {
      didWell.push("มีการอธิบายกลไกเชิงเหตุผลหรือเชื่อมโยงความแตกต่างอย่างเป็นระบบ ไม่ใช่เพียงระบุคำตอบลอย ๆ");
    } else if (hasExample && matched.length > 0) {
      didWell.push("หยิบยกกรณีรูปธรรมหรือบริบทระบบบริการสุขภาพมาประกอบคำอธิบายได้ดี");
    }
    if (!didWell.length) {
      didWell.push(
        `มีความพยายามเรียบเรียงคำตอบที่เกี่ยวข้องกับหัวข้อ <strong>${escapeHtml(teachingCtx.groundingLabel)}</strong> ด้วยภาษาของตนเอง ซึ่งเป็นจุดตั้งต้นที่ดีสำหรับการเทียบปรับกับแนวคิดหลักในบทเรียน`
      );
    }

    // 2. What needs attention (specific misconceptions, missed entities, missed concepts, incomplete multi-part)
    misconceptions.forEach((m) => needsAttention.push(formatSafeRichText(m)));

    const multiEntityExpected = entCov.expected.length >= 2;
    if (multiEntityExpected && entCov.missed.length > 0) {
      needsAttention.push(
        `ยังมีกรณีศึกษา/ประเด็นหลักที่โจทย์กล่าวถึงแต่ยังไม่ปรากฏในคำตอบ ได้แก่ <strong>${escapeHtml(entCov.missed.slice(0, 4).join(", "))}</strong>`
      );
    }
    if (missed.length > 0) {
      needsAttention.push(
        `แนวคิดสำคัญตามเนื้อหาคำสอน (${escapeHtml(teachingCtx.moduleCode || "บทนี้")}) ที่ยังตกหล่นหรือควรขยายความเพิ่ม ได้แก่ ${missed
          .slice(0, 4)
          .map((c) => `<strong>${escapeHtml(c.label)}</strong>`)
          .join(", ")}`
      );
    }
    if (isComparePrompt && !hasContrastCue) {
      needsAttention.push("โจทย์ถามเชิงเปรียบเทียบความแตกต่าง — คำตอบยังไม่ได้ชี้จุดต่างระหว่างสองแนวคิด/สองฝั่งให้เห็นชัดเจน");
    }
    if (text.length < 28 && missed.length > 0) {
      needsAttention.push("คำตอบยังค่อนข้างสั้น จึงยังไม่ครอบคลุมกลไกหรือเหตุผลประกอบครบทุกประเด็นย่อยของคำถาม");
    }
    if (!needsAttention.length) {
      needsAttention.push("ครอบคลุมประเด็นสำคัญและกรณีศึกษาของข้อนี้ได้ครบถ้วน ไม่พบจุดคลาดเคลื่อนสำคัญ");
    }

    // 3. What can be improved (actionable, question-specific, grounded!)
    if (misconceptions.length > 0) {
      canImprove.push(
        `ลองทบทวนจุดที่ยังคลาดเคลื่อนด้านบนเทียบกับ <strong>${escapeHtml(teachingCtx.groundingLabel)}</strong> แล้วปรับถ้อยคำในประโยคข้อสรุปของคุณให้แม่นยำขึ้น`
      );
    }
    if (missed.length > 0) {
      canImprove.push(
        `ลองเติมประเด็น ${missed.slice(0, 2).map((c) => `<strong>${escapeHtml(c.label)}</strong>`).join(" และ ")}` +
          (multiEntityExpected && entCov.missed.length > 0 ? ` โดยเชื่อมโยงเข้ากับ <strong>${escapeHtml(entCov.missed.slice(0, 2).join(", "))}</strong>` : "") +
          " ต่อท้ายคำตอบเดิมของคุณเพื่อให้ครบทุกมิติของโจทย์"
      );
    }
    if (!hasReasoning) {
      canImprove.push("เสริมประโยคเชื่อมเหตุและผล (เช่น “เพราะ… จึงส่งผลให้…” หรือ “แยกจากกันตรงที่…”) เพื่อแสดงให้เห็นกลไกความเข้าใจเชิงลึก");
    } else if (isComparePrompt && !hasContrastCue) {
      canImprove.push("ลองระบุทั้งสองฝั่งคู่กันด้วยโครงสร้าง “แนวคิด ก เน้น… ขณะที่แนวคิด ข เน้น… ดังนั้นจึงต่างกันตรงที่…”");
    } else if (!hasExample && ansPlain.length > 160 && entCov.expected.length === 0) {
      canImprove.push("ลองเพิ่มตัวอย่างทางคลินิกหรือสถานการณ์ในระบบบริการสุขภาพไทยสั้น ๆ 1 ตัวอย่าง เพื่อใช้ต่อยอดในการอภิปรายกลุ่มย่อย");
    }
    if (!canImprove.length) {
      canImprove.push(
        `คำตอบมีคุณภาพและแม่นยำดีมาก ลองเทียบรายละเอียดปลีกย่อยและคำศัพท์มาตรฐานภาษาอังกฤษในแนวคำตอบด้านล่าง (${escapeHtml(teachingCtx.groundingLabel)}) เพื่อเสริมความคมชัดในการสอบและการอภิปราย`
      );
    }

    // Determine verdict tier (only require explicit entity naming when question compares 2+ case entities)
    const coverageRatio = concepts.length > 0 ? matched.length / concepts.length : text.length >= 45 ? 0.65 : 0.35;
    const entityRatio = multiEntityExpected ? entCov.matched.length / entCov.expected.length : 1;

    let verdict = "developing";
    let verdictLabel = "🌱 กำลังพัฒนา · จับประเด็นได้บางส่วน";
    if (misconceptions.length > 0) {
      verdict = "misconception";
      verdictLabel = "🔍 พบจุดเข้าใจคลาดเคลื่อนสำคัญ";
    } else if (coverageRatio >= 0.72 && entityRatio >= 0.75 && hasReasoning && text.length >= 45) {
      verdict = "exemplary";
      verdictLabel = "🌟 ยอดเยี่ยม · ครบถ้วนและเชื่อมโยงลึกซึ้ง";
    } else if ((coverageRatio >= 0.48 && entityRatio >= 0.5) || (matched.length >= 2 && entityRatio >= 0.6)) {
      verdict = "proficient";
      verdictLabel = "✅ ดีมาก · ตรงประเด็นสำคัญ";
    }

    return {
      verdict,
      verdictLabel,
      groundingRef: teachingCtx.groundingLabel,
      matchedConcepts: matched,
      missedConcepts: missed,
      misconceptionCount: misconceptions.length,
      whatDidWell: didWell,
      whatNeedsAttention: needsAttention,
      whatCanImprove: canImprove,
      socraticFollowUp: buildSocraticFollowUp(rubric, teachingCtx, verdict, matched, missed),
    };
  }

  /* ==========================================================================
   * LAYER 4: CONCEPTUALIZED ANSWER KEY & PERSONALIZED DEEP-LINK PRESCRIPTION
   * 100% In-Browser · Zero API Key · Anchored in ฉบับย่อ + Concise ฉบับเต็ม
   * ========================================================================== */
  function getVerdictStyleClass(verdict) {
    if (verdict === "gibberish" || verdict === "keyboard_layout_typo") return "is-verdict-danger";
    if (verdict === "non_answer" || verdict === "prompt_copy" || verdict === "off_topic" || verdict === "empty") return "is-verdict-warn";
    if (verdict === "misconception") return "is-verdict-alert";
    if (verdict === "exemplary") return "is-verdict-star";
    if (verdict === "proficient") return "is-verdict-good";
    return "is-verdict-dev";
  }

  function stripMetaRoadmapLead(txt) {
    return String(txt || "")
      .replace(/^คำถามนำของ(?:หัวข้อ|ส่วน|บท)นี้คือ[^?؟]+[?؟]?\s*/i, "")
      .replace(/^(?:หัวข้อ|ส่วน|บท)นี้(?:เริ่มจากการ)?(?:ชี้ให้เห็นว่า|สำรวจว่า|ชวนพิจารณาว่า|อธิบายว่า)\s*/i, "")
      .trim();
  }

  /** Extract a concise, non-redundant expansion note from the Full textbook section */
  function buildFullSectionConciseExpansion(rubric, teachingCtx) {
    const fullSec = teachingCtx && teachingCtx.fullSec;
    if (!fullSec) return "";
    const ansPlain = stripTags((rubric && rubric.answerHtml) || "").toLowerCase();

    if (fullSec.summaryNote) {
      const cleaned = stripMetaRoadmapLead(fullSec.summaryNote);
      const overlap = computeCharNgramContainment(cleaned, ansPlain, 5);
      if (cleaned.length >= 35 && overlap < 0.68) {
        return cleaned;
      }
    }

    for (const b of fullSec.bullets || []) {
      const cleaned = stripMetaRoadmapLead(b);
      const overlap = computeCharNgramContainment(cleaned, ansPlain, 5);
      if (cleaned.length >= 35 && overlap < 0.62) {
        return cleaned;
      }
    }

    if (fullSec.plain && fullSec.plain.length >= 60) {
      const firstSentences = stripMetaRoadmapLead(
        fullSec.plain
          .replace(/\([A-Z][a-zA-Z\s&.,;0-9\-]+\d{4}[a-z]?\)/g, "")
          .replace(/\s+/g, " ")
          .trim()
      );
      if (!/^(?:ส่วนถัดมา|จากนั้นจึง|ก่อนปิดท้ายด้วย)/.test(firstSentences) && firstSentences.length >= 45) {
        const candidate = clipText(firstSentences, 230);
        if (computeCharNgramContainment(candidate, ansPlain, 5) < 0.65) {
          return candidate;
        }
      }
    }
    return "";
  }

  /** Extract a crisp 1-line Abridged summary note when distinct from answerHtml */
  function buildConciseSectionAnchorNote(rubric, teachingCtx) {
    const cSec = teachingCtx && teachingCtx.conciseSec;
    if (!cSec) return "";
    const ansPlain = stripTags((rubric && rubric.answerHtml) || "").toLowerCase();
    if (cSec.summaryNote && computeCharNgramContainment(cSec.summaryNote, ansPlain, 5) < 0.65) {
      return cSec.summaryNote;
    }
    for (const b of cSec.bullets || []) {
      if (computeCharNgramContainment(b, ansPlain, 5) < 0.62) {
        return clipText(b, 200);
      }
    }
    return "";
  }

  /** Build personalized reading recommendations with clickable deep-links to ฉบับย่อ & ฉบับเต็ม */
  function buildPersonalizedReadingItems(rubric, evalResult, teachingCtx) {
    const ctx = teachingCtx || extractTeachingContext(rubric);
    const mod = ctx.moduleCode || "HS1";
    const cSec = ctx.conciseSec;
    const fSec = ctx.fullSec;
    const missed = (evalResult && evalResult.missedConcepts) || [];
    const items = [];

    // 1. Primary Abridged (ฉบับย่อ) deep-link — always lead with concise big-picture structure!
    if (cSec) {
      const cLink = buildDocDeepLinkHtml(
        cSec.docId,
        cSec.anchorId,
        `⚡ ${mod} ฉบับย่อ · ${cSec.shortTitle}`,
        "is-concise"
      );
      if (missed.length > 0) {
        items.push(
          `<strong>เริ่มทบทวนโครงสร้างหลักในฉบับย่อ:</strong> อ่านสรุปประเด็น ${missed
            .slice(0, 2)
            .map((c) => `<strong>${escapeHtml(c.label)}</strong>`)
            .join(" และ ")} แบบกระชับได้ที่ ${cLink}`
        );
      } else {
        items.push(
          `<strong>ทบทวนแก่นสรุปไวในฉบับย่อ:</strong> เช็กโครงสร้างและตารางเปรียบเทียบสำหรับจดสรุปสอบได้ที่ ${cLink}`
        );
      }
    }

    // 2. Targeted Full-Version (ฉบับเต็ม) deep-link — pinpointed to the specific missed concept's subsection!
    const targetFullSec =
      missed.length > 0 ? findSectionForConcept(missed[0], ctx.fullSections, fSec) : fSec;
    if (targetFullSec) {
      const fLink = buildDocDeepLinkHtml(
        targetFullSec.docId,
        targetFullSec.anchorId,
        `📘 ${mod} ฉบับเต็ม · ${targetFullSec.shortTitle}`,
        "is-full"
      );
      if (missed.length > 0) {
        items.push(
          `<strong>อ่านขยายความประเด็นที่ควรเสริมในฉบับเต็ม:</strong> เจาะลึกกลไกและตัวอย่างเรื่อง ${missed
            .slice(0, 2)
            .map((c) => `<strong>${escapeHtml(c.label)}</strong>`)
            .join(", ")} เพิ่มเติมที่ ${fLink}`
        );
      } else {
        items.push(
          `<strong>อ่านขยายความและกรณีตัวอย่างในฉบับเต็ม:</strong> ดูเหตุผลเชิงระบบและตัวอย่างเวชปฏิบัติเพิ่มเติมที่ ${fLink}`
        );
      }
    }

    // 3. Keep the most actionable writing/application suggestion from evaluateLocally (if non-redundant)
    const rawImprove = (evalResult && evalResult.whatCanImprove) || [];
    if (rawImprove.length > 0) {
      items.push(rawImprove[0]);
    }

    return items;
  }

  /** Build Conceptualized Answer Key: Core (Abridged-first) + Concise Full Expansion + Hyperlinks */
  function buildConceptualizedAnswerHtml(rubric, teachingCtx, shouldCollapse) {
    if (!rubric || !rubric.answerHtml) return "";
    const ctx = teachingCtx || extractTeachingContext(rubric);
    const mod = ctx.moduleCode || "";
    const cSec = ctx.conciseSec;
    const fSec = ctx.fullSec;

    const cleanAnswerHtml = String(rubric.answerHtml).replace(
      /<strong>\s*แนวคิดหลักจากเนื้อหาส่วนนี้[^<]*<\/strong>\s*/gi,
      ""
    );

    const conciseNote = rubric.kind === "table" || rubric.kind === "cloze" ? "" : buildConciseSectionAnchorNote(rubric, ctx);
    const fullExpansion = buildFullSectionConciseExpansion(rubric, ctx);

    const linkChips = [];
    if (rubric.specKey) {
      linkChips.push(
        `<button type="button" class="iq-doc-deep-link is-spec" data-kt-open="${escapeHtml(rubric.specKey)}">🎯 เปิดกรอบ Table Spec (${escapeHtml(rubric.specTitle || rubric.specKey)}) →</button>`
      );
    }
    if (cSec) {
      linkChips.push(
        buildDocDeepLinkHtml(
          cSec.docId,
          cSec.anchorId,
          `⚡ อ่านฉบับย่อ: ${mod} · ${cSec.shortTitle} →`,
          "is-concise"
        )
      );
    }
    if (fSec) {
      linkChips.push(
        buildDocDeepLinkHtml(
          fSec.docId,
          fSec.anchorId,
          `📘 อ่านขยายความฉบับเต็ม: ${mod} · ${fSec.shortTitle} →`,
          "is-full"
        )
      );
    }

    const innerBody = `
      <div class="iq-concept-key-stack">
        <div class="iq-concept-core-block">
          <div class="iq-concept-subkicker is-concise">⚡ สรุปแก่นคำตอบเชิงแนวคิด (อิงเนื้อหาฉบับย่อ)</div>
          <div class="iq-concept-core-prose">${cleanAnswerHtml}</div>
          ${
            conciseNote
              ? `<div class="iq-concise-anchor-note"><strong>ประเด็นเชื่อมโยงในฉบับย่อ:</strong> ${escapeHtml(conciseNote)}</div>`
              : ""
          }
        </div>
        ${
          fullExpansion
            ? `<div class="iq-concept-expand-block">
                 <div class="iq-concept-subkicker is-full">📘 ขยายความกระชับจากฉบับเต็ม (${escapeHtml(mod)}${fSec && fSec.num ? ` หัวข้อ ${escapeHtml(fSec.num)}` : ""})</div>
                 <p class="iq-concept-expand-text">${escapeHtml(fullExpansion)}</p>
               </div>`
            : ""
        }
        ${
          linkChips.length > 0
            ? `<div class="iq-concept-links-bar">
                 <span class="iq-concept-links-label">🔗 พิกัดอ่านต่อตรงประเด็น:</span>
                 <div class="iq-concept-links-row">${linkChips.join("")}</div>
               </div>`
            : ""
        }
      </div>
    `;

    if (shouldCollapse) {
      return `
        <details class="iq-model-key-box is-collapsed-key">
          <summary class="iq-model-key-head is-clickable">📖 เฉลยสังเคราะห์ตามเนื้อหา · ฉบับย่อ &amp; พิกัดอ่านต่อฉบับเต็ม (แนะนำให้ลองเขียนคำตอบก่อน · คลิกเพื่อเปิดดู)</summary>
          <div class="iq-model-key-body">${innerBody}</div>
        </details>
      `;
    }
    return `
      <div class="iq-model-key-box">
        <div class="iq-model-key-head">📖 เฉลยสังเคราะห์ตามเนื้อหา (แก่นฉบับย่อ &amp; ขยายความกระชับจากฉบับเต็ม)</div>
        <div class="iq-model-key-body">${innerBody}</div>
      </div>
    `;
  }

  function buildFeedbackHtml(rubric, evalResult, mode, precomputedCtx) {
    const teachingCtx = precomputedCtx || extractTeachingContext(rubric);
    const parts = [];
    if (mode === "check_and_key" && evalResult) {
      const srcBadge = `<span class="iq-ai-badge">📋 ผลการวิเคราะห์ความเข้าใจตามเนื้อหาบทเรียน</span>`;
      const vClass = getVerdictStyleClass(evalResult.verdict);
      const verdictPill = evalResult.verdictLabel
        ? `<span class="iq-verdict-pill ${vClass}">${escapeHtml(evalResult.verdictLabel)}</span>`
        : "";
      const isNonSubstantive = ["gibberish", "keyboard_layout_typo", "non_answer", "prompt_copy", "off_topic", "empty"].includes(
        evalResult.verdict
      );
      const isDangerMiss = evalResult.verdict === "gibberish" || evalResult.verdict === "misconception";

      const col1Title = isNonSubstantive
        ? "ℹ️ สถานะคำตอบที่ส่งตรวจ"
        : "✓ เข้าใจตรงไหนได้ดีแล้ว";
      const col1Class = isNonSubstantive ? "iq-ai-col is-neutral" : "iq-ai-col is-well";
      const col2Class = isDangerMiss ? "iq-ai-col is-miss is-critical" : "iq-ai-col is-miss";

      const quickTopLinks = [];
      if (rubric && rubric.specKey) {
        quickTopLinks.push(
          `<button type="button" class="iq-doc-deep-link is-spec is-compact" data-kt-open="${escapeHtml(rubric.specKey)}">🎯 Table Spec (${escapeHtml(rubric.specKey.replace(":", " หมวด "))})</button>`
        );
      }
      if (teachingCtx.conciseSec) {
        quickTopLinks.push(
          buildDocDeepLinkHtml(
            teachingCtx.conciseSec.docId,
            teachingCtx.conciseSec.anchorId,
            `⚡ ${teachingCtx.moduleCode} ฉบับย่อ (${teachingCtx.conciseSec.num || "สรุป"})`,
            "is-concise is-compact"
          )
        );
      }
      if (teachingCtx.fullSec) {
        quickTopLinks.push(
          buildDocDeepLinkHtml(
            teachingCtx.fullSec.docId,
            teachingCtx.fullSec.anchorId,
            `📘 ${teachingCtx.moduleCode} ฉบับเต็ม (${teachingCtx.fullSec.num || "เนื้อหา"})`,
            "is-full is-compact"
          )
        );
      }

      const groundingBar = evalResult.groundingRef
        ? `<div class="iq-grounding-bar">📚 <strong>อ้างอิงเนื้อหาบทเรียน:</strong> ${escapeHtml(evalResult.groundingRef)}${
            quickTopLinks.length ? ` <span class="iq-grounding-links">${quickTopLinks.join(" ")}</span>` : ""
          }</div>`
        : "";

      const readingItems = buildPersonalizedReadingItems(rubric, evalResult, teachingCtx);

      const socraticHtml = evalResult.socraticFollowUp
        ? `<div class="iq-socratic-box"><span class="iq-socratic-label">🤔 คำถามชวนคิดต่อยอด:</span> ${evalResult.socraticFollowUp}</div>`
        : "";

      parts.push(`
        <div class="iq-ai-panel ${vClass}">
          <div class="iq-ai-panel-head">
            <div class="iq-ai-head-left">
              ${srcBadge}
              ${verdictPill}
            </div>
          </div>
          ${groundingBar}
          <div class="iq-ai-grid">
            <div class="${col1Class}">
              <div class="iq-ai-col-title">${col1Title}</div>
              <ul>${(evalResult.whatDidWell || []).map((x) => `<li>${x}</li>`).join("")}</ul>
            </div>
            <div class="${col2Class}">
              <div class="iq-ai-col-title">△ ยังไม่เข้าใจชัด / ประเด็นที่ยังตกหล่น</div>
              <ul>${(evalResult.whatNeedsAttention || []).map((x) => `<li>${x}</li>`).join("")}</ul>
            </div>
            <div class="iq-ai-col is-improve">
              <div class="iq-ai-col-title">🧭 ควรไปอ่านอะไร · ประเด็นไหนเพิ่มเติม</div>
              <ul>${readingItems.map((x) => `<li>${x}</li>`).join("")}</ul>
            </div>
          </div>
          ${socraticHtml}
        </div>
      `);
    }

    if (rubric && rubric.answerHtml) {
      const shouldCollapse = Boolean(
        mode === "check_and_key" && evalResult && (evalResult.hideKeyByDefault || evalResult.emptySubmission)
      );
      parts.push(buildConceptualizedAnswerHtml(rubric, teachingCtx, shouldCollapse));
    }
    return parts.join("");
  }

  /* ---------- Floating Pop-up Modal (For Side-by-Side / Slide Deck Q&A) ---------- */
  let modalBackdrop = null;

  function ensureModal() {
    if (modalBackdrop) return modalBackdrop;
    modalBackdrop = document.createElement("div");
    modalBackdrop.className = "iq-modal-backdrop";
    modalBackdrop.hidden = true;
    modalBackdrop.innerHTML = `
      <div class="iq-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="iqModalTitle">
        <div class="iq-modal-header">
          <h3 id="iqModalTitle">ตรวจความเข้าใจ &amp; เฉลยสังเคราะห์ตามเนื้อหา</h3>
          <div style="display:inline-flex;align-items:center;gap:8px;flex-shrink:0">
            <div class="racm-unav-pair is-compact" role="navigation" aria-label="ปุ่มย้อนกลับและหน้าหลักใหญ่">
              <button type="button" class="racm-unav-btn is-back" data-racm-nav="back" title="ย้อนกลับ 1 หน้าก่อนหน้านี้"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span class="racm-unav-lbl">ย้อนกลับ</span></button>
              <button type="button" class="racm-unav-btn is-home" data-racm-nav="home" title="กลับหน้าหลักใหญ่พอร์ทัล RACM 303"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="racm-unav-lbl">หน้าหลักใหญ่</span></button>
            </div>
            <button type="button" class="iq-modal-close" aria-label="ปิดหน้าต่าง">✕</button>
          </div>
        </div>
        <div class="iq-modal-body" id="iqModalBody"></div>
      </div>
    `;
    document.body.appendChild(modalBackdrop);

    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop || e.target.closest(".iq-modal-close")) {
        modalBackdrop.hidden = true;
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalBackdrop && !modalBackdrop.hidden) {
        modalBackdrop.hidden = true;
      }
    });
    return modalBackdrop;
  }

  function openPopupFeedback(titleText, rubric, getSubmissionFn, onSaveTextFn) {
    const bd = ensureModal();
    const titleEl = bd.querySelector("#iqModalTitle");
    const bodyEl = bd.querySelector("#iqModalBody");
    titleEl.textContent = titleText || "ฝึกตอบคำถาม · ตรวจความเข้าใจ & เฉลย";

    const curSub = getSubmissionFn ? getSubmissionFn() : {};
    const isSimpleQ = rubric.kind === "question" || rubric.kind === "reflection";

    bodyEl.innerHTML = `
      <div class="iq-popup-prompt">${escapeHtml(rubric.prompt || rubric.sectionTitle || "")}</div>
      ${
        isSimpleQ
          ? `<div class="iq-popup-editor">
               <textarea class="iq-textarea" rows="4" placeholder="พิมพ์คำตอบด้วยภาษาของตนเอง แล้วกดตรวจความเข้าใจเพื่อดูจุดที่เข้าใจดีและพิกัดอ่านต่อ…">${escapeHtml(curSub.text || "")}</textarea>
               <div class="iq-btn-row">
                 <button type="button" class="iq-btn is-ai" data-popup-submit>✓ ส่งคำตอบ &amp; ตรวจความเข้าใจ</button>
                 <button type="button" class="iq-btn is-key" data-popup-key>👁 ดูเฉลยสังเคราะห์</button>
               </div>
             </div>`
          : ""
      }
      <div class="iq-popup-result"></div>
    `;

    const resBox = bodyEl.querySelector(".iq-popup-result");
    const popupTa = bodyEl.querySelector("textarea.iq-textarea");

    const runEvalInPopup = (mode) => {
      const latestSub = isSimpleQ && popupTa ? { text: popupTa.value } : getSubmissionFn();
      if (isSimpleQ && popupTa && onSaveTextFn) onSaveTextFn(popupTa.value);
      const teachingCtx = extractTeachingContext(rubric);
      if (mode === "key_only") {
        resBox.innerHTML = buildFeedbackHtml(rubric, null, "key_only", teachingCtx);
        return;
      }
      const localRes = evaluateLocally(rubric, latestSub, teachingCtx);
      resBox.innerHTML = buildFeedbackHtml(rubric, localRes, "check_and_key", teachingCtx);
    };

    if (popupTa && onSaveTextFn) {
      popupTa.addEventListener("input", () => onSaveTextFn(popupTa.value));
    }
    const subBtn = bodyEl.querySelector("[data-popup-submit]");
    const keyBtn = bodyEl.querySelector("[data-popup-key]");
    if (subBtn) subBtn.addEventListener("click", () => runEvalInPopup("check_and_key"));
    if (keyBtn) keyBtn.addEventListener("click", () => runEvalInPopup("key_only"));

    const hasContent =
      (curSub.text && curSub.text.trim()) ||
      (curSub.cells && Object.values(curSub.cells).some((v) => v && v.trim())) ||
      (curSub.blanks && Object.values(curSub.blanks).some((v) => v && v.trim())) ||
      (curSub.checked && curSub.checked.length > 0);

    if (hasContent) runEvalInPopup("check_and_key");
    else if (!isSimpleQ) runEvalInPopup("key_only");

    bd.hidden = false;
  }

  /* ---------- 1. Enhance Fillable Tables (table[data-wb-table-id]) ---------- */
  function enhanceFillableTable(tbl, rubrics) {
    const tblId = tbl.getAttribute("data-wb-table-id");
    const rubric = rubrics[tblId];
    if (!rubric) return;

    const savedCells = (answerStore[tblId] && answerStore[tblId].cells) || {};
    const colChoices = rubric.colChoices || {};

    const bodyRows = [...tbl.querySelectorAll("tbody tr")];
    bodyRows.forEach((tr, rIdx) => {
      const tds = [...tr.querySelectorAll("td")];
      tds.forEach((td, cIdx) => {
        if (cIdx === 0) return;
        const already = td.querySelector(".wb-cell-editor");
        const rawText = td.textContent.replace(/\s+/g, "");
        if (!already && rawText !== "") return;

        const cellKey = `${rIdx}_${cIdx}`;
        const choices = colChoices[String(cIdx)];

        if (!already) {
          td.classList.add("wb-fillable-td");
          td.dataset.cellKey = cellKey;
          const wrap = document.createElement("div");
          wrap.className = "wb-cell-editor";

          if (choices && choices.length) {
            const chips = document.createElement("div");
            chips.className = "wb-choice-chips";
            choices.forEach((ch) => {
              const b = document.createElement("button");
              b.type = "button";
              b.className = "wb-choice-chip";
              b.dataset.choiceVal = ch;
              b.textContent = ch;
              chips.appendChild(b);
            });
            const inp = document.createElement("input");
            inp.type = "text";
            inp.className = "wb-cell-short-input";
            inp.placeholder = "เลือกด้านบน หรือพิมพ์ระบุ…";
            wrap.append(chips, inp);
          } else {
            const ta = document.createElement("textarea");
            ta.className = "wb-cell-textarea";
            ta.rows = 2;
            ta.placeholder = "พิมพ์คำตอบ…";
            wrap.appendChild(ta);
          }

          const badge = document.createElement("div");
          badge.className = "wb-cell-feedback-badge";
          badge.hidden = true;
          wrap.appendChild(badge);

          td.replaceChildren(wrap);
        }

        const curVal = savedCells[cellKey] || "";
        const inp = td.querySelector(".wb-cell-short-input, .wb-cell-textarea");
        const chipBtns = [...td.querySelectorAll(".wb-choice-chip")];

        const syncVisual = (val) => {
          if (inp && inp.value !== val) inp.value = val;
          chipBtns.forEach((b) => {
            b.classList.toggle("is-selected", b.dataset.choiceVal === val.trim());
          });
        };
        syncVisual(curVal);

        const persistVal = (val) => {
          if (!answerStore[tblId]) answerStore[tblId] = { cells: {} };
          if (!answerStore[tblId].cells) answerStore[tblId].cells = {};
          answerStore[tblId].cells[cellKey] = val;
          saveStore();
          syncVisual(val);
        };

        if (inp && !inp._iqBound) {
          inp._iqBound = "1";
          inp.addEventListener("input", () => {
            persistVal(inp.value);
            if (inp.tagName === "TEXTAREA") {
              inp.style.height = "auto";
              inp.style.height = `${Math.max(48, inp.scrollHeight)}px`;
            }
          });
        }
        chipBtns.forEach((b) => {
          if (b._iqBound) return;
          b._iqBound = "1";
          b.addEventListener("click", () => {
            const cur = ((answerStore[tblId] && answerStore[tblId].cells && answerStore[tblId].cells[cellKey]) || "").trim();
            const next = cur === b.dataset.choiceVal ? "" : b.dataset.choiceVal;
            persistVal(next);
          });
        });
      });
    });

    const anchorEl = tbl.closest(".table-scroll") || tbl;
    let panel = anchorEl.nextElementSibling;
    if (!panel || !panel.classList.contains("iq-table-dock") || panel.dataset.dockFor !== tblId) {
      panel = document.createElement("div");
      panel.className = "iq-table-dock";
      panel.dataset.dockFor = tblId;
      panel.innerHTML = `
        <div class="iq-btn-row is-table-actions">
          <button type="button" class="iq-btn is-ai" data-tbl-submit>✓ ตรวจคำตอบตารางนี้ &amp; ดูพิกัดอ่านต่อ</button>
          <button type="button" class="iq-btn is-key" data-tbl-key>👁 เฉลยตารางนี้</button>
          <button type="button" class="iq-btn is-popup" data-tbl-popup title="เปิดดูผลการตรวจความเข้าใจและเฉลยในหน้าต่าง Pop-up">⤢ Pop-up</button>
          <button type="button" class="iq-btn is-ghost" data-tbl-clear>ล้างช่องกรอก</button>
        </div>
        <div class="iq-feedback-drawer" hidden></div>
      `;
      anchorEl.insertAdjacentElement("afterend", panel);
    }

    const drawer = panel.querySelector(".iq-feedback-drawer");
    const subBtn = panel.querySelector("[data-tbl-submit]");
    const keyBtn = panel.querySelector("[data-tbl-key]");
    const popBtn = panel.querySelector("[data-tbl-popup]");
    const clrBtn = panel.querySelector("[data-tbl-clear]");

    const getSub = () => ({ cells: (answerStore[tblId] && answerStore[tblId].cells) || {} });

    const applyCellStatuses = (map) => {
      if (!map) return;
      tbl.querySelectorAll(".wb-fillable-td").forEach((td) => {
        const k = td.dataset.cellKey;
        const st = map[k];
        td.classList.remove("is-cell-exact", "is-cell-mismatch", "is-cell-partial");
        const badge = td.querySelector(".wb-cell-feedback-badge");
        if (!badge) return;
        if (st === "exact") {
          td.classList.add("is-cell-exact");
          badge.textContent = "✓ ตรงแนวคำตอบ";
          badge.hidden = false;
        } else if (st === "gibberish") {
          td.classList.add("is-cell-mismatch");
          badge.textContent = "⚠️ พิมพ์ไม่เป็นคำ";
          badge.hidden = false;
        } else if (st === "mismatch") {
          td.classList.add("is-cell-mismatch");
          badge.textContent = "△ ตรวจสอบกับเฉลย";
          badge.hidden = false;
        } else if (st === "partial" || st === "review") {
          td.classList.add("is-cell-partial");
          badge.textContent = "💡 ขยายความเพิ่มได้";
          badge.hidden = false;
        } else {
          badge.hidden = true;
        }
      });
    };

    if (subBtn && !subBtn._iqBound) {
      subBtn._iqBound = "1";
      subBtn.addEventListener("click", () => {
        drawer.hidden = false;
        drawer.dataset.mode = "check_and_key";
        const teachingCtx = extractTeachingContext(rubric);
        const localRes = evaluateLocally(rubric, getSub(), teachingCtx);
        applyCellStatuses(localRes.cellFeedbackMap);
        drawer.innerHTML = buildFeedbackHtml(rubric, localRes, "check_and_key", teachingCtx);
      });
    }
    if (keyBtn && !keyBtn._iqBound) {
      keyBtn._iqBound = "1";
      keyBtn.addEventListener("click", () => {
        const showingKeyOnly = !drawer.hidden && drawer.dataset.mode === "key_only";
        if (showingKeyOnly) {
          drawer.hidden = true;
          drawer.dataset.mode = "";
        } else {
          drawer.hidden = false;
          drawer.dataset.mode = "key_only";
          drawer.innerHTML = buildFeedbackHtml(rubric, null, "key_only");
        }
      });
    }
    if (popBtn && !popBtn._iqBound) {
      popBtn._iqBound = "1";
      popBtn.addEventListener("click", () => {
        openPopupFeedback(rubric.sectionTitle || "ตารางทบทวน", rubric, getSub, null);
      });
    }
    if (clrBtn && !clrBtn._iqBound) {
      clrBtn._iqBound = "1";
      clrBtn.addEventListener("click", () => {
        delete answerStore[tblId];
        saveStore();
        tbl.querySelectorAll(".wb-fillable-td").forEach((td) => {
          td.classList.remove("is-cell-exact", "is-cell-mismatch", "is-cell-partial");
          const inp = td.querySelector(".wb-cell-short-input, .wb-cell-textarea");
          if (inp) inp.value = "";
          td.querySelectorAll(".wb-choice-chip").forEach((b) => b.classList.remove("is-selected"));
          const badge = td.querySelector(".wb-cell-feedback-badge");
          if (badge) badge.hidden = true;
        });
        drawer.hidden = true;
      });
    }
  }

  /* ---------- 2. Enhance Cloze Paragraph (p[data-cloze-id]) ---------- */
  function enhanceClozeParagraph(pEl, rubrics) {
    const cId = pEl.getAttribute("data-cloze-id");
    const rubric = rubrics[cId];
    if (!rubric) return;

    if (!pEl.querySelector(".iq-cloze-input")) {
      pEl.innerHTML = pEl.innerHTML.replace(/\.{3,}\((\d+)\)\.{3,}/g, (_, num) => {
        return `<span class="iq-cloze-slot"><span class="iq-cloze-num">(${num})</span><input type="text" class="iq-cloze-input" data-blank-num="${num}" placeholder="เติมคำ…"></span>`;
      });
    }

    const savedBlanks = (answerStore[cId] && answerStore[cId].blanks) || {};
    pEl.querySelectorAll(".iq-cloze-input").forEach((inp) => {
      const n = inp.dataset.blankNum;
      if (savedBlanks[n] !== undefined) inp.value = savedBlanks[n];
      if (!inp._iqBound) {
        inp._iqBound = "1";
        inp.addEventListener("input", () => {
          if (!answerStore[cId]) answerStore[cId] = { blanks: {} };
          answerStore[cId].blanks[n] = inp.value;
          saveStore();
        });
      }
    });

    let dock = pEl.nextElementSibling;
    if (!dock || !dock.classList.contains("iq-cloze-dock")) {
      dock = document.createElement("div");
      dock.className = "iq-cloze-dock";
      dock.innerHTML = `
        <div class="iq-btn-row">
          <button type="button" class="iq-btn is-ai" data-cloze-submit>✓ ตรวจคำตอบช่องว่าง &amp; ดูคำแนะนำ</button>
          <button type="button" class="iq-btn is-key" data-cloze-key>👁 เฉลย (1)–(7)</button>
          <button type="button" class="iq-btn is-popup" data-cloze-popup>⤢ Pop-up</button>
          <button type="button" class="iq-btn is-ghost" data-cloze-clear>ล้างคำตอบ</button>
        </div>
        <div class="iq-feedback-drawer" hidden></div>
      `;
      pEl.insertAdjacentElement("afterend", dock);
    }

    const drawer = dock.querySelector(".iq-feedback-drawer");
    const getSub = () => ({ blanks: (answerStore[cId] && answerStore[cId].blanks) || {} });

    const subBtn = dock.querySelector("[data-cloze-submit]");
    const keyBtn = dock.querySelector("[data-cloze-key]");
    const popBtn = dock.querySelector("[data-cloze-popup]");
    const clrBtn = dock.querySelector("[data-cloze-clear]");

    if (subBtn && !subBtn._iqBound) {
      subBtn._iqBound = "1";
      subBtn.addEventListener("click", () => {
        drawer.hidden = false;
        drawer.dataset.mode = "check_and_key";
        const teachingCtx = extractTeachingContext(rubric);
        const localRes = evaluateLocally(rubric, getSub(), teachingCtx);
        pEl.querySelectorAll(".iq-cloze-input").forEach((inp) => {
          const st = localRes.blankStatus && localRes.blankStatus[inp.dataset.blankNum];
          inp.classList.toggle("is-exact", st === "exact");
          inp.classList.toggle("is-mismatch", st === "mismatch");
        });
        drawer.innerHTML = buildFeedbackHtml(rubric, localRes, "check_and_key", teachingCtx);
      });
    }
    if (keyBtn && !keyBtn._iqBound) {
      keyBtn._iqBound = "1";
      keyBtn.addEventListener("click", () => {
        drawer.hidden = !drawer.hidden && drawer.dataset.mode === "key_only";
        if (!drawer.hidden) {
          drawer.dataset.mode = "key_only";
          drawer.innerHTML = buildFeedbackHtml(rubric, null, "key_only");
        }
      });
    }
    if (popBtn && !popBtn._iqBound) {
      popBtn._iqBound = "1";
      popBtn.addEventListener("click", () => openPopupFeedback(rubric.sectionTitle, rubric, getSub, null));
    }
    if (clrBtn && !clrBtn._iqBound) {
      clrBtn._iqBound = "1";
      clrBtn.addEventListener("click", () => {
        delete answerStore[cId];
        saveStore();
        pEl.querySelectorAll(".iq-cloze-input").forEach((inp) => {
          inp.value = "";
          inp.classList.remove("is-exact", "is-mismatch");
        });
        drawer.hidden = true;
      });
    }
  }

  /* ---------- 3. Enhance Checklist (ul[data-checklist-id]) ---------- */
  function enhanceChecklist(ulEl, rubrics) {
    const chkId = ulEl.getAttribute("data-checklist-id");
    const rubric = rubrics[chkId];
    if (!rubric) return;

    const saved = answerStore[chkId] || { checked: [], notes: "" };

    [...ulEl.querySelectorAll("li")].forEach((li) => {
      if (!li.querySelector(".iq-chk-box")) {
        const txt = li.innerHTML.replace(/^\s*\[\s*\]\s*/, "");
        const codeM = stripTags(txt).match(/^([ก-ฮ]\.)/);
        const itemCode = codeM ? codeM[1] : stripTags(txt).slice(0, 4);
        li.innerHTML = `<label class="iq-chk-label"><input type="checkbox" class="iq-chk-box" data-item-code="${escapeHtml(itemCode)}"> <span>${txt}</span></label>`;
      }
      const box = li.querySelector(".iq-chk-box");
      if (box) {
        box.checked = (saved.checked || []).includes(box.dataset.itemCode);
        if (!box._iqBound) {
          box._iqBound = "1";
          box.addEventListener("change", () => {
            const cur = answerStore[chkId] || { checked: [], notes: "" };
            const set = new Set(cur.checked || []);
            if (box.checked) set.add(box.dataset.itemCode);
            else set.delete(box.dataset.itemCode);
            cur.checked = [...set];
            answerStore[chkId] = cur;
            saveStore();
          });
        }
      }
    });

    let dock = ulEl.nextElementSibling;
    if (!dock || !dock.classList.contains("iq-checklist-dock")) {
      dock = document.createElement("div");
      dock.className = "iq-checklist-dock";
      dock.innerHTML = `
        <textarea class="iq-textarea" rows="2" placeholder="ระบุเกณฑ์ที่คุณใช้ตัดสินว่ากิจกรรมใดอยู่ในระบบสุขภาพ พร้อมเหตุผลสั้น ๆ…"></textarea>
        <div class="iq-btn-row">
          <button type="button" class="iq-btn is-ai" data-chk-submit>✓ ส่งคำตอบ &amp; ตรวจความเข้าใจ</button>
          <button type="button" class="iq-btn is-key" data-chk-key>👁 เฉลยสังเคราะห์</button>
          <button type="button" class="iq-btn is-popup" data-chk-popup>⤢ Pop-up</button>
        </div>
        <div class="iq-feedback-drawer" hidden></div>
      `;
      ulEl.insertAdjacentElement("afterend", dock);
    }

    const ta = dock.querySelector("textarea.iq-textarea");
    const drawer = dock.querySelector(".iq-feedback-drawer");
    if (ta) {
      ta.value = saved.notes || "";
      if (!ta._iqBound) {
        ta._iqBound = "1";
        ta.addEventListener("input", () => {
          const cur = answerStore[chkId] || { checked: [], notes: "" };
          cur.notes = ta.value;
          answerStore[chkId] = cur;
          saveStore();
        });
      }
    }

    const getSub = () => answerStore[chkId] || { checked: [], notes: "" };
    const subBtn = dock.querySelector("[data-chk-submit]");
    const keyBtn = dock.querySelector("[data-chk-key]");
    const popBtn = dock.querySelector("[data-chk-popup]");
    if (subBtn && !subBtn._iqBound) {
      subBtn._iqBound = "1";
      subBtn.addEventListener("click", () => {
        drawer.hidden = false;
        drawer.dataset.mode = "check_and_key";
        const teachingCtx = extractTeachingContext(rubric);
        const localRes = evaluateLocally(rubric, getSub(), teachingCtx);
        drawer.innerHTML = buildFeedbackHtml(rubric, localRes, "check_and_key", teachingCtx);
      });
    }
    if (keyBtn && !keyBtn._iqBound) {
      keyBtn._iqBound = "1";
      keyBtn.addEventListener("click", () => {
        const closing = !drawer.hidden && drawer.dataset.mode === "key_only";
        drawer.hidden = closing;
        if (!closing) {
          drawer.dataset.mode = "key_only";
          drawer.innerHTML = buildFeedbackHtml(rubric, null, "key_only");
        }
      });
    }
    if (popBtn && !popBtn._iqBound) {
      popBtn._iqBound = "1";
      popBtn.addEventListener("click", () => openPopupFeedback(rubric.sectionTitle, rubric, getSub, null));
    }
  }

  /* ---------- 4. Enhance Individual Questions & Prompts ([data-qa-id]) ---------- */
  function enhanceQuestionNode(el, rubrics) {
    const qaId = el.getAttribute("data-qa-id");
    const mode = el.getAttribute("data-qa-mode") || "open";
    const rubric = rubrics[qaId];
    if (!rubric) return;

    const savedText = (answerStore[qaId] && answerStore[qaId].text) || "";

    let widget = el.querySelector(":scope > .iq-inline-widget");
    if (!widget) {
      let sidePills = el.querySelector(":scope > .iq-side-pills");
      if (!sidePills) {
        sidePills = document.createElement("span");
        sidePills.className = "iq-side-pills";
        sidePills.innerHTML = `
          <button type="button" class="iq-mini-pill is-write" data-iq-toggle-box title="พิมพ์คำตอบเพื่อตรวจความเข้าใจและดูพิกัดอ่านต่อ">✍️ ลองตอบ</button>
          <button type="button" class="iq-mini-pill is-ans" data-iq-quick-key title="แสดง/ซ่อนเฉลยสังเคราะห์ตามเนื้อหา">👁 เฉลย</button>
          <button type="button" class="iq-mini-pill is-pop" data-iq-quick-pop title="เปิดหน้าต่าง Pop-up ลองตอบและเทียบเฉลย">⤢ Pop-up</button>
        `;
        const lastP = el.tagName === "BLOCKQUOTE" ? el.querySelector("p:last-of-type") : null;
        if (lastP) lastP.appendChild(sidePills);
        else el.appendChild(sidePills);
      }

      widget = document.createElement("div");
      widget.className = "iq-inline-widget";
      const startOpen = mode === "open" || Boolean(savedText);
      widget.innerHTML = `
        <div class="iq-editor-shell"${startOpen ? "" : " hidden"}>
          <textarea class="iq-textarea" rows="2" placeholder="พิมพ์คำตอบด้วยภาษาของตนเอง แล้วกดตรวจความเข้าใจเพื่อดูประเด็นที่เข้าใจดี จุดที่ควรเสริม และลิงก์อ่านต่อ (บันทึกอัตโนมัติ)…"></textarea>
          <div class="iq-btn-row">
            <button type="button" class="iq-btn is-ai" data-iq-submit>✓ ส่งคำตอบ &amp; ตรวจความเข้าใจ</button>
            <button type="button" class="iq-btn is-key" data-iq-key>👁 เฉลยข้อนี้</button>
            <button type="button" class="iq-btn is-popup" data-iq-popup>⤢ Pop-up</button>
            <button type="button" class="iq-btn is-ghost" data-iq-clear>ล้าง</button>
          </div>
        </div>
        <div class="iq-feedback-drawer" hidden></div>
      `;
      el.appendChild(widget);
    }

    const editorShell = widget.querySelector(".iq-editor-shell");
    const ta = widget.querySelector("textarea.iq-textarea");
    const drawer = widget.querySelector(".iq-feedback-drawer");

    if (ta && ta.value !== savedText) {
      ta.value = savedText;
    }

    const saveText = (val) => {
      answerStore[qaId] = { text: val };
      saveStore();
      if (ta && ta.value !== val) ta.value = val;
    };

    if (ta && !ta._iqBound) {
      ta._iqBound = "1";
      ta.addEventListener("input", () => {
        saveText(ta.value);
        ta.style.height = "auto";
        ta.style.height = `${Math.max(58, ta.scrollHeight)}px`;
      });
    }

    const runSubmit = () => {
      if (editorShell && editorShell.hidden) editorShell.hidden = false;
      drawer.hidden = false;
      drawer.dataset.mode = "check_and_key";
      const sub = { text: (ta && ta.value) || "" };
      const teachingCtx = extractTeachingContext(rubric);
      const localRes = evaluateLocally(rubric, sub, teachingCtx);
      drawer.innerHTML = buildFeedbackHtml(rubric, localRes, "check_and_key", teachingCtx);
    };

    const toggleKeyInline = () => {
      const closing = !drawer.hidden && drawer.dataset.mode === "key_only";
      if (closing) {
        drawer.hidden = true;
        drawer.dataset.mode = "";
      } else {
        drawer.hidden = false;
        drawer.dataset.mode = "key_only";
        drawer.innerHTML = buildFeedbackHtml(rubric, null, "key_only");
      }
    };

    const openPopup = () => {
      const label = rubric.num ? `${rubric.docId || ""} · ข้อที่ ${rubric.num}` : rubric.sectionTitle || rubric.docId || "คำถามทบทวน";
      openPopupFeedback(label, rubric, () => ({ text: (ta && ta.value) || "" }), saveText);
    };

    const toggleBoxBtn = el.querySelector("[data-iq-toggle-box]");
    const quickKeyBtn = el.querySelector("[data-iq-quick-key]");
    const quickPopBtn = el.querySelector("[data-iq-quick-pop]");
    const subBtn = widget.querySelector("[data-iq-submit]");
    const keyBtn = widget.querySelector("[data-iq-key]");
    const popBtn = widget.querySelector("[data-iq-popup]");
    const clrBtn = widget.querySelector("[data-iq-clear]");

    if (toggleBoxBtn && !toggleBoxBtn._iqBound) {
      toggleBoxBtn._iqBound = "1";
      toggleBoxBtn.addEventListener("click", () => {
        if (editorShell) {
          editorShell.hidden = !editorShell.hidden;
          if (!editorShell.hidden && ta) ta.focus();
        }
      });
    }
    if (quickKeyBtn && !quickKeyBtn._iqBound) {
      quickKeyBtn._iqBound = "1";
      quickKeyBtn.addEventListener("click", toggleKeyInline);
    }
    if (quickPopBtn && !quickPopBtn._iqBound) {
      quickPopBtn._iqBound = "1";
      quickPopBtn.addEventListener("click", openPopup);
    }
    if (subBtn && !subBtn._iqBound) {
      subBtn._iqBound = "1";
      subBtn.addEventListener("click", runSubmit);
    }
    if (keyBtn && !keyBtn._iqBound) {
      keyBtn._iqBound = "1";
      keyBtn.addEventListener("click", toggleKeyInline);
    }
    if (popBtn && !popBtn._iqBound) {
      popBtn._iqBound = "1";
      popBtn.addEventListener("click", openPopup);
    }
    if (clrBtn && !clrBtn._iqBound) {
      clrBtn._iqBound = "1";
      clrBtn.addEventListener("click", () => {
        delete answerStore[qaId];
        saveStore();
        if (ta) {
          ta.value = "";
          ta.style.height = "";
        }
        drawer.hidden = true;
      });
    }
  }

  /* ---------- 5. Public Container Enhancer & Practice Tab Card Builder ---------- */
  function enhanceContainer(rootEl) {
    if (!rootEl) return;
    const rubrics = getRubrics();
    if (!rubrics) return;

    rootEl.querySelectorAll("table[data-wb-table-id]").forEach((tbl) => enhanceFillableTable(tbl, rubrics));
    rootEl.querySelectorAll("p[data-cloze-id]").forEach((p) => enhanceClozeParagraph(p, rubrics));
    rootEl.querySelectorAll("ul[data-checklist-id]").forEach((ul) => enhanceChecklist(ul, rubrics));
    rootEl.querySelectorAll("[data-qa-id]").forEach((el) => enhanceQuestionNode(el, rubrics));
  }

  function enhancePracticeCard(cardEl, item) {
    const rubrics = getRubrics();
    const scId = `selfcheck_${item.id}`;
    const rubric = rubrics[scId] || {
      id: scId,
      docId: item.module,
      kind: "question",
      num: item.num,
      specKey: item.specKey || "",
      specTitle: item.specTitle || "",
      fullAnchor: item.fullAnchor || "",
      conciseAnchor: item.conciseAnchor || "",
      prompt: item.question,
      answerHtml: `<div class="iq-model-prose">${item.answerHtml || ""}</div>`,
    };

    const savedText = (answerStore[scId] && answerStore[scId].text) || "";
    const ui = document.createElement("div");
    ui.className = "iq-practice-card-body";
    ui.innerHTML = `
      <textarea class="iq-textarea" rows="3" placeholder="พิมพ์คำตอบด้วยภาษาของตนเอง แล้วกดตรวจความเข้าใจเพื่อดูประเด็นที่เข้าใจดี จุดที่ควรเสริม และลิงก์อ่านต่อ (บันทึกอัตโนมัติ)…">${escapeHtml(savedText)}</textarea>
      <div class="iq-btn-row">
        <button type="button" class="iq-btn is-ai" data-sc-submit>✓ ส่งคำตอบ &amp; ตรวจความเข้าใจ</button>
        <button type="button" class="iq-btn is-key" data-sc-key>👁 เฉลยสังเคราะห์</button>
        <button type="button" class="iq-btn is-popup" data-sc-popup>⤢ Pop-up</button>
        <button type="button" class="iq-btn is-ghost" data-sc-clear>ล้าง</button>
      </div>
      <div class="iq-feedback-drawer" hidden></div>
    `;

    const ta = ui.querySelector("textarea.iq-textarea");
    const drawer = ui.querySelector(".iq-feedback-drawer");
    const saveText = (val) => {
      answerStore[scId] = { text: val };
      saveStore();
      if (ta && ta.value !== val) ta.value = val;
    };

    ta.addEventListener("input", () => saveText(ta.value));
    ui.querySelector("[data-sc-submit]").addEventListener("click", () => {
      drawer.hidden = false;
      drawer.dataset.mode = "check_and_key";
      const sub = { text: ta.value };
      const teachingCtx = extractTeachingContext(rubric);
      const localRes = evaluateLocally(rubric, sub, teachingCtx);
      drawer.innerHTML = buildFeedbackHtml(rubric, localRes, "check_and_key", teachingCtx);
    });
    ui.querySelector("[data-sc-key]").addEventListener("click", () => {
      const closing = !drawer.hidden && drawer.dataset.mode === "key_only";
      drawer.hidden = closing;
      if (!closing) {
        drawer.dataset.mode = "key_only";
        drawer.innerHTML = buildFeedbackHtml(rubric, null, "key_only");
      }
    });
    ui.querySelector("[data-sc-popup]").addEventListener("click", () => {
      openPopupFeedback(`${item.module} · ข้อที่ ${item.num}`, rubric, () => ({ text: ta.value }), saveText);
    });
    ui.querySelector("[data-sc-clear]").addEventListener("click", () => {
      delete answerStore[scId];
      saveStore();
      ta.value = "";
      drawer.hidden = true;
    });

    cardEl.appendChild(ui);
  }

  function toggleAllInlineAnswers(scopeEl, shouldOpen) {
    if (!scopeEl) return;
    const rubrics = getRubrics();
    scopeEl.querySelectorAll("[data-qa-id]").forEach((el) => {
      const qaId = el.getAttribute("data-qa-id");
      const r = rubrics[qaId];
      const drawer = el.querySelector(":scope > .iq-inline-widget > .iq-feedback-drawer");
      if (!drawer || !r) return;
      if (shouldOpen) {
        drawer.hidden = false;
        if (!drawer.innerHTML.trim()) {
          drawer.dataset.mode = "key_only";
          drawer.innerHTML = buildFeedbackHtml(r, null, "key_only");
        }
      } else {
        drawer.hidden = true;
      }
    });
    scopeEl.querySelectorAll(".iq-table-dock").forEach((dock) => {
      const tblId = dock.dataset.dockFor;
      const r = rubrics[tblId];
      const drawer = dock.querySelector(".iq-feedback-drawer");
      if (!drawer || !r) return;
      if (shouldOpen) {
        drawer.hidden = false;
        if (!drawer.innerHTML.trim()) {
          drawer.dataset.mode = "key_only";
          drawer.innerHTML = buildFeedbackHtml(r, null, "key_only");
        }
      } else {
        drawer.hidden = true;
      }
    });
  }

  /* ---------- Global Deep-Link Click Handler (Jump Straight to ฉบับย่อ or ฉบับเต็ม Heading) ---------- */
  document.addEventListener("click", (ev) => {
    if (ev.target && ev.target.closest && ev.target.closest("[data-kt-open]")) {
      if (modalBackdrop && !modalBackdrop.hidden) {
        modalBackdrop.hidden = true;
      }
      return;
    }
    const link = ev.target && ev.target.closest ? ev.target.closest("[data-racm-doc]") : null;
    if (!link) return;
    ev.preventDefault();
    const docId = link.getAttribute("data-racm-doc") || "";
    const anchorId = link.getAttribute("data-racm-anchor") || "";
    if (!docId) return;

    if (modalBackdrop && !modalBackdrop.hidden) {
      modalBackdrop.hidden = true;
    }
    if (window.RACM_SECTION_TAKEAWAYS && typeof window.RACM_SECTION_TAKEAWAYS.closeTakeawayModal === "function") {
      window.RACM_SECTION_TAKEAWAYS.closeTakeawayModal();
    }

    if (typeof window.racmOpenTextbookDoc === "function") {
      window.racmOpenTextbookDoc(docId, anchorId);
    }
  });

  window.RACMInteractiveQA = {
    enhanceContainer,
    enhancePracticeCard,
    toggleAllInlineAnswers,
    // Diagnostic / test hooks
    analyzeSubmissionQuality,
    extractTeachingContext,
    evaluateLocally,
    buildConceptualizedAnswerHtml,
  };
})();
