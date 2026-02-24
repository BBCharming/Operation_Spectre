import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { 
    Video, LogOut, Upload, Play, MonitorPlay, Trash2, Brain, 
    ArrowLeft, Menu, X, Plus, Link as LinkIcon, Lock, Settings2,
    ChevronRight, Edit, ArrowUp, ArrowDown, Terminal, User
} from 'lucide-react';

const API = '/api';
const getYouTubeID = (url) => { if(!url) return null; try { const r = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/; const m = url.match(r); return (m && m[2].length === 11) ? m[2] : null; } catch(e) { return null; } };

const LandingPage = ({ setView }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
    <div className="max-w-4xl">
      <Brain className="text-indigo-600 mb-8 mx-auto animate-pulse" size={90}/>
      <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">The Charming Programmer <br/><span className="text-indigo-600">Tutoring Platform</span></h1>
      <p className="text-slate-500 mb-12 text-2xl font-bold">Master The Code, Charm The Future.</p>
      <button onClick={()=>setView('login')} className="bg-indigo-600 text-white px-16 py-6 rounded-full font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all">START LEARNING</button>
    </div>
  </div>
);

const LockedModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
        <div className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl border border-slate-50 relative text-left text-slate-900">
            <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-indigo-600"><X/></button>
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><Lock size={40}/></div>
            <h2 className="text-2xl font-black mb-4 text-center">Unlock Premium Access</h2>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <p className="text-xs font-bold">Benjamin Chaambwa - The Charming Programmer.</p>
                <p className="text-xs font-bold text-slate-700">Premium Access: <span className="text-indigo-600 font-bold">K30 / Month</span>.</p>
                <div className="pt-2 space-y-1 text-center border-t border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">Payment (MoMo)</p>
                    <p className="text-xs font-bold text-indigo-600">+260 771005013 (Benjamin Chaambwa)</p>
                </div>
            </div>
            <button onClick={onClose} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg mt-8 active:scale-95">I Understand</button>
        </div>
    </div>
);

const CloudIDE = ({ defaultLang, starterCode }) => {
    const [code, setCode] = useState(starterCode || '// IDE Ready');
    const [lang, setLang] = useState(defaultLang || 'cpp');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    useEffect(() => { setLang(defaultLang || 'cpp'); setCode(starterCode || '// IDE Ready'); }, [defaultLang, starterCode]);
    const run = async () => {
        setLoading(true); setOutput('Processing...');
        try { const res = await axios.post(API + '/compile', { language: lang, code, input }); setOutput(res.data.output); } 
        catch (e) { setOutput('Error.'); }
        finally { setLoading(false); }
    };
    return (
        <div className="h-full w-full flex flex-col bg-[#1e1e1e] overflow-hidden text-left">
            <div className="p-2 bg-[#2d2d2d] flex justify-between items-center border-b border-black">
                <select className="bg-slate-700 text-white px-2 py-1 rounded-lg text-xs outline-none font-bold" value={lang} onChange={e=>setLang(e.target.value)}><option value="cpp">C++</option><option value="java">JAVA</option><option value="python">PYTHON</option></select>
                <button onClick={run} disabled={loading} className="bg-green-600 text-white px-8 py-1.5 rounded-lg text-[10px] font-black active:scale-95 transition-all">{loading ? '...' : 'RUN'}</button>
            </div>
            <div className="flex-1 min-h-0"><Editor height="100%" theme="vs-dark" language={lang} value={code} onChange={setCode} options={{fontSize:14, minimap:{enabled:false}, automaticLayout: true, wordWrap: 'on'}} /></div>
            <div className="h-1/3 bg-black flex flex-col border-t border-slate-800 p-2 font-mono text-xs overflow-auto">
                <textarea className="flex-1 bg-black text-slate-400 outline-none resize-none mb-1" placeholder="Input..." value={input} onChange={e=>setInput(e.target.value)} />
                <div className="flex-1 text-green-500 overflow-auto"><span className="text-indigo-400 font-bold">Charming platform$ </span>{output}</div>
            </div>
        </div>
    );
};

