/**
 * Chat Companion — a REAL second user for testing Nox chat in real time.
 *
 * Not mock data: this logs a genuine account into the production backend,
 * joins a venue's chat channel over the real Socket.io connection, and
 * auto-replies to your messages so you can test live send/receive from your
 * phone solo.
 *
 * Run:  cd expo && node scripts/chat-companion.js
 *
 * It will:
 *   1. Sign up (or log in) the companion account on the live backend.
 *   2. Give itself the shared test-venue badge (so it's a real channel member).
 *   3. Connect the socket, join the test venue's #general channel.
 *   4. Print every message it receives and auto-reply to yours in real time.
 *
 * On the phone side, log into the prepared test account (creds printed by the
 * companion-setup step), open the "Nox Test Lounge" server → general, and chat.
 */

const { io } = require('socket.io-client');

const API = process.env.NOX_API || 'https://rork-api-prod-3a4b8043e7dd.herokuapp.com';
const SHARED_VENUE_ID = 'nox-test-lounge';
const SHARED_VENUE_NAME = 'Nox Test Lounge';
const CHANNEL_ID = `${SHARED_VENUE_ID}-general`;

const BOT_EMAIL = process.env.BOT_EMAIL || 'nox-chat-bot@example.com';
const BOT_PASSWORD = process.env.BOT_PASSWORD || 'ChatBot!pass123';
const BOT_NAME = 'NoxBot';

async function post(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function loginOrSignup(email, password, displayName) {
  // Try sign in first
  let r = await post('/api/auth/signin', { email, password });
  if (r.status === 200 && r.json?.data?.accessToken) {
    return { token: r.json.data.accessToken, userId: r.json.data.user?.id };
  }
  // Fall back to signup
  r = await post('/api/auth/signup', { email, password, displayName });
  if ((r.status === 200 || r.status === 201) && r.json?.data?.accessToken) {
    return { token: r.json.data.accessToken, userId: r.json.data.user?.id };
  }
  throw new Error(`auth failed for ${email}: ${r.status} ${JSON.stringify(r.json)}`);
}

async function ensureBadge(token) {
  await post('/api/auth/me/badges', {
    venueId: SHARED_VENUE_ID,
    venueName: SHARED_VENUE_NAME,
    badgeType: 'PLATINUM',
  }, token);
}

async function main() {
  console.log(`\n=== Nox Chat Companion ===`);
  console.log(`Backend: ${API}`);
  console.log(`Channel: ${CHANNEL_ID}\n`);

  const { token, userId: myUserId } = await loginOrSignup(BOT_EMAIL, BOT_PASSWORD, BOT_NAME);
  console.log('✓ Companion logged in');
  await ensureBadge(token);
  console.log(`✓ Companion has the "${SHARED_VENUE_NAME}" badge`);

  const socket = io(API, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log('✓ Socket connected — joining channel...');
    socket.emit('join:channel', CHANNEL_ID);
  });

  socket.on('channel:joined', () => {
    console.log(`✓ Joined ${CHANNEL_ID}. Waiting for your messages...\n`);
    socket.emit('message:send', {
      channelId: CHANNEL_ID,
      content: `👋 NoxBot is here and listening. Say something and I'll reply live.`,
    });
  });

  socket.on('message:new', (msg) => {
    // Guard by userId — the backend sets userName from the email prefix, so a
    // name-based check misfires and causes an infinite self-reply loop.
    const mine = msg.userId === myUserId;
    const who = mine ? 'NoxBot (me)' : msg.userName;
    console.log(`[${new Date().toLocaleTimeString()}] ${who}: ${msg.content}`);

    if (!mine) {
      const reply = `Got it — you said "${msg.content}". Real-time delivery works ✅`;
      setTimeout(() => {
        socket.emit('message:send', { channelId: CHANNEL_ID, content: reply });
      }, 600);
    }
  });

  socket.on('connect_error', (err) => console.error('[socket] connect_error:', err.message));
  socket.on('error', (err) => console.error('[socket] error:', err));

  process.on('SIGINT', () => {
    console.log('\nShutting down companion.');
    socket.close();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
