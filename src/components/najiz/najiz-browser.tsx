import { forwardRef, useImperativeHandle, useRef, type ComponentType, type Ref } from 'react';
import { WebView as RNWebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';

import { READ_PAGE_SCRIPT } from '@/features/najiz-import';
import { NAJIZ_URL } from '@/features/najiz';

// تعريف أنواع المكتبة يجعل الخصائص never مع إعدادات TS الصارمة، فنعيد تعريفه
type WebViewInstance = { injectJavaScript: (script: string) => void };
const WebView = RNWebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebViewInstance> }>;

export type NajizBrowserHandle = { readPage: () => void };
type Props = { onPageText: (text: string) => void; onError: () => void };

/**
 * ناجز داخل التطبيق. المستخدم يدخل بنفاذ بنفسه.
 * incognito: لا تبقى جلسة نفاذ محفوظة على الجهاز بعد إغلاق الشاشة، ولا تصل إلى خوادمنا أبدا.
 */
export const NajizBrowser = forwardRef<NajizBrowserHandle, Props>(function NajizBrowser({ onPageText, onError }, ref) {
  const web = useRef<WebViewInstance>(null);
  useImperativeHandle(ref, () => ({ readPage: () => web.current?.injectJavaScript(READ_PAGE_SCRIPT) }), []);
  return (
    <WebView
      ref={web}
      source={{ uri: NAJIZ_URL }}
      incognito
      sharedCookiesEnabled={false}
      originWhitelist={['https://*']}
      setSupportMultipleWindows={false}
      startInLoadingState
      onMessage={(e: WebViewMessageEvent) => {
        try {
          const msg = JSON.parse(e.nativeEvent.data) as { type: string; text?: string };
          if (msg.type === 'page' && msg.text) onPageText(msg.text);
          else onError();
        } catch {
          onError();
        }
      }}
      style={{ flex: 1 }}
    />
  );
});

export const najizBrowserSupported = true;
