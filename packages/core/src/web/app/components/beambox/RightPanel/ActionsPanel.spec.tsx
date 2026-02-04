import React from 'react';

import { fireEvent, getAllByText, render } from '@testing-library/react';

import i18n from '@core/helpers/i18n';
import { VariableTextType } from '@core/interfaces/ObjectPanel';

const mockShowCropPanel = jest.fn();
const mockSvgNestButtons = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showCropPanel: (...args) => mockShowCropPanel(...args),
  showStampMakerPanel: (...args) => mockShowStampMakerPanel(...args),
  showSvgNestButtons: (...args) => mockSvgNestButtons(...args),
}));

const getFileFromDialog = jest.fn();

jest.mock('@core/implementations/dialog', () => ({
  getFileFromDialog,
}));

const convertTextToPathFontFunc = jest.fn();

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  convertTextToPath: (...args) => convertTextToPathFontFunc(...args),
}));

const mockTraceImage = jest.fn();
const mockShowStampMakerPanel = jest.fn();
const colorInvert = jest.fn();
const mockRemoveBackground = jest.fn();
const mockPotrace = jest.fn();

jest.mock('@core/helpers/image-edit', () => ({
  colorInvert,
  potrace: (...args) => mockPotrace(...args),
  removeBackground: (...args) => mockRemoveBackground(...args),
  traceImage: (...args) => mockTraceImage(...args),
}));

const renderText = jest.fn();

jest.mock('@core/app/svgedit/text/textedit', () => ({
  renderText,
}));

const editTextPath = jest.fn();
const detachText = jest.fn();
const attachTextToPath = jest.fn();

jest.mock('@core/app/actions/beambox/textPathEdit', () => ({
  attachTextToPath,
  detachText,
  editPath: editTextPath,
}));

const mockShowCurvePanel = jest.fn();
const mockShowRotaryWarped = jest.fn();
const mockShowSharpenPanel = jest.fn();

jest.mock('@core/app/components/dialogs/image', () => ({
  showCurvePanel: (...args) => mockShowCurvePanel(...args),
  showRotaryWarped: (...args) => mockShowRotaryWarped(...args),
  showSharpenPanel: (...args) => mockShowSharpenPanel(...args),
}));

const openNonstopProgress = jest.fn();
const popById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress,
  popById,
}));

const toSelectMode = jest.fn();

jest.mock('@core/app/svgedit/text/textactions', () => ({
  isEditing: true,
  toSelectMode,
}));

const mockGetVariableTextType = jest.fn();

jest.mock('@core/helpers/variableText', () => ({
  getVariableTextType: mockGetVariableTextType,
}));

jest.mock('@core/helpers/web-need-connection-helper', () => (callback) => callback());

const mockCheckConnection = jest.fn();

jest.mock('@core/helpers/api/discover', () => ({
  checkConnection: mockCheckConnection,
}));

const getSVGAsync = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const isMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  isMobile: () => isMobile(),
}));

const disassembleUse = jest.fn();

jest.mock('@core/app/svgedit/operations/disassembleUse', () => disassembleUse);
jest.mock('@core/app/svgedit/operations/delete', () => ({ deleteElements: jest.fn() }));

const clearSelection = jest.fn();
const decomposePath = jest.fn();
const replaceBitmap = jest.fn();
const pathActions = {
  toEditMode: jest.fn(),
};

getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: { clearSelection, decomposePath, pathActions },
    Editor: { replaceBitmap },
  });
});

const convertSvgToPath = jest.fn();
const convertUseToPath = jest.fn();
const convertTextToPath = jest.fn();
const convertTextOnPathToPath = jest.fn();

jest.mock('@core/helpers/convertToPath', () => ({
  convertSvgToPath,
  convertTextOnPathToPath,
  convertTextToPath,
  convertUseToPath,
}));

const convertSvgToImage = jest.fn();

jest.mock('@core/helpers/convertToImage', () => ({
  convertSvgToImage,
}));

import ActionsPanel from './ActionsPanel';

const mockUpdateElementColor = jest.fn();

