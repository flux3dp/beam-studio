/* eslint-disable reactRefresh/only-export-components */
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import { adorModels } from '@core/app/actions/beambox/constant';
import dialogCaller from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { LayerModule, type LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import deviceMaster from '@core/helpers/device-master';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParameters } from '@core/interfaces/FisheyePreview';

import Instruction from './common/Instruction';
import Align from './ModuleCalibration/Align';

const PROGRESS_ID = 'module-calibration';
const DIALOG_ID = 'module-calibration';

/* eslint-disable perfectionist/sort-enums */
const enum Step {
  WAITING = 0,
  PUT_PAPER = 1,
  FOCUS_AND_CUT = 2,
  ALIGN = 3,
}
/* eslint-enable perfectionist/sort-enums */

interface Props {
  module?: LayerModuleType;
  onClose: (completed?: boolean) => void;
}

const calibrated: { [subey in LayerModuleType]?: Set<string> } = {};

const doCalibration = async (model: WorkAreaModel, module: LayerModuleType) => {
  if (adorModels.has(model)) {
    if (module === LayerModule.PRINTER) {
      await deviceMaster.doAdorPrinterCalibration();
    } else {
      await deviceMaster.doAdorIRCalibration();
    }
  } else if (module === LayerModule.PRINTER_4C) {
    await deviceMaster.doBeamo24CCalibration();
  } else {
    // TODO: bm2 1064
    console.error('TODO: add calibration fcode');
  }
};

// TODO: add unit test
const AdorCalibration = ({ module = LayerModule.LASER_UNIVERSAL, onClose }: Props): React.ReactNode => {
  const lang = useI18n().calibration;
  const param = useRef<FisheyeCameraParameters>({} as any);
  const [step, setStep] = useState<Step>(Step.WAITING);
  const { model, uuid: currentDeviceId } = useMemo(() => deviceMaster.currentDevice.info, []);
  const checkFirstStep = async () => {
    let fisheyeParameters: FisheyeCameraParameters | null = null;

    try {
      const currentParameter = await deviceMaster.fetchFisheyeParams();

      console.log(currentParameter);
      fisheyeParameters = currentParameter;
    } catch {
      // do nothing
    }

    if (!fisheyeParameters) {
      alertCaller.popUp({ message: lang.calibrate_camera_before_calibrate_modules });
      onClose(false);

      return;
    }

    param.current = { ...fisheyeParameters };

    if (calibrated[module]?.has(currentDeviceId)) {
      const res = await new Promise<boolean>((resolve) => {
        alertCaller.popUp({
          buttonLabels: [lang.skip],
          buttonType: alertConstants.CUSTOM_CANCEL,
          callbacks: () => resolve(true),
          message: lang.ask_for_readjust,
          onCancel: () => resolve(false),
        });
      });

      if (res) {
        setStep(Step.ALIGN);

        return;
      }
    }

    setStep(Step.PUT_PAPER);
  };

  useEffect(() => {
    if (step === Step.WAITING) {
      checkFirstStep();
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  const title = useMemo(() => {
    return match(module)
      .with(LayerModule.LASER_1064, () => lang.module_calibration_2w_ir)
      .with(LayerModule.PRINTER, () => lang.module_calibration_printer)
      .with(LayerModule.PRINTER_4C, () => `${lang.module_calibration_printer} (4C)`)
      .otherwise(() => `${lang.module_calibration_printer} (${getModulesTranslations()[module]})`);
  }, [module, lang]);

  const { animationSrcs, content, cutLabel } = useMemo(() => {
    if (step === Step.PUT_PAPER) {
      // TODO: update videos for beamo2
      if (module === LayerModule.LASER_1064) {
        return {
          animationSrcs: [
            { src: 'video/put-dark-paper.webm', type: 'video/webm' },
            { src: 'video/put-dark-paper.mp4', type: 'video/mp4' },
          ],
          content: lang.please_place_dark_colored_paper,
        };
      }

      let prefix = adorModels.has(model) ? 'ador' : 'bm2';

      return {
        animationSrcs: [
          { src: `video/${prefix}-put-paper.webm`, type: 'video/webm' },
          { src: `video/${prefix}-put-paper.mp4`, type: 'video/mp4' },
        ],
        content: lang.please_place_paper_center,
      };
    }

    if (step === Step.FOCUS_AND_CUT) {
      if (adorModels.has(model)) {
        let videoName = 'ador-focus-laser';
        let content = lang.ador_autofocus_material;
        let cutLabel: string | undefined;

        if (module === LayerModule.PRINTER) {
          videoName = 'ador-focus-printer';
          content = lang.ador_autofocus_focusing_block;
          cutLabel = lang.start_printing;
        } else if (module === LayerModule.LASER_1064) {
          videoName = 'ador-focus-ir';
        }

        return {
          animationSrcs: [
            { src: `video/${videoName}.webm`, type: 'video/webm' },
            { src: `video/${videoName}.mp4`, type: 'video/mp4' },
          ],
          content,
          cutLabel,
        };
      } else {
        return {
          animationSrcs: [
            { src: 'video/bm2-focus-laser.webm', type: 'video/webm' },
            { src: 'video/bm2-focus-laser.mp4', type: 'video/mp4' },
          ],
          content: lang.beamo2_autofocus_material,
          cutLabel: module === LayerModule.LASER_1064 ? undefined : lang.start_printing,
        };
      }
    }

    return {};
  }, [step, model, module, lang]);

  switch (step) {
    case Step.ALIGN:
      return (
        <Align
          fisheyeParam={param.current}
          module={module}
          onBack={() => setStep(Step.FOCUS_AND_CUT)}
          onClose={onClose}
          title={title}
        />
      );
    case Step.PUT_PAPER:
      return (
        <Instruction
          animationSrcs={animationSrcs}
          buttons={[{ label: lang.next, onClick: () => setStep(Step.FOCUS_AND_CUT), type: 'primary' }]}
          contentBeforeSteps={content}
          onClose={() => onClose(false)}
          title={title}
        />
      );
    case Step.FOCUS_AND_CUT: {
      return (
        <Instruction
          animationSrcs={animationSrcs}
          buttons={[
            { label: lang.back, onClick: () => setStep(Step.PUT_PAPER) },
            {
              label: cutLabel || lang.start_engrave,
              onClick: async () => {
                progressCaller.openNonstopProgress({
                  id: PROGRESS_ID,
                  message: lang.drawing_calibration_image,
                });
                try {
                  if (!calibrated[module]) {
                    calibrated[module] = new Set();
                  }

                  await doCalibration(model, module);
                  calibrated[module].add(currentDeviceId);
                  setStep(Step.ALIGN);
                } finally {
                  progressCaller.popById(PROGRESS_ID);
                }
              },
              type: 'primary',
            },
          ]}
          contentBeforeSteps={content}
          onClose={() => onClose(false)}
          title={title}
        />
      );
    }
    default:
      return null;
  }
};

export const showAdorCalibration = async (module?: LayerModuleType): Promise<boolean> => {
  if (dialogCaller.isIdExist(DIALOG_ID)) {
    return false;
  }

  return new Promise((resolve) => {
    dialogCaller.addDialogComponent(
      DIALOG_ID,
      <AdorCalibration
        module={module}
        onClose={(completed = false) => {
          dialogCaller.popDialogById(DIALOG_ID);
          resolve(completed);
        }}
      />,
    );
  });
};

export default AdorCalibration;
