import React, { forwardRef } from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import * as presetHelper from '@core/helpers/presets/preset-helper';
import type { Preset } from '@core/interfaces/ILayerConfig';

import PresetsManagementPanel from './PresetsManagementPanel';
import i18n from '@mocks/@core/helpers/i18n';

const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockShowRadioSelectDialog = jest.fn();
const mockPromptDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  promptDialog: (...args) => mockPromptDialog(...args),
  showRadioSelectDialog: (...args) => mockShowRadioSelectDialog(...args),
}));

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => () => mockUseWorkarea());

const mockAddDialogComponent = jest.fn();
const mockIsIdExist = jest.fn();
const mockPopDialogById = jest.fn();

jest.mock('@core/app/actions/dialog-controller', () => ({
  addDialogComponent: (...args) => mockAddDialogComponent(...args),
  isIdExist: (...args) => mockIsIdExist(...args),
  popDialogById: (...args) => mockPopDialogById(...args),
}));

const mockPostPresetChange = jest.fn();
const mockGetDefaultConfig = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getDefaultConfig: () => mockGetDefaultConfig(),
  postPresetChange: (...args) => mockPostPresetChange(...args),
}));

jest.mock('./Footer', () => ({ handleReset, handleSave, onClose }: any) => (
  <div>
    MockFooter
    <button id="footer-save" onClick={handleSave} type="button">
      handleSave
    </button>
    <button id="footer-reset" onClick={handleReset} type="button">
      handleReset
    </button>
    <button id="footer-close" onClick={onClose} type="button">
      onClose
    </button>
  </div>
));

jest.mock('./LaserInputs', () => ({ handleChange, isInch, lengthUnit, maxSpeed, minSpeed, preset }: any) => (
  <div>
    MockLaserInputs
    <p>preset: {JSON.stringify(preset)}</p>
    <p>maxSpeed: {maxSpeed}</p>
    <p>minSpeed: {minSpeed}</p>
    {isInch && <p>isInch</p>}
    <p>lengthUnit: {lengthUnit}</p>
    <input
      data-testid="power"
      onChange={(e) => handleChange('power', Number.parseInt(e.target.value, 10))}
      value={preset.power ?? 15}
    />
    <input
      data-testid="speed"
      onChange={(e) => handleChange('speed', Number.parseInt(e.target.value, 10))}
      value={preset.speed ?? 30}
    />
  </div>
));

jest.mock('./PrintingInputs', () => ({ handleChange, isInch, lengthUnit, maxSpeed, minSpeed, preset }: any) => (
  <div>
    MocPrintingInputs
    <p>preset: {JSON.stringify(preset)}</p>
    <p>maxSpeed: {maxSpeed}</p>
    <p>minSpeed: {minSpeed}</p>
    {isInch && <p>isInch</p>}
    <p>lengthUnit: {lengthUnit}</p>
    <input
      data-testid="ink"
      onChange={(e) => handleChange('ink', Number.parseInt(e.target.value, 10))}
      value={preset.ink ?? 3}
    />
    <input
      data-testid="multipass"
      onChange={(e) => handleChange('multipass', Number.parseInt(e.target.value, 10))}
      value={preset.multipass ?? 3}
    />
  </div>
));

jest.mock('./PresetList', () =>
  forwardRef<HTMLDivElement, any>(({ displayList, selected, setSelectedPreset, toggleHidePreset }: any, ref) => (
    <div ref={ref}>
      MockPresetList
      {displayList.map((preset: Preset) => (
        <div
          data-selected={preset === selected}
          id={preset.key || preset.name}
          key={preset.key || preset.name}
          onClick={() => setSelectedPreset(preset)}
        >
          {preset.name}
          <button
            id="hide"
            onClick={(e) => {
              e.stopPropagation();
              toggleHidePreset(preset);
            }}
            type="button"
          >
            hide
          </button>
        </div>
      ))}
    </div>
  )),
);

const mockOnClose = jest.fn();

