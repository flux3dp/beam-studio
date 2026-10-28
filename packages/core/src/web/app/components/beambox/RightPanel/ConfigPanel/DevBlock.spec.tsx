import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockIsDev = jest.fn();
const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/is-dev', () => ({ __esModule: true, default: () => mockIsDev() }));
jest.mock('@core/helpers/hooks/useWorkarea', () => () => mockUseWorkarea());
jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (selector: (state: unknown) => unknown) =>
    selector({ fullcolor: { value: false }, module: { value: 1 } }),
}));
jest.mock('./Backlash', () => () => <div>Backlash</div>);
jest.mock('./BlendKWithCmyBlock', () => () => <div>BlendKWithCmyBlock</div>);
jest.mock('./ColorAdvancedSetting/ColorAdvancedSettingButton', () => () => <div>ColorAdvancedSettingButton</div>);
jest.mock('./LaserDevOptions', () => () => <div>LaserDevOptions</div>);
jest.mock('./MinPadding', () => () => <div>MinPadding</div>);
jest.mock('./NozzleBlock', () => () => <div>NozzleBlock</div>);
jest.mock('./PrintingPaddingBlock', () => () => <div>PrintingPaddingBlock</div>);
jest.mock('./QPulseWidthBlock', () => () => <div>QPulseWidthBlock</div>);
jest.mock('./RefreshThresholdBlock', () => () => <div>RefreshThresholdBlock</div>);
jest.mock('./SCurveBlock', () => () => <div>SCurveBlock</div>);
jest.mock('./WhiteInkCheckbox', () => () => <div>WhiteInkCheckbox</div>);

import DevBlock from './DevBlock';

const open = (container: HTMLElement) => fireEvent.click(container.querySelector('.ant-collapse-header')!);

describe('DevBlock', () => {
  beforeEach(() => {
    mockIsDev.mockReturnValue(true);
    mockUseWorkarea.mockReturnValue('fpm1');
  });

  test('holds the Q pulse width on Promark', () => {
    const { container, getByText } = render(<DevBlock />);

    open(container);
    expect(getByText('QPulseWidthBlock')).toBeInTheDocument();
  });

  test('has no Q pulse width on other machines', () => {
    mockUseWorkarea.mockReturnValue('fbm1');

    const { container, queryByText } = render(<DevBlock />);

    open(container);
    expect(queryByText('QPulseWidthBlock')).toBeNull();
  });

  test('is not shown outside developer mode', () => {
    mockIsDev.mockReturnValue(false);

    const { container } = render(<DevBlock />);

    expect(container).toBeEmptyDOMElement();
  });
});
