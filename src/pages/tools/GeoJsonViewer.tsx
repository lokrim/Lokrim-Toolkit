import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    MapContainer,
    TileLayer,
    GeoJSON,
    useMap,
    useMapEvents,
    Popup
} from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, Upload, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

type MapStyle = 'osm' | 'satellite' | 'positron' | 'darkmatter';

const MAP_STYLES: Record<MapStyle, { name: string; url: string; attribution: string }> = {
    osm: {
        name: 'OSM Standard',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
        name: 'OSM Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    positron: {
        name: 'CartoDB Positron',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    darkmatter: {
        name: 'CartoDB Dark Matter',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
};

/**
 * Robust clipboard copy fallback
 */
function copyToClipboardFallback(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        return new Promise<void>((resolve, reject) => {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "absolute";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) resolve();
                else reject(new Error("execCommand copy failed"));
            } catch (err) {
                reject(err);
            } finally {
                document.body.removeChild(textArea);
            }
        });
    }
}

/**
 * Hook to handle right-click copy coordinates
 */
function MapEvents({ onRightClick }: { onRightClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        contextmenu(e) {
            onRightClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

/**
 * Component to auto-fit map bounds to GeoJSON data
 */
function GeoJsonBounds({ data }: { data: any }) {
    const map = useMap();
    useEffect(() => {
        if (!data) return;
        try {
            const geoJsonLayer = L.geoJSON(data);
            if (Object.keys(geoJsonLayer.getBounds()).length > 0) {
                map.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] });
            }
        } catch (e) {
            // Ignore bounds fitting errors for empty/invalid geometries
        }
    }, [data, map]);
    return null;
}


