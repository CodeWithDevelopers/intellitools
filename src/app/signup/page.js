'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Checkbox, Form, message } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  GoogleOutlined,
  GithubOutlined,
  RocketOutlined,
  SecurityScanOutlined,
  TeamOutlined
} from '@ant-design/icons';
import styles from './page.module.css';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Account created successfully!');
        router.push('/login');
      } else {
        message.error(data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      message.error('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.animationContainer}>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
        </div>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>Join Our AI Platform</h1>
          <p className={styles.welcomeDescription}>
            Start your journey with our powerful AI tools and transform your workflow
          </p>
        </div>
        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>
              <RocketOutlined />
            </span>
            <span>Get started in seconds</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>
              <SecurityScanOutlined />
            </span>
            <span>Advanced security features</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>
              <TeamOutlined />
            </span>
            <span>Join our growing community</span>
          </div>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Create Account</h1>
            <p className={styles.subtitle}>Join us to access all AI tools</p>
          </div>

          <Form
            name="signup"
            onFinish={onFinish}
            className={styles.form}
            initialValues={{ agree: true }}
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Full Name" 
                size="large"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Email" 
                size="large"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 8, message: 'Password must be at least 8 characters' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="agree"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('Please accept the terms and conditions')),
                },
              ]}
            >
              <Checkbox>
                I agree to the <Link href="/terms" className={styles.footerLink}>Terms of Service</Link> and{' '}
                <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                className={styles.submitButton}
              >
                Create Account
              </Button>
            </Form.Item>

            <div className={styles.socialLogin}>
              <p className={styles.divider}>Or continue with</p>
              <div className={styles.socialButtons}>
                <Button 
                  icon={<GoogleOutlined />}
                  className={`${styles.socialButton} ${styles.google}`}
                >
                  Google
                </Button>
                <Button 
                  icon={<GithubOutlined />}
                  className={`${styles.socialButton} ${styles.github}`}
                >
                  GitHub
                </Button>
              </div>
            </div>
          </Form>

          <p className={styles.signupText}>
            Already have an account? <Link className={styles.signupLink} href="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
