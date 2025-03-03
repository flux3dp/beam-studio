import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import InFillBlock from './InFillBlock';

const mockIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => () => mockIsMobile(),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      object_panel: {
        option_panel: {
          fill: 'Infill',
        },
      },
    },
  },
}));

const isElemFillable = jest.fn();
const calcElemFilledInfo = jest.fn();
const setElemsUnfill = jest.fn();
const setElemsFill = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({
      Canvas: {
        calcElemFilledInfo: (...args) => calcElemFilledInfo(...args),
        isElemFillable: (...args) => isElemFillable(...args),
        setElemsFill: (...args) => setElemsFill(...args),
        setElemsUnfill: (...args) => setElemsUnfill(...args),
      },
    });
  },
}));

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('is not fillable', () => {
    isElemFillable.mockReturnValue(false);
    calcElemFilledInfo.mockReturnValue({
      isAllFilled: false,
      isAnyFilled: true,
    });
    document.body.innerHTML = '<div id="flux" />';

    const { container } = render(<InFillBlock elem={document.getElementById('flux')} />);

    expect(container).toMatchSnapshot();
    expect(isElemFillable).toHaveBeenCalledTimes(1);
    expect(isElemFillable).toHaveBeenNthCalledWith(1, document.getElementById('flux'));
    expect(calcElemFilledInfo).toHaveBeenCalledTimes(1);
    expect(calcElemFilledInfo).toHaveBeenNthCalledWith(1, document.getElementById('flux'));
  });

  test('is fillable', () => {
    isElemFillable.mockReturnValue(true);
    calcElemFilledInfo.mockReturnValue({
      isAllFilled: false,
      isAnyFilled: false,
    });
    document.body.innerHTML = '<div id="flux" />';

    const { container } = render(<InFillBlock elem={document.getElementById('flux')} />);

    expect(container).toMatchSnapshot();

    const switchBtn = container.querySelector('button.ant-switch');

    fireEvent.click(switchBtn);
    expect(container).toMatchSnapshot();
    expect(setElemsUnfill).not.toHaveBeenCalled();
    expect(setElemsFill).toHaveBeenCalledTimes(1);
    expect(setElemsFill).toHaveBeenNthCalledWith(1, [document.getElementById('flux')]);

    fireEvent.click(switchBtn);
    expect(container).toMatchSnapshot();
    expect(setElemsUnfill).toHaveBeenCalledTimes(1);
    expect(setElemsUnfill).toHaveBeenNthCalledWith(1, [document.getElementById('flux')]);
    expect(setElemsFill).toHaveBeenCalledTimes(1);
  });

  test('with label', () => {
    isElemFillable.mockReturnValue(true);
    calcElemFilledInfo.mockReturnValue({
      isAllFilled: false,
      isAnyFilled: false,
    });
    document.body.innerHTML = '<div id="flux" />';

    const { container } = render(<InFillBlock elem={document.getElementById('flux')} label="Infill" />);

    expect(container).toMatchSnapshot();

    const switchBtn = container.querySelector('button.ant-switch');

    fireEvent.click(switchBtn);
    expect(container).toMatchSnapshot();
    expect(setElemsUnfill).not.toHaveBeenCalled();
    expect(setElemsFill).toHaveBeenCalledTimes(1);
    expect(setElemsFill).toHaveBeenNthCalledWith(1, [document.getElementById('flux')]);

    fireEvent.click(switchBtn);
    expect(container).toMatchSnapshot();
    expect(setElemsUnfill).toHaveBeenCalledTimes(1);
    expect(setElemsUnfill).toHaveBeenNthCalledWith(1, [document.getElementById('flux')]);
    expect(setElemsFill).toHaveBeenCalledTimes(1);
  });
});

describe('should render correctly in mobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockIsMobile.mockReturnValue(true);
  });

  test('id given', () => {
    isElemFillable.mockReturnValue(true);
    calcElemFilledInfo.mockReturnValue({
      isAllFilled: false,
      isAnyFilled: false,
    });
    document.body.innerHTML = '<div id="flux" />';

    const { container } = render(<InFillBlock elem={document.getElementById('flux')} id="mock-infill-id" />);

    expect(container).toMatchSnapshot();
  });

  test('is not fillable', () => {
    isElemFillable.mockReturnValue(false);
    calcElemFilledInfo.mockReturnValue({
      isAllFilled: false,
      isAnyFilled: true,
    });
    document.body.innerHTML = '<div id="flux" />';

    const { container } = render(<InFillBlock elem={document.getElementById('flux')} />);

    expect(container).toMatchSnapshot();
    expect(mockIsMobile).toHaveBeenCalledTimes(0);
    expect(isElemFillable).toHaveBeenCalledTimes(1);
    expect(isElemFillable).toHaveBeenNthCalledWith(1, document.getElementById('flux'));
    expect(calcElemFilledInfo).toHaveBeenCalledTimes(1);
    expect(calcElemFilledInfo).toHaveBeenNthCalledWith(1, document.getElementById('flux'));
  });

  test('is fillable', () => {
    isElemFillable.mockReturnValue(true);
    calcElemFilledInfo.mockReturnValue({
      isAllFilled: false,
      isAnyFilled: false,
    });
    document.body.innerHTML = '<div id="flux" />';

    const { container } = render(<InFillBlock elem={document.getElementById('flux')} />);

    expect(container).toMatchSnapshot();

    const switchBtn = container.querySelector('button');

    fireEvent.click(switchBtn);
    expect(container).toMatchSnapshot();
    expect(setElemsUnfill).not.toHaveBeenCalled();
    expect(setElemsFill).toHaveBeenCalledTimes(1);
    expect(setElemsFill).toHaveBeenNthCalledWith(1, [document.getElementById('flux')]);

    fireEvent.click(switchBtn);
    expect(container).toMatchSnapshot();
    expect(setElemsUnfill).toHaveBeenCalledTimes(1);
    expect(setElemsUnfill).toHaveBeenNthCalledWith(1, [document.getElementById('flux')]);
    expect(setElemsFill).toHaveBeenCalledTimes(1);
  });
});
