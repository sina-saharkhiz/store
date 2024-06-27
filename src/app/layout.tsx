import './globals.css'
import type {Metadata} from 'next'
import {TelegramProvider} from "@/providers/telegram-provider";
import {ContextProvider} from "@/providers/context-provider";

export const metadata: Metadata = {
    title: 'فروشگاه سینا',
    description: 'فروشگاه وردپرس شما در تلگرام',
    viewport: {
        width: 'device-width',
        initialScale: 1,
        userScalable: false,
        viewportFit: "cover",
    },
    formatDetection: {
        telephone: false,
    },
    robots: {
        index: false,
        follow: false,
    },
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="fa">
        <body>
        <TelegramProvider>
            <ContextProvider>
                {children}
            </ContextProvider>
        </TelegramProvider>
        </body>
        </html>
    )
}
