import React from 'react';

import { BoxPlotOutlined, ExperimentOutlined, QrcodeOutlined } from '@ant-design/icons';

import dialogCaller from '@core/app/actions/dialog-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

export interface GeneratorConfig {
  icon: React.ReactNode;
  id: string;
  onClick: () => void;
  titleKey: 'box_generator' | 'code_generator' | 'material_test_generator';
  visible?: boolean;
}

interface GetGeneratorsOptions {
  isMobile?: boolean;
  // add workarea for some models that might not need certain generators
  workarea?: WorkAreaModel;
}

// Alphabetically ordered: Box, Code, Material Test
export const getGenerators = ({ isMobile = false }: GetGeneratorsOptions = {}): GeneratorConfig[] => {
  return [
    {
      icon: <BoxPlotOutlined />,
      id: 'box',
      onClick: () => dialogCaller.showBoxGen(),
      titleKey: 'box_generator',
    },
    {
      icon: <QrcodeOutlined />,
      id: 'code',
      onClick: () => dialogCaller.showCodeGenerator(),
      titleKey: 'code_generator',
    },
    {
      icon: <ExperimentOutlined />,
      id: 'material-test',
      onClick: () => dialogCaller.showMaterialTestGenerator(),
      titleKey: 'material_test_generator',
      visible: !isMobile,
    },
  ];
};
