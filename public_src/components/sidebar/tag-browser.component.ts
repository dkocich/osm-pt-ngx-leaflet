import {Component} from "@angular/core";

import {NgbModule} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: "tag-browser",
    template: require<any>("./tag-browser.component.html"),
    styles: [
        require<any>("./tag-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    providers: []
})
export class TagBrowserComponent {
}
