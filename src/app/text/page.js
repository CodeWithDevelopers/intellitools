'use client';
import { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Row,
  Col,
  message,
  Progress,
  Radio,
  Tooltip,
  Spin,
  Tabs
} from 'antd';
import {
  FileTextOutlined,
  RobotOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  SyncOutlined,
  EditOutlined,
  TranslationOutlined,
  HighlightOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import styles from '../styles/text.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MIN_CHARS = 100;
const IDEAL_CHARS = 500;

const TextPage = () => {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryType, setSummaryType] = useState('extractive');
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('1');

  const getProgressPercent = () => {
    if (text.length >= IDEAL_CHARS) return 100;
    if (text.length < MIN_CHARS) return (text.length / MIN_CHARS) * 100;
    return (text.length / IDEAL_CHARS) * 100;
  };

  const getProgressStatus = () => {
    if (text.length >= MIN_CHARS) return 'success';
    if (text.length > 0) return 'active';
    return 'normal';
  };

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).length;
  };

  const handleSummarize = async () => {
    if (!text.trim()) {
      message.error('Please enter some text to summarize');
      return;
    }

    if (text.length < MIN_CHARS) {
      message.error(`Text must be at least ${MIN_CHARS} characters long`);
      return;
    }

    setLoading(true);
    setSummary('');

    try {
      const response = await fetch('/api/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, type: summaryType }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === 'AI summarization is not properly configured. Please check API key.') {
          message.error('AI summarization is not available. Please try extractive summary instead.');
          setSummaryType('extractive');
        } else {
          throw new Error(error.details || error.error || 'Failed to generate summary');
        }
        return;
      }

      const result = await response.text();
      setSummary(result);
      setActiveTab('2'); // Switch to summary tab after generation
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleCopyText = async () => {
    try {
      const summaryContent = summary.split('---')[1] || summary;
      await navigator.clipboard.writeText(summaryContent.trim());
      message.success('Summary copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy text. Please try again.');
    }
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    handleSummarize();
  };

  const items = [
    {
      key: '1',
      label: (
        <span>
          <EditOutlined /> Input Text
        </span>
      ),
      children: (
        <div className={styles.inputSection}>
          <TextArea
            placeholder="Paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={styles.textInput}
            rows={12}
            maxLength={5000}
          />
          <div className={styles.textStats}>
            <div className={styles.charCount}>
              {text.length}/5000 characters
            </div>
            <div className={styles.progressWrapper}>
              <Progress
                type="circle"
                percent={getProgressPercent()}
                status={getProgressStatus()}
                size={40}
                format={() => text.length}
              />
              <span className={styles.charLabel}>
                {text.length < MIN_CHARS
                  ? `Need ${MIN_CHARS - text.length} more characters`
                  : text.length >= IDEAL_CHARS
                    ? 'Perfect length!'
                    : `${IDEAL_CHARS - text.length} more for ideal length`}
              </span>
            </div>
            <div className={styles.wordCount}>
              <span>{getWordCount(text)} words</span>
              <span>≈ {Math.ceil(getWordCount(text) / 200)} min read</span>
            </div>
          </div>
          <div className={styles.summaryType}>
            <Radio.Group
              value={summaryType}
              onChange={(e) => setSummaryType(e.target.value)}
              buttonStyle="solid"
              size="large"
            >
              <Tooltip title="Extracts key sentences from the original text">
                <Radio.Button value="extractive">
                  <HighlightOutlined /> Extractive
                </Radio.Button>
              </Tooltip>
              <Tooltip title="Generates a new summary using AI (requires API key)">
                <Radio.Button value="abstractive">
                  <RobotOutlined /> Abstractive
                </Radio.Button>
              </Tooltip>
            </Radio.Group>
          </div>
          <Button
            type="primary"
            onClick={handleSummarize}
            loading={loading}
            className={styles.analyzeButton}
            disabled={!text.trim() || text.length < MIN_CHARS}
            icon={<BulbOutlined />}
          >
            {loading ? 'Generating Summary...' : 'Generate Summary'}
          </Button>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <FileTextOutlined /> Summary
        </span>
      ),
      children: (
        <div className={styles.resultSection}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
              <Text>Generating summary...</Text>
            </div>
          ) : summary ? (
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <Title level={4} className={styles.resultTitle}>Generated Summary</Title>
                <div className={styles.resultActions}>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={handleCopyText}
                    className={styles.actionButton}
                    title="Copy to clipboard"
                  />
                  <Button
                    icon={<SyncOutlined spin={regenerating} />}
                    onClick={handleRegenerate}
                    className={styles.actionButton}
                    title="Regenerate summary"
                  />
                </div>
              </div>
              <div className={styles.summaryContent}>
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <InfoCircleOutlined style={{ fontSize: 24 }} />
              <Text>Your summary will appear here</Text>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          <FileTextOutlined /> Text Summarizer
        </Title>
        <Text className={styles.subtitle}>
          Transform your long text into concise, meaningful summaries
        </Text>
      </div>

      <Row gutter={[24, 24]} className={styles.features}>
        <Col xs={24} md={8}>
          <Card className={styles.featureCard}>
            <RobotOutlined className={styles.featureIcon} />
            <Title level={4}>AI-Powered Summary</Title>
            <Text>Uses advanced AI to generate a completely new summary that captures the main ideas.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className={styles.featureCard}>
            <BulbOutlined className={styles.featureIcon} />
            <Title level={4}>Smart Insights</Title>
            <Text>Get key points and summaries instantly with our intelligent analysis.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className={styles.featureCard}>
            <TranslationOutlined className={styles.featureIcon} />
            <Title level={4}>Multiple Languages</Title>
            <Text>Support for over 50 languages with accurate results.</Text>
          </Card>
        </Col>
      </Row>

      <Card className={styles.mainCard}>
        <Tabs
          activeKey={activeTab}
          items={items}
          onChange={setActiveTab}
          className={styles.tabs}
        />
      </Card>
    </div>
  );
};

export default TextPage;
