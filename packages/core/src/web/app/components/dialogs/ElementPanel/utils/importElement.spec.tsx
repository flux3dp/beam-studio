import React from 'react';

import NS from '@core/app/constants/namespaces';

const mockImportSVG = jest.fn();
const mockProjectRemove = jest.fn();

class MockPath {}
class MockCompoundPath {}
class MockGroup {
  children: unknown[] = [];
}
class MockLayer {
  children: unknown[] = [];
}

jest.mock('paper', () => {
  const mockProject = { importSVG: (...args: unknown[]) => mockImportSVG(...args), remove: () => mockProjectRemove() };

  return {
    CompoundPath: MockCompoundPath,
    Group: MockGroup,
    Layer: MockLayer,
    Path: MockPath,
    Point: class {
      constructor(
        public x: number,
        public y: number,
      ) {}
    },
    Project: jest.fn().mockImplementation(() => mockProject),
  };
});

jest.mock('@core/app/constants/element-panel-constants', () => ({
  builtInElements: {
    'icon-circle': {
      attr: { cx: 250, cy: 250, rx: 250, ry: 250 },
      element: 'ellipse',
    },
  },
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: mockOpenNonstopProgress,
  popById: mockPopById,
}));

const mockInsertElementCommand = jest.fn();

jest.mock('@core/app/svgedit/history/history', () => ({
  InsertElementCommand: class {
    constructor(...args: unknown[]) {
      mockInsertElementCommand(...args);
    }
  },
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: mockAddCommandToHistory,
}));

const mockFixEnd = jest.fn();

jest.mock('@core/app/svgedit/operations/pathActions', () => ({
  fixEnd: mockFixEnd,
}));

const mockSelectOnly = jest.fn();

jest.mock('@core/app/svgedit/selection', () => ({
  selectOnly: mockSelectOnly,
}));

const mockUpdateElementColor = jest.fn();

jest.mock('@core/helpers/color/updateElementColor', () => mockUpdateElementColor);

const mockGetNPIconByID = jest.fn().mockResolvedValue('data:image/svg+xml;base64,1234');

jest.mock('@core/helpers/api/flux-id', () => ({
  getNPIconByID: mockGetNPIconByID,
}));

const mockPathEl = document.createElementNS(NS.SVG, 'path');
const mockAddSvgElementFromJson = jest.fn().mockReturnValue(mockPathEl);
const mockConvertPath = jest.fn().mockReturnValue('M0,0');
const mockGetNextId = jest.fn().mockReturnValue('svg_1');

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback: any) =>
    callback({
      Canvas: {
        addSvgElementFromJson: mockAddSvgElementFromJson,
        getNextId: mockGetNextId,
        pathActions: { convertPath: mockConvertPath },
      },
    }),
}));

const MockIconComponent = () => (
  <svg>
    <path d="M0,0 L10,10" />
  </svg>
);
const mockImportIcon = jest.fn().mockResolvedValue(MockIconComponent);

jest.mock('../Element/importIcon', () => mockImportIcon);

const mockFetch = jest.fn().mockResolvedValue({ text: () => Promise.resolve('<svg><path d="M0,0"/></svg>') });

global.fetch = mockFetch as any;

import { importElementToCanvas } from './importElement';

