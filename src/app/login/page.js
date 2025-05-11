'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Form, message } from 'antd';
import { 
  LockOutlined, 
  MailOutlined,
  GoogleOutlined,
  GithubOutlined,
  RocketOutlined,
  SecurityScanOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useUser } from '../context/UserContext';
import styles from './page.module.css';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useUser();
  const redirectPath = searchParams.get('redirect');

  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push(user.role === 'admin' ? '/dashboard' : '/');
      }
    }
  }, [user, router, redirectPath]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user);
        message.success('Login successful!');
        
        // Handle redirect priority:
        // 1. URL redirect parameter
        // 2. Role-based default redirect
        if (redirectPath) {
          // Ensure the redirect path starts with a slash
          const normalizedPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
          router.push(normalizedPath);
        } else {
          router.push(data.defaultRedirect);
        }
      } else {
        message.error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>Welcome Back!</h1>
          <p className={styles.welcomeDescription}>
            Log in to access your AI tools and continue your journey
          </p>
        </div>
        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>
              <RocketOutlined />
            </span>
            <span>Access all your tools</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>
              <SecurityScanOutlined />
            </span>
            <span>Secure login system</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>
              <TeamOutlined />
            </span>
            <span>Connect with your team</span>
          </div>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Sign in to continue</p>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            className={styles.form}
          >
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
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                className={styles.submitButton}
              >
                Log In
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
            Don't have an account? <Link className={styles.signupLink} href="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
