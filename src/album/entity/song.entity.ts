import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Album } from './album.entity.js';

@Entity()
export class Song {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    readonly songtitel!: string;

    @Column('varchar', { length: 15 })
    readonly dauer: string | undefined;

    @Column('varchar')
    readonly feature: string | undefined;

    @ManyToOne(() => Album, (album) => album.songs)
    @JoinColumn({ name: 'album_id' })
    album: Album | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            songtitel: this.songtitel,
            dauer: this.dauer,
            feature: this.feature,
        });
}
