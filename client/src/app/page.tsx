import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircuitBoard,
  Cpu,
  Gauge,
  Lightbulb,
  Play,
  Radio,
  Thermometer,
  Zap,
} from "lucide-react";

const pins = Array.from({ length: 8 });

export default function Home() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link className="brand-lockup" href="/" aria-label="Circuit Studio home">
          <span className="brand-mark"><Zap size={18} fill="currentColor" /></span>
          <span className="brand-name">circuit<span>studio</span></span>
        </Link>
        <div className="landing-nav-links">
          <a href="#features">What you can build</a>
          <a href="#workspace">The workspace</a>
          <Link className="nav-cta" href="/editor">Open studio <ArrowUpRight size={14} /></Link>
        </div>
      </nav>

      <div className="landing-main">
        <section className="landing-hero" id="workspace">
          <div className="hero-copy">
            <p className="hero-kicker"><span className="kicker-dot" /> A LITTLE MORE HANDS-ON ENGINEERING</p>
            <h1>Make it real.<br />Make it <em>work.</em></h1>
            <p className="hero-description">
              Build a circuit, wire every pin, and see what happens when you
              press run. A 3D electronics workbench for curious minds and
              practical ideas.
            </p>
            <div className="hero-actions">
              <Link className="hero-primary" href="/editor"><Play size={15} fill="currentColor" /> Open the workspace <ArrowUpRight size={14} /></Link>
              <Link className="hero-secondary" href="/editor"><CircuitBoard size={15} /> Try the ESP32 demo</Link>
            </div>
            <p className="hero-footnote"><Radio size={13} /> No hardware needed. Start building right in your browser.</p>
          </div>

          <div className="visual-stage" aria-label="Preview of a 3D ESP32 circuit">
            <div className="visual-glow" />
            <span className="hero-index">FIG. 01 — THE WORKBENCH</span>
            <div className="visual-window">
              <div className="visual-window-head">
                <span className="window-dots"><i /><i /><i /></span>
                <span className="window-name">ESP32 / climate monitor</span>
                <span className="window-run"><Play size={8} fill="currentColor" /> RUNNING</span>
              </div>
              <div className="visual-workspace">
                <span className="scene-tag board-tag"><Cpu size={10} /> ESP32 DEVKIT</span>
                <span className="scene-tag sensor-tag"><Thermometer size={10} /> DHT22</span>
                <span className="scene-tag led-tag"><Lightbulb size={10} /> STATUS LED</span>
                <div className="demo-wire demo-wire-a" />
                <div className="demo-wire demo-wire-b" />
                <div className="demo-wire demo-wire-c" />
                <div className="demo-board">
                  <span className="demo-pin-row left">{pins.map((_, index) => <i key={`l${index}`} />)}</span>
                  <span className="demo-pin-row right">{pins.map((_, index) => <i key={`r${index}`} />)}</span>
                </div>
                <div className="demo-sensor" />
                <div className="demo-resistor" />
                <div className="demo-led" />
              </div>
              <div className="visual-readouts">
                <div className="readout"><label>TEMPERATURE</label><strong>24.8<span>°C</span></strong></div>
                <div className="readout"><label>HUMIDITY</label><strong>56.2<span>%</span></strong></div>
                <div className="readout readout-status"><label>GPIO 2 · OUTPUT</label><strong>● &nbsp;HIGH / LED ON</strong></div>
              </div>
            </div>
            <div className="visual-float"><span className="float-indicator" /> All connections verified <Gauge size={13} /></div>
          </div>
        </section>

        <div className="landing-divider" />

        <section className="feature-strip" id="features" aria-label="Studio features">
          <article className="feature-card">
            <span className="feature-icon"><CircuitBoard size={16} /></span>
            <div><h3>A workbench you can touch</h3><p>Place parts, move them around, and wire pins together in a navigable 3D scene.</p></div>
          </article>
          <article className="feature-card">
            <span className="feature-icon"><Cpu size={16} /></span>
            <div><h3>Small circuits, real logic</h3><p>Try ESP32 GPIO, check your wiring, and watch LEDs and sensors respond.</p></div>
          </article>
          <article className="feature-card">
            <span className="feature-icon"><ArrowDownRight size={16} /></span>
            <div><h3>Pick up where you left off</h3><p>Save to your project library, share a link, or bring a circuit with you as JSON.</p></div>
          </article>
        </section>

        <footer className="landing-bottom">
          <span><Zap size={12} /> Made for the joy of figuring it out.</span>
          <span>ESP32 · DHT22 · LED · 3D SIMULATION</span>
        </footer>
      </div>
    </main>
  );
}
