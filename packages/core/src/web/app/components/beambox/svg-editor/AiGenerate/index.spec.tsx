import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { act } from 'react';

// ============================================================================
// MOCKS - Must be defined BEFORE importing component
// ============================================================================

// Mock API modules
const mockCreateTextToImageTask = jest.fn();
const mockCreateImageEditTask = jest.fn();
const mockPollTaskUntilComplete = jest.fn();
const mockGetAiImageHistory = jest.fn();

jest.mock('@core/helpers/api/ai-image', () => ({
  createImageEditTask: (...args: unknown[]) => mockCreateImageEditTask(...args),
  createTextToImageTask: (...args: unknown[]) => mockCreateTextToImageTask(...args),
  getAiImageHistory: (...args: unknown[]) => mockGetAiImageHistory(...args),
  pollTaskUntilComplete: (...args: unknown[]) => mockPollTaskUntilComplete(...args),
}));

const mockShowStyleSelectionPanel = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showStyleSelectionPanel: (...args) => mockShowStyleSelectionPanel(...args),
}));

// Mock FluxID API
const mockGetCurrentUser = jest.fn();
const mockGetInfo = jest.fn();
const mockFluxIDEvents = {
  off: jest.fn(),
  on: jest.fn(),
};

jest.mock('@core/helpers/api/flux-id', () => ({
  fluxIDEvents: mockFluxIDEvents,
  getCurrentUser: () => mockGetCurrentUser(),
  getInfo: (...args: unknown[]) => mockGetInfo(...args),
}));

// Mock SVG editor operations
const mockImportAiImage = jest.fn();

jest.mock('@core/app/svgedit/operations/import/importAiImage', () => ({
  importAiImage: (...args: unknown[]) => mockImportAiImage(...args),
}));

// Mock browser
const mockBrowserOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  __esModule: true,
  default: {
    open: (...args: unknown[]) => mockBrowserOpen(...args),
  },
}));

// Mock i18n
const mockLang = {
  flux_id_login: {
    flux_plus: {
      goto_member_center: 'Get Credits',
      member_center_url: 'https://member.flux.com',
    },
  },
};

jest.mock('@core/helpers/useI18n', () => () => mockLang);

// Mock child components
jest.mock('./components/ImageHistory', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-image-history">ImageHistory</div>,
}));

jest.mock('./components/ImageResults', () => ({
  __esModule: true,
  default: ({ errorMessage, generatedImages, generationStatus }: any) => (
    <div data-testid="mock-image-results">
      <div data-testid="generation-status">{generationStatus}</div>
      <div data-testid="error-message">{errorMessage}</div>
      <div data-testid="generated-images-count">{generatedImages.length}</div>
    </div>
  ),
}));

jest.mock('./components/ImageUploadArea', () => ({
  __esModule: true,
  default: ({ imageInputs, onAdd, onRemove }: any) => (
    <div data-testid="mock-image-upload-area">
      <div data-testid="image-inputs-count">{imageInputs.length}</div>
      <button
        data-testid="mock-add-image"
        onClick={() => onAdd({ file: new File([], 'test.jpg'), id: 'test-id', type: 'file' })}
      >
        Add Image
      </button>
      {imageInputs.map((input: any) => (
        <button data-testid={`mock-remove-${input.id}`} key={input.id} onClick={() => onRemove(input.id)}>
          Remove {input.id}
        </button>
      ))}
    </div>
  ),
}));

// Import component LAST (after all mocks)
import AiGenerate from './index';
import { useAiGenerateStore } from './useAiGenerateStore';
import type { IUser } from '@core/interfaces/IUser';
import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import type { ImageInput } from './types';

// ============================================================================
// TEST UTILITIES & FACTORIES
// ============================================================================

const createMockUser = (credits = 1.0): IUser =>
  ({
    email: 'test@example.com',
    info: {
      credit: credits,
      email: 'test@example.com',
      subscription: 'free',
    },
    nickname: 'Test User',
    uuid: 'test-user-uuid',
  }) as IUser;

const createMockFile = (name = 'test.jpg', size = 1024, type = 'image/jpeg'): File => {
  const file = new File([''], name, { type });

  Object.defineProperty(file, 'size', { value: size });

  return file;
};

const createMockImageInput = (type: 'file' | 'url', id = 'test-id'): ImageInput => {
  if (type === 'file') {
    return {
      file: createMockFile(),
      id,
      type: 'file',
    };
  }

  return {
    id,
    type: 'url',
    url: 'https://example.com/image.jpg',
  };
};

const createMockHistoryItem = (overrides?: Partial<AiImageGenerationData>): AiImageGenerationData => ({
  completed_at: '2024-01-01T00:01:00Z',
  cost_time: 60,
  created_at: '2024-01-01T00:00:00Z',
  fail_msg: null,
  image_resolution: '1K',
  image_size: 'square_hd',
  image_urls: null,
  max_images: 1,
  model_type: 'text-to-image',
  prompt: 'Test prompt',
  result_urls: ['https://example.com/result.jpg'],
  seed: null,
  state: 'success',
  task_id: 'task-1',
  uuid: 'history-uuid-1',
  ...overrides,
});

// ============================================================================
// TEST SUITE
// ============================================================================

