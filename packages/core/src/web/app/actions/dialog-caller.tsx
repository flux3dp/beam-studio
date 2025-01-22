import * as React from 'react';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import Boxgen from '@core/app/components/boxgen/Boxgen';
import AboutBeamStudio from '@core/app/components/dialogs/AboutBeamStudio';
import AnnouncementPanel from '@core/app/components/dialogs/AnnouncementPanel';
import CartridgeSettingPanel from '@core/app/components/dialogs/CartridgeSettingPanel';
import ChangeLog from '@core/app/components/dialogs/ChangeLog';
import CodeGenerator from '@core/app/components/dialogs/CodeGenerator';
import DocumentSettings from '@core/app/components/dialogs/DocumentSettings';
import FirmwareUpdate from '@core/app/components/dialogs/FirmwareUpdate';
import FluxCredit from '@core/app/components/dialogs/FluxCredit';
import FluxIdLogin from '@core/app/components/dialogs/FluxIdLogin';
import FluxPlusWarning from '@core/app/components/dialogs/FluxPlusWarning';
import MaterialTestGeneratorPanel from '@core/app/components/dialogs/MaterialTestGeneratorPanel';
import MediaTutorial from '@core/app/components/dialogs/MediaTutorial';
import MyCloud from '@core/app/components/dialogs/myCloud/MyCloud';
import SaveFileModal from '@core/app/components/dialogs/myCloud/SaveFileModal';
import PreviewHeight from '@core/app/components/dialogs/PreviewHeight';
import RadioSelectDialog from '@core/app/components/dialogs/RadioSelectDialog';
import RatingPanel from '@core/app/components/dialogs/RatingPanel';
import SocialMediaModal from '@core/app/components/dialogs/SocialMediaModal';
import ImageEditPanel from '@core/app/components/ImageEditPanel';
import { eventEmitter } from '@core/app/contexts/DialogContext';
import LayerColorConfigPanel from '@core/app/views/beambox/Layer-Color-Config';
import NetworkTestingPanel from '@core/app/views/beambox/NetworkTestingPanel';
import NounProjectPanel from '@core/app/views/beambox/Noun-Project-Panel';
import type { PhotoEditMode } from '@core/app/views/beambox/Photo-Edit-Panel';
import PhotoEditPanel from '@core/app/views/beambox/Photo-Edit-Panel';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ShapePanel from '@core/app/views/beambox/ShapePanel/ShapePanel';
import SvgNestButtons from '@core/app/views/beambox/SvgNestButtons';
import DeviceSelector from '@core/app/views/dialogs/DeviceSelector';
import CropPanel from '@core/app/views/dialogs/image-edit/CropPanel';
import Prompt from '@core/app/views/dialogs/Prompt';
import Tutorial from '@core/app/views/tutorials/Tutorial';
import DialogBox from '@core/app/widgets/Dialog-Box';
import InputLightBox from '@core/app/widgets/InputLightbox';
import type { AlertConfigKey } from '@core/helpers/api/alert-config';
import { getCurrentUser, getInfo } from '@core/helpers/api/flux-id';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';
import type { ChipSettings } from '@core/interfaces/Cartridge';
import type { IAnnouncement } from '@core/interfaces/IAnnouncement';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { IDialogBoxStyle, IInputLightBox, IPrompt } from '@core/interfaces/IDialog';
import type { IMediaTutorial, ITutorial } from '@core/interfaces/ITutorial';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const layerPanelEventEmitter = eventEmitterFactory.createEventEmitter('layer-panel');

const addDialogComponent = (id: string, component: React.JSX.Element): void => {
  eventEmitter.emit('ADD_DIALOG_COMPONENT', id, component);
};

const clearAllDialogComponents = (): void => {
  eventEmitter.emit('CLEAR_ALL_DIALOG_COMPONENTS');
};

const isIdExist = (id: string): boolean => {
  const response = {
    isIdExist: false,
  };

  eventEmitter.emit('CHECK_ID_EXIST', id, response);

  return response.isIdExist;
};