jest.mock(
  '@core/helpers/color/updateElementColor',
  () =>
    (...args) =>
      mockUpdateElementColor(...args),
);

function tick() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

const tActionPanel = i18n.lang.beambox.right_panel.object_panel.actions_panel;
const mockAutoFit = jest.fn();

jest.mock(
  '@core/app/svgedit/operations/autoFit',
  () =>
    (...args) =>
      mockAutoFit(...args),
);

const mockShowArrayModal = jest.fn();

jest.mock('@core/app/components/dialogs/ArrayModal', () => ({
  showArrayModal: (...args) => mockShowArrayModal(...args),
}));

const mockShowOffsetModal = jest.fn();

jest.mock('@core/app/components/dialogs/OffsetModal', () => ({
  showOffsetModal: (...args) => mockShowOffsetModal(...args),
}));

describe('should render correctly', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetVariableTextType.mockReturnValue(VariableTextType.NONE);
  });

  test('no elements', () => {
    const { container } = render(<ActionsPanel elem={null} />);

    expect(container).toMatchSnapshot();
  });

  test('image', async () => {
    document.body.innerHTML = '<image id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    const blob = new Blob();

    getFileFromDialog.mockResolvedValueOnce(blob);

    fireEvent.click(getByText(tActionPanel.replace_with));
    await tick();
    expect(getFileFromDialog).toHaveBeenCalledTimes(1);
    expect(getFileFromDialog).toHaveBeenNthCalledWith(1, {
      filters: [
        {
          extensions: ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'bmp', 'jp2', 'j2k', 'jpf', 'jpx', 'jpm'],
          name: 'Images',
        },
      ],
    });
    expect(replaceBitmap).toHaveBeenCalledTimes(1);
    expect(replaceBitmap).toHaveBeenNthCalledWith(1, blob, document.getElementById('svg_1'));

    jest.resetAllMocks();
    getFileFromDialog.mockResolvedValueOnce(null);
    fireEvent.click(getByText(tActionPanel.replace_with));
    await tick();
    expect(replaceBitmap).not.toHaveBeenCalled();

    fireEvent.click(getByText(tActionPanel.ai_bg_removal));
    expect(mockRemoveBackground).toHaveBeenCalledTimes(1);
    expect(mockRemoveBackground).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));

    fireEvent.click(getByText(tActionPanel.trace));
    expect(mockTraceImage).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText(tActionPanel.grading));
    expect(mockShowCurvePanel).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText(tActionPanel.sharpen));
    expect(mockShowSharpenPanel).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText(tActionPanel.crop));
    expect(mockShowCropPanel).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText('Stamp Maker'));
    expect(mockShowStampMakerPanel).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText(tActionPanel.invert));
    expect(colorInvert).toHaveBeenCalledTimes(1);
    expect(colorInvert).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));

    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('text', async () => {
    Object.defineProperty(window, 'FLUX', { value: { version: 'web' } });
    document.body.innerHTML = '<text id="svg_1" />';

    const { container, getByText, rerender } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    convertTextToPathFontFunc.mockResolvedValueOnce({ path: null });
    fireEvent.click(getByText(tActionPanel.convert_to_path));
    await tick();
    expect(convertTextToPath).toHaveBeenCalledTimes(1);
    expect(convertTextToPath).toHaveBeenNthCalledWith(1, {
      element: document.getElementById('svg_1'),
      isToSelect: true,
    });

    convertTextToPathFontFunc.mockResolvedValueOnce({ path: null });
    fireEvent.click(getByText(tActionPanel.weld_text));
    await tick();
    expect(convertTextToPath).toHaveBeenCalledTimes(2);
    expect(convertTextToPath).toHaveBeenNthCalledWith(2, {
      element: document.getElementById('svg_1'),
      isToSelect: true,
      weldingTexts: true,
    });

    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);

    mockGetVariableTextType.mockReturnValue(VariableTextType.NUMBER);
    rerender(<ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />);
    expect(container).toMatchSnapshot();
  });

  test('path', () => {
    document.body.innerHTML = '<path id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText(tActionPanel.edit_path));
    expect(pathActions.toEditMode).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.decompose_path));
    expect(decomposePath).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.offset));
    expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('rect', () => {
    document.body.innerHTML = '<rect id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText(tActionPanel.convert_to_path));
    expect(convertSvgToPath).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.offset));
    expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('ellipse', () => {
    document.body.innerHTML = '<ellipse id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText(tActionPanel.convert_to_path));
    expect(convertSvgToPath).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.offset));
    expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('polygon', () => {
    document.body.innerHTML = '<polygon id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText(tActionPanel.convert_to_path));
    expect(convertSvgToPath).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.offset));
    expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('line', () => {
    document.body.innerHTML = '<line id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText(tActionPanel.convert_to_path));
    expect(convertSvgToPath).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.offset));
    expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('use', () => {
    document.body.innerHTML = '<use id="svg_1" />';

    const { container, getByText, rerender } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText(tActionPanel.disassemble_use));
    expect(disassembleUse).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);

    mockGetVariableTextType.mockReturnValue(VariableTextType.NUMBER);
    rerender(<ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />);
    expect(container).toMatchSnapshot();
  });

  describe('g', () => {
    test('multiple selection', () => {
      document.body.innerHTML = `
        <g id="svg_3" data-tempgroup="true">
          <rect id="svg_1 />
          <ellipse id="svg_2" />
        </g>
      `;

      const { container, getByText } = render(
        <ActionsPanel elem={document.getElementById('svg_3') as unknown as SVGElement} />,
      );

      expect(container).toMatchSnapshot();

      fireEvent.click(getByText(tActionPanel.offset));
      expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText(tActionPanel.array));
      expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText(tActionPanel.smart_nest));
      expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
    });

    test('single selection', () => {
      document.body.innerHTML = '<g id="svg_1" />';

      const { container, getByText } = render(
        <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
      );

      expect(container).toMatchSnapshot();

      fireEvent.click(getByText(tActionPanel.array));
      expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText(tActionPanel.smart_nest));
      expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
    });
  });
});

