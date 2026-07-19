import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "@/hooks/useSession";
import { useExtraction, type ExtractedField, type UploadStatus } from "@/hooks/useExtraction";
import { useRules } from "@/hooks/useRules";
import { useCalculator } from "@/hooks/useCalculator";

type SessionContextValue = {
  token: string | null;
  createSession: () => Promise<string | undefined>;
  deleteSession: () => Promise<void>;
  sessionLoading: boolean;
  fields: ExtractedField[];
  extractLoading: boolean;
  extractError: string | null;
  uploads: UploadStatus[];
  uploadDocument: (file: File) => Promise<any>;
  confirmField: (fieldName: string, correctedValue?: string) => Promise<void>;
  skipField: (fieldName: string) => Promise<void>;
  deleteField: (fieldName: string) => Promise<void>;
  allConfirmed: boolean;
  needsReviewRef: React.RefObject<HTMLDivElement | null>;
  answer: any;
  askQuestion: (q: string, token?: string) => Promise<any>;
  calcResult: any;
  calcLoading: boolean;
  explaining: boolean;
  explanation: string | null;
  calculate: (income: number, hhSize: number, county: string) => Promise<any>;
  calculateFromProfile: (token: string) => Promise<any>;
  explainCalculation: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { token, createSession, deleteSession, loading: sessionLoading } = useSession();
  const {
    fields,
    loading: extractLoading,
    error: extractError,
    uploads,
    uploadDocument,
    confirmField,
    skipField,
    deleteField,
    allConfirmed,
    needsReviewRef,
  } = useExtraction(token);
  const { answer, askQuestion } = useRules();
  const {
    result: calcResult,
    loading: calcLoading,
    explaining,
    explanation,
    calculate,
    calculateFromProfile,
    explainCalculation,
  } = useCalculator();

  return (
    <SessionContext.Provider
      value={{
        token,
        createSession,
        deleteSession,
        sessionLoading,
        fields,
        extractLoading,
        extractError,
        uploads,
        uploadDocument,
        confirmField,
        skipField,
        deleteField,
        allConfirmed,
        needsReviewRef,
        answer,
        askQuestion,
        calcResult,
        calcLoading,
        explaining,
        explanation,
        calculate,
        calculateFromProfile,
        explainCalculation,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSessionContext must be used within a SessionProvider");
  return ctx;
}
