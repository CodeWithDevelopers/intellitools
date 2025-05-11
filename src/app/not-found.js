'use client';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import styles from './not-found.module.css';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      {/* Animated Robot */}
      <div className={styles.robotContainer}>
        <div className={styles.robot}>
          <div className={styles.face}>
            <div className={styles.eyes}>
              <div className={styles.eye}></div>
              <div className={styles.eye}></div>
            </div>
            <div className={styles.mouth}></div>
          </div>
        </div>
      </div>

      {/* Error Content */}
      <h1 className={styles.errorCode}>404</h1>
      <h2 className={styles.title}>Oops! Page Not Found</h2>
      <p className={styles.description}>
        The page you are looking for might have been moved, deleted, or possibly never existed.
        Let's get you back on track!
      </p>

      {/* Action Button */}
      <div className={styles.button}>
        <Button 
          type="primary" 
          size="large" 
          icon={<HomeOutlined />}
          onClick={() => router.push('/')}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
