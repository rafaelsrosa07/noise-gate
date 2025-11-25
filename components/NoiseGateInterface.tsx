"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, CheckCircle2, Circle, Zap, LogOut, Play, Pause, AlertTriangle, X, Maximize, Minimize, Clock, Save, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// --- TIPAGEM ---
interface Step {
  id: string; 
  text: string;
  is_completed: boolean;
  is_active: boolean;
  time_left: number; 
  original_focus_time: number; 
}

interface TaskPlan {
  id: string; 
  one_thing: string;
  steps: Step[];
  call_to_action: string;
}

// --- ESTADO GLOBAL ---
let globalTimerRef: NodeJS.Timeout | null = null;
const DEFAULT_FOCUS_TIME_SECONDS = 25 * 60;

export default function NoiseGateInterface({ user }: { user: any }) {
  // States Principais
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // States de UI/UX
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [focusLock, setFocusLock] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // NOVO: State para a Notificação Estilo Apple
  const [showMacToast, setShowMacToast] = useState<{title: string, msg: string} | null>(null);

  const router = useRouter();
  const supabase = createClient();
  
  // --- HELPERS ---
  const displayError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const triggerNotification = (title: string, body: string) => {
    // 1. Dispara a notificação Visual (In-App / Estilo Apple)
    setShowMacToast({ title, msg: body });
    
    // Auto-remove após 6 segundos
    setTimeout(() => setShowMacToast(null), 6000);

    // 2. Tenta disparar a notificação do Sistema (OS Level) se o usuário estiver em outra aba
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
       new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        silent: false
      });
    }
  };

  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  const handleLogout = async () => {
    if (globalTimerRef) clearInterval(globalTimerRef);
    await supabase.auth.signOut();
    router.refresh();
  };
  
  // --- LÓGICA DO TIMER ---
  useEffect(() => {
    requestNotificationPermission();
    
    if (activeStepIndex === null || !plan) {
      if (globalTimerRef) clearInterval(globalTimerRef);
      return;
    }

    const step = plan.steps[activeStepIndex];

    if (step.is_active && step.time_left > 0) {
      if (globalTimerRef) clearInterval(globalTimerRef);
      
      globalTimerRef = setInterval(() => {
        setPlan(prevPlan => {
          if (!prevPlan) return null;

          const newSteps = [...prevPlan.steps];
          const currentStep = newSteps[activeStepIndex];
          
          if (currentStep.time_left <= 1) {
            // TEMPO ACABOU
            if (globalTimerRef) clearInterval(globalTimerRef);
            
            currentStep.is_active = false;
            setModalOpen(true);
            
            // DISPARA A NOTIFICAÇÃO HÍBRIDA (Visual + Sistema)
            triggerNotification("NOISE GATE: TIME'S UP", `O foco em "${currentStep.text}" terminou.`);
            
            // Toca um som sutil (opcional, requer arquivo de audio)
            // const audio = new Audio('/alert.mp3'); audio.play().catch(e => {});

            return { ...prevPlan, steps: newSteps };
          }
          
          currentStep.time_left -= 1;
          return { ...prevPlan, steps: newSteps };
        });
      }, 1000);
    } else {
      if (globalTimerRef) clearInterval(globalTimerRef);
    }

    return () => {
      if (globalTimerRef) clearInterval(globalTimerRef);
    };
  }, [activeStepIndex, plan]);

  // --- API HANDLER ---
  async function handleNoiseGate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setPlan(null);
    setFocusLock(false); 
    
    try {
      const res = await fetch("/api/decompose", {
        method: "POST",
        body: JSON.stringify({ task: input }),
      });
      
      const data = await res.json();

      if (!res.ok || data.error) {
        displayError("Falha no Gate: " + (data.error || "Erro desconhecido."));
        return;
      }
      
      const { data: taskData, error: fetchError } = await supabase
        .from('tasks')
        .select(`id, title, steps (id, description, is_completed, position)`)
        .eq('title', data.one_thing)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (fetchError || !taskData) {
        displayError("Erro ao sincronizar DB.");
        return;
      }
      
      const initialTimeSeconds = DEFAULT_FOCUS_TIME_SECONDS;

      const stepsWithState = taskData.steps.map((step: any) => ({
        id: step.id,
        text: step.description,
        is_completed: step.is_completed,
        is_active: false,
        time_left: initialTimeSeconds,
        original_focus_time: initialTimeSeconds,
      }));
      
      setPlan({ 
          id: taskData.id, 
          one_thing: taskData.title, 
          steps: stepsWithState, 
          call_to_action: data.call_to_action
      });

    } catch (error) {
      console.error(error);
      displayError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  // --- ACTIONS ---
  const toggleStepTimer = async (stepIndex: number) => {
    if (!plan || plan.steps[stepIndex].is_completed) return;
    if (globalTimerRef) clearInterval(globalTimerRef);
    if (editingTimeIndex !== null) setEditingTimeIndex(null); 

    if (activeStepIndex === stepIndex && plan.steps[stepIndex].is_active) {
        // Pausar
        setPlan(prev => prev ? ({...prev, steps: prev.steps.map((s, i) => i === stepIndex ? {...s, is_active: false} : s)}) : null);
        setActiveStepIndex(null);
        return;
    }
    
    // Iniciar
    setPlan(prev => prev ? ({...prev, steps: prev.steps.map((s, i) => i === stepIndex ? {...s, is_active: true} : {...s, is_active: false})}) : null);
    setActiveStepIndex(stepIndex);
    if (!focusLock) setFocusLock(true);
  };
  
  const handleTimeEdit = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = parseInt(e.target.value);
    const newTime = Math.max(1, Math.min(120, value || 1));
    setPlan(prev => prev ? ({...prev, steps: prev.steps.map((s, i) => i === index ? {...s, time_left: newTime * 60, original_focus_time: newTime * 60} : s)}) : null);
  };

  const handleModalAction = (action: 'complete' | 'extend' | 'fail') => {
    if (activeStepIndex === null || !plan) return;
    const currentStep = plan.steps[activeStepIndex];
    const timeToExtend = currentStep.original_focus_time;
    
    const newSteps = plan.steps.map((step, idx) => {
        if (idx === activeStepIndex) {
            if (action === 'complete') return { ...step, is_completed: true, is_active: false, time_left: timeToExtend };
            return { ...step, is_active: false, time_left: timeToExtend };
        }
        return step;
    });
    
    if (action === 'complete') {
        const nextStepIndex = newSteps.findIndex(step => !step.is_completed);
        if (nextStepIndex !== -1) setTimeout(() => toggleStepTimer(nextStepIndex), 0);
        else { setFocusLock(false); setActiveStepIndex(null); }
    } else if (action === 'extend') {
        setTimeout(() => toggleStepTimer(activeStepIndex), 0);
    } else {
        setActiveStepIndex(null);
    }
    
    setPlan({ ...plan, steps: newSteps });
    setModalOpen(false);
  };

  // --- SUB-COMPONENTES ---
  
  // 1. Notificação Estilo Apple (NOVO!)
  const MacNotificationToast = () => {
    if (!showMacToast) return null;
    return (
      <div className="fixed top-4 left-4 z-[60] animate-in slide-in-from-left duration-500 fade-in">
        <div className="flex items-start gap-3 bg-neutral-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/50 max-w-sm">
           <div className="bg-emerald-500/20 p-2 rounded-lg">
             <Bell size={20} className="text-emerald-400" />
           </div>
           <div>
             <h4 className="text-white font-bold text-sm">{showMacToast.title}</h4>
             <p className="text-neutral-300 text-xs mt-1 leading-relaxed">{showMacToast.msg}</p>
           </div>
           <button onClick={() => setShowMacToast(null)} className="text-neutral-500 hover:text-white transition-colors">
             <X size={14} />
           </button>
        </div>
      </div>
    );
  };
  
  const AccountabilityModal = () => {
    if (!modalOpen || activeStepIndex === null || !plan) return null;
    const stepTitle = plan.steps[activeStepIndex].text;
    const timeInMinutes = Math.round(plan.steps[activeStepIndex].original_focus_time / 60);
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-300 backdrop-blur-sm">
        <div className="bg-neutral-900 border border-red-900/30 p-8 rounded-2xl max-w-sm text-center shadow-2xl shadow-red-900/20 m-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent"></div>
          <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">TIME'S UP</h3>
          <p className="text-neutral-400 mb-8 text-sm leading-relaxed">
            O compromisso de <span className="text-white font-bold">{timeInMinutes} min</span> para <br/>
            <span className="text-emerald-400 italic">"{stepTitle}"</span> acabou.
          </p>
          <div className="space-y-3">
            <button onClick={() => handleModalAction('complete')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-emerald-900/30 text-sm tracking-wide">
              CONCLUÍDO (Commit)
            </button>
            <button onClick={() => handleModalAction('extend')} className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-600/30 font-bold py-3.5 rounded-xl transition-all text-sm tracking-wide">
              + TEMPO (Extend)
            </button>
            <button onClick={() => handleModalAction('fail')} className="w-full text-neutral-500 hover:text-white py-2 text-xs uppercase tracking-widest transition-colors">
              Falhei (Rollback)
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const FocusLockToggle = () => (
      <button 
          onClick={() => setFocusLock(!focusLock)}
          className={`text-xs p-2 px-3 rounded-full transition-all font-bold flex items-center gap-2 ${focusLock ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-500'}`}
      >
          {focusLock ? <Minimize size={14} /> : <Maximize size={14} />}
          <span className="hidden sm:inline">{focusLock ? "SAIR DO FOCO" : "LOCK MODE"}</span>
      </button>
  );

  return (
    <main className="min-h-screen bg-black text-neutral-200 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
      {/* Background Glow sutil */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900/20 via-black to-emerald-900/20 opacity-50"></div>
      
      <MacNotificationToast />
      <AccountabilityModal />
      
      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="fixed top-0 inset-x-0 mx-auto max-w-md mt-4 bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-200 px-4 py-3 rounded-xl flex items-center justify-center gap-3 z-[70] animate-in slide-in-from-top-4">
          <AlertTriangle size={18} />
          <span className="text-xs font-bold">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto hover:text-white"><X size={16} /></button>
        </div>
      )}

      {/* HEADER */}
      <div className="absolute top-6 right-6 flex items-center gap-4 z-40">
         {plan && <FocusLockToggle />}
         <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Operador</span>
            <span className="text-xs text-neutral-300 font-bold">{user.user_metadata.full_name?.split(' ')[0]}</span>
         </div>
         <button onClick={handleLogout} className="text-neutral-600 hover:text-red-500 transition-colors p-2" title="Sair">
            <LogOut size={18} />
         </button>
      </div>

      <div className="mb-10 text-center relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white flex items-center justify-center gap-3 mb-2" style={{textShadow: "0 0 30px rgba(16, 185, 129, 0.3)"}}>
          <Zap size={32} className="text-emerald-500" fill="currentColor" /> NOISE GATE
        </h1>
        <p className="text-neutral-500 text-xs md:text-sm tracking-[0.2em] uppercase">Silence the noise. Amplify execution.</p>
      </div>

      {/* INPUT AREA */}
      {!plan && (
        <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <label className="block text-lg md:text-xl text-neutral-400 font-medium text-center leading-relaxed">
            "Que tarefa, se eu fizer <span className="text-emerald-400 font-bold border-b border-emerald-500/30">AGORA</span>,<br/> vai fazer o resto virar detalhe?"
          </label>
          <div className="flex gap-2 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative flex gap-2 w-full bg-black rounded-lg p-1">
                <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNoiseGate()}
                placeholder="Ex: Finalizar o pitch deck do projeto..."
                className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-md px-4 py-4 focus:outline-none focus:bg-neutral-900 focus:border-emerald-500/50 text-white placeholder:text-neutral-600 transition-all"
                disabled={loading}
                autoFocus
                />
                <button
                onClick={handleNoiseGate}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-8 rounded-md transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                {loading ? <Loader2 className="animate-spin" /> : "FILTER"}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAN AREA */}
      {plan && (
        <div className="w-full max-w-xl bg-neutral-900/40 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 md:p-8 animate-in zoom-in-95 duration-500 relative">
          {/* Decorative Corner */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-tl-2xl pointer-events-none"></div>

          <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-4">
            <div>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em]">MISSION LOCKED</span>
              <h2 className="text-2xl font-bold text-white mt-1 leading-tight">{plan.one_thing}</h2>
            </div>
            <button 
              onClick={() => {setPlan(null); setInput(""); setActiveStepIndex(null); setFocusLock(false);}}
              className="text-xs text-neutral-600 hover:text-white underline transition-colors"
            >
              ABORT
            </button>
          </div>
          
          <div className="space-y-4">
            {plan.steps && plan.steps.length > 0 ? (
              plan.steps.map((step, idx) => {
                const isCurrentActive = activeStepIndex === idx;
                const isEditing = editingTimeIndex === idx;
                const showDetails = focusLock ? isCurrentActive || step.is_completed : true; 
                
                if (focusLock && !showDetails && !step.is_completed) return null;

                return (
                  <div 
                    key={step.id || idx}
                    className={`group relative flex flex-col gap-2 p-4 rounded-xl transition-all duration-300 border ${
                      step.is_completed 
                          ? "bg-neutral-900/50 border-transparent text-neutral-500 line-through grayscale" 
                          : isCurrentActive 
                            ? "bg-neutral-800/80 border-emerald-500/50 shadow-lg shadow-emerald-900/20 scale-[1.02]" 
                            : "bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`transition-colors ${isCurrentActive ? "text-emerald-400" : "text-neutral-600"}`}>
                            {step.is_completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                        </div>
                        
                        <span className={`flex-1 text-sm font-medium ${step.is_completed ? "text-neutral-600" : "text-neutral-200"}`}>
                            {step.text}
                        </span>
                        
                        {!step.is_completed && (
                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <div className="flex items-center bg-black rounded-lg border border-emerald-500 px-2 py-1">
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="120"
                                            value={Math.round(step.time_left / 60)}
                                            onChange={(e) => handleTimeEdit(e, idx)}
                                            className="w-8 bg-transparent text-sm text-white text-center focus:outline-none font-bold"
                                            autoFocus
                                        />
                                        <span className="text-neutral-500 text-[10px]">min</span>
                                        <button onClick={() => setEditingTimeIndex(null)} className="text-emerald-500 hover:text-white ml-2"><Save size={14} /></button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setEditingTimeIndex(idx)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all ${
                                            isCurrentActive 
                                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                                                : 'text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                                        }`}
                                    >
                                        <Clock size={12} />
                                        <span>{Math.floor(step.time_left / 60)}m</span>
                                    </button>
                                )}
                                
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleStepTimer(idx); }}
                                  className={`p-2 rounded-full transition-all shadow-lg ${
                                      isCurrentActive 
                                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-900/30' 
                                          : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-emerald-900/30'
                                  }`}
                                >
                                    {isCurrentActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                </button>
                            </div>
                        )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-neutral-500 text-sm italic">Inicializando protocolos...</p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest opacity-70">"{plan.call_to_action}"</p>
          </div>
        </div>
      )}
    </main>
  );
}