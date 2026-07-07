#!/usr/bin/env bash
# Local-rig Cypress batch runner — runs the specs that GitHub Actions CANNOT run.
#
# Groups:
#   --ghost             (default) specs that need FLUXGhost but NO machine
#   --account           specs that need a FLUX ID test account (CYPRESS_username/password)
#   --machine           specs that need a machine on the bench (plus FLUXGhost)
#   --machine-readonly  read-only machine specs — connect / Machine Info / idle Dashboard /
#                       camera preview / network testing. NEVER upload or run a job; safe to run
#                       against a machine you don't want firing. Set machine names via env (below).
#   --swiftray          specs that speak the Swiftray wire protocol on ws://localhost:6611
#   --all               everything above
#
# Machine names are ENV-DRIVEN with NO config defaults — set the ones on your bench:
#   CYPRESS_machineName="beamo (Adam)"    # beam-series / CO2 (bed camera)
#   CYPRESS_adorName="Ador (Cruz)"         # Ador (bed camera + module info)
#   CYPRESS_beamo2Name="beamo II (...)"    # beamo II / newer beam-series (bed camera)
# A slot with no name set is SKIPPED by the read-only specs; the job-capable --machine specs
# fail fast without a name instead of silently driving a default-named machine.
# (Reference office bench: machineName "beamo (Adam)", adorName "Ador (Cruz)".)
# `beamSeriesName` (read by older specs) is aliased to machineName in cypress.config.ts.
#
# FLUXGhost wiring: the compiled Beam Studio app runs FLUXGhost (flux_api) on a
# DYNAMIC port. This script auto-detects it via lsof; override with GHOST_PORT=<port>.
# FLUXGhost's origin allowlist rejects http://localhost:8080 — the runner therefore
# forces baseUrl=http://127.0.0.1:8080. Start the dev server first (pnpm nx run web:start).
#
# Maintenance: when adding a FLUXGhost/machine/account-gated spec, append it to the
# matching list below (auto-discovery by grep is unreliable — many specs reference
# isRunningAtGithub only for per-platform expected values).

set -euo pipefail
cd "$(dirname "$0")/.."

GHOST_SPECS=(
  cypress/e2e/right-panel/svg-pdf-ai.spec.ts
  cypress/e2e/right-panel/svg-laser-layering.spec.ts
  cypress/e2e/top-bar/path-preview-ghost.spec.ts
  cypress/e2e/top-bar/path-preview-toggles.spec.ts
  cypress/e2e/top-bar/dpi-resolution.spec.ts
  cypress/e2e/top-bar/auto-shrink.spec.ts
)

ACCOUNT_SPECS=(
  cypress/e2e/top-bar/flux-id-login.spec.ts
  cypress/e2e/top-bar/my-cloud.spec.ts
)

MACHINE_SPECS=(
  cypress/e2e/canvas/upload-with-machine.spec.ts
  cypress/e2e/machine/connection.spec.ts
  cypress/e2e/right-panel/disassemable.spec.ts
  cypress/e2e/top-bar/machines-ip.spec.ts
  cypress/e2e/top-bar/path-preview.spec.ts
  cypress/e2e/top-bar/device-disconnection.spec.ts
)

# Read-only machine specs: connect to a real machine and query it (Machine Info, idle
# Dashboard, camera preview) WITHOUT ever uploading or running a job. Kept as a separate
# group so a machine can be validated without any risk of it starting work.
MACHINE_READONLY_SPECS=(
  cypress/e2e/machine/connection-timing.spec.ts
  cypress/e2e/machine/machine-info-readonly.spec.ts
  cypress/e2e/machine/dashboard-readonly.spec.ts
  cypress/e2e/machine/camera-preview-readonly.spec.ts
  cypress/e2e/machine/network-testing.spec.ts
)

# Swiftray talks the wire protocol directly on ws://localhost:6611 (fixed port). It does NOT
# need FLUXGhost port detection — only that Swiftray (bundled with the compiled Beam Studio
# app) is listening on 6611.
SWIFTRAY_SPECS=(
  cypress/e2e/machine/swiftray-contract.spec.ts
)

group="ghost"
case "${1:---ghost}" in
  --ghost) group="ghost" ;;
  --account) group="account" ;;
  --machine) group="machine" ;;
  --machine-readonly) group="machine-readonly" ;;
  --swiftray) group="swiftray" ;;
  --all) group="all" ;;
  *) echo "usage: $0 [--ghost|--account|--machine|--machine-readonly|--swiftray|--all]" >&2; exit 2 ;;
esac

# Dev server must be up
if ! curl -sf -o /dev/null -m 5 http://127.0.0.1:8080/; then
  echo "ERROR: web dev server not responding on http://127.0.0.1:8080 — start it with: pnpm nx run web:start" >&2
  exit 1
fi

specs=()
env_args=()

if [[ "$group" == "ghost" || "$group" == "machine" || "$group" == "machine-readonly" || "$group" == "all" ]]; then
  port="${GHOST_PORT:-}"
  if [[ -z "$port" ]]; then
    # flux_api = FLUXGhost bundled with the compiled Beam Studio app
    port=$(lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | awk '/^flux_api/ {sub(".*:", "", $9); print $9; exit}')
  fi
  if [[ -z "$port" ]]; then
    echo "ERROR: no running FLUXGhost found (flux_api process) — launch the compiled Beam Studio app, or set GHOST_PORT=<port>" >&2
    exit 1
  fi
  echo "FLUXGhost port: $port"
  env_args+=("ghostPort=$port")
fi

# Swiftray liveness: fixed port 6611 (no dynamic detection needed). Only the compiled Beam
# Studio app runs Swiftray, so require it to be listening before running the contract specs.
if [[ "$group" == "swiftray" || "$group" == "all" ]]; then
  if ! lsof -nP -iTCP:6611 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "ERROR: Swiftray not listening on ws://localhost:6611 — launch the compiled Beam Studio app (it bundles Swiftray on the fixed port 6611)" >&2
    exit 1
  fi
  echo "Swiftray: listening on ws://localhost:6611"
fi

case "$group" in
  ghost) specs=("${GHOST_SPECS[@]}") ;;
  account) specs=("${ACCOUNT_SPECS[@]}") ;;
  machine) specs=("${MACHINE_SPECS[@]}") ;;
  machine-readonly) specs=("${MACHINE_READONLY_SPECS[@]}") ;;
  swiftray) specs=("${SWIFTRAY_SPECS[@]}") ;;
  all) specs=("${GHOST_SPECS[@]}" "${ACCOUNT_SPECS[@]}" "${MACHINE_SPECS[@]}" "${MACHINE_READONLY_SPECS[@]}" "${SWIFTRAY_SPECS[@]}") ;;
esac

# Skip specs that don't exist yet (lists may lead implementation)
existing=()
for s in "${specs[@]}"; do
  if [[ -f "$s" ]]; then existing+=("$s"); else echo "skip (missing): $s"; fi
done
if [[ ${#existing[@]} -eq 0 ]]; then
  echo "ERROR: no specs to run" >&2
  exit 1
fi

spec_arg=$(IFS=,; echo "${existing[*]}")
env_arg=""
if [[ ${#env_args[@]} -gt 0 ]]; then
  env_arg=$(IFS=,; echo "${env_args[*]}")
fi

echo "Running ${#existing[@]} spec(s) [$group]"
if [[ -n "$env_arg" ]]; then
  npx cypress run --spec "$spec_arg" --env "$env_arg" --config baseUrl=http://127.0.0.1:8080,video=false
else
  npx cypress run --spec "$spec_arg" --config baseUrl=http://127.0.0.1:8080,video=false
fi
