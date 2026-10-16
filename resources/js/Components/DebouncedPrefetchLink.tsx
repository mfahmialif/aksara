// resources/js/Components/DebouncedPrefetchLink.tsx
import React, { forwardRef } from 'react';
import { Link, InertiaLinkProps } from '@inertiajs/react';

export interface DebouncedPrefetchLinkProps extends InertiaLinkProps {
    debounceMs?: number;
    cacheFor?: string | number;
}

// Check if URL is internal/same-origin or relative
const isSameOriginOrRelative = (urlStr: string): boolean => {
    if (!urlStr) return false;
    if (
        urlStr.startsWith('#') ||
        urlStr.startsWith('mailto:') ||
        urlStr.startsWith('tel:') ||
        urlStr.startsWith('javascript:')
    ) {
        return false;
    }
    if (urlStr.startsWith('/') && !urlStr.startsWith('//')) {
        return true;
    }
    try {
        const parsed = new URL(urlStr, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
        return typeof window !== 'undefined' ? parsed.origin === window.location.origin : true;
    } catch {
        return false;
    }
};

// Normalize absolute same-origin URLs (e.g. from Laravel paginator links) to clean relative paths
const normalizeUrl = (urlStr: string): string => {
    if (!urlStr) return '';
    if (urlStr.startsWith('/') && !urlStr.startsWith('//')) return urlStr;
    try {
        const parsed = new URL(urlStr, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
        if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
            return parsed.pathname + parsed.search + parsed.hash;
        }
    } catch {}
    return urlStr;
};

const DebouncedPrefetchLink = forwardRef<HTMLAnchorElement, DebouncedPrefetchLinkProps>(
    (
        {
            href,
            debounceMs,
            cacheFor = '1m',
            prefetch = 'hover',
            children,
            ...props
        },
        ref
    ) => {
        const rawUrl = typeof href === 'string' ? href : (href && 'url' in href ? href.url : '');
        const targetUrl = normalizeUrl(rawUrl);
        const isPrefetchable = Boolean(
            targetUrl &&
            isSameOriginOrRelative(rawUrl) &&
            (props.method === undefined || props.method.toLowerCase() === 'get')
        );

        // Native Inertia prefetch: defaults to 'hover' (uses Inertia's built-in hoverDelay debounce).
        // Disallow 'mount' by default on list items/paginations to prevent freezing the server.
        const linkPrefetchProp = isPrefetchable ? (prefetch ?? 'hover') : false;

        return (
            <Link
                ref={ref}
                href={targetUrl || href}
                prefetch={linkPrefetchProp}
                cacheFor={cacheFor}
                {...props}
            >
                {children}
            </Link>
        );
    }
);

DebouncedPrefetchLink.displayName = 'DebouncedPrefetchLink';

export default DebouncedPrefetchLink;
