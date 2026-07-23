import React, { memo, useMemo } from 'react';

import { match } from 'ts-pattern';

import VariableUseOptions from '@core/app/components/beambox/RightPanel/OptionsBlocks/VariableOptions/VariableUseOptions';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';

import ImageOptions from './OptionsBlocks/ImageOptions';
import PolygonOptions from './OptionsBlocks/PolygonOptions';
import RectOptions from './OptionsBlocks/RectOptions';
import TextOptions from './OptionsBlocks/TextOptions';
import styles from './OptionsPanel.module.scss';

interface Props {
  elem: null | SVGElement;
}

function OptionsPanel({ elem }: Props): null | React.JSX.Element {
  const isTablet = useIsTabletOrMobile();
  const optionPanel = useSelectedElementStore((state) => state.objectPanelData?.optionPanel);

  const content = useMemo(() => {
    return match(optionPanel)
      .with('rect', () => <RectOptions elem={elem as SVGElement} />)
      .with('polygon', () => <PolygonOptions elem={elem as SVGElement} />)
      .with('text', () => <TextOptions />)
      .with('image', () => <ImageOptions elem={elem as SVGElement} />)
      .with('variable_use', () => <VariableUseOptions elems={[elem as SVGElement]} id={elem!.id} />)
      .otherwise(() => null);
  }, [elem, optionPanel]);

  return isTablet ? <>{content}</> : content ? <div className={styles.panel}>{content}</div> : null;
}

export default memo(OptionsPanel);
