up:
	docker build -t transcendence . && docker run -p 8080:8080 transcendence

down:
	docker stop $$(docker ps -a -q); docker rm $$(docker ps -a -q)

re: down up