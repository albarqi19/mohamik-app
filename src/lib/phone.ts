/** يحوّل الأرقام العربية (٠-٩) إلى لاتينية. */
export function toLatinDigits(input: string): string {
  return input.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/** يقبل 05xxxxxxxx أو 5xxxxxxxx أو +9665xxxxxxxx أو 009665xxxxxxxx ويعيد 05xxxxxxxx. */
export function normalizePhone(input: string): string {
  let d = toLatinDigits(input).replace(/\D/g, '');
  if (d.startsWith('00966')) d = d.slice(2);
  if (d.startsWith('9665')) return '0' + d.slice(3);
  if (d.startsWith('5') && d.length === 9) return '0' + d;
  return d;
}

export const isValidSaudiMobile = (phone: string) => /^05\d{8}$/.test(phone);
