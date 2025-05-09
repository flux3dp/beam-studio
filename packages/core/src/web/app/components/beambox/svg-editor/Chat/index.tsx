import type { ChangeEvent } from 'react';
import React, { memo, useEffect, useRef, useState } from 'react';

import { CopyOutlined, DislikeOutlined, LikeOutlined, RedoOutlined } from '@ant-design/icons';
import { Button, Flex, Input, List, Spin } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import browser from '@core/implementations/browser';

import styles from './index.module.scss';
import { useChatStore } from './store/useChatStore';
import { fetchDifyStreamedResponse } from './utils/dify/fetchDifyResponse';
import { sendMessageFeedBack } from './utils/dify/sendMessageFeedBack';

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2);

const UnmemorizedChat = () => {
  const { conversationId, currentBotMessageId, messages, setConversationId, setCurrentBotMessageId, setMessages } =
    useChatStore();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const floatingAreaRef = useRef<HTMLDivElement>(null);

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
    setMessages((prev) => [...prev, { id: 'place_holder', sender: 'Bot', text: '' }]);

    await fetchDifyStreamedResponse({
      conversationId,
      setConversationId,
      setCurrentBotMessageId,
      setIsLoading,
      setMessages,
      text,
    });
    setCurrentBotMessageId();
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
          itemLayout="vertical"
          renderItem={(item) => {
            const isUser = item.sender === 'User';
            // const showSpinner = true;
            const showSpinner = isLoading && item.id === currentBotMessageId && item.text === '';
            const alignerClasses = `${styles.messageAligner} ${isUser ? styles.user : styles.bot}`;
            const bubbleClasses = `${styles.messageBubble} ${isUser ? styles.userBubble : styles.botBubble}`;
            const optionsContainerClasses = `${styles.optionsContainer} ${item.text ? styles.withBorder : styles.noBorder}`;

            return (
              <List.Item
                actions={
                  isUser
                    ? [
                        <Button
                          disabled={isLoading}
                          icon={<CopyOutlined />}
                          key="copy"
                          onClick={() => navigator.clipboard.writeText(item.text)}
                          size="small"
                        />,
                      ]
                    : [
                        <Button
                          disabled={isLoading}
                          icon={<CopyOutlined />}
                          key="copy"
                          onClick={() => navigator.clipboard.writeText(item.text)}
                          size="small"
                        />,
                        <Button
                          disabled={isLoading}
                          icon={<RedoOutlined />}
                          key="regenerate"
                          onClick={() => handleSend(item.text)}
                          size="small"
                        />,
                        <Button
                          disabled={isLoading}
                          icon={<LikeOutlined />}
                          key="like"
                          onClick={() => sendMessageFeedBack(item.id, 'like')}
                          size="small"
                        />,
                        <Button
                          disabled={isLoading}
                          icon={<DislikeOutlined />}
                          key="dislike"
                          onClick={() => sendMessageFeedBack(item.id, 'dislike')}
                          size="small"
                        />,
                      ].filter(Boolean)
                }
                className={styles.messageListItem}
              >
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
        {/* {isLoading && currentBotMessageId.current === null && (
          <div className={styles.initialSpinnerContainer}>
            <Spin />
          </div>
        )} */}
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
