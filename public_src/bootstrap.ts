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

import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {HttpModule} from "@angular/http";
import {NgModule} from "@angular/core";
import {FormsModule}   from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {AccordionModule, ModalModule} from "ngx-bootstrap";

import {NgbModule} from "@ng-bootstrap/ng-bootstrap";

import {AppComponent} from "./components/app/app.component";
import {NavigatorComponent} from "./components/navigator/navigator.component";
import {ToolbarComponent} from "./components/toolbar/toolbar.component";
import {RelationBrowserComponent} from "./components/sidebar/relation-browser.component";
import {TagBrowserComponent} from "./components/sidebar/tag-browser.component";
import {RouteBrowserComponent} from "./components/sidebar/route-browser.component";
import {StopBrowserComponent} from "./components/sidebar/stop-browser.component";
import {TransporterComponent} from "./components/transporter/transporter.component";

import {MapService} from "./services/map.service";
import {GeocodingService} from "./services/geocoding.service";
import {OverpassService} from "./services/overpass.service";
import {StorageService} from "./services/storage.service";
import {ProcessingService} from "./services/processing.service";

import {KeysPipe} from "./components/pipes/keys.pipe";

@NgModule({
    imports: [AccordionModule.forRoot(), HttpModule, FormsModule, BrowserModule,
        ModalModule.forRoot(), NgbModule.forRoot()],
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
        KeysPipe
    ],
    providers: [
        MapService,
        GeocodingService,
        OverpassService,
        StorageService,
        ProcessingService,
        KeysPipe
    ]
})

export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);
