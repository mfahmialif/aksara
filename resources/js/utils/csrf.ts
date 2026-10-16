export function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    return (
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ||
        ''
    );
}
