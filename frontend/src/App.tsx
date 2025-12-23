import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { LayoutGrid, RefreshCw, FolderSearch, Settings, Wand2, Trash2 } from 'lucide-react'
import { cn } from './lib/utils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
    const [activeTab, setActiveTab] = useState<'library' | 'scanner' | 'settings'>('library')

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="border-b border-border p-4 flex items-center justify-between bg-card/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">C</div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">Video Game Codex</h1>
                </div>
                <nav className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
                    <TabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<LayoutGrid size={18} />} label="Library" />
                    <TabButton active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} icon={<FolderSearch size={18} />} label="Scanner" />
                    <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="Settings" />
                </nav>
            </header>

            {/* Content */}
            <main className="flex-1 p-6 container mx-auto">
                {activeTab === 'library' && <LibraryView />}
                {activeTab === 'scanner' && <ScannerView />}
                {activeTab === 'settings' && <div className="text-muted-foreground p-10 text-center">Settings - Coming Soon</div>}
            </main>
        </div>
    )
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                active ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
            )}
        >
            {icon}
            {label}
        </button>
    )
}

function LibraryView() {
    const queryClient = useQueryClient()
    const { data: games, isLoading } = useQuery({
        queryKey: ['games'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/games`)
            return res.data
        }
    })

    // Sort games: Resolved first, then by name
    const sortedGames = games?.sort((a: any, b: any) => {
        if (a.status === 'resolved' && b.status !== 'resolved') return -1
        if (a.status !== 'resolved' && b.status === 'resolved') return 1
        return a.extracted_name.localeCompare(b.extracted_name)
    })

    const { mutate: resolveGame, isPending: isResolving } = useMutation({
        mutationFn: async (gameId: string) => {
            await axios.post(`${API_URL}/games/${gameId}/resolve`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['games'] })
        }
    })

    const { mutate: deleteGame } = useMutation({
        mutationFn: async (gameId: string) => {
            await axios.delete(`${API_URL}/games/${gameId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['games'] })
        }
    })

    if (isLoading) return <div className="animate-pulse flex gap-4"><div className="w-full h-32 bg-secondary rounded-lg"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Your Collection ({games?.length || 0})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedGames?.map((game: any) => (
                    <div key={game.id} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-[0_0_30px_-10px_rgba(124,58,237,0.3)] flex flex-col h-full">
                        <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground relative overflow-hidden">
                            {game.cover_url ? (
                                <img src={game.cover_url} alt={game.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                    <span className="text-4xl">🎮</span>
                                </>
                            )}

                            <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                                <h3 className="font-bold text-lg leading-tight text-white drop-shadow-md">
                                    {game.title || game.extracted_name}
                                </h3>
                                <p className="text-xs text-gray-300 shadow-black drop-shadow-sm">{game.status.toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-3 flex-1 flex flex-col">
                            <div className="text-xs font-mono text-muted-foreground truncate" title={game.path}>{game.path}</div>
                            {game.status !== 'resolved' && (
                                <div className="mt-auto pt-2 flex gap-2">
                                    <button
                                        onClick={() => resolveGame(game.id)}
                                        disabled={isResolving}
                                        className="flex-1 py-1.5 px-3 bg-secondary hover:bg-primary hover:text-white rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        <Wand2 size={14} />
                                        {isResolving ? 'Resolving...' : 'Auto-Resolve Metadata'}
                                    </button>
                                    <button
                                        onClick={() => deleteGame(game.id)}
                                        className="p-1.5 bg-secondary hover:bg-destructive hover:text-destructive-foreground rounded-md transition-colors"
                                        title="Ignore/Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                            {game.status === 'resolved' && game.rating && (
                                <div className="flex items-center gap-1 text-yellow-500 text-sm mt-auto">
                                    <span>★</span> <span>{Math.round(game.rating)}/100</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ScannerView() {
    const queryClient = useQueryClient()
    const [path, setPath] = useState('')
    const { mutate: addPath } = useMutation({
        mutationFn: async (newPath: string) => {
            await axios.post(`${API_URL}/scan-paths`, null, { params: { path: newPath } })
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scan-paths'] })
    })

    const { mutate: startScan } = useMutation({
        mutationFn: async () => await axios.post(`${API_URL}/scan/start`),
        onSuccess: () => alert('Scan started in background!')
    })

    const { data: paths } = useQuery({
        queryKey: ['scan-paths'],
        queryFn: async () => (await axios.get(`${API_URL}/scan-paths`)).data
    })

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-card border border-border p-6 rounded-xl space-y-4">
                <h2 className="text-xl font-semibold">Configure & Scan</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="/mnt/d/Games"
                        className="flex-1 bg-secondary border-transparent focus:border-primary rounded-md px-4 py-2 outline-none transition-all"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                    />
                    <button
                        onClick={() => { if (path) addPath(path); setPath('') }}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium"
                    >
                        Add Path
                    </button>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Monitored Directories</h3>
                    {paths?.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 bg-secondary/30 p-2 rounded text-sm font-mono">
                            <FolderSearch size={14} />
                            {p.path}
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-border">
                    <button
                        onClick={() => startScan()}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Start Full Scan
                    </button>
                </div>
            </div>
        </div>
    )
}

export default App
