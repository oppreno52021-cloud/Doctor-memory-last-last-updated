import { Doctor, UserProfile, Product, Visit, WorkDay, MonthWeek } from '../types';
import * as XLSX from 'xlsx';

/**
 * Returns today's Arabic day name if it is within workdays (السبت إلى الأربعاء)
 */
export function getCurrentArabicWorkDay(): WorkDay | null {
  const dayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  switch (dayIndex) {
    case 6:
      return 'السبت';
    case 0:
      return 'الأحد';
    case 1:
      return 'الإثنين';
    case 2:
      return 'الثلاثاء';
    case 3:
      return 'الأربعاء';
    default:
      // Thursday or Friday (weekend)
      return null;
  }
}

/**
 * Returns the current week number of the month (1 to 4)
 */
export function getCurrentMonthWeek(): MonthWeek {
  const dayOfMonth = new Date().getDate();
  if (dayOfMonth <= 7) return 1;
  if (dayOfMonth <= 14) return 2;
  if (dayOfMonth <= 21) return 3;
  return 4;
}

/**
 * Formats a Date object to Arabic display: e.g. "السبت 5 سبتمبر 2026"
 */
export function getFormattedTodayArabic(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return now.toLocaleDateString('ar-EG', options);
}

/**
 * Checks if a doctor is planned for a specific workday and week
 */
export function isDoctorPlanned(
  doctor: Doctor,
  day: WorkDay | null,
  week: MonthWeek
): boolean {
  if (!day || !doctor.planDay) return false;
  if (doctor.planDay !== day) return false;
  if (!doctor.planWeeks || doctor.planWeeks.length === 0) return true;
  return (doctor.planWeeks || []).includes(week);
}

export const DEFAULT_CHATGPT_PROMPT_TEMPLATE = `أنا مندوب دعاية طبية (Medical Representative) لشركة "{companyName}" في خط "{line}".
أستعد حالياً للدخول في زيارة طبية ترويجية مع الطبيب:
• اسم الطبيب: {doctorName}
• التخصص الطبي: {specialty}
• التصنيف (Class): {classification}
• المنطقة: {territory}
• الأدوية المستهدفة في الزيارة: {products}
{lovesSamplesNote}
• ملاحظات الزيارة السابقة: {lastVisitNote}

المطلوب منك في نقاط محددة وعملية جداً أستعين بها خلال دقيقتين:
1. اقترح مدخل حوار افتتاحي ذكي ومختصر (Opening Hook) يتناسب مع تخصصه.
2. ما هو أهم اعتراض سريري أو سعري متوقع من طبيب {specialty} بخصوص هذا الصنف، وكيف أرد عليه علمياً باختصار وإقناع؟
3. {closingRequest}
يرجى كتابة النقاط بلغة عربية سلسة ومباشرة يمكنني استخدامها فوراً.`;

/**
 * Generates an intelligent, ready-to-use prompt for ChatGPT tailored for the doctor
 */
export function generateChatGptPrompt(
  doctor: Doctor,
  userProfile: UserProfile,
  products: Product[],
  doctorVisits: Visit[]
): string {
  const targetedProductsNames = products
    .filter((p) => (doctor.targetedProductIds || []).includes(p.id))
    .map((p) => p.name)
    .join(' ، ');

  const lastVisit = doctorVisits.length > 0 ? doctorVisits[0] : null;

  const lovesSamplesNote = doctor.lovesSamples
    ? '• ملاحظة هامة جداً: الطبيب يفضل العينات الطبية بشدة ويحرص على تسليمها للمرضى لتجربة العلاج.'
    : '';

  const lastVisitNote = doctor.lastVisitNote
    ? doctor.lastVisitNote
    : lastVisit?.notes
    ? lastVisit.notes
    : 'هذه زيارة أولى أو تعارف جديد مع الطبيب.';

  const closingRequest = doctor.lovesSamples
    ? 'أفضل أسلوب لتقديم العينات وربطها بالتزام الطبيب بوصف الدواء في الروشتات للمرضى.'
    : 'أفضل جملة إغلاق وطلب التزام بكتابة الدواء في الروشتة (Trial Closing).';

  const template = (userProfile.customChatGptPrompt && userProfile.customChatGptPrompt.trim().length > 0)
    ? userProfile.customChatGptPrompt
    : DEFAULT_CHATGPT_PROMPT_TEMPLATE;

  return template
    .replace(/{repName}/g, userProfile.repName || 'المندوب')
    .replace(/{companyName}/g, userProfile.companyName || 'الشركة')
    .replace(/{line}/g, userProfile.line || 'الخط الدوائي')
    .replace(/{doctorName}/g, doctor.name)
    .replace(/{specialty}/g, doctor.specialty)
    .replace(/{classification}/g, doctor.classification)
    .replace(/{territory}/g, doctor.territory)
    .replace(/{products}/g, targetedProductsNames || 'مستحضرات الخط الدوائي')
    .replace(/{lovesSamplesNote}/g, lovesSamplesNote)
    .replace(/{lastVisitNote}/g, lastVisitNote)
    .replace(/{closingRequest}/g, closingRequest);
}

