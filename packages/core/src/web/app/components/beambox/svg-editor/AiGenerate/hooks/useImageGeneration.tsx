import { createImageEditTask, createTextToImageTask, pollTaskUntilComplete } from '@core/helpers/api/ai-image';
import { getInfo } from '@core/helpers/api/flux-id';
import type { IUser } from '@core/interfaces/IUser';

import type { GenerationMode, ImageDimensions } from '../useAiGenerateStore';
import { useAiGenerateStore } from '../useAiGenerateStore';
import { getImageResolution, getImageSizeOption } from '../utils/dimensions';
import { buildStyledPrompt, getStylePreset } from '../utils/stylePresets';

interface UseImageGenerationParams {
  count: number;
  currentUser: IUser | null;
  dimensions: ImageDimensions;
  mode: GenerationMode;
  stylePreset: null | string;
}

interface UseImageGenerationReturn {
  handleGenerate: () => Promise<void>;
}

/**
 * Custom hook for managing AI image generation flow
 * Handles validation, API calls, polling, and state updates
 */
export const useImageGeneration = ({
  count,
  currentUser,
  dimensions,
  mode,
  stylePreset,
}: UseImageGenerationParams): UseImageGenerationReturn => {
  const {
    addPendingHistoryItem,
    clearGenerationResults,
    patternDescription,
    selectedImageInputs,
    styleCustomFields,
    updateHistoryItem,
  } = useAiGenerateStore();

  const handleGenerate = async () => {
    // Check prompt
    if (!patternDescription.trim()) {
      useAiGenerateStore.setState({ errorMessage: 'Please provide a prompt description' });

      return;
    }

    // Edit mode requirements
    if (mode === 'edit' && selectedImageInputs.length === 0) {
      useAiGenerateStore.setState({ errorMessage: 'Please upload at least one image for editing' });

      return;
    }

    if (mode === 'edit' && selectedImageInputs.length > 10) {
      useAiGenerateStore.setState({ errorMessage: 'Maximum 10 images allowed' });

      return;
    }

    // User authentication
    if (!currentUser) {
      useAiGenerateStore.setState({ errorMessage: 'Please log in to use AI generation.' });

      return;
    }

    // Clear previous results and set generating status
    clearGenerationResults();
    useAiGenerateStore.setState({ generationStatus: 'generating' });

    // Build prompt based on style
    let prompt: string;

    if (stylePreset) {
      // Style mode: construct weighted JSON prompt
      const preset = getStylePreset(stylePreset);

      if (!preset) {
        useAiGenerateStore.setState({ errorMessage: 'Invalid style preset selected' });

        return;
      }

      prompt = buildStyledPrompt(preset, patternDescription.trim(), styleCustomFields);
    } else {
      // Plain mode: use pattern description as-is
      prompt = patternDescription.trim();
    }

    // Create task based on mode
    let createResponse: { error: string } | { uuid: string };

    if (mode === 'edit') {
      // Convert ImageInput array to File | string array for API
      const imageInputsForApi = selectedImageInputs.map((input) => (input.type === 'file' ? input.file : input.url));

      createResponse = await createImageEditTask({
        image_inputs: imageInputsForApi,
        image_resolution: getImageResolution(dimensions.size),
        image_size: getImageSizeOption(dimensions),
        max_images: count,
        prompt,
      });
    } else {
      createResponse = await createTextToImageTask({
        image_resolution: getImageResolution(dimensions.size),
        image_size: getImageSizeOption(dimensions),
        max_images: count,
        prompt,
      });
    }

    // Handle creation errors
    if ('error' in createResponse) {
      // Pass error code along with message for special handling in UI
      const errorMessage =
        'code' in createResponse && createResponse.code
          ? `${createResponse.code}:${createResponse.error}`
          : createResponse.error;

      useAiGenerateStore.setState({ errorMessage, generationStatus: 'failed' });

      return;
    }

    const { uuid } = createResponse;

    useAiGenerateStore.setState({ generationUuid: uuid });

    // Add to history
    addPendingHistoryItem({
      count,
      dimensions,
      imageInputs: mode === 'edit' ? selectedImageInputs : undefined,
      mode,
      prompt,
      uuid,
    });

    // Poll for results
    const result = await pollTaskUntilComplete(uuid, (state) => {
      updateHistoryItem(uuid, { state });
    });

    // Update final results
    if (result.success && result.imageUrls) {
      // Update credits info first, then update store state to trigger re-render
      await getInfo({ silent: true });

      useAiGenerateStore.setState({ generatedImages: result.imageUrls, generationStatus: 'success' });
      updateHistoryItem(uuid, {
        completed_at: new Date().toISOString(),
        result_urls: result.imageUrls,
        state: 'success',
      });
    } else {
      useAiGenerateStore.setState({ errorMessage: result.error || 'Generation failed', generationStatus: 'failed' });
      updateHistoryItem(uuid, { fail_msg: result.error || 'Generation failed', state: 'fail' });
    }
  };

  return { handleGenerate };
};
