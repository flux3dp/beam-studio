import React, { memo } from 'react';

import { InputNumber, Switch } from 'antd';
import classNames from 'classnames';

import IconSelectorGrid from '@core/app/widgets/IconSelectorGrid';
import useI18n from '@core/helpers/useI18n';

import { BORDER_STYLES } from '../templates/borders';
import useStampStore from '../useStampStore';

import styles from './BorderTab.module.scss';
import panelStyles from './OptionsPanel.module.scss';

/**
 * Runtime border settings: a "decorative frame" switch, then either the plain line's width (mm at the
 * export scale) and dash rows, or the frame style grid.
 */
const BorderTab = (): null | React.JSX.Element => {
  const { stamp_generator: t } = useI18n();
  const border = useStampStore((s) => s.state?.border);
  const shape = useStampStore((s) => s.template?.border?.shape ?? 'rect');
  const hasStyles = useStampStore((s) => s.template?.border?.styles !== false);
  // Same formula buildStampShape uses, so the field is right before the first build finishes.
  const pxPerMm = useStampStore((s) => {
    const { state, template } = s;

    if (!template?.border || !state) return 1;

    return template.border.bounds.width / (template.sizes[state.sizeIndex] ?? template.sizes[0]).widthMm;
  });
  const updateState = useStampStore((s) => s.updateState);

  if (!border) return null;

  const frameStyles = BORDER_STYLES[shape];
  const isFrame = border.style !== 'stroke';
  // Landscape designs get wide cells, two per row; square-ish ones use the default square cells.
  const isWide = shape === 'rect' || shape === 'oval';
  const select = (style: string) => updateState({ border: { ...border, style } });

  return (
    <div className={panelStyles.rows}>
      {hasStyles && (
        <div className={panelStyles.row}>
          <span>{t.border.frame}</span>
          <Switch checked={isFrame} onChange={(on) => select(on ? frameStyles[0].key : 'stroke')} size="small" />
        </div>
      )}
      {isFrame ? (
        <IconSelectorGrid
          className={classNames(styles.grid, { [styles.wideGrid]: isWide })}
          itemClassName={isWide ? styles.wide : undefined}
          items={frameStyles.map((s) => ({ innerHTML: s.svg, key: s.key }))}
          onSelect={select}
          selectedKey={border.style}
        />
      ) : (
        <>
          <div className={panelStyles.row}>
            <span>{t.border.line_width}</span>
            <InputNumber
              controls={false}
              max={5}
              min={0.2}
              onChange={(mm) => updateState({ border: { ...border, lineWidth: (mm ?? 0.2) * pxPerMm } })}
              precision={2}
              step={0.1}
              suffix="mm"
              value={border.lineWidth / pxPerMm}
            />
          </div>
          <div className={panelStyles.row}>
            <span>{t.border.dashed}</span>
            <Switch
              checked={border.dashed}
              onChange={(dashed) => updateState({ border: { ...border, dashed } })}
              size="small"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default memo(BorderTab);
