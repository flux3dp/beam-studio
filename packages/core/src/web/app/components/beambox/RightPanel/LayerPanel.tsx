import React from 'react';

import classNames from 'classnames';
import { ResizableBox } from 'react-resizable';

import Alert from '@core/app/actions/alert-caller';
import Dialog from '@core/app/actions/dialog-caller';
import layoutConstants from '@core/app/constants/layout-constants';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import useLayerStore from '@core/app/stores/layer/layerStore';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import layerManager from '@core/app/svgedit/layer/layerManager';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import changeLayersColor from '@core/helpers/layer/changeLayersColor';
import { cloneLayerConfig } from '@core/helpers/layer/layer-config-helper';
import { highlightLayer, moveLayersToPosition, setLayersLock } from '@core/helpers/layer/layer-helper';
import { setLayerVisibility } from '@core/helpers/layer/setLayerVisibility';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { isMobile } from '@core/helpers/system-helper';
import storage from '@core/implementations/storage';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import AddLayerButton from './AddLayerButton';
import ConfigPanel from './ConfigPanel/ConfigPanel';
import RightPanelController from './contexts/RightPanelController';
import DragImage from './DragImage';
import LayerContextMenu from './LayerPanel/LayerContextMenu';
import LayerList from './LayerPanel/LayerList';
import styles from './LayerPanel.module.scss';
import ObjectPanelItem from './ObjectPanelItem';
import SelLayerBlock from './SelLayerBlock';
import WattBlock from './WattBlock';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const minLayerHeight = 100;
const defaultLayerHeight = layoutConstants.layerListHeight;
const layerPanelEventEmitter = eventEmitterFactory.createEventEmitter('layer-panel');

interface Props {
  hide?: boolean;
}

interface State {
  contextTargetLayers?: [string];
  disableScroll?: boolean;
  draggingDestIndex?: null | number;
  draggingLayer?: string;
}

const Handle = ({
  handleAxis: _,
  ref,
  ...eventHandlers
}: React.HTMLProps<HTMLDivElement> & { handleAxis?: string; ref?: React.Ref<HTMLDivElement> }) => {
  return (
    <div className={styles.handle} ref={ref} {...eventHandlers}>
      <LayerPanelIcons.Handle />
    </div>
  );
};

// TODO: extract layer operation methods as they don't need context now
class LayerPanel extends React.PureComponent<Props, State> {
  private currentTouchID?: null | number;
  private firstTouchInfo?: { pageX: number; pageY: number };
  private startDragTimer?: NodeJS.Timeout | null;
  private draggingScrollTimer?: NodeJS.Timeout | null;
  private draggingScrollDirection = 0;
  private layerListContainerRef: React.RefObject<HTMLDivElement>;
  private isDoingTutorial = false;
  private currentHeight = defaultLayerHeight;
  private oldHeight = defaultLayerHeight;

  constructor(props: Props) {
    super(props);
    this.state = {
      draggingDestIndex: null,
    };
    this.layerListContainerRef = React.createRef();
    this.currentTouchID = null;

    const initHeight = storage.get('layer-panel-height') || defaultLayerHeight;

    this.currentHeight = initHeight;
    window.addEventListener('beforeunload', () => {
      this.savePanelHeight();
    });
    layerPanelEventEmitter.on('startTutorial', this.startTutorial);
  }

  componentWillUnmount(): void {
    this.savePanelHeight();
    layerPanelEventEmitter.off('startTutorial', this.startTutorial);
  }

  startTutorial = (): void => {
    this.isDoingTutorial = true;
    this.oldHeight = this.currentHeight;
    this.currentHeight = defaultLayerHeight;
    layerPanelEventEmitter.once('endTutorial', this.endTutorial);
    this.forceUpdate();
  };

  endTutorial = (): void => {
    this.isDoingTutorial = false;
    this.currentHeight = this.oldHeight;
    this.forceUpdate();
  };

  savePanelHeight = (): void => {
    storage.set('layer-panel-height', this.isDoingTutorial ? this.oldHeight : this.currentHeight);
  };

  unLockLayers = (layerName: string): void => {
    const { selectedLayers, setSelectedLayers } = useLayerStore.getState();

    if (selectedLayers.includes(layerName)) {
      setLayersLock(selectedLayers, false);
      this.forceUpdate();
    } else {
      setLayersLock([layerName], false);
      setSelectedLayers([layerName]);
    }
  };

