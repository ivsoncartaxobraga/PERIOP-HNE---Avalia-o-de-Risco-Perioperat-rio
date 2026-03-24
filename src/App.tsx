/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  PlusCircle, 
  History, 
  BookOpen, 
  LogOut, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  FileDown, 
  Trash2,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Printer,
  Type,
  Edit2,
  X,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PatientData, 
  calculateAge, 
  saveAssessment, 
  getAssessments, 
  deleteAssessment,
  exportToPDF,
  testConnection,
  AutoText,
  saveAutoText,
  getAutoTexts,
  deleteAutoText,
  updateAutoText
} from './utils';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

type Screen = 'login' | 'menu' | 'assessment' | 'history' | 'protocols';
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [doctorName, setDoctorName] = useState('');
  const [doctorCRM, setDoctorCRM] = useState('');
  const [assessments, setAssessments] = useState<PatientData[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [autoTexts, setAutoTexts] = useState<AutoText[]>([]);
  const [showAutoTextModal, setShowAutoTextModal] = useState(false);
  const [isManagingAutoTexts, setIsManagingAutoTexts] = useState(false);
  const [newAutoText, setNewAutoText] = useState('');
  const [editingAutoTextId, setEditingAutoTextId] = useState<string | null>(null);
  
  // Form State
  const [patient, setPatient] = useState<Partial<PatientData>>({
    id: '',
    name: '',
    dob: '',
    age: 0,
    clinicalComplaints: '',
    proposedSurgery: '',
    functionalCapacity: '',
    medications: '',
    allergies: '',
    riskFactors: [],
    otherRiskFactors: '',
    pa: '',
    fc: '',
    cvExam: { status: 'Normal', details: '' },
    respExam: { status: 'Normal', details: '' },
    abdExam: { status: 'Normal', details: '' },
    extExam: { status: 'Normal', details: '' },
    labExams: '',
    ecg: '',
    echo: '',
    cath: '',
    otherExams: '',
    intrinsicRisk: 'Baixo',
    intrinsicRiskItem: '',
    hemorrhagicRisk: 'Baixo Risco',
    hemorrhagicRiskItem: '',
    isUrgency: false,
    hasSevereCondition: false,
    severeConditions: [],
    isElective: true,
    electiveRisk: null,
    rcriItems: [],
    aubHas2Items: [],
    vsgCriItems: [],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (user) {
        testConnection();
        loadAutoTexts();
      }
    });
    return () => unsubscribe();
  }, []);

  const loadAutoTexts = async () => {
    console.log('Loading auto-texts...');
    const texts = await getAutoTexts();
    console.log('Auto-texts loaded:', texts.length);
    if (texts.length === 0) {
      console.log('No auto-texts found. Seeding initial data...');
      const INITIAL_AUTO_TEXTS = [
        "Pacientes que já utilizam betabloqueadores cronicamente devem manter a medicação durante todo o período perioperatório. Não se deve iniciar betabloqueadores em pacientes que não os utilizavam num prazo inferior a 7 dias antes da cirurgia.",
        "Estatinas devem ser mantidas em pacientes que já fazem uso crônico. É recomendada a introdução (preferencialmente 2 semanas antes) para pacientes que serão submetidos a operações vasculares arteriais. Em cirurgias não vasculares, o uso deve ser considerado se houver indicação clínica por doenças associadas (como DAC ou diabetes), independentemente da cirurgia.",
        "O ácido acetilsalicílico deve ser mantido na dose de 100 mg/dia na maioria dos pacientes com doença cardiovascular estabelecida, exceto em neurocirurgias ou ressecções transuretrais de próstata (RTUP). No caso de prevenção primária, dve ser suspenso 7 dias antes da operação.",
        "Medicações como antagonistas do sistema renina-angiotensina (IECA/BRA), bloqueadores de canal de cálcio e diuréticos podem ser mantidos, mas a suspensão pode ser considerada individualmente para evitar episódios de hipotensão intraoperatória. A clonidina deve ser mantida em usuários crônicos para evitar efeito rebote.",
        "Em procedimentos Odontológicos, o uso de solução antimicrobiana (clorexidina) antes e após procedimentos para reduzir o risco de bacteremia e sepse.",
        "Profilaxia antibiótica indicada apenas para pacientes de alto risco (ex: próteses valvares, cardiopatias congênitas cianóticas) submetidos a procedimentos com manipulação gengival ou perfuração da mucosa oral.",
        "Em procedimentos odontológicos (extrações, implantes), oftalmológicos (como catarata), endoscópicos simples e dermatológicos, a regra geral é não suspender terapias como o ácido acetilsalicílico (AAS), varfarina ou novos anticoagulantes (DOACs), desde que tomadas medidas de hemostasia local.",
        "uso de anestésicos locais como a lidocaína associada à epinefrina (nas diluições de 1:80.000, 1:100.000 e 1:200.000) é considerado relativamente seguro para procedimentos odontológicos em pacientes com doenças cardiovasculares e hipertensão, desde que essas condições clínicas estejam devidamente controladas",
        "Para garantir essa segurança, a recomendação de Classe IIa estipula um limite rigoroso de utilização de 1 a 4 ampolas do anestésico por procedimento",
        "É fundamental respeitar essa dosagem máxima, pois o uso excessivo de anestésicos com vasoconstritores pode ser prejudicial ao paciente, provocando a elevação da frequência cardíaca, o aumento da pressão arterial e, consequentemente, uma maior demanda do miocárdio por oxigênio"
      ];
      for (const text of INITIAL_AUTO_TEXTS) {
        await saveAutoText(text);
      }
      const updatedTexts = await getAutoTexts();
      setAutoTexts(updatedTexts);
    } else {
      setAutoTexts(texts);
    }
  };

  const handleAddAutoText = async () => {
    if (!newAutoText.trim()) return;
    console.log('Adding/Updating auto-text:', newAutoText);
    if (editingAutoTextId) {
      await updateAutoText(editingAutoTextId, newAutoText);
      setEditingAutoTextId(null);
    } else {
      const result = await saveAutoText(newAutoText);
      console.log('Save result:', result);
    }
    setNewAutoText('');
    loadAutoTexts();
  };

  const handleDeleteAutoText = async (id: string) => {
    await deleteAutoText(id);
    loadAutoTexts();
  };

  const handleSelectAutoText = (text: string) => {
    const currentConduct = patient.conduct || finalRiskAndConduct.conduct || '';
    const newConduct = currentConduct ? `${currentConduct}\n\n${text}` : text;
    updatePatient({ conduct: newConduct });
    setShowAutoTextModal(false);
  };

  useEffect(() => {
    if (screen === 'history' || screen === 'menu') {
      loadAssessments();
    }
  }, [screen, user]);

  const loadAssessments = async () => {
    const data = await getAssessments();
    setAssessments(data);
  };

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Don't show alert for cancelled requests or closed popups
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error("Error logging in with Google:", error);
        alert("Erro ao entrar com Google.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setScreen('login');
      setDoctorName('');
      setDoctorCRM('');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Por favor, entre com sua conta Google primeiro.");
      return;
    }
    if (doctorName && doctorCRM) setScreen('menu');
  };

  const startNewAssessment = () => {
    setPatient({
      id: Date.now().toString(),
      doctorName,
      doctorCRM,
      name: '',
      dob: '',
      age: 0,
      clinicalComplaints: '',
      date: new Date().toLocaleDateString('pt-BR'),
      proposedSurgery: '',
      functionalCapacity: '',
      medications: '',
      allergies: '',
      riskFactors: [],
      otherRiskFactors: '',
      pa: '',
      fc: '',
      cvExam: { status: 'Normal', details: '' },
      respExam: { status: 'Normal', details: '' },
      abdExam: { status: 'Normal', details: '' },
      extExam: { status: 'Normal', details: '' },
      labExams: '',
      ecg: '',
      echo: '',
      cath: '',
      otherExams: '',
      intrinsicRisk: 'Baixo',
      intrinsicRiskItem: '',
      hemorrhagicRisk: 'Baixo Risco',
      hemorrhagicRiskItem: '',
      isUrgency: false,
      hasSevereCondition: false,
      severeConditions: [],
      isElective: true,
      electiveRisk: null,
      rcriScore: 0,
      rcriItems: [],
      aubHas2Score: 0,
      aubHas2Items: [],
      vsgCriScore: 0,
      vsgCriItems: [],
      finalRisk: 'Baixo',
      conduct: '',
    });
    setCurrentStep(1);
    setScreen('assessment');
  };

  const editAssessment = (data: PatientData) => {
    setPatient(data);
    setCurrentStep(7); // Go straight to report (Passo 7/7)
    setScreen('assessment');
  };

  const updatePatient = (updates: Partial<PatientData>) => {
    setPatient(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    // Logic for skipping steps based on conditions
    if (currentStep === 3) {
      if (patient.isUrgency || patient.hasSevereCondition) {
        setCurrentStep(6);
        return;
      }
    }
    if (currentStep === 4) {
      if (patient.electiveRisk === 'Baixo') {
        setCurrentStep(6);
        return;
      }
    }
    setCurrentStep(prev => (prev < 7 ? (prev + 1) as Step : prev));
  };

  const prevStep = () => {
    if (currentStep === 6) {
      if (patient.isUrgency || patient.hasSevereCondition) {
        setCurrentStep(3);
        return;
      }
      if (patient.electiveRisk === 'Baixo') {
        setCurrentStep(4);
        return;
      }
    }
    setCurrentStep(prev => (prev > 1 ? (prev - 1) as Step : prev));
  };

  // Calculations
  const rcriScore = patient.rcriItems?.length || 0;
  const aubHas2Score = patient.aubHas2Items?.length || 0;
  
  const vsgCriScore = useMemo(() => {
    let score = 0;
    const items = patient.vsgCriItems || [];
    if (items.includes('≥ 80 anos')) score += 4;
    else if (items.includes('70-79 anos')) score += 3;
    else if (items.includes('60-69 anos')) score += 2;
    
    if (items.includes('Doença arterial coronariana')) score += 2;
    if (items.includes('Insuficiência cardíaca')) score += 2;
    if (items.includes('DPOC')) score += 2;
    if (items.includes('Creatinina > 1,8 mg/dL')) score += 2;
    if (items.includes('Tabagismo')) score += 1;
    if (items.includes('Diabetes em uso de insulina')) score += 1;
    if (items.includes('Uso crônico de betabloqueador')) score += 1;
    if (items.includes('Revascularização miocárdica prévia')) score -= 1;
    return score;
  }, [patient.vsgCriItems]);

  const finalRiskAndConduct = useMemo(() => {
    if (patient.isUrgency) {
      return {
        risk: 'Urgência' as const,
        conduct: 'Prosseguir diretamente para a cirurgia, Estratégias de cardioproteção/ monitorização intra e pós-operatória.'
      };
    }
    if (patient.hasSevereCondition) {
      return {
        risk: 'Instável' as const,
        conduct: 'Adiar o procedimento não cardíaco, Estabilizar a condição cardiovascular antes da cirurgia.'
      };
    }
    if (patient.electiveRisk === 'Baixo') {
      return {
        risk: 'Baixo' as const,
        conduct: 'Baixo risco, Operar diretamente.'
      };
    }

    // Risk Classification Logic
    const isRcriHigh = rcriScore >= 3;
    const isRcriInter = rcriScore === 2;
    const isRcriLow = rcriScore <= 1;

    const isAubHigh = aubHas2Score >= 4;
    const isAubInter = aubHas2Score >= 2 && aubHas2Score <= 3;
    const isAubLow = aubHas2Score <= 1;

    const isVsgHigh = vsgCriScore >= 7;
    const isVsgInter = vsgCriScore >= 5 && vsgCriScore <= 6;
    const isVsgLow = vsgCriScore <= 4;

    // Determine highest risk among applicable scores
    const isHigh = isRcriHigh || isAubHigh || isVsgHigh;
    const isInter = isRcriInter || isAubInter || isVsgInter;

    if (isHigh) {
      return {
        risk: 'Alto' as const,
        conduct: 'Risco alto de complicações perioperatórias. Dosar Troponina e realizar ECG basais. Otimizar farmacoproteção e monitorização clínica. Troponina e ECG no 1º e 2º PO.'
      };
    }
    if (isInter) {
      return {
        risk: 'Intermediário' as const,
        conduct: 'Risco Intermediário de complicações perioperatórias. Considerar exames complementares se capacidade funcional < 4 METs ou desconhecida. Caso contrário, prosseguir.'
      };
    }
    return {
      risk: 'Baixo' as const,
      conduct: 'Risco Baixo de complicações perioperatórias. Prosseguir diretamente para a cirurgia.'
    };
  }, [patient, rcriScore, aubHas2Score, vsgCriScore]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Sync conduct when reaching Step 7
  useEffect(() => {
    if (currentStep === 7 && !patient.conduct) {
      setPatient(prev => ({ ...prev, conduct: finalRiskAndConduct.conduct }));
    }
  }, [currentStep, finalRiskAndConduct.conduct, patient.conduct]);

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await exportToPDF('periop-report', `Laudo_${patient.name?.replace(/\s+/g, '_')}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.focus();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSave = async () => {
    if (!user) {
      alert('Você precisa estar logado para salvar avaliações.');
      return;
    }

    const dataToSave: PatientData = {
      ...patient as PatientData,
      rcriScore,
      aubHas2Score,
      vsgCriScore,
      finalRisk: finalRiskAndConduct.risk,
      conduct: patient.conduct || finalRiskAndConduct.conduct,
    };
    try {
      await saveAssessment(dataToSave);
      alert('Avaliação salva com sucesso!');
      loadAssessments();
    } catch (error) {
      alert('Erro ao salvar avaliação.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 no-print">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center bg-stone-900 p-2 rounded-xl shadow-sm">
            <div className="text-emerald-500 font-black text-xl tracking-tighter leading-none">hne</div>
            <div className="text-[4px] font-bold uppercase tracking-[0.1em] text-white text-center leading-tight mt-0.5">Hospital Nova Esperança</div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-stone-900 uppercase leading-none">HNE</h1>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Hospital Nova Esperança</p>
          </div>
        </div>
        {screen !== 'login' && (
          <button 
            onClick={handleLogout}
            className="p-2 text-stone-400 hover:text-red-600 transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {screen === 'login' && (
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="mb-12 flex flex-col items-center">
                <div className="w-48 h-48 bg-white rounded-[40px] shadow-2xl shadow-emerald-100 flex items-center justify-center p-8 mb-8 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="text-emerald-600 font-black text-7xl tracking-tighter mb-1">hne</div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-stone-400 text-center leading-tight">Hospital Nova Esperança</div>
                  </div>
                </div>
                <h2 className="text-4xl font-black mb-3 text-center tracking-tight text-stone-900">
                  PERIOP<span className="text-emerald-600">HNE</span>
                </h2>
                <div className="h-1.5 w-12 bg-emerald-500 rounded-full mb-6" />
                <p className="text-stone-500 text-center max-w-sm leading-relaxed font-medium">
                  Sistema inteligente de avaliação de risco perioperatório cardiovascular baseado na diretriz SBC 2024.
                </p>
              </div>
              
              <div className="w-full max-w-sm space-y-6">
                {!user ? (
                  <button 
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="bg-white p-1 rounded-lg">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    </div>
                    {isLoggingIn ? 'Conectando...' : 'Entrar com Google'}
                  </button>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Bem-vindo(a)</p>
                        <p className="font-bold text-stone-900">{user.displayName}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-stone-400 ml-1">Nome do Médico</label>
                        <input 
                          type="text" 
                          required
                          value={doctorName || ''}
                          onChange={(e) => setDoctorName(e.target.value)}
                          className="w-full px-5 py-4 rounded-2xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white"
                          placeholder="Dr(a). Nome Completo"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-stone-400 ml-1">CRM</label>
                        <input 
                          type="text" 
                          required
                          value={doctorCRM || ''}
                          onChange={(e) => setDoctorCRM(e.target.value)}
                          className="w-full px-5 py-4 rounded-2xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white"
                          placeholder="000000-UF"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-[0.98]"
                      >
                        Acessar Painel
                      </button>
                      <button 
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:text-stone-600 transition-all pt-2"
                      >
                        Sair da conta Google
                      </button>
                    </div>
                  </form>
                )}
                
                <div className="pt-12 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-stone-300 uppercase tracking-[0.3em]">
                    <div className="h-px w-8 bg-stone-200" />
                    Hospital Nova Esperança
                    <div className="h-px w-8 bg-stone-200" />
                  </div>
                  <p className="text-stone-300 text-[10px] font-medium italic">Desenvolvido por Ivson Braga</p>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 py-10"
            >
              <MenuCard 
                icon={<PlusCircle size={32} />}
                title="Nova Avaliação"
                description="Iniciar um novo protocolo de risco cirúrgico."
                onClick={startNewAssessment}
                color="bg-emerald-50 text-emerald-600"
              />
              <MenuCard 
                icon={<History size={32} />}
                title="Avaliações Prévias"
                description="Consultar e editar laudos realizados anteriormente."
                onClick={() => setScreen('history')}
                color="bg-blue-50 text-blue-600"
              />
              <MenuCard 
                icon={<BookOpen size={32} />}
                title="Protocolos"
                description="Consultar diretrizes e tabelas de referência SBC 2024."
                onClick={() => setScreen('protocols')}
                color="bg-amber-50 text-amber-600"
              />
            </motion.div>
          )}

          {screen === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Avaliações Prévias</h2>
                <button onClick={() => setScreen('menu')} className="text-sm font-bold text-stone-500 hover:text-stone-900">Voltar ao Menu</button>
              </div>
              
              <div className="grid gap-4">
                {assessments.length === 0 ? (
                  <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-12 text-center text-stone-400">
                    Nenhuma avaliação encontrada.
                  </div>
                ) : (
                  assessments.map(a => (
                    <div key={a.id} className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                          <User size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{a.name}</h3>
                          <p className="text-sm text-stone-500">{a.date} • {a.age} anos • Risco: <span className="font-bold text-emerald-600">{a.finalRisk}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => editAssessment(a)}
                          className="p-2 text-stone-400 hover:text-emerald-600 transition-colors"
                        >
                          <ChevronRight size={24} />
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm('Deseja excluir esta avaliação?')) {
                              await deleteAssessment(a.id);
                              const data = await getAssessments();
                              setAssessments(data);
                            }
                          }}
                          className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {screen === 'protocols' && (
            <motion.div 
              key="protocols"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Protocolos de Referência</h2>
                <button onClick={() => setScreen('menu')} className="text-sm font-bold text-stone-500 hover:text-stone-900">Voltar ao Menu</button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Flowchart Section */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 size={24} /> Fluxograma de Avaliação SBC 2024
                    </h3>
                    
                    <div className="space-y-4 relative">
                      {/* Step 1 */}
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">1</div>
                        <div className="flex-1 bg-red-50 p-4 rounded-2xl border border-red-100">
                          <p className="font-bold text-red-900">Cirurgia de emergência/urgência?</p>
                          <div className="mt-2 flex gap-4">
                            <div className="text-xs">
                              <span className="font-bold text-red-700">SIM:</span> Prosseguir diretamente para a cirurgia. Estratégias de cardioproteção/monitorização.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">2</div>
                        <div className="flex-1 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                          <p className="font-bold text-orange-900">Condição cardiovascular grave/instável?</p>
                          <div className="mt-2 flex gap-4">
                            <div className="text-xs">
                              <span className="font-bold text-orange-700">SIM:</span> Adiar o procedimento. Estabilizar a condição cardiovascular antes da cirurgia.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">3</div>
                        <div className="flex-1 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                          <p className="font-bold text-blue-900">Estratificar risco clínico do paciente</p>
                          <p className="text-xs text-blue-700 mt-1">Aplicar índice de risco cardiovascular perioperatório (RCRI, VSG-CRI ou AUB-HAS2).</p>
                        </div>
                      </div>

                      {/* Step 4 - Risk Levels */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                          <p className="font-bold text-emerald-900 text-sm">Risco Baixo</p>
                          <p className="text-[10px] text-emerald-700 mt-1">RCRI: 0-1 | VSG-CRI: 0-4 | AUB-HAS2: 0-1</p>
                          <p className="text-xs font-bold text-emerald-600 mt-2">Conduta: Operar diretamente.</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                          <p className="font-bold text-yellow-900 text-sm">Risco Intermediário</p>
                          <p className="text-[10px] text-yellow-700 mt-1">RCRI: 2 | VSG-CRI: 5-6 | AUB-HAS2: 2-3</p>
                          <p className="text-xs font-bold text-yellow-600 mt-2">Conduta: Se cirurgia de risco intermediário/alto, realizar Troponina e ECG basais + monitorização PO.</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                          <p className="font-bold text-red-900 text-sm">Risco Alto</p>
                          <p className="text-[10px] text-red-700 mt-1">RCRI: 3-6 | VSG-CRI: ≥ 7 | AUB-HAS2: 4-6</p>
                          <p className="text-xs font-bold text-red-600 mt-2">Conduta: Considerar prova funcional/eco/BNP antes da cirurgia.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-700">
                      <BookOpen size={24} /> Diretriz Completa
                    </h3>
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                      <p className="text-blue-800 mb-4">Consulte a Diretriz de Avaliação Cardiovascular Perioperatória da Sociedade Brasileira de Cardiologia – 2024.</p>
                      <a 
                        href="https://abccardiol.org/article/diretriz-de-avaliacao-cardiovascular-perioperatoria-da-sociedade-brasileira-de-cardiologia-2024/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
                      >
                        Acessar Diretriz SBC 2024
                        <ChevronRight size={18} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Criteria Sidebar */}
                <div className="space-y-6">
                  <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                    <h4 className="font-bold text-stone-900 mb-4 text-sm uppercase tracking-wider">VSG-CRI (Pontuação)</h4>
                    <ul className="text-xs space-y-2 text-stone-600">
                      <li className="flex justify-between"><span>Idade ≥ 80 anos</span> <span className="font-bold">+4</span></li>
                      <li className="flex justify-between"><span>Idade 70-79 anos</span> <span className="font-bold">+3</span></li>
                      <li className="flex justify-between"><span>Idade 60-69 anos</span> <span className="font-bold">+2</span></li>
                      <li className="flex justify-between"><span>SCC</span> <span className="font-bold">+2</span></li>
                      <li className="flex justify-between"><span>Insuficiência Cardíaca</span> <span className="font-bold">+2</span></li>
                      <li className="flex justify-between"><span>DPOC</span> <span className="font-bold">+2</span></li>
                      <li className="flex justify-between"><span>Creatinina &gt; 1.8 mg/dL</span> <span className="font-bold">+2</span></li>
                      <li className="flex justify-between"><span>Tabagismo</span> <span className="font-bold">+1</span></li>
                      <li className="flex justify-between"><span>DM + insulina</span> <span className="font-bold">+1</span></li>
                      <li className="flex justify-between"><span>Uso de β-bloqueador</span> <span className="font-bold">+1</span></li>
                      <li className="flex justify-between"><span>Revasc. miocárdica prévia</span> <span className="font-bold">-1</span></li>
                    </ul>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                    <h4 className="font-bold text-stone-900 mb-4 text-sm uppercase tracking-wider">RCRI (Critérios)</h4>
                    <ul className="text-xs space-y-2 text-stone-600 list-disc pl-4">
                      <li>Doença isquêmica do coração (SCC)</li>
                      <li>Insuficiência cardíaca</li>
                      <li>Doença cerebrovascular (AVC/AIT)</li>
                      <li>Creatinina &gt; 2.0 mg/dL</li>
                      <li>Diabetes melito com uso de insulina</li>
                      <li>Cirurgia de alto risco (intraperitoneal, intratorácica ou vascular suprainguinal)</li>
                    </ul>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                    <h4 className="font-bold text-stone-900 mb-4 text-sm uppercase tracking-wider">AUB-HAS2 (Critérios)</h4>
                    <ul className="text-xs space-y-2 text-stone-600 list-disc pl-4">
                      <li>Antecedente de cardiopatia</li>
                      <li>Angina ou dispneia</li>
                      <li>Idade ≥ 75 anos</li>
                      <li>Hemoglobina &lt; 12 g/dL</li>
                      <li>Cirurgia vascular arterial</li>
                      <li>Cirurgia de emergência</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'assessment' && (
            <motion.div 
              key="assessment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Progress Bar */}
              <div className="flex items-center justify-between mb-8 no-print">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(s => (
                    <div 
                      key={s} 
                      className={`h-2 w-8 rounded-full transition-all ${currentStep >= s ? 'bg-emerald-500' : 'bg-stone-200'}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Passo {currentStep} de 7</span>
              </div>

              {/* Step Content */}
              <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm min-h-[400px]">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Identificação do Paciente</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-stone-400 ml-1">Nome Completo</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
                          <input 
                            type="text" 
                            value={patient.name || ''}
                            onChange={(e) => updatePatient({ name: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Nome do Paciente"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-stone-400 ml-1">Data de Nascimento</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
                          <input 
                            type="date" 
                            value={patient.dob || ''}
                            onChange={(e) => {
                              const dob = e.target.value;
                              updatePatient({ dob, age: calculateAge(dob) });
                            }}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-stone-400 ml-1">Cirurgia Proposta</label>
                        <input 
                          type="text" 
                          value={patient.proposedSurgery || ''}
                          onChange={(e) => updatePatient({ proposedSurgery: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Ex: Colecistectomia"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-stone-400 ml-1">Capacidade Funcional Estimada</label>
                        <input 
                          type="text" 
                          value={patient.functionalCapacity || ''}
                          onChange={(e) => updatePatient({ functionalCapacity: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Ex: > 4 METs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-stone-400 ml-1">Medicamentos em uso</label>
                        <textarea 
                          value={patient.medications || ''}
                          onChange={(e) => updatePatient({ medications: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                          placeholder="Liste os medicamentos..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-stone-400 ml-1">Alergias</label>
                        <textarea 
                          value={patient.allergies || ''}
                          onChange={(e) => updatePatient({ allergies: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                          placeholder="Liste as alergias..."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase text-stone-400 ml-1">Fatores de Risco</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          'HAS', 'DM2', 'Tabagismo', 'Dislipidemia', 
                          'Doença arterial coronariana', 'Fibrilação Atrial', 
                          'DPOC', 'Asma', 'Hipotireoidismo', 
                          'Hipertiroidismo', 'Doença renal crônica'
                        ].map(risk => (
                          <label key={risk} className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer p-2 rounded-lg hover:bg-stone-50 border border-stone-100">
                            <input 
                              type="checkbox" 
                              checked={patient.riskFactors?.includes(risk)}
                              onChange={(e) => {
                                const current = patient.riskFactors || [];
                                const next = e.target.checked ? [...current, risk] : current.filter(r => r !== risk);
                                updatePatient({ riskFactors: next });
                              }}
                              className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            {risk}
                          </label>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 ml-1">Outros Fatores de Risco</label>
                        <input 
                          type="text" 
                          value={patient.otherRiskFactors || ''}
                          onChange={(e) => updatePatient({ otherRiskFactors: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Especifique outros..."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase text-stone-400 ml-1">Queixas Clínicas</label>
                      <textarea 
                        value={patient.clinicalComplaints || ''}
                        onChange={(e) => updatePatient({ clinicalComplaints: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                        placeholder="Descreva as queixas clínicas do paciente..."
                      />
                    </div>

                    <div className="space-y-4 border-t border-stone-100 pt-6">
                      <h3 className="text-lg font-bold">Exame Físico</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-stone-400 ml-1">PA (mmHg)</label>
                          <input 
                            type="text" 
                            value={patient.pa || ''}
                            onChange={(e) => updatePatient({ pa: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Ex: 120x80"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-stone-400 ml-1">FC (bpm)</label>
                          <input 
                            type="text" 
                            value={patient.fc || ''}
                            onChange={(e) => updatePatient({ fc: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Ex: 80"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <ExamField 
                          label="Aparelho Cardiovascular" 
                          value={patient.cvExam || { status: 'Normal', details: '' }}
                          onChange={(val) => updatePatient({ cvExam: val })}
                        />
                        <ExamField 
                          label="Aparelho Respiratório" 
                          value={patient.respExam || { status: 'Normal', details: '' }}
                          onChange={(val) => updatePatient({ respExam: val })}
                        />
                        <ExamField 
                          label="Abdômen" 
                          value={patient.abdExam || { status: 'Normal', details: '' }}
                          onChange={(val) => updatePatient({ abdExam: val })}
                        />
                        <ExamField 
                          label="Extremidades" 
                          value={patient.extExam || { status: 'Normal', details: '' }}
                          onChange={(val) => updatePatient({ extExam: val })}
                        />
                      </div>

                      <div className="space-y-4 border-t border-stone-100 pt-6">
                        <h3 className="text-lg font-bold">Exames Complementares</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-stone-400 ml-1">Exames laboratoriais</label>
                            <textarea 
                              value={patient.labExams || ''}
                              onChange={(e) => updatePatient({ labExams: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                              placeholder="Resultados relevantes..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-stone-400 ml-1">ECG</label>
                            <textarea 
                              value={patient.ecg || ''}
                              onChange={(e) => updatePatient({ ecg: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                              placeholder="Laudo do ECG..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-stone-400 ml-1">Ecocardiograma</label>
                            <textarea 
                              value={patient.echo || ''}
                              onChange={(e) => updatePatient({ echo: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                              placeholder="Laudo do ECO..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-stone-400 ml-1">Cateterismo</label>
                            <textarea 
                              value={patient.cath || ''}
                              onChange={(e) => updatePatient({ cath: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                              placeholder="Laudo do CATE..."
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2 space-y-1">
                            <label className="text-xs font-bold uppercase text-stone-400 ml-1">Outros</label>
                            <textarea 
                              value={patient.otherExams || ''}
                              onChange={(e) => updatePatient({ otherExams: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                              placeholder="Outros exames..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold">Risco Intrínseco e Hemorrágico</h2>
                    
                    <div className="space-y-4">
                      <label className="text-sm font-bold uppercase text-stone-400">Risco Intrínseco da Cirurgia</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Baixo', 'Intermediário', 'Alto'].map(r => (
                          <button
                            key={r}
                            onClick={() => updatePatient({ intrinsicRisk: r as any, intrinsicRiskItem: '' })}
                            className={`p-4 rounded-2xl border-2 font-bold transition-all ${patient.intrinsicRisk === r ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-100 hover:border-stone-200'}`}
                          >
                            {r} {r === 'Baixo' ? '(<1%)' : r === 'Intermediário' ? '(1-5%)' : '(>5%)'}
                          </button>
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        <label className="text-xs font-bold uppercase text-stone-400 ml-1">Selecione o procedimento (opcional)</label>
                        <select 
                          value={patient.intrinsicRiskItem || ''}
                          onChange={(e) => updatePatient({ intrinsicRiskItem: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white mt-1"
                        >
                          <option value="">Selecione...</option>
                          {patient.intrinsicRisk === 'Baixo' && [
                            'Mama', 'Procedimentos dentários', 'Tireoide', 'Cirurgia ocular', 
                            'Ginecológica minor', 'Ortopédica minor (ex: menisco)', 
                            'Cirurgia reconstrutiva', 'Cirurgias superficiais', 
                            'Urológica minor (RTU)', 'VATS minor'
                          ].map(i => <option key={i} value={i}>{i}</option>)}
                          {patient.intrinsicRisk === 'Intermediário' && [
                            'Carótida assintomática', 'Endarterectomia de carótida (sintomática)', 
                            'Angioplastia arterial periférica', 'Reparo endovascular de aneurisma de aorta', 
                            'Cirurgias de cabeça e pescoço', 'Cirurgia intraperitoneal: Colecistectomia, Hérnia hiatal, Esplenectomia', 
                            'Cirurgia intratorácica non-major', 'Cirurgia neurológica ou ortopédica major (ex: coluna, quadril)', 
                            'Transplante renal', 'Cirurgia urológica e ginecológica major'
                          ].map(i => <option key={i} value={i}>{i}</option>)}
                          {patient.intrinsicRisk === 'Alto' && [
                            'Cirurgia de aorta e vascular major', 'Revascularização periférica aberta (isquemia aguda ou amputação)', 
                            'Angioplastia de carótida (sintomática)', 'Adrenalectomia', 'Cirurgia pancreática', 
                            'Cirurgia hepática e de vias biliares', 'Esofagectomia', 'Pneumectomia (VATS ou aberta)', 
                            'Transplante pulmonar', 'Transplante hepático', 'Cistectomia total', 'Reparo de perfuração intestinal'
                          ].map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-bold uppercase text-stone-400">Risco Hemorrágico</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Baixo Risco', 'Alto Risco'].map(r => (
                          <button
                            key={r}
                            onClick={() => updatePatient({ hemorrhagicRisk: r as any, hemorrhagicRiskItem: '' })}
                            className={`p-4 rounded-2xl border-2 font-bold transition-all ${patient.hemorrhagicRisk === r ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-100 hover:border-stone-200'}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4">
                        <label className="text-xs font-bold uppercase text-stone-400 ml-1">Exemplos de Procedimentos</label>
                        <select 
                          value={patient.hemorrhagicRiskItem || ''}
                          onChange={(e) => updatePatient({ hemorrhagicRiskItem: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white mt-1"
                        >
                          <option value="">Selecione...</option>
                          {patient.hemorrhagicRisk === 'Baixo Risco' && [
                            'Hernioplastia abdominal', 'Histerectomia abdominal', 'Dissecção de nódulo axilar', 
                            'Broncoscopia com ou sem biópsia', 'Cirurgia do túnel do carpo', 'Cirurgia oftalmológica', 
                            'Remoção de cateter venoso central', 'Colecistectomia', 
                            'Biópsias cutâneas, de bexiga, próstata, mama, tireoide e de linfonodos', 
                            'Dilatação e curetagem', 
                            'Endoscopia gastrintestinal com ou sem biópsia, enteroscopia, stent biliar ou pancreático sem esfincterectomia', 
                            'Cirurgia de hemorroida', 'Cirurgia de hidrocele', 
                            'Cirurgia de prótese de joelho ou quadril, mão, ombro, pé, e artroscopia', 
                            'Angiografia não coronariana', 'Extrações e outras cirurgias dentárias'
                          ].map(i => <option key={i} value={i}>{i}</option>)}
                          {patient.hemorrhagicRisk === 'Alto Risco' && [
                            'Cirurgia de aneurisma de aorta abdominal', 'Qualquer grande cirurgia (duração > 45 minutos)', 
                            'Cirurgia de prótese de joelho bilateral', 'Procedimentos de aspiração por agulha fina guiados endoscopicamente', 
                            'Biópsia renal', 'Laminectomia', 'Urológica, de cabeça e pescoço, abdominal, neurocirurgia, câncer de mama', 
                            'Polipectomia, varizes de esôfago, esfincterectomia biliar, dilatação pneumática', 
                            'Ressecção transuretral de próstata'
                          ].map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold">Condições Clínicas e Urgência</h2>
                    
                    <div className="space-y-4">
                      <CheckboxItem 
                        label="Cirurgia de urgência ou emergência"
                        checked={patient.isUrgency || false}
                        onChange={(val) => {
                          if (val) updatePatient({ isUrgency: true, hasSevereCondition: false, isElective: false });
                          else updatePatient({ isUrgency: false });
                        }}
                      />
                      
                      <div className="border-t border-stone-100 pt-6">
                        <CheckboxItem 
                          label="Condição cardiovascular grave ou instável"
                          checked={patient.hasSevereCondition || false}
                          onChange={(val) => {
                            if (val) updatePatient({ hasSevereCondition: true, isUrgency: false, isElective: false });
                            else updatePatient({ hasSevereCondition: false });
                          }}
                        />
                        
                        {patient.hasSevereCondition && (
                          <div className="mt-4 ml-8 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {[
                              'SCA (Síndrome Coronariana Aguda)',
                              'Doenças instáveis da aorta',
                              'EAP (Edema Agudo de Pulmão)',
                              'Choque cardiogênico',
                              'IC classe III/IV NYHA',
                              'Angina classe III/IV CCS',
                              'Estenose aórtica/mitral importante sintomática',
                              'Bradi/Taquiarritmias graves',
                              'FA alta resposta (>120bpm)',
                              'HAS não controlada (>180x110)',
                              'HAP sintomática'
                            ].map(cond => (
                              <label key={cond} className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={patient.severeConditions?.includes(cond)}
                                  onChange={(e) => {
                                    const current = patient.severeConditions || [];
                                    const next = e.target.checked ? [...current, cond] : current.filter(c => c !== cond);
                                    updatePatient({ severeConditions: next });
                                  }}
                                  className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                {cond}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-stone-100 pt-6">
                        <CheckboxItem 
                          label="Cirurgia eletiva"
                          checked={patient.isElective || false}
                          onChange={(val) => {
                            if (val) updatePatient({ isElective: true, isUrgency: false, hasSevereCondition: false });
                            else updatePatient({ isElective: false });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold">Risco da Cirurgia Eletiva</h2>
                    <div className="grid grid-cols-1 gap-4">
                      <button
                        onClick={() => updatePatient({ electiveRisk: 'Baixo' })}
                        className={`p-6 rounded-2xl border-2 text-left transition-all ${patient.electiveRisk === 'Baixo' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-100 hover:border-stone-200'}`}
                      >
                        <h3 className="font-bold text-lg mb-1">Cirurgia de Baixo Risco</h3>
                        <p className="text-sm text-stone-500">Procedimentos com risco cardiovascular intrínseco baixo.</p>
                      </button>
                      <button
                        onClick={() => updatePatient({ electiveRisk: 'Intermediário' })}
                        className={`p-6 rounded-2xl border-2 text-left transition-all ${patient.electiveRisk === 'Intermediário' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-100 hover:border-stone-200'}`}
                      >
                        <h3 className="font-bold text-lg mb-1">Cirurgia de Risco Intermediário ou Alto</h3>
                        <p className="text-sm text-stone-500">Procedimentos que requerem estratificação por escores.</p>
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold">Escores de Risco</h2>
                    
                    <div className="space-y-8">
                      <ScoreSection 
                        title="RCRI (Índice de Risco Cardíaco Revisado)"
                        items={[
                          'História de doença coronária',
                          'História de IC',
                          'História de doença cerebrovascular',
                          'Creatinina > 2,0 mg/dL',
                          'Cirurgia intraperitoneal, intratorácica ou vascular suprainguinal',
                          'Diabetes com insulinoterapia'
                        ]}
                        selected={patient.rcriItems || []}
                        onChange={(items) => updatePatient({ rcriItems: items })}
                      />

                      <ScoreSection 
                        title="AUB-HAS2"
                        items={[
                          'Histórico de doença cardíaca',
                          'Sintomas da doença cardíaca (angina/dispneia)',
                          'Idade > 75 anos',
                          'Hemoglobina < 12 g/dL',
                          'Cirurgia vascular arterial',
                          'Cirurgia de emergência'
                        ]}
                        selected={patient.aubHas2Items || []}
                        onChange={(items) => updatePatient({ aubHas2Items: items })}
                      />

                      <ScoreSection 
                        title="VSG-CRI (Cirurgia Vascular)"
                        items={[
                          '≥ 80 anos', '70-79 anos', '60-69 anos',
                          'Doença arterial coronariana', 'Insuficiência cardíaca', 'DPOC', 'Creatinina > 1,8 mg/dL',
                          'Tabagismo', 'Diabetes em uso de insulina', 'Uso crônico de betabloqueador',
                          'Revascularização miocárdica prévia'
                        ]}
                        selected={patient.vsgCriItems || []}
                        onChange={(items) => updatePatient({ vsgCriItems: items })}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold">Estimativa de Risco e Conduta</h2>
                    <div className="p-8 bg-stone-900 text-white rounded-3xl space-y-6">
                      <div className="flex items-center justify-between border-b border-stone-700 pb-4">
                        <span className="text-stone-400 font-bold uppercase tracking-wider text-xs">Risco Calculado</span>
                        <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                          finalRiskAndConduct.risk === 'Alto' ? 'bg-red-500' : 
                          finalRiskAndConduct.risk === 'Intermediário' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}>
                          {finalRiskAndConduct.risk}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <span className="text-stone-400 font-bold uppercase tracking-wider text-xs">Conduta Recomendada</span>
                        <p className="text-xl font-medium leading-relaxed">{finalRiskAndConduct.conduct}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <StatBox label="RCRI" value={rcriScore} />
                      <StatBox label="AUB-HAS2" value={aubHas2Score} />
                      <StatBox label="VSG-CRI" value={vsgCriScore} />
                    </div>
                  </div>
                )}

                {currentStep === 7 && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between no-print">
                      <h2 className="text-2xl font-bold">Laudo de Avaliação</h2>
                    </div>

                    <div id="periop-report" className="bg-white border border-stone-200 rounded-3xl p-8 space-y-8 shadow-sm">
                      {/* PDF Header */}
                      <div className="flex items-center justify-between border-b-2 border-stone-900 pb-6">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center bg-stone-900 p-3 rounded-2xl shadow-sm">
                            <div className="text-emerald-500 font-black text-3xl tracking-tighter leading-none">hne</div>
                            <div className="text-[5px] font-bold uppercase tracking-[0.1em] text-white text-center leading-tight mt-1">Hospital Nova Esperança</div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tight">Hospital Nova Esperança</h3>
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-[0.2em]">Avaliação de Risco Perioperatório</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Data do Laudo</p>
                          <p className="text-xl font-black text-stone-900">{new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>

                      {/* Patient Data */}
                      <div className="space-y-4 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                        <h4 className="text-xs font-bold uppercase text-emerald-600 tracking-widest border-b border-emerald-100 pb-2">Dados do Paciente</h4>
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                          <div className="col-span-2">
                            <p className="text-stone-400 font-bold uppercase text-[10px]">Nome</p>
                            <p className="font-bold text-stone-800">{patient.name}</p>
                          </div>
                          <div>
                            <p className="text-stone-400 font-bold uppercase text-[10px]">Idade</p>
                            <p className="font-bold text-stone-800">{patient.age} anos</p>
                          </div>
                          <div>
                            <p className="text-stone-400 font-bold uppercase text-[10px]">Data da Avaliação</p>
                            <p className="font-bold text-stone-800">{patient.date}</p>
                          </div>
                          {patient.clinicalComplaints && (
                            <div className="col-span-2">
                              <p className="text-stone-400 font-bold uppercase text-[10px]">Queixas Clínicas</p>
                              <p className="font-bold text-stone-800 leading-relaxed">{patient.clinicalComplaints}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-stone-400 font-bold uppercase text-[10px]">Cirurgia Proposta</p>
                            <p className="font-bold text-stone-800">{patient.proposedSurgery || 'Não informada'}</p>
                          </div>
                          <div>
                            <p className="text-stone-400 font-bold uppercase text-[10px]">Capacidade Funcional</p>
                            <p className="font-bold text-stone-800">{patient.functionalCapacity || 'Não informada'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-stone-400 font-bold uppercase text-[10px]">Fatores de Risco</p>
                            <p className="font-bold text-stone-800">
                              {[...(patient.riskFactors || []), patient.otherRiskFactors].filter(Boolean).join(', ') || 'Nenhum informado'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-stone-400 font-bold uppercase text-[10px]">Medicamentos</p>
                            <p className="font-bold text-stone-800">{patient.medications || 'Nenhum informado'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Physical Exam */}
                      <div className="space-y-4 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                        <h4 className="text-xs font-bold uppercase text-emerald-600 tracking-widest border-b border-emerald-100 pb-2">Exame Físico</h4>
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                          <div>
                            <p className="text-stone-400 font-bold uppercase text-[10px]">PA</p>
                            <p className="font-bold text-stone-800">{patient.pa} mmHg</p>
                          </div>
                          <div>
                            <p className="text-stone-400 font-bold uppercase text-[10px]">FC</p>
                            <p className="font-bold text-stone-800">{patient.fc} bpm</p>
                          </div>
                          <div className="col-span-2 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-stone-400 font-bold uppercase text-[10px]">Cardiovascular</p>
                              <p className="font-bold text-stone-800">{patient.cvExam?.status} {patient.cvExam?.details ? `- ${patient.cvExam.details}` : ''}</p>
                            </div>
                            <div>
                              <p className="text-stone-400 font-bold uppercase text-[10px]">Respiratório</p>
                              <p className="font-bold text-stone-800">{patient.respExam?.status} {patient.respExam?.details ? `- ${patient.respExam.details}` : ''}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Complementary Exams */}
                      {(patient.labExams || patient.ecg || patient.echo || patient.cath || patient.otherExams) && (
                        <div className="space-y-4 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                          <h4 className="text-xs font-bold uppercase text-emerald-600 tracking-widest border-b border-emerald-100 pb-2">Exames Complementares</h4>
                          <div className="grid grid-cols-2 gap-y-4 text-sm">
                            {patient.labExams && (
                              <div className="col-span-2">
                                <p className="text-stone-400 font-bold uppercase text-[10px]">Exames Laboratoriais</p>
                                <p className="font-bold text-stone-800">{patient.labExams}</p>
                              </div>
                            )}
                            {patient.ecg && (
                              <div className="col-span-2">
                                <p className="text-stone-400 font-bold uppercase text-[10px]">ECG</p>
                                <p className="font-bold text-stone-800">{patient.ecg}</p>
                              </div>
                            )}
                            {patient.echo && (
                              <div className="col-span-2">
                                <p className="text-stone-400 font-bold uppercase text-[10px]">Ecocardiograma</p>
                                <p className="font-bold text-stone-800">{patient.echo}</p>
                              </div>
                            )}
                            {patient.cath && (
                              <div className="col-span-2">
                                <p className="text-stone-400 font-bold uppercase text-[10px]">Cateterismo</p>
                                <p className="font-bold text-stone-800">{patient.cath}</p>
                              </div>
                            )}
                            {patient.otherExams && (
                              <div className="col-span-2">
                                <p className="text-stone-400 font-bold uppercase text-[10px]">Outros Exames</p>
                                <p className="font-bold text-stone-800">{patient.otherExams}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Surgery Data */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase text-emerald-600 tracking-widest border-b border-emerald-100 pb-2">Dados da Cirurgia</h4>
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                          <div>
                            <p className="text-stone-400 font-bold uppercase text-[10px]">Risco Intrínseco</p>
                            <p className="font-bold text-stone-800">{patient.intrinsicRisk} {patient.intrinsicRiskItem ? `(${patient.intrinsicRiskItem})` : ''}</p>
                          </div>
                          <div>
                            <p className="text-stone-400 font-bold uppercase text-[10px]">Risco Hemorrágico</p>
                            <p className="font-bold text-stone-800">{patient.hemorrhagicRisk} {patient.hemorrhagicRiskItem ? `(${patient.hemorrhagicRiskItem})` : ''}</p>
                          </div>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase text-emerald-600 tracking-widest border-b border-emerald-100 pb-2">Escores de Risco</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-stone-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-stone-400 uppercase">RCRI</p>
                            <p className="text-xl font-black text-stone-800">{rcriScore}</p>
                          </div>
                          <div className="bg-stone-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-stone-400 uppercase">AUB-HAS2</p>
                            <p className="text-xl font-black text-stone-800">{aubHas2Score}</p>
                          </div>
                          <div className="bg-stone-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-stone-400 uppercase">VSG-CRI</p>
                            <p className="text-xl font-black text-stone-800">{vsgCriScore}</p>
                          </div>
                        </div>
                      </div>

                      {/* Conclusion */}
                      <div className="space-y-4 bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                        <h4 className="text-xs font-bold uppercase text-emerald-600 tracking-widest border-b border-emerald-100 pb-2">Conclusão e Orientações</h4>
                        <div className="space-y-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              finalRiskAndConduct.risk === 'Baixo' ? 'bg-emerald-500' :
                              finalRiskAndConduct.risk === 'Intermediário' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            <p className="text-lg font-bold text-emerald-900 uppercase tracking-tight">
                              Risco Perioperatório: {finalRiskAndConduct.risk}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between no-print">
                              <label className="text-[10px] font-bold uppercase text-emerald-600/60 ml-1">Orientações</label>
                              <button 
                                onClick={() => setShowAutoTextModal(true)}
                                className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-100/50 px-2 py-1 rounded-lg"
                              >
                                <MessageSquare size={12} /> Opções de Auto texto
                              </button>
                            </div>
                            <label className="text-[10px] font-bold uppercase text-emerald-600/60 ml-1 hidden print:block">Orientações</label>
                            <textarea 
                              value={patient.conduct || finalRiskAndConduct.conduct || ''}
                              onChange={(e) => updatePatient({ conduct: e.target.value })}
                              className="w-full bg-white/80 border border-emerald-200 rounded-xl p-4 text-emerald-900 font-medium leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all min-h-[120px] no-print"
                              placeholder="Digite as orientações..."
                            />
                            <div className="hidden print:block text-emerald-900 font-medium leading-relaxed whitespace-pre-wrap pt-2 text-justify">
                              {patient.conduct || finalRiskAndConduct.conduct || ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer / Signature */}
                      <div className="pt-16 flex flex-col items-center text-center">
                        <div className="w-64 h-px bg-stone-900 mb-4" />
                        <p className="text-lg font-black text-stone-900 uppercase tracking-tight">{patient.doctorName || doctorName}</p>
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em]">Médico(a) Avaliador(a) • CRM: {patient.doctorCRM || doctorCRM}</p>
                        
                        <div className="mt-12 flex items-center gap-2 text-[8px] font-bold text-stone-300 uppercase tracking-[0.4em]">
                          <div className="h-px w-12 bg-stone-100" />
                          HNE • PERIOP • SBC 2024
                          <div className="h-px w-12 bg-stone-100" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 no-print">
                <button 
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-stone-500 hover:text-stone-900 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={20} /> Anterior
                </button>
                
                <div className="flex gap-3 no-print">
                  {currentStep === 7 && (
                    <>
                      <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-white border border-stone-200 hover:bg-stone-50 transition-all"
                      >
                        <Save size={20} /> Salvar
                      </button>
                      <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-stone-100 text-stone-900 hover:bg-stone-200 transition-all"
                      >
                        <Printer size={20} /> Imprimir
                      </button>
                      <button 
                        onClick={handleExportPDF}
                        disabled={isGeneratingPDF}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-lg disabled:opacity-50"
                      >
                        <FileDown size={20} /> {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
                      </button>
                      <button 
                        onClick={() => setScreen('menu')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg"
                      >
                        Finalizar
                      </button>
                    </>
                  )}
                  {currentStep < 7 && (
                    <button 
                      onClick={nextStep}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-lg"
                    >
                      Próximo <ChevronRight size={20} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto Text Modal */}
        <AnimatePresence>
          {showAutoTextModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
              >
                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Auto Textos</h3>
                    <p className="text-sm text-stone-500">Selecione ou gerencie seus textos pré-definidos</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowAutoTextModal(false);
                      setIsManagingAutoTexts(false);
                      setEditingAutoTextId(null);
                      setNewAutoText('');
                    }}
                    className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    <X size={24} className="text-stone-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {isManagingAutoTexts ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-stone-400">
                          {editingAutoTextId ? 'Editar Texto' : 'Novo Texto'}
                        </label>
                        <textarea 
                          value={newAutoText}
                          onChange={(e) => setNewAutoText(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-stone-900 min-h-[150px] outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder="Digite o texto aqui..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={handleAddAutoText}
                          className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                        >
                          {editingAutoTextId ? 'Salvar Alterações' : 'Adicionar Texto'}
                        </button>
                        <button 
                          onClick={() => {
                            setIsManagingAutoTexts(false);
                            setEditingAutoTextId(null);
                            setNewAutoText('');
                          }}
                          className="px-6 py-3 font-bold text-stone-500 hover:bg-stone-100 rounded-xl transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3">
                        {autoTexts.map((at) => (
                          <div key={at.id} className="group relative">
                            <button 
                              onClick={() => handleSelectAutoText(at.text)}
                              className="w-full text-left p-4 bg-stone-50 border border-stone-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50 transition-all pr-20"
                            >
                              <p className="text-sm text-stone-700 leading-relaxed line-clamp-3">{at.text}</p>
                            </button>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAutoTextId(at.id);
                                  setNewAutoText(at.text);
                                  setIsManagingAutoTexts(true);
                                }}
                                className="p-2 bg-white shadow-sm border border-stone-100 rounded-lg text-stone-400 hover:text-emerald-600 transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAutoText(at.id);
                                }}
                                className="p-2 bg-white shadow-sm border border-stone-100 rounded-lg text-stone-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => setIsManagingAutoTexts(true)}
                        className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 font-bold hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2"
                      >
                        <PlusCircle size={20} /> Criar Novo Auto Texto
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function MenuCard({ icon, title, description, onClick, color }: { icon: React.ReactNode, title: string, description: string, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white border border-stone-200 rounded-3xl p-8 text-left hover:shadow-xl transition-all hover:-translate-y-1 group"
    >
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
    </button>
  );
}

function ProtocolBox({ title, items }: { title: string, items: string[] }) {
  return (
    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
      <h4 className="font-bold text-sm mb-3 text-stone-400 uppercase tracking-wider">{title}</h4>
      <ul className="space-y-1">
        {items.map(i => <li key={i} className="text-sm text-stone-700">• {i}</li>)}
      </ul>
    </div>
  );
}

function CheckboxItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <label className="flex items-center gap-4 p-4 rounded-2xl border border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors">
      <input 
        type="checkbox" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-6 h-6 rounded-lg border-stone-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="font-bold text-stone-700">{label}</span>
    </label>
  );
}

function ScoreSection({ title, items, selected, onChange }: { title: string, items: string[], selected: string[], onChange: (items: string[]) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map(item => (
          <label key={item} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={selected.includes(item)}
              onChange={(e) => {
                const next = e.target.checked ? [...selected, item] : selected.filter(i => i !== item);
                onChange(next);
              }}
              className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-stone-600">{item}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end">
        <span className="text-xs font-bold bg-stone-100 px-3 py-1 rounded-full text-stone-500">Pontos: {selected.length}</span>
      </div>
    </div>
  );
}

function ExamField({ label, value, onChange }: { label: string, value: { status: 'Normal' | 'Anormal', details: string }, onChange: (val: { status: 'Normal' | 'Anormal', details: string }) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase text-stone-400 ml-1">{label}</label>
      <div className="flex gap-2">
        <button
          onClick={() => onChange({ ...value, status: 'Normal' })}
          className={`px-4 py-2 rounded-lg border font-bold text-sm transition-all ${value.status === 'Normal' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-600 border-stone-200'}`}
        >
          Normal
        </button>
        <button
          onClick={() => onChange({ ...value, status: 'Anormal' })}
          className={`px-4 py-2 rounded-lg border font-bold text-sm transition-all ${value.status === 'Anormal' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-stone-600 border-stone-200'}`}
        >
          Anormal
        </button>
      </div>
      {value.status === 'Anormal' && (
        <input 
          type="text" 
          value={value.details || ''}
          onChange={(e) => onChange({ ...value, details: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          placeholder="Descreva a anormalidade..."
        />
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: number }) {
  return (
    <div className="bg-white border border-stone-200 p-4 rounded-2xl text-center">
      <p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-stone-900">{value}</p>
    </div>
  );
}
