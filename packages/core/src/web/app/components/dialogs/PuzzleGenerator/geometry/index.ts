/**
 * Geometry engine barrel export.
 *
 * Re-exports the public API of the puzzle geometry subsystem.
 * Consumer code can import from './geometry' instead of individual files.
 */

// puzzleGeometry — unified geometry service
export { computeExportLayout, computePuzzleGeometry, LAYER_GAP } from './puzzleGeometry';
export type { PuzzleGeometry, PuzzleLayout } from './puzzleGeometry';

// shapeGenerators — shape paths, metadata, clipping
export { drawShapeClipPath, getShapeMetadata } from './shapeGenerators';
export type { ShapeMetadata } from './shapeGenerators';

// svgExport — export pipeline
export { exportToCanvas } from './svgExport';
