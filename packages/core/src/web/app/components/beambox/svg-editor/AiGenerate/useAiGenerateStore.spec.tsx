import { getAiImageHistory } from '@core/helpers/api/ai-image';
import type { ImageInput } from './types';
import { useAiGenerateStore } from './useAiGenerateStore';

jest.mock('@core/helpers/api/ai-image', () => ({ getAiImageHistory: jest.fn() }));

const mockGetAiImageHistory = getAiImageHistory as jest.MockedFunction<typeof getAiImageHistory>;

describe('useAiGenerateStore', () => {
  beforeEach(() => {
    useAiGenerateStore.getState().resetForm();
    useAiGenerateStore.setState({ historyItems: [], historyLoading: false, showHistory: false });
    jest.clearAllMocks();
  });

  describe('Image Inputs', () => {
    it('adds image inputs correctly', () => {
      const fileInput: ImageInput = { file: new File([], 'a.jpg'), id: '1', type: 'file' };
      const urlInput: ImageInput = { id: '2', type: 'url', url: 'http://a.com/b.jpg' };

      const store = useAiGenerateStore.getState();

      store.addImageInput(fileInput);
      store.addImageInput(urlInput);

      expect(useAiGenerateStore.getState().imageInputs).toEqual([fileInput, urlInput]);
    });

    it('removes image inputs by id', () => {
      const input: ImageInput = { id: '1', type: 'url', url: 'a' };

      useAiGenerateStore.setState({ imageInputs: [input] });

      useAiGenerateStore.getState().removeImageInput('1');
      expect(useAiGenerateStore.getState().imageInputs).toHaveLength(0);
    });

    it('clears all inputs', () => {
      useAiGenerateStore.setState({ imageInputs: [{ id: '1', type: 'url', url: 'a' }] });
      useAiGenerateStore.getState().clearImageInputs();
      expect(useAiGenerateStore.getState().imageInputs).toHaveLength(0);
    });
  });

  describe('Form Fields', () => {
    it('updates input fields', () => {
      useAiGenerateStore.getState().setInputField('desc', 'test');
      expect(useAiGenerateStore.getState().inputFields.desc).toBe('test');
    });

    it('resets form to defaults', () => {
      useAiGenerateStore.setState({ count: 5, style: 'custom' });
      useAiGenerateStore.getState().resetForm();

      const state = useAiGenerateStore.getState();

      expect(state.count).toBe(1);
      expect(state.style).toBe('plain');
    });
  });

  describe('Logic Actions', () => {
    it('toggles fixed seed and manages value', () => {
      const store = useAiGenerateStore.getState();

      store.toggleFixedSeed();
      store.setState({ seed: 123 });
      expect(useAiGenerateStore.getState().isFixedSeed).toBe(true);
      expect(useAiGenerateStore.getState().seed).toBe(123);

      store.toggleFixedSeed();
      expect(useAiGenerateStore.getState().isFixedSeed).toBe(false);
      expect(useAiGenerateStore.getState().seed).toBeUndefined();
    });

    it('toggles laser friendly mode and injects color prompt', () => {
      const store = useAiGenerateStore.getState();

      store.toggleLaserFriendly();
      expect(useAiGenerateStore.getState().inputFields.color).toContain('pure black');

      store.toggleLaserFriendly();
      expect(useAiGenerateStore.getState().inputFields.color).toBeUndefined();
    });
  });

  // --- History ---
  describe('History Actions', () => {
    it('loads history only if empty', async () => {
      mockGetAiImageHistory.mockResolvedValue({ data: [] } as any);

      useAiGenerateStore.getState().toggleHistory();
      expect(mockGetAiImageHistory).toHaveBeenCalled();

      useAiGenerateStore.getState().toggleHistory();
      jest.clearAllMocks();

      useAiGenerateStore.getState().toggleHistory();
    });

    it('updates history items', () => {
      const item = { state: 'pending', uuid: '1' } as any;

      useAiGenerateStore.setState({ historyItems: [item] });

      useAiGenerateStore.getState().updateHistoryItem('1', { state: 'success' });
      expect(useAiGenerateStore.getState().historyItems[0].state).toBe('success');
    });

    it('imports history item to form', () => {
      const item = {
        max_images: 4,
        prompt_data: { inputs: { desc: 'foo' }, style: 'logo' },
        result_urls: ['a.jpg'],
      } as any;

      useAiGenerateStore.getState().importFromHistory(item);

      const state = useAiGenerateStore.getState();

      expect(state.count).toBe(4);
      expect(state.inputFields.desc).toBe('foo');
      expect(state.style).toBe('logo');
      expect(state.showHistory).toBe(false);
    });
  });
});
