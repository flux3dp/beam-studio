import React, { useMemo } from 'react';

import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

import ContextMenu from '@core/app/widgets/ContextMenu';
import { todo } from '@core/helpers/is-dev';

import styles from './CanvasControls.module.scss';
import type { ProjectionMode, TransformMode, ViewPreset } from './viewStore';
import { useViewStore } from './viewStore';

todo('i18n for the inner engraving canvas controls, currently hard-coded English');

const VIEW_OPTIONS: Array<{ label: string; value: Exclude<ViewPreset, 'custom'> }> = [
  { label: 'Iso', value: 'isometric' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
];

const PROJECTION_OPTIONS: Array<{ label: string; value: ProjectionMode }> = [
  { label: 'Perspective', value: 'perspective' },
  { label: 'Orthographic', value: 'orthographic' },
];

const TRANSFORM_OPTIONS: Array<{ label: string; value: TransformMode }> = [
  { label: 'Move', value: 'translate' },
  { label: 'Rotate', value: 'rotate' },
  { label: 'Scale', value: 'scale' },
];

const toMenuItems = (options: Array<{ label: string; value: string }>): MenuProps['items'] =>
  options.map(({ label, value }) => ({ key: value, label }));

const MenuSelect = ({
  items,
  onChange,
  value,
}: {
  items: MenuProps['items'];
  onChange: (value: string) => void;
  value: string;
}): React.JSX.Element => {
  const label = items?.find((item) => item && 'key' in item && item.key === value && 'label' in item)?.label ?? value;

  return (
    <ContextMenu items={items} onClick={({ key }) => onChange(key)} trigger={['contextMenu', 'click']}>
      <div className={styles.select}>
        <span>{label as React.ReactNode}</span>
        <DownOutlined className={styles.arrow} />
      </div>
    </ContextMenu>
  );
};

export const ObjectControls = (): React.JSX.Element => {
  const { setTransformMode, transformMode } = useViewStore();
  const items = useMemo(() => toMenuItems(TRANSFORM_OPTIONS), []);

  return (
    <MenuSelect items={items} onChange={(value) => setTransformMode(value as TransformMode)} value={transformMode} />
  );
};

export const ViewControls = (): React.JSX.Element => {
  const { projection, requestView, setProjection, view } = useViewStore();
  const projectionItems = useMemo(() => toMenuItems(PROJECTION_OPTIONS), []);
  const viewItems = useMemo(() => toMenuItems(VIEW_OPTIONS), []);

  return (
    <div className={styles.controls}>
      <MenuSelect
        items={viewItems}
        onChange={(value) => requestView(value as Exclude<ViewPreset, 'custom'>)}
        value={view.preset}
      />
      <div className={styles.divider} />
      <MenuSelect
        items={projectionItems}
        onChange={(value) => setProjection(value as ProjectionMode)}
        value={projection}
      />
    </div>
  );
};
