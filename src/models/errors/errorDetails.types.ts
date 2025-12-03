export type PrismaErrorDetails = {
    prismaClientErrType: any;
    errorMessage: string;
    clientVersion: string;
    prismaCode?: string | undefined;
    meta?: any;
};

export type RedisErrorDetails = {
    name: string,
    message: string,
    stack?: string,
    code?: string,
    command?: { cmd: string, args?: any[] } | undefined,
    conn?: { adress?: string, port?: number } | undefined,
    parseContext?: { buffer?: string, offset?: number }
};