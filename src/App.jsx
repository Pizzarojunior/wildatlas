import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { feature } from 'topojson-client';
import countries from 'world-atlas/countries-110m.json';
import {
  ArrowDownRight,
  ArrowUpRight,
  AudioLines,
  Bird,
  ChevronDown,
  CircleHelp,
  Compass,
  Globe2,
  Headphones,
  Leaf,
  MapPin,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Volume2,
  Waves,
  Wind,
  X,
} from 'lucide-react';

const species = [
  {
    id: 'tern',
    name: 'Arctic tern',
    plural: 'Arctic terns',
    latin: 'Sterna paradisaea',
    group: 'BIRD',
    status: 'Least Concern',
    statusCode: 'LC',
    color: '#ef805e',
    start: [-21.9, 64.1],
    end: [20, -75],
    current: [-31, 10],
    routeName: 'Iceland to Antarctic coast',
    distance: '70,000 km',
    note: 'The longest migration of any animal',
    icon: Bird,
  },
  {
    id: 'humpback',
    name: 'Humpback whale',
    plural: 'Humpback whales',
    latin: 'Megaptera novaeangliae',
    group: 'MARINE',
    status: 'Least Concern',
    statusCode: 'LC',
    color: '#e5a843',
    start: [-149.9, 61.2],
    end: [-155.6, 19.6],
    current: [-151, 42],
    routeName: 'Alaska to Hawaiian islands',
    distance: '4,800 km',
    note: 'A round-trip powered by song',
    icon: Waves,
  },
  {
    id: 'monarch',
    name: 'Monarch butterfly',
    plural: 'Monarch butterflies',
    latin: 'Danaus plexippus',
    group: 'INSECT',
    status: 'Endangered',
    statusCode: 'EN',
    color: '#78a66c',
    start: [-99.1, 49.9],
    end: [-100.3, 19.6],
    current: [-99.7, 35],
    routeName: 'Great Lakes to central Mexico',
    distance: '4,500 km',
    note: 'A multi-generation journey',
    icon: Leaf,
  },
];

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const soundscapeFrequencies = {
  'Coastal marsh': [174.6, 220, 261.6],
  'Open ocean': [110, 164.8, 196],
  'Alpine wind': [220, 277.2, 329.6],
};
const countryFeatures = feature(countries, countries.objects.countries).features;

function getRoutePoints(animal) {
  const interpolate = d3.geoInterpolate(animal.start, animal.end);
  return d3.range(0, 1.001, 1 / 64).map((progress) => interpolate(progress));
}

