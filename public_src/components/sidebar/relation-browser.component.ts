import {Component} from "@angular/core";

@Component({
    selector: "relation-browser",
    template: require<any>("./relation-browser.component.html"),
    styles: [
        require<any>("./relation-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    providers: []
})
export class RelationBrowserComponent {
}
