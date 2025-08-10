import './App.css'
import {Protocol} from "pmtiles";
import maplibregl, {FullscreenControl, NavigationControl, Marker} from 'maplibre-gl';
import {useEffect, useRef} from "react";
import 'maplibre-gl/dist/maplibre-gl.css';
import layers from "./layers.json"
import type {LayerSpecification} from "@maplibre/maplibre-gl-style-spec";

const coordinates = [
    {
        status: 1,
        coordinates: [37.842193, 50.392841]
    },
    {
        status: 1,
        coordinates: [37.942193, 50.492841]
    },
    {
        status: 2,
        coordinates: [38.042193, 50.592841]
    },
    {
        status: 2,
        coordinates: [38.142193, 50.692841]
    },
    {
        status: 3,
        coordinates: [38.242193, 50.792841]
    },
    {
        status: 3,
        coordinates: [38.342193, 50.892841]
    },
    {
        status: 4,
        coordinates: [38.442193, 50.992841]
    },
    {
        status: 4,
        coordinates: [38.542193, 51.092841]
    },
];

export const statusColors = {
    1: '#2bbb00',
    2: '#ffc932',
    3: '#ff0000',
    4: '#000'
}

function App() {
    const mapRef = useRef(null);

    useEffect(() => {
        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);

        const map = new maplibregl.Map({
            container: mapRef.current!,
            style: {
                version: 8,
                sources: {
                    protomaps: {
                        type: "vector",
                        url: "pmtiles://http://localhost:8080/belgorodskaya-oblast.pmtiles"
                    }
                },
                glyphs: "/fonts/{fontstack}/{range}.pbf",
                layers: layers as LayerSpecification[]
            },
            "center": [36.580090,50.593219],
            "zoom": 13,
        });
        map.addControl(new FullscreenControl());
        map.addControl(
            new NavigationControl({
                visualizePitch: true,
                showZoom: true,
                showCompass: false
            })
        );

        coordinates.forEach((el) => {
            const marker = new Marker({
                color: statusColors[el.status],
                className: 'marker'
            })
                .setLngLat(el.coordinates)
                .addTo(map);

            marker.getElement().addEventListener('click', () => {
                console.log(el)
            });
        });

        map.on('load', () => {
            const groupedBy = Object.groupBy(coordinates, (el) => {
                if (el.status === 1) {
                    return 'status1'
                }

                if (el.status === 2) {
                    return 'status2'
                }

                if (el.status === 3) {
                    return 'status3'
                }

                return 'status4'
            });
            const groupedByEntries = Object.entries(groupedBy);

            groupedByEntries.forEach(([status, values]) => {
                const color = statusColors[values[0].status]

                map.addSource(status, {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': values.map(i => i.coordinates)
                        }
                    }
                });

                map.addLayer({
                    'id': status,
                    'type': 'line',
                    'source': status,
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': color,
                        'line-width': 2
                    }
                });
            });

            groupedByEntries.forEach((el, index) => {
                if (index > 0) {
                    const prevIndex = index - 1;

                    const prevEl = groupedByEntries[prevIndex][1].at(-1);
                    const currentEl = el[1][0];

                    const color = statusColors[currentEl.status];
                    const id = `${prevEl.status}-${el[0]}`;

                    const coordinates = [prevEl.coordinates, currentEl.coordinates];

                    map.addSource(id, {
                        'type': 'geojson',
                        'data': {
                            'type': 'Feature',
                            'properties': {},
                            'geometry': {
                                'type': 'LineString',
                                coordinates
                            }
                        }
                    });

                    map.addLayer({
                        'id': id,
                        'type': 'line',
                        'source': id,
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': color,
                            'line-width': 2
                        }
                    });
                }
            })
        });

        return () => {
            map.remove();
            maplibregl.removeProtocol("pmtiles");
        }
    }, []);

    return (
        <div ref={mapRef} style={{width: '100%', height: '100%'}} />
    )
}

export default App
