import * as _prisma_client_extension from '@prisma/client/extension';
import { PrismaClient } from '@prisma/client/extension';
import * as _prisma_client_runtime_library from '@prisma/client/runtime/library';

type ConfigureReplicaCallback = (client: PrismaClient) => PrismaClient;

type ReplicasOptions = {
    url: string | string[];
};
declare const readReplicas: (options: ReplicasOptions, configureReplicaClient?: ConfigureReplicaCallback) => (client: any) => _prisma_client_extension.PrismaClientExtends<_prisma_client_runtime_library.InternalArgs<{}, {}, {}, {
    $primary<T extends object>(this: T): Omit<T, "$primary" | "$replicas">;
    $replicas<T_1 extends object>(this: T_1): Omit<T_1, "$primary" | "$replicas">[];
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
}> & _prisma_client_runtime_library.DefaultArgs>;

export { readReplicas };
