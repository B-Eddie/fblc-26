# reCAPTCHA v2 Setup Guide

This app includes reCAPTCHA v2 (Checkbox challenge) integration for bot protection during signup. Users must solve the CAPTCHA puzzle to create an account. Follow these steps to configure it.

## Step 1: Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Sign in with your Google account
3. Click the **"+" button** to create a new site
4. Fill in the form:
   - **Label**: Enter your app name (e.g., "Vertex")
   - **reCAPTCHA type**: Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains**: Add your domain(s):
     - For local development: `localhost:3000`
     - For production: `yourdomain.com`
5. Accept the terms and click **Submit**
6. You'll see your keys:
   - **Site Key** (client-side / public)
   - **Secret Key** (server-side / private)

## Step 2: Add Environment Variables

1. Open `.env.local` in your project root
2. Add the following variable with your actual site key:

```env
# reCAPTCHA v2 Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

> **Note:** The `NEXT_PUBLIC_` prefix means it's exposed to the frontend. The `RECAPTCHA_SECRET_KEY` is optional and only needed if you want to verify tokens on your backend.

## Step 3: Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the signup page at `http://localhost:3000/auth/signup`
3. You should see:
   - The signup form with all fields (Full Name, Email, Password)
   - **A visible reCAPTCHA checkbox** near the bottom of the form
   - **Signup button is DISABLED** until you check the CAPTCHA
4. Click the CAPTCHA checkbox to verify
5. The signup button should now be **ENABLED**
6. After solving the CAPTCHA and signing up, you should be redirected to the login page immediately (no email verification needed)

## How It Works

### User Flow
1. User fills out signup form (Full Name, Email, Password)
2. User sees the reCAPTCHA v2 checkbox challenge
3. User clicks "I'm not a robot" checkbox
4. Google's backend verifies the CAPTCHA
5. Once verified, the signup button becomes enabled
6. User clicks signup
7. Account is created immediately and user is redirected to login
8. **No email verification required** - CAPTCHA verification is the bot protection

### Frontend
- The `CaptchaVerification` component renders the reCAPTCHA checkbox
- When user solves the CAPTCHA, a token is generated and stored
- Submit button is disabled until token is received
- Token prevents accidental form submission while CAPTCHA is unsolved

### What Makes This Secure
- **reCAPTCHA Analysis**: Google analyzes user behavior to detect bots
- **Puzzle Challenge**: Users must interact with the checkbox, making automated attacks harder
- **Token Validation**: Each CAPTCHA solution generates a unique token
- **Immediate Account Creation**: No email verification needed since CAPTCHA already proved humanity

## Differences from reCAPTCHA v3

| Feature | v3 | v2 |
|---------|-----|-----|
| **Visible to User** | ❌ Invisible | ✅ Visible checkbox |
| **User Interaction** | Passive (no action needed) | Active (must click checkbox) |
| **Bot Detection** | Behavior analysis (0.0-1.0 score) | Puzzle challenge |
| **Best For** | Background verification | Critical operations |
| **User Experience** | Seamless but less obvious | Clear and obvious verification |

## Troubleshooting

### "reCAPTCHA site key not found" warning
The `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` environment variable is not set. Add it to `.env.local`.

### CAPTCHA checkbox doesn't appear
- Ensure the site key is correct
- Check that your domain is registered in the reCAPTCHA console
- Try clearing browser cache and refreshing
- Check browser DevTools Console for errors

### Submit button stays disabled after solving CAPTCHA
- The token might not have been generated successfully
- Check browser Console for error messages
- Try refreshing the page and solving the CAPTCHA again

### Getting "Invalid site key" error
- Verify you're using the correct site key (not the secret key)
- Make sure the key is for reCAPTCHA v2 Checkbox
- Check that your domain is registered in the reCAPTCHA console

## Optional: Server-side Verification

For additional security, you can verify the CAPTCHA token on your backend:

```javascript
// Server-side (Node.js/API Route)
async function verifyCaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${secretKey}&response=${token}`,
  });

  const data = await response.json();
  
  console.log('reCAPTCHA response:', data);
  // data.success: true if verification passed
  // data.challenge_ts: timestamp of challenge
  // data.hostname: hostname for which the challenge was solved
  
  return data.success;
}
```

## References

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [reCAPTCHA v2 Guide](https://developers.google.com/recaptcha/docs/display)
- [React reCAPTCHA Library](https://github.com/iamsuperspy/react-google-recaptcha)
