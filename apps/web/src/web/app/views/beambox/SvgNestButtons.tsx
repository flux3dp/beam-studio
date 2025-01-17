/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-continue */
import * as React from 'react';
import classNames from 'classnames';
import { Button, ConfigProvider } from 'antd';
import { CaretRightOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';

import Alert from 'app/actions/alert-caller';
import getClipperLib from 'helpers/clipper/getClipperLib';
import history from 'app/svgedit/history/history';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';
import Modal from 'app/widgets/Modal';
import requirejsHelper from 'helpers/requirejs-helper';
import workareaManager from 'app/svgedit/workarea';
import { getSVGAsync } from 'helpers/svg-editor-helper';

import styles from './SvgNestButtons.module.scss';

let svgCanvas;
let svgedit;
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
  private undoNestChanges: any[];

  private nestedElements: any[];

  constructor(props) {
    super(props);
    this.state = {
      isWorking: false,
    };
    // eslint-disable-next-line @typescript-eslint/dot-notation
    if (!window['SvgNest']) setUpSvgNest();
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
      containerPoints = ClipperLib.dPathtoPointPathsAndScale(containerDpath, rotation, 1);
    } else {
      const { width: w, height: h } = workareaManager;
      containerPoints = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    }

    const elemPoints = [];
    this.undoNestChanges = [];
    this.nestedElements = [...elements];
    for (let i = 0; i < elements.length; i += 1) {
      let elem = elements[i];
      if (!elem) continue;

      let bbox;
      const id = elem.getAttribute('id');

      switch (elem.tagName) {
        case 'use':
          bbox = svgCanvas.getSvgRealLocation(elem);
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
        const pointPaths = ClipperLib.dPathtoPointPathsAndScale(d, rotation, 1);
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
        if (elem.nodeType !== 1) continue;
        const undoRecord = {
          element: elem,
          attrs: {
            transform: elem.getAttribute('transform'),
          } as { [key: string]: string },
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
    // eslint-disable-next-line prefer-destructuring, @typescript-eslint/dot-notation
    const SvgNest = window['SvgNest'];

    if (config) {
      SvgNest.config(config);
    }
    SvgNest.nestElements(containerPoints, elemPoints);
  };

  stopNestElement = (): void => {
    // eslint-disable-next-line prefer-destructuring, @typescript-eslint/dot-notation
    const SvgNest = window['SvgNest'];
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
    this.nestedElements = null;
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
          const name = drawing.getLayerName(i);
          const layer = drawing.getLayerByName(name);
          if (
            layer.getAttribute('display') === 'none' ||
            layer.getAttribute('data-lock') === 'true'
          ) {
            continue;
          }
          const { childNodes } = layer;
          const children = $(layer).children();
          for (let j = 0; j < childNodes.length; j += 1) {
            if (!['title', 'filter'].includes(children[j].nodeName)) {
              elems.push(children[j]);
            }
          }
        }
      }
      // eslint-disable-next-line no-console
      console.log(elems);
      if (elems.length === 0) {
        Alert.popUp({
          caption: LANG.nest,
          // eslint-disable-next-line no-underscore-dangle
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

  renderStartButton = (): JSX.Element => {
    const { isWorking } = this.state;
    const icon = isWorking ? <LoadingOutlined /> : <CaretRightOutlined />;
    // eslint-disable-next-line no-underscore-dangle
    const label = isWorking ? LANG._nest.stop_nest : LANG._nest.start_nest;
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#3875F6' } }}>
        <Button icon={icon} shape="round" type="primary" onClick={this.onStartOrStop}>
          {label}
        </Button>
      </ConfigProvider>
    );
  };

  render(): JSX.Element {
    const { isWorking } = this.state;
    // eslint-disable-next-line no-underscore-dangle
    const endText = LANG._nest.end;
    const isWindows = !isWeb() && window.os === 'Windows';
    const className = classNames(styles.container, { win: isWindows });

    const content = (
      <div className={className}>
        {this.renderStartButton()}
        <Button icon={<CloseOutlined />} shape="round" onClick={this.close}>
          {endText}
        </Button>
      </div>
    );

    return isWorking ? (
      <Modal className={{ 'no-background': true }}>{content}</Modal>
    ) : content;
  }
}

export default SvgNestButtons;
