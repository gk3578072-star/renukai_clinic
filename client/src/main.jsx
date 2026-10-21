import React, { createContext, useContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import {
  Menu,
  X,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Clock3,
  HeartPulse,
  Smile,
  Sparkles,
  CalendarDays,
  Phone,
  MapPin,
  CheckCircle2,
  Star,
  Stethoscope,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Users,
  ClipboardList,
  Search,
  LoaderCircle,
  CircleUserRound,
} from "lucide-react";
import "./styles.css";
import ClinicMap from "./components/ClinicMap";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});
const AuthContext = createContext(null);
function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("rdc_token"));
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (token) {
      api
        .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => setUser(r.data.user))
        .catch(() => {
          localStorage.removeItem("rdc_token");
          setToken(null);
        });
    }
  }, [token]);
  const login = (data) => {
    localStorage.setItem("rdc_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };
  const logout = () => {
    localStorage.removeItem("rdc_token");
    setToken(null);
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
const useAuth = () => useContext(AuthContext);
const services = [
  {
    icon: Sparkles,
    name: "Teeth Cleaning",
    desc: "A fresher, healthier smile with gentle professional cleaning.",
    tag: "Preventive care",
  },
  {
    icon: HeartPulse,
    name: "Root Canal Treatment",
    desc: "Relieve discomfort and help preserve your natural tooth.",
    tag: "Restorative care",
  },
  {
    icon: Smile,
    name: "Braces & Aligners",
    desc: "Thoughtful treatment planning for a confident, balanced smile.",
    tag: "Smile design",
  },
  {
    icon: ShieldCheck,
    name: "Dental Implants",
    desc: "Explore long-term options to replace missing teeth.",
    tag: "Restorative care",
  },
  {
    icon: Star,
    name: "Cosmetic Dentistry",
    desc: "Personalised options to enhance the appearance of your smile.",
    tag: "Aesthetic care",
  },
  {
    icon: Stethoscope,
    name: "General Check-up",
    desc: "Regular oral health checks and clear, practical guidance.",
    tag: "Everyday care",
  },
];
function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc]);
  return (
    <>
      <div className="topline">
        <div className="container topline-inner">
          <span>
            <Clock3 size={14} /> Mon – Sat · By appointment
          </span>
          <a href="tel:+919970816550">
            <Phone size={14} /> Call the clinic
          </a>
        </div>
      </div>
      <header className="header">
        <div className="container nav">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Smile size={25} />
            </span>
            <span>
              Renukai Dental Clinic<small>CARE FOR EVERY SMILE</small>
            </span>
          </Link>
          <button
            className="mobile-menu"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav className={open ? "nav-links open" : "nav-links"}>
            <a href="/#care">Our care</a>
            <a href="/#about">About us</a>
            <a href="/#reviews">Patient stories</a>
            <a href="/#contact">Contact</a>
            {user ? (
              <>
                <Link
                  to={user.role === "admin" ? "/admin" : "/my-appointments"}
                  className="nav-login"
                >
                  <CircleUserRound size={17} />
                  {user.role === "admin" ? "Admin dashboard" : "My visits"}
                </Link>
                <button className="nav-logout" onClick={logout}>
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-login">
                <CircleUserRound size={17} /> Patient login
              </Link>
            )}
            <Link to="/book" className="btn btn-primary nav-cta">
              Book a visit <ArrowUpRight size={16} />
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container footer-grid">
        <div>
          <Link to="/" className="brand brand-light">
            <span className="brand-mark">
              <Smile size={25} />
            </span>
            <span>
              Renukai Dental Clinic<small>DENTAL CARE · JALGAON</small>
            </span>
          </Link>
          <p>Thoughtful dental care and personal attention for every smile.</p>
          <div className="clinic-rating">
            <span className="stars">★★★★★</span>
            <strong>4.9/5</strong>
            <small>
              · 112 Google reviews (as shown in the supplied screenshot)
            </small>
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="/#care">Our services</a>
          <a href="/#about">About the clinic</a>
          <Link to="/book">Book an appointment</Link>
          <Link to="/login">Patient login</Link>
        </div>
        <div className="footer-contact">
          <h4>Visit or call us</h4>
          <p>
            <MapPin size={16} />{" "}
            <span>
              2, opposite of Ambedkar Market,
              <br />
              Prabhat Colony, Jalgaon,
              <br />
              Maharashtra 425001
            </span>
          </p>
          <p>
            <Phone size={16} /> <a href="tel:+919970816550">099708 16550</a>
          </p>
          <p>
            <Clock3 size={16} /> Please call to confirm today's hours.
          </p>
          <a
            className="footer-map-link"
            href="https://www.google.com/maps/search/?api=1&query=Renukai+Dental+Clinic+2+opposite+Ambedkar+Market+Prabhat+Colony+Jalgaon+Maharashtra+425001"
            target="_blank"
            rel="noreferrer"
          >
            Open directions <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Renukai Dental Clinic. All rights
          reserved.
        </span>
        <span>
          Clinic details sourced from the information supplied by the owner.
        </span>
      </div>
    </footer>
  );
}
function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot"></span> YOUR SMILE, OUR PRIORITY
            </div>
            <h1>
              A healthier smile.
              <br />
              <em>A happier you.</em>
            </h1>
            <p className="hero-text">
              Thoughtful dental care in a welcoming space. From routine
              check-ups to smile transformations, we're here to help you feel
              good about your oral health.
            </p>
            <div className="hero-actions">
              <Link to="/book" className="btn btn-primary btn-large">
                Book your appointment <ArrowRight size={18} />
              </Link>
              <a href="#care" className="btn btn-outline btn-large">
                Explore our care
              </a>
            </div>
            <div className="trust-row">
              <div className="trust-avatars">
                <span>R</span>
                <span>D</span>
                <span>♥</span>
              </div>
              <div>
                <div className="stars">★★★★★</div>
                <small>Care that puts people first</small>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-stat">
                <strong>100%</strong>
                <small>Patient-first approach</small>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrap">
              <img
                src="/images/renukai-clinic-exterior.jpg"
                alt="Renukai Dental Clinic exterior in Jalgaon"
              />
              <div className="image-overlay"></div>
              <div className="floating-card">
                <span className="float-icon">
                  <ShieldCheck size={21} />
                </span>
                <span>
                  <strong>Care you can trust</strong>
                  <small>Gentle · Modern · Personal</small>
                </span>
                <CheckCircle2 className="float-check" size={19} />
              </div>
              <div className="round-stamp">
                <Smile size={26} />
                <span>
                  SMILE
                  <br />
                  MORE
                </span>
              </div>
            </div>
            <div className="hero-caption">
              <span className="caption-line"></span>
              <span>Comfortable care. Confident smiles.</span>
            </div>
          </div>
        </div>
      </section>
      <section className="benefits">
        <div className="container benefits-grid">
          <div>
            <span className="benefit-icon">
              <HeartPulse />
            </span>
            <span>
              <strong>Care with compassion</strong>
              <small>Your comfort comes first</small>
            </span>
          </div>
          <div>
            <span className="benefit-icon">
              <ShieldCheck />
            </span>
            <span>
              <strong>Clear treatment plans</strong>
              <small>Understand your options</small>
            </span>
          </div>
          <div>
            <span className="benefit-icon">
              <CalendarDays />
            </span>
            <span>
              <strong>Easy appointment requests</strong>
              <small>Choose a time that suits you</small>
            </span>
          </div>
          <div>
            <span className="benefit-icon">
              <Sparkles />
            </span>
            <span>
              <strong>Made for your smile</strong>
              <small>Personalised attention</small>
            </span>
          </div>
        </div>
      </section>
      <section className="section services-section" id="care">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">HOW WE CAN HELP</div>
              <h2>
                Complete care for <em>every smile.</em>
              </h2>
            </div>
            <p>
              Whether you're due for a check-up or exploring treatment, we'll
              help you take the next step with confidence.
            </p>
          </div>
          <div className="service-grid">
            {services.map((s, i) => (
              <article className="service-card" key={s.name}>
                <div className="service-top">
                  <span className="service-icon">
                    <s.icon size={23} />
                  </span>
                  <span className="service-number">0{i + 1}</span>
                </div>
                <span className="service-tag">{s.tag}</span>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
                <Link
                  to={`/book?service=${encodeURIComponent(s.name)}`}
                  className="text-link"
                >
                  Book this service <ArrowUpRight size={16} />
                </Link>
              </article>
            ))}
          </div>
          <div className="center-action">
            <Link to="/book" className="btn btn-dark">
              Find the right appointment <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="about-section" id="about">
        <div className="container about-grid">
          <div className="about-photos">
            <img
              className="about-main"
              src="/images/renukai-clinic-exterior.jpg"
              alt="Renukai Dental Clinic exterior in Jalgaon"
            />
            <img
              className="about-small"
              src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=600&q=85"
              alt="Dental professional working with patient"
            />
            <div className="about-note">
              <Smile size={25} />
              <span>
                <strong>Your comfort matters</strong>
                <small>Every visit, every smile</small>
              </span>
            </div>
          </div>
          <div className="about-copy">
            <div className="eyebrow">A DIFFERENT KIND OF DENTAL VISIT</div>
            <h2>
              Dental care that feels <em>a little more human.</em>
            </h2>
            <p>
              We believe great dentistry begins with listening. Your concerns,
              your goals, and your comfort shape the conversation — so you can
              make informed decisions about your smile.
            </p>
            <div className="check-list">
              <div>
                <CheckCircle2 /> A welcoming, patient-first experience
              </div>
              <div>
                <CheckCircle2 /> Clear explanations before treatment
              </div>
              <div>
                <CheckCircle2 /> Care plans shaped around your needs
              </div>
              <div>
                <CheckCircle2 /> Support for everyday oral wellness
              </div>
            </div>
            <Link to="/book" className="btn btn-primary">
              Meet us at your next visit <ArrowRight size={17} />
            </Link>
            <p className="placeholder-note">
              The clinic exterior image is based on the photo you supplied.
              Please use an original high-resolution photo for the best result.
            </p>
          </div>
        </div>
      </section>
      <section className="testimonial-section" id="reviews">
        <div className="container testimonial-inner">
          <div className="eyebrow">KIND WORDS, REAL TRUST</div>
          <h2>Every smile has a story.</h2>
          <p>
            We want every patient to leave feeling listened to, informed, and
            cared for.
          </p>
          <div className="quote-card">
            <div className="quote-stars">★★★★★</div>
            <blockquote>
              “Your smile deserves attentive care, clear guidance, and a
              welcoming dental visit.”
            </blockquote>
            <div className="quote-person">
              <span className="quote-avatar">
                <Smile />
              </span>
              <span>
                <strong>The Renukai Dental Clinic promise</strong>
                <small>Our approach to patient care</small>
              </span>
            </div>
          </div>
          <small className="disclaimer">
            This is a clinic statement, not a patient testimonial. Add only
            genuine reviews with permission.
          </small>
        </div>
      </section>
      <section className="cta-section">
        <div className="container cta-inner">
          <div>
            <div className="eyebrow eyebrow-light">
              YOUR NEXT CHAPTER STARTS HERE
            </div>
            <h2>
              Ready to give your smile
              <br />a little extra care?
            </h2>
            <p>
              Request an appointment in just a few steps. Our team will follow
              up to confirm your visit.
            </p>
          </div>
          <Link to="/book" className="btn btn-white btn-large">
            Request an appointment <ArrowRight size={18} />
          </Link>
          <div className="cta-orb"></div>
        </div>
            </section>

      {/* Google Maps Location Section */}
      <ClinicMap />

      {/* Existing Footer */}
      <Footer />
    </>
  );
}
function AuthPage() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const nav = useNavigate();
  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post("/auth/send-otp", { phone: phone.trim() });
      setNotice(r.data.message);
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  }
  async function verify(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post("/auth/verify-otp", {
        phone: phone.trim(),
        code,
      });
      login(r.data);
      nav(r.data.user.role === "admin" ? "/admin" : "/book");
    } catch (e) {
      setError(e.response?.data?.message || "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-art">
        <div className="auth-art-content">
          <Link to="/" className="brand brand-light">
            <span className="brand-mark">
              <Smile />
            </span>
            <span>
              Renukai Dental Clinic<small>CARE FOR EVERY SMILE</small>
            </span>
          </Link>
          <div className="auth-art-copy">
            <div className="eyebrow eyebrow-light">YOUR SMILE JOURNEY</div>
            <h1>
              Care starts with
              <br />
              <em>a conversation.</em>
            </h1>
            <p>
              Sign in securely with your mobile number to request and manage
              your visits.
            </p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1000&q=85"
            alt="Dental clinic"
          />
          <Link to="/" className="back-home">
            ← Back to clinic website
          </Link>
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="auth-mobile-mark">
            <Smile />
          </div>
          <div className="eyebrow">PATIENT PORTAL</div>
          <h2>{step === 1 ? "Welcome back." : "Check your messages."}</h2>
          <p>
            {step === 1
              ? "Enter your mobile number and we’ll send you a one-time password."
              : "Enter the six-digit code sent to your phone."}
          </p>
          {error && <div className="alert error">{error}</div>}
          {notice && <div className="alert success">{notice}</div>}
          {step === 1 ? (
            <form onSubmit={send}>
              <label htmlFor="phone">Mobile number</label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                required
                autoComplete="tel"
              />
              <small className="field-help">
                Include your country code, e.g. +91 for India.
              </small>
              <button className="btn btn-primary btn-full" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" />
                ) : (
                  "Send one-time password"
                )}{" "}
                {!busy && <ArrowRight size={17} />}
              </button>
            </form>
          ) : (
            <form onSubmit={verify}>
              <label htmlFor="code">6-digit OTP</label>
              <input
                id="code"
                className="otp-input"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                required
              />
              <button
                className="btn btn-primary btn-full"
                disabled={busy || code.length !== 6}
              >
                {busy ? <LoaderCircle className="spin" /> : "Verify & continue"}{" "}
                {!busy && <ArrowRight size={17} />}
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setStep(1);
                  setCode("");
                  setNotice("");
                }}
              >
                Use a different number
              </button>
            </form>
          )}
          <div className="secure-note">
            <ShieldCheck size={17} /> Your sign-in is protected with one-time
            verification.
          </div>
          <small className="auth-legal">
            By continuing, you agree to use this portal for appointment
            management. Please avoid sharing your OTP with anyone.
          </small>
        </div>
      </div>
    </main>
  );
}
function BookPage() {
  const { user, token } = useAuth();
  const [form, setForm] = useState({
    patientName: user?.name || "",
    service: "General Check-up",
    date: "",
    time: "10:00",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [mine, setMine] = useState([]);
  const nav = useNavigate();
  const params = new URLSearchParams(window.location.search);
  useEffect(() => {
    if (params.get("service"))
      setForm((f) => ({ ...f, service: params.get("service") }));
  }, []);
  useEffect(() => {
    if (user?.name)
      setForm((f) => ({ ...f, patientName: f.patientName || user.name }));
  }, [user]);
  useEffect(() => {
    if (token)
      api
        .get("/appointments/mine", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((r) => setMine(r.data.appointments))
        .catch(() => {});
  }, [token]);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    if (!user) {
      nav("/login");
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const r = await api.post("/appointments", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg(r.data.message);
      setMine([r.data.appointment, ...mine]);
      setForm((f) => ({ ...f, patientName: f.patientName, message: "" }));
    } catch (e) {
      setErr(e.response?.data?.message || "Could not submit appointment.");
    } finally {
      setBusy(false);
    }
  }
  async function cancel(id) {
    try {
      await api.patch(
        `/appointments/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMine((m) =>
        m.map((a) => (a._id === id ? { ...a, status: "cancelled" } : a)),
      );
    } catch (e) {
      setErr(e.response?.data?.message || "Could not cancel appointment.");
    }
  }
  return (
    <>
      <main className="portal-page">
        <div className="container portal-layout">
          <div className="portal-intro">
            <div className="eyebrow">PATIENT PORTAL</div>
            <h1>
              Let's plan your <em>next visit.</em>
            </h1>
            <p>
              Tell us a little about what you need. Your request will be
              reviewed by the clinic and confirmed with you.
            </p>
            <div className="portal-promise">
              <ShieldCheck />
              <span>
                <strong>Your care, at your pace</strong>
                <small>
                  Submitting a request does not mean the appointment is
                  confirmed.
                </small>
              </span>
            </div>
            <div className="portal-image">
              <img
                src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&q=85"
                alt="Dental professional caring for a patient"
              />
            </div>
          </div>
          <div className="booking-column">
            <div className="booking-card">
              <div className="booking-card-head">
                <span className="form-icon">
                  <CalendarDays />
                </span>
                <div>
                  <h2>Request an appointment</h2>
                  <p>Usually takes less than 2 minutes</p>
                </div>
              </div>
              {!user && (
                <div className="alert info">
                  Please{" "}
                  <Link to="/login">sign in with your mobile number</Link>{" "}
                  before submitting a request.
                </div>
              )}
              {err && <div className="alert error">{err}</div>}
              {msg && (
                <div className="alert success">
                  <CheckCircle2 />
                  {msg}
                </div>
              )}
              <form onSubmit={submit} className="booking-form">
                <div className="form-field">
                  <label htmlFor="patientName">Your full name</label>
                  <input
                    id="patientName"
                    name="patientName"
                    value={form.patientName}
                    onChange={update}
                    placeholder="Enter your name"
                    required
                    minLength={2}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="service">What can we help with?</label>
                  <div className="select-wrap">
                    <select
                      id="service"
                      name="service"
                      value={form.service}
                      onChange={update}
                    >
                      {[
                        "General Check-up",
                        "Teeth Cleaning",
                        "Root Canal Treatment",
                        "Dental Implants",
                        "Braces & Aligners",
                        "Cosmetic Dentistry",
                        "Tooth Extraction",
                        "Emergency Consultation",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="date">Preferred date</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={form.date}
                      min={new Date().toLocaleDateString("en-CA")}
                      onChange={update}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="time">Preferred time</label>
                    <div className="select-wrap">
                      <select
                        id="time"
                        name="time"
                        value={form.time}
                        onChange={update}
                      >
                        {[
                          "09:00",
                          "09:30",
                          "10:00",
                          "10:30",
                          "11:00",
                          "11:30",
                          "12:00",
                          "12:30",
                          "14:00",
                          "14:30",
                          "15:00",
                          "15:30",
                          "16:00",
                          "16:30",
                          "17:00",
                          "17:30",
                        ].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="message">
                    Anything you'd like us to know? <span>(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="3"
                    maxLength="500"
                    value={form.message}
                    onChange={update}
                    placeholder="Share a short note — please don't include sensitive medical details."
                  />
                </div>
                <button
                  className="btn btn-primary btn-full"
                  disabled={busy || !user}
                >
                  {busy ? (
                    <LoaderCircle className="spin" />
                  ) : (
                    "Send appointment request"
                  )}{" "}
                  {!busy && <ArrowRight size={17} />}
                </button>
                <small className="form-footnote">
                  <ShieldCheck size={14} /> Your information is used to manage
                  this appointment request.
                </small>
              </form>
            </div>
          </div>
        </div>
        <section className="container my-appointments">
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR VISITS</div>
              <h2>
                Appointment <em>requests</em>
              </h2>
            </div>
            <span className="count-pill">{mine.length} total</span>
          </div>
          {!user ? (
            <div className="empty-state">
              Sign in to view your appointment requests.
            </div>
          ) : mine.length === 0 ? (
            <div className="empty-state">
              <CalendarDays />
              <h3>No appointments yet</h3>
              <p>Your requests will appear here after you submit the form.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {mine.map((a) => (
                <div className="appointment-row" key={a._id}>
                  <div className="appointment-date">
                    <strong>{new Date(`${a.date}T12:00:00`).getDate()}</strong>
                    <small>
                      {new Date(`${a.date}T12:00:00`).toLocaleDateString("en", {
                        month: "short",
                      })}
                    </small>
                  </div>
                  <div className="appointment-info">
                    <strong>{a.service}</strong>
                    <small>
                      {a.date} · {a.time} · {a.patientName}
                    </small>
                  </div>
                  <span className={`status status-${a.status}`}>
                    {a.status}
                  </span>
                  {!["cancelled", "completed"].includes(a.status) && (
                    <button
                      className="cancel-btn"
                      onClick={() => cancel(a._id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
function AdminPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({});
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };
  async function load() {
    setBusy(true);
    setErr("");
    try {
      const [s, a] = await Promise.all([
        api.get("/appointments/admin/stats", { headers }),
        api.get("/appointments/admin/all", {
          headers,
          params: { search, status, date },
        }),
      ]);
      setStats(s.data);
      setItems(a.data.appointments);
    } catch (e) {
      setErr(e.response?.data?.message || "Could not load dashboard.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!user && !token) nav("/login");
    else if (user && user.role !== "admin") nav("/book");
  }, [user, token]);
  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user, status, date]);
  async function updateStatus(id, newStatus) {
    try {
      await api.patch(
        `/appointments/admin/${id}/status`,
        { status: newStatus },
        { headers },
      );
      await load();
    } catch (e) {
      setErr(e.response?.data?.message || "Update failed.");
    }
  }
  if (!user || user.role !== "admin")
    return (
      <main className="portal-page">
        <div className="container">
          <div className="loading-state">
            <LoaderCircle className="spin" /> Loading dashboard…
          </div>
        </div>
      </main>
    );
  return (
    <>
      <main className="admin-page">
        <div className="container">
          <div className="admin-heading">
            <div>
              <div className="eyebrow">CLINIC MANAGEMENT</div>
              <h1>
                Good day, <em>admin.</em>
              </h1>
              <p>
                Manage appointment requests and keep the clinic running
                smoothly.
              </p>
            </div>
            <div className="admin-badge">
              <LayoutDashboard /> Admin workspace
            </div>
          </div>
          {err && <div className="alert error">{err}</div>}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">
                <ClipboardList />
              </span>
              <small>Total appointments</small>
              <strong>{stats.total ?? "—"}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-icon amber">
                <Clock3 />
              </span>
              <small>Awaiting review</small>
              <strong>{stats.pending ?? "—"}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-icon green">
                <CheckCircle2 />
              </span>
              <small>Confirmed</small>
              <strong>{stats.confirmed ?? "—"}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-icon purple">
                <Users />
              </span>
              <small>Patient accounts</small>
              <strong>{stats.patients ?? "—"}</strong>
            </div>
          </div>
          <div className="admin-table-card">
            <div className="admin-table-head">
              <div>
                <h2>Appointment requests</h2>
                <p>Review, confirm, or update each booking.</p>
              </div>
              <button className="btn btn-outline" onClick={load}>
                <ArrowRight size={16} /> Refresh
              </button>
            </div>
            <div className="admin-filters">
              <div className="search-field">
                <Search />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  placeholder="Search patient or phone"
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Filter by date"
              />
              <button className="btn btn-dark" onClick={load}>
                Apply
              </button>
            </div>
            {busy ? (
              <div className="loading-state">
                <LoaderCircle className="spin" /> Loading appointments…
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <CalendarDays />
                <h3>No matching appointments</h3>
                <p>Try adjusting the filters.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Service</th>
                      <th>Preferred date</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a) => (
                      <tr key={a._id}>
                        <td>
                          <strong>{a.patientName}</strong>
                          <small>{a.message || "No additional note"}</small>
                        </td>
                        <td>{a.service}</td>
                        <td>
                          {a.date}
                          <small>{a.time}</small>
                        </td>
                        <td>{a.phone}</td>
                        <td>
                          <span className={`status status-${a.status}`}>
                            {a.status}
                          </span>
                        </td>
                        <td>
                          <select
                            aria-label={`Update ${a.patientName} appointment status`}
                            value={a.status}
                            onChange={(e) =>
                              updateStatus(a._id, e.target.value)
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="admin-security">
            <ShieldCheck size={16} /> This dashboard is restricted to verified
            phone numbers listed in the server's ADMIN_PHONES setting.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
function App() {
  const { user } = useAuth();
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/my-appointments" element={<BookPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      {user && (
        <a
          href="tel:+910000000000"
          className="floating-help"
          aria-label="Call clinic"
        >
          <Phone size={19} />
        </a>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