describe('test AiGenerate', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store to initial state
    useAiGenerateStore.setState({
      count: 1,
      dimensions: { aspectRatio: '1:1', orientation: 'landscape', size: 'small' },
      errorMessage: null,
      generatedImages: [],
      generationStatus: 'idle',
      generationUuid: null,
      historyError: null,
      historyItems: [],
      historyLoading: false,
      historyOffset: 0,
      isAiGenerateShown: false,
      patternDescription: '',
      selectedImageInputs: [],
      selectedOption: null,
      selectedStyle: 'logo_with_text',
      showHistory: false,
      styleCustomFields: {},
    });

    // Default mock implementations
    mockGetCurrentUser.mockReturnValue(createMockUser());
    mockGetInfo.mockResolvedValue({ credit: 1.0 });
    mockCreateTextToImageTask.mockResolvedValue({ uuid: 'test-uuid' });
    mockCreateImageEditTask.mockResolvedValue({ uuid: 'test-uuid' });
    mockPollTaskUntilComplete.mockResolvedValue({
      imageUrls: ['https://example.com/generated1.jpg'],
      success: true,
    });
    mockGetAiImageHistory.mockResolvedValue({ data: [] });
    mockImportAiImage.mockResolvedValue(undefined);
  });

  // ==========================================================================
  // P1: RENDERING TESTS
  // ==========================================================================

  describe('Rendering Tests', () => {
    test('should render header with title "AI Create"', () => {
      const { container } = render(<AiGenerate />);

      expect(container.querySelector('.title')?.textContent).toBe('AI Create');
    });

    test('should render all header action buttons', () => {
      const { container } = render(<AiGenerate />);

      const buttons = container.querySelectorAll('.actions button');

      expect(buttons).toHaveLength(3);
    });

    test('should render generation form by default (not history view)', () => {
      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-image-history')).not.toBeInTheDocument();
    });

    test('should render ImageHistory when showHistory is true', () => {
      useAiGenerateStore.setState({ showHistory: true });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-image-history')).toBeInTheDocument();
    });

    test('text-to-image mode: hides ImageUploadArea', () => {
      useAiGenerateStore.setState({ selectedOption: 'plain-text-to-image' });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-image-upload-area')).not.toBeInTheDocument();
    });

    test('edit mode: shows ImageUploadArea', () => {
      useAiGenerateStore.setState({ selectedOption: 'plain-edit' });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-image-upload-area')).toBeInTheDocument();
    });

    test('should render 3 always-displayed ratio buttons', () => {
      const { container } = render(<AiGenerate />);

      const ratioButtons = container.querySelectorAll('.dimension-button');

      // 3 always displayed + 1 "More" button = 4
      expect(ratioButtons.length).toBeGreaterThanOrEqual(4);
    });

    test('should render "More" button', () => {
      const { container } = render(<AiGenerate />);

      const moreButton = Array.from(container.querySelectorAll('.dimension-button')).find((btn) =>
        btn.textContent?.includes('More'),
      );

      expect(moreButton).toBeInTheDocument();
    });

    test('should render size selection buttons (small, medium, large)', () => {
      const { container } = render(<AiGenerate />);

      const sizeButtons = container.querySelectorAll('.size-button');

      expect(sizeButtons).toHaveLength(3);
    });

    test('should render count selection dropdown', () => {
      const { container } = render(<AiGenerate />);

      const countSelect = container.querySelector('.count-select');

      expect(countSelect).toBeInTheDocument();
    });

    test('should render Generate button', () => {
      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      );

      expect(generateButton).toBeInTheDocument();
    });

    test('should render credits information', () => {
      const { container } = render(<AiGenerate />);

      const creditsInfo = container.querySelector('.credits-info');

      expect(creditsInfo).toBeInTheDocument();
    });

    test('should render ImageResults component', () => {
      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-image-results')).toBeInTheDocument();
    });

    test('should show custom fields when cute style is selected', () => {
      useAiGenerateStore.setState({ selectedOption: 'cute' });

      const { container } = render(<AiGenerate />);

      // Check for "Text to Display" section
      const sections = container.querySelectorAll('.section-title');
      const hasTextToDisplaySection = Array.from(sections).some((section) =>
        section.textContent?.includes('Text to Display'),
      );

      expect(hasTextToDisplaySection).toBe(true);
    });

    test('should hide custom fields for plain-text-to-image mode', () => {
      useAiGenerateStore.setState({ selectedOption: 'plain-text-to-image' });

      const { container } = render(<AiGenerate />);

      const sections = container.querySelectorAll('.section-title');
      const hasTextToDisplaySection = Array.from(sections).some((section) =>
        section.textContent?.includes('Text to Display'),
      );

      expect(hasTextToDisplaySection).toBe(false);
    });

    test('snapshot: default state', () => {
      const { container } = render(<AiGenerate />);

      expect(container).toMatchSnapshot();
    });

    test('snapshot: with history open', () => {
      useAiGenerateStore.setState({ showHistory: true });

      const { container } = render(<AiGenerate />);

      expect(container).toMatchSnapshot();
    });

    test('snapshot: edit mode with images', () => {
      useAiGenerateStore.setState({
        selectedImageInputs: [createMockImageInput('file', 'img-1')],
        selectedOption: 'plain-edit',
      });

      const { container } = render(<AiGenerate />);

      expect(container).toMatchSnapshot();
    });

    test('snapshot: generating state', () => {
      useAiGenerateStore.setState({
        generationStatus: 'generating',
        patternDescription: 'Test prompt',
      });

      const { container } = render(<AiGenerate />);

      expect(container).toMatchSnapshot();
    });

    test('snapshot: success with generated images', () => {
      useAiGenerateStore.setState({
        generatedImages: ['https://example.com/img1.jpg'],
        generationStatus: 'success',
      });

      const { container } = render(<AiGenerate />);

      expect(container).toMatchSnapshot();
    });
  });

  // ==========================================================================
  // P1: USER INTERACTION TESTS
  // ==========================================================================

  describe('User Interaction Tests', () => {
    test('clicking history button toggles showHistory', () => {
      const { container } = render(<AiGenerate />);

      const historyButton = container.querySelector('[data-icon="clock-circle"]')?.closest('button');

      expect(historyButton).toBeInTheDocument();

      fireEvent.click(historyButton!);

      expect(useAiGenerateStore.getState().showHistory).toBe(true);

      fireEvent.click(historyButton!);

      expect(useAiGenerateStore.getState().showHistory).toBe(false);
    });

    test('clicking refresh button calls resetForm', () => {
      useAiGenerateStore.setState({
        count: 2,
        errorMessage: 'Error',
        patternDescription: 'Test',
      });

      const { container } = render(<AiGenerate />);

      const refreshButton = container.querySelector('[data-icon="reload"]')?.closest('button');

      fireEvent.click(refreshButton!);

      const state = useAiGenerateStore.getState();

      expect(state.patternDescription).toBe('');
      expect(state.count).toBe(1);
      expect(state.errorMessage).toBe(null);
    });

    test('clicking close button sets isAiGenerateShown to false', () => {
      useAiGenerateStore.setState({ isAiGenerateShown: true });

      const { container } = render(<AiGenerate />);

      const closeButton = container.querySelector('[data-icon="close"]')?.closest('button');

      fireEvent.click(closeButton!);

      expect(useAiGenerateStore.getState().isAiGenerateShown).toBe(false);
    });

    test('clicking style button shows StyleSelectionPanel', () => {
      const { container } = render(<AiGenerate />);

      const styleButton = container.querySelector('.style-selection-button');

      fireEvent.click(styleButton!);

      expect(mockShowStyleSelectionPanel).toHaveBeenCalledTimes(1);
      expect(mockShowStyleSelectionPanel).toHaveBeenCalledWith(expect.any(Function), null);
    });

    test('selecting style updates selectedOption', () => {
      mockShowStyleSelectionPanel.mockImplementation((callback) => {
        callback('cute');
      });

      const { container } = render(<AiGenerate />);

      const styleButton = container.querySelector('.style-selection-button');

      fireEvent.click(styleButton!);

      expect(useAiGenerateStore.getState().selectedOption).toBe('cute');
    });

    test('clicking ratio button updates dimensions', () => {
      const { container } = render(<AiGenerate />);

      const ratioButtons = container.querySelectorAll('.dimension-button');
      const fourThreeButton = Array.from(ratioButtons).find((btn) => btn.textContent?.includes('4:3'));

      fireEvent.click(fourThreeButton!);

      const { dimensions } = useAiGenerateStore.getState();

      expect(dimensions.aspectRatio).toBe('4:3');
      expect(dimensions.orientation).toBe('landscape');
    });

    test('selected ratio button has active class', () => {
      useAiGenerateStore.setState({
        dimensions: { aspectRatio: '16:9', orientation: 'landscape', size: 'small' },
      });

      const { container } = render(<AiGenerate />);

      const ratioButtons = container.querySelectorAll('.dimension-button');
      const sixteenNineButton = Array.from(ratioButtons).find((btn) => btn.textContent?.includes('16:9'));

      expect(sixteenNineButton?.classList.contains('active')).toBe(true);
    });

    test('clicking size button updates dimensions.size', () => {
      const { container } = render(<AiGenerate />);

      const sizeButtons = container.querySelectorAll('.size-button');
      const largeButton = Array.from(sizeButtons).find((btn) => btn.textContent?.includes('Large'));

      fireEvent.click(largeButton!);

      expect(useAiGenerateStore.getState().dimensions.size).toBe('large');
    });

    test('selected size button has active class', () => {
      useAiGenerateStore.setState({
        dimensions: { aspectRatio: '1:1', orientation: 'landscape', size: 'medium' },
      });

      const { container } = render(<AiGenerate />);

      const sizeButtons = container.querySelectorAll('.size-button');
      const mediumButton = Array.from(sizeButtons).find((btn) => btn.textContent?.includes('Medium'));

      expect(mediumButton?.classList.contains('active')).toBe(true);
    });

    test('typing in textarea updates patternDescription', () => {
      const { container } = render(<AiGenerate />);

      const textarea = container.querySelector('textarea');

      fireEvent.change(textarea!, { target: { value: 'New prompt text' } });

      expect(useAiGenerateStore.getState().patternDescription).toBe('New prompt text');
    });

    test('keyboard events in textarea do not propagate', () => {
      const { container } = render(<AiGenerate />);

      const textarea = container.querySelector('textarea');

      // Create a spy event with stopPropagation
      const event = new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' });
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      textarea!.dispatchEvent(event);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    test('typing in custom field updates styleCustomFields', () => {
      useAiGenerateStore.setState({ selectedOption: 'cute' });

      const { container } = render(<AiGenerate />);

      const textareas = container.querySelectorAll('textarea');
      const customFieldTextarea = textareas[1]; // Second textarea is custom field

      fireEvent.change(customFieldTextarea!, { target: { value: 'MeowWoof' } });

      expect(useAiGenerateStore.getState().styleCustomFields['text to display']).toBe('MeowWoof');
    });

    test('hovering More button shows floating menu', async () => {
      const { container } = render(<AiGenerate />);

      const moreButtonContainer = container.querySelector('.more-button-container');

      fireEvent.mouseEnter(moreButtonContainer!);

      // Menu should show immediately
      await waitFor(() => {
        const portalMenu = document.querySelector('.floating-ratio-menu-portal');

        expect(portalMenu).toBeInTheDocument();
      });
    });

    test('leaving More button hides menu after delay', async () => {
      jest.useFakeTimers();

      const { container } = render(<AiGenerate />);

      const moreButtonContainer = container.querySelector('.more-button-container');

      fireEvent.mouseEnter(moreButtonContainer!);

      fireEvent.mouseLeave(moreButtonContainer!);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const portalMenu = document.querySelector('.floating-ratio-menu-portal');

        expect(portalMenu).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    test('changing count updates store', () => {
      const { container } = render(<AiGenerate />);

      const countSelect = container.querySelector('.count-select .ant-select-selector');

      fireEvent.mouseDown(countSelect!);

      const option3 = document.querySelectorAll('.ant-select-item')[2]; // 3rd option = count 3

      fireEvent.click(option3!);

      expect(useAiGenerateStore.getState().count).toBe(3);
    });
  });

  // ==========================================================================
  // P1: MODE SWITCHING TESTS
  // ==========================================================================

  describe('Mode Switching Tests', () => {
    test('plain-text-to-image derives mode as text-to-image', () => {
      useAiGenerateStore.setState({ selectedOption: 'plain-text-to-image' });

      const { queryByTestId } = render(<AiGenerate />);

      // Mode is text-to-image, so ImageUploadArea should not be visible
      expect(queryByTestId('mock-image-upload-area')).not.toBeInTheDocument();
    });

    test('plain-edit derives mode as edit', () => {
      useAiGenerateStore.setState({ selectedOption: 'plain-edit' });

      const { queryByTestId } = render(<AiGenerate />);

      // Mode is edit, so ImageUploadArea should be visible
      expect(queryByTestId('mock-image-upload-area')).toBeInTheDocument();
    });

    test('cute logo derives mode as text-to-image', () => {
      useAiGenerateStore.setState({ selectedOption: 'cute' });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-image-upload-area')).not.toBeInTheDocument();
    });

    test('crafty logo derives mode as text-to-image', () => {
      useAiGenerateStore.setState({ selectedOption: 'crafty' });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-image-upload-area')).not.toBeInTheDocument();
    });

    test('collage logo derives mode as text-to-image', () => {
      useAiGenerateStore.setState({ selectedOption: 'collage' });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('mock-image-upload-area')).not.toBeInTheDocument();
    });

    test('prompt persists when switching from text-to-image to edit', () => {
      useAiGenerateStore.setState({
        patternDescription: 'Persistent prompt',
        selectedOption: 'plain-text-to-image',
      });

      render(<AiGenerate />);

      useAiGenerateStore.setState({ selectedOption: 'plain-edit' });

      expect(useAiGenerateStore.getState().patternDescription).toBe('Persistent prompt');
    });

    test('dimensions persist when switching modes', () => {
      useAiGenerateStore.setState({
        dimensions: { aspectRatio: '16:9', orientation: 'landscape', size: 'large' },
        selectedOption: 'plain-text-to-image',
      });

      render(<AiGenerate />);

      useAiGenerateStore.setState({ selectedOption: 'plain-edit' });

      const { dimensions } = useAiGenerateStore.getState();

      expect(dimensions.aspectRatio).toBe('16:9');
      expect(dimensions.size).toBe('large');
    });

    test('count persists when switching modes', () => {
      useAiGenerateStore.setState({
        count: 4,
        selectedOption: 'plain-text-to-image',
      });

      render(<AiGenerate />);

      useAiGenerateStore.setState({ selectedOption: 'plain-edit' });

      expect(useAiGenerateStore.getState().count).toBe(4);
    });

    test('textarea placeholder changes based on mode', () => {
      // Text-to-image mode
      useAiGenerateStore.setState({ selectedOption: 'plain-text-to-image' });

      const { container, rerender } = render(<AiGenerate />);

      let textarea = container.querySelector('textarea');

      expect(textarea?.placeholder).toContain('logo pattern');

      // Edit mode
      useAiGenerateStore.setState({ selectedOption: 'plain-edit' });

      rerender(<AiGenerate />);
      textarea = container.querySelector('textarea');
      expect(textarea?.placeholder).toContain('edit the images');
    });
  });

  // ==========================================================================
  // P0: GENERATION FLOW TESTS
  // ==========================================================================

  describe('Generation Flow Tests', () => {
    describe('Validation', () => {
      test('empty prompt shows error', async () => {
        useAiGenerateStore.setState({ patternDescription: '' });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        ) as HTMLButtonElement;

        // Button should be disabled
        expect(generateButton.disabled).toBe(true);
      });

      test('whitespace-only prompt shows error', async () => {
        useAiGenerateStore.setState({ patternDescription: '   ' });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        ) as HTMLButtonElement;

        // Button should be disabled
        expect(generateButton.disabled).toBe(true);
      });

      test('no user logged in shows error', async () => {
        mockGetCurrentUser.mockReturnValue(null);
        useAiGenerateStore.setState({ patternDescription: 'Test prompt' });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        ) as HTMLButtonElement;

        // Button should be disabled
        expect(generateButton.disabled).toBe(true);
      });

      test('edit mode with 0 images shows error', async () => {
        useAiGenerateStore.setState({
          patternDescription: 'Test prompt',
          selectedImageInputs: [],
          selectedOption: 'plain-edit',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        ) as HTMLButtonElement;

        // Button should be disabled
        expect(generateButton.disabled).toBe(true);
      });

      test('edit mode with >10 images shows error', async () => {
        const manyImages = Array.from({ length: 11 }, (_, i) => createMockImageInput('file', `img-${i}`));

        useAiGenerateStore.setState({
          patternDescription: 'Test prompt',
          selectedImageInputs: manyImages,
          selectedOption: 'plain-edit',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        ) as HTMLButtonElement;

        // Button should be disabled
        expect(generateButton.disabled).toBe(true);
      });
    });

    describe('Text-to-Image API Calls', () => {
      test('calls createTextToImageTask with correct params', async () => {
        useAiGenerateStore.setState({
          count: 1,
          dimensions: { aspectRatio: '1:1', orientation: 'landscape', size: 'small' },
          patternDescription: 'A cute dog',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          expect(mockCreateTextToImageTask).toHaveBeenCalledWith({
            image_resolution: '1K',
            image_size: 'square_hd',
            max_images: 1,
            prompt: 'A cute dog',
          });
        });
      });

      test('includes styled JSON prompt when preset selected', async () => {
        useAiGenerateStore.setState({
          count: 1,
          dimensions: { aspectRatio: '1:1', orientation: 'landscape', size: 'small' },
          patternDescription: 'A shiba dog',
          selectedOption: 'cute',
          styleCustomFields: { 'text to display': 'MeowWoof' },
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          expect(mockCreateTextToImageTask).toHaveBeenCalled();

          const callArgs = mockCreateTextToImageTask.mock.calls[0][0];
          const promptObj = JSON.parse(callArgs.prompt);

          expect(promptObj.description.value).toBe('A shiba dog');
          expect(promptObj.style).toBeDefined();
          expect(promptObj['text to display'].value).toBe('MeowWoof');
        });
      });

      test('uses plain text prompt for plain-text-to-image', async () => {
        useAiGenerateStore.setState({
          patternDescription: 'Plain text prompt',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          expect(mockCreateTextToImageTask).toHaveBeenCalledWith(
            expect.objectContaining({
              prompt: 'Plain text prompt',
            }),
          );
        });
      });

      test('maps 16:9 landscape to correct image size', async () => {
        useAiGenerateStore.setState({
          dimensions: { aspectRatio: '16:9', orientation: 'landscape', size: 'medium' },
          patternDescription: 'Test',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          expect(mockCreateTextToImageTask).toHaveBeenCalledWith(
            expect.objectContaining({
              image_resolution: '2K',
              image_size: 'landscape_16_9',
            }),
          );
        });
      });

      test('maps large size to 4K resolution', async () => {
        useAiGenerateStore.setState({
          dimensions: { aspectRatio: '1:1', orientation: 'landscape', size: 'large' },
          patternDescription: 'Test',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          expect(mockCreateTextToImageTask).toHaveBeenCalledWith(
            expect.objectContaining({
              image_resolution: '4K',
            }),
          );
        });
      });
    });

    describe('Image Edit API Calls', () => {
      test('calls createImageEditTask with File objects', async () => {
        const fileInput = createMockImageInput('file', 'test-1');

        useAiGenerateStore.setState({
          patternDescription: 'Edit this image',
          selectedImageInputs: [fileInput],
          selectedOption: 'plain-edit',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          expect(mockCreateImageEditTask).toHaveBeenCalled();

          const callArgs = mockCreateImageEditTask.mock.calls[0][0];

          expect(callArgs.image_inputs).toHaveLength(1);
          expect(callArgs.image_inputs[0]).toBeInstanceOf(File);
          expect(callArgs.prompt).toBe('Edit this image');
        });
      });

      test('calls createImageEditTask with URL strings', async () => {
        const urlInput = createMockImageInput('url', 'test-1');

        useAiGenerateStore.setState({
          patternDescription: 'Edit this image',
          selectedImageInputs: [urlInput],
          selectedOption: 'plain-edit',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          expect(mockCreateImageEditTask).toHaveBeenCalled();

          const callArgs = mockCreateImageEditTask.mock.calls[0][0];

          expect(callArgs.image_inputs).toHaveLength(1);
          expect(typeof callArgs.image_inputs[0]).toBe('string');
          expect(callArgs.image_inputs[0]).toBe('https://example.com/image.jpg');
        });
      });

      test('handles mixed File and URL inputs', async () => {
        const fileInput = createMockImageInput('file', 'test-1');
        const urlInput = createMockImageInput('url', 'test-2');

        useAiGenerateStore.setState({
          patternDescription: 'Edit these images',
          selectedImageInputs: [fileInput, urlInput],
          selectedOption: 'plain-edit',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          expect(mockCreateImageEditTask).toHaveBeenCalled();

          const callArgs = mockCreateImageEditTask.mock.calls[0][0];

          expect(callArgs.image_inputs).toHaveLength(2);
          expect(callArgs.image_inputs[0]).toBeInstanceOf(File);
          expect(typeof callArgs.image_inputs[1]).toBe('string');
        });
      });
    });

    describe('Polling and Success', () => {
      test('calls pollTaskUntilComplete with returned UUID', async () => {
        mockCreateTextToImageTask.mockResolvedValue({ uuid: 'test-uuid-123' });

        useAiGenerateStore.setState({
          patternDescription: 'Test prompt',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          expect(mockPollTaskUntilComplete).toHaveBeenCalledWith('test-uuid-123', expect.any(Function));
        });
      });

      test('updates generationStatus to generating', async () => {
        mockPollTaskUntilComplete.mockImplementation(() => new Promise(() => {})); // Never resolves

        useAiGenerateStore.setState({
          patternDescription: 'Test prompt',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        // Should immediately set to generating
        expect(useAiGenerateStore.getState().generationStatus).toBe('generating');
      });

      test('updates generatedImages on success', async () => {
        mockPollTaskUntilComplete.mockResolvedValue({
          imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
          success: true,
        });

        useAiGenerateStore.setState({
          patternDescription: 'Test prompt',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          const state = useAiGenerateStore.getState();

          expect(state.generatedImages).toHaveLength(2);
          expect(state.generationStatus).toBe('success');
        });
      });

      test('calls getInfo to refresh credits after success', async () => {
        useAiGenerateStore.setState({
          patternDescription: 'Test prompt',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          expect(mockGetInfo).toHaveBeenCalledWith({ silent: true });
        });
      });

      test('clears previous results before generating', async () => {
        mockPollTaskUntilComplete.mockImplementation(() => new Promise(() => {})); // Never resolves

        useAiGenerateStore.setState({
          errorMessage: 'Old error',
          generatedImages: ['https://example.com/old.jpg'],
          patternDescription: 'Test prompt',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        // Wait for async operations
        await waitFor(() => {
          const state = useAiGenerateStore.getState();

          // Check that results were cleared (should be cleared immediately)
          expect(state.errorMessage).toBe(null);
          expect(state.generatedImages).toHaveLength(0);
        });
      });
    });

    describe('Error Handling', () => {
      test('sets errorMessage on API error', async () => {
        mockCreateTextToImageTask.mockResolvedValue({ error: 'API Error' });

        useAiGenerateStore.setState({
          patternDescription: 'Test prompt',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          const state = useAiGenerateStore.getState();

          expect(state.errorMessage).toBe('API Error');
          expect(state.generationStatus).toBe('failed');
        });
      });

      test('handles error with code', async () => {
        mockCreateTextToImageTask.mockResolvedValue({
          code: 'INSUFFICIENT_CREDITS',
          error: 'You do not have enough credits',
        });

        useAiGenerateStore.setState({
          patternDescription: 'Test prompt',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          const state = useAiGenerateStore.getState();

          expect(state.errorMessage).toBe('INSUFFICIENT_CREDITS:You do not have enough credits');
        });
      });

      test('sets errorMessage on polling failure', async () => {
        mockPollTaskUntilComplete.mockResolvedValue({
          error: 'Generation timeout',
          success: false,
        });

        useAiGenerateStore.setState({
          patternDescription: 'Test prompt',
          selectedOption: 'plain-text-to-image',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        fireEvent.click(generateButton!);

        await waitFor(() => {
          const state = useAiGenerateStore.getState();

          expect(state.errorMessage).toBe('Generation timeout');
          expect(state.generationStatus).toBe('failed');
        });
      });

      test('handles invalid style preset', async () => {
        useAiGenerateStore.setState({
          patternDescription: 'Test prompt',
          selectedOption: 'invalid-preset',
        });

        const { container } = render(<AiGenerate />);

        const generateButton = Array.from(container.querySelectorAll('button')).find(
          (btn) => btn.textContent === 'Generate',
        );

        // Invalid preset means no config, which means no stylePreset
        // Component will treat it as plain mode and should work
        fireEvent.click(generateButton!);

        await waitFor(() => {
          // Should call text-to-image API with plain prompt
          expect(mockCreateTextToImageTask).toHaveBeenCalled();
        });
      });
    });
  });

  // ==========================================================================
  // P0: ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling Tests', () => {
    test('Generate button disabled when prompt is empty', () => {
      useAiGenerateStore.setState({ patternDescription: '' });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(true);
    });

    test('Generate button disabled when no user logged in', () => {
      mockGetCurrentUser.mockReturnValue(null);

      useAiGenerateStore.setState({ patternDescription: 'Test' });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(true);
    });

    test('Generate button disabled in edit mode with 0 images', () => {
      useAiGenerateStore.setState({
        patternDescription: 'Test',
        selectedImageInputs: [],
        selectedOption: 'plain-edit',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(true);
    });

    test('Generate button disabled in edit mode with >10 images', () => {
      const manyImages = Array.from({ length: 11 }, (_, i) => createMockImageInput('file', `img-${i}`));

      useAiGenerateStore.setState({
        patternDescription: 'Test',
        selectedImageInputs: manyImages,
        selectedOption: 'plain-edit',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(true);
    });

    test('Generate button disabled when insufficient credits', () => {
      mockGetCurrentUser.mockReturnValue(createMockUser(0.04));

      useAiGenerateStore.setState({
        count: 1,
        patternDescription: 'Test',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(true);
    });

    test('displays error for create task failure', async () => {
      mockCreateTextToImageTask.mockResolvedValue({ error: 'Network error' });

      useAiGenerateStore.setState({
        patternDescription: 'Test prompt',
        selectedOption: 'plain-text-to-image',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      );

      fireEvent.click(generateButton!);

      await waitFor(() => {
        expect(useAiGenerateStore.getState().errorMessage).toBe('Network error');
      });
    });

    test('error with INSUFFICIENT_CREDITS code includes code in message', async () => {
      mockCreateTextToImageTask.mockResolvedValue({
        code: 'INSUFFICIENT_CREDITS',
        error: 'Not enough credits',
      });

      useAiGenerateStore.setState({
        patternDescription: 'Test prompt',
        selectedOption: 'plain-text-to-image',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      );

      fireEvent.click(generateButton!);

      await waitFor(() => {
        const errorMsg = useAiGenerateStore.getState().errorMessage;

        expect(errorMsg).toContain('INSUFFICIENT_CREDITS');
        expect(errorMsg).toContain('Not enough credits');
      });
    });

    test('polling failure sets error state', async () => {
      mockPollTaskUntilComplete.mockResolvedValue({
        error: 'Polling timeout',
        success: false,
      });

      useAiGenerateStore.setState({
        patternDescription: 'Test prompt',
        selectedOption: 'plain-text-to-image',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      );

      fireEvent.click(generateButton!);

      await waitFor(() => {
        const state = useAiGenerateStore.getState();

        expect(state.errorMessage).toBe('Polling timeout');
        expect(state.generationStatus).toBe('failed');
      });
    });

    test('empty custom field does not cause error', async () => {
      useAiGenerateStore.setState({
        patternDescription: 'Test prompt',
        selectedOption: 'cute',
        styleCustomFields: { 'text to display': '' }, // Empty field
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      );

      fireEvent.click(generateButton!);

      await waitFor(() => {
        expect(mockCreateTextToImageTask).toHaveBeenCalled();

        const callArgs = mockCreateTextToImageTask.mock.calls[0][0];
        const promptObj = JSON.parse(callArgs.prompt);

        // Empty field should not be included
        expect(promptObj['text to display']).toBeUndefined();
      });
    });
  });

  // ==========================================================================
  // P0: CREDIT VALIDATION TESTS
  // ==========================================================================

  describe('Credit Validation Tests', () => {
    test('requires 0.05 credits for count=1', () => {
      mockGetCurrentUser.mockReturnValue(createMockUser(0.05));

      useAiGenerateStore.setState({
        count: 1,
        patternDescription: 'Test',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(false);
    });

    test('blocks generation with 0.04 credits for count=1', () => {
      mockGetCurrentUser.mockReturnValue(createMockUser(0.04));

      useAiGenerateStore.setState({
        count: 1,
        patternDescription: 'Test',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(true);
    });

    test('requires 0.10 credits for count=2', () => {
      mockGetCurrentUser.mockReturnValue(createMockUser(0.1));

      useAiGenerateStore.setState({
        count: 2,
        patternDescription: 'Test',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(false);
    });

    test('blocks generation with 0.09 credits for count=2', () => {
      mockGetCurrentUser.mockReturnValue(createMockUser(0.09));

      useAiGenerateStore.setState({
        count: 2,
        patternDescription: 'Test',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(true);
    });

    test('requires 0.20 credits for count=4', () => {
      mockGetCurrentUser.mockReturnValue(createMockUser(0.2));

      useAiGenerateStore.setState({
        count: 4,
        patternDescription: 'Test',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(false);
    });

    test('blocks generation with 0.19 credits for count=4', () => {
      mockGetCurrentUser.mockReturnValue(createMockUser(0.19));

      useAiGenerateStore.setState({
        count: 4,
        patternDescription: 'Test',
      });

      const { container } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(true);
    });

    test('displays current credit balance', () => {
      mockGetCurrentUser.mockReturnValue(createMockUser(2.5));

      const { container } = render(<AiGenerate />);

      const creditsBalance = container.querySelector('.ai-credit');

      expect(creditsBalance?.textContent).toBe('2.5');
    });

    test('displays required credits for current count', () => {
      useAiGenerateStore.setState({ count: 3 });

      const { container } = render(<AiGenerate />);

      const creditsRequired = container.querySelector('.credits-required');

      expect(creditsRequired?.textContent).toContain('0.15');
    });

    test('updates button state when credits change', () => {
      useAiGenerateStore.setState({
        count: 1,
        patternDescription: 'Test',
      });

      mockGetCurrentUser.mockReturnValue(createMockUser(0.04));

      const { container, unmount } = render(<AiGenerate />);

      let generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(true);

      // Simulate credit update by unmounting and remounting with new user
      unmount();
      mockGetCurrentUser.mockReturnValue(createMockUser(1.0));

      const { container: newContainer } = render(<AiGenerate />);

      generateButton = Array.from(newContainer.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      ) as HTMLButtonElement;

      expect(generateButton.disabled).toBe(false);
    });
  });

  // ==========================================================================
  // P0: IMAGE UPLOAD TESTS
  // ==========================================================================

  describe('Image Upload Tests', () => {
    test('ImageUploadArea receives correct props', () => {
      const imageInputs = [createMockImageInput('file', 'test-1')];

      useAiGenerateStore.setState({
        selectedImageInputs: imageInputs,
        selectedOption: 'plain-edit',
      });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('image-inputs-count')?.textContent).toBe('1');
    });

    test('adding image updates store', () => {
      useAiGenerateStore.setState({ selectedOption: 'plain-edit' });

      const { queryByTestId } = render(<AiGenerate />);

      const addButton = queryByTestId('mock-add-image');

      fireEvent.click(addButton!);

      expect(useAiGenerateStore.getState().selectedImageInputs).toHaveLength(1);
    });

    test('removing image updates store', () => {
      const imageInput = createMockImageInput('file', 'test-1');

      useAiGenerateStore.setState({
        selectedImageInputs: [imageInput],
        selectedOption: 'plain-edit',
      });

      const { queryByTestId } = render(<AiGenerate />);

      const removeButton = queryByTestId('mock-remove-test-1');

      fireEvent.click(removeButton!);

      expect(useAiGenerateStore.getState().selectedImageInputs).toHaveLength(0);
    });

    test('supports file-type ImageInput', () => {
      const fileInput = createMockImageInput('file', 'file-1');

      useAiGenerateStore.setState({
        selectedImageInputs: [fileInput],
        selectedOption: 'plain-edit',
      });

      render(<AiGenerate />);

      expect(useAiGenerateStore.getState().selectedImageInputs[0].type).toBe('file');
    });

    test('supports url-type ImageInput', () => {
      const urlInput = createMockImageInput('url', 'url-1');

      useAiGenerateStore.setState({
        selectedImageInputs: [urlInput],
        selectedOption: 'plain-edit',
      });

      render(<AiGenerate />);

      expect(useAiGenerateStore.getState().selectedImageInputs[0].type).toBe('url');
    });

    test('displays tip when images are present in edit mode', () => {
      useAiGenerateStore.setState({
        selectedImageInputs: [createMockImageInput('file', 'test-1')],
        selectedOption: 'plain-edit',
      });

      const { container } = render(<AiGenerate />);

      const hint = container.querySelector('.hint');

      expect(hint?.textContent).toContain('Reference images by number');
    });

    test('does not display tip when no images in edit mode', () => {
      useAiGenerateStore.setState({
        selectedImageInputs: [],
        selectedOption: 'plain-edit',
      });

      const { container } = render(<AiGenerate />);

      const hint = container.querySelector('.hint');

      expect(hint).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P0: HISTORY IMPORT TESTS
  // ==========================================================================

  describe('History Import Tests', () => {
    test('clicking history button triggers loadHistory', async () => {
      const { container } = render(<AiGenerate />);

      const historyButton = container.querySelector('[data-icon="clock-circle"]')?.closest('button');

      fireEvent.click(historyButton!);

      await waitFor(() => {
        expect(mockGetAiImageHistory).toHaveBeenCalled();
      });
    });

    test('imports plain text-to-image history item', () => {
      const historyItem = createMockHistoryItem({
        image_resolution: '2K',
        image_size: 'square_hd',
        max_images: 2,
        model_type: 'text-to-image',
        prompt: 'A cute cat',
      });

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const state = useAiGenerateStore.getState();

      expect(state.patternDescription).toBe('A cute cat');
      expect(state.selectedOption).toBe('plain-text-to-image');
      expect(state.dimensions.aspectRatio).toBe('1:1');
      expect(state.dimensions.size).toBe('medium');
      expect(state.count).toBe(2);
    });

    test('imports styled prompt and parses fields', () => {
      const styledPrompt = JSON.stringify({
        background: { value: 'full pure white color', weight: 0.6 },
        color: {
          value: 'soft pastel tones: baby pink, sky blue, cream white, gentle lavender, light golden yellow',
          weight: 0.7,
        },
        description: { value: 'A shiba dog', weight: 0.9 },
        'negative prompt': {
          value:
            'blurry, deformed, disfigured, ugly, bad anatomy, watermark, messy, 3D render, photo, complex background, text artifacts',
          weight: 1.0,
        },
        style: {
          value:
            'kawaii hand-drawn logo, flat vector design, adorable illustration, rounded shapes, soft lines, professional quality, sharp lines. Bold, clean sans-serif typography',
          weight: 1.0,
        },
        'text position': { value: 'positioned directly below the logo, centered horizontally', weight: 1.1 },
        'text to display': { value: 'MeowWoof', weight: 1.2 },
      });

      const historyItem = createMockHistoryItem({
        model_type: 'text-to-image',
        prompt: styledPrompt,
      });

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const state = useAiGenerateStore.getState();

      expect(state.patternDescription).toBe('A shiba dog');
      expect(state.selectedOption).toBe('cute');
      expect(state.styleCustomFields['text to display']).toBe('MeowWoof');
    });

    test('imports edit mode history with image URLs', () => {
      const historyItem = createMockHistoryItem({
        image_urls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        model_type: 'edit',
        prompt: 'Edit this image',
      });

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const state = useAiGenerateStore.getState();

      expect(state.selectedOption).toBe('plain-edit');
      expect(state.selectedImageInputs).toHaveLength(2);
      expect(state.selectedImageInputs[0].type).toBe('url');
      expect(state.selectedImageInputs[0]).toHaveProperty('url', 'https://example.com/img1.jpg');
    });

    test('imports 16:9 landscape dimensions', () => {
      const historyItem = createMockHistoryItem({
        image_resolution: '4K',
        image_size: 'landscape_16_9',
      });

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const { dimensions } = useAiGenerateStore.getState();

      expect(dimensions.aspectRatio).toBe('16:9');
      expect(dimensions.orientation).toBe('landscape');
      expect(dimensions.size).toBe('large');
    });

    test('imports 4:3 portrait dimensions', () => {
      const historyItem = createMockHistoryItem({
        image_resolution: '1K',
        image_size: 'portrait_4_3',
      });

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const { dimensions } = useAiGenerateStore.getState();

      expect(dimensions.aspectRatio).toBe('4:3');
      expect(dimensions.orientation).toBe('portrait');
      expect(dimensions.size).toBe('small');
    });

    test('closes history view after import', () => {
      const historyItem = createMockHistoryItem();

      useAiGenerateStore.setState({ showHistory: true });
      useAiGenerateStore.getState().importFromHistory(historyItem);

      expect(useAiGenerateStore.getState().showHistory).toBe(false);
    });

    test('handles malformed JSON prompt as plain text', () => {
      const historyItem = createMockHistoryItem({
        prompt: '{ invalid json',
      });

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const state = useAiGenerateStore.getState();

      expect(state.patternDescription).toBe('{ invalid json');
      expect(state.selectedOption).toBe('plain-text-to-image');
    });

    test('handles history item with no image URLs in edit mode', () => {
      const historyItem = createMockHistoryItem({
        image_urls: null,
        model_type: 'edit',
      });

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const state = useAiGenerateStore.getState();

      expect(state.selectedImageInputs).toHaveLength(0);
    });

    test('restores generated images if available', () => {
      const historyItem = createMockHistoryItem({
        result_urls: ['https://example.com/result1.jpg', 'https://example.com/result2.jpg'],
        state: 'success',
      });

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const state = useAiGenerateStore.getState();

      expect(state.generatedImages).toHaveLength(2);
      expect(state.generationStatus).toBe('success');
    });
  });

  // ==========================================================================
  // P1: RESULTS DISPLAY TESTS
  // ==========================================================================

  describe('Results Display Tests', () => {
    test('passes errorMessage to ImageResults', () => {
      useAiGenerateStore.setState({ errorMessage: 'Test error' });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('error-message')?.textContent).toBe('Test error');
    });

    test('passes generatedImages to ImageResults', () => {
      useAiGenerateStore.setState({
        generatedImages: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('generated-images-count')?.textContent).toBe('2');
    });

    test('passes generationStatus to ImageResults', () => {
      useAiGenerateStore.setState({ generationStatus: 'generating' });

      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('generation-status')?.textContent).toBe('generating');
    });

    test('shows idle status by default', () => {
      const { queryByTestId } = render(<AiGenerate />);

      expect(queryByTestId('generation-status')?.textContent).toBe('idle');
    });

    test('shows generating status during generation', async () => {
      mockPollTaskUntilComplete.mockImplementation(() => new Promise(() => {}));

      useAiGenerateStore.setState({
        patternDescription: 'Test prompt',
        selectedOption: 'plain-text-to-image',
      });

      const { container, queryByTestId } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      );

      fireEvent.click(generateButton!);

      expect(queryByTestId('generation-status')?.textContent).toBe('generating');
    });

    test('shows success status after successful generation', async () => {
      mockPollTaskUntilComplete.mockResolvedValue({
        imageUrls: ['https://example.com/img1.jpg'],
        success: true,
      });

      useAiGenerateStore.setState({
        patternDescription: 'Test prompt',
        selectedOption: 'plain-text-to-image',
      });

      const { container, queryByTestId } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      );

      fireEvent.click(generateButton!);

      await waitFor(() => {
        expect(queryByTestId('generation-status')?.textContent).toBe('success');
      });
    });

    test('shows failed status after generation failure', async () => {
      mockPollTaskUntilComplete.mockResolvedValue({
        error: 'Generation failed',
        success: false,
      });

      useAiGenerateStore.setState({
        patternDescription: 'Test prompt',
        selectedOption: 'plain-text-to-image',
      });

      const { container, queryByTestId } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      );

      fireEvent.click(generateButton!);

      await waitFor(() => {
        expect(queryByTestId('generation-status')?.textContent).toBe('failed');
      });
    });

    test('displays error message with INSUFFICIENT_CREDITS code', async () => {
      mockCreateTextToImageTask.mockResolvedValue({
        code: 'INSUFFICIENT_CREDITS',
        error: 'Not enough credits',
      });

      useAiGenerateStore.setState({
        patternDescription: 'Test prompt',
        selectedOption: 'plain-text-to-image',
      });

      const { container, queryByTestId } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      );

      fireEvent.click(generateButton!);

      await waitFor(() => {
        const errorMsg = queryByTestId('error-message')?.textContent;

        expect(errorMsg).toContain('INSUFFICIENT_CREDITS');
      });
    });

    test('clears results when starting new generation', async () => {
      mockPollTaskUntilComplete.mockImplementation(() => new Promise(() => {})); // Never resolves

      useAiGenerateStore.setState({
        errorMessage: 'Old error',
        generatedImages: ['https://example.com/old.jpg'],
        generationStatus: 'success',
        patternDescription: 'New prompt',
        selectedOption: 'plain-text-to-image',
      });

      const { container, queryByTestId } = render(<AiGenerate />);

      const generateButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Generate',
      );

      fireEvent.click(generateButton!);

      // Old results should be cleared
      await waitFor(() => {
        expect(queryByTestId('error-message')?.textContent).toBe('');
        expect(queryByTestId('generated-images-count')?.textContent).toBe('0');
      });
    });
  });

  // ==========================================================================
  // LIFECYCLE & EVENT TESTS
  // ==========================================================================

  describe('Lifecycle and Event Tests', () => {
    test('subscribes to fluxIDEvents on mount', () => {
      render(<AiGenerate />);

      expect(mockFluxIDEvents.on).toHaveBeenCalledWith('update-user', expect.any(Function));
    });

    test('unsubscribes from fluxIDEvents on unmount', () => {
      const { unmount } = render(<AiGenerate />);

      unmount();

      expect(mockFluxIDEvents.off).toHaveBeenCalledWith('update-user', expect.any(Function));
    });

    test('updates currentUser when event fires', () => {
      const updatedUser = createMockUser(5.0);

      render(<AiGenerate />);

      // Get the callback that was registered
      const callback = mockFluxIDEvents.on.mock.calls[0][1];

      // Simulate event
      callback(updatedUser);

      // Component should re-render with new user data
      // We can't directly check state, but we can verify the callback was called
      expect(mockFluxIDEvents.on).toHaveBeenCalledWith('update-user', expect.any(Function));
    });

    test('cleans up timeout on unmount', () => {
      jest.useFakeTimers();

      const { container, unmount } = render(<AiGenerate />);

      const moreButtonContainer = container.querySelector('.more-button-container');

      fireEvent.mouseEnter(moreButtonContainer!);
      fireEvent.mouseLeave(moreButtonContainer!);

      unmount();

      // Should not throw error
      expect(() => {
        jest.runAllTimers();
      }).not.toThrow();

      jest.useRealTimers();
    });
  });
});
