import React, { useMemo, useState } from 'react';

import { Col, ConfigProvider, Modal, Row } from 'antd';

import { ColorRatioModalBlock } from '@core/app/constants/antd-config';
import { PrintingColors } from '@core/app/constants/color-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigItem } from '@core/interfaces/ILayerConfig';

import ModalBlock from './ModalBlock';

interface Props {
  fullColor?: boolean;
  onClose: () => void;
}

// TODO: add test
const ColorRationModal = ({ fullColor, onClose }: Props): React.JSX.Element => {
  const {
    beambox: {
      right_panel: { laser_panel: t },
    },
    global: tGlobal,
  } = useI18n();
  const { getState, update } = useConfigPanelStore();
  const state = getState();
  const [draftValue, setDraftValue] = useState<{ [key: string]: ConfigItem<number> }>({
    cRatio: state.cRatio,
    kRatio: state.kRatio,
    mRatio: state.mRatio,
    printingStrength: state.printingStrength,
    yRatio: state.yRatio,
  });
  const handleSave = () => {
    const newState = { ...state };
    const keys: Array<'cRatio' | 'kRatio' | 'mRatio' | 'printingStrength' | 'yRatio'> = fullColor
      ? ['cRatio', 'mRatio', 'yRatio', 'kRatio']
      : ['printingStrength'];

    useLayerStore.getState().selectedLayers.forEach((layerName) => {
      const layer = getLayerByName(layerName)!;

      keys.forEach((key) => {
        if (state[key].value !== draftValue[key].value || state[key].hasMultiValue !== draftValue[key].hasMultiValue) {
          writeDataLayer(layer, key, draftValue[key].value);
          newState[key] = draftValue[key];
        }
      });
    });
    update(newState);
    onClose();
  };
  const handleValueChange = (key: string, value: number) => {
    setDraftValue((cur) => ({ ...cur, [key]: { hasMultiValue: false, value } }));
  };
  const colorLayer = useMemo<'c' | 'k' | 'm' | 'y' | undefined>(
    () =>
      state.color.hasMultiValue
        ? undefined
        : ({
            [PrintingColors.BLACK]: 'k',
            [PrintingColors.CYAN]: 'c',
            [PrintingColors.MAGENTA]: 'm',
            [PrintingColors.YELLOW]: 'y',
          }[state.color.value] as 'c' | 'k' | 'm' | 'y') || undefined,
    [state.color.hasMultiValue, state.color.value],
  );

  return (
    <Modal
      cancelText={tGlobal.cancel}
      centered
      maskClosable={false}
      okText={tGlobal.save}
      onCancel={onClose}
      onOk={handleSave}
      open
      title={t.color_adjustment}
      width={fullColor ? 600 : 300}
    >
      <ConfigProvider theme={ColorRatioModalBlock}>
        {fullColor ? (
          <>
            <Row gutter={[10, 0]}>
              <Col span={12}>
                <ModalBlock
                  color="c"
                  label={t.color_strength}
                  setValue={(val) => handleValueChange('cRatio', val)}
                  title="Cyan"
                  unit="%"
                  value={draftValue.cRatio.value}
                />
              </Col>
              <Col span={12}>
                <ModalBlock
                  color="m"
                  label={t.color_strength}
                  setValue={(val) => handleValueChange('mRatio', val)}
                  title="Magenta"
                  unit="%"
                  value={draftValue.mRatio.value}
                />
              </Col>
              <Col span={12}>
                <ModalBlock
                  color="y"
                  label={t.color_strength}
                  setValue={(val) => handleValueChange('yRatio', val)}
                  title="Yellow"
                  unit="%"
                  value={draftValue.yRatio.value}
                />
              </Col>
              <Col span={12}>
                <ModalBlock
                  color="k"
                  label={t.color_strength}
                  setValue={(val) => handleValueChange('kRatio', val)}
                  title="Black"
                  unit="%"
                  value={draftValue.kRatio.value}
                />
              </Col>
            </Row>
          </>
        ) : (
          <ModalBlock
            color={colorLayer}
            label={t.color_strength}
            setValue={(val) => handleValueChange('printingStrength', val)}
            unit="%"
            value={draftValue.printingStrength.value}
          />
        )}
      </ConfigProvider>
    </Modal>
  );
};

export default ColorRationModal;
