import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

export interface PhotoResult {
  /** Local device URI – used only for preview, never sent in JSON */
  uri: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

// ── Image picker options ──────────────────────────────────────────────────────
// quality 0.75 → good evidence clarity at ~300–600 KB on modern phones
// base64: false → we send the raw file via multipart, NOT base64 in JSON
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: (ImagePicker as any).MediaType?.IMAGES || 'images',
  allowsEditing: true,
  quality: 0.75,
  base64: false,           // ← KEY: never embed base64 in the picker result
};

class PhotoService {
  /**
   * Capture photo using the device camera.
   * Returns a PhotoResult with a local URI for preview.
   * Returns null if permission denied or user cancelled.
   */
  async takePhoto(): Promise<PhotoResult | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take evidence photos.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);

    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      fileName: asset.fileName || `IMG_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType || 'image/jpeg',
    };
  }

  /**
   * Pick a photo from the device gallery / photo library.
   * Returns a PhotoResult with a local URI for preview.
   * Returns null if permission denied or user cancelled.
   */
  async pickFromGallery(): Promise<PhotoResult | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Photo library permission is required to choose evidence images.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      fileName: asset.fileName || `GALLERY_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType || 'image/jpeg',
    };
  }

  /**
   * Upload a photo to the backend using multipart/form-data.
   *
   * Uses expo-file-system to guarantee reliable file uploads on Android/iOS
   * without running into React Native's fetch() + FormData bugs.
   *
   * @returns Persistent URL string (e.g. "http://192.168.x.x:5000/uploads/evidence/evidence-123.jpg")
   * @throws Error if upload fails
   */
  async uploadEvidence(photo: PhotoResult): Promise<string> {
    // Retrieve auth token from storage
    let token: string | null = null;
    try {
      token = await AsyncStorage.getItem('@ecoguard_auth_token_v1');
    } catch {
      // proceed without token
    }

    const uploadUrl = `${API_BASE_URL}/api/mobile/conflicts/upload-photo`;
    console.log('[PhotoService] Starting multipart upload via expo-file-system to:', uploadUrl);
    console.log('[PhotoService] File:', photo.fileName, '| MIME:', photo.mimeType, '| Size:', photo.fileSize, 'bytes');

    try {
      const response = await FileSystem.uploadAsync(uploadUrl, photo.uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART as any,
        fieldName: 'photo',
        mimeType: photo.mimeType || 'image/jpeg',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log('[PhotoService] Server responded — HTTP status:', response.status);

      if (response.status < 200 || response.status >= 300) {
        console.error('[PhotoService] Upload failed:', response.status, response.body);
        throw new Error(`Evidence upload failed (HTTP ${response.status}). Please try again.`);
      }

      const json = JSON.parse(response.body);
      console.log('[PhotoService] Server JSON response:', json);

      if (!json.success || !json.data?.photoUrl) {
        throw new Error('Evidence upload succeeded but server returned no URL.');
      }

      console.log('[PhotoService] Upload successful. Persistent URL:', json.data.photoUrl);
      return json.data.photoUrl as string;
    } catch (err: any) {
      console.error('[PhotoService] Upload error:', err);
      throw new Error(err.message || 'Evidence upload failed due to network or server error.');
    }
  }
}

export const photoService = new PhotoService();
export default photoService;
