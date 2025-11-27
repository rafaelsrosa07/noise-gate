"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Circle, Play, Pause, AlertTriangle, X, Maximize, Minimize, Clock, Save, Bell, Terminal, RefreshCw, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from 'next/image';

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

  // Notificação Visual Interna
  const [showMacToast, setShowMacToast] = useState<{title: string, msg: string} | null>(null);

  const router = useRouter();
  const supabase = createClient();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- SISTEMA DE SOM ---
  const playCyberpunkAlarm = () => {
    if (typeof window === 'undefined') return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);

        osc.start();
        osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
        console.error("Erro som", e);
    }
  };

  // --- NOTIFICAÇÕES ---
  const triggerNotification = (title: string, body: string) => {
    playCyberpunkAlarm();
    setShowMacToast({ title, msg: body });
    setTimeout(() => setShowMacToast(null), 10000);

    if (typeof window !== 'undefined') {
        if (Notification.permission === 'granted') {
            const notif = new Notification(title, {
                body: body,
                icon: '/favicon.ico',
                requireInteraction: true,
                silent: true
            });
            notif.onclick = () => {
                window.focus();
                notif.close();
            };
        }
    }
  };

  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  // --- HELPER DE ESTADO (CORRIGE ERRO DE TIPAGEM) ---
  // Esta variável precisa ser declarada UMA ÚNICA VEZ
  const isTimerRunning = 
    activeStepIndex !== null && 
    plan?.steps && 
    plan.steps[activeStepIndex] 
      ? plan.steps[activeStepIndex].is_active 
      : false;

  // --- LÓGICA DO TIMER ---
  useEffect(() => {
    requestNotificationPermission();

    // Verificação de segurança: Se não há índice ativo ou plano, limpa intervalo
    if (activeStepIndex === null || !plan) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    // Usamos a variável segura 'isTimerRunning' em vez de acessar o array direto
    if (isTimerRunning) {
      // Limpa qualquer intervalo anterior para evitar duplicidade
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = setInterval(() => {
        setPlan(prevPlan => {
          if (!prevPlan) return null;

          const newSteps = [...prevPlan.steps];
          // Proteção extra
          if (activeStepIndex >= newSteps.length) return prevPlan;

          const step = newSteps[activeStepIndex];

          if (step.time_left <= 0) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            step.is_active = false;
            step.time_left = 0;

            // Timeout para evitar update durante renderização
            setTimeout(() => {
                setModalOpen(true);
                triggerNotification("⚠️ CICLO FINALIZADO", `Tarefa "${step.text}" completou o tempo.`);
            }, 0);

            return { ...prevPlan, steps: newSteps };
          }

          step.time_left -= 1;
          return { ...prevPlan, steps: newSteps };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeStepIndex, isTimerRunning]); // DEPENDÊNCIA SEGURA!

  // --- HANDLERS ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const displayError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

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

      // Esta parte depende da sua implementação do DB, mas mantemos o fetch para simulação
      const taskData = {
          id: 'temp-id',
          title: data.one_thing,
          steps: data.steps.map((s: any) => ({
              id: Math.random().toString(36).substring(2, 9),
              description: s.description,
              is_completed: false,
              time: s.time // Tempo em minutos
          }))
      };

      const initialTimeSeconds = DEFAULT_FOCUS_TIME_SECONDS;

      const stepsWithState = taskData.steps.map((step: any) => ({
        id: step.id,
        text: step.description,
        is_completed: step.is_completed,
        is_active: false,
        time_left: step.time * 60 || initialTimeSeconds, // Usa o tempo da IA ou o default
        original_focus_time: step.time * 60 || initialTimeSeconds,
      }));

      setPlan({
          id: taskData.id,
          one_thing: taskData.title,
          steps: stepsWithState,
          call_to_action: data.call_to_action
      });

    } catch (error) {
      console.error(error);
      displayError("Erro de conexão com a IA.");
    } finally {
      setLoading(false);
    }
  }

  const toggleStepTimer = (stepIndex: number) => {
    if (!plan || plan.steps[stepIndex].is_completed) return;

    if (activeStepIndex === stepIndex && plan.steps[stepIndex].is_active) {
        setPlan(prev => prev ? ({...prev, steps: prev.steps.map((s, i) => i === stepIndex ? {...s, is_active: false} : s)}) : null);
        return;
    }

    setPlan(prev => prev ? ({...prev, steps: prev.steps.map((s, i) => i === stepIndex ? {...s, is_active: true} : {...s, is_active: false})}) : null);
    setActiveStepIndex(stepIndex);
    if (!focusLock) setFocusLock(true);
  };

  const handleEarlyCompletion = (stepIndex: number) => {
    if (!plan || plan.steps[stepIndex].is_completed) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const newSteps = plan.steps.map((step, idx) => {
        if (idx === stepIndex) {
            return { ...step, is_completed: true, is_active: false, time_left: 0 };
        }
        return step;
    });

    const nextStepIndex = newSteps.findIndex(step => !step.is_completed);

    setPlan({ ...plan, steps: newSteps });

    if (nextStepIndex !== -1) {
        setTimeout(() => toggleStepTimer(nextStepIndex), 100);
    } else {
        setFocusLock(false);
        setActiveStepIndex(null);
    }
  };

  const handleTimeEdit = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = parseInt(e.target.value);
    const newTime = Math.max(1, Math.min(180, value || 1));
    setPlan(prev => prev ? ({...prev, steps: prev.steps.map((s, i) => i === index ? {...s, time_left: newTime * 60, original_focus_time: newTime * 60} : s)}) : null);
  };

  const handleModalAction = (action: 'complete' | 'recalibrate') => {
    if (activeStepIndex === null || !plan) return;
    const currentStep = plan.steps[activeStepIndex];
    const timeToExtend = currentStep.original_focus_time;

    const newSteps = plan.steps.map((step, idx) => {
        if (idx === activeStepIndex) {
            if (action === 'complete') {
                return { ...step, is_completed: true, is_active: false, time_left: 0 };
            }
            return { ...step, is_active: false, time_left: timeToExtend };
        }
        return step;
    });

    if (action === 'complete') {
        const nextStepIndex = newSteps.findIndex(step => !step.is_completed);
        if (nextStepIndex !== -1) setTimeout(() => toggleStepTimer(nextStepIndex), 100);
        else { setFocusLock(false); setActiveStepIndex(null); }
    } else if (action === 'recalibrate') {
        setTimeout(() => toggleStepTimer(activeStepIndex), 100);
    }

    setPlan({ ...plan, steps: newSteps });
    setModalOpen(false);
  };

  // --- VISUAL COMPONENTS ---
  const TerminalLoader = () => {
    const [msgIndex, setMsgIndex] = useState(0);
    const messages = [
        "INITIALIZING NOISE GATE PROTOCOL...",
        "ANALYZING INPUT COMPLEXITY...",
        "IDENTIFYING LEVERAGE POINTS...",
        "DECOMPOSING INTO TACTICAL STEPS...",
        "CALCULATING TIME VECTORS...",
        "FINALIZING STRATEGY..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % messages.length);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-2xl bg-black/80 backdrop-blur-xl border border-emerald-500/30 rounded-lg p-6 font-mono shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-in fade-in zoom-in-95 duration-300 relative z-10">
            <div className="flex items-center gap-2 mb-4 border-b border-emerald-500/20 pb-2">
                <Terminal size={16} className="text-emerald-500" />
                <span className="text-xs text-emerald-500/70 uppercase tracking-widest">System Processing</span>
            </div>
            <div className="space-y-2">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`text-sm transition-all duration-300 ${idx === msgIndex ? 'text-emerald-400 font-bold opacity-100' : idx < msgIndex ? 'text-emerald-800 opacity-40' : 'hidden'}`}>
                        <span className="mr-2">{idx < msgIndex ? '✓' : '>'}</span>
                        {msg}
                        {idx === msgIndex && <span className="animate-pulse ml-1">_</span>}
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const MacNotificationToast = () => {
    if (!showMacToast) return null;
    return (
      <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-right duration-500 fade-in">
        <div className="flex items-start gap-3 bg-neutral-900/80 backdrop-blur-xl border border-orange-500/40 p-4 rounded-2xl shadow-2xl shadow-black/80 max-w-sm cursor-pointer hover:bg-neutral-800 transition-colors" onClick={() => {window.focus(); setShowMacToast(null); setModalOpen(true);}}>
           <div className="bg-orange-500/20 p-2 rounded-lg animate-pulse">
             <Bell size={20} className="text-orange-400" />
           </div>
           <div>
             <h4 className="text-white font-bold text-sm tracking-wide">{showMacToast.title}</h4>
             <p className="text-neutral-300 text-xs mt-1 leading-relaxed">{showMacToast.msg}</p>
           </div>
        </div>
      </div>
    );
  };

  const AccountabilityModal = () => {
    if (!modalOpen || activeStepIndex === null || !plan) return null;
    const stepTitle = plan.steps[activeStepIndex].text;
    const timeInMinutes = Math.round(plan.steps[activeStepIndex].original_focus_time / 60);

    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-in fade-in duration-300 backdrop-blur-md">
        <div className="bg-neutral-900 border border-orange-500/30 p-8 rounded-2xl max-w-sm text-center shadow-[0_0_60px_rgba(249,115,22,0.1)] m-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-transparent"></div>

          <AlertTriangle size={42} className="text-orange-400 mx-auto mb-5" />

          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">CICLO FINALIZADO</h3>

          <p className="text-neutral-400 mb-8 text-sm leading-relaxed">
            O tempo de <span className="text-white font-bold">{timeInMinutes} min</span> para <br/>
            <span className="text-emerald-400 italic">"{stepTitle}"</span> esgotou.
          </p>

          <div className="space-y-4">
            <button onClick={() => handleModalAction('complete')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-emerald-900/30 text-sm tracking-wide flex items-center justify-center gap-2 group">
              <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform"/>
              TAREFA CONCLUÍDA
            </button>

            <button onClick={() => handleModalAction('recalibrate')} className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-200 border border-orange-500/30 font-bold py-4 rounded-xl transition-all hover:border-orange-500/50 text-sm tracking-wide flex items-center justify-center gap-2 group">
              <RefreshCw size={18} className="group-hover:rotate-90 transition-transform" />
              RECALIBRAR (+ TEMPO)
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FocusLockToggle = () => (
      <button
          onClick={() => setFocusLock(!focusLock)}
          className={`text-xs p-2 px-3 rounded-full transition-all font-bold flex items-center gap-2 ${focusLock ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-500'}`}
      >
          {focusLock ? <Minimize size={14} /> : <Maximize size={14} />}
          <span className="hidden sm:inline">{focusLock ? "SAIR DO FOCO" : "MODO FOCO"}</span>
      </button>
  );

  return (
    <main className="min-h-screen bg-black text-neutral-200 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-100">

      {/* --- FUNDO TIPO "PLACA MÃE REALISTA" --- */}

      {/* 1. Textura de Circuito Estruturada (Padrão Repetitivo) */}
      {/* Usa um SVG pequeno e estruturado (linhas retas, 45 graus, pads) que se repete para criar uma textura de PCB realista. */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgb(16 185 129)' stroke-width='0.5'%3E%3Cpath d='M10 10 H 30 V 30 H 50' /%3E%3Cpath d='M60 10 V 40 H 90' /%3E%3Cpath d='M10 60 V 80 H 30 L 50 100' /%3E%3Cpath d='M60 60 H 90 V 90' /%3E%3Ccircle cx='10' cy='10' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='50' cy='30' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='90' cy='40' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='10' cy='60' r='1.5' fill='rgb(16 185 129)' /%3E%3Ccircle cx='90' cy='90' r='1.5' fill='rgb(16 185 129)' /%3E%3C/g%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '150px 150px'
      }}></div>

      {/* 2. Iluminação Única de Canto (Glow) */}
      {/* Apenas um glow forte no canto superior esquerdo, como solicitado. */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-600/30 rounded-full blur-[150px] -translate-x-1/3 -translate-y-1/3 pointer-events-none z-0"></div>


      {/* ----------------------------------- */}

      <MacNotificationToast />
      <AccountabilityModal />

      {errorMessage && (
        <div className="fixed top-0 inset-x-0 mx-auto max-w-md mt-4 bg-orange-500/10 backdrop-blur-md border border-orange-500/20 text-orange-200 px-4 py-3 rounded-xl flex items-center justify-center gap-3 z-[70] animate-in slide-in-from-top-4">
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
         <button onClick={handleLogout} className="text-neutral-600 hover:text-orange-500 transition-colors p-2" title="Sair">
            <LogOut size={18} />
         </button>
      </div>

      <div className="mb-12 text-center relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-white flex items-center justify-center gap-3 mb-3 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
          <Image
            src="/noise-gate-funnel-icon.png"
            alt="Noise Gate Funnel Icon"
            width={56}
            height={56}
            className="h-12 md:h-16 w-auto drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]"
          /><span className="text-white">NOISE</span><span className="text-emerald-400">GATE</span>
        </h1>
        <p className="text-neutral-400 text-xs md:text-sm tracking-[0.3em] uppercase font-medium">Silence the noise. Amplify execution.</p>
      </div>

      {/* INPUT AREA */}
      {!plan && (
        <div className="w-full max-w-2xl flex flex-col items-center relative z-10">
            {loading ? (
                <TerminalLoader />
            ) : (
                <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <label className="block text-xl md:text-2xl text-neutral-300 font-medium text-center leading-relaxed drop-shadow-md">
                        "Que tarefa, se eu fizer <span className="text-emerald-400 font-bold border-b-2 border-emerald-500/50 glow-sm">AGORA</span>,<br/> vai fazer o resto das atividades de hoje virar detalhe?"
                    </label>
                    <div className="flex gap-2 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition duration-1000 group-focus-within:opacity-70"></div>
                        <div className="relative flex gap-2 w-full bg-black/80 backdrop-blur-xl rounded-xl p-1.5 border border-emerald-500/30">
                            <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleNoiseGate()}
                            placeholder="Ex: Finalizar o pitch deck do projeto..."
                            className="flex-1 bg-transparent border-none rounded-md px-4 py-4 focus:outline-none text-white placeholder:text-neutral-500 text-lg transition-all"
                            disabled={loading}
                            autoFocus
                            />
                            <button
                            onClick={handleNoiseGate}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold px-8 rounded-lg transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-95 tracking-wider"
                            >
                            FILTER
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* PLAN AREA */}
      {plan && (
        <div className="w-full max-w-xl bg-neutral-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 md:p-8 animate-in zoom-in-95 duration-500 relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-tl-2xl pointer-events-none -z-10"></div>

          <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em] drop-shadow-sm">MISSION LOCKED</span>
              <h2 className="text-2xl font-bold text-white mt-1 leading-tight drop-shadow-md">{plan.one_thing}</h2>
            </div>
            <button
              onClick={() => {setPlan(null); setInput(""); setActiveStepIndex(null); setFocusLock(false);}}
              className="text-xs text-neutral-500 hover:text-white underline transition-colors"
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
                    className={`group relative flex flex-col gap-2 p-4 rounded-xl transition-all duration-500 border ${
                      step.is_completed
                          ? "bg-neutral-900/30 border-transparent text-neutral-600 line-through grayscale"
                          : isCurrentActive
                            ? "bg-neutral-800/90 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-[1.02]"
                            : "bg-neutral-900/40 border-white/5 hover:border-emerald-500/30 hover:bg-neutral-800/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`transition-colors drop-shadow-sm ${isCurrentActive ? "text-emerald-400" : "text-neutral-600 group-hover:text-neutral-400"}`}>
                            {step.is_completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </div>

                        <span className={`flex-1 text-base font-medium ${step.is_completed ? "text-neutral-600" : "text-neutral-200 group-hover:text-white"}`}>
                            {step.text}
                        </span>

                        {!step.is_completed && (
                            <div className="flex items-center gap-3 animate-in fade-in">

                                {isCurrentActive && (
                                    <button
                                        onClick={() => handleEarlyCompletion(idx)}
                                        className="text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 px-3 py-1.5 rounded-full transition-all font-bold tracking-widest flex items-center gap-1 border border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                        title="Concluir tarefa agora"
                                    >
                                        <CheckCircle2 size={14} /> DONE
                                    </button>
                                )}

                                {isEditing ? (
                                    <div className="flex items-center bg-black rounded-lg border border-emerald-500 px-2 py-1 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                        <input
                                            type="number"
                                            min="1"
                                            max="180"
                                            value={Math.round(step.time_left / 60)}
                                            onChange={(e) => handleTimeEdit(e, idx)}
                                            className="w-12 bg-transparent text-xl text-white text-center focus:outline-none font-bold"
                                            autoFocus
                                        />
                                        <span className="text-neutral-500 text-xs font-bold mr-1">min</span>
                                        <button onClick={() => setEditingTimeIndex(null)} className="text-emerald-500 hover:text-white p-1"><Save size={18} /></button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setEditingTimeIndex(idx)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                                            isCurrentActive
                                                ? 'bg-black/50 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                                : 'bg-black/30 border-white/10 text-neutral-500 hover:border-emerald-500/30 hover:text-emerald-300 hover:bg-black/60'
                                        }`}
                                        title="Editar tempo"
                                    >
                                        <Clock size={16} />
                                        <span className="font-mono font-bold text-base">{Math.floor(step.time_left / 60)}m</span>
                                    </button>
                                )}

                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleStepTimer(idx); }}
                                  className={`p-2.5 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95 ${
                                      isCurrentActive
                                          ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/30'
                                          : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30'
                                  }`}
                                >
                                    {isCurrentActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                                </button>
                            </div>
                        )}
                    </div>
                    {isCurrentActive && (
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 rounded-xl blur-sm -z-10 animate-pulse-slow"></div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-neutral-500 text-sm italic text-center py-4">Inicializando protocolos táticos...</p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[10px] text-neutral-400 uppercase tracking-[0.3em] opacity-80">"{plan.call_to_action}"</p>
          </div>
        </div>
      )}
    </main>
  );
}