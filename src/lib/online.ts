import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

let wired = false;

/** يربط React Query بحالة الشبكة والتطبيق: يوقف الطلبات بلا اتصال ويحدّث عند العودة للتطبيق. */
export function wireQueryLifecycle() {
  if (wired) return;
  wired = true;
  if (Platform.OS !== 'web') {
    onlineManager.setEventListener((setOnline) =>
      NetInfo.addEventListener((state) => setOnline(state.isConnected !== false && state.isInternetReachable !== false)),
    );
    // يعيش طوال عمر التطبيق، فلا حاجة لإلغائه
    AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'));
  }
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
}
