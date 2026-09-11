import { UploadProvider } from './components/UploadProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Italiana&family=Archivo:wght@500;600&family=Albert+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <UploadProvider>
          {children}
        </UploadProvider>
      </body>
    </html>
  );
}
