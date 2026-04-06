# Firebase Functions Secrets Setup

## Issue: API Key Visible in Firebase Console

If your NAVIX_API_KEY is visible as plain text in the Firebase Console, it means it's set as a regular environment variable instead of a secure secret.

## Solution: Use Firebase Secrets

### Step 1: Remove the environment variable

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Functions** → **Configuration**
4. Remove any `NAVIX_API_KEY` environment variable

### Step 2: Set the secret properly

```bash
firebase functions:secrets:set NAVIX_API_KEY
```

When prompted, enter your actual Navix API key.

### Step 3: Redeploy functions

```bash
firebase deploy --only functions
```

### Step 4: Verify secret is accessible

```bash
firebase functions:secrets:access NAVIX_API_KEY
```

## Why This Matters

- **Environment Variables**: Visible in Firebase Console UI
- **Secrets**: Encrypted, only accessible by your functions at runtime
- **Security**: Secrets are the recommended way to handle sensitive data

## Local Development

For local development, create `functions/.env` with:

```
NAVIX_API_KEY=your_actual_key_for_development
NAVIX_API_URL=https://navix-api.abacusai.app
```

**Important**: Never commit `functions/.env` to git - it's already in `.gitignore`.
