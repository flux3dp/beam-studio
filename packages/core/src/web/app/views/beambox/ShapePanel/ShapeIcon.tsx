import React, { useEffect } from 'react';

import Icon from '@ant-design/icons';
import ReactDomServer from 'react-dom/server';

import type LayerModule from '@core/app/constants/layer-module/layer-modules';
import { builtInElements } from '@core/app/constants/shape-panel-constants';
import history from '@core/app/svgedit/history/history';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import importSvgString from '@core/app/svgedit/operations/import/importSvgString';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useForceUpdate from '@core/helpers/use-force-update';

import styles from './ShapeIcon.module.scss';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const icons = {};

const importShape = async (IconComponent, jsonMap) => {
  if (jsonMap) {
    const newElement = svgCanvas.addSvgElementFromJson({
      ...jsonMap,
      attr: { ...jsonMap.attr, id: svgCanvas.getNextId() },
    });

    svgCanvas.addCommandToHistory(new history.InsertElementCommand(newElement));

    if (svgCanvas.isUsingLayerColor) {
      updateElementColor(newElement);
    }

    svgCanvas.selectOnly([newElement]);
  } else {
    const iconString = ReactDomServer.renderToStaticMarkup(<IconComponent />).replace(
      /fill= ?"#(fff(fff)?|FFF(FFF))"/g,
      'fill="none"',
    );
    const drawing = svgCanvas.getCurrentDrawing();
    const layerName = drawing.getCurrentLayerName();
    const layerModule: LayerModule = getData(getLayerByName(layerName), 'module');
    const batchCmd = HistoryCommandFactory.createBatchCommand('Shape Panel Import SVG');
    const newElementnewElement = await importSvgString(iconString, {
      layerName,
      parentCmd: batchCmd,
      targetModule: layerModule,
      type: 'layer',
    });
    const { height, width } = svgCanvas.getSvgRealLocation(newElementnewElement);
    const [newWidth, newHeight] = width > height ? [500, (height * 500) / width] : [(width * 500) / height, 500];

    svgCanvas.selectOnly([newElementnewElement]);
    batchCmd.addSubCommand(svgCanvas.setSvgElemSize('width', newWidth));
    batchCmd.addSubCommand(svgCanvas.setSvgElemSize('height', newHeight));
    batchCmd.addSubCommand(svgCanvas.setSvgElemPosition('x', 0, newElementnewElement, false));
    batchCmd.addSubCommand(svgCanvas.setSvgElemPosition('y', 0, newElementnewElement, false));
    newElementnewElement.setAttribute('data-ratiofixed', 'true');
    batchCmd.addSubCommand(await svgCanvas.disassembleUse2Group([newElementnewElement], true, false));
    updateElementColor(svgCanvas.getSelectedElems()[0]);
    svgCanvas.addCommandToHistory(batchCmd);
  }
};

const ShapeIcon = ({
  activeTab,
  fileName,
  onClose,
}: {
  activeTab: string;
  fileName: string;
  onClose: () => void;
}): React.JSX.Element => {
  const forceUpdate = useForceUpdate();
  const key = `${activeTab}/${fileName}`;

  useEffect(() => {
    if (icons[key]) {
      return;
    }

    import(`@core/app/icons/shape/${key}.svg`)
      .then((module) => {
        const icon = module.default;

        icons[key] = icon;
        forceUpdate();
      })
      .catch((err) => {
        console.error(`Fail to load icon from '@core/app/icons/shape/${key}.svg': ${err}`);
      });
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [key]);

  const IconComponent = icons[key];

  return (
    IconComponent && (
      <Icon
        className={styles.icon}
        component={IconComponent}
        id={key}
        onClick={async () => {
          await importShape(IconComponent, builtInElements[fileName]);
          onClose();
        }}
      />
    )
  );
};

export default ShapeIcon;
