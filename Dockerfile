# Multi-stage build for Spring Boot application
FROM eclipse-temurin:21-jdk-alpine AS build
RUN apk add --no-cache maven
WORKDIR /app

# Layer cache: resolve dependencies from pom only
COPY pom.xml ./
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime: glibc JRE (not Alpine). Alpine/musl can mis-resolve some DB hosts; more importantly,
# java.net.UnknownHostException for *.supabase.co means the hostname is wrong or not in public DNS
# (typo in DB_HOST, old project ref, or paused Supabase project) — fix env to match the dashboard.
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/nestapp-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Prefer IPv4 when both A and AAAA exist (some PaaS lack IPv6 egress).
ENV JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"
ENV JAVA_OPTS="-Xmx512m -Xms256m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
