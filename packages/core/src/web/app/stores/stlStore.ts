import type { BufferGeometry } from 'three';
import { create } from 'zustand';

/**
 * The 3D transform of an STL object, kept **decomposed** rather than as a matrix.
 *
 * A matrix is the right thing to send to swiftray and to write into `data-stl-matrix`, but it is
 * the wrong thing to store: recovering position / rotation / scale from it is ambiguous once a
 * mirror is involved (a negative determinant can be attributed to any axis), so a panel that
 * decomposed on every render would show the rotation jumping around after a flip. Keeping the parts
 * separate makes every field the panel edits a stored value, and the matrix a derived one
 * (`utils/transform.ts` composes it).
 */
export interface StlTransform {
  /** Mirror per axis, in the mesh's own space about its centre. Deliberately not folded into
   *  `scale`, so the panel can show a positive size and an independent flip state. */
  flip: [boolean, boolean, boolean];
  /** The object's **centre**, in scene units (0.1mm). Centre rather than a corner so that scaling
   *  and rotating leave the object where it is. */
  position: [number, number, number];
  /** Euler angles in radians, XYZ order (fixed, and stated in the panel). */
  rotation: [number, number, number];
  /** Positive. 1 means the mesh's original size in mm; the mm -> 0.1mm factor is applied when the
   *  matrix is composed, not here. */
  scale: [number, number, number];
}

/**
 * The runtime side of an STL object.
 *
 * This is the **STL 3D object**, which is a distinct thing from its **projection rect** in
 * `svgcontent`. The 3D object owns the mesh and the 3D transform; the rect is derived from them and
 * only carries the XY projection plus the metadata that has to be serialized.
 */
export interface StlObject {
  /**
   * The original STL file bytes, exactly as imported.
   *
   * Kept alongside the parsed geometry because both consumers of the mesh want the file itself, not
   * a re-serialized version of `geometry`: the `stlObjects` payload sent to swiftray (A-3) and the
   * .beam block 6 (A-2). Round-tripping through three.js would lose nothing geometrically but would
   * mean two different meshes for the same object, so the raw buffer stays the single source.
   */
  buffer: ArrayBuffer;
  /** Parsed mesh, in the STL file's own units (mm). Never mutated after import. */
  geometry: BufferGeometry;
  /** Element id of the projection rect. Also the key for the mesh binary in .beam block 6. */
  id: string;
  /**
   * The transform the object was imported with — what the panel's reset buttons go back to.
   *
   * The whole transform rather than just the scale: import already decides more than one of these
   * (it shrinks a model that would not fit the engravable area, and centres it), and a later
   * feature that re-bases an object — changing the up axis, or re-orienting the whole scene — needs
   * somewhere to record what "as imported" meant. Resetting the size to the STL file's own
   * millimetres would blow the object straight back out of the workpiece.
   */
  initialTransform: StlTransform;
  transform: StlTransform;
}

interface StlStore {
  clear: () => void;
  objects: Record<string, StlObject>;
  remove: (id: string) => void;
  /** Selection inside the 3D canvas. Kept in step with svgedit's selection by
   *  `InnerEngraving/utils/selection.ts` — never set it directly from a click handler. */
  selectedId: null | string;
  set: (object: StlObject) => void;
  setSelectedId: (id: null | string) => void;
  setTransform: (id: string, transform: StlTransform) => void;
}

export const useStlStore = create<StlStore>((set) => ({
  clear: () =>
    set((state) => {
      // three.js does not free GPU buffers on garbage collection
      Object.values(state.objects).forEach(({ geometry }) => geometry.dispose());

      return { objects: {}, selectedId: null };
    }),
  objects: {},
  remove: (id) =>
    set((state) => {
      const { [id]: removed, ...rest } = state.objects;

      removed?.geometry.dispose();

      return { objects: rest, selectedId: state.selectedId === id ? null : state.selectedId };
    }),
  selectedId: null,
  set: (object) => set((state) => ({ objects: { ...state.objects, [object.id]: object } })),
  setSelectedId: (selectedId) => set({ selectedId }),
  setTransform: (id, transform) =>
    set((state) => {
      const target = state.objects[id];

      if (!target) return state;

      return { objects: { ...state.objects, [id]: { ...target, transform } } };
    }),
}));
