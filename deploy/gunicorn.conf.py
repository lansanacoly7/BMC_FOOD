"""Configuration Gunicorn pour l'API BMC FOOD (Dimensionnement VPS 2 vCPU)."""
import os

bind = os.environ.get("GUNICORN_BIND", "127.0.0.1:8000")

# Règle Gunicorn (2 * vCPU + 1) : 5 workers sync pour un serveur 2 vCPU.
workers = int(os.environ.get("GUNICORN_WORKERS", "5"))
worker_class = "sync"

# Délais adaptés aux pics réseau et aux requêtes PostgreSQL
timeout = 60
graceful_timeout = 30
keepalive = 5

# Recyclage préventif des workers pour limiter la fragmentation mémoire
max_requests = 1000
max_requests_jitter = 100

# Journaux envoyés sur stdout/stderr pour capture directe par systemd / journald
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(D)sus'
