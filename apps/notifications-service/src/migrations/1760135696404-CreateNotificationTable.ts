import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationTable1760135696404 implements MigrationInterface {
    name = 'CreateNotificationTable1760135696404'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`DO $$ BEGIN
            CREATE TYPE "public"."notifications_type_enum" AS ENUM('TASK_CREATED', 'TASK_ASSIGNED', 'TASK_UPDATED', 'COMMENT_CREATED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "taskId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(200) NOT NULL, "message" text NOT NULL, "data" jsonb, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_userId" ON "notifications" ("userId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_taskId" ON "notifications" ("taskId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_taskId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_userId"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }

}
