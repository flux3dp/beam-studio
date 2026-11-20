/**
 * Developer overrides for the HEXA II galvo path.
 *
 * Every key here is read by swiftray's fcode exporter (ToolpathExporterFcode::parseParam)
 * and only when the machine is `fhx2galvo`. Nothing here is a user-facing setting: they exist
 * so the values can be swept on a real machine without a rebuild, and the panel that edits
 * them is behind the dev flag.
 *
 * The defaults are swiftray's own. They are recorded here to show in the panel, never sent:
 * an override the user has not touched stays absent from the payload, so the exporter applies
 * its own default and the two cannot drift apart into a silent disagreement.
 */

export type GalvoBlendProfile = 'granular' | 'simple' | 'super-granular';
/**
 * laser-phy-simulator's own strategy ids (GeneratorStrategyId), less the ones
 * swiftray does not implement: exp-001 through exp-004. Naming one settles the
 * whole seam, so a strategy proved out in the simulator is reproduced by its
 * own name rather than by rebuilding the combination it stands for.
 */
export type GalvoStrategy =
  | 'dot-blend-line-core'
  /** Not the simulator's: K passes per stop and wandering seams (swiftray GalvoKpassSeams). */
  | 'dot-kpass-walk'
  | 'dot-overlap-blend'
  | 'line-baseline'
  | 'line-overlap-checkerboard'
  | 'line-overlap-pwm'
  | 'line-overlap-scanlines'
  | 'line-overlap-segments'
  | 'line-report-optimized';

/** The simulator's overlap line strategies, by the names it uses for them. */
export type GalvoRunEmission = 'overlap-checkerboard' | 'overlap-pwm' | 'overlap-scanlines' | 'overlap-segments';

export type GalvoDither = 'blue-noise' | 'fs';

export interface GalvoDevConfig {
  /** How far short of a park the gantry goes first on each axis, mm, so it arrives moving +. 0 skips the axis. */
  galvo_backlash_x: number;
  galvo_backlash_y: number;
  /** Jumps across at least this much blank of the picture are waited before, mm. */
  galvo_blank_jump_min: number;
  /** How long the beam waits on a dot before such a jump, us. 0 switches it off. */
  galvo_blank_jump_wait: number;
  /** Gantry stop spacing [width, height] in mm. Must be a whole number of full steps. */
  galvo_block: [number, number];
  /** Wait after the gantry parks, before the first list of the block marks, ms. */
  galvo_block_start_delay: number;
  /** Path a debug image of the block layout is written to. Empty disables it. */
  galvo_debug_image: string;
  /** How a gradient image becomes dots. */
  galvo_dither: GalvoDither;
  /** Side of the square a dithered image's dots change owner in across the band, mm. 0 is per dot. */
  galvo_dot_blend_grain: number;
  /** Two-pass seam: runs for the core, blended dots for the band. */
  galvo_dot_blend_line_core: boolean;
  /** Width of the band a dithered image fades across, mm. 0 hard-seams the dots. */
  galvo_dot_blend_overlap: number;
  /** How the dots' density falls off across their band. */
  galvo_dot_blend_profile: GalvoBlendProfile;
  /** K-pass walk: range and per-pass spread of the horizontal seams, mm. */
  galvo_hseam_spread: number;
  galvo_hseam_walk: number;
  /** Galvo jump speed, mm/s. */
  galvo_jump_speed: number;
  /** Laser off delay, us. */
  galvo_laser_off_delay: number;
  /** Laser on delay, us. Negative fires the laser before the move. */
  galvo_laser_on_delay: number;
  /** How a run crosses a seam. */
  galvo_line_blend_emission: GalvoRunEmission;
  /** Width of the band a run's ownership is divided across, mm. 0 hard-seams the runs. */
  galvo_line_blend_overlap: number;
  /** How a run's share falls off across its band. */
  galvo_line_blend_profile: GalvoBlendProfile;
  /** Length of one ownership stretch along a scan line, mm. */
  galvo_line_blend_segment: number;
  /** Command cap per galvo list. 0 means no cap. */
  galvo_max_list_commands: number;
  /** ENABLE_LASER's MO delay, us: how long the card waits after switching the laser on, once per block. */
  galvo_mo_delay: number;
  /** Mopa pulse length, us. Ignored on a CO2 head, which derives it from power. */
  galvo_mopa_pulse_length: number;
  /** K-pass walk: one letter per pass, cycled. U runs a pass bottom to top, D top to bottom. */
  galvo_pass_directions: string;
  /** K-pass walk: pause between two passes of a stop, s. */
  galvo_pass_pause: number;
  /** K-pass walk: passes per stop. */
  galvo_passes: number;
  /**
   * The simulator's processDot block: what the hybrid lays its band dots with, as against
   * what engraved the cores they stitch between. Every one falls back to the layer's own
   * setting, so naming none of them leaves the band where it was.
   */
  galvo_process_dot_jump_speed: number;
  galvo_process_dot_laser_off_delay: number;
  galvo_process_dot_laser_on_delay: number;
  galvo_process_dot_pitch: number;
  galvo_process_dot_power: number;
  galvo_process_dot_pulse_on_time: number;
  galvo_process_dot_pulse_period: number;
  /** Scanner mark delay, us. */
  galvo_scanner_mark_delay: number;
  /** K-pass walk: vertical seams follow the cheapest path through the picture instead of a plain walk. */
  galvo_seam_min_cost: boolean;
  /** K-pass walk: length of seam over which the walk turns once, mm. */
  galvo_seam_walk_length: number;
  /** Scanner polygon delay, us. */
  galvo_scanner_polygon_delay: number;
  /** Send the standby (pre-ionization) train. CO2 only; a Mopa layer skips it regardless. */
  galvo_standby: boolean;
  /** Standby period, us. */
  galvo_standby_period: number;
  /** Standby width, us. Rounded to a whole microsecond, floored at 1. */
  galvo_standby_width: number;
  /** One of the simulator's strategy ids, or the K-pass walk; settles the whole seam at once. */
  galvo_strategy: GalvoStrategy;
  /** A gradient image's pixels at or above this (0 black .. 255 white) are cleared before the remap. */
  galvo_threshold: number;
  /** Pause before every park that has work but the first, s. */
  galvo_tile_pause: number;
  /**
   * Where a gradient image's tone lands as dot density: darkness t (0 white .. 1 black) becomes
   * min + (max - min) x t before dithering, white staying white. 0 / 1 leave the tone alone.
   */
  galvo_tone_max: number;
  galvo_tone_min: number;
  /** Gantry travel speed while a galvo layer is running, mm/min. */
  galvo_ts: number;
  /** K-pass walk: range and per-pass spread of the vertical seams, mm. */
  galvo_vseam_spread: number;
  galvo_vseam_walk: number;
}

