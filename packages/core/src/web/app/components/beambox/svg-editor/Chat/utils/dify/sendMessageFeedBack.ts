import { DIFY_API_BASE_URL, DIFY_API_KEY, DIFY_USER_ID } from './utils';

export const sendMessageFeedBack = async (messageId: string, rating: 'dislike' | 'like' | 'null') => {
  const url = `${DIFY_API_BASE_URL}/messages/${messageId}/feedbacks`;
  const headers = { Authorization: `Bearer ${DIFY_API_KEY}`, 'Content-Type': 'application/json' };

  const response = await fetch(url, { body: JSON.stringify({ rating, user: DIFY_USER_ID }), headers, method: 'POST' });

  if (!response.ok) {
    console.error('Failed to send feedback: ', response.status, response.statusText);
  }

  return response.json();
};
