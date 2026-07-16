import { useEffect, useRef } from 'react';
import {
  Truck,
  Layers,
  Route,
  GraduationCap,
  Headphones,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { motion, MotionConfig, useInView, useSpring, useTransform } from 'framer-motion';
import {
  aboutHighlights,
  aboutStats,
  aboutStory,
  aboutValues,
  type AboutHighlight,
  type AboutStat,
  type AboutValue,
} from '../../data/content';

const icons: Record<AboutHighlight['icon'], React.ReactNode> = {
  truck: <Truck className="w-6 h-6" />,
  layers: <Layers className="w-6 h-6" />,
  route: <Route className="w-6 h-6" />,
  graduationCap: <GraduationCap className="w-6 h-6" />,
  headphones: <Headphones className="w-6 h-6" />,
  shieldCheck: <ShieldCheck className="w-6 h-6" />,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });

  const left = aboutHighlights.slice(0, 3);
  const right = aboutHighlights.slice(3, 6);

  return (
    <section ref={sectionRef} className="about-section">
      <div className="wrap about-wrap">
        <MotionConfig reducedMotion="user">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={containerVariants}
        >
          <motion.div className="about-head" variants={itemVariants}>
            <span className="eyebrow" style={{ justifyContent: 'center' }}>
              <Zap className="w-4 h-4" /> About ASF Cargo
            </span>
            <h2>Moving freight across the East Coast and Midwest.</h2>
            {aboutStory.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </motion.div>

          <motion.div className="about-values" variants={itemVariants}>
            {aboutValues.map((value) => (
              <ValueCard key={value.title} value={value} />
            ))}
          </motion.div>

          <div className="about-grid">
            <div className="about-col">
              {left.map((item, i) => (
                <HighlightItem key={item.title} item={item} delay={i * 0.15} direction="left" />
              ))}
            </div>

            <motion.div className="about-image-wrap" variants={itemVariants}>
              <motion.div
                className="about-image"
                whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
              >
                <img src="/truck.png" alt="ASF Cargo truck" loading="lazy" />
              </motion.div>
            </motion.div>

            <div className="about-col">
              {right.map((item, i) => (
                <HighlightItem key={item.title} item={item} delay={i * 0.15} direction="right" />
              ))}
            </div>
          </div>

          <motion.div ref={statsRef} className="about-stats" variants={containerVariants} initial="hidden" animate={isStatsInView ? 'visible' : 'hidden'}>
            {aboutStats.map((stat, i) => (
              <StatCounter key={stat.label} stat={stat} delay={i * 0.1} />
            ))}
          </motion.div>
        </motion.div>
        </MotionConfig>
      </div>
    </section>
  );
}

function HighlightItem({
  item,
  delay,
  direction,
}: {
  item: AboutHighlight;
  delay: number;
  direction: 'left' | 'right';
}) {
  return (
    <motion.div
      className="about-highlight"
      variants={itemVariants}
      transition={{ delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="about-highlight-head"
        initial={{ x: direction === 'left' ? -16 : 16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.15 }}
      >
        <span className="about-highlight-icon">{icons[item.icon]}</span>
        <h3>{item.title}</h3>
      </motion.div>
      <p>{item.description}</p>
    </motion.div>
  );
}

function ValueCard({ value }: { value: AboutValue }) {
  return (
    <motion.div
      className="about-value"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <h3>{value.title}</h3>
      <p>{value.description}</p>
    </motion.div>
  );
}

function StatCounter({ stat, delay }: { stat: AboutStat; delay: number }) {
  const countRef = useRef(null);
  const isInView = useInView(countRef, { once: true });
  const decimals = stat.decimals ?? 0;
  const springValue = useSpring(0, { stiffness: 60, damping: 14 });

  useEffect(() => {
    if (isInView) {
      springValue.set(stat.value);
    }
  }, [isInView, stat.value, springValue]);

  const displayValue = useTransform(springValue, (latest) => latest.toFixed(decimals));

  return (
    <motion.div
      className="about-stat"
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } } }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div ref={countRef} className="about-stat-value">
        {stat.prefix}
        <motion.span>{displayValue}</motion.span>
        {stat.suffix}
      </div>
      <p>{stat.label}</p>
    </motion.div>
  );
}