const popDialogById = (id: string): void => {
  eventEmitter.emit('POP_DIALOG_BY_ID', id);
};

let promptIndex = 0;
const getPromptId = (): string => {
  const id = `prompt-${promptIndex}`;

  promptIndex = (promptIndex + 1) % 10000;

  return id;
};

const showLoginDialog = (callback?: () => void, silent = false): void => {
  if (isIdExist('flux-id-login')) {
    return;
  }

  if (isWeb() && callback) {
    window.addEventListener('DISMISS_FLUX_LOGIN', callback);
  }

  addDialogComponent(
    'flux-id-login',
    <FluxIdLogin
      onClose={() => {
        window.removeEventListener('DISMISS_FLUX_LOGIN', callback);
        popDialogById('flux-id-login');

        if (callback) {
          callback();
        }
      }}
      silent={silent}
    />,
  );
};

const forceLoginWrapper = (
  callback: () => Promise<void> | void,
  silent?: boolean,
  failCallback?: () => Promise<void> | void,
): void => {
  let user = getCurrentUser();

  if (!user) {
    showLoginDialog(() => {
      user = getCurrentUser();

      if (user) {
        callback();
      } else {
        failCallback?.();
      }
    }, silent);
  } else {
    callback();
  }
};

// TODO: decouple dialog caller and dialog modals
const showFluxPlusWarning = (monotype?: boolean): void => {
  if (isIdExist('flux-plus-warning')) {
    return;
  }

  addDialogComponent(
    'flux-plus-warning',
    <FluxPlusWarning monotype={monotype} onClose={() => popDialogById('flux-plus-warning')} />,
  );
};

eventEmitter.on('SHOW_FLUX_PLUS_WARNING', showFluxPlusWarning);

const showDeviceSelector = (onSelect) => {
  addDialogComponent(
    'device-selector',
    <DeviceSelector onClose={() => popDialogById('device-selector')} onSelect={onSelect} />,
  );
};

const promptDialog = (args: IPrompt): void => {
  const id = getPromptId();

  promptIndex = (promptIndex + 1) % 10000;
  addDialogComponent(
    id,
    <Prompt
      caption={args.caption}
      defaultValue={args.defaultValue}
      message={args.message}
      onCancel={args.onCancel}
      onClose={() => popDialogById(id)}
      onYes={args.onYes}
    />,
  );
};

