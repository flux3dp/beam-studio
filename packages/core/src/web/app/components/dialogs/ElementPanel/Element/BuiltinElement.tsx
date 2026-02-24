import type { ComponentType } from 'react';
import React, { use, useEffect, useMemo } from 'react';

import Icon from '@ant-design/icons';
import ReactDomServer from 'react-dom/server';

import { builtInElements } from '@core/app/constants/element-panel-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import history from '@core/app/svgedit/history/history';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import importSvgString from '@core/app/svgedit/operations/import/importSvgString';
import postImportElement from '@core/app/svgedit/operations/import/postImportElement';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './Element.module.scss';
import importIcon from './importIcon';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const icons: { [key: string]: ComponentType } = {};

const importElement = async (IconComponent: ComponentType, jsonMap: any) => {
  if (jsonMap) {
    const newElement = svgCanvas.addSvgElementFromJson({
      ...jsonMap,
      attr: { ...jsonMap.attr, id: svgCanvas.getNextId() },
    });

    undoManager.addCommandToHistory(new history.InsertElementCommand(newElement));
    updateElementColor(newElement);

    svgCanvas.selectOnly([newElement]);
  } else {
    const iconString = ReactDomServer.renderToStaticMarkup(<IconComponent />).replace(
      /fill= ?"#(fff(fff)?|FFF(FFF))"/g,
      'fill="none"',
    );
    const layerName = layerManager.getCurrentLayerName();

    if (!layerName) return;

    const layerModule = getData(getLayerByName(layerName)!, 'module') as LayerModuleType;
    const batchCmd = HistoryCommandFactory.createBatchCommand('Import Element SVG');
    const newElements = await importSvgString(iconString, {
      layerName,
      parentCmd: batchCmd,
      targetModule: layerModule,
      type: 'layer',
    });

    console.assert(newElements.length === 1, 'Expected BuiltinElement import to return one element');

    await postImportElement(newElements[0], batchCmd);
    undoManager.addCommandToHistory(batchCmd);
  }
};

const BuiltinElement = ({ mainType, path }: { mainType?: string; path: string }): React.JSX.Element => {
  const forceUpdate = useForceUpdate();
  const { addToHistory, closeDrawer } = use(ElementPanelContext);
  const [key, folder, fileName] = useMemo(() => {
    if (mainType) {
      return [`${mainType}/${path}`, mainType, path];
    }

    const [subPath1, subPath2] = path.split('/');

    return [path, subPath1, subPath2];
  }, [path, mainType]);

  useEffect(() => {
    if (icons[key]) {
      // Force update in case icons[key] is loaded between first render and useEffect
      forceUpdate();

      return;
    }

    importIcon(key)
      .then((icon) => {
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
          addToHistory({ path: { fileName, folder }, type: 'builtin' });
          await importElement(IconComponent, builtInElements[fileName]);
          closeDrawer();
        }}
      />
    )
  );
};

export default BuiltinElement;
