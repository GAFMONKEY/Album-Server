/* eslint-disable max-classes-per-file */
/**
 * Das Modul besteht aus den Klassen für de Fehlerbehandlung bei der Verwaltung
 * von Alben, z.B. beim DB-Zugriff.
 * @packageDocumentation
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception-Klasse für eine bereits existierende EAN.
 */
export class EanExistsException extends HttpException {
    constructor(readonly ean: string) {
        super(
            `Die EAN ${ean} existiert bereits.`,
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
    }
}

/**
 * Exception-Klasse für eine ungültige Versionsnummer beim Ändern.
 */
export class VersionInvalidException extends HttpException {
    constructor(readonly version: string | undefined) {
        super(
            `Die Versionsnummer ${version} ist ungueltig.`,
            HttpStatus.PRECONDITION_FAILED,
        );
    }
}

/**
 * Exception-Klasse für eine veraltete Versionsnummer beim Ändern.
 */
export class VersionOutdatedException extends HttpException {
    constructor(readonly version: number) {
        super(
            `Die Versionsnummer ${version} ist nicht aktuell.`,
            HttpStatus.PRECONDITION_FAILED,
        );
    }
}

/* eslint-enable max-classes-per-file */
