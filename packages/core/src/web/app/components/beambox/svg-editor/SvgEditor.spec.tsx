import React from 'react';

import { render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';

import SvgEditor from './SvgEditor';

const mockGet = jest.fn();

jest.mock('implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));

jest.mock('./Workarea', () => () => <div>This is dummy Workarea</div>);
jest.mock('./Ruler', () => () => <div>This is dummy Ruler</div>);
jest.mock('./Banner', () => () => <div>This is dummy Banner</div>);

jest.mock('@core/app/components/beambox/path-preview/PathPreview', () => () => <div>MockPathPreview</div>);
jest.mock('@core/app/components/beambox/ZoomBlock', () => () => <div>MockZoomBlock</div>);
jest.mock('@core/app/components/beambox/DpiInfo', () => () => <div>MockDpiInfo</div>);

const mockInit = jest.fn();

jest.mock('@core/app/actions/beambox/svg-editor', () => ({
  init: () => mockInit(),
}));

Object.defineProperty(window, '$', {
  value: jest.fn(),
});

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({ mode: CanvasMode.Draw }),
}));

const mockZoom = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({
  zoom: (...args) => mockZoom(...args),
}));

describe('test svg-editor', () => {
  test('should render correctly in mac', () => {
    mockGet.mockReturnValue('inches');
    Object.defineProperty(window, 'os', {
      value: 'MacOS',
    });

    const { container } = render(<SvgEditor />);

    expect(container).toMatchSnapshot();
  });

  test('should render correctly in win', () => {
    mockGet.mockReturnValue('mm');
    Object.defineProperty(window, 'os', {
      value: 'Windows',
    });

    const { container } = render(<SvgEditor />);

    expect(container).toMatchSnapshot();
  });
});
