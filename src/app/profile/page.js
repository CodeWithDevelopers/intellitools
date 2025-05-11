'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Form, Input, Button, Upload, message, Tabs } from 'antd';
import { 
  UserOutlined, 
  UploadOutlined,
  EditOutlined,
  SaveOutlined,
  LoadingOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useUser } from '../context/UserContext';
import styles from './page.module.css';

const { TextArea } = Input;
const { TabPane } = Tabs;

export default function Profile() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { user, login, loading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [fileList, setFileList] = useState([]);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login?redirect=/profile');
      return;
    }

    if (user) {
      // Set initial form values
      form.setFieldsValue({
        name: user.name,
        bio: user.bio || ''
      });

      // Set avatar if exists
      if (user.avatar) {
        setImageUrl(`/api/profile/avatar/${user.id}?${new Date().getTime()}`);
      }
    }
  }, [user, userLoading, form, router]);

  const handleUploadChange = ({ fileList: newFileList }) => {
    const latestFile = newFileList[newFileList.length - 1];
    setFileList(latestFile ? [latestFile] : []);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('bio', values.bio || '');

      if (fileList.length > 0) {
        const file = fileList[0].originFileObj;
        formData.append('avatar', file);
      }

      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Profile updated successfully!');
        login(data.user);
        
        if (data.user.avatar) {
          setImageUrl(`/api/profile/avatar/${data.user.id}?${new Date().getTime()}`);
        }
        setFileList([]);
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      message.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordChange = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Password updated successfully!');
        passwordForm.resetFields();
      } else {
        throw new Error(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password update error:', error);
      message.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.loadingState}>
            <LoadingOutlined style={{ fontSize: 24 }} spin />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Profile Settings</h1>
          <p className={styles.subtitle}>Update your personal information</p>
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className={styles.tabs}
        >
          <TabPane tab="Profile Information" key="1">
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                {imageUrl ? (
                  <div className={styles.avatarContainer}>
                    <img
                      src={imageUrl}
                      alt="Avatar"
                      className={styles.avatar}
                    />
                  </div>
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <UserOutlined />
                  </div>
                )}
              </div>
              <Upload
                accept="image/*"
                showUploadList={false}
                fileList={fileList}
                onChange={handleUploadChange}
                customRequest={({ file, onSuccess }) => {
                  setTimeout(() => {
                    onSuccess("ok");
                  }, 0);
                }}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('You can only upload image files!');
                    return false;
                  }
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    message.error('Image must be smaller than 2MB!');
                    return false;
                  }
                  return true;
                }}
              >
                <Button icon={<UploadOutlined />} className={styles.uploadButton}>
                  Change Avatar
                </Button>
              </Upload>
            </div>

            <Form
              form={form}
              onFinish={onFinish}
              layout="vertical"
              className={styles.form}
            >
              <Form.Item
                name="name"
                label="Name"
                rules={[
                  { required: true, message: 'Please enter your name' },
                  { min: 2, message: 'Name must be at least 2 characters' }
                ]}
              >
                <Input 
                  prefix={<EditOutlined />}
                  placeholder="Your name"
                  className={styles.input}
                />
              </Form.Item>

              <Form.Item
                name="bio"
                label="Bio"
                rules={[
                  { max: 200, message: 'Bio cannot be longer than 200 characters' }
                ]}
              >
                <TextArea
                  placeholder="Tell us about yourself"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  className={styles.input}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className={styles.submitButton}
                  loading={loading}
                  icon={loading ? <LoadingOutlined /> : <SaveOutlined />}
                >
                  Update Profile
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="Change Password" key="2">
            <Form
              form={passwordForm}
              onFinish={onPasswordChange}
              layout="vertical"
              className={styles.form}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[
                  { required: true, message: 'Please enter your current password' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Current password"
                  className={styles.input}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter your new password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="New password"
                  className={styles.input}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirm new password"
                  className={styles.input}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className={styles.submitButton}
                  loading={loading}
                  icon={loading ? <LoadingOutlined /> : <SaveOutlined />}
                >
                  Update Password
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
}
