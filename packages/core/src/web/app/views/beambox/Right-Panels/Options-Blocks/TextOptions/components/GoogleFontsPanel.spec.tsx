// Mock symbolMaker to avoid import.meta.url syntax error in Jest
jest.mock('@core/helpers/symbol-helper/symbolMaker', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import GoogleFontsPanel from './GoogleFontsPanel';

// Mock DraggableModal
jest.mock('@core/app/widgets/DraggableModal', () => {
  return function MockDraggableModal({ children, onCancel, open, ...props }: any) {
    return open ? (
      <div data-testid="draggable-modal" {...props}>
        <button data-testid="modal-close" onClick={onCancel}>
          Close
        </button>
        {children}
      </div>
    ) : null;
  };
});

// Mock FontPreview
jest.mock('./FontPreview', () => {
  return function MockFontPreview({ font, isSelected, onClick }: any) {
    return (
      <div data-selected={isSelected} data-testid={`font-preview-${font.family}`} onClick={onClick} role="button">
        {font.family}
      </div>
    );
  };
});

// Mock VirtualList
jest.mock('rc-virtual-list', () => {
  return function MockVirtualList({ children, data, onScroll }: any) {
    return (
      <div data-testid="virtual-list" onScroll={onScroll}>
        {data.map((item: any) => (
          <div key={item.family}>{children(item)}</div>
        ))}
      </div>
    );
  };
});

// Mock useGoogleFontData hook
const mockUseGoogleFontData = {
  categoryOptions: [
    { label: 'Serif', value: 'serif' },
    { label: 'Sans-serif', value: 'sans-serif' },
    { label: 'Display', value: 'display' },
    { label: 'Handwriting', value: 'handwriting' },
    { label: 'Monospace', value: 'monospace' },
  ],
  fetchGoogleFonts: jest.fn(),
  fonts: [
    {
      category: 'sans-serif',
      family: 'Open Sans',
      subsets: ['latin', 'latin-ext'],
      variants: ['300', '400', '600', '700'],
    },
    {
      category: 'sans-serif',
      family: 'Roboto',
      subsets: ['latin', 'cyrillic'],
      variants: ['300', '400', '500', '700'],
    },
    {
      category: 'serif',
      family: 'Playfair Display',
      subsets: ['latin', 'cyrillic'],
      variants: ['400', '700', '900'],
    },
    {
      category: 'display',
      colorCapabilities: ['COLOR'],
      family: 'Noto Color Emoji',
      subsets: ['emoji'],
      variants: ['400'],
    },
    {
      category: 'display',
      family: 'Material Icons',
      subsets: ['latin'],
      variants: ['400'],
    },
    {
      category: 'sans-serif',
      family: 'Sunflower',
      subsets: ['korean', 'latin'],
      variants: ['300', '500', '700'],
    },
  ],
  isLoading: false,
  languageOptions: [
    { label: 'Latin', value: 'latin' },
    { label: 'Latin Extended', value: 'latin-ext' },
    { label: 'Cyrillic', value: 'cyrillic' },
    { label: 'Korean', value: 'korean' },
    { label: 'Emoji', value: 'emoji' },
  ],
  loadedFonts: new Set(['Open Sans']),
  loadFont: jest.fn(),
  loadFontForTextEditing: jest.fn(),
};

jest.mock('./hooks/useGoogleFontData', () => ({
  useGoogleFontData: () => mockUseGoogleFontData,
}));

// Mock Ant Design components
jest.mock('antd', () => ({
  Button: ({ disabled, onClick, ...props }: any) => (
    <button disabled={disabled} onClick={onClick} {...props}>
      {props.children}
    </button>
  ),
  Select: ({ className, onChange, onClear, onSearch, options, placeholder, value, ...props }: any) => (
    <div className={className} data-testid="select" {...props}>
      <input
        data-testid={
          className === 'searchInput'
            ? 'search-input'
            : className === 'languageSelect'
              ? 'language-input'
              : 'select-input'
        }
        onChange={(e) => onSearch && onSearch(e.target.value)}
        placeholder={placeholder}
        value={value || ''}
      />
      {options && (
        <div data-testid="select-options">
          {options.map((option: any) => (
            <div
              data-testid={`select-option-${option.value}`}
              key={option.value}
              onClick={() => onChange && onChange(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      {onClear && (
        <button data-testid="select-clear" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  ),
  Spin: ({ size }: any) => (
    <div data-size={size} data-testid="spin">
      Loading...
    </div>
  ),
  Typography: {
    Text: ({ children, type }: any) => <span data-type={type}>{children}</span>,
  },
}));

const defaultProps = {
  onClose: jest.fn(),
  onFontSelect: jest.fn(),
  visible: true,
};

describe('GoogleFontsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGoogleFontData.isLoading = false;
    mockUseGoogleFontData.fonts = [
      {
        category: 'sans-serif',
        family: 'Open Sans',
        subsets: ['latin', 'latin-ext'],
        variants: ['300', '400', '600', '700'],
      },
      {
        category: 'sans-serif',
        family: 'Roboto',
        subsets: ['latin', 'cyrillic'],
        variants: ['300', '400', '500', '700'],
      },
      {
        category: 'serif',
        family: 'Playfair Display',
        subsets: ['latin', 'cyrillic'],
        variants: ['400', '700', '900'],
      },
    ];
  });

  describe('Basic Rendering', () => {
    it('should render correctly when visible', () => {
      const { container } = render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.getByTestId('draggable-modal')).toBeInTheDocument();
      expect(screen.getByText('Google Fonts')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });

    it('should not render when not visible', () => {
      render(<GoogleFontsPanel {...defaultProps} visible={false} />);

      expect(screen.queryByTestId('draggable-modal')).not.toBeInTheDocument();
    });

    it('should render header with Google logo and close button', () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.getByText('Google Fonts')).toBeInTheDocument();
      expect(screen.getByTestId('modal-close')).toBeInTheDocument();
    });

    it('should render filters section', () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search fonts...')).toBeInTheDocument();
    });

    it('should render footer with Cancel and Select buttons', () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when fonts are loading', () => {
      mockUseGoogleFontData.isLoading = true;
      render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.getByTestId('spin')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should fetch fonts when visible and no fonts are loaded', async () => {
      mockUseGoogleFontData.fonts = [];
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(mockUseGoogleFontData.fetchGoogleFonts).toHaveBeenCalled();
      });
    });

    it('should not fetch fonts when already loaded', () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      expect(mockUseGoogleFontData.fetchGoogleFonts).not.toHaveBeenCalled();
    });
  });

  describe('Font Filtering', () => {
    it('should filter fonts by search text', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: 'Open' } });

      expect(screen.getByTestId('font-preview-Open Sans')).toBeInTheDocument();
      expect(screen.queryByTestId('font-preview-Roboto')).not.toBeInTheDocument();
    });

    it('should filter fonts by category', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const serifButton = screen.getByText('Serif');

      fireEvent.click(serifButton);

      expect(screen.getByTestId('font-preview-Playfair Display')).toBeInTheDocument();
      expect(screen.queryByTestId('font-preview-Open Sans')).not.toBeInTheDocument();
    });

    it('should toggle category selection', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const serifButton = screen.getByText('Serif');

      // Select category
      fireEvent.click(serifButton);
      expect(screen.queryByTestId('font-preview-Open Sans')).not.toBeInTheDocument();

      // Deselect category
      fireEvent.click(serifButton);
      expect(screen.getByTestId('font-preview-Open Sans')).toBeInTheDocument();
    });

    it('should filter fonts by language', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const languageOption = screen.getByTestId('select-option-cyrillic');

      fireEvent.click(languageOption);

      expect(screen.getByTestId('font-preview-Roboto')).toBeInTheDocument();
      expect(screen.getByTestId('font-preview-Playfair Display')).toBeInTheDocument();
      expect(screen.queryByTestId('font-preview-Open Sans')).not.toBeInTheDocument();
    });

    it('should filter out color fonts', () => {
      mockUseGoogleFontData.fonts = [
        ...mockUseGoogleFontData.fonts,
        {
          category: 'display',
          colorCapabilities: ['COLOR'],
          family: 'Noto Color Emoji',
          subsets: ['emoji'],
          variants: ['400'],
        },
      ];

      render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.queryByTestId('font-preview-Noto Color Emoji')).not.toBeInTheDocument();
    });

    it('should filter out icon fonts', () => {
      mockUseGoogleFontData.fonts = [
        ...mockUseGoogleFontData.fonts,
        {
          category: 'display',
          family: 'Material Icons',
          subsets: ['latin'],
          variants: ['400'],
        },
      ];

      render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.queryByTestId('font-preview-Material Icons')).not.toBeInTheDocument();
    });

    it('should display regular fonts without filter criteria', () => {
      mockUseGoogleFontData.fonts = [
        ...mockUseGoogleFontData.fonts,
        {
          category: 'sans-serif',
          family: 'Sunflower',
          subsets: ['korean', 'latin'],
          variants: ['300', '500', '700'],
        },
      ];

      render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.queryByTestId('font-preview-Sunflower')).toBeInTheDocument();
    });
  });

  describe('Font Selection', () => {
    it('should select font when clicked', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const fontPreview = screen.getByTestId('font-preview-Open Sans');

      fireEvent.click(fontPreview);

      expect(mockUseGoogleFontData.loadFont).toHaveBeenCalledWith(expect.objectContaining({ family: 'Open Sans' }));
      expect(screen.getByText('Selected:')).toBeInTheDocument();
    });

    it('should select font from search dropdown', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const robotoOption = screen.getByTestId('select-option-Roboto');

      fireEvent.click(robotoOption);

      expect(mockUseGoogleFontData.loadFont).toHaveBeenCalledWith(expect.objectContaining({ family: 'Roboto' }));
    });

    it('should enable Select button when font is selected', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const saveButton = screen.getByText('Select');

      expect(saveButton).toBeDisabled();

      const fontPreview = screen.getByTestId('font-preview-Open Sans');

      fireEvent.click(fontPreview);

      expect(saveButton).not.toBeDisabled();
    });

    it('should call onFontSelect and onClose when Select is clicked', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      // Select a font
      const fontPreview = screen.getByTestId('font-preview-Open Sans');

      fireEvent.click(fontPreview);

      // Click Select
      const saveButton = screen.getByText('Select');

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUseGoogleFontData.loadFontForTextEditing).toHaveBeenCalledWith('Open Sans');
        expect(defaultProps.onFontSelect).toHaveBeenCalledWith('Open Sans');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Controls', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');

      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when modal close button is clicked', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const closeButton = screen.getByTestId('modal-close');

      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Infinite Scrolling', () => {
    beforeEach(() => {
      // Create a large list of fonts to test pagination
      const manyFonts = Array.from({ length: 100 }, (_, i) => ({
        category: 'sans-serif',
        family: `Font ${i}`,
        subsets: ['latin'],
        variants: ['400'],
      }));

      mockUseGoogleFontData.fonts = manyFonts;
    });

    it('should load more fonts on scroll', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const virtualList = screen.getByTestId('virtual-list');

      // Mock scroll properties
      Object.defineProperty(virtualList, 'scrollTop', { value: 500, writable: true });
      Object.defineProperty(virtualList, 'clientHeight', { value: 600, writable: true });
      Object.defineProperty(virtualList, 'scrollHeight', { value: 700, writable: true });

      // Simulate scroll event
      fireEvent.scroll(virtualList);

      // Should load fonts for preview
      expect(mockUseGoogleFontData.loadFont).toHaveBeenCalled();
    });

    it('should handle scroll events on virtual list', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const virtualList = screen.getByTestId('virtual-list');

      // Mock scroll properties
      Object.defineProperty(virtualList, 'scrollTop', { value: 500, writable: true });
      Object.defineProperty(virtualList, 'clientHeight', { value: 600, writable: true });
      Object.defineProperty(virtualList, 'scrollHeight', { value: 700, writable: true });

      // Simulate scroll event
      fireEvent.scroll(virtualList);

      // Component should handle scroll without errors
      expect(virtualList).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show no fonts message when no fonts are available', () => {
      mockUseGoogleFontData.fonts = [];
      render(<GoogleFontsPanel {...defaultProps} />);

      expect(
        screen.getByText(
          'Google Fonts are currently unavailable. Please check your internet connection or contact your administrator.',
        ),
      ).toBeInTheDocument();
    });

    it('should show no search results message when search returns empty', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: 'NonexistentFont' } });

      expect(screen.getByText('No fonts found matching your search criteria.')).toBeInTheDocument();
    });

    it('should show no selection message when no font is selected', () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.getByText('No font selected')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should clear search when clear button is clicked', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      const searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: 'Open' } });

      const clearButton = screen.getByTestId('select-clear');

      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
    });

    it('should show search options based on available fonts', () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.getByTestId('select-option-Open Sans')).toBeInTheDocument();
      expect(screen.getByTestId('select-option-Roboto')).toBeInTheDocument();
      expect(screen.getByTestId('select-option-Playfair Display')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockUseGoogleFontData.loadFontForTextEditing.mockRejectedValue(new Error('Network error'));

      render(<GoogleFontsPanel {...defaultProps} />);

      // Select a font
      const fontPreview = screen.getByTestId('font-preview-Open Sans');

      fireEvent.click(fontPreview);

      // Click Select
      const saveButton = screen.getByText('Select');

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error selecting font:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
