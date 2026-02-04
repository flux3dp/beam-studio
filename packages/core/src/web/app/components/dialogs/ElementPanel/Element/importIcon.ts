import type { ComponentType } from 'react';

const importIcon = (key: string): Promise<ComponentType> =>
  import(`@core/app/icons/shape/${key}.svg`).then((module) => module.default);

export default importIcon;
