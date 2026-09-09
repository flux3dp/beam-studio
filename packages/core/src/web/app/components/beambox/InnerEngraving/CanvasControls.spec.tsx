import React from 'react';

import { render } from '@testing-library/react';

jest.mock('@core/app/widgets/ContextMenu', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@core/helpers/useI18n', () => () => ({
  inner_engraving: {
    canvas_controls: {
      back: 'localized back',
      bottom: 'localized bottom',
      front: 'localized front',
      isometric: 'localized isometric',
      left: 'localized left',
      move: 'localized move',
      orthographic: 'localized orthographic',
      perspective: 'localized perspective',
      right: 'localized right',
      rotate: 'localized rotate',
      scale: 'localized scale',
      top: 'localized top',
    },
  },
}));

import { ObjectControls, ViewControls } from './CanvasControls';
import { useViewStore } from './viewStore';

describe('CanvasControls', () => {
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

    expect(getByText('localized move')).toBeInTheDocument();
    expect(getByText('localized isometric')).toBeInTheDocument();
    expect(getByText('localized perspective')).toBeInTheDocument();
  });
});
