"use client";

// =====================================================
// PLAN CONTEXT — Reja modulining global state'i
// DataProvider (Shipment) dan butunlay alohida
// =====================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  PlanRecord,
  PlanFilters,
  PlanKPIs,
  PlanParseResult,
  PlanMeta,
} from './plan-types';
import {
  applyPlanFilters,
  calculatePlanKPIs,
  calculateCancellationReasons,
  calculateStationStats,
  calculateCargoStats,
  calculateWagonTypeStats,
  calculateDailyDynamics,
  calculateApproverStats,
  calculatePlanAnomalies,
  extractUniqueValues,
} from './plan-analytics';
import { parsePlanFile } from './plan-parser';
import {
  loadPlanRecords,
  loadPlanMeta,
  savePlanRecords,
  clearPlanData,
} from './plan-storage';

const defaultFilters: PlanFilters = {
  sheetKind: 'all',
  dateRange: { start: null, end: null },
  dateField: 'requestEnteredAt',
  stations: [],
  destStations: [],
  cargos: [],
  wagonTypes: [],
  statuses: [],
  approvers: [],
  search: '',
};

export interface UploadProgress {
  phase: string;
  percent: number;
}

interface PlanContextValue {
  isHydrated: boolean;
  hasData: boolean;

  records: PlanRecord[];
  meta: PlanMeta | null;

  filters: PlanFilters;
  setFilters: (f: PlanFilters) => void;
  resetFilters: () => void;

  filtered: PlanRecord[];

  kpis: PlanKPIs;
  cancellationReasons: ReturnType<typeof calculateCancellationReasons>;
  stationStats: ReturnType<typeof calculateStationStats>;
  cargoStats: ReturnType<typeof calculateCargoStats>;
  wagonTypeStats: ReturnType<typeof calculateWagonTypeStats>;
  dailyDynamics: ReturnType<typeof calculateDailyDynamics>;
  approverStats: ReturnType<typeof calculateApproverStats>;
  anomalies: ReturnType<typeof calculatePlanAnomalies>;
  uniqueValues: ReturnType<typeof extractUniqueValues>;

  uploading: boolean;
  uploadProgress: UploadProgress | null;
  lastParseResult: PlanParseResult | null;

  uploadFile: (file: File) => Promise<PlanParseResult>;
  clearData: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [records, setRecords] = useState<PlanRecord[]>([]);
  const [meta, setMeta] = useState<PlanMeta | null>(null);
  const [filters, setFiltersState] = useState<PlanFilters>(defaultFilters);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [lastParseResult, setLastParseResult] = useState<PlanParseResult | null>(null);

  // Boshlang'ich yuklash IndexedDB dan
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [storedRecords, storedMeta] = await Promise.all([
        loadPlanRecords(),
        loadPlanMeta(),
      ]);
      if (!mounted) return;
      setRecords(storedRecords);
      setMeta(storedMeta);
      setIsHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setFilters = useCallback((f: PlanFilters) => setFiltersState(f), []);
  const resetFilters = useCallback(() => setFiltersState(defaultFilters), []);

  const uploadFile = useCallback(async (file: File): Promise<PlanParseResult> => {
    setUploading(true);
    setUploadProgress({ phase: 'Boshlanmoqda', percent: 0 });
    try {
      const result = await parsePlanFile(file, (phase, percent) => {
        setUploadProgress({ phase, percent });
      });

      setUploadProgress({ phase: 'IndexedDB ga saqlanmoqda', percent: 0 });
      const newMeta: PlanMeta = {
        fileName: result.fileName,
        fileSize: result.fileSize,
        parsedAt: result.parsedAt.toISOString(),
        totalRows: result.totalRows,
        qualityIssueCount: result.qualityIssueCount,
        sheetCounts: result.sheetCounts,
      };

      await savePlanRecords(result.records, newMeta, (saved, total) => {
        setUploadProgress({
          phase: 'Saqlanmoqda',
          percent: Math.round((saved / total) * 100),
        });
      });

      setRecords(result.records);
      setMeta(newMeta);
      setLastParseResult(result);
      setUploadProgress({ phase: 'Tayyor', percent: 100 });
      return result;
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(null);
      }, 800);
    }
  }, []);

  const clearData = useCallback(async () => {
    await clearPlanData();
    setRecords([]);
    setMeta(null);
    setLastParseResult(null);
    setFiltersState(defaultFilters);
  }, []);

  const filtered = useMemo(() => applyPlanFilters(records, filters), [records, filters]);

  const kpis = useMemo(() => calculatePlanKPIs(filtered), [filtered]);
  const cancellationReasons = useMemo(() => calculateCancellationReasons(filtered), [filtered]);
  const stationStats = useMemo(() => calculateStationStats(filtered), [filtered]);
  const cargoStats = useMemo(() => calculateCargoStats(filtered), [filtered]);
  const wagonTypeStats = useMemo(() => calculateWagonTypeStats(filtered), [filtered]);
  const dailyDynamics = useMemo(() => calculateDailyDynamics(filtered), [filtered]);
  const approverStats = useMemo(() => calculateApproverStats(filtered), [filtered]);
  const anomalies = useMemo(() => calculatePlanAnomalies(filtered), [filtered]);
  const uniqueValues = useMemo(() => extractUniqueValues(records), [records]);

  const value: PlanContextValue = {
    isHydrated,
    hasData: records.length > 0,
    records,
    meta,
    filters,
    setFilters,
    resetFilters,
    filtered,
    kpis,
    cancellationReasons,
    stationStats,
    cargoStats,
    wagonTypeStats,
    dailyDynamics,
    approverStats,
    anomalies,
    uniqueValues,
    uploading,
    uploadProgress,
    lastParseResult,
    uploadFile,
    clearData,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlanData(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error('usePlanData must be used within PlanProvider');
  }
  return ctx;
}
