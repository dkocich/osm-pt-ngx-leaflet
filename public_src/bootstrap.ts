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
import "angular2-busy/build/style/busy.css";

import Raven = require("raven-js");

import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {HttpModule} from "@angular/http";
import {ErrorHandler, NgModule} from "@angular/core";
import {FormsModule}   from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {AccordionModule, CarouselModule, ModalModule} from "ngx-bootstrap";

import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {BusyModule} from "angular2-busy";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

import {AppComponent} from "./components/app/app.component";
import {NavigatorComponent} from "./components/navigator/navigator.component";
import {ToolbarComponent} from "./components/toolbar/toolbar.component";
import {RelationBrowserComponent} from "./components/sidebar/relation-browser.component";
import {TagBrowserComponent} from "./components/sidebar/tag-browser.component";
import {RouteBrowserComponent} from "./components/sidebar/route-browser.component";
import {StopBrowserComponent} from "./components/sidebar/stop-browser.component";
import {TransporterComponent} from "./components/transporter/transporter.component";
import {AuthComponent} from "./components/auth/auth.component";
import {EditorComponent} from "./components/editor/editor.component";

import {MapService} from "./services/map.service";
import {GeocodingService} from "./services/geocoding.service";
import {OverpassService} from "./services/overpass.service";
import {StorageService} from "./services/storage.service";
import {ProcessingService} from "./services/processing.service";
import {ConfigService} from "./services/config.service";
import {LoadingService} from "./services/loading.service";
import {EditingService} from "./services/editing.service";

import {KeysPipe} from "./components/pipes/keys.pipe";

Raven
    .config("https://6603d76a7ee14d6b8f2cee2680870187@sentry.io/183940")
    .install();

export class RavenErrorHandler implements ErrorHandler {
    handleError(err: any): void {
        Raven.captureException(err.originalError || err);
    }
}

@NgModule({
    imports: [AccordionModule.forRoot(), HttpModule, FormsModule, BrowserModule,
        ModalModule.forRoot(), CarouselModule.forRoot(), NgbModule.forRoot(),
        BusyModule, BrowserAnimationsModule],
    bootstrap: [AppComponent],
    declarations: [
        AppComponent,
        NavigatorComponent,
        ToolbarComponent,
        RelationBrowserComponent,
        TagBrowserComponent,
        RouteBrowserComponent,
        StopBrowserComponent,
        TransporterComponent,
        EditorComponent,
        AuthComponent,
        KeysPipe
    ],
    providers: [
        MapService,
        GeocodingService,
        OverpassService,
        StorageService,
        ProcessingService,
        ConfigService,
        LoadingService,
        EditingService,
        KeysPipe,
        {provide: ErrorHandler, useClass: RavenErrorHandler}
    ]
})

export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);
