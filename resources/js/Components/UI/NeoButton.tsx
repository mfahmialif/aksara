import React from 'react';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'yellow' | 'purple' | 'mint' | 'coral' | 'sky' | 'white' | 'black' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    children: React.ReactNode;
}

export default function NeoButton({
    variant = 'yellow',
    size = 'md',
    fullWidth = false,
    className = '',
    children,
    disabled,
    ...props
}: NeoButtonProps) {
    const variantClasses = {
        yellow: 'bg-[#FFDC58] text-black hover:bg-[#ffe580]',
        purple: 'bg-[#A388EE] text-black hover:bg-[#b59ffa]',
        mint: 'bg-[#7FBC8C] text-black hover:bg-[#92cca0]',
        coral: 'bg-[#FF6B6B] text-black hover:bg-[#ff8585]',
        sky: 'bg-[#69D2E7] text-black hover:bg-[#85dded]',
        white: 'bg-white text-black hover:bg-neutral-100',
        black: 'bg-black text-white hover:bg-neutral-800',
        danger: 'bg-rose-500 text-white hover:bg-rose-600',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs font-bold',
        md: 'px-4 py-2 text-sm font-bold',
        lg: 'px-6 py-3 text-base font-black',
    };

    return (
        <button
            disabled={disabled}
            className={`
                inline-flex items-center justify-center gap-2
                border-2 border-black
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                font-heading tracking-wide uppercase
                transition-all duration-150 ease-out
                cursor-pointer select-none
                ${disabled ? 'opacity-50 cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'}
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
}
