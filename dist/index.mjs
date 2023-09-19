// src/extension.ts
import { Prisma } from "@prisma/client/extension.js";

// src/ReplicaManager.ts
var ReplicaManager = class {
  constructor({ replicaUrls, clientConstructor, configureCallback }) {
    this._replicaClients = replicaUrls.map((datasourceUrl) => {
      const client = new clientConstructor({
        datasourceUrl
      });
      if (configureCallback) {
        return configureCallback(client);
      }
      return client;
    });
  }
  async connectAll() {
    await Promise.all(this._replicaClients.map((client) => client.$connect()));
  }
  async disconnectAll() {
    await Promise.all(this._replicaClients.map((client) => client.$disconnect()));
  }
  pickReplica() {
    return this._replicaClients[Math.floor(Math.random() * this._replicaClients.length)];
  }
};

// src/extension.ts
var readOperations = [
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "groupBy",
  "aggregate",
  "count",
  "queryRaw",
  "queryRawUnsafe",
  "findRaw",
  "aggregateRaw"
];
var readReplicas = (options, configureReplicaClient) => Prisma.defineExtension((client) => {
  const PrismaClient = Object.getPrototypeOf(client).constructor;
  const datasourceName = Object.keys(options).find((key) => !key.startsWith("$"));
  if (!datasourceName) {
    throw new Error(`Read replicas options must specify a datasource`);
  }
  let replicaUrls = options.url;
  if (typeof replicaUrls === "string") {
    replicaUrls = [replicaUrls];
  } else if (!Array.isArray(replicaUrls)) {
    throw new Error(`Replica URLs must be a string or list of strings`);
  }
  const replicaManager = new ReplicaManager({
    replicaUrls,
    clientConstructor: PrismaClient,
    configureCallback: configureReplicaClient
  });
  return client.$extends({
    client: {
      $primary() {
        return client;
      },
      async $connect() {
        await Promise.all([client.$connect(), replicaManager.connectAll()]);
      },
      async $disconnect() {
        await Promise.all([client.$disconnect(), replicaManager.disconnectAll()]);
      }
    },
    query: {
      $allOperations({
        args,
        model,
        operation,
        query,
        // @ts-expect-error
        __internalParams: { transaction }
      }) {
        if (transaction) {
          return query(args);
        }
        if (readOperations.includes(operation)) {
          const replica = replicaManager.pickReplica() ?? client;
          if (model) {
            return replica[model][operation](args);
          }
          return replica[operation](args);
        }
        return query(args);
      }
    }
  });
});
export {
  readReplicas
};
