#!/usr/bin/env python3
"""Config-vs-routes audit: find frontend API paths with no matching backend route."""
import re, os, glob

BK = "/Users/rayan/nox.social/expo/backend/src"
FE = "/Users/rayan/nox.social/expo"

# mount prefix -> route file (from server.js), via the require var mapping
MOUNT = {
    'venues.routes': '/api/v1', 'social.routes': '/api/social', 'auth.routes': '/api/auth',
    'waitlist.routes': '/api/waitlist', 'admin.routes': '/api/admin', 'business.routes': '/api/business',
    'venue.routes': '/api/venues', 'pos.routes': '/api/pos', 'moderation.routes': '/api/moderation',
    'chat.routes': '/api/chat', 'payments.routes': '/api/payments', 'growth.routes': '/api/growth',
    'events.routes': '/api/events', 'content.routes': '/api/content', 'pricing.routes': '/api/pricing',
    'retention.routes': '/api/retention', 'upload.routes': '/api/upload',
}

def norm(p):
    """Normalize a path: strip trailing slash, convert :param and ${...} to *."""
    p = re.sub(r':[A-Za-z0-9_]+', '*', p)
    p = re.sub(r'\$\{[^}]+\}', '*', p)
    p = re.sub(r'\?.*$', '', p)          # strip query
    p = p.rstrip('/')
    return p

# ---- Backend routes ----
backend = set()
for f, prefix in MOUNT.items():
    path = os.path.join(BK, 'routes', f + '.js')
    if not os.path.exists(path): continue
    src = open(path).read()
    for m in re.finditer(r"router\.(get|post|put|patch|delete)\(\s*'([^']*)'", src):
        full = norm(prefix + m.group(2))
        backend.add(full)
# also the payments webhook (mounted directly) + health
backend.add('/api/webhooks/stripe'); backend.add('/health'); backend.add('/api/csrf-token')

# ---- Frontend paths ----
# 1) string literals / template literals passed to apiClient.METHOD( '...' )
fe_paths = []  # (path, file, line)
files = []
for base in ['services', 'contexts', 'hooks', 'app']:
    files += glob.glob(os.path.join(FE, base, '**', '*.ts'), recursive=True)
    files += glob.glob(os.path.join(FE, base, '**', '*.tsx'), recursive=True)
for path in files:
    if 'node_modules' in path or '__tests__' in path: continue
    for i, line in enumerate(open(path, errors='ignore'), 1):
        # apiClient.get('/x')  api.post('/x')  apiClient.get(`/x/${y}`)
        for m in re.finditer(r"""apiClient\.(get|post|put|patch|delete)\s*<[^>]*>\s*\(\s*[`']([^`']*)[`']""", line):
            fe_paths.append((m.group(2), path, i))
        for m in re.finditer(r"""apiClient\.(get|post|put|patch|delete)\s*\(\s*[`']([^`']*)[`']""", line):
            fe_paths.append((m.group(2), path, i))
        for m in re.finditer(r"""\bapi\.(get|post|put|patch|delete)\s*<[^>]*>\s*\(\s*[`']([^`']*)[`']""", line):
            fe_paths.append((m.group(2), path, i))

# 2) config.ts API_ENDPOINTS string values + template-literal fns
cfg = open(os.path.join(FE, 'services', 'config.ts')).read()
for m in re.finditer(r"""[:=]\s*[`']([/][^`']*)[`']""", cfg):
    fe_paths.append((m.group(1), 'services/config.ts', 0))
for m in re.finditer(r"""=>\s*`([/][^`]*)`""", cfg):
    fe_paths.append((m.group(1), 'services/config.ts', 0))

# ---- Compare ----
# A frontend path (relative to /api, since apiClient base ends in /api) matches
# if /api + path is in backend. Some fe paths already absolute (/health).
misses = []
seen = set()
for raw, file, line in fe_paths:
    if not raw.startswith('/'): continue
    if raw in ('/', ''): continue
    cand = norm(raw if raw.startswith('/api') or raw == '/health' else '/api' + raw)
    if cand in seen: continue
    # match with wildcard tolerance
    ok = cand in backend
    if not ok:
        # tolerant: compare segment-wise allowing * on either side
        for b in backend:
            bs, cs = b.split('/'), cand.split('/')
            if len(bs) == len(cs) and all(x == y or x == '*' or y == '*' for x, y in zip(bs, cs)):
                ok = True; break
    if not ok:
        misses.append((cand, raw, os.path.relpath(file, FE), line))
        seen.add(cand)

print(f"backend routes: {len(backend)} | frontend paths checked: {len(set(p for p,_,_ in fe_paths))}")
print(f"\n=== {len(misses)} FRONTEND PATHS WITH NO BACKEND MATCH ===")
for cand, raw, file, line in sorted(misses):
    print(f"  {cand:45s}  ({raw})  {file}:{line}")
