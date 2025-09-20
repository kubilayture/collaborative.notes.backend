import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileAndSettings1757196000000 implements MigrationInterface {
  name = 'AddUserProfileAndSettings1757196000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_profile table
    await queryRunner.query(
      `CREATE TABLE "user_profile" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" text NOT NULL,
        "username" text,
        "bio" text,
        "avatar" text,
        "timezone" text,
        "preferences" jsonb,
        "lastSeenAt" TIMESTAMP,
        "isOnline" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_profile" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_profile_userId" UNIQUE ("userId")
      )`,
    );

    // Create user_settings table
    await queryRunner.query(
      `CREATE TABLE "user_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" text NOT NULL,
        "theme" character varying(20),
        "language" character varying(10),
        "emailNotifications" boolean NOT NULL DEFAULT true,
        "pushNotifications" boolean NOT NULL DEFAULT true,
        "desktopNotifications" boolean NOT NULL DEFAULT true,
        "soundNotifications" boolean NOT NULL DEFAULT true,
        "autoSaveInterval" integer NOT NULL DEFAULT 30,
        "defaultEditorMode" character varying(20) NOT NULL DEFAULT 'rich',
        "showLineNumbers" boolean NOT NULL DEFAULT false,
        "wordWrap" boolean NOT NULL DEFAULT true,
        "additionalSettings" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_settings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_settings_userId" UNIQUE ("userId")
      )`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_user_profile_userId" ON "user_profile" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_profile_username" ON "user_profile" ("username")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_settings_userId" ON "user_settings" ("userId")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "user_profile" ADD CONSTRAINT "FK_user_profile_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD CONSTRAINT "FK_user_settings_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP CONSTRAINT "FK_user_settings_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profile" DROP CONSTRAINT "FK_user_profile_user"`,
    );

    // Remove indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_user_settings_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_profile_username"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_profile_userId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "user_settings"`);
    await queryRunner.query(`DROP TABLE "user_profile"`);
  }
}