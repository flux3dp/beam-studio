import * as THREE from 'three';

import Vector2d from 'helpers/boxgen/vector2d';
import { BOLT_HEX_WIDTH, BOLT_THICK } from 'app/constants/boxgen-constants';
import { Direction, Plotter, transpose } from 'helpers/boxgen/shapeHelper';
import { IController, IPlaneShape } from 'interfaces/IBoxgen';

const SLOT_BOLT_POS = 1;
const getTeethData = (params: {
  sheetThickness: number;
  teethLength: number;
  width: number;
  height: number;
}) => {
  const { teethLength, sheetThickness } = params;
  const outerWidth = params.width;
  const outerHeight = params.height;
  const innerWidth = outerWidth - sheetThickness * 2;
  const innerHeight = outerHeight - sheetThickness * 2;
  const xCount = Math.round(innerWidth / teethLength / 2);
  const yCount = Math.round(innerHeight / teethLength / 2);

  const xBegin = -outerWidth / 2 + (outerWidth - teethLength * (xCount * 2 - 1)) / 2;
  const yBegin = -outerHeight / 2 + (outerHeight - teethLength * (yCount * 2 - 1)) / 2;
  const xPos = [];
  for (let i = 0; i < xCount; i += 1) {
    xPos.push(xBegin + teethLength * 2 * i);
  }
  const yPos = [];
  for (let i = 0; i < yCount; i += 1) {
    yPos.push(yBegin + teethLength * 2 * i);
  }
  return {
    xCount,
    yCount,
    xPos,
    yPos,
  };
};

const drawConvex = (
  shape: THREE.Shape,
  params: IController,
  pos: { x: number; y: number },
  dir: Vector2d
) => {
  const plotter = new Plotter(shape);
  const norm = transpose(dir);
  const thickness = params.sheetThickness;
  const length = params.teethLength;
  const tSlotDiameter = Number(params.tSlotDiameter);
  plotter.lineTo(pos.x, pos.y);
  plotter.vecTo(norm, thickness);
  if (params.joint === 't-slot') {
    plotter.vecTo(dir, (length - tSlotDiameter) * 0.5);
    plotter.vecTo(norm, -tSlotDiameter);
    plotter.vecTo(dir, tSlotDiameter);
    plotter.vecTo(norm, tSlotDiameter);
  }
  plotter.lineToAbs(
    pos.x + norm.x * thickness + dir.x * length,
    pos.y + norm.y * thickness + dir.y * length
  );
  plotter.vecTo(norm, -thickness);
};

const drawConcave = (
  shape: THREE.Shape,
  params: IController,
  pos: { x: number; y: number },
  dir: Vector2d
) => {
  const plotter = new Plotter(shape);
  const norm = transpose(dir);
  const thickness = params.sheetThickness;
  const length = params.teethLength;
  const tSlotDiameter = Number(params.tSlotDiameter);
  const tSlotLength = Number(params.tSlotLength);
  const boltType = `M${tSlotDiameter}`;
  const boltThickness = Object.keys(BOLT_THICK).includes(boltType)
    ? BOLT_THICK[boltType as keyof typeof BOLT_THICK] + 0.3
    : tSlotDiameter;
  const boltWidth = Object.keys(BOLT_HEX_WIDTH).includes(boltType)
    ? 0.25 + (BOLT_HEX_WIDTH[boltType as keyof typeof BOLT_HEX_WIDTH] - tSlotDiameter) / 2
    : 2;
  plotter.lineTo(pos.x, pos.y);
  plotter.vecTo(norm, -thickness);
  if (params.joint === 't-slot') {
    // Create space for Bolt
    const insertLength = tSlotLength - thickness;
    plotter.vecTo(dir, (length - tSlotDiameter) * 0.5);
    plotter.vecTo(norm, -(insertLength - boltThickness) * SLOT_BOLT_POS);
    plotter.vecTo(dir, -boltWidth);
    plotter.vecTo(norm, -boltThickness);
    plotter.vecTo(dir, boltWidth);
    plotter.vecTo(norm, -(insertLength - boltThickness) * (1 - SLOT_BOLT_POS));
    plotter.vecTo(dir, tSlotDiameter);

    plotter.vecTo(norm, (insertLength - boltThickness) * (1 - SLOT_BOLT_POS));
    plotter.vecTo(dir, boltWidth);
    plotter.vecTo(norm, boltThickness);
    plotter.vecTo(dir, -boltWidth);
    plotter.vecTo(norm, (insertLength - boltThickness) * SLOT_BOLT_POS);
  }
  plotter.lineToAbs(
    pos.x + dir.x * length - norm.x * thickness,
    pos.y + dir.y * length - norm.y * thickness
  );
  plotter.vecTo(norm, thickness);
};

