import { IPtStop } from './ptStop.interface';

export interface INameErrorObject {
  stop: IPtStop;
  corrected: string;
}

export interface IRefErrorObject {
  stop: IPtStop;
  corrected: string;
  totalConnectedRefs: number;
  missingConnectedRefs: number;
}

export interface IWayErrorObject {
  stop: IPtStop;
  corrected: string;
  wayIDs: number[];
}

export interface IPTvErrorObject {
  stop: IPtStop;
  corrected: string;
}

export interface IPTPairErrorObject {
  stop: IPtStop;
  corrected: string;
}
