import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LaserType } from '@core/app/constants/promark-constants';

import DevControlBlock from './DevControlBlock';

const mockAdjustZAxis = jest.fn();
const mockAdjustAAxis = jest.fn();
const mockDoCalibration = jest.fn();
const mockGo = jest.fn();
const mockStop = jest.fn();
const mockWaitTillStatusPredicate = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  adjustAAxis: (...args) => mockAdjustAAxis(...args),
  adjustZAxis: (...args) => mockAdjustZAxis(...args),
  doCalibration: (...args) => mockDoCalibration(...args),
  go: (...args) => mockGo(...args),
  stop: (...args) => mockStop(...args),
  waitTillStatusPredicate: (...args) => mockWaitTillStatusPredicate(...args),
}));

const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockGetPromptValue = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  getPromptValue: (...args) => mockGetPromptValue(...args),
}));

const mockWriteFileDialog = jest.fn();

jest.mock('@core/implementations/dialog', () => ({
  writeFileDialog: (...args) => mockWriteFileDialog(...args),
}));

const mockGenerateFactoryTestCard = jest.fn();
const mockGetFactoryTestCardName = jest.fn();

jest.mock('@core/helpers/device/promark/factory-test-card', () => ({
  generateFactoryTestCard: (...args) => mockGenerateFactoryTestCard(...args),
  getFactoryTestCardName: (...args) => mockGetFactoryTestCardName(...args),
}));

const readBlob = (blob: Blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });

const mockApplyParameters = jest.fn();
const mockSetGalvoParameters = jest.fn();
const mockStopPreview = jest.fn();

const galvoParameters = {
  x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
  y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
};

const field = { angle: 1, offsetX: 2, offsetY: 3 };
const redDot = { offsetX: 0.5, offsetY: -0.5, scaleX: 1.01, scaleY: 0.99 };

const renderBlock = (serial = 'CARD1234') =>
  render(
    <DevControlBlock
      applyParameters={mockApplyParameters}
      field={field}
      galvoParameters={galvoParameters}
      info={{ laserType: LaserType.MOPA, watt: 60 }}
      redDot={redDot}
      serial={serial}
      setGalvoParameters={mockSetGalvoParameters}
      stopPreview={mockStopPreview}
      width={110}
    />,
  );

