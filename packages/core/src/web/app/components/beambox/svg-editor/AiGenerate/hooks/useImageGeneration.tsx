import { createAiImageTask, pollTaskUntilComplete } from '@core/helpers/api/ai-image';
import type { StyleWithInputFields } from '@core/helpers/api/ai-image-config';
import { getInfo } from '@core/helpers/api/flux-id';
import type { IUser } from '@core/interfaces/IUser';

import type { ImageDimensions } from '../types';
import { useAiGenerateStore } from '../useAiGenerateStore';
import { objectToSnakeCase } from '../utils/caseConversion';
import { getInputFieldsForStyle } from '../utils/inputFields';

const validateRequest = ({
  currentUser,
  style,
  styles,
}: {
  currentUser: IUser | null;
  style: string;
  styles?: StyleWithInputFields[];
}): null | string => {
  const { imageInputs, inputFields } = useAiGenerateStore.getState();

  // 1. Validate User
  if (!currentUser) return 'Please log in to use AI generation.';

  // 2. Validate Image Count
  if (imageInputs.length > 10) return 'Maximum 10 images allowed';

  // 3. Validate Required Fields
  const fieldDefs = getInputFieldsForStyle(style, styles);

  // Fallback: simple description check if no fields defined
  if (fieldDefs.length === 0) {
    const description = inputFields.description || '';

    if (!description.trim() && imageInputs.length === 0) {
      return 'Please provide a prompt description or upload at least one image';
    }
  }

  // Check defined fields
  for (const field of fieldDefs) {
    const value = inputFields[field.key] || '';

    if (field.required && !value.trim()) return `"${field.label}" is required. Please fill in this field.`;

    if (field.maxLength && value.length > field.maxLength) {
      return `"${field.label}" exceeds maximum length of ${field.maxLength} characters.`;
    }
  }

  return null; // No errors
};

interface UseImageGenerationParams {
  currentUser: IUser | null;
  dimensions: ImageDimensions;
  maxImages: number;
  seed?: number;
  style: string;
  styles?: StyleWithInputFields[];
}

export const useImageGeneration = ({
  currentUser,
  dimensions,
  maxImages,
  style = 'plain',
  styles,
}: UseImageGenerationParams) => {
  const store = useAiGenerateStore(); // Access store directly
  const { addPendingHistoryItem, clearGenerationResults, imageInputs, inputFields, updateHistoryItem } = store;

  const handleGenerate = async () => {
    // 1. Validation Phase
    const validationError = validateRequest({ currentUser, style, styles });

    if (validationError) {
      useAiGenerateStore.setState({ errorMessage: validationError });

      return;
    }

    // 2. Preparation Phase
    clearGenerationResults();
    useAiGenerateStore.setState({ generationStatus: 'generating' });

    const inputs = objectToSnakeCase(inputFields) as Record<string, string>;

    // Add image counts to inputs due to new api provider doesn't strictly follow max_images param as returned image count
    inputs['image_counts'] = String(maxImages);

    const params = {
      aspect_ratio: dimensions.aspectRatio,
      image_inputs: imageInputs.map((input) => (input.type === 'file' ? input.file : input.url)),
      max_images: maxImages,
      prompt_data: { inputs, style },
      size: dimensions.size,
    };

    // 3. Execution Phase
    const createResponse = await createAiImageTask(params);

    // 4. Error Handling Phase
    if ('error' in createResponse) {
      const errorMsg =
        'code' in createResponse && createResponse.code
          ? `${createResponse.code}:${createResponse.error}`
          : createResponse.error;

      useAiGenerateStore.setState({ errorMessage: errorMsg, generationStatus: 'failed' });

      return;
    }

    // 5. Polling Phase
    const { uuid } = createResponse;

    useAiGenerateStore.setState({ generationUuid: uuid });
    addPendingHistoryItem({ dimensions, imageInputs, maxImages, uuid });

    const result = await pollTaskUntilComplete(uuid, (state) => updateHistoryItem(uuid, { state }));

    // 6. Completion Phase
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
      const failMsg = result.error || 'Generation failed';

      useAiGenerateStore.setState({ errorMessage: failMsg, generationStatus: 'failed' });
      updateHistoryItem(uuid, { fail_msg: failMsg, state: 'fail' });
    }
  };

  return { handleGenerate };
};
