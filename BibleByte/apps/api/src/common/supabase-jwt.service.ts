import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type AuthenticatedPrincipal = {
  sub: string;
  email: string | null;
  provider: string;
};

@Injectable()
export class SupabaseJwtService {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    this.issuer = process.env.SUPABASE_JWT_ISSUER ?? `${supabaseUrl}/auth/v1`;
    this.audience = process.env.SUPABASE_JWT_AUDIENCE ?? "authenticated";
    const jwksUrl = process.env.SUPABASE_JWKS_URL ?? `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

    if (!supabaseUrl) {
      throw new Error("Missing SUPABASE_URL for JWT verification.");
    }

    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedPrincipal> {
    let payload: JWTPayload;
    try {
      const result = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience
      });
      payload = result.payload;
    } catch (_error) {
      throw new UnauthorizedException("Invalid or expired Supabase access token.");
    }

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      throw new UnauthorizedException("Missing token subject.");
    }

    const provider =
      typeof payload.app_metadata === "object" &&
      payload.app_metadata &&
      "provider" in payload.app_metadata &&
      typeof payload.app_metadata.provider === "string"
        ? payload.app_metadata.provider
        : "unknown";

    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      provider
    };
  }
}