  renameLayer = (): void => {
    const oldName = layerManager.getCurrentLayerName()!;
    const lang = i18n.lang.beambox.right_panel.layer_panel;

    Dialog.promptDialog({
      caption: lang.notification.newName,
      defaultValue: oldName,
      onYes: (newName?: string) => {
        if (!newName || oldName === newName) {
          return;
        }

        if (layerManager.hasLayer(newName)) {
          Alert.popUp({
            id: 'dupli_layer_name',
            message: lang.notification.enterUniqueLayerName,
          });

          return;
        }

        svgCanvas.renameCurrentLayer(newName);
        cloneLayerConfig(oldName, newName);
        useLayerStore.getState().setSelectedLayers([newName]);
      },
    });
  };

  selectOnlyLayer = (layerName: string): void => {
    svgCanvas.clearSelection();

    useLayerStore.getState().setSelectedLayers([layerName]);
  };

  toggleLayerSelected = (layerName: string): void => {
    const { selectedLayers, setSelectedLayers } = useLayerStore.getState();
    const newSelectedLayers = [...selectedLayers];
    const index = newSelectedLayers.findIndex((name: string) => name === layerName);

    if (index >= 0) {
      if (newSelectedLayers.length > 1) {
        newSelectedLayers.splice(index, 1);
        setSelectedLayers(newSelectedLayers);
      }
    } else {
      newSelectedLayers.push(layerName);
      layerManager.setCurrentLayer(layerName);
      setSelectedLayers(newSelectedLayers, layerName);
    }
  };

  toggleContiguousSelectedUntil = (layerName: string): void => {
    const currentLayer = layerManager.getCurrentLayerName()!;

    const allLayers = layerManager.getAllLayerNames();
    let [startIndex, endIndex] = [-1, -1];

    for (let i = 0; i < allLayers.length; i += 1) {
      if (allLayers[i] === currentLayer) {
        startIndex = i;
      }

      if (allLayers[i] === layerName) {
        endIndex = i;
      }

      if (startIndex > -1 && endIndex > -1) {
        break;
      }
    }

    if (startIndex < 0 || endIndex < 0) {
      return;
    }

    const { selectedLayers, setSelectedLayers } = useLayerStore.getState();
    const newSelectedLayers = [...selectedLayers];
    const isLayerSelected = newSelectedLayers.includes(layerName);

    for (let i = startIndex; i !== endIndex; endIndex > startIndex ? (i += 1) : (i -= 1)) {
      const index = newSelectedLayers.findIndex((name) => name === allLayers[i]);

      if (isLayerSelected && index >= 0) {
        newSelectedLayers.splice(index, 1);
      } else if (!isLayerSelected && index < 0) {
        newSelectedLayers.push(allLayers[i]);
      }
    }

    if (!newSelectedLayers.includes(layerName)) {
      newSelectedLayers.push(layerName);
    }

    setSelectedLayers(newSelectedLayers, layerName);
  };

  setLayerColor = (layerName: string, newColor: string): void => {
    const { forceUpdate, selectedLayers } = useLayerStore.getState();
    const targets = selectedLayers.includes(layerName) ? selectedLayers : [layerName];
    const cmd = changeLayersColor(targets, newColor);

    if (cmd && !cmd.isEmpty()) {
      svgCanvas.addCommandToHistory(cmd);
    }

    forceUpdate();
  };

  setLayerVisibility = (layerName: string): void => {
    const layerObject = layerManager.getLayerByName(layerName);

    if (!layerObject) return;

    const isVis = layerObject.isVisible();
    const { selectedLayers } = useLayerStore.getState();
    const batchCmd = HistoryCommandFactory.createBatchCommand('Set Layers Visibility');

    if (selectedLayers.includes(layerName)) {
      for (let i = 0; i < selectedLayers.length; i += 1) {
        setLayerVisibility(selectedLayers[i], !isVis, { parentCmd: batchCmd });
      }
    } else {
      setLayerVisibility(layerName, !isVis, { parentCmd: batchCmd });
    }

    if (!batchCmd.isEmpty()) {
      svgCanvas.addCommandToHistory(batchCmd);
    }

    this.forceUpdate();
  };

