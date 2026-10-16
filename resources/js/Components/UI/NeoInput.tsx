import React from 'react';

interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function NeoInput({
    label,
    error,
    helperText,
    className = '',
    id,
    ...props
}: NeoInputProps) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-bold uppercase tracking-wider text-black mb-1.5 font-heading">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`
                    w-full px-3.5 py-2.5 bg-white text-black
                    border-2 border-black
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                    focus:outline-none focus:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                    transition-all duration-150 font-medium text-sm
                    placeholder:text-neutral-400
                    disabled:bg-neutral-100 disabled:opacity-75 disabled:cursor-not-allowed
                    ${error ? 'border-rose-500 shadow-[3px_3px_0px_0px_rgba(244,63,94,1)]' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && <p className="mt-1 text-xs font-bold text-rose-600">{error}</p>}
            {helperText && !error && <p className="mt-1 text-xs text-neutral-600 font-medium">{helperText}</p>}
        </div>
    );
}

interface NeoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function NeoTextarea({
    label,
    error,
    helperText,
    className = '',
    id,
    ...props
}: NeoTextareaProps) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-bold uppercase tracking-wider text-black mb-1.5 font-heading">
                    {label}
                </label>
            )}
            <textarea
                id={inputId}
                className={`
                    w-full px-3.5 py-2.5 bg-white text-black
                    border-2 border-black
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                    focus:outline-none focus:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                    transition-all duration-150 font-medium text-sm
                    placeholder:text-neutral-400
                    disabled:bg-neutral-100 disabled:opacity-75 disabled:cursor-not-allowed
                    ${error ? 'border-rose-500 shadow-[3px_3px_0px_0px_rgba(244,63,94,1)]' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && <p className="mt-1 text-xs font-bold text-rose-600">{error}</p>}
            {helperText && !error && <p className="mt-1 text-xs text-neutral-600 font-medium">{helperText}</p>}
        </div>
    );
}

export interface NeoSelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

export interface NeoSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    options?: NeoSelectOption[];
    children?: React.ReactNode;
}

export function NeoSelect({
    label,
    error,
    helperText,
    className = '',
    options,
    children,
    id,
    ...props
}: NeoSelectProps) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-bold uppercase tracking-wider text-black mb-1.5 font-heading">
                    {label}
                </label>
            )}
            <select
                id={inputId}
                className={`
                    w-full px-3.5 py-2.5 bg-white text-black
                    border-2 border-black
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                    focus:outline-none focus:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                    transition-all duration-150 font-bold text-sm
                    cursor-pointer
                    ${error ? 'border-rose-500 shadow-[3px_3px_0px_0px_rgba(244,63,94,1)]' : ''}
                    ${className}
                `}
                {...props}
            >
                {options && options.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled} className="text-black bg-white py-1">
                        {opt.label}
                    </option>
                ))}
                {children}
            </select>
            {error && <p className="mt-1 text-xs font-bold text-rose-600">{error}</p>}
            {helperText && !error && <p className="mt-1 text-xs text-neutral-600 font-medium">{helperText}</p>}
        </div>
    );
}

export interface NeoBadgeProps {
    children: React.ReactNode;
    variant?: 'yellow' | 'purple' | 'mint' | 'coral' | 'sky' | 'pink' | 'orange' | 'white' | 'gray';
    className?: string;
}

export function NeoBadge({
    children,
    variant = 'yellow',
    className = '',
}: NeoBadgeProps) {
    const colors = {
        yellow: 'bg-[#FFDC58] text-black',
        purple: 'bg-[#A388EE] text-black',
        mint: 'bg-[#7FBC8C] text-black',
        coral: 'bg-[#FF6B6B] text-black',
        sky: 'bg-[#69D2E7] text-black',
        pink: 'bg-[#FF8FAB] text-black',
        orange: 'bg-[#FFA94D] text-black',
        white: 'bg-white text-black',
        gray: 'bg-neutral-200 text-neutral-800',
    };

    return (
        <span
            className={`
                inline-flex items-center gap-1 px-2.5 py-0.5
                border-2 border-black
                shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                text-xs font-black uppercase tracking-wider
                ${colors[variant]}
                ${className}
            `}
        >
            {children}
        </span>
    );
}
