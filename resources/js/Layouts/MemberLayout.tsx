import React from 'react';
import { Head } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

interface MemberLayoutProps {
    title?: string;
    children: React.ReactNode;
    maxWidth?: string;
    noPadding?: boolean;
    header?: React.ReactNode;
}

export default function MemberLayout({
    title,
    children,
    maxWidth = 'max-w-7xl',
    noPadding = false,
    header,
}: MemberLayoutProps) {
    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            {title && <Head title={title} />}
            <Navbar />

            {header}

            {noPadding ? (
                <main className="flex-1 w-full">
                    {children}
                </main>
            ) : (
                <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:py-8 ${maxWidth}`}>
                    {children}
                </main>
            )}
        </div>
    );
}