function MigrationMap({ activeAnimal, month, onSelectAnimal }) {
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const [size, setSize] = useState({ width: 850, height: 480 });

  useEffect(() => {
    const host = svgRef.current?.parentElement;
    if (!host) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([1, 5]).on('zoom', (event) => {
      svg.select('.map-world').attr('transform', event.transform);
    });
    zoomRef.current = zoom;
    svg.call(zoom).on('dblclick.zoom', null);
    return () => svg.on('.zoom', null);
  }, []);

  const projection = d3.geoNaturalEarth1().fitExtent([[18, 26], [size.width - 18, size.height - 22]], { type: 'Sphere' });
  const path = d3.geoPath(projection);
  const routePoints = getRoutePoints(activeAnimal);
  const routePath = path({ type: 'LineString', coordinates: routePoints });
  const activeProgress = ((month + 1) % 12) / 12;
  const currentPosition = d3.geoInterpolate(activeAnimal.start, activeAnimal.end)(activeProgress);
  const projectedPosition = projection(currentPosition);
  const startPosition = projection(activeAnimal.start);
  const endPosition = projection(activeAnimal.end);
  const graticule = d3.geoGraticule10();

  function zoomBy(factor) {
    d3.select(svgRef.current).transition().duration(260).call(zoomRef.current.scaleBy, factor);
  }

  function resetZoom() {
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity);
  }

  return (
    <div className="map-wrap">
      <svg ref={svgRef} className="migration-map" viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label={`${activeAnimal.name} migration route map`}>
        <defs>
          <pattern id="ocean-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#abc9c1" opacity=".34" />
          </pattern>
          <filter id="marker-glow" x="-300%" y="-300%" width="600%" height="600%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="route-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={activeAnimal.color} stopOpacity=".3" />
            <stop offset="48%" stopColor={activeAnimal.color} />
            <stop offset="100%" stopColor={activeAnimal.color} stopOpacity=".35" />
          </linearGradient>
        </defs>
        <rect width={size.width} height={size.height} fill="#e6f0eb" />
        <rect width={size.width} height={size.height} fill="url(#ocean-grid)" />
        <g className="map-world">
          <path className="sphere" d={path({ type: 'Sphere' })} />
          <path className="graticule" d={path(graticule)} />
          {countryFeatures.map((country, index) => (
            <path className="country-shape" d={path(country)} key={country.id ?? index} />
          ))}
          <path className="route-halo" d={routePath} stroke={activeAnimal.color} />
          <path className="route-stroke" d={routePath} stroke="url(#route-line)" />
          <path className="route-trail" d={path({ type: 'LineString', coordinates: routePoints.slice(0, Math.max(2, Math.ceil(activeProgress * routePoints.length))) })} stroke={activeAnimal.color} />
          <circle className="route-endpoint" cx={startPosition?.[0]} cy={startPosition?.[1]} r="4" fill={activeAnimal.color} />
          <circle className="route-endpoint" cx={endPosition?.[0]} cy={endPosition?.[1]} r="4" fill={activeAnimal.color} />
          {projectedPosition && (
            <g className="animal-marker" transform={`translate(${projectedPosition[0]},${projectedPosition[1]})`} filter="url(#marker-glow)">
              <circle r="11" fill={activeAnimal.color} opacity=".18" />
              <circle r="5.5" fill={activeAnimal.color} stroke="#fff" strokeWidth="2.5" />
            </g>
          )}
          {species.filter((animal) => animal.id !== activeAnimal.id).map((animal) => {
            const point = projection(animal.current);
            return point ? (
              <g key={animal.id} className="quiet-marker" transform={`translate(${point[0]},${point[1]})`} onClick={() => onSelectAnimal(animal.id)} role="button" tabIndex="0" aria-label={`Select ${animal.name}`}>
                <circle r="10" fill={animal.color} opacity=".16" />
                <circle r="3.5" fill={animal.color} />
              </g>
            ) : null;
          })}
        </g>
        <g className="map-coordinate" transform={`translate(20,${size.height - 21})`}>
          <circle r="3" fill={activeAnimal.color} /><text x="9" y="4">SIMULATED POSITION · {monthShort[month]}</text>
        </g>
      </svg>
      <div className="map-tools" aria-label="Map controls">
        <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => zoomBy(1.35)}><Plus size={16} /></button>
        <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => zoomBy(0.74)}><Minus size={16} /></button>
        <span className="map-tool-rule" />
        <button type="button" aria-label="Reset map view" title="Reset map view" onClick={resetZoom}><RotateCcw size={15} /></button>
      </div>
      <div className="map-attribution">MAP DATA · NATURAL EARTH</div>
      <div className="map-label label-north-america">NORTH AMERICA</div>
      <div className="map-label label-atlantic">ATLANTIC OCEAN</div>
      <div className="map-label label-europe">EUROPE</div>
    </div>
  );
}

