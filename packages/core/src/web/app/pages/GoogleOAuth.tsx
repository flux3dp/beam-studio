import { G_REDIRECT_URI, signInWithGoogleCode } from '@core/helpers/api/flux-id';
import socialAuth from '@core/helpers/social-auth';

function GoogleOAuth(): React.JSX.Element {
  const [, ...params] = window.location.hash.split('?');
  const [codeParam] = params.join('?').split('&');

  signInWithGoogleCode({
    code: codeParam.split('=')[1],
    redirect_url: decodeURIComponent(G_REDIRECT_URI),
  }).then(socialAuth);

  return null;
}

export default GoogleOAuth;
