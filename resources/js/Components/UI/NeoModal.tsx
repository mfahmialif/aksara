import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface NeoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function NeoModal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'md',
}: NeoModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            {/* Backdrop click */}
            <div className="fixed inset-0" onClick={onClose} />

            <div
                className={`
                    relative w-full ${maxWidthClasses[maxWidth]} bg-[#FFFDF8]
                    border-[3px] border-black
                    shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                    p-6 z-10 max-h-[90vh] overflow-y-auto
                `}
            >
                <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-black">
                    <h3 className="text-xl font-black text-black font-heading uppercase tracking-wide">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 border-2 border-black bg-white hover:bg-[#FF6B6B] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                    >
                        <X className="w-5 h-5 text-black" />
                    </button>
                </div>

                <div>{children}</div>
            </div>
        </div>
    );
}
