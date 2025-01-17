/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-len */
import React from 'react';
import Icon from '@ant-design/icons';
import type { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';

import Play from './play.svg';

const Trash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="1em" height="1em" viewBox="0 0 32 32">
    <defs>
      <clipPath id="clip-icon-trash">
        <rect width="32" height="32" />
      </clipPath>
    </defs>
    <g id="icon-trash" clipPath="url(#clip-icon-trash)">
      <g id="Group_44" data-name="Group 44" transform="translate(-703.447 -218.136)">
        <path fill="currentColor" id="Path_94" data-name="Path 94" d="M727.279,226.981l-4.726-.011v-1.236a1.6,1.6,0,0,0-1.6-1.6h-3.121a1.6,1.6,0,0,0-1.6,1.6v.474c0,.241-.006.544-.013.755l-4.606.016a.671.671,0,0,0-.669.669v.235a.671.671,0,0,0,.669.669h15.664a.67.67,0,0,0,.669-.669v-.236A.671.671,0,0,0,727.279,226.981ZM721,225.891v.883a.187.187,0,0,1-.186.187h-2.748a.187.187,0,0,1-.187-.187v-.883a.187.187,0,0,1,.187-.187h2.748A.187.187,0,0,1,721,225.891Z" transform="translate(0 0)" />
        <path fill="currentColor" id="Path_95" data-name="Path 95" d="M725.553,228.71l-.591-.052a.439.439,0,0,0-.314.1.416.416,0,0,0-.138.206L723.387,241.5c-.05.792-.415.792-.535.792l-7.1.021c-.4-.031-.445-.7-.446-.717l-1.15-12.506A.429.429,0,0,0,714,228.8a.4.4,0,0,0-.319-.1l-.592.053a.425.425,0,0,0-.293.148.433.433,0,0,0-.1.319l1.156,13.064a1.494,1.494,0,0,0,1.444,1.529l8.045-.034a1.214,1.214,0,0,0,.844-.281,2.02,2.02,0,0,0,.619-1.461l1.137-12.851A.434.434,0,0,0,725.553,228.71Z" transform="translate(0.128 0.329)" />
        <path id="Path_96" data-name="Path 96" d="M717.029,240.539a.536.536,0,0,0,.073,0,.642.642,0,0,0,.567-.711l-1.051-9.251a.643.643,0,1,0-1.278.144l1.05,9.251A.644.644,0,0,0,717.029,240.539Z" transform="translate(0.32 0.427)" fill="currentColor" />
        <path id="Path_97" data-name="Path 97" d="M719.632,239.895v-9.251a.643.643,0,1,0-1.286,0v9.251a.643.643,0,1,0,1.286,0Z" transform="translate(0.539 0.427)" fill="currentColor" />
        <path id="Path_98" data-name="Path 98" d="M721.017,240.539a.643.643,0,0,0,.639-.582l.891-9.251a.646.646,0,0,0-.579-.7.653.653,0,0,0-.7.579l-.89,9.251a.645.645,0,0,0,.579.7Z" transform="translate(0.687 0.427)" fill="currentColor" />
      </g>
    </g>
  </svg>
);

const DmktSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32">
    <g id="Group_73" data-name="Group 73" transform="translate(7.687 8.269)">
      <path d="M48.613,0c.478-.014.619.135.612.619-.027,2.041-.023,3.845,0,5.886.005.489-.158.621-.638.6a6.96,6.96,0,0,1-6.5-6.461c-.04-.572.154-.655.644-.64Z" transform="translate(-32.61 0)" fill="#484949" />
      <path d="M42.758,43.71c-.545.019-.738-.111-.691-.711a6.924,6.924,0,0,1,6.271-6.381c.646-.06.906.055.883.8l-.006,5.611c.007.513-.135.7-.662.682Z" transform="translate(-32.596 -28.368)" fill="#484949" />
      <path d="M0,.954V15.119a.646.646,0,0,0,.681.609H.7C5.35,15.783,9.082,12,9.082,8.037A7.956,7.956,0,0,0,.7.347.646.646,0,0,0,0,.938c0,.005,0,.01,0,.016" transform="translate(0 -0.268)" fill="#484949" />
    </g>
  </svg>
);

const commonStyle = { marginRight: '0.2em' };

export const TrashIcon = (props: Partial<CustomIconComponentProps>): JSX.Element => (
  <Icon component={Trash} style={commonStyle} {...props} />
);

export const DmktIcon = (props: Partial<CustomIconComponentProps>): JSX.Element => (
  <Icon component={DmktSvg} style={commonStyle} {...props} />
);

export default {
  Play,
};
