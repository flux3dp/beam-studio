import React from 'react';

import { render } from '@testing-library/react';

import ModalWithHole from './Modal-With-Hole';

test('should render correctly', () => {
  const { container } = render(
    <ModalWithHole
      className="abc"
      holePosition={{
        bottom: 10,
        left: 20,
        right: 20,
        top: 10,
      }}
      holeSize={{
        height: 200,
        width: 100,
      }}
    />,
  );

  expect(container).toMatchSnapshot();
});
