import { Component } from "@angular/core";

import { AuthService } from "../../services/auth.service";
import { ConfService } from "../../services/conf.service";
import { StorageService } from "../../services/storage.service";

@Component({
  providers: [],
  selector: "auth",
  styles: [require<any>("./auth.component.less")],
  template: require<any>("./auth.component.html"),
})
export class AuthComponent {
  private displayName: string;
  private imgHref: string;

  constructor(
    private authSrv: AuthService,
    private storageSrv: StorageService,
  ) {
    this.displayName = this.getDisplayName();
    this.imgHref = this.storageSrv.getImgHref();
  }

  private getDisplayName(): string {
    return this.storageSrv.getDisplayName();
  }

  private authenticate(): void {
    this.authSrv.oauth.authenticate(this.gotAuthenticatedCallback.bind(this));
  }

  private gotAuthenticatedCallback(err: any, response: any): void {
    this.showDetails();
  }

  private logout(): void {
    this.authSrv.oauth.logout();
    document.getElementById("display_name").innerHTML = "";
    this.storageSrv.clearLocalStorage();
  }

  private done(err: any, res: any): any {
    if (err) {
      document.getElementById("user").innerHTML = "error! try clearing your browser cache";
      document.getElementById("user").style.display = "block";
      return;
    }
    const u = res.getElementsByTagName("user")[0];
    const changesets = res.getElementsByTagName("changesets")[0];
    const d = res.getElementsByTagName("description")[0];
    const i = res.getElementsByTagName("img")[0];
    const userDetails = {
      account_created: u.getAttribute("account_created"),
      count: changesets.getAttribute("count"),
      description: d.innerHTML,
      display_name: u.getAttribute("display_name"),
      id: u.getAttribute("id"),
      img_href: i.getAttribute("href"),
    };
    this.storageSrv.setUserData(userDetails);
    // document.getElementById("display_name").innerHTML = userDetails["display_name"];
  }

  private isAuthenticated(): void {
    return this.authSrv.oauth.authenticated();
  }

  private showDetails(): void {
    this.authSrv.oauth.xhr(
      {
        method: "GET",
        path: "/api/0.6/user/details",
        singlepage: true,
        url: ConfService.apiUrl,
      },
      this.gotDetailsCallback.bind(this),
    );
  }

  private gotDetailsCallback(err: any, xmlResponse: any): void {
    this.done(err, xmlResponse);
  }
}
