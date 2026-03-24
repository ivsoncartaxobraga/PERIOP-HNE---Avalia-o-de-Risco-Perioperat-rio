import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query, 
  orderBy, 
  where,
  getDocFromServer,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface PatientData {
  id: string;
  doctorName: string;
  doctorCRM: string;
  name: string;
  dob: string;
  age: number;
  date: string;
  clinicalComplaints: string;
  // New fields
  proposedSurgery: string;
  functionalCapacity: string;
  medications: string;
  allergies: string;
  riskFactors: string[];
  otherRiskFactors: string;
  // Physical Exam
  pa: string;
  fc: string;
  cvExam: { status: 'Normal' | 'Anormal', details: string };
  respExam: { status: 'Normal' | 'Anormal', details: string };
  abdExam: { status: 'Normal' | 'Anormal', details: string };
  extExam: { status: 'Normal' | 'Anormal', details: string };
  
  // Complementary Exams
  labExams: string;
  ecg: string;
  echo: string;
  cath: string;
  otherExams: string;
  
  intrinsicRisk: 'Baixo' | 'Intermediário' | 'Alto';
  intrinsicRiskItem: string;
  hemorrhagicRisk: 'Baixo Risco' | 'Alto Risco';
  hemorrhagicRiskItem: string;
  isUrgency: boolean;
  hasSevereCondition: boolean;
  severeConditions: string[];
  isElective: boolean;
  electiveRisk: 'Baixo' | 'Intermediário' | null;
  rcriScore: number;
  rcriItems: string[];
  aubHas2Score: number;
  aubHas2Items: string[];
  vsgCriScore: number;
  vsgCriItems: string[];
  finalRisk: 'Baixo' | 'Intermediário' | 'Alto' | 'Urgência' | 'Instável';
  conduct: string;
  authorUid?: string;
  createdAt?: any;
}

export interface AutoText {
  id: string;
  text: string;
  authorUid: string;
  createdAt?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
};

export const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const saveAssessment = async (data: PatientData) => {
  const path = 'assessments';
  try {
    const assessmentRef = doc(db, path, data.id);
    const dataToSave = {
      ...data,
      authorUid: auth.currentUser?.uid || 'anonymous',
      createdAt: Timestamp.now()
    };
    await setDoc(assessmentRef, dataToSave);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getAssessments = async (): Promise<PatientData[]> => {
  const path = 'assessments';
  if (!auth.currentUser) return [];
  
  try {
    const q = query(
      collection(db, path), 
      where('authorUid', '==', auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    const assessments = querySnapshot.docs.map(doc => doc.data() as PatientData);
    
    // Sort in memory to avoid composite index requirement
    return assessments.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const deleteAssessment = async (id: string) => {
  const path = `assessments/${id}`;
  try {
    await deleteDoc(doc(db, 'assessments', id));
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveAutoText = async (text: string) => {
  const path = 'autotexts';
  if (!auth.currentUser) return;
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const autoTextRef = doc(db, path, id);
    const dataToSave = {
      id,
      text,
      authorUid: auth.currentUser.uid,
      createdAt: Timestamp.now()
    };
    await setDoc(autoTextRef, dataToSave);
    return { success: true, id };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getAutoTexts = async (): Promise<AutoText[]> => {
  const path = 'autotexts';
  if (!auth.currentUser) return [];
  
  try {
    const q = query(
      collection(db, path), 
      where('authorUid', '==', auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    const texts = querySnapshot.docs.map(doc => doc.data() as AutoText);
    
    return texts.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const deleteAutoText = async (id: string) => {
  const path = `autotexts/${id}`;
  try {
    await deleteDoc(doc(db, 'autotexts', id));
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateAutoText = async (id: string, text: string) => {
  const path = `autotexts/${id}`;
  try {
    const autoTextRef = doc(db, 'autotexts', id);
    await updateDoc(autoTextRef, { text });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // Scroll to top to ensure html2canvas captures correctly
    window.scrollTo(0, 0);
    
    // Small delay to let any animations finish
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Aggressively remove all oklab/oklch from stylesheets to prevent parsing errors
        Array.from(clonedDoc.styleSheets).forEach(sheet => {
          try {
            const rules = Array.from(sheet.cssRules);
            for (let i = rules.length - 1; i >= 0; i--) {
              if (rules[i].cssText.includes('okl')) {
                sheet.deleteRule(i);
              }
            }
          } catch (e) {
            // If we can't access rules (cross-origin), remove the whole sheet
            if (sheet.ownerNode instanceof HTMLElement) {
              sheet.ownerNode.remove();
            }
          }
        });

        // Inject a style tag to reset all problematic modern CSS features and restore basic layout
        const style = clonedDoc.createElement('style');
        style.innerHTML = `
          * { 
            box-shadow: none !important; 
            text-shadow: none !important; 
            outline: none !important;
            ring: none !important;
            --tw-ring-offset-shadow: 0 0 #0000 !important;
            --tw-ring-shadow: 0 0 #0000 !important;
            --tw-shadow: 0 0 #0000 !important;
            --tw-shadow-colored: 0 0 #0000 !important;
            transition: none !important;
            animation: none !important;
          }
          /* Restore basic report styling in case Tailwind rules were deleted */
          #periop-report {
            background-color: #ffffff !important;
            color: #1c1917 !important;
            display: block !important;
            width: 100% !important;
          }
          .grid { display: grid !important; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .gap-4 { gap: 1rem !important; }
          .gap-y-4 { row-gap: 1rem !important; }
          .space-y-4 > * + * { margin-top: 1rem !important; }
          .space-y-8 > * + * { margin-top: 2rem !important; }
        `;
        clonedDoc.head.appendChild(style);

        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.style.backgroundColor = '#ffffff';
          clonedElement.style.padding = '20px';
        }
      }
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Additional pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Erro ao gerar PDF. Tente novamente.');
  }
};
