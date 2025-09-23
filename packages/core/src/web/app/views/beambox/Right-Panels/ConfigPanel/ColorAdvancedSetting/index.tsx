import React, { useCallback, useState } from 'react';

import { Button, Col, ConfigProvider, Row } from 'antd';

import { ColorRatioModalBlock } from '@core/app/constants/antd-config';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';

import ModalBlock from '../ModalBlock';

import ColorCurveControl from './ColorCurveControl';
import styles from './index.module.scss';

interface Props {
  onClose: () => void;
  selectedLayers: string[];
}

export const ColorAdvancedSetting = ({ onClose, selectedLayers }: Props) => {
  const {
    amAngleMap,
    colorCurvesMap: { value: colorCurvesMap },
    update,
  } = useConfigPanelStore();
  const { value: amAngleMapValue = { c: 75, k: 15, m: 45, y: 90 } } = amAngleMap;
  const [draftAngleMap, setDraftAngleMap] = useState({ ...amAngleMapValue });
  const [draftColorCurvesMap, setDraftColorCurvesMap] = useState(colorCurvesMap);

  const handleAngleValueChange = useCallback((color: 'c' | 'k' | 'm' | 'y', value: number) => {
    setDraftAngleMap((cur) => ({ ...cur, [color]: value }));
  }, []);
  const initColorCurvesMap = useCallback(() => {
    // color curve for backend am
    const newColorCurvesMap = {
      c: [0, 88, 170, 229, 255],
      k: [0, 60, 109, 163, 207],
      m: [0, 90, 149, 204, 241],
      y: [0, 96, 147, 186, 249],
    };

    setDraftColorCurvesMap(newColorCurvesMap);
  }, []);

  const handleSave = useCallback(() => {
    update({
      amAngleMap: {
        hasMultiValue: false,
        value: { ...amAngleMapValue, ...draftAngleMap },
      },
    });

    if (draftColorCurvesMap) {
      update({
        colorCurvesMap: {
          hasMultiValue: false,
          value: { ...colorCurvesMap, ...draftColorCurvesMap },
        },
      });
    }

    selectedLayers.forEach((layerName) => {
      const layer = getLayerByName(layerName)!;

      writeDataLayer(layer, 'amAngleMap', { ...amAngleMapValue, ...draftAngleMap });

      if (draftColorCurvesMap) {
        writeDataLayer(layer, 'colorCurvesMap', { ...colorCurvesMap, ...draftColorCurvesMap });
      }
    });
    onClose();
  }, [selectedLayers, amAngleMapValue, draftAngleMap, colorCurvesMap, draftColorCurvesMap, onClose, update]);

  return (
    <DraggableModal
      maskClosable={false}
      onCancel={onClose}
      onOk={handleSave}
      open
      title="Color Advanced Settings"
      width={600}
    >
      <Row gutter={[10, 0]}>
        <Col span={24}>
          <div className={styles.title}>Am Angles</div>
        </Col>
        <ConfigProvider theme={ColorRatioModalBlock}>
          <Col span={12}>
            <ModalBlock
              color="c"
              label="C angle"
              max={90}
              setValue={(val) => handleAngleValueChange('c', val)}
              unit="°"
              value={draftAngleMap.c}
            />
          </Col>
          <Col span={12}>
            <ModalBlock
              color="m"
              label="M angle"
              max={90}
              setValue={(val) => handleAngleValueChange('m', val)}
              unit="°"
              value={draftAngleMap.m}
            />
          </Col>
          <Col span={12}>
            <ModalBlock
              color="y"
              label="Y angle"
              max={90}
              setValue={(val) => handleAngleValueChange('y', val)}
              unit="°"
              value={draftAngleMap.y}
            />
          </Col>
          <Col span={12}>
            <ModalBlock
              color="k"
              label="K angle"
              max={90}
              setValue={(val) => handleAngleValueChange('k', val)}
              unit="°"
              value={draftAngleMap.k}
            />
          </Col>
        </ConfigProvider>
        <Col span={24}>
          <div className={styles.title}>Color Curves</div>
        </Col>
        {draftColorCurvesMap ? (
          <ConfigProvider theme={ColorRatioModalBlock}>
            <Col span={12}>
              <ColorCurveControl
                color="c"
                setValue={(val) => setDraftColorCurvesMap((cur) => ({ ...cur!, c: val }))}
                title="C Color Curve"
                value={draftColorCurvesMap.c}
              />
            </Col>
            <Col span={12}>
              <ColorCurveControl
                color="m"
                setValue={(val) => setDraftColorCurvesMap((cur) => ({ ...cur!, m: val }))}
                title="M Color Curve"
                value={draftColorCurvesMap.m}
              />
            </Col>
            <Col span={12}>
              <ColorCurveControl
                color="y"
                setValue={(val) => setDraftColorCurvesMap((cur) => ({ ...cur!, y: val }))}
                title="Y Color Curve"
                value={draftColorCurvesMap.y}
              />
            </Col>
            <Col span={12}>
              <ColorCurveControl
                color="k"
                setValue={(val) => setDraftColorCurvesMap((cur) => ({ ...cur!, k: val }))}
                title="K Color Curve"
                value={draftColorCurvesMap.k}
              />
            </Col>
          </ConfigProvider>
        ) : (
          <Col span={24}>
            <Button color="primary" onClick={initColorCurvesMap} variant="outlined">
              + Color Curve
            </Button>
          </Col>
        )}
      </Row>
    </DraggableModal>
  );
};

export default ColorAdvancedSetting;
