import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Checkbox, Flex, InputNumber } from 'antd';
import classNames from 'classnames';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import UnitInput from '@core/app/widgets/UnitInput';
import getOpenCV from '@core/helpers/api/open-cv';
import { getFixBacklash, setFixBacklash } from '@core/helpers/device/galvoCalibration/backlash';
import { captureCoupon } from '@core/helpers/device/galvoCalibration/capture';
import type { CapturedCoupon } from '@core/helpers/device/galvoCalibration/captureGrid';
import { CAPTURE_AIM_INSET_MM } from '@core/helpers/device/galvoCalibration/captureGrid';
import {
  L_FRAME_MARK_FEEDRATE,
  markCoupon,
  markLFrame,
  markSquare,
  stationFor,
  stationProblem,
  STITCH_SQUARE_MM,
  stitchStations,
  stitchTest,
} from '@core/helpers/device/galvoCalibration/mark';
import type { CalibrationRound, ScaleSuggestion, SolveResult } from '@core/helpers/device/galvoCalibration/solve';
import { buildSolveParams, suggestScales } from '@core/helpers/device/galvoCalibration/solve';
import type { GalvoConfig, GalvoModule } from '@core/helpers/device/galvoConfig';
import type { GalvoPoint } from '@core/helpers/device/galvoExec';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import blockStyles from './Block.module.scss';
import type { GalvoAction } from './GalvoManualBlock';
import type { MarkParameters } from './ParametersBlock';

interface Props {
  config: GalvoConfig;
  device: IDeviceInfo;
  isInch: boolean;
  module: GalvoModule;
  offsets: GalvoPoint;
  /** Apply the suggested scales to the settings on screen (not to the machine). */
  onApplyScales: (scales: { scaleX: number; scaleY: number }) => void;
  parameters: MarkParameters;
  pending: GalvoAction | null;
  run: (action: GalvoAction, label: string, body: () => Promise<void>) => Promise<void>;
}

const DEFAULT_CENTER: GalvoPoint = { x: 100, y: 100 };

const fmt = (value: null | number | undefined, digits = 4): string =>
  value === null || value === undefined ? '—' : value.toFixed(digits);

/**
 * The field-lens calibration loop (PRD docs/prd/hexa-ii-galvo/hexa-g-galvo-calibration.md): mark
 * the coupon and its ruler, photograph them, solve, apply the suggestion, and check the result
 * with three stitched squares. Every button couples or parks the head itself.
 *
 * TODO: dev only, hence the untranslated labels; the release flow is meant to be a step-by-step
 * dialog of its own (PRD §11 decision 6).
 */
