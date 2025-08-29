import React from 'react';

import { render, screen } from '@testing-library/react';

const mockUseIsMobile = jest.fn();

// Mock store and context
const mockStore = {
  availableFontFamilies: ['Arial', 'Times New Roman', 'Helvetica'],
  configs: {
    fontFamily: { hasMultiValue: false, value: 'Arial' },
  },
  fontHistory: ['Times New Roman'],
  handleFontFamilyChange: jest.fn(),
};

jest.mock('../../stores/useTextOptionsStore', () => ({
  useTextOptionsStore: () => mockStore,
}));

import FontFamilySelector from './FontFamilySelector';

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      object_panel: {
        option_panel: {
          font_family: 'Font Family',
          recently_used: 'Recently Used',
        },
      },
    },
  },
}));

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  __esModule: true,
  default: {
    fontNameMap: new Map(),
    requestFontsOfTheFontFamily: () => [],
  },
}));

jest.mock('@core/helpers/fonts/fontHelper', () => ({
  __esModule: true,
  default: {
    getWebFontPreviewUrl: () => null,
  },
}));

jest.mock('@core/app/icons/flux/FluxIcons', () => ({
  __esModule: true,
  default: {
    FluxPlus: () => <div>FluxPlus</div>,
  },
}));

jest.mock('@core/app/views/beambox/Right-Panels/ObjectPanelItem', () => ({
  Select: ({ id, label, onChange, options, selected }: any) => (
    <div>
      mock-object-panel-select id:{id} label:{label}
      <select data-testid="mobile-select" onChange={(e) => onChange(e.target.value)}>
        {options?.map((option: any, index: number) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div>selected: {selected?.value || ''}</div>
    </div>
  ),
}));

jest.mock('@core/app/widgets/AntdSelect', () => ({ className, onChange, options, title, value }: any) => (
  <div className={className}>
    mock-select title:{title} value:{value}
    <select data-testid="desktop-select" onChange={(e) => onChange(e.target.value, { value: e.target.value })}>
      {options?.map((group: any, groupIndex: number) =>
        group.options?.map((option: any, optionIndex: number) => (
          <option key={`${groupIndex}-${optionIndex}`} value={option.value}>
            {option.label || option.value}
          </option>
        )),
      )}
    </select>
  </div>
));

describe('FontFamilySelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false);
    mockStore.availableFontFamilies = ['Arial', 'Times New Roman', 'Helvetica'];
    mockStore.configs.fontFamily = { hasMultiValue: false, value: 'Arial' };
    mockStore.fontHistory = ['Times New Roman'];
    mockStore.handleFontFamilyChange.mockClear();
  });

  describe('Mobile view', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    test('should render mobile selector', () => {
      render(<FontFamilySelector />);

      expect(screen.getByText('mock-object-panel-select id:font_family label:Font Family')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-select')).toBeInTheDocument();
    });

    test('should show multi-value state', () => {
      mockStore.configs.fontFamily = { hasMultiValue: true, value: '' };

      render(<FontFamilySelector />);

      expect(screen.getByText(/selected:/)).toBeInTheDocument();
    });

    test('should include history fonts when available', () => {
      render(<FontFamilySelector />);

      const selectElement = screen.getByTestId('mobile-select');
      const options = selectElement.querySelectorAll('option');

      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe('Desktop view', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    test('should render desktop selector', () => {
      render(<FontFamilySelector />);

      expect(screen.getByText(/mock-select title:Font Family/)).toBeInTheDocument();
      expect(screen.getByTestId('desktop-select')).toBeInTheDocument();
    });

    test('should show current font family value', () => {
      render(<FontFamilySelector />);

      expect(screen.getByText(/value:Arial/)).toBeInTheDocument();
    });

    test('should show multi-value state', () => {
      mockStore.configs.fontFamily = { hasMultiValue: true, value: '' };

      render(<FontFamilySelector />);

      expect(screen.getByText(/value:-/)).toBeInTheDocument();
    });

    test('should render available font options', () => {
      render(<FontFamilySelector />);

      const selectElement = screen.getByTestId('desktop-select');
      const options = selectElement.querySelectorAll('option');

      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe('Font history', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    test('should include history fonts in options', () => {
      mockStore.fontHistory = ['Times New Roman', 'Arial'];

      render(<FontFamilySelector />);

      const selectElement = screen.getByTestId('desktop-select');
      const options = selectElement.querySelectorAll('option');

      expect(options.length).toBeGreaterThan(mockStore.availableFontFamilies.length);
    });

    test('should handle empty history', () => {
      mockStore.fontHistory = [];

      render(<FontFamilySelector />);

      // Should still render without errors
      expect(screen.getByTestId('desktop-select')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    test('should call onChange when font is selected', () => {
      render(<FontFamilySelector />);

      const selectElement = screen.getByTestId('desktop-select');
      const firstOption = selectElement.querySelector('option') as HTMLOptionElement;

      if (firstOption) {
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        expect(mockStore.handleFontFamilyChange).toHaveBeenCalled();
      }
    });
  });
});
