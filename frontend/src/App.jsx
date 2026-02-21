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
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
    <div className="max-w-4xl">
      <Brain className="text-indigo-600 mb-8 mx-auto animate-pulse" size={90}/>
      <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
        The Charming Programmer <br/><span className="text-indigo-600">Tutoring Platform</span>
      </h1>
      <div className="text-slate-500 mb-12 max-w-2xl mx-auto space-y-2 text-left bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <p className="text-xl font-bold text-slate-800 text-center">My Name is Benjamin and I am The Charming Programmer.</p>
        <p className="text-lg font-medium text-center">I guide you from zero to coding your first program.</p>
      </div>
      <button onClick={()=>setView('login')} className="bg-indigo-600 text-white px-16 py-6 rounded-full font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">START LEARNING</button>
    </div>
    <div className="mt-32 text-[12px] text-slate-400 font-bold uppercase tracking-[0.4em]">© BENJAMIN CHAAMBWA 2025</div>
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
        <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
            <div className="p-2 bg-[#2d2d2d] flex justify-between items-center border-b border-black shrink-0 relative z-20">
                <select className="bg-slate-700 text-white px-3 py-1 rounded-lg text-xs outline-none border-none font-bold" value={lang} onChange={e=>setLang(e.target.value)}><option value="cpp">C++</option><option value="java">JAVA</option><option value="python">PYTHON</option></select>
                <button onClick={run} disabled={loading} className="bg-green-600 text-white px-10 py-1.5 rounded-lg text-[10px] font-black active:scale-95 transition-all hover:bg-green-500 shadow-lg">{loading ? '...' : 'RUN'}</button>
            </div>
            <div className="flex-1 min-h-0"><Editor height="100%" theme="vs-dark" language={lang} value={code} onChange={setCode} options={{fontSize:15, minimap:{enabled:false}, automaticLayout: true}} /></div>
            <div className="h-1/3 bg-black flex flex-col md:flex-row border-t border-slate-800 shrink-0 overflow-auto font-sans">
                <textarea className="flex-1 bg-black text-slate-400 p-4 text-xs font-mono outline-none resize-none border-r border-slate-800" placeholder="Input..." value={input} onChange={e=>setInput(e.target.value)} />
                <div className="flex-1 bg-black text-green-500 p-4 text-xs font-mono overflow-auto uppercase"><span className="text-indigo-400 font-bold">Charming platform$ </span><pre className="inline font-medium lowercase tracking-normal">{output}</pre></div>
            </div>
        </div>
    );
};

