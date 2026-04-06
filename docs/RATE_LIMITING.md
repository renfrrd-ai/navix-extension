# Rate Limiting Guide for Navix

## Overview

Rate limiting protects your API from abuse and unexpected traffic spikes. Navix implements rate limiting at the Cloud Functions layer.

## Current Configuration

### Express Rate Limiter (Functions)

The Firebase Functions proxy now uses `express-rate-limit`:

```javascript
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // max 100 requests per IP per minute
  standardHeaders: true, // Include rate limit info in response headers
  legacyHeaders: false, // Don't use old X-RateLimit headers
});

app.use(limiter);
```

**Current Limits:**

- **100 requests per minute** per IP address
- Window: 1 minute (sliding window)
- Applies to all routes: `/interpret`, `/create-shortcut`, and `/`

## How Rate Limiting Works

1. **Per-IP tracking**: Each unique IP is tracked separately
2. **Sliding window**: Requests are counted in the last 60 seconds
3. **Automatic reset**: Counter resets every minute
4. **HTTP 429**: Exceeding limit returns: `429 Too Many Requests`

## Response Headers

When rate limiting is active, your responses include:

```
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 1712345678
```

## Adjusting Rate Limits

### For Your Extension (Typical Usage)

Normal extension usage is **well under 100 requests/minute**. If you need to adjust:

**In `functions/index.js`:**

```javascript
const limiter = rateLimit({
  windowMs: 60 * 1000, // Change to 5 * 60 * 1000 for 5-minute window
  max: 100, // Increase to 500 for higher limit
});
```

**Common scenarios:**

| Scenario            | windowMs | max | Description        |
| ------------------- | -------- | --- | ------------------ |
| Normal usage        | 60s      | 100 | Default            |
| High volume testing | 60s      | 500 | Test environment   |
| Lenient limit       | 5min     | 200 | 40 req/min average |
| Strict limit        | 1min     | 30  | 0.5 req/sec max    |

### Making Changes

1. Edit `functions/index.js` rate limit config
2. Run: `npm install` in functions directory (already has express-rate-limit)
3. Deploy: `firebase deploy --only functions`

## Firebase-Level Rate Limiting

For production, also implement **Cloud Functions limits**:

### Setting up Quota Policies

In `firebase.json`:

```json
{
  "functions": {
    "source": "functions",
    "codebase": "default"
  }
}
```

Add function-specific settings (requires Firebase Blaze plan):

```bash
# Limit function to max 100 concurrent requests
gcloud functions deploy navixApiProxy --max-instances 100
```

### Cloud Run/Cloud Functions Quotas

Firebase Functions use Cloud Run under the hood. Limits:

- **Max concurrent requests**: 1000 per function (configurable)
- **Memory**: 1GB default (configurable)
- **Timeout**: 60 seconds default (configurable)
- **Monthly invocations**: ~2M free tier (pay as you go after)

## Monitoring Rate Limit Usage

### In Cloud Functions Logs

```bash
firebase functions:log
```

Look for `429` responses:

```
Function execution took 45 ms, returned 429 "Too Many Requests"
```

### In Cloud Console

1. Go to [Cloud Functions](https://console.cloud.google.com/functions)
2. Select `navixApiProxy`
3. **Metrics** tab shows:
   - Request count
   - Error rate
   - Latency

### Custom Monitoring

Add logging in your function:

```javascript
app.use((req, res, next) => {
  const remaining = res.getHeader("RateLimit-Remaining");
  if (remaining && parseInt(remaining) < 10) {
    console.warn("[Rate Limit Warning]", {
      remaining,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  }
  next();
});
```

## Handling Rate Limit Errors

The extension already handles 429 errors gracefully:

```javascript
// In useCommand.js:
try {
  const data = await routeQuery(q);
  // handle success
} catch (err) {
  console.error("[API Error]", err);
  // Falls back to Google search
  showToast("AI routing failed, falling back to Google", "error");
}
```

Users see a toast message, not a hard error.

## Cost Implications

Rate limiting **reduces costs** by:

- Preventing runaway requests
- Blocking abuse/bots
- Limiting DDoS impact

**Navix billing:**

- First 2M invocations/month: FREE
- After: ~$0.40 per 1M invocations
- Rate limiting prevents expensive abuse scenarios

## Production Recommendations

1. **Start conservative**: 100 req/min is safe for extension usage
2. **Monitor first week**: Check Cloud Functions logs
3. **Adjust based on metrics**: Increase if needed
4. **Add Cloud Run limits**: Cap concurrent requests
5. **Enable billing alerts**: Get notified if costs spike

```bash
# Set billing alert in Cloud Console
# Billing > Budgets and Alerts > Create Budget
```

## Troubleshooting

### "Too many requests" errors in extension

**Cause**: Single IP exceeded 100 req/min
**Fix**:

- Check if user is hammering commands
- Increase limit: `max: 300`
- Or increase window: `windowMs: 5 * 60 * 1000`

### Rate limiting not working

**Check:**

1. Deployed latest code: `firebase deploy --only functions`
2. Package has express-rate-limit: `cd functions && npm list express-rate-limit`
3. Check logs: `firebase functions:log`

### Different rate limits for different routes

```javascript
const strictLimiter = rateLimit({ windowMs: 60000, max: 10 });
const normalLimiter = rateLimit({ windowMs: 60000, max: 100 });

app.post("/interpret", strictLimiter, async (req, res) => {
  /* ... */
});
app.post("/create-shortcut", normalLimiter, async (req, res) => {
  /* ... */
});
```

## Advanced: Distributed Rate Limiting

For multi-region deployment, use a shared store:

```javascript
const RedisStore = require("rate-limit-redis");
const redis = require("redis");

const client = redis.createClient();
const limiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: "rl:", // rate limit prefix
  }),
  windowMs: 60000,
  max: 100,
});
```

Use Firebase Firestore as alternative store (slower but no extra setup):

- See `express-rate-limit` Firestore adapter documentation

---

**Questions?** Check [express-rate-limit docs](https://github.com/nfriedly/express-rate-limit) or Firebase Cloud Functions docs.
