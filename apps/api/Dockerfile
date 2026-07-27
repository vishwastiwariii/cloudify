FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install 

EXPOSE 5000

CMD ["pnpm", "--filter", "api", "dev"]