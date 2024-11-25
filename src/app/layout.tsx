import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Textor-AI - Speech to Text - AssemblyAI',
  description: 'A modern speech to text converter using AssemblyAI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          {children}
        </main>
      </body>
    </html>
  );
}
