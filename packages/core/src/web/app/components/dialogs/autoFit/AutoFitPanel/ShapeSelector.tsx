import classNames from 'classnames';
import React, { Dispatch, memo, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Carousel, ConfigProvider } from 'antd';

import useI18n from 'helpers/useI18n';
import { AutoFitContour } from 'interfaces/IAutoFit';

import styles from './ShapeSelector.module.scss';

interface Props {
  contours: AutoFitContour[];
  focusedIndex: number;
  setFocusedIndex: Dispatch<SetStateAction<number>>;
  onNext: () => void;
}

const ShapeSelector = ({ contours, focusedIndex, setFocusedIndex, onNext }: Props): JSX.Element => {
  const SHAPE_SIZE = 96;
  const { buttons: tButtons, auto_fit: tAutoFit } = useI18n();
  const [shouldUpdateCarousel, setShouldUpdateCarousel] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shapePerPage, setShapePerPage] = useState(1);
  const pageCount = useMemo(
    () => Math.ceil(contours.length / shapePerPage),
    [contours.length, shapePerPage]
  );
  const contourComponents = useMemo(
    () =>
      contours.map((contourObj) => {
        const { contour, bbox } = contourObj;
        return (
          <svg viewBox={bbox.join(' ')} className={styles.svg}>
            <path d={contour.map(([x, y], k) => `${k === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')} />
          </svg>
        );
      }),
    [contours]
  );

  const carouselPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < pageCount; i += 1) {
      const shapes = [];
      for (let j = 0; j < shapePerPage; j += 1) {
        const index = i * shapePerPage + j;
        if (index >= contourComponents.length) break;
        const key = `group-${index}`;
        shapes.push(
          <button
            key={key}
            className={classNames(styles.shape, { [styles.selected]: index === focusedIndex })}
            style={{ width: SHAPE_SIZE, height: SHAPE_SIZE }}
            type="button"
            onClick={() => setFocusedIndex(index)}
          >
            {contourComponents[index]}
          </button>
        );
      }
      pages.push(
        <div key={`page-${i}`}>
          <div className={styles.page} style={{ height: contentRef.current?.clientHeight }}>
            {shapes}
          </div>
        </div>
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
    if (shouldUpdateCarousel) setShouldUpdateCarousel(false);
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
            <Carousel dotPosition="right" adaptiveHeight>
              {carouselPages}
            </Carousel>
          </ConfigProvider>
        )}
      </div>
      <div className={styles.footer}>
        <Button className={styles.btn} type="primary" onClick={onNext}>
          {tButtons.next}
        </Button>
      </div>
    </div>
  );
};

export default memo(ShapeSelector);
