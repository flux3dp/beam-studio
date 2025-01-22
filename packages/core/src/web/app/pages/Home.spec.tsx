import React from 'react';

import { render } from '@testing-library/react';
import classNames from 'classnames';

jest.mock('@core/helpers/i18n', () => ({
  getActiveLang: () => 'en',
  lang: {
    initialize: {
      next: 'Next',
      select_language: 'Select Language',
    },
  },
  setActiveLang: jest.fn(),
}));

jest.mock('@app/implementations/menu', () => ({
  updateLanguage: jest.fn(),
}));

jest.mock('@core/app/widgets/Modal', () => ({ className, content }: any) => (
  <div className={classNames(className)}>{content}</div>
));

import Home from './Home';

test('should render correctly', () => {
  const { container } = render(<Home />);

  expect(container).toMatchSnapshot();
});
