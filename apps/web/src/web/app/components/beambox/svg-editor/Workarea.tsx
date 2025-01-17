import React from 'react';

import clipboard from 'app/svgedit/operations/clipboard';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import i18n from 'helpers/i18n';
import svgEditor from 'app/actions/beambox/svg-editor';
import { ContextMenu, ContextMenuTrigger, MenuItem, SubMenu } from 'helpers/react-contextmenu';
import { getObjectLayer, moveToOtherLayer } from 'helpers/layer/layer-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { LayerPanelContext } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const eventEmitter = eventEmitterFactory.createEventEmitter('workarea');

const getCurrentLayer = (selectedElement?: Element): string | null => {
  if (!selectedElement) return null;
  if (selectedElement.getAttribute('data-tempgroup') === 'true') {
    const originalLayers = new Set(
      ([...selectedElement.childNodes] as SVGElement[])
        .filter((elem) => elem?.getAttribute('data-imageborder') !== 'true')
        .map((elem) => elem.getAttribute('data-original-layer'))
    );
    if (originalLayers.size === 1) {
      const [firstValue] = originalLayers;
      return firstValue;
    }
  } else {
    const currentLayer = getObjectLayer(selectedElement as SVGElement);
    return currentLayer?.title;
  }
  return null;
};

interface State {
  menuDisabled: boolean;
  select: boolean;
  paste: boolean;
  group: boolean;
  ungroup: boolean;
}

export default class Workarea extends React.PureComponent<{ className: string }, State> {
  constructor(props: { className: string }) {
    super(props);
    this.state = {
      menuDisabled: false,
      select: false,
      paste: false,
      group: false,
      ungroup: false,
    };
  }

  componentDidMount(): void {
    eventEmitter.on('update-context-menu', this.updateContextMenu);
  }

  componentWillUnmount(): void {
    eventEmitter.removeListener('update-context-menu', this.updateContextMenu);
  }

  private updateContextMenu = (newValues) => {
    this.setState((prev) => ({
      ...prev,
      ...newValues,
    }));
  };

  renderLayerSubMenu = (): JSX.Element => {
    const { select } = this.state;
    const drawing = svgCanvas?.getCurrentDrawing();
    const layerNames: string[] =
      drawing?.all_layers.map(
        // eslint-disable-next-line no-underscore-dangle
        (layer: { name_: string }) => layer.name_
      ) || [];
    const selectedElems = svgCanvas?.getSelectedElems();
    const currentLayer = getCurrentLayer(selectedElems?.[0]);
    return (
      <>
        <div className="seperator" />
        <SubMenu disabled={!select} title={i18n.lang.beambox.right_panel.layer_panel.move_elems_to}>
          {layerNames.map((layerName) => (
            <MenuItem
              key={layerName}
              disabled={layerName === currentLayer}
              onClick={() => moveToOtherLayer(layerName, () => {}, false)}
            >
              {layerName}
            </MenuItem>
          ))}
        </SubMenu>
      </>
    );
  };

  render(): JSX.Element {
    const LANG = i18n.lang.beambox.context_menu;
    const { className } = this.props;
    const { menuDisabled, select, paste, group, ungroup } = this.state;

    const isTouchable = navigator.maxTouchPoints >= 1;
    return (
      <>
        <ContextMenuTrigger
          id="canvas-contextmenu"
          holdToDisplay={isTouchable ? 1000 : -1}
          holdToDisplayMouse={-1}
          disable={menuDisabled}
        >
          <div id="workarea" className={className}>
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
            {LANG.cut}
          </MenuItem>
          <MenuItem disabled={!select} onClick={() => svgEditor.copySelected()}>
            {LANG.copy}
          </MenuItem>
          <MenuItem disabled={!paste} onClick={() => clipboard.pasteElements('mouse')}>
            {LANG.paste}
          </MenuItem>
          <MenuItem disabled={!paste} onClick={() => clipboard.pasteElements('in_place')}>
            {LANG.paste_in_place}
          </MenuItem>
          <MenuItem
            disabled={!select}
            onClick={async () => svgCanvas.cloneSelectedElements(20, 20)}
          >
            {LANG.duplicate}
          </MenuItem>
          <div className="seperator" />
          <MenuItem disabled={!select} onClick={() => svgEditor.deleteSelected()}>
            {LANG.delete}
          </MenuItem>
          <div className="seperator" />
          <MenuItem disabled={!select || !group} onClick={() => svgCanvas.groupSelectedElements()}>
            {LANG.group}
          </MenuItem>
          <MenuItem
            disabled={!select || !ungroup}
            onClick={() => svgCanvas.ungroupSelectedElement()}
          >
            {LANG.ungroup}
          </MenuItem>
          <div className="seperator" />
          <MenuItem disabled={!select} onClick={() => svgCanvas.moveTopBottomSelected('top')}>
            {LANG.move_front}
          </MenuItem>
          <MenuItem disabled={!select} onClick={() => svgCanvas.moveUpSelectedElement()}>
            {LANG.move_up}
          </MenuItem>
          <MenuItem disabled={!select} onClick={() => svgCanvas.moveDownSelectedElement()}>
            {LANG.move_down}
          </MenuItem>
          <MenuItem disabled={!select} onClick={() => svgCanvas.moveTopBottomSelected('bottom')}>
            {LANG.move_back}
          </MenuItem>
          {this.renderLayerSubMenu()}
        </ContextMenu>
      </>
    );
  }
}

// Note: Keep context to update current layer(trigger rerender) when moving a single element
Workarea.contextType = LayerPanelContext;
