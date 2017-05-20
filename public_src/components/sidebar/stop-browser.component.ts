import {Component} from "@angular/core";

@Component({
    selector: "stop-browser",
    template: require<any>("./stop-browser.component.html"),
    styles: [
        require<any>("./stop-browser.component.less"),
        require<any>("../../styles/main.less")
    ],
    providers: []
})
export class StopBrowserComponent {
}
