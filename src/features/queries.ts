import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type Case, type DraftMemoInput, type NewCaseInput } from '@/api';

/** مفاتيح ومكوّنات الاستعلامات (React Query) لكل البيانات. */
export const qk = {
  cases: ['cases'] as const,
  case: (id: string) => ['cases', id] as const,
  memo: (caseId: string, memoId: string) => ['cases', caseId, 'memos', memoId] as const,
  hearings: ['hearings', 'upcoming'] as const,
  deadlines: ['deadlines'] as const,
  notifications: ['notifications'] as const,
};

export const useCases = () => useQuery({ queryKey: qk.cases, queryFn: api.cases.list });
export const useCase = (id: string) => useQuery({ queryKey: qk.case(id), queryFn: () => api.cases.get(id) });
export const useMemo_ = (caseId: string, memoId: string) =>
  useQuery({ queryKey: qk.memo(caseId, memoId), queryFn: () => api.memos.get(caseId, memoId) });
export const useUpcomingHearings = () => useQuery({ queryKey: qk.hearings, queryFn: api.cases.upcomingHearings });
export const useDeadlines = () => useQuery({ queryKey: qk.deadlines, queryFn: api.cases.deadlines });
export const useNotifications = () => useQuery({ queryKey: qk.notifications, queryFn: api.notifications.list });

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCaseInput) => api.cases.create(input),
    onSuccess: (c) => {
      qc.setQueryData(qk.case(c.id), c);
      void qc.invalidateQueries({ queryKey: qk.cases });
    },
  });
}

export function useToggleNextStep(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => api.cases.toggleNextStep(caseId, stepId),
    onMutate: async (stepId) => {
      await qc.cancelQueries({ queryKey: qk.case(caseId) });
      const prev = qc.getQueryData<Case>(qk.case(caseId));
      if (prev) {
        qc.setQueryData<Case>(qk.case(caseId), {
          ...prev,
          nextSteps: prev.nextSteps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.case(caseId), ctx.prev),
    onSuccess: (c) => qc.setQueryData(qk.case(caseId), c),
  });
}

export function useToggleHearingPrep(caseId: string, hearingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api.cases.toggleHearingPrep(caseId, hearingId, itemId),
    onMutate: async (itemId) => {
      const prev = qc.getQueryData<Case>(qk.case(caseId));
      if (prev) {
        qc.setQueryData<Case>(qk.case(caseId), {
          ...prev,
          hearings: prev.hearings.map((h) =>
            h.id !== hearingId
              ? h
              : { ...h, preparation: h.preparation.map((p) => (p.id === itemId ? { ...p, done: !p.done } : p)) },
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.case(caseId), ctx.prev),
  });
}

export function useDraftMemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DraftMemoInput) => api.memos.draft(input),
    onSuccess: (memo) => void qc.invalidateQueries({ queryKey: qk.case(memo.caseId) }),
  });
}
