import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { LayoutGrid, RefreshCw, FolderSearch, Settings, Wand2, Trash2, Pencil, X, List as ListIcon, Grid as GridIcon, Zap, Search, Ban, MapPin, Upload } from 'lucide-react'
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

function EditGameDialog({ game, isOpen, onClose, onSave }: any) {
    const [name, setName] = useState(game?.extracted_name || '')
    const [path, setPath] = useState(game?.path || '')
    const [drive, setDrive] = useState(game?.external_hard_drive_name || '')

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/20">
                    <h3 className="font-semibold text-lg">Edit Game Details</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Extracted Name</label>
                        <input
                            className="w-full bg-secondary/50 border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Used for metadata lookup.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">File Path</label>
                        <input
                            className="w-full bg-secondary/50 border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Useful for manually updating or fixing paths.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">External Hard Drive</label>
                        <input
                            className="w-full bg-secondary/50 border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g. WD_BLACK 2TB"
                            value={drive}
                            onChange={(e) => setDrive(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Label your physical storage for quick finding.</p>
                    </div>

                    <button
                        onClick={() => onSave(game.id, name, path, drive)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md font-medium"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}

function ImportGameDialog({ isOpen, onClose, onImport }: any) {
    const [text, setText] = useState('')

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/20">
                    <h3 className="font-semibold text-lg">Import Games</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Paste a list of game names (one per line). These will be added as "Virtual" entries.
                    </p>
                    <textarea
                        className="w-full h-48 bg-secondary/50 border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
                        placeholder={"The Witcher 3\nCyberpunk 2077\nElden Ring"}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <button
                        onClick={() => onImport(text)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md font-medium flex items-center justify-center gap-2"
                    >
                        <Upload size={16} /> Import Games
                    </button>
                </div>
            </div>
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
    const [editingGame, setEditingGame] = useState<any>(null)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState('')

    const { data: games, isLoading } = useQuery({
        queryKey: ['games'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/games`)
            return res.data
        }
    })

    // Sort and Filter games
    const filteredGames = games?.filter((game: any) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            game.title?.toLowerCase().includes(query) ||
            game.extracted_name?.toLowerCase().includes(query) ||
            game.path?.toLowerCase().includes(query) ||
            game.external_hard_drive_name?.toLowerCase().includes(query)
        )
    })

    const sortedGames = filteredGames?.sort((a: any, b: any) => {
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

    const { mutate: ignoreGame } = useMutation({
        mutationFn: async (game: any) => {
            await axios.post(`${API_URL}/ignored-paths`, null, { params: { path: game.path } })
            await axios.delete(`${API_URL}/games/${game.id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['games'] })
        }
    })

    const { mutate: markLocal } = useMutation({
        mutationFn: async (gameId: string) => {
            await axios.put(`${API_URL}/games/${gameId}`, { status: 'local' })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['games'] })
        }
    })

    const { mutate: updateGame } = useMutation({
        mutationFn: async ({ id, name, path, drive }: { id: string, name: string, path: string, drive: string }) => {
            await axios.put(`${API_URL}/games/${id}`, {
                extracted_name: name,
                path: path,
                external_hard_drive_name: drive
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['games'] })
            setEditingGame(null)
        }
    })

    const { mutate: importGames } = useMutation({
        mutationFn: async (text: string) => {
            const names = text.split('\n').filter(n => n.trim())
            await axios.post(`${API_URL}/games/import`, names)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['games'] })
            setIsImportOpen(false)
        }
    })

    const { mutate: resolveAll, isPending: isResolvingAll } = useMutation({
        mutationFn: async () => {
            await axios.post(`${API_URL}/games/resolve-all`)
        },
        onSuccess: () => {
            alert('Bulk resolution started in background!')
        }
    })

    if (isLoading) return <div className="animate-pulse flex gap-4"><div className="w-full h-32 bg-secondary rounded-lg"></div></div>

    // Render Actions Helper
    const renderActions = (game: any) => {
        if (game.status === 'resolved') {
            return game.rating ? (
                <div className="flex items-center gap-1 text-yellow-500 text-sm mt-auto">
                    <span>★</span> <span>{Math.round(game.rating)}/100</span>
                </div>
            ) : null
        }

        return (
            <div className="mt-auto pt-2 flex gap-1 flex-wrap">
                {game.status !== 'local' && (
                    <button
                        onClick={() => resolveGame(game.id)}
                        disabled={isResolving}
                        className="flex-1 py-1.5 px-3 bg-secondary hover:bg-primary hover:text-white rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        title="Resolve Metadata"
                    >
                        <Wand2 size={14} />
                    </button>
                )}
                <button
                    onClick={() => setEditingGame(game)}
                    className="p-1.5 bg-secondary hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    title="Edit Name & Path"
                >
                    <Pencil size={14} />
                </button>
                <button
                    onClick={() => markLocal(game.id)}
                    className={cn("p-1.5 rounded-md transition-colors", game.status === 'local' ? "bg-primary text-white" : "bg-secondary hover:bg-accent hover:text-accent-foreground")}
                    title={game.status === 'local' ? "Marked as Local" : "Mark as Local Only"}
                >
                    <MapPin size={14} />
                </button>
                <button
                    onClick={() => ignoreGame(game)}
                    className="p-1.5 bg-secondary hover:bg-destructive hover:text-destructive-foreground rounded-md transition-colors"
                    title="Delete & Ignore Path"
                >
                    <Ban size={14} />
                </button>
                <button
                    onClick={() => deleteGame(game.id)}
                    className="p-1.5 bg-secondary hover:bg-destructive hover:text-destructive-foreground rounded-md transition-colors"
                    title="Remove (Allow Rescan)"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <h2 className="text-2xl font-semibold">Your Collection ({filteredGames?.length || 0})</h2>

                <div className="flex w-full md:w-auto gap-4 flex-col md:flex-row">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Search library..."
                            className="w-full bg-secondary pl-9 pr-4 py-1.5 rounded-md text-sm outline-none border border-transparent focus:border-primary/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 self-end md:self-auto">
                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-md text-sm font-medium transition-colors"
                        >
                            <Upload size={16} /> Import
                        </button>
                        <button
                            onClick={() => resolveAll()}
                            disabled={isResolvingAll}
                            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/30 border border-yellow-600/50 rounded-md text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                            <Zap size={16} />
                            {isResolvingAll ? 'Starting...' : 'Resolve All'}
                        </button>
                        <div className="flex bg-secondary/50 p-1 rounded-md">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn("p-1.5 rounded transition-all", viewMode === 'grid' ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground")}
                            >
                                <GridIcon size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-1.5 rounded transition-all", viewMode === 'list' ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground")}
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {editingGame && (
                <EditGameDialog
                    game={editingGame}
                    isOpen={true}
                    onClose={() => setEditingGame(null)}
                    onSave={(id: string, name: string, path: string, drive: string) => updateGame({ id, name, path, drive })}
                />
            )}

            {isImportOpen && (
                <ImportGameDialog
                    isOpen={true}
                    onClose={() => setIsImportOpen(false)}
                    onImport={(text: string) => importGames(text)}
                />
            )}

            <div className={cn(
                "gap-6",
                viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col space-y-2"
            )}>
                {sortedGames?.map((game: any) => (
                    viewMode === 'grid' ? (
                        // GRID CARD
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
                                    <p className="text-xs text-gray-300 shadow-black drop-shadow-sm flex items-center gap-1">
                                        {game.status.toUpperCase()}
                                        {game.external_hard_drive_name && <span className="px-1 bg-primary/40 rounded border border-primary/50 text-[10px]">💽 {game.external_hard_drive_name}</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 space-y-3 flex-1 flex flex-col">
                                <div className="text-xs font-mono text-muted-foreground truncate" title={game.path}>{game.path}</div>
                                {renderActions(game)}
                            </div>
                        </div>
                    ) : (
                        // LIST ROW
                        <div key={game.id} className="flex items-center gap-4 bg-card border border-border p-3 rounded-lg hover:border-primary/50 transition-all">
                            <div className="w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {game.cover_url ? (
                                    <img src={game.cover_url} alt={game.title} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl">🎮</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm truncate">{game.title || game.extracted_name}</h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-mono">{game.status.toUpperCase()}</span>
                                    <span>•</span>
                                    <span className="truncate">{game.path}</span>
                                    {game.external_hard_drive_name && <span className="px-1.5 py-0.5 bg-primary/20 text-primary-foreground rounded border border-primary/30 flex items-center gap-1">💽 {game.external_hard_drive_name}</span>}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {renderActions(game)}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    )
}

function ScannerView() {
    const queryClient = useQueryClient()
    const [path, setPath] = useState('')
    const { mutate: addPath, isPending: isAdding } = useMutation({
        mutationFn: async (newPath: string) => {
            await axios.post(`${API_URL}/scan-paths`, null, { params: { path: newPath } })
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scan-paths'] })
    })

    const { mutate: startScan, isPending: isScanning } = useMutation({
        mutationFn: async () => await axios.post(`${API_URL}/scan/start`),
        onSuccess: () => alert('Scan started in background!')
    })

    const { data: paths, isLoading } = useQuery({
        queryKey: ['scan-paths'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/scan-paths`)
            console.log('Fetched paths:', res.data)
            return res.data
        }
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
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && path) {
                                addPath(path)
                                setPath('')
                            }
                        }}
                    />
                    <button
                        onClick={() => { if (path) addPath(path); setPath('') }}
                        disabled={isAdding}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                    >
                        {isAdding ? 'Adding...' : 'Add Path'}
                    </button>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Monitored Directories</h3>
                    {isLoading && <div className="text-sm text-muted-foreground animate-pulse">Loading paths...</div>}
                    {!isLoading && paths?.length === 0 && (
                        <div className="text-sm text-muted-foreground italic">No paths configured yet.</div>
                    )}
                    {paths?.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 bg-secondary/30 p-2 rounded text-sm font-mono animate-in fade-in slide-in-from-top-1">
                            <FolderSearch size={14} />
                            {p.path}
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-border">
                    <button
                        onClick={() => startScan()}
                        disabled={isScanning}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={isScanning ? "animate-spin" : ""} />
                        {isScanning ? 'Starting...' : 'Start Full Scan'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default App
