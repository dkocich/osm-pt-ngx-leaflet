import { Component, OnInit, ViewChildren } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { EditService } from '../../services/edit.service';
import { StorageService } from '../../services/storage.service';
import { MapService } from '../../services/map.service';
import { WarnService } from '../../services/warn.service';

@Component({
  selector: 'modal-content',
  styleUrls: [
    './modal.component.less',
    '../../styles/main.less',
  ],
  templateUrl: './modal.component.html',
})

export class ModalComponent implements OnInit {
  constructor(public bsModalRef: BsModalRef,
              private editSrv: EditService,
              private storageSrv: StorageService,
              private mapSrv: MapService,
              private warnSrv: WarnService) {}

  public name: string ;
  public refArr: Map <any, any>;
  public arr = [];
  public error: string;
  public addedRef: any[] = [];
  public removedSuggestions: any[] = [];
  public addedSuggestions: any[] = [];
  public newValue: any;
  @ViewChildren('chosenRef') chosenRefS ;
  @ViewChildren('v') newlyAddedValue ;

  public ngOnInit(): void {
    if (this.error === 'missing ref tag') {
      this.arr = Array.from(this.refArr);
    }
  }

   /***
   * Handles adding missing name
   * @param {string} name
   */
  private createChangeForNameTag(name: string): void {
    let change: object;
    if (name !== '') {
      this.storageSrv.currentElement.tags['name'] = name;
      change = {
        key: 'name',
        value: name,
      };
      this.editSrv.addChange(this.storageSrv.currentElement, 'add tag', change);
    }
  }

  /***
   *  Handles adding missing refs
   * @param {string} ref
   */
  private createChangeForRefTag(ref: string): void {
    let change: object;
    if (ref !== '') {
      this.storageSrv.currentElement.tags['ref'] = ref;
      change = {
        key: 'ref',
        value: ref,
      };
      this.editSrv.addChange(this.storageSrv.currentElement, 'add tag', change);
    }
  }

  /***
   * Executed on click of save button for adding new name tag
   * @param {string} name
   * @returns {void}
   */
  private saveNameTag(name: string): void {
    this.createChangeForNameTag(name);
    this.bsModalRef.hide();
    let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
    MapService.addHoverListenersToPopUp(popUpElement);
    this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId);
    this.warnSrv.showGenericSuccess();
  }

  /***
   * Closes the currently opened modal
   * @returns {void}
   */
  private close(): void {
    this.bsModalRef.hide();
  }

  /***
   * Executed on click of save button for adding ref
   * @returns {void}
   */
  private saveRefTag(): void {
   let resultArr = this.addedSuggestions.concat(this.addedRef);
   let refString: string = '';
   resultArr.forEach((item, index) => {
   refString = (index !== resultArr.length - 1) ? refString + item + ', ' : refString + item;
   });
   this.createChangeForRefTag(name);
   this.bsModalRef.hide();
   let popUpElement = this.mapSrv.getPopUpFromArray(this.mapSrv.currentPopUpFeatureId);
   MapService.addHoverListenersToPopUp(popUpElement);
   this.mapSrv.popUpArr = this.mapSrv.popUpArr.filter((popup) => popup['_leaflet_id'] !== this.mapSrv.currentPopUpFeatureId);
   this.warnSrv.showGenericSuccess();
  }

  /***
   * Adds new ref value
   * @param ref
   */
  private addNewRefValue(ref: string): void {
   if (ref !== '') {
     this.addedRef.push(ref);
   } else {
     alert('Please enter a numeric value');
   }
   this.newlyAddedValue.first.nativeElement.value = '';
  }

  /***
   * Adds suggested ref value to ref list
   * @param ref
   * @returns {void}
   */
  private addSuggestedRefValue(ref: any): void {
      this.addedSuggestions.push(ref);
      this.arr.forEach((item, ind) => {
        if (item[0] === ref) {
          this.removedSuggestions = this.removedSuggestions.concat(this.arr.splice(ind, 1));
        }
    });
  }

  /***
   * Remove the added ref value (newly added by user)
   * @param ref
   */
  private removeAddedNewRefValue(ref: any): void {
    let index = this.addedRef.indexOf(ref);
    if (index > -1) {
      this.addedRef.splice(index, 1);
    }
  }

  /***
   * Remove the added ref value (added from suggestions by user)
   * @param ref
   */
  private removeAddedSuggestedRefValue(ref: any): void {
    let index = this.addedSuggestions.indexOf(ref);
    if (index > -1) {
      this.addedSuggestions.splice(index, 1);
    }
    for (let key of this.removedSuggestions) {
      if (key[0] === ref) {
        this.arr.push(key);
        break;
      }
    }
  }
}
