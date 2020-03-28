import { Component, OnInit, ViewChild } from '@angular/core';

import { EditorComponent } from '../editor/editor.component';
import { TransporterComponent } from '../transporter/transporter.component';

import { ConfService } from '../../services/conf.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';

import { IOsmElement } from '../../core/osmElement.interface';

import { select } from '@angular-redux/store';
import { Observable } from 'rxjs';

import * as L from 'leaflet';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';

@Component({
  providers: [],
  selector: 'toolbar',
  styleUrls: [
    './toolbar.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './toolbar.component.html',
})
export class ToolbarComponent implements OnInit {
  downloading: boolean;
  htRadioModel: string;
  @ViewChild(TransporterComponent)
  transporterComponent: TransporterComponent;
  @ViewChild(EditorComponent) editorComponent: EditorComponent;
  filtering: boolean;

  currentElement: IOsmElement;
  stats = { s: 0, r: 0, a: 0, m: 0 };
  routeLabelShown = false;
  enableInfoRouteLabels = false;

  singleRelID = null;
  multipleRelsHighlightsAndIDs: Map<number, L.Polyline> = null;

  @select(['app', 'errorCorrectionMode']) readonly errorCorrectionMode$: Observable<string>;

  constructor(
    private confSrv: ConfService,
    private mapSrv: MapService,
    private overpassSrv: OverpassService,
    private processSrv: ProcessService,
    public storageSrv: StorageService,
    private hotkeysService: HotkeysService,
  ) {
    this.downloading = true;
    this.filtering = this.confSrv.cfgFilterLines;
    this.processSrv.refreshSidebarViews$.subscribe((data) => {
      if (data === 'tag') {
        console.log(
          'LOG (toolbar) Current selected element changed - ',
          data, this.currentElement, this.storageSrv.currentElement,
        );
        this.currentElement = this.storageSrv.currentElement;
      } else if (data === 'cancel selection') {
        this.currentElement = undefined;
        delete this.currentElement;
      }
    });
    this.storageSrv.stats.subscribe((data) => (this.stats = data));
    this.mapSrv.highlightTypeEmitter.subscribe((data) => {
      this.htRadioModel = data.highlightType;
    });
    this.mapSrv.enableInfoRouteLabelsOption.subscribe((data: {type: string, id: number, highlightFill: L.Polyline}) => {
        if (data && data.type === 'single') {
          this.singleRelID = data.id;
          this.enableInfoRouteLabels = true;
        }
        if (data && data.type === 'multiple') {
          if (!this.multipleRelsHighlightsAndIDs) {
            this.multipleRelsHighlightsAndIDs = new Map();
          }
          this.multipleRelsHighlightsAndIDs.set(data.id, data.highlightFill);
          this.enableInfoRouteLabels = true;
        }
        if (!data) {
        this.singleRelID = null;
        this.multipleRelsHighlightsAndIDs = null;
        this.routeLabelShown = false;
        this.enableInfoRouteLabels = false;
      }
    });
    this.hotkeysService.add([
      new Hotkey('d', (): boolean => {
        this.toggleDownloading();
        return false;
      }, undefined, 'Toggle downloading data')]);
  }

  ngOnInit(): void {
    this.mapSrv.disableMouseEvent('toggle-download');
    this.mapSrv.disableMouseEvent('toggle-filter');
    this.mapSrv.disableMouseEvent('toggle-edit');
    this.mapSrv.disableMouseEvent('edits-backward-btn');
    this.mapSrv.disableMouseEvent('edits-forward-btn');
    this.mapSrv.disableMouseEvent('edits-count');
  }

  highlightIsActive(): boolean {
    return this.mapSrv.highlightIsActive();
  }

  isRelation(): boolean {
    return this.currentElement && this.currentElement.type === 'relation';
  }

  toggleDownloading(): void {
    this.downloading = !this.downloading;
    if (this.downloading) {
      this.mapSrv.map.on('zoomend moveend', () => {
        this.overpassSrv.initDownloader(this.mapSrv.map);
      });
    } else if (!this.downloading) {
      this.mapSrv.map.off('zoomend moveend');
    }
  }

  showOptions(): void {
    document.getElementById('toggle-filter').style.display = 'inline';
    setTimeout(() => {
      document.getElementById('toggle-filter').style.display = 'none';
    }, 5000);
  }

  toggleLinesFilter(): void {
    this.confSrv.cfgFilterLines = !this.confSrv.cfgFilterLines;
    this.filtering = !this.filtering;
  }

  changeHighlight(): void {
    if (
      this.highlightIsActive() &&
      this.htRadioModel !== this.mapSrv.highlightType
    ) {
      this.mapSrv.highlightType = this.htRadioModel;
      this.processSrv.exploreRelation(
        this.storageSrv.elementsMap.get(this.currentElement.id),
        true,
        false,
        false,
      );
    }
  }

  showInfo(selection: object): void {
    alert(JSON.stringify(selection, null, '\t'));
  }

  cancelSelection(): void {
    delete this.currentElement;
    this.currentElement = undefined;
    this.processSrv.cancelSelection();
  }

  zoomTo(selection: IOsmElement): void {
    this.processSrv.zoomToElement(selection);
  }

  clearHighlight(): void {
    this.enableInfoRouteLabels = false;
    return this.mapSrv.clearHighlight(this.mapSrv.map);
  }

  getLoadAndZoomUrl(): void {
    const josmHref =
      'http://127.0.0.1:8111/load_and_zoom?' +
      'left=' + this.mapSrv.map.getBounds().getWest() +
      '&right=' + this.mapSrv.map.getBounds().getEast() +
      '&top=' + this.mapSrv.map.getBounds().getNorth() +
      '&bottom=' + this.mapSrv.map.getBounds().getSouth() +
      '&select=' + this.currentElement.type + this.currentElement.id;
    window.open(josmHref, '_blank');
  }

  openInIdEditor(selection: object): void {
    let zoomlevel = this.mapSrv.map.getZoom();
    if (zoomlevel <= 12) {
      zoomlevel = 13;
    }
    const idHref =
      'https://www.openstreetmap.org/edit?editor=id#map=' +
      zoomlevel + '/' +
      selection['lat'] + '/' +
      selection['lon'];
    window.open(idHref);
  }

  isDisabled(): boolean {
    return this.currentElement.id < 0;
  }

  /**
   * Handles toggling of route info labels
   */
  toggleRouteInfoLabels(): void {
   if (!this.routeLabelShown) {
     if (this.storageSrv.currentElement.type === 'node') {
       this.mapSrv.showMultipleRouteInfoLabels(this.multipleRelsHighlightsAndIDs);
     } else if (this.storageSrv.currentElement.type === 'relation') {
       this.mapSrv.showRouteInfoLabels(this.singleRelID);
     }
     this.routeLabelShown = true;
   }  else {
     this.mapSrv.clearSingleRouteInfoLabels();
     this.mapSrv.clearMultipleRouteInfoLabels();
     this.routeLabelShown = false;
   }
  }

  hasRef(): boolean {
    return this.storageSrv.currentElement.tags.ref !== undefined;
  }

  clear(): void {
    this.mapSrv.clearMultipleRouteInfoLabels();
  }
}
