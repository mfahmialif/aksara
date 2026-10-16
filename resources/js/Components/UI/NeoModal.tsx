import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/modalScrollLock';

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
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!isOpen) return;

        lockBodyScroll();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            unlockBodyScroll();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const maxWidthClasses = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
            onClick={onClose}
        >
            {/* Modal Dialog Container */}
            <div
                className={`
                    relative w-full ${maxWidthClasses[maxWidth]} bg-[#FFFDF8]
                    rounded-t-[24px] sm:rounded-none
                    border-t-[3px] border-x-[3px] sm:border-[3px] border-black border-b-0 sm:border-b-[3px]
                    shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                    p-5 sm:p-6 z-10 max-h-[88vh] sm:max-h-[90vh] overflow-y-auto
                    animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200
                    overscroll-contain
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile Drag Handle Indicator */}
                <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

                <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 border-b-2 border-black">
                    <h3 className="text-lg sm:text-xl font-black text-black font-heading uppercase tracking-wide">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 border-2 border-black bg-white hover:bg-[#FF6B6B] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                        title="Tutup (Esc)"
                    >
                        <X className="w-5 h-5 text-black" />
                    </button>
                </div>

                <div>{children}</div>
            </div>
        </div>
    );
}
