/**
 * POS Integration Controller
 * Handles Toast and Square POS integration endpoints
 */

const POSIntegration = require('../models/POSIntegration');
const POSTransaction = require('../models/POSTransaction');
const SpendRule = require('../models/SpendRule');
const { encrypt, decrypt } = require('../utils/encryption');
const logger = require('../utils/logger');
const axios = require('axios');

// POS API base URLs
const POS_APIS = {
  TOAST: {
    PRODUCTION: 'https://ws-api.toasttab.com',
    SANDBOX: 'https://ws-sandbox-api.eng.toasttab.com',
  },
  SQUARE: {
    PRODUCTION: 'https://connect.squareup.com',
    SANDBOX: 'https://connect.squareupsandbox.com',
  },
};

/**
 * Connect POS system with API key
 * POST /api/pos/connect
 */
exports.connectPOS = async (req, res) => {
  try {
    const { venueId, provider, credentials } = req.body;

    // Validate request
    if (!venueId || !provider || !credentials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: venueId, provider, credentials',
      });
    }

    if (!['TOAST', 'SQUARE'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be TOAST or SQUARE',
      });
    }

    // Check if integration already exists
    let integration = await POSIntegration.findOne({ venueId, provider });

    if (integration && integration.status === 'CONNECTED') {
      return res.status(409).json({
        success: false,
        error: 'POS integration already connected. Disconnect first.',
      });
    }

    // Validate credentials with POS provider
    const validationResult = await validatePOSCredentials(provider, credentials);

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: validationResult.error || 'Invalid credentials',
        details: validationResult.details,
      });
    }

    // Encrypt API key
    const encryptedApiKey = encrypt(credentials.apiKey);

    // Create or update integration
    if (!integration) {
      integration = new POSIntegration({
        venueId,
        provider,
      });
    }

    integration.status = 'CONNECTED';
    integration.credentials = {
      apiKey: encryptedApiKey,
      locationId: credentials.locationId,
      environment: credentials.environment || 'PRODUCTION',
    };
    integration.metadata = validationResult.metadata;
    integration.connectedAt = new Date();
    integration.lastValidatedAt = new Date();

    await integration.save();

    logger.info('POS integration connected', {
      venueId,
      provider,
      locationId: credentials.locationId,
    });

    res.status(200).json({
      success: true,
      data: integration.toPublicJSON(),
    });
  } catch (error) {
    logger.error('Connect POS error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to connect POS system',
      details: error.message,
    });
  }
};

/**
 * Get POS integration status
 * GET /api/pos/status/:venueId
 */
exports.getPOSStatus = async (req, res) => {
  try {
    const { venueId } = req.params;

    const integration = await POSIntegration.findOne({ venueId });

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'No POS integration found for this venue',
      });
    }

    // Get transaction count and revenue
    const stats = await POSTransaction.getVenueRevenue(venueId, 'all');

    res.status(200).json({
      success: true,
      data: {
        ...integration.toPublicJSON(),
        stats: {
          transactionCount: stats.totalTransactions,
          totalRevenue: stats.totalRevenue / 100, // Convert to dollars
          averageTransaction: stats.averageTransaction / 100,
        },
      },
    });
  } catch (error) {
    logger.error('Get POS status error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get POS status',
    });
  }
};

/**
 * Disconnect POS system
 * POST /api/pos/disconnect/:venueId
 */
exports.disconnectPOS = async (req, res) => {
  try {
    const { venueId } = req.params;

    const integration = await POSIntegration.findOne({ venueId });

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'No POS integration found',
      });
    }

    integration.status = 'DISCONNECTED';
    integration.disconnectedAt = new Date();
    await integration.save();

    logger.info('POS integration disconnected', { venueId, provider: integration.provider });

    res.status(200).json({
      success: true,
      message: 'POS integration disconnected successfully',
    });
  } catch (error) {
    logger.error('Disconnect POS error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect POS system',
    });
  }
};

/**
 * Validate POS credentials
 * POST /api/pos/validate
 */
exports.validateCredentials = async (req, res) => {
  try {
    const { provider, credentials } = req.body;

    if (!provider || !credentials) {
      return res.status(400).json({
        success: false,
        error: 'Missing provider or credentials',
      });
    }

    const result = await validatePOSCredentials(provider, credentials);

    if (result.valid) {
      res.status(200).json({
        success: true,
        message: 'Credentials are valid',
        metadata: result.metadata,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        details: result.details,
      });
    }
  } catch (error) {
    logger.error('Validate credentials error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to validate credentials',
    });
  }
};

/**
 * Sync transactions from POS
 * POST /api/pos/sync/:venueId
 */
