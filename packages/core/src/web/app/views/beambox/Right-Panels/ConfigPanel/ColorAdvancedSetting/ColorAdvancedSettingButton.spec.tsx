import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import useLayerStore from '@core/app/stores/layer/layerStore';

const mockShowColorAdvancedSetting = jest.fn();

jest.mock('./utils', () => ({
  showColorAdvancedSetting: (...args) => mockShowColorAdvancedSetting(...args),
}));

import ColorAdvancedSettingButton from './ColorAdvancedSettingButton';

describe('ColorAdvancedSettingButton', () => {
  beforeEach(() => {
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });
  });

  it('should renders correctly', () => {
    const { container } = render(<ColorAdvancedSettingButton />);

    expect(container).toMatchSnapshot();
  });

  it('should call showColorAdvancedSetting when clicked', () => {
    const { container } = render(<ColorAdvancedSettingButton />);
    const title = container.querySelector('.title');

    fireEvent.click(title);
    expect(mockShowColorAdvancedSetting).toHaveBeenCalled();
  });
});
