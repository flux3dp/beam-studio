import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { getCurrentUser } from '@core/helpers/api/flux-id';

const mockOpenMessage = jest.fn();

jest.mock('@core/app/actions/message-caller', () => ({
  MessageLevel: { SUCCESS: 'SUCCESS' },
  openMessage: (...args: any[]) => mockOpenMessage(...args),
}));

const mockConvertPhotoTo3d = jest.fn();

jest.mock('@core/app/svgedit/stl/photoTo3d', () => ({
  checkPhotoTo3dSize: () => mockCheckPhotoTo3dSize(),
  convertPhotoTo3d: (...args: any[]) => mockConvertPhotoTo3d(...args),
  DEFAULT_SHARPEN: { amount: 1, radius: 4 },
  PHOTO_TO_3D_COST: 0.06,
  SHARPEN_AMOUNT_LIMIT: { max: 5, min: 0 },
  SHARPEN_RADIUS_LIMIT: { max: 20, min: 0.5 },
}));

const mockCheckPhotoTo3dSize = jest.fn();
const mockLoadRasterData = jest.fn();

jest.mock('@core/app/svgedit/stl/photoPointCloudGenerator', () => ({
  loadRasterData: (...args: any[]) => mockLoadRasterData(...args),
}));
jest.mock('@core/app/svgedit/stl/photoPlane', () => ({
  getPhotoTextureUrl: (elem: Element) => elem.getAttribute('xlink:href'),
}));
jest.mock('@core/implementations/browser', () => ({ open: jest.fn() }));
jest.mock(
  '@core/app/widgets/DraggableModal',
  () =>
    ({ children, okButtonProps, okText, onCancel, onOk, title }: any) => (
      <div>
        <div data-testid="title">{title}</div>
        {children}
        <button data-testid="cancel" onClick={onCancel} type="button" />
        <button data-testid="ok" disabled={okButtonProps?.disabled} onClick={onOk} type="button">
          {okText}
        </button>
      </div>
    ),
);

const mockAddDialogComponent = jest.fn();

jest.mock('@core/app/actions/dialog-controller', () => ({
  addDialogComponent: (...args: any[]) => mockAddDialogComponent(...args),
  isIdExist: () => false,
  popDialogById: jest.fn(),
}));

const mockShowLoginDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({ showLoginDialog: () => mockShowLoginDialog() }));

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: (...args: any[]) => mockPopUp(...args) }));

import { hasTransparentBackground, showPhotoTo3dModal } from '.';
import PhotoTo3dModal from './PhotoTo3dModal';

const mockGetCurrentUser = getCurrentUser as jest.Mock;
const element = document.createElementNS('http://www.w3.org/2000/svg', 'image') as SVGImageElement;

describe('PhotoTo3dModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({ info: { credit: 1 } });
  });

  test('sends the choices and closes once the photo is converted', async () => {
    const onClose = jest.fn();

    mockConvertPhotoTo3d.mockResolvedValue(true);

    const { container, getByTestId } = render(
      <PhotoTo3dModal element={element} hasTransparency={false} onClose={onClose} />,
    );

    expect(container.querySelector<HTMLInputElement>('#photo-to-3d-remove-background')!.checked).toBe(true);
    fireEvent.click(getByTestId('ok'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockConvertPhotoTo3d).toHaveBeenCalledWith(element, {
      removeBackground: true,
      sharpenAmount: 1,
      sharpenRadius: 4,
    });
    expect(mockOpenMessage).toHaveBeenCalledWith(expect.objectContaining({ level: 'SUCCESS' }));
  });

  test('a photo that already has a transparent background is not cut out again by default', () => {
    const { container } = render(<PhotoTo3dModal element={element} hasTransparency onClose={jest.fn()} />);

    expect(container.querySelector<HTMLInputElement>('#photo-to-3d-remove-background')!.checked).toBe(false);
  });

  test('stays open to retry after a failure, and cannot start without credit', async () => {
    mockConvertPhotoTo3d.mockResolvedValue(false);

    const onClose = jest.fn();
    const { getByTestId, unmount } = render(<PhotoTo3dModal element={element} hasTransparency onClose={onClose} />);

    fireEvent.click(getByTestId('ok'));
    await waitFor(() => expect(getByTestId('ok')).toHaveTextContent('Retry'));
    expect(onClose).not.toHaveBeenCalled();
    unmount();

    mockGetCurrentUser.mockReturnValue({ info: { credit: 0.05 } });

    const { getByTestId: getAgain } = render(<PhotoTo3dModal element={element} hasTransparency onClose={onClose} />);

    expect(getAgain('ok')).toBeDisabled();
  });
});

describe('showPhotoTo3dModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({ info: { credit: 1 } });
    mockCheckPhotoTo3dSize.mockReturnValue(true);
    element.setAttribute('xlink:href', 'data:image/png;base64,photo');
  });

  test('a photo counts as cut out when more than 1% of it is not opaque', () => {
    const data = new Uint8ClampedArray(400).fill(255);

    data[3] = 0;
    expect(hasTransparentBackground({ data })).toBe(false);
    data[7] = 0;
    expect(hasTransparentBackground({ data })).toBe(true);
  });

  test('asks to log in first, and refuses a photo with too many dots before charging', async () => {
    mockGetCurrentUser.mockReturnValue(null);
    await showPhotoTo3dModal(element);
    expect(mockShowLoginDialog).toHaveBeenCalled();

    mockGetCurrentUser.mockReturnValue({ info: { credit: 1 } });
    mockCheckPhotoTo3dSize.mockReturnValue(false);
    await showPhotoTo3dModal(element);
    expect(mockPopUp).toHaveBeenCalled();
    expect(mockAddDialogComponent).not.toHaveBeenCalled();
  });

  test('opens the dialog with the transparency of the photo', async () => {
    mockLoadRasterData.mockResolvedValue({ data: new Uint8ClampedArray(8), height: 1, width: 2 });
    await showPhotoTo3dModal(element);

    expect(mockLoadRasterData).toHaveBeenCalledWith('data:image/png;base64,photo');
    expect(mockAddDialogComponent.mock.lastCall[1].props.hasTransparency).toBe(true);
  });
});
