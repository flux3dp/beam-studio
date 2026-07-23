import type { CommonProps } from '@core/interfaces/ConfigOption';

import NozzleMode from './NozzleMode';
import NozzleOffset from './NozzleOffset';

const NozzleBlock = (props: CommonProps) => {
  return (
    <>
      <NozzleMode {...props} />
      <NozzleOffset {...props} />
    </>
  );
};

export default NozzleBlock;
