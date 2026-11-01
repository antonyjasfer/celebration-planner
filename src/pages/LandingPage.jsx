import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Wallet, Calendar, Users,
  Lightbulb, MessageCircle, RefreshCw, PartyPopper,
  Heart, Music, Star
} from 'lucide-react';
import { loadEvents } from '../services/eventStore';
import './LandingPage.css';

/**
 * Landing page — the first thing users see.
 * Showcases CelebriPlan's features and drives users to create their first event.
 */
export default function LandingPage() {
  const existingEvents = loadEvents();

  const features = [
    {
      icon: Wallet,
      title: 'Smart Budget Planner',
      description: 'AI analyzes your budget and creates a personalized allocation with tradeoff insights.',
      color: '#7c3aed',
    },
    {
      icon: Calendar,
      title: 'Timeline Generator',
      description: 'Get a structured task timeline with dependencies, deadlines, and milestone tracking.',
      color: '#06b6d4',
    },
    {
      icon: Users,
      title: 'Vendor Coordinator',
      description: 'Compare vendors, prepare questions, and organize quotations against your budget.',
      color: '#f59e0b',
    },
    {
      icon: Lightbulb,
      title: 'Personalized Ideas',
      description: 'Get theme, food, and decoration ideas tailored to your preferences and culture.',
      color: '#10b981',
    },
    {
      icon: RefreshCw,
      title: 'Adaptive Replanning',
      description: 'Budget changed? Guest count shifted? Your AI plan adapts in real-time.',
      color: '#ef4444',
    },
    {
      icon: MessageCircle,
      title: 'AI Planning Chat',
      description: 'Have a conversation with your AI planning assistant for any planning question.',
      color: '#3b82f6',
    },
  ];

  const eventTypes = [
    { icon: Heart, label: 'Weddings', desc: 'Sangeet, mehendi, reception & more' },
    { icon: PartyPopper, label: 'Birthdays', desc: 'Kids, milestone, surprise parties' },
    { icon: Music, label: 'Community Events', desc: 'Cultural, religious, social gatherings' },
    { icon: Star, label: 'Any Celebration', desc: 'Anniversaries, baby showers & more' },
  ];

  return (
    <div className="landing" id="landing-page">
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" aria-hidden="true" />
          <div className="orb orb-2" aria-hidden="true" />
          <div className="orb orb-3" aria-hidden="true" />
        </div>

        <div className="hero-content container">
          <div className="hero-badge animate-fade-in">
            <Sparkles size={14} aria-hidden="true" />
            <span>Powered by Google Gemini AI</span>
          </div>

          <h1 id="hero-title" className="hero-title animate-fade-in-up">
            Plan Your Perfect<br />
            <span className="gradient-text">Celebration</span>
          </h1>

          <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            From weddings to birthdays to community events — CelebriPlan helps you
            manage budgets, timelines, vendors, and ideas with the power of AI.
          </p>

          <div className="hero-actions animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/new" className="btn-primary btn-lg" id="btn-start-planning">
              <Sparkles size={18} aria-hidden="true" />
              Start Planning
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            {existingEvents.length > 0 && (
              <Link to="/dashboard" className="btn-secondary btn-lg" id="btn-continue-planning">
                Continue Planning
              </Link>
            )}
          </div>

          <div className="hero-event-types animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
            {eventTypes.map(et => (
              <div key={et.label} className="event-type-chip">
                <et.icon size={16} aria-hidden="true" />
                <div>
                  <span className="chip-label">{et.label}</span>
                  <span className="chip-desc">{et.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section container" aria-labelledby="features-title" id="features">
        <div className="section-header">
          <h2 id="features-title" className="section-title">
            Everything You Need to<br />
            <span className="gradient-text">Plan With Confidence</span>
          </h2>
          <p className="section-subtitle">
            CelebriPlan doesn't just give you ideas — it helps you actually make your event happen.
          </p>
        </div>

        <div className="features-grid stagger-children">
          {features.map(feature => (
            <article key={feature.title} className="feature-card glass-card">
              <div className="feature-icon" style={{ '--feature-color': feature.color }}>
                <feature.icon size={22} aria-hidden="true" />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section container" aria-labelledby="how-title">
        <div className="section-header">
          <h2 id="how-title" className="section-title">
            How It <span className="gradient-text">Works</span>
          </h2>
        </div>

        <div className="steps-track stagger-children">
          <div className="step-card glass-card">
            <div className="step-number-badge">1</div>
            <h3>Tell Us About Your Event</h3>
            <p>Share your event type, budget, guest count, date, and what matters most to you.</p>
          </div>
          <div className="step-connector" aria-hidden="true" />
          <div className="step-card glass-card">
            <div className="step-number-badge">2</div>
            <h3>AI Creates Your Plan</h3>
            <p>Get a personalized budget breakdown, timeline, vendor checklist, and creative ideas.</p>
          </div>
          <div className="step-connector" aria-hidden="true" />
          <div className="step-card glass-card">
            <div className="step-number-badge">3</div>
            <h3>Refine & Execute</h3>
            <p>Track progress, handle changes, compare vendors, and chat with your AI assistant.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="cta-content container">
          <h2 id="cta-title" className="cta-title">
            Ready to Plan Your<br />
            <span className="gradient-text">Dream Celebration?</span>
          </h2>
          <p className="cta-subtitle">
            Start with your budget, guest count, and date. Let AI handle the rest.
          </p>
          <Link to="/new" className="btn-primary btn-lg" id="btn-cta-start">
            <Sparkles size={18} aria-hidden="true" />
            Get Started Free
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" role="contentinfo" id="footer">
        <div className="container">
          <p>
            Built with <Heart size={14} className="footer-heart" aria-hidden="true" /> using
            Google Gemini AI for Prompt Wars Virtual Challenge 5
          </p>
        </div>
      </footer>
    </div>
  );
}
