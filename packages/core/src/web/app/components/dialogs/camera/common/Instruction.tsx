import React, { useRef } from 'react';

import { Button, Modal } from 'antd';

import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';

import styles from './Instruction.module.scss';

interface Props {
  animationSrcs?: Array<{ src: string; type: string }>;
  buttons: Array<{ label: string; onClick: () => void; type?: 'default' | 'primary' }>;
  children?: React.ReactNode;
  onClose?: (done?: boolean) => void;
  steps?: string[];
  text?: string;
  title: React.ReactNode;
}

const Instruction = ({ animationSrcs, buttons, children, onClose, steps, text, title }: Props): React.JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useDidUpdateEffect(() => {
    videoRef.current?.load();
  }, [animationSrcs]);

  return (
    <Modal
      centered
      className={styles.container}
      closable={!!onClose}
      footer={buttons.map(({ label, onClick, type }) => (
        <Button key={label} onClick={onClick} type={type}>
          {label}
        </Button>
      ))}
      maskClosable={false}
      onCancel={() => onClose?.(false)}
      open
      title={title}
      width={400}
    >
      {text}
      {steps && (
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
      {children}
      {animationSrcs && (
        <video autoPlay className={styles.video} loop muted ref={videoRef}>
          {animationSrcs.map(({ src, type }) => (
            <source key={src} src={src} type={type} />
          ))}
        </video>
      )}
    </Modal>
  );
};

export default Instruction;
