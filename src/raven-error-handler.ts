import { ErrorHandler } from '@angular/core';
import * as Sentry from '@sentry/browser';
import { Utils } from './core/utils.class';

if (Utils.isProductionDeployment()) {
  Sentry.config(
    'https://6a8266c320b44a1890c43313027c1f2b@sentry.io/1199897',
  ).install();
}

export class RavenErrorHandler implements ErrorHandler {
  handleError(err): void {
    Sentry.captureException(err);
  }
}
