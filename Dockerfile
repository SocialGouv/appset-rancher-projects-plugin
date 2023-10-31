# renovate: datasource=docker depName=ubuntu versioning=ubuntu
ARG UBUNTU_VERSION=22.04

# renovate: datasource=node depName=node versioning=node
ARG NODE_VERSION=20.1.0

FROM ubuntu:$UBUNTU_VERSION AS base
RUN groupadd -g 1000 ubuntu && useradd -rm -d /home/ubuntu -s /bin/bash -g ubuntu -G sudo -u 1000 ubuntu
ENV HOME=/home/ubuntu
RUN chmod 0777 /home/ubuntu
RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS downloader
RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
  curl \
  && rm -rf /var/lib/apt/lists/*

# FROM downloader AS kubectl
# # renovate: datasource=github-tags depName=kubernetes/kubectl extractVersion=^kubernetes-(?<version>.+)$
# ARG KUBECTL_VERSION=1.27.1
# ENV KUBECTL_VERSION=$KUBECTL_VERSION
# RUN curl --fail -sL https://dl.k8s.io/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl > /usr/local/bin/kubectl \
#   && chmod +x /usr/local/bin/kubectl

FROM downloader AS node-downloader
ARG NODE_VERSION
ARG NODE_PACKAGE=node-v$NODE_VERSION-linux-x64
RUN curl https://nodejs.org/dist/v$NODE_VERSION/$NODE_PACKAGE.tar.gz | tar -xzC /opt/

FROM base AS node
ARG NODE_VERSION
ARG NODE_PACKAGE=node-v$NODE_VERSION-linux-x64
ARG NODE_HOME=/opt/$NODE_PACKAGE
ENV NODE_PATH $NODE_HOME/lib/node_modules
ENV PATH $NODE_HOME/bin:$PATH
RUN mkdir /yarn
RUN chown 1000:1000 /yarn
ENV YARN_CACHE_FOLDER /yarn
COPY --from=node-downloader /opt /opt
RUN npm i -g yarn
USER 1000
WORKDIR /app

FROM node AS program
USER 0
RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
  jq \
  && rm -rf /var/lib/apt/lists/*
USER 1000

# COPY --from=kubectl /usr/local/bin/kubectl /usr/local/bin/kubectl

COPY --chown=1000:1000 yarn.lock .yarnrc.yml .pnp.* ./
COPY --chown=1000:1000 .yarn .yarn

COPY package.json ./
RUN yarn workspaces focus --production

COPY src ./src

CMD ["yarn", "start"]