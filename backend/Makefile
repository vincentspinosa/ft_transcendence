.PHONY: help install build start dev watch clean certs docker-build docker-run

help: ## Show this help message
	@echo "Transcendence Backend - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	npm install

build: ## Build the TypeScript backend
	@echo "🔨 Building backend..."
	npm run build

start: ## Start the production server
	@echo "🚀 Starting production server..."
	npm start

dev: ## Start development server with auto-reload
	@echo "🔄 Starting development server..."
	npm run dev

watch: ## Start development server with file watching
	@echo "👀 Starting development server with file watching..."
	npm run watch

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/

certs: ## Generate SSL certificates
	@echo "🔐 Generating SSL certificates..."
	./generate-certs.sh

docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker build -t transcendence-backend .

docker-run: ## Run Docker container
	@echo "🐳 Running Docker container..."
	docker run -p 3000:3000 -v $(PWD)/certs:/app/certs:ro transcendence-backend

setup: certs install build ## Complete setup: generate certs, install deps, and build
	@echo "✅ Setup complete! Run 'make start' to start the server."
