import { forwardRef } from 'react';

export type NajizBrowserHandle = { readPage: () => void };
type Props = { onPageText: (text: string) => void; onError: () => void };

/** الويب لا يدعم عرض ناجز داخل التطبيق؛ تستعمل الشاشة طريقة اللصق بدلا منه. */
export const NajizBrowser = forwardRef<NajizBrowserHandle, Props>(function NajizBrowser() {
  return null;
});

export const najizBrowserSupported = false;