export default function GeoJsonViewer() {
    const [rawInput, setRawInput] = useState<string>('');
    const [parsedData, setParsedData] = useState<any | null>(null);
    const [errorData, setErrorData] = useState<{ isError: boolean; message: string }>({ isError: false, message: 'Ready for input.' });
    const [mapStyle, setMapStyle] = useState<MapStyle>('osm');
    const [popupInfo, setPopupInfo] = useState<{ lat: number, lng: number } | null>(null);

    // GeoJSON key triggers a re-render of the GeoJSON layer component
    const geoJsonKey = useRef(0);

    const validateAndUpdate = useCallback((val: string) => {
        setRawInput(val);
        if (!val.trim()) {
            setParsedData(null);
            setErrorData({ isError: false, message: 'Ready for input.' });
            return;
        }

        try {
            const parsed = JSON.parse(val);
            if (parsed && typeof parsed === 'object' && ('type' in parsed) && (parsed.type === 'FeatureCollection' || parsed.type === 'Feature' || parsed.type === 'GeometryCollection' || parsed.type === 'Point' || parsed.type === 'LineString' || parsed.type === 'Polygon' || parsed.type === 'MultiPoint' || parsed.type === 'MultiLineString' || parsed.type === 'MultiPolygon')) {
                setParsedData(parsed);
                setErrorData({ isError: false, message: 'Valid GeoJSON.' });
                geoJsonKey.current += 1;
            } else {
                throw new Error('Valid JSON, but not a recognized GeoJSON type.');
            }
        } catch (err: any) {
            setErrorData({
                isError: true,
                message: err.message || 'Syntax Error'
            });
        }
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        validateAndUpdate(e.target.value);
    }, [validateAndUpdate]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text !== undefined) {
                validateAndUpdate(text);
                toast.success(`Loaded ${file.name}`);
            }
        };
        reader.onerror = () => toast.error("Failed to read file");
        reader.readAsText(file);
    }, [validateAndUpdate]);

    const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
        onDrop,
        multiple: false,
        noClick: true,
        noKeyboard: true
    });

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full xl:min-w-0 xl:max-w-none px-4 py-6 md:p-8 animate-in fade-in zoom-in-95 duration-500">
            <header className="mb-6 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1 flex items-center gap-3">
                        GeoJSON Validator <span className="text-zinc-300 dark:text-zinc-700 font-light">&</span> Mapper
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Paste GeoJSON data to instantly view and validate it on the map. Right click to copy coordinates.
                    </p>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Left Pane: Editor */}
                <div {...getRootProps()} className={`flex flex-col w-full lg:w-1/3 xl:w-2/5 shrink-0 bg-white dark:bg-zinc-900/40 border rounded-xl shadow-sm overflow-hidden transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
                    <input {...getInputProps()} />
                    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 p-3 flex items-center justify-between gap-3 overflow-x-auto min-w-0">
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pl-1 hidden sm:inline">JSON Input</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openFileDialog}
                                className="h-7 text-xs px-2 shadow-none border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 bg-white text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                            >
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                Upload File
                            </Button>
                        </div>

                        {/* Status Badge */}
                        <div className={`flex items-start shrink-0 gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${errorData.isError
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30'
                            : (rawInput.trim() === '' && !errorData.isError && errorData.message === 'Ready for input.')
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
                            }`}>
                            {errorData.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : (!errorData.isError && errorData.message !== 'Ready for input.' && rawInput.trim() !== '') ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : null}
                            <span className="max-w-[200px] sm:max-w-[300px] whitespace-normal break-words leading-tight text-left" title={errorData.message}>
                                {errorData.message}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {isDragActive && (
                            <div className="absolute inset-0 z-10 bg-indigo-50/80 dark:bg-indigo-900/80 border-2 border-indigo-500 border-dashed m-2 rounded-lg flex items-center justify-center">
                                <p className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center"><Upload className="w-5 h-5 mr-2" /> Drop file to extract GeoJSON</p>
                            </div>
                        )}
                        <textarea
                            className="w-full h-full bg-transparent p-4 text-sm font-mono text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            placeholder="Paste or drag FeatureCollection, Feature, or Geometry..."
                            value={rawInput}
                            onChange={handleInputChange}
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Right Pane: Map */}
                <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 isolate min-h-[400px]">

                    {/* Map Controls Overlay (z-index above leaflet but below some popup elements) */}
                    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
                        <select
                            className="pointer-events-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm rounded-lg shadow-sm px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                            value={mapStyle}
                            onChange={(e) => setMapStyle(e.target.value as MapStyle)}
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em 1em' }}
                        >
                            {Object.entries(MAP_STYLES).map(([key, style]) => (
                                <option key={key} value={key}>{style.name}</option>
                            ))}
                        </select>
                    </div>

                    <MapContainer
                        center={[9.9312, 76.2673]}
                        zoom={11}
                        scrollWheelZoom={true}
                        className="w-full h-full"
                        zoomControl={false} // Might conflict with our absolute positioning if not careful, but usually okay on bottom right. Moving it explicitly if needed later.
                    >
                        <TileLayer
                            attribution={MAP_STYLES[mapStyle].attribution}
                            url={MAP_STYLES[mapStyle].url}
                            key={mapStyle} // Force re-render of tiles on style turn
                        />

                        {parsedData && (
                            <>
                                <GeoJSON
                                    key={`geojson-${geoJsonKey.current}`}
                                    data={parsedData}
                                    style={{
                                        color: '#6366f1', // Indigo-500
                                        weight: 3,
                                        opacity: 0.8,
                                        fillColor: '#818cf8', // Indigo-400
                                        fillOpacity: 0.2
                                    }}
                                />
                                <GeoJsonBounds data={parsedData} />
                            </>
                        )}

                        <MapEvents onRightClick={(lat, lng) => setPopupInfo({ lat, lng })} />

                        {popupInfo && (
                            <Popup position={[popupInfo.lat, popupInfo.lng]} eventHandlers={{ remove: () => setPopupInfo(null) }}>
                                <div className="flex flex-col gap-2 items-center min-w-[140px] p-1">
                                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                                        {popupInfo.lat.toFixed(6)}, {popupInfo.lng.toFixed(6)}
                                    </span>
                                    <Button
                                        size="sm"
                                        className="w-full h-8 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 shadow-none border-none"
                                        onClick={() => {
                                            const coordStr = `${popupInfo.lat.toFixed(6)}, ${popupInfo.lng.toFixed(6)}`;
                                            copyToClipboardFallback(coordStr).then(() => {
                                                toast.success('Coordinates copied!', { description: coordStr });
                                                setPopupInfo(null);
                                            }).catch(() => toast.error('Copy failed'));
                                        }}
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-2" />
                                        Copy Lat/Lng
                                    </Button>
                                </div>
                            </Popup>
                        )}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}
