import * as React from 'react';

import AboutBeamStudio from 'app/components/dialogs/AboutBeamStudio';
import AnnouncementPanel from 'app/components/dialogs/AnnouncementPanel';
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import Boxgen from 'app/components/boxgen/Boxgen';
import CartridgeSettingPanel from 'app/components/dialogs/CartridgeSettingPanel';
import ChangeLog from 'app/components/dialogs/ChangeLog';
import CodeGenerator from 'app/components/dialogs/CodeGenerator';
import CropPanel from 'app/views/dialogs/image-edit/CropPanel';
import DeviceSelector from 'app/views/dialogs/DeviceSelector';
import DialogBox from 'app/widgets/Dialog-Box';
import DocumentSettings from 'app/components/dialogs/DocumentSettings';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import FirmwareUpdate from 'app/components/dialogs/FirmwareUpdate';
import FluxCredit from 'app/components/dialogs/FluxCredit';
import FluxIdLogin from 'app/components/dialogs/FluxIdLogin';
import FluxPlusWarning from 'app/components/dialogs/FluxPlusWarning';
import i18n from 'helpers/i18n';
import InputLightBox from 'app/widgets/InputLightbox';
import isWeb from 'helpers/is-web';
import LayerColorConfigPanel from 'app/views/beambox/Layer-Color-Config';
import MaterialTestGeneratorPanel from 'app/components/dialogs/MaterialTestGeneratorPanel';
import MediaTutorial from 'app/components/dialogs/MediaTutorial';
import MyCloud from 'app/components/dialogs/myCloud/MyCloud';
import NetworkTestingPanel from 'app/views/beambox/NetworkTestingPanel';
import NounProjectPanel from 'app/views/beambox/Noun-Project-Panel';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import PhotoEditPanel, { PhotoEditMode } from 'app/views/beambox/Photo-Edit-Panel';
import PreviewHeight from 'app/components/dialogs/PreviewHeight';
import Prompt from 'app/views/dialogs/Prompt';
import RadioSelectDialog from 'app/components/dialogs/RadioSelectDialog';
import RatingPanel from 'app/components/dialogs/RatingPanel';
import SaveFileModal from 'app/components/dialogs/myCloud/SaveFileModal';
import ShapePanel from 'app/views/beambox/ShapePanel/ShapePanel';
import shortcuts from 'helpers/shortcuts';
import SocialMediaModal from 'app/components/dialogs/SocialMediaModal';
import SvgNestButtons from 'app/views/beambox/SvgNestButtons';
import Tutorial from 'app/views/tutorials/Tutorial';
import webNeedConnectionWrapper from 'helpers/web-need-connection-helper';
import { AlertConfigKey } from 'helpers/api/alert-config';
import { ChipSettings } from 'interfaces/Cartridge';
import { eventEmitter } from 'app/contexts/DialogContext';
import { getCurrentUser, getInfo } from 'helpers/api/flux-id';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IAnnouncement } from 'interfaces/IAnnouncement';
import { IDeviceInfo } from 'interfaces/IDevice';
import { IDialogBoxStyle, IInputLightBox, IPrompt } from 'interfaces/IDialog';
import { IMediaTutorial, ITutorial } from 'interfaces/ITutorial';
import ImageEditPanel from 'app/components/ImageEditPanel';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});
const layerPanelEventEmitter = eventEmitterFactory.createEventEmitter('layer-panel');

const addDialogComponent = (id: string, component: JSX.Element): void => {
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
  if (isIdExist('flux-id-login')) return;
  if (isWeb() && callback) {
    window.addEventListener('DISMISS_FLUX_LOGIN', callback);
  }
  addDialogComponent(
    'flux-id-login',
    <FluxIdLogin
      silent={silent}
      onClose={() => {
        window.removeEventListener('DISMISS_FLUX_LOGIN', callback);
        popDialogById('flux-id-login');
        if (callback) callback();
      }}
    />
  );
};

const forceLoginWrapper = (
  callback: () => void | Promise<void>,
  silent?: boolean,
  failCallback?: () => void | Promise<void>
): void => {
  let user = getCurrentUser();
  if (!user) {
    showLoginDialog(() => {
      user = getCurrentUser();
      if (user) callback();
      else failCallback?.();
    }, silent);
  } else {
    callback();
  }
};

