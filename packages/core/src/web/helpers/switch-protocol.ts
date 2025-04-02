import isWeb from './is-web';

const switchProtocol = (protocol?: 'http:' | 'https:'): void => {
  if (!isWeb()) {
    return;
  }

  const urlObj = new URL(window.location.href);

  if (protocol === urlObj.protocol) {
    return;
  }

  urlObj.protocol = protocol ?? (urlObj.protocol === 'http:' ? 'https:' : 'http:');
  urlObj.hash = '';

  if (urlObj.protocol === 'https:' && urlObj.host === 'http.studio.flux3dp.com') {
    urlObj.host = 'studio.flux3dp.com';
  } else if (urlObj.protocol === 'http:' && urlObj.host === 'studio.flux3dp.com') {
    urlObj.host = 'http.studio.flux3dp.com';
  }

  window.location.href = urlObj.href;
};

export default switchProtocol;
