import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';

import { api } from '@/api';
import { Button, Card, Icon, Text } from '@/components/ui';

/**
 * «اعرضها على محامٍ من الرائد»: حاضر في كل الرحلات للحالات المعقدة أو قليلة الثقة.
 * compact = زر فقط، وإلا بطاقة بشرح.
 */
export function LawyerReferral({ caseId, compact = false, emphasized = false }: { caseId: string; compact?: boolean; emphasized?: boolean }) {
  const request = useMutation({ mutationFn: () => api.referrals.request(caseId) });

  if (request.isSuccess) {
    return (
      <Card tone="muted" style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="checkmark-circle" size={22} color="success" />
        <Text variant="caption" style={{ flex: 1 }}>
          استلمنا طلبك. سيتواصل معك محامٍ من الرائد خلال يوم عمل.
        </Text>
      </Card>
    );
  }

  const button = (
    <Button
      title="اعرضها على محامٍ من الرائد"
      icon="person-outline"
      variant={emphasized ? 'primary' : 'secondary'}
      size={compact ? 'sm' : 'md'}
      loading={request.isPending}
      onPress={() => request.mutate()}
    />
  );
  if (compact) return button;

  return (
    <Card tone={emphasized ? 'accent' : 'default'} style={{ gap: 10 }}>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong">{emphasized ? 'ننصحك بمحامٍ في هذه القضية' : 'تحتاج رأي محامٍ؟'}</Text>
        <Text variant="caption" color="textMuted">
          يراجع محامٍ مرخّص من الرائد قضيتك بكل ما فيها من محاضر ومذكرات.
        </Text>
      </View>
      {button}
      {request.isError ? (
        <Text variant="caption" color="danger">
          {request.error.message}
        </Text>
      ) : null}
    </Card>
  );
}
