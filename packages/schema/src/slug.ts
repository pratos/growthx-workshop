// A URL-safe form of a title: lowercase ASCII letters and digits joined by single hyphens, at most `maxLength` long
// (64, the length of an Id). Accents are dropped ("Café Plan #2" -> "cafe-plan-2"); text with no Latin letters or digits gives ''.
export const slugify = (text: string, maxLength = 64): string =>
  text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, '');
