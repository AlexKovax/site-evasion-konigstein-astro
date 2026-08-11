#!/usr/bin/env bash
# scripts/setup-book.sh
#
# Installe tout ce qui est nécessaire au pipeline livre PDF/EPUB :
#   - pandoc           (conversion Markdown -> EPUB, et Markdown -> HTML pour le PDF)
#   - weasyprint        (rendu HTML/CSS -> PDF, léger, pas besoin de LaTeX)
#   - polices Cardo / Fira Sans / Lora (depuis @fontsource, copiées vers ~/.local/share/fonts)
#   - dépendances npm du projet
#
# Usage :
#   bash scripts/setup-book.sh
#
# Idempotent : peut être relancé sans risque. Demande sudo pour apt.
set -euo pipefail

cd "$(dirname "$0")/.."

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
info()  { printf "${BOLD}:: $*${NC}\n"; }
ok()    { printf "${GREEN}✓ $*${NC}\n"; }
warn()  { printf "${YELLOW}! $*${NC}\n"; }
die()   { printf "${RED}✗ $*${NC}\n" >&2; exit 1; }

have() { command -v "$1" >/dev/null 2>&1; }

# ------------------------------------------------------------------
# 1. Dépendances système (pandoc + weasyprint)
# ------------------------------------------------------------------
info "Vérification des dépendances système : pandoc, weasyprint"

NEED_APT=0
have pandoc    || NEED_APT=1
have weasyprint || NEED_APT=1

if [[ $NEED_APT -eq 1 ]]; then
  info "Installation de pandoc et weasyprint via apt (sudo requis)…"
  sudo apt-get update
  sudo apt-get install -y pandoc weasyprint
else
  ok "pandoc et weasyprint déjà installés"
fi

have pandoc     || die "pandoc n'est pas installé"
have weasyprint || die "weasyprint n'est pas installé"

ok "pandoc    : $(pandoc --version | head -1)"
ok "weasyprint : $(weasyprint --version | head -1)"

# ------------------------------------------------------------------
# 2. Polices (Cardo, Fira Sans, Lora) depuis @fontsource
# ------------------------------------------------------------------
info "Installation des polices Cardo / Fira Sans / Lora"

FONT_DIR="${HOME}/.local/share/fonts/evasion-konigstein"
mkdir -p "$FONT_DIR"

copy_fonts() {
  local pkg="$1" label="$2"
  local src="node_modules/@fontsource/${pkg}/files"
  if [[ ! -d "$src" ]]; then
    warn "dossier $src introuvable — 'npm install' a-t-il été lancé ?"
    return 0
  fi
  # On copie les .woff2 (préférés par WeasyPrint) et .woff par sécurité.
  # Le 'shopt -s nullglob' évite que le glob non-matché ne passe littéral à cp.
  shopt -s nullglob
  cp -f "$src"/*.woff2 "$FONT_DIR"/ 2>/dev/null
  cp -f "$src"/*.woff  "$FONT_DIR"/ 2>/dev/null
  shopt -u nullglob
  ok "polices ${label} copiées vers ${FONT_DIR}"
}

copy_fonts cardo      "Cardo"
copy_fonts fira-sans  "Fira Sans"
copy_fonts lora       "Lora"

# fc-cache pour enregistrer les polices auprès de fontconfig
if have fc-cache; then
  fc-cache -f "$FONT_DIR" >/dev/null 2>&1
  ok "cache fontconfig actualisé"
else
  warn "fc-cache absent — installer fontconfig pour que WeasyPrint trouve les polices"
fi

# ------------------------------------------------------------------
# 3. Dépendances npm du projet
# ------------------------------------------------------------------
info "Vérification des dépendances npm"
if [[ ! -d node_modules ]]; then
  info "node_modules absent — lancement de 'npm install'…"
  npm install
else
  ok "node_modules présent (npm install déjà fait)"
fi

# ------------------------------------------------------------------
# 4. Récapitulatif
# ------------------------------------------------------------------
info "Récapitulatif"
printf "  pandoc       : %s\n" "$(pandoc --version | head -1)"
printf "  weasyprint   : %s\n" "$(weasyprint --version | head -1)"
printf "  polices      : %s\n" "$FONT_DIR"
printf "  node_modules : %s\n" "$( [ -d node_modules ] && echo 'OK' || echo 'MANQUANT' )"
echo
ok "Setup terminé. Tu peux maintenant lancer :  npm run book:pdf   ou   npm run book:epub"
