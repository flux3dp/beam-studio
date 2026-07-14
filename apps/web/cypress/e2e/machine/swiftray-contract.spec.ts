/**
 * Swiftray SERVICE CONTRACT spec.
 *
 * Swiftray is the backend that the compiled Beam Studio desktop app runs locally on a
 * FIXED port (ws://localhost:6611). It converts an SVG scene into machine toolpaths.
 *
 * The web build hardwires `hasSwiftray = false` (swiftray-client.ts: checkSwiftray returns
 * `!isWeb() && ...`), so the UI engine-selection path (getConvertEngine -> fetchTaskCodeSwiftray)
 * is UNREACHABLE from the web UI even for Promark. We therefore do NOT drive Swiftray through
 * the app UI. Instead we speak the wire protocol directly, exactly the way the app's
 * `SwiftrayClient.action()` does, from the app page context (so the WebSocket originates from
 * the app origin like the real client would).
 *
 * Protocol (mined from packages/core/src/web/helpers/api/swiftray-client.ts):
 *   - send: JSON.stringify({ data: { action, id, params }, path, type: 'action' })
 *   - the server replies with framed messages that carry the same `id`
 *   - the final reply has `type === 'callback'` and `result` is the return value
 *   - streaming replies arrive as `type === 'progress'` / `type === 'chunk'` (same id)
 *
 * loadSVG / convert payload shapes mined from
 * packages/core/src/web/app/actions/beambox/export-funcs-swiftray.ts +
 * SwiftrayClient.loadSVG()/convert().
 *
 * This spec only runs on the local rig (Swiftray does not exist in CI).
 */

const isRunningAtGithub = Cypress.env('envType') === 'github';

const SWIFTRAY_URL = 'ws://localhost:6611';
const ACTION_TIMEOUT = 90_000;

// Minimal-but-realistic default layer config, mirroring the subset of baseConfig
// (layer-config-helper.ts) that loadSVG forwards as `defaultConfig`.
const DEFAULT_CONFIG = {
  backlash: 0,
  biDirectional: true,
  configName: '',
  cRatio: 100,
  diode: 0,
  dpi: 'medium',
  fillAngle: 0,
  fillInterval: 0.01,
  focus: -2,
  focusStep: -2,
  frequency: 27,
  halftone: 1,
  height: -3,
  ink: 1,
  kRatio: 100,
  minPower: 0,
  module: 1,
  mRatio: 100,
  multipass: 3,
  power: 15,
  printingSpeed: 60,
  printingStrength: 100,
  repeat: 1,
  speed: 20,
  yRatio: 100,
  zStep: 0,
};

// One layer, one enclosing "outer" rect with two small "inner" rects inside it. Used both for
// the plain conversion contract and the cut-order assertion. Coordinates are in the SVG user
// unit space the app emits (10 units/mm), viewBox 0 0 4300 3000 == a 430x300 mm workarea.
const SCENE_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"',
  ' width="430" height="300" viewBox="0 0 4300 3000">',
  '<g class="layer" data-speed="20" data-strength="15" data-repeat="1" data-color="#333333" data-module="1">',
  '<title>layer 1</title>',
  // outer enclosing rect: 10..210 mm x 10..170 mm
  '<rect id="outer" x="100" y="100" width="2000" height="1600" fill="none" stroke="#333333" stroke-width="1" vector-effect="non-scaling-stroke"/>',
  // inner rect A: 30..70 mm x 30..70 mm
  '<rect id="innerA" x="300" y="300" width="400" height="400" fill="none" stroke="#333333" stroke-width="1" vector-effect="non-scaling-stroke"/>',
  // inner rect B: 140..180 mm x 90..130 mm
  '<rect id="innerB" x="1400" y="900" width="400" height="400" fill="none" stroke="#333333" stroke-width="1" vector-effect="non-scaling-stroke"/>',
  '</g>',
  '</svg>',
].join('');

const buildFile = () => ({
  data: SCENE_SVG,
  extension: 'svg',
  name: 'svgeditor.svg',
  thumbnail: '',
  uploadName: '',
});

type ActionFn = (
  path: string,
  action: string,
  params?: unknown,
  handlers?: Record<string, (result: unknown) => void>,
) => Promise<any>;

/**
 * Open a Swiftray socket inside the page context and return an `action()` that mirrors
 * SwiftrayClient.action(): request/response correlation by random id, resolves on the
 * matching `callback` frame, and routes `progress`/`chunk` frames to optional handlers.
 * Runs entirely in `win` (the app window) so the WebSocket originates from the app origin.
 */