function SoundscapePlayer() {
  const [playing, setPlaying] = useState(false);
  const [soundscape, setSoundscape] = useState('Coastal marsh');
  const [volume, setVolume] = useState(38);
  const audioRef = useRef(null);

  useEffect(() => () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.oscillators.forEach((oscillator) => oscillator.stop());
    audio.context.close();
  }, []);

  function stopAudio() {
    const audio = audioRef.current;
    if (audio) {
      audio.oscillators.forEach((oscillator) => oscillator.stop());
      audio.context.close();
      audioRef.current = null;
    }
    setPlaying(false);
  }

  async function toggleAudio() {
    if (playing) {
      stopAudio();
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    await context.resume();
    const master = context.createGain();
    master.gain.value = volume / 100 * 0.12;
    master.connect(context.destination);
    const oscillators = [];
    soundscapeFrequencies[soundscape].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.3 : 0.06;
      oscillator.connect(gain).connect(master);
      oscillator.start();
      oscillators.push(oscillator);
    });
    audioRef.current = { context, oscillators, master };
    setPlaying(true);
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.master.gain.setTargetAtTime(volume / 100 * 0.12, audioRef.current.context.currentTime, 0.08);
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) soundscapeFrequencies[soundscape].forEach((frequency, index) => audio.oscillators[index].frequency.setTargetAtTime(frequency, audio.context.currentTime, 0.35));
  }, [soundscape]);

  return (
    <section className="sound-panel" aria-labelledby="sound-title">
      <div className="sound-heading">
        <div className="sound-icon"><AudioLines size={17} /></div>
        <div><p className="eyebrow">LISTEN IN</p><h3 id="sound-title">Ecosystem audio room</h3></div>
        <button className="icon-button sound-info" type="button" title="About soundscapes" aria-label="About soundscapes"><CircleHelp size={16} /></button>
      </div>
      <div className="sound-player-row">
        <button className={`play-button${playing ? ' is-playing' : ''}`} type="button" onClick={toggleAudio} aria-label={playing ? 'Pause soundscape' : 'Play soundscape'}>
          {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
        </button>
        <div className="sound-track">
          <div className="sound-track-top"><span>{soundscape}</span><span className="live-dot">{playing ? 'PLAYING' : 'READY'}</span></div>
          <div className={`waveform${playing ? ' waveform-active' : ''}`} aria-hidden="true">{Array.from({ length: 42 }, (_, index) => <i key={index} style={{ '--wave-height': `${12 + ((index * 19 + 11) % 27)}%`, '--wave-delay': `${(index % 13) * -0.12}s` }} />)}</div>
        </div>
      </div>
      <div className="sound-controls">
        <label className="sound-select-wrap">
          <span className="sr-only">Choose an ecosystem ambience</span>
          <select value={soundscape} onChange={(event) => setSoundscape(event.target.value)}>
            <option>Coastal marsh</option><option>Open ocean</option><option>Alpine wind</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <div className="volume-control"><Volume2 size={15} /><input aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></div>
      </div>
      <div className="sound-caption"><Wind size={12} /> In-browser ambient tones · Web Audio</div>
    </section>
  );
}

function SpeciesDirectoryPage() {
  return (
    <main className="page-content subpage">
      <div className="subpage-kicker"><span className="kicker-line" /> FIELD GUIDE NO. 02 <span className="kicker-dot">·</span> SPECIES</div>
      <div className="subpage-heading"><div><h1>Meet the travelers.</h1><p>Every route belongs to a remarkable life. Explore the featured species and the journeys that connect their habitats.</p></div><span className="directory-total">03 <small>FEATURED SPECIES</small></span></div>
      <div className="species-directory">
        {species.map((animal, index) => {
          const AnimalIcon = animal.icon;
          return (
            <Link key={animal.id} className="directory-card" to={`/species/${animal.id}`}>
              <div className="directory-card-top"><span className="directory-index">FIELD FILE / 0{index + 1}</span><span className={`status-badge status-${animal.statusCode.toLowerCase()}`} title={`IUCN status: ${animal.status}`}>{animal.statusCode}</span></div>
              <span className="directory-icon" style={{ '--species-color': animal.color }}><AnimalIcon size={24} /></span>
              <h2>{animal.name}</h2><em>{animal.latin}</em>
              <p>{animal.routeName}</p>
              <div className="directory-card-footer"><span>{animal.distance}</span><span>OPEN FIELD FILE <ArrowUpRight size={14} /></span></div>
            </Link>
          );
        })}
      </div>
      <p className="page-source-note">Conservation categories are shown as sample IUCN Red List labels. Migration routes are illustrative, not live tracking data.</p>
    </main>
  );
}

