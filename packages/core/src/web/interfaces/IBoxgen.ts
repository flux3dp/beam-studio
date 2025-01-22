import type * as THREE from 'three';

export interface IPlaneShape {
  height: number;
  shape: THREE.Shape;
  width: number;
}

export interface IController {
  cover: boolean;
  depth: number;
  height: number;
  joint: 'edge' | 'finger' | 't-slot';
  sheetThickness: number;
  teethLength: number;
  tSlotCount: number;
  tSlotDiameter: number;
  tSlotLength: number;
  volume: 'inner' | 'outer';
  width: number;
}

export interface IExportOptions {
  compRadius: number;
  joinOutput: boolean;
  textLabel: boolean;
}
