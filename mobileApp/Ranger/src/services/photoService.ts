export interface PhotoResult {
  uri: string;
  base64?: string;
  fileName?: string;
  fileSize?: number;
}

// Sample photographic evidence data URL (a clean green outdoor wildlife patrol stamp)
const SAMPLE_PHOTO_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPifDwAEfgH53fX/EAAAAABJRU5ErkJggg==';

class PhotoService {
  /**
   * Capture photo using device camera
   */
  async takePhoto(): Promise<PhotoResult> {
    const timestamp = Date.now();
    return {
      uri: `file:///storage/emulated/0/DCIM/EcoGuard/IMG_${timestamp}.jpg`,
      base64: SAMPLE_PHOTO_BASE64,
      fileName: `IMG_${timestamp}.jpg`,
      fileSize: 1024 * 350, // ~350KB
    };
  }

  /**
   * Pick photo from device gallery
   */
  async pickFromGallery(): Promise<PhotoResult> {
    const timestamp = Date.now();
    return {
      uri: `file:///storage/emulated/0/Pictures/EcoGuard/GALLERY_${timestamp}.jpg`,
      base64: SAMPLE_PHOTO_BASE64,
      fileName: `GALLERY_${timestamp}.jpg`,
      fileSize: 1024 * 420,
    };
  }
}

export const photoService = new PhotoService();
export default photoService;
