import React, { useCallback, useMemo, useState } from 'react';

import { Button } from 'antd';
import classNames from 'classnames';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import OptionsPanel from './OptionsPanel';
import Preview from './Preview';
import { getDefaultPuzzleType, getPuzzleTypeById, PUZZLE_TYPES } from './puzzleTypes.config';
import { exportToCanvas } from './svgExport';
import type { PuzzleState } from './types';
import { createDefaultPuzzleState } from './types';
import TypeSelector from './TypeSelector';

interface Props {
  onClose: () => void;
}

const PuzzleGenerator = ({ onClose }: Props): React.JSX.Element => {
  const { generators: tGenerators, puzzle_generator: t } = useI18n();
  const isMobile = useIsMobile();

  // Initialize state with default puzzle type
  const defaultType = getDefaultPuzzleType();
  const [state, setState] = useState<PuzzleState>(() => createDefaultPuzzleState(defaultType.id));

  // Get current puzzle type config
  const currentTypeConfig = useMemo(() => getPuzzleTypeById(state.typeId) ?? defaultType, [state.typeId, defaultType]);

  // Calculate puzzle dimensions for display
  const puzzleDimensions = useMemo(() => {
    const width = state.columns * state.pieceSize;
    const height = state.rows * state.pieceSize;

    return { height, width };
  }, [state.columns, state.rows, state.pieceSize]);

  // Handle type change - reset to defaults for new type
  const handleTypeChange = useCallback((typeId: string) => {
    setState(createDefaultPuzzleState(typeId));
  }, []);

  // Handle state updates (partial updates)
  const handleStateChange = useCallback((updates: Partial<PuzzleState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Handle nested state updates (for image and border groups)
  const handleNestedStateChange = useCallback(
    <K extends 'border' | 'image'>(key: K, updates: Partial<PuzzleState[K]>) => {
      setState((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...updates },
      }));
    },
    [],
  );

  // Handle import to canvas
  const handleImport = useCallback(async () => {
    try {
      await exportToCanvas(state, currentTypeConfig);
      onClose();
    } catch (error) {
      console.error('Error exporting puzzle to canvas:', error);
    }
  }, [state, currentTypeConfig, onClose]);

  return (
    <DraggableModal
      footer={
        <div className={styles.footer}>
          <Button onClick={onClose}>{t.cancel ?? 'Cancel'}</Button>
          <Button onClick={handleImport} type="primary">
            {t.import_to_canvas ?? 'Import to Canvas'}
          </Button>
        </div>
      }
      onCancel={onClose}
      open
      title={tGenerators.puzzle_generator ?? 'Puzzle Generator'}
      width={isMobile ? 'calc(100vw - 32px)' : 'min(1000px, calc(100vw - 32px))'}
      wrapClassName={styles['modal-wrap']}
    >
      <div className={classNames(styles.container, { [styles.mobile]: isMobile })}>
        {/* Left sidebar - Type selector */}
        <TypeSelector currentTypeId={state.typeId} onTypeChange={handleTypeChange} puzzleTypes={PUZZLE_TYPES} />

        {/* Center - Preview area */}
        <Preview
          dimensions={puzzleDimensions}
          onViewModeChange={(viewMode) => handleStateChange({ viewMode })}
          state={state}
          typeConfig={currentTypeConfig}
          viewMode={state.viewMode}
        />

        {/* Right panel - Options */}
        <OptionsPanel
          onNestedStateChange={handleNestedStateChange}
          onStateChange={handleStateChange}
          state={state}
          typeConfig={currentTypeConfig}
        />
      </div>
    </DraggableModal>
  );
};

export const showPuzzleGenerator = (onClose: () => void = () => {}): void => {
  if (isIdExist('puzzle-generator')) {
    return;
  }

  addDialogComponent(
    'puzzle-generator',
    <PuzzleGenerator
      onClose={() => {
        popDialogById('puzzle-generator');
        onClose();
      }}
    />,
  );
};

export default PuzzleGenerator;
