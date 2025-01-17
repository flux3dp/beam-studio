/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SegmentedControl from './SegmentedControl';

describe('test SegmentedControl', () => {
  test('enabled', () => {
    const onChanged = jest.fn();
    const { container } = render(
      <SegmentedControl
        isDisabled={false}
        selectedIndexes={[0]}
        onChanged={onChanged}
        segments={[
          {
            imgSrc: 'img/right-panel/icon-nodetype-0.svg',
            title: 'tCorner',
            value: 0,
          },
          {
            imgSrc: 'img/right-panel/icon-nodetype-1.svg',
            title: 'tSmooth',
            value: 1,
          },
          {
            imgSrc: 'img/right-panel/icon-nodetype-2.svg',
            title: 'tSymmetry',
            value: 2,
          },
        ]}
      />
    );
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('div[title="tSmooth"]'));
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(onChanged).toHaveBeenNthCalledWith(1, 1);
  });

  test('disabled', () => {
    const onChanged = jest.fn();
    const { container } = render(
      <SegmentedControl
        isDisabled
        selectedIndexes={[0]}
        onChanged={onChanged}
        segments={[
          {
            imgSrc: 'img/right-panel/icon-nodetype-0.svg',
            title: 'tCorner',
            value: 0,
          },
          {
            imgSrc: 'img/right-panel/icon-nodetype-1.svg',
            title: 'tSmooth',
            value: 1,
          },
          {
            imgSrc: 'img/right-panel/icon-nodetype-2.svg',
            title: 'tSymmetry',
            value: 2,
          },
        ]}
      />
    );
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('div[title="tSmooth"]'));
    expect(onChanged).not.toHaveBeenCalled();
  });

  test('click on selected index', () => {
    const onChanged = jest.fn();
    const { container } = render(
      <SegmentedControl
        isDisabled={false}
        selectedIndexes={[0]}
        onChanged={onChanged}
        segments={[
          {
            imgSrc: 'img/right-panel/icon-nodetype-0.svg',
            title: 'tCorner',
            value: 0,
          },
          {
            imgSrc: 'img/right-panel/icon-nodetype-1.svg',
            title: 'tSmooth',
            value: 1,
          },
          {
            imgSrc: 'img/right-panel/icon-nodetype-2.svg',
            title: 'tSymmetry',
            value: 2,
          },
        ]}
      />
    );
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('div[title="tCorner"]'));
    expect(onChanged).not.toHaveBeenCalled();
  });

  test('multiple selected indexes', () => {
    const onChanged = jest.fn();
    const { container } = render(
      <SegmentedControl
        isDisabled={false}
        selectedIndexes={[0, 1, 2]}
        onChanged={onChanged}
        segments={[
          {
            imgSrc: 'img/right-panel/icon-nodetype-0.svg',
            title: 'tCorner',
            value: 0,
          },
          {
            imgSrc: 'img/right-panel/icon-nodetype-1.svg',
            title: 'tSmooth',
            value: 1,
          },
          {
            imgSrc: 'img/right-panel/icon-nodetype-2.svg',
            title: 'tSymmetry',
            value: 2,
          },
        ]}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
