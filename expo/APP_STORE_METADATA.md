# Nox — App Store Connect Metadata (v1.0)

Copy-paste ready. Character limits noted per field; App Store Connect enforces them.
Bundle `social.nox` · version `1.0.0` · `ITSAppUsesNonExemptEncryption: false` (no export-compliance prompt).

---

## 1. App Name  (max 30)
**Nox: Nightlife & Venues**  ·  24 chars

Alternates:
- `Nox — Your Night Out` (20)
- `Nox Nightlife` (13)

## 2. Subtitle  (max 30)
**Your night out, optimized**  ·  25 chars

Alternates: `Discover venues & get rewarded` (30) · `Nightlife, venues & rewards` (27)

## 3. Promotional Text  (max 170, editable anytime without review)
> Find where the night's actually happening, check in to climb loyalty tiers at your favorite spots, and get rewarded for going out. Your city after dark, in one app.

156 chars.

## 4. Keywords  (max 100, comma-separated, no spaces = more room)
```
nightlife,club,bar,venue,night out,events,tickets,party,rewards,loyalty,check in,vibe,lounge,dj,rave
```
99 chars. (Don't repeat the app name or subtitle words — Apple already indexes those.)

## 5. Description  (max 4000)
```
Nox is your night out, optimized. Discover where the energy actually is tonight, plan your evening, and get rewarded every time you go out.

DISCOVER THE NIGHT
See what's happening at bars, clubs, and lounges near you — live. Check the vibe before you go, browse upcoming events, and find the spots your friends are heading to.

CHECK IN & CLIMB
Every time you show up at a venue, you check in and earn your place. Go from Guest to Regular to Platinum to Whale at your favorite spots. The more you show up, the higher your tier — and tiers are how the best nights get better.

PLAN YOUR NIGHT
Save the events you're into and keep them all in one place with My Night. See upcoming nights at the venues you already love, and jump straight to tickets from the venue's own seller when you're ready to go.

READ THE ROOM
Vote on the vibe — music, energy, crowd, wait time — and see real-time reads from everyone else out tonight. No more guessing which line is worth it.

YOUR PEOPLE
See which friends are out, message the crew, and make a plan. Nightlife is better together.

FOR VENUES
Run a bar, club, or lounge? Nox gives you real-time analytics on who's walking through your door, when your crowd peaks, and how many ticket clicks we send your way — proof of the nights we help fill.

Nox is nightlife, done right. Download and own your night.

—
Questions or feedback? support@nox.social
Privacy: https://nox.social/privacy
Terms: https://nox.social/terms
```
~1,430 chars.

## 6. What's New (release notes, v1.0)  (max 4000)
```
Welcome to Nox. This is our first release:
• Discover nightlife venues and events near you
• Check in at venues to climb loyalty tiers
• Save events and plan your night with My Night
• Vote and see the live vibe at every spot
• See which friends are out and message your crew

Found a bug or have an idea? Reach us at support@nox.social — we're just getting started.
```

## 7. URLs
| Field | Value | Status |
|---|---|---|
| Support URL | `https://nox.social/support` (or a mailto page) | ⚠️ must resolve — see note |
| Marketing URL (optional) | `https://nox.social` | optional |
| Privacy Policy URL | `https://nox.social/privacy` | ⚠️ **required** — host `legal/` first |

**Note:** the privacy policy + terms already exist in `expo/legal/` with a `vercel.json`. Deploy that folder (Vercel) so `/privacy` and `/terms` resolve **before** submitting — Apple rejects a dead privacy URL. Support URL can be a simple page or a mailto → but Apple prefers a real page.

## 8. Category
- **Primary:** Social Networking
- **Secondary:** Lifestyle

(Entertainment is a fine alternate secondary. Social Networking primary matches the check-in/friends/chat core.)

## 9. Age Rating  (questionnaire answers → expected 17+)
- Alcohol, Tobacco, or Drug Use or References: **Frequent/Intense** (it's a nightlife app centered on bars/clubs)
- Sexual Content or Nudity: None
- Profanity or Crude Humor: Infrequent/Mild (user chat)
- Mature/Suggestive Themes: Infrequent/Mild
- Horror, Violence, Gambling, Contests: None
- Unrestricted Web Access: No
- **User-Generated Content: Yes** → App must have (and does): content reporting, user blocking, and a way to contact you. See reviewer notes.

Expected result: **17+**. (Matches the in-app age gate that collects date of birth.)

## 10. App Privacy — "Nutrition Label"
Declare exactly these. **Data Used to Track You: NONE** (see the ATT flag in §12).

| Data type | Collected | Linked to identity | Tracking | Purpose |
|---|---|---|---|---|
| Email address | Yes | Yes | No | App Functionality (account) |
| Name (display name) | Yes | Yes | No | App Functionality |
| Other user contact (date of birth) | Yes | Yes | No | App Functionality (age gate) |
| Precise Location | Yes | Yes | No | App Functionality (venue discovery, check-in) |
| Photos or Videos | Yes | Yes | No | App Functionality (uploads, profile) |
| Other User Content (chat messages) | Yes | Yes | No | App Functionality |
| User ID | Yes | Yes | No | App Functionality |
| Contacts (optional friend-find) | Yes | Yes | No | App Functionality |
| Product Interaction (usage) | Yes | No | No | Analytics |
| Crash Data / Performance Data | Yes | No | No | Analytics (Sentry) |

**Not collected:** Financial/Payment info (tickets redirect to the venue's seller — Nox never handles payment), Purchases (no in-app purchases), Health, Browsing/Search history, Sensitive info, Advertising data.

✅ **Privacy-policy mismatch FIXED** (commit pending): the Stripe/payment sections in `legal/PRIVACY_POLICY.md` + `legal/privacy.html` now state Nox never handles payment (tickets redirect to the venue's seller). Label and policy agree.

## 11. Screenshots (shot list)
Required: **6.7"/6.9" iPhone** (1290×2796 or 1320×2868). 6.5" (1242×2688) optional; Apple down-scales. Provide 3–6, in this order (first 3 matter most):
1. **Discovery/map** — venues near you with live vibe
2. **Check-in + tier** — the "Check In" button and a tier row (GUEST · 3 visits → REGULAR)
3. **My Night** — saved events + "At your venues"
4. **Event detail** — with the "Get Tickets" button
5. **Vibe check** — the live music/energy/crowd read
6. **(optional) Venue analytics** — the dashboard, to signal the two-sided story

Tip: use the seeded demo venue "The Neon Room" events so screenshots look populated. Add a short caption band on each (e.g., "Find the vibe," "Show up, level up," "Plan your night").

## 12. App Review Information
- **Sign-in required:** Yes → provide the demo account below.
- **Demo account:** `appreview@nox.social` / `NoxReview2026!`  ← live & pre-populated (REGULAR tier · 7 visits at "The Neon Room", 1 saved event in My Night)
- **Contact:** your name, phone, `support@nox.social`
- **Notes to reviewer:**
```
Nox is a nightlife discovery + social app.

• Location is used to show nearby venues and to verify a user is physically at a
  venue when they "check in" (check-in drives loyalty tiers). It is requested
  in-context on first use, not at launch.
• Tickets are NOT sold in-app. "Get Tickets" opens the venue's own external
  seller in the browser — there are no in-app purchases in this version.
• User-generated content (chat, uploaded photos/videos) is moderated: users can
  report content and block other users in-app, and reach us at support@nox.social.
• The demo account above is pre-populated with a venue badge and saved events so
  you can see check-in tiers and My Night without needing to be at a venue.
```
- **Export compliance:** `ITSAppUsesNonExemptEncryption` is set to `false` in app config → no encryption docs needed; the "Missing Compliance" prompt should not appear.

✅ **ATT / tracking risk FIXED** (commit pending): `NSUserTrackingUsageDescription` removed from `app.config.js` (no code used ATT — it was purely dangling). Keep "Data Used to Track You: None." **Takes effect on the next build** — the ATT string is still baked into build 104; rebuild before submitting so the shipped binary has no ATT prompt.

## 13. Misc
- **Copyright:** `© 2026 Nox Social`
- **Version:** 1.0.0 (build 104 currently on TestFlight)
- **Primary language:** English (U.S.)
- **Pricing:** Free

---

### Pre-submit checklist
- [ ] Host `legal/` so `/privacy` + `/terms` resolve (Vercel via the included `vercel.json`)
- [x] ~~Update privacy policy to drop the Stripe/payment section~~ ✅ done (md + html)
- [x] ~~Remove the unused ATT usage string~~ ✅ done — **needs a rebuild to take effect** (build 104 still has it)
- [x] ~~Create + populate the reviewer demo account~~ ✅ done (`appreview@nox.social`)
- [ ] Capture the 3–6 screenshots on a 6.7"/6.9" device
- [ ] Fill App Privacy label per §10, age questionnaire per §9
- [ ] Cut a fresh build (105) after the ATT removal, then submit that one
