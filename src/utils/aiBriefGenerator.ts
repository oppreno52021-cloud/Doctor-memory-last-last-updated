import { Doctor, Product, Objection, Visit, AIBrief } from '../types';

export function generateDoctorAIBrief(
  doctor: Doctor,
  products: Product[],
  objections: Objection[],
  pastVisits: Visit[]
): AIBrief {
  const targetedIds = doctor.targetedProductIds || [];
  const targetedProducts = products.filter((p) => targetedIds.includes(p.id));
  const relevantObjections = objections.filter((obj) => targetedIds.includes(obj.productId));
  const doctorVisits = (pastVisits || []).filter((v) => v.doctorId === doctor.id);
  const lastVisit = doctorVisits.length > 0 ? doctorVisits[0] : null;

  // 1. Generate Call Objective based on loyalty & class
  let callObjective = '';
  if (doctor.loyaltyLevel === 'مرتفع') {
    callObjective = `الحفاظ على ولاء الطبيب وتوسيع قاعدة المرضى لتشمل الحالات المعقدة وطلب كتابة ${targetedProducts.map((p) => p.name).join(' و ')} لمرضى جدد هذا الأسبوع.`;
  } else if (doctor.loyaltyLevel === 'متوسط') {
    callObjective = `تحويل التردد إلى التزام منتظم من خلال التركيز على نتائج المرضى الإيجابية ومعالجة أي اعتراض سابق حول البدائل.`;
  } else {
    callObjective = `بناء انطباع أولي قوي، وتقديم عينات مجانية، والحصول على تجربة سريرية (Trial Prescription) لـ 3 إلى 5 مرضى.`;
  }

  // 2. Suggested Opening Hook
  let suggestedOpening = '';
  if (lastVisit && lastVisit.notes) {
    const prods = (lastVisit.productsDiscussed || []).join(' و ');
    suggestedOpening = `مساء الخير د. ${doctor.name.split(' ')[1] || doctor.name}، في زيارتنا السابقة يوم ${lastVisit.date} تحدثنا عن ${prods}، حابب أطمئن على نتائج الحالات التي بدأوا العلاج مؤخراً ومشاركتك أحدث دراسة تدعم سرعة استجابتهم.`;
  } else {
    suggestedOpening = `مرحباً دكتورنا الفاضل، أعلم أن وقت عيادتكم ثمين للغاية، لذلك أحضرت لحضرتكم في دقيقتين فقط ملخصاً لحل دوائي فعال سيساعد مرضاكم المصابين بـ ${doctor.specialty} في تحقيق نتائج أسرع دون آثار جانبية.`;
  }

  // 3. Recommended Products with Rationale
  const recommendedProducts = targetedProducts.map((prod) => {
    let rationale = `مطابق لاحتياجات تخصص ${doctor.specialty}.`;
    const cat = prod.category || '';
    if (cat.includes('قلب') || cat.includes('ضغط')) {
      rationale = 'حماية مزدوجة للشرايين والضغط مع تقليل تورم الكاحلين للمرضى كبار السن.';
    } else if (cat.includes('أعصاب')) {
      rationale = 'حل فعال لتنميل القدمين والتهاب الأعصاب السكري بدون إزعاج الحقن المتكررة.';
    } else if (cat.includes('عظام')) {
      rationale = 'تسكين التهابي سريع مع دياكيرين وبناء غضروفي طويل المدى لمرضى الخشونة.';
    } else if (cat.includes('هضمي')) {
      rationale = 'تقنية المابس تضمن حموضة متحكم بها 24 ساعة وحماية من قرح المسكنات.';
    }
    return {
      name: prod.name,
      rationale,
    };
  });

  // 4. Anticipated Objections & Rebuttals
  const anticipatedObjections =
    relevantObjections.length > 0
      ? relevantObjections.slice(0, 2).map((obj) => ({
          objection: obj.objectionText,
          suggestedRebuttal: obj.scientificRebuttal,
        }))
      : [
          {
            objection: 'المرضى معتادون على الأدوية القديمة أو البدائل الأرخص.',
            suggestedRebuttal:
              'التأكيد على أن قرصاً واحداً أو كيس فوار عالي الامتصاص يرفع التزام المريض ويوفر عليه تكاليف المضاعفات ودخول الطوارئ.',
          },
        ];

  // 5. Key Talking Points
  const keyTalkingPoints: string[] = [];
  targetedProducts.forEach((p) => {
    if (p.keySellingPoints[0]) keyTalkingPoints.push(p.keySellingPoints[0]);
    if (p.keySellingPoints[1]) keyTalkingPoints.push(p.keySellingPoints[1]);
  });
  if (keyTalkingPoints.length === 0) {
    keyTalkingPoints.push('التركيز على الجرعة المريحة مرة واحدة يومياً لضمان التزام المريض.');
    keyTalkingPoints.push('توفير عينات كافية بالعيادة والتأكد من توافر الدواء بصيدليات المحيط.');
  }

  const summary = `الطبيب ذو تصنيف (${doctor.classification}) وتأثير عالٍ في منطقة ${doctor.territory}. أفضل وقت لزيارته هو ${doctor.bestVisitTime}. تفاعل الزيارات السابقة كان (${lastVisit ? lastVisit.doctorReaction : 'واعداً'}). الهدف اليوم هو إغلاق الالتزام بزيادة الوصفات.`;

  return {
    doctorName: doctor.name,
    specialty: doctor.specialty,
    summary,
    callObjective,
    recommendedProducts,
    anticipatedObjections,
    keyTalkingPoints,
    suggestedOpening,
  };
}
