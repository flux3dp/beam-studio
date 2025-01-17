/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import langEn from 'app/lang/en';

const mockGetLang = jest.fn();
jest.mock('helpers/i18n', () => ({
  getActiveLang: mockGetLang,
  lang: langEn,
}));

const mockOpen = jest.fn();
jest.mock('implementations/browser', () => ({
  open: mockOpen,
}));

const mockOnClose = jest.fn();

import SocialMediaModal from './SocialMediaModal';

describe('test SocialMediaModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    mockGetLang.mockReturnValue('en');
    const { baseElement } = render(<SocialMediaModal onClose={mockOnClose} />);
    expect(baseElement).toMatchSnapshot();

    const img = baseElement.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('core-img/social-media/instagram-global.png');

    const link = baseElement.querySelector('.name');
    expect(link).not.toBeNull();
    fireEvent.click(link);
    expect(mockOpen).toBeCalledWith('https://www.instagram.com/flux_inc/');
  });

  it('should render correctly with zh-tw lang', () => {
    mockGetLang.mockReturnValue('zh-tw');
    const { baseElement } = render(<SocialMediaModal onClose={mockOnClose} />);
    expect(baseElement).toMatchSnapshot();

    const img = baseElement.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('core-img/social-media/instagram-taiwan.png');

    const link = baseElement.querySelector('.name');
    expect(link).not.toBeNull();
    fireEvent.click(link);
    expect(mockOpen).toBeCalledWith('https://www.instagram.com/fluxinctaiwan/');
  });
});
