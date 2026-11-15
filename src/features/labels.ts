import type {
  AppealKind,
  DocumentKind,
  AppealStatus,
  CaseStage,
  CaseType,
  HearingMode,
  HearingStatus,
  JudgmentOutcome,
  MemoKind,
  MemoStatus,
  PartyRole,
} from '@/api/types';

/** المسميات العربية لكل القيم المعرّفة في نماذج البيانات. */

export const stageLabels: Record<CaseStage, string> = {
  assessment: 'التقييم',
  drafting: 'إعداد الصحيفة',
  filed: 'قُيدت',
  hearings: 'الجلسات',
  reserved: 'حجز للحكم',
  judgment: 'صدر الحكم',
  objection_window: 'مهلة الاعتراض',
  appeal: 'الاستئناف',
  final: 'حكم نهائي',
  execution: 'التنفيذ',
  closed: 'أغلقت',
};

export const stageDescriptions: Record<CaseStage, string> = {
  assessment: 'نفهم قضيتك ونقيّم موقفك قبل أي خطوة',
  drafting: 'جمع المستندات وصياغة صحيفة الدعوى',
  filed: 'قُيدت الدعوى وبانتظار أول جلسة',
  hearings: 'القضية منظورة أمام المحكمة',
  reserved: 'انتهت المرافعة وحُجزت القضية للنطق بالحكم',
  judgment: 'صدر الحكم ونحلله معك',
  objection_window: 'مدة الاعتراض تسري، والوقت مهم',
  appeal: 'الاعتراض منظور أمام محكمة الاستئناف',
  final: 'اكتسب الحكم القطعية',
  execution: 'تنفيذ الحكم',
  closed: 'انتهت القضية',
};

/** المراحل المختصرة التي تظهر في شريط التقدم. */
export const journeyStages: CaseStage[] = ['assessment', 'drafting', 'filed', 'hearings', 'judgment', 'objection_window', 'execution'];

export const caseTypeLabels: Record<CaseType, string> = {
  labor: 'عمالية',
  commercial: 'تجارية',
  personal_status: 'أحوال شخصية',
  general: 'عامة',
  administrative: 'إدارية',
  criminal: 'جزائية',
  execution: 'تنفيذ',
};

export const roleLabels: Record<PartyRole, string> = {
  plaintiff: 'مدعٍ',
  defendant: 'مدعى عليه',
};

export const hearingStatusLabels: Record<HearingStatus, string> = {
  scheduled: 'مجدولة',
  held: 'منعقدة',
  postponed: 'مؤجلة',
  cancelled: 'ملغاة',
};

export const hearingModeLabels: Record<HearingMode, string> = {
  remote: 'عن بعد',
  in_person: 'حضوري',
};

export const memoKindLabels: Record<MemoKind, string> = {
  statement_of_claim: 'صحيفة دعوى',
  reply: 'مذكرة جوابية',
  rejoinder: 'مذكرة تعقيبية',
  closing: 'مذكرة ختامية',
  appeal: 'لائحة اعتراضية',
  other: 'مذكرة',
};

export const memoStatusLabels: Record<MemoStatus, string> = {
  draft: 'مسودة',
  review: 'قيد المراجعة',
  submitted: 'مقدّمة',
};

export const outcomeLabels: Record<JudgmentOutcome, string> = {
  in_favor: 'لصالحك',
  against: 'ضدك',
  partial: 'لصالحك جزئياً',
};

export const appealKindLabels: Record<AppealKind, string> = {
  appeal: 'استئناف',
  cassation: 'نقض',
  reconsideration: 'التماس إعادة نظر',
};

export const appealStatusLabels: Record<AppealStatus, string> = {
  not_started: 'لم يبدأ',
  drafting: 'قيد الصياغة',
  submitted: 'مقدّم',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

export const documentKindLabels: Record<DocumentKind, string> = {
  minute: 'محضر جلسة',
  judgment: 'صك حكم',
  contract: 'عقد',
  evidence: 'إثبات',
  other: 'مستند',
};
