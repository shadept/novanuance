cd client
npm run build
cd ..
./gradlew :server:incrementSemanticVersion --minor
./gradlew :server:build :server:installShadowDist
set-variable -name version -value (./gradlew --quiet :server:printVersion)
docker buildx build --platform linux/arm64 -t shadept/novanuance:$version -t shadept/novanuance:latest --load .
docker push shadept/novanuance:$version
docker push shadept/novanuance:latest
