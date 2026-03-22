'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ASSET_NAMES } from './types';
import { getCorrelationSubMatrix, getVolatilities, getDrifts, powerIteration } from './math';

export interface PortfolioState {
  tickers: string[];
  dataPeriod: '3mo' | '6mo' | '1y' | '2y' | '5y';
  isAnalyzing: boolean;
  alpha: number;
  beta: number;
  contagionSteps: number;
  
  // Computed state
  correlationMatrix: number[][] | null;
  assetReturns: Record<string, number[]> | null; // Placeholder for actual returns if needed globally
  assetVols: Record<string, number> | null;
  assetDrifts: Record<string, number> | null;
  portfolioWeights: Record<string, number> | null;
  lastAnalyzed: Date | null;
  lambdaMax: number | null;
}

export interface PortfolioActions {
  setTickers: (t: string[]) => void;
  setDataPeriod: (p: string) => void;
  setAlpha: (a: number) => void;
  setBeta: (b: number) => void;
  setContagionSteps: (s: number) => void;
  runAnalysis: () => Promise<void>;
}

export const PortfolioContext = createContext<PortfolioState & PortfolioActions | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [tickers, setTickers] = useState<string[]>(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'AXISBANK', 'SBIN', 'WIPRO', 'LT', 'MARUTI', 'Gold', 'Silver', 'RealEstate']);
  const [dataPeriod, setDataPeriod] = useState<'3mo' | '6mo' | '1y' | '2y' | '5y'>('1y');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [alpha, setAlpha] = useState(0.30);
  const [beta, setBeta] = useState(0.05);
  const [contagionSteps, setContagionSteps] = useState(20);
  
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][] | null>(null);
  const [assetReturns, setAssetReturns] = useState<Record<string, number[]> | null>(null);
  const [assetVols, setAssetVols] = useState<Record<string, number> | null>(null);
  const [assetDrifts, setAssetDrifts] = useState<Record<string, number> | null>(null);
  const [portfolioWeights, setPortfolioWeights] = useState<Record<string, number> | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [lambdaMax, setLambdaMax] = useState<number | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Filter out valid tickers
    const validTickers = tickers.filter(t => ASSET_NAMES.includes(t as any));
    
    const subMatrix = getCorrelationSubMatrix(validTickers);
    setCorrelationMatrix(subMatrix);
    
    if (subMatrix.length > 0) {
      const { eigenvalue } = powerIteration(subMatrix);
      setLambdaMax(eigenvalue);
    } else {
      setLambdaMax(null);
    }
    
    const vols = getVolatilities(validTickers);
    const drifts = getDrifts(validTickers);
    const weight = 1 / (validTickers.length || 1);
    
    const volsMap: Record<string, number> = {};
    const driftsMap: Record<string, number> = {};
    const weightsMap: Record<string, number> = {};
    
    validTickers.forEach((t, i) => {
      volsMap[t] = vols[i];
      driftsMap[t] = drifts[i];
      weightsMap[t] = weight;
    });
    
    setAssetVols(volsMap);
    setAssetDrifts(driftsMap);
    setPortfolioWeights(weightsMap);
    setAssetReturns({}); // If we needed historical returns explicitly, we'd compute them here
    
    setLastAnalyzed(new Date());
    setIsAnalyzing(false);
  };
  
  // Initial run
  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    tickers, dataPeriod, isAnalyzing, alpha, beta, contagionSteps,
    correlationMatrix, assetReturns, assetVols, assetDrifts, portfolioWeights, lastAnalyzed, lambdaMax,
    setTickers,
    setDataPeriod: (p: string) => setDataPeriod(p as any),
    setAlpha, setBeta, setContagionSteps,
    runAnalysis,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
