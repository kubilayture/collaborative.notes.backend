import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateParticipantIdsToArray1757615522161 implements MigrationInterface {
    name = 'UpdateParticipantIdsToArray1757615522161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_threads" DROP COLUMN "participantIds"`);
        await queryRunner.query(`ALTER TABLE "message_threads" ADD "participantIds" text array NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_threads" DROP COLUMN "participantIds"`);
        await queryRunner.query(`ALTER TABLE "message_threads" ADD "participantIds" text NOT NULL`);
    }

}