export type GalvoDevConfigKey = keyof GalvoDevConfig;

export type GalvoDevSettingGroup = 'blend' | 'prologue' | 'raster' | 'readOnly' | 'split' | 'travel';

export const GALVO_DEV_SETTING_GROUPS: Array<{ description: string; key: GalvoDevSettingGroup; title: string }> = [
  // First, because everything below is read against it: the same override means something
  // different under a different lens or a different module offset.
  {
    description: '正常使用時由別處設定，這裡只是顯示目前生效的值。',
    key: 'readOnly',
    title: '目前生效',
  },
  // Second, because it decides the canvas boundary everything else is laid out inside.
  {
    description:
      '龍門實際走得到的範圍。停泊在機器上的模組頭會限制龍門，所以有沒有裝 Mopa 是兩組不同的值，' +
      '與這份工作用不用得到那顆頭無關。畫布上超出這個範圍的部分會被畫成邊界外。' +
      '開發期間的臨時設定：正式版會直接用一組固定的安全值，這一整組會移除。',
    key: 'travel',
    title: '移動範圍',
  },
  {
    description: '龍門會停在哪些位置，以及圖案如何分配給這些停位。',
    key: 'split',
    title: '分塊',
  },
  {
    description:
      '只作用在漸層點陣圖，依序是：① 二值化門檻——原圖值大於等於門檻的像素清成白色；' +
      '② 色調重新對應——剩下的像素黑度依密度上下限重新對應；③ dither。' +
      '門檻必須在色調重新對應之前：密度下限大於 0 時，接近白色的雜點會先被抬成看得見的點，之後就清不掉了。',
    key: 'raster',
    title: '點陣圖處理',
  },
  {
    description:
      '相鄰兩個區塊交界處的處理方式，由拼接策略決定。這一區只顯示目前策略用得到的欄位；' +
      '被隱藏的欄位即使之前填過值也不會送出，切回原本的策略時值還在。',
    key: 'blend',
    title: '接縫',
  },
  {
    description:
      '每個振鏡 list 的開頭都會重送一次，因為每個 list 都必須自足（HX2_GALVO_PROTOCOL.md 19.3）。' +
      '雕刻速度、功率與脈衝週期來自圖層設定，不在這裡。',
    key: 'prologue',
    title: 'List 前置指令',
  },
];

