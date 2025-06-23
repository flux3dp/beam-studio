import { signInWithFBToken } from '@core/helpers/api/flux-id';
import parseQueryData from '@core/helpers/query-data-parser';
import socialAuth from '@core/helpers/social-auth';

function FacebookOAuth(): React.ReactNode {
  const [_, __, params] = window.location.hash.split('#');
  const accessToken = parseQueryData(params).access_token;

  signInWithFBToken(accessToken).then(socialAuth);

  return null;
}

export default FacebookOAuth;
