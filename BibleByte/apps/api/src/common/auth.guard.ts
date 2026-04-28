import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { SupabaseJwtService, type AuthenticatedPrincipal } from "./supabase-jwt.service";

type RequestWithAuth = {
  headers: Record<string, string | undefined>;
  user?: AuthenticatedPrincipal;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseJwtService: SupabaseJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    request.user = await this.supabaseJwtService.verifyAccessToken(token);
    return true;
  }
}
