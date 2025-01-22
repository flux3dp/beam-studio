import React, { memo, useEffect, useRef } from 'react';

import AlertIcons from '@core/app/icons/alerts/AlertIcons';
import { getRotationAngle } from '@core/app/svgedit/transform/rotation';
import rotateBBox from '@core/app/svgedit/utils/rotateBBox';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import browser from '@app/implementations/browser';

import styles from './Info.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface Props {
  element: SVGElement;
}

const Info = ({ element }: Props): React.JSX.Element => {
  const { auto_fit: t } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      const bbox =
        element.tagName === 'use' ? svgCanvas.getSvgRealLocation(element) : svgCanvas.calculateTransformedBBox(element);
      const angle = getRotationAngle(element);
      let { height, width, x, y } = rotateBBox(bbox, angle);
      const padding = 0.1;

      x -= padding * width;
      y -= padding * height;
      width *= 1 + padding * 2;
      height *= 1 + padding * 2;
      svgRef.current.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }
      svgRef.current.appendChild(element.cloneNode(true));
    }
  }, [element]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <button className={styles.link} onClick={() => browser.open(t.learn_more_url)} type="button">
          {t.learn_more}
          <AlertIcons.ExtLink className={styles.icon} />
        </button>
        <ol className={styles.steps}>
          <li>{t.step1}</li>
          <li>{t.step2}</li>
          <li>{t.step3}</li>
        </ol>
      </div>
      <div className={styles.artwork}>
        <div className={styles.text}>{t.selected_artwork}:</div>
        <svg className={styles.svg} ref={svgRef} />
      </div>
    </div>
  );
};

export default memo(Info);
