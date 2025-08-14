.PHONY: help install build watch start clean docker-build docker-run up down

help: ## Show this help message
	@echo "Transcendence Frontend - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install frontend dependencies
	@echo "📦 Installing frontend dependencies..."
	npm install

build: ## Build the frontend for production
	@echo "🔨 Building frontend for production..."
	npm run build

watch: ## Start development with file watching
	@echo "👀 Starting development with file watching..."
	npm run watch

start: ## Build and start with live-server
	@echo "🚀 Building and starting frontend..."
	npm start

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/

docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker build -t transcendence-frontend .

docker-run: ## Run Docker container
	@echo "🐳 Running Docker container..."
	docker run -p 8080:8080 transcendence-frontend

up: down ## Start Docker container (stops existing first)
	@echo "🚀 Starting Docker container..."
	docker build -t transcendence-frontend . && docker run -p 8080:8080 transcendence-frontend

down: ## Stop and remove Docker containers
	@echo "🛑 Stopping Docker containers..."
	@if [ -n "$$(docker ps -a -q)" ]; then \
		docker stop $$(docker ps -a -q); \
		docker rm $$(docker ps -a -q); \
	else \
		echo "No Docker containers to stop or remove."; \
	fi

setup: install build ## Complete setup: install deps and build
	@echo "✅ Frontend setup complete!"