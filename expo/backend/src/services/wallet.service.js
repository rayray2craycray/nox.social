/**
 * Apple Wallet Pass Service
 *
 * Generates signed .pkpass files for paid tickets. Follows the same
 * placeholder pattern as Stripe: the server boots and the endpoint exists
 * without certificates configured — it just answers 503 until the env vars
 * are set. When the user creates the Pass Type ID + signing cert in Apple
 * Developer Console, delivery is a config change, not a deploy.
 *
 * Required env vars (all certs base64-encoded PEM):
 *   APPLE_WALLET_PASS_TYPE_ID     e.g. "pass.social.nox.ticket"
 *   APPLE_TEAM_ID                 e.g. "UEJL484624"
 *   APPLE_WALLET_CERT_BASE64      pass type signing certificate
 *   APPLE_WALLET_KEY_BASE64       private key for the signing certificate
 *   APPLE_WALLET_KEY_PASSPHRASE   (optional) key passphrase
 *   APPLE_WALLET_WWDR_BASE64      Apple WWDR G4 intermediate certificate
 *
 * How to get the certs (user-side, one time):
 *   1. Apple Developer Console → Identifiers → Pass Type IDs → create one
 *   2. Create a certificate for it (upload CSR from Keychain Access)
 *   3. Export cert + key as PEM, download WWDR G4 from Apple's cert page
 *   4. base64-encode each: `base64 -i cert.pem | pbcopy`
 *   5. heroku config:set APPLE_WALLET_CERT_BASE64=... etc.
 */

const { PKPass } = require('passkit-generator');

// Minimal valid 1x1 black PNG for required icon assets. Replace with real
// branding (icon.png 29x29pt @1x/@2x/@3x) before launch — passes render,
// just with a blank icon.
const PLACEHOLDER_ICON = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQAB' +
    'h6FO1AAAAABJRU5ErkJggg==',
  'base64'
);

function getSigningConfig() {
  const {
    APPLE_WALLET_PASS_TYPE_ID,
    APPLE_TEAM_ID,
    APPLE_WALLET_CERT_BASE64,
    APPLE_WALLET_KEY_BASE64,
    APPLE_WALLET_KEY_PASSPHRASE,
    APPLE_WALLET_WWDR_BASE64,
  } = process.env;

  if (
    !APPLE_WALLET_PASS_TYPE_ID ||
    !APPLE_TEAM_ID ||
    !APPLE_WALLET_CERT_BASE64 ||
    !APPLE_WALLET_KEY_BASE64 ||
    !APPLE_WALLET_WWDR_BASE64
  ) {
    return null;
  }

  return {
    passTypeIdentifier: APPLE_WALLET_PASS_TYPE_ID,
    teamIdentifier: APPLE_TEAM_ID,
    certificates: {
      signerCert: Buffer.from(APPLE_WALLET_CERT_BASE64, 'base64'),
      signerKey: Buffer.from(APPLE_WALLET_KEY_BASE64, 'base64'),
      signerKeyPassphrase: APPLE_WALLET_KEY_PASSPHRASE || undefined,
      wwdr: Buffer.from(APPLE_WALLET_WWDR_BASE64, 'base64'),
    },
  };
}

/**
 * Whether pass signing is configured (all env vars present).
 */
function isConfigured() {
  return getSigningConfig() !== null;
}

/**
 * Build a signed .pkpass buffer for a ticket.
 *
 * @param {object} params
 * @param {string} params.serialNumber   unique per pass — ticket._id
 * @param {string} params.eventTitle     headline on the pass
 * @param {string} params.venueName      secondary field
 * @param {Date}   params.eventDate      relevant date (surfaces pass on lock screen)
 * @param {string} params.tierName       ticket tier label
 * @param {string} params.attendeeName   ticket holder display name
 * @param {string} params.qrCode         barcode payload — venue scanners read this
 * @returns {Promise<Buffer>} signed .pkpass bytes
 */
async function generateTicketPass(params) {
  const config = getSigningConfig();
  if (!config) {
    const err = new Error('Apple Wallet pass signing is not configured');
    err.code = 'PASS_SIGNING_NOT_CONFIGURED';
    throw err;
  }

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: config.passTypeIdentifier,
    teamIdentifier: config.teamIdentifier,
    serialNumber: params.serialNumber,
    organizationName: 'Nox Nightlife',
    description: `Ticket: ${params.eventTitle}`,
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(10, 10, 15)',
    labelColor: 'rgb(255, 0, 128)',
    relevantDate: params.eventDate ? new Date(params.eventDate).toISOString() : undefined,
    barcodes: [
      {
        message: params.qrCode,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
      },
    ],
    eventTicket: {
      primaryFields: [
        { key: 'event', label: 'EVENT', value: params.eventTitle },
      ],
      secondaryFields: [
        { key: 'venue', label: 'VENUE', value: params.venueName || 'TBA' },
        { key: 'tier', label: 'TIER', value: params.tierName || 'General' },
      ],
      auxiliaryFields: [
        {
          key: 'date',
          label: 'DATE',
          value: params.eventDate
            ? new Date(params.eventDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'TBA',
        },
        { key: 'name', label: 'ATTENDEE', value: params.attendeeName || '' },
      ],
    },
  };

  const pass = new PKPass(
    {
      'pass.json': Buffer.from(JSON.stringify(passJson)),
      'icon.png': PLACEHOLDER_ICON,
      'icon@2x.png': PLACEHOLDER_ICON,
    },
    config.certificates
  );

  return pass.getAsBuffer();
}

module.exports = {
  isConfigured,
  generateTicketPass,
};
