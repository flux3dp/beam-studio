import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import { getCurrentUser } from '@core/helpers/api/flux-id';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: (...args: any[]) => mockPopUp(...args) }));

const mockOpenMessage = jest.fn();

jest.mock('@core/app/actions/message-caller', () => ({
  MessageLevel: { SUCCESS: 'SUCCESS' },
  openMessage: (...args: any[]) => mockOpenMessage(...args),
}));

const mockBrowserOpen = jest.fn();

const mockUpscaleImage = jest.fn();

jest.mock('@core/helpers/image-edit', () => ({
  UPSCALE_COST: 0.01,
  upscaleImage: (...args: any[]) => mockUpscaleImage(...args),
}));

jest.mock('@core/implementations/browser', () => ({ open: (...args: any[]) => mockBrowserOpen(...args) }));

jest.mock('@core/app/widgets/AntdSelect', () => ({ onChange, options, value }: any) => (
  <select data-testid="scale" onChange={(e) => onChange(Number(e.target.value))} value={value}>
    {options.map((o: any) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
));

jest.mock(
  '@core/app/widgets/DraggableModal',
  () =>
    ({ cancelText, children, okButtonProps, okText, onCancel, onOk, title }: any) => (
      <div>
        <div data-testid="title">{title}</div>
        {children}
        <button data-testid="cancel" onClick={onCancel} type="button">
          {cancelText}
        </button>
        <button data-testid="ok" disabled={okButtonProps?.disabled} onClick={onOk} type="button">
          {okText}
        </button>
      </div>
    ),
);

import UpscaleModal from './UpscaleModal';

const mockGetCurrentUser = getCurrentUser as jest.Mock;
const small = { height: 314, width: 352 };
const large = { height: 1440, width: 1440 };

const element = { tagName: 'image' } as unknown as SVGImageElement;

const renderModal = (props: Partial<React.ComponentProps<typeof UpscaleModal>> = {}) => {
  const onClose = jest.fn();
  const utils = render(
    <UpscaleModal element={element} imageSize={small} onClose={onClose} requiredScale={1} {...props} />,
  );

  return { ...utils, onClose, run: mockUpscaleImage };
};

describe('UpscaleModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({ email: 'a@b.c', info: { credit: 1 } });
  });

  test('defaults to 2x with no recommendation when the layer DPI is already met', () => {
    const { getByTestId, queryByText } = renderModal({ requiredScale: 0.8 });
    const select = getByTestId('scale') as HTMLSelectElement;

    expect(select.value).toBe('2');
    expect(queryByText(/Recommended/)).toBeNull();
    expect(queryByText(/Layer DPI/)).toBeNull();
  });

  test('preselects and tags the smallest option covering the layer DPI need', () => {
    const { getByTestId, getByText } = renderModal({ requiredScale: 4.5 });
    const select = getByTestId('scale') as HTMLSelectElement;

    expect(select.value).toBe('6');
    expect(getByText('6x (Recommended)')).toBeInTheDocument();
    expect(getByText(/Recommended for the current layer DPI: 6x/)).toBeInTheDocument();
  });

  test('caps the recommendation by the output ceiling and explains the gap', () => {
    // 1440² × 6x = 8640² > 8192², so 4x is the largest fitting option; the need is clamped to the 10x max.
    const { getByTestId, getByText } = renderModal({ imageSize: large, requiredScale: 12 });
    const select = getByTestId('scale') as HTMLSelectElement;

    expect(select.value).toBe('4');
    expect(getByText('4x (Recommended)')).toBeInTheDocument();
    expect(getByText(/10x, but 4x is the largest/)).toBeInTheDocument();
  });

  test('shows the output size for the selected scale', () => {
    const { getByTestId, getByText } = renderModal();

    expect(getByText('352 × 314 px')).toBeInTheDocument();
    expect(getByText('704 × 628 px')).toBeInTheDocument();
    fireEvent.change(getByTestId('scale'), { target: { value: '4' } });
    expect(getByText('1408 × 1256 px')).toBeInTheDocument();
  });

  test('disables Start and warns when the combined credit is insufficient', () => {
    mockGetCurrentUser.mockReturnValue({ email: 'a@b.c', info: { credit: 0.005, subscription: { credit: 0.004 } } });

    const { getByTestId, getByText } = renderModal();

    expect(getByTestId('ok')).toBeDisabled();
    expect(getByText(/Insufficient credit/)).toBeInTheDocument();
  });

  test('opens the member center link', () => {
    const { getByText } = renderModal();

    fireEvent.click(getByText('Go to Member Center'));
    expect(mockBrowserOpen).toHaveBeenCalledWith('https://member.flux3dp.com/en-US/credit');
  });

  test('runs, toasts and closes on success', async () => {
    const { getByTestId, onClose, run } = renderModal({ requiredScale: 4.5 });

    run.mockResolvedValue(true);
    fireEvent.click(getByTestId('ok'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(run).toHaveBeenCalledWith(element, 6, small);
    expect(mockOpenMessage).toHaveBeenCalledWith(expect.objectContaining({ level: 'SUCCESS' }));
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('shows the failure banner and a Retry button when the run fails', async () => {
    const { getByTestId, getByText, onClose, run } = renderModal();

    run.mockResolvedValue(false);
    fireEvent.click(getByTestId('ok'));
    await waitFor(() => expect(getByTestId('ok').textContent).toBe('Retry'));
    expect(getByText(/could not be completed/)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockOpenMessage).not.toHaveBeenCalled();
  });

  test('confirms before running an oversize output and respects cancel', async () => {
    const { getByTestId, run } = renderModal({ imageSize: large });

    run.mockResolvedValue(true);
    fireEvent.change(getByTestId('scale'), { target: { value: '10' } });

    fireEvent.click(getByTestId('ok'));
    await waitFor(() => expect(mockPopUp).toHaveBeenCalledTimes(1));
    expect(mockPopUp.mock.calls[0][0].message).toContain('14400 × 14400 px');
    mockPopUp.mock.calls[0][0].onCancel();
    await waitFor(() => expect(run).not.toHaveBeenCalled());

    fireEvent.click(getByTestId('ok'));
    await waitFor(() => expect(mockPopUp).toHaveBeenCalledTimes(2));
    mockPopUp.mock.calls[1][0].onConfirm();
    await waitFor(() => expect(run).toHaveBeenCalledWith(element, 10, large));
  });
});
