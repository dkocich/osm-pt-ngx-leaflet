import {Component, ViewChild} from "@angular/core";
import {MapService} from "../../services/map.service";
import {TransporterComponent} from "../transporter/transporter.component";

@Component({
    selector: "toolbar",
    template: require<any>("./toolbar.component.html"),
    styles: [
        require<any>("./toolbar.component.less"),
        require<any>("../../styles/main.less")
    ],
    providers: []
})
export class ToolbarComponent {

    @ViewChild(TransporterComponent) transporterComponent: TransporterComponent;

    constructor(private mapService: MapService) {
    }

    ngOnInit() {
    }

    Initialize() {
    }
}
