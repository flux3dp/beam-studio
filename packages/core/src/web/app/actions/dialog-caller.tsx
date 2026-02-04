import React from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import ObjectPanelController from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelController';
import GoogleFontsPanel from '@core/app/components/beambox/RightPanel/OptionsBlocks/TextOptions/components/GoogleFontsPanel';
import Boxgen from '@core/app/components/boxgen/Boxgen';
import AboutBeamStudio from '@core/app/components/dialogs/AboutBeamStudio';
import AnnouncementPanel from '@core/app/components/dialogs/AnnouncementPanel';
import CartridgeSettingPanel from '@core/app/components/dialogs/CartridgeSettingPanel';
import ChangeLog from '@core/app/components/dialogs/ChangeLog';
import CodeGenerator from '@core/app/components/dialogs/CodeGenerator';
import DeviceSelector from '@core/app/components/dialogs/DeviceSelector';
import DocumentSettings from '@core/app/components/dialogs/DocumentSettings';
import ElementPanel from '@core/app/components/dialogs/ElementPanel/ElementPanel';
import FluxCredit from '@core/app/components/dialogs/FluxCredit';
import FluxIdLogin from '@core/app/components/dialogs/FluxIdLogin';
import FluxPlusWarning from '@core/app/components/dialogs/FluxPlusWarning';
import CropPanel from '@core/app/components/dialogs/image/CropPanel';
import LayerColorConfigPanel from '@core/app/components/dialogs/LayerColorConfig';
import MaterialTestGeneratorPanel from '@core/app/components/dialogs/MaterialTestGeneratorPanel';
import MediaTutorial from '@core/app/components/dialogs/MediaTutorial';
import MyCloud from '@core/app/components/dialogs/myCloud/MyCloud';
import SaveFileModal from '@core/app/components/dialogs/myCloud/SaveFileModal';
import NetworkTestingPanel from '@core/app/components/dialogs/NetworkTestingPanel';
import PreviewHeight from '@core/app/components/dialogs/PreviewHeight';
import ConnectionTest from '@core/app/components/dialogs/promark/ConnectionTest';
import Prompt from '@core/app/components/dialogs/Prompt';
import RadioSelectDialog from '@core/app/components/dialogs/RadioSelectDialog';
import RatingPanel from '@core/app/components/dialogs/RatingPanel';
import SocialMediaModal from '@core/app/components/dialogs/SocialMediaModal';
import SvgNestButtons from '@core/app/components/dialogs/SvgNestButtons';
import ImageEditPanel from '@core/app/components/ImageEditPanel';
import TabPanel from '@core/app/components/TabPanel';
import Tutorial from '@core/app/components/tutorials/Tutorial';
import alertConstants from '@core/app/constants/alert-constants';
import { eventEmitter } from '@core/app/contexts/DialogContext';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import DialogBox from '@core/app/widgets/Dialog-Box';
import InputLightBox from '@core/app/widgets/InputLightbox';
import type { AlertConfigKey } from '@core/helpers/api/alert-config';
import { getCurrentUser, getInfo } from '@core/helpers/api/flux-id';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import versionChecker from '@core/helpers/version-checker';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';
import type { ChipSettings } from '@core/interfaces/Cartridge';
import type { IAnnouncement } from '@core/interfaces/IAnnouncement';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { IDialogBoxStyle, IInputLightBox, InputType, IPrompt } from '@core/interfaces/IDialog';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { IMediaTutorial, ITutorial } from '@core/interfaces/ITutorial';
import type { GlobalPreferenceKey } from '@core/interfaces/Preference';

import StampMakerPanel from '../components/StampMakerPanel';

