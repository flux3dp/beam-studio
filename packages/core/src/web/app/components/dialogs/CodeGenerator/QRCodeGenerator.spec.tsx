import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import i18n from '@core/helpers/i18n';

import QRCodeGenerator from './QRCodeGenerator';

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
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenCalledWith(i18n.lang.qr_code_generator.error_tolerance_link);
  });
});
