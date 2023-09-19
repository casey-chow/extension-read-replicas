import * as _prisma_client_extension from '@prisma/client/extension';
import { PrismaClient } from '@prisma/client/extension';
import * as _prisma_client_runtime_library from '@prisma/client/runtime/library';

type ConfigureReplicaCallback = (client: PrismaClient) => PrismaClient;

type ReplicasOptions = {
    url: string | string[];
};
declare const readReplicas: (options: ReplicasOptions, configureReplicaClient?: ConfigureReplicaCallback) => (client: any) => _prisma_client_extension.PrismaClientExtends<_prisma_client_runtime_library.InternalArgs<{}, {}, {}, {
    $primary<T>(this: T): Omit<T, "$primary">;
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
}> & _prisma_client_runtime_library.DefaultArgs>;

export { readReplicas };
