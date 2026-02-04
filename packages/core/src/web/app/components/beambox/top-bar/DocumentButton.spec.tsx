import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import DocumentButton from './DocumentButton';

const mockShowDocumentSettings = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showDocumentSettings: (...args) => mockShowDocumentSettings(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
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
    expect(mockShowDocumentSettings).not.toHaveBeenCalled();
    fireEvent.click(container.firstChild);
    expect(mockShowDocumentSettings).toHaveBeenCalledTimes(1);
  });
});
