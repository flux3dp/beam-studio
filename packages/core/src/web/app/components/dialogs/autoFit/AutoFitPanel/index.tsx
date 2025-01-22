import React, { useCallback, useMemo, useState } from 'react';

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
}

// TODO: add unit test for AutoFitPanel & its components
const AutoFitPanel = ({ data, element, imageUrl, onClose }: Props): React.JSX.Element => {
  useNewShortcutsScope();

  const [focusedIndex, setFocusedIndex] = useState(0);
  const { contours: mainContours, indice: mainIndice } = useMemo(() => {
    const indice = data.map((group) => {
      const angles = group.map(({ angle }) => angle);
      const middleAngle = angles.sort()[Math.floor(angles.length / 2)];

      return group.findIndex(({ angle }) => angle === middleAngle);
    });
    const contours = data.map((group, i) => group[indice[i]]);

    return { contours, indice };
  }, [data]);

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
      apply(element, data[focusedIndex], mainIndice[focusedIndex], initD, d);
      onClose?.();
    });
  }, [element, data, focusedIndex, mainContours, mainIndice, onClose]);

  return (
    <FullWindowPanel
      mobileTitle={tActionPanel.auto_fit}
      onClose={onClose}
      renderContents={() => (
        <>
          <Sider className={styles.sider}>
            <BackButton onClose={onClose}>{tButtons.back_to_beam_studio}</BackButton>
            <Header icon={<ActionPanelIcons.AutoFit className={styles.icon} />} title={tActionPanel.auto_fit} />
            <Info element={element} />
          </Sider>
          <Canvas data={data} focusedIndex={focusedIndex} imageUrl={imageUrl} />
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
