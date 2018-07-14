import { Injectable } from '@angular/core';

@Injectable()
export class AutoTasksService {
  public map;
  constructor(
  ){

  }


  public onShownModal(): any{
    // document.getElementById('map2').style.height = '95%';
      // ..style.height = '90vh';
    // console.log('on shown', document.getElementsByClassName('modal-content')[0]);

    this.map.invalidateSize();
  }

  public onShowModal(): any{
    // let x = document.getElementsByClassName('modal-content')[0];
    // console.log('on show', x);

    // document.getElementById('map2').style.height = '90%';

  }
}
