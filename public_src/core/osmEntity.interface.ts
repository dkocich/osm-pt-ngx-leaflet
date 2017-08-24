export interface IOsmEntity {
    type: string;
    id: number;
    timestamp: string;
    version: number;
    changeset: number;
    user: string;
    uid: number;
    tags: any;
}
