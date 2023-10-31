# applicationset-ci-rancher-projects-plugin

## Purpose

This Argo CD ApplicationSet generator plugin aims to dynamically create Argo CD Applications based on the list of Rancher projects into a list of clusters. This ensures a streamlined and automated process of managing Argo CD Applications corresponding to different Rancher projects for each cluster.

see https://github.com/argoproj-labs/applicationset-hello-plugin/

## Dev

```
cp .env.sample .env
```
Set RANCHER_TOKEN and RANCHER_SERVER in .env


To test locally

```
yarn
yarn dev
```

To test locally in docker

```sh
docker compose up --build
```

Then go to http://localhost:3000/api/v1/getparams.execute?token=1234