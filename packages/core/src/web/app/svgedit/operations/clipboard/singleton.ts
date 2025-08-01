import type { ClipboardCore } from '@core/interfaces/Clipboard';

import { MemoryClipboard } from './class/MemoryClipboard';
import { checkNativeClipboardSupport, NativeClipboard } from './class/NativeClipboard';

// Initialize with the default clipboard implementation.
export let clipboardCore: ClipboardCore = new MemoryClipboard();

// Asynchronously check for native clipboard support and switch the implementation if supported.
checkNativeClipboardSupport().then((hasNativeSupport) => {
  console.log('checkNativeClipboardSupport', hasNativeSupport);

  if (hasNativeSupport) {
    clipboardCore = new NativeClipboard();
  }
});
