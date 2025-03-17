import React, { createContext } from 'react';

import { fireEvent, render } from '@testing-library/react';

import LayerModule from '@core/app/constants/layer-module/layer-modules';
import { LaserType } from '@core/app/constants/promark-constants';

import AdvancedBlock from './AdvancedBlock';
import ConfigPanelContext from './ConfigPanelContext';

const mockRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (key: string) => mockRead(key),
}));

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

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        advanced: 'advanced',
      },
    },
  },
}));

const mockGetAddOnInfo = jest.fn();

jest.mock('@core/app/constants/add-on', () => ({
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

jest.mock('./AutoFocus', () => () => <div>Mock AutoFocus</div>);
jest.mock('./CurveEngravingZHighSpeed', () => () => <div>Mock CurveEngravingZHighSpeed</div>);
jest.mock('./Diode', () => () => <div>Mock Diode</div>);
jest.mock('./FocusBlock', () => ({ type }: { type: string }) => <div>Mock FocusBlock: {type}</div>);
jest.mock('./FrequencyBlock', () => () => <div>Mock FrequencyBlock</div>);
jest.mock('./PulseWidthBlock', () => () => <div>Mock PulseWidthBlock</div>);
jest.mock('./SingleColorBlock', () => () => <div>Mock SingleColorBlock</div>);
jest.mock('./WobbleBlock', () => () => <div>Mock WobbleBlock</div>);
jest.mock('./ConfigPanelContext', () => createContext(null));

describe('test AdvancedBlock', () => {
  beforeEach(() => {
    mockRead.mockReturnValue(true);
    mockGetAddOnInfo.mockReturnValue({ autoFocus: false, hybridLaser: false, lowerFocus: false });
    mockUseHasCurveEngraving.mockReturnValue(false);
    mockUseWorkarea.mockReturnValue('fbb1');
    mockGetPromarkInfo.mockReturnValue(null);
  });

  it('should render correctly for non-printer, no addon', () => {
    mockRead.mockReturnValue(false);

    const { container } = render(
      <ConfigPanelContext.Provider value={{ state: { module: { value: LayerModule.LASER_UNIVERSAL } } } as any}>
        <AdvancedBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly for autofocus, diode', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: true, hybridLaser: true, lowerFocus: false });

    const { container } = render(
      <ConfigPanelContext.Provider value={{ state: { module: { value: LayerModule.LASER_UNIVERSAL } } } as any}>
        <AdvancedBlock />
      </ConfigPanelContext.Provider>,
    );
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly for lower focus, diode', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: true, hybridLaser: true, lowerFocus: true });

    const { container } = render(
      <ConfigPanelContext.Provider value={{ state: { module: { value: LayerModule.LASER_UNIVERSAL } } } as any}>
        <AdvancedBlock />
      </ConfigPanelContext.Provider>,
    );
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly for printer', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: true, hybridLaser: true, lowerFocus: true });

    const { container } = render(
      <ConfigPanelContext.Provider value={{ state: { module: { value: LayerModule.PRINTER } } } as any}>
        <AdvancedBlock />
      </ConfigPanelContext.Provider>,
    );
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly for promark desktop', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: false, hybridLaser: false, lowerFocus: true });
    mockUseWorkarea.mockReturnValue('fpm1');
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.Desktop, watt: 20 });

    const { container } = render(
      <ConfigPanelContext.Provider value={{ state: { module: { value: LayerModule.LASER_UNIVERSAL } } } as any}>
        <AdvancedBlock />
      </ConfigPanelContext.Provider>,
    );
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly for promark mopa', () => {
    mockGetAddOnInfo.mockReturnValue({ autoFocus: false, hybridLaser: false, lowerFocus: true });
    mockUseWorkarea.mockReturnValue('fpm1');
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.MOPA, watt: 20 });

    const { container } = render(
      <ConfigPanelContext.Provider value={{ state: { module: { value: LayerModule.LASER_UNIVERSAL } } } as any}>
        <AdvancedBlock />
      </ConfigPanelContext.Provider>,
    );
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly with curve engraving', () => {
    mockUseHasCurveEngraving.mockReturnValue(true);
    mockGetAddOnInfo.mockReturnValue({ autoFocus: true, hybridLaser: false, lowerFocus: true });

    const { container } = render(
      <ConfigPanelContext.Provider value={{ state: { module: { value: LayerModule.LASER_UNIVERSAL } } } as any}>
        <AdvancedBlock />
      </ConfigPanelContext.Provider>,
    );
    const collapseHeader = container.querySelector('.ant-collapse-header');

    fireEvent.click(collapseHeader);
    expect(container).toMatchSnapshot();
  });
});
