export type RequestDetails = {
    requestId: string | string[] | undefined,
    method: string,
    endpoint: string,
    timestamp: string,
    params?: Record<string, any>,
    query?: Record<string, any>
    requestBody?: any,
    userAgent?: any,
};