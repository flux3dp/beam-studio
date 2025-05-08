import type { ChangeEvent } from 'react';
import React, { memo, useEffect, useRef, useState } from 'react';

import { Button, Flex, Input, List, Spin } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import browser from '@core/implementations/browser';

import styles from './index.module.scss';
import { fetchDifyStreamedResponse, generateId } from './utils/dify/fetchDifyResponse';

type Message = {
  id: string;
  options?: string[];
  sender: 'Bot' | 'User';
  text: string;
};

const UnmemorizedChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      sender: 'Bot',
      text: 'Hello, this is Beamy, an AI assistant for the FLUX Laser Product, how may I help you?',
    },
    {
      id: generateId(),
      sender: 'Bot',
      text: `Setting Up Your HEXA and Updating Firmware
I'd be happy to guide you through setting up your FLUX HEXA laser cutter and updating its firmware. Here's a comprehensive guide:

Firmware Update Options
You have three different methods to update your HEXA's firmware:

1. Using the Machine's Panel (Easiest Method)
This is the most straightforward approach:

Navigate to "MACHINE → Settings → Update the Latest Firmware" directly on your HEXA's control panel
The machine will automatically connect to FLUX servers and download the latest firmware
Follow the on-screen prompts to complete the installation
2. Using Beam Studio
If you prefer updating through the Beam Studio software:

First, download the latest firmware from the official FLUX website:
Go to https://flux3dp.com/downloads/
Select the latest firmware version for HEXA
In Beam Studio, go to "Machine → Update Firmware"
Select the firmware file you downloaded
Follow the on-screen instructions to complete the update
3. Using a USB Drive
If your machine is having connectivity issues, the USB method is reliable:

Prepare a USB flash drive (must be ≤64GB and formatted as FAT32)
Download the firmware from https://flux3dp.com/downloads/
Rename the firmware file to "autoupdate.fxfw"
Copy this file to your USB drive
Plug the USB drive into your HEXA
Reboot the machine
The update process will automatically start and take approximately 3-5 minutes
⚠️ Important Note: If your current firmware version is 3.2.6 or earlier, USB updates won't work. In this case, you'll need to reflash the firmware directly onto an SD card. The process for this is detailed in a separate article at: https://support.flux3dp.com/hc/en-us/articles/5295145161231-5-24-HEXA-Reflashing-SD-Card

Setting Up HEXA with LightBurn (Optional)
If you plan to use LightBurn software with your HEXA:

Update your HEXA firmware to v4.2.1 or above using one of the methods described above
Download the HEXA configuration file: HEXA_Preset
Install the necessary drivers (details in this article: LightBurn Bridge Cable - Driver Installation)
Recommended Settings for HEXA
When using your HEXA, here are some recommended starting settings:

For Wood Engraving:

Power: 18.0%
Speed: 150.0 mm/s
Execute: 1 time
Overscanning: 4%
For Acrylic Engraving:

Power: 18.0%
Speed: 150.0 mm/s
Execute: 1 time
Overscanning: 4%
Additional Machine Management Options
Through Beam Studio, you can also:

Test Network Settings: To check connection quality between your computer and HEXA
Calibrate Camera: Set up the camera for different add-ons
Update Firmware: As detailed above
If you encounter any issues during setup or have additional questions, please let me know! For the most current information, you can also refer to the original support articles at:

https://support.flux3dp.com/hc/en-us/articles/9667674494223
https://support.flux3dp.com/hc/en-us/articles/8722287935247`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<null | string>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const floatingAreaRef = useRef<HTMLDivElement>(null);
  const currentBotMessageId = useRef<null | string>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Dynamically adjust messagesArea padding-bottom based on floatingArea height
  useEffect(() => {
    const messagesAreaDiv = messagesEndRef.current?.parentElement; // This should be .messagesArea

    if (!messagesAreaDiv || !floatingAreaRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        const basePadding = 16; // Or parse from existing style if needed

        messagesAreaDiv.style.paddingBottom = `${Math.max(height + basePadding, 52)}px`;
      }
    });

    resizeObserver.observe(floatingAreaRef.current);

    // Set initial padding
    const initialHeight = floatingAreaRef.current.offsetHeight;
    const basePadding = 16;

    if (messagesAreaDiv) {
      messagesAreaDiv.style.paddingBottom = `${Math.max(initialHeight + basePadding, 52)}px`;
    }

    return () => {
      resizeObserver.disconnect();

      if (messagesAreaDiv) {
        messagesAreaDiv.style.paddingBottom = ''; // Reset to CSS defined value on unmount
      }
    };
  }, []); // Ensure this runs after floatingAreaRef is attached

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const callFetchDifyResponse = async (text: string) => {
    const newBotMessageId = generateId();

    currentBotMessageId.current = newBotMessageId;
    setMessages((prev) => [...prev, { id: newBotMessageId, sender: 'Bot', text: '' }]);
    await fetchDifyStreamedResponse({
      conversationId,
      currentBotMessageId: newBotMessageId,
      setConversationId,
      setIsLoading,
      setMessages,
      text,
    });
    currentBotMessageId.current = null;
  };

  const handleSend = (textToSend?: string) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputValue).trim();

    if (text === '' || isLoading) return;

    const newUserMessageId = generateId();

    setMessages((prev) => [...prev, { id: newUserMessageId, sender: 'User', text }]);

    if (typeof textToSend !== 'string') {
      setInputValue('');
    }

    callFetchDifyResponse(text);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline if only Enter is pressed
      handleSend();
    }
    // If Shift + Enter, default behavior (insert newline) is allowed.
  };

  const handleOptionClick = (optionText: string) => {
    if (!isLoading) {
      handleSend(optionText);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesArea}>
        <List
          dataSource={messages}
          renderItem={(item) => {
            const isUser = item.sender === 'User';
            const showSpinner = isLoading && item.id === currentBotMessageId.current && item.text === '';
            const alignerClasses = `${styles.messageAligner} ${isUser ? styles.user : styles.bot}`;
            const bubbleClasses = `${styles.messageBubble} ${isUser ? styles.userBubble : styles.botBubble}`;
            const optionsContainerClasses = `${styles.optionsContainer} ${item.text ? styles.withBorder : styles.noBorder}`;

            return (
              <List.Item className={styles.messageListItem}>
                <div className={alignerClasses}>
                  <div className={bubbleClasses}>
                    {showSpinner ? (
                      <Spin size="small" />
                    ) : isUser ? (
                      item.text
                    ) : (
                      <ReactMarkdown
                        components={{
                          a: ({ children, href, node: _node, ...props }) => (
                            <a
                              href={href}
                              rel="noopener noreferrer"
                              target="_blank"
                              {...props}
                              onClick={(e) => {
                                e.preventDefault();
                                browser.open(href!);
                              }}
                            >
                              {children}
                            </a>
                          ),
                        }}
                        remarkPlugins={[remarkGfm]}
                      >
                        {item.text}
                      </ReactMarkdown>
                    )}
                    {item.sender === 'Bot' && item.options && !isLoading && (
                      <div className={optionsContainerClasses}>
                        <Flex gap="small" wrap="wrap">
                          {item.options.map((option, index) => (
                            <Button
                              className={styles.optionButton}
                              disabled={isLoading}
                              key={index}
                              onClick={() => handleOptionClick(option)}
                              size="small"
                            >
                              {option}
                            </Button>
                          ))}
                        </Flex>
                      </div>
                    )}
                  </div>
                </div>
              </List.Item>
            );
          }}
          split={false}
        />
        {isLoading && currentBotMessageId.current === null && (
          <div className={styles.initialSpinnerContainer}>
            <Spin />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <Flex align="center" className={styles.floatingArea} ref={floatingAreaRef} vertical>
        <div className={styles.inputAreaContainer}>
          <Input.TextArea
            autoSize={{ maxRows: 9, minRows: 2 }}
            className={styles.inputArea}
            disabled={isLoading}
            onChange={handleInputChange}
            onPressEnter={handleInputKeyPress}
            placeholder="Ask Beamy a question."
            value={inputValue}
            variant="borderless"
          />
          <Button className={styles.floatingSendButton} loading={isLoading} onClick={() => handleSend()} type="primary">
            {isLoading ? '' : <LeftPanelIcons.Send />}
          </Button>
        </div>
        <div className={styles.chatDisclaimer}>Beamy can make mistakes. Check important info.</div>
      </Flex>
    </div>
  );
};

const Chat = memo(UnmemorizedChat, () => true);

export default Chat;
