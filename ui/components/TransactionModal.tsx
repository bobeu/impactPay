import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, ShieldCheck, XCircle, ArrowRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionStage } from '@/lib/types';

interface TransactionModalProps {
  stage: TransactionStage;
  txHash?: string;
  errorMessage?: string;
  fee?: bigint;
  onClose?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ stage, txHash, errorMessage, fee, onClose }) => {
  const [showClose, setShowClose] = React.useState(false);

  React.useEffect(() => {
    if (stage === 'idle') {
      setShowClose(false);
      return;
    }
    
    if (stage === 'success' || stage === 'error') {
      setShowClose(true);
      return;
    }

    const timer = setTimeout(() => {
      setShowClose(true);
    }, 60000); // 1 minute
    
    return () => clearTimeout(timer);
  }, [stage]);

  if (stage === 'idle') return null;
                                                            
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-white/60"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm bg-white border border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Transaction Status
            </h2>
            {/* Pulsing indicator */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                {stage === 'success' ? 'Completed' : stage === 'error' ? 'Failed' : 'Processing'}
              </span>
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  stage === 'success' ? "bg-emerald-500" : stage === 'error' ? "bg-red-500" : "bg-amber-400 animate-pulse"
                )}
              />
            </div>
          </div>

          {/* Stepper Content */}
          <div className="p-8 space-y-6">
            <StepItem
              active={stage === 'awaiting_auth' || stage === 'tx_included' || stage === 'verifying' || stage === 'success'}
              completed={stage === 'tx_included' || stage === 'verifying' || stage === 'success'}
              error={stage === 'error'}
              icon={<ShieldCheck className="w-5 h-5" />}
              title="Awaiting Authorization"
              description="Please approve the transaction."
            />
            
            <div className="ml-5 pl-1 border-l-2 border-slate-100 h-6 -my-6" />

            <StepItem
              active={stage === 'tx_included' || stage === 'verifying' || stage === 'success'}
              completed={stage === 'verifying' || stage === 'success'}
              error={stage === 'error'}
              icon={<Loader2 className="w-5 h-5" />}
              title="Processing Payment"
              description={txHash ? `Tx: ${txHash.slice(0, 6)}...${txHash.slice(-4)}` : "Confirming on network..."}
              pulse={stage === 'tx_included'}
            />

            <div className="ml-5 pl-1 border-l-2 border-slate-100 h-6 -my-6" />

            <StepItem
              active={stage === 'verifying' || stage === 'success'}
              completed={stage === 'success'}
              error={stage === 'error'}
              icon={<Check className="w-5 h-5" />}
              title="Finalizing Settlement"
              description="Securing the funds on-chain."
              pulse={stage === 'verifying'}
            />
          </div>

          {/* Fee Information (if applicable) */}
          {fee && fee > 0n && (
            <div className="px-8 py-3 bg-slate-50 border-y border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Fee</span>
              <span className="text-xs font-black text-[#001B3D]">${(Number(fee) / 1e18).toFixed(4)} USDm</span>
            </div>
          )}

          {/* Footer & Progress Bar */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col items-center">
            {stage === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-widest"
              >
                <Check className="w-4 h-4" /> Settlement Finalized
              </motion.div>
            )}
            
            {stage === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-1 text-red-500 text-xs font-bold uppercase tracking-widest text-center"
              >
                <div className="flex items-center gap-2"><XCircle className="w-4 h-4" /> Transaction Failed</div>
                <span className="text-[10px] text-slate-500 capitalize tracking-normal leading-tight">{errorMessage}</span>
              </motion.div>
            )}

            {!['success', 'error'].includes(stage) && !showClose && (
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Please securely keep this window open
              </div>
            )}
            
            {showClose && onClose && (
              <button
                onClick={onClose}
                className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
               >
                Close Window
              </button>
             )}
            
            {stage === 'success' && txHash && (
              <a
                href={`https://celo.blockscout.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition-colors shadow-sm"
              >
                View on Block Explorer <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>
          
          <div className="h-1 w-full bg-slate-100">
            <motion.div 
              className={cn("h-full", stage === 'error' ? "bg-red-500" : "bg-emerald-500")}
              initial={{ width: "0%" }}
              animate={{ 
                width: stage === 'success' || stage === 'error' ? "100%" 
                     : stage === 'verifying' ? "75%"
                     : stage === 'tx_included' ? "50%"
                     : stage === 'awaiting_auth' ? "25%"
                     : "0%"
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const StepItem = ({ active, completed, error, title, description, icon, pulse }: any) => {
  const isActiveOrCompleted = active || completed;
  
  return (
    <div className={cn("flex items-start gap-5 transition-opacity duration-300", isActiveOrCompleted ? "opacity-100" : "opacity-40")}>
      <div className={cn(
        "mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300",
        completed ? "border-emerald-500 bg-emerald-50 text-emerald-500" :
        active && !error ? "border-amber-400 bg-amber-50 text-amber-500" :
        error && active ? "border-red-500 bg-red-50 text-red-500" :
        "border-slate-200 bg-slate-50 text-slate-400",
        pulse && !error && "shadow-[0_0_15px_rgba(251,191,36,0.15)]"
      )}>
        <span className={cn("transition-transform duration-500", completed ? "scale-100" : pulse ? "animate-spin-slow" : "scale-100")}>
          {completed ? <Check className="w-5 h-5" /> : error && active ? <XCircle className="w-5 h-5" /> : icon}
        </span>
      </div>
      <div className="flex flex-col pt-0.5">
        <h4 className={cn(
          "text-sm font-semibold tracking-wide",
          completed ? "text-slate-900" : error && active ? "text-red-600" : active ? "text-slate-900" : "text-slate-400"
        )}>
          {title}
        </h4>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  );
};
