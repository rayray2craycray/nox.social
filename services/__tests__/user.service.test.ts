import { userService } from '../user.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = { id: 'user-1', displayName: 'Test User' };
      mockApi.get.mockResolvedValueOnce(mockProfile);

      const profile = await userService.getProfile();

      expect(profile).toBeDefined();
      expect(profile.id).toBe('user-1');
      expect(mockApi.get).toHaveBeenCalledWith('/user/profile');
    });
  });

  describe('updateProfile', () => {
    it('should update profile with new data', async () => {
      const updates = { displayName: 'New Name', bio: 'New bio' };
      mockApi.put.mockResolvedValueOnce({ id: 'user-1', ...updates });

      const updated = await userService.updateProfile(updates);

      expect(updated.displayName).toBe('New Name');
      expect(updated.bio).toBe('New bio');
      expect(mockApi.put).toHaveBeenCalledWith('/user/profile', updates);
    });
  });

  describe('createAccount', () => {
    it('should create account and return userId and token', async () => {
      mockApi.post.mockResolvedValueOnce({ userId: 'new-user', token: 'jwt-token' });

      const result = await userService.createAccount('testuser', 'password123');

      expect(result.userId).toBe('new-user');
      expect(result.token).toBe('jwt-token');
      expect(mockApi.post).toHaveBeenCalledWith('/auth/signup', {
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  describe('login', () => {
    it('should login and return userId and token', async () => {
      mockApi.post.mockResolvedValueOnce({ userId: 'user-1', token: 'jwt-token' });

      const result = await userService.login('testuser', 'password123');

      expect(result.userId).toBe('user-1');
      expect(result.token).toBe('jwt-token');
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockApi.post.mockResolvedValueOnce({ success: true });

      const result = await userService.logout();

      expect(result.success).toBe(true);
      expect(mockApi.post).toHaveBeenCalledWith('/auth/logout');
    });
  });
});
