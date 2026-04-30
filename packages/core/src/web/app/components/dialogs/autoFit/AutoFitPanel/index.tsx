import React, { useCallback, useMemo, useRef, useState } from 'react';

import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import Sider from '@core/app/widgets/FullWindowPanel/Sider';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import useI18n from '@core/helpers/useI18n';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import { showAlignModal } from '../AlignModal';
import apply from '../apply';

import Canvas from './Canvas';
import styles from './index.module.scss';
import Info from './Info';
import ShapeSelector from './ShapeSelector';

interface Props {
  data: AutoFitContour[][];
  element: SVGElement;
  imageUrl: string;
  onClose?: () => void;
  onRetryWithRemoveBackground?: () => Promise<null | { data: AutoFitContour[][]; imageUrl: string }>;
}

// TODO: add unit test for AutoFitPanel & its components
const AutoFitPanel = ({
  data: initialData,
  element,
  imageUrl: initialImageUrl,
  onClose,
  onRetryWithRemoveBackground,
}: Props): React.JSX.Element => {
  useNewShortcutsScope();

  const [currentData, setCurrentData] = useState(initialData);
  const [currentImageUrl, setCurrentImageUrl] = useState(initialImageUrl);
  const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false);
  const isRetrying = useRef(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const { contours: mainContours, indices: mainIndices } = useMemo(() => {
    const indices = currentData.map((group) => {
      const angles = group.map(({ angle }) => angle);
      const middleAngle = angles.sort()[Math.floor(angles.length / 2)];

      return group.findIndex(({ angle }) => angle === middleAngle);
    });
    const contours = currentData.map((group, i) => group[indices[i]]);

    return { contours, indices };
  }, [currentData]);

  const {
    beambox: {
      right_panel: {
        object_panel: { actions_panel: tActionPanel },
      },
    },
    buttons: tButtons,
  } = useI18n();
  const handleNext = useCallback(() => {
    showAlignModal(element, mainContours[focusedIndex], (initD, d) => {
      apply(element, currentData[focusedIndex], mainIndices[focusedIndex], initD, d);
      onClose?.();
    });
  }, [element, currentData, focusedIndex, mainContours, mainIndices, onClose]);

  const handleToggleRemoveBackground = useCallback(async () => {
    if (!onRetryWithRemoveBackground) return;

    if (isBackgroundRemoved) {
      setCurrentData(initialData);
      setCurrentImageUrl(initialImageUrl);
      setFocusedIndex(0);
      setIsBackgroundRemoved(false);

      return;
    }

    if (isRetrying.current) return;

    isRetrying.current = true;
    try {
      const result = await onRetryWithRemoveBackground();

      if (result) {
        setCurrentData(result.data);
        setCurrentImageUrl(result.imageUrl);
        setFocusedIndex(0);
        setIsBackgroundRemoved(true);
      }
    } finally {
      isRetrying.current = false;
    }
  }, [onRetryWithRemoveBackground, isBackgroundRemoved, initialData, initialImageUrl]);

  return (
    <FullWindowPanel
      mobileTitle={tActionPanel.auto_fit}
      onClose={onClose}
      renderContents={() => (
        <>
          <Sider className={styles.sider}>
            <BackButton onClose={onClose}>{tButtons.back_to_beam_studio}</BackButton>
            <Header icon={<ActionPanelIcons.AutoFit className={styles.icon} />} title={tActionPanel.auto_fit} />
            <Info
              element={element}
              isBackgroundRemoved={isBackgroundRemoved}
              onToggleRemoveBackground={onRetryWithRemoveBackground ? handleToggleRemoveBackground : undefined}
            />
          </Sider>
          <Canvas data={currentData} focusedIndex={focusedIndex} imageUrl={currentImageUrl} />
          <ShapeSelector
            contours={mainContours}
            focusedIndex={focusedIndex}
            onNext={handleNext}
            setFocusedIndex={setFocusedIndex}
          />
        </>
      )}
    />
  );
};

export default AutoFitPanel;
