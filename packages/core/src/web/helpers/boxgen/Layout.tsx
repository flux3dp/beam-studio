import React from 'react';
import Shape from '@doodle3d/clipper-js';
import { DEFAULT_LABEL_COLOR, DEFAULT_STROKE_COLOR } from 'app/constants/boxgen-constants';
import {
  getTopBottomShape,
  getFrontBackShape,
  getLeftRightShape,
} from 'app/components/boxgen/Shape';
import { IController, IExportOptions } from 'interfaces/IBoxgen';

interface ShapeDisplayObject {
  shape: THREE.Shape;
  x: number;
  y: number;
  text: string;
}

interface ShapeRaw {
  shape: THREE.Shape;
  width: number;
  height: number;
  text: string;
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
    if (
      this.cursorY + shape.height + inflation > this.maxY &&
      this.cursorX + shape.width + inflation <= this.maxX
    ) {
      this.cursorX = this.nextX;
      this.cursorY = inflation;
    }
    if (this.cursorX + shape.width + inflation > this.maxX) return false;
    this.shapes.push({
      shape: shape.shape,
      x: this.cursorX + shape.width / 2,
      y: this.cursorY + shape.height / 2,
      text: shape.text,
    });
    this.cursorY += shape.height + dy + inflation;
    this.nextX = Math.max(this.nextX, this.cursorX + shape.width + dx + inflation);
    return true;
  }
}

export const getLayouts = (
  canvasWidth: number,
  canvasHeight: number,
  data: IController,
  options: IExportOptions
): { pages: { shape: JSX.Element[]; label: JSX.Element[] }[] } => {
  const color = DEFAULT_STROKE_COLOR;
  const textColor = DEFAULT_LABEL_COLOR;
  const { width, height, depth } = data;

  const topBottomShape = getTopBottomShape({ ...data, width, height: depth });
  const frontBackShape = getFrontBackShape({ ...data, width: depth, height });
  const leftRightShape = getLeftRightShape({ ...data, width, height });

  const shapes = [
    { ...topBottomShape, text: 'Bottom' },
    { ...frontBackShape, text: 'Front' },
    { ...frontBackShape, text: 'Back' },
    { ...leftRightShape, text: 'Left' },
    { ...leftRightShape, text: 'Right' },
  ];

  if (data.cover) {
    shapes.unshift({ ...topBottomShape, text: 'Top' });
  }

  const outputs: OutputPage[] = [new OutputPage(canvasWidth, canvasHeight, options)];

  shapes.forEach((shape) => {
    const success = outputs[outputs.length - 1].addShape(shape);
    if (!success) {
      outputs.push(new OutputPage(canvasWidth, canvasHeight, options));
      outputs[outputs.length - 1].addShape(shape);
    }
  });

  const pages = outputs.map((output) => ({
    shape: output.shapes.map((obj: ShapeDisplayObject, index) => {
      const path = [obj.shape.getPoints().map((p) => ({ X: p.x * scale, Y: p.y * scale }))];
      const sh = new Shape(path, true, false).offset(options.compRadius * scale, {
        jointType: 'jtSquare',
        endType: 'etClosedPolygon',
        miterLimit: 2.0,
      });
      return (
        <path
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          fill="none"
          stroke={`rgb(${color.r}, ${color.g}, ${color.b})`}
          d={shapeToPath(sh, obj.x, obj.y)}
        />
      );
    }),
    label: options.textLabel
      ? output.shapes.map((obj: ShapeDisplayObject, index) => (
          <text
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            x={obj.x}
            y={obj.y}
            dominantBaseline="middle"
            textAnchor="middle"
            style={{
              fill: `rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`,
            }}
          >
            {obj.text}
          </text>
        ))
      : [],
  }));

  return { pages };
};
