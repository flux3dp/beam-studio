let cache: 'Chrome' | 'Edge' | 'Firefox' | 'Safari' | 'IE' | 'Unknown' | null = null;

export const getBrowser = (): 'Chrome' | 'Edge' | 'Firefox' | 'Safari' | 'IE' | 'Unknown' => {
  if (cache) {
    return cache;
  }
  const { userAgent } = navigator;
  // Detect Chrome
  if (/Chrome/.test(userAgent) && !/Chromium/.test(userAgent) && !/Edg/.test(userAgent)) {
    cache = 'Chrome';
    return 'Chrome';
  }
  // Detect Chromium-based Edge
  if (/Edg/.test(userAgent)) {
    cache = 'Edge';
    return 'Edge';
  }
  // Detect Firefox
  if (/Firefox/.test(userAgent)) {
    cache = 'Firefox';
    return 'Firefox';
  }
  // Detect Safari
  if (/Safari/.test(userAgent)) {
    cache = 'Safari';
    return 'Safari';
  }
  // Detect Internet Explorer
  if (/Trident/.test(userAgent)) {
    cache = 'IE';
    return 'IE';
  }
  cache = 'Unknown';
  return 'Unknown';
};

export default {
  getBrowser,
};
