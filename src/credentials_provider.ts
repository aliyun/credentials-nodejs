import Credentials from './credentials';

export default interface CredentialsProvider {
    getCredentials: () => Promise<Credentials>
    getProviderName: () => string
}
