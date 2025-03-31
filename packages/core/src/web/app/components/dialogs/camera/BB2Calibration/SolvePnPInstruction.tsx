import type React from 'react';

import useI18n from '@core/helpers/useI18n';

import Instruction from '../common/Instruction';

interface Props {
  onClose: (completed?: boolean) => void;
  onNext: () => Promise<void> | void;
  onPrev: () => Promise<void> | void;
}

const SolvePnPInstruction = ({ onClose, onNext, onPrev }: Props): React.JSX.Element => {
  const { calibration: t } = useI18n();

  return (
    <Instruction
      animationSrcs={[
        { src: 'video/bb2-calibration/3-align.webm', type: 'video/webm' },
        { src: 'video/bb2-calibration/3-align.mp4', type: 'video/mp4' },
      ]}
      buttons={[
        { label: t.back, onClick: onPrev },
        { label: t.next, onClick: onNext, type: 'primary' },
      ]}
      onClose={() => onClose(false)}
      steps={[t.solve_pnp_step1, t.solve_pnp_step2]}
      title={t.solve_pnp_title}
    />
  );
};

export default SolvePnPInstruction;
