import React from 'react';

import { match, P } from 'ts-pattern';

import { useStorageStore } from '@core/app/stores/storageStore';
import SelectView from '@core/app/widgets/Select';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import type { OffsetMode } from '@core/helpers/clipper/offset/constants';
import i18n from '@core/helpers/i18n';

// Assuming AccordionSection is in the same directory
import AccordionSection from './AccordionSection';

const LANG = i18n.lang.beambox.tool_panels;

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
  const isInch = useStorageStore((state) => state.isInch);
  const handleModeChange = (newMode: OffsetMode) => {
    setMode(newMode);

    const newDistance = ['expand', 'shrink'].includes(newMode) ? 0.05 : 5;

    setDistance(newDistance);
  };

  const getDisplayString = (input: 'round' | 'sharp' | OffsetMode) =>
    match(input)
      .with(P.union('outward', 'inward', 'round', 'sharp'), (key) => LANG._offset[key])
      .with('expand', () => 'Expand')
      .with('shrink', () => 'Shrink')
      .exhaustive();

  const offsetOptions = [
    { label: LANG._offset.outward, value: 'outward' },
    { label: LANG._offset.inward, value: 'inward' },
    // { label: LANG._offset.expand, value: 'expand' },
    // { label: LANG._offset.shrink, value: 'shrink' },
  ].map((option) => ({ ...option, selected: mode === option.value }));

  const cornerTypeOptions = [
    { label: LANG._offset.sharp, value: 'sharp' },
    { label: LANG._offset.round, value: 'round' },
  ].map((option) => ({ ...option, selected: cornerType === option.value }));

  return (
    <>
      <AccordionSection title={LANG._offset.direction} value={getDisplayString(mode)}>
        <div className="control offset-dir">
          <SelectView
            id="select-offset-dir"
            onChange={(e) => handleModeChange(e.target.value as OffsetMode)}
            options={offsetOptions}
          />
        </div>
      </AccordionSection>

      <AccordionSection title={LANG._offset.corner_type} value={getDisplayString(cornerType)}>
        <div className="control offset-corner">
          <SelectView
            id="select-offset-corner"
            onChange={(e) => setCornerType(e.target.value as 'round' | 'sharp')}
            options={cornerTypeOptions}
          />
        </div>
      </AccordionSection>

      <AccordionSection
        title={LANG._offset.dist}
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
