let modalCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

export function lockBodyScroll(): void {
    if (typeof document === 'undefined') return;

    modalCount++;
    if (modalCount === 1) {
        // Prevent layout shift from scrollbar disappearing
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        originalOverflow = document.body.style.overflow;
        originalPaddingRight = document.body.style.paddingRight;

        if (scrollBarWidth > 0) {
            document.body.style.paddingRight = `${scrollBarWidth}px`;
        }

        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }
}

export function forceUnlockBodyScroll(): void {
    if (typeof document === 'undefined') return;

    modalCount = 0;
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('height');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('height');
    document.body.style.removeProperty('touch-action');
}

export function unlockBodyScroll(): void {
    if (typeof document === 'undefined') return;

    modalCount = Math.max(0, modalCount - 1);
    if (modalCount === 0) {
        forceUnlockBodyScroll();
    } else {
        // Safety check: if all modal overlays have unmounted from DOM,
        // force unlock so the page scroll is guaranteed never to stay frozen
        setTimeout(() => {
            const hasVisibleModal = document.querySelector('.fixed.inset-0.z-50, [role="dialog"]');
            if (!hasVisibleModal) {
                forceUnlockBodyScroll();
            }
        }, 50);
    }
}

// Global safety listener for browser history navigation
if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
        setTimeout(() => {
            const hasVisibleModal = document.querySelector('.fixed.inset-0.z-50, [role="dialog"]');
            if (!hasVisibleModal) {
                forceUnlockBodyScroll();
            }
        }, 50);
    });
}
