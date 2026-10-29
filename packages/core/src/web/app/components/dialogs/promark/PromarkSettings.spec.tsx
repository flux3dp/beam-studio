import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import type { IDeviceInfo } from '@core/interfaces/IDevice';

import PromarkSettings from './PromarkSettings';

jest.mock('./FieldBlock', () => ({ field, issues, setField }) => (
  <div>
    Mock FieldBlock {JSON.stringify(field)} {issues?.['field.offsetX']?.level}
    <button onClick={() => setField((cur) => ({ ...cur, offsetX: 6 }))} type="button">
      offset-6
    </button>
    <button onClick={() => setField((cur) => ({ ...cur, offsetX: 100 }))} type="button">
      offset-100
    </button>
  </div>
));
jest.mock(
  './LensProfileBlock',
  () =>
    ({ canUseCloud, invalidProfiles, isDefault, isSynced, onChange, onSetDefault, onUseCloud, status, value }) => (
      <div>
        Mock LensProfileBlock {value.workarea} {String(value.innerEngraving)} {status.state} {status.inherited}
        {isDefault ? ' default' : ''}
        {isSynced ? ' synced' : ' not-synced'}
        {canUseCloud ? ' can-use-cloud' : ''}
        {invalidProfiles.length ? ` invalid-${invalidProfiles.length}` : ''}
        <button onClick={() => onChange({ innerEngraving: false, workarea: 200 })} type="button">
          lens-200
        </button>
        <button onClick={() => onChange({ innerEngraving: true, workarea: 70 })} type="button">
          lens-70-inner
        </button>
        <button onClick={onSetDefault} type="button">
          set-default
        </button>
        <button onClick={onUseCloud} type="button">
          use-cloud
        </button>
      </div>
    ),
);
jest.mock('./RedDotBlock', () => () => <div>Mock RedDotBlock</div>);
jest.mock('./LensBlock', () => () => <div>Mock LensBlock</div>);
jest.mock('./ParametersBlock', () => () => <div>Mock ParametersBlock</div>);

const mockCheckDeviceStatus = jest.fn();

jest.mock('@core/helpers/check-device-status', () => ({
  checkDeviceStatus: (...args) => mockCheckDeviceStatus(...args),
}));

const mockSetGalvoParameters = jest.fn();
const mockSetField = jest.fn();
const mockStartFraming = jest.fn();
const mockStopFraming = jest.fn();
const mockDoPromarkCalibration = jest.fn();
const mockSelect = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  doPromarkCalibration: (...args) => mockDoPromarkCalibration(...args),
  select: (...args) => mockSelect(...args),
  setField: (...args) => mockSetField(...args),
  setGalvoParameters: (...args) => mockSetGalvoParameters(...args),
  startFraming: (...args) => mockStartFraming(...args),
  stopFraming: (...args) => mockStopFraming(...args),
}));

const mockPromarkUpdate = jest.fn();
const mockPromarkGet = jest.fn();

jest.mock('@core/helpers/device/promark/promark-data-store', () => ({
  get: (...args) => mockPromarkGet(...args),
  update: (...args) => mockPromarkUpdate(...args),
}));

const mockGetDocumentLensProfileKey = jest.fn();

jest.mock('@core/helpers/device/promark/lens-profiles', () => ({
  ...jest.requireActual('@core/helpers/device/promark/lens-profiles'),
  getDocumentLensProfileKey: (...args) => mockGetDocumentLensProfileKey(...args),
}));

const mockReadLensCloudData = jest.fn();
const mockUploadLensCloudData = jest.fn();

jest.mock('@core/helpers/device/promark/lens-profiles-cloud', () => ({
  ...jest.requireActual('@core/helpers/device/promark/lens-profiles-cloud'),
  readLensCloudData: (...args) => mockReadLensCloudData(...args),
  uploadLensCloudData: (...args) => mockUploadLensCloudData(...args),
}));

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockGetWorkarea = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const mockCalculateRedDotTransform = jest.fn();
const mockGenerateCalibrationTaskString = jest.fn();
const mockLoadTaskToSwiftray = jest.fn();

