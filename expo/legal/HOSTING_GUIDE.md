# Legal Documents Hosting Guide

**Priority:** 🔴 **CRITICAL** - Required for App Store/Google Play submission
**Timeline:** 1-2 hours
**Cost:** $0 (free hosting options available)

---

## Quick Start (5 Minutes)

The fastest way to host your legal documents:

### Option 1: Vercel (Recommended - Easiest)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to legal folder
cd /Users/rayan/rork-nightlife-app/legal

# 3. Deploy
vercel

# Follow prompts:
# - Set up and deploy: Y
# - Scope: your account
# - Link to existing project: N
# - Project name: nox-legal
# - Directory: ./
# - Override settings: N

# 4. Your URLs will be:
# https://nox-legal.vercel.app/privacy.html
# https://nox-legal.vercel.app/terms.html
```

**Custom Domain Setup:**
```bash
# Add your domain
vercel domains add nox.social

# Add DNS records in your domain registrar:
# Type: A     Name: @       Value: 76.76.21.21
# Type: CNAME Name: www     Value: cname.vercel-dns.com

# After DNS propagates (5-60 minutes):
# Access at:
# - https://nox.social/privacy.html
# - https://nox.social/terms.html
```

### Option 2: Netlify (Also Easy)

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Navigate to legal folder
cd /Users/rayan/rork-nightlife-app/legal

# 3. Deploy
netlify deploy --prod

# Follow prompts:
# - Create new site
# - Team: your team
# - Site name: nox-legal
# - Deploy path: ./

# 4. Your URLs will be:
# https://nox-legal.netlify.app/privacy.html
# https://nox-legal.netlify.app/terms.html
```

### Option 3: GitHub Pages (Free)

```bash
# 1. Create a new repo or use existing
# 2. Enable GitHub Pages in repo settings
# 3. Copy legal/*.html to repo
# 4. Push to main/gh-pages branch

# URLs will be:
# https://yourusername.github.io/repo-name/privacy.html
# https://yourusername.github.io/repo-name/terms.html
```

---

## Production Setup (Custom Domain)

### Step 1: Buy Domain (if not already owned)

**You mentioned you have nox.social** ✅

If you need to purchase:
- **Namecheap:** $8-15/year
- **Google Domains:** $12/year
- **Cloudflare:** $9-10/year

### Step 2: Create Simple Landing Page

Create `legal/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nox - Social Nightlife Discovery</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #ff0080 0%, #a855f7 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .container {
            max-width: 600px;
            padding: 40px;
        }
        h1 {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        p {
            font-size: 1.5rem;
            margin-bottom: 40px;
        }
        .links {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        a {
            background: white;
            color: #ff0080;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        a:hover {
            transform: scale(1.05);
        }
        .footer {
            margin-top: 60px;
            font-size: 0.9rem;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Nox</h1>
        <p>Social Nightlife Discovery</p>
        <p>Download the app and discover nightlife like never before.</p>

        <div class="links">
            <a href="https://apps.apple.com/app/nox" target="_blank">Download on iOS</a>
            <a href="https://play.google.com/store/apps/details?id=social.nox" target="_blank">Get it on Android</a>
        </div>

        <div class="footer">
            <a href="/privacy.html" style="background: transparent; color: white;">Privacy Policy</a> •
            <a href="/terms.html" style="background: transparent; color: white;">Terms of Service</a>
        </div>
    </div>
</body>
</html>
```

### Step 3: Deploy with Custom Domain

#### Using Vercel:

```bash
# 1. Deploy initially
cd /Users/rayan/rork-nightlife-app/legal
vercel --prod

# 2. Add domain
vercel domains add nox.social
vercel domains add www.nox.social

# 3. Configure DNS (in your domain registrar):
# Add these records:

# For root domain (nox.social):
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

# For www subdomain:
Type: CNAME
Name: www
Value: cname.vercel-dns.com.
TTL: 3600

# 4. Wait for DNS propagation (5-60 minutes)
# 5. Verify deployment:
# - https://nox.social
# - https://nox.social/privacy.html
# - https://nox.social/terms.html
```

#### Using Netlify:

```bash
# 1. Deploy
netlify deploy --prod

# 2. Add custom domain in Netlify dashboard:
# - Go to Domain settings
# - Add custom domain: nox.social
# - Netlify will provide DNS records

# 3. Add DNS records in your registrar:
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600

Type: CNAME
Name: www
Value: your-site-name.netlify.app
TTL: 3600
```

### Step 4: Enable HTTPS (SSL)

Both Vercel and Netlify automatically provision free SSL certificates via Let's Encrypt.

**Verification:**
```bash
# Check SSL is working
curl -I https://nox.social/privacy.html
# Should return: HTTP/2 200

# Check redirect from HTTP to HTTPS
curl -I http://nox.social
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://nox.social/
```

---

## URL Requirements for App Stores

### Apple App Store

**Privacy Policy URL:**
```
https://nox.social/privacy
```
or
```
https://nox.social/privacy.html
```

