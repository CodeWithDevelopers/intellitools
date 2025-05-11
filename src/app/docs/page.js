'use client';
import { Input } from 'antd';
import {
  SearchOutlined,
  CodeOutlined,
  ApiOutlined,
  SettingOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons';
import styles from '../styles/docs.module.css';

const { Search } = Input;

export default function Documentation() {
  const docs = [
    {
      icon: <CodeOutlined />,
      title: 'Quick Start Guide',
      description: 'Get up and running with AI Tools in minutes. Learn the basic concepts and features.'
    },
    {
      icon: <ApiOutlined />,
      title: 'API Reference',
      description: 'Complete API documentation for integrating AI Tools into your applications.'
    },
    {
      icon: <SettingOutlined />,
      title: 'Configuration',
      description: 'Learn how to configure and customize AI Tools for your specific needs.'
    },
    {
      icon: <DeploymentUnitOutlined />,
      title: 'Advanced Usage',
      description: 'Dive deep into advanced features and optimization techniques.'
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Documentation</h1>
        <p className={styles.subtitle}>
          Comprehensive guides and documentation to help you build with AI Tools
        </p>
      </header>

      <div className={styles.searchContainer}>
        <Search
          placeholder="Search documentation..."
          size="large"
          enterButton
          prefix={<SearchOutlined />}
        />
      </div>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <div className={styles.menu}>
            <div className={styles.menuTitle}>Documentation</div>
            <div className={`${styles.menuItem} ${styles.active}`}>Introduction</div>
            <div className={styles.menuItem}>Getting Started</div>
            <div className={styles.menuTitle}>Guides</div>
            <div className={styles.menuItem}>Text Analysis</div>
            <div className={styles.menuItem}>Document Processing</div>
            <div className={styles.menuItem}>YouTube Integration</div>
            <div className={styles.menuTitle}>API Reference</div>
            <div className={styles.menuItem}>Authentication</div>
            <div className={styles.menuItem}>Endpoints</div>
            <div className={styles.menuItem}>Rate Limits</div>
            <div className={styles.menuTitle}>Resources</div>
            <div className={styles.menuItem}>Examples</div>
            <div className={styles.menuItem}>SDKs</div>
            <div className={styles.menuItem}>Changelog</div>
          </div>
        </aside>

        <main className={styles.mainContent}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Getting Started</h2>
            {docs.map((doc, index) => (
              <div key={index} className={styles.card}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>{doc.icon}</span>
                  {doc.title}
                </h3>
                <p className={styles.cardDescription}>{doc.description}</p>
              </div>
            ))}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Code Examples</h2>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <span className={styles.cardIcon}><CodeOutlined /></span>
                Basic Usage
              </h3>
              <pre style={{ 
                background: '#f6f8fa', 
                padding: '16px', 
                borderRadius: '8px',
                overflow: 'auto'
              }}>
{`// Initialize the AI Tools client
const client = new AITools({
  apiKey: 'your-api-key'
});

// Analyze text
const result = await client.analyzeText({
  text: 'Your text here',
  features: ['sentiment', 'entities']
});`}
              </pre>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
