import { useCallback, useEffect, useState } from 'react';
import { getFetchClient } from '@strapi/strapi/admin';

const PLUGIN_VERSION = '1.0.0';

/**
 * The CookiesRegTech settings screens (connect / pending / connected).
 * Talks to this plugin's admin routes through Strapi's fetch client, which
 * carries the admin authentication automatically.
 */

const call = async (path, body) => {
  const { get, post } = getFetchClient();
  const { data } = body === undefined
    ? await get(`/cookiesregtech${path}`)
    : await post(`/cookiesregtech${path}`, body);

  return data;
};

const ui = {
  // The screen carries its own light surface, so it reads the same in the
  // admin's light and dark themes.
  outer: { background: '#f6f1fd', minHeight: '100%', padding: '40px 32px' },
  wrap: { maxWidth: 920, margin: '0 auto', fontFamily: 'inherit', color: '#12242a', fontSize: 16, lineHeight: 1.6 },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  badge: { width: 42, height: 42, borderRadius: 10, background: '#8b45e6', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: '#280050' },
  tagline: { color: '#5b6675', margin: '4px 0 24px', fontSize: 15.5 },
  link: { color: '#6d28d9' },
  pill: { background: '#e8f6ee', color: '#16794c', fontSize: 14.5, fontWeight: 700, borderRadius: 22, padding: '7px 16px' },
  panel: { background: '#fff', border: '1px solid #e3dbf2', borderRadius: 14, padding: '26px 28px', marginBottom: 18 },
  field: { display: 'block', maxWidth: 520, marginBottom: 18, fontWeight: 600, fontSize: 15.5 },
  input: { width: '100%', marginTop: 6, padding: '13px 15px', border: '1px solid #c9c2d8', borderRadius: 10, font: 'inherit', fontSize: 15.5, fontWeight: 400 },
  small: { display: 'block', color: '#5b6675', marginTop: 6, fontWeight: 400, fontSize: 14 },
  actions: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 16 },
  btn: { border: '1px solid #c9c2d8', borderRadius: 10, padding: '13px 24px', minHeight: 46, fontWeight: 700, cursor: 'pointer', background: '#fff', color: '#12242a', font: 'inherit', fontSize: 15.5 },
  btnPrimary: { background: '#6d28d9', borderColor: '#6d28d9', color: '#fff' },
  btnDanger: { color: '#a52333', borderColor: '#dfa4ad', marginLeft: 'auto' },
  notice: (type) => ({
    borderRadius: 12,
    padding: '15px 20px',
    marginBottom: 18,
    fontWeight: 600,
    fontSize: 15.5,
    background: type === 'error' ? '#fdf3f4' : type === 'warning' ? '#fdf6e3' : '#e8f6ee',
    color: type === 'error' ? '#a52333' : type === 'warning' ? '#8a6d1a' : '#16794c'
  }),
  table: { width: '100%', maxWidth: 680, borderCollapse: 'collapse', background: '#fff', border: '1px solid #e3dbf2', borderRadius: 12, marginBottom: 18, fontSize: 15.5 },
  th: { textAlign: 'left', width: 160, background: '#f8fafb', fontWeight: 600, padding: '12px 16px', borderBottom: '1px solid #ece3f8' },
  td: { padding: '12px 16px', borderBottom: '1px solid #ece3f8' },
  code: { background: '#12061f', color: '#e7defc', borderRadius: 10, padding: '13px 16px', display: 'block', fontSize: 14, overflowX: 'auto' }
};

const CATEGORY_LABELS = {
  ESSENTIAL: 'Essential',
  FUNCTIONALITY: 'Functionality',
  ANALYTICS: 'Analytics',
  ADS: 'Ads',
  UNCATEGORISED: 'Uncategorised'
};

