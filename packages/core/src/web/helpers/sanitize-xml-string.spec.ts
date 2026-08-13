import sanitizeXmlString from './sanitize-xml-string';

describe('sanitizeXmlString', () => {
  test('leaves a string with nothing to strip unchanged', () => {
    const input = '<svg><image xlink:href="data:image/png;base64,AAAA"/></svg>';

    expect(sanitizeXmlString(input)).toBe(input);
  });

  test('keeps the control characters XML allows', () => {
    expect(sanitizeXmlString('a\tb\nc\rd')).toBe('a\tb\nc\rd');
  });

  test('strips the control characters XML forbids', () => {
    expect(sanitizeXmlString('a\u0000b\u0008c\u000Bd\u000Ce\u000Ef\u001Fg')).toBe('abcdefg');
  });

  test('keeps the characters on either side of the surrogate block', () => {
    expect(sanitizeXmlString('a\uD7FFb\uE000c')).toBe('a\uD7FFb\uE000c');
  });

  test('strips the two non-characters at the end of the BMP', () => {
    expect(sanitizeXmlString('a�b\uFFFEc\uFFFFd')).toBe('a�bcd');
  });

  test('keeps a valid surrogate pair intact', () => {
    expect(sanitizeXmlString('a𐀀b')).toBe('a𐀀b');
    expect(sanitizeXmlString('a􏿿b')).toBe('a􏿿b');
  });

  test('strips a lone high surrogate', () => {
    expect(sanitizeXmlString('a\uD800b')).toBe('ab');
    expect(sanitizeXmlString('\uD800')).toBe('');
  });

  test('strips a lone low surrogate', () => {
    expect(sanitizeXmlString('a\uDC00b')).toBe('ab');
    expect(sanitizeXmlString('\uDC00')).toBe('');
  });

  test('strips a lone surrogate next to a valid pair', () => {
    expect(sanitizeXmlString('\uD800𐀀')).toBe('𐀀');
    expect(sanitizeXmlString('𐀀\uDC00')).toBe('𐀀');
  });

  test('handles an empty string', () => {
    expect(sanitizeXmlString('')).toBe('');
  });

  test('is stateless across calls', () => {
    const dirty = 'a\u0000b';

    expect(sanitizeXmlString(dirty)).toBe('ab');
    expect(sanitizeXmlString(dirty)).toBe('ab');
    expect(sanitizeXmlString(dirty)).toBe('ab');
  });
});