  onLayerDragStart = (layerName: string, e?: React.DragEvent): void => {
    const dragImage = document.getElementById('drag-image') as Element;

    e?.dataTransfer?.setDragImage(dragImage, 0, 0);

    const { selectedLayers, setSelectedLayers } = useLayerStore.getState();

    if (!selectedLayers.includes(layerName)) {
      setSelectedLayers([layerName]);
    }

    this.setState({
      draggingLayer: layerName,
    });
    console.log('onLayerDragStart', layerName);
  };

  onLayerCenterDragEnter = (layerName?: string): void => {
    const { selectedLayers } = useLayerStore.getState();

    if (layerName && selectedLayers.includes(layerName)) {
      this.setState({ draggingDestIndex: undefined });
    }
  };

  onSensorAreaDragEnter = (index: number): void => {
    const { draggingDestIndex } = this.state;

    if (index !== draggingDestIndex) {
      this.setState({ draggingDestIndex: index });
    }
  };

  onLayerDragEnd = (): void => {
    const { draggingDestIndex } = this.state;
    const { selectedLayers } = useLayerStore.getState();

    if (draggingDestIndex !== null && draggingDestIndex !== undefined) {
      moveLayersToPosition(selectedLayers, draggingDestIndex);
      svgCanvas.sortTempGroupByLayer();
    }

    this.setState({
      draggingDestIndex: null,
      draggingLayer: undefined,
    });
  };

  preventDefault = (e: TouchEvent): void => {
    e.preventDefault();
  };

  draggingScroll = (): void => {
    const layerListContainer = this.layerListContainerRef.current;

    if (this.draggingScrollDirection !== 0 && layerListContainer) {
      if (this.draggingScrollDirection > 0) {
        layerListContainer.scrollTop += 10;
      } else {
        layerListContainer.scrollTop -= 10;
      }
    }
  };

  onLayerTouchStart = (layerName: string, e: React.TouchEvent, delay = 800): void => {
    if (this.currentTouchID === null) {
      this.currentTouchID = e.changedTouches[0].identifier;
      this.firstTouchInfo = {
        pageX: e.changedTouches[0].pageX,
        pageY: e.changedTouches[0].pageY,
      };
      this.startDragTimer = setTimeout(() => {
        this.onLayerDragStart(layerName);
        this.startDragTimer = null;
        document.addEventListener('touchmove', this.preventDefault, { passive: false });
        this.draggingScrollTimer = setInterval(this.draggingScroll, 100);
      }, delay);
    }
  };

  onLayerTouchMove = (e: React.TouchEvent): void => {
    const touch = Array.from(e.changedTouches).find((t) => t.identifier === this.currentTouchID);

    if (touch) {
      const { draggingLayer } = this.state;

      if (draggingLayer) {
        const layerListContainer = this.layerListContainerRef.current!;
        const { height, top } = layerListContainer.getBoundingClientRect();

        if (touch.pageY < top) {
          this.draggingScrollDirection = -1;
        } else if (touch.pageY > top + height) {
          this.draggingScrollDirection = 1;
        } else {
          this.draggingScrollDirection = 0;

          const elem = document
            .elementsFromPoint(touch.pageX, touch.pageY)
            .find((ele) => ele.hasAttribute('data-index') || ele.hasAttribute('data-layer'));

          if (elem) {
            if (elem.className.includes('drag-sensor-area')) {
              const index = Number(elem.getAttribute('data-index'));

              this.onSensorAreaDragEnter(index);
            } else if (elem.className.includes('row')) {
              const name = elem.getAttribute('data-layer')!;

              this.onLayerCenterDragEnter(name);
            }
          }
        }
      } else if (this.startDragTimer) {
        const { pageX, pageY } = this.firstTouchInfo!;

        if (Math.hypot(touch.pageX - pageX, touch.pageY - pageY) > 10) {
          clearTimeout(this.startDragTimer);
          this.startDragTimer = null;
        }
      }
    }
  };

  onLayerTouchEnd = (e: React.TouchEvent): void => {
    const touch = Array.from(e.changedTouches).find((t) => t.identifier === this.currentTouchID);

    if (touch) {
      if (this.startDragTimer) {
        clearTimeout(this.startDragTimer);
        this.startDragTimer = null;
      }

      if (this.draggingScrollTimer) {
        clearTimeout(this.draggingScrollTimer);
        this.draggingScrollTimer = null;
      }

      const { draggingLayer } = this.state;

      this.currentTouchID = null;

      if (draggingLayer) {
        document.removeEventListener('touchmove', this.preventDefault);
        this.onLayerDragEnd();
      }
    }
  };

