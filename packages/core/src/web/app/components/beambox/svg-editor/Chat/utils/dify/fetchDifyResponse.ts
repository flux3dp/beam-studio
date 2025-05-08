import type { Dispatch, SetStateAction } from 'react';

const DIFY_API_KEY = '';
const DIFY_API_BASE_URL = '';
const DIFY_USER_ID = '';

// Unified error message
const ERROR_MESSAGE = 'Sorry, I encountered an error while processing your request. Please try again later.';

export type Message = {
  id: string;
  options?: string[];
  sender: 'Bot' | 'User';
  text: string;
};

export const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2);

interface FetchDifyResponseParams {
  conversationId: null | string;
  currentBotMessageId: string;
  setConversationId: Dispatch<SetStateAction<null | string>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  text: string;
}

export const fetchDifyStreamedResponse = async ({
  conversationId,
  currentBotMessageId,
  setConversationId,
  setIsLoading,
  setMessages,
  text,
}: FetchDifyResponseParams): Promise<void> => {
  setIsLoading(true);

  const url = `${DIFY_API_BASE_URL}/chat-messages`;
  const headers = {
    Authorization: `Bearer ${DIFY_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({
    conversation_id: conversationId || undefined,
    inputs: {},
    query: text,
    response_mode: 'streaming',
    user: DIFY_USER_ID,
  });

  try {
    const response = await fetch(url, { body, headers, method: 'POST' });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;

      console.error('Dify API HTTP Error:', response.status, errorData);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === currentBotMessageId ? { ...msg, text: ERROR_MESSAGE } : msg)),
      );
      setConversationId(null); // Reset conversation on error

      return;
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let accumulatedData = '';
    let firstMessageReceived = false;
    let streamErrorOccurred = false;

    while (!done && !streamErrorOccurred) {
      const { done: readerDone, value } = await reader.read();

      done = readerDone;

      if (value) {
        accumulatedData += decoder.decode(value, { stream: true });

        const eventStrings = accumulatedData.split('\n\n');

        for (let i = 0; i < eventStrings.length - 1; i++) {
          const eventStr = eventStrings[i].trim();

          if (eventStr.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(eventStr.substring(6)) as any;

              if (jsonData.event === 'message') {
                const answerChunk = jsonData.answer;
                const newConversationId = jsonData.conversation_id;

                if (newConversationId && !firstMessageReceived) {
                  setConversationId(newConversationId);
                  firstMessageReceived = true;
                }

                setMessages((prev) =>
                  prev.map((msg) => (msg.id === currentBotMessageId ? { ...msg, text: msg.text + answerChunk } : msg)),
                );
              } else if (jsonData.event === 'message_end') {
                console.log('Message stream ended. Conversation ID:', jsonData.conversation_id);

                if (jsonData.conversation_id && !firstMessageReceived) {
                  setConversationId(jsonData.conversation_id);
                }
                // The loop will terminate based on 'done' flag
              } else if (jsonData.event === 'agent_message') {
                const agentAnswerChunk = jsonData.answer;

                console.log('Agent Message:', agentAnswerChunk);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === currentBotMessageId ? { ...msg, text: msg.text + agentAnswerChunk } : msg,
                  ),
                );
              } else if (jsonData.event === 'error') {
                console.error('Dify Stream Error Event:', jsonData);
                streamErrorOccurred = true;
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === currentBotMessageId ? { ...msg, text: ERROR_MESSAGE } : msg)),
                );
                setConversationId(null);
                break;
              }
            } catch (e) {
              console.error('Error parsing Dify SSE data:', e, eventStr);
              streamErrorOccurred = true;
              setMessages((prev) =>
                prev.map((msg) => (msg.id === currentBotMessageId ? { ...msg, text: ERROR_MESSAGE } : msg)),
              );
              setConversationId(null);
              break;
            }
          }
        }
        accumulatedData = eventStrings[eventStrings.length - 1];
      }
    }
  } catch (error) {
    console.error('Failed to fetch Dify response (Network/Catch):', error);
    setMessages((prev) => prev.map((msg) => (msg.id === currentBotMessageId ? { ...msg, text: ERROR_MESSAGE } : msg)));
    setConversationId(null);
  } finally {
    setIsLoading(false);
    // currentBotMessageId is managed by the component, no need to nullify here directly
    // The component will clear its ref after this promise resolves or rejects.
  }
};
