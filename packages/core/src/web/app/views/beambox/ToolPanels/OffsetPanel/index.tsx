import React from 'react';

import { match, P } from 'ts-pattern';

import { useStorageStore } from '@core/app/stores/storageStore';
import SelectView from '@core/app/widgets/Select';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import type { OffsetMode } from '@core/helpers/clipper/offset/constants';
import useI18n from '@core/helpers/useI18n';

// Assuming AccordionSection is in the same directory
import AccordionSection from './AccordionSection';

export type OffsetProp = {
  cornerType: 'round' | 'sharp';
  distance: number;
  mode: OffsetMode;
};

interface Props {
  offset: OffsetProp;
  setCornerType: (cornerType: 'round' | 'sharp') => void;
  setDistance: (distance: number) => void;
  setMode: (mode: OffsetMode) => void;
}

function OffsetPanel({
  offset: { cornerType, distance, mode },
  setCornerType,
  setDistance,
  setMode,
}: Props): React.JSX.Element {
  const lang = useI18n().beambox.tool_panels;
  const isInch = useStorageStore((state) => state.isInch);
  const handleModeChange = (newMode: OffsetMode) => {
    setMode(newMode);

    const newDistance = ['expand', 'shrink'].includes(newMode) ? 0.05 : 5;

    setDistance(newDistance);
  };

  const getDisplayString = (input: 'round' | 'sharp' | OffsetMode) =>
    match(input)
      .with(P.union('outward', 'inward', 'round', 'sharp'), (key) => lang._offset[key])
      .with('expand', () => 'Expand')
      .with('shrink', () => 'Shrink')
      .exhaustive();

  const offsetOptions = [
    { label: lang._offset.outward, value: 'outward' },
    { label: lang._offset.inward, value: 'inward' },
    // { label: LANG._offset.expand, value: 'expand' },
    // { label: LANG._offset.shrink, value: 'shrink' },
  ].map((option) => ({ ...option, selected: mode === option.value }));

  const cornerTypeOptions = [
    { label: lang._offset.sharp, value: 'sharp' },
    { label: lang._offset.round, value: 'round' },
  ].map((option) => ({ ...option, selected: cornerType === option.value }));

  return (
    <>
      <AccordionSection title={lang._offset.direction} value={getDisplayString(mode)}>
        <div className="control offset-dir">
          <SelectView
            id="select-offset-dir"
            onChange={(e) => handleModeChange(e.target.value as OffsetMode)}
            options={offsetOptions}
          />
        </div>
      </AccordionSection>

      <AccordionSection title={lang._offset.corner_type} value={getDisplayString(cornerType)}>
        <div className="control offset-corner">
          <SelectView
            id="select-offset-corner"
            onChange={(e) => setCornerType(e.target.value as 'round' | 'sharp')}
            options={cornerTypeOptions}
          />
        </div>
      </AccordionSection>

      <AccordionSection
        title={lang._offset.dist}
        value={isInch ? `${(distance / 25.4).toFixed(3)}"` : `${distance} mm`}
      >
        <div className="control offset-dist">
          <UnitInput
            defaultValue={distance}
            getValue={setDistance}
            max={['expand', 'shrink'].includes(mode) ? 1 : undefined}
            min={0}
            unit="mm"
          />
        </div>
      </AccordionSection>
    </>
  );
}

export default OffsetPanel;
