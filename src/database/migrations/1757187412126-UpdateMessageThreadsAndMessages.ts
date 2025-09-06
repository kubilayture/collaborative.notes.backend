import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMessageThreadsAndMessages1757187412126 implements MigrationInterface {
    name = 'UpdateMessageThreadsAndMessages1757187412126'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5bb136907ad1a6723c4590bebb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_72c6c65a8ad1d7bbf7e4606a2a"`);
        await queryRunner.query(`ALTER TABLE "message_threads" DROP CONSTRAINT "unique_thread_participants"`);
        await queryRunner.query(`ALTER TABLE "message_threads" DROP COLUMN "participant1Id"`);
        await queryRunner.query(`ALTER TABLE "message_threads" DROP COLUMN "participant2Id"`);
        await queryRunner.query(`ALTER TABLE "message_threads" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_threads" ADD "creatorId" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_threads" ADD "participantIds" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "replyToId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_644d7fab5e6eb6ef2f19d63781" ON "message_threads" ("creatorId") `);
        await queryRunner.query(`ALTER TABLE "message_threads" ADD CONSTRAINT "FK_644d7fab5e6eb6ef2f19d637814" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_f550135b17eaf7c5452ae5fd4a8" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_f550135b17eaf7c5452ae5fd4a8"`);
        await queryRunner.query(`ALTER TABLE "message_threads" DROP CONSTRAINT "FK_644d7fab5e6eb6ef2f19d637814"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_644d7fab5e6eb6ef2f19d63781"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "replyToId"`);
        await queryRunner.query(`ALTER TABLE "message_threads" DROP COLUMN "participantIds"`);
        await queryRunner.query(`ALTER TABLE "message_threads" DROP COLUMN "creatorId"`);
        await queryRunner.query(`ALTER TABLE "message_threads" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "message_threads" ADD "participant2Id" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_threads" ADD "participant1Id" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_threads" ADD CONSTRAINT "unique_thread_participants" UNIQUE ("participant1Id", "participant2Id")`);
        await queryRunner.query(`CREATE INDEX "IDX_72c6c65a8ad1d7bbf7e4606a2a" ON "message_threads" ("participant1Id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5bb136907ad1a6723c4590bebb" ON "message_threads" ("participant2Id") `);
    }

}