exports.syncTransactions = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { fromDate, toDate, processRules = true } = req.body;

    const integration = await POSIntegration.findOne({ venueId }).select('+credentials.apiKey');

    if (!integration || integration.status !== 'CONNECTED') {
      return res.status(400).json({
        success: false,
        error: 'POS integration not connected',
      });
    }

    const startTime = Date.now();

    // Decrypt API key
    const apiKey = decrypt(integration.credentials.apiKey);

    // Sync based on provider
    let syncResult;
    if (integration.provider === 'TOAST') {
      syncResult = await syncToastTransactions(integration, apiKey, fromDate, toDate, processRules);
    } else if (integration.provider === 'SQUARE') {
      syncResult = await syncSquareTransactions(integration, apiKey, fromDate, toDate, processRules);
    }

    // Update last sync time
    integration.syncConfig.lastSyncAt = new Date();
    integration.syncConfig.lastSyncStatus = 'SUCCESS';
    await integration.save();

    const syncDuration = (Date.now() - startTime) / 1000;

    logger.info('POS transactions synced', {
      venueId,
      provider: integration.provider,
      transactionsSynced: syncResult.transactionsSynced,
      duration: syncDuration,
    });

    res.status(200).json({
      success: true,
      data: {
        ...syncResult,
        syncDuration,
      },
    });
  } catch (error) {
    logger.error('Sync transactions error', { error: error.message });

    // Update sync status
    const integration = await POSIntegration.findOne({ venueId: req.params.venueId });
    if (integration) {
      integration.syncConfig.lastSyncStatus = 'FAILED';
      integration.syncConfig.syncErrors = [error.message];
      await integration.save();
    }

    res.status(500).json({
      success: false,
      error: 'Failed to sync transactions',
      details: error.message,
    });
  }
};

/**
 * Get transactions for venue
 * GET /api/pos/transactions/:venueId
 */
exports.getTransactions = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { limit = 50, offset = 0, status, startDate, endDate } = req.query;

    const filter = { venueId };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const transactions = await POSTransaction.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('userId', 'displayName email');

    const total = await POSTransaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get transactions error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
    });
  }
};

/**
 * Get venue revenue
 * GET /api/pos/revenue/:venueId
 */
exports.getRevenue = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { period = 'all' } = req.query;

    const stats = await POSTransaction.getVenueRevenue(venueId, period);

    res.status(200).json({
      success: true,
      data: {
        period,
        totalRevenue: stats.totalRevenue / 100, // Convert to dollars
        totalTransactions: stats.totalTransactions,
        averageTransaction: stats.averageTransaction / 100,
      },
    });
  } catch (error) {
    logger.error('Get revenue error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue',
    });
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate credentials with POS provider
 */
async function validatePOSCredentials(provider, credentials) {
  try {
    if (provider === 'TOAST') {
      return await validateToastCredentials(credentials);
    } else if (provider === 'SQUARE') {
      return await validateSquareCredentials(credentials);
    }

    return {
      valid: false,
      error: 'Unsupported provider',
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      details: error.response?.data,
    };
  }
}

/**
 * Validate Toast credentials
 */
async function validateToastCredentials(credentials) {
  const { apiKey, locationId, environment = 'PRODUCTION' } = credentials;

  const baseUrl = POS_APIS.TOAST[environment];

  try {
    const response = await axios.get(`${baseUrl}/restaurants/v2/restaurants/${locationId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Toast-Restaurant-External-ID': locationId,
        'Content-Type': 'application/json',
      },
    });

    return {
      valid: true,
      metadata: {
        locationName: response.data.name || response.data.restaurantName,
        merchantName: response.data.managementGroupName,
        currency: 'USD',
        timezone: response.data.timeZone,
      },
    };
  } catch (error) {
    logger.error('Toast validation error', { error: error.message });

    return {
      valid: false,
      error: 'Invalid Toast API key or location ID',
      details: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Validate Square credentials
 */
async function validateSquareCredentials(credentials) {
  const { apiKey, locationId, environment = 'PRODUCTION' } = credentials;

  const baseUrl = POS_APIS.SQUARE[environment];

  try {
    const response = await axios.get(`${baseUrl}/v2/locations/${locationId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Square-Version': '2024-12-18',
        'Content-Type': 'application/json',
      },
    });

    return {
      valid: true,
      metadata: {
        locationName: response.data.location.name,
        merchantName: response.data.location.merchant_name || response.data.location.name,
        currency: response.data.location.currency || 'USD',
        timezone: response.data.location.timezone,
      },
    };
  } catch (error) {
    logger.error('Square validation error', { error: error.message });

    return {
      valid: false,
      error: 'Invalid Square access token or location ID',
      details: error.response?.data?.errors?.[0]?.detail || error.message,
    };
  }
}

