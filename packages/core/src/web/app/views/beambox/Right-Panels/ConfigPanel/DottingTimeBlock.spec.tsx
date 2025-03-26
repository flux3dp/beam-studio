import React from 'react';

import { render } from '@testing-library/react';

import { LayerPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';

import MockNumberBlock from '@mocks/@core/app/views/beambox/Right-Panels/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

import DottingTimeBlock from './DottingTimeBlock';

jest.mock('@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext', () => ({
  LayerPanelContext: React.createContext({ hasGradient: false }),
}));

describe('test DottingTimeBlock', () => {
  it('should render correctly when type is default', () => {
    const { container } = render(
      <LayerPanelContext.Provider value={{ hasGradient: true } as any}>
        <DottingTimeBlock />
      </LayerPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when no gradient images in canvas', () => {
    const { container } = render(
      <LayerPanelContext.Provider value={{ hasGradient: false } as any}>
        <DottingTimeBlock />
      </LayerPanelContext.Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
