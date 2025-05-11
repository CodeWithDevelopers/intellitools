'use client';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import {
  CheckOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  RocketOutlined
} from '@ant-design/icons';
import styles from '../styles/docs.module.css';

export default function Pricing() {
  const router = useRouter();

  const plans = [
    {
      name: 'Basic',
      price: '0',
      description: 'Perfect for trying out AI Tools',
      icon: <ThunderboltOutlined />,
      features: [
        'Basic text analysis',
        '5 documents per month',
        '3 YouTube videos per month',
        'Community support',
        'Basic API access'
      ]
    },
    {
      name: 'Pro',
      price: '29',
      description: 'For professionals and small teams',
      icon: <CrownOutlined />,
      popular: true,
      features: [
        'Advanced text analysis',
        'Unlimited documents',
        '50 YouTube videos per month',
        'Priority support',
        'Full API access',
        'Team collaboration',
        'Custom integrations'
      ]
    },
    {
      name: 'Enterprise',
      price: '99',
      description: 'For large organizations',
      icon: <RocketOutlined />,
      features: [
        'Custom AI models',
        'Unlimited everything',
        'Dedicated support',
        'Premium API access',
        'Advanced security',
        'SLA guarantee',
        'Custom training',
        'White-label options'
      ]
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Simple, Transparent Pricing</h1>
        <p className={styles.subtitle}>
          Choose the perfect plan for your needs. All plans include a 14-day free trial.
        </p>
      </header>

      <div className={styles.pricingGrid}>
        {plans.map((plan, index) => (
          <div 
            key={index} 
            className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}
          >
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#52c41a',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.9rem'
              }}>
                Popular
              </div>
            )}
            
            <div style={{ fontSize: '24px', color: '#1890ff', marginBottom: '16px' }}>
              {plan.icon}
            </div>
            
            <h3 className={styles.planName}>{plan.name}</h3>
            <div className={styles.planPrice}>
              ${plan.price}<small>/month</small>
            </div>
            <p style={{ color: '#666', marginBottom: '24px' }}>{plan.description}</p>
            
            <Button 
              type={plan.popular ? 'primary' : 'default'}
              size="large"
              block
              onClick={() => router.push('/signup')}
            >
              Get Started
            </Button>

            <div className={styles.features}>
              {plan.features.map((feature, idx) => (
                <div key={idx} className={styles.featureItem}>
                  <CheckOutlined className={styles.featureIcon} />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '48px',
        padding: '24px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}>
        <h3 style={{ marginBottom: '16px', color: '#1a1a1a' }}>
          Need a custom plan?
        </h3>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Contact us for custom pricing and features tailored to your needs.
        </p>
        <Button type="default" size="large">
          Contact Sales
        </Button>
      </div>
    </div>
  );
}
