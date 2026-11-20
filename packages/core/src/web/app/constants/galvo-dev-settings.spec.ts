import type { GalvoDevSettingField } from './galvo-dev-settings';
import {
  GALVO_DEV_SETTING_FIELDS,
  GALVO_DEV_SETTING_GROUPS,
  galvoDevDefaults,
  getActiveGalvoDevOverrides,
  isGalvoDevFieldActive,
} from './galvo-dev-settings';

const field = (key: string): GalvoDevSettingField => GALVO_DEV_SETTING_FIELDS.find((f) => f.key === key)!;
const shownUnder = (strategy: string | undefined): string[] =>
  GALVO_DEV_SETTING_FIELDS.filter((f) => f.group === 'blend' && isGalvoDevFieldActive(f, strategy)).map((f) => f.key);

describe('test galvo-dev-settings', () => {
  test('groups run in panel order, with gradient image processing before the seam', () => {
    expect(GALVO_DEV_SETTING_GROUPS.map((group) => group.key)).toEqual([
      'readOnly',
      'travel',
      'split',
      'raster',
      'blend',
      'prologue',
    ]);
    expect(GALVO_DEV_SETTING_GROUPS.find((group) => group.key === 'blend')!.title).toBe('接縫');
  });

  test('every field is described once', () => {
    const keys = GALVO_DEV_SETTING_FIELDS.map((f) => f.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  test('the defaults shown are the ones swiftray applies', () => {
    expect(galvoDevDefaults).toMatchObject({
      galvo_backlash_x: 5,
      galvo_backlash_y: 5,
      galvo_blank_jump_min: 0.5,
      galvo_blank_jump_wait: 300,
      galvo_block_start_delay: 150,
      galvo_dither: 'blue-noise',
      galvo_hseam_spread: 2,
      galvo_hseam_walk: 1,
      galvo_jump_speed: 7000,
      galvo_laser_off_delay: 200,
      galvo_laser_on_delay: -680,
      galvo_max_list_commands: 10000,
      galvo_pass_directions: 'UDUD',
      galvo_pass_pause: 0,
      galvo_passes: 4,
      galvo_seam_min_cost: true,
      galvo_seam_walk_length: 10,
      galvo_strategy: '',
      galvo_threshold: 255,
      galvo_tile_pause: 0,
      galvo_vseam_spread: 7.5,
      galvo_vseam_walk: 6,
    });
  });

  test('the strategy is the first field of the seam group and offers the K-pass walk', () => {
    const strategy = field('galvo_strategy');

    expect(GALVO_DEV_SETTING_FIELDS.filter((f) => f.group === 'blend')[0]).toBe(strategy);
    expect(strategy.label).toBe('拼接策略');
    expect(strategy.kind === 'select' && strategy.options.map((option) => option.value)).toContain('dot-kpass-walk');
  });

  test('tone, threshold, dither and the blank-jump wait are gradient image processing, whatever the strategy', () => {
    for (const key of [
      'galvo_threshold',
      'galvo_tone_min',
      'galvo_tone_max',
      'galvo_dither',
      'galvo_blank_jump_wait',
      'galvo_blank_jump_min',
    ]) {
      expect(field(key).group).toBe('raster');
      expect(field(key).strategies).toBeUndefined();
    }
  });

  test('settings the strategy now decides are off the panel', () => {
    expect(field('galvo_line_blend_emission')).toBeUndefined();
    expect(field('galvo_dot_blend_line_core')).toBeUndefined();
  });

  test('the seam group shows only what the strategy reads', () => {
    const kpass = [
      'galvo_strategy',
      'galvo_passes',
      'galvo_pass_directions',
      'galvo_pass_pause',
      'galvo_vseam_walk',
      'galvo_vseam_spread',
      'galvo_hseam_walk',
      'galvo_hseam_spread',
      'galvo_seam_walk_length',
      'galvo_seam_min_cost',
    ];
    const dotBand = ['galvo_dot_blend_overlap', 'galvo_dot_blend_profile', 'galvo_dot_blend_grain'];
    const lineBand = ['galvo_line_blend_overlap', 'galvo_line_blend_profile'];

    expect(shownUnder('dot-kpass-walk')).toEqual(kpass);
    // none named: dots fade across their band, lines interlock as a checkerboard
    expect(shownUnder(undefined)).toEqual(['galvo_strategy', ...dotBand, ...lineBand, 'galvo_line_blend_segment']);
    expect(shownUnder('')).toEqual(shownUnder(undefined));
    expect(shownUnder('line-baseline')).toEqual(['galvo_strategy', ...dotBand]);
    expect(shownUnder('line-overlap-pwm')).toEqual(['galvo_strategy', ...dotBand, ...lineBand]);
    expect(shownUnder('line-overlap-scanlines')).toEqual(['galvo_strategy', ...dotBand, ...lineBand]);
    expect(shownUnder('dot-overlap-blend')).toEqual([
      'galvo_strategy',
      ...dotBand,
      ...lineBand,
      'galvo_line_blend_segment',
    ]);

    const core = shownUnder('dot-blend-line-core');

    expect(core.slice(0, 4)).toEqual(['galvo_strategy', ...dotBand]);
    expect(core.filter((key) => key.startsWith('galvo_process_dot_'))).toHaveLength(7);
    expect(core).toHaveLength(11);
  });

  test('getActiveGalvoDevOverrides drops what the strategy in use does not read', () => {
    const stored = {
      galvo_dot_blend_overlap: 4,
      galvo_jump_speed: 5000,
      galvo_passes: 3,
      galvo_process_dot_power: 40,
      galvo_tone_min: 0.2,
    };

    expect(getActiveGalvoDevOverrides({ ...stored, galvo_strategy: 'dot-kpass-walk' })).toEqual({
      galvo_jump_speed: 5000,
      galvo_passes: 3,
      galvo_strategy: 'dot-kpass-walk',
      galvo_tone_min: 0.2,
    });
    expect(getActiveGalvoDevOverrides(stored)).toEqual({
      galvo_dot_blend_overlap: 4,
      galvo_jump_speed: 5000,
      galvo_tone_min: 0.2,
    });
    expect(getActiveGalvoDevOverrides({ ...stored, galvo_strategy: 'dot-blend-line-core' })).toEqual({
      galvo_dot_blend_overlap: 4,
      galvo_jump_speed: 5000,
      galvo_process_dot_power: 40,
      galvo_strategy: 'dot-blend-line-core',
      galvo_tone_min: 0.2,
    });
  });

  test('getActiveGalvoDevOverrides leaves storage alone and passes through keys no field describes', () => {
    const stored = { galvo_line_blend_emission: 'overlap-pwm', galvo_passes: 3 } as const;

    expect(getActiveGalvoDevOverrides(stored)).toEqual({ galvo_line_blend_emission: 'overlap-pwm' });
    expect(stored).toEqual({ galvo_line_blend_emission: 'overlap-pwm', galvo_passes: 3 });
    expect(getActiveGalvoDevOverrides(null)).toEqual({});
    expect(getActiveGalvoDevOverrides(undefined)).toEqual({});
  });
});
