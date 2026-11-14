import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { api } from '@/api';
import { ApiError } from '@/api/client';
import { Button, Text, TextField } from '@/components/ui';
import { useTheme } from '@/theme';

/** يقبل 05xxxxxxxx أو 5xxxxxxxx أو +9665xxxxxxxx ويحوّل الأرقام العربية. */
export function normalizePhone(input: string): string {
  const latin = input.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/\D/g, '');
  if (latin.startsWith('9665')) return '0' + latin.slice(3);
  if (latin.startsWith('5') && latin.length === 9) return '0' + latin;
  return latin;
}

export default function Login() {
  const { spacing } = useTheme();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const normalized = normalizePhone(phone);
  const valid = /^05\d{8}$/.test(normalized);

  const submit = async () => {
    setError(undefined);
    setLoading(true);
    try {
      const res = await api.auth.requestOtp({ phone: normalized });
      router.push({ pathname: '/verify', params: { phone: normalized, requestId: res.requestId } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.xl }}>
        <View style={{ gap: spacing.sm }}>
          <Text variant="title">أدخل رقم جوالك</Text>
          <Text color="textMuted">سنرسل لك رمز تحقق لتسجيل الدخول أو إنشاء حساب جديد.</Text>
        </View>
        <TextField
          label="رقم الجوال"
          placeholder="05xxxxxxxx"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          value={phone}
          onChangeText={setPhone}
          maxLength={14}
          error={error}
          autoFocus
          onSubmitEditing={() => valid && submit()}
        />
        <Button title="إرسال الرمز" onPress={submit} disabled={!valid} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}
