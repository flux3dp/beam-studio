import React, { memo, useCallback, useEffect } from 'react';

import type { MenuProps } from 'antd';

import svgEditor from '@core/app/actions/beambox/svg-editor';
import useLayerStore from '@core/app/stores/layer/layerStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { cloneSelectedElements, pasteElements } from '@core/app/svgedit/operations/clipboard';
import ContextMenu from '@core/app/widgets/ContextMenu';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { useSetState } from '@core/helpers/hooks/useSetState';
import { getObjectLayer, moveToOtherLayer } from '@core/helpers/layer/layer-helper';
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

  const getMenuItems = useCallback((): MenuProps['items'] => {
    const layerNames = layerManager.getAllLayerNames();
    const selectedElems = svgCanvas?.getSelectedElems();
    const currentLayer = getCurrentLayer(selectedElems?.[0]);

    return [
      { disabled: !select, key: 'cut', label: t.cut, onClick: () => svgEditor.cutSelected() },
      { disabled: !select, key: 'copy', label: t.copy, onClick: () => svgEditor.copySelected() },
      { disabled: !paste, key: 'paste', label: t.paste, onClick: () => pasteElements({ type: 'mouse' }) },
      {
        disabled: !paste,
        key: 'paste_in_place',
        label: t.paste_in_place,
        onClick: () => pasteElements({ type: 'inPlace' }),
      },
      { disabled: !select, key: 'duplicate', label: t.duplicate, onClick: async () => cloneSelectedElements(20, 20) },
      { type: 'divider' as const },
      { disabled: !select, key: 'delete', label: t.delete, onClick: () => svgEditor.deleteSelected() },
      { type: 'divider' as const },
      { disabled: !select || !group, key: 'group', label: t.group, onClick: () => svgCanvas.groupSelectedElements() },
      {
        disabled: !select || !ungroup,
        key: 'ungroup',
        label: t.ungroup,
        onClick: () => svgCanvas.ungroupSelectedElement(),
      },
      { type: 'divider' as const },
      {
        disabled: !select,
        key: 'move_front',
        label: t.move_front,
        onClick: () => svgCanvas.moveTopBottomSelected('top'),
      },
      { disabled: !select, key: 'move_up', label: t.move_up, onClick: () => svgCanvas.moveUpSelectedElement() },
      { disabled: !select, key: 'move_down', label: t.move_down, onClick: () => svgCanvas.moveDownSelectedElement() },
      {
        disabled: !select,
        key: 'move_back',
        label: t.move_back,
        onClick: () => svgCanvas.moveTopBottomSelected('bottom'),
      },
      { type: 'divider' as const },
      {
        children: layerNames.map((layerName) => ({
          disabled: layerName === currentLayer,
          key: `layer_${layerName}`,
          label: layerName,
          onClick: () => moveToOtherLayer(layerName, () => {}, false),
        })),
        disabled: !select,
        key: 'move_to_layer',
        label: lang.right_panel.layer_panel.move_elems_to,
      },
    ];
  }, [t, lang, select, paste, group, ungroup]);

  return (
    <ContextMenu disabled={menuDisabled} items={getMenuItems()}>
      <div className={className} id="workarea">
        <div
          id="svgcanvas"
          style={{
            position: 'relative',
          }}
        />
      </div>
    </ContextMenu>
  );
});

export default Workarea;