const withSwiftray = (
  win: Window,
  fn: (action: ActionFn) => Promise<void>,
  timeout: number,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const w = win as any;
    const ws: WebSocket = new w.WebSocket(SWIFTRAY_URL);
    const pending = new Map<string, { handlers?: Record<string, (r: unknown) => void>; resolve: (r: unknown) => void }>();
    let settled = false;

    const guard = win.setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          ws.close();
        } catch {
          /* noop */
        }
        reject(new Error('Swiftray socket timed out'));
      }
    }, timeout);

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      win.clearTimeout(guard);
      try {
        ws.close();
      } catch {
        /* noop */
      }
      if (err) reject(err);
      else resolve();
    };

    ws.onerror = () => finish(new Error(`Failed to connect to Swiftray at ${SWIFTRAY_URL}`));

    ws.onmessage = (ev: MessageEvent) => {
      let data: any;

      try {
        data = JSON.parse(ev.data as string);
      } catch {
        return;
      }

      const entry = data.id ? pending.get(data.id) : undefined;

      if (!entry) return;

      if (data.type === 'callback') {
        pending.delete(data.id);
        entry.resolve(data.result);
      } else if (entry.handlers && entry.handlers[data.type]) {
        entry.handlers[data.type](data.result);
      }
    };

    const action: ActionFn = (path, actionName, params, handlers) =>
      new Promise((res) => {
        const id = Math.random().toString(36).slice(2, 11);

        pending.set(id, { handlers, resolve: res });
        ws.send(JSON.stringify({ data: { action: actionName, id, params }, path, type: 'action' }));
      });

    ws.onopen = () => {
      fn(action)
        .then(() => finish())
        .catch((err) => finish(err instanceof Error ? err : new Error(String(err))));
    };
  });

