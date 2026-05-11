import React, { use, useState } from 'react';

import classNames from 'classnames';

import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import type { IIcon } from '@core/interfaces/INounProject';

import styles from './Element.module.scss';

const NPElement = ({ icon }: { icon: IIcon }) => {
  const { addToHistory, onClose, onElementSelect } = use(ElementPanelContext);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(icon.hidden);

  if (hasError) return null;

  return (
    <div
      className={classNames(styles.icon, { [styles.loading]: isLoading })}
      id={icon.id}
      onClick={async () => {
        if (!isLoading) {
          addToHistory({ npIcon: icon, type: 'np' });

          await onElementSelect(`np/${icon.id}`);
          onClose();
        }
      }}
    >
      <img
        onError={() => {
          icon.hidden = true;
          setHasError(true);
        }}
        onLoad={() => setIsLoading(false)}
        src={icon.thumbnail_url}
      />
    </div>
  );
};

export default NPElement;
