import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Button } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import alertConstants from '@core/app/constants/alert-constants';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import OptionsPanel from './components/OptionsPanel';
import Preview from './components/Preview';
import TypeSelector from './components/TypeSelector';
import type { ViewMode } from './constants';
import { exportToCanvas } from './geometry';
import styles from './index.module.scss';
import { getDefaultPuzzleType, getPuzzleTypeById, PUZZLE_TYPES } from './puzzleTypes.config';
import type { NestedStateKey, PuzzleGeometry, PuzzleState, PuzzleStateUpdate, ShapeType } from './types';
import { createDefaultPuzzleState } from './types';

const DIALOG_ID = 'puzzle-generator';

interface PuzzleGeneratorProps {
  onClose: () => void;
}

const PuzzleGenerator = ({ onClose }: PuzzleGeneratorProps): React.JSX.Element => {
  const { generators: tGenerators, puzzle_generator: t } = useI18n();
  const isMobile = useIsMobile();

  const defaultType = getDefaultPuzzleType();
  const [state, setState] = useState<PuzzleState>(() => createDefaultPuzzleState(defaultType.id));
  const [isModified, setIsModified] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Ref to hold geometry computed by Preview — avoids recomputation on export
  const geometryRef = useRef<null | PuzzleGeometry>(null);

  const currentTypeConfig = useMemo(() => getPuzzleTypeById(state.typeId) ?? defaultType, [state.typeId, defaultType]);

  const puzzleDimensions = useMemo(
    () => ({ height: state.rows * state.pieceSize, width: state.columns * state.pieceSize }),
    [state.columns, state.rows, state.pieceSize],
  );

  const handleTypeChange = useCallback(
    (typeId: ShapeType) => {
      // If switching to the same type, do nothing
      if (typeId === state.typeId) return;

      const applyTypeChange = () => {
        setState(createDefaultPuzzleState(typeId));
        setIsModified(false);
      };

      // If state has been modified, show confirmation dialog
      if (isModified) {
        alertCaller.popUp({
          buttonType: alertConstants.YES_NO,
          message: t.switch_type_warning,
          onYes: applyTypeChange,
          type: alertConstants.SHOW_POPUP_WARNING,
        });
      } else {
        applyTypeChange();
      }
    },
    [state.typeId, isModified, t.switch_type_warning],
  );

  const handleStateChange = useCallback((updates: PuzzleStateUpdate) => {
    setState((prev) => ({ ...prev, ...updates }) as PuzzleState);
    setIsModified(true);
  }, []);

  const handleNestedStateChange = useCallback(<K extends NestedStateKey>(key: K, updates: Partial<PuzzleState[K]>) => {
    setState((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }) as PuzzleState);
    setIsModified(true);
  }, []);

  const handleViewModeChange = useCallback(
    (viewMode: ViewMode) => handleStateChange({ viewMode }),
    [handleStateChange],
  );

  const handleImport = useCallback(async () => {
    setIsExporting(true);

    try {
      // Pass geometry from Preview to avoid recomputation
      await exportToCanvas(state, currentTypeConfig, geometryRef.current ?? undefined);
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
          onGeometryComputed={(geo) => {
            geometryRef.current = geo;
          }}
          onViewModeChange={handleViewModeChange}
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
  if (isIdExist(DIALOG_ID)) {
    return;
  }

  addDialogComponent(
    DIALOG_ID,
    <PuzzleGenerator
      onClose={() => {
        popDialogById(DIALOG_ID);
        onClose();
      }}
    />,
  );
};

export default PuzzleGenerator;
