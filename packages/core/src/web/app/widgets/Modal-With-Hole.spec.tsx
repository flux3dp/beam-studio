import React from 'react';
import { render } from '@testing-library/react';

import ModalWithHole from './Modal-With-Hole';

test('should render correctly', () => {
  const { container } = render(
    <ModalWithHole
      holePosition={{
        top: 10,
        bottom: 10,
        left: 20,
        right: 20,
      }}
      holeSize={{
        width: 100,
        height: 200,
      }}
      className="abc"
    />
  );
  expect(container).toMatchSnapshot();
});
