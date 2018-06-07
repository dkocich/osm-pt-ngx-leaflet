import { Component, OnInit } from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';

@Component({
  selector: 'app-modal2',
  templateUrl: './modal2.component.html',
  styleUrls: ['./modal2.component.css'],
})
export class Modal2Component implements OnInit {

  constructor(public bsModalRef: BsModalRef) { }

  ngOnInit() {
  }
  private ok(): any {
    // this.bsModalRef.hide();
  }
}
