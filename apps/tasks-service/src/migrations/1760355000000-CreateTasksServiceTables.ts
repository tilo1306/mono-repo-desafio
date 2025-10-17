import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksServiceTables1760355000000 implements MigrationInterface {
  name = 'CreateTasksServiceTables1760355000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "createdById" uuid NOT NULL,
        "title" character varying(180) NOT NULL,
        "description" text,
        "deadline" TIMESTAMP WITH TIME ZONE,
        "priority" character varying(20) NOT NULL DEFAULT 'LOW',
        "status" character varying(20) NOT NULL DEFAULT 'TODO',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_tasks_userId" ON "tasks" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_createdById" ON "tasks" ("createdById")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_priority" ON "tasks" ("priority")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "assignees" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "taskId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_assignees" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_assignees_task_user" UNIQUE ("taskId", "userId")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_assignees_taskId" ON "assignees" ("taskId")`);
    await queryRunner.query(`CREATE INDEX "IDX_assignees_userId" ON "assignees" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "taskId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_comments_taskId" ON "comments" ("taskId")`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_userId" ON "comments" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE "task_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "taskId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "action" character varying(50) NOT NULL,
        "oldValue" text,
        "newValue" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_history" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_task_history_taskId" ON "task_history" ("taskId")`);
    await queryRunner.query(`CREATE INDEX "IDX_task_history_userId" ON "task_history" ("userId")`);

    await queryRunner.query(`
      ALTER TABLE "assignees" 
      ADD CONSTRAINT "FK_assignees_task" 
      FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "assignees" 
      ADD CONSTRAINT "FK_assignees_user" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "comments" 
      ADD CONSTRAINT "FK_comments_task" 
      FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "comments" 
      ADD CONSTRAINT "FK_comments_user" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "task_history" 
      ADD CONSTRAINT "FK_task_history_task" 
      FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "task_history" 
      ADD CONSTRAINT "FK_task_history_user" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task_history" DROP CONSTRAINT "FK_task_history_user"`);
    await queryRunner.query(`ALTER TABLE "task_history" DROP CONSTRAINT "FK_task_history_task"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_user"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_task"`);
    await queryRunner.query(`ALTER TABLE "assignees" DROP CONSTRAINT "FK_assignees_user"`);
    await queryRunner.query(`ALTER TABLE "assignees" DROP CONSTRAINT "FK_assignees_task"`);

    await queryRunner.query(`DROP TABLE "task_history"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TABLE "assignees"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
  }
}
