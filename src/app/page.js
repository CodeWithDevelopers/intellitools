'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button, Card, Col, Row, Form, Input, Collapse, Divider } from 'antd';
import Image from 'next/image';

const { Panel } = Collapse;

export default function Home() {
  const router = useRouter();

  const tools = [
    {
      title: 'AI YouTube Summarizer',
      desc: 'Get video summaries in seconds with our advanced AI technology',
      icon: '📹',
      route: '/youtube',
    },
    // {
    //   title: 'AI PDF Summarizer',
    //   desc: 'Extract key insights from PDF documents efficiently with accuracy',
    //   icon: '📄',
    //   route: '/pdf',
    // },
    {
      title: 'AI Word Summarizer',
      desc: 'Summarize Word documents efficiently with perfect accuracy',
      icon: '📝',
      route: '/word',
    },
    {
      title: 'AI Text Summarizer',
      desc: 'Generate concise summaries from any text or paragraphs',
      icon: '🧠',
      route: '/text',
    },
    // {
    //   title: 'AI Chatbot',
    //   desc: 'Get instant answers to your questions with our VIVEK AI',
    //   icon: '🤖',
    //   route: '/chat',
    // },
  ];

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>Transform Your Work with <span className={styles.gradientText}>AI-Powered Tools</span></h1>
          <p>Simplify your work with smart summarization and chat solutions. Perfect for students, professionals, and creators across India.</p>
          <Button type="primary" size="large">Try for Free</Button>
        </div>
        <div className={styles.heroImage}>
          <Image
            src="/assets/summary.jpg"
            alt="AI Tool Preview"
            width={500}
            height={400}
          />
        </div>

      </section>

      {/* Tools Section */}
      <section className={styles.tools}>
        <h2>Our Powerful <span className={styles.highlight}>AI Tools</span></h2>
        <Row gutter={[24, 24]} justify="center">
          {tools.map((tool, idx) => (
            <Col xs={24} sm={12} md={8} lg={8} key={idx}>
              <Card
                className={styles.toolCard}
                bordered={false}
                hoverable
                style={{
                  borderRadius: 16,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center',
                  minHeight: 200,
                }}
              >
                <div style={{ fontSize: '2rem', display: 'flex', justifyContent: 'flex-start', }}>{tool.icon}</div>
                <h3 style={{ marginBottom: 0, display: 'flex', justifyContent: 'flex-start', }}>{tool.title}</h3>
                <p style={{ color: '#666', minHeight: 50, textAlign:"left" }}>{tool.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <Button
                    size="middle"
                    style={{
                      color: '#4f46e5',
                      backgroundColor: '#eef2ff',
                      border: 'none',
                      fontWeight:500
                    }}
                    onClick={() => router.push(tool.route)}
                  >
                    Try Now
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Why Choose Us */}
      <section className={styles.why} style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>
          Why choose <span style={{ color: '#6d28d9', position: 'relative' }}>
            IntelliTools
            <span style={{
              position: 'absolute',
              left: 0,
              bottom: -4,
              height: 2,
              width: '100%',
              backgroundColor: '#c4b5fd'
            }}></span>
          </span>
        </h2>
        <p style={{ marginTop: 8, color: '#666' }}>
          Trusted by students and professionals across India
        </p>

        <Row gutter={[32, 32]} justify="center" style={{ marginTop: 40 }}>
          {[
            {
              icon: '🕒',
              title: 'Save 80% Time',
              desc: 'Reduce content processing time significantly.',
            },
            {
              icon: '🚀',
              title: 'Boost Productivity',
              desc: 'Get more done with smart AI assistance.',
            },
            {
              icon: '🔒',
              title: '100% Secure',
              desc: 'Your data is protected with enterprise-grade security.',
            }
          ].map((feature, idx) => (
            <Col xs={24} sm={12} md={8} key={idx}>
              <Card bordered={false} style={{ textAlign: 'center', boxShadow: 'none', minHeight: 200 }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: '#eef2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '1.8rem',
                  color: '#4f46e5'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontWeight: 600 }}>{feature.title}</h3>
                <p style={{ color: '#666' }}>{feature.desc}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </section>


      {/* Perfect for Professionals */}
      <section className={styles.professionals}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>
          Perfect for <span className={styles.highlight}>Every Profession</span>
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 40 }}>
          See how different professionals across India use our AI tools
        </p>

        <Row gutter={[32, 32]} justify="center">
          {[
            {
              icon: '🎓',
              title: 'Students',
              desc: 'Summarize lecture videos and educational content',
            },
            {
              icon: '💼',
              title: 'Professionals',
              desc: 'Extract insights from business videos and pdfs',
            },
            {
              icon: '🧑‍🏫',
              title: 'Educators',
              desc: 'Create quick summaries for teaching materials',
            },
            {
              icon: '📹',
              title: 'Content Creators',
              desc: 'Research and analyze trending content',
            },
          ].map((item, idx) => (
            <Col xs={24} sm={12} md={6} key={idx}>
              <Card
                bordered={false}
                style={{
                  textAlign: 'center',
                  boxShadow: 'none',
                  minHeight: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#eef2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    fontSize: '1.8rem',
                    color: '#4f46e5',
                  }}
                >
                  {item.icon}
                </div>
                <h3 style={{ fontWeight: 600,textAlign:"left" }}>{item.title}</h3>
                <p style={{ color: '#666', fontSize: '14px', textAlign: "left" }}>{item.desc}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </section>     
      
    </div>
  );
}
