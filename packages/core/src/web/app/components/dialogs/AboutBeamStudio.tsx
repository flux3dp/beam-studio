import * as React from 'react';

import { Col, Modal, Row } from 'antd';

import useI18n from '@core/helpers/useI18n';

interface Props {
  onClose: () => void;
}

function AboutBeamStudio({ onClose }: Props): React.JSX.Element {
  const { global: tGlobal, topmenu: t } = useI18n();
  const { FLUX } = window;

  return (
    <Modal
      cancelButtonProps={{ style: { display: 'none' } }}
      centered
      okText={tGlobal.ok}
      onCancel={onClose}
      onOk={onClose}
      open
    >
      <Row gutter={10}>
        <Col span={7}>
          <img src="img/icon.png" style={{ float: 'left' }} width={150} />
        </Col>
        <Col span={12}>
          <strong>Beam Studio</strong>
          <div>{`${t.version} ${FLUX.version}`}</div>
          <div>{`Copyright ⓒ ${new Date().getFullYear()} FLUX Inc.`}</div>
          <div dangerouslySetInnerHTML={{ __html: t.credit }} />
        </Col>
      </Row>
    </Modal>
  );
}

export default AboutBeamStudio;
