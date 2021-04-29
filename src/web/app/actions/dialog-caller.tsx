/* eslint-disable no-console */
import Modal from 'app/widgets/Modal';
import DialogBox from 'app/widgets/Dialog-Box';
import InputLightBox from 'app/widgets/Input-Lightbox';
import FluxIdLogin from 'app/views/FluxIdLogin';
import ChangeLogDialog from 'app/views/dialogs/Change-Log';
import ConfirmPrompt from 'app/views/dialogs/Confirm-Prompt';
import DeviceSelector from 'app/views/dialogs/DeviceSelector';
import { DialogContextHelper } from 'app/views/dialogs/Dialog';
import Prompt from 'app/views/dialogs/Prompt';
import AboutBeamStudio from 'app/views/beambox/About-Beam-Studio';
import DocumentPanel from 'app/views/beambox/Document-Panels/Document-Panel';
import DxfDpiSelector from 'app/views/beambox/DxfDpiSelector';
import LayerColorConfigPanel from 'app/views/beambox/Layer-Color-Config';
import NetworkTestingPanel from 'app/views/beambox/Network-Testing-Panel';
import NounProjectPanel from 'app/views/beambox/Noun-Project-Panel';
import PhotoEditPanel, { PhotoEditMode } from 'app/views/beambox/Photo-Edit-Panel';
import SvgNestButtons from 'app/views/beambox/Svg-Nest-Buttons';
import { Tutorial } from 'app/views/tutorials/Tutorial';
import { IPrompt, IDialogBoxStyle, IInputLightBox } from 'interfaces/IDialog';
import { ITutorial } from 'interfaces/ITutorial';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IDeviceInfo } from 'interfaces/IDevice';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const React = requireNode('react');
const addDialogComponent = (id: string, component: Element): void => {
  if (!DialogContextHelper.context) {
    console.log('Dialog context not loaded Yet');
  } else {
    DialogContextHelper.context.addDialogComponent(id, component);
  }
};

const isIdExist = (id: string): boolean => {
  if (!DialogContextHelper.context) {
    console.log('Dialog context not loaded Yet');
    return false;
  }
  const isExist = DialogContextHelper.context.isIdExist(id);
  return isExist;
};

const popDialogById = (id: string): void => {
  if (!DialogContextHelper.context) {
    console.log('Dialog context not loaded Yet');
  } else {
    DialogContextHelper.context.popDialogById(id);
  }
};

let promptIndex = 0;

const showDeviceSelector = (onSelect) => {
  addDialogComponent('device-selector',
    <DeviceSelector
      onSelect={onSelect}
      onClose={() => popDialogById('device-selector')}
    />);
};

