import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import InFillBlock from './InFillBlock';

const mockIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockIsMobile(),
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

    const { container } = render(<InFillBlock elems={[document.getElementById('flux')]} />);

    expect(container).toMatchSnapshot();
    expect(isElemFillable).toHaveBeenCalledTimes(1);
    expect(isElemFillable).toHaveBeenNthCalledWith(1, document.getElementById('flux'));
    expect(calcElemFilledInfo).not.toHaveBeenCalled();
  });

  test('is fillable', () => {
    isElemFillable.mockReturnValue(true);
    calcElemFilledInfo.mockReturnValue({
      isAllFilled: false,
      isAnyFilled: false,
    });
    document.body.innerHTML = '<div id="flux" />';

    const { container } = render(<InFillBlock elems={[document.getElementById('flux')]} />);

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

  test('with multiple elements (not fillable)', () => {
    isElemFillable.mockImplementation(({ id }) => id === 'flux2');
    calcElemFilledInfo.mockImplementation(({ id }) => ({
      isAllFilled: id === 'flux1',
      isAnyFilled: true,
    }));
    document.body.innerHTML = '<div id="flux1" /><div id="flux2" />';

    const elem1 = document.getElementById('flux1');
    const elem2 = document.getElementById('flux2');
    const { container } = render(<InFillBlock elems={[elem1, elem2]} />);

    expect(container).toMatchSnapshot();
    expect(isElemFillable).toHaveBeenCalledTimes(1);
    expect(isElemFillable).toHaveBeenNthCalledWith(1, elem1);
    expect(calcElemFilledInfo).not.toHaveBeenCalled();
  });

  test('with multiple elements (fillable)', () => {
    isElemFillable.mockReturnValue(true);
    calcElemFilledInfo.mockImplementation(({ id }) => ({
      isAllFilled: id === 'flux',
      isAnyFilled: true,
    }));
    document.body.innerHTML = '<div id="flux" /><div id="flux2" />';

    const elem1 = document.getElementById('flux');
    const elem2 = document.getElementById('flux2');
    const { container } = render(<InFillBlock elems={[elem1, elem2]} />);

    expect(container).toMatchSnapshot();
    expect(isElemFillable).toHaveBeenCalledTimes(2);
    expect(isElemFillable).toHaveBeenNthCalledWith(1, elem1);
    expect(isElemFillable).toHaveBeenNthCalledWith(2, elem2);
    expect(calcElemFilledInfo).toHaveBeenCalledTimes(2);
    expect(calcElemFilledInfo).toHaveBeenNthCalledWith(1, elem1);
    expect(calcElemFilledInfo).toHaveBeenNthCalledWith(2, elem2);

    const switchBtn = container.querySelector('button');

    expect(switchBtn).not.toHaveClass('filled');

    // partial -> unfill
    fireEvent.click(switchBtn);
    expect(switchBtn).not.toHaveClass('filled');
    expect(setElemsUnfill).toHaveBeenCalledTimes(1);
    expect(setElemsUnfill).toHaveBeenNthCalledWith(1, [elem1, elem2]);
    expect(setElemsFill).not.toHaveBeenCalled();

    // unfill -> fill
    fireEvent.click(switchBtn);
    expect(switchBtn).toHaveClass('filled');
    expect(setElemsUnfill).toHaveBeenCalledTimes(1);
    expect(setElemsFill).toHaveBeenCalledTimes(1);
    expect(setElemsFill).toHaveBeenNthCalledWith(1, [elem1, elem2]);
  });

  test('with label', () => {
    isElemFillable.mockReturnValue(true);
    calcElemFilledInfo.mockReturnValue({
      isAllFilled: false,
      isAnyFilled: false,
    });
    document.body.innerHTML = '<div id="flux" />';

    const { container } = render(<InFillBlock elems={[document.getElementById('flux')]} label="Infill" />);

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

    const { container } = render(<InFillBlock elems={[document.getElementById('flux')]} id="mock-infill-id" />);

    expect(container).toMatchSnapshot();
  });

  test('is not fillable', () => {
    isElemFillable.mockReturnValue(false);
    calcElemFilledInfo.mockReturnValue({
      isAllFilled: false,
      isAnyFilled: true,
    });
    document.body.innerHTML = '<div id="flux" />';

    const { container } = render(<InFillBlock elems={[document.getElementById('flux')]} />);

    expect(container).toMatchSnapshot();
    expect(mockIsMobile).toHaveBeenCalledTimes(1);
    expect(isElemFillable).toHaveBeenCalledTimes(1);
    expect(isElemFillable).toHaveBeenNthCalledWith(1, document.getElementById('flux'));
    expect(calcElemFilledInfo).not.toHaveBeenCalled();
  });

  test('is fillable', () => {
    isElemFillable.mockReturnValue(true);
    calcElemFilledInfo.mockReturnValue({
      isAllFilled: false,
      isAnyFilled: false,
    });
    document.body.innerHTML = '<div id="flux" />';

    const { container } = render(<InFillBlock elems={[document.getElementById('flux')]} />);

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
