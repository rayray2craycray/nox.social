/**
 * Instagram Service
 * Handles Instagram Graph API interactions
 */

const axios = require('axios');

class InstagramService {
  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID;
    this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    this.graphApiUrl = process.env.INSTAGRAM_GRAPH_API_URL || 'https://graph.instagram.com';
    this.apiUrl = process.env.INSTAGRAM_API_URL || 'https://api.instagram.com';
  }

  /**
   * Exchange authorization code for short-lived access token
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/oauth/access_token`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
          code,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Instagram token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange Instagram authorization code');
    }
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  async getLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: this.clientSecret,
          access_token: shortLivedToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Instagram long-lived token error:', error.response?.data || error.message);
      throw new Error('Failed to get long-lived Instagram token');
    }
  }

  /**
   * Get Instagram user profile
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/me`, {
        params: {
          fields: 'id,username,account_type',
          access_token: accessToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Instagram profile fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch Instagram profile');
    }
  }

  /**
   * Get Instagram following list
   * Note: Requires Instagram Business/Creator account
   */
  async getFollowing(accessToken, userId) {
    try {
      // First, check account type
      const profile = await this.getUserProfile(accessToken);

      if (profile.account_type !== 'BUSINESS' && profile.account_type !== 'CREATOR') {
        throw new Error('Instagram following list requires Business or Creator account');
      }

      // Get following list (this may require additional permissions)
      const response = await axios.get(`${this.graphApiUrl}/${userId}/following`, {
        params: {
          access_token: accessToken,
          fields: 'id,username',
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Instagram following fetch error:', error.response?.data || error.message);

      // Return empty array if following list not available
      // (Common for personal accounts)
      if (error.response?.status === 400) {
        console.log('Following list not available (may require Business account)');
        return [];
      }

      throw new Error('Failed to fetch Instagram following list');
    }
  }

  /**
   * Refresh long-lived token
   * Tokens can be refreshed if they're at least 24 hours old and not expired
   */
  async refreshLongLivedToken(accessToken) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Instagram token refresh error:', error.response?.data || error.message);
      throw new Error('Failed to refresh Instagram token');
    }
  }

  /**
   * Complete OAuth flow: exchange code for long-lived token
   */
  async completeOAuthFlow(code) {
    try {
      // Step 1: Exchange code for short-lived token
      const shortTokenData = await this.exchangeCodeForToken(code);

      // Step 2: Exchange short-lived for long-lived token
      const longTokenData = await this.getLongLivedToken(shortTokenData.access_token);

      // Step 3: Get user profile
      const profile = await this.getUserProfile(longTokenData.access_token);

      // Calculate expiration date (60 days)
      const expiresAt = new Date(Date.now() + (longTokenData.expires_in * 1000));

      return {
        accessToken: longTokenData.access_token,
        tokenType: longTokenData.token_type,
        expiresIn: longTokenData.expires_in,
        expiresAt,
        userId: profile.id,
        username: profile.username,
        accountType: profile.account_type,
      };
    } catch (error) {
      console.error('Instagram OAuth flow error:', error.message);
      throw error;
    }
  }
}

module.exports = new InstagramService();
