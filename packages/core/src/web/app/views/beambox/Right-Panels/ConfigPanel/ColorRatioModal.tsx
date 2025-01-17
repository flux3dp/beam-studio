import React, { useContext, useMemo, useState } from 'react';
import { Col, ConfigProvider, Modal, Row } from 'antd';

import useI18n from 'helpers/useI18n';
import { ColorRatioModalBlock } from 'app/constants/antd-config';
import { ConfigItem } from 'interfaces/ILayerConfig';
import { getLayerByName } from 'helpers/layer/layer-helper';
import { PrintingColors } from 'app/constants/color-constants';
import { writeDataLayer } from 'helpers/layer/layer-config-helper';

import ConfigPanelContext from './ConfigPanelContext';
import ModalBlock from './ModalBlock';

interface Props {
  fullColor?: boolean;
  onClose: () => void;
}

// TODO: add test
const ColorRationModal = ({ fullColor, onClose }: Props): JSX.Element => {
  const {
    global: tGlobal,
    beambox: {
      right_panel: { laser_panel: t },
    },
  } = useI18n();
  const { dispatch, selectedLayers, state } = useContext(ConfigPanelContext);
  const [draftValue, setDraftValue] = useState<{ [key: string]: ConfigItem<number> }>({
    cRatio: state.cRatio,
    mRatio: state.mRatio,
    yRatio: state.yRatio,
    kRatio: state.kRatio,
    printingStrength: state.printingStrength,
  });
  const handleSave = () => {
    const newState = { ...state };
    const keys = fullColor ? ['cRatio', 'mRatio', 'yRatio', 'kRatio'] : ['printingStrength'];
    selectedLayers.forEach((layerName) => {
      const layer = getLayerByName(layerName);
      keys.forEach((key: 'cRatio' | 'mRatio' | 'yRatio' | 'kRatio' | 'printingStrength') => {
        if (
          state[key].value !== draftValue[key].value ||
          state[key].hasMultiValue !== draftValue[key].hasMultiValue
        ) {
          writeDataLayer(layer, key, draftValue[key].value);
          newState[key] = draftValue[key];
        }
      });
    });
    dispatch({ type: 'update', payload: newState });
    onClose();
  };
  const handleValueChange = (key: string, value: number) => {
    setDraftValue((cur) => ({ ...cur, [key]: { value, hasMultiValue: false } }));
  };
  const colorLayer = useMemo<'c' | 'm' | 'y' | 'k' | undefined>(
    () =>
      state.color.hasMultiValue
        ? undefined
        : ({
            [PrintingColors.CYAN]: 'c',
            [PrintingColors.MAGENTA]: 'm',
            [PrintingColors.YELLOW]: 'y',
            [PrintingColors.BLACK]: 'k',
          }[state.color.value] as 'c' | 'm' | 'y' | 'k') || undefined,
    [state.color.hasMultiValue, state.color.value]
  );

  return (
    <Modal
      centered
      open
      maskClosable={false}
      width={fullColor ? 600 : 300}
      onOk={handleSave}
      onCancel={onClose}
      cancelText={tGlobal.cancel}
      okText={tGlobal.save}
      title={t.color_adjustment}
    >
      <ConfigProvider theme={ColorRatioModalBlock}>
        {fullColor ? (
          <>
            <Row gutter={[10, 0]}>
              <Col span={12}>
                <ModalBlock
                  color="c"
                  title="Cyan"
                  label={t.color_strength}
                  value={draftValue.cRatio.value}
                  setValue={(val) => handleValueChange('cRatio', val)}
                />
              </Col>
              <Col span={12}>
                <ModalBlock
                  color="m"
                  title="Magenta"
                  label={t.color_strength}
                  value={draftValue.mRatio.value}
                  setValue={(val) => handleValueChange('mRatio', val)}
                />
              </Col>
              <Col span={12}>
                <ModalBlock
                  color="y"
                  title="Yellow"
                  label={t.color_strength}
                  value={draftValue.yRatio.value}
                  setValue={(val) => handleValueChange('yRatio', val)}
                />
              </Col>
              <Col span={12}>
                <ModalBlock
                  color="k"
                  title="Black"
                  label={t.color_strength}
                  value={draftValue.kRatio.value}
                  setValue={(val) => handleValueChange('kRatio', val)}
                />
              </Col>
            </Row>
          </>
        ) : (
          <ModalBlock
            label={t.color_strength}
            value={draftValue.printingStrength.value}
            setValue={(val) => handleValueChange('printingStrength', val)}
            color={colorLayer}
          />
        )}
      </ConfigProvider>
    </Modal>
  );
};

export default ColorRationModal;
