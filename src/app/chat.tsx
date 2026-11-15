import { Stack, useLocalSearchParams } from 'expo-router';

import type { AssistantMode } from '@/api';
import { ChatView } from '@/components/chat/chat-view';

/** محادثة مرتبطة بقضية معيّنة، أو تدريب على الجلسة (mode=practice). */
export default function CaseChat() {
  const { caseId, title, mode } = useLocalSearchParams<{ caseId?: string; title?: string; mode?: AssistantMode }>();
  return (
    <>
      {mode === 'practice' ? <Stack.Screen options={{ title: 'تدرّب على الجلسة' }} /> : null}
      <ChatView caseId={caseId} caseTitle={title} mode={mode} />
    </>
  );
}
