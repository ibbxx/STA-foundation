# Security Hardening Deployment

The frontend changes depend on the new database policies and Edge Functions.
Deploy them in this order to avoid temporarily breaking public forms.

1. Apply `supabase/migrations/20260614_security_hardening.sql`.
2. Configure the Turnstile secret and allowed production origin:

   ```bash
   supabase secrets set TURNSTILE_SECRET_KEY=your-secret ALLOWED_ORIGIN=https://your-domain.example
   ```

3. Deploy the protected public form functions:

   ```bash
   supabase functions deploy submit-school-report
   supabase functions deploy submit-volunteer-registration
   ```

4. Deploy the frontend.

The migration promotes all Supabase Auth users that already exist at deployment
time into `public.admin_users`. Future accounts must be inserted into that table
explicitly before they can access the admin panel.
