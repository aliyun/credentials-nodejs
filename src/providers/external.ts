import { execFile } from 'child_process';
import { promisify } from 'util';
import Credentials from '../credentials';
import CredentialsProvider from '../credentials_provider';
import { splitProcessCommand } from '../utils/command';

const execFileAsync = promisify(execFile);
const EXPIRATION_SLOT_SECONDS = 180;

export type ExternalCredentialUpdateCallback = (
  accessKeyId: string, accessKeySecret: string, securityToken: string, expiration: number
) => Promise<void> | void;

class ExternalCredentialsProviderBuilder {
  processCommand: string;
  timeout?: number;
  credentialUpdateCallback?: ExternalCredentialUpdateCallback;

  withProcessCommand(processCommand: string) {
    this.processCommand = processCommand;
    return this;
  }

  withTimeout(timeout: number) {
    this.timeout = timeout;
    return this;
  }

  withCredentialUpdateCallback(callback: ExternalCredentialUpdateCallback) {
    this.credentialUpdateCallback = callback;
    return this;
  }

  build(): ExternalCredentialsProvider {
    if (!this.processCommand) {
      throw new Error('process_command is empty');
    }
    return new ExternalCredentialsProvider(this);
  }
}

interface ExternalCredentialResponse {
  mode?: string;
  access_key_id?: string;
  access_key_secret?: string;
  sts_token?: string;
  expiration?: string;
}

export default class ExternalCredentialsProvider implements CredentialsProvider {
  private readonly processCommand: string;
  private readonly timeout: number;
  private readonly credentialUpdateCallback?: ExternalCredentialUpdateCallback;
  private session?: ExternalCredentialResponse;
  private expirationTimestamp: number = 0;

  static builder() {
    return new ExternalCredentialsProviderBuilder();
  }

  constructor(builder: ExternalCredentialsProviderBuilder) {
    this.processCommand = builder.processCommand;
    this.timeout = builder.timeout || 60 * 1000;
    this.credentialUpdateCallback = builder.credentialUpdateCallback;
  }

  getProviderName(): string {
    return 'external';
  }

  private needUpdateCredential(): boolean {
    if (!this.session) {
      return true;
    }
    if (!this.expirationTimestamp) {
      return true;
    }
    return this.expirationTimestamp - Math.floor(Date.now() / 1000) <= EXPIRATION_SLOT_SECONDS;
  }

  private async getCredentialsInternal(): Promise<ExternalCredentialResponse> {
    const args = splitProcessCommand(this.processCommand);

    let stdout: string;
    try {
      const result = await execFileAsync(args[0], args.slice(1), {
        timeout: this.timeout,
        env: process.env,
      });
      stdout = result.stdout;
    } catch (ex) {
      throw new Error(`failed to execute external command: ${ex.message}`);
    }

    let data: ExternalCredentialResponse;
    try {
      data = JSON.parse(stdout) as ExternalCredentialResponse;
    } catch (ex) {
      throw new Error(`failed to parse external command output: ${ex.message}`);
    }

    if (!data || !data.access_key_id || !data.access_key_secret) {
      throw new Error('invalid credential response: access_key_id or access_key_secret is empty');
    }
    if (data.mode === 'StsToken' && !data.sts_token) {
      throw new Error('invalid StsToken credential response: sts_token is empty');
    }
    return data;
  }

  async getCredentials(): Promise<Credentials> {
    if (this.needUpdateCredential()) {
      const session = await this.getCredentialsInternal();
      this.session = session;
      this.expirationTimestamp = session.expiration ? Math.floor(new Date(session.expiration).getTime() / 1000) : 0;
      if (Number.isNaN(this.expirationTimestamp)) {
        this.expirationTimestamp = 0;
      }

      if (this.credentialUpdateCallback) {
        try {
          await this.credentialUpdateCallback(
            session.access_key_id,
            session.access_key_secret,
            session.sts_token,
            this.expirationTimestamp
          );
        } catch (e) {
          // Warning only, do not break credential retrieval
        }
      }
    }

    return Credentials.builder()
      .withAccessKeyId(this.session.access_key_id)
      .withAccessKeySecret(this.session.access_key_secret)
      .withSecurityToken(this.session.sts_token)
      .withProviderName(this.getProviderName())
      .build();
  }
}
