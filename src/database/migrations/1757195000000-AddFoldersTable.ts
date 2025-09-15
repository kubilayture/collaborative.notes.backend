import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFoldersTable1757195000000 implements MigrationInterface {
    name = 'AddFoldersTable1757195000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create folders table
        await queryRunner.query(`CREATE TABLE "folders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "color" character varying(7), "ownerId" text NOT NULL, "parentId" uuid, "isSystem" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8b2c83b2e25c81b2e6de90a7a4e" PRIMARY KEY ("id"))`);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_folders_owner_id" ON "folders" ("ownerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_folders_parent_id" ON "folders" ("parentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_folders_owner_parent" ON "folders" ("ownerId", "parentId") `);

        // Add folderId column to notes table
        await queryRunner.query(`ALTER TABLE "notes" ADD "folderId" uuid`);

        // Create index for notes folderId
        await queryRunner.query(`CREATE INDEX "IDX_notes_folder_id" ON "notes" ("folderId") `);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "folders" ADD CONSTRAINT "FK_folders_owner" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "folders" ADD CONSTRAINT "FK_folders_parent" FOREIGN KEY ("parentId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notes" ADD CONSTRAINT "FK_notes_folder" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraints
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_notes_folder"`);
        await queryRunner.query(`ALTER TABLE "folders" DROP CONSTRAINT "FK_folders_parent"`);
        await queryRunner.query(`ALTER TABLE "folders" DROP CONSTRAINT "FK_folders_owner"`);

        // Remove indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_notes_folder_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_folders_owner_parent"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_folders_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_folders_owner_id"`);

        // Remove folderId column from notes
        await queryRunner.query(`ALTER TABLE "notes" DROP COLUMN "folderId"`);

        // Drop folders table
        await queryRunner.query(`DROP TABLE "folders"`);
    }
}