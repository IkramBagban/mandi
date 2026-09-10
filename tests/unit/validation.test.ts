import {
  MAX_AMOUNT,
  MAX_QTY_KG,
  normalizeDigits,
  validateAmount,
  validateIndianPhone,
  validateName,
  validateQuantityKg,
} from '@/lib/validation';

describe('normalizeDigits', () => {
  it('passes ASCII digits through unchanged', () => {
    expect(normalizeDigits('9876543210')).toBe('9876543210');
  });

  it('converts Devanagari digits (Hindi/Marathi keyboards)', () => {
    expect(normalizeDigits('९८७६५४३२१०')).toBe('9876543210');
    expect(normalizeDigits('१००')).toBe('100');
  });

  it('converts Arabic-Indic digits (Urdu keyboards)', () => {
    expect(normalizeDigits('٩٨٧٦٥٤٣٢١٠')).toBe('9876543210');
    expect(normalizeDigits('١٠٠')).toBe('100');
  });

  it('leaves non-digit characters alone', () => {
    expect(normalizeDigits('+91 98765-43210')).toBe('+91 98765-43210');
  });
});

describe('validateAmount', () => {
  it('accepts plain integers', () => {
    expect(validateAmount('100')).toEqual({ ok: true, value: 100 });
  });

  it('accepts paise up to 2 decimals', () => {
    expect(validateAmount('10.50')).toEqual({ ok: true, value: 10.5 });
  });

  it('strips commas, spaces and Indic digits before parsing', () => {
    expect(validateAmount('1,000')).toEqual({ ok: true, value: 1000 });
    expect(validateAmount('१००')).toEqual({ ok: true, value: 100 });
    expect(validateAmount('١٠٠')).toEqual({ ok: true, value: 100 });
  });

  it('rejects blank input as required', () => {
    expect(validateAmount('')).toEqual({ ok: false, errorKey: 'validation.amountRequired' });
    expect(validateAmount('   ')).toEqual({ ok: false, errorKey: 'validation.amountRequired' });
  });

  it('rejects non-numeric input as invalid', () => {
    expect(validateAmount('abc')).toEqual({ ok: false, errorKey: 'validation.amountInvalid' });
    expect(validateAmount('10.5.2')).toEqual({ ok: false, errorKey: 'validation.amountInvalid' });
  });

  it('rejects more than 2 decimals', () => {
    expect(validateAmount('10.555')).toEqual({ ok: false, errorKey: 'validation.amountInvalid' });
  });

  it('rejects zero as not positive', () => {
    expect(validateAmount('0')).toEqual({ ok: false, errorKey: 'validation.amountNotPositive' });
  });

  it('rejects amounts above the ceiling', () => {
    expect(validateAmount(String(MAX_AMOUNT))).toEqual({ ok: true, value: MAX_AMOUNT });
    expect(validateAmount(String(MAX_AMOUNT + 1))).toEqual({
      ok: false,
      errorKey: 'validation.amountTooLarge',
    });
  });
});

describe('validateQuantityKg', () => {
  it('accepts weights up to 3 decimals', () => {
    expect(validateQuantityKg('25')).toEqual({ ok: true, value: 25 });
    expect(validateQuantityKg('1.234')).toEqual({ ok: true, value: 1.234 });
  });

  it('rejects 4+ decimals as invalid weight', () => {
    expect(validateQuantityKg('1.2345')).toEqual({ ok: false, errorKey: 'validation.qtyInvalid' });
  });

  it('maps blank, zero and garbage to the weight key (never amount keys)', () => {
    expect(validateQuantityKg('')).toEqual({ ok: false, errorKey: 'validation.qtyInvalid' });
    expect(validateQuantityKg('0')).toEqual({ ok: false, errorKey: 'validation.qtyInvalid' });
    expect(validateQuantityKg('lots')).toEqual({ ok: false, errorKey: 'validation.qtyInvalid' });
  });

  it('rejects weights above the ceiling', () => {
    expect(validateQuantityKg(String(MAX_QTY_KG))).toEqual({ ok: true, value: MAX_QTY_KG });
    expect(validateQuantityKg(String(MAX_QTY_KG + 1)).ok).toBe(false);
  });
});

describe('validateIndianPhone', () => {
  it('accepts a canonical 10-digit mobile starting 6-9', () => {
    expect(validateIndianPhone('9876543210')).toEqual({ ok: true, value: '9876543210' });
    expect(validateIndianPhone('6123456789')).toEqual({ ok: true, value: '6123456789' });
  });

  it('strips +91, spaces and dashes', () => {
    expect(validateIndianPhone('+91 98765 43210')).toEqual({ ok: true, value: '9876543210' });
    expect(validateIndianPhone('91-9876543210')).toEqual({ ok: true, value: '9876543210' });
  });

  it('strips a leading trunk zero', () => {
    expect(validateIndianPhone('09876543210')).toEqual({ ok: true, value: '9876543210' });
  });

  it('accepts Indic digits from Hindi/Urdu keyboards', () => {
    expect(validateIndianPhone('९८७६५४३२१०')).toEqual({ ok: true, value: '9876543210' });
    expect(validateIndianPhone('٩٨٧٦٥٤٣٢١٠')).toEqual({ ok: true, value: '9876543210' });
  });

  it('rejects numbers not starting 6-9', () => {
    expect(validateIndianPhone('1234567890')).toEqual({
      ok: false,
      errorKey: 'validation.phoneInvalid',
    });
    expect(validateIndianPhone('5876543210')).toEqual({
      ok: false,
      errorKey: 'validation.phoneInvalid',
    });
  });

  it('rejects short, long and empty input', () => {
    for (const raw of ['', '987654321', '98765432101', '   ']) {
      expect(validateIndianPhone(raw)).toEqual({ ok: false, errorKey: 'validation.phoneInvalid' });
    }
  });
});

describe('validateName', () => {
  it('accepts anything non-blank', () => {
    expect(validateName('Ramesh Kumar')).toBe(true);
    expect(validateName('  रमेश  ')).toBe(true);
  });

  it('rejects blank names', () => {
    expect(validateName('')).toBe(false);
    expect(validateName('   ')).toBe(false);
  });
});
