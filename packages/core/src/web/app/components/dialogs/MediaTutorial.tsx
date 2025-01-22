import React, { useEffect, useRef, useState } from 'react';

import { Button, Modal } from 'antd';

import i18n from '@core/helpers/i18n';
import type { IMediaTutorial } from '@core/interfaces/ITutorial';

interface Props {
  data: IMediaTutorial[];
  onClose: () => void;
}

function MediaTutorial({ data, onClose }: Props): React.JSX.Element {
  const LANG = i18n.lang.buttons;
  const [step, setStep] = useState(0);
  const videoRef = useRef<HTMLVideoElement>();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [step]);

  const { description, isVideo, mediaSources } = data[step];

  const mediaContent = () => {
    if (isVideo) {
      return (
        <video autoPlay loop muted playsInline ref={videoRef}>
          {mediaSources.map(({ src, type }) => (
            <source key={src} src={src} type={type} />
          ))}
        </video>
      );
    }

    return <img src={mediaSources[0].src} />;
  };

  const footer = [];

  if (step !== 0) {
    footer.push(
      <Button key="back" onClick={() => setStep(step - 1)}>
        {LANG.back}
      </Button>,
    );
  }

  if (step === data.length - 1) {
    footer.push(
      <Button key="done" onClick={onClose} type="primary">
        {LANG.done}
      </Button>,
    );
  } else {
    footer.push(
      <Button key="next" onClick={() => setStep(step + 1)} type="primary">
        {LANG.next}
      </Button>,
    );
  }

  return (
    <Modal centered footer={footer} onCancel={onClose} open>
      <div className="media-tutorial">
        <div className="media-container">{mediaContent()}</div>
        <div className="description">{description}</div>
        <div className="step">{`${step + 1}/${data.length}`}</div>
      </div>
    </Modal>
  );
}

export default MediaTutorial;
