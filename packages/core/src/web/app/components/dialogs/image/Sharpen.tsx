import { useState } from 'react';

import { InputNumber, Slider } from 'antd';

import progressCaller from '@core/app/actions/progress-caller';
import OpenCVWebSocket from '@core/helpers/api/open-cv';
import imageEdit from '@core/helpers/image-edit';
import useI18n from '@core/helpers/useI18n';

import ImageEditComparePanel from './ImageEditComparePanel';
import styles from './index.module.scss';
import { useImageEdit } from './useImageEdit';

interface Props {
  element: SVGImageElement;
  onClose: () => void;
  src: string;
}

const opencvWS = new OpenCVWebSocket();

export const Sharpen = ({ element, onClose, src }: Props) => {
  const t = useI18n().beambox.photo_edit_panel;
  const [sharpness, setSharpness] = useState(0);
  const [sharpRadius, setSharpRadius] = useState(1);
  const { calculateImageData, compareBase64, displayBase64, setState, state } = useImageEdit(element, src);

  const handleSharp = async (isPreview?: boolean): Promise<void> => {
    progressCaller.openNonstopProgress({ id: 'photo-edit-processing', message: t.processing });

    const { imageWidth, origWidth, previewSrc } = state;
    const radius = isPreview ? Math.ceil(sharpRadius * (imageWidth / origWidth)) : sharpRadius;

    const imgBlobUrl = isPreview ? previewSrc : src;

    try {
      let newImgUrl = imgBlobUrl;

      if (radius * sharpness > 0) {
        const blob = await opencvWS.sharpen(imgBlobUrl, sharpness, radius);

        newImgUrl = URL.createObjectURL(blob);
      }

      if (isPreview) {
        setState({ displaySrc: newImgUrl });

        return;
      }

      const result = await calculateImageData(newImgUrl);

      imageEdit.addBatchCommand('Sharpen Image', element, {
        origImage: newImgUrl,
        'xlink:href': result,
      });
      onClose();
    } catch (error) {
      console.log('Error when sharpening image', error);
    } finally {
      progressCaller.popById('photo-edit-processing');
    }
  };

  const renderContent = () => (
    <>
      <div className={styles.field}>
        <span className={styles.label}>{t.sharpness}</span>
        <InputNumber
          className={styles.input}
          controls={false}
          max={20}
          min={0}
          onBlur={() => handleSharp(true)}
          onChange={(val) => setSharpness(val ?? sharpness)}
          type="number"
          value={sharpness}
        />
        <Slider
          className={styles.slider}
          max={20}
          min={0}
          onChange={setSharpness}
          onChangeComplete={() => handleSharp(true)}
          value={sharpness}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>{t.radius}</span>
        <InputNumber
          className={styles.input}
          controls={false}
          max={100}
          min={0}
          onBlur={() => handleSharp(true)}
          onChange={(val) => setSharpRadius(val ?? sharpRadius)}
          type="number"
          value={sharpRadius}
        />
        <Slider
          className={styles.slider}
          max={100}
          min={0}
          onChange={setSharpRadius}
          onChangeComplete={() => handleSharp(true)}
          value={sharpRadius}
        />
      </div>
    </>
  );

  return (
    <ImageEditComparePanel
      compareBase64={compareBase64}
      content={renderContent()}
      contentHeight={156}
      contentWidth={330}
      displayBase64={displayBase64}
      onClose={onClose}
      onOk={() => handleSharp(false)}
      setState={setState}
      state={state}
      title={t.sharpen}
    />
  );
};

export default Sharpen;
