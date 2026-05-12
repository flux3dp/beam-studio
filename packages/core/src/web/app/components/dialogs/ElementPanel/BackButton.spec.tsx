import React from 'react';
import { render } from '@testing-library/react';

import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import { ContentType } from '@core/app/constants/element-panel-constants';

const mockUseIsMobile = jest.fn();

jest.mock('@core/app/stores/screenStore', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock('@core/app/contexts/ElementPanelContext', () => ({ ElementPanelContext: React.createContext({}) }));

const mockSetActiveSubType = jest.fn();
const mockSetSearchKey = jest.fn();

import BackButton from './BackButton';

describe('test BackButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false);
  });

  it('should render title when contentType is MainType', () => {
    const { baseElement } = render(
      <ElementPanelContext value={{ contentType: ContentType.MainType } as any}>
        <BackButton />
      </ElementPanelContext>,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should render back button when contentType is SubType', () => {
    const { baseElement } = render(
      <ElementPanelContext
        value={
          {
            activeSubType: 'shape',
            contentType: ContentType.SubType,
            setActiveSubType: mockSetActiveSubType,
            setSearchKey: mockSetSearchKey,
          } as any
        }
      >
        <BackButton />
      </ElementPanelContext>,
    );

    expect(baseElement).toMatchSnapshot();

    const button = baseElement.querySelector('button')!;

    button.click();
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);
    expect(mockSetSearchKey).not.toHaveBeenCalled();
  });

  it('should render back button when contentType is Search', () => {
    const { baseElement } = render(
      <ElementPanelContext
        value={
          {
            activeSubType: 'shape',
            contentType: ContentType.Search,
            setActiveSubType: mockSetActiveSubType,
            setSearchKey: mockSetSearchKey,
          } as any
        }
      >
        <BackButton />
      </ElementPanelContext>,
    );

    expect(baseElement).toMatchSnapshot();

    const button = baseElement.querySelector('button')!;

    button.click();
    expect(mockSetActiveSubType).toHaveBeenCalledWith('shape');
    expect(mockSetSearchKey).toHaveBeenCalledWith(undefined);
  });
});
