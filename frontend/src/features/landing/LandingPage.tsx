import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { schemesApi } from '@/api/schemes'
import { SCHEME_CATEGORIES, CATEGORY_ICONS } from '@/lib/enums'

const ROADMAP_STEPS = [
  {
    num: '01',
    title: 'Describe Your Need',
    desc: 'Tell the system what you need in plain language — no forms, no jargon. Just say what you\'re looking for.',
    icon: '✍️',
  },
  {
    num: '02',
    title: 'AI Intent Extraction',
    desc: 'Our AI parses your need, identifies key attributes like category, income range, age, and state to find the best matches.',
    icon: '🧠',
  },
  {
    num: '03',
    title: 'Scheme Discovery',
    desc: 'Matched government schemes are ranked by relevance and eligibility score, filtered by your profile.',
    icon: '🔍',
  },
  {
    num: '04',
    title: 'Document Upload',
    desc: 'Upload Aadhaar, income certificate, and other documents. Our OCR engine extracts data automatically.',
    icon: '📄',
  },
  {
    num: '05',
    title: 'Eligibility Check',
    desc: 'Extracted data is fused and evaluated against scheme criteria — state, age, income, occupation, and more.',
    icon: '✅',
  },
  {
    num: '06',
    title: 'Application Guidance',
    desc: 'Get a step-by-step guide to apply, with direct links to the official application portal.',
    icon: '🗺️',
  },
]

const FAQ_ITEMS = [
  {
    q: 'What documents do I need to upload?',
    a: 'Typically an Aadhaar card plus a scheme-specific document like an income certificate, caste certificate, or student ID. The platform tells you exactly which documents are required after you select a scheme.',
  },
  {
    q: 'Is my data safe?',
    a: 'Document data is processed in-memory for eligibility checks and is not stored beyond your current session without consent. We follow standard security practices for all uploaded files.',
  },
  {
    q: 'What happens if I am declared ineligible?',
    a: 'The platform explains each criterion that was not met and may suggest alternative schemes that match your profile better.',
  },
  {
    q: 'Does this platform submit applications on my behalf?',
    a: 'No — we guide you to the official government application portal. You submit on the official site. We clearly mark when you are leaving this platform.',
  },
]

