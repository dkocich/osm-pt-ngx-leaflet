import { Component } from '@angular/core';

import { EditService } from '../../services/edit.service';
import { MapService } from '../../services/map.service';
import { ProcessService } from '../../services/process.service';
import { StorageService } from '../../services/storage.service';
import { DragulaService } from 'ng2-dragula';

import { IPtRelation } from '../../core/ptRelation.interface';
import { IPtStop } from '../../core/ptStop.interface';

@Component({
  providers: [],
  selector: 'stop-browser',
  styles: [
    require<any>('./stop-browser.component.less'),
    require<any>('../../styles/main.less'),
  ],
  templateUrl: './stop-browser.component.html',
})
export class StopBrowserComponent {
  public listOfStopsForRoute: object[] = this.storageSrv.listOfStopsForRoute;
  private currentElement: any;
  private listOfStops: object[] = this.storageSrv.listOfStops;
  private filteredView: boolean;
  private editingMode: boolean;

  constructor(
    private dragulaSrv: DragulaService,
    private editSrv: EditService,
    private mapSrv: MapService,
    private processSrv: ProcessService,
    private storageSrv: StorageService,
  ) {
    dragulaSrv.drop.subscribe((value) => {
      this.onDrop(value.slice(1));
    });
  }

  ngOnInit(): void {
    this.processSrv.showStopsForRoute$.subscribe((data) => {
      this.filteredView = data;
    });

    this.processSrv.refreshSidebarViews$.subscribe((data) => {
      if (data === 'stop') {
        this.listOfStopsForRoute = this.storageSrv.listOfStopsForRoute;
        this.currentElement = this.storageSrv.currentElement;
        console.log(this.currentElement, this.listOfStopsForRoute);
      } else if (data === 'tag') {
        this.currentElement = this.storageSrv.currentElement;
      } else if (data === 'cancel selection') {
        this.listOfStopsForRoute = undefined;
        delete this.listOfStopsForRoute;
        this.currentElement = undefined;
        delete this.currentElement;
        this.filteredView = false;
      }
    });

    this.editSrv.editingMode.subscribe((data) => {
        console.log(
          'LOG (stop-browser) Editing mode change in stopBrowser - ',
          data,
        );
        this.editingMode = data;
      },
    );
  }

  private isDownloaded(nodeId: number): boolean {
    return this.storageSrv.elementsDownloaded.has(nodeId);
  }

  private reorderMembers(rel: IPtRelation): void {
    this.editSrv.reorderMembers(rel);
  }

  private createChange(): void {
    const type = 'change members';
    let elementsWithoutRole = this.currentElement['members'].filter((member) => {
      return member['role'] === '';
    });
    let change = {
      from: JSON.parse(JSON.stringify(this.currentElement['members'])),
      to: JSON.parse(
        JSON.stringify([...this.listOfStopsForRoute, ...elementsWithoutRole]),
      ),
    };
    this.editSrv.addChange(this.currentElement, type, change);
  }

  private onDrop(args: any): void {
    if (this.currentElement.type !== 'relation') {
      return alert('Current element has incorrent type. Select relation one more time please.');
    }
    this.createChange();
  }

  private cancelFilter(): void {
    this.processSrv.activateFilteredStopView(false);
  }

  private exploreStop($event: any, stop: IPtStop): void {
    this.processSrv.exploreStop(stop, true, true, true);
  }

  private reorderingEnabled(): boolean {
    if (this.currentElement) {
      return this.currentElement.type === 'relation' && this.filteredView;
    } else {
      return false;
    }
  }

  private isSelected(relId: number): boolean {
    return this.processSrv.haveSameIds(relId, this.currentElement.id);
  }

  /**
   * NgFor track function which helps to re-render rows faster.
   *
   * @param index
   * @param item
   * @returns {number}
   */
  private trackByFn(index: number, item: any): number {
    return item.id;
  }
}
