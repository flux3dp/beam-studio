import React from 'react';

import { render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';

import SvgEditor from './SvgEditor';
import type { FileData } from '@core/helpers/fileImportHelper';

const mockImportFileInCurrentTab = jest.fn();

jest.mock('@core/helpers/fileImportHelper', () => ({
  importFileInCurrentTab: (...args) => mockImportFileInCurrentTab(...args),
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
    Object.defineProperty(window, 'os', {
      value: 'MacOS',
    });

    const { container } = render(<SvgEditor />);

    expect(container).toMatchSnapshot();
  });

  test('should render correctly in win', () => {
    Object.defineProperty(window, 'os', {
      value: 'Windows',
    });

    const { container } = render(<SvgEditor />);

    expect(container).toMatchSnapshot();
  });

  test('should handle file correctly', () => {
    const mockFile: FileData = { filePath: 'mock-path', type: 'recent' };

    window.importingFile = mockFile;
    render(<SvgEditor />);
    expect(mockImportFileInCurrentTab).toHaveBeenCalledWith(mockFile);
    expect(window.importingFile).toBe(undefined);
  });
});
