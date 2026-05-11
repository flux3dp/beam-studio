import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import { ContentType } from '@core/app/constants/element-panel-constants';

const mockUseIsMobile = jest.fn();

jest.mock('@core/app/stores/screenStore', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock('@core/app/contexts/ElementPanelContext', () => ({ ElementPanelContext: React.createContext({}) }));

const mockSetActiveMainType = jest.fn();

import MainTypeSelector from './MainTypeSelector';

describe('test MainTypeSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false);
  });

  it('should render nothing when contentType is not MainType', () => {
    const { baseElement } = render(
      <ElementPanelContext value={{ contentType: ContentType.Search } as any}>
        <MainTypeSelector />
      </ElementPanelContext>,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should render select and handle change correctly', () => {
    const { baseElement } = render(
      <ElementPanelContext
        value={
          {
            activeMainType: 'text',
            allTypes: ['shape', 'text'],
            contentType: ContentType.MainType,
            setActiveMainType: mockSetActiveMainType,
          } as any
        }
      >
        <MainTypeSelector />
      </ElementPanelContext>,
    );

    expect(baseElement).toMatchSnapshot();

    const trigger = baseElement.querySelector('input')!;

    fireEvent.mouseDown(trigger)!;

    expect(baseElement).toMatchSnapshot();

    const option = baseElement.querySelector('.rc-virtual-list [title="Shape"]')!;

    fireEvent.click(option)!;
    expect(mockSetActiveMainType).toHaveBeenCalledWith('shape', expect.anything());
  });
});
