import React, { Dispatch, SetStateAction } from 'react';
import { Button, Tooltip } from 'antd';
import {
  QuestionCircleOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';

import useI18n from 'helpers/useI18n';

import styles from './CanvasController.module.scss';

type ControlType = 'reset' | 'zoomin' | 'zoomout';

interface Props {
  setResetKey: Dispatch<SetStateAction<number>>;
  setZoomKey: Dispatch<SetStateAction<number>>;
}

const CanvasController = ({ setResetKey, setZoomKey }: Props): JSX.Element => {
  const lang = useI18n().boxgen;

  const onClick = (type: ControlType) => {
    switch (type) {
      case 'reset':
        setResetKey((key) => key + 1);
        break;
      case 'zoomin':
        setZoomKey((key) => Math.abs(key) + 1);
        break;
      case 'zoomout':
        setZoomKey((key) => Math.abs(key) * -1 - 1);
        break;
      default:
        break;
    }
  };

  const renderButton = (type: ControlType, icon: JSX.Element) => (
    <Button
      className={styles.button}
      shape="circle"
      type="text"
      icon={icon}
      onClick={() => onClick(type)}
    />
  );

  return (
    <div className={styles.container}>
      <div>
        <div>{renderButton('reset', <ReloadOutlined />)}</div>
        <span className={styles.label}>{lang.reset}</span>
      </div>
      <div>
        <div>
          {renderButton('zoomout', <ZoomOutOutlined />)}
          {renderButton('zoomin', <ZoomInOutlined />)}
        </div>
        <span className={styles.label}>{lang.zoom}</span>
      </div>
      <div>
        <Tooltip
          overlayClassName={styles['tooltip-text']}
          title={navigator.maxTouchPoints >= 1 ? lang.control_tooltip_touch : lang.control_tooltip}
          placement="topRight"
          arrow={{ pointAtCenter: true }}
        >
          <QuestionCircleOutlined className={styles.tooltip} />
        </Tooltip>
      </div>
    </div>
  );
};

export default CanvasController;
