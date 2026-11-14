import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { api, useMockApi } from '@/api';
import { ApiError } from '@/api/client';
import { Button, Text } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { fonts, useTheme } from '@/theme';

const CODE_LENGTH = 4;

export default function Verify() {
  const { phone, requestId: initialRequestId } = useLocalSearchParams<{ phone: string; requestId: string }>();
  const { colors, radius, spacing } = useTheme();
  const { signIn } = useAuth();
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [code, setCode] = useState('');
  const [requestId, setRequestId] = useState(initialRequestId);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = async (value: string) => {
    setError(undefined);
    setLoading(true);
    try {
      const session = await api.auth.verifyOtp({ phone, requestId, code: value });
      await signIn(session);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (text: string) => {
    const digits = text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) void verify(digits);
  };

  const resend = async () => {
    setSeconds(60);
    try {
      const res = await api.auth.requestOtp({ phone });
      setRequestId(res.requestId);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'تعذر إعادة الإرسال');
    }
  };

  return (
    <View style={{ flex: 1, padding: spacing.xl, gap: spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="title">رمز التحقق</Text>
        <Text color="textMuted">
          أرسلنا رمزاً إلى <Text variant="bodyStrong" style={{ writingDirection: 'ltr' }}>{phone}</Text>
        </Text>
        {useMockApi ? (
          <Text variant="caption" color="accentText">
            الوضع التجريبي: الرمز 1234
          </Text>
        ) : null}
      </View>

      <Pressable onPress={() => inputRef.current?.focus()} style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, direction: 'ltr' }}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => {
          const active = i === code.length;
          return (
            <View
              key={i}
              style={{
                width: 60,
                height: 64,
                borderRadius: radius.md,
                borderWidth: active ? 2 : 1,
                borderColor: error ? colors.danger : active ? colors.accent : colors.border,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text align="center" style={{ fontFamily: fonts.bold, fontSize: 26, lineHeight: 36 }}>
                {code[i] ?? ''}
              </Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        maxLength={CODE_LENGTH}
        autoFocus
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />
      {error ? (
        <Text color="danger" align="center">
          {error}
        </Text>
      ) : null}

      <Button title="تحقق" onPress={() => verify(code)} disabled={code.length !== CODE_LENGTH} loading={loading} />
      <Pressable disabled={seconds > 0} onPress={resend} hitSlop={10}>
        <Text align="center" color={seconds > 0 ? 'textMuted' : 'accentText'}>
          {seconds > 0 ? `إعادة الإرسال بعد ${seconds} ثانية` : 'إعادة إرسال الرمز'}
        </Text>
      </Pressable>
    </View>
  );
}
