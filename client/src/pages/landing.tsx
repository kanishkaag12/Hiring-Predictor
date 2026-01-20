import { useEffect, useRef } from 'react';
import { useLocation } from "wouter";
import './landing.css';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const heroRef = useRef<HTMLElement>(null);
  const pulseLinesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Type insight text with dramatic reveal
    setTimeout(() => {
      const insight1 = document.getElementById('insight-text-1');
      if (insight1) typeWriter(insight1, "You're not getting rejected.", 30);
      document.getElementById('insight1')?.classList.add('active');
    }, 800);

    setTimeout(() => {
      const insight2 = document.getElementById('insight-text-2');
      if (insight2) typeWriter(insight2, "You're applying blind.", 30);
      document.getElementById('insight2')?.classList.add('active');
    }, 2000);

    // Transition to headline
    setTimeout(() => {
      const headline = document.getElementById('headline-text');
      if (headline) typeWriter(headline, "HirePulse shows your shortlisting chances before you apply.", 20);
    }, 3500);

    // Animate dashboard panels
    setTimeout(() => {
      animateDashboardPanels();
    }, 2500);

    // Animate data signals
    setTimeout(() => {
      animateSignals();
    }, 4000);

    // Animate floating data points
    setTimeout(() => {
      animateFloatingData();
    }, 4500);

    // Scroll animations
    const cleanupScroll = setupScrollAnimations();

    // Progressive disclosure on scroll
    setupProgressiveDisclosure();

    // Parallax effect
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      if (heroRef.current && scrolled < window.innerHeight) {
        heroRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;

      const rect = heroRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

      if (pulseLinesRef.current) {
        pulseLinesRef.current.style.background = `
            radial-gradient(circle at ${mouseX}% ${mouseY}%, rgba(0, 255, 136, 0.2) 0%, transparent 50%),
            radial-gradient(circle at ${100 - mouseX}% ${100 - mouseY}%, rgba(0, 212, 255, 0.2) 0%, transparent 50%)
        `;
      }

      // Mouse interaction with data points
      const dataPoints = document.querySelectorAll('.data-point');
      dataPoints.forEach((point) => {
        const pointElement = point as HTMLElement;
        const pointRect = pointElement.getBoundingClientRect();
        const x = e.clientX - pointRect.left - pointRect.width / 2;
        const y = e.clientY - pointRect.top - pointRect.height / 2;
        const distance = Math.sqrt(x * x + y * y);

        if (distance < 100) {
          const scale = 1 + (100 - distance) / 200;
          pointElement.style.transform = `scale(${scale})`;
          pointElement.style.zIndex = '10';
        } else {
          pointElement.style.transform = 'scale(1)';
          pointElement.style.zIndex = '1'; // Note: inline styles might be overridden by CSS hover states if not careful, but this matches original JS logic
        }
      });
    };
    document.addEventListener('mousemove', handleMouseMove);

    // Real-time data pulse effect
    const pulseInterval = setInterval(() => {
      const signals = document.querySelectorAll('.signal');
      signals.forEach((signal) => {
        const signalEl = signal as HTMLElement;
        signalEl.style.transform = 'scale(1.02)';
        setTimeout(() => {
          signalEl.style.transform = 'scale(1)';
        }, 200);
      });
    }, 8000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(pulseInterval);
      cleanupScroll();
    };
  }, []);

  const revealChances = () => {
    document.getElementById('how-it-works')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const scrollToHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleLogin = () => {
    setLocation("/dashboard");
  };

  const handleSignup = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="landing-page">
      {/* Header Navigation */}
      <header className="main-header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-text">HirePulse</span>
          </div>
          <nav className="header-nav">
            <button className="btn-login" onClick={handleLogin}>Login</button>
            <button className="btn-signup" onClick={handleSignup}>Sign Up</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" id="hero" ref={heroRef}>
        <div className="hero-background">
          <div className="data-grid"></div>
          <div className="pulse-lines" ref={pulseLinesRef}></div>
          <div className="scan-beams"></div>
          <div className="data-streams"></div>
        </div>

        {/* Live Data Dashboard Overlay */}
        <div className="dashboard-overlay">
          <div className="dashboard-panel top-left">
            <div className="panel-label">[LIVE ANALYSIS]</div>
            <div className="panel-value" data-value="2847">0</div>
            <div className="panel-desc">Jobs Analyzed Today</div>
          </div>
          <div className="dashboard-panel top-right">
            <div className="panel-label">[SUCCESS RATE]</div>
            <div className="panel-value" data-value="73">0</div>
            <div className="panel-desc">Avg. Shortlist Probability</div>
          </div>
        </div>

        <div className="hero-content">
          <div className="insight-container">
            <div className="insight-line" id="insight1">
              <span className="insight-prefix">[SYSTEM INSIGHT]</span>
              <span className="insight-text" id="insight-text-1"></span>
            </div>
            <div className="insight-line" id="insight2">
              <span className="insight-text" id="insight-text-2"></span>
            </div>
          </div>

          <div className="hero-headline" id="headline">
            <h1 id="headline-text"></h1>
          </div>

          <div className="hero-cta" id="cta">
            <button className="cta-primary" onClick={revealChances}>Reveal My Chances</button>
            <button className="cta-secondary" onClick={scrollToHow}>See How This Works</button>
          </div>
        </div>

        {/* Animated Data Signals - Enhanced */}
        <div className="data-signals">
          <div className="signal signal-1">
            <div className="signal-header">
              <div className="signal-label">Match Score</div>
              <div className="signal-status">LIVE</div>
            </div>
            <div className="signal-value" data-target="87">0</div>
            <div className="signal-bar">
              <div className="signal-fill" data-width="87"></div>
            </div>
            <div className="signal-indicator">
              <span className="indicator-dot"></span>
              <span className="indicator-text">High Match</span>
            </div>
          </div>
          <div className="signal signal-2">
            <div className="signal-header">
              <div className="signal-label">Competition Level</div>
              <div className="signal-status">LIVE</div>
            </div>
            <div className="signal-value" data-target="234">0</div>
            <div className="signal-bar">
              <div className="signal-fill" data-width="65"></div>
            </div>
            <div className="signal-indicator">
              <span className="indicator-dot"></span>
              <span className="indicator-text">Moderate</span>
            </div>
          </div>
          <div className="signal signal-3">
            <div className="signal-header">
              <div className="signal-label">Shortlist Probability</div>
              <div className="signal-status">LIVE</div>
            </div>
            <div className="signal-value" data-target="73">0</div>
            <div className="signal-bar">
              <div className="signal-fill" data-width="73"></div>
            </div>
            <div className="signal-indicator">
              <span className="indicator-dot"></span>
              <span className="indicator-text">Likely</span>
            </div>
          </div>
        </div>

        {/* Floating Data Points - Enhanced */}
        <div className="floating-data">
          <div className="data-point pulse-1" style={{ top: '20%', left: '8%' }}>
            <div className="point-value" data-target="92">0</div>
            <div className="point-label">Match</div>
          </div>
          <div className="data-point pulse-2" style={{ top: '30%', right: '8%' }}>
            <div className="point-value" data-target="1247">0</div>
            <div className="point-label">Apps</div>
          </div>
          <div className="data-point pulse-3" style={{ bottom: '25%', left: '15%' }}>
            <div className="point-value" data-target="68">0</div>
            <div className="point-label">Chance</div>
          </div>
          <div className="data-point pulse-4" style={{ top: '55%', right: '8%' }}>
            <div className="point-value" data-target="78">0</div>
            <div className="point-label">ATS Pass</div>
          </div>
        </div>

        {/* Data Connection Lines */}
        <svg className="connection-lines" width="100%" height="100%">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#00ff88', stopOpacity: 0 }} />
              <stop offset="50%" style={{ stopColor: '#00ff88', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#00ff88', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <line className="conn-line line-1" x1="10%" y1="15%" x2="50%" y2="50%" />
          <line className="conn-line line-2" x1="90%" y1="25%" x2="50%" y2="50%" />
          <line className="conn-line line-3" x1="20%" y1="80%" x2="50%" y2="50%" />
        </svg>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">[INTELLIGENCE ENGINE]</span>
            <h2>The Data Reveals What Applications Hide</h2>
          </div>

          <div className="steps">
            <div className="step" data-step="1">
              <div className="step-number">01</div>
              <div className="step-content">
                <span className="step-tag">[PROFILE SCAN]</span>
                <h3>We Read Between The Lines</h3>
                <p>Your resume meets our AI. We extract skills, experience depth, and hidden signals that ATS systems actually look for.</p>
                <div className="step-metric">
                  <span className="metric-value">2.3M</span>
                  <span className="metric-label">Profiles Analyzed</span>
                </div>
              </div>
              <div className="step-visual">
                <div className="visual-box profile-scan-box">
                  <div className="scan-animation">
                    <div className="scan-line"></div>
                    <div className="scan-line scan-line-2"></div>
                  </div>
                  <div className="profile-layers">
                    <div className="layer layer-1"></div>
                    <div className="layer layer-2"></div>
                    <div className="layer layer-3"></div>
                  </div>
                  <div className="scan-indicators">
                    <div className="indicator indicator-1"></div>
                    <div className="indicator indicator-2"></div>
                    <div className="indicator indicator-3"></div>
                    <div className="indicator indicator-4"></div>
                  </div>
                  <div className="scan-progress">
                    <div className="progress-bar"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="step" data-step="2">
              <div className="step-number">02</div>
              <div className="step-content">
                <span className="step-tag">[PATTERN ANALYSIS]</span>
                <h3>We See The Competition</h3>
                <p>Real-time analysis of applicant pools, hiring patterns, and success rates. We know who gets shortlisted and why.</p>
                <div className="step-metric">
                  <span className="metric-value">847k</span>
                  <span className="metric-label">Job Outcomes Tracked</span>
                </div>
              </div>
              <div className="step-visual">
                <div className="visual-box pattern-analysis-box">
                  <svg className="network-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#00d9ff', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
                      </linearGradient>
                      <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#00d9ff', stopOpacity: 0.3 }} />
                        <stop offset="50%" style={{ stopColor: '#7c3aed', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: '#00d9ff', stopOpacity: 0.3 }} />
                      </linearGradient>
                    </defs>
                    <line className="svg-line line-1" x1="50" y1="50" x2="150" y2="80" />
                    <line className="svg-line line-2" x1="100" y1="100" x2="150" y2="150" />
                    <line className="svg-line line-3" x1="50" y1="150" x2="100" y2="100" />
                    <line className="svg-line line-4" x1="150" y1="50" x2="100" y2="100" />
                    <circle className="svg-node node-1" cx="50" cy="50" r="8" />
                    <circle className="svg-node node-2" cx="150" cy="80" r="8" />
                    <circle className="svg-node node-3" cx="100" cy="100" r="10" />
                    <circle className="svg-node node-4" cx="150" cy="150" r="8" />
                    <circle className="svg-node node-5" cx="50" cy="150" r="8" />
                  </svg>
                  <div className="pattern-pulse"></div>
                </div>
              </div>
            </div>

            <div className="step" data-step="3">
              <div className="step-number">03</div>
              <div className="step-content">
                <span className="step-tag">[PROBABILITY CALCULATION]</span>
                <h3>You Get The Truth</h3>
                <p>Not motivation. Not hope. Just data. Your exact shortlisting probability, calculated from real outcomes.</p>
                <div className="step-metric">
                  <span className="metric-value">94%</span>
                  <span className="metric-label">Prediction Accuracy</span>
                </div>
              </div>
              <div className="step-visual">
                <div className="visual-box">
                  <div className="probability-display">
                    <div className="prob-value" data-target="73">0</div>
                    <div className="prob-label">Shortlist Chance</div>
                    <div className="prob-breakdown">
                      <div className="breakdown-item">
                        <span className="breakdown-label">ATS Pass</span>
                        <span className="breakdown-value">87%</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">HR Review</span>
                        <span className="breakdown-value">73%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insight Reveal Section */}
      <section className="insight-reveal">
        <div className="container">
          <div className="reveal-header">
            <span className="reveal-tag">[DATA INSIGHTS]</span>
            <h2>The Hidden Truths About Job Applications</h2>
          </div>
          <div className="reveal-grid">
            <div className="reveal-card">
              <div className="card-header">
                <span className="card-tag">[TRUTH #1]</span>
                <h3>Most applications never reach human eyes</h3>
              </div>
              <div className="card-stats">
                <div className="stat">
                  <div className="stat-value" data-target="78">0</div>
                  <div className="stat-label">Filtered by ATS</div>
                </div>
                <div className="stat-detail">
                  <p>Your resume gets scanned, not read. We show you exactly what passes through.</p>
                </div>
              </div>
              <div className="card-visual">
                <div className="visual-bar">
                  <div className="bar-fill" data-width="78"></div>
                </div>
              </div>
            </div>

            <div className="reveal-card">
              <div className="card-header">
                <span className="card-tag">[TRUTH #2]</span>
                <h3>Your competition is invisible</h3>
              </div>
              <div className="card-stats">
                <div className="stat">
                  <div className="stat-value" data-target="1247">0</div>
                  <div className="stat-label">Average applicants per role</div>
                </div>
                <div className="stat-detail">
                  <p>You're competing against hundreds. We show you where you rank.</p>
                </div>
              </div>
              <div className="card-visual">
                <div className="competition-visual">
                  <div className="comp-bar" style={{ height: '45%' }}></div>
                  <div className="comp-bar" style={{ height: '60%' }}></div>
                  <div className="comp-bar active" style={{ height: '73%' }}></div>
                  <div className="comp-bar" style={{ height: '35%' }}></div>
                  <div className="comp-bar" style={{ height: '52%' }}></div>
                </div>
              </div>
            </div>

            <div className="reveal-card">
              <div className="card-header">
                <span className="card-tag">[TRUTH #3]</span>
                <h3>Timing matters more than you think</h3>
              </div>
              <div className="card-stats">
                <div className="stat">
                  <div className="stat-value" data-target="3.2">0</div>
                  <div className="stat-label">Better odds if applied early</div>
                </div>
                <div className="stat-detail">
                  <p>First 48 hours = 3.2x better shortlist rate. We tell you when to apply.</p>
                </div>
              </div>
              <div className="card-visual">
                <div className="timeline-visual">
                  <div className="timeline-point active" style={{ left: '10%' }}>
                    <div className="point-value">3.2x</div>
                  </div>
                  <div className="timeline-point" style={{ left: '50%' }}>
                    <div className="point-value">1.1x</div>
                  </div>
                  <div className="timeline-point" style={{ left: '90%' }}>
                    <div className="point-value">0.4x</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-content">
            <span className="cta-tag">[READY TO UNLOCK INSIGHT?]</span>
            <h2>Stop applying blind.</h2>
            <p>Know your real chances before you invest your time.</p>
            <div className="cta-stats">
              <div className="cta-stat">
                <div className="cta-stat-value">2.3M+</div>
                <div className="cta-stat-label">Profiles Analyzed</div>
              </div>
              <div className="cta-stat">
                <div className="cta-stat-value">94%</div>
                <div className="cta-stat-label">Prediction Accuracy</div>
              </div>
              <div className="cta-stat">
                <div className="cta-stat-value">847k+</div>
                <div className="cta-stat-label">Outcomes Tracked</div>
              </div>
            </div>
            <button className="cta-primary large" onClick={revealChances}>Reveal My Chances</button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------- Helper Functions (Ported from script.js) ----------------

function animateDashboardPanels() {
  const panels = document.querySelectorAll('.panel-value');
  panels.forEach(panel => {
    const target = parseInt(panel.getAttribute('data-value') || '0');
    // For dashboard panels, specific logic if needed
    animateValue(panel as HTMLElement, 0, target, 2000, true);
  });
}

function animateSignals() {
  const signals = document.querySelectorAll('.signal-value');
  const fills = document.querySelectorAll('.signal-fill');

  signals.forEach((signal, index) => {
    const target = parseInt(signal.getAttribute('data-target') || '0');
    setTimeout(() => {
      animateValue(signal as HTMLElement, 0, target, 2000);
    }, index * 200);
  });

  fills.forEach((fill, index) => {
    const el = fill as HTMLElement;
    const width = el.getAttribute('data-width');
    setTimeout(() => {
      el.style.setProperty('--width', width + '%');
      el.classList.add('animate');
    }, index * 200 + 100);
  });
}

function animateFloatingData() {
  const points = document.querySelectorAll('.data-point .point-value');
  points.forEach((point, index) => {
    const target = parseInt(point.getAttribute('data-target') || '0');
    setTimeout(() => {
      if (target > 100) {
        // Format large numbers
        animateValue(point as HTMLElement, 0, target, 2000, false, (val) => {
          if (val >= 1000) {
            return (val / 1000).toFixed(1) + 'k';
          }
          return val.toString();
        });
      } else {
        animateValue(point as HTMLElement, 0, target, 2000);
      }
    }, index * 300);
  });
}

function animateValue(
  element: HTMLElement,
  start: number,
  end: number,
  duration: number,
  addPlus = false,
  formatter: ((val: number) => string) | null = null
) {
  let startTimestamp: number | null = null;
  const step = (timestamp: number) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const current = Math.floor(progress * (end - start) + start);

    if (formatter) {
      element.textContent = formatter(current);
    } else {
      element.textContent = current + (addPlus && current === end ? '+' : '');
    }

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      // Ensure final value is set correctly
      if (formatter) {
        element.textContent = formatter(end);
      } else {
        element.textContent = end + (addPlus ? '+' : '');
      }
    }
  };
  window.requestAnimationFrame(step);
}

function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // Animate stats in reveal cards
        if (entry.target.classList.contains('reveal-card')) {
          const statValue = entry.target.querySelector('.stat-value');
          if (statValue && !statValue.classList.contains('animated')) {
            const target = parseFloat(statValue.getAttribute('data-target') || '0');
            statValue.classList.add('animated');
            if (target > 100) {
              animateValue(statValue as HTMLElement, 0, target, 2000, false, (val) => {
                if (val >= 1000) {
                  return val.toLocaleString();
                }
                return val.toString();
              });
            } else {
              animateValue(statValue as HTMLElement, 0, target, 2000, false, (val) => val.toFixed(1));
            }
          }

          // Animate bar fills
          const barFill = entry.target.querySelector('.bar-fill') as HTMLElement;
          if (barFill && !barFill.classList.contains('animate')) {
            const width = barFill.getAttribute('data-width');
            setTimeout(() => {
              barFill.style.setProperty('--width', width + '%');
              barFill.classList.add('animate');
            }, 300);
          }
        }

        // Animate step visuals
        if (entry.target.classList.contains('step')) {
          const probValue = entry.target.querySelector('.prob-value');
          if (probValue && !probValue.classList.contains('animated')) {
            const target = parseInt(probValue.getAttribute('data-target') || '0');
            probValue.classList.add('animated');
            animateValue(probValue as HTMLElement, 0, target, 2000);
          }
        }
      }
    });
  }, observerOptions);

  // Observe steps
  document.querySelectorAll('.step').forEach(step => {
    observer.observe(step);
  });

  // Observe reveal cards
  document.querySelectorAll('.reveal-card').forEach(card => {
    observer.observe(card);
  });

  return () => observer.disconnect();
}

function setupProgressiveDisclosure() {
  // Add staggered animations for reveal cards
  const revealCards = document.querySelectorAll('.reveal-card');
  revealCards.forEach((card, index) => {
    (card as HTMLElement).style.transitionDelay = `${index * 0.1}s`;
  });

  // Add staggered animations for steps
  const steps = document.querySelectorAll('.step');
  steps.forEach((step, index) => {
    (step as HTMLElement).style.transitionDelay = `${index * 0.15}s`;
  });
}

function typeWriter(element: HTMLElement, text: string, speed = 50) {
  if (!element) return;
  let i = 0;
  element.textContent = '';
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      // Add cursor blink effect
      element.style.borderRight = '2px solid var(--accent-primary)';
      setTimeout(() => {
        element.style.borderRight = 'none';
      }, 500);
    }
  }
  type();
}
