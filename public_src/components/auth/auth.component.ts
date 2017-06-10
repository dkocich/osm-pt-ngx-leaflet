import {Component} from "@angular/core";
import {StorageService} from "../../services/storage.service";

@Component({
    selector: "auth",
    template: require<any>("./auth.component.html"),
    styles: [
        require<any>("./auth.component.less")
    ],
    providers: []
})

export class AuthComponent {
    private osmAuth: any = require("osm-auth");
    public auth: any = this.osmAuth({
        oauth_secret: "vFXps19FPNhWzzGmWbrhNpMv3RYiI1RFL4oK8NPz",
        oauth_consumer_key: "rPEtcWkEykSKlLccsDS0FaZ9DpGAVPoJfQXWubXl",
        url: "https://www.openstreetmap.org",
        singlepage: false
    });
    private displayName: string;

    constructor(private storageService: StorageService) { }

    ngOnInit() {
        this.displayName = this.getDisplayName();
    }

    private getDisplayName() {
        return this.storageService.getDisplayName();
    }

    private authenticate(): void {
        this.auth.authenticate(this.gotAuthenticatedCallback.bind(this));
    }

    private gotAuthenticatedCallback(err, response): void {
        this.showDetails();
    }

    private logout(): void {
        this.auth.logout();
        document.getElementById("display_name").innerHTML = "";
        this.storageService.clearLocalStorage();
    }

    private done(err, res): any {
        if (err) {
            document.getElementById("user").innerHTML = "error! try clearing your browser cache";
            document.getElementById("user").style.display = "block";
            return;
        }
        let u = res.getElementsByTagName("user")[0];
        let changesets = res.getElementsByTagName("changesets")[0];
        let o = {
            display_name: u.getAttribute("display_name"),
            id: u.getAttribute("id"),
            count: changesets.getAttribute("count")
        };
        this.storageService.setUserData(o.display_name, o.id, o.count);
        document.getElementById("display_name").innerHTML = o["display_name"];
        // for (let k in o) {
        //     document.getElementById(k).innerHTML = o[k];
        // }
    }

    private isAuthenticated(): void {
        return this.auth.authenticated();
    }

    private showDetails(): void {
        this.auth.xhr({
            method: "GET",
            path: "/api/0.6/user/details",
            url: "https://www.openstreetmap.org",
            singlepage: true
        }, this.gotDetailsCallback.bind(this));
    }

    private gotDetailsCallback(err, xmlResponse): void {
        this.done(err, xmlResponse);
    }
}
