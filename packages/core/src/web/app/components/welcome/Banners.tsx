import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { useIsMobile } from '@core/helpers/system-helper';
import browser from '@core/implementations/browser';

import styles from './Banners.module.scss';

export interface IBanner {
  image_desktop: string;
  image_mobile: string;
  url: string;
}

interface Props {
  banners: IBanner[];
}

const loopInterval = 3000;
const transitionDuration = 500;

const Banners = ({ banners }: Props) => {
  const isMobile = useIsMobile();
  const scrollRef = useRef({ page: 1, scrolling: false });
  const bannersRef = useRef<HTMLDivElement | null>(null);
  const infiniteBanners = useMemo(() => [banners.at(-1)!, ...banners, banners[0]], [banners]);
  const autoLoopTimer = useRef<NodeJS.Timeout | null>(null);

  const stopAutoLoop = () => {
    if (autoLoopTimer.current) {
      clearInterval(autoLoopTimer.current);
      autoLoopTimer.current = null;
    }
  };

  const handleNext = useCallback(() => {
    if (scrollRef.current.scrolling || !bannersRef.current) return;

    stopAutoLoop();
    scrollRef.current.scrolling = true;

    if (scrollRef.current.page === infiniteBanners.length - 1) {
      scrollRef.current.page = 1;
      bannersRef.current.classList.add(styles['no-transition']);
      bannersRef.current.style.right = `${scrollRef.current.page * 100}%`;
      void bannersRef.current.offsetWidth; // Trigger reflow
      bannersRef.current.classList.remove(styles['no-transition']);
    }

    scrollRef.current.page += 1;
    bannersRef.current.style.right = `${scrollRef.current.page * 100}%`;

    setTimeout(() => {
      scrollRef.current.scrolling = false;
      autoLoopTimer.current = setTimeout(handleNext, loopInterval);
    }, transitionDuration);
  }, [infiniteBanners.length]);

  const handlePrev = useCallback(() => {
    if (scrollRef.current.scrolling || !bannersRef.current) return;

    stopAutoLoop();
    scrollRef.current.scrolling = true;

    if (scrollRef.current.page === 0) {
      scrollRef.current.page = infiniteBanners.length - 2;
      bannersRef.current.classList.add(styles['no-transition']);
      bannersRef.current.style.right = `${scrollRef.current.page * 100}%`;
      void bannersRef.current.offsetWidth;
      bannersRef.current.classList.remove(styles['no-transition']);
    }

    scrollRef.current.page -= 1;
    bannersRef.current.style.right = `${scrollRef.current.page * 100}%`;

    setTimeout(() => {
      scrollRef.current.scrolling = false;
      autoLoopTimer.current = setTimeout(handleNext, loopInterval);
    }, transitionDuration);
  }, [handleNext, infiniteBanners.length]);

  useEffect(() => {
    if (banners.length > 1) {
      autoLoopTimer.current = setTimeout(handleNext, loopInterval);
    }

    return stopAutoLoop;
  }, [banners, handleNext]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {banners.length > 1 && (
        <>
          <Button className={styles.prev} icon={<LeftOutlined />} onClick={handlePrev} shape="circle" />
          <Button className={styles.next} icon={<RightOutlined />} onClick={handleNext} shape="circle" />
        </>
      )}
      <div className={styles.banners} ref={bannersRef}>
        {infiniteBanners.map((banner, index) => (
          <div className={styles.banner} key={index}>
            <img onClick={() => browser.open(banner.url)} src={isMobile ? banner.image_mobile : banner.image_desktop} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Banners;