describe('test PresetsManagementPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    mockUseWorkarea.mockReturnValue('ado1');

    const { baseElement } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />,
    );

    expect(baseElement).toMatchSnapshot();
  });

  test('change value', () => {
    mockUseWorkarea.mockReturnValue('ado1');
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { module: LayerModule.LASER_20W_DIODE, name: 'name1' },
      { isDefault: true, key: 'key2', module: LayerModule.LASER_20W_DIODE, name: 'name2' },
    ]);

    const { getByTestId } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />,
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
      <PresetsManagementPanel currentModule={LayerModule.PRINTER} onClose={mockOnClose} />,
    );

    expect(baseElement).toMatchSnapshot();
  });

  test('import', async () => {
    const mockImportPresets = jest.spyOn(presetHelper, 'importPresets');
    const mockGetAllPresets = jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', module: LayerModule.LASER_20W_DIODE, name: 'name1' },
      { key: 'key2', module: LayerModule.LASER_20W_DIODE, name: 'name2' },
    ]);

    mockUseWorkarea.mockReturnValue('ado1');

    const { baseElement } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />,
    );

    mockImportPresets.mockResolvedValue(true);
    mockGetAllPresets.mockReturnValue([
      { key: 'key1', module: LayerModule.LASER_20W_DIODE, name: 'name1' },
      { key: 'key2', module: LayerModule.LASER_20W_DIODE, name: 'name2' },
      { key: 'key3', module: LayerModule.LASER_20W_DIODE, name: 'name3' },
    ]);
    fireEvent.click(baseElement.querySelector('button[title="Import"]'));
    expect(mockImportPresets).toHaveBeenCalledTimes(1);
    await waitFor(async () => {
      expect(baseElement.querySelector('#key3')).toBeTruthy();
    });
  });

  test('export', () => {
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', module: LayerModule.LASER_20W_DIODE, name: 'name1' },
      { key: 'key2', module: LayerModule.LASER_20W_DIODE, name: 'name2' },
    ]);

    const mockExportPresets = jest.spyOn(presetHelper, 'exportPresets');

    mockUseWorkarea.mockReturnValue('ado1');

    const { baseElement, getByTestId } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />,
    );

    mockExportPresets.mockReturnValue(null);

    const powerInput = getByTestId('power') as HTMLInputElement;

    fireEvent.change(powerInput, { target: { value: '10' } });
    expect(powerInput.value).toBe('10');
    fireEvent.click(baseElement.querySelector('button[title="Export"]'));
    expect(mockExportPresets).toHaveBeenCalledTimes(1);
    expect(mockExportPresets).toHaveBeenLastCalledWith([
      { key: 'key1', module: LayerModule.LASER_20W_DIODE, name: 'name1', power: 10 },
      { key: 'key2', module: LayerModule.LASER_20W_DIODE, name: 'name2' },
    ]);
  });

  test('delete', async () => {
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', module: LayerModule.LASER_20W_DIODE, name: 'name1' },
      { key: 'key2', module: LayerModule.LASER_20W_DIODE, name: 'name2' },
    ]);
    mockUseWorkarea.mockReturnValue('ado1');

    const { baseElement, getByText } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />,
    );

    fireEvent.click(getByText('Delete'));
    expect(baseElement.querySelector('#key1')).toBeFalsy();
  });

  test('save', () => {
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', module: LayerModule.LASER_20W_DIODE, name: 'name1' },
      { key: 'key2', module: LayerModule.LASER_20W_DIODE, name: 'name2' },
    ]);

    const mockSavePresetList = jest.spyOn(presetHelper, 'savePresetList');

    mockUseWorkarea.mockReturnValue('ado1');

    const { baseElement, getByTestId } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />,
    );
    const powerInput = getByTestId('power') as HTMLInputElement;

    fireEvent.change(powerInput, { target: { value: '10' } });
    expect(powerInput.value).toBe('10');
    fireEvent.click(baseElement.querySelector('#footer-save'));
    expect(mockSavePresetList).toHaveBeenCalledTimes(1);
    expect(mockSavePresetList).toHaveBeenLastCalledWith([
      { key: 'key1', module: LayerModule.LASER_20W_DIODE, name: 'name1', power: 10 },
      { key: 'key2', module: LayerModule.LASER_20W_DIODE, name: 'name2' },
    ]);
    expect(mockPostPresetChange).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('reset', () => {
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', module: LayerModule.LASER_20W_DIODE, name: 'name1' },
      { key: 'key2', module: LayerModule.LASER_20W_DIODE, name: 'name2' },
    ]);

    const mockResetPresetList = jest.spyOn(presetHelper, 'resetPresetList');

    mockUseWorkarea.mockReturnValue('ado1');
    mockPopUp.mockImplementation(({ onConfirm }) => onConfirm());

    const { baseElement } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />,
    );

    fireEvent.click(baseElement.querySelector('#footer-reset'));
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenLastCalledWith({
      buttonType: 'CONFIRM_CANCEL',
      message: i18n.lang.beambox.right_panel.laser_panel.preset_management.sure_to_reset,
      onConfirm: expect.any(Function),
      type: 'WARNING',
    });
    expect(mockResetPresetList).toHaveBeenCalledTimes(1);
    expect(mockPostPresetChange).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('close', () => {
    mockUseWorkarea.mockReturnValue('ado1');

    const { baseElement } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />,
    );

    fireEvent.click(baseElement.querySelector('#footer-close'));
    expect(mockPostPresetChange).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('add preset', async () => {
    jest.spyOn(presetHelper, 'getAllPresets').mockReturnValue([
      { key: 'key1', module: LayerModule.LASER_20W_DIODE, name: 'name1' },
      { key: 'key2', module: LayerModule.LASER_20W_DIODE, name: 'name2' },
    ]);
    mockUseWorkarea.mockReturnValue('ado1');

    const { baseElement, getByText } = render(
      <PresetsManagementPanel currentModule={LayerModule.LASER_20W_DIODE} onClose={mockOnClose} />,
    );

    mockShowRadioSelectDialog.mockImplementation(({ options }) => options[0].value);
    mockPromptDialog.mockImplementation(({ onYes }) => onYes('new_preset_name'));
    fireEvent.click(getByText(i18n.lang.beambox.right_panel.laser_panel.preset_management.add_new));
    await waitFor(() => {
      expect(baseElement.querySelector('#new_preset_name')).toBeTruthy();
    });
  });
});
