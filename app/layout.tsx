import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
     title: 'RecallAI - AI-Powered Flashcard Engine',
     description: 'Master any subject with AI-generated flashcards and spaced repetition',
     keywords: ['flashcards', 'spaced repetition', 'learning', 'AI'],
};

export default function RootLayout({
     children,
}: {
     children: React.ReactNode;
}) {
     return (
          <html lang="en">
               <body className="bg-dark-bg text-white">
                    <div className="min-h-screen flex flex-col">
                         {children}
                    </div>
               </body>
          </html>
     );
}
