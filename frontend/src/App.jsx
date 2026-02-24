import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { 
    Video, LogOut, Upload, Play, MonitorPlay, Trash2, Brain, 
    ArrowLeft, Menu, X, Plus, Link as LinkIcon, Lock, Settings2,
    ChevronRight, Edit, ArrowUp, ArrowDown, Terminal, User, Trash
} from 'lucide-react';

const API = '/api';
const getYouTubeID = (url) => { if(!url) return null; try { const r = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/; const m = url.match(r); return (m && m[2].length === 11) ? m[2] : null; } catch(e) { return null; } };

const LandingPage = ({ setView }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
    <div className="max-w-4xl">
      <Brain className="text-indigo-600 mb-8 mx-auto animate-pulse" size={90}/>
      <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">The Charming Programmer <br/><span className="text-indigo-600">Tutoring Platform</span></h1>
      <p className="text-slate-500 mb-12 text-2xl font-bold">Master The Code, Charm The Future.</p>
      <button onClick={()=>setView('login')} className="bg-indigo-600 text-white px-16 py-6 rounded-full font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all">START LEARNING</button>
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
        <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden text-left">
            <div className="p-2 bg-[#2d2d2d] flex justify-between items-center border-b border-black">
                <select className="bg-slate-700 text-white px-3 py-1 rounded-lg text-xs outline-none" value={lang} onChange={e=>setLang(e.target.value)}><option value="cpp">C++</option><option value="java">JAVA</option><option value="python">PYTHON</option></select>
                <button onClick={run} disabled={loading} className="bg-green-600 text-white px-10 py-1.5 rounded-lg text-[10px] font-black">{loading ? '...' : 'RUN'}</button>
            </div>
            <div className="flex-1 min-h-0"><Editor height="100%" theme="vs-dark" language={lang} value={code} onChange={setCode} options={{fontSize:15, minimap:{enabled:false}, automaticLayout: true}} /></div>
            <div className="h-1/3 bg-black flex flex-col border-t border-slate-800 p-4">
                <textarea className="flex-1 bg-black text-slate-400 text-xs font-mono outline-none resize-none mb-2" placeholder="Input..." value={input} onChange={e=>setInput(e.target.value)} />
                <div className="flex-1 text-green-500 text-xs font-mono overflow-auto"><span className="text-indigo-400 font-bold">Charming platform$ </span>{output}</div>
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

    const load = async () => { const res = await axios.get(API + '/courses/' + courseId); setCourse(res.data); if(res.data.videos?.length && !activeItem) setActiveItem(res.data.videos[0]); };
    useEffect(() => { load(); }, [courseId]);

    const uploadVideo = async (file) => {
        if(!file) return;
        const fd = new FormData(); fd.append('file', file); fd.append('courseId', courseId); fd.append('title', file.name);
        setProgress(1);
        await axios.post(API + '/upload', fd, { onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total)) });
        setProgress(0); load();
    };

    if(!course) return <div className="min-h-screen bg-black flex items-center justify-center font-black text-indigo-500 animate-pulse">Establishing Integrity...</div>;

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-50">
                <div className="flex items-center gap-4"><button onClick={onExit}><ArrowLeft/></button><span className="font-bold text-xs uppercase">{course.title}</span></div>
                <div className="flex gap-2">
                    <button onClick={()=>setTab('video')} className={"px-4 py-1.5 rounded-full text-[10px] font-black " + (tab==='video'?'bg-indigo-600':'text-slate-500')}>LEARN</button>
                    <button onClick={()=>setTab('ide')} className={"px-4 py-1.5 rounded-full text-[10px] font-black " + (tab==='ide'?'bg-indigo-600':'text-slate-500')}>IDE</button>
                    <button onClick={()=>setSidebar(!sidebar)} className="ml-1 p-1 bg-slate-800 rounded">{sidebar ? <ChevronRight size={16}/> : <Menu size={16}/>}</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 bg-black flex items-center justify-center p-4">
                     {tab === 'ide' ? <CloudIDE defaultLang={course.default_lang} starterCode={course.starter_code}/> : 
                      activeItem?.filename === 'YouTube' ? <iframe className="w-full h-full max-w-6xl rounded-3xl" src={"https://www.youtube.com/embed/" + getYouTubeID(activeItem.path)} allowFullScreen /> :
                      <video key={activeItem?.path} src={activeItem?.path} className="w-full h-full max-w-6xl object-contain" controls />}
                </div>

                <div className={"fixed inset-y-0 right-0 w-80 bg-slate-950 border-l border-slate-800 flex flex-col transition-transform " + (sidebar ? "translate-x-0" : "translate-x-full")}>
                    {user.role === 'manager' && (
                        <div className="p-4 bg-indigo-950/20 border-b border-indigo-900 mt-16 shadow-xl">
                            <div className="flex gap-2 mb-2">
                                <button onClick={async ()=>{const t=prompt("Title:"); const u=prompt("YouTube URL:"); if(t&&u){await axios.post(API+'/videos/link',{courseId,title:t,url:u});load();}}} className="flex-1 bg-indigo-600 py-2 rounded text-[10px] font-black">ADD LINK</button>
                                <label className="flex-1 bg-slate-800 py-2 rounded text-[10px] font-black text-center cursor-pointer">UPLOAD <input type="file" hidden onChange={(e)=>uploadVideo(e.target.files[0])}/></label>
                            </div>
                            {progress > 0 && <div className="mt-2 bg-slate-800 h-1 rounded-full"><div className="bg-green-500 h-full" style={{width: progress + "%"}}></div></div>}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-5 text-[10px] font-black text-slate-500 uppercase italic">Curriculum</div>
                        {course.videos?.map((v) => (
                            <div key={v.id} onClick={()=>setActiveItem(v)} className={"p-5 border-b border-slate-800/50 group cursor-pointer " + (activeItem?.id === v.id ? 'bg-indigo-900/10' : '')}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3"><Play size={16} className="text-slate-600"/><span className="text-xs">{v.title}</span></div>
                                    {user.role === 'manager' && (
                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={async (e)=>{e.stopPropagation(); await axios.put(API+'/videos/reorder',{videoId:v.id,direction:'up'});load();}}><ArrowUp size={14}/></button>
                                            <button onClick={async (e)=>{e.stopPropagation(); await axios.put(API+'/videos/reorder',{videoId:v.id,direction:'down'});load();}}><ArrowDown size={14}/></button>
                                            <button onClick={async (e)=>{e.stopPropagation(); const t=prompt("New name:",v.title); if(t){await axios.put(API+'/videos/'+v.id,{title:t});load();}}}><Edit size={14}/></button>
                                            <button onClick={async (e)=>{e.stopPropagation(); if(confirm("Delete?")){await axios.delete(API+'/videos/'+v.id);load();}}} className="text-red-500"><Trash size={14}/></button>
                                        </div>
                                    )}
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
            <nav className="p-6 bg-white border-b flex justify-between items-center shadow-sm">
                <div className="font-bold text-indigo-700 text-2xl tracking-tighter">Hi, {user.name}</div>
                <div className="flex gap-4">
                    {user?.role==='manager' && (
                        <div className="flex bg-slate-100 p-1 rounded-full text-xs font-black">
                            <button onClick={()=>setActiveTab('platforms')} className={"px-4 py-1.5 rounded-full " + (activeTab==='platforms'?'bg-white text-indigo-600 shadow-sm':'text-slate-400')}>PLATFORMS</button>
                            <button onClick={()=>setActiveTab('students')} className={"px-4 py-1.5 rounded-full " + (activeTab==='students'?'bg-white text-indigo-600 shadow-sm':'text-slate-400')}>STUDENTS</button>
                        </div>
                    )}
                    <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500"><LogOut/></button>
                </div>
            </nav>
            <div className="p-8 md:p-16 max-w-7xl mx-auto flex-1 w-full">
                {activeTab === 'platforms' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {courses.map(c=>(
                            <div key={c.id} onClick={()=>onJoinCourse(c.id)} className="group relative bg-white border border-slate-200 p-10 rounded-[3rem] hover:shadow-2xl transition-all cursor-pointer">
                                <MonitorPlay className="text-indigo-600 mb-6" size={48}/><h3 className="font-black text-2xl text-slate-900">{c.title}</h3>
                                <p className="text-slate-400 text-xs mt-2 italic font-medium">{c.description || "Platform active"}</p>
                                {user.role === 'manager' && (
                                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100">
                                        <button onClick={async (e)=>{e.stopPropagation(); await axios.put(API+"/courses/reorder/swap",{courseId:c.id,direction:"up"});load();}}><ArrowUp size={16}/></button>
                                        <button onClick={async (e)=>{e.stopPropagation(); await axios.put(API+"/courses/reorder/swap",{courseId:c.id,direction:"down"});load();}}><ArrowDown size={16}/></button>
                                        <button onClick={async (e)=>{e.stopPropagation(); const t=prompt("Name:",c.title); const d=prompt("Desc:",c.description); if(t){await axios.put(API+'/courses/'+c.id,{title:t,description:d});load();}}}><Edit size={16}/></button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {users.map(u => (
                            <div key={u.id} className="p-6 bg-white border border-slate-200 rounded-3xl flex justify-between items-center shadow-sm">
                                <div><p className="font-bold text-slate-900 text-lg">{u.name}</p><p className="text-sm text-slate-400 font-medium">{u.email} • {u.phone}</p></div>
                                <div className="flex gap-2">
                                    <button onClick={async ()=>{await axios.post(API+'/users/'+u.id+'/approve');load();}} className="px-6 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-black">APPROVE</button>
                                    <button onClick={async ()=>{await axios.post(API+'/users/'+u.id+'/revoke');load();}} className="px-6 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-black">REVOKE</button>
                                    <button onClick={async ()=>{if(confirm("Delete?")){await axios.delete(API+'/users/'+u.id);load();}}} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
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
        } catch (err) { alert("Access Denied"); }
    };

    if (view === 'classroom') return <Classroom courseId={activeId} user={user} onExit={()=>setView('dashboard')} />;
    if (view === 'dashboard') return <Dashboard user={user} logout={()=>{localStorage.clear(); setView('landing');}} onJoinCourse={(id)=>{setActiveId(id); setView('classroom')}} />;
    
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-left">
            {view === 'landing' ? <LandingPage setView={setView}/> : (
                <form onSubmit={handleAuth} className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-sm border border-slate-100 animate-in zoom-in-95">
                    <h2 className="text-3xl font-black mb-10 text-center text-slate-900">Welcome</h2>
                    {!auth.isLogin && <input className="w-full p-6 bg-slate-50 rounded-[2rem] mb-4 outline-none font-bold" placeholder="Full Name" onChange={e=>setAuth({...auth, name:e.target.value})} required/>}
                    <input className="w-full p-6 bg-slate-50 rounded-[2rem] mb-4 outline-none font-bold" type="email" placeholder="Email Address" onChange={e=>setAuth({...auth, email:e.target.value})} required/>
                    <input className="w-full p-6 bg-slate-50 rounded-[2rem] mb-10 outline-none font-bold" type="password" placeholder="Password" onChange={e=>setAuth({...auth, password:e.target.value})} required/>
                    <button className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-lg">Continue</button>
                    <p className="mt-10 text-center text-[10px] text-indigo-600 cursor-pointer font-black uppercase" onClick={()=>setAuth({...auth, isLogin:!auth.isLogin})}>{auth.isLogin?'Create Account':'Existing Member'}</p>
                </form>
            )}
        </div>
    );
}
