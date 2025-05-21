# Marker Tracker Makefile
#
# This Makefile provides convenient commands for working with the Marker Tracker application.
# Run 'make help' to see available commands.

.PHONY: help dev build start lint test test-watch db-migrate db-push db-studio db-seed clean install

# Default port for the application
PORT = 3030

# Colors
BLUE = \033[0;34m
GREEN = \033[0;32m
YELLOW = \033[0;33m
RESET = \033[0m

help: ## Show this help
	@echo "$(BLUE)Marker Tracker Makefile$(RESET)"
	@echo "$(YELLOW)Usage:$(RESET) make [target]"
	@echo ""
	@echo "$(YELLOW)Available targets:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'

dev: ## Start development server
	@echo "$(BLUE)Starting development server on port $(PORT)...$(RESET)"
	npm run dev

build: ## Build for production
	@echo "$(BLUE)Building for production...$(RESET)"
	npm run build

start: ## Start production server
	@echo "$(BLUE)Starting production server on port $(PORT)...$(RESET)"
	npm run start

lint: ## Run linter
	@echo "$(BLUE)Running linter...$(RESET)"
	npm run lint

test: ## Run tests once
	@echo "$(BLUE)Running tests...$(RESET)"
	npm run test

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(RESET)"
	npm run test:watch

db-migrate: ## Run Prisma migrations
	@echo "$(BLUE)Running database migrations...$(RESET)"
	npm run db:migrate

db-push: ## Push schema to database
	@echo "$(BLUE)Pushing schema to database...$(RESET)"
	npm run db:push

db-studio: ## Open Prisma Studio
	@echo "$(BLUE)Opening Prisma Studio...$(RESET)"
	npm run db:studio

db-seed: ## Seed the database
	@echo "$(BLUE)Seeding the database...$(RESET)"
	npm run db:seed

clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	rm -rf .next
	rm -rf node_modules/.cache

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	npm install

setup: install db-push ## Complete setup (install dependencies and set up database)
	@echo "$(GREEN)Setup complete!$(RESET)"
	@echo "Run 'make dev' to start the development server"

.DEFAULT_GOAL := help
