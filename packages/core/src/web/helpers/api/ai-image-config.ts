import i18n from '@core/helpers/i18n';

import { axiosFluxId, FLUXID_HOST } from './flux-id';
import type { ResponseWithError } from './flux-id';

// Backend Interfaces
export interface InputField {
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

export interface Style {
  display_name: string;
  id: string;
  input_fields: InputField[];
  is_active: boolean;
  modes: Array<'edit' | 'text-to-image'>;
  order: number;
  preview_image: string;
  tags: string[];
}

export interface Category {
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
export interface MappedStyle {
  description?: string;
  displayName: string;
  id: string;
  modes: Array<'edit' | 'text-to-image'>;
  previewImage?: string;
  tags: string[];
}

export interface MappedCategory {
  description?: string;
  displayName: string;
  id: string;
  previewImage?: string;
  tags: string[];
}

export interface MappedInputField {
  key: string;
  label: string;
  maxLength?: number;
  placeholder: string;
  required: boolean;
}

export interface StyleWithInputFields extends MappedStyle {
  inputFields: MappedInputField[];
}

const API_BASE = `${FLUXID_HOST}/api/ai-image`;
const FALLBACK_IMAGE = 'https://picsum.photos/id/80/80';

export const getLocale = (): string => {
  const lang = i18n.getActiveLang();
  const map: Record<string, string> = { en: 'en-us' };

  return map[lang] || lang || 'en-us';
};

const mapStyle = (s: Style): MappedStyle => ({
  displayName: s.display_name,
  id: s.id,
  modes: s.modes,
  previewImage: s.preview_image || FALLBACK_IMAGE,
  tags: s.tags,
});

const mapCategory = (c: Category): MappedCategory => ({
  displayName: c.display_name,
  id: c.id,
  previewImage: c.preview_image || FALLBACK_IMAGE,
  tags: c.tags,
});

const mapInputField = (f: InputField): MappedInputField => ({
  key: f.key,
  label: f.label,
  maxLength: f.max_length || undefined,
  placeholder: f.placeholder,
  required: f.required,
});

const mapStyleWithFields = (s: Style): StyleWithInputFields => ({
  ...mapStyle(s),
  inputFields: s.input_fields.map(mapInputField),
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

const fetchStyles = (params = {}) => fetchConfig<Style>('styles', params);
const fetchCategories = (params = {}) => fetchConfig<Category>('categories', params);

export const fetchAllAiConfig = async () => {
  const [stylesData, categoriesData] = await Promise.all([fetchStyles(), fetchCategories()]);

  if ('error' in stylesData) return stylesData;

  if ('error' in categoriesData) return categoriesData;

  const styles = stylesData.toSorted((a, b) => a.order - b.order);
  const categories = categoriesData.toSorted((a, b) => a.order - b.order);

  return {
    categories: categories.map(mapCategory),
    rawData: { categories, styles },
    styles: styles.map(mapStyleWithFields),
  };
};

export const getInputFieldsForStyle = async (styleId: string) => {
  const styles = await fetchStyles();

  if ('error' in styles) return styles;

  const style = styles.find((s) => s.id === styleId);

  if (!style) return { error: `Style ${styleId} not found` };

  return { fields: style.input_fields.map(mapInputField) };
};