/**
 * Generates a clean Daily Call Report text ready to share or copy
 */
export function generateDailyCallReport(
  visits: Visit[],
  doctors: Doctor[],
  userProfile: UserProfile,
  dateStr?: string
): string {
  const safeVisits = Array.isArray(visits) ? visits : [];
  const safeDoctors = Array.isArray(doctors) ? doctors : [];
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const dayVisits = safeVisits.filter((v) => v && v.date === targetDate);

  let report = `📋 *تقرير الزيارات اليومي (Daily Call Report)*\n`;
  report += `👤 المندوب: ${userProfile?.repName || 'المندوب'}\n`;
  report += `🏢 الشركة: ${userProfile?.companyName || 'الشركة'}\n`;
  report += `📍 المنطقة: ${userProfile?.territory || 'المنطقة الرئيسية'}\n`;
  report += `📅 التاريخ: ${targetDate} (${getFormattedTodayArabic()})\n`;
  report += `📊 إجمالي الزيارات المسجلة: ${dayVisits.length} زيارات\n`;
  report += `────────────────────────────\n\n`;

  if (dayVisits.length === 0) {
    report += `لا توجد زيارات مسجلة لهذا اليوم حتى الآن.\n`;
    return report;
  }

  dayVisits.forEach((visit, index) => {
    const doc = safeDoctors.find((d) => d.id === visit.doctorId);
    report += `*${index + 1}. ${visit.doctorName || 'طبيب'}*\n`;
    if (doc) {
      report += `• التخصص والمنطقة: ${doc.specialty || ''} (${doc.territory || ''}) - فئة ${doc.classification || ''}\n`;
    }
    const prods = (visit.productsDiscussed || []).join(' ، ');
    report += `• الأدوية المعروضة: ${prods || 'مراجعة عامة'}\n`;
    report += `• رد فعل الطبيب: ${visit.doctorReaction || 'إيجابي'}\n`;
    if (Array.isArray(visit.samplesGiven) && visit.samplesGiven.length > 0) {
      report += `• العينات المتروكة: ${visit.samplesGiven.map((s) => `${s.productName} (${s.quantity})`).join(' ، ')}\n`;
    }
    if (visit.notes) {
      report += `• الملاحظات والاتفاق: ${visit.notes}\n`;
    }
    report += `\n`;
  });

  return report;
}

/**
 * Generates an Excel Template for importing doctors
 */