type BaseField = {
  /** swiftray's own default, shown as the placeholder. Never sent. */
  default: [number, number] | boolean | number | string;
  group: GalvoDevSettingGroup;
  key: GalvoDevConfigKey;
  label: string;
  /**
   * The strategies that read this field; '' is "none named". Absent means every one. A field
   * is shown, and sent, only under a strategy that reads it: an override left over from another
   * strategy would otherwise quietly change the one in use.
   */
  strategies?: ReadonlyArray<'' | GalvoStrategy>;
  /** What this does, and what the options mean. Shown on hover. */
  tooltip: string;
  unit?: string;
};

const KW = ['dot-kpass-walk'] as const;
/** Everything that fades dots across a band: every strategy but the K-pass walk. */
const DOT_BAND = [
  '',
  'line-baseline',
  'line-report-optimized',
  'line-overlap-checkerboard',
  'line-overlap-segments',
  'line-overlap-scanlines',
  'line-overlap-pwm',
  'dot-overlap-blend',
  'dot-blend-line-core',
] as const;
const LINE_BAND = [
  '',
  'line-overlap-checkerboard',
  'line-overlap-segments',
  'line-overlap-scanlines',
  'line-overlap-pwm',
  'dot-overlap-blend',
] as const;
const LINE_TEETH = ['', 'line-overlap-checkerboard', 'line-overlap-segments', 'dot-overlap-blend'] as const;
const DOT_CORE = ['dot-blend-line-core'] as const;

export type GalvoDevSettingField = BaseField &
  (
    | { kind: 'boolean' }
    | { kind: 'number'; max?: number; min?: number; step?: number }
    | { kind: 'pair'; step?: number }
    | { kind: 'select'; options: Array<{ label: string; value: string }> }
    | { kind: 'text' }
  );

