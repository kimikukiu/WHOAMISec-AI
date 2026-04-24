#!/bin/bash
# ⚡ ULTIMATE DEPLOY SCRIPT - MULTI-PLATFORM ⚡
# Developed from original Railway script
# Added to all projects per BOSS order

set -e

PROJECT_NAME="$(basename "$PWD")"
LOG_FILE="./deploy.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

success() {
    echo "✅ $1" | tee -a "$LOG_FILE"
}

error() {
    echo "❌ $1" | tee -a "$LOG_FILE"
}

# Default: Deploy to GitHub Pages (FREE, NO CARD)
deploy_github_pages() {
    log "Deploying $PROJECT_NAME to GitHub Pages..."
    
    # Create gh-pages branch
    git checkout --orphan gh-pages 2>/dev/null || git checkout gh-pages 2>/dev/null || true
    
    # Create simple index if none
    if [ ! -f "index.html" ]; then
        cat > index.html <<EOF
<!DOCTYPE html>
<html>
<head><title>$PROJECT_NAME</title></head>
<body>
<h1>$PROJECT_NAME</h1>
<p>Deployed via Ultimate Deploy Script</p>
<hr>
<p>⚡ Powered by Hermes Agent</p>
</body>
</html>
EOF
    fi
    
    git add .
    git commit -m "Deploy to GitHub Pages" || true
    git push origin gh-pages || git push -u origin gh-pages
    
    success "Deployed to GitHub Pages!"
    echo "URL: https://kimikukiu.github.io/$PROJECT_NAME/"
}

# Surge.sh deploy (FREE, NO CARD, needs token)
deploy_surge() {
    log "Deploying $PROJECT_NAME to Surge.sh..."
    
    local domain="${PROJECT_NAME//./-}.surge.sh"
    
    # Build if needed
    if [ -f "package.json" ] && [ ! -d "dist" ]; then
        npm install --legacy-peer-deps 2>&1 | tee -a "$LOG_FILE"
        npm run build 2>&1 | tee -a "$LOG_FILE"
    fi
    
    # Create dist if missing
    if [ ! -d "dist" ]; then
        mkdir -p dist
        cp index.html dist/ 2>/dev/null || cp *.html dist/ 2>/dev/null || true
    fi
    
    # Deploy
    if [ -n "$SURGE_TOKEN" ]; then
        echo "$SURGE_TOKEN" | surge login --token - 2>&1 | tee -a "$LOG_FILE"
        surge deploy --domain "$domain" ./dist --token "$SURGE_TOKEN" 2>&1 | tee -a "$LOG_FILE"
        success "Deployed to https://$domain"
    else
        error "No SURGE_TOKEN set!"
    fi
}

# Main
main() {
    log "========== ULTIMATE DEPLOY: $PROJECT_NAME =========="
    
    case "$1" in
        --surge)
            deploy_surge
            ;;
        --github)
            deploy_github_pages
            ;;
        *)
            # Default: GitHub Pages
            deploy_github_pages
            ;;
    esac
    
    log "========== DEPLOY COMPLETE =========="
}

main "$@"
