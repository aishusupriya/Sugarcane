import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Camera,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CloudUpload,
  Droplets,
  FileImage,
  History,
  Leaf,
  Menu,
  MoreHorizontal,
  ScanLine,
  Settings2,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

const demoProfile = {
  name: "Rust",
  severity: "Moderate",
  color: "amber",
  confidence: 99.9,
  description:
    "Small rust-colored pustules detected. Early intervention can protect nearby leaves.",
};

const speechLanguages = {
  en: {
    label: "English",
    locale: "en-US",
    intro: "Treatment plan for sugarcane rust.",
    steps: [
      "Remove affected leaves. Cut 30 centimeters below the visible lesion.",
      "Apply the recommended fungicide to the surrounding area within 24 hours.",
      "Maintain field drainage. Clear standing water and keep root zones aerated.",
    ],
  },
  hi: {
    label: "हिन्दी",
    locale: "hi-IN",
    intro: "गन्ने में रस्ट रोग के लिए उपचार योजना।",
    steps: [
      "प्रभावित पत्तियों को हटाएं। दिखाई देने वाले घाव से 30 सेंटीमीटर नीचे काटें।",
      "24 घंटे के भीतर आसपास के क्षेत्र में अनुशंसित फफूंदनाशक लगाएं।",
      "खेत में जल निकासी बनाए रखें। जमा पानी हटाएं और जड़ों के क्षेत्र में हवा आने दें।",
    ],
  },
  te: {
    label: "తెలుగు",
    locale: "te-IN",
    intro: "చెరకు రస్ట్ వ్యాధికి చికిత్సా ప్రణాళిక.",
    steps: [
      "బాధిత ఆకులను తొలగించండి. కనిపించే మచ్చకు 30 సెంటీమీటర్ల దిగువన కోయండి.",
      "24 గంటల్లో పరిసర ప్రాంతానికి సిఫార్సు చేసిన శిలీంద్రనాశకాన్ని పిచికారీ చేయండి.",
      "పొలంలో నీటి పారుదలను మెరుగుపరచండి. నిలిచిన నీటిని తొలగించండి.",
    ],
  },
  ta: {
    label: "தமிழ்",
    locale: "ta-IN",
    intro: "கரும்பு துரு நோய்க்கான சிகிச்சைத் திட்டம்.",
    steps: [
      "பாதிக்கப்பட்ட இலைகளை அகற்றவும். தெரியும் காயத்திற்கு 30 சென்டிமீட்டர் கீழே வெட்டவும்.",
      "24 மணி நேரத்திற்குள் சுற்றியுள்ள பகுதியில் பரிந்துரைக்கப்பட்ட பூஞ்சைக் கொல்லியைப் பயன்படுத்தவும்.",
      "வயலில் நீர் வடிகாலைக் காக்கவும். தேங்கிய நீரை அகற்றவும்.",
    ],
  },
};

async function persistScanData(image, thermalImage) {
  try {
    const form = new FormData();
    form.append("disease", demoProfile.name);
    form.append("severity", demoProfile.severity);
    form.append("confidence", String(demoProfile.confidence / 100));
    if (image.startsWith("data:"))
      form.append(
        "rgb_image",
        await (await fetch(image)).blob(),
        "rgb-sugarcane.jpg",
      );
    if (thermalImage?.startsWith("data:"))
      form.append(
        "thermal_image",
        await (await fetch(thermalImage)).blob(),
        "thermal-sugarcane.jpg",
      );
    await fetch("/api/scans/", { method: "POST", body: form });
  } catch {
    // The local preview remains usable when Django is not running.
  }
}

