/**
 * Service Layer Exports
 * Single entry point for all API services
 */

export { api, apiClient, ApiClient, ApiError } from './api';
export { venuesService } from './venues.service';
export { videosService } from './videos.service';
export { userService } from './user.service';

// Export contact and Instagram services
export * from './contacts.service';
export * from './instagram.service';
export * from './suggestions.service';

// Export upload service
export * from './upload.service';

// Re-export for convenience
import { venuesService as _venues } from './venues.service';
import { videosService as _videos } from './videos.service';
import { userService as _user } from './user.service';

export const services = {
  venues: _venues,
  videos: _videos,
  user: _user,
};
