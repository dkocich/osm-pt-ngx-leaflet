import * as L from 'leaflet';

L.Control.StreetView = L.Control.extend({
  options: {
    google: true,
    bing: true,
    yandex: true,
    mapillary: true,
    mapillaryId: null,
    mosatlas: true,
  },

  providers: [
    ['google', 'GSV', 'Google Street View', false,
      'https://www.google.com/maps?layer=c&cbll={lat},{lon}'],
    ['bing', 'Bing', 'Bing StreetSide',
      L.latLngBounds([[25, -168], [71.4, 8.8]]),
      'https://www.bing.com/maps?cp={lat}~{lon}&lvl=19&style=x&v=2'],
    ['yandex', 'ЯП', 'Yandex Panoramas',
      L.latLngBounds([[35.6, 18.5], [72, 180]]),
      'https://yandex.ru/maps/?panorama%5Bpoint%5D={lon},{lat}'],
    ['mapillary', 'Mplr', 'Mapillary Photos', false,
      'https://a.mapillary.com/v3/images?client_id={id}&closeto={lon},{lat}&lookat={lon},{lat}'],
    ['mosatlas', 'Мос', 'Панорамы из Атласа Москвы',
      L.latLngBounds([[55.113, 36.708], [56.041, 38]]),
      'http://atlas.mos.ru/?lang=ru&z=9&ll={lon}%2C{lat}&pp={lon}%2C{lat}'],
  ],

  onAdd: (map): any => {
    debugger;
    const container = L.DomUtil.create('div', 'leaflet-bar');
    const _buttons = [];
    for (let provider of this.providers) {
      this._addProvider(provider);
    }
    map.on('moveend', () => {
      if (!this.fixed) {
        this._update(map.getCenter());
      }
    }, this);
    this._update(map.getCenter());
    return this.container;
  },

  fixCoord: (latlon) => {
    this._update(latlon);
    this.fixed = true;
  },

  releaseCoord: () => {
    this.fixed = false;
    this._update(this._map.getCenter());
  },

  _addProvider: (provider): any => {
    if (!this.options[provider[0]]) {
      return;
    }
    if (provider[0] === 'mapillary' && !this.options.mapillaryId) {
      return;
    }
    const button: any = L.DomUtil.create('a');
    button.innerHTML = provider[1];
    button.title = provider[2];
    button._bounds = provider[3];
    button._template = provider[4];
    button.href = '#';
    button.target = 'streetview';
    button.style.padding = '0 8px';
    button.style.width = 'auto';

    // Some buttons require complex logic
    if (provider[0] === 'mapillary') {
      button._needUrl = false;
      L.DomEvent.on(button, 'click', function (e) {
        if (button._href) {
          this._ajaxRequest(
            button._href.replace(/{id}/, this.options.mapillaryId),
            (data) => {
              if (data && data.features && data.features[0].properties) {
                const photoKey = data.features[0].properties.key;
                const url = 'https://www.mapillary.com/map/im/{key}'.replace(/{key}/, photoKey);
                window.open(url, button.target);
              }
            },
          );
        }
        return L.DomEvent.preventDefault(e);
      }, this);
    } else {
      button._needUrl = true;
    }
    // Overriding some of the leaflet styles
    button.style.display = 'inline-block';
    button.style.border = 'none';
    button.style.borderRadius = '0 0 0 0';
    this._buttons.push(button);
  },

  _update: (center): any => {
    if (!center) {
      return;
    }
    let last;
    for (let button of this._buttons) {
      const b = button;
      let show = !b._bounds || b._bounds.contains(center);
      let vis = this.container.contains(b);

      if (show && !vis) {
        const ref = last ? last.nextSibling : this.container.firstChild;
        this.container.insertBefore(b, ref);
      } else if (!show && vis) {
        this.container.removeChild(b);
        return;
      }
      last = b;

      let tmpl = b._template;
      tmpl = tmpl
        .replace(/{lon}/g, L.Util.formatNum(center.lng, 6))
        .replace(/{lat}/g, L.Util.formatNum(center.lat, 6));
      if (b._needUrl) {
        b.href = tmpl;
      }
      else {
        b._href = tmpl;
      }
    }
  },

  _ajaxRequest: (url, callback): any => {
    // if (window.XMLHttpRequest === undefined) {
    //   return;
    // }
    const req = new XMLHttpRequest();
    req.open('GET', url);
    req.onreadystatechange = () => {
      if (req.readyState === 4 && req.status == 200) {
        const data = (JSON.parse(req.responseText));
        callback(data);
      }
    };
    req.send();
  },
});

L.control.streetView = (options) => {
  return new StreetView(options);
};
