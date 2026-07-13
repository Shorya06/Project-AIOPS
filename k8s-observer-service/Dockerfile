FROM maven:3.9.8-eclipse-temurin-17 AS build

WORKDIR /build

COPY . .

RUN mvn clean package -pl k8s-observer-service -am -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /build/k8s-observer-service/target/*.jar app.jar

EXPOSE 8084

ENTRYPOINT ["java","-jar","app.jar"]