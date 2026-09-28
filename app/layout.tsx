import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haram Blur | Gaze Guard",
  description: "A local-first companion for a more intentional online experience.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}