export function downloadDoctorsExcelTemplate() {
  const sampleData = [
    {
      'الاسم': 'أ.د. محمد صلاح الدين',
      'الكلاس': 'A+',
      'التخصص': 'أمراض قلب وأوعية',
      'المنطقة': 'مصر الجديدة',
      'يفضل العينات': 'نعم',
    },
    {
      'الاسم': 'د. ريهام أحمد عثمان',
      'الكلاس': 'A',
      'التخصص': 'باطنة عامة وسكري',
      'المنطقة': 'مدينة نصر',
      'يفضل العينات': 'نعم',
    },
    {
      'الاسم': 'د. خالد عبد الله القاضي',
      'الكلاس': 'B',
      'التخصص': 'جراحة عظام ومفاصل',
      'المنطقة': 'المعادي',
      'يفضل العينات': 'لا',
    },
    {
      'الاسم': 'د. نادية فوزي خليل',
      'الكلاس': 'B',
      'التخصص': 'أطفال وحديثي ولادة',
      'المنطقة': 'الدقي',
      'يفضل العينات': 'نعم',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قائمة_الأطباء');
  XLSX.writeFile(workbook, 'Doctors_Template_نموذج_الأطباء.xlsx');
}

/**
 * Parses an Excel or CSV file into Doctor objects
 */
export async function parseDoctorsFile(file: File): Promise<Partial<Doctor>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet);

        const doctors: Partial<Doctor>[] = jsonRows.map((row: any, idx: number) => {
          // Flexible key lookup to handle variations (Arabic / English)
          const name =
            row['الاسم'] || row['اسم الطبيب'] || row['Name'] || row['Doctor Name'] || `طبيب ${idx + 1}`;
          
          let classification =
            row['الكلاس'] || row['الفئة'] || row['Class'] || row['Classification'] || 'B';
          classification = String(classification).trim().toUpperCase();
          if (!['A+', 'A', 'B', 'C'].includes(classification)) {
            classification = 'B';
          }

          // استخراج التخصص الطبي بمرونة تامة من شيت الإكسيل
          let specialty = '';
          const specialtyKeys = [
            'التخصص الطبي',
            'التخصص',
            'تخصص',
            'تخصص الطبيب',
            'Specialty',
            'Speciality',
            'Specialization',
            'Doctor Specialty',
            'Medical Specialty',
          ];
          for (const key of specialtyKeys) {
            if (row[key] !== undefined && String(row[key]).trim().length > 0) {
              specialty = String(row[key]).trim();
              break;
            }
          }
          if (!specialty) {
            // بحث ذكي في أسماء الأعمدة إذا كانت تحتوي على تخصص أو special
            const foundKey = Object.keys(row).find((k) =>
              k.includes('تخصص') || k.toLowerCase().includes('special')
            );
            if (foundKey && row[foundKey] !== undefined) {
              specialty = String(row[foundKey]).trim();
            }
          }
          if (!specialty) {
            specialty = 'عام';
          }
          
          // استخراج المنطقة
          let territory = '';
          const territoryKeys = ['المنطقة', 'Area', 'Territory', 'منطقة'];
          for (const key of territoryKeys) {
            if (row[key] !== undefined && String(row[key]).trim().length > 0) {
              territory = String(row[key]).trim();
              break;
            }
          }
          if (!territory) {
            const foundAreaKey = Object.keys(row).find((k) =>
              k.includes('منطقة') || k.toLowerCase().includes('area') || k.toLowerCase().includes('territory')
            );
            if (foundAreaKey && row[foundAreaKey] !== undefined) {
              territory = String(row[foundAreaKey]).trim();
            }
          }
          if (!territory) {
            territory = 'المنطقة الرئيسية';
          }

          const lovesSamplesRaw =
            row['يفضل العينات'] || row['عينات'] || row['Samples'] || '';
          const lovesSamples =
            String(lovesSamplesRaw).toLowerCase().includes('نعم') ||
            String(lovesSamplesRaw).toLowerCase().includes('yes') ||
            String(lovesSamplesRaw).toLowerCase().includes('true') ||
            lovesSamplesRaw === 1 ||
            lovesSamplesRaw === '1';

          // استخراج يوم الخطة إن وجد في الإكسيل
          let planDay: WorkDay | undefined;
          const dayKeys = ['اليوم', 'يوم الزيارة', 'يوم الخطة', 'Day', 'Plan Day'];
          for (const dk of dayKeys) {
            if (row[dk]) {
              const val = String(row[dk]).trim();
              if (['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'].includes(val)) {
                planDay = val as WorkDay;
                break;
              }
            }
          }

          return {
            id: `doc-imported-${Date.now()}-${idx}`,
            name: String(name).trim(),
            classification: classification as any,
            specialty: String(specialty).trim(),
            territory: String(territory).trim(),
            lovesSamples,
            planDay,
            totalVisitsCount: 0,
          };
        });

        resolve(doctors);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
