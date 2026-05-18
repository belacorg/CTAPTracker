# Full auth-user deletion (deferred — deploy when ready)

Right now the **Delete account & data** button in Settings wipes every row in
`job_logs`, `weeks`, and `users_profile` for the signed-in user, then signs
them out and clears local storage. That covers everything the app stores
about them.

What it does **not** do: delete the `auth.users` record (their email/login)
from Supabase. Removing that requires the service-role key, which a browser
must never see. The accepted pattern is a Supabase Edge Function that
authenticates the caller, then calls `auth.admin.deleteUser()` server-side.

Until that's deployed, users' auth records linger until you remove them by
hand from the Supabase dashboard → Authentication → Users. The in-app copy
is honest about this ("Your sign-in record is removed within 24h once we
deploy our cleanup function").

## Deploying the edge function

### 1. Install the Supabase CLI (one-time, if not already)

```bash
brew install supabase/tap/supabase
```

### 2. Link this repo to the Supabase project

From the repo root:

```bash
supabase login
supabase link --project-ref ueupqkxdqjusfxtjaflq
```

### 3. Create the function

```bash
supabase functions new delete-user
```

That scaffolds `supabase/functions/delete-user/index.ts`. Replace its contents
with:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST')   return new Response('Method not allowed', { status: 405, headers: cors });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Missing auth', { status: 401, headers: cors });

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return new Response('Not signed in', { status: 401, headers: cors });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) return new Response(delErr.message, { status: 500, headers: cors });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
```

### 4. Deploy

```bash
supabase functions deploy delete-user --no-verify-jwt
```

(`--no-verify-jwt` is fine because the function does its own auth check via
`userClient.auth.getUser()`.)

### 5. Wire it into the app

In [`app/src/main.js`](../app/src/main.js), update the bridge function to
call the edge function **after** wiping data rows:

```js
window.__ctapDeleteAccountData = async function() {
  if (!_currentUser) throw new Error('Not signed in');
  await deleteAllUserData(_currentUser);

  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    },
  );
  if (!res.ok) throw new Error('Auth deletion failed: ' + (await res.text()));

  try {
    localStorage.removeItem('jct_state');
    Object.keys(localStorage).filter(k => k.startsWith('jcpd_')).forEach(k => localStorage.removeItem(k));
  } catch {}
  await supabase.auth.signOut();
  _currentUser = null;
  if (window.__ctapOnSignOut) window.__ctapOnSignOut();
};
```

Once that's live, also update the user-facing note in
[`app/app.js`](../app/app.js) (`settings-delete-note`) — drop the "within 24h"
wording since deletion is now immediate.
