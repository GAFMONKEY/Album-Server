/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Abbildung ohne TypeORM.
 */
export class SongDTO {
    @MaxLength(32)
    @ApiProperty({ example: 'Dancing Queen', type: String })
    readonly songtitel!: string;

    @MaxLength(10)
    @ApiProperty({ example: '3:25', type: String })
    readonly dauer: string | undefined;

    @MaxLength(32)
    @ApiProperty({ example: 'Michael Jackson', type: String })
    readonly feature: string | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
