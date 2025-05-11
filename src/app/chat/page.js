'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Avatar,
  message,
  Tooltip
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  DeleteOutlined,
  DownOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import styles from '../styles/chat.module.css';
import ReactMarkdown from 'react-markdown';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  const abortControllerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messageListRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = (force = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: force ? 'auto' : 'smooth',
        block: 'end',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamedMessage]);

  useEffect(() => {
    const handleScroll = () => {
      if (messageListRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom);
      }
    };

    const messageList = messageListRef.current;
    if (messageList) {
      messageList.addEventListener('scroll', handleScroll);
      return () => messageList.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage = input.trim();
    setInput('');
    setIsTyping(true);

    const timestamp = new Date().toLocaleTimeString();
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage, timestamp }
    ];
    setMessages(newMessages);
    scrollToBottom(true);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedMessage = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          streamedMessage += chunk;
          setCurrentStreamedMessage(streamedMessage);
          scrollToBottom();
        }

        const botTimestamp = new Date().toLocaleTimeString();
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: streamedMessage, timestamp: botTimestamp }
        ]);
        setCurrentStreamedMessage('');
      } catch (streamError) {
        if (streamError.name === 'AbortError') {
          console.log('Stream was cancelled');
        } else {
          throw streamError;
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
      } else {
        console.error('Chat error:', error);
        message.error(error.message || 'Failed to get response from the chatbot');
        const errorTimestamp = new Date().toLocaleTimeString();
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '❌ Sorry, I encountered an error. Please try again.',
            timestamp: errorTimestamp,
            isError: true
          }
        ]);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentStreamedMessage('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    message.success('Chat history cleared');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';

    return (
      <div
        key={index}
        className={`${styles.message} ${isUser ? styles.userMessage : styles.botMessage}`}
      >
        <Avatar
          icon={isUser ? <UserOutlined /> : <RobotOutlined />}
          className={styles.avatar}
          style={{
            backgroundColor: isUser ? '#1890ff' : (msg.isError ? '#ff4d4f' : '#52c41a')
          }}
        />
        <div className={styles.messageContent}>
          <ReactMarkdown className={styles.markdown}>
            {msg.content}
          </ReactMarkdown>
          <div className={styles.timestamp}>{msg.timestamp}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          <RobotOutlined /> AI Assistant
        </Title>
        <Text className={styles.subtitle}>
          Your personal AI assistant powered by Google Gemini Pro
        </Text>
      </div>

      <Card style={{ "padding": '0 12px' }} className={styles.chatCard} bordered={false}>
        <div className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <RobotOutlined className={styles.botIcon} />
            <div>
              <Text strong>AI Assistant</Text>
              <Text type="secondary" className={styles.status}>
                {isTyping ? 'Typing...' : 'Online'}
              </Text>
            </div>
          </div>
          <Tooltip title="Clear chat history">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={clearChat}
            />
          </Tooltip>
        </div>

        <div className={styles.messageList} ref={messageListRef}>
          {messages.length === 0 && (
            <div className={styles.welcomeMessage}>
              <Text type="secondary">
                👋 Hi! Type a message to start the conversation.
              </Text>
            </div>
          )}
          {messages.map(renderMessage)}
          {currentStreamedMessage && (
            <div className={`${styles.message} ${styles.botMessage}`}>
              <Avatar
                icon={<RobotOutlined />}
                className={styles.avatar}
                style={{ backgroundColor: '#52c41a' }}
              />
              <div className={styles.messageContent}>
                <ReactMarkdown className={styles.markdown}>
                  {currentStreamedMessage}
                </ReactMarkdown>
              </div>
            </div>
          )}
          {isTyping && !currentStreamedMessage && (
            <div className={`${styles.message} ${styles.botMessage}`}>
              <Avatar
                icon={<RobotOutlined />}
                className={styles.avatar}
                style={{ backgroundColor: '#52c41a' }}
              />
              <div className={styles.typingIndicator}>
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputSection}>
          <TextArea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={isTyping}
          />
          <div className={styles.sendIconWrapper}>
            <Tooltip title={isTyping ? 'Assistant is typing...' : 'Send message'}>
              <div
                className={`${styles.sendIcon} ${input.trim() ? styles.sendIconActive : ''}`}
                onClick={input.trim() ? handleSend : undefined}
              >
                <SendOutlined />
              </div>
            </Tooltip>
          </div>
        </div>

        {showScrollButton && (
          <Tooltip title="Scroll to bottom">
            <Button
              type="primary"
              shape="circle"
              icon={<DownOutlined />}
              className={`${styles.scrollButton} ${styles.scrollButtonVisible}`}
              onClick={() => scrollToBottom(true)}
            />
          </Tooltip>
        )}

      </Card>
    </div>
  );
}
