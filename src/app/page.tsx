"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Upload, Sparkles, BarChart3, Moon, Sun, X, AlertCircle, TrendingUp, TrendingDown, Minus, CheckCircle2 } from "lucide-react";

// --- TIPOS ---
type KPI = {
  title: string;
  value: string;
  subValue: string;
  trend: "up" | "down" | "neutral";
  color?: "green" | "red" | "blue";
};

type ChartData = {
  title: string;
  type: "bar" | "line" | "pie" | "area";
  description: string;
  data: { label: string; value: number }[];
};

type Recommendation = {
  title: string;
  text: string;
  impact: "high" | "medium";
};

type AIResult = {
  analysisTitle: string;
  summary: string;
  kpis: KPI[];
  charts: ChartData[];
  recommendations: Recommendation[];
};

export default function FileSenseApp() {
  const [step, setStep] = useState<"landing" | "processing" | "dashboard" | "error">("landing");
  const [progressText, setProgressText] = useState("Esperando archivo...");
  const [analysis, setAnalysis] = useState<AIResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [language, setLanguage] = useState("Español");

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const processFile = async (file: File) => {
    setStep("processing");
    setProgressText(language === "Español" ? "Leyendo archivo..." : "Reading file...");
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

      if (jsonData.length === 0) {
        throw new Error(language === "Español" ? "El archivo parece estar vacío." : "The file appears to be empty.");
      }

      setProgressText(language === "Español" ? "Analizando patrones con IA..." : "Analyzing patterns with AI...");
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: jsonData, fileName: file.name, language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (language === "Español" ? "Error en el cerebro de IA." : "Error in AI brain."));
      }

      const aiData = await response.json();
      setAnalysis(aiData);
      setStep("dashboard");

    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || (language === "Español" ? "Ocurrió un error inesperado." : "An unexpected error occurred."));
      setStep("error");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
            <Sparkles size={18} />
          </div>
          <span className="font-bold tracking-tight text-xl text-slate-900 dark:text-white">FileSense</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 gap-1">
            {["Español", "English", "Português", "Français"].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === lang
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:scale-110 transition-all shadow-sm">
            {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-emerald-600" />}
          </button>
        </div>
      </nav>

      <div className="pt-24">
        {step === "landing" && (
          <LandingView 
            language={language}
            setLanguage={setLanguage}
            onUpload={(file: File) => processFile(file)} 
          />
        )}
        {step === "processing" && <ProcessingView text={progressText} />}
        {step === "error" && <ErrorView message={errorMessage} onRetry={() => setStep("landing")} />}
        {step === "dashboard" && analysis && <DashboardView data={analysis} fileName={fileName} onReset={() => setStep("landing")} />}
      </div>
    </div>
  );
}

