import { Joyride, STATUS } from 'react-joyride';
import { useTour } from '../../context/TourContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight, Check, X } from 'lucide-react';

const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,
  skipProps,
  primaryProps,
  tooltipProps,
  isLastStep,
}) => {
  return (
    <div 
      {...tooltipProps} 
      className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-6 max-w-sm relative overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-60"></div>
      
      <button 
        {...skipProps} 
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors z-10 cursor-pointer"
        aria-label="Omitir tour"
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
          <HelpCircle size={20} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 tracking-tight leading-none mb-1">Guía Rápida</h4>
          <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase bg-blue-50 px-2 py-0.5 rounded-full">
            Paso {index + 1}
          </span>
        </div>
      </div>
      
      <div className="text-slate-600 text-sm leading-relaxed mb-6 relative z-10">
        {step.content}
      </div>

      <div className="flex items-center justify-between mt-2 relative z-10">
        <div className="flex gap-1">
          {index > 0 && (
            <button 
              {...backProps} 
              className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Atrás
            </button>
          )}
          {!isLastStep && (
            <button 
              {...skipProps} 
              className="text-sm font-semibold text-slate-400 hover:text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Omitir
            </button>
          )}
        </div>
        
        <button 
          {...primaryProps} 
          className="flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all cursor-pointer active:scale-95"
        >
          {isLastStep ? (
            <>Finalizar <Check size={16} /></>
          ) : (
            <>Siguiente <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
};

export const GlobalTour = () => {
  const { runTour, tourSteps, handleTourCallback, tourId } = useTour();

  return (
    <Joyride
      key={tourId}
      steps={tourSteps}
      run={runTour}
      continuous={true}
      scrollToFirstStep={true}
      showProgress={false}
      showSkipButton={true}
      callback={handleTourCallback}
      tooltipComponent={CustomTooltip}
      disableOverlayClose={true}
      floaterProps={{
        disableAnimation: true,
        styles: {
          floater: {
            filter: 'drop-shadow(0 20px 25px rgb(0 0 0 / 0.15))',
          }
        }
      }}
    />
  );
};
