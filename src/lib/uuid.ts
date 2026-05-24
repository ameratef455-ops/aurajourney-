export function safeRandomUUID(): string {
  try {
    if (typeof window !== 'undefined' && window.crypto) {
      if (window.crypto.randomUUID) {
        return window.crypto.randomUUID();
      }
      if (window.crypto.getRandomValues) {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        // Set version (4) and variant (2) bits
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
      }
    }
  } catch (e) {
    console.error('Safe UUID generation failed, using Math.random fallback', e);
  }
  // Ultimate robust fallback
  return 'id_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
}
