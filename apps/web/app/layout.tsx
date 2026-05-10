import { ReactNode } from 'react';
import RootClientInit from './root-client-init';
import './globals.css';

function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
        <title>Smart Auto Typer</title>
        <meta name="description" content="Premium realtime phone-controlled desktop typing ecosystem" />
      </head>
      <body className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100 min-h-screen">
        <RootClientInit />
        {children}
      </body>
    </html>
  );
}

export default RootLayout;
