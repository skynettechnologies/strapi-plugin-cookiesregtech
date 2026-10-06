/**
 * CookiesRegTech server part: settings storage in the plugin store, the
 * CookiesRegTech API client, admin-only routes for the settings screens,
 * and one public route the site frontend can call to read the domainId.
 *
 * Strapi is headless, so the plugin cannot inject the banner script into
 * the public website by itself. The connected screen shows the exact
 * snippet for the frontend app, and GET /api/cookiesregtech/config lets a
 * frontend fetch { domainId, server, enabled } at build or run time.
 */

const VERSION = '1.0.0';
const DEFAULT_SERVER = 'https://www.cookiesregtech.com';

const store = (strapi) => strapi.store({ type: 'plugin', name: 'cookiesregtech' });

function configuredServer(strapi) {
  // config/plugins.js: { cookiesregtech: { enabled: true, config: { server: '...' } } }
  // Lets testers point the plugin at the staging server without code changes.
  try {
    return (
      strapi.plugin('cookiesregtech').config('server') ||
      DEFAULT_SERVER
    );
  } catch (error) {
    return DEFAULT_SERVER;
  }
}

async function getSettings(strapi) {
  const stored = (await store(strapi).get({ key: 'settings' })) || {};
  return {
    server: (stored.server || configuredServer(strapi) || DEFAULT_SERVER).replace(/\/+$/, ''),
    domainId: stored.domainId || '',
    secret: stored.secret || '',
    pendingToken: stored.pendingToken || '',
    email: stored.email || '',
    hostname: stored.hostname || '',
    enabled: stored.enabled !== false
  };
}

async function saveSettings(strapi, changes) {
  // Merge into the raw stored values, not the resolved ones — otherwise the
  // resolved server URL gets baked into the store on the first save and a
  // later config/plugins.js `server` override can never take effect.
  const stored = (await store(strapi).get({ key: 'settings' })) || {};
  const settings = { ...stored, ...changes };
  await store(strapi).set({ key: 'settings', value: settings });
  return getSettings(strapi);
}

async function api(strapi, path, payload) {
  const settings = await getSettings(strapi);
  try {
    const response = await fetch(settings.server + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `CookiesRegTech-Strapi/${VERSION} (+https://www.cookiesregtech.com)`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000)
    });
    const body = await response.json().catch(() => ({}));
    return { ...(body && typeof body === 'object' ? body : {}), _status: response.status };
  } catch (error) {
    return { _status: 0, _error: String(error && error.message) };
  }
}

const unexpectedReply = (result) =>
  `Unexpected reply from the consent server (HTTP ${result._status || 0}). If this repeats, the request may be blocked by a firewall.`;

