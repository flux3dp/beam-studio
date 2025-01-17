import parseQueryData from 'helpers/query-data-parser';
import socialAuth from 'helpers/social-auth';
import { signInWithFBToken } from 'helpers/api/flux-id';

function FacebookOAuth(): JSX.Element {
  const [_, __, params] = window.location.hash.split('#');
  const accessToken = parseQueryData(params).access_token;
  signInWithFBToken(accessToken).then(socialAuth);
  return null;
}

export default FacebookOAuth;