const HomePage = () => {
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState(null);
  const [email, setEmail] = useState('');
  const [hostname, setHostname] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    call('/state').then((payload) => {
      setData(payload);
      setEmail((current) => current || payload.settings.email || '');
      setHostname((current) => current || payload.settings.hostname || '');
    }).catch(() => setNotice({ type: 'error', message: 'Could not load the plugin state.' }));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (path, body) => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await call(path, body || {});
      if (result.error) setNotice({ type: 'error', message: result.error });
      else if (result.warning) setNotice({ type: 'warning', message: result.warning });
      else if (result.message) setNotice({ type: 'ok', message: result.message });
      if (result.url) window.open(result.url, '_blank', 'noopener');
      load();
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <div style={ui.outer}><div style={ui.wrap}>Loading…</div></div>;

  const { state, overview, settings, snippet } = data;

  return (
    <div style={ui.outer}>
    <div style={ui.wrap}>
      <div style={ui.head}>
        <div style={ui.brand}>
          <span style={ui.badge} aria-hidden="true">CR</span>
          <h1 style={ui.title}>CookiesRegTech - Cookie Consent</h1>
        </div>
        {state === 'connected' ? <span style={ui.pill}>● Connected</span> : null}
      </div>
      <p style={ui.tagline}>GDPR/CCPA consent banner, cookie scanner and consent log for the website this Strapi powers.</p>

      {notice ? <div style={ui.notice(notice.type)}>{notice.message}</div> : null}

      {state === 'connect' ? (
        <div style={ui.panel}>
          <label style={ui.field}>
            <span>Website address</span>
            <input style={ui.input} value={hostname} onChange={(event) => setHostname(event.target.value)} placeholder="www.customersite.com" />
            <small style={ui.small}>Strapi is headless, so enter the public address of the website this Strapi serves.</small>
          </label>
          <label style={ui.field}>
            <span>Account email</span>
            <input style={ui.input} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <small style={ui.small}>The consent dashboard login. If this email already has a CookiesRegTech account, we send it a confirmation link instead of creating a new one.</small>
          </label>
          <label style={{ ...ui.field, maxWidth: 620, display: 'flex', gap: 8, alignItems: 'flex-start', fontWeight: 400, color: '#5b6675' }}>
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} style={{ marginTop: 3 }} />
            <span>Create a free CookiesRegTech account for this email, connect this website, and accept the{' '}
              <a style={ui.link} href="https://www.cookiesregtech.com/terms-and-condition" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a> and{' '}
              <a style={ui.link} href="https://www.cookiesregtech.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
          </label>
          <div style={ui.actions}>
            <button type="button" style={{ ...ui.btn, ...ui.btnPrimary }} disabled={busy || !consent} onClick={() => act('/connect', { email, hostname, consent })}>Connect website</button>
            <span style={{ color: '#5b6675', fontSize: 15 }}>Free plan · no card required</span>
          </div>
        </div>
      ) : null}

      {state === 'pending' ? (
        <div>
          <div style={{ ...ui.panel, background: '#f6f1fd' }}>
            <h3 style={{ margin: '0 0 8px', color: '#280050', fontSize: 18 }}>Almost done. Confirm from the inbox</h3>
            <p style={{ margin: 0 }}>A confirmation link was sent to <strong>{settings.email}</strong> because this email already has a CookiesRegTech account. Click the link in that email, then come back here.</p>
          </div>
          <div style={ui.actions}>
            <button type="button" style={{ ...ui.btn, ...ui.btnPrimary }} disabled={busy} onClick={() => act('/check')}>Check status</button>
            <button type="button" style={ui.btn} disabled={busy} onClick={() => act('/reset')}>Start over</button>
          </div>
        </div>
      ) : null}

      {state === 'connected' ? (
        <div>
          <table style={ui.table}>
            <tbody>
              <tr><th style={ui.th}>Account</th><td style={ui.td}>{settings.email || (overview ? overview.email : '—')}</td></tr>
              <tr><th style={ui.th}>Website</th><td style={ui.td}>{overview ? overview.hostname : settings.domainId}</td></tr>
              <tr><th style={ui.th}>Plan</th><td style={ui.td}>{overview ? overview.plan.name : '—'}</td></tr>
              <tr><th style={ui.th}>Banner</th><td style={ui.td}>{overview ? (overview.bannerPublished ? `Published (version ${overview.bannerVersion})` : 'Not published yet. Open the dashboard to publish it.') : '—'}</td></tr>
              {overview && overview.lastScan ? (
                <tr><th style={ui.th}>Last scan</th><td style={ui.td}>{new Date(overview.lastScan.completedAt).toUTCString()}, {overview.lastScan.urlsScanned} pages, {overview.lastScan.cookiesFound} cookies found</td></tr>
              ) : null}
            </tbody>
          </table>

          <div style={ui.panel}>
            <h3 style={{ margin: '0 0 8px', color: '#280050', fontSize: 18 }}>Install on the site frontend</h3>
            <p style={{ margin: '0 0 12px', color: '#5b6675', fontSize: 15 }}>
              Strapi is headless, so add this one line to the frontend app's HTML, right after the opening &lt;head&gt; tag and BEFORE Google Tag Manager or any analytics script.
              The frontend can also fetch <code>GET /api/cookiesregtech/config</code> from this Strapi to read the script URL at build or run time (enable Public access for that route under Users &amp; Permissions).
            </p>
            {snippet ? <code style={ui.code}>{snippet}</code> : null}
          </div>

          {overview && overview.cookies && overview.cookies.length ? (
            <details style={ui.panel} open={overview.cookies.length <= 12}>
              <summary style={{ fontWeight: 700, color: '#280050', cursor: 'pointer', fontSize: 16 }}>Cookies detected ({overview.cookies.length})</summary>
              <table style={{ ...ui.table, maxWidth: 'none', marginTop: 10 }}>
                <thead>
                  <tr>
                    <th style={ui.th}>Cookie</th><th style={ui.th}>Category</th><th style={ui.th}>Domain</th><th style={ui.th}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.cookies.map((cookie) => (
                    <tr key={cookie.name + cookie.domain}>
                      <td style={ui.td}><code>{cookie.name}</code></td>
                      <td style={ui.td}>{CATEGORY_LABELS[cookie.category] || cookie.category}</td>
                      <td style={ui.td}>{cookie.domain}</td>
                      <td style={ui.td}>{cookie.duration || 'Session'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: '#5b6675', fontSize: 14.5, margin: 0 }}>Categories and descriptions are managed in the CookiesRegTech dashboard (Cookie Manager). Run a scan there to refresh this list.</p>
            </details>
          ) : overview ? (
            <p style={{ color: '#5b6675', fontSize: 15 }}>No cookies recorded yet. Open the dashboard and run a scan from Cookie Manager to build the cookie list.</p>
          ) : null}

          <div style={{ ...ui.panel, ...{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' } }}>
            <button type="button" style={{ ...ui.btn, ...ui.btnPrimary }} disabled={busy} onClick={() => act('/login-link')}>Open dashboard</button>
            <button type="button" style={{ ...ui.btn, border: '1.5px solid #6d28d9', color: '#280050' }} disabled={busy} onClick={() => act('/login-link', { intent: 'upgrade' })}>Upgrade plan</button>
            <button
              type="button"
              style={{ ...ui.btn, ...ui.btnDanger }}
              disabled={busy}
              onClick={() => {
                if (window.confirm('Disconnect this site? Remove the snippet from the frontend as well.')) act('/disconnect');
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : null}
      <p style={{ color: '#8b93a1', fontSize: 13.5, marginTop: 28 }}>CookiesRegTech Strapi plugin v{PLUGIN_VERSION}</p>
    </div>
    </div>
  );
};

export { HomePage };
