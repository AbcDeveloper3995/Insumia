import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auditorService } from '../services/ai/auditorService';
import { Send, Bot, User, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export const AuditorIA = () => {
  const { currentRestaurant } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy Insumia IA, tu copiloto financiero. He analizado el estado actual de tu Kardex y tus ventas. ¿En qué puedo ayudarte hoy?', id: 'welcome' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim(), id: Date.now().toString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));
        
      const response = await auditorService.askAuditor(userMessage.content, currentRestaurant.id, historyForApi);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response, id: Date.now().toString() }]);
    } catch (error) {
      toast.error(error.message || "Error al procesar la solicitud");
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `**Error:** No pude procesar esa consulta. ${error.message}`, 
        id: Date.now().toString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionPills = [
    "¿Cuáles insumos debo comprar urgentemente?",
    "Resume las ventas de hoy",
    "¿Hay algún producto cerca a caducar?",
    "¿Cuál es mi platillo más vendido?"
  ];

  return (
    <div className="flex h-full w-full bg-slate-50/50 overflow-hidden rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-col relative">
      
      {/* Header */}
      <div className="h-20 bg-white border-b border-slate-100 flex items-center px-8 shrink-0 z-10 relative shadow-sm">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mr-4 shadow-inner border border-blue-200/50">
          <Bot size={24} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Auditor IA <Sparkles size={16} className="text-amber-400 fill-amber-400" />
          </h1>
          <p className="text-sm text-slate-500 font-medium">Asistente cognitivo entrenado con los datos de tu restaurante</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-blue-600 border-blue-700 text-white' 
                  : msg.isError ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-blue-600'}`}
              >
                {msg.role === 'user' ? <User size={20} /> : (msg.isError ? <AlertTriangle size={20} /> : <Bot size={20} />)}
              </div>

              {/* Bubble */}
              <div className={`px-5 py-4 rounded-3xl shadow-sm border text-[15px] leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-blue-600 border-blue-700 text-white rounded-tr-sm' 
                  : msg.isError ? 'bg-red-50 border-red-100 text-red-900 rounded-tl-sm' : 'bg-white border-slate-100 text-slate-700 rounded-tl-sm prose prose-slate prose-p:my-1 prose-ul:my-1 prose-li:my-0'}`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
             <div className="flex gap-4 max-w-[85%]">
               <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot size={20} className="animate-pulse" />
               </div>
               <div className="px-5 py-4 rounded-3xl rounded-tl-sm bg-white border border-slate-100 shadow-sm flex items-center gap-2">
                 <Loader2 size={18} className="animate-spin text-blue-500" />
                 <span className="text-slate-500 font-medium text-sm">Analizando datos del restaurante...</span>
               </div>
             </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-100 p-4 md:p-6 shrink-0 relative z-10">
        
        {/* Suggestion Pills */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestionPills.map(pill => (
              <button 
                key={pill}
                onClick={() => setInput(pill)}
                className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-sm font-medium hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                {pill}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Pregúntale a Insumia IA sobre tus inventarios o ventas..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-6 pr-16 py-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-800 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-500/20 active:scale-90"
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
        <p className="text-center text-[11px] font-bold text-slate-400 mt-3 tracking-widest uppercase">
          Respuestas generadas por IA pueden contener imprecisiones
        </p>
      </div>

    </div>
  );
};
