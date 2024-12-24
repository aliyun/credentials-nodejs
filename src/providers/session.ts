import { parseUTC } from './time'
import { getRandomInt } from '../util/utils'
import CredentialsProvider from '../credentials_provider'
import Credentials from '../credentials'

export const STALE_TIME = 15 * 60;

export class Session {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;

  constructor(accessKeyId: string, accessKeySecret: string, securityToken: string, expiration: string) {
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.securityToken = securityToken;
    this.expiration = expiration;
  }
}

export declare type SessionRefresher = () => Promise<Session>;

export class SessionCredentialProvider implements CredentialsProvider {
  private expirationTimestamp: number;
  private session: Session;
  private refreshFaliure: number;
  private readonly staleTime: number;
  private readonly prefetchTime: number;
  private staleTimestamp: number;
  private prefetchTimestamp: number;
  refresher: SessionRefresher;

  constructor(staleTime: number = 0, prefetchTime: number = 0) {
    this.staleTime = staleTime || STALE_TIME;
    if(prefetchTime) {
      this.prefetchTime = prefetchTime;
      this.prefetchTimestamp = Date.now() + (prefetchTime * 1000);
    }
    this.refreshFaliure  = 0;
  }

  async getCredentials(): Promise<Credentials> {
    this.session = await this.getSession();

    return Credentials.builder()
          .withAccessKeyId(this.session.accessKeyId)
          .withAccessKeySecret(this.session.accessKeySecret)
          .withSecurityToken(this.session.securityToken)
          .withProviderName(this.getProviderName())
          .build();
  }

  refreshTimestamp() {
    this.staleTimestamp = this.expirationTimestamp - this.staleTime;
    if(this.prefetchTimestamp) {
      this.prefetchTimestamp = (Date.now() + (this.prefetchTime * 1000)) / 1000;
    }
  }

  maxStaleFailureJitter(): number {
    const exponentialBackoffMillis = (1 << (this.refreshFaliure - 1));
    return exponentialBackoffMillis > 10 ? exponentialBackoffMillis : 10;
  }

  jitterTime(time: number, jitterStart: number, jitterEnd: number): number {
    const jitterRange = jitterEnd - jitterStart;
    const jitterAmount = Math.abs(Math.floor(Math.random() * jitterRange));
    return time + jitterStart + jitterAmount;
  }

  async refreshSession(): Promise<void> {
    try {
      const session = await this.refresher();
      const now = Date.now() / 1000;
      const oldSessionAvailable = this.staleTimestamp > now;
      const oldSession = this.session;
      this.expirationTimestamp = parseUTC(session.expiration) / 1000;
      this.session = session;
      this.refreshFaliure = 0;
      this.refreshTimestamp();
      // 过期时间大于15分钟，不用管
      if (this.staleTimestamp > now) {
        return;
      }
      // 不足或等于15分钟，但未过期，下次会再次刷新
      if (now < (this.staleTimestamp  + this.staleTime)) {
        this.expirationTimestamp = now + this.staleTime;
      }
      // 已过期，看缓存，缓存若大于15分钟，返回缓存，若小于15分钟，则根据策略判断是立刻重试还是稍后重试
      if (now > (this.staleTimestamp  + this.staleTime)) {
        if(oldSessionAvailable) {
          this.session = oldSession;
          this.expirationTimestamp = parseUTC(oldSession.expiration) / 1000;
          this.refreshTimestamp();
          return;
        }
        const waitUntilNextRefresh = 50 + getRandomInt(20);
        this.expirationTimestamp = now + waitUntilNextRefresh + this.staleTime;
      }
    } catch(err) {
      if (!this.session) {
        throw err;
      }
      const now = Date.now() / 1000;
      if (now < this.staleTimestamp) {
        return;
      }
      this.refreshFaliure++;
      this.expirationTimestamp = this.jitterTime(now, 1, this.maxStaleFailureJitter()) + this.staleTime;
    }
  }
  async getSession(): Promise<Session> {
      if (this.needUpdateCredential() || this.shouldPrefetchCredential()) {
        await this.refreshSession();
        this.refreshTimestamp();
      }
      return this.session;
    }

    needUpdateCredential(): boolean {
      if (!this.session || !this.expirationTimestamp) {
        return true;
      }

      return (Date.now() / 1000) >= this.staleTimestamp;
    }
  
    shouldPrefetchCredential(): boolean {
      if (!this.prefetchTimestamp) {
        return false;
      }
  
      return this.expirationTimestamp - (Date.now() / 1000) <= this.prefetchTime;
    }

    getProviderName(): string {
      return 'session';
    }
}

