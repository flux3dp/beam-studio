import { FLUXID_HOST } from './flux-id';

const TEXT_TO_IMAGE_URL = `${FLUXID_HOST}/api/ai-image/text-to-image`;
const EDIT_IMAGE_URL = `${FLUXID_HOST}/api/ai-image/edit`;
const AI_IMAGE_STATUS_URL = `${FLUXID_HOST}/api/ai-image`;
const AI_IMAGE_HISTORY_URL = `${FLUXID_HOST}/api/ai-image/history`;
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 100; // 5 minutes max (100 * 3s = 300s)
const TIMEOUT_MS = 30000; // 30 seconds

// Type Definitions
export type ImageSizeOption =
  | 'landscape_3_2'
  | 'landscape_4_3'
  | 'landscape_16_9'
  | 'landscape_21_9'
  | 'portrait_3_2'
  | 'portrait_4_3'
  | 'portrait_16_9'
  | 'square'
  | 'square_hd';

export type ImageResolution = '1K' | '2K' | '4K';

// Request payload for creating text-to-image task
export interface TextToImageRequest {
  image_resolution?: ImageResolution;
  image_size?: ImageSizeOption;
  max_images?: number;
  prompt: string;
  seed?: number;
}

// Request payload for creating image edit task
export interface ImageEditRequest {
  image_resolution?: ImageResolution;
  image_size?: ImageSizeOption;
  imageFiles?: File[]; // Optional: new image files to upload
  imageUrls?: string[]; // Optional: existing S3 URLs from history
  max_images?: number;
  prompt: string;
  seed?: number;
}

// State of AI generation task
export type TaskState = 'fail' | 'pending' | 'success' | 'waiting';

// AI Image Generation data from Django API
export interface AiImageGenerationData {
  completed_at: null | string;
  cost_time: null | number;
  created_at: string;
  fail_msg: null | string;
  image_resolution: ImageResolution;
  image_size: ImageSizeOption;
  image_urls?: string[]; // Input images for edit mode (S3 URLs)
  max_images: number;
  model_type: string;
  prompt: string;
  result_urls: null | string[];
  seed: null | number;
  state: TaskState;
  task_id: null | string;
  uuid: string;
}

// Response from creating a text-to-image task
export interface TextToImageResponse {
  data: AiImageGenerationData;
  status: string;
}

// Response from querying task status
export interface AiImageStatusResponse {
  data: AiImageGenerationData;
  status: string;
}

// Response from querying generation history
export interface AiImageHistoryResponse {
  data: AiImageGenerationData[];
  status: string;
}

// Result returned by pollTaskUntilComplete
export interface GenerationResult {
  error?: string;
  imageUrls?: string[];
  success: boolean;
}

// Error Messages
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request parameters',
  401: 'API key is invalid or missing. Please check your API key.',
  402: 'Insufficient credits. Please top up your account.',
  404: 'Resource not found',
  422: 'Parameter validation failed. Please check your inputs.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
};

/**
 * Helper to make fetch requests with timeout and error handling
 */
const fetchWithTimeout = async (
  url: string,
  options: {
    body?: string;
    headers?: Record<string, string>;
    method?: string;
  } = {},
  timeout = TIMEOUT_MS,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return response;
  } catch (_error) {
    clearTimeout(timeoutId);
    throw _error;
  }
};

/**
 * Create a text-to-image generation task
 */
export const createTextToImageTask = async ({
  image_resolution = '1K',
  image_size = 'square_hd',
  max_images = 1,
  prompt,
  seed = Math.floor(Math.random() * 1000000),
}: TextToImageRequest): Promise<{ error: string } | { uuid: string }> => {
  try {
    const response = await fetchWithTimeout(TEXT_TO_IMAGE_URL, {
      body: JSON.stringify({ image_resolution, image_size, max_images, prompt, seed }),
      method: 'POST',
    });

    if (!response.ok) {
      if (ERROR_MESSAGES[response.status]) {
        return { error: ERROR_MESSAGES[response.status] };
      }

      const errorData = (await response.json().catch(() => ({}))) as { message?: string };

      return { error: errorData.message || 'Failed to create task' };
    }

    const data = (await response.json()) as TextToImageResponse;

    if (data.status === 'ok') {
      return { uuid: data.data.uuid };
    }

    return { error: 'Failed to create task' };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: 'Request timed out. Please try again.' };
      }

      return { error: error.message || 'Network error occurred' };
    }

    return { error: 'An unexpected error occurred' };
  }
};

