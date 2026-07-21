import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockGetTextTransform = jest.fn();
const mockSetTextTransform = jest.fn();

jest.mock('@core/app/svgedit/text/textedit', () => ({
  getTextTransform: (el: SVGTextElement) => {
    mockGetTextTransform(el);

    return el.getAttribute('data-text-transform') || 'none';
  },
  setTextTransform: (...args: any[]) => mockSetTextTransform(...args),
}));

jest.mock('@core/app/stores/screenStore', () => ({
  useIsMobile: () => false,
}));

jest.mock('@core/app/widgets/AntdSelect', () => {
  return ({ onChange, options, value }: any) => (
    <select data-testid="select" data-value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
});

jest.mock('antd', () => ({
  ConfigProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock('@core/app/components/beambox/RightPanel/ObjectPanelItem', () => ({}));

import TextTransformBlock from './TextTransformBlock';

describe('TextTransformBlock', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeText = (transform?: string): SVGTextElement => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    if (transform) el.setAttribute('data-text-transform', transform);

    return el as SVGTextElement;
  };

  test('renders all 8 modes including none', () => {
    const text = makeText();
    const { container } = render(<TextTransformBlock textElements={[text]} />);
    const options = container.querySelectorAll('option');

    expect(options).toHaveLength(8);
    expect(Array.from(options).map((o) => o.value)).toEqual([
      'none',
      'sentence',
      'lowercase',
      'uppercase',
      'title',
      'toggle',
      'halfwidth',
      'fullwidth',
    ]);
  });

  test('calls setTextTransform when option chosen', () => {
    const text = makeText();
    const { getByTestId } = render(<TextTransformBlock textElements={[text]} />);

    fireEvent.change(getByTestId('select'), { target: { value: 'uppercase' } });

    expect(mockSetTextTransform).toHaveBeenCalledWith('uppercase', [text]);
  });

  test('reflects the initial transform read from the element', () => {
    const text = makeText('lowercase');
    const { getByTestId } = render(<TextTransformBlock textElements={[text]} />);

    expect(getByTestId('select').getAttribute('data-value')).toBe('lowercase');
  });

  test('shows "-" when multiple elements have different transforms', () => {
    const elems = [makeText('uppercase'), makeText('lowercase')];
    const { getByTestId } = render(<TextTransformBlock textElements={elems} />);

    expect(getByTestId('select').getAttribute('data-value')).toBe('-');
  });

  test('invokes onSizeChange after a change', () => {
    const text = makeText();
    const onSizeChange = jest.fn();
    const { getByTestId } = render(<TextTransformBlock onSizeChange={onSizeChange} textElements={[text]} />);

    fireEvent.change(getByTestId('select'), { target: { value: 'title' } });

    expect(onSizeChange).toHaveBeenCalled();
  });
});
