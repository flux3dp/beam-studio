import { useCallback, useRef, useState } from 'react';

import type { BatchCommand } from '@core/app/svgedit/history/history';
import { InsertElementCommand } from '@core/app/svgedit/history/history';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

// In-memory storage for preview state per modal (persists across open/close, resets on page reload)
const previewStateStore: Record<string, boolean> = {};

/** Selection mode after committing preview */
type SelectionMode = 'all' | 'inserted' | 'none';

interface UsePreviewModalOptions {
  /** Function that generates the preview and returns a batch command */
  generatePreview: () => Promise<BatchCommand | null>;
  /** Unique key to persist preview state across modal open/close (e.g., 'array', 'offset') */
  key: string;
  /**
   * Selection mode after committing:
   * - 'all': Select original elements + newly inserted elements (for ArrayModal)
   * - 'inserted': Select only newly inserted elements (for OffsetModal)
   * - 'none': Don't change selection
   * @default 'none'
   */
  selectionMode?: SelectionMode;
}

interface UsePreviewModalReturn {
  /** The current batch command for the preview */
  batchCmd: React.MutableRefObject<BatchCommand | null>;
  /** Commit the preview to history (generates if preview disabled, commits existing otherwise) */
  commitPreview: () => Promise<BatchCommand | null>;
  /** Trigger a preview generation */
  handlePreview: () => Promise<void>;
  /** Whether preview is currently enabled */
  previewEnabled: boolean;
  /** Set the preview enabled state */
  setPreviewEnabled: (enabled: boolean) => void;
  /** Unapply the current preview (for cancel) */
  unapplyPreview: () => void;
}

/**
 * Custom hook that encapsulates preview modal logic including:
 * - Preview generation with queue management
 * - Focus preservation across async operations
 * - Undo/redo command management
 * - Independent preview enabled state per modal key (persists across open/close, resets on page reload)
 */
const usePreviewModal = ({
  generatePreview,
  key,
  selectionMode = 'none',
}: UsePreviewModalOptions): UsePreviewModalReturn => {
  const batchCmd = useRef<BatchCommand | null>(null);
  const selectionRef = useRef<SVGElement[]>([...svgCanvas.getSelectedWithoutTempGroup()]);
  const processing = useRef(false);
  const queueNext = useRef(false);
  const focusedInputRef = useRef<HTMLElement | null>(null);

  // Get initial value from store, default to true if not set
  const [previewEnabled, setPreviewEnabledState] = useState(() => previewStateStore[key] ?? true);

  // Sync state changes to the store
  const setPreviewEnabled = useCallback(
    (enabled: boolean) => {
      previewStateStore[key] = enabled;
      setPreviewEnabledState(enabled);
    },
    [key],
  );

  const restoreSelection = useCallback(() => {
    if (selectionRef.current.length > 0) {
      svgCanvas.selectOnly(selectionRef.current, true);
    }
  }, []);

  const handlePreview = useCallback(async () => {
    // If preview is disabled, just unapply any existing preview
    if (!previewEnabled) {
      if (batchCmd.current) {
        batchCmd.current.unapply();
        batchCmd.current = null;
      }

      return;
    }

    // Capture focused element before any processing
    // Only update if we have a valid input (not BODY or other non-input elements)
    const currentActive = document.activeElement as HTMLElement | null;

    if (currentActive?.tagName === 'INPUT' && currentActive.closest('.ant-input-number')) {
      focusedInputRef.current = currentActive;
    }

    // If already generating, mark that we need another preview after current one finishes
    if (processing.current) {
      queueNext.current = true;

      return;
    }

    processing.current = true;

    // Unapply previous preview if exists
    if (batchCmd.current) {
      batchCmd.current.unapply();
      batchCmd.current = null;
    }

    // Restore original selection before generating new preview
    restoreSelection();

    // Generate the preview
    batchCmd.current = await generatePreview();

    // Restore original selection after preview
    restoreSelection();

    processing.current = false;

    // Process queued update if one occurred during generation
    if (queueNext.current) {
      queueNext.current = false;
      handlePreview();

      return; // Don't restore focus yet - let the queued call handle it
    }

    // Restore focus after React re-renders have settled (double RAF pattern)
    const elementToFocus = focusedInputRef.current;

    if (elementToFocus && document.body.contains(elementToFocus)) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (document.body.contains(elementToFocus)) {
            elementToFocus.focus();
          }
        });
      });
    }
  }, [previewEnabled, generatePreview, restoreSelection]);

  const unapplyPreview = useCallback(() => {
    if (batchCmd.current) {
      batchCmd.current.unapply();
      batchCmd.current = null;
    }
  }, []);

  /**
   * Commit the preview to history. If preview is disabled, generates the result first.
   * Returns the batch command if it should be added to history, null otherwise.
   * Selects elements based on the configured selectionMode.
   */
  const commitPreview = useCallback(async (): Promise<BatchCommand | null> => {
    // Wait for any in-progress preview to complete to avoid duplicate elements
    while (processing.current || queueNext.current) {
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    }

    let cmd: BatchCommand | null;

    if (!previewEnabled) {
      // Preview was disabled, generate the actual result
      cmd = await generatePreview();
    } else if (batchCmd.current) {
      // Use the existing preview command
      cmd = batchCmd.current;
      batchCmd.current = null; // Clear ref since it's being committed
    } else {
      // Preview is enabled but batchCmd is null - this shouldn't happen after waiting
      // but generate fresh as fallback
      cmd = await generatePreview();
    }

    // Select elements based on selectionMode
    if (cmd && selectionMode !== 'none') {
      const insertedElements = cmd.elements((c) => c.type() === InsertElementCommand.type()) as SVGElement[];
      const elementsToSelect =
        selectionMode === 'all' ? [...selectionRef.current, ...insertedElements] : insertedElements;

      if (elementsToSelect.length > 0) {
        svgCanvas.multiSelect(elementsToSelect);
      }
    }

    return cmd;
  }, [previewEnabled, generatePreview, selectionMode]);

  return {
    batchCmd,
    commitPreview,
    handlePreview,
    previewEnabled,
    setPreviewEnabled,
    unapplyPreview,
  };
};

export default usePreviewModal;
