import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { useScreenStore } from '@core/app/stores/screenStore';

const open = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => open(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  flux_id_login: {
    flux_plus: {
      features: {
        ai_bg_removal: 'AI Background Removal',
        boxgen: '3D Box Generator',
        dmkt: '1000+ Design Files',
        monotype: '250+ Premium Fonts',
        my_cloud: 'Unlimited Cloud Storage',
      },
      learn_more: 'Learn More',
      website_url: 'https://website_url',
    },
  },
}));

jest.mock('@core/helpers/is-flux-plus-active', () => true);

const onClose = jest.fn();

import FluxPlusModal from './FluxPlusModal';

describe('test FluxPlusModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render correctly', () => {
    const { baseElement } = render(
      <FluxPlusModal className="mock-class" onClose={onClose}>
        <div>mock-children</div>
      </FluxPlusModal>,
    );

    expect(baseElement).toMatchSnapshot();

    fireEvent.click(baseElement.querySelector('.button'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('https://website_url');

    fireEvent.click(baseElement.querySelector('.ant-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('mobile', () => {
    useScreenStore.setState({ isMobile: true });

    const { baseElement } = render(
      <FluxPlusModal className="mock-class" onClose={onClose}>
        <div>mock-children</div>
      </FluxPlusModal>,
    );

    expect(baseElement).toMatchSnapshot();
  });

  test('mobile with hideMobileBanner', () => {
    useScreenStore.setState({ isMobile: true });

    const { baseElement } = render(
      <FluxPlusModal className="mock-class" hideMobileBanner onClose={onClose}>
        <div>mock-children</div>
      </FluxPlusModal>,
    );

    expect(baseElement.querySelector('.banner')).not.toBeInTheDocument();
  });
});
