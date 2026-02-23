import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

const mockGetModuleOffsets = jest.fn();
const mockUpdateModuleOffsets = jest.fn();

jest.mock('@core/helpers/device/moduleOffsets', () => ({
  getModuleOffsets: (...args) => mockGetModuleOffsets(...args),
  updateModuleOffsets: (...args) => mockUpdateModuleOffsets(...args),
}));

const mockGetCurrentDevice = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  get currentDevice() {
    return mockGetCurrentDevice();
  },
}));

const mockGetModulesTranslations = jest.fn();

jest.mock('@core/helpers/layer-module/layer-module-helper', () => ({
  getModulesTranslations: (...args) => mockGetModulesTranslations(...args),
}));

const mockOnClose = jest.fn();

import OffsetSettings from './OffsetSettings';

describe('test OffsetSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentDevice.mockReturnValue({
      info: { model: 'ado1' },
    });
    mockGetModuleOffsets.mockResolvedValue([10.5, -5.2]);
    mockUpdateModuleOffsets.mockResolvedValue(true);
    mockGetModulesTranslations.mockReturnValue({
      [LayerModule.LASER_10W_DIODE]: '10W Diode Laser',
      [LayerModule.LASER_UNIVERSAL]: 'Universal Laser',
      [LayerModule.PRINTER]: 'Printer Module',
    });
  });

  it('should render correctly with printer module', async () => {
    const { baseElement } = render(<OffsetSettings layerModule={LayerModule.PRINTER} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockGetModuleOffsets).toHaveBeenCalledTimes(1);
    });

    expect(mockGetModuleOffsets).toHaveBeenCalledWith({
      isRelative: true,
      module: LayerModule.PRINTER,
      useCache: false,
      workarea: 'ado1',
    });

    // Wait for the offset values to be loaded and displayed
    const inputs = baseElement.querySelectorAll('input');

    await waitFor(() => {
      expect(inputs[0]).toHaveValue('10.5');
      expect(inputs[1]).toHaveValue('-5.2');
    });

    expect(baseElement).toMatchSnapshot();
  });

  it('should load and display initial offset values', async () => {
    const { baseElement } = render(<OffsetSettings layerModule={LayerModule.PRINTER} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockGetModuleOffsets).toHaveBeenCalledTimes(1);
    });

    // Check that the UnitInput components receive the correct values
    const inputs = baseElement.querySelectorAll('input');

    await waitFor(() => {
      expect(inputs[0]).toHaveValue('10.5');
      expect(inputs[1]).toHaveValue('-5.2');
    });
  });

  it('should update offset values on input change', async () => {
    const { baseElement } = render(<OffsetSettings layerModule={LayerModule.PRINTER} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockGetModuleOffsets).toHaveBeenCalledTimes(1);
    });

    const inputs = baseElement.querySelectorAll('input');

    // Change X value
    fireEvent.change(inputs[0], { target: { value: '15.5' } });

    // Change Y value
    fireEvent.change(inputs[1], { target: { value: '10.0' } });

    // Values should be updated
    await waitFor(() => {
      expect(inputs[0]).toHaveValue('15.5');
      expect(inputs[1]).toHaveValue('10');
    });
  });

  it('should save offset settings successfully', async () => {
    mockUpdateModuleOffsets.mockResolvedValue(true);

    const { baseElement, getByText } = render(
      <OffsetSettings layerModule={LayerModule.PRINTER} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(mockGetModuleOffsets).toHaveBeenCalledTimes(1);
    });

    const inputs = baseElement.querySelectorAll('input');

    // Change values
    fireEvent.change(inputs[0], { target: { value: '20' } });
    fireEvent.change(inputs[1], { target: { value: '15' } });

    // Click save button
    const saveButton = getByText('Save');

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(1);
    });

    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
      id: 'saving',
      message: 'Saving...',
    });

    await waitFor(() => {
      expect(mockUpdateModuleOffsets).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateModuleOffsets).toHaveBeenCalledWith([20, 15], {
      isRelative: true,
      module: LayerModule.PRINTER,
      shouldWrite: true,
      workarea: 'ado1',
    });

    await waitFor(() => {
      expect(mockPopById).toHaveBeenCalledTimes(1);
    });

    expect(mockPopById).toHaveBeenCalledWith('saving');

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    expect(mockPopUpError).not.toHaveBeenCalled();
  });

  it('should show error when save fails', async () => {
    mockUpdateModuleOffsets.mockResolvedValue(false);

    const { getByText } = render(<OffsetSettings layerModule={LayerModule.PRINTER} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockGetModuleOffsets).toHaveBeenCalledTimes(1);
    });

    // Click save button
    const saveButton = getByText('Save');

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateModuleOffsets).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockPopUpError).toHaveBeenCalledTimes(1);
    });

    expect(mockPopUpError).toHaveBeenCalledWith({
      message: 'Failed to save offset settings.',
    });

    expect(mockPopById).toHaveBeenCalledWith('saving');
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const { getByText } = render(<OffsetSettings layerModule={LayerModule.PRINTER} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockGetModuleOffsets).toHaveBeenCalledTimes(1);
    });

    const cancelButton = getByText('Cancel');

    expect(mockOnClose).not.toHaveBeenCalled();
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display description with module name', async () => {
    const { baseElement } = render(<OffsetSettings layerModule={LayerModule.PRINTER} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockGetModuleOffsets).toHaveBeenCalledTimes(1);
    });

    // Check that description text is present in the modal
    expect(baseElement.textContent).toContain('Printer Module');
  });

  it('should close progress on save error', async () => {
    mockUpdateModuleOffsets.mockReturnValue(false);

    const { getByText } = render(<OffsetSettings layerModule={LayerModule.PRINTER} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockGetModuleOffsets).toHaveBeenCalledTimes(1);
    });

    const saveButton = getByText('Save');

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateModuleOffsets).toHaveBeenCalledTimes(1);
    });

    // Progress should be closed even when an error occurs
    await waitFor(() => {
      expect(mockPopById).toHaveBeenCalledWith('saving');
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should display CO2 laser and module name in illustration legend', async () => {
    const { baseElement } = render(<OffsetSettings layerModule={LayerModule.PRINTER} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockGetModuleOffsets).toHaveBeenCalledTimes(1);
    });

    // Check that both CO2 laser and module name appear in the legend
    expect(baseElement.textContent).toContain('CO2');
    expect(baseElement.textContent).toContain('Universal Laser');
    expect(baseElement.textContent).toContain('Printer Module');
  });
});
