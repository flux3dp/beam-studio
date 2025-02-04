import React, { useEffect, useRef, useState } from 'react';

import type { InputRef } from 'antd';
import { Button, Divider, Form, Input, Space } from 'antd';
import classNames from 'classnames';

import alert from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import {
  externalLinkFBSignIn,
  externalLinkGoogleSignIn,
  fluxIDEvents,
  signIn,
  signOut,
} from '@core/helpers/api/flux-id';
import isFluxPlusActive from '@core/helpers/is-flux-plus-active';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import storage from '@core/implementations/storage';

import styles from './FluxIdLogin.module.scss';
import FluxPlusModal from './FluxPlusModal';

interface Props {
  onClose: () => void;
  silent: boolean;
}

const FluxIdLogin = ({ onClose, silent }: Props): React.JSX.Element => {
  const lang = useI18n().flux_id_login;

  const emailInput = useRef<InputRef>(null);
  const passwordInput = useRef<InputRef>(null);
  const [isRememberMeChecked, setIsRememberMeChecked] = useState(!!storage.get('keep-flux-id-login'));
  const isMobile = useIsMobile();

  useEffect(() => {
    fluxIDEvents.on('oauth-logged-in', onClose);

    return () => {
      fluxIDEvents.removeListener('oauth-logged-in', onClose);
    };
  }, [onClose]);

  const renderOAuthContent = () => (
    <div className={styles.oauth}>
      <div className={classNames(styles.button, styles.facebook)} onClick={externalLinkFBSignIn}>
        Continue with Facebook
      </div>
      <div className={classNames(styles.button, styles.google)} onClick={externalLinkGoogleSignIn}>
        Continue with Google
      </div>
    </div>
  );

  const handleLogin = async () => {
    const email = emailInput.current.input.value;
    const password = passwordInput.current.input.value;

    await signOut();

    const res = await signIn({
      email,
      expires_session: !isRememberMeChecked,
      password,
    });

    if (res.error) {
      return;
    }

    if (res.status === 'error') {
      if (res.info === 'USER_NOT_FOUND') {
        alert.popUpError({ message: lang.incorrect });
      } else if (res.info === 'NOT_VERIFIED') {
        alert.popUpError({ message: lang.not_verified });
      } else {
        alert.popUpError({ message: res.message });
      }

      return;
    }

    if (res.status === 'ok') {
      console.log('Log in succeeded', res);
      storage.set('keep-flux-id-login', isRememberMeChecked);
      onClose();

      if (!silent) {
        dialogCaller.showFluxCreditDialog();
      }
    }
  };

  return (
    <FluxPlusModal className={styles['flux-login']} hideMobileBanner onClose={onClose}>
      <>
        <div className={styles.title}>{lang.login}</div>
        {renderOAuthContent()}
        <Divider>or</Divider>
        <Form className={styles['login-inputs']}>
          <Form.Item name="email-input">
            <Input
              onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
              placeholder={lang.email}
              ref={emailInput}
            />
          </Form.Item>
          <Form.Item name="password-input">
            <Input.Password
              onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
              placeholder={lang.password}
              ref={passwordInput}
            />
          </Form.Item>
          <div className={styles.options}>
            <div className={styles['remember-me']} onClick={() => setIsRememberMeChecked(!isRememberMeChecked)}>
              <input checked={isRememberMeChecked} onChange={() => {}} type="checkbox" />
              <div>{lang.remember_me}</div>
            </div>
            <div className={styles['forget-password']} onClick={() => browser.open(lang.lost_password_url)}>
              {lang.forget_password}
            </div>
          </div>
        </Form>
        <Space className={styles.footer} direction="vertical">
          <Button block onClick={handleLogin} type="primary">
            {lang.login}
          </Button>
          <Button block onClick={() => browser.open(lang.signup_url)} type="default">
            {lang.register}
          </Button>
          <div className={styles.text}>
            <div onClick={() => onClose()}>{lang.work_offline}</div>
            {isFluxPlusActive && isMobile && (
              <div onClick={() => browser.open(lang.flux_plus.website_url)}>{lang.flux_plus.explore_plans}</div>
            )}
          </div>
        </Space>
      </>
    </FluxPlusModal>
  );
};

export default FluxIdLogin;
