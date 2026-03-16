import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';

const mockApi: any = {
  component: 'rightPanelLayer',
  group: { height: 20, width: 10 },
  id: 'mock-id',
  location: { type: 'floating' },
};
const dummyProps: any = {};

jest.mock('./constants', () => ({
  borderSize: 2,
}));

const mockRemovePanel = jest.fn();

jest.mock('./utils', () => ({
  addFloatingPanel: jest.fn(),
  removePanel: mockRemovePanel,
  setMovedPanel: jest.fn(),
}));

const mockHandleNextStep = jest.fn();

jest.mock('@core/app/components/tutorials/tutorialController', () => ({
  getNextStepRequirement: () => 'TO_LAYER_PANEL',
  handleNextStep: mockHandleNextStep,
}));

import Tab from './Tab';

describe('test Tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.component = 'rightPanelLayer';
  });

  test('onClick event with tutorial', () => {
    const { container } = render(<Tab api={mockApi} {...dummyProps} />);

    expect(mockHandleNextStep).toHaveBeenCalledTimes(0);
    fireEvent.click(container.querySelector('.tab'));
    expect(mockHandleNextStep).toHaveBeenCalledTimes(1);
  });

  test('remove button', () => {
    const { container } = render(<Tab api={mockApi} {...dummyProps} />);

    expect(mockRemovePanel).toHaveBeenCalledTimes(0);
    fireEvent.click(container.querySelector('button'));
    expect(mockRemovePanel).toHaveBeenCalledTimes(1);
  });

  test('layers tab', () => {
    const { container } = render(<Tab api={mockApi} {...dummyProps} />);

    expect(container).toMatchSnapshot();
  });

  test('path edit tab', () => {
    mockApi.component = 'rightPanelPath';

    const { container } = render(<Tab api={mockApi} {...dummyProps} />);

    expect(container).toMatchSnapshot();
  });

  describe('objects tab', () => {
    beforeEach(() => {
      mockApi.component = 'rightPanelObject';
    });

    test('no selected element', () => {
      const { container } = render(
        <SelectedElementContext value={{ selectedElement: null }}>
          <Tab api={mockApi} {...dummyProps} />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
    });

    test('simple type object', () => {
      document.body.innerHTML = '<ellipse id="svg_1"></ellipse>';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <Tab api={mockApi} {...dummyProps} />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
    });

    test('multiple objects', () => {
      document.body.innerHTML = '<g id="svg_3" data-tempgroup="true"></g>';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_3') }}>
          <Tab api={mockApi} {...dummyProps} />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
    });

    test('dxf object', () => {
      document.body.innerHTML = '<use id="svg_1" data-dxf="true"></use>';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <Tab api={mockApi} {...dummyProps} />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
    });

    test('svg object', () => {
      document.body.innerHTML = '<use id="svg_1" data-svg="true"></use>';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <Tab api={mockApi} {...dummyProps} />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
    });

    test('textpath object', () => {
      document.body.innerHTML = '<g id="svg_1" data-textpath-g="1"></g>';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <Tab api={mockApi} {...dummyProps} />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
    });

    test('other types', () => {
      document.body.innerHTML = '<use id="svg_1"></use>';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <Tab api={mockApi} {...dummyProps} />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
    });
  });
});
