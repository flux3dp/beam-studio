import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import DocumentButton from './DocumentButton';

const mockShowDocumentSettings = jest.fn();
jest.mock('app/actions/dialog-caller', () => ({
  showDocumentSettings: (...args) => mockShowDocumentSettings(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  topbar: {
    menu: {
      document_setting: 'document_setting',
    },
  },
}));

describe('test DocumentButton', () => {
  it('should render correctly', () => {
    const { container } = render(<DocumentButton />);
    expect(container).toMatchSnapshot();
    expect(mockShowDocumentSettings).not.toBeCalled();
    fireEvent.click(container.firstChild);
    expect(mockShowDocumentSettings).toBeCalledTimes(1);
  });
});
