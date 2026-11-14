import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatView } from '@/components/chat/chat-view';
import { useTheme } from '@/theme';

export default function Ask() {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ChatView />
    </SafeAreaView>
  );
}
