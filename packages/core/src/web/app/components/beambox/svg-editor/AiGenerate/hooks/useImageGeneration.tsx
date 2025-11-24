import { createImageEditTask, createTextToImageTask, pollTaskUntilComplete } from '@core/helpers/api/ai-image';
import { getInfo } from '@core/helpers/api/flux-id';
import type { IUser } from '@core/interfaces/IUser';

import type { ImageDimensions } from '../types';
import { useAiGenerateStore } from '../useAiGenerateStore';
import { objectToSnakeCase } from '../utils/caseConversion';
import { getImageResolution, getImageSizeOption } from '../utils/dimensions';

interface UseImageGenerationParams {
  count: number;
  currentUser: IUser | null;
  dimensions: ImageDimensions;
  seed?: number;
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
  seed,
  stylePreset,
}: UseImageGenerationParams): UseImageGenerationReturn => {
  const { addPendingHistoryItem, clearGenerationResults, imageInputs, inputFields, updateHistoryItem } =
    useAiGenerateStore();

  const handleGenerate = async () => {
    // Check prompt
    const description = inputFields.description || '';

    if (!description.trim() && imageInputs.length === 0) {
      useAiGenerateStore.setState({ errorMessage: 'Please provide a prompt description or upload at least one image' });

      return;
    }

    if (imageInputs.length > 10) {
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

    // Convert inputFields to snake_case for backend
    const inputs = objectToSnakeCase(inputFields) as Record<string, string>;

    // Create task based on mode
    let createResponse: { error: string } | { uuid: string };

    if (imageInputs.length > 0) {
      // Convert ImageInput array to File | string array for API
      const imageInputsForApi = imageInputs.map((input) => (input.type === 'file' ? input.file : input.url));

      createResponse = await createImageEditTask({
        image_inputs: imageInputsForApi,
        image_resolution: getImageResolution(dimensions),
        image_size: getImageSizeOption(dimensions),
        max_images: count,
        prompt_data: { inputs, style: stylePreset || 'plain' },
        seed,
      });
    } else {
      createResponse = await createTextToImageTask({
        image_resolution: getImageResolution(dimensions),
        image_size: getImageSizeOption(dimensions),
        max_images: count,
        prompt_data: { inputs, style: stylePreset || 'plain' },
        seed,
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
      imageInputs,
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
