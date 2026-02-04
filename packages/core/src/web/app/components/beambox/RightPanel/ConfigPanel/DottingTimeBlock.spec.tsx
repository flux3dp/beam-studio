import React from 'react';

import { render } from '@testing-library/react';

import useLayerStore from '@core/app/stores/layer/layerStore';
import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

import DottingTimeBlock from './DottingTimeBlock';

describe('test DottingTimeBlock', () => {
  beforeEach(() => {
    useLayerStore.setState({ hasGradient: false });
  });

  it('should render correctly when type is default', () => {
    useLayerStore.setState({ hasGradient: true });

    const { container } = render(<DottingTimeBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when no gradient images in canvas', () => {
    const { container } = render(<DottingTimeBlock />);

    expect(container).toBeEmptyDOMElement();
  });
});
