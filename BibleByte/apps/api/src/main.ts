import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module";

for (const envPath of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "apps/api/.env")]) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

async function bootstrap() {
  // TODO[SENTRY_BACKEND]: Initialize Sentry SDK before app bootstrap.
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"]
  });
  app.setGlobalPrefix("v1");
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
