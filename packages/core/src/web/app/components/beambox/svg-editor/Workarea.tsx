import React, { memo, useEffect, useMemo } from 'react';

import svgEditor from '@core/app/actions/beambox/svg-editor';
import useLayerStore from '@core/app/stores/layer/layerStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { cloneSelectedElements, pasteElements } from '@core/app/svgedit/operations/clipboard';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { useSetState } from '@core/helpers/hooks/useSetState';
import { getObjectLayer, moveToOtherLayer } from '@core/helpers/layer/layer-helper';
import { ContextMenu, ContextMenuTrigger, MenuItem, SubMenu } from '@core/helpers/react-contextmenu';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const eventEmitter = eventEmitterFactory.createEventEmitter('workarea');

const getCurrentLayer = (selectedElement?: Element): null | string => {
  if (!selectedElement) {
    return null;
  }

  if (selectedElement.getAttribute('data-tempgroup') === 'true') {
    const originalLayers = new Set(
      ([...selectedElement.childNodes] as SVGElement[])
        .filter((elem) => elem?.getAttribute('data-imageborder') !== 'true')
        .map((elem) => elem.getAttribute('data-original-layer')),
    );

    if (originalLayers.size === 1) {
      const [firstValue] = originalLayers;

      return firstValue;
    }
  } else {
    const currentLayer = getObjectLayer(selectedElement as SVGElement);

    return currentLayer?.title ?? null;
  }

  return null;
};

interface State {
  group: boolean;
  menuDisabled: boolean;
  paste: boolean;
  select: boolean;
  ungroup: boolean;
}

const Workarea = memo(({ className }: { className: string }) => {
  const [{ group, menuDisabled, paste, select, ungroup }, setState] = useSetState<State>({
    group: false,
    menuDisabled: false,
    paste: false,
    select: false,
    ungroup: false,
  });
  const lang = useI18n().beambox;
  const t = lang.context_menu;
  const isTouchable = useMemo(() => navigator.maxTouchPoints >= 1, []);

  // Note: Keep context to update current layer(trigger rerender) when moving a single element
  useLayerStore();

  useEffect(() => {
    const updateContextMenu = (newValues: Partial<State>) => {
      setState(newValues);
    };

    eventEmitter.on('update-context-menu', updateContextMenu);

    return () => {
      eventEmitter.removeListener('update-context-menu', updateContextMenu);
    };
  }, [setState]);

  const renderLayerSubMenu = () => {
    const layerNames = layerManager.getAllLayerNames();
    const selectedElems = svgCanvas?.getSelectedElems();
    const currentLayer = getCurrentLayer(selectedElems?.[0]);

    return (
      <>
        <div className="separator" />
        <SubMenu disabled={!select} title={lang.right_panel.layer_panel.move_elems_to}>
          {layerNames.map((layerName) => (
            <MenuItem
              disabled={layerName === currentLayer}
              key={layerName}
              onClick={() => moveToOtherLayer(layerName, () => {}, false)}
            >
              {layerName}
            </MenuItem>
          ))}
        </SubMenu>
      </>
    );
  };

  return (
    <>
      <ContextMenuTrigger
        disable={menuDisabled}
        holdToDisplay={isTouchable ? 1000 : -1}
        holdToDisplayMouse={-1}
        id="canvas-contextmenu"
      >
        <div className={className} id="workarea">
          <div
            id="svgcanvas"
            style={{
              position: 'relative',
            }}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenu id="canvas-contextmenu">
        <MenuItem disabled={!select} onClick={() => svgEditor.cutSelected()}>
          {t.cut}
        </MenuItem>
        <MenuItem disabled={!select} onClick={() => svgEditor.copySelected()}>
          {t.copy}
        </MenuItem>
        <MenuItem disabled={!paste} onClick={() => pasteElements({ type: 'mouse' })}>
          {t.paste}
        </MenuItem>
        <MenuItem disabled={!paste} onClick={() => pasteElements({ type: 'inPlace' })}>
          {t.paste_in_place}
        </MenuItem>
        <MenuItem disabled={!select} onClick={async () => cloneSelectedElements(20, 20)}>
          {t.duplicate}
        </MenuItem>
        <div className="separator" />
        <MenuItem disabled={!select} onClick={() => svgEditor.deleteSelected()}>
          {t.delete}
        </MenuItem>
        <div className="separator" />
        <MenuItem disabled={!select || !group} onClick={() => svgCanvas.groupSelectedElements()}>
          {t.group}
        </MenuItem>
        <MenuItem disabled={!select || !ungroup} onClick={() => svgCanvas.ungroupSelectedElement()}>
          {t.ungroup}
        </MenuItem>
        <div className="separator" />
        <MenuItem disabled={!select} onClick={() => svgCanvas.moveTopBottomSelected('top')}>
          {t.move_front}
        </MenuItem>
        <MenuItem disabled={!select} onClick={() => svgCanvas.moveUpSelectedElement()}>
          {t.move_up}
        </MenuItem>
        <MenuItem disabled={!select} onClick={() => svgCanvas.moveDownSelectedElement()}>
          {t.move_down}
        </MenuItem>
        <MenuItem disabled={!select} onClick={() => svgCanvas.moveTopBottomSelected('bottom')}>
          {t.move_back}
        </MenuItem>
        {renderLayerSubMenu()}
      </ContextMenu>
    </>
  );
});

export default Workarea;
