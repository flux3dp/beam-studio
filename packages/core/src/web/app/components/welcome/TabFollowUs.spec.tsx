import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockSocialMedia = {
  facebookGroup: {
    link: 'mock-facebookGroup-link',
  },
  instagram: {
    link: 'mock-instagram-link',
    subscribeSrc: 'mock-instagram-subs-src',
  },
  linkedin: {
    link: 'mock-linkedin-link',
  },
  pinterest: {
    link: 'mock-pinterest-link',
  },
  youtube: {
    link: 'mock-youtube-link',
    subscribeSrc: 'mock-youtube-subs-src',
  },
};
const mockGetSocialMedia = jest.fn().mockReturnValue(mockSocialMedia);

jest.mock('@core/app/constants/social-media-constants', () => ({
  getSocialMedia: mockGetSocialMedia,
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: mockOpen,
}));

import TabFollowUs from './TabFollowUs';

describe('test TabFollowUs', () => {
  it('should render correctly', () => {
    const { container, getByText } = render(<TabFollowUs />);

    expect(container).toMatchSnapshot();

    const img = container.querySelector('img');

    fireEvent.click(img);
    expect(mockOpen).toHaveBeenNthCalledWith(1, mockSocialMedia.youtube.link);
    fireEvent.click(getByText('Pinterest'));
    expect(mockOpen).toHaveBeenNthCalledWith(2, mockSocialMedia.pinterest.link);
  });
});
