import { env } from '../config/env';

/** Backend returns relative paths for uploads ("/uploads/…") and absolute URLs for Google avatars. */
export function resolveAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${env.apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}
