'use client';
import { Input } from 'antd';
import {
  QuestionCircleOutlined,
  SearchOutlined,
  BookOutlined,
  ToolOutlined,
  VideoCameraOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import styles from '../styles/docs.module.css';

const { Search } = Input;

export default function Help() {
  const helpTopics = [
    {
      icon: <BookOutlined />,
      title: 'Getting Started',
      description: 'Learn the basics of using AI Tools and get started quickly.'
    },
    {
      icon: <ToolOutlined />,
      title: 'Text Analysis',
      description: 'How to use our text analysis tools for better insights.'
    },
    {
      icon: <FileTextOutlined />,
      title: 'Document Processing',
      description: 'Process Word and PDF documents efficiently.'
    },
    {
      icon: <VideoCameraOutlined />,
      title: 'YouTube Tools',
      description: 'Extract and analyze content from YouTube videos.'
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Help Center</h1>
        <p className={styles.subtitle}>
          Find answers to your questions and learn how to make the most of AI Tools
        </p>
      </header>

      <div className={styles.searchContainer}>
        <Search
          placeholder="Search for help..."
          size="large"
          enterButton
          prefix={<SearchOutlined />}
        />
      </div>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <div className={styles.menu}>
            <div className={styles.menuTitle}>Help Topics</div>
            <div className={`${styles.menuItem} ${styles.active}`}>Getting Started</div>
            <div className={styles.menuItem}>Account & Billing</div>
            <div className={styles.menuItem}>Text Analysis</div>
            <div className={styles.menuItem}>Document Processing</div>
            <div className={styles.menuItem}>YouTube Tools</div>
            <div className={styles.menuItem}>Troubleshooting</div>
          </div>
        </aside>

        <main className={styles.mainContent}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Popular Topics</h2>
            {helpTopics.map((topic, index) => (
              <div key={index} className={styles.card}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>{topic.icon}</span>
                  {topic.title}
                </h3>
                <p className={styles.cardDescription}>{topic.description}</p>
              </div>
            ))}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <span className={styles.cardIcon}><QuestionCircleOutlined /></span>
                How do I get started?
              </h3>
              <p className={styles.cardDescription}>
                Sign up for an account, choose your plan, and start using our AI tools immediately.
                We offer a free trial so you can explore all features before committing.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <span className={styles.cardIcon}><QuestionCircleOutlined /></span>
                What file formats are supported?
              </h3>
              <p className={styles.cardDescription}>
                We support various formats including .txt, .doc, .docx, .pdf for documents,
                and can process YouTube videos through their URLs.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <span className={styles.cardIcon}><QuestionCircleOutlined /></span>
                Is my data secure?
              </h3>
              <p className={styles.cardDescription}>
                Yes, we use enterprise-grade encryption and security measures to protect your data.
                We never share your information with third parties.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
