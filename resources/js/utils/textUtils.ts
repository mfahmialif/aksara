/**
 * Converts rich HTML content to clean, human-readable plain text.
 * Preserves intentional line breaks and paragraph breaks (\n),
 * strips all HTML tags, decodes HTML entities (including &nbsp;),
 * and normalizes whitespace cleanly.
 */
export function cleanHtmlToPlainText(rawHtml: string): string {
    if (!rawHtml) return '';

    // 1. Convert line breaks and block element closings to newlines
    let text = rawHtml
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n')
        .replace(/<[^>]*>/g, '');

    // 2. Decode common HTML entities
    text = text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&hellip;/gi, '…')
        .replace(/&ndash;/gi, '–')
        .replace(/&mdash;/gi, '—');

    // 3. Normalize Unicode non-breaking spaces to standard space
    text = text.replace(/[\u00A0\u202F]/g, ' ');

    // 4. Clean line by line: collapse multiple spaces, trim lines, preserve single empty line for paragraph breaks
    const lines = text
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .filter((line, idx, arr) => {
            if (line.length === 0) {
                return idx > 0 && arr[idx - 1].length > 0;
            }
            return true;
        });

    return lines.join('\n').trim();
}

/**
 * Extracts a clean, multi-line excerpt from note content_json.
 */
export function parseNoteSnippet(contentJson: string | null, maxLength: number = 180): string {
    if (!contentJson) return 'Catatan kosong...';

    try {
        const parsed = JSON.parse(contentJson);
        if (parsed.html) {
            const cleaned = cleanHtmlToPlainText(parsed.html);
            if (cleaned) {
                return cleaned.slice(0, maxLength);
            }
        }
        if (Array.isArray(parsed.checklist) && parsed.checklist.length > 0) {
            const items = parsed.checklist
                .slice(0, 3)
                .map((item: { text?: string; completed?: boolean }) => {
                    const cleanText = cleanHtmlToPlainText(item.text || '');
                    return `${item.completed ? '☑' : '☐'} ${cleanText || 'Item tugas'}`;
                })
                .join('\n');
            return items || 'Daftar periksa kosong.';
        }
        if (parsed.type === 'drawing') {
            return 'Catatan sketsa / gambar visual.';
        }
    } catch {
        const fallback = cleanHtmlToPlainText(contentJson);
        return fallback.slice(0, maxLength) || 'Catatan dokumen...';
    }

    return 'Catatan dokumen...';
}
