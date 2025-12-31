import React from 'react';

import {
  AppstoreOutlined,
  CameraOutlined,
  EditOutlined,
  ExperimentOutlined,
  FontSizeOutlined,
  LockOutlined,
  SaveOutlined,
  ScanOutlined,
  SettingOutlined,
  ShareAltOutlined,
  WifiOutlined,
} from '@ant-design/icons';

import isDev from '@core/helpers/is-dev';
import isWeb from '@core/helpers/is-web';

import type { SettingCategoryConfig } from './types';
import { SettingCategory } from './types';

// Helper functions for conditional visibility
const isNotWeb = (): boolean => !isWeb();
const alwaysVisible = (): boolean => true;

// Category configurations with icons and visibility rules
export const getCategoryConfigs = (
  lang: { settings: { groups: Record<string, string> } },
  selectedModel?: string,
): SettingCategoryConfig[] => {
  const isAdorModel = selectedModel === 'ado1';
  const isBeamo2Model = selectedModel === 'fbm2';
  const isBB2Model = selectedModel === 'fbb2';

  return [
    {
      icon: <SettingOutlined />,
      key: SettingCategory.GENERAL,
      label: lang.settings.groups.general,
      visible: alwaysVisible,
    },
    {
      icon: <WifiOutlined />,
      key: SettingCategory.CONNECTION,
      label: lang.settings.groups.connection,
      visible: alwaysVisible,
    },
    {
      icon: <SaveOutlined />,
      key: SettingCategory.AUTOSAVE,
      label: lang.settings.groups.autosave,
      visible: isNotWeb,
    },
    {
      icon: <CameraOutlined />,
      key: SettingCategory.CAMERA,
      label: lang.settings.groups.camera,
      visible: alwaysVisible,
    },
    {
      icon: <EditOutlined />,
      key: SettingCategory.EDITOR,
      label: lang.settings.groups.editor,
      visible: alwaysVisible,
    },
    {
      icon: <ScanOutlined />,
      key: SettingCategory.ENGRAVING,
      label: lang.settings.groups.engraving,
      visible: alwaysVisible,
    },
    {
      icon: <ShareAltOutlined />,
      key: SettingCategory.PATH,
      label: lang.settings.groups.path,
      visible: alwaysVisible,
    },
    {
      icon: <FontSizeOutlined />,
      key: SettingCategory.TEXT_TO_PATH,
      label: lang.settings.groups.text_to_path,
      visible: alwaysVisible,
    },
    {
      icon: <AppstoreOutlined />,
      key: SettingCategory.MODULE,
      label: lang.settings.groups.modules,
      visible: alwaysVisible,
    },
    {
      icon: <AppstoreOutlined />,
      key: SettingCategory.ADOR_MODULE,
      label: lang.settings.groups.ador_modules,
      visible: () => isAdorModel,
    },
    {
      icon: <AppstoreOutlined />,
      key: SettingCategory.BEAMO2_MODULE,
      label: lang.settings.groups.beamo2_modules,
      visible: () => isBeamo2Model,
    },
    {
      icon: <AppstoreOutlined />,
      key: SettingCategory.BB2_SETTINGS,
      label: 'Beambox II',
      visible: () => isBB2Model,
    },
    {
      icon: <LockOutlined />,
      key: SettingCategory.PRIVACY,
      label: lang.settings.groups.privacy,
      visible: alwaysVisible,
    },
    {
      icon: <ExperimentOutlined />,
      key: SettingCategory.EXPERIMENTAL,
      label: 'Experimental',
      visible: isDev,
    },
  ];
};
