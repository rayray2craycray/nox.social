import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock the upload service
jest.mock('@/services/upload.service', () => ({
  pickImage: jest.fn(),
  takePhoto: jest.fn(),
  pickVideo: jest.fn(),
  recordVideo: jest.fn(),
  uploadProfilePicture: jest.fn(),
  uploadHighlightVideo: jest.fn(),
  uploadMemoryPhoto: jest.fn(),
  uploadVenuePhoto: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    accessToken: 'test-token-123',
  }),
}));

import {
  pickImage,
  takePhoto,
  pickVideo,
  recordVideo,
  uploadProfilePicture,
  uploadHighlightVideo,
  uploadMemoryPhoto,
  uploadVenuePhoto,
} from '@/services/upload.service';
import { useUpload } from '../useUpload';

const mockPickImage = pickImage as jest.MockedFunction<typeof pickImage>;
const mockTakePhoto = takePhoto as jest.MockedFunction<typeof takePhoto>;
const mockPickVideo = pickVideo as jest.MockedFunction<typeof pickVideo>;
const mockRecordVideo = recordVideo as jest.MockedFunction<typeof recordVideo>;
const mockUploadProfilePicture = uploadProfilePicture as jest.MockedFunction<typeof uploadProfilePicture>;
const mockUploadHighlightVideo = uploadHighlightVideo as jest.MockedFunction<typeof uploadHighlightVideo>;
const mockUploadMemoryPhoto = uploadMemoryPhoto as jest.MockedFunction<typeof uploadMemoryPhoto>;
const mockUploadVenuePhoto = uploadVenuePhoto as jest.MockedFunction<typeof uploadVenuePhoto>;

// Suppress console noise
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

const mockUploadResult = { url: 'https://cdn.example.com/file.jpg', publicId: 'file123' };

