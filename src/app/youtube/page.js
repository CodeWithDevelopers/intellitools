'use client';
import { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Steps, 
  Tabs,
  List,
  Tag,
  Spin,
  Empty,
  message,
  Space
} from 'antd';
import { 
  YoutubeOutlined, 
  SearchOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  SendOutlined,
  BulbOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import styles from '../styles/youtube.module.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

export default function YoutubePage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('1');
  const [videoData, setVideoData] = useState(null);
  const [question, setQuestion] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);

  const handleVideoProcess = async () => {
    if (!videoUrl.trim()) {
      message.warning('Please enter a YouTube video URL');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: videoUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process video');
      }

      setVideoData(data);
      setCurrentStep(2);
      setActiveTab('2');
      message.success('Video processed successfully');
    } catch (error) {
      message.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      message.warning('Please enter a question');
      return;
    }

    if (!videoData?.videoId) {
      message.error('Please process a video first');
      return;
    }

    setAskingQuestion(true);
    try {
      const response = await fetch('/api/youtube', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: question.trim(),
          videoId: videoData.videoId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const newQuestion = {
        id: Date.now(),
        question: question.trim(),
        answer: data.response,
        timestamp: new Date().toLocaleTimeString()
      };

      setQuestionHistory(prev => [newQuestion, ...prev]);
      setQuestion('');
      message.success('Question answered successfully');
    } catch (error) {
      message.error(error.message);
    } finally {
      setAskingQuestion(false);
    }
  };

  const renderTranscript = () => {
    if (!videoData?.transcript) return null;

    return (
      <List
        className={styles.transcriptList}
        dataSource={videoData.transcript}
        renderItem={item => (
          <List.Item>
            <Space>
              <Tag color="blue">
                <ClockCircleOutlined /> {formatTime(item.offset)}
              </Tag>
              <Text>{item.text}</Text>
            </Space>
          </List.Item>
        )}
      />
    );
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const items = [
    {
      key: '1',
      label: (
        <span>
          <YoutubeOutlined /> Video URL
        </span>
      ),
      children: (
        <div className={styles.inputSection}>
          <Input
            placeholder="Enter YouTube video URL..."
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            prefix={<YoutubeOutlined />}
            size="large"
            disabled={processing}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleVideoProcess}
            loading={processing}
            disabled={!videoUrl.trim()}
                 size="large"
            className={styles.processButton}
          >
            Process Video
          </Button>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <FileTextOutlined /> Analysis Results
        </span>
      ),
      children: (
        <div className={styles.resultsSection}>
          {processing ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
              <Text>Processing video...</Text>
            </div>
          ) : videoData ? (
            <>
              <div className={styles.videoPlayerWrapper}>
                <iframe
                  className={styles.videoPlayer}
                  src={`https://www.youtube.com/embed/${videoData.videoId}`}
                  title={videoData.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card className={styles.summaryCard} title="Video Summary">
                    <Paragraph>{videoData.summary}</Paragraph>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card className={styles.bulletPoints} title="Key Points">
                    <List
                      dataSource={videoData.bulletPoints}
                      renderItem={point => (
                        <List.Item>
                          <Text>• {point}</Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
              <Card 
                className={styles.transcriptCard} 
                title="Video Transcript"
                extra={
                  <Tag color="blue" icon={<ClockCircleOutlined />}>
                    Full Timeline
                  </Tag>
                }
              >
                {renderTranscript()}
              </Card>
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Process a video to see analysis results"
            />
          )}
        </div>
      ),
    },
    // {
    //   key: '3',
    //   label: (
    //     <span>
    //       <QuestionCircleOutlined /> Ask Questions
    //     </span>
    //   ),
    //   children: (
    //     <div className={styles.questionSection}>
    //       {!videoData ? (
    //         <Empty
    //           image={Empty.PRESENTED_IMAGE_SIMPLE}
    //           description="Please process a video first"
    //         />
    //       ) : (
    //         <>
    //           <div className={styles.questionInput}>
    //             <TextArea
    //               placeholder="Ask any question about the video..."
    //               value={question}
    //               onChange={e => setQuestion(e.target.value)}
    //               autoSize={{ minRows: 2, maxRows: 4 }}
    //               disabled={askingQuestion}
    //             />
    //             <Button
    //               type="primary"
    //               icon={<SendOutlined />}
    //               onClick={handleAskQuestion}
    //               loading={askingQuestion}
    //               disabled={!question.trim()}
    //             >
    //               Ask Question
    //             </Button>
    //           </div>
              
    //           <div className={styles.questionHistory}>
    //             <Title level={4}>Question History</Title>
    //             {questionHistory.length === 0 ? (
    //               <Empty
    //                 image={Empty.PRESENTED_IMAGE_SIMPLE}
    //                 description="No questions asked yet"
    //               />
    //             ) : (
    //               <List
    //                 className={styles.questionList}
    //                 itemLayout="vertical"
    //                 dataSource={questionHistory}
    //                 renderItem={item => (
    //                   <List.Item>
    //                     <div className={styles.questionItem}>
    //                       <div className={styles.questionHeader}>
    //                         <Text strong>Q: {item.question}</Text>
    //                         <Text type="secondary">{item.timestamp}</Text>
    //                       </div>
    //                       <div className={styles.answer}>
    //                         <Text>A: {item.answer}</Text>
    //                       </div>
    //                     </div>
    //                   </List.Item>
    //                 )}
    //               />
    //             )}
    //           </div>
    //         </>
    //       )}
    //     </div>
    //   ),
    // }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          <YoutubeOutlined /> YouTube Summarizer
        </Title>
        <Text className={styles.subtitle}>
          Extract insights and analyze content from YouTube videos
        </Text>
      </div>

      <Row gutter={[24, 24]} className={styles.features}>
        <Col xs={24} md={8}>
          <Card className={styles.featureCard}>
            <PlayCircleOutlined className={styles.featureIcon} />
            <Title level={4}>Easy Processing</Title>
            <Text>Simply paste a YouTube URL to start analysis</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className={styles.featureCard}>
            <BulbOutlined className={styles.featureIcon} />
            <Title level={4}>Smart Analysis</Title>
            <Text>Get summaries and key points from video content</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className={styles.featureCard}>
            <UnorderedListOutlined className={styles.featureIcon} />
            <Title level={4}>Full Transcript</Title>
            <Text>Access complete video transcripts with timestamps</Text>
          </Card>
        </Col>
      </Row>

      <Card className={styles.mainCard}>
        {/* <Steps current={currentStep} className={styles.steps}>
          <Step 
            title="Input" 
            description="Enter video URL" 
            icon={<YoutubeOutlined />} 
          />
          <Step 
            title="Process" 
            description="Video analysis" 
            icon={<SearchOutlined />} 
          />
          <Step 
            title="Results" 
            description="View insights" 
            icon={<CheckCircleOutlined />} 
          />
        </Steps> */}

        <Tabs 
          activeKey={activeTab}
          items={items}
          onChange={setActiveTab}
          className={styles.tabs}
        />
      </Card>
    </div>
  );
}
