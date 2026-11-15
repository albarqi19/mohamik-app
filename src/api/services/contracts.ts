import type {
  AppNotification,
  AskAssistantInput,
  AskAssistantResult,
  AuthSession,
  Case,
  CaseSummary,
  ChatMessage,
  Deadline,
  DraftMemoInput,
  Hearing,
  ID,
  CaseDocument,
  UploadInput,
  IntakeAnswer,
  IntakeTurn,
  LawyerReferral,
  Memo,
  NewCaseInput,
  OtpRequest,
  OtpRequestResult,
  OtpVerify,
  User,
} from '../types';

/**
 * واجهات الخدمات. لكل خدمة تطبيقان: تجريبي (mock) وحقيقي (http).
 * عند ربط خلفية الرائد يكفي أن تطابق نقاط النهاية المذكورة في http.ts.
 */

export interface AuthService {
  requestOtp(input: OtpRequest): Promise<OtpRequestResult>;
  verifyOtp(input: OtpVerify): Promise<AuthSession>;
  me(): Promise<User>;
  logout(): Promise<void>;
}

export interface CasesService {
  list(): Promise<CaseSummary[]>;
  get(id: ID): Promise<Case>;
  create(input: NewCaseInput): Promise<Case>;
  toggleNextStep(caseId: ID, stepId: ID): Promise<Case>;
  toggleHearingPrep(caseId: ID, hearingId: ID, itemId: ID): Promise<Hearing>;
  upcomingHearings(): Promise<(Hearing & { caseTitle: string })[]>;
  deadlines(): Promise<Deadline[]>;
  /** لا تنبيه تصعيدي على مهلة غير مؤكدة: المستخدم يؤكدها هنا */
  confirmDeadline(caseId: ID, deadlineId: ID): Promise<Deadline>;
}

export interface DocumentsService {
  upload(input: UploadInput): Promise<CaseDocument>;
  /** قراءة المستند وتحويله إلى بيانات (ملخص، طلبات، مهل) */
  extract(documentId: ID): Promise<CaseDocument>;
}

export interface IntakeService {
  /** بدون answer يبدأ جلسة جديدة؛ ومع answer يعيد الدور التالي */
  next(input: IntakeAnswer): Promise<IntakeTurn>;
}

export interface ReferralsService {
  /** طلب عرض القضية على محامٍ من الرائد */
  request(caseId: ID, note?: string): Promise<LawyerReferral>;
}

export interface MemosService {
  get(caseId: ID, memoId: ID): Promise<Memo>;
  draft(input: DraftMemoInput): Promise<Memo>;
}

export interface AssistantService {
  history(conversationId?: ID, caseId?: ID): Promise<ChatMessage[]>;
  ask(input: AskAssistantInput): Promise<AskAssistantResult>;
}

export interface NotificationsService {
  list(): Promise<AppNotification[]>;
  markRead(id: ID): Promise<void>;
}

export type Api = {
  auth: AuthService;
  cases: CasesService;
  memos: MemosService;
  assistant: AssistantService;
  notifications: NotificationsService;
  referrals: ReferralsService;
  intake: IntakeService;
  documents: DocumentsService;
};
