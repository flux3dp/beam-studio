import type { Dispatch, SetStateAction } from 'react';

import { match, P } from 'ts-pattern';

import type { DifySSEDataPayload, Message } from '../../store/useChatStore';

import { ERROR_MESSAGE } from './utils';

type ProcessDifyJsonEventParams = {
  firstMessageReceived: { current: boolean };
  jsonString: string;
  setConversationId: (conversationId?: string) => void;
  setCurrentBotMessageId: (currentBotMessageId?: string) => void;
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

export const processDifyJsonEvent = ({
  firstMessageReceived,
  jsonString,
  setConversationId,
  setCurrentBotMessageId,
  setMessages,
}: ProcessDifyJsonEventParams): { errorOccurred: boolean; streamProperlyEnded: boolean } => {
  try {
    const jsonData = JSON.parse(jsonString) as DifySSEDataPayload;
    let currentBotMessageId = jsonData.message_id;

    setCurrentBotMessageId(currentBotMessageId);

    setMessages((prevMessages) =>
      prevMessages.map((msg) => (msg.id === 'place_holder' ? { ...msg, id: currentBotMessageId } : msg)),
    );

    // Optional: Log every event in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Dify SSE Event:', jsonData);
    }

    match(jsonData)
      .with({ event: P.union('message', 'agent_message') }, (eventData) => {
        const answerChunk = eventData.answer;
        const newConversationId = eventData.conversation_id;

        if (newConversationId && !firstMessageReceived.current) {
          setConversationId(newConversationId);
          firstMessageReceived.current = true;
        }

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === currentBotMessageId ? { ...msg, isError: false, text: (msg.text || '') + answerChunk } : msg,
          ),
        );
      })
      .with({ event: 'agent_thought' }, (eventData) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Dify Agent Thought Event:', eventData);
        }
      })
      .with({ event: 'message_end' }, (eventData) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            'Dify Stream: Message End. Conversation ID:',
            eventData.conversation_id,
            'Metadata:',
            eventData.metadata,
          );
        }

        if (eventData.conversation_id && !firstMessageReceived.current) {
          setConversationId(eventData.conversation_id);
          firstMessageReceived.current = true; // Ensure ID is set if somehow missed
        }

        return { errorOccurred: false, streamProperlyEnded: true };
      })
      .with({ event: 'error' }, (eventData) => {
        console.error(
          'Dify Stream Error Event:',
          `Status: ${eventData.status}, Code: ${eventData.code}, Message: ${eventData.message}`,
        );
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === currentBotMessageId ? { ...msg, isError: true, text: ERROR_MESSAGE } : msg,
          ),
        );

        setConversationId();

        return { errorOccurred: true, streamProperlyEnded: false }; // Error means stream didn't end properly
      })
      .with({ event: P.union('workflow_started', 'workflow_finished', 'node_started', 'node_finished') }, () => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Dify Workflow Event: ${jsonData.event}`, jsonData);
        }
      })
      .otherwise((eventData) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            'Dify Stream: Received unhandled or unknown event type from JSON data:',
            eventData.event,
            eventData,
          );
        }
      });

    return { errorOccurred: false, streamProperlyEnded: false };
  } catch (e) {
    console.error('Error parsing Dify SSE JSON data:', e, '\nProblematic JSON string:', jsonString);

    setMessages((prevMessages) =>
      prevMessages.map((msg) => (msg.id === 'place_holder' ? { ...msg, isError: true, text: ERROR_MESSAGE } : msg)),
    );

    setConversationId();

    return { errorOccurred: true, streamProperlyEnded: false };
  }
};