  layerDoubleClick = (): void => {
    this.renameLayer();
  };

  handleLayerClick = (e: React.MouseEvent, layerName: string): void => {
    const isCtrlOrCmd = (getOS() === 'MacOS' && e.metaKey) || (getOS() !== 'MacOS' && e.ctrlKey);

    if (e.button === 0) {
      if (isCtrlOrCmd) {
        this.toggleLayerSelected(layerName);
      } else if (e.shiftKey) {
        this.toggleContiguousSelectedUntil(layerName);
      } else {
        this.selectOnlyLayer(layerName);
      }
    } else if (e.button === 2) {
      const { selectedLayers } = useLayerStore.getState();

      if (!selectedLayers.includes(layerName)) {
        this.selectOnlyLayer(layerName);
      }
    }
  };

  renderLayerPanel(): React.JSX.Element {
    const { draggingDestIndex, draggingLayer } = this.state;

    return (
      <div className={styles['layer-panel']} id="layerpanel" onBlur={() => {}} onMouseOut={() => highlightLayer()}>
        <LayerContextMenu renameLayer={this.renameLayer} selectOnlyLayer={this.selectOnlyLayer}>
          <div className={styles['layerlist-container']} id="layerlist_container" ref={this.layerListContainerRef}>
            <LayerList
              draggingDestIndex={draggingDestIndex ?? null}
              highlightLayer={highlightLayer}
              onLayerCenterDragEnter={this.onLayerCenterDragEnter}
              onLayerClick={this.handleLayerClick}
              onLayerColorChange={this.setLayerColor}
              onLayerDoubleClick={this.layerDoubleClick}
              onLayerDragEnd={this.onLayerDragEnd}
              onLayerDragStart={this.onLayerDragStart}
              onLayerTouchEnd={this.onLayerTouchEnd}
              onLayerTouchMove={this.onLayerTouchMove}
              onLayerTouchStart={this.onLayerTouchStart}
              onSensorAreaDragEnter={this.onSensorAreaDragEnter}
              setLayerVisibility={this.setLayerVisibility}
              unLockLayers={this.unLockLayers}
            />
          </div>
        </LayerContextMenu>
        {!isMobile() && (
          <>
            <DragImage draggingLayer={draggingLayer!} />
            <AddLayerButton />
          </>
        )}
      </div>
    );
  }

  render(): React.ReactNode {
    if (!svgCanvas) {
      setTimeout(() => {
        this.forceUpdate();
      }, 50);

      return null;
    }

    const lang = i18n.lang.beambox.right_panel.layer_panel;

    const { hide } = this.props;

    return (
      <div className={classNames(styles.container, { [styles.hide]: hide })} id="layer-and-laser-panel">
        {isMobile() ? (
          <>
            <FloatingPanel
              anchors={[0, 328, window.innerHeight * 0.6, window.innerHeight - layoutConstants.menubarHeight]}
              className={styles['floating-panel']}
              fixedContent={<AddLayerButton />}
              forceClose={hide}
              onClose={() => RightPanelController.setDisplayLayer(false)}
              title={lang.layers.layer}
            >
              <ObjectPanelItem.Mask />
              {this.renderLayerPanel()}
            </FloatingPanel>
            <div className={styles['layer-bottom-bar']}>
              <ConfigPanel UIType="panel-item" />
              <LayerContextMenu renameLayer={this.renameLayer} selectOnlyLayer={this.selectOnlyLayer} />
            </div>
          </>
        ) : (
          <>
            <ResizableBox
              axis="y"
              handle={<Handle />}
              height={this.currentHeight}
              minConstraints={[Number.NaN, minLayerHeight]}
              onResize={(_, { size }) => {
                if (!this.isDoingTutorial) {
                  this.currentHeight = size.height;
                }
              }}
            >
              {this.renderLayerPanel()}
            </ResizableBox>
            <SelLayerBlock />
            <WattBlock />
            <ConfigPanel />
          </>
        )}
      </div>
    );
  }
}

export default LayerPanel;
