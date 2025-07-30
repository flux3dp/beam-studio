import * as React from 'react';

import { CaretRightOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';

import Alert from '@core/app/actions/alert-caller';
import history from '@core/app/svgedit/history/history';
import workareaManager from '@core/app/svgedit/workarea';
import Modal from '@core/app/widgets/Modal';
import getClipperLib from '@core/helpers/clipper/getClipperLib';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import requirejsHelper from '@core/helpers/requirejs-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './SvgNestButtons.module.scss';

let svgCanvas: ISVGCanvas;
let svgedit: any;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const LANG = i18n.lang.beambox.tool_panels;

async function setUpSvgNest() {
  if (isWeb()) {
    await requirejsHelper('js/lib/svg-nest/svgnest');
    await requirejsHelper('js/lib/svg-nest/util/geometryutil');
    await requirejsHelper('js/lib/svg-nest/util/parallel');
  }
}

interface Props {
  onClose: () => void;
}

interface State {
  isWorking: boolean;
}

class SvgNestButtons extends React.Component<Props, State> {
  private undoNestChanges: any[] = [];

  private nestedElements: any[] = [];

  constructor(props: any) {
    super(props);
    this.state = {
      isWorking: false,
    };

    if (!window['SvgNest' as any]) {
      setUpSvgNest();
    }
  }

  nestElements = (elements: Element[], containerElem?: HTMLElement, config?: any) => {
    let containerPoints;
    const ClipperLib = getClipperLib();

    if (containerElem) {
      const containerDpath = svgedit.utilities.getPathDFromElement(containerElem);
      const bbox = svgedit.utilities.getBBox(containerElem);
      const rotation = {
        angle: svgedit.utilities.getRotationAngle(containerElem),
        cx: bbox.x + bbox.width / 2,
        cy: bbox.y + bbox.height / 2,
      };

      containerPoints = ClipperLib.dPathToPointPathsAndScale(containerDpath, rotation, 1);
    } else {
      const { maxY, minY, width: w } = workareaManager;

      containerPoints = [
        { x: 0, y: minY },
        { x: w, y: minY },
        { x: w, y: maxY },
        { x: 0, y: maxY },
      ];
    }

    const elemPoints = [];

    this.undoNestChanges = [];
    this.nestedElements = [...elements];
    for (let i = 0; i < elements.length; i += 1) {
      let elem = elements[i];

      if (!elem) {
        continue;
      }

      let bbox;
      const id = elem.getAttribute('id');

      switch (elem.tagName) {
        case 'use':
          bbox = svgCanvas.getSvgRealLocation(elem as SVGUseElement);
          break;
        case 'filter':
          continue;
        default:
          bbox = svgCanvas.calculateTransformedBBox(elem);
          break;
      }

      const rotation = {
        angle: svgedit.utilities.getRotationAngle(elem),
        cx: bbox.x + bbox.width / 2,
        cy: bbox.y + bbox.height / 2,
      };

      let points;
      const d = svgedit.utilities.getPathDFromElement(elem);

      if (d) {
        const pointPaths = ClipperLib.dPathToPointPathsAndScale(d, rotation, 1);

        if (pointPaths.length === 1) {
          [points] = pointPaths;
        }
      }

      if (!points) {
        points = [
          { x: bbox.x, y: bbox.y },
          { x: bbox.x + bbox.width, y: bbox.y },
          { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
          { x: bbox.x, y: bbox.y + bbox.height },
        ];

        if (rotation.angle) {
          const rad = rotation.angle * (Math.PI / 180);

          points = points.map((p) => {
            const x = p.x - rotation.cx;
            const y = p.y - rotation.cy;
            const newX = x * Math.cos(rad) - y * Math.sin(rad) + rotation.cx;
            const newY = y * Math.cos(rad) + x * Math.sin(rad) + rotation.cy;

            return { x: newX, y: newY };
          });
        }
      }

      points.source = id;
      points.id = elemPoints.length;

      // SvgNest does not support 2 points line segment, here is a hacking to allow the arrangement
      if (points.length === 2) {
        points.push(points[1]);
      }

      elemPoints.push(points);

      const elementsToUndo: any[] = [elem];

      while (elementsToUndo.length > 0) {
        elem = elementsToUndo.pop();

        if (elem.nodeType !== 1) {
          continue;
        }

        const undoRecord = {
          attrs: {
            transform: elem.getAttribute('transform'),
          } as { [key: string]: null | string },
          element: elem,
        };

        switch (elem.tagName) {
          case 'path':
            undoRecord.attrs.d = elem.getAttribute('d');
            break;
          case 'polygon':
            undoRecord.attrs.points = elem.getAttribute('points');
            break;
          case 'ellipse':
            undoRecord.attrs.cx = elem.getAttribute('cx');
            undoRecord.attrs.cy = elem.getAttribute('cy');
            break;
          default:
            undoRecord.attrs.x = elem.getAttribute('x');
            undoRecord.attrs.y = elem.getAttribute('y');
            break;
        }
        elementsToUndo.push(...elem.childNodes);
        this.undoNestChanges.push(undoRecord);
      }
    }

    const SvgNest = window['SvgNest' as any] as any;

    if (config) {
      SvgNest.config(config);
    }

    SvgNest.nestElements(containerPoints, elemPoints);
  };

  stopNestElement = (): void => {
    const SvgNest = window['SvgNest' as any] as any;

    SvgNest.stop();

    const batchCmd = new history.BatchCommand('Svg Nest');

    for (let i = 0; i < this.undoNestChanges.length; i += 1) {
      const elem = this.undoNestChanges[i].element;
      const subCmd = new history.ChangeElementCommand(elem, this.undoNestChanges[i].attrs);

      batchCmd.addSubCommand(subCmd);
    }

    if (!batchCmd.isEmpty()) {
      svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    }

    svgCanvas.selectOnly(this.nestedElements);

    if (this.nestedElements.length > 1) {
      svgCanvas.tempGroupSelectedElements();
    }

    this.nestedElements = [];
  };

  close = (): void => {
    const { onClose } = this.props;
    const { isWorking } = this.state;

    if (isWorking) {
      this.stopNestElement();
    }

    onClose();
  };

  onStartOrStop = (): void => {
    const { isWorking } = this.state;

    if (!isWorking) {
      if (svgCanvas.getTempGroup()) {
        const children = svgCanvas.ungroupTempGroup();

        svgCanvas.selectOnly(children, false);
      }

      const elems = svgCanvas.getSelectedElems().filter((e) => e);

      svgCanvas.clearSelection();

      if (elems.length === 0) {
        // Empty use all elements
        const drawing = svgCanvas.getCurrentDrawing();
        const layerNumber = drawing.getNumLayers();

        for (let i = 0; i < layerNumber; i += 1) {
          const name = drawing.getLayerName(i)!;
          const layer = drawing.getLayerByName(name)!;

          if (layer.getAttribute('display') === 'none' || layer.getAttribute('data-lock') === 'true') {
            continue;
          }

          const { childNodes } = layer;
          const children = $(layer).children();

          for (let j = 0; j < childNodes.length; j += 1) {
            if (!['filter', 'title'].includes(children[j].nodeName)) {
              elems.push(children[j] as unknown as SVGElement);
            }
          }
        }
      }

      console.log(elems);

      if (elems.length === 0) {
        Alert.popUp({
          caption: LANG.nest,

          message: LANG._nest.no_element,
        });

        return;
      }

      this.nestElements(elems);
    } else {
      this.stopNestElement();
    }

    this.setState({
      isWorking: !isWorking,
    });
  };

  renderStartButton = (): React.JSX.Element => {
    const { isWorking } = this.state;
    const icon = isWorking ? <LoadingOutlined /> : <CaretRightOutlined />;

    const label = isWorking ? LANG._nest.stop_nest : LANG._nest.start_nest;

    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#3875F6' } }}>
        <Button icon={icon} onClick={this.onStartOrStop} shape="round" type="primary">
          {label}
        </Button>
      </ConfigProvider>
    );
  };

  render(): React.JSX.Element {
    const { isWorking } = this.state;

    const endText = LANG._nest.end;
    const isWindows = !isWeb() && window.os === 'Windows';
    const className = classNames(styles.container, { [styles.win]: isWindows });

    const content = (
      <div className={className}>
        {this.renderStartButton()}
        <Button icon={<CloseOutlined />} onClick={this.close} shape="round">
          {endText}
        </Button>
      </div>
    );

    return isWorking ? <Modal className={{ 'no-background': true }}>{content}</Modal> : content;
  }
}

export default SvgNestButtons;
