export type DoctorClass = 'A+' | 'A' | 'B' | 'C' | string;

export type WorkDay = 'السبت' | 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء';
export type MonthWeek = 1 | 2 | 3 | 4;

export type DoctorSpecialty =
  | 'باطنة عامة'
  | 'أمراض قلب وأوعية'
  | 'طب أطفال وحديثي ولادة'
  | 'جراحة عظام ومفاصل'
  | 'جهاز هضمي وكبد'
  | 'نساء وتوليد'
  | 'أمراض صدرية وحساسية'
  | 'مخ وأعصاب'
  | 'جلدية وتناسلية'
  | 'مسالك بولية';

export interface Doctor {
  id: string;
  name: string;
  specialty: DoctorSpecialty | string;
  classification: DoctorClass;
  territory: string; // المنطقة
  hospitalOrClinic?: string;
  address?: string;
  phone?: string;
  bestVisitTime?: string;
  targetedProductIds?: string[];
  potentialRating?: number; // 1 to 5
  loyaltyLevel?: 'مرتفع' | 'متوسط' | 'منخفض' | 'جديد';
  lastVisitDate?: string;
  lastVisitNote?: string;
  totalVisitsCount: number;
  notes?: string;
  // New approved fields
  lovesSamples?: boolean; // محب للعينات ويستخدمها للمرضى
  planDay?: WorkDay; // يوم الزيارة المعتمد بالخطة (السبت إلى الأربعاء)
  planWeeks?: MonthWeek[]; // أسابيع الزيارة في الشهر [1, 2, 3, 4]
}

export type DoctorReaction = 'ممتاز / إيجابي جداً' | 'إيجابي' | 'محايد' | 'متردد' | 'معترض';

export interface Visit {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  productsDiscussed: string[]; // product IDs or names
  doctorReaction: DoctorReaction;
  samplesGiven: { productName: string; quantity: number }[];
  objectionRaised?: string;
  objectionResponse?: string;
  nextVisitDate?: string;
  notes?: string;
  durationMinutes?: number;
  status: 'تمت' | 'مجدولة' | 'مؤجلة';
}

export interface Product {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  indications: string[];
  keySellingPoints: string[];
  price: number;
  currency: string;
  sampleStock: number;
  colorTheme?: string;
}

export interface Objection {
  id: string;
  productId: string;
  productName: string;
  objectionText: string;
  category: 'سعر وتكلفة' | 'فاعلية وسرعة' | 'أمان وآثار جانبية' | 'اعتياد على بديل' | 'توفر بالصيدليات';
  scientificRebuttal: string;
  clinicalEvidence?: string;
}

export interface UserProfile {
  repName: string;
  companyName: string;
  territory: string;
  line: string;
  dailyTargetVisits: number;
  customChatGptPrompt?: string;
}

export interface AIBrief {
  doctorName: string;
  specialty: string;
  summary: string;
  callObjective: string;
  recommendedProducts: { name: string; rationale: string }[];
  anticipatedObjections: { objection: string; suggestedRebuttal: string }[];
  keyTalkingPoints: string[];
  suggestedOpening: string;
}

export interface DailyTask {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: string;
}

export type ActiveTab = 'home' | 'doctors' | 'visits' | 'products' | 'settings';

export type AppFontSize = 'normal' | 'medium' | 'large';
export type AppTheme = 'light' | 'dark';

