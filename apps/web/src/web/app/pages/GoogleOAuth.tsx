import socialAuth from 'helpers/social-auth';
import { G_REDIRECT_URI, signInWithGoogleCode } from 'helpers/api/flux-id';

function GoogleOAuth(): JSX.Element {
  const [, ...params] = window.location.hash.split('?');
  const [codeParam] = params.join('?').split('&');
  signInWithGoogleCode({
    code: codeParam.split('=')[1],
    redirect_url: decodeURIComponent(G_REDIRECT_URI),
  }).then(socialAuth);
  return null;
}

export default GoogleOAuth;