**Required:**
- Must be publicly accessible
- Must use HTTPS
- Must not require authentication
- Must be in English (or app's primary language)

**Where to add:**
- App Store Connect → My Apps → [Your App] → App Information → Privacy Policy URL

### Google Play Console

**Privacy Policy URL:**
```
https://nox.social/privacy
```

**Required:**
- Must be publicly accessible
- Must use HTTPS
- Must not require authentication

**Where to add:**
- Google Play Console → All Applications → [Your App] → Store Presence → Store Listing → Privacy Policy

---

## URL Redirects (Optional but Recommended)

To support both `/privacy` and `/privacy.html`:

### Vercel (vercel.json):

```json
{
  "redirects": [
    {
      "source": "/privacy",
      "destination": "/privacy.html",
      "permanent": false
    },
    {
      "source": "/terms",
      "destination": "/terms.html",
      "permanent": false
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Netlify (_redirects file):

```
/privacy   /privacy.html   200
/terms     /terms.html     200
```

---

## Testing Checklist

Before submitting to app stores:

- [ ] **Test on mobile browser:**
  ```
  Open https://nox.social/privacy on iPhone Safari
  Open https://nox.social/terms on iPhone Safari
  ```

- [ ] **Test on desktop browser:**
  ```
  Open https://nox.social/privacy in Chrome/Safari
  Open https://nox.social/terms in Chrome/Safari
  ```

- [ ] **Verify HTTPS:**
  ```bash
  curl -I https://nox.social/privacy.html | grep "200 OK"
  ```

- [ ] **Check DNS propagation:**
  ```bash
  dig nox.social
  # Should show A record pointing to host
  ```

- [ ] **Test from different locations:**
  - Use https://www.whatsmydns.net/#A/nox.social
  - Ensure DNS has propagated globally

- [ ] **Validate HTML:**
  - Use https://validator.w3.org/
  - Should have no critical errors

- [ ] **Check mobile responsiveness:**
  - Open on actual iPhone/Android device
  - Text should be readable without zooming
  - Layout should not be broken

- [ ] **Verify links work:**
  - All internal links (privacy ↔ terms)
  - All external links (service providers)
  - All email addresses (mailto: links)

---

## Quick Deploy Commands

### Initial Deployment:

```bash
# Using Vercel (recommended)
cd /Users/rayan/rork-nightlife-app/legal
vercel --prod

# Using Netlify
cd /Users/rayan/rork-nightlife-app/legal
netlify deploy --prod

# Using GitHub Pages
git add legal/*.html
git commit -m "Add legal documents"
git push origin main
```

### Update Deployment (after changes):

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# GitHub Pages (automatic on push)
git add legal/*.html
git commit -m "Update legal documents"
git push
```

---

## Troubleshooting

### Issue: DNS not propagating

**Solution:**
```bash
# Check DNS status
dig nox.social

# If not showing correct IP:
# 1. Verify DNS records in registrar
# 2. Wait 5-60 minutes for propagation
# 3. Clear local DNS cache:

# macOS:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows:
ipconfig /flushdns

# Linux:
sudo systemd-resolve --flush-caches
```

### Issue: SSL certificate not working

**Solution:**
- Vercel/Netlify auto-provision SSL (wait 5-10 minutes)
- Ensure DNS is pointing correctly
- Try removing and re-adding domain

### Issue: 404 Not Found

**Solution:**
```bash
# Verify files are deployed
vercel ls  # List deployments
netlify status  # Check deployment status

# Ensure file names match exactly:
# privacy.html (not Privacy.html)
# terms.html (not Terms.html)
```

### Issue: Mobile rendering issues

**Solution:**
- Check viewport meta tag is present
- Test on actual devices, not just emulator
- Use browser dev tools mobile preview

---

## Alternative: Simple Static Site Hosts

If you prefer other options:

### Cloudflare Pages (Free)
```bash
# 1. Push to GitHub
# 2. Connect repo to Cloudflare Pages
# 3. Set build directory: legal
# 4. Deploy
```

### AWS S3 + CloudFront (More complex, $)
```bash
# 1. Create S3 bucket
# 2. Enable static website hosting
# 3. Upload HTML files
# 4. Set up CloudFront distribution
# 5. Configure SSL certificate
```

### Firebase Hosting (Free tier)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory: legal
firebase deploy
```

---

## Cost Breakdown

**Free Options:**
- Vercel: Free (includes SSL, custom domain)
- Netlify: Free (includes SSL, custom domain)
- GitHub Pages: Free (includes SSL)
- Cloudflare Pages: Free

**Paid Options (if you want more control):**
- Domain: $8-15/year (you have nox.social)
- AWS S3 + CloudFront: ~$1-5/month
- Custom hosting: $5-20/month

**Recommended:** Stick with free options (Vercel or Netlify). They're fast, reliable, and include SSL.

---

## Final URLs to Add to App Store

Once deployed, add these URLs:

**Apple App Store Connect:**
- Privacy Policy URL: `https://nox.social/privacy.html`

**Google Play Console:**
- Privacy Policy URL: `https://nox.social/privacy.html`

**In app.json/app.config.js:**
```json
{
  "expo": {
    "privacy": "public",
    "privacyPolicy": "https://nox.social/privacy",
    "termsOfService": "https://nox.social/terms"
  }
}
```

---

## Next Steps

1. ✅ HTML files created (privacy.html, terms.html)
2. ⏳ Deploy to Vercel/Netlify (5 minutes)
3. ⏳ Add custom domain nox.social (15 minutes + DNS wait)
4. ⏳ Test all URLs on mobile and desktop
5. ⏳ Add URLs to App Store Connect and Play Console

**Timeline:** Can be completed in 1-2 hours (including DNS propagation wait time)

---

**Need help?** Contact:
- Vercel Support: https://vercel.com/support
- Netlify Support: https://www.netlify.com/support/
- Domain Support: Your domain registrar's help center

**Status:** ✅ HTML files ready for deployment
