import React, { memo } from 'react';

import NumberBlock from './NumberBlock';

/**
 * Dev-only controls for the per-layer printing padding overrides (printingTopPadding /
 * printingBotPadding), in px slice rows like the global ptp / pbp. These configs have no
 * default value; NumberBlock tolerates the missing store entry until initState populates it.
 */
const PrintingPaddingBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.ReactNode => {
  return (
    <>
      <NumberBlock
        configKey="printingTopPadding"
        id="printingTopPadding"
        max={100}
        min={0}
        title="Printing Top Padding"
        type={type}
        unit="px"
      />
      <NumberBlock
        configKey="printingBotPadding"
        id="printingBotPadding"
        max={100}
        min={0}
        title="Printing Bot Padding"
        type={type}
        unit="px"
      />
    </>
  );
};

export default memo(PrintingPaddingBlock);
