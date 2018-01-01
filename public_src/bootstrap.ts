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

import { enableProdMode, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { BrowserModule } from "@angular/platform-browser";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BusyModule } from "angular2-busy";
import { DragulaModule } from "ng2-dragula";
import {
  AccordionModule,
  ButtonsModule,
  CarouselModule,
  ModalModule,
  TooltipModule,
  TypeaheadModule
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

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    AuthComponent,
    EditorComponent,
    NavigatorComponent,
    RelationBrowserComponent,
    RouteBrowserComponent,
    StopBrowserComponent,
    TagBrowserComponent,
    ToolbarComponent,
    TransporterComponent,

    KeysPipe
  ],
  imports: [
    AccordionModule.forRoot(),
    BrowserAnimationsModule,
    BrowserModule,
    BusyModule,
    ButtonsModule.forRoot(),
    CarouselModule.forRoot(),
    DragulaModule,
    FormsModule,
    HttpModule,
    ModalModule.forRoot(),
    TooltipModule.forRoot(),
    TypeaheadModule.forRoot()
  ],
  providers: [
    AuthService,
    ConfigService,
    EditingService,
    GeocodingService,
    LoadingService,
    MapService,
    OverpassService,
    ProcessingService,
    StorageService,

    KeysPipe
  ]
})
export class AppModule {}

if (window.location.hostname !== "localhost") {
  enableProdMode(); // run angular development mode outside testing environment
}
platformBrowserDynamic().bootstrapModule(AppModule);
