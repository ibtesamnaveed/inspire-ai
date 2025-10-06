const { useState } = React;

function Navbar({ theme, onToggleTheme }) {
  return (
    <div className="navbar container">
      <div className="nav-inner">
        <div className="logo">
          <img src="/logo.png" alt="InspireAI Logo" className="logo-img" />
        </div>
        <div className="brand">InspireAI</div>
      </div>
      <button className="theme-toggle" onClick={onToggleTheme}>
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>
    </div>
  );
}

function InputForm({ onGenerate }) {
  const [prompt, setPrompt] = useState('Fitness');
  const [mode, setMode] = useState('blog');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      await onGenerate(prompt.trim(), mode);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container panel">
      <form onSubmit={handleSubmit}>
        <div className="controls">
          <input
            className="input"
            placeholder="Enter topic e.g. Healthy Food"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <select className="select" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="blog">Blog Title</option>
            <option value="youtube">YouTube Title</option>
            <option value="tweet">Tweet Idea</option>
          </select>
          <button className="button primary" disabled={loading}>
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ResultCard({ text, index, onFavorite, isFavorite }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent('toast', { detail: 'Copied to clipboard' }));
    } catch (_) {}
  };
  return (
    <div className="card">
      <div className="title">{text}</div>
      <div className="muted">Idea #{index + 1}</div>
      <div className="actions">
        <button className="copy-btn" onClick={copy}>Copy</button>
        <button className="copy-btn" onClick={() => onFavorite(text)}>
          {isFavorite ? '★ Saved' : '☆ Save'}
        </button>
      </div>
    </div>
  );
}

function ResultList({ results, favorites, onFavorite }) {
  if (!results.length) return null;
  return (
    <div className="container">
      <div className="results">
        {results.map((t, i) => (
          <ResultCard
            key={i}
            text={t}
            index={i}
            onFavorite={onFavorite}
            isFavorite={favorites.includes(t)}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [results, setResults] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem('inspireai:favorites');
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  });

  const onGenerate = async (prompt, mode) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode }),
      });
      const data = await res.json();
      setResults(Array.isArray(data.ideas) ? data.ideas : []);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  React.useEffect(() => {
    if (theme === 'light') document.body.classList.add('light');
    else document.body.classList.remove('light');
  }, [theme]);

  React.useEffect(() => {
    localStorage.setItem('inspireai:favorites', JSON.stringify(favorites));
  }, [favorites]);

  React.useEffect(() => {
    const handler = (e) => {
      const msg = e.detail || 'Done';
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1600);
    };
    window.addEventListener('toast', handler);
    return () => window.removeEventListener('toast', handler);
  }, []);

  const onFavorite = (text) => {
    setFavorites((prev) => prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]);
    window.dispatchEvent(new CustomEvent('toast', { detail: 'Updated favorites' }));
  };

  return (
    <>
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <div className="hero container">
        <h1>Generate Catchy Ideas with AI</h1>
        <p>Type a topic and get 3–5 titles instantly.</p>
      </div>
      <InputForm onGenerate={onGenerate} />
      {loading ? (
        <div className="container" style={{ display: 'grid', placeItems: 'center', marginTop: 24 }}>
          <div className="spinner" />
        </div>
      ) : (
        <ResultList results={results} favorites={favorites} onFavorite={onFavorite} />
      )}
      {favorites.length > 0 && (
        <div className="container" style={{ marginTop: 24 }}>
          <div className="panel">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Favorites</div>
            <div className="results">
              {favorites.map((t, i) => (
                <ResultCard key={`fav-${i}`} text={t} index={i} onFavorite={onFavorite} isFavorite={true} />
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="footer">Built with ❤️ InspireAI</div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);


