import { SignJWT, jwtVerify } from "jose";
import {
  InvalidAccessTokenError,
  type AccessTokenService,
} from "../../modules/auth/auth.service.js";
export class JoseAccessTokenService implements AccessTokenService {
  private key: Uint8Array;
  constructor(
    secret: string,
    private issuer: string,
    private audience: string,
    private ttl: number,
  ) {
    this.key = new TextEncoder().encode(secret);
    if (this.key.byteLength < 32) throw new Error("JWT key must be at least 32 bytes.");
  }
  issue(sub: string): Promise<string> {
    return new SignJWT({ token_use: "access" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(`${this.ttl}s`)
      .sign(this.key);
  }
  async verify(t: string): Promise<{ subject: string }> {
    try {
      const { payload, protectedHeader } = await jwtVerify(t, this.key, {
        algorithms: ["HS256"],
        issuer: this.issuer,
        audience: this.audience,
        requiredClaims: ["sub", "iat", "exp", "iss", "aud", "token_use"],
      });
      if (
        protectedHeader.alg !== "HS256" ||
        payload.token_use !== "access" ||
        typeof payload.sub !== "string" ||
        !payload.sub
      )
        throw Error();
      return { subject: payload.sub };
    } catch {
      throw new InvalidAccessTokenError();
    }
  }
}
