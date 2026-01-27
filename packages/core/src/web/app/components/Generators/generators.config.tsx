import React from 'react';

import { BoxPlotOutlined, ExperimentOutlined, QrcodeOutlined } from '@ant-design/icons';

import dialogCaller from '@core/app/actions/dialog-caller';

export interface GeneratorConfig {
  icon: React.ReactNode;
  id: string;
  onClick: () => void;
  titleKey: 'box_generator' | 'code_generator' | 'material_test_generator';
  visible?: boolean;
}

interface GetGeneratorsOptions {
  isMobile?: boolean;
}

// Alphabetically ordered: Box, Code, Material Test
export const getGenerators = (options: GetGeneratorsOptions = {}): GeneratorConfig[] => {
  const { isMobile = false } = options;

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
