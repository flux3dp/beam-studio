import i18n from '@core/helpers/i18n';
import type { IMediaTutorial } from '@core/interfaces/ITutorial';

export const gestureIntroduction: IMediaTutorial[] = [
  {
    description: i18n.lang.tutorial.gesture.pan,
    mediaSources: [{ src: 'img/touch-drag.svg', type: 'image/svg+xml' }],
  },
  {
    description: i18n.lang.tutorial.gesture.zoom,
    mediaSources: [{ src: 'img/touch-zoom.svg', type: 'image/svg+xml' }],
  },
  {
    description: i18n.lang.tutorial.gesture.click,
    isVideo: true,
    mediaSources: [
      { src: 'video/touch-select.webm', type: 'video/webm' },
      { src: 'video/touch-select.mov', type: 'video/quicktime' },
    ],
  },
  {
    description: i18n.lang.tutorial.gesture.drag,
    isVideo: true,
    mediaSources: [
      { src: 'video/touch-multiselect.webm', type: 'video/webm' },
      { src: 'video/touch-multiselect.mov', type: 'video/quicktime' },
    ],
  },
  {
    description: i18n.lang.tutorial.gesture.hold,
    isVideo: true,
    mediaSources: [
      { src: 'video/touch-contextmenu.webm', type: 'video/webm' },
      { src: 'video/touch-contextmenu.mov', type: 'video/quicktime' },
    ],
  },
];

export default {
  gestureIntroduction,
};
