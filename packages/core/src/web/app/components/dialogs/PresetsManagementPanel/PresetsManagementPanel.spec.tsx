/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { forwardRef } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import LayerModule from 'app/constants/layer-module/layer-modules';
import presetHelper from 'helpers/presets/preset-helper';
import { Preset } from 'interfaces/ILayerConfig';

import PresetsManagementPanel from './PresetsManagementPanel';

const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockShowRadioSelectDialog = jest.fn();
const mockPromptDialog = jest.fn();
jest.mock('app/actions/dialog-caller', () => ({
  showRadioSelectDialog: (...args) => mockShowRadioSelectDialog(...args),
  promptDialog: (...args) => mockPromptDialog(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        existing_name: 'existing_name',
        preset_management: {
          title: 'title',
          sure_to_reset: 'sure_to_reset',
          laser: 'laser',
          print: 'print',
          new_preset_name: 'new_preset_name',
          show_all: 'show_all',
          add_new: 'add_new',
          import: 'import',
          export: 'export',
          delete: 'delete',
        },
      },
    },
    popup: {
      select_import_module: 'select_import_module',
    },
  },
}));

const mockUseWorkarea = jest.fn();
jest.mock('helpers/hooks/useWorkarea', () => () => mockUseWorkarea());

const mockAddDialogComponent = jest.fn();
const mockIsIdExist = jest.fn();
const mockPopDialogById = jest.fn();
jest.mock('app/actions/dialog-controller', () => ({
  addDialogComponent: (...args) => mockAddDialogComponent(...args),
  isIdExist: (...args) => mockIsIdExist(...args),
  popDialogById: (...args) => mockPopDialogById(...args),
}));

const mockPostPresetChange = jest.fn();
const mockGetDefaultConfig = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  postPresetChange: (...args) => mockPostPresetChange(...args),
  getDefaultConfig: () => mockGetDefaultConfig(),
}));

jest.mock('./Footer', () => ({ handleSave, handleReset, onClose }: any) => (
  <div>
    MockFooter
    <button id="footer-save" type="button" onClick={handleSave}>
      handleSave
    </button>
    <button id="footer-reset" type="button" onClick={handleReset}>
      handleReset
    </button>
    <button id="footer-close" type="button" onClick={onClose}>
      onClose
    </button>
  </div>
));

jest.mock(
  './LaserInputs',
  () =>
    ({ handleChange, preset, isInch, lengthUnit, maxSpeed, minSpeed }: any) =>
      (
        <div>
          MockLaserInputs
          <p>preset: {JSON.stringify(preset)}</p>
          <p>maxSpeed: {maxSpeed}</p>
          <p>minSpeed: {minSpeed}</p>
          {isInch && <p>isInch</p>}
          <p>lengthUnit: {lengthUnit}</p>
          <input
            data-testid="power"
            onChange={(e) => handleChange('power', parseInt(e.target.value, 10))}
            value={preset.power ?? 15}
          />
          <input
            data-testid="speed"
            onChange={(e) => handleChange('speed', parseInt(e.target.value, 10))}
            value={preset.speed ?? 30}
          />
        </div>
      )
);

jest.mock(
  './PrintingInputs',
  () =>
    ({ handleChange, preset, isInch, lengthUnit, maxSpeed, minSpeed }: any) =>
      (
        <div>
          MocPrintingInputs
          <p>preset: {JSON.stringify(preset)}</p>
          <p>maxSpeed: {maxSpeed}</p>
          <p>minSpeed: {minSpeed}</p>
          {isInch && <p>isInch</p>}
          <p>lengthUnit: {lengthUnit}</p>
          <input
            data-testid="ink"
            onChange={(e) => handleChange('ink', parseInt(e.target.value, 10))}
            value={preset.ink ?? 3}
          />
          <input
            data-testid="multipass"
            onChange={(e) => handleChange('multipass', parseInt(e.target.value, 10))}
            value={preset.multipass ?? 3}
          />
        </div>
      )
);

jest.mock('./PresetList', () =>
  forwardRef<HTMLDivElement, any>(
    ({ displayList, selected, setSelectedPreset, toggleHidePreset }: any, ref) => (
      <div ref={ref}>
        MockPresetList
        {displayList.map((preset: Preset) => (
          <div
            id={preset.key || preset.name}
            data-selected={preset === selected}
            onClick={() => setSelectedPreset(preset)}
            key={preset.key || preset.name}
          >
            {preset.name}
            <button
              id="hide"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleHidePreset(preset);
              }}
            >
              hide
            </button>
          </div>
        ))}
      </div>
    )
  )
);

const mockOnClose = jest.fn();

