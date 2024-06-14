import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Album } from './album.entity.js';

@Entity()
export class Interpret {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    readonly interpret!: string;

    @Column('date')
    readonly geburtsdatum: Date | string | undefined;

    @OneToOne(() => Album, (album) => album.interpret)
    @JoinColumn({ name: 'album_id' })
    album: Album | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            interpret: this.interpret,
            geburtsdatum: this.geburtsdatum,
        });
}