function App() {
  const leafImage =
    "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=85";
  const thermalFallback =
    "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=85";
  const [view, setView] = useState("capture");
  const [mobileNav, setMobileNav] = useState(false);
  const [thermal, setThermal] = useState(true);
  const [thermalImage, setThermalImage] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState("rgb");
  const [cameraError, setCameraError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [image, setImage] = useState(leafImage);
  const [progress, setProgress] = useState(0);
  const [openTreatment, setOpenTreatment] = useState(true);
  const [done, setDone] = useState([]);
  const [speechLanguage, setSpeechLanguage] = useState("en");
  const input = useRef(null);
  const thermalInput = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!analyzing) return undefined;
    const started = Date.now();
    const timer = setInterval(() => {
      const percent = Math.min(100, Math.round((Date.now() - started) / 24));
      setProgress(percent);
      if (percent === 100) {
        clearInterval(timer);
        setAnalyzing(false);
        setResult(demoProfile);
        persistScanData(image, thermalImage);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [analyzing, image, thermalImage]);

  const normalizeImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1600 / source.width);
        canvas.width = Math.round(source.width * scale);
        canvas.height = Math.round(source.height * scale);
        canvas
          .getContext("2d")
          .drawImage(source, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL("image/jpeg", 0.9));
      };
      source.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  const upload = (event) => {
    const file = event.target.files?.[0];
    if (file) normalizeImage(file, setImage);
  };
  const uploadThermal = (event) => {
    const file = event.target.files?.[0];
    if (file)
      normalizeImage(file, (src) => {
        setThermalImage(src);
        setThermal(true);
      });
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };
  const openCamera = async (mode) => {
    setCameraMode(mode);
    setCameraError("");
    setCameraOpen(true);
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) videoRef.current.srcObject = streamRef.current;
    } catch {
      setCameraError(
        "Camera access was unavailable. Use the upload button instead.",
      );
    }
  };
  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    canvas
      .getContext("2d")
      .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL("image/jpeg", 0.9);
    if (cameraMode === "thermal") {
      setThermalImage(src);
      setThermal(true);
    } else setImage(src);
    stopCamera();
  };
  const nav = [
    { id: "capture", label: "New scan", icon: ScanLine },
    { id: "history", label: "Scan history", icon: History },
    { id: "insights", label: "Field insights", icon: BarChart3 },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span>
            <Leaf size={20} />
          </span>
          Agri<b>Scan</b>
        </div>
        <div className="workspace">
          <i>NF</i>
          <div>
            <strong>Northfield farm</strong>
            <small>Workspace</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <label>WORKSPACE</label>
        <nav>
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => {
                setView(id);
                setMobileNav(false);
              }}
            >
              <Icon size={18} />
              {label}
              {id === "history" && <em>12</em>}
            </button>
          ))}
        </nav>
        <label className="manage">MANAGE</label>
        <nav>
          <button>
            <Settings2 size={18} />
            Settings
          </button>
          <button>
            <CircleHelp size={18} />
            Help center
          </button>
        </nav>
        <div className="sidebar-foot">
          <Sparkles size={16} />
          <div>
            <strong>Pro workspace</strong>
            <small>Live crop monitoring</small>
          </div>
        </div>
      </aside>
      <main>
        <header>
          <button
            className="mobile-menu"
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="crumb">
            AgriScan <ArrowRight size={13} />{" "}
            <b>
              {view === "capture"
                ? "New scan"
                : view === "history"
                  ? "Scan history"
                  : "Field insights"}
            </b>
          </div>
          <div className="top-actions">
            <button>
              <Bell size={18} />
            </button>
            <i>JD</i>
          </div>
        </header>
        <div className="content">
          {view === "capture" && (
            <>
              {analyzing ? (
                <Analyzing
                  image={image}
                  progress={progress}
                  thermal={thermal}
                />
              ) : result ? (
                <Result
                  image={image}
                  thermalImage={thermalImage || thermalFallback}
                  result={result}
                  open={openTreatment}
                  setOpen={setOpenTreatment}
                  done={done}
                  setDone={setDone}
                  speechLanguage={speechLanguage}
                  setSpeechLanguage={setSpeechLanguage}
                  reset={() => setResult(null)}
                />
              ) : (
                <Capture
                  image={image}
                  thermal={thermal}
                  thermalImage={thermalImage}
                  setThermal={setThermal}
                  input={input}
                  thermalInput={thermalInput}
                  upload={upload}
                  uploadThermal={uploadThermal}
                  openCamera={openCamera}
                  cameraOpen={cameraOpen}
                  cameraMode={cameraMode}
                  cameraError={cameraError}
                  videoRef={videoRef}
                  captureFrame={captureFrame}
                  stopCamera={stopCamera}
                  scan={() => {
                    setProgress(0);
                    setAnalyzing(true);
                  }}
                />
              )}
            </>
          )}
          {view === "history" && <HistoryView />}
          {view === "insights" && <InsightsView />}
        </div>
      </main>
    </div>
  );
}

