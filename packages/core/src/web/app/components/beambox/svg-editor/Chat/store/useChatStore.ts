import type { Dispatch, SetStateAction } from 'react';

import { create } from 'zustand';

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

export type Message = {
  id: string;
  options?: string[];
  sender: 'Bot' | 'User';
  text: string;
};

type State = {
  conversationId?: string;
  currentBotMessageId?: string;
  messages: Message[];
};

type Action = {
  resetMessages: () => void;
  setConversationId: (conversationId?: string) => void;
  setCurrentBotMessageId: (currentBotMessageId?: string) => void;
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const useChatStore = create<Action & State>((set, get) => ({
  conversationId: undefined,
  currentBotMessageId: undefined,
  messages: [
    {
      id: generateId(),
      sender: 'Bot',
      text: 'Hello, this is Beamy, an AI assistant for the FLUX Laser Product, how may I help you?',
    },
    //   {
    //     id: generateId(),
    //     sender: 'Bot',
    //     text: `Setting Up Your HEXA and Updating Firmware
    // I'd be happy to guide you through setting up your FLUX HEXA laser cutter and updating its firmware. Here's a comprehensive guide:

    // Firmware Update Options
    // You have three different methods to update your HEXA's firmware:

    // 1. Using the Machine's Panel (Easiest Method)
    // This is the most straightforward approach:

    // Navigate to "MACHINE → Settings → Update the Latest Firmware" directly on your HEXA's control panel
    // The machine will automatically connect to FLUX servers and download the latest firmware
    // Follow the on-screen prompts to complete the installation
    // 2. Using Beam Studio
    // If you prefer updating through the Beam Studio software:

    // First, download the latest firmware from the official FLUX website:
    // Go to https://flux3dp.com/downloads/
    // Select the latest firmware version for HEXA
    // In Beam Studio, go to "Machine → Update Firmware"
    // Select the firmware file you downloaded
    // Follow the on-screen instructions to complete the update
    // 3. Using a USB Drive
    // If your machine is having connectivity issues, the USB method is reliable:

    // Prepare a USB flash drive (must be ≤64GB and formatted as FAT32)
    // Download the firmware from https://flux3dp.com/downloads/
    // Rename the firmware file to "autoupdate.fxfw"
    // Copy this file to your USB drive
    // Plug the USB drive into your HEXA
    // Reboot the machine
    // The update process will automatically start and take approximately 3-5 minutes
    // ⚠️ Important Note: If your current firmware version is 3.2.6 or earlier, USB updates won't work. In this case, you'll need to reflash the firmware directly onto an SD card. The process for this is detailed in a separate article at: https://support.flux3dp.com/hc/en-us/articles/5295145161231-5-24-HEXA-Reflashing-SD-Card

    // Setting Up HEXA with LightBurn (Optional)
    // If you plan to use LightBurn software with your HEXA:

    // Update your HEXA firmware to v4.2.1 or above using one of the methods described above
    // Download the HEXA configuration file: HEXA_Preset
    // Install the necessary drivers (details in this article: LightBurn Bridge Cable - Driver Installation)
    // Recommended Settings for HEXA
    // When using your HEXA, here are some recommended starting settings:

    // For Wood Engraving:

    // Power: 18.0%
    // Speed: 150.0 mm/s
    // Execute: 1 time
    // Overscanning: 4%
    // For Acrylic Engraving:

    // Power: 18.0%
    // Speed: 150.0 mm/s
    // Execute: 1 time
    // Overscanning: 4%
    // Additional Machine Management Options
    // Through Beam Studio, you can also:

    // Test Network Settings: To check connection quality between your computer and HEXA
    // Calibrate Camera: Set up the camera for different add-ons
    // Update Firmware: As detailed above
    // If you encounter any issues during setup or have additional questions, please let me know! For the most current information, you can also refer to the original support articles at:

    // https://support.flux3dp.com/hc/en-us/articles/9667674494223
    // https://support.flux3dp.com/hc/en-us/articles/8722287935247`,
    //   },
  ],
  resetMessages: () => {
    const { messages } = get();

    console.log('resetMessages', messages);

    return set(() => ({
      messages: [
        {
          id: generateId(),
          sender: 'Bot',
          text: 'Hello, this is Beamy, an AI assistant for the FLUX Laser Product, how may I help you?',
        },
      ],
    }));
  },
  setConversationId: (conversationId) => set(() => ({ conversationId })),
  setCurrentBotMessageId: (currentBotMessageId) => set(() => ({ currentBotMessageId })),
  setMessages: (setter) => set((state) => ({ messages: setter instanceof Function ? setter(state.messages) : setter })),
}));
