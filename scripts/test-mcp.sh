#!/bin/bash
set -a
source ../.env
set +a

npx -y @modelcontextprotocol/server-postgres "$SUPABASE_CONNECTION_STRING" --test 