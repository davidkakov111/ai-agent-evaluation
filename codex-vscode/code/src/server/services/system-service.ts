import { SystemRepository } from "@/server/repositories";

export interface HealthcheckResult {
  ok: true;
  database: "up";
}

export class SystemService {
  public constructor(private readonly systemRepository: SystemRepository) {}

  public async healthcheck(): Promise<HealthcheckResult> {
    await this.systemRepository.pingDatabase();

    return {
      ok: true,
      database: "up",
    };
  }
}
