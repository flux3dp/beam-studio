import React from 'react';

import {
  AppstoreOutlined,
  CameraOutlined,
  EditOutlined,
  ExperimentOutlined,
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
export const getCategoryConfigs = (lang: { settings: { groups: Record<string, string> } }): SettingCategoryConfig[] => [
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
    icon: <AppstoreOutlined />,
    key: SettingCategory.MODULE,
    label: lang.settings.groups.modules,
    visible: alwaysVisible,
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
