/**
 * SVGCanvas Text Actions
 */

import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import type { CanvasMouseMode } from '@core/app/stores/canvas/canvasStore';
import { getMouseMode, setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import history from '@core/app/svgedit/history/history';
import { deleteElements, deleteSelectedElements } from '@core/app/svgedit/operations/delete';
import selector from '@core/app/svgedit/selector';
import workareaManager from '@core/app/svgedit/workarea';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

enum TextType {
  MULTI_LINE = 1,
  NULL = 0,
  TEXT_PATH = 2,
}

interface BBox {
  angle?: number;
  height: number;
  width: number;
  x: number;
  y: number;
}

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const { svgedit } = window;
const { NS } = svgedit;

class TextActions {
  public isEditing = false;

  private curtext: SVGTextElement;

  private textinput: HTMLInputElement;

  private cursor: Element | null = null;

  private selblock;

  private blinker: NodeJS.Timeout;

  private chardata: BBox[][] = [];

  private textbb;

  private matrix;

  private lastX;

  private lastY;

  private allowDbl;

  private isVertical = false;

  private fontSize = 100;

  private previousMode: CanvasMouseMode = 'select';

  private valueBeforeEdit = '';

  private screenToPt(xIn, yIn) {
    const out = {
      x: xIn,
      y: yIn,
    };

    const zoom = workareaManager.zoomRatio;

    out.x /= zoom;
    out.y /= zoom;

    if (this.matrix) {
      const pt = svgedit.math.transformPoint(out.x, out.y, this.matrix.inverse());

      out.x = pt.x;
      out.y = pt.y;
    }

    return out;
  }

  private ptToScreen(xIn, yIn) {
    const out = {
      x: xIn,
      y: yIn,
    };

    if (this.matrix) {
      const pt = svgedit.math.transformPoint(out.x, out.y, this.matrix);

      out.x = pt.x;
      out.y = pt.y;
    }

    const zoom = workareaManager.zoomRatio;

    out.x *= zoom;
    out.y *= zoom;

    return out;
  }

  private getCurtextType(): TextType {
    const { curtext } = this;

    if (!curtext) return TextType.NULL;

    if (curtext.getAttribute('data-textpath')) return TextType.TEXT_PATH;

    return TextType.MULTI_LINE;
  }

  getCurtext() {
    return this.curtext;
  }

  private calculateChardata() {
    const { chardata, curtext, fontSize, isVertical, textbb, textinput } = this;
    const calculateMultilineTextChardata = () => {
      const tspans = Array.from(curtext.childNodes).filter(
        (child: Element) => child.tagName === 'tspan',
      ) as SVGTextContentElement[];
      const rowNumbers = tspans.length;
      const charHeight = fontSize;
      const lines = textinput.value.split('\u0085');
      let lastRowX = null;

      // No contents
      if (rowNumbers === 0) {
        let bb;

        if (isVertical) {
          bb = {
            height: 0,
            width: charHeight,
            x: textbb.x,
            y: textbb.y + textbb.height / 2,
          };
        } else {
          bb = {
            height: charHeight,
            width: 0,
            x: textbb.x + textbb.width / 2,
            y: textbb.y,
          };
        }

        chardata.push([bb]);

        return;
      }

      // When text is vertical, we use the widest char as first row's width
      let firstRowMaxWidth = 0;

      if (this.isVertical && rowNumbers > 0) {
        for (let i = 0; i < tspans[0].textContent.length; i += 1) {
          const start = tspans[0].getStartPositionOfChar(i);
          const end = tspans[0].getEndPositionOfChar(i);

          firstRowMaxWidth = Math.max(firstRowMaxWidth, end.x - start.x);
        }
      }

      for (let i = 0; i < rowNumbers; i += 1) {
        chardata.push([]);

        let start;
        let end;
        const tspanbb = svgedit.utilities.getBBox(tspans[i]);

        // temporarily set text content to get bbox
        if (lines[i] === '') tspans[i].textContent = 'a';

        for (let j = 0; j < tspans[i].textContent.length; j += 1) {
          start = tspans[i].getStartPositionOfChar(j);
          end = tspans[i].getEndPositionOfChar(j);

          if (!svgedit.browser.supportsGoodTextCharPos()) {
            const { width, zoomRatio } = workareaManager;
            const offset = width * zoomRatio;

            start.x -= offset;
            end.x -= offset;

            start.x /= zoomRatio;
            end.x /= zoomRatio;
          }

          let width = end.x - start.x;

          if (isVertical) {
            width = i === 0 ? firstRowMaxWidth : lastRowX - start.x;
          }

          let y: number;

          if (isVertical) y = start.y - charHeight;
          else if (svgedit.browser?.isChrome() && lines[i] !== '') y = tspanbb.y;
          else y = textbb.y + charHeight * i;

          chardata[i].push({
            height: charHeight,
            width,
            x: start.x,
            y,
          });
        }

        // Add a last bbox for cursor at end of text
        // Because we insert a space for empty line, we don't add last bbox for empty line
        if (lines[i] !== '') {
          let width = 0;

          if (isVertical) {
            width = i === 0 ? firstRowMaxWidth : lastRowX - start.x;
          }

          let y: number;

          if (isVertical) y = end.y;
          else if (svgedit.browser?.isChrome()) y = tspanbb.y;
          else y = textbb.y + charHeight * i;

          chardata[i].push({
            height: isVertical ? 0 : charHeight,
            width,
            x: isVertical ? start.x : end.x,
            y,
          });
        } else {
          // set textContent back
          tspans[i].textContent = '';
        }

        lastRowX = start.x;
      }
    };

    const calculateTextPathCharBBox = (extent: DOMRect, start: DOMPoint, end: DOMPoint): BBox => {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const width = Math.hypot(end.y - start.y, end.x - start.x);
      const normalAngle = angle + 0.5 * Math.PI;
      const points = [];

      // Intersect point with x = extent.x & x = extent.x + extent.width
      if (Math.abs(Math.cos(normalAngle)) > Number.EPSILON) {
        const p1y = start.y + (extent.x - start.x) * Math.tan(normalAngle);

        if (p1y >= extent.y && p1y <= extent.y + extent.height) {
          points.push({ x: extent.x, y: p1y });
        }

        const p2y = start.y + (extent.x + extent.width - start.x) * Math.tan(normalAngle);

        if (p2y >= extent.y && p2y <= extent.y + extent.height) {
          points.push({ x: extent.x + extent.width, y: p2y });
        }
      }

      // Intersect point with y = extent.y & y = extent.y + extent.height
      if (Math.abs(Math.sin(normalAngle)) > Number.EPSILON) {
        const p1x = start.x + (extent.y - start.y) / Math.tan(normalAngle);

        if (p1x > extent.x && p1x < extent.x + extent.width) {
          points.push({ x: p1x, y: extent.y });
        }

        const p2x = start.x + (extent.y + extent.height - start.y) / Math.tan(normalAngle);

        if (p2x > extent.x && p2x < extent.x + extent.width) {
          points.push({ x: p2x, y: extent.y + extent.height });
        }
      }

      if (points.length < 2) {
        return extent;
      }

      const height = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const vP2P1DotNormalVector =
        (points[1].x - points[0].x) * Math.cos(normalAngle) + (points[1].y - points[0].y) * Math.sin(normalAngle);
      const leftTopPoint = vP2P1DotNormalVector > 0 ? points[0] : points[1];

      return {
        angle,
        height,
        width,
        x: leftTopPoint.x,
        y: leftTopPoint.y,
      };
    };

    const calculateTextPathChardata = () => {
      const charNum = curtext.getNumberOfChars();
      const firstRow = [] as BBox[]; // The first and the only row for text path

      for (let i = 0; i < charNum; i += 1) {
        const extent = curtext.getExtentOfChar(i);
        const startPosition = curtext.getStartPositionOfChar(i);
        const endPosition = curtext.getEndPositionOfChar(i);
        const bbox = calculateTextPathCharBBox(extent, startPosition, endPosition);

        firstRow.push(bbox);

        // Add last bbox for cursor at end of text
        if (i === charNum - 1) {
          const { angle = 0, height, width, x, y } = bbox;

          firstRow.push({
            angle,
            height,
            width: 0,
            x: x + width * Math.cos(angle),
            y: y + width * Math.sin(angle),
          });
        }
      }

      if (charNum === 0) {
        const textPath = curtext.querySelector('textPath');

        if (textPath) {
          textPath.textContent = '\x00';

          const extent = curtext.getExtentOfChar(0);
          const startPosition = curtext.getStartPositionOfChar(0);
          const endPosition = curtext.getEndPositionOfChar(0);
          const bbox = calculateTextPathCharBBox(extent, startPosition, endPosition);

          firstRow.push(bbox);
          textPath.textContent = '';
        }
      }

      chardata.push(firstRow);
    };
    const currentTextType = this.getCurtextType();

    if (currentTextType === TextType.NULL) {
      const bb = {
        height: 0,
        width: 0,
        x: 0,
        y: 0,
      };

      chardata.push([bb]);

      return;
    }

    if (currentTextType === TextType.TEXT_PATH) {
      calculateTextPathChardata();
    } else {
      calculateMultilineTextChardata();
    }
  }

  private indexToRowAndIndex(index) {
    let rowIndex = 0;

    if (!this.chardata || this.chardata.length === 0) {
      this.calculateChardata();
    }

    while (index >= this.chardata[rowIndex].length) {
      index -= this.chardata[rowIndex].length;
      rowIndex += 1;

      if (rowIndex === this.chardata.length) {
        return {
          index: this.chardata[rowIndex].length - 1,
          rowIndex: this.chardata.length - 1,
        };
      }
    }

    return { index, rowIndex };
  }

  private calculateSelectionBlockPathD = (start: number, end: number) => {
    const { index: startIndex, rowIndex: startRowIndex } = this.indexToRowAndIndex(start);
    const { index: endIndex, rowIndex: endRowIndex } = this.indexToRowAndIndex(end);
    const { chardata } = this;

    const currentTextType = this.getCurtextType();

    if (currentTextType === TextType.MULTI_LINE) {
      const startbb = chardata[startRowIndex][startIndex];
      const endbb = chardata[endRowIndex][endIndex];
      let points = [];

      const { textbb } = this;

      // drawing selection block
      if (startRowIndex === endRowIndex) {
        if (this.isVertical) {
          points = [
            [startbb.x, startbb.y],
            [endbb.x, endbb.y],
            [endbb.x + endbb.width, endbb.y],
            [startbb.x + startbb.width, startbb.y],
          ];
        } else {
          points = [
            [startbb.x, startbb.y],
            [endbb.x, endbb.y],
            [endbb.x, endbb.y + endbb.height],
            [startbb.x, startbb.y + startbb.height],
          ];
        }
      } else if (this.isVertical) {
        points = [
          [startbb.x + startbb.width, startbb.y],
          [startbb.x + startbb.width, textbb.y + textbb.height],
          [endbb.x + endbb.width, textbb.y + textbb.height],
          [endbb.x + endbb.width, endbb.y],
          [endbb.x, endbb.y],
          [endbb.x, textbb.y],
          [startbb.x, textbb.y],
          [startbb.x, startbb.y],
        ];
      } else {
        points = [
          [startbb.x, startbb.y],
          [textbb.x + textbb.width, startbb.y],
          [textbb.x + textbb.width, endbb.y],
          [endbb.x, endbb.y],
          [endbb.x, endbb.y + endbb.height],
          [textbb.x, endbb.y + endbb.height],
          [textbb.x, startbb.y + startbb.height],
          [startbb.x, startbb.y + startbb.height],
        ];
      }

      points = points.map((p) => this.ptToScreen(p[0], p[1]));
      points = points.map((p) => `${p.x},${p.y}`);

      return `M ${points.join('L')} z`;
    }

    if (currentTextType === TextType.TEXT_PATH) {
      let d = '';

      for (let i = startRowIndex; i <= endRowIndex; i += 1) {
        // but startRowIndex and endRowIndex should always be zero
        const jStart = i === startRowIndex ? startIndex : 0;
        const jEnd = i === endRowIndex ? endIndex : chardata[i].length;

        for (let j = jStart; j < jEnd; j += 1) {
          const { angle = 0, height, width, x, y } = chardata[i][j];
          const s = Math.sin(angle);
          const c = Math.cos(angle);
          const points = [
            [x, y],
            [x + width * c, y + width * s],
            [x + width * c - height * s, y + width * s + height * c],
            [x - height * s, y + height * c],
          ]
            .map((p) => this.ptToScreen(p[0], p[1]))
            .map((p) => `${p.x},${p.y}`);

          d += `M ${points.join('L')} z`;
        }
      }

      return d;
    }

    return '';
  };

  private setSelection(start, end, skipInput = false) {
    if (start === end) {
      this.setCursor(end);

      return;
    }

    if (!skipInput) {
      this.textinput.setSelectionRange(start, end);
    }

    this.selblock = document.getElementById('text_selectblock');

    if (!this.selblock && document.getElementById('text_cursor')) {
      this.selblock = document.createElementNS(NS.SVG, 'path');
      svgedit.utilities.assignAttributes(this.selblock, {
        fill: 'green',
        id: 'text_selectblock',
        opacity: 0.5,
        style: 'pointer-events:none',
      });
      svgedit.utilities.getElem('selectorParentGroup').appendChild(this.selblock);
    }

    this.cursor.setAttribute('visibility', 'hidden');

    const dString = this.calculateSelectionBlockPathD(start, end);

    if (this.selblock) {
      svgedit.utilities.assignAttributes(this.selblock, {
        d: dString,
        display: 'inline',
      });
    }
  }

  private getIndexFromPoint(mouseX, mouseY) {
    // Position cursor here
    const svgroot = document.getElementById('svgroot') as unknown as SVGSVGElement;
    const pt = svgroot.createSVGPoint();

    pt.x = mouseX;
    pt.y = mouseY;

    // No content, so return 0
    if (this.chardata.length === 1 && this.chardata[0].length === 1) {
      return 0;
    }

    // Determine if cursor should be on left or right of character
    let charpos = this.curtext.getCharNumAtPosition(pt);
    let rowIndex = 0;

    this.textbb = svgedit.utilities.getBBox(this.curtext);

    // console.log(textbb);
    if (charpos < 0) {
      // Out of text range, look at mouse coords
      const totalLength = this.chardata.reduce((acc, cur) => acc + cur.length, 0);

      charpos = totalLength - 1;

      if (mouseX <= this.chardata[0][0].x) {
        charpos = 0;
      }

      if (
        this.textbb.x < mouseX &&
        mouseX < this.textbb.x + this.textbb.width &&
        this.textbb.y < mouseY &&
        mouseY < this.textbb.y + this.textbb.height
      ) {
        return -1;
      }
    } else {
      let index = charpos;

      while (index >= this.chardata[rowIndex].length - 1) {
        index -= this.chardata[rowIndex].length - 1;
        rowIndex += 1;
      }

      const charbb = this.chardata[rowIndex][index];
      const { angle = 0, height, width, x, y } = charbb;

      if (this.isVertical) {
        const normalAngle = angle + 0.5 * Math.PI;
        const dist = (mouseX - x) * Math.cos(normalAngle) + (mouseY - y) * Math.sin(normalAngle);

        if (dist > height / 2) {
          charpos += 1;
        }
      } else {
        const dist = (mouseX - x) * Math.cos(angle) + (mouseY - y) * Math.sin(angle);

        if (dist > width / 2) {
          charpos += 1;
        }
      }
    }

    // Add rowIndex because charbb = charnum + 1 in every row
    return charpos + rowIndex;
  }

  private setCursorFromPoint(mouse_x, mouse_y) {
    this.setCursor(this.getIndexFromPoint(mouse_x, mouse_y));
  }

  private setEndSelectionFromPoint(x, y, apply = false) {
    const i1 = this.textinput.selectionStart;
    const i2 = this.getIndexFromPoint(x, y);

    if (i2 < 0) {
      return;
    }

    const start = Math.min(i1, i2);
    const end = Math.max(i1, i2);

    this.setSelection(start, end, !apply);
  }

  private moveCursorLastRow = () => {
    const res = this.indexToRowAndIndex(this.textinput.selectionEnd);
    const { index } = res;
    let { rowIndex } = res;

    if (rowIndex === 0) {
      this.textinput.selectionEnd = 0;
      this.textinput.selectionStart = 0;
    } else {
      let newCursorIndex = 0;

      rowIndex -= 1;
      for (let i = 0; i < rowIndex; i += 1) {
        newCursorIndex += this.chardata[i].length;
      }
      newCursorIndex += Math.min(this.chardata[rowIndex].length - 1, index);
      this.textinput.selectionEnd = newCursorIndex;
      this.textinput.selectionStart = newCursorIndex;
    }
  };

  private moveCursorNextRow = () => {
    const res = this.indexToRowAndIndex(this.textinput.selectionEnd);
    const { index } = res;
    let { rowIndex } = res;

    if (rowIndex === this.chardata.length - 1) {
      this.textinput.selectionEnd += this.chardata[rowIndex].length - index - 1;
      this.textinput.selectionStart = this.textinput.selectionEnd;
    } else {
      let newCursorIndex = 0;

      rowIndex += 1;
      for (let i = 0; i < rowIndex; i += 1) {
        newCursorIndex += this.chardata[i].length;
      }
      newCursorIndex += Math.min(this.chardata[rowIndex].length - 1, index);
      this.textinput.selectionEnd = newCursorIndex;
      this.textinput.selectionStart = newCursorIndex;
    }
  };

  dbClickSelectAll = (): void => {
    this.setSelection(0, this.curtext.textContent.length);
  };

  private selectWord(evt) {
    if (!this.allowDbl || !this.curtext) {
      return;
    }

    const rootSctm = (document.getElementById('svgcontent') as unknown as SVGGraphicsElement).getScreenCTM().inverse();
    const zoom = workareaManager.zoomRatio;
    const ept = svgedit.math.transformPoint(evt.pageX, evt.pageY, rootSctm);
    const mouseX = ept.x * zoom;
    const mouseY = ept.y * zoom;
    const pt = this.screenToPt(mouseX, mouseY);

    const index = this.getIndexFromPoint(pt.x, pt.y);
    const str = this.curtext.textContent;
    const first = str.substr(0, index).replace(/[a-z0-9]+$/i, '').length;
    const m = str.substr(index).match(/^[a-z0-9]+/i);
    const last = (m ? m[0].length : 0) + index;

    this.setSelection(first, last);
  }

  select(elem) {
    this.curtext = elem;
    this.setInputValueFromCurtext();
    this.toEditMode(true);
  }

  start(elem) {
    this.curtext = elem;
    this.setInputValueFromCurtext();
    this.toEditMode();
  }

  setInputValueFromCurtext() {
    const { curtext } = this;
    const multiLineTextContent = Array.from(curtext.childNodes)
      .filter((child) => ['textPath', 'tspan'].includes(child.nodeName))
      .map((child) => child.textContent)
      .join('\u0085');

    this.textinput.value = multiLineTextContent;
  }

  mouseDown(evt, mouseTarget, startX: number, startY: number) {
    const pt = this.screenToPt(startX, startY);

    console.log('textaction mousedown');

    this.textinput.focus();
    this.setCursorFromPoint(pt.x, pt.y);
    this.lastX = startX;
    this.lastY = startY;
    // TODO: Find way to block native selection
  }

  mouseMove(mouseX: number, mouseY: number) {
    const pt = this.screenToPt(mouseX, mouseY);

    this.setEndSelectionFromPoint(pt.x, pt.y);
  }

  mouseUp(evt, mouseX, mouseY) {
    const pt = this.screenToPt(mouseX, mouseY);

    this.setEndSelectionFromPoint(pt.x, pt.y, true);

    // TODO: Find a way to make this work: Use transformed BBox instead of evt.target
    //  if (last_x === mouse_x && last_y === mouse_y
    //  && !svgedit.math.rectsIntersect(transbb, {x: pt.x, y: pt.y, width:0, height:0})) {
    //  textActions.toSelectMode(true);
    //  }
    const { curtext, lastX, lastY } = this;

    if (
      evt.target !== curtext &&
      evt.target.parentNode !== curtext &&
      mouseX < lastX + 2 &&
      mouseX > lastX - 2 &&
      mouseY < lastY + 2 &&
      mouseY > lastY - 2
    ) {
      this.toSelectMode(true);
    }
  }

  setCursor(index?: number) {
    let cursorIndex = index;
    const empty = this.textinput.value === '';

    this.textinput.focus();

    if (cursorIndex === undefined) {
      if (empty) {
        cursorIndex = 0;
      } else if (this.textinput.selectionEnd !== this.textinput.selectionStart) {
        return;
      } else {
        cursorIndex = this.textinput.selectionEnd;
      }
    }

    if (!empty) {
      this.textinput.setSelectionRange(cursorIndex, cursorIndex);
    }

    const { index: columnIndex, rowIndex } = this.indexToRowAndIndex(cursorIndex);
    const charbb = this.chardata[rowIndex][columnIndex];

    if (!charbb) {
      return;
    }

    this.cursor = document.getElementById('text_cursor');

    if (!this.cursor) {
      this.cursor = document.createElementNS(NS.SVG, 'line');
      svgedit.utilities.assignAttributes(this.cursor, {
        id: 'text_cursor',
        stroke: '#333',
        'stroke-width': 1,
      });
      svgedit.utilities.getElem('selectorParentGroup').appendChild(this.cursor);
    }

    if (!this.blinker) {
      this.blinker = setInterval(() => {
        const show = this.cursor.getAttribute('display') === 'none';

        this.cursor.setAttribute('display', show ? 'inline' : 'none');
      }, 600);
    }

    const angle = charbb.angle || 0;
    const sinAngle = Math.sin(angle);
    const cosAngle = Math.cos(angle);
    const startPt = this.ptToScreen(charbb.x, charbb.y);
    const endPt = this.isVertical
      ? this.ptToScreen(charbb.x + charbb.width * cosAngle, charbb.y + charbb.width * sinAngle)
      : this.ptToScreen(charbb.x - charbb.height * sinAngle, charbb.y + charbb.height * cosAngle);

    svgedit.utilities.assignAttributes(this.cursor, {
      display: 'inline',
      visibility: 'visible',
      x1: startPt.x,
      x2: endPt.x,
      y1: startPt.y,
      y2: endPt.y,
    });

    if (this.selblock) {
      this.selblock.setAttribute('d', '');
    }
  }

  hideCursor() {
    clearInterval(this.blinker);
    this.blinker = null;
    document.getElementById('text_cursor')?.remove();
    document.getElementById('text_selectblock')?.remove();
  }

  onUpKey = () => {
    const { isVertical, textinput } = this;

    if (isVertical) {
      textinput.selectionEnd = Math.max(textinput.selectionEnd - 1, 0);
      textinput.selectionStart = textinput.selectionEnd;
    } else {
      this.moveCursorLastRow();
    }
  };

  onDownKey = () => {
    const { isVertical, textinput } = this;

    if (isVertical) {
      textinput.selectionEnd += 1;
      textinput.selectionStart = textinput.selectionEnd;
    } else {
      this.moveCursorNextRow();
    }
  };

  onLeftKey = () => {
    const { isVertical, textinput } = this;

    if (isVertical) {
      this.moveCursorNextRow();
    } else {
      textinput.selectionEnd = Math.max(textinput.selectionEnd - 1, 0);
      textinput.selectionStart = textinput.selectionEnd;
    }
  };

  onRightKey = () => {
    const { isVertical, textinput } = this;

    if (isVertical) {
      this.moveCursorLastRow();
    } else {
      textinput.selectionEnd += 1;
      textinput.selectionStart = textinput.selectionEnd;
    }
  };

  newLine = () => {
    const { textinput } = this;
    const oldSelectionStart = textinput.selectionStart;

    textinput.value = `${textinput.value.substring(
      0,
      textinput.selectionStart,
    )}\u0085${textinput.value.substring(textinput.selectionEnd)}`;
    textinput.selectionStart = oldSelectionStart + 1;
    textinput.selectionEnd = oldSelectionStart + 1;
  };

  copyText = async () => {
    const { textinput } = this;

    if (textinput.selectionStart === textinput.selectionEnd) {
      console.log('No selection');

      return;
    }

    const selectedText = textinput.value.substring(textinput.selectionStart, textinput.selectionEnd);

    try {
      await navigator.clipboard.writeText(selectedText);
      console.log('Copying to clipboard was successful!', selectedText);
    } catch (err) {
      console.error('Async: Could not copy text: ', err);
    }
  };

  cutText = async () => {
    const { textinput } = this;

    if (textinput.selectionStart === textinput.selectionEnd) {
      console.log('No selection');

      return;
    }

    const selectedText = textinput.value.substring(textinput.selectionStart, textinput.selectionEnd);
    const start = textinput.selectionStart;

    try {
      await navigator.clipboard.writeText(selectedText);
      console.log('Copying to clipboard was successful!', selectedText);
    } catch (err) {
      console.error('Async: Could not copy text: ', err);
    }
    textinput.value =
      textinput.value.substring(0, textinput.selectionStart) + textinput.value.substring(textinput.selectionEnd);
    textinput.selectionStart = start;
    textinput.selectionEnd = start;
  };

  pasteText = async () => {
    const { textinput } = this;
    const clipboardText = await navigator.clipboard.readText();
    const start = textinput.selectionStart;

    textinput.value =
      textinput.value.substring(0, textinput.selectionStart) +
      clipboardText +
      textinput.value.substring(textinput.selectionEnd);
    textinput.selectionStart = start + clipboardText.length;
    textinput.selectionEnd = start + clipboardText.length;
  };

  selectAll = () => {
    const { textinput } = this;

    textinput.selectionStart = 0;
    textinput.selectionEnd = textinput.value.length;
  };

  toEditMode = (setCursor = false) => {
    const currentMode = getMouseMode();
    const { curtext } = this;

    this.isEditing = true;
    this.allowDbl = false;

    const isContinuousDrawing = useGlobalPreferenceStore.getState()['continuous_drawing'];

    this.previousMode = isContinuousDrawing ? currentMode : 'select';
    setMouseMode('textedit');

    const selectorManager = selector.getSelectorManager();

    selectorManager.requestSelector(curtext).show(true, false);
    // Make selector group accept clicks
    // selectorManager.requestSelector(curtext).selectorRect;
    this.init();
    this.valueBeforeEdit = this.textinput.value;

    $(curtext).css('cursor', 'text');

    if (setCursor) {
      this.setCursor();
    }

    setTimeout(() => {
      this.allowDbl = true;
    }, 300);
  };

  toSelectMode(shouldSelectElem = false) {
    const { curtext } = this;

    this.isEditing = false;
    setMouseMode(this.previousMode);
    this.hideCursor();
    $(curtext).css('cursor', 'move');

    if (shouldSelectElem) {
      svgCanvas.clearSelection();
    }

    const isTextPath = curtext.getAttribute('data-textpath') === '1';

    if (isTextPath) {
      const selectorManager = selector.getSelectorManager();

      selectorManager.releaseSelector(curtext);
      svgCanvas.addToSelection([curtext.parentElement], true);
    } else {
      svgCanvas.addToSelection([curtext], true);
    }

    svgedit.recalculate.recalculateDimensions(curtext);

    const batchCmd = new history.BatchCommand('Edit Text');

    if (this.valueBeforeEdit && this.valueBeforeEdit !== this.textinput.value) {
      if (curtext) {
        const cmd = new history.ChangeTextCommand(curtext, this.valueBeforeEdit, this.textinput.value);

        batchCmd.addSubCommand(cmd);
        currentFileManager.setHasUnsavedChanges(true);
      }
    }

    if (curtext && !curtext.textContent.length) {
      // No content, so delete text
      let cmd: IBatchCommand;

      if (curtext.getAttribute('data-textpath')) {
        cmd = textPathEdit.detachText(curtext.parentNode as SVGGElement, true).cmd;

        if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);

        cmd = deleteElements([curtext], true);
      } else {
        cmd = deleteSelectedElements(true);
      }

      if (this.valueBeforeEdit && cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    }

    if (!batchCmd.isEmpty()) svgCanvas.undoMgr.addCommandToHistory(batchCmd);

    $(this.textinput).trigger('blur');
    this.curtext = null;
  }

  setInputElem(elem) {
    this.textinput = elem;
  }

  setFontSize = (val: number) => {
    this.fontSize = val;
  };

  setIsVertical = (val: boolean) => {
    this.isVertical = val;
  };

  clear() {
    const { curtext, isEditing } = this;
    const currentMode = getMouseMode();

    if (currentMode === 'textedit') {
      this.toSelectMode();
    } else if (isEditing) {
      this.isEditing = false;

      const selectorManager = selector.getSelectorManager();

      selectorManager.releaseSelector(curtext);
      this.hideCursor();
    }
  }

  init() {
    if (!this.curtext) {
      return;
    }
    // if (svgedit.browser.supportsEditableText()) {
    //   curtext.select();
    //   return;
    // }

    if (!this.curtext.parentNode) {
      // Result of the ffClone, need to get correct element
      const selectedElements = svgCanvas.getSelectedElems();
      const [elem] = selectedElements;

      this.curtext = elem;

      const selectorManager = selector.getSelectorManager();

      selectorManager.requestSelector(this.curtext).show(true, false);
    }

    this.chardata = [];

    const xform = this.curtext.getAttribute('transform');

    this.textbb = svgedit.utilities.getBBox(this.curtext);
    this.matrix = xform ? svgedit.math.getMatrix(this.curtext) : null;

    this.calculateChardata();
    this.textinput.focus();
    $(this.curtext).unbind('dblclick', this.selectWord).dblclick(this.selectWord);

    this.setSelection(this.textinput.selectionStart, this.textinput.selectionEnd, true);
  }
}

// TextActions Singleton
const textActions = new TextActions();

export default textActions;