export const getTopBottomShape = (params: IController): IPlaneShape => {
  const { sheetThickness } = params;
  const outerWidth = params.width;
  const outerHeight = params.height;
  const innerWidth = outerWidth - sheetThickness * 2;
  const innerHeight = outerHeight - sheetThickness * 2;
  const teeth = getTeethData(params);

  const shape = new THREE.Shape();
  shape.moveTo(-innerWidth / 2, -innerHeight / 2);
  teeth.xPos.forEach((teethX) => {
    drawConvex(shape, params, { x: teethX, y: -innerHeight / 2 }, Direction.RIGHT);
  });
  shape.lineTo(innerWidth / 2, -innerHeight / 2);

  teeth.yPos.forEach((teethY) => {
    drawConvex(shape, params, { x: innerWidth / 2, y: teethY }, Direction.DOWN);
  });

  shape.lineTo(innerWidth / 2, innerHeight / 2);

  teeth.xPos.forEach((teethX) => {
    drawConvex(shape, params, { x: -teethX, y: innerHeight / 2 }, Direction.LEFT);
  });

  shape.lineTo(-innerWidth / 2, innerHeight / 2);

  teeth.yPos.forEach((teethY) => {
    drawConvex(shape, params, { x: -innerWidth / 2, y: -teethY }, Direction.UP);
  });

  shape.lineTo(-innerWidth / 2, -innerHeight / 2);
  return { shape, width: params.width, height: params.height };
};

export const getFrontBackShape = (params: IController): IPlaneShape => {
  const { width, height } = params;
  const outerWidth = width;
  const outerHeight = height;

  const teeth = getTeethData(params);

  const shape = new THREE.Shape();
  shape.moveTo(-outerWidth / 2, -outerHeight / 2);
  if (params.cover) {
    teeth.xPos.forEach((teethX) => {
      drawConcave(shape, params, { x: teethX, y: -outerHeight / 2 }, Direction.RIGHT);
    });
  }
  shape.lineTo(outerWidth / 2, -outerHeight / 2);

  teeth.yPos.forEach((teethY) => {
    drawConcave(shape, params, { x: outerWidth / 2, y: teethY }, Direction.DOWN);
  });

  shape.lineTo(outerWidth / 2, outerHeight / 2);

  teeth.xPos.forEach((teethX) => {
    drawConcave(shape, params, { x: -teethX, y: outerHeight / 2 }, Direction.LEFT);
  });

  shape.lineTo(-outerWidth / 2, outerHeight / 2);

  teeth.yPos.forEach((teethY) => {
    drawConcave(shape, params, { x: -outerWidth / 2, y: -teethY }, Direction.UP);
  });

  shape.lineTo(-outerWidth / 2, -outerHeight / 2);
  return { shape, width: params.width, height: params.height };
};

export const getLeftRightShape = (params: IController): IPlaneShape => {
  const { sheetThickness, width, height } = params;
  const outerWidth = width;
  const outerHeight = height;
  const innerWidth = outerWidth - sheetThickness * 2;

  const teeth = getTeethData(params);

  const shape = new THREE.Shape();
  shape.moveTo(-innerWidth / 2, -outerHeight / 2);
  if (params.cover) {
    teeth.xPos.forEach((teethX) => {
      drawConcave(shape, params, { x: teethX, y: -outerHeight / 2 }, Direction.RIGHT);
    });
  }
  shape.lineTo(innerWidth / 2, -outerHeight / 2);

  teeth.yPos.forEach((teethY) => {
    drawConvex(shape, params, { x: innerWidth / 2, y: teethY }, Direction.DOWN);
  });

  shape.lineTo(innerWidth / 2, outerHeight / 2);

  teeth.xPos.forEach((teethX) => {
    drawConcave(shape, params, { x: -teethX, y: outerHeight / 2 }, Direction.LEFT);
  });

  shape.lineTo(-innerWidth / 2, outerHeight / 2);

  teeth.yPos.forEach((teethY) => {
    drawConvex(shape, params, { x: -innerWidth / 2, y: -teethY }, Direction.UP);
  });

  shape.lineTo(-innerWidth / 2, -outerHeight / 2);
  return { shape, width: params.width, height: params.height };
};
