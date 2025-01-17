import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Segmented } from 'antd';

import AlertIcons from 'app/icons/alerts/AlertIcons';
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import browser from 'implementations/browser';
import progressCaller from 'app/actions/progress-caller';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import imageEdit from 'helpers/image-edit';
import storage from 'implementations/storage';
import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import { CHUCK_ROTARY_DIAMETER } from 'app/constants/add-on';
import { getRotationAngle } from 'app/svgedit/transform/rotation';
import { getSVGAsync } from 'helpers/svg-editor-helper';

import styles from './RotaryWarped.module.scss';

let svgCanvas: ISVGCanvas;
let svgEditor;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

interface Props {
  elem: SVGImageElement;
  onClose: () => void;
}

const rotateImage = (
  w: number,
  h: number,
  rotation: number,
  source: CanvasImageSource
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const c = Math.abs(Math.cos(rotation));
  const s = Math.abs(Math.sin(rotation));
  const rotatedW = c * w + s * h;
  const rotatedH = s * w + c * h;
  canvas.width = Math.round(rotatedW);
  canvas.height = Math.round(rotatedH);
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.translate(rotatedW / 2, rotatedH / 2);
  ctx.rotate(rotation);
  ctx.drawImage(source, -w / 2, -h / 2, w, h);
  ctx.restore();
  return canvas;
};

const rotateCorners = (w: number, h: number, rotation: number, points: number[][]) => {
  const c = Math.abs(Math.cos(rotation));
  const s = Math.abs(Math.sin(rotation));
  const rotatedW = c * w + s * h;
  const rotatedH = s * w + c * h;
  return points.map(([x, y]) => {
    const newX = x - w / 2;
    const newY = y - h / 2;
    const newX2 = newX * Math.cos(rotation) - newY * Math.sin(rotation);
    const newY2 = newX * Math.sin(rotation) + newY * Math.cos(rotation);
    return [newX2 + rotatedW / 2, newY2 + rotatedH / 2];
  });
};

