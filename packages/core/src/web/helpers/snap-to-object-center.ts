/**
 * Snap to Object Center (View menu, default off).
 *
 * When enabled, every camera-capture update re-caches the preview canvas into
 * a local mini-sam service (MobileSAM segmentation server, see D:/Dev/mini-sam;
 * ws protocol: binary image -> encode, {"cmd":"prompt"} -> object). While
 * dragging elements in select mode, unexplored drop positions are probed with
 * a prompt decode; when the dragged selection's center comes within
 * SNAP_SCREEN_PX (screen px) of a detected physical object's center, the drag
 * snaps to that center and alignment guides are drawn to the edges of the
 * detected shape's bbox.
 */
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import NS from '@core/app/constants/namespaces';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

export interface SnapTarget {
  bbox: { height: number; width: number; x: number; y: number }; // workarea units
  center: { x: number; y: number }; // workarea units
}

const SNAP_SCREEN_PX = 20; // snap distance threshold, in on-screen pixels
const NEGATIVE_CELL_SIZE = 40; // workarea px; cells marked "nothing here" after an empty probe
const RECACHE_DEBOUNCE_MS = 800; // captures arrive in bursts during preview sweeps
const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_URL = 'ws://127.0.0.1:8788/';

/** Minimal client for the mini-sam websocket service (one reply per request). */
class MiniSamClient {
  private ws: null | WebSocket = null;
  private opening: null | Promise<void> = null;
  private pending: Array<{ reject: (e: Error) => void; resolve: (resp: any) => void }> = [];

  private get url(): string {
    try {
      return localStorage.getItem('mini-sam-url') || DEFAULT_URL;
    } catch {
      return DEFAULT_URL;
    }
  }

  private open(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();

    if (this.opening) return this.opening;

    this.opening = new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);

      ws.onopen = async () => {
        this.ws = ws;

        try {
          // detect-all on upload is not needed; we only want the cached encoding
          await this.request('{"cmd":"config","auto_detect":false}');
          resolve();
        } catch (error) {
          reject(error as Error);
        }
      };
      ws.onmessage = (evt: MessageEvent) => {
        if (typeof evt.data !== 'string') return; // annotated frames are not requested

        const waiting = this.pending.shift();

        if (!waiting) return;

        try {
          waiting.resolve(JSON.parse(evt.data));
        } catch (error) {
          waiting.reject(error as Error);
        }
      };
      ws.onerror = () => {
        if (this.ws !== ws) reject(new Error('mini-sam connection failed'));
      };
      ws.onclose = () => {
        this.pending.forEach(({ reject: rejectPending }) => rejectPending(new Error('mini-sam closed')));
        this.pending = [];

        if (this.ws === ws) this.ws = null;
        else reject(new Error('mini-sam connection failed'));
      };
    }).finally(() => {
      this.opening = null;
    });

    return this.opening;
  }

  private request(payload: Blob | string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.pending.findIndex((p) => p.resolve === wrappedResolve);

        if (index >= 0) this.pending.splice(index, 1);

        reject(new Error('mini-sam request timeout'));
      }, REQUEST_TIMEOUT_MS);
      const wrappedResolve = (resp: any) => {
        clearTimeout(timer);
        resolve(resp);
      };

      this.pending.push({
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
        resolve: wrappedResolve,
      });
      this.ws!.send(payload);
    });
  }

  async encodeImage(blob: Blob): Promise<{ height: number; width: number }> {
    await this.open();

    const resp = await this.request(blob);

    if (!resp?.encoded) throw new Error(resp?.error || 'mini-sam encode failed');

    return { height: resp.height, width: resp.width };
  }

  async prompt(x: number, y: number): Promise<any> {
    await this.open();

    const resp = await this.request(JSON.stringify({ cmd: 'prompt', points: [[x, y]] }));

    if (resp?.error) throw new Error(resp.error);

    return resp?.object ?? null;
  }
}

const client = new MiniSamClient();
const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

let detections: SnapTarget[] = [];
let negativeCells = new Set<string>();
let encoded = false;
let encoding = false;
let probing = false;
let hasWarned = false;
// blob px per workarea px of the cached capture (canvasRatio; 1 on desktop)
let imageRatio = 1;
let imageSize = { height: 0, width: 0 };
let recacheTimer: null | ReturnType<typeof setTimeout> = null;

const isEnabled = (): boolean => useGlobalPreferenceStore.getState().snap_to_object_center;

const resetCache = (): void => {
  detections = [];
  negativeCells = new Set();
  encoded = false;
};

const warnOnce = (error: unknown): void => {
  encoded = false;

  if (hasWarned) return;

  hasWarned = true;
  console.warn(
    'Snap to Object Center: mini-sam service unavailable. Start it with "mini-sam --serve" (see D:/Dev/mini-sam).',
    error,
  );
};

