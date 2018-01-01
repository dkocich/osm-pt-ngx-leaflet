import {create} from "xmlbuilder";
import XMLElementOrXMLNode = require("xmlbuilder");

let xml = create("osmChange");

xml.ele( "member", { "@type": "aaa" });
xml.end();
//
// let changedElements = [{
//     "type": "node",
//     "id": 2194519037,
//     "lat": 49.6903339,
//     "lon": 18.365199,
//     "timestamp": "2013-03-10T16:43:46Z",
//     "version": 1,
//     "changeset": 15317540,
//     "user": "Marián Kyral",
//     "uid": 1182568,
//     "tags": {}
// }];
//
// for (let el of changedElements) {
//     console.log("I should transform ", el);
//
//     // only changes now - TODO deletion/creation of elements
//     xml.ele("modify");
//
//     // node, way, relation - should hold attributes
//     xml.ele(el.type);
//
//     for (let key of Object.keys(el)) {
//         if (key) {
//
//         } else if (key === "relations") {
//             // <member type="node" ref="2184049065" role="platform"/>
//             xml.ele( "member", { "k": key , "v": el[key]}).up();
//         } else if (key === "tags") {
//             // // <tag k="name" v="Bus 11: Místek,Riviéra -> Řepiště, U kříže"/>
//             xml.ele( "tag", { "k": key , "v": el[key]}).up();
//         }
//     }
// }
//
// xml.end({ pretty: true});
// console.log(new XMLSerializer().serializeToString(xml.documentElement);
//
// let parser = new DOMParser();
// let doc = parser.parseFromString(xml, "application/xml");
console.log(xml);