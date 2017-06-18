import {Injectable} from "@angular/core";
import {Headers, Http, RequestOptions} from "@angular/http";
import {MapService} from "./map.service";
import {ProcessingService} from "./processing.service";
import {StorageService} from "./storage.service";
import {LoadingService} from "./loading.service";
import {ConfigService} from "./config.service";
import {AuthService} from "./auth.service";
import {EditingService} from "./editing.service";

import {create} from "xmlbuilder";
import XMLElementOrXMLNode = require("xmlbuilder");
// let builder  = require("xmlbuilder").create();

const CONTINUOUS_QUERY: string = `
[out:json][timeout:25][bbox:{{bbox}}];
(
  node["route"="bus"];
  way["route"="bus"];
  relation["route"="bus"];
  node["route"="train"];
  way["route"="train"];
  relation["route"="train"];
  node["route"="tram"];
  way["route"="tram"];
  relation["route"="tram"];
  node["public_transport"];
  way["public_transport"];
  relation["public_transport"];
);
(._;>;);
out meta;`;

// import {osmAuth} from "osm-auth";
// import osmAuth = require("osm-auth");

@Injectable()
export class OverpassService {
    public changeset;
    private changeset_id: string;
    private test = "test bindu";

    private parseString: any = require("xml2js")["parseString"];
    private Osm2Json = require("osm2json");

    constructor(private http: Http, private mapService: MapService,
                private storageService: StorageService,
                private processingService: ProcessingService,
                private loadingService: LoadingService,
                private authService: AuthService,
                private editingService: EditingService) { }

    /**
     *
     */
    public requestNewOverpassData(): void {
        this.loadingService.show();
        let requestBody = this.replaceBboxString(CONTINUOUS_QUERY);
        let options = this.setRequestOptions("application/X-www-form-urlencoded");
        this.mapService.previousCenter = [this.mapService.map.getCenter().lat, this.mapService.map.getCenter().lng];
        this.http.post("https://overpass-api.de/api/interpreter", requestBody, options)
            .map(res => res.json())
            .subscribe(response => {
                this.processingService.processResponse(response);
                this.requestRouteMasterData();
            });
    }

    /**
     *
     * Example of response:
     *
     * "<?xml version="1.0" encoding="UTF-8"?>
     * <osm version="0.6" generator="OpenStreetMap server" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
     *   <relation id="7169733" changeset="47954500" timestamp="2017-04-19T23:07:48Z" version="1" visible="true" user="dkocich" uid="1784758">
     *     <member type="relation" ref="7145228" role=""/>
     *     <member type="relation" ref="7145227" role=""/>
     *     <tag k="name" v="Bus 1"/>
     *     <tag k="public_transport" v="route_master"/>
     *     <tag k="type" v="public_transport"/>
     *   </relation>
     * </osm>"
     */
    private requestRouteMasterData(): void {
        this.loadingService.show();
        for (let relation of this.storageService.listOfRelations) {
            this.http.get("https://api.openstreetmap.org/api/0.6/relation/" + relation["id"] + "/relations")
                .subscribe(response => {
                    if (response.status === 200) {
                        // let opts = {"types": ["relation"], "strict": true};
                        // let stream = new Osm2Json(opts);
                        // stream.parse(response["_body"]);
                        this.parseString(response["_body"], (err, result) => {
                            if (result["osm"]["relation"] && result["osm"]["relation"].length > 1) {
                                // TODO parse ...
                                // for (let relation of result["osm"]["relation"]) {
                                //     if (relation["public_transport"] === "route_master") {
                                //         this.storageService.listOfMasters.push(relation);
                                //         console.log(relation);
                                //     }
                                // }
                            }
                        });
                    } else {
                        alert("route_master response status" + response.status + "\n" + response["_body"]);
                    }
                });
        }
        this.loadingService.hide();
    }

    /**
     *
     * @param requestBody
     */
    public requestOverpassData(requestBody: string): void {
        this.loadingService.show();
        this.mapService.clearLayer();
        requestBody = this.replaceBboxString(requestBody);
        let options = this.setRequestOptions("application/X-www-form-urlencoded");
        this.mapService.renderData(requestBody, options);
    }

    /**
     *
     * @param requestBody
     * @returns {string}
     */
    private replaceBboxString(requestBody: string): string {
        let b = this.mapService.map.getBounds();
        let s = b.getSouth().toString();
        let w = b.getWest().toString();
        let n = b.getNorth().toString();
        let e = b.getEast().toString();
        return requestBody.replace(new RegExp("{{bbox}}", "g"), [s, w, n, e].join(", "));
    }

    /**
     * Creates new request options with headers.
     * @param contentType
     * @returns {RequestOptions}
     */
    private setRequestOptions(contentType): RequestOptions {
        let headers = new Headers();
        headers.append("Content-Type", contentType);
        let options: RequestOptions = new RequestOptions({headers: headers});
        return options;
    }

