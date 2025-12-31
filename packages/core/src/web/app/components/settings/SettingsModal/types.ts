import type { ReactNode } from 'react';

import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import type { AutoSaveConfig } from '@core/interfaces/AutoSaveConfig';

export enum SettingCategory {
  ADOR_MODULE = 'adorModule',
  AUTOSAVE = 'autosave',
  BB2_SETTINGS = 'bb2Settings',
  BEAMO2_MODULE = 'beamo2Module',
  CAMERA = 'camera',
  CONNECTION = 'connection',
  EDITOR = 'editor',
  ENGRAVING = 'engraving',
  EXPERIMENTAL = 'experimental',
  GENERAL = 'general',
  MODULE = 'module',
  PATH = 'path',
  PRIVACY = 'privacy',
  TEXT_TO_PATH = 'textToPath',
}

export interface SettingCategoryConfig {
  icon: ReactNode;
  key: SettingCategory;
  label: string;
  visible?: () => boolean;
}

export interface CommonSettingProps {
  changeActiveLang: (value: string) => void;
  editingAutosaveConfig: AutoSaveConfig;
  setEditingAutosaveConfig: (config: AutoSaveConfig) => void;
  setWarnings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  supportedLangs: Record<string, string>;
  unitInputProps: Partial<SettingUnitInputProps>;
  warnings: Record<string, string>;
}
