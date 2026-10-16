import React from 'react';
import { Head } from '@inertiajs/react';
import AdminNavbar from '@/Components/AdminNavbar';

interface AdminLayoutProps {
    title?: string;
    children: React.ReactNode;
    maxWidth?: string;
    spaceY?: string;
}

export default function AdminLayout({
    title,
    children,
    maxWidth = 'max-w-7xl',
    spaceY = 'space-y-8',
}: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            {title && <Head title={title} />}
            <AdminNavbar />

            <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:py-8 ${maxWidth} ${spaceY}`}>
                {children}
            </main>
        </div>
    );
}
