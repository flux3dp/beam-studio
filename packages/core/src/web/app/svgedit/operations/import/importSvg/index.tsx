import { sprintf } from 'sprintf-js';
import { match, P } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import { modelsWithModules } from '@core/app/actions/beambox/constant';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useDocumentStore } from '@core/app/stores/documentStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
import alertConfig from '@core/helpers/api/alert-config';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { ILang } from '@core/interfaces/ILang';
import type { ImportType } from '@core/interfaces/ImportSvg';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { determineImportType } from './utils/determineImportType';
import { determineTargetModule } from './utils/determineTargetModule';
import { handleBitmapImport } from './utils/handleBitmapImport';
import { processOutputData } from './utils/processOutputData';
import { uploadAndDivideSvg } from './utils/uploadAndDivideSvg';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const MAX_SVG_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
const ELEMENT_COUNT_THRESHOLD = 1_000; // 1000 elements
const PATH_D_COMMAND_COUNT_THRESHOLD = 50_000; // 50,000 commands

const callTooLargeAlert = (id: string, message: JSX.Element | string) =>
  new Promise<boolean>((resolve) => {
    if (alertConfig.read('skip-svg-import-warning')) {
      resolve(true); // If the user has opted out of the alert, resolve immediately

      return;
    }

    alertCaller.popUp({
      alwaysTriggerCheckboxCallbacks: false,
      buttonType: alertConstants.CONFIRM_CANCEL,
      caption: i18n.lang.beambox.popup.import_svg.title,
      checkbox: {
        callbacks: () => {
          console.log('User opted out of large SVG import alert');
          alertConfig.write('skip-svg-import-warning', true);
        },
        text: i18n.lang.alert.dont_show_again,
      },
      id,
      message,
      messageIcon: 'notice',
      onCancel: () => resolve(false),
      onConfirm: () => resolve(true),
      reverse: true,
    });
  });

function getTotalElementCount(doc: Document): number {
  return doc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon').length;
}

// Helper to check path 'd' attribute complexity
function getPathDComplexity(
  doc: Document,
  pathCommandThreshold: number,
): { isTooManyCommands: boolean; totalCommands: number } {
  const pathElements = doc.querySelectorAll('path');
  let totalCommands = 0;
  let isTooManyCommands = false;

  for (const pathEl of pathElements) {
    const dAttribute = pathEl.getAttribute('d');

    if (dAttribute) {
      const commands = dAttribute.match(/[MLHVCSQTAZ]/gi); // Matches all SVG path command letters, case-insensitive

      totalCommands += commands?.length ?? 0;

      if (totalCommands > pathCommandThreshold) isTooManyCommands = true;
    }
  }

  return { isTooManyCommands, totalCommands };
}