function LandingView({ onUpload, language, setLanguage }: { onUpload: (file: File) => void, language: string, setLanguage: (l: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const texts = {
    Español: {
      badge: "INTELIGENCIA ARTIFICIAL GENERATIVA",
      h1: "Transforma tus datos en ",
      h1Span: "decisiones inteligentes.",
      p: "Sube un Excel o CSV. Nuestra IA analizará estadísticas, detectará tendencias y creará un reporte visual completo en segundos.",
      drop: "Arrastra o selecciona un archivo",
      support: "Soporta .XLSX, .XLS y .CSV"
    },
    English: {
      badge: "GENERATIVE ARTIFICIAL INTELLIGENCE",
      h1: "Transform your data into ",
      h1Span: "smart decisions.",
      p: "Upload an Excel or CSV. Our AI will analyze statistics, detect trends and create a complete visual report in seconds.",
      drop: "Drag or select a file",
      support: "Supports .XLSX, .XLS and .CSV"
    },
    Português: {
      badge: "INTELIGÊNCIA ARTIFICIAL GENERATIVA",
      h1: "Transforme seus dados em ",
      h1Span: "decisões inteligentes.",
      p: "Carregue um Excel ou CSV. Nossa IA analisará estatísticas, detectará tendências e criará um relatório visual completo em segundos.",
      drop: "Arraste ou selecione um arquivo",
      support: "Suporta .XLSX, .XLS e .CSV"
    },
    Français: {
      badge: "INTÉLLIGENCE ARTIFICIELLE GÉNÉRATIVE",
      h1: "Transformez vos données en ",
      h1Span: "décisions intelligentes.",
      p: "Téléchargez un Excel ou CSV. Notre IA analysera les statistiques, détectera les tendances et créera un rapport visuel complet en quelques secondes.",
      drop: "Glissez oú sélectionnez un fichier",
      support: "Supporte .XLSX, .XLS et .CSV"
    }
  };

  const t = texts[language as keyof typeof texts] || texts.Español;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div className="max-w-3xl w-full px-4">
        {/* Selector de idioma para móvil */}
        <div className="md:hidden flex flex-wrap justify-center gap-2 mb-8">
           {["Español", "English", "Português", "Français"].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  language === lang
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                    : "bg-white dark:bg-zinc-900 text-slate-500 border-slate-200 dark:border-zinc-800"
                }`}
              >
                {lang}
              </button>
            ))}
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-8 border border-emerald-100 dark:border-emerald-800 shadow-sm">
          <Sparkles size={12} /> {t.badge}
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-[0.9] text-slate-900 dark:text-white">
          {t.h1} <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700 dark:from-emerald-400 dark:via-green-400 dark:to-emerald-500">
            {t.h1Span}
          </span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-zinc-400 mb-12 max-w-xl mx-auto font-medium leading-relaxed">
          {t.p}
        </p>

        <label 
          className={`group relative block w-full max-w-xl mx-auto h-48 rounded-[2.5rem] cursor-pointer overflow-hidden shadow-2xl shadow-emerald-200/50 dark:shadow-emerald-900/10 transition-all hover:scale-[1.01] ${isDragging ? 'scale-[1.02] ring-4 ring-emerald-500/50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`absolute inset-0 border-2 border-dashed border-slate-300 dark:border-zinc-700 transition-colors rounded-[2.5rem] bg-white dark:bg-zinc-900 ${isDragging ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'group-hover:border-emerald-500'}`}></div>
          <input type="file" className="hidden" onChange={handleInputChange} accept=".csv,.xlsx,.xls" />
          <div className="relative h-full flex flex-col items-center justify-center gap-4">
            <div className={`p-4 rounded-2xl transition-all duration-300 shadow-sm ${isDragging ? 'bg-emerald-600 text-white scale-110' : 'bg-emerald-50 dark:bg-zinc-800 text-emerald-600 dark:text-white group-hover:bg-emerald-600 group-hover:text-white'}`}>
              <Upload size={32} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{t.drop}</span>
              <span className="text-sm text-slate-500 dark:text-zinc-500 font-medium">{t.support}</span>
            </div>
          </div>
        </label>
      </div>
    </main>
  );
}

function ProcessingView({ text }: { text: string }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      <div className="relative w-32 h-32 mb-12">
        <div className="absolute inset-0 border-[6px] border-emerald-100 dark:border-zinc-800 rounded-full"></div>
        <div className="absolute inset-0 border-[6px] border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-emerald-600 dark:text-emerald-500 animate-pulse" size={40} />
        </div>
      </div>
      <h2 className="text-3xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">{text}</h2>
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
      </div>
    </main>
  );
}

function ErrorView({ message, onRetry }: any) {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-3xl text-red-600 mb-8 shadow-sm border border-red-100 dark:border-red-900/30">
          <AlertCircle size={48} />
      </div>
      <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">No pudimos procesar el archivo</h2>
      <p className="text-slate-600 dark:text-zinc-400 mb-10 max-w-md text-lg">{message}</p>
      <button onClick={onRetry} className="bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-slate-200 dark:shadow-none">
          Intentar de nuevo
      </button>
    </main>
  );
}

