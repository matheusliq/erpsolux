
import psycopg2
import json

conn_str = "postgresql://postgres.qngeynazgejtxjszxtxt:G%40laxyyace134679@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    cur.execute("SELECT id, name FROM projects;")
    projects = cur.fetchall()
    print("PROJECTS:", projects)
    
    cur.execute("SELECT id, name FROM entities;")
    entities = cur.fetchall()
    print("ENTITIES:", entities)
    
    cur.close()
    conn.close()
except Exception as e:
    print("ERROR:", e)
