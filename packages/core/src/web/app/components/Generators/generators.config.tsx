import React from 'react';

import { BoxPlotOutlined, ExperimentOutlined, QrcodeOutlined } from '@ant-design/icons';

import dialogCaller from '@core/app/actions/dialog-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import type { ILang } from '@core/interfaces/ILang';

export interface GeneratorConfig {
  icon: React.ReactNode;
  id: string;
  onClick: () => void;
  titleKey: keyof ILang['generators'];
  visible?: boolean;
}

interface GetGeneratorsOptions {
  isMobile?: boolean;
  // add workarea for some models that might not need certain generators
  workarea?: WorkAreaModel;
}

export const getGenerators = ({ isMobile = false }: GetGeneratorsOptions = {}): GeneratorConfig[] =>
  [
    {
      icon: <BoxPlotOutlined />,
      id: 'box',
      onClick: () => dialogCaller.showBoxGen(),
      titleKey: 'box_generator',
    } as const,
    {
      icon: <QrcodeOutlined />,
      id: 'code',
      onClick: () => dialogCaller.showCodeGenerator(),
      titleKey: 'code_generator',
    } as const,
    {
      icon: <ExperimentOutlined />,
      id: 'material-test',
      onClick: () => dialogCaller.showMaterialTestGenerator(),
      titleKey: 'material_test_generator',
      visible: !isMobile,
    } as const,
  ].filter((generator) => generator.visible !== false);
