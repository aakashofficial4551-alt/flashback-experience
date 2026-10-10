// Turns "/media/images/a.webp" into a full URL when settings.mediaBase is set
// (for example a Cloudinary public delivery URL). Absolute URLs are left alone.
const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export function resolveMedia(path, base = '') {
  if (!path || typeof path !== 'string') return null;
  if (ABSOLUTE.test(path) || !base) return path;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
