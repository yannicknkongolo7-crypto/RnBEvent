# GitHub Pages vs AWS: Cost & Efficiency Analysis

## Current Architecture

| Component | Service | Purpose |
|---|---|---|
| **Frontend** | GitHub Pages | Static HTML/CSS/JS hosting at rnb716events.com |
| **Backend API** | AWS Lambda + API Gateway | Client data CRUD, email, password reset |
| **Data Storage** | AWS S3 (rnbevents716 bucket) | clients.json, reset codes |
| **Cloud Sync** | Google Apps Script + Sheets | Admin tasks, prospects, content drafts |
| **Email** | AWS SES | Booking emails, password reset codes |

---

## Option A: Current Setup (GitHub Pages + AWS Backend)

### Monthly Costs

| Service | Cost | Notes |
|---|---|---|
| GitHub Pages hosting | **$0** | Free for public repos, includes HTTPS, custom domain, CDN |
| AWS Lambda | **$0** | 1M free requests/month; RNB uses < 1,000/month |
| API Gateway (HTTP API) | **$0** | 1M free requests/month for first 12 months, then ~$1/M requests |
| S3 Storage | **$0.01** | < 1MB stored; GET/PUT negligible |
| SES Email | **$0** | First 62,000 emails/month free (when called from Lambda) |
| Route 53 (if used) | **$0.50** | Per hosted zone/month; optional if DNS is elsewhere |
| **TOTAL** | **~$0 – $0.51/mo** | |

### Pros
- **Zero hosting cost** for frontend — GitHub Pages is free with unlimited bandwidth
- **Built-in CDN** — GitHub Pages uses Fastly CDN globally
- **Auto-deploy** — push to `main` → live in ~60 seconds
- **Free HTTPS** with Let's Encrypt auto-renewal
- **High uptime** — GitHub Pages has 99.9%+ availability
- **No server maintenance** — no patching, scaling, or monitoring needed
- Lambda free tier covers backend needs indefinitely at this scale

### Cons
- GitHub Pages only serves static files (no server-side rendering)
- 100GB/month bandwidth soft limit (more than sufficient for RNB)
- No `.htaccess` or server-side redirects (handled by client-side routing)
- Public repo required for free tier (Pro plan = $4/mo for private repos)

---

## Option B: Full AWS (S3 + CloudFront)

### Monthly Costs

| Service | Cost | Notes |
|---|---|---|
| S3 static hosting | **$0.02** | ~5MB site, minimal storage |
| CloudFront CDN | **$0 – $1** | 1TB/month free tier (12 months), then $0.085/GB |
| ACM Certificate | **$0** | Free for CloudFront distributions |
| Lambda (same) | **$0** | Same backend |
| API Gateway (same) | **$0** | Same |
| SES (same) | **$0** | Same |
| Route 53 | **$0.50** | Hosted zone |
| **TOTAL** | **~$0.52 – $2/mo** | After free tier: ~$1-2/mo |

### Pros
- Everything under one AWS account — single billing, single IAM
- CloudFront offers more granular cache controls
- Lambda@Edge for server-side logic at CDN edge (not needed currently)
- Private hosting (no public repo requirement)

### Cons
- **More complex** — S3 bucket policies, CloudFront distributions, ACM certs, Origin Access Identity
- **More maintenance** — deployment pipeline needs scripting (aws s3 sync + CloudFront invalidation)
- **Costs money** after CloudFront free tier expires ($1-2/mo at minimum)
- No built-in CI/CD — need GitHub Actions or CodePipeline for auto-deploy
- More services to monitor and debug

---

## Option C: Full AWS (Amplify Hosting)

### Monthly Costs

| Service | Cost | Notes |
|---|---|---|
| Amplify Hosting | **$0** | Free tier: 5GB storage, 15GB/month bandwidth |
| After free tier | **$0.15/GB** served + $0.023/GB stored | |
| Lambda/API GW/SES/S3 | **$0** | Same as above |
| **TOTAL** | **$0 – $1/mo** | |

### Pros
- AWS-native git-based deployment (connect GitHub repo)
- Built-in CI/CD with branch previews
- Managed HTTPS and custom domains

### Cons
- Amplify free tier is limited (15GB bandwidth vs GitHub Pages unlimited)
- More complex than GitHub Pages for a static site
- Vendor lock-in within AWS

---

## Recommendation

**Stay with GitHub Pages + AWS Lambda (Current Setup)**

| Factor | GitHub Pages | AWS S3+CF | AWS Amplify |
|---|---|---|---|
| Monthly cost | $0 | $0.52-$2 | $0-$1 |
| Setup complexity | Low | High | Medium |
| Deploy speed | ~60s (git push) | Manual/scripted | ~2-3 min |
| CDN | Fastly (global) | CloudFront (global) | CloudFront |
| Bandwidth | Unlimited* | 1TB free then paid | 15GB free then paid |
| Maintenance | None | Moderate | Low |

**Why the current setup is optimal for RNB Events:**

1. **Cost**: $0/month for hosting. The AWS backend costs are negligible (~$0.01/month for S3). Moving the frontend to AWS would add $1-2/month with no tangible benefit.

2. **Simplicity**: `git push` deploys the site. No build pipelines, no CloudFront invalidations, no bucket policies to manage.

3. **Performance**: GitHub Pages (Fastly CDN) performs comparably to CloudFront for static sites. Both serve from edge locations globally.

4. **Separation of concerns**: Frontend (GitHub) and backend (AWS) are cleanly separated. If one has issues, the other still works.

5. **Scale**: At RNB Events' traffic level (~100-1,000 visits/month), GitHub Pages is more than sufficient. The 100GB/month soft limit equates to roughly 2 million page loads.

**Only consider migrating to AWS if:**
- You need server-side rendering (Next.js, etc.)
- You need private repo hosting without GitHub Pro ($4/mo)
- You want a single cloud provider for compliance/audit reasons
- Traffic exceeds 100GB/month consistently (unlikely for an event planning site)

---

*Analysis prepared for RNB Events — based on pricing as of April 2025*
