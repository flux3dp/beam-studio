import React, { createContext } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { LaserType } from '@core/app/constants/promark-constants';

import AdvancedBlock from './AdvancedBlock';
import { useDocumentStore } from '@mocks/@core/app/stores/documentStore';

const mockOn = jest.fn();
const mockOff = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    off: (...args) => mockOff(...args),
    on: (...args) => mockOn(...args),
  }),
}));

const mockForceUpdate = jest.fn();

jest.mock('@core/helpers/use-force-update', () => () => mockForceUpdate);

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => () => mockUseWorkarea());

const mockGetAddOnInfo = jest.fn();

jest.mock('@core/app/constants/addOn', () => ({
  ...jest.requireActual<object>('@core/app/constants/addOn'),
  getAddOnInfo: (...args) => mockGetAddOnInfo(...args),
}));

const mockGetPromarkInfo = jest.fn();

jest.mock('@core/helpers/device/promark/promark-info', () => ({
  getPromarkInfo: (...args) => mockGetPromarkInfo(...args),
}));

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getPromarkLimit: () => ({
    frequency: { max: 4000, min: 1 },
    pulseWidth: { max: 350, min: 2 },
  }),
}));

const mockUseHasCurveEngraving = jest.fn();

jest.mock('@core/helpers/hooks/useHasCurveEngraving', () => () => mockUseHasCurveEngraving());

jest.mock('./AmDensityBlock', () => () => <div>Mock AmDensityBlock</div>);
jest.mock('./AutoFocus', () => () => <div>Mock AutoFocus</div>);
jest.mock('./CurveEngravingZHighSpeed', () => () => <div>Mock CurveEngravingZHighSpeed</div>);
jest.mock('./ColorAdvancedSetting/ColorAdvancedSettingButton', () => () => <div>Mock ColorAdvancedSettingButton</div>);
jest.mock('./Delay', () => () => <div>Mock Delay</div>);
jest.mock('./Diode', () => () => <div>Mock Diode</div>);
jest.mock('./FocusBlock', () => ({ type }: { type: string }) => <div>Mock FocusBlock: {type}</div>);
jest.mock('./FrequencyBlock', () => () => <div>Mock FrequencyBlock</div>);
jest.mock('./NozzleBlock', () => () => <div>Mock NozzleBlock</div>);
jest.mock('./PulseWidthBlock', () => () => <div>Mock PulseWidthBlock</div>);
jest.mock('./SingleColorBlock', () => () => <div>Mock SingleColorBlock</div>);
jest.mock('./WobbleBlock', () => () => <div>Mock WobbleBlock</div>);
jest.mock('./ConfigPanelContext', () => createContext(null));
jest.mock('./RefreshIntervalBlock', () => () => <div>Mock RefreshIntervalBlock</div>);
jest.mock('./RefreshThresholdBlock', () => () => <div>Mock RefreshThresholdBlock</div>);

const mockUseConfigPanelStore = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test AdvancedBlock', () => {
  beforeEach(() => {
    useDocumentStore.setState({ 'enable-autofocus': true, 'enable-diode': true, workarea: 'fbm1' });
    mockGetAddOnInfo.mockReturnValue({ autoFocus: false, hybridLaser: false, lowerFocus: false });
    mockUseHasCurveEngraving.mockReturnValue(false);
    mockUseWorkarea.mockReturnValue('fbb1');
    mockGetPromarkInfo.mockReturnValue(null);
    mockUseConfigPanelStore.mockReturnValue({ module: { value: LayerModule.LASER_UNIVERSAL } });
  });

  it('should render correctly for non-printer, no addon', () => {
    useDocumentStore.setState({ 'enable-autofocus': false, 'enable-diode': false });

    const { container } = render(<AdvancedBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly for autofocus, diode', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: true, hybridLaser: true, lowerFocus: false });

    const { container } = render(<AdvancedBlock />);
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly for lower focus, diode', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: true, hybridLaser: true, lowerFocus: true });

    const { container } = render(<AdvancedBlock />);
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly for printer', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: true, hybridLaser: true, lowerFocus: true });
    mockUseConfigPanelStore.mockReturnValue({ module: { value: LayerModule.PRINTER } });

    const { container } = render(<AdvancedBlock />);
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly for printer 4c', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: true, hybridLaser: true, lowerFocus: true });
    mockUseConfigPanelStore.mockReturnValue({ module: { value: LayerModule.PRINTER_4C } });

    const { container } = render(<AdvancedBlock />);
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly for promark desktop', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: false, hybridLaser: false, lowerFocus: true });
    mockUseWorkarea.mockReturnValue('fpm1');
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.Desktop, watt: 20 });

    const { container } = render(<AdvancedBlock />);
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly for promark mopa', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: false, hybridLaser: false, lowerFocus: true });
    mockUseWorkarea.mockReturnValue('fpm1');
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.MOPA, watt: 20 });

    const { container } = render(<AdvancedBlock />);
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly with curve engraving', () => {
    mockUseHasCurveEngraving.mockReturnValue(true);
    mockGetAddOnInfo.mockReturnValue({ autoFocus: true, hybridLaser: false, lowerFocus: true });
    mockUseWorkarea.mockReturnValue('fbb2');

    const { container } = render(<AdvancedBlock />);
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });
});
