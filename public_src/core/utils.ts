export class Utils {
  constructor() {
    //
  }

  public static isProductionDeployment(): boolean {
    return ['osm-pt.herokuapp.com', 'osm-pt-dev.herokuapp.com'].indexOf(window.location.hostname) > -1;
  }
}
