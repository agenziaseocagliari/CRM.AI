# ⚙️ Supabase Configuration for Password Reset

## Required Supabase Dashboard Settings

After deploying the password reset feature, configure these settings in your Supabase project dashboard.

---

## 1. Auth URL Configuration

Navigate to: **Authentication → URL Configuration**

### Site URL
Set your application's base URL:
```
Production: https://yourdomain.com
Development: http://localhost:5173
```

### Redirect URLs
Add the following URLs to the allowlist:

**Production:**
```
https://yourdomain.com/reset-password
https://yourdomain.com/login
https://yourdomain.com/dashboard
```

**Development:**
```
http://localhost:5173/reset-password
http://localhost:5173/login
http://localhost:5173/dashboard
```

---

## 2. Email Templates

Navigate to: **Authentication → Email Templates**

### Reset Password Email Template

Customize the "Reset Password" template. The default template should work, but you can customize it:

**Subject:**
```
Reset Your Password - Guardian AI CRM
```

**Email Body (HTML):**
```html
<h2>Reset Your Password</h2>

<p>Hi,</p>

<p>You requested to reset your password for Guardian AI CRM.</p>

<p>Click the link below to set your new password:</p>

<p>
  <a href="{{ .SiteURL }}/reset-password?token={{ .Token }}">
    Reset Password
  </a>
</p>

<p>This link will expire in 24 hours.</p>

<p>If you didn't request this, please ignore this email.</p>

<p>
  Best regards,<br>
  Guardian AI CRM Team
</p>
```

**Important:** Ensure the link format is:
```
{{ .SiteURL }}/reset-password?token={{ .Token }}
```

The token parameter name can be either `token` or `access_token` - the ResetPassword component handles both.

---

## 3. Email Provider Settings

Navigate to: **Settings → Auth → SMTP Settings**

### Option A: Use Supabase's Built-in Email (Easiest)
- Default for development
- Limited to 3 emails per hour
- **Not recommended for production**

### Option B: Custom SMTP (Recommended for Production)
Configure your own SMTP provider (e.g., SendGrid, AWS SES, Brevo):

```
SMTP Host: smtp.example.com
SMTP Port: 587
SMTP User: your-smtp-username
SMTP Password: your-smtp-password
Sender Email: noreply@yourdomain.com
Sender Name: Guardian AI CRM
```

**Note:** The app already uses Brevo for transactional emails. You can use the same Brevo account for auth emails:
- SMTP Host: `smtp-relay.brevo.com`
- SMTP Port: `587`
- SMTP User: Your Brevo email
- SMTP Password: Your Brevo SMTP key (not API key)

---

## 4. Password Settings

Navigate to: **Authentication → Policies**

### Password Strength
The application enforces:
- ✅ Minimum 8 characters (client-side validation)

You can configure additional requirements in Supabase:
- Minimum password length
- Require special characters
- Require uppercase letters
- Require numbers

Current implementation handles any Supabase password policy errors gracefully.

---

## 5. Token Expiration

Navigate to: **Settings → Auth → Email**

### Recovery Token Expiry
Default: 3600 seconds (1 hour)

You can adjust this based on your security requirements:
- More secure: 1800 seconds (30 minutes)
- Standard: 3600 seconds (1 hour)
- Less secure: 86400 seconds (24 hours)

The application handles expired tokens gracefully with appropriate error messages.

---

## 6. Rate Limiting

Navigate to: **Settings → Auth → Rate Limits**

Configure rate limits to prevent abuse:

### Password Reset Requests
Recommended settings:
```
Rate Limit: 5 requests per hour per IP
Burst: 2 requests per minute
```

This prevents:
- Brute force attacks
- Email bombing
- Account enumeration attempts

The application shows generic messages regardless of rate limiting to maintain security.

---

## 7. Security Settings

Navigate to: **Settings → Auth → Security**

### Recommended Settings:

#### Enable Email Confirmations
```
✅ Enable email confirmations for sign ups
✅ Enable email confirmations for password changes
```

#### CAPTCHA (Optional but Recommended)
```
Enable CAPTCHA on:
- Sign up forms
- Password reset forms
```

This adds an extra layer of protection against bots.

---

## Testing Configuration

After configuring the above settings:

### 1. Test Email Delivery
```bash
# In Supabase SQL Editor
SELECT * FROM auth.audit_log_entries 
WHERE action = 'user_recovery_requested'
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. Verify Email Logs
Navigate to: **Authentication → Logs**
- Check for successful/failed email deliveries
- Verify recovery tokens are being generated

### 3. Test Token Flow
1. Request password reset for a test account
2. Check email logs in Supabase
3. Verify email is received
4. Click reset link and verify URL format
5. Complete password reset
6. Verify user can log in with new password

---

## Environment Variables Checklist

Ensure these environment variables are set in your deployment:

### Frontend (.env or Vercel/Netlify settings)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (Supabase Edge Functions)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Troubleshooting

### Emails Not Being Received

1. **Check Supabase Email Logs**
   - Navigate to: Authentication → Logs
   - Look for "user_recovery_requested" events
   - Check for delivery failures

2. **Verify SMTP Configuration**
   - Test SMTP credentials separately
   - Check sender email is verified
   - Ensure SPF/DKIM records are configured

3. **Check Spam Folder**
   - Recovery emails might be flagged as spam
   - Add sender to allowlist

4. **Rate Limiting**
   - Check if rate limits are exceeded
   - Wait before retrying

### Invalid Token Errors

1. **Token Expired**
   - Default expiry is 1 hour
   - Request a new reset link

2. **Token Already Used**
   - Tokens are single-use
   - Request a new reset link

3. **Wrong URL Format**
   - Verify Supabase email template uses correct URL format
   - Should be: `{{ .SiteURL }}/reset-password?token={{ .Token }}`

### User Not Logged In After Reset

1. **Check Session Handling**
   - Verify `updateUser()` is called correctly
   - Check browser console for auth errors

2. **Cookie Issues**
   - Ensure cookies are enabled
   - Check CORS settings in Supabase

---

## Production Deployment Checklist

Before going live:

- [ ] Configure production redirect URLs in Supabase
- [ ] Set up custom SMTP provider (not Supabase default)
- [ ] Customize email templates with branding
- [ ] Test email delivery from production environment
- [ ] Configure rate limiting
- [ ] Enable CAPTCHA if desired
- [ ] Test complete flow in production
- [ ] Monitor email delivery rates
- [ ] Set up alerts for failed deliveries

---

## Additional Security Recommendations

1. **Monitor Failed Reset Attempts**
   ```sql
   -- Query to find suspicious activity
   SELECT email, COUNT(*) as attempts
   FROM auth.audit_log_entries
   WHERE action = 'user_recovery_requested'
     AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY email
   HAVING COUNT(*) > 5;
   ```

2. **Set Up Alerts**
   - Alert on high volume of password reset requests
   - Alert on failed email deliveries
   - Monitor for unusual patterns

3. **Regular Audits**
   - Review auth logs weekly
   - Check for anomalies in reset patterns
   - Verify email delivery rates

---

## Support Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Email Configuration](https://supabase.com/docs/guides/auth/auth-email)
- [Supabase Password Reset](https://supabase.com/docs/guides/auth/passwords#password-reset)
- [Custom Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Configuration Date:** _______________  
**Configured By:** _______________  
**Environment:** ⬜ Development / ⬜ Production  
**Status:** ⬜ Complete  
**Notes:** _______________________________________________
