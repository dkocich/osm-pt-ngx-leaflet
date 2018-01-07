import { IOsmEntity } from "./osmEntity.interface";
import { IPtMember } from "./ptMember";
export interface IPtRelationNew extends IOsmEntity {
  type: "relation";
  members: IPtMember[];
  tags: {
    type: "route",
    route: string,
    ref: string,
    network: string,
    operator: string,
    name: string,
    from: string,
    to: string,
    wheelchair: "yes" | "no" | "limited" | "designated" | "",
    colour: string,
    "public_transport:version": "2",
  };
}
