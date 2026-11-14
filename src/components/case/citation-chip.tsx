import { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { Citation } from '@/api/types';
import { Icon, Text } from '@/components/ui';
import { useTheme } from '@/theme';

/** بطاقة السند: كبسولة "نظام العمل · المادة 77" تفتح النص عند اللمس. */
export function CitationChip({ citation }: { citation: Citation }) {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      style={{
        backgroundColor: colors.accentSoft,
        borderRadius: open ? radius.md : radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: open ? 'stretch' : 'flex-start',
        gap: 6,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={citation.kind === 'law' ? 'book-outline' : 'library-outline'} size={14} color="accentText" />
        <Text variant="label" color="accentText">
          {citation.title} · {citation.reference}
        </Text>
      </View>
      {open && citation.excerpt ? (
        <Text variant="serif" style={{ fontSize: 15, lineHeight: 28 }}>
          {citation.excerpt}
        </Text>
      ) : null}
    </Pressable>
  );
}
