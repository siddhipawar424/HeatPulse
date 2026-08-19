import React, { useState } from 'react';
import { Header } from './components/Header';
import { LocationSelector } from './components/LocationSelector';
import { DateTimeSelector } from './components/DateTimeSelector';
import { MapPanel } from './components/MapPanel';
import { HeatRiskCard } from './components/HeatRiskCard';
import { PriorityGroups } from './components/PriorityGroups';
import { RecommendedActions } from './components/RecommendedActions';
import { LoadingIndicator } from './components/LoadingIndicator';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { OverviewSection } from './components/OverviewSection';
import { AboutSection } from './components/AboutSection';
import { DEMO_AOIS } from './data/demoAOIs';
import { analyzeHeatRisk } from './services/api';
import { Flame, MapPin, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('analysis');
  const [selectedAOI, setSelectedAOI] = useState(DEMO_AOIS[0]);
  const [date, setDate] = useState('2025-07-15');
  const [time, setTime] = useState('14:00');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Trigger analysis call to backend /api/analyze
  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await analyzeHeatRisk(selectedAOI.polygon, date, time);
      setAnalysisResult(data);
    } catch (err) {
      console.error('HeatPulse Analysis Error:', err);
      setError(err.message || 'Unable to analyze heat risk for this location');
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Navigation Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* TAB 1: HEAT ANALYSIS DASHBOARD */}
        {activeTab === 'analysis' && (
          <div className="space-y-8">
            
            {/* Top Analysis Configuration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Form Controls: Location + Date/Time */}
              <div className="lg:col-span-5 space-y-6">
                <LocationSelector
                  selectedAOI={selectedAOI}
                  onSelectAOI={setSelectedAOI}
                />
                <DateTimeSelector
                  date={date}
                  setDate={setDate}
                  time={time}
                  setTime={setTime}
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                />
              </div>

              {/* Right Interactive Map Panel */}
              <div className="lg:col-span-7 h-full">
                <MapPanel
                  selectedAOI={selectedAOI}
                  analysisResult={analysisResult}
                />
              </div>
            </div>

            {/* Results Experience Area */}
            <div className="pt-4 border-t border-gray-800/80 space-y-8">
              
              {/* State 1: Loading */}
              {isLoading && <LoadingIndicator />}

              {/* State 2: Error */}
              {!isLoading && error && (
                <ErrorState errorMessage={error} onRetry={handleAnalyze} />
              )}

              {/* State 3: Successful Results View */}
              {!isLoading && !error && analysisResult && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Heat Risk Metric Card */}
                  <HeatRiskCard
                    risk={analysisResult.risk}
                    temperatureStats={analysisResult.temperature_stats}
                  />

                  {/* Vulnerable Priority Groups */}
                  <PriorityGroups
                    groups={analysisResult.priority_groups}
                  />

                  {/* Recommended Targeted Actions & Agentic Plan */}
                  <RecommendedActions
                    actions={analysisResult.actions}
                    agentMetadata={analysisResult.agent_metadata}
                    guidelines={analysisResult.guidelines}
                  />

                </div>
              )}

              {/* State 4: Initial Empty State */}
              {!isLoading && !error && !analysisResult && (
                <EmptyState onTriggerDemo={handleAnalyze} />
              )}

            </div>

          </div>
        )}

        {/* TAB 2: OVERVIEW */}
        {activeTab === 'overview' && (
          <OverviewSection onStartAnalysis={() => setActiveTab('analysis')} />
        )}

        {/* TAB 3: ABOUT ENGINE */}
        {activeTab === 'about' && (
          <AboutSection />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800/80 py-6 px-4 text-center text-xs text-gray-500 font-mono space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-gray-300 font-bold">HeatPulse</span> — Hyperlocal Heat Intelligence System
        </div>
        <p>Built for FortyGuard AI Data Engine Integration • Frontend React + Vite</p>
      </footer>
    </div>
  );
}
