# This Makefile provides a single 'build' command that:
# 1. Stops and removes all existing containers
# 2. Builds and launches the Transcendence project container

GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Build rule - deletes all existing containers and launches the project
.PHONY: build
build: ## Delete all existing containers and launch the project
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