describe('swiftray contract', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => cy.log('skip test on github'));

    return;
  }

  // Land in the editor so we execute the socket calls from the app page context, exactly
  // like the real SwiftrayClient (browser WebSocket from the app origin).
  beforeEach(() => {
    cy.landingEditor();
    cy.get('#svgcontent', { timeout: 30_000 }).should('exist');
  });

  it('handshake + system info contract', () => {
    cy.window({ timeout: 30_000 }).then(
      (win) =>
        new Cypress.Promise<void>((resolve, reject) => {
          withSwiftray(
            win,
            async (action) => {
              const res = await action('/ws/sr/system', 'getInfo');

              // Fields the app reads: handleOpen consumes info.swiftrayVersion; SystemInfo
              // interface also declares os / cpuArchitecture / qtVersion.
              expect(res, 'getInfo result').to.be.an('object');
              expect(res.success, 'getInfo success').to.eq(true);
              expect(res.info, 'getInfo info object').to.be.an('object');
              expect(res.info.swiftrayVersion, 'swiftrayVersion').to.be.a('string').and.not.be.empty;
              expect(res.info.os, 'os').to.be.a('string');
              expect(res.info.cpuArchitecture, 'cpuArchitecture').to.be.a('string');
              expect(res.info.qtVersion, 'qtVersion').to.be.a('string');
              cy.log(`Swiftray version ${res.info.swiftrayVersion} on ${res.info.os}`);
            },
            ACTION_TIMEOUT,
          ).then(resolve, reject);
        }),
    );
  });

  it('list devices contract', () => {
    cy.window({ timeout: 30_000 }).then(
      (win) =>
        new Cypress.Promise<void>((resolve, reject) => {
          withSwiftray(
            win,
            async (action) => {
              const res = await action('/devices', 'list');

              // Shape only — the rig may have no Promark attached, so devices may be empty.
              expect(res, 'list result').to.be.an('object');
              expect(res.success, 'list success').to.eq(true);
              expect(res.devices, 'devices array').to.be.an('array');
              res.devices.forEach((d: any) => expect(d, 'device entry').to.be.an('object'));
              cy.log(`Swiftray reports ${res.devices.length} device(s)`);
            },
            ACTION_TIMEOUT,
          ).then(resolve, reject);
        }),
    );
  });

  it('SVG -> toolpath conversion contract (gcode)', () => {
    cy.window({ timeout: 30_000 }).then(
      (win) =>
        new Cypress.Promise<void>((resolve, reject) => {
          withSwiftray(
            win,
            async (action) => {
              // 1) loadSVG — same payload shape as SwiftrayClient.loadSVG / export-funcs-swiftray.
              const loadRes = await action('/parser', 'loadSVG', {
                defaultConfig: DEFAULT_CONFIG,
                file: buildFile(),
                model: 'fbm2',
                rotaryMode: false,
              });

              expect(loadRes, 'loadSVG result').to.be.an('object');
              expect(loadRes.success, 'loadSVG success').to.eq(true);

              // 2) convert — gcode output, workarea in mm, isPromark false.
              const convertRes = await action('/parser', 'convert', {
                isPromark: false,
                model: 'fbm2',
                travelSpeed: 100,
                type: 'gcode',
                workarea: { height: 300, width: 430 },
              });

              expect(convertRes, 'convert result').to.be.an('object');
              expect(convertRes.success, 'convert success').to.eq(true);
              expect(convertRes.gcode, 'gcode task output').to.be.a('string').and.not.be.empty;
              // Real toolpath must contain cutting moves.
              expect(convertRes.gcode, 'gcode has G-code moves').to.match(/G[01]/);
              cy.log(`convert produced ${convertRes.gcode.length} bytes of gcode`);
            },
            ACTION_TIMEOUT,
          ).then(resolve, reject);
        }),
    );
  });

  it('engine cut order: inner shapes before enclosing outer', () => {
    cy.window({ timeout: 30_000 }).then(
      (win) =>
        new Cypress.Promise<void>((resolve, reject) => {
          withSwiftray(
            win,
            async (action) => {
              const loadRes = await action('/parser', 'loadSVG', {
                defaultConfig: DEFAULT_CONFIG,
                file: buildFile(),
                model: 'fbm2',
                rotaryMode: false,
              });

              expect(loadRes.success, 'loadSVG success').to.eq(true);

              const convertRes = await action('/parser', 'convert', {
                isPromark: false,
                model: 'fbm2',
                travelSpeed: 100,
                type: 'gcode',
                workarea: { height: 300, width: 430 },
              });

              expect(convertRes.success, 'convert success').to.eq(true);

              const gcode: string = convertRes.gcode;

              expect(gcode, 'gcode').to.be.a('string').and.not.be.empty;

              // Parse XY moves from the emitted gcode and classify each by which rect it traces.
              // Swiftray emits toolpath coordinates in mm; empirically this scene's SVG user
              // units map at 100 units/mm, so the rects land at:
              //   outer  X1..21  Y1..17   (svg 100..2100 / 100..1700)
              //   innerA X3..7   Y3..7    (svg 300..700  / 300..700)
              //   innerB X14..18 Y9..13   (svg 1400..1800 / 900..1300)
              // A cutting move on an inner rect's perimeter is attributed to that inner rect;
              // the remaining perimeter moves belong to the enclosing outer rect.
              const within = (v: number, lo: number, hi: number) => v >= lo - 0.5 && v <= hi + 0.5;
              const near = (v: number, target: number) => Math.abs(v - target) <= 0.6;

              const onRect = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) =>
                within(x, x0, x1) &&
                within(y, y0, y1) &&
                ((near(x, x0) || near(x, x1)) || (near(y, y0) || near(y, y1)));

              let firstOuterIdx = Infinity;
              let lastInnerIdx = -Infinity;
              let sawInnerA = false;
              let sawInnerB = false;
              let idx = 0;

              gcode.split('\n').forEach((line) => {
                if (!/^G[01]\b/.test(line.trim())) return;

                const xm = line.match(/X(-?\d+(?:\.\d+)?)/);
                const ym = line.match(/Y(-?\d+(?:\.\d+)?)/);

                if (!xm || !ym) return;

                const x = Number.parseFloat(xm[1]);
                const y = Number.parseFloat(ym[1]);
                const i = idx++;

                const onA = onRect(x, y, 3, 3, 7, 7);
                const onB = onRect(x, y, 14, 9, 18, 13);

                if (onA || onB) {
                  lastInnerIdx = Math.max(lastInnerIdx, i);
                  sawInnerA = sawInnerA || onA;
                  sawInnerB = sawInnerB || onB;
                } else if (onRect(x, y, 1, 1, 21, 17)) {
                  // Perimeter of the outer rect, not attributable to an inner rect.
                  firstOuterIdx = Math.min(firstOuterIdx, i);
                }
              });

              cy.log(
                `innerA=${sawInnerA} innerB=${sawInnerB} lastInner=${lastInnerIdx} firstOuter=${firstOuterIdx}`,
              );

              // We must have actually cut both inner rects and the outer rect.
              expect(sawInnerA, 'cut inner rect A').to.eq(true);
              expect(sawInnerB, 'cut inner rect B').to.eq(true);
              expect(firstOuterIdx, 'cut outer rect').to.be.lessThan(Infinity);

              // The engine should finish the enclosed inner shapes before the outer boundary:
              // the first outer-only cutting move must come AFTER the last inner cutting move.
              expect(firstOuterIdx, 'outer cut starts after inner rects finish').to.be.greaterThan(
                lastInnerIdx,
              );
            },
            ACTION_TIMEOUT,
          ).then(resolve, reject);
        }),
    );
  });
});
