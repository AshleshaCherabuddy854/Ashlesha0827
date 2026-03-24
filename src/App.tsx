import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const BASE_SPEED = 150;

const TRACKS = [
  { id: 1, title: "Neon Pulse", artist: "AI Generator Alpha", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Cybernetic Dreams", artist: "AI Generator Beta", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Synthwave Overdrive", artist: "AI Generator Gamma", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

type Point = { x: number; y: number };

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isGamePlaying, setIsGamePlaying] = useState(false);
  
  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Ensure food doesn't spawn on the snake
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsGamePlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGamePlaying) return;
      
      // Prevent default scrolling for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGamePlaying]);

  useEffect(() => {
    if (!isGamePlaying || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGamePlaying(false);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGamePlaying(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return newSnake;
      });
    };

    // Speed increases slightly as score goes up
    const currentSpeed = Math.max(50, BASE_SPEED - Math.floor(score / 50) * 10);
    const gameLoop = setInterval(moveSnake, currentSpeed);

    return () => clearInterval(gameLoop);
  }, [direction, food, gameOver, isGamePlaying, score, generateFood]);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col items-center justify-center p-4 selection:bg-fuchsia-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(20,0,40,1)_0%,_rgba(0,0,0,1)_100%)] -z-10" />
      
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-400 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">
          Neon Synth Snake
        </h1>
        <p className="text-cyan-400/80 mt-2 font-mono text-sm tracking-widest uppercase">
          Beat the high score. Feel the rhythm.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-center lg:items-start justify-center">
        
        {/* Game Container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl flex flex-col items-center">
            
            {/* Score Display */}
            <div className="w-full flex justify-between items-center mb-4 font-mono">
              <div className="text-fuchsia-400 font-bold text-xl drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]">
                SCORE: {score.toString().padStart(4, '0')}
              </div>
              <div className="text-neutral-500 text-sm">
                WASD / ARROWS
              </div>
            </div>

            {/* Game Board */}
            <div 
              className="relative bg-neutral-950 border-2 border-neutral-800 rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden"
              style={{
                width: `${GRID_SIZE * 20}px`,
                height: `${GRID_SIZE * 20}px`,
              }}
            >
              {/* Grid Lines (Optional, subtle) */}
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Snake */}
              {snake.map((segment, index) => {
                const isHead = index === 0;
                return (
                  <div
                    key={`${segment.x}-${segment.y}-${index}`}
                    className={`absolute rounded-sm ${isHead ? 'bg-cyan-400 z-10 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-cyan-600/80 shadow-[0_0_5px_rgba(8,145,178,0.5)]'}`}
                    style={{
                      left: `${segment.x * 20}px`,
                      top: `${segment.y * 20}px`,
                      width: '18px',
                      height: '18px',
                      margin: '1px'
                    }}
                  />
                );
              })}

              {/* Food */}
              <div
                className="absolute bg-fuchsia-500 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.9)] animate-pulse"
                style={{
                  left: `${food.x * 20}px`,
                  top: `${food.y * 20}px`,
                  width: '16px',
                  height: '16px',
                  margin: '2px'
                }}
              />

              {/* Overlays */}
              {!isGamePlaying && !gameOver && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                  <button 
                    onClick={resetGame}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider rounded transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:scale-105 active:scale-95"
                  >
                    Start Game
                  </button>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                  <h2 className="text-3xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] uppercase">System Failure</h2>
                  <p className="text-neutral-300 font-mono mb-6">Final Score: {score}</p>
                  <button 
                    onClick={resetGame}
                    className="flex items-center gap-2 px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold uppercase tracking-wider rounded transition-all hover:shadow-[0_0_20px_rgba(217,70,239,0.6)] hover:scale-105 active:scale-95"
                  >
                    <RefreshCw size={18} />
                    Reboot
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Music Player */}
        <div className="w-full max-w-sm relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500 to-yellow-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-xl p-6 shadow-2xl">
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Audio Subsystem</h3>
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`w-1 rounded-full bg-fuchsia-500 transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-1'}`}
                    style={{ height: isPlaying ? `${Math.random() * 16 + 8}px` : '4px', animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>

            {/* Track Info */}
            <div className="mb-8 text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-cyan-900 to-fuchsia-900 p-1 shadow-[0_0_30px_rgba(217,70,239,0.2)]">
                <div className={`w-full h-full rounded-full bg-neutral-950 border-2 border-neutral-800 flex items-center justify-center ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                  <div className="w-6 h-6 rounded-full bg-neutral-800" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-white truncate">{currentTrack.title}</h4>
              <p className="text-sm text-cyan-400/80 font-mono truncate">{currentTrack.artist}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <button 
                onClick={prevTrack}
                className="text-neutral-400 hover:text-white transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              >
                <SkipBack size={24} />
              </button>
              
              <button 
                onClick={togglePlayPause}
                className="w-14 h-14 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-95"
              >
                {isPlaying ? <Pause size={24} className="fill-black" /> : <Play size={24} className="fill-black ml-1" />}
              </button>
              
              <button 
                onClick={nextTrack}
                className="text-neutral-400 hover:text-white transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              >
                <SkipForward size={24} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 text-neutral-400">
              <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (parseFloat(e.target.value) > 0) setIsMuted(false);
                }}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Hidden Audio Element */}
            <audio 
              ref={audioRef}
              src={currentTrack.url}
              onEnded={handleTrackEnded}
              preload="auto"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
