/// <reference path="./typings/require.d.ts"/>
/// <reference path="./typings/leaflet.vectorgrid.d.ts"/>

import "leaflet";
import "leaflet.vectorgrid";
import "zone.js/dist/zone";
import "zone.js/dist/long-stack-trace-zone";
import "reflect-metadata";

import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.css";
import "leaflet/dist/leaflet.css";

import Rollbar = require('rollbar');

import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {HttpModule} from "@angular/http";
import {ErrorHandler, Injectable, Injector, NgModule} from "@angular/core";
import {FormsModule}   from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";

import {NgbModule} from "@ng-bootstrap/ng-bootstrap";

import {AppComponent} from "./components/app/app.component";
import {NavigatorComponent} from "./components/navigator/navigator.component";
import {ToolbarComponent} from "./components/toolbar/toolbar.component";
import {RelationBrowserComponent} from "./components/sidebar/relation-browser.component";
import {TagBrowserComponent} from "./components/sidebar/tag-browser.component";
import {StopBrowserComponent} from "./components/sidebar/stop-browser.component";

import {MapService} from "./services/map.service";
import {GeocodingService} from "./services/geocoding.service";

const rollbarConfig = {
    accessToken: '63bf1bc9197847399cabf043c5552080',
    captureUncaught: true,
    captureUnhandledRejections: true,
};

@Injectable()
export class RollbarErrorHandler implements ErrorHandler {
    constructor(private injector: Injector) { }
    handleError(err:any) : void {
        var rollbar = this.injector.get(Rollbar);
        rollbar.error(err.originalStack || err);
    }
}

@NgModule({
    imports: [HttpModule, FormsModule, BrowserModule, NgbModule.forRoot()],
    bootstrap: [AppComponent],
    declarations: [
        AppComponent,
        NavigatorComponent,
        ToolbarComponent,
        RelationBrowserComponent,
        TagBrowserComponent,
        StopBrowserComponent,
    ],
    providers: [
        MapService,
        GeocodingService,
        { provide: ErrorHandler, useClass: RollbarErrorHandler },
        { provide: Rollbar,
          useFactory: () => {
            return new Rollbar(rollbarConfig)
          }
        }
    ]
})

export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);
