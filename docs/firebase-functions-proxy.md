# Firebase Functions Proxy Setup

This repo now includes a Firebase Functions proxy in [`functions/`](../functions) so the extension can call your backend without shipping the upstream API key.

## Confirmed upstream request shape

The proxy forwards to the real Navix API like this:

```txt
POST https://navix-api.abacusai.app/interpret
X-API-Key: <server-side secret>
Content-Type: application/json
Accept: application/json
```

with a body shaped like:

```json
{
  "query": "search for pizza places near me on google maps"
}
```

So the extension does **not** send the secret directly. It sends the request to your Firebase Function, and the Function adds `X-API-Key` before forwarding it upstream.

## What gets deployed

One HTTPS function:

- `navixApiProxy`

Routes inside it:

- `POST /interpret`
- `POST /create-shortcut`

So your extension proxy base URL will look like:

```env
VITE_NAVIX_PROXY_URL=https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/navixApiProxy
```

## 1. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

## 2. Initialize Firebase in this repo if needed

If this repo is not already connected to your Firebase project:

```bash
firebase use --add
```

Pick the same Firebase project you already use for Auth/Firestore.

## 3. Install function dependencies

From the repo root:

```bash
cd functions
npm install
```

## 4. Set the secret env for Functions

For local development, you can create:

`functions/.env`

with:

```env
NAVIX_API_KEY=your_navix_api_key_here
NAVIX_API_URL=https://your-navix-api-endpoint.com
```

For deployed Functions, use Firebase secret/config handling. The simplest first step is:

```bash
firebase functions:secrets:set NAVIX_API_KEY
```

Then enter your real key when prompted.

If you want the URL configurable too:

```bash
firebase functions:secrets:set NAVIX_API_URL
```

or just leave it hardcoded to `https://navix-api.abacusai.app`.

## 5. Deploy

From the repo root:

```bash
firebase deploy --only functions:navixApiProxy
```

Your function URL will be something like:

```txt
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/navixApiProxy
```

## 6. Point the extension at it

In the extension repo root, set:

`.env.local`

```env
VITE_NAVIX_PROXY_URL=https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/navixApiProxy
```

Then rebuild:

```bash
npm run build
```

## 7. Update extension permissions

If the function URL domain is new, add it to [`public/manifest.json`](../public/manifest.json):

- `host_permissions`
- `content_security_policy.extension_pages` `connect-src`

For Firebase Functions, you will usually want:

```txt
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/*
```

and:

```txt
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net
```

## Local testing

With the emulator:

```bash
cd functions
npm install
firebase emulators:start --only functions
```

Then your local proxy URL is usually:

```txt
http://127.0.0.1:5001/YOUR_PROJECT_ID/us-central1/navixApiProxy
```

and the extension would call:

- `.../navixApiProxy/interpret`
- `.../navixApiProxy/create-shortcut`
