import type { CSSProperties } from 'react';
import React from 'react';

import classNames from 'classnames';

import { useIsMobile } from '@core/app/stores/layoutStore';

import type { HintConfig } from './hintConfigs';
import styles from './PanelImage.module.scss';

interface PanelImageProps {
  hint?: HintConfig;
  landscape?: boolean;
  src: string;
}

const PanelImage = ({ hint, landscape, src }: PanelImageProps): React.JSX.Element => {
  const isMobile = useIsMobile();

  const hintStyle: CSSProperties | undefined = hint
    ? {
        borderRadius: isMobile ? (hint.mobile?.borderRadius ?? hint.borderRadius) : hint.borderRadius,
        height: isMobile ? (hint.mobile?.height ?? hint.height) : hint.height,
        margin: isMobile ? (hint.mobile?.margin ?? hint.margin) : hint.margin,
        width: isMobile ? (hint.mobile?.width ?? hint.width) : hint.width,
      }
    : undefined;

  return (
    <div className={classNames(styles.image, { [styles.landscape]: landscape })}>
      {hint && <div className={classNames(styles.hint, { [styles.animated]: hint.animated })} style={hintStyle} />}
      <img draggable="false" src={src} />
    </div>
  );
};

export default PanelImage;
