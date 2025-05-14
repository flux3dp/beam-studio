import type { Dispatch, SetStateAction } from 'react';

import type { Message } from '../../store/useChatStore';

import { processDifyJsonEvent } from './processDifyJsonEvent';
import { DIFY_API_BASE_URL, DIFY_API_KEY, ERROR_MESSAGE } from './utils';

export interface FetchDifyResponseParams {
  abortSignal?: AbortSignal;
  conversationId?: string;
  setConversationId: (conversationId?: string) => void;
  setCurrentBotMessageId: (currentBotMessageId?: string) => void;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  text: string;
  userId: string;
}

export const fetchDifyStreamedResponse = async ({
  abortSignal, // Allow parent to pass an AbortSignal
  conversationId,
  setConversationId,
  setCurrentBotMessageId,
  setIsLoading,
  setMessages,
  text,
  userId,
}: FetchDifyResponseParams): Promise<void> => {
  setIsLoading(true);
  // Ensure the initial bot message placeholder is cleared of previous text/error
  // setMessages((prev) =>
  //   prev.map((msg) => (msg.id === currentBotMessageId ? { ...msg, isError: false, text: '' } : msg)),
  // );

  const url = `${DIFY_API_BASE_URL}/chat-messages`;
  const headers = {
    Authorization: `Bearer ${DIFY_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const bodyPayload = {
    conversation_id: conversationId,
    inputs: {},
    query: text,
    response_mode: 'streaming',
    user: userId,
  };

  const firstMessageReceived = { current: false };
  let streamBuffer = '';
  let streamProcessingError = false;
  let serverStreamEndedCleanly = false; // True if 'message_end' is received
  let currentBotMessageId = 'place_holder'; // Placeholder ID for the initial message

  try {
    const response = await fetch(url, {
      body: JSON.stringify(bodyPayload),
      headers,
      method: 'POST',
      signal: abortSignal,
    });

    if (!response.ok) {
      let errorData: any = { message: `HTTP error! Status: ${response.status}` };

      try {
        errorData = await response.json();
      } catch (_err) {
        // Failed to parse JSON error, use status text or generic message
        errorData.message = response.statusText || errorData.message;
      }
      console.error('Dify API HTTP Error:', response.status, errorData);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === currentBotMessageId ? { ...msg, isError: true, text: ERROR_MESSAGE } : msg)),
      );
      setConversationId(); // Clear conversation ID on error
      setIsLoading(false); // Ensure loading is stopped

      return;
    }

    if (!response.body) {
      throw new Error('Response body is null, cannot read stream.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let doneReading = false;

    while (!doneReading && !streamProcessingError) {
      if (abortSignal?.aborted) {
        console.log('Dify Stream: Fetch aborted by client.');
        reader.cancel('Fetch aborted by client'); // Attempt to cancel the reader
        streamProcessingError = true; // Treat as an error to stop processing
        break;
      }

      const { done, value } = await reader.read();

      doneReading = done;

      if (value) {
        streamBuffer += decoder.decode(value, { stream: true });

        // Process all complete SSE event blocks from the buffer
        let eventBoundaryIndex;

        while ((eventBoundaryIndex = streamBuffer.indexOf('\n\n')) >= 0 && !streamProcessingError) {
          const eventBlockString = streamBuffer.substring(0, eventBoundaryIndex);

          streamBuffer = streamBuffer.substring(eventBoundaryIndex + 2); // Consume the block and its delimiter

          // An SSE event block can have multiple lines (event:, id:, data:, retry:)
          // We are primarily interested in 'data:' lines for Dify's JSON payload.
          const lines = eventBlockString.split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('data:')) {
              const jsonDataString = trimmedLine.substring(5).trim();

              if (jsonDataString) {
                const result = processDifyJsonEvent({
                  firstMessageReceived,
                  jsonString: jsonDataString,
                  setConversationId,
                  setCurrentBotMessageId,
                  setMessages,
                });

                if (result.errorOccurred) {
                  streamProcessingError = true;
                  break; // Stop processing lines in this block
                }

                if (result.streamProperlyEnded) {
                  serverStreamEndedCleanly = true;
                  doneReading = true; // Signal to stop reading from network
                  break; // Stop processing lines, effectively ending stream handling
                }
              }
            }
          }
        }
      }
    }

    if (doneReading && !serverStreamEndedCleanly && !streamProcessingError) {
      console.warn('Dify Stream: Connection ended without a "message_end" event.');
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Dify Stream: Fetch operation was aborted.');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentBotMessageId ? { ...msg, isError: true, text: 'Request cancelled.' } : msg,
        ),
      );
    } else {
      console.error('Failed to fetch or process Dify streamed response (Outer Catch):', error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === currentBotMessageId ? { ...msg, isError: true, text: ERROR_MESSAGE } : msg)),
      );
      setConversationId(); // Clear conversation ID on error
    }
  } finally {
    setIsLoading(false);
  }
};
