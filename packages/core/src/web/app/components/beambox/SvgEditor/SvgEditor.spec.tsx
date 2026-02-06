import React from 'react';

import { render } from '@testing-library/react';

import SvgEditor from './SvgEditor';
import type { FileData } from '@core/helpers/fileImportHelper';

const mockImportFileInCurrentTab = jest.fn();

jest.mock('@core/helpers/fileImportHelper', () => ({
  importFileInCurrentTab: (...args) => mockImportFileInCurrentTab(...args),
}));

jest.mock('@core/app/components/beambox/PathPreview', () => () => <div>MockPathPreview</div>);
jest.mock('@core/app/components/common/ZoomBlock', () => () => <div>MockZoomBlock</div>);
jest.mock('@core/app/widgets/Drawer', () => ({ children }) => <div>{children}</div>);
jest.mock('@core/app/components/Chat', () => () => <div>MockChat</div>);
jest.mock('@core/app/components/AiGenerate', () => () => <div>MockAiGenerate</div>);
jest.mock('@core/app/components/AiGenerate/mobile/MobileAiGenerate', () => () => <div>MockAiGenerate</div>);
jest.mock('@core/app/components/Generators', () => () => <div>MockGenerators</div>);
jest.mock('@core/app/components/Generators/mobile/MobileGenerators', () => () => <div>MockGenerators</div>);

jest.mock('./Banner', () => () => <div>MockBanner</div>);
jest.mock('./DpiInfo', () => () => <div>MockDpiInfo</div>);
jest.mock('./ElementTitle', () => () => <div>MockElementTitle</div>);
jest.mock('./PreviewFloatingBar', () => () => <div>MockPreviewFloatingBar</div>);
jest.mock('./PreviewSlider', () => () => <div>MockPreviewSlider</div>);
jest.mock('./Ruler', () => () => <div>MockRuler</div>);
jest.mock('./TimeEstimationButton', () => () => <div>MockTimeEstimationButton</div>);
jest.mock('./Workarea', () => () => <div>MockWorkarea</div>);

const mockInit = jest.fn();

jest.mock('@core/app/actions/beambox/svg-editor', () => ({ init: () => mockInit() }));

Object.defineProperty(window, '$', { value: jest.fn() });

const mockZoom = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({ zoom: (...args) => mockZoom(...args) }));

describe('test svg-editor', () => {
  test('should render correctly in mac', () => {
    const { container } = render(<SvgEditor />);

    expect(container).toMatchSnapshot();
  });

  test('should render correctly in win', () => {
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
