/**
 * نماذج البيانات (Domain Models) لتطبيق محاميك.
 * هذه هي "العقدة" بين التطبيق وخلفية الرائد: أي خلفية تُرجع هذه الأشكال
 * تعمل مع التطبيق مباشرة.
 */

export type ID = string;
export type ISODate = string;

/* ---------- المستخدم والمصادقة ---------- */

export type User = {
  id: ID;
  name: string;
  phone: string;
  nationalId?: string;
  email?: string;
  plan: 'free' | 'pro';
};

export type OtpRequest = { phone: string };
export type OtpRequestResult = { requestId: string; expiresInSeconds: number };
export type OtpVerify = { requestId: string; phone: string; code: string };
export type AuthSession = { token: string; refreshToken?: string; user: User };

/* ---------- القضية ومراحلها ---------- */

/** مراحل حياة القضية بالترتيب، من الإعداد حتى الإغلاق. */
export const CASE_STAGES = [
  'assessment', // تقييم واستشارة
  'drafting', // إعداد الصحيفة
  'filed', // قيدت
  'hearings', // جلسات
  'reserved', // حجزت للحكم
  'judgment', // صدر حكم
  'objection_window', // مهلة الاعتراض
  'appeal', // استئناف
  'final', // حكم نهائي
  'execution', // تنفيذ
  'closed', // أغلقت
] as const;
export type CaseStage = (typeof CASE_STAGES)[number];

export type CaseType =
  | 'labor'
  | 'commercial'
  | 'personal_status'
  | 'general'
  | 'administrative'
  | 'criminal'
  | 'execution';

export type PartyRole = 'plaintiff' | 'defendant';

export type Court = {
  name: string;
  circuit?: string; // الدائرة
  city: string;
};

export type Party = {
  name: string;
  role: PartyRole;
  representative?: string;
};

export type CaseSummary = {
  id: ID;
  title: string;
  caseNumber?: string; // رقم القضية في ناجز
  type: CaseType;
  stage: CaseStage;
  userRole: PartyRole;
  court?: Court;
  opponentName: string;
  nextHearingAt?: ISODate;
  nextDeadline?: Deadline;
  updatedAt: ISODate;
  progress: number; // 0..1
};

export type Case = CaseSummary & {
  description: string;
  claimAmount?: number;
  parties: Party[];
  filedAt?: ISODate;
  hearings: Hearing[];
  minutes: Minute[];
  memos: Memo[];
  judgment?: Judgment;
  appeal?: Appeal;
  timeline: TimelineEvent[];
  nextSteps: NextStep[];
  assessment?: CaseAssessment;
};

/* ---------- تقييم القضية ---------- */

export type ClaimItem = { label: string; amount: number };

/** تقييم أولي لموقف المستخدم، مبني على الأنظمة والسوابق. */
export type CaseAssessment = {
  /** قوة الموقف من 100 */
  score: number;
  headline: string;
  strengths: string[];
  needsEvidence: string[];
  claims: ClaimItem[];
  /** الأساس الذي بني عليه الحساب، مثل: راتب 8,000 وعقد غير محدد المدة */
  basis?: string;
  citations: Citation[];
  beforeYouStart?: string;
  /** الحالات المعقدة أو قليلة الثقة: نقترح عرضها على محامٍ من الرائد */
  recommendLawyer: boolean;
  generatedAt: ISODate;
};

/* ---------- التحويل لمحامٍ من الرائد ---------- */

export type LawyerReferral = {
  id: ID;
  caseId: ID;
  status: 'requested' | 'assigned' | 'closed';
  createdAt: ISODate;
  note?: string;
};

/* ---------- الجلسات والمحاضر والمذكرات ---------- */

export type HearingStatus = 'scheduled' | 'held' | 'postponed' | 'cancelled';
export type HearingMode = 'remote' | 'in_person';

export type Hearing = {
  id: ID;
  caseId: ID;
  number: number;
  scheduledAt: ISODate;
  mode: HearingMode;
  status: HearingStatus;
  location?: string;
  meetingUrl?: string;
  agenda?: string;
  outcome?: string;
  minuteId?: ID;
  preparation: ChecklistItem[];
};

export type Minute = {
  id: ID;
  caseId: ID;
  hearingId: ID;
  date: ISODate;
  summary: string;
  keyPoints: string[];
  requestsFromCourt: string[];
};

export type MemoKind = 'statement_of_claim' | 'reply' | 'rejoinder' | 'closing' | 'appeal' | 'other';
export type MemoStatus = 'draft' | 'review' | 'submitted';

