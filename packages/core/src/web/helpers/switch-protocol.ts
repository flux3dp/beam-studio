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

  if (protocol === 'https:' && urlObj.host.startsWith('http.')) {
    urlObj.host = urlObj.host.substring(5);
  }

  window.location.href = urlObj.href;
};

export default switchProtocol;
