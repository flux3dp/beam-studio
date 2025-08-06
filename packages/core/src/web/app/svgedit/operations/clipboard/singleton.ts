import type { ClipboardCore } from '@core/interfaces/Clipboard';

import { MemoryClipboard } from './class/MemoryClipboard';
import { checkNativeClipboardSupport, NativeClipboard } from './class/NativeClipboard';

// Initialize with the default clipboard implementation.
export let clipboardCore: ClipboardCore = new MemoryClipboard();

// Asynchronously check for native clipboard support and switch the implementation if supported.
checkNativeClipboardSupport().then((isNativeClipboardSupported) => {
  console.log('🚀 ~ clipboard/singleton.ts:11 ~ isNativeClipboardSupported:', isNativeClipboardSupported);

  if (isNativeClipboardSupported) {
    clipboardCore = new NativeClipboard();
  }
});
