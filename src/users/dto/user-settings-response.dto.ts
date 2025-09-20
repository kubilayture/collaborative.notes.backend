import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserSettingsResponseDto {
  @ApiProperty({ description: 'Settings ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Theme preference', nullable: true })
  @Expose()
  theme: string | null;

  @ApiProperty({ description: 'Language preference', nullable: true })
  @Expose()
  language: string | null;

  @ApiProperty({ description: 'Email notifications enabled' })
  @Expose()
  emailNotifications: boolean;

  @ApiProperty({ description: 'Push notifications enabled' })
  @Expose()
  pushNotifications: boolean;

  @ApiProperty({ description: 'Desktop notifications enabled' })
  @Expose()
  desktopNotifications: boolean;

  @ApiProperty({ description: 'Sound notifications enabled' })
  @Expose()
  soundNotifications: boolean;

  @ApiProperty({ description: 'Auto-save interval in seconds' })
  @Expose()
  autoSaveInterval: number;

  @ApiProperty({ description: 'Default editor mode' })
  @Expose()
  defaultEditorMode: string;

  @ApiProperty({ description: 'Show line numbers in editor' })
  @Expose()
  showLineNumbers: boolean;

  @ApiProperty({ description: 'Word wrap in editor' })
  @Expose()
  wordWrap: boolean;

  @ApiProperty({ description: 'Additional settings as key-value pairs', nullable: true })
  @Expose()
  additionalSettings: Record<string, any> | null;

  @ApiProperty({ description: 'Settings creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Settings last update timestamp' })
  @Expose()
  updatedAt: Date;
}