export const GALVO_DEV_SETTING_FIELDS: GalvoDevSettingField[] = [
  // --- splitting ---------------------------------------------------------
  {
    default: [100, 100],
    group: 'split',
    key: 'galvo_block',
    kind: 'pair',
    label: '區塊大小',
    step: 0.0001,
    tooltip:
      '龍門每次移動的距離，也就是每個區塊負責的範圍。硬體只能停在整數倍的 full step 上，' +
      '所以每種場鏡與平台各有一組值，不能隨便填。留空時 swiftray 依場鏡決定：' +
      '110 mm 用 100 x 100，90 mm（僅 Mopa）用 80 x 80，70 mm 用 60 x 60。',
    unit: 'mm',
  },
  {
    default: 3000,
    group: 'split',
    key: 'galvo_ts',
    kind: 'number',
    label: '龍門移動速度',
    min: 1,
    tooltip: '區塊之間移動龍門的速度。比一般圖層（7500）慢，因為振鏡模組較重。一般雷射圖層仍使用自己的移動速度。',
    unit: 'mm/min',
  },
  {
    default: 5,
    group: 'split',
    key: 'galvo_backlash_x',
    kind: 'number',
    label: 'X backlash 距離',
    min: 0,
    step: 0.5,
    tooltip:
      '龍門到每個有內容的停位之前，先退到停位左邊這麼遠，再往右進場，讓每個停位都是 +X 方向到位。' +
      '填 0 則 X 不處理。沒有覆寫時跟著場鏡校正面板的「修正 backlash」開關：開是 5，關是 0。' +
      '進場點不會貼到行程左端（離 1 mm），貼到底龍門會回彈。',
    unit: 'mm',
  },
  {
    default: 5,
    group: 'split',
    key: 'galvo_backlash_y',
    kind: 'number',
    label: 'Y backlash 距離',
    min: 0,
    step: 0.5,
    tooltip:
      '同上的 Y：先退到停位上方這麼遠，先走 +Y、再走 +X 進場。填 0 則 Y 不處理。' +
      '沒有覆寫時同樣跟著「修正 backlash」開關：開是 5，關是 0。',
    unit: 'mm',
  },
  {
    default: 150,
    group: 'split',
    key: 'galvo_block_start_delay',
    kind: 'number',
    label: '停靠後等待',
    min: 0,
    tooltip:
      '龍門停好之後、該停位第一個 list 開始打之前的等待。可能解決區塊第一個 list 不出光或偏弱' +
      '（test8：50 ms 已見效）；也給龍門停下後的殘留晃動時間消退（test61bm 直線不直，待確認）。填 0 則不等。',
    unit: 'ms',
  },
  {
    default: 0,
    group: 'split',
    key: 'galvo_tile_pause',
    kind: 'number',
    label: 'tile 之間停頓',
    min: 0,
    step: 0.5,
    tooltip:
      '除了第一個之外，每個有內容的停位開打前先停這麼久。主要目的是讓抽風把煙排掉；測試時用 5 秒。' +
      '停頓會讓雷射管和板材多冷卻一些，副作用是顏色略有變化，所以比較顏色時兩份工作的停頓要相同。',
    unit: 's',
  },
  {
    default: 10000,
    group: 'split',
    key: 'galvo_max_list_commands',
    kind: 'number',
    label: '單一 list 指令上限',
    min: 0,
    tooltip: '振鏡 list 累積到這麼多指令就切一個新的。0 表示不限制。',
  },
  {
    default: '',
    group: 'split',
    key: 'galvo_debug_image',
    kind: 'text',
    label: 'Debug 圖輸出路徑',
    tooltip:
      '執行 swiftray 那台電腦上的路徑前綴，例如 /tmp/galvo。填了之後每次匯出都會在那裡畫一張分塊示意圖' +
      '（<前綴>-layerN.png）：龍門停位是點，該停位的場鏡可達範圍是填色方塊，實際負責雕的格子是外框。' +
      '每張漸層點陣圖也會存四個階段：原圖、門檻後、密度 remap 後、dither 後' +
      '（<前綴>-layerN-bitmapK-1-source / 2-threshold / 3-remapped / 4-dithered.png）。' +
      '拼接策略是「K 趟＋漫步」而且分成多塊時，另有一張 <前綴>-layerN-seams.png：' +
      '每條縫各趟的切點疊在 dither 後的圖上（一趟一色），右側是中央縫交叉 24 mm 的局部。' +
      '留空就不輸出。',
  },

  // --- gradient image processing -----------------------------------------
  {
    default: 255,
    group: 'raster',
    key: 'galvo_threshold',
    kind: 'number',
    label: '二值化門檻',
    max: 255,
    min: 1,
    tooltip:
      '漸層圖上，值大於等於這個門檻的像素（0 黑到 255 白）先清成白色，不出點。' +
      '用來清掉接近白色的雜點，而不必把整張圖改成非漸層。255 表示不處理；1 表示只留純黑。',
  },

  // --- seam blending -----------------------------------------------------
  {
    default: '',
    group: 'blend',
    key: 'galvo_strategy',
    kind: 'select',
    label: '拼接策略',
    options: [
      { label: 'K 趟＋漫步（dot-kpass-walk）', value: 'dot-kpass-walk' },
      { label: 'line-baseline', value: 'line-baseline' },
      { label: 'line-report-optimized', value: 'line-report-optimized' },
      { label: 'line-overlap-checkerboard', value: 'line-overlap-checkerboard' },
      { label: 'line-overlap-segments', value: 'line-overlap-segments' },
      { label: 'line-overlap-scanlines', value: 'line-overlap-scanlines' },
      { label: 'line-overlap-pwm', value: 'line-overlap-pwm' },
      { label: 'dot-overlap-blend', value: 'dot-overlap-blend' },
      { label: 'dot-blend-line-core', value: 'dot-blend-line-core' },
    ],
    tooltip:
      '一次決定接縫怎麼處理。「K 趟＋漫步」是在機器上測出來的做法：每個停位把漸層點陣圖分 K 趟打，' +
      '每條縫沿著彎曲的路徑切、每一趟再各自偏移，接縫在正面幾乎看不出來；代價是整體顏色變淺、工時增加。' +
      '它不處理線段圖，線段在這個策略下一律硬切。' +
      '其餘選項是 laser-phy-simulator 的策略 id，用來復現 simulator 上測過的結果。' +
      '下面只顯示目前策略用得到的欄位，填了會蓋過策略本身的設定。' +
      '留空表示不指定：漸層圖逐點淡出、線段走 checkerboard。exp-001～exp-004 尚未實作，選不到。',
  },
  {
    default: 10,
    group: 'blend',
    key: 'galvo_dot_blend_overlap',
    kind: 'number',
    label: '點陣重疊帶寬度',
    min: 0,
    step: 0.5,
    strategies: DOT_BAND,
    tooltip:
      '漸層點陣圖淡出所用的帶狀範圍總寬，接縫兩側各一半。填 0 則點陣直接硬切。' +
      '線段（二值化／深度）走的是另一條帶，兩者互不影響。',
    unit: 'mm',
  },
  {
    default: 'granular',
    group: 'blend',
    key: 'galvo_dot_blend_profile',
    kind: 'select',
    label: '點陣密度曲線',
    options: [
      { label: 'granular（預設）', value: 'granular' },
      { label: 'simple', value: 'simple' },
      { label: 'super-granular', value: 'super-granular' },
    ],
    strategies: DOT_BAND,
    tooltip:
      '一個區塊的佔比在帶內如何遞減。simple 全程固定一半，最粗糙。' +
      'granular 分四段走 0.75 / 0.5 / 0.5 / 0.25。' +
      'super-granular 分十段從 0.9 降到 0.1，最平滑但收斂最慢。',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_dot_blend_grain',
    kind: 'number',
    label: '點陣換手格大小',
    min: 0,
    step: 0.5,
    strategies: DOT_BAND,
    tooltip:
      '漸層點陣圖在重疊帶裡以多大的方格為單位換手。填 0 則逐點換手（預設）。' +
      '逐點換手會把每個區塊的點抽稀到它的佔比，但實測點密度低於約一半時幾乎不顯色，' +
      '兩個區塊分開打的點也疊不出原本的深度，接縫因此變淡。' +
      '設成例如 2 mm 時，每一格都由單一區塊用原本的密度整格打完，佔比改成「拿到幾格」。' +
      '格線從機器原點起算。',
    unit: 'mm',
  },
  {
    default: 0,
    group: 'raster',
    key: 'galvo_tone_min',
    kind: 'number',
    label: '點陣密度下限',
    max: 1,
    min: 0,
    step: 0.05,
    tooltip:
      '漸層點陣圖抖色前的色調重新對應：像素的黑度 t（0 白到 1 黑）變成 下限 + (上限 − 下限) × t，' +
      '純白維持純白。CO2 管只有在前幾毫秒持續出光時每顆點才成立，密度太低的點會變弱甚至不顯色，' +
      '下限讓淺色區維持足夠的點密度。填 0 則不抬。',
  },
  {
    default: 1,
    group: 'raster',
    key: 'galvo_tone_max',
    kind: 'number',
    label: '點陣密度上限',
    max: 1,
    min: 0,
    step: 0.05,
    tooltip:
      '同上的上限。材料在某個密度之後顏色不再變黑、只會更深更焦（木板約 0.8），' +
      '上限把純黑壓在那個密度。填 1 則不壓。',
  },
  {
    default: 'blue-noise',
    group: 'raster',
    key: 'galvo_dither',
    kind: 'select',
    label: 'dither 方式',
    options: [
      { label: '藍噪聲（預設）', value: 'blue-noise' },
      { label: 'Floyd–Steinberg', value: 'fs' },
    ],
    tooltip:
      '漸層圖怎麼變成點。藍噪聲用一張 128 × 128 的遮罩平鋪在機器的像素格上，點的分布均勻、沒有方向性，' +
      '相鄰區塊用的是同一張遮罩；接縫與色階測試都是用它做的。Floyd–Steinberg 是原本的誤差擴散。',
  },
  {
    default: 300,
    group: 'raster',
    key: 'galvo_blank_jump_wait',
    kind: 'number',
    label: '空白跳躍前等待',
    max: 65535,
    min: 0,
    tooltip:
      '光束要跨過原圖的空白時，先在原地停這麼久再跳，讓雷射關閉後的餘光落在剛打的點上，' +
      '不會拖進空白裡（圖案邊緣與線條之間的淡痕）。只看原圖是不是空白，淡色區裡稀疏的點不會等。填 0 則關閉。',
    unit: 'us',
  },
  {
    default: 0.5,
    group: 'raster',
    key: 'galvo_blank_jump_min',
    kind: 'number',
    label: '空白跳躍門檻',
    min: 0.05,
    step: 0.1,
    tooltip:
      '跳躍路徑上，原圖連續空白至少這麼長才等。調太低，筆畫邊緣的窄縫也會等，工時略增、' +
      '質地也可能變粗（不建議低於 0.3）；調高則窄的空白不處理。',
    unit: 'mm',
  },
  {
    default: 10,
    group: 'blend',
    key: 'galvo_line_blend_overlap',
    kind: 'number',
    label: '線段重疊帶寬度',
    min: 0,
    step: 0.5,
    strategies: LINE_BAND,
    tooltip:
      '二值化或深度雕刻的線段用來劃分歸屬的帶狀範圍總寬，接縫兩側各一半。填 0 則線段直接硬切。' +
      '和點陣那條帶是分開的，關掉一邊不會影響另一邊。',
    unit: 'mm',
  },
  {
    default: 'super-granular',
    group: 'blend',
    key: 'galvo_line_blend_profile',
    kind: 'select',
    label: '線段密度曲線',
    options: [
      { label: 'super-granular（預設）', value: 'super-granular' },
      { label: 'granular', value: 'granular' },
      { label: 'simple', value: 'simple' },
    ],
    strategies: LINE_BAND,
    tooltip:
      '線段在帶內的佔比如何遞減，選項與點陣那條相同。預設用比點陣更細的 super-granular，' +
      '這也是 simulator 兩邊給不同預設值的原因：點陣怎麼分都是抽稀，線段則是每多一階就多一次跳躍。',
  },
  {
    default: 2,
    group: 'blend',
    key: 'galvo_line_blend_segment',
    kind: 'number',
    label: '齒紋長度',
    min: 0.1,
    step: 0.5,
    strategies: LINE_TEETH,
    tooltip:
      '沿著掃描線，歸屬要維持多長才能換手。齒越短越能遮住沒對準的接縫，但跳躍次數也越多：' +
      '以整面填滿的圖來說，2 mm 約多花 39% 雕刻時間，10 mm 約多花 17%。' +
      '只有 overlap-segments 和 overlap-checkerboard 會用到。',
    unit: 'mm',
  },
  {
    default: 4,
    group: 'blend',
    key: 'galvo_passes',
    kind: 'number',
    label: '趟數 K',
    min: 1,
    strategies: KW,
    tooltip:
      '每個停位把漸層點陣圖分 K 趟打，第 p 趟打行號除以 K 餘 p 的那些行。' +
      '分趟是為了把接縫兩側的深度差異攤平；代價是整體顏色變淺、工時增加。K = 1 等於不分趟。',
  },
  {
    default: 'UDUD',
    group: 'blend',
    key: 'galvo_pass_directions',
    kind: 'text',
    label: '各趟方向',
    strategies: KW,
    tooltip:
      '每一趟的行進方向，一個字母一趟：U 由下往上、D 由上往下；字串比趟數短時循環使用，留空等於 UD 交替。' +
      'K 為奇數時，第一趟和最後一趟同方向，效果沒有測過。刻意做成字串，讓測試時可以自行指定。',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_pass_pause',
    kind: 'number',
    label: '趟與趟之間停頓',
    min: 0,
    step: 0.5,
    strategies: KW,
    tooltip:
      '同一個停位的兩趟之間停這麼久。主要目的是讓抽風把煙排掉；測試時用 0.5 秒。' +
      '停頓會讓雷射管和板材多冷卻一些，副作用是顏色略有變化，所以比較顏色時兩份工作的停頓要相同。',
    unit: 's',
  },
  {
    default: 6,
    group: 'blend',
    key: 'galvo_vseam_walk',
    kind: 'number',
    label: '直縫漫步幅度',
    min: 0,
    step: 0.5,
    strategies: KW,
    tooltip:
      '直縫（左右兩個區塊之間）可以偏離格線多遠，正負各這麼多。場鏡在區塊外的餘裕放不下「幅度＋偏移總寬的一半」時，' +
      'swiftray 會自動縮小幅度（再不夠才縮偏移），並在 log 和 seams debug 圖上標出實際值。',
    unit: 'mm',
  },
  {
    default: 7.5,
    group: 'blend',
    key: 'galvo_vseam_spread',
    kind: 'number',
    label: '直縫各趟偏移總寬',
    min: 0,
    step: 0.5,
    strategies: KW,
    tooltip: '同一條直縫上，第一趟的切點到最後一趟的切點相距多遠；各趟等距排開，第一趟最右。',
    unit: 'mm',
  },
  {
    default: 1,
    group: 'blend',
    key: 'galvo_hseam_walk',
    kind: 'number',
    label: '橫縫漫步幅度',
    min: 0,
    step: 0.5,
    strategies: KW,
    tooltip: '橫縫（上下兩個區塊之間）可以偏離格線多遠，正負各這麼多。空間不足時同樣自動縮小。',
    unit: 'mm',
  },
  {
    default: 2,
    group: 'blend',
    key: 'galvo_hseam_spread',
    kind: 'number',
    label: '橫縫各趟偏移總寬',
    min: 0,
    step: 0.5,
    strategies: KW,
    tooltip: '同一條橫縫上，第一趟的切點到最後一趟的切點相距多遠；各趟等距排開。',
    unit: 'mm',
  },
  {
    default: 10,
    group: 'blend',
    key: 'galvo_seam_walk_length',
    kind: 'number',
    label: '漫步彎曲長度',
    min: 0.5,
    step: 0.5,
    strategies: KW,
    tooltip:
      '縫大約每隔這個長度轉一次彎，直縫、橫縫共用。調短，縫會變成細碎的鋸齒；調長則接近直線，失去漫步的效果。',
    unit: 'mm',
  },
  {
    default: true,
    group: 'blend',
    key: 'galvo_seam_min_cost',
    kind: 'boolean',
    label: '直縫走最小成本路徑',
    strategies: KW,
    tooltip:
      '直縫在漫步幅度的範圍內改走墨最少的路徑：會繞過跨到隔壁區塊的小突出、盡量切在空白處；' +
      '空白夠寬（1 mm 以上）時各趟的切點收在同一條線上；某個區塊只剩零星幾點時，交給左右鄰居、不為它停靠。' +
      '能繞多遠由「直縫漫步幅度」決定。整片都是墨的地方和純漫步差不多。關閉＝純漫步。橫縫不受影響。',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_process_dot_pulse_on_time',
    kind: 'number',
    label: '重疊帶打點時間',
    min: 0,
    strategies: DOT_CORE,
    tooltip:
      '帶內每一個點的停留時間，對應 simulator 的 processDot.pulseOnTimeUs。' +
      '填 0 會由掃描間距與雕刻速度推算——也就是線段掃過同一塊地會花的時間——' +
      '讓帶內的深淺和相接的核心區一致。只有開啟「重疊帶改用打點」時才會用到。' +
      'processDot 其餘六項（功率、點距、脈衝週期、跳躍速度、兩個延遲）目前沒有對應，' +
      '帶內的點會沿用圖層的設定。',
    unit: 'us',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_process_dot_power',
    kind: 'number',
    label: '重疊帶打點功率',
    max: 100,
    min: 0,
    strategies: DOT_CORE,
    tooltip:
      '帶內打點所用的功率，對應 simulator 的 processDot.powerPct（它預設 100）。' +
      '填 0 表示沿用圖層功率。帶是用來銜接兩塊核心區的，不一定要和雕核心的設定相同——' +
      'simulator 給它一整組獨立參數就是這個原因。',
    unit: '%',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_process_dot_pitch',
    kind: 'number',
    label: '重疊帶點距',
    min: 0,
    step: 0.05,
    strategies: DOT_CORE,
    tooltip:
      '帶內打點的格距，對應 processDot.dotPitchMm（預設 0.2）。填 0 則沿用點陣圖自己的像素格。' +
      '格子錨定在機器原點，所以相鄰區塊會落在同一批位置、對得上歸屬。',
    unit: 'mm',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_process_dot_pulse_period',
    kind: 'number',
    label: '重疊帶脈衝週期',
    min: 0,
    strategies: DOT_CORE,
    tooltip: '對應 processDot.pulsePeriodUs（預設 150）。填 0 則沿用圖層頻率換算出來的週期。',
    unit: 'us',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_process_dot_jump_speed',
    kind: 'number',
    label: '重疊帶跳躍速度',
    min: 0,
    strategies: DOT_CORE,
    tooltip: '對應 processDot.jumpSpeedMmS（預設 7000）。填 0 則沿用 list 前置指令的跳躍速度。',
    unit: 'mm/s',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_process_dot_laser_on_delay',
    kind: 'number',
    label: '重疊帶雷射開啟延遲',
    strategies: DOT_CORE,
    tooltip: '對應 processDot.laserOnDelayUs（預設 −680，比一般雕刻早得多）。留空則沿用前置指令的值。',
    unit: 'us',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_process_dot_laser_off_delay',
    kind: 'number',
    label: '重疊帶雷射關閉延遲',
    strategies: DOT_CORE,
    tooltip: '對應 processDot.laserOffDelayUs（預設 100）。留空則沿用前置指令的值。',
    unit: 'us',
  },

  // --- list prologue -----------------------------------------------------
  {
    default: 7000,
    group: 'prologue',
    key: 'galvo_jump_speed',
    kind: 'number',
    label: '跳躍速度',
    min: 1,
    tooltip:
      '雷射關閉時鏡片的移動速度。4000 時光束離開圖案的拖尾較明顯，接縫與牽連測試一律用 7000。',
    unit: 'mm/s',
  },
  {
    default: -680,
    group: 'prologue',
    key: 'galvo_laser_on_delay',
    kind: 'number',
    label: '雷射開啟延遲',
    tooltip: '鏡片開始移動後多久才出光。負值表示先出光，用來補償雷射管達到功率所需的時間，' + '所以預設值是負的。',
    unit: 'us',
  },
  {
    default: 200,
    group: 'prologue',
    key: 'galvo_laser_off_delay',
    kind: 'number',
    label: '雷射關閉延遲',
    tooltip: '鏡片停下後雷射還要持續出光多久，避免線段末端雕不足。',
    unit: 'us',
  },
  {
    default: 100,
    group: 'prologue',
    key: 'galvo_scanner_mark_delay',
    kind: 'number',
    label: '振鏡雕刻延遲',
    min: 0,
    tooltip: '一段雕刻結束後，留給鏡片穩定下來的時間，之後才執行下一個指令。',
    unit: 'us',
  },
  {
    default: 50,
    group: 'prologue',
    key: 'galvo_scanner_polygon_delay',
    kind: 'number',
    label: '振鏡轉角延遲',
    min: 0,
    tooltip: '兩段雕刻之間的轉角處，留給鏡片穩定下來的時間。',
    unit: 'us',
  },
  {
    default: true,
    group: 'prologue',
    key: 'galvo_standby',
    kind: 'boolean',
    label: '待機脈衝',
    tooltip:
      '送出待機（預游離）脈衝串，讓 CO2 雷射管在兩段雕刻之間保持預備狀態。' +
      'Mopa 圖層不論這裡怎麼設都會跳過——預游離是 CO2 才有的概念。',
  },
  {
    default: 100,
    group: 'prologue',
    key: 'galvo_standby_period',
    kind: 'number',
    label: '待機脈衝週期',
    min: 1,
    tooltip: '待機脈衝串的週期。',
    unit: 'us',
  },
  {
    default: 1,
    group: 'prologue',
    key: 'galvo_standby_width',
    kind: 'number',
    label: '待機脈衝寬度',
    min: 1,
    tooltip:
      '單一待機脈衝的寬度。SDK 只接受整數微秒，所以會四捨五入並且下限為 1——' + '小於 0.5 的值送到板子上會變成 0。',
    unit: 'us',
  },
  {
    default: 8000,
    group: 'prologue',
    key: 'galvo_mo_delay',
    kind: 'number',
    label: '開雷射等待（MO delay）',
    min: 0,
    tooltip:
      'ENABLE_LASER 的參數：板卡打開雷射主振盪器（MO）後等多久才繼續。每個區塊只開一次、' +
      '結尾才關，中間的 list 不再重複開關。Mopa 模組頭需要這段暖機：工廠實測 5 ms 略有缺點、' +
      '10 ms 完整，業界建議 8 ms。CO2 模組頭沒有 MO，這個值沒有作用。',
    unit: 'us',
  },
  {
    default: 0,
    group: 'prologue',
    key: 'galvo_mopa_pulse_length',
    kind: 'number',
    label: 'Mopa 脈衝寬度',
    min: 0,
    tooltip:
      'Mopa 模組頭雕刻時的脈衝寬度。CO2 模組頭沒有獨立的功率輸入——佔空比就是功率——' +
      '所以它會由圖層功率推算，忽略這裡的值。',
    unit: 'us',
  },
];

