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

let mockParseTemplate = () => ({ baselines: [], frames: [], outline: null });

jest.mock('./builders/buildTemplate', () => ({ parseTemplate: () => mockParseTemplate() }));

let mockBuildGate = async (): Promise<void> => {};
let mockBuildCount = 0;

jest.mock('./builders/buildShape', () => ({
  buildPreviewSvg: () => document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
  buildStampShape: async () => {
    mockBuildCount += 1;
    await mockBuildGate();

    return { bounds: { height: 100, width: 100 }, cut: null, engrave: [], group: { remove: jest.fn() } };
  },
}));

import { applyBundledFontStyle } from '@core/helpers/fonts/bundledFonts';

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

  it('discards a build that was still in flight when reset() ran', async () => {
    const plain = STAMP_TEMPLATES.find((t) => !t.preferredFonts)!.id;
    const gates: Array<() => void> = [];

    mockBuildGate = () => new Promise((r) => gates.push(r));
    deferred.get('ArialMT')?.resolve();
    await useStampStore.getState().selectTemplate(plain);
    await flush();
    useStampStore.getState().reset();
    await useStampStore.getState().selectTemplate(plain);
    await flush();
    expect(gates).toHaveLength(2);

    gates[1](); // the build for the reopened dialog lands first
    await flush();

    const fresh = useStampStore.getState().shape;

    gates[0](); // the build from before reset() lands last
    await flush();
    expect(fresh).not.toBeNull();
    expect(useStampStore.getState().shape).toBe(fresh);
    mockBuildGate = async () => {};
  });

  it('clears the pending id and keeps the previous template when parsing fails', async () => {
    const plain = STAMP_TEMPLATES.find((t) => !t.preferredFonts)!.id;
    const other = STAMP_TEMPLATES.find((t) => !t.preferredFonts && t.id !== plain)!.id;

    deferred.get('ArialMT')?.resolve();
    await useStampStore.getState().selectTemplate(plain);

    const parsed = useStampStore.getState().parsed;

    mockParseTemplate = () => {
      throw new Error('bad svg');
    };
    await expect(useStampStore.getState().selectTemplate(other)).resolves.toBeUndefined();
    mockParseTemplate = () => ({ baselines: [], frames: [], outline: null });
    expect(useStampStore.getState().pendingTemplateId).toBeNull();
    expect(useStampStore.getState().template?.id).toBe(plain);
    expect(useStampStore.getState().parsed).toBe(parsed);
  });

  it('rebuilds once after a burst of text edits', async () => {
    const plain = STAMP_TEMPLATES.find((t) => !t.preferredFonts)!.id;

    deferred.get('ArialMT')?.resolve();
    await useStampStore.getState().selectTemplate(plain);
    await flush();

    const slotId = Object.keys(useStampStore.getState().state!.texts)[0];
    const before = mockBuildCount;

    for (const text of ['a', 'ab', 'abc']) useStampStore.getState().updateText(slotId, { text });

    expect(useStampStore.getState().state?.texts[slotId].text).toBe('abc');
    expect(mockBuildCount).toBe(before);
    await new Promise((r) => setTimeout(r, 200));
    expect(mockBuildCount).toBe(before + 1);
  });

  it('registers the @font-face of a preferred font that resolves', async () => {
    const lobsterTemplate = withFonts(['Lobster-Regular']);
    const pending = useStampStore.getState().selectTemplate(lobsterTemplate);

    deferred.get('Lobster-Regular')!.resolve();
    await pending;
    expect(applyBundledFontStyle).toHaveBeenCalledWith('Lobster-Regular');
  });
});
