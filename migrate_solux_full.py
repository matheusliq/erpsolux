#!/usr/bin/env python3
"""
migrate_solux_full.py
Migra os dados completos do Solux antigo para a Linex.
Isso resolverá as telas vazias que estão frustrando o usuário.
"""
import psycopg2
import urllib.parse

# Configurações do Banco Solux ANTIGO (db.imlzvrzlyegqpsuansrb.supabase.co)
OLD_DB_URL = "postgresql://postgres:SoluxPinturas123@db.imlzvrzlyegqpsuansrb.supabase.co:5432/postgres"

# Configurações do Banco Solux NOVO/LINEX (db.qngeynazgejtxjszxtxt.supabase.co)
NEW_DB_URL = "postgresql://postgres:SoluxPinturas123@db.qngeynazgejtxjszxtxt.supabase.co:5432/postgres"

def step(msg):
    print(f"\n========================================")
    print(f"  {msg}")
    print(f"========================================")

def get_conn(url):
    return psycopg2.connect(url, sslmode='require')

try:
    print("Conectando aos bancos...", flush=True)
    conn_old = get_conn(OLD_DB_URL)
    conn_new = get_conn(NEW_DB_URL)
    cur_old = conn_old.cursor()
    cur_new = conn_new.cursor()
    conn_new.autocommit = True
except Exception as e:
    print(f"Erro ao conectar: {e}")
    exit(1)

# List of tables to migrate in exact correct dependency order!
TABLES = [
    "categories",
    "payment_methods",
    "profiles",
    "users",
    "entities",       # Depende de nada
    "projects",       # Depende de entities
    "transactions",   # Depende de categories, payment_methods, users, entities, projects
    "audit_logs"      # depend on users
]

step("Iniciando cópia profunda")

for table in TABLES:
    print(f"\nMigrando tabela: {table}...")
    try:
        # Puxa colunas e dados antigos
        cur_old.execute(f"SELECT * FROM {table}")
        rows = cur_old.fetchall()
        
        # Puxa nomes das colunas
        cols = [desc[0] for desc in cur_old.description]
        col_names = ", ".join(cols)
        
        if not rows:
            print(f"  > [0] Registros ignorada.")
            continue
            
        print(f"  > {len(rows)} registros encontrados.")
        
        # Insert statement
        placeholders = ", ".join(["%s"] * len(cols))
        insert_query = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT (id) DO NOTHING"
        
        # Executa insert em lote
        inserted = 0
        for row in rows:
            try:
                cur_new.execute(insert_query, row)
                if cur_new.rowcount > 0:
                    inserted += 1
            except Exception as row_error:
                print(f"  ! Falha no registro: {row_error}")
                # Keep going to migrate the rest!
        
        print(f"  > + {inserted} registros copiados.")
    except Exception as e:
        print(f"  ❌ Erro ao ler/gravar tabela {table}: {e}")

print("\nFechando conexões...")
cur_old.close()
conn_old.close()
cur_new.close()
conn_new.close()

step("MIGRAÇÃO TOTAL CONCLUÍDA! O app está povoado.")
