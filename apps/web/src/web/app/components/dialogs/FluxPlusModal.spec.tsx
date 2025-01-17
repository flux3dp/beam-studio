import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import FluxPlusModal from './FluxPlusModal';

const open = jest.fn();
jest.mock('implementations/browser', () => ({
  open: (...args) => open(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  flux_id_login: {
    flux_plus: {
      learn_more: 'Learn More',
      website_url: 'https://website_url',
      features: {
        ai_bg_removal: 'AI Background Removal',
        my_cloud: 'Unlimited Cloud Storage',
        boxgen: '3D Box Generator',
        dmkt: '1000+ Design Files',
        monotype: '250+ Premium Fonts',
      },
    },
  },
}));

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('helpers/is-flux-plus-active', () => true);

const onClose = jest.fn();

describe('test FluxPlusModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render correctly', () => {
    const { baseElement } = render(
      <FluxPlusModal className="mock-class" onClose={onClose}>
        <div>mock-children</div>
      </FluxPlusModal>
    );
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(baseElement.querySelector('.button'));
    expect(open).toBeCalledTimes(1);
    expect(open).toBeCalledWith('https://website_url');

    fireEvent.click(baseElement.querySelector('.ant-modal-close'));
    expect(onClose).toBeCalledTimes(1);
  });

  test('mobile', () => {
    useIsMobile.mockReturnValue(true);
    const { baseElement } = render(
      <FluxPlusModal className="mock-class" onClose={onClose}>
        <div>mock-children</div>
      </FluxPlusModal>
    );
    expect(baseElement).toMatchSnapshot();
  });

  test('mobile with hideMobileBanner', () => {
    useIsMobile.mockReturnValue(true);
    const { baseElement } = render(
      <FluxPlusModal className="mock-class" onClose={onClose} hideMobileBanner>
        <div>mock-children</div>
      </FluxPlusModal>
    );
    expect(baseElement.querySelector('.banner')).not.toBeInTheDocument();
  });
});
