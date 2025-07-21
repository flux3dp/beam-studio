import { InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Form, Tooltip } from 'antd';

import browser from '@core/implementations/browser';

import styles from '../Settings.module.scss';

type Props = {
  children: React.ReactNode;
  id?: string;
  label: string;
  tooltip?: string;
  url?: string;
  warning?: string;
};

function SettingFormItem({ children, id, label, tooltip, url, warning }: Props) {
  const renderInfo = () => {
    if (url) {
      return (
        <Tooltip title={url}>
          <InfoCircleOutlined className={styles.icon} onClick={() => browser.open(url)} />
        </Tooltip>
      );
    }

    if (tooltip) {
      return (
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined className={styles.icon} />
        </Tooltip>
      );
    }

    return null;
  };

  const renderWarning = () => {
    if (warning) {
      return <img src="img/warning.svg" title={warning} />;
    }

    return null;
  };

  return (
    <Form.Item className={styles.row}>
      <Flex>
        <Form.Item
          className={styles['form-item']}
          id={id}
          label={
            <>
              {label}
              {renderInfo()}
            </>
          }
        />
        {children}
        {renderWarning()}
      </Flex>
    </Form.Item>
  );
}

export default SettingFormItem;
