#FROM arm64v8/gradle:7-jdk11 AS build
#COPY --chown=gradle:gradle . /home/gradle/src
#WORKDIR /home/gradle/src
#RUN gradle installShadowDist --no-daemon

FROM arm64v8/openjdk:11-jre
RUN mkdir /app
#COPY --from=build /home/gradle/src/server/build/install/server-shadow-lib/server-all.jar /app/server.jar
ADD server/build/install/server-shadow/lib/server-*-all.jar /app/server.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/server.jar"]
