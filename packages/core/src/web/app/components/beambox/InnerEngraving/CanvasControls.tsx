import React, { useMemo } from 'react';

import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

import ContextMenu from '@core/app/widgets/ContextMenu';
import useI18n from '@core/helpers/useI18n';

import styles from './CanvasControls.module.scss';
import type { ProjectionMode, TransformMode, ViewPreset } from './viewStore';
import { useViewStore } from './viewStore';

const toMenuItems = (options: Array<{ label: string; value: string }>): MenuProps['items'] =>
  options.map(({ label, value }) => ({ key: value, label }));

const MenuSelect = ({
  fallbackLabel,
  items,
  onChange,
  value,
}: {
  fallbackLabel?: React.ReactNode;
  items: MenuProps['items'];
  onChange: (value: string) => void;
  value: string;
}): React.JSX.Element => {
  const selected = items?.find((item) => item && 'key' in item && item.key === value);
  const label = selected && 'label' in selected ? selected.label : (fallbackLabel ?? value);

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
  const { canvas_controls: t } = useI18n().inner_engraving;
  const { setTransformMode, transformMode } = useViewStore();
  const items = useMemo(
    () =>
      toMenuItems([
        { label: t.move, value: 'translate' satisfies TransformMode },
        { label: t.rotate, value: 'rotate' satisfies TransformMode },
        { label: t.scale, value: 'scale' satisfies TransformMode },
      ]),
    [t],
  );

  return (
    <MenuSelect items={items} onChange={(value) => setTransformMode(value as TransformMode)} value={transformMode} />
  );
};

export const ViewControls = (): React.JSX.Element => {
  const { canvas_controls: t } = useI18n().inner_engraving;
  const { projection, requestView, setProjection, view } = useViewStore();
  const projectionItems = useMemo(
    () =>
      toMenuItems([
        { label: t.perspective, value: 'perspective' satisfies ProjectionMode },
        { label: t.orthographic, value: 'orthographic' satisfies ProjectionMode },
      ]),
    [t],
  );
  const viewItems = useMemo(
    () =>
      toMenuItems([
        { label: t.isometric, value: 'isometric' satisfies Exclude<ViewPreset, 'custom'> },
        { label: t.top, value: 'top' satisfies Exclude<ViewPreset, 'custom'> },
        { label: t.bottom, value: 'bottom' satisfies Exclude<ViewPreset, 'custom'> },
        { label: t.front, value: 'front' satisfies Exclude<ViewPreset, 'custom'> },
        { label: t.back, value: 'back' satisfies Exclude<ViewPreset, 'custom'> },
        { label: t.left, value: 'left' satisfies Exclude<ViewPreset, 'custom'> },
        { label: t.right, value: 'right' satisfies Exclude<ViewPreset, 'custom'> },
      ]),
    [t],
  );

  return (
    <div className={styles.controls}>
      <MenuSelect
        fallbackLabel={view.preset === 'custom' ? t.custom : undefined}
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
