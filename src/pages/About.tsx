import { useEffect, useRef } from 'react';
import { Heart, Scissors, Sparkles, BookOpen, Users } from 'lucide-react';
import SEO from '../components/SEO';

// Hook for intersection observer scroll animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

// Animated section wrapper
function AnimatedSection({
  children,
  animation = 'animate-fade-in-up',
  delay = '',
  className = '',
}: {
  children: React.ReactNode;
  animation?: string;
  delay?: string;
  className?: string;
}) {
  const ref = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`animate-on-scroll ${animation} ${delay} ${className}`}
    >
      {children}
    </div>
  );
}

// Decorative divider
function Divider() {
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-pink-400" />
      <Sparkles className="w-4 h-4 text-pink-400" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-pink-400" />
    </div>
  );
}

export default function About() {
  return (
    <>
      <SEO
        title="About NAVADHA - Our Story, Vision & Craftsmanship"
        description="Learn about NAVADHA Fashion Co — born from a mother's devotion and a daughter's vision. Discover our story, our commitment to quality craftsmanship, and our passion for contemporary Indian fashion."
        keywords="about NAVADHA fashion, NAVADHA story, Indian fashion brand, Aanchal Mishra designer, boutique fashion India, handcrafted clothing, sustainable fashion India"
        url="https://navadha.com/about"
      />
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden bg-white dark:bg-gray-900 pt-24 pb-16 sm:pt-32 sm:pb-20 min-h-[85vh]">

        {/* Soft radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(238,69,143,0.07) 0%, transparent 70%)' }}
        />

        {/* Pulsing rings — hidden on very small screens to avoid overflow */}
        <div
          className="hero-pulse-ring absolute rounded-full pointer-events-none hidden xs:block"
          style={{ width: 'min(380px, 80vw)', height: 'min(380px, 80vw)', border: '1px solid rgba(238,69,143,0.18)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
        <div
          className="hero-pulse-ring absolute rounded-full pointer-events-none hidden xs:block"
          style={{ width: 'min(250px, 60vw)', height: 'min(250px, 60vw)', border: '1px solid rgba(238,69,143,0.12)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animationDelay: '1s' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-3xl mx-auto px-2">

          {/* Eyebrow */}
          <p
            className="hero-fade-up text-[10px] sm:text-[11px] md:text-xs tracking-[0.25em] sm:tracking-[0.45em] uppercase text-pink-400 font-light mb-5 sm:mb-8 leading-relaxed"
            style={{ animationDelay: '0.1s' }}
          >
            From a mother's devotion to a daughter's vision
          </p>

          {/* Brand name + FASHION CO — grouped so lines align with title width */}
          <div className="relative inline-block w-full text-center">
            <h1
              className="hero-letter-spacing brand-title leading-none w-full text-center whitespace-nowrap"
              style={{
                color: '#EE458F',
                animationDelay: '0.3s',
                fontSize: 'clamp(2.5rem, 10vw, 8rem)',
                letterSpacing: '0.05em',
              }}
            >
              NAVADHA
            </h1>

            {/* Divider lines + FASHION CO — stretches to match title */}
            <div
              className="hero-fade-up flex items-center justify-center gap-2 sm:gap-4 mt-2 sm:mt-3 w-full"
              style={{ animationDelay: '0.7s' }}
            >
              <div className="h-px flex-1 bg-pink-300/60" />
              <span className="text-[8px] sm:text-[10px] font-light tracking-[0.35em] sm:tracking-[0.5em] text-pink-400/80 uppercase whitespace-nowrap">Fashion Co</span>
              <div className="h-px flex-1 bg-pink-300/60" />
            </div>
          </div>

          {/* Quote */}
          <p
            className="hero-fade-up mt-6 sm:mt-10 text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-light italic max-w-[280px] sm:max-w-md mx-auto leading-relaxed"
            style={{ animationDelay: '0.95s' }}
          >
            "Where devotion, craftsmanship, and the strength of women come together."
          </p>

          {/* Scroll indicator — centred below content */}
          <div className="hero-fade-up mt-12 sm:mt-16 flex flex-col items-center gap-2 z-20" style={{ animationDelay: '1.3s' }}>
            <span className="text-[9px] tracking-[0.5em] uppercase text-gray-300 dark:text-gray-600 font-light">Scroll</span>
            <div className="relative w-px h-7 sm:h-8 overflow-hidden">
              <div className="scroll-dot absolute inset-x-0 top-0 h-full bg-gradient-to-b from-pink-400 to-transparent" />
            </div>
          </div>

        </div>

      </section>

      {/* ── ORIGINS ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">

          <AnimatedSection animation="animate-fade-in-left">
            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl blur-2xl opacity-20 pointer-events-none" style={{ background: 'linear-gradient(135deg, #EE458F, #a855f7)' }} />
              <img
                src="/1.png"
                alt="Elegant Indian dresses and garments"
                className="relative rounded-2xl shadow-2xl w-full h-56 sm:h-72 lg:h-96 object-cover object-center"
              />
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-2 sm:-bottom-5 sm:-right-5 bg-white dark:bg-gray-800 rounded-xl shadow-xl px-4 py-2.5 sm:px-5 sm:py-3 flex items-center gap-2">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 fill-pink-500" />
                <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white">Est. 2026</span>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="animate-fade-in-right" className="space-y-4 sm:space-y-5 mt-6 lg:mt-0">
            <p className="text-xs tracking-[0.35em] uppercase text-pink-500 font-light">Our Origins</p>
            <h2 className="brand-title text-2xl sm:text-3xl lg:text-4xl text-gray-900 dark:text-white leading-tight">
              A Sewing Machine &amp; an Unwavering Spirit
            </h2>
            <Divider />
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              NAVADHA began with a woman, a sewing machine, and an unwavering spirit. In a modest home, my mother worked as a ladies' tailor, stitching garments for women in our community. What began as a necessity during financially difficult times slowly became something remarkable.
            </p>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Her designs were admired for their elegance, fit, and thoughtful detail — earning her a loyal circle of customers who trusted her craft. Behind every garment was a story of quiet resilience.
            </p>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              NAVADHA was born from the belief that talent like hers deserves recognition far beyond the walls of a home workshop. It is a tribute to women who create, persevere, and rise — even when the world expects them to remain unseen.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── FOUNDER'S VISION ── */}
      <section className="py-14 sm:py-20 lg:py-24 bg-pink-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="animate-fade-in-up" className="text-center mb-10 sm:mb-14">
            <p className="text-xs tracking-[0.35em] uppercase text-pink-500 font-light mb-3">The Founder</p>
            <h2 className="brand-title text-2xl sm:text-3xl lg:text-4xl text-gray-900 dark:text-white">
              A Daughter's Promise
            </h2>
            <Divider />
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <AnimatedSection animation="animate-fade-in-left" className="space-y-4 sm:space-y-5">
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                My childhood was surrounded by fabrics, sketches, and the constant rhythm of a sewing machine. For every festival and special occasion, my mother designed my outfits herself. Each garment carried imagination, care, and creativity.
              </p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                Through her work, I learned that clothing is more than something we wear — it is a reflection of identity and confidence. Yet I also witnessed something deeper: a woman working tirelessly to support her family in a world where women are often expected to do more while being seen less.
              </p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                Watching her shaped my vision. I wanted the world to see what I saw every day — a woman whose artistry deserved recognition. NAVADHA was created to transform that belief into reality.
              </p>
              <div className="pt-2">
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  — Aanchal Mishra
                </p>
                <p className="text-xs sm:text-sm text-pink-500 tracking-widest uppercase">Founder &amp; Creative Director</p>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="animate-fade-in-right" className="mt-6 lg:mt-0">
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl blur-2xl opacity-15 pointer-events-none" style={{ background: '#EE458F' }} />
                <img
                  src="/2.png"
                  alt="Fashion designer working with fabric"
                  className="relative rounded-2xl shadow-2xl w-full h-56 sm:h-72 lg:h-96 object-cover object-center"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── THREE PILLARS ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <AnimatedSection animation="animate-fade-in-up" className="text-center mb-10 sm:mb-14">
          <p className="text-xs tracking-[0.35em] uppercase text-pink-500 font-light mb-3">What We Stand For</p>
          <h2 className="brand-title text-2xl sm:text-3xl lg:text-4xl text-gray-900 dark:text-white">Our Philosophy</h2>
          <Divider />
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {[
            {
              icon: <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#EE458F' }} />,
              title: 'Elegance',
              body: 'Every piece is designed with intention — a balance between refined aesthetics and meaningful craftsmanship that speaks without words.',
              delay: '',
            },
            {
              icon: <Scissors className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#EE458F' }} />,
              title: 'Craftsmanship',
              body: 'From selecting fabrics to perfecting the final stitch, our process reflects an uncompromising commitment to quality and devotion.',
              delay: '[animation-delay:150ms]',
            },
            {
              icon: <Users className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#EE458F' }} />,
              title: "Women's Strength",
              body: 'NAVADHA is proudly shaped by the spirit of women — women who create, lead, and inspire. True luxury is the story woven into every garment.',
              delay: '[animation-delay:300ms]',
            },
          ].map(({ icon, title, body, delay }) => (
            <AnimatedSection key={title} animation="animate-fade-in-up" delay={delay}>
              <div className="group h-full bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-7 shadow-sm border border-pink-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5" style={{ background: '#fdf2f8' }}>
                  {icon}
                </div>
                <h3 className="brand-title text-lg sm:text-xl text-gray-900 dark:text-white mb-2 sm:mb-3">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{body}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── NAME MEANING ── */}
      <section className="py-14 sm:py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full blur-3xl opacity-10" style={{ background: '#EE458F' }} />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <AnimatedSection animation="animate-scale-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
              <p className="text-xs tracking-[0.35em] uppercase text-pink-500 font-light">The Name</p>
            </div>
            <h2 className="brand-title text-2xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-6">
              A Name Rooted in Devotion
            </h2>
            <Divider />
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
              NAVADHA is inspired by <span className="font-semibold text-pink-600 dark:text-pink-400">Navadha Bhakti</span> — the nine forms of devotion described by Lord Rama to the devotee Shabari in the Ramayana. In this moment of profound spiritual wisdom, Lord Rama explains the nine ways through which a devotee expresses true devotion to the divine.
            </p>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
              My mother is deeply spiritual, and it was she who first came across this word while reading the Ramayana. She felt emotionally connected to the moment when Lord Rama explains the nine forms of devotion. When we were searching for a name, she suggested NAVADHA — a word that reflects both faith and dedication.
            </p>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Just as devotion requires sincerity and perseverance, our brand is built on devotion to craft, devotion to purpose, and devotion to the journey that brought this brand to life.
            </p>

            {/* Nine forms visual — 3 cols on mobile, 9 on sm+ */}
            <div className="mt-10 grid grid-cols-3 sm:grid-cols-9 gap-y-5 gap-x-3 sm:gap-3">
              {['श्रवण', 'कीर्तन', 'स्मरण', 'पाद-सेवन', 'अर्चन', 'वंदन', 'दास्य', 'सख्य', 'आत्म-निवेदन'].map((form, i) => (
                <AnimatedSection key={form} animation="animate-scale-in" delay={`[animation-delay:${i * 60}ms]`}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#EE458F' }}>
                      {i + 1}
                    </div>
                    <span className="text-[11px] sm:text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight">{form}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── WOMEN OF NAVADHA ── */}
      <section className="py-14 sm:py-20 lg:py-24 bg-pink-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="animate-fade-in-up" className="text-center mb-10 sm:mb-14">
            <p className="text-xs tracking-[0.35em] uppercase text-pink-500 font-light mb-3">Our Heart</p>
            <h2 className="brand-title text-2xl sm:text-3xl lg:text-4xl text-gray-900 dark:text-white">
              Strength Woven Into Every Thread
            </h2>
            <Divider />
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <AnimatedSection animation="animate-fade-in-left">
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl blur-2xl opacity-15 pointer-events-none" style={{ background: '#a855f7' }} />
                <img
                  src="/3.png"
                  alt="Beautiful ethnic wear collection"
                  className="relative rounded-2xl shadow-2xl w-full h-56 sm:h-72 lg:h-96 object-cover object-top"
                />
              </div>
            </AnimatedSection>

            <AnimatedSection animation="animate-fade-in-right" className="space-y-4 sm:space-y-5 mt-6 lg:mt-0">
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                NAVADHA is, at its heart, a story about women. It began with a woman whose talent transformed fabric into garments that made others feel beautiful — working quietly from home, creating pieces with patience and devotion while balancing the many responsibilities placed upon her.
              </p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                Her story is not unique. Across homes, communities, and generations, countless women carry extraordinary talent that often remains unseen or underestimated. They create, nurture, build, and persevere — even when recognition is scarce.
              </p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                NAVADHA exists to honor that spirit. Every garment represents the creativity, resilience, and strength that women bring into the world every day.
              </p>
              <blockquote className="border-l-4 pl-4 sm:pl-5 italic text-sm sm:text-base text-gray-600 dark:text-gray-400" style={{ borderColor: '#EE458F' }}>
                "When women create, they do more than make garments. They create stories, possibilities, and change."
              </blockquote>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── SIGNATURE LINE ── */}
      <section className="py-16 sm:py-20 lg:py-28 text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ background: 'radial-gradient(ellipse at center, #EE458F 0%, transparent 70%)' }} />
        </div>
        <AnimatedSection animation="animate-scale-in" className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #EE458F)' }} />
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 fill-pink-400 flex-shrink-0" />
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #EE458F)' }} />
          </div>
          <h2 className="brand-title text-xl sm:text-2xl lg:text-4xl text-gray-900 dark:text-white leading-relaxed">
            NAVADHA — where devotion, craftsmanship, and the strength of women come together.
          </h2>
          <div className="flex items-center justify-center gap-4 mt-6 sm:mt-8">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #EE458F)' }} />
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 fill-pink-400 flex-shrink-0" />
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #EE458F)' }} />
          </div>
        </AnimatedSection>
      </section>

    </div>
    </>
  );
}
