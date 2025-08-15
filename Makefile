# This Makefile provides a single 'build' command that:
# 1. Installs frontend dependencies
# 2. Builds the frontend
# 3. Stops and removes all existing containers
# 4. Builds and launches the Transcendence project container

GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Build rule - installs dependencies, builds frontend, deletes all existing containers and launches the project
.PHONY: build
build: ## Install dependencies, build frontend, delete all existing containers and launch the project
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	@cd frontend && npm install
	@echo "$(GREEN)Frontend dependencies installed!$(NC)"
	@echo ""
	@echo "$(GREEN)Building frontend...$(NC)"
	@cd frontend && npm run build
	@echo "$(GREEN)Frontend built successfully!$(NC)"
	@echo ""
	@echo "$(GREEN)Stopping and removing all existing containers...$(NC)"
	@docker stop $$(docker ps -aq) 2>/dev/null || true
	@docker rm $$(docker ps -aq) 2>/dev/null || true
	@echo "$(GREEN)All containers removed.$(NC)"
	@echo ""
	@echo "$(GREEN)Building and launching Transcendence project...$(NC)"
	@docker-compose -f docker-compose.yml up --build -d
	@echo "$(GREEN)Project launched successfully!$(NC)"
	@echo "$(YELLOW)Access your application at: https://localhost:3000$(NC)"
	@echo "$(YELLOW)Health check: https://localhost:3000/health$(NC)"
