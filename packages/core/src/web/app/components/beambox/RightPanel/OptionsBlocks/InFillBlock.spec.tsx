import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { useScreenStore } from '@core/app/stores/screenStore';

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

jest.mock('@core/app/widgets/AntdSelect', () => ({ className, id, onChange, options, placeholder, value }: any) => (
  <select
    className={className}
    data-placeholder={placeholder}
    id={id}
    onChange={(e) => onChange(e.target.value)}
    value={value ?? ''}
  >
    {value === undefined ? <option value="" /> : null}
    {options.map((o: any) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
));

import InFillBlock from './InFillBlock';

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

    const { container } = render(<InFillBlock elems={[document.getElementById('flux')!]} />);

    expect(container).toMatchSnapshot();

    const select = container.querySelector('select')!;

    fireEvent.change(select, { target: { value: 'fill' } });
    expect(container).toMatchSnapshot();
    expect(setElemsUnfill).not.toHaveBeenCalled();
    expect(setElemsFill).toHaveBeenCalledTimes(1);
    expect(setElemsFill).toHaveBeenNthCalledWith(1, [document.getElementById('flux')]);

    fireEvent.change(select, { target: { value: 'stroke' } });
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

    const select = container.querySelector('select')!;

    expect(select.value).toBe('fill');

    // any filled -> unfill
    fireEvent.change(select, { target: { value: 'stroke' } });
    expect(select.value).toBe('stroke');
    expect(setElemsUnfill).toHaveBeenCalledTimes(1);
    expect(setElemsUnfill).toHaveBeenNthCalledWith(1, [elem1, elem2]);
    expect(setElemsFill).not.toHaveBeenCalled();

    // unfill -> fill
    fireEvent.change(select, { target: { value: 'fill' } });
    expect(select.value).toBe('fill');
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

    const { container } = render(<InFillBlock elems={[document.getElementById('flux')!]} label="Infill" />);

    expect(container).toMatchSnapshot();

    const select = container.querySelector('select')!;

    fireEvent.change(select, { target: { value: 'fill' } });
    expect(container).toMatchSnapshot();
    expect(setElemsUnfill).not.toHaveBeenCalled();
    expect(setElemsFill).toHaveBeenCalledTimes(1);
    expect(setElemsFill).toHaveBeenNthCalledWith(1, [document.getElementById('flux')]);

    fireEvent.change(select, { target: { value: 'stroke' } });
    expect(container).toMatchSnapshot();
    expect(setElemsUnfill).toHaveBeenCalledTimes(1);
    expect(setElemsUnfill).toHaveBeenNthCalledWith(1, [document.getElementById('flux')]);
    expect(setElemsFill).toHaveBeenCalledTimes(1);
  });
});

describe('should render correctly in mobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useScreenStore.setState({ isMobile: true });
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
