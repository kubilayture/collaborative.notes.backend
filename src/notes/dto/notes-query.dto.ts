import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class NotesQueryDto {
  @ApiProperty({
    description: 'Include notes owned by the user',
    required: false,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  mine?: boolean = true;

  @ApiProperty({
    description: 'Include notes shared with the user',
    required: false,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  shared?: boolean = true;

  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of notes per page',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Search query in title and content',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by tag',
    required: false,
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({
    description: 'Filter by folder ID. Use null to get notes not in any folder',
    required: false,
  })
  @IsOptional()
  @IsString()
  folderId?: string;
}
