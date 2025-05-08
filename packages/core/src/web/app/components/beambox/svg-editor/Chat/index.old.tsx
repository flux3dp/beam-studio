import type { ChangeEvent } from 'react';
import React, { useEffect, useRef, useState } from 'react'; // Import React hooks and types

import { Button, Flex, Input, List, Space } from 'antd'; // Import necessary Ant Design components

type Message = {
  id: number;
  options?: string[]; // Optional array of strings for interactive options (usually for bot messages)
  sender: 'Bot' | 'User';
  text: string;
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      // options: ['React 基礎', 'Ant Design 用法', 'State 管理'],
      sender: 'Bot',
      text: 'Hello, this is Bibi, an AI assistant for the FLUX Laser Product, how may I help you?',
    },
    // { id: 2, sender: 'User', text: '我想問一個關於 Ant Design 用法的問題。' },
    // { id: 3, sender: 'Bot', text: '好的，關於 Ant Design 的哪個元件或用法你有疑問呢？' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSend = (textToSend?: string) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputValue).trim();

    if (text === '') return;

    const newMessageId = messages.length > 0 ? messages[messages.length - 1].id + 1 : 1;

    setMessages((prev) => [...prev, { id: newMessageId, sender: 'User', text }]);

    // If the message was sent via the input field (not an option click), clear the input
    if (typeof textToSend !== 'string') {
      setInputValue('');
    }

    // --- Simulate Bot Response ---
    // In a real app, this section would involve sending 'text' to a backend/API
    // and receiving a response asynchronously.
    const botResponseId = newMessageId + 1; // ID for the bot's response message
    let botReplyText = `收到你的訊息：'${text}'。`; // Default bot reply (in Chinese)
    let botOptions: string[] | undefined = undefined; // Variable to hold potential options for the bot reply

    // Simple logic to generate different bot replies based on user input
    if (text === 'React 基礎') {
      botReplyText =
        'React 是一個用於建立使用者介面的 JavaScript 函式庫。你想知道關於元件、JSX 還是 Props/State 的更多資訊？';
      botOptions = ['元件', 'JSX', 'Props/State']; // Set options for the next interaction
    } else if (text === 'Ant Design 用法') {
      botReplyText = 'Ant Design 提供豐富的 UI 元件。你可以指定想了解的元件，例如 Button, Form, Table 等。';
    } else if (text === 'State 管理') {
      botReplyText =
        'React 的 State 管理有多種方式，例如 useState, useReducer, Context API，以及 Redux, Zustand 等外部函式庫。你想深入了解哪一種？';
      botOptions = ['useState', 'Context API', 'Redux', '其他']; // Set options
    } else if (
      // Basic keyword checking for a generic response
      text.toLowerCase().includes('問題') ||
      text.toLowerCase().includes('元件') ||
      text.toLowerCase().includes('jsx') ||
      text.toLowerCase().includes('props/state') ||
      text.toLowerCase().includes('usestate') ||
      text.toLowerCase().includes('context api') ||
      text.toLowerCase().includes('redux')
    ) {
      botReplyText = '請更詳細地描述你的問題，或告訴我你想了解的具體方面。';
    }

    // Simulate network delay before showing the bot's response
    setTimeout(() => {
      const botMessage: Message = {
        id: botResponseId,
        options: botOptions ?? undefined,
        sender: 'Bot',
        text: botReplyText,
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
    // --- End of Simulation ---
  };

  const handleOptionClick = (optionText: string) => {
    handleSend(optionText);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ backgroundColor: '#DAEDFF', flexGrow: 1, overflowY: 'auto', padding: '16px' }}>
        <List
          dataSource={messages}
          renderItem={(item) => {
            const isUser = item.sender === 'User';
            const alignStyle: React.CSSProperties = {
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start', // Align right for user, left for bot
              marginBottom: '20px',
              width: '100%',
            };
            const bubbleStyle: React.CSSProperties = {
              backgroundColor: isUser ? '#1890FF' : '#FCFDFE',
              borderRadius: '12px',
              color: isUser ? 'white' : 'black',
              maxWidth: '80%',
              overflowWrap: 'break-word',
              padding: '10px 15px',
            };

            const optionButtonStyle = {
              // backgroundColor: 'white',
              color: '#1890FF',
              margin: '4px 4px 0 0',
            };

            return (
              <List.Item style={{ border: 'none', padding: '0' }}>
                <div style={alignStyle}>
                  <div style={bubbleStyle}>
                    {item.text}
                    {item.sender === 'Bot' && item.options && (
                      <div
                        style={{
                          borderTop: item.text ? '1px solid rgba(0,0,0,0.1)' : 'none',
                          marginTop: '8px',
                          paddingTop: '5px',
                        }}
                      >
                        {item.options.length ? (
                          <Flex vertical>
                            {item.options.map((option, index) => (
                              <Button
                                key={index}
                                onClick={() => handleOptionClick(option)}
                                size="small"
                                style={optionButtonStyle}
                              >
                                {option}
                              </Button>
                            ))}
                          </Flex>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </List.Item>
            );
          }}
          split={false}
        />
        <div ref={messagesEndRef} />
      </div>
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            onChange={handleInputChange}
            onPressEnter={() => handleSend()}
            placeholder="輸入訊息..."
            value={inputValue}
          />
          <Button onClick={() => handleSend()} type="primary">
            發送
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
};

export default Chat;
