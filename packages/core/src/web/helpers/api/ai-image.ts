import type { AspectRatio } from '@core/app/components/beambox/svg-editor/AiGenerate/types';

import { FLUXID_HOST } from './flux-id';

const BASE_URL = `${FLUXID_HOST}/api/ai-image`;
const CONFIG = { MAX_ATTEMPTS: 100, POLL_INTERVAL: 3000, TIMEOUT: 30000 };

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request parameters',
  401: 'API key is invalid or missing.',
  402: 'Insufficient credits.',
  404: 'Resource not found',
  422: 'Parameter validation failed.',
  429: 'Too many requests.',
  500: 'Server error.',
};

export type TaskState = 'fail' | 'pending' | 'success' | 'waiting';

export interface GenerationRequest {
  aspect_ratio: AspectRatio; // e.g., '4:3', '3:4', '16:9', '1:1'
  image_inputs?: Array<File | string>; // Optional: If present, implies 'edit' mode
  max_images: number;
  prompt_data: { inputs: Record<string, string>; style: string };
  seed?: number;
  size: '1K' | '2K' | '4K';
}

export interface AiImageGenerationData {
  aspect_ratio: AspectRatio;
  completed_at: null | string;
  cost_time: null | number;
  created_at: string;
  fail_msg: null | string;
  image_urls: string[];
  max_images: number;
  prompt_data: GenerationRequest['prompt_data'];
  result_urls: null | string[];
  seed?: number;
  size: GenerationRequest['size'];
  state: TaskState;
  task_id: null | string;
  uuid: string;
}

interface ApiResponse<T> {
  data: T;
  status: string;
}

export interface GenerationResult {
  error?: string;
  imageUrls?: string[];
  success: boolean;
}

const apiClient = async <T>(
  endpoint: string,
  // eslint-disable-next-line no-undef
  options: RequestInit = {},
): Promise<T | { code?: string; error: string }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    // Automatically handle Content-Type for JSON vs FormData
    const headers =
      options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers };

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers, signal: controller.signal });

    clearTimeout(timeoutId);

    const data = (await response.json().catch(() => ({}))) as any;

    if (!response.ok) {
      return {
        code: data.info,
        error: data.message || ERROR_MESSAGES[response.status] || 'Request failed',
      };
    }

    return data.status === 'ok' ? data : { error: data.message || 'Operation failed' };
  } catch (error) {
    clearTimeout(timeoutId);

    const msg =
      error instanceof Error ? (error.name === 'AbortError' ? 'Request timed out.' : error.message) : 'Unknown error';

    return { error: msg };
  }
};

/**
 * Creates a generation task. Automatically detects mode (edit vs text) based on input.
 */
export const createAiImageTask = async (params: GenerationRequest) => {
  const { image_inputs = [], ...rest } = params;
  const mode = image_inputs.length > 0 ? 'edit' : 'text-to-image';
  const formData = new FormData();
  const payload = { ...rest, seed: params.seed ?? Math.floor(Math.random() * 1000000) };

  // Add primitive fields
  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  });

  // Add images
  image_inputs.forEach((input) => formData.append('image_inputs', input));

  const result = await apiClient<ApiResponse<{ uuid: string }>>(`/${mode}`, {
    body: formData,
    method: 'POST',
  });

  return 'error' in result ? result : { uuid: result.data.uuid };
};

export const queryAiImageStatus = (uuid: string) =>
  apiClient<ApiResponse<AiImageGenerationData>>(`/${uuid}`, { method: 'GET' });

export const getAiImageHistory = () => apiClient<ApiResponse<AiImageGenerationData[]>>('/history', { method: 'GET' });

export const pollTaskUntilComplete = async (
  uuid: string,
  onProgress?: (state: TaskState) => void,
): Promise<GenerationResult> => {
  for (let i = 0; i < CONFIG.MAX_ATTEMPTS; i++) {
    const result = await queryAiImageStatus(uuid);

    if ('error' in result) return { error: result.error, success: false };

    const { fail_msg, result_urls, state } = result.data;

    onProgress?.(state);

    if (state === 'success') {
      return result_urls?.length
        ? { imageUrls: result_urls, success: true }
        : { error: 'No result URLs returned', success: false };
    }

    if (state === 'fail') {
      return { error: fail_msg || 'Generation failed', success: false };
    }

    await new Promise((r) => setTimeout(r, CONFIG.POLL_INTERVAL));
  }

  return { error: 'Generation timed out.', success: false };
};