describe('useUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  // ========================================================================
  // Initial state
  // ========================================================================

  it('should start with correct initial state', () => {
    const { result } = renderHook(() => useUpload());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.uploadResult).toBeNull();
    expect(result.current.uploadError).toBeNull();
  });

  it('should expose all expected methods', () => {
    const { result } = renderHook(() => useUpload());

    expect(typeof result.current.uploadProfileFromGallery).toBe('function');
    expect(typeof result.current.uploadProfileFromCamera).toBe('function');
    expect(typeof result.current.uploadHighlightFromGallery).toBe('function');
    expect(typeof result.current.recordAndUploadHighlight).toBe('function');
    expect(typeof result.current.uploadMemoryFromGallery).toBe('function');
    expect(typeof result.current.uploadVenueFromGallery).toBe('function');
    expect(typeof result.current.uploadHighlightFromUri).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  // ========================================================================
  // uploadProfileFromGallery
  // ========================================================================

  it('should upload profile picture from gallery successfully', async () => {
    mockPickImage.mockResolvedValue('file:///photo.jpg');
    mockUploadProfilePicture.mockResolvedValue(mockUploadResult);
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useUpload({ onSuccess }));

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadProfileFromGallery();
    });

    expect(mockPickImage).toHaveBeenCalledWith({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    expect(mockUploadProfilePicture).toHaveBeenCalledWith('file:///photo.jpg', 'test-token-123');
    expect(uploadResult).toEqual(mockUploadResult);
    expect(onSuccess).toHaveBeenCalledWith(mockUploadResult);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadResult).toEqual(mockUploadResult);
  });

  it('should return null when gallery picker is cancelled', async () => {
    mockPickImage.mockResolvedValue(null as any);

    const { result } = renderHook(() => useUpload());

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadProfileFromGallery();
    });

    expect(uploadResult).toBeNull();
    expect(mockUploadProfilePicture).not.toHaveBeenCalled();
    expect(result.current.isUploading).toBe(false);
  });

  it('should handle upload error and call onError callback', async () => {
    const uploadError = new Error('Upload failed');
    mockPickImage.mockResolvedValue('file:///photo.jpg');
    mockUploadProfilePicture.mockRejectedValue(uploadError);
    const onError = jest.fn();

    const { result } = renderHook(() => useUpload({ onError }));

    await act(async () => {
      await result.current.uploadProfileFromGallery();
    });

    expect(onError).toHaveBeenCalledWith(uploadError);
    expect(result.current.uploadError).toEqual(uploadError);
    expect(result.current.isUploading).toBe(false);
  });

  it('should show Alert when upload fails without onError callback', async () => {
    mockPickImage.mockResolvedValue('file:///photo.jpg');
    mockUploadProfilePicture.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.uploadProfileFromGallery();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Upload Failed', 'Server error');
  });

  // ========================================================================
  // uploadProfileFromCamera
  // ========================================================================

  it('should upload profile picture from camera successfully', async () => {
    mockTakePhoto.mockResolvedValue('file:///camera.jpg');
    mockUploadProfilePicture.mockResolvedValue(mockUploadResult);

    const { result } = renderHook(() => useUpload());

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadProfileFromCamera();
    });

    expect(mockTakePhoto).toHaveBeenCalledWith({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    expect(mockUploadProfilePicture).toHaveBeenCalledWith('file:///camera.jpg', 'test-token-123');
    expect(uploadResult).toEqual(mockUploadResult);
  });

  it('should return null when camera is cancelled', async () => {
    mockTakePhoto.mockResolvedValue(null as any);

    const { result } = renderHook(() => useUpload());

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadProfileFromCamera();
    });

    expect(uploadResult).toBeNull();
    expect(mockUploadProfilePicture).not.toHaveBeenCalled();
  });

  // ========================================================================
  // uploadHighlightFromGallery
  // ========================================================================

  it('should upload highlight video from gallery', async () => {
    mockPickVideo.mockResolvedValue('file:///highlight.mp4');
    mockUploadHighlightVideo.mockResolvedValue(mockUploadResult);

    const { result } = renderHook(() => useUpload());

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadHighlightFromGallery();
    });

    expect(mockPickVideo).toHaveBeenCalledWith({
      allowsEditing: true,
      quality: 0.8,
      maxDuration: 15,
    });
    expect(mockUploadHighlightVideo).toHaveBeenCalledWith('file:///highlight.mp4', 'test-token-123');
    expect(uploadResult).toEqual(mockUploadResult);
  });

  // ========================================================================
  // recordAndUploadHighlight
  // ========================================================================

  it('should record and upload highlight video', async () => {
    mockRecordVideo.mockResolvedValue('file:///recorded.mp4');
    mockUploadHighlightVideo.mockResolvedValue(mockUploadResult);

    const { result } = renderHook(() => useUpload());

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.recordAndUploadHighlight();
    });

    expect(mockRecordVideo).toHaveBeenCalledWith({
      allowsEditing: true,
      quality: 0.8,
      maxDuration: 15,
    });
    expect(mockUploadHighlightVideo).toHaveBeenCalledWith('file:///recorded.mp4', 'test-token-123');
    expect(uploadResult).toEqual(mockUploadResult);
  });

  // ========================================================================
  // uploadMemoryFromGallery
  // ========================================================================

  it('should upload memory photo from gallery', async () => {
    mockPickImage.mockResolvedValue('file:///memory.jpg');
    mockUploadMemoryPhoto.mockResolvedValue(mockUploadResult);

    const { result } = renderHook(() => useUpload());

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadMemoryFromGallery();
    });

    expect(mockPickImage).toHaveBeenCalledWith({
      allowsEditing: false,
      quality: 0.9,
    });
    expect(mockUploadMemoryPhoto).toHaveBeenCalledWith('file:///memory.jpg', 'test-token-123');
    expect(uploadResult).toEqual(mockUploadResult);
  });

  // ========================================================================
  // uploadVenueFromGallery
  // ========================================================================

  it('should upload venue photo with venueId', async () => {
    mockPickImage.mockResolvedValue('file:///venue.jpg');
    mockUploadVenuePhoto.mockResolvedValue(mockUploadResult);

    const { result } = renderHook(() => useUpload());

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadVenueFromGallery('venue-abc');
    });

    expect(mockPickImage).toHaveBeenCalledWith({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });
    expect(mockUploadVenuePhoto).toHaveBeenCalledWith('file:///venue.jpg', 'venue-abc', 'test-token-123');
    expect(uploadResult).toEqual(mockUploadResult);
  });

  // ========================================================================
  // uploadHighlightFromUri
  // ========================================================================

  it('should upload highlight video from existing URI', async () => {
    mockUploadHighlightVideo.mockResolvedValue(mockUploadResult);

    const { result } = renderHook(() => useUpload());

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadHighlightFromUri('file:///existing.mp4');
    });

    expect(mockUploadHighlightVideo).toHaveBeenCalledWith('file:///existing.mp4', 'test-token-123');
    expect(uploadResult).toEqual(mockUploadResult);
  });

  it('should handle error during uploadHighlightFromUri', async () => {
    mockUploadHighlightVideo.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.uploadHighlightFromUri('file:///bad.mp4');
    });

    expect(result.current.uploadError).toEqual(new Error('Network error'));
    expect(Alert.alert).toHaveBeenCalledWith('Upload Failed', 'Network error');
  });

  // ========================================================================
  // reset
  // ========================================================================

  it('should reset all state when reset is called', async () => {
    mockPickImage.mockResolvedValue('file:///photo.jpg');
    mockUploadProfilePicture.mockResolvedValue(mockUploadResult);

    const { result } = renderHook(() => useUpload());

    // First do an upload to populate state
    await act(async () => {
      await result.current.uploadProfileFromGallery();
    });

    expect(result.current.uploadResult).toEqual(mockUploadResult);

    // Now reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.uploadResult).toBeNull();
    expect(result.current.uploadError).toBeNull();
  });

  // ========================================================================
  // Auth check
  // ========================================================================

  it('should throw when not authenticated', async () => {
    // Temporarily override the useAuth mock to return no token
    const AuthContext = require('@/contexts/AuthContext');
    const originalUseAuth = AuthContext.useAuth;
    AuthContext.useAuth = () => ({ accessToken: null });

    mockPickImage.mockResolvedValue('file:///photo.jpg');

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.uploadProfileFromGallery();
    });

    expect(result.current.uploadError).toBeTruthy();
    expect(result.current.uploadError.message).toBe('Not authenticated');
    expect(Alert.alert).toHaveBeenCalledWith('Upload Failed', 'Not authenticated');

    // Restore original mock
    AuthContext.useAuth = originalUseAuth;
  });
});
