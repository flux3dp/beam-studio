import type { Box3 } from 'three';

import { getEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import { getWorldBox } from '@core/app/components/beambox/InnerEngraving/utils/transform';
import { useStlStore } from '@core/app/stores/stlStore';
import { STL_ATTR } from '@core/app/svgedit/stl/constants';

export interface InnerEngravingObjectWarnings {
  hasInvalidEngravableArea: boolean;
  outOfRange: number;
  overlaps: number;
  wrongLayerOrder: number;
}

interface CheckedObject {
  box: Box3;
  layerExecutionIndex: number;
}

const overlapsOnXY = (a: Box3, b: Box3): boolean =>
  a.min.x < b.max.x && a.max.x > b.min.x && a.min.y < b.max.y && a.max.y > b.min.y;

const overlapsIn3d = (a: Box3, b: Box3): boolean => overlapsOnXY(a, b) && a.min.z < b.max.z && a.max.z > b.min.z;

const containsBox = (outer: { max: number[]; min: number[] }, inner: Box3): boolean =>
  inner.min.x >= outer.min[0] &&
  inner.min.y >= outer.min[1] &&
  inner.min.z >= outer.min[2] &&
  inner.max.x <= outer.max[0] &&
  inner.max.y <= outer.max[1] &&
  inner.max.z <= outer.max[2];

/**
 * Cheap export-time checks based on transformed AABBs. This intentionally stays conservative:
 * false positives can be reviewed and continued, while a triangle-level intersection test would
 * make the Go button parse every mesh and would no longer be a quick safety check.
 */
export const checkInnerEngravingObjects = (): InnerEngravingObjectWarnings => {
  const engravable = getEngravableBox();
  const objects = useStlStore.getState().objects;
  // Layer execution order is the reverse of the SVG DOM order.
  const executionLayers = [...document.querySelectorAll('#svgcontent > g.layer:not([display="none"])')].reverse();
  const checked: CheckedObject[] = [];

  executionLayers.forEach((layer, layerExecutionIndex) => {
    layer.querySelectorAll(`[${STL_ATTR.marker}]`).forEach((elem) => {
      const object = objects[elem.id];

      if (!object) return;

      checked.push({
        box: getWorldBox(object),
        layerExecutionIndex,
      });
    });
  });

  const warnings: InnerEngravingObjectWarnings = {
    hasInvalidEngravableArea: !engravable.isValid && checked.length > 0,
    outOfRange: engravable.isValid ? checked.filter(({ box }) => !containsBox(engravable, box)).length : 0,
    overlaps: 0,
    wrongLayerOrder: 0,
  };

  for (let i = 0; i < checked.length; i += 1) {
    for (let j = i + 1; j < checked.length; j += 1) {
      const first = checked[i];
      const second = checked[j];

      if (overlapsIn3d(first.box, second.box)) warnings.overlaps += 1;

      if (
        first.layerExecutionIndex !== second.layerExecutionIndex &&
        overlapsOnXY(first.box, second.box) &&
        second.box.min.z < first.box.min.z
      ) {
        warnings.wrongLayerOrder += 1;
      }
    }
  }

  return warnings;
};

export const hasInnerEngravingObjectWarnings = (warnings: InnerEngravingObjectWarnings): boolean =>
  warnings.hasInvalidEngravableArea || warnings.outOfRange > 0 || warnings.overlaps > 0 || warnings.wrongLayerOrder > 0;