// TODO: decouple dialog caller and dialog modals
const showFluxPlusWarning = (monotype?: boolean): void => {
  if (isIdExist('flux-plus-warning')) return;
  addDialogComponent(
    'flux-plus-warning',
    <FluxPlusWarning onClose={() => popDialogById('flux-plus-warning')} monotype={monotype} />
  );
};
eventEmitter.on('SHOW_FLUX_PLUS_WARNING', showFluxPlusWarning);

const showDeviceSelector = (onSelect) => {
  addDialogComponent(
    'device-selector',
    <DeviceSelector onSelect={onSelect} onClose={() => popDialogById('device-selector')} />
  );
};

const promptDialog = (args: IPrompt): void => {
  const id = getPromptId();
  promptIndex = (promptIndex + 1) % 10000;
  addDialogComponent(
    id,
    <Prompt
      caption={args.caption}
      message={args.message}
      defaultValue={args.defaultValue}
      onYes={args.onYes}
      onCancel={args.onCancel}
      onClose={() => popDialogById(id)}
    />
  );
};

export default {
  addDialogComponent,
  clearAllDialogComponents,
  isIdExist,
  popDialogById,
  selectDevice: async (): Promise<IDeviceInfo> => {
    const device = await webNeedConnectionWrapper(
      () => new Promise<IDeviceInfo>((resolve) => showDeviceSelector(resolve))
    );
    return device;
  },
  showAboutBeamStudio: (): void => {
    if (isIdExist('about-bs')) return;
    addDialogComponent('about-bs', <AboutBeamStudio onClose={() => popDialogById('about-bs')} />);
  },
  showDocumentSettings: (): void => {
    if (isIdExist('docu-setting')) return;
    const unmount = () => popDialogById('docu-setting');
    addDialogComponent('docu-setting', <DocumentSettings unmount={unmount} />);
  },
  showDxfDpiSelector: (defaultValue: number): Promise<number> =>
    new Promise<number>((resolve) => {
      addDialogComponent(
        'dxf-dpi-select',
        <Prompt
          caption={i18n.lang.message.please_enter_dpi}
          message="1, 2.54, 25.4, 72, 96, ...etc."
          defaultValue={defaultValue.toString()}
          onYes={(val: string) => {
            popDialogById('dxf-dpi-select');
            resolve(Number(val));
          }}
          onCancel={() => {
            popDialogById('dxf-dpi-select');
            resolve(null);
          }}
          onClose={() => popDialogById('dxf-dpi-select')}
        />
      );
    }),
  showNetworkTestingPanel: (ip?: string): void => {
    if (isIdExist('network-test')) return;
    addDialogComponent(
      'network-test',
      <NetworkTestingPanel ip={ip} onClose={() => popDialogById('network-test')} />
    );
  },
  showNounProjectPanel: (): void => {
    if (isIdExist('noun-project')) return;
    addDialogComponent(
      'noun-project',
      <NounProjectPanel onClose={() => popDialogById('noun-project')} />
    );
  },
  showCropPanel: (): void => {
    if (isIdExist('image-crop')) return;
    const selectedElements = svgCanvas.getSelectedElems();
    if (selectedElements.length !== 1) return;
    const element = selectedElements[0];
    const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');
    addDialogComponent(
      'image-crop',
      <CropPanel
        src={src}
        image={element}
        onClose={() => {
          popDialogById('image-crop');
          ObjectPanelController.updateActiveKey(null);
        }}
      />
    );
  },
  showPhotoEditPanel: (mode: PhotoEditMode): void => {
    if (isIdExist('photo-edit')) return;
    const selectedElements = svgCanvas.getSelectedElems();
    if (selectedElements.length !== 1) return;
    const element = selectedElements[0];
    const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');
    addDialogComponent(
      'photo-edit',
      <PhotoEditPanel
        mode={mode}
        element={element}
        src={src}
        unmount={() => popDialogById('photo-edit')}
      />
    );
  },
  showLayerColorConfig: (): void => {
    if (isIdExist('layer-color-config')) return;
    addDialogComponent(
      'layer-color-config',
      <LayerColorConfigPanel onClose={() => popDialogById('layer-color-config')} />
    );
  },
  showRatingDialog: (onSubmit: (score: number) => void): void => {
    if (isIdExist('rating-dialog')) return;
    addDialogComponent(
      'rating-dialog',
      <RatingPanel onSubmit={onSubmit} onClose={() => popDialogById('rating-dialog')} />
    );
  },
  showAnnouncementDialog: (announcement: IAnnouncement): void => {
    const id = `announcement-${announcement.id}`;
    if (isIdExist(id)) return;
    addDialogComponent(
      id,
      <AnnouncementPanel announcement={announcement} onClose={() => popDialogById(id)} />
    );
  },
  showSvgNestButtons: (): void => {
    if (isIdExist('svg-nest')) return;
    addDialogComponent('svg-nest', <SvgNestButtons onClose={() => popDialogById('svg-nest')} />);
  },
  showTutorial: (tutorial: ITutorial, callback: () => void): void => {
    const { id } = tutorial;
    if (isIdExist(id)) return;
    svgCanvas.clearSelection();
    layerPanelEventEmitter.emit('startTutorial');
    addDialogComponent(
      id,
      <Tutorial
        hasNextButton={tutorial.hasNextButton}
        end_alert={tutorial.end_alert}
        dialogStylesAndContents={tutorial.dialogStylesAndContents}
        onClose={() => {
          popDialogById(id);
          layerPanelEventEmitter.emit('endTutorial');
          callback();
        }}
      />
    );
  },
  promptDialog,
  getPreviewHeight: (args: { initValue: number }): Promise<number | null> =>
    new Promise((resolve) => {
      const id = 'get-preview-height';
      if (isIdExist(id)) popDialogById(id);
      addDialogComponent(
        id,
        <PreviewHeight
          initValue={args.initValue}
          onOk={(val) => resolve(val)}
          onClose={() => popDialogById(id)}
        />
      );
    }),
  getPromptValue: (args: IPrompt): Promise<string | null> =>
    new Promise((resolve) => {
      const onYes = (val?: string) => resolve(val);
      const onCancel = () => resolve(null);
      promptDialog({ ...args, onYes, onCancel });
    }),
  showConfirmPromptDialog: (args: {
    caption?: string;
    message?: string;
    confirmValue?: string;
    alertConfigKey?: AlertConfigKey;
  }): Promise<boolean> =>
    new Promise((resolve) => {
      const id = getPromptId();
      addDialogComponent(
        id,
        <Prompt
          caption={args.caption}
          message={args.message}
          placeholder={args.confirmValue}
          confirmValue={args.confirmValue}
          onYes={(value) => {
            if (value?.toLowerCase() === args.confirmValue?.toLowerCase()) resolve(true);
          }}
          alertConfigKey={args.alertConfigKey}
          onCancel={() => resolve(false)}
          onClose={() => popDialogById(id)}
        />
      );
    }),
  showChangLog: (args: { callback?: () => void } = {}): void => {
    if (isIdExist('change-log')) return;
    const { callback } = args;
    addDialogComponent(
      'change-log',
      <ChangeLog
        onClose={() => {
          popDialogById('change-log');
          if (callback) callback();
        }}
      />
    );
  },
  showInputLightbox: (id: string, args: IInputLightBox): void => {
    addDialogComponent(
      id,
      <InputLightBox
        caption={args.caption}
        type={args.type || 'TEXT_INPUT'}
        inputHeader={args.inputHeader}
        defaultValue={args.defaultValue}
        confirmText={args.confirmText}
        maxLength={args.maxLength}
        onSubmit={(value) => {
          args.onSubmit(value);
        }}
        onClose={(from: string) => {
          popDialogById(id);
          if (from !== 'submit') args.onCancel();
        }}
      />
    );
  },
  showLoginDialog,
  forceLoginWrapper,
  showDialogBox: (id: string, style: IDialogBoxStyle, content: string): void => {
    if (isIdExist(id)) return;
    console.log(style);
    addDialogComponent(
      id,
      <DialogBox
        position={style.position}
        arrowDirection={style.arrowDirection}
        arrowWidth={style.arrowWidth}
        arrowHeight={style.arrowHeight}
        arrowPadding={style.arrowPadding}
        arrowColor={style.arrowColor}
        content={content}
        onClose={() => popDialogById(id)}
      />
    );
  },
  showFirmwareUpdateDialog: (
    device: IDeviceInfo,
    updateInfo: {
      changelog_en: string;
      changelog_zh: string;
      latestVersion: string;
    },
    onDownload: () => void,
    onInstall: () => void
  ): void => {
    if (isIdExist('update-dialog')) return;
    const { name, model, version } = device;
    const releaseNode =
      i18n.getActiveLang() === 'zh-tw' ? updateInfo.changelog_zh : updateInfo.changelog_en;
    addDialogComponent(
      'update-dialog',
      <FirmwareUpdate
        deviceName={name}
        deviceModel={model}
        currentVersion={version}
        latestVersion={updateInfo.latestVersion}
        releaseNote={releaseNode}
        onDownload={onDownload}
        onInstall={onInstall}
        onClose={() => popDialogById('update-dialog')}
      />
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
        />
      );
    }),
  showLoadingWindow: (): void => {
    const id = 'loading-window';
    if (isIdExist(id)) return;
    addDialogComponent(
      id,
      <div className="loading-background">
        <div className="spinner-roller absolute-center" />
      </div>
    );
  },
  showShapePanel: (onClose: () => void): void => {
    if (isIdExist('shape-panel')) return;
    addDialogComponent(
      'shape-panel',
      <ShapePanel
        onClose={() => {
          onClose();
          popDialogById('shape-panel');
        }}
      />
    );
  },
  showCatridgeSettingPanel: (initData: ChipSettings, inkLevel: number): void => {
    if (isIdExist('catridge-setting')) return;
    addDialogComponent(
      'catridge-setting',
      <CartridgeSettingPanel
        inkLevel={inkLevel}
        initData={initData}
        onClose={() => popDialogById('catridge-setting')}
      />
    );
  },
  showRadioSelectDialog: <T,>({
    id = 'radio-select',
    title,
    options,
    defaultValue = options[0].value,
  }: {
    id?: string;
    title: string;
    options: Array<{ label: string; value: T }>;
    defaultValue?: T;
  }): Promise<T> =>
    new Promise((resolve) => {
      if (isIdExist(id)) {
        return;
      }

      addDialogComponent(
        id,
        <RadioSelectDialog<T>
          title={title}
          options={options}
          defaultValue={defaultValue}
          onOk={(val) => {
            popDialogById(id);
            beamboxPreference.write(id, val);
            resolve(val);
          }}
          onCancel={() => {
            popDialogById(id);
            resolve(null);
          }}
        />
      );
    }),
  showCodeGenerator: (onClose: () => void = () => {}): void => {
    if (isIdExist('code-generator')) return;

    addDialogComponent(
      'code-generator',
      <CodeGenerator
        onClose={() => {
          popDialogById('code-generator');
          onClose();
        }}
      />
    );
  },
  showFluxCreditDialog: (): void => {
    if (isIdExist('flux-id-credit')) return;
    forceLoginWrapper(async () => {
      await getInfo(true);
      if (isIdExist('flux-id-credit')) return;
      addDialogComponent(
        'flux-id-credit',
        <FluxCredit onClose={() => popDialogById('flux-id-credit')} />
      );
    }, true);
  },
  showBoxGen: (onClose: () => void = () => {}): void => {
    if (isIdExist('box-gen')) return;

    addDialogComponent(
      'box-gen',
      <Boxgen
        onClose={() => {
          onClose();
          popDialogById('box-gen');
        }}
      />
    );
  },
  showMyCloud: (onClose: () => void): void => {
    if (isIdExist('my-cloud')) return;
    forceLoginWrapper(() => {
      if (isIdExist('my-cloud')) return;
      addDialogComponent(
        'my-cloud',
        <MyCloud
          onClose={() => {
            onClose();
            popDialogById('my-cloud');
          }}
        />
      );
    }, true);
  },
  saveToCloud: (uuid?: string): Promise<{ fileName: string | null; isCancelled?: boolean }> =>
    new Promise<{ fileName: string | null; isCancelled?: boolean }>((resolve) => {
      addDialogComponent(
        'save-to-cloud',
        <SaveFileModal
          onClose={(fileName: string | null, isCancelled?: boolean) => {
            popDialogById('save-to-cloud');
            resolve({ fileName, isCancelled });
          }}
          uuid={uuid}
        />
      );
    }),
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
      />
    );
  },
  showSocialMedia: (): void => {
    const id = 'social-media';
    if (isIdExist(id)) return;
    addDialogComponent(id, <SocialMediaModal onClose={() => popDialogById(id)} />);
  },
  showImageEditPanel: (onClose: () => void = () => {}): void => {
    if (isIdExist('image-edit-panel')) {
      return;
    }

    const selectedElements = svgCanvas.getSelectedElems();
    if (selectedElements.length !== 1) return;
    const element = selectedElements[0];
    const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');

    addDialogComponent(
      'image-edit-panel',
      <ImageEditPanel
        src={src}
        image={element}
        onClose={() => {
          onClose();
          ObjectPanelController.updateActiveKey(null);
          popDialogById('image-edit-panel');
        }}
      />
    );
  },
};
