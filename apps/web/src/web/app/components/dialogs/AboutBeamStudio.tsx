/* eslint-disable react/no-danger */
import * as React from 'react';
import { Col, Modal, Row } from 'antd';

import i18n from 'helpers/i18n';

const LANG = i18n.lang.topmenu;
const { FLUX } = window;
const VISIBLE = true;

interface Props {
  onClose: () => void;
}

function AboutBeamStudio({ onClose }: Props): JSX.Element {
  return (
    <Modal
      open={VISIBLE}
      centered
      onCancel={onClose}
      okText={LANG.ok}
      onOk={onClose}
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <Row gutter={10}>
        <Col span={7}>
          <img width={150} src="img/icon.png" style={{ float: 'left' }} />
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
