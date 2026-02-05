import React from 'react';

import Shape from '@doodle3d/clipper-js';

import { getFrontBackShape, getLeftRightShape, getTopBottomShape } from '@core/app/components/boxgen/Shape';
import { DEFAULT_LABEL_COLOR, DEFAULT_STROKE_COLOR } from '@core/app/constants/boxgen-constants';
import type { IController, IExportOptions } from '@core/interfaces/IBoxgen';
interface ShapeDisplayObject {
  shape: THREE.Shape;
  text: string;
  x: number;
  y: number;
}

interface ShapeRaw {
  height: number;
  shape: THREE.Shape;
  text: string;
  width: number;
}

// doodle3d clipper only works with intergers
const scale = 1000;

const shapeToPath = (shape: Shape, cx: number, cy: number): string =>
  `M${shape.paths[0].map((p) => `${p.X / scale + cx},${p.Y / scale + cy}`).join(' L')} Z`;

const getBlockDistance = (options: IExportOptions) => (options.joinOutput ? [0, 0] : [5, 5]);

export class OutputPage {
  options: IExportOptions;
  shapes: ShapeDisplayObject[] = [];
  nextX = 0;
  cursorX = 0;
  cursorY = 0;
  maxX = 0;
  maxY = 0;
  isEmpty = true;

  constructor(canvasWidth: number, canvasHeight: number, options: IExportOptions) {
    this.nextX = options.compRadius * 2;
    this.cursorX = options.compRadius * 2;
    this.cursorY = options.compRadius * 2;
    this.maxX = canvasWidth;
    this.maxY = canvasHeight;
    this.options = options;
  }

  addShape(shape: ShapeRaw): boolean {
    const { compRadius } = this.options;
    const inflation = compRadius * 2;
    const [dx, dy] = getBlockDistance(this.options);

    if (this.cursorY + shape.height + inflation > this.maxY && this.cursorX + shape.width + inflation <= this.maxX) {
      this.cursorX = this.nextX;
      this.cursorY = inflation;
    }

    if (!this.isEmpty && this.cursorX + shape.width + inflation > this.maxX) {
      return false;
    }

    this.shapes.push({
      shape: shape.shape,
      text: shape.text,
      x: this.cursorX + shape.width / 2,
      y: this.cursorY + shape.height / 2,
    });
    this.isEmpty = false;
    this.cursorY += shape.height + dy + inflation;
    this.nextX = Math.max(this.nextX, this.cursorX + shape.width + dx + inflation);

    return true;
  }
}

export const getLayouts = (
  canvasWidth: number,
  canvasHeight: number,
  data: IController,
  options: IExportOptions,
): { pages: Array<{ label: React.JSX.Element[]; shape: React.JSX.Element[] }> } => {
  const color = DEFAULT_STROKE_COLOR;
  const textColor = DEFAULT_LABEL_COLOR;
  const { depth, height, width } = data;

  const topBottomShape = getTopBottomShape({ ...data, height: depth, width });
  const frontBackShape = getFrontBackShape({ ...data, height, width: depth });
  const leftRightShape = getLeftRightShape({ ...data, height, width });

  const shapes = [
    data.cover && { ...topBottomShape, text: 'Top' },
    { ...topBottomShape, text: 'Bottom' },
    { ...frontBackShape, text: 'Front' },
    { ...frontBackShape, text: 'Back' },
    { ...leftRightShape, text: 'Left' },
    { ...leftRightShape, text: 'Right' },
  ].filter(Boolean);

  const outputs: OutputPage[] = [new OutputPage(canvasWidth, canvasHeight, options)];

  shapes.forEach((shape) => {
    const success = outputs[outputs.length - 1].addShape(shape);

    if (!success) {
      outputs.push(new OutputPage(canvasWidth, canvasHeight, options));
      outputs[outputs.length - 1].addShape(shape);
    }
  });

  const pages = outputs.map((output) => ({
    label: options.textLabel
      ? output.shapes.map((obj: ShapeDisplayObject, index) => (
          <text
            dominantBaseline="middle"
            key={index}
            style={{
              fill: `rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`,
            }}
            textAnchor="middle"
            x={obj.x}
            y={obj.y}
          >
            {obj.text}
          </text>
        ))
      : [],
    shape: output.shapes.map((obj: ShapeDisplayObject, index) => {
      const path = [obj.shape.getPoints().map((p) => ({ X: p.x * scale, Y: p.y * scale }))];
      const sh = new Shape(path, true, false).offset(options.compRadius * scale, {
        endType: 'etClosedPolygon',
        jointType: 'jtSquare',
        miterLimit: 2.0,
      });

      return (
        <path
          d={shapeToPath(sh, obj.x, obj.y)}
          fill="none"
          key={index}
          stroke={`rgb(${color.r}, ${color.g}, ${color.b})`}
        />
      );
    }),
  }));

  return { pages };
};
