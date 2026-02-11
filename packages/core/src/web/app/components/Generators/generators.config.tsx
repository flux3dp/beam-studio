import React from 'react';

import dialogCaller from '@core/app/actions/dialog-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import GeneratorIcons from '@core/app/icons/generator/GeneratorIcons';
import type { ILang } from '@core/interfaces/ILang';

import { showPuzzleGenerator } from '../dialogs/PuzzleGenerator';

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
      icon: <GeneratorIcons.Box />,
      id: 'box',
      onClick: () => dialogCaller.showBoxGen(),
      titleKey: 'box_generator',
    } as const,
    {
      icon: <GeneratorIcons.Code />,
      id: 'code',
      onClick: () => dialogCaller.showCodeGenerator(),
      titleKey: 'code_generator',
    } as const,
    {
      icon: <GeneratorIcons.Puzzle />,
      id: 'puzzle',
      onClick: () => showPuzzleGenerator(),
      titleKey: 'puzzle_generator',
    } as const,
    {
      icon: <GeneratorIcons.Material />,
      id: 'material-test',
      onClick: () => dialogCaller.showMaterialTestGenerator(),
      titleKey: 'material_test_generator',
      visible: !isMobile,
    } as const,
  ].filter((generator) => generator.visible !== false);
