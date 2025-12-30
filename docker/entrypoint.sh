#!/bin/sh
set -eu

template_path="/usr/share/nginx/html/env-config.template.js"
target_path="/usr/share/nginx/html/env-config.js"

if [ -f "$template_path" ]; then
  envsubst '${VITE_API_URL} ${VITE_USE_MOCK_ADAPTERS} ${VITE_APP_VERSION}' \
    < "$template_path" > "$target_path"
fi
