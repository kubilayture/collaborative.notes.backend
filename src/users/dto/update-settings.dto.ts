import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({ description: 'Theme preference (light/dark/system)', required: false })
  @IsOptional()
  @IsString()
  theme?: 'light' | 'dark' | 'system';

  @ApiProperty({ description: 'Language preference', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ description: 'Email notifications enabled', required: false })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ description: 'Push notifications enabled', required: false })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiProperty({ description: 'Desktop notifications enabled', required: false })
  @IsOptional()
  @IsBoolean()
  desktopNotifications?: boolean;

  @ApiProperty({ description: 'Sound notifications enabled', required: false })
  @IsOptional()
  @IsBoolean()
  soundNotifications?: boolean;

  @ApiProperty({ description: 'Auto-save interval in seconds', required: false })
  @IsOptional()
  autoSaveInterval?: number;

  @ApiProperty({ description: 'Default editor mode', required: false })
  @IsOptional()
  @IsString()
  defaultEditorMode?: 'rich' | 'markdown' | 'plain';

  @ApiProperty({ description: 'Show line numbers in editor', required: false })
  @IsOptional()
  @IsBoolean()
  showLineNumbers?: boolean;

  @ApiProperty({ description: 'Word wrap in editor', required: false })
  @IsOptional()
  @IsBoolean()
  wordWrap?: boolean;

  @ApiProperty({ description: 'Additional settings as key-value pairs', required: false })
  @IsOptional()
  @IsObject()
  additionalSettings?: Record<string, any>;
}