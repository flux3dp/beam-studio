import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock(
  '@core/app/widgets/Unit-Input-v2',
  () =>
    ({ className, decimal, defaultValue, displayMultiValue, getValue, max, min }: any) => (
      <div>
        mock-unit-input min:{min}
        max:{max}
        decimal:{decimal}
        defaultValue:{defaultValue}
        displayMultiValue:{displayMultiValue ? 'true' : 'false'}
        className:{JSON.stringify(className)}
        <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
      </div>
    ),
);

jest.mock('@core/app/views/beambox/Right-Panels/ObjectPanelItem');

<<<<<<<< Updated upstream:packages/core/src/web/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/components/StartOffsetBlock.spec.tsx
import StartOffsetBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/components/StartOffsetBlock';
========
// Mock store
const mockStore = {
  configs: {
    startOffset: { hasMultiValue: false, value: 50 },
  },
  handleStartOffsetChange: jest.fn(),
};

jest.mock('../../stores/useTextOptionsStore', () => ({
  useTextOptionsStore: () => mockStore,
}));

import StartOffsetBlock from './StartOffsetBlock';
>>>>>>>> Stashed changes:packages/core/src/web/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/components/TextPathOptions/StartOffsetBlock.spec.tsx

describe('test StartOffsetBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsMobile.mockReturnValue(false);
    mockStore.configs.startOffset = { hasMultiValue: false, value: 0 };
  });

  test('should render correctly', () => {
    const { container } = render(<StartOffsetBlock />);

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('div.option-block'));
    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('input.unit-input'), { target: { value: 100 } });
    expect(mockStore.handleStartOffsetChange).toHaveBeenCalledTimes(1);
    expect(mockStore.handleStartOffsetChange).toHaveBeenNthCalledWith(1, 100);
    expect(container).toMatchSnapshot();
  });

  test('should render correctly with multiple values', () => {
    mockStore.configs.startOffset = { hasMultiValue: true, value: 0 };

    const { container } = render(<StartOffsetBlock />);

    expect(container).toMatchSnapshot();
  });

  test('should render correctly in mobile', () => {
    useIsMobile.mockReturnValue(true);

    const { container } = render(<StartOffsetBlock />);

    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('input'), { target: { value: 100 } });
    expect(mockStore.handleStartOffsetChange).toHaveBeenCalledTimes(1);
    expect(mockStore.handleStartOffsetChange).toHaveBeenNthCalledWith(1, 100);
  });

  test('should render correctly with multiple values in mobile', () => {
    useIsMobile.mockReturnValue(true);
    mockStore.configs.startOffset = { hasMultiValue: true, value: 0 };

    const { container } = render(<StartOffsetBlock />);

    expect(container).toMatchSnapshot();
  });
});
