import React, { createContext } from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockShowColorAdvancedSetting = jest.fn();

jest.mock('./utils', () => ({
  showColorAdvancedSetting: (...args) => mockShowColorAdvancedSetting(...args),
}));

jest.mock('../ConfigPanelContext', () => createContext({ selectedLayers: ['layer1', 'layer2'] }));

import ColorAdvancedSettingButton from './ColorAdvancedSettingButton';

describe('ColorAdvancedSettingButton', () => {
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
