/**
 * Das Modul besteht aus der Klasse {@linkcode AlbumReadService}.
 * @packageDocumentation
 */

import { type AlbumArt } from './../entity/album.entity.js';

/**
 * Typdefinition für 'AlbumReadService.find()' und 'QueryBuilder.build()'
 */

export interface Suchkriterien {
    readonly ean?: string;
    readonly rating?: number;
    readonly art?: AlbumArt;
    readonly titel?: string;
    readonly preis?: number;
    readonly rabatt?: number;
    readonly lieferbar?: boolean;
    readonly erscheinungsdatum?: string;
    readonly homepage?: string;
    readonly pop?: string;
    readonly alternative?: string;
    readonly interpret?: string;
}
