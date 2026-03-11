import * as ImagePicker from 'expo-image-picker';

// Mock expo-image-picker (already mocked in jest.setup.js but we override here)
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
  },
}));

import {
  requestCameraPermissions,
  requestMediaLibraryPermissions,
  pickImage,
  takePhoto,
  pickVideo,
  recordVideo,
  compressImage,
  compressVideo,
  uploadProfilePicture,
  uploadHighlightVideo,
  uploadMemoryPhoto,
  uploadVenuePhoto,
  deleteUpload,
  uploadWithProgress,
  getTransformedUrl,
} from '../upload.service';

describe('Upload Service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  // ========================================================================
  // Permissions
  // ========================================================================

  describe('requestCameraPermissions', () => {
    it('should return true when granted', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestCameraPermissions();
      expect(result).toBe(true);
    });

    it('should return false when denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestCameraPermissions();
      expect(result).toBe(false);
    });
  });

  describe('requestMediaLibraryPermissions', () => {
    it('should return true when granted', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestMediaLibraryPermissions();
      expect(result).toBe(true);
    });

    it('should return false when denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestMediaLibraryPermissions();
      expect(result).toBe(false);
    });
  });

  // ========================================================================
  // Image / Video Pickers
  // ========================================================================

  describe('pickImage', () => {
    it('should return URI when image is selected', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///image.jpg' }],
      });

      const result = await pickImage();
      expect(result).toBe('file:///image.jpg');
    });

    it('should return null when picker is canceled', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
        assets: [],
      });

      const result = await pickImage();
      expect(result).toBeNull();
    });

    it('should throw when permissions not granted', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      await expect(pickImage()).rejects.toThrow('Camera roll permissions not granted');
    });
  });

  describe('takePhoto', () => {
    it('should return URI when photo is taken', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///photo.jpg' }],
      });

      const result = await takePhoto();
      expect(result).toBe('file:///photo.jpg');
    });

    it('should throw when camera permissions not granted', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      await expect(takePhoto()).rejects.toThrow('Camera permissions not granted');
    });
  });

  describe('pickVideo', () => {
    it('should return URI when video is selected', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///video.mp4' }],
      });

      const result = await pickVideo();
      expect(result).toBe('file:///video.mp4');
    });
  });

  describe('recordVideo', () => {
    it('should return URI when video is recorded', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///recorded.mp4' }],
      });

      const result = await recordVideo();
      expect(result).toBe('file:///recorded.mp4');
    });
  });

  // ========================================================================
  // Compression (currently no-ops)
  // ========================================================================

  describe('compressImage', () => {
    it('should return original URI (compression disabled)', async () => {
      const result = await compressImage('file:///original.jpg');
      expect(result).toBe('file:///original.jpg');
    });
  });

  describe('compressVideo', () => {
    it('should return original URI (compression disabled)', async () => {
      const result = await compressVideo('file:///original.mp4');
      expect(result).toBe('file:///original.mp4');
    });
  });

  // ========================================================================
  // Upload Functions
  // ========================================================================

  describe('uploadProfilePicture', () => {
    it('should upload and return result on success', async () => {
      const mockResult = { url: 'https://cdn.example.com/pic.jpg', publicId: 'pic123' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockResult }),
      });

      const result = await uploadProfilePicture('file:///pic.jpg', 'token123');
      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('upload/profile-picture');
      expect(config.method).toBe('POST');
      expect(config.headers.Authorization).toBe('Bearer token123');
    });

    it('should throw when upload fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ success: false, error: 'File too large' }),
      });

      await expect(
        uploadProfilePicture('file:///pic.jpg', 'token123')
      ).rejects.toThrow('File too large');
    });
  });

  describe('uploadHighlightVideo', () => {
    it('should upload highlight video successfully', async () => {
      const mockResult = { url: 'https://cdn.example.com/vid.mp4', publicId: 'vid123' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockResult }),
      });

      const result = await uploadHighlightVideo('file:///vid.mp4', 'token123');
      expect(result).toEqual(mockResult);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('upload/highlight');
    });
  });

  describe('uploadMemoryPhoto', () => {
    it('should upload memory photo successfully', async () => {
      const mockResult = { url: 'https://cdn.example.com/mem.jpg', publicId: 'mem123' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockResult }),
      });

      const result = await uploadMemoryPhoto('file:///mem.jpg', 'token123');
      expect(result).toEqual(mockResult);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('upload/memory');
    });
  });

  describe('uploadVenuePhoto', () => {
    it('should upload venue photo with venueId', async () => {
      const mockResult = { url: 'https://cdn.example.com/venue.jpg', publicId: 'v123' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockResult }),
      });

      const result = await uploadVenuePhoto('file:///venue.jpg', 'venue-1', 'token123');
      expect(result).toEqual(mockResult);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('upload/venue');
    });
  });

  // ========================================================================
  // Delete Upload
  // ========================================================================

  describe('deleteUpload', () => {
    it('should delete an upload successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      await deleteUpload('public-id-123', 'token123');

      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('upload/');
      expect(url).toContain('resourceType=image');
      expect(config.method).toBe('DELETE');
    });

    it('should throw when delete fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ success: false, error: 'Not found' }),
      });

      await expect(deleteUpload('id', 'token')).rejects.toThrow('Not found');
    });

    it('should support video resource type', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      await deleteUpload('vid-id', 'token', 'video');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('resourceType=video');
    });
  });

  // ========================================================================
  // Helpers
  // ========================================================================

  describe('uploadWithProgress', () => {
    it('should call upload function and return result', async () => {
      const mockResult = { url: 'https://example.com/file', publicId: 'f1' };
      const uploadFn = jest.fn().mockResolvedValue(mockResult);

      const result = await uploadWithProgress(uploadFn);

      expect(result).toEqual(mockResult);
      expect(uploadFn).toHaveBeenCalled();
    });

    it('should call onProgress callback', async () => {
      const mockResult = { url: 'https://example.com/file', publicId: 'f1' };
      const uploadFn = jest.fn().mockResolvedValue(mockResult);
      const onProgress = jest.fn();

      const result = await uploadWithProgress(uploadFn, onProgress);

      expect(result).toEqual(mockResult);
      // Should be called with 0 initially and 100 at end
      expect(onProgress).toHaveBeenCalledWith(0);
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('should re-throw errors from upload function', async () => {
      const uploadFn = jest.fn().mockRejectedValue(new Error('Upload failed'));

      await expect(uploadWithProgress(uploadFn)).rejects.toThrow('Upload failed');
    });
  });

  describe('getTransformedUrl', () => {
    it('should return a Cloudinary URL with transformation', () => {
      const url = getTransformedUrl('folder/image', 'w_200,h_200');
      expect(url).toContain('cloudinary.com');
      expect(url).toContain('w_200,h_200');
      expect(url).toContain('folder/image');
    });
  });
});
