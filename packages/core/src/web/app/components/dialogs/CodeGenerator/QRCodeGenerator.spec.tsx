import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import QRCodeGenerator from './QRCodeGenerator';

jest.mock('@core/helpers/useI18n', () => () => ({
  alert: {
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  qr_code_generator: {
    error_tolerance: 'Error Tolerance',
    error_tolerance_link: 'error_tolerance_link',
    invert: 'Invert background color',
    placeholder: 'Input a link or text',
    preview: 'Preview',
    title: 'QR Code Generator',
  },
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args: any) => mockOpen(...args),
}));

const mockInsertImage = jest.fn();

jest.mock('@core/app/actions/beambox/svgeditor-function-wrapper', () => ({
  insertImage: (...props: any) => mockInsertImage(...props),
}));

describe('test QRCodeGenerator', () => {
  it('should behave correctly', () => {
    const [isInvert, setIsInvert] = [false, jest.fn()];
    const [text, setText] = ['', jest.fn()];
    const { baseElement } = render(
      <QRCodeGenerator isInvert={isInvert} setIsInvert={setIsInvert} setText={setText} text={text} />,
    );

    const input = baseElement.querySelector('textarea');

    expect(input).toHaveValue('');
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(baseElement.querySelector('.label .anticon'));
    expect(mockOpen).toBeCalledTimes(1);
    expect(mockOpen).toBeCalledWith('error_tolerance_link');
  });
});
