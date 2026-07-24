import { allEditableInfo, attributeName, ControlType, ControlTypes, DimensionControls } from './base';

describe('editable/base', () => {
  // These numeric values are serialized into `data-editable` and persisted inside `.beam`
  // template files. This test locks them so a future reorder/insertion into the enum fails
  // loudly here instead of silently remapping the editable flags of every saved template.
  // If this test breaks, the enum was changed in a backward-incompatible way — do NOT update
  // the numbers to make it pass; append new members with new values instead.
  it('pins ControlType numeric values (must never change)', () => {
    expect({ ...ControlType }).toMatchObject({
      TEXT_CONTENT: 0,
      TEXT_TRANSFORM: 1,
      TEXT_VERTICAL: 2,
      FONT_FAMILY: 3,
      FONT_STYLE: 4,
      FONT_SIZE: 5,
      FIT_TEXT_ALIGN: 6,
      TEXTPATH_ALIGN: 7,
      TEXTPATH_OFFSET: 8,
      LINE_SPACING: 9,
      LETTER_SPACING: 10,
      POSITION_X: 11,
      POSITION_Y: 12,
      POSITION_X2: 13,
      POSITION_Y2: 14,
      _SIZE: 15,
      ROTATION: 16,
      _FLIP: 17,
      INFILL: 18,
      PATH_INFILL: 19,
      LIBRARY: 20,
      DELETE: 21,
    });
  });

  it('ControlTypes lists every enum member exactly once', () => {
    const allMembers = Object.values(ControlType).filter((v): v is ControlType => typeof v === 'number');

    expect([...ControlTypes].sort((a, b) => a - b)).toEqual(allMembers.sort((a, b) => a - b));
    expect(new Set(ControlTypes).size).toBe(ControlTypes.length);
  });

  it('allEditableInfo marks every controllable type as true', () => {
    for (const type of ControlTypes) {
      expect(allEditableInfo[type]).toBe(true);
    }
    expect(Object.keys(allEditableInfo)).toHaveLength(ControlTypes.length);
  });

  it('DimensionControls only contains position/size/rotation controls', () => {
    expect(DimensionControls).toEqual([
      ControlType.ROTATION,
      ControlType._SIZE,
      ControlType.POSITION_X,
      ControlType.POSITION_Y,
      ControlType.POSITION_X2,
      ControlType.POSITION_Y2,
    ]);
  });

  it('exposes the persisted attribute name', () => {
    expect(attributeName).toBe('data-editable');
  });
});
