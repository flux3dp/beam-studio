import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import { createAiImageTask, pollTaskUntilComplete } from '@core/helpers/api/ai-image';
import type { Style } from '@core/helpers/api/ai-image-config';
import { getInfo } from '@core/helpers/api/flux-id';
import i18n from '@core/helpers/i18n';
import type { IUser } from '@core/interfaces/IUser';

import { AI_COST_PER_IMAGE } from '../types';
import { useAiGenerateStore } from '../useAiGenerateStore';
import { objectToSnakeCase } from '../utils/caseConversion';
import { getInputFieldsForStyle } from '../utils/inputFields';

const validateRequest = ({
  style,
  styles,
  user,
}: {
  style: string;
  styles?: Style[];
  user: IUser | null;
}): null | string => {
  const t = i18n.lang.beambox.ai_generate;
  const { imageInputs, inputFields } = useAiGenerateStore.getState();

  // 1. Validate User
  if (!user) return t.validation.login_required;

  // 2. Validate Image Count
  if (imageInputs.length > 10) return sprintf(t.validation.max_images, 10);

  // 3. Validate Required Fields
  const fieldDefs = getInputFieldsForStyle(style, styles);

  // Fallback: simple description check if no fields defined
  if (fieldDefs.length === 0) {
    const description = inputFields.description || '';

    if (!description.trim() && imageInputs.length === 0) {
      return t.validation.description_or_image_required;
    }
  }

  // Check defined fields
  for (const field of fieldDefs) {
    const value = inputFields[field.key] || '';

    if (field.required && !value.trim()) {
      return sprintf(t.validation.field_required, field.label);
    }

    if (field.maxLength && value.length > field.maxLength) {
      return sprintf(t.validation.field_exceeds_max_length, field.label, String(field.maxLength));
    }
  }

  return null; // No errors
};

interface UseImageGenerationParams {
  style: string;
  styles?: Style[];
  user: IUser | null;
}

export const useImageGeneration = ({ style = 'customize', styles, user }: UseImageGenerationParams) => {
  const {
    clearGenerationResults,
    dimensions,
    imageInputs,
    inputFields,
    loadHistory,
    maxImages,
    setState,
    updateHistoryItem,
  } = useAiGenerateStore();

  const handleGenerate = async () => {
    if (!user) {
      dialogCaller.showLoginDialog();

      return;
    }

    // Validation
    const validationError = validateRequest({ style, styles, user });

    if (validationError) {
      setState({ errorMessage: validationError });

      return;
    }

    // Credit Check
    if (!user || user.info.credit < maxImages * AI_COST_PER_IMAGE) {
      alertCaller.popUpCreditAlert({
        available: user?.info.credit || 0,
        required: String(AI_COST_PER_IMAGE * maxImages),
      });

      return;
    }

    // Preparation
    clearGenerationResults();
    setState({ generationStatus: 'generating' });

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

    // Execution
    const createResponse = await createAiImageTask(params);

    await loadHistory();

    // Error Handling
    if ('error' in createResponse) {
      const errorMsg =
        'code' in createResponse && createResponse.code
          ? `${createResponse.code}:${createResponse.error}`
          : createResponse.error;

      setState({ errorMessage: errorMsg, generationStatus: 'failed' });

      return;
    }

    // Polling
    const { uuid } = createResponse;

    setState({ generationUuid: uuid });

    const result = await pollTaskUntilComplete(uuid, (state) => updateHistoryItem(uuid, { state }));

    // Completion Phase
    if (result.success && result.imageUrls) {
      // Update credits info first, then update store state to trigger re-render
      await getInfo({ silent: true });
      setState({ generatedImages: result.imageUrls, generationStatus: 'success' });
      updateHistoryItem(uuid, {
        completed_at: new Date().toISOString(),
        result_urls: result.imageUrls,
        state: 'success',
      });
    } else {
      const failMsg = result.error || i18n.lang.beambox.ai_generate.error.generation_failed;

      setState({ errorMessage: failMsg, generationStatus: 'failed' });
      updateHistoryItem(uuid, { fail_msg: failMsg, state: 'fail' });
    }
  };

  return { handleGenerate };
};
