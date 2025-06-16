import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Form, Tooltip } from 'antd';

import browser from '@core/implementations/browser';

import styles from '../Settings.module.scss';

type Props = {
  children: React.ReactNode;
  id?: string;
  label: string;
  url?: string;
  warning?: string;
};

function SettingFormItem({ children, id, label, url, warning }: Props) {
  const renderInfo = () => {
    if (!url) return null;

    return (
      <Tooltip title={url}>
        <InfoCircleOutlined className={styles.icon} onClick={() => browser.open(url)} />
      </Tooltip>
    );
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
