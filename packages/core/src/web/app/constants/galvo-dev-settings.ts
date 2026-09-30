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
  | 'dot-overlap-blend'
  | 'line-baseline'
  | 'line-overlap-checkerboard'
  | 'line-overlap-pwm'
  | 'line-overlap-scanlines'
  | 'line-overlap-segments'
  | 'line-report-optimized';

/** The simulator's overlap line strategies, by the names it uses for them. */
export type GalvoRunEmission = 'overlap-checkerboard' | 'overlap-pwm' | 'overlap-scanlines' | 'overlap-segments';

export interface GalvoDevConfig {
  /** Gantry stop spacing [width, height] in mm. Must be a whole number of full steps. */
  galvo_block: [number, number];
  /** Path a debug image of the block layout is written to. Empty disables it. */
  galvo_debug_image: string;
  /** Two-pass seam: runs for the core, blended dots for the band. */
  galvo_dot_blend_line_core: boolean;
  /** Width of the band a dithered image fades across, mm. 0 hard-seams the dots. */
  galvo_dot_blend_overlap: number;
  /** How the dots' density falls off across their band. */
  galvo_dot_blend_profile: GalvoBlendProfile;
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
  /** Mopa pulse length, us. Ignored on a CO2 head, which derives it from power. */
  galvo_mopa_pulse_length: number;
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
  /** Scanner polygon delay, us. */
  galvo_scanner_polygon_delay: number;
  /** Send the standby (pre-ionization) train. CO2 only; a Mopa layer skips it regardless. */
  galvo_standby: boolean;
  /** Standby period, us. */
  galvo_standby_period: number;
  /** Standby width, us. Rounded to a whole microsecond, floored at 1. */
  galvo_standby_width: number;
  /** One of the simulator's strategy ids, which settles the whole seam at once. */
  galvo_strategy: GalvoStrategy;
  /** Gantry travel speed while a galvo layer is running, mm/min. */
  galvo_ts: number;
}

export type GalvoDevConfigKey = keyof GalvoDevConfig;

