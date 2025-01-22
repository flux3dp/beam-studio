import './clipper_unminified';
// TODO: remove public/js/lib/clipper_unminified.js after update web external dependencies

declare global {
  interface Window {
    ClipperLib: any;
  }
}

const getClipperLib = (): any => {
  // ClipperLib is exposed in clipper_unminified.js line 78, 79
  if (typeof document !== 'undefined') {
    return window.ClipperLib;
  }

  return self.ClipperLib;
};

export default getClipperLib;