let svgCanvas: ISVGCanvas;

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
  const response = { isIdExist: false };

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

  addDialogComponent(
    'flux-id-login',
    <FluxIdLogin
      onClose={() => {
        popDialogById('flux-id-login');
        callback?.();
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

      if (user) callback();
      else failCallback?.();
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

const showDeviceSelector = (onSelect: (device: IDeviceInfo | null) => void) => {
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
      caption={args.caption!}
      defaultValue={args.defaultValue}
      message={args.message}
      onCancel={args.onCancel}
      onClose={() => popDialogById(id)}
      onYes={args.onYes!}
    />,
  );
};

export default {
  addDialogComponent,
  clearAllDialogComponents,
  forceLoginWrapper,
  getPreviewHeight: (args: { initValue: number | undefined }): Promise<null | number> =>
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
      const onYes = (val?: string) => resolve(val ?? null);
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
  selectDevice: async (): Promise<IDeviceInfo | null> => {
    const device = await webNeedConnectionWrapper(
      () => new Promise<IDeviceInfo | null>((resolve) => showDeviceSelector(resolve)),
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
  showCartridgeSettingPanel: (initData: ChipSettings, inkLevel: number): void => {
    if (isIdExist('cartridge-setting')) {
      return;
    }

    addDialogComponent(
      'cartridge-setting',
      <CartridgeSettingPanel
        initData={initData}
        inkLevel={inkLevel}
        onClose={() => popDialogById('cartridge-setting')}
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
          callback?.();
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
          caption={args.caption!}
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
  showConnectionTest: async (device: IDeviceInfo): Promise<void> => {
    const vc = versionChecker(swiftrayClient.version);

    if (!vc.meetRequirement('SWIFTRAY_CONNECTION_TEST')) {
      alertCaller.popUp({
        buttonType: alertConstants.INFO,
        caption: i18n.lang.message.wrong_swiftray_version_title,
        id: 'swiftray-version-warning',
        message: i18n.lang.message.wrong_swiftray_version_message.replace('{version}', swiftrayClient.version),
      });

      return;
    }

    await deviceMaster.select(device);

    const res = await checkDeviceStatus(device);

    if (!res) {
      return;
    }

    const id = 'promark-connection-test';

    if (!isIdExist(id)) {
      addDialogComponent(id, <ConnectionTest device={device} onClose={() => popDialogById(id)} />);
    }
  },
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
        image={element as SVGImageElement}
        onClose={() => {
          popDialogById('image-crop');
          ObjectPanelController.updateActiveKey(null);
        }}
        src={src!}
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
  showDxfDpiSelector: (defaultValue: number): Promise<null | number> =>
    new Promise<null | number>((resolve) => {
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
          onYes={(value?: string) => {
            popDialogById('dxf-dpi-select');
            resolve(Number(value));
          }}
        />,
      );
    }),
  showElementPanel: (onClose: () => void): void => {
    const id = 'element-panel';

    if (isIdExist(id)) {
      return;
    }

    addDialogComponent(
      id,
      <ElementPanel
        onClose={() => {
          onClose();
          popDialogById(id);
        }}
      />,
    );
  },
  showFluxCreditDialog: (): void => {
    if (isIdExist('flux-id-credit')) {
      return;
    }

    forceLoginWrapper(async () => {
      await getInfo({ silent: true });

      if (isIdExist('flux-id-credit')) {
        return;
      }

      addDialogComponent('flux-id-credit', <FluxCredit onClose={() => popDialogById('flux-id-credit')} />);
    }, true);
  },
  showGoogleFontsPanel: (onFontSelect: (fontFamily: string) => void): void => {
    const id = 'google-fonts-panel';

    if (isIdExist(id)) {
      return;
    }

    addDialogComponent(
      id,
      <GoogleFontsPanel
        onClose={() => popDialogById(id)}
        onFontSelect={(fontFamily: string) => {
          onFontSelect(fontFamily);
          popDialogById(id);
        }}
        visible={true}
      />,
    );
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
        image={element as SVGImageElement}
        onClose={() => {
          onClose();
          ObjectPanelController.updateActiveKey(null);
          popDialogById('image-edit-panel');
        }}
        src={src!}
      />,
    );
  },
  showInputLightbox: <T extends InputType>(id: string, args: IInputLightBox<T>): void => {
    addDialogComponent(
      id,
      <InputLightBox
        caption={args.caption}
        confirmText={args.confirmText!}
        defaultValue={args.defaultValue!}
        inputHeader={args.inputHeader!}
        maxLength={args.maxLength!}
        onCancel={args.onCancel}
        onClose={() => popDialogById(id)}
        onSubmit={args.onSubmit}
        type={args.type || 'text'}
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
  showMyCloud: (onClose?: () => void): void => {
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
            onClose?.();
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

    addDialogComponent('network-test', <NetworkTestingPanel ip={ip!} onClose={() => popDialogById('network-test')} />);
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
  }): Promise<null | T> =>
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
            useGlobalPreferenceStore.getState().set(id as GlobalPreferenceKey, val as any);
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
  showSocialMedia: (autoPopup?: boolean): void => {
    const id = 'social-media';

    if (isIdExist(id)) {
      return;
    }

    addDialogComponent(id, <SocialMediaModal autoPopup={autoPopup} onClose={() => popDialogById(id)} />);
  },
  showStampMakerPanel: (onClose: () => void = () => {}): void => {
    if (isIdExist('stamp-maker-panel')) {
      return;
    }

    const selectedElements = svgCanvas.getSelectedElems();

    if (selectedElements.length !== 1) {
      return;
    }

    const element = selectedElements[0];
    const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');

    addDialogComponent(
      'stamp-maker-panel',
      <StampMakerPanel
        image={element as SVGImageElement}
        onClose={() => {
          onClose();
          ObjectPanelController.updateActiveKey(null);
          popDialogById('stamp-maker-panel');
        }}
        src={src!}
      />,
    );
  },
  showSvgNestButtons: (): void => {
    if (isIdExist('svg-nest')) {
      return;
    }

    addDialogComponent('svg-nest', <SvgNestButtons onClose={() => popDialogById('svg-nest')} />);
  },
  showTabPanel: (
    { bbox, command, onClose }: { bbox: DOMRect; command?: IBatchCommand; onClose: () => void } = {
      bbox: new DOMRect(0, 0, 0, 0),
      onClose: () => {},
    },
  ): void => {
    if (isIdExist('tab-panel')) {
      return;
    }

    const selectedElements = svgCanvas.getSelectedElems();

    if (selectedElements.length !== 1) {
      return;
    }

    const element = selectedElements[0];

    addDialogComponent(
      'tab-panel',
      <TabPanel
        bbox={bbox}
        command={command}
        element={element}
        onClose={() => {
          onClose();
          ObjectPanelController.updateActiveKey(null);
          popDialogById('tab-panel');
        }}
      />,
    );
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
        end_alert={tutorial.end_alert!}
        hasNextButton={tutorial.hasNextButton!}
        onClose={() => {
          popDialogById(id);
          layerPanelEventEmitter.emit('endTutorial');
          callback();
        }}
      />,
    );
  },
};