function Capture({
  image,
  thermal,
  thermalImage,
  setThermal,
  input,
  thermalInput,
  upload,
  uploadThermal,
  openCamera,
  cameraOpen,
  cameraMode,
  cameraError,
  videoRef,
  captureFrame,
  stopCamera,
  scan,
}) {
  const [source, setSource] = useState("rgb");

  return (
    <>
      <div className="capture-layout">
        <section className="panel capture">
          <div className="heading">
            <div>
              <small className="kicker">
                <ScanLine size={14} /> CAPTURE
              </small>
              <h2>Start with two leaf views</h2>
              <p>Choose live camera or add images from your device.</p>
            </div>
            <button className="link">
              <CircleHelp size={15} /> How it works
            </button>
          </div>
          <div className="capture-menu">
            <label className="capture-label" htmlFor="capture-source">What would you like to add?</label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="capture-source">
                <SelectValue placeholder="Choose an image source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rgb">RGB image or live camera</SelectItem>
                <SelectItem value="thermal">Thermal image or live camera</SelectItem>
                <SelectItem value="both">RGB + thermal images</SelectItem>
              </SelectContent>
            </Select>
            <div className="capture-actions">
              {(source === "rgb" || source === "both") && <button className="camera-action" onClick={() => openCamera("rgb")}><Camera size={19} /><span><b>Scan RGB live</b><small>Use device camera</small></span></button>}
              {(source === "thermal" || source === "both") && <button className="camera-action thermal-action" onClick={() => openCamera("thermal")}><Thermometer size={19} /><span><b>Scan thermal live</b><small>Use thermal camera</small></span></button>}
            </div>
            <div className="upload-grid">
            {(source === "rgb" || source === "both") && <div className="drop" onClick={() => input.current?.click()}>
              <input
                ref={input}
                type="file"
                accept="image/*"
                onChange={upload}
                hidden
              />
              <CloudUpload size={24} />
              <b>Upload RGB image</b>
              <span>Browse a sugarcane leaf photo</span>
              <small>Metadata is removed automatically</small>
            </div>}
            <div className="preview">
              <img src={image} alt="Uploaded sugarcane leaf RGB preview" />
              <span>
                <FileImage size={12} /> RGB camera image
              </span>
              <p>
                RGB frame ready{" "}
                <b>
                  <Check size={12} /> Ready
                </b>
              </p>
            </div>
            </div>
            {source !== "rgb" && <div className="thermal">
            <span>
              <Thermometer size={20} />
            </span>
            <div>
              <b>
                Add thermal image <small>OPTIONAL</small>
              </b>
              <p>
                {thermalImage
                  ? "Thermal camera frame ready for analysis."
                  : "Reveal heat stress invisible to the naked eye."}
              </p>
            </div>
            <button
              className={thermal ? "on" : ""}
              onClick={() => setThermal(!thermal)}
            >
              <i />
            </button>
            </div>}
            {thermal && source !== "rgb" && (
            <div className="thermal-capture">
              <div
                className="thermal-drop"
                onClick={() => thermalInput.current?.click()}
              >
                <input
                  ref={thermalInput}
                  type="file"
                  accept="image/*"
                  onChange={uploadThermal}
                  hidden
                />
                <Thermometer size={17} />
                <span>
                  {thermalImage
                    ? "Replace thermal frame"
                    : "Upload thermal frame"}
                </span>
              </div>
              {thermalImage && (
                <img src={thermalImage} alt="Uploaded thermal leaf preview" />
              )}
            </div>
            )}
          </div>
          <button className="primary scan" onClick={scan}>
            <ScanLine size={17} /> Analyze sugarcane leaf{" "}
            <ArrowRight size={15} />
          </button>
        </section>
      </div>
      {cameraOpen && (
        <div className="camera-modal">
          <div className="camera-card">
            <div className="camera-head">
              <div>
                <small className="kicker">
                  <Camera size={14} /> LIVE {cameraMode.toUpperCase()} CAMERA
                </small>
                <h3>Frame the sugarcane leaf</h3>
              </div>
              <button onClick={stopCamera} aria-label="Close camera">
                <X size={18} />
              </button>
            </div>
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline muted />
              <div className="camera-reticle" />
              {cameraError && <p>{cameraError}</p>}
            </div>
            <button className="primary camera-shutter" onClick={captureFrame}>
              <Camera size={18} /> Capture {cameraMode} frame
            </button>
          </div>
        </div>
      )}
    </>
  );
}
function Analyzing({ image, progress, thermal }) {
  return (
    <section className="panel analysis">
      <div className="analysis-head">
        <small className="kicker">
          <Activity size={14} /> LIVE ANALYSIS
        </small>
        <span>Usually takes 2-3 seconds</span>
      </div>
      <div className="analysis-image">
        <img src={image} alt="Leaf sample being analyzed" />
        <div className="beam" />
        <div className="analysis-copy">
          <span>
            <ScanLine size={21} />
          </span>
          <b>Scanning leaf markers</b>
          <small>
            {thermal
              ? "Comparing RGB + thermal layers"
              : "Reading RGB leaf structure"}
          </small>
        </div>
      </div>
      <div className="progress">
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className="analysis-foot">
        <span>Analyzing sample...</span>
        <b>{progress}%</b>
      </div>
    </section>
  );
}
function Result({
  image,
  thermalImage,
  result,
  open,
  setOpen,
  done,
  setDone,
  speechLanguage,
  setSpeechLanguage,
  reset,
}) {
  const steps = [
    ["Remove affected leaves", Leaf],
    ["Apply recommended fungicide", ShieldCheck],
    ["Maintain field drainage", Droplets],
  ];
  const [speaking, setSpeaking] = useState(false);
  const speech = speechLanguages[speechLanguage];

  const readTreatment = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      [speech.intro, ...speech.steps].join(" "),
    );
    utterance.lang = speech.locale;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return (
    <div className="result-layout">
      <section>
        <div className="result-title">
          <div>
            <small className="kicker">
              <ShieldCheck size={14} /> ANALYSIS COMPLETE
            </small>
            <h2>
              Your sugarcane leaf is showing signs of <em>moderate stress.</em>
            </h2>
          </div>
          <button className="link" onClick={reset}>
            <ScanLine size={15} /> New scan
          </button>
        </div>
        <div className="panel result">
          <div className="result-image">
            <div className="result-image-grid">
              <figure>
                <img src={image} alt="Analyzed sugarcane RGB leaf" />
                <figcaption>
                  <FileImage size={12} /> RGB camera
                </figcaption>
              </figure>
              <figure className="thermal-figure">
                <img src={thermalImage} alt="Analyzed sugarcane thermal leaf" />
                <figcaption>
                  <Thermometer size={12} /> Thermal camera
                </figcaption>
              </figure>
            </div>
            <span>
              <Sparkles size={12} /> Sugarcane-only analysis
            </span>
          </div>
          <div className="details">
            <small className={`badge ${result.color}`}>
              ● {result.severity} severity
            </small>
            <h3>Likely {result.name}</h3>
            <p>{result.description}</p>
            <div className="confidence">
              <div>
                <b>{result.confidence}%</b>
                <small>confidence</small>
              </div>
              <p>
                <strong>ResNet model prediction</strong>
                <br />
                Compared against 7 sugarcane disease classes
                <br />
                and 12,840 field samples
              </p>
            </div>
            <small className="meta">
              <CalendarDays size={13} /> 14 Sep 2026, 09:42{" "}
              <Thermometer size={13} /> RGB + thermal
            </small>
          </div>
        </div>
      </section>
      <section className="panel treatment">
        <div className="treatment-head">
          <button onClick={() => setOpen(!open)}>
          <span>
            <ShieldCheck size={19} />
          </span>
          <div>
            <small className="kicker">RECOMMENDED ACTIONS</small>
            <h3>Treatment plan</h3>
          </div>
          <ChevronDown className={open ? "rotate" : ""} size={19} />
          </button>
          <div className="voice-controls">
            <label htmlFor="speech-language">Language</label>
            <select
              id="speech-language"
              value={speechLanguage}
              onChange={(event) => setSpeechLanguage(event.target.value)}
            >
              {Object.entries(speechLanguages).map(([code, item]) => (
                <option key={code} value={code}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              className="voice-button"
              onClick={readTreatment}
              aria-label={speaking ? "Stop reading treatment plan" : "Read treatment plan aloud"}
              title={speaking ? "Stop reading" : "Read aloud"}
            >
              {speaking ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="treatment-body">
            <p>
              Act early to protect the surrounding crop. Complete these steps
              within the next 48 hours.
            </p>
            {steps.map(([label, Icon], index) => (
              <button
                className="check"
                key={label}
                onClick={() =>
                  setDone(
                    done.includes(index)
                      ? done.filter((x) => x !== index)
                      : [...done, index],
                  )
                }
              >
                <i>{done.includes(index) && <Check size={12} />}</i>
                <Icon size={16} />
                <span>
                  <b>{label}</b>
                  <small>
                    {index === 0
                      ? "Cut 30 cm below the visible lesion."
                      : index === 1
                        ? "Treat the surrounding area within 24 hours."
                        : "Clear standing water and keep root zones aerated."}
                  </small>
                </span>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
function HistoryView() {
  const data = [
    { d: "Today, 09:42", n: "Rust", s: "Moderate", c: "amber" },
    { d: "Yesterday, 16:18", n: "Healthy", s: "Healthy", c: "green" },
    { d: "12 Sep 2026, 11:07", n: "Red Rot", s: "Severe", c: "red" },
    { d: "10 Sep 2026, 08:53", n: "Yellow Leaf", s: "Moderate", c: "amber" },
  ];
  return (
    <div className="view">
      <div className="view-head">
        <div>
          <small className="kicker">
            <History size={14} /> FIELD RECORDS
          </small>
          <h1>Scan history</h1>
          <p>Every scan tells you more about your field.</p>
        </div>
        <button className="primary">
          <Upload size={15} /> Export report
        </button>
      </div>
      <div className="history-grid">
        <section className="panel list">
          <div className="panel-head">
            <div>
              <h2>Recent activity</h2>
              <p>12 scans across 3 fields</p>
            </div>
            <MoreHorizontal size={18} />
          </div>
          {data.map((item) => (
            <div className="history-item" key={item.d}>
              <img
                src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=200&q=75"
                alt=""
              />
              <div>
                <b>{item.n}</b>
                <small className={`badge ${item.c}`}>● {item.s}</small>
                <p>North 40 · {item.d}</p>
              </div>
              <strong>88.2%</strong>
            </div>
          ))}
        </section>
        <Trend />
      </div>
    </div>
  );
}
function Trend() {
  const data = [
    { d: "04 Sep", h: 72 },
    { d: "06 Sep", h: 76 },
    { d: "08 Sep", h: 74 },
    { d: "10 Sep", h: 81 },
    { d: "12 Sep", h: 85 },
    { d: "14 Sep", h: 89 },
  ];
  return (
    <section className="panel trend">
      <div className="panel-head">
        <div>
          <small className="kicker">
            <Activity size={14} /> FIELD HEALTH
          </small>
          <h2>Health trend</h2>
          <p>Average crop health across Northfield farm</p>
        </div>
        <button className="select">
          Last 14 days <ChevronDown size={14} />
        </button>
      </div>
      <div className="score">
        <b>89</b>
        <span>
          /100 <em>+6.2%</em>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={245}>
        <LineChart
          data={data}
          margin={{ top: 16, right: 5, left: -25, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#e7eee9" />
          <XAxis
            dataKey="d"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#82918a", fontSize: 10 }}
          />
          <YAxis
            domain={[60, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#82918a", fontSize: 10 }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="h"
            stroke="#1b8760"
            strokeWidth={3}
            dot={{ r: 4, fill: "#fff", stroke: "#1b8760", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
function InsightsView() {
  const cards = [
    ["Accuracy", "94.8%"],
    ["Precision", "92.6%"],
    ["Recall", "91.3%"],
    ["F1 score", "91.9%"],
  ];
  return (
    <div className="view">
      <div className="view-head">
        <div>
          <small className="kicker">
            <BarChart3 size={14} /> MODEL PERFORMANCE
          </small>
          <h1>Field insights</h1>
          <p>
            A clear view of how AgriScan is performing across your operation.
          </p>
        </div>
        <button className="select">
          <CalendarDays size={14} /> September 2026 <ChevronDown size={14} />
        </button>
      </div>
      <div className="metrics">
        {cards.map(([label, value]) => (
          <section className="panel metric" key={label}>
            <span>{label}</span>
            <b>{value}</b>
            <small>
              <em>+2.4%</em> vs last month
            </small>
          </section>
        ))}
      </div>
      <div className="insights-grid">
        <section className="panel matrix">
          <div className="panel-head">
            <div>
              <h2>Confusion matrix</h2>
              <p>Prediction accuracy by disease class</p>
            </div>
            <MoreHorizontal size={18} />
          </div>
          <div className="matrix-grid">
            <span />
            <b>Healthy</b>
            <b>Red Rot</b>
            <b>Rust</b>
            <b>Mosaic</b>
            <b>Healthy</b>
            <i>97</i>
            <i>1</i>
            <i>1</i>
            <i>1</i>
            <b>Red Rot</b>
            <i>2</i>
            <i>93</i>
            <i>3</i>
            <i>2</i>
            <b>Rust</b>
            <i>1</i>
            <i>2</i>
            <i>94</i>
            <i>3</i>
            <b>Mosaic</b>
            <i>2</i>
            <i>1</i>
            <i>2</i>
            <i>95</i>
          </div>
        </section>
        <section className="panel aggregate">
          <div className="panel-head">
            <div>
              <small className="kicker">
                <Leaf size={14} /> OPERATION OVERVIEW
              </small>
              <h2>Multi-field health</h2>
              <p>Current status by growing area</p>
            </div>
          </div>
          {[
            "North 40|845 scans · 42 hectares|92|Excellent",
            "Riverbend|621 scans · 31 hectares|87|Good",
            "East Block|402 scans · 18 hectares|76|Monitor",
          ].map((row) => {
            const [name, detail, score, status] = row.split("|");
            return (
              <div className="field" key={name}>
                <span>
                  <Leaf size={16} />
                </span>
                <div>
                  <b>{name}</b>
                  <small>{detail}</small>
                </div>
                <strong>
                  {score}
                  <small>{status}</small>
                </strong>
              </div>
            );
          })}
          <footer>
            Total monitored area <b>91 ha</b>
            <em>+12% this season</em>
          </footer>
        </section>
      </div>
    </div>
  );
}

export default App;
