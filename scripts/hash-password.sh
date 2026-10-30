#!/usr/bin/env bash
# Buat hash SHA-256 untuk password admin portfolio.
# Pakai:  ./scripts/hash-password.sh "PASSWORD_BARU"
# Lalu ganti konstanta ADMIN_HASH di src/data/store.js.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <password>" >&2
  exit 1
fi

printf %s "$1" | sha256sum | cut -d" " -f1
