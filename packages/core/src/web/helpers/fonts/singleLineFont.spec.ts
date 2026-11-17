import type { Path, PathCommand } from 'fontkit';

import { isSingleLineFont, pathToOpenSvg } from './singleLineFont';

const cmd = (command: string, ...args: number[]) => ({ args, command }) as PathCommand;
const path = (...commands: PathCommand[]) => ({ commands }) as Path;

// Glyph "A" of a single-line font: crossbar + an open inverted V.
const singleLineA = path(
  cmd('moveTo', 155, 213),
  cmd('lineTo', 522, 213),
  cmd('closePath'),
  cmd('moveTo', 606, 0),
  cmd('lineTo', 342, 675),
  cmd('lineTo', 338, 675),
  cmd('lineTo', 70, 0),
  cmd('closePath'),
);

describe('isSingleLineFont', () => {
  test('follows the data-single-line attribute only', () => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    expect(isSingleLineFont(text)).toBe(false);
    text.setAttribute('data-single-line', 'true');
    expect(isSingleLineFont(text)).toBe(true);
    text.setAttribute('data-single-line', 'false');
    expect(isSingleLineFont(text)).toBe(false);
  });
});

describe('pathToOpenSvg', () => {
  test('drops the closing segment of open contours', () => {
    expect(pathToOpenSvg(singleLineA, 10)).toBe('M155 213L522 213M606 0L342 675L338 675L70 0');
  });

  test('keeps Z when the ends meet within the gap', () => {
    const almostClosed = path(
      cmd('moveTo', 357, 680),
      cmd('quadraticCurveTo', 95, 680, 95, 341),
      cmd('lineTo', 359, 680),
      cmd('closePath'),
    );

    expect(pathToOpenSvg(almostClosed, 10)).toBe('M357 680Q95 680 95 341L359 680Z');
    expect(pathToOpenSvg(almostClosed, 1)).toBe('M357 680Q95 680 95 341L359 680');
  });

  test('matches fontkit number rounding', () => {
    expect(pathToOpenSvg(path(cmd('moveTo', 1.234, 5.678), cmd('lineTo', 1.234, 5.678), cmd('closePath')), 1)).toBe(
      'M1.23 5.68L1.23 5.68Z',
    );
  });
});
