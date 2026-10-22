import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LaserType } from '@core/app/constants/promark-constants';

import PromarkSettings from './PromarkSettings';

jest.mock('@core/app/components/dialogs/promark/FieldBlock', () => ({ field, setField }) => (
  <div>
    Mock FieldBlock {JSON.stringify(field)}
    <button onClick={() => setField((cur) => ({ ...cur, offsetX: 1 }))} type="button">
      offset-1
    </button>
    <button onClick={() => setField((cur) => ({ ...cur, offsetX: 100 }))} type="button">
      offset-100
    </button>
  </div>
));
jest.mock('@core/app/components/dialogs/promark/LensProfileBlock', () => ({ isDefault, onChange, status, value }) => (
  <div>
    Mock LensProfileBlock {value.workarea} {String(value.innerEngraving)} {status.state}
    {isDefault ? ' default' : ''}
    <button onClick={() => onChange({ innerEngraving: false, workarea: 200 })} type="button">
      lens-200
    </button>
  </div>
));
jest.mock('@core/app/components/dialogs/promark/RedDotBlock', () => () => <div>Mock RedDotBlock</div>);
jest.mock('@core/app/components/dialogs/promark/LensBlock', () => () => <div>Mock LensBlock</div>);

const mockSetField = jest.fn();
const mockSetGalvoParameters = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  getAvailableDevices: () => [{ hashed_serial: 'hash', serial: 'serial' }],
  setField: (...args) => mockSetField(...args),
  setGalvoParameters: (...args) => mockSetGalvoParameters(...args),
}));

jest.mock('@core/helpers/device/promark/promark-info', () => ({
  getPromarkInfo: () => ({ laserType: LaserType.UV, watt: 5 }),
  getSerial: () => 'serial',
}));

const mockGet = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@core/helpers/device/promark/promark-data-store', () => ({
  get: (...args) => mockGet(...args),
  update: (...args) => mockUpdate(...args),
}));

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: () => ({ width: 70 }),
}));

const mockReadLensCloudData = jest.fn();
const mockUploadLensCloudData = jest.fn();

jest.mock('@core/helpers/device/promark/lens-profiles-cloud', () => ({
  ...jest.requireActual('@core/helpers/device/promark/lens-profiles-cloud'),
  readLensCloudData: (...args) => mockReadLensCloudData(...args),
  uploadLensCloudData: (...args) => mockUploadLensCloudData(...args),
}));

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: jest.fn() }));
jest.mock('@core/app/actions/dialog-caller', () => ({ showLoadingWindow: jest.fn() }));
jest.mock('@core/helpers/hashHelper', () => ({ getHomePage: () => '#/studio/beambox' }));

const mockShowSetupPageLayoutDialog = jest.fn();

jest.mock(
  '../Components/showSetupPageLayoutDialog',
  () =>
    (...args) =>
      mockShowSetupPageLayoutDialog(...args),
);

const factoryField = { angle: 0, offsetX: 0, offsetY: 0 };

describe('test InitializeMachine PromarkSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue({});
    mockReadLensCloudData.mockResolvedValue(null);
  });

  test('shows the work area picked on the previous page as the default lens', async () => {
    const { findByText, getByText } = render(<PromarkSettings />);

    expect(await findByText(/Mock LensProfileBlock 70 false unset\s+default/)).toBeInTheDocument();
    expect(getByText(`Mock FieldBlock ${JSON.stringify(factoryField)}`, { exact: false })).toBeInTheDocument();
    expect(mockReadLensCloudData).toHaveBeenCalledWith('hash', 'serial');
  });

  test('Next saves every edited lens, keeps the picked work area as the default and applies it', async () => {
    const { getByText } = render(<PromarkSettings />);

    fireEvent.click(getByText('offset-1'));
    fireEvent.click(getByText('lens-200'));
    expect(getByText(/Mock LensProfileBlock 200 false unset$/)).toBeInTheDocument();
    fireEvent.click(getByText('offset-1'));
    await act(async () => fireEvent.click(getByText('Next')));

    const saved = mockUpdate.mock.lastCall[1];

    expect(saved.defaultLensProfile).toEqual({ innerEngraving: false, workarea: 70 });
    expect(saved.lensProfiles).toEqual([
      expect.objectContaining({ field: { ...factoryField, offsetX: 1 }, innerEngraving: false, workarea: 200 }),
      expect.objectContaining({ field: { ...factoryField, offsetX: 1 }, innerEngraving: false, workarea: 70 }),
    ]);
    expect(saved.field).toEqual({ ...factoryField, offsetX: 1 });
    expect(mockSetField).toHaveBeenCalledWith(70, { ...factoryField, offsetX: 1 });
    expect(mockUploadLensCloudData).toHaveBeenCalledWith(
      expect.objectContaining({ hash: 'hash', model: 'fpm1', serial: 'serial' }),
    );
    expect(mockShowSetupPageLayoutDialog).toHaveBeenCalledTimes(1);
  });

  test('values out of range disable Next', () => {
    const { getByText } = render(<PromarkSettings />);

    fireEvent.click(getByText('offset-100'));
    fireEvent.click(getByText('Next'));
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockShowSetupPageLayoutDialog).not.toHaveBeenCalled();
  });
});