function SpeciesProfilePage({ month, setMonth }) {
  const { speciesId } = useParams();
  const navigate = useNavigate();
  const animal = species.find((entry) => entry.id === speciesId);
  if (!animal) return <Navigate to="/species" replace />;
  const AnimalIcon = animal.icon;

  return (
    <main className="page-content subpage profile-page">
      <Link className="back-link" to="/species"><ArrowDownRight className="back-arrow" size={14} /> ALL SPECIES</Link>
      <div className="profile-heading">
        <div><div className="subpage-kicker"><span className="kicker-line" /> FIELD FILE <span className="kicker-dot">·</span> {animal.group}</div><h1>{animal.name}</h1><em>{animal.latin}</em></div>
        <span className={`profile-status status-${animal.statusCode.toLowerCase()}`}><span className={`status-badge status-${animal.statusCode.toLowerCase()}`}>{animal.statusCode}</span> IUCN · {animal.status}</span>
      </div>
      <div className="profile-layout">
        <section className="profile-map-panel">
          <div className="profile-map-heading"><div><p className="eyebrow">SEASONAL MIGRATION</p><h2>{animal.routeName}</h2></div><span>{animal.distance}</span></div>
          <MigrationMap activeAnimal={animal} month={month} onSelectAnimal={(id) => navigate(`/species/${id}`)} />
          <div className="profile-month"><label htmlFor="profile-month">ROUTE POSITION · {monthNames[month].toUpperCase()}</label><input id="profile-month" type="range" min="0" max="11" value={month} onChange={(event) => setMonth(Number(event.target.value))} style={{ accentColor: animal.color }} /></div>
        </section>
        <aside className="profile-facts">
          <div className="profile-icon" style={{ '--species-color': animal.color }}><AnimalIcon size={24} /></div>
          <p className="eyebrow">THE JOURNEY</p><h2>{animal.note}</h2>
          <p className="profile-description">{animal.plural} travel between essential feeding and breeding habitats. Their seasonal movement links distant ecosystems and reflects the conditions along the route.</p>
          <div className="profile-fact-row"><span>ANIMAL GROUP</span><strong>{animal.group}</strong></div>
          <div className="profile-fact-row"><span>MIGRATION DISTANCE</span><strong>{animal.distance}</strong></div>
          <div className="profile-fact-row"><span>CONSERVATION</span><strong>{animal.status}</strong></div>
          <Link className="profile-explore-link" to="/explore">OPEN IN THE ATLAS <ArrowUpRight size={14} /></Link>
        </aside>
      </div>
    </main>
  );
}

function SoundscapesPage() {
  return (
    <main className="page-content subpage soundscape-page">
      <div className="subpage-kicker"><span className="kicker-line" /> FIELD GUIDE NO. 03 <span className="kicker-dot">·</span> SOUND ROOM</div>
      <div className="subpage-heading soundscape-heading"><div><h1>Listen to a place.</h1><p>Choose an ecosystem and settle into a quiet ambient preview while you explore the atlas.</p></div><span className="sound-heading-mark"><Headphones size={22} /></span></div>
      <div className="sound-room-grid">
        <SoundscapePlayer />
        <aside className="sound-room-note"><p className="eyebrow">A SMALL PAUSE IN THE FIELD</p><h2>Listen closer.<br />Look wider.</h2><p>Each setting shifts the tone of the room. Keep the atlas open as you move between species and seasons.</p><Link to="/explore">RETURN TO THE MAP <ArrowUpRight size={14} /></Link></aside>
      </div>
      <div className="sound-library-heading"><div><p className="eyebrow">THREE ECOSYSTEMS</p><h2>Choose your listening field</h2></div><span>AMBIENT PREVIEWS</span></div>
      <div className="sound-library">
        <article><Waves size={18} /><span>01 / COASTAL</span><h3>Coastal marsh</h3><p>Open, slow-moving tones inspired by tidal edges.</p></article>
        <article><Volume2 size={18} /><span>02 / MARINE</span><h3>Open ocean</h3><p>Low, spacious notes for deep water and long passage.</p></article>
        <article><Wind size={18} /><span>03 / ALPINE</span><h3>Alpine wind</h3><p>Clear, higher tones inspired by exposed mountain air.</p></article>
      </div>
      <p className="page-source-note">Audio in this prototype is generated in-browser with the Web Audio API; it is not a wildlife field recording.</p>
    </main>
  );
}

function NotFoundPage() {
  return <main className="page-content subpage not-found"><p className="eyebrow">FIELD GUIDE · LOST PAGE</p><h1>This trail ends here.</h1><Link className="profile-explore-link" to="/explore">BACK TO THE ATLAS <ArrowUpRight size={14} /></Link></main>;
}

