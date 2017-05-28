osm-pt-ngx-leaflet
==================

[![Known Vulnerabilities](https://snyk.io/test/github/snyk/goof/badge.svg)](https://snyk.io/test/github/snyk/goof)
[![Build Status](https://travis-ci.org/haoliangyu/ngx-leaflet-starter.svg?branch=master)](https://github.com/haoliangyu/ngx-leaflet-starter)

An online web editor used to edit public transport routes on OpenStreetMap built with Angular, Leaflet and Webpack.

This project includes basic mapping features:
-   [x] Display base maps from different sources
-   [x] Integrate Font-Awesome
-	[x] Initialize map based on user's IP address location
-	[x] Geocode address and zoom to result location
-	[x] Add/remove markers on the map
-   [x] Use unofficially typed Leaflet plugin
-	[x] Webpack 2

OSM/PT specific features:
-   [ ] handle communication with [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_API_by_Example) and [OSM API v0.6](https://wiki.openstreetmap.org/wiki/API_v0.6)
-   [ ] transform OSM to GeoJson data with [tyrasd/osmtogeojson](https://github.com/tyrasd/osmtogeojson)
-   [ ] authorize users with osm-auth [osmlab/osm-auth](https://github.com/osmlab/osm-auth)

Support [Angular 4.1.3](https://angular.io/) and [Leaflet 1.0.3](http://leafletjs.com/) now!

How to start?
--------------

This project requires [npm](https://www.npmjs.com/) (or [yarn](https://yarnpkg.com/)).

1.	Run `npm install` or `yarn install` to install dependencies.
2.	Run `npm run build` to build the project.
3.  Open the app at `public/index.html`
4.  Run (for local development) `npm run dev` to serve project with `webpack-dev-server` on localhost:8080

Looking for other demos?
-------------------------------
Thanks to these awesome people [Rodolphe Eveilleau](https://github.com/rdphv), [Wolfgang Becker](https://github.com/vimwb), [Tonia Roddick](https://github.com/troddick) and their projects:

* [ngx-leaflet-starter](https://github.com/haoliangyu/ngx-leaflet-starter) is an Angular 2 project seed with [Leaflet](http://leafletjs.com/), the most popular Javascript mapping library. This project is forked from it!

* [ngx-mapboxgl-starter](https://github.com/haoliangyu/ngx-mapboxgl-starter) is an Angular 2 project seed with [MapboxGL](https://www.mapbox.com/mapbox-gl-js/api/), a mapping library designed for [vector tile](https://www.mapbox.com/help/define-vector-tiles/).

* [boundary.now](https://github.com/haoliangyu/boundary.now), a tool to download place boundries from OpenStreetMap, built with Angular2, [Material2](https://github.com/angular/material2) and Leaflet.
