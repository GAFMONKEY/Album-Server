/* eslint-disable max-classes-per-file */
/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsEAN,
    IsISO8601,
    IsInt,
    IsOptional,
    IsPositive,
    IsUrl,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { type AlbumArt } from '../entity/album.entity.js';
import { ApiProperty } from '@nestjs/swagger';
import { InterpretDTO } from './interpretDTO.entity.js';
import { SongDTO } from './songDTO.entity.js';
import { Type } from 'class-transformer';

export const MAX_RATING = 5;

/**
 * Entity-Klasse für Alben ohne TypeORM und ohne Referenzen.
 */
export class AlbumDtoOhneRef {
    // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
    @IsEAN()
    @ApiProperty({ example: '0028948592241', type: String })
    readonly ean!: string;

    @IsInt()
    @Min(0)
    @Max(MAX_RATING)
    @ApiProperty({ example: 5, type: Number })
    readonly rating: number | undefined;

    @Matches(/^STUDIOALBUM$|^LIVEALBUM$/u)
    @IsOptional()
    @ApiProperty({ example: 'STUDIOALBUM', type: String })
    readonly art: AlbumArt | undefined;

    @ApiProperty({ example: 'Waterloo', type: String })
    readonly titel!: string;

    @IsPositive()
    @ApiProperty({ example: 1, type: Number })
    readonly preis!: number;

    @Min(0)
    @Max(1)
    @IsOptional()
    @ApiProperty({ example: 0.1, type: Number })
    readonly rabatt: number | undefined;

    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly lieferbar: boolean | undefined;

    @IsISO8601({ strict: true })
    @IsOptional()
    @ApiProperty({ example: '2023-04-13' })
    readonly erscheinungsdatum: Date | string | undefined;

    @IsUrl()
    @IsOptional()
    @ApiProperty({ example: 'https://test.de/', type: String })
    readonly homepage: string | undefined;

    @IsOptional()
    @ArrayUnique()
    @ApiProperty({ example: ['HIP-HOP', 'ROCK'] })
    readonly genres: string[] | null | undefined;
}

/**
 * Entity-Klasse für Bücher ohne TypeORM.
 */
export class AlbumDTO extends AlbumDtoOhneRef {
    @ValidateNested()
    @Type(() => InterpretDTO)
    @ApiProperty({ type: InterpretDTO })
    readonly interpret!: InterpretDTO;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SongDTO)
    @ApiProperty({ type: [SongDTO] })
    readonly songs: SongDTO[] | undefined;

    // SongDTO
}
/* eslint-enable max-classes-per-file */
