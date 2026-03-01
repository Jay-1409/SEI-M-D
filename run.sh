#!/usr/bin/env bash

# ==========================================
# Secure Microservice Deployer — One-Command Launcher
# 
# Usage:  ./run.sh          (build + deploy + stream logs)
#         ./run.sh --stop    (graceful shutdown)
#
# This is the single command to run the entire application.
# Equivalent to 'docker compose up' but uses Kubernetes.
# Press Ctrl+C for graceful shutdown.
# ==========================================

# No 'set -e' — we want the script to keep running even if a command fails

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
DIM='\033[2m'
NC='\033[0m'

NAMESPACE="deployer-system"
LOG_PIDS=()

# ── Graceful shutdown on Ctrl+C ──
cleanup() {
    echo ""
    echo ""
    echo -e "${YELLOW}⏻  Shutting down gracefully...${NC}"
    echo ""

    # Kill all background log processes
    for pid in "${LOG_PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done

    # Scale all platform deployments to 0
    echo -e "  ${DIM}Scaling down platform services...${NC}"
    kubectl scale deployment --all -n $NAMESPACE --replicas=0 2>/dev/null || true

    # Scale down user services too
    echo -e "  ${DIM}Scaling down user services...${NC}"
    kubectl scale deployment --all -n user-services --replicas=0 2>/dev/null || true

    # Wait for pods to terminate
    echo -e "  ${DIM}Waiting for pods to terminate...${NC}"
    kubectl wait --for=delete pod --all -n $NAMESPACE --timeout=30s 2>/dev/null || true

    echo ""
    echo -e "${GREEN}✓${NC} All services stopped. Goodbye!"
    echo ""
    exit 0
}

trap cleanup SIGINT SIGTERM

# ── Handle --stop flag ──
if [[ "$1" == "--stop" ]]; then
    cleanup
fi

# ── Preflight checks ──
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Secure Microservice Deployer            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# Kill any leftover Docker Compose containers from previous runs
for c in smd-frontend smd-backend smd-gateway smd-redis smd-nikto-service smd-image-service; do
    docker rm -f "$c" 2>/dev/null || true
done

for cmd in kubectl docker; do
    if ! command -v $cmd &>/dev/null; then
        echo -e "${RED}✗ $cmd not found. Please install it first.${NC}"
        exit 1
    fi
done

if ! kubectl cluster-info &>/dev/null 2>&1; then
    echo -e "${RED}✗ Kubernetes cluster is not running.${NC}"
    echo -e "  Start it with: ${YELLOW}minikube start${NC} or ${YELLOW}Docker Desktop > Enable Kubernetes${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Kubernetes cluster ready"
echo ""

# ── Step 1: Build Docker images ──
echo -e "${BLUE}[1/3] Building Docker images...${NC}"

docker build -t deployer-backend:latest   ./backend/deployer -q &
PID1=$!
docker build -t deployer-gateway:latest   ./backend/gateway   -q &
PID2=$!
docker build -t image-service:latest      ./backend/image     -q &
PID3=$!
docker build -t nikto-service:latest      ./backend/nikto     -q &
PID4=$!
docker build -t deployer-frontend:latest  ./frontend           -q &
PID5=$!

# Wait for all builds (parallel)
FAILED=0
for pid in $PID1 $PID2 $PID3 $PID4 $PID5; do
    wait $pid || FAILED=1
done

if [ $FAILED -eq 1 ]; then
    echo -e "${RED}✗ Image build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} All images built"
echo ""

# ── Step 2: Apply K8s manifests ──
echo -e "${BLUE}[2/3] Applying Kubernetes manifests...${NC}"

kubectl apply -f k8s/namespace.yaml     -o name 2>&1 | sed 's/^/  /'
kubectl apply -f k8s/user-namespace.yaml -o name 2>&1 | sed 's/^/  /'
kubectl apply -f k8s/rbac.yaml          -o name 2>&1 | sed 's/^/  /'
kubectl apply -f k8s/redis.yaml         -o name 2>&1 | sed 's/^/  /'
kubectl apply -f k8s/backend.yaml       -o name 2>&1 | sed 's/^/  /'
kubectl apply -f k8s/image-service.yaml -o name 2>&1 | sed 's/^/  /'
kubectl apply -f k8s/nikto-service.yaml -o name 2>&1 | sed 's/^/  /'
kubectl apply -f k8s/gateway.yaml       -o name 2>&1 | sed 's/^/  /'
kubectl apply -f k8s/frontend.yaml      -o name 2>&1 | sed 's/^/  /'

# Force restart to pick up new images
kubectl rollout restart deployment --all -n $NAMESPACE >/dev/null 2>&1

echo ""
echo -e "${GREEN}✓${NC} Manifests applied & rollout triggered"
echo ""

# ── Step 3: Wait for pods ──
echo -e "${BLUE}[3/3] Waiting for pods to be ready...${NC}"
echo ""

DEPLOYMENTS=(redis backend image-service nikto-service gateway frontend)
for dep in "${DEPLOYMENTS[@]}"; do
    echo -ne "  ${DIM}Waiting: ${dep}...${NC}"
    if kubectl rollout status deployment/$dep -n $NAMESPACE --timeout=90s >/dev/null 2>&1; then
        echo -e "\r  ${GREEN}✓${NC} ${dep}                    "
    else
        echo -e "\r  ${RED}✗${NC} ${dep} (timed out)         "
    fi
done

echo ""

# ── Show access URLs ──
if command -v minikube &>/dev/null && minikube status &>/dev/null 2>&1; then
    IP=$(minikube ip)
else
    IP="localhost"
fi

echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ${GREEN}Application is running!${CYAN}                 ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  Frontend:  ${YELLOW}http://${IP}:30000${NC}         ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  Gateway:   ${YELLOW}http://${IP}:30080${NC}         ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${DIM}Streaming logs... Press ${WHITE}Ctrl+C${DIM} to gracefully shut down${NC}"
echo -e "${DIM}─────────────────────────────────────────────────────${NC}"
echo ""

# ── Stream logs from each service with color-coded prefixes ──
# Each service gets its own color, just like docker compose
# Uses a retry loop so if a pod restarts, the logs reconnect automatically

stream_logs() {
    local label="$1" prefix="$2" color="$3"
    while true; do
        kubectl logs -f -l app="$label" -n $NAMESPACE --all-containers --tail=50 2>/dev/null | \
            sed "s/^/$(printf "$color")[$prefix]$(printf "${NC}") /"
        sleep 2
    done
}

stream_logs backend  "backend" "${BLUE}"   &
LOG_PIDS+=($!)
stream_logs gateway  "gateway" "${GREEN}"  &
LOG_PIDS+=($!)
stream_logs image-service "image  " "${MAGENTA}" &
LOG_PIDS+=($!)
stream_logs nikto-service "nikto  " "${YELLOW}"  &
LOG_PIDS+=($!)

# Wait forever (until Ctrl+C triggers cleanup)
while true; do
    sleep 1
done
