import alertCaller from '@core/app/actions/alert-caller';
import { adorModels, nxModels } from '@core/app/actions/beambox/constant';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { importBvgString } from '@core/app/svgedit/operations/import/importBvg';
import { toggleUnsavedChangedDialog } from '@core/helpers/file/export';
import { setFileInAnotherTab } from '@core/helpers/fileImportHelper';
import { checkIsAtEditor, isAtPage } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';

export const exampleFileKeys = [
  // FOCUS PROBE
  'IMPORT_ACRYLIC_FOCUS_PROBE',
  'IMPORT_BEAMBOX_2_FOCUS_PROBE',
  // EXAMPLES for different workareas
  'IMPORT_EXAMPLE', // beamo
  'IMPORT_EXAMPLE_ADOR_LASER',
  'IMPORT_EXAMPLE_ADOR_PRINT_FULL',
  'IMPORT_EXAMPLE_ADOR_PRINT_SINGLE',
  'IMPORT_EXAMPLE_BEAMBOX_2',
  'IMPORT_EXAMPLE_BEAMO_2_LASER',
  'IMPORT_EXAMPLE_BEAMO_2_PRINT',
  'IMPORT_EXAMPLE_HEXA',
  'IMPORT_EXAMPLE_HEXA_RF',
  'IMPORT_EXAMPLE_PROMARK',
  'IMPORT_HELLO_BEAMBOX',
] as const;

export const materialTestFileKeys = [
  'IMPORT_MATERIAL_TESTING_CUT',
  'IMPORT_MATERIAL_TESTING_ENGRAVE',
  'IMPORT_MATERIAL_TESTING_LINE',
  'IMPORT_MATERIAL_TESTING_OLD',
  'IMPORT_MATERIAL_TESTING_PRINT',
  'IMPORT_MATERIAL_TESTING_SIMPLECUT',
] as const;

export const promarkColorTestFileKeys = [
  'IMPORT_EXAMPLE_PROMARK_MOPA_20W_COLOR',
  'IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR',
  'IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR_2',
  'IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR',
  'IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR_2',
] as const;

export type ExampleFileKey =
  | (typeof exampleFileKeys)[number]
  | (typeof materialTestFileKeys)[number]
  | (typeof promarkColorTestFileKeys)[number];
type ExampleFileMap = Partial<Record<ExampleFileKey, string>>;

const exampleCache: Partial<Record<WorkAreaModel, ExampleFileMap>> = {};

// Note:
// 1. add bvg files to s3 (web) and public/examples (desktop) when adding new example files
// 2. use an empty string to always show the menu item in desktop but prevent to import the file
// 3. hanlde example files of limited models in getExamples
const basicExamples: ExampleFileMap = {
  IMPORT_ACRYLIC_FOCUS_PROBE: 'examples/focus_probe.bvg',
  IMPORT_BEAMBOX_2_FOCUS_PROBE: 'examples/beambox_2_focus_probe.bvg',
  IMPORT_EXAMPLE: 'examples/badge.bvg',
  IMPORT_EXAMPLE_ADOR_LASER: 'examples/ador_example_laser.bvg',
  IMPORT_EXAMPLE_ADOR_PRINT_FULL: '',
  IMPORT_EXAMPLE_ADOR_PRINT_SINGLE: '',
  IMPORT_EXAMPLE_BEAMBOX_2: 'examples/beambox_2_example.bvg',
  IMPORT_EXAMPLE_BEAMO_2_LASER: 'examples/beamo_2_example_laser.bvg',
  IMPORT_EXAMPLE_BEAMO_2_PRINT: '',
  IMPORT_EXAMPLE_HEXA: 'examples/hexa_example.bvg',
  IMPORT_EXAMPLE_HEXA_RF: 'examples/hexa_rf_example.bvg',
  IMPORT_HELLO_BEAMBOX: 'examples/hello-beambox.bvg',
  IMPORT_MATERIAL_TESTING_PRINT: '',
};

