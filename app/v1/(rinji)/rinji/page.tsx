'use client'

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Brain, 
  Plus, 
  Trash2, 
  Search, 
  Calendar,
  Share2,
  FileText,
  Check,
  X,
  Footprints
} from "lucide-react";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";
import BackComponent from "@/components/BackComponent";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  links: string[]; // Array of other Note IDs
}

const DEFAULT_NOTES: Note[] = [
  {
    id: "n1",
    title: "TypeScript Secrets",
    content: "Store complex types, generics, and keyof/typeof patterns. Always use strict modes for second brain projects.",
    updatedAt: "2026-07-15T02:00:00.000Z",
    links: ["n2"]
  },
  {
    id: "n2",
    title: "Next.js Core Architecture",
    content: "Next.js pages are server rendered by default. Client side logic requires the 'use client' directive.",
    updatedAt: "2026-07-15T01:50:00.000Z",
    links: []
  },
  {
    id: "n3",
    title: "Cat Nutrition & Treats",
    content: "Feed Rinji standard wet food and snowshoe-specific dietary treats. Keep tuna portioned as rewards.",
    updatedAt: "2026-07-15T01:30:00.000Z",
    links: ["n1"]
  }
];

export default function RinjiBrainPage() {
  const [notes, setNotes] = useState<Note[]>(DEFAULT_NOTES);
  const [activeNoteId, setActiveNoteId] = useState<string>("n1");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("rinji_notes");
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved notes:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("rinji_notes", JSON.stringify(notes));
    }
  }, [notes, isLoaded]);

  // Active Note details
  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // Filtered Notes list
  const filteredNotes = useMemo(() => {
    return notes.filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  // Create a new note
  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "Untitled Thought",
      content: "",
      updatedAt: new Date().toISOString(),
      links: []
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  // Delete a note
  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) {
      alert("Keep at least one thought in Rinji's brain!");
      return;
    }
    const updatedNotes = notes.map(n => ({
      ...n,
      links: n.links.filter(linkId => linkId !== id)
    })).filter(n => n.id !== id);

    setNotes(updatedNotes);
    if (activeNoteId === id) {
      // Find the next available note
      const remaining = updatedNotes[0];
      if (remaining) {
        setActiveNoteId(remaining.id);
      }
    }
  };

  // Update note content
  const handleUpdateNote = (fields: Partial<Note>) => {
    if (!activeNote) return;
    setNotes(notes.map(n => n.id === activeNote.id ? { 
      ...n, 
      ...fields, 
      updatedAt: new Date().toISOString() 
    } : n));
  };

  // Toggle a connection / link between notes
  const handleToggleLink = (targetId: string) => {
    if (!activeNote || activeNote.id === targetId) return;
    
    const isLinked = activeNote.links.includes(targetId);
    let updatedLinks;
    if (isLinked) {
      updatedLinks = activeNote.links.filter(id => id !== targetId);
    } else {
      updatedLinks = [...activeNote.links, targetId];
    }
    handleUpdateNote({ links: updatedLinks });
  };

  // --- Dynamic Yarn Graph Coordinates Generator ---
  const graphNodes = useMemo(() => {
    const center = { x: 175, y: 150 };
    const radius = 95;
    return notes.map((note, idx) => {
      const angle = (idx / notes.length) * 2 * Math.PI;
      return {
        id: note.id,
        title: note.title,
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      };
    });
  }, [notes]);

  const graphLinks = useMemo(() => {
    const paths: Array<{ fromX: number; fromY: number; toX: number; toY: number; id: string }> = [];
    notes.forEach(note => {
      const fromNode = graphNodes.find(gn => gn.id === note.id);
      if (fromNode) {
        note.links.forEach(linkId => {
          const toNode = graphNodes.find(gn => gn.id === linkId);
          if (toNode) {
            paths.push({
              id: `${note.id}-${linkId}`,
              fromX: fromNode.x,
              fromY: fromNode.y,
              toX: toNode.x,
              toY: toNode.y
            });
          }
        });
      }
    });
    return paths;
  }, [graphNodes, notes]);

  return (
    <main className="min-h-screen bg-[#1c1615] text-[#eae3e0] flex flex-col items-center p-4 md:p-6 pt-16 md:pt-20 pb-20 select-none">
      <LoadingScreen mode="in" />
      <BackComponent variant="light" />

      {/* Futuristic Siamese ice-blue glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl w-full flex flex-col space-y-6 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-200 transition-colors mb-2 text-[10px] font-bold uppercase tracking-widest">
              <ArrowLeft className="w-3 h-3" />
              Nino-Verse Hub
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20">
                <Brain className="w-5 h-5 text-sky-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">
                Rinji's Brain<span className="text-sky-400">.</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#28201e] border border-white/5 px-3 py-1.5 rounded-xl">
            <Footprints className="w-4 h-4 text-sky-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Snowshoe Cat Mode</span>
          </div>
        </div>

        {/* Triple Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Panel 1: Thoughts Index (3 columns) */}
          <div className="lg:col-span-3 bg-[#28201e] border border-white/5 rounded-3xl p-5 flex flex-col space-y-4 h-[600px]">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Thoughts Index</h2>
              <button 
                onClick={handleCreateNote}
                className="w-8 h-8 bg-sky-500 hover:bg-sky-600 text-slate-950 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Create a new thought"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
              <input 
                type="text"
                placeholder="Search thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1615] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#eae3e0] focus:outline-none focus:border-sky-500 placeholder-slate-600"
              />
            </div>

            {/* Note List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredNotes.map(n => {
                const isActive = n.id === activeNoteId;
                const noteConnections = n.links.length;
                return (
                  <button
                    key={n.id}
                    onClick={() => setActiveNoteId(n.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isActive 
                        ? "bg-[#1c1615] border-sky-500/40 shadow-inner" 
                        : "bg-transparent border-white/5 hover:bg-[#1c1615]/50"
                    }`}
                  >
                    <span className={`text-xs font-bold leading-tight truncate ${isActive ? "text-sky-400" : "text-[#eae3e0]"}`}>
                      {n.title || "Untitled Thought"}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {n.content || "Scratch something..."}
                    </span>
                    <div className="flex items-center justify-between mt-1 border-t border-white/5 pt-1.5">
                      <span className="text-[8px] font-bold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(n.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {noteConnections > 0 && (
                        <span className="text-[8px] font-black text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-md">
                          {noteConnections} Links
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel 2: The Scratchpad Editor (5 columns) */}
          <div className="lg:col-span-5 bg-[#28201e] border border-white/5 rounded-3xl p-6 flex flex-col space-y-4 h-[600px]">
            {activeNote ? (
              <>
                {/* Note Editor Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Thought</span>
                    <span className="text-[10px] font-bold text-sky-400 mt-0.5 uppercase tracking-wide">Scratchpad</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-slate-950 rounded-xl transition-all cursor-pointer"
                    title="Delete thought"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Title Input */}
                <input 
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNote({ title: e.target.value })}
                  placeholder="Title of this thought..."
                  className="bg-transparent text-xl font-black tracking-tight text-white placeholder-slate-600 focus:outline-none focus:border-b focus:border-white/10 pb-1.5 text-left"
                />

                {/* Content Editor */}
                <textarea
                  value={activeNote.content}
                  onChange={(e) => handleUpdateNote({ content: e.target.value })}
                  placeholder="Scratch details, notes, or raw ideas down here..."
                  className="flex-1 w-full bg-[#1c1615] border border-white/5 rounded-2xl p-4 text-xs text-[#eae3e0] placeholder-slate-650 focus:outline-none focus:border-sky-500/40 resize-none leading-relaxed text-left"
                />

                {/* Connections Control */}
                <div className="relative">
                  <div className="flex items-center justify-between bg-[#1c1615] border border-white/5 px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-sky-400" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Yarn Connections</span>
                    </div>
                    <button 
                      onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                      className="text-[9px] font-black text-sky-400 uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
                    >
                      {activeNote.links.length} Connected
                    </button>
                  </div>

                  {/* Dropdown list of other notes to link */}
                  <AnimatePresence>
                    {showLinkDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-[#28201e] border border-white/10 rounded-2xl shadow-2xl p-3 z-30 space-y-2 max-h-[180px] overflow-y-auto text-left"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Connect to:</span>
                          <button onClick={() => setShowLinkDropdown(false)} className="text-slate-500 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {notes
                          .filter(n => n.id !== activeNote.id)
                          .map(otherNote => {
                            const isLinked = activeNote.links.includes(otherNote.id);
                            return (
                              <button
                                key={otherNote.id}
                                onClick={() => handleToggleLink(otherNote.id)}
                                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#1c1615] transition-all text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                              >
                                <span className="truncate pr-2">{otherNote.title}</span>
                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                  isLinked ? "bg-sky-500 border-sky-500 text-slate-950" : "border-white/10"
                                }`}>
                                  {isLinked && <Check className="w-3 h-3" />}
                                </div>
                              </button>
                            );
                          })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Brain className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-xs text-slate-500">Create a thought to begin scratching!</p>
              </div>
            )}
          </div>

          {/* Panel 3: Interactive Yarn Graph (4 columns) */}
          <div className="lg:col-span-4 bg-[#28201e] border border-white/5 rounded-3xl p-5 flex flex-col space-y-4 h-[600px] relative overflow-hidden">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 text-left">Feline Neural Graph</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 text-left">Visualizing note yarn links</p>
            </div>

            {/* SVG Render Graph */}
            <div className="flex-1 border border-white/5 bg-[#1c1615] rounded-2xl relative overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full min-h-[300px]" viewBox="0 0 350 300">
                {/* Yarn Lines (Connections) */}
                {graphLinks.map(link => {
                  const isActive = activeNote && (link.id.includes(activeNote.id));
                  return (
                    <line 
                      key={link.id}
                      x1={link.fromX}
                      y1={link.fromY}
                      x2={link.toX}
                      y2={link.toY}
                      stroke={isActive ? "#38BDF8" : "rgba(255,255,255,0.06)"}
                      strokeWidth={isActive ? 2 : 1}
                      className="transition-all duration-300"
                    />
                  );
                })}

                {/* Nodes */}
                {graphNodes.map(node => {
                  const isActive = activeNote && node.id === activeNote.id;
                  return (
                    <g 
                      key={node.id} 
                      className="cursor-pointer"
                      onClick={() => setActiveNoteId(node.id)}
                    >
                      {/* Active outer pulse */}
                      {isActive && (
                        <circle 
                          cx={node.x}
                          cy={node.y}
                          r={14}
                          fill="rgba(56,189,248,0.15)"
                          className="animate-ping"
                        />
                      )}
                      
                      {/* Node circle */}
                      <circle 
                        cx={node.x}
                        cy={node.y}
                        r={8}
                        fill={isActive ? "#38BDF8" : "#28201e"}
                        stroke={isActive ? "#eae3e0" : "rgba(255,255,255,0.15)"}
                        strokeWidth={1.5}
                        className="transition-all duration-350"
                      />

                      {/* Text Label */}
                      <text 
                        x={node.x}
                        y={node.y - 12}
                        textAnchor="middle"
                        fill={isActive ? "#38BDF8" : "rgba(255,255,255,0.4)"}
                        className="text-[8px] font-black tracking-tight"
                      >
                        {node.title.length > 12 ? `${node.title.slice(0, 10)}...` : node.title}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Bottom guide text inside graph */}
              <span className="absolute bottom-3 left-4 right-4 text-[8px] font-bold uppercase tracking-widest text-slate-600 pointer-events-none select-none">
                Interactive Mind Graph
              </span>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
