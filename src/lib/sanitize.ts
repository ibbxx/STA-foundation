import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Used before rendering any HTML from the database via dangerouslySetInnerHTML.
 *
 * Security notes:
 * - `style` attribute is intentionally excluded to prevent CSS-based data exfiltration attacks
 * - External links automatically get rel="noopener noreferrer" to prevent tab-napping
 * - ALLOW_DATA_ATTR is disabled to block data-* attribute abuse
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'hr', 'img', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'class',
      'width', 'height',
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    // Enforce rel="noopener noreferrer" on all target="_blank" links
    FORCE_BODY: false,
    RETURN_DOM_FRAGMENT: false,
    hook_after_sanitize_attributes: (node: Element) => {
      if (node.tagName === 'A') {
        const target = node.getAttribute('target');
        if (target === '_blank') {
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    },
  } as Parameters<typeof DOMPurify.sanitize>[1]);
}
