// Type definitions for credentials

export as namespace Credential;

export = Credential;

declare class Credential {
    constructor(config: {
        [key: string]: any;
    }, runtime: {
        [key: string]: any;
    });
    getAccessKeyId(): Promise<string>;
    getAccessKeySecret(): Promise<string>;
    getAccessToken(): Promise<string>;
    getSecurityToken(): Promise<string>;
    getBearerToken(): Promise<string>;
}