export default {
  addDialogComponent,
  clearAllDialogComponents,
  forceLoginWrapper,
  getPreviewHeight: (args: { initValue: number }): Promise<null | number> =>
    new Promise((resolve) => {
      const id = 'get-preview-height';

      if (isIdExist(id)) {
        popDialogById(id);
      }

      addDialogComponent(
        id,
        <PreviewHeight initValue={args.initValue} onClose={() => popDialogById(id)} onOk={(val) => resolve(val)} />,
      );
    }),
  getPromptValue: (args: IPrompt): Promise<null | string> =>
    new Promise((resolve) => {
      const onYes = (val?: string) => resolve(val);
      const onCancel = () => resolve(null);

      promptDialog({ ...args, onCancel, onYes });
    }),
  isIdExist,
  popDialogById,
  promptDialog,
  saveToCloud: (uuid?: string): Promise<{ fileName: null | string; isCancelled?: boolean }> =>
    new Promise<{ fileName: null | string; isCancelled?: boolean }>((resolve) => {
      addDialogComponent(
        'save-to-cloud',
        <SaveFileModal
          onClose={(fileName: null | string, isCancelled?: boolean) => {
            popDialogById('save-to-cloud');
            resolve({ fileName, isCancelled });
          }}
          uuid={uuid}
        />,
      );
    }),
  selectDevice: async (): Promise<IDeviceInfo> => {
    const device = await webNeedConnectionWrapper(
      () => new Promise<IDeviceInfo>((resolve) => showDeviceSelector(resolve)),
    );

    return device;
  },
  showAboutBeamStudio: (): void => {
    if (isIdExist('about-bs')) {
      return;
    }

    addDialogComponent('about-bs', <AboutBeamStudio onClose={() => popDialogById('about-bs')} />);
  },
  showAnnouncementDialog: (announcement: IAnnouncement): void => {
    const id = `announcement-${announcement.id}`;

    if (isIdExist(id)) {
      return;
    }

    addDialogComponent(id, <AnnouncementPanel announcement={announcement} onClose={() => popDialogById(id)} />);
  },
  showBoxGen: (onClose: () => void = () => {}): void => {
    if (isIdExist('box-gen')) {
      return;
    }

    addDialogComponent(
      'box-gen',
      <Boxgen
        onClose={() => {
          onClose();
          popDialogById('box-gen');
        }}
      />,
    );
  },
  showCatridgeSettingPanel: (initData: ChipSettings, inkLevel: number): void => {
    if (isIdExist('catridge-setting')) {
      return;
    }

    addDialogComponent(
      'catridge-setting',
      <CartridgeSettingPanel
        initData={initData}
        inkLevel={inkLevel}
        onClose={() => popDialogById('catridge-setting')}
      />,
    );
  },
  showChangLog: (args: { callback?: () => void } = {}): void => {
    if (isIdExist('change-log')) {
      return;
    }

    const { callback } = args;

    addDialogComponent(
      'change-log',
      <ChangeLog
        onClose={() => {
          popDialogById('change-log');

          if (callback) {
            callback();
          }
        }}
      />,
    );
  },
  showCodeGenerator: (onClose: () => void = () => {}): void => {
    if (isIdExist('code-generator')) {
      return;
    }

    addDialogComponent(
      'code-generator',
      <CodeGenerator
        onClose={() => {
          popDialogById('code-generator');
          onClose();
        }}
      />,
    );
  },
  showConfirmPromptDialog: (args: {
    alertConfigKey?: AlertConfigKey;
    caption?: string;
    confirmValue?: string;
    message?: string;
  }): Promise<boolean> =>
    new Promise((resolve) => {
      const id = getPromptId();

      addDialogComponent(
        id,
        <Prompt
          alertConfigKey={args.alertConfigKey}
          caption={args.caption}
          confirmValue={args.confirmValue}
          message={args.message}
          onCancel={() => resolve(false)}
          onClose={() => popDialogById(id)}
          onYes={(value) => {
            if (value?.toLowerCase() === args.confirmValue?.toLowerCase()) {
              resolve(true);
            }
          }}
          placeholder={args.confirmValue}
        />,
      );
    }),
  showCropPanel: (): void => {
    if (isIdExist('image-crop')) {
      return;
    }

    const selectedElements = svgCanvas.getSelectedElems();

    if (selectedElements.length !== 1) {
      return;
    }

    const element = selectedElements[0];
    const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');

    addDialogComponent(
      'image-crop',
      <CropPanel
        image={element}
        onClose={() => {
          popDialogById('image-crop');
          ObjectPanelController.updateActiveKey(null);
        }}
        src={src}
      />,
    );
  },
  showDialogBox: (id: string, style: IDialogBoxStyle, content: string): void => {
    if (isIdExist(id)) {
      return;
    }

    console.log(style);
    addDialogComponent(
      id,
      <DialogBox
        arrowColor={style.arrowColor}
        arrowDirection={style.arrowDirection}
        arrowHeight={style.arrowHeight}
        arrowPadding={style.arrowPadding}
        arrowWidth={style.arrowWidth}
        content={content}
        onClose={() => popDialogById(id)}
        position={style.position}
      />,
    );
  },
  showDocumentSettings: (): void => {
    if (isIdExist('docu-setting')) {
      return;
    }

    const unmount = () => popDialogById('docu-setting');

    addDialogComponent('docu-setting', <DocumentSettings unmount={unmount} />);
  },
  showDxfDpiSelector: (defaultValue: number): Promise<number> =>
    new Promise<number>((resolve) => {
      addDialogComponent(
        'dxf-dpi-select',
        <Prompt
          caption={i18n.lang.message.please_enter_dpi}
          defaultValue={defaultValue.toString()}
          message="1, 2.54, 25.4, 72, 96, ...etc."
          onCancel={() => {
            popDialogById('dxf-dpi-select');
            resolve(null);
          }}
          onClose={() => popDialogById('dxf-dpi-select')}
          onYes={(val: string) => {
            popDialogById('dxf-dpi-select');
            resolve(Number(val));
          }}
        />,
      );
    }),
  showFirmwareUpdateDialog: (
    device: IDeviceInfo,
    updateInfo: {
      changelog_en: string;
      changelog_zh: string;
      latestVersion: string;
    },
    onDownload: () => void,
    onInstall: () => void,
  ): void => {
    if (isIdExist('update-dialog')) {
      return;
    }

    const { model, name, version } = device;
    const releaseNode = i18n.getActiveLang() === 'zh-tw' ? updateInfo.changelog_zh : updateInfo.changelog_en;

    addDialogComponent(
      'update-dialog',
      <FirmwareUpdate
        currentVersion={version}
        deviceModel={model}
        deviceName={name}
        latestVersion={updateInfo.latestVersion}
        onClose={() => popDialogById('update-dialog')}
        onDownload={onDownload}
        onInstall={onInstall}
        releaseNote={releaseNode}
      />,
    );
  },
  showFluxCreditDialog: (): void => {
    if (isIdExist('flux-id-credit')) {
      return;
    }

    forceLoginWrapper(async () => {
      await getInfo(true);

      if (isIdExist('flux-id-credit')) {
        return;
      }

      addDialogComponent('flux-id-credit', <FluxCredit onClose={() => popDialogById('flux-id-credit')} />);
    }, true);
  },
  showImageEditPanel: (onClose: () => void = () => {}): void => {
    if (isIdExist('image-edit-panel')) {
      return;
    }

    const selectedElements = svgCanvas.getSelectedElems();

    if (selectedElements.length !== 1) {
      return;
    }

    const element = selectedElements[0];
    const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');

    addDialogComponent(
      'image-edit-panel',
      <ImageEditPanel
        image={element}
        onClose={() => {
          onClose();
          ObjectPanelController.updateActiveKey(null);
          popDialogById('image-edit-panel');
        }}
        src={src}
      />,
    );
  },
  showInputLightbox: (id: string, args: IInputLightBox): void => {
    addDialogComponent(
      id,
      <InputLightBox
        caption={args.caption}
        confirmText={args.confirmText}
        defaultValue={args.defaultValue}
        inputHeader={args.inputHeader}
        maxLength={args.maxLength}
        onClose={(from: string) => {
          popDialogById(id);

          if (from !== 'submit') {
            args.onCancel();
          }
        }}
        onSubmit={(value) => {
          args.onSubmit(value);
        }}
        type={args.type || 'TEXT_INPUT'}
      />,
    );
  },
  showLayerColorConfig: (): void => {
    if (isIdExist('layer-color-config')) {
      return;
    }

    addDialogComponent(
      'layer-color-config',
      <LayerColorConfigPanel onClose={() => popDialogById('layer-color-config')} />,
    );
  },
  showLoadingWindow: (): void => {
    const id = 'loading-window';

    if (isIdExist(id)) {
      return;
    }

    addDialogComponent(
      id,
      <div className="loading-background">
        <div className="spinner-roller absolute-center" />
      </div>,
    );
  },
  showLoginDialog,
  showMaterialTestGenerator: (onClose: () => void = () => {}): void => {
    if (isIdExist('material-test-generator')) {
      return;
    }

    addDialogComponent(
      'material-test-generator',
      <MaterialTestGeneratorPanel
        onClose={() => {
          popDialogById('material-test-generator');
          onClose();
        }}
      />,
    );
  },
  showMediaTutorial: (data: IMediaTutorial[]): Promise<void> =>
    new Promise<void>((resolve) => {
      addDialogComponent(
        'media-tutorial',
        <MediaTutorial
          data={data}
          onClose={() => {
            popDialogById('media-tutorial');
            resolve();
          }}
        />,
      );
    }),
  showMyCloud: (onClose: () => void): void => {
    if (isIdExist('my-cloud')) {
      return;
    }

    forceLoginWrapper(() => {
      if (isIdExist('my-cloud')) {
        return;
      }

      addDialogComponent(
        'my-cloud',
        <MyCloud
          onClose={() => {
            onClose();
            popDialogById('my-cloud');
          }}
        />,
      );
    }, true);
  },
  showNetworkTestingPanel: (ip?: string): void => {
    if (isIdExist('network-test')) {
      return;
    }

    addDialogComponent('network-test', <NetworkTestingPanel ip={ip} onClose={() => popDialogById('network-test')} />);
  },
  showNounProjectPanel: (): void => {
    if (isIdExist('noun-project')) {
      return;
    }

    addDialogComponent('noun-project', <NounProjectPanel onClose={() => popDialogById('noun-project')} />);
  },
  showPhotoEditPanel: (mode: PhotoEditMode): void => {
    if (isIdExist('photo-edit')) {
      return;
    }

    const selectedElements = svgCanvas.getSelectedElems();

    if (selectedElements.length !== 1) {
      return;
    }

    const element = selectedElements[0];
    const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');

    addDialogComponent(
      'photo-edit',
      <PhotoEditPanel element={element} mode={mode} src={src} unmount={() => popDialogById('photo-edit')} />,
    );
  },
  showRadioSelectDialog: <T,>({
    options,
    defaultValue = options[0].value,
    id = 'radio-select',
    title,
  }: {
    defaultValue?: T;
    id?: string;
    options: Array<{ label: string; value: T }>;
    title: string;
  }): Promise<T> =>
    new Promise((resolve) => {
      if (isIdExist(id)) {
        return;
      }

      addDialogComponent(
        id,
        <RadioSelectDialog<T>
          defaultValue={defaultValue}
          onCancel={() => {
            popDialogById(id);
            resolve(null);
          }}
          onOk={(val) => {
            popDialogById(id);
            beamboxPreference.write(id, val);
            resolve(val);
          }}
          options={options}
          title={title}
        />,
      );
    }),
  showRatingDialog: (onSubmit: (score: number) => void): void => {
    if (isIdExist('rating-dialog')) {
      return;
    }

    addDialogComponent(
      'rating-dialog',
      <RatingPanel onClose={() => popDialogById('rating-dialog')} onSubmit={onSubmit} />,
    );
  },
  showShapePanel: (onClose: () => void): void => {
    if (isIdExist('shape-panel')) {
      return;
    }

    addDialogComponent(
      'shape-panel',
      <ShapePanel
        onClose={() => {
          onClose();
          popDialogById('shape-panel');
        }}
      />,
    );
  },
  showSocialMedia: (): void => {
    const id = 'social-media';

    if (isIdExist(id)) {
      return;
    }

    addDialogComponent(id, <SocialMediaModal onClose={() => popDialogById(id)} />);
  },
  showSvgNestButtons: (): void => {
    if (isIdExist('svg-nest')) {
      return;
    }

    addDialogComponent('svg-nest', <SvgNestButtons onClose={() => popDialogById('svg-nest')} />);
  },
  showTutorial: (tutorial: ITutorial, callback: () => void): void => {
    const { id } = tutorial;

    if (isIdExist(id)) {
      return;
    }

    svgCanvas.clearSelection();
    layerPanelEventEmitter.emit('startTutorial');
    addDialogComponent(
      id,
      <Tutorial
        dialogStylesAndContents={tutorial.dialogStylesAndContents}
        end_alert={tutorial.end_alert}
        hasNextButton={tutorial.hasNextButton}
        onClose={() => {
          popDialogById(id);
          layerPanelEventEmitter.emit('endTutorial');
          callback();
        }}
      />,
    );
  },
};
