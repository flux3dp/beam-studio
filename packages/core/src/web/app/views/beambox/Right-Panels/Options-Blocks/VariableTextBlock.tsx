import React, { useEffect, useMemo } from 'react';

import { QuestionCircleOutlined, SettingFilled } from '@ant-design/icons';
import { Button, ConfigProvider, Switch } from 'antd';
import classNames from 'classnames';

import { showVariableTextSettings } from '@core/app/components/dialogs/VariableTextSettings';
import { objectPanelInputTheme, selectTheme } from '@core/app/constants/antd-config';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/UnitInput';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { updateConfigs } from '@core/helpers/update-configs';
import useI18n from '@core/helpers/useI18n';
import { getVariableTextOffset, getVariableTextType, isVariableTextSupported } from '@core/helpers/variableText';
import browser from '@core/implementations/browser';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { VariableTextConfig } from '@core/interfaces/ObjectPanel';
import { VariableTextType } from '@core/interfaces/ObjectPanel';

import styles from './VariableTextBlock.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  elems: SVGElement[];
  id: string;
  withDivider?: boolean;
}

const defaultTextConfigs: VariableTextConfig = {
  id: { hasMultiValue: false, value: '' },
  offset: { hasMultiValue: false, value: 0 },
  type: { hasMultiValue: false, value: VariableTextType.NONE },
};

const VariableTextBlock = ({ elems, id, withDivider = false }: Props) => {
  const t = useI18n().beambox.right_panel.object_panel.option_panel;
  const [isToggleOn, setIsToggleOn] = React.useState(false);
  const [config, setConfig] = React.useState(defaultTextConfigs);
  const workarea = useWorkarea();
  const showVariableBlock = useMemo(isVariableTextSupported, [workarea]);

  const options = [
    { label: t.number, value: VariableTextType.NUMBER },
    { label: t.current_time, value: VariableTextType.TIME },
    { label: 'CSV', value: VariableTextType.CSV },
  ];

  useEffect(() => {
    if (id === config.id.value) return;

    let includeNone = false;
    const newConfigs: Partial<VariableTextConfig> = { id: { hasMultiValue: false, value: id } };

    for (const elem of elems) {
      const type = getVariableTextType(elem);

      includeNone = includeNone || type === VariableTextType.NONE;
      updateConfigs(newConfigs, 'type', () => type);
      updateConfigs(newConfigs, 'offset', () => getVariableTextOffset(elem));
    }
    setConfig({ ...defaultTextConfigs, ...newConfigs });
    setIsToggleOn(!includeNone);
  }, [id, elems, config.id.value]);

  if (!showVariableBlock) {
    return null;
  }

  const onToggle = () => {
    if (isToggleOn) {
      svgCanvas.changeSelectedAttribute('data-vt-type', VariableTextType.NONE, elems);
      setIsToggleOn(false);
      setConfig((prev) => ({
        ...prev,
        type: { hasMultiValue: false, value: VariableTextType.NONE },
      }));
    } else {
      const batchCmd = new history.BatchCommand('Turn on variable text');
      const elemsToInit = [];
      let hasMultiValue = false;
      let cmd: IBatchCommand;

      undoManager.beginUndoableChange('data-vt-type', elems);
      for (const elem of elems) {
        const type = getVariableTextType(elem);

        if (type === VariableTextType.NONE) {
          elem.setAttribute('data-vt-type', VariableTextType.NUMBER.toString());

          if (!elem.getAttribute('data-vt-offset')) elemsToInit.push(elem);
        } else if (type !== VariableTextType.NUMBER) {
          hasMultiValue = true;
        }
      }

      cmd = undoManager.finishUndoableChange();
      batchCmd.addSubCommand(cmd);

      if (elemsToInit.length > 0) {
        undoManager.beginUndoableChange('data-vt-offset', elemsToInit);
        svgCanvas.changeSelectedAttributeNoUndo('data-vt-offset', '0', elemsToInit);
        cmd = undoManager.finishUndoableChange();
        batchCmd.addSubCommand(cmd);
      }

      undoManager.addCommandToHistory(batchCmd);
      setIsToggleOn(true);
      setConfig((prev) => {
        if (elemsToInit.length > 0) updateConfigs(prev, 'offset', () => 0);

        return { ...prev, type: { hasMultiValue, value: VariableTextType.NUMBER } };
      });
    }
  };

  const onTypeChange = (value: VariableTextType) => {
    svgCanvas.changeSelectedAttribute('data-vt-type', value, elems);
    setConfig((prev) => ({ ...prev, type: { hasMultiValue: false, value } }));
  };

  const onOffsetChange = (value: null | number) => {
    if (value === null) return;

    svgCanvas.changeSelectedAttribute('data-vt-offset', value, elems);
    setConfig((prev) => ({ ...prev, offset: { hasMultiValue: false, value } }));
  };

  return (
    <ConfigProvider theme={selectTheme}>
      <div className={classNames({ [styles.divider]: withDivider })}>
        <div className={styles['option-block']}>
          <div className={styles.label}>
            {t.variable_text}
            <QuestionCircleOutlined className={styles.icon} onClick={() => browser.open(t.variable_text_link)} />
          </div>
          <Switch checked={isToggleOn} onClick={onToggle} size="small" />
        </div>
        {isToggleOn && (
          <>
            <div className={classNames(styles['option-block'], styles['with-select'])}>
              <Select
                className={styles.select}
                onChange={(val) => onTypeChange(val)}
                onKeyDown={(e) => e.stopPropagation()}
                options={options}
                popupMatchSelectWidth={false}
                value={config.type.hasMultiValue ? '-' : config.type.value}
              />
              <Button icon={<SettingFilled />} onClick={showVariableTextSettings} type="text" />
            </div>
            {(config.type.hasMultiValue || config.type.value !== VariableTextType.TIME) && (
              <div className={styles['option-block']}>
                <div className={styles.label}>{t.offset}</div>
                <UnitInput
                  className={styles.input}
                  controls={false}
                  displayMultiValue={config.offset.hasMultiValue}
                  id="variable-text-offset"
                  min={0}
                  onChange={onOffsetChange}
                  precision={0}
                  theme={objectPanelInputTheme}
                  underline
                  value={config.offset.value}
                />
              </div>
            )}
          </>
        )}
      </div>
    </ConfigProvider>
  );
};

export default VariableTextBlock;
