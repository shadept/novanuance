#!/usr/bin/env bash -e

cd client
npm run build
cd ..
./gradlew :server:incrementSemanticVersion --minor
./gradlew :server:build :server:installShadowDist
VERSION=$(./gradlew --quiet :server:printVersion)
docker buildx build --platform linux/arm64 -t shadept/novanuance:$VERSION -t shadept/novanuance:latest --load .
docker push shadept/novanuance:$VERSION
docker push shadept/novanuance:latest