const Classroom = ({ courseId, onExit, user }) => {
    const [course, setCourse] = useState(null);
    const [activeItem, setActiveItem] = useState(null);
    const [tab, setTab] = useState('video');
    const [sidebar, setSidebar] = useState(true);
    const [showLock, setShowLock] = useState(false);

    const load = async () => { const res = await axios.get(API + '/courses/' + courseId); setCourse(res.data); if(res.data.videos?.length && !activeItem) setActiveItem(res.data.videos[0]); };
    useEffect(() => { load(); }, [courseId]);

    if(!course) return <div className="min-h-screen bg-black flex items-center justify-center font-black uppercase text-indigo-500 animate-pulse text-xs italic tracking-widest text-center">Establishing Integrity...</div>;

    const isSub = user.role === 'manager' || user.subscription_status === 'active';

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans text-left">
            {showLock && <LockedModal onClose={()=>setShowLock(false)} />}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-50 shrink-0">
                <div className="flex items-center gap-4"><button onClick={onExit}><ArrowLeft/></button><span className="font-bold text-xs uppercase truncate max-w-[120px]">{course.title}</span></div>
                <div className="flex gap-2">
                    <button onClick={()=>setTab('video')} className={"px-4 py-1.5 rounded-full text-[10px] font-black transition " + (tab==='video'?'bg-indigo-600 text-white':'text-slate-500')}>LEARN</button>
                    {isSub && <button onClick={()=>setTab('ide')} className={"px-4 py-1.5 rounded-full text-[10px] font-black transition " + (tab==='ide'?'bg-indigo-600 text-white':'text-slate-500')}>IDE</button>}
                    <button onClick={()=>setSidebar(!sidebar)} className="ml-1 p-1 bg-slate-800 rounded">{sidebar ? <ChevronRight size={16}/> : <Menu size={16}/>}</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 bg-black flex items-center justify-center overflow-hidden p-0 md:p-6">
                     {tab === 'ide' ? <CloudIDE defaultLang={course.default_lang} starterCode={course.starter_code}/> : 
                      activeItem?.filename === 'YouTube' ? <iframe className="w-full h-full max-w-6xl rounded-2xl" src={"https://www.youtube.com/embed/" + getYouTubeID(activeItem.path)} allowFullScreen /> :
                      <video key={activeItem?.path} src={activeItem?.path} className="w-full h-full max-w-6xl object-contain" controls />}
                </div>

                <div className={"fixed inset-y-0 right-0 w-80 bg-slate-950 border-l border-slate-800 flex flex-col transition-transform duration-300 z-40 " + (sidebar ? "translate-x-0" : "translate-x-full")}>
                    <div className="flex-1 overflow-y-auto mt-16">
                        <div className="p-5 text-[10px] font-black text-slate-500 uppercase italic">Curriculum</div>
                        {course.videos?.map((v, i) => (
                            <div key={v.id} onClick={() => { if(!isSub && i > 0) setShowLock(true); else { setActiveItem(v); if(window.innerWidth < 768) setSidebar(false); } }} className={"p-5 border-b border-slate-800/50 group cursor-pointer text-left " + (activeItem?.id === v.id ? 'bg-indigo-900/10' : '')}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {(!isSub && i > 0) ? <Lock size={16} className="text-slate-700" /> : <Play size={16} className={activeItem?.id===v.id?'text-indigo-400':'text-slate-600'}/>}
                                        <span className={"text-xs " + (activeItem?.id === v.id ? 'font-bold text-white' : 'text-slate-400')}>{v.title}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ user, logout, onJoinCourse }) => {
    const [courses, setCourses] = useState([]); const [activeTab, setActiveTab] = useState('platforms'); const [users, setUsers] = useState([]);
    const load = async () => { 
        const res = await axios.get(API + '/courses'); setCourses(res.data); 
        if(user.role==='manager') { const uRes = await axios.get(API + '/users'); setUsers(uRes.data); }
    };
    useEffect(() => { load(); }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col text-left font-sans">
            <nav className="p-6 bg-white border-b flex justify-between items-center shadow-sm sticky top-0 z-50">
                <div className="font-bold text-indigo-700 text-2xl tracking-tighter leading-none">Hi, {user.name}</div>
                <div className="flex gap-4 items-center">
                    {user?.role==='manager' && (
                        <div className="flex bg-slate-100 p-1 rounded-full uppercase text-xs font-black">
                            <button onClick={()=>setActiveTab('platforms')} className={"px-4 py-1.5 rounded-full transition " + (activeTab==='platforms'?'bg-white text-indigo-600 shadow-sm':'text-slate-400')}>PLATFORMS</button>
                            <button onClick={()=>setActiveTab('students')} className={"px-4 py-1.5 rounded-full transition " + (activeTab==='students'?'bg-white text-indigo-600 shadow-sm':'text-slate-400')}>STUDENTS</button>
                        </div>
                    )}
                    <button onClick={logout} className="p-2.5 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"><LogOut size={22}/></button>
                </div>
            </nav>
            <div className="p-6 md:p-16 max-w-7xl mx-auto flex-1 w-full">
                {activeTab === 'platforms' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {courses.map(c=>(
                            <div key={c.id} onClick={()=>onJoinCourse(c.id)} className="group relative bg-white border border-slate-200 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
                                <MonitorPlay className="text-indigo-600 mb-6 group-hover:scale-110 transition-transform" size={48}/><h3 className="font-black text-2xl text-slate-900 uppercase tracking-tight leading-tight">{c.title}</h3>
                                <p className="text-slate-400 text-xs mt-2 italic font-medium">{c.description || "Platform active"}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black mb-6 tracking-tight uppercase">Student Roster</h2>
                        {users.map(u => (
                            <div key={u.id} className="p-6 bg-white border border-slate-200 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                <div><div className="flex items-center gap-3"><p className="font-bold text-slate-900 text-lg">{u.name}</p><span className={"px-3 py-1 rounded-full text-[10px] font-black uppercase " + (u.subscription_status==='active'?'bg-green-100 text-green-700':'bg-slate-100 text-slate-500')}>Status: {u.subscription_status}</span></div><p className="text-sm text-slate-400 font-medium">{u.email} • {u.phone}</p></div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={async ()=>{await axios.post(API+'/users/'+u.id+'/approve');load();}} className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black">APPROVE</button>
                                    <button onClick={async ()=>{await axios.post(API+'/users/'+u.id+'/revoke');load();}} className="flex-1 md:flex-none px-6 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-black">REVOKE</button>
                                    <button onClick={async ()=>{if(confirm("Delete student?")){await axios.delete(API+'/users/'+u.id);load();}}} className="px-3 py-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="p-10 text-center text-[11px] text-slate-400 border-t bg-white uppercase tracking-[0.5em] font-black italic">© BENJAMIN CHAAMBWA 2025</div>
        </div>
    );
};

export default function App() {
    const [view, setView] = useState('landing'); const [user, setUser] = useState(null); const [activeId, setActiveId] = useState(null);
    const [auth, setAuth] = useState({ email: '', password: '', name: '', phone: '', isLogin: true });

    useEffect(() => {
        const t = localStorage.getItem('token');
        if (t) { axios.defaults.headers.common['Authorization'] = 'Bearer ' + t; axios.get(API + '/auth/me').then(res => { setUser(res.data); setView('dashboard'); }).catch(()=>{localStorage.clear(); setView('landing');}); }
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        try { 
            const endpoint = auth.isLogin ? '/api/auth/login' : '/api/auth/register';
            const res = await axios.post(endpoint, auth); 
            if(auth.isLogin) { localStorage.setItem('token', res.data.token); axios.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.token; setUser(res.data.user); setView('dashboard'); }
            else { alert("Account Created! Please Login."); setAuth({...auth, isLogin: true}); }
        } catch (err) { alert(err.response?.data?.error || "Access Denied"); }
    };

    if (view === 'classroom') return <Classroom courseId={activeId} user={user} onExit={()=>setView('dashboard')} />;
    if (view === 'dashboard') return <Dashboard user={user} logout={()=>{localStorage.clear(); setView('landing'); window.location.reload();}} onJoinCourse={(id)=>{setActiveId(id); setView('classroom')}} />;
    
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-left">
            {view === 'landing' ? <LandingPage setView={setView}/> : (
                <form onSubmit={handleAuth} className="bg-white p-10 md:p-12 rounded-[3.5rem] md:rounded-[4rem] shadow-2xl w-full max-w-sm border border-slate-100 animate-in zoom-in-95 duration-500">
                    <h2 className="text-3xl font-black mb-10 text-center text-slate-900 uppercase">Welcome</h2>
                    {!auth.isLogin && <input className="w-full p-6 bg-slate-50 rounded-[2rem] mb-4 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" placeholder="Full Name" onChange={e=>setAuth({...auth, name:e.target.value})} required/>}
                    <input className="w-full p-6 bg-slate-50 rounded-[2rem] mb-4 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" type="email" placeholder="Email Address" onChange={e=>setAuth({...auth, email:e.target.value})} required/>
                    {!auth.isLogin && <input className="w-full p-6 bg-slate-50 rounded-[2rem] mb-4 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" placeholder="Phone Number" onChange={e=>setAuth({...auth, phone:e.target.value})} required/>}
                    <input className="w-full p-6 bg-slate-50 rounded-[2rem] mb-10 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" type="password" placeholder="Password" onChange={e=>setAuth({...auth, password:e.target.value})} required/>
                    <button className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">Continue</button>
                    <p className="mt-10 text-center text-[10px] text-indigo-600 cursor-pointer font-black uppercase tracking-widest" onClick={()=>setAuth({...auth, isLogin:!auth.isLogin})}>{auth.isLogin?'Create Account':'Existing Member'}</p>
                </form>
            )}
        </div>
    );
}
