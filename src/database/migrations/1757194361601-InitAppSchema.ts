import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAppSchema1757194361601 implements MigrationInterface {
  name = 'InitAppSchema1757194361601';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" text NOT NULL, "username" text, "bio" text, "avatar" text, "timezone" text, "preferences" jsonb, "lastSeenAt" TIMESTAMP, "isOnline" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_51cb79b5555effaf7d69ba1cff" UNIQUE ("userId"), CONSTRAINT "PK_f44d0cd18cfd80b0fed7806c3b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_51cb79b5555effaf7d69ba1cff" ON "user_profile" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text NOT NULL, "content" jsonb, "ownerId" text NOT NULL, "isPublic" boolean NOT NULL DEFAULT false, "tags" text array NOT NULL DEFAULT '{}', "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a515a13f03ef7ad02efeedc071" ON "notes" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8fcc29811c424b531ac9a341d2" ON "notes" ("ownerId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('friend_request', 'friend_accepted', 'note_shared', 'note_invitation', 'new_message', 'note_comment', 'note_updated')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" text NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" text NOT NULL, "message" text NOT NULL, "data" jsonb, "isRead" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_831a5a06f879fb0bebf8965871" ON "notifications" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5340fc241f57310d243e5ab20b" ON "notifications" ("userId", "isRead") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."note_permissions_role_enum" AS ENUM('owner', 'editor', 'commenter', 'viewer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "note_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "noteId" uuid NOT NULL, "userId" text NOT NULL, "role" "public"."note_permissions_role_enum" NOT NULL, "grantedById" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "unique_note_user_permission" UNIQUE ("noteId", "userId"), CONSTRAINT "PK_c1fe5b91a57eae75b294554f74a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f47c89df45ba0ddb9d62d36ec3" ON "note_permissions" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f00995e95d4c9a0e3a62bb95e" ON "note_permissions" ("noteId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "message_threads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "creatorId" text NOT NULL, "participantIds" text NOT NULL, "lastMessageAt" TIMESTAMP, "lastMessagePreview" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_257a191f664b9470b5d94f98264" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_644d7fab5e6eb6ef2f19d63781" ON "message_threads" ("creatorId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "threadId" uuid NOT NULL, "senderId" text NOT NULL, "content" text NOT NULL, "replyToId" uuid, "isRead" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP, "isEdited" boolean NOT NULL DEFAULT false, "editedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2db9cf2b3ca111742793f6c37c" ON "messages" ("senderId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_37e3e110ca0d8b7a51ef50f256" ON "messages" ("threadId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."friends_status_enum" AS ENUM('pending', 'accepted', 'declined', 'blocked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "friends" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requesterId" text NOT NULL, "addresseeId" text NOT NULL, "status" "public"."friends_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "unique_friend_pair" UNIQUE ("requesterId", "addresseeId"), CONSTRAINT "PK_65e1b06a9f379ee5255054021e1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92e192ba15c0f32f014211d0aa" ON "friends" ("addresseeId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2b441df2ab76cd28eb765c14a3" ON "friends" ("requesterId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_role_enum" AS ENUM('owner', 'editor', 'commenter', 'viewer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_status_enum" AS ENUM('pending', 'accepted', 'declined', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "noteId" uuid NOT NULL, "inviterId" text NOT NULL, "inviteeEmail" text NOT NULL, "inviteeId" text, "role" "public"."invitations_role_enum" NOT NULL, "status" "public"."invitations_status_enum" NOT NULL DEFAULT 'pending', "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56ce8d405de7cdcedd31d900ba" ON "invitations" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0133e0084ccd99ddbadcf43f56" ON "invitations" ("inviteeEmail") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a60ba0f9dc2a96c301c5bdbd8" ON "invitations" ("noteId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e577dcf9bb6d084373ed399850" ON "invitations" ("token") `,
    );
    await queryRunner.query(
      `CREATE TABLE "collab_snapshots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "noteId" uuid NOT NULL, "version" integer NOT NULL, "snapshot" bytea NOT NULL, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b6c1d962474d1b9d13e505b4c91" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_61617486c8fdbd0bf9e82019df" ON "collab_snapshots" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32a095ed02a09ea1be97d52ede" ON "collab_snapshots" ("noteId", "version") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."activity_type_enum" AS ENUM('note_created', 'note_updated', 'note_shared', 'note_permission_changed', 'note_collaborator_joined', 'note_collaborator_left', 'note_comment_added', 'note_version_restored')`,
    );
    await queryRunner.query(
      `CREATE TABLE "activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "noteId" uuid NOT NULL, "userId" text NOT NULL, "type" "public"."activity_type_enum" NOT NULL, "description" text NOT NULL, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3571467bcbe021f66e2bdce96e" ON "activity" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f2340e50e250b69a97ad10c5e" ON "activity" ("noteId", "createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profile" ADD CONSTRAINT "FK_51cb79b5555effaf7d69ba1cff9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_8fcc29811c424b531ac9a341d29" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "note_permissions" ADD CONSTRAINT "FK_7f00995e95d4c9a0e3a62bb95e4" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "note_permissions" ADD CONSTRAINT "FK_f47c89df45ba0ddb9d62d36ec3f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "note_permissions" ADD CONSTRAINT "FK_292c9571f956c4fd5110e79daf7" FOREIGN KEY ("grantedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_threads" ADD CONSTRAINT "FK_644d7fab5e6eb6ef2f19d637814" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_15f9bd2bf472ff12b6ee20012d0" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_f550135b17eaf7c5452ae5fd4a8" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friends" ADD CONSTRAINT "FK_c72d95f5e0295ac2f0c73c8be2c" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friends" ADD CONSTRAINT "FK_93a32a65e440e690a92b7d92187" FOREIGN KEY ("addresseeId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_2a60ba0f9dc2a96c301c5bdbd8c" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_925ca5a02bf01ec03252a3050fd" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_f486f35d305965a473eaee90feb" FOREIGN KEY ("inviteeId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collab_snapshots" ADD CONSTRAINT "FK_a4f00fc9a751c784068286b6808" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ADD CONSTRAINT "FK_29daa447591139b74774c12e5a7" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ADD CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity" DROP CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" DROP CONSTRAINT "FK_29daa447591139b74774c12e5a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collab_snapshots" DROP CONSTRAINT "FK_a4f00fc9a751c784068286b6808"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_f486f35d305965a473eaee90feb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_925ca5a02bf01ec03252a3050fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_2a60ba0f9dc2a96c301c5bdbd8c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friends" DROP CONSTRAINT "FK_93a32a65e440e690a92b7d92187"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friends" DROP CONSTRAINT "FK_c72d95f5e0295ac2f0c73c8be2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_f550135b17eaf7c5452ae5fd4a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_15f9bd2bf472ff12b6ee20012d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_threads" DROP CONSTRAINT "FK_644d7fab5e6eb6ef2f19d637814"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note_permissions" DROP CONSTRAINT "FK_292c9571f956c4fd5110e79daf7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note_permissions" DROP CONSTRAINT "FK_f47c89df45ba0ddb9d62d36ec3f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note_permissions" DROP CONSTRAINT "FK_7f00995e95d4c9a0e3a62bb95e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "FK_8fcc29811c424b531ac9a341d29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profile" DROP CONSTRAINT "FK_51cb79b5555effaf7d69ba1cff9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "emailVerified" DROP DEFAULT`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f2340e50e250b69a97ad10c5e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3571467bcbe021f66e2bdce96e"`,
    );
    await queryRunner.query(`DROP TABLE "activity"`);
    await queryRunner.query(`DROP TYPE "public"."activity_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32a095ed02a09ea1be97d52ede"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_61617486c8fdbd0bf9e82019df"`,
    );
    await queryRunner.query(`DROP TABLE "collab_snapshots"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e577dcf9bb6d084373ed399850"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2a60ba0f9dc2a96c301c5bdbd8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0133e0084ccd99ddbadcf43f56"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56ce8d405de7cdcedd31d900ba"`,
    );
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2b441df2ab76cd28eb765c14a3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92e192ba15c0f32f014211d0aa"`,
    );
    await queryRunner.query(`DROP TABLE "friends"`);
    await queryRunner.query(`DROP TYPE "public"."friends_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_37e3e110ca0d8b7a51ef50f256"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2db9cf2b3ca111742793f6c37c"`,
    );
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_644d7fab5e6eb6ef2f19d63781"`,
    );
    await queryRunner.query(`DROP TABLE "message_threads"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f00995e95d4c9a0e3a62bb95e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f47c89df45ba0ddb9d62d36ec3"`,
    );
    await queryRunner.query(`DROP TABLE "note_permissions"`);
    await queryRunner.query(`DROP TYPE "public"."note_permissions_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5340fc241f57310d243e5ab20b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_831a5a06f879fb0bebf8965871"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8fcc29811c424b531ac9a341d2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a515a13f03ef7ad02efeedc071"`,
    );
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_51cb79b5555effaf7d69ba1cff"`,
    );
    await queryRunner.query(`DROP TABLE "user_profile"`);
  }
}
