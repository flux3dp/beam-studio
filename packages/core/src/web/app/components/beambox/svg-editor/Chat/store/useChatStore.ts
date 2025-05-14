import type { Dispatch, SetStateAction } from 'react';

import { match, P } from 'ts-pattern';
import { v4 } from 'uuid';
import { create } from 'zustand';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';

export interface DifyBaseEvent {
  conversation_id?: string;
  event: string;
  message_id?: string;
  task_id?: string;
}

export interface DifyMessageEvent extends DifyBaseEvent {
  answer: string;
  conversation_id: string;
  event: 'message';
}

export interface DifyAgentMessageEvent extends DifyBaseEvent {
  answer: string;
  conversation_id: string;
  event: 'agent_message';
}

export interface DifyAgentThoughtEvent extends DifyBaseEvent {
  event: 'agent_thought';
  thought: string;
  tool_input?: string;
  tool_name?: string;
}

export interface DifyMessageEndEvent extends DifyBaseEvent {
  conversation_id: string;
  event: 'message_end';
  metadata?: any; // Metadata about the conversation or message
}

export interface DifyErrorEvent extends DifyBaseEvent {
  code: number; // Dify specific error code
  event: 'error';
  message: string; // Error message from Dify
  status: number; // HTTP-like status code
}

export type DifySSEDataPayload =
  | DifyAgentMessageEvent
  | DifyAgentThoughtEvent
  | DifyErrorEvent
  | DifyMessageEndEvent
  | DifyMessageEvent
  // unhandled events
  | { [key: string]: any; event: string };

export type BotMessage = {
  feedback: 'dislike' | 'like' | null;
  id: string;
  inputQuery?: string;
  options?: string[];
  sender: 'Bot';
  text: string;
};

export type UserMessage = {
  id: string;
  sender: 'User';
  text: string;
};

export type Message = BotMessage | UserMessage;

type State = {
  conversationId?: string;
  currentBotMessageId?: string;
  messages: Message[];
  userId: string;
};

type Action = {
  resetMessages: () => void;
  setConversationId: (conversationId?: string) => void;
  setCurrentBotMessageId: (currentBotMessageId?: string) => void;
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

const initMessage = {
  sender: 'Bot',
  text: 'Hello, this is Beamy, an AI assistant for the FLUX Laser Product, how may I help you?',
} as const;

export const useChatStore = create<Action & State>((set) => ({
  conversationId: undefined,
  currentBotMessageId: undefined,
  messages: [{ id: v4(), ...initMessage } as BotMessage],
  resetMessages: () => set(() => ({ messages: [{ id: v4(), ...initMessage } as BotMessage] })),
  setConversationId: (conversationId) => set(() => ({ conversationId })),
  setCurrentBotMessageId: (currentBotMessageId) => set(() => ({ currentBotMessageId })),
  setMessages: (setter) => set((state) => ({ messages: setter instanceof Function ? setter(state.messages) : setter })),
  userId: match(beamboxPreference.read('chat-user-id'))
    .with(P.nonNullable, (userId) => userId)
    .otherwise(() => {
      const userId = v4();

      beamboxPreference.write('chat-user-id', userId);

      return userId;
    }),
}));
