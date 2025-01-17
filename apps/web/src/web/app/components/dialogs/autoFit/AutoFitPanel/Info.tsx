import React, { memo, useEffect, useRef } from 'react';

import AlertIcons from 'app/icons/alerts/AlertIcons';
import browser from 'implementations/browser';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import rotateBBox from 'app/svgedit/utils/rotateBBox';
import useI18n from 'helpers/useI18n';
import { getRotationAngle } from 'app/svgedit/transform/rotation';
import { getSVGAsync } from 'helpers/svg-editor-helper';

import styles from './Info.module.scss';

let svgCanvas: ISVGCanvas;
getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface Props {
  element: SVGElement;
}

const Info = ({ element }: Props): JSX.Element => {
  const { auto_fit: t } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (svgRef.current) {
      const bbox =
        element.tagName === 'use'
          ? svgCanvas.getSvgRealLocation(element)
          : svgCanvas.calculateTransformedBBox(element);
      const angle = getRotationAngle(element);
      let { x, y, width, height } = rotateBBox(bbox, angle);
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
        <button
          className={styles.link}
          type="button"
          onClick={() => browser.open(t.learn_more_url)}
        >
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
