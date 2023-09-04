import CredentialModel from "./credential_model";
export default interface ICredential {
    getAccessKeyId: () => Promise<string>;
    getAccessKeySecret: () => Promise<string>;
    getSecurityToken: () => Promise<string>;
    getBearerToken: () => string;
    getType: () => string;
    getCredential: ()=> Promise<CredentialModel>
}