describe('test PresetsManagementPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    mockUseWorkarea.mockReturnValue('ado1');
    const { baseElement } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />
    );
    expect(baseElement).toMatchSnapshot();
  });

  test('change value', () => {
    mockUseWorkarea.mockReturnValue('ado1');
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { name: 'name1', module: LayerModule.LASER_20W_DIODE },
      { key: 'key2', name: 'name2', module: LayerModule.LASER_20W_DIODE, isDefault: true },
    ]);
    const { getByTestId } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />
    );

    const powerInput = getByTestId('power') as HTMLInputElement;
    fireEvent.change(powerInput, { target: { value: '10' } });
    expect(powerInput.value).toBe('10');

    const speedInput = getByTestId('speed') as HTMLInputElement;
    fireEvent.change(speedInput, { target: { value: '20' } });
    expect(speedInput.value).toBe('20');
  });

  it('should render correctly with print module', () => {
    mockUseWorkarea.mockReturnValue('ado1');
    const { baseElement } = render(
      <PresetsManagementPanel currentModule={LayerModule.PRINTER} onClose={mockOnClose} />
    );
    expect(baseElement).toMatchSnapshot();
  });

  test('import', async () => {
    const mockImportPresets = jest.spyOn(presetHelper, 'importPresets');
    const mockGetAllPresets = jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', name: 'name1', module: LayerModule.LASER_20W_DIODE },
      { key: 'key2', name: 'name2', module: LayerModule.LASER_20W_DIODE },
    ]);
    mockUseWorkarea.mockReturnValue('ado1');
    const { baseElement } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />
    );
    mockImportPresets.mockResolvedValue(true);
    mockGetAllPresets.mockReturnValue([
      { key: 'key1', name: 'name1', module: LayerModule.LASER_20W_DIODE },
      { key: 'key2', name: 'name2', module: LayerModule.LASER_20W_DIODE },
      { key: 'key3', name: 'name3', module: LayerModule.LASER_20W_DIODE },
    ]);
    fireEvent.click(baseElement.querySelector('button[title="import"]'));
    expect(mockImportPresets).toBeCalledTimes(1);
    await waitFor(async () => {
      expect(baseElement.querySelector('#key3')).toBeTruthy();
    });
  });

  test('export', () => {
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', name: 'name1', module: LayerModule.LASER_20W_DIODE },
      { key: 'key2', name: 'name2', module: LayerModule.LASER_20W_DIODE },
    ]);
    const mockExportPresets = jest.spyOn(presetHelper, 'exportPresets');
    mockUseWorkarea.mockReturnValue('ado1');
    const { baseElement, getByTestId } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />
    );
    mockExportPresets.mockReturnValue(null);
    const powerInput = getByTestId('power') as HTMLInputElement;
    fireEvent.change(powerInput, { target: { value: '10' } });
    expect(powerInput.value).toBe('10');
    fireEvent.click(baseElement.querySelector('button[title="export"]'));
    expect(mockExportPresets).toBeCalledTimes(1);
    expect(mockExportPresets).toHaveBeenLastCalledWith([
      { key: 'key1', name: 'name1', module: LayerModule.LASER_20W_DIODE, power: 10 },
      { key: 'key2', name: 'name2', module: LayerModule.LASER_20W_DIODE },
    ]);
  });

  test('delete', async () => {
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', name: 'name1', module: LayerModule.LASER_20W_DIODE },
      { key: 'key2', name: 'name2', module: LayerModule.LASER_20W_DIODE },
    ]);
    mockUseWorkarea.mockReturnValue('ado1');
    const { baseElement, getByText } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />
    );
    fireEvent.click(getByText('delete'));
    expect(baseElement.querySelector('#key1')).toBeFalsy();
  });

  test('save', () => {
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', name: 'name1', module: LayerModule.LASER_20W_DIODE },
      { key: 'key2', name: 'name2', module: LayerModule.LASER_20W_DIODE },
    ]);
    const mockSavePresetList = jest.spyOn(presetHelper, 'savePresetList');
    mockUseWorkarea.mockReturnValue('ado1');
    const { baseElement, getByTestId } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />
    );
    const powerInput = getByTestId('power') as HTMLInputElement;
    fireEvent.change(powerInput, { target: { value: '10' } });
    expect(powerInput.value).toBe('10');
    fireEvent.click(baseElement.querySelector('#footer-save'));
    expect(mockSavePresetList).toBeCalledTimes(1);
    expect(mockSavePresetList).toHaveBeenLastCalledWith([
      { key: 'key1', name: 'name1', module: LayerModule.LASER_20W_DIODE, power: 10 },
      { key: 'key2', name: 'name2', module: LayerModule.LASER_20W_DIODE },
    ]);
    expect(mockPostPresetChange).toBeCalledTimes(1);
    expect(mockOnClose).toBeCalledTimes(1);
  });

  test('reset', () => {
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', name: 'name1', module: LayerModule.LASER_20W_DIODE },
      { key: 'key2', name: 'name2', module: LayerModule.LASER_20W_DIODE },
    ]);
    const mockResetPresetList = jest.spyOn(presetHelper, 'resetPresetList');
    mockUseWorkarea.mockReturnValue('ado1');
    mockPopUp.mockImplementation(({ onConfirm }) => onConfirm());
    const { baseElement } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />
    );
    fireEvent.click(baseElement.querySelector('#footer-reset'));
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toHaveBeenLastCalledWith({
      type: 'WARNING',
      buttonType: 'CONFIRM_CANCEL',
      message: 'sure_to_reset',
      onConfirm: expect.any(Function),
    });
    expect(mockResetPresetList).toBeCalledTimes(1);
    expect(mockPostPresetChange).toBeCalledTimes(1);
    expect(mockOnClose).toBeCalledTimes(1);
  });

  test('close', () => {
    mockUseWorkarea.mockReturnValue('ado1');
    const { baseElement } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />
    );
    fireEvent.click(baseElement.querySelector('#footer-close'));
    expect(mockPostPresetChange).not.toBeCalled();
    expect(mockOnClose).toBeCalledTimes(1);
  });

  test('add preset', async () => {
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', name: 'name1', module: LayerModule.LASER_20W_DIODE },
      { key: 'key2', name: 'name2', module: LayerModule.LASER_20W_DIODE },
    ]);
    mockUseWorkarea.mockReturnValue('ado1');
    const { baseElement, getByText } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />
    );
    mockShowRadioSelectDialog.mockImplementation(({ options }) => options[0].value);
    mockPromptDialog.mockImplementation(({ onYes }) => onYes('new_preset_name'));
    fireEvent.click(getByText('add_new'));
    await waitFor(() => {
      expect(baseElement.querySelector('#new_preset_name')).toBeTruthy();
    });
  });
});
