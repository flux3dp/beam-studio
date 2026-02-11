/**
 * Geometry engine barrel export.
 *
 * Re-exports functions from the puzzle geometry subsystem.
 * Types should be imported directly from '../types'.
 */

// imageLayout — shared "center and cover" image placement
export { computeImagePlacement, type ImagePlacement } from './imageLayout';

// puzzleGeometry — unified geometry service
export { computeExportLayout, computePuzzleGeometry } from './puzzleGeometry';

// shapeGenerators — shape paths, metadata, clipping
export { drawShapeClipPath, getShapeMetadata } from './shapeGenerators';

// svgExport — export pipeline
export { exportToCanvas } from './svgExport';
