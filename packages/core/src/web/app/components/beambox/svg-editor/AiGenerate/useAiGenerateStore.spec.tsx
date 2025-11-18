import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import { getAiImageHistory } from '@core/helpers/api/ai-image';

import type { ImageInput } from './types';
import { useAiGenerateStore } from './useAiGenerateStore';

// Mock the API
jest.mock('@core/helpers/api/ai-image', () => ({
  getAiImageHistory: jest.fn(),
}));

const mockGetAiImageHistory = getAiImageHistory as jest.MockedFunction<typeof getAiImageHistory>;

describe('useAiGenerateStore', () => {
  beforeEach(() => {
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
      inputFields: {},
      isAiGenerateShown: false,
      isLaserFriendly: false,
      selectedImageInputs: [],
      showHistory: false,
      style: 'text-to-image-plain',
    });

    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAiGenerateStore.getState();

      expect(state.count).toBe(1);
      expect(state.dimensions).toEqual({ aspectRatio: '1:1', orientation: 'landscape', size: 'small' });
      expect(state.errorMessage).toBeNull();
      expect(state.generatedImages).toEqual([]);
      expect(state.generationStatus).toBe('idle');
      expect(state.inputFields).toEqual({});
      expect(state.isLaserFriendly).toBe(false);
      expect(state.selectedImageInputs).toEqual([]);
      expect(state.style).toBe('text-to-image-plain');
    });
  });

  describe('addImageInput', () => {
    it('should add a file-type image input', () => {
      const input: ImageInput = {
        file: new File([''], 'test.jpg'),
        id: 'test-1',
        type: 'file',
      };

      useAiGenerateStore.getState().addImageInput(input);

      const state = useAiGenerateStore.getState();

      expect(state.selectedImageInputs).toHaveLength(1);
      expect(state.selectedImageInputs[0]).toEqual(input);
    });

    it('should add a url-type image input', () => {
      const input: ImageInput = {
        id: 'test-1',
        type: 'url',
        url: 'https://example.com/image.jpg',
      };

      useAiGenerateStore.getState().addImageInput(input);

      const state = useAiGenerateStore.getState();

      expect(state.selectedImageInputs).toHaveLength(1);
      expect(state.selectedImageInputs[0]).toEqual(input);
    });

    it('should add multiple image inputs', () => {
      const input1: ImageInput = { file: new File([''], 'test1.jpg'), id: 'test-1', type: 'file' };
      const input2: ImageInput = { id: 'test-2', type: 'url', url: 'https://example.com/image.jpg' };

      useAiGenerateStore.getState().addImageInput(input1);
      useAiGenerateStore.getState().addImageInput(input2);

      const state = useAiGenerateStore.getState();

      expect(state.selectedImageInputs).toHaveLength(2);
      expect(state.selectedImageInputs[0]).toEqual(input1);
      expect(state.selectedImageInputs[1]).toEqual(input2);
    });
  });

  describe('removeImageInput', () => {
    it('should remove image input by id', () => {
      const input1: ImageInput = { file: new File([''], 'test1.jpg'), id: 'test-1', type: 'file' };
      const input2: ImageInput = { file: new File([''], 'test2.jpg'), id: 'test-2', type: 'file' };

      useAiGenerateStore.setState({ selectedImageInputs: [input1, input2] });
      useAiGenerateStore.getState().removeImageInput('test-1');

      const state = useAiGenerateStore.getState();

      expect(state.selectedImageInputs).toHaveLength(1);
      expect(state.selectedImageInputs[0]).toEqual(input2);
    });

    it('should handle removing non-existent id', () => {
      const input1: ImageInput = { file: new File([''], 'test1.jpg'), id: 'test-1', type: 'file' };

      useAiGenerateStore.setState({ selectedImageInputs: [input1] });
      useAiGenerateStore.getState().removeImageInput('non-existent');

      const state = useAiGenerateStore.getState();

      expect(state.selectedImageInputs).toHaveLength(1);
      expect(state.selectedImageInputs[0]).toEqual(input1);
    });
  });

  describe('clearImageInputs', () => {
    it('should clear all image inputs', () => {
      const input1: ImageInput = { file: new File([''], 'test1.jpg'), id: 'test-1', type: 'file' };
      const input2: ImageInput = { file: new File([''], 'test2.jpg'), id: 'test-2', type: 'file' };

      useAiGenerateStore.setState({ selectedImageInputs: [input1, input2] });
      useAiGenerateStore.getState().clearImageInputs();

      expect(useAiGenerateStore.getState().selectedImageInputs).toEqual([]);
    });
  });

  describe('setInputField', () => {
    it('should set a new input field', () => {
      useAiGenerateStore.getState().setInputField('description', 'A cute cat');

      expect(useAiGenerateStore.getState().inputFields.description).toBe('A cute cat');
    });

    it('should update existing input field', () => {
      useAiGenerateStore.setState({ inputFields: { description: 'Old text' } });
      useAiGenerateStore.getState().setInputField('description', 'New text');

      expect(useAiGenerateStore.getState().inputFields.description).toBe('New text');
    });

    it('should set multiple different fields', () => {
      useAiGenerateStore.getState().setInputField('description', 'Pattern description');
      useAiGenerateStore.getState().setInputField('textToDisplay', 'MeowWoof');

      const fields = useAiGenerateStore.getState().inputFields;

      expect(fields.description).toBe('Pattern description');
      expect(fields.textToDisplay).toBe('MeowWoof');
    });
  });

  describe('setStyle', () => {
    it('should change style', () => {
      useAiGenerateStore.getState().setStyle('logo-cute');

      expect(useAiGenerateStore.getState().style).toBe('logo-cute');
    });

    it('should preserve valid input fields when changing style', () => {
      useAiGenerateStore.setState({
        inputFields: { description: 'Test description' },
        style: 'text-to-image-plain',
      });

      useAiGenerateStore.getState().setStyle('logo-cute');

      const state = useAiGenerateStore.getState();

      expect(state.style).toBe('logo-cute');
      expect(state.inputFields.description).toBe('Test description');
    });

    it('should remove invalid input fields when changing style', () => {
      useAiGenerateStore.setState({
        inputFields: { description: 'Test', textToDisplay: 'MeowWoof' },
        style: 'logo-cute',
      });

      useAiGenerateStore.getState().setStyle('text-to-image-plain');

      const state = useAiGenerateStore.getState();

      expect(state.inputFields.description).toBe('Test');
      expect(state.inputFields.textToDisplay).toBeUndefined();
    });

    it('should reset laser-friendly toggle when changing style', () => {
      useAiGenerateStore.setState({ isLaserFriendly: true, style: 'text-to-image-plain' });

      useAiGenerateStore.getState().setStyle('logo-cute');

      expect(useAiGenerateStore.getState().isLaserFriendly).toBe(false);
    });
  });

  describe('resetForm', () => {
    it('should reset all form fields to initial state', () => {
      useAiGenerateStore.setState({
        count: 3,
        dimensions: { aspectRatio: '16:9', orientation: 'landscape', size: 'large' },
        errorMessage: 'Error',
        generatedImages: ['https://example.com/img.jpg'],
        generationStatus: 'success',
        inputFields: { description: 'Test' },
        isLaserFriendly: true,
        selectedImageInputs: [{ file: new File([''], 'test.jpg'), id: 'test-1', type: 'file' }],
      });

      useAiGenerateStore.getState().resetForm();

      const state = useAiGenerateStore.getState();

      expect(state.count).toBe(1);
      expect(state.dimensions).toEqual({ aspectRatio: '1:1', orientation: 'landscape', size: 'small' });
      expect(state.errorMessage).toBeNull();
      expect(state.generatedImages).toEqual([]);
      expect(state.generationStatus).toBe('idle');
      expect(state.inputFields).toEqual({});
      expect(state.isLaserFriendly).toBe(false);
      expect(state.selectedImageInputs).toEqual([]);
    });
  });

  describe('clearGenerationResults', () => {
    it('should clear generation results', () => {
      useAiGenerateStore.setState({
        errorMessage: 'Error',
        generatedImages: ['https://example.com/img.jpg'],
        generationStatus: 'success',
        generationUuid: 'uuid-123',
      });

      useAiGenerateStore.getState().clearGenerationResults();

      const state = useAiGenerateStore.getState();

      expect(state.errorMessage).toBeNull();
      expect(state.generatedImages).toEqual([]);
      expect(state.generationStatus).toBe('idle');
      expect(state.generationUuid).toBeNull();
    });
  });

  describe('toggleLaserFriendly', () => {
    it('should toggle laser-friendly on and add color field', () => {
      useAiGenerateStore.getState().toggleLaserFriendly();

      const state = useAiGenerateStore.getState();

      expect(state.isLaserFriendly).toBe(true);
      expect(state.inputFields.color).toContain('pure black and white');
    });

    it('should toggle laser-friendly off and remove color field', () => {
      useAiGenerateStore.setState({ inputFields: { color: 'laser text' }, isLaserFriendly: true });

      useAiGenerateStore.getState().toggleLaserFriendly();

      const state = useAiGenerateStore.getState();

      expect(state.isLaserFriendly).toBe(false);
      expect(state.inputFields.color).toBeUndefined();
    });
  });

  describe('toggleHistory', () => {
    it('should toggle showHistory from false to true', () => {
      useAiGenerateStore.getState().toggleHistory();

      expect(useAiGenerateStore.getState().showHistory).toBe(true);
    });

    it('should toggle showHistory from true to false', () => {
      useAiGenerateStore.setState({ showHistory: true });

      useAiGenerateStore.getState().toggleHistory();

      expect(useAiGenerateStore.getState().showHistory).toBe(false);
    });

    it('should call loadHistory when showing history for the first time', async () => {
      mockGetAiImageHistory.mockResolvedValue({ data: [] } as any);

      useAiGenerateStore.getState().toggleHistory();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockGetAiImageHistory).toHaveBeenCalled();
    });

    it('should not call loadHistory when hiding history', async () => {
      useAiGenerateStore.setState({ showHistory: true });

      useAiGenerateStore.getState().toggleHistory();

      expect(mockGetAiImageHistory).not.toHaveBeenCalled();
    });
  });

  describe('loadHistory', () => {
    it('should load history successfully', async () => {
      const mockData: AiImageGenerationData[] = [
        {
          completed_at: '2024-01-01T00:00:00Z',
          cost_time: 60,
          created_at: '2024-01-01T00:00:00Z',
          fail_msg: null,
          image_resolution: '1K',
          image_size: 'square_hd',
          image_urls: null,
          max_images: 1,
          model_type: 'text-to-image',
          prompt_data: { inputs: { description: 'Test' }, style: 'text-to-image-plain' },
          result_urls: ['https://example.com/result.jpg'],
          seed: null,
          state: 'success',
          task_id: 'task-1',
          uuid: 'uuid-1',
        },
      ];

      mockGetAiImageHistory.mockResolvedValue({ data: mockData } as any);

      await useAiGenerateStore.getState().loadHistory();

      const state = useAiGenerateStore.getState();

      expect(state.historyItems).toEqual(mockData);
      expect(state.historyLoading).toBe(false);
      expect(state.historyError).toBeNull();
      expect(state.historyOffset).toBe(1);
    });

    it('should handle load history error', async () => {
      mockGetAiImageHistory.mockResolvedValue({ error: 'Network error' });

      await useAiGenerateStore.getState().loadHistory();

      const state = useAiGenerateStore.getState();

      expect(state.historyError).toBe('Network error');
      expect(state.historyLoading).toBe(false);
    });

    it('should not load history if already loading', async () => {
      useAiGenerateStore.setState({ historyLoading: true });

      await useAiGenerateStore.getState().loadHistory();

      expect(mockGetAiImageHistory).not.toHaveBeenCalled();
    });
  });

  describe('importFromHistory', () => {
    it('should import text-to-image history item', () => {
      const historyItem: AiImageGenerationData = {
        completed_at: '2024-01-01T00:00:00Z',
        cost_time: 60,
        created_at: '2024-01-01T00:00:00Z',
        fail_msg: null,
        image_resolution: '2K',
        image_size: 'landscape_16_9',
        image_urls: null,
        max_images: 2,
        model_type: 'text-to-image',
        prompt_data: { inputs: { description: 'A cute cat' }, style: 'text-to-image-plain' },
        result_urls: ['https://example.com/result.jpg'],
        seed: null,
        state: 'success',
        task_id: 'task-1',
        uuid: 'uuid-1',
      };

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const state = useAiGenerateStore.getState();

      expect(state.inputFields.description).toBe('A cute cat');
      expect(state.style).toBe('text-to-image-plain');
      expect(state.dimensions.aspectRatio).toBe('16:9');
      expect(state.dimensions.size).toBe('medium');
      expect(state.count).toBe(2);
      expect(state.showHistory).toBe(false);
    });

    it('should import edit mode history with image URLs', () => {
      const historyItem: AiImageGenerationData = {
        completed_at: '2024-01-01T00:00:00Z',
        cost_time: 60,
        created_at: '2024-01-01T00:00:00Z',
        fail_msg: null,
        image_resolution: '1K',
        image_size: 'square_hd',
        image_urls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        max_images: 1,
        model_type: 'edit',
        prompt_data: { inputs: { description: 'Edit this' }, style: 'edit-plain' },
        result_urls: ['https://example.com/result.jpg'],
        seed: null,
        state: 'success',
        task_id: 'task-1',
        uuid: 'uuid-1',
      };

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const state = useAiGenerateStore.getState();

      expect(state.style).toBe('edit-plain');
      expect(state.selectedImageInputs).toHaveLength(2);
      expect(state.selectedImageInputs[0].type).toBe('url');
    });

    it('should convert snake_case fields to camelCase', () => {
      const historyItem: AiImageGenerationData = {
        completed_at: '2024-01-01T00:00:00Z',
        cost_time: 60,
        created_at: '2024-01-01T00:00:00Z',
        fail_msg: null,
        image_resolution: '1K',
        image_size: 'square_hd',
        image_urls: null,
        max_images: 1,
        model_type: 'text-to-image',
        prompt_data: {
          inputs: { description: 'Test', text_to_display: 'MeowWoof' },
          style: 'logo-cute',
        },
        result_urls: ['https://example.com/result.jpg'],
        seed: null,
        state: 'success',
        task_id: 'task-1',
        uuid: 'uuid-1',
      };

      useAiGenerateStore.getState().importFromHistory(historyItem);

      const state = useAiGenerateStore.getState();

      expect(state.inputFields.description).toBe('Test');
      expect(state.inputFields.textToDisplay).toBe('MeowWoof');
    });
  });

  describe('addPendingHistoryItem', () => {
    it('should add a pending history item to the beginning', () => {
      useAiGenerateStore.setState({
        inputFields: { description: 'Test' },
        style: 'text-to-image-plain',
      });

      useAiGenerateStore.getState().addPendingHistoryItem({
        count: 1,
        dimensions: { aspectRatio: '1:1', orientation: 'landscape', size: 'small' },
        mode: 'text-to-image',
        uuid: 'uuid-new',
      });

      const state = useAiGenerateStore.getState();

      expect(state.historyItems).toHaveLength(1);
      expect(state.historyItems[0].uuid).toBe('uuid-new');
      expect(state.historyItems[0].state).toBe('pending');
    });
  });

  describe('updateHistoryItem', () => {
    it('should update history item by uuid', () => {
      const historyItem: AiImageGenerationData = {
        completed_at: null,
        cost_time: null,
        created_at: '2024-01-01T00:00:00Z',
        fail_msg: null,
        image_resolution: '1K',
        image_size: 'square_hd',
        image_urls: null,
        max_images: 1,
        model_type: 'text-to-image',
        prompt_data: { inputs: { description: 'Test' }, style: 'text-to-image-plain' },
        result_urls: null,
        seed: null,
        state: 'pending',
        task_id: null,
        uuid: 'uuid-1',
      };

      useAiGenerateStore.setState({ historyItems: [historyItem] });

      useAiGenerateStore.getState().updateHistoryItem('uuid-1', {
        result_urls: ['https://example.com/result.jpg'],
        state: 'success',
      });

      const state = useAiGenerateStore.getState();

      expect(state.historyItems[0].state).toBe('success');
      expect(state.historyItems[0].result_urls).toEqual(['https://example.com/result.jpg']);
    });
  });

  describe('toggleFixedSeed', () => {
    it('should toggle isFixedSeed from false to true', () => {
      useAiGenerateStore.getState().toggleFixedSeed();

      expect(useAiGenerateStore.getState().isFixedSeed).toBe(true);
    });

    it('should toggle isFixedSeed from true to false', () => {
      useAiGenerateStore.setState({ isFixedSeed: true, seed: 12345 });

      useAiGenerateStore.getState().toggleFixedSeed();

      expect(useAiGenerateStore.getState().isFixedSeed).toBe(false);
    });

    it('should preserve seed value when toggling on', () => {
      useAiGenerateStore.setState({ seed: 42 });

      useAiGenerateStore.getState().toggleFixedSeed();

      const state = useAiGenerateStore.getState();

      expect(state.isFixedSeed).toBe(true);
      expect(state.seed).toBe(42);
    });

    it('should clear seed when toggling off', () => {
      useAiGenerateStore.setState({ isFixedSeed: true, seed: 12345 });

      useAiGenerateStore.getState().toggleFixedSeed();

      const state = useAiGenerateStore.getState();

      expect(state.isFixedSeed).toBe(false);
      expect(state.seed).toBeUndefined();
    });
  });

  describe('setSeed', () => {
    it('should set seed to a number', () => {
      useAiGenerateStore.getState().setState({ seed: 99999 });

      expect(useAiGenerateStore.getState().seed).toBe(99999);
    });

    it('should set seed to null', () => {
      useAiGenerateStore.setState({ seed: 12345 });

      useAiGenerateStore.getState().setState({ seed: null });

      expect(useAiGenerateStore.getState().seed).toBeNull();
    });

    it('should accept zero as valid seed', () => {
      useAiGenerateStore.getState().setState({ seed: 0 });

      expect(useAiGenerateStore.getState().seed).toBe(0);
    });
  });
});
