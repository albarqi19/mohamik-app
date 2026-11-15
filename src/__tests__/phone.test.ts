import { isValidSaudiMobile, normalizePhone } from '@/lib/phone';

describe('normalizePhone', () => {
  test.each([
    ['0551234567', '0551234567'],
    ['551234567', '0551234567'],
    ['+966551234567', '0551234567'],
    ['00966551234567', '0551234567'],
    ['٠٥٥١٢٣٤٥٦٧', '0551234567'],
    ['055 123 4567', '0551234567'],
  ])('%s -> %s', (input, out) => {
    expect(normalizePhone(input)).toBe(out);
    expect(isValidSaudiMobile(normalizePhone(input))).toBe(true);
  });

  test('rejects invalid numbers', () => {
    expect(isValidSaudiMobile(normalizePhone('0451234567'))).toBe(false);
    expect(isValidSaudiMobile(normalizePhone('12345'))).toBe(false);
  });
});
