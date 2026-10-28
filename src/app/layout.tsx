import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitme | AI Resume Tailor & Application Pipeline",
  description: "Evaluate candidate-job fit, tailor resumes to ATS perfection, and track applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

