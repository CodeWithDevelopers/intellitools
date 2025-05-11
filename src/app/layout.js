import { Inter } from 'next/font/google'
import './globals.css'
import { ConfigProvider } from 'antd'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatbotIcon from './components/ChatbotIcon'
import { UserProvider } from './context/UserContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Tools',
  description: 'AI-powered tools for text, Word, PDF, and YouTube processing',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider>
          <UserProvider>
            <div className="site-wrapper">
              <Navbar />
              <main className="main-content">
                <div className="page-container">
                  {children}
                </div>
              </main>
              <Footer />
              <ChatbotIcon />
            </div>
          </UserProvider>
        </ConfigProvider>
      </body>
    </html>
  )
}
