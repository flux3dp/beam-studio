import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';

import Constants from 'app/constants/input-lightbox-constants';

import InputLightbox from './InputLightbox';

jest.mock('helpers/i18n', () => ({
  lang: {
    alert: {
      cancel: 'Resolution',
      confirm: 'Low',
    },
  },
}));

jest.mock(
  'app/widgets/AlertDialog',
  () =>
    function DummyImageAlertDialog() {
      return <div>This is dummy AlertDialog</div>;
    }
);

const mockOnSubmit = jest.fn();
const mockOnClose = jest.fn();

describe('test InputLightbox', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should trigger onSubmit when file is selected and input events are triggered', () => {
    const { baseElement, getByText } = render(
      <InputLightbox
        defaultValue=""
        inputHeader="header"
        caption="Firmware upload (*.bin / *.fxfw)"
        maxLength={100}
        type={Constants.TYPE_FILE}
        confirmText="UPLOAD"
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    expect(baseElement).toMatchSnapshot();

    // Select the input element
    const input = baseElement.querySelector('input') as HTMLInputElement;

    // Mock the files getter
    const filesGetter = jest.spyOn(input, 'files', 'get');
    const mockFile = new File(['mock-file'], 'mock-file');
    filesGetter.mockReturnValue([mockFile] as any);

    // Fire a keyup event to simulate user interaction
    fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' });

    // Ensure that the "UPLOAD" button is enabled after input interaction
    const uploadButton = getByText('UPLOAD').closest('button');
    expect(uploadButton).not.toBeDisabled();

    // Fire the click event on the enabled button
    fireEvent.click(uploadButton);

    // Ensure onSubmit is called
    expect(mockOnSubmit).toBeCalledTimes(1);

    // Ensure onClose is called with 'submit'
    expect(mockOnClose).toBeCalledTimes(1);
    expect(mockOnClose).toHaveBeenLastCalledWith('submit');
  });

  it('should render correctly when type is password', () => {
    const { baseElement, getByText } = render(
      <InputLightbox
        defaultValue=""
        inputHeader="Password"
        caption="ABCDE requires a password"
        maxLength={100}
        type={Constants.TYPE_PASSWORD}
        confirmText="CONNECT"
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );
    expect(baseElement).toMatchSnapshot();
    fireEvent.change(baseElement.querySelector('input'), { target: { value: 'pAssw0rd' } });
    expect(mockOnSubmit).not.toBeCalled();
    fireEvent.click(getByText('CONNECT'));
    expect(mockOnSubmit).toBeCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenLastCalledWith('pAssw0rd');
    expect(mockOnClose).toBeCalledTimes(1);
    expect(mockOnClose).toHaveBeenLastCalledWith('submit');
  });
});
