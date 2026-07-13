# ---------- Build Stage ----------
FROM maven:3.9.8-eclipse-temurin-17 AS build

WORKDIR /build

# Copy the entire repository
COPY . .

# Build only the gateway service and its dependencies
RUN mvn -pl gateway-service -am clean package -DskipTests

# ---------- Runtime Stage ----------
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /build/gateway-service/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar","--spring.profiles.active=docker"]