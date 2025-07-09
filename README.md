Once at root of directory:
docker build -t transcendence . && docker run -p 8081:8080 transcendence

Then open "http://127.0.0.1:8081/" on your web browser.

You can replace 8081 by the port of your choice if it is already taken by another resource. 