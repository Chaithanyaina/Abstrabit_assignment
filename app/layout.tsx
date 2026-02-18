import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Bookmark Manager",
    description: "A private, real-time bookmark manager with Google sign-in",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
