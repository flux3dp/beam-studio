import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { Fragment, useEffect, useRef, useState } from 'react';

import { ArrowDownOutlined, ArrowUpOutlined, RotateLeftOutlined, RotateRightOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import classNames from 'classnames';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import alertConstants from '@core/app/constants/alert-constants';
import deviceConstants from '@core/app/constants/device-constants';
import { controlConfig } from '@core/app/constants/promark-constants';
import UnitInput from '@core/app/widgets/UnitInput';
import {
  calculateGalvoScale,
  generateMoveTask,
  generatePulseTask,
  getPulseLaserSettings,
} from '@core/helpers/device/promark/dev-control';
import { generateFactoryTestCard, getFactoryTestCardName } from '@core/helpers/device/promark/factory-test-card';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import dialog from '@core/implementations/dialog';
import type { Field, GalvoParameters, PromarkInfo, RedDot } from '@core/interfaces/Promark';

import blockStyles from './Block.module.scss';
import styles from './DevControlBlock.module.scss';

// mm/s, Swiftray's A_PULSE_PER_SEC / A_PULSE_PER_MM
const A_SPEED = 3200 / 63;

/** [column, row] of the corners, edge midpoints and centre of the field, row by row */
const NINE_POINTS = Array.from({ length: 9 }, (_, i) => [i % 3, Math.floor(i / 3)] as const);

interface AxisRowProps {
  disabled: boolean;
  isMoving: boolean;
  label: string;
  negativeIcon: ReactNode;
  onMove: (distance: number) => void;
  onStop: () => void;
  positiveIcon: ReactNode;
  stopLabel: string;
  testId: string;
}

const AxisRow = ({
  disabled,
  isMoving,
  label,
  negativeIcon,
  onMove,
  onStop,
  positiveIcon,
  stopLabel,
  testId,
}: AxisRowProps): React.JSX.Element => {
  const [distance, setDistance] = useState(1);

  return (
    <Flex align="center" gap={8}>
      <span className={styles.label}>{label}</span>
      <Button
        data-testid={`${testId}-positive`}
        disabled={disabled}
        icon={positiveIcon}
        onClick={() => onMove(distance)}
        size="small"
      />
      <UnitInput
        addonAfter="mm"
        className={styles.input}
        controls={false}
        data-testid={`${testId}-distance`}
        max={100}
        min={0.01}
        onChange={(value) => setDistance(value ?? 1)}
        precision={2}
        size="small"
        value={distance}
      />
      <Button
        data-testid={`${testId}-negative`}
        disabled={disabled}
        icon={negativeIcon}
        onClick={() => onMove(-distance)}
        size="small"
      />
      <Button danger data-testid={`${testId}-stop`} disabled={!isMoving} onClick={onStop} size="small">
        {stopLabel}
      </Button>
    </Flex>
  );
};

interface NumberCellProps {
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  precision: number;
  testId: string;
  title: string;
  unit: string;
  value: number;
}

/** A title and its input, as two cells of the aligned grid. */
const NumberCell = ({ max, min = 0, onChange, precision, testId, title, unit, value }: NumberCellProps) => (
  <>
    <span className={styles.title}>{title}</span>
    <UnitInput
      addonAfter={unit}
      className={styles.input}
      controls={false}
      data-testid={testId}
      max={max}
      min={min}
      onChange={(newValue) => {
        if (newValue !== null && newValue !== undefined) onChange(newValue);
      }}
      precision={precision}
      size="small"
      value={value}
    />
  </>
);

interface Props {
  /**
   * sends the lens parameters being edited to the machine, with the red dot parameters applied on top
   * for the red light, or the laser's own for marking; false when nothing was sent (dialog closing)
   */
  applyParameters: (shouldApplyRedDot: boolean) => Promise<boolean>;
  field: Field;
  galvoParameters: GalvoParameters;
  info: PromarkInfo;
  redDot: RedDot;
  /** the board's serial number, which is what Swiftray reports as the device serial */
  serial: string;
  setGalvoParameters: Dispatch<SetStateAction<GalvoParameters>>;
  /** stops the red light preview when it is running */
  stopPreview: () => Promise<void>;
  /** the field size of the lens being edited, mm */
  width: number;
}

// Dev-only tools for the production line
const stopMachine = async () => {
  try {
    await deviceMaster.stop();
  } catch (error) {
    console.error('Failed to stop the machine', error);
  }
};

const DevControlBlock = ({
  applyParameters,
  field,
  galvoParameters,
  info,
  redDot,
  serial,
  setGalvoParameters,
  stopPreview,
  width,
}: Props): React.JSX.Element => {
  const {
    monitor: tMonitor,
    promark_settings: { dev_control: t },
  } = useI18n();
  const [movingAxis, setMovingAxis] = useState<'a' | 'z' | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [position, setPosition] = useState({ x: width / 2, y: width / 2 });
  const [pulse, setPulse] = useState({ power: 50, time: 100 });
  const [measured, setMeasured] = useState({ x: width, y: width });
  const movingTimeout = useRef<NodeJS.Timeout>(undefined);
  // read by the unmount cleanup, which only sees the state of the first render
  const isMovingRef = useRef(false);
  // Handlers await (stopping the preview, applying the lens) before they send their command; a dialog
  // closed meanwhile must not get an axis moving or a pulse fired after it is gone.
  const isUnmountedRef = useRef(false);
  // Bumped by every axis move and by Stop: a move whose id is no longer current was stopped (or
  // replaced) while it waited, and must not start
  const moveIdRef = useRef(0);
  const isBusy = movingAxis !== null || isRunning;

  const setMoving = (axis: 'a' | 'z' | null) => {
    isMovingRef.current = axis !== null;
    setMovingAxis(axis);
  };

  useEffect(
    () => () => {
      isUnmountedRef.current = true;
      clearTimeout(movingTimeout.current);

      // An axis move runs for as long as its distance takes (up to about half a minute) and only this
      // block can stop it: closing the dialog or switching the lens mid-move must not leave it running.
      if (isMovingRef.current) stopMachine();
    },
    [],
  );

  const handleMove = async (axis: 'a' | 'z', distance: number) => {
    const speed = axis === 'z' ? controlConfig.zSpeed : A_SPEED;
    const id = ++moveIdRef.current;
    const isCancelled = () => isUnmountedRef.current || moveIdRef.current !== id;

    setMoving(axis);
    try {
      await stopPreview();

      if (isCancelled()) return;

      if (axis === 'z') await deviceMaster.adjustZAxis(distance);
      else await deviceMaster.adjustAAxis(distance);

      // Stopped or closed while the move was being sent: that stop may have reached the machine before
      // the move did, so stop once more
      if (isCancelled()) {
        await stopMachine();

        return;
      }

      movingTimeout.current = setTimeout(() => setMoving(null), (Math.abs(distance) * 1000) / speed + 500);
    } catch (error) {
      console.error('Failed to move the axis', axis, error);
      setMoving(null);
    }
  };

  const handleStop = async () => {
    // cancels a move still waiting to be sent
    moveIdRef.current += 1;
    try {
      await deviceMaster.stop();
      await deviceMaster.waitTillStatusPredicate({
        predicate: (status) => status !== deviceConstants.status.RUNNING,
      });
    } catch (error) {
      console.error('Failed to stop the axis', error);
    } finally {
      clearTimeout(movingTimeout.current);
      setMoving(null);
    }
  };

  const handleGoToPosition = async () => {
    setIsRunning(true);
    try {
      await stopPreview();

      if (isUnmountedRef.current) return;

      // the red light lands where the red dot parameters put it
      if (!(await applyParameters(true)) || isUnmountedRef.current) return;

      await deviceMaster.go(new Blob([generateMoveTask({ ...position, width })]));
    } catch (error) {
      console.error('Failed to move the galvo', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handlePulse = async () => {
    const task = generatePulseTask({
      ...position,
      ...pulse,
      ...getPulseLaserSettings(info, pulse.power),
      width,
    });

    setIsRunning(true);
    try {
      await stopPreview();

      if (isUnmountedRef.current) return;

      if (!(await applyParameters(false)) || isUnmountedRef.current) return;

      await deviceMaster.doCalibration({ blob: new Blob([task]) });
    } catch (error) {
      if (Array.isArray(error) && error[1] === 'DOOR_OPENED') {
        await deviceMaster.stop();

        // no retry that would fire from a closed dialog
        if (isUnmountedRef.current) return;

        alertCaller.popUp({
          buttonType: alertConstants.RETRY_CANCEL,
          id: 'DOOR_OPENED',
          message: tMonitor.HARDWARE_ERROR_DOOR_OPENED,
          onRetry: handlePulse,
          type: alertConstants.SHOW_POPUP_ERROR,
        });
      } else {
        console.error('Failed to fire the pulse', error);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerateTestCard = async () => {
    const input = await dialogCaller.getPromptValue({ caption: t.generate_test_card, message: t.focus_distance });

    if (input === null) return;

    const focusDistance = input.trim() ? Number(input) : Number.NaN;

    if (!Number.isFinite(focusDistance)) {
      alertCaller.popUpError({ message: sprintf(t.focus_distance_invalid, input) });

      return;
    }

    try {
      const blob = await generateFactoryTestCard({ field, focusDistance, galvoParameters, redDot, width });
      const name = getFactoryTestCardName({ info, serial, width });

      await dialog.writeFileDialog(() => blob, name, `${name}.beam`, [{ extensions: ['beam'], name: 'Beam' }]);
    } catch (error) {
      console.error('Failed to generate the factory test card', error);
      alertCaller.popUpError({ message: sprintf(t.generate_test_card_failed, String(error)) });
    }
  };

  const newGalvo = calculateGalvoScale(galvoParameters, { measuredX: measured.x, measuredY: measured.y, width });
  const isScaleChanged = newGalvo.x.scale !== galvoParameters.x.scale || newGalvo.y.scale !== galvoParameters.y.scale;

  const handleApplyScale = () => {
    setGalvoParameters(newGalvo);
    // the measurement belongs to the old scale; applying it again would correct twice
    setMeasured({ x: width, y: width });
  };

  return (
    <Flex className={blockStyles['full-row']} gap={12} vertical>
      <div className={blockStyles.title}>{t.title}</div>
      <Flex align="center" gap={8}>
        <span className={styles.label}>{t.card_no}</span>
        {serial ? (
          <Typography.Text className={styles.serial} copyable data-testid="card-serial">
            {serial}
          </Typography.Text>
        ) : (
          <span data-testid="card-serial">-</span>
        )}
        <Button
          className={styles['test-card']}
          data-testid="dev-test-card"
          onClick={handleGenerateTestCard}
          size="small"
        >
          {t.generate_test_card}
        </Button>
      </Flex>
      <AxisRow
        disabled={isBusy}
        isMoving={movingAxis === 'z'}
        label={t.z_axis}
        negativeIcon={<ArrowDownOutlined />}
        onMove={(distance) => handleMove('z', distance)}
        onStop={handleStop}
        positiveIcon={<ArrowUpOutlined />}
        stopLabel={t.stop}
        testId="dev-z"
      />
      <AxisRow
        disabled={isBusy}
        isMoving={movingAxis === 'a'}
        label={t.a_axis}
        negativeIcon={<RotateLeftOutlined />}
        onMove={(distance) => handleMove('a', distance)}
        onStop={handleStop}
        positiveIcon={<RotateRightOutlined />}
        stopLabel={t.stop}
        testId="dev-a"
      />
      <div className={styles.grid}>
        {(['x', 'y'] as const).map((key, i) => (
          <Fragment key={key}>
            {i === 0 ? <span className={styles.label}>{t.move}</span> : <span />}
            <NumberCell
              max={width}
              onChange={(value) => setPosition((cur) => ({ ...cur, [key]: value }))}
              precision={3}
              testId={`dev-move-${key}`}
              title={key.toUpperCase()}
              unit="mm"
              value={position[key]}
            />
            {i === 0 && (
              <>
                <div className={classNames(styles.side, styles.points)}>
                  {NINE_POINTS.map(([col, row]) => {
                    const point = { x: (col * width) / 2, y: (row * width) / 2 };

                    return (
                      <input
                        aria-label={`${point.x}, ${point.y}`}
                        checked={position.x === point.x && position.y === point.y}
                        data-testid={`dev-move-point-${row * 3 + col}`}
                        key={`${col}-${row}`}
                        name="dev-move-point"
                        onChange={() => setPosition(point)}
                        type="radio"
                      />
                    );
                  })}
                </div>
                <Button
                  className={styles.action}
                  data-testid="dev-move-go"
                  disabled={isBusy}
                  onClick={handleGoToPosition}
                  size="small"
                >
                  {t.move}
                </Button>
              </>
            )}
          </Fragment>
        ))}
        <span className={styles.label}>{t.pulse}</span>
        <NumberCell
          max={100}
          onChange={(value) => setPulse((cur) => ({ ...cur, power: value }))}
          precision={1}
          testId="dev-pulse-power"
          title={t.power}
          unit="%"
          value={pulse.power}
        />
        <Button
          className={styles.action}
          data-testid="dev-pulse-fire"
          disabled={isBusy}
          onClick={handlePulse}
          size="small"
        >
          {t.fire}
        </Button>
        <span />
        <NumberCell
          max={10000}
          min={1}
          onChange={(value) => setPulse((cur) => ({ ...cur, time: value }))}
          precision={0}
          testId="dev-pulse-time"
          title={t.time}
          unit="us"
          value={pulse.time}
        />
        <div className={classNames(blockStyles.hint, styles.hint)}>{sprintf(t.move_hint, width)}</div>
        {(['x', 'y'] as const).map((key, i) => {
          // the galvo axes are swapped against the canvas: the width measured along canvas X corrects scale Y
          const galvoAxis = key === 'x' ? 'y' : 'x';

          return (
            <Fragment key={key}>
              {i === 0 ? <span className={styles.label}>{t.xy_scale}</span> : <span />}
              <NumberCell
                onChange={(value) => setMeasured((cur) => ({ ...cur, [key]: value }))}
                precision={3}
                testId={`dev-measured-${key}`}
                title={key === 'x' ? t.measured_width : t.measured_height}
                unit="mm"
                value={measured[key]}
              />
              <span className={classNames(blockStyles.hint, styles['scale-change'])} data-testid={`dev-scale-${key}`}>
                {sprintf(
                  t.scale_change,
                  galvoAxis.toUpperCase(),
                  galvoParameters[galvoAxis].scale,
                  newGalvo[galvoAxis].scale,
                )}
              </span>
              {i === 0 && (
                <Button
                  className={styles.action}
                  data-testid="dev-scale-apply"
                  disabled={!isScaleChanged}
                  onClick={handleApplyScale}
                  size="small"
                >
                  {t.apply}
                </Button>
              )}
            </Fragment>
          );
        })}
        <div className={classNames(blockStyles.hint, styles.hint)}>{t.scale_hint}</div>
      </div>
    </Flex>
  );
};

export default DevControlBlock;
