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

import { SettingsIcons } from '@core/app/icons/Settings/SettingsIcons';
import isDev from '@core/helpers/is-dev';
import isWeb from '@core/helpers/is-web';
import type { ILang } from '@core/interfaces/ILang';

import type { SettingCategoryConfig } from './types';
import { SettingCategory } from './types';

interface GetCategoryConfigsOptions {
  isMobile?: boolean;
}
//
// Category configurations with icons and visibility rules
export const getCategoryConfigs = (lang: ILang, options: GetCategoryConfigsOptions = {}): SettingCategoryConfig[] => {
  const { isMobile = false } = options;

  return [
    {
      icon: <SettingOutlined />,
      key: SettingCategory.GENERAL,
      label: lang.settings.groups.general,
    },
    {
      icon: <WifiOutlined />,
      key: SettingCategory.CONNECTION,
      label: lang.settings.groups.connection,
    },
    {
      icon: <SaveOutlined />,
      key: SettingCategory.AUTOSAVE,
      label: lang.settings.groups.autosave,
      visible: !isWeb(),
    },
    {
      icon: <CameraOutlined />,
      key: SettingCategory.CAMERA,
      label: lang.settings.groups.camera,
    },
    {
      icon: <EditOutlined />,
      key: SettingCategory.EDITOR,
      label: lang.settings.groups.editor,
    },
    {
      icon: <ScanOutlined />,
      key: SettingCategory.ENGRAVING,
      label: lang.settings.groups.engraving,
    },
    {
      icon: <ShareAltOutlined />,
      key: SettingCategory.PATH,
      label: lang.settings.groups.path,
    },
    {
      icon: <AppstoreOutlined />,
      key: SettingCategory.MODULE,
      label: lang.settings.groups.modules,
    },
    {
      icon: <LockOutlined />,
      key: SettingCategory.PRIVACY,
      label: lang.settings.groups.privacy,
    },
    {
      icon: <ExperimentOutlined />,
      key: SettingCategory.EXPERIMENTAL,
      label: 'Experimental',
      visible: isDev(),
    },
    {
      icon: <SettingsIcons.Reset height={14} width={14} />,
      key: SettingCategory.RESET,
      label: lang.global.editing.reset,
      visible: isMobile,
    },
  ];
};
