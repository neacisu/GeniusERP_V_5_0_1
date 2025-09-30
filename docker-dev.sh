#!/bin/bash

# Script pentru gestionarea mediului de dezvoltare Docker pentru GeniusERP

show_help() {
    echo "Utilizare: ./docker-dev.sh [COMANDĂ]"
    echo ""
    echo "Comenzi disponibile:"
    echo "  start      - Pornește toate containerele în modul detached"
    echo "  stop       - Oprește toate containerele"
    echo "  restart    - Repornește toate containerele"
    echo "  logs       - Arată logurile aplicației în timp real (Ctrl+C pentru a ieși)"
    echo "  ps         - Arată statusul containerelor"
    echo "  exec       - Intră în shell-ul containerului aplicației"
    echo "  npm [cmd]  - Rulează o comandă npm în containerul aplicației"
    echo "  migrate    - Rulează migrările bazei de date"
    echo "  build      - Reconstruiește containerul aplicației"
    echo "  rebuild    - Reconstruiește complet toate containerele (atenție: șterge datele din volumes)"
    echo "  help       - Arată acest mesaj de ajutor"
}

case "$1" in
    start)
        echo "Pornesc containerele Docker pentru GeniusERP..."
        docker-compose up -d
        echo "Containerele rulează acum în background. Pentru a vedea logurile folosiți: ./docker-dev.sh logs"
        ;;
    stop)
        echo "Opresc containerele..."
        docker-compose down
        ;;
    restart)
        echo "Repornesc containerele..."
        docker-compose restart
        ;;
    logs)
        echo "Arăt logurile în timp real (Ctrl+C pentru a ieși)..."
        docker-compose logs -f app
        ;;
    ps)
        echo "Statusul containerelor:"
        docker-compose ps
        ;;
    exec)
        echo "Intru în shell-ul containerului aplicației..."
        docker-compose exec app sh
        ;;
    npm)
        if [ -z "$2" ]; then
            echo "Specificați comanda npm pe care doriți să o rulați, de exemplu: ./docker-dev.sh npm install"
        else
            echo "Rulez comanda npm $2 în container..."
            shift # Eliminăm primul argument (npm)
            docker-compose exec app npm "$@"
        fi
        ;;
    migrate)
        echo "Rulez migrările bazei de date..."
        docker-compose exec app npm run db:push
        ;;
    build)
        echo "Reconstruiesc containerul aplicației..."
        docker-compose build app
        docker-compose up -d app
        ;;
    rebuild)
        echo "ATENȚIE: Această comandă va reconstrui toate containerele și va șterge datele existente!"
        read -p "Continuați? (y/n): " confirmation
        if [ "$confirmation" = "y" ]; then
            echo "Reconstruiesc toate containerele..."
            docker-compose down -v
            docker-compose build
            docker-compose up -d
        else
            echo "Operațiune anulată."
        fi
        ;;
    help|*)
        show_help
        ;;
esac