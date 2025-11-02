import React, { useState, useRef, useEffect } from 'react';
import type { FlightParams, CameraParams, DisplayParams, FilterParams, Stats } from '../types';
import { DroneIcon, DownloadIcon, GenerateIcon, ClearIcon, InfoIcon, UploadIcon } from './icons';
import { CAMERA_PRESETS } from '../constants';

interface ControlPanelProps {
  params: FlightParams;
  setParams: React.Dispatch<React.SetStateAction<FlightParams>>;
  cameraParams: CameraParams;
  setCameraParams: React.Dispatch<React.SetStateAction<CameraParams>>;
  displayParams: DisplayParams;
  setDisplayParams: React.Dispatch<React.SetStateAction<DisplayParams>>;
  filterParams: FilterParams;
  setFilterParams: React.Dispatch<React.SetStateAction<FilterParams>>;
  onGenerate: () => void;
  onDownloadCsv: () => void;
  onDownloadKmz: () => void;
  onDownloadKml: () => void;
  onClear: () => void;
  onFetchTerrain: () => void;
  onImportShapefile: (file: File) => void;
  isLoading: boolean;
  isFetchingTerrain: boolean;
  error: string | null;
  hasPolygon: boolean;
  hasWaypoints: boolean;
  stats: Stats | null;
}

const ParameterInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    unit: string;
    min: number;
    max: number;
    step: number;
    tooltip: string;
}> = ({ label, value, onChange, unit, min, max, step, tooltip }) => (
    <div className="mb-4 relative">
        <label className="flex items-center text-sm font-medium text-gray-300 group">
            {label}
            <span className="ml-2 text-gray-400 cursor-pointer">
                <InfoIcon />
            </span>
            <div className="absolute left-full ml-4 w-48 p-2 bg-gray-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {tooltip}
            </div>
        </label>
        <div className="flex items-center mt-1">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-20 ml-4 p-1 text-center bg-gray-700 border border-gray-600 rounded-md"
            />
            <span className="ml-2 text-gray-400 w-8">{unit}</span>
        </div>
    </div>
);

const CameraParameterInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    unit: string;
    step: number;
    disabled: boolean;
}> = ({ label, value, onChange, unit, step, disabled }) => (
    <div className="mb-2">
        <label className="text-sm font-medium text-gray-400">{label}</label>
        <div className="flex items-center mt-1">
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="w-full p-1 text-right bg-gray-700 border border-gray-600 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed"
                step={step}
                disabled={disabled}
            />
            <span className="ml-2 text-gray-400 w-10 text-xs">{unit}</span>
        </div>
    </div>
);

const FilterInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    disabled: boolean;
}> = ({ label, value, onChange, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10)) || 0)}
            className="mt-1 w-full p-1 text-center bg-gray-700 border border-gray-600 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed"
            min="0"
            step="1"
            disabled={disabled}
        />
    </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  setParams,
  cameraParams,
  setCameraParams,
  displayParams,
  setDisplayParams,
  filterParams,
  setFilterParams,
  onGenerate,
  onDownloadCsv,
  onDownloadKmz,
  onDownloadKml,
  onClear,
  onFetchTerrain,
  onImportShapefile,
  isLoading,
  isFetchingTerrain,
  error,
  hasPolygon,
  hasWaypoints,
  stats,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('DJI Mini 4 Pro');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const downloadButtonRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const handleParamChange = (field: keyof FlightParams, value: number | string) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleDisplayParamChange = (field: keyof DisplayParams, value: number) => {
    setDisplayParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterParamChange = (field: keyof FilterParams, value: any) => {
    setFilterParams((prev) => ({ ...prev, [field]: value }));
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);
    if (presetName !== 'Custom') {
      setCameraParams(CAMERA_PRESETS[presetName]);
    }
  };

  const handleCameraParamChange = (field: keyof CameraParams, value: number) => {
    setCameraParams(prev => ({ ...prev, [field]: value }));
    setSelectedPreset('Custom');
  };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (downloadButtonRef.current && !downloadButtonRef.current.contains(event.target as Node)) {
                setIsDownloadOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportShapefile(file);
    }
    // Reset file input to allow importing the same file again
    e.target.value = '';
  };


  const isCustom = selectedPreset === 'Custom';

  return (
    <aside className="w-full h-full bg-gray-800 p-6 overflow-y-auto shadow-lg z-20">
      <div className="flex items-center mb-6">
        <DroneIcon />
        <h1 className="text-2xl font-bold ml-3">Flight Planner</h1>
      </div>
      <p className="text-gray-400 mb-6 text-sm">
        Draw or import a survey area, adjust parameters, and generate a flight plan.
      </p>

      <div>
        <h2 className="text-xl font-semibold mb-4">Flight Parameters</h2>
        <ParameterInput
          label="Flight Altitude"
          value={params.altitude}
          onChange={(v) => handleParamChange('altitude', v)}
          unit="m"
          min={30}
          max={120}
          step={1}
          tooltip="The height of the drone above the takeoff point (Relative) or ground (AGL)."
        />
        <ParameterInput
          label="Front Overlap"
          value={params.frontOverlap}
          onChange={(v) => handleParamChange('frontOverlap', v)}
          unit="%"
          min={50}
          max={95}
          step={1}
          tooltip="The percentage of overlap between consecutive images along a flight line."
        />
        <ParameterInput
          label="Side Overlap"
          value={params.sideOverlap}
          onChange={(v) => handleParamChange('sideOverlap', v)}
          unit="%"
          min={50}
          max={95}
          step={1}
          tooltip="The percentage of overlap between adjacent flight lines."
        />
        <ParameterInput
          label="Flight Speed"
          value={params.speed}
          onChange={(v) => handleParamChange('speed', v)}
          unit="m/s"
          min={2}
          max={15}
          step={0.5}
          tooltip="The speed of the drone during the mission."
        />
        <ParameterInput
          label="Flight Direction"
          value={params.flightDirection}
          onChange={(v) => handleParamChange('flightDirection', v)}
          unit="°"
          min={0}
          max={359}
          step={1}
          tooltip="The orientation of the flight lines relative to North."
        />
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Altitude &amp; Terrain</h2>
        <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-400">Select how altitude is calculated.</p>
            <div className="flex items-center justify-around p-2 bg-gray-700 rounded-lg">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="radio"
                        name="altitudeMode"
                        value="relative"
                        checked={params.altitudeMode === 'relative'}
                        onChange={() => handleParamChange('altitudeMode', 'relative')}
                        className="peer sr-only"
                    />
                    <span className={`px-4 py-1 text-sm rounded-md transition-colors ${params.altitudeMode === 'relative' ? 'bg-indigo-600 text-white' : 'text-gray-300 peer-hover:bg-gray-600'}`}>
                        Relative
                    </span>
                </label>
                <label className="flex items-center cursor-pointer">
                    <input
                        type="radio"
                        name="altitudeMode"
                        value="agl"
                        checked={params.altitudeMode === 'agl'}
                        onChange={() => handleParamChange('altitudeMode', 'agl')}
                        className="peer sr-only"
                    />
                    <span className={`px-4 py-1 text-sm rounded-md transition-colors ${params.altitudeMode === 'agl' ? 'bg-indigo-600 text-white' : 'text-gray-300 peer-hover:bg-gray-600'}`}>
                        AGL
                    </span>
                </label>
            </div>
        </div>
        {params.altitudeMode === 'agl' && hasWaypoints && (
            <button
                onClick={onFetchTerrain}
                disabled={isFetchingTerrain}
                className="w-full flex items-center justify-center p-3 bg-teal-600 rounded-md font-semibold hover:bg-teal-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                {isFetchingTerrain ? (
                     <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Fetching Terrain...
                    </>
                ) : (
                    'Fetch Terrain Data'
                )}
            </button>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Camera Parameters</h2>
        <div className="mb-4">
            <label htmlFor="camera-preset" className="block text-sm font-medium text-gray-300">Camera Preset</label>
            <select
                id="camera-preset"
                value={selectedPreset}
                onChange={handlePresetChange}
                className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
            >
                {Object.keys(CAMERA_PRESETS).map(name => (
                    <option key={name} value={name}>{name}</option>
                ))}
                <option value="Custom">Custom</option>
            </select>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4">
            <CameraParameterInput
                label="Focal Length"
                value={cameraParams.focalLength}
                onChange={v => handleCameraParamChange('focalLength', v)}
                unit="mm"
                step={0.1}
                disabled={!isCustom}
            />
            <CameraParameterInput
                label="Sensor Width"
                value={cameraParams.sensorWidth}
                onChange={v => handleCameraParamChange('sensorWidth', v)}
                unit="mm"
                step={0.1}
                disabled={!isCustom}
            />
            <CameraParameterInput
                label="Sensor Height"
                value={cameraParams.sensorHeight}
                onChange={v => handleCameraParamChange('sensorHeight', v)}
                unit="mm"
                step={0.1}
                disabled={!isCustom}
            />
            <CameraParameterInput
                label="Image Width"
                value={cameraParams.imageWidth}
                onChange={v => handleCameraParamChange('imageWidth', v)}
                unit="px"
                step={1}
                disabled={!isCustom}
            />
             <CameraParameterInput
                label="Image Height"
                value={cameraParams.imageHeight}
                onChange={v => handleCameraParamChange('imageHeight', v)}
                unit="px"
                step={1}
                disabled={!isCustom}
            />
        </div>
      </div>

       <div className="mt-8 pt-6 border-t border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Filter Options</h2>
         <div className="flex items-center justify-between mb-4">
           <label htmlFor="filter-toggle" className="text-sm font-medium text-gray-300">
             Enable Waypoint Filtering
           </label>
           <button
             id="filter-toggle"
             onClick={() => handleFilterParamChange('enabled', !filterParams.enabled)}
             className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${filterParams.enabled ? 'bg-indigo-600' : 'bg-gray-600'}`}
           >
             <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${filterParams.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
           </button>
         </div>
         <div className="grid grid-cols-2 gap-x-4">
           <FilterInput
             label="Keep Start Waypoints"
             value={filterParams.keepStart}
             onChange={v => handleFilterParamChange('keepStart', v)}
             disabled={!filterParams.enabled}
           />
           <FilterInput
             label="Keep End Waypoints"
             value={filterParams.keepEnd}
             onChange={v => handleFilterParamChange('keepEnd', v)}
             disabled={!filterParams.enabled}
           />
         </div>
       </div>

      <div className="mt-8 pt-6 border-t border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Display Options</h2>
        <ParameterInput
          label="Path Thickness"
          value={displayParams.pathWidth}
          onChange={(v) => handleDisplayParamChange('pathWidth', v)}
          unit="px"
          min={1}
          max={10}
          step={1}
          tooltip="The thickness of the flight path line on the map."
        />
        <ParameterInput
          label="Waypoint Radius"
          value={displayParams.waypointRadius}
          onChange={(v) => handleDisplayParamChange('waypointRadius', v)}
          unit="px"
          min={1}
          max={10}
          step={1}
          tooltip="The size of the waypoint markers on the map."
        />
      </div>

      <div className="mt-8 space-y-3">
        <input
            type="file"
            ref={importFileRef}
            onChange={handleFileImport}
            className="hidden"
            accept=".zip"
        />
        <button
          onClick={() => importFileRef.current?.click()}
          disabled={isLoading}
          className="w-full flex items-center justify-center p-3 bg-sky-600 rounded-md font-semibold hover:bg-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <UploadIcon />
          <span className="ml-2">Import Polygons (.zip)</span>
        </button>
        <button
          onClick={onGenerate}
          disabled={!hasPolygon || isLoading}
          className="w-full flex items-center justify-center p-3 bg-indigo-600 rounded-md font-semibold hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <GenerateIcon />
              <span className="ml-2">Generate Flight Plan</span>
            </>
          )}
        </button>

        <div className="relative" ref={downloadButtonRef}>
          <button
            onClick={() => setIsDownloadOpen(!isDownloadOpen)}
            disabled={!hasWaypoints || isLoading}
            className="w-full flex items-center justify-center p-3 bg-green-600 rounded-md font-semibold hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <DownloadIcon />
            <span className="ml-2">Download Plan</span>
            <svg className={`w-5 h-5 ml-2 transition-transform ${isDownloadOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          
          {isDownloadOpen && (
            <div className="absolute bottom-full mb-2 w-full bg-gray-700 rounded-md shadow-lg z-10">
              <ul className="text-sm text-white">
                <li>
                  <button
                    onClick={() => { onDownloadCsv(); setIsDownloadOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-600 rounded-t-md"
                  >
                    .csv (Litchi)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { onDownloadKmz(); setIsDownloadOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-600"
                  >
                    .kmz (DJI WPML)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { onDownloadKml(); setIsDownloadOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-600 rounded-b-md"
                  >
                    .kml (Google Earth)
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={onClear}
          disabled={(!hasPolygon && !hasWaypoints) || isLoading}
          className="w-full flex items-center justify-center p-3 bg-red-600 rounded-md font-semibold hover:bg-red-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <ClearIcon />
          <span className="ml-2">Clear Everything</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-800 border border-red-600 text-red-200 rounded-md text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {stats && hasWaypoints && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Mission Statistics</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Total Waypoints:</span>
              <span className="font-mono">{stats.totalWaypoints}</span>
            </div>
            <div className="flex justify-between">
              <span>Flight Lines:</span>
              <span className="font-mono">{stats.flightLines}</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Flight Time:</span>
              <span className="font-mono">{stats.flightTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Distance:</span>
              <span className="font-mono">{stats.totalDistance} km</span>
            </div>
            <div className="flex justify-between">
              <span>Photo Count:</span>
              <span className="font-mono">{stats.photoCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Data Volume:</span>
              <span className="font-mono">{stats.dataVolume} GP</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
