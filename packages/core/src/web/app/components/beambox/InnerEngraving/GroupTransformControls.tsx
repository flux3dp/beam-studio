import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TransformControls } from '@react-three/drei';
import type { Group } from 'three';
import { Box3, Box3Helper, Color } from 'three';

import { useLayerStore } from '@core/app/stores/layer/layerStore';
import type { StlObject, StlTransform } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';

import { SELECTION_COLOR } from './constants';
import type { GroupDragStart } from './utils/groupTransform';
import { commitGroupDrag, getGroupBox, getGroupDragTransforms, getUniformFactor } from './utils/groupTransform';
import { updateProjectionRect } from './utils/projection';
import { ROTATION_SNAP_RAD, snapPosition, TRANSLATION_SNAP } from './utils/snapping';
import { getMatrix } from './utils/transform';
import { getObjectLayerState } from './utils/useLayerColor';
import { useViewStore } from './viewStore';

interface Props {
  objects: StlObject[];
  /** Space is held: the drag belongs to the camera. */
  panning: boolean;
  snapActive: boolean;
  snapCenter: [number, number, number];
}

/**
 * The outline and the one gizmo of a multi-selection.
 *
 * The gizmo is attached to a proxy group sitting at the centre of the selection's union box, not to
 * any object. Every frame of a drag reads the proxy's offset, rotation and (uniform) scale as one
 * delta and moves each object by it about that centre (`transformInGroup`), so the selection behaves
 * like a single body. The store is written as the drag goes, which redraws the meshes; the rects are
 * re-projected without history; letting go records one undo step for the whole selection.
 */
const GroupTransformControls = ({ objects, panning, snapActive, snapCenter }: Props): null | React.JSX.Element => {
  const [proxy, setProxy] = useState<Group | null>(null);
  const transformMode = useViewStore((state) => state.transformMode);
  const dragStart = useRef<GroupDragStart | null>(null);
  const hasDragged = useRef(false);
  const box = useMemo(() => getGroupBox(objects), [objects]);
  const helper = useMemo(() => new Box3Helper(new Box3(), new Color(SELECTION_COLOR)), []);

  // subscribed so that locking or hiding a layer takes the gizmo away
  useLayerStore();

  const editable = objects.every(({ id }) => {
    const { isLocked, isVisible } = getObjectLayerState(id, false);

    return isVisible && !isLocked;
  });

  useEffect(() => {
    helper.box.copy(box);
  }, [box, helper]);

  useEffect(
    () => () => {
      helper.geometry.dispose();
      (helper.material as { dispose: () => void }).dispose();
    },
    [helper],
  );

  // the proxy rests at the centre of the selection; during a drag it is the gizmo's to move
  useEffect(() => {
    if (!proxy || dragStart.current) return;

    box.getCenter(proxy.position);
    proxy.quaternion.identity();
    proxy.scale.set(1, 1, 1);
  }, [box, proxy]);

  const handleMouseDown = useCallback(() => {
    if (!proxy) return;

    hasDragged.current = false;
    dragStart.current = {
      pivot: proxy.position.clone(),
      transforms: Object.fromEntries(objects.map(({ id, transform }) => [id, transform])),
    };
  }, [objects, proxy]);

  const getNextTransforms = useCallback((): Record<string, StlTransform> => {
    const scale = getUniformFactor(proxy!.scale);

    proxy!.scale.set(scale, scale, scale);

    return getGroupDragTransforms(dragStart.current!, {
      position: proxy!.position,
      quaternion: proxy!.quaternion,
      scale,
    });
  }, [proxy]);

  const handleObjectChange = useCallback(() => {
    if (!proxy || !dragStart.current) return;

    hasDragged.current = true;

    if (snapActive && transformMode === 'translate') snapPosition(proxy.position, snapCenter);

    const next = getNextTransforms();
    const { objects: stored, setTransform: storeTransform } = useStlStore.getState();

    Object.entries(next).forEach(([id, transform]) => {
      const object = stored[id];
      const elem = document.getElementById(id) as null | SVGElement;

      if (!object) return;

      storeTransform(id, transform);

      if (elem) updateProjectionRect(elem, object.geometry, getMatrix({ ...object, transform }));
    });
  }, [getNextTransforms, proxy, snapActive, snapCenter, transformMode]);

  const handleDragEnd = useCallback(() => {
    const start = dragStart.current;

    if (!proxy || !start) return;

    if (hasDragged.current) commitGroupDrag(start, getNextTransforms());

    dragStart.current = null;
    hasDragged.current = false;
    getGroupBox(Object.values(useStlStore.getState().objects).filter(({ id }) => id in start.transforms)).getCenter(
      proxy.position,
    );
    proxy.quaternion.identity();
    proxy.scale.set(1, 1, 1);
  }, [getNextTransforms, proxy]);

  if (objects.length < 2) return null;

  return (
    <>
      <group ref={setProxy} />
      <primitive object={helper} />
      {proxy && editable && (
        <TransformControls
          enabled={!panning}
          mode={transformMode}
          object={proxy}
          onMouseDown={handleMouseDown}
          onMouseUp={handleDragEnd}
          onObjectChange={handleObjectChange}
          rotationSnap={snapActive ? ROTATION_SNAP_RAD : null}
          space="world"
          translationSnap={snapActive ? TRANSLATION_SNAP : null}
        />
      )}
    </>
  );
};

export default GroupTransformControls;
