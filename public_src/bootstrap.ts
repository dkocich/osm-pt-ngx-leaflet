import 'leaflet';
import 'leaflet.vectorgrid';
import 'reflect-metadata';
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';

import 'angular2-busy/build/style/busy.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'dragula/dist/dragula.css';
import 'font-awesome/css/font-awesome.css';
import 'leaflet/dist/leaflet.css';
import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { enableProdMode, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { DBModule } from '@ngrx/db';
import {
  StoreRouterConnectingModule,
  RouterStateSerializer,
} from '@ngrx/router-store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

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

    /**
     * StoreModule.forRoot is imported once in the root module, accepting a reducer
     * function or object map of reducer functions. If passed an object of
     * reducers, combineReducers will be run creating your application
     * meta-reducer. This returns all providers for an @ngrx/store
     * based application.
     */
    StoreModule.forRoot(reducers, { metaReducers }),

    /**
     * @ngrx/router-store keeps router state up-to-date in the store.
     */
    StoreRouterConnectingModule.forRoot({
      /*
        They stateKey defines the name of the state used by the router-store reducer.
        This matches the key defined in the map of reducers
      */
      stateKey: 'router',
    }),

    /**
     * Store devtools instrument the store retaining past versions of state
     * and recalculating new states. This enables powerful time-travel
     * debugging.
     *
     * To use the debugger, install the Redux Devtools extension for either
     * Chrome or Firefox
     *
     * See: https://github.com/zalmoxisus/redux-devtools-extension
     */
    StoreDevtoolsModule.instrument({
      name: 'NgRx Book Store DevTools',
      logOnly: environment.production,
    }),

    /**
     * EffectsModule.forRoot() is imported once in the root module and
     * sets up the effects class to be initialized immediately when the
     * application starts.
     *
     * See: https://github.com/ngrx/platform/blob/master/docs/effects/api.md#forroot
     */
    EffectsModule.forRoot([]),

    /**
     * `provideDB` sets up @ngrx/db with the provided schema and makes the Database
     * service available.
     */
    DBModule.provideDB(schema),

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

if (module.hot) {
  module.hot.accept();
  console.log('[HMR] Accepting module hot update.');
  const applicationTagName = 'app';
  tryRemoveApplicationNode(applicationTagName);
  tryBootstrapNewApplication(applicationTagName);
}

function tryRemoveApplicationNode(tagName: string): void {
  const currentApplicationNode = document.getElementsByTagName(tagName)[0];
  if (currentApplicationNode) {
    const parent = currentApplicationNode.parentNode;
    parent.removeChild(currentApplicationNode);
  }
}

function tryBootstrapNewApplication(tagName: string): void {
  const newNode = document.createElement(tagName);
  document.getElementsByTagName('body')[0].insertAdjacentElement('beforeend', newNode);

  const bootstrap: any = require('./bootstrap');
  const newAppModule = bootstrap.AppModule;
  platformBrowserDynamic().bootstrapModule(newAppModule);
}

if (window.location.hostname !== 'localhost' || process.env.NODE_ENV === 'production') {
  enableProdMode(); // run angular development mode outside testing environment
}
platformBrowserDynamic().bootstrapModule(AppModule);
