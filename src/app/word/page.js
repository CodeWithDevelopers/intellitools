'use client';
import { useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Upload, 
  message, 
  Steps,
  Tabs,
  Progress,
  Spin,
  List,
  Tag,
  Input,
  Empty
} from 'antd';
import { 
  FileWordOutlined, 
  UploadOutlined, 
  SearchOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
  SendOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined
} from '@ant-design/icons';
import styles from '../styles/word.module.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

export default function WordPage() {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('1');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [question, setQuestion] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);

  const handleUpload = async () => {
    if (!fileList[0]) {
      message.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileList[0]);

      const response = await fetch('/api/word', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process document');
      }

      setAnalysisResults({
        summary: data.summary,
        sentiment: data.sentiment,
        keyPhrases: data.keyPhrases,
        readabilityScore: calculateReadabilityScore(data.sentiment),
      });

      setCurrentStep(2);
      setActiveTab('2');
      message.success('Document processed successfully');
    } catch (error) {
      message.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      message.warning('Please enter a question');
      return;
    }

    setAskingQuestion(true);
    try {
      const response = await fetch('/api/word', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: question.trim() }),
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

  const calculateReadabilityScore = (sentiment) => {
    // Convert sentiment score (-5 to 5) to a percentage (0 to 100)
    return Math.round((sentiment + 5) * 10);
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment > 1) return <SmileOutlined style={{ color: '#52c41a' }} />;
    if (sentiment < -1) return <FrownOutlined style={{ color: '#ff4d4f' }} />;
    return <MehOutlined style={{ color: '#faad14' }} />;
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
      setAnalysisResults(null);
      setCurrentStep(0);
      setQuestionHistory([]);
    },
    beforeUpload: (file) => {
      if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
        message.error('Please upload a Word document (.doc or .docx)');
        return false;
      }
      setFileList([file]);
      return false;
    },
    fileList,
    maxCount: 1
  };

  const items = [
    {
      key: '1',
      label: (
        <span>
          <UploadOutlined /> Upload Document
        </span>
      ),
      children: (
        <div className={styles.uploadSection}>
          <Upload.Dragger {...uploadProps} className={styles.uploader}>
            <p className={styles.uploadIcon}>
              <FileWordOutlined />
            </p>
            <p className={styles.uploadText}>
              Click or drag Word document to this area to upload
            </p>
            <p className={styles.uploadHint}>
              Support for .doc and .docx files
            </p>
          </Upload.Dragger>

          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={uploading}
            className={styles.uploadButton}
            icon={<CloudUploadOutlined />}
          >
            {uploading ? 'Processing' : 'Analyze Document'}
          </Button>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <BarChartOutlined /> Analysis Results
        </span>
      ),
      children: (
        <div className={styles.resultsSection}>
          {analyzing ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
              <Text>Analyzing document...</Text>
            </div>
          ) : analysisResults ? (
            <>
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card className={styles.summaryCard} title="Document Summary">
                    <Paragraph>{analysisResults.summary}</Paragraph>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card className={styles.scoreCard} title="Document Analysis">
                    <div className={styles.scoreWrapper}>
                      <Progress
                        type="circle"
                        percent={analysisResults.readabilityScore}
                        format={percent => (
                          <div className={styles.sentimentScore}>
                            {getSentimentIcon(analysisResults.sentiment)}
                            <span>{percent}%</span>
                          </div>
                        )}
                        size={120}
                      />
                      <Text className={styles.scoreLabel}>Sentiment Score</Text>
                    </div>
                  </Card>
                </Col>
              </Row>
              <Card className={styles.topicsCard} title="Key Phrases">
                <div className={styles.topicsWrapper}>
                  {analysisResults.keyPhrases.map((phrase, index) => (
                    <Tag key={index} color="blue" className={styles.topicTag}>
                      {phrase}
                    </Tag>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <div className={styles.placeholder}>
              <FileSearchOutlined style={{ fontSize: 48 }} />
              <Text>Upload a document to see analysis results</Text>
            </div>
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
    //       {!analysisResults ? (
    //         <Empty
    //           image={Empty.PRESENTED_IMAGE_SIMPLE}
    //           description="Please upload and analyze a document first"
    //         />
    //       ) : (
    //         <>
    //           <div className={styles.questionInput}>
    //             <TextArea
    //               placeholder="Ask any question about your document..."
    //               value={question}
    //               onChange={e => setQuestion(e.target.value)}
    //               autoSize={{ minRows: 2, maxRows: 4 }}
    //               disabled={askingQuestion}
    //             />
    //             <Button
    //               style={{ marginTop: '1rem', minWidth: '100%' }}
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
          <FileWordOutlined /> Word Summarizer
        </Title>
        <Text className={styles.subtitle}>
          Extract insights and analyze content from your Word documents
        </Text>
      </div>

      <Row gutter={[24, 24]} className={styles.features}>
        <Col xs={24} md={8}>
          <Card className={styles.featureCard}>
            <CloudUploadOutlined className={styles.featureIcon} />
            <Title level={4}>Easy Upload</Title>
            <Text>Simple drag-and-drop interface for your Word documents</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className={styles.featureCard}>
            <ThunderboltOutlined className={styles.featureIcon} />
            <Title level={4}>Smart Analysis</Title>
            <Text>AI-powered analysis with sentiment detection and key phrases</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className={styles.featureCard}>
            <QuestionCircleOutlined className={styles.featureIcon} />
            <Title level={4}>Interactive Q&A</Title>
            <Text>Ask questions and get relevant answers from your document</Text>
          </Card>
        </Col>
      </Row>

      <Card className={styles.mainCard}>
        {/* <Steps current={currentStep} className={styles.steps}>
          <Step 
            title="Upload" 
            description="Upload your Word document" 
            icon={<UploadOutlined />} 
          />
          <Step 
            title="Process" 
            description="Document analysis" 
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