export const getExamples = (workarea: WorkAreaModel): ExampleFileMap => {
  if (exampleCache[workarea]) {
    return exampleCache[workarea];
  }

  let examples: ExampleFileMap = basicExamples;

  if (adorModels.has(workarea)) {
    examples = {
      ...basicExamples,
      IMPORT_EXAMPLE_ADOR_PRINT_FULL: 'examples/ador_example_printing_full.bvg',
      IMPORT_EXAMPLE_ADOR_PRINT_SINGLE: 'examples/ador_example_printing_single.bvg',
      IMPORT_MATERIAL_TESTING_CUT: 'examples/ador_cutting_test.bvg',
      IMPORT_MATERIAL_TESTING_ENGRAVE: 'examples/ador_engraving_test.bvg',
      IMPORT_MATERIAL_TESTING_OLD: 'examples/ador_engraving_test_classic.bvg',
      IMPORT_MATERIAL_TESTING_PRINT: 'examples/ador_color_ring.bvg',
      IMPORT_MATERIAL_TESTING_SIMPLECUT: 'examples/ador_cutting_test_simple.bvg',
    };
  } else if (nxModels.has(workarea)) {
    examples = {
      ...basicExamples,
      IMPORT_MATERIAL_TESTING_CUT: 'examples/mat_test_cut_beambox_2.bvg',
      IMPORT_MATERIAL_TESTING_ENGRAVE: 'examples/mat_test_engrave_beambox_2.bvg',
      IMPORT_MATERIAL_TESTING_LINE: 'examples/mat_test_line.bvg',
    };

    if (workarea === 'fbm2') {
      examples = {
        ...examples,
        IMPORT_EXAMPLE_BEAMO_2_LASER: 'examples/beamo_2_example_laser.bvg',
        IMPORT_EXAMPLE_BEAMO_2_PRINT: 'examples/beamo_2_example_printing_full.bvg',
        IMPORT_MATERIAL_TESTING_PRINT: 'examples/beamo_2_color_ring.bvg',
      };
    }
  } else if (workarea === 'fpm1') {
    examples = {
      ...basicExamples,
      IMPORT_EXAMPLE_PROMARK: 'examples/promark_example.bvg',
      IMPORT_EXAMPLE_PROMARK_MOPA_20W_COLOR: 'examples/promark_mopa_20w_color_example.bvg',
      IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR: 'examples/promark_mopa_60w_color_example.bvg',
      IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR_2: 'examples/promark_mopa_60w_color_example_2.bvg',
      IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR: 'examples/promark_mopa_100w_color_example.bvg',
      IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR_2: 'examples/promark_mopa_100w_color_example_2.bvg',
    };
  } else {
    examples = {
      ...basicExamples,
      IMPORT_MATERIAL_TESTING_CUT: 'examples/mat_test_cut.bvg',
      IMPORT_MATERIAL_TESTING_ENGRAVE: 'examples/mat_test_engrave.bvg',
      IMPORT_MATERIAL_TESTING_LINE: 'examples/mat_test_line.bvg',
      IMPORT_MATERIAL_TESTING_OLD: 'examples/mat_test_old.bvg',
      IMPORT_MATERIAL_TESTING_SIMPLECUT: 'examples/mat_test_simple_cut.bvg',
    };
  }

  exampleCache[workarea] = examples;

  return examples;
};

export const getExampleVisibility = (
  workarea: WorkAreaModel,
): { disabledKeys: ExampleFileKey[]; enabledKeys: ExampleFileKey[] } => {
  const examples = getExamples(workarea);
  const enabledKeys = Object.keys(examples) as ExampleFileKey[];
  const disabledKeys: ExampleFileKey[] = exampleFileKeys.filter((key) => !enabledKeys.includes(key));

  if (workarea !== 'fpm1') {
    materialTestFileKeys.forEach((key) => {
      if (!enabledKeys.includes(key)) disabledKeys.push(key);
    });
  }

  return {
    disabledKeys,
    enabledKeys,
  };
};

export const getExampleFileName = (key: ExampleFileKey): string | undefined => {
  const workarea = useDocumentStore.getState().workarea;

  return getExamples(workarea)[key];
};

export const loadExampleFile = async (key: ExampleFileKey) => {
  if (isAtPage('welcome')) {
    setFileInAnotherTab({ key, type: 'example' });

    return;
  }

  if (!checkIsAtEditor()) return;

  const path = getExampleFileName(key);

  if (!path) {
    alertCaller.popUp({ message: i18n.lang.message.unsupported_example_file });

    return;
  }

  const res = await toggleUnsavedChangedDialog();

  if (!res) {
    return;
  }

  const oReq = new XMLHttpRequest();

  oReq.open('GET', isWeb() ? `https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/${path}` : path, true);
  oReq.responseType = 'blob';

  oReq.onload = async function onload() {
    const resp = oReq.response;
    const buf = Buffer.from(await new Response(resp).arrayBuffer());
    let string = buf.toString();

    if (i18n.getActiveLang() !== 'en') {
      const LANG = i18n.lang.beambox.right_panel.layer_panel;

      string = string.replace(/Engraving/g, LANG.layer_engraving).replace(/Cutting/g, LANG.layer_cutting);
    }

    await importBvgString(string);
  };

  oReq.send();
};
