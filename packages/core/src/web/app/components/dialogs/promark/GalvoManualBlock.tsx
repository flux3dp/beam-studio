import React from 'react';

import { Button, Flex, InputNumber } from 'antd';
import classNames from 'classnames';

import UnitInput from '@core/app/widgets/UnitInput';
import type { GalvoPreviewTuning } from '@core/helpers/device/galvoExec';

import blockStyles from './Block.module.scss';

export interface GalvoSpot {
  durationUs: number;
  x: number;
  y: number;
}

/** Which action is in flight, so only that button spins and the rest simply wait. */
export type GalvoAction = 'connect' | 'disconnect' | 'dot' | 'mark' | 'move' | 'preview';

interface Props {
  isInch: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onDot: () => void;
  onMove: () => void;
  pending: GalvoAction | null;
  /** Half the field: the furthest the mirrors reach from the lens centre. */
  reach: number;
  setSpot: (spot: GalvoSpot) => void;
  setTuning: (tuning: GalvoPreviewTuning) => void;
  spot: GalvoSpot;
  tuning: GalvoPreviewTuning;
}

/**
 * Preview pacing. Every box is optional: left empty it is not sent at all, and the machine uses its
 * own value -- the placeholders are what those currently are, shown for reference rather than kept
 * here, so there is only ever one copy of them to go out of date.
 *
 * These reach only the preview: a real pass goes round once at the marking speed, and the card
 * restores its own jump timing afterwards. To watch it step, raise the dwell; to watch it draw,
 * lower the speed and the dwell together.
 */
const TUNING_FIELDS = [
  { key: 'previewStepMm', label: 'Step', max: undefined, min: 0.1, placeholder: '10', unit: 'mm' },
  { key: 'jumpSpeed', label: 'Jump speed', max: undefined, min: 1, placeholder: '4000', unit: 'mm/s' },
  { key: 'jumpDelayUs', label: 'Dwell per step', max: 65535, min: 0, placeholder: '0', unit: 'us' },
  { key: 'previewRounds', label: 'Rounds per list', max: undefined, min: 1, placeholder: '1', unit: '' },
] as const satisfies ReadonlyArray<{
  key: keyof GalvoPreviewTuning;
  label: string;
  max?: number;
  min: number;
  placeholder: string;
  unit: string;
}>;

/**
 * Coupling the head, pointing the mirrors, and burning a dot where they point.
 *
 * Coordinates are field mm from the lens centre, which is what the card speaks; where that lands on
 * the work also depends on where the gantry is parked, and none of this moves it. Pointing leaves
 * the card unarmed, so only the dot can fire -- at the mark power set above.
 *
 * TODO: dev only, hence the untranslated labels.
 */
const GalvoManualBlock = ({
  isInch,
  onConnect,
  onDisconnect,
  onDot,
  onMove,
  pending,
  reach,
  setSpot,
  setTuning,
  spot,
  tuning,
}: Props): React.JSX.Element => {
  const busy = pending !== null;

  return (
    <Flex className={classNames(blockStyles.block, blockStyles['full-row'])} gap={8} vertical>
      <div className={blockStyles.title}>Manual (dev)</div>
      <Flex align="center" gap={8} wrap>
        <Button disabled={busy} loading={pending === 'connect'} onClick={onConnect} size="small">
          Connect
        </Button>
        {/* Parks the head without closing: the dialog otherwise leaves it coupled on purpose. */}
        <Button disabled={busy} loading={pending === 'disconnect'} onClick={onDisconnect} size="small">
          Disconnect
        </Button>
      </Flex>
      <Flex align="center" gap={16} wrap>
        {(['x', 'y'] as const).map((axis) => (
          <Flex align="center" className={blockStyles.row} gap={8} key={axis}>
            <span className={blockStyles.label}>{axis.toUpperCase()}</span>
            <UnitInput
              addonAfter={isInch ? 'in' : 'mm'}
              className={blockStyles.input}
              data-testid={`spot-${axis}`}
              isInch={isInch}
              max={reach}
              min={-reach}
              onChange={(value) => {
                if (value !== null) setSpot({ ...spot, [axis]: value });
              }}
              precision={isInch ? 5 : 3}
              size="small"
              value={spot[axis]}
            />
          </Flex>
        ))}
        <Flex align="center" className={blockStyles.row} gap={8}>
          <span className={blockStyles.label}>Dwell</span>
          <UnitInput
            addonAfter="us"
            className={blockStyles.input}
            data-testid="spot-duration"
            min={1}
            onChange={(value) => {
              if (value !== null) setSpot({ ...spot, durationUs: value });
            }}
            precision={0}
            size="small"
            value={spot.durationUs}
          />
        </Flex>
      </Flex>
      <Flex align="center" gap={8} wrap>
        <Button disabled={busy} loading={pending === 'move'} onClick={onMove} size="small">
          Move
        </Button>
        <Button disabled={busy} loading={pending === 'dot'} onClick={onDot} size="small">
          Dot
        </Button>
      </Flex>
      <div className={blockStyles.subtitle}>預覽參數</div>
      <Flex align="center" gap={16} wrap>
        {TUNING_FIELDS.map(({ key, label, max, min, placeholder, unit }) => (
          <Flex align="center" className={blockStyles.row} gap={8} key={key}>
            <span className={blockStyles.label}>{label}</span>
            <InputNumber
              addonAfter={unit || undefined}
              className={blockStyles.input}
              data-testid={key}
              max={max}
              min={min}
              onChange={(value) => setTuning({ ...tuning, [key]: value ?? undefined })}
              placeholder={placeholder}
              size="small"
              value={tuning[key] ?? null}
            />
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
};

export default GalvoManualBlock;
