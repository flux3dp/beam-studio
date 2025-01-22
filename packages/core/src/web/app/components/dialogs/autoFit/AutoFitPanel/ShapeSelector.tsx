import type { Dispatch, SetStateAction } from 'react';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Carousel, ConfigProvider } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import styles from './ShapeSelector.module.scss';

interface Props {
  contours: AutoFitContour[];
  focusedIndex: number;
  onNext: () => void;
  setFocusedIndex: Dispatch<SetStateAction<number>>;
}

const ShapeSelector = ({ contours, focusedIndex, onNext, setFocusedIndex }: Props): React.JSX.Element => {
  const SHAPE_SIZE = 96;
  const { auto_fit: tAutoFit, buttons: tButtons } = useI18n();
  const [shouldUpdateCarousel, setShouldUpdateCarousel] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shapePerPage, setShapePerPage] = useState(1);
  const pageCount = useMemo(() => Math.ceil(contours.length / shapePerPage), [contours.length, shapePerPage]);
  const contourComponents = useMemo(
    () =>
      contours.map((contourObj) => {
        const { bbox, contour } = contourObj;

        return (
          <svg className={styles.svg} viewBox={bbox.join(' ')}>
            <path d={contour.map(([x, y], k) => `${k === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')} />
          </svg>
        );
      }),
    [contours],
  );

  const carouselPages = useMemo(() => {
    const pages = [];

    for (let i = 0; i < pageCount; i += 1) {
      const shapes = [];

      for (let j = 0; j < shapePerPage; j += 1) {
        const index = i * shapePerPage + j;

        if (index >= contourComponents.length) {
          break;
        }

        const key = `group-${index}`;

        shapes.push(
          <button
            className={classNames(styles.shape, { [styles.selected]: index === focusedIndex })}
            key={key}
            onClick={() => setFocusedIndex(index)}
            style={{ height: SHAPE_SIZE, width: SHAPE_SIZE }}
            type="button"
          >
            {contourComponents[index]}
          </button>,
        );
      }
      pages.push(
        <div key={`page-${i}`}>
          <div className={styles.page} style={{ height: contentRef.current?.clientHeight }}>
            {shapes}
          </div>
        </div>,
      );
    }

    return pages;
  }, [pageCount, shapePerPage, contourComponents, focusedIndex, setFocusedIndex]);

  useEffect(() => {
    const handler = () => {
      if (contentRef.current) {
        setShapePerPage(Math.floor(contentRef.current?.clientHeight / SHAPE_SIZE));
        setShouldUpdateCarousel(true);
      }
    };

    window.addEventListener('resize', handler);
    handler();

    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => {
    if (shouldUpdateCarousel) {
      setShouldUpdateCarousel(false);
    }
  }, [shouldUpdateCarousel]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>{tAutoFit.select_a_pattern}</div>
      <div className={styles.content} ref={contentRef}>
        {!shouldUpdateCarousel && (
          <ConfigProvider
            theme={{
              token: {
                colorBgContainer: '#000000',
              },
            }}
          >
            <Carousel adaptiveHeight dotPosition="right">
              {carouselPages}
            </Carousel>
          </ConfigProvider>
        )}
      </div>
      <div className={styles.footer}>
        <Button className={styles.btn} onClick={onNext} type="primary">
          {tButtons.next}
        </Button>
      </div>
    </div>
  );
};

export default memo(ShapeSelector);
