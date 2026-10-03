/**
 * Image normalization and safe fallback utilities for Rentch
 */

const FALLBACK_INTERIORS = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
];

/**
 * Normalizes image URLs, automatically migrating old CDN domains to the current live CDN.
 */
export function normalizeApartmentImageUrl(url?: string | null, fallbackIndex: number = 0): string {
  if (!url || typeof url !== 'string') {
    return FALLBACK_INTERIORS[fallbackIndex % FALLBACK_INTERIORS.length];
  }

  let clean = url.trim();

  // If protocol-relative URL
  if (clean.startsWith('//')) {
    clean = `https:${clean}`;
  }

  // Migrate old tnet static domain to live static-api CDN
  if (clean.includes('static-statements.tnet.ge')) {
    clean = clean.replace(/static-statements\.tnet\.ge/g, 'static-api-statements.tnet.ge');
  }

  return clean;
}

/**
 * Handler for image load errors, providing a graceful fallback
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackIndex: number = 0
) {
  const target = e.currentTarget;
  const currentSrc = target.src || '';

  // If already tried static-api or fallback, set fallback interior
  if (currentSrc.includes('static-statements.tnet.ge')) {
    target.src = currentSrc.replace(/static-statements\.tnet\.ge/g, 'static-api-statements.tnet.ge');
    return;
  }

  const fallback = FALLBACK_INTERIORS[fallbackIndex % FALLBACK_INTERIORS.length];
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
