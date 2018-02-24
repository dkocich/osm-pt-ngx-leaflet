import { Component, ViewChild } from '@angular/core';

import { EditorComponent } from '../editor/editor.component';
import { TransporterComponent } from '../transporter/transporter.component';

import { ConfService } from '../../services/conf.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';

import { IOsmEntity } from '../../core/osmEntity.interface';

@Component({
  providers: [],
  selector: 'toolbar',
  styles: [
    require<any>('./toolbar.component.less'),
    require<any>('../../styles/main.less'),
  ],
  template: require<any>('./toolbar.component.html'),
})
export class ToolbarComponent {
  public downloading: boolean;
  public htRadioModel: string;
  @ViewChild(TransporterComponent)
  public transporterComponent: TransporterComponent;
  @ViewChild(EditorComponent) public editorComponent: EditorComponent;
  private filtering: boolean;

  private currentElement: IOsmEntity;
  private stats = { s: 0, r: 0, a: 0, m: 0 };

  constructor(
    private confSrv: ConfService,
    private mapSrv: MapService,
    private overpassSrv: OverpassService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
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
      }
    });
    this.storageSrv.stats.subscribe((data) => (this.stats = data));
    this.mapSrv.highlightTypeEmitter.subscribe((data) => {
      this.htRadioModel = data.highlightType;
    });
  }

  ngOnInit(): void {
    this.mapSrv.disableMouseEvent('toggle-download');
    this.mapSrv.disableMouseEvent('toggle-filter');
    this.mapSrv.disableMouseEvent('toggle-edit');
    this.mapSrv.disableMouseEvent('edits-backward-btn');
    this.mapSrv.disableMouseEvent('edits-forward-btn');
    this.mapSrv.disableMouseEvent('edits-count');
  }

  public Initialize(): void {
    this.mapSrv.map.on('zoomend moveend', () => {
      this.initDownloader();
    });
  }

  private changeHighlight(): void {
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

  private initDownloader(): void {
    if (this.checkDownloadRules()) {
      this.overpassSrv.requestNewOverpassData();
    }
  }

  private checkMinZoomLevel(): boolean {
    return this.mapSrv.map.getZoom() > this.confSrv.minDownloadZoom;
  }

  private checkMinDistance(): boolean {
    const lastDownloadCenterDistance = this.mapSrv.map
      .getCenter()
      .distanceTo(this.mapSrv.previousCenter);
    return lastDownloadCenterDistance > this.confSrv.minDownloadDistance;
  }

  private checkDownloadRules(): boolean {
    return this.checkMinZoomLevel() && this.checkMinDistance();
  }

  private toggleDownloading(): void {
    this.downloading = !this.downloading;
    if (this.downloading) {
      this.mapSrv.map.on('zoomend moveend', () => {
        this.initDownloader();
      });
    } else if (!this.downloading) {
      this.mapSrv.map.off('zoomend moveend');
    }
  }

  /**
   *
   * @param selection
   */
  private showInfo(selection: object): void {
    alert(JSON.stringify(selection, null, '\t'));
  }

  private cancelSelection(): void {
    delete this.currentElement;
    this.currentElement = undefined;
    this.processSrv.cancelSelection();
  }

  private isRelation(): boolean {
    return this.currentElement && this.currentElement.type === 'relation';
  }

  private zoomTo(selection: IOsmEntity): void {
    this.processSrv.zoomToElement(selection);
  }

  private showOptions(): void {
    document.getElementById('toggle-filter').style.display = 'inline';
    setTimeout(() => {
      document.getElementById('toggle-filter').style.display = 'none';
    }, 5000);
  }

  private toggleLinesFilter(): void {
    this.confSrv.cfgFilterLines = !this.confSrv.cfgFilterLines;
    this.filtering = !this.filtering;
  }

  private highlightIsActive(): boolean {
    return this.mapSrv.highlightIsActive();
  }

  private clearHighlight(): void {
    return this.mapSrv.clearHighlight();
  }

  private getLoadAndZoomUrl(): void {
    const josmHref =
      'http://127.0.0.1:8111/load_and_zoom?' +
      'left=' + this.mapSrv.map.getBounds().getWest() +
      '&right=' + this.mapSrv.map.getBounds().getEast() +
      '&top=' + this.mapSrv.map.getBounds().getNorth() +
      '&bottom=' + this.mapSrv.map.getBounds().getSouth() +
      '&select=' + this.currentElement.type + this.currentElement.id;
    window.open(josmHref, '_blank');
  }

  private isDisabled(): boolean {
    return this.currentElement.id < 0;
  }
}
