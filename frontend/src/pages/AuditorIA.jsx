import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auditorService } from '../services/ai/auditorService';
import { Send, Bot, User, Sparkles, Loader2, AlertTriangle, TrendingUp, PackageSearch, Clock, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

export const AuditorIA = () => {
  const { currentRestaurant } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const query = textOverride || input;
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user', content: query.trim(), id: Date.now().toString() };
    const botPlaceholderId = `bot-${Date.now()}`;
    
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '', id: botPlaceholderId, isStreaming: true }]);
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));
      
      await auditorService.askAuditorStream(userMessage.content, currentRestaurant.id, historyForApi, (chunk) => {
          setMessages(prev => prev.map(m => 
              m.id === botPlaceholderId ? { ...m, content: chunk } : m
          ));
      });
      
      setMessages(prev => prev.map(m => 
          m.id === botPlaceholderId ? { ...m, isStreaming: false } : m
      ));
      
    } catch (error) {
      toast.error(error.message || "Error al procesar la solicitud");
      setMessages(prev => prev.map(m => 
          m.id === botPlaceholderId 
            ? { ...m, content: `**Error:** No pude procesar esa consulta. ${error.message}`, isError: true, isStreaming: false } 
            : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { text: "¿Qué insumos urgen comprar?", icon: <PackageSearch size={18}/>, color: "text-amber-500", bg: "bg-amber-50" },
    { text: "Lotes próximos a caducar", icon: <Clock size={18}/>, color: "text-rose-500", bg: "bg-rose-50" },
    { text: "Mi producto estrella", icon: <TrendingUp size={18}/>, color: "text-emerald-500", bg: "bg-emerald-50" },
    { text: "Tabla de resumen de ventas", icon: <BarChart3 size={18}/>, color: "text-blue-500", bg: "bg-blue-50" }
  ];

  return (
    <div className="flex h-full w-full bg-slate-50/50 overflow-hidden rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-col relative">
      
      {/* Header */}
      <div className="h-20 bg-white border-b border-slate-100 flex items-center px-8 shrink-0 z-10 relative shadow-sm">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/20">
          <Bot size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Auditor IA <Sparkles size={16} className="text-amber-400 fill-amber-400" />
          </h1>
          <p className="text-sm text-slate-500 font-medium">Asistente cognitivo entrenado con los datos de tu restaurante</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative">
        
        {/* Empty State Hero */}
        {messages.length === 0 && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="absolute inset-0 flex flex-col items-center justify-center px-6"
            >
                <div className="w-24 h-24 rounded-3xl bg-white shadow-xl shadow-blue-500/10 flex items-center justify-center mb-8 border border-slate-100 relative">
                    <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 rounded-3xl"></div>
                    <Bot size={48} className="text-blue-600 relative z-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-3 text-center tracking-tight">Hola, soy Insumia IA</h2>
                <p className="text-slate-500 text-center max-w-lg mb-10 text-lg">
                    Estoy conectado en tiempo real al Kardex y las ventas de <strong className="text-slate-700">{currentRestaurant?.nombre || 'tu restaurante'}</strong>. Pídeme que analice lo que necesites.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    {suggestions.map((sug, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleSubmit(null, sug.text)}
                            className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left flex items-center gap-4 group cursor-pointer"
                        >
                            <div className={`p-3 rounded-xl ${sug.bg} ${sug.color} group-hover:scale-110 transition-transform`}>
                                {sug.icon}
                            </div>
                            <span className="font-bold text-slate-700">{sug.text}</span>
                        </button>
                    ))}
                </div>
            </motion.div>
        )}

        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}
          >
            <div className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm mt-1
                ${msg.role === 'user' 
                  ? 'bg-blue-600 border-blue-700 text-white' 
                  : msg.isError ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-blue-600'}`}
              >
                {msg.role === 'user' ? <User size={20} /> : (msg.isError ? <AlertTriangle size={20} /> : <Bot size={20} />)}
              </div>

              {/* Bubble */}
              <div className={`px-6 py-5 rounded-3xl shadow-sm border text-[15px] leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-blue-600 border-blue-700 text-white rounded-tr-sm' 
                  : msg.isError ? 'bg-red-50 border-red-100 text-red-900 rounded-tl-sm' 
                  : 'bg-white border-slate-200 text-slate-700 rounded-tl-sm prose prose-slate max-w-full prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-headings:mb-3 prose-headings:mt-4 prose-table:my-4 prose-th:bg-slate-50 prose-td:border-slate-100'}`}
              >
                {msg.role === 'assistant' ? (
                  <>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    {msg.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse align-middle rounded-sm"></span>
                    )}
                  </>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Indicador de "Analizando..." cuando aún no llega el primer chunk */}
        {isLoading && messages.length > 0 && !messages[messages.length - 1].content && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start relative z-10">
             <div className="flex gap-4 max-w-[85%]">
               <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot size={20} className="animate-pulse" />
               </div>
               <div className="px-5 py-4 rounded-3xl rounded-tl-sm bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                 <Loader2 size={18} className="animate-spin text-blue-500" />
                 <span className="text-slate-500 font-medium text-sm">Procesando datos del Kardex...</span>
               </div>
             </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-100 p-4 md:p-6 shrink-0 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <form onSubmit={(e) => handleSubmit(e)} className="relative max-w-5xl mx-auto">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Escribe tu consulta aquí..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-6 pr-16 py-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-800 disabled:opacity-50 shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-500/30 active:scale-90"
          >
            <Send size={20} className="ml-1" />
          </button>
        </form>
        <p className="text-center text-[10px] font-bold text-slate-400 mt-4 tracking-widest uppercase flex items-center justify-center gap-1">
          <Sparkles size={10} /> La IA procesa tus datos financieros en tiempo real. Revisa siempre los resultados.
        </p>
      </div>

    </div>
  );
};
