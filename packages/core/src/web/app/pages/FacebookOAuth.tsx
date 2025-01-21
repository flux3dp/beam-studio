import parseQueryData from '@core/helpers/query-data-parser';
import socialAuth from '@core/helpers/social-auth';
import { signInWithFBToken } from '@core/helpers/api/flux-id';

function FacebookOAuth(): JSX.Element {
  const [_, __, params] = window.location.hash.split('#');
  const accessToken = parseQueryData(params).access_token;
  signInWithFBToken(accessToken).then(socialAuth);
  return null;
}

export default FacebookOAuth;
