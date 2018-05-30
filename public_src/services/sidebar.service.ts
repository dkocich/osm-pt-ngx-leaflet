import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class SidebarService {
  private beginnerViewSource = new Subject<string>();
  beginnerView$ = this.beginnerViewSource.asObservable();
  public changeBeginnerView(view: string): any {
    this.beginnerViewSource.next(view);
  }
}
