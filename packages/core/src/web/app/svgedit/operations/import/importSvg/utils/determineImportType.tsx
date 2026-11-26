import React from 'react';

import { sprintf } from 'sprintf-js';

import dialogCaller from '@core/app/actions/dialog-caller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import browser from '@core/implementations/browser';
import type { ILang } from '@core/interfaces/ILang';
import type { ImportType } from '@core/interfaces/ImportSvg';
import type { GlobalPreferenceKey } from '@core/interfaces/Preference';

import type { SvgSource } from './detectSvgSource';

const softwareNames = {
  affinity: 'Affinity Designer',
  illustrator: 'Adobe Illustrator',
  inkscape: 'Inkscape',
} as const;

// TODO: check currentImportType is valid?
export async function determineImportType(
  currentImportType: ImportType | undefined,
  targetModule: LayerModuleType,
  skipByLayer: boolean,
  lang: ILang,
  source?: SvgSource,
): Promise<ImportType | undefined> {
  if (currentImportType) return currentImportType;

  const importTypeOptions = Array.of<{ label: string; value: ImportType }>();

  if (!skipByLayer) {
    importTypeOptions.push({ label: lang.beambox.popup.layer_by_layer, value: 'layer' });
  }

  if (!printingModules.has(targetModule)) {
    importTypeOptions.push({ label: lang.beambox.popup.layer_by_color, value: 'color' });
  }

  importTypeOptions.push({ label: lang.beambox.popup.nolayer, value: 'nolayer' });

  if (importTypeOptions.length === 1) {
    return importTypeOptions[0].value;
  }

  // use skip-by-layer as a flag to separate the import of .svg and .ai files
  const id = `${targetModule}${skipByLayer ? '-skip-by-layer' : ''}-import-type`;
  const guide =
    source && !skipByLayer
      ? { name: softwareNames[source], url: lang.beambox.popup.import_svg.export_guide_urls[source] }
      : undefined;

  return dialogCaller.showRadioSelectDialog({
    defaultValue: useGlobalPreferenceStore.getState()[id as GlobalPreferenceKey] as any,
    description: guide ? (
      <a
        href={guide.url}
        onClick={(event) => {
          event.preventDefault();
          browser.open(guide.url);
        }}
        rel="noreferrer"
        target="_blank"
      >
        {sprintf(lang.beambox.popup.import_svg.export_guide, guide.name)}
      </a>
    ) : undefined,
    id,
    options: importTypeOptions,
    title: lang.beambox.popup.select_import_method,
  });
}
