import { PrismaClient } from '@prisma/client/extension'

type PrismaConstructorOptions = {
  datasourceUrl?: string
}

export type ConfigureReplicaCallback = (client: PrismaClient) => PrismaClient
interface PrismaClientConstructor {
  new (options?: PrismaConstructorOptions): PrismaClient
}

type ReplicaManagerOptions = {
  clientConstructor: PrismaClientConstructor
  replicaUrls: string[]
  configureCallback: ConfigureReplicaCallback | undefined
}

export class ReplicaManager {
  public readonly replicaClients: PrismaClient[]

  constructor({ replicaUrls, clientConstructor, configureCallback }: ReplicaManagerOptions) {
    this.replicaClients = replicaUrls.map((datasourceUrl) => {
      const client = new clientConstructor({
        datasourceUrl,
      })

      if (configureCallback) {
        return configureCallback(client)
      }
      return client
    })
  }

  async connectAll() {
    await Promise.all(this.replicaClients.map((client) => client.$connect()))
  }

  async disconnectAll() {
    await Promise.all(this.replicaClients.map((client) => client.$disconnect()))
  }

  pickReplica(): PrismaClient {
    return this.replicaClients[Math.floor(Math.random() * this.replicaClients.length)]
  }
}
