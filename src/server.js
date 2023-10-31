const express = require("express");
const axios = require("axios");
require("dotenv").config();

const RANCHER_SERVER = process.env.RANCHER_SERVER;
const RANCHER_TOKEN = process.env.RANCHER_TOKEN;
const API_TOKEN = process.env.API_TOKEN;

if(!RANCHER_SERVER){
  throw new Error(`missing required env var RANCHER_SERVER`);
}
if (!RANCHER_TOKEN) {
  throw new Error(`missing required env var RANCHER_TOKEN`);
}
if (!API_TOKEN) {
  throw new Error(`missing required env var API_TOKEN`);
}

const clusterCache = {};
const getClusterName = async (clusterId) => {
  if (clusterCache[clusterId]) {
    return clusterCache[clusterId];
  }
  const response = await axios.get(
    `${RANCHER_SERVER}/v3/clusters/${clusterId}`,
    {
      headers: { Authorization: `Bearer ${RANCHER_TOKEN}` },
    }
  );
  const clusterName = response.data.name;
  clusterCache[clusterId] = clusterName;
  return clusterName;
};

const excludeProjects = ["Default","System"]
const listProjectsByClusters = async () => {
  const response = await axios.get(`${RANCHER_SERVER}/v3/projects`, {
    headers: { Authorization: `Bearer ${RANCHER_TOKEN}` },
  });
  
  const clusters = {}
  for (const project of response.data.data) {
    if(excludeProjects.includes(project.name)){
      continue
    }
    const clusterName = await getClusterName(project.clusterId);
    if (!clusters[clusterName]){
      clusters[clusterName] = []
    }
    clusters[clusterName].push({
      projectName: project.name,
      projectId: project.id,
    })
  }
  const clusterList = Object.keys(clusters).map((cluster) => {
    return {
      cluster,
      projects: clusters[cluster],
    };
  });
  return clusterList;
};

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  const authHeader = req.get("Authorization");
  if (
    authHeader &&
    authHeader.startsWith("Bearer ") &&
    authHeader.split(" ")[1] === API_TOKEN
  ) {
    next();
    return;
  }

  if (req.query.token === API_TOKEN) {
    next();
    return;
  }
  
  return res.status(401).json({ error: "Unauthorized" });
});

app.use("/api/v1/getparams.execute", async (_req, res) => {
  
  let parameters
  try {
    parameters = await listProjectsByClusters();
  } catch(err) {
    console.error(`Error`, err);
    return res.status(500);
  }

  const responseObject = {
    output: {
      parameters,
    },
  };
  res.json(responseObject);
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
