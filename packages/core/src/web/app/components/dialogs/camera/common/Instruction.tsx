import type { ReactNode } from 'react';
import React, { useRef } from 'react';

import { Button } from 'antd';

import DraggableModal from '@core/app/widgets/DraggableModal';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import useForceUpdate from '@core/helpers/use-force-update';

import styles from './Instruction.module.scss';

interface Props {
  animationSrcs?: Array<{ src: string; type: string }>;
  buttons: Array<{ label: string; onClick: () => void; type?: 'default' | 'primary' }>;
  children?: React.ReactNode;
  contentAfterAnimation?: React.ReactNode;
  contentBeforeSteps?: React.ReactNode;
  onClose?: (done?: boolean) => void;
  steps?: Array<ReactNode | ReactNode[]>;
  title: React.ReactNode;
}

const Instruction = ({
  animationSrcs,
  buttons,
  children,
  contentAfterAnimation,
  contentBeforeSteps,
  onClose,
  steps,
  title,
}: Props): React.JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const forceUpdate = useForceUpdate();

  useDidUpdateEffect(() => {
    videoRef.current?.load();
  }, [animationSrcs]);

  return (
    <DraggableModal
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
      scrollableContent
      title={title}
      width={400}
    >
      {contentBeforeSteps}
      {steps && (
        <ol className={styles.steps}>
          {steps.map((step, i) => {
            if (Array.isArray(step)) {
              return (
                <ol className={styles.sub} key={i}>
                  {step.map((subStep, j) => (
                    <li key={j}>{subStep}</li>
                  ))}
                </ol>
              );
            }

            return <li key={i}>{step}</li>;
          })}
        </ol>
      )}
      {children}
      {animationSrcs && (
        // rerender when video loaded to reposition draggable modal with new content size
        <video autoPlay className={styles.video} loop muted onLoadedData={forceUpdate} ref={videoRef}>
          {animationSrcs.map(({ src, type }) => (
            <source key={src} src={src} type={type} />
          ))}
        </video>
      )}
      {contentAfterAnimation}
    </DraggableModal>
  );
};

export default Instruction;
