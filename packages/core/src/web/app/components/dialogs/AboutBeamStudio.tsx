import * as React from 'react';

import { Col, Modal, Row } from 'antd';

import i18n from '@core/helpers/i18n';

const LANG = i18n.lang.topmenu;
const { FLUX } = window;
const VISIBLE = true;

interface Props {
  onClose: () => void;
}

function AboutBeamStudio({ onClose }: Props): React.JSX.Element {
  return (
    <Modal
      cancelButtonProps={{ style: { display: 'none' } }}
      centered
      okText={LANG.ok}
      onCancel={onClose}
      onOk={onClose}
      open={VISIBLE}
    >
      <Row gutter={10}>
        <Col span={7}>
          <img src="img/icon.png" style={{ float: 'left' }} width={150} />
        </Col>
        <Col span={12}>
          <strong>Beam Studio</strong>
          <div className="version">{`${LANG.version} ${FLUX.version}`}</div>
          <div className="copyright">{`Copyright ⓒ ${new Date().getFullYear()} FLUX Inc.`}</div>
          <div className="credit" dangerouslySetInnerHTML={{ __html: LANG.credit }} />
        </Col>
      </Row>
    </Modal>
  );
}

export default AboutBeamStudio;
