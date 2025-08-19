import NozzleMode from './NozzleMode';
import NozzleOffset from './NozzleOffset';

const NozzleBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }) => {
  return (
    <>
      <NozzleMode type={type} />
      <NozzleOffset type={type} />
    </>
  );
};

export default NozzleBlock;
