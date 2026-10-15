import React from 'react';

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    color?: string; // background color, defaults to white
    shadowSize?: 'sm' | 'md' | 'lg';
    hoverEffect?: boolean;
}

export default function NeoCard({
    children,
    color = 'bg-white',
    shadowSize = 'md',
    hoverEffect = false,
    className = '',
    ...props
}: NeoCardProps) {
    const shadowMap = {
        sm: 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        md: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
        lg: 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
    };

    return (
        <div
            className={`
                border-2 border-black
                ${color}
                ${shadowMap[shadowSize]}
                ${hoverEffect ? 'transition-all duration-150 ease-out hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}
