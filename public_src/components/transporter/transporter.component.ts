import {Component, PipeTransform, ViewChild} from "@angular/core";
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
    private favoriteQueries = [
        {id: 1, short: "route=bus", raw: "%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A(%0A%20%20node%5B%22route%22%3D%22bus%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20%20way%5B%22route%22%3D%22bus%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20%20relation%5B%22route%22%3D%22bus%22%5D(%7B%7Bbbox%7D%7D)%3B%0A)%3B%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B"},
        {id: 2, short: "route=bus OR highway=*", raw: "%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A(%0A%20%20node%5B%22route%22%3D%22bus%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20%20way%5B%22route%22%3D%22bus%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20%20relation%5B%22route%22%3D%22bus%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20%20node%5B%22highway%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20%20way%5B%22highway%22%5D(%7B%7Bbbox%7D%7D)%3B%0A%20%20relation%5B%22highway%22%5D(%7B%7Bbbox%7D%7D)%3B%0A)%3B%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B"}
    ];
    private queryShort = this.favoriteQueries[0].short;
    private queryRaw = decodeURIComponent(this.favoriteQueries[0].raw);


    setQuery(event) {
        this.queryShort = event.target.textContent;
        let filtered = this.favoriteQueries.filter(function (iter) {
           return iter.short === event.target.textContent;
        });
        this.queryRaw = decodeURIComponent(filtered[0].raw);
    }

    @ViewChild("downloadModal") public downloadModal: ModalDirective;
    @ViewChild("uploadModal") public uploadModal: ModalDirective;

    public showDownloadModal(): void {
        this.downloadModal.show();
    }

    public hideDownloadModal(): void {
        this.downloadModal.hide();
    }

    public showUploadModal(): void {
        this.uploadModal.show();
    }

    public hideUploadModal(): void {
        this.uploadModal.hide();
    }
}
