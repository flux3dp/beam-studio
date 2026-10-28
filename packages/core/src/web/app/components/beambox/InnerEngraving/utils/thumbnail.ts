import {
  AmbientLight,
  Box3,
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { Texture } from 'three';
import { match } from 'ts-pattern';

import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { getPhotoTextureUrl } from '@core/app/svgedit/stl/photoPlane';
import workareaManager from '@core/app/svgedit/workarea';

import { FLOOR_COLOR, FLOOR_MARGIN, FLOOR_Z, MATERIAL_COLOR, MATERIAL_OPACITY } from '../constants';
import { VIEW_DIRECTIONS } from '../viewStore';

import type { Material } from './material';
import { getMaterial } from './material';
import { createLayerColorUniform, getLayerColorOffset, injectLayerColor } from './photoLayerColor';
import { getMatrix } from './transform';
import { getObjectLayerState } from './useLayerColor';

/** Longest side of the produced image, in pixels. Matches what the 2D thumbnails are scaled to. */
const DEFAULT_SIZE = 300;
/** Breathing room around the fitted content, as a fraction of its size. */
const PADDING_RATIO = 1.08;

const getMaterialGeometry = ({ depth, height, maxZ, minZ, shape, width }: Material) =>
  match(shape)
    .with('box', () => new BoxGeometry(width, depth, height))
    // three.js builds cylinders around Y; the mesh below stands it up onto Z
    .with('cylinder', () => new CylinderGeometry(width / 2, width / 2, height, 48))
    .with('sphere', () => {
      const radius = width / 2;
      const centerZ = (minZ + maxZ) / 2;
      // Filled with liquid up to `height`, so the cap above that level is not part of the workpiece.
      const thetaStart = Math.acos(Math.min(1, Math.max(-1, (Math.min(height, maxZ) - centerZ) / radius)));

      return new SphereGeometry(radius, 48, 24, 0, Math.PI * 2, thetaStart, Math.PI - thetaStart);
    })
    .exhaustive();

/** The photo of a photo plane, from the same source the canvas reads; null when it cannot be loaded. */
const loadPhotoTexture = async (object: StlObject): Promise<null | Texture> => {
  const elem = document.getElementById(object.id) as unknown as null | SVGImageElement;
  const url = (elem && getPhotoTextureUrl(elem)) || object.textureUrl;

  if (!url) return null;

  try {
    const texture = await new TextureLoader().loadAsync(url);

    texture.colorSpace = SRGBColorSpace;

    return texture;
  } catch (error) {
    console.warn(`Failed to load the photo of ${object.id} for the thumbnail:`, error);

    return null;
  }
};

/**
 * The material an object is drawn with. A photo plane shows its picture tinted by the layer colour,
 * as on the canvas; it falls back to a plain layer-colour plane when the picture cannot be loaded.
 */
const createObjectMaterial = (object: StlObject, color: string, texture: null | Texture) => {
  if (object.kind === 'point-cloud') return new PointsMaterial({ color, size: 2, sizeAttenuation: false });

  if (object.kind === 'photo' && texture) {
    const uniform = createLayerColorUniform();
    const photoMaterial = new MeshBasicMaterial({
      map: texture,
      side: DoubleSide,
      toneMapped: false,
      transparent: true,
    });

    uniform.value.copy(getLayerColorOffset(color));
    photoMaterial.onBeforeCompile = (shader) => injectLayerColor(shader, uniform);

    return photoMaterial;
  }

  return new MeshStandardMaterial({ color, side: DoubleSide });
};

/**
 * Render the inner engraving scene to an offscreen canvas, from the default isometric view.
 *
 * A .beam thumbnail and a job thumbnail are both built from `svgcontent`, which for an inner
 * engraving document holds nothing but flat projection rects — a picture of the outlines, not of
 * the work. This draws the same scene the 3D canvas shows instead.
 *
 * Fixed isometric + orthographic rather than the user's current camera: a thumbnail is an identifier
 * as much as a preview, so the same document has to produce the same picture every time, and the
 * machine panel shows it at a size where a perspective view of a small model is unreadable.
 *
 * The framing covers the **work area, the material and every object** — the work area so the job's
 * placement inside the field is visible (a model in the corner should look like one), the material
 * because a workpiece larger than the field is normal and cropping it would misrepresent the setup.
 *
 * @returns the rendered canvas, or null when rendering fails (e.g. WebGL is unavailable)
 */
export const renderInnerEngravingThumbnail = async (size: number = DEFAULT_SIZE): Promise<HTMLCanvasElement | null> => {
  const { use_layer_color: useLayerColor } = useGlobalPreferenceStore.getState();
  // drawn as on the canvas: objects on hidden layers are left out, and the layer colour follows the
  // use_layer_color preference
  const objects = Object.values(useStlStore.getState().objects)
    .map((object) => ({ object, ...getObjectLayerState(object.id, useLayerColor) }))
    .filter(({ isVisible }) => isVisible);
  const textures = await Promise.all(
    objects.map(({ object }) => (object.kind === 'photo' ? loadPhotoTexture(object) : Promise.resolve(null))),
  );
  const material = getMaterial();
  const { height: areaHeight, width: areaWidth } = workareaManager;
  const scene = new Scene();
  // every disposable this function creates, so a failure part-way still frees the GPU buffers
  const disposables = Array.of<{ dispose: () => void }>(...textures.filter((texture) => texture !== null));
  let renderer: null | WebGLRenderer = null;

  try {
    // no scene background: a thumbnail is shown on a card, a machine panel and a file browser, each
    // with its own backdrop, and baking the canvas's grey in would put a grey rectangle on all of
    // them. Transparent lets the host decide, and the work area floor still shows the field itself.
    scene.add(new AmbientLight(0xffffff, 1.2));

    const light = new DirectionalLight(0xffffff, 2);

    light.position.set(areaWidth, -areaHeight, Math.hypot(areaWidth, areaHeight));
    scene.add(light);

    // the work area floor, the same white backdrop the canvas draws
    const floorGeometry = new PlaneGeometry(areaWidth + FLOOR_MARGIN * 2, areaHeight + FLOOR_MARGIN * 2);
    const floorMaterial = new MeshBasicMaterial({ color: FLOOR_COLOR, side: DoubleSide });
    const floor = new Mesh(floorGeometry, floorMaterial);

    floor.position.set(areaWidth / 2, areaHeight / 2, FLOOR_Z);
    scene.add(floor);
    disposables.push(floorGeometry, floorMaterial);

    // the workpiece. Drawn in one piece, unlike the canvas: the in-range / out-of-range split needs
    // clipping planes and reads as noise at thumbnail size
    const materialGeometry = getMaterialGeometry(material);
    const materialMesh = new Mesh(
      materialGeometry,
      new MeshBasicMaterial({
        color: MATERIAL_COLOR,
        depthWrite: false,
        opacity: MATERIAL_OPACITY,
        transparent: true,
      }),
    );

    materialMesh.position.set(...material.center);

    if (material.shape !== 'box') materialMesh.rotation.set(Math.PI / 2, 0, 0);

    scene.add(materialMesh);
    disposables.push(materialGeometry, materialMesh.material as MeshBasicMaterial);

    const content = new Group();

    objects.forEach(({ color, object }, index) => {
      const objectMaterial = createObjectMaterial(object, color, textures[index]);
      const renderedObject =
        objectMaterial instanceof PointsMaterial
          ? new Points(object.geometry, objectMaterial)
          : new Mesh(object.geometry, objectMaterial);

      // the geometry is shared with the live canvas and must not be disposed of here, so only the
      // matrix is applied — never baked into the vertices
      renderedObject.matrixAutoUpdate = false;
      renderedObject.matrix.copy(getMatrix(object));
      content.add(renderedObject);
      disposables.push(objectMaterial);
    });
    scene.add(content);

    // the object meshes carry a hand-set matrix (matrixAutoUpdate off), so world matrices have to
    // be composed before anything measures them
    scene.updateMatrixWorld(true);

    // frame the union rather than any one of the three: the field shows where the job sits, the
    // material can be larger than the field, and a tall object can rise above the material
    const bounds = new Box3()
      .setFromObject(materialMesh)
      .union(new Box3().setFromCenterAndSize(floor.position.clone(), new Vector3(areaWidth, areaHeight, 0)));

    if (content.children.length) bounds.union(new Box3().setFromObject(content));

    const target = bounds.getCenter(new Vector3());
    const extent = bounds.getSize(new Vector3()).length();

    if (!Number.isFinite(extent) || extent <= 0) return null;

    // an orthographic box wide enough for any orbit of `bounds`, so the fit cannot clip a corner
    const half = (extent / 2) * PADDING_RATIO;
    const camera = new OrthographicCamera(-half, half, half, -half, 0.1, extent * 4);
    const direction = new Vector3(...VIEW_DIRECTIONS.isometric).normalize();

    camera.up.set(0, 0, 1);
    camera.position.copy(target).addScaledVector(direction, extent * 1.5);
    camera.lookAt(target);
    camera.updateProjectionMatrix();

    // three's own default is NoToneMapping, which is what the live canvas asks r3f for with `flat`,
    // so the colours here come out the same as on screen without any further setup
    renderer = new WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearAlpha(0);
    renderer.setSize(size, size, false);
    renderer.render(scene, camera);

    // copied out into a plain canvas: the renderer's own drawing buffer dies with the context below,
    // and a WebGL canvas cannot be handed to `toBlob` after that
    const output = document.createElement('canvas');

    output.width = size;
    output.height = size;
    output.getContext('2d')!.drawImage(renderer.domElement, 0, 0);

    return output;
  } catch (error) {
    console.error('Failed to render the inner engraving thumbnail:', error);

    return null;
  } finally {
    disposables.forEach((disposable) => disposable.dispose());
    // WebGL contexts are a scarce per-page resource; leaking one per save would eventually make
    // the browser drop the canvas's own context
    renderer?.dispose();
    renderer?.forceContextLoss();
  }
};
