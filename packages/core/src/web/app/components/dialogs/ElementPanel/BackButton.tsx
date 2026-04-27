import type { ReactNode } from 'react';
import { memo, use } from 'react';

import { LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';

import { ContentType } from '@core/app/constants/element-panel-constants';
import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import { useIsMobile } from '@core/app/stores/screenStore';
import useI18n from '@core/helpers/useI18n';

import styles from './ElementPanel.module.scss';

const BackButton = (): ReactNode => {
  const isMobile = useIsMobile();
  const lang = useI18n().beambox.elements_panel;
  const { activeSubType, contentType, setActiveSubType, setSearchKey } = use(ElementPanelContext);

  let onClick: (() => void) | undefined = undefined;
  let text: string | undefined = undefined;

  if (contentType === ContentType.Search) {
    onClick = () => {
      setSearchKey(undefined);
      setActiveSubType(activeSubType);
    };
  } else if (contentType === ContentType.SubType) {
    onClick = () => {
      setActiveSubType(undefined);
    };
    text = lang[activeSubType!];
  }

  if (onClick || isMobile) {
    return (
      <Button
        className={classNames(styles['back-button'], { [styles.invisible]: !onClick })}
        icon={<LeftOutlined />}
        onClick={onClick}
        type="text"
      >
        {text}
      </Button>
    );
  }

  if (isMobile) return null;

  return <div className={styles.title}>{lang.title}</div>;
};

BackButton.displayName = 'BackButton';

export default memo(BackButton);