describe('test DevControlBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show the card serial with a copy button', () => {
    const { getByRole, getByTestId } = renderBlock();

    expect(getByTestId('card-serial')).toHaveTextContent('CARD1234');
    expect(getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should show a dash without a copy button when there is no serial', () => {
    const { getByTestId, queryByRole } = renderBlock('');

    expect(getByTestId('card-serial')).toHaveTextContent('-');
    expect(queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });

  it('should move the z axis and release the buttons after the move', async () => {
    const { getByTestId } = renderBlock();

    await act(async () => fireEvent.click(getByTestId('dev-z-positive')));
    expect(mockStopPreview).toHaveBeenCalledTimes(1);
    expect(mockAdjustZAxis).toHaveBeenCalledWith(1);
    expect(getByTestId('dev-a-positive')).toBeDisabled();
    expect(getByTestId('dev-z-stop')).not.toBeDisabled();
    expect(getByTestId('dev-a-stop')).toBeDisabled();

    act(() => jest.runAllTimers());
    expect(getByTestId('dev-a-positive')).not.toBeDisabled();
    expect(getByTestId('dev-z-stop')).toBeDisabled();
  });

  it('should move the a axis backwards and stop it', async () => {
    const { getByTestId } = renderBlock();

    await act(async () => fireEvent.click(getByTestId('dev-a-negative')));
    expect(mockAdjustAAxis).toHaveBeenCalledWith(-1);
    expect(mockAdjustZAxis).not.toHaveBeenCalled();

    await act(async () => fireEvent.click(getByTestId('dev-a-stop')));
    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(mockWaitTillStatusPredicate).toHaveBeenCalledTimes(1);
    expect(getByTestId('dev-a-stop')).toBeDisabled();
  });

  it('should apply the edited laser parameters before firing a pulse', async () => {
    const { getByTestId } = renderBlock();

    await act(async () => fireEvent.click(getByTestId('dev-pulse-fire')));
    expect(mockStopPreview).toHaveBeenCalledTimes(1);
    expect(mockApplyParameters).toHaveBeenCalledTimes(1);
    expect(mockApplyParameters).toHaveBeenCalledWith(false);
    expect(mockApplyParameters.mock.invocationCallOrder[0]).toBeLessThan(mockDoCalibration.mock.invocationCallOrder[0]);

    const { blob } = mockDoCalibration.mock.calls[0][0];

    expect(await readBlob(blob)).toBe(
      'M104\nM5\nG90\nW110\nM3S0\nQ40\nP500\nT100\nG1F240000X54.9Y54.9S0\nG1F240000X55Y55S0\nS500\nT0\nM2\n',
    );
  });

  it('should move the galvo with the red light and the red dot parameters, then fire there', async () => {
    const { getByTestId } = renderBlock();

    fireEvent.change(getByTestId('dev-move-x'), { target: { value: '10' } });
    fireEvent.blur(getByTestId('dev-move-x'));
    await act(async () => fireEvent.click(getByTestId('dev-move-go')));
    expect(mockStopPreview).toHaveBeenCalledTimes(1);
    expect(mockApplyParameters).toHaveBeenCalledWith(true);
    expect(mockApplyParameters.mock.invocationCallOrder[0]).toBeLessThan(mockGo.mock.invocationCallOrder[0]);
    expect(await readBlob(mockGo.mock.calls[0][0])).toBe(
      'M103\nM5\nG90\nW110\nM3S0\nG1F240000X10.1Y54.9S0\nG1F240000X10Y55S0\nM2\n',
    );

    await act(async () => fireEvent.click(getByTestId('dev-pulse-fire')));
    expect(mockApplyParameters).toHaveBeenLastCalledWith(false);
    expect(await readBlob(mockDoCalibration.mock.calls[0][0].blob)).toContain('G1F240000X10Y55S0');
  });

  it('should link the nine reference points with the move position', () => {
    const { getByTestId } = renderBlock();

    // starts at the centre
    expect(getByTestId('dev-move-point-4')).toBeChecked();

    fireEvent.click(getByTestId('dev-move-point-2'));
    expect(getByTestId('dev-move-x')).toHaveValue('110');
    expect(getByTestId('dev-move-y')).toHaveValue('0');
    expect(getByTestId('dev-move-point-4')).not.toBeChecked();

    // a position off the points selects none of them
    fireEvent.change(getByTestId('dev-move-x'), { target: { value: '10' } });
    fireEvent.blur(getByTestId('dev-move-x'));
    expect(getByTestId('dev-move-point-2')).not.toBeChecked();

    // typing a point's coordinates selects it
    fireEvent.change(getByTestId('dev-move-y'), { target: { value: '110' } });
    fireEvent.blur(getByTestId('dev-move-y'));
    fireEvent.change(getByTestId('dev-move-x'), { target: { value: '0' } });
    fireEvent.blur(getByTestId('dev-move-x'));
    expect(getByTestId('dev-move-point-6')).toBeChecked();
  });

  it('should fire a UV pulse at the frequency its power stands for', async () => {
    const { getByTestId } = render(
      <DevControlBlock
        applyParameters={mockApplyParameters}
        field={field}
        galvoParameters={galvoParameters}
        info={{ laserType: LaserType.UV, watt: 5 }}
        redDot={redDot}
        serial="CARD1234"
        setGalvoParameters={mockSetGalvoParameters}
        stopPreview={mockStopPreview}
        width={70}
      />,
    );

    fireEvent.change(getByTestId('dev-pulse-power'), { target: { value: '15.6' } });
    fireEvent.blur(getByTestId('dev-pulse-power'));
    await act(async () => fireEvent.click(getByTestId('dev-pulse-fire')));

    const task = (await readBlob(mockDoCalibration.mock.calls[0][0].blob)) as string;

    expect(task).toMatch(/\nQ19\d(\.\d+)?\nP13\n/);
    expect(task).not.toMatch(/\nQ([0-3]\d|40)\n/);
  });

  it('should stop a moving axis when the block is closed', async () => {
    const { getByTestId, unmount } = renderBlock();

    await act(async () => fireEvent.click(getByTestId('dev-z-positive')));
    unmount();
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  describe('closing the dialog while a command is still on its way', () => {
    const deferStopPreview = () => {
      let resolve: () => void = () => {};

      mockStopPreview.mockReturnValueOnce(
        new Promise<void>((r) => {
          resolve = r;
        }),
      );

      return () => resolve();
    };

    it('should not start an axis move after the dialog closed', async () => {
      const finishStopPreview = deferStopPreview();
      const { getByTestId, unmount } = renderBlock();

      await act(async () => fireEvent.click(getByTestId('dev-z-positive')));
      unmount();
      await act(async () => finishStopPreview());
      expect(mockAdjustZAxis).not.toHaveBeenCalled();
    });

    it('should stop again when the dialog closed while the move was being sent', async () => {
      let sent: () => void = () => {};

      mockAdjustAAxis.mockReturnValueOnce(
        new Promise<void>((r) => {
          sent = r;
        }),
      );

      const { getByTestId, unmount } = renderBlock();

      await act(async () => fireEvent.click(getByTestId('dev-a-positive')));
      unmount();
      expect(mockStop).toHaveBeenCalledTimes(1);
      await act(async () => sent());
      // the cleanup's stop may have reached the machine before the move did
      expect(mockStop).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['dev-move-go', mockGo],
      ['dev-pulse-fire', mockDoCalibration],
    ])('should not send %s after the dialog closed', async (testId, command) => {
      const finishStopPreview = deferStopPreview();
      const { getByTestId, unmount } = renderBlock();

      await act(async () => fireEvent.click(getByTestId(testId)));
      unmount();
      await act(async () => finishStopPreview());
      expect(command).not.toHaveBeenCalled();
    });

    it('should not offer a door retry from a closed dialog', async () => {
      let reject: (error: unknown) => void = () => {};

      mockDoCalibration.mockReturnValueOnce(
        new Promise((_, r) => {
          reject = r;
        }),
      );

      const { getByTestId, unmount } = renderBlock();

      await act(async () => fireEvent.click(getByTestId('dev-pulse-fire')));
      unmount();
      await act(async () => reject(['error', 'DOOR_OPENED']));
      expect(mockPopUp).not.toHaveBeenCalled();
    });
  });

  it('should not stop the machine on close when no axis is moving', async () => {
    const { getByTestId, unmount } = renderBlock();

    await act(async () => fireEvent.click(getByTestId('dev-z-positive')));
    act(() => jest.runAllTimers());
    unmount();
    expect(mockStop).not.toHaveBeenCalled();
  });

  it('should ask to retry when the door is open', async () => {
    mockDoCalibration.mockRejectedValueOnce(['error', 'DOOR_OPENED']);

    const { getByTestId } = renderBlock();

    await act(async () => fireEvent.click(getByTestId('dev-pulse-fire')));
    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp.mock.calls[0][0].id).toBe('DOOR_OPENED');
  });

  it('should start the measurement from the field size', () => {
    const { getByTestId } = renderBlock();

    expect(getByTestId('dev-measured-x')).toHaveValue('110');
    expect(getByTestId('dev-measured-y')).toHaveValue('110');
    expect(getByTestId('dev-scale-x')).toHaveTextContent('Galvo Y scale: 100 -> 100 %');
    expect(getByTestId('dev-scale-y')).toHaveTextContent('Galvo X scale: 100 -> 100 %');
  });

  it('should apply the scale from the measurement with the axes swapped', () => {
    const { getByTestId } = renderBlock();

    expect(getByTestId('dev-scale-apply')).toBeDisabled();
    fireEvent.change(getByTestId('dev-measured-x'), { target: { value: '112' } });
    fireEvent.blur(getByTestId('dev-measured-x'));
    expect(getByTestId('dev-scale-x')).toHaveTextContent('Galvo Y scale: 100 -> 98.214 %');
    expect(getByTestId('dev-scale-y')).toHaveTextContent('Galvo X scale: 100 -> 100 %');

    fireEvent.click(getByTestId('dev-scale-apply'));
    expect(mockSetGalvoParameters).toHaveBeenCalledWith({
      x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
      y: { bulge: 1, scale: 98.214, skew: 1, trapezoid: 1 },
    });
    expect(getByTestId('dev-scale-apply')).toBeDisabled();
  });

  describe('factory test card', () => {
    it('should generate the card with the focus distance and save it under the serial', async () => {
      const blob = new Blob(['beam']);

      mockGetPromptValue.mockResolvedValue('345.5');
      mockGenerateFactoryTestCard.mockResolvedValue(blob);
      mockGetFactoryTestCardName.mockReturnValue('card-name');

      const { getByTestId } = renderBlock();

      await act(async () => fireEvent.click(getByTestId('dev-test-card')));
      expect(mockGenerateFactoryTestCard).toHaveBeenCalledWith({
        field,
        focusDistance: 345.5,
        galvoParameters,
        redDot,
        width: 110,
      });
      expect(mockGetFactoryTestCardName).toHaveBeenCalledWith({
        info: { laserType: LaserType.MOPA, watt: 60 },
        serial: 'CARD1234',
        width: 110,
      });
      expect(mockWriteFileDialog).toHaveBeenCalledWith(expect.any(Function), 'card-name', 'card-name.beam', [
        { extensions: ['beam'], name: 'Beam' },
      ]);
      expect(mockWriteFileDialog.mock.calls[0][0]()).toBe(blob);
    });

    it('should do nothing when the prompt is cancelled', async () => {
      mockGetPromptValue.mockResolvedValue(null);

      const { getByTestId } = renderBlock();

      await act(async () => fireEvent.click(getByTestId('dev-test-card')));
      expect(mockGenerateFactoryTestCard).not.toHaveBeenCalled();
      expect(mockPopUpError).not.toHaveBeenCalled();
    });

    it.each(['', 'abc', '12mm'])('should reject the focus distance %p', async (input) => {
      mockGetPromptValue.mockResolvedValue(input);

      const { getByTestId } = renderBlock();

      await act(async () => fireEvent.click(getByTestId('dev-test-card')));
      expect(mockGenerateFactoryTestCard).not.toHaveBeenCalled();
      expect(mockPopUpError).toHaveBeenCalledTimes(1);
    });

    it('should show an error when generating fails', async () => {
      mockGetPromptValue.mockResolvedValue('300');
      mockGenerateFactoryTestCard.mockRejectedValue(new Error('no template'));

      const { getByTestId } = renderBlock();

      await act(async () => fireEvent.click(getByTestId('dev-test-card')));
      expect(mockWriteFileDialog).not.toHaveBeenCalled();
      expect(mockPopUpError).toHaveBeenCalledTimes(1);
    });
  });
});
