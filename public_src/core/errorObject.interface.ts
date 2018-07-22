import { IPtStop } from './ptStop.interface';

export interface IErrorObject {
  stop: IPtStop;
  corrected: string;
}
export interface IRefErrorObject {
  stop: IPtStop;
  corrected: string;
  totalConnectedRefs: number;
  missingConnectedRefs: number;
}

export interface IParentWayErrorObject {
  stop: IPtStop;
  corrected: string;
  totalConnectedRefs: number;
  missingConnectedRefs: number;
}

