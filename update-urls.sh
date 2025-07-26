#!/bin/bash

# Script per aggiornare tutti i riferimenti al vecchio progetto Vercel
# con il nuovo URL: https://nutra-backup.vercel.app

echo "🔄 Aggiornamento URL del progetto in corso..."

# Definisci i pattern da sostituire
OLD_PATTERNS=(
    "nutragenix-fatture.vercel.app"
    "nutragenix-fatture-qlzulkde3-gabrieledellacroce-2606s-projects.vercel.app"
    "nutragenix-fatture-g6cq2h27e-gabrieledellacroce-2606s-projects.vercel.app"
    "nutragenix-fatture-p0c1lgody-gabrieledellacroce-2606s-projects.vercel.app"
    "nutragenix-fatture-qjnb5ou0n-gabrieledellacroce-2606s-projects.vercel.app"
    "nutragenix-fatture-ivyfut6py-gabrieledellacroce-2606s-projects.vercel.app"
    "nutragenix-fatture-jteinma5n-gabrieledellacroce-2606s-projects.vercel.app"
)

NEW_URL="nutra-backup.vercel.app"

# File da escludere dall'aggiornamento
EXCLUDE_FILES=(
    "update-urls.sh"
    "node_modules"
    ".git"
    "package-lock.json"
)

# Funzione per verificare se un file deve essere escluso
should_exclude() {
    local file="$1"
    for exclude in "${EXCLUDE_FILES[@]}"; do
        if [[ "$file" == *"$exclude"* ]]; then
            return 0
        fi
    done
    return 1
}

# Conta i file aggiornati
updated_count=0

# Trova e aggiorna tutti i file
for pattern in "${OLD_PATTERNS[@]}"; do
    echo "🔍 Cercando pattern: $pattern"
    
    # Trova tutti i file che contengono il pattern
    while IFS= read -r -d '' file; do
        if should_exclude "$file"; then
            continue
        fi
        
        echo "  📝 Aggiornando: $file"
        sed -i '' "s|$pattern|$NEW_URL|g" "$file"
        ((updated_count++))
        
    done < <(grep -rl "$pattern" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | tr '\n' '\0')
done

echo ""
echo "✅ Aggiornamento completato!"
echo "📊 File aggiornati: $updated_count"
echo "🌐 Nuovo URL: https://$NEW_URL"
echo ""
echo "🔍 Per verificare che non ci siano più riferimenti al vecchio progetto:"
echo "   grep -r 'nutragenix-fatture' . --exclude-dir=node_modules --exclude-dir=.git"