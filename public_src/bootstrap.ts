/// <reference path="./typings/require.d.ts"/>
/// <reference path="./typings/leaflet.vectorgrid.d.ts"/>

import "leaflet";
import "leaflet.vectorgrid";
import "reflect-metadata";
import "zone.js/dist/zone";
import "zone.js/dist/long-stack-trace-zone";

import "angular2-busy/build/style/busy.css";
import "bootstrap/dist/css/bootstrap.css";
import "dragula/dist/dragula.css";
import "font-awesome/css/font-awesome.css";
import "leaflet/dist/leaflet.css";

import Raven = require("raven-js");

import { ErrorHandler, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { BrowserModule } from "@angular/platform-browser";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BusyModule } from "angular2-busy";
import { DragulaModule } from "ng2-dragula";
import {
    AccordionModule, ButtonsModule, CarouselModule, ModalModule, TooltipModule, TypeaheadModule
} from "ngx-bootstrap";

import { AppComponent } from "./components/app/app.component";
import { AuthComponent } from "./components/auth/auth.component";
import { EditorComponent } from "./components/editor/editor.component";
import { NavigatorComponent } from "./components/navigator/navigator.component";
import { RelationBrowserComponent } from "./components/sidebar/relation-browser.component";
import { RouteBrowserComponent } from "./components/sidebar/route-browser.component";
import { StopBrowserComponent } from "./components/sidebar/stop-browser.component";
import { TagBrowserComponent } from "./components/sidebar/tag-browser.component";
import { ToolbarComponent } from "./components/toolbar/toolbar.component";
import { TransporterComponent } from "./components/transporter/transporter.component";

import { AuthService } from "./services/auth.service";
import { ConfigService } from "./services/config.service";
import { EditingService } from "./services/editing.service";
import { GeocodingService } from "./services/geocoding.service";
import { LoadingService } from "./services/loading.service";
import { MapService } from "./services/map.service";
import { OverpassService } from "./services/overpass.service";
import { ProcessingService } from "./services/processing.service";
import { StorageService } from "./services/storage.service";

import { KeysPipe } from "./components/pipes/keys.pipe";

if (!(window.location.href).indexOf("localhost")) {
    Raven
        .config("https://6603d76a7ee14d6b8f2cee2680870187@sentry.io/183940")
        .install();
}

export class RavenErrorHandler implements ErrorHandler {
    public handleError(err: any): void {
        Raven.captureException(err.originalError || err);
    }
}

@NgModule({
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
    imports: [AccordionModule.forRoot(), HttpModule, FormsModule, BrowserModule,
        ModalModule.forRoot(), CarouselModule.forRoot(),
        BusyModule, BrowserAnimationsModule, DragulaModule, TooltipModule.forRoot(),
        ButtonsModule.forRoot(), TypeaheadModule.forRoot() ],
    providers: [
        MapService,
        GeocodingService,
        OverpassService,
        StorageService,
        ProcessingService,
        ConfigService,
        LoadingService,
        EditingService,
        AuthService,
        KeysPipe,
        { provide: ErrorHandler, useClass: RavenErrorHandler }
    ]
})

export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);
