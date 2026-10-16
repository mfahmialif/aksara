import React from 'react';
import { Head } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

interface PublicLayoutProps {
    title?: string;
    children: React.ReactNode;
    showFooter?: boolean;
}

export default function PublicLayout({
    title,
    children,
    showFooter = true,
}: PublicLayoutProps) {
    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            {title && <Head title={title} />}
            <Navbar />

            <main className="flex-1 w-full flex flex-col">
                {children}
            </main>

            {showFooter && (
                <footer className="border-t-2 border-black bg-white py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-1 overflow-hidden">
                                <img src="/logo.png" alt="Aksara" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-heading font-black text-sm text-black uppercase tracking-tight">Aksara</span>
                                <span className="text-xs font-mono font-bold text-neutral-500">aksara.barakode.id</span>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider font-heading text-center sm:text-right">
                            Sistem Catatan Kolaboratif &bull; Neobrutalism
                        </p>
                    </div>
                </footer>
            )}
        </div>
    );
}