function App() {
  const [activeId, setActiveId] = useState('tern');
  const [month, setMonth] = useState(3);
  const [aboutOpen, setAboutOpen] = useState(false);
  const activeAnimal = species.find((animal) => animal.id === activeId) ?? species[0];
  const SpeciesIcon = activeAnimal.icon;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/explore" aria-label="Wild Atlas home">
          <span className="brand-mark"><Compass size={20} strokeWidth={1.8} /></span>
          <span className="brand-name">wild<span>atlas</span></span>
          <span className="brand-divider" />
          <span className="brand-tag">FIELD NOTES FOR A LIVING PLANET</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/explore">Explore</NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/species">Species</NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/soundscapes">Soundscapes</NavLink>
        </nav>
        <button className="about-button" type="button" aria-label="About the atlas" onClick={() => setAboutOpen(true)}><CircleHelp size={16} /><span>About the atlas</span></button>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/explore" replace />} />
        <Route path="/explore" element={<main id="home" className="page-content">
        <section className="intro-row">
          <div className="intro-copy">
            <div className="section-kicker"><span className="kicker-line" /> FIELD GUIDE NO. 01 <span className="kicker-dot">·</span> MIGRATION</div>
            <h1>Follow the wild,<br /><span>in motion.</span></h1>
            <p className="intro-description">Every journey tells a story about the health of our shared planet. Trace the paths, meet the travelers, and see what’s at stake.</p>
          </div>
          <div className="intro-stat"><span className="stat-icon"><Globe2 size={19} /></span><div><strong>03</strong><span>featured journeys</span></div></div>
        </section>

        <section className="explorer-layout" id="explorer-map" aria-label="Migration explorer">
          <aside className="species-panel" id="travelers-panel">
            <div className="panel-heading"><div><p className="eyebrow">THE TRAVELERS</p><h2>Choose a journey</h2></div><span className="count-pill">03</span></div>
            <div className="species-list">
              {species.map((animal, index) => {
                const AnimalIcon = animal.icon;
                return (
                  <button key={animal.id} type="button" className={`species-row${activeId === animal.id ? ' selected' : ''}`} onClick={() => setActiveId(animal.id)} aria-pressed={activeId === animal.id}>
                    <span className="species-index">0{index + 1}</span>
                    <span className="species-symbol" style={{ '--species-color': animal.color }}><AnimalIcon size={19} strokeWidth={1.8} /></span>
                    <span className="species-copy"><strong>{animal.name}</strong><em>{animal.latin}</em></span>
                    <span className={`status-badge status-${animal.statusCode.toLowerCase()}`} title={`IUCN status: ${animal.status}`}>{animal.statusCode}</span>
                  </button>
                );
              })}
            </div>
            <div className="panel-separator" />
            <div className="route-summary">
              <div className="route-title-row"><span className="route-color" style={{ background: activeAnimal.color }} /><span className="eyebrow">SELECTED ROUTE</span><span className="route-group">{activeAnimal.group}</span></div>
              <div className="route-animal"><span className="route-animal-icon" style={{ color: activeAnimal.color }}><SpeciesIcon size={22} /></span><div><h3>{activeAnimal.routeName}</h3><p>{activeAnimal.distance} <span>·</span> {activeAnimal.note}</p></div></div>
              <div className="route-waypoints"><div><span className="waypoint-dot origin" style={{ borderColor: activeAnimal.color }} /><span>ORIGIN</span></div><span className="waypoint-dash" /><div><MapPin size={12} /><span>DESTINATION</span></div></div>
              <div className="status-note"><span className={`status-badge status-${activeAnimal.statusCode.toLowerCase()}`}>{activeAnimal.statusCode}</span><span>IUCN Red List · {activeAnimal.status}</span><ArrowUpRight size={13} /></div>
            </div>
            <div className="panel-footnote"><span className="footnote-leaf"><Leaf size={15} /></span><span>Migration routes are vital signs for the ecosystems we all depend on.</span></div>
          </aside>

          <section className="map-panel" aria-label="Interactive migration map">
            <div className="map-header">
              <div><p className="eyebrow">GLOBAL MIGRATION ATLAS</p><h2>One planet. Many paths.</h2></div>
              <button className="map-mode" type="button" aria-label="Map view, global"><Globe2 size={14} /> GLOBAL <ChevronDown size={13} /></button>
            </div>
            <MigrationMap activeAnimal={activeAnimal} month={month} onSelectAnimal={setActiveId} />
            <div className="map-legend"><span><i className="legend-line" style={{ background: activeAnimal.color }} /> Active migration path</span><span><i className="legend-pulse" style={{ background: activeAnimal.color }} /> Current position</span><span className="map-legend-note">SCHEMATIC ROUTE · NOT TO SCALE</span></div>
            <div className="timeline">
              <div className="timeline-top"><div><p className="eyebrow">SEASONAL MOVEMENT</p><strong>{monthNames[month]} <span>·</span> {new Date().getFullYear()}</strong></div><div className="timeline-actions"><span className="timeline-period">12 MONTHS</span><button type="button" aria-label="Previous month" onClick={() => setMonth((month + 10) % 12)}><ArrowDownRight className="previous-month" size={15} /></button><button type="button" aria-label="Next month" onClick={() => setMonth((month + 1) % 12)}><ArrowUpRight size={15} /></button></div></div>
              <div className="range-wrap"><input aria-label="Migration timeline month" type="range" min="0" max="11" value={month} onChange={(event) => setMonth(Number(event.target.value))} style={{ '--range-progress': `${month / 11 * 100}%`, '--range-color': activeAnimal.color }} /><div className="month-ticks" aria-hidden="true">{monthShort.map((label, index) => <button key={label} type="button" className={month === index ? 'current' : ''} onClick={() => setMonth(index)}>{label}</button>)}</div></div>
              <div className="timeline-foot"><span><span className="timeline-live" /> SIMULATED POSITION UPDATES WITH SEASON</span><button type="button" onClick={() => setMonth(3)}>RESET TO APRIL <RotateCcw size={12} /></button></div>
            </div>
          </section>
        </section>

        <section className="lower-grid" aria-label="Field notes and soundscapes">
          <article className="field-note">
            <div className="note-topline"><span className="eyebrow">FIELD NOTE <span className="note-number">/ 001</span></span><span className="note-date">SEASONAL SIGNAL</span></div>
            <div className="note-body"><span className="note-icon"><ArrowUpRight size={17} /></span><div><h3>A journey measured in daylight</h3><p>{activeAnimal.plural} read the changing length of days like a compass. This route shifts with the seasons, connecting distant habitats into one living system.</p></div></div>
            <div className="note-bottom"><span>ECOSYSTEM CONNECTION</span><div className="ecosystem-tags"><span>OPEN OCEAN</span><span>POLAR COAST</span></div></div>
          </article>
          <SoundscapePlayer />
          <aside className="conservation-callout">
            <div className="callout-top"><span className="callout-icon"><Leaf size={17} /></span><span className="eyebrow">CONSERVATION WATCH</span><span className="callout-count">01 / 03</span></div>
            <h3>Routes can disappear<br />before species do.</h3>
            <p>Habitat loss and shifting climates are changing ancient migration corridors.</p>
            <button type="button" onClick={() => setActiveId('monarch')}>MEET AN AT-RISK TRAVELER <ArrowUpRight size={14} /></button>
          </aside>
        </section>
        <footer className="page-footer"><span>WILD ATLAS <i>·</i> A FIELD GUIDE TO MOVEMENT</span><span>SPECIES STATUS: IUCN RED LIST <i>·</i> ROUTES: ILLUSTRATIVE</span></footer>
        </main>} />
        <Route path="/species" element={<SpeciesDirectoryPage />} />
        <Route path="/species/:speciesId" element={<SpeciesProfilePage month={month} setMonth={setMonth} />} />
        <Route path="/soundscapes" element={<SoundscapesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {aboutOpen && <div className="modal-backdrop" role="presentation" onClick={() => setAboutOpen(false)}><section className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="Close" onClick={() => setAboutOpen(false)}><X size={18} /></button><div className="modal-mark"><Compass size={22} /></div><p className="eyebrow">A LIVING FIELD GUIDE</p><h2 id="about-title">The planet moves.<br />We can move with it.</h2><p>Wild Atlas brings migration patterns and conservation context together in one place. Routes shown here are illustrative; species status labels follow the IUCN Red List categories.</p><div className="modal-disclaimer"><span className="status-badge status-en">EN</span><span>Endangered · facing a very high risk of extinction in the wild</span></div><button className="modal-done" type="button" onClick={() => setAboutOpen(false)}>BACK TO THE ATLAS <ArrowUpRight size={14} /></button></section></div>}
    </div>
  );
}

export default App;