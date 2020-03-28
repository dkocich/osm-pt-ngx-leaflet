import { select } from '@angular-redux/store';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { ModalDirective } from 'ngx-bootstrap';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { MapService } from '../../services/map.service';
import { OverpassService } from '../../services/overpass.service';
import { StorageService } from '../../services/storage.service';

@Component({
  providers: [],
  selector: 'transporter',
  styleUrls: [
    '../toolbar/toolbar.component.less',
    './transporter.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './transporter.component.html',
})
export class TransporterComponent implements OnInit {
  @ViewChild('downloadModal') downloadModal: ModalDirective;
  @ViewChild('uploadModal') uploadModal: ModalDirective;
  @select(['app', 'tutorialMode']) readonly tutorialMode$: Observable<string>;

  favoriteQueries = [
    {
      id: 1,
      raw: '%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A(%0A%20%20node%5B%22route%22%3D%22bus%22' +
      '%5D(%7B%7Bbbox%7D%7D)%3B%0A%20%20way%5B%22route%22%3D%22bus%22%5D(%7B%7Bbbox%7D%7D)%3B' +
      '%0A%20%20relation%5B%22route%22%3D%22bus%22%5D(%7B%7Bbbox%7D%7D)%3B%0A)%3B%0Aout%20body' +
      '%3B%0A%3E%3B%0Aout%20skel%20qt%3B',
      short: 'route=bus',
    },
    {
      id: 2,
      raw: '%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A(%0A%20%20node%5B%22route%22%3D%22bus%22%5D(' +
      '%7B%7Bbbox%7D%7D)%3B%0A%20%20way%5B%22route%22%3D%22bus%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20' +
      '%20relation%5B%22route%22%3D%22bus%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20%20node%5B%22highway' +
      '%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20%20way%5B%22highway%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20' +
      '%20relation%5B%22highway%22%5D(%7B%7Bbbox%7D%7D)%3B%0A)%3B%0Aout%20body%3B%0A%3E%3B%0Aout' +
      '%20skel%20qt%3B',
      short: 'route=bus OR highway=*',
    },
    {
      id: 3,
      raw: '%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A%28%0A%20%20node%5B%22public_transport%22%5D' +
      '%28%7B%7Bbbox%7D%7D%29%3B%0A%20%20way%5B%22public_transport%22%5D%28%7B%7Bbbox%7D%7D%29' +
      '%3B%0A%20%20relation%5B%22public_transport%22%5D%28%7B%7Bbbox%7D%7D%29%3B%0A%29%3B%0Aout' +
      '%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B',
      short: 'public_transport=*',
    },
  ];
  queryShort = this.favoriteQueries[0].short;
  queryRaw = decodeURIComponent(this.favoriteQueries[0].raw);
  editsSummary;

  comment: string = '';

  source: string = '';
  constructor(
    private authSrv: AuthService,
    private mapSrv: MapService,
    private overpassSrv: OverpassService,
    private storageSrv: StorageService,
    private hotkeysService: HotkeysService,
  ) {
    this.hotkeysService.add([
      new Hotkey('s', (): boolean => {
        this.uploadData();
        return false;
      }, undefined, 'Upload data to OSM')]);
  }

  ngOnInit(): void {
    this.mapSrv.disableMouseEvent('download-data');
    this.mapSrv.disableMouseEvent('upload-data');
    this.storageSrv.editsChanged.subscribe(
      /**
       * @param data - data event is true when storageSrv.edits change
       */
      (data) => {
        if (data) {
          this.editsSummary = this.storageSrv.edits;
        }
      },
    );
  }

  showDownloadModal(): void {
    this.downloadModal.show();
    this.mapSrv.disableMouseEvent('modalDownload');
  }

  hideDownloadModal(): void {
    this.downloadModal.hide();
  }

  showUploadModal(): void {
    this.uploadModal.show();
    this.mapSrv.disableMouseEvent('modalUpload');
  }

  hideUploadModal(): void {
    this.uploadModal.hide();
  }

  isAuthenticated(): boolean {
    return this.authSrv.oauth.authenticated();
  }

  hasEdits(): boolean {
    return this.storageSrv.edits.length > 0;
  }

  requestData(requestBody: string): void {
    this.overpassSrv.requestOverpassData(requestBody);
    this.hideDownloadModal();
  }

  verifyUpload(): void {
    this.overpassSrv.uploadData(
      { source: 'test upload source', comment: 'test upload comment' },
      true,
    );
  }

  uploadData(): void {
    this.overpassSrv.uploadData({
      comment: this.comment,
      source: this.source,
    });
  }

  downloading(): boolean {
    return true;
  }

  setQuery(event: any): void {
    this.queryShort = event.target.textContent;
    const filtered = this.favoriteQueries.filter((iter) => {
      return iter.short === event.target.textContent;
    });
    this.queryRaw = decodeURIComponent(filtered[0].raw);
  }
}
