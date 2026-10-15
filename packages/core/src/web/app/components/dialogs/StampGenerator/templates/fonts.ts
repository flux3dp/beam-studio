// Default-font candidate lists (and the locales they pair with) shared by the hand-authored templates and the catalog.

/**
 * 楷書 for Taiwan-style seals: 教育部標準楷書 (an S3 web font already in webFonts.ts), then the OS 標楷體
 * on macOS and Windows.
 */
export const KAI_FONTS = ['TW-MOE-Std-Kai', 'DFKaiShu-SB-Estd-BF', 'DFKai-SB'];

/** UI languages whose users write Chinese seals: the KAI_FONTS templates are offered here (`locales`). */
export const CHINESE_LOCALES = ['zh-cn', 'zh-tw'];

/** 明朝体 for Japanese seals: Hiragino Mincho (macOS), Yu Mincho / MS Mincho (Windows). */
export const JP_FONTS = ['HiraMinProN-W6', 'YuMincho-Regular', 'MS-Mincho'];
