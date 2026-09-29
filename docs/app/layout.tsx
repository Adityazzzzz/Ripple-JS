import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

// Plus Jakarta Sans perfectly mimics the premium Framer/Docly typography
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  // This variable allows Tailwind to hook into it easily if needed
  variable: '--font-jakarta', 
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jakarta.className}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen antialiased selection:bg-primary selection:text-primary-foreground">
        <RootProvider>{children}</RootProvider>
        <Analytics />
      </body>
    </html>
  );
}