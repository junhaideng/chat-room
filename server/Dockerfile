FROM node

COPY . /home/server/

WORKDIR /home/server

RUN npm install --production

EXPOSE 3001

# 运行的是http上的服务
ENTRYPOINT [ "npm", "run", "http"]