function DashboardView({ data, fileName, onReset }: { data: AIResult, fileName: string, onReset: () => void }) {
  return (
    <main className="max-w-6xl mx-auto p-6 md:p-12 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header Estilizado */}
      <header className="flex flex-col gap-6 mb-16">
        <button onClick={onReset} className="w-fit px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-slate-200 dark:border-zinc-800 shadow-sm text-slate-600 dark:text-zinc-400">
          <X size={16} /> Cerrar reporte
        </button>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase border border-emerald-200 dark:border-emerald-800 tracking-widest">
                Análisis Completado
             </div>
             <span className="text-slate-500 dark:text-zinc-400 text-sm font-bold">{fileName}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.95]">
            {data.analysisTitle}
          </h1>
          <p className="text-xl text-slate-600 dark:text-zinc-400 max-w-3xl leading-relaxed font-medium italic border-l-4 border-emerald-500 pl-6 my-4 bg-emerald-50/50 dark:bg-transparent py-2 pr-4 rounded-r-xl">
            "{data.summary}"
          </p>
        </div>
      </header>

      {/* Grid de KPIs Dinámicos */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {data.kpis.map((kpi, idx) => (
           <div key={idx} className="group relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{kpi.title}</span>
                {kpi.trend === 'up' ? <TrendingUp className="text-emerald-500" size={18} /> : 
                 kpi.trend === 'down' ? <TrendingDown className="text-red-500" size={18} /> : 
                 <Minus className="text-slate-300 dark:text-zinc-600" size={18} />}
              </div>
              <div className="text-4xl font-black mb-2 tabular-nums text-slate-900 dark:text-white">{kpi.value}</div>
              <div className={`text-sm font-bold ${
                kpi.color === 'green' ? 'text-emerald-600 dark:text-emerald-400' : 
                kpi.color === 'red' ? 'text-red-600 dark:text-red-400' : 
                'text-emerald-600 dark:text-emerald-400'
              }`}>
                {kpi.subValue}
              </div>
           </div>
        ))}
      </section>

      {/* Grid de Gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {data.charts.map((chart, idx) => (
           <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex flex-col gap-2 mb-10">
                <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <BarChart3 size={20} />
                  </div>
                  {chart.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-500 font-medium leading-relaxed">{chart.description}</p>
              </div>
              
              <div className="h-72 flex items-end justify-between gap-3 px-2 border-b border-slate-100 dark:border-zinc-800 pb-4">
                {chart.data.map((item, i) => {
                  const maxVal = Math.max(...chart.data.map(d => d.value));
                  const heightPct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                      <div className="absolute bottom-[calc(heightPct+40px)] left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 whitespace-nowrap shadow-lg">
                        {item.value.toLocaleString()}
                      </div>
                      <div 
                        className="w-full bg-emerald-100 dark:bg-zinc-800 rounded-t-2xl transition-all duration-500 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-500/20"
                        style={{ height: `${Math.max(heightPct, 8)}%` }}
                      ></div>
                      <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 truncate w-full text-center uppercase tracking-tighter">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
           </div>
        ))}
      </section>

      {/* Recomendaciones Estratégicas */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800"></div>
          <h2 className="text-xl font-black uppercase tracking-[0.3em] text-slate-400 dark:text-zinc-600">Recomendaciones</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.recommendations.map((rec, idx) => (
             <div key={idx} className="group flex flex-col gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 hover:border-emerald-200 dark:hover:border-emerald-900 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-none">
                <div className="flex justify-between items-center">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    rec.impact === 'high' 
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                  }`}>
                    Impacto {rec.impact === 'high' ? 'Alto' : 'Medio'}
                  </div>
                  <CheckCircle2 className="text-slate-200 dark:text-zinc-700 group-hover:text-emerald-500 transition-colors" size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-black mb-2 text-slate-900 dark:text-white">{rec.title}</h4>
                  <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">{rec.text}</p>
                </div>
             </div>
          ))}
        </div>
      </section>
    </main>
  );
}