const GalvoCalibrationBlock = ({
  config,
  device,
  isInch,
  module,
  offsets,
  onApplyScales,
  parameters,
  pending,
  run,
}: Props): React.JSX.Element => {
  const model = device.model as WorkAreaModel;
  const [center, setCenter] = useState<GalvoPoint>(DEFAULT_CENTER);
  const [lFrame, setLFrame] = useState({ feedrate: L_FRAME_MARK_FEEDRATE, passes: 1, power: 3 });
  /** The result on screen is a photograph loaded from a file, not a capture: solved as one. */
  const [isPhotograph, setIsPhotograph] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const [fixBacklash, setFix] = useState(getFixBacklash);
  const [step, setStep] = useState<null | string>(null);
  const [captured, setCaptured] = useState<CapturedCoupon | null>(null);
  const [captureWarnings, setCaptureWarnings] = useState<string[]>([]);
  const [aimInset, setAimInset] = useState(CAPTURE_AIM_INSET_MM);
  const [solved, setSolved] = useState<null | { result: SolveResult; suggestion: ScaleSuggestion }>(null);
  const [annotatedUrl, setAnnotatedUrl] = useState<null | string>(null);
  const [rounds, setRounds] = useState<CalibrationRound[]>([]);
  /** The scales the coupon on the bed was marked with; what a solved round records as "sent". */
  const markedWith = useRef<null | { scaleX: number; scaleY: number }>(null);
  const cancelRequested = useRef(false);

  const busy = pending !== null;
  const station = stationFor(center, offsets);
  const problem = stationProblem(model, station);
  const stitchProblem = useMemo(
    () =>
      stitchStations(center, offsets)
        .map((s) => stationProblem(model, s))
        .find(Boolean) ?? null,
    [center, model, offsets],
  );

  // Object URLs are only released here; the results they show outlive the actions that made them.
  useEffect(
    () => () => {
      if (captured) URL.revokeObjectURL(captured.url);
    },
    [captured],
  );
  useEffect(
    () => () => {
      if (annotatedUrl) URL.revokeObjectURL(annotatedUrl);
    },
    [annotatedUrl],
  );

  // Esc cancels a capture after the tile in progress. Only listened to while capturing.
  useEffect(() => {
    if (pending !== 'capture') return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelRequested.current = true;
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pending]);

  const withStep = async (body: () => Promise<void>) => {
    try {
      await body();
    } finally {
      setStep(null);
    }
  };

  const site = { center, fixBacklash, model, offsets };
  const { power, speed } = parameters;

  const handleCoupon = () =>
    run('coupon', 'Mark coupon', () =>
      withStep(async () => {
        await markCoupon({ ...site, config, module, onStep: setStep, power, speed });
        markedWith.current = { scaleX: config.galvoParameters.x.scale, scaleY: config.galvoParameters.y.scale };
      }),
    );

  const handleSquare = () =>
    run('square', 'Mark square', () =>
      withStep(() => markSquare({ ...site, config, module, onStep: setStep, power, speed })),
    );

  const handleLFrame = () =>
    run('lframe', 'Mark L frame', () =>
      withStep(() =>
        markLFrame({
          ...site,
          feedrate: lFrame.feedrate,
          onStep: setStep,
          passes: lFrame.passes,
          power: lFrame.power,
        }),
      ),
    );

  const handleCapture = () =>
    run('capture', 'Capture', () =>
      withStep(async () => {
        cancelRequested.current = false;

        setCaptureWarnings([]);

        const result = await captureCoupon({
          aimInsetMm: aimInset,
          center,
          isCancelled: () => cancelRequested.current,
          model,
          onProgress: (done, total) => setStep(`Capturing ${done}/${total} (Esc to stop)`),
          onStep: setStep,
          onWarning: (message) => setCaptureWarnings((warnings) => [...warnings, message]),
        });

        if (result) {
          setCaptured(result);
          setIsPhotograph(false);
          setSolved(null);
          setAnnotatedUrl(null);
        }
      }),
    );

  /**
   * A photograph of the sheet from any camera, a phone included: the solver finds the coupon
   * and fits a projective ruler, so the scale and origin given here are only a starting point
   * (an image of about 250 mm across, centred on the sheet).
   */
  const handlePhotograph = async (file: File | null | undefined) => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const { height, width } = await new Promise<{ height: number; width: number }>((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve({ height: img.naturalHeight, width: img.naturalWidth });
      img.onerror = () => reject(new Error('Not an image'));
      img.src = url;
    });
    const pxPerMm = Math.max(width, height) / 250;

    setCaptured({
      blob: file,
      heightPx: height,
      originMm: { x: center.x - width / 2 / pxPerMm, y: center.y - height / 2 / pxPerMm },
      pxPerMm,
      url,
      widthPx: width,
    });
    setIsPhotograph(true);
    setCaptureWarnings([]);
    setSolved(null);
    setAnnotatedUrl(null);
  };

  const handleSolve = () =>
    run('solve', 'Solve', () =>
      withStep(async () => {
        if (!captured) return;

        setStep('Solving');

        const params = buildSolveParams(captured, config, { center, photograph: isPhotograph });
        let answer: { annotated: Blob | null; result: SolveResult };

        try {
          answer = await getOpenCV().solveGalvoCoupon<SolveResult>(captured.blob, params);
        } catch (error) {
          // fluxghost's refusals carry a reason the generic formatter drops (RULER_INVALID: why)
          const { info, reason } = (error ?? {}) as { info?: string; reason?: string };

          throw info ? new Error(`${info}${reason ? `: ${reason}` : ''}`) : error;
        }

        const { annotated, result } = answer;
        const sent = markedWith.current ?? {
          scaleX: config.galvoParameters.x.scale,
          scaleY: config.galvoParameters.y.scale,
        };
        const round: CalibrationRound = {
          measured: {
            affine_rms: result.affine_rms,
            scale_x: result.scale_x,
            scale_y: result.scale_y,
            skew_deg: result.skew_deg,
          },
          sent,
        };

        setSolved({ result, suggestion: suggestScales(round, rounds) });
        setRounds((cur) => [...cur, round]);
        setAnnotatedUrl(annotated ? URL.createObjectURL(annotated) : null);
      }),
    );

  const handleApply = () => {
    if (!solved) return;

    const { scaleX, scaleY } = solved.suggestion;

    onApplyScales({
      scaleX: scaleX ?? config.galvoParameters.x.scale,
      scaleY: scaleY ?? config.galvoParameters.y.scale,
    });
  };

  const handleStitch = () =>
    run('stitch', 'Stitch test', () =>
      withStep(() => stitchTest({ ...site, config, module, onStep: setStep, power, speed })),
    );

  const toggleFix = (value: boolean) => {
    setFixBacklash(value);
    setFix(value);
  };

  const result = solved?.result;
  const suggestion = solved?.suggestion;

  return (
    <Flex className={classNames(blockStyles.block, blockStyles['full-row'])} gap={8} vertical>
      <div className={blockStyles.title}>Calibration (dev)</div>
      <Flex align="center" gap={16} wrap>
        <span>Field centre on bed</span>
        {(['x', 'y'] as const).map((axis) => (
          <Flex align="center" className={blockStyles.row} gap={8} key={axis}>
            <span className={blockStyles.label}>{axis.toUpperCase()}</span>
            <UnitInput
              addonAfter={isInch ? 'in' : 'mm'}
              className={blockStyles.input}
              data-testid={`calibration-center-${axis}`}
              isInch={isInch}
              onChange={(value) => {
                if (value !== null) setCenter({ ...center, [axis]: value });
              }}
              precision={isInch ? 4 : 2}
              size="small"
              value={center[axis]}
            />
          </Flex>
        ))}
        <span data-testid="calibration-station" style={problem ? { color: '#d4380d' } : undefined}>
          Gantry station: ({station.x}, {station.y}){problem ? ` — ${problem}` : ''}
        </span>
      </Flex>
      <Flex align="center" gap={8} wrap>
        <Button
          data-testid="mark-coupon"
          disabled={busy || Boolean(problem)}
          loading={pending === 'coupon'}
          onClick={handleCoupon}
          size="small"
        >
          Mark coupon
        </Button>
        <Button
          data-testid="mark-square"
          disabled={busy || Boolean(problem)}
          loading={pending === 'square'}
          onClick={handleSquare}
          size="small"
        >
          Mark {STITCH_SQUARE_MM} mm square
        </Button>
        <span>(mark parameters above; factory used 25% / 500 mm/s)</span>
        <Button
          data-testid="mark-lframe"
          disabled={busy}
          loading={pending === 'lframe'}
          onClick={handleLFrame}
          size="small"
        >
          Mark L frame
        </Button>
        <Flex align="center" className={blockStyles.row} gap={8}>
          <span className={blockStyles.label}>Power</span>
          <InputNumber
            addonAfter="%"
            className={classNames(blockStyles.input, blockStyles.short)}
            data-testid="lframe-power"
            max={100}
            min={0}
            onChange={(value) => setLFrame({ ...lFrame, power: value ?? 0 })}
            size="small"
            value={lFrame.power}
          />
        </Flex>
        <Flex align="center" className={blockStyles.row} gap={8}>
          <span className={blockStyles.label}>Feed</span>
          <InputNumber
            addonAfter="mm/min"
            className={classNames(blockStyles.input, blockStyles.short)}
            data-testid="lframe-feedrate"
            max={6000}
            min={100}
            onChange={(value) => setLFrame({ ...lFrame, feedrate: value ?? L_FRAME_MARK_FEEDRATE })}
            precision={0}
            size="small"
            value={lFrame.feedrate}
          />
        </Flex>
        <Flex align="center" className={blockStyles.row} gap={8}>
          <span className={blockStyles.label}>Passes</span>
          <InputNumber
            className={classNames(blockStyles.input, blockStyles.short)}
            data-testid="lframe-passes"
            max={10}
            min={1}
            onChange={(value) => setLFrame({ ...lFrame, passes: value ?? 1 })}
            precision={0}
            size="small"
            value={lFrame.passes}
          />
        </Flex>
      </Flex>
      <Flex align="center" gap={8} wrap>
        <Button
          data-testid="capture"
          disabled={busy}
          loading={pending === 'capture'}
          onClick={handleCapture}
          size="small"
        >
          Capture
        </Button>
        <Flex align="center" className={blockStyles.row} gap={8}>
          <span
            className={blockStyles.label}
            title="Where in the frame each tile is aimed: mm in from the edge nearest the head"
          >
            Aim inset
          </span>
          <InputNumber
            addonAfter="mm"
            className={classNames(blockStyles.input, blockStyles.short)}
            data-testid="capture-aim-inset"
            max={200}
            min={25}
            onChange={(value) => setAimInset(value ?? CAPTURE_AIM_INSET_MM)}
            size="small"
            value={aimInset}
          />
        </Flex>
        <Button data-testid="load-photograph" disabled={busy} onClick={() => photoInput.current?.click()} size="small">
          Load photograph
        </Button>
        <input
          accept="image/*"
          data-testid="photograph-input"
          hidden
          onChange={(e) => {
            handlePhotograph(e.target.files?.[0]);
            e.target.value = '';
          }}
          ref={photoInput}
          type="file"
        />
        <Button
          data-testid="solve"
          disabled={busy || !captured}
          loading={pending === 'solve'}
          onClick={handleSolve}
          size="small"
        >
          Solve
        </Button>
        <Button data-testid="apply-suggestion" disabled={busy || !solved} onClick={handleApply} size="small">
          Apply suggestion
        </Button>
        <Button
          data-testid="stitch-test"
          disabled={busy || Boolean(stitchProblem)}
          loading={pending === 'stitch'}
          onClick={handleStitch}
          size="small"
          title={stitchProblem ?? undefined}
        >
          Stitch test
        </Button>
        <Checkbox checked={fixBacklash} data-testid="fix-backlash" onChange={(e) => toggleFix(e.target.checked)}>
          Fix backlash
        </Checkbox>
      </Flex>
      {step && <div data-testid="calibration-step">{step}</div>}
      {captureWarnings.length > 0 && (
        <ul data-testid="capture-warnings" style={{ color: '#b45309', margin: 0, paddingLeft: 20 }}>
          {captureWarnings.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {captured && (
        <Flex align="flex-start" gap={16}>
          <a href={captured.url} rel="noreferrer" target="_blank">
            <img alt="captured coupon" src={captured.url} style={{ border: '1px solid #ccc', width: 180 }} />
          </a>
          {annotatedUrl && (
            <a href={annotatedUrl} rel="noreferrer" target="_blank">
              <img alt="solver annotation" src={annotatedUrl} style={{ border: '1px solid #ccc', width: 180 }} />
            </a>
          )}
          <span>
            {captured.widthPx}×{captured.heightPx} px, {captured.pxPerMm} px/mm, origin ({captured.originMm.x},{' '}
            {captured.originMm.y}){' '}
            <a data-testid="save-stitched" download="galvo-coupon-stitched.png" href={captured.url}>
              Save PNG
            </a>
            {captured.savedTo && (
              <>
                <br />
                Frames, patches and this image kept in {captured.savedTo}
              </>
            )}
          </span>
        </Flex>
      )}
      {result && suggestion && (
        <table data-testid="solve-result">
          <tbody>
            <tr>
              <td>Ruler</td>
              <td>
                {fmt(result.ruler.px_per_mm_x, 3)} / {fmt(result.ruler.px_per_mm_y, 3)} px/mm,{' '}
                {result.ruler.vertices_used} vertices, RMS {fmt(result.ruler.rms_mm, 3)} mm
                {result.ruler.model ? ` (${result.ruler.model})` : ''}
                {result.located ? `, coupon located at ${fmt(result.located.px_per_mm, 2)} px/mm` : ''}
                {result.rotated_deg ? `, image turned ${result.rotated_deg}°` : ''}
              </td>
            </tr>
            <tr>
              <td>Nodes found</td>
              <td style={result.nodes_found < 70 ? { color: '#d4380d' } : undefined}>{result.nodes_found} / 81</td>
            </tr>
            <tr>
              <td>scale_x / scale_y</td>
              <td>
                {fmt(result.scale_x)} / {fmt(result.scale_y)}
              </td>
            </tr>
            <tr>
              <td>skew / rotation</td>
              <td>
                {fmt(result.skew_deg, 3)}° / {fmt(result.rotation_deg, 3)}°{result.mirrored ? ' (mirrored)' : ''}
                {result.orientation ? ` — orientation from ${result.orientation.source}` : ''}
              </td>
            </tr>
            <tr>
              <td>Affine residual RMS / max</td>
              <td>
                {fmt(result.affine_rms, 3)} / {fmt(result.affine_max, 3)} mm
              </td>
            </tr>
            <tr>
              <td>Raw error RMS / max</td>
              <td>
                {fmt(result.raw_rms, 3)} / {fmt(result.raw_max, 3)} mm
              </td>
            </tr>
            <tr>
              <td>Validation affine / bilinear</td>
              <td>
                {fmt(result.validation_affine, 3)} / {fmt(result.validation_bilinear, 3)} mm
              </td>
            </tr>
            <tr>
              <td>Field centre in L frame</td>
              <td>
                {result.field_center_mm
                  ? `(${fmt(result.field_center_mm[0], 3)}, ${fmt(result.field_center_mm[1], 3)}) mm from the designed centre`
                  : '—'}
              </td>
            </tr>
            <tr>
              <td>Suggested scaleX / scaleY</td>
              <td data-testid="suggestion">
                {fmt(suggestion.scaleX, 2)} / {fmt(suggestion.scaleY, 2)} (Y slope {suggestion.slopeY.toFixed(6)},{' '}
                {suggestion.slopeYSource})
              </td>
            </tr>
          </tbody>
        </table>
      )}
      {rounds.length > 0 && (
        <table data-testid="rounds">
          <thead>
            <tr>
              <th>Round</th>
              <th>Sent scaleX / scaleY</th>
              <th>scale_x / scale_y</th>
              <th>skew</th>
              <th>Affine RMS</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  {round.sent.scaleX} / {round.sent.scaleY}
                </td>
                <td>
                  {fmt(round.measured.scale_x)} / {fmt(round.measured.scale_y)}
                </td>
                <td>{fmt(round.measured.skew_deg, 3)}</td>
                <td>{fmt(round.measured.affine_rms, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Flex>
  );
};

export default GalvoCalibrationBlock;
