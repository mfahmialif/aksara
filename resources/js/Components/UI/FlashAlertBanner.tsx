import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface FlashAlertBannerProps {
    success?: string | null;
    error?: string | null;
    duration?: number; // duration in milliseconds, default 5000ms (5s)
}

export default function FlashAlertBanner({
    success,
    error,
    duration = 5000,
}: FlashAlertBannerProps) {
    const message = error || success;
    const type: 'success' | 'error' = error ? 'error' : 'success';

    const [isVisible, setIsVisible] = useState(Boolean(message));
    const [isHovered, setIsHovered] = useState(false);

    const barRef = useRef<HTMLDivElement>(null);
    const remainingRef = useRef(duration);
    const lastTimestampRef = useRef<number | null>(null);
    const animFrameRef = useRef<number | null>(null);

    // Reset timer function
    const resetTimer = useCallback(() => {
        remainingRef.current = duration;
        lastTimestampRef.current = null;
        if (barRef.current) {
            barRef.current.style.width = '100%';
        }
    }, [duration]);

    // Reset when a new message arrives or changes
    useEffect(() => {
        if (message) {
            setIsVisible(true);
            resetTimer();
        } else {
            setIsVisible(false);
        }
    }, [message, resetTimer]);

    // Also reset on Inertia finish event when message is present
    useEffect(() => {
        const removeListener = router.on('finish', () => {
            if (message) {
                setIsVisible(true);
                resetTimer();
            }
        });
        return () => removeListener();
    }, [message, resetTimer]);

    // Close handler
    const handleClose = useCallback(() => {
        setIsVisible(false);
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
    }, []);

    // Countdown loop with pause on hover
    useEffect(() => {
        if (!isVisible || !message) {
            return;
        }

        // If hovered, pause time completely (freeze timer & progress bar)
        if (isHovered) {
            lastTimestampRef.current = null;
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = null;
            }
            return;
        }

        // Running: decrease remaining time smoothly every animation frame
        const tick = (timestamp: number) => {
            if (!lastTimestampRef.current) {
                lastTimestampRef.current = timestamp;
            }

            const elapsed = timestamp - lastTimestampRef.current;
            lastTimestampRef.current = timestamp;

            remainingRef.current = Math.max(0, remainingRef.current - elapsed);
            const percent = Math.max(0, (remainingRef.current / duration) * 100);

            if (barRef.current) {
                barRef.current.style.width = `${percent}%`;
            }

            if (remainingRef.current <= 0) {
                handleClose();
            } else {
                animFrameRef.current = requestAnimationFrame(tick);
            }
        };

        animFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = null;
            }
        };
    }, [isVisible, isHovered, message, duration, handleClose]);

    if (!isVisible || !message) {
        return null;
    }

    const isSuccess = type === 'success';

    return (
        <div className="border-t-2 border-black bg-[#FFFDF8] py-2.5 select-none transition-all duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onTouchStart={() => setIsHovered(true)}
                    onTouchEnd={() => setIsHovered(false)}
                    className={`relative overflow-hidden flex flex-col border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                        isSuccess ? 'bg-[#7FBC8C]' : 'bg-[#FF6B6B]'
                    }`}
                >
                    {/* Alert Message Content */}
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 bg-white border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                {isSuccess ? (
                                    <CheckCircle2 className="w-4 h-4 text-black" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-black" />
                                )}
                            </div>
                            <span className="text-xs sm:text-sm font-black font-heading uppercase tracking-wide text-black truncate">
                                {message}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {isHovered && (
                                <span className="text-[10px] font-heading font-black uppercase px-1.5 py-0.5 bg-black text-white border border-black hidden xs:inline-block">
                                    Dijeda
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleClose}
                                className="p-1 hover:bg-black/10 border border-transparent hover:border-black transition-colors cursor-pointer shrink-0"
                                title="Tutup pemberitahuan"
                                aria-label="Tutup"
                            >
                                <X className="w-4 h-4 text-black" />
                            </button>
                        </div>
                    </div>

                    {/* Countdown Progress Bar Track */}
                    <div className="h-1.5 w-full bg-black/20 overflow-hidden">
                        <div
                            ref={barRef}
                            className="h-full bg-black will-change-[width]"
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
