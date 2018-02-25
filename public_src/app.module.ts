import 'leaflet';
import 'leaflet.vectorgrid';
import 'reflect-metadata';
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';

import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BusyModule } from 'angular2-busy';
import { DragulaModule } from 'ng2-dragula';
import {
  AccordionModule,
  BsDropdownModule,
  ButtonsModule,
  CarouselModule,
  ModalModule,
  TooltipModule,
  TypeaheadModule,
} from 'ngx-bootstrap';

import { Angulartics2Module } from 'angulartics2';
import { Angulartics2Piwik } from 'angulartics2/piwik';

import { AppComponent } from './components/app/app.component';
import { AuthComponent } from './components/auth/auth.component';
import { LangComponent } from './components/lang/lang.component';
import { EditorComponent } from './components/editor/editor.component';
import { NavigatorComponent } from './components/navigator/navigator.component';
import { RelationBrowserComponent } from './components/sidebar/relation-browser.component';
import { RouteBrowserComponent } from './components/sidebar/route-browser.component';
import { StopBrowserComponent } from './components/sidebar/stop-browser.component';
import { TagBrowserComponent } from './components/sidebar/tag-browser.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { TransporterComponent } from './components/transporter/transporter.component';

import { AuthService } from './services/auth.service';
import { ConfService } from './services/conf.service';
import { EditService } from './services/edit.service';
import { GeocodeService } from './services/geocode.service';
import { LoadService } from './services/load.service';
import { MapService } from './services/map.service';
import { OverpassService } from './services/overpass.service';
import { ProcessService } from './services/process.service';
import { StorageService } from './services/storage.service';

import { KeysPipe } from './pipes/keys.pipe';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

const ROUTES: Routes = [
  { path: '', component: AppComponent },
];

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    AuthComponent,
    EditorComponent,
    LangComponent,
    NavigatorComponent,
    RelationBrowserComponent,
    RouteBrowserComponent,
    StopBrowserComponent,
    TagBrowserComponent,
    ToolbarComponent,
    TransporterComponent,

    KeysPipe,
  ],
  imports: [
    AccordionModule.forRoot(),
    Angulartics2Module.forRoot([Angulartics2Piwik]),
    BsDropdownModule.forRoot(),
    BrowserAnimationsModule,
    BrowserModule,
    BusyModule,
    ButtonsModule.forRoot(),
    CarouselModule.forRoot(),
    DragulaModule,
    FormsModule,
    HttpModule,
    HttpClientModule,
    ModalModule.forRoot(),
    RouterModule.forRoot(ROUTES),
    TooltipModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    TypeaheadModule.forRoot(),
  ],
  providers: [
    AuthService,
    ConfService,
    EditService,
    GeocodeService,
    LoadService,
    MapService,
    OverpassService,
    ProcessService,
    StorageService,

    KeysPipe,

    { provide: APP_BASE_HREF, useValue : '/' },
  ],
})
export class AppModule {}
