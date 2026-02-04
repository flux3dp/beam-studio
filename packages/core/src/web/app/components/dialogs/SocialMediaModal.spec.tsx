import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import langEn from '@core/app/lang/en';

const mockGetLang = jest.fn();

jest.mock('@core/helpers/i18n', () => ({
  getActiveLang: () => mockGetLang(),
  lang: langEn,
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

const mockConfigWrite = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  write: (...args) => mockConfigWrite(...args),
}));

const mockOnClose = jest.fn();

import SocialMediaModal from './SocialMediaModal';

describe('test SocialMediaModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    mockGetLang.mockReturnValue('en');

    const { baseElement, getByText } = render(<SocialMediaModal onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();

    const img = baseElement.querySelector('img');

    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('core-img/social-media/instagram-global.png');

    const link = baseElement.querySelector('.name');

    expect(link).not.toBeNull();
    fireEvent.click(link);
    expect(mockOpen).toHaveBeenCalledWith('https://www.instagram.com/flux_inc/');

    const closeButton = getByText('Close');

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
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
    expect(mockOpen).toHaveBeenCalledWith('https://www.instagram.com/fluxinctaiwan/');
  });

  it('should render correctly with autoPopup flag', () => {
    mockGetLang.mockReturnValue('en');

    const { baseElement, getByText } = render(<SocialMediaModal autoPopup onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();

    const img = baseElement.querySelector('img');

    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('core-img/social-media/instagram-global.png');

    const link = baseElement.querySelector('.name');

    expect(link).not.toBeNull();
    fireEvent.click(link);
    expect(mockOpen).toHaveBeenCalledWith('https://www.instagram.com/flux_inc/');

    const checkbox = baseElement.querySelector('input[type="checkbox"]');

    fireEvent.click(checkbox);
    expect(checkbox.getAttribute('value')).toBe('true');

    const closeButton = getByText('Close');

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockConfigWrite).toHaveBeenCalledTimes(1);
    expect(mockConfigWrite).toHaveBeenCalledWith('skip-social-media-invitation', true);
  });
});
