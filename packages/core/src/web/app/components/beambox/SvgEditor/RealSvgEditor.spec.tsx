import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import RealSvgEditor from './RealSvgEditor';

const mockHandler = jest.fn();

describe('test RealSvgEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = `<div id="safe-editor-container"><svg id="mock-canvas" style="pointer-events:none; opacity: 1;"/><div id="test"/></div>`;
    document.querySelector('#test').addEventListener('click', mockHandler);
  });

  it('should move elements correctly', () => {
    const { unmount } = render(<RealSvgEditor />);

    expect(document.body).toMatchSnapshot();
    expect(mockHandler).toHaveBeenCalledTimes(0);

    fireEvent.click(document.querySelector('#test'));
    expect(mockHandler).toHaveBeenCalledTimes(1);

    unmount();
    expect(document.body).toMatchSnapshot();
    fireEvent.click(document.querySelector('#test'));
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });
});
