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
import { controlConfig, LaserType } from '@core/app/constants/promark-constants';
import UnitInput from '@core/app/widgets/UnitInput';
import { calculateGalvoScale, generateMoveTask, generatePulseTask } from '@core/helpers/device/promark/dev-control';
import { generateFactoryTestCard, getFactoryTestCardName } from '@core/helpers/device/promark/factory-test-card';
import deviceMaster from '@core/helpers/device-master';
import { getDefaultConfig } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';
import dialog from '@core/implementations/dialog';
import type { Field, GalvoParameters, PromarkInfo, RedDot } from '@core/interfaces/Promark';

import blockStyles from './Block.module.scss';
import styles from './DevControlBlock.module.scss';

// mm/s, Swiftray's A_PULSE_PER_SEC / A_PULSE_PER_MM
const A_SPEED = 3200 / 63;

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
    <span>{title}</span>
    <UnitInput
      addonAfter={unit}
      className={styles.input}
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
   * for the red light, or the laser's own for marking
   */
  applyParameters: (shouldApplyRedDot: boolean) => Promise<void>;
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
  const isBusy = movingAxis !== null || isRunning;

  useEffect(() => () => clearTimeout(movingTimeout.current), []);

  const handleMove = async (axis: 'a' | 'z', distance: number) => {
    const speed = axis === 'z' ? controlConfig.zSpeed : A_SPEED;

    setMovingAxis(axis);
    try {
      await stopPreview();

      if (axis === 'z') await deviceMaster.adjustZAxis(distance);
      else await deviceMaster.adjustAAxis(distance);

      movingTimeout.current = setTimeout(() => setMovingAxis(null), (Math.abs(distance) * 1000) / speed + 500);
    } catch (error) {
      console.error('Failed to move the axis', axis, error);
      setMovingAxis(null);
    }
  };

  const handleStop = async () => {
    try {
      await deviceMaster.stop();
      await deviceMaster.waitTillStatusPredicate({
        predicate: (status) => status !== deviceConstants.status.RUNNING,
      });
    } catch (error) {
      console.error('Failed to stop the axis', error);
    } finally {
      clearTimeout(movingTimeout.current);
      setMovingAxis(null);
    }
  };

  const handleGoToPosition = async () => {
    setIsRunning(true);
    try {
      await stopPreview();
      // the red light lands where the red dot parameters put it
      await applyParameters(true);
      await deviceMaster.go(new Blob([generateMoveTask({ ...position, width })]));
    } catch (error) {
      console.error('Failed to move the galvo', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handlePulse = async () => {
    const defaultConfig = getDefaultConfig();
    const task = generatePulseTask({
      ...position,
      ...pulse,
      frequency: defaultConfig.frequency ?? 27,
      pulseWidth: info.laserType === LaserType.MOPA ? (defaultConfig.pulseWidth ?? 500) : undefined,
      width,
    });

    setIsRunning(true);
    try {
      await stopPreview();
      await applyParameters(false);
      await deviceMaster.doCalibration({ blob: new Blob([task]) });
    } catch (error) {
      if (Array.isArray(error) && error[1] === 'DOOR_OPENED') {
        await deviceMaster.stop();
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
        <span className={styles.label}>{t.move}</span>
        {(['x', 'y'] as const).map((key) => (
          <NumberCell
            key={key}
            max={width}
            onChange={(value) => setPosition((cur) => ({ ...cur, [key]: value }))}
            precision={3}
            testId={`dev-move-${key}`}
            title={key.toUpperCase()}
            unit="mm"
            value={position[key]}
          />
        ))}
        <Button data-testid="dev-move-go" disabled={isBusy} onClick={handleGoToPosition} size="small">
          {t.move}
        </Button>
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
        <Button data-testid="dev-pulse-fire" disabled={isBusy} onClick={handlePulse} size="small">
          {t.fire}
        </Button>
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
                  className={styles['scale-apply']}
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
