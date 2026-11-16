import React from 'react';

import { Switch } from 'antd';

import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import { useIsMobile } from '@core/app/stores/screenStore';
import changeAttribute from '@core/app/svgedit/history/changeAttribute';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { SINGLE_LINE_FONT_ATTR } from '@core/helpers/fonts/singleLineFont';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './SingleLineFontBlock.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  textElements: SVGTextElement[];
}

/**
 * Mark the selected texts as written in a single-line font, so converting them to path keeps every
 * stroke open. Turning it on also unfills them: an open stroke encloses nothing to fill.
 */
const SingleLineFontBlock = ({ checked, onChange, textElements }: Props): React.ReactNode => {
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();

  const onClick = () => {
    const value = !checked;
    const batchCmd = new history.BatchCommand('Toggle single-line font');

    textElements.forEach((elem) => {
      const attributes: Record<string, null | string> = { [SINGLE_LINE_FONT_ATTR]: value ? 'true' : null };

      if (value && svgCanvas.calcElemFilledInfo(elem).isAnyFilled) {
        // same as svgCanvas.setElementUnfill, in one command with the attribute
        Object.assign(attributes, { fill: 'none', 'fill-opacity': '0', stroke: elem.getAttribute('fill') || '#333' });
      }

      const cmd = changeAttribute(elem, attributes);

      if (cmd) batchCmd.addSubCommand(cmd);
    });

    if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);

    onChange(value);
  };

  return isMobile ? (
    <ObjectPanelItem.Item
      content={<Switch checked={checked} />}
      id="single-line-font"
      label={lang.single_line_font}
      onClick={onClick}
    />
  ) : (
    <div className={styles['option-block']}>
      <div className={styles.label}>{lang.single_line_font}</div>
      <Switch checked={checked} id="single-line-font" onClick={onClick} size="small" />
    </div>
  );
};

export default SingleLineFontBlock;
