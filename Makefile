.PHONY: up down

up: down
	docker build -t transcendence . && docker run -p 8080:8080 transcendence

down:
	@if [ -n "$$(docker ps -a -q)" ]; then \
		docker stop $$(docker ps -a -q); \
		docker rm $$(docker ps -a -q); \
	else \
		echo "No Docker containers to stop or remove."; \
	fi