async function performSvgPreChecks(
  file: Blob,
  lang: ILang, // _lang is still passed, but not used directly in this revised snippet's messages
  sizeThresholdMaxBytes: number = MAX_SVG_FILE_SIZE_BYTES,
  elementCountThreshold: number = ELEMENT_COUNT_THRESHOLD,
  pathDCommandCountThreshold: number = PATH_D_COMMAND_COUNT_THRESHOLD,
): Promise<{ elementCount?: number; proceed: boolean; totalPathDCommands?: number }> {
  const {
    beambox: {
      popup: { import_svg: t },
    },
  } = lang;
  const warningMessages = Array.of<Record<'content' | 'id', string>>();

  try {
    // 1. Quick Check: File Size
    if (file.size > sizeThresholdMaxBytes) {
      const currentSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSizeMB = (sizeThresholdMaxBytes / 1024 / 1024).toFixed(2);

      warningMessages.push({
        content: sprintf(t.file_size_warning, currentSizeMB, maxSizeMB),
        id: 'file_size_warning',
      });
    }

    // 2. Read file content
    let svgStringContent: string;

    try {
      svgStringContent = await file.text();
    } catch (error) {
      console.error('Error reading SVG file content for pre-check:', error);

      return { proceed: false };
    }

    // Parse the SVG string once
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStringContent, 'image/svg+xml');

    if (doc.getElementsByTagName('parsererror').length > 0) {
      console.warn('SVG parsing error detected.');
      await callTooLargeAlert('Error', i18n.lang.beambox.popup.import_file_contain_invalid_path);

      return { proceed: false }; // Hard stop
    }

    // 3. Total Element Count Check
    const elementCount = getTotalElementCount(doc);

    if (elementCount > elementCountThreshold) {
      warningMessages.push({
        content: sprintf(t.element_count_warning, elementCount, elementCountThreshold),
        id: 'element_count_warning',
      });
    }

    // 4. Path 'd' Command Count Check
    const { isTooManyCommands, totalCommands } = getPathDComplexity(doc, pathDCommandCountThreshold);

    const totalPathDCommands = totalCommands;

    if (isTooManyCommands) {
      warningMessages.push({
        content: sprintf(t.path_d_command_count_warning, totalCommands, pathDCommandCountThreshold),
        id: 'path_d_command_count_warning',
      });
    }

    // 5. Show combined alert if any warnings were generated
    if (warningMessages.length > 0) {
      const combinedMessage = (
        <>
          <div>{t.intro_message}</div>
          {warningMessages.map(({ content, id }) => (
            <div key={id}>{content}</div>
          ))}
          <div>{t.advice_message}</div>
          <div>{t.advice_message_2}</div>
          <div>{t.confirmation_message}</div>
        </>
      );
      const continueImport = await callTooLargeAlert('too_large_svg', combinedMessage);

      if (!continueImport) {
        return { elementCount, proceed: false, totalPathDCommands };
      }
    }

    // All checks passed, or user agreed to continue through the combined warning
    return { elementCount, proceed: true, totalPathDCommands };
  } catch (error) {
    // Catch any unexpected errors during the process
    console.error('Unexpected error in performSvgPreChecks:', error);

    return { proceed: false };
  }
}
function finalizeImport(
  elements: SVGUseElement[],
  isFromNounProject: boolean,
  batchCmd: IBatchCommand,
  parentCmd: IBatchCommand | undefined,
): void {
  presprayArea.togglePresprayArea();
  progressCaller.popById('loading_image');

  if (isFromNounProject) {
    elements.forEach((elem) => elem.setAttribute('data-np', '1'));
  }

  useLayerStore.getState().setSelectedLayers([layerManager.getCurrentLayerName()!]);

  match(elements)
    .with([], () => svgCanvas.clearSelection())
    .with([P._], (elements) => svgCanvas.selectOnly(elements))
    .otherwise(() => svgCanvas.selectOnly(svgCanvas.tempGroupSelectedElements()));

  if (!parentCmd && !batchCmd.isEmpty()) {
    svgCanvas.addCommandToHistory(batchCmd);
  }
}

const importSvg = async (
  blob: Blob,
  {
    importType,
    isFromNounProject,
    parentCmd,
    skipByLayer = false,
    targetModule = null,
  }: Partial<{
    importType?: ImportType;
    isFromNounProject?: boolean;
    parentCmd?: IBatchCommand;
    skipByLayer: boolean;
    targetModule: LayerModuleType | null;
  }> = {},
): Promise<SVGUseElement[] | undefined> => {
  const { lang } = i18n;
  const preCheckResult = await performSvgPreChecks(blob, lang);

  if (!preCheckResult.proceed) {
    return; // Stop import based on pre-check results
  }

  const batchCmd = parentCmd ?? new history.BatchCommand('Import SVG');
  const hasModule = modelsWithModules.has(useDocumentStore.getState().workarea);

  targetModule = await determineTargetModule(targetModule, hasModule, lang);

  if (!targetModule) return; // Early exit if no module selected

  importType = await determineImportType(importType, targetModule, skipByLayer, lang);

  if (!importType) return; // Early exit if no import type selected

  // This function is the heavy part of the import process,
  // mainly on the division of the SVG into elements
  const outputData = await uploadAndDivideSvg(blob, importType, lang);

  if (!outputData) return; // Early exit if upload and divide failed

  const elementOptions = { parentCmd: batchCmd, targetModule, type: importType };
  const processedElements = await processOutputData(outputData, blob, elementOptions, importType);
  const bitmap = await handleBitmapImport(outputData, targetModule, batchCmd, processedElements.length > 0, lang);

  if (bitmap) processedElements.push(bitmap);

  finalizeImport(processedElements, Boolean(isFromNounProject), batchCmd, parentCmd);

  return processedElements;
};

export default importSvg;
