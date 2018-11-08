import 'leaflet';
import 'leaflet.vectorgrid';
import 'reflect-metadata';
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';

import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DragulaModule } from 'ng2-dragula';
import {
  AccordionModule,
  BsDropdownModule,
  ButtonsModule,
  CarouselModule,
  ModalModule,
  TooltipModule,
  TypeaheadModule,
  SortableModule,
  TabsModule,
} from 'ngx-bootstrap';
import { HotkeyModule } from 'angular2-hotkeys';

import { Angulartics2Module } from 'angulartics2';
import { Angulartics2Piwik } from 'angulartics2/piwik';
import { NgHttpLoaderModule } from 'ng-http-loader';
import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from './components/app/app.component';
import { AuthComponent } from './components/auth/auth.component';
import { BeginnerComponent } from './components/beginner/beginner.component';
import { EditorComponent } from './components/editor/editor.component';
import { ExpertComponent } from './components/expert/expert.component';
import { LangComponent } from './components/lang/lang.component';
import { ModalComponent } from './components/modal/modal.component';
import { NavigatorComponent } from './components/navigator/navigator.component';
import { RelationBrowserComponent } from './components/sidebar/relation-browser.component';
import { RouteBrowserComponent } from './components/sidebar/route-browser.component';
import { SettingsComponent } from './components/settings/settings.component';
import { StopBrowserComponent } from './components/sidebar/stop-browser.component';
import { TagBrowserComponent } from './components/sidebar/tag-browser.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { TransporterComponent } from './components/transporter/transporter.component';
import { ValidationBrowserComponent } from './components/sidebar/validation-browser.component';
import { RouteWizardComponent } from './components/route-wizard/route-wizard.component';
import { RouteMasterWizardComponent } from './components/route-master-wizard/route-master-wizard.component';

import { AuthService } from './services/auth.service';
import { ConfService } from './services/conf.service';
import { DbService } from './services/db.service';
import { EditService } from './services/edit.service';
import { ErrorHighlightService } from './services/error-highlight.service';
import { GeocodeService } from './services/geocode.service';
import { MapService } from './services/map.service';
import { OverpassService } from './services/overpass.service';
import { ProcessService } from './services/process.service';
import { StorageService } from './services/storage.service';
import { WarnService } from './services/warn.service';
import { RouteWizardService } from './services/route-wizard.service';
import { RouteMasterWizardService } from './services/route-master-wizard.service';
import { TutorialService } from './services/tutorial.service';

import { KeysPipe } from './pipes/keys.pipe';

import { StoreModule } from './store/module';

import { AppActions } from './store/app/actions';
import { RootEpics } from './store/epics';

import { RavenErrorHandler } from './raven-error-handler';

import { Utils } from './core/utils.class';
import {TutorialsComponent} from './components/tutorials/tutorials.component';

export function HttpLoaderFactory(http: HttpClient): any {
  return new TranslateHttpLoader(http);
}

const ROUTES: Routes = [
  { path: '', component: AppComponent },
];

const conditional_providers = [
  Utils.isProductionDeployment() ? { provide: ErrorHandler, useClass: RavenErrorHandler } : [],
];

@NgModule({
  bootstrap: [AppComponent],
  entryComponents: [RouteWizardComponent, AppComponent, ModalComponent, RouteMasterWizardComponent],
  declarations: [
    AppComponent,
    AuthComponent,
    BeginnerComponent,
    EditorComponent,
    ExpertComponent,
    LangComponent,
    ModalComponent,
    NavigatorComponent,
    RelationBrowserComponent,
    RouteBrowserComponent,
    StopBrowserComponent,
    TagBrowserComponent,
    ToolbarComponent,
    TransporterComponent,
    SettingsComponent,
    RouteWizardComponent,
    ValidationBrowserComponent,
    RouteMasterWizardComponent,
    TutorialsComponent,

    KeysPipe,
  ],
  imports: [
    AccordionModule.forRoot(),
    Angulartics2Module.forRoot([Angulartics2Piwik]),
    BsDropdownModule.forRoot(),
    BrowserAnimationsModule,
    BrowserModule,
    ButtonsModule.forRoot(),
    CarouselModule.forRoot(),
    DragulaModule,
    FormsModule,
    HttpClientModule,
    ModalModule.forRoot(),
    NgHttpLoaderModule,
    TooltipModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    TypeaheadModule.forRoot(),
    RouterModule.forRoot(ROUTES),
    StoreModule,
    ToastrModule.forRoot({
      timeOut: 2000,
      positionClass: 'toast-bottom-right',
      maxOpened: 1,
    }),
    SortableModule.forRoot(),
    TabsModule.forRoot(),
    ReactiveFormsModule,
    HotkeyModule.forRoot(),
  ],
  providers: [
    ...conditional_providers,

    AuthService,
    ConfService,
    DbService,
    EditService,
    ErrorHighlightService,
    GeocodeService,
    MapService,
    OverpassService,
    ProcessService,
    StorageService,
    WarnService,
    RouteWizardService,
    RouteMasterWizardService,
    TutorialService,

    KeysPipe,

    { provide: APP_BASE_HREF, useValue : '/' },

    AppActions,
    RootEpics,
  ],
})
export class AppModule { }
