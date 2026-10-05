/**
 * A single opaque black pixel, stretched to whatever a block needs.
 *
 * The dot-vs-line comparison engraves images rather than filled shapes, because that is what
 * decides which of the two a galvo head does: the exporter turns a dithered image into one dot per
 * pixel and a binarised one into line runs, and both are rasterized at the layer's own resolution,
 * so the dot lattice and the line pitch come out the same. One constant serves every block -- a
 * black pixel scaled up is still black, whichever way it is read.
 */
export const BLACK_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC';

/** Anything above this is dark, so a pure black block stays solid either side of it. */
export const BLACK_PIXEL_THRESHOLD = 128;
