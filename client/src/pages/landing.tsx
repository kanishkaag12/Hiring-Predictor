import { useEffect, useRef } from 'react';
import { useLocation } from "wouter";
import { useTheme } from "next-themes";
import { Moon, Sun, Twitter, Linkedin, Github, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import './landing.css';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const heroRef = useRef<HTMLElement>(null);
  const pulseLinesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Type insight text with dramatic reveal
    setTimeout(() => {
      const insight1 = document.getElementById('insight-text-1');
      if (insight1) typeWriter(insight1, "Your potential is data-backed.", 30);
      document.getElementById('insight1')?.classList.add('active');
    }, 800);

    setTimeout(() => {
      const insight2 = document.getElementById('insight-text-2');
      if (insight2) typeWriter(insight2, "Predict your next breakthrough.", 30);
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
          pointElement.style.zIndex = '1';
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

  const handleFindJobs = () => {
    setLocation("/jobs");
  };

  const handleLogin = () => {
    setLocation("/auth");
  };

  const handleSignup = () => {
    setLocation("/auth");
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="landing-page">
      {/* Header Navigation */}
      <header className="main-header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-text">HIREPULSE</span>
          </div>

          <nav className="header-nav-links">
            <a href="#hero" className="nav-link">Home</a>
            <a href="#how-it-works" className="nav-link">About</a>
            <a href="#" className="nav-link">Services</a>
            <a href="#" className="nav-link">Team</a>
            <a href="#" className="nav-link">Testimonials</a>
            <a href="#" className="nav-link">Pricing</a>
            <a href="#" className="nav-link">Contact</a>
          </nav>

          <div className="header-actions">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-yellow-500" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-100" />
            </button>
            <button className="btn-login" onClick={handleLogin}>Login</button>
            <button className="btn-signup" onClick={handleSignup}>Sign Up</button>
          </div>
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
            <button className="cta-secondary" onClick={handleFindJobs}>Find Jobs</button>
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
          <div className="data-point pulse-1">
            <div className="point-value" data-target="92">0</div>
            <div className="point-label">Match</div>
          </div>
          <div className="data-point pulse-2">
            <div className="point-value" data-target="1247">0</div>
            <div className="point-label">Apps</div>
          </div>
          <div className="data-point pulse-3">
            <div className="point-value" data-target="68">0</div>
            <div className="point-label">Chance</div>
          </div>
          <div className="data-point pulse-4">
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
                  <div className="data-fragments">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className={`fragment fragment-${i + 1}`}></div>
                    ))}
                  </div>
                  <div className="profile-layers">
                    <div className="layer layer-1"></div>
                    <div className="layer layer-2"></div>
                    <div className="layer layer-3"></div>
                  </div>
                  <div className="scan-progress">
                    <div className="progress-bar"></div>
                    <div className="progress-status">Optimizing Profile...</div>
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
                  <div className="tech-grid"></div>
                  <svg className="network-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#00d9ff', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <g className="network-links">
                      <line className="svg-line line-1" x1="40" y1="40" x2="160" y2="70" />
                      <line className="svg-line line-2" x1="100" y1="100" x2="160" y2="160" />
                      <line className="svg-line line-3" x1="40" y1="160" x2="100" y2="100" />
                      <line className="svg-line line-4" x1="160" y1="40" x2="100" y2="100" />
                      <line className="svg-line line-5" x1="40" y1="100" x2="160" y2="100" />
                    </g>
                    <g className="network-nodes">
                      <circle className="svg-node node-1" cx="40" cy="40" r="6" filter="url(#glow)" />
                      <circle className="svg-node node-2" cx="160" cy="70" r="6" filter="url(#glow)" />
                      <circle className="svg-node node-3" cx="100" cy="100" r="8" filter="url(#glow)" />
                      <circle className="svg-node node-4" cx="160" cy="160" r="6" filter="url(#glow)" />
                      <circle className="svg-node node-5" cx="40" cy="160" r="6" filter="url(#glow)" />
                      <circle className="svg-node node-6" cx="100" cy="40" r="5" filter="url(#glow)" />
                    </g>
                  </svg>
                  <div className="pattern-data-pulse"></div>
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
            <h2>Stop applying blindly.</h2>
            <p>Know your chances before you invest your time.</p>
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

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-wave">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>

        <div className="footer-top-callout">
          <div className="container">
            <div className="callout-flex">
              <div className="callout-text">
                <h3>Ready to transform your hiring journey?</h3>
                <p>Join thousands of candidates who already use HiroPulse to land their dream jobs.</p>
              </div>
              <div className="callout-actions">
                <button className="cta-primary" onClick={handleSignup}>Get Started Now</button>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-text">HIREPULSE</span>
            </div>
            <p>Advanced AI-driven insights for job seekers. Know your odds, improve your resume, and land more interviews.</p>
            <div className="footer-contact-info">
              <p><strong>Email:</strong> support@hirepulse.ai</p>
              <p><strong>Phone:</strong> +1 (555) 000-1234</p>
              <p><strong>Office:</strong> 123 AI Boulevard, Tech City</p>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-links">
              <h4>Product</h4>
              <ul>
                <li><a href="#">Features</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Enterprise</a></li>
                <li><a href="#">Success Stories</a></li>
                <li><a href="#">Security</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Press Kit</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">API Docs</a></li>
                <li><a href="#">Community</a></li>
                <li><a href="#">Webinars</a></li>
                <li><a href="#">Partners</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Cookie Policy</a></li>
                <li><a href="#">Data Processing</a></li>
                <li><a href="#">Trust Center</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            &copy; {new Date().getFullYear()} HirePulse Inc. All rights reserved.
          </div>
          <div className="footer-social">
            <a href="#" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Discord">
              <MessageSquare className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
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
