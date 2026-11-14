import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

/** نقطة الدخول: توجّه المستخدم حسب حالة الدخول. */
export default function Index() {
  const { status, hasSeenWelcome } = useAuth();
  if (status === 'signedIn') return <Redirect href="/home" />;
  return <Redirect href={hasSeenWelcome ? '/login' : '/welcome'} />;
}
