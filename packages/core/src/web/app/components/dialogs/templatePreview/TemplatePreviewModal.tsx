import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { InputNumber, Modal } from 'antd';
import { ResizableBox } from 'react-resizable';

import TemplatePreview from './TemplatePreview';
import styles from './TemplatePreviewModal.module.scss';

interface Dimension {
  height: number;
  width: number;
}

const DEFAULT_DIMENSION: Dimension = { height: 600, width: 800 };
const MIN_DIMENSION: Dimension = { height: 240, width: 320 };
// Room kept around the preview so the handles sit outside the box without being clipped.
const HANDLE_SPACE = 16;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

interface Props {
  onClose: () => void;
}

const TemplatePreviewModal = ({ onClose }: Props): React.JSX.Element => {
  const [dimension, setDimension] = useState<Dimension>(DEFAULT_DIMENSION);
  // Upper bound for the preview, derived from the space available inside the modal content.
  const [maxDimension, setMaxDimension] = useState<Dimension>(DEFAULT_DIMENSION);
  // While resizing, the iframe must ignore pointer events or it swallows the drag's mouse events.
  const [isResizing, setIsResizing] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  // Track the available area so the preview can never exceed the modal content.
  useLayoutEffect(() => {
    const area = areaRef.current;

    if (!area) return;

    const update = () => setMaxDimension({ height: area.clientHeight, width: area.clientWidth });

    update();

    const observer = new ResizeObserver(update);

    observer.observe(area);

    return () => observer.disconnect();
  }, []);

  // The preview is centered, so reserve handle space on both sides of each axis.
  const maxConstraints: [number, number] = [
    Math.max(MIN_DIMENSION.width, maxDimension.width - 2 * HANDLE_SPACE),
    Math.max(MIN_DIMENSION.height, maxDimension.height - 2 * HANDLE_SPACE),
  ];

  // Keep the current size within the (possibly shrinking) available area.
  useEffect(() => {
    setDimension((prev) => ({
      height: clamp(prev.height, MIN_DIMENSION.height, maxConstraints[1]),
      width: clamp(prev.width, MIN_DIMENSION.width, maxConstraints[0]),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxDimension]);

  const updateDimension = (key: keyof Dimension, value: null | number) => {
    if (value === null) return;

    const max = key === 'width' ? maxConstraints[0] : maxConstraints[1];

    setDimension((prev) => ({ ...prev, [key]: clamp(value, MIN_DIMENSION[key], max) }));
  };

  return (
    <Modal
      cancelButtonProps={{ style: { display: 'none' } }}
      centered
      footer={null}
      maskClosable={false}
      onCancel={onClose}
      open
      // 95% viewport height minus the modal content's vertical padding, so it stays on-screen.
      styles={{ body: { height: 'calc(95vh - 40px)' } }}
      width="95vw"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <InputNumber
            addonBefore="W"
            max={maxConstraints[0]}
            min={MIN_DIMENSION.width}
            onChange={(value) => updateDimension('width', value)}
            value={dimension.width}
          />
          <InputNumber
            addonBefore="H"
            max={maxConstraints[1]}
            min={MIN_DIMENSION.height}
            onChange={(value) => updateDimension('height', value)}
            value={dimension.height}
          />
        </div>
        <div className={styles.previewArea} ref={areaRef}>
          <ResizableBox
            axis="both"
            className={styles.preview}
            height={dimension.height}
            maxConstraints={maxConstraints}
            minConstraints={[MIN_DIMENSION.width, MIN_DIMENSION.height]}
            onResize={(_, { size }) => setDimension({ height: Math.round(size.height), width: Math.round(size.width) })}
            onResizeStart={() => setIsResizing(true)}
            onResizeStop={() => setIsResizing(false)}
            resizeHandles={['w', 'e', 's']}
            width={dimension.width}
          >
            <TemplatePreview interactive={!isResizing} />
          </ResizableBox>
        </div>
      </div>
    </Modal>
  );
};

export default TemplatePreviewModal;
