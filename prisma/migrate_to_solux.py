#!/usr/bin/env python3
"""
migrate_to_solux.py
Migra dados do schema luvep_* para o schema Solux
via Supabase REST API (service role key).
"""
import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://qngeynazgejtxjszxtxt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ2V5bmF6Z2VqdHhqc3p4dHh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg0MjU4MSwiZXhwIjoyMDg4NDE4NTgxfQ.uV22uZqCruWgiAUw1rHvXm_3n0rrFS_4oAmDiKm2RI0"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def get(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}&limit=1000"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def post(table, data, upsert_col=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = dict(HEADERS)
    if upsert_col:
        headers["Prefer"] = f"resolution=merge-duplicates,return=minimal"
    payload = json.dumps(data).encode()
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def step(msg):
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print('='*60)

# ─── 1. Verificar totais luvep ────────────────────────────────
step("1. Contando dados luvep existentes...")
lm = get("luvep_materials")
ls = get("luvep_services")
lsi = get("luvep_service_items")
print(f"  luvep_materials:     {len(lm)}")
print(f"  luvep_services:      {len(ls)}")
print(f"  luvep_service_items: {len(lsi)}")

# ─── 2. Migrar materials ──────────────────────────────────────
step("2. Migrando materials...")
mat_rows = []
for i, m in enumerate(lm, 1):
    mat_rows.append({
        "sku": f"LVP-{i:05d}",
        "category": m["category"],
        "description": m["description"],
        "unit": m["unit"],
        "cost_price": float(m.get("cost_price") or 0),
        "markup_factor": float(m.get("markup_factor") or 1.40),
        "is_resale": m.get("is_resale") if m.get("is_resale") is not None else True,
    })

status, body = post("materials", mat_rows, upsert_col="description")
print(f"  → Status: {status}")
if status not in (200, 201):
    print(f"  Erro: {body[:300]}")
else:
    print(f"  ✅ {len(mat_rows)} materiais migrados!")

# ─── 3. Migrar services ───────────────────────────────────────
step("3. Migrando services...")
srv_rows = []
for s in ls:
    srv_rows.append({
        "code": s["code"],
        "name": s["name"],
        "executor": s.get("executor") or "Solux",
        "fds": s.get("fds") or 0,
        "mo_value": float(s.get("mo_value") or 0),
        "logistics_value": float(s.get("logistics_value") or 26.25),
        "logistics_sell_value": float(s.get("logistics_sell_value") or 36.75),
        "mo_sell_value": float(s.get("mo_sell_value") or 0),
    })

status, body = post("services", srv_rows, upsert_col="code")
print(f"  → Status: {status}")
if status not in (200, 201):
    print(f"  Erro: {body[:300]}")
else:
    print(f"  ✅ {len(srv_rows)} serviços migrados!")

# ─── 4. Construir lookup maps ─────────────────────────────────
step("4. Construindo mapas de referência...")
new_mats = get("materials")
new_srvs = get("services")

luvep_mat_by_desc = {m["description"]: m["id"] for m in lm}
luvep_srv_by_code = {s["code"]: s["id"] for s in ls}

new_mat_by_desc = {m["description"]: m["id"] for m in new_mats}
new_srv_by_code = {s["code"]: s["id"] for s in new_srvs}

print(f"  Materiais novos mapeados: {len(new_mat_by_desc)}")
print(f"  Serviços novos mapeados: {len(new_srv_by_code)}")

# ─── 5. Migrar service_items ──────────────────────────────────
step("5. Migrando service_items...")
si_rows = []
skipped = 0
for item in lsi:
    old_svc_id = item["service_id"]
    old_mat_id = item["material_id"]

    # Encontra o code do serviço luvep pelo id
    svc_code = next((s["code"] for s in ls if s["id"] == old_svc_id), None)
    # Encontra a description do material luvep pelo id
    mat_desc = next((m["description"] for m in lm if m["id"] == old_mat_id), None)

    if not svc_code or not mat_desc:
        skipped += 1
        continue

    new_svc_id = new_srv_by_code.get(svc_code)
    new_mat_id = new_mat_by_desc.get(mat_desc)

    if not new_svc_id or not new_mat_id:
        skipped += 1
        continue

    si_rows.append({
        "service_id": new_svc_id,
        "material_id": new_mat_id,
        "quantity": float(item["quantity"]),
    })

if si_rows:
    status, body = post("service_items", si_rows, upsert_col="service_id,material_id")
    print(f"  → Status: {status}")
    if status not in (200, 201):
        print(f"  Erro: {body[:300]}")
    else:
        print(f"  ✅ {len(si_rows)} itens migrados! ({skipped} ignorados)")
else:
    print("  ⚠️ Nenhum item para migrar.")

# ─── 6. Verificar resultado final ────────────────────────────
step("6. Verificando resultado final...")
final_mats = get("materials", "select=id")
final_srvs = get("services", "select=id")
final_sis  = get("service_items", "select=id")
print(f"  materials:     {len(final_mats)}")
print(f"  services:      {len(final_srvs)}")
print(f"  service_items: {len(final_sis)}")
print(f"\n  🎉 MIGRAÇÃO CONCLUÍDA!")