/**
 * Create an image edit task
 * This sends images as FormData along with other parameters
 * Supports both new file uploads (imageFiles) and existing S3 URLs (imageUrls)
 */
export const createImageEditTask = async ({
  image_resolution = '1K',
  image_size = 'square_hd',
  imageFiles,
  imageUrls,
  max_images = 1,
  prompt,
  seed = Math.floor(Math.random() * 1000000),
}: ImageEditRequest): Promise<{ error: string } | { uuid: string }> => {
  try {
    // Build FormData for multipart/form-data request
    const formData = new FormData();

    formData.append('prompt', prompt);
    formData.append('image_resolution', image_resolution);
    formData.append('image_size', image_size);
    formData.append('max_images', max_images.toString());
    formData.append('seed', seed.toString());

    // Append new image files if provided
    if (imageFiles) {
      imageFiles.forEach((file) => {
        formData.append('image_files', file);
      });
    }

    // Append existing S3 URLs if provided
    if (imageUrls) {
      imageUrls.forEach((url) => {
        formData.append('image_urls', url);
      });
    }

    // Fetch without Content-Type header - browser will set it with boundary
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(EDIT_IMAGE_URL, {
        body: formData,
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (ERROR_MESSAGES[response.status]) {
          return { error: ERROR_MESSAGES[response.status] };
        }

        const errorData = (await response.json().catch(() => ({}))) as { message?: string };

        return { error: errorData.message || 'Failed to create edit task' };
      }

      const data = (await response.json()) as TextToImageResponse;

      if (data.status === 'ok') {
        return { uuid: data.data.uuid };
      }

      return { error: 'Failed to create edit task' };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: 'Request timed out. Please try again.' };
      }

      return { error: error.message || 'Network error occurred' };
    }

    return { error: 'An unexpected error occurred' };
  }
};

/**
 * Query AI image generation status by UUID
 */
export const queryAiImageStatus = async (uuid: string): Promise<AiImageStatusResponse | { error: string }> => {
  try {
    const response = await fetchWithTimeout(`${AI_IMAGE_STATUS_URL}/${uuid}`, { method: 'GET' });

    // Handle HTTP error status codes
    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'Generation not found' };
      }

      if (ERROR_MESSAGES[response.status]) {
        return { error: ERROR_MESSAGES[response.status] };
      }

      const errorData = (await response.json().catch(() => ({}))) as { message?: string };

      return { error: errorData.message || 'Failed to query task status' };
    }

    const data = (await response.json()) as AiImageStatusResponse;

    if (data.status === 'ok') {
      return data;
    }

    return { error: 'Failed to query task status' };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: 'Request timed out. Please try again.' };
      }

      return { error: error.message || 'Network error occurred' };
    }

    return { error: 'An unexpected error occurred' };
  }
};

/**
 * Poll task status until completion
 */
export const pollTaskUntilComplete = async (
  uuid: string,
  onProgress?: (state: TaskState) => void,
): Promise<GenerationResult> => {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    const result = await queryAiImageStatus(uuid);

    if ('error' in result) {
      return { error: result.error, success: false };
    }

    const { fail_msg, result_urls, state } = result.data;

    // Notify progress
    if (onProgress) {
      onProgress(state);
    }

    // Success state
    if (state === 'success') {
      if (result_urls && result_urls.length > 0) {
        return {
          imageUrls: result_urls,
          success: true,
        };
      }

      return {
        error: 'No result URLs returned',
        success: false,
      };
    }

    // Fail state
    if (state === 'fail') {
      return {
        error: fail_msg || 'Generation failed',
        success: false,
      };
    }

    // Still waiting - continue polling
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    attempts++;
  }

  return { error: 'Generation timed out. Please try again.', success: false };
};

/**
 * Query user's AI image generation history
 */
export const getAiImageHistory = async (): Promise<AiImageHistoryResponse | { error: string }> => {
  try {
    const response = await fetchWithTimeout(AI_IMAGE_HISTORY_URL, { method: 'GET' });

    // Handle HTTP error status codes
    if (!response.ok) {
      if (ERROR_MESSAGES[response.status]) {
        return { error: ERROR_MESSAGES[response.status] };
      }

      const errorData = (await response.json().catch(() => ({}))) as { message?: string };

      return { error: errorData.message || 'Failed to fetch generation history' };
    }

    const data = (await response.json()) as AiImageHistoryResponse;

    if (data.status === 'ok') {
      return data;
    }

    return { error: 'Failed to fetch generation history' };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: 'Request timed out. Please try again.' };
      }

      return { error: error.message || 'Network error occurred' };
    }

    return { error: 'An unexpected error occurred' };
  }
};
