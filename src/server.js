const { exec } = require("child_process");
const util = require("util");

const express = require("express");

const execAsync = util.promisify(exec);

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  const authHeader = req.get("Authorization");
  if (
    authHeader &&
    authHeader.startsWith("Bearer ") &&
    authHeader.split(" ")[1] === process.env.API_TOKEN
  ) {
    next();
    return;
  }

  if (req.query.token === process.env.API_TOKEN) {
    next();
    return;
  }
  
  return res.status(401).json({ error: "Unauthorized" });
});

const singleApplicationMode = process.env.SINGLE_APPLICATION_MODE === "true";

app.use("/api/v1/getparams.execute", async (_req, res) => {
  const { stdout, stderr } = await execAsync("kubectl get namespaces -o json");
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return res.status(500)
  }
  const stoudJson = JSON.parse(stdout);
  const namespaces = stoudJson.items;
  const projects = namespaces
    .filter((namespace)=> namespace.metadata.name.startsWith("ci-"))
    .map(namespace=>{
      return {
        name: namespace.metadata.name,
        projectId: namespace.metadata.annotations?.["field.cattle.io/projectId"],
      }
    })
  const parameters = singleApplicationMode ? [{projects}] : projects;
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
