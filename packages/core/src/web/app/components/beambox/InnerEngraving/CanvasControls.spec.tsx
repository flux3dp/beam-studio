import React from 'react';

import { render } from '@testing-library/react';

jest.mock(
  '@core/app/widgets/ContextMenu',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children,
);

import { ObjectControls, ViewControls } from './CanvasControls';
import { useViewStore } from './viewStore';

describe('CanvasControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the localized labels for the selected controls', () => {
    useViewStore.setState({
      projection: 'perspective',
      transformMode: 'translate',
      view: { preset: 'isometric', version: 0 },
    });

    const { getByText } = render(
      <>
        <ObjectControls />
        <ViewControls />
      </>,
    );

    expect(getByText('Move')).toBeInTheDocument();
    expect(getByText('Isometric')).toBeInTheDocument();
    expect(getByText('Perspective')).toBeInTheDocument();
  });

  test('renders a localized label when the current view is custom but not selectable', () => {
    useViewStore.setState({ view: { preset: 'custom', version: 1 } });

    const { getByText, queryByText } = render(<ViewControls />);

    expect(getByText('Custom View')).toBeInTheDocument();
    expect(queryByText('custom')).not.toBeInTheDocument();
  });
});
