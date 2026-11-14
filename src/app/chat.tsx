import { useLocalSearchParams } from 'expo-router';

import { ChatView } from '@/components/chat/chat-view';

/** محادثة مرتبطة بقضية معيّنة، تُفتح من صفحة القضية. */
export default function CaseChat() {
  const { caseId, title } = useLocalSearchParams<{ caseId?: string; title?: string }>();
  return <ChatView caseId={caseId} caseTitle={title} />;
}