    /**
     * Create basic changeset body.
     * @param metadata - contains source and comment added by user
     * @returns {string}
     */
    private createChangeset(metadata: object): string {
        console.log(metadata["source"], metadata["comment"]);
        let changeset = create("osm").ele("changeset")
            .ele("tag", {"k": "created_by", "v": ConfigService.appName}).up()
            .ele("tag", {"k": "source", "v": metadata["source"] }).up()
            .ele("tag", {"k": "comment", "v": metadata["comment"] })
            .end({ pretty: true});

        console.log(changeset);
        return changeset;
    }

    public uploadData(metadata: object) {
        this.changeset = this.createChangeset(metadata);
        this.putChangeset(this.changeset);
    }

    private addChangesetId(changeset_id): void {
        this.changeset_id = changeset_id;
        let parser = new DOMParser();
        let doc = parser.parseFromString(this.changeset, "application/xml");
        doc.querySelector("changeset").setAttribute("id", changeset_id);
        this.changeset = doc;
        console.log(this.changeset, doc);
    }

    /**
     * Creates new changeset.
     * Put /api/0.6/changeset/create
     */
    public putChangeset(changeset): void {
        this.authService.oauth.xhr({
            method: "PUT",
            path: "/api/0.6/changeset/create",
            options: { header: { "Content-Type": "text/xml" } },
            content: "<osm><changeset></changeset></osm>" // changeset
        }, this.createdChangeset.bind(this));
    }

    /**
     *
     * @param err
     * @param changeset_id
     */
    private createdChangeset(err, changeset_id) {
        if (err) return alert("Error while creating new changeset " + err);
        console.log("LOG: created new changeset with ID: ", changeset_id);
        this.addChangesetId(changeset_id);
        let osmChangeContent = "<osmChange></osmChange>";
        if (!this.storageService.edits) { return alert("LOG: create some edits before uploading changes"); }
        // get unique IDs of all edits and add only these to changeset
        let idsChanged = new Set();
        for (let edit of this.storageService.edits) {
            if (!idsChanged.has(edit["id"])) idsChanged.add(edit["id"]);
        }
        let changedElements = [];
        let changedElementsArr = Array.from(idsChanged.keys());
        for (let element of this.storageService.localJsonStorage.elements) {
            if (changedElementsArr.indexOf(element.id) > -1) {
                changedElements.push(element);
            }
        }

        console.log("LOG: changed documents: ", changedElements);
        // TODO - add XML element <create> later create (maybe delete too)
        let xml = create("osmChange", {"@version": "0.6", "@generator": ConfigService.appName } )
            .ele("modify");
        for (let el of changedElements) {
            console.log("LOG: I should transform ", el);
            let tagsObj: object = {};
            for (let key of Object.keys(el)) {
                // do not add some attributes because they are added automatically on API
                if (["members", "tags", "type", "timestamp", "uid", "user"].indexOf(key) === -1) {
                    // adds - id="123", uid="123", etc.
                    if (["version"].indexOf(key) > -1) {
                        tagsObj[key] = el[key]; // API should increment version later
                    } else if (["changeset"].indexOf(key) > -1) {
                        tagsObj[key] = this.changeset_id;
                    } else {
                        tagsObj[key] = el[key];
                    }

                }
            }
            let objectType = xml.ele(el["type"], tagsObj); // adds XML element node|way|relation
            if (el["type"] === "relation" && el["members"]) {
                let members = el["members"]; // array of objects
                members.forEach(function(mem) {
                    if (mem === members[members.length - 1]) {
                        objectType.ele("member", {"type": mem["type"], "ref": mem["ref"], "role": mem["role"]});
                    } else {
                        objectType.ele("member", {"type": mem["type"], "ref": mem["ref"], "role": mem["role"]}).up();
                    }
                });
            }
            if (el["tags"]) {
                let tags = Object.keys(el["tags"]); // objects
                for (let tag of tags) {
                    if (tag === tags[tags.length - 1]) {
                        objectType.ele("tag", {"k": tag, "v": el["tags"][tag]});
                    } else {
                        objectType.ele("tag", {"k": tag, "v": el["tags"][tag]}).up();
                    }
                }
            }
        }
        let xmlString = xml.end({ pretty: true});
        console.log("LOG: uploading this XML ", xml, xmlString);
        this.authService.oauth.xhr.bind(this)({
            method: "POST",
            path: "/api/0.6/changeset/" + this.changeset_id + "/upload",
            options: { header: { "Content-Type": "text/xml" } },
            content: xmlString // .osmChangeJXON(this.changes) // JXON.stringify()
        }, this.uploadedChangeset.bind(this));
    }

    /**
     * Tries to close changeset after it is uploaded.
     * @param err
     */
    private uploadedChangeset(err) {
        if (err) return alert("Error after data uploading. Changeset is not closed." + err);
        // Upload was successful, safe to call the callback.
        // Add delay to allow for postgres replication #1646 #2678
        window.setTimeout(function() {
            console.log("timeout 2500");
            // callback(null, this.changeset);
            // Still attempt to close changeset, but ignore response because iD/issues/2667
            this.authService.oauth.xhr({
                method: "PUT",
                path: "/api/0.6/changeset/" + this.changeset_id + "/close",
                options: { header: { "Content-Type": "text/xml" } }
            }, function() { return true; });
        }.bind(this), 2500);
    }
}
