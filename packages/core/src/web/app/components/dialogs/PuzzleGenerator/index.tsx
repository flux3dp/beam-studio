import React, { useCallback, useMemo, useState } from 'react';

import { Button } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import OptionsPanel from './OptionsPanel';
import Preview from './Preview';
import { getDefaultPuzzleType, getPuzzleTypeById, PUZZLE_TYPES } from './puzzleTypes.config';
import type { ShapeType } from './shapeGenerators';
import { exportToCanvas } from './svgExport';
import type { PuzzleState, PuzzleStateUpdate } from './types';
import { createDefaultPuzzleState } from './types';
import TypeSelector from './TypeSelector';

interface PuzzleGeneratorProps {
  onClose: () => void;
}

const PuzzleGenerator = ({ onClose }: PuzzleGeneratorProps): React.JSX.Element => {
  const { generators: tGenerators, puzzle_generator: t } = useI18n();
  const isMobile = useIsMobile();

  const defaultType = getDefaultPuzzleType();
  const [state, setState] = useState<PuzzleState>(() => createDefaultPuzzleState(defaultType.id));
  const [isExporting, setIsExporting] = useState(false);

  const currentTypeConfig = useMemo(() => getPuzzleTypeById(state.typeId) ?? defaultType, [state.typeId, defaultType]);

  const puzzleDimensions = useMemo(
    () => ({ height: state.rows * state.pieceSize, width: state.columns * state.pieceSize }),
    [state.columns, state.rows, state.pieceSize],
  );

  const handleTypeChange = useCallback((typeId: ShapeType) => setState(createDefaultPuzzleState(typeId)), []);

  const handleStateChange = useCallback(
    (updates: PuzzleStateUpdate) => setState((prev) => ({ ...prev, ...updates }) as PuzzleState),
    [],
  );

  const handleNestedStateChange = useCallback(
    <K extends 'border' | 'image'>(key: K, updates: Partial<PuzzleState[K]>) =>
      setState((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }) as PuzzleState),
    [],
  );

  const handleImport = useCallback(async () => {
    setIsExporting(true);

    try {
      await exportToCanvas(state, currentTypeConfig);
      onClose();
    } catch (error) {
      console.error('Failed to export puzzle to canvas:', error);
      alertCaller.popUpError({ message: t.export_failed });
    } finally {
      setIsExporting(false);
    }
  }, [state, currentTypeConfig, onClose, t]);

  return (
    <DraggableModal
      footer={
        <div className={styles.footer}>
          <Button disabled={isExporting} onClick={onClose}>
            {t.cancel}
          </Button>
          <Button loading={isExporting} onClick={handleImport} type="primary">
            {t.import_to_canvas}
          </Button>
        </div>
      }
      maskClosable={false}
      onCancel={onClose}
      open
      title={tGenerators.puzzle_generator}
      width={isMobile ? 'calc(100vw - 32px)' : 'calc(100vw - 64px)'}
      wrapClassName={styles['modal-wrap']}
    >
      <div className={classNames(styles.container, { [styles.mobile]: isMobile })}>
        <TypeSelector currentTypeId={state.typeId} onTypeChange={handleTypeChange} puzzleTypes={PUZZLE_TYPES} />
        <Preview
          dimensions={puzzleDimensions}
          onViewModeChange={(viewMode) => handleStateChange({ viewMode })}
          state={state}
          typeConfig={currentTypeConfig}
          viewMode={state.viewMode}
        />
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
