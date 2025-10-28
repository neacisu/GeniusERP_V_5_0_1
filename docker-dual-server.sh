#!/bin/bash

# Script master pentru pornire completă GeniusERP Dual-Server
# Pornește:
# - Frontend (Vite) pe port 5000
# - Backend (Express API) pe port 5001
# - PostgreSQL pe port 5433
# - Monitoring Stack (Grafana, Prometheus, Loki, Promtail)
# - Security Stack (Falco, Wazuh - cu profile)

echo "🚀 Pornire GeniusERP - Dual-Server Architecture"
echo "================================================"
echo ""
echo "📦 Servicii principale:"
echo "  • Frontend (Vite):     http://localhost:5000"
echo "  • Backend API:         http://localhost:5001"
echo "  • PostgreSQL:          localhost:5433"
echo ""
echo "📊 Monitoring:"
echo "  • Grafana:             http://localhost:4000"
echo "  • Prometheus:          http://localhost:9090"
echo "  • Loki:                http://localhost:3100"
echo ""
echo "🛡️ Security:"
echo "  • Falco:               Runtime security monitoring"
echo "  • Wazuh:               Use --profile wazuh to enable"
echo ""
echo "🔐 Database Admin:"
echo "  • Adminer:             http://localhost:8080"
echo ""
echo "================================================"
echo ""

# Pornire toate serviciile (fără Wazuh - folosește profile)
docker-compose up -d frontend backend postgres adminer prometheus grafana loki promtail falco

echo ""
echo "✅ GeniusERP Dual-Server pornit cu succes!"
echo ""
echo "📝 Pentru a vedea logs:"
echo "   docker-compose logs -f frontend backend"
echo ""
echo "🛑 Pentru a opri:"
echo "   docker-compose down"
echo ""
echo "🔒 Pentru a activa Wazuh Security Stack:"
echo "   docker-compose --profile wazuh up -d"
echo ""


