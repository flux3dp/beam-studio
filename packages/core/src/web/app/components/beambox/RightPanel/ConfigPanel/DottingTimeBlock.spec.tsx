import React from 'react';

import { render } from '@testing-library/react';

import { useLayerStore } from '@core/app/stores/layer/layerStore';
import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

let mockPanelState: Record<string, unknown> = {};

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (selector: (state: Record<string, unknown>) => unknown) => selector(mockPanelState),
}));

const mockUseInnerEngravingActive = jest.fn();

jest.mock('@core/helpers/addOn/innerEngraving', () => ({
  useInnerEngravingActive: () => mockUseInnerEngravingActive(),
}));

import DottingTimeBlock from './DottingTimeBlock';

describe('test DottingTimeBlock', () => {
  beforeEach(() => {
    useLayerStore.setState({ hasGradient: false });
    mockUseInnerEngravingActive.mockReturnValue(false);
    mockPanelState = {};
  });

  it('should render correctly when type is default', () => {
    useLayerStore.setState({ hasGradient: true });

    const { container } = render(<DottingTimeBlock />);

    expect(container).toMatchSnapshot();
  });

  it('has no gradient-only note in inner engraving dot mode, where every dot uses it', () => {
    mockUseInnerEngravingActive.mockReturnValue(true);
    mockPanelState = { stlMode: { value: 'dot' } };

    const { container, queryByText } = render(<DottingTimeBlock />);

    expect(container).not.toBeEmptyDOMElement();
    expect(queryByText(/^tooltip:/)).toBeNull();
  });

  it('keeps the note in inner engraving line mode, where only the images are dotted', () => {
    mockUseInnerEngravingActive.mockReturnValue(true);
    mockPanelState = { stlMode: { value: 'line' } };

    const { getByText } = render(<DottingTimeBlock />);

    expect(getByText(/^tooltip:/)).toBeInTheDocument();
  });

  it('keeps the gradient-only note in 2D', () => {
    useLayerStore.setState({ hasGradient: true });

    const { getByText } = render(<DottingTimeBlock />);

    expect(getByText(/^tooltip:/)).toBeInTheDocument();
  });

  it('should render correctly when no gradient images in canvas', () => {
    const { container } = render(<DottingTimeBlock />);

    expect(container).toBeEmptyDOMElement();
  });
});