describe('should render correctly in mobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    isMobile.mockReturnValue(true);
    mockGetVariableTextType.mockReturnValue(VariableTextType.NONE);
  });

  test('no elements', () => {
    const { container } = render(<ActionsPanel elem={null} />);

    expect(container).toMatchSnapshot();
  });

  test('image', async () => {
    document.body.innerHTML = '<image id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    const blob = new Blob();

    getFileFromDialog.mockResolvedValueOnce(blob);

    fireEvent.click(getByText(tActionPanel.replace_with_short));
    await tick();
    expect(getFileFromDialog).toHaveBeenCalledTimes(1);
    expect(getFileFromDialog).toHaveBeenNthCalledWith(1, {
      filters: [
        {
          extensions: ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'bmp', 'jp2', 'j2k', 'jpf', 'jpx', 'jpm'],
          name: 'Images',
        },
      ],
    });
    expect(replaceBitmap).toHaveBeenCalledTimes(1);
    expect(replaceBitmap).toHaveBeenNthCalledWith(1, blob, document.getElementById('svg_1'));

    jest.resetAllMocks();
    getFileFromDialog.mockResolvedValueOnce(null);
    fireEvent.click(getByText(tActionPanel.replace_with_short));
    await tick();
    expect(replaceBitmap).not.toHaveBeenCalled();

    fireEvent.click(getAllByText(container, tActionPanel.outline)[0]);
    expect(mockPotrace).toHaveBeenCalledTimes(1);
    expect(mockPotrace).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));

    fireEvent.click(getByText(tActionPanel.brightness));
    expect(mockShowCurvePanel).toHaveBeenCalledTimes(1);

    mockCheckConnection.mockReturnValueOnce(true);
    fireEvent.click(getByText(tActionPanel.sharpen));
    expect(mockShowSharpenPanel).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText(tActionPanel.crop));
    expect(mockShowCropPanel).toHaveBeenCalledTimes(1);

    // Note: Stamp Maker button is not available in mobile view

    fireEvent.click(getByText(tActionPanel.invert));
    expect(colorInvert).toHaveBeenCalledTimes(1);
    expect(colorInvert).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));

    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText(tActionPanel.trace));
    expect(mockTraceImage).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText(tActionPanel.ai_bg_removal_short));
    expect(mockRemoveBackground).toHaveBeenCalledTimes(1);
    expect(mockRemoveBackground).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
  });

  test('text', async () => {
    Object.defineProperty(window, 'FLUX', {
      value: {
        version: 'web',
      },
    });
    document.body.innerHTML = '<text id="svg_1" />';

    const { container, getByText, rerender } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    convertTextToPathFontFunc.mockResolvedValueOnce({ path: null });
    fireEvent.click(getAllByText(container, tActionPanel.outline)[0]);
    await tick();
    expect(convertTextToPath).toHaveBeenCalledTimes(1);
    expect(convertTextToPath).toHaveBeenNthCalledWith(1, {
      element: document.getElementById('svg_1'),
      isToSelect: true,
    });

    fireEvent.click(getByText(tActionPanel.weld_text));
    await tick();
    expect(convertTextToPath).toHaveBeenCalledTimes(2);
    expect(convertTextToPath).toHaveBeenNthCalledWith(2, {
      element: document.getElementById('svg_1'),
      isToSelect: true,
      weldingTexts: true,
    });

    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);

    mockGetVariableTextType.mockReturnValue(VariableTextType.NUMBER);
    rerender(<ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />);
    expect(container).toMatchSnapshot();
  });

  test('path', () => {
    document.body.innerHTML = '<path id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText(tActionPanel.edit_path));
    expect(pathActions.toEditMode).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.decompose_path));
    expect(decomposePath).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.offset));
    expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('rect', () => {
    document.body.innerHTML = '<rect id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getAllByText(container, tActionPanel.outline)[0]);
    fireEvent.click(getByText(tActionPanel.offset));
    expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('ellipse', () => {
    document.body.innerHTML = '<ellipse id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getAllByText(container, tActionPanel.outline)[0]);
    expect(convertSvgToPath).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.offset));
    expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('polygon', () => {
    document.body.innerHTML = '<polygon id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getAllByText(container, tActionPanel.outline)[0]);
    expect(convertSvgToPath).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.offset));
    expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('line', () => {
    document.body.innerHTML = '<line id="svg_1" />';

    const { container, getByText } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getAllByText(container, tActionPanel.outline)[0]);
    expect(convertSvgToPath).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.offset));
    expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
  });

  test('use', () => {
    document.body.innerHTML = '<use id="svg_1" />';

    const { container, getByText, rerender } = render(
      <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText(tActionPanel.disassemble_use));
    expect(disassembleUse).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.array));
    expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText(tActionPanel.smart_nest));
    expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);

    mockGetVariableTextType.mockReturnValue(VariableTextType.NUMBER);
    rerender(<ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />);
    expect(container).toMatchSnapshot();
  });

  describe('g', () => {
    test('multiple selection', () => {
      document.body.innerHTML = `
        <g id="svg_3" data-tempgroup="true">
          <rect id="svg_1 />
          <ellipse id="svg_2" />
        </g>
      `;

      const { container, getByText } = render(
        <ActionsPanel elem={document.getElementById('svg_3') as unknown as SVGElement} />,
      );

      expect(container).toMatchSnapshot();
      fireEvent.click(getByText(tActionPanel.offset));
      expect(mockShowOffsetModal).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText(tActionPanel.array));
      expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText(tActionPanel.smart_nest));
      expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
    });

    test('single selection', () => {
      document.body.innerHTML = '<g id="svg_1" />';

      const { container, getByText } = render(
        <ActionsPanel elem={document.getElementById('svg_1') as unknown as SVGElement} />,
      );

      expect(container).toMatchSnapshot();
      fireEvent.click(getByText(tActionPanel.array));
      expect(mockShowArrayModal).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText(tActionPanel.smart_nest));
      expect(mockSvgNestButtons).toHaveBeenCalledTimes(1);
    });
  });
});
