# Build stage: dùng Maven + JDK 21 để đóng gói jar
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN chmod +x mvnw
COPY src src
RUN ./mvnw -q package -Dmaven.test.skip=true

# Runtime stage: chỉ JRE 21, nhẹ để chạy
FROM eclipse-temurin:21-jre-alpine
# Giờ Việt Nam cho mọi LocalDateTime (createdAt, paidAt...): cài tzdata rồi ép JVM
RUN apk add --no-cache tzdata
ENV TZ=Asia/Ho_Chi_Minh
ENV JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Ho_Chi_Minh"
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