export default {
  routes: {
    admin: {
      type: 'admin',
      routes: [
        { method: 'GET', path: '/state', handler: 'settings.state', config: { policies: ['admin::isAuthenticatedAdmin'] } },
        { method: 'POST', path: '/connect', handler: 'settings.connect', config: { policies: ['admin::isAuthenticatedAdmin'] } },
        { method: 'POST', path: '/check', handler: 'settings.check', config: { policies: ['admin::isAuthenticatedAdmin'] } },
        { method: 'POST', path: '/reset', handler: 'settings.reset', config: { policies: ['admin::isAuthenticatedAdmin'] } },
        { method: 'POST', path: '/save', handler: 'settings.save', config: { policies: ['admin::isAuthenticatedAdmin'] } },
        { method: 'POST', path: '/login-link', handler: 'settings.loginLink', config: { policies: ['admin::isAuthenticatedAdmin'] } },
        { method: 'POST', path: '/disconnect', handler: 'settings.disconnect', config: { policies: ['admin::isAuthenticatedAdmin'] } }
      ]
    },
    'content-api': {
      type: 'content-api',
      routes: [
        // Public config for the site frontend: no secret, only what the
        // browser needs to load the banner. Enable public access for this
        // route under Settings > Users & Permissions > Roles > Public.
        { method: 'GET', path: '/config', handler: 'settings.publicConfig', config: { auth: false } }
      ]
    }
  },

  controllers: {
    settings: ({ strapi }) => ({
      async state(ctx) {
        const settings = await getSettings(strapi);
        let state = 'connect';
        let overview = null;

        if (settings.secret && settings.domainId) {
          state = 'connected';
          const result = await api(strapi, '/api/plugin/overview', { secret: settings.secret });
          if (result._status === 200) overview = result;
        } else if (settings.pendingToken) {
          state = 'pending';
        }

        ctx.body = {
          state,
          overview,
          settings: {
            server: settings.server,
            domainId: settings.domainId,
            email: settings.email,
            hostname: settings.hostname,
            enabled: settings.enabled
          },
          snippet: settings.domainId
            ? `<script src="${settings.server}/embed/boot/${settings.domainId}.js"></script>`
            : null
        };
      },

      async connect(ctx) {
        const { email, hostname, consent } = ctx.request.body || {};
        const host = String(hostname || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

        if (!email || !consent || !host) {
          ctx.body = { error: 'Enter the website address, a valid email address, and accept the terms to continue.' };
          return;
        }

        const result = await api(strapi, '/api/plugin/provision', {
          email,
          hostname: host,
          platform: 'strapi',
          consent: true
        });

        if (result.status === 'connected') {
          await saveSettings(strapi, {
            domainId: result.domainId,
            secret: result.secret,
            email: result.email || email,
            hostname: host,
            pendingToken: '',
            enabled: true
          });
          ctx.body = { ok: true, message: `The free account is ready. Add the snippet to the site frontend to show the banner. A sign-in link was emailed to ${email}.` };
        } else if (result.status === 'confirmation_sent') {
          await saveSettings(strapi, { pendingToken: result.requestToken, email, hostname: host });
          ctx.body = { ok: true, message: 'That email already has an account. We sent it a confirmation link. Click the link, then press "Check status" here.' };
        } else {
          ctx.body = { error: result.error || unexpectedReply(result) };
        }
      },

      async check(ctx) {
        const settings = await getSettings(strapi);
        const result = await api(strapi, '/api/plugin/status', { requestToken: settings.pendingToken });

        if (result.status === 'connected') {
          await saveSettings(strapi, { domainId: result.domainId, secret: result.secret, pendingToken: '', enabled: true });
          ctx.body = { ok: true, message: 'Connected. Add the snippet to the site frontend to show the banner.' };
        } else if (result.status === 'pending') {
          ctx.body = { warning: 'Not confirmed yet. Click the link in the email first.' };
        } else {
          await saveSettings(strapi, { pendingToken: '' });
          ctx.body = { error: result.error || 'The request expired. Start again.' };
        }
      },

      async reset(ctx) {
        // Start over: also drop any stored server left by older builds so
        // the plugin falls back to config/plugins.js or the default.
        await saveSettings(strapi, { pendingToken: '', server: '' });
        ctx.body = { ok: true };
      },

      async save(ctx) {
        await saveSettings(strapi, { enabled: Boolean((ctx.request.body || {}).enabled) });
        ctx.body = { ok: true, message: 'Saved.' };
      },

      async loginLink(ctx) {
        const settings = await getSettings(strapi);
        const payload = { secret: settings.secret };
        if ((ctx.request.body || {}).intent === 'upgrade') payload.intent = 'upgrade';
        const result = await api(strapi, '/api/plugin/login-link', payload);
        ctx.body = result.url ? { url: result.url } : { error: result.error || 'Could not create a sign-in link. Try again.' };
      },

      async disconnect(ctx) {
        const settings = await getSettings(strapi);
        if (settings.secret) {
          await api(strapi, '/api/plugin/disconnect', { secret: settings.secret });
        }
        await saveSettings(strapi, { domainId: '', secret: '', pendingToken: '', email: '', server: '' });
        ctx.body = { ok: true, message: 'Disconnected. Remove the snippet from the site frontend. The CookiesRegTech account and its data are unchanged.' };
      },

      async publicConfig(ctx) {
        const settings = await getSettings(strapi);
        ctx.body = {
          enabled: settings.enabled && Boolean(settings.domainId),
          domainId: settings.domainId || null,
          server: settings.server,
          scriptUrl: settings.domainId ? `${settings.server}/embed/boot/${settings.domainId}.js` : null
        };
      }
    })
  }
};
