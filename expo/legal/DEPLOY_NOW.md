# Deploy Legal Documents - Run These Commands

**Time Required:** 5-10 minutes
**Cost:** Free (Vercel free tier)

---

## Step 1: Login to Vercel (First Time Only)

Open your terminal and run:

```bash
cd /Users/rayan/rork-nightlife-app/legal
vercel login
```

**What happens:**
- Vercel will ask for your email
- Enter your email address
- Check your email for verification link
- Click the verification link
- Return to terminal

---

## Step 2: Deploy to Vercel

```bash
vercel --prod
```

**Follow the prompts:**

1. **"Set up and deploy?"** → Press **Y** (Yes)

2. **"Which scope?"** → Select your account (use arrow keys, press Enter)

3. **"Link to existing project?"** → Press **N** (No, create new)

4. **"What's your project's name?"** → Type: **nox-legal** → Press Enter

5. **"In which directory is your code located?"** → Press Enter (use current directory: ./)

6. **"Want to override the settings?"** → Press **N** (No)

7. Vercel will upload and deploy!

**Deployment will complete in ~30 seconds**

---

## Step 3: Note Your URLs

After deployment, Vercel will show:

```
✅ Production: https://nox-legal.vercel.app
```

**Your legal docs are now live at:**
- Homepage: https://nox-legal.vercel.app
- Privacy: https://nox-legal.vercel.app/privacy.html
- Terms: https://nox-legal.vercel.app/terms.html

**Also works without .html:**
- Privacy: https://nox-legal.vercel.app/privacy
- Terms: https://nox-legal.vercel.app/terms

---

## Step 4: Add Custom Domain (nox.social)

### In Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Click on **nox-legal** project
3. Click **Settings** tab
4. Click **Domains** in left sidebar
5. Click **Add Domain**
6. Enter: **nox.social**
7. Click **Add**

### Vercel will show DNS records:

You need to add these to your domain registrar (where you bought nox.social):

**For root domain (nox.social):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**For www subdomain (optional):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com.
TTL: 3600
```

### In Your Domain Registrar:

**Where did you buy nox.social?**
- Namecheap
- GoDaddy
- Cloudflare
- Google Domains
- Other

**Steps (example for Namecheap):**

1. Log into your domain registrar account
2. Find DNS settings for nox.social
3. Add the A record shown by Vercel:
   - Type: A
   - Host: @ (or leave blank for root)
   - Value: 76.76.21.21
   - TTL: Automatic or 3600

4. Add CNAME record for www:
   - Type: CNAME
   - Host: www
   - Value: cname.vercel-dns.com
   - TTL: Automatic or 3600

5. Save changes

### Wait for DNS Propagation:

- Typically takes: 5-60 minutes
- Can take up to: 24-48 hours (rare)

**Check status:**
```bash
# Check if DNS has propagated
dig nox.social

# Should show:
# nox.social.  3600  IN  A  76.76.21.21
```

**Check online:**
- Go to: https://www.whatsmydns.net/#A/nox.social
- See if it's propagated globally

---

## Step 5: Verify SSL Certificate (Automatic)

Once DNS propagates, Vercel automatically provisions SSL:

**Check HTTPS is working:**

1. Open browser
2. Go to: https://nox.social
3. Should see your landing page with lock icon 🔒
4. Check: https://nox.social/privacy
5. Check: https://nox.social/terms

**All should work with HTTPS!**

---

## Step 6: Test on Mobile

**Open on your phone:**
- https://nox.social
- https://nox.social/privacy
- https://nox.social/terms

**Verify:**
- [ ] Pages load correctly
- [ ] Text is readable (no zooming needed)
- [ ] Links work
- [ ] Design looks good
- [ ] HTTPS lock icon shows

---

## Step 7: Update App Store URLs

### In App Store Connect (Apple):

1. Go to: https://appstoreconnect.apple.com
2. My Apps → Nox → App Information
3. Privacy Policy URL: **https://nox.social/privacy**
4. Save

### In Google Play Console:

1. Go to: https://play.google.com/console
2. All Applications → Nox → Store Listing
3. Privacy Policy: **https://nox.social/privacy**
4. Save

### In Your App Code:

Update these files if they reference old URLs:

**app.json:**
```json
{
  "expo": {
    "privacy": "public",
    "privacyPolicy": "https://nox.social/privacy"
  }
}
```

---

## Quick Commands Summary

```bash
# 1. Navigate to legal folder
cd /Users/rayan/rork-nightlife-app/legal

# 2. Login to Vercel (first time only)
vercel login

# 3. Deploy to production
vercel --prod

# 4. Add custom domain in dashboard
# (Go to vercel.com → nox-legal → Settings → Domains)

# 5. Update DNS records in your domain registrar
# (Add A record: @ → 76.76.21.21)

# 6. Wait for DNS propagation (5-60 minutes)

# 7. Test URLs
# https://nox.social
# https://nox.social/privacy
# https://nox.social/terms
```

---

## Troubleshooting

### Issue: "vercel: command not found"

**Solution:**
```bash
npm install -g vercel
```

### Issue: DNS not propagating

**Check status:**
```bash
dig nox.social
```

**If empty or wrong:**
- Double-check DNS records in registrar
- Wait longer (can take up to 48 hours)
- Clear local DNS cache:
  ```bash
  # macOS
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
  ```

### Issue: SSL certificate not working

**Solution:**
- Ensure DNS has fully propagated
- Wait 5-10 minutes after DNS propagates
- Vercel auto-provisions SSL (no action needed)
- Try accessing https://nox-legal.vercel.app first

### Issue: "This domain is not registered with Vercel"

**Solution:**
- Complete DNS setup in your domain registrar first
- Then add domain in Vercel dashboard
- Wait for Vercel to verify DNS records

---

## What You Just Deployed

✅ **Landing Page:** Beautiful gradient homepage at nox.social
✅ **Privacy Policy:** Styled, responsive, mobile-friendly
✅ **Terms of Service:** Styled, responsive, mobile-friendly
✅ **URL Redirects:** Both /privacy and /privacy.html work
✅ **SSL Certificate:** Automatic HTTPS
✅ **Security Headers:** X-Frame-Options, CSP, etc.
✅ **Global CDN:** Fast loading worldwide

---

## Next Steps After Deployment

1. ✅ Legal docs are live!
2. ⏳ Start Apple D-U-N-S request (takes 1-2 weeks)
3. ⏳ Create Google Play account ($25)
4. ⏳ Hire designer for app icon
5. ⏳ Capture screenshots

**You just completed Step 1 of launch prep! 🎉**

---

## Need Help?

**Vercel Support:**
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support
- Twitter: @vercel

**Domain Registrar Support:**
- Contact your registrar's support team
- Most have live chat available

**Quick Questions:**
- Vercel Discord: https://vercel.com/discord
- Usually get answers in minutes

---

**Ready? Open your terminal and run the commands above!**

Time to complete: ~10 minutes (+ DNS wait time)
