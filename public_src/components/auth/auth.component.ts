import {Component} from "@angular/core";

import {AuthService} from "../../services/auth.service";
import {ConfigService} from "../../services/config.service";
import {StorageService} from "../../services/storage.service";

@Component({
    providers: [],
    selector: "auth",
    styles: [
        require<any>("./auth.component.less")
    ],
    template: require<any>("./auth.component.html")
})

export class AuthComponent {

    private displayName: string;

    constructor(private storageService: StorageService, private authService: AuthService) {
    }

    ngOnInit() {
        this.displayName = this.getDisplayName();
    }

    private getDisplayName() {
        return this.storageService.getDisplayName();
    }

    private authenticate(): void {
        this.authService.oauth.authenticate(this.gotAuthenticatedCallback.bind(this));
    }

    private gotAuthenticatedCallback(err, response): void {
        this.showDetails();
    }

    private logout(): void {
        this.authService.oauth.logout();
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
            count: changesets.getAttribute("count"),
            display_name: u.getAttribute("display_name"),
            id: u.getAttribute("id")
        };
        this.storageService.setUserData(o.display_name, o.id, o.count);
        document.getElementById("display_name").innerHTML = o["display_name"];
        // for (let k in o) {
        //     document.getElementById(k).innerHTML = o[k];
        // }
    }

    private isAuthenticated(): void {
        return this.authService.oauth.authenticated();
    }

    private showDetails(): void {
        this.authService.oauth.xhr({
            method: "GET",
            path: "/api/0.6/user/details",
            singlepage: true,
            url: ConfigService.apiUrl
        }, this.gotDetailsCallback.bind(this));
    }

    private gotDetailsCallback(err, xmlResponse): void {
        this.done(err, xmlResponse);
    }
}
