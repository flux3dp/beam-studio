import React from 'react';

import { render } from '@testing-library/react';

import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import { ContentType } from '@core/app/constants/element-panel-constants';
import { useScreenStore } from '@core/app/stores/screenStore';

window.innerHeight = 667;

jest.mock('@core/app/contexts/ElementPanelContext', () => ({ ElementPanelContext: React.createContext({}) }));

jest.mock('./MainContent', () => 'main-content');
jest.mock('./BackButton', () => 'back-button');
jest.mock('./SearchBar', () => 'search-bar');
jest.mock('./MainTypeSelector', () => 'main-type-selector');

import { ElementPanelContent } from './ElementPanel';

describe('test ElementPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render MainType correctly', () => {
    const { baseElement } = render(
      <ElementPanelContext value={{ contentType: ContentType.MainType } as any}>
        <ElementPanelContent />
      </ElementPanelContext>,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should render Search correctly', () => {
    const { baseElement } = render(
      <ElementPanelContext value={{ contentType: ContentType.Search } as any}>
        <ElementPanelContent />
      </ElementPanelContext>,
    );

    expect(baseElement).toMatchSnapshot();
  });
});

describe('test ElementPanel in mobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScreenStore.setState({ isMobile: true });
  });

  it('should render MainType correctly', () => {
    const { baseElement } = render(
      <ElementPanelContext value={{ contentType: ContentType.MainType } as any}>
        <ElementPanelContent />
      </ElementPanelContext>,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should render SubType correctly', () => {
    const { baseElement } = render(
      <ElementPanelContext value={{ contentType: ContentType.SubType } as any}>
        <ElementPanelContent />
      </ElementPanelContext>,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should render Search correctly', () => {
    const { baseElement } = render(
      <ElementPanelContext value={{ contentType: ContentType.Search } as any}>
        <ElementPanelContent />
      </ElementPanelContext>,
    );

    expect(baseElement).toMatchSnapshot();
  });
});
