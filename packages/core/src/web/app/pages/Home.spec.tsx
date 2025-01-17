import classNames from 'classnames';
import React from 'react';
import { render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  getActiveLang: () => 'en',
  setActiveLang: jest.fn(),
  lang: {
    initialize: {
      select_language: 'Select Language',
      next: 'Next',
    },
  },
}));

jest.mock('implementations/menu', () => ({
  updateLanguage: jest.fn(),
}));

jest.mock('app/widgets/Modal', () => ({ className, content }: any) => (
  <div className={classNames(className)}>{content}</div>
));

// eslint-disable-next-line import/first
import Home from './Home';

test('should render correctly', () => {
  const { container } = render(<Home />);
  expect(container).toMatchSnapshot();
});