/**
 * Sync Toast transactions
 */
async function syncToastTransactions(integration, apiKey, fromDate, toDate, processRules) {
  const baseUrl = POS_APIS.TOAST[integration.credentials.environment];
  const locationId = integration.credentials.locationId;

  // Default date range: last 7 days
  const startDate = fromDate ? new Date(fromDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = toDate ? new Date(toDate) : new Date();

  try {
    // Fetch checks (orders with payments)
    const response = await axios.get(`${baseUrl}/orders/v2/orders`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Toast-Restaurant-External-ID': locationId,
        'Content-Type': 'application/json',
      },
      params: {
        businessDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    });

    const orders = response.data || [];
    let transactionsSynced = 0;
    let newTransactions = 0;
    let duplicatesSkipped = 0;

    for (const order of orders) {
      // Skip if no payments
      if (!order.checks || order.checks.length === 0) continue;

      for (const check of order.checks) {
        if (!check.payments || check.payments.length === 0) continue;

        for (const payment of check.payments) {
          // Check if transaction already exists
          const existing = await POSTransaction.findOne({
            provider: 'TOAST',
            'externalIds.transactionId': payment.guid,
          });

          if (existing) {
            duplicatesSkipped++;
            continue;
          }

          // Create transaction
          const transaction = new POSTransaction({
            posIntegrationId: integration._id,
            venueId: integration.venueId,
            provider: 'TOAST',
            externalIds: {
              transactionId: payment.guid,
              orderId: order.guid,
              customerId: check.customer?.guid,
            },
            amount: {
              total: Math.round(payment.amount * 100), // Convert to cents
              subtotal: Math.round((check.amount - check.tax - check.tip) * 100),
              tax: Math.round(check.tax * 100),
              tip: Math.round(check.tip * 100),
            },
            currency: 'USD',
            paymentMethod: {
              type: payment.type,
              cardBrand: payment.cardType,
              lastFour: payment.last4,
              cardToken: payment.cardEntryMode,
            },
            status: payment.refundStatus === 'NONE' ? 'COMPLETED' : 'REFUNDED',
            timestamp: new Date(check.closedDate || order.createdDate),
            items: order.selections?.map((item) => ({
              name: item.itemId,
              quantity: item.quantity,
              price: Math.round(item.preDiscountPrice * 100),
            })),
            rawData: { order, check, payment },
          });

          await transaction.save();
          newTransactions++;
          transactionsSynced++;

          // Process spend rules if enabled
          if (processRules) {
            await processSpendRules(transaction);
          }
        }
      }
    }

    return {
      transactionsSynced,
      newTransactions,
      duplicatesSkipped,
      rulesProcessed: processRules ? transactionsSynced : 0,
    };
  } catch (error) {
    logger.error('Toast sync error', { error: error.message });
    throw error;
  }
}

/**
 * Sync Square transactions
 */
async function syncSquareTransactions(integration, apiKey, fromDate, toDate, processRules) {
  const baseUrl = POS_APIS.SQUARE[integration.credentials.environment];
  const locationId = integration.credentials.locationId;

  // Default date range: last 7 days
  const startDate = fromDate ? new Date(fromDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = toDate ? new Date(toDate) : new Date();

  try {
    // Fetch payments
    const response = await axios.post(
      `${baseUrl}/v2/payments`,
      {
        begin_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        location_id: locationId,
        limit: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Square-Version': '2024-12-18',
          'Content-Type': 'application/json',
        },
      }
    );

    const payments = response.data.payments || [];
    let transactionsSynced = 0;
    let newTransactions = 0;
    let duplicatesSkipped = 0;

    for (const payment of payments) {
      // Check if transaction already exists
      const existing = await POSTransaction.findOne({
        provider: 'SQUARE',
        'externalIds.transactionId': payment.id,
      });

      if (existing) {
        duplicatesSkipped++;
        continue;
      }

      // Create transaction
      const transaction = new POSTransaction({
        posIntegrationId: integration._id,
        venueId: integration.venueId,
        provider: 'SQUARE',
        externalIds: {
          transactionId: payment.id,
          orderId: payment.order_id,
          customerId: payment.customer_id,
        },
        amount: {
          total: parseInt(payment.amount_money.amount), // Already in cents
          subtotal: parseInt(payment.amount_money.amount),
          tax: parseInt(payment.total_tax_money?.amount || 0),
          tip: parseInt(payment.tip_money?.amount || 0),
        },
        currency: payment.amount_money.currency || 'USD',
        paymentMethod: {
          type: payment.source_type,
          cardBrand: payment.card_details?.card?.card_brand,
          lastFour: payment.card_details?.card?.last_4,
          cardToken: payment.card_details?.card?.fingerprint,
        },
        status: payment.status === 'COMPLETED' ? 'COMPLETED' : payment.status,
        timestamp: new Date(payment.created_at),
        rawData: payment,
      });

      await transaction.save();
      newTransactions++;
      transactionsSynced++;

      // Process spend rules if enabled
      if (processRules) {
        await processSpendRules(transaction);
      }
    }

    return {
      transactionsSynced,
      newTransactions,
      duplicatesSkipped,
      rulesProcessed: processRules ? transactionsSynced : 0,
    };
  } catch (error) {
    logger.error('Square sync error', { error: error.message });
    throw error;
  }
}

