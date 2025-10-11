import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTasksServiceTables1759951300000 implements MigrationInterface {
    name = 'CreateTasksServiceTables1759951300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN
            CREATE TYPE "public"."tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);
        
        await queryRunner.query(`DO $$ BEGIN
            CREATE TYPE "public"."tasks_status_enum" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);
        
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, "password" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "title" character varying(180) NOT NULL, "description" text, "deadline" TIMESTAMP WITH TIME ZONE, "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'LOW', "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'TODO', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "assignees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taskId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_assignees_taskId_userId" UNIQUE ("taskId", "userId"), CONSTRAINT "PK_assignees_id" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taskId" uuid NOT NULL, "authorId" uuid NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8bf68bc960f2b69e818bdb90a" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "task_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taskId" uuid NOT NULL, "changedBy" uuid NOT NULL, "field" character varying(80) NOT NULL, "oldValue" jsonb, "newValue" jsonb, "changedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_task_history_id" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_userId" ON "tasks" ("userId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_priority" ON "tasks" ("priority")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_status" ON "tasks" ("status")`);
        
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_assignees_taskId" ON "assignees" ("taskId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_assignees_userId" ON "assignees" ("userId")`);
        
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comments_taskId" ON "comments" ("taskId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comments_authorId" ON "comments" ("authorId")`);
        
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_task_history_taskId" ON "task_history" ("taskId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_task_history_changedBy" ON "task_history" ("changedBy")`);
        
        await queryRunner.query(`DO $$ BEGIN
            ALTER TABLE "assignees" ADD CONSTRAINT "FK_assignees_taskId" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);
        
        await queryRunner.query(`DO $$ BEGIN
            ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_taskId" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);
        
        await queryRunner.query(`DO $$ BEGIN
            ALTER TABLE "task_history" ADD CONSTRAINT "FK_task_history_taskId" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_history" DROP CONSTRAINT "FK_task_history_taskId"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_taskId"`);
        await queryRunner.query(`ALTER TABLE "assignees" DROP CONSTRAINT "FK_assignees_taskId"`);
        
        await queryRunner.query(`DROP INDEX "public"."IDX_task_history_changedBy"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_task_history_taskId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_authorId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_taskId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_assignees_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_assignees_taskId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_priority"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_userId"`);
        
        await queryRunner.query(`DROP TABLE "task_history"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP TABLE "assignees"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TABLE "user"`);
        
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
    }
}
