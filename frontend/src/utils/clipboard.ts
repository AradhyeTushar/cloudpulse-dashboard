/**
 * Universal clipboard copy utility that works reliably in both HTTPS and non-secure HTTP
 * environments (e.g. IP-based access like http://200.234.41.58:5173).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try navigator.clipboard if supported and allowed
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to textarea fallback
    }
  }

  // 2. Universal textarea fallback for HTTP contexts (Chrome disables navigator.clipboard on plain HTTP)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
