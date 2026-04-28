import { Injectable, InternalServerErrorException } from "@nestjs/common";

type SupabaseAdminUserResponse = {
  id: string;
  email?: string;
};

@Injectable()
export class SupabaseAdminService {
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error("Missing SUPABASE_URL for Supabase admin operations.");
    }

    if (!serviceRoleKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for account lifecycle operations.");
    }

    this.supabaseUrl = supabaseUrl;
    this.serviceRoleKey = serviceRoleKey;
  }

  async revokeUserSessions(userId: string): Promise<void> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users/${userId}/logout`, {
      method: "POST",
      headers: this.baseHeaders()
    });

    if (!response.ok) {
      throw new InternalServerErrorException(`Failed to revoke sessions for user ${userId}.`);
    }
  }

  async deleteUser(userId: string): Promise<SupabaseAdminUserResponse> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: this.baseHeaders()
    });

    if (!response.ok) {
      throw new InternalServerErrorException(`Failed to delete Supabase user ${userId}.`);
    }

    const data = (await response.json()) as SupabaseAdminUserResponse;
    return data;
  }

  private baseHeaders() {
    return {
      apikey: this.serviceRoleKey,
      Authorization: `Bearer ${this.serviceRoleKey}`,
      "Content-Type": "application/json"
    };
  }
}
