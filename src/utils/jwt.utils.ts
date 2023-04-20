import jwt from 'jsonwebtoken';
import config from '../config';

const privateKey = config.privateKey.replace(/\\n/gm, '\n');
const publicKey = config.publicKey.replace(/\\n/gm, '\n');

export function signJwt(payload: Object, options?: jwt.SignOptions | undefined) {
  return jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: 'RS256',
  });
}

export function verifyJwt(token: string) {
  try {
    const decoded = jwt.verify(token, publicKey);
    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (err: any) {
    return {
      valid: false,
      expired: err.message === 'jwt expired',
      decoded: null,
    };
  }
}