export type GalvoDevSettingGroup = 'blend' | 'prologue' | 'readOnly' | 'split' | 'travel';

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
      '兩個區塊重疊處的處理方式。漸層點陣圖一律逐點淡出；二值化或深度雕刻是由線段構成的，' +
      '沒有階調可以讓，所以另外有一套策略。',
    key: 'blend',
    title: '接縫混合',
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
  /** What this does, and what the options mean. Shown on hover. */
  tooltip: string;
  unit?: string;
};

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
      '所以每種場鏡與平台各有一組值，不能隨便填。留空時 swiftray 依場鏡查 EVT 的表：' +
      '110 mm 用 100 x 100，70 mm 用 60 x 60。',
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
    default: 0,
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
      '執行 swiftray 那台電腦上的資料夾。填了之後每次匯出都會在那裡畫一張分塊示意圖：' +
      '龍門停位是點，該停位的場鏡可達範圍是填色方塊，實際負責雕的格子是外框。留空就不輸出。',
  },

  // --- seam blending -----------------------------------------------------
  {
    default: '',
    group: 'blend',
    key: 'galvo_strategy',
    kind: 'select',
    label: 'Simulator 策略',
    options: [
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
      '直接指定 laser-phy-simulator 的策略 id，一次把接縫設定調成那個策略。' +
      '要復現 simulator 上測過的結果就用這個，不必自己去湊下面那幾項。' +
      '下面的欄位仍然有效，而且會蓋過這裡——想在某個策略上單獨掃一個參數就這樣用。' +
      '留空表示不指定，只看下面的欄位。exp-001～exp-004 尚未實作，選不到。',
  },
  {
    default: 10,
    group: 'blend',
    key: 'galvo_dot_blend_overlap',
    kind: 'number',
    label: '點陣重疊帶寬度',
    min: 0,
    step: 0.5,
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
    tooltip:
      '一個區塊的佔比在帶內如何遞減。simple 全程固定一半，最粗糙。' +
      'granular 分四段走 0.75 / 0.5 / 0.5 / 0.25。' +
      'super-granular 分十段從 0.9 降到 0.1，最平滑但收斂最慢。',
  },
  {
    default: 10,
    group: 'blend',
    key: 'galvo_line_blend_overlap',
    kind: 'number',
    label: '線段重疊帶寬度',
    min: 0,
    step: 0.5,
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
    tooltip:
      '線段在帶內的佔比如何遞減，選項與點陣那條相同。預設用比點陣更細的 super-granular，' +
      '這也是 simulator 兩邊給不同預設值的原因：點陣怎麼分都是抽稀，線段則是每多一階就多一次跳躍。',
  },
  {
    default: 'overlap-checkerboard',
    group: 'blend',
    key: 'galvo_line_blend_emission',
    kind: 'select',
    label: '線段接縫策略',
    options: [
      { label: 'overlap-checkerboard（預設）', value: 'overlap-checkerboard' },
      { label: 'overlap-segments', value: 'overlap-segments' },
      { label: 'overlap-scanlines', value: 'overlap-scanlines' },
      { label: 'overlap-pwm', value: 'overlap-pwm' },
    ],
    tooltip:
      '二值化或深度雕刻的線段如何穿過接縫。線段沒有階調可以抽稀，所以前三種都是把每一小段' +
      '明確交給某一個區塊，差別只在齒紋長在哪：overlap-scanlines 整條掃描線歸一個區塊，' +
      '幾乎不花額外時間；overlap-segments 每條線的齒都長在同樣位置，但擁有者逐列交替；' +
      'overlap-checkerboard 連齒本身也逐列位移。overlap-pwm 則完全不切分——每個區塊都雕整條帶，' +
      '各自用自己那份功率，是淡出而不是互鎖，代價最高。',
  },
  {
    default: 2,
    group: 'blend',
    key: 'galvo_line_blend_segment',
    kind: 'number',
    label: '齒紋長度',
    min: 0.1,
    step: 0.5,
    tooltip:
      '沿著掃描線，歸屬要維持多長才能換手。齒越短越能遮住沒對準的接縫，但跳躍次數也越多：' +
      '以整面填滿的圖來說，2 mm 約多花 39% 雕刻時間，10 mm 約多花 17%。' +
      '只有 overlap-segments 和 overlap-checkerboard 會用到。',
    unit: 'mm',
  },
  {
    default: false,
    group: 'blend',
    key: 'galvo_dot_blend_line_core',
    kind: 'boolean',
    label: '重疊帶改用打點',
    tooltip:
      '核心區用線段滿功率雕，外圈那條帶改成打點，並套用漸層點陣圖那套密度混合。' +
      '這是線段在接縫處取得階調的唯一辦法：讓它不再是線段。開啟時整條帶都走點陣那組設定，' +
      '線段的帶寬與密度曲線不參與。整面填滿的圖會很貴，因為帶內每一格都會變成一個點。',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_process_dot_pulse_on_time',
    kind: 'number',
    label: '重疊帶打點時間',
    min: 0,
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
    tooltip: '對應 processDot.jumpSpeedMmS（預設 7000）。填 0 則沿用 list 前置指令的跳躍速度。',
    unit: 'mm/s',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_process_dot_laser_on_delay',
    kind: 'number',
    label: '重疊帶雷射開啟延遲',
    tooltip: '對應 processDot.laserOnDelayUs（預設 −680，比一般雕刻早得多）。留空則沿用前置指令的值。',
    unit: 'us',
  },
  {
    default: 0,
    group: 'blend',
    key: 'galvo_process_dot_laser_off_delay',
    kind: 'number',
    label: '重疊帶雷射關閉延遲',
    tooltip: '對應 processDot.laserOffDelayUs（預設 100）。留空則沿用前置指令的值。',
    unit: 'us',
  },

  // --- list prologue -----------------------------------------------------
  {
    default: 4000,
    group: 'prologue',
    key: 'galvo_jump_speed',
    kind: 'number',
    label: '跳躍速度',
    min: 1,
    tooltip: '雷射關閉時鏡片的移動速度。',
    unit: 'mm/s',
  },
  {
    default: -100,
    group: 'prologue',
    key: 'galvo_laser_on_delay',
    kind: 'number',
    label: '雷射開啟延遲',
    tooltip: '鏡片開始移動後多久才出光。負值表示先出光，用來補償雷射管達到功率所需的時間，' + '所以預設值是負的。',
    unit: 'us',
  },
  {
    default: 100,
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

/** swiftray's own defaults, for display. An untouched key is never sent. */
export const galvoDevDefaults: GalvoDevConfig = GALVO_DEV_SETTING_FIELDS.reduce(
  (acc, field) => ({ ...acc, [field.key]: field.default }),
  {} as GalvoDevConfig,
);

export type GalvoDevOverrides = Partial<GalvoDevConfig>;
