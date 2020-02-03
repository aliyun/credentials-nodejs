
import AccessKeyCredential from '../access_key_credential';
import ICredential from '../icredential';

export default {
  getCredential(): ICredential {
    const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;

    if (accessKeyId === undefined || accessKeySecret === undefined) {
      return null;
    }

    if (accessKeyId === null || accessKeyId === '') {
      throw new Error('Environment variable ALIBABA_CLOUD_ACCESS_KEY_ID cannot be empty');
    }

    if (accessKeySecret === null || accessKeySecret === '') {
      throw new Error('Environment variable ALIBABA_CLOUD_ACCESS_KEY_SECRET cannot be empty');
    }

    return new AccessKeyCredential(accessKeyId, accessKeySecret);
  }
}