export default {
  addDialogComponent,
  isIdExist,
  popDialogById,
  selectDevice: (): Promise<IDeviceInfo> => new Promise<IDeviceInfo>((resolve) => {
    showDeviceSelector(resolve);
  }),
  showAboutBeamStudio: (): void => {
    if (isIdExist('about-bs')) return;
    addDialogComponent('about-bs',
      <AboutBeamStudio
        onClose={() => popDialogById('about-bs')}
      />);
  },
  showDocumentSettings: (): void => {
    if (isIdExist('docu-setting')) return;
    const unmount = () => popDialogById('docu-setting');
    addDialogComponent('docu-setting',
      <Modal>
        <DocumentPanel
          unmount={unmount}
        />
      </Modal>);
  },
  showDxfDpiSelector: (defaultValue: number): Promise<number> => new Promise<number>((resolve) => {
    addDialogComponent('dxf-dpi-select',
      <Modal>
        <DxfDpiSelector
          defaultDpiValue={defaultValue}
          onSubmit={(val: number) => {
            popDialogById('dxf-dpi-select');
            resolve(val);
          }}
          onCancel={() => {
            popDialogById('dxf-dpi-select');
            resolve(null);
          }}
        />
      </Modal>);
  }),
  showNetworkTestingPanel: (ip?: string): void => {
    if (isIdExist('network-test')) return;
    addDialogComponent('network-test',
      <NetworkTestingPanel
        ip={ip}
        onClose={() => popDialogById('network-test')}
      />);
  },
  showNounProjectPanel: (): void => {
    if (isIdExist('noun-project')) return;
    addDialogComponent('noun-project',
      <NounProjectPanel
        onClose={() => popDialogById('noun-project')}
      />);
  },
  showPhotoEditPanel: (mode: PhotoEditMode): void => {
    if (isIdExist('photo-edit')) return;
    const selectedElements = svgCanvas.getSelectedElems();
    let len = selectedElements.length;
    for (let i = 0; i < selectedElements.length; i += 1) {
      if (!selectedElements[i]) {
        len = i;
        break;
      }
    }
    if (len > 1) {
      return;
    }
    const element = selectedElements[0];
    const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');
    addDialogComponent('photo-edit',
      <PhotoEditPanel
        mode={mode}
        element={element}
        src={src}
        unmount={() => popDialogById('photo-edit')}
      />);
  },
  showLayerColorConfig: (): void => {
    if (isIdExist('layer-color-config')) return;
    addDialogComponent('layer-color-config',
      <LayerColorConfigPanel
        onClose={() => popDialogById('layer-color-config')}
      />);
  },
  showSvgNestButtons: (): void => {
    if (isIdExist('svg-nest')) return;
    addDialogComponent('svg-nest',
      <SvgNestButtons
        onClose={() => popDialogById('svg-nest')}
      />);
  },
  showTutorial: (tutorial: ITutorial, callback: () => void): void => {
    const { id } = tutorial;
    if (isIdExist(id)) return;
    svgCanvas.clearSelection();
    addDialogComponent(id,
      <Tutorial
        hasNextButton={tutorial.hasNextButton}
        end_alert={tutorial.end_alert}
        dialogStylesAndContents={tutorial.dialogStylesAndContents}
        onClose={() => {
          popDialogById(id);
          callback();
        }}
      />);
  },
  promptDialog: (args: IPrompt): void => {
    const id = `prompt-${promptIndex}`;
    promptIndex = (promptIndex + 1) % 10000;
    addDialogComponent(id,
      <Prompt
        buttons={args.buttons}
        caption={args.caption}
        defaultValue={args.defaultValue}
        onYes={args.onYes}
        onNo={args.onNo}
        onCancel={args.onCancel}
        closeOnBackgroundClick={args.closeOnBackgroundClick}
        onClose={() => popDialogById(id)}
      />);
  },
  showConfirmPromptDialog: (
    args: { caption?: string, message?: string, confirmValue?: string },
  ): Promise<boolean> => new Promise((resolve) => {
    const id = `prompt-${promptIndex}`;
    promptIndex = (promptIndex + 1) % 10000;
    addDialogComponent(id,
      <ConfirmPrompt
        caption={args.caption}
        message={args.message}
        confirmValue={args.confirmValue}
        onConfirmed={() => resolve(true)}
        onCanceled={() => resolve(false)}
        onClose={() => popDialogById(id)}
      />);
  }),
  showChangLog: (args: { callback?: () => void } = {}): void => {
    if (isIdExist('change-log')) return;
    const { callback } = args;
    addDialogComponent('change-log',
      <ChangeLogDialog
        onClose={() => {
          popDialogById('change-log');
          if (callback) callback();
        }}
      />);
  },
  showInputLightbox: (id: string, args: IInputLightBox): void => {
    addDialogComponent(id,
      <InputLightBox
        isOpen
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
      />);
  },
  showLoginDialog: (callback?: () => void): void => {
    if (isIdExist('flux-id-login')) return;
    addDialogComponent('flux-id-login',
      <FluxIdLogin
        onClose={() => {
          popDialogById('flux-id-login');
          if (callback) callback();
        }}
      />);
  },
  showDialogBox: (id: string, style: IDialogBoxStyle, content: string | Element): void => {
    if (isIdExist(id)) return;
    console.log(style);
    addDialogComponent(id,
      <DialogBox
        position={style.position}
        arrowDirection={style.arrowDirection}
        arrowWidth={style.arrowWidth}
        arrowHeight={style.arrowHeight}
        arrowPadding={style.arrowPadding}
        arrowColor={style.arrowColor}
        content={content}
        onClose={() => popDialogById(id)}
      />);
  },
  showLoadingWindow: (): void => {
    const id = 'loading-window';
    if (isIdExist(id)) return;
    addDialogComponent(id,
      <div className="loading-background">
        <div className="spinner-roller absolute-center" />
      </div>);
  },
};
