import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME, APP_URL } from "@/constants";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - Alquiler de Vehículos en Uruguay`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Encuentra y alquila vehículos únicos en Uruguay. La mejor plataforma de alquiler de autos entre particulares.",
  keywords: [
    "alquiler de autos",
    "alquiler de vehículos",
    "Uruguay",
    "rent a car",
    "car sharing",
    "Turo Uruguay",
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  openGraph: {
    type: "website",
    locale: "es_UY",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} - Alquiler de Vehículos en Uruguay`,
    description:
      "Encuentra y alquila vehículos únicos en Uruguay. La mejor plataforma de alquiler de autos entre particulares.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Alquiler de Vehículos en Uruguay`,
    description:
      "Encuentra y alquila vehículos únicos en Uruguay. La mejor plataforma de alquiler de autos entre particulares.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${sora.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
