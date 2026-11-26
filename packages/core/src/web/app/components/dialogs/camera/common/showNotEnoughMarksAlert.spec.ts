import i18n from '@core/helpers/i18n';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: (...args: any[]) => mockPopUp(...args) }));

import showNotEnoughMarksAlert from './showNotEnoughMarksAlert';

const t = i18n.lang.calibration;

describe('showNotEnoughMarksAlert', () => {
  test('says how many marks were found and offers the manual steps as the main choice', () => {
    const onManual = jest.fn();

    showNotEnoughMarksAlert({ found: 6, onManual, total: 8 });

    const { buttons, message } = mockPopUp.mock.calls[0][0];

    expect(message).toContain('8');
    expect(message).toContain('6');
    expect(message).not.toContain('%');
    expect(buttons.map((b: any) => [b.label, b.type])).toEqual([
      [i18n.lang.alert.cancel, undefined],
      [t.auto_solve_pnp_calibrate_manually, 'primary'],
    ]);

    buttons[1].onClick();
    expect(onManual).toHaveBeenCalledTimes(1);
  });
});
