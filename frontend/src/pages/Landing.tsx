import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

const WORDS = [
  "rupee.",
  "रुपया.",
  "টাকা.",
  "ரூபாய்.",
  "రూపాయి.",
  "ರೂಪಾಯಿ.",
  "രൂപ.",
  "રૂપિયો.",
  "ਰੁਪਇਆ."
];

export const Landing = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    const handleTyping = () => {
      const fullWord = WORDS[currentWordIndex];
      
      if (isDeleting) {
        setCurrentText(fullWord.substring(0, currentText.length - 1));
        setTypingSpeed(50); // Faster when deleting
      } else {
        setCurrentText(fullWord.substring(0, currentText.length + 1));
        setTypingSpeed(150); // Normal typing speed
      }

      if (!isDeleting && currentText === fullWord) {
        // Pause at the end of word
        timer = setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % WORDS.length);
        timer = setTimeout(handleTyping, 500); // Pause before typing next word
      } else {
        timer = setTimeout(handleTyping, typingSpeed);
      }
    };

    timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, typingSpeed]);

  return (
    <div className="flex flex-col items-center pt-0 pb-[120px] text-center relative overflow-hidden">
      
      {/* Ambient background gradients using pure CSS gradient instead of blur filter for performance */}
      <div 
        className="absolute top-1/3 right-1/4 w-[800px] h-[800px] pointer-events-none -z-10 float-animation"
        style={{
          background: 'radial-gradient(circle, rgba(178,141,255,0.06) 0%, rgba(178,141,255,0.02) 40%, rgba(7,7,9,0) 70%)',
        }}
      />
      <div 
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] pointer-events-none -z-10 float-animation"
        style={{
          background: 'radial-gradient(circle, rgba(60,227,112,0.04) 0%, rgba(60,227,112,0.01) 40%, rgba(7,7,9,0) 70%)',
          animationDelay: '2s'
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1000px] w-full px-[16px] relative z-10 mx-auto flex flex-col items-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[12vw] sm:text-[8vw] md:text-[120px] font-sans font-bold tracking-tighter leading-[1.2] py-4 mb-2 -mt-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-[rgba(255,255,255,0.5)] whitespace-nowrap"
        >
          Track every{' '}
          <span className="relative inline-block text-left align-bottom">
            {/* Invisible full word to maintain exact width and perfectly center the line */}
            <span className="opacity-0 pointer-events-none select-none">
              {WORDS[currentWordIndex]}
              {/* Invisible cursor space to account for its width */}
              <span className="inline-block w-[6px] sm:w-[10px] ml-1 sm:ml-2" />
            </span>
            
            {/* Absolute positioned typing text overlay */}
            <span className="text-[#3CE370] absolute top-0 left-0 whitespace-nowrap">
              {currentText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block w-[6px] sm:w-[10px] h-[60px] sm:h-[100px] bg-[#3CE370] ml-1 sm:ml-2 align-middle -mt-2 sm:-mt-4"
              />
            </span>
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-[20px] sm:text-[24px] text-[rgba(255,255,255,0.6)] font-sans max-w-[700px] mx-auto leading-[1.5] tracking-tight mb-[48px]"
        >
          Kharchwise securely manages your shared group expenses and gives a clear picture of who owes what. So you can stop arguing and lead a healthier financial life.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto z-20"
        >
          <Link to="/login" className="no-underline w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto !px-12 !py-5 !text-[18px] !rounded-[100px] shadow-[0_8px_32px_rgba(60,227,112,0.25)] hover:shadow-[0_12px_48px_rgba(60,227,112,0.35)] font-bold tracking-wide relative group overflow-hidden">
              <span className="relative z-10">Get Started Free</span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer-sweep_2s_infinite] skew-x-[-20deg]" />
            </Button>
          </Link>
        </motion.div>

        {/* Hero Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-[64px] w-full max-w-[1000px] relative"
          style={{ perspective: '1200px' }}
        >
          <div className="relative w-full rounded-[24px] sm:rounded-[40px] border border-[rgba(255,255,255,0.1)] bg-[#070709]/60 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col mx-auto"
               style={{ transform: 'rotateX(8deg) translateY(-10px)', transformStyle: 'preserve-3d', transformOrigin: 'top center' }}>
            
            {/* Mockup Topbar */}
            <div className="h-12 border-b border-[rgba(255,255,255,0.08)] flex items-center px-6 gap-2 bg-[#121214]/50">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"></div>
            </div>

            {/* Mockup Content */}
            <div className="p-6 sm:p-10 grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-90 relative z-10 text-left">
              <div className="col-span-1 sm:col-span-2 space-y-4">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFBD2E] to-[#FF5F56] flex items-center justify-center text-[22px] shadow-lg">🌴</div>
                  <h2 className="text-[24px] sm:text-[28px] font-sans font-bold text-white tracking-tight">Goa Trip 2026</h2>
                </div>
                {[
                  { icon: '🍕', title: 'Dinner at Bombay Canteen', who: 'Aisha paid', amount: '₹3,400', color: 'bg-orange-500/20 text-orange-400' },
                  { icon: '🚕', title: 'Uber to Airport', who: 'You paid', amount: '₹850', color: 'bg-yellow-500/20 text-yellow-400' },
                  { icon: '🏨', title: 'Airbnb (3 Nights)', who: 'Rahul paid', amount: '₹12,000', color: 'bg-[#3CE370]/20 text-[#3CE370]' }
                ].map((item, i) => (
                  <div key={i} className="group h-[88px] w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-[20px] flex items-center px-6 gap-4 shadow-sm hover:bg-[rgba(255,255,255,0.08)] hover:scale-[1.02] hover:shadow-md hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
                    <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform`}>{item.icon}</div>
                    <div className="flex-1">
                      <div className="text-[16px] font-bold text-white mb-1 tracking-tight">{item.title}</div>
                      <div className="text-[13px] text-[rgba(255,255,255,0.5)] font-medium">{item.who}</div>
                    </div>
                    <div className="text-[18px] font-bold text-white">{item.amount}</div>
                  </div>
                ))}
              </div>
              <div className="col-span-1 space-y-4 hidden sm:block mt-2">
                <div className="h-40 w-full bg-gradient-to-br from-[#3CE370]/15 to-[rgba(255,255,255,0.02)] border border-[#3CE370]/30 rounded-[24px] p-6 flex flex-col justify-between shadow-[0_8px_32px_rgba(60,227,112,0.15)] relative overflow-hidden group cursor-pointer hover:border-[#3CE370]/50 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#3CE370]/20 blur-[40px] rounded-full group-hover:bg-[#3CE370]/30 transition-colors"></div>
                  <div>
                    <div className="text-[12px] font-bold text-[#3CE370] uppercase tracking-wider mb-1 relative z-10">Total Balance</div>
                    <div className="text-[32px] font-bold text-white tracking-tight relative z-10">₹4,250</div>
                  </div>
                  <button className="h-10 w-[110px] bg-[#3CE370] rounded-lg relative z-10 shadow-[0_4px_12px_rgba(60,227,112,0.3)] text-[#070709] font-bold text-[14px] hover:bg-[#32c962] hover:scale-105 active:scale-95 transition-all">Settle Up</button>
                </div>
                <div className="h-56 w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6">
                  <div className="text-[15px] font-bold text-white mb-6 tracking-tight">Who owes who?</div>
                  <div className="space-y-5">
                    {[
                      { name: 'Rahul owes you', amount: '₹3,000', percent: 'w-[80%]', color: 'bg-[#3CE370]' },
                      { name: 'Aisha owes you', amount: '₹1,250', percent: 'w-[30%]', color: 'bg-[#3CE370]' },
                      { name: 'You owe Sameer', amount: '₹800', percent: 'w-[15%]', color: 'bg-[#FF5F56]' },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col gap-2 group cursor-pointer">
                        <div className="flex justify-between items-center text-[13px]">
                          <span className="text-[rgba(255,255,255,0.7)] group-hover:text-white transition-colors">{item.name}</span>
                          <span className="font-bold text-white">{item.amount}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                          <div className={`h-full ${item.percent} ${item.color} rounded-full group-hover:opacity-80 transition-opacity`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing Aurora inside mockup */}
            <div className="absolute -top-[100px] -right-[100px] w-[500px] h-[500px] bg-[#3CE370]/15 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-[100px] -left-[100px] w-[500px] h-[500px] bg-[#B28DFF]/10 blur-[100px] rounded-full pointer-events-none" />
          </div>
        </motion.div>
        
        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-[120px] grid grid-cols-1 sm:grid-cols-3 gap-8 text-left"
        >
          {[
            { icon: '💰', title: 'Split Expenses', desc: 'Easily divide costs among group members' },
            { icon: '📊', title: 'Track Balances', desc: 'See who owes what at a glance' },
            { icon: '✨', title: 'Settle Up', desc: 'Record payments and stay organized' }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 + i * 0.1 }}
              className="bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-[24px] p-8 hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.12)] transition-all duration-300"
            >
              <div className="text-[48px] mb-4">{feature.icon}</div>
              <h3 className="text-[24px] font-sans font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-[16px] text-[rgba(255,255,255,0.6)] leading-[1.5]">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};
