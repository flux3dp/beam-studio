import { useCallback, useMemo } from 'react';

import type { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';

interface UseTextPathOperationsParams {
  elem: Element;
  onConfigChange: <T extends keyof any>(key: T, value: any) => void;
}

export const useTextPathOperations = ({ elem, onConfigChange }: UseTextPathOperationsParams) => {
  const handleStartOffsetChange = useCallback(
    (val: number) => {
      textPathEdit.setStartOffset(val, elem as SVGGElement);
      onConfigChange('startOffset', val);
    },
    [elem, onConfigChange],
  );

  const handleVerticalAlignChange = useCallback(
    (val: VerticalAlign) => {
      textPathEdit.setVerticalAlign(val, elem as SVGGElement);
      onConfigChange('verticalAlign', val);
    },
    [elem, onConfigChange],
  );

  return useMemo(
    () => ({
      handleStartOffsetChange,
      handleVerticalAlignChange,
    }),
    [handleStartOffsetChange, handleVerticalAlignChange],
  );
};
