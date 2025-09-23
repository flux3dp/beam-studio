import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

import ConfigPanelContext from './ConfigPanelContext';

const mockUseConfigPanelStore = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: mockUseConfigPanelStore,
}));

const mockUseSupportedModules = jest.fn();

jest.mock('@core/helpers/hooks/useSupportedModules', () => ({
  useSupportedModules: mockUseSupportedModules,
}));

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => mockUseWorkarea);

const mockGetLayerElementByName = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getLayerElementByName: mockGetLayerElementByName,
}));

const mockChangeLayersModule = jest.fn();

jest.mock('@core/helpers/layer-module/change-module', () => ({
  changeLayersModule: mockChangeLayersModule,
}));

import ModuleBlock from './ModuleBlock';

const mockSelectedLayers = ['layer1', 'layer2'];

describe('test ModuleBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkarea.mockReturnValue('ado1');
    mockUseConfigPanelStore.mockReturnValue({
      module: { hasMultiValue: false, value: LayerModule.LASER_10W_DIODE },
    });
    mockUseSupportedModules.mockReturnValue([LayerModule.LASER_10W_DIODE, LayerModule.LASER_20W_DIODE]);
  });

  it('should render correctly', () => {
    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(mockUseWorkarea).toHaveBeenCalledTimes(1);
    expect(mockGetLayerElementByName).toHaveBeenCalledTimes(2);
  });

  it('should not render when workarea does not support module', () => {
    mockUseWorkarea.mockReturnValue('fpm1');
    mockUseSupportedModules.mockReturnValue([LayerModule.LASER_UNIVERSAL]);

    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('change to 20w should work', () => {
    const mockLayerElem = {};

    mockGetLayerElementByName.mockReturnValue(mockLayerElem);

    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: ['layer1'] }}>
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    fireEvent.mouseDown(baseElement.querySelector('.ant-select-selector'));
    fireEvent.click(getByText('20W Diode Laser'));
    expect(mockChangeLayersModule).toHaveBeenCalledTimes(1);
    expect(mockChangeLayersModule).toHaveBeenCalledWith(
      [mockLayerElem],
      LayerModule.LASER_10W_DIODE,
      LayerModule.LASER_20W_DIODE,
      { addToHistory: true },
    );
    expect(baseElement).toMatchSnapshot();
  });
});
