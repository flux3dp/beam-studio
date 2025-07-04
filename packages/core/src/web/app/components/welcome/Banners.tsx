import { useRef } from 'react';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { useIsMobile } from '@core/helpers/system-helper';
import browser from '@core/implementations/browser';

import styles from './Banners.module.scss';

interface IBanner {
  mobileSrc: string;
  src: string;
  url: string;
}

const Banners = () => {
  const isMobile = useIsMobile();
  const scrollRef = useRef({ page: 1, scrolling: false });
  const bannersRef = useRef<HTMLDivElement | null>(null);

  const banners: IBanner[] = [
    {
      mobileSrc: 'https://cdn.dmkt.io/banners/190067cc-e710-4928-b344-e5037742cf5e-16-9.png',
      src: 'https://cdn.dmkt.io/banners/190067cc-e710-4928-b344-e5037742cf5e-16-5.png',
      url: 'https://dmkt.io/zh-TW/products/t/new-arrival',
    },
    {
      mobileSrc: 'https://cdn.dmkt.io/banners/77fec8b8-68a6-4be3-bc56-d82f01e80bef-16-9.jpg',
      src: 'https://cdn.dmkt.io/banners/77fec8b8-68a6-4be3-bc56-d82f01e80bef-16-5.jpg',
      url: 'https://dmkt.io/zh-TW/products/t/we-recommend',
    },
  ];

  const infiniteBanners = [banners.at(-1)!, ...banners, banners[0]];

  const handlePrev = async () => {
    if (scrollRef.current.scrolling || !bannersRef.current) return;

    scrollRef.current.scrolling = true;

    console.log('handlePrev from', scrollRef.current.page);

    if (scrollRef.current.page === 0) {
      scrollRef.current.page = infiniteBanners.length - 2;
      console.log('handlePrev wrap', scrollRef.current.page);
      bannersRef.current.classList.add(styles['no-transition']);
      bannersRef.current.style.right = `${scrollRef.current.page * 100}%`;
      await new Promise((resolve) => setTimeout(resolve, 0));
      bannersRef.current.classList.remove(styles['no-transition']);
    }

    scrollRef.current.page -= 1;
    console.log('handlePrev final', scrollRef.current.page);
    bannersRef.current.style.right = `${scrollRef.current.page * 100}%`;

    setTimeout(() => {
      scrollRef.current.scrolling = false;
    }, 300);
  };

  const handleNext = async () => {
    if (scrollRef.current.scrolling || !bannersRef.current) return;

    scrollRef.current.scrolling = true;
    console.log('handlePrev from', scrollRef.current.page);

    if (scrollRef.current.page === infiniteBanners.length - 1) {
      scrollRef.current.page = 1;
      console.log('handlePrev wrap', scrollRef.current.page);
      bannersRef.current.classList.add(styles['no-transition']);
      bannersRef.current.style.right = `${scrollRef.current.page * 100}%`;
      await new Promise((resolve) => setTimeout(resolve, 0));
      bannersRef.current.classList.remove(styles['no-transition']);
    }

    scrollRef.current.page += 1;
    console.log('handlePrev final', scrollRef.current.page);
    bannersRef.current.style.right = `${scrollRef.current.page * 100}%`;

    setTimeout(() => {
      scrollRef.current.scrolling = false;
    }, 300);
  };

  return (
    <div className={styles.container}>
      <Button className={styles.prev} icon={<LeftOutlined />} onClick={handlePrev} shape="circle" />
      <Button className={styles.next} icon={<RightOutlined />} onClick={handleNext} shape="circle" />
      <div className={styles.banners} ref={bannersRef}>
        {infiniteBanners.map((banner, index) => (
          <div className={styles.banner} key={index}>
            <img onClick={() => browser.open(banner.url)} src={isMobile ? banner.mobileSrc : banner.src} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Banners;
