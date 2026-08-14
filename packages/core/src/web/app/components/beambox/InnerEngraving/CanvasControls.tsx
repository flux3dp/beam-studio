import React from 'react';

import { Segmented } from 'antd';

import { todo } from '@core/helpers/is-dev';

import styles from './CanvasControls.module.scss';
import type { ProjectionMode, TransformMode, ViewPreset } from './viewStore';
import { useViewStore } from './viewStore';

todo('i18n for the inner engraving canvas controls, currently hard-coded English');

// 'custom' is deliberately absent: when the camera is there, nothing is highlighted
const VIEW_OPTIONS: Array<{ label: string; value: Exclude<ViewPreset, 'custom'> }> = [
  { label: 'Iso', value: 'isometric' },
  { label: 'Top', value: 'top' },
  // reachable now that the orbit is no longer clamped to the upper hemisphere: an inner engraving
  // lives inside the workpiece, so its underside is a face like any other
  { label: 'Bottom', value: 'bottom' },
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
];

const PROJECTION_OPTIONS: Array<{ label: string; value: ProjectionMode }> = [
  { label: 'Persp', value: 'perspective' },
  { label: 'Ortho', value: 'orthographic' },
];

const TRANSFORM_OPTIONS: Array<{ label: string; value: TransformMode }> = [
  { label: 'Move', value: 'translate' },
  { label: 'Rotate', value: 'rotate' },
  { label: 'Scale', value: 'scale' },
];

/** Overlay for the 3D canvas: which way the camera looks and what the gizmo does. */
const CanvasControls = (): React.JSX.Element => {
  const { projection, requestView, setProjection, setTransformMode, transformMode, view } = useViewStore();

  // placement actions (centre / fit) live in the right panel's ActionsPanelStl, not here: they act
  // on the selected object, which is what the object panel is for

  return (
    <div className={styles.controls}>
      <Segmented
        onChange={(value) => setTransformMode(value as TransformMode)}
        options={TRANSFORM_OPTIONS}
        size="small"
        value={transformMode}
      />
      <Segmented
        onChange={(value) => requestView(value as Exclude<ViewPreset, 'custom'>)}
        options={VIEW_OPTIONS}
        size="small"
        value={view.preset}
      />
      <Segmented
        onChange={(value) => setProjection(value as ProjectionMode)}
        options={PROJECTION_OPTIONS}
        size="small"
        value={projection}
      />
    </div>
  );
};

export default CanvasControls;
