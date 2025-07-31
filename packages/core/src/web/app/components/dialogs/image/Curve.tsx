import { useEffect, useRef, useState } from 'react';

import { InputNumber, Slider } from 'antd';

import progressCaller from '@core/app/actions/progress-caller';
import CurveControl from '@core/app/widgets/Curve-Control';
import imageEdit from '@core/helpers/image-edit';
import jimpHelper from '@core/helpers/jimp-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import ImageEditComparePanel from './ImageEditComparePanel';
import styles from './index.module.scss';
import { useImageEdit } from './useImageEdit';

interface Props {
  element: SVGImageElement;
  onClose: () => void;
  src: string;
}

export const Curve = ({ element, onClose, src }: Props) => {
  const t = useI18n().beambox.photo_edit_panel;
  const isMobile = useIsMobile();
  const curveFunction = useRef((e: number) => e);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const { calculateImageData, compareBase64, displayBase64, setState, state } = useImageEdit(element, src);

  useEffect(() => {
    if (isMobile) {
      const a = contrast < 0 ? contrast / 200 + 1 : contrast / 50 + 1;

      curveFunction.current = (n) => Math.max(Math.min(a * (n - 127.5) + brightness + 127.5, 255), 0);
    }
  }, [brightness, contrast, isMobile]);

  const handleCurve = async (isPreview: boolean): Promise<void> => {
    const { previewSrc } = state;
    const curveMap = [...Array(256).keys()].map((e: number) => Math.round(curveFunction.current(e)));
    const imgBlobUrl = isPreview ? previewSrc : src;

    progressCaller.openNonstopProgress({ id: 'photo-edit-processing', message: t.processing });

    const newImgUrl = await jimpHelper.curveOperate(imgBlobUrl, curveMap);

    if (newImgUrl) {
      progressCaller.popById('photo-edit-processing');

      if (isPreview) {
        setState({ displaySrc: newImgUrl });
        progressCaller.popById('photo-edit-processing');

        return;
      }

      const result = await calculateImageData(newImgUrl);

      imageEdit.addBatchCommand('Sharpen Image', element, {
        origImage: newImgUrl,
        'xlink:href': result,
      });
      onClose();
    }

    progressCaller.popById('photo-edit-processing');
  };

  const renderContent = () =>
    isMobile ? (
      <>
        <div className={styles.field}>
          <span className={styles.label}>{t.brightness}</span>
          <InputNumber
            className={styles.input}
            controls={false}
            max={100}
            min={-100}
            onBlur={() => handleCurve(true)}
            onChange={(val) => setBrightness(val ?? brightness)}
            precision={0}
            type="number"
            value={brightness}
          />
          <Slider
            className={styles.slider}
            marks={{ 0: '0' }}
            max={100}
            min={-100}
            onChange={(val) => setBrightness(val)}
            onChangeComplete={() => handleCurve(true)}
            step={1}
            value={brightness}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{t.contrast}</span>
          <InputNumber
            className={styles.input}
            controls={false}
            max={100}
            min={-100}
            onBlur={() => handleCurve(true)}
            onChange={(val) => setContrast(val ?? contrast)}
            precision={0}
            type="number"
            value={contrast}
          />
          <Slider
            className={styles.slider}
            marks={{ 0: '0' }}
            max={100}
            min={-100}
            onChange={(val) => setContrast(val)}
            onChangeComplete={() => handleCurve(true)}
            step={1}
            value={contrast}
          />
        </div>
      </>
    ) : (
      <div className={styles.curveControl}>
        <CurveControl
          updateCurveFunction={(fn) => (curveFunction.current = fn)}
          updateImage={() => handleCurve(true)}
        />
      </div>
    );

  return (
    <ImageEditComparePanel
      compareBase64={compareBase64}
      content={renderContent()}
      contentHeight={isMobile ? 194 : 260}
      contentWidth={isMobile ? 330 : 260}
      displayBase64={displayBase64}
      onClose={onClose}
      onOk={() => handleCurve(false)}
      setState={setState}
      state={state}
      title={isMobile ? t.brightness_and_contrast : t.curve}
    />
  );
};

export default Curve;
