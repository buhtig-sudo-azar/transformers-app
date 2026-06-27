import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeToggle, ThemeScript } from "@/components/learn/theme-toggle";
import { ScrollToTopBrain } from "@/components/learn/scroll-to-top";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Трансформеры — архитектура целиком",
  description:
    "Интерактивный курс: что идёт после attention — Q/K/V проекции, causal и padding маски, feed-forward слои, residual connections, LayerNorm, encoder/decoder семейства, positional encoding (sin/cos, RoPE, ALiBi), сквозной forward pass, BERT/GPT/T5. 10 модулей с живыми песочницами.",
  keywords: [
    "трансформер",
    "transformer",
    "attention",
    "self-attention",
    "QKV",
    "RoPE",
    "ALiBi",
    "LayerNorm",
    "residual",
    "BERT",
    "GPT",
    "T5",
    "encoder",
    "decoder",
    "NLP",
    "интерактивный курс",
  ],
  authors: [{ name: "Трансформеры — архитектура целиком" }],
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: ["/icon.svg"],
  },
  openGraph: {
    title: "Трансформеры — архитектура целиком",
    description:
      "10 модулей: Q/K/V, маски, FFN, residual+LN, encoder/decoder, positional encoding, forward pass, BERT/GPT/T5.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.variable} ${mono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeToggle />
        {children}
        <ScrollToTopBrain />
      </body>
    </html>
  );
}
