# Multi-stage build for Spring Boot application
FROM eclipse-temurin:21-jdk-alpine AS build
RUN apk add --no-cache maven
WORKDIR /app

# Layer cache: resolve dependencies from pom only
COPY pom.xml ./
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/nestapp-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Render often has no IPv6 route; Supabase DNS may return IPv6 first → "Network unreachable".
# JAVA_TOOL_OPTIONS still applies if the platform overrides JAVA_OPTS.
ENV JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"
ENV JAVA_OPTS="-Xmx512m -Xms256m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
