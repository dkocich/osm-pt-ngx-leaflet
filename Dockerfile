# Stage 0, based on Node.js, to build and compile Angular
FROM node:12 as node

WORKDIR /code
COPY ./ /code

RUN npm install

# NOTE: build is currently run after installation phase automatically
# ARG env=prod
# RUN npm run ngbuild -- --environment $env

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1.14

COPY --from=node /code/public/ /usr/share/nginx/html

COPY ./nginx-custom.conf /etc/nginx/conf.d/default.conf
