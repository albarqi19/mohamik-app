import type { AppNotification, Case, Citation } from '../types';

/**
 * بيانات تجريبية فقط. التواريخ نسبية لليوم حتى تبدو حية دائماً.
 * المراجع النظامية هنا أمثلة توضيحية، والمرجع المعتمد هو محرك الرائد.
 */

const DAY = 86400000;
const at = (days: number, hour = 10, minute = 0) => {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const citations: Record<string, Citation> = {
  labor84: {
    id: 'c-labor-84',
    kind: 'law',
    title: 'نظام العمل',
    reference: 'المادة 84',
    excerpt: 'مكافأة نهاية الخدمة: أجر نصف شهر عن كل سنة من السنوات الخمس الأولى، وأجر شهر عن كل سنة مما بعدها.',
  },
  labor77: {
    id: 'c-labor-77',
    kind: 'law',
    title: 'نظام العمل',
    reference: 'المادة 77',
    excerpt: 'التعويض عن إنهاء العقد لسبب غير مشروع.',
  },
  procedure187: {
    id: 'c-proc-187',
    kind: 'law',
    title: 'نظام المرافعات الشرعية',
    reference: 'المادة 187',
    excerpt: 'مدة الاعتراض بطلب الاستئناف ثلاثون يوماً، وتبدأ من تاريخ تسلّم صورة صك الحكم.',
  },
  precedentLabor: {
    id: 'c-prec-1',
    kind: 'precedent',
    title: 'سابقة عمالية (مثال تجريبي)',
    reference: 'محكمة الاستئناف، الدائرة العمالية',
    excerpt: 'قضت بأن عبء إثبات صرف المستحقات يقع على صاحب العمل، ولا يكفي مجرد الادعاء.',
  },
  precedentCommercial: {
    id: 'c-prec-2',
    kind: 'precedent',
    title: 'سابقة تجارية (مثال تجريبي)',
    reference: 'محكمة الاستئناف، الدائرة التجارية',
    excerpt: 'الفواتير المختومة مع محاضر الاستلام تكفي لإثبات التوريد ما لم يثبت العكس.',
  },
};

export function buildMockCases(): Case[] {
  return [
    {
      id: 'case-1',
      title: 'مطالبة بمستحقات نهاية الخدمة',
      caseNumber: '4470281931',
      type: 'labor',
      stage: 'hearings',
      userRole: 'plaintiff',
      court: { name: 'المحكمة العمالية بالرياض', circuit: 'الدائرة العمالية الثالثة', city: 'الرياض' },
      opponentName: 'شركة الأفق للمقاولات',
      nextHearingAt: at(3, 9, 30),
      nextDeadline: { id: 'd-1', caseId: 'case-1', title: 'تقديم المذكرة التعقيبية', dueAt: at(2, 23, 0), kind: 'memo_submission', source: 'extracted', confirmed: true },
      updatedAt: at(-1),
      progress: 0.45,
      assessment: {
        score: 78,
        headline: 'موقفك جيد، ويمكن تقويته',
        strengths: ['الأجور المتأخرة ثابتة بكشف الحساب', 'مدة الخدمة مُقرّ بها من الشركة'],
        needsEvidence: ['أن الإنهاء كان دون سبب مشروع', 'عدم صرف المكافأة (عبء إثبات الصرف على الشركة)'],
        claims: [
          { label: 'أجور متأخرة (شهران)', amount: 30000 },
          { label: 'مكافأة نهاية الخدمة', amount: 67500 },
          { label: 'تعويض الإنهاء غير المشروع', amount: 52500 },
        ],
        basis: 'على راتب 15,000 ريال وعقد غير محدد المدة لسبع سنوات',
        citations: [citations.labor77, citations.labor84, citations.precedentLabor],
        beforeYouStart: 'احتفظ برسالة الإنهاء وكشوف الحساب، فهي دليلك الأهم.',
        recommendLawyer: false,
        generatedAt: at(-50),
      },
      description:
        'عملت لدى الشركة سبع سنوات بوظيفة مهندس موقع، وأُنهي عقدي دون سبب مشروع، ولم تُصرف مكافأة نهاية الخدمة ولا رواتب آخر شهرين.',
      claimAmount: 150000,
      filedAt: at(-48),
      parties: [
        { name: 'أنت', role: 'plaintiff' },
        { name: 'شركة الأفق للمقاولات', role: 'defendant', representative: 'وكيل الشركة' },
      ],
      hearings: [
        {
          id: 'h-1',
          caseId: 'case-1',
          number: 1,
          scheduledAt: at(-20, 10),
          mode: 'remote',
          status: 'held',
          outcome: 'قدّم المدعى عليه مذكرة جوابية وطلب مهلة لتقديم مستندات الصرف.',
          minuteId: 'm-1',
          preparation: [],
        },
        {
          id: 'h-2',
          caseId: 'case-1',
          number: 2,
          scheduledAt: at(3, 9, 30),
          mode: 'remote',
          status: 'scheduled',
          meetingUrl: 'https://najiz.sa',
          agenda: 'الرد على مذكرة المدعى عليه ومناقشة مستندات الصرف',
          preparation: [
            { id: 'p-1', label: 'مراجعة مذكرة المدعى عليه', done: true },
            { id: 'p-2', label: 'تجهيز كشف الحساب البنكي لآخر 3 أشهر', done: false },
            { id: 'p-3', label: 'تقديم المذكرة التعقيبية قبل الجلسة', done: false },
            { id: 'p-4', label: 'اختبار الاتصال والكاميرا قبل الجلسة بـ 15 دقيقة', done: false },
          ],
        },
      ],
      minutes: [
        {
          id: 'm-1',
          caseId: 'case-1',
          hearingId: 'h-1',
          date: at(-20, 10),
          summary:
            'افتتحت الجلسة بحضور الطرفين عن بعد. تلا المدعي دعواه، وقدّم وكيل المدعى عليه مذكرة جوابية دفع فيها بأن المكافأة صُرفت نقداً، وطلب مهلة لتقديم ما يثبت ذلك.',
          keyPoints: [
            'المدعى عليه يقر بمدة الخدمة (7 سنوات)',
            'المدعى عليه يدّعي صرف المكافأة نقداً دون مستند',
            'المحكمة أمهلت المدعى عليه لتقديم مستندات الصرف',
          ],
          requestsFromCourt: ['على المدعي تقديم كشف حساب بنكي يثبت عدم الإيداع'],
        },
      ],
      memos: [
        {
          id: 'memo-1',
          caseId: 'case-1',
          kind: 'statement_of_claim',
          title: 'صحيفة الدعوى',
          status: 'submitted',
          updatedAt: at(-48),
          submittedAt: at(-48),
          generatedByAI: true,
          citations: [citations.labor84, citations.labor77],
          body:
            'أطلب إلزام المدعى عليها بدفع مكافأة نهاية الخدمة عن مدة سبع سنوات وفق المادة 84 من نظام العمل، وتعويض عن الإنهاء غير المشروع وفق المادة 77، ورواتب آخر شهرين.',
        },
        {
          id: 'memo-2',
          caseId: 'case-1',
          kind: 'rejoinder',
          title: 'مذكرة تعقيبية على جواب المدعى عليها',
          status: 'draft',
          updatedAt: at(-1),
          generatedByAI: true,
          citations: [citations.precedentLabor, citations.labor84],
          body:
            'أولاً: ادعاء المدعى عليها صرف المكافأة نقداً قول مجرد لا دليل عليه، وعبء الإثبات يقع عليها.\nثانياً: يرفق المدعي كشف حسابه البنكي الذي يخلو من أي إيداع بقيمة المكافأة.\nثالثاً: نطلب الحكم بكامل الطلبات الواردة في صحيفة الدعوى.',
        },
      ],
      timeline: [
        { id: 't-1', at: at(-50), kind: 'created', title: 'أنشأت القضية في محاميك' },
        { id: 't-2', at: at(-48), kind: 'filed', title: 'قُيدت الدعوى في ناجز', detail: 'رقم القضية 4470281931' },
        { id: 't-3', at: at(-20, 10), kind: 'hearing', title: 'الجلسة الأولى', detail: 'عن بعد' },
        { id: 't-4', at: at(-20, 12), kind: 'minute', title: 'محضر الجلسة الأولى' },
        { id: 't-5', at: at(-1), kind: 'memo', title: 'مسودة المذكرة التعقيبية جاهزة', detail: 'صاغها AI وتنتظر مراجعتك' },
      ],
      nextSteps: [
        {
          id: 's-1',
          title: 'راجع المذكرة التعقيبية',
          detail: 'المسودة جاهزة. راجعها وعدّل ما تراه ثم قدّمها عبر ناجز.',
          dueAt: at(2, 23),
          action: 'draft_memo',
          done: false,
        },
        {
          id: 's-2',
          title: 'ارفع كشف الحساب البنكي',
          detail: 'طلبته المحكمة في الجلسة الأولى لإثبات عدم صرف المكافأة.',
          dueAt: at(2, 23),
          action: 'upload_document',
          done: false,
        },
        {
          id: 's-3',
          title: 'استعد للجلسة الثانية',
          detail: 'قائمة تحضير من 4 بنود.',
          dueAt: at(3, 9, 30),
          action: 'prepare_hearing',
          done: false,
        },
      ],
    },
    {
      id: 'case-2',
      title: 'مطالبة بقيمة توريد مواد بناء',
      caseNumber: '4460913327',
      type: 'commercial',
      stage: 'objection_window',
      userRole: 'plaintiff',
      court: { name: 'المحكمة التجارية بجدة', circuit: 'الدائرة التجارية الخامسة', city: 'جدة' },
      opponentName: 'مؤسسة البناء الحديث',
      nextDeadline: { id: 'd-2', caseId: 'case-2', title: 'آخر موعد للاعتراض على الحكم', dueAt: at(21, 23), kind: 'appeal', source: 'computed', confirmed: true },
      updatedAt: at(-2),
      progress: 0.75,
      description: 'وردنا مواد بناء بقيمة 420 ألف ريال بموجب فواتير ومحاضر استلام، ولم يُسدَّد سوى 150 ألف.',
      claimAmount: 270000,
      filedAt: at(-140),
      parties: [
        { name: 'أنت', role: 'plaintiff' },
        { name: 'مؤسسة البناء الحديث', role: 'defendant' },
      ],
      hearings: [
        { id: 'h-21', caseId: 'case-2', number: 1, scheduledAt: at(-100), mode: 'remote', status: 'held', outcome: 'قُدّمت الفواتير ومحاضر الاستلام.', preparation: [] },
        { id: 'h-22', caseId: 'case-2', number: 2, scheduledAt: at(-60), mode: 'in_person', status: 'held', outcome: 'حُجزت القضية للحكم.', preparation: [] },
      ],
      minutes: [],
      memos: [
        {
          id: 'memo-21',
          caseId: 'case-2',
          kind: 'appeal',
          title: 'لائحة اعتراضية',
          status: 'draft',
          updatedAt: at(-2),
          generatedByAI: true,
          citations: [citations.precedentCommercial, citations.procedure187],
          body:
            'أولاً: أغفل الحكم محاضر الاستلام الموقعة من المدعى عليها، وهي دليل كافٍ على التوريد.\nثانياً: استبعاد مبلغ 90 ألف ريال لم يُسبَّب تسبيباً كافياً.\nلذا نطلب نقض الحكم فيما قضى به من رفض جزء من المطالبة، والحكم بكامل المبلغ.',
        },
      ],
      judgment: {
        id: 'j-2',
        caseId: 'case-2',
        issuedAt: at(-12),
        receivedAt: at(-9),
        outcome: 'partial',
        summary: 'إلزام المدعى عليها بدفع 180 ألف ريال، ورفض ما زاد على ذلك.',
        reasoning: 'ثبت التوريد بالفواتير، ولم يثبت لدى الدائرة توريد الدفعة الأخيرة لعدم وضوح توقيع محضر الاستلام.',
        isFinal: false,
        appealDeadline: at(21, 23),
      },
      appeal: {
        id: 'a-2',
        caseId: 'case-2',
        kind: 'appeal',
        status: 'drafting',
        deadline: at(21, 23),
        grounds: ['إغفال دلالة محاضر الاستلام', 'قصور التسبيب في الجزء المرفوض'],
        memoId: 'memo-21',
      },
      timeline: [
        { id: 't-21', at: at(-140), kind: 'filed', title: 'قُيدت الدعوى' },
        { id: 't-22', at: at(-100), kind: 'hearing', title: 'الجلسة الأولى' },
        { id: 't-23', at: at(-60), kind: 'hearing', title: 'الجلسة الثانية', detail: 'حُجزت للحكم' },
        { id: 't-24', at: at(-12), kind: 'judgment', title: 'صدر الحكم', detail: 'لصالحك جزئياً' },
        { id: 't-25', at: at(-9), kind: 'judgment', title: 'استلمت صك الحكم', detail: 'بدأ احتساب مدة الاعتراض' },
        { id: 't-26', at: at(-2), kind: 'appeal', title: 'بدأت صياغة اللائحة الاعتراضية' },
      ],
      nextSteps: [
        {
          id: 's-21',
          title: 'أكمل اللائحة الاعتراضية',
          detail: 'بقي 21 يوماً على انتهاء مدة الاعتراض. المسودة جاهزة للمراجعة.',
          dueAt: at(21, 23),
          action: 'draft_appeal',
          done: false,
        },
      ],
    },
    {
      id: 'case-3',
      title: 'طلب نفقة وزيارة',
      caseNumber: '4481120045',
      type: 'personal_status',
      stage: 'filed',
      userRole: 'plaintiff',
      court: { name: 'محكمة الأحوال الشخصية بالدمام', city: 'الدمام' },
      opponentName: 'الطرف الآخر',
      nextHearingAt: at(12, 11),
      updatedAt: at(-4),
      progress: 0.2,
      description: 'طلب تقدير نفقة للأبناء وتنظيم الزيارة.',
      filedAt: at(-4),
      parties: [
        { name: 'أنت', role: 'plaintiff' },
        { name: 'الطرف الآخر', role: 'defendant' },
      ],
      hearings: [
        {
          id: 'h-31',
          caseId: 'case-3',
          number: 1,
          scheduledAt: at(12, 11),
          mode: 'remote',
          status: 'scheduled',
          agenda: 'الجلسة الأولى: سماع الدعوى',
          preparation: [
            { id: 'p-31', label: 'تجهيز شهادات ميلاد الأبناء', done: false },
            { id: 'p-32', label: 'تجهيز ما يثبت المصاريف الشهرية', done: false },
          ],
        },
      ],
      minutes: [],
      memos: [],
      timeline: [{ id: 't-31', at: at(-4), kind: 'filed', title: 'قُيدت الدعوى' }],
      nextSteps: [
        { id: 's-31', title: 'جهّز مستندات الجلسة الأولى', detail: 'مستندان مطلوبان.', dueAt: at(11), action: 'prepare_hearing', done: false },
      ],
    },
    {
      id: 'case-4',
      title: 'إخلاء عقار مستأجر',
      type: 'execution',
      stage: 'assessment',
      userRole: 'plaintiff',
      opponentName: 'المستأجر',
      updatedAt: at(0),
      progress: 0.05,
      description: 'المستأجر متأخر في سداد الإيجار ستة أشهر، والعقد موثق في منصة إيجار.',
      assessment: {
        score: 85,
        headline: 'طريقك الأسرع: التنفيذ المباشر',
        strengths: ['عقد الإيجار الموثق في منصة إيجار سند تنفيذي', 'التأخر في السداد ثابت بسجل المدفوعات'],
        needsEvidence: ['ما يثبت مطالبتك للمستأجر بالسداد قبل التنفيذ'],
        claims: [{ label: 'إيجار متأخر (6 أشهر)', amount: 36000 }],
        basis: 'على إيجار شهري 6,000 ريال',
        citations: [],
        beforeYouStart: 'ارفع عقد الإيجار الموثق وسجل المدفوعات، وسأجهز لك طلب التنفيذ.',
        recommendLawyer: false,
        generatedAt: at(0),
      },
      parties: [
        { name: 'أنت', role: 'plaintiff' },
        { name: 'المستأجر', role: 'defendant' },
      ],
      hearings: [],
      minutes: [],
      memos: [],
      timeline: [{ id: 't-41', at: at(0), kind: 'created', title: 'أنشأت القضية في محاميك' }],
      nextSteps: [
        { id: 's-41', title: 'ارفع عقد الإيجار الموثق', detail: 'عقد إيجار الموحد سند تنفيذي.', action: 'upload_document', done: false },
        { id: 's-42', title: 'اسأل AI عن الطريق الأسرع', detail: 'التنفيذ المباشر أم دعوى الإخلاء؟', action: 'ask_ai', done: false },
      ],
    },
  ];
}

export function buildMockNotifications(): AppNotification[] {
  return [
    { id: 'n-1', title: 'جلسة بعد 3 أيام', body: 'الجلسة الثانية في قضية مستحقات نهاية الخدمة', createdAt: at(0, 8), read: false, caseId: 'case-1' },
    { id: 'n-2', title: 'مسودة جاهزة', body: 'صاغ AI مسودة المذكرة التعقيبية وتنتظر مراجعتك', createdAt: at(-1, 16), read: false, caseId: 'case-1' },
    { id: 'n-3', title: 'مدة الاعتراض تسري', body: 'بقي 21 يوماً للاعتراض على حكم قضية التوريد', createdAt: at(-2, 9), read: true, caseId: 'case-2' },
  ];
}
