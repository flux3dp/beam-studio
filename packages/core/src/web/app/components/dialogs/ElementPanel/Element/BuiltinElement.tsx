import type { ComponentType } from 'react';
import React, { use, useEffect, useMemo } from 'react';

import Icon from '@ant-design/icons';

import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import useForceUpdate from '@core/helpers/use-force-update';

import styles from './Element.module.scss';
import importIcon from './importIcon';

const icons: { [key: string]: ComponentType } = {};

const BuiltinElement = ({ mainType, path }: { mainType?: string; path: string }): React.JSX.Element => {
  const forceUpdate = useForceUpdate();
  const { addToHistory, onClose, onElementSelect } = use(ElementPanelContext);
  const [key, folder, fileName] = useMemo(() => {
    if (mainType) {
      return [`${mainType}/${path}`, mainType, path];
    }

    const [subPath1, subPath2] = path.split('/');

    return [path, subPath1, subPath2];
  }, [path, mainType]);

  useEffect(() => {
    if (icons[key]) {
      // Force update in case icons[key] is loaded between first render and useEffect
      forceUpdate();

      return;
    }

    importIcon(key)
      .then((icon) => {
        icons[key] = icon;
        forceUpdate();
      })
      .catch((err) => {
        console.error(`Fail to load icon from '@core/app/icons/shape/${key}.svg': ${err}`);
      });
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [key]);

  const IconComponent = icons[key];

  return (
    IconComponent && (
      <Icon
        className={styles.icon}
        component={IconComponent}
        id={key}
        onClick={async () => {
          addToHistory({ path: { fileName, folder }, type: 'builtin' });
          await onElementSelect(key);
          onClose();
        }}
      />
    )
  );
};

export default BuiltinElement;
