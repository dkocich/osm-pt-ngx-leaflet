export interface IMetadata {
  id:                       number;
  timestamp:                number;
  type:                     string;

  // for stop/platforms: all parent routes have been downloaded?,
  // for routes: all members have been downloaded?
  isCompletelyDownloaded?:  number;
  parentRoutes?:            number[]; // only for routes
  memberStops?:             number[]; // only for stops
  memberPlatforms?:         number[]; // only for platforms
  isQueriedForMasters?:     number;   // only for routes
}
