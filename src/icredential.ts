export default interface ICredential {
    getAccessKeyId: () => Promise<string>;
    getAccessKeySecret: () => Promise<string>;
    getSecurityToken: () => Promise<string>;
    getType: () => string;
}
