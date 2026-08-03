import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoadingSpinner = ({ text = "Cargando..." }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-16 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center bg-white/50 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-slate-100/50"
      >
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium tracking-wide text-sm">{text}</p>
      </motion.div>
    </div>
  );
};
