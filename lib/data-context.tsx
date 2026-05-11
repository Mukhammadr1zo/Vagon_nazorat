"use client";

// =====================================================
// DATA CONTEXT — Global state + localStorage persistence
// =====================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  Shipment,
  FileUpload,
  Filters,
  ParseResult,
  ColumnMapping,
} from './types';
import { parseExcelFile } from './excel-parser';
import {
  applyFilters,
  calculateKPIs,
  calculateRouteStats,
  calculateCompanyStats,
  calculateStationStats,
  calculateCargoStats,
  calculateWagonStats,
  calculateDailySeries,
  calculateHourlyHeatmap,
  detectAnomalies,
  calculateRouteSpeedStats,
  calculateSenderSpeeds,
  calculateReceiverSpeeds,
  calculateDailyRouteGroups,
  calculateSameDayDistanceGroups,
} from './analytics';
import {
  loadShipments,
  saveShipments,
  loadFiles,
  saveFiles,
  clearAll,
  migrateFromLocalStorage,
} from './storage';

const defaultFilters: Filters = {
  dateRange: { start: null, end: null },
  dateField: 'departureAt',
  senderStations: [],
  destStations: [],
  senders: [],
  receivers: [],
  cargoTypes: [],
  wagonSearch: '',
};

interface DataContextValue {
  // Hydration status
  isHydrated: boolean;

  // Raw data
  shipments: Shipment[];
  files: FileUpload[];

  // Filters
  filters: Filters;
  setFilters: (f: Filters) => void;
  resetFilters: () => void;

  // Filtered
  filtered: Shipment[];

  // Analytics (computed on filtered)
  kpis: ReturnType<typeof calculateKPIs>;
  routeStats: ReturnType<typeof calculateRouteStats>;
  companyStats: ReturnType<typeof calculateCompanyStats>;
  stationStats: ReturnType<typeof calculateStationStats>;
  cargoStats: ReturnType<typeof calculateCargoStats>;
  wagonStats: ReturnType<typeof calculateWagonStats>;
  dailySeries: ReturnType<typeof calculateDailySeries>;
  hourlyHeatmap: ReturnType<typeof calculateHourlyHeatmap>;
  anomalies: ReturnType<typeof detectAnomalies>;
  routeSpeedStats: ReturnType<typeof calculateRouteSpeedStats>;
  senderSpeeds: ReturnType<typeof calculateSenderSpeeds>;
  receiverSpeeds: ReturnType<typeof calculateReceiverSpeeds>;
  dailyGroups: ReturnType<typeof calculateDailyRouteGroups>;
  sameDayDistanceGroups: ReturnType<typeof calculateSameDayDistanceGroups>;

  // Actions
  uploadFile: (file: File, manualMapping?: ColumnMapping) => Promise<ParseResult>;
  removeFile: (fileId: string) => void;
  clearData: () => void;

  // Status
  isLoading: boolean;
  hasData: boolean;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(false);

  // IndexedDB dan async hydrate
  useEffect(() => {
    let active = true;
    (async () => {
      await migrateFromLocalStorage();
      const [s, f] = await Promise.all([loadShipments(), loadFiles()]);
      if (!active) return;
      setShipments(s);
      setFiles(f);
      setIsHydrated(true);
    })();
    return () => { active = false; };
  }, []);

  // Persist (debounced async)
  useEffect(() => {
    if (!isHydrated) return;
    const t = setTimeout(() => { void saveShipments(shipments); }, 400);
    return () => clearTimeout(t);
  }, [shipments, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const t = setTimeout(() => { void saveFiles(files); }, 200);
    return () => clearTimeout(t);
  }, [files, isHydrated]);

  // Filtered shipments
  const filtered = useMemo(() => applyFilters(shipments, filters), [shipments, filters]);

  // Analytics
  const kpis = useMemo(() => calculateKPIs(filtered), [filtered]);
  const routeStats = useMemo(() => calculateRouteStats(filtered), [filtered]);
  const companyStats = useMemo(() => calculateCompanyStats(filtered), [filtered]);
  const stationStats = useMemo(() => calculateStationStats(filtered), [filtered]);
  const cargoStats = useMemo(() => calculateCargoStats(filtered), [filtered]);
  const wagonStats = useMemo(() => calculateWagonStats(filtered), [filtered]);
  const dailySeries = useMemo(() => calculateDailySeries(filtered, filters.dateField), [filtered, filters.dateField]);
  const hourlyHeatmap = useMemo(() => calculateHourlyHeatmap(filtered, filters.dateField), [filtered, filters.dateField]);
  const anomalies = useMemo(() => detectAnomalies(filtered), [filtered]);
  const routeSpeedStats = useMemo(() => calculateRouteSpeedStats(filtered), [filtered]);
  const senderSpeeds = useMemo(() => calculateSenderSpeeds(filtered), [filtered]);
  const receiverSpeeds = useMemo(() => calculateReceiverSpeeds(filtered), [filtered]);
  const dailyGroups = useMemo(() => calculateDailyRouteGroups(filtered), [filtered]);
  const sameDayDistanceGroups = useMemo(() => calculateSameDayDistanceGroups(filtered), [filtered]);

  const uploadFile = useCallback(
    async (file: File, manualMapping?: ColumnMapping): Promise<ParseResult> => {
      setIsLoading(true);
      try {
        const buf = await file.arrayBuffer();
        const result = parseExcelFile(buf, file.name, file.size, manualMapping);
        if (result.success) {
          setShipments((prev) => [...prev, ...result.shipments]);
          setFiles((prev) => [result.fileUpload, ...prev]);
        }
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const removeFile = useCallback((fileId: string) => {
    setShipments((prev) => prev.filter((s) => s.fileId !== fileId));
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const clearData = useCallback(() => {
    setShipments([]);
    setFiles([]);
    setFilters(defaultFilters);
    void clearAll();
  }, []);

  const resetFilters = useCallback(() => setFilters(defaultFilters), []);

  const value: DataContextValue = {
    isHydrated,
    shipments,
    files,
    filters,
    setFilters,
    resetFilters,
    filtered,
    kpis,
    routeStats,
    companyStats,
    stationStats,
    cargoStats,
    wagonStats,
    dailySeries,
    hourlyHeatmap,
    anomalies,
    routeSpeedStats,
    senderSpeeds,
    receiverSpeeds,
    dailyGroups,
    sameDayDistanceGroups,
    uploadFile,
    removeFile,
    clearData,
    isLoading,
    hasData: shipments.length > 0,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