/**
 * Process spend rules for transaction
 */
async function processSpendRules(transaction) {
  // TODO: Implement user matching logic
  // For now, skip if no userId
  if (!transaction.userId) {
    return;
  }

  // Get user's lifetime spend at venue
  const { totalSpend } = await POSTransaction.getUserLifetimeSpend(
    transaction.userId,
    transaction.venueId
  );

  // Find applicable spend rules
  const rules = await SpendRule.getActiveRulesForVenue(transaction.venueId);

  for (const rule of rules) {
    if (totalSpend >= rule.threshold && rule.shouldTriggerAtTime(transaction.timestamp)) {
      // TODO: Actually unlock tier for user
      // For now, just log the rule processing

      transaction.rulesProcessed.push({
        ruleId: rule._id,
        triggered: true,
        tierUnlocked: rule.tierUnlocked,
        accessGranted: rule.serverAccessLevel,
        processedAt: new Date(),
      });

      // Update rule stats
      rule.stats.timesTriggered += 1;
      rule.stats.lastTriggeredAt = new Date();
      rule.stats.usersUnlocked += 1;
      await rule.save();
    }
  }

  if (transaction.rulesProcessed.length > 0) {
    await transaction.save();
  }
}

/**
 * Square webhook handler
 * POST /api/pos/webhooks/square
 */
exports.squareWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-square-signature'];
    const body = JSON.stringify(req.body);

    // Get integration to verify webhook
    const integration = await POSIntegration.findOne({
      provider: 'SQUARE',
      'webhooks.enabled': true,
    }).select('+webhooks.secret');

    if (!integration || !integration.webhooks.secret) {
      logger.warn('Square webhook received but no integration found or secret missing');
      return res.status(404).json({ error: 'No webhook configuration found' });
    }

    // Verify webhook signature
    const crypto = require('crypto');
    const webhookSecret = decrypt(integration.webhooks.secret);
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(req.originalUrl + body);
    const expectedSignature = hmac.digest('base64');

    if (signature !== expectedSignature) {
      logger.warn('Square webhook signature verification failed', { integration: integration._id });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // Process webhook event
    if (event.type === 'payment.created' || event.type === 'payment.updated') {
      const payment = event.data.object.payment;

      // Check if transaction already exists
      const existing = await POSTransaction.findOne({
        provider: 'SQUARE',
        'externalIds.transactionId': payment.id,
      });

      if (existing) {
        logger.info('Square webhook: transaction already exists', { paymentId: payment.id });
        return res.status(200).json({ received: true, status: 'duplicate' });
      }

      // Create transaction
      const transaction = new POSTransaction({
        posIntegrationId: integration._id,
        venueId: integration.venueId,
        provider: 'SQUARE',
        externalIds: {
          transactionId: payment.id,
          orderId: payment.order_id,
          customerId: payment.customer_id,
        },
        amount: {
          total: parseInt(payment.amount_money.amount),
          subtotal: parseInt(payment.amount_money.amount),
          tax: parseInt(payment.total_tax_money?.amount || 0),
          tip: parseInt(payment.tip_money?.amount || 0),
        },
        currency: payment.amount_money.currency || 'USD',
        paymentMethod: {
          type: payment.source_type,
          cardBrand: payment.card_details?.card?.card_brand,
          lastFour: payment.card_details?.card?.last_4,
          cardToken: payment.card_details?.card?.fingerprint,
        },
        status: payment.status === 'COMPLETED' ? 'COMPLETED' : payment.status,
        timestamp: new Date(payment.created_at),
        rawData: payment,
      });

      await transaction.save();

      // Process spend rules
      await processSpendRules(transaction);

      logger.info('Square webhook: transaction created', {
        paymentId: payment.id,
        amount: payment.amount_money.amount,
      });

      return res.status(200).json({ received: true, status: 'created' });
    }

    // Acknowledge other events
    res.status(200).json({ received: true, status: 'acknowledged' });
  } catch (error) {
    logger.error('Square webhook error', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
