# ---- build the WAR ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# ---- run on Jetty 11 (JSP enabled) ----
FROM jetty:11.0.20-jdk17
USER root
# app lives at /SurakshaSetu (the pages call /SurakshaSetu/...); ROOT just redirects there
COPY --from=build /build/target/SurakshaSetu.war /var/lib/jetty/webapps/SurakshaSetu.war
RUN mkdir -p /var/lib/jetty/webapps/ROOT /var/lib/jetty/data \
 && echo '<!doctype html><meta http-equiv="refresh" content="0;url=/SurakshaSetu/index.html"><a href="/SurakshaSetu/index.html">SurakshaSetu</a>' > /var/lib/jetty/webapps/ROOT/index.html
# seed data (officers + admin). Users and complaints are created at run time.
COPY data/officers.json data/admins.json /var/lib/jetty/data/
RUN chown -R jetty:jetty /var/lib/jetty
USER jetty
WORKDIR /var/lib/jetty
RUN java -jar "$JETTY_HOME/start.jar" --approve-all-licenses --add-modules=server,http,deploy,jsp,annotations
# Render provides $PORT
CMD ["sh", "-c", "exec java -jar $JETTY_HOME/start.jar jetty.http.port=${PORT:-8080} jetty.http.host=0.0.0.0"]
