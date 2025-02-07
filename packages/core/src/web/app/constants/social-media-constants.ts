import i18n from '@core/helpers/i18n';

export const getSocialMedia = () => {
  const isTW = i18n.getActiveLang() === 'zh-tw';
  const langKey = isTW ? 'taiwan' : 'global';

  // Note: Update qrcode images and links at the same time
  return {
    facebook: {
      link: isTW ? 'https://www.facebook.com/flux3dp.tw' : 'https://www.facebook.com/flux3dp',
      name: 'Facebook',
      src: `core-img/social-media/facebook-${langKey}.png`,
    },
    instagram: {
      link: isTW ? 'https://www.instagram.com/fluxinctaiwan/' : 'https://www.instagram.com/flux_inc/',
      name: 'Instagram',
      src: `core-img/social-media/instagram-${langKey}.png`,
    },
    youtube: {
      link: isTW ? 'https://www.youtube.com/@FLUXIncTaiwan' : 'https://www.youtube.com/@fluxinc',
      name: 'YouTube',
      src: `core-img/social-media/youtube-${langKey}.png`,
    },
  };
};
