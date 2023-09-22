"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  readReplicas: () => readReplicas
});
module.exports = __toCommonJS(src_exports);

// src/extension.ts
var import_extension = require("@prisma/client/extension.js");

// src/ReplicaManager.ts
var ReplicaManager = class {
  constructor({ replicaUrls, clientConstructor, configureCallback }) {
    this.replicaClients = replicaUrls.map((datasourceUrl) => {
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
    await Promise.all(this.replicaClients.map((client) => client.$connect()));
  }
  async disconnectAll() {
    await Promise.all(this.replicaClients.map((client) => client.$disconnect()));
  }
  pickReplica() {
    return this.replicaClients[Math.floor(Math.random() * this.replicaClients.length)];
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
  "$queryRaw",
  "$queryRawUnsafe",
  "$findRaw",
  "$aggregateRaw"
];
var readReplicas = (options, configureReplicaClient) => import_extension.Prisma.defineExtension((client) => {
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
        const context = import_extension.Prisma.getExtensionContext(this);
        if (!("$transaction" in context && typeof context.$transaction === "function")) {
          return context;
        }
        return client;
      },
      $replicas() {
        const context = import_extension.Prisma.getExtensionContext(this);
        if (!("$transaction" in context && typeof context.$transaction === "function")) {
          throw new Error(`Cannot retrieve replicas when in a transaction`);
        }
        return replicaManager.replicaClients;
      },
      async $connect() {
        await Promise.all([client.$connect(), replicaManager.connectAll()]);
      },
      async $disconnect() {
        await Promise.all([client.$disconnect(), replicaManager.disconnectAll()]);
      }
    },
    query: {
      async $allOperations({
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
          const replica = replicaManager.pickReplica();
          if (model) {
            return replica[model][operation](args);
          }
          if (operation === "$queryRaw") {
            const rows = await replica[operation](args);
            rows.forEach((row) => {
              Object.keys(row).forEach((key) => {
                row[key] = {
                  prisma__type: void 0,
                  prisma__value: row[key]
                };
              });
            });
            return rows;
          } else if (operation === "$queryRawUnsafe") {
            const rows = await replica[operation](...args);
            rows.forEach((row) => {
              Object.keys(row).forEach((key) => {
                row[key] = {
                  prisma__type: void 0,
                  prisma__value: row[key]
                };
              });
            });
            return rows;
          }
          return replica[operation](args);
        }
        return query(args);
      }
    }
  });
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  readReplicas
});
