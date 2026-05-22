import React, { useCallback, useMemo, useRef, useState } from 'react';

import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import {
  getRegionPreviewSizePx,
  retakeContourPreview,
  retryWithRemoveBackground,
} from '@core/app/svgedit/operations/autoFit';
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
  isSplicingImg: boolean;
  onClose?: () => void;
}

// TODO: add unit test for AutoFitPanel & its components
const AutoFitPanel = ({
  data: initialData,
  element,
  imageUrl: initialImageUrl,
  isSplicingImg,
  onClose,
}: Props): React.JSX.Element => {
  useNewShortcutsScope();

  const [currentData, setCurrentData] = useState(initialData);
  const [currentImageUrl, setCurrentImageUrl] = useState(initialImageUrl);
  const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false);
  const isRetrying = useRef(false);
  // baseline state before background removal, updated by retake
  const baseData = useRef(initialData);
  const baseImageUrl = useRef(initialImageUrl);
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
    showAlignModal(element, mainContours[focusedIndex], currentImageUrl, (initD, d) => {
      apply(element, currentData[focusedIndex], mainIndices[focusedIndex], initD, d);
      onClose?.();
    });
  }, [element, currentData, currentImageUrl, focusedIndex, mainContours, mainIndices, onClose]);

  const handleToggleRemoveBackground = useCallback(async () => {
    if (isBackgroundRemoved) {
      setCurrentData(baseData.current);
      setCurrentImageUrl(baseImageUrl.current);
      setFocusedIndex(0);
      setIsBackgroundRemoved(false);

      return;
    }

    if (isRetrying.current) return;

    isRetrying.current = true;
    try {
      const result = await retryWithRemoveBackground(baseImageUrl.current, isSplicingImg);

      if (result) {
        setCurrentData(result.data);
        setCurrentImageUrl(result.imageUrl);
        setFocusedIndex(0);
        setIsBackgroundRemoved(true);
      }
    } finally {
      isRetrying.current = false;
    }
  }, [isBackgroundRemoved, isSplicingImg]);

  const canRetake = useMemo(() => {
    const previewSize = getRegionPreviewSizePx();

    if (!previewSize) return false;

    return !currentData[focusedIndex].some(({ bbox }) => bbox[2] > previewSize.width || bbox[3] > previewSize.height);
  }, [currentData, focusedIndex]);

  const handleRetake = useCallback(async () => {
    if (isRetrying.current) return;

    isRetrying.current = true;
    try {
      const result = await retakeContourPreview(currentData[focusedIndex], isBackgroundRemoved);

      if (result) {
        baseData.current = result.data;
        baseImageUrl.current = result.imageUrl;
        setCurrentData(result.data);
        setCurrentImageUrl(result.imageUrl);
        setFocusedIndex(0);
        setIsBackgroundRemoved(false);
      }
    } finally {
      isRetrying.current = false;
    }
  }, [currentData, focusedIndex, isBackgroundRemoved]);

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
              onRetake={canRetake ? handleRetake : undefined}
              onToggleRemoveBackground={handleToggleRemoveBackground}
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
