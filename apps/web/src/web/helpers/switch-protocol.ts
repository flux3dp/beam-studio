import isWeb from './is-web';

const switchProtocol = (protocol?: string): void => {
  if (!isWeb()) return;
  const urlObj = new URL(window.location.href);
  if (protocol === urlObj.protocol) return;
  urlObj.protocol = protocol ?? (urlObj.protocol === 'http:' ? 'https:' : 'http:');
  urlObj.hash = '';
  window.location.href = urlObj.href;
};

export default switchProtocol;
