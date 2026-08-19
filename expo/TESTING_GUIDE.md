# Nox — Tester's Guide

Thanks for helping test **Nox**. This guide walks you through every part of the app, what *should* happen at each step, and how to report anything that doesn't. You don't need to do all of it — even the 5-minute smoke test is a huge help.

**Current build:** TestFlight Build 105+ · iOS
**What Nox is:** your night out, optimized. Discover nightlife venues, check in to climb loyalty tiers, plan your night, and see the live vibe before you go.

---

## 1. Getting set up

1. **Install:** open the invite email / TestFlight link on your iPhone → install Nox.
2. **Create your own account** (email + password). Use a real email — you'll need it to test password reset.
3. **Allow Location "While Using"** when asked. Nox needs it for the map and for check-ins. You can decline to test the denied state, but most features need it on.
4. **Allow Notifications** if prompted.

> **Tip:** test on the newest and an older iPhone if you have access to both — we want to catch layout issues on small screens (SE/mini) and large (Pro Max).

---

## 2. How to report a bug (please read)

Send reports to **support@nox.social** (or wherever the founder directed you). A good report is worth 10 vague ones. Use this template:

```
What I did:        (steps, numbered)
What I expected:   
What happened:     
Screenshot/video:  (attach — huge help)
Device + iOS:      e.g. iPhone 14, iOS 18.2
Build number:      (Settings screen or TestFlight)
How often:         every time / sometimes / once
```

**Crashes are top priority.** If the app closes itself, note exactly what you tapped right before.

---

## 3. The 5-minute smoke test (do this first)

If you only have a few minutes, run this golden path and report anything broken:

1. Sign up → land on the app's main screen. ✅ *No crash, no blank/black screen.*
2. Open **Discovery** (the map) → venues appear near you. ✅ *Pins/list load within a few seconds.*
3. Tap a venue → its detail sheet opens with a vibe read. ✅ *Info shows, nothing overlaps.*
4. Open an **event** → tap **Get Tickets** → your browser opens the ticket site. ✅ *Leaves the app cleanly and returns.*
5. **Save** an event (bookmark icon) → open **My Night** (Profile → My Night) → the saved event is there. ✅ *It appears; unsaving removes it.*
6. Force-close and reopen the app → you're still logged in, data still there. ✅

If all six pass, the core loop works. Everything below is the deep dive.

---

## 4. Deep-dive test areas

For each: **do the steps**, check the **Expected**, and note anything in **Watch for**.

### 4.1 Onboarding & accounts
- **Sign up** with a new email/password.
  - *Expected:* account creates, you're logged in, no error.
  - *Watch for:* weak-password or invalid-email errors that are unclear; getting stuck on a spinner.
- **Log out** (Settings) then **log back in**.
  - *Expected:* credentials work; wrong password shows a clear error.
- **Forgot password:** on the sign-in screen tap "Forgot password" → enter your email.
  - *Expected:* you receive a **"Reset your Nox password"** email within a minute (check Spam/Promotions). The button opens the app to a reset screen.
  - *Watch for:* no email arriving; the reset link not opening the app.
- **Delete account** (Settings → Delete Account).
  - *Expected:* clear confirmation, account is removed, you're logged out. (Use a throwaway account for this.)

### 4.2 Discovery / map / venues
- Browse the **map** and the **list view** toggle.
  - *Expected:* venues load near your location; switching views is smooth.
  - *Watch for:* "Getting your location" hanging forever; empty map with location granted; pins in the wrong place.
- Open a **venue** → check its details and the **vibe** (music / energy / crowd / wait).
  - *Watch for:* text overflow, missing images, "$undefined" or blank fields.
- Submit a **vibe check** (rate music/energy/crowd/wait).
  - *Expected:* your vote submits and the venue's vibe updates.
  - *Watch for:* being able to spam-vote with no cooldown.

### 4.3 Check-in & loyalty tiers ⭐ (core feature)
Check-ins are **location-verified** — you must be physically near a venue (~150 m).
- **When NOT near a venue:** tap **Check In** on a venue.
  - *Expected:* a friendly "get closer to check in" message. *(This is correct behavior, not a bug.)*
- **When you ARE at a bar/club:** open that venue → **Check In**.
  - *Expected:* success, your visit count goes up, and your **tier** shows (GUEST → REGULAR → PLATINUM → WHALE as visits grow). A tier-up should feel celebratory.
  - *Watch for:* being allowed to check in twice the same night (you shouldn't — it's once per night); wrong distance behavior; the tier row not updating.
- **Realistic testing:** if you're out this weekend, check in for real at a couple spots and watch the tier/visit count climb. That's the most valuable test we can get.

### 4.4 My Night (saved events)
- **Save** several events (bookmark on an event) and open **My Night** (Profile → My Night).
  - *Expected:* saved events appear under **Saved** (upcoming first); an **"At your venues"** section shows events at places you've checked into; **unsave** removes them instantly.
  - *Watch for:* saved events not persisting after reopening the app; duplicates; wrong dates.

### 4.5 Events & Get Tickets
- Open an **event detail**.
  - *Expected:* image, title, venue, date/time, and a **Get Tickets** button.
- Tap **Get Tickets**.
  - *Expected:* opens the venue's ticket site in your browser. *(Nox does not sell tickets in-app — this redirect is intended.)*
  - *Watch for:* a dead link, or the button doing nothing.

### 4.6 Social — friends, servers & chat
- Find/add **friends**; see who's out.
- Join a venue's **server/community** and send a **chat** message.
  - *Expected:* messages send and appear in real time; you can scroll history.
  - *Watch for:* duplicate messages, messages not sending, the chat repeating itself.
- **Report** a message and **block** a user (moderation).
  - *Expected:* both work and the blocked user's content disappears.

### 4.7 Profile & settings
- Edit your **display name / bio / photo**.
- Toggle **incognito** and any other settings.
  - *Watch for:* changes not saving; profile photo upload failing.

---

## 5. Try to break it (edge cases)
- Turn **Airplane Mode** on mid-use → does the app show a sane "offline" state and recover when back online?
- **Background** the app for a while, then return → still logged in, no crash?
- **Deny** location, then grant it later in iOS Settings → does the map recover?
- Rapidly tap buttons (check in, save, get tickets) → any double-actions or crashes?
- Very **long** display name / bio, emojis, other languages → layout holds?
- **Rotate** the phone / large text accessibility setting → anything unreadable?

---

## 6. Known limitations (NOT bugs — no need to report)
- **No in-app ticket purchases.** "Get Tickets" intentionally sends you to the venue's own seller.
- **Check-in requires being at the venue.** Away from a venue you'll always get "get closer."
- **Some venues have sparse data** (no image/hours) — they're pulled live from maps and fill in over time.
- **"The Neon Room"** and its events are a **demo venue** for testing the flow — it's not a real place.
- A **demo/pre-filled account** exists if you want to see a populated state without building it up yourself — ask the founder for the login.

---

## 7. What we most want to know
1. Did anything **crash** or show a **blank/black screen**?
2. Did the **core loop** (discover → check in → save → plan) feel smooth?
3. Was anything **confusing** — where did you hesitate or tap the wrong thing?
4. On your specific **device**, did anything look broken or cut off?
5. Would you actually **use this** on a night out? Why / why not?

Thank you — every note makes the launch better. 🖤
