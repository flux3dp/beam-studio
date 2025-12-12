import i18n from '@core/helpers/i18n';

import { axiosFluxId, FLUXID_HOST } from './flux-id';
import type { ResponseWithError } from './flux-id';

// Backend Interfaces
interface RawInputField {
  is_active: boolean;
  key: string;
  label: string;
  max_length: null | number;
  min_length: null | number;
  order: number;
  placeholder: string;
  required: boolean;
  validation_message: string;
}

interface RawStyle {
  display_name: string;
  id: string;
  input_fields: RawInputField[];
  is_active: boolean;
  modes: Array<'edit' | 'text-to-image'>;
  order: number;
  preview_image: string;
  tags: string[];
}

interface RawCategory {
  display_name: string;
  id: string;
  is_active: boolean;
  order: number;
  preview_image: string;
  tags: string[];
}

interface ConfigResponse<T> {
  data: T[];
  status: 'ok';
}

// Frontend Interfaces
interface StyleWithoutInputFields {
  description?: string;
  displayName: string;
  id: string;
  modes: Array<'edit' | 'text-to-image'>;
  previewImage?: string;
  tags: string[];
}

export interface Category {
  description?: string;
  displayName: string;
  id: string;
  previewImage?: string;
  tags: string[];
}

export interface InputField {
  key: string;
  label: string;
  maxLength?: number;
  placeholder: string;
  required: boolean;
}

export interface Style extends StyleWithoutInputFields {
  inputFields: InputField[];
}

const API_BASE = `${FLUXID_HOST}/api/ai-image`;
const FALLBACK_IMAGE = 'https://s3.ap-northeast-1.amazonaws.com/flux-id/ai-styles/customize/en-us.png';

export const getLocale = (): string => {
  const lang = i18n.getActiveLang();
  // Map to backend locale codes if necessary
  const map: Record<string, string> = { en: 'en-us' };

  return map[lang] || lang || 'en-us';
};

const mapCategory = (c: RawCategory): Category => ({
  displayName: c.display_name,
  id: c.id,
  previewImage: c.preview_image || FALLBACK_IMAGE,
  tags: c.tags,
});

const mapInputField = (f: RawInputField): InputField => ({
  key: f.key,
  label: f.label,
  maxLength: f.max_length || undefined,
  placeholder: f.placeholder,
  required: f.required,
});

const mapStyle = (s: RawStyle): Style => ({
  displayName: s.display_name,
  id: s.id,
  inputFields: s.input_fields.map(mapInputField),
  modes: s.modes,
  previewImage: s.preview_image || FALLBACK_IMAGE,
  tags: s.tags,
});

/**
 * Generic fetcher to reduce boilerplate for config endpoints
 */
async function fetchConfig<T>(endpoint: string, params: Record<string, any> = {}): Promise<T[] | { error: string }> {
  try {
    const response = (await axiosFluxId.get(`${API_BASE}/${endpoint}`, {
      params: { is_active: true, locale: getLocale(), ...params },
      withCredentials: true,
    })) as ResponseWithError<ConfigResponse<T>>;

    if (response.error) return { error: response.error.message || `Failed to fetch ${endpoint}` };

    if (response.status === 200 && response.data.status === 'ok') return response.data.data;

    return { error: `Failed to fetch ${endpoint}` };
  } catch (error) {
    console.error(`[AI Config] ${endpoint} error:`, error);

    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

const fetchStyles = (params = {}) => fetchConfig<RawStyle>('styles', params);
const fetchCategories = (params = {}) => fetchConfig<RawCategory>('categories', params);

export const fetchAllAiConfig = async () => {
  const [stylesData, categoriesData] = await Promise.all([fetchStyles(), fetchCategories()]);

  if ('error' in stylesData) return stylesData;

  if ('error' in categoriesData) return categoriesData;

  return {
    categories: categoriesData.toSorted((a, b) => a.order - b.order).map(mapCategory),
    styles: stylesData.toSorted((a, b) => a.order - b.order).map(mapStyle),
  };
};
