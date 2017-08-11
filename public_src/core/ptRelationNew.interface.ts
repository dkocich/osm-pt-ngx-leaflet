import { IOsmEntity } from "./osmEntity.interface";
export interface IPtRelationNew extends IOsmEntity {
    type: "relation";
    members: undefined[];
    tags: {
        type: "route",
        route: string,
        ref: number,
        network: string,
        operator: string,
        name: string,
        from: string,
        to: string,
        wheelchair: "yes" | "no" | "limited" | "",
        colour: string,
        "public_transport:version": 2
    };
}