describe('importElementToCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JSON element import (builtInElements)', () => {
    it('should import a predefined JSON element directly', async () => {
      await importElementToCanvas('basic/icon-circle');

      expect(mockAddSvgElementFromJson).toHaveBeenCalledTimes(1);
      expect(mockAddSvgElementFromJson).toHaveBeenCalledWith({
        attr: { cx: 250, cy: 250, id: 'svg_1', rx: 250, ry: 250 },
        element: 'ellipse',
      });
      expect(mockUpdateElementColor).toHaveBeenCalledTimes(1);
      expect(mockSelectOnly).toHaveBeenCalledTimes(1);
      expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('builtin SVG icon import', () => {
    const createMockPathItem = () => {
      const item = Object.create(MockPath.prototype);

      Object.assign(item, {
        bounds: { height: 100, left: 0, top: 0, width: 200, x: 0, y: 0 },
        pathData: 'M0,0 L10,10',
        remove: jest.fn(),
        scale: jest.fn(),
        unite: jest.fn(),
      });

      return item;
    };

    it('should load icon, render to SVG string, and import united path', async () => {
      const mockPathItem = createMockPathItem();
      const mockGroup = Object.create(MockGroup.prototype);

      mockGroup.children = [mockPathItem];
      mockImportSVG.mockReturnValue(mockGroup);

      await importElementToCanvas('basic/mock-svg-icon');

      expect(mockImportIcon).toHaveBeenCalledWith('basic/mock-svg-icon');
      expect(mockImportSVG).toHaveBeenCalled();
      expect(mockPathItem.scale).toHaveBeenCalled();
      expect(mockAddSvgElementFromJson).toHaveBeenCalledTimes(1);
      expect(mockAddSvgElementFromJson).toHaveBeenCalledWith(expect.objectContaining({ element: 'path' }));
      expect(mockConvertPath).toHaveBeenCalledTimes(1);
      expect(mockFixEnd).toHaveBeenCalledTimes(1);
      expect(mockUpdateElementColor).toHaveBeenCalledTimes(1);
      expect(mockSelectOnly).toHaveBeenCalledTimes(1);
      expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
      expect(mockProjectRemove).toHaveBeenCalled();
    });

    it('should unite multiple paths into one', async () => {
      const path1 = createMockPathItem();
      const path2 = createMockPathItem();
      const unitedPath = createMockPathItem();

      path1.unite.mockReturnValue(unitedPath);

      const mockGroup = Object.create(MockGroup.prototype);

      mockGroup.children = [path1, path2];
      mockImportSVG.mockReturnValue(mockGroup);

      await importElementToCanvas('basic/multi-path-icon');

      expect(path1.unite).toHaveBeenCalledWith(path2);
      expect(path1.remove).toHaveBeenCalled();
      expect(path2.remove).toHaveBeenCalled();
      expect(mockAddSvgElementFromJson).toHaveBeenCalledTimes(1);
    });

    it('should skip import when no paths found', async () => {
      const mockGroup = Object.create(MockGroup.prototype);

      mockGroup.children = [];
      mockImportSVG.mockReturnValue(mockGroup);

      await importElementToCanvas('basic/empty-icon');

      expect(mockAddSvgElementFromJson).not.toHaveBeenCalled();
      expect(mockAddCommandToHistory).not.toHaveBeenCalled();
      expect(mockProjectRemove).toHaveBeenCalled();
    });
  });

  describe('NP icon import', () => {
    const createMockPathItem = () => {
      const item = Object.create(MockPath.prototype);

      Object.assign(item, {
        bounds: { height: 100, left: 0, top: 0, width: 200, x: 0, y: 0 },
        pathData: 'M0,0 L10,10',
        remove: jest.fn(),
        scale: jest.fn(),
        unite: jest.fn(),
      });

      return item;
    };

    it('should fetch NP icon and import via importSvgPaths', async () => {
      const mockPathItem = createMockPathItem();
      const mockGroup = Object.create(MockGroup.prototype);

      mockGroup.children = [mockPathItem];
      mockImportSVG.mockReturnValue(mockGroup);

      await importElementToCanvas('np/5678');

      expect(mockOpenNonstopProgress).toHaveBeenCalledWith({ id: 'import-noun-project-svg' });
      expect(mockGetNPIconByID).toHaveBeenCalledWith('5678');
      expect(mockFetch).toHaveBeenCalledWith('data:image/svg+xml;base64,1234');
      expect(mockImportSVG).toHaveBeenCalled();
      expect(mockAddSvgElementFromJson).toHaveBeenCalledTimes(1);
      expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
      expect(mockPopById).toHaveBeenCalledWith('import-noun-project-svg');
    });

    it('should handle null base64 response', async () => {
      mockGetNPIconByID.mockResolvedValueOnce(null);

      await importElementToCanvas('np/9999');

      expect(mockGetNPIconByID).toHaveBeenCalledWith('9999');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockImportSVG).not.toHaveBeenCalled();
      expect(mockPopById).toHaveBeenCalledWith('import-noun-project-svg');
    });

    it('should close progress even on error', async () => {
      mockGetNPIconByID.mockRejectedValueOnce(new Error('Network error'));

      await expect(importElementToCanvas('np/error')).rejects.toThrow('Network error');
      expect(mockPopById).toHaveBeenCalledWith('import-noun-project-svg');
    });
  });
});
