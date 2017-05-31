export interface IPtRelation {
    type: number;
    id: number;
    timestamp: string;
    version: number;
    changeset: number;
    user: string;
    uid: number;
    members: object[];
    tags: object;
}
