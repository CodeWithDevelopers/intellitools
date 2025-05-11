'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import styles from './ChatbotIcon.module.css';

export default function ChatbotIcon() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show the icon on the chat route
  if (pathname === '/chat') {
    return null;
  }

  return (
    <Button
      type="primary"
      shape="circle"
      size="large"
      className={styles.chatbotIcon}
      icon={<RobotOutlined />}
      onClick={() => router.push('/chat')}
    />
  );
}
