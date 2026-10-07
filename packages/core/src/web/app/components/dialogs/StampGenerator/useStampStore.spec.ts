const deferred = new Map<string, { promise: Promise<unknown>; resolve: () => void }>();
const fontObj = (postscriptName: string) => {
  if (!deferred.has(postscriptName)) {
    let resolve!: () => void;
    const promise = new Promise<unknown>((r) => (resolve = () => r({})));

    deferred.set(postscriptName, { promise, resolve });
  }

  return deferred.get(postscriptName)!.promise;
};

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  __esModule: true,
  default: {
    getFontOfPostscriptName: (name: string) => ({ family: name, postscriptName: name, style: 'Regular' }),
  },
  getFontObj: (font: { postscriptName: string }) => fontObj(font.postscriptName),
}));
jest.mock('@core/helpers/fonts/bundledFonts', () => ({ applyBundledFontStyle: jest.fn() }));
jest.mock('@core/helpers/fonts/getDefaultFont', () => () => ({ font_family: 'Arial', font_postscriptName: 'ArialMT' }));
jest.mock('./builders/buildTemplate', () => ({ parseTemplate: () => ({ baselines: [], frames: [], outline: null }) }));
jest.mock('./builders/buildShape', () => ({
  buildPreviewSvg: () => document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
  buildStampShape: async () => ({
    bounds: { height: 100, width: 100 },
    cut: null,
    engrave: [],
    group: { remove: jest.fn() },
  }),
}));

import { STAMP_TEMPLATES } from './templates';
import useStampStore from './useStampStore';

const flush = () => new Promise((r) => setTimeout(r, 0));
const withFonts = (list: ReadonlyArray<string>) => STAMP_TEMPLATES.find((t) => t.preferredFonts?.[0] === list[0])!.id;

describe('useStampStore.selectTemplate', () => {
  afterEach(() => useStampStore.getState().reset());

  it('lets the newest selection win even when an older font probe resolves later', async () => {
    const kaiTemplate = withFonts(['TW-MOE-Std-Kai']);
    const plain = STAMP_TEMPLATES.find((t) => !t.preferredFonts)!.id;
    const first = useStampStore.getState().selectTemplate(kaiTemplate); // waits for the Kai web font

    expect(useStampStore.getState().pendingTemplateId).toBe(kaiTemplate);

    deferred.get('ArialMT')?.resolve();
    await useStampStore.getState().selectTemplate(plain);
    await flush();
    expect(useStampStore.getState().template?.id).toBe(plain);
    expect(useStampStore.getState().pendingTemplateId).toBeNull();

    deferred.get('TW-MOE-Std-Kai')!.resolve(); // the older probe lands now
    await first;
    await flush();
    expect(useStampStore.getState().template?.id).toBe(plain);
  });

  it('drops a selection whose probe resolves after reset()', async () => {
    const jpTemplate = withFonts(['HiraMinProN-W6']);
    const pending = useStampStore.getState().selectTemplate(jpTemplate);

    useStampStore.getState().reset();
    deferred.get('HiraMinProN-W6')!.resolve();
    await pending;
    await flush();
    expect(useStampStore.getState().template).toBeNull();
    expect(useStampStore.getState().pendingTemplateId).toBeNull();
  });
});
