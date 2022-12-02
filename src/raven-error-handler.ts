import { ErrorHandler } from '@angular/core';
import * as Raven from 'raven-js';
import { Utils } from './core/utils.class';

if (Utils.isProductionDeployment()) {
  Raven.config(
    'https://6a8266c320b44a1890c43313027c1f2b@sentry.io/1199897'
  ).install();
}

export class RavenErrorHandler implements ErrorHandler {
  handleError(err: any): void {
    Raven.captureException(err);
  }
}
