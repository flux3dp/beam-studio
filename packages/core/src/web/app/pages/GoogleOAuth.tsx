import type { ReactNode } from 'react';

import { getRedirectUri, signInWithGoogleCode } from '@core/helpers/api/flux-id';
import socialAuth from '@core/helpers/social-auth';

function GoogleOAuth(): ReactNode {
  const [, ...params] = window.location.hash.split('?');
  const [codeParam] = params.join('?').split('&');

  signInWithGoogleCode({
    code: codeParam.split('=')[1],
    redirect_url: decodeURIComponent(getRedirectUri(false)),
  }).then(socialAuth);

  return null;
}

export default GoogleOAuth;
