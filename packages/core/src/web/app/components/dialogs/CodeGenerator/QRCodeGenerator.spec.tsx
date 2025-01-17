import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import QRCodeGenerator from './QRCodeGenerator';

jest.mock('helpers/useI18n', () => () => ({
  alert: {
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  qr_code_generator: {
    title: 'QR Code Generator',
    placeholder: 'Input a link or text',
    preview: 'Preview',
    error_tolerance: 'Error Tolerance',
    error_tolerance_link: 'error_tolerance_link',
    invert: 'Invert background color',
  },
}));

const mockOpen = jest.fn();

jest.mock('implementations/browser', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open: (...args: any) => mockOpen(...args),
}));

const mockInsertImage = jest.fn();

jest.mock('app/actions/beambox/svgeditor-function-wrapper', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertImage: (...props: any) => mockInsertImage(...props),
}));

describe('test QRCodeGenerator', () => {
  it('should behave correctly', () => {
    const [isInvert, setIsInvert] = [false, jest.fn()];
    const [text, setText] = ['', jest.fn()];
    const { baseElement } = render(
      <QRCodeGenerator
        isInvert={isInvert}
        setIsInvert={setIsInvert}
        text={text}
        setText={setText}
      />
    );

    const input = baseElement.querySelector('textarea');
    expect(input).toHaveValue('');
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(baseElement.querySelector('.label .anticon'));
    expect(mockOpen).toBeCalledTimes(1);
    expect(mockOpen).toBeCalledWith('error_tolerance_link');
  });
});
