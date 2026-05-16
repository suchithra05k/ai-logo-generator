/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, PenTool, Layout, Download, RefreshCw, ArrowRight, Loader2, Info, Undo2, Redo2, Play, Pause } from "lucide-react";
import { cn } from "./lib/utils";

interface LogoResult {
  svg: string;
  explanation: string;
  colors: string[];
  fontSuggestion: string;
}

interface Project {
  id: string;
  companyName: string;
  description: string;
  style: string;
  logo: LogoResult;
  timestamp: number;
}

export default function App() {
  const [step, setStep] = useState<"hero" | "input" | "generating" | "result">("hero");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("Corporate Minimalist");
  const [fontPreference, setFontPreference] = useState("Sleek Sans-Serif");
  const [letterSpacing, setLetterSpacing] = useState("Normal");
  const [logo, setLogo] = useState<LogoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("archilogo_projects");
    if (stored) {
      try {
        setSavedProjects(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved projects");
      }
    }
  }, []);

  const saveProject = () => {
    if (!logo) return;
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      companyName,
      description,
      style,
      logo,
      timestamp: Date.now(),
    };
    const updated = [newProject, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem("archilogo_projects", JSON.stringify(updated));
  };

  const loadProject = (p: Project) => {
    setCompanyName(p.companyName);
    setDescription(p.description);
    setStyle(p.style);
    setLogo(p.logo);
    setStep("result");
  };

  const deleteProject = (id: string) => {
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem("archilogo_projects", JSON.stringify(updated));
  };

  const generateLogo = async () => {
    if (!companyName || !description) {
      setError("Please fill in both name and description.");
      return;
    }
    setStep("generating");
    setError(null);
    try {
      const resp = await fetch("/api/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, description, style, fontPreference, letterSpacing }),
      });
      if (!resp.ok) throw new Error("Generation failed");
      const data = await resp.json();
      setLogo(data);
      setStep("result");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setStep("input");
    }
  };

  const reset = () => {
    setStep("input");
    setLogo(null);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#141414] font-sans selection:bg-[#141414] selection:text-white transition-colors duration-500 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {step === "hero" && (
          <motion.div key="hero" className="contents">
            <HeroSection 
              onStart={() => setStep("input")} 
              savedProjects={savedProjects}
              onLoadProject={loadProject}
              onDeleteProject={deleteProject}
            />
          </motion.div>
        )}

        {step === "input" && (
          <motion.div key="input" className="contents">
            <InputSection 
              companyName={companyName}
              setCompanyName={setCompanyName}
              description={description}
              setDescription={setDescription}
              style={style}
              setStyle={setStyle}
              fontPreference={fontPreference}
              setFontPreference={setFontPreference}
              letterSpacing={letterSpacing}
              setLetterSpacing={setLetterSpacing}
              onSubmit={generateLogo}
              error={error}
            />
          </motion.div>
        )}

        {step === "generating" && (
          <motion.div key="generating" className="contents">
            <GeneratingSection companyName={companyName} />
          </motion.div>
        )}

        {step === "result" && logo && (
          <motion.div key="result" className="contents">
            <ResultSection 
              logo={logo} 
              setLogo={setLogo}
              style={style}
              onReset={reset} 
              onSave={saveProject}
              isSaved={savedProjects.some(p => p.logo.svg === logo.svg)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface HeroProps {
  onStart: () => void;
  savedProjects: Project[];
  onLoadProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
}

function HeroSection({ onStart, savedProjects, onLoadProject, onDeleteProject }: HeroProps) {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="absolute inset-0 overflow-hidden -z-10 opacity-20">
        <svg className="w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="max-w-4xl py-24"
      >
        <span className="text-xs uppercase tracking-[0.3em] font-medium opacity-50 mb-4 block">Design with Intelligence</span>
        <h1 className="font-display text-[15vw] md:text-[10vw] leading-[0.85] uppercase font-black tracking-tighter mb-8 transform -skew-x-6">
          Archi<span className="text-orange-600">Logo</span>
        </h1>
        <p className="text-lg md:text-xl font-light text-neutral-600 mb-12 max-w-2xl mx-auto">
          We transform your company's story into a distinctive, animated identity. 
          Professional SVG logos generated by state-of-the-art AI.
        </p>
        
        <button 
          id="cta-start"
          onClick={onStart}
          className="group relative px-8 py-4 bg-[#141414] text-white text-sm font-bold uppercase tracking-widest overflow-hidden transition-all hover:pr-12"
        >
          <span className="relative z-10">Define Your Brand</span>
          <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all" size={18} />
        </button>

        {savedProjects.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-24 pt-12 border-t border-neutral-100"
          >
            <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-30 mb-8">Recent Identity Projects</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {savedProjects.slice(0, 4).map(p => (
                <div key={p.id} className="group relative">
                  <button 
                    onClick={() => onLoadProject(p)}
                    className="w-full aspect-square bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-center overflow-hidden grayscale hover:grayscale-0"
                    dangerouslySetInnerHTML={{ __html: p.logo.svg }}
                  />
                  <div className="mt-2 text-left">
                    <div className="text-[10px] font-bold truncate">{p.companyName}</div>
                    <div className="text-[8px] opacity-40 uppercase tracking-widest">{new Date(p.timestamp).toLocaleDateString()}</div>
                  </div>
                  <button 
                    onClick={() => onDeleteProject(p.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-sm border border-neutral-100 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all hover:bg-neutral-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-12 opacity-30">
        <div className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
          <Sparkles size={12} /> SVG Logic
        </div>
        <div className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
          <PenTool size={12} /> Motion Ready
        </div>
        <div className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
          <Layout size={12} /> Smart Scaling
        </div>
      </div>
    </motion.section>
  );
}

function InputSection({ 
  companyName, setCompanyName, description, setDescription, style, setStyle, fontPreference, setFontPreference, letterSpacing, setLetterSpacing, onSubmit, error 
}: any) {
  const styles = [
    "Corporate Minimalist",
    "Tech Startup",
    "Luxury Editorial",
    "Eco Friendly",
    "Brutalist Modern",
    "Geometric Abstract"
  ];

  const fontOptions: Record<string, string[]> = {
    "Corporate Minimalist": ["Inter & IBM Plex", "Helvetica & Georgia", "Sleek Sans-Serif", "Modern Grotesque"],
    "Tech Startup": ["Space Grotesk & Mono", "Geometric Sans", "Futuristic Mono", "Minimalist Cyber"],
    "Luxury Editorial": ["Playfair & Montserrat", "Elegant Didone", "High-Contrast Serif", "Minimal Script"],
    "Eco Friendly": ["Recoleta & Inter", "Organic Rounded", "Soft Humanist", "Handcrafted Script"],
    "Brutalist Modern": ["JetBrains Mono & Impact", "Heavy Impact", "Industrial Mono", "Raw Grotesque"],
    "Geometric Abstract": ["Bauhaus Style", "Strict Geometric", "Abstract Line", "Futura & Futura"]
  };

  const predefinedRationales: Record<string, string> = {
    "Inter & IBM Plex": "Industrial-grade clarity that balances modern tech minimalism with structural engineering precision.",
    "Helvetica & Georgia": "The 'Gold Standard' for established modernism; provides neutral functionalism paired with deep-seated institutional trust.",
    "Space Grotesk & Mono": "Aggressively technical and forward-thinking; perfect for developer tools or space-age fintech ventures.",
    "Playfair & Montserrat": "A classic 'Editorial' pairing that conveys high-fashion luxury grounded by democratic geometric stability.",
    "Recoleta & Inter": "Warm, humanist, and approachable. This pairing feels authentic and 'organic' while remaining highly legible across platforms.",
    "JetBrains Mono & Impact": "Raw, brutalist energy that speaks to power and efficiency; ideal for street-style brands or performance-centric tools.",
    "Bauhaus Style": "Rigid adherence to early 20th-century geometric logic; represents total functionalism and architectural purity."
  };

  const [isCustomFont, setIsCustomFont] = useState(false);
  const [aiFontSuggestions, setAiFontSuggestions] = useState<any[]>([]);
  const [isSuggestingFonts, setIsSuggestingFonts] = useState(false);

  const suggestFonts = async () => {
    if (!description) return;
    setIsSuggestingFonts(true);
    try {
      const resp = await fetch("/api/suggest-fonts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          description, 
          style, 
          customInput: isCustomFont ? fontPreference : undefined,
          letterSpacing: isCustomFont ? letterSpacing : undefined
        }),
      });
      const data = await resp.json();
      setAiFontSuggestions(data);
    } catch (e) {
      console.error("Font suggestion failed");
    } finally {
      setIsSuggestingFonts(false);
    }
  };

  useEffect(() => {
    // When style changes, suggest the first font in that category
    if (fontOptions[style] && !fontOptions[style].includes(fontPreference) && !isCustomFont) {
      setFontPreference(fontOptions[style][0]);
    }
  }, [style]);

  return (
    <motion.section 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className="w-full max-w-2xl">
        <h2 className="text-3xl font-light mb-8 italic serif">The Blueprint</h2>
        
        <div className="space-y-8 bg-white p-8 md:p-12 rounded-[2rem] border border-neutral-100 shadow-sm">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest mb-3 block opacity-50">Company Name</label>
            <input 
              id="input-name"
              type="text" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Arcane Solutions"
              className="w-full bg-transparent border-b border-neutral-200 py-3 text-xl focus:border-[#141414] outline-none transition-all placeholder:text-neutral-300"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest mb-3 block opacity-50">Brand Philosophy & Context</label>
            <textarea 
              id="input-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us what you do, who you serve, and your core values..."
              className="w-full bg-transparent border-b border-neutral-200 py-3 text-lg h-32 resize-none focus:border-[#141414] outline-none transition-all placeholder:text-neutral-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest mb-4 block opacity-50">Visual Trajectory</label>
              <div className="flex flex-wrap gap-2">
                {styles.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-medium transition-all",
                      style === s 
                        ? "bg-[#141414] text-white" 
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] uppercase font-bold tracking-widest block opacity-50">Typography Tone</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsCustomFont(false)}
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all",
                      !isCustomFont ? "text-black bg-neutral-100" : "text-neutral-400 hover:text-neutral-600"
                    )}
                  >
                    Curated
                  </button>
                  <button 
                    onClick={() => setIsCustomFont(true)}
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all",
                      isCustomFont ? "text-orange-600 bg-orange-50" : "text-neutral-400 hover:text-neutral-600"
                    )}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {!isCustomFont ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {fontOptions[style]?.map(f => (
                      <button
                        key={f}
                        onClick={() => {
                          setFontPreference(f);
                          setAiFontSuggestions([]); // Clear AI suggestions if switching back to curated
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                          fontPreference === f 
                            ? "bg-[#141414] border-[#141414] text-white shadow-lg scale-[1.02]" 
                            : "bg-white border-neutral-100 text-neutral-400 hover:border-neutral-200 hover:text-neutral-600"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {predefinedRationales[fontPreference] && (
                      <motion.div 
                        key={fontPreference}
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-4">
                            <div>
                              <div className="text-[8px] uppercase tracking-[0.2em] font-black text-orange-600 mb-2">Typography Moodboard</div>
                              {/* Dynamic Preview based on selection */}
                              <div className={cn(
                                "h-24 flex items-center justify-center bg-neutral-50 rounded-xl border border-neutral-50 overflow-hidden",
                                fontPreference.includes("Serif") || fontPreference.includes("Playfair") || fontPreference.includes("Recoleta") ? "font-serif" : 
                                fontPreference.includes("Mono") ? "font-mono" : "font-sans",
                                fontPreference.includes("Impact") || fontPreference.includes("Bold") ? "font-black" : "font-medium"
                              )}>
                                <span className={cn(
                                  "text-3xl tracking-tighter opacity-80",
                                  fontPreference.includes("Space") && "tracking-widest uppercase text-xl"
                                )}>
                                  {companyName || "Logo"}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="text-[10px] text-neutral-800 font-medium leading-relaxed italic">
                                "{predefinedRationales[fontPreference]}"
                              </div>
                              <p className="text-[9px] text-neutral-400">
                                This selection anchors the <span className="text-orange-600 font-bold uppercase tracking-tight">{style}</span> trajectory for your brand.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={fontPreference}
                        onChange={(e) => setFontPreference(e.target.value)}
                        placeholder="e.g. Gotham Bold & Neutraface"
                        className="w-full bg-neutral-50 border border-neutral-200 py-3 px-4 text-xs focus:border-orange-600 outline-none transition-all placeholder:text-neutral-300 rounded-xl pr-24"
                      />
                      <button 
                        onClick={suggestFonts}
                        disabled={isSuggestingFonts || !description}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-sm border border-neutral-100 text-orange-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-orange-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed group flex items-center gap-2"
                      >
                        {isSuggestingFonts ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="group-hover:scale-110 transition-transform" />}
                        {isSuggestingFonts ? "Analyzing..." : "AI Suggest"}
                      </button>
                    </div>

                    <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <label className="text-[8px] uppercase font-black tracking-widest text-neutral-400">Kerning</label>
                      <div className="flex gap-1 flex-1">
                        {["Tight", "Normal", "Wide"].map(ls => (
                          <button
                            key={ls}
                            onClick={() => setLetterSpacing(ls)}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all",
                              letterSpacing === ls 
                                ? "bg-white shadow-sm text-orange-600" 
                                : "text-neutral-400 hover:text-neutral-600"
                            )}
                          >
                            {ls}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {aiFontSuggestions.length > 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-[1px] flex-1 bg-neutral-100" />
                          <span className="text-[8px] uppercase font-black tracking-[0.2em] text-neutral-300">Magic Suggestions</span>
                          <div className="h-[1px] flex-1 bg-neutral-100" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {aiFontSuggestions.map((sug, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setFontPreference(sug.pairName);
                                setAiFontSuggestions([]);
                              }}
                              className="text-left p-4 hover:bg-orange-50 rounded-2xl transition-all border border-neutral-100 hover:border-orange-200 group bg-white shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-black text-neutral-900 uppercase tracking-tighter">{sug.pairName}</span>
                                <ArrowRight size={12} className="text-orange-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                              </div>

                              <div 
                                className={cn(
                                  "mb-4 p-4 rounded-xl bg-neutral-50/50 border border-neutral-100 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-white",
                                  sug.previewStyle?.fontCategory === "serif" && "font-serif",
                                  sug.previewStyle?.fontCategory === "sans-serif" && "font-sans",
                                  sug.previewStyle?.fontCategory === "mono" && "font-mono",
                                  sug.previewStyle?.weight === "light" && "font-light",
                                  sug.previewStyle?.weight === "normal" && "font-normal",
                                  sug.previewStyle?.weight === "bold" && "font-bold",
                                  sug.previewStyle?.weight === "black" && "font-black",
                                  sug.previewStyle?.letterSpacing === "tight" && "tracking-tighter",
                                  sug.previewStyle?.letterSpacing === "wide" && "tracking-widest",
                                  sug.previewStyle?.textTransform === "uppercase" && "uppercase",
                                  sug.previewStyle?.textTransform === "lowercase" && "lowercase",
                                  sug.previewStyle?.slant === "italic" && "italic"
                                )}
                              >
                                <span className="text-xl whitespace-nowrap text-neutral-800">{companyName || "Logo"}</span>
                              </div>

                              <div className="space-y-2">
                                <div className="text-[9px] text-neutral-500 leading-relaxed font-medium italic">"{sug.rationale}"</div>
                                <div className="flex items-center gap-2 pt-2 border-t border-neutral-50">
                                  <span className="text-[8px] font-bold text-orange-600 uppercase tracking-widest">{sug.visualVibe}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="px-1">
                        <p className="text-[9px] text-neutral-400 italic">Describe a custom pairing above, or use the <strong>AI Suggest</strong> button for personalized recommendations based on your brand strategy.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button 
            id="btn-generate"
            onClick={onSubmit}
            className="w-full py-5 bg-[#141414] text-white font-bold uppercase tracking-[0.2em] text-sm hover:bg-neutral-800 transition-all flex items-center justify-center gap-3"
          >
            Draft Visual Identity
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </motion.section>
  );
}

interface GeneratingProps {
  companyName: string;
}

function GeneratingSection({ companyName }: GeneratingProps) {
  const steps = [
    "Analyzing semantic intent...",
    "Extracting brand DNA...",
    "Synthesizing geometric primitives...",
    "Optimizing SVG paths...",
    "Applying chromatic theory..."
  ];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(s => (s + 1) % steps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#141414] text-white"
    >
      <div className="relative mb-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-2 border-white/10 rounded-full border-t-white"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <PenTool className="text-white/40" />
        </div>
      </div>
      
      <h2 className="text-xl font-light tracking-[0.1em] mb-4">Architecting for <span className="font-bold">{companyName}</span></h2>
      <AnimatePresence mode="wait">
        <motion.p 
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-white/50 text-xs uppercase tracking-widest font-mono"
        >
          {steps[currentStep]}
        </motion.p>
      </AnimatePresence>
    </motion.section>
  );
}

interface ResultProps {
  logo: LogoResult;
  setLogo: React.Dispatch<React.SetStateAction<LogoResult | null>>;
  style: string;
  onReset: () => void;
  onSave: () => void;
  isSaved: boolean;
}

function ResultSection({ logo, setLogo, style, onReset, onSave, isSaved }: ResultProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [animPreset, setAnimPreset] = useState("entrance");
  const [animSpeed, setAnimSpeed] = useState(1.2);
  const [isStaggered, setIsStaggered] = useState(true);
  const [animatedIndices, setAnimatedIndices] = useState<number[]>([0, 1, 2, 3, 4]); // Default to all
  
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [harmonies, setHarmonies] = useState<any[]>([]);

  // History management
  const [history, setHistory] = useState<LogoResult[]>([logo]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const getDecoratedSvg = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(logo.svg, "image/svg+xml");
      const svgElement = doc.querySelector("svg");
      if (!svgElement) return logo.svg;

      Array.from(svgElement.children).forEach((child, i) => {
        const isAnimated = animatedIndices.includes(i);
        if (!isAnimated) {
          (child as HTMLElement).style.animation = "none";
          (child as HTMLElement).style.opacity = "1";
          (child as HTMLElement).style.transform = "none";
          (child as HTMLElement).style.filter = "none";
        }
      });

      return svgElement.outerHTML;
    } catch (e) {
      return logo.svg;
    }
  };

  const getChildCount = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(logo.svg, "image/svg+xml");
      return doc.querySelector("svg")?.children.length || 0;
    } catch (e) {
      return 0;
    }
  };

  const toggleIndex = (i: number) => {
    setAnimatedIndices(prev => 
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const childCount = getChildCount();

  const presets = [
    { id: "entrance", label: "Entrance" },
    { id: "fade-in", label: "Fade In" },
    { id: "scale-up", label: "Scale Up" },
    { id: "bounce", label: "Bounce" }
  ];

  const addToHistory = (newLogo: LogoResult) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newLogo))); // Deep copy
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setLogo(newLogo);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setLogo(history[prevIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setLogo(history[nextIndex]);
    }
  };

  const updateColor = (index: number, newColor: string) => {
    const oldColor = logo.colors[index];
    const newColors = [...logo.colors];
    newColors[index] = newColor;

    // Replace color in SVG
    const escapedOld = oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const colorRegex = new RegExp(escapedOld, 'gi');
    const newSvg = logo.svg.replace(colorRegex, newColor);

    addToHistory({
      ...logo,
      colors: newColors,
      svg: newSvg
    });
  };

  const harmonize = async () => {
    setIsHarmonizing(true);
    try {
      const resp = await fetch("/api/harmonize-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colors: logo.colors, style }),
      });
      const data = await resp.json();
      setHarmonies(data);
    } catch (e) {
      console.error("Harmonization failed");
    } finally {
      setIsHarmonizing(false);
    }
  };

  const applyPalette = (newPalette: string[]) => {
    let currentSvg = logo.svg;
    const currentColors = [...logo.colors];
    const placeholders = currentColors.map((_, i) => `__COLOR_PLACEHOLDER_${i}__`);
    
    currentColors.forEach((oldC, i) => {
      const escaped = oldC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      currentSvg = currentSvg.replace(new RegExp(escaped, 'gi'), placeholders[i]);
    });

    placeholders.forEach((p, i) => {
      currentSvg = currentSvg.replace(new RegExp(p, 'g'), newPalette[i]);
    });

    addToHistory({
      ...logo,
      colors: newPalette,
      svg: currentSvg
    });
    setHarmonies([]);
  };

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative"
    >
      <AnimatePresence>
        {showGuidelines && (
          <BrandGuidelines logo={logo} onClose={() => setShowGuidelines(false)} />
        )}
      </AnimatePresence>

      {/* Visualizer Area */}
      <div className="lg:col-span-8 bg-[#eeeeee] flex flex-col items-center justify-center p-8 lg:p-24 relative overflow-y-auto">
        <div className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Production Output 512
        </div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="bg-white p-12 lg:p-24 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] rounded-[3rem] w-full max-w-xl aspect-square flex items-center justify-center overflow-hidden mb-12"
        >
          <div 
            key={`${logo.svg}-${animPreset}-${animSpeed}-${isStaggered}-${animatedIndices.join(",")}`}
            style={{ 
              animationPlayState: isAnimating ? 'running' : 'paused',
              ['--anim-duration' as any]: `${animSpeed}s`,
              ['--anim-stagger' as any]: isStaggered ? '0.2s' : '0s'
            }}
            className={cn(
              "w-full h-full flex items-center justify-center logo-animate", 
              !isAnimating && "paused",
              animPreset !== "entrance" && `preset-${animPreset}`
            )}
            dangerouslySetInnerHTML={{ __html: getDecoratedSvg() }} 
          />
        </motion.div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-4">
            <button 
              id="btn-toggle-motion"
              onClick={() => setIsAnimating(prev => !prev)}
              className={cn(
                "px-8 py-4 text-[10px] font-bold uppercase tracking-widest shadow-xl rounded-full flex items-center gap-3 transition-all active:scale-95",
                isAnimating 
                  ? "bg-[#141414] text-white hover:bg-neutral-800" 
                  : "bg-white text-[#141414] hover:bg-neutral-50 border border-neutral-100"
              )}
            >
              {isAnimating ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              {isAnimating ? "Pause" : "Play"}
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex flex-col gap-2">
              <label className="text-[8px] uppercase font-black tracking-widest text-neutral-400">Presets</label>
              <div className="flex gap-1">
                {presets.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setAnimPreset(p.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      animPreset === p.id 
                        ? "bg-black text-white" 
                        : "text-neutral-500 hover:bg-neutral-100"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-8 w-[1px] bg-neutral-200 hidden md:block" />

            <div className="flex flex-col gap-2 w-32">
              <div className="flex justify-between items-center">
                <label className="text-[8px] uppercase font-black tracking-widest text-neutral-400">Speed</label>
                <span className="text-[9px] font-mono font-bold">{animSpeed}s</span>
              </div>
              <input 
                type="range" 
                min="0.2" 
                max="3" 
                step="0.1" 
                value={animSpeed}
                onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
                className="w-full accent-black"
              />
            </div>

            <div className="h-8 w-[1px] bg-neutral-200 hidden md:block" />

            <div className="flex flex-col gap-2">
              <label className="text-[8px] uppercase font-black tracking-widest text-neutral-400">Layers</label>
              <div className="flex gap-1">
                {Array.from({ length: childCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => toggleIndex(i)}
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold transition-all",
                      animatedIndices.includes(i)
                        ? "bg-orange-600 text-white" 
                        : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-8 w-[1px] bg-neutral-200 hidden md:block" />

            <button 
              onClick={() => setIsStaggered(!isStaggered)}
              className={cn(
                "flex flex-col gap-1 items-center transition-all",
                isStaggered ? "text-orange-600" : "text-neutral-400 opacity-50"
              )}
            >
              <label className="text-[8px] uppercase font-black tracking-widest text-neutral-400">Stagger</label>
              <div className={cn(
                "w-10 h-5 rounded-full p-1 transition-colors",
                isStaggered ? "bg-orange-600" : "bg-neutral-200"
              )}>
                <div className={cn(
                  "w-3 h-3 bg-white rounded-full transition-transform",
                  isStaggered ? "translate-x-5" : "translate-x-0"
                )} />
              </div>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Details Area */}
      <div className="lg:col-span-4 bg-white p-10 lg:p-16 border-l border-neutral-100 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-30 mb-8 underline">
            Identity Dossier
          </div>
          
          <h1 className="text-4xl font-display font-black leading-none mb-6">Visual<br/>Rationale</h1>
          
          <p className="text-neutral-500 leading-relaxed mb-10 text-lg font-light">
            {logo.explanation}
          </p>

          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest block opacity-40">Color Palette</label>
                  <div className="flex gap-4 mt-2">
                    <button 
                      onClick={undo}
                      disabled={historyIndex === 0}
                      className="p-1 rounded hover:bg-neutral-100 disabled:opacity-20 transition-all"
                      title="Undo"
                    >
                      <Undo2 size={14} />
                    </button>
                    <button 
                      onClick={redo}
                      disabled={historyIndex >= history.length - 1}
                      className="p-1 rounded hover:bg-neutral-100 disabled:opacity-20 transition-all"
                      title="Redo"
                    >
                      <Redo2 size={14} />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={harmonize}
                  disabled={isHarmonizing}
                  className="text-[9px] font-bold uppercase tracking-widest text-orange-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {isHarmonizing ? <Loader2 className="animate-spin" size={10} /> : <Sparkles size={10} />}
                  Find Harmony
                </button>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {logo.colors.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 group relative">
                    <input 
                      type="color" 
                      value={c}
                      onChange={(e) => updateColor(i, e.target.value)}
                      className="w-14 h-14 rounded-2xl shadow-inner border border-black/5 cursor-pointer appearance-none bg-transparent"
                    />
                    <span className="text-[9px] font-mono opacity-50 uppercase">{c}</span>
                  </div>
                ))}
              </div>

              {harmonies.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-8 space-y-4 pt-6 border-t border-neutral-50"
                >
                  <label className="text-[9px] uppercase font-bold tracking-widest opacity-30">Harmonious Suggestions</label>
                  <div className="grid grid-cols-1 gap-3">
                    {harmonies.map((h, i) => (
                      <button 
                        key={i}
                        onClick={() => applyPalette(h.palette)}
                        className="w-full text-left p-3 rounded-xl hover:bg-neutral-50 transition-all border border-transparent hover:border-neutral-100 group"
                      >
                        <div className="text-[9px] font-bold uppercase tracking-widest mb-2 opacity-50">{h.description}</div>
                        <div className="flex gap-1">
                          {h.palette.map((pc: string) => (
                            <div key={pc} className="h-4 flex-1 rounded-sm" style={{ backgroundColor: pc }} />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest block opacity-40 mb-3">Type Vibe</label>
              <div className="p-4 bg-neutral-50 rounded-xl flex items-center gap-4 text-sm font-medium">
                <div className="w-8 h-8 bg-neutral-200 rounded flex items-center justify-center font-serif text-lg">Aa</div>
                {logo.fontSuggestion}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-3">
          {!isSaved && (
            <button 
              onClick={onSave}
              className="w-full py-4 bg-orange-600 text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-700 transition-all rounded-lg"
            >
              <Sparkles size={16} /> Save to Brand Gallery
            </button>
          )}

          {isSaved && (
            <div className="w-full py-4 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg border border-green-100">
              Identity Saved Successfully
            </div>
          )}

          <button 
            onClick={() => setShowGuidelines(true)}
            className="w-full py-4 bg-neutral-100 text-[#141414] text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all rounded-lg"
          >
            <Layout size={16} /> View Brand Guidelines
          </button>

          <button 
            id="btn-download"
            onClick={() => {
              const blob = new Blob([logo.svg], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'logo.svg';
              a.click();
            }}
            className="w-full py-4 bg-[#141414] text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all rounded-lg"
          >
            <Download size={16} /> Export Production SVG
          </button>
          
          <button 
            onClick={onReset}
            className="w-full py-4 text-neutral-400 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:text-[#141414] transition-all rounded-lg"
          >
            New Brand Project
          </button>
        </div>
      </div>
    </motion.section>
  );
}

function BrandGuidelines({ logo, onClose }: { logo: LogoResult; onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-50 bg-white overflow-y-auto p-8 md:p-24"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-24">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Internal Document</div>
            <h2 className="text-3xl font-display font-black uppercase">Brand Guidelines v1.0</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-4 hover:bg-neutral-100 rounded-full transition-all"
          >
            <ArrowRight className="rotate-180" size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 mb-32">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 block underline">01. Logo Usage</label>
            <div className="bg-neutral-50 p-12 rounded-3xl mb-8 flex items-center justify-center aspect-square shadow-inner overflow-hidden">
              <div 
                className="w-48 h-48 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: logo.svg }} 
              />
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Always maintain a minimum clear space of 50px around the logo. 
              The logo should never be scaled below 100px width in digital applications.
              Do not modify the component colors or structural group positioning.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 block underline">02. Chromatic Strategy</label>
            <div className="grid grid-cols-1 gap-6">
              {logo.colors.map((c, i) => (
                <div key={c} className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl shadow-sm border border-black/5" style={{ backgroundColor: c }} />
                  <div>
                    <div className="text-xs font-bold uppercase mb-1">Primary {i + 1}</div>
                    <div className="text-xs font-mono opacity-50 uppercase">{c}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 bg-[#141414] text-white p-8 rounded-3xl">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4 italic">Accessibility Check</div>
              <p className="text-xs leading-relaxed opacity-80 font-light">
                This palette has been optimized for high contrast ratios and digital readability.
                Ensure consistent background usage on neutral brand surfaces (#FAFAFA).
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-24 mb-24">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8 block underline">03. Typography & Voice</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-4">{logo.fontSuggestion}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                The brand uses a hierarchy of {logo.fontSuggestion.toLowerCase()} typeface systems to convey 
                precision and architectural integrity.
              </p>
              <div className="space-y-2 opacity-30 select-none pointer-events-none">
                <div className="text-4xl font-black uppercase">ABCDEFGHIJKLM</div>
                <div className="text-4xl font-light">nopqrstuvwxyz</div>
                <div className="text-4xl font-mono">1234567890!@#</div>
              </div>
            </div>
            <div className="bg-neutral-50 p-10 rounded-3xl">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4 italic">Designer Notes</div>
              <p className="text-neutral-600 text-sm font-serif italic italic leading-relaxed">
                "The core of this identity lies in the {logo.explanation.split('.')[0]}. 
                It creates a visual anchor that feels both established and forward-thinking."
              </p>
            </div>
          </div>
        </div>

        <div className="text-center py-24 border-t border-neutral-100 opacity-20">
          <div className="text-[8px] font-bold uppercase tracking-[0.4em]">Proprietary Document — SmartLogo AI Generator</div>
        </div>
      </div>
    </motion.div>
  );
}