const recacheNow = async (): Promise<void> => {
  if (!isEnabled() || encoding || previewModeBackgroundDrawer.isClean()) return;

  encoding = true;

  try {
    const crop = await previewModeBackgroundDrawer.getCanvasCrop(
      0,
      0,
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
    );

    if (!crop) return;

    imageSize = await client.encodeImage(crop.blob);
    imageRatio = crop.ratio;
    resetCache();
    encoded = true;
    hasWarned = false;
  } catch (error) {
    warnOnce(error);
  } finally {
    encoding = false;
  }
};

/** Re-encode the current preview canvas soon (debounced across capture bursts). */
const scheduleRecache = (): void => {
  if (!isEnabled()) return;

  if (recacheTimer) clearTimeout(recacheTimer);

  recacheTimer = setTimeout(() => {
    recacheTimer = null;
    recacheNow();
  }, RECACHE_DEBOUNCE_MS);
};

// camera capture status changed -> recache (emitted per drawn capture)
canvasEvents.on('preview-background-updated', scheduleRecache);

useGlobalPreferenceStore.subscribe(
  (state) => state.snap_to_object_center,
  (enabled: boolean) => {
    if (enabled) scheduleRecache();
    else resetCache();
  },
);

const inBBox = (target: SnapTarget, p: { x: number; y: number }): boolean =>
  p.x >= target.bbox.x &&
  p.x <= target.bbox.x + target.bbox.width &&
  p.y >= target.bbox.y &&
  p.y <= target.bbox.y + target.bbox.height;

/** Probe an unexplored ("undetected") position with a mini-sam prompt decode. */
const probe = (p: { x: number; y: number }): void => {
  if (!encoded || probing) return;

  if (detections.some((d) => inBBox(d, p))) return; // already-detected area

  const cell = `${Math.round(p.x / NEGATIVE_CELL_SIZE)},${Math.round(p.y / NEGATIVE_CELL_SIZE)}`;

  if (negativeCells.has(cell)) return;

  probing = true;
  client
    .prompt(p.x * imageRatio, p.y * imageRatio)
    .then((object) => {
      // whole-scene masks are background, not snappable objects
      const maxArea = 0.3 * imageSize.width * imageSize.height;

      if (object && object.area > 0 && object.area < maxArea) {
        const [bx, by, bw, bh] = object.bbox;

        detections.push({
          bbox: { height: bh / imageRatio, width: bw / imageRatio, x: bx / imageRatio, y: by / imageRatio },
          center: { x: object.center[0] / imageRatio, y: object.center[1] / imageRatio },
        });
      } else {
        negativeCells.add(cell);
      }
    })
    .catch(warnOnce)
    .finally(() => {
      probing = false;
    });
};

const isActive = (): boolean => isEnabled() && encoded && !previewModeBackgroundDrawer.isClean();

/**
 * Called while dragging with the selection center (workarea units). Probes
 * unexplored areas and returns the detected object to snap to, if its center
 * is within SNAP_SCREEN_PX on screen.
 */
const checkSnap = (center: { x: number; y: number }): null | SnapTarget => {
  if (!isActive()) return null;

  probe(center);

  const zoom = workareaManager.zoomRatio;
  let best: null | SnapTarget = null;
  let bestDist = SNAP_SCREEN_PX;

  for (const detection of detections) {
    const dist = Math.hypot(detection.center.x - center.x, detection.center.y - center.y) * zoom;

    if (dist < bestDist) {
      bestDist = dist;
      best = detection;
    }
  }

  return best;
};

/**
 * Draw the snap guides: a horizontal and a vertical line through the snapped
 * center, spanning the detected shape's bbox. The `align_line` id prefix makes
 * svgCanvas.clearAlignLines() clean them up on the next mousemove/mouseup.
 */
const drawGuides = (target: SnapTarget): void => {
  const container = document.getElementById('svgcontent');

  if (!container) return;

  const strokeWidth = 2 / workareaManager.zoomRatio;
  const lines = [
    {
      d: `M ${target.bbox.x} ${target.center.y} L ${target.bbox.x + target.bbox.width} ${target.center.y}`,
      id: 'align_line_objsnap_h',
    },
    {
      d: `M ${target.center.x} ${target.bbox.y} L ${target.center.x} ${target.bbox.y + target.bbox.height}`,
      id: 'align_line_objsnap_v',
    },
  ];

  lines.forEach(({ d, id }) => {
    let line = document.getElementById(id) as null | SVGPathElement;

    if (!line) {
      line = document.createElementNS(NS.SVG, 'path') as SVGPathElement;
      line.setAttribute('id', id);
      container.appendChild(line);
    }

    line.setAttribute('d', d);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#F707F0');
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('stroke-dasharray', `${strokeWidth * 2},${strokeWidth * 2}`);
    line.setAttribute('style', 'pointer-events:none');
  });
};

export default {
  checkSnap,
  drawGuides,
  isActive,
  scheduleRecache,
};
