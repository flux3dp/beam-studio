/**
 * The inner engraving material: its shape, size, position and refractive index.
 *
 * All values are in **mm**, matching the other document settings (the scene converts to its own
 * 0.1mm units at the render boundary). The material is a document setting rather than a canvas
 * object: it is not sent to swiftray (A-3 — the backend does no material clipping) and is not
 * stored in the .beam file (A-2), it only tells the user where their workpiece is.
 */

export const MATERIAL_SHAPES = ['box', 'cylinder', 'sphere'] as const;

export type MaterialShape = (typeof MATERIAL_SHAPES)[number];

/**
 * Size limits, in mm.
 *
 * ⚠️ XY is deliberately **not** capped by the work area: a workpiece may be larger than the 70x70mm
 * work area, only the part inside it can be engraved. The cap here is a sanity bound for the input,
 * not a hardware limit. Height is capped per model by `workareaConstants[model].innerEngraving`.
 */
export const MATERIAL_SIZE_LIMIT = { max: 1000, min: 1 } as const;

/**
 * Position of the material's **centre**, in mm, from the work area origin.
 *
 * Centre rather than a bounding box corner because inner engraving wants the workpiece near the
 * middle of the field, and because a corner anchor drifts off centre every time the size changes.
 * A sphere or a cylinder has no meaningful corner either. The dialog can still show and edit the
 * corner, but that is a view of this value, not a second source of truth.
 */
export const MATERIAL_POSITION_LIMIT = { max: 1000, min: -1000 } as const;

/**
 * Refractive index of the workpiece.
 *
 * The laser refracts at the surface, so the geometric depth and the actual focus depth differ; the
 * value is only passed through to swiftray, which applies the compensation (A-3 / B-3). Default is
 * K9 / optical glass (~1.5168); ordinary crystal glass is 1.45~1.6.
 */
export const REFRACTIVE_INDEX_LIMIT = { max: 3, min: 1, precision: 3 } as const;

/**
 * Focal length of the machine's lens, in mm: optical centre to the designed focal plane.
 *
 * A property of the hardware rather than of the job, but swiftray's machine settings have no field
 * for it, so it travels with the convert params instead (backend G). Without it the refraction
 * compensation degrades to depth-only — the XY spread a refracted beam picks up off-axis cannot be
 * corrected without knowing F.
 *
 * ⚠️ The default is provisional: a 70x70mm galvo field is typically an F-theta around 100mm, but the
 * real lens has to be confirmed against the machine.
 */
export const DEFAULT_FOCAL_LENGTH = 100;
export const FOCAL_LENGTH_LIMIT = { max: 1000, min: 10 } as const;

/**
 * Safety margin, in mm: how far engraving stays away from the material's surfaces.
 *
 * Cracking too close to a surface breaks it out, so both the fit-on-import check and the
 * "centre in the engravable area" action inset the material by this much. xTool leaves 4mm.
 * Dev-only setting for now (TODO.md 08/06 with PM), a document setting so it travels with the file.
 */
export const DEFAULT_SAFETY_MARGIN = 4;
export const SAFETY_MARGIN_LIMIT = { max: 50, min: 0 } as const;

export const DEFAULT_MATERIAL = {
  depth: 50,
  diameter: 50,
  height: 50,
  refractiveIndex: 1.52,
  shape: 'box' as MaterialShape,
  width: 50,
  // centred on the 70x70mm work area: Promark UV is the only model with inner engraving, and
  // starting centred is what the technique wants anyway
  x: 35,
  y: 35,
} as const;

/**
 * Per-object engraving parameters (TODO.md 第 6 點).
 *
 * Kept per object rather than per layer, which is what the panel edits and what swiftray reads
 * first — it falls back to the layer when an attribute is absent, so both models work and the
 * per-object / per-layer question stays open (TODO.md 的 TBD).
 *
 * The defaults here are only what the panel shows for a fresh object; the backend has its own
 * matching defaults for the absent case, so the two must be kept in step.
 */
export const ENGRAVING_MODES = ['line', 'dot'] as const;

export type EngravingMode = (typeof ENGRAVING_MODES)[number];

/** mm. Ranges are provisional until verified on real hardware (TODO.md 仍待補充的資訊 2). */
export const DEFAULT_LAYER_HEIGHT = 0.1;
export const DEFAULT_POINT_SPACING = 0.1;
export const LAYER_HEIGHT_LIMIT = { max: 5, min: 0.001 } as const;
export const POINT_SPACING_LIMIT = { max: 5, min: 0.001 } as const;
