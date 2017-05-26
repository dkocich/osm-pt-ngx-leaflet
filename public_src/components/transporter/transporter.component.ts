import {Component, ViewChild} from "@angular/core";
import {ModalDirective} from "ngx-bootstrap";

@Component({
    selector: "transporter",
    template: require<any>("./transporter.component.html"),
    styles: [
        require<any>("../toolbar/toolbar.component.less"),
        require<any>("./transporter.component.less"),
    ],
    providers: []
})
export class TransporterComponent {
    @ViewChild('downloadModal') public downloadModal:ModalDirective;
    @ViewChild('uploadModal') public uploadModal:ModalDirective;

    public showDownloadModal():void {
        this.downloadModal.show();
    }

    public hideDownloadModal():void {
        this.downloadModal.hide();
    }

    public showUploadModal():void {
        this.uploadModal.show();
    }

    public hideUploadModal():void {
        this.uploadModal.hide();
    }
}
