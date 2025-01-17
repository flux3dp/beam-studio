import React, { useState } from 'react';
import { Checkbox, Form, Modal, Rate } from 'antd';

import i18n from 'helpers/i18n';
import RatingHelper from 'helpers/rating-helper';

const LANG = i18n.lang.beambox.rating_panel;

interface Props {
  onClose: () => void;
  onSubmit: (score: number) => void;
}

const RatingPanel = ({ onClose, onSubmit }: Props): JSX.Element => {
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
      open
      centered
      title={`👨‍🚀 ${LANG.title}`}
      onCancel={handleCancel}
      onOk={() => (isFinished ? handleCancel() : handleSubmit(star))}
    >
      {isFinished ? (
        <strong>
          🙏
          {LANG.thank_you}
        </strong>
      ) : (
        <div className="main-content">
          <div>{LANG.description}</div>
          <Rate onChange={(val) => setStar(val)} />
          <Form>
            <Form.Item label={LANG.dont_show_again}>
              <Checkbox
                checked={isCheckboxChecked}
                onChange={(e) => setIsCheckboxChecked(e.target.checked)}
              />
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
};

export default RatingPanel;
