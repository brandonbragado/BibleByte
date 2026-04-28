import { Body, Controller, Delete, Get, Module, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { AnalyticsEventSchema, OnboardingPreferenceSchema, ProgressCompleteSchema } from "@biblebites/contracts";
import { BibleChatController } from "../bible-chat.controller";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthGuard } from "../common/auth.guard";
import { SupabaseJwtService } from "../common/supabase-jwt.service";
import { SupabaseAdminService } from "../common/supabase-admin.service";

type AuthenticatedRequest = {
  user: {
    sub: string;
    email: string | null;
    provider: string;
  };
};

@Controller()
@UseGuards(SupabaseAuthGuard)
class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdminService: SupabaseAdminService
  ) {}

  @Get("auth/me")
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    const appUser = this.prisma.upsertUserFromAuth({
      sub: request.user.sub,
      provider: request.user.provider
    });

    return {
      user: {
        id: appUser.id,
        supabaseAuthUserId: appUser.supabaseAuthUserId,
        email: request.user.email,
        provider: appUser.provider
      },
      onboardingCompleted: false
    };
  }

  @Post("auth/logout")
  async logout(@Req() request: AuthenticatedRequest) {
    await this.supabaseAdminService.revokeUserSessions(request.user.sub);
    // TODO(APNS_FCM): Add push-token revocation once remote notification workers are active.
    return { ok: true };
  }

  @Get("onboarding/options")
  onboardingOptions() {
    return {
      goals: ["Daily scripture habit", "Closer prayer life"],
      topics: ["Trust", "Grace", "Hope"],
      dailyAmountTypes: ["snippet", "passage", "section", "chapter"]
    };
  }

  @Post("onboarding/preferences")
  async savePreferences(@Body() body: unknown) {
    const payload = OnboardingPreferenceSchema.parse(body);
    return payload;
  }

  @Get("lessons/today")
  todayLesson() {
    return this.prisma.getTodayLesson();
  }

  @Get("lessons/history")
  lessonHistory(@Query("cursor") cursor?: string) {
    const lessons = this.prisma.getLessonHistory(cursor);
    return { cursor: lessons.at(-1)?.dateKey, items: lessons };
  }

  @Post("progress/lessons/:lessonId/start")
  lessonStart(@Param("lessonId") lessonId: string) {
    return { lessonId, started: true };
  }

  @Post("progress/lessons/:lessonId/complete")
  async lessonComplete(@Param("lessonId") lessonId: string, @Body() body: unknown) {
    const payload = ProgressCompleteSchema.parse({ ...(body as object), lessonId });
    return payload;
  }

  @Get("progress/stats")
  progressStats() {
    return { currentStreak: 0, longestStreak: 0, completedLessons: 0 };
  }

  @Get("snippets/today")
  todaySnippet() {
    return this.prisma.getTodaySnippet();
  }

  @Put("notifications/schedule")
  updateSchedule(@Body() body: { localTime: string; timezone: string; enabled: boolean }) {
    return body;
  }

  @Post("notifications/opened")
  opened(@Body() body: { eventName: string }) {
    const eventName = AnalyticsEventSchema.parse(body.eventName);
    return { ok: true, eventName };
  }

  @Delete("auth/account")
  async deleteAccount(@Req() request: AuthenticatedRequest) {
    await this.supabaseAdminService.revokeUserSessions(request.user.sub);
    const deletedSupabaseUser = await this.supabaseAdminService.deleteUser(request.user.sub);
    const deleted = this.prisma.markUserDeleted(request.user.sub);
    return {
      deleted: true,
      userFound: Boolean(deleted),
      revokedSessions: true,
      deletedSupabaseAuthUserId: deletedSupabaseUser.id
    };
  }
}

@Module({
  controllers: [AppController, BibleChatController],
  providers: [PrismaService, SupabaseJwtService, SupabaseAdminService, SupabaseAuthGuard]
})
export class AppModule {}