const RotaryWarped = ({ elem, onClose }: Props): JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.photo_edit_panel;
  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const [inputType, setInputType] = useState<number>(0);
  const [previewImgUrl, setPreviewImgUrl] = useState<string>('');
  const [originalImgUrl, setOriginalImgUrl] = useState<string>('');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const { imgUrl, shading, threshold, isFullColor, rotation, initA, initB } = useMemo(() => {
    const imageInfo = imageEdit.getImageAttributes(elem);
    const r = getRotationAngle(elem, true);
    try {
      const trapezoidData = elem.getAttribute('data-trapezoid');
      if (trapezoidData) {
        const { a, b, origImage } = JSON.parse(trapezoidData);
        return { ...imageInfo, rotation: r, initA: a, initB: b, imgUrl: origImage };
      }
    } catch (err) {
      console.error('Failed to parse data-trapezoid', err);
    }
    return { ...imageInfo, rotation: r, initA: null, initB: null };
  }, [elem]);
  const [diameterA, setDiaMeterA] = useState<number>(
    initA ?? beamboxPreference.read('rotary-chuck-obj-d') ?? CHUCK_ROTARY_DIAMETER
  );
  const [diameterB, setDiaMeterB] = useState<number>(
    initB ?? beamboxPreference.read('rotary-chuck-obj-d') ?? CHUCK_ROTARY_DIAMETER
  );
  const img = useRef<HTMLImageElement>(new Image());
  const previewCanvas = useRef<HTMLCanvasElement>(null);
  const imgLoad = useRef<Promise<void>>(null);
  const segmentOptions = useMemo(
    () => [
      { label: t.diameter, value: 0 },
      { label: t.circumference, value: 1 },
    ],
    [t]
  );

  useEffect(() => {
    if (!img.current || !(img.current instanceof Image)) img.current = new Image();
    imgLoad.current = new Promise<void>((resolve) => {
      img.current.onload = () => {
        const longSide = Math.max(img.current.width, img.current.height);
        if (longSide > 600 || rotation !== 0) {
          const ratio = Math.min(600 / longSide, 1);
          const w = img.current.width * ratio;
          const h = img.current.height * ratio;
          previewCanvas.current = rotateImage(w, h, rotation, img.current);
          setOriginalImgUrl(previewCanvas.current.toDataURL());
          setPreviewImgUrl(previewCanvas.current.toDataURL());
        } else {
          setOriginalImgUrl(imgUrl);
        }
        resolve();
      };
      img.current.src = imgUrl;
      previewCanvas.current = null;
    });
  }, [imgUrl, rotation]);

  useEffect(() => {
    const updatePreview = async () => {
      const max = Math.max(diameterA, diameterB);
      const min = Math.min(diameterA, diameterB);
      if (max === min) {
        setPreviewImgUrl(previewCanvas.current?.toDataURL());
        return;
      }
      if (max <= 0 || min <= 0 || !img.current) return;
      await imgLoad.current;
      const factor = min / max;
      const dir = diameterA < diameterB ? 3 : 1;
      const url = imageEdit.trapezoid(previewCanvas.current || img.current, {
        dir,
        factor,
        fixSize: true,
        returnType: 'base64',
      }) as string;
      setPreviewImgUrl(url);
    };
    updatePreview();
  }, [diameterA, diameterB]);

  const handleApply = async () => {
    const max = Math.max(diameterA, diameterB);
    const min = Math.min(diameterA, diameterB);
    if (max === min) {
      if (elem.getAttribute('data-trapezoid')) {
        const base64Img = await imageEdit.generateBase64Image(
          imgUrl,
          shading,
          threshold,
          isFullColor
        );
        imageEdit.addBatchCommand('Image Edit: invert', elem, {
          origImage: imgUrl,
          'xlink:href': base64Img,
        });
      }
      onClose();
      return;
    }
    if (max <= 0 || min <= 0 || !img.current) {
      onClose();
      return;
    }
    progressCaller.openNonstopProgress({ id: 'rotary-warped', message: t.processing });
    await imgLoad.current;
    const { width: origW, height: origH } = img.current;
    const source = rotation ? rotateImage(origW, origH, rotation, img.current) : img.current;
    let corners = [
      [0, 0],
      [origW, 0],
      [origW, origH],
      [0, origH],
    ];
    if (rotation) corners = rotateCorners(origW, origH, rotation, corners);
    const factor = min / max;
    const dir = diameterA < diameterB ? 3 : 1;
    let result = imageEdit.trapezoid(source, {
      dir,
      factor,
      returnType: 'canvas',
      fixSize: true,
    }) as HTMLCanvasElement;
    corners = imageEdit.calculateTrapezoidPoints(corners, source.width, source.height, {
      dir,
      factor,
      fixSize: true,
    });
    if (rotation) {
      corners = rotateCorners(result.width, result.height, -rotation, corners);
      result = rotateImage(result.width, result.height, -rotation, result);
      const [maxX, maxY, minX, minY] = corners.reduce(
        (acc, [x, y]) => {
          acc[0] = Math.max(acc[0], x);
          acc[1] = Math.max(acc[1], y);
          acc[2] = Math.min(acc[2], x);
          acc[3] = Math.min(acc[3], y);
          return acc;
        },
        [0, 0, Infinity, Infinity]
      );
      const dw = Math.floor(Math.min(minX, result.width - maxX));
      const dh = Math.floor(Math.min(minY, result.height - maxY));
      const newCanvas = document.createElement('canvas');
      const newW = result.width - dw * 2;
      const newH = result.height - dh * 2;
      newCanvas.width = newW;
      newCanvas.height = newH;
      const ctx = newCanvas.getContext('2d');
      ctx.drawImage(result, dw, dh, newW, newH, 0, 0, newW, newH);
      result = newCanvas;
    }
    const blob = await new Promise<Blob>((resolve) => result.toBlob(resolve));
    const url = URL.createObjectURL(blob);
    const base64Img = await imageEdit.generateBase64Image(url, shading, threshold, isFullColor);
    const changes: { [key: string]: string | number } = { origImage: url, 'xlink:href': base64Img };
    if (origW !== result.width) {
      const wRatio = result.width / origW;
      const curX = parseFloat(elem.getAttribute('x'));
      const curWidth = parseFloat(elem.getAttribute('width'));
      const newWidth = curWidth * wRatio;
      const newX = curX + (curWidth - newWidth) / 2;
      changes.x = newX;
      changes.width = newWidth;
    }
    if (origH !== result.height) {
      const hRatio = result.height / origH;
      const curY = parseFloat(elem.getAttribute('y'));
      const curHeight = parseFloat(elem.getAttribute('height'));
      const newHeight = curHeight * hRatio;
      const newY = curY + (curHeight - newHeight) / 2;
      changes.y = newY;
      changes.height = newHeight;
    }
    const trapezoidData = {
      a: diameterA,
      b: diameterB,
      origImage: imgUrl,
    };
    changes['data-trapezoid'] = JSON.stringify(trapezoidData);
    imageEdit.addBatchCommand('Image Edit: invert', elem, changes);
    // uppdate object panel
    svgEditor.updateContextPanel();
    progressCaller.popById('rotary-warped');
    onClose();
  };

  const renderSVG = () => {
    if (!img.current) return null;
    let { width, height } = previewCanvas.current || img.current;
    const longSide = Math.max(width, height);
    width /= longSide;
    height /= longSide;
    const l = (0.5 - width / 2) * 100;
    const r = (0.5 + width / 2) * 100;
    let aRatio = 1;
    let bRatio = 1;
    if (diameterA > diameterB) aRatio = diameterB / diameterA;
    else bRatio = diameterA / diameterB;
    const aTop = (0.5 - (height / 2) * aRatio) * 100;
    const aBottom = (0.5 + (height / 2) * aRatio) * 100;
    const bTop = (0.5 - (height / 2) * bRatio) * 100;
    const bBottom = (0.5 + (height / 2) * bRatio) * 100;

    return (
      <svg>
        <line className={styles.gray} x1={`${l}%`} x2={`${r}%`} y1={`${aTop}%`} y2={`${bTop}%`} />
        <line
          className={styles.gray}
          x1={`${l}%`}
          x2={`${r}%`}
          y1={`${aBottom}%`}
          y2={`${bBottom}%`}
        />
        <ellipse className={styles.blue} cx={`${l}%`} cy={`${aTop}%`} rx="4" ry="4" />
        <ellipse className={styles.blue} cx={`${l}%`} cy={`${aBottom}%`} rx="4" ry="4" />
        <line
          className={styles.blue}
          x1={`${l}%`}
          x2={`${l}%`}
          y1={`${aTop}%`}
          y2={`${aBottom}%`}
        />
        <ellipse className={styles.orange} cx={`${r}%`} cy={`${bTop}%`} rx="4" ry="4" />
        <ellipse className={styles.orange} cx={`${r}%`} cy={`${bBottom}%`} rx="4" ry="4" />
        <line
          className={styles.orange}
          x1={`${r}%`}
          x2={`${r}%`}
          y1={`${bTop}%`}
          y2={`${bBottom}%`}
        />
      </svg>
    );
  };

  return (
    <Modal
      open
      centered
      width={630}
      maskClosable={false}
      title={t.rotary_warped}
      onCancel={onClose}
      footer={
        <div className={styles.footer}>
          <div>
            <Button
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
            >
              {t.compare}
            </Button>
          </div>
          <div>
            <Button onClick={onClose}>{t.cancel}</Button>
            <Button type="primary" onClick={handleApply}>
              {t.warp}
            </Button>
          </div>
        </div>
      }
    >
      <div className={styles.container}>
        <div className={styles.thumbnail}>
          <div className={styles['img-container']}>
            <img src={originalImgUrl || imgUrl} style={{ opacity: showOriginal ? 1 : 0 }} />
            <img src={previewImgUrl || imgUrl} style={{ opacity: showOriginal ? 0 : 1 }} />
            {renderSVG()}
          </div>
        </div>
        <div className={styles.controls}>
          <img className={styles.diagram} src="core-img/image-edit/rotary-warped-example.png" />
          <Segmented
            id="input_type"
            value={inputType}
            onChange={(val: number) => setInputType(val)}
            options={segmentOptions}
          />
          <div className={styles.inputs}>
            <div className={styles.control}>
              <div className={styles.title}>
                <label htmlFor="input_a">{`${segmentOptions[inputType].label} A`}</label>
              </div>
              <UnitInput
                id="input_a"
                className={styles.input}
                value={inputType === 0 ? diameterA : diameterA * Math.PI}
                min={0.01}
                addonAfter={isInch ? 'in' : 'mm'}
                isInch={isInch}
                precision={isInch ? 4 : 2}
                onChange={(val) => setDiaMeterA(inputType === 0 ? val : val / Math.PI)}
              />
            </div>
            <div className={styles.control}>
              <div className={styles.title}>
                <label htmlFor="input_b">{`${segmentOptions[inputType].label} B`}</label>
              </div>
              <UnitInput
                id="input_b"
                className={styles.input}
                value={inputType === 0 ? diameterB : diameterB * Math.PI}
                min={0.01}
                addonAfter={isInch ? 'in' : 'mm'}
                isInch={isInch}
                precision={isInch ? 4 : 2}
                onChange={(val) => setDiaMeterB(inputType === 0 ? val : val / Math.PI)}
              />
            </div>
            <div>
              <Button
                className={styles.link}
                type="link"
                onClick={() => browser.open(t.rotary_warped_link)}
              >
                {lang.alert.learn_more}
                <AlertIcons.ExtLink className={styles.icon} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RotaryWarped;

export const showRotaryWarped = (elem?: SVGImageElement): void => {
  if (isIdExist('rotary-warped')) return;
  let targetElem = elem;
  if (!targetElem) {
    const selectedElements = svgCanvas.getSelectedElems();
    if (selectedElements.length !== 1) return;
    targetElem = selectedElements[0] as SVGImageElement;
  }
  if (!targetElem) return;
  addDialogComponent(
    'rotary-warped',
    <RotaryWarped elem={targetElem} onClose={() => popDialogById('rotary-warped')} />
  );
};