export type Memo = {
  id: ID;
  caseId: ID;
  kind: MemoKind;
  title: string;
  status: MemoStatus;
  updatedAt: ISODate;
  submittedAt?: ISODate;
  body: string;
  generatedByAI: boolean;
  citations: Citation[];
};

/* ---------- الحكم والاعتراض ---------- */

export type JudgmentOutcome = 'in_favor' | 'against' | 'partial';

export type Judgment = {
  id: ID;
  caseId: ID;
  issuedAt: ISODate;
  receivedAt: ISODate; // تاريخ استلام صك الحكم، منه تحتسب مدة الاعتراض
  outcome: JudgmentOutcome;
  summary: string;
  reasoning: string;
  isFinal: boolean;
  appealDeadline: ISODate;
};

export type AppealKind = 'appeal' | 'cassation' | 'reconsideration';
export type AppealStatus = 'not_started' | 'drafting' | 'submitted' | 'accepted' | 'rejected';

export type Appeal = {
  id: ID;
  caseId: ID;
  kind: AppealKind;
  status: AppealStatus;
  deadline: ISODate;
  grounds: string[];
  memoId?: ID;
  submittedAt?: ISODate;
};

/* ---------- المهام والمواعيد والخط الزمني ---------- */

export type DeadlineKind = 'appeal' | 'memo_submission' | 'document' | 'hearing' | 'other';

export type Deadline = {
  id: ID;
  caseId: ID;
  title: string;
  dueAt: ISODate;
  kind: DeadlineKind;
  /** محسوبة من قاعدة، مستخرجة من محضر، أو يدوية */
  source: 'computed' | 'extracted' | 'manual';
  /** لا تنبيه تصعيدي على مهلة غير مؤكدة (قاعدة الرائد) */
  confirmed: boolean;
};

export type ChecklistItem = { id: ID; label: string; done: boolean };

export type NextStep = {
  id: ID;
  title: string;
  detail: string;
  dueAt?: ISODate;
  action?: 'prepare_hearing' | 'draft_memo' | 'upload_document' | 'draft_appeal' | 'ask_ai';
  done: boolean;
};

export type TimelineEventKind = 'created' | 'filed' | 'hearing' | 'minute' | 'memo' | 'judgment' | 'appeal' | 'note';

export type TimelineEvent = {
  id: ID;
  at: ISODate;
  kind: TimelineEventKind;
  title: string;
  detail?: string;
};

/* ---------- المساعد الذكي AI ---------- */

/** مرجع نظامي (مادة من نظام) أو سابقة قضائية يستند إليها الرد. */
export type Citation = {
  id: ID;
  kind: 'law' | 'precedent';
  title: string; // مثل: نظام المرافعات الشرعية
  reference: string; // مثل: المادة 187 / رقم الحكم
  excerpt?: string;
};

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: ID;
  role: ChatRole;
  content: string;
  createdAt: ISODate;
  citations?: Citation[];
  pending?: boolean;
};

export type AskAssistantInput = {
  caseId?: ID;
  conversationId?: ID;
  message: string;
};

export type AskAssistantResult = {
  conversationId: ID;
  message: ChatMessage;
};

export type DraftMemoInput = {
  caseId: ID;
  kind: MemoKind;
  instructions?: string;
};

/* ---------- الإشعارات ---------- */

export type AppNotification = {
  id: ID;
  title: string;
  body: string;
  createdAt: ISODate;
  read: boolean;
  caseId?: ID;
};

/* ---------- القضية الجديدة (المعالج) ---------- */

export type NewCaseInput = {
  type: CaseType;
  userRole: PartyRole;
  opponentName: string;
  title: string;
  description: string;
  claimAmount?: number;
  caseNumber?: string;
};

/* ---------- البداية الذكية (احكِ قصتك) ---------- */

export type IntakeFact = { label: string; value: string };

/** دور واحد في محادثة البداية الذكية: رد AI + ما فهمه + السؤال التالي. */
export type IntakeTurn = {
  sessionId: ID;
  /** رسائل AI لهذا الدور (قد تكون أكثر من رسالة) */
  messages: string[];
  /** الوقائع المستخرجة حتى الآن، يراها المستخدم ويصححها */
  facts: IntakeFact[];
  /** نصيحة عملية قصيرة (مثل: احتفظ برسالة الإنهاء) */
  tip?: string;
  /** خيارات جاهزة للرد بلمسة */
  options?: string[];
  step: number;
  totalSteps: number;
  /** عند الاكتمال: مسودة القضية جاهزة للإنشاء */
  done: boolean;
  draft?: NewCaseInput;
};

export type IntakeAnswer = { sessionId?: ID; answer?: string };