const Classroom = ({ courseId, onExit, user }) => {
    const [course, setCourse] = useState(null);
    const [activeItem, setActiveItem] = useState(null);
    const [tab, setTab] = useState('video');
    const [sidebar, setSidebar] = useState(true);
    const [progress, setProgress] = useState(0);

    const load = () => axios.get(API + '/courses/' + courseId).then(res => { setCourse(res.data); if(res.data.videos?.length && !activeItem) setActiveItem(res.data.videos[0]); });
    useEffect(() => { load(); }, [courseId]);

    if(!course) return <div className="min-h-screen bg-black flex items-center justify-center font-black uppercase text-indigo-500 animate-pulse text-xs italic tracking-widest text-center">Establishing integrity...</div>;
    const isSub = user.role === 'manager' || user.subscription_status === 'active';

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans text-left">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-50 shrink-0">
                <div className="flex items-center gap-4"><button onClick={onExit}><ArrowLeft/></button><span className="font-bold text-xs uppercase truncate max-w-[120px]">{course.title}</span></div>
                <div className="flex gap-2">
                    <button onClick={()=>setTab('video')} className={"px-4 py-1.5 rounded-full text-[10px] font-black transition " + (tab==='video'?'bg-indigo-600 text-white':'text-slate-500')}>LEARN</button>
                    {(course.ide_enabled == 1 || user.role === 'manager') && <button onClick={()=>setTab('ide')} className={"px-4 py-1.5 rounded-full text-[10px] font-black transition " + (tab==='ide'?'bg-indigo-600 text-white':'text-slate-500')}>IDE</button>}
                    <button onClick={()=>setSidebar(!sidebar)} className="ml-1 p-1 bg-slate-800 rounded">{sidebar ? <ChevronRight size={16}/> : <Menu size={16}/>}</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 bg-black flex items-center justify-center overflow-hidden p-2 md:p-8">
                        <div className="w-full h-full max-w-6xl bg-slate-900 rounded-3xl overflow-hidden border border-slate-800/50 shadow-2xl relative">
                             {tab === 'ide' ? <CloudIDE defaultLang={course.default_lang} starterCode={course.starter_code}/> : 
                              activeItem?.filename === 'YouTube' ? <iframe className="w-full h-full border-0" src={"https://www.youtube.com/embed/" + getYouTubeID(activeItem.path)} allowFullScreen /> :
                              <video key={activeItem?.path} src={activeItem?.path} className="w-full h-full object-contain" controls />}
                        </div>
                </div>

                <div className={"fixed inset-y-0 right-0 w-80 bg-slate-950 border-l border-slate-800 flex flex-col transition-transform duration-300 z-40 " + (sidebar ? "translate-x-0" : "translate-x-full")}>
                    {user.role === 'manager' && (
                        <div className="p-4 bg-indigo-950/40 border-b border-indigo-900 shrink-0">
                            {tab === 'video' ? (
                                <div className="flex gap-2">
                                    <button onClick={async ()=>{const t=prompt("Title:"); const u=prompt("YouTube URL:"); if(t&&u){await axios.post(API + '/videos/link',{courseId,title:t,url:u});load();}}} className="flex-1 bg-indigo-600 text-white py-2 rounded text-[10px] font-black uppercase tracking-tighter">ADD LINK</button>
                                    <label className="flex-1 bg-slate-800 py-2 rounded text-[10px] font-black text-center cursor-pointer uppercase tracking-tighter text-center">UPLOAD <input type="file" hidden onChange={async (e)=>{if(!e.target.files[0]) return; const fd=new FormData(); fd.append('file', e.target.files[0]); fd.append('courseId', courseId); fd.append('title', e.target.files[0].name); setProgress(1); await axios.post(API + '/upload', fd, {onUploadProgress: (p)=>setProgress(Math.round((p.loaded*100)/p.total))}); setTimeout(()=>setProgress(0),1000); load();}}/></label>
                                </div>
                            ) : (
                                <button onClick={async ()=>{const l=prompt("Language:", course.default_lang); const e=confirm("Enable IDE for Students?"); const s=prompt("Starter Code:", course.starter_code); if(l) {await axios.put(API+'/courses/'+courseId, {title:course.title, description:course.description, default_lang:l, ide_enabled:e, starter_code:s}); load();}}} className="w-full bg-indigo-600 text-white py-2 rounded text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg tracking-tighter"><Settings2 size={12}/> CONFIGURE IDE</button>
                            )}
                            {progress > 0 && <div className="mt-3 bg-slate-800 h-1 rounded-full overflow-hidden text-center"><div className="bg-green-500 h-full transition-all" style={{width: progress + "%"}}></div></div>}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 italic text-left">Curriculum</div>
                        {course.videos?.map((v, i) => (
                            <div key={v.id} onClick={() => { if(!isSub && i > 0) alert("Benjamin says: Premium Content Required!"); else { setActiveItem(v); if(window.innerWidth < 768) setSidebar(false); } }} className={"p-5 border-b border-slate-800/50 group cursor-pointer text-left " + (activeItem?.id === v.id ? 'bg-indigo-900/10' : 'hover:bg-slate-800/50')}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {(!isSub && i > 0) ? <Lock size={16} className="text-slate-700"/> : <Play size={16} className={activeItem?.id===v.id?'text-indigo-400':'text-slate-600'}/>}
                                        <span className={"text-xs " + (activeItem?.id === v.id ? 'text-white font-bold' : 'text-slate-400')}>{v.title}</span>
                                    </div>
                                    {user.role === 'manager' && (
                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button onClick={async (e)=>{e.stopPropagation(); await axios.put(API + '/videos/reorder',{videoId:v.id,direction:'up'});load();}}><ArrowUp size={14}/></button>
                                            <button onClick={async (e)=>{e.stopPropagation(); await axios.put(API + '/videos/reorder',{videoId:v.id,direction:'down'});load();}}><ArrowDown size={14}/></button>
                                            <button onClick={async (e)=>{e.stopPropagation(); const t=prompt("New name:",v.title); if(t){await axios.put(API + '/videos/' + v.id,{title:t});load();}}}><Edit size={14}/></button>
                                            <button onClick={async (e)=>{e.stopPropagation(); if(confirm("Delete?")){await axios.delete(API + '/videos/' + v.id);load();}}} className="text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="p-2 bg-slate-900 border-t border-slate-800 flex justify-center items-center shrink-0 font-bold text-center"><span className="text-[9px] text-slate-600 uppercase tracking-[0.4em]">THE CHARMING PROGRAMMER | SPECTRE V0</span></div>
        </div>
    );
};

const Dashboard = ({ user, logout, onJoinCourse, setView }) => {
    const [courses, setCourses] = useState([]); const [activeTab, setActiveTab] = useState('platforms'); const [users, setUsers] = useState([]);
    const load = () => { axios.get(API + '/courses').then(res => setCourses(res.data)); if(user.role==='manager') axios.get(API + '/users').then(res => setUsers(res.data)); };
    useEffect(() => { load(); }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-left">
            <nav className="p-6 bg-white border-b flex justify-between items-center sticky top-0 z-10 shrink-0 shadow-sm text-left">
                <div className="font-bold text-indigo-700 flex items-center gap-2 text-2xl tracking-tighter">Hi, {user.name}</div>
                <div className="flex gap-4 items-center text-left">
                    {user?.role==='manager' && (
                        <div className="flex bg-slate-100 p-1 rounded-full uppercase">
                            <button onClick={()=>setActiveTab('platforms')} className={"px-4 py-1.5 rounded-full text-[10px] font-black transition " + (activeTab==='platforms'?'bg-white shadow-sm text-indigo-600':'text-slate-400')}>PLATFORMS</button>
                            <button onClick={()=>setActiveTab('students')} className={"px-4 py-1.5 rounded-full text-[10px] font-black transition " + (activeTab==='students'?'bg-white shadow-sm text-indigo-600':'text-slate-400')}>STUDENTS</button>
                        </div>
                    )}
                    <button onClick={logout} className="p-2.5 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"><LogOut size={24}/></button>
                </div>
            </nav>
            <div className="p-8 md:p-16 max-w-6xl mx-auto flex-1 w-full text-left">
                {activeTab === 'platforms' ? (
                    <>
                        <h2 className="text-4xl font-black mb-12 text-slate-900 tracking-tight uppercase tracking-tighter text-left">Platforms</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
                            {courses.map(c=>(
                                <div key={c.id} onClick={()=>onJoinCourse(c.id)} className="group relative bg-white border border-slate-200 p-10 rounded-[3.5rem] cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-2 text-left">
                                    <MonitorPlay className="text-indigo-600 mb-8 group-hover:scale-110 transition-transform" size={48}/><h3 className="font-black text-2xl tracking-tight text-slate-900 uppercase leading-tight">{c.title}</h3>
                                    <p className="text-slate-400 text-[11px] mt-2 font-black uppercase tracking-widest italic">{c.description || "Active"}</p>
                                    {user.role === 'manager' && (
                                        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all text-left">
                                            <button onClick={(e)=>{e.stopPropagation(); const t=prompt("Name:",c.title); const d=prompt("Desc:",c.description); if(t) axios.put(API + "/courses/" + c.id,{title:t, description:d, default_lang: c.default_lang, ide_enabled: true, starter_code: c.starter_code}).then(()=>load())}} className="p-2 bg-slate-50 rounded-full hover:text-indigo-600"><Edit size={16}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); if(confirm("Destroy?")) axios.delete(API + "/courses/" + c.id).then(()=>load())}} className="p-2 bg-slate-50 rounded-full text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {user?.role==='manager' && (<div className="border-4 border-dashed border-slate-200 rounded-[3.5rem] flex items-center justify-center h-48 text-slate-300 hover:text-indigo-600 transition-all cursor-pointer" onClick={async ()=>{const t=prompt("Name:"); if(t){await axios.post(API + '/courses',{title:t});load();}}}><Plus size={48}/></div>)}
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-black mb-8 tracking-tighter uppercase leading-none text-left">Student Roster</h2>
                        <div className="space-y-4">
                            {users.map(u => (
                                <div key={u.id} className="p-6 border border-slate-50 rounded-3xl flex justify-between items-center text-left hover:bg-slate-50 transition-colors">
                                    <div><p className="font-black text-slate-900 text-lg">{u.name}</p><p className="text-sm text-slate-400 font-bold uppercase leading-none tracking-tighter">{u.email} • {u.phone}</p></div>
                                    <div className="flex gap-2">
                                        <button onClick={async ()=>{await axios.post(API + '/users/' + u.id + '/approve');load();}} className={"px-8 py-3 rounded-2xl text-xs font-black tracking-widest transition-all " + (u.subscription_status==='active'?'bg-slate-50 text-slate-300 cursor-not-allowed':'bg-green-50 text-green-600')}>APPROVE</button>
                                        <button onClick={async ()=>{await axios.post(API + '/users/' + u.id + '/revoke');load();}} className={"px-8 py-3 rounded-2xl text-xs font-black tracking-widest transition-all " + (u.subscription_status==='inactive'?'bg-slate-50 text-slate-300 cursor-not-allowed':'bg-red-50 text-red-600')}>REVOKE</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="p-10 text-center text-[11px] text-slate-400 border-t bg-white uppercase tracking-[0.5em] font-black italic text-center">© BENJAMIN CHAAMBWA 2025 | Version 0</div>
        </div>
    );
};

export default function App() {
    const [view, setView] = useState('landing'); const [user, setUser] = useState(null); const [activeId, setActiveId] = useState(null);
    const [auth, setAuth] = useState({ email: '', password: '', name: '', phone: '', isLogin: true });
    useEffect(() => { const t = localStorage.getItem('token'); if (t) { axios.defaults.headers.common['Authorization'] = 'Bearer ' + t; axios.get(API + '/auth/me').then(res => { setUser(res.data); setView('dashboard'); }).catch(()=>{localStorage.clear(); setView('landing');}); } }, []);
    const handleAuth = async (e) => { e.preventDefault(); try { const res = await axios.post(API + '/auth/login', auth); localStorage.setItem('token', res.data.token); axios.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.token; setUser(res.data.user); setView('dashboard'); } catch (err) { alert("Access Denied"); } };
    if (view === 'classroom') return <Classroom courseId={activeId} user={user} onExit={()=>setView('dashboard')} />;
    if (view === 'dashboard') return <Dashboard user={user} logout={()=>{localStorage.clear(); setView('landing'); window.location.reload();}} setView={setView} onJoinCourse={(id)=>{setActiveId(id); setView('classroom')}} />;
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans text-left text-left">
            {view === 'landing' ? <LandingPage setView={setView}/> : (
                <form onSubmit={handleAuth} className="bg-white p-12 rounded-[4.5rem] shadow-2xl w-full max-w-sm border border-slate-100 animate-in zoom-in-95 duration-500">
                    <h2 className="text-3xl font-black mb-10 text-center tracking-tighter uppercase">Welcome back.</h2>
                    <input className="w-full p-6 bg-slate-50 rounded-[2rem] mb-4 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" placeholder="Email Address" onChange={e=>setAuth({...auth, email:e.target.value})}/>
                    <input className="w-full p-6 bg-slate-50 rounded-[2rem] mb-10 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold" type="password" placeholder="Password" onChange={e=>setAuth({...auth, password:e.target.value})}/>
                    <button className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest active:scale-95">CONTINUE</button>
                    <p className="mt-10 text-center text-[10px] text-indigo-600 cursor-pointer font-black tracking-widest uppercase" onClick={()=>setAuth({...auth, isLogin:!auth.isLogin})}>{auth.isLogin?'Create Account':'Existing Member'}</p>
                </form>
            )}
        </div>
    );
}
