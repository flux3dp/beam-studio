import type { BufferGeometry, Matrix4 } from 'three';
import { create } from 'zustand';

import { todo } from '@core/helpers/is-dev';

/**
 * The runtime side of an STL object.
 *
 * This is the **STL 3D object**, which is a distinct thing from its **projection rect** in
 * `svgcontent`. The 3D object owns the mesh and the 3D transform; the rect is derived from them and
 * only carries the XY projection plus the metadata that has to be serialized.
 */
export interface StlObject {
  /** Parsed mesh, in the STL file's own units (mm). Never mutated after import. */
  geometry: BufferGeometry;
  /** Element id of the projection rect. Also the key for the mesh binary in .beam block 6. */
  id: string;
  /** Mesh space (mm) -> scene space (0.1mm). The x10 unit factor is baked in. */
  // esther ask: with additional custom transform?
  matrix: Matrix4;
}

todo(
  'esther ask: StlStore 裡面的 set 和 create 的 set 是否會容易導致誤解/衝突？改名 add 或 addStl？（記得 remove 要對齊）',
);

interface StlStore {
  clear: () => void;
  objects: Record<string, StlObject>;
  remove: (id: string) => void;
  /** Selection inside the 3D canvas. TODO: sync with svgedit's selection. */
  selectedId: null | string;
  set: (object: StlObject) => void;
  setMatrix: (id: string, matrix: Matrix4) => void;
  setSelectedId: (id: null | string) => void;
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
  setMatrix: (id, matrix) =>
    set((state) => {
      const target = state.objects[id];

      if (!target) return state;

      return { objects: { ...state.objects, [id]: { ...target, matrix } } };
    }),
  setSelectedId: (selectedId) => set({ selectedId }),
}));
