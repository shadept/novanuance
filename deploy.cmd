npx prisma generate
npm run build
docker buildx build --platform linux/arm64 --platform linux/amd64 --push -t shadept/novanuance:latest -t shadept/novanuance:1.3.3 .
@rem docker run -it --rm -e DATABASE_URL=postgres://shade:Blac0po1n@192.168.1.200:5432/novanuance -p 3000:3000 shadept/novanuance:1.3.3
