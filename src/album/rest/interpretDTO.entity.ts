/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entity-Klasse für Titel ohne TypeORM.
 */
export class InterpretDTO {
    @Matches('^\\w.*')
    @MaxLength(40)
    @ApiProperty({ example: 'Dieter Bohlen', type: String })
    readonly interpret!: string;

    @IsOptional()
    @MaxLength(40)
    @ApiProperty({ example: '1998-12-13', type: String })
    readonly geburtsdatum: Date | string | undefined;
}
