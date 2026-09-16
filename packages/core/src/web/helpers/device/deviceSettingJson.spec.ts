import { stringifyDeviceSettingJson } from './deviceSettingJson';

/**
 * Undo one shlex pass the way python's shlex.split does for an unquoted token: a backslash escapes
 * whatever follows it. The value is relayed through two of them, fluxghost then fluxmonitor.
 */
const unescapeOnce = (value: string): string => value.replace(/\\(.)/g, '$1');

describe('test deviceSettingJson', () => {
  it('should survive both shlex passes', () => {
    const config = {
      field: { angle: 0, offsetX: 0, offsetY: 0 },
      focusHeight: 12.5,
      redDot: { offsetX: -1.5, offsetY: 0, scaleX: 1, scaleY: 1 },
      workarea: 110,
    };
    const sent = stringifyDeviceSettingJson(config);

    expect(sent).not.toContain('{"');
    expect(JSON.parse(unescapeOnce(unescapeOnce(sent)))).toEqual(config);
  });

  it('should escape every quote twice over', () => {
    expect(stringifyDeviceSettingJson({ a: 1 })).toBe('{\\\\\\"a\\\\\\":1}');
  });

  it('should apply the replacer', () => {
    const rounded = stringifyDeviceSettingJson({ a: 1.23456 }, (_, val) =>
      typeof val === 'number' ? Math.round(val * 100) / 100 : val,
    );

    expect(JSON.parse(unescapeOnce(unescapeOnce(rounded)))).toEqual({ a: 1.23 });
  });
});