/**
 * Whether a field is read under `strategy` ('' or absent for none named), and so whether the
 * panel shows it and the export sends it.
 */
export const isGalvoDevFieldActive = (field: GalvoDevSettingField, strategy: string | undefined): boolean =>
  !field.strategies || (field.strategies as readonly string[]).includes(strategy ?? '');

/**
 * The overrides to hand swiftray: everything stored, less the fields the strategy in use does
 * not read. Those keep their values in storage, for when the strategy is switched back, but an
 * override nobody can see must not go on changing the export. Keys no field describes any more
 * (settings since taken off the panel) pass through as they are.
 */
export const getActiveGalvoDevOverrides = (stored: GalvoDevOverrides | null | undefined): GalvoDevOverrides => {
  const overrides = { ...stored };
  const strategy = overrides.galvo_strategy;

  for (const field of GALVO_DEV_SETTING_FIELDS) {
    if (!isGalvoDevFieldActive(field, strategy)) delete overrides[field.key];
  }

  return overrides;
};

/** swiftray's own defaults, for display. An untouched key is never sent. */
export const galvoDevDefaults: GalvoDevConfig = GALVO_DEV_SETTING_FIELDS.reduce(
  (acc, field) => ({ ...acc, [field.key]: field.default }),
  {} as GalvoDevConfig,
);

export type GalvoDevOverrides = Partial<GalvoDevConfig>;
