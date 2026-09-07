import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from './context/AppContext';
import { Shell } from './components/Shell';

export const metadata: Metadata = {
  title: '开饭喵',
  description: '根据家里的食材和用餐需求，帮你快速决定今天吃什么。',
  icons: {
    icon: '/assets/weblogo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
