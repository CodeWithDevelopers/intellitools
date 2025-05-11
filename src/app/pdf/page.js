'use client';
import { useState } from 'react';
import {
    Upload, Button, Card, List, Tabs, message, Typography, Spin, Input, Empty,
    Progress, Tag, Space, Divider, Avatar, Row, Col, Statistic, Tooltip, Badge, Alert, Steps
} from 'antd';
import {
    InboxOutlined, FileTextOutlined, BulbOutlined,
    QuestionCircleOutlined, LoadingOutlined, BookOutlined,
    TagOutlined, InfoCircleOutlined, SendOutlined, RobotOutlined, UserOutlined,
    FilePdfOutlined, BarChartOutlined, ClockCircleOutlined, UserSwitchOutlined,
    UploadOutlined, SearchOutlined, CheckCircleOutlined, CloudUploadOutlined,
    ThunderboltOutlined, SafetyCertificateOutlined, EditOutlined, FileSearchOutlined,
    DownloadOutlined, SmileOutlined, MehOutlined, FrownOutlined
} from '@ant-design/icons';
import styles from '../styles/pdf.module.css';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

export default function PDFPage() {
    const [summary, setSummary] = useState('');
    const [bulletPoints, setBulletPoints] = useState([]);
    const [topics, setTopics] = useState([]);
    const [metadata, setMetadata] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [fileList, setFileList] = useState([]);
    const [error, setError] = useState('');
    const [fileKey, setFileKey] = useState('');
    const [activeTab, setActiveTab] = useState('1');
    const [conversations, setConversations] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [question, setQuestion] = useState('');
    const [askingQuestion, setAskingQuestion] = useState(false);
    const [questionHistory, setQuestionHistory] = useState([]);

    const uploadProps = {
        name: 'file',
        multiple: false,
        accept: '.pdf',
        maxCount: 1,
        fileList,
        showUploadList: true,
        beforeUpload: (file) => {
            const isPDF = file.type === 'application/pdf';
            if (!isPDF) {
                message.error('You can only upload PDF files!');
                return false;
            }
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('File must be smaller than 10MB!');
                return false;
            }
            setFileList([file]);
            return false;
        },
        customRequest: async ({ file, onSuccess, onError, onProgress }) => {
            try {
                setUploading(true);
                setError('');
                setUploadProgress(0);

                // Reset states
                setSummary('');
                setBulletPoints([]);
                setTopics([]);
                setMetadata(null);
                setStatistics(null);
                setConversations([]);

                const formData = new FormData();
                formData.append('file', file);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/pdf', true);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percent);
                        onProgress({ percent });
                    }
                };

                xhr.onload = async () => {
                    if (xhr.status === 200) {
                        const response = JSON.parse(xhr.responseText);
                        setSummary(response.summary);
                        setBulletPoints(response.bulletPoints || []);
                        setTopics(response.topics || []);
                        setMetadata(response.metadata);
                        setStatistics(response.statistics);
                        setFileKey(response.fileHash);
                        setFileList([{ ...file, status: 'done' }]);

                        if (response.fromCache) {
                            message.success('PDF loaded from cache!');
                        } else {
                            message.success('PDF processed successfully!');
                        }

                        setAnalysisResults({
                            summary: response.summary,
                            bulletPoints: response.bulletPoints,
                            topics: response.topics,
                            sentiment: response.sentiment,
                            readabilityScore: response.readabilityScore,
                            keyPhrases: response.keyPhrases,
                            metadata: response.metadata,
                            statistics: response.statistics
                        });

                        setCurrentStep(2);
                        setActiveTab('2');

                        onSuccess();
                    } else {
                        const error = JSON.parse(xhr.responseText);
                        throw new Error(error.error || 'Upload failed');
                    }
                };

                xhr.onerror = () => {
                    const error = new Error('Network error');
                    setError(error.message);
                    onError(error);
                };

                xhr.send(formData);
            } catch (error) {
                setError(error.message);
                setFileList([{ ...file, status: 'error' }]);
                message.error(error.message);
                onError(error);
            } finally {
                setUploading(false);
                setUploadProgress(0);
            }
        },
        onRemove: () => {
            setFileList([]);
            setSummary('');
            setBulletPoints([]);
            setTopics([]);
            setMetadata(null);
            setStatistics(null);
            setConversations([]);
            setFileKey('');
            setError('');
            setAnalysisResults(null);
            setCurrentStep(0);
            setQuestionHistory([]);
        }
    };

    const handleUpload = async () => {
        if (!fileList[0]) {
            message.error('Please select a file first');
            return;
        }

        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', fileList[0]);

            const response = await fetch('/api/pdf', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process document');
            }

            setAnalysisResults({
                summary: data.summary,
                bulletPoints: data.bulletPoints,
                topics: data.topics,
                sentiment: data.sentiment,
                readabilityScore: data.readabilityScore,
                keyPhrases: data.keyPhrases,
                metadata: data.metadata,
                statistics: data.statistics,
                fileHash: data.fileHash
            });

            setCurrentStep(2);
            setActiveTab('2');
            message.success('Document processed successfully');
        } catch (error) {
            setError(error.message);
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
            const response = await fetch('/api/pdf', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: question.trim(),
                    fileKey: analysisResults.fileHash
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get answer');
            }

            const newQuestion = {
                id: Date.now(),
                question: question.trim(),
                answer: data.answer,
                context: data.context,
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

    const getSentimentIcon = (sentiment) => {
        if (sentiment > 1) return <SmileOutlined style={{ color: '#52c41a' }} />;
        if (sentiment < -1) return <FrownOutlined style={{ color: '#ff4d4f' }} />;
        return <MehOutlined style={{ color: '#faad14' }} />;
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
                    {error && (
                        <Alert
                            message="Error"
                            description={error}
                            type="error"
                            showIcon
                            className={styles.errorAlert}
                        />
                    )}
                    <Dragger {...uploadProps} className={styles.uploader}>
                        <p className={styles.uploadIcon}>
                            <FilePdfOutlined />
                        </p>
                        <p className={styles.uploadText}>
                            Click or drag PDF document to this area to upload
                        </p>
                        <p className={styles.uploadHint}>
                            Support for PDF files up to 10MB
                        </p>
                    </Dragger>

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

                            <Row gutter={[24, 24]} className={styles.statsRow}>
                                <Col xs={24} md={8}>
                                    <Card className={styles.statCard}>
                                        <Statistic
                                            title="Word Count"
                                            value={analysisResults.statistics.wordCount}
                                            prefix={<FileTextOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card className={styles.statCard}>
                                        <Statistic
                                            title="Reading Time"
                                            value={`${analysisResults.statistics.readingTime} min`}
                                            prefix={<ClockCircleOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card className={styles.statCard}>
                                        <Statistic
                                            title="Pages"
                                            value={analysisResults.metadata.pageCount}
                                            prefix={<FileOutlined />}
                                        />
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

                            <Card className={styles.bulletPointsCard} title="Key Points">
                                <List
                                    dataSource={analysisResults.bulletPoints}
                                    renderItem={item => (
                                        <List.Item>
                                            <Text>{item}</Text>
                                        </List.Item>
                                    )}
                                />
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
        {
            key: '3',
            label: (
                <span>
                    <QuestionCircleOutlined /> Ask Questions
                </span>
            ),
            children: (
                <div className={styles.questionSection}>
                    {!analysisResults ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Please upload and analyze a document first"
                        />
                    ) : (
                        <>
                            <div className={styles.questionInput}>
                                <TextArea
                                    placeholder="Ask any question about your document..."
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    autoSize={{ minRows: 2, maxRows: 4 }}
                                    disabled={askingQuestion}
                                />
                                <Button
                                    style={{ marginTop: '1rem', minWidth: '100%' }}
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleAskQuestion}
                                    loading={askingQuestion}
                                    disabled={!question.trim()}
                                >
                                    Ask Question
                                </Button>
                            </div>

                            <div className={styles.questionHistory}>
                                <Title level={4}>Question History</Title>
                                {questionHistory.length === 0 ? (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No questions asked yet"
                                    />
                                ) : (
                                    <List
                                        className={styles.questionList}
                                        itemLayout="vertical"
                                        dataSource={questionHistory}
                                        renderItem={item => (
                                            <List.Item>
                                                <div className={styles.questionItem}>
                                                    <div className={styles.questionHeader}>
                                                        <Text strong>Q: {item.question}</Text>
                                                        <Text type="secondary">{item.timestamp}</Text>
                                                    </div>
                                                    <div className={styles.answer}>
                                                        <Text>A: {item.answer}</Text>
                                                        {item.context && (
                                                            <div className={styles.context}>
                                                                <Text type="secondary">Context: {item.context}</Text>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
            ),
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={2} className={styles.title}>
                    <FilePdfOutlined /> PDF Summarizer
                </Title>
                <Text className={styles.subtitle}>
                    Extract insights and analyze content from your PDF documents
                </Text>
            </div>

            <Row gutter={[24, 24]} className={styles.features}>
                <Col xs={24} md={8}>
                    <Card className={styles.featureCard}>
                        <CloudUploadOutlined className={styles.featureIcon} />
                        <Title level={4}>Easy Upload</Title>
                        <Text>Simple drag-and-drop interface for your PDF documents</Text>
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