function RoadmapStep({ step, index }: { step: typeof ROADMAP_STEPS[0]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`flex gap-6 md:gap-10 items-start ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse md:text-right'}`}
    >
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--primary)] flex items-center justify-center text-2xl shadow-lg">
          {step.icon}
        </div>
        {index < ROADMAP_STEPS.length - 1 && (
          <div className="w-0.5 h-12 bg-[var(--accent)] mt-2 opacity-40" />
        )}
      </div>
      <div className="pb-8 md:pb-0">
        <div className="text-xs font-mono text-[var(--accent)] font-medium mb-1">{step.num}</div>
        <h3 className="font-display text-xl font-semibold text-[var(--primary)] mb-2">{step.title}</h3>
        <p className="text-[var(--muted-foreground)] leading-relaxed max-w-sm">{step.desc}</p>
      </div>
    </motion.div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border-b border-[var(--border)]">
      <button
        className="w-full flex justify-between items-center py-4 text-left font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {q}
        <svg
          className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <p className="pb-4 text-sm text-[var(--muted-foreground)] leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { data: schemes } = useQuery({
    queryKey: ['schemes'],
    queryFn: schemesApi.list,
  })

  const categoryCounts = SCHEME_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = schemes?.filter((s) => s.category === cat).length ?? 0
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0E1630] via-[#1E2A5A] to-[#2a3a7a] min-h-[88vh] flex items-center">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at center, #fff 1px, transparent 1.2px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[var(--accent)]/15 border border-[var(--accent)]/30 rounded-full px-3 py-1 mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[var(--accent)] text-xs font-medium">AI-Powered · Digital India</span>
            </div>
            <h1 className="font-display text-5xl lg:text-6xl text-white leading-tight mb-5">
              Describe your need.<br />
              <span className="text-[var(--accent)]">Discover your rights.</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-xl">
              Tell us what you need in plain language — we'll match you to real government welfare schemes, check your eligibility, and guide you through the application.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-[var(--accent)] text-[var(--primary)] hover:bg-[#e09830] font-semibold"
                onClick={() => navigate('/dashboard')}
              >
                Find My Schemes →
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 border border-white/20"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                How It Works
              </Button>
            </div>
            <div className="mt-10 flex gap-8">
              {[
                { label: 'Schemes Available', value: schemes ? `${schemes.length}+` : '—' },
                { label: 'AI-Powered', value: '100%' },
                { label: 'States Covered', value: '36+' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-[var(--accent)]/10 rounded-2xl blur-2xl" />
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                {/* Mock workflow card preview */}
                <div className="text-white/50 text-xs font-mono uppercase tracking-wider">Live workflow</div>
                <div className="bg-white/8 rounded-xl p-4 border border-white/10">
                  <div className="text-white/40 text-xs mb-2">Your need</div>
                  <div className="text-white font-medium text-sm">
                    "I need financial help for my daughter's education after class 10"
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['Education', 'Scholarship', 'Class 10+', 'Income-based'].map((tag) => (
                    <span key={tag} className="bg-[var(--accent)]/20 text-[var(--accent)] text-xs px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="space-y-2">
                  {['National Scholarship Scheme', 'PM YASASVI Scheme', 'Minority Scholarship'].map((s, i) => (
                    <div key={s} className={`flex items-center gap-3 rounded-lg p-3 ${i === 0 ? 'bg-[var(--accent)]/15 border border-[var(--accent)]/30' : 'bg-white/5'}`}>
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-[var(--accent)]' : 'bg-white/20'}`} />
                      <span className={`text-sm ${i === 0 ? 'text-white font-medium' : 'text-white/50'}`}>{s}</span>
                      {i === 0 && <span className="ml-auto text-xs text-[var(--accent)]">Best Match</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category cards */}
      <section className="py-20 bg-[var(--background)]" id="categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-[var(--primary)] mb-3">Browse by Category</h2>
            <p className="text-[var(--muted-foreground)]">Thousands of government schemes across every aspect of life</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {SCHEME_CATEGORIES.map((cat) => (
              <Card
                key={cat}
                hoverable
                className="p-5 text-center"
                onClick={() => navigate(`/schemes?category=${encodeURIComponent(cat)}`)}
              >
                <div className="text-3xl mb-3">{CATEGORY_ICONS[cat]}</div>
                <div className="font-semibold text-[var(--primary)] text-sm mb-1">{cat}</div>
                {schemes && (
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {categoryCounts[cat]} scheme{categoryCounts[cat] !== 1 ? 's' : ''}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — scroll roadmap */}
      <section
        id="how-it-works"
        className="py-20 bg-gradient-to-b from-[var(--secondary)] to-[var(--background)]"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl text-[var(--primary)] mb-3">How It Works</h2>
            <p className="text-[var(--muted-foreground)]">From a sentence to a submitted application — six steps</p>
          </div>
          <div className="space-y-6">
            {ROADMAP_STEPS.map((step, i) => (
              <RoadmapStep key={step.num} step={step} index={i} />
            ))}
          </div>
          <div className="text-center mt-14">
            <Button
              size="lg"
              className="bg-[var(--primary)] text-white"
              onClick={() => navigate('/dashboard')}
            >
              Start Your Journey →
            </Button>
          </div>
        </div>
      </section>

      {/* Technology section */}
      <section id="technology" className="py-20 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl text-[var(--primary)] mb-3">The Technology</h2>
            <p className="text-[var(--muted-foreground)] max-w-xl mx-auto">
              Built on production-grade AI and document intelligence — no guesswork, no hallucination, real government data.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'AI Intent Extraction',
                icon: '🧠',
                desc: 'Natural language understanding identifies your need category, state, income level, and eligibility signals from a single sentence.',
              },
              {
                title: 'OCR Document Intelligence',
                icon: '📄',
                desc: 'Upload Aadhaar, income certificates, or caste documents. Our pipeline extracts structured data and detects conflicts between sources.',
              },
              {
                title: 'Eligibility Scoring Engine',
                icon: '⚖️',
                desc: 'Evaluates each eligibility criterion (state, age, gender, income, occupation) independently and surfaces exactly what is missing.',
              },
            ].map((item) => (
              <Card key={item.title} className="p-6">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-display text-xl text-[var(--primary)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-[var(--secondary)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-[var(--primary)] mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] p-6 border border-[var(--border)] shadow-sm">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-[var(--primary)] py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="font-display text-4xl text-white mb-4">Ready to find your schemes?</h2>
          <p className="text-white/60 mb-8">Takes less than two minutes. No account required.</p>
          <Button
            size="lg"
            className="bg-[var(--accent)] text-[var(--primary)] font-semibold hover:bg-[#e09830]"
            onClick={() => navigate('/dashboard')}
          >
            Describe Your Need →
          </Button>
        </div>
      </section>
    </div>
  )
}