jest.mock('@core/helpers/device/promark/calibration', () => ({
  calculateRedDotTransform: (...args) => mockCalculateRedDotTransform(...args),
  generateCalibrationTaskString: (...args) => mockGenerateCalibrationTaskString(...args),
  loadTaskToSwiftray: (...args) => mockLoadTaskToSwiftray(...args),
}));

const mockApplyRedDot = jest.fn();

jest.mock(
  '@core/helpers/device/promark/apply-red-dot',
  () =>
    (...args) =>
      mockApplyRedDot(...args),
);

const mockOn = jest.fn();
const mockOff = jest.fn();

jest.mock('@core/helpers/api/swiftray-client', () => ({
  swiftrayClient: {
    off: (...args) => mockOff(...args),
    on: (...args) => mockOn(...args),
  },
}));

const mockOnClose = jest.fn();

const mockDevice = {
  hashed_serial: 'hash',
  model: 'fpm1',
  serial: '123',
} as IDeviceInfo;

const factoryGalvo = {
  x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
  y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
};
const factoryRedDot = { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };

describe('test PromarkSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkarea.mockReturnValue({ width: 150 });
    mockGetDocumentLensProfileKey.mockReturnValue({ innerEngraving: false, workarea: 150 });
    mockPromarkGet.mockReturnValue({});
    mockReadLensCloudData.mockResolvedValue(null);
    mockPopUp.mockReset();
  });

  it('should render correctly', () => {
    const { baseElement } = render(<PromarkSettings device={mockDevice} initData={{}} onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();
  });

  test('Preview button', async () => {
    const { findByText } = render(<PromarkSettings device={mockDevice} initData={{}} onClose={mockOnClose} />);

    mockGenerateCalibrationTaskString.mockReturnValue('task');

    const previewBtn = await findByText('Preview');

    expect(mockStartFraming).not.toHaveBeenCalled();
    expect(mockLoadTaskToSwiftray).not.toHaveBeenCalled();
    mockApplyRedDot.mockReturnValue({
      field: 'mock-field',
      galvoParameters: 'mock-galvoParameters',
    });

    await act(async () => fireEvent.click(previewBtn));
    expect(mockApplyRedDot).toHaveBeenCalledTimes(1);
    expect(mockApplyRedDot).toHaveBeenCalledWith(
      {
        offsetX: 0,
        offsetY: 0,
        scaleX: 1,
        scaleY: 1,
      },
      {
        angle: 0,
        offsetX: 0,
        offsetY: 0,
      },
      {
        x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
        y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
      },
    );
    expect(mockSetGalvoParameters).toHaveBeenCalledTimes(1);
    expect(mockSetGalvoParameters).toHaveBeenCalledWith('mock-galvoParameters');
    expect(mockSetField).toHaveBeenCalledTimes(1);
    expect(mockSetField).toHaveBeenCalledWith(150, 'mock-field');
    expect(mockGenerateCalibrationTaskString).toHaveBeenCalledTimes(1);
    expect(mockGenerateCalibrationTaskString).toHaveBeenCalledWith({
      width: 150,
    });
    expect(mockLoadTaskToSwiftray).toHaveBeenCalledTimes(1);
    expect(mockLoadTaskToSwiftray).toHaveBeenCalledWith('task', 'fpm1', 150);
    expect(mockStartFraming).toHaveBeenCalledTimes(1);
    expect(mockStopFraming).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(previewBtn));
    expect(mockStopFraming).toHaveBeenCalledTimes(1);
  });

  test('Mark button', async () => {
    const { findByText } = render(<PromarkSettings device={mockDevice} initData={{}} onClose={mockOnClose} />);

    mockGenerateCalibrationTaskString.mockReturnValue('task');

    const markBtn = await findByText('Mark');

    expect(mockLoadTaskToSwiftray).not.toHaveBeenCalled();
    expect(mockDoPromarkCalibration).not.toHaveBeenCalled();
    await act(() => fireEvent.click(markBtn));
    expect(mockGenerateCalibrationTaskString).toHaveBeenCalledTimes(1);
    expect(mockGenerateCalibrationTaskString).toHaveBeenCalledWith({
      power: 50,
      speed: 1000,
      width: 150,
    });
    expect(mockLoadTaskToSwiftray).toHaveBeenCalledTimes(1);
    expect(mockLoadTaskToSwiftray).toHaveBeenCalledWith('task', 'fpm1', 150);
    expect(mockDoPromarkCalibration).toHaveBeenCalledTimes(1);
    expect(mockStartFraming).not.toHaveBeenCalled();
  });

  test('Cancel button', async () => {
    const { findByText } = render(<PromarkSettings device={mockDevice} initData={{}} onClose={mockOnClose} />);
    const cancelBtn = await findByText('Cancel');

    expect(mockOnClose).not.toHaveBeenCalled();
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Save button', async () => {
    const { findByText } = render(<PromarkSettings device={mockDevice} initData={{}} onClose={mockOnClose} />);
    const saveBtn = await findByText('Save');

    expect(mockPromarkUpdate).not.toHaveBeenCalled();
    await act(() => fireEvent.click(saveBtn));
    // the first saved lens becomes the default and is copied into the legacy set
    expect(mockPromarkUpdate).toHaveBeenCalledTimes(1);
    expect(mockPromarkUpdate).toHaveBeenCalledWith('123', {
      defaultLensProfile: { innerEngraving: false, workarea: 150 },
      field: { angle: 0, offsetX: 0, offsetY: 0 },
      galvoParameters: factoryGalvo,
      lensProfiles: [
        {
          field: { angle: 0, offsetX: 0, offsetY: 0 },
          galvoParameters: factoryGalvo,
          innerEngraving: false,
          redDot: factoryRedDot,
          workarea: 150,
        },
      ],
      redDot: factoryRedDot,
    });
    expect(mockUploadLensCloudData).toHaveBeenCalledWith(
      expect.objectContaining({ hash: 'hash', model: 'fpm1', serial: '123' }),
    );
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe('UV lens profiles', () => {
    const legacyField = { angle: 1, offsetX: 1, offsetY: 1 };
    const innerField = { angle: 2, offsetX: 2, offsetY: 2 };
    const cloudField = { angle: 3, offsetX: 3, offsetY: 3 };
    const factoryField = { angle: 0, offsetX: 0, offsetY: 0 };
    const initData = {
      field: legacyField,
      info: { laserType: 2, watt: 5 },
      lensProfiles: [{ field: innerField, innerEngraving: true, workarea: 70 }],
    } as const;
    const savedLenses = () => mockPromarkUpdate.mock.lastCall[1].lensProfiles;

    beforeEach(() => {
      mockGetDocumentLensProfileKey.mockReturnValue({ innerEngraving: true, workarea: 70 });
      mockPromarkGet.mockReturnValue(initData);
    });

    const renderSettings = () =>
      render(<PromarkSettings device={mockDevice} initData={initData as never} onClose={mockOnClose} />);

    test('opens on the lens of the document and switches between lenses', async () => {
      const { findByText, getByText } = renderSettings();

      expect(await findByText(/Mock LensProfileBlock 70 true saved/)).toBeInTheDocument();
      expect(getByText(`Mock FieldBlock ${JSON.stringify(innerField)}`, { exact: false })).toBeInTheDocument();

      // the legacy set is not used once profiles exist
      fireEvent.click(getByText('lens-200'));
      expect(getByText(/Mock LensProfileBlock 200 false unset/)).toBeInTheDocument();
      expect(getByText(`Mock FieldBlock ${JSON.stringify(factoryField)}`, { exact: false })).toBeInTheDocument();

      fireEvent.click(getByText('offset-6'));
      expect(getByText(/Mock LensProfileBlock 200 false edited/)).toBeInTheDocument();

      fireEvent.click(getByText('lens-70-inner'));
      expect(getByText(`Mock FieldBlock ${JSON.stringify(innerField)}`, { exact: false })).toBeInTheDocument();

      fireEvent.click(getByText('lens-200'));
      expect(getByText(/Mock LensProfileBlock 200 false edited/)).toBeInTheDocument();
    });

    test('without profiles, every lens shows the legacy set', async () => {
      const legacyOnly = { field: legacyField, info: initData.info };

      mockPromarkGet.mockReturnValue(legacyOnly);

      const { findByText, getByText } = render(
        <PromarkSettings device={mockDevice} initData={legacyOnly as never} onClose={mockOnClose} />,
      );

      expect(await findByText(/Mock LensProfileBlock 70 true saved legacy/)).toBeInTheDocument();
      fireEvent.click(getByText('lens-200'));
      expect(getByText(/Mock LensProfileBlock 200 false saved legacy/)).toBeInTheDocument();
      expect(getByText(`Mock FieldBlock ${JSON.stringify(legacyField)}`, { exact: false })).toBeInTheDocument();
    });

    test('a default saved under another laser type counts as no default', async () => {
      const desktopDefault = {
        ...initData,
        defaultLensProfile: { innerEngraving: false, workarea: 220 },
        lensProfiles: [...initData.lensProfiles, { field: cloudField, innerEngraving: false, workarea: 220 }],
      };

      mockPromarkGet.mockReturnValue(desktopDefault);

      const { findByText, getByText } = render(
        <PromarkSettings device={mockDevice} initData={desktopDefault as never} onClose={mockOnClose} />,
      );

      fireEvent.click(await findByText('lens-200'));
      expect(getByText(/Mock LensProfileBlock 200 false unset\s+default/)).toBeInTheDocument();
      expect(getByText(`Mock FieldBlock ${JSON.stringify(factoryField)}`, { exact: false })).toBeInTheDocument();
    });

    test('Save stores the shown and edited lenses and applies the document lens', async () => {
      const { findByText, getByText } = renderSettings();

      fireEvent.click(getByText('lens-200'));
      fireEvent.click(getByText('offset-6'));
      fireEvent.click(getByText('lens-70-inner'));
      mockPopUp.mockImplementation(({ onConfirm }) => onConfirm());
      await act(async () => fireEvent.click(await findByText('Save')));

      // offset 6 mm is outside the common range, so saving asks first
      expect(mockPopUp).toHaveBeenCalledWith(expect.objectContaining({ messageIcon: 'warning' }));
      expect(savedLenses()).toEqual([
        expect.objectContaining({ field: innerField, innerEngraving: true, workarea: 70 }),
        expect.objectContaining({ field: { ...factoryField, offsetX: 6 }, innerEngraving: false, workarea: 200 }),
      ]);
      expect(mockPromarkUpdate.mock.lastCall[1].defaultLensProfile).toEqual({ innerEngraving: true, workarea: 70 });
      expect(mockSetField).toHaveBeenLastCalledWith(150, innerField);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('the warning also lists lenses saved before', async () => {
      const saved = {
        ...initData,
        lensProfiles: [
          ...initData.lensProfiles,
          { field: { ...legacyField, offsetX: 7 }, innerEngraving: false, workarea: 200 },
        ],
      };

      mockPromarkGet.mockReturnValue(saved);

      const { findByText, getByText } = render(
        <PromarkSettings device={mockDevice} initData={saved as never} onClose={mockOnClose} />,
      );

      fireEvent.click(getByText('offset-6'));
      mockPopUp.mockImplementation(({ onCancel }) => onCancel());
      await act(async () => fireEvent.click(await findByText('Save')));
      expect(mockPopUp.mock.lastCall[0].message).toMatch(/70 mm・Inner Engraving.*6 mm[\s\S]*200 mm・Flat.*7 mm/);
    });

    test('a declined warning keeps the dialog open', async () => {
      const { findByText, getByText } = renderSettings();

      fireEvent.click(getByText('offset-6'));
      mockPopUp.mockImplementation(({ onCancel }) => onCancel());
      await act(async () => fireEvent.click(await findByText('Save')));
      expect(mockPromarkUpdate).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('values out of range block saving', async () => {
      const { getByText } = renderSettings();

      fireEvent.click(getByText('lens-200'));
      fireEvent.click(getByText('offset-100'));
      expect(getByText(/error/)).toBeInTheDocument();
      fireEvent.click(getByText('lens-70-inner'));
      expect(getByText(/invalid-1/)).toBeInTheDocument();
      expect(getByText('Save').closest('button')).toBeDisabled();
    });

    test('Set as Default saves the lens and copies it into the legacy set', async () => {
      const { findByText, getByText } = renderSettings();

      fireEvent.click(getByText('lens-200'));
      fireEvent.click(getByText('set-default'));
      expect(getByText(/Mock LensProfileBlock 200 false unset\s+default/)).toBeInTheDocument();
      await act(async () => fireEvent.click(await findByText('Save')));
      expect(mockPromarkUpdate.mock.lastCall[1]).toMatchObject({
        defaultLensProfile: { innerEngraving: false, workarea: 200 },
        field: factoryField,
      });
    });

    describe('cloud', () => {
      const cloud = {
        defaultKey: { innerEngraving: true, workarea: 70 },
        profiles: [{ field: cloudField, innerEngraving: true, workarea: 70 }],
      };

      test('the same cloud copy is synced without asking', async () => {
        mockReadLensCloudData.mockResolvedValue({
          profiles: [{ field: innerField, innerEngraving: true, workarea: 70 }],
        });

        const { findByText } = renderSettings();

        expect(await findByText(/Mock LensProfileBlock 70 true saved\s+default synced/)).toBeInTheDocument();
        expect(mockPopUp).not.toHaveBeenCalled();
      });

      test('asks with the differing lenses and fills the screen without saving', async () => {
        mockReadLensCloudData.mockResolvedValue(cloud);
        mockPopUp.mockImplementation(({ onYes }) => onYes());

        const { findByText, getByText } = renderSettings();

        expect(await findByText(/Mock LensProfileBlock 70 true edited\s+default synced/)).toBeInTheDocument();
        expect(mockPopUp).toHaveBeenCalledTimes(1);
        expect(mockPopUp.mock.lastCall[0].message).toContain('70 mm・Inner Engraving、Default lens');
        expect(getByText(`Mock FieldBlock ${JSON.stringify(cloudField)}`, { exact: false })).toBeInTheDocument();
        expect(mockPromarkUpdate).not.toHaveBeenCalled();
      });

      test('an accepted cloud lens is saved even when its values match what it would inherit', async () => {
        // nothing local; the cloud default is the 70 mm inner lens and 200 mm holds the factory values on its own
        mockPromarkGet.mockReturnValue({ info: initData.info });
        mockReadLensCloudData.mockResolvedValue({
          ...cloud,
          profiles: [...cloud.profiles, { field: factoryField, innerEngraving: false, workarea: 200 }],
        });
        mockPopUp.mockImplementation(({ onYes }) => onYes());

        const { findByText, getByText } = render(
          <PromarkSettings device={mockDevice} initData={{ info: initData.info }} onClose={mockOnClose} />,
        );

        expect(await findByText(/Mock LensProfileBlock 70 true edited\s+default synced/)).toBeInTheDocument();
        expect(mockPopUp.mock.lastCall[0].message).toContain('70 mm・Inner Engraving、200 mm・Flat');
        fireEvent.click(getByText('lens-200'));
        expect(getByText(/Mock LensProfileBlock 200 false edited\s+synced/)).toBeInTheDocument();
        // cloudField is outside the common range, so saving asks first
        mockPopUp.mockImplementation(({ onConfirm }) => onConfirm());
        await act(async () => fireEvent.click(await findByText('Save')));

        // 200 mm keeps its own factory values instead of following the default's cloudField later on
        expect(savedLenses()).toEqual([
          expect.objectContaining({ field: factoryField, innerEngraving: false, workarea: 200 }),
          expect.objectContaining({ field: cloudField, innerEngraving: true, workarea: 70 }),
        ]);
      });

      test('after declining, the cloud parameters can be used per lens', async () => {
        mockReadLensCloudData.mockResolvedValue(cloud);
        mockPopUp.mockImplementation(({ onNo }) => onNo());

        const { findByText, getByText } = renderSettings();

        expect(await findByText(/not-synced can-use-cloud/)).toBeInTheDocument();
        fireEvent.click(getByText('use-cloud'));
        expect(getByText(/Mock LensProfileBlock 70 true edited\s+default synced/)).toBeInTheDocument();
        // a lens the cloud does not have has nothing to use
        fireEvent.click(getByText('lens-200'));
        expect(getByText(/not-synced$/)).toBeInTheDocument();
      });
    });
  });
});
