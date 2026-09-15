import { launchImageLibrary } from 'react-native-image-picker';

import type { AvatarFile } from '../api';

/**
 * Opens the system photo picker and returns a resized (≤ 512px) JPEG/PNG ready to upload,
 * or null when the user cancels. Throws on picker errors.
 */
export async function pickAvatarImage(): Promise<AvatarFile | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.8,
    includeBase64: false,
  });

  if (result.didCancel) {
    return null;
  }
  if (result.errorCode) {
    throw new Error(result.errorMessage || 'Could not open the photo library.');
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) {
    return null;
  }

  const type = asset.type || 'image/jpeg';
  const extension = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  return {
    uri: asset.uri,
    type,
    name: asset.fileName || `avatar.${extension}`,
  };
}
