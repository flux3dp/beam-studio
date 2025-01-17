import * as THREE from 'three';

export interface IPlaneShape {
  shape: THREE.Shape;
  width: number;
  height: number;
}

export interface IController {
  volume: 'outer' | 'inner';
  cover: boolean;
  width: number;
  height: number;
  depth: number;
  sheetThickness: number;
  joint: 'edge' | 'finger' | 't-slot';
  teethLength: number;
  tSlotCount: number;
  tSlotDiameter: number;
  tSlotLength: number;
}

export interface IExportOptions {
  joinOutput: boolean;
  textLabel: boolean;
  compRadius: number;
}
