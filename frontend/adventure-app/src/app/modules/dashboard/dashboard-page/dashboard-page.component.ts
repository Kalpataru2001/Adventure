import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { DashboardService, MapPin } from 'src/app/services/dashboard.service';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements AfterViewInit, OnDestroy {
  private map: L.Map | undefined;
  isMapReady = false;
  private defaultCoords: L.LatLngTuple = [20.2961, 85.8245];

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 0);
  }

  private initMap(): void {
    if (this.map) return; // Map is already initialized

    // Create the map instance
    this.map = L.map('map').setView(this.defaultCoords, 11);

    // Use a more modern, clean map theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(this.map);

    this.isMapReady = true;
    this.loadMapData();
    this.centerOnMyLocation(); // Attempt to center on the user immediately
  }


  private loadMapData(): void {
    this.dashboardService.getMapData().subscribe(pins => {
      this.addMarkers(pins);
    });
  }

  private addMarkers(pins: MapPin[]): void {
    if (!this.map) return;
    for (const pin of pins) {
      L.marker([pin.latitude, pin.longitude])
        .addTo(this.map)
        .bindPopup(`<b>${pin.title}</b><br>Adventure completed!`);
    }
  }

  centerOnMyLocation(): void {
    if (!this.map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success: Center map on user's location
          const coords: L.LatLngTuple = [position.coords.latitude, position.coords.longitude];
          this.map?.setView(coords, 13); // Zoom in closer
          L.marker(coords).addTo(this.map!).bindPopup("You are here!");
        },
        () => {
          // Error or permission denied: Use default location
          console.warn("Geolocation service failed. Using default location.");
          this.map?.setView(this.defaultCoords, 11);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
