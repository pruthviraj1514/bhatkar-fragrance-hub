import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function getNextSaturday() {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday, 6=Saturday
  const diff = (6 - day + 7) % 7 || 7; // next Saturday
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + diff);
  nextSaturday.setHours(0, 0, 0, 0);
  return nextSaturday;
}

export function WeekendSaleHero() {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());

  function getTimeRemaining() {
    const target = getNextSaturday();
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full bg-gradient-to-br from-black via-neutral-900 to-black text-white py-20 flex flex-col items-center justify-center text-center overflow-hidden">
      
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-serif font-bold mb-4"
      >
        Weekend Luxury Sale
      </motion.h1>

      <p className="text-neutral-400 mb-10 tracking-wide text-lg">
        Exclusive offers dropping soon. Don’t miss it.
      </p>

      <div className="flex gap-6 md:gap-10 text-center">
        {[
          { label: "Days", value: timeLeft.days },
          { label: "Hours", value: timeLeft.hours },
          { label: "Minutes", value: timeLeft.minutes },
          { label: "Seconds", value: timeLeft.seconds },
        ].map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center"
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-6 py-4 text-3xl md:text-4xl font-bold shadow-xl">
              {String(item.value).padStart(2, "0")}
            </div>
            <span className="mt-2 text-sm uppercase tracking-widest text-neutral-400">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 2 }}
        className="absolute text-[200px] font-black select-none pointer-events-none"
      >
        SALE
      </motion.div>
    </section>
  );
}