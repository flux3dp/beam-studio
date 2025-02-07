import React, { useState } from 'react';

import { Checkbox, Form, Modal, Rate } from 'antd';

import RatingHelper from '@core/helpers/rating-helper';
import useI18n from '@core/helpers/useI18n';

interface Props {
  onClose: () => void;
  onSubmit: (score: number) => void;
}

const RatingPanel = ({ onClose, onSubmit }: Props): React.JSX.Element => {
  const {
    alert: tAlert,
    beambox: { rating_panel: t },
  } = useI18n();
  const [star, setStar] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  const handleSubmit = (score: number) => {
    onSubmit(score);
    setIsFinished(true);
  };

  const handleCancel = () => {
    if (isCheckboxChecked) {
      RatingHelper.setNotShowing();
    }

    onClose();
  };

  return (
    <Modal
      centered
      onCancel={handleCancel}
      onOk={() => (isFinished ? handleCancel() : handleSubmit(star))}
      open
      title={`👨‍🚀 ${t.title}`}
    >
      {isFinished ? (
        <strong>
          🙏
          {t.thank_you}
        </strong>
      ) : (
        <div className="main-content">
          <div>{t.description}</div>
          <Rate onChange={(val) => setStar(val)} />
          <Form>
            <Form.Item label={tAlert.dont_show_again}>
              <Checkbox checked={isCheckboxChecked} onChange={(e) => setIsCheckboxChecked(e.target.checked)} />
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
};

export default RatingPanel;
