FROM node

COPY . /home/client/

WORKDIR /home/client

RUN npm install --production

EXPOSE 3000

# 运行的是http上的服务
ENTRYPOINT [ "npm", "run", "http"]
