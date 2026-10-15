// resources/js/Components/DebouncedPrefetchLink.tsx
import React, { useRef, useCallback } from 'react';
import { Link, router, InertiaLinkProps } from '@inertiajs/react';

interface Props extends InertiaLinkProps {
  debounceMs?: number;
  cacheFor?: string | number;
}

export default function DebouncedPrefetchLink({
  href,
  debounceMs = 200,
  cacheFor = '30s',
  onMouseEnter,
  onMouseLeave,
  children,
  ...props
}: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onMouseEnter) onMouseEnter(e);

      timerRef.current = setTimeout(() => {
        router.prefetch(
          href.toString(),
          { method: 'get' },
          { cacheFor }
        );
      }, debounceMs);
    },
    [href, debounceMs, cacheFor, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onMouseLeave) onMouseLeave(e);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [onMouseLeave]
  );

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Link>
  );
}
