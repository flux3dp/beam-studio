import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockShowColorAdvancedSetting = jest.fn();

jest.mock('./utils', () => ({
  showColorAdvancedSetting: (...args) => mockShowColorAdvancedSetting(...args),
}));

const mockGetSelectedLayers = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getSelectedLayers: () => mockGetSelectedLayers(),
}));

import ColorAdvancedSettingButton from './ColorAdvancedSettingButton';

describe('ColorAdvancedSettingButton', () => {
  beforeEach(() => {
    mockGetSelectedLayers.mockReturnValue(['layer1', 'layer2']);
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
