import './globals.css'
import PWARegister from '@/components/PWARegister'

export const metadata = {
  title: 'BizReach — منصة التواصل التجاري',
  description: 'منصة إدارة حملات الواتساب للأعمال',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BizReach',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="h-full">
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
